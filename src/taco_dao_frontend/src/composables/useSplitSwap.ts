/**
 * Split-Swap Engine — 3-DEX implementation (Kong, ICPSwap, TACO Exchange)
 *
 * Fetches 6 quotes per DEX (18 total) at ~16.7%–100% of input,
 * evaluates all 1/2/3-way combinations, and finds the optimal split.
 */

import { useKongStore } from '../stores/kong.store'
import { useICPSwapStore } from '../stores/icpswap.store'
import { useTacoStore } from '../stores/taco.store'
import { useExchangeStore } from '../exchange/store/exchange.store'
import { depositToken } from '../exchange/utils/deposit'
import { isDevEnvironment } from '../config/network-config'
import { Actor } from '@dfinity/agent'

// ============================================================================
// Types
// ============================================================================

export interface QuoteData {
  out: bigint       // amountOut from DEX
  slipBP: number    // slippage in basis points (integer)
  valid: boolean    // passes validation checks
  route?: Array<{ tokenIn: string; tokenOut: string }>  // TACO Exchange route
}

export interface LegPlan {
  exchange: 'Kong' | 'ICPSwap' | 'TACO'
  pctBP: number            // percentage in basis points (e.g. 6000 = 60%)
  amountIn: bigint         // actual input amount for this leg
  expectedOut: bigint      // estimated output
  slipBP: number           // slippage basis points
  route?: Array<{ tokenIn: string; tokenOut: string }>  // TACO Exchange bestRoute
}

export interface ExecutionPlan {
  type: 'single' | 'split' | 'partial'
  legs: LegPlan[]          // 1-3 legs
  totalExpectedOut: bigint
  totalSlipBP: number
  interpolated: boolean
  quotes: { kong: QuoteData[], icpswap: QuoteData[], taco: QuoteData[] }
}

// Internal scenario type
interface Scenario {
  name: string
  kongPct: number    // basis points
  icpPct: number     // basis points
  tacoPct: number    // basis points
  totalOut: bigint
  kongSlipBP: number
  icpSlipBP: number
  tacoSlipBP: number
  kongIdx: number
  icpIdx: number
  tacoIdx: number
}

// ============================================================================
// Constants
// ============================================================================

const NUM_QUOTES = 6
// 6 steps: 1/6, 2/6, 3/6, 4/6, 5/6, 6/6 in basis points
const QUOTE_PCTS_BP = [1667, 3333, 5000, 6667, 8333, 10000]
const LAST_IDX = NUM_QUOTES - 1  // index 5 = 100%
const MIN_PARTIAL_TOTAL_BP = 3333  // ~33% minimum for partials
const DEFAULT_MAX_SLIPPAGE_BP = 50 // 0.5% default

// ============================================================================
// Composable
// ============================================================================

