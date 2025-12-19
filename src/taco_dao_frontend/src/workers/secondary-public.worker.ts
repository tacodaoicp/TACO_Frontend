/**
 * Secondary Public Data SharedWorker
 *
 * Handles medium-priority public data that requires no authentication:
 * - votingPowerMetrics (DAO backend)
 * - tacoProposals (SNS Governance)
 * - proposalsThreads (Sneed Forum)
 * - allNames (AppSneedDAO)
 * - neuronSnapshotStatus (NeuronSnapshot canister)
 * - portfolioSnapshotStatus (Treasury)
 */

/// <reference lib="webworker" />

import { AnonymousIdentity, HttpAgent } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { PriorityQueue } from './shared/priority-queue'
import { BackoffTracker } from './shared/backoff'
import { getCached, setCached, getAllCached } from './shared/indexed-db'
import { getHost, shouldFetchRootKey, setWorkerNetworkOverride } from './shared/canister-ids'
import {
  fetchVotingPowerMetricsData,
  fetchTacoProposalsData,
  fetchProposalsThreadsData,
  fetchAllNamesData,
  fetchNeuronSnapshotStatusData,
  fetchPortfolioSnapshotStatusData,
  serializeForTransfer,
} from './shared/fetch-functions'
import type {
  DataKey,
  DataState,
  WorkerRequest,
  WorkerResponse,
  Priority,
} from './types'
import {
  STALENESS_THRESHOLDS,
  BACKGROUND_MULTIPLIER,
  IDLE_TIMEOUT_MS,
  generateMessageId,
  createInitialState,
  getInitialLoadKeys,
} from './types'

declare const self: SharedWorkerGlobalScope

// ============================================================================
// Data keys handled by this worker
// ============================================================================

const HANDLED_KEYS: DataKey[] = [
  'votingPowerMetrics',
  'tacoProposals',
  'proposalsThreads',
  'allNames',
  'neuronSnapshotStatus',
  'portfolioSnapshotStatus',
]

// ============================================================================
// State
// ============================================================================

const dataStates = new Map<DataKey, DataState>()
const connectedPorts = new Set<MessagePort>()
const subscriptions = new Map<DataKey, Set<MessagePort>>()
const queue = new PriorityQueue()
const backoff = new BackoffTracker()

let isProcessing = false
let isBackgroundTab = false
let isIdle = false
let lastActivityTime = Date.now()
let agent: HttpAgent | null = null
let initPromise: Promise<void> | null = null
let isInitialized = false

// Initial load state - track which keys are priority for current route
let initialLoadKeys: Set<DataKey> = new Set()
let pendingPriorityKeys: Set<DataKey> = new Set() // Keys still being fetched
let deferredLoadTriggered = false

