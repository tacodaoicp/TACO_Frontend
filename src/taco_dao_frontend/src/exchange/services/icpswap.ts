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

// BigInt-safe JSON.stringify for IC canister error objects
const safeStringify = (obj: unknown) =>
  JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v))

const ICPSWAP_FACTORY_ID = '4mmnk-kiaaa-aaaag-qbllq-cai'
const ICP_LEDGER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
// ICPSwap pools come in multiple fee tiers; getPool is keyed by (token0, token1, fee).
// Try each tier until we find a pool (0.3% first to match historical behaviour).
const ICPSWAP_FEE_TIERS = [3000, 10000, 500, 100]

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

export interface IcpSwapParams {
  sellTokenPrincipal: string
  buyTokenPrincipal: string
  amountIn: bigint
  minAmountOut: bigint
  onStep?: (step: string) => void
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
const PENDING_MAX = 30
const PENDING_MAX_AGE_MS = 21 * 86_400_000 // 21 days

export interface PendingIcpSwap { sell: string; buy: string; timestamp: number }

export function savePendingSwap(sell: string, buy: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    const list: PendingIcpSwap[] = raw ? JSON.parse(raw) : []
    const deduped = list.filter((e) => !(e.sell === sell && e.buy === buy))
    deduped.unshift({ sell, buy, timestamp: Date.now() })
    const now = Date.now()
    const pruned = deduped.filter((e) => now - e.timestamp < PENDING_MAX_AGE_MS).slice(0, PENDING_MAX)
    localStorage.setItem(PENDING_KEY, JSON.stringify(pruned))
  } catch { /* localStorage full or unavailable — ignore */ }
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
  const PoolResult = IDL.Variant({ ok: PoolData, err: IDL.Text })
  return IDL.Service({ getPool: IDL.Func([GetPoolArgs], [PoolResult], ['query']) })
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
 * On swap/withdraw failure, best-effort sweep to recover stranded funds, then throw.
 * Returns the gross amount out (before the output ledger's transfer fee).
 */
export async function icrc2Swap(params: IcpSwapParams): Promise<{ amountOut: bigint }> {
  const authedAgent = await getCachedAgent()
  if (!authedAgent) throw new Error('Not authenticated')
  const identity = await getCachedIdentity()
  const ownerPrincipal = identity.getPrincipal()
  if (ownerPrincipal.isAnonymous()) throw new Error('Not authenticated')

  params.onStep?.('Finding pool...')
  const poolId = await getPoolCanister(params.sellTokenPrincipal, params.buyTokenPrincipal)
  const poolData = poolCache.get(`${params.sellTokenPrincipal}-${params.buyTokenPrincipal}`)!
  const zeroForOne = isZeroForOne(params.sellTokenPrincipal, poolData)

  const sellTokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: params.sellTokenPrincipal })
  const poolActor = Actor.createActor(poolIDL, { agent: authedAgent, canisterId: poolId })

  // 1. Token fee
  params.onStep?.('Getting token fee...')
  const feeResult = (await sellTokenActor.icrc1_fee()) as any
  const tokenFee = typeof feeResult === 'bigint' ? feeResult : BigInt(feeResult)

  // 2. Approve pool for amountIn + fee
  params.onStep?.('Approving tokens...')
  const approvalResult = (await sellTokenActor.icrc2_approve({
    spender: { owner: Principal.fromText(poolId), subaccount: [] },
    amount: params.amountIn + tokenFee,
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    expected_allowance: [],
    expires_at: [],
  })) as any
  if ('Err' in approvalResult) throw new Error(`Approval failed: ${safeStringify(approvalResult.Err)}`)

  // 3. depositFrom (pool pulls via icrc2_transfer_from)
  // Persist the pair NOW (funds are about to move) so a tab-close mid-swap is
  // recoverable via the Recover page. Cleared after a successful withdraw.
  savePendingSwap(params.sellTokenPrincipal, params.buyTokenPrincipal)
  params.onStep?.('Depositing tokens...')
  const depositResult = (await poolActor.depositFrom({
    amount: params.amountIn,
    fee: tokenFee,
    token: params.sellTokenPrincipal,
  })) as any
  if ('err' in depositResult) throw new Error(`DepositFrom failed: ${safeStringify(depositResult.err)}`)

