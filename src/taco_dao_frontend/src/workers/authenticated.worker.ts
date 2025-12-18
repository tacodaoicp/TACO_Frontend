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

import { HttpAgent, Identity, AnonymousIdentity } from '@dfinity/agent'
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
  // Treasury/Trading admin data
  fetchPriceAlertsData,
  fetchTradingPausesData,
  fetchPriceHistoryData,
  fetchPortfolioHistoryData,
  fetchCircuitBreakerLogsData,
  fetchCircuitBreakerConditionsData,
  fetchPortfolioCircuitBreakerConditionsData,
  fetchMaxPriceHistoryEntriesData,
  fetchMaxPortfolioSnapshotsData,
  // Neuron Snapshots admin data
  fetchNeuronSnapshotsData,
  fetchMaxNeuronSnapshotsData,
  // Alarm system admin data
  fetchAlarmSystemStatusData,
  fetchAlarmContactsData,
  fetchMonitoringStatusData,
  fetchPendingAlarmsData,
  fetchSystemErrorsData,
  fetchInternalErrorsData,
  fetchMonitoredCanistersData,
  fetchConfigurationIntervalsData,
  fetchQueueStatusData,
  fetchSentSMSMessagesData,
  fetchSentEmailMessagesData,
  fetchSentMessagesData,
  fetchAlarmAcknowledgmentsData,
  fetchAdminActionLogsData,
  // NNS Automation admin data
  fetchVotableProposalsData,
  fetchPeriodicTimerStatusData,
  fetchAutoVotingThresholdData,
  fetchProposerSubaccountData,
  fetchTacoDAONeuronIdData,
  fetchDefaultVoteBehaviorData,
  fetchHighestProcessedNNSProposalIdData,
  fetchRewardsConfigurationData,
  fetchDistributionHistoryData,
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
  // Treasury/Trading admin data
  'priceAlerts',
  'tradingPauses',
  'priceHistory',
  'portfolioHistory',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
  'maxPriceHistoryEntries',
  'maxPortfolioSnapshots',
  // Neuron Snapshots admin data
  'neuronSnapshots',
  'maxNeuronSnapshots',
  // Alarm system admin data
  'alarmSystemStatus',
  'alarmContacts',
  'monitoringStatus',
  'pendingAlarms',
  'systemErrors',
  'internalErrors',
  'monitoredCanisters',
  'configurationIntervals',
  'queueStatus',
  'sentSMSMessages',
  'sentEmailMessages',
  'sentMessages',
  'alarmAcknowledgments',
  'adminActionLogs',
  // NNS Automation admin data
  'votableProposals',
  'periodicTimerStatus',
  'autoVotingThreshold',
  'proposerSubaccount',
  'tacoDAONeuronId',
  'defaultVoteBehavior',
  'highestProcessedNNSProposalId',
  // Rewards/Distributions admin data
  'rewardsConfiguration',
  'distributionHistory',
]

const USER_KEYS: DataKey[] = ['userAllocation']

// Keys that REQUIRE authentication - canister enforces caller identity check
const AUTH_REQUIRED_KEYS: DataKey[] = [
  // Alarm system - uses canister_inspect_message
  'queueStatus',
  'sentSMSMessages',
  'sentEmailMessages',
  'sentMessages',
  'alarmAcknowledgments',
  'adminActionLogs',
  'configurationIntervals',
  'pendingAlarms',
  'systemErrors',
  'internalErrors',
  'alarmContacts',
  'monitoredCanisters',
  'alarmSystemStatus',
  'monitoringStatus',
  // NNS Automation - may require auth
  'votableProposals',
  'periodicTimerStatus',
  'autoVotingThreshold',
  'proposerSubaccount',
  'tacoDAONeuronId',
  'defaultVoteBehavior',
  'highestProcessedNNSProposalId',
]

