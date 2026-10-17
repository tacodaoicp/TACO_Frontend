/**
 * Composite query coalescing for the data workers
 */

import type { HttpAgent } from '@dfinity/agent'

/**
 * One composite query shared by the keys it fills. Its answer (null if it
 * failed) is reused for `ms` by every caller, then let go: the dashboards are
 * up to ~1 MB and were kept for good. While the query runs, a caller with the
 * same agent waits for it instead of sending it again; a caller with another
 * agent (signed in instead of anonymous) sends its own. So does a caller with
 * `joinRunning: false` (a forced fetch): the running query may have started
 * before whatever it wants to see (an admin action).
 */
export function coalesced(
  label: string,
  query: (agent: HttpAgent) => Promise<any>,
  ms: number
): (agent: HttpAgent, opts?: { joinRunning?: boolean }) => Promise<any | null> {
  let last: { data: any; timestamp: number; seq: number } | null = null
  let running: { agent: HttpAgent; promise: Promise<any | null> } | null = null
  let started = 0
  return (agentRef, opts) => {
    if (last && (Date.now() - last.timestamp) < ms) return Promise.resolve(last.data)
    if (opts?.joinRunning !== false && running?.agent === agentRef) return running.promise
    const seq = ++started
    const promise: Promise<any | null> = query(agentRef)
      .catch((err) => {
        console.warn(`${label} composite failed, falling back to individual calls:`, err)
        return null
      })
      .then((data) => {
        // A query that started earlier and answered later is older: it never
        // replaces a newer answer
        if (!last || seq > last.seq) {
          const result = { data, timestamp: Date.now(), seq }
          last = result
          setTimeout(() => { if (last === result) last = null }, ms)
        }
        if (running?.promise === promise) running = null
        return data
      })
    running = { agent: agentRef, promise }
    return promise
  }
}
