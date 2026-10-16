/**
 * The TACO deposit history (`taco_deposit_history`): the Recover page's pointer
 * to every V1 deposit. One entry per deposit, written right after the ledger
 * returns the block. An entry leaves only when its trade went through, a
 * recovery confirmed the refund, or the user dismissed it. Entries carry the
 * principal that sent the deposit (older entries have none) and a status:
 * 'open' (may still need a recovery) or 'settled' (the exchange settled it by
 * itself). Up to 200 entries: entries older than 21 days go first, then the
 * oldest settled ones; an open entry younger than 21 days is never evicted.
 *
 * Pure module: takes a Storage (deposit.ts binds localStorage with cache eviction).
 */

export interface DepositHistoryEntry {
  token: string
  block: string
  amount: string
  type: string
  timestamp: number
  principal?: string
  status?: 'open' | 'settled'
  runId?: string
}

export const HISTORY_KEY = 'taco_deposit_history'
const HISTORY_CAP = 200
const HISTORY_MAX_AGE_MS = 21 * 86_400_000 // 21 days (block validity window)

/** Age out entries older than 21 days, then, above the cap, the oldest settled
 *  ones. An open entry younger than 21 days is never evicted. */
export function pruneHistory(list: DepositHistoryEntry[], now: number): DepositHistoryEntry[] {
  let out = list.filter(e => now - e.timestamp < HISTORY_MAX_AGE_MS)
  if (out.length <= HISTORY_CAP) return out
  const settled = out.filter(e => e.status === 'settled').sort((a, b) => a.timestamp - b.timestamp)
  const drop = new Set<DepositHistoryEntry>()
  for (const e of settled) {
    if (out.length - drop.size <= HISTORY_CAP) break
    drop.add(e)
  }
  out = out.filter(e => !drop.has(e))
  return out
}

const sameEntry = (e: DepositHistoryEntry, block: string, token?: string) =>
  e.block === block && (token == null || e.token === token)

export interface DepositHistory {
  list(): DepositHistoryEntry[]
  save(token: string, block: bigint, amount: bigint, assetType: string, meta?: { principal?: string; runId?: string }): boolean
  remove(block: string, token?: string): void
  setStatus(block: string, status: 'open' | 'settled', token?: string): void
}

export function createDepositHistory(storage: Storage, now: () => number): DepositHistory {
  const read = (): DepositHistoryEntry[] => {
    try {
      const raw = storage.getItem(HISTORY_KEY)
      const v = raw ? JSON.parse(raw) : []
      return Array.isArray(v) ? v : []
    } catch { return [] }
  }
  const write = (list: DepositHistoryEntry[]): boolean => {
    try {
      const json = JSON.stringify(pruneHistory(list, now()))
      storage.setItem(HISTORY_KEY, json)
      return storage.getItem(HISTORY_KEY) === json
    } catch { return false }
  }
  return {
    list: read,
    save(token, block, amount, assetType, meta = {}) {
      const list = read().filter(e => !sameEntry(e, block.toString(), token))
      list.unshift({
        token,
        block: block.toString(),
        amount: amount.toString(),
        type: assetType,
        timestamp: now(),
        principal: meta.principal,
        status: 'open',
        runId: meta.runId,
      })
      return write(list)
    },
    remove(block, token) {
      const list = read()
      const next = list.filter(e => !sameEntry(e, block, token))
      if (next.length !== list.length) write(next)
    },
    setStatus(block, status, token) {
      const list = read()
      let changed = false
      for (const e of list) if (sameEntry(e, block, token) && e.status !== status) { e.status = status; changed = true }
      if (changed) write(list)
    },
  }
}
