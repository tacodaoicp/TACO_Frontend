/**
 * DAO-side KlineDatafeed for embedding TradingChart outside the exchange app.
 *
 * Talks directly to the OTC_backend canister with an anonymous query agent —
 * no Pinia store, no auth, no orderbook. The exchange canister id is the
 * single source of pool data, kline history, and pair metadata.
 *
 * Pair-inversion lookup uses the same `pool_canister` array the exchange
 * store reads, fetched once via `exchangeInfo()` and cached at module scope
 * with a 5-minute TTL.
 */

import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from 'declarations/OTC_backend/OTC_backend.did.js'
import type { _SERVICE, pool } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import { getNetworkHost } from '../shared/auth-cache'
import { getEffectiveNetwork } from '../config/network-config'
import { getCanisterId } from '../constants/canisterIds'
import type { KlineDatafeed } from '../components/charts/types'

const POOL_TTL_MS = 5 * 60 * 1000

let _actor: _SERVICE | null = null
let _poolCanister: Array<[string, string]> | null = null
let _poolFetchedAt = 0
let _poolPromise: Promise<void> | null = null

async function getActor(): Promise<_SERVICE> {
  if (_actor) return _actor
  const agent = new HttpAgent({ host: getNetworkHost() })
  if (getEffectiveNetwork() === 'local') {
    await agent.fetchRootKey()
  }
  _actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: getCanisterId('exchange'),
  })
  return _actor
}

async function ensurePoolInfo(): Promise<void> {
  const fresh = _poolCanister && Date.now() - _poolFetchedAt < POOL_TTL_MS
  if (fresh) return
  if (_poolPromise) return _poolPromise

  _poolPromise = (async () => {
    try {
      const actor = await getActor()
      const result = await actor.exchangeInfo()
      const info: pool | null = result && result.length > 0 ? result[0] ?? null : null
      if (info?.pool_canister) {
        _poolCanister = info.pool_canister
        _poolFetchedAt = Date.now()
      }
    } catch (err) {
      console.error('[useOtcKlineDatafeed] exchangeInfo failed:', err)
    } finally {
      _poolPromise = null
    }
  })()

  return _poolPromise
}

// Kick off the pool fetch the first time the datafeed is instantiated so
// `isInverted` has data to consult by the time the chart starts rendering.
let _bootstrapStarted = false

export function useOtcKlineDatafeed(): KlineDatafeed {
  if (!_bootstrapStarted) {
    _bootstrapStarted = true
    void ensurePoolInfo()
  }

  return {
    async getRange(token0, token1, timeframe, before, limit) {
      const actor = await getActor()
      return actor.getKlineDataRange(token0, token1, timeframe, before, limit)
    },

    async getLatest(token0, token1, timeframe, initialGet) {
      const actor = await getActor()
      return actor.getKlineData(token0, token1, timeframe, initialGet)
    },

    isInverted(token0, token1) {
      // Refresh in the background if the cache has gone stale; the next
      // chart re-render will pick up the corrected orientation.
      if (_poolCanister && Date.now() - _poolFetchedAt >= POOL_TTL_MS) {
        void ensurePoolInfo()
      }
      if (!_poolCanister) return false
      for (const [t0, t1] of _poolCanister) {
        if (t0 === token0 && t1 === token1) return false
        if (t0 === token1 && t1 === token0) return true
      }
      return false
    },
  }
}
