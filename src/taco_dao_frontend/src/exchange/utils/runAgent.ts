/**
 * Run agents: one HttpAgent per CrossDEX run, built from one identity object.
 *
 * Every fund moving and recovery call of a run uses this agent, and the run's
 * principal comes from the same identity object, so a login or logout in
 * another tab mid run can never redirect a later step or make a recovery act
 * for someone else. The delegation keeps signing until it expires.
 */
import type { HttpAgent, Identity } from '@dfinity/agent'
import type { Principal } from '@dfinity/principal'
import { getCachedIdentity, createAgentFor } from '../../shared/auth-cache'
import { withTimeout } from './withTimeout'

export interface RunAgent {
  agent: HttpAgent
  principal: Principal
  principalText: string
  /** When the delegation chain expires (the earliest link), null when unknown. */
  expiresAtMs: number | null
  /** agent.syncTime() succeeded: created_at_time can use the replica clock. */
  timeSynced: boolean
}

export class RunAgentError extends Error {
  constructor(message: string, readonly code: 'notAuthenticated' | 'sessionEndsSoon' | 'walletChanged') {
    super(message)
    this.name = 'RunAgentError'
  }
}

/** Earliest expiry over the identity's delegation chain, in ms, or null. */
export function delegationExpiryMs(identity: Identity): number | null {
  try {
    const chain = (identity as any).getDelegation?.()
    const links = chain?.delegations as Array<{ delegation: { expiration: bigint } }> | undefined
    if (!links?.length) return null
    let min: bigint | null = null
    for (const l of links) {
      const e = BigInt(l.delegation.expiration)
      if (min === null || e < min) min = e
    }
    return min === null ? null : Number(min / 1_000_000n)
  } catch { return null }
}

export async function createRunAgent(opts: {
  /** Refuse when the delegation ends sooner than this. */
  minLifetimeMs?: number
  /** The principal the user confirmed (store.principalText); a different one stops the run. */
  expectPrincipal?: string
  /** Sync the agent's clock with the replica (for created_at_time), 5 s at most. */
  syncTime?: boolean
} = {}): Promise<RunAgent> {
  const identity = await getCachedIdentity()
  const principal = identity.getPrincipal()
  if (principal.isAnonymous()) throw new RunAgentError('Your session expired. Please reconnect your wallet.', 'notAuthenticated')
  const principalText = principal.toText()
  if (opts.expectPrincipal != null && opts.expectPrincipal !== principalText) {
    throw new RunAgentError('Your wallet changed in another tab, so nothing was sent.', 'walletChanged')
  }
  const expiresAtMs = delegationExpiryMs(identity)
  if (opts.minLifetimeMs && expiresAtMs != null && expiresAtMs - Date.now() < opts.minLifetimeMs) {
    throw new RunAgentError('Your session ends soon, so nothing was sent. Please reconnect your wallet.', 'sessionEndsSoon')
  }
  const agent = await createAgentFor(identity)
  const agentPrincipal = (await agent.getPrincipal()).toText()
  if (agentPrincipal !== principalText) {
    throw new RunAgentError('Your wallet changed in another tab, so nothing was sent.', 'walletChanged')
  }
  let timeSynced = false
  if (opts.syncTime) {
    try { await withTimeout(agent.syncTime(), 5_000, 'syncTime'); timeSynced = true }
    catch (e) { console.warn('[CrossDEX] time sync failed; deposits go without created_at_time:', e) }
  }
  return { agent, principal, principalText, expiresAtMs, timeSynced }
}
