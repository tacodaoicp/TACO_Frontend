<template>

  <div v-if="show" class="modal-overlay">

    <!-- modal dialog -->
    <div class="modal-dialog">

      <!-- modal header -->
      <div class="modal-header">

        <!-- modal title -->
        <div class="modal-title gap-2">

          <!-- icon -->
          <i class="swap-icon fa fa-exchange-alt me-2"></i>
          
          <!-- text -->
          <span class="swap-title-text">Taco Swap</span>

        </div>

        <!-- close button -->
        <button type="button" class="btn swap-btn-close" @click="$emit('close')">

          <!-- icon -->
          <i class="fa fa-times"></i>

        </button>

      </div>       

      <!-- modal body -->
      <div class="modal-body">

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

                <i class="fa fa-plus-circle me-2" style="font-size: 2.75rem;"></i>

                <span>Select Token</span>

              </div>

              <i class="fa fa-chevron-down"></i>

            </div>

            <!-- amount input group -->
            <div class="amount-input-wrapper">

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
                class="btn btn-link"
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
          <i class="fa fa-arrow-down" style="font-size: 2rem;"></i>

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

        <!-- quotes section -->
        <div v-if="quotes.length > 0" class="quotes-section">

          <!-- quotes title -->
          <h6 class="quotes-title">Available Quotes</h6>

          <!-- quotes list -->
          <div class="quotes-list">

            <!-- quote item -->
            <div 
              v-for="(quote, index) in sortedQuotes" 
              :key="quote.exchange"
              class="quote-item"
              :class="{
                'selected-quote': selectedQuote && selectedQuote.exchange === quote.exchange 
              }"
              @click="selectQuote(quote)">

              <!-- quote header -->
              <div class="quote-header">
                <div class="exchange-info">
                  <div class="exchange-name">{{ quote.exchange }}</div>
                  <div v-if="index === 0" class="best-badge">Best Rate</div>
                </div>
                <div class="quote-amount">
                  {{ formatBalance(quote.amountOut, tacoToken.decimals) }} TACO
                </div>
              </div>

              <!-- quote details -->
              <div class="quote-details">
                <div class="detail-item">
                  <span>Price Impact:</span>
                  <span :class="getPriceImpactClass(quote.slippage)">
                    {{ quote.slippage.toFixed(2) }}%
                  </span>
                </div>
                <div v-if="quote.exchange === 'Kong'" class="detail-item">
                  <span>Execution Price:</span>
                  <span>{{ quote.price.toFixed(6) }}</span>
                </div>
                <div v-if="quote.exchange === 'ICPSwap'" class="detail-item">
                  <span>Pool Fee:</span>
                  <span>{{ (quote.fee / 10000).toFixed(2) }}%</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- loading state -->
        <div v-if="loadingQuotes" class="loading-quotes">

          <div class="spinner-border spinner-border-sm me-2"></div>

          <span>Getting quotes...</span>

        </div>

        <!-- error state -->
        <div v-if="quotesError" class="quotes-error">

          <i class="fa fa-exclamation-triangle me-2"></i>

          <span>{{ quotesError }}</span>

        </div>

      </div>

      <!-- footer -->
      <div class="modal-footer">

        <!-- cancel button -->
        <button @click="$emit('close')" 
                class="btn"
                style="font-family: 'Space Mono';">
          
          <!-- text -->
          <span style="color: var(--black-to-white);">Cancel</span>

        </button>

        <!-- review swap button -->
        <button 
          @click="proceedWithSwap"
          class="btn taco-btn taco-btn--green"
          :disabled="!canProceed">
          
          <!-- text -->
          <span style="color: var(--black) !important;">Review Swap</span>

        </button>

      </div>

    </div>   

    <!-- token select modal -->
    <div v-if="showTokenSelector" class="token-selector-overlay">

      <div class="token-selector-dialog">
        <div class="token-selector-header">
          <h6>Select Token</h6>
          <button @click="showTokenSelector = false" class="btn-close">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <div class="token-list">
          <div 
            v-for="token in availableTokens" 
            :key="token.principal"
            class="token-list-item"
            @click="selectInputToken(token)"
          >
            <img :src="token.logo" :alt="token.symbol" class="token-logo-small" />
            <div class="token-info">
              <div class="token-name">{{ token.symbol }}</div>
              <div class="token-full-name">{{ token.name }}</div>
            </div>
            <div class="token-balance">
              {{ formatBalance(token.balance, token.decimals) }}
            </div>
          </div>
        </div>
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

.modal-body {
  padding: 1.5rem 1.5rem 0 !important;
}

.modal-title {
  display: flex;
  align-items: center;
  margin: 1.5rem 0px 0px 1.5rem;
}

.swap-icon {
  font-size: 3.5rem;
  color: var(--dark-brown-to-white) !important;
}

.swap-title-text {
  font-size: 1.5rem;
  font-weight: 600;
}

.swap-btn-close {
  margin: 1rem .5rem 0 0;

  i {
    font-size: 1.5rem;
    color: var(--black-to-white);
  }
}

.modal-body {
  padding: 1.5rem;
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
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
}

