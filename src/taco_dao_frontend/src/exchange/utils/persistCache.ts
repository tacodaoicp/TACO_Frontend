/**
 * Tiny TTL-based localStorage cache for the exchange store.
 *
 * Used to make F5 feel instant: the store paints saved values on first load,
 * then the canister fetches refresh them in the background.
 *
 * Bigint-safe via a `__BI__` string prefix on serialize. Anything else that
 * doesn't roundtrip through JSON (Principal class instances, Maps, etc.)
 * must be normalized to plain JSON shapes by the caller before write.
 *
 * Namespace bump (`v1` → `v2` …) invalidates all entries — use when the
 * cached shape changes incompatibly.
 */

const NAMESPACE = 'taco_exchange_cache_v1'

interface CacheEntry<T> {
  v: T
  t: number
}

function bigintReplacer(_key: string, v: any): any {
  return typeof v === 'bigint' ? `__BI__${v.toString()}` : v
}
function bigintReviver(_key: string, v: any): any {
  if (typeof v === 'string' && v.startsWith('__BI__')) return BigInt(v.slice(6))
  return v
}

/** True when an entry written at `t` is no older than `maxAgeMs`. An entry
 *  stamped in the future (clock moved back) is never fresh: treating it as
 *  fresh would freeze it for the clock offset plus the window. */
export function isWithinAge(t: number, maxAgeMs: number): boolean {
  const age = Date.now() - t
  return age >= 0 && age <= maxAgeMs
}

export function readCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(`${NAMESPACE}:${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw, bigintReviver) as CacheEntry<T>
    if (!entry || typeof entry.t !== 'number') return null
    if (!isWithinAge(entry.t, maxAgeMs)) return null
    return entry.v
  } catch {
    return null
  }
}

/**
 * Like readCache but returns the timestamp too, and never applies a TTL filter.
 * cachedQuery needs the original write time so its `lastFetchedAt` survives a
 * page reload — otherwise an instant refetch would fire even though the data
 * on screen is seconds old.
 */
export function readCacheEntry<T>(key: string): { v: T; t: number } | null {
  try {
    const raw = localStorage.getItem(`${NAMESPACE}:${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw, bigintReviver) as CacheEntry<T>
    if (!entry || typeof entry.t !== 'number') return null
    return entry
  } catch {
    return null
  }
}

export function removeCache(key: string): void {
  try { localStorage.removeItem(`${NAMESPACE}:${key}`) } catch { /* ignore */ }
}

// ── Size control ──
// klineRange and orderbook entries are saved per pair, timeframe and depth, and
// Easy mode warms them for every pair the user settles on. Without a cap they
// fill the origin's storage quota, after which every other write (and the
// journals that share the origin) fails. Only the most recently written keys
// of each family are kept.
const LRU_FAMILIES: Record<string, number> = {
  'query:klineRange:': 3,
  'query:orderbook:': 3,
}
const LRU_INDEX_PREFIX = `${NAMESPACE}:lru:`

function lruFamily(key: string): string | null {
  for (const fam of Object.keys(LRU_FAMILIES)) if (key.startsWith(fam)) return fam
  return null
}
function readLruIndex(fam: string): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(LRU_INDEX_PREFIX + fam) || '[]')
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : []
  } catch { return [] }
}
function touchLru(key: string): void {
  const fam = lruFamily(key)
  if (!fam) return
  try {
    let list = readLruIndex(fam)
    if (list[0] === key) return
    list = [key, ...list.filter(k => k !== key)]
    const max = LRU_FAMILIES[fam]
    for (const old of list.slice(max)) localStorage.removeItem(`${NAMESPACE}:${old}`)
    localStorage.setItem(LRU_INDEX_PREFIX + fam, JSON.stringify(list.slice(0, max)))
  } catch { /* best effort */ }
}

function isQuotaError(e: unknown): boolean {
  const err = e as { name?: string; code?: number } | null
  return !!err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)
}

/**
 * Remove exchange cache entries, largest first, until about `needed`
 * characters are freed. Never touches keys outside the cache namespace (auth,
 * journals, settings) and never `keepKey`. Returns the characters freed.
 */
export function freeCacheSpace(needed: number, keepKey?: string): number {
  let freed = 0
  try {
    const entries: Array<[string, number]> = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(NAMESPACE + ':') || k === keepKey || k.startsWith(LRU_INDEX_PREFIX)) continue
      entries.push([k, (localStorage.getItem(k) || '').length])
    }
    entries.sort((a, b) => b[1] - a[1])
    for (const [k, n] of entries) {
      if (freed >= needed) break
      localStorage.removeItem(k)
      freed += n
    }
  } catch { /* ignore */ }
  return freed
}

/** Run a localStorage write; on a quota error free cache space and retry once.
 *  For the journals that share the origin with this cache. Throws only when
 *  the retry fails too. */
export function setItemWithCacheEviction(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    if (!isQuotaError(e)) throw e
    freeCacheSpace(value.length * 2)
    localStorage.setItem(key, value)
  }
}

let warnedQuota = false
export function writeCache<T>(key: string, value: T): void {
  const fullKey = `${NAMESPACE}:${key}`
  let raw: string
  try {
    const entry: CacheEntry<T> = { v: value, t: Date.now() }
    raw = JSON.stringify(entry, bigintReplacer)
  } catch {
    return // serialization failed, nothing to save
  }
  try {
    localStorage.setItem(fullKey, raw)
  } catch (e) {
    if (!isQuotaError(e)) return
    freeCacheSpace(raw.length, fullKey)
    try {
      localStorage.setItem(fullKey, raw)
    } catch {
      // Still full: drop this key's old value so a stale copy can't outlive
      // the fresh data in memory, and say so once.
      try { localStorage.removeItem(fullKey) } catch { /* ignore */ }
      if (!warnedQuota) { warnedQuota = true; console.warn('[persistCache] storage full, cache entry not saved:', key) }
      return
    }
  }
  touchLru(key)
}

/** Remove every saved per user entry (query:user.*) of `principal`. Called on
 *  logout and account switch so one account's data never stays readable. */
export function purgeUserCache(principal: string): void {
  if (!principal) return
  try {
    const prefix = `${NAMESPACE}:query:user.`
    const suffix = `:${principal}`
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix) && k.endsWith(suffix)) doomed.push(k)
    }
    for (const k of doomed) localStorage.removeItem(k)
  } catch { /* ignore */ }
}

/**
 * One pass at init: drop klineRange and orderbook entries beyond the kept
 * recent ones, the legacy single copy keys (tokens, info, treasury, fees; the
 * boot.* query entries are the only saved copy now) and any other version of
 * this cache's namespace.
 */
export function sweepCache(): void {
  try {
    const keep = new Set<string>()
    for (const fam of Object.keys(LRU_FAMILIES)) for (const k of readLruIndex(fam)) keep.add(`${NAMESPACE}:${k}`)
    const legacy = new Set(['tokens', 'info', 'treasury', 'fees'].map(k => `${NAMESPACE}:${k}`))
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('taco_exchange_cache_') && !k.startsWith(NAMESPACE + ':')) doomed.push(k)
      else if (legacy.has(k)) doomed.push(k)
      else if (k.startsWith(NAMESPACE + ':') && !k.startsWith(LRU_INDEX_PREFIX)
               && lruFamily(k.slice(NAMESPACE.length + 1)) && !keep.has(k)) doomed.push(k)
    }
    for (const k of doomed) localStorage.removeItem(k)
  } catch { /* ignore */ }
}

export function clearCache(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(NAMESPACE + ':')) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
}
