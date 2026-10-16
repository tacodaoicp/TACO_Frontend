/**
 * One CrossDEX route ("leg"): the ICPSwap, TACO or Neutrinite part of a sale,
 * with its own recovery. Moved out of useCrossDexSwap so the single swap and
 * Sell many run the same code, and so a node harness can run it against fake
 * DEXes.
 *
 * Safety contract (unchanged): each leg's failure is contained, and on any
 * error a leg recovers its own funds so nothing is stranded:
 *   ICPSwap    -> sweep (withdraws stranded pool and subaccount balances)
 *   TACO V1    -> recoverWronglysent (refunds the unspent deposit)
 *   TACO V2    -> classified; pending pulls are tracked on chain
 *   Neutrinite -> sweep (withdraws this swap's pylon balance above its baseline)
 * runCrossDexLeg never throws: it always resolves to an outcome, after the
 * route's own recovery ran.
 *
 * Pointer rule for TACO V1 deposits: the deposit history entry is removed (and
 * the journal leg marked used or recovered) only after Ok or a recovery that
 * returned true. Every other answer keeps the pointer.
 *
 * Pure module: no store, services, Vue or @dfinity value imports. Every network
 * effect goes through `deps`, every wait through `deps.clock`.
 */

import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import type { CrossDexLeg, CrossDexVenue } from './crossDexOptimizer'
import { classifyExchangeError, isTransportError, type VerifyStatus } from './errors'
import { requiredDeposit } from './crossDexCosts'

// ── Constants (shared with Sell many) ──
export const NEU_GATE_MAX_MS = 20_000
/** Past this from the gate start the page was paused: a waiting leg starts nothing new. */
export const NEU_STALE_MS = NEU_GATE_MAX_MS + 5_000
export const NEU_WAIT_STEP = 'Waiting for Neutrinite to confirm your deposit…'
export const NOT_STARTED = 'Not started, your funds stayed in your wallet'
/** UI backstop per leg; the leg itself keeps running and settles later. */
export const LEG_BACKSTOP_MS = 180_000
export const SLOW_LEG_ERROR = 'This route took too long. Check your wallet and the Recover page.'

// ── Clock ──
export interface Clock {
  now(): number
  sleep(ms: number): Promise<void>
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
}

export const realClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise(r => setTimeout(r, ms)),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
}

/** Reject after `ms` on the given clock (the promise itself keeps running). */
export function clockTimeout<T>(clock: Clock, p: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const h = clock.setTimer(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    p.then(v => { clock.clearTimer(h); resolve(v) }, e => { clock.clearTimer(h); reject(e) })
  })
}

// ── Neutrinite first gate ──
// A split that includes Neutrinite goes Neutrinite first: the other legs wait
// at a one way gate until the pylon credits our deposit, that leg fails, or
// maxMs passes. A credit that comes after the gate opened some other way is
// refused and swept back, so no other venue of ours moves the price before
// Neutrinite swaps. Judged by the clock, not only the cap timer: after a page
// freeze a network callback can run before the overdue timer and must still
// count as late.
export interface NeuGate {
  /** Open the gate; returns false when the opener came too late (credit after the cap). */
  open(why: string): boolean
  isOpen(): boolean
  /** Wait for the gate; resolves true when the waiting leg may still start. */
  wait(onWaiting?: () => void): Promise<boolean>
  readonly startedAt: number
}

export function makeNeuGate(clock: Clock, opts: { maxMs?: number; staleMs?: number; log?: (msg: string) => void } = {}): NeuGate {
  const maxMs = opts.maxMs ?? NEU_GATE_MAX_MS
  const staleMs = opts.staleMs ?? NEU_STALE_MS
  const t0 = clock.now()
  let opened = false
  let release!: () => void
  const openedP = new Promise<void>(r => { release = r })
  const fresh = () => clock.now() - t0 < staleMs
  const open = (why: string) => {
    if (opened) return false
    opened = true
    clock.clearTimer(cap)
    release()
    const late = clock.now() - t0 >= maxMs
    opts.log?.(`[CrossDEX] gate open: ${late && why === 'credit' ? 'cap (credit seen late)' : why} ${clock.now() - t0} ms`)
    return !late
  }
  const cap = clock.setTimer(() => { open('cap') }, maxMs)
  return {
    open,
    isOpen: () => opened || clock.now() - t0 >= maxMs,
    wait: async (onWaiting) => {
      if (!opened) { onWaiting?.(); await openedP }
      return fresh()
    },
    startedAt: t0,
  }
}

export const isNeuFirst = (legs: ReadonlyArray<{ dex: CrossDexVenue }>) =>
  legs.length > 1 && legs.some(l => l.dex === 'neutrinite')

// ── Outcomes ──
export type LegState = 'waiting' | 'running' | 'recovering' | 'deferred' | 'slow'
  | 'done' | 'doneUnknown' | 'belowMin' | 'refunded' | 'notSent' | 'needsRecovery' | 'tracked'
export type LegReason = 'maySent' | 'unconfirmed' | 'admin' | 'afterSwap' | 'rateLimited' | 'tacoPaused'
  | 'secondLate' | 'secondMoved' | 'secondCheck' | 'gateLate' | 'journal' | 'session' | 'slippage' | 'timeout' | string
export type AssetType = { ICP: null } | { ICRC12: null } | { ICRC3: null }

