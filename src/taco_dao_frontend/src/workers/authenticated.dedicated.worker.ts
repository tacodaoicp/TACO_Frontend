/**
 * Authenticated Data Dedicated Worker (Fallback for SharedWorker)
 *
 * This is a dedicated worker version for browsers that don't support SharedWorker.
 * Handles data that requires authentication.
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
  fetchPenalizedNeuronsData,
  fetchRebalanceConfigData,
  fetchSystemParametersData,
  fetchPriceAlertsData,
  fetchTradingPausesData,
  fetchPriceHistoryData,
  fetchPortfolioHistoryData,
  fetchCircuitBreakerLogsData,
  fetchCircuitBreakerConditionsData,
  fetchPortfolioCircuitBreakerConditionsData,
  fetchMaxPriceHistoryEntriesData,
  fetchMaxPortfolioSnapshotsData,
  fetchNeuronSnapshotsData,
  fetchMaxNeuronSnapshotsData,
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
  IDLE_TIMEOUT_MS,
  generateMessageId,
  createInitialState,
} from './types'

declare const self: DedicatedWorkerGlobalScope

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
  'priceAlerts',
  'tradingPauses',
  'priceHistory',
  'portfolioHistory',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
  'maxPriceHistoryEntries',
  'maxPortfolioSnapshots',
  'neuronSnapshots',
  'maxNeuronSnapshots',
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
  'votableProposals',
  'periodicTimerStatus',
  'autoVotingThreshold',
  'proposerSubaccount',
  'tacoDAONeuronId',
  'defaultVoteBehavior',
  'highestProcessedNNSProposalId',
  'rewardsConfiguration',
  'distributionHistory',
]

const USER_KEYS: DataKey[] = ['userAllocation']

const AUTH_REQUIRED_KEYS: DataKey[] = [
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
  'votableProposals',
  'periodicTimerStatus',
  'autoVotingThreshold',
  'proposerSubaccount',
  'tacoDAONeuronId',
  'defaultVoteBehavior',
  'highestProcessedNNSProposalId',
]

const PUBLIC_ADMIN_KEYS: DataKey[] = [
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
  'priceAlerts',
  'tradingPauses',
  'priceHistory',
  'portfolioHistory',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
  'maxPriceHistoryEntries',
  'maxPortfolioSnapshots',
  'neuronSnapshots',
  'maxNeuronSnapshots',
  'rewardsConfiguration',
  'distributionHistory',
]

const ADMIN_KEYS: DataKey[] = [...AUTH_REQUIRED_KEYS, ...PUBLIC_ADMIN_KEYS]

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
let authenticatedAgent: HttpAgent | null = null
let anonymousAgent: HttpAgent | null = null
let currentIdentity: Identity | null = null
let isAdmin = false
let isAuthenticated = false
let isInitialized = false
let currentNetwork: 'ic' | 'staging' | 'local' | null = null // Track current network to detect changes
let debugEnabled = false // Debug mode - disabled by default in production

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
    if (debugEnabled) console.log('[AuthWorker-Dedicated] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    if (debugEnabled) console.log('[AuthWorker-Dedicated] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    if (debugEnabled) console.log('[AuthWorker-Dedicated] Activity detected - resuming refreshes')
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
// Identity Management
// ============================================================================

function deserializeIdentity(serialized: SerializedIdentity): DelegationIdentity {
  const delegationChain = DelegationChain.fromJSON(JSON.parse(serialized.delegationChainJson))
  const sessionKey = Ed25519KeyIdentity.fromJSON(serialized.sessionKeyJson)
  return DelegationIdentity.fromDelegation(sessionKey, delegationChain)
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

    if (debugEnabled) console.log('[AuthWorker-Dedicated] Identity set, agent created')

    // Deliver cached user data
    for (const key of USER_KEYS) {
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
    }

    queue.enqueue('userAllocation', 'critical')

    if (isAdmin) {
      for (const key of ADMIN_KEYS) {
        queue.enqueue(key, 'high')
      }
    }
  } catch (error) {
    console.error('[AuthWorker-Dedicated] Error setting identity:', error)
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

  for (const key of HANDLED_KEYS) {
    const state = dataStates.get(key)
    if (state) {
      dataStates.set(key, { ...state, stale: true })
    }
  }

  queue.clear()
  if (debugEnabled) console.log('[AuthWorker-Dedicated] Identity cleared')
}

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  if (debugEnabled) console.log('[AuthWorker-Dedicated] Initializing...')

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
        if (debugEnabled) console.log(`[AuthWorker-Dedicated] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[AuthWorker-Dedicated] Error loading cache:', error)
  }

  // Create anonymous agent for public reads
  anonymousAgent = await createAgent({
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
      dataKey: 'userAllocation',
      state: dataStates.get('userAllocation') || createInitialState(),
      fromCache: false,
      tabCount: 1,
    },
  })

  if (debugEnabled) console.log('[AuthWorker-Dedicated] Initialized with anonymous agent')
}

// ============================================================================
// Message Handling
// ============================================================================

function handleMessage(message: WorkerRequest): void {
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
          dataKey: 'userAllocation',
          state: createInitialState(),
          fromCache: false,
          tabCount: 1,
        },
      })
      break

    case 'RESET':
      // Reset all state that could block fetches after fast page refresh
      if (debugEnabled) console.log('[AuthWorker-Dedicated] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
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

function handleSetAdmin(message: WorkerRequest): void {
  const wasAdmin = isAdmin
  isAdmin = message.payload.isAdmin || false

  if (debugEnabled) console.log(`[AuthWorker-Dedicated] Admin status: ${isAdmin}`)

  if (isAdmin && !wasAdmin && isAuthenticated) {
    for (const key of ADMIN_KEYS) {
      queue.enqueue(key, 'high')
    }
  }
}

function handleFetch(message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload

  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) {
    return
  }

  const requiresAuth = USER_KEYS.includes(dataKey) || AUTH_REQUIRED_KEYS.includes(dataKey)
  if (requiresAuth && !isAuthenticated) {
    const currentState = dataStates.get(dataKey)
    if (currentState?.data) {
      sendResponse({
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
    return
  }

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
  anonymousAgent = await createAgent({
    identity: new AnonymousIdentity(),
    host: getHost(),
    fetchRootKey: shouldFetchRootKey(),
  })

  // If authenticated, recreate authenticated agent with new network settings
  if (isAuthenticated && currentIdentity) {
    authenticatedAgent = await createAgent({
      identity: currentIdentity,
      host: getHost(),
      fetchRootKey: shouldFetchRootKey(),
    })
  }

  // Only clear cache if network actually changed (not on first setup)
  if (networkChanged) {
    try {
      const { clearAllCached } = await import('./shared/indexed-db')
      await clearAllCached()
    } catch (err) {
      console.error('[AuthWorker-Dedicated] Error clearing cache:', err)
    }

    // Clear in-memory state and queue for refetch
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      // Queue PUBLIC_ADMIN_KEYS since they can be fetched with anonymous agent
      if (PUBLIC_ADMIN_KEYS.includes(key)) {
        queue.enqueue(key, 'high')
      }
      // Queue USER_KEYS only if authenticated
      if (USER_KEYS.includes(key) && isAuthenticated) {
        queue.enqueue(key, 'high')
      }
    }
  }
}

// ============================================================================
// Queue Processing
// ============================================================================

const MAX_CONCURRENT_FETCHES = 5
let activeFetchCount = 0

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (true) {
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      const item = queue.dequeue()

      if (!item) break

      const requiresAuth = USER_KEYS.includes(item.dataKey) || AUTH_REQUIRED_KEYS.includes(item.dataKey)
      if (requiresAuth && (!isAuthenticated || !authenticatedAgent)) {
        queue.complete(item.dataKey)
        continue
      }

      if (!anonymousAgent && !authenticatedAgent) {
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

    if (ADMIN_KEYS.includes(item.dataKey) && !isAdmin) {
      isAdmin = true
      if (debugEnabled) console.log('[AuthWorker-Dedicated] Admin confirmed by successful call')
    }
  } catch (error) {
    backoff.recordFailure(item.dataKey)

    const errorMsg = error instanceof Error ? error.message : String(error)
    const isAccessDenied = errorMsg.includes('not authorized') ||
      errorMsg.includes('admin') ||
      errorMsg.includes('canister_inspect_message') ||
      errorMsg.includes('refused message')

    if (isAccessDenied && ADMIN_KEYS.includes(item.dataKey)) {
      if (debugEnabled) console.log(`[AuthWorker-Dedicated] Access denied for ${item.dataKey} - skipping`)
      isAdmin = false
      queue.complete(item.dataKey)
      return
    }

    console.error(`[AuthWorker-Dedicated] Error fetching ${item.dataKey}:`, error)

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
  const requiresAuth = USER_KEYS.includes(dataKey) || AUTH_REQUIRED_KEYS.includes(dataKey)
  const agent = requiresAuth
    ? authenticatedAgent
    : (authenticatedAgent || anonymousAgent)

  if (!agent) {
    throw new Error(requiresAuth ? 'No authenticated agent' : 'No agent available')
  }

  updateState(dataKey, { loading: true, error: null })

  let data: unknown

  switch (dataKey) {
    case 'userAllocation':
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
    case 'penalizedNeurons':
      data = serializeForTransfer(await fetchPenalizedNeuronsData(agent))
      break
    case 'rebalanceConfig':
      data = serializeForTransfer(await fetchRebalanceConfigData(agent))
      break
    case 'systemParameters':
      data = serializeForTransfer(await fetchSystemParametersData(agent))
      break
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
    case 'neuronSnapshots':
      data = serializeForTransfer(await fetchNeuronSnapshotsData(agent))
      break
    case 'maxNeuronSnapshots':
      data = serializeForTransfer(await fetchMaxNeuronSnapshotsData(agent))
      break
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

    // Skip auto-refresh if idle or not authenticated
    if (isIdle || !isAuthenticated) continue

    for (const dataKey of USER_KEYS) {
      const state = dataStates.get(dataKey)
      if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
        queue.enqueue(dataKey, 'medium')
      }
    }

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

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  handleMessage(e.data)
}

init().then(() => {
  autoRefreshLoop()
})
