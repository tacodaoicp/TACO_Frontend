/**
 * Core Public Data SharedWorker
 *
 * Handles high-priority public data that requires no authentication:
 * - cryptoPrices (external API)
 * - tokenDetails (DAO backend)
 * - totalTreasuryValueInUsd (calculated from tokenDetails)
 * - aggregateAllocation (DAO backend)
 * - tradingStatus (Treasury)
 * - timerStatus (DAO + Treasury combined)
 */

/// <reference lib="webworker" />

import { AnonymousIdentity, HttpAgent } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { PriorityQueue } from './shared/priority-queue'
import { BackoffTracker } from './shared/backoff'
import { getCached, setCached, getAllCached } from './shared/indexed-db'
import { getHost, shouldFetchRootKey, setWorkerNetworkOverride } from './shared/canister-ids'
import {
  fetchCryptoPricesData,
  fetchTokenDetailsData,
  fetchAggregateAllocationData,
  fetchTradingStatusData,
  fetchTimerStatusData,
  calculateTotalTreasuryValueInUsd,
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
  'cryptoPrices',
  'tokenDetails',
  'totalTreasuryValueInUsd',
  'aggregateAllocation',
  'tradingStatus',
  'timerStatus',
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
let currentNetwork: 'ic' | 'staging' | 'local' | null = null // Track current network to detect changes

// Initial load state - track which keys are priority for current route
let initialLoadKeys: Set<DataKey> = new Set()
let pendingPriorityKeys: Set<DataKey> = new Set() // Keys still being fetched
let deferredLoadTriggered = false

// Queue of ports waiting for cached data after init
const pendingCacheDeliveries: Array<{ port: MessagePort; keys: DataKey[] }> = []

// Pending INITIAL_LOAD message to process after init completes
let pendingInitialLoad: { port: MessagePort; message: WorkerRequest } | null = null

// Track which ports have received INITIAL_CACHE_READY to prevent duplicates
const portsReceivedCacheReady = new WeakSet<MessagePort>()

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  console.log('[CoreWorker] Initializing...')

  // Initialize all data states
  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
    subscriptions.set(key, new Set())
  }

  // DON'T start agent creation here - wait for SET_NETWORK message
  // The network override must be set before we know which host to connect to
  // Agent creation will be triggered by handleSetNetwork

  // Load cached data from IndexedDB (runs in parallel with agent creation)
  try {
    const cached = await getAllCached()
    for (const [key, state] of cached) {
      if (HANDLED_KEYS.includes(key)) {
        dataStates.set(key, {
          ...state,
          stale: isStale(key, state.lastUpdated),
        })
        console.log(`[CoreWorker] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[CoreWorker] Error loading cache:', error)
  }

  // Mark as initialized IMMEDIATELY after cache load (before agent is ready)
  // This allows cached data to be delivered without waiting for agent
  isInitialized = true

  // Deliver cached data to any ports that connected during init
  // Also queue fetches for stale/missing data
  console.log(`[CoreWorker] Delivering cached data to ${pendingCacheDeliveries.length} pending ports`)
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
      // Queue fetch if data is missing or stale
      if ((!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
        queue.enqueue(key, 'high')
      }
    }
    // Note: Don't send INITIAL_CACHE_READY here - it will be sent by handleInitialLoad
    // which runs right after this when processing pendingInitialLoad
  }
  pendingCacheDeliveries.length = 0 // Clear the queue

  // Process pending INITIAL_LOAD if one arrived before init completed
  if (pendingInitialLoad) {
    console.log('[CoreWorker] Processing pending INITIAL_LOAD')
    handleInitialLoad(pendingInitialLoad.port, pendingInitialLoad.message)
    pendingInitialLoad = null
  }

  console.log('[CoreWorker] Cache initialized, agent will be created when SET_NETWORK is received')

  // Don't wait for agent here - it will be created by handleSetNetwork
  // Start processing loop - it will wait for agent to be available before fetching
  processQueue()

  console.log('[CoreWorker] Init complete, waiting for SET_NETWORK')
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

  console.log(`[CoreWorker] Port connected. Total: ${connectedPorts.size}`)

  // Don't reset state here - INITIAL_LOAD message will handle that with route context
  // This allows SharedWorker to maintain state across tab connections

  port.onmessage = (e: MessageEvent<WorkerRequest>) => {
    handleMessage(port, e.data)
  }

  port.onmessageerror = () => {
    disconnectPort(port)
  }

  port.start()

  // Send connected message only - don't send all cached data automatically
  // INITIAL_LOAD message will trigger selective data delivery based on route
  sendResponse(port, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CONNECTED',
    payload: {
      dataKey: 'cryptoPrices',
      state: dataStates.get('cryptoPrices') || createInitialState(),
      fromCache: false,
      tabCount: connectedPorts.size,
    },
  })

  // If not yet initialized, queue this port for minimal cache delivery when init completes
  // Note: INITIAL_LOAD will handle the actual selective data delivery
  if (!isInitialized) {
    console.log(`[CoreWorker] Port connected before init - waiting for INITIAL_LOAD`)
  }
}

function disconnectPort(port: MessagePort): void {
  connectedPorts.delete(port)
  // Remove from all subscriptions
  for (const subscribers of subscriptions.values()) {
    subscribers.delete(port)
  }
  console.log(`[CoreWorker] Port disconnected. Total: ${connectedPorts.size}`)
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
      console.log(`[CoreWorker] Visibility: ${message.payload.visible ? 'visible' : 'hidden'}`)
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
          dataKey: 'cryptoPrices',
          state: createInitialState(),
          fromCache: false,
          tabCount: connectedPorts.size,
        },
      })
      break

    case 'RESET':
      // Reset all state that could block fetches after fast page refresh
      console.log('[CoreWorker] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
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
  console.log(`[CoreWorker] INITIAL_LOAD for route: ${route}`)

  // If not initialized yet, queue this for processing after init completes
  if (!isInitialized) {
    console.log(`[CoreWorker] Not initialized, queuing INITIAL_LOAD for route: ${route}`)
    pendingInitialLoad = { port, message }
    return
  }

  // Reset state for fresh page load
  backoff.resetAll()
  queue.clearProcessing()
  activeFetchCount = 0
  deferredLoadTriggered = false
  pendingPriorityKeys.clear()

  // Get priority keys for this route
  const priorityKeys = getInitialLoadKeys(route)
  initialLoadKeys = new Set(priorityKeys.filter(key => HANDLED_KEYS.includes(key)))

  console.log(`[CoreWorker] Priority keys for route: ${Array.from(initialLoadKeys).join(', ')}`)

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

  // Signal that initial cache delivery is complete for this worker
  // Only send once per port to prevent duplicate signals
  if (!portsReceivedCacheReady.has(port)) {
    portsReceivedCacheReady.add(port)
    sendResponse(port, {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'INITIAL_CACHE_READY',
      payload: {
        dataKey: 'cryptoPrices', // placeholder key (required by type)
        state: createInitialState(),
        fromCache: true,
      },
    })
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
  console.log(`[CoreWorker] Priority key loaded: ${dataKey}, remaining: ${pendingPriorityKeys.size}`)

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

  console.log('[CoreWorker] All priority keys loaded - starting deferred load for non-priority keys')

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

  // Stale-while-revalidate: return cached data immediately if available
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

  // Queue for refresh if stale or forced
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
    console.log(`[CoreWorker] Not yet initialized, queuing cache delivery for ${validKeys.length} keys`)
    pendingCacheDeliveries.push({ port, keys: validKeys })
    return
  }

  // Already initialized - send cached data and queue fetches for stale/missing data
  for (const key of validKeys) {
    const state = dataStates.get(key)

    // Send cached data if available
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

    // Queue fetch if data is missing or stale
    if ((!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
      queue.enqueue(key, 'high')
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
      // Queue for immediate refresh
      queue.enqueue(key, 'critical')
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  const newNetwork = network || 'ic' // Default to 'ic' if not specified

  // Check if this is the first SET_NETWORK or if network actually changed
  const isFirstSetup = currentNetwork === null
  const networkChanged = currentNetwork !== null && currentNetwork !== newNetwork

  console.log(`[CoreWorker] SET_NETWORK: ${newNetwork} (current: ${currentNetwork}, isFirst: ${isFirstSetup}, changed: ${networkChanged})`)

  // Update tracked network
  currentNetwork = newNetwork
  setWorkerNetworkOverride(network || null)

  // Recreate agent with new network settings
  await createAnonymousAgent()

  // Only clear cache if network actually changed (not on first setup)
  if (networkChanged) {
    try {
      const { clearAllCached } = await import('./shared/indexed-db')
      await clearAllCached()
      console.log('[CoreWorker] Cleared IndexedDB cache due to network change')
    } catch (err) {
      console.error('[CoreWorker] Error clearing cache:', err)
    }

    // Clear in-memory state and queue for refetch
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      queue.enqueue(key, 'high')
    }
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
    // If no agent available yet, wait before trying to process
    // This prevents spinning the CPU waiting for SET_NETWORK
    if (!agent) {
      await sleep(100)
      continue
    }

    // Start new fetches up to the limit (priority queue returns highest priority first)
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      // Get next highest-priority item (queue.dequeue handles deduplication internally)
      const item = queue.dequeue()

      if (!item) {
        // No more items available
        break
      }

      // Double-check agent is still available
      if (!agent) {
        queue.retry(item.dataKey)
        break
      }

      // Check backoff
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

    // Wait before checking queue again
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
    console.error(`[CoreWorker] Error fetching ${item.dataKey}:`, error)
    backoff.recordFailure(item.dataKey)

    // Update state with error
    updateState(item.dataKey, {
      loading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Retry if under limit
    if (item.retryCount < 5) {
      queue.retry(item.dataKey)
    } else {
      queue.complete(item.dataKey)
    }
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  // Mark as loading
  updateState(dataKey, { loading: true, error: null })

  // Ensure we have an agent
  if (!agent) {
    await createAnonymousAgent()
  }

  let data: unknown

  switch (dataKey) {
    case 'cryptoPrices':
      // cryptoPrices doesn't need serialization (just numbers)
      data = await fetchCryptoPricesData()
      break

    case 'tokenDetails':
      const rawTokenData = await fetchTokenDetailsData(agent!)
      data = serializeForTransfer(rawTokenData)
      // Also update totalTreasuryValueInUsd when tokenDetails is fetched
      const treasuryValue = calculateTotalTreasuryValueInUsd(rawTokenData as any[])
      updateState('totalTreasuryValueInUsd', {
        data: treasuryValue,
        lastUpdated: Date.now(),
        loading: false,
        error: null,
        stale: false,
      })
      await setCached('totalTreasuryValueInUsd', treasuryValue)
      break

    case 'totalTreasuryValueInUsd':
      // This is calculated from tokenDetails, so fetch that instead
      const tokenData = await fetchTokenDetailsData(agent!)
      data = calculateTotalTreasuryValueInUsd(tokenData as any[])
      // Also update tokenDetails
      updateState('tokenDetails', {
        data: serializeForTransfer(tokenData),
        lastUpdated: Date.now(),
        loading: false,
        error: null,
        stale: false,
      })
      await setCached('tokenDetails', serializeForTransfer(tokenData))
      break

    case 'aggregateAllocation':
      data = serializeForTransfer(await fetchAggregateAllocationData(agent!))
      break

    case 'tradingStatus':
      data = serializeForTransfer(await fetchTradingStatusData(agent!))
      break

    case 'timerStatus':
      data = serializeForTransfer(await fetchTimerStatusData(agent!))
      break

    default:
      throw new Error(`Unknown dataKey: ${dataKey}`)
  }

  // Update state
  updateState(dataKey, {
    data,
    lastUpdated: Date.now(),
    loading: false,
    error: null,
    stale: false,
  })

  // Persist to IndexedDB
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

  // Broadcast to subscribers
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
    console.log('[CoreWorker] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    console.log('[CoreWorker] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    console.log('[CoreWorker] Activity detected - resuming refreshes')
  }
}

// ============================================================================
// Auto-refresh Loop
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  while (true) {
    // Wait for base interval
    await sleep(5000) // Check every 5 seconds

    // Check if we should enter idle mode
    checkIdleStatus()

    // Skip auto-refresh if idle
    if (isIdle) {
      continue
    }

    // Queue stale data for refresh
    for (const dataKey of HANDLED_KEYS) {
      const state = dataStates.get(dataKey)
      if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
        // Determine priority based on staleness
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
