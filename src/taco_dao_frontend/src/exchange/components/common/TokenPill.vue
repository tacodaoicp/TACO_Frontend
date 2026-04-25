<template>
  <button class="tx-token-pill tx-row" type="button" @click="$emit('click')">
    <CoinIcon :symbol="symbol" :color="color" :size="26" />
    <span class="tx-token-pill__sym">{{ symbol }}</span>
    <span class="tx-ink-3 tx-token-pill__chev">▾</span>
  </button>
</template>

<script setup lang="ts">
import CoinIcon from './CoinIcon.vue'

defineProps<{
  symbol: string
  color?: string
}>()
defineEmits<{ (e: 'click'): void }>()
</script>

<style scoped>
.tx-token-pill {
  gap: 8px;
  padding: 6px 10px 6px 6px;
  background: var(--tx-surface-2);
  border: 1px solid var(--tx-line);
  border-radius: 999px;
  cursor: pointer;
  color: var(--tx-ink);
  transition: border-color 140ms, background 140ms;
}
.tx-token-pill:hover {
  border-color: var(--tx-line-hi);
  background: var(--tx-surface-3);
}
.tx-token-pill__sym { font-weight: 600; font-size: 14px; }
.tx-token-pill__chev { font-size: 11px; }
</style>
