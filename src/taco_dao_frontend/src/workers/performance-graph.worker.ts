/**
 * Performance Graph Worker (DedicatedWorker, one per PerformanceChart instance)
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
 */

// @ts-ignore - generated .did.js has no type declarations
import { idlFactory } from '../../../declarations/rewards/rewards.did.js'
import { HttpAgent, Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import type { SerializedCheckpoint } from './shared/chart-compute'
import { computeAll } from './shared/chart-compute'

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

self.onmessage = async (e: MessageEvent<LoadMsg | RecomputeMsg>) => {
  const msg = (e.data || {}) as LoadMsg | RecomputeMsg
  const reqId = msg.reqId
  try {
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
