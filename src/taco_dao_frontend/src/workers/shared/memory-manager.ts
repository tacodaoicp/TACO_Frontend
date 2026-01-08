/**
 * Memory Management for SharedWorkers
 *
 * Provides utilities to:
 * - Estimate object sizes
 * - Limit data retention
 * - Clear stale data from memory
 */

import type { DataKey, DataState } from '../types'

// ============================================================================
// Configuration
// ============================================================================

// Maximum size per data key (in estimated bytes) - 2MB default
export const MAX_DATA_SIZE_BYTES: Partial<Record<DataKey, number>> = {
  // Large history datasets - limit to 500KB each
  priceHistory: 500_000,
  portfolioHistory: 500_000,
  neuronSnapshots: 500_000,
  distributionHistory: 500_000,
  // Log data - limit to 200KB each
  systemLogs: 200_000,
  circuitBreakerLogs: 200_000,
  sentSMSMessages: 200_000,
  sentEmailMessages: 200_000,
  sentMessages: 200_000,
  adminActionLogs: 200_000,
  alarmAcknowledgments: 200_000,
  systemErrors: 200_000,
  internalErrors: 200_000,
  // Proposals can be large
  tacoProposals: 300_000,
  votableProposals: 300_000,
  proposalsThreads: 300_000,
  // Names map - limit to 300KB
  allNames: 300_000,
  // Voter details can grow - limit to 500KB
  voterDetails: 500_000,
  neuronAllocations: 300_000,
  penalizedNeurons: 100_000,
}

// Default max size for unspecified keys (1MB)
const DEFAULT_MAX_SIZE = 1_000_000

// Memory cleanup interval (5 minutes)
export const MEMORY_CLEANUP_INTERVAL_MS = 5 * 60 * 1000

// Time after which unused data can be cleared from memory (10 minutes)
export const UNUSED_DATA_TIMEOUT_MS = 10 * 60 * 1000

// ============================================================================
// Size Estimation
// ============================================================================

/**
 * Rough estimate of object size in bytes
 * This is approximate but useful for limiting memory usage
 */
export function estimateSize(obj: unknown): number {
  if (obj === null || obj === undefined) return 0

  const type = typeof obj

  switch (type) {
    case 'boolean':
      return 4
    case 'number':
      return 8
    case 'bigint':
      return 16
    case 'string':
      return (obj as string).length * 2 // UTF-16
    case 'object':
      if (Array.isArray(obj)) {
        // Array: sum of elements + array overhead
        let size = 32 // Array overhead
        for (const item of obj) {
          size += estimateSize(item)
        }
        return size
      }
      if (obj instanceof Uint8Array) {
        return obj.byteLength + 16
      }
      if (obj instanceof Map) {
        let size = 32
        for (const [k, v] of obj) {
          size += estimateSize(k) + estimateSize(v)
        }
        return size
      }
      if (obj instanceof Set) {
        let size = 32
        for (const v of obj) {
          size += estimateSize(v)
        }
        return size
      }
      // Plain object
      let size = 32 // Object overhead
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          size += key.length * 2 + estimateSize((obj as Record<string, unknown>)[key])
        }
      }
      return size
    default:
      return 8
  }
}

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ============================================================================
// Data Trimming
// ============================================================================

/**
 * Trim array data to fit within size limit
 * Returns a new array with fewer elements if needed
 */
export function trimArrayToSize<T>(data: T[], maxBytes: number): T[] {
  const currentSize = estimateSize(data)
  if (currentSize <= maxBytes) return data

  // Estimate per-item size
  if (data.length === 0) return data
  const avgItemSize = currentSize / data.length
  const targetCount = Math.floor(maxBytes / avgItemSize * 0.9) // 10% buffer

  console.log(`[MemoryManager] Trimming array from ${data.length} to ${targetCount} items (${formatBytes(currentSize)} -> ~${formatBytes(maxBytes)})`)

  // Keep most recent items (assume array is chronologically ordered)
  return data.slice(0, Math.max(1, targetCount))
}

/**
 * Check if data exceeds size limit for a key
 */
export function exceedsSizeLimit(dataKey: DataKey, data: unknown): boolean {
  const maxSize = MAX_DATA_SIZE_BYTES[dataKey] ?? DEFAULT_MAX_SIZE
  return estimateSize(data) > maxSize
}

/**
 * Trim data to fit within size limit for a specific key
 */
