/**
 * Worker Bridge Store
 *
 * Manages SharedWorker lifecycle, route-based priority updates,
 * visibility tracking, and identity management for the auth worker.
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

// ============================================================================
// Worker Instances (singletons)
// ============================================================================

let coreWorker: SharedWorker | null = null
let secondaryWorker: SharedWorker | null = null
let authWorker: SharedWorker | null = null

// Track initialization
let initialized = false

// Track when workers have delivered initial cache
let cacheDeliveryPromise: Promise<void> | null = null
let cacheDeliveryResolve: (() => void) | null = null

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

function getCoreWorker(): SharedWorker {
  if (!coreWorker) {
    coreWorker = new SharedWorker(
      new URL('../workers/core-public.worker.ts', import.meta.url),
      { type: 'module', name: 'taco-core-public' }
    )
    setupWorkerPort(coreWorker, 'core')
  }
  return coreWorker
}

function getSecondaryWorker(): SharedWorker {
  if (!secondaryWorker) {
    secondaryWorker = new SharedWorker(
      new URL('../workers/secondary-public.worker.ts', import.meta.url),
      { type: 'module', name: 'taco-secondary-public' }
    )
    setupWorkerPort(secondaryWorker, 'secondary')
  }
  return secondaryWorker
}

function getAuthWorker(): SharedWorker {
  if (!authWorker) {
    authWorker = new SharedWorker(
      new URL('../workers/authenticated.worker.ts', import.meta.url),
      { type: 'module', name: 'taco-authenticated' }
    )
    setupWorkerPort(authWorker, 'auth')
  }
  return authWorker
}

function getWorkerForKey(dataKey: DataKey): SharedWorker {
  const workerType = WORKER_ASSIGNMENT[dataKey]

  switch (workerType) {
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
 * Read network override from localStorage (called in main thread context)
 */
function getStoredNetworkOverride(): 'ic' | 'staging' | 'local' | null {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('taco_network_override')
    if (override === 'ic' || override === 'staging' || override === 'local') {
      return override
    }
  }
  return null
}

function setupWorkerPort(worker: SharedWorker, workerName: string): void {
  const port = worker.port

  // Handle worker errors (e.g., syntax errors, import failures)
  worker.onerror = (event) => {
    console.error(`[WorkerBridge] Worker ${workerName} error:`, event)
    console.error(`[WorkerBridge] Error details:`, event.message, event.filename, event.lineno)
  }

  port.onmessage = (event: MessageEvent<WorkerResponse>) => {
    handleWorkerMessage(event.data, workerName)
  }

  port.onmessageerror = (event) => {
    console.error(`[WorkerBridge] Message error from ${workerName}:`, event)
  }

  // Start the port
  port.start()

  // CRITICAL: Send network override immediately after port starts
  // Workers can't access localStorage, so we must tell them the network setting
  const networkOverride = getStoredNetworkOverride()
  if (networkOverride) {
    sendToWorker(worker, {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'SET_NETWORK',
      payload: { network: networkOverride },
    })
  }
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
        updateDataStore(payload.dataKey, payload.state)
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
      console.error(`[WorkerBridge] Fetch error for ${payload.dataKey}:`, payload.error)
      break

    case 'PONG':
      // Health check response
      break
  }
}

// Pending fetch promises - used by fetchAndWait (declared early for use in updateDataStore)
const pendingFetches = new Map<DataKey, { resolve: (data: unknown) => void; reject: (err: Error) => void }[]>()

function updateDataStore(dataKey: DataKey, state: DataState): void {
  dataStore.set(dataKey, state)

  // Notify subscribers FIRST so they can process/deserialize the data
  const callbacks = subscriptions.get(dataKey)
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

function sendToWorker(worker: SharedWorker, message: WorkerRequest): void {
  worker.port.postMessage(message)
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
 */
export function initWorkerBridge(): void {
  if (initialized) return

  // Set up promise for initial cache delivery
  cacheDeliveryPromise = new Promise((resolve) => {
    cacheDeliveryResolve = resolve
  })

  // Create all workers
  getCoreWorker()
  getSecondaryWorker()
  getAuthWorker()

  // Set up visibility tracking
  setupVisibilityTracking()

  // Resolve cache delivery promise after a short delay
  // This gives workers time to load from IndexedDB and send cached data
  setTimeout(() => {
    if (cacheDeliveryResolve) {
      cacheDeliveryResolve()
    }
  }, 150) // 150ms should be enough for IndexedDB read + message passing

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

  // Subscribe to worker
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

function setupVisibilityTracking(): void {
  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible'
    isVisible.value = visible

    broadcastToAllWorkers({
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'SET_VISIBILITY',
      payload: { visible },
    })
  })
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
