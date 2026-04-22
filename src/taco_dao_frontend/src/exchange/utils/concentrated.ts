/**
 * Concentrated liquidity utilities.
 * Price conversion between human-readable and Ratio (Nat scaled by 10^60).
 * Amount calculations for ranged positions.
 */

export const RATIO_SCALE = 10n ** 60n
export const FULL_RANGE_LOWER = 10n ** 20n
export const FULL_RANGE_UPPER = 10n ** 120n

function clampOffSentinel(ratio: bigint): bigint {
  if (ratio <= 0n) return 1n
  if (ratio === FULL_RANGE_LOWER) return FULL_RANGE_LOWER + 1n
  if (ratio === FULL_RANGE_UPPER) return FULL_RANGE_UPPER - 1n
  return ratio
}

/**
 * Convert human-readable price to Ratio (bigint) for addConcentratedLiquidity.
 * price = token1 per token0 in human units.
 * ratio = (price * 10^decimals0 / 10^decimals1) * 10^60
 * Never returns the exact FULL_RANGE_LOWER (10^20) or FULL_RANGE_UPPER (10^120)
 * sentinels — those are reserved by the backend for the V2 full-range path.
 */
export function priceToRatio(price: number, decimals0: number, decimals1: number): bigint {
  if (price <= 0) return 1n
  // Use string-based conversion to avoid Number overflow
  // Split price into integer and fractional parts for precision
  const decimalsDiff = decimals0 - decimals1
  const totalScale = 60 + decimalsDiff // RATIO_SCALE * 10^decimalsDiff

  if (totalScale >= 0) {
    // Multiply price by 10^totalScale
    const scaleFactor = 10n ** BigInt(totalScale)
    // Convert price to BigInt-safe representation
    const priceStr = price.toFixed(20) // max precision
    const [intPart, fracPart = ''] = priceStr.split('.')
    const combined = BigInt(intPart + fracPart.padEnd(20, '0'))
    const result = combined * scaleFactor / (10n ** 20n) // divide out the 20 decimal places
    return clampOffSentinel(result)
  } else {
    // Scale is negative — divide
    const scaleFactor = 10n ** BigInt(-totalScale)
    const priceStr = price.toFixed(20)
    const [intPart, fracPart = ''] = priceStr.split('.')
    const combined = BigInt(intPart + fracPart.padEnd(20, '0'))
    const result = combined / (scaleFactor * (10n ** 20n))
    return clampOffSentinel(result)
  }
}

/**
 * Convert Ratio (bigint) to human-readable price for display.
 * Handles very large ratios safely.
 */
export function ratioToHumanPrice(ratio: bigint, decimals0: number, decimals1: number): number {
  if (ratio <= 0n) return 0
  const decimalsDiff = decimals1 - decimals0

  // raw = ratio / 10^60
  // price = raw * 10^(decimals1 - decimals0)
  // = ratio * 10^(decimals1 - decimals0) / 10^60
  // = ratio / 10^(60 - decimals1 + decimals0)

  const divisorExp = 60 - decimalsDiff
  if (divisorExp >= 0) {
    const divisor = 10n ** BigInt(divisorExp)
    // Use integer division + remainder for precision
    const intPart = ratio / divisor
    const remainder = ratio % divisor
    return Number(intPart) + Number(remainder) / Number(divisor)
  } else {
    const multiplier = 10n ** BigInt(-divisorExp)
    return Number(ratio * multiplier)
  }
}

/**
 * Check if a position is full-range.
 * Backend's canonical full-range marker is ratioLower === 10^20 (FULL_RANGE_LOWER).
 * Legacy positions may have used ratioLower <= 2n instead — keep that path for safety.
 */
export function isFullRange(ratioLower: bigint, ratioUpper: bigint): boolean {
  if (ratioLower === FULL_RANGE_LOWER) return true
  return ratioLower <= 2n && ratioUpper >= 10n ** 119n
}

/**
 * Display-oriented full-range check. A range counts as "effectively" full when
 * its upper bound is at (or very near) the MAX sentinel AND its lower bound
 * represents a price visually indistinguishable from zero. Use in chart axis
 * decisions and pool-level Active Ranges display; keep `isFullRange` for
 * strict classification of a user's own positions.
 */
export function isEffectivelyFullRange(ratioLower: bigint, ratioUpper: bigint): boolean {
  if (ratioLower <= 2n && ratioUpper >= 10n ** 119n) return true
  return ratioUpper >= 10n ** 100n && ratioLower < 10n ** 40n
}

/**
 * Check if current price is within a position's range.
 */
export function isInRange(currentPrice: number, priceLower: number, priceUpper: number): boolean {
  return currentPrice >= priceLower && currentPrice <= priceUpper
}

/**
 * Auto-calculate token amounts for a concentrated range given one input amount.
 * Uses Uniswap V3 concentrated liquidity formula:
 * L = amount0 * sqrtCurrent * sqrtUpper / (sqrtUpper - sqrtCurrent)
 * amount1 = L * (sqrtCurrent - sqrtLower)
 */
