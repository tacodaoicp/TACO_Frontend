/**
 * Secondary Public Data Dedicated Worker (Fallback for SharedWorker)
 *
 * This is a dedicated worker version for browsers that don't support SharedWorker.
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
} from './types'

declare const self: DedicatedWorkerGlobalScope

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
const subscriptions = new Set<DataKey>()
const queue = new PriorityQueue()
const backoff = new BackoffTracker()

let isProcessing = false
let isBackgroundTab = false
let isIdle = false
let lastActivityTime = Date.now()
let agent: HttpAgent | null = null
let isInitialized = false
let currentNetwork: 'ic' | 'staging' | 'local' | null = null // Track current network to detect changes

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
    console.log('[SecondaryWorker-Dedicated] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    console.log('[SecondaryWorker-Dedicated] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    console.log('[SecondaryWorker-Dedicated] Activity detected - resuming refreshes')
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
  console.log('[SecondaryWorker-Dedicated] Initializing...')

  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
  }

  try {
    const cached = await getAllCached()
    for (const [key, state] of cached) {
      if (HANDLED_KEYS.includes(key)) {
        dataStates.set(key, {
          ...state,
          stale: isStale(key, state.lastUpdated),
        })
        console.log(`[SecondaryWorker-Dedicated] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[SecondaryWorker-Dedicated] Error loading cache:', error)
  }

  agent = await createAgent({
    identity: new AnonymousIdentity(),
    host: getHost(),
    fetchRootKey: shouldFetchRootKey(),
  })

  isInitialized = true
  processQueue()

  sendResponse({
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CONNECTED',
    payload: {
      dataKey: 'votingPowerMetrics',
      state: dataStates.get('votingPowerMetrics') || createInitialState(),
      fromCache: false,
      tabCount: 1,
    },
  })

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

  console.log('[SecondaryWorker-Dedicated] Initialized')
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
          dataKey: 'votingPowerMetrics',
          state: createInitialState(),
          fromCache: false,
          tabCount: 1,
        },
      })
      break

    case 'RESET':
      // Reset all state that could block fetches after fast page refresh
      console.log('[SecondaryWorker-Dedicated] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
      backoff.resetAll()
      queue.clearProcessing()
      activeFetchCount = 0
      // Re-send all cached data (new page load needs it)
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
  }
}

function handleFetch(message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) return

  const currentState = dataStates.get(dataKey)

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
  }
}

function handleUnsubscribe(message: WorkerRequest): void {
  const { dataKey } = message.payload
  if (dataKey && HANDLED_KEYS.includes(dataKey)) {
    subscriptions.delete(dataKey)
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
        queue.enqueue(key, 'high')
      }
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  const newNetwork = network || 'ic' // Default to 'ic' if not specified

  // Check if this is the first SET_NETWORK or if network actually changed
  const networkChanged = currentNetwork !== null && currentNetwork !== newNetwork

  // Update tracked network
  currentNetwork = newNetwork
  setWorkerNetworkOverride(network || null)

  // Recreate anonymous agent with new network settings
  agent = await createAgent({
    identity: new AnonymousIdentity(),
    host: getHost(),
    fetchRootKey: shouldFetchRootKey(),
  })

  // Only clear cache if network actually changed (not on first setup)
  if (networkChanged) {
    try {
      const { clearAllCached } = await import('./shared/indexed-db')
      await clearAllCached()
    } catch (err) {
      console.error('[SecondaryWorker-Dedicated] Error clearing cache:', err)
    }

    // Clear in-memory state and queue for refetch
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      queue.enqueue(key, 'high')
    }
  }
}

// ============================================================================
// Queue Processing
// ============================================================================

const MAX_CONCURRENT_FETCHES = 3
let activeFetchCount = 0

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (true) {
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      const item = queue.dequeue()

      if (!item) break

      if (!agent) {
        queue.retry(item.dataKey)
        continue
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
    console.error(`[SecondaryWorker-Dedicated] Error fetching ${item.dataKey}:`, error)
    backoff.recordFailure(item.dataKey)

    const errorMsg = error instanceof Error ? error.message : String(error)
    updateState(item.dataKey, {
      loading: false,
      error: errorMsg,
    })

    if (item.retryCount < 3) {
      queue.retry(item.dataKey)
    } else {
      queue.complete(item.dataKey)
    }
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  if (!agent) throw new Error('No agent available')

  updateState(dataKey, { loading: true, error: null })

  let data: unknown

  switch (dataKey) {
    case 'votingPowerMetrics':
      data = serializeForTransfer(await fetchVotingPowerMetricsData(agent))
      break

    case 'tacoProposals':
      data = serializeForTransfer(await fetchTacoProposalsData(agent))
      break

    case 'proposalsThreads':
      data = serializeForTransfer(await fetchProposalsThreadsData(agent))
      break

    case 'allNames':
      const namesData = await fetchAllNamesData(agent)
      data = {
        principalNames: Object.fromEntries(namesData.principalNames),
        neuronNames: Object.fromEntries(namesData.neuronNames),
      }
      break

    case 'neuronSnapshotStatus':
      data = serializeForTransfer(await fetchNeuronSnapshotStatusData(agent))
      break

    case 'portfolioSnapshotStatus':
      data = serializeForTransfer(await fetchPortfolioSnapshotStatusData(agent))
      break

    default:
      throw new Error(`Unknown data key: ${dataKey}`)
  }

  updateState(dataKey, {
    data,
    loading: false,
    error: null,
    lastUpdated: Date.now(),
    stale: false,
  })

  broadcastUpdate(dataKey, data)
  await setCached(dataKey, dataStates.get(dataKey)!)
}

// ============================================================================
// Auto-refresh Loop
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  while (true) {
    await sleep(15000)

    // Check if we should enter idle mode
    checkIdleStatus()

    // Skip auto-refresh if idle
    if (isIdle) {
      continue
    }

    for (const dataKey of HANDLED_KEYS) {
      const state = dataStates.get(dataKey)
      if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
        queue.enqueue(dataKey, 'low')
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
