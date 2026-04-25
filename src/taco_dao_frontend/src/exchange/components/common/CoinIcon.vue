<template>
  <div class="tx-coin" :style="style">
    <slot>{{ label }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  symbol: string
  color?: string
  size?: number
}>(), {
  color: 'var(--tx-orange)',
  size: 26,
})

const label = computed(() => props.symbol.slice(0, 2))
const fontSize = computed(() => {
  if (props.size <= 18) return 8
  if (props.size <= 22) return 9
  if (props.size <= 30) return 10
  return 12
})
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  background: props.color,
  fontSize: `${fontSize.value}px`,
}))
</script>

<style scoped>
.tx-coin {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: -0.02em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  font-family: var(--font-ui);
}
</style>
