<template>

  <div v-if="nachosStore.portfolio.length > 0" class="portfolio-breakdown">

    <!-- section title -->
    <h3 class="portfolio-breakdown__section-title">Portfolio Breakdown</h3>

    <div class="portfolio-breakdown__layout taco-container taco-container--l1">

      <!-- donut chart -->
      <div class="portfolio-breakdown__chart-wrap">
        <apexchart
          type="donut"
          :options="chartOptions"
          :series="chartSeries"
          height="380"
          @dataPointSelection="onSliceSelect"
          @mounted="onChartMounted"
          @updated="reselectSlice"
        />
      </div>

      <!-- legend -->
      <ul class="portfolio-breakdown__legend">
        <li v-for="entry in holdings" :key="entry.symbol" class="portfolio-breakdown__legend-item">
          <span class="portfolio-breakdown__legend-dot" :style="{ background: colorFor(entry) }"></span>
          {{ entry.symbol }}
          <span class="portfolio-breakdown__legend-pct">{{ percent(entry) }}%</span>
        </li>
      </ul>

      <!-- holdings table, collapsed by default -->
      <details class="portfolio-breakdown__holdings" :open="holdingsOpen" @toggle="onHoldingsToggle">
        <summary class="portfolio-breakdown__summary">
          Holdings ({{ holdings.length }} {{ holdings.length === 1 ? 'token' : 'tokens' }})
          <i class="fa-solid fa-chevron-down portfolio-breakdown__chevron" aria-hidden="true"></i>
        </summary>
        <div class="portfolio-breakdown__table-wrap">
          <table class="portfolio-breakdown__table">
            <thead>
              <tr>
                <th>Token</th>
                <!-- hidden below md so Value and Current fit without a sideways swipe -->
                <th class="text-end d-none d-md-table-cell">Balance</th>
                <th class="text-end">Value (ICP)</th>
                <th class="text-end">Current</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in holdings" :key="entry.symbol">
                <td class="fw-bold">{{ entry.symbol }}</td>
                <td class="text-end d-none d-md-table-cell">{{ nachosStore.formatE8s(entry.balance, Number(entry.decimals)) }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(entry.valueICP) }}</td>
                <td class="text-end">{{ percent(entry) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

// Largest share first so the ring, legend and table read in the same order
const holdings = computed(() =>
  [...nachosStore.portfolio].sort((a: any, b: any) => Number(b.currentBasisPoints) - Number(a.currentBasisPoints))
)

const percent = (entry: any) => (Number(entry.currentBasisPoints) / 100).toFixed(1)

// Plain string keys stay equal across refreshes that change nothing, so the chart
// is only redrawn when its numbers or token order really change
const ringOrder = computed(() => holdings.value.map((p: any) => p.symbol).join('|'))
const vaultOrder = computed(() => nachosStore.portfolio.map((p: any) => p.symbol).join('|'))
const seriesKey = computed(() => holdings.value.map((p: any) => Number(p.currentBasisPoints)).join(','))

// donut chart
const chartSeries = computed(() => (seriesKey.value ? seriesKey.value.split(',').map(Number) : []))

// Build a lookup of ICP value per token for tooltip
const tokenICPValues = computed(() =>
  holdings.value.map((p: any) => formatE8s1dp(p.valueICP) + ' ICP')
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
  '#7C95A8', // dusty blue
  '#73608A', // muted violet
  '#4F7C82', // muted teal
  '#BC8F8F', // rosy brown
  '#9AAE6B', // sage
  '#8A6E8C', // dusty purple
  '#C3B091', // khaki
  '#C65D3B', // terracotta
  '#7D9D72', // laurel
  '#A68A64', // taupe
]

// A token keeps the colour of its slot in the vault's own token order, so a
// change in rank never repaints it and the ring and legend always match
const colorOf = (symbol: string) =>
  themeColors[Math.max(0, vaultOrder.value.split('|').indexOf(symbol)) % themeColors.length]
const colorFor = (entry: any) => colorOf(entry.symbol)

// What the user opened or picked survives data refreshes and redraws
const holdingsOpen = useSessionStorage('vaultHoldingsOpen', false)
const onHoldingsToggle = (e: Event) => { holdingsOpen.value = (e.target as HTMLDetailsElement).open }

const selectedSlice = useSessionStorage('vaultSelectedSlice', '')
const onSliceSelect = (_e: unknown, _ctx: unknown, cfg: any) => {
  const on = cfg.selectedDataPoints?.[0]?.includes(cfg.dataPointIndex)
  selectedSlice.value = on ? ringOrder.value.split('|')[cfg.dataPointIndex] ?? '' : ''
}
// A redraw drops the expanded slice, so pick it again. Programmatic toggles fire no
// selection event, and the stale selection is cleared first so the toggle selects.
const reselectSlice = (ctx: any) => {
  if (!selectedSlice.value || !ctx?.el?.isConnected) return
  const i = ringOrder.value.split('|').indexOf(selectedSlice.value)
  const slice = i < 0 ? null : ctx.el.querySelector(`.apexcharts-pie-area[j="${i}"]`)
  if (!slice) { selectedSlice.value = ''; return }
  if (slice.getAttribute('data:pieClicked') === 'true') return
  ctx.w.globals.selectedDataPoints = []
  ctx.el.querySelectorAll('.apexcharts-pie-area').forEach((el: Element) => el.setAttribute('selected', 'false'))
  ctx.toggleDataPointSelection(i)
}
// Wait out the 800ms intro animation, which would otherwise redraw the slice back
const onChartMounted = (ctx: any) => setTimeout(() => reselectSlice(ctx), 900)

const chartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
    background: 'transparent',
    // data refreshes redraw in place instead of replaying the animation
    animations: { dynamicAnimation: { enabled: false } },
    dropShadow: {
      enabled: true,
      top: 2,
      left: 0,
      blur: 6,
      opacity: 0.35,
    },
  },
  colors: ringOrder.value.split('|').map(colorOf),
  labels: ringOrder.value.split('|'),
  // The HTML legend replaces it; with ~19 tokens it took most of the chart height
  legend: { show: false },
  dataLabels: {
    enabled: true,
    // val is ApexCharts' share of the ring total; print the same figure as the legend
    formatter: (val: number, opts: any) => {
      const entry = holdings.value[opts.seriesIndex]
      return val >= 4 && entry ? `${percent(entry)}%` : ''
    },
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
            fontSize: '14px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 600,
            color: 'var(--gold)',
            offsetY: -4,
          },
          value: {
            show: true,
            fontSize: '16px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            color: 'var(--text-cream)',
            offsetY: 4,
            // hovered slice value arrives in basis points
            formatter: (val: string) => `${(Number(val) / 100).toFixed(1)}%`,
          },
          total: {
            show: true,
            // off, so a tapped or hovered slice shows its name and share in the centre
            showAlways: false,
            label: 'Portfolio',
            color: 'var(--gold)',
            fontFamily: 'Space Mono, monospace',
            fontSize: '14px',
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
  // Vault Analytics follows directly when logged out and brings no top spacing
  margin-bottom: 1rem;

  &__section-title {
    font-size: 1rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gold);
    margin-bottom: 0;
  }

  &__layout {
    display: flex;
    flex-direction: column;
  }

  // Square box sized by the card width, so it reserves the donut's footprint
  // while the lazy apexcharts lib loads. The chart's height="380" is never the
  // smaller side, so apexcharts sizes the ring from the width and fits this box.
  &__chart-wrap {
    width: 100%;
    max-width: 380px;
    aspect-ratio: 1;
    margin: 0 auto;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.375rem 0.875rem;
    max-width: 44rem;
    margin: 0 auto;
    padding: 0;
    list-style: none;
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-cream);
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
  }

  &__legend-dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__legend-pct {
    opacity: 0.65;
  }

  &__holdings {
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid var(--table-row-border);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  &__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    list-style: none;
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-cream);

    &::-webkit-details-marker {
      display: none;
    }

    &:hover {
      background: rgba(254, 214, 108, 0.06);
    }

    &:focus-visible {
      outline: 2px solid var(--gold);
      outline-offset: -2px;
    }

    @media (pointer: coarse) {
      min-height: 44px;
    }
  }

  &__chevron {
    color: var(--gold);
    font-size: 0.75rem;
    transition: transform 0.2s ease;
  }

  &__holdings[open] &__chevron {
    transform: rotate(180deg);
  }

  &__table-wrap {
    overflow-x: auto;
    padding: 0 1rem 1rem;
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
}

.text-danger { color: var(--red-to-light-red) !important; }
.text-success { color: var(--success-green) !important; }
</style>
