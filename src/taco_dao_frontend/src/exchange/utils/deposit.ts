/**
 * Deposit helpers for transferring tokens to the exchange treasury.
 * Based on Section 4 of FRONTEND_DEV_GUIDE.md.
 *
 * Every trade, swap, and liquidity action requires the user to first
 * transfer tokens to the treasury, then pass the block number to the
 * exchange canister.
 */

import { Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { getCachedAgent, getCachedIdentity } from '../../shared/auth-cache'
import { icrcIDL } from '../../shared/icrc-idl'
import { getCanisterId } from '../../constants/canisterIds'
import { requestApproval, ApprovalDeclined } from './approvalPrompt'
import { useExchangeStore } from '../store/exchange.store'
import { setItemWithCacheEviction } from './persistCache'
import { withTimeout } from './withTimeout'

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
  const feeAmount = (tradeAmount * tradingFeeBps) / 10000n
  return tradeAmount + feeAmount + transferFee
}

/**
 * V2 deposit: make sure the exchange canister can pull `gross + transferFee`
 * via icrc2_transfer_from. Replaces the transfer-then-block flow when the
 * backend's V2 gates are open for this token.
 *
 * Allowance strategy (ensure-style, same as the bridge's ensureAllowance):
 * reuse a standing allowance when it already covers this trade — no ledger
 * fee, no extra call, no dialog. Otherwise ask the user via ApprovalDialog:
 * prefilled with 10x this trade's needs and a 2-month validity, both
 * editable (amount never below what the trade needs). The spender is the
 * exchange itself and every pull consumes allowance, so the standing
 * amount only ever shrinks.
 *
 * - The pull draws from the caller's DEFAULT subaccount only.
 * - No journal entry: a V2 failure either moved nothing, or is tracked
 *   on-chain as a pending pull (see getMyPendingPulls / the Recover page).
 * - Works for ICP too (the ICP ledger supports icrc2_approve).
 */
export async function approveExchangeDeposit(
  tokenCanisterId: string,
  gross: bigint,
  transferFee: bigint,
): Promise<void> {
  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')
  const identity = await getCachedIdentity()
  if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated')

  const ledger = Actor.createActor(icrcIDL, { agent, canisterId: tokenCanisterId })
  const spender = { owner: Principal.fromText(getCanisterId('exchange')), subaccount: [] as [] }
  const needed = gross + transferFee

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
  try {
    const cur = await store.userAllowanceQuery(tokenCanisterId).ensure(30_000)
    if (sufficient(cur)) return
  } catch { /* allowance unknown — verify live below */ }

  // The cache said no or did not know. Take one LIVE look at the ledger via
  // the authed agent before opening a dialog: a fresh signed query heals every
  // stale-low cache state (a poisoned post-approve read, a quick retry, a
  // stale principal). Fail-open: any error or timeout falls through to the
  // prompt, so this can never block a trade or wrongly skip a needed approval.
  try {
    const live: any = await withTimeout(
      (ledger as any).icrc2_allowance({
        account: { owner: identity.getPrincipal(), subaccount: [] },
        spender,
      }),
      8_000,
      'icrc2_allowance live check',
    )
    const liveVal = {
      allowance: BigInt(live.allowance),
      expiresAt: Array.isArray(live.expires_at) && live.expires_at.length > 0 ? BigInt(live.expires_at[0]) : null,
    }
    store.userAllowanceQuery(tokenCanisterId).set(liveVal)
    if (sufficient(liveVal)) return
  } catch { /* live check unavailable — proceed to the prompt */ }

  // New approval needed: the user confirms and can edit amount and validity.
  const decision = await requestApproval({
    tokenAddress: tokenCanisterId,
    needed,
    transferFee,
    proposed: needed * 10n,
  })
  if (decision == null) throw new ApprovalDeclined()
  // Belt-and-braces for a money path: the dialog enforces this, but a short
  // allowance is exactly what traps the deviant sGLDT/EXE ledgers into an
  // ambiguous pending pull, so never let one through.
  if (decision.amount < needed) throw new Error('Approved amount is below what this trade needs.')

  const result = await ledger.icrc2_approve({
    fee: [], memo: [], from_subaccount: [], created_at_time: [],
    expected_allowance: [],
    expires_at: [decision.expiresAtNs],
    amount: decision.amount,
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
  store.userAllowanceQuery(tokenCanisterId).set({
    allowance: decision.amount,
    expiresAt: decision.expiresAtNs,
  })
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
): Promise<bigint> {
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, ICP_TRANSFER_FEE)

  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')

  const ledger = Actor.createActor(icpLedgerIdl, {
    agent,
    canisterId: ICP_LEDGER_CANISTER_ID,
  })

  const result = await ledger.transfer({
    to: hexToBytes(treasuryAccountIdHex),
    amount: { e8s: required },
    fee: { e8s: ICP_TRANSFER_FEE },
    memo: 0n,
    from_subaccount: [],
    created_at_time: [],
  })

  if ('Err' in (result as any)) {
    const err = (result as any).Err
    if ('InsufficientFunds' in err) {
      throw new Error(`Insufficient ICP balance. Available: ${Number(err.InsufficientFunds.balance.e8s) / 1e8} ICP`)
    }
    throw new Error(`ICP transfer failed: ${JSON.stringify(err, jsonSafe)}`)
  }

  return (result as any).Ok
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
): Promise<bigint> {
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, transferFee)

  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')

  const tokenActor = Actor.createActor(icrc1TransferIdl, {
    agent,
    canisterId: tokenCanisterId,
  })

  const result = await tokenActor.icrc1_transfer({
    from_subaccount: [],
    to: {
      owner: Principal.fromText(treasuryPrincipalText),
      subaccount: [],
    },
    amount: required,
    fee: [],
    memo: [],
    created_at_time: [],
  })

  if ('Err' in (result as any)) {
    const err = (result as any).Err
    if ('InsufficientFunds' in err) {
      throw new Error(`Insufficient token balance.`)
    }
    throw new Error(`Token transfer failed: ${JSON.stringify(err, jsonSafe)}`)
  }

  return (result as any).Ok
}

