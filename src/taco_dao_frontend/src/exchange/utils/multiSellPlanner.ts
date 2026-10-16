/**
 * Sell many planner: several tokens sold for one target (ICP) in one parallel
 * batch, each split across ICPSwap, TACO and Neutrinite like a single CrossDEX
 * swap, planned JOINTLY so that tokens whose TACO routes share a pool do not
 * spoil each other's price.
 *
 * 1. Each token is planned with today's optimizer on its own cached quotes.
 * 2. Pool ownership: any TACO pool that two tokens' routes would both use, and
 *    Neutrinite as a whole (one token per sale), goes to the token that loses
 *    most without it; every other token is planned again from the same cached
 *    quotes with that pool filtered out (sticky: the exclusions only grow, so
 *    the loop ends). Owners' quotes stay exact.
 * 3. TACO call budget: at most `allowed` tokens get a TACO leg (the exchange
 *    limits update calls per wallet); the tokens that gain least from TACO
 *    skip it.
 * 4. Second in line: a token that ownership moved and that lost more than 0.1%
 *    may keep the shared pools and sell its TACO part right after the owners'
 *    TACO parts settled, planned on the owners' flow applied to the quoted pool
 *    curves; adopted when it nets at least 0.05% more. At run time its planned
 *    splits are requoted exactly before they go.
 *
 * Every other leg of every token fires at once. Deterministic: no wall clock,
 * a 64 round cap with a venue keeping fallback. Costs (4.3 of the plan): each
 * venue's sell side fees and the TACO trading fee count in the objective.
 *
 * Pure module (no store, services, Vue or @dfinity value imports).
 */

import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import { buildCrossDexPlan, type CrossDexLeg, type CrossDexVenue, type TacoGridEntry } from './crossDexOptimizer'
import { buildTacoSplitPlan } from './tacoSplitOptimizer'
import { buildHopCurves, tacoInflows, repriceAfter, routeHops, directedHop, type DirectedHop, type HopCurve } from './poolCurves'
import { tradingFeeOf } from './crossDexCosts'

export type Resource = `taco:${string}` | 'neutrinite'
export type FollowState = 'fast' | 'slow' | 'tooSlow' | 'none' | 'unknown'

export const ICP_WITHDRAW_FEE = 10_000n
export const MAX_TOKENS_PER_SALE = 10
export const MAX_TACO_TOKENS = 8
const ROUND_CAP = 64
const ZERO_OUT = 100_000n
const SECOND_MIN_LOSS_BP = 10n   // 0.1 %
const SECOND_MIN_GAIN_BP = 5n    // 0.05 %
/** Places in line behind the first wave on one pool (second in line is place 1). */
export const MAX_QUEUE_DEPTH = 5
const NOTE_MIN_BP = 30n          // 0.3 %
const NOTE_MIN_ICP = 1_000_000n  // 0.01 ICP
const ASK_MIN_BP = 50n           // 0.5 %
const ASK_MIN_ICP = 1_000_000n   // 0.01 ICP

export interface AssetInput {
  token: TokenInfo
  amount: bigint
  atMax: boolean
  /** store.useV2Deposit(token); always false for sGLDT and EXE. */
  v2: boolean
  follow: FollowState
  tacoPaused: boolean
}

export interface AssetQuotes {
  address: string
  total: bigint
  quotedAt: number
  requests: Array<{ bp: bigint; amt: bigint }>
  /** getExpectedReceiveAmountBatchMulti result aligned with requests. */
  batch: any[]
  /** ICPSwap quotes on raw − fee, per 10% point. */
  icpGrid: bigint[]
  /** Neutrinite quotes per 10% point (zeros where not eligible). */
  neuGrid: bigint[]
  /** Ledgers on the Neutrinite routes per 10% point; null when unknown. */
  neuRouteTokens: Array<string[] | null>
}

export interface PlanOptions {
  target: TokenInfo
  tradingFeeBps: bigint
  /** Slippage as a fraction (0.005). */
  slip: number
  pausedTokens: Set<string>
  callsUsed: number
  /** 9, or 7 with another exchange tab seen in the last 90 s. */
  callCap: number
  yieldNow?: () => Promise<void>
  /** Force the venue keeping fallback from the first round (tests). */
  forceFallback?: boolean
  /** Count the planner costs (default true; P1 compares with costs off). */
  costs?: boolean
  /** ms until n more exchange calls fit under the cap (for the wait decision). */
  msUntilCallsFree?: (n: number, cap: number) => number
  /** Symbols of hub tokens outside the basket (row sentences). */
  symbolOf?: (address: string) => string | undefined
}

export interface AssetPlan {
  address: string
  symbol: string
  amountIn: bigint
  legs: CrossDexLeg[]
  /** Gross, sum of leg quotes (minimums apply to these). */
  expectedOut: bigint
  /** Sum of leg minimums. */
  minOut: bigint
  /** expectedOut minus the ICP withdraw fee of each ICPSwap and Neutrinite leg (displayed). */
  receiveOut: bigint
  costIcp: bigint
  netOut: bigint
  aloneNetOut: bigint
  aloneReceiveOut: bigint
  footprint: Resource[]
  neutrinite: boolean
  /** Queued TACO part: it starts after every token in waitsFor is final. place 1 is second in
   *  line, 2 third in line (waits for a second in line token too), and so on. */
  second?: { waitsFor: string[]; place?: number }
  tacoSkippedForBudget: boolean
  tacoSkipLoss: bigint
  issue?: 'noRoute' | 'zeroOut' | 'tacoBusy'
  /** 10 × the best venue's 10% quote (no impact output), null when unknown. */
  noImpactOut: bigint | null
  /** Per leg minimum (aligned with legs). */
  legMinOut: bigint[]
  /** The alone plan's venues and hubs, for the row sentences. */
  alone: { venues: CrossDexVenue[]; hubs: string[]; tacoBp: number; icpBp: number; neuBp: number }
}

