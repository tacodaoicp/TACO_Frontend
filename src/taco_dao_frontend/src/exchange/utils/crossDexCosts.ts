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

/** What a TACO V1 deposit transfers (and the V2 gross): amount + trading fee + one transfer fee. */
export function requiredDeposit(tradeAmount: bigint, tradingFeeBps: bigint, transferFee: bigint): bigint {
  return tradeAmount + tradingFeeOf(tradeAmount, tradingFeeBps) + transferFee
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

/**
 * Sell all exactly (Sell many rows at Max): the largest total whose exact debit
 * (the venues of the confirmed plan, at the same shares) fits the fresh balance.
 * Closed form A = (balance − fixed fees) / (1 + tacoShare × bps / 10000), then
 * checked against the exact debit. Returns null when nothing larger than the
 * confirmed total fits (the row then keeps its confirmed amount).
 */
export function sellAllExactlyTotal(
  balance: bigint,
  legs: ReadonlyArray<{ dex: CrossDexVenue; amountIn: bigint }>,
  fee: bigint, tradingFeeBps: bigint, v2: boolean, headroom: boolean,
): bigint | null {
  const confirmed = legs.reduce((a, l) => a + l.amountIn, 0n)
  if (confirmed <= 0n) return null
  const fixed = (headroom ? fee : 0n) + legs.reduce((a, l) =>
    a + (l.dex === 'icpswap' ? 2n * fee : l.dex === 'neutrinite' ? fee : (v2 ? 3n : 2n) * fee), 0n)
  if (balance <= fixed) return null
  const taco = legs.filter(l => l.dex === 'taco').reduce((a, l) => a + l.amountIn, 0n)
  let A = ((balance - fixed) * confirmed * 10000n) / (confirmed * 10000n + taco * tradingFeeBps)
  // exact check with the scaled legs (floor rounding can leave a unit over)
  for (let guard = 0; guard < 8 && A > 0n; guard++) {
    const scaled = scaleAmounts(legs.map(l => l.amountIn), A)
    const d = planDebit(legs.map((l, i) => ({ dex: l.dex, amountIn: scaled[i] })), fee, tradingFeeBps, v2, headroom)
    if (d <= balance) break
    A -= d - balance
  }
  return A > confirmed ? A : null
}

/** Pro rata amounts summing to exactly `total` (remainder on the largest). */
export function scaleAmounts(amounts: readonly bigint[], total: bigint): bigint[] {
  const sum = amounts.reduce((a, b) => a + b, 0n)
  if (sum <= 0n) return amounts.map(() => 0n)
  const out = amounts.map(a => (a * total) / sum)
  const assigned = out.reduce((a, b) => a + b, 0n)
  let k = 0
  amounts.forEach((a, i) => { if (a > amounts[k]) k = i })
  out[k] += total - assigned
  return out
}
