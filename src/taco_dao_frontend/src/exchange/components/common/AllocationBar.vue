<template>
  <div>
    <div class="tx-alloc">
      <div
        v-for="h in holdings"
        :key="h.symbol"
        class="tx-alloc__seg"
        :style="{ width: `${(h.value / total) * 100}%`, background: h.color }"
        :title="`${h.symbol} ${((h.value / total) * 100).toFixed(1)}%`"
      />
    </div>
    <div class="tx-alloc__legend tx-row">
      <div v-for="h in holdings" :key="h.symbol" class="tx-alloc__item tx-row">
        <div class="tx-alloc__dot" :style="{ background: h.color }" />
        <span class="tx-alloc__sym">{{ h.symbol }}</span>
        <span class="tx-ink-3 tx-mono tx-tnum">{{ ((h.value / total) * 100).toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  holdings: Array<{ symbol: string; color: string; value: number }>
}>()

const total = computed(() =>
  props.holdings.reduce((s, h) => s + h.value, 0) || 1,
)
</script>

<style scoped>
.tx-alloc {
  display: flex;
  height: 10px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--tx-surface-3);
}
.tx-alloc__seg { height: 100%; }
.tx-alloc__legend {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.tx-alloc__item {
  gap: 6px;
  font-size: 11px;
}
.tx-alloc__dot {
  width: 8px; height: 8px;
  border-radius: 2px;
}
.tx-alloc__sym { font-weight: 600; }
</style>
