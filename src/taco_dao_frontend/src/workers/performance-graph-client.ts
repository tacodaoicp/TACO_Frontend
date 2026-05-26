/**
 * Client for the one-shot performance-graph fetch worker.
 *
 * Spins up a DedicatedWorker, asks it to fetch + decode + serialize a user's
 * performance graph off the main thread, resolves with chart-ready serialized
 * checkpoints (or an error), then terminates the worker.
 */
import PerfGraphWorkerUrl from './performance-graph.worker.ts?worker&url'
import type { SerializedCheckpoint } from './shared/chart-compute'

export interface FetchGraphParams {
  principal: string
  host: string
  canisterId: string
  fetchRootKey: boolean
}

export interface FetchGraphResult {
  checkpoints?: SerializedCheckpoint[]
  error?: string
}

export function fetchPerformanceGraph(params: FetchGraphParams, timeoutMs = 120_000): Promise<FetchGraphResult> {
  return new Promise((resolve) => {
    let worker: Worker | null = null
    let done = false
    const finish = (r: FetchGraphResult) => {
      if (done) return
      done = true
      try { worker?.terminate() } catch { /* ignore */ }
      resolve(r)
    }
    try {
      worker = new Worker(PerfGraphWorkerUrl, { type: 'module', name: 'perf-graph' })
      const timer = setTimeout(() => finish({ error: 'Timed out loading performance data' }), timeoutMs)
      worker.onmessage = (e) => { clearTimeout(timer); finish((e.data as FetchGraphResult) || {}) }
      worker.onerror = (e) => { clearTimeout(timer); finish({ error: e.message || 'Worker error' }) }
      worker.postMessage(params)
    } catch (err: any) {
      finish({ error: err?.message || 'Failed to start performance-graph worker' })
    }
  })
}
