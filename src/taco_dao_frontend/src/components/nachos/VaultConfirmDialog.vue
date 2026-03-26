<template>

  <div v-if="show && data" class="modal-overlay" @click="$emit('close')">

    <!-- modal dialog -->
    <div class="modal-dialog" @click.stop>

      <!-- header -->
      <div class="modal-header">
        <div class="modal-title">
          <i class="fa-solid fa-shield-halved confirm-icon"></i>
          <span class="confirm-title-text">{{ data.title }}</span>
        </div>
        <button type="button" class="btn confirm-btn-close" @click="$emit('close')">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <!-- body -->
      <div class="modal-body">

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
      <div class="modal-footer">

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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  pointer-events: auto;

  span {
    color: var(--black-to-white);
  }
}

.modal-dialog {
  background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
  border: 2px solid var(--card-border);
  border-radius: 0.5rem;
  overflow: clip;
  max-width: 420px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: #ffffff;
  pointer-events: auto;
  position: relative;
}

.modal-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin: 0;
  padding: 0;
  border-bottom: 0;
  margin-bottom: 0.75rem;
}

.modal-title {
  display: flex;
  align-items: center;
  margin: 1.5rem 0px 0px 1.5rem;
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

.confirm-btn-close {
  margin: 1rem .5rem 0 0;

  i {
    font-size: 1.5rem;
    color: var(--black-to-white);
  }
}

.modal-body {
  padding: 0.75rem 1.5rem 0 !important;
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

.modal-footer {
  border-top: none;
  padding: 1rem;

  .btn:active {
    border-color: transparent;
  }
}

@media (max-width: 576px) {
  .modal-dialog {
    margin: 0.5rem;
    max-height: 95vh;
  }
}
</style>