export function calculateAmounts(
  inputAmount: number,
  inputIsToken0: boolean,
  currentPrice: number,
  priceLower: number,
  priceUpper: number,
): { amount0: number; amount1: number } {
  if (priceLower < 0 || priceUpper <= 0 || priceLower >= priceUpper || currentPrice <= 0) {
    return { amount0: inputIsToken0 ? inputAmount : 0, amount1: inputIsToken0 ? 0 : inputAmount }
  }

  if (currentPrice <= priceLower) {
    // Below range: only token0 needed
    return inputIsToken0
      ? { amount0: inputAmount, amount1: 0 }
      : { amount0: 0, amount1: 0 }
  }

  if (currentPrice >= priceUpper) {
    // Above range: only token1 needed
    return inputIsToken0
      ? { amount0: 0, amount1: 0 }
      : { amount0: 0, amount1: inputAmount }
  }

  // In range: need both tokens
  const sqrtCurr = Math.sqrt(currentPrice)
  const sqrtLow = Math.sqrt(priceLower)
  const sqrtUp = Math.sqrt(priceUpper)

  if (inputIsToken0) {
    const denom = sqrtUp - sqrtCurr
    if (denom <= 0) return { amount0: inputAmount, amount1: 0 }
    const L = inputAmount * sqrtCurr * sqrtUp / denom
    const amount1 = L * (sqrtCurr - sqrtLow)
    return { amount0: inputAmount, amount1: Math.max(0, amount1) }
  } else {
    const denom = sqrtCurr - sqrtLow
    if (denom <= 0) return { amount0: 0, amount1: inputAmount }
    const L = inputAmount / denom
    const amount0 = L * (sqrtUp - sqrtCurr) / (sqrtCurr * sqrtUp)
    return { amount0: Math.max(0, amount0), amount1: inputAmount }
  }
}

/**
 * Compute token amounts held by a concentrated liquidity position.
 * Inverse of the V3 formula: given raw L (liquidity), currentPrice, and range bounds,
 * returns raw token amounts (in smallest units, matching the backend's bigint format).
 *
 * The V3 formula uses raw prices, but we have human-readable prices. The conversion
 * factor between raw and human prices is 10^((dec0-dec1)/2) for amount0 and inverse
 * for amount1. This function handles the correction internally.
 */
export function liquidityToAmounts(
  liquidity: number,
  currentPrice: number,
  priceLower: number,
  priceUpper: number,
  decimals0: number,
  decimals1: number,
): { amount0: number; amount1: number } {
  if (liquidity <= 0 || priceLower <= 0 || priceUpper <= priceLower || currentPrice <= 0) {
    return { amount0: 0, amount1: 0 }
  }

  const sqrtLow = Math.sqrt(priceLower)
  const sqrtUp = Math.sqrt(priceUpper)

  // Correction for using human prices with raw liquidity
  const decHalf = (decimals0 - decimals1) / 2
  const scale0 = Math.pow(10, decHalf)   // multiply amount0 by this
  const scale1 = Math.pow(10, -decHalf)  // multiply amount1 by this

  if (currentPrice <= priceLower) {
    return {
      amount0: liquidity * (1 / sqrtLow - 1 / sqrtUp) * scale0,
      amount1: 0,
    }
  }

  if (currentPrice >= priceUpper) {
    return {
      amount0: 0,
      amount1: liquidity * (sqrtUp - sqrtLow) * scale1,
    }
  }

  const sqrtCurr = Math.sqrt(currentPrice)
  return {
    amount0: liquidity * (1 / sqrtCurr - 1 / sqrtUp) * scale0,
    amount1: liquidity * (sqrtCurr - sqrtLow) * scale1,
  }
}

/**
 * Capital efficiency multiplier vs full range.
 * Capped at 500x to avoid display issues.
 */
export function capitalEfficiency(priceLower: number, priceUpper: number): number {
  if (priceLower <= 0 || priceUpper <= priceLower) return 1
  const sqrtRatio = Math.sqrt(priceUpper / priceLower)
  if (sqrtRatio <= 1.0001) return 500 // cap at 500x
  const eff = sqrtRatio / (sqrtRatio - 1)
  return Math.min(eff, 500)
}

/**
 * Estimated APR based on 24h fees and TVL in range.
 */
export function estimatedAPR(fee24h: number, tvlInRange: number): number {
  if (tvlInRange <= 0) return 0
  return (fee24h * 365 / tvlInRange) * 100
}

/**
 * Format price for range display.
 */
export function formatRangePrice(price: number, maxDecimals: number = 6): string {
  if (price <= 0) return '0'
  if (!isFinite(price)) return '∞'
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(2) + 'M'
  if (price >= 1_000) return (price / 1_000).toFixed(2) + 'K'
  if (price >= 1) return price.toFixed(Math.min(4, maxDecimals))
  // Small prices: show significant digits
  const str = price.toFixed(maxDecimals)
  return str.replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * Parse addConcentratedLiquidity result: "concentrated:LIQUIDITY:POSITION_ID"
 */
export function parseAddResult(result: string): { liquidity: bigint; positionId: bigint } | null {
  if (!result.startsWith('concentrated:')) return null
  try {
    const parts = result.split(':')
    return { liquidity: BigInt(parts[1]), positionId: BigInt(parts[2]) }
  } catch { return null }
}

/**
 * Parse removeConcentratedLiquidity result: "removed:AMOUNT0:AMOUNT1"
 */
export function parseRemoveResult(result: string): { amount0: bigint; amount1: bigint } | null {
  if (!result.startsWith('removed:')) return null
  try {
    const parts = result.split(':')
    return { amount0: BigInt(parts[1]), amount1: BigInt(parts[2]) }
  } catch { return null }
}
