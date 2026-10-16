/**
 * ICPSwap client — exchange-app-local, Pinia-free.
 *
 * Ported from src/stores/icpswap.store.ts (proven in production via the DAO
 * wallet's split-swap). The ONLY change is the identity source: this module
 * uses the exchange app's shared auth-cache instead of the DAO Pinia store, so
 * it works inside the exchange app's own Pinia context.
 *
 *   • Quotes / pool lookup use an ANONYMOUS agent (quote/metadata/getPool are
 *     query methods) — so the CrossDEX quote grid works pre-auth like Easy mode.
 *   • The swap pipeline (approve → depositFrom → swap → withdraw) and sweep use
 *     the authenticated cached agent.
 */

import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { principalToSubAccount } from '@dfinity/utils'
import { getCachedAgent, getCachedIdentity, getNetworkHost } from '../../shared/auth-cache'
import { getEffectiveNetwork } from '../../config/network-config'
import { icrcIDL } from '../../shared/icrc-idl'
import { setItemWithCacheEviction } from '../utils/persistCache'

// BigInt-safe JSON.stringify for IC canister error objects
const safeStringify = (obj: unknown) =>
  JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v))

const ICPSWAP_FACTORY_ID = '4mmnk-kiaaa-aaaag-qbllq-cai'
const ICP_LEDGER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
// ICPSwap pools come in multiple fee tiers; getPool is keyed by (token0, token1, fee).
// Try each tier until we find a pool (0.3% first to match historical behaviour).
const ICPSWAP_FEE_TIERS = [3000, 10000, 500, 100]
// Approvals for a swap expire after this long.
const APPROVAL_TTL_MS = 30 * 60_000
/** With no replica time sync a device clock running far behind would make a 30 minute approval
 *  expired on arrival; then the approval gets a day (it is the exact amount, for this pool only). */
const APPROVAL_TTL_UNSYNCED_MS = 24 * 60 * 60_000

interface Token {
  address: string
  standard: string
}

interface PoolData {
  key: string
  token0: Token
  token1: Token
  fee: number
  tickSpacing: number
  canisterId: string
}

/** Filled in by icrc2Swap for the caller's recovery and reporting. */
export interface IcpSwapTrack {
  /** The last step that was started: approve, deposit (depositFrom), swap or withdraw. */
  step?: 'approve' | 'deposit' | 'swap' | 'withdraw'
  /** An earlier swap on this pair had already left a marker (its funds may still be in the pool). */
  hadMarker?: boolean
  /** The pair marker was written before the deposit. */
  markerWritten?: boolean
  /** The swap filled for this much (the withdraw may still have failed). */
  swappedOut?: bigint
  /** The pool answered the swap with an error: nothing was sold (the deposit sits unused). */
  swapRefused?: boolean
}

export interface IcpSwapParams {
  sellTokenPrincipal: string
  buyTokenPrincipal: string
  amountIn: bigint
  minAmountOut: bigint
  onStep?: (step: string) => void
  /** Awaited after the approve and before any funds move; a throw, or false,
   *  stops the swap with nothing moved but the approve fee and leaves no marker. */
  beforeDeposit?: () => Promise<void | boolean>
  /** Stop before the deposit when the pair marker could not be written. */
  requireMarker?: boolean
  track?: IcpSwapTrack
  /** A run's own agent and principal (one identity object); default: the cached session. */
  agent?: HttpAgent
  owner?: Principal
}

/** Error for a swap that stopped before any funds moved (only the approve fee was spent). */
export class IcpSwapNotStarted extends Error {
  readonly notStarted = true
  constructor(message = 'Not started, your funds stayed in your wallet', readonly journal = false) { super(message); this.name = 'IcpSwapNotStarted' }
}
/** depositFrom refused: the pool did not take the funds (the caller still checks with one sweep). */
export class IcpSwapDepositRefused extends Error {
  readonly depositRefused = true
  constructor(message: string) { super(message); this.name = 'IcpSwapDepositRefused' }
}

