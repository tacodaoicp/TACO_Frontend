/**
 * Deposit helpers for transferring tokens to the exchange treasury.
 * Based on Section 4 of FRONTEND_DEV_GUIDE.md.
 *
 * Every trade, swap, and liquidity action requires the user to first
 * transfer tokens to the treasury, then pass the block number to the
 * exchange canister.
 */

import { Actor, RejectError, CertifiedRejectErrorCode, type HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { getCachedAgent, getCachedIdentity } from '../../shared/auth-cache'
import { icrcIDL } from '../../shared/icrc-idl'
import { getCanisterId } from '../../constants/canisterIds'
import { useExchangeStore } from '../store/exchange.store'
import { createDepositHistory, type DepositHistoryEntry } from './depositHistory'
import { journalStorage } from './runJournalStore'
import { withTimeout } from './withTimeout'
import { requiredDeposit } from './crossDexCosts'
import { sendDeposit, DepositError, type DepositIntent, type LedgerSendResult } from './depositSend'

/** JSON replacer that converts BigInt to string (prevents "Do not know how to serialize a BigInt") */
const jsonSafe = (_: string, v: any) => typeof v === 'bigint' ? v.toString() : v

/**
 * Calculate the total required deposit amount including trading fee and transfer fee.
 */
export function calculateRequiredDeposit(
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
): bigint {
  return requiredDeposit(tradeAmount, tradingFeeBps, transferFee)
}

/**
 * V2 deposit: make sure the exchange canister can pull `gross + transferFee`
 * via icrc2_transfer_from. Replaces the transfer-then-block flow when the
 * backend's V2 gates are open for this token.
 *
 * Allowance strategy (ensure-style, same as the bridge's ensureAllowance):
 * reuse a standing allowance when it already covers this trade — no ledger
 * fee, no extra call. Otherwise approve exactly what this trade pulls, with
 * no prompt, like the ICPSwap leg does. The approval expires after
 * APPROVAL_TTL_MS, so one left over by a trade that failed before its pull
 * lapses on its own. The spender is the exchange itself and every pull
 * consumes allowance, so the standing amount only ever shrinks.
 *
 * - The pull draws from the caller's DEFAULT subaccount only.
 * - No journal entry: a V2 failure either moved nothing, or is tracked
 *   on-chain as a pending pull (see getMyPendingPulls / the Recover page).
 * - Works for ICP too (the ICP ledger supports icrc2_approve).
 */
const APPROVAL_TTL_MS = 30 * 60_000

export async function approveExchangeDeposit(
  tokenCanisterId: string,
  gross: bigint,
  transferFee: bigint,
  /** A CrossDEX run's own agent and principal: the allowance is read live
   *  with that agent (never from the store cache, which follows the tab's
   *  current session) and the approval is signed by it. */
  pin?: { agent: HttpAgent; owner: Principal },
): Promise<{ approved: boolean }> {
  let agent: HttpAgent
  let owner: Principal
  if (pin) {
    agent = pin.agent
    owner = pin.owner
    if (owner.isAnonymous()) throw new Error('Not authenticated')
  } else {
    const a = await getCachedAgent()
    if (!a) throw new Error('Not authenticated')
    const identity = await getCachedIdentity()
    if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated')
    agent = a
    owner = identity.getPrincipal()
  }

  const ledger = Actor.createActor(icrcIDL, { agent, canisterId: tokenCanisterId })
  const spender = { owner: Principal.fromText(getCanisterId('exchange')), subaccount: [] as [] }
  const needed = gross + transferFee
  // The store's allowance cache belongs to the tab's current principal.
  const cacheIsOurs = () => !pin || useExchangeStore().principalText === owner.toText()

  // Reuse a standing allowance when it covers this trade. Reads the store's
  // allowance cache (warmed on token switch / page mount, refreshed after
  // every mutation), so this is usually instant. The 60s margin keeps the
  // pull off a dying approval. The cache is trusted only in the direction
  // that SKIPS work; an insufficient answer is re-verified live below.
  const store = useExchangeStore()
  const sufficient = (v: { allowance: bigint; expiresAt: bigint | null } | null): boolean => {
    if (!v) return false
    const marginNs = BigInt(Date.now() + 60_000) * 1_000_000n
    return v.allowance >= needed && (v.expiresAt == null || v.expiresAt > marginNs)
  }
  if (!pin) {
    try {
      const cur = await store.userAllowanceQuery(tokenCanisterId).ensure(30_000)
      if (sufficient(cur)) return { approved: false }
    } catch { /* allowance unknown — verify live below */ }
  }

  // The cache said no or did not know. Take one LIVE look at the ledger via
  // the authed agent before opening a dialog: a fresh signed query heals every
  // stale-low cache state (a poisoned post-approve read, a quick retry, a
  // stale principal). Fail-open: any error or timeout falls through to the
  // prompt, so this can never block a trade or wrongly skip a needed approval.
  try {
    const live: any = await withTimeout(
      (ledger as any).icrc2_allowance({
        account: { owner, subaccount: [] },
        spender,
      }),
      8_000,
      'icrc2_allowance live check',
    )
    const liveVal = {
      allowance: BigInt(live.allowance),
      expiresAt: Array.isArray(live.expires_at) && live.expires_at.length > 0 ? BigInt(live.expires_at[0]) : null,
    }
    if (cacheIsOurs()) store.userAllowanceQuery(tokenCanisterId).set(liveVal)
    if (sufficient(liveVal)) return { approved: false }
  } catch { /* live check unavailable — approve below */ }

  // New approval needed: approve exactly what this trade pulls (never less: a short allowance
  // is what traps the deviant sGLDT/EXE ledgers into an ambiguous pending pull).
  const expiresAtNs = BigInt(Date.now() + APPROVAL_TTL_MS) * 1_000_000n
  const result = await ledger.icrc2_approve({
    fee: [], memo: [], from_subaccount: [], created_at_time: [],
    expected_allowance: [],
    expires_at: [expiresAtNs],
    amount: needed,
    spender,
  })
  if ('Err' in (result as any)) {
    const err = (result as any).Err
    if ('InsufficientFunds' in err) throw new Error('Balance too low to cover the approval fee.')
    throw new Error(`Approval failed: ${JSON.stringify(err, jsonSafe)}`)
  }
  // Seed the cache with the value the approval just wrote on chain. A refetch
  // here could capture pre-approve state from a lagging replica and poison the
  // cache; set() is authoritative and supersedes any in-flight read.
  if (cacheIsOurs()) {
    store.userAllowanceQuery(tokenCanisterId).set({
      allowance: needed,
      expiresAt: expiresAtNs,
    })
  }
  return { approved: true }
}

// Minimal IDL for ICP ledger transfer
const icpLedgerIdl = ({ IDL }: { IDL: any }) => {
  const AccountIdentifier = IDL.Vec(IDL.Nat8)
  const Tokens = IDL.Record({ e8s: IDL.Nat64 })
  const TransferArgs = IDL.Record({
    to: AccountIdentifier,
    fee: Tokens,
    memo: IDL.Nat64,
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Record({ timestamp_nanos: IDL.Nat64 })),
    amount: Tokens,
  })
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat64,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: Tokens }),
      InsufficientFunds: IDL.Record({ balance: Tokens }),
      TxTooOld: IDL.Record({ allowed_window_nanos: IDL.Nat64 }),
      TxCreatedInFuture: IDL.Null,
      TxDuplicate: IDL.Record({ duplicate_of: IDL.Nat64 }),
    }),
  })
  return IDL.Service({
    transfer: IDL.Func([TransferArgs], [TransferResult], []),
  })
}

