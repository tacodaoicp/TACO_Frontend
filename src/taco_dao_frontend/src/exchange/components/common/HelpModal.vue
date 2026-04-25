<template>
  <teleport to="body">
    <div
      v-if="open"
      class="ex-modal-overlay"
      data-theme="exchange"
      @click.self="emit('update:open', false)"
      @keydown.esc="emit('update:open', false)"
    >
      <div class="ex-modal" role="dialog" aria-label="Keyboard shortcuts">
        <div class="ex-modal__header">
          <h3>Keyboard shortcuts</h3>
          <button
            type="button"
            class="ex-modal__close"
            aria-label="Close"
            @click="emit('update:open', false)"
          >✕</button>
        </div>
        <table class="ex-table" style="width:100%">
          <tbody>
            <tr v-for="s in shortcuts" :key="s.key">
              <td class="tx-mono" style="width: 80px; color: var(--tx-ink-3)">{{ s.key }}</td>
              <td>{{ s.label }}</td>
            </tr>
          </tbody>
        </table>
        <div class="ex-modal__actions">
          <button class="tx-btn tx-btn--outline tx-btn--sm" @click="emit('update:open', false)">Close</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
}>()
const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const shortcuts = [
  { key: 'P',   label: 'Pro Trade' },
  { key: 'E',   label: 'Easy Swap' },
  { key: 'O',   label: 'Portfolio' },
  { key: 'L',   label: 'Liquidity Pools' },
  { key: 'Esc', label: 'Close modal' },
  { key: '?',   label: 'This help' },
]
</script>
