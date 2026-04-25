<template>
  <div class="mobile-trade">
    <div class="mobile-trade__header">
      <ExchangeTopNav show-pair />
    </div>

    <main class="mobile-trade__main">
      <!-- Two-column: Orderbook + Order Entry -->
      <div class="mobile-trade__panels">
        <div class="mobile-trade__orderbook">
          <OrderbookPanel
            v-if="token0 && token1"
            :token0="token0"
            :token1="token1"
            :decimals0="decimals0"
            :decimals1="decimals1"
            @clickPrice="onPriceClick"
          />
        </div>
        <div class="mobile-trade__entry">
          <OrderEntryPanel
            v-if="token0 && token1"
            :token0="token0"
            :token1="token1"
            :decimals0="decimals0"
            :decimals1="decimals1"
            :prefilledPrice="clickedPrice"
            :prefilledSide="clickedSide"
            :prefilledAmount="clickedAmount"
          />
        </div>
      </div>

      <!-- Chart toggle -->
      <button class="mobile-trade__chart-toggle" @click="showChart = !showChart">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 12V4l3 3 2.5-4.5 3.5 3 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ showChart ? 'Hide Chart' : 'Show Chart' }}
      </button>

      <div v-if="showChart" class="mobile-trade__chart">
        <TradingChart v-if="token0 && token1" :token0="token0" :token1="token1" :decimals0="decimals0" :decimals1="decimals1" />
      </div>

      <!-- Bottom tabs -->
      <div class="mobile-trade__bottom">
        <div class="pro-bottom__tabs">
          <button
            v-for="tab in bottomTabs"
            :key="tab.key"
            class="pro-bottom__tab"
            :class="{ 'pro-bottom__tab--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >{{ tab.label }}</button>
        </div>
        <div class="pro-bottom__content">
          <OpenOrdersTab v-if="activeTab === 'orders'" />
          <TradeHistoryTab v-if="activeTab === 'history'" />
          <RecentPairTradesTab
            v-if="activeTab === 'pairTrades' && token0 && token1"
            :token0="token0"
            :token1="token1"
            :decimals0="decimals0"
            :decimals1="decimals1"
          />
          <LPPositionsTab v-if="activeTab === 'positions'" />
          <WalletTab v-if="activeTab === 'assets'" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import OrderbookPanel from '../components/orderbook/OrderbookPanel.vue'
import OrderEntryPanel from '../components/order/OrderEntryPanel.vue'
import TradingChart from '../components/chart/TradingChart.vue'
import OpenOrdersTab from '../components/portfolio/OpenOrdersTab.vue'
import TradeHistoryTab from '../components/portfolio/TradeHistoryTab.vue'
import LPPositionsTab from '../components/portfolio/LPPositionsTab.vue'
import WalletTab from '../components/portfolio/WalletTab.vue'
import RecentPairTradesTab from '../components/portfolio/RecentPairTradesTab.vue'

const store = useExchangeStore()

const token0 = computed(() => store.selectedToken0)
const token1 = computed(() => store.selectedToken1)

const decimals0 = computed(() => {
  const t = store.getTokenByAddress(store.selectedToken0)
  return t ? Number(t.decimals) : 8
})
const decimals1 = computed(() => {
  const t = store.getTokenByAddress(store.selectedToken1)
  return t ? Number(t.decimals) : 8
})

const clickedPrice = ref<number | null>(null)
const clickedSide = ref<'buy' | 'sell' | null>(null)
const clickedAmount = ref<number | null>(null)
const showChart = ref(false)
const activeTab = ref('orders')

const bottomTabs = [
  { key: 'orders', label: 'Open Orders' },
  { key: 'history', label: 'Trade History' },
  { key: 'pairTrades', label: 'Recent Pair Trades' },
  { key: 'positions', label: 'LP Positions' },
  { key: 'assets', label: 'Assets' },
]

function onPriceClick(price: number, side: 'buy' | 'sell', cumulativeBase: number) {
  clickedPrice.value = price
  clickedSide.value = side
  clickedAmount.value = cumulativeBase > 0 ? cumulativeBase : null
}

// Cross-viewport redirects are handled globally in ExchangeApp.vue so they
// don't leak across views under keep-alive caching.

// Set default pair if none selected
onMounted(() => {
  if (!store.selectedToken0 && store.tokens.length >= 2) {
    const taco = store.tokens.find(t => t.symbol === 'TACO')
    const icp = store.tokens.find(t => t.address === 'ryjl3-tyaaa-aaaaa-aaaba-cai')
    if (taco && icp) {
      store.selectedToken0 = taco.address
      store.selectedToken1 = icp.address
    } else {
      store.selectedToken0 = store.tokens[0].address
      store.selectedToken1 = store.tokens[1].address
    }
  }
})
</script>

<style scoped lang="scss">
.mobile-trade {
  display: flex;
  flex-direction: column;
  height: 100vh;

  background: var(--tx-bg);

  // Same outer padding shell as Pool / Portfolio / OTC / Easy — fluid so
  // resize desktop↔mobile has no visible step.
  &__header {
    padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 0;
    flex-shrink: 0;

    :deep(.tx-topnav) {
      max-width: 1200px;
      margin: 0 auto 12px;
    }

    @media (max-width: 480px) {
      :deep(.tx-topnav__tabs) { gap: 2px; }
    }
  }

  &__main {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    // Reserve space for MobileNav only when it's actually showing.
    @media (max-width: 767px) {
      padding-bottom: 56px;
    }
  }

  &__panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 420px;
    border-bottom: 1px solid var(--border-secondary);
  }

  &__orderbook {
    overflow: hidden;
    border-right: 1px solid var(--border-secondary);
  }

  &__entry {
    overflow: hidden;
  }

  &__chart-toggle {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-tertiary);
    border: none;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);

    &:hover { color: var(--text-primary); }
    &:active { background: var(--bg-elevated); }
  }

  &__chart {
    height: 300px;
    border-bottom: 1px solid var(--border-secondary);
  }

  &__bottom {
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }
}
</style>
