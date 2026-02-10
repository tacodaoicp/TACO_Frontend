/**
 * Chart Computation Module
 *
 * Pure computation functions for PerformanceChart — runs in a Web Worker
 * to keep the main thread free. All data is pre-serialized (no IC Principal
 * objects or BigInts).
 */

// --- Types ---

export interface SerializedAllocation {
  token: string       // Principal as string
  basisPoints: number
}

export interface SerializedPriceInfo {
  usdPrice: number
  icpPrice: number    // nat in e8s, already converted to number
}

export interface SerializedCheckpoint {
  timestamp: number   // nanoseconds as number
  allocations: SerializedAllocation[]
  pricesUsed: [string, SerializedPriceInfo][]
  totalPortfolioValueUSD: number
  totalPortfolioValueICP: number
  reason: string[]
}

export interface SeriesDataPoint {
  x: number              // timestamp in ms
  y: number              // return %
  checkpointIndex: number // index into original checkpoints array
}

export interface TooltipTokenData {
  symbol: string
  percent: string          // allocation % formatted
  usdChange: number | null // % change to next visible checkpoint
  icpChange: number | null // null for ICP token itself
}

export interface TooltipCheckpointData {
  tokens: TooltipTokenData[]
  nextCheckpointIndex: number | null
}

export interface ComputeRequest {
  checkpoints: SerializedCheckpoint[]
  baselineIndex: number
  tokenSymbolMap: Record<string, string>
  isLocal: boolean
}

export interface ComputeResult {
  usdSeries: SeriesDataPoint[]
  icpSeries: SeriesDataPoint[]
  tooltipData: Record<number, TooltipCheckpointData>
}

// --- Helpers ---

/** Compare allocations at display precision (0.1%) */
function allocationsEqual(
  alloc1: SerializedAllocation[] | null | undefined,
  alloc2: SerializedAllocation[] | null | undefined
): boolean {
  if (!alloc1 && !alloc2) return true
  if (!alloc1 || !alloc2) return false

  const map1 = new Map<string, string>()
  const map2 = new Map<string, string>()

  for (const a of alloc1) {
    if (a.basisPoints === 0) continue
    map1.set(a.token, (a.basisPoints / 100).toFixed(1))
  }
  for (const a of alloc2) {
    if (a.basisPoints === 0) continue
    map2.set(a.token, (a.basisPoints / 100).toFixed(1))
  }

  if (map1.size !== map2.size) return false
  for (const [token, bp] of map1) {
    if (map2.get(token) !== bp) return false
  }
  return true
}

/** Check if any allocated token has ≥0.05% USD price movement */
function hasPriceMovement(cp: SerializedCheckpoint, nextCp: SerializedCheckpoint): boolean {
  if (!cp?.allocations || !cp?.pricesUsed || !nextCp?.pricesUsed) return false
  for (const alloc of cp.allocations) {
    if (alloc.basisPoints === 0) continue
    const curEntry = cp.pricesUsed.find(([p]) => p === alloc.token)
    const nextEntry = nextCp.pricesUsed.find(([p]) => p === alloc.token)
    if (curEntry && nextEntry) {
      const curPrice = curEntry[1].usdPrice
      const nextPrice = nextEntry[1].usdPrice
      if (curPrice > 0) {
        const change = Math.abs(((nextPrice - curPrice) / curPrice) * 100)
        if (change >= 0.05) return true
      }
    }
  }
  return false
}

/** Get token symbol from map, with fallback to shortened principal */
function getSymbol(tokenStr: string, symbolMap: Record<string, string>): string {
  return symbolMap[tokenStr] || (tokenStr.length > 10 ? tokenStr.substring(0, 5) + '...' : tokenStr)
}

/** Get ICP's own USD price from a checkpoint's pricesUsed */
function getIcpUsdPrice(cp: SerializedCheckpoint): number | null {
  const icpEntry = cp.pricesUsed.find(([_, info]) => info.icpPrice === 100000000)
  return icpEntry && icpEntry[1].usdPrice > 0 ? icpEntry[1].usdPrice : null
}

/** Get ICP-denominated price for a token, with USD fallback */
function getPriceIcp(cp: SerializedCheckpoint, tokenStr: string): number | null {
  const priceEntry = cp.pricesUsed.find(([p]) => p === tokenStr)
  if (!priceEntry) return null
  const icpRaw = priceEntry[1].icpPrice
  if (icpRaw > 0) return icpRaw / 1e8
  // Fallback: derive from USD price / ICP's USD price
  const tokenUsd = priceEntry[1].usdPrice
  if (!tokenUsd || tokenUsd <= 0) return null
  const icpUsdPrice = getIcpUsdPrice(cp)
  if (icpUsdPrice) {
    return tokenUsd / icpUsdPrice
  }
  return null
}

