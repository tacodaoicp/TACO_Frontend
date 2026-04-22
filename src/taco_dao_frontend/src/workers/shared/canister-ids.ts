/**
 * Canister ID Resolution for SharedWorkers
 *
 * Network-aware canister ID resolution.
 * Uses central CANISTER_IDS config with environment variable overrides.
 * Supports network override for testing from local website.
 */

import { CANISTER_IDS, LOCAL_CANISTER_IDS, type CanisterKey, type EnvKey } from '../../constants/canisterIds'

// Get environment variable with fallback
function getEnvVar(key: string): string | undefined {
  // @ts-ignore - Vite injects these
  return import.meta.env?.[key]
}

// Check if we're in a browser context (main thread, not worker)
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

// Check if we're in a worker context
function isWorker(): boolean {
  return typeof self !== 'undefined' && typeof self.postMessage === 'function'
}

// Network override stored in worker context (set via message from main thread)
let workerNetworkOverride: 'ic' | 'staging' | 'local' | null = null

/**
 * Set network override in worker context (called from main thread message)
 */
export function setWorkerNetworkOverride(network: 'ic' | 'staging' | 'local' | null): void {
  workerNetworkOverride = network
}

// Get network from environment or override
export function getNetwork(): 'ic' | 'staging' | 'local' {
  // Check worker-level override first
  if (workerNetworkOverride) {
    return workerNetworkOverride
  }

  // In browser context, check localStorage override
  if (isBrowser()) {
    const override = localStorage.getItem('taco_network_override')
    if (override === 'ic' || override === 'staging' || override === 'local') {
      return override
    }
  }

  // Fall back to environment variable
  // @ts-ignore - Vite injects these
  const envNetwork = import.meta.env?.DFX_NETWORK || import.meta.env?.VITE_DFX_NETWORK
  if (envNetwork === 'ic' || envNetwork === 'staging') {
    return envNetwork
  }

  // Auto-detect from worker location (critical for production where env vars may not be set)
  if (isWorker() && typeof self !== 'undefined' && self.location) {
    const hostname = self.location.hostname
    // Staging canister (check BEFORE generic .icp0.io to avoid false positive)
    if (hostname.includes('wxunf-maaaa-aaaab-qbzga-cai')) {
      return 'staging'
    }
    // Production domains
    if (hostname === 'tacodao.com' || hostname.endsWith('.tacodao.com') || hostname.endsWith('.icp0.io') || hostname.endsWith('.ic0.app')) {
      return 'ic'
    }
  }

  // Default to staging (matches .env DFX_NETWORK='staging')
  return 'staging'
}

/**
 * Resolve a canister ID from central config, with env var override support.
 */
function resolveCanisterId(key: CanisterKey): string {
  const network = getNetwork()

  // For 'local', check local overrides first, then fall back to staging
  if (network === 'local') {
    return LOCAL_CANISTER_IDS[key] ?? CANISTER_IDS[key]?.staging ?? ''
  }

  // Check import.meta.env override
  const envKey = `CANISTER_ID_${key.toUpperCase()}_${network.toUpperCase()}`
  const envValue = getEnvVar(envKey)
  if (envValue) return envValue

  // Fall back to central config
  const envForLookup: EnvKey = network === 'ic' ? 'ic' : 'staging'
  return CANISTER_IDS[key]?.[envForLookup] ?? ''
}

/**
 * Get the IC host URL based on network
 */
export function getHost(): string {
  const network = getNetwork()
  if (network === 'local') {
    const port = getEnvVar('VITE_LOCAL_PORT') || '6667'
    return `http://localhost:${port}`
  }
  // Match API host to serving domain to avoid CORS errors
  if (typeof self !== 'undefined' && self.location) {
    const hostname = self.location.hostname
    if (hostname.endsWith('.ic0.app') || hostname === 'ic0.app') {
      return 'https://ic0.app'
    }
  }
  return 'https://icp0.io'
}

/**
 * Check if we should fetch root key (only for local development)
 */
export function shouldFetchRootKey(): boolean {
  return getNetwork() === 'local'
}

// Canister ID getters — all delegate to central config
export function getDaoBackendCanisterId(): string { return resolveCanisterId('dao_backend') }
export function getTreasuryCanisterId(): string { return resolveCanisterId('treasury') }
export function getNeuronSnapshotCanisterId(): string { return resolveCanisterId('neuronSnapshot') }
export function getRewardsCanisterId(): string { return resolveCanisterId('rewards') }
export function getNachosVaultCanisterId(): string { return resolveCanisterId('nachos_vault') }
export function getTacoSwapCanisterId(): string { return resolveCanisterId('taco_swap') }

// Third-party / protocol canisters — same across all networks
export function getSneedForumCanisterId(): string {
  return getEnvVar('CANISTER_ID_SNEED_FORUM_IC') || 'mcigm-4aaaa-aaaad-qhlkq-cai'
}
export function getTacoSnsRootCanisterId(): string { return 'lacdn-3iaaa-aaaaq-aae3a-cai' }
export function getTacoSnsGovernanceCanisterId(): string { return 'lhdfz-wqaaa-aaaaq-aae3q-cai' }
export function getAppSneedDaoCanisterId(): string {
  return getEnvVar('CANISTER_ID_APP_SNEEDDAO_BACKEND_IC') || 'g7s5u-tqaaa-aaaad-qhktq-cai'
}
export function getIcpLedgerCanisterId(): string {
  const network = getNetwork()
  if (network === 'local') {
    return getEnvVar('CANISTER_ID_LEDGER_LOCAL') || 'ryjl3-tyaaa-aaaaa-aaaba-cai'
  }
  return 'ryjl3-tyaaa-aaaaa-aaaba-cai'
}

/**
 * All canister IDs as an object (useful for logging/debugging)
 */
export function getAllCanisterIds(): Record<string, string> {
  return {
    daoBackend: getDaoBackendCanisterId(),
    treasury: getTreasuryCanisterId(),
    neuronSnapshot: getNeuronSnapshotCanisterId(),
    rewards: getRewardsCanisterId(),
    sneedForum: getSneedForumCanisterId(),
    tacoSnsRoot: getTacoSnsRootCanisterId(),
    tacoSnsGovernance: getTacoSnsGovernanceCanisterId(),
    appSneedDao: getAppSneedDaoCanisterId(),
    icpLedger: getIcpLedgerCanisterId(),
    tacoSwap: getTacoSwapCanisterId(),
    nachosVault: getNachosVaultCanisterId(),
  }
}
