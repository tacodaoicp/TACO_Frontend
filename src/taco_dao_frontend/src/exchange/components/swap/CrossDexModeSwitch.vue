<template>
  <div class="cx-mode" role="group" aria-label="CrossDEX mode">
    <button
      type="button"
      :aria-pressed="modelValue === 'swap'"
      :disabled="disabled"
      @click="$emit('update:modelValue', 'swap')"
    >Single swap</button>
    <button
      type="button"
      :aria-pressed="modelValue === 'many'"
      :disabled="disabled"
      @click="$emit('update:modelValue', 'many')"
    >Sell many</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: 'swap' | 'many'; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [v: 'swap' | 'many'] }>()
</script>

<style scoped lang="scss">
.cx-mode {
  display: inline-flex;
  background: var(--tx-surface-1);
  border: 1px solid var(--tx-line);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;

  button {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--tx-ink-3);
    height: 30px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s, background 0.15s;

    &:hover:not(:disabled) { color: var(--tx-ink); }
    &[aria-pressed='true'] {
      background: var(--tx-surface-3);
      color: var(--tx-ink);
      box-shadow: inset 0 0 0 1px var(--tx-line-2);
    }
    &:disabled { cursor: default; opacity: 0.6; }
  }

  @media (max-width: 600px) {
    flex: 1;
    button { flex: 1; height: 36px; }
  }
}
</style>
