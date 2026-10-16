/**
 * What a CrossDEX sale debits from the wallet, per leg, in units of the sold
 * token (f = the token's transfer fee, tf(x) = x × tradingFeeBps / 10000):
 *
 *   ICPSwap     amountIn + 2f              (approve, then transfer_from of the full amount with the fee on top)
 *   TACO V1     amountIn + tf(amountIn) + 2f   (the deposit carries one fee, the ledger charges one)
 *   TACO V2     amountIn + tf(amountIn) + 3f   (approve fee, the gross pull, the transfer_from fee)
 *   Neutrinite  amountIn + f               (plain transfer)
 *
 * sGLDT and EXE get one more f per token (their ledgers trap on exact balances).
 * Pure module, shared by the Max buttons, the Sell many planner and preflight.
 */

import type { CrossDexVenue } from './crossDexOptimizer'

export function tradingFeeOf(amount: bigint, tradingFeeBps: bigint): bigint {
  return (amount * tradingFeeBps) / 10000n
}

/** Wallet debit of one leg. */
export function legDebit(dex: CrossDexVenue, amountIn: bigint, fee: bigint, tradingFeeBps: bigint, v2: boolean): bigint {
  if (amountIn <= 0n) return 0n
  if (dex === 'icpswap') return amountIn + 2n * fee
  if (dex === 'neutrinite') return amountIn + fee
  return amountIn + tradingFeeOf(amountIn, tradingFeeBps) + (v2 ? 3n : 2n) * fee
}

/** Wallet debit of a whole token's plan (every leg plus the headroom fee). */
export function planDebit(
  legs: ReadonlyArray<{ dex: CrossDexVenue; amountIn: bigint }>,
  fee: bigint, tradingFeeBps: bigint, v2: boolean, headroom: boolean,
): bigint {
  let d = headroom ? fee : 0n
  for (const l of legs) d += legDebit(l.dex, l.amountIn, fee, tradingFeeBps, v2)
  return d
}

/**
 * The CrossDEX Max: the balance minus the worst three venue split's fees
 * (ICPSwap 2f, TACO V1 2f or V2 3f, Neutrinite 1f) and the trading fee on the
 * whole balance, one more fee for sGLDT and EXE. 0 when nothing is left.
 */
export function crossDexMax(balance: bigint, fee: bigint, tradingFeeBps: bigint, v2: boolean, headroom: boolean): bigint {
  const reserve = fee * (v2 ? 6n : 5n) + (headroom ? fee : 0n) + tradingFeeOf(balance, tradingFeeBps)
  return balance > reserve ? balance - reserve : 0n
}
