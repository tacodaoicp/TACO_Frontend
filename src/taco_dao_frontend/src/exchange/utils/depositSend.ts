/**
 * Sending a TACO V1 deposit so that a lost answer never reads as "nothing moved".
 *
 * A thrown ledger call looks the same whether the transfer executed or not.
 * On ledgers that deduplicate (the ICP ledger and the DFINITY ICRC-1 ledger used
 * by SNS and ck tokens), a transfer that sets created_at_time and a memo can be
 * sent again unchanged: when the first one landed, the ledger answers Duplicate
 * with the original block. So:
 *
 *  - The intent (amount, destination, created_at_time, memo) is written to the
 *    run journal and read back BEFORE the transfer (a strict caller stops when
 *    that fails: nothing was sent).
 *  - Ok or Duplicate gives the block.
 *  - An Err answer to the first attempt means the ledger refused it: nothing moved.
 *  - A certified reject of the first attempt proves no state change: nothing moved.
 *  - Any other throw: on a deduplicating ledger with a synced clock, the
 *    identical transfer is sent again up to 3 times (2 s, 5 s, 10 s). A resend
 *    answered InsufficientFunds proves no earlier copy landed (the ledger checks
 *    duplicates before balances). Still unknown after the resends, or on any
 *    other ledger: the deposit "may have been sent".
 *
 * Errors carry `deposit: 'notSent' | 'unknown'`; only notSent may end a route as
 * not sent. Pure module (injected send, clock and reject check).
 */

export type DepositFate = 'notSent' | 'unknown'

export class DepositError extends Error {
  readonly deposit: DepositFate
  readonly reason?: 'journal' | 'refused' | 'rejected' | 'lost'
  readonly cause?: unknown
  constructor(message: string, deposit: DepositFate, reason?: DepositError['reason'], cause?: unknown) {
    super(message)
    this.name = 'DepositError'
    this.deposit = deposit
    this.reason = reason
    this.cause = cause
  }
}

/** A ledger's answer, mapped by the caller. */
export type LedgerSendResult =
  | { Ok: bigint }
  | { Duplicate: bigint }
  | { Err: string; insufficient?: boolean }

export interface DepositIntent {
  amount: bigint
  to: string
  createdAtNs?: bigint
  /** Hex of the 8 byte memo. */
  memo?: string
}

export interface SendDepositOpts {
  required: bigint
  to: string
  /** The ledger deduplicates created_at_time + memo, so an identical resend is safe. */
  dedup: boolean
  /** Replica synced clock in ns; null when the time sync failed (no created_at_time, no resend). */
  nowNs: (() => bigint) | null
  randomMemo: () => Uint8Array
  /** Writes and reads back the intent; false stops before the transfer (strict callers). */
  beforeSend?: (i: DepositIntent) => boolean
  send: (createdAtNs: bigint | undefined, memo: Uint8Array | undefined) => Promise<LedgerSendResult>
  isCertifiedReject: (e: unknown) => boolean
  sleep: (ms: number) => Promise<void>
  resendDelaysMs?: number[]
  /** Message for a refused transfer (the ledger's own answer is appended). */
  refusedMessage?: (err: string, insufficient: boolean) => string
}

export const toHex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('')

export async function sendDeposit(o: SendDepositOpts): Promise<bigint> {
  const useIntent = o.dedup && o.nowNs != null
  const createdAtNs = useIntent ? o.nowNs!() : undefined
  const memo = useIntent ? o.randomMemo() : undefined
  if (o.beforeSend && !o.beforeSend({ amount: o.required, to: o.to, createdAtNs, memo: memo ? toHex(memo) : undefined })) {
    throw new DepositError('The recovery note could not be saved, so the deposit was not sent.', 'notSent', 'journal')
  }
  const refused = (r: { Err: string; insufficient?: boolean }) =>
    new DepositError(o.refusedMessage ? o.refusedMessage(r.Err, !!r.insufficient) : `Token transfer failed: ${r.Err}`, 'notSent', 'refused')

  let first: LedgerSendResult
  try {
    first = await o.send(createdAtNs, memo)
  } catch (e) {
    if (o.isCertifiedReject(e)) {
      throw new DepositError(errMsg(e, 'The ledger refused the transfer.'), 'notSent', 'rejected', e)
    }
    if (!useIntent) {
      throw new DepositError('The deposit may have been sent, but its answer did not come back.', 'unknown', 'lost', e)
    }
    let last: unknown = e
    for (const d of o.resendDelaysMs ?? [2_000, 5_000, 10_000]) {
      await o.sleep(d)
      try {
        const r = await o.send(createdAtNs, memo)
        if ('Ok' in r) return r.Ok
        if ('Duplicate' in r) return r.Duplicate
        // The ledger looks for a duplicate before it checks the balance, so a
        // short balance proves the first transfer did not land.
        if (r.insufficient) throw refused(r)
        last = new Error(r.Err) // busy, upgrading, clock: the first one is still unknown
      } catch (e2) {
        if (e2 instanceof DepositError) throw e2
        last = e2
      }
    }
    throw new DepositError('The deposit may have been sent, but its answer did not come back.', 'unknown', 'lost', last)
  }
  if ('Ok' in first) return first.Ok
  if ('Duplicate' in first) return first.Duplicate
  throw refused(first)
}

function errMsg(e: unknown, fallback: string): string {
  const m = (e as any)?.message
  return typeof m === 'string' && m ? m : fallback
}
