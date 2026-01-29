/**
 * SharedWorker Data Fetching System - Type Definitions
 */

// ============================================================================
// Data Keys - All fetchable data identifiers
// ============================================================================

export type DataKey =
  // Worker 1: Public (core + secondary merged, high/medium priority)
  | 'cryptoPrices'
  | 'tokenDetails'
  | 'totalTreasuryValueInUsd'
  | 'aggregateAllocation'
  | 'tradingStatus'
  | 'timerStatus'
  | 'votingPowerMetrics'
  | 'tacoProposals'
  | 'proposalsThreads'
  | 'allNames'
  | 'neuronSnapshotStatus'
  | 'portfolioSnapshotStatus'
  // Worker 2: Authenticated (user/admin)
  | 'userAllocation'
  | 'systemLogs'
  | 'voterDetails'
  | 'neuronAllocations'
  | 'penalizedNeurons'
  | 'rebalanceConfig'
  | 'systemParameters'
  // Admin-only data keys (treasury/trading)
  | 'treasuryLogs'
  | 'priceAlerts'
  | 'tradingPauses'
  | 'priceHistory'
  | 'portfolioHistory'
  | 'circuitBreakerLogs'
  | 'circuitBreakerConditions'
  | 'portfolioCircuitBreakerConditions'
  // Admin-only data keys (neuron snapshots)
  | 'neuronSnapshots'
  | 'maxNeuronSnapshots'
  | 'maxPortfolioSnapshots'
  | 'maxPriceHistoryEntries'
  // Admin-only data keys (alarm system)
  | 'alarmSystemStatus'
  | 'alarmContacts'
  | 'monitoringStatus'
  | 'pendingAlarms'
  | 'systemErrors'
  | 'internalErrors'
  | 'monitoredCanisters'
  | 'configurationIntervals'
  | 'queueStatus'
  | 'sentSMSMessages'
  | 'sentEmailMessages'
  | 'sentMessages'
  | 'alarmAcknowledgments'
  | 'adminActionLogs'
  // Admin-only data keys (NNS automation)
  | 'votableProposals'
  | 'nnsProposalInfo'
  | 'periodicTimerStatus'
  | 'autoVotingThreshold'
  | 'proposerSubaccount'
  | 'tacoDAONeuronId'
  | 'defaultVoteBehavior'
  | 'highestProcessedNNSProposalId'
  // Admin-only data keys (Rewards/Distributions)
  | 'rewardsConfiguration'
  | 'distributionHistory'
  // Performance/Leaderboard data keys (8 combinations: 2 price types × 4 timeframes)
  | 'leaderboardAllTimeUSD'
  | 'leaderboardAllTimeICP'
  | 'leaderboardOneYearUSD'
  | 'leaderboardOneYearICP'
  | 'leaderboardOneMonthUSD'
  | 'leaderboardOneMonthICP'
  | 'leaderboardOneWeekUSD'
  | 'leaderboardOneWeekICP'
  | 'leaderboardInfo'
  | 'userPerformance'

// ============================================================================
// Worker Assignment - Which worker handles which data
// ============================================================================

