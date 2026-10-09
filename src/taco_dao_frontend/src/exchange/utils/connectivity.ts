/**
 * One connectivity signal for the exchange, fed by the transport layer (the
 * query worker client and the main thread query actor).
 *
 * Only network failures count (fetch failed, timeouts, 5xx). A canister
 * reject is an answer, so it neither starts nor ends a failure streak. A call
 * left hanging counts as stalled after STALL_MS, so a dead connection shows
 * up in about 10 s instead of after the 20 s call timeout.
 * Drives the "Live data paused" banner: nothing in the views reads per query
 * errors, so without this a dropped connection looked exactly like live data.
 */
import { ref } from 'vue'

const OFFLINE_RE = /Failed to fetch|NetworkError|Load failed|network error|timed out|timeout|Status: 5\d\d/i

/** True when an error means the IC could not be reached (not a canister reject). */
export function looksOffline(err: unknown): boolean {
  const msg = (err as { message?: unknown } | null)?.message ?? err
  return typeof msg === 'string' && OFFLINE_RE.test(msg)
}

let lastOkAt = 0
/** Time of the first network failure since the last successful call (0 when none). */
export const callsFailingSince = ref(0)
/** Ticks once a second while calls are failing or stalled, so time based views update. */
export const connectivityTick = ref(0)
let ticker: ReturnType<typeof setInterval> | null = null

const STALL_MS = 8_000
const openCalls = new Map<number, number>() // call id -> start time
let nextCallId = 0

/** Time of the last successful exchange call in this page session (0 if none). */
export function lastCallOkAt(): number { return lastOkAt }

/** Start of the oldest call that has been open for STALL_MS or more and
 *  started after the last success (0 when there is none). */
export function stalledSince(): number {
  const now = Date.now()
  let oldest = 0
  for (const t of openCalls.values()) {
    if (now - t >= STALL_MS && t >= lastOkAt && (!oldest || t < oldest)) oldest = t
  }
  return oldest
}

function tick() {
  connectivityTick.value++
  if (!callsFailingSince.value && !stalledSince() && ticker) { clearInterval(ticker); ticker = null }
}
function startTicker() {
  if (!ticker) ticker = setInterval(tick, 1000)
}

/** Mark a call as started; pass the id to noteCallEnd when it settles. */
export function noteCallStart(): number {
  const id = ++nextCallId
  openCalls.set(id, Date.now())
  setTimeout(() => { if (openCalls.has(id)) startTicker() }, STALL_MS + 50)
  return id
}

export function noteCallEnd(id: number): void {
  openCalls.delete(id)
}

export function noteCallOk(): void {
  lastOkAt = Date.now()
  if (callsFailingSince.value) callsFailingSince.value = 0
  if (ticker) connectivityTick.value++
}

export function noteCallError(err: unknown): void {
  if (!looksOffline(err)) return
  if (!callsFailingSince.value) callsFailingSince.value = Date.now()
  startTicker()
}
