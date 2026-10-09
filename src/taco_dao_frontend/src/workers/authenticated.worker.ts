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
import { getFrontendIdentity } from '../utils/frontend-identity'
import { Principal } from '@dfinity/principal'
import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity'
import { createAgent } from '@dfinity/utils'
import { PriorityQueue } from './shared/priority-queue'
import { BackoffTracker } from './shared/backoff'
import { setCached, getCachedMany, setCacheNetwork, type CachedEntry } from './shared/indexed-db'
import { getHost, shouldFetchRootKey, setWorkerNetworkOverride } from './shared/canister-ids'
import {
  // Public data fetch functions
  fetchCryptoPricesData,
  fetchTokenDetailsData,
  fetchTradingStatusData,
  fetchSnapshotInfoData,
  fetchTacoProposalsData,
  fetchProposalsThreadsData,
  fetchAllNamesData,
  fetchNeuronSnapshotStatusData,
  fetchPortfolioSnapshotStatusData,
  fetchLeaderboardData,
  fetchLeaderboardInfoData,
  calculateTotalTreasuryValueInUsd,
  // Composite query functions
  fetchVoteDashboardData,
  fetchAllLeaderboardsData,
  fetchEnhancedTreasuryDashboardData,
  // User/Auth data fetch functions
  fetchUserAllocationData,
  fetchSystemLogsData,
  fetchVoterDetailsData,
  fetchNeuronAllocationsData,
  fetchPenalizedNeuronsData,
  fetchRebalanceConfigData,
  fetchSystemParametersData,
  // Treasury/Trading admin data
  fetchPriceAlertsData,
  fetchTradingPausesData,
  fetchCircuitBreakerLogsData,
  fetchCircuitBreakerConditionsData,
  fetchPortfolioCircuitBreakerConditionsData,
  // Neuron Snapshots admin data
  fetchNeuronSnapshotsData,
  fetchMaxNeuronSnapshotsData,
  // NNS Automation admin data
  fetchVotableProposalsData,
  fetchPeriodicTimerStatusData,
  fetchAutoVotingThresholdData,
  fetchProposerSubaccountData,
  fetchTacoDAONeuronIdData,
  fetchDefaultVoteBehaviorData,
  fetchHighestProcessedNNSProposalIdData,
  // Rewards/Distributions
  fetchRewardsConfigurationData,
  fetchDistributionHistoryData,
  // User performance
  fetchUserPerformanceData,
  // Swap dashboard
  fetchSwapDashboardData,
  // Nachos vault
  fetchNachosVaultDashboard,
  fetchNachosConfig,
  fetchNachosNavHistory,
  fetchNachosVaultAnalytics,
  // Utilities
  serializeForTransfer,
} from './shared/fetch-functions'
import type {
  DataKey,
  DataState,
  WorkerRequest,
  WorkerResponse,
  WorkerResponseType,
  Priority,
  SerializedIdentity,
} from './types'
import {
  STALENESS_THRESHOLDS,
  BACKGROUND_MULTIPLIER,
  IDLE_TIMEOUT_MS,
  generateMessageId,
  createInitialState,
  ADMIN_PRELOAD_KEYS,
  getInitialLoadKeys,
} from './types'

declare const self: SharedWorkerGlobalScope

// ============================================================================
// Data keys handled by this worker
// ============================================================================

const HANDLED_KEYS: DataKey[] = [
  // ========== PUBLIC KEYS (from public.worker, optimized) ==========
  'cryptoPrices',
  'tokenDetails', // Primary for getVoteDashboard composite
  'tokenMaxAllocations', // Sibling of tokenDetails (from getVoteDashboard)
  'tradingStatus', // Primary for getEnhancedTreasuryDashboard (public)
  'leaderboardAllTimeUSD', // Primary for getAllLeaderboards
  'leaderboardAllTimeICP',
  'leaderboardOneYearUSD',
  'leaderboardOneYearICP',
  'leaderboardOneMonthUSD',
  'leaderboardOneMonthICP',
  'leaderboardOneWeekUSD',
  'leaderboardOneWeekICP',
  'leaderboardInfo',
  'tacoProposals',
  'proposalsThreads',
  'allNames',
  'neuronSnapshotStatus',
  'timerStatus',
  // Nachos vault (public queries)
  'nachosVaultDashboard',
  'nachosConfig',
  'nachosNavHistory',
  'nachosVaultAnalytics',
  // ========== USER KEYS ==========
  'userAllocation',
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
  // Treasury/Trading admin data
  'priceAlerts',
  'tradingPauses',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
  // Neuron Snapshots admin data
  'neuronSnapshots',
  'maxNeuronSnapshots',
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
  // Performance data (user-specific)
  'userPerformance',
  // Swap dashboard (user-specific)
  'swapDashboard',
]

const USER_KEYS: DataKey[] = ['userAllocation', 'userPerformance', 'swapDashboard']

// Keys that REQUIRE authentication - canister enforces caller identity check
const AUTH_REQUIRED_KEYS: DataKey[] = [
  // NNS Automation - may require auth
  'votableProposals',
  'periodicTimerStatus',
  'autoVotingThreshold',
  'proposerSubaccount',
  'tacoDAONeuronId',
  'defaultVoteBehavior',
  'highestProcessedNNSProposalId',
]

// Public keys from merged public worker
const PUBLIC_KEYS: DataKey[] = [
  'cryptoPrices',
  'tokenDetails',
  'tokenMaxAllocations',
  'tradingStatus',
  'leaderboardAllTimeUSD',
  'leaderboardAllTimeICP',
  'leaderboardOneYearUSD',
  'leaderboardOneYearICP',
  'leaderboardOneMonthUSD',
  'leaderboardOneMonthICP',
  'leaderboardOneWeekUSD',
  'leaderboardOneWeekICP',
  'leaderboardInfo',
  'tacoProposals',
  'proposalsThreads',
  'allNames',
  'neuronSnapshotStatus',
  'timerStatus',
  // Nachos vault
  'nachosVaultDashboard',
  'nachosConfig',
  'nachosNavHistory',
  'nachosVaultAnalytics',
]

// The two treasury payloads (~650 KB each, 2000 trades) are restored from
// IndexedDB in a second pass, so small route data never waits behind them.
const HEAVY_CACHE_KEYS: DataKey[] = ['timerStatus', 'tradingStatus']

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
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
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
let isIdle = false
let lastActivityTime = Date.now()
let authenticatedAgent: HttpAgent | null = null
let anonymousAgent: HttpAgent | null = null  // For public read-only queries
let currentIdentity: Identity | null = null
let isAdmin = false
let isAuthenticated = false
let isInitialized = false
let currentNetwork: 'ic' | 'staging' | 'local' | null = null // Track current network to detect changes
let debugEnabled = false // Debug mode - disabled by default in production
let currentRoute = '/' // Current route for admin data gating
let currentPrincipal: string | null = null // Text of currentIdentity's principal
let creatingAnonymousAgent = false

// Principal each in-memory USER_KEYS entry belongs to. User data is only ever
// served to that same principal (see setIdentity / clearIdentity).
const userKeyOwner = new Map<DataKey, string>()
// Network each entry restored from IndexedDB was written on ('ic' for entries
// from before tagging); entries from another network are dropped.
const restoredNetwork = new Map<DataKey, string>()
// Bumped on a network change so a fetch still in flight on the old network is
// dropped instead of being shown and cached as the new network's data.
let networkEpoch = 0
// lastUpdated of the payload each tab already holds, per key (see sendResponse)
const deliveredTo = new WeakMap<MessagePort, Map<DataKey, number>>()
// Route each tab is on. Background refreshes of data that only some routes
// show serve every open tab, not only the tab that reported its route last.
const portRoutes = new Map<MessagePort, string>()

// Initial load state - track which keys are priority for current route
let initialLoadKeys: Set<DataKey> = new Set()
let pendingPriorityKeys: Set<DataKey> = new Set() // Keys still being fetched
let deferredLoadTriggered = false