export function useSplitSwap() {
  const kongStore = useKongStore()
  const icpswapStore = useICPSwapStore()
  const tacoStore = useTacoStore()

  /**
   * Get ICRC1 token fee via a lightweight actor call
   */
  async function getTokenFee(tokenPrincipal: string): Promise<bigint> {
    const agent = await tacoStore.getAuthenticatedAgent()
    const icrcIDL = ({ IDL }: any) => {
      return IDL.Service({
        'icrc1_fee': IDL.Func([], [IDL.Nat], ['query']),
      })
    }
    const actor = Actor.createActor(icrcIDL, { agent, canisterId: tokenPrincipal })
    const fee = await actor.icrc1_fee() as any
    return typeof fee === 'bigint' ? fee : BigInt(fee)
  }

  // ── Quote fetchers ──

  async function fetchKongQuote(
    sellSymbol: string,
    buySymbol: string,
    amountIn: bigint
  ): Promise<{ out: bigint; slippage: number } | null> {
    try {
      const result = await kongStore.getQuote({
        sellTokenSymbol: sellSymbol,
        buyTokenSymbol: buySymbol,
        amountIn,
      })
      const out = typeof result.receive_amount === 'bigint'
        ? result.receive_amount
        : BigInt(result.receive_amount)
      return { out, slippage: result.slippage }
    } catch {
      return null
    }
  }

  async function fetchICPSwapQuote(
    sellPrincipal: string,
    buyPrincipal: string,
    amountIn: bigint
  ): Promise<{ out: bigint; slippage: number } | null> {
    if (amountIn <= 0n) return null
    try {
      const result = await icpswapStore.getQuote({
        sellTokenPrincipal: sellPrincipal,
        buyTokenPrincipal: buyPrincipal,
        amountIn,
      })
      const out = typeof result.amountOut === 'bigint'
        ? result.amountOut
        : BigInt(result.amountOut)
      return { out, slippage: result.slippage }
    } catch {
      return null
    }
  }

  async function fetchTacoQuote(
    sellPrincipal: string,
    buyPrincipal: string,
    amountIn: bigint
  ): Promise<{ out: bigint; slippage: number; route?: any[] } | null> {
    if (amountIn <= 0n) return null
    try {
      const exchangeStore = useExchangeStore()
      // Initialize exchange store if needed (idempotent)
      if (!exchangeStore.exchangeInfoData) {
        try { await exchangeStore.initExchange() } catch { return null }
      }
      const result = await exchangeStore.getExpectedMultiHopAmount(
        sellPrincipal, buyPrincipal, amountIn
      ) as any
      // IC agent may return Nat as Number for small values — always coerce to BigInt
      const rawOut = result?.expectedAmountOut
      if (rawOut == null) return null
      const out = typeof rawOut === 'bigint' ? rawOut : BigInt(rawOut)
      if (out <= 0n) return null
      return {
        out,
        // priceImpact is 0-1 ratio, convert to percentage
        slippage: (Number(result.priceImpact) || 0) * 100,
        route: result.bestRoute,
      }
    } catch {
      return null
    }
  }

  /**
   * Convert raw quote result to QuoteData with validation
   */
  function toQuoteData(
    result: { out: bigint; slippage: number; route?: any[] } | null,
    _maxSlippageBP: number
  ): QuoteData {
    if (!result) return { out: 0n, slipBP: 10000, valid: false }
    // Ensure out is always BigInt (IC agent may return Nat as Number)
    const out = typeof result.out === 'bigint' ? result.out : BigInt(result.out)
    if (out <= 0n) return { out: 0n, slipBP: 10000, valid: false }
    const slipBP = Math.round(Math.abs(result.slippage) * 100)
    return { out, slipBP, valid: true, route: result.route }
  }

  /**
   * Find the best execution plan across Kong, ICPSwap, and TACO Exchange.
   */
  async function findBestExecution(
    sellTokenPrincipal: string,
    sellTokenSymbol: string,
    buyTokenPrincipal: string,
    buyTokenSymbol: string,
    amountIn: bigint,
    maxSlippageBP: number = DEFAULT_MAX_SLIPPAGE_BP
  ): Promise<ExecutionPlan> {
    if (isDevEnvironment()) {
      console.log('[SWAP findBestExecution]', {
        sellToken: sellTokenSymbol, buyToken: buyTokenSymbol,
        amountIn: amountIn.toString(), maxSlippageBP,
      })
    }

    // ========================================
    // 1. Calculate 6 amounts per DEX
    // ========================================

    // Kong: full amounts (handles fees internally)
    const kongAmounts = QUOTE_PCTS_BP.map(pct => amountIn * BigInt(pct) / 10000n)

    // ICPSwap: fee-adjusted (ICPSwap swaps amountIn - fee)
    let sellTokenFee = 0n
    try {
      sellTokenFee = await getTokenFee(sellTokenPrincipal)
    } catch {
      // If fee fetch fails, assume 0
    }

    const icpAmounts = QUOTE_PCTS_BP.map(pct => {
      const raw = amountIn * BigInt(pct) / 10000n
      return raw > sellTokenFee ? raw - sellTokenFee : 0n
    })

    // TACO Exchange: fees added at deposit time, quote uses raw trade amounts
    const tacoAmounts = kongAmounts

    // ========================================
    // 2. Fetch 18 quotes in parallel
    // ========================================

    const kongPromises = kongAmounts.map(amt =>
      fetchKongQuote(sellTokenSymbol, buyTokenSymbol, amt)
    )
    const icpPromises = icpAmounts.map(amt =>
      fetchICPSwapQuote(sellTokenPrincipal, buyTokenPrincipal, amt)
    )
    const tacoPromises = tacoAmounts.map(amt =>
      fetchTacoQuote(sellTokenPrincipal, buyTokenPrincipal, amt)
    )

    const allResults = await Promise.allSettled([
      ...kongPromises, ...icpPromises, ...tacoPromises,
    ])

    // ========================================
    // 3. Extract and validate quotes
    // ========================================

    const kong: QuoteData[] = []
    const icp: QuoteData[] = []
    const taco: QuoteData[] = []

    for (let i = 0; i < NUM_QUOTES; i++) {
      const kongResult = allResults[i]
      const icpResult = allResults[NUM_QUOTES + i]
      const tacoResult = allResults[NUM_QUOTES * 2 + i]

      kong.push(toQuoteData(
        kongResult.status === 'fulfilled' ? kongResult.value : null,
        maxSlippageBP
      ))
      icp.push(toQuoteData(
        icpResult.status === 'fulfilled' ? icpResult.value : null,
        maxSlippageBP
      ))
      taco.push(toQuoteData(
        tacoResult.status === 'fulfilled' ? tacoResult.value : null,
        maxSlippageBP
      ))
    }

    // ========================================
    // 4. Evaluate all scenarios
    // ========================================

    let bestScenario: Scenario | null = null
    let secondBestScenario: Scenario | null = null
    const partialScenarios: Scenario[] = []

    function updateBest(scenario: Scenario) {
      if (!bestScenario || scenario.totalOut > bestScenario.totalOut) {
        secondBestScenario = bestScenario
        bestScenario = scenario
      } else if (!secondBestScenario || scenario.totalOut > secondBestScenario.totalOut) {
        secondBestScenario = scenario
      }
    }

    function makeScenario(
      name: string,
      kIdx: number, iIdx: number, tIdx: number,
      kPct: number, iPct: number, tPct: number
    ): Scenario {
      return {
        name,
        kongPct: kPct, icpPct: iPct, tacoPct: tPct,
        totalOut: (kIdx >= 0 ? kong[kIdx].out : 0n)
                + (iIdx >= 0 ? icp[iIdx].out : 0n)
                + (tIdx >= 0 ? taco[tIdx].out : 0n),
        kongSlipBP: kIdx >= 0 ? kong[kIdx].slipBP : 0,
        icpSlipBP: iIdx >= 0 ? icp[iIdx].slipBP : 0,
        tacoSlipBP: tIdx >= 0 ? taco[tIdx].slipBP : 0,
        kongIdx: kIdx, icpIdx: iIdx, tacoIdx: tIdx,
      }
    }

    // Singles: 100% to one DEX
    if (isDevEnvironment()) {
      console.log('[SWAP] 100% quotes:', {
        kong: { out: kong[LAST_IDX].out.toString(), valid: kong[LAST_IDX].valid, slipBP: kong[LAST_IDX].slipBP },
        icp: { out: icp[LAST_IDX].out.toString(), valid: icp[LAST_IDX].valid, slipBP: icp[LAST_IDX].slipBP },
        taco: { out: taco[LAST_IDX].out.toString(), valid: taco[LAST_IDX].valid, slipBP: taco[LAST_IDX].slipBP },
      })
    }
    if (kong[LAST_IDX].valid) {
      updateBest(makeScenario('SINGLE_KONG', LAST_IDX, -1, -1, 10000, 0, 0))
    }
    if (icp[LAST_IDX].valid) {
      updateBest(makeScenario('SINGLE_ICP', -1, LAST_IDX, -1, 0, 10000, 0))
    }
    if (taco[LAST_IDX].valid) {
      updateBest(makeScenario('SINGLE_TACO', -1, -1, LAST_IDX, 0, 0, 10000))
    }

    // 2-way and 3-way splits using the 6×6×6 grid
    // Each DEX uses index -1 (skip) or 0..5 (corresponding to QUOTE_PCTS_BP)
    for (let kI = -1; kI < NUM_QUOTES; kI++) {
      const kPct = kI >= 0 ? QUOTE_PCTS_BP[kI] : 0
      if (kI >= 0 && !kong[kI].valid) continue

      for (let iI = -1; iI < NUM_QUOTES; iI++) {
        const iPct = iI >= 0 ? QUOTE_PCTS_BP[iI] : 0
        if (iI >= 0 && !icp[iI].valid) continue
        if (kPct + iPct > 10000) continue

        for (let tI = -1; tI < NUM_QUOTES; tI++) {
          const tPct = tI >= 0 ? QUOTE_PCTS_BP[tI] : 0
          if (tI >= 0 && !taco[tI].valid) continue

          const totalPct = kPct + iPct + tPct
          if (totalPct > 10002) continue // allow +2 rounding tolerance

          // Count active DEXes
          const active = (kI >= 0 ? 1 : 0) + (iI >= 0 ? 1 : 0) + (tI >= 0 ? 1 : 0)
          // Skip: 0 DEXes, or 100% singles (already handled above)
          if (active === 0) continue
          if (active === 1 && totalPct >= 9998) continue

          // Treat sums within ±2 BP of 10000 as full splits (rounding from 10000/6)
          const isFull = totalPct >= 9998 && totalPct <= 10002
          const label = isFull ? 'SPLIT' : 'PARTIAL'
          const name = `${label}_K${kPct / 100}_I${iPct / 100}_T${tPct / 100}`
          const scenario = makeScenario(name, kI, iI, tI, kPct, iPct, tPct)

          if (isFull) {
            updateBest(scenario)
          } else {
            partialScenarios.push(scenario)
          }
        }
      }
    }

    // ========================================
    // 5. Build execution plan from best scenario
    // ========================================

    const allQuotes = { kong, icpswap: icp, taco }

    if (bestScenario) {
      if (isDevEnvironment()) {
        const b = bestScenario as Scenario
        console.log('[SWAP findBestExecution] Best:', {
          scenario: b.name, kongPct: b.kongPct, icpPct: b.icpPct, tacoPct: b.tacoPct,
          expectedOut: b.totalOut.toString(),
        })
      }
      return buildPlanFromScenario(bestScenario, allQuotes, amountIn)
    }

    // No full scenario → try partials
    if (partialScenarios.length > 0) {
      const valid = partialScenarios.filter(p =>
        (p.kongPct + p.icpPct + p.tacoPct) >= MIN_PARTIAL_TOTAL_BP
      )
      if (valid.length > 0) {
        valid.sort((a, b) =>
          (a.kongSlipBP + a.icpSlipBP + a.tacoSlipBP) -
          (b.kongSlipBP + b.icpSlipBP + b.tacoSlipBP)
        )
        return buildPlanFromScenario(valid[0], allQuotes, amountIn, 'partial')
      }
      // Fallback: highest output partial
      partialScenarios.sort((a, b) => (b.totalOut > a.totalOut ? 1 : b.totalOut < a.totalOut ? -1 : 0))
      return buildPlanFromScenario(partialScenarios[0], allQuotes, amountIn, 'partial')
    }

    // No viable execution — return best single raw quote regardless of slippage
    const allCandidates = [
      { exchange: 'Kong' as const, q: kong[LAST_IDX] },
      { exchange: 'ICPSwap' as const, q: icp[LAST_IDX] },
      { exchange: 'TACO' as const, q: taco[LAST_IDX] },
    ]
    const candidates = allCandidates
      .filter(c => c.q.out > 0n)
      .sort((a, b) => (b.q.out > a.q.out ? 1 : b.q.out < a.q.out ? -1 : 0))

    if (candidates.length > 0) {
      const best = candidates[0]
      return {
        type: 'single',
        legs: [{
          exchange: best.exchange, pctBP: 10000,
          amountIn, expectedOut: best.q.out,
          slipBP: best.q.slipBP,
          route: best.q.route,
        }],
        totalExpectedOut: best.q.out,
        totalSlipBP: best.q.slipBP,
        interpolated: false,
        quotes: allQuotes,
      }
    }

    throw new Error('No viable execution path found — all DEXes returned no quotes')
  }

  /**
   * Build an execution plan from a scenario
   */
  function buildPlanFromScenario(
    scenario: Scenario,
    quotes: { kong: QuoteData[]; icpswap: QuoteData[]; taco: QuoteData[] },
    amountIn: bigint,
    typeOverride?: 'partial'
  ): ExecutionPlan {
    const legs: LegPlan[] = []
    let remainingAmount = amountIn

    // Determine amounts: last leg gets remainder to avoid rounding loss
    const activeLegs: Array<{ exchange: 'Kong' | 'ICPSwap' | 'TACO'; pct: number; idx: number }> = []
    if (scenario.kongPct > 0 && scenario.kongIdx >= 0) {
      activeLegs.push({ exchange: 'Kong', pct: scenario.kongPct, idx: scenario.kongIdx })
    }
    if (scenario.icpPct > 0 && scenario.icpIdx >= 0) {
      activeLegs.push({ exchange: 'ICPSwap', pct: scenario.icpPct, idx: scenario.icpIdx })
    }
    if (scenario.tacoPct > 0 && scenario.tacoIdx >= 0) {
      activeLegs.push({ exchange: 'TACO', pct: scenario.tacoPct, idx: scenario.tacoIdx })
    }

    for (let i = 0; i < activeLegs.length; i++) {
      const { exchange, pct, idx } = activeLegs[i]
      const isLast = i === activeLegs.length - 1
      const legAmount = isLast ? remainingAmount : amountIn * BigInt(pct) / 10000n
      remainingAmount -= legAmount

      const quoteArr = exchange === 'Kong' ? quotes.kong : exchange === 'ICPSwap' ? quotes.icpswap : quotes.taco
      const slipBP = exchange === 'Kong' ? scenario.kongSlipBP
        : exchange === 'ICPSwap' ? scenario.icpSlipBP : scenario.tacoSlipBP

      legs.push({
        exchange,
        pctBP: pct,
        amountIn: legAmount,
        expectedOut: quoteArr[idx].out,
        slipBP,
        route: quoteArr[idx].route,
      })
    }

    const totalExpectedOut = legs.reduce((sum, l) => sum + l.expectedOut, 0n)
    const totalSlipBP = legs.reduce((sum, l) => sum + l.slipBP, 0)
    const totalPct = scenario.kongPct + scenario.icpPct + scenario.tacoPct
    const isFull = totalPct >= 9998 && totalPct <= 10002
    const type = typeOverride ?? (legs.length === 1 ? 'single' : isFull ? 'split' : 'partial')

    return {
      type,
      legs,
      totalExpectedOut,
      totalSlipBP,
      interpolated: false,
      quotes,
    }
  }

  /**
   * Execute a plan — runs legs in parallel, handles partial failures
   */
  async function executePlan(
    plan: ExecutionPlan,
    sellTokenPrincipal: string,
    sellTokenSymbol: string,
    buyTokenPrincipal: string,
    buyTokenSymbol: string,
    slippageTolerance: number,
    onStep?: (leg: string, step: string) => void
  ): Promise<{
    totalOut: bigint
    results: Array<{ exchange: string; success: boolean; amountOut?: bigint; error?: string }>
  }> {
    if (isDevEnvironment()) {
      console.log('[SWAP executePlan]', {
        type: plan.type,
        legs: plan.legs.map(l => ({ exchange: l.exchange, amount: l.amountIn.toString(), expectedOut: l.expectedOut.toString() })),
        slippageTolerance,
      })
    }

    const legPromises = plan.legs.map(async (leg) => {
      const minAmountOut = BigInt(Math.floor(
        Number(leg.expectedOut) * (1 - slippageTolerance)
      ))

      let blockNumber: bigint | undefined
      try {
        if (leg.exchange === 'Kong') {
          const result = await kongStore.icrc2_swap({
            sellTokenPrincipal,
            sellTokenSymbol,
            buyTokenPrincipal,
            buyTokenSymbol,
            amountIn: leg.amountIn,
            minAmountOut,
            slippageTolerance,
            onStep: (step: string) => onStep?.('Kong', step),
          })
          const amountOut = result?.receive_amount != null
            ? (typeof result.receive_amount === 'bigint' ? result.receive_amount : BigInt(result.receive_amount))
            : 0n
          return { exchange: 'Kong', success: true, amountOut }

        } else if (leg.exchange === 'ICPSwap') {
          const result = await icpswapStore.icrc2_swap({
            sellTokenPrincipal,
            buyTokenPrincipal,
            amountIn: leg.amountIn,
            minAmountOut,
            slippageTolerance,
            onStep: (step: string) => onStep?.('ICPSwap', step),
          })
          const amountOut = result?.amountOut != null
            ? (typeof result.amountOut === 'bigint' ? result.amountOut : BigInt(result.amountOut))
            : 0n
          return { exchange: 'ICPSwap', success: true, amountOut }

        } else {
          // TACO Exchange: deposit to treasury then swapMultiHop
          const exchangeStore = useExchangeStore()
          const sellToken = exchangeStore.getTokenByAddress(sellTokenPrincipal)

          // Step 1: Deposit (adds trading fee + transfer fee on top)
          onStep?.('TACO', 'Depositing tokens...')
          blockNumber = await depositToken(
            sellTokenPrincipal,
            sellToken?.asset_type ?? { ICRC12: null },
            leg.amountIn,
            exchangeStore.tradingFeeBps,
            sellToken?.transfer_fee ?? 10000n,
            exchangeStore.treasuryAccountId,
            exchangeStore.treasuryPrincipal,
          )

          // Step 2: Execute swap
          onStep?.('TACO', 'Executing swap...')
          const route = leg.route ?? [{ tokenIn: sellTokenPrincipal, tokenOut: buyTokenPrincipal }]

          // Debug handoff (item 7): paste this block to backend when a TACO leg misbehaves.
          console.info('[Swap debug handoff]', {
            ts: new Date().toISOString(),
            flow: 'splitLegTaco',
            tokenIn: sellTokenPrincipal,
            tokenOut: buyTokenPrincipal,
            amountIn: leg.amountIn.toString(),
            legExpectedOut: leg.expectedOut.toString(),
            slippageTolerance,
            minAmountOut: minAmountOut.toString(),
            blockNumber: blockNumber.toString(),
            route,
          })

          const rawResult = await exchangeStore.swapMultiHop(
            sellTokenPrincipal,
            buyTokenPrincipal,
            leg.amountIn,
            route,
            minAmountOut,
            blockNumber,
          )

          // Parse result (structured Result type)
          if ('Ok' in rawResult) {
            return { exchange: 'TACO', success: true, amountOut: rawResult.Ok.amountOut }
          } else if ('Err' in rawResult) {
            const { classifyExchangeError } = await import('../exchange/utils/errors')
            const buyToken = exchangeStore.getTokenByAddress(buyTokenPrincipal)
            throw new Error(classifyExchangeError(rawResult.Err, {
              outDecimals: buyToken ? Number(buyToken.decimals) : 8,
              outSymbol: buyToken?.symbol ?? '',
              hopTokens: route.map(h => {
                const tok = exchangeStore.getTokenByAddress(h.tokenOut)
                return { symbol: tok?.symbol ?? h.tokenOut.slice(0, 8) }
              }),
            }).message)
          } else {
            throw new Error('TACO Exchange swap failed')
          }
        }
      } catch (err: any) {
        // On ICPSwap failure, attempt sweep to recover stranded funds
        if (leg.exchange === 'ICPSwap') {
          try {
            await icpswapStore.sweep({
              token0Principal: sellTokenPrincipal,
              token1Principal: buyTokenPrincipal,
            })
          } catch {
            // Sweep is best-effort
          }
        }

        // On TACO Exchange failure after deposit, attempt automatic recovery
        if (leg.exchange === 'TACO' && blockNumber !== undefined) {
          try {
            const exchangeStore = useExchangeStore()
            const sellToken = exchangeStore.getTokenByAddress(sellTokenPrincipal)
            const tokenType = sellToken?.asset_type ?? { ICRC12: null }
            const recovered = await exchangeStore.recoverWronglysent(
              sellTokenPrincipal,
              blockNumber,
              tokenType,
            )
            if (recovered) {
              return { exchange: 'TACO', success: false, error: (err.message || 'Swap failed') + ' (tokens recovered automatically)' }
            }
          } catch {
            // Recovery is best-effort; user can recover manually via Recover page
          }
        }

        return { exchange: leg.exchange, success: false, error: err.message || 'Swap failed' }
      }
    })

    const results = await Promise.allSettled(legPromises)

    const processed = results.map(r =>
      r.status === 'fulfilled'
        ? r.value
        : { exchange: 'Unknown', success: false, error: (r as PromiseRejectedResult).reason?.message || 'Unknown error' }
    )

    const totalOut = processed.reduce((sum, r) => sum + ('amountOut' in r ? r.amountOut : 0n), 0n)

    if (isDevEnvironment()) {
      const failures = processed.filter(r => !r.success)
      console.log('[SWAP executePlan] Result:', {
        totalOut: totalOut.toString(),
        successes: processed.filter(r => r.success).length,
        failures: failures.map(r => ({ exchange: r.exchange, error: r.error })),
      })
    }

    return { totalOut, results: processed }
  }

  return {
    findBestExecution,
    executePlan,
  }
}
