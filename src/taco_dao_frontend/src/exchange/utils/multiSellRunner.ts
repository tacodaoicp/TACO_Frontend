/**
 * Sell many runner: the whole sale from Confirm to the last settled leg.
 *
 *   lock (exclusive, held until every leg promise settled) ─► preflight (nothing
 *   moves; any failure stops or returns to Confirm) ─► every leg fires at once
 *   (except legs on the Neutrinite route, which wait at the gate, and second in
 *   line TACO legs, which wait for their owners) ─► deferred V1 refunds in one
 *   recoverBatch after the exchange's call window ─► result ─► slow legs keep
 *   the lock, the journal and the unload guard until they settle.
 *
 * Preflight (5.2): storage check, run agent from one identity (delegation at
 * least 15 min away, principal checks, time sync), fresh balances, live fees,
 * exchange checks, sell all exactly for Max rows, the TACO call budget, one exact
 * requote of every leg with the minimum rule, V2 approvals, and the run journal
 * written and read back. Each fund moving call of a leg is made only after its
 * journal record was written and read back (strict journal).
 *
 * Pure module: every effect goes through injected deps, every wait through the clock.
 */

import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import type { CrossDexLeg, CrossDexVenue } from './crossDexOptimizer'
import {
  runCrossDexLeg, makeNeuGate, clockTimeout, nullJournal,
  LEG_BACKSTOP_MS, NEU_GATE_MAX_MS, NEU_STALE_MS,
  type LegCtx, type LegDeps, type LegOutcome, type LegState, type LegReason, type LegTurn, type NeuGate, type AssetType, type Clock,
} from './crossDexLegRunner'
import type { AssetInput, BatchPlan, AssetPlan } from './multiSellPlanner'
import { scaleAssetLegs, checkPlan, joinNames, ICP_WITHDRAW_FEE, MAX_TACO_TOKENS } from './multiSellPlanner'
import { verifyLegs, requoteRule, type QuoteDeps } from './multiSellQuotes'
import { planDebit, requiredDeposit, sellAllExactlyTotal, crossDexMaxReserve } from './crossDexCosts'
import type { RunJournal, RunRecord } from './crossDexJournal'

export const SALE_MIN_SESSION_MS = 15 * 60_000
export const SECOND_CAP_MS = 30_000
export const DEFERRED_DELAY_MS = 95_000
export const LOCK_CAP_MS = 10 * 60_000
/** Preflight waits this long for the V2 approvals: a hung approval must not use up the funds lock. */
export const APPROVAL_WAIT_MS = 120_000
const READ_TIMEOUT_MS = 10_000
export const FEE_HEADROOM = new Set(['i2s4q-syaaa-aaaan-qz4sq-cai', 'rh2pm-ryaaa-aaaan-qeniq-cai'])

export type RunPhase = 'idle' | 'confirming' | 'preparing' | 'selling' | 'settling'
  | 'complete' | 'partial' | 'failed' | 'stopped'

export type StopReason = 'busy' | 'storage' | 'notAuthenticated' | 'sessionEndsSoon' | 'walletChanged' | 'readFailed'
  | 'balanceChanged' | 'ledgerFee' | 'budget' | 'approval' | 'unreachable' | 'frozen' | 'planInvalid'
export type BackReason = 'moved' | 'feeChanged'

export interface LegRun {
  venue: CrossDexVenue
  amountIn: bigint
  expectedOut: bigint
  minOut: bigint
  state: LegState
  reason?: LegReason
  step: string
  amountOut?: bigint
  error?: string
  refundedBy?: 'us' | 'exchange'
  failedAfterSwap?: boolean
  /** The swap's output may already be in the wallet (its withdraw answer was lost): see LegOutcome. */
  outMaybeSent?: boolean
  /** With outMaybeSent: the swap's own answer was lost, so the sale is not sure either: see LegOutcome. */
  saleUnsure?: boolean
  block?: bigint
  deferUntil?: number
  waitsFor?: string[]
  gated?: boolean
}

export interface AssetRun { address: string; symbol: string; amountIn: bigint; atMax: boolean; legs: LegRun[] }

