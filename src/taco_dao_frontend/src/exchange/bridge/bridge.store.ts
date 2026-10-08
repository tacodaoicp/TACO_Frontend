/**
 * ck Bridge store — deposit (mint) and withdraw (dissolve) chain-key tokens.
 *
 * Flows (interfaces verified against live mainnet candid 2026-07-23):
 *  - ckBTC mint:      get_btc_address → user sends BTC → update_balance mints after 6 conf
 *  - ckBTC dissolve:  icrc2_approve(ckBTC ledger) → retrieve_btc_with_approval → retrieve_btc_status_v2
 *  - ckETH mint:      helper contract depositEth(bytes32,bytes32) via user's ETH wallet
 *  - ckETH dissolve:  icrc2_approve(ckETH ledger) → withdraw_eth → withdrawal_status
 *  - ckERC20 mint:    ERC20 approve + helper depositErc20 via user's ETH wallet
 *  - ckERC20 dissolve: approve ckERC20 (amount) + approve ckETH (live gas quote,
 *                      NEVER a hardcoded constant) → withdraw_erc20 → withdrawal_status
 *
 * Fault tolerance: every pending operation is journaled to localStorage per
 * principal BEFORE the irreversible call fires and resumed on init. A failed
 * status poll never marks an entry failed — only explicit minter error
 * variants do.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Principal } from '@dfinity/principal'
import { Actor, HttpAgent } from '@dfinity/agent'
import { getCachedAgent, getCachedIdentity, getNetworkHost } from '../../shared/auth-cache'
import { icrcIDL } from '../../shared/icrc-idl'
import {
  ckbtcMinterIDL, ckethMinterIDL,
  CKBTC_MINTER_ID, CKBTC_LEDGER_ID, CKETH_MINTER_ID, CKETH_LEDGER_ID,
} from './minter-idl'
import { useExchangeStore } from '../store/exchange.store'
import { useExchangeToast } from '../composables/useExchangeToast'
import { cachedLedgerLogo, ledgerLogoDue, fetchLedgerLogo } from '../utils/token-icons'
import { setItemWithCacheEviction } from '../utils/persistCache'

// ── Types ──

export interface BridgeToken {
  key: string               // 'BTC' | 'ETH' | ckERC20 symbol
  symbol: string            // ck symbol, e.g. ckUSDC
  nativeSymbol: string      // e.g. USDC
  chain: 'btc' | 'eth' | 'erc20'
  ledgerId: string
  erc20Address?: string
  decimals: number
  fee: bigint               // ledger icrc1_fee, used for Max headroom
}

export type JournalKind = 'btc-mint' | 'btc-dissolve' | 'eth-mint' | 'erc20-mint' | 'eth-dissolve' | 'erc20-dissolve'
export type JournalState =
  | 'waiting-deposit'   // btc-mint: address shown, waiting for BTC
  | 'sent-eth-tx'       // eth/erc20-mint: helper contract tx sent
  | 'submitting'        // dissolve: about to call the minter (pre-write)
  | 'pending'           // dissolve accepted by minter, waiting for finalization
  | 'confirmed'         // done
  | 'reimbursed'        // minter refunded
  | 'failed'            // explicit minter error (funds not taken)

export interface JournalEntry {
  id: string
  kind: JournalKind
  state: JournalState
  createdAt: number
  updatedAt: number
  token: string             // BridgeToken.key
  amount?: string           // base units as string (bigint-safe)
  address?: string          // destination (dissolve) or deposit address (btc-mint)
  blockIndex?: string       // ckBTC burn index / ckETH withdrawal id
  txHash?: string           // eth side tx hash
  txid?: string             // btc txid (hex) once submitted
  note?: string
}

// ── Helpers ──

function journalKey(principal: string) { return `taco_bridge_journal:${principal}` }

function hexFromBytes(bytes: Uint8Array | number[]): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** Principal → bytes32 as the ck helper contracts expect:
 *  byte 0 = principal length, bytes 1..len = principal, zero-padded to 32. */
export function principalToBytes32(principalText: string): `0x${string}` {
  const raw = Principal.fromText(principalText).toUint8Array()
  const out = new Uint8Array(32)
  out[0] = raw.length
  out.set(raw, 1)
  return `0x${hexFromBytes(out)}` as `0x${string}`
}

const ZERO_SUBACCOUNT: `0x${string}` = `0x${'00'.repeat(32)}` as `0x${string}`

function isEthAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s.trim())
}

// ── Store ──

