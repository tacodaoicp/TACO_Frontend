<template>

  <div class="vault-dashboard">

    <!-- key metrics row -->
    <div class="vault-dashboard__metrics">

      <!-- NAV per token -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">NAV per NACHOS</span>
        <span class="vault-dashboard__metric-value">
          {{ nav ? nachosStore.formatE8s(nav.navPerTokenE8s) : '—' }} ICP
        </span>
        <span v-if="navChange24h !== null"
              class="vault-dashboard__metric-change"
              :class="navChangeClass">
          {{ navChangePercent }} (24h)
        </span>
      </div>

      <!-- portfolio value -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">Portfolio Value</span>
        <span class="vault-dashboard__metric-value">
          {{ nachosStore.formatE8s(nachosStore.portfolioValueICP) }} ICP
        </span>
        <span v-if="nachosStore.icpPriceUsd" class="vault-dashboard__metric-sub">
          ~${{ portfolioUSD }}
        </span>
      </div>

      <!-- NACHOS supply -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">NACHOS Supply</span>
        <span class="vault-dashboard__metric-value">
          {{ nachosStore.formatE8s(nachosStore.nachosSupply) }}
        </span>
      </div>

      <!-- fees -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">Fees</span>
        <span class="vault-dashboard__metric-value">
          Mint {{ nachosStore.formatBasisPoints(nachosStore.mintFeeBasisPoints) }} /
          Burn {{ nachosStore.formatBasisPoints(nachosStore.burnFeeBasisPoints) }}
        </span>
      </div>

    </div>

    <!-- no data -->
    <div v-if="!nachosStore.dashboardData" class="vault-dashboard__loading">
      Loading dashboard data...
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

const nav = computed(() => nachosStore.nav)

// 24h NAV change — computed from navHistory, skipping the first (genesis) snapshot
const navChange24h = computed(() => {
  const history = nachosStore.navHistory
  if (history.length < 2) return null
  // Current NAV is the last snapshot
  const current = history[history.length - 1]
  const currentNav = Number(current.navPerTokenE8s)
  if (currentNav === 0) return null
  // Find the snapshot closest to 24h ago (timestamps are nanoseconds)
  const now = BigInt(Date.now()) * 1_000_000n
  const oneDayAgo = now - 86_400_000_000_000n // 24h in nanoseconds
  // Search backwards from second-to-last, skip index 0 (genesis)
  let best = history[1] // fallback to second snapshot (first non-genesis)
  for (let i = history.length - 2; i >= 1; i--) {
    if (history[i].timestamp <= oneDayAgo) {
      best = history[i]
      break
    }
    best = history[i] // keep closest to 24h ago
  }
  const baseNav = Number(best.navPerTokenE8s)
  if (baseNav === 0) return null
  return ((currentNav - baseNav) / baseNav) * 100
})

const navChangePercent = computed(() => {
  if (navChange24h.value === null) return ''
  const sign = navChange24h.value >= 0 ? '+' : ''
  return `${sign}${navChange24h.value.toFixed(2)}%`
})

const navChangeClass = computed(() => {
  if (navChange24h.value === null) return ''
  if (navChange24h.value > 0) return 'vault-dashboard__metric-change--positive'
  if (navChange24h.value < 0) return 'vault-dashboard__metric-change--negative'
  return ''
})

const portfolioUSD = computed(() => {
  const icpValue = Number(nachosStore.portfolioValueICP) / 1e8
  return (icpValue * nachosStore.icpPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
</script>

<style scoped lang="scss">
.vault-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  &__metric-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__metric-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    opacity: 0.85;
    font-family: 'Space Mono', monospace;
  }

  &__metric-value {
    font-size: 1.125rem;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
  }

  &__metric-sub {
    font-size: 0.8rem;
    opacity: 0.75;
  }

  &__metric-change {
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;

    &--positive { color: var(--success-green); }
    &--negative { color: var(--red-to-light-red); }
  }

  &__loading {
    text-align: center;
    padding: 2rem;
    opacity: 0.75;
    font-family: 'Space Mono', monospace;
  }
}
</style>
