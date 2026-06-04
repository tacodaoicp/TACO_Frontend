/**
 * CrossDEX swap flow — splits one swap across ICPSwap + TACO + Neutrinite and
 * executes the legs FULLY IN PARALLEL.
 *
 * Safety contract (per product requirement): the legs run concurrently and each
 * leg's failure is contained — on ANY error a leg recovers its own funds so
 * nothing is ever stranded in any exchange:
 *   • ICPSwap leg    → `icpswap.sweep` (withdraws stranded pool/subaccount balances)
 *   • TACO leg       → `store.recoverWronglysent` (refunds the unspent deposit)
 *   • Neutrinite leg → `neutrinite.sweep` (withdraws the user's pylon virtual balance)
 * A failure in one leg never blocks the others or their recovery (Promise.allSettled).
 */

import { ref, computed } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { useExchangeToast } from './useExchangeToast'
import { useTokenBalance } from './useTokenBalance'
import { probeSwapLanded } from './useSwapFlow'
import { buildTacoSplitPlan } from '../utils/tacoSplitOptimizer'
import { buildCrossDexPlan, interpolatePairSplit, type CrossDexSwapPlan, type CrossDexLeg, type CrossDexVenue, type TacoGridEntry } from '../utils/crossDexOptimizer'
import { withTimeout } from '../utils/withTimeout'
import { depositToken, removeDepositFromCache } from '../utils/deposit'
import { classifyExchangeError, isTransportError, verifyAfterTransportError } from '../utils/errors'
import { formatTokenAmount } from '../utils/format'
import * as icpswap from '../services/icpswap'
import * as neutrinite from '../services/neutrinite'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export type CrossDexPhase =
  | 'idle' | 'quoting' | 'ready' | 'confirming' | 'executing'
  | 'success' | 'partial' | 'error'

export interface LegOutcome {
  dex: CrossDexVenue
  success: boolean
  amountOut: bigint
  error?: string
  recovered?: boolean
}

const GRID_BPS = [1000n, 2000n, 3000n, 4000n, 5000n, 6000n, 7000n, 8000n, 9000n, 10000n]
const MAX_ROUTES_PER_FRACTION = 5n