// Minimal IDL for ICRC1 transfer
const icrc1TransferIdl = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  })
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
      BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
      InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
      TooOld: IDL.Null,
      CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
      Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
      TemporarilyUnavailable: IDL.Null,
      GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
    }),
  })
  return IDL.Service({
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], []),
  })
}

/**
 * Convert a hex string to Uint8Array for ICP account identifiers.
 */
function hexToBytes(hex: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return bytes
}

const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const ICP_TRANSFER_FEE = 10_000n

/** A certified reject proves the update made no state change. */
function isCertifiedReject(e: unknown): boolean {
  try { return e instanceof RejectError && (e as any).code instanceof CertifiedRejectErrorCode } catch { return false }
}

/** The 8 memo bytes as the ICP ledger's nat64 memo (big endian). */
function memoNat64(b: Uint8Array): bigint {
  let v = 0n
  for (const x of b) v = (v << 8n) | BigInt(x)
  return v
}

/** One ICP ledger transfer to the treasury account, mapped to a send result. */
async function sendIcpTransfer(
  agent: HttpAgent, treasuryAccountIdHex: string, required: bigint, createdAtNs?: bigint, memo?: Uint8Array,
): Promise<LedgerSendResult> {
  const ledger = Actor.createActor(icpLedgerIdl, { agent, canisterId: ICP_LEDGER_CANISTER_ID })
  const result = await ledger.transfer({
    to: hexToBytes(treasuryAccountIdHex),
    amount: { e8s: required },
    fee: { e8s: ICP_TRANSFER_FEE },
    memo: memo ? memoNat64(memo) : 0n,
    from_subaccount: [],
    created_at_time: createdAtNs != null ? [{ timestamp_nanos: createdAtNs }] : [],
  }) as any
  if ('Ok' in result) return { Ok: BigInt(result.Ok) }
  const err = result.Err
  if ('TxDuplicate' in err) return { Duplicate: BigInt(err.TxDuplicate.duplicate_of) }
  if ('InsufficientFunds' in err) {
    return { Err: `Insufficient ICP balance. Available: ${Number(err.InsufficientFunds.balance.e8s) / 1e8} ICP`, insufficient: true }
  }
  return { Err: `ICP transfer failed: ${JSON.stringify(err, jsonSafe)}` }
}

