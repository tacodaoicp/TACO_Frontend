/**
 * Fetch Functions for SharedWorkers
 *
 * Extracted from taco.store.ts - each function performs the actual IC/API call
 * and returns the data. Agent is passed in to allow anonymous or authenticated calls.
 */

import { Actor, type HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory as daoBackendIDL } from '../../../../declarations/dao_backend/DAO_backend.did.js'
import { idlFactory as treasuryIDL, type _SERVICE as TreasuryService } from '../../../../declarations/treasury/treasury.did.js'
import { idlFactory as neuronSnapshotIDL, type _SERVICE as NeuronSnapshotService } from '../../../../declarations/neuronSnapshot/neuronSnapshot.did.js'
import { idlFactory as sneedForumIDL, type _SERVICE as SneedForumService } from '../../../../declarations/sneed_sns_forum/sneed_sns_forum.did.js'
import { idlFactory as appSneedDaoIDL, type _SERVICE as AppSneedDaoService } from '../../../../declarations/app_sneeddao_backend/app_sneeddao_backend.did.js'
import { idlFactory as snsGovernanceIDL } from '../../../../declarations/sns_governance/sns_governance.did.js'

import {
  getDaoBackendCanisterId,
  getTreasuryCanisterId,
  getNeuronSnapshotCanisterId,
  getSneedForumCanisterId,
  getAppSneedDaoCanisterId,
  getTacoSnsGovernanceCanisterId,
  getTacoSnsRootCanisterId,
  getAlarmCanisterId,
  getRewardsCanisterId,
} from './canister-ids'
import { idlFactory as alarmIDL, type _SERVICE as AlarmService } from '../../../../declarations/alarm/alarm.did.js'
import { idlFactory as rewardsIDL, type _SERVICE as RewardsService } from '../../../../declarations/rewards/rewards.did.js'

// ============================================================================
// Principal Caching (for serialization performance)
// ============================================================================

// Cache for Principal.fromText() - avoids repeated expensive CRC32/Base32 conversions
const principalCache = new Map<string, Principal>()
const MAX_PRINCIPAL_CACHE_SIZE = 1000

// Cache for Principal.toText() - uses WeakMap so Principals can be GC'd
const principalToTextCache = new WeakMap<Principal, string>()

/**
 * Get a cached Principal from text, creating and caching if needed
 */
function getCachedPrincipal(text: string): Principal {
  let principal = principalCache.get(text)
  if (!principal) {
    principal = Principal.fromText(text)
    // Limit cache size to prevent memory issues
    if (principalCache.size >= MAX_PRINCIPAL_CACHE_SIZE) {
      const firstKey = principalCache.keys().next().value
      if (firstKey) principalCache.delete(firstKey)
    }
    principalCache.set(text, principal)
    principalToTextCache.set(principal, text) // Cache reverse direction too
  }
  return principal
}

/**
 * Get cached text from a Principal, caching if needed
 */
function getCachedPrincipalText(principal: Principal): string {
  let text = principalToTextCache.get(principal)
  if (!text) {
    text = principal.toText()
    principalToTextCache.set(principal, text)
  }
  return text
}

// ============================================================================
// Serialization Helper
// ============================================================================

/**
 * Convert BigInt values to strings recursively for safe serialization
 * through postMessage and IndexedDB.
 * Also handles Uint8Array and other non-JSON-safe types.
 */
export function serializeForTransfer(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    // Prefix with 'n' to identify as bigint when deserializing
    return `__bigint__${obj.toString()}`
  }

  if (obj instanceof Uint8Array) {
    return `__uint8array__${Array.from(obj).join(',')}`
  }

  if (obj instanceof Principal) {
    // Use cached toText() for performance
    return `__principal__${getCachedPrincipalText(obj)}`
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeForTransfer)
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeForTransfer(value)
    }
    return result
  }

  return obj
}

/**
 * Restore BigInt and other types from serialized strings
 */
