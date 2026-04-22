<template>
  <div class="trading-chart">
    <!-- Toolbar -->
    <div class="trading-chart__toolbar">
      <div class="trading-chart__timeframes">
        <button
          v-for="tf in timeframes"
          :key="tf.key"
          class="trading-chart__tf-btn"
          :class="{ 'trading-chart__tf-btn--active': activeTimeframe === tf.key }"
          @click="setTimeframe(tf.key)"
        >
          {{ tf.label }}
        </button>
      </div>
      <div class="trading-chart__chart-types">
        <button
          v-for="ct in chartTypes"
          :key="ct.key"
          class="trading-chart__type-btn"
          :class="{ 'trading-chart__type-btn--active': activeChartType === ct.key }"
          @click="activeChartType = ct.key"
          :title="ct.label"
        >
          {{ ct.label }}
        </button>
      </div>
      <button class="trading-chart__fullscreen-btn" @click="toggleFullscreen" aria-label="Toggle fullscreen">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <!-- Chart container -->
    <div ref="chartContainer" class="trading-chart__container">
      <div v-if="isLoading" class="trading-chart__loading">
        <div class="ex-skeleton" style="width:100%;height:100%"></div>
      </div>
      <div v-if="noData && !isLoading" class="trading-chart__no-data">
        No chart data for this timeframe yet.
      </div>
      <div v-if="isStale && !isLoading" class="trading-chart__stale-overlay">
        <span class="trading-chart__stale-label">Loading…</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, type IChartApi, type ISeriesApi, ColorType, type CandlestickData, type HistogramData, type LineData, type Time } from 'lightweight-charts'
import { useExchangeStore } from '../../store/exchange.store'
import { usePolling } from '../../composables/usePolling'
import type { TimeFrame } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{
  token0: string
  token1: string
  decimals0?: number
  decimals1?: number
  enabled?: boolean
}>()

const store = useExchangeStore()

// Detect if display pair order is inverted from canonical pool order.
// getKlineData always returns prices in pool-native order.
const priceCorrection = computed((): { factor: number; invert: boolean } => {
  const info = store.exchangeInfoData
  if (!info?.pool_canister?.length) return { factor: 1, invert: false }
  for (const [t0, t1] of info.pool_canister) {
    if (t0 === props.token0 && t1 === props.token1) return { factor: 1, invert: false }
    if (t0 === props.token1 && t1 === props.token0) return { factor: 1, invert: true }
  }
  return { factor: 1, invert: false }
})

function adjustCandle(d: { open: number; high: number; low: number; close: number }) {
  const { factor, invert } = priceCorrection.value
  let o = d.open * factor, h = d.high * factor
  let l = d.low * factor, c = d.close * factor
  if (invert) {
    // Invert: 1/price, swap high↔low since 1/low > 1/high
    const io = o > 0 ? 1 / o : 0
    const ih = l > 0 ? 1 / l : 0  // 1/low becomes new high
    const il = h > 0 ? 1 / h : 0  // 1/high becomes new low
    const ic = c > 0 ? 1 / c : 0
    return { open: io, high: ih, low: il, close: ic }
  }
  return { open: o, high: h, low: l, close: c }
}

const chartContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const noData = ref(false)
const isStale = ref(false)

let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let lineSeries: ISeriesApi<'Line'> | null = null
let volumeSeries: ISeriesApi<'Histogram'> | null = null

// Cached data for switching between candle/line without refetch
let cachedCandles: CandlestickData[] = []
let cachedVolumes: HistogramData[] = []

// Pair/timeframe switch guard — drop in-flight responses for superseded selections.
let switchId = 0

// Lazy-load state for historical candles (scroll-left pagination)
// Backend clamps `limit` at 2000; asking for more is harmless and just returns the cap.
const INITIAL_CANDLE_LIMIT = 2500n
const OLDER_CANDLE_LIMIT = 2000n
// After the initial paint, quietly page older history in idle time.
const BACKGROUND_PREFETCH_PAGES = 3
const BACKGROUND_PREFETCH_FALLBACK_DELAY_MS = 400
let oldestLoadedTs: bigint | null = null
let isLoadingHistory = false
let historyExhausted = false

// Theme colors (resolved once from CSS vars on chart init)
let colorBuy = '#2EA66A'
let colorSell = '#D94040'
let colorAccent = '#C45A0A'

// Timeframes
const timeframes = [
  { key: 'fivemin', label: '5m' },
  { key: 'hour', label: '1h' },
  { key: 'fourHours', label: '4h' },
  { key: 'day', label: '1D' },
  { key: 'week', label: '1W' },
]

