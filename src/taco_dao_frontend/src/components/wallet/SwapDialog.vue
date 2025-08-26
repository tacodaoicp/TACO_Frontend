<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-dialog" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="fa fa-exchange-alt me-2"></i>
          Swap Tokens
        </h5>
        <button @click="$emit('close')" class="btn-close">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Input Token Selection -->
        <div class="swap-section">
          <label class="section-label">From</label>
          <div class="token-input-group">
            <div class="token-selector" @click="showTokenSelector = true">
              <div v-if="selectedInputToken" class="selected-token">
                <img :src="selectedInputToken.logo" :alt="selectedInputToken.symbol" class="token-logo-small" />
                <div class="token-info">
                  <div class="token-name">{{ selectedInputToken.symbol }}</div>
                  <div class="token-balance">
                    Balance: {{ formatBalance(selectedInputToken.balance, selectedInputToken.decimals) }}
                  </div>
                </div>
              </div>
              <div v-else class="select-token-placeholder">
                <i class="fa fa-plus-circle me-2"></i>
                Select Token
              </div>
              <i class="fa fa-chevron-down"></i>
            </div>
            <div class="amount-input-wrapper">
              <input
                v-model="inputAmount"
                type="number"
                class="amount-input"
                placeholder="0.0"
                step="any"
                min="0"
                @input="onAmountChange"
              />
              <button 
                v-if="selectedInputToken"
                @click="setMaxAmount"
                class="max-button"
              >
                MAX
              </button>
            </div>
          </div>
          <!-- Token metadata info -->
          <div v-if="selectedInputToken" class="token-metadata">
            <div class="metadata-item">
              <span class="label">Decimals:</span>
              <span class="value">{{ selectedInputToken.decimals }}</span>
            </div>
            <div class="metadata-item">
              <span class="label">Fee:</span>
              <span class="value">{{ formatBalance(selectedInputToken.fee, selectedInputToken.decimals) }} {{ selectedInputToken.symbol }}</span>
            </div>
          </div>
        </div>

        <!-- Swap Arrow -->
        <div class="swap-arrow">
          <div class="arrow-circle">
            <i class="fa fa-arrow-down"></i>
          </div>
        </div>

        <!-- Output Token (Always TACO) -->
        <div class="swap-section">
          <label class="section-label">To</label>
          <div class="token-output-group">
            <div class="selected-token">
              <img :src="tacoToken.logo" :alt="tacoToken.symbol" class="token-logo-small" />
              <div class="token-info">
                <div class="token-name">{{ tacoToken.symbol }}</div>
                <div class="token-balance">
                  Balance: {{ formatBalance(tacoToken.balance, tacoToken.decimals) }}
                </div>
              </div>
            </div>
            <div class="expected-amount">
              <div class="amount-display">
                {{ expectedOutput || '0.0' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Quotes Section -->
        <div v-if="quotes.length > 0" class="quotes-section">
          <h6 class="quotes-title">Available Quotes</h6>
          <div class="quotes-list">
            <div 
              v-for="(quote, index) in sortedQuotes" 
              :key="quote.exchange"
              class="quote-item"
              :class="{ 'best-quote': index === 0 }"
              @click="selectQuote(quote)"
            >
              <div class="quote-header">
                <div class="exchange-info">
                  <div class="exchange-name">{{ quote.exchange }}</div>
                  <div v-if="index === 0" class="best-badge">Best Rate</div>
                </div>
                <div class="quote-amount">
                  {{ formatBalance(quote.amountOut, tacoToken.decimals) }} TACO
                </div>
              </div>
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

        <!-- Loading State -->
        <div v-if="loadingQuotes" class="loading-quotes">
          <div class="spinner-border spinner-border-sm me-2"></div>
          <span>Getting quotes...</span>
        </div>

        <!-- Error State -->
        <div v-if="quotesError" class="quotes-error">
          <i class="fa fa-exclamation-triangle me-2"></i>
          {{ quotesError }}
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancel
        </button>
        <button 
          @click="proceedWithSwap"
          class="btn btn-primary"
          :disabled="!canProceed"
        >
          <i class="fa fa-exchange-alt me-1"></i>
          Review Swap
        </button>
      </div>
    </div>

    <!-- Token Selector Modal -->
    <div v-if="showTokenSelector" class="token-selector-overlay" @click="showTokenSelector = false">
      <div class="token-selector-dialog" @click.stop>
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
  (e: 'confirm', data: { inputToken: Token; outputToken: Token; amount: string; selectedQuote: Quote }): void
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
const loadingQuotes = ref(false)
const quotesError = ref<string | null>(null)
const quoteTimeout = ref<NodeJS.Timeout | null>(null)

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
  const divisor = BigInt(10 ** decimals)
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
      amountOut: BigInt(result.receive_amount),
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
      amountOut: result.amountOut,
      slippage: result.slippage,
      price: result.effectivePrice,
      fee: result.fee,
      rawData: result
    }
  } catch (error) {
    console.error('ICPSwap quote error:', error)
    return null
  }
}

const selectQuote = (quote: Quote) => {
  // Visual feedback could be added here
  console.log('Selected quote:', quote)
}

const proceedWithSwap = () => {
  if (!canProceed.value || !selectedInputToken.value) return
  
  const bestQuote = sortedQuotes.value[0]
  
  emit('confirm', {
    inputToken: selectedInputToken.value,
    outputToken: tacoToken.value,
    amount: inputAmount.value,
    selectedQuote: bestQuote
  })
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
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
  color: var(--text-primary);
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

.swap-section {
  margin-bottom: 1rem;
}

.section-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.token-input-group {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.token-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-selector:hover {
  border-color: var(--primary-color);
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
  width: 32px;
  height: 32px;
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
  color: var(--text-primary);
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
  color: var(--text-primary);
  outline: none;
}

.amount-input::placeholder {
  color: var(--text-muted);
}

.max-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.max-button:hover {
  background: var(--primary-hover);
}

.token-metadata {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  margin: 1rem 0;
}

.arrow-circle {
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 1.2rem;
}

.token-output-group {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
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
  color: var(--text-primary);
}

.quotes-section {
  margin-top: 1.5rem;
}

.quotes-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quote-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quote-item:hover {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.05);
}

.quote-item.best-quote {
  border-color: var(--success-color);
  background: rgba(var(--success-color-rgb), 0.05);
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
  color: var(--text-primary);
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
  color: var(--text-primary);
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
}

.token-selector-dialog {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  max-height: 500px;
  overflow: hidden;
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
  color: var(--text-primary);
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
  
  .token-metadata {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