// ── Module state ──
const poolCache = new Map<string, PoolData>()
let _anonAgent: HttpAgent | null = null

// ── Pending-swap cache (localStorage) ──
// An ICPSwap swap moves funds across approve → depositFrom → swap → withdraw.
// If the user closes the tab mid-flight, the in-memory recovery never runs, so
// we persist the pair the moment funds start moving and clear it on success.
// The Recover page reads this list and offers a sweep per pair.
const PENDING_KEY = 'taco_icpswap_pending'
// Markers leave only by age (21 days, the recovery window) or when their funds
// came back; the count ceiling is far above what normal use reaches.
const PENDING_MAX = 500
const PENDING_MAX_AGE_MS = 21 * 86_400_000 // 21 days

export interface PendingIcpSwap { sell: string; buy: string; timestamp: number }

/** Save the pair marker. Returns whether it was written (a full or blocked
 *  storage returns false, so a strict caller can stop before funds move). */
export function savePendingSwap(sell: string, buy: string): boolean {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    const list: PendingIcpSwap[] = raw ? JSON.parse(raw) : []
    const deduped = list.filter((e) => !(e.sell === sell && e.buy === buy))
    deduped.unshift({ sell, buy, timestamp: Date.now() })
    const now = Date.now()
    const pruned = deduped.filter((e) => now - e.timestamp < PENDING_MAX_AGE_MS).slice(0, PENDING_MAX)
    // Recovery record: on a full storage, free exchange cache space and retry.
    setItemWithCacheEviction(PENDING_KEY, JSON.stringify(pruned))
    return true
  } catch { return false }
}

export function hasPendingSwap(sell: string, buy: string): boolean {
  return getPendingSwaps().some(e => e.sell === sell && e.buy === buy)
}

export function getPendingSwaps(): PendingIcpSwap[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function removePendingSwap(sell: string, buy: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return
    const list = JSON.parse(raw) as PendingIcpSwap[]
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.filter((e) => !(e.sell === sell && e.buy === buy))))
  } catch { /* ignore */ }
}

async function getAnonAgent(): Promise<HttpAgent> {
  if (_anonAgent) return _anonAgent
  // Anonymous, read-only (getPool / quote / metadata are queries). Skip per-query
  // signature verification, matching exchange.store.getQueryActor.
  const agent = new HttpAgent({ host: getNetworkHost(), verifyQuerySignatures: false })
  if (getEffectiveNetwork() === 'local') await agent.fetchRootKey()
  _anonAgent = agent
  return agent
}

// ── IDL factories (ICPSwap-specific) ──
const factoryIDL = ({ IDL }: any) => {
  const Token = IDL.Record({ address: IDL.Text, standard: IDL.Text })
  const GetPoolArgs = IDL.Record({ token0: Token, token1: Token, fee: IDL.Nat })
  const PoolData = IDL.Record({
    key: IDL.Text,
    token0: Token,
    token1: Token,
    fee: IDL.Nat,
    tickSpacing: IDL.Int,
    canisterId: IDL.Principal,
  })
  const FactoryError = IDL.Variant({
    CommonError: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text,
    InsufficientFunds: IDL.Null,
  })
  const PoolResult = IDL.Variant({ ok: PoolData, err: IDL.Text })
  const PoolsResult = IDL.Variant({ ok: IDL.Vec(PoolData), err: FactoryError })
  return IDL.Service({
    getPool: IDL.Func([GetPoolArgs], [PoolResult], ['query']),
    getPools: IDL.Func([], [PoolsResult], ['query']),
  })
}