  // 4. Swap the actual deposited amount
  params.onStep?.('Executing swap...')
  const swapResult = (await poolActor.swap({
    amountIn: depositResult.ok.toString(),
    amountOutMinimum: params.minAmountOut.toString(),
    zeroForOne,
  })) as any
  if ('err' in swapResult) {
    await sweep({ token0Principal: params.sellTokenPrincipal, token1Principal: params.buyTokenPrincipal, poolId }).catch((err) => { console.error('[icpswap] sweep cleanup failed (funds may be recoverable via Recover):', err) })
    throw new Error(`Swap failed: ${safeStringify(swapResult.err)}`)
  }
  const amountOut = swapResult.ok as bigint

  // 5. Withdraw received tokens
  params.onStep?.('Withdrawing tokens...')
  const outTokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: params.buyTokenPrincipal })
  const outFeeResult = (await outTokenActor.icrc1_fee()) as any
  const outTokenFee = typeof outFeeResult === 'bigint' ? outFeeResult : BigInt(outFeeResult)
  const withdrawResult = (await poolActor.withdraw({
    amount: amountOut,
    fee: outTokenFee,
    token: params.buyTokenPrincipal,
  })) as any
  if ('err' in withdrawResult) {
    await sweep({ token0Principal: params.sellTokenPrincipal, token1Principal: params.buyTokenPrincipal, poolId }).catch((err) => { console.error('[icpswap] sweep cleanup failed (funds may be recoverable via Recover):', err) })
    throw new Error(`Withdraw failed: ${safeStringify(withdrawResult.err)}`)
  }

  // Funds delivered — clear the pending-swap marker.
  removePendingSwap(params.sellTokenPrincipal, params.buyTokenPrincipal)
  return { amountOut }
}

// ── Recovery (authenticated) ──

export interface SweepParams {
  token0Principal: string
  token1Principal: string
  poolId?: string
}

/**
 * Recover stranded funds: withdraw any unused pool balances, then deposit any
 * tokens sitting in the user's pool subaccount. Best-effort; logs per-token.
 */
export async function sweep(params: SweepParams): Promise<void> {
  const authedAgent = await getCachedAgent()
  if (!authedAgent) throw new Error('Not authenticated')
  const identity = await getCachedIdentity()
  const ownerPrincipal = identity.getPrincipal()
  if (ownerPrincipal.isAnonymous()) throw new Error('Not authenticated')

  const poolId = params.poolId ?? (await getPoolCanister(params.token0Principal, params.token1Principal))
  const poolActor = Actor.createActor(poolIDL, { agent: authedAgent, canisterId: poolId })

  // 1. Withdraw any unused pool balances
  const balanceResult = (await poolActor.getUserUnusedBalance(ownerPrincipal)) as any
  if ('ok' in balanceResult) {
    const { balance0, balance1 } = balanceResult.ok
    if (balance0 > 0n) {
      try { await poolActor.withdraw({ amount: balance0, fee: 0n, token: params.token0Principal }) }
      catch (e) { console.error('[icpswap.sweep] withdraw token0 failed:', e) }
    }
    if (balance1 > 0n) {
      try { await poolActor.withdraw({ amount: balance1, fee: 0n, token: params.token1Principal }) }
      catch (e) { console.error('[icpswap.sweep] withdraw token1 failed:', e) }
    }
  }

  // 2. Deposit any tokens stuck in the user's pool subaccount
  const userSubaccount = principalToSubAccount(ownerPrincipal)
  for (const tokenPrincipal of [params.token0Principal, params.token1Principal]) {
    try {
      const tokenActor = Actor.createActor(icrcIDL, { agent: authedAgent, canisterId: tokenPrincipal })
      const bal = (await tokenActor.icrc1_balance_of({
        owner: Principal.fromText(poolId),
        subaccount: [Array.from(userSubaccount)],
      })) as bigint
      if (bal > 0n) {
        await poolActor.deposit({ amount: bal, fee: 0n, token: tokenPrincipal })
      }
    } catch (e) {
      console.error('[icpswap.sweep] subaccount deposit failed for', tokenPrincipal, e)
    }
  }
}
