<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="fa fa-check-circle me-2"></i>
          Confirm Swap
        </h5>
        <button @click="$emit('close')" class="btn-close">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Swap Summary -->
        <div class="swap-summary">
          <div class="swap-route">
            <!-- From Token -->
            <div class="token-section">
              <div class="token-header">
                <img :src="swapData.inputToken.logo" :alt="swapData.inputToken.symbol" class="token-logo" />
                <div class="token-info">
                  <div class="token-name">{{ swapData.inputToken.symbol }}</div>
                  <div class="token-full-name">{{ swapData.inputToken.name }}</div>
                </div>
              </div>
              <div class="token-amount">
                <div class="amount">{{ swapData.amount }}</div>
                <div class="amount-symbol">{{ swapData.inputToken.symbol }}</div>
              </div>
            </div>

            <!-- Arrow -->
            <div class="swap-arrow">
              <i class="fa fa-arrow-right"></i>
            </div>

            <!-- To Token -->
            <div class="token-section">
              <div class="token-header">
                <img :src="swapData.outputToken.logo" :alt="swapData.outputToken.symbol" class="token-logo" />
                <div class="token-info">
                  <div class="token-name">{{ swapData.outputToken.symbol }}</div>
                  <div class="token-full-name">{{ swapData.outputToken.name }}</div>
                </div>
              </div>
              <div class="token-amount">
                <div class="amount">{{ formatBalance(swapData.selectedQuote.amountOut, swapData.outputToken.decimals) }}</div>
                <div class="amount-symbol">{{ swapData.outputToken.symbol }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Exchange Info -->
        <div class="exchange-info">
          <div class="info-header">
            <h6>Exchange: {{ swapData.selectedQuote.exchange }}</h6>
            <div class="best-rate-badge">Best Rate</div>
          </div>
          
          <div class="info-details">
            <div class="detail-row">
              <span class="detail-label">Price Impact:</span>
              <span class="detail-value" :class="getPriceImpactClass(swapData.selectedQuote.slippage)">
                {{ swapData.selectedQuote.slippage.toFixed(2) }}%
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Slippage Tolerance:</span>
              <span class="detail-value text-primary">
                {{ (swapData.slippageTolerance * 100).toFixed(1) }}%
              </span>
            </div>
            
            <div v-if="swapData.selectedQuote.exchange === 'Kong'" class="detail-row">
              <span class="detail-label">Execution Price:</span>
              <span class="detail-value">{{ swapData.selectedQuote.price.toFixed(6) }}</span>
            </div>
            
            <div v-if="swapData.selectedQuote.exchange === 'ICPSwap'" class="detail-row">
              <span class="detail-label">Pool Fee:</span>
              <span class="detail-value">{{ (swapData.selectedQuote.fee / 10000).toFixed(2) }}%</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Network Fee:</span>
              <span class="detail-value">
                {{ formatBalance(swapData.inputToken.fee, swapData.inputToken.decimals) }} {{ swapData.inputToken.symbol }}
              </span>
            </div>
          </div>
        </div>

        <!-- Swap Method Selection -->
        <div class="swap-method-section">
          <h6 class="method-title">Swap Method</h6>
          <div class="method-options">
            <label class="method-option" :class="{ active: swapMethod === 'icrc2' }">
              <input 
                type="radio" 
                v-model="swapMethod" 
                value="icrc2" 
                class="method-radio"
              />
              <div class="method-content">
                <div class="method-name">
                  <i class="fa fa-key me-2"></i>
                  ICRC2 (Recommended)
                </div>
                <div class="method-description">
                  Approve tokens for the exchange to spend. More gas efficient.
                </div>
              </div>
            </label>
            
            <label class="method-option" :class="{ active: swapMethod === 'icrc1' }">
              <input 
                type="radio" 
                v-model="swapMethod" 
                value="icrc1" 
                class="method-radio"
              />
              <div class="method-content">
                <div class="method-name">
                  <i class="fa fa-paper-plane me-2"></i>
                  ICRC1 Transfer
                </div>
                <div class="method-description">
                  Transfer tokens directly to the exchange first.
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Warning Section -->
        <div class="warning-section">
          <div class="warning-item">
            <i class="fa fa-info-circle me-2"></i>
            <span>This transaction cannot be undone. Please verify all details before proceeding.</span>
          </div>
          <div v-if="swapData.selectedQuote.slippage > 1" class="warning-item high-slippage">
            <i class="fa fa-exclamation-triangle me-2"></i>
            <span>High price impact ({{ swapData.selectedQuote.slippage.toFixed(2) }}%). Consider reducing your swap amount.</span>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="hasError" class="error-section">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle text-danger me-2"></i>
          <div class="error-details">
            <h6 class="error-title">Swap Failed</h6>
            <p class="error-message">{{ errorMessage }}</p>
            <small class="error-hint">You can copy this error message for support.</small>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary" :disabled="isExecuting">
          Cancel
        </button>
        <button 
          @click="executeSwap"
          class="btn btn-primary"
          :disabled="isExecuting"
        >
          <div v-if="isExecuting" class="executing-content">
            <div class="spinner-border spinner-border-sm me-2"></div>
            <span>{{ executionStep }}</span>
          </div>
          <div v-else class="confirm-content">
            <i class="fa fa-exchange-alt me-1"></i>
            <span>Confirm Swap</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useKongStore } from '../../stores/kong.store'
