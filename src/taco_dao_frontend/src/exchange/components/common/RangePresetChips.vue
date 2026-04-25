<template>
  <div class="tx-preset-row tx-row">
    <button
      v-for="p in presets"
      :key="p"
      type="button"
      class="tx-btn tx-btn--ghost tx-btn--sm tx-preset-row__chip"
      @click="$emit('select', p)"
    >
      ±{{ p }}%
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  presets?: number[]
}>(), {
  presets: () => [5, 10, 20, 50, 75],
})

defineEmits<{
  (e: 'select', pct: number): void
}>()
</script>

<style scoped>
.tx-preset-row {
  gap: 6px;
  flex-wrap: wrap;
}
.tx-preset-row__chip {
  flex: 1;
  font-size: 11px;
  min-width: 52px;
}
</style>
