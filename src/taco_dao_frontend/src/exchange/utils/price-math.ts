/**
 * Price and ratio math utilities for the exchange.
 * Based on Sections 6.1, 7.2 of FRONTEND_DEV_GUIDE.md.
 *
 * The contract uses (amount_sell, amount_init) pairs, NOT a price number.
 * Internal ratio: Ratio = amount_sell * 10^60 / amount_init
 */

import type { Ratio } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const RATIO_SCALE = 10n ** 60n

/**
 * Convert a Ratio variant to a human-readable price number.
 * Returns null for Max or Zero sentinels.
 *
 * The canister stores ratios as amount_init * 10^60 / amount_sell in the forward direction.
 * To get price (sell per init), we invert: price = 10^60 / ratio * 10^decimalsSell / 10^decimalsInit
 *
 * @param ratio - The ratio from getCurrentLiquidity
 * @param decimals0 - Decimals of token0 (first token in the pair)
 * @param decimals1 - Decimals of token1 (second token in the pair)
 * @param invert - If true, invert the ratio (used for asks/forward direction)
 */
export function ratioToPrice(
  ratio: Ratio,
  decimals0: number,
  decimals1: number,
  invert: boolean = false,
): number | null {
  if ('Max' in ratio || 'Zero' in ratio) return null
  const r = Number(ratio.Value) / 1e60
  if (r === 0) return null
  if (invert) {
    // Forward/asks: ratio = init * 10^60 / sell → price = 1/r adjusted for decimals
    return (1 / r) * (10 ** decimals0) / (10 ** decimals1)
  }
  // Backward/bids: ratio = sell * 10^60 / init → price = r adjusted for decimals
  return r * (10 ** decimals0) / (10 ** decimals1)
}

/**
 * Convert a price number to a Ratio variant.
 * price = sell per init in human-readable terms
 */
export function priceToRatio(
  price: number,
  decimalsInit: number,
  decimalsSell: number,
): Ratio {
  const adjusted = price * (10 ** decimalsSell) / (10 ** decimalsInit)
  const value = BigInt(Math.round(adjusted * 1e60))
  return { Value: value }
}

/**
 * Create BUY order parameters.
 * User wants to buy `quantity` of tokenA at `price` tokenB per tokenA.
 * User deposits tokenB (the payment token).
 *
 * @returns { amount_sell, amount_init, token_sell, token_init }
 *   where amount_sell = what user wants to receive (tokenA)
 *   and amount_init = what user offers (tokenB)
 */
export function createBuyOrderParams(
  quantity: bigint,
  price: number,
  decimalsA: number,
  decimalsB: number,
): { amount_sell: bigint; amount_init: bigint } {
  const amountSell = quantity
  const amountInit = BigInt(Math.round(
    Number(quantity) * price * (10 ** decimalsB) / (10 ** decimalsA)
  ))
  return { amount_sell: amountSell, amount_init: amountInit }
}

/**
 * Create SELL order parameters.
 * User wants to sell `quantity` of tokenA at `price` tokenB per tokenA.
 * User deposits tokenA (the token being sold).
 *
 * @returns { amount_sell, amount_init }
 *   where amount_sell = what user wants to receive (tokenB)
 *   and amount_init = what user offers (tokenA)
 */
export function createSellOrderParams(
  quantity: bigint,
  price: number,
  decimalsA: number,
  decimalsB: number,
): { amount_sell: bigint; amount_init: bigint } {
  const amountInit = quantity
  const amountSell = BigInt(Math.round(
    Number(quantity) * price * (10 ** decimalsB) / (10 ** decimalsA)
  ))
  return { amount_sell: amountSell, amount_init: amountInit }
}

/**
 * Calculate the price of an order from its amounts.
 * Returns price in tokenSell per tokenInit (quote token per base token).
 */
export function orderPrice(
  amountSell: bigint,
  amountInit: bigint,
  decimalsSell: number,
  decimalsInit: number,
): number {
  if (amountInit === 0n) return 0
  return (Number(amountSell) / 10 ** decimalsSell) / (Number(amountInit) / 10 ** decimalsInit)
}

/**
 * Calculate the fill percentage of a partially filled order.
 */
export function fillPercentage(filledInit: bigint, amountInit: bigint): number {
  const total = filledInit + amountInit
  if (total === 0n) return 0
  return Number(filledInit) / Number(total) * 100
}

/**
 * Calculate revoke fee for cancelling an order.
 * fee = amount * tradingFee / (10000 * revokeDivisor)
 * Default: amount * 5 / 50000 = 0.01%
 */
export function calculateRevokeFee(
  amount: bigint,
  tradingFeeBps: bigint,
  revokeDivisor: bigint,
): bigint {
  return (amount * tradingFeeBps) / (10000n * revokeDivisor)
}

/**
 * Calculate price impact as a percentage.
 * Compares the execution price to the current market mid-price.
 */
export function priceImpactPercent(executionPrice: number, midPrice: number): number {
  if (midPrice === 0) return 0
  return Math.abs((executionPrice - midPrice) / midPrice) * 100
}

/**
 * Get the price impact severity tier for UI coloring.
 * Based on Section 5.10 of the guide.
 */
export function priceImpactTier(impactPct: number): 'low' | 'moderate' | 'high' | 'extreme' {
  if (impactPct < 0.5) return 'low'
  if (impactPct < 2) return 'moderate'
  if (impactPct < 5) return 'high'
  return 'extreme'
}