export interface PoolNote { tokens: string[]; causes: string[]; viaNeutrinite: boolean; lessIcp: bigint }

export interface BatchPlan {
  assets: AssetPlan[]
  totalReceiveOut: bigint
  totalMinReceive: bigint
  impactPct: number | null
  venueShareBp: Record<CrossDexVenue, number>
  note: PoolNote | null
  /** One sentence per changed token (expanded rows), keyed by address. */
  moves: Array<{ asset: string; text: string }>
  routeCount: number
  tacoAssetCount: number
  gate: { token: string; legs: Array<{ asset: string; dex: CrossDexVenue }> } | null
  budget: { allowed: number; skipped: string[]; waitMs: number; gainIfWait: bigint; ask: boolean; wanted: number }
  decisions: string[]
  fallbackUsed: boolean
  quotedAt: number
}

// ── helpers ──
const NO_EXCLUSIONS: ReadonlySet<Resource> = new Set()
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
const hopPair = (h: DirectedHop): string => { const [a, b] = h.split('>'); return pairKey(a, b) }
const big = (x: bigint, y: bigint) => (x > y ? x : y)

interface PlanCtx {
  inputs: AssetInput[]
  quotes: AssetQuotes[]
  opts: PlanOptions
  target: string
  memo: Map<string, AssetPlan>
  curves: Map<DirectedHop, HopCurve> | null
  best10: bigint[]
  yields: number
}

async function maybeYield(P: PlanCtx) {
  P.yields++
  if (P.opts.yieldNow) await P.opts.yieldNow()
}

/** Price of `x` raw units of token i in target e8s, from its own best 10% quote. */
function priceOf(P: PlanCtx, i: number, x: bigint): bigint {
  const total = P.quotes[i].total
  if (total <= 0n) return 0n
  return (x * P.best10[i] * 10n) / total
}

/** Planner cost of using `dex` for `amount` of token i (target e8s): sell side fees, the
 *  TACO trading fee, and one ICP withdraw fee for ICPSwap and Neutrinite (4.3). */
function costOf(P: Pick<PlanCtx, 'inputs' | 'quotes' | 'opts' | 'best10'>, i: number, dex: CrossDexVenue, amount: bigint): bigint {
  if (P.opts.costs === false) return 0n
  const inp = P.inputs[i]
  const f = inp.token.transfer_fee
  const price = (x: bigint) => { const t = P.quotes[i].total; return t > 0n ? (x * P.best10[i] * 10n) / t : 0n }
  if (dex === 'icpswap') return price(f) + ICP_WITHDRAW_FEE
  if (dex === 'neutrinite') return price(2n * f) + ICP_WITHDRAW_FEE
  return price((inp.v2 ? 3n : 2n) * f) + price(tradingFeeOf(amount, P.opts.tradingFeeBps))
}

function legCostFn(P: PlanCtx, i: number) {
  const total = P.quotes[i].total
  return (dex: CrossDexVenue, units: number): bigint => costOf(P, i, dex, (total * BigInt(units)) / 10n)
}

/** The quoted routes of a token, filtered (excluded pools, paused hubs) and repriced after prior flows. */
function filteredBatch(P: PlanCtx, i: number, excluded: ReadonlySet<Resource>, prior?: Map<DirectedHop, number>): any[] {
  const q = P.quotes[i]
  const token = q.address
  return q.batch.map((b, k) => {
    const routes = ((b?.routes ?? []) as any[]).filter(r => {
      const hops = routeHops(r, token, P.target)
      for (const h of hops) {
        if (excluded.has(`taco:${hopPair(h)}`)) return false
        const [a, c] = h.split('>')
        if ((a !== token && P.opts.pausedTokens.has(a)) || (c !== P.target && P.opts.pausedTokens.has(c))) return false
      }
      return true
    })
    if (!prior || prior.size === 0) return { routes }
    const amt = q.requests[k]?.amt ?? 0n
    const repriced = routes.map(r => {
      const hops = routeHops(r, token, P.target)
      const out = repriceAfter(BigInt(r.expectedBuyAmount ?? 0n), hops, amt, prior, P.curves!)
      return out === r.expectedBuyAmount ? r : { ...r, expectedBuyAmount: out }
    }).filter(r => (r.expectedBuyAmount ?? 0n) > 0n)
      .sort((x, y) => (y.expectedBuyAmount > x.expectedBuyAmount ? 1 : y.expectedBuyAmount < x.expectedBuyAmount ? -1 : 0))
    return { routes: repriced }
  })
}

function priorKey(prior?: Map<DirectedHop, number>): string {
  if (!prior || prior.size === 0) return ''
  return [...prior].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([h, v]) => `${h}=${Math.round(v)}`).join(',')
}

/** Plan one token (memoized). */
async function planAsset(P: PlanCtx, i: number, excluded: ReadonlySet<Resource>, flags: { taco: boolean; neu: boolean }, prior?: Map<DirectedHop, number>): Promise<AssetPlan> {
  const key = `${i}|${[...excluded].sort().join(',')}|${flags.taco ? 1 : 0}${flags.neu ? 1 : 0}|${priorKey(prior)}`
  const hit = P.memo.get(key)
  if (hit) return hit
  const plan = planAssetNow(P, i, excluded, flags, prior)
  P.memo.set(key, plan)
  await maybeYield(P)
  return plan
}

