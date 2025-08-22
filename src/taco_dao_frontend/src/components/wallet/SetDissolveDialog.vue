<template>
  <div v-if="show" class="modal-overlay" @click.self="closeDialog">
    <div class="modal-dialog">
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="fa fa-clock me-2"></i>
          Set Dissolve Period
        </h5>
        <button type="button" class="btn-close" @click="closeDialog">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="neuron-info-header">
          <h6>{{ neuron?.displayName }}</h6>
          <p class="text-muted">
            Current dissolve state: 
            <span :class="'dissolve-' + neuron?.dissolveState?.type">
              {{ neuron?.dissolveState?.display }}
            </span>
          </p>
        </div>

        <div class="form-group">
          <label for="dissolve-months" class="form-label">Dissolve Period (Months)</label>
          <input
            id="dissolve-months"
            v-model.number="dissolveMonths"
            type="number"
            class="form-control"
            :class="{ 'is-invalid': dissolveMonths < 1 }"
            min="1"
            max="96"
            step="1"
            placeholder="Enter months (e.g., 6, 12, 24)"
          />
          <div class="form-text">
            <i class="fa fa-info-circle me-1"></i>
            Recommended: 6-24 months for optimal voting rewards
          </div>
          <div v-if="dissolveMonths < 1" class="invalid-feedback">
            Please enter at least 1 month
          </div>
        </div>

        <div v-if="dissolveMonths >= 1" class="dissolve-preview">
          <h6>Preview:</h6>
          <div class="preview-item">
            <span class="label">Dissolve Period:</span>
            <span class="value">{{ dissolveMonths }} months (≈{{ Math.round(dissolveMonths * 30) }} days)</span>
          </div>
          <div class="preview-item">
            <span class="label">New Dissolve Date:</span>
            <span class="value">{{ formatFutureDate(dissolveMonths) }}</span>
          </div>
          <div class="preview-item">
            <span class="label">Age Bonus:</span>
            <span class="value">✅ Will continue accruing (neuron stops dissolving)</span>
          </div>
        </div>

        <div class="alert alert-info">
          <i class="fa fa-lightbulb me-2"></i>
          <strong>How it works:</strong>
          <ul class="mb-0 mt-2">
            <li>Sets the dissolve timestamp to {{ dissolveMonths }} months from now</li>
            <li>Stops the neuron from dissolving (preserves age bonus)</li>
            <li>Neuron will be locked and earn maximum voting rewards</li>
            <li>You can start dissolving later if needed</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          type="button" 
          class="btn btn-secondary" 
          @click="closeDialog"
          :disabled="loading"
        >
          Cancel
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="setDissolveDelay"
          :disabled="loading || dissolveMonths < 1"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fa fa-clock me-2"></i>
          {{ loading ? 'Setting...' : 'Set Dissolve Period' }}
        </button>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="alert alert-success mx-3 mb-3">
        <i class="fa fa-check-circle me-2"></i>
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="alert alert-danger mx-3 mb-3">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

interface Props {
  show: boolean
  neuron: any | null
}

interface Emits {
  (e: 'close'): void
  (e: 'dissolve-set'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tacoStore = useTacoStore()

// Form state
const dissolveMonths = ref(6) // Default to 6 months
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Reset form when dialog opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    dissolveMonths.value = 6
    loading.value = false
    successMessage.value = ''
    errorMessage.value = ''
  }
})

const formatFutureDate = (months: number) => {
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + months)
  return futureDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const setDissolveDelay = async () => {
  if (!props.neuron || dissolveMonths.value < 1) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('Setting dissolve delay for neuron:', props.neuron.idHex, 'to', dissolveMonths.value, 'months')
    
    const result = await tacoStore.setNeuronDissolveDelay(props.neuron.id, dissolveMonths.value)
    
    console.log('Dissolve delay set successfully:', result)
    
    successMessage.value = `Dissolve period set to ${dissolveMonths.value} months successfully! The neuron is now locked and will stop dissolving.`
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      closeDialog()
      emit('dissolve-set')
    }, 3000)
    
  } catch (error: any) {
    console.error('Error setting dissolve delay:', error)
    errorMessage.value = error.message || 'Failed to set dissolve period. Please try again.'
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  if (!loading.value) {
    emit('close')
  }
}
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
  backdrop-filter: blur(4px);
}

.modal-dialog {
  background: var(--card-background);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.25rem;
}

.neuron-info-header {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.neuron-info-header h6 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-weight: 600;
}

.neuron-info-header p {
  margin: 0;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background: var(--input-background);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.invalid-feedback {
  font-size: 0.8rem;
  color: #dc3545;
  margin-top: 0.25rem;
}

.dissolve-preview {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.dissolve-preview h6 {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
  font-weight: 600;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.preview-item .value {
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid;
  margin-bottom: 1rem;
}

.alert-info {
  background: rgba(23, 162, 184, 0.1);
  border-color: rgba(23, 162, 184, 0.2);
  color: #17a2b8;
}

.alert-success {
  background: rgba(40, 167, 69, 0.1);
  border-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.alert-danger {
  background: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.alert ul {
  padding-left: 1.2rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--secondary-color);
  border-color: var(--secondary-color);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--secondary-hover);
  border-color: var(--secondary-hover);
}

.btn-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.spinner-border {
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125rem;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* Dissolve state colors */
.dissolve-none {
  color: #6c757d;
}

.dissolve-delay {
  color: #28a745;
}

.dissolve-dissolving {
  color: #ffc107;
}

.dissolve-dissolved {
  color: #dc3545;
}

.dissolve-unknown {
  color: #6c757d;
}
</style>