import { useICPSwapStore } from '../../stores/icpswap.store'
import { useTacoStore } from '../../stores/taco.store'

interface Token {
  principal: string
  name: string
  symbol: string
  logo: string
  balance: bigint
  decimals: number
  fee: bigint
  priceUSD?: number
}

interface Quote {
  exchange: 'Kong' | 'ICPSwap'
  amountOut: bigint
  slippage: number
  price: number
  fee: number
  rawData: any
}

interface SwapData {
  inputToken: Token
  outputToken: Token
  amount: string
  selectedQuote: Quote
  slippageTolerance: number
}

interface SwapConfirmDialogProps {
  show: boolean
  swapData: SwapData | null
}

interface SwapConfirmDialogEmits {
  (e: 'close'): void
  (e: 'success', result: any): void
  (e: 'error', error: string): void
}

const props = defineProps<SwapConfirmDialogProps>()
const emit = defineEmits<SwapConfirmDialogEmits>()

// Stores
const kongStore = useKongStore()
const icpswapStore = useICPSwapStore()
const tacoStore = useTacoStore()

// State
const swapMethod = ref<'icrc2' | 'icrc1'>('icrc2')
const isExecuting = ref(false)
const executionStep = ref('')
const errorMessage = ref('')
const hasError = ref(false)

// Computed
const swapData = computed(() => props.swapData)

// Watch for dialog opening with new swap data and clear error state
watch([() => props.show, () => props.swapData], ([newShow, newSwapData], [oldShow, oldSwapData]) => {
  // Clear error when dialog opens or when swap data changes
  if (newShow && (!oldShow || newSwapData !== oldSwapData)) {
    hasError.value = false
    errorMessage.value = ''
  }
}, { immediate: true })

// Methods
const closeModal = () => {
  if (!isExecuting.value) {
    // Reset error state when closing
    hasError.value = false
    errorMessage.value = ''
    emit('close')
  }
}

