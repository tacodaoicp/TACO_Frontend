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

import { HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { getFrontendIdentity } from '../utils/frontend-identity'
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
  fetchSnapshotInfoData,
  calculateTotalTreasuryValueInUsd,
  // Secondary fetch functions
  fetchVotingPowerMetricsData,
  fetchTacoProposalsData,
  fetchProposalsThreadsData,
  fetchAllNamesData,
  fetchNeuronSnapshotStatusData,
  fetchPortfolioSnapshotStatusData,
  // Performance/Leaderboard fetch functions
  fetchLeaderboardData,
  fetchLeaderboardInfoData,
  fetchAllocationStatsData,
  fetchHistoricBalanceAndAllocationData,
  // Composite query fetch functions
  fetchVoteDashboardData,
  fetchAllLeaderboardsData,
  fetchTreasuryDashboardData,
  fetchEnhancedTreasuryDashboardData,
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
  'tokenMaxAllocations',
  'tradingStatus',
  'timerStatus',
  // Secondary (medium priority)
  'votingPowerMetrics',
  'allocationStats',
  'historicBalanceAndAllocation',
  'tacoProposals',
  'proposalsThreads',
  'allNames',
  'neuronSnapshotStatus',
  'portfolioSnapshotStatus',
  // Performance/Leaderboard (8 combinations: 2 price types × 4 timeframes)
  'leaderboardAllTimeUSD',
  'leaderboardAllTimeICP',
  'leaderboardOneYearUSD',
  'leaderboardOneYearICP',
  'leaderboardOneMonthUSD',
  'leaderboardOneMonthICP',
  'leaderboardOneWeekUSD',
  'leaderboardOneWeekICP',
  'leaderboardInfo',
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
let currentUserPrincipal: string | null = null // User principal for getVoteDashboard
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
    identity: getFrontendIdentity(),
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

    case 'SET_USER_PRINCIPAL': {
      const newPrincipal = message.payload.userPrincipal || null
      const principalChanged = newPrincipal !== currentUserPrincipal
      currentUserPrincipal = newPrincipal
      if (principalChanged) {
        // Invalidate dashboard cache so next fetch uses new principal
        lastVoteDashboardResult = null
        if (debugEnabled) console.log(`[PublicDedicatedWorker] User principal ${newPrincipal ? 'set' : 'cleared'}`)
      }
      break
    }
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

// ============================================================================
// Composite Query Coalescing Cache
// Prevents redundant composite calls when multiple data keys that share
// a composite endpoint are processed within a short window.
// ============================================================================

let lastVoteDashboardResult: { data: any; timestamp: number } | null = null
let lastLeaderboardResult: { data: any; timestamp: number } | null = null
let lastEnhancedTreasuryResult: { data: any; timestamp: number } | null = null
const COALESCE_MS = 5_000

async function getVoteDashboardCoalesced(agentRef: HttpAgent): Promise<any | null> {
  if (lastVoteDashboardResult && (Date.now() - lastVoteDashboardResult.timestamp) < COALESCE_MS) {
    return lastVoteDashboardResult.data
  }
  try {
    // Pass principal if available — getVoteDashboard is a query, no auth needed
    const principal = currentUserPrincipal
      ? Principal.fromText(currentUserPrincipal)
      : undefined
    const data = await fetchVoteDashboardData(agentRef, principal)
    lastVoteDashboardResult = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.warn('[PublicWorker-Dedicated] getVoteDashboard composite failed, falling back to individual calls:', err)
    lastVoteDashboardResult = { data: null, timestamp: Date.now() }
    return null
  }
}

async function getAllLeaderboardsCoalesced(agentRef: HttpAgent): Promise<any | null> {
  if (lastLeaderboardResult && (Date.now() - lastLeaderboardResult.timestamp) < COALESCE_MS) {
    return lastLeaderboardResult.data
  }
  try {
    const data = await fetchAllLeaderboardsData(agentRef)
    lastLeaderboardResult = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.warn('[PublicWorker-Dedicated] getAllLeaderboards composite failed, falling back to individual calls:', err)
    lastLeaderboardResult = { data: null, timestamp: Date.now() }
    return null
  }
}

async function getEnhancedTreasuryDashboardCoalesced(agentRef: HttpAgent): Promise<any | null> {
  if (lastEnhancedTreasuryResult && (Date.now() - lastEnhancedTreasuryResult.timestamp) < COALESCE_MS) {
    return lastEnhancedTreasuryResult.data
  }
  try {
    const data = await fetchEnhancedTreasuryDashboardData(agentRef)
    lastEnhancedTreasuryResult = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.warn('[PublicWorker-Dedicated] getEnhancedTreasuryDashboard composite failed, falling back to individual calls:', err)
    lastEnhancedTreasuryResult = { data: null, timestamp: Date.now() }
    return null
  }
}

/**
 * Populate sibling data keys from the EnhancedTreasuryDashboard composite response.
 * DedicatedWorker version — includes broadcastUpdate() for each sibling.
 */
async function populateEnhancedTreasurySiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  const now = Date.now()
  const freshState: Partial<DataState> = { lastUpdated: now, loading: false, error: null, stale: false }

  if (excludeKey !== 'tradingStatus') {
    const ts = serializeForTransfer({ ok: dashboard.tradingStatus })
    updateState('tradingStatus', { data: ts, ...freshState })
    broadcastUpdate('tradingStatus', ts)
    await setCached('tradingStatus', ts)
  }

  if (excludeKey !== 'portfolioSnapshotStatus') {
    const pss = serializeForTransfer({
      status: dashboard.portfolioSnapshotStatus.status,
      intervalMinutes: Number(dashboard.portfolioSnapshotStatus.intervalMinutes),
      lastSnapshotTime: Number(dashboard.portfolioSnapshotStatus.lastSnapshotTime),
    })
    updateState('portfolioSnapshotStatus', { data: pss, ...freshState })
    broadcastUpdate('portfolioSnapshotStatus', pss)
    await setCached('portfolioSnapshotStatus', pss)
  }
}