export interface SaleResult {
  phase: 'complete' | 'partial' | 'failed'
  assets: AssetRun[]
  slowLegs: number
  sessionExpired: boolean
  /** ICP that reached the wallet from legs with a known amount (net of withdraw fees). */
  received: bigint
  /** Legs that sold with an amount only the wallet shows. */
  unknownParts: number
}

export interface RunHooks {
  onLeg(asset: number, leg: number, patch: Partial<LegRun>): void
  onPhase(p: RunPhase, info?: { stop?: StopReason; back?: BackReason; stopAsset?: string; approvalSpent?: boolean; waitMs?: number; deferredUntil?: number; deferredCount?: number }): void
  onAssetSettled(asset: number): void
  /** Preflight sent its TACO V2 approvals and waits for their answers (at most APPROVAL_WAIT_MS:
   *  then the sale stops, and an approval that never answered may still land). */
  onApprovals?(count: number): void
  log?: (...a: unknown[]) => void
}

export interface RunAgentLike { principalText: string; timeSynced: boolean; expiresAtMs: number | null }

/** Deps bound to one run agent: every fund moving and recovery call is signed by it. */
export interface BoundDeps extends LegDeps {
  taco: LegDeps['taco'] & {
    recoverBatch(items: Array<{ identifier: string; block: bigint; tType: AssetType }>): Promise<Array<{ identifier: string; block: bigint; success: boolean; error: string }>>
    assertCanTrade(): Promise<void>
  }
  approve(token: string, gross: bigint, fee: bigint): Promise<{ approved: boolean }>
}

export interface SaleDeps {
  clock: Clock
  lock: { run<T>(mode: 'exclusive', fn: () => Promise<T>): Promise<{ busy: true } | { busy: false; value: T }> }
  /** Write, read back and remove a random value. */
  storageProbe(): boolean
  createRunAgent(o: { minLifetimeMs: number; expectPrincipal: string; syncTime: boolean }): Promise<RunAgentLike>
  /** The tab's current principal (store.principalText). */
  currentPrincipal(): string
  balance(token: string): Promise<bigint>
  liveFee(token: string): Promise<bigint>
  /** Exchange frozen check, fresh trading fee and treasury (throws the user message). */
  assertCanTrade(): Promise<void>
  tradingFeeBps(): bigint
  dedupLedgers(): Promise<Set<string>>
  useV2Deposit(token: string): boolean
  quotes: QuoteDeps
  callsUsed(principal: string): number
  msUntilCallsFree(principal: string, n: number, cap: number): number
  /** 9, or 7 when another exchange tab was seen in the last 90 s. */
  callCap(): number
  journal: RunJournal
  bind(run: RunAgentLike): BoundDeps
}

export interface SaleCtx {
  runId: string
  target: TokenInfo
  slip: number
  confirmPrincipal: string
  inputs: AssetInput[]
  plan: BatchPlan
  /** The trading fee the plan was made with. */
  planFeeBps: bigint
  legTimeoutMs?: number
  secondCapMs?: number
  deferredDelayMs?: number
}

export type PrepareResult =
  | { ok: true }
  | { ok: false; stop: StopReason; stopAsset?: string; approvalSpent?: boolean; waitMs?: number; message?: string }
  | { ok: false; back: BackReason }

export interface SaleHandle {
  prepared: Promise<PrepareResult>
  /** Every leg final or slow and the deferred refunds done (null when the sale did not start). */
  ui: Promise<SaleResult | null>
  /** Every leg promise settled (null when the sale did not start). */
  all: Promise<SaleResult | null>
}

interface Prepared {
  run: RunAgentLike
  deps: BoundDeps
  tradingFeeBps: bigint
  tokens: Map<string, { info: TokenInfo; v2: boolean; fee: bigint; dedup: boolean }>
  assets: Array<{ plan: AssetPlan; legs: CrossDexLeg[]; minOut: bigint[]; v2Gross?: bigint }>
}

const SOLD: LegState[] = ['done', 'doneUnknown', 'belowMin']

function deferredPromise<T>() {
  let resolve!: (v: T) => void
  const p = new Promise<T>(r => { resolve = r })
  return { p, resolve }
}

