/**
 * CrossDEX run journal: one record per sale (Sell many) or swap (single swap),
 * kept in localStorage under `taco_crossdex_run:<id>`, one key per run so two
 * tabs never overwrite each other's records.
 *
 * It is the second pointer to every place funds can sit, next to the per leg
 * journals (ICPSwap and Neutrinite pair markers, the TACO deposit history):
 * each V1 deposit's intent is written and read back before the transfer, its
 * block right after, and each fund moving step of a leg is written and read
 * back right before it runs. The Recover page lists every V1 leg of a stored
 * run that has an intent and no block ("may have been sent") or a block whose
 * deposit is still open.
 *
 * Sell many writes strictly: a failed write or read back stops that leg before
 * funds move. The single swap writes best effort.
 *
 * Retention: a run with an unresolved leg (an intent with no block that was not
 * refused, or a block whose deposit is open) is kept 21 days; resolved runs keep
 * the 10 newest; never more than 50 runs.
 *
 * Pure module: takes a Storage and a clock.
 */

import type { LegJournal, LegOutcome, LegState } from './crossDexLegRunner'
import type { CrossDexVenue } from './crossDexOptimizer'

export const RUN_KEY_PREFIX = 'taco_crossdex_run:'
const KEEP_UNRESOLVED_MS = 21 * 86_400_000
const KEEP_RESOLVED = 10
const MAX_RUNS = 50
const PROGRESS_THROTTLE_MS = 500

export type RunJournalPhase = 'running' | 'done' | 'stopped' | 'interrupted'
export type DepositPointer = 'open' | 'used' | 'recovered' | 'settled' | 'dismissed'

export interface LegRecord {
  dex: CrossDexVenue
  amountIn: string
  expectedOut: string
  minOut: string
  state: LegState
  reason?: string | null
  step?: string
  /** The fund moving step this leg was about to run (written before it ran). */
  moving?: 'depositFrom' | 'neuTransfer' | 'v2Swap' | 'transfer'
  waitsFor?: string[]
  intent?: { amount: string; to: string; createdAtNs?: string; memo?: string; at: number }
  block?: string
  deposit?: DepositPointer
  amountOut?: string | null
}

export interface AssetRecord {
  token: string
  symbol: string
  amountIn: string
  atMax: boolean
  /** The token's asset type tag (ICP, ICRC12, ICRC3) for recovery calls. */
  type?: string
  legs: LegRecord[]
}

export interface RunRecord {
  v: 2
  id: string
  kind: 'many' | 'swap'
  principal: string
  /** The bought token (ICP for Sell many). */
  target: string
  startedAt: number
  updatedAt: number
  phase: RunJournalPhase
  pendingSlow: number
  stopReason?: string
  /** The interrupted note was handled (a Recover All ran, or the user dismissed it). */
  checked?: boolean
  assets: AssetRecord[]
}

export interface JournalClock { now(): number; setTimer(fn: () => void, ms: number): unknown; clearTimer(h: unknown): void }

export function newRunId(kind: 'many' | 'swap', now: number): string {
  return `${kind === 'many' ? 'ms' : 'sw'}-${now}-${Math.random().toString(36).slice(2, 6)}`
}

const keyOf = (id: string) => `${RUN_KEY_PREFIX}${id}`

/** A leg whose funds may still need the Recover page. */
export function legUnresolved(l: LegRecord): boolean {
  if (l.deposit === 'dismissed' || l.deposit === 'used' || l.deposit === 'recovered') return false
  if (l.block != null) return l.deposit === 'open' || l.deposit == null
  if (l.intent != null) return l.state !== 'notSent'
  return false
}
export function runUnresolved(r: RunRecord): boolean {
  return r.assets.some(a => a.legs.some(legUnresolved))
}

export class RunJournal {
  private live = new Map<string, RunRecord>()
  private timers = new Map<string, unknown>()

  constructor(private storage: Storage, private clock: JournalClock) {}

  // ── storage ──
  private writeRaw(rec: RunRecord): boolean {
    const json = JSON.stringify(rec)
    try {
      this.storage.setItem(keyOf(rec.id), json)
      return this.storage.getItem(keyOf(rec.id)) === json
    } catch { return false }
  }

  get(id: string): RunRecord | null {
    const mem = this.live.get(id)
    if (mem) return mem
    try {
      const raw = this.storage.getItem(keyOf(id))
      return raw ? (JSON.parse(raw) as RunRecord) : null
    } catch { return null }
  }

