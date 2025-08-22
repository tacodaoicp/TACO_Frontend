<template>
  <div class="token-card">
    <div class="token-header">
      <div class="token-info">
        <img :src="token.logo" :alt="token.symbol" class="token-logo" />
        <div class="token-details">
          <h6 class="token-name">{{ token.name }}</h6>
          <span class="token-symbol">{{ token.symbol }}</span>
        </div>
      </div>
      <div class="token-actions">
        <button 
          v-if="!token.isRegistered && showRegisterButton" 
          @click="$emit('register', token)"
          class="btn btn-outline-primary btn-sm"
          title="Add to wallet"
        >
          <i class="fa fa-plus"></i>
        </button>
        <button 
          v-if="token.isRegistered" 
          @click="$emit('unregister', token)"
          class="btn btn-outline-danger btn-sm"
          title="Remove from wallet"
        >
          <i class="fa fa-minus"></i>
        </button>
      </div>
    </div>
    
    <div class="token-balance">
      <div class="balance-amount">
        {{ formatBalance(token.balance, token.decimals) }}
        <span class="balance-symbol">{{ token.symbol }}</span>
      </div>
      <div v-if="token.priceUSD && token.priceUSD > 0" class="balance-usd">
        ${{ formatUSDValue(token.balance, token.decimals, token.priceUSD) }}
      </div>
    </div>
    
    <!-- Neurons section for TACO token -->
    <div v-if="token.symbol === 'TACO'" class="neurons-section">
      <div class="neurons-header">
        <h6 class="neurons-title">
          <i class="fa fa-brain me-2"></i>
          Neurons
        </h6>
        <div class="neurons-actions">
          <button 
            @click="$emit('create-neuron')"
            class="btn btn-outline-primary btn-sm me-2"
            title="Create new neuron"
          >
            <i class="fa fa-plus"></i>
          </button>
          <button 
            @click="loadNeurons"
            class="btn btn-outline-secondary btn-sm"
            :disabled="loadingNeurons"
            title="Refresh neurons"
          >
            <i class="fa fa-refresh" :class="{ 'fa-spin': loadingNeurons }"></i>
          </button>
        </div>
      </div>
      
      <div v-if="loadingNeurons" class="neurons-loading">
        <div class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-2">Loading neurons...</span>
      </div>
      
      <div v-else-if="neurons.length === 0" class="neurons-empty">
        <i class="fa fa-info-circle me-2"></i>
        <span>No neurons found</span>
      </div>
      
      <div v-else class="neurons-list">
        <div 
          v-for="neuron in neurons" 
          :key="neuron.idHex"
          class="neuron-item"
        >
          <div class="neuron-info">
            <div class="neuron-name">{{ neuron.displayName }}</div>
            <div class="neuron-stake">
              {{ formatBalance(neuron.stake, 8) }} TACO
            </div>
          </div>
          <button 
            @click="$emit('stake-to-neuron', neuron)"
            class="btn btn-primary btn-sm"
            title="Stake to this neuron"
          >
            <i class="fa fa-plus"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="token-footer">
      <button 
        @click="$emit('send', token)"
        class="btn btn-primary btn-send"
        :disabled="token.balance <= token.fee"
      >
        <i class="fa fa-paper-plane me-1"></i>
        Send
      </button>
      <div class="token-fee">
        Fee: {{ formatBalance(token.fee, token.decimals) }} {{ token.symbol }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

interface TokenCardProps {
  token: {
    principal: string
    name: string
    symbol: string
    logo: string
    balance: bigint
    decimals: number
    fee: bigint
    priceUSD?: number
    isRegistered?: boolean
  }
  showRegisterButton?: boolean
}

interface TokenCardEmits {
  (e: 'send', token: TokenCardProps['token']): void
  (e: 'register', token: TokenCardProps['token']): void
  (e: 'unregister', token: TokenCardProps['token']): void
  (e: 'stake-to-neuron', neuron: any): void
  (e: 'create-neuron'): void
}

const props = withDefaults(defineProps<TokenCardProps>(), {
  showRegisterButton: true
})

defineEmits<TokenCardEmits>()

// Taco store for neuron operations
const tacoStore = useTacoStore()

// Neurons state
const neurons = ref<any[]>([])
const loadingNeurons = ref(false)

// Load neurons for TACO token
const loadNeurons = async () => {
  if (!tacoStore.userLoggedIn || props.token.symbol !== 'TACO') {
    return
  }
  
  loadingNeurons.value = true
  try {
    const rawNeurons = await tacoStore.getTacoNeurons()
    neurons.value = rawNeurons.map(neuron => tacoStore.formatNeuronForDisplay(neuron))
  } catch (error) {
    console.error('Error loading neurons:', error)
    neurons.value = []
  } finally {
    loadingNeurons.value = false
  }
}

// Auto-load neurons on mount for TACO token
onMounted(() => {
  if (props.token.symbol === 'TACO' && tacoStore.userLoggedIn) {
    loadNeurons()
  }
})

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

const formatUSDValue = (balance: bigint, decimals: number, priceUSD: number): string => {
  const balanceNum = Number(balance) / (10 ** decimals)
  const usdValue = balanceNum * priceUSD
  
  if (usdValue < 0.01) {
    return '< 0.01'
  }
  
  return usdValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped>
.token-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.token-details {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.2;
}

.token-symbol {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
}

.token-actions {
  display: flex;
  gap: 0.5rem;
}

.token-actions .btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.token-balance {
  margin-bottom: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.balance-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.balance-symbol {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.balance-usd {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.token-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-send {
  width: 100%;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.token-fee {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  padding: 0.25rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

/* Neurons section styles */
.neurons-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.neurons-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.neurons-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.neurons-actions {
  display: flex;
  align-items: center;
}

.neurons-loading,
.neurons-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.neurons-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.neuron-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.neuron-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.neuron-info {
  flex-grow: 1;
}

.neuron-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.neuron-stake {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .token-card {
    background: var(--dark-card-bg, #2d3748);
    border-color: var(--dark-border-color, #4a5568);
  }
  
  .token-logo {
    border-color: var(--dark-border-color, #4a5568);
  }
  
  .token-fee {
    background: var(--dark-bg-secondary, #1a202c);
  }
}

/* Mobile responsiveness */
@media (max-width: 576px) {
  .token-card {
    padding: 1rem;
  }
  
  .token-name {
    font-size: 0.9rem;
  }
  
  .balance-amount {
    font-size: 1.1rem;
  }
  
  .token-logo {
    width: 36px;
    height: 36px;
  }
}
</style>