/** Start a sale: lock, preflight, launch. Never throws. */
export function startSale(ctx: SaleCtx, deps: SaleDeps, hooks: RunHooks): SaleHandle {
  const prepared = deferredPromise<PrepareResult>()
  const ui = deferredPromise<SaleResult | null>()
  const all = deferredPromise<SaleResult | null>()
  hooks.onPhase('preparing')
  void deps.lock.run('exclusive', async () => {
    let prep: { res: PrepareResult; p?: Prepared }
    try { prep = await preflight(ctx, deps, hooks) }
    catch (e: any) {
      hooks.log?.('[Sell many] preflight bug:', e)
      prep = { res: { ok: false, stop: 'readFailed' } }
    }
    prepared.resolve(prep.res)
    if (!prep.res.ok || !prep.p) {
      const r = prep.res as any
      hooks.onPhase(r.back ? 'confirming' : 'stopped', { stop: r.stop, back: r.back, stopAsset: r.stopAsset, approvalSpent: r.approvalSpent, waitMs: r.waitMs })
      ui.resolve(null); all.resolve(null)
      return
    }
    hooks.onPhase('selling')
    const run = launch(ctx, prep.p, deps, hooks)
    void run.ui.then(ui.resolve)
    const final = await run.all
    all.resolve(final)
  }).then(r => {
    if (r.busy) {
      prepared.resolve({ ok: false, stop: 'busy' })
      hooks.onPhase('stopped', { stop: 'busy' })
      ui.resolve(null); all.resolve(null)
    }
  }, (e) => {
    hooks.log?.('[Sell many] lock failed:', e)
    prepared.resolve({ ok: false, stop: 'busy' })
    hooks.onPhase('stopped', { stop: 'busy' })
    ui.resolve(null); all.resolve(null)
  })
  return { prepared: prepared.p, ui: ui.p, all: all.p }
}

async function withRead<T>(clock: Clock, p: Promise<T>, label: string): Promise<T> {
  return clockTimeout(clock, p, READ_TIMEOUT_MS, label)
}

