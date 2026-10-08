/**
 * One connectivity signal for the exchange, fed by the transport layer (the
 * query worker client and the main thread query actor).
 *
 * Only network failures count (fetch failed, timeouts, 5xx). A canister
 * reject is an answer, so it neither starts nor ends a failure streak.
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
/** Ticks once a second while calls are failing, so time based views update. */
export const connectivityTick = ref(0)
let ticker: ReturnType<typeof setInterval> | null = null

/** Time of the last successful exchange call in this page session (0 if none). */
export function lastCallOkAt(): number { return lastOkAt }

export function noteCallOk(): void {
  lastOkAt = Date.now()
  if (callsFailingSince.value) callsFailingSince.value = 0
  if (ticker) { clearInterval(ticker); ticker = null }
}

export function noteCallError(err: unknown): void {
  if (!looksOffline(err)) return
  if (!callsFailingSince.value) callsFailingSince.value = Date.now()
  if (!ticker) ticker = setInterval(() => { connectivityTick.value++ }, 1000)
}