export const WORKER_ASSIGNMENT: Record<DataKey, 'public' | 'auth'> = {
  // Public worker (merged core + secondary)
  cryptoPrices: 'public',
  tokenDetails: 'public',
  totalTreasuryValueInUsd: 'public',
  aggregateAllocation: 'public',
  tradingStatus: 'public',
  timerStatus: 'public',
  votingPowerMetrics: 'public',
  tacoProposals: 'public',
  proposalsThreads: 'public',
  allNames: 'public',
  neuronSnapshotStatus: 'public',
  portfolioSnapshotStatus: 'public',
  // Authenticated worker (user data)
  userAllocation: 'auth',
  // Authenticated worker (admin data - treasury/trading)
  systemLogs: 'auth',
  voterDetails: 'auth',
  neuronAllocations: 'auth',
  penalizedNeurons: 'auth',
  rebalanceConfig: 'auth',
  systemParameters: 'auth',
  treasuryLogs: 'auth',
  priceAlerts: 'auth',
  tradingPauses: 'auth',
  priceHistory: 'auth',
  portfolioHistory: 'auth',
  circuitBreakerLogs: 'auth',
  circuitBreakerConditions: 'auth',
  portfolioCircuitBreakerConditions: 'auth',
  // Authenticated worker (admin data - neuron snapshots)
  neuronSnapshots: 'auth',
  maxNeuronSnapshots: 'auth',
  maxPortfolioSnapshots: 'auth',
  maxPriceHistoryEntries: 'auth',
  // Authenticated worker (admin data - alarm system)
  alarmSystemStatus: 'auth',
  alarmContacts: 'auth',
  monitoringStatus: 'auth',
  pendingAlarms: 'auth',
  systemErrors: 'auth',
  internalErrors: 'auth',
  monitoredCanisters: 'auth',
  configurationIntervals: 'auth',
  queueStatus: 'auth',
  sentSMSMessages: 'auth',
  sentEmailMessages: 'auth',
  sentMessages: 'auth',
  alarmAcknowledgments: 'auth',
  adminActionLogs: 'auth',
  // Authenticated worker (admin data - NNS automation)
  votableProposals: 'auth',
  nnsProposalInfo: 'auth',
  periodicTimerStatus: 'auth',
  autoVotingThreshold: 'auth',
  proposerSubaccount: 'auth',
  tacoDAONeuronId: 'auth',
  defaultVoteBehavior: 'auth',
  highestProcessedNNSProposalId: 'auth',
  // Authenticated worker (admin data - Rewards/Distributions)
  rewardsConfiguration: 'auth',
  distributionHistory: 'auth',
  // Performance/Leaderboard (all 8 combinations are public)
  leaderboardAllTimeUSD: 'public',
  leaderboardAllTimeICP: 'public',
  leaderboardOneYearUSD: 'public',
  leaderboardOneYearICP: 'public',
  leaderboardOneMonthUSD: 'public',
  leaderboardOneMonthICP: 'public',
  leaderboardOneWeekUSD: 'public',
  leaderboardOneWeekICP: 'public',
  leaderboardInfo: 'public',
  userPerformance: 'auth',
}

// ============================================================================
// Priority System
// ============================================================================

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'background'

export const PRIORITY_VALUES: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  background: 4,
}

// ============================================================================
// Staleness Thresholds (milliseconds)
// ============================================================================

export const STALENESS_THRESHOLDS: Record<DataKey, number> = {
  // Critical - 30 seconds
  cryptoPrices: 30_000,
  tradingStatus: 30_000,
  timerStatus: 30_000,
  systemLogs: 30_000,
  // High - 60 seconds
  tokenDetails: 60_000,
  totalTreasuryValueInUsd: 60_000,
  aggregateAllocation: 60_000,
  userAllocation: 60_000,
  // Medium - 120 seconds
  votingPowerMetrics: 120_000,
  voterDetails: 120_000,
  neuronAllocations: 120_000,
  penalizedNeurons: 120_000,
  rebalanceConfig: 120_000,
  treasuryLogs: 120_000,
  tradingPauses: 120_000,
  alarmSystemStatus: 120_000,
  // Low - 300 seconds
  tacoProposals: 300_000,
  proposalsThreads: 300_000,
  neuronSnapshotStatus: 300_000,
  portfolioSnapshotStatus: 300_000,
  systemParameters: 300_000,
  priceAlerts: 300_000,
  circuitBreakerLogs: 300_000,
  circuitBreakerConditions: 300_000,
  portfolioCircuitBreakerConditions: 300_000,
  alarmContacts: 300_000,
  monitoredCanisters: 300_000,
  configurationIntervals: 300_000,
  queueStatus: 300_000,
  sentSMSMessages: 300_000,
  sentEmailMessages: 300_000,
  sentMessages: 300_000,
  alarmAcknowledgments: 300_000,
  adminActionLogs: 300_000,
  periodicTimerStatus: 300_000,
  autoVotingThreshold: 300_000,
  proposerSubaccount: 300_000,
  tacoDAONeuronId: 300_000,
  defaultVoteBehavior: 300_000,
  highestProcessedNNSProposalId: 300_000,
  // Background - 600 seconds (large data sets, rarely change, or updated frequently by UI)
  allNames: 600_000,
  priceHistory: 600_000,
  portfolioHistory: 600_000,
  neuronSnapshots: 600_000,
  maxNeuronSnapshots: 600_000,
  maxPortfolioSnapshots: 600_000,
  maxPriceHistoryEntries: 600_000,
  monitoringStatus: 600_000,
  pendingAlarms: 600_000,
  systemErrors: 600_000,
  internalErrors: 600_000,
  votableProposals: 600_000,
  nnsProposalInfo: 600_000,
  // Rewards/Distributions - 120 seconds (reasonable refresh rate)
  rewardsConfiguration: 120_000,
  distributionHistory: 120_000,
  // Performance/Leaderboard - 300 seconds (updated weekly, not frequently changing)
  leaderboardAllTimeUSD: 300_000,
  leaderboardAllTimeICP: 300_000,
  leaderboardOneYearUSD: 300_000,
  leaderboardOneYearICP: 300_000,
  leaderboardOneMonthUSD: 300_000,
  leaderboardOneMonthICP: 300_000,
  leaderboardOneWeekUSD: 300_000,
  leaderboardOneWeekICP: 300_000,
  leaderboardInfo: 300_000,
  userPerformance: 300_000,
}