/** 5.2 steps 2 to 10. Nothing moves before the V2 approvals of step 9. */
async function preflight(ctx: SaleCtx, deps: SaleDeps, hooks: RunHooks): Promise<{ res: PrepareResult; p?: Prepared }> {
  const plan = ctx.plan
  const stop = (stop: StopReason, extra: Partial<{ stopAsset: string; approvalSpent: boolean; waitMs: number; message: string }> = {}) =>
    ({ res: { ok: false as const, stop, ...extra } })
  const back = (b: BackReason) => ({ res: { ok: false as const, back: b } })
  const assets = plan.assets.map((a, i) => ({ a, i, input: ctx.inputs[i] })).filter(x => !x.a.issue)
  if (assets.length === 0) return stop('readFailed')

  // 1b. The plan's structural rules (legs add up, 1 to 3 TACO routes above the token minimum,
  //     no first wave pool shared, every queued TACO part waits for the parts before it, one
  //     Neutrinite token): a plan that breaks one never runs.
  const problems = checkPlan(plan, ctx.inputs, MAX_TACO_TOKENS)
  if (problems.length > 0) {
    hooks.log?.('[Sell many] plan check failed, nothing sent:', problems)
    return stop('planInvalid')
  }

  // 2. Storage keeps data
  if (!deps.storageProbe()) return stop('storage')

  // 3. Run agent from one identity object
  let run: RunAgentLike
  try {
    run = await deps.createRunAgent({ minLifetimeMs: SALE_MIN_SESSION_MS, expectPrincipal: ctx.confirmPrincipal, syncTime: true })
  } catch (e: any) {
    const code = e?.code
    return stop(code === 'sessionEndsSoon' ? 'sessionEndsSoon' : code === 'walletChanged' ? 'walletChanged' : 'notAuthenticated')
  }
  if (run.principalText !== ctx.confirmPrincipal || deps.currentPrincipal() !== ctx.confirmPrincipal) return stop('walletChanged')

  const anyTaco = assets.some(x => x.a.legs.some(l => l.dex === 'taco'))
  const anyV1Taco = assets.some(x => x.a.legs.some(l => l.dex === 'taco') && !x.input.v2)

  // 4. Fresh reads, in parallel, 10 s each
  let balances: bigint[], fees: bigint[], dedupSet: Set<string>, verified: Array<Array<bigint | null>>
  try {
    const [b, f, , d, v] = await Promise.all([
      Promise.all(assets.map(x => withRead(deps.clock, deps.balance(x.a.address), 'balance'))),
      Promise.all(assets.map(x => withRead(deps.clock, deps.liveFee(x.a.address), 'fee'))),
      anyTaco ? withRead(deps.clock, deps.assertCanTrade(), 'assertCanTrade').catch((e: any) => { throw Object.assign(new Error(e?.message ?? ''), { exchange: true }) }) : Promise.resolve(),
      // an unreadable dedup list only means no resends (the deposits go without created_at_time), never a stop
      anyV1Taco ? withRead(deps.clock, deps.dedupLedgers(), 'dedup').catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
      Promise.all(assets.map(x => withRead(deps.clock, verifyLegs(x.a, x.input.token, ctx.target, deps.quotes), 'verify'))),
    ])
    balances = b; fees = f; dedupSet = d as Set<string>; verified = v
  } catch (e: any) {
    if (e?.exchange) {
      const m = String(e.message ?? '')
      return stop(/frozen/i.test(m) ? 'frozen' : /Rate limit/i.test(m) ? 'budget' : 'unreachable',
        /Rate limit/i.test(m) ? { waitMs: deps.msUntilCallsFree(run.principalText, plan.tacoAssetCount, deps.callCap()) } : {})
    }
    return stop('readFailed')
  }

  // 5. Pins: the trading fee, the V2 path, the ledger fees
  const tradingFeeBps = anyTaco ? deps.tradingFeeBps() : ctx.planFeeBps
  if (anyTaco && tradingFeeBps !== ctx.planFeeBps) return back('feeChanged')
  const tokens: Prepared['tokens'] = new Map()
  for (let k = 0; k < assets.length; k++) {
    const { a, input } = assets[k]
    const hasTaco = a.legs.some(l => l.dex === 'taco')
    const v2 = hasTaco && !FEE_HEADROOM.has(a.address) && deps.useV2Deposit(a.address)
    if (hasTaco && v2 !== input.v2) return back('moved')
    const cached = input.token.transfer_fee
    const live = fees[k]
    if (hasTaco && live !== cached) return stop('ledgerFee', { stopAsset: a.address })
    tokens.set(a.address, { info: input.token, v2: hasTaco && v2, fee: live > cached ? live : cached, dedup: dedupSet.has(a.address) })
  }

  // 6. Sell all exactly for Max rows, then every token's exact debit must fit its fresh balance.
  //    A Max row grows by at most the fee room its Max kept back: a balance that grew since Max
  //    (tokens arrived, a basket from earlier) stops the sale, since Confirm showed the smaller
  //    amount and the minimums were verified for it.
  const prepAssets: Prepared['assets'] = []
  for (let k = 0; k < assets.length; k++) {
    const { a, input } = assets[k]
    const t = tokens.get(a.address)!
    const headroom = FEE_HEADROOM.has(a.address)
    let legs = a.legs
    if (input.atMax) {
      const exact = sellAllExactlyTotal(balances[k], legs, t.fee, tradingFeeBps, t.v2, headroom)
      if (exact != null) {
        const confirmed = legs.reduce((s, l) => s + l.amountIn, 0n)
        const room = crossDexMaxReserve(balances[k], t.fee, tradingFeeBps, input.v2 || t.v2, headroom)
        if (exact - confirmed > room) return stop('balanceChanged', { stopAsset: a.address })
        const scaled = scaleAssetLegs(legs, exact)
        // keep the TACO leg above the token minimum, else the confirmed amounts stay
        const tl = scaled.find(l => l.dex === 'taco')
        if (!tl || tl.amountIn > input.token.minimum_amount) legs = scaled
      }
    }
    if (planDebit(legs, t.fee, tradingFeeBps, t.v2, headroom) > balances[k]) return stop('balanceChanged', { stopAsset: a.address })
    prepAssets.push({ plan: a, legs, minOut: [...a.legMinOut] })
  }

  // 7. TACO call budget, every exchange tab of the wallet counted
  if (deps.callsUsed(run.principalText) + plan.tacoAssetCount > deps.callCap()) {
    return stop('budget', { waitMs: deps.msUntilCallsFree(run.principalText, plan.tacoAssetCount, deps.callCap()) })
  }

  // 8. The exact requote rule over the verified legs (second in line TACO legs keep their own rule)
  const ruleLegs: Array<{ k: number; li: number; planned: bigint; plannedMin: bigint; fresh: bigint | null }> = []
  assets.forEach(({ a }, k) => a.legs.forEach((l, li) => {
    if (a.second && l.dex === 'taco') return
    ruleLegs.push({ k, li, planned: l.expectedOut, plannedMin: a.legMinOut[li], fresh: verified[k][li] })
  }))
  const rule = requoteRule(ruleLegs, ctx.slip)
  if (!rule.ok) return rule.reason === 'failed' ? stop('readFailed') : back('moved')
  ruleLegs.forEach((r, j) => { prepAssets[r.k].minOut[r.li] = rule.minOut[j] })

  // 9. V2 approvals, in parallel, before anything moves. The wait is capped (APPROVAL_WAIT_MS) so a
  //    hung approval cannot use up the funds lock while the legs still need it. An approval without
  //    an answer at the cap may still land: the sale stops as an approval (spent), never as not sent.
  const bound = deps.bind(run)
  let approvalSpent = false
  const v2Jobs = prepAssets.map((pa, k) => ({ pa, k })).filter(({ pa }) => tokens.get(pa.plan.address)!.v2 && pa.legs.some(l => l.dex === 'taco'))
  if (v2Jobs.length > 0) try { hooks.onApprovals?.(v2Jobs.length) } catch { /* display only */ }
  const pendingApproval = new Set(v2Jobs.map(j => j.pa.plan.address))
  let approvals: Array<string | null> = []
  if (v2Jobs.length > 0) {
    try {
      approvals = await clockTimeout(deps.clock, Promise.all(v2Jobs.map(async ({ pa }) => {
        const t = tokens.get(pa.plan.address)!
        const tacoLeg = pa.legs.find(l => l.dex === 'taco')!
        const gross = requiredDeposit(tacoLeg.amountIn, tradingFeeBps, t.fee)
        pa.v2Gross = gross
        try { const r = await bound.approve(pa.plan.address, gross, t.fee); if (r.approved) approvalSpent = true; return null }
        catch { approvalSpent = true; return pa.plan.address }
        finally { pendingApproval.delete(pa.plan.address) }
      })), APPROVAL_WAIT_MS, 'approvals')
    } catch {
      hooks.log?.('[Sell many] no answer from these approvals in time, the sale stops:', [...pendingApproval])
      return stop('approval', { stopAsset: [...pendingApproval][0] ?? v2Jobs[0].pa.plan.address, approvalSpent: true })
    }
  }
  const failedApproval = approvals.find(x => x != null)
  if (failedApproval) return stop('approval', { stopAsset: failedApproval, approvalSpent })

  // 10. The run journal, written and read back
  const record: RunRecord = {
    v: 2, id: ctx.runId, kind: 'many', principal: run.principalText, target: ctx.target.address,
    startedAt: deps.clock.now(), updatedAt: deps.clock.now(), phase: 'running', pendingSlow: 0,
    assets: prepAssets.map(pa => ({
      token: pa.plan.address, symbol: pa.plan.symbol, atMax: !!ctx.inputs[plan.assets.indexOf(pa.plan)]?.atMax,
      amountIn: pa.legs.reduce((s, l) => s + l.amountIn, 0n).toString(),
      type: Object.keys(tokens.get(pa.plan.address)!.info.asset_type)[0],
      legs: pa.legs.map((l, li) => ({
        dex: l.dex, amountIn: l.amountIn.toString(), expectedOut: l.expectedOut.toString(), minOut: pa.minOut[li].toString(),
        state: 'waiting' as const, waitsFor: l.dex === 'taco' ? pa.plan.second?.waitsFor ?? [] : [],
      })),
    })),
  }
  if (!deps.journal.start(record)) return stop('storage', { approvalSpent })
  return { res: { ok: true }, p: { run, deps: bound, tradingFeeBps, tokens, assets: prepAssets } }
}