export interface LegOutcome {
  dex: CrossDexVenue
  /** The route sold (done, doneUnknown or belowMin). */
  success: boolean
  amountOut: bigint
  state: LegState
  reason?: LegReason
  error?: string
  refundedBy?: 'us' | 'exchange'
  /** The swap ran but its output could not be sent to the wallet. */
  failedAfterSwap?: boolean
  /** TACO V1 deposit block, when one was made. */
  block?: bigint
  /** V1 deposit to refund after the exchange's call window (Sell many). */
  deferred?: { token: string; block: bigint; assetType: AssetType }
  // The single swap card reads these two, set exactly as before the move.
  recovered?: boolean
  notStarted?: boolean
}

// ── Context and dependencies ──
export interface LegJournal {
  /** V1 deposit intent, written and read back before the transfer. */
  intent(data: { amount: bigint; to: string; createdAtNs?: bigint; memo?: string }): boolean
  /** V1 deposit block, right after the transfer. */
  block(block: bigint): boolean
  /** Written and read back right before ICPSwap depositFrom, the Neutrinite transfer, a V2 swap call. */
  beforeMove(step: 'depositFrom' | 'neuTransfer' | 'v2Swap'): boolean
  /** Deposit pointer status of this leg. */
  deposit(status: 'open' | 'used' | 'recovered' | 'settled'): void
  progress(patch: { step?: string; state?: LegState }): void
  final(outcome: LegOutcome): void
}

export const nullJournal: LegJournal = {
  intent: () => true,
  block: () => true,
  beforeMove: () => true,
  deposit: () => { /* none */ },
  progress: () => { /* none */ },
  final: () => { /* none */ },
}

export interface LegCtx {
  sell: TokenInfo
  buy: TokenInfo
  /** Slippage as a fraction (0.005 = 0.5%). */
  slip: number
  /** TACO deposit path, pinned once per sale. */
  v2: boolean
  /** Trading fee, pinned once per sale. */
  tradingFeeBps: bigint
  /** V2 gross pinned with the approval (defaults to the required deposit of the leg). */
  v2Gross?: bigint
  /** The sell token's transfer fee, pinned (max of live and listed). */
  fee: bigint
  /** Minimum output override (Sell many preflight); else expectedOut × (1 − slip). */
  minOut?: bigint
  /** The Neutrinite leg opens it; ICPSwap and TACO legs wait at it. */
  gate?: NeuGate
  gateWaitText?: string
  runId?: string
  journal: LegJournal
  /** Sell many: a failed journal write stops the leg before funds move. The single swap goes on. */
  strictJournal: boolean
  /** The sell ledger deduplicates transfers with created_at_time (resend is safe). */
  dedup: boolean
  onStep: (s: string) => void
  /** How many swap records the landed probe reads (10 single, 50 batch). */
  probeLimit: bigint
  /** Sell many sorts TACO V1 answers (5.9), hands rate limited deposits to the
   *  deferred refund pass and reads what a sweep brought back (ICP back means
   *  the swap had sold); the single swap keeps one recovery after any failure. */
  sortV1Errors: boolean
  /** Second in line TACO leg: waits for its owners' TACO legs, then an exact recheck. */
  turn?: LegTurn
  turnWaitText?: string
  /** Sell many: shared by the run's legs, set at the first refusal by the exchange's call limit.
   *  For that window the run's later TACO calls wait for the one deferred refund instead (the
   *  first refusal of a day only warns, the second bans the wallet for a day). */
  exchangeRefused?: { at: number | null }
  log?: (...a: unknown[]) => void
}

export interface LegTurn {
  /** Resolves when every owner TACO leg is final ('go'), or at the cap ('late'). */
  wait(): Promise<'go' | 'late'>
  /** One simulateSplitRoutes on the planned splits: the fresh gross total, or null. */
  recheck(): Promise<bigint | null>
  plannedOut: bigint
  plannedMin: bigint
}

/** What a TACO split leg looks like when handed to the exchange. */
export interface TacoRouteLeg {
  amountIn: bigint
  route: Array<{ tokenIn: string; tokenOut: string }>
}

export interface LegDeps {
  icpswap: {
    icrc2Swap(p: {
      sellTokenPrincipal: string; buyTokenPrincipal: string; amountIn: bigint; minAmountOut: bigint
      onStep?: (s: string) => void; beforeDeposit?: () => Promise<void | boolean>; requireMarker?: boolean
      track?: IcpTrack
    }): Promise<{ amountOut: bigint }>
    sweep(p: { token0Principal: string; token1Principal: string }, opts?: { report?: SweepReport }): Promise<boolean>
    sweepWithRetry(p: { token0Principal: string; token1Principal: string }, attempts?: number, delayMs?: number, opts?: { report?: SweepReport }): Promise<boolean>
    removePendingSwap(sell: string, buy: string): void
  }
  neutrinite: {
    executeSwap(p: {
      sell: string; buy: string; amountIn: bigint; minAmountOut: bigint
      onStep?: (s: string) => void; canDeposit?: () => boolean; beforeTransfer?: () => boolean; requireMarker?: boolean
      onCredited?: () => boolean
      track?: { before?: { sell: bigint; buy: bigint }; swappedOut?: bigint; hadMarker?: boolean }
    }): Promise<{ amountOut: bigint }>
    sweep(sell: string, buy: string, before?: { sell: bigint; buy: bigint }, opts?: { report?: SweepReport }): Promise<boolean>
    removePendingSwap(sell: string, buy: string): void
  }
  taco: {
    treasury(): { accountId: string; principal: string }
    depositToken(
      token: string, assetType: AssetType, amount: bigint, tradingFeeBps: bigint, transferFee: bigint,
      treasuryAccountId: string, treasuryPrincipal: string,
      opts: { dedup: boolean; runId?: string; intent?: { beforeSend(i: { amount: bigint; to: string; createdAtNs?: bigint; memo?: string }): boolean } },
    ): Promise<bigint>
    removeDepositFromCache(block: string, token: string): void
    setDepositStatus(block: string, status: 'open' | 'settled', token: string): void
    swapMultiHop(tokenIn: string, tokenOut: string, amountIn: bigint, route: TacoRouteLeg['route'], minOut: bigint, block: bigint): Promise<any>
    swapSplitRoutes(tokenIn: string, tokenOut: string, splits: Array<TacoRouteLeg & { minLegOut: bigint }>, minOut: bigint, block: bigint): Promise<any>
    swapMultiHopV2(tokenIn: string, tokenOut: string, gross: bigint, route: TacoRouteLeg['route'], minOut: bigint): Promise<any>
    swapSplitRoutesV2(tokenIn: string, tokenOut: string, splits: Array<TacoRouteLeg & { minLegOut: bigint }>, minOut: bigint): Promise<any>
    recoverWronglysent(token: string, block: bigint, assetType: AssetType): Promise<boolean>
    probeSwapLanded(tokenIn: string, tokenOut: string, amountIn: bigint, submittedAtMs: number, limit: bigint): Promise<VerifyStatus>
    refreshAfterMutation(kind: 'swap'): void
  }
  clock: Clock
}