/**
 * Save every deposit to localStorage for recovery.
 * Keeps the last 50 deposits. Entries older than 21 days are pruned.
 */
function saveDepositToCache(tokenCanisterId: string, block: bigint, amount: bigint, assetType: string) {
  try {
    const CACHE_KEY = 'taco_deposit_history'
    const MAX_ENTRIES = 50
    const MAX_AGE_MS = 21 * 86_400_000 // 21 days (block validity window)

    const raw = localStorage.getItem(CACHE_KEY)
    const history: Array<{ token: string; block: string; amount: string; type: string; timestamp: number }> =
      raw ? JSON.parse(raw) : []

    // Add new entry
    history.unshift({
      token: tokenCanisterId,
      block: block.toString(),
      amount: amount.toString(),
      type: assetType,
      timestamp: Date.now(),
    })

    // Prune old entries + cap size
    const now = Date.now()
    const pruned = history.filter(e => now - e.timestamp < MAX_AGE_MS).slice(0, MAX_ENTRIES)
    // Recovery record: on a full storage, free exchange cache space and retry.
    setItemWithCacheEviction(CACHE_KEY, JSON.stringify(pruned))
  } catch { /* localStorage full or unavailable — ignore */ }
}

/**
 * Get cached deposit history for the Recover page.
 */
export function getDepositHistory(): Array<{ token: string; block: string; amount: string; type: string; timestamp: number }> {
  try {
    const raw = localStorage.getItem('taco_deposit_history')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/**
 * Remove a deposit from cache (after successful recovery or use).
 */
export function removeDepositFromCache(block: string) {
  try {
    const CACHE_KEY = 'taco_deposit_history'
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const history = JSON.parse(raw) as Array<{ block: string }>
    localStorage.setItem(CACHE_KEY, JSON.stringify(history.filter(e => e.block !== block)))
  } catch { /* ignore */ }
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

  saveDepositToCache(tokenCanisterId, block, amount, typeStr)
  return block
}

/**
 * Universal deposit function that routes to the correct transfer method
 * based on the token's asset type.
 * Every successful deposit is automatically saved to localStorage for recovery.
 */
export async function depositToken(
  tokenCanisterId: string,
  assetType: { ICP: null } | { ICRC12: null } | { ICRC3: null },
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
  treasuryAccountIdHex: string,
  treasuryPrincipalText: string,
): Promise<bigint> {
  const store = useExchangeStore()
  // Asks the canister before any funds move, and refreshes the fee and the
  // treasury if the saved ones are old.
  await store.assertCanTrade()
  // The amount was worked out with the fee the user saw. If the fresh fee
  // differs, stop here rather than charge something else.
  if (store.tradingFeeBps !== tradingFeeBps) {
    throw new Error('The trading fee changed. Check the amounts and try again. No funds were moved.')
  }
  treasuryAccountIdHex = store.treasuryAccountId || treasuryAccountIdHex
  treasuryPrincipalText = store.treasuryPrincipal || treasuryPrincipalText
  let block: bigint
  const typeStr = 'ICP' in assetType ? 'ICP' : 'ICRC3' in assetType ? 'ICRC3' : 'ICRC12'

  if ('ICP' in assetType) {
    block = await depositICP(tradeAmount, tradingFeeBps, treasuryAccountIdHex)
  } else {
    block = await depositICRC(tokenCanisterId, tradeAmount, tradingFeeBps, transferFee, treasuryPrincipalText)
  }

  // Always save to cache — the next step (addPosition/addLiquidity/etc.) might fail
  saveDepositToCache(tokenCanisterId, block, tradeAmount, typeStr)

  return block
}
