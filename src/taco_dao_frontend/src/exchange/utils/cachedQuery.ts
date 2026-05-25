/**
 * cachedQuery — a shared, deduped, optionally-persisted async query primitive.
 *
 * One module-scope instance per logical query (e.g. `user.lp`, `pair.kline:X:60s`)
 * means every component reading `query.data` sees the same Ref reactively. The
 * 3-fetch storm on Pro→Portfolio navigation collapses to a single in-flight
 * call because `refresh()` coalesces concurrent callers onto the same promise.
 *
 * Semantics:
 *   ensure(staleMs)   → returns cached data immediately when present; kicks a
 *                       background refresh only if older than `staleMs`. This
 *                       is the cache-first read path used by views.
 *   refresh()         → forces a fetch but returns the in-flight promise if
 *                       one is pending. Used by mutation handlers and pollers.
 *   prefetch()        → fire-and-forget refresh, no-op when fresh. Used by
 *                       hover-intent prefetching from nav links.
 *   invalidate()      → reset `lastFetchedAt` to 0 (keeps in-memory data). The
 *                       next ensure() will refetch in the background.
 *   clear()           → drop in-memory + persisted state. Use on logout for
 *                       principal-scoped queries.
 *
 * Persisted entries are stored via persistCache (bigint-safe). Principal-scoped
 * keys are namespaced with the current principal so logout/login can't leak
 * one user's positions into another's UI.
 */

import { ref, shallowRef, watch, type Ref } from 'vue'
import { readCacheEntry, writeCache, removeCache } from './persistCache'

export interface CachedQueryOpts<T> {
  /** Logical key, e.g. 'user.lp' or `pair.kline:${pair}:${interval}`. */
  key: string
  /** Async fetcher. Errors are caught; lastFetchedAt is not bumped on error. */
  fetcher: () => Promise<T>
  /** When true, persist results to localStorage (survives F5). */
  persist?: boolean
  /** Default staleness window for ensure() when caller doesn't pass one. */
  maxAgeMs?: number
  /** When provided, namespace persisted key by current principal. */
  principalRef?: Ref<string>
  /** Use shallowRef for the data — recommended for large arrays. */
  shallow?: boolean
  /** Reject after this many ms (no retry, just rejects the in-flight promise). */
  timeoutMs?: number
  /** Hook fired after each successful refresh (post-write). */
  onSuccess?: (value: T) => void
}

export interface CachedQuery<T> {
  data: Ref<T | null>
  lastFetchedAt: Ref<number>
  isFetching: Ref<boolean>
  error: Ref<unknown>
  ensure: (staleMs?: number) => Promise<T | null>
  refresh: () => Promise<T | null>
  prefetch: () => void
  invalidate: () => void
  clear: () => void
}

const DEFAULT_TTL = 5 * 60_000

