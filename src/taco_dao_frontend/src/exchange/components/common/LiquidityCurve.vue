<template>
  <svg
    width="100%"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    class="tx-curve"
    :class="{ 'tx-curve--readonly': readonly }"
    @pointerdown="readonly ? null : onPointerDown($event)"
  >
    <defs>
      <linearGradient id="tx-curve-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="var(--tx-orange)" stop-opacity="0.35" />
        <stop offset="1" stop-color="var(--tx-orange)" stop-opacity="0.02" />
      </linearGradient>
      <linearGradient id="tx-curve-fill-active" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="var(--tx-orange)" stop-opacity="0.75" />
        <stop offset="1" stop-color="var(--tx-orange)" stop-opacity="0.15" />
      </linearGradient>
    </defs>

    <line v-for="t in [0.25, 0.5, 0.75]" :key="t"
      x1="0" :x2="width"
      :y1="height * t" :y2="height * t"
      stroke="var(--tx-line)" stroke-width="0.5" stroke-dasharray="2 4" />

    <!-- Real density histogram when `realBars` is provided; synthetic
         Gaussian fallback otherwise (matches Figma decorative mockup). -->
    <g v-if="useReal">
      <rect
        v-for="(b, i) in realBarsDrawn"
        :key="'r' + i"
        :x="b.x"
        :y="b.y"
        :width="b.w"
        :height="b.h"
        :fill="b.inRange ? 'url(#tx-curve-fill-active)' : 'url(#tx-curve-fill)'"
        :stroke="b.inRange ? 'var(--tx-orange)' : 'none'"
        :stroke-width="b.inRange ? 0.5 : 0"
        stroke-opacity="0.5"
      />
    </g>
    <g v-else>
      <rect
        v-for="(h, i) in syntheticBars"
        :key="'s' + i"
        :x="(i * width) / barCount + 1"
        :y="height - h - 6"
        :width="width / barCount - 2"
        :height="h"
        :fill="inSyntheticRange(i) ? 'url(#tx-curve-fill-active)' : 'url(#tx-curve-fill)'"
        :stroke="inSyntheticRange(i) ? 'var(--tx-orange)' : 'none'"
        :stroke-width="inSyntheticRange(i) ? 0.5 : 0"
        stroke-opacity="0.5"
      />
    </g>

    <line
      :x1="(width * currentPricePct) / 100"
      :x2="(width * currentPricePct) / 100"
      y1="10" :y2="height - 4"
      stroke="var(--tx-amber)" stroke-width="1.5" stroke-dasharray="3 3"
    />
    <template v-if="!readonly">
      <line
        :x1="(width * minPct) / 100"
        :x2="(width * minPct) / 100"
        y1="0" :y2="height - 4"
        stroke="var(--tx-orange)" stroke-width="2"
      />
      <line
        :x1="(width * maxPct) / 100"
        :x2="(width * maxPct) / 100"
        y1="0" :y2="height - 4"
        stroke="var(--tx-orange)" stroke-width="2"
      />
      <circle
        :cx="(width * minPct) / 100"
        :cy="height - 50" r="6"
        fill="var(--tx-orange)" stroke="var(--tx-bg)" stroke-width="2"
        style="cursor: ew-resize; pointer-events: none"
      />
      <circle
        :cx="(width * maxPct) / 100"
        :cy="height - 50" r="6"
        fill="var(--tx-orange)" stroke="var(--tx-bg)" stroke-width="2"
        style="cursor: ew-resize; pointer-events: none"
      />
      <!-- Invisible 2× hit area on top of each handle so fat fingers can
           grab the slider on touch devices. `fill="transparent"` (vs none)
           is required for SVG to register pointer events. -->
      <circle
        :cx="(width * minPct) / 100"
        :cy="height - 50" r="16"
        fill="transparent"
        style="cursor: ew-resize"
        data-handle="min"
      />
      <circle
        :cx="(width * maxPct) / 100"
        :cy="height - 50" r="16"
        fill="transparent"
        style="cursor: ew-resize"
        data-handle="max"
      />
    </template>

    <text :x="width - 8" :y="height - 12" text-anchor="end"
      font-size="10" fill="var(--tx-ink-3)"
      font-family="JetBrains Mono, monospace">
      {{ useReal ? 'Live liquidity' : 'AMM liquidity' }}
    </text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** A concentrated liquidity bar — `pctLow`/`pctHigh` in 0–100 chart space,
    `liquidity` in arbitrary units (heights normalized internally). */
