/**
 * The user's holdings as the token pickers show them, read from the same
 * store.userBalanceQuery cache the Portfolio page uses (so balances stay live
 * and every picker agrees). Shared by TokenSelector and the Sell many picker.
 */
import { useExchangeStore } from '../store/exchange.store'
import { formatTokenAmount, formatUSD } from '../utils/format'
import { ICP_LEDGER_ID } from '../constants/tokens'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export function useHoldings() {
  const store = useExchangeStore()

  /** Load every listed token's balance once (they then stay live like the Portfolio's). */
  function ensureBalances(tokens: readonly TokenInfo[] = store.tokens, maxAgeMs = 30_000) {
    if (!store.isAuthenticated) return
    for (const t of tokens) void store.userBalanceQuery(t.address).ensure(maxAgeMs)
  }

  /** The cached balance (null while unknown). */
  function balanceOf(token: TokenInfo): bigint | null {
    if (!store.isAuthenticated) return null
    return store.userBalanceQuery(token.address).data.value ?? null
  }

  function usdValue(token: TokenInfo): number {
    if (!store.isAuthenticated) return 0
    const bal = store.userBalanceQuery(token.address).data.value ?? 0n
    if (bal === 0n) return 0
    return Number(bal) / 10 ** Number(token.decimals) * store.getTokenPriceUSD(token.address)
  }

  /** Balance and value for the right side of a row, only when worth more than `minUsd`. */
  function holding(token: TokenInfo, minUsd = 0.1): { amount: string; usd: string } | null {
    const usd = usdValue(token)
    if (usd <= minUsd) return null
    const bal = store.userBalanceQuery(token.address).data.value ?? 0n
    return { amount: formatTokenAmount(bal, Number(token.decimals)), usd: formatUSD(usd) }
  }

  // TACO, ICP and ckUSDC always first, then what the user holds (by dollar value), then the rest
  function pinRank(t: TokenInfo): number {
    if (t.symbol === 'TACO') return 0
    if (t.address === ICP_LEDGER_ID) return 1
    if (t.symbol === 'ckUSDC') return 2
    return 3
  }

  function orderTokens<T extends TokenInfo>(tokens: readonly T[]): T[] {
    const value = new Map(tokens.map(t => [t.address, usdValue(t) > 0.1 ? usdValue(t) : 0]))
    return tokens
      .map((t, i) => ({ t, i }))
      .sort((a, b) => pinRank(a.t) - pinRank(b.t)
        || value.get(b.t.address)! - value.get(a.t.address)!
        || a.i - b.i)
      .map(x => x.t)
  }

  return { ensureBalances, balanceOf, usdValue, holding, orderTokens }
}
