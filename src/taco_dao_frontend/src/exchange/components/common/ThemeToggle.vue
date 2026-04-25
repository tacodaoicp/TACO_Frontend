<template>
  <button
    type="button"
    class="tx-theme-toggle"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="toggle"
  >
    <svg v-if="isDark" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M11.5 8.3a4.5 4.5 0 0 1-5.8-5.8 5 5 0 1 0 5.8 5.8z" fill="currentColor"/>
    </svg>
    <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="3" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
        <line x1="7" y1="0.8" x2="7" y2="2.5"/>
        <line x1="7" y1="11.5" x2="7" y2="13.2"/>
        <line x1="0.8" y1="7" x2="2.5" y2="7"/>
        <line x1="11.5" y1="7" x2="13.2" y2="7"/>
        <line x1="2.5" y1="2.5" x2="3.7" y2="3.7"/>
        <line x1="10.3" y1="10.3" x2="11.5" y2="11.5"/>
        <line x1="2.5" y1="11.5" x2="3.7" y2="10.3"/>
        <line x1="10.3" y1="3.7" x2="11.5" y2="2.5"/>
      </g>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTacoStore } from '../../../stores/taco.store'

const tacoStore = useTacoStore()
const isDark = computed(() => tacoStore.exchangeTheme === 'masa')
const ariaLabel = computed(() =>
  isDark.value ? 'Switch to Cotija (light theme)' : 'Switch to Masa (dark theme)'
)

function toggle() {
  tacoStore.exchangeTheme = isDark.value ? 'cotija' : 'masa'
}
</script>

<style scoped>
.tx-theme-toggle {
  appearance: none;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--tx-line-2);
  border-radius: var(--tx-r-md);
  color: var(--tx-ink-2);
  cursor: pointer;
  transition: all 140ms;
}
.tx-theme-toggle:hover {
  color: var(--tx-ink);
  border-color: var(--tx-line-hi);
  background: var(--tx-surface-1);
}
.tx-theme-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--tx-orange-line);
}
</style>