export function deserializeFromTransfer(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    if (obj.startsWith('__bigint__')) {
      return BigInt(obj.slice(10))
    }
    if (obj.startsWith('__uint8array__')) {
      const arr = obj.slice(14).split(',').map(Number)
      return new Uint8Array(arr)
    }
    if (obj.startsWith('__principal__')) {
      // Use cached fromText() for performance
      return getCachedPrincipal(obj.slice(13))
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(deserializeFromTransfer)
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeFromTransfer(value)
    }
    return result
  }

  return obj
}

// ============================================================================
// Types (matching taco.store.ts)
// ============================================================================

export interface CryptoPrices {
  icp: number
  btc: number
  taco: number
  tacoIcp: number
}

export interface TradingStatusResult {
  ok?: {
    metrics: {
      lastUpdate: bigint
      lastRebalanceAttempt: bigint
      totalTradesExecuted: bigint
      totalTradesFailed: bigint
      avgSlippage: number
      successRate: number
    }
    executedTrades?: any[]
    rebalanceStatus: { Idle: null } | { Trading: null } | { Failed: string }
  }
  err?: string
}

export interface TimerStatusData {
  snapshotInfo: any
  tradingStatus: TradingStatusResult
  tokenDetails: any[]
}

// ============================================================================
// Worker 1: Core Public Data Fetchers
// ============================================================================

/**
 * Fetch crypto prices from external APIs (CoinGecko + GeckoTerminal)
 * No IC agent needed - direct HTTP calls
 */
export async function fetchCryptoPricesData(): Promise<CryptoPrices> {
  // Fetch ICP and BTC from CoinGecko
  const coingeckoResponse = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=internet-computer,bitcoin'
  )

  if (!coingeckoResponse.ok) {
    throw new Error(`CoinGecko API error: ${coingeckoResponse.status}`)
  }

  const marketData = await coingeckoResponse.json()

  // Find ICP and BTC in response
  const icpData = marketData.find((c: any) => c.id === 'internet-computer')
  const btcData = marketData.find((c: any) => c.id === 'bitcoin')

  // Fetch TACO price from GeckoTerminal
  const tacoResponse = await fetch(
    'https://api.geckoterminal.com/api/v2/networks/icp/pools/vhoia-myaaa-aaaar-qbmja-cai'
  )

  let tacoUsd = 0
  let tacoIcp = 0

  if (tacoResponse.ok) {
    const tacoData = await tacoResponse.json()
    tacoUsd = Number(tacoData.data?.attributes?.base_token_price_usd || 0)
    tacoIcp = Number(tacoData.data?.attributes?.base_token_price_quote_token || 0)
  }

  return {
    icp: icpData?.current_price || 0,
    btc: btcData?.current_price || 0,
    taco: tacoUsd,
    tacoIcp: tacoIcp,
  }
}

/**
 * Fetch token details from DAO backend
 */
export async function fetchTokenDetailsData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  const tokenDetails = await actor.getTokenDetails()
  return tokenDetails as any[]
}

/**
 * Fetch aggregate allocation from DAO backend
 */
export async function fetchAggregateAllocationData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  const allocation = await actor.getAggregateAllocation()
  return allocation
}

/**
 * Fetch trading status from Treasury
 */
export async function fetchTradingStatusData(agent: HttpAgent): Promise<TradingStatusResult> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  const status = (await actor.getTradingStatus()) as TradingStatusResult
  return status
}

/**
 * Fetch timer status (snapshot info + trading status)
 * This combines data from DAO backend and Treasury
 */
export async function fetchTimerStatusData(agent: HttpAgent): Promise<TimerStatusData> {
  const daoActor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  const treasuryActor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  // Fetch in parallel
  const [snapshotInfo, tradingStatus, tokenDetails] = await Promise.all([
    daoActor.getSnapshotInfo(),
    treasuryActor.getTradingStatus() as Promise<TradingStatusResult>,
    daoActor.getTokenDetails(),
  ])

  return {
    snapshotInfo,
    tradingStatus,
    tokenDetails: tokenDetails as any[],
  }
}

/**
 * Calculate total treasury value in USD
 * Requires token details with balances and prices
 */
