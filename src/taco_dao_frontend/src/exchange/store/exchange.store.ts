/**
 * Exchange Store — Pinia store wrapping all exchange canister interactions
 *
 * Architecture:
 * - Uses shared auth-cache.ts for identity/agent management
 * - Creates actors lazily from declarations/OTC_backend IDL
 * - Caches token metadata and treasury addresses (they rarely change)
 * - Tracks rate limit budget (21 update calls per 90s)
 * - All query methods are free/unlimited; update methods are counted
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from 'declarations/OTC_backend/OTC_backend.did.js'
import type {
  _SERVICE,
  TokenInfo,
  TradePrivate2,
  TradePosition,
  KlineData,
  DetailedLiquidityPosition,
  Ratio,
  SplitLeg,
  SwapHop,
  TimeFrame,
  ForeignPoolsResponse,
  PoolQuery,
  pool,
} from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import { getCanisterId } from '../../constants/canisterIds'
import { getCachedAgent, getCachedIdentity, getNetworkHost } from '../../shared/auth-cache'
import { getEffectiveNetwork } from '../../config/network-config'

export const useExchangeStore = defineStore('exchange', () => {
  // ═══════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════

  const isAuthenticated = ref(false)
  const initError = ref('')
  const principalText = ref('')

  // Selected trading pair (shared between header + views)
  const selectedToken0 = ref('')
  const selectedToken1 = ref('')

  // Effective price: last trade price if within spread, else mid-price (set by orderbook composable)
  const effectivePrice = ref(0)
  const effectivePriceDirection = ref<'up' | 'down' | 'neutral'>('neutral')

  // Cached data
  const tokens = ref<TokenInfo[]>([])
  const pausedTokens = ref<string[]>([])
  const exchangeInfoData = ref<pool | null>(null)
  const treasuryAccountId = ref('')   // ICP account identifier (hex)
  const treasuryPrincipal = ref('')   // ICRC principal text
  const tradingFeeBps = ref(5n)
  const revokeFeeDivisor = ref(5n)
  const referralFeePct = ref(20n)
  const isFrozen = ref(false)
  const icpPriceUSD = ref(0) // from external APIs (CoinGecko/CoinCap/Binance)
  const externalPricesUSD = ref<Map<string, number>>(new Map()) // known external token prices
  const tokenPricesUSD = ref<Map<string, number>>(new Map())

  // Rate limiter
  const rateLimitCalls = ref<number[]>([])  // timestamps of update calls
  const RATE_LIMIT_WINDOW = 90_000          // 90 seconds
  const RATE_LIMIT_MAX = 21

  // Actor cache
  let _queryActor: _SERVICE | null = null
  let _updateActor: _SERVICE | null = null
  let _identityHash = ''

  // ═══════════════════════════════════════════
  // Actor Management
  // ═══════════════════════════════════════════

  function getExchangeCanisterId(): string {
    return getCanisterId('exchange')
  }

  /** Anonymous actor for query calls (free, unlimited) */
  async function getQueryActor(): Promise<_SERVICE> {
    if (_queryActor) return _queryActor

    const { HttpAgent } = await import('@dfinity/agent')
    const agent = new HttpAgent({ host: getNetworkHost() })

    if (getEffectiveNetwork() === 'local') {
      await agent.fetchRootKey()
    }

    _queryActor = Actor.createActor<_SERVICE>(idlFactory, {
      agent,
      canisterId: getExchangeCanisterId(),
    })

    return _queryActor
  }

  /** Authenticated actor for update calls (counted, rate-limited) */
  async function getUpdateActor(): Promise<_SERVICE> {
    const identity = await getCachedIdentity()
    const currentHash = identity?.getPrincipal()?.toText() ?? ''

    console.log('[Exchange] getUpdateActor — principal:', currentHash, 'isAnonymous:', identity?.getPrincipal()?.isAnonymous())

    // Reject anonymous identity
    if (!identity || identity.getPrincipal().isAnonymous()) {
      throw new Error('Not authenticated — please connect your wallet')
    }

    // Invalidate if identity changed
    if (_updateActor && currentHash === _identityHash) return _updateActor

    const agent = await getCachedAgent()
    if (!agent) throw new Error('Not authenticated')

    _updateActor = Actor.createActor<_SERVICE>(idlFactory, {
      agent,
      canisterId: getExchangeCanisterId(),
    })
    _identityHash = currentHash

    return _updateActor
  }

  // ═══════════════════════════════════════════
  // Rate Limiter
  // ═══════════════════════════════════════════

  const callsRemaining = computed(() => {
    const now = Date.now()
    const recent = rateLimitCalls.value.filter(t => now - t < RATE_LIMIT_WINDOW)
    return Math.max(0, RATE_LIMIT_MAX - recent.length)
  })

  function trackUpdateCall() {
    const now = Date.now()
    rateLimitCalls.value = [
      ...rateLimitCalls.value.filter(t => now - t < RATE_LIMIT_WINDOW),
      now,
    ]
  }

  function canMakeUpdateCall(): boolean {
    if (isFrozen.value) return false
    return callsRemaining.value > 0
  }

  // ── Frozen state detection ──
  let frozenPollTimer: ReturnType<typeof setInterval> | null = null

  async function checkFrozenStatus(): Promise<boolean> {
    try {
      const actor = await getQueryActor()
      const frozen = await actor.isExchangeFrozen()
      isFrozen.value = frozen
      return frozen
    } catch (err: any) {
      // If method doesn't exist on canister yet, assume not frozen
      const msg = err?.message || String(err)
      if (msg.includes('has no query method') || msg.includes('method not found') || msg.includes('IC0536')) {
        isFrozen.value = false
        return false
      }
      // Other errors (network, etc.) — assume frozen as safe default
      isFrozen.value = true
      return true
    }
  }

  function startFrozenPolling() {
    if (frozenPollTimer) return
    frozenPollTimer = setInterval(async () => {
      const stillFrozen = await checkFrozenStatus()
      if (!stillFrozen) {
        stopFrozenPolling()
        initExchange() // re-init when unfrozen
      }
    }, 30000)
  }

  function stopFrozenPolling() {
    if (frozenPollTimer) { clearInterval(frozenPollTimer); frozenPollTimer = null }
  }

  // ═══════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════

  async function initExchange() {
    initError.value = ''
    try {
      // Check frozen status first — if frozen, don't proceed
      const frozen = await checkFrozenStatus()
      if (frozen) {
        initError.value = 'Exchange is currently frozen. Retrying every 30 seconds...'
        console.log('[Exchange] Exchange is frozen — waiting for unfreeze')
        startFrozenPolling()
        return
      }

      const actor = await getQueryActor()
      console.log('[Exchange] Init: canister =', getExchangeCanisterId())

      // Fetch each independently so one failure doesn't kill everything
      const results = await Promise.allSettled([
        actor.getAcceptedTokensInfo(),   // 0
        actor.getPausedTokens(),          // 1
        actor.p2acannister(),             // 2
        actor.returncontractprincipal(),  // 3
        actor.hmFee(),                    // 4
        actor.hmRevokeFee(),              // 5
        actor.hmRefFee(),                 // 6
        actor.exchangeInfo(),             // 7
      ])

      const get = <T>(i: number): T | null => {
        const r = results[i]
        if (r.status === 'fulfilled') return r.value as T
        console.error(`[Exchange] Init call ${i} failed:`, r.reason)
        return null
      }

      const tokensResult = get<[] | [TokenInfo[]]>(0)
      const pausedResult = get<[] | [string[]]>(1)
      const treasuryAcct = get<string>(2)
      const treasuryPrinc = get<string>(3)
      const fee = get<bigint>(4)
      const revFee = get<bigint>(5)
      const refFee = get<bigint>(6)
      const infoResult = get<[] | [pool]>(7)

      if (tokensResult && tokensResult.length > 0) tokens.value = tokensResult[0] ?? []
      if (pausedResult && pausedResult.length > 0) pausedTokens.value = pausedResult[0] ?? []
      if (treasuryAcct) treasuryAccountId.value = treasuryAcct
      if (treasuryPrinc) treasuryPrincipal.value = treasuryPrinc
      if (fee !== null) tradingFeeBps.value = fee
      if (revFee !== null) revokeFeeDivisor.value = revFee
      if (refFee !== null) referralFeePct.value = refFee
      if (infoResult && infoResult.length > 0) exchangeInfoData.value = infoResult[0] ?? null

      // Fallback: if getAcceptedTokensInfo returned empty but getAcceptedTokens has IDs,
      // build minimal TokenInfo from on-chain ICRC-1 metadata
      if (tokens.value.length === 0) {
        console.log('[Exchange] getAcceptedTokensInfo empty, trying getAcceptedTokens fallback...')
        try {
          const idsResult = await actor.getAcceptedTokens()
          const ids = (idsResult.length > 0 ? idsResult[0] ?? [] : []).map((id: string) => id.trim())
          if (ids.length > 0) {
            console.log(`[Exchange] Found ${ids.length} accepted token IDs, fetching on-chain metadata...`)
            const fetched = await fetchTokenMetadataBatch(ids)
            // Filter out tokens with failed metadata (symbol = '???' or empty)
            tokens.value = fetched.filter(t => t.symbol && t.symbol !== '???' && t.name)
            console.log(`[Exchange] Built ${tokens.value.length} tokens from on-chain data (${fetched.length - tokens.value.length} failed)`)
          }
        } catch (err) {
          console.error('[Exchange] Fallback getAcceptedTokens failed:', err)
        }
      }

      console.log(`[Exchange] Init complete: ${tokens.value.length} tokens, info=${!!exchangeInfoData.value}`)

      // Fetch prices — don't block init, components reactively update when prices arrive
      fetchCryptoPrices().then(() => fetchTokenPricesUSD())

      // Start periodic exchangeInfo refresh (every 15s)
      startExchangeInfoPolling()

      if (tokens.value.length === 0) {
        const allFailed = results.every(r => r.status === 'rejected')
        if (allFailed) {
          initError.value = `Cannot reach exchange canister (${getExchangeCanisterId()}). Check canister ID and deployment.`
        } else {
          initError.value = 'No tokens configured on the exchange. An admin must add tokens via the Admin panel.'
        }
      }
    } catch (err: any) {
      initError.value = `Failed to initialize exchange: ${err.message || err}`
      console.error('[Exchange] Init failed:', err)
    }
  }

  // ── External crypto price fetch (CoinGecko → CoinCap → Binance) ──
  let lastPriceUpdate = 0

  async function fetchCryptoPrices() {
    const now = Date.now()
    if (now - lastPriceUpdate < 30_000) return // throttle to 30s

    // Try CoinGecko first
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=internet-computer,draggin-karma-points',
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const icpData = data.find((c: { id: string }) => c.id === 'internet-computer')
      const dkpData = data.find((c: { id: string }) => c.id === 'draggin-karma-points')
      if (icpData?.current_price) icpPriceUSD.value = icpData.current_price
      if (dkpData?.current_price) externalPricesUSD.value.set('zfcdd-tqaaa-aaaaq-aaaga-cai', dkpData.current_price)
      console.log('[Exchange] CoinGecko prices — ICP:', icpPriceUSD.value, 'DKP:', dkpData?.current_price ?? 'n/a')
      lastPriceUpdate = now
      return
    } catch {
      console.warn('[Exchange] CoinGecko price fetch failed, trying CoinCap...')
    }

    // Fallback 1: CoinCap
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const resp = await fetch('https://api.coincap.io/v2/assets/internet-computer', { signal: controller.signal })
      clearTimeout(timeout)
      if (resp.ok) {
        const d = await resp.json()
        icpPriceUSD.value = parseFloat(d.data?.priceUsd) || 0
      }
      lastPriceUpdate = now
      return
    } catch {
      console.warn('[Exchange] CoinCap price fetch failed, trying Binance...')
    }

    // Fallback 2: Binance
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const resp = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ICPUSDT', { signal: controller.signal })
      clearTimeout(timeout)
      if (resp.ok) {
        const d = await resp.json()
        icpPriceUSD.value = parseFloat(d.price) || 0
      }
      lastPriceUpdate = now
    } catch {
      console.warn('[Exchange] Binance price fetch also failed')
    }

    // Fallback: estimate from ICP/ckUSDC pool if all external sources failed
    if (icpPriceUSD.value <= 0) {
      estimateIcpFromPool()
    }
  }

  function estimateIcpFromPool() {
    const info = exchangeInfoData.value
    if (!info?.pool_canister) return
    const ICP = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
    const CKUSDC = 'xevnm-gaaaa-aaaar-qafnq-cai'
    for (let i = 0; i < info.pool_canister.length; i++) {
      const [t0, t1] = info.pool_canister[i]
      if ((t0 === ICP && t1 === CKUSDC) || (t0 === CKUSDC && t1 === ICP)) {
        const price = info.last_traded_price?.[i] ?? 0
        if (price > 0) {
          icpPriceUSD.value = t0 === ICP ? price : (1 / price)
          console.log('[Exchange] ICP price from pool fallback:', icpPriceUSD.value)
          return
        }
      }
    }
  }

  async function fetchTokenPricesUSD() {
    if (icpPriceUSD.value <= 0) return
    const map = new Map<string, number>()

    // Try backend first
    try {
      const actor = await getQueryActor()
      const result = await actor.getTokenUSDPrices(icpPriceUSD.value, 1.0)
      const res = result[0]
      if (res && !res.error) {
        for (const [, entry] of res.data) {
          if (entry.priceUSD > 0) map.set(entry.address, entry.priceUSD)
        }
      }
    } catch {
      // Backend failed — will derive from pools below
    }

    // Seed known prices: ICP, ckUSDC, DKP
    const ICP = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
    const CKUSDC = 'xevnm-gaaaa-aaaar-qafnq-cai'
    const DKP = 'zfcdd-tqaaa-aaaaq-aaaga-cai'
    map.set(ICP, icpPriceUSD.value)
    map.set(CKUSDC, 1.0)
    const dkpPrice = externalPricesUSD.value.get(DKP)
    if (dkpPrice && dkpPrice > 0) map.set(DKP, dkpPrice)

    // Overlay any other externally-known prices
    for (const [addr, price] of externalPricesUSD.value) {
      if (price > 0) map.set(addr, price)
    }

    // Walk pools to derive prices for all connected tokens
    derivePoolPrices(map)

    // Only update if prices actually changed
    const oldMap = tokenPricesUSD.value
    let changed = map.size !== oldMap.size
    if (!changed) {
      for (const [k, v] of map) {
        if (oldMap.get(k) !== v) { changed = true; break }
      }
    }
    if (changed) {
      tokenPricesUSD.value = map
      console.log('[Exchange] Token USD prices updated:', Object.fromEntries(map))
    }
  }

  /** Walk all pools: if one token has a USD price and the other doesn't, derive it */
  function derivePoolPrices(map: Map<string, number>) {
    const info = exchangeInfoData.value
    if (!info?.pool_canister) return
    // Multiple passes — each pass can unlock new prices that feed into the next
    for (let pass = 0; pass < 3; pass++) {
      let changed = false
      for (let i = 0; i < info.pool_canister.length; i++) {
        const [t0, t1] = info.pool_canister[i]
        const price = info.last_traded_price?.[i] ?? 0
        if (price <= 0) continue
        const p0 = map.get(t0)
        const p1 = map.get(t1)
        // price = token1-per-token0 (how much t1 you get per t0)
        if (p0 && p0 > 0 && !p1) {
          map.set(t1, p0 / price)
          changed = true
        } else if (p1 && p1 > 0 && !p0) {
          map.set(t0, p1 * price)
          changed = true
        }
      }
      if (!changed) break
    }
  }

  function getTokenPriceUSD(address: string): number {
    return tokenPricesUSD.value.get(address) ?? 0
  }

  let infoPollingTimer: ReturnType<typeof setInterval> | null = null
  function startExchangeInfoPolling() {
    if (infoPollingTimer) return
    infoPollingTimer = setInterval(async () => {
      if (isFrozen.value) return
      try {
        const frozen = await checkFrozenStatus()
        if (frozen) {
          startFrozenPolling()
          return
        }
        await Promise.all([
          refreshExchangeInfo(),
          fetchCryptoPrices(),
          fetchTokenPricesUSD(),
        ])
      } catch { /* ignore */ }
    }, 15000)
  }

  // ═══════════════════════════════════════════
  // Query Methods (free, unlimited)
  // ═══════════════════════════════════════════

  async function refreshExchangeInfo() {
    const actor = await getQueryActor()
    const result = await actor.exchangeInfo()
    if (result.length > 0) {
      const fresh = result[0] ?? null
      // Only update if data actually changed (avoids unnecessary re-renders)
      const replacer = (_: string, v: any) => typeof v === 'bigint' ? v.toString() : v
      if (JSON.stringify(fresh, replacer) !== JSON.stringify(exchangeInfoData.value, replacer)) {
        exchangeInfoData.value = fresh
      }
    }
    return exchangeInfoData.value
  }

  // ═══════════════════════════════════════════
  // Mutation event bus
  // ═══════════════════════════════════════════
  // Every user-initiated mutation (swap / order / revoke / lp / claim /
  // referral) calls refreshAfterMutation(kind). Components that own
  // per-tab polling (WalletTab, OpenOrdersTab, etc.) subscribe via
  // onMutation(kind => ...) and re-run their fetch immediately so the UI
  // doesn't lag behind the user's own action by a poll tick.

  type MutationKind = 'swap' | 'order' | 'revoke' | 'lp' | 'claim' | 'referral'
  const mutationListeners = new Set<(kind: MutationKind) => void>()

  function onMutation(cb: (kind: MutationKind) => void): () => void {
    mutationListeners.add(cb)
    return () => mutationListeners.delete(cb)
  }

  async function refreshAfterMutation(kind: MutationKind): Promise<void> {
    try { await refreshExchangeInfo() } catch { /* best effort */ }
    for (const cb of mutationListeners) {
      try { cb(kind) } catch { /* one bad subscriber shouldn't break others */ }
    }
  }

  async function getExpectedReceiveAmount(tokenSell: string, tokenBuy: string, amount: bigint) {
    const actor = await getQueryActor()
    return actor.getExpectedReceiveAmount(tokenSell, tokenBuy, amount)
  }

  async function getExpectedMultiHopAmount(tokenIn: string, tokenOut: string, amountIn: bigint) {
    const actor = await getQueryActor()
    return actor.getExpectedMultiHopAmount(tokenIn, tokenOut, amountIn)
  }

  async function getExpectedReceiveAmountBatch(
    requests: Array<{ tokenSell: string; tokenBuy: string; amountSell: bigint }>
  ) {
    const actor = await getQueryActor()
    return actor.getExpectedReceiveAmountBatch(requests)
  }

  async function getCurrentLiquidity(
    token1: string,
    token2: string,
    direction: { forward: null } | { backward: null },
    limit: bigint,
    cursor: [] | [Ratio],
  ) {
    const actor = await getQueryActor()
    return actor.getCurrentLiquidity(token1, token2, direction, limit, cursor)
  }

  async function getCurrentLiquidityForeignPools(
    limit: bigint,
    poolQuery: [] | [PoolQuery[]],
    onlySpecified: boolean,
  ): Promise<ForeignPoolsResponse> {
    const actor = await getQueryActor()
    return actor.getCurrentLiquidityForeignPools(limit, poolQuery, onlySpecified)
  }

  async function getAMMPoolInfo(token0: string, token1: string) {
    const actor = await getQueryActor()
    return actor.getAMMPoolInfo(token0, token1)
  }

  /**
   * Sync check against the cached pool_canister list. Reactive — re-evaluates
   * whenever exchangeInfoData refreshes (every 15 s via startExchangeInfoPolling).
   * "Has AMM" here means the pool is registered AND has non-zero reserves on
   * both sides; a registered-but-empty pool can't quote or execute, so we
   * treat it as no-AMM for UI purposes (matches what the user perceives).
   */
  function hasAMMPool(token0: string, token1: string): boolean {
    const info = exchangeInfoData.value as any
    const list = info?.pool_canister as Array<[string, string]> | undefined
    if (!list?.length || !token0 || !token1) return false
    const idx = list.findIndex(([a, b]) =>
      (a === token0 && b === token1) || (a === token1 && b === token0),
    )
    if (idx < 0) return false
    const r0 = info?.amm_reserve0 as Array<bigint | number> | undefined
    const r1 = info?.amm_reserve1 as Array<bigint | number> | undefined
    if (r0?.[idx] === undefined || r1?.[idx] === undefined) return true
    return BigInt(r0[idx] as any) > 0n && BigInt(r1[idx] as any) > 0n
  }

  async function getAllAMMPools() {
    const actor = await getQueryActor()
    return actor.getAllAMMPools()
  }

  async function getPoolStats(token0: string, token1: string) {
    const actor = await getQueryActor()
    return actor.getPoolStats(token0, token1)
  }

  async function getAllPoolStats() {
    const actor = await getQueryActor()
    return actor.getAllPoolStats()
  }

  async function getOrderbookCombined(token0: string, token1: string, numLevels: bigint, stepPercent: bigint) {
    const actor = await getQueryActor()
    return actor.getOrderbookCombined(token0, token1, numLevels, stepPercent)
  }

  async function getKlineData(token1: string, token2: string, timeframe: TimeFrame, initialGet: boolean): Promise<KlineData[]> {
    const actor = await getQueryActor()
    return actor.getKlineData(token1, token2, timeframe, initialGet)
  }

  async function getKlineDataRange(
    token1: string,
    token2: string,
    timeframe: TimeFrame,
    before: [] | [bigint],
    limit: bigint,
  ): Promise<KlineData[]> {
    const actor = await getQueryActor()
    return actor.getKlineDataRange(token1, token2, timeframe, before, limit)
  }

  async function getPoolHistory(token1: string, token2: string, limit: bigint) {
    const actor = await getQueryActor()
    return actor.getPoolHistory(token1, token2, limit)
  }

  async function getPrivateTrade(accesscode: string): Promise<[] | [TradePosition]> {
    const actor = await getQueryActor()
    return actor.getPrivateTrade(accesscode)
  }

  // User-specific queries — need authenticated actor (canister checks msg.caller)
  async function getUserTrades(): Promise<TradePrivate2[]> {
    const actor = await getUpdateActor()
    return actor.getUserTrades()
  }

  async function getUserPreviousTrades(token1: string, token2: string) {
    const actor = await getUpdateActor()
    return actor.getUserPreviousTrades(token1, token2)
  }

  async function getUserTradeHistory(limit: bigint) {
    const actor = await getUpdateActor()
    return actor.getUserTradeHistory(limit)
  }

  async function getUserSwapHistory(limit: bigint) {
    const actor = await getUpdateActor()
    return actor.getUserSwapHistory(limit)
  }

  async function getUserLiquidityDetailed(): Promise<DetailedLiquidityPosition[]> {
    const actor = await getUpdateActor()
    return actor.getUserLiquidityDetailed()
  }

  async function getTokenUSDPrices(icpPriceUSD: number, ckusdcPriceUSD: number) {
    const actor = await getQueryActor()
    return actor.getTokenUSDPrices(icpPriceUSD, ckusdcPriceUSD)
  }

  async function checkFeesReferrer(): Promise<[string, bigint][]> {
    const actor = await getUpdateActor()
    return actor.checkFeesReferrer()
  }

  async function getUserReferralInfo() {
    const actor = await getUpdateActor()
    return actor.getUserReferralInfo()
  }

  // Admin queries — need authenticated actor
  async function getLogging(category: { FinishSellBatchDAO: null } | { addAcceptedToken: null }, limit: bigint) {
    const actor = await getUpdateActor()
    return actor.getLogging(category, limit)
  }

  async function getCycles(): Promise<bigint> {
    const actor = await getUpdateActor()
    return actor.get_cycles()
  }

  // ═══════════════════════════════════════════
  // Update Methods (counted, rate-limited)
  // ═══════════════════════════════════════════

  async function addPosition(
    blockNumber: bigint,
    amountSell: bigint,
    amountInit: bigint,
    tokenSell: string,
    tokenInit: string,
    pub: boolean,
    excludeDAO: boolean,
    oc: [] | [string],
    referrer: string,
    allOrNothing: boolean,
    strictlyOTC: boolean,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached. Wait before making more trades.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.addPosition(blockNumber, amountSell, amountInit, tokenSell, tokenInit, pub, excludeDAO, oc, referrer, allOrNothing, strictlyOTC)
  }

  async function swapMultiHop(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    route: SwapHop[],
    minAmountOut: bigint,
    blockNumber: bigint,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached. Wait before making more trades.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.swapMultiHop(tokenIn, tokenOut, amountIn, route, minAmountOut, blockNumber)
  }

  async function swapSplitRoutes(
    tokenIn: string,
    tokenOut: string,
    splits: SplitLeg[],
    minAmountOut: bigint,
    blockNumber: bigint,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached. Wait before making more trades.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.swapSplitRoutes(tokenIn, tokenOut, splits, minAmountOut, blockNumber)
  }

  async function finishSell(blockNumber: bigint, accesscode: string, amount: bigint) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.FinishSell(blockNumber, accesscode, amount)
  }

  async function finishSellBatch(
    blockNumber: bigint,
    accesscodes: string[],
    amounts: bigint[],
    tokenSell: string,
    tokenInit: string,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.FinishSellBatch(blockNumber, accesscodes, amounts, tokenSell, tokenInit)
  }

  async function revokeTrade(
    accesscode: string,
    revokeType: { DAO: string[] } | { Seller: null } | { Initiator: null },
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.revokeTrade(accesscode, revokeType)
  }

  async function addLiquidity(
    token0: string, token1: string,
    amount0: bigint, amount1: bigint,
    block0: bigint, block1: bigint,
    isInitial?: boolean,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.addLiquidity(token0, token1, amount0, amount1, block0, block1,
      isInitial != null ? [isInitial] : [])
  }

  async function removeLiquidity(token0: string, token1: string, lpAmount: bigint) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.removeLiquidity(token0, token1, lpAmount)
  }

  // ── Concentrated Liquidity ──

  async function addConcentratedLiquidity(
    token0: string, token1: string,
    amount0: bigint, amount1: bigint,
    priceLower: bigint, priceUpper: bigint,
    block0: bigint, block1: bigint,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.addConcentratedLiquidity(token0, token1, amount0, amount1, priceLower, priceUpper, block0, block1)
  }

  async function removeConcentratedLiquidity(
    token0: string, token1: string,
    positionId: bigint, liquidityAmount: bigint,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.removeConcentratedLiquidity(token0, token1, positionId, liquidityAmount)
  }

  async function getPoolRanges(token0: string, token1: string) {
    const actor = await getQueryActor()
    return actor.getPoolRanges(token0, token1)
  }

  async function getUserConcentratedPositions() {
    const actor = await getUpdateActor()
    return actor.getUserConcentratedPositions()
  }

  async function claimFeesReferrer(): Promise<[string, bigint][]> {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.claimFeesReferrer()
  }

  async function claimLPFees(token0: string, token1: string) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.claimLPFees(token0, token1)
  }

  async function claimConcentratedFees(positionId: bigint) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.claimConcentratedFees(positionId)
  }

  async function recoverWronglysent(
    tokenCanisterId: string,
    blockNumber: bigint,
    tokenType: { ICP: null } | { ICRC3: null } | { ICRC12: null },
  ): Promise<boolean> {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.recoverWronglysent(tokenCanisterId, blockNumber, tokenType)
  }

  async function recoverBatch(
    recoveries: Array<{ identifier: string; block: bigint; tType: { ICP: null } | { ICRC3: null } | { ICRC12: null } }>,
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.recoverBatch(recoveries)
  }

  async function fixStuckTX(accesscode: string) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.FixStuckTX(accesscode)
  }

  // ═══════════════════════════════════════════
  // Admin Methods (update, rate-limited, owner-only)
  // ═══════════════════════════════════════════

  async function freeze() {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.Freeze()
  }

  async function addAcceptedToken(
    action: { Add: null } | { Remove: null } | { Opposite: null },
    tokenCanisterId: string,
    minimumAmount: bigint,
    standard: { ICP: null } | { ICRC3: null } | { ICRC12: null },
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.addAcceptedToken(action, tokenCanisterId, minimumAmount, standard)
  }

  async function pauseToken(tokenCanisterId: string) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.pauseToken(tokenCanisterId)
  }

  async function changeTradingFees(newFee: bigint) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.ChangeTradingfees(newFee)
  }

  async function changeRevokeFees(newDivisor: bigint) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.ChangeRevokefees(newDivisor)
  }

  async function changeReferralFees(newPct: bigint) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.ChangeReferralFees(newPct)
  }

  async function parameterManagement(params: {
    deleteAllowedCanisters: [] | [string[]],
    changeAllowedCalls: [] | [bigint],
    deleteFromDayBan: [] | [string[]],
    treasury_principal: [] | [string],
    deleteFromAllTimeBan: [] | [string[]],
    addToAllTimeBan: [] | [string[]],
    addAllowedCanisters: [] | [string[]],
    changeallowedSilentWarnings: [] | [bigint],
  }) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.parameterManagement(params)
  }

  async function checkDiffs(returnFees: boolean, alwaysShow: boolean) {
    const actor = await getUpdateActor()
    return actor.checkDiffs(returnFees, alwaysShow)
  }

  async function collectFees() {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.collectFees()
  }

  // ── DAO / Advanced Admin Methods ──

  async function getAllTradesPublic() {
    const actor = await getUpdateActor()
    return actor.getAllTradesPublic()
  }

  async function getAllTradesPrivateCostly() {
    const actor = await getUpdateActor()
    return actor.getAllTradesPrivateCostly()
  }

  async function finishSellBatchDAO(
    trades: import('declarations/OTC_backend/OTC_backend.did.d.ts').TradeData[],
    createOrdersIfNotDone: boolean,
    indices: bigint[],
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.FinishSellBatchDAO(trades, createOrdersIfNotDone, indices)
  }

  async function recalibrateDAOpositions(
    positions: import('declarations/OTC_backend/OTC_backend.did.d.ts').PositionData[],
  ) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.recalibrateDAOpositions(positions)
  }

  async function retrieveFundsDao(pairs: [string, bigint][]) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.retrieveFundsDao(pairs)
  }

  async function sendDAOInfo() {
    const actor = await getUpdateActor()
    return actor.sendDAOInfo()
  }

  async function changeOwner2(principal: Principal) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.changeOwner2(principal)
  }

  async function changeOwner3(principal: Principal) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.changeOwner3(principal)
  }

  async function setTest(enabled: boolean) {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.setTest(enabled)
  }

  async function addTimer() {
    if (!canMakeUpdateCall()) throw new Error('Rate limit reached.')
    trackUpdateCall()
    const actor = await getUpdateActor()
    return actor.addTimer()
  }

  // ═══════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════

  function getTokenByAddress(address: string): TokenInfo | undefined {
    return tokens.value.find((t: TokenInfo) => t.address === address)
  }

  function getTokenBySymbol(symbol: string): TokenInfo | undefined {
    return tokens.value.find((t: TokenInfo) => t.symbol === symbol)
  }

  function isTokenPaused(address: string): boolean {
    return pausedTokens.value.includes(address)
  }

  function clearActorCache() {
    _queryActor = null
    _updateActor = null
    _identityHash = ''
  }

  // Minimal ICRC-1 IDL for metadata + balance queries
  const _icrc1MetadataIdl = ({ IDL }: { IDL: any }) => {
    const Account = IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    })
    const MetaValue = IDL.Variant({
      Nat: IDL.Nat,
      Int: IDL.Int,
      Text: IDL.Text,
      Blob: IDL.Vec(IDL.Nat8),
    })
    return IDL.Service({
      icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, MetaValue))], ['query']),
      icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
      icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    })
  }

  /** Fetch ICRC-1 metadata for a batch of token canister IDs, building TokenInfo objects */
  async function fetchTokenMetadataBatch(ids: string[]): Promise<TokenInfo[]> {
    const { HttpAgent } = await import('@dfinity/agent')
    const agent = new HttpAgent({ host: getNetworkHost() })

    const results = await Promise.allSettled(ids.map(async (canisterId) => {
      const tokenActor = Actor.createActor(_icrc1MetadataIdl, { agent, canisterId })
      const [metaEntries, fee] = await Promise.all([
        tokenActor.icrc1_metadata() as Promise<Array<[string, any]>>,
        tokenActor.icrc1_fee() as Promise<bigint>,
      ])

      const meta = new Map<string, any>()
      for (const [key, val] of metaEntries) {
        if ('Text' in val) meta.set(key, val.Text)
        else if ('Nat' in val) meta.set(key, val.Nat)
      }

      const isICP = canisterId === 'ryjl3-tyaaa-aaaaa-aaaba-cai'

      return {
        address: canisterId,
        symbol: (meta.get('icrc1:symbol') ?? meta.get('icrc1_symbol') ?? '???') as string,
        name: (meta.get('icrc1:name') ?? meta.get('icrc1_name') ?? canisterId.slice(0, 10)) as string,
        decimals: (meta.get('icrc1:decimals') ?? meta.get('icrc1_decimals') ?? 8n) as bigint,
        transfer_fee: fee,
        minimum_amount: 100_000n,
        asset_type: isICP ? { ICP: null } : { ICRC12: null },
      } as TokenInfo
    }))

    return results
      .filter((r): r is PromiseFulfilledResult<TokenInfo> => r.status === 'fulfilled')
      .map(r => r.value)
  }

  const _icrc1BalanceIdl = ({ IDL }: { IDL: any }) => {
    const Account = IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    })
    return IDL.Service({
      icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    })
  }

  /**
   * Query ICRC-1 balance for the authenticated user on a specific token.
   *
   * Uses an ANONYMOUS agent even though the user is authenticated.
   * `icrc1_balance_of` is a public query that takes the principal as its
   * argument — no signing is required to read someone's balance. Using the
   * authenticated (cached) agent here caused HTTP 400 rejections at the IC
   * boundary node for tokens (e.g. DKP) not included in the II delegation's
   * `targets`. Anonymous queries sidestep that entirely.
   */
  async function getUserBalance(tokenAddress: string): Promise<bigint> {
    try {
      const identity = await getCachedIdentity()
      if (!identity || identity.getPrincipal().isAnonymous()) return 0n

      const { HttpAgent } = await import('@dfinity/agent')
      const agent = new HttpAgent({ host: getNetworkHost() })
      if (getEffectiveNetwork() === 'local') await agent.fetchRootKey()

      const tokenActor = Actor.createActor(_icrc1BalanceIdl, {
        agent,
        canisterId: tokenAddress,
      })
      const balance = await tokenActor.icrc1_balance_of({
        owner: identity.getPrincipal(),
        subaccount: [],
      })
      return balance as bigint
    } catch (err) {
      console.warn('[getUserBalance] query failed for', tokenAddress, err)
      return 0n
    }
  }

  return {
    // State
    isAuthenticated,
    isFrozen,
    principalText,
    initError,
    selectedToken0,
    selectedToken1,
    effectivePrice,
    effectivePriceDirection,
    tokens,
    pausedTokens,
    exchangeInfoData,
    treasuryAccountId,
    treasuryPrincipal,
    tradingFeeBps,
    revokeFeeDivisor,
    referralFeePct,
    icpPriceUSD,
    tokenPricesUSD,
    getTokenPriceUSD,

    // Rate limiter
    callsRemaining,
    canMakeUpdateCall,

    // Init
    initExchange,

    // Mutation event bus
    refreshAfterMutation,
    onMutation,

    // Query methods
    refreshExchangeInfo,
    getExpectedReceiveAmount,
    getExpectedReceiveAmountBatch,
    getExpectedMultiHopAmount,
    getCurrentLiquidity,
    getCurrentLiquidityForeignPools,
    getAMMPoolInfo,
    hasAMMPool,
    getAllAMMPools,
    getPoolStats,
    getAllPoolStats,
    getOrderbookCombined,
    getKlineData,
    getKlineDataRange,
    getPoolHistory,
    getPrivateTrade,
    getUserTrades,
    getUserPreviousTrades,
    getUserTradeHistory,
    getUserSwapHistory,
    getUserLiquidityDetailed,
    getTokenUSDPrices,
    checkFeesReferrer,
    getUserReferralInfo,
    getLogging,
    getCycles,
    getUserBalance,

    // Update methods
    addPosition,
    swapMultiHop,
    swapSplitRoutes,
    finishSell,
    finishSellBatch,
    revokeTrade,
    addLiquidity,
    removeLiquidity,
    addConcentratedLiquidity,
    removeConcentratedLiquidity,
    getPoolRanges,
    getUserConcentratedPositions,
    claimFeesReferrer,
    claimLPFees,
    claimConcentratedFees,
    recoverWronglysent,
    recoverBatch,
    fixStuckTX,

    // Admin methods
    freeze,
    addAcceptedToken,
    pauseToken,
    changeTradingFees,
    changeRevokeFees,
    changeReferralFees,
    parameterManagement,
    checkDiffs,
    collectFees,

    // DAO / Advanced admin methods
    getAllTradesPublic,
    getAllTradesPrivateCostly,
    finishSellBatchDAO,
    recalibrateDAOpositions,
    retrieveFundsDao,
    sendDAOInfo,
    changeOwner2,
    changeOwner3,
    setTest,
    addTimer,

    // Helpers
    getTokenByAddress,
    getTokenBySymbol,
    isTokenPaused,
    clearActorCache,
  }
})
