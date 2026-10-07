/**
 * Performance Graph Worker (DedicatedWorker, one per PerformanceChart instance,
 * plus one for PerformanceView's staging demo numbers)
 *
 * Fetches a user's performance graph (getUserPerformanceGraphData), does the
 * expensive Candid DECODE off the main thread, then HOLDS the decoded checkpoints
 * in worker memory and runs the chart-compute itself. The main thread receives
 * only chart-ready series + a COMPACT {timestamp, reason} meta — never the full
 * (multi-MiB) checkpoints array. That's the fix for the /performance freeze:
 * previously the big array crossed worker→main→chart-compute-worker, paying a
 * structured-clone cost on the MAIN thread on both hops (worst for large
 * histories). Baseline / token-symbol changes are a cheap `recompute` message —
 * the checkpoints are already here, so nothing re-crosses the main thread.
 *
 * Correlation: each message carries a per-session reqId (this worker is created
 * fresh per chart, so there is no cross-tab/cross-deploy singleton fragility).
 *
 * A `userPerformance` message serves the staging demo's MyPerformance payload:
 * fetched, decoded and shaped here, returned in the transfer format for the
 * view's cooperative deserialize. Only the numbers cross: neurons[].checkpoints
 * is sent empty because nothing on the page reads it (the chart loads its own).
 */

