<template>
  <div class="portfolio-view tx-scroll">
    <div class="portfolio-view__shell">
      <ExchangeTopNav active="portfolio" />

      <!-- Hero -->
      <section class="portfolio-view__hero">
        <div class="tx-row tx-row--between portfolio-view__hero-top">
          <div>
            <div class="tx-eyebrow">Total net worth</div>
            <div class="tx-row portfolio-view__hero-worth-row">
              <div class="tx-mono tx-tnum portfolio-view__worth">
                $ {{ netWorthText }}
              </div>
            </div>
          </div>
          <div class="tx-row portfolio-view__tools">
            <router-link to="/recover" class="tx-btn tx-btn--ghost tx-btn--sm">Recover</router-link>
            <router-link v-if="isAdmin" to="/admin" class="tx-btn tx-btn--ghost tx-btn--sm">Admin</router-link>
          </div>
        </div>
        <StatCluster :stats="heroStats" class="portfolio-view__hero-stats" />
      </section>

      <!-- Your wallet composition -->
      <section class="tx-card portfolio-view__allocation" v-if="composition.length">
        <div class="tx-row tx-row--between portfolio-view__alloc-header">
          <h2 class="tx-h2">Your wallet composition</h2>
        </div>
        <AllocationBar :holdings="composition" />
      </section>

      <!-- Tab bar -->
      <div class="tx-tabs portfolio-view__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tx-tab"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.badge != null" class="tx-badge tx-badge--square">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Tab content — KeepAlive caches each tab so switching back is instant
           (WalletTab + LPPositionsTab fetch a lot of state; remounting was
           causing a multi-second reload on every tab flip). Each tab
           component already implements onActivated to refresh its own data
           when re-shown, so the cache stays warm without going stale. -->
      <div class="portfolio-view__content">
        <KeepAlive>
          <WalletTab
            v-if="activeTab === 'wallet'"
            :trends="trendsByToken"
            @trade="goToTrade"
            @total-usd="onTotalUsd"
            @holdings="onHoldings"
          />
          <OpenOrdersTab v-else-if="activeTab === 'orders'" />
          <LPPositionsTab v-else-if="activeTab === 'lp'" />
          <TradeHistoryTab v-else-if="activeTab === 'history'" />
          <ReferralTab v-else-if="activeTab === 'referral'" />
          <DocsTab v-else-if="activeTab === 'docs'" />
        </KeepAlive>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import WalletTab from '../components/portfolio/WalletTab.vue'
import OpenOrdersTab from '../components/portfolio/OpenOrdersTab.vue'
import LPPositionsTab from '../components/portfolio/LPPositionsTab.vue'
import TradeHistoryTab from '../components/portfolio/TradeHistoryTab.vue'
import ReferralTab from '../components/portfolio/ReferralTab.vue'
import DocsTab from '../components/portfolio/DocsTab.vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import StatCluster from '../components/common/StatCluster.vue'
import AllocationBar from '../components/common/AllocationBar.vue'
import { useExchangeStore, type TokenTrend7d } from '../store/exchange.store'
import { ADMIN_PRINCIPALS } from '../../composables/useAdminCheck'

const router = useRouter()
const store = useExchangeStore()
const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(store.principalText))

const activeTab = ref('wallet')
const orderCount = ref(0)
const lpCount = ref(0)

// Total net worth = wallet (free) + LP positions (locked) + claimable fees.
// Wallet feed comes from WalletTab's @total-usd emit; LP feed is computed
// alongside the claimable-fees fetch (single getUserLiquidityDetailed pass).
const walletUsd = ref<number>(0)
const lpHoldingsUsd = ref<number>(0)
const netWorth = computed(() => walletUsd.value + lpHoldingsUsd.value)
const netWorthText = computed(() =>
  netWorth.value > 0
    ? netWorth.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—',
)

// 7-day trend per held token — powers both the 7d PnL stat and the
// Wallet tab sparklines. One `get_token_trends_7d` query per holdings
// refresh; refreshed every 5 min while the view is mounted.
const trendsByToken = ref<Map<string, TokenTrend7d>>(new Map())
let trendsTimer: number | null = null

async function loadTrends(addresses: string[]) {
  if (addresses.length === 0) {
    trendsByToken.value = new Map()
    return
  }
  try {
    const trends = await store.getTokenTrends7d(addresses)
    const next = new Map<string, TokenTrend7d>()
    for (const t of trends) next.set(t.token, t)
    trendsByToken.value = next
  } catch (e) {
    console.warn('[Portfolio] trends fetch failed:', e)
  }
}