function planAssetNow(P: PlanCtx, i: number, excluded: ReadonlySet<Resource>, flags: { taco: boolean; neu: boolean }, prior?: Map<DirectedHop, number>): AssetPlan {
  const inp = P.inputs[i], q = P.quotes[i]
  const token = q.address
  const total = q.total
  const min = inp.token.minimum_amount
  // TACO grid: the within TACO optimum at each 10% point, at most 3 split routes.
  const tacoGrid: TacoGridEntry[] = []
  const tacoOn = flags.taco && !inp.tacoPaused
  const batch = tacoOn ? filteredBatch(P, i, excluded, prior) : []
  for (let j = 1; j <= 10; j++) {
    const amt = (total * BigInt(j)) / 10n
    if (!tacoOn || amt <= min) { tacoGrid.push({ expectedOut: 0n, legs: [] }); continue }
    const r = buildTacoSplitPlan(batch, q.requests, token, P.target, j * 1000, { maxLegs: 3 })
    tacoGrid.push(r.bestLegs.length > 0 && r.bestLegs.length <= 3 ? { expectedOut: r.bestOut, legs: r.bestLegs } : { expectedOut: 0n, legs: [] })
  }
  const neuGrid = flags.neu ? q.neuGrid : q.neuGrid.map(() => 0n)
  const plan = buildCrossDexPlan(q.icpGrid, tacoGrid, neuGrid, total, ICP_WITHDRAW_FEE, { legCost: legCostFn(P, i) })
  const legs = plan.totalExpectedOut > 0n ? plan.legs.map(normalizeTacoLeg) : []
  return describePlan(P, i, legs, plan.totalNetOut ?? plan.totalExpectedOut)
}

function describePlan(P: PlanCtx, i: number, legs: CrossDexLeg[], netOut: bigint): AssetPlan {
  const inp = P.inputs[i], q = P.quotes[i]
  const footprint = new Set<Resource>()
  for (const l of legs) {
    if (l.dex === 'neutrinite') footprint.add('neutrinite')
    if (l.dex === 'taco') for (const t of l.tacoLegs ?? []) for (const h of routeHopsOfLeg(t, q.address, P.target)) footprint.add(`taco:${hopPair(h)}`)
  }
  const expectedOut = legs.reduce((a, l) => a + l.expectedOut, 0n)
  const legMinOut = legs.map(l => BigInt(Math.floor(Number(l.expectedOut) * (1 - P.opts.slip))))
  const withdrawFees = BigInt(legs.filter(l => l.dex !== 'taco').length) * ICP_WITHDRAW_FEE
  const receiveOut = expectedOut > withdrawFees ? expectedOut - withdrawFees : 0n
  const costIcp = expectedOut - netOut
  let issue: AssetPlan['issue']
  if (legs.length === 0 || expectedOut <= 0n) issue = 'noRoute'
  else if (netOut < ZERO_OUT) issue = 'zeroOut'
  const best = P.best10[i]
  return {
    address: q.address,
    symbol: inp.token.symbol,
    amountIn: q.total,
    legs,
    expectedOut,
    minOut: legMinOut.reduce((a, b) => a + b, 0n),
    receiveOut,
    costIcp,
    netOut,
    aloneNetOut: netOut,
    aloneReceiveOut: receiveOut,
    footprint: [...footprint].sort(),
    neutrinite: legs.some(l => l.dex === 'neutrinite'),
    tacoSkippedForBudget: false,
    tacoSkipLoss: 0n,
    issue,
    noImpactOut: best > 0n ? best * 10n : null,
    legMinOut,
    alone: { venues: [], hubs: [], tacoBp: 0, icpBp: 0, neuBp: 0 },
  }
}

/** Legs scaled to a new total, pro rata (TACO routes too), remainder on the largest. */
export function scaleAssetLegs(legs: CrossDexLeg[], newTotal: bigint): CrossDexLeg[] {
  const total = legs.reduce((a, l) => a + l.amountIn, 0n)
  if (total <= 0n || newTotal === total) return legs
  const amts = legs.map(l => (l.amountIn * newTotal) / total)
  const assigned = amts.reduce((a, b) => a + b, 0n)
  let k = 0
  legs.forEach((l, j) => { if (l.amountIn > legs[k].amountIn) k = j })
  amts[k] += newTotal - assigned
  return legs.map((l, j) => normalizeTacoLeg({
    ...l,
    amountIn: amts[j],
    tacoLegs: l.tacoLegs?.map(t => ({ ...t, amountIn: (t.amountIn * amts[j]) / (l.amountIn || 1n) })),
  }))
}

/**
 * A refined split (4.8) for one first wave token, as an AssetPlan with its net and
 * footprint. The caller keeps it only when acceptRefined says so.
 */
export function refinedPlan(
  input: AssetInput, quotes: AssetQuotes, opts: PlanOptions, coarse: AssetPlan, legs: CrossDexLeg[], best10: bigint,
): AssetPlan {
  const P = { inputs: [input], quotes: [quotes], opts, best10: [best10] }
  const gross = legs.reduce((a, l) => a + l.expectedOut, 0n)
  const cost = legs.reduce((a, l) => a + costOf(P, 0, l.dex, l.amountIn), 0n)
  const footprint = new Set<Resource>()
  for (const l of legs) {
    if (l.dex === 'neutrinite') footprint.add('neutrinite')
    if (l.dex === 'taco') for (const t of l.tacoLegs ?? []) for (const h of routeHopsOfLeg(t, quotes.address, opts.target.address)) footprint.add(`taco:${hopPair(h)}`)
  }
  const legMinOut = legs.map(l => BigInt(Math.floor(Number(l.expectedOut) * (1 - opts.slip))))
  const fees = BigInt(legs.filter(l => l.dex !== 'taco').length) * ICP_WITHDRAW_FEE
  return {
    ...coarse,
    legs,
    expectedOut: gross,
    netOut: gross - cost,
    costIcp: cost,
    receiveOut: gross > fees ? gross - fees : 0n,
    minOut: legMinOut.reduce((a, b) => a + b, 0n),
    legMinOut,
    footprint: [...footprint].sort(),
    neutrinite: legs.some(l => l.dex === 'neutrinite'),
  }
}

