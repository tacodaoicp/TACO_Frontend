/**
 * Chart Compute SharedWorker
 *
 * SharedWorker version of the chart computation worker.
 * Each connected tab gets its own port; computation is per-request.
 * Falls back to chart-compute.worker.ts (DedicatedWorker) on browsers
 * that don't support SharedWorker (iOS Safari).
 */

/// <reference lib="webworker" />

import { computeAll } from './shared/chart-compute'
import type { ComputeRequest } from './shared/chart-compute'

declare const self: SharedWorkerGlobalScope

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0]

  port.onmessage = (e: MessageEvent<ComputeRequest>) => {
    const result = computeAll(e.data)
    port.postMessage(result)
  }

  port.start()
}
