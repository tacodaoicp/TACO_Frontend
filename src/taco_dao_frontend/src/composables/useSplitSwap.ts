/**
 * Split-Swap Engine — Frontend implementation matching treasury.mo:8173-8884
 *
 * Fetches 10 quotes per DEX (Kong, ICPSwap) at 10%–100% of input,
 * evaluates all combinations, and finds the optimal split for best return.
 */

import { useKongStore } from '../stores/kong.store'
import { useICPSwapStore } from '../stores/icpswap.store'
import { useTacoStore } from '../stores/taco.store'
import { Actor } from '@dfinity/agent'

// ============================================================================
// Types
// ============================================================================

export interface QuoteData {
  out: bigint       // amountOut from DEX
  slipBP: number    // slippage in basis points (integer)
  valid: boolean    // passes validation checks
}

export interface LegPlan {
  exchange: 'Kong' | 'ICPSwap'
  pctBP: number            // percentage in basis points (e.g. 6000 = 60%)
  amountIn: bigint         // actual input amount for this leg
  expectedOut: bigint      // estimated output
  slipBP: number           // slippage basis points
}

export interface ExecutionPlan {
  type: 'single' | 'split' | 'partial'
  legs: LegPlan[]          // 1 leg for single, 2 for split/partial
  totalExpectedOut: bigint
  totalSlipBP: number
  interpolated: boolean
  quotes: { kong: QuoteData[], icpswap: QuoteData[] }
}

// Internal scenario type matching treasury.mo
interface Scenario {
  name: string
  kongPct: number   // basis points (e.g. 3000 = 30%)
  icpPct: number    // basis points
  totalOut: bigint
  kongSlipBP: number
  icpSlipBP: number
  kongIdx: number
  icpIdx: number
}

// ============================================================================
// Constants (matching treasury.mo)
// ============================================================================

