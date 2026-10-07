/**
 * Client for the performance-graph worker — a per-chart SESSION.
 *
 * Each PerformanceChart creates one session (one DedicatedWorker). The worker
 * fetches + decodes once, HOLDS the checkpoints, and answers cheap `recompute`
 * messages for baseline / token-symbol changes — so the big checkpoints array
 * never crosses to the main thread (the /performance freeze fix). Dispose on
 * unmount to terminate the worker.
 *
 * Requests carry a per-session reqId so overlapping recomputes (rapid baseline
 * changes) can't resolve the wrong promise. There is no app-wide singleton here,
 * so none of the cross-deploy fragility of a pooled worker applies.
 *
 * PerformanceView's staging demo uses a session of its own for
 * loadUserPerformance (the MyPerformance numbers, see the worker); it returns
 * transfer-format data for the caller to deserialize.
 */
import PerfGraphWorkerUrl from './performance-graph.worker.ts?worker&url'
import type { SerializedCheckpoint } from './shared/chart-compute'

export interface PerfGraphLoadParams {
  principal: string
  host: string
  canisterId: string
  fetchRootKey: boolean
  baselineIndex?: number
  tokenSymbolMap?: Record<string, string>
  isLocal?: boolean
}

export interface UserPerfLoadParams {
  principal: string
  host: string
  canisterId: string
  fetchRootKey: boolean
  startMs: number
}

export interface ChartData {
  usdSeries: any[]
  icpSeries: any[]
  tooltipData: Record<number, any>
}
export type CompactMeta = Pick<SerializedCheckpoint, 'timestamp' | 'reason'>
export interface LoadData extends ChartData { meta: CompactMeta[] }

export interface PerfGraphSession {
  load(params: PerfGraphLoadParams): Promise<{ data?: LoadData; error?: string }>
  recompute(baselineIndex: number, tokenSymbolMap: Record<string, string>, isLocal: boolean): Promise<{ data?: ChartData; error?: string }>
  loadUserPerformance(params: UserPerfLoadParams): Promise<{ data?: unknown; error?: string }>
  dispose(): void
}

export function createPerfGraphSession(): PerfGraphSession {
  let worker: Worker | null = null
  let nextId = 1
  const pending = new Map<number, (r: any) => void>()
  let disposed = false

  function ensure(): Worker {
    if (worker) return worker
    const w = new Worker(PerfGraphWorkerUrl, { type: 'module', name: 'perf-graph' })
    w.onmessage = (e) => {
      const data = (e.data || {}) as { reqId?: number }
      const id = data.reqId
      if (typeof id === 'number') {
        const resolve = pending.get(id)
        if (resolve) { pending.delete(id); resolve(data) }
      }
    }
    w.onerror = (e) => {
      const err = (e && (e as any).message) || 'Performance graph worker error'
      for (const [id, resolve] of Array.from(pending.entries())) {
        pending.delete(id); resolve({ ok: false, error: err })
      }
      try { w.terminate() } catch { /* ignore */ }
      if (worker === w) worker = null
    }
    worker = w
    return w
  }

  function send(msg: Record<string, unknown>, timeoutMs: number): Promise<any> {
    return new Promise((resolve) => {
      if (disposed) { resolve({ ok: false, error: 'disposed' }); return }
      let w: Worker
      try { w = ensure() } catch (err: any) { resolve({ ok: false, error: err?.message || 'Failed to start worker' }); return }
      const reqId = nextId++
      let done = false
      const finish = (r: any) => { if (done) return; done = true; pending.delete(reqId); clearTimeout(timer); resolve(r) }
      // timeoutMs 0 = no timeout
      const timer = timeoutMs > 0 ? setTimeout(() => finish({ ok: false, error: 'Timed out loading performance data' }), timeoutMs) : undefined
      pending.set(reqId, finish)
      try { w.postMessage({ ...msg, reqId }) } catch (err: any) { finish({ ok: false, error: err?.message || 'postMessage failed' }) }
    })
  }

  return {
    async load(params) {
      const r = await send({ type: 'load', ...params }, 120_000)
      if (!r.ok) return { error: r.error || 'Failed to load data' }
      return { data: { meta: r.meta || [], usdSeries: r.usdSeries || [], icpSeries: r.icpSeries || [], tooltipData: r.tooltipData || {} } }
    },
    async recompute(baselineIndex, tokenSymbolMap, isLocal) {
      const r = await send({ type: 'recompute', baselineIndex, tokenSymbolMap, isLocal }, 30_000)
      if (!r.ok) return { error: r.error || 'Failed to recompute' }
      return { data: { usdSeries: r.usdSeries || [], icpSeries: r.icpSeries || [], tooltipData: r.tooltipData || {} } }
    },
    async loadUserPerformance(params) {
      // No timeout, like the main-thread call this replaces: the decode alone
      // takes ~30 s on desktop for the current demo graph, more on a phone.
      const r = await send({ type: 'userPerformance', ...params }, 0)
      if (!r.ok) return { error: r.error || 'Failed to load data' }
      return { data: r.data }
    },
    dispose() {
      disposed = true
      for (const [id, resolve] of Array.from(pending.entries())) { pending.delete(id); resolve({ ok: false, error: 'disposed' }) }
      try { worker?.terminate() } catch { /* ignore */ }
      worker = null
    },
  }
}

/** No-op kept so existing idle-warm callers don't break. */
export function warmPerformanceGraphWorker(): void { /* sessions are created per-chart on demand */ }
