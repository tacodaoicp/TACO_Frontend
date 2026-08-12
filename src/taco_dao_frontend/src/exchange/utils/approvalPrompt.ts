/**
 * Promise bridge between approveExchangeDeposit (a plain util) and the
 * ApprovalDialog component (mounted once in ExchangeApp). When a new
 * spending approval is needed, the util calls requestApproval() and waits;
 * the dialog shows the request, lets the user edit the amount (never below
 * what the trade needs), and settles the promise with the chosen amount,
 * or null when the user cancels.
 */

import { ref } from 'vue'

export interface ApprovalRequest {
  tokenAddress: string
  /** Minimum this trade needs (gross + one transfer fee), in base units. */
  needed: bigint
  /** This token's ledger transfer fee, in base units. */
  transferFee: bigint
  /** Suggested standing amount (10x needed), in base units. */
  proposed: bigint
}

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

export interface ApprovalDecision {
  /** Approved amount in base units, >= needed. */
  amount: bigint
  /** Absolute expiry in nanoseconds since epoch. */
  expiresAtNs: bigint
}

export const pendingApproval = ref<ApprovalRequest | null>(null)

let resolver: ((decision: ApprovalDecision | null) => void) | null = null

export function requestApproval(req: ApprovalRequest): Promise<ApprovalDecision | null> {
  // Every flow approves sequentially, so one dialog is open at a time. If a
  // stray second request arrives while the user is deciding, DON'T disturb
  // the open dialog (that would cancel the swap they are actively approving)
  // — back the new caller off with null instead.
  if (resolver) return Promise.resolve(null)
  pendingApproval.value = req
  return new Promise((resolve) => { resolver = resolve })
}

export function settleApproval(decision: ApprovalDecision | null): void {
  pendingApproval.value = null
  const r = resolver
  resolver = null
  r?.(decision)
}