const poolIDL = ({ IDL }: any) => {
  const SwapArgs = IDL.Record({
    amountIn: IDL.Text,
    amountOutMinimum: IDL.Text,
    zeroForOne: IDL.Bool,
  })
  const DepositArgs = IDL.Record({ amount: IDL.Nat, fee: IDL.Nat, token: IDL.Text })
  const WithdrawArgs = IDL.Record({ amount: IDL.Nat, fee: IDL.Nat, token: IDL.Text })
  const ICPSwapError = IDL.Variant({
    CommonError: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text,
    InsufficientFunds: IDL.Null,
  })
  const NatResult = IDL.Variant({ ok: IDL.Nat, err: ICPSwapError })
  const UserBalance = IDL.Record({ balance0: IDL.Nat, balance1: IDL.Nat })
  const BalanceResult = IDL.Variant({ ok: UserBalance, err: IDL.Text })
  const PoolMetadata = IDL.Record({
    token0: IDL.Record({ address: IDL.Text, standard: IDL.Text }),
    token1: IDL.Record({ address: IDL.Text, standard: IDL.Text }),
    fee: IDL.Nat,
    tick: IDL.Int,
    liquidity: IDL.Nat,
    sqrtPriceX96: IDL.Nat,
  })
  const MetadataResult = IDL.Variant({ ok: PoolMetadata, err: ICPSwapError })
  return IDL.Service({
    swap: IDL.Func([SwapArgs], [NatResult], []),
    deposit: IDL.Func([DepositArgs], [NatResult], []),
    depositFrom: IDL.Func([DepositArgs], [NatResult], []),
    withdraw: IDL.Func([WithdrawArgs], [NatResult], []),
    getUserUnusedBalance: IDL.Func([IDL.Principal], [BalanceResult], ['query']),
    metadata: IDL.Func([], [MetadataResult], ['query']),
    quote: IDL.Func([SwapArgs], [NatResult], ['query']),
  })
}

function standardOf(addr: string): string {
  return addr === ICP_LEDGER_ID ? 'ICP' : 'ICRC1'
}

