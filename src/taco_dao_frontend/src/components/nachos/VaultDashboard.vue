<template>

  <div class="vault-dashboard">

    <!-- key metrics row -->
    <div class="vault-dashboard__metrics">

      <!-- NAV per token -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l2">
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
      <div class="vault-dashboard__metric-card taco-container taco-container--l2">
        <span class="vault-dashboard__metric-label">Portfolio Value</span>
        <span class="vault-dashboard__metric-value">
          {{ nachosStore.formatE8s(nachosStore.portfolioValueICP) }} ICP
        </span>
        <span v-if="nachosStore.icpPriceUsd" class="vault-dashboard__metric-sub">
          ~${{ portfolioUSD }}
        </span>
      </div>

      <!-- NACHOS supply -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l2">
        <span class="vault-dashboard__metric-label">NACHOS Supply</span>
        <span class="vault-dashboard__metric-value">
          {{ nachosStore.formatE8s(nachosStore.nachosSupply) }}
        </span>
      </div>

      <!-- fees -->
      <div class="vault-dashboard__metric-card taco-container taco-container--l2">
        <span class="vault-dashboard__metric-label">Fees</span>
        <span class="vault-dashboard__metric-value">
          Mint {{ nachosStore.formatBasisPoints(nachosStore.mintFeeBasisPoints) }} /
          Burn {{ nachosStore.formatBasisPoints(nachosStore.burnFeeBasisPoints) }}
        </span>
      </div>

    </div>

    <!-- portfolio breakdown -->
    <div v-if="nachosStore.portfolio.length > 0" class="vault-dashboard__portfolio">

      <!-- section title -->
      <h3 class="vault-dashboard__section-title">Portfolio Breakdown</h3>

      <div class="vault-dashboard__portfolio-layout">

        <!-- portfolio table -->
        <div class="vault-dashboard__table-wrap">
          <table class="vault-dashboard__table">
            <thead>
              <tr>
                <th>Token</th>
                <th class="text-end">Balance</th>
                <th class="text-end">Value (ICP)</th>
                <th class="text-end">Current</th>
                <th class="text-end">Target</th>
                <th class="text-end">Deviation</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in nachosStore.portfolio" :key="entry.symbol">
                <td class="fw-bold">{{ entry.symbol }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(entry.balance, Number(entry.decimals)) }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(entry.valueICP) }}</td>
                <td class="text-end">{{ (Number(entry.currentBasisPoints) / 100).toFixed(1) }}%</td>
                <td class="text-end">{{ (Number(entry.targetBasisPoints) / 100).toFixed(1) }}%</td>
                <td class="text-end"
                    :class="deviationClass(entry.currentBasisPoints, entry.targetBasisPoints)">
                  {{ deviationText(entry.currentBasisPoints, entry.targetBasisPoints) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- donut chart -->
        <div class="vault-dashboard__chart-wrap">
          <apexchart
            v-if="chartSeries.length > 0"
            type="donut"
            :options="chartOptions"
            :series="chartSeries"
            height="280"
          />
        </div>

      </div>

    </div>

    <!-- no data -->
    <div v-else-if="!nachosStore.dashboardData" class="vault-dashboard__loading">
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

const deviationClass = (current: bigint, target: bigint) => {
  const diff = Number(current) - Number(target)
  if (diff > 50) return 'text-danger'
  if (diff < -50) return 'text-success'
  return ''
}

const deviationText = (current: bigint, target: bigint) => {
  const diff = (Number(current) - Number(target)) / 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}%`
}

// donut chart
const chartSeries = computed(() =>
  nachosStore.portfolio.map((p: any) => Number(p.currentBasisPoints))
)

// Build a lookup of ICP value per token for tooltip
const tokenICPValues = computed(() =>
  nachosStore.portfolio.map((p: any) => formatE8s1dp(p.valueICP) + ' ICP')
)

const formatE8s1dp = (e8s: bigint): string => {
  const val = Number(e8s) / 1e8
  return val.toFixed(1)
}

const totalPortfolioICP = computed(() =>
  formatE8s1dp(nachosStore.portfolioValueICP) + ' ICP'
)

const chartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
    background: 'transparent',
  },
  labels: nachosStore.portfolio.map((p: any) => p.symbol),
  legend: {
    position: 'bottom' as const,
    labels: { colors: 'var(--black-to-white)' },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}%`,
  },
  tooltip: {
    y: {
      formatter: (_val: number, opts: any) => {
        const idx = opts.seriesIndex
        return tokenICPValues.value[idx] ?? ''
      },
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '55%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '14px',
            color: 'var(--black-to-white)',
          },
          value: {
            show: true,
            fontSize: '13px',
            color: 'var(--black-to-white)',
            formatter: (val: string) => {
              // On hover this receives the series value; for total it gets sum
              // We override the total formatter below for the center label
              return val
            },
          },
          total: {
            show: true,
            showAlways: true,
            label: 'Portfolio',
            color: 'var(--black-to-white)',
            formatter: () => totalPortfolioICP.value,
          },
        },
      },
    },
  },
  stroke: { width: 1 },
}))
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
    font-size: 0.75rem;
    text-transform: uppercase;
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

  &__section-title {
    font-size: 1.25rem;
    font-family: 'Space Mono', monospace;
    margin-bottom: 0;
  }

  &__portfolio-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1rem;
    align-items: start;

    @media (max-width: 767.98px) {
      grid-template-columns: 1fr;
    }
  }

  &__table-wrap {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    font-size: 0.875rem;
    font-family: 'Space Mono', monospace;
    border-collapse: collapse;

    th, td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--dark-orange-to-brown);
    }

    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      opacity: 0.85;
      font-weight: 600;
      border-bottom: 2px solid var(--dark-orange-to-brown);
    }
  }

  &__chart-wrap {
    display: flex;
    justify-content: center;
  }

  &__loading {
    text-align: center;
    padding: 2rem;
    opacity: 0.75;
    font-family: 'Space Mono', monospace;
  }
}

.text-danger { color: var(--red-to-light-red) !important; }
.text-success { color: var(--success-green) !important; }
</style>
