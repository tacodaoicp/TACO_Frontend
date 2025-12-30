/**
 * Worker Bridge Store
 *
 * Manages Worker lifecycle, route-based priority updates,
 * visibility tracking, and identity management for the auth worker.
 *
 * Automatically uses SharedWorker when available (desktop browsers),
 * falls back to dedicated Worker for browsers without SharedWorker support
 * (iOS Safari, some mobile browsers).
 */

import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { DataKey, Priority, DataState, WorkerRequest, WorkerResponse } from '../workers/types'
import {
  WORKER_ASSIGNMENT,
  ROUTE_PRIORITIES,
  generateMessageId,
  getRoutePriorities,
} from '../workers/types'
import { createWorkerAdapterFromUrl, isSharedWorkerSupported, type WorkerAdapter } from '../workers/worker-adapter'

// Import worker URLs using Vite's worker URL syntax - ensures proper bundling in production
import CoreWorkerUrl from '../workers/core-public.worker.ts?worker&url'
import SecondaryWorkerUrl from '../workers/secondary-public.worker.ts?worker&url'
import AuthWorkerUrl from '../workers/authenticated.worker.ts?worker&url'
import CoreDedicatedWorkerUrl from '../workers/core-public.dedicated.worker.ts?worker&url'
import SecondaryDedicatedWorkerUrl from '../workers/secondary-public.dedicated.worker.ts?worker&url'
import AuthDedicatedWorkerUrl from '../workers/authenticated.dedicated.worker.ts?worker&url'

// ============================================================================
// Debug Mode (set VITE_WORKER_DEBUG=true to enable worker logs in console)
// ============================================================================

const WORKER_DEBUG = import.meta.env.VITE_WORKER_DEBUG === 'true'

// ============================================================================
// Worker Instances (singletons)
// ============================================================================

let coreWorker: WorkerAdapter | null = null
let secondaryWorker: WorkerAdapter | null = null
let authWorker: WorkerAdapter | null = null

// Track worker type for logging
let workerType: 'shared' | 'dedicated' = 'shared'

// Track initialization
let initialized = false

// Track when workers have delivered initial cache
let cacheDeliveryPromise: Promise<void> | null = null
let cacheDeliveryResolve: (() => void) | null = null
let workersReportedCacheReady = 0
const EXPECTED_WORKERS_FOR_CACHE = 2 // core + secondary (auth waits for identity)

// ============================================================================
// State
// ============================================================================

// Data store - holds all fetched data
const dataStore = new Map<DataKey, DataState>()

// Subscriptions - callbacks for data updates
const subscriptions = new Map<DataKey, Set<(data: unknown, state: DataState) => void>>()

// Current route for priority calculation
const currentRoute = ref('/')

// Visibility state
const isVisible = ref(true)

// Admin status
const isAdmin = ref(false)

// Connected state
const workersConnected = ref(false)

// ============================================================================
// Worker Getters
// ============================================================================

// Increment to force browser to load fresh SharedWorker code
const WORKER_VERSION = 'v2'

function getCoreWorker(): WorkerAdapter {
  if (!coreWorker) {
    coreWorker = createWorkerAdapterFromUrl(
      CoreWorkerUrl,
      CoreDedicatedWorkerUrl,
      `taco-core-public-${WORKER_VERSION}`
    )
    setupWorkerAdapter(coreWorker, 'core')
  }
  return coreWorker
}

function getSecondaryWorker(): WorkerAdapter {
  if (!secondaryWorker) {
    secondaryWorker = createWorkerAdapterFromUrl(
      SecondaryWorkerUrl,
      SecondaryDedicatedWorkerUrl,
      `taco-secondary-public-${WORKER_VERSION}`
    )
    setupWorkerAdapter(secondaryWorker, 'secondary')
  }
  return secondaryWorker
}

function getAuthWorker(): WorkerAdapter {
  if (!authWorker) {
    authWorker = createWorkerAdapterFromUrl(
      AuthWorkerUrl,
      AuthDedicatedWorkerUrl,
      `taco-authenticated-${WORKER_VERSION}`
    )
    setupWorkerAdapter(authWorker, 'auth')
  }
  return authWorker
}

function getWorkerForKey(dataKey: DataKey): WorkerAdapter {
  const assignment = WORKER_ASSIGNMENT[dataKey]

  switch (assignment) {
    case 'core':
      return getCoreWorker()
    case 'secondary':
      return getSecondaryWorker()
    case 'auth':
      return getAuthWorker()
    default:
      throw new Error(`Unknown worker type for dataKey: ${dataKey}`)
  }
}

