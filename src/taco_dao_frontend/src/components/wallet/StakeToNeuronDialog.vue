<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1" @click="handleBackdropClick">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-plus-circle me-2"></i>
            Stake to Neuron
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        
        <div class="modal-body">
          <div v-if="neuron" class="neuron-info mb-4">
            <h6 class="text-muted mb-2">Staking to:</h6>
            <div class="neuron-card">
              <div class="neuron-details">
                <div class="neuron-name">{{ neuron.displayName }}</div>
                <div class="neuron-stake">
                  Current Stake: {{ formatBalance(neuron.stake, 8) }} TACO
                </div>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label for="stakeAmount" class="form-label">Amount to Stake (TACO)</label>
            <div class="input-group">
              <input
                id="stakeAmount"
                v-model="stakeAmount"
                type="number"
                class="form-control"
                placeholder="0.00000000"
                step="0.00000001"
                min="0.00000001"
                :disabled="isStaking"
              />
              <span class="input-group-text">TACO</span>
            </div>
            <div class="form-text">
              Available Balance: {{ formatBalance(tacoBalance, 8) }} TACO
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
            :disabled="isStaking"
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
            @click="handleStake"
            :disabled="!canStake || isStaking"
          >
            <span v-if="isStaking" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fa fa-plus me-2"></i>
            {{ isStaking ? 'Staking...' : 'Stake TACO' }}
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

interface StakeToNeuronDialogProps {
  show: boolean
  neuron: any | null
  tacoBalance: bigint
}

interface StakeToNeuronDialogEmits {
  (e: 'close'): void
  (e: 'staked', neuron: any): void
}

const props = defineProps<StakeToNeuronDialogProps>()
const emit = defineEmits<StakeToNeuronDialogEmits>()

const tacoStore = useTacoStore()

// State
const stakeAmount = ref('')
const isStaking = ref(false)
const error = ref('')
const successMessage = ref('')
const isSuccess = ref(false)

// Constants
const tacoFee = 10000n // 0.0001 TACO

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

const canStake = computed(() => {
  return stakeAmountBigInt.value > 0n && 
         stakeAmountBigInt.value + tacoFee <= props.tacoBalance &&
         !isStaking.value &&
         props.neuron
})

// Watch for dialog open/close to reset state
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

const resetForm = () => {
  stakeAmount.value = ''
  error.value = ''
  successMessage.value = ''
  isStaking.value = false
  isSuccess.value = false
}

const close = () => {
  if (!isStaking.value) {
    emit('close')
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const handleStake = async () => {
  if (!props.neuron || !canStake.value) return
  
  isStaking.value = true
  error.value = ''
  
  try {
    await tacoStore.stakeToNeuron(props.neuron.id, stakeAmountBigInt.value)
    
    // Show success state in dialog
    isSuccess.value = true
    successMessage.value = `Successfully staked ${formatBalance(stakeAmountBigInt.value, 8)} TACO to ${props.neuron.displayName}!`
    
    // Also show toast notification
    tacoStore.addToast('success', 'Staking Successful', `Successfully staked ${formatBalance(stakeAmountBigInt.value, 8)} TACO to ${props.neuron.displayName}`)
    
    emit('staked', props.neuron)
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      close()
    }, 3000)
  } catch (err: any) {
    console.error('Staking error:', err)
    error.value = err.message || 'Failed to stake TACO. Please try again.'
  } finally {
    isStaking.value = false
  }
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

.neuron-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.neuron-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.neuron-stake {
  font-size: 0.85rem;
  color: var(--text-secondary, #a0aec0);
  font-family: monospace;
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
  
  .neuron-card {
    padding: 0.75rem;
  }
  
  .stake-preview {
    padding: 0.75rem;
  }
}
</style>