export interface IcpTrack {
  step?: 'approve' | 'deposit' | 'swap' | 'withdraw'
  hadMarker?: boolean
  markerWritten?: boolean
  swappedOut?: bigint
  /** The pool answered the swap with an error: nothing sold. */
  swapRefused?: boolean
}

export interface SweepReport {
  found: Array<{ token: string; amount: bigint }>
  moved: Array<{ token: string; amount: bigint }>
  /** Passes that read every balance and found nothing (a pass that threw does not count). */
  emptyLooks?: number
}

// ── Helpers ──
const errText = (err: any, fallback: string): string => {
  const m = err?.message
  return typeof m === 'string' && m ? m : fallback
}

export function defaultMinOut(expectedOut: bigint, slip: number): bigint {
  return BigInt(Math.floor(Number(expectedOut) * (1 - slip)))
}

/** Gross split shares summing to grossTotal, proportional to the net legs
 *  (floor, remainder to leg 0): the backend nets the sum once and re-apportions
 *  with the same rule. */
export function grossLegs(netLegs: ReadonlyArray<{ amountIn: bigint }>, netTotal: bigint, grossTotal: bigint): bigint[] {
  const g = netLegs.map(l => (l.amountIn * grossTotal) / netTotal)
  const assigned = g.reduce((a, b) => a + b, 0n)
  if (grossTotal > assigned) g[0] += grossTotal - assigned
  return g
}

/** Probe for a landed TACO swap after an ambiguous throw: up to 3 looks 1.5 s apart. */
async function probeLanded(deps: LegDeps, ctx: LegCtx, amountIn: bigint, submittedAtMs: number): Promise<VerifyStatus> {
  for (let i = 0; i < 3; i++) {
    try {
      const s = await deps.taco.probeSwapLanded(ctx.sell.address, ctx.buy.address, amountIn, submittedAtMs, ctx.probeLimit)
      if (s !== 'unknown') return s
    } catch { /* probe threw; retry */ }
    if (i < 2) await deps.clock.sleep(1500)
  }
  return 'unknown'
}

// ── The leg ──
export async function runCrossDexLeg(leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps): Promise<LegOutcome> {
  let out: LegOutcome
  try {
    const minOut = ctx.minOut ?? defaultMinOut(leg.expectedOut, ctx.slip)
    out = leg.dex === 'icpswap' ? await runIcpswap(leg, ctx, deps, minOut)
      : leg.dex === 'neutrinite' ? await runNeutrinite(leg, ctx, deps, minOut)
      : await runTaco(leg, ctx, deps, minOut)
  } catch (err: any) {
    // Never reached by design (every branch catches); keep the contract anyway.
    ctx.log?.('[CrossDEX] leg runner bug:', err)
    out = { dex: leg.dex, success: false, amountOut: 0n, state: 'needsRecovery', error: errText(err, 'Route failed'), recovered: false }
  }
  try { ctx.journal.final(out) } catch { /* best effort */ }
  return out
}

