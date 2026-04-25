<template>
  <div class="tx-loading tx-card">
    <div v-if="label" class="tx-eyebrow">{{ label }}</div>
    <div
      v-for="i in rows"
      :key="i"
      class="tx-loading__row"
      :class="{ 'tx-loading__row--bordered': i < rows }"
    >
      <div class="tx-skeleton tx-loading__icon"></div>
      <div class="tx-loading__lines">
        <div class="tx-skeleton tx-loading__line tx-loading__line--lg"></div>
        <div class="tx-skeleton tx-loading__line tx-loading__line--sm"></div>
      </div>
      <div class="tx-skeleton tx-loading__right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  label?: string
}>(), {
  rows: 5,
  label: 'Loading…',
})
</script>

<style scoped>
.tx-loading {
  padding: 20px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tx-loading__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.tx-loading__row--bordered {
  border-bottom: 1px solid var(--tx-line);
}
.tx-loading__icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tx-loading__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.tx-loading__line {
  height: 11px;
}
.tx-loading__line--lg { width: 60%; }
.tx-loading__line--sm { width: 40%; height: 9px; }
.tx-loading__right {
  width: 48px;
  height: 14px;
  flex-shrink: 0;
}
</style>
