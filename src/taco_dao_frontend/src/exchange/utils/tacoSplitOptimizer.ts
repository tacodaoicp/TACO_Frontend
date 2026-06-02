/**
 * Within-TACO multi-route split optimizer.
 *
 * Extracted verbatim from useSwapFlow.fetchQuote's inline split search and
 * generalized from a fixed 100% (10000bp) target to an arbitrary `targetBp`,
 * so the CrossDEX mode can ask for TACO's internal optimum at any allocation
 * (e.g. 60% of the total) while Easy mode keeps calling it with targetBp=10000.
 *
 * One `getExpectedReceiveAmountBatchMulti` batch (probes at fractions of the
 * TOTAL amount) feeds every target — mirroring treasury.mo's reuse of one batch
 * across findOptimalTacoSplit(targetBp).
 *
 * The pool-edge conflict rejection (two legs that touch the same physical pool
 * would interfere on execution) is preserved exactly.
 */

import type { HopDetailDisplay, SplitLeg } from '../composables/useSwapFlow'

type SwapHop = { tokenIn: string; tokenOut: string }

// Tiny, pure helpers — duplicated here (rather than imported) so this module
// has no value-dependency on useSwapFlow (which imports buildTacoSplitPlan).
function buildRoute(tokenIn: string, tokenOut: string, hopDetails: any[]): SwapHop[] {
  if (hopDetails?.length > 0) return hopDetails.map((h: any) => ({ tokenIn: h.tokenIn, tokenOut: h.tokenOut }))
  return [{ tokenIn, tokenOut }]
}
function routeKeyFromTokens(routeTokens: readonly string[] | undefined, fallback: string): string {
  if (routeTokens && routeTokens.length >= 2) return routeTokens.join('→')
  return fallback
}

export interface TacoSplitResult {
  /** Best single-route output at targetBp (0n if none). */
  baselineOut: bigint
  /** max(baselineOut, best internal split). */
  bestOut: bigint
  /** Winning combination: 1 leg if the single route won, else the split legs. */
  bestLegs: SplitLeg[]
  /** % improvement of bestOut over baselineOut (0 if the single won). */
  improvement: number
}

interface QuoteEntry {
  bp: number
  amountIn: bigint
  expectedOut: bigint
  route: SwapHop[]
  routeKey: string
  hopDetails: HopDetailDisplay[]
  priceImpact: number
  edgeKeys: string[]
}

function entryToLeg(e: QuoteEntry): SplitLeg {
  return {
    pctBP: e.bp,
    amountIn: e.amountIn,
    expectedOut: e.expectedOut,
    route: e.route,
    routeKey: e.routeKey,
    hopDetails: e.hopDetails,
    priceImpact: e.priceImpact,
  }
}

/**
 * Compute TACO's best within-pool execution for `targetBp` of the total.
 *
 * @param batchResults raw getExpectedReceiveAmountBatchMulti response (per request: { routes: [...] })
 * @param requests     the aligned request list: { bp (of total), amt }
 * @param targetBp     the TACO allocation in basis points of the total (e.g. 6000)
 */