// Queue of ports waiting for cached data after init
const pendingCacheDeliveries: Array<{ port: MessagePort; keys: DataKey[] }> = []

// Pending INITIAL_LOAD message to process after init completes
let pendingInitialLoad: { port: MessagePort; message: WorkerRequest } | null = null

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  // Initialization - debug log only if enabled
  if (debugEnabled) if (debugEnabled) console.log('[AuthWorker] Initializing...')

  // Initialize all data states
  for (const key of HANDLED_KEYS) {
    dataStates.set(key, createInitialState())
    subscriptions.set(key, new Set())
  }

  // DON'T start agent creation here - wait for SET_NETWORK message
  // The network override must be set before we know which host to connect to
  // Agent creation will be triggered by handleSetNetwork

  // Load cached data from IndexedDB (runs in parallel with agent creation), in
  // two passes: the small keys (vault, prices, token details) first, then the
  // two big treasury payloads, so route data is served without waiting on
  // ~1.3 MB of trade history. The first pass is raced against a timer, because
  // a hung openDB (multi-tab upgrade, broken private window IDB) must never
  // stand between the user and live fetches; a pass that lands after the timer
  // is merged in when it arrives instead of being thrown away. User data is
  // not restored here: setIdentity loads it for the principal that owns it.
  const restoreDeadline = sleep(3_000)
  const firstPass = getCachedMany(
    HANDLED_KEYS.filter(k => !HEAVY_CACHE_KEYS.includes(k) && !USER_KEYS.includes(k))
  )
  const restored = await Promise.race([firstPass, restoreDeadline.then(() => null)])
  if (restored) {
    applyRestoredCache(restored, false)
  } else {
    console.warn('[AuthWorker] IndexedDB restore is slow, starting with an empty cache and merging it when it lands')
    firstPass.then((late) => applyRestoredCache(late, true))
  }
  const heavyPass = firstPass
    .then(() => getCachedMany(HEAVY_CACHE_KEYS))
    .then((heavy) => applyRestoredCache(heavy, true))
  Promise.race([heavyPass, restoreDeadline]).then(openHeavyFetches, openHeavyFetches)

  // Mark as initialized IMMEDIATELY after cache load (before agent is ready)
  // This allows cached data to be delivered without waiting for agent
  isInitialized = true
  if (debugEnabled) console.log(`[AuthWorker] Initialization complete. dataStates has ${Array.from(dataStates.entries()).filter(([k, v]) => v.data).length} keys with data`)

  // Deliver cached data to any ports that connected during init
  // Also queue fetches for stale/missing data
  if (debugEnabled) console.log(`[AuthWorker] Delivering cached data to ${pendingCacheDeliveries.length} pending ports`)
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
      const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
      const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
        ? currentRoute.startsWith('/admin')
        : !requiresAuth
      if (canFetch && (!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
        queue.enqueue(key, 'high')
      }
    }
    // Note: Don't send INITIAL_CACHE_READY here - it will be sent by handleInitialLoad
    // which runs right after this when processing pendingInitialLoad
  }
  pendingCacheDeliveries.length = 0 // Clear the queue

  // Process pending INITIAL_LOAD if one arrived before init completed
  if (pendingInitialLoad) {
    if (debugEnabled) console.log('[AuthWorker] Processing pending INITIAL_LOAD')
    handleInitialLoad(pendingInitialLoad.port, pendingInitialLoad.message)
    pendingInitialLoad = null
  }

  debugLog('Cache initialized, agent will be created when SET_NETWORK is received')

  // Don't wait for agent here - it will be created by handleSetNetwork
  // Start processing loop - it will wait for agent to be available before fetching
  if (debugEnabled) console.log('[AuthWorker] Starting processQueue (agent creation pending)...')
  processQueue()

  debugLog(`Init complete: anonymousAgent=${!!anonymousAgent}, authenticatedAgent=${!!authenticatedAgent}, queueSize=${queue.size}`)
}

// Set once the heavy keys' IndexedDB copy has been read, or the restore gave
// up. Until then processQueue holds their fetches: started earlier, they
// downloaded ~1.3 MB again on every load even when the stored copy was fresh.
let heavyCacheRead = false

// True while a key of the current route is in flight or due to start, unless
// the route needs `heavyKey` itself. processQueue holds the heavy keys until
// then: decoding a ~180 KB treasury reply blocks this thread for a while, and
// in the first wave it held up the route's own small replies.
function routeKeysLoading(heavyKey: DataKey): boolean {
  const routeKeys = getInitialLoadKeys(currentRoute)
  if (routeKeys.includes(heavyKey)) return false
  return routeKeys.some((k) => queue.has(k) && (queue.isProcessing(k) || backoff.canRetry(k)))
}

function openHeavyFetches(): void {
  if (heavyCacheRead) return
  heavyCacheRead = true
  // A fetch queued while the copy loaded is only needed if it is missing or
  // stale (or, for timerStatus, if it was stored without its trading status)
  for (const key of HEAVY_CACHE_KEYS) {
    const state = dataStates.get(key)
    const partial = key === 'timerStatus' && (state?.data as any)?.tradingStatus == null
    if (state?.data && !partial && !isStale(key, state.lastUpdated) && !queue.isProcessing(key)) {
      queue.remove(key)
    }
  }
}

// Keys the routes of all open tabs show (see portRoutes). currentRoute is the
// route a tab reported last, possibly one that has closed since, so it only
// counts while no open tab has reported a route.
function openRouteKeys(): Set<DataKey> {
  const keys = new Set<DataKey>()
  for (const route of portRoutes.size ? portRoutes.values() : [currentRoute]) {
    for (const key of getInitialLoadKeys(route)) keys.add(key)
  }
  return keys
}

// Vault analytics load in the background only while an open tab is on the
// vault page, the one page that shows them. Its vault store stays subscribed
// after the user moves on, so a subscription says nothing.
function analyticsWanted(routeKeys: Set<DataKey>): boolean {
  return routeKeys.has('nachosVaultAnalytics')
}

/**
 * Put restored IndexedDB entries into memory. With `announce`, also push them
 * to subscribed tabs: used for passes that land after init has already served
 * its pending subscriptions (the heavy pass, or a first pass that beat the
 * timer only late).
 */
function applyRestoredCache(cached: Map<DataKey, CachedEntry>, announce: boolean): void {
  for (const [key, entry] of cached) {
    if (!HANDLED_KEYS.includes(key) || USER_KEYS.includes(key)) continue
    // Written on another network (cold start after a network switch). Entries
    // from before tagging count as mainnet: on the staging site the old worker
    // could write either network's data untagged, so there they are dropped.
    const network = entry.network ?? 'ic'
    if (currentNetwork && network !== currentNetwork) continue
    // A live fetch already landed; never replace newer data with the cache
    const current = dataStates.get(key)
    if (current?.data && (current.lastUpdated ?? 0) >= (entry.lastUpdated ?? 0)) continue

    const state: DataState = {
      data: entry.data,
      lastUpdated: entry.lastUpdated,
      loading: false,
      error: null,
      stale: isStale(key, entry.lastUpdated),
    }
    dataStates.set(key, state)
    restoredNetwork.set(key, network)
    if (debugEnabled) console.log(`[AuthWorker] Loaded cached ${key}`)

    if (announce) {
      broadcastToSubscribers(key, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'CACHE_HIT',
        payload: { dataKey: key, data: state.data, state, fromCache: true },
      })
    }
  }
}

// Per-request hard abort for the anonymous agent's transport (see usage below).
const abortingFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

