/**
 * CrossDEX swap flow: splits one swap across ICPSwap + TACO + Neutrinite.
 *
 * The legs run concurrently, except that a split which includes Neutrinite goes
 * Neutrinite first: ICPSwap (after its approve) and TACO wait at a one-way gate
 * until the pylon credits our Neutrinite deposit, that leg fails, or
 * NEU_GATE_MAX_MS passes. Our dex_swap is sent in the tick that opens the gate,
 * and a credit that comes after the gate opened some other way is refused and
 * swept back, so no other venue of ours moves the price before Neutrinite swaps.
 *
 * Safety contract (per product requirement): each leg's failure is contained,
 * and on ANY error a leg recovers its own funds so nothing is ever stranded:
 *   • ICPSwap leg    → `icpswap.sweep` (withdraws stranded pool/subaccount balances)
 *   • TACO leg       → `store.recoverWronglysent` (refunds the unspent deposit)
 *   • Neutrinite leg → `neutrinite.sweep` (withdraws this swap's pylon virtual balance)
 * A failure in one leg never blocks the others or their recovery (Promise.allSettled).
 */

import { ref, computed, watch } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { useExchangeToast } from './useExchangeToast'
import { useExchangeAuth } from './useExchangeAuth'
import { useTokenBalance } from './useTokenBalance'
import { probeSwapLanded } from './useSwapFlow'
import { buildTacoSplitPlan } from '../utils/tacoSplitOptimizer'
import { buildCrossDexPlan, interpolatePairSplit, type CrossDexSwapPlan, type CrossDexLeg, type CrossDexVenue, type TacoGridEntry } from '../utils/crossDexOptimizer'
import { withTimeout } from '../utils/withTimeout'
import { depositToken, removeDepositFromCache, approveExchangeDeposit, calculateRequiredDeposit } from '../utils/deposit'
import { isApprovalDeclined } from '../utils/approvalPrompt'
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
  /** Nothing left the wallet for this route. */
  notStarted?: boolean
}

const GRID_BPS = [1000n, 2000n, 3000n, 4000n, 5000n, 6000n, 7000n, 8000n, 9000n, 10000n]
const MAX_ROUTES_PER_FRACTION = 5n

// Neutrinite-first gate (splits that include Neutrinite).
const NEU_GATE_MAX_MS = 20_000
const NEU_STALE_MS = NEU_GATE_MAX_MS + 5_000 // past this the page was paused: start nothing new
const NEU_SPLIT_MAX_FOLLOW_SEC = 10
const NEU_WAIT_STEP = 'Waiting for Neutrinite to confirm your deposit…'
const NOT_STARTED = 'Not started, your funds stayed in your wallet'
type NeuGate = { open: (why: string) => boolean; isOpen: () => boolean; wait: (dex: CrossDexVenue) => Promise<boolean> }
const isNeuFirst = (legs: CrossDexLeg[]) => legs.length > 1 && legs.some(l => l.dex === 'neutrinite')

