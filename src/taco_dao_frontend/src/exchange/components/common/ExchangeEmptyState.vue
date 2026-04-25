<template>
  <div class="tx-state tx-card">
    <div class="tx-state__icon">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <div class="tx-state__title">{{ title }}</div>
    <div v-if="body" class="tx-state__body tx-ink-3">{{ body }}</div>
    <div v-if="$slots.cta" class="tx-state__cta">
      <slot name="cta" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  body?: string
  icon?: string
}>(), {
  icon: '◎',
})
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
.tx-state__icon {
  width: 54px; height: 54px;
  border-radius: 50%;
  background: var(--tx-surface-2);
  border: 1px solid var(--tx-line-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--tx-ink-3);
}
.tx-state__title {
  font-weight: 700;
  font-size: 15px;
  margin-top: 4px;
}
.tx-state__body {
  font-size: 12px;
  line-height: 1.5;
  max-width: 220px;
}
.tx-state__cta {
  margin-top: 8px;
}
</style>