async function createAnonymousAgent(): Promise<void> {
  // Capture network settings at creation time to avoid race with SET_NETWORK
  const host = getHost()
  const fetchRootKey = shouldFetchRootKey()
  debugLog(`Creating anonymous agent... host=${host}, fetchRootKey=${fetchRootKey}`)
  try {
    // HttpAgent.create directly (not @dfinity/utils createAgent, which drops
    // unknown options like `fetch` instead of forwarding them).
    anonymousAgent = await HttpAgent.create({
      identity: getFrontendIdentity(),
      host,
      shouldFetchRootKey: fetchRootKey,
      // Public read-only data (vault/prices/treasury). Skipping per-query
      // signature verification removes a subnet-key read_state round-trip +
      // BLS verify on the first query (~200ms saved, measured) with no risk for
      // display-only data. Authenticated agent keeps verification on.
      verifyQuerySignatures: false,
      // Transport-level abort at 12s per HTTP request: the app's 8s key
      // timeout only rejects the promise, so retries after sleep or a network
      // switch could queue behind the same wedged HTTP/2 connection for tens
      // of seconds. Aborting frees the socket so the retry opens a fresh one.
      fetch: abortingFetch,
    })
    debugLog('Anonymous agent created successfully')
  } catch (error) {
    debugLog(`ERROR creating anonymous agent: ${error}`)
    throw error
  }
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
    const principal = currentIdentity.getPrincipal().toText()
    currentPrincipal = principal
    isAuthenticated = true

    authenticatedAgent = await createAgent({
      identity: currentIdentity,
      host: getHost(),
      fetchRootKey: shouldFetchRootKey(),
    })

    if (debugEnabled) console.log('[AuthWorker] Identity set, agent created')

    // Immediately deliver cached user data, but only this principal's: data
    // held in memory for another principal is dropped, and the IndexedDB copy
    // is used only when it was written for this same principal.
    for (const key of USER_KEYS) {
      const state = dataStates.get(key)
      if (state?.data && userKeyOwner.get(key) === principal) {
        if (debugEnabled) console.log(`[AuthWorker] Delivering cached ${key} after authentication`)
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
        continue
      }
      dataStates.set(key, createInitialState())
      userKeyOwner.delete(key)
      forgetDelivered([key])
      void restoreOwnedUserKey(key, principal)
    }

    // Queue user data fetch for background refresh
    queue.enqueue('userAllocation', 'critical')

    // If admin and on admin route, queue admin data
    if (isAdmin && currentRoute.startsWith('/admin')) {
      for (const key of ADMIN_KEYS) {
        queue.enqueue(key, 'high')
      }
    }
  } catch (error) {
    console.error('[AuthWorker] Error setting identity:', error)
    isAuthenticated = false
    currentIdentity = null
    currentPrincipal = null
    authenticatedAgent = null
  }
}

/**
 * Load a user key's IndexedDB copy for `principal` and push it to subscribers,
 * if the entry was written for that principal on the current network.
 */
async function restoreOwnedUserKey(key: DataKey, principal: string): Promise<void> {
  const entry = (await getCachedMany([key])).get(key)
  if (!entry || entry.owner !== principal) return
  if (entry.network && entry.network !== currentNetwork) return
  if (currentPrincipal !== principal) return // signed out or switched meanwhile
  const current = dataStates.get(key)
  if (current?.data && (current.lastUpdated ?? 0) >= (entry.lastUpdated ?? 0)) return

  const state: DataState = {
    data: entry.data,
    lastUpdated: entry.lastUpdated,
    loading: false,
    error: null,
    stale: isStale(key, entry.lastUpdated),
  }
  dataStates.set(key, state)
  userKeyOwner.set(key, principal)
  broadcastToSubscribers(key, {
    id: generateMessageId(),
    timestamp: Date.now(),
    type: 'CACHE_HIT',
    payload: { dataKey: key, data: state.data, state, fromCache: true },
  })
}

function clearIdentity(): void {
  currentIdentity = null
  currentPrincipal = null
  authenticatedAgent = null
  isAuthenticated = false
  isAdmin = false

  // Signed-out tabs must not keep receiving the last user's data: drop it from
  // memory. The IndexedDB copy stays, tagged with its owner, for that user's
  // next sign-in.
  for (const key of USER_KEYS) {
    dataStates.set(key, createInitialState())
    userKeyOwner.delete(key)
  }
  forgetDelivered(USER_KEYS)

  // Mark the rest stale so it refreshes
  for (const key of HANDLED_KEYS) {
    const state = dataStates.get(key)
    if (state) {
      dataStates.set(key, { ...state, stale: true })
    }
  }

  // Clear queue
  queue.clear()

  if (debugEnabled) console.log('[AuthWorker] Identity cleared')
}

// ============================================================================
// Connection Handling
// ============================================================================

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0]
  connectedPorts.add(port)

  if (debugEnabled) console.log(`[AuthWorker] Port connected. Total: ${connectedPorts.size}`)

  // Don't reset state here - INITIAL_LOAD message will handle that with route context

  port.onmessage = (e: MessageEvent<WorkerRequest>) => {
    if (debugEnabled) console.log(`[AuthWorker] Message received: ${e.data?.type}, dataKey=${e.data?.payload?.dataKey}`)
    handleMessage(port, e.data)
  }

  port.onmessageerror = () => {
    disconnectPort(port)
  }

  // A closed or reloaded tab's route is dropped on PAGE_HIDDEN (posting to its
  // port fails silently, so nothing else notices). Where the browser fires the
  // MessagePort close event (Chromium 147 does not), a tab that ended without
  // pagehide (crash, discard) is dropped as well.
  port.addEventListener('close', () => disconnectPort(port))

  port.start()

  // Send connected message only - don't send all cached data automatically
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

  if (!isInitialized) {
    if (debugEnabled) console.log(`[AuthWorker] Port connected before init - waiting for INITIAL_LOAD`)
  }
}

function disconnectPort(port: MessagePort): void {
  connectedPorts.delete(port)
  portRoutes.delete(port)
  for (const subscribers of subscriptions.values()) {
    subscribers.delete(port)
  }
  if (debugEnabled) console.log(`[AuthWorker] Port disconnected. Total: ${connectedPorts.size}`)
}

// ============================================================================
// Message Handling
// ============================================================================