/**
 * Extract tokenMaxAllocations from PublicTokenDetailsWithMaxAllocationEntry[].
 * Produces the old [Principal, bigint][] format from the embedded maxAllocationBasisPoints field.
 */
function extractTokenMaxAllocations(tokenDetails: any[]): any[] {
  return tokenDetails
    .filter((entry: any) => entry[1].maxAllocationBasisPoints?.length > 0)
    .map((entry: any) => [entry[0], entry[1].maxAllocationBasisPoints[0]])
}

/**
 * Populate sibling data keys from a getVoteDashboard composite response.
 * DedicatedWorker version — includes broadcastUpdate() for each sibling.
 */
async function populateVoteDashboardSiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  const now = Date.now()
  const freshState: Partial<DataState> = { lastUpdated: now, loading: false, error: null, stale: false }

  if (excludeKey !== 'tokenDetails') {
    const td = serializeForTransfer(dashboard.tokenDetails)
    updateState('tokenDetails', { data: td, ...freshState })
    broadcastUpdate('tokenDetails', td)
    await setCached('tokenDetails', td)
  }

  if (excludeKey !== 'totalTreasuryValueInUsd') {
    const tv = calculateTotalTreasuryValueInUsd(dashboard.tokenDetails as any[])
    updateState('totalTreasuryValueInUsd', { data: tv, ...freshState })
    broadcastUpdate('totalTreasuryValueInUsd', tv)
    await setCached('totalTreasuryValueInUsd', tv)
  }

  if (excludeKey !== 'aggregateAllocation') {
    const aa = serializeForTransfer(dashboard.aggregateAllocation)
    updateState('aggregateAllocation', { data: aa, ...freshState })
    broadcastUpdate('aggregateAllocation', aa)
    await setCached('aggregateAllocation', aa)
  }

  if (excludeKey !== 'votingPowerMetrics') {
    // Wrap in Result format { ok: ... } to match existing store expectation
    const vp = serializeForTransfer({ ok: dashboard.votingPowerMetrics })
    updateState('votingPowerMetrics', { data: vp, ...freshState })
    broadcastUpdate('votingPowerMetrics', vp)
    await setCached('votingPowerMetrics', vp)
  }

  if (excludeKey !== 'timerStatus') {
    const cachedTS = dataStates.get('tradingStatus')?.data
    const ts = serializeForTransfer({
      snapshotInfo: dashboard.snapshotInfo,
      tradingStatus: cachedTS ?? null,
      tokenDetails: dashboard.tokenDetails,
    })
    updateState('timerStatus', { data: ts, ...freshState })
    broadcastUpdate('timerStatus', ts)
    await setCached('timerStatus', ts)
  }

  if (excludeKey !== 'tokenMaxAllocations') {
    // Extract from embedded maxAllocationBasisPoints in each token entry
    const tma = serializeForTransfer(extractTokenMaxAllocations(dashboard.tokenDetails))
    updateState('tokenMaxAllocations', { data: tma, ...freshState })
    broadcastUpdate('tokenMaxAllocations', tma)
    await setCached('tokenMaxAllocations', tma)
  }

  // New fields from getVoteDashboard
  if (excludeKey !== 'allocationStats') {
    const as_ = serializeForTransfer(dashboard.allocationStats)
    updateState('allocationStats', { data: as_, ...freshState })
    broadcastUpdate('allocationStats', as_)
    await setCached('allocationStats', as_)
  }

  if (excludeKey !== 'historicBalanceAndAllocation') {
    const hba = serializeForTransfer(dashboard.historicBalanceAndAllocation)
    updateState('historicBalanceAndAllocation', { data: hba, ...freshState })
    broadcastUpdate('historicBalanceAndAllocation', hba)
    await setCached('historicBalanceAndAllocation', hba)
  }

  // userAllocation — not in HANDLED_KEYS, broadcast directly to main thread
  if (dashboard.userAllocation?.length > 0) {
    const ua = serializeForTransfer(dashboard.userAllocation)
    const uaState: DataState = { data: ua, lastUpdated: now, loading: false, error: null, stale: false }
    sendResponse({
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'DATA_UPDATE',
      payload: { dataKey: 'userAllocation' as DataKey, data: ua, state: uaState, fromCache: false },
    })
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

    case 'tokenDetails': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        const rawTokenData = await fetchTokenDetailsData(agent!)
        data = serializeForTransfer(rawTokenData)
        const totalValue = calculateTotalTreasuryValueInUsd(rawTokenData as any[])
        updateState('totalTreasuryValueInUsd', { data: totalValue, loading: false, error: null, lastUpdated: Date.now(), stale: false })
        broadcastUpdate('totalTreasuryValueInUsd', totalValue)
        await setCached('totalTreasuryValueInUsd', totalValue)
        break
      }
      data = serializeForTransfer(dashboard.tokenDetails)
      await populateVoteDashboardSiblings(dashboard, 'tokenDetails')
      break
    }

    case 'totalTreasuryValueInUsd': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        const tokenData = await fetchTokenDetailsData(agent!)
        data = calculateTotalTreasuryValueInUsd(tokenData as any[])
        updateState('tokenDetails', { data: serializeForTransfer(tokenData), lastUpdated: Date.now(), loading: false, error: null, stale: false })
        await setCached('tokenDetails', serializeForTransfer(tokenData))
        break
      }
      data = calculateTotalTreasuryValueInUsd(dashboard.tokenDetails as any[])
      await populateVoteDashboardSiblings(dashboard, 'totalTreasuryValueInUsd')
      break
    }

    case 'aggregateAllocation': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer(await fetchAggregateAllocationData(agent!))
        break
      }
      data = serializeForTransfer(dashboard.aggregateAllocation)
      await populateVoteDashboardSiblings(dashboard, 'aggregateAllocation')
      break
    }

    case 'tradingStatus': {
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(agent!)
      if (enhancedDashboard) {
        data = serializeForTransfer({ ok: enhancedDashboard.tradingStatus })
        await populateEnhancedTreasurySiblings(enhancedDashboard, 'tradingStatus')
      } else {
        data = serializeForTransfer(await fetchTradingStatusData(agent!))
      }
      break
    }

    case 'timerStatus': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        const snapshotInfo = await fetchSnapshotInfoData(agent!)
        const cachedTS = dataStates.get('tradingStatus')?.data
        const cachedTD = dataStates.get('tokenDetails')?.data
        data = serializeForTransfer({ snapshotInfo, tradingStatus: cachedTS ?? null, tokenDetails: cachedTD ?? [] })
        break
      }
      const cachedTradingStatus = dataStates.get('tradingStatus')?.data
      data = serializeForTransfer({
        snapshotInfo: dashboard.snapshotInfo,
        tradingStatus: cachedTradingStatus ?? null,
        tokenDetails: dashboard.tokenDetails,
      })
      await populateVoteDashboardSiblings(dashboard, 'timerStatus')
      break
    }

    // Secondary data keys
    case 'votingPowerMetrics': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer(await fetchVotingPowerMetricsData(agent!))
        break
      }
      data = serializeForTransfer({ ok: dashboard.votingPowerMetrics })
      await populateVoteDashboardSiblings(dashboard, 'votingPowerMetrics')
      break
    }

    case 'tokenMaxAllocations': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer([])
        break
      }
      // Extract from embedded maxAllocationBasisPoints in each token entry
      data = serializeForTransfer(extractTokenMaxAllocations(dashboard.tokenDetails))
      await populateVoteDashboardSiblings(dashboard, 'tokenMaxAllocations')
      break
    }

    case 'allocationStats': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer(await fetchAllocationStatsData(agent!))
        break
      }
      data = serializeForTransfer(dashboard.allocationStats)
      await populateVoteDashboardSiblings(dashboard, 'allocationStats')
      break
    }

    case 'historicBalanceAndAllocation': {
      const dashboard = await getVoteDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer(await fetchHistoricBalanceAndAllocationData(agent!))
        break
      }
      data = serializeForTransfer(dashboard.historicBalanceAndAllocation)
      await populateVoteDashboardSiblings(dashboard, 'historicBalanceAndAllocation')
      break
    }

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

    case 'portfolioSnapshotStatus': {
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(agent!)
      if (enhancedDashboard) {
        data = serializeForTransfer({
          status: enhancedDashboard.portfolioSnapshotStatus.status,
          intervalMinutes: Number(enhancedDashboard.portfolioSnapshotStatus.intervalMinutes),
          lastSnapshotTime: Number(enhancedDashboard.portfolioSnapshotStatus.lastSnapshotTime),
        })
        await populateEnhancedTreasurySiblings(enhancedDashboard, 'portfolioSnapshotStatus')
      } else {
        data = serializeForTransfer(await fetchPortfolioSnapshotStatusData(agent!))
      }
      break
    }

    // Performance/Leaderboard data keys (8 combinations) — single composite call
    case 'leaderboardAllTimeUSD':
    case 'leaderboardAllTimeICP':
    case 'leaderboardOneYearUSD':
    case 'leaderboardOneYearICP':
    case 'leaderboardOneMonthUSD':
    case 'leaderboardOneMonthICP':
    case 'leaderboardOneWeekUSD':
    case 'leaderboardOneWeekICP': {
      const allLB = await getAllLeaderboardsCoalesced(agent!)
      if (!allLB) {
        // Composite not available, fall back to individual call
        const lbFallbackMap: Record<string, { timeframe: 'AllTime' | 'OneYear' | 'OneMonth' | 'OneWeek'; priceType: 'USD' | 'ICP' }> = {
          leaderboardAllTimeUSD: { timeframe: 'AllTime', priceType: 'USD' },
          leaderboardAllTimeICP: { timeframe: 'AllTime', priceType: 'ICP' },
          leaderboardOneYearUSD: { timeframe: 'OneYear', priceType: 'USD' },
          leaderboardOneYearICP: { timeframe: 'OneYear', priceType: 'ICP' },
          leaderboardOneMonthUSD: { timeframe: 'OneMonth', priceType: 'USD' },
          leaderboardOneMonthICP: { timeframe: 'OneMonth', priceType: 'ICP' },
          leaderboardOneWeekUSD: { timeframe: 'OneWeek', priceType: 'USD' },
          leaderboardOneWeekICP: { timeframe: 'OneWeek', priceType: 'ICP' },
        }
        const { timeframe, priceType } = lbFallbackMap[dataKey]
        data = serializeForTransfer(await fetchLeaderboardData(agent!, timeframe, priceType, 50, 0))
        break
      }

      const lbKeyMap: Record<string, string> = {
        leaderboardAllTimeUSD: 'allTimeUSD',
        leaderboardAllTimeICP: 'allTimeICP',
        leaderboardOneYearUSD: 'oneYearUSD',
        leaderboardOneYearICP: 'oneYearICP',
        leaderboardOneMonthUSD: 'oneMonthUSD',
        leaderboardOneMonthICP: 'oneMonthICP',
        leaderboardOneWeekUSD: 'oneWeekUSD',
        leaderboardOneWeekICP: 'oneWeekICP',
      }

      // Set current key's data
      data = serializeForTransfer(allLB[lbKeyMap[dataKey]])

      // Populate all 7 sibling leaderboard states from same response
      const now = Date.now()
      const freshState: Partial<DataState> = { lastUpdated: now, loading: false, error: null, stale: false }
      for (const [dk, field] of Object.entries(lbKeyMap)) {
        if (dk === dataKey) continue
        const lbData = serializeForTransfer(allLB[field])
        updateState(dk as DataKey, { data: lbData, ...freshState })
        broadcastUpdate(dk as DataKey, lbData)
        await setCached(dk as DataKey, lbData)
      }
      break
    }

    case 'leaderboardInfo':
      data = serializeForTransfer(await fetchLeaderboardInfoData(agent!))
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