  /** Every stored run, newest first. */
  list(): RunRecord[] {
    const out: RunRecord[] = []
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i)
        if (!k || !k.startsWith(RUN_KEY_PREFIX)) continue
        try {
          const r = JSON.parse(this.storage.getItem(k) ?? 'null') as RunRecord | null
          if (r && r.v === 2 && Array.isArray(r.assets)) out.push(this.live.get(r.id) ?? r)
        } catch { /* skip a broken record */ }
      }
    } catch { /* storage unreadable */ }
    return out.sort((a, b) => b.startedAt - a.startedAt)
  }

  /** Apply the retention rules (never drops a run this tab is writing). */
  prune(): void {
    const now = this.clock.now()
    const runs = this.list()
    const drop = new Set<string>()
    const resolved: RunRecord[] = []
    for (const r of runs) {
      if (this.live.has(r.id)) continue
      const age = now - r.startedAt
      if (runUnresolved(r)) { if (age > KEEP_UNRESOLVED_MS) drop.add(r.id) }
      else resolved.push(r)
    }
    resolved.slice(KEEP_RESOLVED).forEach(r => drop.add(r.id))
    const kept = runs.filter(r => !drop.has(r.id))
    if (kept.length > MAX_RUNS) {
      // Over the ceiling: the oldest resolved first, then the oldest unresolved.
      const order = [...kept].filter(r => !this.live.has(r.id))
        .sort((a, b) => Number(runUnresolved(a)) - Number(runUnresolved(b)) || a.startedAt - b.startedAt)
      for (const r of order) { if (runs.length - drop.size <= MAX_RUNS) break; drop.add(r.id) }
    }
    for (const id of drop) { try { this.storage.removeItem(keyOf(id)) } catch { /* ignore */ } }
  }

  // ── run lifecycle ──
  /** Write a new run and read it back. False: storage is not keeping data. */
  start(rec: RunRecord): boolean {
    this.prune()
    rec.updatedAt = this.clock.now()
    this.live.set(rec.id, rec)
    return this.writeRaw(rec)
  }

  /** Write the run now (cancels a pending throttled write). */
  flush(id: string): boolean {
    const rec = this.live.get(id)
    if (!rec) return false
    const t = this.timers.get(id)
    if (t != null) { this.clock.clearTimer(t); this.timers.delete(id) }
    rec.updatedAt = this.clock.now()
    return this.writeRaw(rec)
  }

  private soon(id: string) {
    if (this.timers.has(id)) return
    this.timers.set(id, this.clock.setTimer(() => { this.timers.delete(id); this.flush(id) }, PROGRESS_THROTTLE_MS))
  }

  setPhase(id: string, phase: RunJournalPhase, patch: Partial<Pick<RunRecord, 'pendingSlow' | 'stopReason'>> = {}): boolean {
    const rec = this.live.get(id)
    if (!rec) return false
    rec.phase = phase
    Object.assign(rec, patch)
    return this.flush(id)
  }

  /** The run is over in this tab: final write, then it is only read from storage. */
  close(id: string, phase: RunJournalPhase = 'done'): void {
    this.setPhase(id, phase, { pendingSlow: 0 })
    this.live.delete(id)
  }

  /** Change one leg of a stored run (the Recover page: dismissed, recovered). */
  markLeg(id: string, ai: number, li: number, patch: Partial<LegRecord>): boolean {
    const rec = this.live.get(id) ?? this.get(id)
    const leg = rec?.assets[ai]?.legs[li]
    if (!rec || !leg) return false
    Object.assign(leg, patch)
    rec.updatedAt = this.clock.now()
    return this.writeRaw(rec)
  }

  markRun(id: string, patch: Partial<Pick<RunRecord, 'phase' | 'checked'>>): boolean {
    const rec = this.live.get(id) ?? this.get(id)
    if (!rec) return false
    Object.assign(rec, patch)
    rec.updatedAt = this.clock.now()
    return this.writeRaw(rec)
  }

  /** The LegJournal for one leg of a live run. */
  legJournal(id: string, ai: number, li: number): LegJournal {
    const leg = () => this.live.get(id)?.assets[ai]?.legs[li]
    const writeNow = (fn: (l: LegRecord) => void): boolean => {
      const l = leg()
      if (!l) return false
      fn(l)
      return this.flush(id)
    }
    return {
      intent: (d) => writeNow(l => {
        l.intent = { amount: d.amount.toString(), to: d.to, createdAtNs: d.createdAtNs?.toString(), memo: d.memo, at: this.clock.now() }
        l.moving = 'transfer'
        l.state = 'running'
      }),
      block: (b) => writeNow(l => { l.block = b.toString(); l.deposit = l.deposit ?? 'open' }),
      beforeMove: (step) => writeNow(l => { l.moving = step; l.state = 'running' }),
      deposit: (status) => { writeNow(l => { if (l.block != null || status !== 'open') l.deposit = status }) },
      progress: (p) => {
        const l = leg()
        if (!l) return
        if (p.step != null) l.step = p.step
        if (p.state != null) l.state = p.state
        this.soon(id)
      },
      final: (o: LegOutcome) => {
        writeNow(l => {
          l.state = o.state
          l.reason = o.reason ?? null
          l.amountOut = o.success ? o.amountOut.toString() : null
          if (o.block != null && l.block == null) { l.block = o.block.toString(); l.deposit = l.deposit ?? 'open' }
        })
      },
    }
  }
}
