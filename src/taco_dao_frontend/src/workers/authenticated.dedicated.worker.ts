/**
 * Authenticated Data Dedicated Worker (Fallback for SharedWorker)
 *
 * This is a dedicated worker version for browsers that don't support SharedWorker.
 * Handles data that requires authentication.
 */

/// <reference lib="webworker" />

import { HttpAgent, Identity } from '@dfinity/agent'
import { getFrontendIdentity } from '../utils/frontend-identity'
import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity'
import { createAgent } from '@dfinity/utils'
import { PriorityQueue } from './shared/priority-queue'
import { coalesced } from './shared/coalesce'
import { BackoffTracker } from './shared/backoff'
import { setCached, getCachedMany, setCacheNetwork, markRefreshed, type CachedEntry } from './shared/indexed-db'
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
  samePayload,
  clearActorCache,
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
  getInitialLoadKeys,
  CHANGE_ONLY_KEYS,
  refreshShownOn,
} from './types'
import { ADMIN_PRINCIPALS } from '../constants/adminPrincipals'

declare const self: DedicatedWorkerGlobalScope

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
  'priceAlerts',
  'tradingPauses',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
  'neuronSnapshots',
  'maxNeuronSnapshots',
  'votableProposals',
  'periodicTimerStatus',
  'autoVotingThreshold',
  'proposerSubaccount',
  'tacoDAONeuronId',
  'defaultVoteBehavior',
  'highestProcessedNNSProposalId',
  'rewardsConfiguration',
  'distributionHistory',
  // Performance data (user-specific)
  'userPerformance',
  // Swap dashboard (user-specific)
  'swapDashboard',
]

const USER_KEYS: DataKey[] = ['userAllocation', 'userPerformance', 'swapDashboard']

