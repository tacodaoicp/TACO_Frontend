/**
 * Transfer-format (de)serialization for postMessage between a worker and the
 * main thread. Standalone copy of the format used by the DAO data worker
 * (fetch-functions.ts), kept separate so the exchange query worker can import it
 * WITHOUT pulling in fetch-functions' many canister-IDL imports (bundle bloat).
 * The wire format must stay identical:
 *   bigint     -> "__bigint__<digits>"
 *   Uint8Array -> "__uint8array__<comma-separated-bytes>"
 *   Principal  -> "__principal__<text>"
 */
import { Principal } from '@dfinity/principal'

const principalCache = new Map<string, Principal>()
const MAX_PRINCIPAL_CACHE_SIZE = 1000
const principalToTextCache = new WeakMap<Principal, string>()

function getCachedPrincipal(text: string): Principal {
  let p = principalCache.get(text)
  if (!p) {
    p = Principal.fromText(text)
    if (principalCache.size >= MAX_PRINCIPAL_CACHE_SIZE) {
      const firstKey = principalCache.keys().next().value
      if (firstKey) principalCache.delete(firstKey)
    }
    principalCache.set(text, p)
    principalToTextCache.set(p, text)
  }
  return p
}

function getCachedPrincipalText(p: Principal): string {
  let t = principalToTextCache.get(p)
  if (!t) { t = p.toText(); principalToTextCache.set(p, t) }
  return t
}

export function serializeForTransfer(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return `__bigint__${obj.toString()}`
  if (obj instanceof Uint8Array) return `__uint8array__${Array.from(obj).join(',')}`
  if (obj instanceof Principal) return `__principal__${getCachedPrincipalText(obj)}`
  if (Array.isArray(obj)) return obj.map(serializeForTransfer)
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = serializeForTransfer(v)
    return out
  }
  return obj
}

export function deserializeFromTransfer(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') {
    if (obj.startsWith('__bigint__')) return BigInt(obj.slice(10))
    if (obj.startsWith('__uint8array__')) {
      const s = obj.slice(14)
      return new Uint8Array(s ? s.split(',').map(Number) : [])
    }
    if (obj.startsWith('__principal__')) return getCachedPrincipal(obj.slice(13))
    return obj
  }
  if (Array.isArray(obj)) return obj.map(deserializeFromTransfer)
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = deserializeFromTransfer(v)
    return out
  }
  return obj
}