/**
 * Queued TACO legs (second in line and on) wait until the TACO leg of every token they wait for
 * is final. Late when one of those still running started more than the cap ago, or when one
 * never started (held at the gate, or waiting in line itself) by the gate's limit plus one cap
 * per place in line.
 */
function makeTurns(prep: Prepared, clock: Clock, capMs: number, quotes: QuoteDeps) {
  const ownerFinal = new Map<string, boolean>()
  const ownerStart = new Map<string, number>()
  for (const pa of prep.assets) if (pa.plan.second) for (const o of pa.plan.second.waitsFor) { ownerFinal.set(o, false) }
  const t0 = clock.now()
  return {
    started(address: string) { if (ownerFinal.has(address) && !ownerStart.has(address)) ownerStart.set(address, clock.now()) },
    final(address: string) { if (ownerFinal.has(address)) ownerFinal.set(address, true) },
    turnFor(pa: Prepared['assets'][number], tacoLi: number): LegTurn | undefined {
      if (!pa.plan.second) return undefined
      const owners = pa.plan.second.waitsFor
      const place = Math.max(1, pa.plan.second.place ?? 1)
      const leg = pa.legs[tacoLi]
      return {
        plannedOut: leg.expectedOut,
        plannedMin: pa.minOut[tacoLi],
        wait: async () => {
          for (;;) {
            const running = owners.filter(o => !ownerFinal.get(o))
            if (running.length === 0) return 'go'
            const starts = running.map(o => ownerStart.get(o))
            const now = clock.now()
            if (starts.every(s => s != null) && now - Math.max(...(starts as number[])) > capMs) return 'late'
            // a token it waits for never started (the gate held it, or it waits in line too)
            if (now - t0 > NEU_STALE_MS + capMs * place) return 'late'
            await clock.sleep(250)
          }
        },
        recheck: async () => {
          const sim = await quotes.simulateSplitRoutes((leg.tacoLegs ?? []).map(t => ({ amountIn: t.amountIn, route: t.route })))
          if (sim.error || sim.totalOut <= 0n) return null
          return sim.totalOut
        },
      }
    },
  }
}

