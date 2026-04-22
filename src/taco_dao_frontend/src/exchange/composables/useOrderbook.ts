/**
 * Composable for managing the orderbook.
 * Uses getOrderbookCombined() which returns both AMM and limit order data per level.
 * Single canister call per poll — no separate getCurrentLiquidity needed.
 */

import { ref, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated, type Ref } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import {
  spreadPercent,
  spreadSeverity,
  maxDepth,
  type OrderbookLevel,
} from '../utils/orderbook-merge'

export type OrderbookDisplayMode = 'both' | 'bids' | 'asks'

export function useOrderbook(
  token0: Ref<string>,
  token1: Ref<string>,
  decimals0: Ref<number>,
  decimals1: Ref<number>,
  _enabled?: Ref<boolean>,
  precision?: Ref<number>,
) {
  const store = useExchangeStore()

  const bids = ref<OrderbookLevel[]>([])
  const asks = ref<OrderbookLevel[]>([])
  const bestBid = ref(0)
  const bestAsk = ref(0)
  const midPrice = ref(0)
  const spread = ref(0)
  const displayMode = ref<OrderbookDisplayMode>('both')
  const isLoading = ref(true)
  const isStale = ref(false)
  const lastTradePrice = ref(0)
  const lastTradeDirection = ref<'up' | 'down' | 'neutral'>('neutral')
  let pollCount = 0
  let switchId = 0

  const spreadClass = computed(() => spreadSeverity(spread.value))
  const bidMaxDepth = computed(() => maxDepth(bids.value))
  const askMaxDepth = computed(() => maxDepth(asks.value))

  /**
   * Map precision to stepBasisPoints and numLevels.
   * Lower precision = wider steps = more price range covered.
   *
   * | Precision | Step (bps) | Per Level | Levels | Total Range   |
   * |-----------|-----------|-----------|--------|---------------|
   * | Auto (0)  | 10        | 0.1%      | 50     | ~5%           |
   * | 1 dp      | 100       | 1%        | 100    | ~100%         |
   * | 2 dp      | 50        | 0.5%      | 100    | ~50%          |
   * | 4 dp      | 25        | 0.25%     | 100    | ~25%          |
   * | 6 dp      | 10        | 0.1%      | 50     | ~5%           |
   * | 8 dp      | 10        | 0.1%      | 50     | ~5%           |
   * | 10 dp     | 5         | 0.05%     | 50     | ~2.5%         |
   * | 12 dp     | 2         | 0.02%     | 50     | ~1%           |
   * | 14 dp     | 1         | 0.01%     | 50     | ~0.5%         |
   * | 16 dp     | 1         | 0.01%     | 100    | ~1%           |
   */
  function getStepAndLevels(): { stepBps: bigint; numLevels: bigint } {
    const dp = precision?.value ?? 0
    if (dp <= 0) return { stepBps: 10n,   numLevels: 50n }
    if (dp <= 1) return { stepBps: 100n,  numLevels: 100n }
    if (dp <= 2) return { stepBps: 50n,   numLevels: 100n }
    if (dp <= 4) return { stepBps: 25n,   numLevels: 100n }
    if (dp <= 6) return { stepBps: 10n,   numLevels: 50n }
    if (dp <= 8) return { stepBps: 10n,   numLevels: 50n }
    if (dp <= 10) return { stepBps: 5n,   numLevels: 50n }
    if (dp <= 12) return { stepBps: 2n,   numLevels: 50n }
    if (dp <= 14) return { stepBps: 1n,   numLevels: 50n }
    return { stepBps: 1n, numLevels: 100n } // 16dp+
  }

  async function fetchOrderbook() {
    if (!token0.value || !token1.value) return

    const mySwitchId = switchId
    try {
      const { stepBps, numLevels } = getStepAndLevels()

      const result = await store.getOrderbookCombined(
        token0.value,
        token1.value,
        numLevels,
        stepBps,
      )

      if (mySwitchId !== switchId) return

      if (!result) {
        isLoading.value = false
        return
      }

      const r = result as any
      const dec0 = decimals0.value
      console.log(`[Orderbook] query(${token0.value}, ${token1.value}) dec0=${dec0} → ammMidPrice=${r.ammMidPrice}, bestAsk=${r.asks?.[0]?.price}, bestBid=${r.bids?.[0]?.price}, firstAskAmmAmt=${r.asks?.[0]?.ammAmount?.toString()}, firstAskLimitAmt=${r.asks?.[0]?.limitAmount?.toString()}, nAsks=${r.asks?.length}, nBids=${r.bids?.length}`)

      function toLevels(rawLevels: any[], side: 'bids' | 'asks'): OrderbookLevel[] {
        const levels: OrderbookLevel[] = rawLevels.map((l: any) => {
          const ammAmt = Number(l.ammAmount) / (10 ** dec0)
          const limitAmt = Number(l.limitAmount) / (10 ** dec0)
          return {
            price: l.price,
            amount: ammAmt + limitAmt,
            total: 0,
            source: (ammAmt > 0 && limitAmt > 0) ? 'Both' as const
              : ammAmt > 0 ? 'AMM' as const : 'Limit' as const,
            ammAmount: ammAmt,
            limitAmount: limitAmt,
            orders: Number(l.limitOrders),
          }
        }).filter(l => l.amount > 0)

        if (side === 'bids') {
          levels.sort((a, b) => b.price - a.price)
        } else {
          levels.sort((a, b) => a.price - b.price)
        }

        let cum = 0
        for (const l of levels) { cum += l.amount; l.total = cum }
        return levels
      }

      const newBids = toLevels(r.bids ?? [], 'bids')
      const newAsks = toLevels(r.asks ?? [], 'asks')

      console.log('[Orderbook] Poll update:', newBids.length, 'bids,', newAsks.length, 'asks')
      bids.value = newBids
      asks.value = newAsks

      if (newBids.length > 0) bestBid.value = newBids[0].price
      if (newAsks.length > 0) bestAsk.value = newAsks[0].price

      if (bestBid.value > 0 && bestAsk.value > 0) {
        midPrice.value = (bestBid.value + bestAsk.value) / 2
        spread.value = spreadPercent(bestBid.value, bestAsk.value)
      } else if (r.ammMidPrice > 0) {
        midPrice.value = r.ammMidPrice
      }

      // Fetch last trade price + direction every 3rd poll (~9s)
      pollCount++
      if (pollCount % 3 === 1) {
        fetchLastTrade()
      }

      // Update store effective price: use lastTradePrice if within spread, else midPrice
      if (lastTradePrice.value > 0 && bestBid.value > 0 && bestAsk.value > 0
          && lastTradePrice.value >= bestBid.value && lastTradePrice.value <= bestAsk.value) {
        store.effectivePrice = lastTradePrice.value
      } else if (midPrice.value > 0) {
        store.effectivePrice = midPrice.value
      }
      store.effectivePriceDirection = lastTradeDirection.value

      isLoading.value = false
      isStale.value = false
    } catch (err: any) {
      if (mySwitchId !== switchId) return
      console.error('[Orderbook] Fetch error:', err?.message || err)
      isLoading.value = false
    }
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPolling() {
    stopPolling()
    fetchOrderbook()
    pollTimer = setInterval(fetchOrderbook, 3000)
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  watch([token0, token1], () => {
    switchId++
    isStale.value = true
    pollCount = 0
    // Reset cross-pair state so the within-spread rule and the chart's reconcile
    // both see a clean slate instead of leaking the previous pair's values. Bids/asks
    // stay visible for no-flicker — they get replaced in-place when fetchOrderbook lands.
    lastTradePrice.value = 0
    lastTradeDirection.value = 'neutral'
    store.effectivePrice = 0
    store.effectivePriceDirection = 'neutral'
    Promise.all([fetchOrderbook(), fetchLastTrade()])
  })

  if (precision) {
    watch(precision, () => fetchOrderbook())
  }

  onMounted(startPolling)
  onUnmounted(stopPolling)
  onActivated(startPolling)
  onDeactivated(stopPolling)

  async function fetchLastTrade() {
    const mySwitchId = switchId
    try {
      const history = await store.getPoolHistory(token0.value, token1.value, 1n)
      if (mySwitchId !== switchId) return
      if (history?.length > 0) {
        const [, trades] = history[0] as [any, any[]]
        if (trades?.length > 0) {
          // First trade in the timestamp is the initiator's action — determines direction
          // Subsequent trades are AMM fills or limit order counter-fills
          const firstTrade = trades[0]
          const isBuy = firstTrade.token_init_identifier === token1.value
          // Use last trade for price (final execution price after all fills)
          const lastTrade = trades[trades.length - 1]

          // Direction from first trade (the initiator's action)
          lastTradeDirection.value = isBuy ? 'up' : 'down'

          // Price from last trade (final execution price)
          const dec0 = decimals0.value
          const dec1 = decimals1.value
          const lastIsBuy = lastTrade.token_init_identifier === token1.value
          if (lastIsBuy) {
            const amtQuote = Number(lastTrade.amount_init) / 10 ** dec1
            const amtBase = Number(lastTrade.amount_sell) / 10 ** dec0
            if (amtBase > 0) lastTradePrice.value = amtQuote / amtBase
          } else {
            const amtBase = Number(lastTrade.amount_init) / 10 ** dec0
            const amtQuote = Number(lastTrade.amount_sell) / 10 ** dec1
            if (amtBase > 0) lastTradePrice.value = amtQuote / amtBase
          }
        }
      }
    } catch { /* keep current values */ }
  }

  function toggleDisplayMode() {
    const modes: OrderbookDisplayMode[] = ['both', 'bids', 'asks']
    const idx = modes.indexOf(displayMode.value)
    displayMode.value = modes[(idx + 1) % modes.length]
  }

  return {
    bids,
    asks,
    bestBid,
    bestAsk,
    midPrice,
    spread,
    spreadClass,
    displayMode,
    isLoading,
    isStale,
    isPolling: ref(false),
    bidMaxDepth,
    askMaxDepth,
    lastTradePrice,
    lastTradeDirection,
    toggleDisplayMode,
    refresh: fetchOrderbook,
  }
}
