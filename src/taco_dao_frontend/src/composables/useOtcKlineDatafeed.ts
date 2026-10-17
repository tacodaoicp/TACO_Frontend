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

import type { _SERVICE, pool } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import { getNetworkHost } from '../shared/auth-cache'
import { getEffectiveNetwork } from '../config/network-config'
import { getCanisterId } from '../constants/canisterIds'
import type { KlineDatafeed } from '../components/charts/types'

const POOL_TTL_MS = 5 * 60 * 1000

let _actorPromise: Promise<_SERVICE> | null = null
let _poolCanister: Array<[string, string]> | null = null
let _poolFetchedAt = 0
let _poolPromise: Promise<void> | null = null

// The agent and the IDL load with the first call, so the page that uses the
// chart does not wait for them. Calls made meanwhile share one agent.
function getActor(): Promise<_SERVICE> {
  _actorPromise ??= (async () => {
    const [{ Actor, HttpAgent }, { idlFactory }] = await Promise.all([
      import('@dfinity/agent'),
      import('declarations/OTC_backend/OTC_backend.did.js'),
    ])
    // Anonymous public chart/kline data — skip per-query signature verification.
    const agent = new HttpAgent({ host: getNetworkHost(), verifyQuerySignatures: false })
    if (getEffectiveNetwork() === 'local') {
      await agent.fetchRootKey()
    }
    return Actor.createActor<_SERVICE>(idlFactory, {
      agent,
      canisterId: getCanisterId('exchange'),
    })
  })().catch((err) => {
    // a failed load or root key fetch is tried again on the next call, as before
    _actorPromise = null
    throw err
  })
  return _actorPromise
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
