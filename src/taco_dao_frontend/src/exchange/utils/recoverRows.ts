/**
 * The Recover page's deposit rows: the deposit history merged with the CrossDEX
 * run journal, and the rules that decide when a row may leave.
 *
 * - Rows are keyed by token and block (block numbers are per ledger).
 * - A journal leg marked used, recovered or dismissed hides the row; a settled
 *   mark in either source puts it in the "Settled by TACO" group.
 * - A journal leg with an intent and no block that was not refused is a "may
 *   have been sent" row (its block has to come from the wallet history).
 * - Journal rows show only for the wallet that saved them.
 *
 * Pure module.
 */
import type { DepositHistoryEntry } from './depositHistory'
import { legUnresolved, type RunRecord } from './crossDexJournal'

export interface DepositRow extends DepositHistoryEntry {
  /** Journal legs pointing at this deposit. */
  refs: Array<{ runId: string; ai: number; li: number }>
  /** The exchange settled it by itself (kept so the user can check). */
  settled: boolean
}

export interface MaySentRow { key: string; runId: string; ai: number; li: number; token: string; amount: string; at: number }

export const depKey = (token: string, block: string) => `${token}:${block}`

export function mergeDepositRows(history: DepositHistoryEntry[], runs: RunRecord[], me: string): { rows: DepositRow[]; maySent: MaySentRow[] } {
  const hidden = new Set<string>()
  const settledKeys = new Set<string>()
  const refsOf = new Map<string, DepositRow['refs']>()
  const journalOnly = new Map<string, DepositRow>()
  const maySent: MaySentRow[] = []
  for (const r of runs) {
    if (!me || r.principal !== me) continue
    r.assets.forEach((a, ai) => a.legs.forEach((l, li) => {
      if (l.dex !== 'taco') return
      if (l.block != null) {
        const key = depKey(a.token, l.block)
        if (l.deposit === 'used' || l.deposit === 'recovered' || l.deposit === 'dismissed') { hidden.add(key); return }
        if (l.deposit === 'settled') settledKeys.add(key)
        refsOf.set(key, [...(refsOf.get(key) ?? []), { runId: r.id, ai, li }])
        if (!journalOnly.has(key)) {
          journalOnly.set(key, {
            token: a.token, block: l.block, amount: l.amountIn, type: a.type ?? 'ICRC12',
            timestamp: l.intent?.at ?? r.startedAt, principal: r.principal, status: 'open', runId: r.id,
            refs: [], settled: false,
          })
        }
      } else if (l.intent && legUnresolved(l)) {
        maySent.push({ key: `${r.id}:${ai}:${li}`, runId: r.id, ai, li, token: a.token, amount: l.intent.amount, at: l.intent.at })
      }
    }))
  }
  const rows: DepositRow[] = []
  const seen = new Set<string>()
  for (const e of history) {
    const key = depKey(e.token, e.block)
    if (hidden.has(key) || seen.has(key)) continue
    seen.add(key)
    rows.push({ ...e, refs: refsOf.get(key) ?? [], settled: e.status === 'settled' || settledKeys.has(key) })
  }
  for (const [key, row] of journalOnly) {
    if (seen.has(key)) continue
    rows.push({ ...row, refs: refsOf.get(key) ?? [], settled: settledKeys.has(key) })
  }
  return { rows: rows.sort((a, b) => b.timestamp - a.timestamp), maySent: maySent.sort((a, b) => b.at - a.at) }
}

/** Saved by a different wallet than the one connected (entries without a principal predate the field). */
export function isOtherWallet(row: { principal?: string }, me: string): boolean {
  return !!row.principal && !!me && row.principal !== me
}

/** A recoverBatch item that confirms the refund (the row may leave). */
export function batchItemRecovered(r: { success: boolean; error: string }): boolean {
  return r.success || /already recovered|already refunded/i.test(r.error ?? '')
}

/** The exchange refused the whole batch (a limited caller gets one "Not allowed" row). */
export function batchRefused(results: Array<{ success: boolean; error: string }>): boolean {
  return results.length === 1 && !results[0].success && /not allowed/i.test(results[0].error ?? '')
}
