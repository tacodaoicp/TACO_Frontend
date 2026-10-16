/**
 * Sell many quotes: the three venue grids per token (4.1 of the plan) and the
 * exact per leg requote used by preflight (5.2 steps 4 and 8).
 *
 * Per token: the Neutrinite follow state first; then in parallel one
 * getExpectedReceiveAmountBatchMulti (10 fractions, 5 routes), the ICPSwap grid
 * on raw − fee, and Neutrinite by follow state: none or tooSlow no quotes,
 * unknown or slow only the 100% point, fast the 100% point first and the other
 * nine only when it returns more than 0. Empty TACO fractions are asked once
 * more in a second, smaller batch. A token gets 20 s.
 *
 * Network effects go through injected deps (the composable binds the services).
 */
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import type { AssetQuotes, FollowState, AssetPlan } from './multiSellPlanner'
import { CROSSDEX_GRID_BPS, CROSSDEX_MAX_ROUTES } from './crossDexOptimizer'
import type { Clock } from './crossDexLegRunner'
import { clockTimeout } from './crossDexLegRunner'

export interface QuoteDeps {
  batchMulti(requests: Array<{ tokenSell: string; tokenBuy: string; amountSell: bigint }>, maxRoutes: bigint): Promise<any[]>
  icpswapQuote(sell: string, buy: string, amount: bigint): Promise<bigint>
  neuQuote(sell: string, buy: string, amount: bigint): Promise<{ out: bigint; routeTokens: string[] | null }>
  followState(ledger: string): Promise<FollowState>
  simulateSplitRoutes(splits: Array<{ amountIn: bigint; route: Array<{ tokenIn: string; tokenOut: string }> }>): Promise<{ perLegOut: bigint[]; totalOut: bigint; error: string }>
  /** Runs `fn` when a slot of the shared ICPSwap and Neutrinite grid limit (4 tokens) is free. */
  gridSlot<T>(fn: () => Promise<T>): Promise<T>
  clock: Clock
}

export const QUOTE_TIMEOUT_MS = 20_000

export async function fetchAssetQuotes(token: TokenInfo, total: bigint, target: TokenInfo, deps: QuoteDeps): Promise<{ quotes: AssetQuotes; follow: FollowState }> {
  const run = async () => {
    const sell = token.address, buy = target.address
    const follow = await deps.followState(sell)
    const requests = CROSSDEX_GRID_BPS.map(bp => ({ bp, amt: (total * bp) / 10000n })).filter(r => r.amt > 0n)
    const icpAmounts = CROSSDEX_GRID_BPS.map(bp => {
      const raw = (total * bp) / 10000n
      return raw > token.transfer_fee ? raw - token.transfer_fee : 0n
    })
    const neuAmounts = CROSSDEX_GRID_BPS.map(bp => (total * bp) / 10000n)
    const tacoP = deps.batchMulti(requests.map(r => ({ tokenSell: sell, tokenBuy: buy, amountSell: r.amt })), CROSSDEX_MAX_ROUTES)
    const icpP = deps.gridSlot(() => Promise.all(icpAmounts.map(a => deps.icpswapQuote(sell, buy, a).catch(() => 0n))))
    const neuP = deps.gridSlot(async () => {
      const zeros = { outs: neuAmounts.map(() => 0n), routes: neuAmounts.map(() => null as string[] | null) }
      if (follow === 'none' || follow === 'tooSlow') return zeros
      const last = neuAmounts.length - 1
      const full = await deps.neuQuote(sell, buy, neuAmounts[last]).catch(() => ({ out: 0n, routeTokens: null }))
      const outs = neuAmounts.map(() => 0n)
      const routes = neuAmounts.map(() => null as string[] | null)
      outs[last] = full.out; routes[last] = full.routeTokens
      if (follow !== 'fast' || full.out <= 0n) return { outs, routes }
      const rest = await Promise.all(neuAmounts.slice(0, last).map(a => deps.neuQuote(sell, buy, a).catch(() => ({ out: 0n, routeTokens: null }))))
      rest.forEach((r, k) => { outs[k] = r.out; routes[k] = r.routeTokens })
      return { outs, routes }
    })
    const [batch0, icpGrid, neu] = await Promise.all([tacoP, icpP, neuP])
    const batch = [...(batch0 ?? [])]
    // Fractions the instruction guard left empty: ask once more in a smaller batch.
    const empty = requests.map((r, k) => ({ r, k })).filter(({ k }) => !(batch[k]?.routes?.length))
    if (empty.length > 0 && empty.length < requests.length + 1) {
      try {
        const again = await deps.batchMulti(empty.map(({ r }) => ({ tokenSell: sell, tokenBuy: buy, amountSell: r.amt })), CROSSDEX_MAX_ROUTES)
        empty.forEach(({ k }, j) => { if (again?.[j]?.routes?.length) batch[k] = again[j] })
      } catch { /* still empty: no TACO route at those fractions */ }
    }
    const quotes: AssetQuotes = {
      address: sell,
      total,
      quotedAt: deps.clock.now(),
      requests,
      batch,
      icpGrid,
      neuGrid: neu.outs,
      neuRouteTokens: neu.routes,
    }
    return { quotes, follow }
  }
  return clockTimeout(deps.clock, run(), QUOTE_TIMEOUT_MS, `quote ${token.symbol}`)
}

