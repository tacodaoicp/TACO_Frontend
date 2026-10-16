<template>
  <div class="dex-bar" role="img" :aria-label="label" :title="label">
    <span
      v-for="(l, i) in legs"
      :key="i"
      :class="`dex-bar__seg dex-bar__seg--${l.dex}`"
      :style="{ flexGrow: Math.max(1, l.pctBP) }"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CrossDexVenue } from '../../utils/crossDexOptimizer'

const props = defineProps<{ legs: Array<{ dex: CrossDexVenue; pctBP: number }> }>()
const name = (d: CrossDexVenue) => (d === 'icpswap' ? 'ICPSwap' : d === 'neutrinite' ? 'Neutrinite' : 'TACO')
const label = computed(() => props.legs.map(l => `${name(l.dex)} ${Math.round(l.pctBP / 10) / 10}%`).join(', '))
</script>

<style scoped lang="scss">
.dex-bar {
  flex: 1;
  display: flex;
  gap: 2px;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--tx-surface-3);
  min-width: 40px;

  &__seg {
    display: block;
    height: 100%;
    flex-basis: 0;
    &--icpswap { background: var(--tx-dex-icpswap); }
    &--taco { background: var(--tx-dex-taco); }
    &--neutrinite { background: var(--tx-dex-neutrinite); }
  }
}
</style>