function handleMessage(port: MessagePort, message: WorkerRequest): void {
  if (debugEnabled) console.log(`[AuthWorker] handleMessage: ${message.type}`)
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

    case 'SET_ROUTE': {
      const newRoute = message.payload.route || '/'
      // Runs for SAME-route sends too: the bridge re-sends SET_ROUTE as a
      // resume kick when the tab becomes visible again, and this body is
      // idempotent (cache replay + stale-only enqueue with backoff reset).
      currentRoute = newRoute
      portRoutes.set(port, newRoute)
      {
        // Proactively serve cache + prioritize fetches for the route
        const routeKeys = getInitialLoadKeys(newRoute)
        for (const key of routeKeys) {
          if (!HANDLED_KEYS.includes(key)) continue
          const state = dataStates.get(key)
          // Broadcast cached data immediately to subscribers
          if (state?.data) {
            broadcastToSubscribers(key, {
              id: generateMessageId(),
              timestamp: Date.now(),
              type: 'CACHE_HIT',
              payload: { dataKey: key, data: state.data, state, fromCache: true },
            })
          }
          // Enqueue stale/missing data as critical priority. PUBLIC_ADMIN keys
          // are public but only wanted on /admin routes; the old
          // `!requiresAuth || ...` form short-circuited before the route check
          // and fetched all 12 of them anywhere.
          const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
          const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
            ? currentRoute.startsWith('/admin')
            : (!requiresAuth || isAuthenticated)
          if (canFetch && (!state?.data || isStale(key, state.lastUpdated))) {
            // User explicitly navigated here — clear any leftover backoff so the
            // fetch fires immediately instead of honoring a stale (≤8s) window.
            backoff.reset(key)
            queue.enqueue(key, 'critical')
          }
        }
      }
      break
    }

    case 'FETCH':
      handleFetch(port, message)
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

    case 'SET_DEBUG':
      debugEnabled = !!(message.payload as { enabled?: boolean } | undefined)?.enabled
      console.log(`[AuthWorker] Debug ${debugEnabled ? 'enabled' : 'disabled'}`)
      break

    case 'PAGE_HIDDEN':
      // The tab closed, reloaded or went into the back-forward cache: its route
      // no longer counts. After a restore the bridge sends SET_ROUTE again.
      portRoutes.delete(port)
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

    case 'RESET':
      // Reset all state that could block fetches after fast page refresh
      if (debugEnabled) console.log('[AuthWorker] RESET received - clearing backoff, queue, fetch count, and re-sending cache')
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
  currentRoute = route
  portRoutes.set(port, route)
  debugLog(`handleInitialLoad called for route: ${route}, isInitialized=${isInitialized}`)

  // If not initialized yet, queue this for processing after init completes
  if (!isInitialized) {
    if (debugEnabled) console.log(`[AuthWorker] Not initialized, queuing INITIAL_LOAD for route: ${route}`)
    pendingInitialLoad = { port, message }
    return
  }

  // Reset state for fresh page load. Only the backoff: fetches already in
  // flight stay marked as processing and counted, otherwise the queue starts the
  // same keys a second time (every vault query ran twice on a cold load).
  backoff.resetAll()
  deferredLoadTriggered = false
  pendingPriorityKeys.clear()

  // Get priority keys for this route
  const priorityKeys = getInitialLoadKeys(route)
  initialLoadKeys = new Set(priorityKeys.filter(key => HANDLED_KEYS.includes(key)))

  // Add userAllocation if authenticated (commonly needed)
  if (isAuthenticated && !initialLoadKeys.has('userAllocation')) {
    initialLoadKeys.add('userAllocation')
  }

  debugLog(`Priority keys for route: ${Array.from(initialLoadKeys).join(', ') || 'none'}`)

  // Send cached data ONLY for priority keys immediately
  if (debugEnabled) console.log(`[AuthWorker] Sending cached data for ${initialLoadKeys.size} priority keys`)
  for (const key of initialLoadKeys) {
    const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
    // Skip auth-required keys if not authenticated AND no cached data
    if (requiresAuth && !isAuthenticated) {
      const state = dataStates.get(key)
      if (!state?.data) {
        if (debugEnabled) console.log(`[AuthWorker] Skipping ${key} - requires auth, no cached data`)
        continue
      }
    }

    const state = dataStates.get(key)
    if (state?.data) {
      if (debugEnabled) console.log(`[AuthWorker] Sending CACHE_HIT for ${key} (hasData=true)`)
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
    } else {
      if (debugEnabled) console.log(`[AuthWorker] No cached data for ${key}`)
    }
    // Queue fetch for stale priority data and track it
    if (!state?.data || isStale(key, state.lastUpdated)) {
      // PUBLIC_ADMIN keys (e.g. voterDetails = admin_getUserAllocations) are only
      // consumed on /admin pages; don't fetch them on other routes (they'd 8s-time-out
      // for anon users on every route via the all-keys subscription barrage).
      // Admin data is public but only wanted on /admin routes; the old
      // `!requiresAuth || ...` form short-circuited before the route check
      // (PUBLIC_ADMIN keys never require auth), fetching all 12 keys anywhere.
      const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
        ? currentRoute.startsWith('/admin')
        : (!requiresAuth || isAuthenticated)
      if (canFetch) {
        if (debugEnabled) console.log(`[AuthWorker] Queuing fetch for ${key} (stale/missing, canFetch=true)`)
        pendingPriorityKeys.add(key)
        queue.enqueue(key, 'critical')
      } else {
        if (debugEnabled) console.log(`[AuthWorker] Cannot fetch ${key} - requires auth, isAuth=${isAuthenticated}`)
      }
    }
  }

  debugLog(`After handleInitialLoad: pendingPriorityKeys=${pendingPriorityKeys.size}, queueSize=${queue.size}`)

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
  if (debugEnabled) console.log(`[AuthWorker] Priority key loaded: ${dataKey}, remaining: ${pendingPriorityKeys.size}`)

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

  if (debugEnabled) console.log('[AuthWorker] All priority keys loaded - starting deferred load for non-priority keys')

  // Send cached data and queue fetches for remaining keys
  const routeKeys = openRouteKeys()
  for (const key of HANDLED_KEYS) {
    if (initialLoadKeys.has(key)) continue // Already handled
    if (key === 'nachosVaultAnalytics' && !analyticsWanted(routeKeys)) continue

    const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
    if (requiresAuth && !isAuthenticated) continue

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
      // PUBLIC_ADMIN keys (e.g. voterDetails = admin_getUserAllocations) are only
      // consumed on /admin pages; don't fetch them on other routes (they'd 8s-time-out
      // for anon users on every route via the all-keys subscription barrage).
      // Admin data is public but only wanted on /admin routes; the old
      // `!requiresAuth || ...` form short-circuited before the route check
      // (PUBLIC_ADMIN keys never require auth), fetching all 12 keys anywhere.
      const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
        ? currentRoute.startsWith('/admin')
        : (!requiresAuth || isAuthenticated)
      if (canFetch) {
        queue.enqueue(key, 'low')
      }
    }
  }
}

function handleSetAdmin(message: WorkerRequest): void {
  const wasAdmin = isAdmin
  isAdmin = message.payload.isAdmin || false

  if (debugEnabled) console.log(`[AuthWorker] Admin status: ${isAdmin}`)

  // If newly admin, authenticated, and on admin route, queue admin data
  if (isAdmin && !wasAdmin && isAuthenticated && currentRoute.startsWith('/admin')) {
    for (const key of ADMIN_KEYS) {
      queue.enqueue(key, 'high')
    }
  }
}