const activeTimeframe = ref('fivemin')

const chartTypes = [
  { key: 'candles', label: 'Candles' },
  { key: 'line', label: 'Line' },
]

const activeChartType = ref('candles')

function getTimeframeVariant(): TimeFrame {
  const map: Record<string, TimeFrame> = {
    fivemin: { fivemin: null },
    hour: { hour: null },
    fourHours: { fourHours: null },
    day: { day: null },
    week: { week: null },
  }
  return map[activeTimeframe.value] ?? { hour: null }
}

function setTimeframe(key: string) {
  activeTimeframe.value = key
  // Timeframe changes legitimately invalidate candle shape — clear and reload
  switchId++
  candleSeries?.setData([])
  lineSeries?.setData([])
  volumeSeries?.setData([])
  cachedCandles = []
  cachedVolumes = []
  oldestLoadedTs = null
  isLoadingHistory = false
  historyExhausted = false
  loadInitialData()
}

// Chart setup
function initChart() {
  if (!chartContainer.value || chart) return

  const cs = getComputedStyle(document.documentElement)
  const bgPrimary = cs.getPropertyValue('--bg-primary').trim() || '#1A0A02'
  const textSecondary = cs.getPropertyValue('--text-secondary').trim() || '#B89A78'
  const bgSecondary = cs.getPropertyValue('--bg-secondary').trim() || '#2A1608'
  const bgTertiary = cs.getPropertyValue('--bg-tertiary').trim() || '#3A1F0C'
  colorBuy = cs.getPropertyValue('--color-buy').trim() || '#2EA66A'
  colorSell = cs.getPropertyValue('--color-sell').trim() || '#D94040'
  colorAccent = cs.getPropertyValue('--accent-primary').trim() || '#C45A0A'

  chart = createChart(chartContainer.value, {
    layout: {
      background: { type: ColorType.Solid, color: bgPrimary },
      textColor: textSecondary,
    },
    grid: {
      vertLines: { color: bgSecondary + '30' },
      horzLines: { color: bgSecondary + '30' },
    },
    crosshair: {
      vertLine: { color: textSecondary + '50', width: 1, style: 2, labelBackgroundColor: bgTertiary },
      horzLine: { color: textSecondary + '50', width: 1, style: 2, labelBackgroundColor: bgTertiary },
    },
    timeScale: {
      borderColor: 'transparent',
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderColor: 'transparent',
      autoScale: true,
    },
  })

  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: colorBuy,
    downColor: colorSell,
    borderUpColor: colorBuy,
    borderDownColor: colorSell,
    wickUpColor: colorBuy,
    wickDownColor: colorSell,
  })

  lineSeries = chart.addSeries(LineSeries, {
    color: colorAccent,
    lineWidth: 2,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    visible: false, // hidden until user switches to line mode
  })

  volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
  })

  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  })

  // Resize observer
  const ro = new ResizeObserver(() => {
    if (chart && chartContainer.value) {
      chart.applyOptions({
        width: chartContainer.value.clientWidth,
        height: chartContainer.value.clientHeight,
      })
    }
  })
  ro.observe(chartContainer.value)

  // Scroll-left lazy pagination — when user scrolls near leftmost loaded candle, fetch older
  chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
    if (!range) return
    if (range.from < 20) loadOlderHistory()
  })
}