// ============================================================================
// Worker Setup
// ============================================================================

/**
 * Get the effective network for workers (main thread context)
 * Workers can't reliably access process.env or localStorage, so main thread must tell them
 */
function getEffectiveNetwork(): 'ic' | 'staging' | 'local' {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('taco_network_override')
    if (override === 'ic' || override === 'staging' || override === 'local') {
      return override
    }
  }
  // @ts-ignore - Vite/dfx injects this at build time
  const envNetwork = process.env.DFX_NETWORK
  if (envNetwork === 'ic' || envNetwork === 'staging') {
    return envNetwork
  }
  return 'local'
}

function setupWorkerAdapter(worker: WorkerAdapter, workerName: string): void {
  // Handle worker errors (e.g., syntax errors, import failures)
  worker.onerror = (event) => {
    console.error(`[WorkerBridge] Worker ${workerName} error:`, event)
    if (event) {
      console.error(`[WorkerBridge] Error details:`, event.message, event.filename, event.lineno)
    }
  }

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    handleWorkerMessage(event.data, workerName)
  }

  worker.onmessageerror = (event) => {
    console.error(`[WorkerBridge] Message error from ${workerName}:`, event)
  }

  // CRITICAL: Always send network to workers immediately after setup
  // Workers can't reliably access process.env or localStorage
  sendToWorker(worker, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'SET_NETWORK',
    payload: { network: getEffectiveNetwork() },
  })
}

function handleWorkerMessage(response: WorkerResponse, workerName: string): void {
  const { type, payload } = response

  switch (type) {
    case 'CONNECTED':
      workersConnected.value = true
      break

    case 'DATA_UPDATE':
    case 'CACHE_HIT':
    case 'FETCH_COMPLETE':
      if (payload.dataKey && payload.state) {
        if (WORKER_DEBUG) {
          const dataInfo = payload.state?.data ? (Array.isArray(payload.state.data) ? `array[${payload.state.data.length}]` : typeof payload.state.data) : 'null'
          console.log(`[WorkerBridge] ${type} received for ${payload.dataKey} from ${workerName}, data=${dataInfo}`)
        }
        updateDataStore(payload.dataKey, payload.state)
      } else if (WORKER_DEBUG) {
        console.warn(`[WorkerBridge] ${type} received but missing dataKey or state`, payload)
      }
      break

    case 'FETCH_STARTED':
      if (payload.dataKey) {
        const current = dataStore.get(payload.dataKey)
        if (current) {
          updateDataStore(payload.dataKey, { ...current, loading: true })
        }
      }
      break

    case 'FETCH_ERROR':
      if (payload.dataKey) {
        const current = dataStore.get(payload.dataKey)
        if (current) {
          updateDataStore(payload.dataKey, {
            ...current,
            loading: false,
            error: payload.error || 'Unknown error',
          })
        }
      }
      // Only log unexpected errors (not access denied)
      const isAccessDenied = payload.error && (
        payload.error.includes('canister_inspect_message') ||
        payload.error.includes('refused message') ||
        payload.error.includes('not authorized') ||
        payload.error.includes('is not a function')
      )
      if (!isAccessDenied) {
        console.error(`[WorkerBridge] Fetch error for ${payload.dataKey}:`, payload.error)
      }
      break

    case 'PONG':
      // Health check response
      break

    case 'INITIAL_CACHE_READY':
      workersReportedCacheReady++
      if (WORKER_DEBUG) {
        console.log(`[WorkerBridge] ${workerName} reported cache ready (${workersReportedCacheReady}/${EXPECTED_WORKERS_FOR_CACHE})`)
      }
      if (workersReportedCacheReady >= EXPECTED_WORKERS_FOR_CACHE && cacheDeliveryResolve) {
        cacheDeliveryResolve()
        cacheDeliveryResolve = null
      }
      break

    case 'DEBUG_LOG':
      // Forward worker logs to main thread console for debugging (only if debug mode enabled)
      if (WORKER_DEBUG && payload.debugMessage) {
        console.log(`[Worker:${workerName}] ${payload.debugMessage}`)
      }
      break
  }
}

// Pending fetch promises - used by fetchAndWait (declared early for use in updateDataStore)
const pendingFetches = new Map<DataKey, { resolve: (data: unknown) => void; reject: (err: Error) => void }[]>()