// --- Core: two-pass filter + return calculation ---

interface FilterEntry {
  cp: SerializedCheckpoint
  origIdx: number
  status: 'keep' | 'candidate' | 'skip'
  reason: string
}

function buildSeriesData(
  checkpoints: SerializedCheckpoint[],
  baselineIdx: number,
  valueKey: 'totalPortfolioValueUSD' | 'totalPortfolioValueICP',
  symbolMap: Record<string, string>,
  isLocal: boolean
): { series: SeriesDataPoint[], keptEntries: FilterEntry[] } {
  if (!checkpoints.length) return { series: [], keptEntries: [] }

  const bIdx = Math.min(baselineIdx, checkpoints.length - 1)
  const baselineCp = checkpoints[bIdx]
  if (!baselineCp) return { series: [], keptEntries: [] }

  const baseVal = baselineCp[valueKey] || 1
  const relevant = checkpoints.slice(bIdx)

  // --- Pass 1: classify as KEEP or CANDIDATE ---
  const entries: FilterEntry[] = []
  let lastAlloc: SerializedAllocation[] | null = null

  for (let i = 0; i < relevant.length; i++) {
    const cp = relevant[i]
    const origIdx = bIdx + i
    const isFirst = i === 0
    const isLast = i === relevant.length - 1

    if (isFirst || isLast) {
      entries.push({ cp, origIdx, status: 'keep', reason: isFirst ? 'first' : 'last' })
      lastAlloc = cp.allocations
    } else if (!allocationsEqual(cp.allocations, lastAlloc)) {
      entries.push({ cp, origIdx, status: 'keep', reason: 'alloc changed' })
      lastAlloc = cp.allocations
    } else {
      entries.push({ cp, origIdx, status: 'candidate', reason: '' })
    }
  }

  // --- Pass 2: backward within same-alloc runs ---
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].status !== 'candidate') continue

    let nextKeep: FilterEntry | null = null
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[j].status === 'keep') {
        nextKeep = entries[j]
        break
      }
    }

    if (nextKeep && hasPriceMovement(entries[i].cp, nextKeep.cp)) {
      entries[i].status = 'keep'
      entries[i].reason = 'same alloc, price mov to visible'
    } else {
      entries[i].status = 'skip'
      entries[i].reason = nextKeep ? 'same alloc, no price mov' : 'same alloc, no next keep'
    }
  }

  const keptEntries = entries.filter(e => e.status === 'keep')

  // Debug logging (only on localhost)
  if (isLocal) {
    const fmtAlloc = (allocs: SerializedAllocation[]) => {
      if (!allocs) return 'none'
      return allocs
        .filter(a => a.basisPoints > 0)
        .map(a => `${getSymbol(a.token, symbolMap)}:${(a.basisPoints / 100).toFixed(1)}%`)
        .sort()
        .join(' ')
    }
    const fmtPriceMovement = (cp: SerializedCheckpoint, nextCp: SerializedCheckpoint) => {
      if (!cp?.allocations || !cp?.pricesUsed || !nextCp?.pricesUsed) return 'n/a'
      return cp.allocations
        .filter(a => a.basisPoints > 0)
        .map(a => {
          const sym = getSymbol(a.token, symbolMap)
          const curEntry = cp.pricesUsed.find(([p]) => p === a.token)
          const nextEntry = nextCp.pricesUsed.find(([p]) => p === a.token)
          if (curEntry && nextEntry && curEntry[1].usdPrice > 0) {
            const change = ((nextEntry[1].usdPrice - curEntry[1].usdPrice) / curEntry[1].usdPrice) * 100
            return `${sym}:${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
          }
          return `${sym}:?`
        })
        .sort()
        .join(' ')
    }

    const dbg: Array<Record<string, unknown>> = []
    for (let ei = 0; ei < entries.length; ei++) {
      const e = entries[ei]
      const ts = new Date(e.cp.timestamp / 1_000_000).toLocaleString()
      const alloc = fmtAlloc(e.cp.allocations)
      let priceMove = ''
      for (let ej = ei + 1; ej < entries.length; ej++) {
        if (entries[ej].status === 'keep') {
          priceMove = fmtPriceMovement(e.cp, entries[ej].cp)
          break
        }
      }
      const action = e.status === 'keep' ? `KEEP (${e.reason})` : `SKIP (${e.reason})`
      dbg.push({ idx: e.origIdx, ts, action, alloc, priceMove })
    }
    console.log(
      `%c[ChartWorker] buildSeriesData (${valueKey}): ${relevant.length} checkpoints → ${keptEntries.length} kept`,
      'color: orange; font-weight: bold'
    )
    console.table(dbg)
  }

  // Build series data points, dropping abnormal jumps (±700% between consecutive points)
  const raw: SeriesDataPoint[] = []
  for (const e of keptEntries) {
    const val = e.cp[valueKey]
    if (val == null || val <= 0) continue
    const ret = ((val / baseVal) - 1) * 100
    raw.push({
      x: e.cp.timestamp / 1_000_000,
      y: parseFloat(ret.toFixed(2)),
      checkpointIndex: e.origIdx
    })
  }
  raw.sort((a, b) => a.x - b.x)

  const series: SeriesDataPoint[] = []
  for (let i = 0; i < raw.length; i++) {
    if (series.length === 0) {
      series.push(raw[i])
      continue
    }
    const lastKept = series[series.length - 1]
    const jump = raw[i].y - lastKept.y
    if (Math.abs(jump) >= 700) {
      if (isLocal) {
        console.log(
          `%c[ChartWorker] Dropped abnormal checkpoint ${raw[i].checkpointIndex} (${valueKey}): ${lastKept.y}% → ${raw[i].y}% (jump: ${jump >= 0 ? '+' : ''}${jump.toFixed(1)}%)`,
          'color: red'
        )
      }
      continue
    }
    series.push(raw[i])
  }
  return { series, keptEntries }
}

// --- Tooltip pre-computation ---

function computeTooltipData(
  keptEntries: FilterEntry[],
  symbolMap: Record<string, string>
): Record<number, TooltipCheckpointData> {
  const result: Record<number, TooltipCheckpointData> = {}

  // Build a quick index: kept entry position by origIdx
  const keptByOrigIdx = new Map<number, number>()
  for (let i = 0; i < keptEntries.length; i++) {
    keptByOrigIdx.set(keptEntries[i].origIdx, i)
  }

  for (let ki = 0; ki < keptEntries.length; ki++) {
    const entry = keptEntries[ki]
    const cp = entry.cp
    const nextEntry = ki + 1 < keptEntries.length ? keptEntries[ki + 1] : null
    const nextCp = nextEntry?.cp ?? null

    const tokens: TooltipTokenData[] = []

    if (cp.allocations) {
      for (const alloc of cp.allocations) {
        if (alloc.basisPoints <= 0) continue

        const symbol = getSymbol(alloc.token, symbolMap)
        const percent = (alloc.basisPoints / 100).toFixed(1)

        let usdChange: number | null = null
        let icpChange: number | null = null

        if (nextCp) {
          // USD price change
          const curUsdEntry = cp.pricesUsed.find(([p]) => p === alloc.token)
          const nextUsdEntry = nextCp.pricesUsed.find(([p]) => p === alloc.token)
          if (curUsdEntry && nextUsdEntry && curUsdEntry[1].usdPrice > 0) {
            const change = ((nextUsdEntry[1].usdPrice - curUsdEntry[1].usdPrice) / curUsdEntry[1].usdPrice) * 100
            if (Math.abs(change) >= 0.005) {
              usdChange = change
            }
          }

          // ICP price change — skip for ICP itself
          const isIcpToken = curUsdEntry && curUsdEntry[1].icpPrice === 100000000
          if (!isIcpToken) {
            const currentIcp = getPriceIcp(cp, alloc.token)
            const nextIcp = nextCp ? getPriceIcp(nextCp, alloc.token) : null
            if (currentIcp && nextIcp && currentIcp > 0) {
              const change = ((nextIcp - currentIcp) / currentIcp) * 100
              if (Math.abs(change) >= 0.005) {
                icpChange = change
              }
            }
          }
        }

        tokens.push({ symbol, percent, usdChange, icpChange })
      }
    }

    result[entry.origIdx] = {
      tokens,
      nextCheckpointIndex: nextEntry?.origIdx ?? null
    }
  }

  return result
}

// --- Main entry point ---

export function computeAll(request: ComputeRequest): ComputeResult {
  const { checkpoints, baselineIndex, tokenSymbolMap, isLocal } = request

  const usd = buildSeriesData(checkpoints, baselineIndex, 'totalPortfolioValueUSD', tokenSymbolMap, isLocal)

  const icp = buildSeriesData(checkpoints, baselineIndex, 'totalPortfolioValueICP', tokenSymbolMap, isLocal)

  // Use USD kept entries for tooltip (both series share same checkpoints)
  const tooltipData = computeTooltipData(usd.keptEntries, tokenSymbolMap)

  return {
    usdSeries: usd.series,
    icpSeries: icp.series,
    tooltipData
  }
}