export function calculateTotalTreasuryValueInUsd(tokenDetails: any[]): number {
  console.log('[fetch-functions] calculateTotalTreasuryValueInUsd called with', tokenDetails?.length, 'tokens')
  const total = tokenDetails.reduce((acc, tokenEntry) => {
    const details = tokenEntry[1]
    const balance = Number(details.balance)
    const decimals = Number(details.tokenDecimals)
    const priceUsd = Number(details.priceInUSD)
    const tokenValue = priceUsd * (balance / Math.pow(10, decimals))
    console.log(`[fetch-functions] ${details.tokenSymbol}: balance=${balance}, decimals=${decimals}, priceUsd=${priceUsd}, value=$${tokenValue.toFixed(2)}`)
    return acc + tokenValue
  }, 0)
  console.log('[fetch-functions] Total portfolio value:', total)
  return total
}

// ============================================================================
// Worker 2: Secondary Public Data Fetchers
// ============================================================================

/**
 * Fetch voting power metrics from DAO backend
 */
export async function fetchVotingPowerMetricsData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  const metrics = await actor.votingPowerMetrics()
  return metrics
}

/**
 * Fetch TACO DAO proposals from SNS Governance
 */
export async function fetchTacoProposalsData(
  agent: HttpAgent,
  beforeProposal: bigint | null = null,
  limit: number = 20
): Promise<any> {
  const actor = Actor.createActor(snsGovernanceIDL, {
    agent,
    canisterId: getTacoSnsGovernanceCanisterId(),
  })

  const request = {
    include_reward_status: [],
    before_proposal: beforeProposal ? [{ id: beforeProposal }] : [],
    limit: limit,
    exclude_type: [],
    include_topics: [],
    include_status: [],
  }

  const response = (await actor.list_proposals(request)) as any

  // Handle different response structures
  let proposals
  if (response?.proposals) {
    proposals = response.proposals
  } else if (response?.Ok?.proposals) {
    proposals = response.Ok.proposals
  } else if (Array.isArray(response)) {
    proposals = response
  } else {
    throw new Error(`Unexpected response structure: ${JSON.stringify(response)}`)
  }

  return proposals
}

/**
 * Fetch proposals threads from Sneed Forum
 */
export async function fetchProposalsThreadsData(agent: HttpAgent): Promise<any[]> {
  const forumActor = Actor.createActor<SneedForumService>(sneedForumIDL, {
    agent,
    canisterId: getSneedForumCanisterId(),
  })

  // Direct lookup using SNS root canister ID
  const tacoSnsRoot = Principal.fromText(getTacoSnsRootCanisterId())
  const proposalsTopicMapping = await forumActor.get_proposals_topic_by_sns_root(tacoSnsRoot)

  if (!proposalsTopicMapping || proposalsTopicMapping.length === 0) {
    return []
  }

  const mapping = proposalsTopicMapping[0]!
  const threads = await forumActor.get_threads_by_topic(mapping.proposals_topic_id)

  return threads as any[]
}

/**
 * Fetch all names from AppSneedDAO
 */
export async function fetchAllNamesData(agent: HttpAgent): Promise<{
  principalNames: Map<string, { name: string; verified: boolean }>
  neuronNames: Map<string, { name: string; verified: boolean }>
}> {
  const actor = Actor.createActor<AppSneedDaoService>(appSneedDaoIDL, {
    agent,
    canisterId: getAppSneedDaoCanisterId(),
  })

  const [principalNamesRaw, neuronNamesRaw] = await Promise.all([
    actor.get_all_principal_names(),
    actor.get_all_neuron_names(),
  ])

  // Process principal names
  const principalNames = new Map<string, { name: string; verified: boolean }>()
  ;(principalNamesRaw as any[]).forEach(([principal, [name, verified]]) => {
    principalNames.set(principal.toString(), { name, verified })
  })

  // Process neuron names
  const neuronNames = new Map<string, { name: string; verified: boolean }>()
  ;(neuronNamesRaw as any[]).forEach(([neuronKey, [name, verified]]) => {
    const mapKey = `${neuronKey.sns_root_canister_id.toString()}:${uint8ArrayToHex(neuronKey.neuron_id.id)}`
    neuronNames.set(mapKey, { name, verified })
  })

  return { principalNames, neuronNames }
}

