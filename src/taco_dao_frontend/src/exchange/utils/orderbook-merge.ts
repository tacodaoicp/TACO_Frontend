/**
 * Orderbook merge utilities — combines AMM curve discretization with limit orders.
 * Based on Sections 7.4-7.5 of FRONTEND_DEV_GUIDE.md.
 *
 * The AMM's constant-product curve (x * y = k) is discretized into price
 * buckets and merged with limit order levels for a unified orderbook display.
 */

export interface OrderbookLevel {
  price: number
  amount: number
  total: number           // cumulative depth
  source: 'AMM' | 'Limit' | 'Both'
  ammAmount: number
  limitAmount: number
  orders: number          // count of limit orders at this level
}

export interface AMMState {
  reserve0: bigint
  reserve1: bigint
  decimals0: number
  decimals1: number
}

export interface LimitLevel {
  price: number
  amount: number
  orders: number
}

/**
 * Discretize the AMM constant-product curve into price buckets.
 *
 * For each bucket, calculates how much of token0 you'd need to move the price
 * from the current bucket boundary to the next one.
 *
 * @param amm - AMM pool state
 * @param numLevels - Number of levels on each side (bids + asks)
 * @param stepPercent - Step size as a percentage (e.g., 0.1 = 0.1%)
 * @param side - 'bids' (below mid) or 'asks' (above mid)
 */
export function discretizeAMMCurve(
  amm: AMMState,
  numLevels: number,
  stepPercent: number,
  side: 'bids' | 'asks',
): OrderbookLevel[] {
  const r0 = Number(amm.reserve0) / (10 ** amm.decimals0)
  const r1 = Number(amm.reserve1) / (10 ** amm.decimals1)

  if (r0 === 0 || r1 === 0) return []

  const k = r0 * r1
  const midPrice = r1 / r0
  const step = stepPercent / 100
  const levels: OrderbookLevel[] = []

  let cumulativeTotal = 0

  for (let i = 1; i <= numLevels; i++) {
    let price: number
    let amount: number

    if (side === 'asks') {
      // Price increases: selling token0 increases token1/token0 ratio
      price = midPrice * (1 + step * i)
      // How much token0 to sell to move price to this level
      // newR0 = sqrt(k / price), amount = r0 - newR0
      const newR0 = Math.sqrt(k / price)
      const prevR0 = i === 1 ? r0 : Math.sqrt(k / (midPrice * (1 + step * (i - 1))))
      amount = Math.max(0, prevR0 - newR0)
    } else {
      // Price decreases: buying token0 decreases token1/token0 ratio
      price = midPrice * (1 - step * i)
      if (price <= 0) break
      // How much token0 you'd receive buying at this price
      const newR0 = Math.sqrt(k / price)
      const prevR0 = i === 1 ? r0 : Math.sqrt(k / (midPrice * (1 - step * (i - 1))))
      amount = Math.max(0, newR0 - prevR0)
    }

    cumulativeTotal += amount

    levels.push({
      price,
      amount,
      total: cumulativeTotal,
      source: 'AMM',
      ammAmount: amount,
      limitAmount: 0,
      orders: 0,
    })
  }

  return levels
}

/**
 * Merge AMM-discretized levels with limit order levels into a unified orderbook.
 *
 * For overlapping price buckets, amounts are summed and source is marked 'Both'.
 * Levels are sorted by price (ascending for asks, descending for bids).
 *
 * @param ammLevels - Discretized AMM curve levels
 * @param limitLevels - Limit order price levels
 * @param side - 'bids' or 'asks'
 * @param bucketWidth - Price bucket width for grouping (default: use AMM step)
 */
export function mergeOrderbooks(
  ammLevels: OrderbookLevel[],
  limitLevels: LimitLevel[],
  side: 'bids' | 'asks',
  bucketWidth?: number,
): OrderbookLevel[] {
  // Build a price → level map
  const width = bucketWidth ?? (ammLevels.length >= 2
    ? Math.abs(ammLevels[1].price - ammLevels[0].price)
    : 0.0001)

  const buckets = new Map<number, OrderbookLevel>()

  // Helper to bucket a price
  function toBucket(price: number): number {
    return Math.round(price / width) * width
  }

  // Add AMM levels
  for (const level of ammLevels) {
    const key = toBucket(level.price)
    const existing = buckets.get(key)
    if (existing) {
      existing.ammAmount += level.ammAmount
      existing.amount += level.amount
      if (existing.source === 'Limit') existing.source = 'Both'
    } else {
      buckets.set(key, { ...level, price: key })
    }
  }

  // Add limit order levels
  for (const limit of limitLevels) {
    const key = toBucket(limit.price)
    const existing = buckets.get(key)
    if (existing) {
      existing.limitAmount += limit.amount
      existing.amount += limit.amount
      existing.orders += limit.orders
      if (existing.source === 'AMM') existing.source = 'Both'
    } else {
      buckets.set(key, {
        price: key,
        amount: limit.amount,
        total: 0,
        source: 'Limit',
        ammAmount: 0,
        limitAmount: limit.amount,
        orders: limit.orders,
      })
    }
  }

  // Sort and recalculate cumulative totals
  const sorted = Array.from(buckets.values()).sort((a, b) =>
    side === 'asks' ? a.price - b.price : b.price - a.price
  )

  let cumulative = 0
  for (const level of sorted) {
    cumulative += level.amount
    level.total = cumulative
  }

  return sorted
}

/**
 * Calculate the maximum depth for scaling the visual depth bar in the orderbook.
 */
export function maxDepth(levels: OrderbookLevel[]): number {
  if (levels.length === 0) return 0
  return levels[levels.length - 1].total
}

/**
 * Calculate the depth bar width percentage for a given level.
 */
export function depthBarPercent(level: OrderbookLevel, maxTotal: number): number {
  if (maxTotal === 0) return 0
  return (level.total / maxTotal) * 100
}

/**
 * Calculate the spread between best bid and best ask.
 * Returns the spread as a percentage of the mid-price.
 */
export function spreadPercent(bestBid: number, bestAsk: number): number {
  const mid = (bestBid + bestAsk) / 2
  if (mid === 0) return 0
  return ((bestAsk - bestBid) / mid) * 100
}

/**
 * Get spread severity for UI coloring.
 * <0.5% green, 0.5-2% yellow, >2% red
 */
export function spreadSeverity(spreadPct: number): 'tight' | 'normal' | 'wide' {
  if (spreadPct < 0.5) return 'tight'
  if (spreadPct < 2) return 'normal'
  return 'wide'
}