// ── Pool resolution (anonymous; query) ──
export async function getPoolCanister(token0Principal: string, token1Principal: string): Promise<string> {
  const cacheKey = `${token0Principal}-${token1Principal}`
  const cached = poolCache.get(cacheKey)
  if (cached) return cached.canisterId

  const agent = await getAnonAgent()
  const factoryActor = Actor.createActor(factoryIDL, { agent, canisterId: ICPSWAP_FACTORY_ID })
  let lastErr: any = null

  for (const fee of ICPSWAP_FEE_TIERS) {
    const poolArgs = {
      token0: { address: token0Principal, standard: standardOf(token0Principal) },
      token1: { address: token1Principal, standard: standardOf(token1Principal) },
      fee,
    }
    try {
      const result = (await factoryActor.getPool(poolArgs)) as any
      if ('ok' in result) {
        const poolData: PoolData = { ...result.ok, canisterId: result.ok.canisterId.toText() }
        poolCache.set(cacheKey, poolData)
        return poolData.canisterId
      }
      lastErr = result.err
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(
    `No ICPSwap pool for token pair across fee tiers (${ICPSWAP_FEE_TIERS.join(', ')}): ${safeStringify(lastErr)}`,
  )
}

function isZeroForOne(sellTokenPrincipal: string, poolData: PoolData): boolean {
  return sellTokenPrincipal === poolData.token0.address
}

// ── Full pool enumeration (anonymous; used by the Recover page's Recover All) ──

export interface AllPoolData {
  canisterId: string
  token0: Token
  token1: Token
  fee: bigint
}

/**
 * List every pool the factory knows (one query, ~850 pools). Returns [] on any
 * failure so callers can treat "factory unreachable" as "nothing to scan".
 */
export async function getAllPools(): Promise<AllPoolData[]> {
  try {
    const agent = await getAnonAgent()
    const factoryActor = Actor.createActor(factoryIDL, { agent, canisterId: ICPSWAP_FACTORY_ID })
    const res = (await factoryActor.getPools()) as any
    if (!('ok' in res)) {
      console.warn('[icpswap.getAllPools] factory err:', safeStringify(res.err))
      return []
    }
    return res.ok.map((p: any) => ({
      canisterId: p.canisterId.toText(),
      token0: { address: p.token0.address, standard: p.token0.standard },
      token1: { address: p.token1.address, standard: p.token1.standard },
      fee: p.fee as bigint,
    }))
  } catch (e) {
    console.error('[icpswap.getAllPools] failed:', e)
    return []
  }
}

/**
 * One pool's unused balance for `owner` (anonymous query). Null on any failure
 * so a scan over many pools skips unreadable ones instead of dying.
 */
export async function getUnusedBalance(
  poolId: string,
  owner: Principal,
): Promise<{ balance0: bigint; balance1: bigint } | null> {
  try {
    const agent = await getAnonAgent()
    const poolActor = Actor.createActor(poolIDL, { agent, canisterId: poolId })
    const res = (await poolActor.getUserUnusedBalance(owner)) as any
    if (!('ok' in res)) return null
    return { balance0: res.ok.balance0 as bigint, balance1: res.ok.balance1 as bigint }
  } catch {
    return null
  }
}

// ── Stuck-withdraw inspection (read-only; born from the TACOV2:2134 incident) ──
// A pool withdraw can die between "internal balance debited" and "ledger
// transfer executed" (status CreditCompleted). Such records are invisible to
// every balance query AND to the pool's own getFailedTransactions, so listing
// them is the only way a user learns where the funds sit. Display-only: the fix
// is ICPSwap support's, with the record id as the claim.
const poolTxIDL = ({ IDL }: any) => {
  const AccountRef = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })
  // Records may be REDUCED (Candid skips wire fields we don't declare), but
  // variant tag sets must be COMPLETE — an unknown tag throws for the whole
  // response. Tag sets below are the live pool candid (v3.7.0); other pool
  // versions can differ, which is why callers treat a throw as "no info".
  const Transfer = IDL.Record({
    token: IDL.Principal,
    from: AccountRef,
    to: AccountRef,
    amount: IDL.Nat,
    fee: IDL.Nat,
  })
  const WithdrawStatus = IDL.Variant({
    Completed: IDL.Null,
    Created: IDL.Null,
    CreditCompleted: IDL.Null,
    Failed: IDL.Null,
  })
  const WithdrawInfo = IDL.Record({ status: WithdrawStatus, transfer: Transfer, err: IDL.Opt(IDL.Text) })
  // Full 12-tag Action set; payloads we never read are Reserved (top type —
  // decodes and discards anything, across pool versions).
  const Action = IDL.Variant({
    AddLimitOrder: IDL.Reserved,
    AddLiquidity: IDL.Reserved,
    Claim: IDL.Reserved,
    DecreaseLiquidity: IDL.Reserved,
    Deposit: IDL.Reserved,
    ExecuteLimitOrder: IDL.Reserved,
    OneStepSwap: IDL.Reserved,
    Refund: IDL.Reserved,
    RemoveLimitOrder: IDL.Reserved,
    Swap: IDL.Reserved,
    TransferPosition: IDL.Reserved,
    Withdraw: WithdrawInfo,
  })
  // timestamp is candid `int` (Motoko Time.Time), NOT nat — nat here throws on decode.
  const Transaction = IDL.Record({ id: IDL.Nat, timestamp: IDL.Int, action: Action })
  const PoolError = IDL.Variant({
    CommonError: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text,
    InsufficientFunds: IDL.Null,
  })
  const TxResult = IDL.Variant({ ok: IDL.Vec(IDL.Tuple(IDL.Nat, Transaction)), err: PoolError })
  return IDL.Service({ getTransactionsByOwner: IDL.Func([IDL.Principal], [TxResult], ['query']) })
}

export interface StuckPoolWithdraw {
  recordId: bigint
  timestamp: bigint // ns
  tokenAddress: string
  amount: bigint
  status: string // 'Created' | 'CreditCompleted' | 'Failed'
}