// Keys that can be read publicly (anonymous agent works)
const PUBLIC_ADMIN_KEYS: DataKey[] = [
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
  // Treasury/Trading admin data - typically public reads
  'priceAlerts',
  'tradingPauses',
  'priceHistory',
  'portfolioHistory',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
  'maxPriceHistoryEntries',
  'maxPortfolioSnapshots',
  // Neuron Snapshots admin data
  'neuronSnapshots',
  'maxNeuronSnapshots',
  // Rewards/Distributions admin data - public reads
  'rewardsConfiguration',
  'distributionHistory',
]

// Combined for backward compatibility
const ADMIN_KEYS: DataKey[] = [...AUTH_REQUIRED_KEYS, ...PUBLIC_ADMIN_KEYS]

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
let anonymousAgent: HttpAgent | null = null  // For public read-only queries
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

  // Create anonymous agent for public read-only queries
  // This allows fetching admin-labeled data even before user logs in
  await createAnonymousAgent()

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

  console.log('[AuthWorker] Initialized with anonymous agent (ready for public reads)')
}

async function createAnonymousAgent(): Promise<void> {
  anonymousAgent = await createAgent({
    identity: new AnonymousIdentity(),
    host: getHost(),
    fetchRootKey: shouldFetchRootKey(),
  })
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
    console.log(`[AuthWorker] Message received: ${e.data?.type}, dataKey=${e.data?.payload?.dataKey}`)
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

  // Already initialized - send cached data for keys we have
  // USER_KEYS and AUTH_REQUIRED_KEYS require authentication
  // For those, we can still send stale cached data
  for (const key of HANDLED_KEYS) {
    const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
    // Skip auth-required keys if not authenticated AND no cached data
    if (requiresAuth && !isAuthenticated) {
      // Still send cached data if we have it (will be marked stale)
      const state = dataStates.get(key)
      if (!state?.data) continue
    }
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
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) {
    console.log(`[AuthWorker] FETCH ignored - dataKey=${dataKey} not in HANDLED_KEYS`)
    return
  }
  console.log(`[AuthWorker] FETCH request: ${dataKey}, force=${force}, isAuth=${isAuthenticated}, hasAnon=${!!anonymousAgent}`)

  // USER_KEYS and AUTH_REQUIRED_KEYS require authentication
  // The canister will reject anonymous calls for these
  const requiresAuth = USER_KEYS.includes(dataKey) || AUTH_REQUIRED_KEYS.includes(dataKey)
  if (requiresAuth && !isAuthenticated) {
    // For auth-required keys, return cached data if available (stale is okay)
    const currentState = dataStates.get(dataKey)
    if (currentState?.data) {
      sendResponse(port, {
        id: message.id,
        timestamp: Date.now(),
        type: 'CACHE_HIT',
        payload: {
          dataKey,
          data: currentState.data,
          state: { ...currentState, stale: true },
          fromCache: true,
        },
      })
    }
    // Don't queue for refresh - will fail without auth
    return
  }

  const currentState = dataStates.get(dataKey)

  // Stale-while-revalidate - return cached data if available
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
  // The queue processor will wait for agent initialization before processing
  if (force || !currentState?.data || isStale(dataKey, currentState.lastUpdated)) {
    console.log(`[AuthWorker] Queuing ${dataKey} for fetch (force=${force}, hasData=${!!currentState?.data}, queueSize=${queue.size})`)
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

  // Always recreate anonymous agent with new network settings
  await createAnonymousAgent()

  // If authenticated, recreate authenticated agent with new network settings
  if (isAuthenticated && currentIdentity) {
    authenticatedAgent = await createAgent({
      identity: currentIdentity,
      host: getHost(),
      fetchRootKey: shouldFetchRootKey(),
    })
  }

  // Clear in-memory state and queue for refetch
  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
    // Queue all ADMIN_KEYS since they can be fetched with anonymous agent
    if (ADMIN_KEYS.includes(key)) {
      queue.enqueue(key, 'high')
    }
    // Queue USER_KEYS only if authenticated
    if (USER_KEYS.includes(key) && isAuthenticated) {
      queue.enqueue(key, 'high')
    }
  }
}

// ============================================================================
// Queue Processing (Parallel)
// ============================================================================

