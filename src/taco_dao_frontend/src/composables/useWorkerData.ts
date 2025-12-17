/**
 * Vue Composable for Consuming SharedWorker Data
 *
 * Provides a reactive interface to data from the SharedWorkers.
 * Handles subscription management, caching, and state tracking.
 */

import { ref, computed, onMounted, onUnmounted, watch, type Ref, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import type { DataKey, DataState, WorkerRequest, WorkerResponse, Priority } from '../workers/types'
import { WORKER_ASSIGNMENT, generateMessageId, getRoutePriorities } from '../workers/types'

// ============================================================================
// Worker Instances (singletons)
// ============================================================================

let coreWorker: SharedWorker | null = null
let secondaryWorker: SharedWorker | null = null
let authWorker: SharedWorker | null = null

// Track initialization state
let workersInitialized = false
const workerReadyPromises: Map<string, Promise<void>> = new Map()

// ============================================================================
// Worker Getters
// ============================================================================

function getCoreWorker(): SharedWorker {
  if (!coreWorker) {
    coreWorker = new SharedWorker(
      new URL('../workers/core-public.worker.ts', import.meta.url),
      { type: 'module', name: 'taco-core-public' }
    )
  }
  return coreWorker
}

function getSecondaryWorker(): SharedWorker {
  if (!secondaryWorker) {
    secondaryWorker = new SharedWorker(
      new URL('../workers/secondary-public.worker.ts', import.meta.url),
      { type: 'module', name: 'taco-secondary-public' }
    )
  }
  return secondaryWorker
}

function getAuthWorker(): SharedWorker {
  if (!authWorker) {
    authWorker = new SharedWorker(
      new URL('../workers/authenticated.worker.ts', import.meta.url),
      { type: 'module', name: 'taco-authenticated' }
    )
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
// Worker Communication
// ============================================================================

function sendToWorker(worker: SharedWorker, message: WorkerRequest): void {
  worker.port.postMessage(message)
}

// ============================================================================
// Composable: useWorkerData
// ============================================================================

export interface UseWorkerDataOptions {
  /** Whether to auto-fetch on mount (default: true) */
  autoFetch?: boolean
  /** Override priority for this data */
  priority?: Priority
  /** Don't subscribe, just fetch once */
  fetchOnce?: boolean
}

export interface UseWorkerDataReturn<T> {
  /** Current data state */
  state: ComputedRef<DataState<T>>
  /** Just the data (convenience) */
  data: ComputedRef<T | null>
  /** Loading state */
  loading: ComputedRef<boolean>
  /** Error message if any */
  error: ComputedRef<string | null>
  /** Whether data is stale */
  stale: ComputedRef<boolean>
  /** Last updated timestamp */
  lastUpdated: ComputedRef<number | null>
  /** Trigger a refresh (force fetch) */
  refetch: () => void
  /** Trigger a fetch (respects cache) */
  fetch: () => void
}

export function useWorkerData<T = unknown>(
  dataKey: DataKey,
  options: UseWorkerDataOptions = {}
): UseWorkerDataReturn<T> {
  const { autoFetch = true, priority, fetchOnce = false } = options

  const route = useRoute()

  // Internal state
  const internalState = ref<DataState<T>>({
    data: null,
    lastUpdated: null,
    loading: false,
    error: null,
    stale: true,
  })

  let port: MessagePort | null = null
  let subscribed = false

  // Message handler
  const handleMessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data

    // Only handle messages for our dataKey
    if (response.payload.dataKey !== dataKey) return

    switch (response.type) {
      case 'DATA_UPDATE':
      case 'CACHE_HIT':
      case 'FETCH_COMPLETE':
        internalState.value = response.payload.state as DataState<T>
        break

      case 'FETCH_STARTED':
        internalState.value = {
          ...internalState.value,
          loading: true,
        }
        break

      case 'FETCH_ERROR':
        internalState.value = {
          ...internalState.value,
          loading: false,
          error: response.payload.error || 'Unknown error',
        }
        break
    }
  }

  // Subscribe to worker updates
  const subscribe = () => {
    if (subscribed || fetchOnce) return

    const message: WorkerRequest = {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'SUBSCRIBE',
      payload: { dataKey },
    }

    sendToWorker(getWorkerForKey(dataKey), message)
    subscribed = true
  }

  // Unsubscribe from worker updates
  const unsubscribe = () => {
    if (!subscribed) return

    const message: WorkerRequest = {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'UNSUBSCRIBE',
      payload: { dataKey },
    }

    try {
      sendToWorker(getWorkerForKey(dataKey), message)
    } catch {
      // Worker might be terminated
    }
    subscribed = false
  }

  // Fetch data (respects cache)
  const fetch = () => {
    const currentPriority =
      priority || getRoutePriorities(route.path, false, false).get(dataKey) || 'medium'

    const message: WorkerRequest = {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'FETCH',
      payload: {
        dataKey,
        priority: currentPriority,
        force: false,
      },
    }

    sendToWorker(getWorkerForKey(dataKey), message)
  }

  // Force refresh (ignores cache)
  const refetch = () => {
    const currentPriority =
      priority || getRoutePriorities(route.path, false, false).get(dataKey) || 'high'

    const message: WorkerRequest = {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'FETCH',
      payload: {
        dataKey,
        priority: currentPriority,
        force: true,
      },
    }

    sendToWorker(getWorkerForKey(dataKey), message)
  }

  // Setup on mount
  onMounted(() => {
    const worker = getWorkerForKey(dataKey)
    port = worker.port

    // Ensure port is started
    port.start()

    // Add message listener
    port.addEventListener('message', handleMessage)

    // Subscribe to updates
    subscribe()

    // Auto-fetch if enabled
    if (autoFetch) {
      fetch()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()

    if (port) {
      port.removeEventListener('message', handleMessage)
    }
  })

  // Re-fetch when route changes (to update priority)
  watch(
    () => route.path,
    () => {
      if (autoFetch && !fetchOnce) {
        fetch()
      }
    }
  )

  // Return reactive interface
  return {
    state: computed(() => internalState.value as DataState<T>),
    data: computed(() => internalState.value.data as T | null),
    loading: computed(() => internalState.value.loading),
    error: computed(() => internalState.value.error),
    stale: computed(() => internalState.value.stale),
    lastUpdated: computed(() => internalState.value.lastUpdated),
    refetch,
    fetch,
  }
}

// ============================================================================
// Composable: useMultipleWorkerData
// ============================================================================

export function useMultipleWorkerData<T extends Record<string, unknown>>(
  dataKeys: DataKey[],
  options: UseWorkerDataOptions = {}
): {
  states: ComputedRef<Record<DataKey, DataState>>
  loading: ComputedRef<boolean>
  allLoaded: ComputedRef<boolean>
  refetchAll: () => void
} {
  const results = new Map<DataKey, ReturnType<typeof useWorkerData>>()

  for (const key of dataKeys) {
    results.set(key, useWorkerData(key, options))
  }

  return {
    states: computed(() => {
      const states: Record<string, DataState> = {}
      for (const [key, result] of results) {
        states[key] = result.state.value
      }
      return states as Record<DataKey, DataState>
    }),
    loading: computed(() => {
      for (const result of results.values()) {
        if (result.loading.value) return true
      }
      return false
    }),
    allLoaded: computed(() => {
      for (const result of results.values()) {
        if (result.data.value === null) return false
      }
      return true
    }),
    refetchAll: () => {
      for (const result of results.values()) {
        result.refetch()
      }
    },
  }
}

// ============================================================================
// Utility: Initialize All Workers
// ============================================================================

export function initializeWorkers(): void {
  if (workersInitialized) return

  // Create all workers
  getCoreWorker()
  getSecondaryWorker()
  getAuthWorker()

  workersInitialized = true
  console.log('[useWorkerData] All workers initialized')
}

// ============================================================================
// Utility: Set Visibility State
// ============================================================================

export function setWorkersVisibility(visible: boolean): void {
  const message: WorkerRequest = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'SET_VISIBILITY',
    payload: { visible },
  }

  if (coreWorker) sendToWorker(coreWorker, message)
  if (secondaryWorker) sendToWorker(secondaryWorker, message)
  if (authWorker) sendToWorker(authWorker, message)
}

// ============================================================================
// Utility: Set Identity for Auth Worker
// ============================================================================

export function setWorkerIdentity(serializedIdentity: {
  delegationChainJson: string
  sessionKeyJson: string
}): void {
  const message: WorkerRequest = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'SET_IDENTITY',
    payload: { identity: serializedIdentity },
  }

  sendToWorker(getAuthWorker(), message)
}

export function clearWorkerIdentity(): void {
  const message: WorkerRequest = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CLEAR_IDENTITY',
    payload: {},
  }

  sendToWorker(getAuthWorker(), message)
}

// ============================================================================
// Utility: Set Admin Status
// ============================================================================

export function setWorkerAdminStatus(isAdmin: boolean): void {
  const message: WorkerRequest = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'SET_ADMIN',
    payload: { isAdmin },
  }

  sendToWorker(getAuthWorker(), message)
}

// ============================================================================
// Utility: Invalidate Cache
// ============================================================================

export function invalidateWorkerCache(dataKeys?: DataKey[]): void {
  const message: WorkerRequest = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'INVALIDATE',
    payload: { dataKeys },
  }

  if (coreWorker) sendToWorker(coreWorker, message)
  if (secondaryWorker) sendToWorker(secondaryWorker, message)
  if (authWorker) sendToWorker(authWorker, message)
}

// ============================================================================
// Utility: Get Worker Instances (for advanced usage)
// ============================================================================

export function getWorkers(): {
  core: SharedWorker | null
  secondary: SharedWorker | null
  auth: SharedWorker | null
} {
  return {
    core: coreWorker,
    secondary: secondaryWorker,
    auth: authWorker,
  }
}