// A Created/CreditCompleted record younger than this may just be a swap in
// flight in another tab; don't alarm the user about it.
const STUCK_MIN_AGE_NS = 5n * 60n * 1_000_000_000n

/**
 * List `owner`'s withdraw records inside one pool that never reached Completed
 * (anonymous query). [] = pool readable, nothing stuck. null = pool unreadable
 * (different pool version or offline) — "no info", NOT "no problem".
 */
export async function getStuckPoolWithdraws(
  poolId: string,
  owner: Principal,
): Promise<StuckPoolWithdraw[] | null> {
  try {
    const agent = await getAnonAgent()
    const actor = Actor.createActor(poolTxIDL, { agent, canisterId: poolId })
    const res = (await actor.getTransactionsByOwner(owner)) as any
    if (!('ok' in res)) return []
    const nowNs = BigInt(Date.now()) * 1_000_000n
    const stuck: StuckPoolWithdraw[] = []
    for (const [, tx] of res.ok as Array<[bigint, any]>) {
      const w = tx.action && 'Withdraw' in tx.action ? tx.action.Withdraw : null
      if (!w || 'Completed' in w.status) continue
      const ts = tx.timestamp as bigint
      if (nowNs - ts < STUCK_MIN_AGE_NS) continue
      stuck.push({
        recordId: tx.id as bigint,
        timestamp: ts,
        tokenAddress: (w.transfer.token as Principal).toText(),
        amount: w.transfer.amount as bigint,
        status: Object.keys(w.status)[0],
      })
    }
    return stuck
  } catch (e) {
    console.warn('[icpswap.getStuckPoolWithdraws] unreadable pool', poolId, e)
    return null
  }
}

// ── Quotes (anonymous) ──

/**
 * Lean amount-out quote (single pool `quote` query). Returns 0n on any failure
 * (incl. no pool) so the grid stays well-formed.
 */
export async function getQuoteAmount(
  sellTokenPrincipal: string,
  buyTokenPrincipal: string,
  amountIn: bigint,
): Promise<bigint> {
  if (amountIn <= 0n) return 0n
  try {
    const poolId = await getPoolCanister(sellTokenPrincipal, buyTokenPrincipal)
    const poolData = poolCache.get(`${sellTokenPrincipal}-${buyTokenPrincipal}`)!
    const zeroForOne = isZeroForOne(sellTokenPrincipal, poolData)
    const agent = await getAnonAgent()
    const poolActor = Actor.createActor(poolIDL, { agent, canisterId: poolId })
    const res = (await poolActor.quote({
      amountIn: amountIn.toString(),
      amountOutMinimum: '0',
      zeroForOne,
    })) as any
    if ('err' in res) return 0n
    return BigInt(res.ok)
  } catch {
    return 0n
  }
}

/**
 * Quote the same pair at many input amounts in parallel. Failures → 0n.
 */
export async function quoteGrid(
  sellTokenPrincipal: string,
  buyTokenPrincipal: string,
  amounts: bigint[],
): Promise<bigint[]> {
  const settled = await Promise.allSettled(
    amounts.map((amt) => getQuoteAmount(sellTokenPrincipal, buyTokenPrincipal, amt)),
  )
  return settled.map((s) => (s.status === 'fulfilled' ? s.value : 0n))
}

// ── Swap (authenticated) ──

/**
 * Execute an ICRC2-based swap on ICPSwap: approve → depositFrom → swap → withdraw.
 * Throws on any failure without sweeping; the caller runs the recovery
 * (sweepWithRetry). `beforeDeposit`, when given, runs between the approve and
 * the first move of funds. Returns the gross amount out (before the output
 * ledger's transfer fee).
 */