/** 4.8: a refined plan is kept only when it nets more, keeps its TACO leg above the token's
 *  minimum (the exchange refuses a smaller one after the deposit) and uses no resource outside
 *  the coarse footprint. */
export function acceptRefined(coarse: AssetPlan, refined: AssetPlan, tacoMinimum: bigint): boolean {
  if (refined.netOut <= coarse.netOut) return false
  if (refined.legs.some(l => l.expectedOut <= 0n || l.amountIn <= 0n)) return false
  if (refined.legs.some(l => l.dex === 'taco' && l.amountIn <= tacoMinimum)) return false
  const allowed = new Set(coarse.footprint)
  return refined.footprint.every(r => allowed.has(r))
}

/** The token's best 10% quote over the three venues (the price for the planner costs). */
export function best10Of(q: AssetQuotes): bigint {
  let b = q.icpGrid[0] ?? 0n
  const t = (q.batch[0]?.routes ?? []).reduce((m: bigint, r: any) => big(m, BigInt(r?.expectedBuyAmount ?? 0n)), 0n)
  b = big(b, t)
  b = big(b, q.neuGrid[0] ?? 0n)
  return b
}

/** The TACO split amounts are quote points (fractions of the total, floored): put the
 *  rounding remainder on the largest split so they add up to exactly the leg's amount. */
export function normalizeTacoLeg(l: CrossDexLeg): CrossDexLeg {
  if (l.dex !== 'taco' || !l.tacoLegs?.length) return l
  const sum = l.tacoLegs.reduce((a, t) => a + t.amountIn, 0n)
  const diff = l.amountIn - sum
  if (diff === 0n) return l
  let k = 0
  l.tacoLegs.forEach((t, j) => { if (t.amountIn > l.tacoLegs![k].amountIn) k = j })
  return { ...l, tacoLegs: l.tacoLegs.map((t, j) => (j === k ? { ...t, amountIn: t.amountIn + diff } : t)) }
}

/** Directed hops of a planned TACO split leg. */
export function routeHopsOfLeg(t: { route?: Array<{ tokenIn: string; tokenOut: string }>; hopDetails?: any[] }, token: string, target: string): DirectedHop[] {
  if (t.route && t.route.length > 0) return t.route.map(h => directedHop(h.tokenIn, h.tokenOut))
  return routeHops(t, token, target)
}

function tacoTokens(plans: AssetPlan[]): number { return plans.filter(p => p.legs.some(l => l.dex === 'taco')).length }

function tacoFootprint(p: AssetPlan): Resource[] { return p.footprint.filter(r => r !== 'neutrinite') }

function contested(plans: AssetPlan[]): Array<[Resource, number[]]> {
  const users = new Map<Resource, number[]>()
  plans.forEach((p, i) => p.footprint.forEach(r => { const u = users.get(r) ?? []; u.push(i); users.set(r, u) }))
  return [...users].filter(([, u]) => u.length > 1).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
}

const label = (P: PlanCtx, r: Resource) => r === 'neutrinite' ? 'Neutrinite'
  : r.slice(5).split('|').map(a => P.inputs.find(x => x.token.address === a)?.token.symbol ?? (a === P.target ? P.opts.target.symbol : a.slice(0, 5))).join('/')

interface Resolution {
  plans: AssetPlan[]
  excluded: Set<Resource>[]
  flags: Array<{ taco: boolean; neu: boolean }>
  owners: Map<Resource, number>
  decisions: string[]
  fallbackUsed: boolean
  skipped: Map<number, bigint>
}

async function planAll(P: PlanCtx, excluded: Set<Resource>[], flags: Array<{ taco: boolean; neu: boolean }>): Promise<AssetPlan[]> {
  const out: AssetPlan[] = []
  for (let i = 0; i < P.inputs.length; i++) out.push(await planAsset(P, i, excluded[i], flags[i]))
  return out
}

/** 4.5: while more tokens than allowed have a TACO leg, the smallest TACO gain skips TACO. */
async function budgetPass(P: PlanCtx, plans: AssetPlan[], excluded: Set<Resource>[], flags: Array<{ taco: boolean; neu: boolean }>, allowed: number, skipped: Map<number, bigint>) {
  while (tacoTokens(plans) > allowed) {
    let pick: { i: number; gain: bigint } | null = null
    for (let i = 0; i < plans.length; i++) {
      if (!plans[i].legs.some(l => l.dex === 'taco')) continue
      const without = await planAsset(P, i, excluded[i], { ...flags[i], taco: false })
      const gain = plans[i].netOut - without.netOut
      if (!pick || gain < pick.gain || (gain === pick.gain && i > pick.i)) pick = { i, gain }
    }
    if (!pick) break
    flags[pick.i].taco = false
    skipped.set(pick.i, pick.gain > 0n ? pick.gain : 0n)
    plans[pick.i] = await planAsset(P, pick.i, excluded[pick.i], flags[pick.i])
  }
}