export function createCachedQuery<T>(opts: CachedQueryOpts<T>): CachedQuery<T> {
  const dataRef: Ref<T | null> = opts.shallow
    ? (shallowRef<T | null>(null) as Ref<T | null>)
    : (ref<T | null>(null) as Ref<T | null>)
  const lastFetchedAt = ref(0)
  const isFetching = ref(false)
  const errorRef = ref<unknown>(null)
  const ttl = opts.maxAgeMs ?? DEFAULT_TTL

  let inFlight: Promise<T | null> | null = null
  let hydratedFor: string | null | undefined = undefined

  function persistKey(): string {
    return opts.principalRef
      ? `query:${opts.key}:${opts.principalRef.value || 'anon'}`
      : `query:${opts.key}`
  }

  function hydrateFromCache(): void {
    if (!opts.persist) return
    const p = opts.principalRef?.value ?? null
    if (hydratedFor === p) return
    hydratedFor = p
    if (opts.principalRef && !p) {
      // Anonymous — clear any leftover state from a different principal.
      dataRef.value = null
      lastFetchedAt.value = 0
      return
    }
    const entry = readCacheEntry<T>(persistKey())
    if (entry) {
      dataRef.value = entry.v
      lastFetchedAt.value = entry.t
    } else {
      dataRef.value = null
      lastFetchedAt.value = 0
    }
  }

  // Non-principal-scoped: hydrate synchronously at construct so first paint sees data.
  if (opts.persist && !opts.principalRef) hydrateFromCache()

  // Principal-scoped: hydrate every time the principal changes (covers cold-load auth restore + identity switch).
  if (opts.persist && opts.principalRef) {
    watch(opts.principalRef, () => {
      hydratedFor = undefined
      hydrateFromCache()
    }, { immediate: true })
  }

  async function refresh(): Promise<T | null> {
    if (inFlight) return inFlight
    isFetching.value = true
    errorRef.value = null
    const principalAtStart = opts.principalRef?.value ?? null
    const promise: Promise<T | null> = (async () => {
      try {
        const fetched = opts.timeoutMs
          ? await raceTimeout(opts.fetcher(), opts.timeoutMs, opts.key)
          : await opts.fetcher()
        // Drop late results if principal flipped mid-flight.
        if ((opts.principalRef?.value ?? null) !== principalAtStart) return null
        // Defensive: nullish results must not blank good cache (or be persisted
        // by writeCache below — turning a transient hiccup into a sticky empty
        // state on reload). Uses `!= null` so legitimately-falsy values like
        // `0n`, `0`, `''`, `[]`, `false` still write through.
        if (fetched == null) return dataRef.value
        dataRef.value = fetched
        lastFetchedAt.value = Date.now()
        if (opts.persist) writeCache(persistKey(), fetched)
        opts.onSuccess?.(fetched)
        return fetched
      } catch (err) {
        errorRef.value = err
        // eslint-disable-next-line no-console
        console.error(`[cachedQuery:${opts.key}] fetch failed:`, err)
        return null
      } finally {
        isFetching.value = false
      }
    })()
    inFlight = promise
    promise.finally(() => { if (inFlight === promise) inFlight = null })
    return promise
  }

  async function ensure(staleMs?: number): Promise<T | null> {
    const window = staleMs ?? ttl
    if (opts.persist) hydrateFromCache()
    const isStale = Date.now() - lastFetchedAt.value > window
    if (!isStale && dataRef.value !== null) return dataRef.value
    if (dataRef.value !== null) {
      // Stale-while-revalidate: return cached value now, refresh in background.
      void refresh()
      return dataRef.value
    }
    return refresh()
  }

  function prefetch(): void {
    if (Date.now() - lastFetchedAt.value <= ttl && dataRef.value !== null) return
    void refresh()
  }

  function invalidate(): void {
    lastFetchedAt.value = 0
  }

  function clear(): void {
    dataRef.value = null
    lastFetchedAt.value = 0
    inFlight = null
    errorRef.value = null
    if (opts.persist) removeCache(persistKey())
  }

  return {
    data: dataRef,
    lastFetchedAt,
    isFetching,
    error: errorRef,
    ensure,
    refresh,
    prefetch,
    invalidate,
    clear,
  }
}

function raceTimeout<T>(promise: Promise<T>, timeoutMs: number, key: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`[cachedQuery:${key}] timed out after ${timeoutMs}ms`)),
      timeoutMs,
    )
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

/**
 * Factory variant — memoize cachedQuery instances by a derived key. Use for
 * per-pair / per-interval queries (orderbook, kline, current-liquidity) so
 * navigating between pairs reuses the same query instance for each pair
 * rather than leaking a fresh instance per visit.
 */
export function createKeyedQueryFactory<K extends string, T>(
  build: (key: K) => CachedQuery<T>,
): (key: K) => CachedQuery<T> {
  const cache = new Map<K, CachedQuery<T>>()
  return (key: K) => {
    let q = cache.get(key)
    if (!q) {
      q = build(key)
      cache.set(key, q)
    }
    return q
  }
}
