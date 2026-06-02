<template>
  <ProLayout ref="layoutRef">
    <template #header>
      <div class="pro-trade-view__header">
        <ExchangeTopNav
          active="pro"
          show-pair
          show-stats
          show-pro-badge
        />
      </div>
    </template>

    <template #chart>
      <TradingChart
        v-if="selectedToken0 && selectedToken1"
        :token0="selectedToken0"
        :token1="selectedToken1"
        :decimals0="decimals0"
        :decimals1="decimals1"
        :datafeed="datafeed"
        default-timeframe="hour"
        hide-attribution
      />
      <div v-else class="ex-panel pro-trade-view__placeholder">
        <span class="ex-label">Select a trading pair</span>
      </div>
    </template>

    <template #orderbook>
      <OrderbookPanel
        v-if="selectedToken0 && selectedToken1"
        :token0="selectedToken0"
        :token1="selectedToken1"
        :decimals0="decimals0"
        :decimals1="decimals1"
        @clickPrice="onOrderbookPriceClick"
      />
      <div v-else class="ex-panel pro-trade-view__placeholder">
        <span class="ex-label">Orderbook</span>
      </div>
    </template>

    <template #order-entry>
      <OrderEntryPanel
        v-if="selectedToken0 && selectedToken1"
        :token0="selectedToken0"
        :token1="selectedToken1"
        :decimals0="decimals0"
        :decimals1="decimals1"
        :prefilledPrice="selectedPrice"
        :prefilledSide="selectedSide"
        :prefilledAmount="selectedAmount"
      />
      <div v-else class="ex-panel pro-trade-view__placeholder">
        <span class="ex-label">Order Entry</span>
      </div>
    </template>

    <template #bottom>
      <div class="pro-bottom">
        <div class="pro-bottom__tabs">
          <button
            v-for="tab in bottomTabs"
            :key="tab.key"
            class="pro-bottom__tab"
            :class="{ 'pro-bottom__tab--active': activeBottomTab === tab.key }"
            @click="activeBottomTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="pro-bottom__content">
          <!-- KeepAlive the bottom tabs so flipping back to a tab is instant
               and uses the stale-window check (no refetch on remount). Each
               tab still owns its own onActivated logic via useStaleAwareLoad. -->
          <KeepAlive>
            <RecentPairTradesTab
              v-if="activeBottomTab === 'pairTrades' && selectedToken0 && selectedToken1"
              :token0="selectedToken0"
              :token1="selectedToken1"
              :decimals0="decimals0"
              :decimals1="decimals1"
            />
            <div
              v-else-if="!store.isAuthenticated"
              style="padding:var(--space-4);color:var(--text-tertiary);font-size:var(--text-sm)"
            >
              Connect wallet to view your data.
            </div>
            <OpenOrdersTab v-else-if="activeBottomTab === 'orders'" />
            <TradeHistoryTab v-else-if="activeBottomTab === 'history'" />
            <LPPositionsTab v-else-if="activeBottomTab === 'lp'" />
            <WalletTab v-else-if="activeBottomTab === 'assets'" @trade="onTradeFromWallet" />
          </KeepAlive>
        </div>
      </div>
    </template>
  </ProLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onActivated, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import ProLayout from '../components/layout/ProLayout.vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import TradingChart from '../../components/charts/TradingChart.vue'
import { useExchangeKlineDatafeed } from '../composables/useExchangeKlineDatafeed'
import OrderbookPanel from '../components/orderbook/OrderbookPanel.vue'
import OrderEntryPanel from '../components/order/OrderEntryPanel.vue'
import OpenOrdersTab from '../components/portfolio/OpenOrdersTab.vue'
import TradeHistoryTab from '../components/portfolio/TradeHistoryTab.vue'
import LPPositionsTab from '../components/portfolio/LPPositionsTab.vue'
import WalletTab from '../components/portfolio/WalletTab.vue'
import RecentPairTradesTab from '../components/portfolio/RecentPairTradesTab.vue'
import { useExchangeStore } from '../store/exchange.store'

const store = useExchangeStore()
const router = useRouter()
const layoutRef = ref<InstanceType<typeof ProLayout> | null>(null)
const datafeed = useExchangeKlineDatafeed()