/** One ICRC-1 transfer to the treasury principal, mapped to a send result. */
async function sendIcrcTransfer(
  agent: HttpAgent, tokenCanisterId: string, treasuryPrincipalText: string, required: bigint, createdAtNs?: bigint, memo?: Uint8Array,
): Promise<LedgerSendResult> {
  const tokenActor = Actor.createActor(icrc1TransferIdl, { agent, canisterId: tokenCanisterId })
  const result = await tokenActor.icrc1_transfer({
    from_subaccount: [],
    to: { owner: Principal.fromText(treasuryPrincipalText), subaccount: [] },
    amount: required,
    fee: [],
    memo: memo ? [Array.from(memo)] : [],
    created_at_time: createdAtNs != null ? [createdAtNs] : [],
  }) as any
  if ('Ok' in result) return { Ok: BigInt(result.Ok) }
  const err = result.Err
  if ('Duplicate' in err) return { Duplicate: BigInt(err.Duplicate.duplicate_of) }
  if ('InsufficientFunds' in err) return { Err: 'Insufficient token balance.', insufficient: true }
  return { Err: `Token transfer failed: ${JSON.stringify(err, jsonSafe)}` }
}

/**
 * Deposit ICP to the exchange treasury.
 * Returns the block height of the transfer.
 *
 * WARNING: ICP transfers MUST come from the user's default subaccount.
 * Transfers from non-default subaccounts are permanently unrecoverable.
 */
export async function depositICP(
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  treasuryAccountIdHex: string,
  pinnedAgent?: HttpAgent,
): Promise<bigint> {
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, ICP_TRANSFER_FEE)
  const agent = pinnedAgent ?? await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')
  const r = await sendIcpTransfer(agent, treasuryAccountIdHex, required)
  if ('Ok' in r) return r.Ok
  if ('Duplicate' in r) return r.Duplicate
  throw new Error(r.Err)
}

/**
 * Deposit an ICRC token to the exchange treasury.
 * Returns the block index of the transfer.
 *
 * NOTE: ICRC-2 approve+transferFrom is NOT supported. Only direct icrc1_transfer.
 */
export async function depositICRC(
  tokenCanisterId: string,
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
  treasuryPrincipalText: string,
  pinnedAgent?: HttpAgent,
): Promise<bigint> {
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, transferFee)
  const agent = pinnedAgent ?? await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')
  const r = await sendIcrcTransfer(agent, tokenCanisterId, treasuryPrincipalText, required)
  if ('Ok' in r) return r.Ok
  if ('Duplicate' in r) return r.Duplicate
  throw new Error(r.Err)
}

