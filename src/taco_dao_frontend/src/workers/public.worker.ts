/**
 * Public Data SharedWorker
 *
 * Handles all public data that requires no authentication:
 * - Core high-priority: cryptoPrices, tokenDetails, totalTreasuryValueInUsd, aggregateAllocation, tradingStatus, timerStatus
 * - Secondary medium-priority: votingPowerMetrics, tacoProposals, proposalsThreads, allNames, neuronSnapshotStatus, portfolioSnapshotStatus
 *
 * Consolidated from core-public.worker.ts and secondary-public.worker.ts
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
  // Composite query fetch functions
  fetchDashboardData,
  fetchAllLeaderboardsData,
  fetchTreasuryDashboardData,
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
let currentNetwork: 'ic' | 'staging' | 'local' | null = null
let debugEnabled = false // Debug mode - disabled by default in production

// Initial load state
let initialLoadKeys: Set<DataKey> = new Set()
let pendingPriorityKeys: Set<DataKey> = new Set()
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
  if (debugEnabled) console.log('[PublicWorker] Initializing...')

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
        if (debugEnabled) console.log(`[PublicWorker] Loaded cached ${key}`)
      }
    }
  } catch (error) {
    console.error('[PublicWorker] Error loading cache:', error)
  }

  // Mark as initialized after cache load
  isInitialized = true

  // Deliver cached data to any ports that connected during init
  if (debugEnabled) console.log(`[PublicWorker] Delivering cached data to ${pendingCacheDeliveries.length} pending ports`)
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
      if ((!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
        queue.enqueue(key, 'high')
      }
    }
  }
  pendingCacheDeliveries.length = 0

  // Process pending INITIAL_LOAD if one arrived before init completed
  if (pendingInitialLoad) {
    if (debugEnabled) console.log('[PublicWorker] Processing pending INITIAL_LOAD')
    handleInitialLoad(pendingInitialLoad.port, pendingInitialLoad.message)
    pendingInitialLoad = null
  }

  if (debugEnabled) console.log('[PublicWorker] Cache initialized, agent will be created when SET_NETWORK is received')

  // Start processing loop
  processQueue()

  if (debugEnabled) console.log('[PublicWorker] Init complete, waiting for SET_NETWORK')
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

  if (debugEnabled) console.log(`[PublicWorker] Port connected. Total: ${connectedPorts.size}`)

  port.onmessage = (e: MessageEvent<WorkerRequest>) => {
    handleMessage(port, e.data)
  }

  port.onmessageerror = () => {
    disconnectPort(port)
  }

  port.start()

  // Send connected message
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

  if (!isInitialized) {
    if (debugEnabled) console.log(`[PublicWorker] Port connected before init - waiting for INITIAL_LOAD`)
  }
}

function disconnectPort(port: MessagePort): void {
  connectedPorts.delete(port)
  for (const subscribers of subscriptions.values()) {
    subscribers.delete(port)
  }
  if (debugEnabled) console.log(`[PublicWorker] Port disconnected. Total: ${connectedPorts.size}`)
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
      if (debugEnabled) console.log(`[PublicWorker] Visibility: ${message.payload.visible ? 'visible' : 'hidden'}`)
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
      if (debugEnabled) console.log('[PublicWorker] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
      backoff.resetAll()
      queue.clearProcessing()
      activeFetchCount = 0
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

function handleInitialLoad(port: MessagePort, message: WorkerRequest): void {
  const route = message.payload.route || '/'
  if (debugEnabled) console.log(`[PublicWorker] INITIAL_LOAD for route: ${route}`)

  if (!isInitialized) {
    if (debugEnabled) console.log(`[PublicWorker] Not initialized, queuing INITIAL_LOAD for route: ${route}`)
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

  if (debugEnabled) console.log(`[PublicWorker] Priority keys for route: ${Array.from(initialLoadKeys).join(', ') || 'none'}`)

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
    if (!state?.data || isStale(key, state.lastUpdated)) {
      pendingPriorityKeys.add(key)
      queue.enqueue(key, 'critical')
    }
  }

  // Signal that initial cache delivery is complete for this worker
  if (!portsReceivedCacheReady.has(port)) {
    portsReceivedCacheReady.add(port)
    sendResponse(port, {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'INITIAL_CACHE_READY',
      payload: {
        dataKey: 'cryptoPrices',
        state: createInitialState(),
        fromCache: true,
      },
    })
  }

  if (pendingPriorityKeys.size === 0) {
    triggerDeferredLoad()
  }
}

function onPriorityKeyLoaded(dataKey: DataKey): void {
  if (!pendingPriorityKeys.has(dataKey)) return

  pendingPriorityKeys.delete(dataKey)
  if (debugEnabled) console.log(`[PublicWorker] Priority key loaded: ${dataKey}, remaining: ${pendingPriorityKeys.size}`)

  if (pendingPriorityKeys.size === 0 && !deferredLoadTriggered) {
    triggerDeferredLoad()
  }
}

function triggerDeferredLoad(): void {
  if (deferredLoadTriggered) return
  deferredLoadTriggered = true

  if (debugEnabled) console.log('[PublicWorker] All priority keys loaded - starting deferred load for non-priority keys')

  for (const key of HANDLED_KEYS) {
    if (initialLoadKeys.has(key)) continue

    const state = dataStates.get(key)
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
    if (!state?.data || isStale(key, state.lastUpdated)) {
      queue.enqueue(key, 'low')
    }
  }
}

function handleFetch(port: MessagePort, message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) return

  const currentState = dataStates.get(dataKey)

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

  for (const key of validKeys) {
    subscriptions.get(key)?.add(port)
  }

  if (!isInitialized) {
    if (debugEnabled) console.log(`[PublicWorker] Not yet initialized, queuing cache delivery for ${validKeys.length} keys`)
    pendingCacheDeliveries.push({ port, keys: validKeys })
    return
  }

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
      queue.enqueue(key, 'critical')
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  const newNetwork = network || 'ic'

  const isFirstSetup = currentNetwork === null
  const networkChanged = currentNetwork !== null && currentNetwork !== newNetwork

  if (debugEnabled) console.log(`[PublicWorker] SET_NETWORK: ${newNetwork} (current: ${currentNetwork}, isFirst: ${isFirstSetup}, changed: ${networkChanged})`)

  currentNetwork = newNetwork
  setWorkerNetworkOverride(network || null)

  await createAnonymousAgent()

  if (networkChanged) {
    try {
      const { clearAllCached } = await import('./shared/indexed-db')
      await clearAllCached()
      if (debugEnabled) console.log('[PublicWorker] Cleared IndexedDB cache due to network change')
    } catch (err) {
      console.error('[PublicWorker] Error clearing cache:', err)
    }

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

    // Adaptive sleep: longer when idle (no active fetches and empty queue), shorter when processing
    // This dramatically reduces CPU overhead when the worker is waiting
    const isIdle = activeFetchCount === 0 && queue.isEmpty()
    await sleep(isIdle ? 500 : 50)
  }
}

async function processSingleFetch(item: { dataKey: DataKey; retryCount: number }): Promise<void> {
  try {
    backoff.recordAttempt(item.dataKey)
    await fetchData(item.dataKey)
    backoff.recordSuccess(item.dataKey)
    queue.complete(item.dataKey)
  } catch (error) {
    console.error(`[PublicWorker] Error fetching ${item.dataKey}:`, error)
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

// ============================================================================
// Composite Query Coalescing Cache
// Prevents redundant composite calls when multiple data keys that share
// a composite endpoint are processed within a short window.
// ============================================================================

let lastDashboardResult: { data: any; timestamp: number } | null = null
let lastLeaderboardResult: { data: any; timestamp: number } | null = null
const COALESCE_MS = 5_000

async function getDashboardCoalesced(agentRef: HttpAgent): Promise<any | null> {
  if (lastDashboardResult && (Date.now() - lastDashboardResult.timestamp) < COALESCE_MS) {
    return lastDashboardResult.data
  }
  try {
    const data = await fetchDashboardData(agentRef)
    lastDashboardResult = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.warn('[PublicWorker] getDashboardData composite failed, falling back to individual calls:', err)
    // Cache null so we don't retry the composite for COALESCE_MS
    lastDashboardResult = { data: null, timestamp: Date.now() }
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
    console.warn('[PublicWorker] getAllLeaderboards composite failed, falling back to individual calls:', err)
    lastLeaderboardResult = { data: null, timestamp: Date.now() }
    return null
  }
}

/**
 * Populate sibling data keys from a composite dashboard response.
 * Skips the excludeKey since it's handled by the main flow after the switch.
 */
