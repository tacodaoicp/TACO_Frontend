<template>

  <div v-if="show" class="taco-modal-overlay">

    <!-- modal dialog -->
    <div class="taco-modal-dialog">

      <!-- modal header -->
      <div class="taco-modal-header">

        <!-- modal title -->
        <div class="taco-modal-title gap-2">

          <!-- icon -->
          <i class="swap-icon fa fa-exchange-alt me-2"></i>

          <!-- text -->
          <span class="swap-title-text">Taco Swap</span>

        </div>

        <!-- close button -->
        <button type="button" class="btn taco-modal-close" @click="$emit('close')">

          <!-- icon -->
          <i class="fa fa-times"></i>

        </button>

      </div>

      <!-- modal body -->
      <div class="taco-modal-body">

        <!-- input token selection -->
        <div class="swap-section">

          <!-- label -->
          <label class="mb-2">

            <!-- text -->
            <span style="font-size: 1.25rem;">From</span>

          </label>

          <!-- token input group -->
          <div class="token-input-group">

            <!-- token selector -->
            <div class="token-selector" @click="showTokenSelector = true">

              <div v-if="selectedInputToken" class="selected-token">

                <img :src="selectedInputToken.logo" :alt="selectedInputToken.symbol" class="token-logo-small" />
                
                <div class="token-info">

                  <div class="token-name">

                    <span>{{ selectedInputToken.symbol }}</span>

                  </div>

                  <div class="token-balance">

                    <span>Balance: {{ formatBalance(selectedInputToken.balance, selectedInputToken.decimals) }}</span>

                  </div>

                </div>

              </div>

              <div v-else class="select-token-placeholder">

                <i class="fa fa-plus-circle me-2" style="font-size: 2.75rem; color: var(--dark-brown-to-white);"></i>

                <span>Select Token</span>

              </div>

              <i class="fa fa-chevron-down" style="color: var(--black-to-white);"></i>

            </div>

            <!-- amount input group -->
            <div class="amount-input-wrapper flex-wrap">

              <!-- amount input -->
              <input
                v-model="inputAmount"
                type="number"
                class="amount-input"
                placeholder="0.0"
                step="any"
                min="0"
                @input="onAmountChange"
              />

              <!-- max button -->
              <button 
                v-if="selectedInputToken"
                @click="setMaxAmount"
                class="btn btn-link ms-auto"
                style="color: var(--black-to-white);">
                
                <span>MAX</span>

              </button>

            </div>

          </div>

          <!-- token metadata -->
          <div v-if="selectedInputToken" class="token-metadata d-flex flex-wrap justify-content-end">

              <!-- decimals -->
              <span class="small w-fit-content text-end">Decimals: {{ selectedInputToken.decimals }}</span>

              <!-- fee -->
              <span class="small w-fit-content text-end">Fee: {{ formatBalance(selectedInputToken.fee, selectedInputToken.decimals) }} {{ selectedInputToken.symbol }}</span>

          </div>

        </div>

        <!-- swap arrow -->
        <div class="swap-arrow">

          <!-- icon -->
          <i class="fa fa-arrow-down" style="font-size: 2rem; color: var(--black-to-white);"></i>

        </div>

        <!-- output token (always TACO) -->
        <div class="swap-section">

          <!-- label -->
          <label class="mb-2">

            <!-- text -->
            <span style="font-size: 1.25rem;">To</span>

          </label>

          <!-- token output group -->
          <div class="token-output-group">

            <!-- selected token -->
            <div class="selected-token">

              <!-- logo -->
              <img :src="tacoToken.logo" :alt="tacoToken.symbol" class="token-logo-small" />

              <!-- token info -->
              <div class="token-info">

                <!-- name -->
                <div class="token-name">

                  <!-- text -->
                  <span>{{ tacoToken.symbol }}</span>

                </div>

                <!-- balance -->
                <div class="token-balance">

                  <!-- text -->
                  <span>Balance: {{ formatBalance(tacoToken.balance, tacoToken.decimals) }}</span>

                </div>

              </div>

            </div>

            <!-- expected amount -->
            <div class="expected-amount">

              <!-- amount display -->
              <div class="amount-display">

                <!-- text -->
                <span>{{ expectedOutput || '0.0' }}</span>

              </div>

            </div>

          </div>

        </div>

        <!-- slippage tolerance section -->
        <div class="slippage-section">

          <!-- label -->
          <label class="section-label mb-2">

            <!-- text -->
            <span style="font-size: 1.25rem;">Slippage Tolerance</span>

          </label>

          <!-- slippage controls -->
          <div class="slippage-controls">

            <!-- slippage presets -->
            <div class="slippage-presets">

              <!-- slippage presets -->
              <button 
                v-for="preset in slippagePresets" 
                :key="preset"
                @click="setSlippageTolerance(preset)"
                class="btn btn-sm taco-nav-btn"
                :class="{ 'taco-nav-btn--active': slippageTolerance === preset }">
                {{ (preset * 100).toFixed(1) }}%
              </button>

            </div>

            <!-- or -->
            <span>or</span>

            <!-- slippage custom -->
            <div class="slippage-custom">

              <!-- input -->
              <input
                v-model.number="customSlippage"
                @input="setCustomSlippage"
                type="number"
                class="form-control form-control-sm taco-input py-0"
                style="font-size: 0.925rem;"
                placeholder="0"
                min="0.1"
                max="50"
                step="0.1"
              />

              <!-- unit -->
              <span class="slippage-unit">%</span>

            </div>

          </div>

          <!-- slippage info -->
          <span style="line-height: 1; font-size: 0.75rem;">
            Higher slippage allows faster execution but worse prices
          </span>

        </div>

        <!-- execution plan section -->
        <div v-if="executionPlan" class="quotes-section">

          <!-- optimal route header -->
          <span class="d-inline-block mb-2" style="font-size: 1.25rem;">Optimal Route</span>

          <!-- optimal plan display -->
          <div class="quote-item selected-quote">

            <div class="quote-header">
              <div class="exchange-info">
                <div class="exchange-name">
                  <span v-if="executionPlan.type === 'single'">{{ executionPlan.legs[0].exchange }}</span>
                  <span v-else>Split Swap</span>
                </div>
                <div class="best-badge">
                  <i class="fa fa-star"></i>
                  <span class="text-nowrap">Best Return</span>
                </div>
              </div>
              <div class="quote-amount">
                <span>{{ formatBalance(executionPlan.totalExpectedOut, tacoToken.decimals) }} TACO</span>
              </div>
            </div>

            <div class="quote-details">
              <div v-for="leg in executionPlan.legs" :key="leg.exchange" class="detail-item">
                <span>{{ leg.exchange }} ({{ (leg.pctBP / 100).toFixed(0) }}%):</span>
                <span>{{ formatBalance(leg.expectedOut, tacoToken.decimals) }} TACO</span>
              </div>
              <div class="detail-item">
                <span>Slippage:</span>
                <span :class="getPriceImpactClass(executionPlan.totalSlipBP / 100)">
                  {{ (executionPlan.totalSlipBP / 100).toFixed(2) }}%
                </span>
              </div>
            </div>

          </div>

          <!-- single-exchange comparison -->
          <div v-if="quotes.length > 0" class="mt-2">
            <span class="d-inline-block mb-1" style="font-size: 0.85rem; opacity: 0.7;">Single-exchange comparison</span>
            <div class="quotes-list">
              <div v-for="quote in sortedQuotes" :key="quote.exchange" class="quote-item" style="padding: 0.5rem 0.75rem;">
                <div class="d-flex justify-content-between align-items-center">
                  <span style="font-size: 0.85rem;">{{ quote.exchange }} only</span>
                  <span style="font-size: 0.85rem;">{{ formatBalance(quote.amountOut, tacoToken.decimals) }} TACO</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- loading state -->
        <div v-if="loadingQuotes" class="loading-quotes">

          <div class="spinner-border spinner-border-sm me-2" style="color: var(--black-to-white);"></div>

          <span>Getting quotes...</span>

        </div>

        <!-- error state -->
        <div v-if="quotesError" class="quotes-error">

          <i class="fa fa-exclamation-triangle me-2"></i>

          <span>{{ quotesError }}</span>

        </div>

      </div>

      <!-- footer -->
      <div class="taco-modal-footer">

        <!-- review swap button -->
        <button
          @click="proceedWithSwap"
          class="btn taco-btn taco-btn--green"
          :disabled="!canProceed">
          Review Swap
        </button>

      </div>

    </div>   

    <!-- token select modal -->
    <div v-if="showTokenSelector" class="token-selector-overlay">

        <!-- token selector dialog -->
      <div class="token-selector-dialog">

        <!-- token selector header -->
        <div class="token-selector-header">

          <!-- title -->
          <span style="font-size: 1.5rem; font-weight: 600;">Select Token</span>

          <!-- close button -->
          <button @click="showTokenSelector = false" style="font-size: 1.5rem; color: var(--black-to-white);" class="btn">

            <!-- icon -->
            <i class="fa fa-times"></i>

          </button>

        </div>

        <!-- token list -->
        <div class="token-list">

          <!-- token list item -->
          <div 
            v-for="token in availableTokens" 
            :key="token.principal"
            class="token-list-item"
            @click="selectInputToken(token)"
          >

            <!-- token logo -->
            <img :src="token.logo" :alt="token.symbol" class="token-logo-small" />

            <!-- token info -->
            <div class="token-info">

              <!-- token name -->
              <div class="token-name">

                <span style="color: var(--black-to-white);">{{ token.symbol }}</span>
                
              </div>

              <!-- token full name -->
              <div class="token-full-name">

                <span style="color: var(--black-to-white);">{{ token.name }}</span>

              </div>

            </div>

            <!-- token balance -->
            <div class="token-balance">
              
              <!-- balance -->
              <span style="color: var(--black-to-white);">{{ formatBalance(token.balance, token.decimals) }}</span>

            </div>

          </div>
        </div>

      </div>

    </div>

  </div>

