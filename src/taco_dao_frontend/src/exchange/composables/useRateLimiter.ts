/**
 * Composable for tracking the exchange rate limit budget.
 * The exchange canister allows 21 update calls per 90-second window.
 *
 * This composable provides:
 * - Live countdown of remaining calls
 * - Gate function to prevent exceeding the limit
 * - Visual severity for UI indicators
 */

import { ref, computed, onUnmounted } from 'vue'

const WINDOW_MS = 90_000  // 90 seconds
const MAX_CALLS = 21

export function useRateLimiter() {
  const callTimestamps = ref<number[]>([])

  // Prune expired timestamps periodically
  const pruneInterval = setInterval(() => {
    const now = Date.now()
    callTimestamps.value = callTimestamps.value.filter(t => now - t < WINDOW_MS)
  }, 5000)

  onUnmounted(() => clearInterval(pruneInterval))

  const recentCalls = computed(() => {
    const now = Date.now()
    return callTimestamps.value.filter(t => now - t < WINDOW_MS).length
  })

  const callsRemaining = computed(() => Math.max(0, MAX_CALLS - recentCalls.value))

  const canCall = computed(() => callsRemaining.value > 0)

  /**
   * UI severity for the rate limit indicator.
   * - 'hidden': > 10 calls remaining (don't show)
   * - 'info': 6-10 calls remaining
   * - 'warning': 3-5 calls remaining
   * - 'danger': 0-2 calls remaining
   */
  const severity = computed((): 'hidden' | 'info' | 'warning' | 'danger' => {
    const remaining = callsRemaining.value
    if (remaining > 10) return 'hidden'
    if (remaining > 5) return 'info'
    if (remaining > 2) return 'warning'
    return 'danger'
  })

  /**
   * Estimated seconds until a call slot frees up.
   * Returns 0 if calls are available.
   */
  const nextSlotInSeconds = computed(() => {
    if (canCall.value) return 0
    const now = Date.now()
    const oldest = callTimestamps.value
      .filter(t => now - t < WINDOW_MS)
      .sort((a, b) => a - b)[0]
    if (!oldest) return 0
    return Math.ceil((WINDOW_MS - (now - oldest)) / 1000)
  })

  /** Record a new update call. Call this before every exchange update. */
  function trackCall() {
    callTimestamps.value = [...callTimestamps.value, Date.now()]
  }

  /** Guard: throws if rate limit would be exceeded. */
  function guardCall() {
    if (!canCall.value) {
      throw new Error(`Rate limit reached. Try again in ${nextSlotInSeconds.value}s.`)
    }
    trackCall()
  }

  return {
    callsRemaining,
    recentCalls,
    canCall,
    severity,
    nextSlotInSeconds,
    trackCall,
    guardCall,
  }
}