async function loadOlderHistory() {
  if (isLoadingHistory || historyExhausted) return
  if (!props.token0 || !props.token1) return
  if (oldestLoadedTs === null || cachedCandles.length === 0) return

  const mySwitchId = switchId
  isLoadingHistory = true
  try {
    const data = await store.getKlineDataRange(
      props.token0,
      props.token1,
      getTimeframeVariant(),
      [oldestLoadedTs],
      OLDER_CANDLE_LIMIT,
    )

    if (mySwitchId !== switchId) return

    if (!data || data.length === 0) {
      historyExhausted = true
      return
    }

    const validData = data.filter(d => {
      if (!d.timestamp) return false
      const { open, high, low, close } = d
      if (open == null || high == null || low == null || close == null) return false
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return false
      if (open === 0 && high === 0 && low === 0 && close === 0) return false
      return true
    })

    if (validData.length === 0) {
      // Everything in that window was filtered — mark exhausted so we stop trying
      historyExhausted = true
      return
    }

    const olderCandles: CandlestickData[] = validData.map(d => {
      const adj = adjustCandle(d)
      return {
        time: Math.floor(Number(d.timestamp) / 1_000_000_000) as Time,
        open: adj.open, high: adj.high, low: adj.low, close: adj.close,
      }
    })
    const olderVolumes: HistogramData[] = validData.map(d => {
      const adj = adjustCandle(d)
      return {
        time: Math.floor(Number(d.timestamp) / 1_000_000_000) as Time,
        value: Number(d.volume),
        color: adj.close >= adj.open ? colorBuy + '40' : colorSell + '40',
      }
    })

    cachedCandles = [...olderCandles, ...cachedCandles]
    cachedVolumes = [...olderVolumes, ...cachedVolumes]
    oldestLoadedTs = validData[0].timestamp as bigint

    if (activeChartType.value === 'candles') {
      candleSeries?.setData(cachedCandles)
    } else {
      const lines: LineData[] = cachedCandles.map(c => ({ time: c.time, value: c.close }))
      lineSeries?.setData(lines)
    }
    volumeSeries?.setData(cachedVolumes)
  } catch (err) {
    if (mySwitchId !== switchId) return
    console.error('[TradingChart] History load error:', err)
  } finally {
    if (mySwitchId === switchId) isLoadingHistory = false
  }
}

async function loadInitialData() {
  if (!props.token0 || !props.token1) return

  const mySwitchId = switchId
  const hasExistingData = cachedCandles.length > 0
  // Only show skeleton on true first load; otherwise use the stale overlay
  if (!hasExistingData) isLoading.value = true

  try {
    const data = await store.getKlineDataRange(
      props.token0,
      props.token1,
      getTimeframeVariant(),
      [],
      INITIAL_CANDLE_LIMIT,
    )

    if (mySwitchId !== switchId) return

    if (!data || data.length === 0) {
      isLoading.value = false
      isStale.value = false
      noData.value = true
      cachedCandles = []
      cachedVolumes = []
      candleSeries?.setData([])
      lineSeries?.setData([])
      volumeSeries?.setData([])
      oldestLoadedTs = null
      historyExhausted = true
      return
    }

    // Backend returns ascending, non-placeholder candles. Keep a cheap NaN/zero-all
    // guard as defensive safety; no sort or dedup needed.
    const validData = data.filter(d => {
      if (!d.timestamp) return false
      const { open, high, low, close } = d
      if (open == null || high == null || low == null || close == null) return false
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return false
      if (open === 0 && high === 0 && low === 0 && close === 0) return false
      return true
    }).map(d => {
      const ref = d.close > 0 ? d.close : d.open > 0 ? d.open : 0
      if (ref === 0) return { ...d }
      return {
        ...d,
        open: d.open > 0 ? d.open : ref,
        low: d.low > 0 && d.low <= ref * 5 ? d.low : Math.min(d.open > 0 ? d.open : ref, ref),
        high: d.high > 0 && d.high <= ref * 5 ? d.high : Math.max(d.open > 0 ? d.open : ref, ref),
      }
    })

    if (validData.length === 0) {
      noData.value = true
      isLoading.value = false
      isStale.value = false
      return
    }
    noData.value = false

    const candles: CandlestickData[] = validData.map(d => {
      const adj = adjustCandle(d)
      return {
        time: Math.floor(Number(d.timestamp) / 1_000_000_000) as Time,
        open: adj.open, high: adj.high, low: adj.low, close: adj.close,
      }
    })

    const volumes: HistogramData[] = validData.map(d => {
      const adj = adjustCandle(d)
      return {
        time: Math.floor(Number(d.timestamp) / 1_000_000_000) as Time,
        value: Number(d.volume),
        color: adj.close >= adj.open ? colorBuy + '40' : colorSell + '40',
      }
    })

    // Set Y-axis precision based on price magnitude
    if (candles.length > 0) {
      const lastPrice = candles[candles.length - 1].close
      const precision = lastPrice >= 1000 ? 2
        : lastPrice >= 1 ? 4
        : lastPrice >= 0.01 ? 6
        : 8
      candleSeries?.applyOptions({
        priceFormat: { type: 'price', precision, minMove: 1 / (10 ** precision) },
      })
    }

    cachedCandles = candles
    cachedVolumes = volumes
    oldestLoadedTs = validData[0].timestamp as bigint
    // Backend clamps the server-side cap (~2000). Only mark exhausted on clearly-short
    // responses, so 2500-request → 2000-return doesn't falsely flag as end-of-history.
    historyExhausted = validData.length < 200

    const lines: LineData[] = candles.map(c => ({ time: c.time, value: c.close }))

    if (activeChartType.value === 'candles') {
      candleSeries?.setData(candles)
      candleSeries?.applyOptions({ visible: true })
      lineSeries?.setData([])
      lineSeries?.applyOptions({ visible: false })
    } else {
      lineSeries?.setData(lines)
      lineSeries?.applyOptions({ visible: true })
      candleSeries?.setData([])
      candleSeries?.applyOptions({ visible: false })
    }
    volumeSeries?.setData(volumes)

    // Reset viewport for the new pair: show last 100 candles on X, re-fit Y to that range.
    // Explicit autoScale reapply forces the right price scale to recompute against the
    // new pair's price magnitude (prevents inheriting the prior pair's Y range).
    if (candles.length > 0) {
      const from = candles.length > 100 ? candles[candles.length - 100].time : candles[0].time
      const to = candles[candles.length - 1].time
      chart?.timeScale().setVisibleRange({ from, to })
      chart?.priceScale('right').applyOptions({ autoScale: true })
      chart?.priceScale('volume').applyOptions({ autoScale: true })
    }

    isLoading.value = false
    isStale.value = false

    // If the orderbook already decided on effectivePrice (midPrice or lastTrade)
    // before the kline landed, the watcher's first firing had no candles to update.
    // Apply it now so the last candle reflects the current spread rule.
    reconcileLastCandleWithEffectivePrice()

    // Initial paint is done — quietly page more history in the background.
    scheduleBackgroundPrefetch()
  } catch (err) {
    if (mySwitchId !== switchId) return
    console.error('[TradingChart] Load error:', err)
    isLoading.value = false
  }
}

