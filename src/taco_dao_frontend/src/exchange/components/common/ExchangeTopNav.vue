<template>
  <div class="tx-topnav tx-row tx-row--between">
    <div class="tx-row tx-topnav__left">
      <a
        href="#"
        class="tx-topnav__brand tx-row"
        aria-label="TACO Exchange home"
        @click.prevent="navigate('/')"
      >
        <ExchangeBrandMark />
        <span class="tx-topnav__brand-text">
          taco<span class="tx-orange">·</span>exchange
        </span>
        <span
          v-if="showProBadge"
          class="tx-badge tx-badge--orange tx-badge--square tx-topnav__pro-badge"
        >PRO</span>
      </a>
      <PairSelector v-if="showPair" class="tx-topnav__pair" />
      <PairStatsCluster v-if="showStats" class="tx-topnav__stats" />
    </div>

    <div class="tx-row tx-topnav__tabs">
      <button
        v-for="item in items"
        :key="item.route"
        class="tx-tab"
        :aria-selected="active === item.key || route.path === item.route"
        @click="navigate(item.route)"
      >
        {{ item.label }}
      </button>
      <ThemeToggle class="tx-topnav__theme" />
      <WalletButton class="tx-topnav__wallet" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import ExchangeBrandMark from './ExchangeBrandMark.vue'
import ThemeToggle from './ThemeToggle.vue'
import WalletButton from './WalletButton.vue'
import PairSelector from './PairSelector.vue'
import PairStatsCluster from './PairStatsCluster.vue'

// Pro view (`/`) is desktop-only — on mobile, route to `/trade` directly
// instead of letting ProTradeView mount and immediately redirect (which
// causes a visible flash). Brand link gets the same treatment so tapping
// the logo on mobile also lands on the right view.
function navigate(target: string) {
  if (target === '/' && typeof window !== 'undefined'
      && window.matchMedia('(max-width: 767px)').matches) {
    router.push('/trade')
    return
  }
  router.push(target)
}

withDefaults(defineProps<{
  active?: 'easy' | 'pro' | 'pool' | 'portfolio' | 'otc'
  items?: Array<{ key: string; label: string; route: string }>
  showPair?: boolean
  showStats?: boolean
  showProBadge?: boolean
}>(), {
  showPair: false,
  showStats: false,
  showProBadge: false,
  items: () => [
    { key: 'easy',      label: 'Easy',      route: '/easy' },
    { key: 'pro',       label: 'Pro',       route: '/' },
    { key: 'otc',       label: 'OTC',       route: '/otc' },
    { key: 'pool',      label: 'Pool',      route: '/pool' },
    { key: 'portfolio', label: 'Portfolio', route: '/portfolio' },
  ],
})

const route = useRoute()
const router = useRouter()
</script>

<style scoped>
/* Single-row header. When the viewport gets too narrow we hide content
   (stats → brand text → etc) in that order rather than wrapping. */
.tx-topnav {
  margin-bottom: 20px;
  min-width: 0;
  width: 100%;
  flex-wrap: nowrap;
  gap: 12px;
}
.tx-topnav__left {
  gap: 14px;
  min-width: 0;
  flex-wrap: nowrap;
}
.tx-topnav__brand {
  gap: 8px;
  color: var(--tx-ink);
  text-decoration: none;
  flex-shrink: 0;
}
.tx-topnav__pair {
  flex-shrink: 0;
}
.tx-topnav__stats {
  flex-shrink: 0;
}
.tx-topnav__pro-badge {
  margin-left: 6px;
}
.tx-topnav__brand-text {
  font-weight: 700;
  letter-spacing: -0.01em;
  font-size: 15px;
}
.tx-topnav__tabs {
  gap: 4px;
  flex-wrap: nowrap;
  min-width: 0;
}
.tx-topnav__tabs .tx-tab {
  font-size: 13px;
  white-space: nowrap;
}
.tx-topnav__theme { margin-left: 8px; }
.tx-topnav__wallet { margin-left: 4px; }

/* Narrow-viewport shedding (strictest first). Everything stays on one row. */
@media (max-width: 900px) {
  .tx-topnav__pro-badge { display: none; }
}
@media (max-width: 767px) {
  .tx-topnav__brand-text { display: none; }     /* logo mark only */
  .tx-topnav__tabs .tx-tab {
    padding: 6px 8px;
    font-size: 12px;
  }
  .tx-topnav__theme { margin-left: 4px; }
}
</style>