// Background tab multiplier (3x slower)
export const BACKGROUND_MULTIPLIER = 3

// Idle timeout - stop refreshes after 5 minutes of inactivity
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// Data State
// ============================================================================

export interface DataState<T = unknown> {
  data: T | null
  lastUpdated: number | null
  loading: boolean
  error: string | null
  stale: boolean
}

export function createInitialState<T>(): DataState<T> {
  return {
    data: null,
    lastUpdated: null,
    loading: false,
    error: null,
    stale: true,
  }
}

// ============================================================================
// Worker Messages
// ============================================================================

interface BaseMessage {
  id: string
  timestamp: number
}

// Request types (Main Thread -> Worker)
export type WorkerRequestType =
  | 'FETCH'
  | 'SET_PRIORITY'
  | 'SET_IDENTITY'
  | 'CLEAR_IDENTITY'
  | 'SET_VISIBILITY'
  | 'GET_CACHED'
  | 'SUBSCRIBE'
  | 'UNSUBSCRIBE'
  | 'SET_ADMIN'
  | 'INVALIDATE'
  | 'SET_NETWORK'
  | 'PING'
  | 'USER_ACTIVITY' // Signal user activity to reset idle timer
  | 'RESET' // Reset worker state (backoff, queue, fetch count) for fresh start
  | 'INITIAL_LOAD' // Tell worker the initial route for selective data loading

export interface WorkerRequest extends BaseMessage {
  type: WorkerRequestType
  payload: {
    dataKey?: DataKey
    dataKeys?: DataKey[]
    priority?: Priority
    identity?: SerializedIdentity
    visible?: boolean
    force?: boolean
    isAdmin?: boolean
    network?: 'ic' | 'staging' | 'local' | null
    route?: string // Current route for INITIAL_LOAD
  }
}

// Response types (Worker -> Main Thread)
export type WorkerResponseType =
  | 'DATA_UPDATE'
  | 'FETCH_STARTED'
  | 'FETCH_COMPLETE'
  | 'FETCH_ERROR'
  | 'CACHE_HIT'
  | 'CONNECTED'
  | 'PONG'
  | 'INITIAL_CACHE_READY'
  | 'DEBUG_LOG'

export interface WorkerResponse extends BaseMessage {
  type: WorkerResponseType
  payload: {
    dataKey: DataKey
    data?: unknown
    error?: string
    state: DataState
    fromCache: boolean
    tabCount?: number
    debugMessage?: string  // For DEBUG_LOG type
  }
}

// ============================================================================
// Identity Serialization
// ============================================================================

export interface SerializedIdentity {
  delegationChainJson: string
  sessionKeyJson: string
}

// ============================================================================
// Route Priority Configuration
// ============================================================================

export interface RouteDataConfig {
  critical: DataKey[]
  high: DataKey[]
  preloadRoutes: string[]
}

