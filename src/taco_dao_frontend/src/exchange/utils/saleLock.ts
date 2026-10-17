/**
 * The CrossDEX funds lock, across every tab of this browser (Web Locks).
 *
 * A Sell many sale takes it exclusive, and so does every recovery that sweeps
 * a pool or the pylon or removes a pair marker (Recover All, its scope buttons,
 * the per row and manual sweeps), which wait for it (up to the hard release)
 * instead of being refused: such a recovery must not run while a swap of any
 * tab still needs that marker or those balances. A single CrossDEX swap and the
 * TACO deposit recoveries take it shared. A sale and a recovery also hold a
 * name of their own (SALE_LOCK, RECOVERY_LOCK), so every tab can tell what
 * holds the lock. So no recovery sweeps a pool or the pylon while a sale's legs
 * are using them, and no second sale spends the same balances. Every holder keeps the lock until
 * all of its leg promises have settled (slow legs included), with a hard
 * release after 10 minutes (an ingress message expires after 5, so by then
 * nothing of ours can still execute). A closed or crashed tab releases it.
 *
 * While this tab holds the lock in any mode, window.__tacoFundsBusy is set and
 * main.js holds back a reload for a new app version until it is free.
 * Without navigator.locks only this tab's own flags apply.
 */

export const FUNDS_LOCK = 'taco-crossdex-funds'
/** Held next to the funds lock by a Sell many sale, and by a recovery of the Recover page: other tabs tell the
 *  holders apart by these names (a single swap holds the funds lock alone). */
export const SALE_LOCK = 'taco-crossdex-sale'
export const RECOVERY_LOCK = 'taco-crossdex-recovery'
export const BUSY = Symbol('funds-lock-busy')
export type FundsLockMode = 'shared' | 'exclusive'
/** Who holds the lock: a Sell many sale, a single swap, or a recovery of the Recover page. */
export type FundsHoldKind = 'sale' | 'swap' | 'recovery'
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
  /** Called when the wait ran to its end without the lock (then the call returns BUSY). */
  onTimeout?: () => void
  /** Aborting it stops the wait (the call returns BUSY, fn never runs). */
  signal?: AbortSignal
}
export interface FundsLockOpts extends Partial<FundsLockWait> {
  /** What this hold is (default: a single swap for shared, a sale for exclusive). */
  kind?: FundsHoldKind
}

let holders = 0
let tabExclusive = false
let tabShared = 0
const tabKinds: Record<FundsHoldKind, number> = { sale: 0, swap: 0, recovery: 0 }

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
export async function withFundsLock<T>(mode: FundsLockMode, fn: () => Promise<T>, opts: FundsLockOpts = {}): Promise<T | typeof BUSY> {
  const kind: FundsHoldKind = opts.kind ?? (mode === 'exclusive' ? 'sale' : 'swap')
  const wait = opts.waitMs != null ? (opts as FundsLockWait) : undefined
  const take = () => { if (mode === 'exclusive') tabExclusive = true; else tabShared++; tabKinds[kind]++; holders++; setBusyFlag() }
  const give = () => { if (mode === 'exclusive') tabExclusive = false; else tabShared--; tabKinds[kind]--; holders--; setBusyFlag() }
  const waitMs = wait ? Math.max(0, Math.min(wait.waitMs, FUNDS_LOCK_CAP_MS)) : 0
  const canWait = () => !!wait && waitMs > 0 && !wait.signal?.aborted
  const locks = locksApi()
  // a sale and a recovery also hold their own name for the job's time, so other tabs can tell them apart
  const label = kind === 'sale' ? SALE_LOCK : kind === 'recovery' ? RECOVERY_LOCK : null
  const holdLabel = (job: Promise<T>) => {
    if (!label || !locks) return
    void Promise.resolve(locks.request(label, { mode: 'shared', ifAvailable: true }, async (l: unknown) => {
      if (l) await Promise.race([job.catch(() => undefined), sleep(HARD_RELEASE_MS)])
    })).catch(() => undefined)
  }

  if (!locks) {
    // Only this tab's own flags: a waiting request looks at them again until they are free.
    if (flagsBusy(mode)) {
      if (!canWait()) return BUSY
      wait!.onWait?.()
      for (let left = waitMs; flagsBusy(mode); left -= WAIT_POLL_MS) {
        if (wait!.signal?.aborted) return BUSY
        if (left <= 0) { wait!.onTimeout?.(); return BUSY }
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
        holdLabel(job)
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
  let timedOut = false
  wait!.signal?.addEventListener('abort', stop, { once: true })
  void sleep(waitMs).then(() => { if (!ctl.signal.aborted) { timedOut = true; stop() } })
  const later = await request({ signal: ctl.signal })
  wait!.signal?.removeEventListener('abort', stop)
  if (later) return later.job
  if (timedOut && !wait!.signal?.aborted) wait!.onTimeout?.()
  return BUSY
}

/** Is a Sell many sale running in any tab (never a recovery, which also holds the lock exclusive)? For the
 *  disabled look only. */
export async function isSaleRunning(): Promise<boolean> {
  if (tabKinds.sale > 0) return true
  const locks = locksApi()
  if (!locks?.query) return false
  try {
    const q = await locks.query()
    return [...(q.held ?? [])].some((l: any) => l.name === SALE_LOCK)
  } catch { return false }
}

/** What holds the funds lock in this browser: a sale, a single swap, a recovery, or nothing. A sale wins over a
 *  swap, a swap over a recovery (the waiting copy names what the user waits for). */
export async function fundsHolder(): Promise<FundsHoldKind | null> {
  if (tabKinds.sale > 0) return 'sale'
  if (tabKinds.swap > 0) return 'swap'
  const locks = locksApi()
  if (!locks?.query) return tabKinds.recovery > 0 ? 'recovery' : null
  try {
    const held = [...((await locks.query()).held ?? [])] as Array<{ name: string; clientId?: string }>
    if (held.some(l => l.name === SALE_LOCK)) return 'sale'
    const recoveryClients = new Set(held.filter(l => l.name === RECOVERY_LOCK).map(l => l.clientId))
    const funds = held.filter(l => l.name === FUNDS_LOCK)
    if (funds.some(l => !recoveryClients.has(l.clientId))) return 'swap'
    if (funds.length > 0 || tabKinds.recovery > 0) return 'recovery'
    return null
  } catch { return tabKinds.recovery > 0 ? 'recovery' : null }
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

/** A recovery refused because the lock is held (the toast and the note). */
export const RECOVERY_NOT_STARTED = 'Recovery not started'
export const LOCK_BUSY_RECOVERY_TEXT = 'A swap, sale or recovery is running in this browser. Try again when it finishes.'
/** The Recover page while a swap or sale holds the lock (before any tap). */
export const SWAP_OR_SALE_RUNNING_TEXT = 'A swap or sale is running in this browser. Recover All waits for it.'
/** A recovery waiting for the lock: the note while it waits, by what holds it. */
export function recoveryWaitsText(holder: FundsHoldKind | null): string {
  return holder === 'recovery'
    ? 'Another recovery is running in this browser. This one starts when it ends.'
    : 'A swap or sale is running in this browser. Recovery starts when it ends.'
}
