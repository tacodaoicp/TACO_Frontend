/**
 * Shared Auth Cache
 *
 * Caches AuthClient and Agent instances to avoid creating fresh instances
 * on every operation. This significantly reduces memory usage and improves
 * performance for swap operations and other authenticated calls.
 */

import type { Identity } from '@dfinity/agent'
import type { HttpAgent } from '@dfinity/agent'
import type { AuthClient } from '@dfinity/auth-client'
import { getEffectiveNetwork } from '../config/network-config'

// ============================================================================
// Network Helpers (centralized)
// ============================================================================

/**
 * Whether to fetch root key (only for local development)
 */
export function shouldFetchRootKey(): boolean {
  return getEffectiveNetwork() === 'local'
}

/**
 * Get the network host URL
 */
export function getNetworkHost(): string {
  const network = getEffectiveNetwork()
  if (network === 'local') {
    const port = import.meta.env.VITE_LOCAL_PORT || '4943'
    return `http://localhost:${port}`
  }
  return 'https://ic0.app'
}

// ============================================================================
// Lazy-loaded Modules
// ============================================================================

let _agentModule: typeof import('@dfinity/agent') | null = null
let _authClientModule: typeof import('@dfinity/auth-client') | null = null
let _utilsModule: typeof import('@dfinity/utils') | null = null

async function getAgentModule() {
  if (!_agentModule) {
    _agentModule = await import('@dfinity/agent')
  }
  return _agentModule
}

async function getAuthClientModule() {
  if (!_authClientModule) {
    _authClientModule = await import('@dfinity/auth-client')
  }
  return _authClientModule
}

async function getUtilsModule() {
  if (!_utilsModule) {
    _utilsModule = await import('@dfinity/utils')
  }
  return _utilsModule
}

// ============================================================================
// Cached Instances
// ============================================================================

let cachedAuthClient: AuthClient | null = null
let cachedIdentity: Identity | null = null
let cachedAgent: HttpAgent | null = null
let cachedAgentIdentityHash: string | null = null

/**
 * Get a simple hash of identity for cache invalidation
 */
function getIdentityHash(identity: Identity): string {
  return identity.getPrincipal().toText()
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get cached AuthClient instance.
 * Creates one if it doesn't exist.
 */
export async function getCachedAuthClient(): Promise<AuthClient> {
  if (!cachedAuthClient) {
    const { AuthClient } = await getAuthClientModule()
    cachedAuthClient = await AuthClient.create()
  }
  return cachedAuthClient
}

/**
 * Get cached Identity from AuthClient.
 * Updates if identity has changed (login/logout).
 */
export async function getCachedIdentity(): Promise<Identity> {
  const authClient = await getCachedAuthClient()
  const currentIdentity = authClient.getIdentity()

  // Check if identity changed (e.g., user logged in/out)
  const currentHash = getIdentityHash(currentIdentity)
  if (cachedIdentity && cachedAgentIdentityHash !== currentHash) {
    // Identity changed, clear agent cache
    cachedAgent = null
    cachedAgentIdentityHash = null
  }

  cachedIdentity = currentIdentity
  return currentIdentity
}

/**
 * Get cached HttpAgent with current identity.
 * Creates/recreates if identity changed or agent doesn't exist.
 */
export async function getCachedAgent(): Promise<HttpAgent> {
  const identity = await getCachedIdentity()
  const identityHash = getIdentityHash(identity)

  // Return cached agent if identity hasn't changed
  if (cachedAgent && cachedAgentIdentityHash === identityHash) {
    return cachedAgent
  }

  // Create new agent with createAgent from @dfinity/utils
  const { createAgent } = await getUtilsModule()
  cachedAgent = await createAgent({
    identity,
    host: getNetworkHost(),
    fetchRootKey: shouldFetchRootKey(),
  })
  cachedAgentIdentityHash = identityHash

  return cachedAgent
}

/**
 * Create an HttpAgent using @dfinity/agent's HttpAgent class directly.
 * Useful when createAgent from utils isn't appropriate.
 */
export async function getCachedHttpAgent(): Promise<HttpAgent> {
  const identity = await getCachedIdentity()
  const identityHash = getIdentityHash(identity)

  // Return cached agent if identity hasn't changed
  if (cachedAgent && cachedAgentIdentityHash === identityHash) {
    return cachedAgent
  }

  // Create new HttpAgent
  const { HttpAgent } = await getAgentModule()
  cachedAgent = new HttpAgent({
    identity,
    host: getNetworkHost(),
  })

  if (shouldFetchRootKey()) {
    await cachedAgent.fetchRootKey()
  }

  cachedAgentIdentityHash = identityHash
  return cachedAgent
}

/**
 * Clear all cached auth instances.
 * Call this on logout or when identity changes.
 */
export function clearAuthCache(): void {
  cachedAuthClient = null
  cachedIdentity = null
  cachedAgent = null
  cachedAgentIdentityHash = null
}

/**
 * Invalidate just the agent cache (keeps AuthClient).
 * Useful when network changes.
 */
export function invalidateAgentCache(): void {
  cachedAgent = null
  cachedAgentIdentityHash = null
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Re-export lazy loaders for use in other modules that need
 * access to dfinity modules without top-level imports.
 */
export { getAgentModule, getAuthClientModule, getUtilsModule }
