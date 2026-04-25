<template>
  <div class="tx-capeff tx-row">
    <div class="tx-capeff__icon">⚡</div>
    <div>
      <div class="tx-buy tx-capeff__title">{{ multiplier.toFixed(1) }}× capital efficiency</div>
      <div class="tx-ink-3 tx-capeff__note">{{ note }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  multiplier: number
  note?: string
}>(), {
  note: 'vs full range at this width',
})
</script>

<style scoped>
.tx-capeff {
  gap: 10px;
  padding: 10px 12px;
  background: var(--tx-buy-dim);
  border: 1px solid rgba(59, 168, 122, 0.25);
  border-radius: var(--tx-r-md);
  align-items: flex-start;
}
.tx-capeff__icon { font-size: 16px; line-height: 1; margin-top: 1px; }
.tx-capeff__title { font-size: 12px; font-weight: 600; }
.tx-capeff__note  { font-size: 12px; margin-top: 2px; }
</style>