// ICPSwap: approve, gate, marker, depositFrom, swap, withdraw.
async function runIcpswap(leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps, minOut: bigint): Promise<LegOutcome> {
  const sell = ctx.sell.address, buy = ctx.buy.address
  const track: IcpTrack = {}
  let journalRefused = false
  try {
    const r = await deps.icpswap.icrc2Swap({
      sellTokenPrincipal: sell,
      buyTokenPrincipal: buy,
      amountIn: leg.amountIn,
      minAmountOut: minOut,
      onStep: ctx.onStep,
      beforeDeposit: async () => {
        if (ctx.gate && !(await ctx.gate.wait(() => ctx.onStep(ctx.gateWaitText ?? NEU_WAIT_STEP)))) return false
        if (!ctx.journal.beforeMove('depositFrom') && ctx.strictJournal) { journalRefused = true; return false }
        return true
      },
      requireMarker: ctx.strictJournal,
      track,
    })
    ctx.onStep('Done')
    return { dex: 'icpswap', success: true, amountOut: r.amountOut, state: 'done' }
  } catch (err: any) {
    if (err?.notStarted) {
      // Released too late, or the recovery note could not be saved: only the
      // approve ran, no funds moved, nothing to sweep.
      const journal = journalRefused || !!err?.journal
      ctx.onStep(NOT_STARTED)
      return { dex: 'icpswap', success: false, amountOut: 0n, state: 'notSent', reason: journal ? 'journal' : 'gateLate',
        error: NOT_STARTED, notStarted: true }
    }
    if (track.step == null || track.step === 'approve') {
      // Failed before the deposit (the pool lookup, the fee read, the approve itself, or the
      // check before the deposit): no marker was written and no depositFrom sent, so nothing
      // moved but at most the approve fee, and there is nothing to sweep. An approval that
      // did land expires on its own.
      ctx.log?.('[CrossDEX] ICPSwap leg stopped before the deposit:', err?.message || err)
      ctx.onStep(NOT_STARTED)
      return { dex: 'icpswap', success: false, amountOut: 0n, state: 'notSent', reason: journalRefused || err?.journal ? 'journal' : undefined,
        error: errText(err, 'ICPSwap approval failed'), notStarted: true }
    }
    if (err?.depositRefused) {
      // The pool refused the deposit, so normally nothing moved. One sweep
      // makes sure; when it finds nothing, this route never started.
      const report: SweepReport = { found: [], moved: [] }
      let swept = false, sweepThrew = false
      try { swept = await deps.icpswap.sweep({ token0Principal: sell, token1Principal: buy }, { report }) }
      catch { sweepThrew = true }
      if (!sweepThrew && report.found.length === 0) {
        if (!track.hadMarker) deps.icpswap.removePendingSwap(sell, buy)
        ctx.onStep(NOT_STARTED)
        return { dex: 'icpswap', success: false, amountOut: 0n, state: 'notSent',
          error: errText(err, 'ICPSwap refused the deposit'), notStarted: true }
      }
      if (swept) deps.icpswap.removePendingSwap(sell, buy)
      ctx.onStep(swept ? 'Failed, funds recovered' : 'Failed, recover on the Recover page')
      return swept
        ? { dex: 'icpswap', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error: errText(err, 'ICPSwap swap failed'), recovered: true }
        : { dex: 'icpswap', success: false, amountOut: 0n, state: 'needsRecovery', error: errText(err, 'ICPSwap swap failed'), recovered: false }
    }
    ctx.log?.('[CrossDEX] ICPSwap leg failed:', err?.message || err)
    ctx.onStep('Recovering funds…')
    // Automatic recovery: sweep with retries (a lost-response depositFrom
    // credits the pool a few seconds later, so the first look often races
    // it). Only a sweep that actually moved funds clears the marker;
    // otherwise the Recover page row stays visible.
    let recovered = false
    const report: SweepReport = { found: [], moved: [] }
    try {
      recovered = await deps.icpswap.sweepWithRetry({ token0Principal: sell, token1Principal: buy }, 3, 4000, { report })
      if (recovered) deps.icpswap.removePendingSwap(sell, buy)
    } catch { /* marker stays so the Recover page can sweep later */ }
    const error = errText(err, 'ICPSwap swap failed')
    if (!recovered && track.step === 'withdraw' && track.swappedOut != null && report.found.length === 0 && (report.emptyLooks ?? 0) > 0) {
      // The withdraw ran but its answer was lost: the swap's output already left the pool for
      // the wallet (a full look finds nothing there). Sold, for an amount the wallet shows.
      if (!track.hadMarker) deps.icpswap.removePendingSwap(sell, buy)
      ctx.onStep('Done')
      return { dex: 'icpswap', success: true, amountOut: 0n, state: 'doneUnknown', reason: 'afterSwap' }
    }
    if (ctx.sortV1Errors && recovered) {
      // What came back decides whether the swap sold: never when the pool answered the swap
      // with an error or the swap never ran, and never when at least this leg's deposit of the
      // sold token came back. ICP an earlier failed swap left in the same pool can come back
      // with it, so it alone proves nothing.
      const soldBack = report.moved.filter(m => m.token === sell).reduce((a, m) => a + m.amount, 0n)
      const gotOut = report.moved.filter(m => m.token === buy).reduce((a, m) => a + m.amount, 0n)
      const sold = !track.swapRefused && (track.step === 'swap' || track.step === 'withdraw') && soldBack < leg.amountIn && gotOut > 0n
      if (sold) {
        ctx.onStep('Done')
        if (track.swappedOut != null) {
          return { dex: 'icpswap', success: true, amountOut: track.swappedOut < gotOut ? track.swappedOut : gotOut, state: 'done', reason: 'afterSwap' }
        }
        // the swap's answer was lost: with an earlier swap's marker on this pair, old ICP may be
        // mixed in, so the amount is the wallet's to show
        return track.hadMarker
          ? { dex: 'icpswap', success: true, amountOut: 0n, state: 'doneUnknown', reason: 'afterSwap' }
          : { dex: 'icpswap', success: true, amountOut: gotOut, state: 'done', reason: 'afterSwap' }
      }
    }
    ctx.onStep(recovered ? 'Failed, funds recovered' : 'Failed, recover on the Recover page')
    return recovered
      ? { dex: 'icpswap', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error, recovered: true }
      : { dex: 'icpswap', success: false, amountOut: 0n, state: 'needsRecovery', error, recovered: false,
          failedAfterSwap: track.swappedOut != null }
  }
}