export const useBridgeStore = defineStore('bridge', () => {
  const exchangeStore = useExchangeStore()

  // token list: BTC + ETH constant, ckERC20s discovered live from the minter
  const erc20Tokens = ref<BridgeToken[]>([])
  const journal = ref<JournalEntry[]>([])
  // The principal whose journal is loaded in `journal`. Writes go to this
  // owner's key only, never to another account's key and never to ''.
  let journalOwner = ''
  // BTC deposit addresses keyed by the principal the minter call was made for.
  // The address shown is always the current account's, so an in place account
  // switch can never show (and receive BTC on) the previous account's address.
  const btcAddressByPrincipal = ref<Record<string, string>>({})
  const btcDepositAddress = computed(() => btcAddressByPrincipal.value[principalText()] || '')
  const ckbtcInfo = ref<{ minConfirmations: number; retrieveBtcMinAmount: bigint; checkFee: bigint } | null>(null)
  const ckethInfo = ref<{
    depositHelper: string
    ethHelper: string
    erc20Helper: string
    minimumWithdrawalAmount: bigint
  } | null>(null)
  const loadingInfo = ref(false)
  const infoError = ref('')

  // ledger fees for the two constant tokens (known mainnet values, re-read on init)
  const btcLedgerFee = ref(10n)
  const ethLedgerFee = ref(2_000_000_000_000n)

  const bridgeTokens = computed<BridgeToken[]>(() => [
    { key: 'BTC', symbol: 'ckBTC', nativeSymbol: 'BTC', chain: 'btc', ledgerId: CKBTC_LEDGER_ID, decimals: 8, fee: btcLedgerFee.value },
    { key: 'ETH', symbol: 'ckETH', nativeSymbol: 'ETH', chain: 'eth', ledgerId: CKETH_LEDGER_ID, decimals: 18, fee: ethLedgerFee.value },
    ...erc20Tokens.value,
  ])

  // ── Actors ──

  let _anonAgent: HttpAgent | null = null
  async function anonAgent(): Promise<HttpAgent> {
    if (_anonAgent) return _anonAgent
    _anonAgent = new HttpAgent({ host: getNetworkHost() })
    return _anonAgent
  }
  async function queryActor(canisterId: string, idl: any): Promise<any> {
    return Actor.createActor(idl, { agent: await anonAgent(), canisterId })
  }
  async function updateActor(canisterId: string, idl: any): Promise<any> {
    const identity = await getCachedIdentity()
    if (identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated. Please connect your wallet.')
    return Actor.createActor(idl, { agent: await getCachedAgent(), canisterId })
  }

  // ── Minter info (cached per session, retried on demand) ──

  async function loadMinterInfo(force = false): Promise<void> {
    if (loadingInfo.value) return
    if (!force && ckbtcInfo.value && ckethInfo.value) return
    loadingInfo.value = true
    infoError.value = ''
    try {
      const [btcMinter, ethMinter] = await Promise.all([
        queryActor(CKBTC_MINTER_ID, ckbtcMinterIDL),
        queryActor(CKETH_MINTER_ID, ckethMinterIDL),
      ])
      const [btcInfo, ethInfo] = await Promise.all([
        btcMinter.get_minter_info(),
        ethMinter.get_minter_info(),
      ])
      ckbtcInfo.value = {
        minConfirmations: Number(btcInfo.min_confirmations),
        retrieveBtcMinAmount: BigInt(btcInfo.retrieve_btc_min_amount),
        checkFee: BigInt(btcInfo.kyt_fee),
      }
      ckethInfo.value = {
        depositHelper: ethInfo.deposit_with_subaccount_helper_contract_address?.[0] ?? '',
        ethHelper: ethInfo.eth_helper_contract_address?.[0] ?? '',
        erc20Helper: ethInfo.erc20_helper_contract_address?.[0] ?? '',
        minimumWithdrawalAmount: BigInt(ethInfo.minimum_withdrawal_amount?.[0] ?? 30_000_000_000_000_000n),
      }
      // Tokens the exchange could not list (backend rejected them) stay off the bridge too.
      const EXCLUDED_CK_TOKENS = new Set(['ckWBTC', 'ckXAUT'])
      erc20Tokens.value = (ethInfo.supported_ckerc20_tokens?.[0] ?? [])
        .filter((t: any) => !EXCLUDED_CK_TOKENS.has(t.ckerc20_token_symbol))
        .map((t: any) => ({
        key: t.ckerc20_token_symbol.replace(/^ck/, ''),
        symbol: t.ckerc20_token_symbol,
        nativeSymbol: t.ckerc20_token_symbol.replace(/^ck/, ''),
        chain: 'erc20' as const,
        ledgerId: t.ledger_canister_id.toText(),
        erc20Address: t.erc20_contract_address,
        decimals: 0, // filled lazily from the ledger below
        fee: 0n,     // filled lazily from the ledger below
      }))
      // decimals + fee from each ledger (parallel, best-effort — selector and Max need them)
      await Promise.all(erc20Tokens.value.map(async (t) => {
        try {
          const ledger = await queryActor(t.ledgerId, icrcIDL)
          const [dec, fee] = await Promise.all([ledger.icrc1_decimals(), ledger.icrc1_fee()])
          t.decimals = Number(dec)
          t.fee = BigInt(fee)
        } catch { t.decimals = t.decimals || 6 } // ponytail: USDC-style default if a ledger read hiccups
      }))
      // refresh the constant tokens' fees too (best-effort; known defaults stand)
      void queryActor(CKBTC_LEDGER_ID, icrcIDL).then(l => l.icrc1_fee()).then((f: bigint) => { btcLedgerFee.value = BigInt(f) }).catch(() => {})
      void queryActor(CKETH_LEDGER_ID, icrcIDL).then(l => l.icrc1_fee()).then((f: bigint) => { ethLedgerFee.value = BigInt(f) }).catch(() => {})
    } catch (err: any) {
      infoError.value = 'Could not load bridge configuration. Check your connection and try again.'
      console.error('[Bridge] loadMinterInfo failed:', err)
    } finally {
      loadingInfo.value = false
    }
  }

  // ── Journal ──

  function principalText(): string {
    return exchangeStore.principalText || ''
  }
  /** The account an operation acts for: the identity that signs its calls. */
  async function opOwner(): Promise<string> {
    const id = await getCachedIdentity()
    return id.getPrincipal().isAnonymous() ? '' : id.getPrincipal().toText()
  }
  function readJournal(owner: string): JournalEntry[] {
    if (!owner) return []
    try {
      const raw = localStorage.getItem(journalKey(owner))
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }
  function loadJournal(): void {
    journalOwner = principalText()
    journal.value = readJournal(journalOwner)
  }
  function saveJournal(): void {
    if (!journalOwner) return
    try { setItemWithCacheEviction(journalKey(journalOwner), JSON.stringify(journal.value)) } catch { /* ignore */ }
  }
  /** Upsert into `owner`'s journal. An operation started by one account that
   *  finishes after a switch lands in that account's journal, not the new one. */
  function upsertEntry(entry: JournalEntry, owner: string = journalOwner): void {
    entry.updatedAt = Date.now()
    if (owner === journalOwner) {
      const i = journal.value.findIndex(e => e.id === entry.id)
      if (i >= 0) journal.value[i] = entry
      else journal.value.unshift(entry)
      saveJournal()
      return
    }
    if (!owner) return
    const list = readJournal(owner)
    const i = list.findIndex(e => e.id === entry.id)
    if (i >= 0) list[i] = entry
    else list.unshift(entry)
    try { setItemWithCacheEviction(journalKey(owner), JSON.stringify(list)) } catch { /* ignore */ }
  }
  function newEntry(kind: JournalKind, partial: Partial<JournalEntry>, owner: string = journalOwner): JournalEntry {
    const entry: JournalEntry = {
      id: `${kind}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      kind,
      state: 'submitting',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      token: '',
      ...partial,
    }
    upsertEntry(entry, owner)
    return entry
  }
  const pendingEntries = computed(() =>
    journal.value.filter(e => !['confirmed', 'reimbursed', 'failed'].includes(e.state)))

  // ── ckBTC: mint side ──

  async function fetchBtcDepositAddress(): Promise<string> {
    if (btcDepositAddress.value) return btcDepositAddress.value
    const identity = await getCachedIdentity()
    if (identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated. Please connect your wallet.')
    const owner = identity.getPrincipal()
    const minter = await updateActor(CKBTC_MINTER_ID, ckbtcMinterIDL)
    const addr = await minter.get_btc_address({ owner: [owner], subaccount: [] })
    // Stored under the principal the address was derived for. The view reads
    // btcDepositAddress (current account only), so a reply that lands after an
    // account switch is never shown for the new account.
    btcAddressByPrincipal.value = { ...btcAddressByPrincipal.value, [owner.toText()]: addr }
    return addr
  }

  /** "Check for BTC" — returns a human summary; mints anything confirmed. */
  async function checkBtcDeposits(): Promise<{ minted: bigint; pending: { valueSat: bigint; confirmations: number; required: number }[] }> {
    const identity = await getCachedIdentity()
    const owner = identity.getPrincipal().isAnonymous() ? '' : identity.getPrincipal().toText()
    const minter = await updateActor(CKBTC_MINTER_ID, ckbtcMinterIDL)
    const res = await minter.update_balance({ owner: [identity.getPrincipal()], subaccount: [] })
    if ('Ok' in res) {
      let minted = 0n
      for (const s of res.Ok) if ('Minted' in s) minted += BigInt(s.Minted.minted_amount)
      if (minted > 0n) {
        newEntry('btc-mint', { state: 'confirmed', token: 'BTC', amount: minted.toString(), note: 'ckBTC minted' }, owner)
        void exchangeStore.refreshAllBalances()
      }
      return { minted, pending: [] }
    }
    const err = res.Err
    if ('NoNewUtxos' in err) {
      const p = err.NoNewUtxos
      const pending = (p.pending_utxos?.[0] ?? []).map((u: any) => ({
        valueSat: BigInt(u.value),
        confirmations: Number(p.current_confirmations?.[0] ?? u.confirmations ?? 0),
        required: Number(p.required_confirmations),
      }))
      return { minted: 0n, pending }
    }
    if ('AlreadyProcessing' in err) throw new Error('A balance check is already running. Try again in a minute.')
    if ('TemporarilyUnavailable' in err) throw new Error(`Minter busy: ${err.TemporarilyUnavailable}`)
    throw new Error(err.GenericError?.error_message || 'Balance check failed')
  }

  // ── Approvals (allowance-checked: never approve when it already suffices) ──

  async function ensureAllowance(ledgerId: string, spender: string, needed: bigint): Promise<void> {
    const identity = await getCachedIdentity()
    const owner = identity.getPrincipal()
    const ledger = await updateActor(ledgerId, icrcIDL)
    const spenderAccount = { owner: Principal.fromText(spender), subaccount: [] as [] }
    try {
      const cur = await ledger.icrc2_allowance({
        account: { owner, subaccount: [] },
        spender: spenderAccount,
      })
      if (BigInt(cur.allowance) >= needed) return
    } catch { /* allowance query unsupported/failed → just approve */ }
    const res = await ledger.icrc2_approve({
      fee: [], memo: [], from_subaccount: [], created_at_time: [],
      expected_allowance: [], expires_at: [],
      amount: needed,
      spender: spenderAccount,
    })
    if ('Err' in res) {
      const e = res.Err
      if ('InsufficientFunds' in e) throw new Error('Balance too low to cover the approval fee.')
      throw new Error(`Approval failed: ${Object.keys(e)[0]}`)
    }
  }

  // ── ckBTC: dissolve side ──

  async function estimateBtcWithdrawalFee(amountSat: bigint): Promise<{ bitcoinFee: bigint; minterFee: bigint }> {
    const minter = await queryActor(CKBTC_MINTER_ID, ckbtcMinterIDL)
    const f = await minter.estimate_withdrawal_fee({ amount: [amountSat] })
    return { bitcoinFee: BigInt(f.bitcoin_fee), minterFee: BigInt(f.minter_fee) }
  }

  async function withdrawBtc(amountSat: bigint, address: string): Promise<JournalEntry> {
    const owner = await opOwner()
    await loadMinterInfo()
    if (ckbtcInfo.value && amountSat < ckbtcInfo.value.retrieveBtcMinAmount) {
      throw new Error(`Minimum withdrawal is ${Number(ckbtcInfo.value.retrieveBtcMinAmount) / 1e8} BTC.`)
    }
    // approve amount + ledger fee headroom (ckBTC is its own gas; fees come out of amount)
    const ledger = await queryActor(CKBTC_LEDGER_ID, icrcIDL)
    const ledgerFee = BigInt(await ledger.icrc1_fee())
    await ensureAllowance(CKBTC_LEDGER_ID, CKBTC_MINTER_ID, amountSat + ledgerFee)

    const entry = newEntry('btc-dissolve', { token: 'BTC', amount: amountSat.toString(), address }, owner)
    const minter = await updateActor(CKBTC_MINTER_ID, ckbtcMinterIDL)
    let res: any
    try {
      res = await minter.retrieve_btc_with_approval({ address, amount: amountSat, from_subaccount: [] })
    } catch (err) {
      // transport failure: the burn may or may not have landed — keep the entry
      // pending and let the poller resolve it via withdrawal status later
      entry.state = 'pending'
      entry.note = 'Submitted during a network issue. Status will update automatically.'
      upsertEntry(entry, owner)
      throw err
    }
    if ('Err' in res) {
      entry.state = 'failed'
      const e = res.Err
      entry.note =
        'AmountTooLow' in e ? `Amount below the current minimum (${Number(e.AmountTooLow) / 1e8} BTC).`
        : 'InsufficientFunds' in e ? `ckBTC balance too low (have ${Number(e.InsufficientFunds.balance) / 1e8}).`
        : 'InsufficientAllowance' in e ? 'Approval was too low. Try again.'
        : 'MalformedAddress' in e ? `Invalid BTC address: ${e.MalformedAddress}`
        : 'AlreadyProcessing' in e ? 'Another withdrawal is processing. Try again shortly.'
        : 'TemporarilyUnavailable' in e ? `Minter busy: ${e.TemporarilyUnavailable}`
        : e.GenericError?.error_message || 'Withdrawal rejected'
      upsertEntry(entry, owner)
      throw new Error(entry.note)
    }
    entry.state = 'pending'
    entry.blockIndex = res.Ok.block_index.toString()
    upsertEntry(entry, owner)
    void exchangeStore.refreshAllBalances()
    return entry
  }

  // ── ckETH / ckERC20: dissolve side ──

  /** Live gas quote for a withdrawal. NEVER a constant — this is the fix for
   *  the ICPSwap bug where a hardcoded ckETH threshold demands more ckETH than
   *  the real gas cost. */
  async function quoteWithdrawalGas(erc20LedgerId?: string): Promise<{ requiredCkEth: bigint; maxTransactionFee: bigint }> {
    const minter = await queryActor(CKETH_MINTER_ID, ckethMinterIDL)
    const price = await minter.eip_1559_transaction_price(
      erc20LedgerId ? [{ ckerc20_ledger_id: Principal.fromText(erc20LedgerId) }] : [],
    )
    const maxFee = BigInt(price.max_transaction_fee)
    // ×1.2 buffer for gas moves between quote and execution
    return { requiredCkEth: (maxFee * 12n) / 10n, maxTransactionFee: maxFee }
  }

  async function withdrawEth(amountWei: bigint, recipient: string): Promise<JournalEntry> {
    const owner = await opOwner()
    if (!isEthAddress(recipient)) throw new Error('Invalid Ethereum address.')
    await loadMinterInfo()
    if (ckethInfo.value && amountWei < ckethInfo.value.minimumWithdrawalAmount) {
      throw new Error(`Minimum withdrawal is ${Number(ckethInfo.value.minimumWithdrawalAmount) / 1e18} ETH.`)
    }
    const ledger = await queryActor(CKETH_LEDGER_ID, icrcIDL)
    const ledgerFee = BigInt(await ledger.icrc1_fee())
    await ensureAllowance(CKETH_LEDGER_ID, CKETH_MINTER_ID, amountWei + ledgerFee)

    const entry = newEntry('eth-dissolve', { token: 'ETH', amount: amountWei.toString(), address: recipient }, owner)
    const minter = await updateActor(CKETH_MINTER_ID, ckethMinterIDL)
    let res: any
    try {
      res = await minter.withdraw_eth({ recipient, amount: amountWei, from_subaccount: [] })
    } catch (err) {
      entry.state = 'pending'
      entry.note = 'Submitted during a network issue. Status will update automatically.'
      upsertEntry(entry, owner)
      throw err
    }
    if ('Err' in res) {
      entry.state = 'failed'
      const e = res.Err
      entry.note =
        'AmountTooLow' in e ? `Amount below the minimum (${Number(e.AmountTooLow.min_withdrawal_amount) / 1e18} ETH).`
        : 'InsufficientFunds' in e ? `ckETH balance too low (have ${Number(e.InsufficientFunds.balance) / 1e18}).`
        : 'InsufficientAllowance' in e ? 'Approval was too low. Try again.'
        : 'RecipientAddressBlocked' in e ? 'This address is blocked.'
        : `Minter busy: ${e.TemporarilyUnavailable}`
      upsertEntry(entry, owner)
      throw new Error(entry.note)
    }
    entry.state = 'pending'
    entry.blockIndex = res.Ok.block_index.toString()
    upsertEntry(entry, owner)
    void exchangeStore.refreshAllBalances()
    return entry
  }

  /** Pre-flight for ckERC20 dissolve: exact ckETH the user needs for gas, and
   *  whether their wallet actually covers it. */
  async function preflightErc20Withdrawal(token: BridgeToken): Promise<{
    requiredCkEth: bigint; ckEthBalance: bigint; shortfall: bigint
  }> {
    const identity = await getCachedIdentity()
    const [{ requiredCkEth }, ckEthLedger] = await Promise.all([
      quoteWithdrawalGas(token.ledgerId),
      queryActor(CKETH_LEDGER_ID, icrcIDL),
    ])
    const [balance, fee] = await Promise.all([
      ckEthLedger.icrc1_balance_of({ owner: identity.getPrincipal(), subaccount: [] }),
      ckEthLedger.icrc1_fee(),
    ])
    const needed = requiredCkEth + BigInt(fee)
    const bal = BigInt(balance)
    return { requiredCkEth: needed, ckEthBalance: bal, shortfall: bal >= needed ? 0n : needed - bal }
  }

  async function withdrawErc20(token: BridgeToken, amount: bigint, recipient: string): Promise<JournalEntry> {
    const owner = await opOwner()
    if (!isEthAddress(recipient)) throw new Error('Invalid Ethereum address.')
    // 1. live gas quote and balance pre-check (exact shortfall messaging)
    const pf = await preflightErc20Withdrawal(token)
    if (pf.shortfall > 0n) {
      throw new Error(`You need ${(Number(pf.shortfall) / 1e18).toFixed(6)} more ckETH to cover the transaction fee.`)
    }
    // 2. approve on both ledgers. The ckETH approval is 3x the quote: the minter
    // burns its OWN estimate at execution time, which can exceed our quote when
    // gas moves. Extra allowance costs nothing (only the actual burn consumes it).
    const tokenLedger = await queryActor(token.ledgerId, icrcIDL)
    const ckEthLedger = await queryActor(CKETH_LEDGER_ID, icrcIDL)
    const tokenFee = BigInt(await tokenLedger.icrc1_fee())
    const ckEthFee = BigInt(await ckEthLedger.icrc1_fee())
    await ensureAllowance(CKETH_LEDGER_ID, CKETH_MINTER_ID, pf.requiredCkEth * 3n)
    await ensureAllowance(token.ledgerId, CKETH_MINTER_ID, amount + tokenFee)

    // 3. withdraw — if the minter still reports the ckETH allowance short, it
    // tells us the exact burn it needs; approve that and retry once, silently.
    const entry = newEntry('erc20-dissolve', { token: token.key, amount: amount.toString(), address: recipient }, owner)
    const minter = await updateActor(CKETH_MINTER_ID, ckethMinterIDL)
    const callWithdraw = () => minter.withdraw_erc20({
      amount,
      ckerc20_ledger_id: Principal.fromText(token.ledgerId),
      recipient,
      from_cketh_subaccount: [],
      from_ckerc20_subaccount: [],
    })
    let res: any
    try {
      res = await callWithdraw()
      const ckEthShort = 'Err' in res && 'CkEthLedgerError' in res.Err
        && 'InsufficientAllowance' in res.Err.CkEthLedgerError.error
        ? res.Err.CkEthLedgerError.error.InsufficientAllowance : null
      if (ckEthShort) {
        await ensureAllowance(CKETH_LEDGER_ID, CKETH_MINTER_ID, BigInt(ckEthShort.failed_burn_amount) + ckEthFee)
        res = await callWithdraw()
      }
    } catch (err) {
      entry.state = 'pending'
      entry.note = 'Submitted during a network issue. Status will update automatically.'
      upsertEntry(entry, owner)
      throw err
    }
    if ('Err' in res) {
      entry.state = 'failed'
      const e = res.Err
      const ledgerErrText = (le: any, decimals: number, symbol: string) =>
        'InsufficientFunds' in le ? `${symbol} balance too low (have ${Number(le.InsufficientFunds.balance) / 10 ** decimals}, need ${Number(le.InsufficientFunds.failed_burn_amount) / 10 ** decimals}).`
        : 'InsufficientAllowance' in le ? `${symbol} approval too low (approved ${Number(le.InsufficientAllowance.allowance) / 10 ** decimals}, need ${Number(le.InsufficientAllowance.failed_burn_amount) / 10 ** decimals}). Try again.`
        : 'AmountTooLow' in le ? `Amount below the ${symbol} minimum.`
        : `Ledger busy: ${le.TemporarilyUnavailable}`
      entry.note =
        'TokenNotSupported' in e ? `${token.symbol} is not supported by the minter.`
        : 'RecipientAddressBlocked' in e ? 'This address is blocked.'
        : 'CkEthLedgerError' in e ? ledgerErrText(e.CkEthLedgerError.error, 18, 'ckETH')
        : 'CkErc20LedgerError' in e ? ledgerErrText(e.CkErc20LedgerError.error, token.decimals, token.symbol)
        : `Minter busy: ${e.TemporarilyUnavailable}`
      upsertEntry(entry, owner)
      throw new Error(entry.note)
    }
    entry.state = 'pending'
    entry.blockIndex = res.Ok.cketh_block_index.toString()
    upsertEntry(entry, owner)
    void exchangeStore.refreshAllBalances()
    return entry
  }

  // ── ETH side: deposits via the user's Ethereum wallet ──

  function hasEthWallet(): boolean {
    return typeof (window as any).ethereum !== 'undefined'
  }

  async function connectEthWallet(): Promise<string> {
    const eth = (window as any).ethereum
    if (!eth) throw new Error('No Ethereum wallet found. Install MetaMask or a compatible wallet.')
    const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
    if (!accounts?.length) throw new Error('No Ethereum account authorized.')
    // Ethereum mainnet only — the ck minters watch mainnet
    const chainId: string = await eth.request({ method: 'eth_chainId' })
    if (chainId !== '0x1') {
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] })
      } catch {
        throw new Error('Please switch your wallet to Ethereum mainnet.')
      }
    }
    return accounts[0]
  }

  async function depositEth(amountWei: bigint): Promise<JournalEntry> {
    const owner = principalText()
    if (!owner) throw new Error('Not authenticated. Please connect your wallet.')
    await loadMinterInfo()
    const helper = ckethInfo.value?.depositHelper
    if (!helper) throw new Error('Bridge configuration not loaded. Try again.')
    const from = await connectEthWallet()
    const { encodeFunctionData } = await import('viem')
    const data = encodeFunctionData({
      abi: [{
        name: 'depositEth', type: 'function', stateMutability: 'payable',
        inputs: [{ name: 'principal', type: 'bytes32' }, { name: 'subaccount', type: 'bytes32' }],
        outputs: [],
      }],
      functionName: 'depositEth',
      args: [principalToBytes32(owner), ZERO_SUBACCOUNT],
    })
    const txHash: string = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: helper, value: `0x${amountWei.toString(16)}`, data }],
    })
    const entry = newEntry('eth-mint', {
      state: 'sent-eth-tx', token: 'ETH', amount: amountWei.toString(), txHash,
      note: 'ckETH is minted after the Ethereum transaction finalizes (about 20 minutes).',
    }, owner)
    return entry
  }

  async function depositErc20(token: BridgeToken, amount: bigint): Promise<JournalEntry> {
    const owner = principalText()
    if (!owner) throw new Error('Not authenticated. Please connect your wallet.')
    await loadMinterInfo()
    const helper = ckethInfo.value?.depositHelper
    if (!helper || !token.erc20Address) throw new Error('Bridge configuration not loaded. Try again.')
    const from = await connectEthWallet()
    const { encodeFunctionData } = await import('viem')
    const eth = (window as any).ethereum
    // 1. ERC-20 approve(helper, amount)
    const approveData = encodeFunctionData({
      abi: [{
        name: 'approve', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ type: 'bool' }],
      }],
      functionName: 'approve',
      args: [helper as `0x${string}`, amount],
    })
    await eth.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: token.erc20Address, data: approveData }],
    })
    // 2. helper.depositErc20(erc20, amount, principal, subaccount)
    const depositData = encodeFunctionData({
      abi: [{
        name: 'depositErc20', type: 'function', stateMutability: 'nonpayable',
        inputs: [
          { name: 'erc20Address', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'principal', type: 'bytes32' },
          { name: 'subaccount', type: 'bytes32' },
        ],
        outputs: [],
      }],
      functionName: 'depositErc20',
      args: [token.erc20Address as `0x${string}`, amount, principalToBytes32(owner), ZERO_SUBACCOUNT],
    })
    const txHash: string = await eth.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: helper, data: depositData }],
    })
    const entry = newEntry('erc20-mint', {
      state: 'sent-eth-tx', token: token.key, amount: amount.toString(), txHash,
      note: `${token.symbol} is minted after the Ethereum transaction finalizes (about 20 minutes).`,
    }, owner)
    return entry
  }

  // ── Status polling (resumes pending entries; a failed poll NEVER fails an entry) ──

  const toast = useExchangeToast()

  /** Toast once when an entry reaches a terminal state via polling. */
  function notifyStateChange(entry: JournalEntry, before: JournalState): void {
    if (entry.state === before) return
    const label = `${entry.token} ${entry.kind.includes('mint') ? 'deposit' : 'withdrawal'}`
    if (entry.state === 'confirmed') toast.success('Bridge complete', `${label} finished.`)
    else if (entry.state === 'reimbursed') toast.warning('Bridge reimbursed', `${label} was refunded by the minter.`)
    else if (entry.state === 'failed') toast.error('Bridge failed', entry.note || `${label} failed.`)
  }

  async function pollEntry(entry: JournalEntry): Promise<void> {
    const stateBefore = entry.state
    // The entry belongs to the journal loaded now. If the account changes
    // while a status call is in flight, its result is dropped here instead of
    // being written into the next account's journal.
    const owner = journalOwner
    const sameOwner = () => owner === journalOwner
    try {
      if (entry.kind === 'btc-dissolve' && entry.blockIndex) {
        const minter = await queryActor(CKBTC_MINTER_ID, ckbtcMinterIDL)
        const s = await minter.retrieve_btc_status_v2({ block_index: BigInt(entry.blockIndex) })
        if ('Confirmed' in s) { entry.state = 'confirmed'; entry.txid = hexFromBytes(new Uint8Array(s.Confirmed.txid).reverse()) }
        else if ('Submitted' in s) { entry.txid = hexFromBytes(new Uint8Array(s.Submitted.txid).reverse()); entry.note = 'BTC transaction submitted, waiting for confirmations.' }
        else if ('Reimbursed' in s || 'WillReimburse' in s) entry.state = 'reimbursed'
        else if ('AmountTooLow' in s) { entry.state = 'failed'; entry.note = 'Amount too low to cover network fees.' }
        if (!sameOwner()) return
        upsertEntry(entry)
      } else if ((entry.kind === 'eth-dissolve' || entry.kind === 'erc20-dissolve') && entry.blockIndex) {
        const minter = await queryActor(CKETH_MINTER_ID, ckethMinterIDL)
        const details = await minter.withdrawal_status({ ByWithdrawalId: BigInt(entry.blockIndex) })
        const d = details?.[0]
        if (!d) return
        const st = d.status
        if ('TxFinalized' in st) {
          const f = st.TxFinalized
          if ('Success' in f) { entry.state = 'confirmed'; entry.txHash = f.Success.transaction_hash }
          else if ('Reimbursed' in f) { entry.state = 'reimbursed'; entry.txHash = f.Reimbursed.transaction_hash }
          else entry.state = 'reimbursed'
        } else if ('TxSent' in st) {
          entry.txHash = st.TxSent.transaction_hash
          entry.note = 'Ethereum transaction sent. It may already show success on Etherscan; the minter marks it complete after Ethereum finality, about 15 minutes.'
        }
        if (!sameOwner()) return
        upsertEntry(entry)
      } else if ((entry.kind === 'eth-mint' || entry.kind === 'erc20-mint')
                 && Date.now() - entry.createdAt > 40 * 60_000) {
        // ponytail: no per-tx log scraping; after 40 min assume the minter
        // processed it and let the balance (auto-refreshed) be the truth.
        entry.state = 'confirmed'
        entry.note = 'Deposit window elapsed. Check your balance.'
        if (!sameOwner()) return
        upsertEntry(entry)
        void exchangeStore.refreshAllBalances()
      }
    } catch (err) {
      // network/poll failure: keep waiting, never mark failed
      console.warn('[Bridge] status poll failed (will retry):', err)
    }
    if (!sameOwner()) return
    notifyStateChange(entry, stateBefore)
    if (entry.state === 'confirmed' && stateBefore !== 'confirmed') void exchangeStore.refreshAllBalances()
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null
  function startPolling(): void {
    if (pollTimer) return
    pollTimer = setInterval(() => {
      if (document.hidden) return
      for (const e of pendingEntries.value) void pollEntry(e)
    }, 30_000)
  }

  let initialized = false
  async function init(): Promise<void> {
    initialized = true
    // Older builds saved the journal under the empty principal after a logout.
    try { localStorage.removeItem(journalKey('')) } catch { /* ignore */ }
    loadJournal()
    startPolling()
    void loadMinterInfo()
    // resume immediately for anything left pending from a previous session
    for (const e of pendingEntries.value) void pollEntry(e)
  }

  // Account switch, login or logout: show and poll the new account's journal.
  watch(() => exchangeStore.principalText, (p) => {
    if (!initialized || p === journalOwner) return
    loadJournal()
    for (const e of pendingEntries.value) void pollEntry(e)
  })

  function clearFinished(): void {
    journal.value = journal.value.filter(e => !['confirmed', 'reimbursed', 'failed'].includes(e.state))
    saveJournal()
  }

  // ── Token logos from ledger icrc1_metadata ──
  // Saved per ledger and rechecked in the background once a week (shared with
  // the token selector through token-icons, one request per ledger at a time).

  const tokenLogos = ref<Record<string, string>>({})
  async function loadTokenLogo(ledgerId: string): Promise<string | null> {
    if (tokenLogos.value[ledgerId] !== undefined) return tokenLogos.value[ledgerId] || null
    const cached = cachedLedgerLogo(ledgerId)
    if (cached) {
      tokenLogos.value[ledgerId] = cached
      if (ledgerLogoDue(ledgerId)) {
        void fetchLedgerLogo(ledgerId).then((url) => { if (url) tokenLogos.value[ledgerId] = url })
      }
      return cached
    }
    const url = await fetchLedgerLogo(ledgerId)
    tokenLogos.value[ledgerId] = url
    return url || null
  }

  return {
    // state
    bridgeTokens, erc20Tokens, journal, pendingEntries, btcDepositAddress,
    ckbtcInfo, ckethInfo, loadingInfo, infoError,
    // actions
    init, loadMinterInfo, fetchBtcDepositAddress, checkBtcDeposits,
    estimateBtcWithdrawalFee, withdrawBtc,
    quoteWithdrawalGas, preflightErc20Withdrawal, withdrawEth, withdrawErc20,
    hasEthWallet, connectEthWallet, depositEth, depositErc20,
    clearFinished, tokenLogos, loadTokenLogo,
  }
})