const AUTH_REQUIRED_KEYS: DataKey[] = [
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

// The trade history (~650 KB, 2000 trades) and timerStatus (copies saved
// before it stopped embedding that history are as big) are restored from
// IndexedDB in a second pass, so small route data never waits behind them.
const HEAVY_CACHE_KEYS: DataKey[] = ['timerStatus', 'tradingStatus']

const PUBLIC_ADMIN_KEYS: DataKey[] = [
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
  'priceAlerts',
  'tradingPauses',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
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
let currentRoute = '/' // Current route for admin data gating
let currentPrincipal: string | null = null // Text of currentIdentity's principal
let creatingAnonymousAgent = false
// Delegation and session key the authenticated agent was built from
let identityJson: string | null = null

// Principal each in-memory USER_KEYS entry belongs to. User data is only ever
// served to that same principal (see setIdentity / clearIdentity).
const userKeyOwner = new Map<DataKey, string>()
// Network each entry restored from IndexedDB was written on ('ic' for entries
// from before tagging); entries from another network are dropped.
const restoredNetwork = new Map<DataKey, string>()
// Bumped on a network change so a fetch still in flight on the old network is
// dropped instead of being shown and cached as the new network's data.
let networkEpoch = 0
// lastUpdated of the payload the page already holds, per key (see sendResponse)
const delivered = new Map<DataKey, number>()

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Per-request hard abort for the anonymous agent's transport: the app-level 8s
// key timeout only rejects the promise, so without this a wedged HTTP/2
// connection holds every retry hostage for tens of seconds.
const abortingFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
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

// The page drops its copy of user data when the user signs out or switches
// (see the bridge), so a later replay of the same payload must not be skipped
// as "already held"
function forgetDelivered(keys: DataKey[]): void {
  for (const key of keys) delivered.delete(key)
}

function sendResponse(response: WorkerResponse, always = false): void {
  // Subscribe, INITIAL_LOAD, route changes and resume kicks all replay the
  // cache, which delivered every key three times per load (each one a
  // structured clone plus a decode on the page). Remember what the page holds
  // and skip a CACHE_HIT that would resend it, unless it answers a view's own
  // request (`always`).
  const { dataKey, state } = response.payload
  const at = state?.lastUpdated
  if (dataKey && at && state?.data != null &&
      (response.type === 'CACHE_HIT' || response.type === 'DATA_UPDATE')) {
    if (response.type === 'CACHE_HIT' && !always && delivered.get(dataKey) === at) return
    delivered.set(dataKey, at)
  }
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
    // The page sends its identity on every login check. For the same
    // delegation and session key the verified agent stays: a new one loses its
    // subnet key cache and verifies again.
    const json = `${serialized.delegationChainJson}\n${serialized.sessionKeyJson}`
    if (json !== identityJson || !authenticatedAgent || !currentIdentity) {
      // Clear actor cache for old agent before creating new one
      if (authenticatedAgent) {
        clearActorCache(authenticatedAgent)
      }

      currentIdentity = deserializeIdentity(serialized)
      currentPrincipal = currentIdentity.getPrincipal().toText()
      isAuthenticated = true

      authenticatedAgent = await createAgent({
        identity: currentIdentity,
        host: getHost(),
        fetchRootKey: shouldFetchRootKey(),
      })
      identityJson = json
      wakeQueue()

      if (debugEnabled) console.log('[AuthWorker-Dedicated] Identity set, agent created')
    }
    const principal = currentPrincipal!

    // Deliver cached user data, but only this principal's: data held in memory
    // for another principal is dropped, and the IndexedDB copy is used only
    // when it was written for this same principal.
    for (const key of USER_KEYS) {
      const state = dataStates.get(key)
      if (state?.data && userKeyOwner.get(key) === principal) {
        if (subscriptions.has(key)) {
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
        continue
      }
      dataStates.set(key, createInitialState())
      userKeyOwner.delete(key)
      forgetDelivered([key])
      void restoreOwnedUserKey(key, principal)
    }

    queue.enqueue('userAllocation', 'critical')

    if (isAdmin && currentRoute.startsWith('/admin')) {
      for (const key of ADMIN_KEYS) {
        queue.enqueue(key, 'high')
      }
    }
  } catch (error) {
    console.error('[AuthWorker-Dedicated] Error setting identity:', error)
    isAuthenticated = false
    currentIdentity = null
    currentPrincipal = null
    authenticatedAgent = null
    identityJson = null
  }
}

/**
 * Load a user key's IndexedDB copy for `principal` and send it to the page,
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
  if (subscriptions.has(key)) {
    sendResponse({
      id: generateMessageId(),
      timestamp: Date.now(),
      type: 'CACHE_HIT',
      payload: { dataKey: key, data: state.data, state, fromCache: true },
    })
  }
}

function clearIdentity(): void {
  // Clear actor cache before nulling the agent
  if (authenticatedAgent) {
    clearActorCache(authenticatedAgent)
  }

  currentIdentity = null
  currentPrincipal = null
  authenticatedAgent = null
  identityJson = null
  isAuthenticated = false
  isAdmin = false

  // The signed-out page must not keep receiving the last user's data: drop it
  // from memory. The IndexedDB copy stays, tagged with its owner, for that
  // user's next sign-in.
  for (const key of USER_KEYS) {
    dataStates.set(key, createInitialState())
    userKeyOwner.delete(key)
  }
  forgetDelivered(USER_KEYS)

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

  // Restore the IndexedDB cache in two passes (parity with the shared worker):
  // the small keys first, then the two big treasury payloads. The first pass
  // is raced against a timer, because a hung openDB (multi-tab upgrade, broken
  // private window IDB) must never stand between the user and live fetches; a
  // pass that lands after the timer is merged in instead of being thrown away.
  // User data is not restored here: setIdentity loads it for its owner only.
  const restoreDeadline = sleep(3_000)
  const firstPass = getCachedMany(
    HANDLED_KEYS.filter(k => !HEAVY_CACHE_KEYS.includes(k) && !USER_KEYS.includes(k))
  )
  const restored = await Promise.race([firstPass, restoreDeadline.then(() => null)])
  if (restored) {
    applyRestoredCache(restored, false)
  } else {
    console.warn('[AuthWorker-Dedicated] IndexedDB restore is slow, starting with an empty cache and merging it when it lands')
    firstPass.then((late) => applyRestoredCache(late, true))
  }
  const heavyPass = firstPass
    .then(() => getCachedMany(HEAVY_CACHE_KEYS))
    .then((heavy) => applyRestoredCache(heavy, true))
  Promise.race([heavyPass, restoreDeadline]).then(openHeavyFetches, openHeavyFetches)

  // DON'T create the agent here — wait for SET_NETWORK. The main thread owns the
  // network override (localStorage isn't reliably readable in a worker), so
  // creating an agent now risks binding to the wrong host before SET_NETWORK
  // arrives. handleSetNetwork() creates it; processQueue() below waits for it.
  // (Mirrors authenticated.worker.ts — keeps the two workers at parity.)

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
  // stale, or was forced
  for (const key of HEAVY_CACHE_KEYS) {
    const state = dataStates.get(key)
    if (state?.data && !isStale(key, state.lastUpdated) && !queue.isProcessing(key) && !queue.isForced(key)) {
      queue.remove(key)
    }
  }
}

/**
 * Put restored IndexedDB entries into memory. With `announce`, also send the
 * subscribed ones to the page: used for passes that land after init already
 * replayed the buffered subscriptions (the heavy pass, or a late first pass).
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
    // Saved while names went out as Maps (sent as {}): no names at all, and the
    // page receiving it emptied the names it had. Treated as missing.
    if (key === 'allNames' && noNames(entry.data)) continue

    // Migration: this worker used to cache the whole DataState instead of the
    // raw data, so old entries come back double-wrapped and every field read
    // as undefined. Unwrap one level when we see that shape.
    let data = entry.data as any
    if (data && typeof data === 'object' && 'data' in data && 'lastUpdated' in data && 'loading' in data) {
      data = data.data
    }
    const state: DataState = {
      data,
      lastUpdated: entry.lastUpdated,
      loading: false,
      error: null,
      stale: isStale(key, entry.lastUpdated),
    }
    dataStates.set(key, state)
    restoredNetwork.set(key, network)
    if (debugEnabled) console.log(`[AuthWorker-Dedicated] Loaded cached ${key}`)

    if (announce && subscriptions.has(key)) {
      sendResponse({
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'CACHE_HIT',
        payload: { dataKey: key, data: state.data, state, fromCache: true },
      })
    }
  }
}

function noNames(data: any): boolean {
  return !data || (Object.keys(data.principalNames ?? {}).length === 0 && Object.keys(data.neuronNames ?? {}).length === 0)
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

    case 'SET_ROUTE': {
      const newRoute = message.payload.route || '/'
      // Runs for SAME-route sends too: the bridge re-sends SET_ROUTE as a
      // resume kick when the tab becomes visible again, and this body is
      // idempotent (cache replay + stale-only enqueue with backoff reset).
      currentRoute = newRoute
      if (typeof message.payload.visible === 'boolean') isBackgroundTab = !message.payload.visible
      {
        // Proactively serve cache + prioritize fetches for the route
        const routeKeys = getInitialLoadKeys(newRoute)
        for (const key of routeKeys) {
          if (!HANDLED_KEYS.includes(key)) continue
          const state = dataStates.get(key)
          // Send cached data if subscriber exists
          if (state?.data && subscriptions.has(key)) {
            sendResponse({
              id: generateMessageId(),
              timestamp: Date.now(),
              type: 'CACHE_HIT',
              payload: { dataKey: key, data: state.data, state, fromCache: true },
            })
          }
          // Enqueue stale/missing data as critical priority. Admin data is
          // public but only wanted on /admin routes (the old form fetched it
          // everywhere).
          const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
          const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
            ? newRoute.startsWith('/admin')
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

    case 'SET_DEBUG':
      debugEnabled = !!(message.payload as { enabled?: boolean } | undefined)?.enabled
      console.log(`[AuthWorker-Dedicated] Debug ${debugEnabled ? 'enabled' : 'disabled'}`)
      break

    case 'INITIAL_LOAD': {
      // Parity with the shared worker. Without this case the bridge's first,
      // route-scoped load was silently ignored and the first fetch waited for
      // the 5s auto-refresh loop: 6-9s cold loads on every browser without
      // SharedWorker (Android Chrome, WebViews).
      const route = message.payload.route || '/'
      currentRoute = route
      // The page can start hidden (opened in the background)
      if (typeof message.payload.visible === 'boolean') isBackgroundTab = !message.payload.visible
      // Only the backoff is reset: fetches already in flight stay marked as
      // processing, otherwise the queue starts the same keys a second time.
      backoff.resetAll()
      const routeKeys = getInitialLoadKeys(route).filter((k: DataKey) => HANDLED_KEYS.includes(k))
      for (const key of routeKeys) {
        const state = dataStates.get(key)
        if (state?.data) {
          sendResponse({
            id: generateMessageId(),
            timestamp: Date.now(),
            type: 'CACHE_HIT',
            payload: { dataKey: key, data: state.data, state, fromCache: true },
          })
        }
        const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
        const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
          ? route.startsWith('/admin')
          : (!requiresAuth || isAuthenticated)
        if (canFetch && (!state?.data || isStale(key, state.lastUpdated))) {
          backoff.reset(key)
          queue.enqueue(key, 'critical')
        }
      }
      // Everything else follows at low priority; the concurrency pool drains
      // critical first, so the landing route's data always wins the first wave.
      // (Simplified vs the shared worker's deferred-load tracking; same effect.)
      for (const key of PUBLIC_KEYS) {
        if (routeKeys.includes(key) || !HANDLED_KEYS.includes(key)) continue
        // Vault analytics only on the vault route (handled above), the one page that shows them
        if (key === 'nachosVaultAnalytics') continue
        const state = dataStates.get(key)
        const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
        const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
          ? route.startsWith('/admin')
          : (!requiresAuth || isAuthenticated)
        if (canFetch && (!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
          queue.enqueue(key, 'low')
        }
      }
      break
    }

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

  if (isAdmin && !wasAdmin && isAuthenticated && currentRoute.startsWith('/admin')) {
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
  // A view asking for a key waits for this reply (admin pages clear their
  // spinners on it), so it is sent even when the page holds the data. Only the
  // bridge's own route prefetch (quiet) skips what the page already has.
  const replyAlways = !message.payload.quiet

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
      }, replyAlways)
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
    }, replyAlways)
  }

  if (force || !currentState?.data || isStale(dataKey, currentState.lastUpdated)) {
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
    // Parity with the shared worker: subscribing to stale/missing data queues
    // a fetch (this worker used to only replay cache and never fetch here).
    const requiresAuth = USER_KEYS.includes(key) || AUTH_REQUIRED_KEYS.includes(key)
    const canFetch = PUBLIC_ADMIN_KEYS.includes(key)
      ? currentRoute.startsWith('/admin')
      : (!requiresAuth || isAuthenticated) && prefetchAllowed(key)
    if (canFetch && (!state?.data || isStale(key, state.lastUpdated)) && !queue.has(key)) {
      queue.enqueue(key, 'high')
    }
  }
}

// NNS admin data (AUTH_REQUIRED_KEYS) is prefetched only for the admins listed
// in ADMIN_PRINCIPALS. Anyone else who opens /admin/nns loads it there.
function prefetchAllowed(key: DataKey): boolean {
  return !AUTH_REQUIRED_KEYS.includes(key) || (currentPrincipal !== null && ADMIN_PRINCIPALS.includes(currentPrincipal))
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

  // The bridge sends SET_NETWORK at startup and again from initNetworkConfig.
  // Same network with an agent ready (or being built): nothing to redo.
  if (newNetwork === currentNetwork && (anonymousAgent || creatingAnonymousAgent)) return

  // Check if this is the first SET_NETWORK or if network actually changed
  const networkChanged = currentNetwork !== null && currentNetwork !== newNetwork

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

  // Recreate anonymous agent with new network settings. A failure here must be
  // VISIBLE: a silently-null agent leaves processQueue waiting forever and the
  // page on skeletons with no clue why.
  creatingAnonymousAgent = true
  try {
    // HttpAgent.create directly (not @dfinity/utils createAgent, which drops
    // unknown options like `fetch` instead of forwarding them).
    anonymousAgent = await HttpAgent.create({
      identity: getFrontendIdentity(),
      host: getHost(),
      shouldFetchRootKey: shouldFetchRootKey(),
      // Public read-only data — skip per-query signature verification (saves a
      // read_state + BLS verify on first query). Authenticated agent stays verified.
      verifyQuerySignatures: false,
      // Transport-level abort at 12s per HTTP request (see abortingFetch note):
      // frees wedged connections so retries open fresh ones.
      fetch: abortingFetch,
    })
    wakeQueue()
  } catch (error) {
    console.error(`[AuthWorker-Dedicated] FAILED to create anonymous agent for host ${getHost()} — no data can load:`, error)
    throw error
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
    } catch (err) {
      console.error('[AuthWorker-Dedicated] Error clearing cache:', err)
    }

    // Clear in-memory state and queue for refetch
    userKeyOwner.clear()
    restoredNetwork.clear()
    for (const key of HANDLED_KEYS) {
      dataStates.set(key, createInitialState())
      // Queue ADMIN_KEYS only when on admin route
      if (PUBLIC_ADMIN_KEYS.includes(key) && currentRoute.startsWith('/admin')) {
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

const MAX_CONCURRENT_FETCHES = 8
let activeFetchCount = 0

// The queue loop polls (the sleeps below), and is also woken when there is
// something to do: a key queued, a fetch settled (a slot is free), an agent
// ready. A key queued while it slept used to wait up to 500 ms to start.
let wakeQueueLoop: (() => void) | null = null
function wakeQueue(): void {
  wakeQueueLoop?.()
}
function queueSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      wakeQueueLoop = null
      resolve()
    }
    const timer = setTimeout(done, ms)
    wakeQueueLoop = done
  })
}
queue.onEnqueue = wakeQueue

// Data that landed after this item was queued (a composite filled it in as a
// sibling of another key, or another fetch finished) needs no second fetch
function landedSince(item: { dataKey: DataKey; addedAt: number }): boolean {
  const state = dataStates.get(item.dataKey)
  return state?.data != null && !state.stale && (state.lastUpdated ?? 0) > item.addedAt &&
    !isStale(item.dataKey, state.lastUpdated)
}

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (true) {
    // If no agent yet (agents are created on SET_NETWORK), wait rather than spin
    // the inner loop. Prevents CPU busy-wait before the network is configured.
    if (!anonymousAgent && !authenticatedAgent) {
      await queueSleep(100)
      continue
    }

    // A backoff-blocked key must not stall the rest of the queue. Skip it by
    // leaving it marked processing (so dequeue() returns a different item) and
    // release it after the pass — NOT queue.retry()+continue, which would clear
    // the processing flag and busy-spin on the same item. See the unified worker.
    const blockedThisPass: DataKey[] = []
    const heldThisPass: DataKey[] = []
    while (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      const item = queue.dequeue()

      if (!item) break

      const requiresAuth = USER_KEYS.includes(item.dataKey) || AUTH_REQUIRED_KEYS.includes(item.dataKey)
      if (requiresAuth && (!isAuthenticated || !authenticatedAgent)) {
        queue.complete(item.dataKey)
        continue
      }

      // A forced fetch always runs (a refresh after a mint must see the mint)
      if (!item.force && landedSince(item)) {
        queue.complete(item.dataKey)
        continue
      }

      // Heavy keys wait for their IndexedDB copy and for the route's own keys
      // (see openHeavyFetches and routeKeysLoading)
      if (HEAVY_CACHE_KEYS.includes(item.dataKey) && (!heavyCacheRead || routeKeysLoading(item.dataKey))) {
        heldThisPass.push(item.dataKey)
        continue
      }

      if (!anonymousAgent && !authenticatedAgent) {
        queue.retry(item.dataKey)
        break // Exit inner loop to wait for agent
      }

      if (!backoff.canRetry(item.dataKey)) {
        // Backoff not elapsed — skip (left processing) and keep servicing others.
        blockedThisPass.push(item.dataKey)
        continue
      }

      activeFetchCount++
      processSingleFetch(item).finally(() => {
        // Clamp: a RESET/INITIAL_LOAD zeroes the counter while fetches are in
        // flight; going negative would over-admit fetches.
        activeFetchCount = Math.max(0, activeFetchCount - 1)
        wakeQueue()
      })
    }

    // Release backoff-blocked items so the next pass re-checks them.
    for (const key of blockedThisPass) queue.retry(key)
    for (const key of heldThisPass) queue.release(key)

    // Adaptive sleep: 500ms when fully idle (nothing queued, nothing in flight)
    // so the worker isn't waking every 50ms draining mobile battery; 250ms when
    // only backoff-blocked keys remain; 50ms when actively processing.
    const isIdle = activeFetchCount === 0 && queue.isEmpty()
    const onlyBlocked = activeFetchCount === 0 && blockedThisPass.length > 0
    await queueSleep(isIdle ? 500 : onlyBlocked ? 250 : 50)
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
        console.log(`[AuthWorker-Dedicated] fetch OK ${item.dataKey} in ${ms}ms (~${bytes}B)`)
      } catch { /* telemetry must never break the fetch path */ }
    }

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

    // Tell the page, without the payload (as the shared worker does), so a
    // vault panel with nothing cached yet can show that it is retrying. Vault
    // keys only: other pages on this path keep their old loading behaviour.
    if (item.dataKey.startsWith('nachos') && subscriptions.has(item.dataKey)) {
      const state = dataStates.get(item.dataKey) || createInitialState()
      sendResponse({
        id: generateMessageId(),
        timestamp: Date.now(),
        type: 'FETCH_ERROR',
        payload: { dataKey: item.dataKey, error: errorMsg, state: { ...state, data: null }, fromCache: false },
      })
    }

    // Most keys give up after 5 retries; user-facing vault data keeps retrying
    // forever (paced by `backoff.canRetry`) so a transient canister outage can't
    // leave /vault permanently stuck on "Loading dashboard data…". Analytics
    // only while the page shows them; the vault route restarts them on arrival.
    const keepTrying = KEEP_TRYING.includes(item.dataKey) &&
      (item.dataKey !== 'nachosVaultAnalytics' || getInitialLoadKeys(currentRoute).includes(item.dataKey))
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
const COALESCE_MS = 5_000
const TREASURY_COALESCE_MS = 5_000