export function trimToSizeLimit(dataKey: DataKey, data: unknown): unknown {
  const maxSize = MAX_DATA_SIZE_BYTES[dataKey] ?? DEFAULT_MAX_SIZE
  const currentSize = estimateSize(data)

  if (currentSize <= maxSize) return data

  // For arrays, trim to fit
  if (Array.isArray(data)) {
    return trimArrayToSize(data, maxSize)
  }

  // For objects with an array property (common pattern), try to trim that
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>

    // Look for array properties to trim
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        const arrSize = estimateSize(obj[key])
        if (arrSize > maxSize * 0.8) { // If array is > 80% of budget
          const trimmed = trimArrayToSize(obj[key] as unknown[], maxSize * 0.8)
          return { ...obj, [key]: trimmed }
        }
      }
    }
  }

  // Can't trim - return as-is but log warning
  console.warn(`[MemoryManager] Cannot trim ${dataKey} (${formatBytes(currentSize)} > ${formatBytes(maxSize)})`)
  return data
}

// ============================================================================
// Memory Cleanup
// ============================================================================

/**
 * Information about a data state for memory management
 */
export interface MemoryStats {
  dataKey: DataKey
  sizeBytes: number
  lastUpdated: number | null
  hasSubscribers: boolean
}

/**
 * Get memory stats for all data states
 */
export function getMemoryStats(
  dataStates: Map<DataKey, DataState>,
  subscriptions: Map<DataKey, Set<unknown>>
): MemoryStats[] {
  const stats: MemoryStats[] = []

  for (const [key, state] of dataStates) {
    stats.push({
      dataKey: key,
      sizeBytes: estimateSize(state.data),
      lastUpdated: state.lastUpdated,
      hasSubscribers: (subscriptions.get(key)?.size ?? 0) > 0,
    })
  }

  return stats.sort((a, b) => b.sizeBytes - a.sizeBytes)
}

/**
 * Get total estimated memory usage
 */
export function getTotalMemoryUsage(dataStates: Map<DataKey, DataState>): number {
  let total = 0
  for (const state of dataStates.values()) {
    total += estimateSize(state.data)
  }
  return total
}

/**
 * Identify keys that can be cleared from memory
 * Returns keys that:
 * - Have no active subscribers
 * - Haven't been accessed recently
 * - Are not in the critical/high priority list for current route
 */
export function getCleanupCandidates(
  dataStates: Map<DataKey, DataState>,
  subscriptions: Map<DataKey, Set<unknown>>,
  priorityKeys: Set<DataKey>,
  maxAgeMs: number = UNUSED_DATA_TIMEOUT_MS
): DataKey[] {
  const now = Date.now()
  const candidates: DataKey[] = []

  for (const [key, state] of dataStates) {
    // Skip if actively subscribed
    if ((subscriptions.get(key)?.size ?? 0) > 0) continue

    // Skip if priority key for current route
    if (priorityKeys.has(key)) continue

    // Skip if recently updated
    if (state.lastUpdated && (now - state.lastUpdated) < maxAgeMs) continue

    // Skip if no data (nothing to clear)
    if (!state.data) continue

    candidates.push(key)
  }

  return candidates
}

/**
 * Clear data from memory for specified keys
 * Keeps the state but sets data to null
 */
export function clearDataFromMemory(
  dataStates: Map<DataKey, DataState>,
  keys: DataKey[]
): number {
  let freedBytes = 0

  for (const key of keys) {
    const state = dataStates.get(key)
    if (state?.data) {
      freedBytes += estimateSize(state.data)
      state.data = null
      state.stale = true
      console.log(`[MemoryManager] Cleared ${key} from memory`)
    }
  }

  return freedBytes
}

/**
 * Log memory stats summary
 */
export function logMemoryStats(
  dataStates: Map<DataKey, DataState>,
  subscriptions: Map<DataKey, Set<unknown>>
): void {
  const stats = getMemoryStats(dataStates, subscriptions)
  const total = getTotalMemoryUsage(dataStates)

  console.log(`[MemoryManager] Total estimated usage: ${formatBytes(total)}`)
  console.log('[MemoryManager] Top 5 by size:')

  for (const stat of stats.slice(0, 5)) {
    const subs = subscriptions.get(stat.dataKey)?.size ?? 0
    console.log(`  ${stat.dataKey}: ${formatBytes(stat.sizeBytes)} (${subs} subscribers)`)
  }
}
