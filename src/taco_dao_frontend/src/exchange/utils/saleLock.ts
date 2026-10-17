/**
 * The CrossDEX funds lock, across every tab of this browser (Web Locks).
 *
 * A Sell many sale takes it exclusive, and so do Recover All and its scope
 * buttons, which wait for it (up to the hard release) instead of being refused:
 * a recovery that removes a pair marker or sweeps a whole pool or the pylon must
 * not run while a swap of any tab still needs that marker or those balances. A
 * single CrossDEX swap and every per row or manual recovery take it shared. So
 * no recovery sweeps a pool or the pylon while a sale's legs are using them, and
 * no second sale spends the same balances. Every holder keeps the lock until
 * all of its leg promises have settled (slow legs included), with a hard
 * release after 10 minutes (an ingress message expires after 5, so by then
 * nothing of ours can still execute). A closed or crashed tab releases it.
 *
 * While this tab holds the lock in any mode, window.__tacoFundsBusy is set and
 * main.js holds back a reload for a new app version until it is free.
 * Without navigator.locks only this tab's own flags apply.
 */

export const FUNDS_LOCK = 'taco-crossdex-funds'
export const BUSY = Symbol('funds-lock-busy')
export type FundsLockMode = 'shared' | 'exclusive'
const HARD_RELEASE_MS = 10 * 60_000
/** Every holder lets go of the lock by then: a waiting request never waits longer. */
export const FUNDS_LOCK_CAP_MS = HARD_RELEASE_MS
/** Without Web Locks, how often a waiting request looks at this tab's flags again. */
const WAIT_POLL_MS = 500

export interface FundsLockWait {
  /** Wait for the lock up to this long instead of returning BUSY at once (at most FUNDS_LOCK_CAP_MS). */
  waitMs: number
  /** Called once when the lock was not free and the request starts waiting. */
  onWait?: () => void
  /** Aborting it stops the wait (the call returns BUSY, fn never runs). */
  signal?: AbortSignal
}

let holders = 0
let tabExclusive = false
let tabShared = 0

function setBusyFlag() {
  try {
    ;(window as any).__tacoFundsBusy = holders > 0
    if (holders === 0) window.dispatchEvent(new Event('taco:funds-free'))
  } catch { /* no window */ }
}

function locksApi(): any {
  try { return (navigator as any).locks?.request ? (navigator as any).locks : null } catch { return null }
}

let sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
/** Tests drive the hard release on a virtual clock. */
export function setFundsLockSleep(fn: (ms: number) => Promise<void>) { sleep = fn }

const flagsBusy = (mode: FundsLockMode) => (mode === 'exclusive' ? (tabExclusive || tabShared > 0) : tabExclusive)

/**
 * Run `fn` while holding the funds lock. Returns BUSY (and never calls fn) when
 * the lock is not free, or, with `wait`, when it did not come free within
 * `wait.waitMs` (or the wait was aborted). The lock is held until fn settles or
 * 10 minutes pass; the returned promise always follows fn itself.
 */
export async function withFundsLock<T>(mode: FundsLockMode, fn: () => Promise<T>, wait?: FundsLockWait): Promise<T | typeof BUSY> {
  const take = () => { if (mode === 'exclusive') tabExclusive = true; else tabShared++; holders++; setBusyFlag() }
  const give = () => { if (mode === 'exclusive') tabExclusive = false; else tabShared--; holders--; setBusyFlag() }
  const waitMs = wait ? Math.max(0, Math.min(wait.waitMs, FUNDS_LOCK_CAP_MS)) : 0
  const canWait = () => !!wait && waitMs > 0 && !wait.signal?.aborted
  const locks = locksApi()

  if (!locks) {
    // Only this tab's own flags: a waiting request looks at them again until they are free.
    if (flagsBusy(mode)) {
      if (!canWait()) return BUSY
      wait!.onWait?.()
      for (let left = waitMs; flagsBusy(mode); left -= WAIT_POLL_MS) {
        if (left <= 0 || wait!.signal?.aborted) return BUSY
        await sleep(Math.min(WAIT_POLL_MS, left))
      }
    }
    take()
    const p = fn()
    void Promise.race([p.catch(() => undefined), sleep(HARD_RELEASE_MS)]).finally(give)
    return p
  }

  // This tab's own flags first (a waiting request leaves them to the lock manager, which queues it behind a
  // holder of this tab too).
  if (!wait && flagsBusy(mode)) return BUSY
  // One lock request: { job } once granted (fn started), null when not granted or aborted.
  const request = (opts: Record<string, unknown>) => new Promise<{ job: Promise<T> } | null>((resolve) => {
    const r = locks.request(FUNDS_LOCK, { mode, ...opts }, async (lock: unknown) => {
      if (!lock) { resolve(null); return }
      take()
      try {
        let job: Promise<T>
        try { job = fn() } catch (e) { job = Promise.reject(e) }
        resolve({ job })
        await Promise.race([job.catch(() => undefined), sleep(HARD_RELEASE_MS)])
      } finally { give() }
    })
    void Promise.resolve(r).catch(() => resolve(null))
  })
  const now = await request({ ifAvailable: true })
  if (now) return now.job
  if (!canWait()) return BUSY
  // Queued: a request made later (a new swap or sale of any tab) waits behind this one, so it is refused while
  // this waits, and every holder lets go by the hard release, so the wait ends by then.
  wait!.onWait?.()
  const ctl = new AbortController()
  const stop = () => ctl.abort()
  wait!.signal?.addEventListener('abort', stop, { once: true })
  void sleep(waitMs).then(stop)
  const later = await request({ signal: ctl.signal })
  wait!.signal?.removeEventListener('abort', stop)
  return later ? later.job : BUSY
}

/** Is a Sell many sale (an exclusive holder) running in any tab? For the disabled look only. */
export async function isSaleRunning(): Promise<boolean> {
  if (tabExclusive) return true
  const locks = locksApi()
  if (!locks?.query) return false
  try {
    const q = await locks.query()
    return [...(q.held ?? [])].some((l: any) => l.name === FUNDS_LOCK && l.mode === 'exclusive')
  } catch { return false }
}

/** Does any tab hold the funds lock (any mode)? */
export async function isFundsLockHeld(): Promise<boolean> {
  if (holders > 0) return true
  const locks = locksApi()
  if (!locks?.query) return false
  try {
    const q = await locks.query()
    return [...(q.held ?? [])].some((l: any) => l.name === FUNDS_LOCK)
  } catch { return false }
}

/** Web Locks are available (otherwise only this tab's own flags protect). */
export function hasWebLocks(): boolean {
  return !!locksApi()
}

export const SALE_RUNNING_RECOVERY_TEXT = 'A sale is running. Recovery is available again when it finishes.'
/** Recover All waits for a swap or sale that holds the lock: the note while it waits. */
export const RECOVERY_WAITS_TEXT = 'A swap is still running in this browser. Recovery starts when it ends.'
