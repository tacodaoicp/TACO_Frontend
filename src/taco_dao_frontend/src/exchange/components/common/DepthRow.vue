<template>
  <div
    :class="['tx-depth', `tx-depth--${side}`]"
    :style="{ '--depth': `${clampedDepth}%` } as any"
    @click="$emit('click')"
  >
    <span :style="{ color: sideColor }">{{ priceText }}</span>
    <span>{{ amountText }}</span>
    <span>{{ totalText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  side: 'bid' | 'ask'
  price: number | string
  amount: number | string
  total: number | string
  depthPct: number
  priceDecimals?: number
  amountDecimals?: number
  totalDecimals?: number
}>(), {
  priceDecimals: 5,
  amountDecimals: 0,
  totalDecimals: 2,
})

defineEmits<{ (e: 'click'): void }>()

const clampedDepth = computed(() => Math.min(100, Math.max(0, props.depthPct)))
const sideColor = computed(() =>
  props.side === 'bid' ? 'var(--tx-buy)' : 'var(--tx-sell)',
)

function fmt(v: number | string, decimals: number, isCount: boolean) {
  if (typeof v === 'string') return v
  if (isCount) return v.toLocaleString()
  return v.toFixed(decimals)
}

const priceText  = computed(() => fmt(props.price,  props.priceDecimals,  false))
const amountText = computed(() => fmt(props.amount, props.amountDecimals, props.amountDecimals === 0))
const totalText  = computed(() => fmt(props.total,  props.totalDecimals,  false))
</script>