.token-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--light-brown);
  border: 1px solid var(--dark-orange);
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
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
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
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expected-amount {
  text-align: right;
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
  background-color: var(--dark-brown);
  border: none;
  outline: 1px solid var(--dark-orange);  
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quote-item:hover {
  /* border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.05); */
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.exchange-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.exchange-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.best-badge {
  background: var(--success-color);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
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

.modal-footer {
  border-top: none;
  padding: 1rem;
}

.modal-footer .btn {
  /* flex: 1;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px; */
}

/* Token Selector Modal */
.token-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
  pointer-events: none;
}

.token-selector-dialog {
  background: #2d3748;
  border-radius: 12px;
  border: 1px solid #4a5568;
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

.token-selector-header h6 {
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
  .modal-dialog {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
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

.quote-item {
  background: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quote-item:hover {
  border-color: #63b3ed;
  background: #2d3748;
}

.quote-item.best-quote {
  border-color: #48bb78;
  background: #1a2e1a;
}

.quote-item.selected-quote {
  outline: 3px solid var(--dark-orange);
  background: var(--brown);
  border: none;
  border-radius: 0.5rem;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
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

.best-badge {
  background: #48bb78;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
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
</style>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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

interface SwapDialogProps {
  show: boolean
  preselectedToken?: Token | null
  availableTokens: Token[]
}

interface SwapDialogEmits {
  (e: 'close'): void
  (e: 'confirm', data: { inputToken: Token; outputToken: Token; amount: string; selectedQuote: Quote; slippageTolerance: number }): void
}

const props = withDefaults(defineProps<SwapDialogProps>(), {
  preselectedToken: null
})

const emit = defineEmits<SwapDialogEmits>()

// Stores
const kongStore = useKongStore()
const icpswapStore = useICPSwapStore()
const tacoStore = useTacoStore()

// State
const selectedInputToken = ref<Token | null>(null)
const inputAmount = ref('')
const showTokenSelector = ref(false)
const quotes = ref<Quote[]>([])
const selectedQuote = ref<Quote | null>(null)
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
  return selectedInputToken.value && 
         inputAmount.value && 
         parseFloat(inputAmount.value) > 0 && 
         quotes.value.length > 0
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
  
  const maxAmount = selectedInputToken.value.balance - selectedInputToken.value.fee
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
    return
  }

  loadingQuotes.value = true
  quotesError.value = null
  quotes.value = []

  try {
    const amountIn = parseAmountToBigInt(inputAmount.value, selectedInputToken.value.decimals)
    
    // Fetch quotes from both exchanges in parallel
    const [kongQuote, icpswapQuote] = await Promise.allSettled([
      fetchKongQuote(amountIn),
      fetchICPSwapQuote(amountIn)
    ])

    const newQuotes: Quote[] = []

    // Process Kong quote
    if (kongQuote.status === 'fulfilled' && kongQuote.value) {
      newQuotes.push(kongQuote.value)
    }

    // Process ICPSwap quote  
    if (icpswapQuote.status === 'fulfilled' && icpswapQuote.value) {
      newQuotes.push(icpswapQuote.value)
    }

    quotes.value = newQuotes
    
    // Reset selected quote when new quotes are fetched
    selectedQuote.value = null

    if (newQuotes.length === 0) {
      quotesError.value = 'No quotes available for this token pair'
    }

  } catch (error) {
    console.error('Error fetching quotes:', error)
    quotesError.value = 'Failed to fetch quotes'
  } finally {
    loadingQuotes.value = false
  }
}

const fetchKongQuote = async (amountIn: bigint): Promise<Quote | null> => {
  try {
    if (!selectedInputToken.value) return null
    
    const result = await kongStore.getQuote({
      sellTokenSymbol: selectedInputToken.value.symbol,
      buyTokenSymbol: 'TACO',
      amountIn
    })

    return {
      exchange: 'Kong',
      amountOut: typeof result.receive_amount === 'bigint' ? result.receive_amount : BigInt(result.receive_amount),
      slippage: result.slippage,
      price: result.price,
      fee: 0, // Kong doesn't have separate pool fees
      rawData: result
    }
  } catch (error) {
    console.error('Kong quote error:', error)
    return null
  }
}

const fetchICPSwapQuote = async (amountIn: bigint): Promise<Quote | null> => {
  try {
    if (!selectedInputToken.value) return null
    
    const result = await icpswapStore.getQuote({
      sellTokenPrincipal: selectedInputToken.value.principal,
      buyTokenPrincipal: tacoToken.value.principal,
      amountIn
    })

    return {
      exchange: 'ICPSwap',
      amountOut: typeof result.amountOut === 'bigint' ? result.amountOut : BigInt(result.amountOut),
      slippage: result.slippage,
      price: result.effectivePrice,
      fee: typeof result.fee === 'bigint' ? Number(result.fee) : result.fee,
      rawData: result
    }
  } catch (error) {
    console.error('ICPSwap quote error:', error)
    return null
  }
}

const selectQuote = (quote: Quote) => {
  selectedQuote.value = quote
  console.log('Selected quote:', quote)
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
  if (!canProceed.value || !selectedInputToken.value) return
  
  // Use selected quote if available, otherwise fall back to best quote
  const quoteToUse = selectedQuote.value || sortedQuotes.value[0]
  
  emit('confirm', {
    inputToken: selectedInputToken.value,
    outputToken: tacoToken.value,
    amount: inputAmount.value,
    selectedQuote: quoteToUse,
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

// Cleanup timeout on unmount
onMounted(() => {
  return () => {
    if (quoteTimeout.value) {
      clearTimeout(quoteTimeout.value)
    }
  }
})
</script>