/**
 * Fetch neuron snapshot status
 */
export async function fetchNeuronSnapshotStatusData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await actor.get_neuron_snapshot_status()
}

/**
 * Fetch portfolio snapshot status from Treasury
 */
export async function fetchPortfolioSnapshotStatusData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  const status = await actor.getPortfolioSnapshotStatus()
  return {
    status: status.status,
    intervalMinutes: Number(status.intervalMinutes),
    lastSnapshotTime: Number(status.lastSnapshotTime),
  }
}

// ============================================================================
// Worker 3: Authenticated Data Fetchers
// ============================================================================

/**
 * Fetch user allocation (requires authenticated agent)
 */
export async function fetchUserAllocationData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  return await actor.getUserAllocation()
}

/**
 * Fetch system logs (admin only)
 */
export async function fetchSystemLogsData(agent: HttpAgent, count: number = 68): Promise<any[]> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  return (await actor.getLogs(count)) as any[]
}

/**
 * Fetch voter details (admin only)
 */
export async function fetchVoterDetailsData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  const voterDetails = await actor.admin_getUserAllocations()

  if (!voterDetails || !Array.isArray(voterDetails)) {
    return []
  }

  return (voterDetails as any[]).map(([principal, state]) => ({
    principal,
    state,
  }))
}

/**
 * Fetch neuron allocations (admin only)
 */
export async function fetchNeuronAllocationsData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  const result = await actor.admin_getNeuronAllocations()

  if (!Array.isArray(result)) {
    return []
  }

  return (result as any[]).map(([neuronId, allocation]) => ({
    neuronId,
    votingPower: allocation.votingPower,
    lastUpdate: allocation.lastUpdate,
    lastAllocationMaker: allocation.lastAllocationMaker,
    allocations: allocation.allocations.map((alloc: any) => [
      alloc.token.toText(),
      BigInt(alloc.basisPoints),
    ]),
  }))
}

/**
 * Fetch rebalance config from Treasury (admin only)
 */
export async function fetchRebalanceConfigData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  return await actor.getSystemParameters()
}

/**
 * Fetch system parameters from DAO backend (admin only)
 */
export async function fetchSystemParametersData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor(daoBackendIDL, {
    agent,
    canisterId: getDaoBackendCanisterId(),
  })

  return await actor.getSystemParameters()
}

// ============================================================================
// Worker 3: Admin Data Fetchers (Treasury/Trading)
// ============================================================================

/**
 * Fetch price alerts from Treasury (admin only)
 */
export async function fetchPriceAlertsData(agent: HttpAgent, offset: number = 0, limit: number = 68): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  // Returns { alerts: PriceAlertLog[], totalCount: bigint }
  return await actor.getPriceAlerts(BigInt(offset), BigInt(limit))
}

/**
 * Fetch trading pauses from Treasury (admin only)
 */
export async function fetchTradingPausesData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  // Returns TradingPausesResponse
  return await actor.listTradingPauses()
}

/**
 * Fetch price history from Treasury (admin only)
 * Uses getTokenPriceHistory for all tokens
 */
export async function fetchPriceHistoryData(agent: HttpAgent, tokens: Principal[] = []): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  const result = await actor.getTokenPriceHistory(tokens)
  if ('ok' in result) {
    return result.ok
  }
  throw new Error('err' in result ? String(result.err) : 'Failed to get price history')
}

/**
 * Fetch portfolio history from Treasury (admin only)
 */
export async function fetchPortfolioHistoryData(agent: HttpAgent, limit: number = 270): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  const result = await actor.getPortfolioHistory(BigInt(limit))
  if ('ok' in result) {
    return result.ok
  }
  throw new Error('err' in result ? String(result.err) : 'Failed to get portfolio history')
}

/**
 * Fetch circuit breaker logs from Treasury (admin only)
 */