export function buildTacoSplitPlan(
  batchResults: any[],
  requests: Array<{ bp: bigint; amt: bigint }>,
  fromAddr: string,
  toAddr: string,
  targetBp: number,
): TacoSplitResult {
  // Canonical unordered pool-edge key so legs touching the same physical pool —
  // even via different overall paths — are detected as conflicts.
  const edgeKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const edgesOf = (hops: HopDetailDisplay[]): string[] => hops.map((h) => edgeKey(h.tokenIn, h.tokenOut))

  // Flatten: one QuoteEntry per (fraction, route) pair.
  const allQuotes: QuoteEntry[] = []
  for (let reqIdx = 0; reqIdx < requests.length; reqIdx++) {
    const req = requests[reqIdx]
    const routes = (batchResults[reqIdx]?.routes ?? []) as any[]
    for (const r of routes) {
      const out = (r?.expectedBuyAmount ?? 0n) as bigint
      if (out <= 0n) continue
      const rawHops = (r.hopDetails ?? []) as any[]
      const hops = rawHops.length > 0 ? rawHops : [{
        tokenIn: fromAddr, tokenOut: toAddr,
        amountIn: req.amt, amountOut: out,
        fee: r.fee ?? 0n, priceImpact: r.priceImpact ?? 0,
      }]
      const normalizedHops = hops.map((h: any) => ({
        ...h,
        priceImpact: h.priceImpact > 0 && h.priceImpact <= 1 ? h.priceImpact * 100 : h.priceImpact,
      })) as HopDetailDisplay[]
      allQuotes.push({
        bp: Number(req.bp),
        amountIn: req.amt,
        expectedOut: out,
        route: buildRoute(fromAddr, toAddr, rawHops),
        routeKey: routeKeyFromTokens(r.routeTokens, r.routeDescription ?? 'direct'),
        hopDetails: normalizedHops,
        priceImpact: (r.priceImpact ?? 0) * 100,
        edgeKeys: edgesOf(normalizedHops),
      })
    }
  }

  // byBpMap holds ALL entries per bp (so splits can pair any two distinct routes).
  const byBpMap = new Map<number, QuoteEntry[]>()
  for (const q of allQuotes) {
    const arr = byBpMap.get(q.bp)
    if (arr) arr.push(q)
    else byBpMap.set(q.bp, [q])
  }

  // Baseline = best single route AT targetBp (routes come sorted desc).
  const baselineEntry = byBpMap.get(targetBp)?.[0] ?? null
  const baselineOut = baselineEntry ? baselineEntry.expectedOut : 0n

  let bestPlanOut = 0n
  let bestPlanLegs: QuoteEntry[] = []

  function tryPlan(legs: QuoteEntry[]) {
    // Reject any plan whose legs share a pool edge (second leg would see depleted state).
    const seenEdges = new Set<string>()
    for (const leg of legs) {
      for (const e of leg.edgeKeys) {
        if (seenEdges.has(e)) return
        seenEdges.add(e)
      }
    }
    const totalOut = legs.reduce((s, l) => s + l.expectedOut, 0n)
    if (totalOut <= baselineOut) return
    if (totalOut > bestPlanOut) {
      bestPlanOut = totalOut
      bestPlanLegs = legs
    }
  }

  // 2-way splits
  for (let i = 0; i < allQuotes.length; i++) {
    const rem = targetBp - allQuotes[i].bp
    const others = byBpMap.get(rem)
    if (!others) continue
    for (const j of others) {
      if (j === allQuotes[i]) continue
      tryPlan([allQuotes[i], j])
    }
  }

  // 3-way splits
  for (let i = 0; i < allQuotes.length; i++) {
    for (let j = i; j < allQuotes.length; j++) {
      const rem = targetBp - allQuotes[i].bp - allQuotes[j].bp
      if (rem <= 0 || rem >= targetBp) continue
      const others = byBpMap.get(rem)
      if (!others) continue
      for (const k of others) {
        if (k === allQuotes[i] || k === allQuotes[j]) continue
        tryPlan([allQuotes[i], allQuotes[j], k])
      }
    }
  }

  // 4-way splits
  for (let i = 0; i < allQuotes.length; i++) {
    for (let j = i; j < allQuotes.length; j++) {
      for (let k = j; k < allQuotes.length; k++) {
        const rem = targetBp - allQuotes[i].bp - allQuotes[j].bp - allQuotes[k].bp
        if (rem <= 0 || rem >= targetBp) continue
        const others = byBpMap.get(rem)
        if (!others) continue
        for (const l of others) {
          if (l === allQuotes[i] || l === allQuotes[j] || l === allQuotes[k]) continue
          tryPlan([allQuotes[i], allQuotes[j], allQuotes[k], l])
        }
      }
    }
  }

  // 5-way splits
  for (let i = 0; i < allQuotes.length; i++) {
    for (let j = i; j < allQuotes.length; j++) {
      for (let k = j; k < allQuotes.length; k++) {
        for (let l = k; l < allQuotes.length; l++) {
          const rem = targetBp - allQuotes[i].bp - allQuotes[j].bp - allQuotes[k].bp - allQuotes[l].bp
          if (rem <= 0 || rem >= targetBp) continue
          const others = byBpMap.get(rem)
          if (!others) continue
          for (const m of others) {
            if (m === allQuotes[i] || m === allQuotes[j] || m === allQuotes[k] || m === allQuotes[l]) continue
            tryPlan([allQuotes[i], allQuotes[j], allQuotes[k], allQuotes[l], m])
          }
        }
      }
    }
  }

  const splitWins = bestPlanLegs.length > 0 && bestPlanOut > baselineOut
  const bestOut = splitWins ? bestPlanOut : baselineOut
  const improvement = splitWins && baselineOut > 0n
    ? Number((bestPlanOut - baselineOut) * 10000n / baselineOut) / 100
    : 0

  let bestLegs: SplitLeg[]
  if (splitWins) {
    bestLegs = bestPlanLegs.map(entryToLeg)
  } else if (baselineEntry) {
    bestLegs = [entryToLeg(baselineEntry)]
  } else {
    bestLegs = []
  }

  return { baselineOut, bestOut, bestLegs, improvement }
}