// Pair selection — reads from store (shared across exchange views)
const selectedToken0 = computed(() => store.selectedToken0)
const selectedToken1 = computed(() => store.selectedToken1)
const decimals0 = computed(() => {
  const t = store.getTokenByAddress(store.selectedToken0)
  return t ? Number(t.decimals) : 8
})
const decimals1 = computed(() => {
  const t = store.getTokenByAddress(store.selectedToken1)
  return t ? Number(t.decimals) : 8
})

// Bottom panel tabs
const bottomTabs = [
  { key: 'orders', label: 'Open Orders' },
  { key: 'history', label: 'Trade History' },
  { key: 'pairTrades', label: 'Recent Pair Trades' },
  { key: 'lp', label: 'LP Positions' },
  { key: 'assets', label: 'Assets' },
]
const activeBottomTab = ref('orders')

// Orderbook → Order entry interaction
const selectedPrice = ref<number | null>(null)
const selectedSide = ref<'buy' | 'sell' | null>(null)
const selectedAmount = ref<number | null>(null)

function onOrderbookPriceClick(price: number, side: 'buy' | 'sell', cumulativeBase: number) {
  selectedPrice.value = price
  selectedSide.value = side
  selectedAmount.value = cumulativeBase > 0 ? cumulativeBase : null
}

function onTradeFromWallet(address: string) {
  // Set the clicked token as token0 (base) if it's not already selected
  if (address !== store.selectedToken0 && address !== store.selectedToken1) {
    store.selectedToken0 = address
  }
  // Snap to a canonical, tradable pair (pool-native order, base token as quote)
  // so the chart/orderbook stay consistent — see resolveProPair.
  syncProPair()
}

// Normalize the carried-over pair to Pro's canonical orientation (base token as
// quote, e.g. TACO/ICP not ICP/TACO) and ensure it maps to a live pool, falling
// back to <token>/ICP then TACO/ICP. Easy mode stores the raw swap from/to order,
// so without this Pro would render the wrong direction (or a dead chart) after a
// mode switch. Idempotent for an already-canonical pair, so it won't fight a
// manual PairSelector choice. resolveProPair returns null until pool data loads.
//
// Gated on isActive: ExchangeApp keeps views alive, so without the guard the
// watcher below would keep firing on the 15 s exchangeInfoData poll and could
// canonicalize the pair while the user is back in Easy mode — flipping the
// direction of their swap.
const isActive = ref(false)

function syncProPair() {
  if (!isActive.value) return
  const pair = store.resolveProPair()
  if (!pair) return
  if (store.selectedToken0 !== pair[0]) store.selectedToken0 = pair[0]
  if (store.selectedToken1 !== pair[1]) store.selectedToken1 = pair[1]
  // Pre-warm the kline + orderbook caches so the chart shell and orderbook
  // panel find data already in-flight (or hot in localStorage) by the time
  // their onMounted hooks reach datafeed.getRange / startPolling. Default
  // timeframe matches TradingChart's `default-timeframe="hour"` prop above.
  store.prefetchProPair({ hour: null })
}

// Re-resolve once tokens/pool data finish loading after entry (async init may
// land while Pro is already shown).
watch(
  () => [store.tokens.length, store.exchangeInfoData?.pool_canister?.length ?? 0],
  () => syncProPair(),
)

// Pro layout is desktop-only. Cross-viewport redirects are handled globally in
// ExchangeApp.vue; here we handle the initial-mount redirect.
onMounted(() => {
  if (window.matchMedia('(max-width: 767px)').matches) router.replace('/trade')
})

// onActivated fires on first show (after onMounted) and on every keep-alive
// re-entry — the right hook to normalize the pair when entering Pro.
onActivated(() => {
  if (window.matchMedia('(max-width: 767px)').matches) return
  isActive.value = true
  syncProPair()
})
onDeactivated(() => { isActive.value = false })
</script>

<style scoped lang="scss">
.pro-trade-view__placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Exactly match the content-view padding so Pro feels like one of them.
   28px top (fluid) + the nav's built-in 20px margin-bottom = same total
   vertical breathing room as Easy / Pool / Portfolio / OTC. */
.pro-trade-view__header {
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 0;
  background: var(--tx-bg);
}
/* Full width on desktop — no max-width cap. The brand lockup aligns with
   the chart column's left edge, and the wallet chip aligns with the
   order-entry column's right edge, so the header tracks the terminal
   grid below. */
.pro-trade-view__header :deep(.tx-topnav) {
  max-width: none;
  margin: 0 0 20px;
}

.pro-bottom {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
</style>