// Neutrinite: deposit, credit poll, dex_swap, withdraw; opens the gate on credit or failure.
async function runNeutrinite(leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps, minOut: bigint): Promise<LegOutcome> {
  const sell = ctx.sell.address, buy = ctx.buy.address
  const gate = ctx.gate
  const track: { before?: { sell: bigint; buy: bigint }; swappedOut?: bigint; hadMarker?: boolean } = {}
  let journalRefused = false
  try {
    const r = await deps.neutrinite.executeSwap({
      sell,
      buy,
      amountIn: leg.amountIn,
      minAmountOut: minOut,
      onStep: ctx.onStep,
      canDeposit: gate && (() => !gate.isOpen()),
      beforeTransfer: () => {
        if (!ctx.journal.beforeMove('neuTransfer') && ctx.strictJournal) { journalRefused = true; return false }
        return true
      },
      requireMarker: ctx.strictJournal,
      onCredited: gate && (() => gate.open('credit')),
      track,
    })
    ctx.onStep('Done')
    return { dex: 'neutrinite', success: true, amountOut: r.amountOut, state: 'done' }
  } catch (err: any) {
    gate?.open('neutrinite failed')
    ctx.log?.('[CrossDEX] Neutrinite leg failed:', err?.message || err)
    const error = errText(err, 'Neutrinite swap failed')
    if (!track.before) {
      // Failed before the deposit, or the transfer was refused: nothing to sweep.
      ctx.onStep('Failed, nothing left your wallet')
      return { dex: 'neutrinite', success: false, amountOut: 0n, state: 'notSent',
        reason: journalRefused || err?.journal ? 'journal' : undefined, error, notStarted: true }
    }
    ctx.onStep('Recovering funds…')
    // Sweep only what this swap added on the pylon, retried because a deposit
    // can credit a few seconds after we gave up. Clear the marker only once
    // that amount came back, and never one an earlier failed swap on this
    // pair left (its funds are still there); otherwise the Recover page keeps it.
    let recovered = false
    let emptyLooks = 0
    const report: SweepReport = { found: [], moved: [] }
    for (let i = 0; i < 3 && !recovered; i++) {
      if (i > 0) await deps.clock.sleep(5000)
      try {
        recovered = await deps.neutrinite.sweep(sell, buy, track.before, { report })
        // a sweep throws when the pylon read or a withdraw fails, so a plain false is a real look
        // that found nothing above the start balances
        if (!recovered) emptyLooks++
      } catch (e) { ctx.log?.(`[CrossDEX] Neutrinite sweep attempt ${i + 1} failed:`, e) }
    }
    // The start balances are the baseline of every look. Only when the pylon held no more than dust
    // of either token as this swap started does nothing above them mean nothing there at all: with an
    // older balance in the baseline, another swap or sweep of this wallet moving that balance meanwhile
    // can make this swap's ICP look gone while it is still on the pylon.
    const startClean = !!track.before && track.before.sell <= ctx.fee && track.before.buy <= ctx.buy.transfer_fee
    if (!recovered && emptyLooks > 0 && startClean && track.swappedOut != null && report.found.length === 0) {
      // The swap filled, the pylon held nothing of the pair before it, and a clean look finds nothing
      // there now: the withdraw went through and only its answer was lost. Sold, for an amount the
      // wallet shows. Every other uncertain case keeps reading needsRecovery with its marker.
      if (!track.hadMarker) deps.neutrinite.removePendingSwap(sell, buy)
      ctx.onStep('Done')
      return { dex: 'neutrinite', success: true, amountOut: 0n, state: 'doneUnknown', reason: 'afterSwap' }
    }
    if (recovered && !track.hadMarker) deps.neutrinite.removePendingSwap(sell, buy)
    const gotOut = report.moved.filter(m => m.token === buy).reduce((a, m) => a + m.amount, 0n)
    if (recovered && (track.swappedOut != null || (ctx.sortV1Errors && gotOut > 0n))) {
      // The swap filled and the retry delivered its output.
      ctx.onStep('Done')
      return { dex: 'neutrinite', success: true, amountOut: ctx.sortV1Errors && gotOut > 0n ? gotOut : track.swappedOut!, state: 'done', reason: 'afterSwap' }
    }
    ctx.onStep(recovered ? 'Failed, funds recovered' : 'Failed, recover on the Recover page')
    return recovered
      ? { dex: 'neutrinite', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error, recovered: true }
      : { dex: 'neutrinite', success: false, amountOut: 0n, state: 'needsRecovery', error, recovered: false,
          failedAfterSwap: track.swappedOut != null }
  }
}

/** The exchange refused one of this run's calls less than a call window ago. */
export const REFUSED_WINDOW_MS = 95_000
function refusedRecently(ctx: LegCtx, deps: LegDeps): boolean {
  const at = ctx.exchangeRefused?.at
  return at != null && deps.clock.now() - at < REFUSED_WINDOW_MS
}
function markRefused(ctx: LegCtx, deps: LegDeps) {
  if (ctx.exchangeRefused && ctx.exchangeRefused.at == null) ctx.exchangeRefused.at = deps.clock.now()
}
const BUSY_NOT_SENT = 'TACO exchange: not sent because it was busy for your wallet. This part stayed in your wallet.'

