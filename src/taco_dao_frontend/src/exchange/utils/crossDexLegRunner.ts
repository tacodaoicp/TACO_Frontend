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
  | 'secondLate' | 'secondMoved' | 'secondCheck' | 'gateLate' | 'journal' | 'session' | 'slippage' | 'timeout' | 'neuHeld'
  | 'icpHeld' | 'neuMismatch' | string

/** A part not sent because the DEX may still hold funds of an earlier swap of the wallet (the Recover page). */
export const isHeldReason = (r: unknown) => r === 'neuHeld' || r === 'icpHeld'
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
  /** With failedAfterSwap: some or all of the output may already be in the wallet. The withdraw's
   *  answer was lost and no look found the output, a look found it and then lost its own answer, or
   *  a look brought back only part of it. The total leaves it out; the text says to check the wallet
   *  before the Recover page. */
  outMaybeSent?: boolean
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
      stopIfPending?: boolean
      maxUnusedBefore?: { sell: bigint; buy: bigint }
      track?: IcpTrack
    }): Promise<{ amountOut: bigint }>
    sweep(p: { token0Principal: string; token1Principal: string }, opts?: { report?: SweepReport }): Promise<boolean>
    sweepWithRetry(p: { token0Principal: string; token1Principal: string }, attempts?: number, delayMs?: number, opts?: { report?: SweepReport }): Promise<boolean>
    /** The wallet's withdraw records in the pool of the pair (token and status per record), null when
     *  the pool cannot be read. */
    withdrawRecords?(p: { token0Principal: string; token1Principal: string }): Promise<Array<{ token: string; status: string }> | null>
    /** With `at`, only the pair marker dated `at` (the one this route wrote). */
    removePendingSwap(sell: string, buy: string, at?: number): void
  }
  neutrinite: {
    executeSwap(p: {
      sell: string; buy: string; amountIn: bigint; minAmountOut: bigint
      onStep?: (s: string) => void; canDeposit?: () => boolean; beforeTransfer?: () => boolean; requireMarker?: boolean
      onCredited?: () => boolean
      maxSellBefore?: bigint
      stopIfPending?: boolean
      creditFee?: bigint
      track?: NeuTrack
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
  /** The pool answered the withdraw with an error (unset when its answer was lost). */
  withdrawRefused?: boolean
  /** The withdraw call was sent (set right before it): from here the output may have left the pool. */
  withdrawSent?: boolean
  /** The timestamp of the pair marker this route wrote (it removes only that one). */
  markerAt?: number
}

export interface NeuTrack {
  /** The pylon balances of the pair as the swap started: the baseline of every recovery look. */
  before?: { sell: bigint; buy: bigint }
  /** What the credit poll saw credited for this deposit (it matched the deposit). */
  credited?: bigint
  swappedOut?: bigint
  hadMarker?: boolean
  /** dex_swap was sent: from here the swap may have run even when its answer is lost. */
  swapSent?: boolean
  /** dex_swap answered with an error: it did not run. */
  swapRefused?: boolean
  /** The withdraw answered with a refusal (unset when its answer was lost, so it may have run). */
  withdrawRefused?: boolean
}

export interface SweepReport {
  /** ICPSwap tags a pool subaccount balance (`sub`: the balance read finds it again once deposited) and a
   *  balance whose withdraw answered with an error (`refused`). */
  found: Array<{ token: string; amount: bigint; sub?: boolean; refused?: boolean }>
  moved: Array<{ token: string; amount: bigint }>
  /** Passes that read every balance and found nothing (a pass that threw does not count). */
  emptyLooks?: number
  /** sweepWithRetry: what the last pass threw (unset when the last pass did not throw). */
  lastError?: unknown
}

// ── Helpers ──
const errText = (err: any, fallback: string): string => {
  const m = err?.message
  return typeof m === 'string' && m ? m : fallback
}

/** The wallet session ended: the store's own message, or the agent's words for an expired or
 *  invalid delegation (calls signed by a pinned run agent fail with those). */
export function isSessionError(err: unknown): boolean {
  if (err == null) return false
  const m = String((err as any)?.message ?? err)
  return /Session expired|Not authenticated|delegation has expired|Invalid delegation expiry|Invalid (basic )?signature/i.test(m)
}

/** The Neutrinite pylon nets one ledger fee from a deposit: an amount within one fee of the deposit
 *  minus that fee is the deposit's credit (read on the live pylon: its ledger fee for each ledger is
 *  the ledger's own fee, and every deposit leaves its deposit account as the deposit minus the fee). */
export function neuCreditMatches(amount: bigint, amountIn: bigint, fee: bigint): boolean {
  const expected = amountIn - fee
  const d = amount > expected ? amount - expected : expected - amount
  return amount > 0n && d <= fee
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

// ICPSwap: start check, approve, gate, marker, depositFrom, swap, withdraw.
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
      // The pool keeps one balance per wallet and token, and a recovery sweep moves all of it: funds of
      // an earlier swap of the wallet already in the pool, or one of this browser's that has not settled
      // (its marker is saved), could not be told from this part's. Either stops the part before its
      // approve, with its share in the wallet; the Recover page sends those funds back.
      stopIfPending: true,
      maxUnusedBefore: { sell: ctx.fee, buy: ctx.buy.transfer_fee },
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
      // Released too late, the recovery note could not be saved, or the pool still holds an earlier
      // swap's funds: at most the approve ran, no funds moved, nothing to sweep.
      const journal = journalRefused || !!err?.journal
      ctx.onStep(NOT_STARTED)
      if (!journal && err?.held) {
        return { dex: 'icpswap', success: false, amountOut: 0n, state: 'notSent', reason: 'icpHeld', error: errText(err, NOT_STARTED), notStarted: true }
      }
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
    const sum = (list: ReadonlyArray<{ token: string; amount: bigint }>, tok: string) => list.filter(m => m.token === tok).reduce((a, m) => a + m.amount, 0n)
    // The pool's records of the wallet's withdraws (read once): true when none of the pair is left
    // unfinished, false when one is, null when the pool could not be read.
    let recs: boolean | null | undefined
    const recordsClean = async (): Promise<boolean | null> => {
      if (recs === undefined) {
        try {
          const list = (await deps.icpswap.withdrawRecords?.({ token0Principal: sell, token1Principal: buy })) ?? null
          recs = list == null ? null : !list.some(r => r.status !== 'Completed' && (r.token === buy || r.token === sell))
        } catch { recs = null }
      }
      return recs
    }
    // Only the marker this route wrote goes (a marker another tab saved for the pair since then is dated
    // otherwise), and a marker an earlier swap of the pair had saved only when the pool's records show no
    // withdraw of the pair left unfinished (its funds may be stuck in the pool, which no balance shows).
    const dropMarker = async () => {
      if (track.markerAt == null) return
      if (!track.hadMarker || (await recordsClean()) === true) deps.icpswap.removePendingSwap(sell, buy, track.markerAt)
    }
    if (err?.depositRefused) {
      // The pool refused the deposit, so normally nothing moved. One sweep makes sure. It is this part's
      // refund only when at least its deposit came back: a look that found less of the sold token than the
      // deposit found another swap's balance of the wallet (sent to the wallet too), and this route never
      // started.
      const report: SweepReport = { found: [], moved: [] }
      let swept = false, sweepThrew = false, sweepErr: unknown = null
      try { swept = await deps.icpswap.sweep({ token0Principal: sell, token1Principal: buy }, { report }) }
      catch (e) { sweepThrew = true; sweepErr = e }
      if (!sweepThrew && !report.found.some(f => !f.sub && f.token === sell && f.amount >= leg.amountIn)) {
        await dropMarker()
        ctx.onStep(NOT_STARTED)
        return { dex: 'icpswap', success: false, amountOut: 0n, state: 'notSent',
          error: errText(err, 'ICPSwap refused the deposit'), notStarted: true }
      }
      const back = swept && sum(report.moved, sell) >= leg.amountIn
      if (back) await dropMarker()
      ctx.onStep(back ? 'Failed, funds recovered' : 'Failed, recover on the Recover page')
      return back
        ? { dex: 'icpswap', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error: errText(err, 'ICPSwap swap failed'), recovered: true }
        : { dex: 'icpswap', success: false, amountOut: 0n, state: 'needsRecovery', error: errText(err, 'ICPSwap swap failed'), recovered: false,
            reason: isSessionError(sweepErr) ? 'session' : undefined }
    }
    ctx.log?.('[CrossDEX] ICPSwap leg failed:', err?.message || err)
    ctx.onStep('Recovering funds…')
    // Automatic recovery: sweep with retries (a lost-response depositFrom credits the pool a few seconds
    // later, so the first look often races it). The marker goes only when this part's own funds came back;
    // otherwise the Recover page row stays visible.
    let swept = false
    const report: SweepReport = { found: [], moved: [] }
    try {
      swept = await deps.icpswap.sweepWithRetry({ token0Principal: sell, token1Principal: buy }, 3, 4000, { report })
    } catch (e) { report.lastError = e /* marker stays so the Recover page can sweep later */ }
    const error = errText(err, 'ICPSwap swap failed')
    const soldBack = sum(report.moved, sell), gotOut = sum(report.moved, buy)
    // what the looks found in the pool's balances (a subaccount balance is found again once deposited)
    const found = report.found.filter(f => !f.sub)
    const foundOut = found.some(f => f.token === buy)
    // The pool keeps one balance per wallet and token, and a sweep moves all of it: another swap of the
    // wallet in this pool during the part (another tab or device) can come back with this part's funds, or
    // in their place. What came back is this part's only when it covers them: the pool credits a deposit
    // in full (at least amountIn of the sold token), and once the swap answered, its output (at least
    // swappedOut of the bought token). The pool held no more than dust of the pair as the part started (its
    // start check), so the deposit itself is within one fee of amountIn: where the deposit's own arrival is
    // not sure (its answer was lost), only a balance of that size is it.
    const isDeposit = (a: bigint) => a >= leg.amountIn && a <= leg.amountIn + ctx.fee
    // A refused swap left the deposit in the pool for sure: whatever came back with it, it came back. With the
    // swap's answer lost, the swap may also have run after a look read the deposit (another swap's sold token
    // that comes back then is not this part's refund): only a withdraw of the deposit's own size is it.
    const depositBack = track.step === 'deposit' ? isDeposit(soldBack)
      : track.swapRefused ? soldBack >= leg.amountIn
      : report.moved.some(m => m.token === sell && isDeposit(m.amount))
    // A look that found the deposit in the pool means the swap had not run then, so ICP that comes back
    // later is not this part's sale (unless that look's withdraw of it was refused: the swap may have taken
    // the deposit between the look's read and its withdraw).
    const depositSeen = found.some(f => f.token === sell && isDeposit(f.amount) && !f.refused)
    const swapMayHaveRun = track.swappedOut != null || (track.step === 'swap' && !track.swapRefused && !depositSeen)
    const outBack = track.swappedOut != null && gotOut >= track.swappedOut
    let soldOwn = outBack || (swept && track.swappedOut == null && swapMayHaveRun && gotOut > 0n)
    // with the deposit's answer lost and an earlier swap's marker on the pair, a deposit's worth that came
    // back may be that swap's while this one lands later
    let refundedOwn = !swapMayHaveRun && depositBack && !(track.step === 'deposit' && !!track.hadMarker)
    // A withdraw that did not answer cleanly (this part's own, or one a look sent) can be stuck in the
    // pool: taken off the balance and never paid (CreditCompleted, the TACOV2:2134 class), which no balance
    // shows, while another balance comes back in its place. Then the part reads sold or refunded only when
    // the pool's records show no withdraw of the pair left unfinished; with the records unreadable, only
    // when exactly the swap's output (or a withdraw of exactly the deposit) came back.
    const unmoved = found.length > report.moved.length
    let stuckMaybe = false
    if ((soldOwn || refundedOwn) && ((track.swappedOut != null && !!track.withdrawSent) || unmoved)) {
      const clean = await recordsClean()
      const exactBack = soldOwn
        ? track.swappedOut != null && gotOut === track.swappedOut
        : report.moved.some(m => m.token === sell && isDeposit(m.amount))
      if (!(clean ?? exactBack)) {
        soldOwn = false; refundedOwn = false; stuckMaybe = true
      }
    }
    if (soldOwn) {
      // a balance a look found and could not move stays in the pool: so does the marker
      if (swept) await dropMarker()
      ctx.onStep('Done')
      // every withdraw pays its own ledger fee, and the total takes one off a part: output that came back in
      // more than one withdraw counts the extra fees off too (never more than the wallet got)
      const extraFees = BigInt(Math.max(0, report.moved.filter(m => m.token === buy).length - 1)) * ctx.buy.transfer_fee
      const net = (v: bigint) => (v > extraFees ? v - extraFees : 0n)
      if (track.swappedOut != null) return { dex: 'icpswap', success: true, amountOut: net(track.swappedOut), state: 'done', reason: 'afterSwap' }
      // The swap's answer was lost: another swap's ICP may have come back with this part's. Above the plan's
      // output (a quote net of the withdraw fee: a slippage band and two fees of headroom), or with an earlier
      // swap's marker on the pair, the amount is the wallet's to show.
      const cap = leg.expectedOut + leg.expectedOut / 200n + 2n * ctx.buy.transfer_fee
      return track.hadMarker || gotOut > cap
        ? { dex: 'icpswap', success: true, amountOut: 0n, state: 'doneUnknown', reason: 'afterSwap' }
        : { dex: 'icpswap', success: true, amountOut: net(gotOut), state: 'done', reason: 'afterSwap' }
    }
    if (refundedOwn) {
      if (swept) await dropMarker()
      ctx.onStep('Failed, funds recovered')
      return { dex: 'icpswap', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error, recovered: true }
    }
    // The withdraw was sent and its answer was lost (not refused), and no look brought the output back. A
    // pool can also take a withdraw off the balance and never pay it out (CreditCompleted, the TACOV2:2134
    // class), which reads the same from every balance: only the pool's own records, with no withdraw of the
    // pair left unfinished, show that the output left for the wallet. Sold, for an amount the wallet shows.
    // Otherwise the part keeps its marker (needsRecovery, the wallet first).
    if (!stuckMaybe && track.withdrawSent && track.swappedOut != null && !track.withdrawRefused
        && (swept || (!foundOut && (report.emptyLooks ?? 0) > 0)) && (await recordsClean()) === true) {
      await dropMarker()
      ctx.onStep('Done')
      return { dex: 'icpswap', success: true, amountOut: 0n, state: 'doneUnknown', reason: 'afterSwap' }
    }
    ctx.onStep('Failed, recover on the Recover page')
    // The output may already be in the wallet when the withdraw was sent and its answer was lost (not
    // refused) and no look found it, when a look found it and a later look found nothing (that look's own
    // withdraw lost its answer), when only part of it came back, or when ICP came back while a withdraw may
    // be stuck in the pool. With the swap's answer lost, ICP that came back may be this part's: the swap may
    // have run. A recovery that failed because the session ended says so: the sale asks to reconnect first.
    const icpBackUnsure = track.swappedOut == null && swapMayHaveRun && gotOut > 0n
    const outMaybeSent = icpBackUnsure || (track.swappedOut != null && (
      (foundOut && (report.emptyLooks ?? 0) > 0) || (gotOut > 0n && gotOut < track.swappedOut)
      || (!!track.withdrawSent && (stuckMaybe || (!track.withdrawRefused && !foundOut)))))
    return { dex: 'icpswap', success: false, amountOut: 0n, state: 'needsRecovery', error, recovered: false,
      failedAfterSwap: track.swappedOut != null || icpBackUnsure, outMaybeSent, reason: isSessionError(report.lastError) ? 'session' : undefined }
  }
}

// Neutrinite: deposit, credit poll, dex_swap, withdraw; opens the gate on credit or failure.
async function runNeutrinite(leg: CrossDexLeg, ctx: LegCtx, deps: LegDeps, minOut: bigint): Promise<LegOutcome> {
  const sell = ctx.sell.address, buy = ctx.buy.address
  const gate = ctx.gate
  const track: NeuTrack = {}
  let journalRefused = false
  try {
    const r = await deps.neutrinite.executeSwap({
      sell,
      buy,
      amountIn: leg.amountIn,
      minAmountOut: minOut,
      onStep: ctx.onStep,
      // the pylon already holding more than dust of the sold token for the wallet (an earlier swap's
      // leftover, or another swap's deposit) stops the part before its deposit: neither the credit
      // check nor a recovery look could tell this part's tokens from that balance
      maxSellBefore: ctx.fee,
      // so does the marker of an earlier swap of the pair that has not settled: its deposit may still
      // be credited while this part waits for its own
      stopIfPending: true,
      // a credit that is not this deposit (another deposit of the wallet credited before it or with
      // it) is never swapped: the pylon nets one fee from a deposit
      creditFee: ctx.fee,
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
        reason: journalRefused || err?.journal ? 'journal' : err?.held ? 'neuHeld' : undefined, error, notStarted: true }
    }
    if (err?.creditMismatch) {
      // The pylon credited an amount that is not this deposit: another deposit of the wallet was
      // credited before it or with it. Nothing was swapped, and a look could not tell this part's tokens
      // from the others, so all of it stays on the pylon for the Recover page, with the marker.
      ctx.onStep('Failed, recover on the Recover page')
      return { dex: 'neutrinite', success: false, amountOut: 0n, state: 'needsRecovery', reason: 'neuMismatch', error, recovered: false }
    }
    ctx.onStep('Recovering funds…')
    // Sweep only what this swap added on the pylon, retried because a deposit
    // can credit a few seconds after we gave up. Clear the marker only once
    // that amount came back, and never one an earlier failed swap on this
    // pair left (its funds are still there); otherwise the Recover page keeps it.
    let recovered = false
    let emptyLooks = 0
    let lastErr: unknown = null
    // a look found the ICP and threw (its own withdraw failed or lost its answer), then a later look
    // found nothing: the ICP left the pylon, for the wallet
    let foundOutBefore = false, emptyAfterFound = false
    const report: SweepReport = { found: [], moved: [] }
    for (let i = 0; i < 3 && !recovered; i++) {
      if (i > 0) await deps.clock.sleep(5000)
      try {
        recovered = await deps.neutrinite.sweep(sell, buy, track.before, { report })
        // a sweep throws when the pylon read or a withdraw fails, so a plain false is a real look
        // that found nothing above the start balances
        if (!recovered) { emptyLooks++; if (foundOutBefore) emptyAfterFound = true }
        lastErr = null
      } catch (e) { lastErr = e; ctx.log?.(`[CrossDEX] Neutrinite sweep attempt ${i + 1} failed:`, e) }
      if (report.found.some(f => f.token === buy)) foundOutBefore = true
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
    const gotOut = report.moved.filter(m => m.token === buy).reduce((a, m) => a + m.amount, 0n)
    const soldMoved = report.moved.filter(m => m.token === sell)
    const soldBack = soldMoved.reduce((a, m) => a + m.amount, 0n)
    // The sold token that came back is this part's deposit only when it is this part's credit (within
    // one fee): the amount the credit poll saw, or the deposit minus the pylon's fee when the poll never
    // saw it. Another swap's sold token can land on the pylon meanwhile and come back with a look; it
    // never outweighs this part's own ICP.
    const credit = track.credited ?? (leg.amountIn > ctx.fee ? leg.amountIn - ctx.fee : 0n)
    const nearCredit = (a: bigint) => a > 0n && (a > credit ? a - credit : credit - a) <= ctx.fee
    const depositBack = soldMoved.some(m => nearCredit(m.amount)) || nearCredit(soldBack)
    // What a look moved is this part's only when it could have come from it: ICP once its swap may
    // have run, the sold token when its deposit came back. ICP another swap of the wallet left above
    // the start balances can come back too, and alone proves nothing (no sale, no refund). A swap that
    // answered with an error did not run, nor did one whose credit a look still found on the pylon
    // (a look that lost its own answer may have sent it to the wallet unseen).
    const depositSeen = report.found.some(f => f.token === sell && nearCredit(f.amount))
    const swapMayHaveRun = track.swappedOut != null || (!!track.swapSent && !track.swapRefused && !depositSeen)
    const own = recovered && (track.swappedOut != null || depositBack || (swapMayHaveRun && gotOut > 0n))
    // From a start balance above dust, a look that brought back less ICP than the swap gave did not get
    // all of it: another swap moving that balance meanwhile left the rest inside the baseline, still on
    // the pylon. The part keeps its marker for the Recover page, and the total leaves it out.
    const partOnly = own && !startClean && track.swappedOut != null && gotOut < track.swappedOut
    // with the swap's answer lost there is no amount to check the ICP against: from a start balance
    // above dust the marker stays, so the Recover page can still find any rest
    const unchecked = !startClean && track.swappedOut == null && swapMayHaveRun && !depositBack
    if (own && !partOnly && !unchecked && !track.hadMarker) deps.neutrinite.removePendingSwap(sell, buy)
    if (own && !partOnly && track.swappedOut == null && swapMayHaveRun && !depositBack && gotOut > 0n) {
      // The swap's answer was lost and a look brought ICP back: it sold. The swap cannot fill below its
      // minimum scaled to the credit, so from a start balance above dust, less than that is only part of
      // its ICP (another swap moving its own balance meanwhile left the rest inside the baseline): the
      // part keeps its marker, and the rest may already be in the wallet. More ICP than the plan's output
      // holds another swap's ICP too: the wallet shows the amount.
      const scaledMin = track.credited != null && leg.amountIn > 0n ? (minOut * track.credited) / leg.amountIn : minOut
      if (!startClean && gotOut < scaledMin) {
        ctx.onStep('Failed, recover on the Recover page')
        return { dex: 'neutrinite', success: false, amountOut: 0n, state: 'needsRecovery', error, recovered: false,
          failedAfterSwap: true, outMaybeSent: true, reason: isSessionError(lastErr) ? 'session' : undefined }
      }
      ctx.onStep('Done')
      return gotOut > leg.expectedOut
        ? { dex: 'neutrinite', success: true, amountOut: 0n, state: 'doneUnknown', reason: 'afterSwap' }
        : { dex: 'neutrinite', success: true, amountOut: gotOut, state: 'done', reason: 'afterSwap' }
    }
    if (own && !partOnly && track.swappedOut != null) {
      // The swap filled and the retry delivered its output (never counted above what the swap gave).
      ctx.onStep('Done')
      const amountOut = gotOut > 0n && gotOut < track.swappedOut ? gotOut : track.swappedOut
      return { dex: 'neutrinite', success: true, amountOut, state: 'done', reason: 'afterSwap' }
    }
    if (own && !partOnly) {
      ctx.onStep('Failed, funds recovered')
      return { dex: 'neutrinite', success: false, amountOut: 0n, state: 'refunded', refundedBy: 'us', error, recovered: true }
    }
    // Not recovered, only part of the ICP, or nothing that is this part's: the marker stays. The
    // ICP may already be in the wallet when the withdraw's answer was lost (not refused) and no look
    // found it, when a look found it and then lost its own answer, or when a look brought back only
    // part of it. With the swap's answer lost, a look that sent ICP to the wallet (it answered, a
    // later step of that look failed) or found ICP that a later look no longer finds says the same:
    // the swap ran.
    ctx.onStep('Failed, recover on the Recover page')
    const icpBackUnsure = track.swappedOut == null && swapMayHaveRun && (gotOut > 0n || emptyAfterFound)
    const outMaybeSent = partOnly || icpBackUnsure || (track.swappedOut != null
      && ((!track.withdrawRefused && !report.found.some(f => f.token === buy)) || emptyAfterFound))
    return { dex: 'neutrinite', success: false, amountOut: 0n, state: 'needsRecovery', error, recovered: false,
      failedAfterSwap: track.swappedOut != null || icpBackUnsure, outMaybeSent, reason: isSessionError(lastErr) ? 'session' : undefined }
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
