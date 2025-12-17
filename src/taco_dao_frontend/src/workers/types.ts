/**
 * SharedWorker Data Fetching System - Type Definitions
 */

// ============================================================================
// Data Keys - All fetchable data identifiers
// ============================================================================

export type DataKey =
  // Worker 1: Core Public (high priority)
  | 'cryptoPrices'
  | 'tokenDetails'
  | 'totalTreasuryValueInUsd'
  | 'aggregateAllocation'
  | 'tradingStatus'
  | 'timerStatus'
  // Worker 2: Secondary Public (medium priority)
  | 'votingPowerMetrics'
  | 'tacoProposals'
  | 'proposalsThreads'
  | 'allNames'
  | 'neuronSnapshotStatus'
  | 'portfolioSnapshotStatus'
  // Worker 3: Authenticated (user/admin)
  | 'userAllocation'
  | 'systemLogs'
  | 'voterDetails'
  | 'neuronAllocations'
  | 'rebalanceConfig'
  | 'systemParameters'

// ============================================================================
// Worker Assignment - Which worker handles which data
// ============================================================================

export const WORKER_ASSIGNMENT: Record<DataKey, 'core' | 'secondary' | 'auth'> = {
  // Core public worker
  cryptoPrices: 'core',
  tokenDetails: 'core',
  totalTreasuryValueInUsd: 'core',
  aggregateAllocation: 'core',
  tradingStatus: 'core',
  timerStatus: 'core',
  // Secondary public worker
  votingPowerMetrics: 'secondary',
  tacoProposals: 'secondary',
  proposalsThreads: 'secondary',
  allNames: 'secondary',
  neuronSnapshotStatus: 'secondary',
  portfolioSnapshotStatus: 'secondary',
  // Authenticated worker
  userAllocation: 'auth',
  systemLogs: 'auth',
  voterDetails: 'auth',
  neuronAllocations: 'auth',
  rebalanceConfig: 'auth',
  systemParameters: 'auth',
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
  // High - 60 seconds
  tokenDetails: 60_000,
  totalTreasuryValueInUsd: 60_000,
  aggregateAllocation: 60_000,
  userAllocation: 60_000,
  systemLogs: 30_000,
  // Medium - 120 seconds
  votingPowerMetrics: 120_000,
  voterDetails: 120_000,
  neuronAllocations: 120_000,
  rebalanceConfig: 120_000,
  // Low - 300 seconds
  tacoProposals: 300_000,
  proposalsThreads: 300_000,
  neuronSnapshotStatus: 300_000,
  portfolioSnapshotStatus: 300_000,
  systemParameters: 300_000,
  // Background - 600 seconds
  allNames: 600_000,
}

// Background tab multiplier (3x slower)
export const BACKGROUND_MULTIPLIER = 3

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

export interface WorkerResponse extends BaseMessage {
  type: WorkerResponseType
  payload: {
    dataKey: DataKey
    data?: unknown
    error?: string
    state: DataState
    fromCache: boolean
    tabCount?: number
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
    high: ['aggregateAllocation', 'tradingStatus'],
    preloadRoutes: ['/dao', '/vote'],
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
    high: ['rebalanceConfig', 'systemParameters', 'voterDetails', 'portfolioSnapshotStatus'],
    preloadRoutes: ['/admin/trade', '/admin/neuron'],
  },
  '/admin/trade': {
    critical: ['tradingStatus', 'tokenDetails', 'rebalanceConfig'],
    high: ['systemLogs', 'timerStatus'],
    preloadRoutes: ['/admin', '/admin/price'],
  },
  '/admin/neuron': {
    critical: ['neuronSnapshotStatus', 'voterDetails'],
    high: ['neuronAllocations'],
    preloadRoutes: ['/admin', '/admin/votes'],
  },
  '/admin/votes': {
    critical: ['voterDetails', 'neuronAllocations'],
    high: ['votingPowerMetrics', 'tokenDetails'],
    preloadRoutes: ['/admin/neuron', '/admin'],
  },
  '/admin/price': {
    critical: ['tokenDetails', 'tradingStatus'],
    high: ['rebalanceConfig'],
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
    preloadRoutes: ['/admin'],
  },
  '/wallet': {
    critical: ['tokenDetails'],
    high: ['cryptoPrices'],
    preloadRoutes: [],
  },
}

// Admin-specific data keys to preload
export const ADMIN_PRELOAD_KEYS: DataKey[] = [
  'systemLogs',
  'voterDetails',
  'neuronAllocations',
  'rebalanceConfig',
  'systemParameters',
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

  // Admin preload (low priority) if user is admin
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
