/**
 * Network Configuration
 *
 * Manages network switching between staging/mainnet/local.
 * Default is staging. Use tacoConfig in browser console to switch.
 *
 * USAGE:
 *   tacoConfig.useMainnet()  - Switch to mainnet
 *   tacoConfig.useStaging()  - Switch to staging (default)
 *   tacoConfig.useLocal()    - Switch to local dfx
 *   tacoConfig.useAuto()     - Auto-detect from environment
 *   tacoConfig.status()      - Show current config
 */

import { setNetworkResolver } from '../constants/canisterIds'

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

// Network override — persisted to localStorage so it survives refreshes
const NETWORK_OVERRIDE_KEY = 'taco_network_override'

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
 * Persisted to localStorage so it survives page refreshes
 */
export function getNetworkOverride(): 'ic' | 'staging' | 'local' | null {
  if (isBrowser()) {
    const stored = localStorage.getItem(NETWORK_OVERRIDE_KEY)
    if (stored === 'ic' || stored === 'staging' || stored === 'local') return stored
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
 * Set network override (persisted to localStorage)
 */
export function setNetworkOverride(network: 'ic' | 'staging' | 'local' | null): void {
  if (isBrowser()) {
    if (network === null) {
      localStorage.removeItem(NETWORK_OVERRIDE_KEY)
      console.log('[NetworkConfig] Network override cleared.')
    } else {
      localStorage.setItem(NETWORK_OVERRIDE_KEY, network)
      console.log(`[NetworkConfig] Network set to "${network}" (persisted).`)
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

  // Auto-detect from hostname (critical for production where env vars may not be set)
  if (isBrowser()) {
    const hostname = window.location.hostname
    // Staging canister (check BEFORE generic .icp0.io to avoid false positive)
    if (hostname.includes('wxunf-maaaa-aaaab-qbzga-cai')) {
      return 'staging'
    }
    // Production domains
    if (hostname === 'tacodao.com' || hostname.endsWith('.tacodao.com') || hostname.endsWith('.icp0.io') || hostname.endsWith('.ic0.app')) {
      return 'ic'
    }
    // Local development (localhost, 127.0.0.1, or LAN addresses like 192.x.x.x)
    // Default to staging so local dev uses staging canisters unless overridden
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')) {
      return 'staging'
    }
  }

  return 'staging'
}

/**
 * Whether the app is running in a dev/staging environment (for UI visibility decisions).
 * Checks actual deployment context (hostname, Vite flags) — NOT the data endpoint override.
 * This means useMainnet() on local/staging only changes where data comes from,
 * not which UI features are visible.
 */
export function isDevEnvironment(): boolean {
  // Vite dev server (npm run dev)
  // @ts-ignore - import.meta.env is injected by Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return true
  }
  if (isBrowser()) {
    const hostname = window.location.hostname
    // Local development (localhost, 127.0.0.1, LAN)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')) {
      return true
    }
    // Staging canister
    if (hostname.includes('wxunf-maaaa-aaaab-qbzga-cai')) {
      return true
    }
  }
  return false
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
  const host = effectiveNetwork === 'local' ? `http://localhost:${import.meta.env.VITE_LOCAL_PORT || '6667'}` : getICHost()
  const fetchRootKey = effectiveNetwork === 'local'

  return {
    override,
    effectiveNetwork,
    host,
    fetchRootKey,
  }
}

// ============================================================================
// Network Change Callbacks
// ============================================================================

// Callbacks invoked when network changes (e.g., clear actor caches)
const _networkChangeCallbacks: (() => void)[] = []

/**
 * Register a callback to be called when network changes via tacoConfig.
 * Used by taco.store to clear actor caches on network switch.
 */
export function registerNetworkChangeCallback(fn: () => void): void {
  _networkChangeCallbacks.push(fn)
}

/**
 * Clear ALL localStorage on network change.
 * Only preserves the network override itself (just set moments ago).
 */
function clearAllStorage(): void {
  if (!isBrowser()) return

  // Save the network override we just set
  const networkOverride = localStorage.getItem(NETWORK_OVERRIDE_KEY)
  const debugMode = localStorage.getItem('taco_debug_mode')

  // Nuke everything
  localStorage.clear()

  // Restore only the network override and debug mode
  if (networkOverride) localStorage.setItem(NETWORK_OVERRIDE_KEY, networkOverride)
  if (debugMode) localStorage.setItem('taco_debug_mode', debugMode)

  originalConsoleLog('[NetworkConfig] localStorage cleared.')
}

/**
 * Handle network change: clear caches, update workers, notify callbacks
 */
function onNetworkChanged(network: 'ic' | 'staging' | 'local' | null): void {
  // Clear all localStorage (preserves only network override + debug mode)
  clearAllStorage()

  // Update workers
  if (workerSetNetwork) {
    workerSetNetwork(network)
  }

  // Notify registered callbacks (e.g., clear actor caches in taco.store)
  for (const cb of _networkChangeCallbacks) {
    try { cb() } catch (e) { originalConsoleLog('[NetworkConfig] Callback error:', e) }
  }
}

// ============================================================================
// IC Host Detection
// ============================================================================

/**
 * Detect the correct IC boundary node host based on the serving domain.
 * Prevents CORS errors by ensuring API calls go to the same domain as the origin.
 * e.g., app on *.icp0.io → https://icp0.io, app on *.ic0.app → https://ic0.app
 */
export function getICHost(): string {
  if (isBrowser()) {
    const hostname = window.location.hostname
    if (hostname.endsWith('.ic0.app') || hostname === 'ic0.app') {
      return 'https://ic0.app'
    }
  }
  // Default to icp0.io (modern IC domain, used by *.icp0.io and custom domains)
  return 'https://icp0.io'
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
    if (isLocalAddress) {
      originalConsoleLog(`[NetworkConfig] Local dev detected - using ${effectiveNetwork}`)
    }
  }

  // Apply the effective network to all workers
  workerSetNetwork(effectiveNetwork)
}

