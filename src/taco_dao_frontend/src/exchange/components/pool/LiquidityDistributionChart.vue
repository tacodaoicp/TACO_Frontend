<template>
  <div class="liq-chart" ref="containerRef">
    <div v-if="loading" class="liq-chart__loading">Loading distribution...</div>
    <div v-else-if="bars.length === 0 && fullRangeLiq <= 0 && currentPrice <= 0" class="liq-chart__empty">No liquidity data</div>
    <template v-else>
      <canvas
        ref="canvasRef"
        class="liq-chart__canvas"
        @mousedown="onPointerDown"
        @mousemove="onPointerMove"
        @mouseup="onPointerUp"
        @mouseleave="onPointerUp"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onPointerUp"
      />
      <div class="liq-chart__x-labels">
        <span v-for="label in xLabels" :key="label.x" :style="{ left: label.x + '%' }">{{ label.text }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated, nextTick } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { ratioToHumanPrice, formatRangePrice, isEffectivelyFullRange } from '../../utils/concentrated'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  currentPrice: number
  selectedLower?: number
  selectedUpper?: number
}>()

const emit = defineEmits<{
  'update:selectedLower': [value: number]
  'update:selectedUpper': [value: number]
}>()

const store = useExchangeStore()
const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)

interface Bar {
  priceLower: number
  priceUpper: number
  priceMid: number
  liquidity: number
}

const bars = ref<Bar[]>([])
const fullRangeLiq = ref(0)

// Chart coordinate state (cached from last draw)
let chartMinPrice = 0
let chartMaxPrice = 1
let chartWidth = 0
let chartPad = 4

// Dragging state
let dragging: 'lower' | 'upper' | null = null

function xToPrice(x: number): number {
  const usableWidth = chartWidth - chartPad * 2
  if (usableWidth <= 0) return 0
  const ratio = (x - chartPad) / usableWidth
  return chartMinPrice + ratio * (chartMaxPrice - chartMinPrice)
}

function priceToX(price: number): number {
  const usableWidth = chartWidth - chartPad * 2
  return ((price - chartMinPrice) / (chartMaxPrice - chartMinPrice || 1)) * usableWidth + chartPad
}

function onPointerDown(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left
  const lowerX = props.selectedLower != null ? priceToX(props.selectedLower) : -999
  const upperX = props.selectedUpper != null && isFinite(props.selectedUpper!) ? priceToX(props.selectedUpper!) : -999

  // Check which handle is closer (within 12px grab zone)
  const distLower = Math.abs(x - lowerX)
  const distUpper = Math.abs(x - upperX)

  if (distLower < 12 && distLower <= distUpper) {
    dragging = 'lower'
  } else if (distUpper < 12) {
    dragging = 'upper'
  }
}

function onPointerMove(e: MouseEvent) {
  if (!dragging) {
    // Show grab cursor near handles
    const rect = canvasRef.value?.getBoundingClientRect()
    if (!rect || !canvasRef.value) return
    const x = e.clientX - rect.left
    const lowerX = props.selectedLower != null ? priceToX(props.selectedLower) : -999
    const upperX = props.selectedUpper != null && isFinite(props.selectedUpper!) ? priceToX(props.selectedUpper!) : -999
    const nearHandle = Math.abs(x - lowerX) < 12 || Math.abs(x - upperX) < 12
    canvasRef.value.style.cursor = nearHandle ? 'col-resize' : 'default'
    return
  }

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left
  const price = xToPrice(x)

  if (dragging === 'lower') {
    const clamped = Math.max(0, Math.min(price, (props.selectedUpper ?? Infinity) * 0.99))
    emit('update:selectedLower', clamped)
  } else if (dragging === 'upper') {
    const clamped = Math.max((props.selectedLower ?? 0) * 1.01, price)
    emit('update:selectedUpper', clamped)
  }
}

function onPointerUp() {
  dragging = null
}

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect || !touch) return
  const x = touch.clientX - rect.left
  const lowerX = props.selectedLower != null ? priceToX(props.selectedLower) : -999
  const upperX = props.selectedUpper != null && isFinite(props.selectedUpper!) ? priceToX(props.selectedUpper!) : -999
  const distLower = Math.abs(x - lowerX)
  const distUpper = Math.abs(x - upperX)

  if (distLower < 24 && distLower <= distUpper) dragging = 'lower'
  else if (distUpper < 24) dragging = 'upper'
}