async function resolveOwnership(P: PlanCtx, allowed: number): Promise<Resolution> {
  const n = P.inputs.length
  const excluded = P.inputs.map(() => new Set<Resource>())
  const flags = P.inputs.map((inp, i) => ({ taco: !inp.tacoPaused, neu: P.quotes[i].neuGrid.some(v => v > 0n) }))
  const owners = new Map<Resource, number>()
  const decisions: string[] = []
  const skipped = new Map<number, bigint>()
  let plans = await planAll(P, excluded, flags)
  for (let round = 0; ; round++) {
    await budgetPass(P, plans, excluded, flags, allowed, skipped)
    plans = await planAll(P, excluded, flags)
    const c = contested(plans)
    if (c.length === 0) break
    if (round >= ROUND_CAP || P.opts.forceFallback) {
      return venueKeepingFallback(P, plans, excluded, flags, owners, decisions, skipped, allowed)
    }
    let pick: { r: Resource; ranked: Array<{ i: number; loss: bigint }> } | null = null
    for (const [r, us] of c) {
      const ranked: Array<{ i: number; loss: bigint }> = []
      for (const i of us) {
        const alt = r === 'neutrinite'
          ? await planAsset(P, i, excluded[i], { ...flags[i], neu: false })
          : await planAsset(P, i, new Set([...excluded[i], r]), flags[i])
        ranked.push({ i, loss: plans[i].netOut - alt.netOut })
      }
      ranked.sort((x, y) => (y.loss > x.loss ? 1 : y.loss < x.loss ? -1 : x.i - y.i))
      if (!pick || ranked[0].loss > pick.ranked[0].loss) pick = { r, ranked }
    }
    const owner = pick!.ranked[0].i
    owners.set(pick!.r, owner)
    for (let j = 0; j < n; j++) if (j !== owner) {
      if (pick!.r === 'neutrinite') flags[j].neu = false
      else excluded[j].add(pick!.r)
    }
    decisions.push(`${label(P, pick!.r)} -> ${P.inputs[owner].token.symbol} (others lose ${pick!.ranked.slice(1).map(l => `${P.inputs[l.i].token.symbol} ${l.loss}`).join(', ')})`)
  }
  return { plans, excluded, flags, owners, decisions, fallbackUsed: false, skipped }
}

/** Only after 64 rounds: keep each contested resource with the token sending the most through it,
 *  exclude only that resource for the others (their other venues stay). Always ends disjoint. */
async function venueKeepingFallback(
  P: PlanCtx, plans: AssetPlan[], excluded: Set<Resource>[], flags: Array<{ taco: boolean; neu: boolean }>,
  owners: Map<Resource, number>, decisions: string[], skipped: Map<number, bigint>, allowed: number,
): Promise<Resolution> {
  for (let guard = 0; guard < 500; guard++) {
    const c = contested(plans)
    if (c.length === 0) break
    const [r, users] = c[0]
    const through = (i: number): bigint => {
      if (r === 'neutrinite') return plans[i].legs.find(l => l.dex === 'neutrinite')?.expectedOut ?? 0n
      let s = 0n
      for (const l of plans[i].legs) if (l.dex === 'taco') for (const t of l.tacoLegs ?? []) {
        if (routeHopsOfLeg(t, plans[i].address, P.target).some(h => `taco:${hopPair(h)}` === r)) s += t.expectedOut
      }
      return s
    }
    const owner = [...users].sort((a, b) => { const d = through(b) - through(a); return d > 0n ? 1 : d < 0n ? -1 : a - b })[0]
    owners.set(r, owner)
    for (const j of users) if (j !== owner) {
      if (r === 'neutrinite') flags[j].neu = false
      else excluded[j].add(r)
      plans[j] = await planAsset(P, j, excluded[j], flags[j])
    }
    decisions.push(`fallback: ${label(P, r)} -> ${P.inputs[owner].token.symbol}`)
  }
  await budgetPass(P, plans, excluded, flags, allowed, skipped)
  return { plans, excluded, flags, owners, decisions, fallbackUsed: true, skipped }
}

/**
 * 4.6: second in line, after ownership and the budget pass, as a queue per shared pool. A token
 * that ownership moved may sell its TACO part after every token that uses one of its pools: the
 * first wave tokens, and tokens already queued (third in line and on). It is planned on the
 * flows of every other token through the quoted pool curves, so each place in line is priced
 * after the ones before it. A token that a queued token already waits for keeps its first wave
 * plan (the queued token was priced on it), so the waits never form a cycle. The line is capped
 * at MAX_QUEUE_DEPTH places and by the TACO call budget; at run time each place gets the exact
 * recheck and the s/2 send rule, with the 30 s cap counted from the tokens it waits for.
 */