// 7d return — "how has my current basket moved vs. 7d ago?"
// Balances are constant across the window (today's holdings as the
// reference basket), so we derive without raw amounts:
//   balance_i × points[earliest]_i = usdValue_i × (points[earliest] / priceNow)
// `points[0]` may be 0 when the token has less than 7d of history — in
// that case fall back to the first non-zero sample, same as the sparklines.
// Return % = (basketNow / basket7dAgo - 1) × 100.
const return7dPct = computed<number | null>(() => {
  if (trendsByToken.value.size === 0) return null
  let basketNow = 0
  let basket7dAgo = 0
  for (const h of holdingsRaw.value) {
    const trend = trendsByToken.value.get(h.address)
    if (!trend || trend.points.length === 0 || trend.priceNow <= 0) continue
    const pStart = trend.points.find(p => p > 0) ?? 0
    if (pStart <= 0) continue
    basketNow += h.usdValue
    basket7dAgo += h.usdValue * (pStart / trend.priceNow)
  }
  if (basketNow <= 0 || basket7dAgo <= 0) return null
  return (basketNow / basket7dAgo - 1) * 100
})

// Fees earned — sum of claimable LP fees across the user's positions, in
// USD. Derived client-side from `getUserLiquidityDetailed()` which already
// exposes fee0/fee1 per position. No backend change needed.
//
// LP holdings — same loop, summing token0Amount/token1Amount * price so the
// position value rolls into Total net worth. Fees are kept separate so the
// hero stat (and the Claim Fees button on each position) stays meaningful.
const feesEarnedUsd = ref<number | null>(null)

async function loadLpAggregates() {
  if (!store.isAuthenticated) {
    feesEarnedUsd.value = null
    lpHoldingsUsd.value = 0
    return
  }
  try {
    const positions = await store.getUserLiquidityDetailed()
    const byAddr = new Map<string, { decimals: number; priceUsd: number }>()
    for (const t of store.tokens) {
      byAddr.set(t.address, {
        decimals: Number(t.decimals),
        priceUsd: store.getTokenPriceUSD(t.address) || 0,
      })
    }
    let feesTotal = 0
    let holdingsTotal = 0
    for (const p of positions) {
      const t0 = byAddr.get(p.token0)
      const t1 = byAddr.get(p.token1)
      if (t0) {
        feesTotal     += (Number(p.fee0)         / 10 ** t0.decimals) * t0.priceUsd
        holdingsTotal += (Number(p.token0Amount) / 10 ** t0.decimals) * t0.priceUsd
      }
      if (t1) {
        feesTotal     += (Number(p.fee1)         / 10 ** t1.decimals) * t1.priceUsd
        holdingsTotal += (Number(p.token1Amount) / 10 ** t1.decimals) * t1.priceUsd
      }
    }
    feesEarnedUsd.value = feesTotal
    lpHoldingsUsd.value = holdingsTotal
  } catch {
    feesEarnedUsd.value = null
    lpHoldingsUsd.value = 0
  }
}

// Wallet composition — raw holdings from WalletTab, then filtered below.
const holdingsRaw = ref<Array<{ address: string; symbol: string; usdValue: number; color: string }>>([])

// Threshold for showing a token individually. Below this, the token rolls
// into a single "Others" bucket at the end of the allocation bar.
const COMPOSITION_THRESHOLD_PCT = 3
const OTHERS_COLOR = '#6b6258'

const composition = computed<Array<{ symbol: string; color: string; value: number }>>(() => {
  const total = holdingsRaw.value.reduce((s, h) => s + h.usdValue, 0)
  if (total <= 0) return []
  const kept: Array<{ symbol: string; color: string; value: number }> = []
  let othersValue = 0
  for (const h of holdingsRaw.value) {
    const pct = (h.usdValue / total) * 100
    if (pct >= COMPOSITION_THRESHOLD_PCT) {
      kept.push({ symbol: h.symbol, color: h.color, value: h.usdValue })
    } else {
      othersValue += h.usdValue
    }
  }
  // Sort kept by value descending for a clean legend.
  kept.sort((a, b) => b.value - a.value)
  if (othersValue > 0) {
    kept.push({ symbol: 'Others', color: OTHERS_COLOR, value: othersValue })
  }
  return kept
})

