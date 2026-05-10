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
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" :style="{ background: COLORS.mint }"></span> Mint
        </span>
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" :style="{ background: COLORS.burn }"></span> Burn
        </span>
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" :style="{ background: COLORS.manual }"></span> Manual
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
}

const hasData = computed(() => nachosStore.navHistory.length > 0)

let chart: IChartApi | null = null
let icpSeries: ISeriesApi<'Line'> | null = null
let usdSeries: ISeriesApi<'Line'> | null = null
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
  }

  &__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
}
</style>
