/**
 * Composite query coalescing for the data workers
 */

import type { HttpAgent } from '@dfinity/agent'

/**
 * One composite query shared by the keys it fills. Its answer (null if it
 * failed) is reused for `ms` by every caller, then let go: the dashboards are
 * up to ~1 MB and were kept for good. While the query runs, a caller with the
 * same agent waits for it instead of sending it again; a caller with another
 * agent (signed in instead of anonymous) sends its own.
 */
export function coalesced(
  label: string,
  query: (agent: HttpAgent) => Promise<any>,
  ms: number
): (agent: HttpAgent) => Promise<any | null> {
  let last: { data: any; timestamp: number } | null = null
  let running: { agent: HttpAgent; promise: Promise<any | null> } | null = null
  return (agentRef) => {
    if (last && (Date.now() - last.timestamp) < ms) return Promise.resolve(last.data)
    if (running?.agent === agentRef) return running.promise
    const promise: Promise<any | null> = query(agentRef)
      .catch((err) => {
        console.warn(`${label} composite failed, falling back to individual calls:`, err)
        return null
      })
      .then((data) => {
        const result = { data, timestamp: Date.now() }
        last = result
        setTimeout(() => { if (last === result) last = null }, ms)
        if (running?.promise === promise) running = null
        return data
      })
    running = { agent: agentRef, promise }
    return promise
  }
}