async function resolveAuth(agent?: HttpAgent, owner?: Principal): Promise<{ agent: HttpAgent; owner: Principal }> {
  if (agent && owner) {
    if (owner.isAnonymous()) throw new Error('Not authenticated')
    return { agent, owner }
  }
  const authedAgent = await getCachedAgent()
  if (!authedAgent) throw new Error('Not authenticated')
  const identity = await getCachedIdentity()
  const ownerPrincipal = identity.getPrincipal()
  if (ownerPrincipal.isAnonymous()) throw new Error('Not authenticated')
  return { agent: authedAgent, owner: ownerPrincipal }
}

export async function icrc2Swap(params: IcpSwapParams): Promise<{ amountOut: bigint }> {
  const { agent: authedAgent } = await resolveAuth(params.agent, params.owner)
  const track = params.track ?? {}

  params.onStep?.('Finding the pool…')
  const poolId = await getPoolCanister(params.sellTokenPrincipal, params.buyTokenPrincipal)
  const poolData = poolCache.get(`${params.sellTokenPrincipal}-${params.buyTokenPrincipal}`)!
  const zeroForOne = isZeroForOne(params.sellTokenPrincipal, poolData)

  const sellTokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: params.sellTokenPrincipal })
  const poolActor = Actor.createActor(poolIDL, { agent: authedAgent, canisterId: poolId })

  // 1. Token fee
  params.onStep?.('Reading the fee…')
  const feeResult = (await sellTokenActor.icrc1_fee()) as any
  const tokenFee = typeof feeResult === 'bigint' ? feeResult : BigInt(feeResult)

  // 2. Approve pool for amountIn + fee. It expires after 30 minutes, so an
  //    approval left by a swap that stopped before its deposit lapses on its own.
  //    The ledger reads expires_at on its own clock: the agent's offset to the
  //    replica applies (a run agent syncs it), and an unsynced agent gets a day.
  params.onStep?.('Approving…')
  track.step = 'approve'
  const synced = typeof (authedAgent as any).hasSyncedTime === 'function' && !!(authedAgent as any).hasSyncedTime()
  const skewMs = synced ? Number((authedAgent as any).getTimeDiffMsecs?.() ?? 0) || 0 : 0
  const expiresAtMs = Date.now() + skewMs + (synced ? APPROVAL_TTL_MS : APPROVAL_TTL_UNSYNCED_MS)
  const approvalResult = (await sellTokenActor.icrc2_approve({
    spender: { owner: Principal.fromText(poolId), subaccount: [] },
    amount: params.amountIn + tokenFee,
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    expected_allowance: [],
    expires_at: [BigInt(Math.round(expiresAtMs)) * 1_000_000n],
  })) as any
  if ('Err' in approvalResult) throw new Error(`Approval failed: ${safeStringify(approvalResult.Err)}`)
  if (params.beforeDeposit && (await params.beforeDeposit()) === false) throw new IcpSwapNotStarted()

  // 3. depositFrom (pool pulls via icrc2_transfer_from)
  // Persist the pair NOW (funds are about to move) so a tab-close mid-swap is
  // recoverable via the Recover page. A marker an earlier failed swap on this
  // pair left behind stays until its funds come back.
  track.hadMarker = hasPendingSwap(params.sellTokenPrincipal, params.buyTokenPrincipal)
  track.markerWritten = savePendingSwap(params.sellTokenPrincipal, params.buyTokenPrincipal)
  if (!track.markerWritten && params.requireMarker) {
    throw new IcpSwapNotStarted('ICPSwap: the recovery note could not be saved, so this part was not sent', true)
  }
  params.onStep?.('Depositing…')
  track.step = 'deposit'
  const depositResult = (await poolActor.depositFrom({
    amount: params.amountIn,
    fee: tokenFee,
    token: params.sellTokenPrincipal,
  })) as any
  if ('err' in depositResult) throw new IcpSwapDepositRefused(`DepositFrom failed: ${safeStringify(depositResult.err)}`)

  // 4. Swap the actual deposited amount
  params.onStep?.('Swapping…')
  track.step = 'swap'
  const swapResult = (await poolActor.swap({
    amountIn: depositResult.ok.toString(),
    amountOutMinimum: params.minAmountOut.toString(),
    zeroForOne,
  })) as any
  // No internal sweep here: the CrossDEX leg catch (this function's only
  // caller) runs the retried sweep for every failure, and sweeping twice made
  // the second pass find nothing and report the funds as still stranded.
  if ('err' in swapResult) {
    track.swapRefused = true
    throw new Error(`Swap failed: ${safeStringify(swapResult.err)}`)
  }
  const amountOut = swapResult.ok as bigint
  track.swappedOut = amountOut

  // 5. Withdraw received tokens
  params.onStep?.('Withdrawing…')
  track.step = 'withdraw'
  const outTokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: params.buyTokenPrincipal })
  const outFeeResult = (await outTokenActor.icrc1_fee()) as any
  const outTokenFee = typeof outFeeResult === 'bigint' ? outFeeResult : BigInt(outFeeResult)
  const withdrawResult = (await poolActor.withdraw({
    amount: amountOut,
    fee: outTokenFee,
    token: params.buyTokenPrincipal,
  })) as any
  if ('err' in withdrawResult) {
    throw new Error(`Withdraw failed: ${safeStringify(withdrawResult.err)}`)
  }

  // Funds delivered: clear the pair marker, unless an earlier failed swap on
  // this pair left it (those funds may still sit in the pool).
  if (!track.hadMarker) removePendingSwap(params.sellTokenPrincipal, params.buyTokenPrincipal)
  return { amountOut }
}

