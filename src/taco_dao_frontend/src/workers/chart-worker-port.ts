/**
 * Chart Worker Port Factory
 *
 * Each PerformanceChart instance must own its own port — otherwise multiple charts on
 * the same page overwrite each other's `onmessage` handler (the singleton-port pattern
 * silently broke "Start from" updates when MyPerformance and an expanded leaderboard
 * row were both mounted). SharedWorker's underlying thread is still shared because we
 * pass the same `name`; only the message port is per-consumer.
 */

import ChartSharedWorkerUrl from './chart-compute.shared.worker.ts?worker&url'
import ChartDedicatedWorkerUrl from './chart-compute.worker.ts?worker&url'

export interface ChartPortHandle {
  port: MessagePort | Worker
  dispose: () => void
}

export function createChartPort(): ChartPortHandle {
  if (typeof SharedWorker !== 'undefined') {
    const sw = new SharedWorker(ChartSharedWorkerUrl, { type: 'module', name: 'chart-compute' })
    const port = sw.port
    port.start()
    return {
      port,
      dispose: () => {
        try { port.close() } catch { /* ignore */ }
      },
    }
  }
  const dw = new Worker(ChartDedicatedWorkerUrl, { type: 'module', name: 'chart-compute' })
  return { port: dw, dispose: () => dw.terminate() }
}

/**
 * Warm the SharedWorker thread at app startup so the first chart paint is faster.
 * The returned port is intentionally not closed — keeping it open holds the shared
 * worker alive for the rest of the session. For DedicatedWorker fallback, this
 * spawns a single warm-up worker that consumers don't share (cheap but unused).
 */
export function getChartPort(): MessagePort | Worker {
  return createChartPort().port
}