const NUM_QUOTES = 10
const STEP_BP = 1000          // 10% per step
const MIN_PARTIAL_TOTAL_BP = 4000  // 40% minimum for partials
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

  /**
   * Fetch a single Kong quote, returning null on failure
   */
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

  /**
   * Fetch a single ICPSwap quote, returning null on failure
   */
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

  /**
   * Convert raw quote result to QuoteData with validation
   * Matches treasury.mo extractKong/extractIcp logic
   */
  function toQuoteData(
    result: { out: bigint; slippage: number } | null,
    maxSlippageBP: number
  ): QuoteData {
    if (!result || result.out <= 0n) {
      return { out: 0n, slipBP: 10000, valid: false }
    }
    // slippage from stores is in percentage (e.g. 0.5 = 0.5%), convert to basis points
    const slipBP = Math.round(Math.abs(result.slippage) * 100)
    const valid = result.out > 0n && slipBP <= maxSlippageBP
    return { out: result.out, slipBP, valid }
  }

  /**
   * Find the best execution plan across Kong and ICPSwap.
   * Matches the treasury.mo findBestExecution algorithm exactly.
   */
  async function findBestExecution(
    sellTokenPrincipal: string,
    sellTokenSymbol: string,
    buyTokenPrincipal: string,
    buyTokenSymbol: string,
    amountIn: bigint,
    maxSlippageBP: number = DEFAULT_MAX_SLIPPAGE_BP
  ): Promise<ExecutionPlan> {

    // ========================================
    // 1. Calculate 10 amounts per DEX
    // ========================================

    // Kong: full amounts (handles fees internally)
    const kongAmounts: bigint[] = Array.from({ length: NUM_QUOTES }, (_, i) =>
      amountIn * BigInt(i + 1) / 10n
    )

    // ICPSwap: fee-adjusted (ICPSwap swaps amountIn - fee)
    let sellTokenFee = 0n
    try {
      sellTokenFee = await getTokenFee(sellTokenPrincipal)
    } catch {
      // If fee fetch fails, assume 0 — ICPSwap quotes will just be slightly off
    }

    const icpAmounts: bigint[] = Array.from({ length: NUM_QUOTES }, (_, i) => {
      const raw = amountIn * BigInt(i + 1) / 10n
      return raw > sellTokenFee ? raw - sellTokenFee : 0n
    })

    // ========================================
    // 2. Fetch 20 quotes in parallel
    // ========================================

    const kongPromises = kongAmounts.map(amt =>
      fetchKongQuote(sellTokenSymbol, buyTokenSymbol, amt)
    )
    const icpPromises = icpAmounts.map(amt =>
      fetchICPSwapQuote(sellTokenPrincipal, buyTokenPrincipal, amt)
    )

    const allResults = await Promise.allSettled([...kongPromises, ...icpPromises])

    // ========================================
    // 3. Extract and validate quotes
    // ========================================

    const kong: QuoteData[] = []
    const icp: QuoteData[] = []

    for (let i = 0; i < NUM_QUOTES; i++) {
      const kongResult = allResults[i]
      const icpResult = allResults[NUM_QUOTES + i]

      kong.push(toQuoteData(
        kongResult.status === 'fulfilled' ? kongResult.value : null,
        maxSlippageBP
      ))
      icp.push(toQuoteData(
        icpResult.status === 'fulfilled' ? icpResult.value : null,
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

    // Singles: Kong 100% (index 9)
    if (kong[9].valid) {
      updateBest({
        name: 'SINGLE_KONG',
        kongPct: 10000, icpPct: 0,
        totalOut: kong[9].out,
        kongSlipBP: kong[9].slipBP, icpSlipBP: 0,
        kongIdx: 9, icpIdx: 9,
      })
    }

    // Singles: ICPSwap 100% (index 9)
    if (icp[9].valid) {
      updateBest({
        name: 'SINGLE_ICP',
        kongPct: 0, icpPct: 10000,
        totalOut: icp[9].out,
        kongSlipBP: 0, icpSlipBP: icp[9].slipBP,
        kongIdx: 9, icpIdx: 9,
      })
    }

    // All combinations: 10x10 grid
    for (let kongIdx = 0; kongIdx <= 9; kongIdx++) {
      for (let icpIdx = 0; icpIdx <= 9; icpIdx++) {
        const kongPct = (kongIdx + 1) * STEP_BP
        const icpPct = (icpIdx + 1) * STEP_BP
        const totalPct = kongPct + icpPct

        // Skip if over 100%
        if (totalPct > 10000) continue
        // Skip 100% singles (already handled)
        if (kongPct === 10000 || icpPct === 10000) continue

        if (kong[kongIdx].valid && icp[icpIdx].valid) {
          const totalOut = kong[kongIdx].out + icp[icpIdx].out

          const scenario: Scenario = {
            name: `${totalPct === 10000 ? 'SPLIT' : 'PARTIAL'}_${kongPct / 100}_${icpPct / 100}`,
            kongPct, icpPct, totalOut,
            kongSlipBP: kong[kongIdx].slipBP,
            icpSlipBP: icp[icpIdx].slipBP,
            kongIdx, icpIdx,
          }

          if (totalPct === 10000) {
            // Full split → max output selection
            updateBest(scenario)
          } else {
            // Partial → collected for min slippage selection
            partialScenarios.push(scenario)
          }
        }
      }
    }

    // ========================================
    // 5. Build execution plan from best scenario
    // ========================================

    if (bestScenario) {
      return buildFullPlan(bestScenario, secondBestScenario, kong, icp, amountIn)
    }

    // No full scenario → try partials
    if (partialScenarios.length > 0) {
      return buildPartialPlan(partialScenarios, kong, icp, amountIn)
    }

    // No viable execution — return best single if any quote succeeded at all
    // Find the best raw quote regardless of slippage validation
    const bestKong100 = kong[9].out > 0n ? kong[9] : null
    const bestIcp100 = icp[9].out > 0n ? icp[9] : null

    if (bestKong100 && (!bestIcp100 || bestKong100.out >= bestIcp100.out)) {
      return {
        type: 'single',
        legs: [{
          exchange: 'Kong', pctBP: 10000,
          amountIn, expectedOut: bestKong100.out,
          slipBP: bestKong100.slipBP,
        }],
        totalExpectedOut: bestKong100.out,
        totalSlipBP: bestKong100.slipBP,
        interpolated: false,
        quotes: { kong, icpswap: icp },
      }
    }
    if (bestIcp100) {
      return {
        type: 'single',
        legs: [{
          exchange: 'ICPSwap', pctBP: 10000,
          amountIn, expectedOut: bestIcp100.out,
          slipBP: bestIcp100.slipBP,
        }],
        totalExpectedOut: bestIcp100.out,
        totalSlipBP: bestIcp100.slipBP,
        interpolated: false,
        quotes: { kong, icpswap: icp },
      }
    }

    // Truly no quotes at all
    throw new Error('No viable execution path found — both DEXes returned no quotes')
  }

  /**
   * Build plan from a full scenario (single or split totaling 100%)
   * With interpolation between adjacent scenarios (matching treasury.mo:8770-8878)
   */
  function buildFullPlan(
    best: Scenario,
    secondBest: Scenario | null,
    kong: QuoteData[],
    icp: QuoteData[],
    amountIn: bigint
  ): ExecutionPlan {

    let finalKongPct = best.kongPct
    let finalIcpPct = best.icpPct
    let finalKongSlipBP = best.kongSlipBP
    let finalIcpSlipBP = best.icpSlipBP
    let interpolated = false

    // Attempt interpolation between best and secondBest
    if (secondBest) {
      const bothAreSplits = best.kongPct > 0 && best.kongPct < 10000
        && secondBest.kongPct > 0 && secondBest.kongPct < 10000
      const diff = Math.abs(best.kongPct - secondBest.kongPct)
      const areAdjacent = diff === STEP_BP

      if (bothAreSplits && areAdjacent) {
        const avgKongSlipBP = Math.floor((best.kongSlipBP + secondBest.kongSlipBP) / 2)
        const avgIcpSlipBP = Math.floor((best.icpSlipBP + secondBest.icpSlipBP) / 2)
        const totalSlipBP = avgKongSlipBP + avgIcpSlipBP

        if (totalSlipBP > 0) {
          // Inverse slippage weighting: more goes to the DEX with LOWER slippage
          const kongRatioBP = Math.floor((avgIcpSlipBP * 10000) / totalSlipBP)

          const lowKong = Math.min(best.kongPct, secondBest.kongPct)
          const kongRange = STEP_BP
          finalKongPct = lowKong + Math.floor((kongRatioBP * kongRange) / 10000)
          finalIcpPct = 10000 - finalKongPct

          // Interpolate slippage values
          const lowKongSlip = best.kongPct < secondBest.kongPct ? best.kongSlipBP : secondBest.kongSlipBP
          const highKongSlip = best.kongPct > secondBest.kongPct ? best.kongSlipBP : secondBest.kongSlipBP
          const lowIcpSlip = best.icpPct < secondBest.icpPct ? best.icpSlipBP : secondBest.icpSlipBP
          const highIcpSlip = best.icpPct > secondBest.icpPct ? best.icpSlipBP : secondBest.icpSlipBP

          const kongSlipRange = highKongSlip > lowKongSlip ? highKongSlip - lowKongSlip : 0
          const icpSlipRange = highIcpSlip > lowIcpSlip ? highIcpSlip - lowIcpSlip : 0

          finalKongSlipBP = lowKongSlip + Math.floor((kongRatioBP * kongSlipRange) / 10000)
          finalIcpSlipBP = lowIcpSlip + Math.floor((kongRatioBP * icpSlipRange) / 10000)

          interpolated = true
        }
      }
    }

    // Build plan
    if (finalKongPct === 10000) {
      // Single Kong
      return {
        type: 'single',
        legs: [{
          exchange: 'Kong', pctBP: 10000,
          amountIn, expectedOut: best.totalOut,
          slipBP: finalKongSlipBP,
        }],
        totalExpectedOut: best.totalOut,
        totalSlipBP: finalKongSlipBP,
        interpolated: false,
        quotes: { kong, icpswap: icp },
      }
    }

    if (finalIcpPct === 10000) {
      // Single ICPSwap
      return {
        type: 'single',
        legs: [{
          exchange: 'ICPSwap', pctBP: 10000,
          amountIn, expectedOut: best.totalOut,
          slipBP: finalIcpSlipBP,
        }],
        totalExpectedOut: best.totalOut,
        totalSlipBP: finalIcpSlipBP,
        interpolated: false,
        quotes: { kong, icpswap: icp },
      }
    }

    // Split trade
    const kongAmount = amountIn * BigInt(finalKongPct) / 10000n
    const icpAmount = amountIn - kongAmount // remainder avoids rounding loss

    // Estimate output by scaling from nearest quote
    const kongExpectedOut = best.kongPct > 0
      ? kong[best.kongIdx].out * BigInt(finalKongPct) / BigInt(best.kongPct)
      : 0n
    const icpExpectedOut = best.icpPct > 0
      ? icp[best.icpIdx].out * BigInt(finalIcpPct) / BigInt(best.icpPct)
      : 0n

    return {
      type: 'split',
      legs: [
        {
          exchange: 'Kong', pctBP: finalKongPct,
          amountIn: kongAmount, expectedOut: kongExpectedOut,
          slipBP: finalKongSlipBP,
        },
        {
          exchange: 'ICPSwap', pctBP: finalIcpPct,
          amountIn: icpAmount, expectedOut: icpExpectedOut,
          slipBP: finalIcpSlipBP,
        },
      ],
      totalExpectedOut: kongExpectedOut + icpExpectedOut,
      totalSlipBP: finalKongSlipBP + finalIcpSlipBP,
      interpolated,
      quotes: { kong, icpswap: icp },
    }
  }

  /**
   * Build plan from partial scenarios (sum < 100%)
   * Selection by minimum combined slippage (matching treasury.mo:8526-8767)
   */
  function buildPartialPlan(
    partials: Scenario[],
    kong: QuoteData[],
    icp: QuoteData[],
    amountIn: bigint
  ): ExecutionPlan {

    // Filter: must sum to >= 40%
    const valid = partials.filter(p => (p.kongPct + p.icpPct) >= MIN_PARTIAL_TOTAL_BP)

    if (valid.length === 0) {
      // Fallback: use the partial with highest output
      partials.sort((a, b) => (b.totalOut > a.totalOut ? 1 : b.totalOut < a.totalOut ? -1 : 0))
      const fallback = partials[0]
      return buildPartialFromScenario(fallback, kong, icp, amountIn, false)
    }

    // Sort by combined slippage ascending (lowest first)
    valid.sort((a, b) => (a.kongSlipBP + a.icpSlipBP) - (b.kongSlipBP + b.icpSlipBP))
    const best = valid[0]

    // Attempt interpolation with second-best
    let interpolated = false
    let finalKongPct = best.kongPct
    let finalIcpPct = best.icpPct
    let finalKongSlipBP = best.kongSlipBP
    let finalIcpSlipBP = best.icpSlipBP

    if (valid.length > 1) {
      const second = valid[1]
      const kongDiff = Math.abs(best.kongPct - second.kongPct)
      const icpDiff = Math.abs(best.icpPct - second.icpPct)

      // Both must differ by exactly STEP_BP for partial interpolation
      if (kongDiff === STEP_BP && icpDiff === STEP_BP) {
        const avgKongSlipBP = Math.floor((best.kongSlipBP + second.kongSlipBP) / 2)
        const avgIcpSlipBP = Math.floor((best.icpSlipBP + second.icpSlipBP) / 2)
        const totalSlipBP = avgKongSlipBP + avgIcpSlipBP

        if (totalSlipBP > 0) {
          const kongRatioBP = Math.floor((avgIcpSlipBP * 10000) / totalSlipBP)

          const lowKong = Math.min(best.kongPct, second.kongPct)
          const highKong = Math.max(best.kongPct, second.kongPct)
          const kongRange = highKong - lowKong
          finalKongPct = lowKong + Math.floor((kongRatioBP * kongRange) / 10000)

          const lowIcp = Math.min(best.icpPct, second.icpPct)
          const highIcp = Math.max(best.icpPct, second.icpPct)
          const icpRange = highIcp - lowIcp
          finalIcpPct = highIcp - Math.floor((kongRatioBP * icpRange) / 10000)

          // Interpolate slippage
          const lowKongSlip = best.kongPct < second.kongPct ? best.kongSlipBP : second.kongSlipBP
          const highKongSlip = best.kongPct > second.kongPct ? best.kongSlipBP : second.kongSlipBP
          const lowIcpSlip = best.icpPct < second.icpPct ? best.icpSlipBP : second.icpSlipBP
          const highIcpSlip = best.icpPct > second.icpPct ? best.icpSlipBP : second.icpSlipBP
          const kongSlipRange = highKongSlip > lowKongSlip ? highKongSlip - lowKongSlip : 0
          const icpSlipRange = highIcpSlip > lowIcpSlip ? highIcpSlip - lowIcpSlip : 0

          finalKongSlipBP = lowKongSlip + Math.floor((kongRatioBP * kongSlipRange) / 10000)
          finalIcpSlipBP = lowIcpSlip + Math.floor((kongRatioBP * icpSlipRange) / 10000)

          interpolated = true
        }
      }
    }

    const kongAmount = amountIn * BigInt(finalKongPct) / 10000n
    const icpAmount = amountIn * BigInt(finalIcpPct) / 10000n

    // Closest quote index for expected output estimate
    const closestIdx = (pct: number): number => {
      let bestIdx = 0
      let bestDiff = Math.abs(pct - STEP_BP)
      for (let i = 1; i < NUM_QUOTES; i++) {
        const stepPct = (i + 1) * STEP_BP
        const diff = Math.abs(pct - stepPct)
        if (diff < bestDiff) {
          bestIdx = i
          bestDiff = diff
        }
      }
      return bestIdx
    }

    const kongExpectedOut = kong[closestIdx(finalKongPct)].out
    const icpExpectedOut = icp[closestIdx(finalIcpPct)].out

    return {
      type: 'partial',
      legs: [
        {
          exchange: 'Kong', pctBP: finalKongPct,
          amountIn: kongAmount, expectedOut: kongExpectedOut,
          slipBP: finalKongSlipBP,
        },
        {
          exchange: 'ICPSwap', pctBP: finalIcpPct,
          amountIn: icpAmount, expectedOut: icpExpectedOut,
          slipBP: finalIcpSlipBP,
        },
      ],
      totalExpectedOut: kongExpectedOut + icpExpectedOut,
      totalSlipBP: finalKongSlipBP + finalIcpSlipBP,
      interpolated,
      quotes: { kong, icpswap: icp },
    }
  }

  /**
   * Build a partial plan from a single scenario (no interpolation)
   */
  function buildPartialFromScenario(
    scenario: Scenario,
    kong: QuoteData[],
    icp: QuoteData[],
    amountIn: bigint,
    interpolated: boolean
  ): ExecutionPlan {
    const kongAmount = amountIn * BigInt(scenario.kongPct) / 10000n
    const icpAmount = amountIn * BigInt(scenario.icpPct) / 10000n

    return {
      type: 'partial',
      legs: [
        {
          exchange: 'Kong', pctBP: scenario.kongPct,
          amountIn: kongAmount, expectedOut: kong[scenario.kongIdx].out,
          slipBP: scenario.kongSlipBP,
        },
        {
          exchange: 'ICPSwap', pctBP: scenario.icpPct,
          amountIn: icpAmount, expectedOut: icp[scenario.icpIdx].out,
          slipBP: scenario.icpSlipBP,
        },
      ],
      totalExpectedOut: kong[scenario.kongIdx].out + icp[scenario.icpIdx].out,
      totalSlipBP: scenario.kongSlipBP + scenario.icpSlipBP,
      interpolated,
      quotes: { kong, icpswap: icp },
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

    const legPromises = plan.legs.map(async (leg) => {
      const minAmountOut = BigInt(Math.floor(
        Number(leg.expectedOut) * (1 - slippageTolerance)
      ))

      try {
        let result: any
        if (leg.exchange === 'Kong') {
          result = await kongStore.icrc2_swap({
            sellTokenPrincipal,
            sellTokenSymbol,
            buyTokenPrincipal,
            buyTokenSymbol,
            amountIn: leg.amountIn,
            minAmountOut,
            slippageTolerance,
            onStep: (step: string) => onStep?.('Kong', step),
          })
          // Kong result structure: result is the Ok payload with receive_amount
          const amountOut = result?.receive_amount != null
            ? (typeof result.receive_amount === 'bigint' ? result.receive_amount : BigInt(result.receive_amount))
            : 0n
          return { exchange: 'Kong', success: true, amountOut }
        } else {
          result = await icpswapStore.icrc2_swap({
            sellTokenPrincipal,
            buyTokenPrincipal,
            amountIn: leg.amountIn,
            minAmountOut,
            slippageTolerance,
            onStep: (step: string) => onStep?.('ICPSwap', step),
          })
          // ICPSwap result: { amountOut, swapTxId, withdrawTxId }
          const amountOut = result?.amountOut != null
            ? (typeof result.amountOut === 'bigint' ? result.amountOut : BigInt(result.amountOut))
            : 0n
          return { exchange: 'ICPSwap', success: true, amountOut }
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

    return { totalOut, results: processed }
  }

  return {
    findBestExecution,
    executePlan,
  }
}
