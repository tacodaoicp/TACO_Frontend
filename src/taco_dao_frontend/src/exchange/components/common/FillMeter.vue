<template>
  <div class="tx-fill">
    <svg viewBox="0 0 100 100" class="tx-fill__svg">
      <circle
        cx="50" cy="50" r="42"
        fill="none" stroke="var(--tx-line-2)" stroke-width="7"
      />
      <circle
        cx="50" cy="50" r="42"
        fill="none" :stroke="strokeColor" stroke-width="7"
        stroke-linecap="round"
        :stroke-dasharray="dashArray"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div class="tx-fill__text">
      <div class="tx-mono tx-tnum tx-fill__pct">{{ Math.round(percent) }}%</div>
      <div class="tx-ink-3 tx-fill__label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  percent: number
  size?: number
  label?: string
  tone?: 'orange' | 'buy' | 'sell'
}>(), {
  size: 108,
  label: 'FILLED',
  tone: 'orange',
})

// Circumference of r=42 circle = 2πr ≈ 263.89
const CIRC = 263.89
const dashArray = computed(() => {
  const p = Math.max(0, Math.min(100, props.percent))
  return `${(p / 100) * CIRC} ${CIRC}`
})
const strokeColor = computed(() =>
  props.tone === 'buy'  ? 'var(--tx-buy)'
  : props.tone === 'sell' ? 'var(--tx-sell)'
  : 'var(--tx-orange)',
)
</script>

<style scoped>
.tx-fill {
  position: relative;
  width: 108px; height: 108px;
  margin: 0 auto;
}
.tx-fill__svg {
  width: 100%; height: 100%;
}
.tx-fill__text {
  position: absolute; inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.tx-fill__pct {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.tx-fill__label {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 2px;
}
</style>