export async function fetchCircuitBreakerLogsData(agent: HttpAgent, offset: number = 0, limit: number = 68): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  return await actor.getPortfolioCircuitBreakerLogs(BigInt(offset), BigInt(limit))
}

/**
 * Fetch circuit breaker conditions from Treasury (admin only)
 */
export async function fetchCircuitBreakerConditionsData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  return await actor.listPortfolioCircuitBreakerConditions()
}

/**
 * Fetch portfolio circuit breaker conditions from Treasury (admin only)
 */
export async function fetchPortfolioCircuitBreakerConditionsData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  return await actor.listPortfolioCircuitBreakerConditions()
}

/**
 * Fetch max price history entries from Treasury (admin only)
 */
export async function fetchMaxPriceHistoryEntriesData(agent: HttpAgent): Promise<bigint> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  return await actor.getMaxPriceHistoryEntries() as bigint
}

/**
 * Fetch max portfolio snapshots from Treasury (admin only)
 */
export async function fetchMaxPortfolioSnapshotsData(agent: HttpAgent): Promise<bigint> {
  const actor = Actor.createActor<TreasuryService>(treasuryIDL, {
    agent,
    canisterId: getTreasuryCanisterId(),
  })

  return await actor.getMaxPortfolioSnapshots() as bigint
}

// ============================================================================
// Worker 3: Admin Data Fetchers (Neuron Snapshots)
// ============================================================================

/**
 * Fetch neuron snapshots from NeuronSnapshot canister (admin only)
 */
export async function fetchNeuronSnapshotsData(agent: HttpAgent, start: number = 0, length: number = 68): Promise<any[]> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await actor.get_neuron_snapshots_info(BigInt(start), BigInt(length)) as any[]
}

/**
 * Fetch max neuron snapshots from NeuronSnapshot canister (admin only)
 */
export async function fetchMaxNeuronSnapshotsData(agent: HttpAgent): Promise<bigint> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await actor.getMaxNeuronSnapshots() as bigint
}

// ============================================================================
// Worker 3: Admin Data Fetchers (Alarm System)
// ============================================================================

/**
 * Fetch alarm system status (admin only)
 */
export async function fetchAlarmSystemStatusData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getMonitoringStatus()
  if ('ok' in result) {
    return result.ok
  }
  throw new Error('err' in result ? result.err : 'Failed to get alarm system status')
}

/**
 * Fetch alarm contacts (admin only)
 */
export async function fetchAlarmContactsData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getContacts()
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get alarm contacts')
}

/**
 * Fetch monitoring status (admin only)
 */
export async function fetchMonitoringStatusData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getMonitoringStatus()
  if ('ok' in result) {
    return result.ok
  }
  throw new Error('err' in result ? result.err : 'Failed to get monitoring status')
}

/**
 * Fetch pending alarms (admin only)
 */
export async function fetchPendingAlarmsData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getPendingAlarms()
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get pending alarms')
}

/**
 * Fetch system errors (admin only)
 */
export async function fetchSystemErrorsData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getSystemErrors([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get system errors')
}

/**
 * Fetch internal errors (admin only)
 */
export async function fetchInternalErrorsData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getInternalErrors([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? String(result.err) : 'Failed to get internal errors')
}

/**
 * Fetch monitored canisters (admin only)
 */
export async function fetchMonitoredCanistersData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getMonitoredCanisters()
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get monitored canisters')
}

/**
 * Fetch configuration intervals (admin only)
 */
export async function fetchConfigurationIntervalsData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getConfigurationIntervals()
  if ('ok' in result) {
    return result.ok
  }
  throw new Error('err' in result ? result.err : 'Failed to get configuration intervals')
}

/**
 * Fetch queue status (admin only)
 */
export async function fetchQueueStatusData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getQueueStatus()
  if ('ok' in result) {
    return result.ok
  }
  throw new Error('err' in result ? result.err : 'Failed to get queue status')
}

/**
 * Fetch sent SMS messages (admin only)
 */
