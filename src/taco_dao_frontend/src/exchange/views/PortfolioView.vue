<template>
  <div class="portfolio-view">
    <ExchangeHeader />
    <main class="portfolio-view__main">
      <h1 class="portfolio-view__heading">Portfolio</h1>

      <!-- Metrics Bar -->
      <div class="portfolio-view__metrics">
        <div class="portfolio-view__metric">
          <span class="portfolio-view__metric-label">Open Orders</span>
          <span class="portfolio-view__metric-value num">{{ orderCount }}</span>
        </div>
        <div class="portfolio-view__metric">
          <span class="portfolio-view__metric-label">LP Positions</span>
          <span class="portfolio-view__metric-value num">{{ lpCount }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="ex-tab-bar portfolio-view__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="ex-tab-btn portfolio-view__tab"
          :class="{ 'ex-tab-btn--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.badge" class="portfolio-view__tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="portfolio-view__content">
        <WalletTab v-if="activeTab === 'wallet'" @trade="goToTrade" />
        <OpenOrdersTab v-else-if="activeTab === 'orders'" />
        <LPPositionsTab v-else-if="activeTab === 'lp'" />
        <TradeHistoryTab v-else-if="activeTab === 'history'" />
        <ReferralTab v-else-if="activeTab === 'referral'" />
      </div>

      <!-- Tools section -->
      <div class="portfolio-view__tools">
        <router-link to="/recover" class="portfolio-view__tool-link">
          Recover Stuck Funds
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="portfolio-view__tool-link portfolio-view__tool-link--admin">
          Admin Panel
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ExchangeHeader from '../components/layout/ExchangeHeader.vue'
import WalletTab from '../components/portfolio/WalletTab.vue'
import OpenOrdersTab from '../components/portfolio/OpenOrdersTab.vue'
import LPPositionsTab from '../components/portfolio/LPPositionsTab.vue'
import TradeHistoryTab from '../components/portfolio/TradeHistoryTab.vue'
import ReferralTab from '../components/portfolio/ReferralTab.vue'
import { useExchangeStore } from '../store/exchange.store'
import { ADMIN_PRINCIPALS } from '../../composables/useAdminCheck'

const router = useRouter()
const store = useExchangeStore()
const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(store.principalText))

const activeTab = ref('wallet')
const orderCount = ref(0)
const lpCount = ref(0)

const tabs = computed(() => [
  { key: 'wallet', label: 'Wallet', badge: null },
  { key: 'orders', label: 'Open Orders', badge: orderCount.value > 0 ? orderCount.value : null },
  { key: 'lp', label: 'LP Positions', badge: lpCount.value > 0 ? lpCount.value : null },
  { key: 'history', label: 'Trade History', badge: null },
  { key: 'referral', label: 'Referral', badge: null },
])

function goToTrade(tokenAddress: string) {
  router.push({ path: '/', query: { token: tokenAddress } })
}

onMounted(async () => {
  if (store.isAuthenticated) {
    try {
      const [orders, lps] = await Promise.all([
        store.getUserTrades().catch(() => []),
        store.getUserLiquidityDetailed().catch(() => []),
      ])
      orderCount.value = orders.length
      lpCount.value = lps.length
    } catch { /* ignore */ }
  }
})
</script>

<style scoped lang="scss">
.portfolio-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);

  &__main {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4) var(--space-6);
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }

  &__heading {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4);
  }

  &__metrics {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  &__metric {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    min-width: 120px;
  }

  &__metric-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__metric-value {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  &__tabs {
    background: none;
  }

  &__tab {
    padding: var(--space-2) var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  &__tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--accent-primary-muted);
    color: var(--accent-primary);
    font-size: 10px;
    font-weight: var(--weight-bold);
  }

  &__content {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-top: none;
    border-radius: 0 0 8px 8px;
    min-height: 300px;
  }

  &__tools {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-primary);
  }

  &__tool-link {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    background: var(--bg-secondary);
    transition: color 0.15s, background 0.15s;

    &:hover {
      color: var(--text-primary);
      background: var(--bg-tertiary);
    }

    &--admin {
      color: var(--accent-primary);
      &:hover { color: var(--accent-primary-hover); }
    }
  }
}
</style>