function legRunOf(o: LegOutcome): Partial<LegRun> {
  return { state: o.state, reason: o.reason, amountOut: o.success ? o.amountOut : undefined, error: o.error, refundedBy: o.refundedBy,
    failedAfterSwap: o.failedAfterSwap, outMaybeSent: o.outMaybeSent, saleUnsure: o.saleUnsure, block: o.block }
}

function launch(ctx: SaleCtx, prep: Prepared, deps: SaleDeps, hooks: RunHooks): { ui: Promise<SaleResult>; all: Promise<SaleResult> } {
  const clock = deps.clock
  const plan = ctx.plan
  const gate: NeuGate | undefined = plan.gate ? makeNeuGate(clock, { maxMs: NEU_GATE_MAX_MS, staleMs: NEU_STALE_MS, log: m => hooks.log?.(m) }) : undefined
  const gatedSet = new Set((plan.gate?.legs ?? []).map(g => `${g.asset}|${g.dex}`))
  const turns = makeTurns(prep, clock, ctx.secondCapMs ?? SECOND_CAP_MS, deps.quotes)
  const symbolOf = (addr: string) => prep.assets.find(x => x.plan.address === addr)?.plan.symbol ?? ''
  const runs: AssetRun[] = prep.assets.map(pa => ({
    address: pa.plan.address, symbol: pa.plan.symbol, amountIn: pa.legs.reduce((s, l) => s + l.amountIn, 0n),
    atMax: !!ctx.inputs[plan.assets.indexOf(pa.plan)]?.atMax,
    legs: pa.legs.map((l, li) => ({
      venue: l.dex, amountIn: l.amountIn, expectedOut: l.expectedOut, minOut: pa.minOut[li], state: 'waiting' as LegState, step: '',
      waitsFor: l.dex === 'taco' ? pa.plan.second?.waitsFor : undefined, gated: gatedSet.has(`${pa.plan.address}|${l.dex}`),
    })),
  }))
  const patch = (ai: number, li: number, p: Partial<LegRun>) => {
    Object.assign(runs[ai].legs[li], p)
    hooks.onLeg(ai, li, p)
  }
  const final = new Map<string, LegOutcome>()
  const deferredAt = new Map<string, number>()
  const jobs: Array<{ ai: number; li: number; p: Promise<LegOutcome> }> = []
  // the first refusal by the exchange's call limit: later TACO calls in that window defer
  const exchangeRefused = { at: null as number | null }
  prep.assets.forEach((pa, ai) => {
    const t = prep.tokens.get(pa.plan.address)!
    pa.legs.forEach((leg, li) => {
      const gated = gatedSet.has(`${pa.plan.address}|${leg.dex}`)
      const isNeu = leg.dex === 'neutrinite' && plan.gate?.token === pa.plan.address
      const turn = leg.dex === 'taco' ? turns.turnFor(pa, li) : undefined
      const legJournal = deps.journal.legJournal(ctx.runId, ai, li)
      const lctx: LegCtx = {
        sell: t.info,
        buy: ctx.target,
        slip: ctx.slip,
        v2: t.v2 && leg.dex === 'taco',
        tradingFeeBps: prep.tradingFeeBps,
        v2Gross: leg.dex === 'taco' && t.v2 ? pa.v2Gross : undefined,
        fee: t.fee,
        minOut: pa.minOut[li],
        gate: isNeu || gated ? gate : undefined,
        gateWaitText: `Waiting for Neutrinite to confirm the ${symbolOf(plan.gate?.token ?? '')} deposit…`,
        turn,
        turnWaitText: turn ? `Waiting for its turn after ${joinNames(pa.plan.second!.waitsFor.map(symbolOf))}…` : undefined,
        runId: ctx.runId,
        journal: legJournal ?? nullJournal,
        strictJournal: true,
        dedup: t.dedup,
        onStep: (s) => {
          // waiting at the gate or for its turn shows as waiting; a recovery as recovering
          patch(ai, li, { step: s, state: /^Waiting/.test(s) ? 'waiting' : /^Recovering/.test(s) ? 'recovering' : 'running' })
          if (leg.dex === 'taco' && (s === 'Depositing…' || s === 'Swapping…')) turns.started(pa.plan.address)
          try { legJournal.progress({ step: s }) } catch { /* best effort */ }
        },
        probeLimit: 50n,
        sortV1Errors: true,
        exchangeRefused,
        log: hooks.log,
      }
      const p = runCrossDexLeg(leg, lctx, prep.deps).then(o => {
        final.set(`${ai}|${li}`, o)
        if (o.state === 'deferred') deferredAt.set(`${ai}|${li}`, clock.now())
        if (leg.dex === 'taco') { turns.started(pa.plan.address); turns.final(pa.plan.address) }
        patch(ai, li, legRunOf(o))
        if (pa.legs.every((_, j) => final.has(`${ai}|${j}`))) hooks.onAssetSettled(ai)
        return o
      })
      jobs.push({ ai, li, p })
    })
  })

  const backstop = ctx.legTimeoutMs ?? LEG_BACKSTOP_MS
  const deferredDone = new Set<string>()
  let lastDeferredAt = 0

  /** 5.10: refund every deferred V1 deposit in one recoverBatch after the window. */
  const deferredPass = async () => {
    const pending = [...final].filter(([k, o]) => o.state === 'deferred' && o.deferred && !deferredDone.has(k))
    if (pending.length === 0) return
    for (const [k] of pending) deferredDone.add(k)
    for (const [k] of pending) lastDeferredAt = Math.max(lastDeferredAt, deferredAt.get(k) ?? clock.now())
    for (const [k] of pending) {
      const [ai, li] = k.split('|').map(Number)
      patch(ai, li, { deferUntil: lastDeferredAt + (ctx.deferredDelayMs ?? DEFERRED_DELAY_MS) })
    }
    const until = lastDeferredAt + (ctx.deferredDelayMs ?? DEFERRED_DELAY_MS)
    hooks.onPhase('settling', { deferredUntil: until, deferredCount: pending.length })
    for (;;) {
      const wait = Math.max(until - clock.now(), deps.msUntilCallsFree(prep.run.principalText, 1, 20))
      if (wait <= 0) break
      await clock.sleep(Math.min(wait, 5_000))
    }
    const setAll = (o: LegOutcome, p: Partial<LegOutcome>) => {
      Object.assign(o, p)
      const [ai, li] = [...final].find(([, v]) => v === o)![0].split('|').map(Number)
      patch(ai, li, legRunOf(o))
      try { deps.journal.legJournal(ctx.runId, ai, li).final(o) } catch { /* best effort */ }
    }
    try { await prep.deps.taco.assertCanTrade() }
    catch {
      for (const [, o] of pending) setAll(o, { state: 'needsRecovery', reason: 'tacoPaused', error: 'The TACO exchange is paused right now. Your deposit is safe there. Use the Recover page when it is back.' })
      return
    }
    const items = pending.map(([, o]) => ({ identifier: o.deferred!.token, block: o.deferred!.block, tType: o.deferred!.assetType }))
    let results: Array<{ identifier: string; block: bigint; success: boolean; error: string }>
    try { results = await prep.deps.taco.recoverBatch(items) }
    catch (e: any) {
      for (const [, o] of pending) setAll(o, { state: 'needsRecovery', reason: 'unconfirmed', error: e?.message ?? 'Recovery did not go through' })
      return
    }
    if (results.length === 1 && !results[0].success && /not allowed/i.test(results[0].error ?? '')) {
      for (const [, o] of pending) setAll(o, { state: 'needsRecovery', reason: 'rateLimited', error: 'The TACO exchange is busy for your wallet. Use the Recover page in a few minutes.' })
      return
    }
    for (const [k, o] of pending) {
      const [ai, li] = k.split('|').map(Number)
      const r = results.find(x => x.identifier === o.deferred!.token && BigInt(x.block) === o.deferred!.block)
      const ok = !!r && (r.success || /already recovered|already refunded/i.test(r.error ?? ''))
      if (ok) {
        prep.deps.taco.removeDepositFromCache(o.deferred!.block.toString(), o.deferred!.token)
        try { deps.journal.legJournal(ctx.runId, ai, li).deposit('recovered') } catch { /* best effort */ }
        setAll(o, { state: 'refunded', refundedBy: 'us', recovered: true, reason: undefined })
      } else {
        setAll(o, { state: 'needsRecovery', reason: 'unconfirmed', error: r?.error || 'Recovery did not go through' })
      }
    }
  }

  const result = (slow: Set<string>): SaleResult => {
    let sold = 0, total = 0, received = 0n, unknown = 0
    let sessionExpired = false
    runs.forEach((ar, ai) => ar.legs.forEach((l, li) => {
      total++
      const o = final.get(`${ai}|${li}`)
      if (!o || slow.has(`${ai}|${li}`)) return
      if (SOLD.includes(o.state)) {
        sold++
        if (o.state === 'doneUnknown') unknown++
        else received += o.amountOut - (o.dex === 'taco' ? 0n : ICP_WITHDRAW_FEE)
      }
      if (o.reason === 'session' || /Session expired/i.test(o.error ?? '')) sessionExpired = true
    }))
    return {
      phase: sold === total ? 'complete' : sold > 0 ? 'partial' : 'failed',
      assets: runs, slowLegs: slow.size, sessionExpired, received, unknownParts: unknown,
    }
  }

  const uiP = (async () => {
    const slow = new Set<string>()
    await Promise.all(jobs.map(j => clockTimeout(clock, j.p, backstop, 'leg').catch(() => {
      slow.add(`${j.ai}|${j.li}`)
      patch(j.ai, j.li, { state: 'slow', step: 'Taking longer than usual. It keeps going in the background.' })
    })))
    await deferredPass()
    const r = result(slow)
    hooks.onPhase(r.phase)
    if (slow.size > 0) try { deps.journal.setPhase(ctx.runId, 'running', { pendingSlow: slow.size }) } catch { /* best effort */ }
    return r
  })()

  const allP = (async () => {
    await Promise.all(jobs.map(j => j.p))
    await uiP
    // a slow leg that ended deferred after the pass gets its own pass, lock still held
    await deferredPass()
    const r = result(new Set())
    try { deps.journal.close(ctx.runId) } catch { /* best effort */ }
    return r
  })()

  return { ui: uiP, all: allP }
}