export async function fetchSentSMSMessagesData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getSentSMSMessages([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get sent SMS messages')
}

/**
 * Fetch sent email messages (admin only)
 */
export async function fetchSentEmailMessagesData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getSentEmailMessages([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get sent email messages')
}

/**
 * Fetch sent messages (admin only)
 */
export async function fetchSentMessagesData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getSentMessages([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get sent messages')
}

/**
 * Fetch alarm acknowledgments (admin only)
 */
export async function fetchAlarmAcknowledgmentsData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getAlarmAcknowledgments([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get alarm acknowledgments')
}

/**
 * Fetch admin action logs (admin only)
 */
export async function fetchAdminActionLogsData(agent: HttpAgent, limit: number = 68): Promise<any[]> {
  const actor = Actor.createActor<AlarmService>(alarmIDL, {
    agent,
    canisterId: getAlarmCanisterId(),
  })

  const result = await actor.getAdminActionLogs([BigInt(limit)])
  if ('ok' in result) {
    return result.ok as any[]
  }
  throw new Error('err' in result ? result.err : 'Failed to get admin action logs')
}

// ============================================================================
// Worker 3: Admin Data Fetchers (NNS Automation)
// ============================================================================

/**
 * Fetch votable proposals (admin only)
 */
export async function fetchVotableProposalsData(agent: HttpAgent): Promise<any[]> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getVotableProposals() as any[]
}

/**
 * Fetch periodic timer status (admin only)
 */
export async function fetchPeriodicTimerStatusData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getPeriodicTimerStatus()
}

/**
 * Fetch auto voting threshold (admin only)
 */
export async function fetchAutoVotingThresholdData(agent: HttpAgent): Promise<bigint> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getAutoVotingThresholdSeconds() as bigint
}

/**
 * Fetch proposer subaccount (admin only)
 */
export async function fetchProposerSubaccountData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getProposerSubaccount()
}

/**
 * Fetch TACO DAO neuron ID (admin only)
 */
export async function fetchTacoDAONeuronIdData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getTacoDAONeuronId()
}

/**
 * Fetch default vote behavior (admin only)
 */
export async function fetchDefaultVoteBehaviorData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getDefaultVoteBehavior()
}

/**
 * Fetch highest processed NNS proposal ID (admin only)
 */
export async function fetchHighestProcessedNNSProposalIdData(agent: HttpAgent): Promise<bigint> {
  const actor = Actor.createActor<NeuronSnapshotService>(neuronSnapshotIDL, {
    agent,
    canisterId: getNeuronSnapshotCanisterId(),
  })

  return await (actor as any).getHighestProcessedNNSProposalId() as bigint
}

// ============================================================================
// Rewards Canister Functions
// ============================================================================

/**
 * Fetch rewards configuration (admin only - but public read)
 * Returns configuration including distribution settings
 */
export async function fetchRewardsConfigurationData(agent: HttpAgent): Promise<any> {
  const actor = Actor.createActor<RewardsService>(rewardsIDL, {
    agent,
    canisterId: getRewardsCanisterId(),
  })

  const config = await actor.getConfiguration()

  // Also fetch related balances in parallel for complete configuration view
  const [totalDistributed, tacoBalance, currentNeuronBalances, availableBalance] = await Promise.all([
    actor.getTotalDistributed(),
    actor.getTacoBalance(),
    actor.getCurrentTotalNeuronBalances(),
    actor.getAvailableBalance(),
  ])

  return {
    ...config,
    totalDistributed,
    tacoBalance,
    currentNeuronBalances,
    availableBalance,
  }
}

/**
 * Fetch distribution history (admin only - but public read)
 * Returns paginated distribution records
 */
export async function fetchDistributionHistoryData(agent: HttpAgent, offset: number = 0, limit: number = 5): Promise<any> {
  const actor = Actor.createActor<RewardsService>(rewardsIDL, {
    agent,
    canisterId: getRewardsCanisterId(),
  })

  return await actor.getDistributionHistory(BigInt(offset), BigInt(limit))
}

// ============================================================================
// Utility Functions
// ============================================================================

function uint8ArrayToHex(arr: Uint8Array | number[]): string {
  return Array.from(arr, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