/** One exact query per leg at its planned amount (second in line TACO legs skipped).
 *  Returns the fresh gross output per leg, null where the query failed. */
export async function verifyLegs(
  asset: AssetPlan, token: TokenInfo, target: TokenInfo, deps: QuoteDeps,
): Promise<Array<bigint | null>> {
  return Promise.all(asset.legs.map(async (l) => {
    try {
      if (l.dex === 'icpswap') {
        const amt = l.amountIn > token.transfer_fee ? l.amountIn - token.transfer_fee : 0n
        const out = await deps.icpswapQuote(token.address, target.address, amt)
        return out > 0n ? out : null
      }
      if (l.dex === 'neutrinite') {
        const r = await deps.neuQuote(token.address, target.address, l.amountIn)
        return r.out > 0n ? r.out : null
      }
      if (asset.second) return l.expectedOut // checked right before its turn instead
      const sim = await deps.simulateSplitRoutes((l.tacoLegs ?? []).map(t => ({ amountIn: t.amountIn, route: t.route })))
      if (sim.error || sim.totalOut <= 0n) return null
      return sim.totalOut
    } catch { return null }
  }))
}

/**
 * 5.2 step 8, the exact requote rule over the verified legs (gross outputs):
 * P planned, M sum of planned minimums, F fresh total. Go on when every leg has
 * fresh >= planned × (1 − s) and F >= M / (1 − s/2); then each leg's minimum is
 * ceil(fresh × k) with k = max(1 − s, M / F), so the minimums add up to at least
 * the confirmed Minimum received and each leg keeps at least half the slippage
 * as room. Otherwise prices moved: back to Confirm.
 */
export function requoteRule(
  legs: Array<{ planned: bigint; plannedMin: bigint; fresh: bigint | null }>, slip: number,
): { ok: true; minOut: bigint[] } | { ok: false; reason: 'moved' | 'failed' } {
  if (legs.some(l => l.fresh == null)) return { ok: false, reason: 'failed' }
  const SCALE = 1_000_000n
  const s = BigInt(Math.round(slip * 1_000_000))
  for (const l of legs) {
    // fresh >= planned × (1 − s)
    if (l.fresh! * SCALE < l.planned * (SCALE - s)) return { ok: false, reason: 'moved' }
  }
  const M = legs.reduce((a, l) => a + l.plannedMin, 0n)
  const F = legs.reduce((a, l) => a + l.fresh!, 0n)
  // F >= M / (1 − s/2)  <=>  F × (1 − s/2) >= M
  if (F * (2n * SCALE - s) < M * 2n * SCALE) return { ok: false, reason: 'moved' }
  // k = max(1 − s, M / F), as a fraction num/den
  const kNum1 = SCALE - s, kDen1 = SCALE
  const useMF = F > 0n && M * kDen1 > kNum1 * F
  const minOut = legs.map(l => {
    const num = useMF ? l.fresh! * M : l.fresh! * kNum1
    const den = useMF ? F : kDen1
    return (num + den - 1n) / den // ceil
  })
  return { ok: true, minOut }
}
