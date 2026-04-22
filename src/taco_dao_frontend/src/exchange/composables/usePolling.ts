/**
 * Composable for visibility-aware polling.
 * Based on Section 16 of FRONTEND_DEV_GUIDE.md.
 *
 * The exchange has no WebSocket/push. All data must be polled.
 * This composable:
 * - Pauses polling when the browser tab is hidden
 * - Automatically cleans up on component unmount
 * - Supports dynamic interval changes
 * - Handles errors gracefully (logs, doesn't crash)
 */

import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch, type Ref } from 'vue'

export interface PollingOptions {
  /** Polling interval in milliseconds */
  interval: number
  /** Whether to poll immediately on start (default: true) */
  immediate?: boolean
  /** Whether polling is enabled (can be a ref to toggle dynamically) */
  enabled?: Ref<boolean> | boolean
  /** Error callback */
  onError?: (err: unknown) => void
}

export function usePolling(
  fn: () => Promise<void>,
  options: PollingOptions,
) {
  const {
    interval,
    immediate = true,
    onError,
  } = options

  const isPolling = ref(false)
  const lastError = ref<unknown>(null)
  const pollCount = ref(0)

  let timerId: ReturnType<typeof setTimeout> | null = null
  let isVisible = true
  let isMounted = false

  // Resolve enabled to a ref
  const enabled = typeof options.enabled === 'boolean'
    ? ref(options.enabled)
    : options.enabled ?? ref(true)

  async function execute() {
    if (!isVisible || !enabled.value || !isMounted) return

    isPolling.value = true
    try {
      await fn()
      lastError.value = null
      pollCount.value++
    } catch (err) {
      lastError.value = err
      if (onError) onError(err)
      else console.error('[usePolling] Error:', err)
    } finally {
      isPolling.value = false
    }
  }

  function schedule() {
    if (timerId !== null) clearTimeout(timerId)
    if (!enabled.value || !isMounted) return

    timerId = setTimeout(async () => {
      await execute()
      schedule()
    }, interval)
  }

  function start() {
    if (immediate) {
      execute().then(schedule)
    } else {
      schedule()
    }
  }

  function stop() {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  // Visibility change handler
  function onVisibilityChange() {
    const wasVisible = isVisible
    isVisible = document.visibilityState === 'visible'

    if (isVisible && !wasVisible && enabled.value && isMounted) {
      // Tab became visible — poll immediately and reschedule
      execute().then(schedule)
    } else if (!isVisible) {
      stop()
    }
  }

  // Watch enabled state
  watch(enabled, (newVal) => {
    if (newVal && isVisible && isMounted) {
      start()
    } else {
      stop()
    }
  })

  onMounted(() => {
    isMounted = true
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (enabled.value) start()
  })

  onUnmounted(() => {
    isMounted = false
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  // keep-alive support: resume/pause when component is activated/deactivated
  onActivated(() => {
    isMounted = true
    if (enabled.value && isVisible) start()
  })

  onDeactivated(() => {
    stop()
  })

  return {
    isPolling,
    lastError,
    pollCount,
    /** Force an immediate poll */
    refresh: execute,
    /** Pause polling */
    pause: stop,
    /** Resume polling */
    resume: start,
  }
}
