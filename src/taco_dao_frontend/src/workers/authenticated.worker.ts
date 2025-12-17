/**
 * Authenticated Data SharedWorker
 *
 * Handles data that requires authentication:
 * - userAllocation (requires user login)
 * - systemLogs (admin only)
 * - voterDetails (admin only)
 * - neuronAllocations (admin only)
 * - rebalanceConfig (admin only)
 * - systemParameters (admin only)
 *
 * Identity is passed from main thread via SET_IDENTITY message.
 */

/// <reference lib="webworker" />

import { HttpAgent, Identity } from '@dfinity/agent'
import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity'
import { createAgent } from '@dfinity/utils'
import { PriorityQueue } from './shared/priority-queue'
import { BackoffTracker } from './shared/backoff'
import { getCached, setCached, getAllCached } from './shared/indexed-db'
import { getHost, shouldFetchRootKey, setWorkerNetworkOverride } from './shared/canister-ids'
import {
  fetchUserAllocationData,
  fetchSystemLogsData,
  fetchVoterDetailsData,
  fetchNeuronAllocationsData,
  fetchRebalanceConfigData,
  fetchSystemParametersData,
  serializeForTransfer,
} from './shared/fetch-functions'
import type {
  DataKey,
  DataState,
  WorkerRequest,
  WorkerResponse,
  Priority,
  SerializedIdentity,
} from './types'
import {
  STALENESS_THRESHOLDS,
  BACKGROUND_MULTIPLIER,
  generateMessageId,
  createInitialState,
  ADMIN_PRELOAD_KEYS,
} from './types'

declare const self: SharedWorkerGlobalScope

// ============================================================================
// Data keys handled by this worker
// ============================================================================

const HANDLED_KEYS: DataKey[] = [
  'userAllocation',
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
]

