/**
 * Exponential Backoff for SharedWorker Retry Logic
 *
 * Progression: 1s -> 2s -> 4s -> 8s -> 16s -> 32s -> 50s (max)
 */

import type { DataKey } from '../types'

export interface BackoffConfig {
  initialDelayMs: number
  maxDelayMs: number
  multiplier: number
  jitter: boolean
}

const DEFAULT_CONFIG: BackoffConfig = {
  initialDelayMs: 1000,    // 1 second
  maxDelayMs: 50000,       // 50 seconds (as specified)
  multiplier: 2,
  jitter: true,            // Add randomness to prevent thundering herd
}

/**
 * Calculate backoff delay for a given retry count
 */
export function calculateBackoffDelay(
  retryCount: number,
  config: BackoffConfig = DEFAULT_CONFIG
): number {
  const { initialDelayMs, maxDelayMs, multiplier, jitter } = config

  // Calculate exponential delay
  let delay = initialDelayMs * Math.pow(multiplier, retryCount)

  // Cap at max delay
  delay = Math.min(delay, maxDelayMs)

  // Add jitter (+/- 15%) to prevent thundering herd
  if (jitter) {
    const jitterRange = delay * 0.15
    delay += (Math.random() - 0.5) * 2 * jitterRange
  }

  return Math.round(delay)
}

/**
 * Tracks backoff state for multiple data keys
 */
export class BackoffTracker {
  private retryCounts = new Map<DataKey, number>()
  private lastAttempts = new Map<DataKey, number>()
  private config: BackoffConfig

  constructor(config: Partial<BackoffConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if we can retry fetching this dataKey
   */
  canRetry(dataKey: DataKey): boolean {
    const lastAttempt = this.lastAttempts.get(dataKey)
    if (!lastAttempt) return true

    const retryCount = this.retryCounts.get(dataKey) || 0
    const requiredDelay = calculateBackoffDelay(retryCount, this.config)

    return Date.now() - lastAttempt >= requiredDelay
  }

  /**
   * Record that we're attempting to fetch
   */
  recordAttempt(dataKey: DataKey): void {
    this.lastAttempts.set(dataKey, Date.now())
  }

  /**
   * Record a failed fetch attempt
   */
  recordFailure(dataKey: DataKey): void {
    const current = this.retryCounts.get(dataKey) || 0
    this.retryCounts.set(dataKey, current + 1)
  }

  /**
   * Record a successful fetch - resets backoff
   */
  recordSuccess(dataKey: DataKey): void {
    this.retryCounts.delete(dataKey)
    this.lastAttempts.delete(dataKey)
  }

  /**
   * Get time until next retry is allowed
   */
  getTimeUntilRetry(dataKey: DataKey): number {
    const lastAttempt = this.lastAttempts.get(dataKey)
    if (!lastAttempt) return 0

    const retryCount = this.retryCounts.get(dataKey) || 0
    const requiredDelay = calculateBackoffDelay(retryCount, this.config)
    const elapsed = Date.now() - lastAttempt

    return Math.max(0, requiredDelay - elapsed)
  }

  /**
   * Get next retry timestamp
   */
  getNextRetryTime(dataKey: DataKey): number {
    const lastAttempt = this.lastAttempts.get(dataKey) || Date.now()
    const retryCount = this.retryCounts.get(dataKey) || 0
    return lastAttempt + calculateBackoffDelay(retryCount, this.config)
  }

  /**
   * Get current retry count for a dataKey
   */
  getRetryCount(dataKey: DataKey): number {
    return this.retryCounts.get(dataKey) || 0
  }

  /**
   * Check if a dataKey has failed too many times (for logging/alerting)
   */
  isInBackoff(dataKey: DataKey): boolean {
    return !this.canRetry(dataKey)
  }

  /**
   * Reset backoff for a specific dataKey
   */
  reset(dataKey: DataKey): void {
    this.retryCounts.delete(dataKey)
    this.lastAttempts.delete(dataKey)
  }

  /**
   * Reset all backoff tracking
   */
  resetAll(): void {
    this.retryCounts.clear()
    this.lastAttempts.clear()
  }

  /**
   * Get all keys currently in backoff
   */
  getKeysInBackoff(): DataKey[] {
    const result: DataKey[] = []
    for (const [dataKey] of this.retryCounts) {
      if (!this.canRetry(dataKey)) {
        result.push(dataKey)
      }
    }
    return result
  }

  /**
   * Get backoff statistics
   */
  getStats(): {
    totalTracked: number
    inBackoff: number
    maxRetryCount: number
  } {
    let maxRetryCount = 0
    let inBackoff = 0

    for (const [dataKey, count] of this.retryCounts) {
      if (count > maxRetryCount) maxRetryCount = count
      if (!this.canRetry(dataKey)) inBackoff++
    }

    return {
      totalTracked: this.retryCounts.size,
      inBackoff,
      maxRetryCount,
    }
  }
}
