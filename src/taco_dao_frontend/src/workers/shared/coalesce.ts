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
  let last: { data: any; timestamp: number } | null = null
  let running: { agent: HttpAgent; promise: Promise<any | null> } | null = null
  let started = 0
  let landedSeq = 0 // start order of the newest answer so far (never reset)
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
        if (running?.promise === promise) running = null
        // A query that started earlier and answered later is older than an
        // answer already given: it is neither stored nor handed out. Its
        // callers get the newer answer, or null (they then make their single
        // calls) once that has expired.
        if (seq < landedSeq) return last ? last.data : null
        landedSeq = seq
        const result = { data, timestamp: Date.now() }
        last = result
        setTimeout(() => { if (last === result) last = null }, ms)
        return data
      })
    running = { agent: agentRef, promise }
    return promise
  }
}
