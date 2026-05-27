<template>
  <div class="performance-chart">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm" role="status" style="color: var(--brown);">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2 chart-muted">Loading chart data...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-4">
      <i class="fas fa-exclamation-triangle me-2" style="color: var(--dark-orange);"></i>
      <span class="chart-muted">{{ error }}</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasData" class="text-center py-4">
      <i class="fas fa-chart-area chart-muted me-2"></i>
      <span class="chart-muted">No performance history available</span>
    </div>

    <!-- Chart with baseline selector -->
    <div v-else style="position: relative;">
      <div class="d-flex align-items-center gap-2 mb-2">
        <label class="baseline-label chart-muted">Start from:</label>
        <select
          v-model="baselineIndex"
          class="form-select form-select-sm baseline-select"
        >
          <option
            v-for="(opt, idx) in baselineOptions"
            :key="idx"
            :value="opt.index"
          >{{ opt.label }}</option>
        </select>
        <div v-if="computing" class="spinner-border spinner-border-sm ms-auto" role="status" style="color: var(--brown); width: 1rem; height: 1rem;">
          <span class="visually-hidden">Computing...</span>
        </div>
      </div>

      <!-- Chart container + Vue tooltip overlay -->
      <div class="performance-chart__shell" :style="{ height: heightCss }">
        <div ref="chartContainer" class="performance-chart__container"></div>

        <div v-if="tooltipVisible && tooltipPayload"
             class="performance-chart__tooltip"
             :class="{ 'performance-chart__tooltip--flipped': tooltipPos.flip }"
             :style="tooltipStyle">
          <div class="performance-chart__tooltip-header">{{ formatTooltipDate(tooltipPayload.timeMs) }}</div>
          <div v-if="tooltipPayload.usdReturn !== null"
               class="performance-chart__tooltip-row"
               :style="{ color: COLORS.usd }">
            <span>Return (USD)</span>
            <span>{{ formatPct(tooltipPayload.usdReturn) }}</span>
          </div>
          <div v-if="tooltipPayload.icpReturn !== null"
               class="performance-chart__tooltip-row"
               :style="{ color: COLORS.icp }">
            <span>Return (ICP)</span>
            <span>{{ formatPct(tooltipPayload.icpReturn) }}</span>
          </div>

          <div v-if="tooltipPayload.allocations.length" class="performance-chart__tooltip-section">
            <div class="performance-chart__tooltip-section-head">
              <span>Allocation</span>
              <span v-if="tooltipPayload.hasIcpChange" class="performance-chart__tooltip-section-meta">USD / ICP</span>
            </div>
            <div class="performance-chart__tooltip-allocs"
                 :style="{ gridTemplateColumns: tooltipPayload.allocColumns }">
              <template v-for="(a, i) in tooltipPayload.allocations" :key="i">
                <span class="performance-chart__tooltip-symbol">{{ a.symbol }}</span>
                <span class="performance-chart__tooltip-percent">{{ a.percent }}%</span>
                <span v-if="tooltipPayload.hasAnyPriceChange"
                      class="performance-chart__tooltip-change"
                      :style="{ color: a.usdChangeColor }">{{ a.usdChangeText }}</span>
                <span v-if="tooltipPayload.hasIcpChange"
                      class="performance-chart__tooltip-change performance-chart__tooltip-change--icp"
                      :style="{ color: a.icpChangeColor }">{{ a.icpChangeText }}</span>
              </template>
            </div>
          </div>

          <div v-if="tooltipPayload.note" class="performance-chart__tooltip-section">
            <div class="performance-chart__tooltip-section-head">
              <span>Note</span>
            </div>
            <div class="performance-chart__tooltip-note">{{ tooltipPayload.note }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  createChart, AreaSeries, ColorType, LineStyle,
} from 'lightweight-charts'
import { useTacoStore } from '../../stores/taco.store'
import { storeToRefs } from 'pinia'
import { createChartPort } from '../../workers/chart-worker-port'
import { fetchPerformanceGraph } from '../../workers/performance-graph-client'
import { getNetworkHost } from '../../shared/auth-cache'
import { getEffectiveNetwork } from '../../config/network-config'
import { getCanisterId } from '../../constants/canisterIds'