function onTouchMove(e: TouchEvent) {
  if (!dragging) return
  const touch = e.touches[0]
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect || !touch) return
  const x = touch.clientX - rect.left
  const price = xToPrice(x)

  if (dragging === 'lower') {
    emit('update:selectedLower', Math.max(0, Math.min(price, (props.selectedUpper ?? Infinity) * 0.99)))
  } else if (dragging === 'upper') {
    emit('update:selectedUpper', Math.max((props.selectedLower ?? 0) * 1.01, price))
  }
}

async function fetchRanges() {
  if (!props.token0 || !props.token1) return
  loading.value = true
  try {
    const raw = await store.getPoolRanges(props.token0, props.token1)
    const allBars = (raw as any[]).map(r => {
      const pl = ratioToHumanPrice(r.ratioLower, props.decimals0, props.decimals1)
      const pu = ratioToHumanPrice(r.ratioUpper, props.decimals0, props.decimals1)
      return {
        priceLower: pl,
        priceUpper: pu,
        priceMid: (pl + pu) / 2,
        liquidity: Number(r.liquidity),
        isFullRange: isEffectivelyFullRange(r.ratioLower, r.ratioUpper),
      }
    }).filter(b => b.liquidity > 0)

    bars.value = allBars.filter(b => !b.isFullRange)
    fullRangeLiq.value = allBars.filter(b => b.isFullRange).reduce((s, b) => s + b.liquidity, 0)
  } catch (err) {
    console.error('[LiqChart] Fetch error:', err)
    bars.value = []
  } finally {
    loading.value = false
    nextTick(draw)
  }
}

// Defensive cap so a rogue bar price (e.g. near-full-range that slipped past
// isEffectivelyFullRange) can't blow the axis into scientific notation.
const SANE_VIEW_MULTIPLIER = 20

function computeAxisWindow(cp: number): { min: number; max: number } {
  const windowMin = cp / SANE_VIEW_MULTIPLIER
  const windowMax = cp * SANE_VIEW_MULTIPLIER
  const barPrices = bars.value
    .flatMap(b => [b.priceLower, b.priceUpper])
    .filter(p => isFinite(p) && p > 0 && p >= windowMin / 10 && p <= windowMax * 10)

  let min: number, max: number
  if (barPrices.length > 0) {
    min = Math.min(Math.min(...barPrices), cp * 0.5)
    max = Math.max(Math.max(...barPrices), cp * 1.5)
  } else {
    min = cp / SANE_VIEW_MULTIPLIER
    max = cp * SANE_VIEW_MULTIPLIER
  }
  // Expand to include user-selected range (within the hard cap)
  if (props.selectedLower != null && isFinite(props.selectedLower) && props.selectedLower > 0) {
    min = Math.max(windowMin / 10, Math.min(min, props.selectedLower * 0.9))
  }
  if (props.selectedUpper != null && isFinite(props.selectedUpper!) && props.selectedUpper! > 0) {
    max = Math.min(windowMax * 10, Math.max(max, props.selectedUpper! * 1.1))
  }
  return { min, max }
}

const xLabels = computed(() => {
  const cp = props.currentPrice > 0 ? props.currentPrice : 1
  const { min, max } = computeAxisWindow(cp)
  const range = max - min || 1
  const count = 5
  const labels = []
  for (let i = 0; i <= count; i++) {
    const price = min + (range * i / count)
    labels.push({ x: (i / count) * 100, text: formatRangePrice(price) })
  }
  return labels
})