function handleFetch(port: MessagePort, message: WorkerRequest): void {
  const { dataKey, priority = 'medium', force = false } = message.payload
  if (!dataKey || !HANDLED_KEYS.includes(dataKey)) {
    if (debugEnabled) console.log(`[AuthWorker] FETCH ignored - dataKey=${dataKey} not in HANDLED_KEYS`)
    return
  }
  if (debugEnabled) console.log(`[AuthWorker] FETCH request: ${dataKey}, force=${force}, isAuth=${isAuthenticated}, hasAnon=${!!anonymousAgent}`)

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
    if (debugEnabled) console.log(`[AuthWorker] Queuing ${dataKey} for fetch (force=${force}, hasData=${!!currentState?.data}, queueSize=${queue.size})`)
    // force: a fetch of this key already running may predate the request (a
    // refresh after a mint), so the queue runs it once more when it ends
    queue.enqueue(dataKey, priority, force)
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
  debugLog(`handleSubscribe: keys=${keysToSubscribe.join(',')}, valid=${validKeys.join(',')}, isInit=${isInitialized}`)

  // Add to subscriptions immediately - ensure Set exists first
  for (const key of validKeys) {
    if (!subscriptions.has(key)) {
      subscriptions.set(key, new Set())
    }
    subscriptions.get(key)!.add(port)
  }

  // If not yet initialized, queue this port for cache delivery when init completes
  if (!isInitialized) {
    if (debugEnabled) console.log(`[AuthWorker] Not yet initialized, queuing cache delivery for ${validKeys.length} keys`)
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
    // PUBLIC_ADMIN_KEYS are anonymous but only wanted on /admin routes; the
    // old unconditional form made every cold boot fetch-and-retry all 12 of
    // them on any route (each 8s-timing-out for anon users).
    const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
    const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
      ? currentRoute.startsWith('/admin')
      : (!requiresAuth || isAuthenticated)

    if (canFetch && (!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
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
      if (isAuthenticated && (USER_KEYS.includes(key) || (ADMIN_KEYS.includes(key) && isAdmin))) {
        queue.enqueue(key, 'critical')
      }
    }
  }
}

async function handleSetNetwork(message: WorkerRequest): Promise<void> {
  const { network } = message.payload
  const newNetwork = network || 'ic' // Default to 'ic' if not specified

  // Every tab sends SET_NETWORK when it connects and again from
  // initNetworkConfig. Same network with an agent ready (or being built):
  // nothing to redo, and rebuilding it mid-boot only threw away a warm agent.
  if (newNetwork === currentNetwork && (anonymousAgent || creatingAnonymousAgent)) return

  // Check if this is the first SET_NETWORK or if network actually changed
  const isFirstSetup = currentNetwork === null
  const networkChanged = currentNetwork !== null && currentNetwork !== newNetwork

  debugLog(`SET_NETWORK: ${newNetwork} (current: ${currentNetwork}, isFirst: ${isFirstSetup}, changed: ${networkChanged})`)

  // Update tracked network
  currentNetwork = newNetwork
  setWorkerNetworkOverride(network || null)
  setCacheNetwork(newNetwork)
  if (networkChanged) networkEpoch++

  // Restored entries written on another network are not this network's data
  for (const [key, net] of restoredNetwork) {
    if (net && net !== newNetwork) {
      dataStates.set(key, createInitialState())
      restoredNetwork.delete(key)
    }
  }

  // Create/recreate anonymous agent with correct network settings
  creatingAnonymousAgent = true
  try {
    await createAnonymousAgent()
    debugLog(`Agent ready after SET_NETWORK: anonymousAgent=${!!anonymousAgent}`)
  } catch (err) {
    debugLog(`Failed to create agent after SET_NETWORK: ${err}`)
  } finally {
    creatingAnonymousAgent = false
  }

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
      debugLog('Cleared IndexedDB cache due to network change')
    } catch (err) {
      console.error('[AuthWorker] Error clearing cache:', err)
    }

    // Clear in-memory state and queue for refetch
    userKeyOwner.clear()
    restoredNetwork.clear()
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      // Queue ADMIN_KEYS only when on admin route
      if (ADMIN_KEYS.includes(key) && currentRoute.startsWith('/admin')) {
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
// Queue Processing (Parallel)
// ============================================================================

// Maximum concurrent fetches - higher priority items are dequeued first.
// 8 keeps route-critical keys from queuing behind the boot preload barrage / 41
// admin keys; the IC boundary nodes multiplex over HTTP/2 so this is safe.
const MAX_CONCURRENT_FETCHES = 8
let activeFetchCount = 0

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true
  debugLog('processQueue started')

  while (true) {
    // If no agent available yet, wait before trying to process
    // This prevents spinning the CPU waiting for SET_NETWORK
    if (!anonymousAgent && !authenticatedAgent) {
      await sleep(100)
      continue
    }

    // Start new fetches up to the limit (priority queue returns highest priority first).
    // A backoff-blocked key must NOT stall the rest of the queue: we skip it and
    // move on to other fetchable keys. The skip works by leaving the item marked
    // as processing (dequeue() returns the first item NOT processing), so the next
    // dequeue() returns a DIFFERENT item instead of the same blocked one — that's
    // why we can't just call queue.retry()+continue here (retry() clears the
    // processing flag, so dequeue() would return it again and busy-spin). Blocked
    // keys are released after the pass so the next pass re-evaluates them.
    const blockedThisPass: DataKey[] = []
    const heldThisPass: DataKey[] = []
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      // Get next highest-priority item (queue.dequeue handles deduplication internally)
      const item = queue.dequeue()

      if (!item) {
        break
      }

      debugLog(`Dequeued ${item.dataKey}, activeFetches=${activeFetchCount}`)

      // USER_KEYS and AUTH_REQUIRED_KEYS require authentication
      // Skip for now - will be fetched when user authenticates
      const requiresAuth = USER_KEYS.includes(item.dataKey) || AUTH_REQUIRED_KEYS.includes(item.dataKey)
      if (requiresAuth && (!isAuthenticated || !authenticatedAgent)) {
        if (debugEnabled) console.log(`[AuthWorker] Skipping ${item.dataKey} - requires auth but not authenticated`)
        queue.complete(item.dataKey)
        continue
      }

      // Heavy keys wait for their IndexedDB copy and for the route's own keys
      // (see openHeavyFetches and routeKeysLoading)
      if (HEAVY_CACHE_KEYS.includes(item.dataKey) && (!heavyCacheRead || routeKeysLoading(item.dataKey))) {
        heldThisPass.push(item.dataKey)
        continue
      }

      // Double-check agent is still available (shouldn't happen but safety check)
      if (!anonymousAgent && !authenticatedAgent) {
        queue.retry(item.dataKey)
        break // Exit inner loop to wait for agent
      }

      if (!backoff.canRetry(item.dataKey)) {
        // Backoff window not yet elapsed. Leave it marked processing (so the next
        // dequeue() skips it) and keep servicing other keys — one slow/failing key
        // no longer blocks the whole queue. Released after the pass below.
        blockedThisPass.push(item.dataKey)
        continue
      }

      // Start fetch in parallel (don't await) - critical/high priority items start first
      activeFetchCount++
      processSingleFetch(item).finally(() => {
        // Clamp: a concurrent INITIAL_LOAD (new tab) zeroes the counter while
        // fetches are in flight; going negative would over-admit fetches.
        activeFetchCount = Math.max(0, activeFetchCount - 1)
      })
    }

    // Release backoff-blocked items so the next pass re-checks them once their
    // delay elapses (retry() clears the processing flag + re-sorts the queue).
    for (const key of blockedThisPass) queue.retry(key)
    for (const key of heldThisPass) queue.release(key)

    // Adaptive sleep: longer when idle (no active fetches and empty queue), shorter
    // when processing. When the only thing left is backoff-blocked keys (nothing in
    // flight), poll a little slower than the active 50ms — we're just waiting on timers.
    const isIdle = activeFetchCount === 0 && queue.isEmpty()
    const onlyBlocked = activeFetchCount === 0 && blockedThisPass.length > 0
    await sleep(isIdle ? 500 : onlyBlocked ? 250 : 50)
  }
}

// Per-key fetch timeout. A hung IC query/connection (browser fetch has no default
// timeout) must fail fast so the KEEP_TRYING/backoff machinery can retry on a fresh
// connection, instead of leaving the page stuck for tens of seconds.
const DEFAULT_FETCH_TIMEOUT_MS = 8_000
const FETCH_TIMEOUT_MS: Partial<Record<DataKey, number>> = {
  cryptoPrices: 20_000, // sequential multi-API fallback chain needs more headroom
}
function withFetchTimeout<T>(dataKey: DataKey, p: Promise<T>): Promise<T> {
  const ms = FETCH_TIMEOUT_MS[dataKey] ?? DEFAULT_FETCH_TIMEOUT_MS
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`fetch timeout after ${ms}ms: ${dataKey}`)), ms)
    p.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

