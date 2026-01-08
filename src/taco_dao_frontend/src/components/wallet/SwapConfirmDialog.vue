<template>

  <div v-if="show && swapData" class="modal-overlay">

    <!-- modal dialog -->
    <div class="modal-dialog">

      <!-- modal header -->
      <div class="modal-header">

        <!-- modal title -->
        <div class="modal-title gap-2">

          <!-- icon -->
          <i class="confirm-icon fa fa-check-circle me-2"></i>
          
          <!-- text -->
          <span class="confirm-title-text">Confirm Swap</span>

        </div>

        <button type="button" class="btn confirm-btn-close" @click="closeModal">

          <!-- icon -->
          <i class="fa fa-times"></i>

        </button>

      </div>

      <!-- modal body -->
      <div class="modal-body">

        <!-- swap route -->
        <div class="swap-route">

          <!-- from token -->
          <div class="token-section">

            <!-- amount -->
            <span class="fw-bold" style="font-size: 1.5rem;">{{ swapData.amount }}</span>

            <div class="d-flex align-items-center gap-1">

              <!-- logo -->
              <img :src="swapData.inputToken.logo" :alt="swapData.inputToken.symbol" class="token-logo" />

              <!-- symbol -->
              <span>{{ swapData.inputToken.symbol }}</span>

            </div>

          </div>

          <!-- arrow -->
          <i class="direction-arrow fa fa-arrow-right" style="font-size: 1.5rem; color: var(--black-to-white);"></i>             

          <!-- to token -->
          <div class="token-section">  
            
            <!-- amount -->
            <span class="fw-bold" style="font-size: 1.5rem;">{{ formatBalance(swapData.selectedQuote.amountOut, swapData.outputToken.decimals) }}</span>

            <div class="d-flex align-items-center gap-1">

              <!-- logo -->
              <img :src="swapData.outputToken.logo" :alt="swapData.outputToken.symbol" class="token-logo" />

              <!-- symbol -->
              <span>{{ swapData.outputToken.symbol }}</span>

            </div>

          </div>

        </div>

        <!-- exchange info -->
        <div class="exchange-info d-flex flex-column mt-3 mb-3">

          <!-- exchange -->
          <div class="d-flex justify-content-between flex-wrap">

            <!-- label -->
            <span class="fw-bold">Exchange:</span>

            <!-- value -->
            <span class="ms-auto">

              <!-- exchange name -->
              <span>{{ swapData.selectedQuote.exchange }}</span>

            </span>

          </div>
          
          <!-- info details -->
          <div class="d-flex justify-content-between flex-wrap">

            <!-- label -->
            <span class="fw-bold">Price Impact:</span>

            <!-- value -->
            <span class="ms-auto">{{ swapData.selectedQuote.slippage.toFixed(2) }}%</span>

          </div>

          <!-- slippage tolerance -->
          <div class="d-flex justify-content-between flex-wrap">

            <!-- label -->
            <span class="fw-bold">Slippage Tolerance:</span>

            <!-- value -->
            <span class="ms-auto">
              {{ (swapData.slippageTolerance * 100).toFixed(1) }}%
            </span>

          </div>
          
          <!-- pool fee -->
          <div v-if="swapData.selectedQuote.exchange === 'ICPSwap'" class="d-flex justify-content-between flex-wrap">

            <!-- label -->
            <span class="fw-bold">Pool Fee:</span>

            <!-- value -->
            <span class="ms-auto">{{ (swapData.selectedQuote.fee / 10000).toFixed(2) }}%</span>

          </div>

          <!-- network fee -->
          <div class="d-flex justify-content-between flex-wrap">

            <!-- label -->
            <span class="fw-bold">Network Fee:</span>

            <!-- value -->
            <span class="ms-auto">
              {{ formatBalance(swapData.inputToken.fee, swapData.inputToken.decimals) }} {{ swapData.inputToken.symbol }}
            </span>

          </div>          

        </div>

        <!-- swap method title -->
        <span class="d-inline-flex mb-2 align-items-baseline gap-2" style="font-size: 1.25rem;">
          Swap Method
          <span v-if="swapData?.inputToken" class="small">
            (Auto-selected)
          </span>
        </span>

        <!-- method option -->
        <label class="method-option" :class="{ active: swapMethod === 'icrc2', disabled: !supportsICRC2 }">
          
          <!-- input -->
          <input 
            type="radio" 
            v-model="swapMethod" 
            value="icrc2" 
            class="method-radio"
            :disabled="!supportsICRC2"
          />

          <!-- method content -->
          <div class="method-content">

            <!-- method name -->
            <div class="method-name">

              <!-- text -->
              <span>ICRC2 (Recommended)</span>

              <!-- selected reason -->
              <span v-if="swapMethod === 'icrc2'" class="selected-reason">

                <!-- icon -->
                <i class="fa fa-check-circle ms-1"></i>

              </span>

            </div>

          </div>

        </label>
        
        <!-- method option -->
        <label class="method-option" :class="{ active: swapMethod === 'icrc1' }">
          
          <!-- input -->
          <input 
            type="radio" 
            v-model="swapMethod" 
            value="icrc1" 
            class="method-radio"
          />

          <!-- method content -->
          <div class="method-content">

            <!-- method name -->
            <div class="method-name">

              <!-- text -->
              <span>ICRC1</span>

              <!-- selected reason -->
              <span v-if="swapMethod === 'icrc1'" class="selected-reason">

                <!-- icon -->
                <i class="fa fa-check-circle ms-1"></i>

              </span>

            </div>

          </div>

        </label>

        <!-- slippage warning -->
        <div v-if="swapData.selectedQuote.slippage > 1" class="alert mb-0 mt-3 px-3 py-2"
        style="background-color: var(--red);">

          <!-- icon -->
          <i class="fa fa-exclamation-triangle me-2" style="color: var(--white) !important;"></i>

          <!-- text -->
          <span style="color: var(--white) !important;">High price impact ({{ swapData.selectedQuote.slippage.toFixed(2) }}%). Consider reducing your swap amount.</span>

        </div>

        <!-- error display -->
        <div v-if="hasError" class="alert mb-0 mt-3 px-3 py-2"
        style="background-color: var(--red);">

            <!-- icon -->
          <i class="fa fa-exclamation-triangle me-2" style="color: var(--white) !important;"></i>

          <!-- text -->
          <span style="color: var(--white) !important;">Swap Failed: {{ errorMessage }}</span>

        </div>

      </div>

      <!-- modal footer -->
      <div class="modal-footer">

        <!-- cancel button -->
        <button @click="closeModal" 
        class="btn"
        style="font-family: 'Space Mono';"
        :disabled="isExecuting">

          <!-- text -->
          <span style="color: var(--black-to-white);">Cancel</span>

        </button>

        <!-- confirm button -->
        <button 
          @click="executeSwap"
          class="btn taco-btn taco-btn--green"
          :disabled="isExecuting"
        >

          <!-- text -->
          <span v-if="!isExecuting" style="color: var(--black) !important;">Confirm Swap</span>

          <!-- executing text -->
          <span v-if="isExecuting">{{ executionStep }}</span>        

        </button>
        
      </div>

    </div>

  </div>

