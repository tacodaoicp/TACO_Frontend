/**
 * Tiny TTL-based localStorage cache for the exchange store.
 *
 * Used to make F5 feel instant: initExchange hydrates the store from the
 * cache synchronously (so views see populated state on first paint), then
 * fires the canister fetches in the background to refresh.
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

export function readCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(`${NAMESPACE}:${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw, bigintReviver) as CacheEntry<T>
    if (!entry || typeof entry.t !== 'number') return null
    if (Date.now() - entry.t > maxAgeMs) return null
    return entry.v
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { v: value, t: Date.now() }
    localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(entry, bigintReplacer))
  } catch {
    // Quota exceeded or serialization failed — silently degrade.
  }
}

export function clearCache(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(NAMESPACE + ':')) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
}