function updateDataStore(dataKey: DataKey, state: DataState): void {
  dataStore.set(dataKey, state)

  // Notify subscribers FIRST so they can process/deserialize the data
  const callbacks = subscriptions.get(dataKey)
  if (WORKER_DEBUG) {
    console.log(`[WorkerBridge] updateDataStore for ${dataKey}, hasData=${!!state?.data}, subscriberCount=${callbacks?.size || 0}`)
  }
  if (callbacks) {
    for (const callback of callbacks) {
      try {
        callback(state.data, state)
      } catch (error) {
        console.error(`[WorkerBridge] Subscriber error for ${dataKey}:`, error)
      }
    }
  }

  // THEN resolve any pending fetchAndWait promises
  // This ensures subscriptions have run and updated their refs before fetchAndWait returns
  if (state.data !== null && !state.loading) {
    const pending = pendingFetches.get(dataKey)
    if (pending && pending.length > 0) {
      for (const { resolve } of pending) {
        resolve(state.data)
      }
      pendingFetches.delete(dataKey)
    }
  }
}

// ============================================================================
// Worker Communication
// ============================================================================

function sendToWorker(worker: WorkerAdapter, message: WorkerRequest): void {
  worker.postMessage(message)
}

function broadcastToAllWorkers(message: WorkerRequest): void {
  if (coreWorker) sendToWorker(coreWorker, message)
  if (secondaryWorker) sendToWorker(secondaryWorker, message)
  if (authWorker) sendToWorker(authWorker, message)
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize all workers and set up visibility tracking
 * @param route - The initial route path (e.g., '/admin') to prioritize correct data
 */
export function initWorkerBridge(route?: string): void {
  if (initialized) return

  if (WORKER_DEBUG) {
    console.log('[WorkerBridge] initWorkerBridge called with route:', route)
  }

  // Determine worker type
  workerType = isSharedWorkerSupported() ? 'shared' : 'dedicated'

  // Set up promise for initial cache delivery
  cacheDeliveryPromise = new Promise((resolve) => {
    cacheDeliveryResolve = resolve
  })

  // Create all workers
  try {
    getCoreWorker()
    getSecondaryWorker()
    getAuthWorker()
  } catch (error) {
    console.error('[WorkerBridge] Failed to create workers:', error)
  }

  // Send INITIAL_LOAD with route to workers for selective data loading
  // This tells workers to only send/fetch critical+high priority data for this route initially
  // Use provided route, or fall back to stored value, or default to '/'
  const initialRoute = route || currentRoute.value || '/'
  currentRoute.value = initialRoute // Sync the stored route
  const initialLoadMessage = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'INITIAL_LOAD' as const,
    payload: { route: initialRoute },
  }
  // Reset cache ready counter for fresh initialization
  workersReportedCacheReady = 0

  if (WORKER_DEBUG) {
    console.log('[WorkerBridge] Sending INITIAL_LOAD to workers...')
  }
  sendToWorker(getCoreWorker(), initialLoadMessage)
  sendToWorker(getSecondaryWorker(), initialLoadMessage)
  sendToWorker(getAuthWorker(), initialLoadMessage)
  if (WORKER_DEBUG) {
    console.log('[WorkerBridge] INITIAL_LOAD sent to all workers')
  }

  // Set up visibility tracking
  setupVisibilityTracking()

  // Set up activity tracking for idle detection
  setupActivityTracking()

  // Safety fallback timeout in case worker messages are lost
  // Normally resolved earlier by INITIAL_CACHE_READY signals from workers
  setTimeout(() => {
    if (cacheDeliveryResolve) {
      if (WORKER_DEBUG) {
        console.warn('[WorkerBridge] Cache delivery timeout - proceeding anyway')
      }
      cacheDeliveryResolve()
      cacheDeliveryResolve = null
    }
  }, 500) // Increased timeout as fallback only

  initialized = true
}

/**
 * Wait for workers to deliver initial cached data.
 * Call this before checking cached refs on page load.
 */
export async function waitForInitialCache(): Promise<void> {
  if (!cacheDeliveryPromise) {
    // Not initialized yet, return immediately
    return
  }
  await cacheDeliveryPromise
}

/**
 * Subscribe to data updates for a specific data key
 */