// tacoConfig — available in all environments for debugging/network switching
if (isBrowser()) {
  (window as any).tacoConfig = {
    useMainnet: () => {
      setNetworkOverride('ic')
      onNetworkChanged('ic')
      originalConsoleLog('Set to MAINNET (ic0.app). Caches cleared, workers updated.')
    },
    useStaging: () => {
      setNetworkOverride('staging')
      onNetworkChanged('staging')
      originalConsoleLog('Set to STAGING. Caches cleared, workers updated.')
    },
    useLocal: () => {
      setNetworkOverride('local')
      onNetworkChanged('local')
      originalConsoleLog(`Set to LOCAL (localhost:${import.meta.env.VITE_LOCAL_PORT || '6667'}). Caches cleared, workers updated.`)
    },
    useAuto: () => {
      setNetworkOverride(null)
      onNetworkChanged(null)
      originalConsoleLog(`Set to AUTO-DETECT (resolved: ${getEffectiveNetwork()}). Caches cleared, workers updated.`)
    },
    debug: (enabled?: boolean) => {
      if (enabled === undefined) {
        const current = isDebugEnabled()
        setDebugMode(!current)
        originalConsoleLog(`Debug mode ${!current ? 'ON' : 'OFF'}`)
      } else {
        setDebugMode(enabled)
        originalConsoleLog(`Debug mode ${enabled ? 'ON' : 'OFF'}`)
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
        originalConsoleLog(`Simulate stuck stake: ${!current ? 'ON - next neuron creation will skip ClaimOrRefresh!' : 'OFF'}`)
      } else {
        setSimulateStuckStake(enabled)
        originalConsoleLog(`Simulate stuck stake: ${enabled ? 'ON - next neuron creation will skip ClaimOrRefresh!' : 'OFF'}`)
      }
      return isSimulateStuckStakeEnabled()
    },
    help: () => {
      originalConsoleLog(`
TACO DAO Network Configuration:
================================
tacoConfig.useMainnet()  - Connect to IC mainnet (ic0.app)
tacoConfig.useStaging()  - Connect to staging network
tacoConfig.useLocal()    - Connect to local dfx (localhost:6667)
tacoConfig.useAuto()     - Auto-detect from environment
tacoConfig.debug()       - Toggle debug messages (default: off)
tacoConfig.debug(true)   - Enable debug messages
tacoConfig.debug(false)  - Disable debug messages
tacoConfig.simulateStuckStake()       - Toggle stuck stake simulation
tacoConfig.simulateStuckStake(true)   - Enable: skip ClaimOrRefresh on next neuron creation
tacoConfig.simulateStuckStake(false)  - Disable stuck stake simulation
tacoConfig.status()      - Show current configuration
tacoConfig.help()        - Show this help

Note: Network changes clear all caches and persist across refreshes.
      `)
    },
  }

  // Show help on startup in dev/staging environments only
  if (isDevEnvironment()) {
    ;(window as any).tacoConfig.help()
  }
}

// Register getEffectiveNetwork as the resolver for canisterIds.ts
setNetworkResolver(getEffectiveNetwork)

// Initialize debug mode immediately on module load
initDebugMode()

export default {
  getNetworkOverride,
  setNetworkOverride,
  initNetworkConfig,
  getEffectiveNetwork,
  getNetworkStatus,
  getICHost,
  isDebugEnabled,
  setDebugMode,
  initDebugMode,
  debugLog,
  forceLog,
  isSimulateStuckStakeEnabled,
  setSimulateStuckStake,
  registerNetworkChangeCallback,
}