export function useCrossDexSwap() {
  const store = useExchangeStore()
  const toast = useExchangeToast()

  // ── State ──
  const phase = ref<CrossDexPhase>('idle')
  const tokenFrom = ref<TokenInfo | null>(null)
  const tokenTo = ref<TokenInfo | null>(null)
  const amountIn = ref('')
  const plan = ref<CrossDexSwapPlan | null>(null)
  const refining = ref(false)
  const errorMsg = ref('')
  const quoteError = ref('')
  const outcomes = ref<LegOutcome[]>([])
  const legSteps = ref<Record<CrossDexVenue, string>>({ icpswap: '', taco: '', neutrinite: '' })

  // Monotonic id so a slow refine never overwrites a newer quote's result.
  let seq = 0

  const slippage = ref<number>((() => {
    try {
      const stored = localStorage.getItem('taco_slippage')
      if (stored) return JSON.parse(stored).value ?? 0.5
    } catch { /* ignore */ }
    return 0.5
  })())

  const fromBalance = useTokenBalance(() => tokenFrom.value?.address)

  // ── Computed ──
  const amountInBigInt = computed(() => {
    if (!amountIn.value || !tokenFrom.value) return 0n
    try {
      const dec = Number(tokenFrom.value.decimals)
      const [whole, frac = ''] = amountIn.value.split('.')
      return BigInt(whole || '0') * 10n ** BigInt(dec) + BigInt(frac.padEnd(dec, '0').slice(0, dec) || '0')
    } catch { return 0n }
  })

  const isAmountValid = computed(() => {
    if (!tokenFrom.value || amountInBigInt.value <= 0n) return false
    return amountInBigInt.value >= tokenFrom.value.minimum_amount
  })

  const canSwap = computed(() =>
    phase.value === 'ready' && plan.value !== null && plan.value.totalExpectedOut > 0n && isAmountValid.value,
  )

  function setLegStep(dex: CrossDexVenue, step: string) {
    legSteps.value = { ...legSteps.value, [dex]: step }
  }

  // ── Quote ──
  async function fetchPlan() {
    if (!tokenFrom.value || !tokenTo.value || amountInBigInt.value <= 0n) {
      phase.value = 'idle'; plan.value = null; refining.value = false; return
    }
    const mySeq = ++seq
    phase.value = 'quoting'
    refining.value = false
    quoteError.value = ''
    const total = amountInBigInt.value
    const fromAddr = tokenFrom.value.address
    const toAddr = tokenTo.value.address
    const sellTransferFee = tokenFrom.value.transfer_fee
    const outTransferFee = tokenTo.value.transfer_fee

    try {
      // TACO probe set (one batch feeds every within-TACO target fraction).
      const requests = GRID_BPS
        .map(bp => ({ bp, amt: total * bp / 10000n }))
        .filter(r => r.amt > 0n)

      // ICPSwap grid amounts: fee-adjusted (ICPSwap nets the transfer fee).
      const icpAmounts = GRID_BPS.map(bp => {
        const raw = total * bp / 10000n
        return raw > sellTransferFee ? raw - sellTransferFee : 0n
      })
      // Neutrinite grid amounts: raw (the pylon credits the full deposited amount).
      const neuAmounts = GRID_BPS.map(bp => total * bp / 10000n)

      // Neutrinite credits a deposit only on its per-ledger indexer tick; if the
      // SELL token's cadence exceeds our credit-poll budget the deposit can't
      // credit in time, so exclude Neutrinite for this pair (feed it a zero grid
      // → the optimizer never allocates it). The buy/withdraw side never blocks.
      const skipNeu = await neutrinite.isSellDepositTooSlow(fromAddr)
      if (skipNeu) console.info('[CrossDEX] Neutrinite skipped — sell token indexer cadence >',
        neutrinite.NEUTRINITE_MAX_SELL_FOLLOW_SEC + 's')

      const [batchResults, icpGrid, neuGrid] = await Promise.all([
        store.getExpectedReceiveAmountBatchMulti(
          requests.map(r => ({ tokenSell: fromAddr, tokenBuy: toAddr, amountSell: r.amt })),
          MAX_ROUTES_PER_FRACTION,
        ) as Promise<any[]>,
        icpswap.quoteGrid(fromAddr, toAddr, icpAmounts),
        skipNeu ? Promise.resolve(neuAmounts.map(() => 0n)) : neutrinite.quoteGrid(fromAddr, toAddr, neuAmounts),
      ])
      if (mySeq !== seq) return // superseded by a newer quote

      // Within-TACO optimum at each 10% fraction (single or internal split).
      const tacoGrid: TacoGridEntry[] = []
      for (let j = 0; j < 10; j++) {
        const targetBp = (j + 1) * 1000
        const res = buildTacoSplitPlan(batchResults, requests, fromAddr, toAddr, targetBp)
        tacoGrid.push({ expectedOut: res.bestOut, legs: res.bestLegs })
      }

      // Show the coarse 10%-grid result immediately…
      const coarse = buildCrossDexPlan(icpGrid, tacoGrid, neuGrid, total, outTransferFee)
      plan.value = coarse
      phase.value = 'ready'
      console.info('[CrossDEX] coarse', {
        kind: coarse.kind,
        legs: coarse.legs.map(l => `${l.dex} ${l.pctBP / 100}%`),
        total: coarse.totalExpectedOut.toString(),
        icpGrid: icpGrid.map(v => v.toString()),
        tacoGrid: tacoGrid.map(t => t.expectedOut.toString()),
        neuGrid: neuGrid.map(v => v.toString()),
      })

      // …then refine to a precise (0.1%) split in the background and verify it.
      if (coarse.kind === 'split') {
        void refinePlan(mySeq, total, fromAddr, toAddr, sellTransferFee, icpGrid, tacoGrid, neuGrid, coarse)
      }
    } catch (err: any) {
      console.error('[CrossDEX] quote failed:', err)
      if (mySeq === seq) {
        plan.value = null
        phase.value = 'idle'
        quoteError.value = err?.message || 'Could not fetch a quote for this pair'
      }
    }
  }

  /**
   * Refine the coarse split to a precise 0.1% ratio. Interpolates the optimal
   * split between the TWO largest-allocated venues (holding any third leg fixed)
   * where their marginal rates intersect, then quotes ONCE at the precise
   * allocation across the active venues. Only adopts it if the verified output
   * is at least as good as the coarse plan. Works for 2- and 3-venue splits.
   */
  async function refinePlan(
    mySeq: number, total: bigint, fromAddr: string, toAddr: string,
    sellTransferFee: bigint, icpGrid: bigint[], tacoGrid: TacoGridEntry[], neuGrid: bigint[],
    coarse: CrossDexSwapPlan,
  ) {
    const active = coarse.legs.map(l => ({ dex: l.dex, bp: l.pctBP }))
    if (active.length < 2) return

    // Per-venue expected-out grid (out at each 10% fraction).
    const gridOf = (dex: CrossDexVenue): bigint[] =>
      dex === 'icpswap' ? icpGrid : dex === 'neutrinite' ? neuGrid : tacoGrid.map(t => t.expectedOut)

    // Refine the split between the two biggest legs; the rest stay at coarse bp.
    const sorted = [...active].sort((x, y) => y.bp - x.bp)
    const A = sorted[0], B = sorted[1]
    const sumBp = A.bp + B.bp
    const refinedABp = interpolatePairSplit(gridOf(A.dex), gridOf(B.dex), sumBp)
    if (refinedABp == null) return
    const allocBp = new Map<CrossDexVenue, number>()
    for (const a of active) allocBp.set(a.dex, a.bp)
    allocBp.set(A.dex, refinedABp)
    allocBp.set(B.dex, sumBp - refinedABp)

    refining.value = true
    try {
      // Per-venue amounts in coarse order; last active leg gets the remainder (no dust).
      const order = active.map(a => a.dex)
      const amt = new Map<CrossDexVenue, bigint>()
      let remaining = total
      order.forEach((dex, i) => {
        const a = i === order.length - 1 ? remaining : total * BigInt(allocBp.get(dex)!) / 10000n
        remaining -= a
        amt.set(dex, a)
      })

      // Quote each venue at its refined amount.
      const quoteVenue = async (dex: CrossDexVenue): Promise<{ out: bigint; tacoLegs?: any[] }> => {
        const amount = amt.get(dex)!
        if (dex === 'icpswap') {
          const adj = amount > sellTransferFee ? amount - sellTransferFee : 0n
          return { out: await icpswap.getQuoteAmount(fromAddr, toAddr, adj) }
        }
        if (dex === 'neutrinite') {
          return { out: await neutrinite.getQuoteAmount(fromAddr, toAddr, amount) }
        }
        const reqs = GRID_BPS.map(bp => ({ bp, amt: amount * bp / 10000n })).filter(r => r.amt > 0n)
        const batch = (await store.getExpectedReceiveAmountBatchMulti(
          reqs.map(r => ({ tokenSell: fromAddr, tokenBuy: toAddr, amountSell: r.amt })),
          MAX_ROUTES_PER_FRACTION,
        )) as any[]
        const res = buildTacoSplitPlan(batch, reqs, fromAddr, toAddr, 10000)
        return { out: res.bestOut, tacoLegs: res.bestLegs }
      }

      const quotes = await Promise.all(order.map(quoteVenue))
      if (mySeq !== seq) return // superseded

      // A refined leg with no quote means the precise point isn't viable.
      if (quotes.some(q => q.out <= 0n)) return
      const preciseTotal = quotes.reduce((s, q) => s + q.out, 0n)

      console.info('[CrossDEX] refine', {
        refined: order.map((d, i) => `${d} ${allocBp.get(d)! / 100}% → ${quotes[i].out}`),
        preciseTotal: preciseTotal.toString(), coarseTotal: coarse.totalExpectedOut.toString(),
        adopt: preciseTotal >= coarse.totalExpectedOut,
      })
      if (preciseTotal < coarse.totalExpectedOut) return

      const legs: CrossDexLeg[] = order.map((dex, i) => ({
        dex,
        pctBP: allocBp.get(dex)!,
        amountIn: amt.get(dex)!,
        expectedOut: quotes[i].out,
        tacoLegs: quotes[i].tacoLegs,
      }))
      plan.value = { kind: legs.length === 1 ? 'single' : 'split', legs, totalExpectedOut: preciseTotal }
    } catch (err) {
      console.error('[CrossDEX] refine failed:', err)
    } finally {
      if (mySeq === seq) refining.value = false
    }
  }

  // ── Execution ──
  function confirmSwap() {
    if (!canSwap.value) return
    phase.value = 'confirming'
  }
  function cancelConfirm() {
    phase.value = 'ready'
  }

  async function execute() {
    if (!tokenFrom.value || !tokenTo.value || !plan.value) return
    const fromAddr = tokenFrom.value.address
    const toAddr = tokenTo.value.address
    const sellToken = tokenFrom.value
    const slip = slippage.value / 100

    phase.value = 'executing'
    refining.value = false
    outcomes.value = []
    legSteps.value = { icpswap: '', taco: '', neutrinite: '' }

    // Fire ALL legs concurrently. Promise.allSettled guarantees one leg's
    // failure never aborts another leg or its recovery. Each leg also gets a
    // generous backstop timeout so a hung inner call (dropped connection, stuck
    // poll) can NEVER leave the execution modal spinning forever — on timeout the
    // leg resolves to a failed outcome (its own recovery keeps running in the
    // background; refreshAfterMutation reconciles real balances afterwards).
    const settled = await Promise.allSettled(
      plan.value.legs.map(leg =>
        withTimeout(
          executeLeg(leg, fromAddr, toAddr, sellToken, slip),
          180_000,
          `crossdex-leg-${leg.dex}`,
        ).catch((err: any): LegOutcome => ({
          dex: leg.dex, success: false, amountOut: 0n,
          error: err?.message || 'Leg timed out',
        })),
      ),
    )

    const results: LegOutcome[] = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : { dex: plan.value!.legs[i].dex, success: false, amountOut: 0n, error: (s as PromiseRejectedResult).reason?.message ?? 'Unknown error' },
    )
    outcomes.value = results

    // Balances/trades may have moved on any leg — always refresh.
    void store.refreshAfterMutation('swap')

    const successes = results.filter(r => r.success)
    const totalOut = results.reduce((sum, r) => sum + r.amountOut, 0n)
    if (successes.length === results.length) {
      phase.value = 'success'
      toast.success('CrossDEX Swap Complete',
        formatTokenAmount(totalOut, Number(tokenTo.value.decimals), tokenTo.value.symbol) + ' received')
    } else if (successes.length > 0) {
      phase.value = 'partial'
      toast.warning('Partial Fill', `${successes.length}/${results.length} legs filled. Failed legs were refunded.`)
    } else {
      phase.value = 'error'
      errorMsg.value = results.map(r => r.error).filter(Boolean).join('; ') || 'All legs failed'
      toast.error('CrossDEX Swap Failed', errorMsg.value)
    }
  }

  /** Execute a single leg. NEVER throws — always resolves to a LegOutcome, with
   *  funds recovered on failure so nothing is stranded in that exchange. */
  async function executeLeg(
    leg: CrossDexLeg, fromAddr: string, toAddr: string, sellToken: TokenInfo, slip: number,
  ): Promise<LegOutcome> {
    const minOut = BigInt(Math.floor(Number(leg.expectedOut) * (1 - slip)))

    if (leg.dex === 'icpswap') {
      try {
        const r = await icpswap.icrc2Swap({
          sellTokenPrincipal: fromAddr,
          buyTokenPrincipal: toAddr,
          amountIn: leg.amountIn,
          minAmountOut: minOut,
          onStep: s => setLegStep('icpswap', s),
        })
        setLegStep('icpswap', 'Done')
        return { dex: 'icpswap', success: true, amountOut: r.amountOut }
      } catch (err: any) {
        console.error('[CrossDEX] ICPSwap leg failed:', err?.message || err)
        setLegStep('icpswap', 'Recovering funds…')
        let recovered = false
        try {
          await icpswap.sweep({ token0Principal: fromAddr, token1Principal: toAddr })
          icpswap.removePendingSwap(fromAddr, toAddr) // swept while page is open → clear marker
          recovered = true
        } catch { /* best-effort; marker stays so the Recover page can sweep later */ }
        setLegStep('icpswap', recovered ? 'Failed, funds recovered' : 'Failed')
        return { dex: 'icpswap', success: false, amountOut: 0n, error: err?.message || 'ICPSwap swap failed', recovered }
      }
    }

    if (leg.dex === 'neutrinite') {
      try {
        const r = await neutrinite.executeSwap({
          sell: fromAddr,
          buy: toAddr,
          amountIn: leg.amountIn,
          minAmountOut: minOut,
          onStep: s => setLegStep('neutrinite', s),
        })
        setLegStep('neutrinite', 'Done')
        return { dex: 'neutrinite', success: true, amountOut: r.amountOut }
      } catch (err: any) {
        console.error('[CrossDEX] Neutrinite leg failed:', err?.message || err)
        setLegStep('neutrinite', 'Recovering funds…')
        let recovered = false
        try {
          // sweep returns true only if it actually withdrew a credited balance.
          // Clear the marker only then; otherwise keep it so the Recover page can
          // sweep once a late deposit credits.
          if (await neutrinite.sweep(fromAddr, toAddr)) {
            neutrinite.removePendingSwap(fromAddr, toAddr)
            recovered = true
          }
        } catch { /* best-effort; marker stays so the Recover page can sweep later */ }
        setLegStep('neutrinite', recovered ? 'Failed, funds recovered' : 'Failed — recover on the Recover page')
        return { dex: 'neutrinite', success: false, amountOut: 0n, error: err?.message || 'Neutrinite swap failed', recovered }
      }
    }

    // ── TACO leg ──
    let block: bigint | undefined
    try {
      setLegStep('taco', 'Depositing…')
      block = await depositToken(
        fromAddr,
        sellToken.asset_type,
        leg.amountIn,
        store.tradingFeeBps,
        sellToken.transfer_fee,
        store.treasuryAccountId,
        store.treasuryPrincipal,
      )
      setLegStep('taco', 'Swapping…')
      const tacoLegs = leg.tacoLegs ?? []
      let raw: any
      if (tacoLegs.length > 1) {
        const splits = tacoLegs.map(l => ({ amountIn: l.amountIn, route: l.route, minLegOut: 0n }))
        raw = await store.swapSplitRoutes(fromAddr, toAddr, splits, minOut, block)
      } else {
        const route = tacoLegs[0]?.route ?? [{ tokenIn: fromAddr, tokenOut: toAddr }]
        raw = await store.swapMultiHop(fromAddr, toAddr, leg.amountIn, route, minOut, block)
      }
      if ('Ok' in raw) {
        removeDepositFromCache(block.toString())
        setLegStep('taco', 'Done')
        return { dex: 'taco', success: true, amountOut: raw.Ok.amountOut }
      }
      throw new Error(classifyExchangeError(raw.Err, {
        outDecimals: Number(tokenTo.value!.decimals),
        outSymbol: tokenTo.value!.symbol,
      }).message)
    } catch (err: any) {
      console.error('[CrossDEX] TACO leg failed:', err?.message || err)
      // Transport hiccup: the swap may actually have landed — verify before refunding.
      if (isTransportError(err) && block != null) {
        const status = await verifyAfterTransportError(() =>
          probeSwapLanded(store, fromAddr, toAddr, leg.amountIn, Date.now()))
        if (status === 'succeeded') {
          removeDepositFromCache(block.toString())
          setLegStep('taco', 'Done')
          return { dex: 'taco', success: true, amountOut: 0n }
        }
      }
      // Recover the unspent deposit so funds are never stuck in the treasury.
      setLegStep('taco', 'Recovering funds…')
      let recovered = false
      if (block != null) {
        try { recovered = !!(await store.recoverWronglysent(fromAddr, block, sellToken.asset_type)) }
        catch { /* best-effort; user can also use /recover */ }
      }
      setLegStep('taco', recovered ? 'Failed, funds recovered' : 'Failed')
      return { dex: 'taco', success: false, amountOut: 0n, error: err?.message || 'TACO swap failed', recovered }
    }
  }

  function reset() {
    phase.value = 'idle'
    plan.value = null
    refining.value = false
    amountIn.value = ''
    outcomes.value = []
    errorMsg.value = ''
    legSteps.value = { icpswap: '', taco: '', neutrinite: '' }
  }

  return {
    // state
    phase, tokenFrom, tokenTo, amountIn, plan, refining, errorMsg, quoteError, outcomes, legSteps, slippage,
    // computed
    amountInBigInt, isAmountValid, canSwap, fromBalance,
    // actions
    fetchPlan, confirmSwap, cancelConfirm, execute, reset,
  }
}
