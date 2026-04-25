<template>
  <div class="tx-page-title">
    <h1 class="tx-h1">
      {{ label }}
      <span v-if="qualifier" class="tx-serif tx-orange">{{ qualifier }}</span>
    </h1>
    <div v-if="subtitle" class="tx-page-title__sub tx-ink-3">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  qualifier?: string
  subtitle?: string
}>()
</script>

<style scoped>
.tx-page-title .tx-h1 {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.tx-page-title .tx-h1 .tx-serif {
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0;
}
.tx-page-title__sub {
  font-size: 13px;
  margin-top: 4px;
}
</style>