// Module-level cache for getUserPerformanceGraphData results by principal (TTL'd).
const performanceDataCache = new Map()
const CACHE_TTL_MS = 60_000 // 60 seconds

const COLORS = {
  usd: '#FEC800',
  icp: '#7CDC86',
  axisText: '#FEEAC1',
  gridLine: '#DA8D28',
  crosshair: '#DA8D28',
  crosshairLabelBg: '#934A17',
  breakEven: '#934A17',
  pricePos: '#4CAF50',
  priceNeg: '#FF5252',
}

// hex (#RRGGBB) + alpha 0..1 → #RRGGBBAA
function withAlpha(hex, a) {
  const n = Math.max(0, Math.min(255, Math.round(a * 255)))
  return hex + n.toString(16).padStart(2, '0')
}

export default {
  name: 'PerformanceChart',
  props: {
    principal: { type: String, required: true },
    height: { type: [Number, String], default: 250 },
  },

  setup(props) {
    const tacoStore = useTacoStore()
    const { fetchedTokenDetails } = storeToRefs(tacoStore)

    const loading = ref(false)
    const computing = ref(false)
    const error = ref('')
    const usdCheckpoints = shallowRef([])
    const icpCheckpoints = shallowRef([])
    const baselineIndex = ref(0)
    const serializedCheckpoints = shallowRef([])
    const tooltipDataMap = shallowRef({})

    // Monotonic load id — lets an in-flight chunked transform detect that a
    // newer loadPerformanceData() has superseded it and bail out.
    let loadSeq = 0

    // Chart + series refs (kept outside reactivity — these are imperative handles)
    const chartContainer = ref(null)
    let chart = null
    let usdSeries = null
    let icpSeries = null
    let resizeObserver = null
    // time -> checkpointIndex maps so we can recover the index from crosshair-move events
    let usdCheckpointByTime = new Map()
    let icpCheckpointByTime = new Map()
    // raw data refs so we can rebuild on demand
    const usdSeriesData = shallowRef([])
    const icpSeriesData = shallowRef([])

    // Vue tooltip overlay state
    const tooltipVisible = ref(false)
    const tooltipPos = ref({ x: 0, y: 0, flip: false })
    const tooltipPayload = ref(null)

    // Pixel offset from the cursor when the tooltip floats next to it
    const TOOLTIP_GAP = 14

    const tooltipStyle = computed(() => {
      const p = tooltipPos.value
      // When `flip` is true, the cursor is on the right half; we render the
      // tooltip to the LEFT of the cursor by translating itself by -100% width.
      const tx = p.flip ? `calc(-100% - ${TOOLTIP_GAP}px)` : `${TOOLTIP_GAP}px`
      return {
        left: `${p.x}px`,
        top: `${p.y}px`,
        transform: `translate(${tx}, -50%)`,
      }
    })

    // Chart compute worker — singleton, preloaded at app startup
    const { port: chartPort, dispose: disposeChartPort } = createChartPort()
    chartPort.onmessage = (e) => {
      computing.value = false
      const { usdSeries: usd, icpSeries: icp, tooltipData } = e.data
      usdSeriesData.value = usd
      icpSeriesData.value = icp
      tooltipDataMap.value = tooltipData
      applyData()
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')

    // Build a map of token principal -> symbol for quick lookup
    const tokenSymbolMap = computed(() => {
      const map = new Map()
      if (fetchedTokenDetails.value) {
        for (const [principal, details] of fetchedTokenDetails.value) {
          try {
            const principalStr = principal.toText ? principal.toText() : principal.toString()
            map.set(principalStr, details.tokenSymbol || 'Unknown')
          } catch (e) { /* skip */ }
        }
      }
      return map
    })

    const hasData = computed(() => usdCheckpoints.value.length > 0 || icpCheckpoints.value.length > 0)

    const baselineOptions = computed(() => {
      const cps = usdCheckpoints.value.length > 0 ? usdCheckpoints.value : icpCheckpoints.value
      // Cap + sample. Rendering one <option> per checkpoint — each calling
      // toLocaleDateString() (which rebuilds an Intl formatter every time) —
      // blocked the main thread on load for large histories. ~300 evenly-spaced
      // baselines is plenty for a "start from" picker; one reused formatter and
      // a bounded option count keep it cheap regardless of checkpoint count.
      const MAX_OPTIONS = 300
      const step = cps.length > MAX_OPTIONS ? Math.ceil(cps.length / MAX_OPTIONS) : 1
      const fmt = new Intl.DateTimeFormat()
      const out = []
      for (let idx = 0; idx < cps.length; idx += step) {
        const date = new Date(Number(cps[idx].timestamp) / 1_000_000)
        out.push({ index: idx, label: idx === 0 ? `${fmt.format(date)} (First)` : fmt.format(date) })
      }
      return out
    })

    const heightCss = computed(() => typeof props.height === 'number' ? `${props.height}px` : props.height)

    // ----- Worker dispatch -----

    const dispatchToWorker = () => {
      if (!serializedCheckpoints.value.length) return
      computing.value = true
      chartPort.postMessage({
        checkpoints: serializedCheckpoints.value,
        baselineIndex: baselineIndex.value,
        tokenSymbolMap: Object.fromEntries(tokenSymbolMap.value),
        isLocal
      })
    }

    watch([serializedCheckpoints, baselineIndex], dispatchToWorker)
    watch(tokenSymbolMap, () => {
      if (serializedCheckpoints.value.length) dispatchToWorker()
    })

    // ----- Chart lifecycle -----

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
        },
        rightPriceScale: { borderColor: 'transparent', autoScale: true },
        width: chartContainer.value.clientWidth,
        height: chartContainer.value.clientHeight,
      })

      const pctFormat = {
        type: 'custom',
        formatter: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
        minMove: 0.01,
      }

      usdSeries = chart.addSeries(AreaSeries, {
        lineColor: COLORS.usd,
        topColor: withAlpha(COLORS.usd, 0.30),
        bottomColor: withAlpha(COLORS.usd, 0.05),
        lineWidth: 2,
        priceLineVisible: false,
        priceFormat: pctFormat,
        title: 'USD',
      })

      icpSeries = chart.addSeries(AreaSeries, {
        lineColor: COLORS.icp,
        topColor: withAlpha(COLORS.icp, 0.30),
        bottomColor: withAlpha(COLORS.icp, 0.05),
        lineWidth: 2,
        priceLineVisible: false,
        priceFormat: pctFormat,
        title: 'ICP',
      })

      // Break-even reference line at y = 0 with axis label
      usdSeries.createPriceLine({
        price: 0,
        color: COLORS.breakEven,
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title: 'Break-even',
      })

      chart.subscribeCrosshairMove(handleCrosshairMove)

      resizeObserver = new ResizeObserver(() => {
        if (chart && chartContainer.value) {
          chart.applyOptions({
            width: chartContainer.value.clientWidth,
            height: chartContainer.value.clientHeight,
          })
        }
      })
      resizeObserver.observe(chartContainer.value)

      applyData()
    }

    function applyData() {
      if (!usdSeries || !icpSeries) return
      const usd = usdSeriesData.value
      const icp = icpSeriesData.value

      // Build time->checkpointIndex maps and dedupe time keys (lightweight-charts
      // requires unique, ascending time values).
      usdCheckpointByTime = new Map()
      icpCheckpointByTime = new Map()

      const toLineData = (points, indexMap) => {
        const out = []
        let prevSec = -Infinity
        for (const p of points) {
          let sec = Math.floor(p.x / 1000)
          if (sec <= prevSec) sec = prevSec + 1 // dedupe collisions deterministically
          out.push({ time: sec, value: p.y })
          indexMap.set(sec, p.checkpointIndex)
          prevSec = sec
        }
        return out
      }

      usdSeries.setData(toLineData(usd, usdCheckpointByTime))
      icpSeries.setData(toLineData(icp, icpCheckpointByTime))

      chart?.timeScale().fitContent()

      // Re-attach the simulateHover hook to the latest container so the tour
      // can drive the chart programmatically. Idempotent — see attachHoverHook.
      attachHoverHook()
    }

    // ----- Programmatic hover (driven by GrandTour) -----
    //
    // The tour exposes a `hoverChartPoints` interaction that previously poked
    // ApexCharts' SVG directly. lightweight-charts is a canvas, so we drive
    // the same Vue tooltip overlay by computing screen coordinates from the
    // chart APIs and updating the tooltip refs directly.

    let hoverAborted = false

    async function simulateHover(count, dwellMs) {
      if (!chart || !usdSeries || !chartContainer.value) return
      const usd = usdSeriesData.value
      const icp = icpSeriesData.value
      if (usd.length === 0) return

      hoverAborted = false
      const containerWidth = chartContainer.value.clientWidth
      const startIdx = Math.max(0, Math.floor(usd.length * 0.5))
      const step = Math.max(1, Math.floor((usd.length - startIdx) / (count + 1)))

      try {
        for (let i = 0; i < count; i++) {
          if (hoverAborted) break
          const dataIdx = Math.min(startIdx + step * (i + 1), usd.length - 1)
          const p = usd[dataIdx]
          if (!p) continue

          const timeSec = Math.floor(p.x / 1000)
          const xCoord = chart.timeScale().timeToCoordinate(timeSec)
          const yCoord = usdSeries.priceToCoordinate(p.y)
          if (xCoord == null || yCoord == null) continue

          // Pair with ICP value at the same data index (worker output keeps the
          // two series aligned by checkpointIndex / position).
          const icpVal = icp[dataIdx]?.y ?? null

          // Show the lightweight-charts crosshair lines as well as the tooltip.
          chart.setCrosshairPosition(p.y, timeSec, usdSeries)

          tooltipPayload.value = buildTooltipPayload(timeSec, p.y, icpVal)
          tooltipPos.value = {
            x: xCoord,
            y: yCoord,
            flip: xCoord > containerWidth / 2,
          }
          tooltipVisible.value = true

          await new Promise(r => setTimeout(r, dwellMs))
        }
      } finally {
        chart?.clearCrosshairPosition()
        tooltipVisible.value = false
        hoverAborted = false
      }
    }

    // Stash the hover function on the container DOM node so the tour helper —
    // which only knows about CSS selectors — can find it without a Vue ref.
    function attachHoverHook() {
      if (chartContainer.value) {
        // eslint-disable-next-line no-extra-semi
        ;(chartContainer.value).__performanceChartHover = simulateHover
        ;(chartContainer.value).__performanceChartHoverAbort = () => { hoverAborted = true }
      }
    }
    function detachHoverHook() {
      if (chartContainer.value) {
        try {
          delete (chartContainer.value).__performanceChartHover
          delete (chartContainer.value).__performanceChartHoverAbort
        } catch (_e) { /* ignore */ }
      }
    }

    // ----- Tooltip overlay -----

    const truncateNote = (text, maxLines = 15) => {
      if (!text) return ''
      const lines = text.split('\n')
      const out = []
      for (let i = 0; i < lines.length; i++) {
        if (i >= maxLines) { out.push('...'); break }
        out.push(lines[i])
      }
      return out.join('\n')
    }

    const formatPct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
    const formatTooltipDate = (ms) => {
      const d = new Date(ms)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    function buildTooltipPayload(timeSec, usdValue, icpValue) {
      const checkpointIdx = usdCheckpointByTime.get(timeSec) ?? icpCheckpointByTime.get(timeSec) ?? -1
      const td = checkpointIdx >= 0 ? tooltipDataMap.value[checkpointIdx] : null
      const checkpoint = checkpointIdx >= 0 ? usdCheckpoints.value[checkpointIdx] : null

      const allocations = []
      let hasAnyPriceChange = false
      let hasIcpChange = false

      if (td?.tokens?.length) {
        for (const t of td.tokens) {
          const usdHas = t.usdChange != null
          const icpHas = t.icpChange != null
          if (usdHas) hasAnyPriceChange = true
          if (icpHas) hasIcpChange = true
          allocations.push({
            symbol: t.symbol,
            percent: t.percent,
            usdChangeText: usdHas ? formatPct(t.usdChange) : '',
            icpChangeText: icpHas ? formatPct(t.icpChange) : '',
            usdChangeColor: usdHas ? (t.usdChange >= 0 ? COLORS.pricePos : COLORS.priceNeg) : 'transparent',
            icpChangeColor: icpHas ? (t.icpChange >= 0 ? COLORS.pricePos : COLORS.priceNeg) : 'transparent',
          })
        }
      }

      let allocColumns = 'auto 1fr'
      if (hasAnyPriceChange) {
        allocColumns = hasIcpChange
          ? 'auto auto minmax(56px, auto) minmax(56px, auto)'
          : 'auto auto minmax(56px, auto)'
      }

      let note = null
      if (checkpoint?.reason && checkpoint.reason.length > 0 && checkpoint.reason[0]) {
        note = truncateNote(checkpoint.reason[0], 15)
      }

      return {
        timeMs: timeSec * 1000,
        usdReturn: usdValue ?? null,
        icpReturn: icpValue ?? null,
        allocations,
        hasAnyPriceChange,
        hasIcpChange,
        allocColumns,
        note,
      }
    }

    function handleCrosshairMove(param) {
      if (!param || !param.time || !param.point ||
          param.point.x < 0 || param.point.y < 0 ||
          !chartContainer.value ||
          param.point.x > chartContainer.value.clientWidth ||
          param.point.y > chartContainer.value.clientHeight) {
        tooltipVisible.value = false
        return
      }
      const timeSec = typeof param.time === 'number' ? param.time : Number(param.time)
      const usdData = usdSeries ? param.seriesData.get(usdSeries) : null
      const icpData = icpSeries ? param.seriesData.get(icpSeries) : null
      const usdVal = usdData ? usdData.value : null
      const icpVal = icpData ? icpData.value : null

      tooltipPayload.value = buildTooltipPayload(timeSec, usdVal, icpVal)

      const containerWidth = chartContainer.value.clientWidth
      tooltipPos.value = {
        x: param.point.x,
        y: param.point.y,
        flip: param.point.x > containerWidth / 2,
      }
      tooltipVisible.value = true
    }

    // ----- Data load (canister or prop) -----

    const loadPerformanceData = async () => {
      if (!props.principal) return

      const seq = ++loadSeq
      loading.value = true
      error.value = ''
      usdCheckpoints.value = []
      icpCheckpoints.value = []

      try {
        // The graph can approach the 2 MiB query-reply limit, and decoding ~2 MiB
        // of Candid on the main thread froze the page for tens of seconds. Do the
        // fetch + DECODE + serialize entirely inside a DedicatedWorker; we receive
        // only chart-ready serialized checkpoints, so the page stays responsive.
        let serialized
        const cached = performanceDataCache.get(props.principal)
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
          serialized = cached.data
        } else {
          const res = await fetchPerformanceGraph({
            principal: props.principal,
            host: getNetworkHost(),
            canisterId: getCanisterId('rewards'),
            fetchRootKey: getEffectiveNetwork() === 'local',
          })
          if (seq !== loadSeq) return // superseded
          if (res.error) { error.value = res.error; return }
          serialized = res.checkpoints || []
          performanceDataCache.set(props.principal, { data: serialized, timestamp: Date.now() })
        }
        if (!serialized.length) { error.value = 'No checkpoint data available'; return }
        usdCheckpoints.value = serialized
        icpCheckpoints.value = serialized
        serializedCheckpoints.value = serialized
        baselineIndex.value = 0
      } catch (err) {
        console.error('Error loading performance chart data:', err)
        const msg = err?.message || String(err)
        if (msg.includes('not found') || msg.includes('subnet')) {
          error.value = 'Performance data temporarily unavailable'
        } else {
          error.value = 'Failed to load chart data'
        }
      } finally {
        // Only the current load owns the spinner; a superseded one must not
        // clear it out from under the newer load.
        if (seq === loadSeq) loading.value = false
      }
    }

    const formatError = (err) => {
      if ('NeuronNotFound' in err) return 'No performance data yet'
      if ('NotAuthorized' in err) return 'Not authorized'
      if ('SystemError' in err) return 'System temporarily unavailable'
      if ('AllocationDataMissing' in err) return 'Allocation data not available'
      if ('PriceDataMissing' in err) return 'Price data not available'
      if ('InvalidTimeRange' in err) return 'Invalid time range'
      return 'Failed to load data'
    }

    watch(() => props.principal, () => { loadPerformanceData() }, { immediate: false })

    // hasData controls v-else-if rendering of the chart container, so we need
    // to wait for the DOM to settle before calling setupChart.
    watch(hasData, (now) => {
      if (now) nextTick(() => setupChart())
    })

    onMounted(() => {
      loadPerformanceData()
    })

    onBeforeUnmount(() => {
      detachHoverHook()
      resizeObserver?.disconnect()
      resizeObserver = null
      chart?.remove()
      chart = null
      usdSeries = null
      icpSeries = null
      disposeChartPort()
    })

    return {
      // state
      loading, computing, error, hasData,
      baselineIndex, baselineOptions,
      // chart refs
      chartContainer, heightCss,
      // tooltip overlay
      tooltipVisible, tooltipPos, tooltipPayload, tooltipStyle,
      // helpers used in template
      formatPct, formatTooltipDate,
      // constants used in template
      COLORS,
    }
  }
}
</script>