// @ts-ignore - generated .did.js has no type declarations
import { idlFactory } from '../../../declarations/rewards/rewards.did.js'
import { HttpAgent, Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import type { SerializedCheckpoint } from './shared/chart-compute'
import { computeAll } from './shared/chart-compute'
import { serializeForTransfer } from './shared/transfer'

interface BaseMsg {
  reqId: number
  baselineIndex?: number
  tokenSymbolMap?: Record<string, string>
  isLocal?: boolean
}
interface LoadMsg extends BaseMsg {
  type?: 'load'
  principal: string
  host: string
  canisterId: string
  fetchRootKey: boolean
}
interface RecomputeMsg extends BaseMsg {
  type: 'recompute'
}
interface UserPerfMsg {
  reqId: number
  type: 'userPerformance'
  principal: string
  host: string
  canisterId: string
  fetchRootKey: boolean
  startMs: number
}

// Per-instance state: the decoded checkpoints stay HERE, off the main thread.
let storedCheckpoints: SerializedCheckpoint[] = []

function formatErr(err: any): string {
  if (err && typeof err === 'object') {
    if ('NeuronNotFound' in err) return 'No performance data yet'
    if ('NotAuthorized' in err) return 'Not authorized'
    if ('SystemError' in err) return 'System temporarily unavailable'
    if ('AllocationDataMissing' in err) return 'Allocation data not available'
    if ('PriceDataMissing' in err) return 'Price data not available'
    if ('InvalidTimeRange' in err) return 'Invalid time range'
  }
  return 'Failed to load data'
}

async function fetchCheckpoints(
  principal: string, host: string, canisterId: string, fetchRootKey: boolean,
): Promise<SerializedCheckpoint[]> {
  const agent = new HttpAgent({ host, verifyQuerySignatures: false })
  if (fetchRootKey) await agent.fetchRootKey()
  const actor: any = Actor.createActor(idlFactory, { agent, canisterId })

  const now = BigInt(Date.now()) * 1_000_000n
  // Default chart window starts Feb 1, 2026 (when leaderboard data begins).
  // Specific large accounts whose history exceeds the 2 MiB query-reply limit
  // start later to shrink the payload. NOTE: Date.UTC months are 0-indexed.
  const PRINCIPAL_START_OVERRIDES: Record<string, number> = {
    'tvjs2-edxbo-q4pb6-5sitr-2ww7d-au4ky-pl7d5-wx7ai-dia5c-5xcbh-kae': Date.UTC(2026, 1, 10),
  }
  const DATA_START_MS = PRINCIPAL_START_OVERRIDES[principal] ?? Date.UTC(2026, 1, 1)
  const hasOverride = principal in PRINCIPAL_START_OVERRIDES
  const SHIFT_MS = 14 * 24 * 60 * 60 * 1000
  const MAX_SHIFTS = 200
  const tooLarge = (err: any) => {
    const m = err instanceof Error ? err.message : String(err)
    return m.includes('msg_reply_data_append') || m.includes('payload size')
  }

  let result: any
  let shift = 0
  while (shift <= MAX_SHIFTS) {
    const startMs = (shift === 0 && !hasOverride) ? 0 : DATA_START_MS + shift * SHIFT_MS
    const startTime = BigInt(startMs) * 1_000_000n
    try {
      result = await actor.getUserPerformanceGraphData(Principal.fromText(principal), startTime, now)
      break
    } catch (err) {
      if (!tooLarge(err)) throw err
      shift++
    }
  }
  if (!result) throw new Error('Could not load performance graph within size limit')
  if ('err' in result) throw new Error(formatErr(result.err))

  // Pick the neuron with the most checkpoints (tie-break on all-time ICP score).
  const neurons: any[] = result.ok?.neurons || []
  let best: any = null
  for (const n of neurons) {
    const len = n.checkpoints?.length ?? 0
    const bestLen = best?.checkpoints?.length ?? 0
    if (!best || len > bestLen) { best = n; continue }
    if (len === bestLen) {
      const bestIcp = best?.performanceScoreICP?.[0] ?? -Infinity
      const currIcp = n?.performanceScoreICP?.[0] ?? -Infinity
      if (currIcp > bestIcp) best = n
    }
  }

  const raw: any[] = (best?.checkpoints ?? []).slice().sort((a: any, b: any) => Number(a.timestamp) - Number(b.timestamp))
  return raw.map((cp: any) => ({
    timestamp: Number(cp.timestamp),
    allocations: (cp.allocations || []).map((a: any) => ({
      token: a.token?.toText ? a.token.toText() : String(a.token ?? ''),
      basisPoints: Number(a.basisPoints),
    })),
    pricesUsed: (cp.pricesUsed || []).map(([p, info]: any) => [
      p?.toText ? p.toText() : String(p ?? ''),
      { usdPrice: Number(info.usdPrice), icpPrice: Number(info.icpPrice) },
    ]),
    totalPortfolioValueUSD: Number(cp.totalPortfolioValue),
    totalPortfolioValueICP: Number(cp.totalPortfolioValueICP ?? 0),
    reason: (cp.reason || []).map((r: any) => r || ''),
  }))
}

// Staging demo MyPerformance payload. Same request and shaping as the inline
// loader PerformanceView used to run on the main thread (mirrors the data
// worker's fetchUserPerformanceData), except that neurons[].checkpoints is left
// empty; decoding this reply there froze every tap.
async function fetchUserPerformance(m: UserPerfMsg): Promise<unknown> {
  const agent = new HttpAgent({ host: m.host, verifyQuerySignatures: false })
  if (m.fetchRootKey) await agent.fetchRootKey()
  const actor: any = Actor.createActor(idlFactory, { agent, canisterId: m.canisterId })
  const principal = Principal.fromText(m.principal)
  const endTime = BigInt(Date.now()) * 1_000_000n
  const startTime = BigInt(m.startMs) * 1_000_000n
  const result = await actor.getUserPerformanceGraphData(principal, startTime, endTime)
  if (!result || !('ok' in result)) throw new Error('performance graph unavailable')
  const graphData = result.ok
  const sorted: any[] = [...(graphData.neurons || [])].sort((a: any, b: any) =>
    (b.performanceScoreICP?.[0] ?? -Infinity) - (a.performanceScoreICP?.[0] ?? -Infinity)
  )
  const wAvg = (getVal: (n: any) => any) => {
    let tw = BigInt(0), ws = 0
    for (const n of sorted) {
      const v = getVal(n); const vp = n.votingPower ?? BigInt(0)
      if (v !== null && v !== undefined && vp > 0) { ws += v * Number(vp); tw += vp }
    }
    return tw > 0 ? [ws / Number(tw)] : []
  }
  const neurons = sorted.map((nd) => ({
    neuronId: nd.neuronId,
    votingPower: nd.votingPower ?? BigInt(0),
    distributionsParticipated: nd.checkpoints?.length ?? 0,
    // Not sent: the raw history (~5 MiB) would cost a main-thread clone and
    // deserialize, and no consumer of userPerformance reads it.
    checkpoints: [],
    performanceScoreUSD: nd.performanceScoreUSD,
    performanceScoreICP: nd.performanceScoreICP,
    performance: {
      allTimeUSD: nd.performanceScoreUSD ? [nd.performanceScoreUSD] : [],
      allTimeICP: nd.performanceScoreICP?.length > 0 ? [nd.performanceScoreICP[0]] : [],
      oneWeekUSD: nd.oneWeekUSD?.length > 0 ? [nd.oneWeekUSD[0]] : [],
      oneWeekICP: nd.oneWeekICP?.length > 0 ? [nd.oneWeekICP[0]] : [],
      oneMonthUSD: nd.oneMonthUSD?.length > 0 ? [nd.oneMonthUSD[0]] : [],
      oneMonthICP: nd.oneMonthICP?.length > 0 ? [nd.oneMonthICP[0]] : [],
      oneYearUSD: nd.oneYearUSD?.length > 0 ? [nd.oneYearUSD[0]] : [],
      oneYearICP: nd.oneYearICP?.length > 0 ? [nd.oneYearICP[0]] : [],
    },
  }))
  const totalCheckpoints = neurons.reduce((s, n) => s + n.distributionsParticipated, 0)
  const totalVotingPower = neurons.reduce((s, n) => s + (n.votingPower || BigInt(0)), BigInt(0))
  return serializeForTransfer({
    principal,
    totalVotingPower,
    distributionsParticipated: totalCheckpoints,
    lastActivity: graphData.timeframe.endTime,
    aggregatedPerformance: {
      allTimeUSD: wAvg(n => n.performanceScoreUSD),
      allTimeICP: wAvg(n => n.performanceScoreICP?.[0]),
      oneWeekUSD: wAvg(n => n.oneWeekUSD?.[0]),
      oneWeekICP: wAvg(n => n.oneWeekICP?.[0]),
      oneMonthUSD: wAvg(n => n.oneMonthUSD?.[0]),
      oneMonthICP: wAvg(n => n.oneMonthICP?.[0]),
      oneYearUSD: wAvg(n => n.oneYearUSD?.[0]),
      oneYearICP: wAvg(n => n.oneYearICP?.[0]),
    },
    neurons,
  })
}

self.onmessage = async (e: MessageEvent<LoadMsg | RecomputeMsg | UserPerfMsg>) => {
  const msg = (e.data || {}) as LoadMsg | RecomputeMsg | UserPerfMsg
  const reqId = msg.reqId
  try {
    if (msg.type === 'userPerformance') {
      self.postMessage({ reqId, ok: true, data: await fetchUserPerformance(msg) })
      return
    }
    if (msg.type === 'recompute') {
      const r = computeAll({
        checkpoints: storedCheckpoints, baselineIndex: msg.baselineIndex || 0,
        tokenSymbolMap: msg.tokenSymbolMap || {}, isLocal: !!msg.isLocal,
      })
      self.postMessage({ reqId, ok: true, usdSeries: r.usdSeries, icpSeries: r.icpSeries, tooltipData: r.tooltipData })
      return
    }
    // load
    const m = msg as LoadMsg
    storedCheckpoints = await fetchCheckpoints(m.principal, m.host, m.canisterId, m.fetchRootKey)
    // Compact meta = only what the MAIN thread needs (chart presence, the
    // "start from" date picker, and the tooltip note). The full nested array
    // stays here.
    const meta = storedCheckpoints.map((c) => ({ timestamp: c.timestamp, reason: c.reason }))
    const r = computeAll({
      checkpoints: storedCheckpoints, baselineIndex: m.baselineIndex || 0,
      tokenSymbolMap: m.tokenSymbolMap || {}, isLocal: !!m.isLocal,
    })
    self.postMessage({ reqId, ok: true, meta, usdSeries: r.usdSeries, icpSeries: r.icpSeries, tooltipData: r.tooltipData })
  } catch (err: any) {
    self.postMessage({ reqId, ok: false, error: err?.message || String(err) })
  }
}