</template>

<style scoped>
:deep(.taco-modal-overlay) span {
  color: var(--black-to-white);
}

.swap-icon {
  font-size: 3.5rem;
  color: var(--gold) !important;
}

.swap-title-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gold) !important;
}

.swap-section {
  margin-top: -1rem;
  margin-bottom: 1rem;
}

.token-input-group {
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--card-mid-from), var(--card-mid-to));
  border: 1px solid var(--card-border);
}

.token-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.selected-token {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.select-token-placeholder {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.token-logo-small {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.token-balance {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.amount-input {
  min-width: 130px;
  width: 100%;
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--black-to-white);
  outline: none;
  font-family: 'Space Mono';
}

.amount-input::placeholder {
  color: var(--text-muted);
}

.token-metadata {
  display: flex;
  margin-top: 0.5rem;
  gap: 0 1rem;
}

.metadata-item {
  font-size: 0.8rem;
}

.metadata-item .label {
  color: var(--text-secondary);
}

.metadata-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.swap-arrow {
  display: flex;
  justify-content: center;
  margin: 0rem 0;
}

.token-output-group {
  background: linear-gradient(135deg, var(--card-mid-from), var(--card-mid-to));
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.expected-amount {
  text-align: right;
  margin-left: auto;
}

.amount-display {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

.quotes-section {
  margin-top: 1.5rem;
}

.quotes-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.75rem;
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quote-item {
  background: none;
  outline: 1px dashed var(--card-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
}

.quote-item.selected-quote {
  outline: 3px solid var(--card-border);
  background: linear-gradient(135deg, var(--card-mid-from), var(--card-mid-to));
  border: none;
  border-radius: 0.5rem;
}

.exchange-info {
  display: flex;
  gap: 0.5rem;
}

.exchange-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.best-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--yellow);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--black);

  i {
    color: var(--dark-orange);
  }
}

.quote-amount {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.quote-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
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

.loading-quotes {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.quotes-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(var(--danger-color-rgb), 0.1);
  border: 1px solid var(--danger-color);
  border-radius: 8px;
  color: var(--danger-color);
  font-size: 0.9rem;
}

/* Token Selector Modal */
.token-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
  pointer-events: none;
}

.token-selector-dialog {
  background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
  border-radius: 0.5rem;
  border: 2px solid var(--card-border);
  width: 90%;
  max-width: 400px;
  max-height: 500px;
  overflow: hidden;
  pointer-events: auto;
}

.token-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.token-selector-header {
  margin: 0;
  color: white;
  font-weight: 600;
}

.token-list {
  max-height: 400px;
  overflow-y: auto;
}

.token-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.token-list-item:hover {
  background: var(--bg-secondary);
}

.token-list-item .token-info {
  flex: 1;
}

.token-full-name {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

@media (max-width: 576px) {
  :deep(.taco-modal-dialog) {
    margin: 0.5rem;
    max-height: 95vh;
  }

  :deep(.taco-modal-header),
  :deep(.taco-modal-body),
  :deep(.taco-modal-footer) {
    padding: 1rem;
  }
}

/* Quote selection styles */
.quotes-section {
  margin-top: 1rem;
}

.quotes-title {
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.exchange-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.exchange-name {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.quote-amount {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.quote-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.quote-detail {
  color: #a0aec0;
}

.quotes-error {
  color: #fc8181;
  background: #2d1b1b;
  border: 1px solid #e53e3e;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.9rem;
  margin-top: 1rem;
}

/* Slippage tolerance styles */
.slippage-section {
  margin: 1rem 0;
}

.slippage-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  margin-bottom: 0.25rem;
}

.slippage-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.taco-nav-btn {
  padding: 0.25rem 0.5rem;
}

.slippage-preset-btn:hover {
  border-color: #63b3ed;
  background: #2d3748;
}

.slippage-preset-btn.active {
  background: #3182ce;
  border-color: #3182ce;
  color: white;
}

.slippage-custom {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.slippage-input {
  background: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 6px;
  color: white;
  padding: 0.5rem;
  width: 60px;
  font-size: 0.8rem;
  text-align: center;
}

.slippage-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
}

.slippage-unit {
  color: #a0aec0;
  font-size: 0.8rem;
}

.slippage-info {
  color: #a0aec0;
  font-size: 0.75rem;
}

.taco-nav-btn {
  color: var(--black-to-white);
  border-color: var(--black-to-white);
}
</style>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useKongStore } from '../../stores/kong.store'
import { useICPSwapStore } from '../../stores/icpswap.store'
import { useTacoStore } from '../../stores/taco.store'
import { useSplitSwap, type ExecutionPlan } from '../../composables/useSplitSwap'

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

interface SwapDialogProps {
  show: boolean
  preselectedToken?: Token | null
  availableTokens: Token[]
}

interface SwapDialogEmits {
  (e: 'close'): void
  (e: 'confirm', data: { inputToken: Token; outputToken: Token; amount: string; executionPlan: ExecutionPlan; slippageTolerance: number }): void
}

const props = withDefaults(defineProps<SwapDialogProps>(), {
  preselectedToken: null
})

const emit = defineEmits<SwapDialogEmits>()

// Stores
const kongStore = useKongStore()
const icpswapStore = useICPSwapStore()
const tacoStore = useTacoStore()
const splitSwap = useSplitSwap()

// State
const selectedInputToken = ref<Token | null>(null)
const inputAmount = ref('')
const showTokenSelector = ref(false)
const quotes = ref<Quote[]>([])
const selectedQuote = ref<Quote | null>(null)
const executionPlan = ref<ExecutionPlan | null>(null)
const loadingQuotes = ref(false)
const quotesError = ref<string | null>(null)
const quoteTimeout = ref<NodeJS.Timeout | null>(null)

// Slippage tolerance state
const slippageTolerance = ref(0.01) // 1% default
const customSlippage = ref('')
const slippagePresets = [0.001, 0.005, 0.01, 0.03] // 0.1%, 0.5%, 1%, 3%

// TACO token (always the output)
const tacoToken = computed<Token>(() => {
  const tacoTokenFromList = props.availableTokens.find(t => t.symbol === 'TACO')
  return tacoTokenFromList || {
    principal: 'kknbx-zyaaa-aaaaq-aae4a-cai',
    name: 'TACO DAO Token',
    symbol: 'TACO',
    logo: '/assets/tokens/taco.png',
    balance: 0n,
    decimals: 8,
    fee: 10000n,
    priceUSD: 0
  }
})

// Available tokens (excluding TACO for input selection)
const availableInputTokens = computed(() => {
  return props.availableTokens.filter(token => token.symbol !== 'TACO')
})

// All available tokens for the parent component to pass
const availableTokens = computed(() => props.availableTokens)

// Computed values
const expectedOutput = computed(() => {
  if (executionPlan.value) {
    return formatBalance(executionPlan.value.totalExpectedOut, tacoToken.value.decimals)
  }
  if (quotes.value.length === 0) return '0.0'
  const bestQuote = sortedQuotes.value[0]
  return formatBalance(bestQuote.amountOut, tacoToken.value.decimals)
})

const sortedQuotes = computed(() => {
  return [...quotes.value].sort((a, b) => {
    // Sort by amount out (descending - higher is better)
    if (a.amountOut > b.amountOut) return -1
    if (a.amountOut < b.amountOut) return 1
    return 0
  })
})

const canProceed = computed(() => {
  if (!selectedInputToken.value ||
      !inputAmount.value ||
      parseFloat(inputAmount.value) <= 0 ||
      !executionPlan.value) return false

  // Check user has sufficient balance (amount + 2 fees for approval + transfer)
  const amountBigInt = parseAmountToBigInt(inputAmount.value, selectedInputToken.value.decimals)
  const requiredBalance = amountBigInt + selectedInputToken.value.fee * 2n
  return amountBigInt > 0n && selectedInputToken.value.balance >= requiredBalance
})

// Methods
const closeModal = () => {
  emit('close')
}

const selectInputToken = (token: Token) => {
  selectedInputToken.value = token
  showTokenSelector.value = false
  if (inputAmount.value) {
    fetchQuotes()
  }
}

const setMaxAmount = () => {
  if (!selectedInputToken.value) return

  // Subtract 2 fees to account for:
  // 1. ICRC2 approval fee
  // 2. Transfer/deposit fee when the swap pulls tokens
  const maxAmount = selectedInputToken.value.balance - (selectedInputToken.value.fee * 2n)
  if (maxAmount <= 0n) {
    inputAmount.value = '0'
    return
  }

  const decimals = selectedInputToken.value.decimals
  const divisor = BigInt(Math.pow(10, decimals))
  const wholePart = maxAmount / divisor
  const fractionalPart = maxAmount % divisor

  if (fractionalPart === 0n) {
    inputAmount.value = wholePart.toString()
  } else {
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
    inputAmount.value = `${wholePart}.${fractionalStr}`
  }

  fetchQuotes()
}

const onAmountChange = () => {
  // Clear existing timeout
  if (quoteTimeout.value) {
    clearTimeout(quoteTimeout.value)
  }
  
  // Set new timeout to fetch quotes after 500ms of no typing
  quoteTimeout.value = setTimeout(() => {
    if (selectedInputToken.value && inputAmount.value && parseFloat(inputAmount.value) > 0) {
      fetchQuotes()
    } else {
      quotes.value = []
      quotesError.value = null
    }
  }, 500)
}

const fetchQuotes = async () => {
  if (!selectedInputToken.value || !inputAmount.value || parseFloat(inputAmount.value) <= 0) {
    quotes.value = []
    selectedQuote.value = null
    executionPlan.value = null
    return
  }

  loadingQuotes.value = true
  quotesError.value = null
  quotes.value = []
  executionPlan.value = null

  try {
    const amountIn = parseAmountToBigInt(inputAmount.value, selectedInputToken.value.decimals)

    // Use split-swap engine: fetches 10 quotes per DEX (20 total) in parallel,
    // evaluates all Kong/ICPSwap combinations, finds optimal split
    const plan = await splitSwap.findBestExecution(
      selectedInputToken.value.principal,
      selectedInputToken.value.symbol,
      tacoToken.value.principal,
      'TACO',
      amountIn,
      Math.round(slippageTolerance.value * 10000)  // convert 0.01 → 100 basis points
    )

    executionPlan.value = plan

    // Also populate legacy quotes array for display compatibility
    // Show 100% single-exchange quotes for comparison
    const newQuotes: Quote[] = []
    const kong100 = plan.quotes.kong[9]
    const icp100 = plan.quotes.icpswap[9]
    if (kong100.out > 0n) {
      newQuotes.push({
        exchange: 'Kong', amountOut: kong100.out,
        slippage: kong100.slipBP / 100, price: 0, fee: 0, rawData: null,
      })
    }
    if (icp100.out > 0n) {
      newQuotes.push({
        exchange: 'ICPSwap', amountOut: icp100.out,
        slippage: icp100.slipBP / 100, price: 0, fee: 0, rawData: null,
      })
    }
    quotes.value = newQuotes
    selectedQuote.value = null

  } catch (error: any) {
    console.error('Error fetching quotes:', error)
    quotesError.value = error.message || 'Failed to fetch quotes'
  } finally {
    loadingQuotes.value = false
  }
}

const selectQuote = (quote: Quote) => {
  selectedQuote.value = quote
  // console.log('Selected quote:', quote)
}

const setSlippageTolerance = (value: number) => {
  slippageTolerance.value = value
  customSlippage.value = '' // Clear custom input when preset is selected
}

const setCustomSlippage = () => {
  const value = parseFloat(customSlippage.value)
  if (!isNaN(value) && value >= 0.1 && value <= 50) {
    slippageTolerance.value = value / 100 // Convert percentage to decimal
  }
}

const proceedWithSwap = () => {
  if (!canProceed.value || !selectedInputToken.value || !executionPlan.value) return

  emit('confirm', {
    inputToken: selectedInputToken.value,
    outputToken: tacoToken.value,
    amount: inputAmount.value,
    executionPlan: executionPlan.value,
    slippageTolerance: slippageTolerance.value
  })
}

const parseAmountToBigInt = (amount: string, decimals: number): bigint => {
  const num = parseFloat(amount)
  if (isNaN(num)) return 0n
  
  // Convert to string with proper decimal places to avoid floating point precision issues
  const fixedAmount = num.toFixed(decimals)
  const [wholePart, fractionalPart = ''] = fixedAmount.split('.')
  
  // Pad fractional part to match decimals
  const paddedFractional = fractionalPart.padEnd(decimals, '0')
  
  // Combine whole and fractional parts as a single integer string
  const combinedString = wholePart + paddedFractional
  
  return BigInt(combinedString)
}

const formatBalance = (balance: bigint, decimals: number): string => {
  const divisor = BigInt(Math.pow(10, decimals))
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

// Watch for preselected token
watch(() => props.preselectedToken, (newToken) => {
  if (newToken && newToken.symbol !== 'TACO') {
    selectedInputToken.value = newToken
  }
}, { immediate: true })

// Method to clear all swap data
const clearSwapData = () => {
  selectedInputToken.value = null
  inputAmount.value = ''
  quotes.value = []
  selectedQuote.value = null
  executionPlan.value = null
  loadingQuotes.value = false
  quotesError.value = null
  slippageTolerance.value = 0.01 // reset to default
  customSlippage.value = ''
  showTokenSelector.value = false

  // clear any pending quote timeout
  if (quoteTimeout.value) {
    clearTimeout(quoteTimeout.value)
    quoteTimeout.value = null
  }
}

// Expose method to parent
defineExpose({
  clearSwapData
})

// Cleanup timeout on unmount
onMounted(() => {
  return () => {
    if (quoteTimeout.value) {
      clearTimeout(quoteTimeout.value)
    }
  }
})
</script>