// ── Deposit history (the Recover page's pointer to every V1 deposit) ──
// Rules in utils/depositHistory.ts; here bound to localStorage, written with
// cache eviction on a full storage (a recovery record beats cached data).
export type { DepositHistoryEntry } from './depositHistory'
const history = createDepositHistory(journalStorage, () => Date.now())

/** Save a deposit for recovery. Returns whether it was written. */
export function saveDepositToCache(
  tokenCanisterId: string, block: bigint, amount: bigint, assetType: string,
  meta: { principal?: string; runId?: string } = {},
): boolean {
  return history.save(tokenCanisterId, block, amount, assetType, meta)
}

/** Get cached deposit history for the Recover page. */
export function getDepositHistory(): DepositHistoryEntry[] {
  return history.list()
}

/**
 * Remove a deposit from cache: only after its trade went through, a recovery
 * confirmed the refund, or the user dismissed it. Pass the token when known
 * (block numbers are per ledger, so two tokens can share one).
 */
export function removeDepositFromCache(block: string, token?: string) {
  history.remove(block, token)
}

/** Mark a deposit settled by the exchange (kept for the user to check) or open again. */
export function setDepositStatus(block: string, status: 'open' | 'settled', token?: string) {
  history.setStatus(block, status, token)
}

/** The principal of the current session, read once before funds move. */
async function currentPrincipalText(): Promise<string | undefined> {
  try {
    const id = await getCachedIdentity()
    const p = id.getPrincipal()
    return p.isAnonymous() ? undefined : p.toText()
  } catch { return undefined }
}

/**
 * Deposit for addLiquidity — transfers the EXACT amount with no fee additions.
 * The guide says: "amount: amount0 — exact amount — do NOT add transfer fee here"
 * The ledger charges the fee separately from the sender's balance.
 */
export async function depositTokenForLiquidity(
  tokenCanisterId: string,
  assetType: { ICP: null } | { ICRC12: null } | { ICRC3: null },
  amount: bigint,
  treasuryAccountIdHex: string,
  treasuryPrincipalText: string,
  /** The caller already ran store.assertCanTrade() for this whole action (LP
   *  adds check once before the first of their two deposits, so a failed
   *  check can never strand the first one). */
  tradeChecked = false,
): Promise<bigint> {
  const store = useExchangeStore()
  if (!tradeChecked) await store.assertCanTrade()
  // The treasury as read by the check above (never an old saved copy).
  treasuryAccountIdHex = store.treasuryAccountId || treasuryAccountIdHex
  treasuryPrincipalText = store.treasuryPrincipal || treasuryPrincipalText
  const principal = await currentPrincipalText()
  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')

  let block: bigint
  const typeStr = 'ICP' in assetType ? 'ICP' : 'ICRC3' in assetType ? 'ICRC3' : 'ICRC12'

  if ('ICP' in assetType) {
    const ledger = Actor.createActor(icpLedgerIdl, { agent, canisterId: ICP_LEDGER_CANISTER_ID })
    const result = await ledger.transfer({
      to: hexToBytes(treasuryAccountIdHex),
      amount: { e8s: amount },
      fee: { e8s: ICP_TRANSFER_FEE },
      memo: 0n,
      from_subaccount: [],
      created_at_time: [],
    })
    if ('Err' in (result as any)) {
      const err = (result as any).Err
      if ('InsufficientFunds' in err) throw new Error('Insufficient balance for this deposit plus the ledger fee.')
      throw new Error(`ICP transfer failed: ${JSON.stringify(err, jsonSafe)}`)
    }
    block = (result as any).Ok
  } else {
    const tokenActor = Actor.createActor(icrc1TransferIdl, { agent, canisterId: tokenCanisterId })
    const result = await tokenActor.icrc1_transfer({
      from_subaccount: [],
      to: { owner: Principal.fromText(treasuryPrincipalText), subaccount: [] },
      amount,
      fee: [],
      memo: [],
      created_at_time: [],
    })
    if ('Err' in (result as any)) {
      const err = (result as any).Err
      if ('InsufficientFunds' in err) throw new Error('Insufficient balance for this deposit plus the ledger fee.')
      throw new Error(`Token transfer failed: ${JSON.stringify(err, jsonSafe)}`)
    }
    block = (result as any).Ok
  }

  saveDepositToCache(tokenCanisterId, block, amount, typeStr, { principal })
  return block
}