async function secondInLine(P: PlanCtx, res: Resolution, alone: AssetPlan[], allowed: number): Promise<void> {
  const n = P.inputs.length
  const plans = res.plans
  const losses = plans.map((p, i) => alone[i].netOut - p.netOut)
  const order = [...Array(n).keys()]
    .filter(i => res.excluded[i].size > 0 && !plans[i].issue && alone[i].netOut > 0n
      && losses[i] * 10000n > alone[i].netOut * SECOND_MIN_LOSS_BP)
    .sort((a, b) => (losses[b] > losses[a] ? 1 : losses[b] < losses[a] ? -1 : a - b))
  if (order.length === 0) return
  P.curves = P.curves ?? buildHopCurves(P.quotes, P.target)
  const place = new Map<number, number>()   // queued token -> its place in line (1 = second in line)
  const waitedFor = new Set<number>()       // tokens some queued token waits for
  for (const b of order) {
    if (waitedFor.has(b)) continue
    const flagsB = { ...res.flags[b], taco: !P.inputs[b].tacoPaused && res.flags[b].taco }
    if (!flagsB.taco) continue
    // what lands before b on its pools: the TACO splits of every other token as planned now
    // (tokens on other pools add flows b never meets)
    const splits: Array<{ amountIn: bigint; hops: DirectedHop[]; hopAmounts?: bigint[] }> = []
    plans.forEach((p, j) => {
      if (j === b) return
      for (const l of p.legs) if (l.dex === 'taco') for (const t of l.tacoLegs ?? []) {
        splits.push({ amountIn: t.amountIn, hops: routeHopsOfLeg(t, p.address, P.target),
          hopAmounts: (t.hopDetails ?? []).length ? (t.hopDetails as any[]).map(h => BigInt(h.amountIn)) : undefined })
      }
    })
    const prior = tacoInflows(splits, P.curves)
    const sa = await planAsset(P, b, NO_EXCLUSIONS, flagsB, prior)
    if (sa.issue) continue
    if ((sa.netOut - plans[b].netOut) * 10000n < plans[b].netOut * SECOND_MIN_GAIN_BP) continue
    const mine = new Set(tacoFootprint(sa))
    const waits = [...Array(n).keys()].filter(j => j !== b && tacoFootprint(plans[j]).some(r => mine.has(r)))
    if (waits.length === 0) continue
    const at = 1 + Math.max(0, ...waits.map(j => place.get(j) ?? 0))
    if (at > MAX_QUEUE_DEPTH) continue
    const hadTaco = plans[b].legs.some(l => l.dex === 'taco')
    const hasTaco = sa.legs.some(l => l.dex === 'taco')
    if (!hadTaco && hasTaco && tacoTokens(plans) + 1 > allowed) continue
    place.set(b, at)
    for (const j of waits) waitedFor.add(j)
    res.decisions.push(`${P.inputs[b].token.symbol} ${at === 1 ? 'second' : `place ${at + 1}`} in line after ${waits.map(j => P.inputs[j].token.symbol).join('+')}: ${sa.netOut} (was ${plans[b].netOut})`)
    plans[b] = { ...sa, second: { waitsFor: waits.map(j => plans[j].address), place: at } }
  }
}

function hubsOf(p: AssetPlan, target: string): string[] {
  const hubs = new Set<string>()
  for (const l of p.legs) if (l.dex === 'taco') for (const t of l.tacoLegs ?? []) {
    const route = t.route ?? []
    for (let k = 0; k < route.length - 1; k++) hubs.add(route[k].tokenOut)
  }
  hubs.delete(target)
  return [...hubs]
}
const bpOf = (p: AssetPlan, dex: CrossDexVenue) => p.legs.filter(l => l.dex === dex).reduce((a, l) => a + l.pctBP, 0)

/** Check the structural rules (4.9); returns the problems (any one is a bug). */
export function checkPlan(plan: BatchPlan, inputs: AssetInput[], allowed: number): string[] {
  const out: string[] = []
  // One row per token: two sales of one token would share its approvals, pools and deposits
  // (the basket never holds a token twice; this keeps the runner safe on its own).
  const tokenRows = new Set<string>()
  for (const a of plan.assets) {
    if (tokenRows.has(a.address)) out.push(`${a.symbol}: in the sale twice`)
    tokenRows.add(a.address)
  }
  plan.assets.forEach((a, i) => {
    if (a.issue) return
    const sum = a.legs.reduce((s, l) => s + l.amountIn, 0n)
    if (sum !== inputs[i].amount) out.push(`${a.symbol}: legs sum ${sum} != ${inputs[i].amount}`)
    for (const l of a.legs) {
      if (l.amountIn <= 0n) out.push(`${a.symbol}: zero leg`)
      if (l.dex === 'taco') {
        const n = l.tacoLegs?.length ?? 0
        if (n < 1 || n > 3) out.push(`${a.symbol}: TACO leg with ${n} routes`)
        if (l.amountIn <= inputs[i].token.minimum_amount) out.push(`${a.symbol}: TACO leg at or below the minimum`)
        const s = (l.tacoLegs ?? []).reduce((x, t) => x + t.amountIn, 0n)
        if (s !== l.amountIn) out.push(`${a.symbol}: TACO routes sum ${s} != ${l.amountIn}`)
      }
    }
  })
  const live = plan.assets.filter(a => !a.issue)
  const first = live.filter(a => !a.second)
  const seen = new Map<Resource, string>()
  for (const a of first) for (const r of a.footprint) {
    if (seen.has(r)) out.push(`first wave share ${r}: ${seen.get(r)} and ${a.symbol}`)
    seen.set(r, a.symbol)
  }
  // Queued TACO parts: each waits for tokens in this sale, never for itself (no cycle), and any
  // two tokens on one TACO pool run one after the other (one waits for the other, directly or
  // through the tokens it waits for).
  const byAddr = new Map(live.map(a => [a.address, a]))
  const before = new Map<string, Set<string>>()
  const runsBefore = (addr: string): Set<string> => {
    const hit = before.get(addr)
    if (hit) return hit
    const acc = new Set<string>() // every token that runs before addr (a cycle puts addr itself in)
    before.set(addr, acc)
    const stack = [...(byAddr.get(addr)?.second?.waitsFor ?? [])]
    while (stack.length) {
      const w = stack.pop()!
      if (acc.has(w)) continue
      acc.add(w)
      for (const x of byAddr.get(w)?.second?.waitsFor ?? []) stack.push(x)
    }
    return acc
  }
  for (const a of live) {
    if (!a.second) continue
    if (a.second.waitsFor.length === 0) out.push(`${a.symbol}: second in line with nothing to wait for`)
    for (const w of a.second.waitsFor) if (!byAddr.has(w)) out.push(`${a.symbol} waits for a token that is not in the sale`)
    if (runsBefore(a.address).has(a.address)) out.push(`${a.symbol}: its line waits for itself`)
    if (!a.legs.some(l => l.dex === 'taco')) out.push(`${a.symbol}: in line without a TACO part`)
  }
  const users = new Map<Resource, AssetPlan[]>()
  for (const a of live) for (const r of a.footprint) if (r !== 'neutrinite') users.set(r, [...(users.get(r) ?? []), a])
  for (const [r, us] of users) {
    for (let x = 0; x < us.length; x++) for (let y = x + 1; y < us.length; y++) {
      const A = us[x], B = us[y]
      if (!A.second && !B.second) continue // two first wave tokens: reported above
      if (!runsBefore(B.address).has(A.address) && !runsBefore(A.address).has(B.address)) out.push(`${A.symbol} and ${B.symbol} meet on ${r} without waiting`)
    }
  }
  if (plan.assets.filter(a => a.neutrinite).length > 1) out.push('more than one Neutrinite token')
  if (plan.tacoAssetCount > allowed) out.push(`TACO tokens ${plan.tacoAssetCount} > allowed ${allowed}`)
  return out
}

