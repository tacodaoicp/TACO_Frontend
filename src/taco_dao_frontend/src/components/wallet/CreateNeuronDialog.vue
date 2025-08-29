<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1" @click="handleBackdropClick">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-plus-circle me-2"></i>
            Create New Neuron
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        
        <div class="modal-body">
          <div class="info-section mb-4">
            <div class="info-card">
              <div class="info-header">
                <i class="fa fa-info-circle me-2"></i>
                <span>Creating a New Neuron</span>
              </div>
              <div class="info-content">
                <p>You're about to create a new TACO neuron. This will:</p>
                <ul>
                  <li>Find the next available neuron ID for your account</li>
                  <li>Transfer your TACO tokens to the neuron</li>
                  <li>Create and activate the neuron for voting</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label for="createAmount" class="form-label">Amount to Stake (TACO)</label>
            <div class="input-group">
              <input
                id="createAmount"
                v-model="stakeAmount"
                type="number"
                class="form-control"
                placeholder="0.00000000"
                step="0.00000001"
                min="0.00000001"
                :disabled="isCreating"
              />
              <span class="input-group-text">TACO</span>
            </div>
            <div class="form-text">
              Available Balance: {{ formatBalance(tacoBalance, 8) }} TACO
            </div>
            <div v-if="stakeAmountBigInt > 0n" class="form-text">
              Minimum stake: 1.00000000 TACO
            </div>
          </div>

          <div class="mb-3">
            <label for="dissolveDays" class="form-label">Dissolve Period (Days)</label>
            <input
              id="dissolveDays"
              v-model.number="dissolveDays"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': dissolveDays < 28 || dissolveDays > 180 }"
              min="28"
              max="180"
              step="1"
              placeholder="Enter days (e.g., 28, 60, 90)"
              :disabled="isCreating"
            />
            <div class="form-text">
              <i class="fa fa-info-circle me-1"></i>
              Recommended: 28 days minimum for voting rewards. Range: 28-180 days (6 months)
            </div>
            <div v-if="dissolveDays < 28 || dissolveDays > 180" class="invalid-feedback">
              Please enter between 28 and 180 days
            </div>
          </div>

          <div v-if="dissolveDays >= 28 && dissolveDays <= 180" class="dissolve-preview">
            <h6>Dissolve Preview:</h6>
            <div class="preview-item">
              <span class="label">Dissolve Period:</span>
              <span class="value">{{ dissolveDays }} days ({{ Math.round(dissolveDays / 30 * 10) / 10 }} months)</span>
            </div>
            <div class="preview-item">
              <span class="label">Dissolve Date:</span>
              <span class="value">{{ formatFutureDate(dissolveDays) }}</span>
            </div>
            <div class="preview-item">
              <span class="label">Age Bonus:</span>
              <span class="value">✅ Will accrue from creation</span>
            </div>
          </div>

          <div v-if="stakeAmountBigInt > 0n" class="stake-preview mb-3">
            <div class="preview-item">
              <span>Amount to stake:</span>
              <span class="fw-bold">{{ formatBalance(stakeAmountBigInt, 8) }} TACO</span>
            </div>
            <div class="preview-item">
              <span>Transfer fee:</span>
              <span>{{ formatBalance(tacoFee, 8) }} TACO</span>
            </div>
            <div class="preview-item border-top pt-2">
              <span class="fw-bold">Total required:</span>
              <span class="fw-bold">{{ formatBalance(stakeAmountBigInt + tacoFee, 8) }} TACO</span>
            </div>
          </div>

          <div v-if="successMessage" class="alert alert-success">
            <i class="fa fa-check-circle me-2"></i>
            {{ successMessage }}
          </div>

          <div v-if="error" class="alert alert-danger">
            <i class="fa fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="!isSuccess"
            type="button" 
            class="btn btn-secondary" 
            @click="close" 
            :disabled="isCreating"
          >
            Cancel
          </button>
          <button 
            v-if="isSuccess"
            type="button" 
            class="btn btn-success" 
            @click="close"
          >
            <i class="fa fa-check me-2"></i>
            Close
          </button>
          <button 
            v-if="!isSuccess"
            type="button" 
            class="btn btn-primary" 
            @click="handleCreate"
            :disabled="!canCreate || isCreating"
          >
            <span v-if="isCreating" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fa fa-plus me-2"></i>
            {{ isCreating ? 'Creating...' : 'Create Neuron' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Backdrop -->
  <div v-if="show" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

interface CreateNeuronDialogProps {
  show: boolean
  tacoBalance: bigint
  prefilledAmount?: string
}

interface CreateNeuronDialogEmits {
  (e: 'close'): void
  (e: 'created'): void
}

const props = defineProps<CreateNeuronDialogProps>()
const emit = defineEmits<CreateNeuronDialogEmits>()

const tacoStore = useTacoStore()

// State
const stakeAmount = ref('')
const dissolveDays = ref(28) // Default to 28 days
const isCreating = ref(false)
const error = ref('')
const successMessage = ref('')
const isSuccess = ref(false)

// Constants
const tacoFee = 10000n // 0.0001 TACO
const minStake = 100000000n // 1 TACO minimum

// Computed
const stakeAmountBigInt = computed(() => {
  try {
    const amount = parseFloat(stakeAmount.value || '0')
    if (isNaN(amount) || amount <= 0) return 0n
    return BigInt(Math.floor(amount * 100000000)) // Convert to e8s
  } catch {
    return 0n
  }
})

const canCreate = computed(() => {
  return stakeAmountBigInt.value >= minStake && 
         stakeAmountBigInt.value + tacoFee <= props.tacoBalance &&
         dissolveDays.value >= 28 && dissolveDays.value <= 180 &&
         !isCreating.value
})

// Watch for dialog open/close to reset state
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

const resetForm = () => {
  // Use prefilled amount if provided, otherwise empty
  stakeAmount.value = props.prefilledAmount || ''
  dissolveDays.value = 28 // Reset to default
  error.value = ''
  successMessage.value = ''
  isCreating.value = false
  isSuccess.value = false
}

const close = () => {
  if (!isCreating.value) {
    emit('close')
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const handleCreate = async () => {
  if (!canCreate.value) return
  
  isCreating.value = true
  error.value = ''
  
  try {
    const result = await tacoStore.createNeuron(stakeAmountBigInt.value)
    
    if (result.success && result.subaccount) {
      // Set dissolve delay for the newly created neuron
      try {
        console.log('Setting dissolve delay for new neuron...')
        const delayMonths = dissolveDays.value / 30
        await tacoStore.setNeuronDissolveDelay(result.subaccount, delayMonths)
        console.log(`Dissolve delay set to ${dissolveDays.value} days (${delayMonths} months)`)
      } catch (dissolveError: any) {
        console.warn('Failed to set dissolve delay, but neuron was created:', dissolveError)
        // Don't fail the whole operation, just warn the user
        error.value = `Neuron created successfully, but failed to set dissolve period: ${dissolveError.message}`
      }
      
      // Show success state in dialog
      isSuccess.value = true
      successMessage.value = `Successfully created new neuron with ${formatBalance(stakeAmountBigInt.value, 8)} TACO and ${dissolveDays.value} day dissolve period!`
      
      // Also show toast notification
      tacoStore.addToast('success', 'Neuron Created', `Successfully created new neuron with ${formatBalance(stakeAmountBigInt.value, 8)} TACO and ${dissolveDays.value} day dissolve period`)
      
      emit('created')
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        close()
      }, 3000)
    }
  } catch (err: any) {
    console.error('Neuron creation error:', err)
    error.value = err.message || 'Failed to create neuron. Please try again.'
  } finally {
    isCreating.value = false
  }
}

const formatFutureDate = (days: number) => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  return futureDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatBalance = (balance: bigint, decimals: number): string => {
  const divisor = BigInt(10 ** decimals)
  const wholePart = balance / divisor
  const fractionalPart = balance % divisor
  
  if (fractionalPart === 0n) {
    return wholePart.toString()
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmedFractional = fractionalStr.replace(/0+$/, '')
  
  if (trimmedFractional === '') {
    return wholePart.toString()
  }
  
  return `${wholePart}.${trimmedFractional}`
}
</script>

<style scoped>
.modal-content {
  background: var(--card-bg, #2d3748);
  border: 1px solid var(--border-color, #4a5568);
  border-radius: 12px;
  color: white;
}

.modal-header {
  border-bottom: 1px solid var(--border-color, #4a5568);
  background: var(--header-bg, #1a202c);
  border-radius: 12px 12px 0 0;
}

.modal-title {
  font-weight: 600;
  color: white;
}

.btn-close {
  filter: invert(1);
  opacity: 0.8;
}

.btn-close:hover {
  opacity: 1;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-card {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.info-header {
  font-weight: 600;
  color: #87ceeb;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.info-content p {
  margin-bottom: 0.5rem;
  color: var(--text-secondary, #a0aec0);
}

.info-content ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-secondary, #a0aec0);
}

.info-content li {
  margin-bottom: 0.25rem;
}

.form-label {
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.form-control {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
}

.form-control:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--primary-color, #0d6efd);
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  color: white;
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-group-text {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-left: none;
}

.form-text {
  color: var(--text-secondary, #a0aec0);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.stake-preview {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.dissolve-preview {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.dissolve-preview h6 {
  margin: 0 0 0.75rem 0;
  color: white;
  font-weight: 600;
}

.dissolve-preview .preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.dissolve-preview .preview-item:last-child {
  margin-bottom: 0;
}

.dissolve-preview .label {
  color: #a0aec0;
  font-weight: 500;
}

.dissolve-preview .value {
  color: white;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}

.alert-success {
  background: rgba(25, 135, 84, 0.1);
  border: 1px solid rgba(25, 135, 84, 0.3);
  color: #d1e7dd;
}

.alert-danger {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #f8d7da;
}

.modal-footer {
  border-top: 1px solid var(--border-color, #4a5568);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color, #0d6efd), var(--primary-hover, #0b5ed7));
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 576px) {
  .modal-dialog {
    margin: 1rem;
  }
  
  .info-card {
    padding: 0.75rem;
  }
  
  .stake-preview {
    padding: 0.75rem;
  }
}
</style>
