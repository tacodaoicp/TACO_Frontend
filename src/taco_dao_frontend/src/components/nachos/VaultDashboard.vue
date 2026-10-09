<template>

  <div class="vault-dashboard">

    <!-- key metrics row -->
    <div class="vault-dashboard__metrics">

      <!-- NAV per token -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">NAV per NACHO</span>
        <span class="vault-dashboard__metric-value">
          <span v-if="loading" class="vault-dashboard__skeleton"></span>
          <template v-else>{{ nav ? nachosStore.formatE8s(nav.navPerTokenE8s) : '—' }} ICP</template>
        </span>
        <span v-if="navUSD !== null" class="vault-dashboard__metric-sub">
          ~${{ navUSD }} USD
        </span>
        <div v-if="navChange24h !== null || navChange24hUSD !== null"
             class="vault-dashboard__metric-change-row">
          <span v-if="navChange24h !== null"
                class="vault-dashboard__metric-change"
                :class="navChangeClass">
            {{ navChangePercent }} ICP
          </span>
          <span v-if="navChange24hUSD !== null"
                class="vault-dashboard__metric-change"
                :class="navChangeClassUSD">
            {{ navChangePercentUSD }} USD
          </span>
          <span class="vault-dashboard__metric-change-suffix">(24h)</span>
        </div>
      </div>

      <!-- portfolio value -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">Portfolio Value</span>
        <span class="vault-dashboard__metric-value">
          <span v-if="loading" class="vault-dashboard__skeleton"></span>
          <template v-else>{{ nachosStore.formatE8s(nachosStore.portfolioValueICP) }} ICP</template>
        </span>
        <!-- not while loading: the value is still 0 then and read as "~$0.00" -->
        <span v-if="nachosStore.icpPriceUsd && !loading" class="vault-dashboard__metric-sub">
          ~${{ portfolioUSD }}
        </span>
      </div>

      <!-- NACHOS supply -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">NACHO Supply</span>
        <span class="vault-dashboard__metric-value">
          <span v-if="loading" class="vault-dashboard__skeleton"></span>
          <template v-else>{{ nachosStore.formatE8s(nachosStore.nachosSupply) }}</template>
        </span>
      </div>

      <!-- fees -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l1">
        <span class="vault-dashboard__metric-label">Fees</span>
        <span class="vault-dashboard__metric-value">
          <span v-if="loading" class="vault-dashboard__skeleton"></span>
          <template v-else>Mint {{ nachosStore.formatBasisPoints(nachosStore.mintFeeBasisPoints) }} /
          Burn {{ nachosStore.formatBasisPoints(nachosStore.burnFeeBasisPoints) }}</template>
        </span>
      </div>

    </div>

    <!-- age of the numbers while they are still the ones from an earlier visit -->
    <div v-if="updatedAgo" class="vault-dashboard__age">
      <i class="fa-solid fa-clock-rotate-left"></i>
      {{ updatedAgo }}
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

const nav = computed(() => nachosStore.nav)

// True until the dashboard payload arrives. Drives skeleton placeholders so the
// page paints its full structure instantly instead of gating on a "Loading…"
// message. Cached data (warm visits) clears this immediately; cold visits show
// shimmering skeletons that fill in when the fetch lands.
const loading = computed(() => !nachosStore.dashboardData)

// Ticks so the age line stays right while the page is open
const now = useNow({ interval: 30_000 })

// "Updated 5 min ago" while the numbers come from an earlier visit (a reload of
// a tab that sat idle) and the refresh has not landed yet, or keeps failing
const updatedAgo = computed<string | null>(() => {
  const at = nachosStore.dashboardUpdatedAt
  if (!at) return null
  const age = now.value.getTime() - at
  if (age < 2 * 60_000) return null
  const minutes = Math.floor(age / 60_000)
  if (minutes < 60) return `Updated ${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Updated ${hours} h ago`
  return `Updated ${new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
})

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

// Live USD NAV — current ICP NAV × current ICP/USD price. Returns null when
// either input is missing so the sub-line gracefully hides.
const navUSD = computed<string | null>(() => {
  if (!nav.value || !nachosStore.icpPriceUsd) return null
  const icpNav = Number(nav.value.navPerTokenE8s) / 1e8
  return (icpNav * nachosStore.icpPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

// 24h NAV change in USD — uses navHistoryUSD (each snapshot has the ICP/USD
// rate captured at write time, so this reflects both NAV movement and ICP/USD
// movement, not just today's rate scaled across history).
const navChange24hUSD = computed<number | null>(() => {
  const history = nachosStore.navHistoryUSD
  if (history.length < 2) return null
  const current = history[history.length - 1]
  const currentNavUSD = Number(current.navPerTokenUSD)
  if (currentNavUSD === 0) return null
  const now = BigInt(Date.now()) * 1_000_000n
  const oneDayAgo = now - 86_400_000_000_000n
  let best: any = history[1] // skip genesis at index 0 — same as ICP path
  for (let i = history.length - 2; i >= 1; i--) {
    if (history[i].timestamp <= oneDayAgo) {
      best = history[i]
      break
    }
    best = history[i]
  }
  const baseNavUSD = Number(best.navPerTokenUSD)
  if (baseNavUSD === 0) return null
  return ((currentNavUSD - baseNavUSD) / baseNavUSD) * 100
})

const navChangePercentUSD = computed(() => {
  if (navChange24hUSD.value === null) return ''
  const sign = navChange24hUSD.value >= 0 ? '+' : ''
  return `${sign}${navChange24hUSD.value.toFixed(2)}%`
})

const navChangeClassUSD = computed(() => {
  if (navChange24hUSD.value === null) return ''
  if (navChange24hUSD.value > 0) return 'vault-dashboard__metric-change--positive'
  if (navChange24hUSD.value < 0) return 'vault-dashboard__metric-change--negative'
  return ''
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

  &__metric-change-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: baseline;
  }

  &__metric-change-suffix {
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.6;
  }

  &__age {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: -0.5rem;
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.65;
  }

  // Opacity pulse: runs on the compositor. The moving gradient it replaces
  // repainted on the main thread every frame while the page was booting.
  &__skeleton {
    display: inline-block;
    min-width: 4.5rem;
    height: 1.05em;
    border-radius: 5px;
    vertical-align: middle;
    background: rgba(255, 255, 255, 0.16);
    animation: vault-dashboard-pulse 1.4s ease-in-out infinite;
  }
}

@keyframes vault-dashboard-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
</style>
