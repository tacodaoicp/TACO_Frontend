/**
 * Sell many: several tokens sold for ICP in one parallel batch.
 *
 * Module scope state (CrossDexView sits under keep-alive max 8 and can be
 * evicted mid sale; a fresh instance must see the same basket and the same
 * running sale). The planner (utils/multiSellPlanner), the quotes
 * (utils/multiSellQuotes) and the runner with its preflight
 * (utils/multiSellRunner) are pure; this file binds the real services, keeps
 * the basket and the quote cache, and turns runner events into reactive state.
 */
import { ref, computed, reactive, watch, effectScope } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { useExchangeToast } from './useExchangeToast'
import { ICP_LEDGER_ID, FEE_HEADROOM_LEDGERS } from '../constants/tokens'
import { crossDexMax } from '../utils/crossDexCosts'
import { formatTokenAmount } from '../utils/format'
import { planMultiSell, refinedPlan, acceptRefined, best10Of, MAX_TOKENS_PER_SALE, type AssetInput, type AssetQuotes, type BatchPlan, type FollowState, type AssetPlan } from '../utils/multiSellPlanner'
import { fetchAssetQuotes, type QuoteDeps } from '../utils/multiSellQuotes'
import { startSale, type RunPhase, type StopReason, type BackReason, type LegRun, type SaleDeps, type SaleResult, type BoundDeps } from '../utils/multiSellRunner'
import { realClock } from '../utils/crossDexLegRunner'
import { interpolatePairSplit, CROSSDEX_GRID_BPS, CROSSDEX_MAX_ROUTES, type CrossDexLeg, type CrossDexVenue } from '../utils/crossDexOptimizer'
import { buildTacoSplitPlan } from '../utils/tacoSplitOptimizer'
import { newRunId } from '../utils/crossDexJournal'
import { runJournal, journalStorage } from '../utils/runJournalStore'
import { dedupLedgers } from '../utils/ledgerDedup'
import { createRunAgent, type RunAgent } from '../utils/runAgent'
import { withFundsLock, BUSY } from '../utils/saleLock'
import { approveExchangeDeposit } from '../utils/deposit'
import { buildLegDeps } from './useCrossDexSwap'
import { stopText, maybeSentLeg, onlyMaybeSent, soldMaybeInWallet, CHECK_WALLET, CHECK_WALLET_NOTE, NOT_IN_WALLET } from '../components/swap/multiSellCopy'
import * as icpswap from '../services/icpswap'
import * as neutrinite from '../services/neutrinite'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export type RowIssue = 'empty' | 'overMax' | 'tooSmall' | 'zeroOut' | 'paused' | 'noRoute' | 'quoteFailed' | 'balanceChanged' | 'tacoBusy'

export interface BasketItem {
  address: string
  amountText: string
  atMax: boolean
  /** Fresh balance minus the Sell many fee reserve (null while unknown). */
  maxSellable: bigint | null
  /** The row is being quoted (skeleton on this row only). */
  quoting: boolean
  quoteFailed: boolean
  balanceChanged: boolean
}

export interface MultiSellRun {
  id: string
  phase: RunPhase
  principal: string
  startedAt: number
  assets: Array<{ address: string; symbol: string; amountIn: bigint; atMax: boolean; legs: LegRun[] }>
  slowLegs: number
  stop?: StopReason
  stopAsset?: string
  approvalSpent?: boolean
  waitMs?: number
  /** When the exchange's call window frees up again (a 'budget' stop counts down to it). */
  waitUntil?: number
  /** Preflight sent its TACO approvals at this time and waits for their answers. */
  approvalSince?: number
  back?: BackReason
  deferredUntil?: number
  deferredCount?: number
  result?: SaleResult
  sessionExpired?: boolean
  /** Every leg promise settled (the lock is free again). */
  settled: boolean
  /** The sheet was closed while the sale still runs: slow legs after the result, or an approval
   *  that takes long in preflight (the page shows a banner with View). */
  dismissed?: boolean
  /** The result was closed once (Done reset the basket); closing it again only hides it. */
  closedOnce?: boolean
}

const QUOTE_FRESH_MS = 30_000
const REQUOTE_QUIET_MS = 600

// ── module scope state ──
const basket = ref<BasketItem[]>([])
const plan = ref<BatchPlan | null>(null)
const planInputs = ref<AssetInput[]>([])
const planFeeBps = ref(0n)
const planQuotes = ref<AssetQuotes[]>([])
const quoting = ref(false)
const refining = ref(false)
const quoteError = ref('')
const run = ref<MultiSellRun | null>(null)
const confirmOpen = ref(false)
const impactAck = ref<{ set: string; maxPct: number } | null>(null)
const backNote = ref('')
/** The wallet the Confirm sheet was opened for: the sale signs for this principal or stops. */
const confirmFor = ref('')
/** openConfirm is reading balances and prices (the Sell button waits). */
const opening = ref(false)
let walletWatch = false
const quoteCache = new Map<string, { quotes: AssetQuotes; follow: FollowState; at: number }>()
let seq = 0
let inTabRun = false
let debounce: ReturnType<typeof setTimeout> | null = null
let confirmTimer: ReturnType<typeof setInterval> | null = null
let unloadGuard: ((e: BeforeUnloadEvent) => void) | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
const nowTick = ref(Date.now())
setInterval(() => { nowTick.value = Date.now() }, 1000)

