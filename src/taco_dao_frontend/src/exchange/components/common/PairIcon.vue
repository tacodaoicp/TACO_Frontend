<template>
  <div class="tx-pair" :style="wrapStyle">
    <CoinIcon :symbol="symbolA" :color="colorA" :size="size" />
    <div class="tx-pair__b">
      <CoinIcon :symbol="symbolB" :color="colorB" :size="size" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CoinIcon from './CoinIcon.vue'

const props = withDefaults(defineProps<{
  symbolA: string
  symbolB: string
  colorA?: string
  colorB?: string
  size?: number
}>(), {
  colorA: 'var(--tx-orange)',
  colorB: 'var(--tx-info)',
  size: 22,
})

const wrapStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
}))
</script>

<style scoped>
.tx-pair__b {
  margin-left: -6px;
}
.tx-pair__b .tx-coin {
  border: 1.5px solid var(--tx-surface-2);
}
</style>
