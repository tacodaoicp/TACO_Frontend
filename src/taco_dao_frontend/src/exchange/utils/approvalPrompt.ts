/**
 * Approval cancellation marker. Deposits now approve automatically (no
 * dialog), so nothing throws ApprovalDeclined today; the callers' benign
 * cancellation branches stay valid if a prompt ever returns.
 */

/** Thrown when the user cancels the approval dialog. Callers treat it as a
 *  benign cancellation (info toast), not a failure. */
export class ApprovalDeclined extends Error {
  readonly declined = true
  constructor(message = 'Approval cancelled, nothing left your wallet.') {
    super(message)
    this.name = 'ApprovalDeclined'
  }
}

export function isApprovalDeclined(e: unknown): boolean {
  return e instanceof ApprovalDeclined
    || (e as { declined?: unknown } | null)?.declined === true
}
