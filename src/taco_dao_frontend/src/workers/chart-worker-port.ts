/**
 * Chart Worker Port Singleton
 *
 * Creates the chart compute worker (SharedWorker or DedicatedWorker) once
 * and reuses it across navigations. Preloaded at app startup during idle time.
 */

import ChartSharedWorkerUrl from './chart-compute.shared.worker.ts?worker&url'
import ChartDedicatedWorkerUrl from './chart-compute.worker.ts?worker&url'

let port: MessagePort | Worker | null = null
let cleanup: (() => void) | null = null

export function getChartPort(): MessagePort | Worker {
  if (port) return port
  if (typeof SharedWorker !== 'undefined') {
    const sw = new SharedWorker(ChartSharedWorkerUrl, { type: 'module', name: 'chart-compute' })
    port = sw.port
    port.start()
    cleanup = () => sw.port.close()
  } else {
    const dw = new Worker(ChartDedicatedWorkerUrl, { type: 'module', name: 'chart-compute' })
    port = dw
    cleanup = () => dw.terminate()
  }
  return port
}

export function terminateChartWorker(): void {
  cleanup?.()
  port = null
  cleanup = null
}