</template>

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
  background-color: var(--light-orange-to-dark-brown);
  border: 1px solid var(--dark-orange);
  border-radius: .5rem;
  overflow: clip;
  max-width: 500px;
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
  margin-bottom: 0.5rem;
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
  font-size: 3.5rem;
  color: var(--dark-brown-to-white) !important;
}

.confirm-title-text {
  font-size: 1.5rem;
  font-weight: 600;
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

.swap-summary {
  /* margin-bottom: 1.5rem; */
}

.swap-route {
  background: var(--orange-to-brown);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  /* gap: 1rem; */
  border: 1px solid var(--dark-orange);
  border-radius: 12px;
  padding: 0.5rem 1rem 0.75rem;
}

.token-section {
  /* flex: 1; */
  display: flex;
  flex-direction: column;
}

.token-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-logo {
  width: 1.25rem;
  height: 1.25rem;
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
  /* text-align: center; */
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  /* word-break: break-all; */
  white-space: nowrap;
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
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  overflow: clip;

  > div {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--dark-orange);

    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background-color: var(--dark-orange);
    }

  }

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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auto-selected-badge {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

.auto-reason {
  display: block;
  font-size: 0.8rem;
  color: var(--text-success);
  font-weight: 500;
  margin-top: 0.25rem;
}

.selected-reason {
  display: inline-flex;
  align-items: center;
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
  /* padding: 1rem; */
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

.method-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-tertiary);
}

.method-option.disabled:hover {
  border-color: var(--border-color);
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

.not-supported-text {
  color: var(--text-muted);
  font-style: italic;
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
  border-top: none;
  padding: 1rem;

  .btn:active {
    border-color: transparent;
  }
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
    align-items: center;
    gap: 1rem;
  }

  .token-section {
    align-items: center;
  }
  
  .swap-arrow {
    transform: rotate(90deg);
  }
  
  .token-amount {
    text-align: center;
    align-items: center;
  }

  .direction-arrow {
    transform: rotate(90deg);
  }

}
</style>

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
const supportsICRC2 = ref(true)
const isExecuting = ref(false)
const executionStep = ref('')
const errorMessage = ref('')
const hasError = ref(false)

// Computed
const swapData = computed(() => props.swapData)

// Watch for dialog opening with new swap data and clear error state
watch([() => props.show, () => props.swapData], async ([newShow, newSwapData], [oldShow, oldSwapData]) => {
  // debug logging
  // console.log('SwapConfirmDialog watcher fired:', { newShow, oldShow, newSwapData: !!newSwapData, oldSwapData: !!oldSwapData })
  
  // Clear error when dialog opens or when swap data changes
  if (newShow && (!oldShow || newSwapData !== oldSwapData)) {
    // console.log('SwapConfirmDialog watcher condition met')
    hasError.value = false
    errorMessage.value = ''
    
    // Auto-select swap method based on token standards
    if (newSwapData?.inputToken) {
      try {
        // console.log('Checking ICRC2 support for token:', newSwapData.inputToken.principal)
        const tokenSupportsICRC2 = await tacoStore.checkTokenSupportsICRC2(newSwapData.inputToken.principal)
        // console.log('Token supports ICRC2:', tokenSupportsICRC2)
        
        // Update ICRC2 support state
        supportsICRC2.value = tokenSupportsICRC2
        
        // Auto-select ICRC2 if supported, otherwise ICRC1
        swapMethod.value = tokenSupportsICRC2 ? 'icrc2' : 'icrc1'
        // console.log('Auto-selected swap method:', swapMethod.value)
      } catch (error) {
        console.error('Error checking token standards, defaulting to ICRC1:', error)
        supportsICRC2.value = false
        swapMethod.value = 'icrc1' // Default to ICRC1 if check fails
      }
    }
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

  // log
  // console.log('Executing swap')

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