export const ROUTE_PRIORITIES: Record<string, RouteDataConfig> = {
  '/': {
    critical: ['cryptoPrices', 'tokenDetails', 'totalTreasuryValueInUsd'],
    high: ['aggregateAllocation', 'tradingStatus', 'leaderboardAllTimeUSD'],
    preloadRoutes: ['/dao', '/vote', '/performance'],
  },
  '/dao': {
    critical: ['tokenDetails', 'aggregateAllocation', 'tradingStatus'],
    high: ['cryptoPrices', 'totalTreasuryValueInUsd', 'timerStatus'],
    preloadRoutes: ['/', '/vote', '/wallet'],
  },
  '/vote': {
    critical: ['votingPowerMetrics', 'aggregateAllocation', 'tokenDetails'],
    high: ['userAllocation', 'tacoProposals', 'cryptoPrices'],
    preloadRoutes: ['/dao', '/forum', '/wallet'],
  },
  '/forum': {
    critical: ['proposalsThreads', 'allNames'],
    high: ['tacoProposals'],
    preloadRoutes: ['/vote'],
  },
  '/proposals': {
    critical: ['tacoProposals', 'allNames'],
    high: ['proposalsThreads'],
    preloadRoutes: ['/forum', '/vote'],
  },
  '/names': {
    critical: ['allNames'],
    high: [],
    preloadRoutes: ['/'],
  },
  '/admin': {
    critical: ['systemLogs', 'timerStatus', 'tradingStatus', 'tokenDetails'],
    high: ['rebalanceConfig', 'systemParameters', 'voterDetails', 'portfolioSnapshotStatus', 'votingPowerMetrics', 'aggregateAllocation', 'tradingPauses', 'neuronAllocations'],
    preloadRoutes: ['/admin/trade', '/admin/neuron'],
  },
  '/admin/trade': {
    critical: ['tradingStatus', 'tokenDetails', 'rebalanceConfig'],
    high: ['systemLogs', 'timerStatus'],
    preloadRoutes: ['/admin', '/admin/price'],
  },
  '/admin/neuron': {
    critical: ['neuronSnapshotStatus', 'voterDetails', 'neuronSnapshots'],
    high: ['neuronAllocations', 'maxNeuronSnapshots'],
    preloadRoutes: ['/admin', '/admin/votes'],
  },
  '/admin/votes': {
    critical: ['voterDetails', 'neuronAllocations'],
    high: ['votingPowerMetrics', 'tokenDetails'],
    preloadRoutes: ['/admin/neuron', '/admin'],
  },
  '/admin/price': {
    critical: ['tokenDetails', 'tradingStatus', 'circuitBreakerConditions', 'priceAlerts'],
    high: ['rebalanceConfig', 'tradingPauses', 'portfolioCircuitBreakerConditions', 'circuitBreakerLogs'],
    preloadRoutes: ['/admin/trade', '/admin/pricehistory'],
  },
  '/admin/pricehistory': {
    critical: ['tokenDetails', 'aggregateAllocation'],
    high: ['tradingStatus'],
    preloadRoutes: ['/admin/price', '/admin'],
  },
  '/admin/archives': {
    critical: ['allNames'],
    high: ['tokenDetails'],
    preloadRoutes: ['/admin'],
  },
  '/admin/rewards': {
    critical: ['allNames', 'tokenDetails'],
    high: [],
    preloadRoutes: ['/admin', '/admin/distributions'],
  },
  '/admin/distributions': {
    critical: ['rewardsConfiguration', 'distributionHistory'],
    high: ['allNames', 'tokenDetails'],
    preloadRoutes: ['/admin', '/admin/rewards'],
  },
  '/admin/nns': {
    critical: ['votableProposals', 'periodicTimerStatus'],
    high: ['autoVotingThreshold', 'proposerSubaccount', 'tacoDAONeuronId', 'defaultVoteBehavior', 'highestProcessedNNSProposalId'],
    preloadRoutes: ['/admin'],
  },
  '/admin/alarm': {
    critical: ['alarmSystemStatus', 'pendingAlarms', 'systemErrors'],
    high: ['alarmContacts', 'monitoringStatus', 'internalErrors', 'monitoredCanisters', 'configurationIntervals', 'queueStatus', 'sentMessages', 'alarmAcknowledgments', 'adminActionLogs'],
    preloadRoutes: ['/admin'],
  },
  '/wallet': {
    critical: ['tokenDetails'],
    high: ['cryptoPrices'],
    preloadRoutes: [],
  },
  '/performance': {
    critical: ['leaderboardAllTimeUSD', 'leaderboardInfo'],
    high: [
      'leaderboardAllTimeICP',
      'leaderboardOneYearUSD',
      'leaderboardOneYearICP',
      'leaderboardOneMonthUSD',
      'leaderboardOneMonthICP',
      'leaderboardOneWeekUSD',
      'leaderboardOneWeekICP',
      'userPerformance',
    ],
    preloadRoutes: ['/dao', '/rewards'],
  },
}