const heroStats = computed(() => {
  const ret = return7dPct.value
  const fees = feesEarnedUsd.value
  return [
    { eyebrow: 'Open orders',  value: String(orderCount.value) },
    { eyebrow: 'LP positions', value: String(lpCount.value) },
    {
      eyebrow: '7d return',
      value: ret == null
        ? '—'
        : `${ret >= 0 ? '+' : '−'}${Math.abs(ret).toFixed(2)}%`,
      tone: ret == null ? undefined : (ret >= 0 ? 'buy' as const : 'sell' as const),
    },
    {
      eyebrow: 'Fees to claim',
      value: fees == null ? '—' : `$${fees.toFixed(2)}`,
      tone: 'amber' as const,
    },
  ]
})

const tabs = computed(() => [
  { key: 'wallet',   label: 'Wallet',        badge: null as number | null },
  { key: 'orders',   label: 'Open Orders',   badge: orderCount.value || null },
  { key: 'lp',       label: 'LP Positions',  badge: lpCount.value || null },
  { key: 'history',  label: 'Trade History', badge: null as number | null },
  { key: 'referral', label: 'Referral',      badge: null as number | null },
  { key: 'docs',     label: 'Docs',          badge: null as number | null },
])

function goToTrade(tokenAddress: string) {
  router.push({ path: '/', query: { token: tokenAddress } })
}

function onTotalUsd(total: number) {
  walletUsd.value = total
}

function onHoldings(h: Array<{ address: string; symbol: string; usdValue: number; color: string }>) {
  holdingsRaw.value = h
}

// Trend data is PUBLIC — it's a query, works anonymously, and we show
// sparklines for any exchange-listed token regardless of whether the user
// is logged in or holds the token. So trigger trend fetches off
// `store.tokens` (the exchange's token registry), not the user's holdings.
const listedTokenKey = computed(() =>
  [...store.tokens.map(t => t.address)].sort().join('|')
)
watch(listedTokenKey, (key) => {
  if (!key) return
  loadTrends(key.split('|').filter(Boolean))
}, { immediate: true })

const TREND_REFRESH_MS = 5 * 60 * 1000
let unsubscribeMutation: (() => void) | null = null

async function refreshLpCount() {
  try {
    const lps = await store.getUserLiquidityDetailed().catch(() => [])
    lpCount.value = lps.length
  } catch { /* ignore */ }
}

async function refreshAuthOnlyData() {
  if (!store.isAuthenticated) return
  try {
    const orders = await store.getUserTrades().catch(() => [])
    orderCount.value = orders.length
  } catch { /* ignore */ }
  refreshLpCount()
  loadLpAggregates()
}

// On cold F5, auth often restores AFTER this view mounts. Fire the
// auth-only fetches the moment isAuthenticated flips so the hero
// counters and LP totals don't sit empty until the next interaction.
watch(() => store.isAuthenticated, (v, prev) => {
  if (v && !prev) refreshAuthOnlyData()
})

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
    // Fires its own fetch; runs in parallel with the counts query above.
    loadLpAggregates()
  }
  // Re-fetch LP aggregates + counts whenever any LP mutation lands so the
  // hero "Total net worth" doesn't double-count tokens that just left LP
  // and returned to the wallet.
  unsubscribeMutation = store.onMutation((kind) => {
    if (kind === 'lp' || kind === 'claim') {
      loadLpAggregates()
      refreshLpCount()
    }
  })
  // Periodic trend refresh while the view is mounted.
  trendsTimer = window.setInterval(() => {
    const addrs = listedTokenKey.value.split('|').filter(Boolean)
    if (addrs.length) loadTrends(addrs)
  }, TREND_REFRESH_MS)
})

onUnmounted(() => {
  if (trendsTimer !== null) {
    clearInterval(trendsTimer)
    trendsTimer = null
  }
  if (unsubscribeMutation) {
    unsubscribeMutation()
    unsubscribeMutation = null
  }
})
</script>

<style scoped lang="scss">
.portfolio-view {
  min-height: 100vh;
  background: var(--tx-bg);
  /* Fluid horizontal padding scales from 16px (mobile) → 40px (desktop)
     so resize never produces a visual step. */
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 60px;
  overflow-y: auto;

  &__shell {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__hero {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  &__hero-top  { align-items: flex-start; }
  &__hero-worth-row { gap: 14px; align-items: baseline; margin-top: 4px; }
  &__worth {
    font-size: 44px;
    font-weight: 500;
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--tx-ink);
  }
  &__tools { gap: 8px; }

  &__hero-stats { margin-top: 4px; }

  &__allocation { padding: 18px; }
  &__alloc-header { margin-bottom: 12px; }

  &__tabs {
    margin-top: 8px;
  }

  &__content { min-height: 300px; padding-top: 16px; }

  @media (max-width: 640px) {
    &__worth { font-size: 32px; }
    &__hero-top { flex-direction: column; gap: 12px; }
  }
}
</style>