async function populateDashboardSiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  const now = Date.now()
  const freshState: Partial<DataState> = { lastUpdated: now, loading: false, error: null, stale: false }

  if (excludeKey !== 'tokenDetails') {
    const td = serializeForTransfer(dashboard.tokenDetails)
    updateState('tokenDetails', { data: td, ...freshState })
    await setCached('tokenDetails', td)
  }

  if (excludeKey !== 'totalTreasuryValueInUsd') {
    const tv = calculateTotalTreasuryValueInUsd(dashboard.tokenDetails as any[])
    updateState('totalTreasuryValueInUsd', { data: tv, ...freshState })
    await setCached('totalTreasuryValueInUsd', tv)
  }

  if (excludeKey !== 'aggregateAllocation') {
    const aa = serializeForTransfer(dashboard.aggregateAllocation)
    updateState('aggregateAllocation', { data: aa, ...freshState })
    await setCached('aggregateAllocation', aa)
  }

  if (excludeKey !== 'votingPowerMetrics') {
    const vp = serializeForTransfer({ ok: dashboard.votingPowerMetrics })
    updateState('votingPowerMetrics', { data: vp, ...freshState })
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
    await setCached('timerStatus', ts)
  }

  if (excludeKey !== 'tokenMaxAllocations') {
    const tma = serializeForTransfer(dashboard.tokenMaxAllocations || [])
    updateState('tokenMaxAllocations', { data: tma, ...freshState })
    await setCached('tokenMaxAllocations', tma)
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  updateState(dataKey, { loading: true, error: null })

  if (!agent) {
    await createAnonymousAgent()
  }

  let data: unknown

  switch (dataKey) {
    // Core data keys
    case 'cryptoPrices':
      data = await fetchCryptoPricesData()
      break

    case 'tokenDetails': {
      const dashboard = await getDashboardCoalesced(agent!)
      if (!dashboard) {
        // Fallback to individual call if composite returns null
        const rawTokenData = await fetchTokenDetailsData(agent!)
        data = serializeForTransfer(rawTokenData)
        const treasuryValue = calculateTotalTreasuryValueInUsd(rawTokenData as any[])
        updateState('totalTreasuryValueInUsd', { data: treasuryValue, lastUpdated: Date.now(), loading: false, error: null, stale: false })
        await setCached('totalTreasuryValueInUsd', treasuryValue)
        break
      }
      data = serializeForTransfer(dashboard.tokenDetails)
      await populateDashboardSiblings(dashboard, 'tokenDetails')
      break
    }

    case 'totalTreasuryValueInUsd': {
      const dashboard = await getDashboardCoalesced(agent!)
      if (!dashboard) {
        const tokenData = await fetchTokenDetailsData(agent!)
        data = calculateTotalTreasuryValueInUsd(tokenData as any[])
        updateState('tokenDetails', { data: serializeForTransfer(tokenData), lastUpdated: Date.now(), loading: false, error: null, stale: false })
        await setCached('tokenDetails', serializeForTransfer(tokenData))
        break
      }
      data = calculateTotalTreasuryValueInUsd(dashboard.tokenDetails as any[])
      await populateDashboardSiblings(dashboard, 'totalTreasuryValueInUsd')
      break
    }

    case 'aggregateAllocation': {
      const dashboard = await getDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer(await fetchAggregateAllocationData(agent!))
        break
      }
      data = serializeForTransfer(dashboard.aggregateAllocation)
      await populateDashboardSiblings(dashboard, 'aggregateAllocation')
      break
    }

    case 'tradingStatus': {
      try {
        const treasuryResult = await fetchTreasuryDashboardData(agent!)
        if ('ok' in treasuryResult) {
          // Wrap inner tradingStatus in Result format to match getTradingStatus() shape
          data = serializeForTransfer({ ok: treasuryResult.ok.tradingStatus })
        } else {
          // Composite returned { err }, fall back to individual call
          data = serializeForTransfer(await fetchTradingStatusData(agent!))
        }
      } catch {
        // Composite endpoint not available, fall back to individual call
        data = serializeForTransfer(await fetchTradingStatusData(agent!))
      }
      break
    }

    case 'timerStatus': {
      const dashboard = await getDashboardCoalesced(agent!)
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
      await populateDashboardSiblings(dashboard, 'timerStatus')
      break
    }

    // Secondary data keys
    case 'votingPowerMetrics': {
      const dashboard = await getDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer(await fetchVotingPowerMetricsData(agent!))
        break
      }
      // Wrap in Result format { ok: ... } to match existing store expectation
      data = serializeForTransfer({ ok: dashboard.votingPowerMetrics })
      await populateDashboardSiblings(dashboard, 'votingPowerMetrics')
      break
    }

    case 'tokenMaxAllocations': {
      const dashboard = await getDashboardCoalesced(agent!)
      if (!dashboard) {
        data = serializeForTransfer([])
        break
      }
      data = serializeForTransfer(dashboard.tokenMaxAllocations || [])
      await populateDashboardSiblings(dashboard, 'tokenMaxAllocations')
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

    case 'portfolioSnapshotStatus':
      data = serializeForTransfer(await fetchPortfolioSnapshotStatusData(agent!))
      break

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
        await setCached(dk as DataKey, lbData)
      }
      break
    }

    case 'leaderboardInfo':
      data = serializeForTransfer(await fetchLeaderboardInfoData(agent!))
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
    if (debugEnabled) console.log('[PublicWorker] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    if (debugEnabled) console.log('[PublicWorker] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    if (debugEnabled) console.log('[PublicWorker] Activity detected - resuming refreshes')
  }
}

// ============================================================================
// Auto-refresh Loop (5 second interval for core data responsiveness)
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  while (true) {
    await sleep(5000) // Check every 5 seconds

    checkIdleStatus()

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
