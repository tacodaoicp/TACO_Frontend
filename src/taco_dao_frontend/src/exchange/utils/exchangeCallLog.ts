/**
 * Shared log of exchange update calls, per principal, across every exchange tab
 * of this browser.
 *
 * The exchange's spam limiter counts update calls per principal in a 90 second
 * window: the 10th call of a window adds a warning (more than 11 warnings in a
 * day is a day ban) and the 21st call is refused (a second refusal in a day is
 * a day ban that also blocks recovery). The old client limiter was an in memory
 * list per tab, so a reload, a second tab or easy mode in another tab started
 * again from zero.
 *
 * Each tab appends to its own key (`taco_exchange_calls:<principal>:<tabId>`),
 * so two tabs never overwrite each other; readers sum every key of the
 * principal. A sliding 90 s count is never lower than the exchange's fixed
 * window count, so the client cap stays on the safe side. Other devices and
 * the DAO app (another origin) are not seen here.
 *
 * Pure module: takes a Storage, no browser globals, testable on node.
 */

export const CALL_WINDOW_MS = 90_000
/** The exchange refuses the 21st call of a window; the client stops at 20. */
export const CLIENT_CALL_CAP = 20
const CALLS_PREFIX = 'taco_exchange_calls:'
const PRESENCE_PREFIX = 'taco_exchange_presence:'
/** A tab that stamped its presence within this window counts as open. */
export const PRESENCE_WINDOW_MS = 90_000
/** Presence and call keys of tabs gone this long are removed by readers. */
const STALE_KEY_MS = 30 * 60_000

export interface CallLog {
  /** Record one update call (right before it is sent). */
  record(principal: string, now?: number): void
  /** Update calls of this principal in the last 90 s, every tab counted. */
  used(principal: string, now?: number): number
  /** Milliseconds until `n` more calls fit under `cap`; 0 when they fit now, Infinity when n > cap. */
  msUntilFree(principal: string, n: number, cap: number, now?: number): number
  /** This tab is open and visible (called every 20 s while visible). */
  stampPresence(now?: number): void
  /** Another exchange tab of this browser was visible in the last 90 s. */
  otherTabSeen(now?: number): boolean
  readonly tabId: string
}

/** A random id for this page load (a reload is a new tab for the log). */
export function newTabId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function parseList(raw: string | null): number[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((t): t is number => typeof t === 'number' && Number.isFinite(t)) : []
  } catch { return [] }
}

export function createCallLog(storage: Storage | null, tabId: string = newTabId()): CallLog {
  // When storage is unavailable (blocked, private mode quirks) this tab still
  // counts its own calls in memory.
  const memory = new Map<string, number[]>()

  const keyOf = (principal: string) => `${CALLS_PREFIX}${principal}:${tabId}`

  function keys(prefix: string): string[] {
    if (!storage) return []
    const out: string[] = []
    try {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (k && k.startsWith(prefix)) out.push(k)
      }
    } catch { /* storage unreadable */ }
    return out
  }

  function liveTimes(principal: string, now: number): number[] {
    const all: number[] = []
    const own = keyOf(principal)
    for (const k of keys(`${CALLS_PREFIX}${principal}:`)) {
      if (k === own) continue // this tab's own calls come from memory, always complete
      let list: number[]
      try { list = parseList(storage!.getItem(k)) } catch { list = [] }
      // A dead tab's key: remove it once its newest call is long past.
      if (list.length > 0 && now - Math.max(...list) > STALE_KEY_MS) {
        try { storage!.removeItem(k) } catch { /* ignore */ }
        continue
      }
      for (const t of list) if (now - t < CALL_WINDOW_MS) all.push(t)
    }
    for (const t of memory.get(own) ?? []) if (now - t < CALL_WINDOW_MS) all.push(t)
    return all.sort((a, b) => a - b)
  }

  return {
    tabId,
    record(principal, now = Date.now()) {
      const k = keyOf(principal)
      const list = [...(memory.get(k) ?? []).filter(t => now - t < CALL_WINDOW_MS), now]
      memory.set(k, list)
      if (storage) {
        try { storage.setItem(k, JSON.stringify(list)) } catch { /* other tabs miss it; this tab still counts it */ }
      }
    },
    used(principal, now = Date.now()) {
      return liveTimes(principal, now).length
    },
    msUntilFree(principal, n, cap, now = Date.now()) {
      if (n > cap) return Infinity
      const times = liveTimes(principal, now)
      const over = times.length + n - cap
      if (over <= 0) return 0
      // The `over` oldest calls must leave the window first.
      const t = times[over - 1]
      return Math.max(0, t + CALL_WINDOW_MS - now) + 250
    },
    stampPresence(now = Date.now()) {
      if (!storage) return
      try { storage.setItem(`${PRESENCE_PREFIX}${tabId}`, String(now)) } catch { /* ignore */ }
    },
    otherTabSeen(now = Date.now()) {
      for (const k of keys(PRESENCE_PREFIX)) {
        if (k === `${PRESENCE_PREFIX}${tabId}`) continue
        let t = NaN
        try { t = Number(storage!.getItem(k)) } catch { /* ignore */ }
        if (!Number.isFinite(t)) continue
        if (now - t < PRESENCE_WINDOW_MS) return true
        if (now - t > STALE_KEY_MS) { try { storage!.removeItem(k) } catch { /* ignore */ } }
      }
      return false
    },
  }
}
