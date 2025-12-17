/**
 * Network Configuration
 *
 * Allows testing the local website against mainnet data without running dfx.
 *
 * USAGE:
 * 1. To test against mainnet from local website:
 *    Open browser console and run: tacoConfig.useMainnet()
 *    Then refresh the page.
 *
 * 2. To switch back to local dfx:
 *    Open browser console and run: tacoConfig.useLocal()
 *    Then refresh the page.
 *
 * You can also set this directly:
 *    localStorage.setItem('taco_network_override', 'ic')
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default network override.
 * Set to 'ic' to always use mainnet, or null for auto-detect from environment.
 */
const NETWORK_OVERRIDE_DEFAULT: 'ic' | 'staging' | 'local' | null = null

// ============================================================================
// Runtime Configuration
// ============================================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * Get network override (for testing mainnet from local)
 */
export function getNetworkOverride(): 'ic' | 'staging' | 'local' | null {
  if (isBrowser()) {
    const override = localStorage.getItem('taco_network_override')
    if (override === 'ic' || override === 'staging' || override === 'local') {
      return override
    }
  }
  return NETWORK_OVERRIDE_DEFAULT
}

/**
 * Set network override (persists to localStorage)
 */
export function setNetworkOverride(network: 'ic' | 'staging' | 'local' | null): void {
  if (isBrowser()) {
    if (network === null) {
      localStorage.removeItem('taco_network_override')
      console.log('[NetworkConfig] Network override cleared. Refresh to apply.')
    } else {
      localStorage.setItem('taco_network_override', network)
      console.log(`[NetworkConfig] Network set to "${network}". Refresh to apply.`)
    }
  }
}

/**
 * Get the effective network (considering override)
 */
export function getEffectiveNetwork(): 'ic' | 'staging' | 'local' {
  const override = getNetworkOverride()
  if (override) {
    return override
  }

  // Auto-detect from environment
  if (typeof import.meta !== 'undefined') {
    // @ts-ignore - Vite injects these
    const envNetwork = import.meta.env?.DFX_NETWORK || import.meta.env?.VITE_DFX_NETWORK
    if (envNetwork === 'ic' || envNetwork === 'staging') {
      return envNetwork
    }
  }

  return 'local'
}

/**
 * Get current configuration status (for debugging)
 */
export function getNetworkStatus(): {
  override: string | null
  effectiveNetwork: string
  host: string
  fetchRootKey: boolean
} {
  const override = getNetworkOverride()
  const effectiveNetwork = getEffectiveNetwork()
  const host = effectiveNetwork === 'local' ? 'http://localhost:4943' : 'https://ic0.app'
  const fetchRootKey = effectiveNetwork === 'local'

  return {
    override,
    effectiveNetwork,
    host,
    fetchRootKey,
  }
}

// ============================================================================
// Console Helper
// ============================================================================

// Reference to workerBridge.setNetwork - will be set by initNetworkConfig()
let workerSetNetwork: ((network: 'ic' | 'staging' | 'local' | null) => void) | null = null

/**
 * Initialize network config with worker bridge reference.
 * Call this after workers are initialized.
 */
export function initNetworkConfig(setNetworkFn: (network: 'ic' | 'staging' | 'local' | null) => void): void {
  workerSetNetwork = setNetworkFn

  // Apply any existing override to workers
  const override = getNetworkOverride()
  if (override) {
    workerSetNetwork(override)
  }
}

if (isBrowser()) {
  (window as any).tacoConfig = {
    useMainnet: () => {
      setNetworkOverride('ic')
      if (workerSetNetwork) {
        workerSetNetwork('ic')
        console.log('Set to MAINNET (ic0.app). Workers updated - data will refresh automatically.')
      } else {
        console.log('Set to MAINNET (ic0.app). Refresh the page to apply.')
      }
    },
    useStaging: () => {
      setNetworkOverride('staging')
      if (workerSetNetwork) {
        workerSetNetwork('staging')
        console.log('Set to STAGING. Workers updated - data will refresh automatically.')
      } else {
        console.log('Set to STAGING. Refresh the page to apply.')
      }
    },
    useLocal: () => {
      setNetworkOverride('local')
      if (workerSetNetwork) {
        workerSetNetwork('local')
        console.log('Set to LOCAL (localhost:4943). Workers updated - data will refresh automatically.')
      } else {
        console.log('Set to LOCAL (localhost:4943). Refresh the page to apply.')
      }
    },
    useAuto: () => {
      setNetworkOverride(null)
      if (workerSetNetwork) {
        workerSetNetwork(null)
        console.log('Set to AUTO-DETECT from environment. Workers updated - data will refresh automatically.')
      } else {
        console.log('Set to AUTO-DETECT from environment. Refresh the page to apply.')
      }
    },
    status: () => {
      const status = getNetworkStatus()
      console.table(status)
      return status
    },
    help: () => {
      console.log(`
TACO DAO Network Configuration:
===============================
tacoConfig.useMainnet()  - Connect to IC mainnet (ic0.app)
tacoConfig.useStaging()  - Connect to staging network
tacoConfig.useLocal()    - Connect to local dfx (localhost:4943)
tacoConfig.useAuto()     - Auto-detect from environment
tacoConfig.status()      - Show current network configuration

Changes apply immediately - workers will refetch data from new network.
      `)
    },
  }



  const envNetwork = import.meta.env?.DFX_NETWORK || import.meta.env?.VITE_DFX_NETWORK


  const override = localStorage.getItem('taco_network_override')
    if (override === 'ic' || override === 'staging' || override === 'local') {
        console.log('[NetworkConfig] Type tacoConfig.help() for network commands')
    }else if (envNetwork === 'local' || envNetwork === 'staging') {
      console.log('[NetworkConfig] Type tacoConfig.help() for network commands')
    }

}

export default {
  getNetworkOverride,
  setNetworkOverride,
  initNetworkConfig,
  getEffectiveNetwork,
  getNetworkStatus,
}
