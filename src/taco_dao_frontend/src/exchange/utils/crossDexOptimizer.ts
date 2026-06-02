/**
 * Cross-DEX optimizer — splits one swap across ICPSwap + TACO + Neutrinite.
 *
 * Port of treasury.mo's cross-DEX scenario builder restricted to a 10%-step
 * grid. Given a per-venue quote grid at 10%..100% of the total, it enumerates
 * every 1/2/3-way split summing to 100% and picks the plan with the best NET
 * output, where net = grossOut − (numLegs−1)·outTransferFee (each extra leg pays
 * one more output-side withdraw fee). That single rule subsumes "prefer a split
 * only if it beats the best single by a withdraw fee" and generalises to N legs.
 *
 * A venue with no liquidity quotes 0n at every fraction and is simply never
 * chosen, so adding a venue can never make the result worse.
 */

import type { SplitLeg } from '../composables/useSwapFlow'

export type CrossDexVenue = 'icpswap' | 'taco' | 'neutrinite'

export interface TacoGridEntry {
  /** Best within-TACO output at this fraction (single or internal split). */
  expectedOut: bigint
  /** The within-TACO legs to execute for this fraction (for swapSplitRoutes). */
  legs: SplitLeg[]
}

export interface CrossDexLeg {
  dex: CrossDexVenue
  /** Basis points of the total (e.g. 6000 = 60%). */
  pctBP: number
  amountIn: bigint
  expectedOut: bigint
  /** TACO leg only: the within-TACO route legs to hand to swapSplitRoutes. */
  tacoLegs?: SplitLeg[]
}

export interface CrossDexSwapPlan {
  kind: 'single' | 'split'
  legs: CrossDexLeg[]
  totalExpectedOut: bigint
}

const GRID = 10 // 10 fractions: 10%, 20%, …, 100% (units of 10%)

/**
 * @param icpGrid     icpGrid[i]  = ICPSwap out at (i+1)·10% of total (fee-adjusted quote)
 * @param tacoGrid    tacoGrid[j] = within-TACO optimum at (j+1)·10% of total
 * @param neuGrid     neuGrid[k]  = Neutrinite out at (k+1)·10% of total (0n if no liquidity)
 * @param total       the full input amount (raw, before per-leg fees)
 * @param outTransferFee output token's ledger transfer fee (the per-extra-leg withdraw cost)
 */
export function buildCrossDexPlan(
  icpGrid: bigint[],
  tacoGrid: TacoGridEntry[],
  neuGrid: bigint[],
  total: bigint,
  outTransferFee: bigint,
): CrossDexSwapPlan {
  const icpOutAt = (u: number) => (u > 0 ? (icpGrid[u - 1] ?? 0n) : 0n)
  const tacoOutAt = (u: number) => (u > 0 ? (tacoGrid[u - 1]?.expectedOut ?? 0n) : 0n)
  const neuOutAt = (u: number) => (u > 0 ? (neuGrid[u - 1] ?? 0n) : 0n)

  // Enumerate icpUnits + tacoUnits + neuUnits = GRID (each in units of 10%).
  let bestNet = -1n
  let best: { icpU: number; tacoU: number; neuU: number; gross: bigint } | null = null
  for (let icpU = 0; icpU <= GRID; icpU++) {
    if (icpU > 0 && icpOutAt(icpU) <= 0n) continue
    for (let tacoU = 0; tacoU <= GRID - icpU; tacoU++) {
      if (tacoU > 0 && tacoOutAt(tacoU) <= 0n) continue
      const neuU = GRID - icpU - tacoU
      if (neuU > 0 && neuOutAt(neuU) <= 0n) continue
      const numLegs = (icpU > 0 ? 1 : 0) + (tacoU > 0 ? 1 : 0) + (neuU > 0 ? 1 : 0)
      if (numLegs === 0) continue
      const gross = icpOutAt(icpU) + tacoOutAt(tacoU) + neuOutAt(neuU)
      if (gross <= 0n) continue
      const net = gross - BigInt(numLegs - 1) * outTransferFee
      if (net > bestNet) { bestNet = net; best = { icpU, tacoU, neuU, gross } }
    }
  }

  if (!best) {
    // No viable route on any venue.
    return { kind: 'single', legs: [{ dex: 'icpswap', pctBP: 10000, amountIn: total, expectedOut: 0n }], totalExpectedOut: 0n }
  }

  // Build legs in venue order; the last used leg gets the remainder (no dust).
  const used: Array<{ dex: CrossDexVenue; units: number; expectedOut: bigint; tacoLegs?: SplitLeg[] }> = []
  if (best.icpU > 0) used.push({ dex: 'icpswap', units: best.icpU, expectedOut: icpOutAt(best.icpU) })
  if (best.tacoU > 0) used.push({ dex: 'taco', units: best.tacoU, expectedOut: tacoOutAt(best.tacoU), tacoLegs: tacoGrid[best.tacoU - 1]?.legs ?? [] })
  if (best.neuU > 0) used.push({ dex: 'neutrinite', units: best.neuU, expectedOut: neuOutAt(best.neuU) })

  let remaining = total
  const legs: CrossDexLeg[] = used.map((u, idx) => {
    const isLast = idx === used.length - 1
    const amountIn = isLast ? remaining : (total * BigInt(u.units) * 1000n) / 10000n
    remaining -= amountIn
    return { dex: u.dex, pctBP: u.units * 1000, amountIn, expectedOut: u.expectedOut, tacoLegs: u.tacoLegs }
  })

  return { kind: used.length === 1 ? 'single' : 'split', legs, totalExpectedOut: best.gross }
}