/**
 * Plan a Sell many sale from cached quotes. Deterministic for the same input.
 */
export async function planMultiSell(inputs: AssetInput[], quotes: AssetQuotes[], opts: PlanOptions): Promise<BatchPlan> {
  const target = opts.target.address
  const best10 = quotes.map(best10Of)
  const P: PlanCtx = { inputs, quotes, opts, target, memo: new Map(), curves: null, best10, yields: 0 }
  const allowedRaw = Math.min(MAX_TACO_TOKENS, opts.callCap - opts.callsUsed)
  const allowed = Math.max(0, allowedRaw)

  // Alone plans (what each token would get if sold by itself, no budget).
  const alone: AssetPlan[] = []
  for (let i = 0; i < inputs.length; i++) {
    alone.push(await planAsset(P, i, new Set(), { taco: !inputs[i].tacoPaused, neu: quotes[i].neuGrid.some(v => v > 0n) }))
  }
  const wanted = tacoTokens(alone)

  const res = await resolveOwnership(P, allowed)
  await secondInLine(P, res, alone, allowed)

  // TACO only tokens over budget: tacoBusy (they wait); budget skip losses for the card.
  const plans = res.plans.map((p, i) => {
    const a = alone[i]
    const skippedLoss = res.skipped.get(i)
    const out: AssetPlan = {
      ...p,
      aloneNetOut: a.netOut,
      aloneReceiveOut: a.receiveOut,
      tacoSkippedForBudget: skippedLoss != null,
      tacoSkipLoss: skippedLoss ?? 0n,
      alone: { venues: a.legs.map(l => l.dex), hubs: hubsOf(a, target), tacoBp: bpOf(a, 'taco'), icpBp: bpOf(a, 'icpswap'), neuBp: bpOf(a, 'neutrinite') },
    }
    if (skippedLoss != null && (p.issue === 'noRoute' || p.issue === 'zeroOut') && !a.issue) out.issue = 'tacoBusy'
    return out
  })

  const valid = plans.filter(p => !p.issue)
  const totalReceiveOut = valid.reduce((a, p) => a + p.receiveOut, 0n)
  const totalMinReceive = valid.reduce((a, p) => {
    const fees = BigInt(p.legs.filter(l => l.dex !== 'taco').length) * ICP_WITHDRAW_FEE
    return a + (p.minOut > fees ? p.minOut - fees : 0n)
  }, 0n)
  const noImpact = valid.reduce((a, p) => a + (p.noImpactOut ?? 0n), 0n)
  const expected = valid.reduce((a, p) => a + p.expectedOut, 0n)
  const impactPct = noImpact > 0n ? Math.max(0, (1 - Number(expected) / Number(noImpact)) * 100) : null
  const share: Record<CrossDexVenue, bigint> = { icpswap: 0n, taco: 0n, neutrinite: 0n }
  for (const p of valid) for (const l of p.legs) share[l.dex] += l.expectedOut
  const venueShareBp: Record<CrossDexVenue, number> = { icpswap: 0, taco: 0, neutrinite: 0 }
  if (expected > 0n) for (const k of Object.keys(share) as CrossDexVenue[]) venueShareBp[k] = Number(share[k] * 10000n / expected)

  // Budget decision (4.5)
  const skippedIdx = [...res.skipped.keys()].filter(i => !plans[i].issue || plans[i].issue === 'tacoBusy')
  const gainIfWait = skippedIdx.reduce((a, i) => a + (res.skipped.get(i) ?? 0n), 0n)
  const ask = skippedIdx.some(i => {
    const loss = res.skipped.get(i) ?? 0n
    return loss >= ASK_MIN_ICP || loss * 10000n >= (plans[i].receiveOut > 0n ? plans[i].receiveOut : 1n) * ASK_MIN_BP
  }) || plans.some(p => p.issue === 'tacoBusy')
  const waitMs = skippedIdx.length && opts.msUntilCallsFree ? opts.msUntilCallsFree(wanted, opts.callCap) : 0

  const batch: BatchPlan = {
    assets: plans,
    totalReceiveOut,
    totalMinReceive,
    impactPct,
    venueShareBp,
    note: poolNote(P, plans, res),
    moves: moveSentences(P, plans),
    routeCount: valid.reduce((a, p) => a + p.legs.length, 0),
    tacoAssetCount: tacoTokens(valid),
    gate: gateOf(P, plans),
    budget: { allowed, skipped: skippedIdx.map(i => plans[i].address), waitMs, gainIfWait, ask, wanted },
    decisions: res.decisions,
    fallbackUsed: res.fallbackUsed,
    quotedAt: quotes.reduce((m, q) => Math.min(m, q.quotedAt), Infinity),
  }
  return batch
}