const USER_KEYS: DataKey[] = ['userAllocation']
const ADMIN_KEYS: DataKey[] = [
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
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
let authenticatedAgent: HttpAgent | null = null
let currentIdentity: Identity | null = null
let isAdmin = false
let isAuthenticated = false
let isInitialized = false

// Queue of ports waiting for cached data after init
const pendingCacheDeliveries: Array<{ port: MessagePort; keys: DataKey[] }> = []

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  console.log('[AuthWorker] Initializing...')

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
        console.log(`[AuthWorker] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[AuthWorker] Error loading cache:', error)
  }

  // Mark as initialized
  isInitialized = true

  // Deliver cached data to any ports that connected during init
  console.log(`[AuthWorker] Delivering cached data to ${pendingCacheDeliveries.length} pending ports`)
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

  console.log('[AuthWorker] Initialized (waiting for identity)')
}

// ============================================================================
// Identity Management
// ============================================================================

function deserializeIdentity(serialized: SerializedIdentity): DelegationIdentity {
  try {
    const delegationChain = DelegationChain.fromJSON(JSON.parse(serialized.delegationChainJson))
    const sessionKey = Ed25519KeyIdentity.fromJSON(serialized.sessionKeyJson)
    return DelegationIdentity.fromDelegation(sessionKey, delegationChain)
  } catch (error) {
    console.error('[AuthWorker] Error deserializing identity:', error)
    throw error
  }
}

async function setIdentity(serialized: SerializedIdentity): Promise<void> {
  try {
    currentIdentity = deserializeIdentity(serialized)
    isAuthenticated = true

    authenticatedAgent = await createAgent({
      identity: currentIdentity,
      host: getHost(),
      fetchRootKey: shouldFetchRootKey(),
    })

    console.log('[AuthWorker] Identity set, agent created')

    // Immediately deliver any cached user data to all subscribed ports
    // This ensures components get cached data without waiting for a new fetch
    for (const key of USER_KEYS) {
      const state = dataStates.get(key)
      if (state?.data) {
        console.log(`[AuthWorker] Delivering cached ${key} after authentication`)
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
    }

    // Queue user data fetch for background refresh
    queue.enqueue('userAllocation', 'critical')

    // If admin, queue admin data
    if (isAdmin) {
      for (const key of ADMIN_KEYS) {
        queue.enqueue(key, 'high')
      }
    }
  } catch (error) {
    console.error('[AuthWorker] Error setting identity:', error)
    isAuthenticated = false
    currentIdentity = null
    authenticatedAgent = null
  }
}

function clearIdentity(): void {
  currentIdentity = null
  authenticatedAgent = null
  isAuthenticated = false
  isAdmin = false

  // Clear user-specific data from state (but keep in cache for quick restore)
  for (const key of HANDLED_KEYS) {
    const state = dataStates.get(key)
    if (state) {
      dataStates.set(key, { ...state, stale: true })
    }
  }

  // Clear queue
  queue.clear()

  console.log('[AuthWorker] Identity cleared')
}

// ============================================================================
// Connection Handling
// ============================================================================

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0]
  connectedPorts.add(port)

  console.log(`[AuthWorker] Port connected. Total: ${connectedPorts.size}`)

  port.onmessage = (e: MessageEvent<WorkerRequest>) => {
    handleMessage(port, e.data)
  }

  port.onmessageerror = () => {
    disconnectPort(port)
  }

  // Send connected message
  sendResponse(port, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CONNECTED',
    payload: {
      dataKey: 'userAllocation',
      state: dataStates.get('userAllocation') || createInitialState(),
      fromCache: false,
      tabCount: connectedPorts.size,
    },
  })

  // If not yet initialized, queue cached data delivery for when init completes
  if (!isInitialized) {
    console.log(`[AuthWorker] Port connected before init, queuing cache delivery`)
    pendingCacheDeliveries.push({ port, keys: HANDLED_KEYS })
    return
  }

  // Already initialized - send cached data if authenticated
  if (isAuthenticated) {
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
  }
}

function disconnectPort(port: MessagePort): void {
  connectedPorts.delete(port)
  for (const subscribers of subscriptions.values()) {
    subscribers.delete(port)
  }
  console.log(`[AuthWorker] Port disconnected. Total: ${connectedPorts.size}`)
}

// ============================================================================
// Message Handling
// ============================================================================

function handleMessage(port: MessagePort, message: WorkerRequest): void {
  switch (message.type) {
    case 'SET_IDENTITY':
      if (message.payload.identity) {
        setIdentity(message.payload.identity)
      }
      break

    case 'CLEAR_IDENTITY':
      clearIdentity()
      break

    case 'SET_ADMIN':
      handleSetAdmin(message)
      break

    case 'FETCH':
      handleFetch(port, message)
      break

    case 'SET_PRIORITY':
      handleSetPriority(message)
      break

    case 'SET_VISIBILITY':
      isBackgroundTab = !message.payload.visible
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
          dataKey: 'userAllocation',
          state: createInitialState(),
          fromCache: false,
          tabCount: connectedPorts.size,
        },
      })
      break
  }
}

function handleSetAdmin(message: WorkerRequest): void {
  const wasAdmin = isAdmin
  isAdmin = message.payload.isAdmin || false

  console.log(`[AuthWorker] Admin status: ${isAdmin}`)

  // If newly admin and authenticated, queue admin data
  if (isAdmin && !wasAdmin && isAuthenticated) {
    for (const key of ADMIN_KEYS) {
      queue.enqueue(key, 'high')
    }
  }
}

function handleFetch(port: MessagePort, message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) return

  // Check authentication requirements
  if (!isAuthenticated) {
    sendResponse(port, {
      id: message.id,
      timestamp: Date.now(),
      type: 'FETCH_ERROR',
      payload: {
        dataKey,
        error: 'Not authenticated',
        state: createInitialState(),
        fromCache: false,
      },
    })
    return
  }

  // Check admin requirements
  if (ADMIN_KEYS.includes(dataKey) && !isAdmin) {
    sendResponse(port, {
      id: message.id,
      timestamp: Date.now(),
      type: 'FETCH_ERROR',
      payload: {
        dataKey,
        error: 'Admin access required',
        state: createInitialState(),
        fromCache: false,
      },
    })
    return
  }

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

  // Add to subscriptions immediately - ensure Set exists first
  for (const key of validKeys) {
    if (!subscriptions.has(key)) {
      subscriptions.set(key, new Set())
    }
    subscriptions.get(key)!.add(port)
  }

  // If not yet initialized, queue this port for cache delivery when init completes
  if (!isInitialized) {
    console.log(`[AuthWorker] Not yet initialized, queuing cache delivery for ${validKeys.length} keys`)
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
      if (isAuthenticated && (USER_KEYS.includes(key) || (ADMIN_KEYS.includes(key) && isAdmin))) {
        queue.enqueue(key, 'critical')
      }
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  console.log(`[AuthWorker] Network override set to: ${network || 'auto'}`)
  setWorkerNetworkOverride(network || null)

  // Clear IndexedDB cache - data is from a different network
  try {
    const { clearAllCached } = await import('./shared/indexed-db')
    await clearAllCached()
    console.log('[AuthWorker] Cleared IndexedDB cache due to network change')
  } catch (err) {
    console.error('[AuthWorker] Error clearing cache:', err)
  }

  // If authenticated, recreate agent with new network settings
  if (isAuthenticated && currentIdentity) {
    authenticatedAgent = await createAgent({
      identity: currentIdentity,
      host: getHost(),
      fetchRootKey: shouldFetchRootKey(),
    })

    // Clear in-memory state and queue for refetch
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      if (USER_KEYS.includes(key) || (ADMIN_KEYS.includes(key) && isAdmin)) {
        queue.enqueue(key, 'high')
      }
    }
  } else {
    // Just clear in-memory state even if not authenticated
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
    }
  }
}

// ============================================================================
// Queue Processing (Parallel)
// ============================================================================

// Maximum concurrent fetches - higher priority items are dequeued first
const MAX_CONCURRENT_FETCHES = 3
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

      // Skip if not authenticated
      if (!isAuthenticated || !authenticatedAgent) {
        queue.complete(item.dataKey)
        continue
      }

      // Skip admin keys if not admin
      if (ADMIN_KEYS.includes(item.dataKey) && !isAdmin) {
        queue.complete(item.dataKey)
        continue
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

    // If first successful admin call, we're confirmed admin
    if (ADMIN_KEYS.includes(item.dataKey) && !isAdmin) {
      isAdmin = true
      console.log('[AuthWorker] Admin confirmed by successful call')
    }
  } catch (error) {
    console.error(`[AuthWorker] Error fetching ${item.dataKey}:`, error)
    backoff.recordFailure(item.dataKey)

    // Check if error indicates not admin
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('not authorized') || errorMsg.includes('admin')) {
      // Not admin, don't retry admin calls
      if (ADMIN_KEYS.includes(item.dataKey)) {
        isAdmin = false
        queue.complete(item.dataKey)
        return
      }
    }

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
  if (!authenticatedAgent) {
    throw new Error('No authenticated agent')
  }

  updateState(dataKey, { loading: true, error: null })

  let data: unknown

  switch (dataKey) {
    case 'userAllocation':
      data = serializeForTransfer(await fetchUserAllocationData(authenticatedAgent))
      break

    case 'systemLogs':
      data = serializeForTransfer(await fetchSystemLogsData(authenticatedAgent))
      break

    case 'voterDetails':
      data = serializeForTransfer(await fetchVoterDetailsData(authenticatedAgent))
      break

    case 'neuronAllocations':
      data = serializeForTransfer(await fetchNeuronAllocationsData(authenticatedAgent))
      break

    case 'rebalanceConfig':
      data = serializeForTransfer(await fetchRebalanceConfigData(authenticatedAgent))
      break

    case 'systemParameters':
      data = serializeForTransfer(await fetchSystemParametersData(authenticatedAgent))
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

// ============================================================================
// Auto-refresh Loop
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  while (true) {
    await sleep(15000) // Check every 15 seconds

    if (!isAuthenticated) {
      continue
    }

    // Refresh user data
    for (const dataKey of USER_KEYS) {
      const state = dataStates.get(dataKey)
      if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
        queue.enqueue(dataKey, 'medium')
      }
    }

    // Refresh admin data if admin
    if (isAdmin) {
      for (const dataKey of ADMIN_KEYS) {
        const state = dataStates.get(dataKey)
        if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
          queue.enqueue(dataKey, 'low')
        }
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
