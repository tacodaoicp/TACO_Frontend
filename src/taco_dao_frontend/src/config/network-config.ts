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

/**
 * Debug mode - controls whether debug messages are logged
 * Default is false (no debug messages)
 */
const DEBUG_MODE_DEFAULT = false

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

// ============================================================================
// Debug Mode
// ============================================================================

// Store original console.log for critical messages
const originalConsoleLog = console.log.bind(console)

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  if (isBrowser()) {
    const debug = localStorage.getItem('taco_debug_mode')
    if (debug === 'true') return true
    if (debug === 'false') return false
  }
  return DEBUG_MODE_DEFAULT
}

/**
 * Set debug mode (persists to localStorage)
 * When enabled: console.log works normally
 * When disabled: console.log is suppressed (use originalLog for critical messages)
 */
export function setDebugMode(enabled: boolean): void {
  if (isBrowser()) {
    localStorage.setItem('taco_debug_mode', enabled ? 'true' : 'false')
    applyDebugMode(enabled)
    originalConsoleLog(`[TACO] Debug mode ${enabled ? 'ON' : 'OFF'}`)
  }
}

/**
 * Apply debug mode by overriding/restoring console.log
 */
function applyDebugMode(enabled: boolean): void {
  if (enabled) {
    // Restore original console.log
    console.log = originalConsoleLog
  } else {
    // Suppress console.log (make it a no-op)
    console.log = () => {}
  }
}

/**
 * Initialize debug mode on page load
 */
export function initDebugMode(): void {
  if (isBrowser()) {
    const enabled = isDebugEnabled()
    applyDebugMode(enabled)
  }
}

/**
 * Force log - always logs regardless of debug mode (for critical messages)
 */
export function forceLog(...args: any[]): void {
  originalConsoleLog(...args)
}

/**
 * Debug log - only logs if debug mode is enabled (legacy helper)
 */
export function debugLog(category: string, ...args: any[]): void {
  if (isDebugEnabled()) {
    originalConsoleLog(`[${category}]`, ...args)
  }
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

  // Auto-use mainnet when on localhost/192.x addresses (local dev without dfx)
  const hostname = window.location.hostname
  const isLocalAddress = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')
  let override = getNetworkOverride()

  if (isLocalAddress && !override) {
    // Auto-set mainnet for local development
    setNetworkOverride('ic')
    override = 'ic'
    console.log('[NetworkConfig] Local address detected - auto-connecting to mainnet')
  }

  // Apply network override to all workers
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
    debug: (enabled?: boolean) => {
      if (enabled === undefined) {
        // Toggle if no argument provided
        const current = isDebugEnabled()
        setDebugMode(!current)
        console.log(`Debug mode ${!current ? 'ON' : 'OFF'}`)
      } else {
        setDebugMode(enabled)
        console.log(`Debug mode ${enabled ? 'ON' : 'OFF'}`)
      }
      return isDebugEnabled()
    },
    status: () => {
      const status = {
        ...getNetworkStatus(),
        debugMode: isDebugEnabled()
      }
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
tacoConfig.debug()       - Toggle debug messages (default: off)
tacoConfig.debug(true)   - Enable debug messages
tacoConfig.debug(false)  - Disable debug messages
tacoConfig.status()      - Show current configuration
tacoConfig.help()        - Show this help

Changes apply immediately - workers will refetch data from new network.
      `)
    },
  }

  // Show help only for local addresses
  const hostname = window.location.hostname
  const isLocalAddress = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')
  if (isLocalAddress) {
    ;(window as any).tacoConfig.help()
  }

}

// Initialize debug mode immediately on module load
initDebugMode()

export default {
  getNetworkOverride,
  setNetworkOverride,
  initNetworkConfig,
  getEffectiveNetwork,
  getNetworkStatus,
  isDebugEnabled,
  setDebugMode,
  initDebugMode,
  debugLog,
  forceLog,
}