/**
 * Refine the split of `sumBp` (basis points) between TWO venues A and B to a
 * precise 0.1% ratio, holding any other legs fixed.
 *
 * Total output over A's share, T(a) = outA(a) + outB(sumBp−a), is concave near
 * its peak. We bracket the best interior 10%-grid point and take the parabola
 * vertex — exactly where the two venues' marginal output rates intersect. The
 * caller then does ONE real quote at the returned ratio to confirm it beats the
 * grid result. gridA[i]/gridB[i] = expected out at (i+1)·10% of the TOTAL.
 *
 * Returns A's refined basis points (a multiple of 10 = 0.1%), or null when
 * there's no interior peak worth a verify quote.
 */
export function interpolatePairSplit(gridA: bigint[], gridB: bigint[], sumBp: number): number | null {
  const outA = (bp: number) => (bp > 0 ? (gridA[bp / 1000 - 1] ?? 0n) : 0n)
  const outB = (bp: number) => (bp > 0 ? (gridB[bp / 1000 - 1] ?? 0n) : 0n)
  const f = (aBp: number): bigint => {
    const a = outA(aBp), b = outB(sumBp - aBp)
    if (a <= 0n || b <= 0n) return 0n
    return a + b
  }

  // Best interior grid split (aBp ∈ {1000 .. sumBp−1000}, step 1000).
  let bestA = -1
  let bestVal = 0n
  for (let aBp = 1000; aBp <= sumBp - 1000; aBp += 1000) {
    const v = f(aBp)
    if (v > bestVal) { bestVal = v; bestA = aBp }
  }
  if (bestA < 0) return null

  // Parabola through (bestA−1000, bestA, bestA+1000); deltas from the peak value
  // keep Number() conversions in the safe-integer range.
  const a = f(bestA - 1000), b = f(bestA), c = f(bestA + 1000)
  if (a <= 0n || b <= 0n || c <= 0n) return null
  const da = Number(a - b)
  const dc = Number(c - b)
  const denom = da + dc          // = (a − 2b + c); < 0 ⇒ concave (a maximum)
  if (denom >= 0) return null
  const offset = 500 * (da - dc) / denom   // bp offset from bestA, half-step h/2=500

  let aOpt = Math.round((bestA + offset) / 10) * 10   // nearest 0.1% (10 bp)
  if (aOpt < bestA - 1000) aOpt = bestA - 1000
  if (aOpt > bestA + 1000) aOpt = bestA + 1000
  if (aOpt <= 0 || aOpt >= sumBp) return null
  if (Math.abs(aOpt - bestA) < 5) return null         // already on a grid point

  return aOpt
}