// Queue of ports waiting for cached data after init
const pendingCacheDeliveries: Array<{ port: MessagePort; keys: DataKey[] }> = []

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  console.log('[SecondaryWorker] Initializing...')

  // Initialize all data states
  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
    subscriptions.set(key, new Set())
  }

  // Load cached data from IndexedDB
  try {
    const cached = await getAllCached()
    for (const [key, state] of cached) {
      if (HANDLED_KEYS.includes(key)) {
        dataStates.set(key, {
          ...state,
          stale: isStale(key, state.lastUpdated),
        })
        console.log(`[SecondaryWorker] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[SecondaryWorker] Error loading cache:', error)
  }

  // Create anonymous agent
  await createAnonymousAgent()

  // Mark as initialized
  isInitialized = true

  // Deliver cached data to any ports that connected during init
  console.log(`[SecondaryWorker] Delivering cached data to ${pendingCacheDeliveries.length} pending ports`)
  for (const { port, keys } of pendingCacheDeliveries) {
    for (const key of keys) {
      const state = dataStates.get(key)
      if (state?.data) {
        sendResponse(port, {
          id: generateMessageId(),
          timestamp: Date.now(),
          type: 'CACHE_HIT',
          payload: {
            dataKey: key,
            data: state.data,
            state,
            fromCache: true,
          },
        })
      }
    }
  }
  pendingCacheDeliveries.length = 0 // Clear the queue

  // Start processing loop
  processQueue()

  console.log('[SecondaryWorker] Initialized')
}

async function createAnonymousAgent(): Promise<void> {
  agent = await createAgent({
    identity: new AnonymousIdentity(),
    host: getHost(),
    fetchRootKey: shouldFetchRootKey(),
  })
}

// ============================================================================
// Connection Handling
// ============================================================================

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0]
  connectedPorts.add(port)

  console.log(`[SecondaryWorker] Port connected. Total: ${connectedPorts.size}`)

  // Don't reset state here - INITIAL_LOAD message will handle that with route context

  port.onmessage = (e: MessageEvent<WorkerRequest>) => {
    handleMessage(port, e.data)
  }

  port.onmessageerror = () => {
    disconnectPort(port)
  }

  port.start()

  // Send connected message only - don't send all cached data automatically
  sendResponse(port, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CONNECTED',
    payload: {
      dataKey: 'votingPowerMetrics',
      state: dataStates.get('votingPowerMetrics') || createInitialState(),
      fromCache: false,
      tabCount: connectedPorts.size,
    },
  })

  if (!isInitialized) {
    console.log(`[SecondaryWorker] Port connected before init - waiting for INITIAL_LOAD`)
  }
}

function disconnectPort(port: MessagePort): void {
  connectedPorts.delete(port)
  for (const subscribers of subscriptions.values()) {
    subscribers.delete(port)
  }
  console.log(`[SecondaryWorker] Port disconnected. Total: ${connectedPorts.size}`)
}

// ============================================================================
// Message Handling
// ============================================================================

function handleMessage(port: MessagePort, message: WorkerRequest): void {
  switch (message.type) {
    case 'FETCH':
      handleFetch(port, message)
      break

    case 'SET_PRIORITY':
      handleSetPriority(message)
      break

    case 'SET_VISIBILITY':
      isBackgroundTab = !message.payload.visible
      console.log(`[SecondaryWorker] Visibility: ${message.payload.visible ? 'visible' : 'hidden'}`)
      if (message.payload.visible) {
        recordActivity()
      }
      break

    case 'USER_ACTIVITY':
      recordActivity()
      break

    case 'GET_CACHED':
      handleGetCached(port, message)
      break

    case 'SUBSCRIBE':
      handleSubscribe(port, message)
      break

    case 'UNSUBSCRIBE':
      handleUnsubscribe(port, message)
      break

    case 'INVALIDATE':
      handleInvalidate(message)
      break

    case 'SET_NETWORK':
      handleSetNetwork(message)
      break

    case 'PING':
      sendResponse(port, {
        id: message.id,
        timestamp: Date.now(),
        type: 'PONG',
        payload: {
          dataKey: 'votingPowerMetrics',
          state: createInitialState(),
          fromCache: false,
          tabCount: connectedPorts.size,
        },
      })
      break

    case 'RESET':
      // Reset all state that could block fetches after fast page refresh
      console.log('[SecondaryWorker] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
      backoff.resetAll()
      queue.clearProcessing()
      activeFetchCount = 0
      // Re-send all cached data to this port (new page load needs it)
      for (const key of HANDLED_KEYS) {
        const state = dataStates.get(key)
        if (state?.data) {
          sendResponse(port, {
            id: generateMessageId(),
            timestamp: Date.now(),
            type: 'CACHE_HIT',
            payload: {
              dataKey: key,
              data: state.data,
              state,
              fromCache: true,
            },
          })
        }
      }
      break

    case 'INITIAL_LOAD':
      handleInitialLoad(port, message)
      break
  }
}

/**
 * Handle initial page load - only send/fetch critical+high priority data for the route
 * Deferred data loads after all priority keys have loaded
 */
function handleInitialLoad(port: MessagePort, message: WorkerRequest): void {
  const route = message.payload.route || '/'
  console.log(`[SecondaryWorker] INITIAL_LOAD for route: ${route}`)

  // Reset state for fresh page load
  backoff.resetAll()
  queue.clearProcessing()
  activeFetchCount = 0
  deferredLoadTriggered = false
  pendingPriorityKeys.clear()

  // Get priority keys for this route
  const priorityKeys = getInitialLoadKeys(route)
  initialLoadKeys = new Set(priorityKeys.filter(key => HANDLED_KEYS.includes(key)))

  console.log(`[SecondaryWorker] Priority keys for route: ${Array.from(initialLoadKeys).join(', ') || 'none'}`)

  // Send cached data ONLY for priority keys immediately
  for (const key of initialLoadKeys) {
    const state = dataStates.get(key)
    if (state?.data) {
      sendResponse(port, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'CACHE_HIT',
        payload: {
          dataKey: key,
          data: state.data,
          state,
          fromCache: true,
        },
      })
    }
    // Queue fetch for stale priority data and track it
    if (!state?.data || isStale(key, state.lastUpdated)) {
      pendingPriorityKeys.add(key)
      queue.enqueue(key, 'critical')
    }
  }

  // If no priority keys need fetching, trigger deferred load immediately
  if (pendingPriorityKeys.size === 0) {
    triggerDeferredLoad()
  }
}

/**
 * Called when a priority key finishes loading - triggers deferred load when all done
 */
function onPriorityKeyLoaded(dataKey: DataKey): void {
  if (!pendingPriorityKeys.has(dataKey)) return

  pendingPriorityKeys.delete(dataKey)
  console.log(`[SecondaryWorker] Priority key loaded: ${dataKey}, remaining: ${pendingPriorityKeys.size}`)

  // When all priority keys are loaded, trigger deferred loading immediately (non-blocking)
  if (pendingPriorityKeys.size === 0 && !deferredLoadTriggered) {
    triggerDeferredLoad()
  }
}

/**
 * Load non-priority keys after priority keys are done
 */
function triggerDeferredLoad(): void {
  if (deferredLoadTriggered) return
  deferredLoadTriggered = true

  console.log('[SecondaryWorker] All priority keys loaded - starting deferred load for non-priority keys')

  // Send cached data and queue fetches for remaining keys
  for (const key of HANDLED_KEYS) {
    if (initialLoadKeys.has(key)) continue // Already handled

    const state = dataStates.get(key)
    // Send cached data to all subscribers
    if (state?.data) {
      broadcastToSubscribers(key, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'CACHE_HIT',
        payload: {
          dataKey: key,
          data: state.data,
          state,
          fromCache: true,
        },
      })
    }
    // Queue fetch if stale
    if (!state?.data || isStale(key, state.lastUpdated)) {
      queue.enqueue(key, 'low')
    }
  }
}

function handleFetch(port: MessagePort, message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) return

  const currentState = dataStates.get(dataKey)

  // Stale-while-revalidate
  if (currentState?.data && !force) {
    sendResponse(port, {
      id: message.id,
      timestamp: Date.now(),
      type: 'CACHE_HIT',
      payload: {
        dataKey,
        data: currentState.data,
        state: currentState,
        fromCache: true,
      },
    })
  }

  // Queue for refresh if needed
  if (force || !currentState?.data || isStale(dataKey, currentState.lastUpdated)) {
    queue.enqueue(dataKey, priority)
  }
}

function handleSetPriority(message: WorkerRequest): void {
  const { dataKey, priority } = message.payload
  if (!dataKey || !priority || !HANDLED_KEYS.includes(dataKey)) return
  queue.updatePriority(dataKey, priority)
}

function handleGetCached(port: MessagePort, message: WorkerRequest): void {
  const { dataKey } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) return

  const state = dataStates.get(dataKey)
  if (state) {
    sendResponse(port, {
      id: message.id,
      timestamp: Date.now(),
      type: 'CACHE_HIT',
      payload: {
        dataKey,
        data: state.data,
        state,
        fromCache: true,
      },
    })
  }
}

function handleSubscribe(port: MessagePort, message: WorkerRequest): void {
  const { dataKey, dataKeys } = message.payload
  const keysToSubscribe = dataKeys || (dataKey ? [dataKey] : [])
  const validKeys = keysToSubscribe.filter((key: DataKey) => HANDLED_KEYS.includes(key))

  // Add to subscriptions immediately
  for (const key of validKeys) {
    subscriptions.get(key)?.add(port)
  }

  // If not yet initialized, queue this port for cache delivery when init completes
  if (!isInitialized) {
    console.log(`[SecondaryWorker] Not yet initialized, queuing cache delivery for ${validKeys.length} keys`)
    pendingCacheDeliveries.push({ port, keys: validKeys })
    return
  }

  // Already initialized - send cached data immediately
  for (const key of validKeys) {
    const state = dataStates.get(key)
    if (state?.data) {
      sendResponse(port, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'CACHE_HIT',
        payload: {
          dataKey: key,
          data: state.data,
          state,
          fromCache: true,
        },
      })
    }
  }
}

function handleUnsubscribe(port: MessagePort, message: WorkerRequest): void {
  const { dataKey, dataKeys } = message.payload
  const keysToUnsubscribe = dataKeys || (dataKey ? [dataKey] : [])

  for (const key of keysToUnsubscribe) {
    subscriptions.get(key)?.delete(port)
  }
}

function handleInvalidate(message: WorkerRequest): void {
  const { dataKey, dataKeys } = message.payload
  const keysToInvalidate = dataKeys || (dataKey ? [dataKey] : HANDLED_KEYS)

  for (const key of keysToInvalidate) {
    if (HANDLED_KEYS.includes(key)) {
      const state = dataStates.get(key)
      if (state) {
        state.stale = true
        dataStates.set(key, state)
      }
      queue.enqueue(key, 'critical')
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  console.log(`[SecondaryWorker] Network override set to: ${network || 'auto'}`)
  setWorkerNetworkOverride(network || null)

  // Recreate agent with new network settings
  await createAnonymousAgent()

  // Clear IndexedDB cache - data is from a different network
  try {
    const { clearAllCached } = await import('./shared/indexed-db')
    await clearAllCached()
    console.log('[SecondaryWorker] Cleared IndexedDB cache due to network change')
  } catch (err) {
    console.error('[SecondaryWorker] Error clearing cache:', err)
  }

  // Clear in-memory state and queue for refetch
  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
    queue.enqueue(key, 'high')
  }
}

// ============================================================================
// Queue Processing (Parallel)
// ============================================================================

// Maximum concurrent fetches - higher priority items are dequeued first
const MAX_CONCURRENT_FETCHES = 4
let activeFetchCount = 0

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (true) {
    // Start new fetches up to the limit (priority queue returns highest priority first)
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      // Get next highest-priority item (queue.dequeue handles deduplication internally)
      const item = queue.dequeue()

      if (!item) {
        break
      }

      if (!backoff.canRetry(item.dataKey)) {
        queue.retry(item.dataKey)
        continue
      }

      // Start fetch in parallel (don't await) - critical/high priority items start first
      activeFetchCount++
      processSingleFetch(item).finally(() => {
        activeFetchCount--
      })
    }

    await sleep(50)
  }
}

async function processSingleFetch(item: { dataKey: DataKey; retryCount: number }): Promise<void> {
  try {
    backoff.recordAttempt(item.dataKey)
    await fetchData(item.dataKey)
    backoff.recordSuccess(item.dataKey)
    queue.complete(item.dataKey)
  } catch (error) {
    console.error(`[SecondaryWorker] Error fetching ${item.dataKey}:`, error)
    backoff.recordFailure(item.dataKey)

    updateState(item.dataKey, {
      loading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (item.retryCount < 5) {
      queue.retry(item.dataKey)
    } else {
      queue.complete(item.dataKey)
    }
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  updateState(dataKey, { loading: true, error: null })

  if (!agent) {
    await createAnonymousAgent()
  }

  let data: unknown

  switch (dataKey) {
    case 'votingPowerMetrics':
      data = serializeForTransfer(await fetchVotingPowerMetricsData(agent!))
      break

    case 'tacoProposals':
      data = serializeForTransfer(await fetchTacoProposalsData(agent!))
      break

    case 'proposalsThreads':
      data = serializeForTransfer(await fetchProposalsThreadsData(agent!))
      break

    case 'allNames':
      const namesData = await fetchAllNamesData(agent!)
      // Convert Maps to serializable format for storage
      data = {
        principalNames: Object.fromEntries(namesData.principalNames),
        neuronNames: Object.fromEntries(namesData.neuronNames),
      }
      break

    case 'neuronSnapshotStatus':
      data = serializeForTransfer(await fetchNeuronSnapshotStatusData(agent!))
      break

    case 'portfolioSnapshotStatus':
      data = serializeForTransfer(await fetchPortfolioSnapshotStatusData(agent!))
      break

    default:
      throw new Error(`Unknown dataKey: ${dataKey}`)
  }

  updateState(dataKey, {
    data,
    lastUpdated: Date.now(),
    loading: false,
    error: null,
    stale: false,
  })

  await setCached(dataKey, data)

  // Notify that this priority key has loaded (triggers deferred load when all done)
  onPriorityKeyLoaded(dataKey)
}

// ============================================================================
// State Management
// ============================================================================

function updateState(dataKey: DataKey, partial: Partial<DataState>): void {
  const current = dataStates.get(dataKey) || createInitialState()
  const updated = { ...current, ...partial }
  dataStates.set(dataKey, updated)

  const response: WorkerResponse = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: partial.error ? 'FETCH_ERROR' : 'DATA_UPDATE',
    payload: {
      dataKey,
      data: updated.data,
      error: partial.error || undefined,
      state: updated,
      fromCache: false,
    },
  }

  broadcastToSubscribers(dataKey, response)
}

function broadcastToSubscribers(dataKey: DataKey, response: WorkerResponse): void {
  const subscribers = subscriptions.get(dataKey)
  if (!subscribers) return

  for (const port of subscribers) {
    sendResponse(port, response)
  }
}

function sendResponse(port: MessagePort, response: WorkerResponse): void {
  try {
    port.postMessage(response)
  } catch {
    disconnectPort(port)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function isStale(dataKey: DataKey, lastUpdated: number | null): boolean {
  if (!lastUpdated) return true
  const threshold = STALENESS_THRESHOLDS[dataKey]
  const multiplier = isBackgroundTab ? BACKGROUND_MULTIPLIER : 1
  return Date.now() - lastUpdated > threshold * multiplier
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function checkIdleStatus(): void {
  const wasIdle = isIdle
  isIdle = Date.now() - lastActivityTime > IDLE_TIMEOUT_MS
  if (isIdle && !wasIdle) {
    console.log('[SecondaryWorker] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    console.log('[SecondaryWorker] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    console.log('[SecondaryWorker] Activity detected - resuming refreshes')
  }
}

// ============================================================================
// Auto-refresh Loop
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  while (true) {
    await sleep(10000) // Check every 10 seconds (less frequent than core worker)

    // Check if we should enter idle mode
    checkIdleStatus()

    // Skip auto-refresh if idle
    if (isIdle) {
      continue
    }

    for (const dataKey of HANDLED_KEYS) {
      const state = dataStates.get(dataKey)
      if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
        const threshold = STALENESS_THRESHOLDS[dataKey]
        const age = state.lastUpdated ? Date.now() - state.lastUpdated : Infinity
        const priority: Priority = age > threshold * 2 ? 'high' : 'medium'
        queue.enqueue(dataKey, priority)
      }
    }
  }
}

// ============================================================================
// Start Worker
// ============================================================================

init().then(() => {
  autoRefreshLoop()
})