export function useCrossDexSwap() {
  const store = useExchangeStore()
  const toast = useExchangeToast()
  const auth = useExchangeAuth()

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

  // Warm the V2 allowance cache for the sell token (only the TACO leg uses it).
  watch(tokenFrom, (t) => { if (t) store.prefetchExchangeAllowance(t.address) }, { immediate: true })

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

  const neuFirst = computed(() => isNeuFirst(plan.value?.legs ?? []))

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
      const followSec = await neutrinite.sellFollowSec(fromAddr)
      const skipNeu = followSec != null && followSec > neutrinite.NEUTRINITE_MAX_SELL_FOLLOW_SEC
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

      // A split holds the other venues until Neutrinite credits, so only a known fast cadence may join one.
      const neuPlanGrid = followSec != null && followSec <= NEU_SPLIT_MAX_FOLLOW_SEC
        ? neuGrid : neuGrid.map((v, i) => (i === neuGrid.length - 1 ? v : 0n))

      // Within-TACO optimum at each 10% fraction (single or internal split).
      const tacoGrid: TacoGridEntry[] = []
      for (let j = 0; j < 10; j++) {
        const targetBp = (j + 1) * 1000
        const res = buildTacoSplitPlan(batchResults, requests, fromAddr, toAddr, targetBp)
        tacoGrid.push({ expectedOut: res.bestOut, legs: res.bestLegs })
      }

      // Show the coarse 10%-grid result immediately…
      const coarse = buildCrossDexPlan(icpGrid, tacoGrid, neuPlanGrid, total, outTransferFee)
      plan.value = coarse
      phase.value = 'ready'
      console.info('[CrossDEX] coarse', {
        kind: coarse.kind,
        legs: coarse.legs.map(l => `${l.dex} ${l.pctBP / 100}%`),
        total: coarse.totalExpectedOut.toString(),
        icpGrid: icpGrid.map(v => v.toString()),
        tacoGrid: tacoGrid.map(t => t.expectedOut.toString()),
        neuGrid: neuPlanGrid.map(v => v.toString()),
        neuFollowSec: followSec,
      })

      // …then refine to a precise (0.1%) split in the background and verify it.
      if (coarse.kind === 'split') {
        void refinePlan(mySeq, total, fromAddr, toAddr, sellTransferFee, icpGrid, tacoGrid, neuPlanGrid, coarse)
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
    seq++ // a refine still in flight must not replace the plan these legs run
    const legs = plan.value.legs
    const fromAddr = tokenFrom.value.address
    const toAddr = tokenTo.value.address
    const sellToken = tokenFrom.value
    const slip = slippage.value / 100

    phase.value = 'executing'
    refining.value = false
    outcomes.value = []
    legSteps.value = { icpswap: '', taco: '', neutrinite: '' }

    // V2 approval is hoisted OUT of the concurrent, timed leg section below:
    // the dialog can block on the user indefinitely, so it must resolve BEFORE
    // any leg moves funds. Otherwise a slow decision races the per-leg 180s
    // timeout (the swap could execute after the UI reported failure) and the
    // other DEX legs would already have debited the wallet while the user is
    // still deciding. The allowance check inside approveExchangeDeposit means
    // this only prompts when an approval is actually needed; the TACO leg
    // below then reuses the standing allowance with no second dialog.
    // The V2 decision for the whole swap, pinned once (store contract: decide
    // once per user action, never re-read mid-flow).
    const v2 = store.useV2Deposit(fromAddr)
    const tacoLeg = legs.find(l => l.dex === 'taco')
    if (tacoLeg && v2) {
      try {
        const grossTotal = calculateRequiredDeposit(tacoLeg.amountIn, store.tradingFeeBps, sellToken.transfer_fee)
        setLegStep('taco', 'Approving…')
        await approveExchangeDeposit(fromAddr, grossTotal, sellToken.transfer_fee)
        setLegStep('taco', '')
      } catch (err: any) {
        // Declined or approval failed before anything moved — abort the whole
        // swap cleanly. No leg has fired yet, so nothing is stranded.
        phase.value = 'ready'
        legSteps.value = { icpswap: '', taco: '', neutrinite: '' }
        if (isApprovalDeclined(err)) {
          toast.info('Approval cancelled', 'Nothing left your wallet.')
        } else {
          errorMsg.value = err?.message || 'Approval failed'
          toast.error('Swap Failed', errorMsg.value)
        }
        return
      }
    }

    // Neutrinite first: a split that includes Neutrinite holds ICPSwap (after its
    // approve) and TACO at a one-way gate until our pylon deposit is credited,
    // the Neutrinite leg fails, or NEU_GATE_MAX_MS passes. Each leg waits inside
    // itself, so the per-leg backstop below still bounds the modal.
    let gate: NeuGate | undefined
    let blockUnload: ((e: BeforeUnloadEvent) => void) | undefined
    if (isNeuFirst(legs)) {
      const t0 = Date.now()
      const fresh = () => Date.now() - t0 < NEU_STALE_MS
      let isOpen = false, release!: () => void
      const opened = new Promise<void>(r => { release = r })
      // Judged by the clock, not only the cap timer: after a page freeze a network
      // callback can run before the overdue timer, and must still count as late.
      const open = (why: string) => {
        if (isOpen) return false
        isOpen = true; clearTimeout(cap); release()
        const late = Date.now() - t0 >= NEU_GATE_MAX_MS
        console.info('[CrossDEX] gate open:', late && why === 'credit' ? 'cap (credit seen late)' : why, Date.now() - t0, 'ms')
        return !late
      }
      const cap = setTimeout(() => open('cap'), NEU_GATE_MAX_MS)
      gate = { open, isOpen: () => isOpen || Date.now() - t0 >= NEU_GATE_MAX_MS,
        wait: async dex => { if (!isOpen) { setLegStep(dex, NEU_WAIT_STEP); await opened } return fresh() } }
      blockUnload = e => { e.preventDefault(); e.returnValue = '' } // per run, never shared
      window.addEventListener('beforeunload', blockUnload)
    }

    // Fire ALL legs concurrently. Promise.allSettled guarantees one leg's
    // failure never aborts another leg or its recovery. Each leg also gets a
    // generous backstop timeout so a hung inner call (dropped connection, stuck
    // poll) can NEVER leave the execution modal spinning forever — on timeout the
    // leg resolves to a failed outcome (its own recovery keeps running in the
    // background; refreshAfterMutation reconciles real balances afterwards).
    const settled = await Promise.allSettled(legs.map(leg =>
      withTimeout(executeLeg(leg, fromAddr, toAddr, sellToken, slip, v2, gate), 180_000, `crossdex-leg-${leg.dex}`)
        .catch((err: any): LegOutcome => ({ dex: leg.dex, success: false, amountOut: 0n,
          error: /timed out after/.test(err?.message ?? '')
            ? 'This route took too long. Check your wallet and the Recover page.' : err?.message || 'Leg failed' })),
    )).finally(() => { if (blockUnload) window.removeEventListener('beforeunload', blockUnload) })

    const results: LegOutcome[] = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : { dex: legs[i].dex, success: false, amountOut: 0n, error: (s as PromiseRejectedResult).reason?.message ?? 'Unknown error' },
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
      toast.warning('Partial Fill', `${successes.length}/${results.length} legs filled. Check each route's status; anything not recovered automatically is on the Recover page.`)
    } else {
      // A dead session fails every leg the same way; reset auth once instead of
      // showing raw signature/expiry text.
      const firstErr = results.map(r => r.error).find(Boolean)
      if (firstErr && await auth.handleSessionError(new Error(firstErr))) {
        phase.value = 'error'
        errorMsg.value = 'Session expired. Please reconnect your wallet.'
        return
      }
      phase.value = 'error'
      errorMsg.value = results.map(r => r.error).filter(Boolean).join('; ') || 'All legs failed'
      toast.error('CrossDEX Swap Failed', errorMsg.value)
    }
  }

  /** Execute a single leg. NEVER throws — always resolves to a LegOutcome, with
   *  funds recovered on failure so nothing is stranded in that exchange.
   *  `v2` is the TACO deposit path decision, pinned ONCE in execute() so a
   *  background gate refresh can never desync it from the hoisted approval.
   *  `gate` is set only for Neutrinite first plans (see execute()). */
  async function executeLeg(
    leg: CrossDexLeg, fromAddr: string, toAddr: string, sellToken: TokenInfo, slip: number, v2: boolean,
    gate?: NeuGate,
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
          beforeDeposit: gate && (async () => {
            if (!(await gate.wait('icpswap'))) throw Object.assign(new Error(NOT_STARTED), { notStarted: true })
          }),
        })
        setLegStep('icpswap', 'Done')
        return { dex: 'icpswap', success: true, amountOut: r.amountOut }
      } catch (err: any) {
        if (err?.notStarted) {
          // Released too late (page paused): only the approve ran, no funds moved, nothing to sweep.
          setLegStep('icpswap', NOT_STARTED)
          return { dex: 'icpswap', success: false, amountOut: 0n, error: NOT_STARTED, notStarted: true }
        }
        console.error('[CrossDEX] ICPSwap leg failed:', err?.message || err)
        setLegStep('icpswap', 'Recovering funds…')
        // Automatic recovery: sweep with retries (a lost-response depositFrom
        // credits the pool a few seconds later, so the first look often races
        // it). Only a sweep that actually moved funds clears the marker;
        // otherwise the Recover page row stays visible.
        let recovered = false
        try {
          recovered = await icpswap.sweepWithRetry({ token0Principal: fromAddr, token1Principal: toAddr })
          if (recovered) icpswap.removePendingSwap(fromAddr, toAddr)
        } catch { /* marker stays so the Recover page can sweep later */ }
        setLegStep('icpswap', recovered ? 'Failed, funds recovered' : 'Failed, recover on the Recover page')
        return { dex: 'icpswap', success: false, amountOut: 0n, error: err?.message || 'ICPSwap swap failed', recovered }
      }
    }

    if (leg.dex === 'neutrinite') {
      const track: NonNullable<neutrinite.NeutriniteSwapParams['track']> = {}
      try {
        const r = await neutrinite.executeSwap({
          sell: fromAddr,
          buy: toAddr,
          amountIn: leg.amountIn,
          minAmountOut: minOut,
          onStep: s => setLegStep('neutrinite', s),
          canDeposit: gate && (() => !gate.isOpen()),
          onCredited: gate && (() => gate.open('credit')),
          track,
        })
        setLegStep('neutrinite', 'Done')
        return { dex: 'neutrinite', success: true, amountOut: r.amountOut }
      } catch (err: any) {
        gate?.open('neutrinite failed')
        console.error('[CrossDEX] Neutrinite leg failed:', err?.message || err)
        const error = err?.message || 'Neutrinite swap failed'
        if (!track.before) {
          // Failed before the deposit, or the transfer was refused: nothing to sweep.
          setLegStep('neutrinite', 'Failed, nothing left your wallet')
          return { dex: 'neutrinite', success: false, amountOut: 0n, error, notStarted: true }
        }
        setLegStep('neutrinite', 'Recovering funds…')
        // Sweep only what this swap added on the pylon, retried because a deposit
        // can credit a few seconds after we gave up. Clear the marker only once
        // that amount came back, and never one an earlier failed swap on this
        // pair left (its funds are still there); otherwise the Recover page keeps it.
        let recovered = false
        for (let i = 0; i < 3 && !recovered; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 5000))
          try { recovered = await neutrinite.sweep(fromAddr, toAddr, track.before) }
          catch (e) { console.error(`[CrossDEX] Neutrinite sweep attempt ${i + 1} failed:`, e) }
        }
        if (recovered && !track.hadMarker) neutrinite.removePendingSwap(fromAddr, toAddr)
        if (recovered && track.swappedOut != null) {
          // The swap filled and the retry delivered its output.
          setLegStep('neutrinite', 'Done')
          return { dex: 'neutrinite', success: true, amountOut: track.swappedOut }
        }
        setLegStep('neutrinite', recovered ? 'Failed, funds recovered' : 'Failed, recover on the Recover page')
        return { dex: 'neutrinite', success: false, amountOut: 0n, error, recovered }
      }
    }

    // ── TACO leg ──
    if (gate && !(await gate.wait('taco'))) {
      setLegStep('taco', NOT_STARTED)
      return { dex: 'taco', success: false, amountOut: 0n, error: NOT_STARTED, notStarted: true }
    }
    let block: bigint | undefined
    let submitted = false
    try {
      const transferFee = sellToken.transfer_fee
      // Gross = exactly what the V1 path transfers.
      const grossTotal = calculateRequiredDeposit(leg.amountIn, store.tradingFeeBps, transferFee)
      if (v2) {
        // The hoisted dialog in execute() already ensured the allowance, and
        // the V2 decision is pinned there and passed in — approving again here
        // was the double-dialog bug, and re-reading the gate mid-flow could
        // desync the deposit path from the approval.
      } else {
        setLegStep('taco', 'Depositing…')
        block = await depositToken(
          fromAddr,
          sellToken.asset_type,
          leg.amountIn,
          store.tradingFeeBps,
          transferFee,
          store.treasuryAccountId,
          store.treasuryPrincipal,
        )
      }
      setLegStep('taco', 'Swapping…')
      const tacoLegs = leg.tacoLegs ?? []
      let raw: any
      submitted = true
      if (tacoLegs.length > 1) {
        if (v2) {
          // V2 legs are GROSS shares summing to grossTotal, proportional to
          // the net legs (floor, remainder to leg 0) — the backend nets the
          // sum once and re-apportions with the same rule.
          const grossLegs = tacoLegs.map(l => (l.amountIn * grossTotal) / leg.amountIn)
          const assigned = grossLegs.reduce((a, b) => a + b, 0n)
          if (grossTotal > assigned) grossLegs[0] += grossTotal - assigned
          const splits = tacoLegs.map((l, i) => ({ amountIn: grossLegs[i], route: l.route, minLegOut: 0n }))
          raw = await store.swapSplitRoutesV2(fromAddr, toAddr, splits, minOut)
        } else {
          const splits = tacoLegs.map(l => ({ amountIn: l.amountIn, route: l.route, minLegOut: 0n }))
          raw = await store.swapSplitRoutes(fromAddr, toAddr, splits, minOut, block!)
        }
      } else {
        const route = tacoLegs[0]?.route ?? [{ tokenIn: fromAddr, tokenOut: toAddr }]
        raw = v2
          ? await store.swapMultiHopV2(fromAddr, toAddr, grossTotal, route, minOut)
          : await store.swapMultiHop(fromAddr, toAddr, leg.amountIn, route, minOut, block!)
      }
      if ('Ok' in raw) {
        if (block != null) removeDepositFromCache(block.toString())
        setLegStep('taco', 'Done')
        return { dex: 'taco', success: true, amountOut: raw.Ok.amountOut }
      }
      if (v2) {
        // V2 typed errors leave nothing stranded in the treasury, so the V1
        // recover-by-block path below does not apply. Settle by class.
        const classified = classifyExchangeError(raw.Err, {
          outDecimals: Number(tokenTo.value!.decimals),
          outSymbol: tokenTo.value!.symbol,
          v2Settled: true,
        })
        let notStarted = false
        if ('SlippageExceeded' in raw.Err) {
          // Settled on chain: the below-minimum output was already delivered.
          void store.refreshAfterMutation('swap')
          setLegStep('taco', 'Failed, output delivered below minimum')
        } else if ('SystemError' in raw.Err) {
          void store.refreshAfterMutation('swap')
          setLegStep('taco', 'Failed, deposit tracked on the Recover page')
        } else {
          // Only errors returned before the pull leave the wallet untouched. After
          // it, RouteFailed, 'Funds not received' and the pull race can move funds.
          const e = raw.Err as any
          const prePull = 'NotAuthorized' in e
            || ('InvalidInput' in e && !String(e.InvalidInput).includes('already claimed by a concurrent'))
            || ('InsufficientFunds' in e && String(e.InsufficientFunds).startsWith('V2 pull declined'))
          if (prePull) {
            setLegStep('taco', 'Failed, no funds moved')
            notStarted = true
          } else {
            void store.refreshAfterMutation('swap')
            setLegStep('taco', 'Failed, check your wallet and the Recover page')
          }
        }
        return { dex: 'taco', success: false, amountOut: 0n, error: classified.message, recovered: false, notStarted }
      }
      throw new Error(classifyExchangeError(raw.Err, {
        outDecimals: Number(tokenTo.value!.decimals),
        outSymbol: tokenTo.value!.symbol,
      }).message)
    } catch (err: any) {
      console.error('[CrossDEX] TACO leg failed:', err?.message || err)
      // Transport hiccup: the swap may actually have landed — verify before refunding.
      if (isTransportError(err) && submitted) {
        const status = await verifyAfterTransportError(() =>
          probeSwapLanded(store, fromAddr, toAddr, leg.amountIn, Date.now()))
        if (status === 'succeeded') {
          if (block != null) removeDepositFromCache(block.toString())
          setLegStep('taco', 'Done')
          return { dex: 'taco', success: true, amountOut: 0n }
        }
      }
      if (v2) {
        // No block to recover. Before submit nothing left the wallet; after an
        // ambiguous submit the user must check history before retrying.
        setLegStep('taco', submitted ? 'Failed, check your history and the Recover page' : 'Failed, no funds moved')
        return { dex: 'taco', success: false, amountOut: 0n, error: err?.message || 'TACO swap failed', recovered: false, notStarted: !submitted }
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
    amountInBigInt, isAmountValid, canSwap, fromBalance, neuFirst,
    // actions
    fetchPlan, confirmSwap, cancelConfirm, execute, reset,
  }
}
