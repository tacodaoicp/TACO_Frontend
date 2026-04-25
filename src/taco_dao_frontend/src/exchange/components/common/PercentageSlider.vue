<template>
  <div class="tx-pct">
    <div class="tx-pct__track">
      <div class="tx-pct__rail" />
      <div class="tx-pct__fill" :style="{ width: `${modelValue}%`, background: sideColor }" />
      <button
        v-for="v in steps"
        :key="v"
        type="button"
        class="tx-pct__handle"
        :style="handleStyle(v)"
        @click="$emit('update:modelValue', v)"
        :aria-label="`Set ${v}%`"
      />
    </div>
    <div class="tx-pct__labels tx-row">
      <span v-for="v in steps" :key="`l-${v}`" class="tx-ink-3">{{ v }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  side?: 'buy' | 'sell' | 'orange'
}>(), {
  side: 'orange',
})

defineEmits<{
  (e: 'update:modelValue', v: number): void
}>()

const steps = [0, 25, 50, 75, 100]
const sideColor = computed(() =>
  props.side === 'buy'  ? 'var(--tx-buy)'
  : props.side === 'sell' ? 'var(--tx-sell)'
  : 'var(--tx-orange)',
)
function handleStyle(v: number) {
  return {
    left: `calc(${v}% - 7px)`,
    background: props.modelValue >= v ? sideColor.value : 'var(--tx-surface-3)',
  }
}
</script>

<style scoped>
.tx-pct__track {
  position: relative;
  height: 22px;
}
.tx-pct__rail,
.tx-pct__fill {
  position: absolute;
  top: 10px;
  height: 2px;
  border-radius: 1px;
}
.tx-pct__rail {
  left: 0; right: 0;
  background: var(--tx-surface-3);
}
.tx-pct__fill { left: 0; }
.tx-pct__handle {
  position: absolute;
  top: 4px;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 2px solid var(--tx-bg);
  cursor: pointer;
  padding: 0;
  transition: background 120ms, transform 120ms;
}
.tx-pct__handle:hover { transform: scale(1.15); }
.tx-pct__labels {
  justify-content: space-between;
  margin-top: 2px;
}
.tx-pct__labels span { font-size: 10px; }
</style>
