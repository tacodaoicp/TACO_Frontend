/**
 * Chart Compute Worker (DedicatedWorker)
 *
 * Offloads PerformanceChart filtering and return calculations from the main thread.
 * Receives serialized checkpoint data, returns series data + pre-computed tooltip info.
 */

import { computeAll } from './shared/chart-compute'
import type { ComputeRequest } from './shared/chart-compute'

self.onmessage = (e: MessageEvent<ComputeRequest>) => {
  const result = computeAll(e.data)
  self.postMessage(result)
}