// ── Recovery (authenticated) ──

export interface SweepParams {
  token0Principal: string
  token1Principal: string
  poolId?: string
}

/** What a sweep found and moved, per token (amounts as found, before the ledger fee). */
export interface SweepReport {
  found: Array<{ token: string; amount: bigint }>
  moved: Array<{ token: string; amount: bigint }>
  /** Passes that read every balance and found nothing (a pass that threw does not count). */
  emptyLooks?: number
  /** sweepWithRetry: what the last pass threw (unset when the last pass did not throw). */
  lastError?: unknown
}
export interface SweepOptions {
  report?: SweepReport
  /** A run's own agent and principal; default: the cached session. */
  agent?: HttpAgent
  owner?: Principal
}

/**
 * Recover stranded funds. Returns true only when something recoverable was
 * found AND every attempted move succeeded, so callers can safely clear the
 * pending-swap marker on true and keep it on false.
 *
 * Order matters: first deposit anything sitting in the user's pool subaccount
 * (a successful deposit only moves funds INTO the pool's unused balance), then
 * withdraw the unused balances to the wallet.
 *
 * Two past bugs fixed here: withdraws now use the POOL's canonical token
 * order (getUserUnusedBalance slots are pool-ordered; the caller's pair can be
 * reversed, which made withdraws use the wrong token id and always fail), and
 * they pass the token's real ledger fee (a fee of 0 makes ledgers refuse).
 */
