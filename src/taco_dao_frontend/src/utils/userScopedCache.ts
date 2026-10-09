/**
 * localStorage cache for one signed-in user's data (vault activity, token
 * balances), so a reload shows the last known values while fresh ones load.
 *
 * Entries are keyed by network and principal: they are only ever read back for
 * the same account on the same network. Signing out removes the account's
 * entries, and a sign in check that finds no session (it expired) removes all
 * of them. Values use the worker transfer format, so BigInt, Principal and
 * Uint8Array survive JSON.
 */

import { getEffectiveNetwork } from '../config/network-config'
import { serializeForTransfer, deserializeFromTransfer } from '../workers/shared/transfer'

const PREFIX = 'taco_user_cache'
// Kept by the taco store while this device has a session, removed on sign out.
// A tab still signed in from before must not write an account's data back
// after that account signed out in another tab.
const SESSION_HINT_KEY = 'taco_session_hint'

const keyFor = (principal: string, name: string): string =>
  `${PREFIX}:${getEffectiveNetwork()}:${principal}:${name}`

export function readUserCache<T>(principal: string, name: string): { value: T; savedAt: number } | null {
  if (!principal) return null
  try {
    const raw = localStorage.getItem(keyFor(principal, name))
    if (!raw) return null
    const entry = JSON.parse(raw)
    return { value: deserializeFromTransfer(entry.value) as T, savedAt: Number(entry.savedAt) || 0 }
  } catch {
    return null
  }
}

export function writeUserCache(principal: string, name: string, value: unknown): void {
  if (!principal) return
  try {
    if (localStorage.getItem(SESSION_HINT_KEY) === null) return
    localStorage.setItem(
      keyFor(principal, name),
      JSON.stringify({ savedAt: Date.now(), value: serializeForTransfer(value) })
    )
  } catch { /* storage full or blocked: the cache is optional */ }
}

/** Remove every cached entry of this principal, on all networks */
export function clearUserCache(principal: string): void {
  if (!principal) return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${PREFIX}:`) && key.includes(`:${principal}:`)) keys.push(key)
    }
    for (const key of keys) localStorage.removeItem(key)
  } catch { /* ignore */ }
}

/** Remove every account's cached entries, when no account is signed in on this device */
export function clearAllUserCache(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${PREFIX}:`)) keys.push(key)
    }
    for (const key of keys) localStorage.removeItem(key)
  } catch { /* ignore */ }
}
