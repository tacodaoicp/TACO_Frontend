/**
 * Public Data Dedicated Worker (Fallback for SharedWorker)
 *
 * This is a dedicated worker version for browsers that don't support SharedWorker (iOS Safari).
 * Handles all public data that requires no authentication:
 * - Core high-priority: cryptoPrices, tokenDetails, totalTreasuryValueInUsd, aggregateAllocation, tradingStatus, timerStatus
 * - Secondary medium-priority: votingPowerMetrics, tacoProposals, proposalsThreads, allNames, neuronSnapshotStatus, portfolioSnapshotStatus
 *
 * Consolidated from core-public.dedicated.worker.ts and secondary-public.dedicated.worker.ts
 */

/// <reference lib="webworker" />

import { AnonymousIdentity, HttpAgent } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { PriorityQueue } from './shared/priority-queue'
import { BackoffTracker } from './shared/backoff'
import { getCached, setCached, getAllCached } from './shared/indexed-db'
import { getHost, shouldFetchRootKey, setWorkerNetworkOverride } from './shared/canister-ids'
import {
  // Core fetch functions
  fetchCryptoPricesData,
  fetchTokenDetailsData,
  fetchAggregateAllocationData,
  fetchTradingStatusData,
  fetchTimerStatusData,
  calculateTotalTreasuryValueInUsd,
  // Secondary fetch functions
  fetchVotingPowerMetricsData,
  fetchTacoProposalsData,
  fetchProposalsThreadsData,
  fetchAllNamesData,
  fetchNeuronSnapshotStatusData,
  fetchPortfolioSnapshotStatusData,
  serializeForTransfer,
  clearActorCache,
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

declare const self: DedicatedWorkerGlobalScope

// ============================================================================
// Data keys handled by this worker (merged core + secondary = 12 keys)
// ============================================================================

const HANDLED_KEYS: DataKey[] = [
  // Core (high priority)
  'cryptoPrices',
  'tokenDetails',
  'totalTreasuryValueInUsd',
  'aggregateAllocation',
  'tradingStatus',
  'timerStatus',
  // Secondary (medium priority)
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
const subscriptions = new Set<DataKey>()
const queue = new PriorityQueue()
const backoff = new BackoffTracker()

let isProcessing = false
let isBackgroundTab = false
let isIdle = false
let lastActivityTime = Date.now()
let agent: HttpAgent | null = null
let isInitialized = false
let currentNetwork: 'ic' | 'staging' | 'local' | null = null
let debugEnabled = false // Debug mode - disabled by default in production

// Initial load state
let initialLoadKeys: Set<DataKey> = new Set()
let pendingPriorityKeys: Set<DataKey> = new Set()
let deferredLoadTriggered = false

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function checkIdleStatus(): void {
  const wasIdle = isIdle
  isIdle = Date.now() - lastActivityTime > IDLE_TIMEOUT_MS
  if (isIdle && !wasIdle) {
    if (debugEnabled) console.log('[PublicWorker-Dedicated] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    if (debugEnabled) console.log('[PublicWorker-Dedicated] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    if (debugEnabled) console.log('[PublicWorker-Dedicated] Activity detected - resuming refreshes')
  }
}

function isStale(dataKey: DataKey, lastUpdated: number | null): boolean {
  if (!lastUpdated) return true
  const threshold = STALENESS_THRESHOLDS[dataKey] || 60_000
  const effectiveThreshold = isBackgroundTab ? threshold * BACKGROUND_MULTIPLIER : threshold
  return Date.now() - lastUpdated > effectiveThreshold
}

function sendResponse(response: WorkerResponse): void {
  self.postMessage(response)
}

function updateState(dataKey: DataKey, updates: Partial<DataState>): void {
  const current = dataStates.get(dataKey) || createInitialState()
  const newState = { ...current, ...updates }
  dataStates.set(dataKey, newState)

  // Broadcast if subscribed
  if (subscriptions.has(dataKey) && (updates.data !== undefined || updates.error)) {
    sendResponse({
      id: generateMessageId(),
      timestamp: Date.now(),
      type: updates.error ? 'FETCH_ERROR' : 'DATA_UPDATE',
      payload: {
        dataKey,
        data: newState.data,
        error: updates.error || undefined,
        state: newState,
        fromCache: false,
      },
    })
  }
}

function broadcastUpdate(dataKey: DataKey, data: unknown, fromCache: boolean = false): void {
  const state = dataStates.get(dataKey)
  if (!state) return

  if (subscriptions.has(dataKey)) {
    sendResponse({
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'DATA_UPDATE',
      payload: {
        dataKey,
        data,
        state,
        fromCache,
      },
    })
  }
}

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  if (debugEnabled) console.log('[PublicWorker-Dedicated] Initializing...')

  // Initialize all data states
  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
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
        if (debugEnabled) console.log(`[PublicWorker-Dedicated] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[PublicWorker-Dedicated] Error loading cache:', error)
  }

  // Mark as initialized
  isInitialized = true

  // Start processing loop
  processQueue()

  // Send connected message
  sendResponse({
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CONNECTED',
    payload: {
      dataKey: 'cryptoPrices',
      state: dataStates.get('cryptoPrices') || createInitialState(),
      fromCache: false,
      tabCount: 1,
    },
  })

  // Send all cached data
  for (const key of HANDLED_KEYS) {
    const state = dataStates.get(key)
    if (state?.data) {
      sendResponse({
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

  if (debugEnabled) console.log('[PublicWorker-Dedicated] Init complete, waiting for SET_NETWORK')
}

async function createAnonymousAgent(): Promise<void> {
  // Clear actor cache for old agent before creating new one
  if (agent) {
    clearActorCache(agent)
  }

  agent = await createAgent({
    identity: new AnonymousIdentity(),
    host: getHost(),
    fetchRootKey: shouldFetchRootKey(),
  })
}

// ============================================================================
// Message Handling
// ============================================================================

function handleMessage(message: WorkerRequest): void {
  switch (message.type) {
    case 'FETCH':
      handleFetch(message)
      break

    case 'SET_PRIORITY':
      handleSetPriority(message)
      break

    case 'SET_VISIBILITY':
      isBackgroundTab = !message.payload.visible
      if (message.payload.visible) {
        recordActivity()
      }
      break

    case 'USER_ACTIVITY':
      recordActivity()
      break

    case 'SET_NETWORK':
      handleSetNetwork(message)
      break

    case 'SUBSCRIBE':
      handleSubscribe(message)
      break

    case 'UNSUBSCRIBE':
      handleUnsubscribe(message)
      break

    case 'GET_CACHED':
      handleGetCached(message)
      break

    case 'INVALIDATE':
      handleInvalidate(message)
      break

    case 'PING':
      sendResponse({
        id: message.id,
        timestamp: Date.now(),
        type: 'PONG',
        payload: {
          dataKey: 'cryptoPrices',
          state: createInitialState(),
          fromCache: false,
          tabCount: 1,
        },
      })
      break

    case 'RESET':
      if (debugEnabled) console.log('[PublicWorker-Dedicated] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
      backoff.resetAll()
      queue.clearProcessing()
      activeFetchCount = 0
      for (const key of HANDLED_KEYS) {
        const state = dataStates.get(key)
        if (state?.data) {
          sendResponse({
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
      handleInitialLoad(message)
      break
  }
}

function handleInitialLoad(message: WorkerRequest): void {
  const route = message.payload.route || '/'
  if (debugEnabled) console.log(`[PublicWorker-Dedicated] INITIAL_LOAD for route: ${route}`)

  // Reset state for fresh page load
  backoff.resetAll()
  queue.clearProcessing()
  activeFetchCount = 0
  deferredLoadTriggered = false
  pendingPriorityKeys.clear()

  // Get priority keys for this route
  const priorityKeys = getInitialLoadKeys(route)
  initialLoadKeys = new Set(priorityKeys.filter(key => HANDLED_KEYS.includes(key)))

  if (debugEnabled) console.log(`[PublicWorker-Dedicated] Priority keys for route: ${Array.from(initialLoadKeys).join(', ') || 'none'}`)

  // Send cached data ONLY for priority keys immediately
  for (const key of initialLoadKeys) {
    const state = dataStates.get(key)
    if (state?.data) {
      sendResponse({
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
    if (!state?.data || isStale(key, state.lastUpdated)) {
      pendingPriorityKeys.add(key)
      queue.enqueue(key, 'critical')
    }
  }

  // Signal that initial cache delivery is complete
  sendResponse({
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'INITIAL_CACHE_READY',
    payload: {
      dataKey: 'cryptoPrices',
      state: createInitialState(),
      fromCache: true,
    },
  })

  if (pendingPriorityKeys.size === 0) {
    triggerDeferredLoad()
  }
}

function onPriorityKeyLoaded(dataKey: DataKey): void {
  if (!pendingPriorityKeys.has(dataKey)) return

  pendingPriorityKeys.delete(dataKey)
  if (debugEnabled) console.log(`[PublicWorker-Dedicated] Priority key loaded: ${dataKey}, remaining: ${pendingPriorityKeys.size}`)

  if (pendingPriorityKeys.size === 0 && !deferredLoadTriggered) {
    triggerDeferredLoad()
  }
}

function triggerDeferredLoad(): void {
  if (deferredLoadTriggered) return
  deferredLoadTriggered = true

  if (debugEnabled) console.log('[PublicWorker-Dedicated] All priority keys loaded - starting deferred load for non-priority keys')

  for (const key of HANDLED_KEYS) {
    if (initialLoadKeys.has(key)) continue

    const state = dataStates.get(key)
    if (state?.data && subscriptions.has(key)) {
      sendResponse({
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
    if (!state?.data || isStale(key, state.lastUpdated)) {
      queue.enqueue(key, 'low')
    }
  }
}

function handleFetch(message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload

  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) {
    return
  }

  const currentState = dataStates.get(dataKey)

  // Stale-while-revalidate - return cached data if available
  if (currentState?.data && !force) {
    sendResponse({
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

function handleSubscribe(message: WorkerRequest): void {
  const { dataKey, dataKeys: keysToSubscribe } = message.payload
  const keys = keysToSubscribe || (dataKey ? [dataKey] : [])
  const validKeys = keys.filter((key: DataKey) => HANDLED_KEYS.includes(key))

  for (const key of validKeys) {
    subscriptions.add(key)
  }

  // Send cached data immediately
  for (const key of validKeys) {
    const state = dataStates.get(key)
    if (state?.data) {
      sendResponse({
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
    if ((!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
      queue.enqueue(key, 'high')
    }
  }
}

function handleUnsubscribe(message: WorkerRequest): void {
  const { dataKey, dataKeys } = message.payload
  const keysToUnsubscribe = dataKeys || (dataKey ? [dataKey] : [])

  for (const key of keysToUnsubscribe) {
    if (HANDLED_KEYS.includes(key)) {
      subscriptions.delete(key)
    }
  }
}

function handleGetCached(message: WorkerRequest): void {
  const { dataKey } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) return

  const state = dataStates.get(dataKey)
  sendResponse({
    id: message.id,
    timestamp: Date.now(),
    type: 'CACHE_HIT',
    payload: {
      dataKey,
      data: state?.data || null,
      state: state || createInitialState(),
      fromCache: true,
    },
  })
}

function handleInvalidate(message: WorkerRequest): void {
  const { dataKey, dataKeys } = message.payload
  const keysToInvalidate = dataKeys || (dataKey ? [dataKey] : HANDLED_KEYS)

  for (const key of keysToInvalidate) {
    if (HANDLED_KEYS.includes(key)) {
      const state = dataStates.get(key)
      if (state) {
        dataStates.set(key, { ...state, stale: true })
        queue.enqueue(key, 'critical')
      }
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  const newNetwork = network || 'ic'

  const isFirstSetup = currentNetwork === null
  const networkChanged = currentNetwork !== null && currentNetwork !== newNetwork

  if (debugEnabled) console.log(`[PublicWorker-Dedicated] SET_NETWORK: ${newNetwork} (current: ${currentNetwork}, isFirst: ${isFirstSetup}, changed: ${networkChanged})`)

  currentNetwork = newNetwork
  setWorkerNetworkOverride(network || null)

  await createAnonymousAgent()

  // Only clear cache if network actually changed (not on first setup)
  if (networkChanged) {
    try {
      const { clearAllCached } = await import('./shared/indexed-db')
      await clearAllCached()
      if (debugEnabled) console.log('[PublicWorker-Dedicated] Cleared IndexedDB cache due to network change')
    } catch (err) {
      console.error('[PublicWorker-Dedicated] Error clearing cache:', err)
    }

    // Clear in-memory state and queue for refetch
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      queue.enqueue(key, 'high')
    }
  }
}

// ============================================================================
// Queue Processing (Parallel) - 10 concurrent fetches
// ============================================================================

const MAX_CONCURRENT_FETCHES = 5
let activeFetchCount = 0

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (true) {
    if (!agent) {
      await sleep(100)
      continue
    }

    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      const item = queue.dequeue()

      if (!item) {
        break
      }

      if (!agent) {
        queue.retry(item.dataKey)
        break
      }

      if (!backoff.canRetry(item.dataKey)) {
        queue.retry(item.dataKey)
        continue
      }

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
    console.error(`[PublicWorker-Dedicated] Error fetching ${item.dataKey}:`, error)
    backoff.recordFailure(item.dataKey)

    const errorMsg = error instanceof Error ? error.message : String(error)
    updateState(item.dataKey, {
      loading: false,
      error: errorMsg,
    })

    if (item.retryCount < 5) {
      queue.retry(item.dataKey)
    } else {
      queue.complete(item.dataKey)
    }
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  if (!agent) {
    await createAnonymousAgent()
  }

  updateState(dataKey, { loading: true, error: null })

  let data: unknown

  switch (dataKey) {
    // Core data keys
    case 'cryptoPrices':
      data = await fetchCryptoPricesData()
      break

    case 'tokenDetails':
      const rawTokenData = await fetchTokenDetailsData(agent!)
      data = serializeForTransfer(rawTokenData)
      // Also calculate treasury value
      const totalValue = calculateTotalTreasuryValueInUsd(rawTokenData as any[])
      updateState('totalTreasuryValueInUsd', {
        data: totalValue,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        stale: false,
      })
      broadcastUpdate('totalTreasuryValueInUsd', totalValue)
      await setCached('totalTreasuryValueInUsd', totalValue)
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

    // Secondary data keys
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
      throw new Error(`Unknown data key: ${dataKey}`)
  }

  // Update state
  updateState(dataKey, {
    data,
    loading: false,
    error: null,
    lastUpdated: Date.now(),
    stale: false,
  })

  // Broadcast to main thread
  broadcastUpdate(dataKey, data)

  // Persist to cache
  await setCached(dataKey, data)

  // Track priority key completion
  onPriorityKeyLoaded(dataKey)
}

// ============================================================================
// Auto-refresh Loop (5 second interval for responsiveness)
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  while (true) {
    await sleep(5000) // Check every 5 seconds

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

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  handleMessage(e.data)
}

init().then(() => {
  autoRefreshLoop()
})