function scheduleBackgroundPrefetch() {
  const mySwitchId = switchId
  let pagesDone = 0

  const runOnePage = async () => {
    if (mySwitchId !== switchId) return
    if (historyExhausted) return
    if (pagesDone >= BACKGROUND_PREFETCH_PAGES) return
    pagesDone++
    await loadOlderHistory()
    if (mySwitchId !== switchId) return
    scheduleNext()
  }

  const scheduleNext = () => {
    const ric = (globalThis as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void
    }).requestIdleCallback
    if (typeof ric === 'function') {
      ric(runOnePage, { timeout: 2000 })
    } else {
      setTimeout(runOnePage, BACKGROUND_PREFETCH_FALLBACK_DELAY_MS)
    }
  }

  scheduleNext()
}

async function pollUpdate() {
  if (!props.token0 || !props.token1) return

  const mySwitchId = switchId
  try {
    const data = await store.getKlineData(
      props.token0,
      props.token1,
      getTimeframeVariant(),
      false, // poll — only latest candles
    )

    if (mySwitchId !== switchId) return

    console.log('[TradingChart] Poll:', data?.length, 'candles')
    if (!data || data.length === 0) return

    // Sort candles ascending by timestamp (initialGet=false may return newest-first or just 2 candles)
    const recent = data.length > 3
      ? data.slice(0, 3).reverse()
      : [...data].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

    const validData = recent.filter(d =>
      d.timestamp && d.open != null && d.close != null &&
      (d.open !== 0 || d.high !== 0 || d.low !== 0 || d.close !== 0)
    )

    for (const d of validData) {
      const adj = adjustCandle(d)
      const time = Math.floor(Number(d.timestamp) / 1_000_000_000) as Time
      const candle: CandlestickData = {
        time, open: adj.open, high: adj.high, low: adj.low, close: adj.close,
      }
      const volume: HistogramData = {
        time, value: Number(d.volume),
        color: adj.close >= adj.open ? colorBuy + '40' : colorSell + '40',
      }

      if (activeChartType.value === 'candles') {
        candleSeries?.update(candle)
      } else {
        lineSeries?.update({ time, value: adj.close })
      }
      volumeSeries?.update(volume)

      // Keep cache in sync
      const idx = cachedCandles.findIndex(c => c.time === time)
      if (idx >= 0) { cachedCandles[idx] = candle; cachedVolumes[idx] = volume }
      else { cachedCandles.push(candle); cachedVolumes.push(volume) }
    }

    // Keep viewport following new candles (setVisibleRange from init disables auto-scroll)
    if (validData.length > 0) {
      chart?.timeScale().scrollToRealTime()
    }

    // Kline's close for the current candle is the last-trade price. If the orderbook
    // has decided to surface midPrice (lastTrade outside spread), reapply it here so
    // pollUpdate doesn't silently overwrite the effectivePrice watcher's value.
    reconcileLastCandleWithEffectivePrice()
  } catch (err) {
    console.error('[TradingChart] Poll error:', err)
  }
}