<style scoped lang="scss">
.performance-chart {
  width: 100%;
  min-height: 100px;
  position: relative;
  touch-action: pan-y;
}

.performance-chart__shell {
  position: relative;
  width: 100%;
}

.performance-chart__container {
  width: 100%;
  height: 100%;
}

.performance-chart__tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  background: #512100;
  border: 1px solid #DA8D28;
  border-radius: 6px;
  padding: 10px;
  min-width: 210px;
  max-width: 360px;
  color: #fff;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  line-height: 1.35;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.performance-chart__tooltip-header {
  color: #FEEAC1;
  font-size: 11px;
  margin-bottom: 6px;
}

.performance-chart__tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 12px;

  > span:last-child { font-weight: 600; }
}

.performance-chart__tooltip-section {
  border-top: 1px solid #DA8D28;
  margin-top: 8px;
  padding-top: 8px;
}

.performance-chart__tooltip-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  color: #FEEAC1;
  font-size: 11px;
}

.performance-chart__tooltip-section-meta {
  font-size: 9px;
  opacity: 0.5;
}

.performance-chart__tooltip-allocs {
  display: grid;
  gap: 2px 10px;
  align-items: center;
}

.performance-chart__tooltip-symbol {
  color: #FEEAC1;
  font-size: 13px;
}

.performance-chart__tooltip-percent {
  color: #fff;
  font-size: 13px;
  text-align: right;
  justify-self: end;
}

.performance-chart__tooltip-change {
  font-size: 12px;
  text-align: right;
  justify-self: end;
  white-space: nowrap;

  &--icp { opacity: 0.75; }
}

.performance-chart__tooltip-note {
  color: #fff;
  font-size: 11px;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 340px;
  overflow: hidden;
}

.baseline-label {
  font-size: 0.8rem;
  white-space: nowrap;
  font-family: 'Space Mono', monospace;
}

.baseline-select {
  max-width: 200px;
  background-color: var(--dark-brown);
  color: #fff;
  border-color: var(--dark-orange);
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  font-family: 'Space Mono', monospace;
}

.baseline-select:focus {
  background-color: var(--dark-brown);
  color: #fff;
  border-color: var(--brown);
  box-shadow: 0 0 0 0.15rem rgba(147, 74, 23, 0.35);
}

.chart-muted {
  color: var(--dark-brown-to-white);
}
</style>
