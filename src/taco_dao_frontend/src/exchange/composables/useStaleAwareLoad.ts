/**
 * Stale-aware tab loading.
 *
 * Wraps the recurring pattern of:
 *   onMounted   → initial load + start polling + subscribe to mutation events
 *   onUnmounted → stop polling + unsubscribe
 *   onActivated → IMMEDIATE refetch + start polling   ← the slow bit
 *   onDeactivated → stop polling
 *
 * The slow bit is replaced with `loadIfStale`: only refetch when the cached
 * data is older than the polling interval. Switching back to a tab within
 * the freshness window resumes the poller without firing an extra round-trip,
 * which is what makes tab flips feel instant.
 *
 * Caveats handled internally:
 *  • lastFetchedAt only updates after the load resolves successfully —
 *    a failed fetch leaves the timestamp stale so the next activate retries.
 *  • Mutation events go through the same `load()` path, so they bump the
 *    timestamp and prevent immediate re-fetching by activate.
 *  • Pair / auth / token-list changes can reset freshness via `invalidate()`
 *    or the optional `refetchOn*` flags.
 */

import { onActivated, onDeactivated, onMounted, onUnmounted, watch } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { isVisible, onVisible } from './useVisibilityAware'

type MutationKind = 'swap' | 'order' | 'revoke' | 'lp' | 'claim' | 'referral'

export interface StaleAwareOptions {
  /**
   * Fetches and writes reactive state. Should manage its own loading flag if
   * needed; the composable does not touch it. Errors are caught internally
   * (lastFetchedAt is not updated on throw) but the function is welcome to
   * handle/log its own errors too.
   */
  load: () => Promise<unknown>
  /**
   * Both the polling interval AND the freshness window (in ms). On activate,
   * if `Date.now() - lastFetchedAt` is below this, the activate refetch is
   * skipped and the poller resumes.
   */
  staleMs: number
  /**
   * Filter mutation events by kind. Omit (or empty array) to fire `load()`
   * on every mutation.
   */
  mutationKinds?: MutationKind[]
  /**
   * If true, refresh when `store.isAuthenticated` flips false → true.
   * Useful for tabs whose data requires auth (orders, balances, LP, …) so a
   * cold-F5 picks up data the moment the cached identity restores.
   */
  refetchOnAuth?: boolean
  /**
   * If true, refresh when `store.tokens` populates (length 0 → > 0).
   * Useful for tabs that loop over tokens (e.g. WalletTab balances).
   */
  refetchOnTokens?: boolean
}

export function useStaleAwareLoad(opts: StaleAwareOptions) {
  const store = useExchangeStore()
  const staleMs = opts.staleMs
  let lastFetchedAt = 0
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let offMutation: (() => void) | null = null

  async function load(): Promise<void> {
    try {
      await opts.load()
      lastFetchedAt = Date.now()
    } catch (err) {
      // Don't update timestamp on failure — next activate will retry.
      console.error('[useStaleAwareLoad] load failed:', err)
    }
  }

  async function loadIfStale(): Promise<void> {
    if (Date.now() - lastFetchedAt > staleMs) await load()
  }

  // Visibility-aware ticker: skip the network call while the tab is hidden;
  // on the hidden→visible flip, do one immediate refresh, then resume normal
  // cadence. Saves a steady stream of canister calls when the user has the
  // browser in another tab/window.
  function tick() {
    if (!isVisible.value) return
    load()
  }
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(tick, staleMs)
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }
  let offVisible: (() => void) | null = null

  onMounted(() => {
    load()
    startPolling()
    offMutation = store.onMutation((kind) => {
      if (!opts.mutationKinds || opts.mutationKinds.length === 0
          || opts.mutationKinds.includes(kind as MutationKind)) {
        load()
      }
    })
    offVisible = onVisible(() => { loadIfStale() })
  })
  onUnmounted(() => {
    stopPolling()
    offMutation?.()
    offMutation = null
    offVisible?.()
    offVisible = null
  })
  onActivated(() => {
    loadIfStale()
    startPolling()
  })
  onDeactivated(() => {
    stopPolling()
  })

  if (opts.refetchOnAuth) {
    watch(() => store.isAuthenticated, (v, prev) => { if (v && !prev) load() })
  }
  if (opts.refetchOnTokens) {
    watch(() => store.tokens.length, (n, prev) => {
      if (n > 0 && (prev ?? 0) === 0) load()
    })
  }

  return {
    /** Force an immediate fetch (bumps lastFetchedAt on success). */
    load,
    /** Fetch only if data is older than staleMs. */
    loadIfStale,
    /** Reset the freshness clock so the next loadIfStale forces a fetch. */
    invalidate: () => { lastFetchedAt = 0 },
  }
}