const executeSwap = async () => {
  if (!swapData.value || isExecuting.value) return

  // Reset error state
  hasError.value = false
  errorMessage.value = ''
  
  isExecuting.value = true
  
  try {
    const { inputToken, outputToken, amount, selectedQuote } = swapData.value
    const amountIn = parseAmountToBigInt(amount, inputToken.decimals)
    
    // Use the user's selected slippage tolerance
    const userSlippageTolerance = swapData.value.slippageTolerance
    const minAmountOut = BigInt(Math.floor(Number(selectedQuote.amountOut) * (1 - userSlippageTolerance)))

    let result: any

    const swapParams = {
      sellTokenPrincipal: inputToken.principal,
      sellTokenSymbol: inputToken.symbol,
      buyTokenPrincipal: outputToken.principal,
      buyTokenSymbol: outputToken.symbol,
      amountIn,
      minAmountOut,
      slippageTolerance: userSlippageTolerance,
    }

    // Create a step update callback
    const updateStep = (step: string) => {
      executionStep.value = step
    }

    // Add step callback to swap params
    const swapParamsWithCallback = {
      ...swapParams,
      onStep: updateStep
    }

    if (selectedQuote.exchange === 'Kong') {
      if (swapMethod.value === 'icrc2') {
        executionStep.value = 'Starting ICRC2 swap...'
        result = await kongStore.icrc2_swap(swapParamsWithCallback)
      } else {
        executionStep.value = 'Starting ICRC1 swap...'
        result = await kongStore.icrc1_swap(swapParamsWithCallback)
      }
    } else {
      // ICPSwap
      if (swapMethod.value === 'icrc2') {
        executionStep.value = 'Starting ICRC2 swap...'
        result = await icpswapStore.icrc2_swap(swapParamsWithCallback)
      } else {
        executionStep.value = 'Starting ICRC1 swap...'
        result = await icpswapStore.icrc1_swap(swapParamsWithCallback)
      }
    }

    // Success
    emit('success', result)
    
  } catch (error: any) {
    console.error('Swap execution error:', error)
    
    // Show error in the dialog
    hasError.value = true
    errorMessage.value = error.message || 'Swap failed'
    
    // Also emit to parent for toast (but dialog stays open)
    emit('error', error.message || 'Swap failed')
  } finally {
    isExecuting.value = false
    executionStep.value = ''
  }
}

const parseAmountToBigInt = (amount: string, decimals: number): bigint => {
  const num = parseFloat(amount)
  if (isNaN(num)) return 0n
  
  const multiplier = BigInt(10 ** decimals)
  const wholePart = BigInt(Math.floor(num))
  const fractionalPart = num - Math.floor(num)
  const fractionalBigInt = BigInt(Math.round(fractionalPart * (10 ** decimals)))
  
  return wholePart * multiplier + fractionalBigInt
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

const getPriceImpactClass = (slippage: number): string => {
  if (slippage < 0.1) return 'impact-low'
  if (slippage < 1) return 'impact-medium'
  return 'impact-high'
}
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
  pointer-events: none;
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
  pointer-events: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.swap-summary {
  margin-bottom: 1.5rem;
}

.swap-route {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 12px;
  padding: 1.5rem;
}

.token-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.token-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.token-full-name {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.token-amount {
  text-align: center;
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  word-break: break-all;
}

.amount-symbol {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.swap-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 50%;
  color: white;
  font-size: 1.2rem;
}

.exchange-info {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.info-header h6 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.best-rate-badge {
  background: var(--success-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.impact-low {
  color: var(--success-color);
}

.impact-medium {
  color: var(--warning-color);
}

.impact-high {
  color: var(--danger-color);
}

.swap-method-section {
  margin-bottom: 1.5rem;
}

.method-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.method-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.method-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-option:hover {
  border-color: var(--primary-color);
}

.method-option.active {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.05);
}

.method-radio {
  margin-top: 0.25rem;
}

.method-content {
  flex: 1;
}

.method-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.method-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.warning-section {
  background: rgba(var(--warning-color-rgb), 0.1);
  border: 1px solid var(--warning-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--warning-color);
  line-height: 1.4;
}

.warning-item:not(:last-child) {
  margin-bottom: 0.75rem;
}

.warning-item.high-slippage {
  color: var(--danger-color);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.modal-footer .btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.executing-content,
.confirm-content {
  display: flex;
  align-items: center;
}

.error-section {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 0.5rem;
}

.error-details {
  flex: 1;
  min-width: 0;
}

.error-title {
  color: #e53e3e;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #2d3748;
  font-size: 0.85rem;
  margin: 0 0 0.5rem 0;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  background-color: #f7fafc;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
}

.error-hint {
  color: #718096;
  font-size: 0.75rem;
}

@media (max-width: 576px) {
  .modal-dialog {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .swap-route {
    flex-direction: column;
    gap: 1rem;
  }
  
  .swap-arrow {
    transform: rotate(90deg);
  }
  
  .token-amount {
    text-align: left;
  }
}
</style>
