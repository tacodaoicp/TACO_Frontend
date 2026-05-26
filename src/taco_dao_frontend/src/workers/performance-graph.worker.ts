/**
 * Performance Graph Fetch Worker (DedicatedWorker)
 *
 * Fetches another user's performance graph (getUserPerformanceGraphData) and
 * does the expensive Candid DECODE + reshape + serialize entirely off the main
 * thread, posting back chart-ready serialized checkpoints.
 *
 * Why: for large accounts the graph approaches the 2 MiB query-reply limit, and
 * decoding ~2 MiB of nested Candid with the JS decoder takes tens of seconds.
 * On the main thread that froze the whole /performance page while another user's
 * chart loaded (the self-chart already avoids this by going through the data
 * worker). A DedicatedWorker is universally supported, so a one-shot fetch needs
 * only this single kind (no SharedWorker variant required).
 */

// @ts-ignore - generated .did.js has no type declarations
import { idlFactory } from '../../../declarations/rewards/rewards.did.js'
import { HttpAgent, Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import type { SerializedCheckpoint } from './shared/chart-compute'

interface FetchReq {
  principal: string
  host: string
  canisterId: string
  fetchRootKey: boolean
}

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

self.onmessage = async (e: MessageEvent<FetchReq>) => {
  const { principal, host, canisterId, fetchRootKey } = e.data || ({} as FetchReq)
  try {
    const agent = new HttpAgent({ host, verifyQuerySignatures: false })
    if (fetchRootKey) await agent.fetchRootKey()
    const actor: any = Actor.createActor(idlFactory, { agent, canisterId })

    const now = BigInt(Date.now()) * 1_000_000n
    // Mirror the main-thread retry: leaderboard data starts Feb 2026; for large
    // accounts the full payload exceeds 2 MiB, so drop the oldest 2 weeks and
    // retry until it fits.
    // Default chart window starts Feb 1, 2026 (when leaderboard data begins).
    // Specific large accounts whose history exceeds the 2 MiB query-reply limit
    // start later to shrink the payload. NOTE: Date.UTC months are 0-indexed —
    // 0 = Jan, 1 = Feb.
    const PRINCIPAL_START_OVERRIDES: Record<string, number> = {
      // dzokeris — very large history; start Feb 10, 2026
      'tvjs2-edxbo-q4pb6-5sitr-2ww7d-au4ky-pl7d5-wx7ai-dia5c-5xcbh-kae': Date.UTC(2026, 1, 10),
    }
    const DATA_START_MS = PRINCIPAL_START_OVERRIDES[principal] ?? Date.UTC(2026, 1, 1)
    const SHIFT_MS = 14 * 24 * 60 * 60 * 1000
    const MAX_SHIFTS = 200
    const tooLarge = (err: any) => {
      const m = err instanceof Error ? err.message : String(err)
      return m.includes('msg_reply_data_append') || m.includes('payload size')
    }

    let result: any
    let shift = 0
    while (shift <= MAX_SHIFTS) {
      // Begin at the account's start date; only shift forward (dropping more
      // early history) if the payload still exceeds the 2 MiB query-reply limit.
      const startMs = DATA_START_MS + shift * SHIFT_MS
      const startTime = BigInt(startMs) * 1_000_000n
      try {
        result = await actor.getUserPerformanceGraphData(Principal.fromText(principal), startTime, now)
        break
      } catch (err) {
        if (!tooLarge(err)) throw err
        shift++
      }
    }
    if (!result) { self.postMessage({ error: 'Could not load performance graph within size limit' }); return }
    if ('err' in result) { self.postMessage({ error: formatErr(result.err) }); return }

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
    const checkpoints: SerializedCheckpoint[] = raw.map((cp: any) => ({
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

    self.postMessage({ checkpoints })
  } catch (err: any) {
    self.postMessage({ error: err?.message || String(err) })
  }
}