// TACO: gate, turn (second in line), deposit (V1) or nothing (V2, approved before
// the sale), swap call.
async function runTaco(leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps, minOutIn: bigint): Promise<LegOutcome> {
  const sell = ctx.sell
  let minOut = minOutIn
  if (ctx.gate && !(await ctx.gate.wait(() => ctx.onStep(ctx.gateWaitText ?? NEU_WAIT_STEP)))) {
    ctx.onStep(NOT_STARTED)
    return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'gateLate', error: NOT_STARTED, notStarted: true }
  }
  if (ctx.turn) {
    // Second in line: its pools are shared with tokens whose TACO parts go first.
    // Nothing moves until they are final and an exact requote is close to the plan.
    ctx.onStep(ctx.turnWaitText ?? 'Waiting for its turn…')
    const t = await ctx.turn.wait()
    if (t === 'late') {
      ctx.onStep('Not sent, the shared pools took too long')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'secondLate', notStarted: true,
        error: 'TACO: not sent because the other tokens took too long on the same pools.' }
    }
    let fresh: bigint | null = null
    try { fresh = await ctx.turn.recheck() } catch { fresh = null }
    if (fresh == null) {
      ctx.onStep('Not sent, the price could not be checked')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'secondCheck', notStarted: true,
        error: 'TACO: this part could not be checked before its turn.' }
    }
    // send when fresh >= planned × (1 − s/2)
    const SCALE = 1_000_000n
    const s = BigInt(Math.round(ctx.slip * 1_000_000))
    if (fresh * 2n * SCALE < ctx.turn.plannedOut * (2n * SCALE - s)) {
      ctx.onStep('Not sent, the price moved')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'secondMoved', notStarted: true,
        error: 'TACO: the price moved before its turn.' }
    }
    const floorFresh = (fresh * (SCALE - s)) / SCALE
    minOut = ctx.turn.plannedMin > floorFresh ? ctx.turn.plannedMin : floorFresh
  }
  const outCtx = { outDecimals: Number(ctx.buy.decimals), outSymbol: ctx.buy.symbol }
  let block: bigint | undefined
  let submitted = false
  let submittedAt = 0
  let deposit: 'notSent' | 'unknown' | 'untagged' | null = null
  const pointer = (status: 'used' | 'recovered') => {
    if (block == null) return
    deps.taco.removeDepositFromCache(block.toString(), sell.address)
    ctx.journal.deposit(status)
  }
  const settled = () => {
    if (block == null) return
    deps.taco.setDepositStatus(block.toString(), 'settled', sell.address)
    ctx.journal.deposit('settled')
  }
  if (refusedRecently(ctx, deps)) {
    // another part of this sale was refused by the exchange's call limit moments ago: a deposit
    // and a swap now would only draw a second refusal
    ctx.onStep('Not sent, TACO is busy for your wallet')
    return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'rateLimited', notStarted: true, error: BUSY_NOT_SENT }
  }
  try {
    // Gross = exactly what the V1 path transfers.
    const grossTotal = ctx.v2Gross ?? requiredDeposit(leg.amountIn, ctx.tradingFeeBps, ctx.fee)
    if (!ctx.v2) {
      ctx.onStep('Depositing…')
      const t = deps.taco.treasury()
      try {
        block = await deps.taco.depositToken(sell.address, sell.asset_type as AssetType, leg.amountIn, ctx.tradingFeeBps, ctx.fee,
          t.accountId, t.principal, {
            dedup: ctx.dedup,
            runId: ctx.runId,
            intent: { beforeSend: (i) => ctx.journal.intent(i) || !ctx.strictJournal },
          })
      } catch (e: any) {
        deposit = e?.deposit === 'notSent' ? 'notSent' : e?.deposit === 'unknown' ? 'unknown' : 'untagged'
        throw e
      }
      ctx.journal.block(block)
      ctx.journal.deposit('open')
    } else if (!ctx.journal.beforeMove('v2Swap') && ctx.strictJournal) {
      ctx.onStep('Failed, no funds moved')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'journal',
        error: 'The recovery note could not be saved, so this part was not sent.', notStarted: true }
    }
    if (refusedRecently(ctx, deps)) {
      // refused elsewhere in the sale while this deposit went out: no swap call in this window
      if (!ctx.v2 && block != null) {
        ctx.onStep('Waiting for the exchange call limit to refund it')
        return deferredOutcome(sell, block, 'TACO takes only a few trades per wallet every 90 seconds. The refund starts after the window.')
      }
      ctx.onStep('Not sent, TACO is busy for your wallet')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'rateLimited', notStarted: true, error: BUSY_NOT_SENT }
    }
    ctx.onStep('Swapping…')
    const tacoLegs = leg.tacoLegs ?? []
    let raw: any
    submitted = true
    submittedAt = deps.clock.now()
    if (tacoLegs.length > 1) {
      if (ctx.v2) {
        const g = grossLegs(tacoLegs, leg.amountIn, grossTotal)
        const splits = tacoLegs.map((l, i) => ({ amountIn: g[i], route: l.route, minLegOut: 0n }))
        raw = await deps.taco.swapSplitRoutesV2(sell.address, ctx.buy.address, splits, minOut)
      } else {
        const splits = tacoLegs.map(l => ({ amountIn: l.amountIn, route: l.route, minLegOut: 0n }))
        raw = await deps.taco.swapSplitRoutes(sell.address, ctx.buy.address, splits, minOut, block!)
      }
    } else {
      const route = tacoLegs[0]?.route ?? [{ tokenIn: sell.address, tokenOut: ctx.buy.address }]
      raw = ctx.v2
        ? await deps.taco.swapMultiHopV2(sell.address, ctx.buy.address, grossTotal, route, minOut)
        : await deps.taco.swapMultiHop(sell.address, ctx.buy.address, leg.amountIn, route, minOut, block!)
    }
    if ('Ok' in raw) {
      pointer('used')
      ctx.onStep('Done')
      return { dex: 'taco', success: true, amountOut: raw.Ok.amountOut, state: 'done', block }
    }
    if (ctx.v2) {
      // V2 typed errors leave nothing stranded in the treasury, so the V1
      // recover-by-block path below does not apply. Settle by class.
      const classified = classifyExchangeError(raw.Err, { ...outCtx, v2Settled: true })
      const e = raw.Err as any
      if ('SlippageExceeded' in e) {
        // Settled on chain: the below-minimum output was delivered, or the net refunded.
        deps.taco.refreshAfterMutation('swap')
        if (ctx.sortV1Errors) {
          const landed = await probeLanded(deps, ctx, leg.amountIn, submittedAt)
          if (landed === 'succeeded') {
            ctx.onStep('Done, below your minimum price')
            return { dex: 'taco', success: true, amountOut: BigInt(e.SlippageExceeded.got ?? 0n), state: 'belowMin', reason: 'slippage', error: classified.message }
          }
        }
        ctx.onStep('Failed, output delivered below minimum')
        return { dex: 'taco', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'exchange', reason: 'slippage',
          error: classified.message, recovered: false, notStarted: false }
      }
      if ('SystemError' in e) {
        deps.taco.refreshAfterMutation('swap')
        ctx.onStep('Failed, deposit tracked on the Recover page')
        return { dex: 'taco', success: false, amountOut: 0n, state: 'tracked', error: classified.message, recovered: false, notStarted: false }
      }
      // Only errors returned before the pull leave the wallet untouched. After
      // it, RouteFailed, 'Funds not received' and the pull race can move funds.
      const prePull = 'NotAuthorized' in e
        || ('InvalidInput' in e && !String(e.InvalidInput).includes('already claimed by a concurrent'))
        || ('InsufficientFunds' in e && String(e.InsufficientFunds).startsWith('V2 pull declined'))
      if (prePull) {
        if ('NotAuthorized' in e) markRefused(ctx, deps)
        ctx.onStep('Failed, no funds moved')
        return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: 'NotAuthorized' in e ? 'rateLimited' : undefined,
          error: classified.message, recovered: false, notStarted: true }
      }
      deps.taco.refreshAfterMutation('swap')
      ctx.onStep('Failed, check your wallet and the Recover page')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'needsRecovery', error: classified.message, recovered: false, notStarted: false }
    }
    if (ctx.sortV1Errors) return await sortedV1Answer(raw.Err, leg, ctx, deps, block!, submittedAt, pointer, settled)
    throw new Error(classifyExchangeError(raw.Err, outCtx).message)
  } catch (err: any) {
    ctx.log?.('[CrossDEX] TACO leg failed:', err?.message || err)
    if (deposit === 'notSent') {
      // The ledger refused the transfer, or it never left (checked before sending).
      ctx.onStep('Failed, no funds moved')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', reason: err?.reason === 'journal' ? 'journal' : undefined,
        error: errText(err, 'TACO deposit failed'), recovered: false, notStarted: true }
    }
    if (deposit === 'unknown') {
      // The transfer's answer was lost: it may have landed. Its intent stays
      // listed on the Recover page until a block is entered or it is dismissed.
      ctx.onStep('Failed, the deposit may have been sent')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'needsRecovery', reason: 'maySent',
        error: 'The deposit may have been sent, but its answer did not come back. It is listed on the Recover page.', recovered: false }
    }
    // Was the swap call sent at all? Errors the store throws before sending carry beforeSend.
    const sent = submitted && !err?.beforeSend
    // Transport hiccup: the swap may actually have landed. Verify before refunding.
    if (sent && (isTransportError(err) || ctx.sortV1Errors)) {
      const status = await probeLanded(deps, ctx, leg.amountIn, submittedAt)
      if (status === 'succeeded') {
        // The pointer stays: a probe match is not proof the deposit was used.
        ctx.onStep('Done')
        return { dex: 'taco', success: true, amountOut: 0n, state: 'doneUnknown', block }
      }
    }
    if (ctx.v2) {
      // No block to recover. Before submit nothing left the wallet; after an
      // ambiguous submit the user must check history before retrying.
      ctx.onStep(sent ? 'Failed, check your history and the Recover page' : 'Failed, no funds moved')
      return sent
        ? { dex: 'taco', success: false, amountOut: 0n, state: 'tracked', error: errText(err, 'TACO swap failed'), recovered: false, notStarted: false }
        : { dex: 'taco', success: false, amountOut: 0n, state: 'notSent', error: errText(err, 'TACO swap failed'), recovered: false, notStarted: true }
    }
    if (ctx.sortV1Errors && block != null && !sent) {
      // The swap call never left this tab (the client limiter or actor creation):
      // the deposit is untouched. A rate limit waits for the window, a dead
      // session cannot recover now, anything else tries once.
      const msg = errText(err, '')
      if (/Rate limit/i.test(msg)) {
        ctx.onStep('Waiting for the exchange call limit to refund it')
        return deferredOutcome(sell, block, 'TACO takes only a few trades per wallet every 90 seconds. The refund starts after the window.')
      }
      if (/Session expired|Not authenticated/i.test(msg)) {
        ctx.onStep('Failed, your session expired')
        return { dex: 'taco', success: false, amountOut: 0n, state: 'needsRecovery', reason: 'session', error: msg, recovered: false, block }
      }
    }
    // Recover the unspent deposit so funds are never stuck in the treasury.
    return await recoverOnce(leg, ctx, deps, block, errText(err, 'TACO swap failed'), pointer)
  }
}

