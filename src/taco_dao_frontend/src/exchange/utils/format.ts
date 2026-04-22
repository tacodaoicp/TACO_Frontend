/**
 * Number, timestamp, and percentage formatting utilities for the exchange UI.
 * Follows Section 21.9 of FRONTEND_DEV_GUIDE.md.
 */

/** Decimal places by context */
const CONTEXT_DECIMALS: Record<string, number> = {
  ICP: 4,
  ckUSDC: 2,
  ckUSDT: 2,
  price: 6,
  percentage: 2,
  poolShare: 4,
}

/**
 * Format a bigint token amount with dynamic decimals.
 * value >= 1000 → 2 decimals
 * value >= 1    → 4 decimals
 * value < 1     → 8 decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number, symbol?: string): string {
  const value = Number(amount) / (10 ** decimals)
  const displayDecimals = value >= 1000 ? 2 : value >= 1 ? 4 : 8
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: displayDecimals,
  })
  return symbol ? `${formatted} ${symbol}` : formatted
}

/**
 * Format a raw bigint amount to a decimal string with full precision.
 */
export function formatRawAmount(amount: bigint, decimals: number): string {
  const dec = Number(decimals)
  const divisor = 10n ** BigInt(dec)
  const whole = amount / divisor
  const fraction = (amount % divisor).toString().padStart(dec, '0')
  // Trim trailing zeros, keep at least 2 decimal places
  const trimmed = fraction.replace(/0+$/, '')
  const finalFraction = trimmed.length < 2 ? fraction.slice(0, 2) : trimmed
  return `${whole}.${finalFraction}`
}

/**
 * Parse a human-readable amount string to bigint base units.
 */
export function parseTokenAmount(amountStr: string, decimals: number): bigint {
  const parts = amountStr.split('.')
  const whole = BigInt(parts[0] || '0') * 10n ** BigInt(decimals)
  const fraction = parts[1]
    ? BigInt(parts[1].padEnd(decimals, '0').slice(0, decimals))
    : 0n
  return whole + fraction
}

/**
 * Format large numbers with abbreviations (K, M, B).
 */
export function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toLocaleString()
}

/**
 * Format a price value with appropriate decimal places.
 * Never shows more decimals than maxDecimals (should be set to the token's decimals).
 *
 * @param price - The price number
 * @param maxDecimals - Maximum decimal places (default 8). Set to token decimals.
 * @param fixedDecimals - If set, always use exactly this many decimals (for orderbook precision).
 */
export function formatPrice(price: number, maxDecimals: number = 8, fixedDecimals?: number): string {
  if (fixedDecimals !== undefined) {
    return price.toFixed(Math.min(fixedDecimals, maxDecimals))
  }
  const dp = price >= 1000 ? Math.min(2, maxDecimals)
           : price >= 1 ? Math.min(4, maxDecimals)
           : Math.min(maxDecimals, 8)
  return price.toFixed(dp)
}

/**
 * Format a human-readable number amount, capped to token decimals.
 */
export function formatAmountNum(value: number, tokenDecimals: number): string {
  const dp = value >= 1000 ? Math.min(2, tokenDecimals)
           : value >= 1 ? Math.min(4, tokenDecimals)
           : Math.min(tokenDecimals, 8)
  return value.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, dp),
    maximumFractionDigits: dp,
  })
}

/**
 * Format a percentage with sign. Always shows sign for positive values.
 */
export function formatPercentage(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return sign + pct.toFixed(2) + '%'
}

/**
 * Format a nanosecond IC timestamp to relative or absolute time.
 */
export function formatTimestamp(nsTimestamp: bigint): string {
  const ms = Number(nsTimestamp / 1_000_000n)
  const diff = Date.now() - ms
  if (diff < 60_000) return Math.floor(diff / 1000) + 's ago'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a nanosecond timestamp to full date/time string.
 */
export function formatFullTimestamp(nsTimestamp: bigint): string {
  const ms = Number(nsTimestamp / 1_000_000n)
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Truncate a principal to "xxxxx...xxx" format.
 */
/**
 * Format a USD value with appropriate precision.
 * >= $1: two decimals. >= $0.01: four decimals. < $0.01: three significant figures.
 */
export function formatUSD(value: number): string {
  if (!value || !isFinite(value)) return ''
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toPrecision(3)}`
}

export function truncatePrincipal(principal: string, startLen = 5, endLen = 3): string {
  if (principal.length <= startLen + endLen + 3) return principal
  return `${principal.slice(0, startLen)}...${principal.slice(-endLen)}`
}
