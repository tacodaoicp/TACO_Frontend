<template>

  <div v-if="nachosStore.portfolio.length > 0" class="portfolio-breakdown">

    <!-- section title -->
    <h3 class="portfolio-breakdown__section-title">Portfolio Breakdown</h3>

    <div class="portfolio-breakdown__layout taco-container taco-container--l1">

      <!-- portfolio table -->
      <div class="portfolio-breakdown__table-wrap">
        <table class="portfolio-breakdown__table">
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
      <div class="portfolio-breakdown__chart-wrap">
        <apexchart
          v-if="chartSeries.length > 0"
          type="donut"
          :options="chartOptions"
          :series="chartSeries"
          height="260"
        />
      </div>

    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

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
            formatter: (val: string) => val,
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
.portfolio-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__section-title {
    font-size: 1rem;
    font-family: 'Space Mono', monospace;
    color: var(--gold);
    margin-bottom: 0;
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 1rem;
    align-items: start;

    @media (max-width: 767.98px) {
      grid-template-columns: 1fr;
    }
  }

  &__table-wrap {
    overflow-x: auto;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 0.375rem;
    padding: 0.5rem;
  }

  &__table {
    width: 100%;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
    border-collapse: collapse;

    th, td {
      padding: 0.375rem 0.5rem;
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
    background: rgba(0, 0, 0, 0.08);
    border-radius: 0.375rem;
    padding: 0.5rem;
  }
}

.text-danger { color: var(--red-to-light-red) !important; }
.text-success { color: var(--success-green) !important; }
</style>