export interface LiquidityBar {
  pctLow: number
  pctHigh: number
  liquidity: number
}

const props = withDefaults(defineProps<{
  minPct: number
  maxPct: number
  currentPricePct?: number
  barCount?: number
  peakIndex?: number
  width?: number
  height?: number
  /** Real on-chain liquidity density. When provided + non-empty, replaces
      the decorative Gaussian with a real histogram. */
  realBars?: LiquidityBar[]
  /** Render a static curve: no min/max handles, no range lines, no drag.
      Useful for pool overview charts where the user is just viewing. */
  readonly?: boolean
}>(), {
  currentPricePct: 42,
  barCount: 48,
  peakIndex: 18,
  width: 600,
  height: 160,
  realBars: () => [],
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:minPct', v: number): void
  (e: 'update:maxPct', v: number): void
}>()

const useReal = computed(() => props.realBars.length > 0)

// ── Synthetic (decorative) bars ──────────────────────────────────
const syntheticBars = computed(() => {
  const out: number[] = []
  for (let i = 0; i < props.barCount; i++) {
    const distance = Math.abs(i - props.peakIndex)
    const h = Math.max(8, (props.height - 20) * Math.exp(-(distance * distance) / 60))
    out.push(h)
  }
  return out
})
function inSyntheticRange(i: number) {
  const pct = (i / props.barCount) * 100
  return pct >= props.minPct && pct <= props.maxPct
}

// ── Real-data bars ───────────────────────────────────────────────
// Clip bars to [0, 100], skip those fully outside. Height normalised by
// max liquidity so the tallest bar is ~(height - 20), matching the
// synthetic fallback's top padding.
const realBarsDrawn = computed(() => {
  if (!useReal.value) return []
  const clipped = props.realBars
    .map(b => ({
      pctLow: Math.max(0, Math.min(100, b.pctLow)),
      pctHigh: Math.max(0, Math.min(100, b.pctHigh)),
      liquidity: b.liquidity,
    }))
    .filter(b => b.pctHigh > b.pctLow && b.liquidity > 0)
  if (clipped.length === 0) return []
  const maxLiq = Math.max(...clipped.map(b => b.liquidity))
  const maxH = props.height - 20
  return clipped.map(b => {
    const x = (b.pctLow / 100) * props.width
    const w = Math.max(1, ((b.pctHigh - b.pctLow) / 100) * props.width)
    const h = Math.max(2, (b.liquidity / maxLiq) * maxH)
    const midPct = (b.pctLow + b.pctHigh) / 2
    const inRange = midPct >= props.minPct && midPct <= props.maxPct
    return { x, y: props.height - h - 6, w, h, inRange }
  })
})

function onPointerDown(e: PointerEvent) {
  const target = e.target as SVGElement
  const handle = target.getAttribute?.('data-handle')
  if (!handle) return
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  svg.setPointerCapture(e.pointerId)

  const move = (ev: PointerEvent) => {
    const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
    if (handle === 'min' && pct < props.maxPct) emit('update:minPct', pct)
    if (handle === 'max' && pct > props.minPct) emit('update:maxPct', pct)
  }
  const up = () => {
    svg.removeEventListener('pointermove', move)
    svg.removeEventListener('pointerup', up)
    svg.releasePointerCapture(e.pointerId)
  }
  svg.addEventListener('pointermove', move)
  svg.addEventListener('pointerup', up)
}
</script>

<style scoped>
.tx-curve { display: block; touch-action: none; }
</style>
