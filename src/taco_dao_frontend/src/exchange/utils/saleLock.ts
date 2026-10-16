/**
 * The CrossDEX funds lock, across every tab of this browser (Web Locks).
 *
 * A Sell many sale takes it exclusive; a single CrossDEX swap, Recover All, its
 * scope buttons and every per row or manual recovery take it shared. So no
 * recovery sweeps a pool or the pylon while a sale's legs are using them, and
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

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/**
 * Run `fn` while holding the funds lock. Returns BUSY (and never calls fn) when
 * the lock is not free. The lock is held until fn settles or 10 minutes pass;
 * the returned promise always follows fn itself.
 */
export async function withFundsLock<T>(mode: FundsLockMode, fn: () => Promise<T>): Promise<T | typeof BUSY> {
  // This tab's own flags first (they also cover browsers without Web Locks).
  if (mode === 'exclusive' ? (tabExclusive || tabShared > 0) : tabExclusive) return BUSY
  const take = () => { if (mode === 'exclusive') tabExclusive = true; else tabShared++; holders++; setBusyFlag() }
  const give = () => { if (mode === 'exclusive') tabExclusive = false; else tabShared--; holders--; setBusyFlag() }

  const locks = locksApi()
  if (!locks) {
    take()
    const p = fn()
    void Promise.race([p.catch(() => undefined), sleep(HARD_RELEASE_MS)]).finally(give)
    return p
  }

  let job: Promise<T> | null = null
  let started!: () => void
  const startedP = new Promise<void>(r => { started = r })
  const request = locks.request(FUNDS_LOCK, { mode, ifAvailable: true }, async (lock: unknown) => {
    if (!lock) { started(); return }
    take()
    try {
      job = fn()
      started()
      await Promise.race([job.catch(() => undefined), sleep(HARD_RELEASE_MS)])
    } finally { give() }
  })
  void Promise.resolve(request).catch(() => started())
  await startedP
  if (!job) return BUSY
  return job
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