/**
 * Universal deposit function that routes to the correct transfer method
 * based on the token's asset type.
 * Every successful deposit is automatically saved to localStorage for recovery.
 */
export interface DepositOptions {
  /** A CrossDEX run's own agent and principal (one identity object). */
  agent?: HttpAgent
  owner?: Principal
  /** The run this deposit belongs to (written to the deposit history). */
  runId?: string
  /** The sell ledger deduplicates created_at_time + memo (see utils/ledgerDedup.ts). */
  dedup?: boolean
  /** The agent's clock was synced with the replica (needed for created_at_time). */
  timeSynced?: boolean
  /** Writes and reads back the deposit intent right before the transfer;
   *  false stops with nothing sent. */
  intent?: { beforeSend(i: DepositIntent): boolean }
}

/**
 * Universal deposit: routes to the ICP or ICRC transfer, then saves the block to
 * the deposit history. Every throw carries `deposit: 'notSent' | 'unknown'`
 * (utils/depositSend.ts): only notSent means nothing left the wallet. With a run
 * agent on a deduplicating ledger the transfer carries created_at_time and a
 * random memo and is resent unchanged when its answer is lost.
 */
export async function depositToken(
  tokenCanisterId: string,
  assetType: { ICP: null } | { ICRC12: null } | { ICRC3: null },
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
  treasuryAccountIdHex: string,
  treasuryPrincipalText: string,
  opts: DepositOptions = {},
): Promise<bigint> {
  const store = useExchangeStore()
  // Asks the canister before any funds move, and refreshes the fee and the
  // treasury if the saved ones are old.
  try {
    await store.assertCanTrade()
  } catch (e: any) {
    throw new DepositError(e?.message || "Can't reach the exchange right now. No funds were moved.", 'notSent', 'refused', e)
  }
  // The amount was worked out with the fee the user saw. If the fresh fee
  // differs, stop here rather than charge something else.
  if (store.tradingFeeBps !== tradingFeeBps) {
    throw new DepositError('The trading fee changed. Check the amounts and try again. No funds were moved.', 'notSent', 'refused')
  }
  treasuryAccountIdHex = store.treasuryAccountId || treasuryAccountIdHex
  treasuryPrincipalText = store.treasuryPrincipal || treasuryPrincipalText
  const principal = opts.owner ? opts.owner.toText() : await currentPrincipalText()
  const isIcp = 'ICP' in assetType
  const typeStr = isIcp ? 'ICP' : 'ICRC3' in assetType ? 'ICRC3' : 'ICRC12'
  let agent: HttpAgent
  try {
    const a = opts.agent ?? await getCachedAgent()
    if (!a) throw new Error('Not authenticated')
    agent = a
  } catch (e: any) {
    throw new DepositError(e?.message || 'Not authenticated', 'notSent', 'refused', e)
  }
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, isIcp ? ICP_TRANSFER_FEE : transferFee)
  const to = isIcp ? treasuryAccountIdHex : treasuryPrincipalText
  const synced = !!opts.agent && !!opts.timeSynced

  const block = await sendDeposit({
    required,
    to,
    dedup: !!opts.dedup, // resends also need nowNs, which is null when the clock is not synced
    nowNs: synced ? () => BigInt(Date.now() + agent.getTimeDiffMsecs()) * 1_000_000n : null,
    randomMemo: () => crypto.getRandomValues(new Uint8Array(8)),
    beforeSend: opts.intent?.beforeSend,
    send: (createdAtNs, memo) => isIcp
      ? sendIcpTransfer(agent, to, required, createdAtNs, memo)
      : sendIcrcTransfer(agent, tokenCanisterId, to, required, createdAtNs, memo),
    isCertifiedReject,
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    refusedMessage: (err) => err,
  })

  // Always save to cache — the next step (addPosition/addLiquidity/etc.) might fail
  saveDepositToCache(tokenCanisterId, block, tradeAmount, typeStr, { principal, runId: opts.runId })

  return block
}