/** 4.9: the shared pool note, only when a token gets at least 0.3% or 0.01 ICP less than alone. */
function poolNote(P: PlanCtx, plans: AssetPlan[], res: Resolution): PoolNote | null {
  const named: Array<{ i: number; gap: bigint; cause: string; neu: boolean }> = []
  plans.forEach((p, i) => {
    if (p.issue || p.tacoSkippedForBudget) return
    const gap = p.aloneReceiveOut - p.receiveOut
    if (gap <= 0n) return
    const bar = big((p.aloneReceiveOut * NOTE_MIN_BP) / 10000n, NOTE_MIN_ICP)
    if (gap < bar) return
    let cause = ''
    let neu = false
    if (p.second) cause = plans.find(x => x.address === p.second!.waitsFor[0])?.symbol ?? ''
    if (!cause) {
      for (const r of res.excluded[i]) { const o = res.owners.get(r); if (o != null) { cause = P.inputs[o].token.symbol; break } }
    }
    if (!cause && !res.flags[i].neu && P.quotes[i].neuGrid.some(v => v > 0n)) {
      const o = res.owners.get('neutrinite')
      if (o != null) { cause = P.inputs[o].token.symbol; neu = true }
    }
    if (!cause) return
    named.push({ i, gap, cause, neu })
  })
  if (named.length === 0) return null
  named.sort((a, b) => (b.gap > a.gap ? 1 : b.gap < a.gap ? -1 : a.i - b.i))
  return {
    tokens: named.map(x => plans[x.i].symbol),
    causes: [...new Set(named.map(x => x.cause))],
    viaNeutrinite: named.length === 1 && named[0].neu,
    lessIcp: named.reduce((a, x) => a + x.gap, 0n),
  }
}

/** Expanded row sentences for tokens whose plan differs from their alone plan. */
function moveSentences(P: PlanCtx, plans: AssetPlan[]): Array<{ asset: string; text: string }> {
  const out: Array<{ asset: string; text: string }> = []
  for (const p of plans) {
    if (p.issue) continue
    const s = p.symbol
    if (p.second) {
      const after = p.second.waitsFor.map(a => plans.find(x => x.address === a)?.symbol ?? '').filter(Boolean)
      out.push({ asset: p.address, text: `Sells its TACO part right after ${joinNames(after)}.` })
      continue
    }
    if (p.tacoSkippedForBudget) { out.push({ asset: p.address, text: `${s} skips TACO this time.` }); continue }
    const tacoBp = bpOf(p, 'taco'), icpBp = bpOf(p, 'icpswap'), neuBp = bpOf(p, 'neutrinite')
    const a = p.alone
    if (a.tacoBp > 0 && tacoBp === 0 && icpBp > 0 && neuBp > 0) { out.push({ asset: p.address, text: `${s} sells on ICPSwap and Neutrinite instead.` }); continue }
    if (neuBp > a.neuBp && tacoBp < a.tacoBp) { out.push({ asset: p.address, text: `${s} sells more on Neutrinite instead.` }); continue }
    if (icpBp > a.icpBp) { out.push({ asset: p.address, text: `${s} sells more on ICPSwap instead.` }); continue }
    const hubs = hubsOf(p, P.target).filter(h => !a.hubs.includes(h))
    if (hubs.length > 0) {
      const name = P.inputs.find(x => x.token.address === hubs[0])?.token.symbol ?? P.opts.symbolOf?.(hubs[0]) ?? 'another pool'
      out.push({ asset: p.address, text: `${s} goes through ${name} instead.` })
    }
  }
  return out
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** 4.7: the Neutrinite gate, only for legs that trade a token on the Neutrinite route. */
function gateOf(P: PlanCtx, plans: AssetPlan[]): BatchPlan['gate'] {
  const ni = plans.findIndex(p => !p.issue && p.neutrinite)
  if (ni < 0) return null
  if (P.inputs[ni].follow !== 'fast') return null
  const neuLeg = plans[ni].legs.find(l => l.dex === 'neutrinite')!
  const units = Math.round(neuLeg.pctBP / 1000)
  const routeTokens = P.quotes[ni].neuRouteTokens[units - 1]
  const tokens = routeTokens == null ? null : new Set(routeTokens.filter(t => t !== P.target))
  if (tokens) tokens.add(plans[ni].address)
  const legs: Array<{ asset: string; dex: CrossDexVenue }> = []
  plans.forEach((p, i) => {
    if (p.issue) return
    for (const l of p.legs) {
      if (l.dex === 'neutrinite') continue
      let gated: boolean
      if (tokens == null) gated = true // route unknown: every leg waits (today's behavior)
      else if (l.dex === 'icpswap') gated = tokens.has(p.address)
      else gated = (l.tacoLegs ?? []).some(t => (t.route ?? []).some(h => (h.tokenIn !== P.target && tokens.has(h.tokenIn)) || (h.tokenOut !== P.target && tokens.has(h.tokenOut))))
      if (gated) legs.push({ asset: p.address, dex: l.dex })
    }
  })
  if (legs.length === 0) return null
  return { token: plans[ni].address, legs }
}