const getVoteDashboardCoalesced = coalesced('[AuthWorker-Dedicated] getVoteDashboard', (agent) => fetchVoteDashboardData(agent), COALESCE_MS)
const getAllLeaderboardsCoalesced = coalesced('[AuthWorker-Dedicated] getAllLeaderboards', (agent) => fetchAllLeaderboardsData(agent), COALESCE_MS)
const getEnhancedTreasuryDashboardCoalesced = coalesced('[AuthWorker-Dedicated] getEnhancedTreasuryDashboard', (agent) => fetchEnhancedTreasuryDashboardData(agent), TREASURY_COALESCE_MS)

// A composite just filled in `key` as a sibling: a fetch of it still waiting
// in the queue would only ask for the same data again
function dropQueuedSibling(key: DataKey): void {
  if (queue.has(key) && !queue.isProcessing(key) && !queue.isForced(key)) queue.remove(key)
}

async function populateEnhancedTreasurySiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  if (excludeKey !== 'rebalanceConfig') {
    await commitData('rebalanceConfig', serializeForTransfer(dashboard.systemParameters))
    dropQueuedSibling('rebalanceConfig')
  }

  if (excludeKey !== 'tradingPauses') {
    await commitData('tradingPauses', serializeForTransfer(dashboard.tradingPauses))
    dropQueuedSibling('tradingPauses')
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
    await commitData(key, serializeForTransfer(allBoards[backendKey]))
    dropQueuedSibling(key)
  }
}

