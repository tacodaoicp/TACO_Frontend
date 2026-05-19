<template>

  <div v-if="hasData" class="nav-chart">

    <!-- section title -->
    <h3 class="nav-chart__title">NAV History</h3>

    <!-- chart -->
    <div class="nav-chart__wrap taco-container taco-container--l1">
      <div ref="chartContainer" class="nav-chart__inner"></div>

      <!-- legend -->
      <div class="nav-chart__legend">
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" :style="{ background: COLORS.usd }"></span> USD (left)
        </span>
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" :style="{ background: COLORS.icp }"></span> ICP (right)
        </span>
        <span
          class="nav-chart__legend-item nav-chart__legend-item--info"
          title="NACHO compared to a passive 50/50 ICP/stables portfolio bought on day one. Starts at 100 — above means NACHO beat the balanced mix, below means it lagged."
        >
          <span class="nav-chart__legend-dot" :style="{ background: COLORS.combined }"></span> vs 50/50 Benchmark
        </span>
      </div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import {
  createChart, LineSeries, ColorType,
  type IChartApi, type ISeriesApi, type LineData, type Time, type UTCTimestamp,
} from 'lightweight-charts'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()
const chartContainer = ref<HTMLDivElement | null>(null)

const COLORS = {
  icp: '#4CAF50',
  usd: '#FFD700',
  mint: '#4CAF50',
  burn: '#F44336',
  manual: '#FF9800',
  combined: '#9C27B0',
}

const hasData = computed(() => nachosStore.navHistory.length > 0)

let chart: IChartApi | null = null
let icpSeries: ISeriesApi<'Line'> | null = null
let usdSeries: ISeriesApi<'Line'> | null = null
let combinedSeries: ISeriesApi<'Line'> | null = null
let resizeObserver: ResizeObserver | null = null

// ns → UNIX seconds (lightweight-charts time format)
const toUnixSec = (nsTimestamp: bigint): UTCTimestamp =>
  Number(nsTimestamp / 1_000_000_000n) as UTCTimestamp

function buildIcpData(history: any[]): LineData[] {
  // Skip first snapshot (genesis / initialization point)
  const start = history.length > 1 ? 1 : 0
  const out: LineData[] = []
  for (let i = start; i < history.length; i++) {
    const s = history[i]
    out.push({
      time: toUnixSec(s.timestamp),
      value: Number(s.navPerTokenE8s) / 1e8,
    })
  }
  return out
}

function buildUsdData(history: any[]): LineData[] {
  const start = history.length > 1 ? 1 : 0
  const out: LineData[] = []
  for (let i = start; i < history.length; i++) {
    const s = history[i]
    out.push({
      time: toUnixSec(s.timestamp),
      value: s.navPerTokenUSD,
    })
  }
  return out
}

// Vault USD return divided by a passive 50/50 ICP/stables buy-and-hold portfolio, rebased to 100.
// ICP price (USD per ICP) at each snapshot = NACHO_USD_price / NACHO_ICP_price.
// Benchmark USD value starts at 1 (= $0.50 in ICP + $0.50 in stables) and tracks: 0.5 * (P_icp / P_icp_0) + 0.5.
// Above 100 means the vault outperformed the balanced 50/50 mix; below 100 means it lagged it.
function buildCombinedData(icpHistory: any[], usdHistory: any[]): LineData[] {
  const n = Math.min(icpHistory.length, usdHistory.length)
  if (n < 2) return []

  const baseIcp = Number(icpHistory[1].navPerTokenE8s) / 1e8
  const baseUsd = Number(usdHistory[1].navPerTokenUSD)
  if (baseIcp === 0 || baseUsd === 0) return []
  const baseIcpPrice = baseUsd / baseIcp
  if (baseIcpPrice === 0) return []

  const out: LineData[] = []
  for (let i = 1; i < n; i++) {
    const icpVal = Number(icpHistory[i].navPerTokenE8s) / 1e8
    const usdVal = Number(usdHistory[i].navPerTokenUSD)
    if (icpVal <= 0 || usdVal <= 0) continue
    const icpPrice = usdVal / icpVal
    const benchmark = 0.5 * (icpPrice / baseIcpPrice) + 0.5
    if (benchmark <= 0) continue
    const vaultReturn = usdVal / baseUsd
    out.push({
      time: toUnixSec(icpHistory[i].timestamp),
      value: (vaultReturn / benchmark) * 100,
    })
  }
  return out
}

