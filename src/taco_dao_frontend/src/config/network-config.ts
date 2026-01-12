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

// Session-only storage for network override (not persisted to localStorage)
// Only used in dev mode - resets on every page refresh
let sessionNetworkOverride: 'ic' | 'staging' | 'local' | null = null

// DEV ONLY: Simulate stuck stake (skip ClaimOrRefresh step)
let simulateStuckStakeEnabled = false

/**
 * Check if stuck stake simulation is enabled (DEV ONLY)
 */
export function isSimulateStuckStakeEnabled(): boolean {
  return simulateStuckStakeEnabled
}

/**
 * Enable/disable stuck stake simulation (DEV ONLY)
 */
export function setSimulateStuckStake(enabled: boolean): void {
  simulateStuckStakeEnabled = enabled
}

/**
 * Get network override (for testing from local dev server)
 * Uses session-only storage (resets on refresh)
 */
export function getNetworkOverride(): 'ic' | 'staging' | 'local' | null {
  return sessionNetworkOverride ?? NETWORK_OVERRIDE_DEFAULT
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
 * Set network override (session-only, not persisted)
 * Only works in dev mode via tacoConfig
 */
export function setNetworkOverride(network: 'ic' | 'staging' | 'local' | null): void {
  sessionNetworkOverride = network
  if (network === null) {
    console.log('[NetworkConfig] Network override cleared.')
  } else {
    console.log(`[NetworkConfig] Network set to "${network}".`)
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

  // Auto-detect from hostname (critical for production where env vars may not be set)
  if (isBrowser()) {
    const hostname = window.location.hostname
    // Production domains
    if (hostname === 'tacodao.com' || hostname.endsWith('.tacodao.com') || hostname.endsWith('.icp0.io') || hostname.endsWith('.ic0.app')) {
      return 'ic'
    }
    // Staging canister
    if (hostname.includes('wxunf-maaaa-aaaab-qbzga-cai')) {
      return 'staging'
    }
    // Local development (localhost, 127.0.0.1, or LAN addresses like 192.x.x.x)
    // Default to mainnet for local dev so you can test against real data without running dfx
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')) {
      return 'ic'
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

  // Get the effective network (already auto-detects based on hostname)
  const effectiveNetwork = getEffectiveNetwork()

  // Log what network we're using
  if (isBrowser()) {
    const hostname = window.location.hostname
    const isLocalAddress = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')
    if (isLocalAddress && effectiveNetwork === 'ic') {
      console.log('[NetworkConfig] Local dev detected - using mainnet (ic0.app)')
    }
  }

  // Apply the effective network to all workers
  workerSetNetwork(effectiveNetwork)
}

// DEV ONLY: tacoConfig is completely excluded from production builds
// @ts-ignore - import.meta.env is injected by Vite
if (import.meta.env?.DEV && isBrowser()) {
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
        debugMode: isDebugEnabled(),
        simulateStuckStake: isSimulateStuckStakeEnabled()
      }
      console.table(status)
      return status
    },
    simulateStuckStake: (enabled?: boolean) => {
      if (enabled === undefined) {
        const current = isSimulateStuckStakeEnabled()
        setSimulateStuckStake(!current)
        console.log(`Simulate stuck stake: ${!current ? 'ON - next neuron creation will skip ClaimOrRefresh!' : 'OFF'}`)
      } else {
        setSimulateStuckStake(enabled)
        console.log(`Simulate stuck stake: ${enabled ? 'ON - next neuron creation will skip ClaimOrRefresh!' : 'OFF'}`)
      }
      return isSimulateStuckStakeEnabled()
    },
    help: () => {
      console.log(`
TACO DAO Network Configuration (DEV ONLY):
==========================================
tacoConfig.useMainnet()  - Connect to IC mainnet (ic0.app)
tacoConfig.useStaging()  - Connect to staging network
tacoConfig.useLocal()    - Connect to local dfx (localhost:4943)
tacoConfig.useAuto()     - Auto-detect from environment
tacoConfig.debug()       - Toggle debug messages (default: off)
tacoConfig.debug(true)   - Enable debug messages
tacoConfig.debug(false)  - Disable debug messages
tacoConfig.simulateStuckStake()       - Toggle stuck stake simulation
tacoConfig.simulateStuckStake(true)   - Enable: skip ClaimOrRefresh on next neuron creation
tacoConfig.simulateStuckStake(false)  - Disable stuck stake simulation
tacoConfig.status()      - Show current configuration
tacoConfig.help()        - Show this help

Note: Settings are session-only (reset on page refresh).
      `)
    },
  }

  // Show help on startup in dev mode
  ;(window as any).tacoConfig.help()
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
  isSimulateStuckStakeEnabled,
  setSimulateStuckStake,
}