async function populateVoteDashboardSiblings(dashboard: any, excludeKey: DataKey): Promise<void> {
  const now = Date.now()

  if (excludeKey !== 'tokenDetails') {
    await commitData('tokenDetails', serializeForTransfer(dashboard.tokenDetails))
    dropQueuedSibling('tokenDetails')
  }

  // Only on routes that show timerStatus (a route that shows it fetches it on
  // arrival when stale); elsewhere every vote dashboard refresh pushed it to
  // the page for nothing.
  if (excludeKey !== 'timerStatus' && getInitialLoadKeys(currentRoute).includes('timerStatus')) {
    await commitData('timerStatus', serializeForTransfer({ snapshotInfo: dashboard.snapshotInfo }))
    dropQueuedSibling('timerStatus')
  }

  // aggregateAllocation — extract from dashboard and broadcast
  if (dashboard.aggregateAllocation) {
    const aa = serializeForTransfer(dashboard.aggregateAllocation)
    updateState('aggregateAllocation' as DataKey, { data: aa, lastUpdated: now, loading: false, error: null, stale: false })
    broadcastUpdate('aggregateAllocation' as DataKey, aa)
  }

  // tokenMaxAllocations — extract maxAllocationBasisPoints from tokenDetails entries
  if (excludeKey !== 'tokenMaxAllocations' && dashboard.tokenDetails) {
    const maxAllocations: [any, bigint][] = []
    for (const [principal, details] of dashboard.tokenDetails) {
      if (details.maxAllocationBasisPoints && details.maxAllocationBasisPoints.length > 0) {
        maxAllocations.push([principal, details.maxAllocationBasisPoints[0]])
      }
    }
    await commitData('tokenMaxAllocations', serializeForTransfer(maxAllocations))
    dropQueuedSibling('tokenMaxAllocations')
  }

  // userAllocation — broadcast if present
  if (dashboard.userAllocation?.length > 0) {
    const ua = serializeForTransfer(dashboard.userAllocation)
    updateState('userAllocation' as DataKey, { data: ua, lastUpdated: now, loading: false, error: null, stale: false })
    broadcastUpdate('userAllocation' as DataKey, ua)
  }
}