export async function sweep(params: SweepParams, opts: SweepOptions = {}): Promise<boolean> {
  const report = opts.report
  const { agent: authedAgent, owner: ownerPrincipal } = await resolveAuth(opts.agent, opts.owner)

  const poolId = params.poolId ?? (await getPoolCanister(params.token0Principal, params.token1Principal))
  const poolActor = Actor.createActor(poolIDL, { agent: authedAgent, canisterId: poolId })

  // Canonical token order comes from the pool itself, never from the caller.
  const metaResult = (await poolActor.metadata()) as any
  if (!('ok' in metaResult)) throw new Error(`Pool metadata failed: ${safeStringify(metaResult.err)}`)
  const canonical0: string = metaResult.ok.token0.address
  const canonical1: string = metaResult.ok.token1.address

  const feeCache = new Map<string, bigint>()
  async function ledgerFee(tokenPrincipal: string): Promise<bigint> {
    const cached = feeCache.get(tokenPrincipal)
    if (cached != null) return cached
    const tokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: tokenPrincipal })
    const f = (await tokenActor.icrc1_fee()) as any
    const fee = typeof f === 'bigint' ? f : BigInt(f)
    feeCache.set(tokenPrincipal, fee)
    return fee
  }

  let foundAny = false
  let allAttemptedOk = true
  let readsOk = true

  // 1. Deposit any tokens stuck in the user's pool subaccount FIRST, so the
  //    withdraw pass below can pay them out in the same sweep.
  const userSubaccount = principalToSubAccount(ownerPrincipal)
  for (const tokenPrincipal of [canonical0, canonical1]) {
    try {
      const tokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: tokenPrincipal })
      const bal = (await tokenActor.icrc1_balance_of({
        owner: Principal.fromText(poolId),
        subaccount: [Array.from(userSubaccount)],
      })) as bigint
      const fee = await ledgerFee(tokenPrincipal)
      if (bal > fee) {
        foundAny = true
        report?.found.push({ token: tokenPrincipal, amount: bal })
        const r = (await poolActor.deposit({ amount: bal, fee, token: tokenPrincipal })) as any
        if (!('ok' in r)) {
          allAttemptedOk = false
          console.error('[icpswap.sweep] subaccount deposit refused for', tokenPrincipal, safeStringify(r.err))
        }
      }
    } catch (e) {
      allAttemptedOk = false
      readsOk = false
      console.error('[icpswap.sweep] subaccount deposit failed for', tokenPrincipal, e)
    }
  }

  // 2. Withdraw unused balances, slots mapped to the pool's canonical order.
  const balanceResult = (await poolActor.getUserUnusedBalance(ownerPrincipal)) as any
  if (!('ok' in balanceResult)) throw new Error(`getUserUnusedBalance failed: ${safeStringify(balanceResult.err)}`)
  const slots: Array<{ amount: bigint; token: string }> = [
    { amount: balanceResult.ok.balance0 as bigint, token: canonical0 },
    { amount: balanceResult.ok.balance1 as bigint, token: canonical1 },
  ]
  for (const slot of slots) {
    try {
      if (slot.amount <= 0n) continue
      const fee = await ledgerFee(slot.token)
      // Dust at or below the ledger fee cannot be paid out; treat as zero.
      if (slot.amount <= fee) continue
      foundAny = true
      report?.found.push({ token: slot.token, amount: slot.amount })
      const r = (await poolActor.withdraw({ amount: slot.amount, fee, token: slot.token })) as any
      if (!('ok' in r)) {
        allAttemptedOk = false
        console.error('[icpswap.sweep] withdraw refused for', slot.token, safeStringify(r.err))
      } else {
        report?.moved.push({ token: slot.token, amount: slot.amount })
      }
    } catch (e) {
      allAttemptedOk = false
      console.error('[icpswap.sweep] withdraw failed for', slot.token, e)
    }
  }

  if (report && !foundAny && readsOk) report.emptyLooks = (report.emptyLooks ?? 0) + 1
  return foundAny && allAttemptedOk
}

/**
 * sweep, retried. The pool credits a lost-response depositFrom asynchronously,
 * so the first look often races it; a few spaced retries make leg recovery
 * automatic instead of a manual Recover-page trip. No sleep after the final
 * attempt. What the last attempt threw goes to `opts.report.lastError`, so a
 * caller can tell a dead session from a pool that had nothing.
 */
export async function sweepWithRetry(params: SweepParams, attempts = 3, delayMs = 4000, opts: SweepOptions = {}): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const ok = await sweep(params, opts)
      if (opts.report) opts.report.lastError = undefined
      if (ok) return true
    } catch (e) {
      if (opts.report) opts.report.lastError = e
      console.error(`[icpswap.sweepWithRetry] attempt ${i + 1} failed:`, e)
    }
    if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return false
}