function buildMarkers(history: any[]) {
  const start = history.length > 1 ? 1 : 0
  const markers: Array<{
    time: Time
    position: 'inBar' | 'aboveBar' | 'belowBar'
    color: string
    shape: 'circle' | 'square'
    text?: string
  }> = []
  for (let i = start; i < history.length; i++) {
    const s = history[i]
    if ('Scheduled' in s.reason) continue
    let color = COLORS.mint
    if ('Burn' in s.reason) color = COLORS.burn
    else if ('Manual' in s.reason) color = COLORS.manual
    markers.push({
      time: toUnixSec(s.timestamp),
      position: 'inBar',
      color,
      shape: 'circle',
    })
  }
  return markers
}

function applyData() {
  if (!icpSeries || !usdSeries) return
  icpSeries.setData(buildIcpData(nachosStore.navHistory))
  usdSeries.setData(buildUsdData(nachosStore.navHistoryUSD))
  combinedSeries?.setData(buildCombinedData(nachosStore.navHistory, nachosStore.navHistoryUSD))
  // setMarkers is the legacy API but still supported in v5; cast for type compatibility
  if (typeof (icpSeries as any).setMarkers === 'function') {
    (icpSeries as any).setMarkers(buildMarkers(nachosStore.navHistory))
  }
  chart?.timeScale().fitContent()
}

function setupChart() {
  if (!chartContainer.value || chart) return

  const textColor =
    getComputedStyle(document.documentElement).getPropertyValue('--black-to-white').trim() || '#ddd'

  chart = createChart(chartContainer.value, {
    layout: {
      // Transparent canvas — parent .nav-chart__inner background shows through, matches site theme.
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor,
      attributionLogo: false, // remove TradingView logo
    },
    grid: {
      vertLines: { color: 'rgba(128, 128, 128, 0.15)' },
      horzLines: { color: 'rgba(128, 128, 128, 0.15)' },
    },
    crosshair: {
      vertLine: { width: 1, style: 2, labelBackgroundColor: '#222' },
      horzLine: { width: 1, style: 2, labelBackgroundColor: '#222' },
    },
    timeScale: {
      borderColor: 'transparent',
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: { borderColor: 'transparent', visible: true },
    leftPriceScale: { borderColor: 'transparent', visible: true },
    width: chartContainer.value.clientWidth,
    height: chartContainer.value.clientHeight,
  })

  icpSeries = chart.addSeries(LineSeries, {
    priceScaleId: 'right',
    color: COLORS.icp,
    lineWidth: 2,
    title: 'ICP',
    priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    priceLineVisible: false, // hide the horizontal dashed line to last price
  })

  usdSeries = chart.addSeries(LineSeries, {
    priceScaleId: 'left',
    color: COLORS.usd,
    lineWidth: 2,
    title: 'USD',
    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    priceLineVisible: false,
  })

  // Overlay scale (any id other than 'left'/'right') — line is drawn, axis is hidden.
  combinedSeries = chart.addSeries(LineSeries, {
    priceScaleId: 'combined-overlay',
    color: COLORS.combined,
    lineWidth: 2,
    title: 'vs 50/50 Benchmark',
    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    priceLineVisible: false,
  })

  applyData()

  resizeObserver = new ResizeObserver(() => {
    if (chart && chartContainer.value) {
      chart.applyOptions({
        width: chartContainer.value.clientWidth,
        height: chartContainer.value.clientHeight,
      })
    }
  })
  resizeObserver.observe(chartContainer.value)
}

onMounted(() => {
  // Wait one tick — the v-if="hasData" gate may need to flip true before container exists.
  nextTick(() => setupChart())
})

// If data arrives after mount (worker delivery), set up the chart on first arrival.
watch(hasData, (now) => {
  if (now) nextTick(() => setupChart())
})

watch(
  () => [nachosStore.navHistory, nachosStore.navHistoryUSD],
  () => applyData(),
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.remove()
  chart = null
  icpSeries = null
  usdSeries = null
  combinedSeries = null
})
</script>

<style scoped lang="scss">
.nav-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 300px;

  &__title {
    font-size: 1rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gold);
    margin-bottom: 0;
  }

  &__wrap {
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__inner {
    flex: 1;
    min-height: 0;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  &__legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.7;
    flex-wrap: wrap;
    padding-top: 0.5rem;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;

    &--info {
      cursor: help;
      border-bottom: 1px dotted currentColor;
    }
  }

  &__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
}
</style>