async function fetchData(dataKey: DataKey): Promise<void> {
  const isPublicKey = PUBLIC_KEYS.includes(dataKey)
  const requiresAuth = USER_KEYS.includes(dataKey) || AUTH_REQUIRED_KEYS.includes(dataKey)

  const agent = isPublicKey
    ? anonymousAgent
    : requiresAuth
      ? authenticatedAgent
      : (authenticatedAgent || anonymousAgent)

  if (!agent) {
    throw new Error(requiresAuth ? 'No authenticated agent' : 'No agent available')
  }

  updateState(dataKey, { loading: true, error: null })

  // Who and where this fetch is for; checked again when the answer lands
  const epoch = networkEpoch
  // A forced fetch sends its own composite query instead of taking the answer
  // of one that may have started before the action it wants to see
  const joinRunning = !queue.isForced(dataKey)
  const owner = USER_KEYS.includes(dataKey) ? currentPrincipal : null

  let data: unknown

  switch (dataKey) {
    // ========== PUBLIC DATA CASES (from merged public worker) ==========
    case 'cryptoPrices':
      data = await fetchCryptoPricesData()
      break

    case 'tokenDetails': {
      const dashboard = await getVoteDashboardCoalesced(anonymousAgent!, { joinRunning })
      if (!dashboard) {
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
      const tmaDashboard = await getVoteDashboardCoalesced(anonymousAgent!, { joinRunning })
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
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(anonymousAgent!, { joinRunning })
      if (!enhancedDashboard) {
        data = serializeForTransfer(await fetchTradingStatusData(anonymousAgent!))
      } else {
        data = serializeForTransfer({ ok: enhancedDashboard.tradingStatus })
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
      const allBoards = await getAllLeaderboardsCoalesced(anonymousAgent!, { joinRunning })
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
      // Snapshot info only. It used to carry copies of the trading status
      // (~650 KB) and the token details too, which their own keys deliver.
      const dashboard = await getVoteDashboardCoalesced(anonymousAgent!, { joinRunning })
      if (!dashboard) {
        data = serializeForTransfer({ snapshotInfo: await fetchSnapshotInfoData(anonymousAgent!) })
      } else {
        data = serializeForTransfer({ snapshotInfo: dashboard.snapshotInfo })
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
      data = serializeForTransfer(await fetchUserAllocationData(authenticatedAgent!))
      break
    case 'userPerformance':
      // userPerformance requires the authenticated user's principal
      if (!currentIdentity) {
        throw new Error('No identity available for userPerformance')
      }
      const userPrincipal = currentIdentity.getPrincipal()
      data = serializeForTransfer(await fetchUserPerformanceData(authenticatedAgent!, userPrincipal))
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
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(agent, { joinRunning })
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
    case 'priceAlerts':
      data = serializeForTransfer(await fetchPriceAlertsData(agent))
      break
    case 'tradingPauses': {
      const enhancedDashboard = await getEnhancedTreasuryDashboardCoalesced(agent, { joinRunning })
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
    case 'neuronSnapshots':
      data = serializeForTransfer(await fetchNeuronSnapshotsData(agent))
      break
    case 'maxNeuronSnapshots':
      data = serializeForTransfer(await fetchMaxNeuronSnapshotsData(agent))
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
    case 'swapDashboard':
      data = serializeForTransfer(await fetchSwapDashboardData(authenticatedAgent!))
      break
    default:
      throw new Error(`Unknown dataKey: ${dataKey}`)
  }

  // The network or the signed-in user changed while this was in flight: the
  // answer belongs to the old one, so it is neither shown nor cached.
  if (epoch !== networkEpoch || (owner !== null && owner !== currentPrincipal)) {
    updateState(dataKey, { loading: false })
    return
  }

  if (owner) userKeyOwner.set(dataKey, owner)
  await commitData(dataKey, data, owner ?? undefined)
}

/**
 * Store a fetch result and send it to the page. A result equal to the data
 * held already is not written to IndexedDB again (markRefreshed keeps its time
 * instead) and, for CHANGE_ONLY_KEYS, not sent again when the page holds it,
 * unless the fetch was forced or the page is on an admin route (the timer
 * panel there is rebuilt from every refresh). User data is always stored and
 * sent. The RAW data is cached (parity with the shared worker): setCached
 * wraps it in its own envelope, and the restore rebuilds a DataState around
 * it. Caching the whole DataState here double-wrapped every restore.
 */
async function commitData(dataKey: DataKey, data: unknown, owner?: string): Promise<void> {
  const prev = dataStates.get(dataKey)
  const fresh = { lastUpdated: Date.now(), loading: false, error: null, stale: false }
  if (!USER_KEYS.includes(dataKey) && prev?.data != null && samePayload(prev.data, data)) {
    // The stored copy is this payload, unless writing it failed
    if (!unsaved.has(dataKey)) markRefreshed(dataKey, fresh.lastUpdated)
    if (CHANGE_ONLY_KEYS.includes(dataKey) && !queue.isForced(dataKey) && !currentRoute.startsWith('/admin') &&
        prev.lastUpdated && delivered.get(dataKey) === prev.lastUpdated) {
      // The page holds the previous payload, so it holds this one: only the time moves on
      updateState(dataKey, fresh)
      delivered.set(dataKey, fresh.lastUpdated)
      return
    }
    updateState(dataKey, { data, ...fresh })
    broadcastUpdate(dataKey, data)
    return
  }

  updateState(dataKey, { data, ...fresh })
  broadcastUpdate(dataKey, data)
  if (await setCached(dataKey, data, owner)) unsaved.delete(dataKey)
  else unsaved.add(dataKey)
}

// Keys whose last IndexedDB write failed (quota): their stored copy is older
// than the data held here
const unsaved = new Set<DataKey>()

// ============================================================================
// Auto-refresh Loop
// ============================================================================

// See REFRESH_ONLY_ON: such keys refresh only while the page shows them
function refreshWanted(dataKey: DataKey): boolean {
  return refreshShownOn(dataKey, currentRoute)
}

async function autoRefreshLoop(): Promise<void> {
  let publicRefreshCounter = 0
  let authRefreshCounter = 0

  while (true) {
    await sleep(5000) // Check every 5 seconds (base interval)

    // Check if we should enter idle mode
    checkIdleStatus()

    // Skip auto-refresh if idle
    if (isIdle) continue

    publicRefreshCounter++
    authRefreshCounter++

    // PUBLIC KEYS: refresh every 5 seconds (counter % 1 == 0)
    if (publicRefreshCounter >= 1) {
      const routeKeys = getInitialLoadKeys(currentRoute)
      for (const dataKey of PUBLIC_KEYS) {
        // The two treasury payloads refresh only on routes that show them (the
        // route change refreshes them on arrival). Elsewhere every 30 s refresh
        // sent ~1.3 MB to the page that nothing on it used.
        if (HEAVY_CACHE_KEYS.includes(dataKey) && !routeKeys.includes(dataKey)) continue
        if (!refreshWanted(dataKey)) continue
        // Vault analytics only while the page is on the vault route, the one that
        // shows them (its vault store stays subscribed after the user moves on)
        if (dataKey === 'nachosVaultAnalytics' && !routeKeys.includes(dataKey)) continue
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
          if (!refreshWanted(dataKey)) continue
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

// Messages can arrive before init() finishes its IndexedDB restore; handling
// them against empty state used to drop the bridge's INITIAL_LOAD and serve
// empty caches. Buffer them (order-preserving) and replay after init. Except
// SET_NETWORK and SET_DEBUG, which touch no cached state: handling the network
// right away builds the agent while IndexedDB restores instead of after it
// (the bridge sends it first, so the order of everything else is unchanged).
const pendingMessages: WorkerRequest[] = []

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  if (!isInitialized && e.data?.type !== 'SET_NETWORK' && e.data?.type !== 'SET_DEBUG') {
    pendingMessages.push(e.data)
    return
  }
  handleMessage(e.data)
}

init().then(() => {
  for (const m of pendingMessages.splice(0)) {
    try { handleMessage(m) } catch (err) { console.error('[AuthWorker-Dedicated] Error replaying buffered message:', err) }
  }
  autoRefreshLoop()
})