function deferredOutcome(sell: TokenInfo, block: bigint, error: string): LegOutcome {
  return { dex: 'taco', success: false, amountOut: 0n, state: 'deferred', reason: 'rateLimited', error, recovered: false, block,
    deferred: { token: sell.address, block, assetType: sell.asset_type as AssetType } }
}

/** One recoverWronglysent (the single swap after any V1 failure, Sell many where 5.9 says so).
 *  A client limiter refusal hands the deposit to the deferred pass (Sell many). */
async function recoverOnce(
  leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps, block: bigint | undefined, error: string,
  pointer: (s: 'used' | 'recovered') => void,
): Promise<LegOutcome> {
  const sell = ctx.sell
  if (ctx.sortV1Errors && block != null && refusedRecently(ctx, deps)) {
    // a refusal elsewhere in this sale: one batch refund after the window, not a call now
    ctx.onStep('Waiting for the exchange call limit to refund it')
    return deferredOutcome(sell, block, 'TACO takes only a few trades per wallet every 90 seconds. The refund starts after the window.')
  }
  ctx.onStep('Recovering funds…')
  let recovered = false
  if (block != null) {
    try { recovered = !!(await deps.taco.recoverWronglysent(sell.address, block, sell.asset_type as AssetType)) }
    catch (e: any) {
      if (ctx.sortV1Errors && e?.beforeSend && /Rate limit/i.test(errText(e, ''))) {
        ctx.onStep('Waiting for the exchange call limit to refund it')
        return deferredOutcome(sell, block, 'TACO takes only a few trades per wallet every 90 seconds. The refund starts after the window.')
      }
      /* best-effort; the deposit stays listed on the Recover page */
    }
    if (recovered) pointer('recovered')
  }
  ctx.onStep(recovered ? 'Failed, funds recovered' : 'Failed')
  if (recovered) return { dex: 'taco', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error, recovered: true, block }
  // Not confirmed: the deposit (if any) stays listed on the Recover page.
  return { dex: 'taco', success: false, amountOut: 0n, state: 'needsRecovery',
    reason: block != null ? 'unconfirmed' : undefined, error, recovered: false, block }
}

