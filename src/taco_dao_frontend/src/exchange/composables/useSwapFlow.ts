/**
 * Swap state machine composable.
 * Based on Sections 5.6, 23.4 of FRONTEND_DEV_GUIDE.md.
 *
 * States: idle → quoteFetching → quoteReady → confirming → depositing → submitting → success/partialFill/error
 */

import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { depositToken, removeDepositFromCache } from '../utils/deposit'
import { classifyExchangeError, classifyTransportReject, isTransportError, verifyAfterTransportError, type ClassifyContext, type VerifyStatus } from '../utils/errors'
import { formatTokenAmount } from '../utils/format'
import { useExchangeToast } from './useExchangeToast'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

/**
 * Probe whether a swap we submitted actually landed. Looks for a SwapRecord
 * in the user's history matching the tokenIn/tokenOut pair, a near-match on
 * amountIn, and a recent timestamp. Used only after a transport-level throw.
 */
async function probeSwapLanded(
  store: ReturnType<typeof useExchangeStore>,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  submittedAtMs: number,
): Promise<VerifyStatus> {
  try {
    const records: any[] = await store.getUserSwapHistory(10n) as any[]
    const nowNs = BigInt(submittedAtMs) * 1_000_000n
    const windowNs = 60n * 1_000_000_000n // 60 s
    const tolerance = amountIn / 20n       // 5 %
    for (const r of records) {
      const ts = BigInt(r.timestamp)
      if (ts + windowNs < nowNs) continue
      if (r.tokenIn !== tokenIn || r.tokenOut !== tokenOut) continue
      const rAmt = BigInt(r.amountIn)
      const diff = rAmt > amountIn ? rAmt - amountIn : amountIn - rAmt
      if (diff <= tolerance) return 'succeeded'
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export type SwapPhase =
  | 'idle'
  | 'quoteFetching'
  | 'quoteReady'
  | 'confirming'
  | 'depositing'
  | 'submitting'
  | 'success'
  | 'partialFill'
  | 'error'

type SwapHop = { tokenIn: string; tokenOut: string }

function buildRoute(tokenIn: string, tokenOut: string, hopDetails: any[]): SwapHop[] {
  if (hopDetails?.length > 0) {
    return hopDetails.map((h: any) => ({ tokenIn: h.tokenIn, tokenOut: h.tokenOut }))
  }
  return [{ tokenIn, tokenOut }]
}

function quoteFromBatchResult(
  fromAddr: string, toAddr: string, r: any, amountIn: bigint,
): SwapQuoteResult | null {
  if (!r || (r.expectedBuyAmount ?? 0n) <= 0n) return null
  const rawHops = (r.hopDetails ?? []) as any[]
  const route = buildRoute(fromAddr, toAddr, rawHops)
  const isMultiHop = rawHops.length > 1

  // For direct pairs the batch returns empty hopDetails — synthesize a single-hop
  // entry so the route visualization (token icons + arrows + per-hop %) still renders.
  const hops = rawHops.length > 0 ? rawHops : [{
    tokenIn: fromAddr,
    tokenOut: toAddr,
    amountIn,
    amountOut: r.expectedBuyAmount,
    fee: r.fee ?? 0n,
    priceImpact: r.priceImpact ?? 0,
  }]

  return {
    expectedBuyAmount: r.expectedBuyAmount,
    fee: r.fee ?? 0n,
    priceImpact: (r.priceImpact ?? 0) * 100,
    routeDescription: r.routeDescription ?? (isMultiHop ? `Multi-hop (${hops.length} hops)` : 'Direct'),
    canFulfillFully: r.canFulfillFully ?? false,
    potentialOrderDetails: r.potentialOrderDetails ?? null,
    isMultiHop,
    route,
    hops: Math.max(hops.length, 1),
    hopDetails: hops.map((h: any) => ({
      ...h,
      priceImpact: h.priceImpact > 0 && h.priceImpact <= 1 ? h.priceImpact * 100 : h.priceImpact,
    })),
  }
}

export interface HopDetailDisplay {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  amountOut: bigint
  fee: bigint
  priceImpact: number
}

export interface SwapQuoteResult {
  expectedBuyAmount: bigint
  fee: bigint
  priceImpact: number
  routeDescription: string
  canFulfillFully: boolean
  potentialOrderDetails: { amount_init: bigint; amount_sell: bigint } | null
  isMultiHop: boolean
  route: Array<{ tokenIn: string; tokenOut: string }> | null
  hops: number
  hopDetails: HopDetailDisplay[]
}

export interface SwapResult {
  amountSent: bigint
  amountReceived: bigint
  fee: bigint
  accesscode?: string
  fillPercent?: number
}

export interface SplitLeg {
  pctBP: number  // basis points (2000 = 20%)
  amountIn: bigint
  expectedOut: bigint
  route: Array<{ tokenIn: string; tokenOut: string }>
  routeKey: string // serialized route for dedup
  hopDetails: HopDetailDisplay[]
  priceImpact: number
}

export interface SplitPlan {
  legs: SplitLeg[]
  totalExpectedOut: bigint
  improvement: number // % improvement over single route
}

export function useSwapFlow() {
  const store = useExchangeStore()
  const toast = useExchangeToast()

  // ── State ──
  const phase = ref<SwapPhase>('idle')
  const tokenFrom = ref<TokenInfo | null>(null)
  const tokenTo = ref<TokenInfo | null>(null)
  const amountIn = ref('')
  const quote = ref<SwapQuoteResult | null>(null)
  const result = ref<SwapResult | null>(null)
  const errorMsg = ref('')
  const errorCanRetry = ref(false)
  const splitPlan = ref<SplitPlan | null>(null)

  // Slippage
  const slippage = ref<number>(
    (() => {
      try {
        const stored = localStorage.getItem('taco_slippage')
        if (stored) return JSON.parse(stored).value ?? 0.5
      } catch { /* ignore */ }
      return 0.5
    })()
  )

  // Bidirectional pair sync with store
  // Store → swap: when header pair changes, update swap tokens
  watch([() => store.selectedToken0, () => store.selectedToken1], ([t0, t1]) => {
    if (t0 && tokenFrom.value?.address !== t0) {
      tokenFrom.value = store.getTokenByAddress(t0) ?? null
    }
    if (t1 && tokenTo.value?.address !== t1) {
      tokenTo.value = store.getTokenByAddress(t1) ?? null
    }
  })

  // Swap → store: when user changes tokens in SwapCard, update store
  watch([tokenFrom, tokenTo], ([from, to]) => {
    if (from?.address && from.address !== store.selectedToken0) {
      store.selectedToken0 = from.address
    }
    if (to?.address && to.address !== store.selectedToken1) {
      store.selectedToken1 = to.address
    }
  })

  // Internal
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let preventNavigation = false

  // Quote polling with decaying interval
  let quotePollTimer: ReturnType<typeof setTimeout> | null = null
  let quoteStartTime: number | null = null

  // ── Computed ──
  const amountInBigInt = computed(() => {
    if (!amountIn.value || !tokenFrom.value) return 0n
    try {
      const dec = Number(tokenFrom.value.decimals)
      const parts = amountIn.value.split('.')
      const whole = BigInt(parts[0] || '0') * 10n ** BigInt(dec)
      const frac = parts[1] ? BigInt(parts[1].padEnd(dec, '0').slice(0, dec)) : 0n
      return whole + frac
    } catch { return 0n }
  })

  const isAmountValid = computed(() => {
    if (!tokenFrom.value || amountInBigInt.value <= 0n) return false
    return amountInBigInt.value >= tokenFrom.value.minimum_amount
  })

  const canSwap = computed(() => {
    if (phase.value !== 'quoteReady' || quote.value === null || !isAmountValid.value) return false
    // Extreme price impact requires explicit user acknowledgement
    if (priceImpactTier.value === 'extreme' && !impactAcknowledged.value) return false
    return true
  })

  const isProcessing = computed(() =>
    ['depositing', 'submitting'].includes(phase.value)
  )

  // Backend-team spec: elevated > 5 %, high > 15 %, extreme > 25 %.
  // The 'extreme' tier requires the user to tick impactAcknowledged before
  // Confirm is enabled.
  const priceImpactTier = computed<'low' | 'elevated' | 'high' | 'extreme'>(() => {
    if (!quote.value) return 'low'
    const impact = quote.value.priceImpact
    if (impact > 25) return 'extreme'
    if (impact > 15) return 'high'
    if (impact > 5) return 'elevated'
    return 'low'
  })
  const impactAcknowledged = ref(false)
  watch(() => quote.value?.priceImpact, () => { impactAcknowledged.value = false })

  // Build the classifier context from the current swap state.
  // hopTokens maps hop index → { symbol } so RouteFailed can name the leg.
  function buildSwapCtx(): ClassifyContext {
    const outTok = tokenTo.value
    const hops = quote.value?.hopDetails ?? []
    return {
      outDecimals: outTok ? Number(outTok.decimals) : undefined,
      outSymbol: outTok?.symbol,
      hopTokens: hops.map(h => {
        const addr = h.tokenOut
        const t = store.tokens.find(tok => tok.address === addr)
        return { symbol: t?.symbol ?? addr.slice(0, 8) }
      }),
    }
  }

  const exchangeRate = computed(() => {
    if (!quote.value || !tokenFrom.value || !tokenTo.value || amountInBigInt.value <= 0n) return null
    const decFrom = Number(tokenFrom.value.decimals)
    const decTo = Number(tokenTo.value.decimals)
    const amtFrom = Number(amountInBigInt.value) / (10 ** decFrom)
    const amtTo = Number(quote.value.expectedBuyAmount) / (10 ** decTo)
    if (amtFrom === 0) return null
    return amtTo / amtFrom
  })

  // Drift banner shown when the last-mile re-quote detects significant movement.
  const needsReconfirm = ref(false)

  /**
   * Pure fetch — no UI state mutation. Returns the freshest SwapQuoteResult
   * for the current pair/amount, or null on failure. Used by the pre-execute
   * drift check; also reusable by fetchQuote below.
   */
  async function fetchFreshQuote(): Promise<SwapQuoteResult | null> {
    if (!tokenFrom.value || !tokenTo.value || amountInBigInt.value <= 0n) return null
    try {
      const r = await store.getExpectedReceiveAmount(
        tokenFrom.value.address, tokenTo.value.address, amountInBigInt.value,
      ) as any
      return quoteFromBatchResult(tokenFrom.value.address, tokenTo.value.address, r, amountInBigInt.value)
    } catch (err) {
      console.error('Fresh quote fetch failed:', err)
      return null
    }
  }

  /**
   * Last-mile drift check. Called just before the swap update call.
   * If the fresh expectedBuyAmount differs from the displayed quote by
   * more than 2 %, reverts to 'quoteReady' with a reconfirm banner and
   * returns false — caller must NOT submit. Otherwise updates quote.value
   * with the fresh numbers and returns true.
   */
  async function requoteAndCheckDrift(): Promise<boolean> {
    const displayed = quote.value
    if (!displayed) return false
    const fresh = await fetchFreshQuote()
    if (!fresh || fresh.expectedBuyAmount <= 0n) {
      errorMsg.value = 'Could not refresh quote before swap. Please try again.'
      phase.value = 'error'
      return false
    }
    // BigInt-safe percent diff
    const a = displayed.expectedBuyAmount
    const b = fresh.expectedBuyAmount
    const denom = a > 0n ? a : 1n
    const diff = a > b ? a - b : b - a
    // drift > 2 % ⇒ diff * 100 > denom * 2
    if (diff * 100n > denom * 2n) {
      quote.value = fresh
      phase.value = 'quoteReady'
      needsReconfirm.value = true
      impactAcknowledged.value = false
      return false
    }
    quote.value = fresh
    needsReconfirm.value = false
    return true
  }

  // ── Quote fetching (1 batch call for primary + split evaluation) ──
  async function fetchQuote(silent = false) {
    if (!tokenFrom.value || !tokenTo.value || amountInBigInt.value <= 0n) {
      phase.value = 'idle'
      quote.value = null
      return
    }

    if (!silent) phase.value = 'quoteFetching'
    const prevQuote = silent ? quote.value : null

    try {
      const fullAmount = amountInBigInt.value
      const fromAddr = tokenFrom.value.address
      const toAddr = tokenTo.value.address

      // 1 batch call: 100% + 10-90% for split evaluation (replaces 10 individual calls)
      const splitBPs = [10000n, 1000n, 2000n, 3000n, 4000n, 5000n, 6000n, 7000n, 8000n, 9000n]
      const requests = splitBPs
        .map(bp => ({ bp, amt: fullAmount * bp / 10000n }))
        .filter(r => r.amt > 0n)

      const batchResults = await store.getExpectedReceiveAmountBatch(
        requests.map(r => ({ tokenSell: fromAddr, tokenBuy: toAddr, amountSell: r.amt }))
      ) as any[]

      // Build primary (100%) quote
      const freshQuote = quoteFromBatchResult(fromAddr, toAddr, batchResults[0], fullAmount) ?? {
        expectedBuyAmount: 0n, fee: 0n, priceImpact: 0,
        routeDescription: 'No route found', canFulfillFully: false,
        potentialOrderDetails: null, isMultiHop: false, route: null, hops: 0, hopDetails: [],
      }

      // ── Split-route evaluation (same logic, sourced from the batch) ──
      const fullOut = freshQuote.expectedBuyAmount
      let newSplitPlan: SplitPlan | null = null

      if (fullOut > 0n && batchResults.length > 1) {
        type QuoteEntry = { bp: number; amountIn: bigint; expectedOut: bigint; route: any; routeKey: string; hopDetails: HopDetailDisplay[]; priceImpact: number }

        const partials: QuoteEntry[] = requests.slice(1).map((req, i) => {
          const r = batchResults[i + 1]
          if (!r || (r.expectedBuyAmount ?? 0n) <= 0n) return null
          const rawHops = (r.hopDetails ?? []) as any[]
          const hops = rawHops.length > 0 ? rawHops : [{
            tokenIn: fromAddr, tokenOut: toAddr,
            amountIn: req.amt, amountOut: r.expectedBuyAmount,
            fee: r.fee ?? 0n, priceImpact: r.priceImpact ?? 0,
          }]
          return {
            bp: Number(req.bp),
            amountIn: req.amt,
            expectedOut: r.expectedBuyAmount as bigint,
            route: buildRoute(fromAddr, toAddr, rawHops),
            routeKey: r.routeDescription ?? 'direct',
            hopDetails: hops.map((h: any) => ({
              ...h,
              priceImpact: h.priceImpact > 0 && h.priceImpact <= 1 ? h.priceImpact * 100 : h.priceImpact,
            })),
            priceImpact: (r.priceImpact ?? 0) * 100,
          }
        }).filter(Boolean) as QuoteEntry[]

        const fullRouteKey = freshQuote.routeDescription ?? 'direct'
        const allQuotes: QuoteEntry[] = [
          ...partials,
          { bp: 10000, amountIn: fullAmount, expectedOut: fullOut, route: freshQuote.route, routeKey: fullRouteKey, hopDetails: freshQuote.hopDetails ?? [], priceImpact: freshQuote.priceImpact ?? 0 },
        ]

        let bestPlanOut = 0n
        let bestPlanLegs: QuoteEntry[] | null = null
        let bestPlanImprovement = 0

        function tryPlan(legs: QuoteEntry[]) {
          const routeSet = new Set(legs.map(l => l.routeKey))
          if (routeSet.size < legs.length) return
          const totalOut = legs.reduce((s, l) => s + l.expectedOut, 0n)
          if (totalOut <= fullOut) return
          if (totalOut > bestPlanOut) {
            bestPlanOut = totalOut
            bestPlanLegs = legs
            bestPlanImprovement = Number((totalOut - fullOut) * 10000n / fullOut) / 100
          }
        }

        const byBP = new Map<number, QuoteEntry>()
        for (const q of allQuotes) byBP.set(q.bp, q)

        // 2-way splits
        for (let i = 0; i < allQuotes.length; i++) {
          const rem = 10000 - allQuotes[i].bp
          const j = byBP.get(rem)
          if (j) tryPlan([allQuotes[i], j])
        }

        // 3-way splits
        for (let i = 0; i < allQuotes.length; i++) {
          for (let j = i; j < allQuotes.length; j++) {
            const rem = 10000 - allQuotes[i].bp - allQuotes[j].bp
            if (rem <= 0 || rem >= 10000) continue
            const k = byBP.get(rem)
            if (k) tryPlan([allQuotes[i], allQuotes[j], k])
          }
        }

        // 4-way splits
        for (let i = 0; i < allQuotes.length; i++) {
          for (let j = i; j < allQuotes.length; j++) {
            for (let k = j; k < allQuotes.length; k++) {
              const rem = 10000 - allQuotes[i].bp - allQuotes[j].bp - allQuotes[k].bp
              if (rem <= 0 || rem >= 10000) continue
              const l = byBP.get(rem)
              if (l) tryPlan([allQuotes[i], allQuotes[j], allQuotes[k], l])
            }
          }
        }

        // 5-way splits
        for (let i = 0; i < allQuotes.length; i++) {
          for (let j = i; j < allQuotes.length; j++) {
            for (let k = j; k < allQuotes.length; k++) {
              for (let l = k; l < allQuotes.length; l++) {
                const rem = 10000 - allQuotes[i].bp - allQuotes[j].bp - allQuotes[k].bp - allQuotes[l].bp
                if (rem <= 0 || rem >= 10000) continue
                const m = byBP.get(rem)
                if (m) tryPlan([allQuotes[i], allQuotes[j], allQuotes[k], allQuotes[l], m])
              }
            }
          }
        }

        if (bestPlanLegs && bestPlanImprovement > 0.1) {
          newSplitPlan = {
            legs: (bestPlanLegs as QuoteEntry[]).map(l => ({
              pctBP: l.bp, amountIn: l.amountIn, expectedOut: l.expectedOut,
              route: l.route, routeKey: l.routeKey, hopDetails: l.hopDetails, priceImpact: l.priceImpact,
            })),
            totalExpectedOut: bestPlanOut,
            improvement: bestPlanImprovement,
          }
        }
      }

      // ── UI update — same guards as before ──
      if (newSplitPlan && newSplitPlan.improvement > 0.1) {
        splitPlan.value = newSplitPlan
        quote.value = {
          ...freshQuote,
          expectedBuyAmount: newSplitPlan.totalExpectedOut,
          routeDescription: `Split: ${newSplitPlan.legs.map(l => `${l.pctBP / 100}%`).join(' + ')}`,
        }
        if (!silent) phase.value = 'quoteReady'
        console.log(`[Swap] Split route found: ${newSplitPlan.improvement.toFixed(2)}% better — ${newSplitPlan.legs.map(l => `${l.pctBP/100}% via ${l.routeKey}`).join(', ')}`)
      } else if (silent && prevQuote
        && prevQuote.expectedBuyAmount === freshQuote.expectedBuyAmount
        && prevQuote.fee === freshQuote.fee
        && prevQuote.priceImpact === freshQuote.priceImpact) {
        splitPlan.value = null
      } else {
        splitPlan.value = null
        quote.value = freshQuote
        if (!silent) phase.value = 'quoteReady'
      }

      scheduleQuotePoll()
    } catch (err) {
      console.error('Quote fetch failed:', err)
      if (!silent) {
        quote.value = null
        phase.value = 'idle'
      }
    }
  }

  function stopQuotePoll() {
    if (quotePollTimer) { clearTimeout(quotePollTimer); quotePollTimer = null }
  }

  function getQuotePollInterval(): number {
    if (!quoteStartTime) return 5_000
    const elapsed = Date.now() - quoteStartTime
    if (elapsed < 5 * 60_000) return 5_000     // first 5 min: every 5s
    if (elapsed < 10 * 60_000) return 30_000    // 5-10 min: every 30s
    return 60_000                                // after 10 min: every 60s
  }

  function scheduleQuotePoll() {
    stopQuotePoll()
    if (!isAmountValid.value || !tokenFrom.value || !tokenTo.value) return
    if (!quoteStartTime) quoteStartTime = Date.now()
    quotePollTimer = setTimeout(async () => {
      if (phase.value !== 'quoteReady') return
      try {
        await fetchQuote(true)
      } catch { /* ignore silent refresh errors */ }
    }, getQuotePollInterval())
  }

  function debouncedFetchQuote() {
    if (debounceTimer) clearTimeout(debounceTimer)
    stopQuotePoll()
    quoteStartTime = null // reset decay schedule on new user input
    if (!isAmountValid.value) {
      phase.value = 'idle'
      quote.value = null
      return
    }
    phase.value = 'quoteFetching'
    debounceTimer = setTimeout(fetchQuote, 500)
  }

  // Watch amount changes
  watch(amountIn, debouncedFetchQuote)
  watch([tokenFrom, tokenTo], () => {
    if (amountIn.value) debouncedFetchQuote()
  })

  // ── Swap execution ──
  function startSwap() {
    if (!canSwap.value) return
    stopQuotePoll()
    phase.value = 'confirming'
  }

  function cancelConfirm() {
    phase.value = 'quoteReady'
  }

  async function executeSplitSwap() {
    if (!tokenFrom.value || !tokenTo.value || !quote.value || !splitPlan.value) return
    const plan = splitPlan.value

    console.log(`[Swap] Split execution: ${plan.legs.length} legs, improvement ${plan.improvement.toFixed(2)}%`)

    // Last-mile re-quote: catch >2% drift before we move tokens.
    // If drift detected, phase reverts to 'quoteReady' with a reconfirm banner.
    phase.value = 'submitting'
    const ok = await requoteAndCheckDrift()
    if (!ok) return

    // 1. Single deposit for the FULL amount (same as regular swap)
    phase.value = 'depositing'
    let blockNumber: bigint
    try {
      blockNumber = await depositToken(
        tokenFrom.value.address,
        tokenFrom.value.asset_type,
        amountInBigInt.value,
        store.tradingFeeBps,
        tokenFrom.value.transfer_fee,
        store.treasuryAccountId,
        store.treasuryPrincipal,
      )
      console.log('[Swap] Split deposit OK, blockNumber:', blockNumber.toString())
    } catch (err: any) {
      errorMsg.value = `Deposit failed: ${err.message || err}`
      errorCanRetry.value = true
      phase.value = 'error'
      toast.error('Swap Failed', errorMsg.value)
      return
    }

    // 2. Build split legs for backend
    phase.value = 'submitting'
    const splits = plan.legs.map(leg => ({
      amountIn: leg.amountIn,
      route: leg.route,
      minLegOut: 0n, // rely on global minAmountOut
    }))

    const minOut = quote.value.expectedBuyAmount *
      BigInt(Math.floor((100 - slippage.value) * 100)) / 10000n

    console.log('[Swap] swapSplitRoutes call:', {
      tokenIn: tokenFrom.value.address, tokenOut: tokenTo.value.address,
      legs: splits.length, minOut: minOut.toString(), block: blockNumber.toString(),
    })

    // Debug handoff (item 7): paste this block to backend when a swap misbehaves.
    console.info('[Swap debug handoff]', {
      ts: new Date().toISOString(),
      flow: 'splitSwap',
      tokenIn: tokenFrom.value.address,
      tokenOut: tokenTo.value.address,
      amountIn: amountInBigInt.value.toString(),
      slippagePct: slippage.value,
      quoteResponse: {
        expectedBuyAmount: quote.value.expectedBuyAmount.toString(),
        priceImpact: quote.value.priceImpact,
        routeDescription: quote.value.routeDescription,
        hops: quote.value.hops,
      },
      minAmountOut: minOut.toString(),
    })

    try {
      const rawResult = await store.swapSplitRoutes(
        tokenFrom.value.address,
        tokenTo.value.address,
        splits,
        minOut,
        blockNumber,
      )

      console.log('[Swap] swapSplitRoutes result:', rawResult)

      if ('Ok' in rawResult) {
        const swap = rawResult.Ok
        result.value = {
          amountSent: swap.amountIn,
          amountReceived: swap.amountOut,
          fee: swap.fee,
        }
        phase.value = 'success'
        removeDepositFromCache(blockNumber.toString())
        await store.refreshAfterMutation('swap')
        toast.success('Split Swap Complete', formatTokenAmount(swap.amountOut, Number(tokenTo.value.decimals), tokenTo.value.symbol) + ' received via ' + plan.legs.length + ' routes')
      } else {
        const classified = classifyExchangeError(rawResult.Err, buildSwapCtx())
        errorMsg.value = classified.message
        errorCanRetry.value = classified.recoverable
        phase.value = 'error'
        toast.error(classified.title, classified.message)
      }
    } catch (err: any) {
      console.error('[Swap] Split swap error:', err)
      if (isTransportError(err)) {
        const submittedAt = Date.now()
        const status = await verifyAfterTransportError(() =>
          probeSwapLanded(store, tokenFrom.value!.address, tokenTo.value!.address, amountInBigInt.value, submittedAt)
        )
        if (status === 'succeeded') {
          removeDepositFromCache(blockNumber.toString())
          await store.refreshAfterMutation('swap')
          phase.value = 'success'
          toast.success('Split Swap Complete', 'Network hiccup during submit — confirmed via query.')
          return
        }
        errorMsg.value = 'Network issue during submit. Refresh to verify before retrying — your tokens are safe.'
        errorCanRetry.value = true
        phase.value = 'error'
        toast.warning('Network issue', errorMsg.value)
        return
      }
      errorMsg.value = err.message || 'Split swap failed'
      errorCanRetry.value = true
      phase.value = 'error'
      toast.error('Swap Failed', errorMsg.value)
    }
  }

  async function confirmSwap() {
    if (!tokenFrom.value || !tokenTo.value || !quote.value) return

    // Prevent navigation during swap
    preventNavigation = true
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnloadHandler)

    // Lifted out of the try so the catch below (transport-error probe) can
    // reference it when deciding whether to clear the pending-deposit cache.
    let blockNumber: bigint | null = null

    try {
      // ── Split execution path ──
      if (splitPlan.value && splitPlan.value.legs.length > 1) {
        await executeSplitSwap()
        return
      }

      // ── Single route execution ──
      // Last-mile re-quote: >2 % drift reverts to 'quoteReady' with a banner
      // and skips this execute. User must press Confirm again on the new number.
      phase.value = 'submitting'
      const driftOk = await requoteAndCheckDrift()
      if (!driftOk) return

      // 1. Deposit
      phase.value = 'depositing'
      console.log('[Swap] Depositing:', {
        token: tokenFrom.value.address, amount: amountInBigInt.value.toString(),
        feeBps: store.tradingFeeBps.toString(), transferFee: tokenFrom.value.transfer_fee.toString(),
      })
      blockNumber = await depositToken(
        tokenFrom.value.address,
        tokenFrom.value.asset_type,
        amountInBigInt.value,
        store.tradingFeeBps,
        tokenFrom.value.transfer_fee,
        store.treasuryAccountId,
        store.treasuryPrincipal,
      )
      console.log('[Swap] Deposit OK, blockNumber:', blockNumber.toString())

      // 2. Submit via swapMultiHop (works for both direct 1-hop and multi-hop routes)
      phase.value = 'submitting'

      if (!quote.value.route?.length) {
        throw new Error('No route available for this swap')
      }

      const minOut = quote.value.expectedBuyAmount *
        BigInt(Math.floor((100 - slippage.value) * 100)) / 10000n

      console.log('[Swap] swapMultiHop call:', {
        tokenIn: tokenFrom.value.address, tokenOut: tokenTo.value.address,
        amountIn: amountInBigInt.value.toString(), route: quote.value.route,
        minOut: minOut.toString(), blockNumber: blockNumber.toString(),
      })

      // Debug handoff (item 7): paste this block to backend when a swap misbehaves.
      console.info('[Swap debug handoff]', {
        ts: new Date().toISOString(),
        flow: 'singleSwap',
        tokenIn: tokenFrom.value.address,
        tokenOut: tokenTo.value.address,
        amountIn: amountInBigInt.value.toString(),
        slippagePct: slippage.value,
        quoteResponse: {
          expectedBuyAmount: quote.value.expectedBuyAmount.toString(),
          priceImpact: quote.value.priceImpact,
          routeDescription: quote.value.routeDescription,
          hops: quote.value.hops,
        },
        minAmountOut: minOut.toString(),
      })

      const rawResult = await store.swapMultiHop(
        tokenFrom.value.address,
        tokenTo.value.address,
        amountInBigInt.value,
        quote.value.route,
        minOut,
        blockNumber,
      )

      console.log('[Swap] swapMultiHop result:', rawResult)

      // 3. Handle result (structured Result type)
      if ('Ok' in rawResult) {
        const swap = rawResult.Ok
        result.value = {
          amountSent: swap.amountIn,
          amountReceived: swap.amountOut,
          fee: swap.fee,
        }
        phase.value = 'success'
        if (blockNumber != null) removeDepositFromCache(blockNumber.toString())
        await store.refreshAfterMutation('swap')
        toast.success('Swap Complete', formatTokenAmount(swap.amountOut, Number(tokenTo.value!.decimals), tokenTo.value!.symbol) + ' received')
      } else {
        const classified = classifyExchangeError(rawResult.Err, buildSwapCtx())
        errorMsg.value = classified.message
        errorCanRetry.value = classified.recoverable
        phase.value = 'error'
        toast.error(classified.title, classified.message)
      }
    } catch (err: any) {
      console.error('[Swap] Error:', err)
      if (isTransportError(err) && blockNumber != null) {
        const submittedAt = Date.now()
        const status = await verifyAfterTransportError(() =>
          probeSwapLanded(store, tokenFrom.value!.address, tokenTo.value!.address, amountInBigInt.value, submittedAt)
        )
        if (status === 'succeeded') {
          removeDepositFromCache(blockNumber.toString())
          await store.refreshAfterMutation('swap')
          phase.value = 'success'
          toast.success('Swap Complete', 'Network hiccup during submit — confirmed via query.')
          return
        }
        errorMsg.value = 'Network issue during submit. Refresh to verify before retrying — your tokens are safe.'
        errorCanRetry.value = true
        phase.value = 'error'
        toast.warning('Network issue', errorMsg.value)
        return
      }
      errorMsg.value = err.message || 'An unexpected error occurred'
      errorCanRetry.value = true
      phase.value = 'error'
      toast.error('Swap Failed', err.message || 'An unexpected error occurred')
    } finally {
      preventNavigation = false
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  }

  // ── Token flip ──
  function flipTokens() {
    const temp = tokenFrom.value
    tokenFrom.value = tokenTo.value
    tokenTo.value = temp
    // Amount stays, quote will refresh via watcher
  }

  // ── Reset ──
  function reset() {
    stopQuotePoll()
    quoteStartTime = null
    phase.value = 'idle'
    amountIn.value = ''
    quote.value = null
    result.value = null
    errorMsg.value = ''
    errorCanRetry.value = false
  }

  function tryAgain() {
    phase.value = 'idle'
    result.value = null
    errorMsg.value = ''
    // Keep tokens and amount so user can retry
    if (amountIn.value) debouncedFetchQuote()
  }

  // Set MAX amount
  function setMaxAmount() {
    if (!tokenFrom.value) return
    // Leave room for transfer fee
    const fee = tokenFrom.value.transfer_fee
    // We also need room for trading fee
    const tradingFee = (amountInBigInt.value * store.tradingFeeBps) / 10000n
    // Get wallet balance — for now this is a placeholder
    // In the real implementation, the swap card component passes the balance
  }

  // Cleanup
  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    stopQuotePoll()
  })

  return {
    // State
    phase,
    tokenFrom,
    tokenTo,
    amountIn,
    quote,
    result,
    errorMsg,
    errorCanRetry,
    slippage,
    splitPlan,
    needsReconfirm,

    // Computed
    amountInBigInt,
    isAmountValid,
    canSwap,
    isProcessing,
    priceImpactTier,
    impactAcknowledged,
    exchangeRate,

    // Actions
    startSwap,
    cancelConfirm,
    confirmSwap,
    flipTokens,
    reset,
    tryAgain,
    fetchQuote: debouncedFetchQuote,
  }
}
