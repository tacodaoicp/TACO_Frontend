<template>

  <div v-if="show && data" class="taco-modal-overlay" @click="$emit('close')">

    <!-- modal dialog -->
    <div class="taco-modal-dialog" @click.stop>

      <!-- header -->
      <div class="taco-modal-header">
        <div class="taco-modal-title">
          <i class="fa-solid fa-shield-halved confirm-icon"></i>
          <span class="confirm-title-text">{{ data.title }}</span>
        </div>
        <button type="button" class="btn taco-modal-close" @click="$emit('close')">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <!-- body -->
      <div class="taco-modal-body">

        <!-- key-value rows -->
        <div class="confirm-details">
          <div v-for="row in data.rows" :key="row.label" class="confirm-row">
            <span class="confirm-row__label">{{ row.label }}</span>
            <span class="confirm-row__value">{{ row.value }}</span>
          </div>
        </div>

        <!-- don't show again -->
        <label class="confirm-skip">
          <input type="checkbox" v-model="dontShowAgain" />
          <span>Don't show this confirmation again</span>
        </label>

      </div>

      <!-- footer -->
      <div class="taco-modal-footer">

        <!-- cancel -->
        <button class="btn" style="font-family: 'Space Mono';" @click="$emit('close')">
          <span style="color: var(--black-to-white);">Cancel</span>
        </button>

        <!-- confirm -->
        <button class="btn taco-btn taco-btn--green" @click="$emit('confirm', dontShowAgain)">
          {{ data.actionLabel }}
        </button>

      </div>

    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface ConfirmData {
  title: string
  rows: Array<{ label: string; value: string }>
  actionLabel: string
}

const props = defineProps<{ show: boolean; data: ConfirmData | null }>()

defineEmits<{
  (e: 'confirm', dontShowAgain: boolean): void
  (e: 'close'): void
}>()

const dontShowAgain = ref(false)

// Reset checkbox when dialog opens
watch(() => props.show, (v) => {
  if (v) dontShowAgain.value = false
})
</script>

<style scoped>
:deep(.taco-modal-overlay) span {
  color: var(--black-to-white);
}

:deep(.taco-modal-dialog) {
  max-width: 420px;
}

.confirm-icon {
  font-size: 2rem;
  color: var(--dark-brown-to-white) !important;
  margin-right: 0.75rem;
}

.confirm-title-text {
  font-size: 1.25rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.confirm-details {
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  overflow: clip;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--dark-orange);
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;

  &:last-child {
    border-bottom: none;
  }
}

.confirm-row__label {
  opacity: 0.7;
}

.confirm-row__value {
  font-weight: bold;
  text-align: right;
}

.confirm-skip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.7;

  input[type="checkbox"] {
    accent-color: var(--dark-orange);
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
}

:deep(.taco-modal-footer) .btn:active {
  border-color: transparent;
}

@media (max-width: 576px) {
  :deep(.taco-modal-dialog) {
    margin: 0.5rem;
    max-height: 95vh;
  }
}
</style>