// Maximum concurrent fetches - higher priority items are dequeued first
// Bumped to 5 to handle 41 admin data keys more efficiently
const MAX_CONCURRENT_FETCHES = 5
let activeFetchCount = 0

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true
  console.log('[AuthWorker] processQueue started')

  while (true) {
    // Start new fetches up to the limit (priority queue returns highest priority first)
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      // Get next highest-priority item (queue.dequeue handles deduplication internally)
      const item = queue.dequeue()
      if (item) {
        console.log(`[AuthWorker] Dequeued ${item.dataKey}, activeFetches=${activeFetchCount}`)
      }

      if (!item) {
        break
      }

      // USER_KEYS and AUTH_REQUIRED_KEYS require authentication
      // Skip for now - will be fetched when user authenticates
      const requiresAuth = USER_KEYS.includes(item.dataKey) || AUTH_REQUIRED_KEYS.includes(item.dataKey)
      if (requiresAuth && (!isAuthenticated || !authenticatedAgent)) {
        console.log(`[AuthWorker] Skipping ${item.dataKey} - requires auth but not authenticated`)
        queue.complete(item.dataKey)
        continue
      }

      // PUBLIC_ADMIN_KEYS can use anonymous agent - they're publicly readable
      // If no agent available yet, re-queue and wait for init to complete
      if (!anonymousAgent && !authenticatedAgent) {
        console.log(`[AuthWorker] Retrying ${item.dataKey} - no agent available yet`)
        queue.retry(item.dataKey)
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
    backoff.recordFailure(item.dataKey)

    // Check if error indicates not admin or access denied
    const errorMsg = error instanceof Error ? error.message : String(error)
    const isAccessDenied = errorMsg.includes('not authorized') ||
      errorMsg.includes('admin') ||
      errorMsg.includes('canister_inspect_message') ||
      errorMsg.includes('refused message')

    if (isAccessDenied && ADMIN_KEYS.includes(item.dataKey)) {
      // Not admin or not authorized for this canister - don't retry, don't spam logs
      console.log(`[AuthWorker] Access denied for ${item.dataKey} - skipping`)
      isAdmin = false
      queue.complete(item.dataKey)
      return
    }

    // Log other errors
    console.error(`[AuthWorker] Error fetching ${item.dataKey}:`, error)

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
  // Choose the appropriate agent:
  // - USER_KEYS and AUTH_REQUIRED_KEYS require authenticated agent
  // - PUBLIC_ADMIN_KEYS can use anonymous agent (publicly readable queries)
  const requiresAuth = USER_KEYS.includes(dataKey) || AUTH_REQUIRED_KEYS.includes(dataKey)
  const agent = requiresAuth
    ? authenticatedAgent
    : (authenticatedAgent || anonymousAgent)

  if (!agent) {
    throw new Error(requiresAuth
      ? 'No authenticated agent'
      : 'No agent available')
  }

  updateState(dataKey, { loading: true, error: null })

  let data: unknown

  switch (dataKey) {
    case 'userAllocation':
      // userAllocation requires authenticated agent (user-specific data)
      data = serializeForTransfer(await fetchUserAllocationData(authenticatedAgent!))
      break

    case 'systemLogs':
      data = serializeForTransfer(await fetchSystemLogsData(agent))
      break

    case 'voterDetails':
      data = serializeForTransfer(await fetchVoterDetailsData(agent))
      break

    case 'neuronAllocations':
      data = serializeForTransfer(await fetchNeuronAllocationsData(agent))
      break

    case 'rebalanceConfig':
      data = serializeForTransfer(await fetchRebalanceConfigData(agent))
      break

    case 'systemParameters':
      data = serializeForTransfer(await fetchSystemParametersData(agent))
      break

    // Treasury/Trading admin data
    case 'priceAlerts':
      data = serializeForTransfer(await fetchPriceAlertsData(agent))
      break

    case 'tradingPauses':
      data = serializeForTransfer(await fetchTradingPausesData(agent))
      break

    case 'priceHistory':
      data = serializeForTransfer(await fetchPriceHistoryData(agent))
      break

    case 'portfolioHistory':
      data = serializeForTransfer(await fetchPortfolioHistoryData(agent))
      break

    case 'circuitBreakerLogs':
      data = serializeForTransfer(await fetchCircuitBreakerLogsData(agent))
      break

    case 'circuitBreakerConditions':
      data = serializeForTransfer(await fetchCircuitBreakerConditionsData(agent))
      break

    case 'portfolioCircuitBreakerConditions':
      data = serializeForTransfer(await fetchPortfolioCircuitBreakerConditionsData(agent))
      break

    case 'maxPriceHistoryEntries':
      data = serializeForTransfer(await fetchMaxPriceHistoryEntriesData(agent))
      break

    case 'maxPortfolioSnapshots':
      data = serializeForTransfer(await fetchMaxPortfolioSnapshotsData(agent))
      break

    // Neuron Snapshots admin data
    case 'neuronSnapshots':
      data = serializeForTransfer(await fetchNeuronSnapshotsData(agent))
      break

    case 'maxNeuronSnapshots':
      data = serializeForTransfer(await fetchMaxNeuronSnapshotsData(agent))
      break

    // Alarm system admin data
    case 'alarmSystemStatus':
      data = serializeForTransfer(await fetchAlarmSystemStatusData(agent))
      break

    case 'alarmContacts':
      data = serializeForTransfer(await fetchAlarmContactsData(agent))
      break

    case 'monitoringStatus':
      data = serializeForTransfer(await fetchMonitoringStatusData(agent))
      break

    case 'pendingAlarms':
      data = serializeForTransfer(await fetchPendingAlarmsData(agent))
      break

    case 'systemErrors':
      data = serializeForTransfer(await fetchSystemErrorsData(agent))
      break

    case 'internalErrors':
      data = serializeForTransfer(await fetchInternalErrorsData(agent))
      break

    case 'monitoredCanisters':
      data = serializeForTransfer(await fetchMonitoredCanistersData(agent))
      break

    case 'configurationIntervals':
      data = serializeForTransfer(await fetchConfigurationIntervalsData(agent))
      break

    case 'queueStatus':
      data = serializeForTransfer(await fetchQueueStatusData(agent))
      break

    case 'sentSMSMessages':
      data = serializeForTransfer(await fetchSentSMSMessagesData(agent))
      break

    case 'sentEmailMessages':
      data = serializeForTransfer(await fetchSentEmailMessagesData(agent))
      break

    case 'sentMessages':
      data = serializeForTransfer(await fetchSentMessagesData(agent))
      break

    case 'alarmAcknowledgments':
      data = serializeForTransfer(await fetchAlarmAcknowledgmentsData(agent))
      break

    case 'adminActionLogs':
      data = serializeForTransfer(await fetchAdminActionLogsData(agent))
      break

    // NNS Automation admin data
    case 'votableProposals':
      data = serializeForTransfer(await fetchVotableProposalsData(agent))
      break

    case 'periodicTimerStatus':
      data = serializeForTransfer(await fetchPeriodicTimerStatusData(agent))
      break

    case 'autoVotingThreshold':
      data = serializeForTransfer(await fetchAutoVotingThresholdData(agent))
      break

    case 'proposerSubaccount':
      data = serializeForTransfer(await fetchProposerSubaccountData(agent))
      break

    case 'tacoDAONeuronId':
      data = serializeForTransfer(await fetchTacoDAONeuronIdData(agent))
      break

    case 'defaultVoteBehavior':
      data = serializeForTransfer(await fetchDefaultVoteBehaviorData(agent))
      break

    case 'highestProcessedNNSProposalId':
      data = serializeForTransfer(await fetchHighestProcessedNNSProposalIdData(agent))
      break

    // Rewards/Distributions data
    case 'rewardsConfiguration':
      data = serializeForTransfer(await fetchRewardsConfigurationData(agent))
      break

    case 'distributionHistory':
      data = serializeForTransfer(await fetchDistributionHistoryData(agent))
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
