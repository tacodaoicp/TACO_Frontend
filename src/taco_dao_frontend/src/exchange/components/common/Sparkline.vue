<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
    <polyline
      :points="pointsStr"
      fill="none"
      :stroke="up ? 'var(--tx-buy)' : 'var(--tx-sell)'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  up: boolean
  points?: number[]
  width?: number
  height?: number
}>(), {
  width: 100,
  height: 18,
})

const defaultUp   = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x, i) =>
  [x, 14 - i * 1.2 + (i % 2 ? 0.8 : 0)] as [number, number])
const defaultDown = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x, i) =>
  [x, 4 + i * 0.8 + (i % 2 ? -0.5 : 0)] as [number, number])

const pointsStr = computed(() => {
  if (props.points && props.points.length >= 2) {
    const step = props.width / (props.points.length - 1)
    const min = Math.min(...props.points)
    const max = Math.max(...props.points)
    const range = max - min || 1
    return props.points
      .map((v, i) => `${i * step},${props.height - ((v - min) / range) * (props.height - 2) - 1}`)
      .join(' ')
  }
  const pts = props.up ? defaultUp : defaultDown
  return pts.map(([x, y]) => `${x},${y}`).join(' ')
})
</script>
