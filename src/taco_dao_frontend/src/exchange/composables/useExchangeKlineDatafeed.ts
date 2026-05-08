/**
 * Exchange-side adapter that exposes the existing exchange store's kline API
 * through the generic KlineDatafeed contract used by TradingChart.
 *
 * Behavior is identical to the previous direct-store-coupling: same backend
 * actor (anonymous query), same pool_canister-based pair-inversion detection,
 * same orderbook-derived live price for tail-candle updates.
 */

import { storeToRefs } from 'pinia'
import { useExchangeStore } from '../store/exchange.store'
import type { KlineDatafeed, KlineData, TimeFrame } from '../../components/charts/types'

export function useExchangeKlineDatafeed(): KlineDatafeed {
  const store = useExchangeStore()
  const { effectivePrice } = storeToRefs(store)

  return {
    getRange(token0, token1, timeframe, before, limit) {
      return store.getKlineDataRange(token0, token1, timeframe, before, limit)
    },

    getLatest(token0, token1, timeframe, initialGet) {
      return store.getKlineData(token0, token1, timeframe, initialGet)
    },

    isInverted(token0, token1) {
      const info = store.exchangeInfoData
      if (!info?.pool_canister?.length) return false
      for (const [t0, t1] of info.pool_canister) {
        if (t0 === token0 && t1 === token1) return false
        if (t0 === token1 && t1 === token0) return true
      }
      return false
    },

    livePrice: effectivePrice,
  }
}

// Re-export for convenience
export type { KlineDatafeed, KlineData, TimeFrame }