function reconcileLastCandleWithEffectivePrice() {
  const ep = store.effectivePrice
  if (!ep || ep <= 0 || cachedCandles.length === 0 || !candleSeries) return
  const last = { ...cachedCandles[cachedCandles.length - 1] }
  if (ep === last.close) return
  last.close = ep
  last.high = Math.max(last.high, ep)
  last.low = Math.min(last.low, ep)
  cachedCandles[cachedCandles.length - 1] = last
  if (activeChartType.value === 'candles') {
    candleSeries.update(last)
  } else {
    lineSeries?.update({ time: last.time, value: ep })
  }
}

// Poll every 5 seconds for faster chart updates after trades
const enabledRef = ref(props.enabled !== false)
usePolling(pollUpdate, { interval: 5000, immediate: false, enabled: enabledRef })

// Reactively update last candle when effective price changes (no network dependency)
watch(() => store.effectivePrice, (ep) => {
  console.log('[TradingChart] effectivePrice →', ep, 'cached:', cachedCandles.length, 'series:', !!candleSeries)
  if (!ep || ep <= 0 || cachedCandles.length === 0 || !candleSeries) return
  // effectivePrice is already in display space (set by orderbook which uses same token0/token1)
  const last = { ...cachedCandles[cachedCandles.length - 1] }
  if (ep === last.close) return
  last.close = ep
  last.high = Math.max(last.high, ep)
  last.low = Math.min(last.low, ep)
  cachedCandles[cachedCandles.length - 1] = last
  if (activeChartType.value === 'candles') {
    candleSeries.update(last)
  } else {
    lineSeries?.update({ time: last.time, value: ep })
  }
})

// Switch between candle and line chart modes
watch(activeChartType, (mode) => {
  if (cachedCandles.length === 0) return

  if (mode === 'line') {
    // Hide candles, show line
    candleSeries?.applyOptions({ visible: false })
    candleSeries?.setData([])
    const lines: LineData[] = cachedCandles.map(c => ({ time: c.time, value: c.close }))
    lineSeries?.setData(lines)
    lineSeries?.applyOptions({ visible: true })
  } else {
    // Hide line, show candles
    lineSeries?.applyOptions({ visible: false })
    lineSeries?.setData([])
    candleSeries?.setData(cachedCandles)
    candleSeries?.applyOptions({ visible: true })
  }
})

// Fullscreen toggle
let isFullscreen = false
function toggleFullscreen() {
  if (!chartContainer.value) return
  if (!isFullscreen) {
    chartContainer.value.parentElement?.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
  isFullscreen = !isFullscreen
}

onMounted(async () => {
  await nextTick()
  initChart()
  await loadInitialData()
})

onUnmounted(() => {
  chart?.remove()
  chart = null
  candleSeries = null
  lineSeries = null
  volumeSeries = null
  cachedCandles = []
  cachedVolumes = []
})

// Reload on pair change — keep old data visible until new data arrives (no-flicker)
watch([() => props.token0, () => props.token1], () => {
  switchId++
  isStale.value = true
  oldestLoadedTs = null
  isLoadingHistory = false
  historyExhausted = false
  loadInitialData()
})
</script>

<style scoped lang="scss">
.trading-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);

  &__toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-1) var(--space-2);
    border-bottom: 1px solid var(--border-primary);
    background: var(--bg-secondary);
    flex-shrink: 0;
  }

  &__timeframes {
    display: flex;
    gap: 2px;
  }

  &__tf-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;

    &:hover { color: var(--text-primary); }
    &--active {
      color: var(--accent-primary);
      background: var(--accent-primary-muted);
    }
  }

  &__chart-types {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }

  &__type-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;

    &:hover { color: var(--text-primary); }
    &--active { color: var(--accent-primary); }
  }

  &__fullscreen-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    &:hover { color: var(--text-primary); }
  }

  &__container {
    flex: 1;
    position: relative;
    min-height: 300px;
  }

  &__loading, &__no-data {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__no-data {
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    z-index: 1;
  }

  &__stale-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: var(--space-2);
    background: rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 2;
  }

  &__stale-label {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: 2px 8px;
    border-radius: 4px;
    opacity: 0.85;
  }
}
</style>
