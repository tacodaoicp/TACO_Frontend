<template>
  <div class="tx-state tx-state--error tx-card">
    <div class="tx-state__icon">!</div>
    <div class="tx-state__title">{{ title }}</div>
    <div class="tx-state__body tx-ink-3">
      <slot>
        <template v-if="errorText">
          <span class="tx-mono">{{ errorText }}</span>
        </template>
      </slot>
    </div>
    <button
      v-if="onRetry"
      class="tx-btn tx-btn--outline tx-btn--sm"
      type="button"
      @click="onRetry"
    >
      ↻ Retry
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  errorText?: string
  onRetry?: () => void
}>()
</script>

<style scoped>
.tx-state {
  padding: 24px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
}
.tx-state--error {
  border: 1px solid rgba(235, 0, 0, 0.28);
}
.tx-state__icon {
  width: 54px; height: 54px;
  border-radius: 50%;
  background: var(--tx-sell-dim);
  border: 1px solid rgba(217, 64, 64, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--tx-sell);
  font-weight: 700;
}
.tx-state__title {
  font-weight: 700;
  font-size: 15px;
  margin-top: 4px;
}
.tx-state__body {
  font-size: 12px;
  line-height: 1.5;
  max-width: 260px;
}
</style>