// Admin-specific data keys to preload
export const ADMIN_PRELOAD_KEYS: DataKey[] = [
  // Core admin data
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'penalizedNeurons',
  'rebalanceConfig',
  'systemParameters',
  // Treasury/Trading admin data
  'treasuryLogs',
  'priceAlerts',
  'tradingPauses',
  'circuitBreakerLogs',
  'circuitBreakerConditions',
  'portfolioCircuitBreakerConditions',
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
  'adminActionLogs',
  // NNS automation admin data
  'periodicTimerStatus',
  'autoVotingThreshold',
  'defaultVoteBehavior',
  // Rewards/Distributions admin data
  'rewardsConfiguration',
  'distributionHistory',
]

// ============================================================================
// Cached Data Structure (for IndexedDB)
// ============================================================================

export interface CachedData<T = unknown> {
  dataKey: DataKey
  data: T
  lastUpdated: number
  version: number
}

export const CACHE_VERSION = 1

// ============================================================================
// Helper Functions
// ============================================================================

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function isStale(dataKey: DataKey, lastUpdated: number | null, isBackground: boolean): boolean {
  if (!lastUpdated) return true
  const threshold = STALENESS_THRESHOLDS[dataKey]
  const multiplier = isBackground ? BACKGROUND_MULTIPLIER : 1
  return Date.now() - lastUpdated > threshold * multiplier
}

export function getRoutePriorities(
  currentRoute: string,
  isAdmin: boolean,
  isAuthenticated: boolean
): Map<DataKey, Priority> {
  const priorities = new Map<DataKey, Priority>()

  // Find matching route config (handle dynamic routes)
  let config = ROUTE_PRIORITIES[currentRoute]
  if (!config) {
    // Try prefix matching for dynamic routes
    const routePrefix = Object.keys(ROUTE_PRIORITIES).find(
      (r) => currentRoute.startsWith(r) && r !== '/'
    )
    config = routePrefix ? ROUTE_PRIORITIES[routePrefix] : ROUTE_PRIORITIES['/']
  }

  // Current route critical data
  config.critical.forEach((key) => priorities.set(key, 'critical'))

  // Current route high priority data
  config.high.forEach((key) => {
    if (!priorities.has(key)) priorities.set(key, 'high')
  })

  // Adjacent routes (medium priority)
  config.preloadRoutes.forEach((route) => {
    const adjConfig = ROUTE_PRIORITIES[route]
    if (adjConfig) {
      adjConfig.critical.forEach((key) => {
        if (!priorities.has(key)) priorities.set(key, 'medium')
      })
    }
  })

  // Admin preload (low priority) if user is admin - preload in background but not lowest
  if (isAdmin) {
    ADMIN_PRELOAD_KEYS.forEach((key) => {
      if (!priorities.has(key)) priorities.set(key, 'low')
    })
  }

  // User allocation if authenticated
  if (isAuthenticated && !priorities.has('userAllocation')) {
    priorities.set('userAllocation', 'medium')
  }

  // Everything else is background priority
  const allKeys: DataKey[] = Object.keys(WORKER_ASSIGNMENT) as DataKey[]
  allKeys.forEach((key) => {
    if (!priorities.has(key)) {
      priorities.set(key, 'background')
    }
  })

  return priorities
}

/**
 * Get critical and high priority keys for a route (used for initial selective loading)
 * Returns only the keys that should be loaded immediately for a given route
 */
export function getInitialLoadKeys(route: string): DataKey[] {
  // Find matching route config
  let config = ROUTE_PRIORITIES[route]
  if (!config) {
    const routePrefix = Object.keys(ROUTE_PRIORITIES).find(
      (r) => route.startsWith(r) && r !== '/'
    )
    config = routePrefix ? ROUTE_PRIORITIES[routePrefix] : ROUTE_PRIORITIES['/']
  }

  // Return only critical and high priority keys
  const keys = new Set<DataKey>()
  config.critical.forEach((key) => keys.add(key))
  config.high.forEach((key) => keys.add(key))

  return Array.from(keys)
}
