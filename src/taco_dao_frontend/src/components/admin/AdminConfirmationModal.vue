<template>
  <div v-if="show" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog">
      <div class="modal-content bg-dark text-white">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="btn-close btn-close-white" @click="handleCancel"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleConfirm">
            <div class="mb-3">
              <p>{{ message }}</p>
              <div v-if="extraData" class="alert alert-info">
                <pre>{{ extraData }}</pre>
              </div>
            </div>
            
            <div class="mb-3">
              <label class="form-label">
                Reason <span class="text-danger">*</span>
              </label>
              <textarea 
                class="form-control" 
                v-model="reason" 
                required 
                rows="3"
                :placeholder="reasonPlaceholder"
                maxlength="500"></textarea>
              <small class="text-muted">{{ reason.length }}/500 characters</small>
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" @click="handleCancel">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn" 
                :class="confirmButtonClass"
                :disabled="submitting || !reason.trim()">
                {{ submitting ? 'Processing...' : confirmButtonText }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  show: boolean
  title: string
  message: string
  extraData?: string
  confirmButtonText?: string
  confirmButtonClass?: string
  reasonPlaceholder?: string
  submitting?: boolean
}

interface Emits {
  (e: 'confirm', reason: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmButtonText: 'Confirm',
  confirmButtonClass: 'btn-primary',
  reasonPlaceholder: 'Please provide a reason for this action...',
  submitting: false
})

const emit = defineEmits<Emits>()

const reason = ref('')

// Reset form when modal is shown/hidden
watch(() => props.show, (newShow) => {
  if (newShow) {
    reason.value = ''
  }
})

const handleConfirm = () => {
  if (reason.value.trim()) {
    emit('confirm', reason.value.trim())
  }
}

const handleCancel = () => {
  reason.value = ''
  emit('cancel')
}
</script>

<style scoped>
.modal-content {
  border: 1px solid #495057;
}

.form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(128, 189, 255, 0.25);
}

pre {
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.85em;
}
</style>