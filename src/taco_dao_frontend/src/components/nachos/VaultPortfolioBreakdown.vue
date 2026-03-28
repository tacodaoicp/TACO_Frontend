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
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in nachosStore.portfolio" :key="entry.symbol">
              <td class="fw-bold">{{ entry.symbol }}</td>
              <td class="text-end">{{ nachosStore.formatE8s(entry.balance, Number(entry.decimals)) }}</td>
              <td class="text-end">{{ nachosStore.formatE8s(entry.valueICP) }}</td>
              <td class="text-end">{{ (Number(entry.currentBasisPoints) / 100).toFixed(1) }}%</td>
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

// Warm earth-tone palette matching the brown/gold theme
const themeColors = [
  '#D4A853', // warm gold
  '#C17829', // burnt orange
  '#6B8E4E', // olive green
  '#A0522D', // sienna
  '#B8860B', // dark goldenrod
  '#8B5E3C', // saddle brown
  '#CC7A4A', // copper
  '#7B6B4A', // dark khaki
  '#9B7653', // tan
  '#6E7B3A', // moss
]

const chartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
    background: 'transparent',
    dropShadow: {
      enabled: true,
      top: 2,
      left: 0,
      blur: 6,
      opacity: 0.35,
    },
  },
  colors: themeColors,
  labels: nachosStore.portfolio.map((p: any) => p.symbol),
  legend: {
    position: 'bottom' as const,
    fontFamily: 'Space Mono, monospace',
    fontSize: '11px',
    labels: { colors: 'var(--text-cream)' },
    markers: { size: 6, offsetX: -2 },
    itemMargin: { horizontal: 8, vertical: 2 },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val >= 3 ? `${val.toFixed(1)}%` : '',
    style: {
      fontSize: '11px',
      fontFamily: 'Space Mono, monospace',
      fontWeight: 600,
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 0,
      blur: 2,
      opacity: 0.6,
    },
  },
  tooltip: {
    theme: 'dark',
    style: { fontFamily: 'Space Mono, monospace', fontSize: '12px' },
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
        size: '62%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '13px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 600,
            color: 'var(--gold)',
            offsetY: -4,
          },
          value: {
            show: true,
            fontSize: '14px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            color: 'var(--text-cream)',
            offsetY: 4,
            formatter: (val: string) => val,
          },
          total: {
            show: true,
            showAlways: true,
            label: 'Portfolio',
            color: 'var(--gold)',
            fontFamily: 'Space Mono, monospace',
            fontSize: '13px',
            formatter: () => totalPortfolioICP.value,
          },
        },
      },
    },
  },
  stroke: { width: 2, colors: ['rgba(58, 28, 8, 0.8)'] },
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
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid var(--table-row-border);
    border-radius: 0.5rem;
    padding: 1rem;
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
    align-items: center;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid var(--table-row-border);
    border-radius: 0.5rem;
    padding: 1rem;
  }
}

.text-danger { color: var(--red-to-light-red) !important; }
.text-success { color: var(--success-green) !important; }
</style>