function draw() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = container.clientHeight - 20
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  chartWidth = w

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const cp = props.currentPrice > 0 ? props.currentPrice : 1
  const win = computeAxisWindow(cp)
  chartMinPrice = win.min
  chartMaxPrice = win.max

  const priceRange = chartMaxPrice - chartMinPrice || 1
  const maxLiq = bars.value.length > 0 ? Math.max(...bars.value.map(b => b.liquidity)) : 1
  const pad = chartPad

  // Resolve accent color from CSS variable
  const cs = getComputedStyle(document.documentElement)
  const accent = cs.getPropertyValue('--accent-primary').trim() || '#C45A0A'
  const slider = cs.getPropertyValue('--gold').trim() || '#D4A034'
  const textCream = cs.getPropertyValue('--text-cream').trim() || '#F5E6D3'

  // Draw selected range fill (highlight area)
  if (props.selectedLower != null && props.selectedUpper != null) {
    const slX = priceToX(props.selectedLower)
    const suX = isFinite(props.selectedUpper) ? priceToX(props.selectedUpper) : w - pad
    ctx.fillStyle = accent + '15'
    ctx.fillRect(slX, pad, suX - slX, h - pad * 2)
  }

  // Draw bars
  for (const bar of bars.value) {
    const x1 = priceToX(bar.priceLower)
    const x2 = priceToX(bar.priceUpper)
    const barW = Math.max(2, x2 - x1)
    const barH = (bar.liquidity / maxLiq) * (h - pad * 2)

    const isSelected = props.selectedLower != null && props.selectedUpper != null &&
      bar.priceMid >= props.selectedLower && bar.priceMid <= (isFinite(props.selectedUpper) ? props.selectedUpper : Infinity)

    ctx.fillStyle = isSelected ? accent : accent + '40'
    ctx.fillRect(x1, h - pad - barH, barW, barH)
  }

  // Full-range (AMM) liquidity: draw as a parabolic bell peaking at current price,
  // layered behind the concentrated bars so both are visible.
  if (fullRangeLiq.value > 0) {
    const maxLiqOverall = Math.max(fullRangeLiq.value, maxLiq)
    const peakH = (fullRangeLiq.value / maxLiqOverall) * (h - pad * 2) * 0.7
    const cx = priceToX(cp)
    const half = Math.max(cx - pad, (w - pad) - cx) || 1
    ctx.fillStyle = accent + '22'
    ctx.beginPath()
    ctx.moveTo(pad, h - pad)
    for (let px = pad; px <= w - pad; px += 2) {
      const norm = (px - cx) / half
      const y = (h - pad) - peakH * Math.max(0, 1 - norm * norm)
      ctx.lineTo(px, y)
    }
    ctx.lineTo(w - pad, h - pad)
    ctx.closePath()
    ctx.fill()
    // Small AMM label on the far right, clear of the center price line
    ctx.font = '10px sans-serif'
    ctx.fillStyle = accent + '80'
    ctx.textAlign = 'end'
    ctx.fillText('AMM liquidity', w - pad - 4, h - pad - peakH / 2)
    ctx.textAlign = 'start'
  }

  // Current price line (dashed)
  if (props.currentPrice > 0) {
    const cpX = priceToX(props.currentPrice)
    ctx.strokeStyle = textCream
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(cpX, pad)
    ctx.lineTo(cpX, h - pad)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Range boundary lines — use gold so the handles stand out against the accent bars
  if (props.selectedLower != null && props.selectedLower > 0) {
    const slX = priceToX(props.selectedLower)
    ctx.strokeStyle = slider
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(slX, pad)
    ctx.lineTo(slX, h - pad)
    ctx.stroke()
    // Draw grab handle
    ctx.fillStyle = slider
    ctx.beginPath()
    ctx.arc(slX, h / 2, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  if (props.selectedUpper != null && isFinite(props.selectedUpper!) && props.selectedUpper! > 0) {
    const suX = priceToX(props.selectedUpper!)
    ctx.strokeStyle = slider
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(suX, pad)
    ctx.lineTo(suX, h - pad)
    ctx.stroke()
    // Draw grab handle
    ctx.fillStyle = slider
    ctx.beginPath()
    ctx.arc(suX, h / 2, 6, 0, Math.PI * 2)
    ctx.fill()
  }
}

let ro: ResizeObserver | null = null

// Poll the ranges on an interval so the AMM curve stays fresh when LP
// activity happens elsewhere. Mutation-bus subscription triggers an
// instant refresh on same-session LP actions.
let pollTimer: ReturnType<typeof setInterval> | null = null
function startPolling() {
  if (!pollTimer) pollTimer = setInterval(fetchRanges, 15000)
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}
let offMutation: (() => void) | null = null

onMounted(() => {
  fetchRanges()
  startPolling()
  if (containerRef.value) {
    ro = new ResizeObserver(() => draw())
    ro.observe(containerRef.value)
  }
  offMutation = store.onMutation(kind => {
    if (kind === 'lp' || kind === 'claim') fetchRanges()
  })
})

onUnmounted(() => {
  ro?.disconnect()
  stopPolling()
  offMutation?.()
})

onActivated(() => { fetchRanges(); startPolling() })
onDeactivated(() => stopPolling())

watch([() => props.token0, () => props.token1], () => {
  bars.value = []
  fetchRanges()
})
watch([() => props.selectedLower, () => props.selectedUpper, () => props.currentPrice], () => nextTick(draw))
</script>

<style scoped lang="scss">
.liq-chart {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;

  &__canvas {
    display: block;
    width: 100%;
    touch-action: none; // prevent scroll while dragging handles
  }

  &__x-labels {
    position: relative;
    height: 16px;
    font-size: 9px;
    color: var(--text-tertiary);

    span {
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
    }
  }

  &__loading, &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }
}
</style>
