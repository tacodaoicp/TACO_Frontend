<template>

  <div v-if="hasData" class="nav-chart">

    <!-- section title + currency toggle -->
    <div class="nav-chart__head">
      <h3 class="nav-chart__title">NAV History</h3>
      <div class="btn-group nav-chart__toggle" role="group" aria-label="Chart currency">
        <button v-for="u in UNITS" :key="u"
                type="button"
                class="btn taco-nav-btn"
                :class="{ 'taco-nav-btn--active': shownUnit === u }"
                :aria-pressed="shownUnit === u"
                :disabled="u === 'usd' && !nachosStore.navHistoryUSD.length"
                @click="unit = u">{{ u.toUpperCase() }}</button>
      </div>
    </div>

    <!-- chart -->
    <div class="nav-chart__wrap taco-container taco-container--l1">
      <div ref="chartContainer" class="nav-chart__inner"></div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import {
  createChart, AreaSeries, ColorType, LineStyle,
  type IChartApi, type ISeriesApi, type UTCTimestamp,
} from 'lightweight-charts'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()
const chartContainer = ref<HTMLDivElement | null>(null)

// Same palette as PerformanceChart; the l1 card stays dark brown in both themes
const COLORS = {
  icp: '#7CDC86',
  usd: '#FEC800',
  axisText: '#FEEAC1',
  gridLine: '#DA8D28',
  crosshair: '#DA8D28',
  crosshairLabelBg: '#934A17',
}

// hex (#RRGGBB) + alpha 0..1 → #RRGGBBAA
function withAlpha(hex: string, a: number) {
  const n = Math.max(0, Math.min(255, Math.round(a * 255)))
  return hex + n.toString(16).padStart(2, '0')
}

const UNITS = ['usd', 'icp'] as const
const unit = useSessionStorage<(typeof UNITS)[number]>('navChartUnit', 'usd')
// USD history can arrive after ICP; show ICP until it does
const shownUnit = computed(() => (unit.value === 'usd' && !nachosStore.navHistoryUSD.length ? 'icp' : unit.value))

const hasData = computed(() => nachosStore.navHistory.length > 0)

// Snapshots for the selected unit, skipping the first (genesis / initialization point)
const snapshots = computed(() => {
  const history: any[] = shownUnit.value === 'usd' ? nachosStore.navHistoryUSD : nachosStore.navHistory
  return history.slice(history.length > 1 ? 1 : 0)
})

let chart: IChartApi | null = null
let series: ISeriesApi<'Area'> | null = null
let resizeObserver: ResizeObserver | null = null

// ns → UNIX seconds (lightweight-charts time format)
const toUnixSec = (nsTimestamp: bigint): UTCTimestamp =>
  Number(nsTimestamp / 1_000_000_000n) as UTCTimestamp

function applyData() {
  if (!series) return
  const usd = shownUnit.value === 'usd'
  const color = usd ? COLORS.usd : COLORS.icp
  series.applyOptions({
    lineColor: color,
    topColor: withAlpha(color, 0.30),
    bottomColor: withAlpha(color, 0.05),
    priceFormat: usd
      ? { type: 'price', precision: 2, minMove: 0.01 }
      : { type: 'price', precision: 4, minMove: 0.0001 },
  })
  series.setData(snapshots.value.map(s => ({
    time: toUnixSec(s.timestamp),
    value: usd ? s.navPerTokenUSD : Number(s.navPerTokenE8s) / 1e8,
  })))
  chart?.timeScale().fitContent()
}

function setupChart() {
  if (!chartContainer.value || chart) return

  chart = createChart(chartContainer.value, {
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: COLORS.axisText,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: withAlpha(COLORS.gridLine, 0.25), style: LineStyle.Dashed },
      horzLines: { color: withAlpha(COLORS.gridLine, 0.25), style: LineStyle.Dashed },
    },
    crosshair: {
      vertLine: { color: withAlpha(COLORS.crosshair, 0.6), width: 1, style: LineStyle.Solid, labelBackgroundColor: COLORS.crosshairLabelBg },
      horzLine: { color: withAlpha(COLORS.crosshair, 0.6), width: 1, style: LineStyle.Solid, labelBackgroundColor: COLORS.crosshairLabelBg },
    },
    timeScale: {
      borderColor: 'transparent',
      timeVisible: true,
      secondsVisible: false,
      // Only with fixed edges does lightweight-charts pull the first and last
      // time labels inside the chart instead of clipping them ("Aug" → "ug")
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    rightPriceScale: { borderColor: 'transparent', autoScale: true },
    // Vertical swipes scroll the page on phones instead of panning the price axis
    handleScroll: { vertTouchDrag: false },
    width: chartContainer.value.clientWidth,
    height: chartContainer.value.clientHeight,
  })

  series = chart.addSeries(AreaSeries, { lineWidth: 2, priceLineVisible: false })

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

watch(snapshots, () => applyData())

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.remove()
  chart = null
  series = null
})
</script>

<style scoped lang="scss">
.nav-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 300px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  &__title {
    font-size: 1rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gold);
    margin-bottom: 0;
  }

  &__toggle .btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;

    @media (pointer: coarse) {
      min-height: 44px;
    }
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
}
</style>