export function subscribe(
  dataKey: DataKey,
  callback: (data: unknown, state: DataState) => void
): () => void {
  if (!subscriptions.has(dataKey)) {
    subscriptions.set(dataKey, new Set())
  }

  subscriptions.get(dataKey)!.add(callback)
  if (WORKER_DEBUG) {
    console.log(`[WorkerBridge] subscribe called for ${dataKey}, total subscribers now: ${subscriptions.get(dataKey)!.size}`)
  }

  // Immediately call callback with cached data if available
  // This provides instant data on navigation without waiting for worker round-trip
  const cachedState = dataStore.get(dataKey)
  if (cachedState?.data) {
    if (WORKER_DEBUG) {
      console.log(`[WorkerBridge] subscribe: found cached data for ${dataKey}, calling callback`)
    }
    // Use setTimeout to ensure callback runs after subscription is fully set up
    setTimeout(() => callback(cachedState.data, cachedState), 0)
  }

  // Subscribe to worker for updates
  const worker = getWorkerForKey(dataKey)
  sendToWorker(worker, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'SUBSCRIBE',
    payload: { dataKey },
  })

  // Return unsubscribe function
  return () => {
    subscriptions.get(dataKey)?.delete(callback)

    // Unsubscribe from worker if no more local subscribers
    if (subscriptions.get(dataKey)?.size === 0) {
      sendToWorker(worker, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'UNSUBSCRIBE',
        payload: { dataKey },
      })
    }
  }
}

/**
 * Trigger a fetch for a specific data key
 */
export function fetch(dataKey: DataKey, force: boolean = false): void {
  const priority = getRoutePriorities(currentRoute.value, isAdmin.value, true).get(dataKey) || 'medium'

  const worker = getWorkerForKey(dataKey)
  sendToWorker(worker, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'FETCH',
    payload: {
      dataKey,
      priority,
      force,
    },
  })
}

/**
 * Trigger a fetch for a specific data key and wait for the result.
 * Returns a Promise that resolves when data arrives via subscription.
 * Timeout defaults to 30 seconds.
 */
export function fetchAndWait<T>(dataKey: DataKey, force: boolean = false, timeoutMs: number = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      // Remove from pending
      const pending = pendingFetches.get(dataKey)
      if (pending) {
        const idx = pending.findIndex(p => p.resolve === resolveWrapper)
        if (idx >= 0) pending.splice(idx, 1)
        if (pending.length === 0) pendingFetches.delete(dataKey)
      }
      reject(new Error(`Fetch timeout for ${dataKey}`))
    }, timeoutMs)

    // Wrapper to clear timeout on resolve
    const resolveWrapper = (data: unknown) => {
      clearTimeout(timeoutId)
      resolve(data as T)
    }

    const rejectWrapper = (err: Error) => {
      clearTimeout(timeoutId)
      reject(err)
    }

    // Add to pending fetches
    if (!pendingFetches.has(dataKey)) {
      pendingFetches.set(dataKey, [])
    }
    pendingFetches.get(dataKey)!.push({ resolve: resolveWrapper, reject: rejectWrapper })

    // Trigger the fetch
    fetch(dataKey, force)
  })
}

/**
 * Get cached data for a specific data key (synchronous)
 */
export function getCached<T>(dataKey: DataKey): T | null {
  const state = dataStore.get(dataKey)
  return (state?.data as T) || null
}

/**
 * Get full state for a specific data key (synchronous)
 */
export function getState(dataKey: DataKey): DataState | null {
  return dataStore.get(dataKey) || null
}

/**
 * Invalidate cache for specific keys or all keys
 */
export function invalidate(dataKeys?: DataKey[]): void {
  broadcastToAllWorkers({
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'INVALIDATE',
    payload: { dataKeys },
  })
}

/**
 * Set the current route for priority calculation
 */
export function setCurrentRoute(route: string): void {
  currentRoute.value = route
  updatePrioritiesForRoute(route)
}

/**
 * Update admin status and trigger admin data preload if needed
 */
export function setAdminStatus(admin: boolean): void {
  const wasAdmin = isAdmin.value
  isAdmin.value = admin

  // Notify auth worker
  if (authWorker) {
    sendToWorker(authWorker, {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'SET_ADMIN',
      payload: { isAdmin: admin },
    })
  }

  // If user just became admin, trigger priority update
  if (admin && !wasAdmin) {
    updatePrioritiesForRoute(currentRoute.value)
  }
}

/**
 * Set identity for authenticated worker
 */
export function setIdentity(serializedIdentity: {
  delegationChainJson: string
  sessionKeyJson: string
}): void {
  if (authWorker) {
    sendToWorker(authWorker, {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'SET_IDENTITY',
      payload: { identity: serializedIdentity },
    })
  }
}

/**
 * Clear identity from authenticated worker (logout)
 */
export function clearIdentity(): void {
  if (authWorker) {
    sendToWorker(authWorker, {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'CLEAR_IDENTITY',
      payload: {},
    })
  }
}

