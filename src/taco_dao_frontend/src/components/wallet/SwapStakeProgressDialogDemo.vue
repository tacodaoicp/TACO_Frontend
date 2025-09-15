<template>
  <div v-if="show" class="modal-overlay" @click="handleBackdropClick">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-magic me-2"></i>
            Swap & Stake Progress
          </h5>
          <button 
            v-if="!isProcessing" 
            type="button" 
            class="btn-close" 
            @click="close"
          ></button>
        </div>
        
        <div class="modal-body">
          <div class="progress-steps">
            <!-- Step 1: Getting Quotes -->
            <div class="step-item" :class="getStepClass('quotes')">
              <div class="step-icon">
                <i v-if="stepStatus.quotes === 'completed'" class="fa fa-check"></i>
                <i v-else-if="stepStatus.quotes === 'active'" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-circle"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Getting Best Quote</div>
                <div class="step-description">Comparing rates from Kong and ICPSwap</div>
              </div>
            </div>

            <!-- Step 2: Executing Swap -->
            <div class="step-item" :class="getStepClass('swap')">
              <div class="step-icon">
                <i v-if="stepStatus.swap === 'completed'" class="fa fa-check"></i>
                <i v-else-if="stepStatus.swap === 'active'" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-circle"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Swapping Tokens</div>
                <div class="step-description">
                  <span v-if="swapDetails.exchange">
                    Using {{ swapDetails.exchange }} • {{ swapDetails.inputAmount }} {{ swapDetails.inputSymbol }} → {{ swapDetails.outputAmount }} TACO
                  </span>
                  <span v-else>Executing token swap</span>
                </div>
              </div>
            </div>

            <!-- Step 3: Creating Neuron -->
            <div class="step-item" :class="getStepClass('stake')">
              <div class="step-icon">
                <i v-if="stepStatus.stake === 'completed'" class="fa fa-check"></i>
                <i v-else-if="stepStatus.stake === 'active'" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-circle"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Creating Neuron</div>
                <div class="step-description">Staking TACO with 28-day dissolve delay</div>
              </div>
            </div>

            <!-- Step 4: Setting Dissolve Delay -->
            <div class="step-item" :class="getStepClass('dissolve')">
              <div class="step-icon">
                <i v-if="stepStatus.dissolve === 'completed'" class="fa fa-check"></i>
                <i v-else-if="stepStatus.dissolve === 'active'" class="fa fa-spinner fa-spin"></i>
                <i v-else class="fa fa-circle"></i>
              </div>
              <div class="step-content">
                <div class="step-title">Setting Dissolve Delay</div>
                <div class="step-description">Configuring 28-day dissolve period</div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="error-message mt-4">
            <div class="alert alert-danger">
              <i class="fa fa-exclamation-triangle me-2"></i>
              <strong>Error:</strong> {{ error }}
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="isComplete && !error" class="success-message mt-4">
            <div class="alert alert-success">
              <i class="fa fa-check-circle me-2"></i>
              <strong>Success!</strong> Your tokens have been swapped and staked successfully!
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            v-if="!isProcessing || error" 
            type="button" 
            class="btn btn-secondary" 
            @click="close"
          >
            {{ error ? 'Close' : 'Done' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface SwapStakeProgressProps {
  show: boolean
}

interface SwapDetails {
  exchange: string
  inputAmount: string
  inputSymbol: string
  outputAmount: string
}

interface SwapStakeProgressEmits {
  (e: 'close'): void
}

const props = defineProps<SwapStakeProgressProps>()
const emit = defineEmits<SwapStakeProgressEmits>()

// State
const stepStatus = ref<{[key: string]: 'pending' | 'active' | 'completed' | 'error'}>({
  quotes: 'pending',
  swap: 'pending', 
  stake: 'pending',
  dissolve: 'pending'
})

const swapDetails = ref<SwapDetails>({
  exchange: '',
  inputAmount: '',
  inputSymbol: '',
  outputAmount: ''
})

const error = ref('')

// Computed
const isProcessing = computed(() => {
  return Object.values(stepStatus.value).some(status => status === 'active')
})

const isComplete = computed(() => {
  return Object.values(stepStatus.value).every(status => status === 'completed')
})

// Methods
const getStepClass = (step: string) => {
  const status = stepStatus.value[step]
  return {
    'step-pending': status === 'pending',
    'step-active': status === 'active',
    'step-completed': status === 'completed',
    'step-error': status === 'error'
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget && !isProcessing.value) {
    close()
  }
}

const close = () => {
  if (!isProcessing.value) {
    emit('close')
  }
}

// Public methods for parent to control progress
const setStepActive = (step: string) => {
  stepStatus.value[step] = 'active'
}

const setStepCompleted = (step: string) => {
  stepStatus.value[step] = 'completed'
}

const setStepError = (step: string) => {
  stepStatus.value[step] = 'error'
}

const setSwapDetails = (details: SwapDetails) => {
  swapDetails.value = details
}

const setError = (errorMessage: string) => {
  error.value = errorMessage
}

const reset = () => {
  stepStatus.value = {
    quotes: 'pending',
    swap: 'pending',
    stake: 'pending', 
    dissolve: 'pending'
  }
  swapDetails.value = {
    exchange: '',
    inputAmount: '',
    inputSymbol: '',
    outputAmount: ''
  }
  error.value = ''
}

// Expose methods to parent
defineExpose({
  setStepActive,
  setStepCompleted,
  setStepError,
  setSwapDetails,
  setError,
  reset
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog {
  background: #2d3748;
  border-radius: 12px;
  border: 1px solid #4a5568;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #4a5568;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: #4a5568;
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #4a5568;
  display: flex;
  justify-content: flex-end;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.step-item.step-pending {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

.step-item.step-active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.step-item.step-completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
}

.step-item.step-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.step-pending .step-icon {
  background: #4a5568;
  color: #a0aec0;
}

.step-active .step-icon {
  background: #3b82f6;
  color: white;
}

.step-completed .step-icon {
  background: #22c55e;
  color: white;
}

.step-error .step-icon {
  background: #ef4444;
  color: white;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: white;
}

.step-description {
  font-size: 0.875rem;
  color: #a0aec0;
  line-height: 1.4;
}

.step-active .step-description {
  color: #bfdbfe;
}

.step-completed .step-description {
  color: #bbf7d0;
}

.error-message .alert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 1rem;
  color: #fecaca;
}

.success-message .alert {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 1rem;
  color: #bbf7d0;
}

.btn {
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #4a5568;
  color: white;
}

.btn-secondary:hover {
  background: #5a6478;
}
</style>
