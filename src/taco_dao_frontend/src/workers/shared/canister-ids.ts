/**
 * Canister ID Resolution for SharedWorkers
 *
 * Network-aware canister ID resolution extracted from taco.store.ts
 * Uses environment variables with fallback defaults.
 * Supports network override for testing mainnet from local website.
 */

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
function getNetwork(): 'ic' | 'staging' | 'local' {
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

  return 'local'
}

/**
 * Get the IC host URL based on network
 */
export function getHost(): string {
  const network = getNetwork()
  if (network === 'local') {
    const port = getEnvVar('VITE_LOCAL_PORT') || '4943'
    return `http://localhost:${port}`
  }
  return 'https://ic0.app'
}

/**
 * Check if we should fetch root key (only for local development)
 */
export function shouldFetchRootKey(): boolean {
  return getNetwork() === 'local'
}

/**
 * DAO Backend Canister ID
 */
export function getDaoBackendCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_DAO_BACKEND_IC') || 'vxqw7-iqaaa-aaaan-qzziq-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_DAO_BACKEND_STAGING') || 'tisou-7aaaa-aaaai-atiea-cai'
    default:
      return 'ywhqf-eyaaa-aaaad-qg6tq-cai' // local
  }
}

/**
 * Treasury Canister ID
 */
export function getTreasuryCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_TREASURY_IC') || 'v6t5d-6yaaa-aaaan-qzzja-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_TREASURY_STAGING') || 'tptia-syaaa-aaaai-atieq-cai'
    default:
      return 'z4is7-giaaa-aaaad-qg6uq-cai' // local
  }
}

/**
 * Neuron Snapshot Canister ID
 */
export function getNeuronSnapshotCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_NEURONSNAPSHOT_IC') || 'vzs3x-taaaa-aaaan-qzzjq-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_NEURONSNAPSHOT_STAGING') || 'tgqd4-eqaaa-aaaai-atifa-cai'
    default:
      return 'tgqd4-eqaaa-aaaai-atifa-cai' // local
  }
}

/**
 * Rewards Canister ID
 */
export function getRewardsCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_REWARDS_IC') || 'dkgdg-saaaa-aaaan-qz5ma-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_REWARDS_STAGING') || 'cjkka-gyaaa-aaaan-qz5kq-cai'
    default:
      return 'cjkka-gyaaa-aaaan-qz5kq-cai' // local
  }
}

/**
 * Sneed Forum Canister ID
 */
export function getSneedForumCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_SNEED_FORUM_IC') || 'mcigm-4aaaa-aaaad-qhlkq-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_SNEED_FORUM_STAGING') || 'mcigm-4aaaa-aaaad-qhlkq-cai'
    default:
      return 'mcigm-4aaaa-aaaad-qhlkq-cai'
  }
}

/**
 * TACO DAO SNS Root Canister ID (same across all networks)
 */
export function getTacoSnsRootCanisterId(): string {
  return 'lacdn-3iaaa-aaaaq-aae3a-cai'
}

/**
 * TACO DAO SNS Governance Canister ID (same across all networks)
 */
export function getTacoSnsGovernanceCanisterId(): string {
  return 'lhdfz-wqaaa-aaaaq-aae3q-cai'
}

/**
 * App SneedDAO Backend Canister ID
 */
export function getAppSneedDaoCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_APP_SNEEDDAO_BACKEND_IC') || 'g7s5u-tqaaa-aaaad-qhktq-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_APP_SNEEDDAO_BACKEND_STAGING') || 'g7s5u-tqaaa-aaaad-qhktq-cai'
    default:
      return 'g7s5u-tqaaa-aaaad-qhktq-cai'
  }
}

/**
 * ICP Ledger Canister ID
 */
export function getIcpLedgerCanisterId(): string {
  // ICP Ledger is always the same on mainnet
  const network = getNetwork()
  if (network === 'local') {
    return getEnvVar('CANISTER_ID_LEDGER_LOCAL') || 'ryjl3-tyaaa-aaaaa-aaaba-cai'
  }
  return 'ryjl3-tyaaa-aaaaa-aaaba-cai'
}

/**
 * Alarm Canister ID
 */
export function getAlarmCanisterId(): string {
  const network = getNetwork()

  switch (network) {
    case 'ic':
      return getEnvVar('CANISTER_ID_ALARM_IC') || 'b2cwp-6qaaa-aaaad-qhn6a-cai'
    case 'staging':
      return getEnvVar('CANISTER_ID_ALARM_STAGING') || 'b2cwp-6qaaa-aaaad-qhn6a-cai'
    default:
      return 'b2cwp-6qaaa-aaaad-qhn6a-cai' // local
  }
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
    alarm: getAlarmCanisterId(),
  }
}