async function processSingleFetch(item: { dataKey: DataKey; retryCount: number }): Promise<void> {
  const startedAt = performance.now()
  try {
    backoff.recordAttempt(item.dataKey)
    await withFetchTimeout(item.dataKey, fetchData(item.dataKey))
    backoff.recordSuccess(item.dataKey)
    queue.complete(item.dataKey)
    if (debugEnabled) {
      try {
        const ms = (performance.now() - startedAt).toFixed(0)
        const d = dataStates.get(item.dataKey)?.data
        const bytes = d != null ? JSON.stringify(d, (_k, v) => typeof v === 'bigint' ? v.toString() : v).length : 0
        debugLog(`fetch OK ${item.dataKey} in ${ms}ms (~${bytes}B)`)
      } catch { /* telemetry must never break the fetch path */ }
    }

    // If first successful admin call, we're confirmed admin
    if (ADMIN_KEYS.includes(item.dataKey) && !isAdmin) {
      isAdmin = true
      if (debugEnabled) console.log('[AuthWorker] Admin confirmed by successful call')
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
      if (debugEnabled) console.log(`[AuthWorker] Access denied for ${item.dataKey} - skipping`)
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

    // Most keys give up after 5 retries; user-facing vault data keeps retrying
    // forever (paced by `backoff.canRetry`) so a transient canister outage can't
    // leave /vault permanently stuck on "Loading dashboard data…". Analytics
    // only while a tab shows them; the vault route restarts them on arrival.
    const keepTrying = KEEP_TRYING.includes(item.dataKey) &&
      (item.dataKey !== 'nachosVaultAnalytics' || analyticsWanted(openRouteKeys()))
    if (item.retryCount < 5 || keepTrying) {
      queue.retry(item.dataKey)
    } else {
      queue.complete(item.dataKey)
    }
  }
}

// Keys we never permanently give up on — these power user-facing pages where a
// stuck null state is much worse than continuous exponential-backoff retries.
const KEEP_TRYING: DataKey[] = [
  'nachosVaultDashboard',
  'nachosConfig',
  'nachosNavHistory',
  'nachosVaultAnalytics',
  'cryptoPrices',
]

// ============================================================================
// Composite Query Coalescing (from merged public worker)
// ============================================================================
let lastVoteDashboardResult: { data: any; timestamp: number } | null = null
let lastLeaderboardResult: { data: any; timestamp: number } | null = null
let lastEnhancedTreasuryResult: { data: any; timestamp: number } | null = null
const COALESCE_MS = 5_000
const TREASURY_COALESCE_MS = 5_000

async function getVoteDashboardCoalesced(agentRef: HttpAgent): Promise<any | null> {
  if (lastVoteDashboardResult && (Date.now() - lastVoteDashboardResult.timestamp) < COALESCE_MS) {
    return lastVoteDashboardResult.data
  }
  try {
    // Public data - no principal needed for anonymous queries
    const data = await fetchVoteDashboardData(agentRef)
    lastVoteDashboardResult = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.warn('[AuthWorker] getVoteDashboard composite failed, falling back to individual calls:', err)
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
    console.warn('[AuthWorker] getAllLeaderboards composite failed, falling back to individual calls:', err)
    lastLeaderboardResult = { data: null, timestamp: Date.now() }
    return null
  }
}

// ============================================================================
// Enhanced Treasury Dashboard Coalescing
// ============================================================================

async function getEnhancedTreasuryDashboardCoalesced(agentRef: HttpAgent): Promise<any | null> {
  if (lastEnhancedTreasuryResult && (Date.now() - lastEnhancedTreasuryResult.timestamp) < TREASURY_COALESCE_MS) {
    return lastEnhancedTreasuryResult.data
  }
  try {
    const data = await fetchEnhancedTreasuryDashboardData(agentRef)
    lastEnhancedTreasuryResult = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.warn('[AuthWorker] getEnhancedTreasuryDashboard composite failed, falling back to individual calls:', err)
    lastEnhancedTreasuryResult = { data: null, timestamp: Date.now() }
    return null
  }
}

/**
 * Populate sibling data keys from EnhancedTreasuryDashboard in the authenticated worker.
 * Covers rebalanceConfig and tradingPauses.
 */
async function populateEnhancedTreasurySiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  const now = Date.now()
  const freshState: Partial<DataState> = { lastUpdated: now, loading: false, error: null, stale: false }

  if (excludeKey !== 'rebalanceConfig') {
    const rc = serializeForTransfer(dashboard.systemParameters)
    updateState('rebalanceConfig', { data: rc, ...freshState })
    await setCached('rebalanceConfig', rc)
  }

  if (excludeKey !== 'tradingPauses') {
    const tp = serializeForTransfer(dashboard.tradingPauses)
    updateState('tradingPauses', { data: tp, ...freshState })
    await setCached('tradingPauses', tp)
  }
}

/**
 * Map worker data key to backend getAllLeaderboards key
 * Example: 'leaderboardAllTimeUSD' -> 'allTimeUSD'
 */
function mapLeaderboardKey(dataKey: DataKey): string {
  // Remove 'leaderboard' prefix and lowercase first char
  // leaderboardAllTimeUSD -> AllTimeUSD -> allTimeUSD
  const withoutPrefix = dataKey.replace('leaderboard', '')
  return withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1)
}

/**
 * Populate all 8 leaderboard data keys from getAllLeaderboards composite.
 * Reduces 8 individual fetches to 1 composite call.
 */
async function populateAllLeaderboardsSiblings(
  allBoards: any,
  excludeKey: DataKey
): Promise<void> {
  const now = Date.now()
  const freshState: Partial<DataState> = {
    lastUpdated: now,
    loading: false,
    error: null,
    stale: false
  }

  const leaderboardKeys: DataKey[] = [
    'leaderboardAllTimeUSD',
    'leaderboardAllTimeICP',
    'leaderboardOneYearUSD',
    'leaderboardOneYearICP',
    'leaderboardOneMonthUSD',
    'leaderboardOneMonthICP',
    'leaderboardOneWeekUSD',
    'leaderboardOneWeekICP'
  ]

  for (const key of leaderboardKeys) {
    if (key === excludeKey) continue // Skip the one we're already handling

    const backendKey = mapLeaderboardKey(key)
    const boardData = serializeForTransfer(allBoards[backendKey])

    updateState(key, { data: boardData, ...freshState })
    await setCached(key, boardData)
  }
}

/**
 * Populate sibling data keys from a getVoteDashboard composite response.
 * Skips the excludeKey since it's handled by the main flow after the switch.
 * Note: We only populate keys that are in HANDLED_KEYS (Category 3 optimized list).
 */
