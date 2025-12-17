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
} from './canister-ids'

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
    return `__principal__${obj.toText()}`
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
      return Principal.fromText(obj.slice(13))
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
export async function fetchSystemLogsData(agent: HttpAgent, count: number = 100): Promise<any[]> {
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
// Utility Functions
// ============================================================================

function uint8ArrayToHex(arr: Uint8Array | number[]): string {
  return Array.from(arr, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