/** 5.9: TACO V1 answers in Sell many, under the one pointer rule. */
async function sortedV1Answer(
  e: any, leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps, block: bigint, submittedAt: number,
  pointer: (s: 'used' | 'recovered') => void, settled: () => void,
): Promise<LegOutcome> {
  const outCtx = { outDecimals: Number(ctx.buy.decimals), outSymbol: ctx.buy.symbol }
  const message = classifyExchangeError(e, outCtx).message
  const sys = typeof e?.SystemError === 'string' ? e.SystemError as string : null
  const refundedByExchange = (why: string): LegOutcome => {
    settled()
    deps.taco.refreshAfterMutation('swap')
    ctx.onStep('Refunded by TACO')
    return { dex: 'taco', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'exchange', reason: why, error: message, recovered: true, block }
  }
  if ('NotAuthorized' in e) {
    // Refused before the block was read (the exchange's call limit): the deposit
    // is untouched and is refunded in one batch after the window.
    markRefused(ctx, deps)
    ctx.onStep('Waiting for the exchange call limit to refund it')
    return deferredOutcome(ctx.sell, block, 'TACO takes only a few trades per wallet every 90 seconds. The refund starts after the window.')
  }
  if ('SlippageExceeded' in e) {
    // Settled: refunded by the pre check, or the below minimum output was delivered.
    const landed = await probeLanded(deps, ctx, leg.amountIn, submittedAt)
    settled()
    deps.taco.refreshAfterMutation('swap')
    if (landed === 'succeeded') {
      ctx.onStep('Done, below your minimum price')
      return { dex: 'taco', success: true, amountOut: BigInt(e.SlippageExceeded.got ?? 0n), state: 'belowMin', reason: 'slippage', error: message, block }
    }
    ctx.onStep('Refunded by TACO')
    return { dex: 'taco', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'exchange', reason: 'slippage', error: message, recovered: true, block }
  }
  if ('RouteFailed' in e) {
    // Past the first hop the exchange sends what it had swapped so far (the hop's input token),
    // not the sold token; on a single route that token is known.
    const hop = Number(e.RouteFailed?.hop ?? 0)
    if (hop > 0) {
      const routes = leg.tacoLegs ?? []
      const mid = routes.length === 1 ? routes[0].route?.[hop]?.tokenIn : undefined
      return refundedByExchange(mid ? `routeHop:${mid}` : 'routeHop')
    }
    return refundedByExchange('route')
  }
  if (sys != null) {
    if (/reverted/i.test(sys) && /refunded/i.test(sys)) return refundedByExchange('reverted')
    if (/already refunded/i.test(sys)) return refundedByExchange('admin refunded')
    if (/outcome unknown/i.test(sys)) {
      ctx.onStep('Needs an admin')
      return { dex: 'taco', success: false, amountOut: 0n, state: 'needsRecovery', reason: 'admin', error: message, recovered: false, block }
    }
    // "Failed to get block data" (untouched) and any other system error: one recovery now.
  }
  // Funds not received, InvalidInput, Failed to get block data, anything else: one recovery now.
  return recoverOnce(leg, ctx, deps, block, message, pointer)
}

// ── The single swap: every leg at once, with the gate for Neutrinite first splits ──
export interface SwapRun {
  /** Every leg final, or slow at the backstop (the UI result). */
  ui: Promise<LegOutcome[]>
  /** Every leg promise settled (locks and guards wait for this). */
  all: Promise<LegOutcome[]>
}

export function runCrossDexSwap(
  legs: CrossDexLeg[],
  makeCtx: (leg: CrossDexLeg, gate: NeuGate | undefined) => LegCtx,
  deps: LegDeps,
  opts: { backstopMs?: number; log?: (msg: string) => void } = {},
): SwapRun {
  const gate = isNeuFirst(legs) ? makeNeuGate(deps.clock, { log: opts.log }) : undefined
  const raw = legs.map(leg => runCrossDexLeg(leg, makeCtx(leg, gate), deps))
  const backstop = opts.backstopMs ?? LEG_BACKSTOP_MS
  const ui = Promise.all(raw.map((p, i) => clockTimeout(deps.clock, p, backstop, `crossdex-leg-${legs[i].dex}`)
    .catch((): LegOutcome => ({ dex: legs[i].dex, success: false, amountOut: 0n, state: 'slow', reason: 'timeout', error: SLOW_LEG_ERROR }))))
  return { ui, all: Promise.all(raw) }
}