async function populateVoteDashboardSiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  const now = Date.now()
  const freshState: Partial<DataState> = { lastUpdated: now, loading: false, error: null, stale: false }

  // Only populate the primary key for vote dashboard - tokenDetails
  // Other siblings (totalTreasuryValueInUsd, aggregateAllocation, etc.) are NOT in HANDLED_KEYS
  // They can still be fetched on-demand but won't auto-refresh
  if (excludeKey !== 'tokenDetails') {
    const td = serializeForTransfer(dashboard.tokenDetails)
    updateState('tokenDetails', { data: td, ...freshState })
    await setCached('tokenDetails', td)
  }

  // timerStatus is in HANDLED_KEYS, so update it. Only on routes that show it:
  // it embeds the ~650 KB trading status, and elsewhere every vote dashboard
  // refresh pushed it to the page for nothing (a route that shows it fetches
  // it on arrival when stale). Not before the stored trading status is read
  // either: built without it, it would replace the good stored copy.
  if (excludeKey !== 'timerStatus' && heavyCacheRead && openRouteKeys().has('timerStatus')) {
    const cachedTS = dataStates.get('tradingStatus')?.data
    const ts = serializeForTransfer({
      snapshotInfo: dashboard.snapshotInfo,
      tradingStatus: cachedTS ?? null,
      tokenDetails: dashboard.tokenDetails,
    })
    updateState('timerStatus', { data: ts, ...freshState })
    await setCached('timerStatus', ts)
  }

  // aggregateAllocation — extract from dashboard and broadcast
  if (dashboard.aggregateAllocation) {
    const aa = serializeForTransfer(dashboard.aggregateAllocation)
    const aaState: DataState = { data: aa, lastUpdated: now, loading: false, error: null, stale: false }
    for (const port of connectedPorts) {
      sendResponse(port, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'DATA_UPDATE',
        payload: { dataKey: 'aggregateAllocation' as DataKey, data: aa, state: aaState, fromCache: false },
      })
    }
  }

  // tokenMaxAllocations — extract maxAllocationBasisPoints from tokenDetails entries
  if (excludeKey !== 'tokenMaxAllocations' && dashboard.tokenDetails) {
    const maxAllocations: [any, bigint][] = []
    for (const [principal, details] of dashboard.tokenDetails) {
      if (details.maxAllocationBasisPoints && details.maxAllocationBasisPoints.length > 0) {
        maxAllocations.push([principal, details.maxAllocationBasisPoints[0]])
      }
    }
    const ma = serializeForTransfer(maxAllocations)
    updateState('tokenMaxAllocations' as DataKey, { data: ma, ...freshState })
    await setCached('tokenMaxAllocations' as DataKey, ma)
  }

  // userAllocation — if present in response, broadcast to all ports
  if (dashboard.userAllocation?.length > 0) {
    const ua = serializeForTransfer(dashboard.userAllocation)
    const uaState: DataState = { data: ua, lastUpdated: now, loading: false, error: null, stale: false }
    for (const port of connectedPorts) {
      sendResponse(port, {
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'DATA_UPDATE',
        payload: { dataKey: 'userAllocation' as DataKey, data: ua, state: uaState, fromCache: false },
      })
    }
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  debugLog(`fetchData called for ${dataKey}`)
  // Choose the appropriate agent:
  // - PUBLIC_KEYS use anonymous agent (merged from public worker)
  // - USER_KEYS and AUTH_REQUIRED_KEYS require authenticated agent
  // - PUBLIC_ADMIN_KEYS can use anonymous agent (publicly readable queries)
  const isPublicKey = PUBLIC_KEYS.includes(dataKey)
  const requiresAuth = USER_KEYS.includes(dataKey) || AUTH_REQUIRED_KEYS.includes(dataKey)

  const agent = isPublicKey
    ? anonymousAgent
    : requiresAuth
      ? authenticatedAgent
      : (authenticatedAgent || anonymousAgent)

  if (!agent) {
    if (debugEnabled) console.log(`[AuthWorker] No agent for ${dataKey}, isPublic=${isPublicKey}, requiresAuth=${requiresAuth}`)
    throw new Error(requiresAuth
      ? 'No authenticated agent'
      : 'No agent available')
  }

  debugLog(`Starting network fetch for ${dataKey}`)
  updateState(dataKey, { loading: true, error: null })

  // Who and where this fetch is for; checked again when the answer lands
  const epoch = networkEpoch
  const owner = USER_KEYS.includes(dataKey) ? currentPrincipal : null

  let data: unknown

  switch (dataKey) {
    // ========== PUBLIC DATA CASES (from merged public worker) ==========
    case 'cryptoPrices':
      data = await fetchCryptoPricesData()
      break

    case 'tokenDetails': {
      const dashboard = await getVoteDashboardCoalesced(anonymousAgent!)
      if (!dashboard) {
        // Fallback to individual call
        const rawTokenData = await fetchTokenDetailsData(anonymousAgent!)
        data = serializeForTransfer(rawTokenData)
      } else {
        data = serializeForTransfer(dashboard.tokenDetails)
        await populateVoteDashboardSiblings(dashboard, 'tokenDetails')
      }
      break
    }

    case 'tokenMaxAllocations': {
      // Derived from vote dashboard — use coalesced fetch to avoid duplicate network calls
      const tmaDashboard = await getVoteDashboardCoalesced(anonymousAgent!)
      if (tmaDashboard?.tokenDetails) {
        const maxAllocations: [any, bigint][] = []
        for (const [principal, details] of tmaDashboard.tokenDetails) {
          if (details.maxAllocationBasisPoints && details.maxAllocationBasisPoints.length > 0) {
            maxAllocations.push([principal, details.maxAllocationBasisPoints[0]])
          }
        }
        data = serializeForTransfer(maxAllocations)
        await populateVoteDashboardSiblings(tmaDashboard, 'tokenMaxAllocations')
      } else {
        data = serializeForTransfer([])
      }
      break
    }

    case 'tradingStatus': {
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(anonymousAgent!)
      if (!enhancedDashboard) {
        // Fallback to individual call
        data = serializeForTransfer(await fetchTradingStatusData(anonymousAgent!))
      } else {
        data = serializeForTransfer({ ok: enhancedDashboard.tradingStatus })
        // Note: populateEnhancedTreasurySiblings is for auth keys (rebalanceConfig, tradingPauses)
        // For public keys, we don't populate siblings since they're in separate workers originally
      }
      break
    }

    case 'leaderboardAllTimeUSD':
    case 'leaderboardAllTimeICP':
    case 'leaderboardOneYearUSD':
    case 'leaderboardOneYearICP':
    case 'leaderboardOneMonthUSD':
    case 'leaderboardOneMonthICP':
    case 'leaderboardOneWeekUSD':
    case 'leaderboardOneWeekICP': {
      const allBoards = await getAllLeaderboardsCoalesced(anonymousAgent!)
      if (!allBoards) {
        // Fallback to individual call
        let timeframe: 'AllTime' | 'OneYear' | 'OneMonth' | 'OneWeek' = 'AllTime'
        if (dataKey.includes('OneYear')) timeframe = 'OneYear'
        else if (dataKey.includes('OneMonth')) timeframe = 'OneMonth'
        else if (dataKey.includes('OneWeek')) timeframe = 'OneWeek'

        const priceType = dataKey.endsWith('USD') ? 'USD' : 'ICP'
        data = serializeForTransfer(await fetchLeaderboardData(anonymousAgent!, timeframe, priceType))
      } else {
        // Map worker key to backend key and extract the correct leaderboard
        const backendKey = mapLeaderboardKey(dataKey)
        data = serializeForTransfer(allBoards[backendKey])

        // Populate all 8 sibling keys from this one composite call
        await populateAllLeaderboardsSiblings(allBoards, dataKey)
      }
      break
    }

    case 'leaderboardInfo':
      data = serializeForTransfer(await fetchLeaderboardInfoData(anonymousAgent!))
      break

    case 'tacoProposals':
      data = serializeForTransfer(await fetchTacoProposalsData(anonymousAgent!))
      break

    case 'proposalsThreads':
      data = serializeForTransfer(await fetchProposalsThreadsData(anonymousAgent!))
      break

    case 'allNames':
      data = serializeForTransfer(await fetchAllNamesData(anonymousAgent!))
      break

    case 'neuronSnapshotStatus':
      data = serializeForTransfer(await fetchNeuronSnapshotStatusData(anonymousAgent!))
      break

    case 'timerStatus': {
      // timerStatus combines snapshotInfo + tradingStatus + tokenDetails
      const dashboard = await getVoteDashboardCoalesced(anonymousAgent!)
      if (!dashboard) {
        // Fallback: fetch snapshotInfo individually
        const snapshotInfo = await fetchSnapshotInfoData(anonymousAgent!)
        const cachedTS = dataStates.get('tradingStatus')?.data
        const cachedTD = dataStates.get('tokenDetails')?.data
        data = serializeForTransfer({
          snapshotInfo,
          tradingStatus: cachedTS ?? null,
          tokenDetails: cachedTD ?? null,
        })
      } else {
        const cachedTS = dataStates.get('tradingStatus')?.data
        data = serializeForTransfer({
          snapshotInfo: dashboard.snapshotInfo,
          tradingStatus: cachedTS ?? null,
          tokenDetails: dashboard.tokenDetails,
        })
        await populateVoteDashboardSiblings(dashboard, 'timerStatus')
      }
      break
    }

    // ========== NACHOS VAULT CASES (public queries) ==========
    case 'nachosVaultDashboard':
      data = serializeForTransfer(await fetchNachosVaultDashboard(anonymousAgent!))
      break

    case 'nachosConfig':
      data = serializeForTransfer(await fetchNachosConfig(anonymousAgent!))
      break

    case 'nachosNavHistory':
      data = serializeForTransfer(await fetchNachosNavHistory(anonymousAgent!))
      break

    case 'nachosVaultAnalytics':
      data = serializeForTransfer(await fetchNachosVaultAnalytics(anonymousAgent!))
      break

    // ========== USER/AUTH DATA CASES (existing) ==========
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

    case 'penalizedNeurons':
      data = serializeForTransfer(await fetchPenalizedNeuronsData(agent))
      break

    case 'rebalanceConfig': {
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(agent)
      if (enhancedDashboard) {
        data = serializeForTransfer(enhancedDashboard.systemParameters)
        await populateEnhancedTreasurySiblings(enhancedDashboard, 'rebalanceConfig')
      } else {
        data = serializeForTransfer(await fetchRebalanceConfigData(agent))
      }
      break
    }

    case 'systemParameters':
      data = serializeForTransfer(await fetchSystemParametersData(agent))
      break

    // Treasury/Trading admin data
    case 'priceAlerts':
      data = serializeForTransfer(await fetchPriceAlertsData(agent))
      break

    case 'tradingPauses': {
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(agent)
      if (enhancedDashboard) {
        data = serializeForTransfer(enhancedDashboard.tradingPauses)
        await populateEnhancedTreasurySiblings(enhancedDashboard, 'tradingPauses')
      } else {
        data = serializeForTransfer(await fetchTradingPausesData(agent))
      }
      break
    }

    case 'circuitBreakerLogs':
      data = serializeForTransfer(await fetchCircuitBreakerLogsData(agent))
      break

    case 'circuitBreakerConditions':
      data = serializeForTransfer(await fetchCircuitBreakerConditionsData(agent))
      break

    case 'portfolioCircuitBreakerConditions':
      data = serializeForTransfer(await fetchPortfolioCircuitBreakerConditionsData(agent))
      break

    // Neuron Snapshots admin data
    case 'neuronSnapshots':
      data = serializeForTransfer(await fetchNeuronSnapshotsData(agent))
      break

    case 'maxNeuronSnapshots':
      data = serializeForTransfer(await fetchMaxNeuronSnapshotsData(agent))
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

    case 'userPerformance':
      // userPerformance requires the authenticated user's principal
      if (!currentIdentity) {
        throw new Error('No identity available for userPerformance')
      }
      const userPrincipal = currentIdentity.getPrincipal()
      data = serializeForTransfer(await fetchUserPerformanceData(authenticatedAgent!, userPrincipal))
      break

    case 'swapDashboard':
      data = serializeForTransfer(await fetchSwapDashboardData(authenticatedAgent!))
      break

    default:
      throw new Error(`Unknown dataKey: ${dataKey}`)
  }

  // The network or the signed-in user changed while this was in flight: the
  // answer belongs to the old one, so it is neither shown nor cached.
  if (epoch !== networkEpoch || (owner !== null && owner !== currentPrincipal)) {
    debugLog(`Dropping ${dataKey}: network or user changed during the fetch`)
    updateState(dataKey, { loading: false })
    onPriorityKeyLoaded(dataKey)
    return
  }

  debugLog(`Fetch completed for ${dataKey}, updating state`)
  updateState(dataKey, {
    data,
    lastUpdated: Date.now(),
    loading: false,
    error: null,
    stale: false,
  })
  if (owner) userKeyOwner.set(dataKey, owner)

  await setCached(dataKey, data, owner ?? undefined)
  if (debugEnabled) console.log(`[AuthWorker] Cached ${dataKey} to IndexedDB`)

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

  // Only new data carries the payload. Loading and error updates used to
  // re-send the whole cached payload as well, so every fetch start and every
  // failed retry made each tab decode and re-render data it already had.
  const hasNewData = 'data' in partial
  const type: WorkerResponseType | null = hasNewData
    ? 'DATA_UPDATE'
    : partial.error ? 'FETCH_ERROR' : partial.loading ? 'FETCH_STARTED' : null
  if (!type) return

  const response: WorkerResponse = {
    id: generateMessageId(),
    timestamp: Date.now(),
    type,
    payload: {
      dataKey,
      data: hasNewData ? updated.data : undefined,
      error: partial.error || undefined,
      state: hasNewData ? updated : { ...updated, data: null },
      fromCache: false,
    },
  }

  broadcastToSubscribers(dataKey, response)
}