/** Exact BigInt parse of a decimal string (never parseFloat). */
export function parseAmount(text: string, decimals: number): bigint {
  const t = text.trim()
  if (!/^\d*\.?\d*$/.test(t) || t === '' || t === '.') return 0n
  const [whole, frac = ''] = t.split('.')
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0').slice(0, decimals) || '0')
}
export function formatAmountText(v: bigint, decimals: number): string {
  if (v <= 0n) return ''
  const div = 10n ** BigInt(decimals)
  const frac = (v % div).toString().padStart(decimals, '0').replace(/0+$/, '')
  return frac ? `${v / div}.${frac}` : `${v / div}`
}

/** A small concurrency gate (the ICPSwap and Neutrinite grids run 4 tokens at a time). */
function semaphore(n: number) {
  let active = 0
  const queue: Array<() => void> = []
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= n) await new Promise<void>(r => queue.push(r))
    active++
    try { return await fn() } finally { active--; queue.shift()?.() }
  }
}
const gridSlot = semaphore(4)

export function useMultiSell() {
  const store = useExchangeStore()
  const toast = useExchangeToast()

  const icp = computed<TokenInfo | null>(() => store.getTokenByAddress(ICP_LEDGER_ID) ?? null)
  const slippage = ref<number>((() => {
    try { const s = localStorage.getItem('taco_slippage'); if (s) return JSON.parse(s).value ?? 0.5 } catch { /* ignore */ }
    return 0.5
  })())
  // follow the shared slippage setting (the gear writes the same key)
  watch(slippage, () => schedule())

  const tokenOf = (addr: string) => store.getTokenByAddress(addr) ?? null
  const v2Of = (addr: string) => !FEE_HEADROOM_LEDGERS.has(addr) && store.useV2Deposit(addr)

  /** Forget the basket, its plan and quotes (they were read for one wallet). */
  function clearBasket() {
    seq++
    if (debounce) { clearTimeout(debounce); debounce = null }
    basket.value = []
    plan.value = null
    planInputs.value = []
    planQuotes.value = []
    quoteCache.clear()
    quoting.value = false
    refining.value = false
    quoteError.value = ''
    impactAck.value = null
    backNote.value = ''
  }

  // A wallet change (logout, login, another tab) closes Confirm and clears the basket: its
  // amounts, Max rows and quotes were read for the old wallet. A running sale keeps going on
  // its own pinned agent; its basket goes when its result is closed (done). One watch for the
  // module state, in a detached scope so it outlives the component that created it.
  if (!walletWatch) {
    walletWatch = true
    effectScope(true).run(() => watch(() => store.principalText, (now, before) => {
      if (now === before) return
      confirmOpen.value = false
      confirmFor.value = ''
      if (confirmTimer) { clearInterval(confirmTimer); confirmTimer = null }
      if (run.value && !run.value.settled && ['preparing', 'selling', 'settling'].includes(run.value.phase)) return
      clearBasket()
    }))
  }

  function amountOf(item: BasketItem): bigint {
    const t = tokenOf(item.address)
    return t ? parseAmount(item.amountText, Number(t.decimals)) : 0n
  }

  function rowIssue(item: BasketItem): RowIssue | null {
    if (item.balanceChanged) return 'balanceChanged'
    if (item.maxSellable != null && item.maxSellable <= 0n) return 'tooSmall'
    const amt = amountOf(item)
    if (amt <= 0n) return 'empty'
    if (item.maxSellable != null && amt > item.maxSellable) return 'overMax'
    if (item.quoteFailed) return 'quoteFailed'
    const a = plan.value?.assets.find(x => x.address === item.address)
    if (a?.issue) return a.issue
    return null
  }

  // ── Max ──
  async function computeMax(addr: string): Promise<bigint | null> {
    const t = tokenOf(addr)
    if (!t) return null
    const [bal, live] = await Promise.all([
      store.userBalanceQuery(addr).refetch().catch(() => null),
      store.fetchLedgerFee(addr).catch(() => null),
    ])
    const balance = bal ?? store.userBalanceQuery(addr).data.value
    if (balance == null) return null
    const f = live != null && live > t.transfer_fee ? live : t.transfer_fee
    return crossDexMax(balance, f, store.tradingFeeBps, v2Of(addr), FEE_HEADROOM_LEDGERS.has(addr))
  }

  /** Add tokens (each at Max from a fresh balance read). */
  async function addTokens(addrs: string[]) {
    const fresh = addrs.filter(a => a !== ICP_LEDGER_ID && !basket.value.some(b => b.address === a))
      .slice(0, Math.max(0, MAX_TOKENS_PER_SALE - basket.value.length))
    if (fresh.length === 0) return
    basket.value = [...basket.value, ...fresh.map(a => ({ address: a, amountText: '', atMax: true, maxSellable: null, quoting: true, quoteFailed: false, balanceChanged: false }))]
    const maxes = await Promise.all(fresh.map(computeMax))
    fresh.forEach((a, i) => {
      const item = basket.value.find(b => b.address === a)
      const t = tokenOf(a)
      if (!item || !t) return
      item.maxSellable = maxes[i]
      item.amountText = maxes[i] != null && maxes[i]! > 0n ? formatAmountText(maxes[i]!, Number(t.decimals)) : ''
    })
    schedule(0)
  }

  /** Replace the basket with exactly these tokens (the picker's Done). */
  async function setBasket(addrs: string[]) {
    basket.value = basket.value.filter(b => addrs.includes(b.address))
    await addTokens(addrs.filter(a => !basket.value.some(b => b.address === a)))
    schedule(0)
  }

  function removeToken(addr: string) {
    basket.value = basket.value.filter(b => b.address !== addr)
    schedule(0)
  }

  function setAmount(addr: string, text: string) {
    const item = basket.value.find(b => b.address === addr)
    if (!item) return
    item.amountText = text.replace(',', '.')
    item.atMax = false
    item.balanceChanged = false
    schedule()
  }

  async function setMax(addr: string) {
    const item = basket.value.find(b => b.address === addr)
    const t = tokenOf(addr)
    if (!item || !t) return
    const m = await computeMax(addr)
    item.maxSellable = m
    item.amountText = m != null && m > 0n ? formatAmountText(m, Number(t.decimals)) : ''
    item.atMax = true
    item.balanceChanged = false
    schedule(0)
  }

  /** Max rows read their balance again, so Confirm shows what the sale sells. True when one changed. */
  async function refreshMaxRows(): Promise<boolean> {
    const items = basket.value.filter(b => b.atMax && !b.balanceChanged)
    if (items.length === 0) return false
    const maxes = await Promise.all(items.map(b => computeMax(b.address)))
    let changed = false
    items.forEach((item, k) => {
      const t = tokenOf(item.address)
      const m = maxes[k]
      if (!t || m == null || !item.atMax || !basket.value.includes(item)) return
      item.maxSellable = m
      const text = m > 0n ? formatAmountText(m, Number(t.decimals)) : ''
      if (text !== item.amountText) { item.amountText = text; changed = true }
    })
    return changed
  }

  // ── quotes and plan ──
  function quoteDeps(): QuoteDeps {
    return {
      batchMulti: (reqs, maxRoutes) => store.getExpectedReceiveAmountBatchMulti(reqs, maxRoutes) as Promise<any[]>,
      icpswapQuote: (s, b, a) => icpswap.getQuoteAmount(s, b, a),
      neuQuote: (s, b, a) => neutrinite.quoteWithRoutes(s, b, a),
      followState: (l) => neutrinite.followState(l),
      simulateSplitRoutes: (splits) => store.simulateSplitRoutes(splits) as any,
      gridSlot,
      clock: realClock,
    }
  }

  function schedule(ms = REQUOTE_QUIET_MS) {
    if (debounce) clearTimeout(debounce)
    if (run.value && !run.value.settled && ['preparing', 'selling', 'settling'].includes(run.value.phase)) return
    debounce = setTimeout(() => { void requote() }, ms)
  }

  async function requote(force = false): Promise<void> {
    const target = icp.value
    if (!target) return
    const mySeq = ++seq
    const items = basket.value.filter(b => {
      const iss = rowIssue(b)
      return iss == null || iss === 'quoteFailed' || iss === 'noRoute' || iss === 'zeroOut' || iss === 'tacoBusy'
    }).filter(b => amountOf(b) > 0n)
    // rows left out of this round (fix the amount first) show no skeleton
    for (const b of basket.value) if (!items.includes(b)) b.quoting = false
    if (items.length === 0) { plan.value = null; quoting.value = false; return }
    quoting.value = true
    refining.value = false
    quoteError.value = ''
    const qd = quoteDeps()
    const now = Date.now()
    const fetched = await Promise.all(items.map(async (item) => {
      const t = tokenOf(item.address)!
      const amount = amountOf(item)
      const key = `${item.address}|${amount}`
      const hit = quoteCache.get(key)
      if (hit && !force && now - hit.at < QUOTE_FRESH_MS) return { item, ...hit, failed: false }
      item.quoting = true
      try {
        const r = await fetchAssetQuotes(t, amount, target, qd)
        const entry = { quotes: r.quotes, follow: r.follow, at: Date.now() }
        quoteCache.set(key, entry)
        return { item, ...entry, failed: false }
      } catch (e) {
        console.warn('[Sell many] quote failed for', t.symbol, e)
        return { item, quotes: null, follow: 'unknown' as FollowState, at: 0, failed: true }
      } finally { item.quoting = false }
    }))
    if (mySeq !== seq) return
    for (const f of fetched) f.item.quoteFailed = f.failed
    const ok = fetched.filter(f => !f.failed && f.quotes)
    if (ok.length === 0) {
      plan.value = null
      quoting.value = false
      quoteError.value = 'Could not get prices. Check your connection and try again.'
      return
    }
    const inputs: AssetInput[] = ok.map(f => ({
      token: tokenOf(f.item.address)!,
      amount: amountOf(f.item),
      atMax: f.item.atMax,
      v2: v2Of(f.item.address),
      follow: f.follow,
      tacoPaused: store.isTokenPaused(f.item.address),
    }))
    const quotes = ok.map(f => f.quotes!)
    const principal = store.principalText
    const feeBps = store.tradingFeeBps
    let p: BatchPlan
    try {
      p = await planMultiSell(inputs, quotes, {
        target,
        tradingFeeBps: feeBps,
        slip: slippage.value / 100,
        pausedTokens: new Set(store.pausedTokens),
        callsUsed: principal ? store.callsUsed(principal) : 0,
        callCap: store.otherExchangeTabSeen() ? 7 : 9,
        yieldNow: () => new Promise(r => setTimeout(r, 0)),
        msUntilCallsFree: (n, cap) => store.msUntilCallsFree(n, cap),
        symbolOf: (a) => store.getTokenByAddress(a)?.symbol,
      })
    } catch (e) {
      console.error('[Sell many] planner failed:', e)
      if (mySeq === seq) { plan.value = null; quoting.value = false; quoteError.value = 'Could not get prices. Check your connection and try again.' }
      return
    }
    if (mySeq !== seq) return
    console.info('[Sell many] plan', { decisions: p.decisions, fallback: p.fallbackUsed, budget: p.budget })
    planInputs.value = inputs
    planQuotes.value = quotes
    planFeeBps.value = feeBps
    plan.value = p
    quoting.value = false
    if (p.fallbackUsed) {
      console.warn('[Sell many] the 64 round cap was reached; planned with the venue keeping fallback, requoting once')
      setTimeout(() => { if (mySeq === seq) void requote(true) }, 1000)
    }
    void refineAll(mySeq)
  }

  /** 4.8: refine first wave tokens split over two or more venues (4 at a time, paused while Confirm is open). */
  async function refineAll(mySeq: number) {
    const p = plan.value
    const target = icp.value
    if (!p || !target) return
    const jobs = p.assets.map((a, i) => ({ a, i })).filter(({ a }) => !a.issue && !a.second && a.legs.length >= 2)
    if (jobs.length === 0) return
    refining.value = true
    const qd = quoteDeps()
    const slots = semaphore(4)
    try {
      await Promise.all(jobs.map(({ a, i }) => slots(async () => {
        if (mySeq !== seq || confirmOpen.value) return
        const refined = await refineOne(a, planInputs.value[i], planQuotes.value[i], target, qd)
        if (!refined || mySeq !== seq || confirmOpen.value) return
        const cur = plan.value!.assets[i]
        if (cur.address !== a.address) return
        if (acceptRefined(cur, refined, planInputs.value[i].token.minimum_amount)) {
          const assets = [...plan.value!.assets]
          assets[i] = refined
          plan.value = { ...plan.value!, assets, ...totalsOf(assets) }
        }
      })))
    } finally { if (mySeq === seq) refining.value = false }
  }

  async function refineOne(a: AssetPlan, input: AssetInput, q: AssetQuotes, target: TokenInfo, qd: QuoteDeps): Promise<AssetPlan | null> {
    const gridOf = (dex: CrossDexVenue): bigint[] => dex === 'icpswap' ? q.icpGrid : dex === 'neutrinite' ? q.neuGrid
      : CROSSDEX_GRID_BPS.map((_, k) => a.legs.find(l => l.dex === 'taco') ? (k === Math.round(a.legs.find(l => l.dex === 'taco')!.pctBP / 1000) - 1 ? a.legs.find(l => l.dex === 'taco')!.expectedOut : 0n) : 0n)
    const sorted = [...a.legs].sort((x, y) => y.pctBP - x.pctBP)
    const A = sorted[0], B = sorted[1]
    const sumBp = A.pctBP + B.pctBP
    const ga = A.dex === 'taco' ? tacoGrid(a, q, target, input) : gridOf(A.dex)
    const gb = B.dex === 'taco' ? tacoGrid(a, q, target, input) : gridOf(B.dex)
    const aBp = interpolatePairSplit(ga, gb, sumBp)
    if (aBp == null) return null
    const bp = new Map<CrossDexVenue, number>(a.legs.map(l => [l.dex, l.pctBP]))
    bp.set(A.dex, aBp); bp.set(B.dex, sumBp - aBp)
    const total = input.amount
    let rem = total
    const order = a.legs.map(l => l.dex)
    const amounts = new Map<CrossDexVenue, bigint>()
    order.forEach((d, k) => { const v = k === order.length - 1 ? rem : (total * BigInt(bp.get(d)!)) / 10000n; rem -= v; amounts.set(d, v) })
    const tok = input.token
    const footprintPairs = new Set(a.footprint.filter(r => r !== 'neutrinite').map(r => r.slice(5)))
    const legs: CrossDexLeg[] = []
    for (const d of order) {
      const amt = amounts.get(d)!
      if (d === 'icpswap') {
        const out = await icpswap.getQuoteAmount(tok.address, target.address, amt > tok.transfer_fee ? amt - tok.transfer_fee : 0n)
        legs.push({ dex: d, pctBP: bp.get(d)!, amountIn: amt, expectedOut: out })
      } else if (d === 'neutrinite') {
        const r = await neutrinite.quoteWithRoutes(tok.address, target.address, amt)
        legs.push({ dex: d, pctBP: bp.get(d)!, amountIn: amt, expectedOut: r.out })
      } else {
        // the exchange refuses a TACO part at or below the token minimum, after the deposit
        if (amt <= tok.minimum_amount) return null
        const reqs = CROSSDEX_GRID_BPS.map(b => ({ bp: b, amt: (amt * b) / 10000n })).filter(r => r.amt > 0n)
        const batch = (await qd.batchMulti(reqs.map(r => ({ tokenSell: tok.address, tokenBuy: target.address, amountSell: r.amt })), CROSSDEX_MAX_ROUTES)) ?? []
        // only routes inside this token's coarse footprint
        const filtered = batch.map((b: any) => ({ routes: (b?.routes ?? []).filter((r: any) => {
          const hops = (r.hopDetails ?? []).length ? r.hopDetails.map((h: any) => [h.tokenIn, h.tokenOut]) : [[tok.address, target.address]]
          return hops.every(([x, y]: string[]) => footprintPairs.has(x < y ? `${x}|${y}` : `${y}|${x}`))
        }) }))
        const res = buildTacoSplitPlan(filtered, reqs, tok.address, target.address, 10000, { maxLegs: 3 })
        if (res.bestLegs.length === 0) return null
        legs.push({ dex: d, pctBP: bp.get(d)!, amountIn: amt, expectedOut: res.bestOut, tacoLegs: res.bestLegs })
      }
    }
    if (legs.some(l => l.expectedOut <= 0n)) return null
    const opts = { target, tradingFeeBps: store.tradingFeeBps, slip: slippage.value / 100, pausedTokens: new Set<string>(), callsUsed: 0, callCap: 9 }
    return refinedPlan(input, q, opts, a, legs.map(l => l.dex === 'taco' ? { ...l, tacoLegs: normalizeTaco(l) } : l), best10Of(q))
  }
  function normalizeTaco(l: CrossDexLeg) {
    const sum = (l.tacoLegs ?? []).reduce((s, t) => s + t.amountIn, 0n)
    const diff = l.amountIn - sum
    if (!l.tacoLegs?.length || diff === 0n) return l.tacoLegs
    let k = 0
    l.tacoLegs.forEach((t, j) => { if (t.amountIn > l.tacoLegs![k].amountIn) k = j })
    return l.tacoLegs.map((t, j) => (j === k ? { ...t, amountIn: t.amountIn + diff } : t))
  }
  function tacoGrid(a: AssetPlan, q: AssetQuotes, target: TokenInfo, input: AssetInput): bigint[] {
    // the within TACO optimum per 10% point, routes limited to this token's footprint; points at or
    // below the token minimum are 0 (as in the coarse planner), so the split never moves TACO there
    const pairs = new Set(a.footprint.filter(r => r !== 'neutrinite').map(r => r.slice(5)))
    const filtered = q.batch.map((b: any) => ({ routes: (b?.routes ?? []).filter((r: any) => {
      const hops = (r.hopDetails ?? []).length ? r.hopDetails.map((h: any) => [h.tokenIn, h.tokenOut]) : [[q.address, target.address]]
      return hops.every(([x, y]: string[]) => pairs.has(x < y ? `${x}|${y}` : `${y}|${x}`))
    }) }))
    return CROSSDEX_GRID_BPS.map((_, k) => ((q.total * BigInt(k + 1)) / 10n <= input.token.minimum_amount ? 0n
      : buildTacoSplitPlan(filtered, q.requests, q.address, target.address, (k + 1) * 1000, { maxLegs: 3 }).bestOut))
  }

  function totalsOf(assets: AssetPlan[]) {
    const valid = assets.filter(a => !a.issue)
    const fees = (a: AssetPlan) => BigInt(a.legs.filter(l => l.dex !== 'taco').length) * 10_000n
    const expected = valid.reduce((s, a) => s + a.expectedOut, 0n)
    const noImpact = valid.reduce((s, a) => s + (a.noImpactOut ?? 0n), 0n)
    const share: Record<CrossDexVenue, bigint> = { icpswap: 0n, taco: 0n, neutrinite: 0n }
    for (const a of valid) for (const l of a.legs) share[l.dex] += l.expectedOut
    const venueShareBp: Record<CrossDexVenue, number> = { icpswap: 0, taco: 0, neutrinite: 0 }
    if (expected > 0n) for (const k of Object.keys(share) as CrossDexVenue[]) venueShareBp[k] = Number(share[k] * 10000n / expected)
    return {
      totalReceiveOut: valid.reduce((s, a) => s + a.receiveOut, 0n),
      totalMinReceive: valid.reduce((s, a) => s + (a.minOut > fees(a) ? a.minOut - fees(a) : 0n), 0n),
      impactPct: noImpact > 0n ? Math.max(0, (1 - Number(expected) / Number(noImpact)) * 100) : null,
      venueShareBp,
      routeCount: valid.reduce((s, a) => s + a.legs.length, 0),
    }
  }

  // ── derived card state ──
  const rows = computed(() => basket.value.map(item => {
    const t = tokenOf(item.address)
    const a = plan.value?.assets.find(x => x.address === item.address) ?? null
    return { item, token: t, plan: a, issue: rowIssue(item), amount: amountOf(item) }
  }))
  const ready = computed(() => !!plan.value && !quoting.value && rows.value.length > 0 && rows.value.every(r => r.issue == null) && !quoteError.value)
  const quoteAgeMs = computed(() => { void nowTick.value; return plan.value ? Date.now() - plan.value.quotedAt : Infinity })
  /** Tokens above 25% price impact: the sale needs a tick (kept unless the set changes or one rises by more than 1 point). */
  const extreme = computed(() => (plan.value?.assets ?? []).filter(a => !a.issue && a.noImpactOut && a.noImpactOut > 0n)
    .map(a => ({ a, pct: Math.max(0, (1 - Number(a.expectedOut) / Number(a.noImpactOut)) * 100) })).filter(x => x.pct > 25))
  const extremeKey = computed(() => extreme.value.map(x => x.a.address).sort().join(','))
  watch(extremeKey, (k) => { if (impactAck.value && impactAck.value.set !== k) impactAck.value = null })
  watch(extreme, (ex) => {
    const ack = impactAck.value
    if (!ack) return
    const max = Math.max(0, ...ex.map(x => x.pct))
    if (max > ack.maxPct + 1) impactAck.value = null
  })
  const impactAcknowledged = computed(() => extreme.value.length === 0 || (impactAck.value?.set === extremeKey.value))
  function acknowledgeImpact(v: boolean) {
    impactAck.value = v ? { set: extremeKey.value, maxPct: Math.max(0, ...extreme.value.map(x => x.pct)) } : null
  }
  const waitSec = computed(() => {
    void nowTick.value
    const p = plan.value
    if (!p || (!p.budget.ask && !p.assets.some(a => a.issue === 'tacoBusy'))) return 0
    const ms = store.msUntilCallsFree(p.budget.wanted || 1, store.otherExchangeTabSeen() ? 7 : 9)
    return Math.max(0, Math.ceil(ms / 1000))
  })
  // when the budget wait ends, quote again by itself
  watch(waitSec, (s, prev) => { if (prev > 0 && s === 0) schedule(0) })
  const sellAnyway = ref(false)

  const isRunning = computed(() => !!run.value && !run.value.settled)
  const isBusy = computed(() => !!run.value && ['preparing', 'selling', 'settling'].includes(run.value.phase))

  // ── confirm ──
  async function openConfirm() {
    if (!plan.value || opening.value) return
    const who = store.principalText
    if (!who) return
    opening.value = true
    backNote.value = ''
    try {
      // Max rows sell the balance as it is now: read it again, and quote again if it moved
      const changed = await refreshMaxRows()
      if (store.principalText !== who) return
      const stale = quoteAgeMs.value > QUOTE_FRESH_MS
      if (changed || stale) await requote(stale)
      if (!ready.value || store.principalText !== who) return
    } finally { opening.value = false }
    run.value = null
    // the run modal, its result parts and the Recover page load now, so a deploy mid sale cannot block them
    void import('../views/RecoverView.vue').catch(() => { /* preload only */ })
    showConfirm(who)
  }
  /** Open the Confirm sheet for `who` (prices refresh every 30 s while it is open). */
  function showConfirm(who: string) {
    confirmFor.value = who
    confirmOpen.value = true
    if (confirmTimer) clearInterval(confirmTimer)
    confirmTimer = setInterval(() => { if (confirmOpen.value) void requote(true) }, QUOTE_FRESH_MS)
  }
  function cancelConfirm() {
    confirmOpen.value = false
    confirmFor.value = ''
    if (confirmTimer) { clearInterval(confirmTimer); confirmTimer = null }
  }

  // ── sale ──
  function saleDeps(): SaleDeps {
    return {
      clock: realClock,
      lock: {
        run: async (mode, fn) => {
          const r = await withFundsLock(mode, fn)
          return r === BUSY ? { busy: true } : { busy: false, value: r as any }
        },
      },
      storageProbe: () => {
        try {
          const k = 'taco_crossdex_probe', v = String(Math.random())
          journalStorage.setItem(k, v)
          const ok = journalStorage.getItem(k) === v
          journalStorage.removeItem(k)
          return ok
        } catch { return false }
      },
      createRunAgent: (o) => createRunAgent(o),
      currentPrincipal: () => store.principalText,
      balance: async (t) => {
        // a read that starts now (never one already in flight)
        const v = await store.userBalanceQuery(t).refetch()
        if (v == null) throw new Error('balance unreadable')
        return v
      },
      liveFee: (t) => store.fetchLedgerFee(t, 0),
      assertCanTrade: () => store.assertCanTrade(),
      tradingFeeBps: () => store.tradingFeeBps,
      dedupLedgers: () => dedupLedgers(),
      useV2Deposit: (t) => v2Of(t),
      quotes: quoteDeps(),
      callsUsed: (p) => store.callsUsed(p),
      msUntilCallsFree: (p, n, cap) => store.msUntilCallsFree(n, cap, p),
      callCap: () => (store.otherExchangeTabSeen() ? 7 : 9),
      journal: runJournal,
      bind: (r) => {
        const ra = r as RunAgent
        const legDeps = buildLegDeps(store, ra)
        const pin = { agent: ra.agent, principal: ra.principalText }
        const bound: BoundDeps = {
          ...legDeps,
          taco: {
            ...legDeps.taco,
            recoverBatch: (items) => store.recoverBatch(items, pin) as any,
            assertCanTrade: () => store.assertCanTrade(),
          },
          approve: (token, gross, fee) => approveExchangeDeposit(token, gross, fee, { agent: ra.agent, owner: ra.principal }),
        }
        return bound
      },
    }
  }

  function refreshSoon() {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => { void store.refreshAfterMutation('swap') }, 3000)
  }

  async function confirm() {
    const p = plan.value, target = icp.value
    if (!p || !target || inTabRun || isRunning.value) return
    // the sale signs for the wallet that was reviewed; a different one now never sells
    const who = confirmFor.value
    if (!who || store.principalText !== who) { cancelConfirm(); schedule(0); return }
    inTabRun = true
    confirmOpen.value = false
    confirmFor.value = ''
    if (confirmTimer) { clearInterval(confirmTimer); confirmTimer = null }
    seq++ // stop refines and stale quote results
    refining.value = false
    const id = newRunId('many', Date.now())
    const r = reactive<MultiSellRun>({
      id, phase: 'preparing', principal: who, startedAt: Date.now(), slowLegs: 0, settled: false,
      assets: p.assets.filter(a => !a.issue).map(a => ({
        address: a.address, symbol: a.symbol, amountIn: a.amountIn,
        atMax: !!planInputs.value.find(i => i.token.address === a.address)?.atMax,
        legs: a.legs.map((l, li) => ({ venue: l.dex, amountIn: l.amountIn, expectedOut: l.expectedOut, minOut: a.legMinOut[li], state: 'waiting' as const, step: '' })),
      })),
    }) as MultiSellRun
    run.value = r
    const hooks = {
      onLeg: (ai: number, li: number, patch: Partial<LegRun>) => {
        const leg = r.assets[ai]?.legs[li]
        if (leg) Object.assign(leg, patch)
      },
      onPhase: (ph: RunPhase, info?: any) => {
        r.phase = ph
        if (ph !== 'preparing') r.approvalSince = undefined
        if (info?.stop) {
          r.stop = info.stop; r.stopAsset = info.stopAsset; r.approvalSpent = info.approvalSpent; r.waitMs = info.waitMs
          r.waitUntil = info.waitMs != null ? Date.now() + info.waitMs : undefined
        }
        if (info?.back) r.back = info.back
        if (info?.deferredUntil) { r.deferredUntil = info.deferredUntil; r.deferredCount = info.deferredCount }
        if (ph === 'selling') {
          unloadGuard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
          window.addEventListener('beforeunload', unloadGuard)
        }
      },
      onAssetSettled: () => refreshSoon(),
      // the sheet says when an approval takes long, and can then be closed (the sale goes on)
      onApprovals: () => { r.approvalSince = Date.now() },
      log: (...a: unknown[]) => console.info(...a),
    }
    const inputs = p.assets.map((a) => planInputs.value.find(i => i.token.address === a.address)!)
    const h = startSale({
      runId: id, target, slip: slippage.value / 100, confirmPrincipal: who,
      inputs, plan: p, planFeeBps: planFeeBps.value,
    }, saleDeps(), hooks)
    const prepared = await h.prepared
    if (!prepared.ok) {
      inTabRun = false
      r.settled = true
      if ('back' in prepared) {
        // prices moved or the fee changed: fresh numbers, back to Confirm
        backNote.value = prepared.back === 'feeChanged'
          ? 'The trading fee on the TACO exchange changed. Check the new amounts and try again.'
          : 'Prices moved while you confirmed. Check the new amounts and try again.'
        run.value = null
        await requote(true)
        if (ready.value && store.principalText === who) showConfirm(who)
        return
      }
      if (prepared.stop === 'balanceChanged' && prepared.stopAsset) {
        const item = basket.value.find(b => b.address === prepared.stopAsset)
        if (item) { item.balanceChanged = true; item.maxSellable = await computeMax(item.address) }
      }
      if (prepared.stop === 'ledgerFee') void store.refreshTokens?.()
      // the sheet was closed while an approval took long: say how it ended (the banner keeps View)
      if (r.dismissed) {
        const sym = r.assets.find(a => a.address === r.stopAsset)?.symbol ?? ''
        const why = stopText(prepared.stop, sym, Math.ceil((prepared.waitMs ?? 0) / 1000))
        toast.info('Your last sale did not start', `${why} Your tokens are still in your wallet.${r.approvalSpent ? ' Only the approval fee was spent.' : ''}`)
      }
      return
    }
    const result = await h.ui
    if (result) {
      r.result = result
      r.slowLegs = result.slowLegs
      r.sessionExpired = result.sessionExpired
      void store.refreshAfterMutation('swap')
      setTimeout(() => { void store.refreshAfterMutation('swap') }, 6000)
      // a sheet closed before the result: one notice when every route has settled (below)
      if (!r.dismissed) announce(result)
    }
    void h.all.then((fin) => {
      if (fin) {
        r.result = fin; r.slowLegs = 0; r.sessionExpired = fin.sessionExpired
        // slow legs that settled after the result may change it
        if (['complete', 'partial', 'failed'].includes(r.phase)) r.phase = fin.phase
      }
      r.settled = true
      inTabRun = false
      if (unloadGuard) { window.removeEventListener('beforeunload', unloadGuard); unloadGuard = null }
      void store.refreshAfterMutation('swap')
      // closed while a route was still finishing: say how it ended; the banner keeps the result one tap away
      if (r.dismissed && fin) announceLate(fin)
    })
  }

  /** What a complete sale received, as a toast sentence: the known total, plus the parts whose
   *  amount only the wallet shows. */
  function receivedText(res: SaleResult, inTotal = ''): string {
    const t = icp.value
    const got = t ? formatTokenAmount(res.received, Number(t.decimals), t.symbol) : res.received.toString()
    const k = res.unknownParts
    if (k === 0) return `${got} received${inTotal}.`
    // no part has a known amount (the title already says the sale is complete)
    if (res.received <= 0n) return 'The ICP shows in your wallet.'
    return `${got} received${inTotal}, plus ${k === 1 ? '1 part' : `${k} parts`} whose amount shows in your wallet.`
  }

  function announceLate(res: SaleResult) {
    const legs = res.assets.flatMap(a => a.legs)
    const anyRecover = legs.some(l => ['needsRecovery', 'tracked'].includes(l.state))
    const anyRefund = legs.some(l => l.state === 'refunded')
    // every part that needs the Recover page may already be in the wallet: the wallet comes first
    if (anyRecover && onlyMaybeSent(legs)) toast.warning('Your last sale has finished', `${CHECK_WALLET_NOTE} The result is on the CrossDEX page.`)
    else if (anyRecover) toast.error('Your last sale has finished', 'Some funds need the Recover page. The result is on the CrossDEX page.')
    else if (res.phase === 'complete') toast.success('Your last sale has finished', icp.value ? receivedText(res, ' in total') : undefined)
    else toast.info('Your last sale has finished', anyRefund ? 'Some parts were refunded. The result is on the CrossDEX page.' : 'The result is on the CrossDEX page.')
  }

  function announce(res: SaleResult) {
    const legs = res.assets.flatMap(a => a.legs)
    const tokensFully = res.assets.filter(a => a.legs.every(l => ['done', 'doneUnknown', 'belowMin'].includes(l.state))).length
    const anyRecover = legs.some(l => ['needsRecovery', 'tracked'].includes(l.state))
    const anyRefund = legs.some(l => l.state === 'refunded')
    if (res.phase === 'complete') toast.success('Sale complete', receivedText(res))
    else if (res.phase === 'partial') toast.warning('Partly done', `${tokensFully} of ${res.assets.length} tokens fully sold. Details are in the summary.`)
    // nothing confirmed sold, but a part sold while its ICP may already be in the wallet (the message
    // does not repeat the title)
    else if (legs.some(maybeSentLeg)) {
      const lead = soldMaybeInWallet(legs.filter(maybeSentLeg).length, 'ICP', { noun: 'part' })
      toast.warning(CHECK_WALLET, `${lead} ${onlyMaybeSent(legs) ? NOT_IN_WALLET : 'Some funds need the Recover page.'}`)
    }
    else if (anyRecover) toast.error('Sale failed', 'Some funds need the Recover page.')
    else toast.info('Nothing was sold', anyRefund ? 'Refunds are on their way to your wallet, minus network fees.' : 'Your tokens stayed in your wallet.')
  }

  /** Close the result: keep tokens that still have a sellable balance (fresh read, Max), clear the quotes. */
  async function done() {
    const r = run.value
    if (r && !r.settled && ['preparing', 'selling', 'settling'].includes(r.phase)) return
    if (r?.closedOnce) {
      // a result opened again from the banner: closing it changes nothing else
      if (r.settled) run.value = null
      else r.dismissed = true
      return
    }
    const stopped = r?.phase === 'stopped'
    if (r) r.closedOnce = true
    // slow legs keep running (and keep the lock): the card shows a banner until they settle
    if (r && !r.settled) r.dismissed = true
    else run.value = null
    quoteCache.clear()
    plan.value = null
    // the sale was for another wallet than the one connected now: its basket goes too
    if (r && r.principal !== store.principalText) { clearBasket(); return }
    if (stopped) { schedule(0); return }
    const keep: BasketItem[] = []
    for (const item of basket.value) {
      const m = await computeMax(item.address)
      const t = tokenOf(item.address)
      if (m != null && m > 0n && t) keep.push({ ...item, maxSellable: m, amountText: formatAmountText(m, Number(t.decimals)), atMax: true, quoteFailed: false, balanceChanged: false })
    }
    basket.value = keep
    schedule(0)
  }

  function clearRun() { if (run.value?.settled) run.value = null }
  /** Show a closed result again (the banner's View). */
  function reopenRun() { if (run.value) run.value.dismissed = false }
  /** Close the sheet of a sale whose approval takes long. Nothing is cancelled: the approval
   *  may still land, and the sale goes on (or stops) by itself; the banner brings the sheet back. */
  function hideRun() {
    const r = run.value
    if (r && !r.settled && r.phase === 'preparing' && r.approvalSince != null) r.dismissed = true
  }
  /** Routes of a closed result that are still finishing. */
  const finishingRoutes = computed(() => {
    const r = run.value
    if (!r || r.settled) return 0
    return r.assets.reduce((n, a) => n + a.legs.filter(l => !['done', 'doneUnknown', 'belowMin', 'refunded', 'notSent', 'needsRecovery', 'tracked'].includes(l.state)).length, 0)
  })

  return {
    // state
    basket, plan, quoting, refining, quoteError, run, confirmOpen, confirmFor, opening, slippage, backNote, sellAnyway,
    rows, ready, quoteAgeMs, extreme, impactAcknowledged, waitSec, isRunning, isBusy, icp, finishingRoutes,
    // actions
    addTokens, setBasket, removeToken, setAmount, setMax, requote, openConfirm, cancelConfirm, confirm, done, clearRun, reopenRun, hideRun,
    acknowledgeImpact, schedule,
  }
}