/**
 * Set network override for testing (mainnet from local, etc.)
 * Use 'ic' for mainnet, 'staging' for staging, 'local' for local dfx, or null for auto-detect.
 */
export function setNetwork(network: 'ic' | 'staging' | 'local' | null): void {
  broadcastToAllWorkers({
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'SET_NETWORK',
    payload: { network },
  })
}

// ============================================================================
// Visibility Tracking
// ============================================================================

// Track if listeners have been set up to prevent duplicates
let listenersSetup = false
let visibilityHandler: (() => void) | null = null

function setupVisibilityTracking(): void {
  // Only setup once to prevent duplicate listeners
  if (visibilityHandler) return

  visibilityHandler = () => {
    const visible = document.visibilityState === 'visible'
    isVisible.value = visible

    broadcastToAllWorkers({
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'SET_VISIBILITY',
      payload: { visible },
    })
  }

  document.addEventListener('visibilitychange', visibilityHandler)
}

// ============================================================================
// User Activity Tracking (for idle detection in workers)
// ============================================================================

let activityThrottleTimer: ReturnType<typeof setTimeout> | null = null
const activityEvents = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']

function notifyUserActivity(): void {
  // Throttle activity notifications to every 30 seconds max
  if (activityThrottleTimer) return

  activityThrottleTimer = setTimeout(() => {
    activityThrottleTimer = null
  }, 30000)

  broadcastToAllWorkers({
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'USER_ACTIVITY',
    payload: {},
  })
}

function setupActivityTracking(): void {
  // Only setup once to prevent duplicate listeners
  if (listenersSetup) return
  listenersSetup = true

  // Track user interactions that indicate active usage
  for (const event of activityEvents) {
    document.addEventListener(event, notifyUserActivity, { passive: true })
  }
}

// ============================================================================
// Route Priority Updates
// ============================================================================

function updatePrioritiesForRoute(route: string): void {
  const priorities = getRoutePriorities(route, isAdmin.value, true)

  // Group by worker
  const coreKeys: Array<{ dataKey: DataKey; priority: Priority }> = []
  const secondaryKeys: Array<{ dataKey: DataKey; priority: Priority }> = []
  const authKeys: Array<{ dataKey: DataKey; priority: Priority }> = []

  for (const [dataKey, priority] of priorities) {
    const worker = WORKER_ASSIGNMENT[dataKey]
    const item = { dataKey, priority }

    switch (worker) {
      case 'core':
        coreKeys.push(item)
        break
      case 'secondary':
        secondaryKeys.push(item)
        break
      case 'auth':
        authKeys.push(item)
        break
    }
  }

  // Send priority updates to each worker
  if (coreWorker && coreKeys.length > 0) {
    for (const { dataKey, priority } of coreKeys) {
      sendToWorker(coreWorker, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'SET_PRIORITY',
        payload: { dataKey, priority },
      })
    }
  }

  if (secondaryWorker && secondaryKeys.length > 0) {
    for (const { dataKey, priority } of secondaryKeys) {
      sendToWorker(secondaryWorker, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'SET_PRIORITY',
        payload: { dataKey, priority },
      })
    }
  }

  if (authWorker && authKeys.length > 0) {
    for (const { dataKey, priority } of authKeys) {
      sendToWorker(authWorker, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'SET_PRIORITY',
        payload: { dataKey, priority },
      })
    }
  }

  // Also trigger fetches for critical/high priority items on route change
  for (const [dataKey, priority] of priorities) {
    if (priority === 'critical' || priority === 'high') {
      fetch(dataKey, false)
    }
  }
}

// ============================================================================
// Vue Router Integration Helper
// ============================================================================

/**
 * Set up route watcher - call this in App.vue setup
 */
export function setupRouteWatcher(): void {
  const route = useRoute()

  watch(
    () => route.path,
    (newPath) => {
      setCurrentRoute(newPath)
    },
    { immediate: true }
  )
}

// ============================================================================
// Exports for composables
// ============================================================================

export const workerBridge = {
  init: initWorkerBridge,
  waitForInitialCache,
  subscribe,
  fetch,
  fetchAndWait,
  getCached,
  getState,
  invalidate,
  setCurrentRoute,
  setAdminStatus,
  setIdentity,
  clearIdentity,
  setNetwork,
  setupRouteWatcher,
  isConnected: computed(() => workersConnected.value),
  isVisible: computed(() => isVisible.value),
  isAdmin: computed(() => isAdmin.value),
}

export default workerBridge