function broadcastToSubscribers(dataKey: DataKey, response: WorkerResponse): void {
  const subscribers = subscriptions.get(dataKey)
  debugLog(`broadcastToSubscribers for ${dataKey}, subscribers=${subscribers?.size || 0}, type=${response.type}`)
  if (!subscribers || subscribers.size === 0) {
    debugLog(`No subscribers for ${dataKey}!`)
    return
  }

  for (const port of subscribers) {
    sendResponse(port, response)
  }
}

// Tabs drop their copy of user data when the user signs out or switches (see
// the bridge), so a later replay of the same payload must not be skipped as
// "already held"
function forgetDelivered(keys: DataKey[]): void {
  for (const port of connectedPorts) {
    const held = deliveredTo.get(port)
    if (held) for (const key of keys) held.delete(key)
  }
}

function sendResponse(port: MessagePort, response: WorkerResponse): void {
  // Subscribe, INITIAL_LOAD, route changes and resume kicks all replay the
  // cache, which delivered every key to the same tab three or more times per
  // load (each one a structured clone plus a decode on the page). Remember
  // what each tab holds and skip a CACHE_HIT that would resend it.
  const { dataKey, state } = response.payload
  const at = state?.lastUpdated
  if (dataKey && at && state?.data != null &&
      (response.type === 'CACHE_HIT' || response.type === 'DATA_UPDATE')) {
    let held = deliveredTo.get(port)
    if (!held) {
      held = new Map()
      deliveredTo.set(port, held)
    }
    if (response.type === 'CACHE_HIT' && held.get(dataKey) === at) return
    held.set(dataKey, at)
  }

  try {
    port.postMessage(response)
  } catch {
    disconnectPort(port)
  }
}

// Forward debug logs to all connected ports so they appear in main thread console
function debugLog(message: string): void {
  if (!debugEnabled) return // Skip if debug mode is disabled

  const fullMessage = `[AuthWorker] ${message}`
  console.log(fullMessage) // Also log to worker console
  for (const port of connectedPorts) {
    try {
      port.postMessage({
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'DEBUG_LOG',
        payload: {
          dataKey: 'systemLogs' as DataKey,
          state: createInitialState(),
          fromCache: false,
          debugMessage: message,
        },
      })
    } catch (e) {
      // Silently fail - port may be disconnected
    }
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
    if (debugEnabled) console.log('[AuthWorker] Entering idle mode - pausing refreshes')
  } else if (!isIdle && wasIdle) {
    if (debugEnabled) console.log('[AuthWorker] Exiting idle mode - resuming refreshes')
  }
}

function recordActivity(): void {
  lastActivityTime = Date.now()
  if (isIdle) {
    isIdle = false
    if (debugEnabled) console.log('[AuthWorker] Activity detected - resuming refreshes')
  }
}

// ============================================================================
// Auto-refresh Loop
// ============================================================================

async function autoRefreshLoop(): Promise<void> {
  let publicRefreshCounter = 0
  let authRefreshCounter = 0

  while (true) {
    await sleep(5000) // Check every 5 seconds (base interval)

    // Check if we should enter idle mode
    checkIdleStatus()

    // Skip auto-refresh if idle
    if (isIdle) {
      continue
    }

    publicRefreshCounter++
    authRefreshCounter++

    // PUBLIC KEYS: refresh every 5 seconds (counter % 1 == 0)
    if (publicRefreshCounter >= 1) {
      const routeKeys = openRouteKeys()
      for (const dataKey of PUBLIC_KEYS) {
        // The two treasury payloads refresh only on routes that show them (the
        // route change refreshes them on arrival). Elsewhere every 30 s refresh
        // sent ~1.3 MB to the page that nothing on it used.
        if (HEAVY_CACHE_KEYS.includes(dataKey) && !routeKeys.has(dataKey)) continue
        if (dataKey === 'nachosVaultAnalytics' && !analyticsWanted(routeKeys)) continue
        const state = dataStates.get(dataKey)
        if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
          queue.enqueue(dataKey, 'medium')
        }
      }
      publicRefreshCounter = 0
    }

    // AUTH/ADMIN KEYS: refresh every 15 seconds (counter % 3 == 0, since 15s / 5s = 3)
    if (authRefreshCounter >= 3) {
      // Refresh admin keys only when on /admin routes
      if (currentRoute.startsWith('/admin')) {
        for (const dataKey of PUBLIC_ADMIN_KEYS) {
          const state = dataStates.get(dataKey)
          if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
            queue.enqueue(dataKey, 'low')
          }
        }

        // Refresh auth-required admin data if admin
        if (isAdmin && isAuthenticated) {
          for (const dataKey of AUTH_REQUIRED_KEYS) {
            const state = dataStates.get(dataKey)
            if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
              queue.enqueue(dataKey, 'low')
            }
          }
        }
      }

      // Refresh user data only if authenticated
      if (isAuthenticated) {
        for (const dataKey of USER_KEYS) {
          const state = dataStates.get(dataKey)
          if (state && isStale(dataKey, state.lastUpdated) && !queue.has(dataKey)) {
            queue.enqueue(dataKey, 'medium')
          }
        }
      }

      authRefreshCounter = 0
    }
  }
}

// ============================================================================
// Start Worker
// ============================================================================

init().then(() => {
  autoRefreshLoop()
})
