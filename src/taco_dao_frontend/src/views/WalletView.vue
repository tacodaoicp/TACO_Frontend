<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        
        <!-- page title -->
        <div class="page-title">
          <h1>Wallet</h1>
          <p class="text-muted">Manage your tokens and send transactions</p>
        </div>

        <!-- loading state -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading wallet...</p>
        </div>

        <!-- login required state -->
        <div v-else-if="!tacoStore.userLoggedIn" class="text-center py-5">
          <div class="card">
            <div class="card-body py-5">
              <i class="fa fa-lock fa-4x text-muted mb-4"></i>
              <h3 class="mb-3">Login Required</h3>
              <p class="text-muted mb-4">You need to log in to view and manage your wallet.</p>
              <button 
                @click="tacoStore.iidLogIn()" 
                class="btn btn-primary btn-lg"
              >
                <i class="fa fa-sign-in-alt me-2"></i>
                Login with Internet Identity
              </button>
            </div>
          </div>
        </div>

        <!-- wallet content -->
        <div v-else>
          
          <!-- Core Tokens Section -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Core Tokens</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div v-for="token in coreTokens" :key="token.principal" class="col-md-6 col-lg-4 mb-3">
                  <TokenCard 
                    :token="token" 
                    @send="openSendDialog"
                    @swap="openSwapDialog" 

                    @unregister="unregisterToken"
                          @stake-to-neuron="handleStakeToNeuron"
      @create-neuron="handleCreateNeuron"
      @set-dissolve="handleSetDissolve"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Trusted Tokens Section -->
          <div class="card mb-4" v-if="trustedTokens.length > 0">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Trusted Tokens</h5>
              <small class="text-muted">{{ trustedTokens.length }} tokens</small>
            </div>
            <div class="card-body">
              <div class="row">
                <div v-for="token in trustedTokens" :key="token.principal" class="col-md-6 col-lg-4 mb-3">
                  <TokenCard 
                    :token="token" 
                    @send="openSendDialog"
                    @swap="openSwapDialog"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Register Custom Token Section -->
          <div>
            <h3>Register Custom ICRC1 Token</h3>
            <p>Enter the principal of an ICRC1 token to add it to your wallet:</p>
            <div>
              <input 
                v-model="newTokenPrincipal"
                placeholder="Token principal (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)"
                style="width: 400px; padding: 8px; margin-right: 10px;"
              />
              <button 
                @click="registerCustomToken" 
                :disabled="!newTokenPrincipal.trim() || registeringToken"
                style="padding: 8px 16px;"
              >
                {{ registeringToken ? 'Registering...' : 'Register Token' }}
              </button>
            </div>
            <br>
          </div>

          <!-- User Registered Tokens Section -->
          <div class="card mb-4" v-if="userRegisteredTokens.length > 0">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Your Registered Tokens</h5>
              <small class="text-muted">{{ userRegisteredTokens.length }} tokens</small>
            </div>
            <div class="card-body">
              <div class="row">
                <div v-for="token in userRegisteredTokens" :key="token.principal" class="col-md-6 col-lg-4 mb-3">
                  <TokenCard 
                    :token="token" 
                    @send="openSendDialog"
                    @swap="openSwapDialog"

                    @unregister="unregisterToken"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state for user registered tokens -->
          <div class="card" v-if="userRegisteredTokens.length === 0">
            <div class="card-header">
              <h5 class="mb-0">Your Registered Tokens</h5>
            </div>
            <div class="card-body text-center py-5">
              <i class="fa fa-plus-circle fa-3x text-muted mb-3"></i>
              <h6 class="text-muted">No registered tokens yet</h6>
              <p class="text-muted">Register ICRC1 tokens using the form above to track and manage them in your wallet</p>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Send Token Dialog -->
    <SendTokenDialog 
      :show="showSendDialog"
      :token="selectedToken"
      @close="closeSendDialog"
      @send="handleSendToken"
    />

    <!-- Stake to Neuron Dialog -->
    <StakeToNeuronDialog
      :show="showStakeDialog"
      :neuron="selectedNeuron"
      :taco-balance="getTacoBalance()"
      @close="closeStakeDialog"
      @staked="handleStakeCompleted"
    />

    <!-- Create Neuron Dialog -->
    <CreateNeuronDialog
      :show="showCreateDialog"
      :taco-balance="getTacoBalance()"
      @close="closeCreateDialog"
      @created="handleNeuronCreated"
    />

    <!-- Set Dissolve Dialog -->
    <SetDissolveDialog
      :show="showDissolveDialog"
      :neuron="selectedNeuron"
      @close="closeDissolveDialog"
      @dissolve-set="handleDissolveSet"
    />

    <!-- Swap Dialog -->
    <SwapDialog
      :show="showSwapDialog"
      :preselected-token="selectedTokenForSwap"
      :available-tokens="allTokens"
      @close="closeSwapDialog"
      @confirm="handleSwapConfirm"
    />

    <!-- Swap Confirm Dialog -->
    <SwapConfirmDialog
      :show="showSwapConfirmDialog"
      :swap-data="swapConfirmData"
      @close="closeSwapConfirmDialog"
      @success="handleSwapSuccess"
      @error="handleSwapError"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { Principal } from '@dfinity/principal'
import TokenCard from '../components/wallet/TokenCard.vue'
import SendTokenDialog from '../components/wallet/SendTokenDialog.vue'
import SwapDialog from '../components/wallet/SwapDialog.vue'
import SwapConfirmDialog from '../components/wallet/SwapConfirmDialog.vue'
import StakeToNeuronDialog from '../components/wallet/StakeToNeuronDialog.vue'
import CreateNeuronDialog from '../components/wallet/CreateNeuronDialog.vue'
import SetDissolveDialog from '../components/wallet/SetDissolveDialog.vue'
import { tokenImages } from '../components/data/TokenData'

interface WalletToken {
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

const tacoStore = useTacoStore()

// State
const loading = ref(true)
const showSendDialog = ref(false)
const selectedToken = ref<WalletToken | null>(null)
const showStakeDialog = ref(false)
const selectedNeuron = ref<any | null>(null)
const showCreateDialog = ref(false)
const showDissolveDialog = ref(false)
const showSwapDialog = ref(false)
const showSwapConfirmDialog = ref(false)
const selectedTokenForSwap = ref<WalletToken | null>(null)
const swapConfirmData = ref<any | null>(null)
const allTokenBalances = ref<Map<string, bigint>>(new Map())
const userRegisteredTokenPrincipals = ref<string[]>([])
const customTokenMetadata = ref<Map<string, any>>(new Map())
const newTokenPrincipal = ref('')
const registeringToken = ref(false)

// Core tokens (ICP and TACO)
const coreTokens = computed<WalletToken[]>(() => {
  const tokens: WalletToken[] = []
  
  // ICP Token
  const icpPrincipal = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
  tokens.push({
    principal: icpPrincipal,
    name: 'Internet Computer',
    symbol: 'ICP',
    logo: tokenImages['Internet Computer'] || tokenImages['Default'],
    balance: allTokenBalances.value.get(icpPrincipal) || 0n,
    decimals: 8,
    fee: 10000n, // 0.0001 ICP
    priceUSD: tacoStore.icpPriceUsd || 0,
    isRegistered: false
  })

  // TACO Token
  const tacoPrincipal = 'kknbx-zyaaa-aaaaq-aae4a-cai'
  tokens.push({
    principal: tacoPrincipal,
    name: 'TACO DAO Token',
    symbol: 'TACO',
    logo: tokenImages['TACO'] || tokenImages['Default'],
    balance: allTokenBalances.value.get(tacoPrincipal) || 0n,
    decimals: 8,
    fee: 10000n, // 0.0001 TACO
    priceUSD: tacoStore.tacoPriceUsd || 0,
    isRegistered: false
  })

  return tokens
})

// Trusted tokens (excluding core tokens)
const trustedTokens = computed<WalletToken[]>(() => {
  const coreTokenPrincipals = new Set(coreTokens.value.map(t => t.principal))
  const userRegisteredPrincipals = new Set(userRegisteredTokenPrincipals.value)
  
  return tacoStore.fetchedTokenDetails
    .filter((entry) => {
      const principal = entry[0]
      const details = entry[1]
      return !coreTokenPrincipals.has(principal.toString()) && 
             !userRegisteredPrincipals.has(principal.toString()) &&
             details.Active && 
             !details.isPaused
    })
    .map((entry) => {
      const principal = entry[0]
      const details = entry[1]
      return {
      principal: principal.toString(),
      name: details.tokenName,
      symbol: details.tokenSymbol,
      logo: tokenImages[details.tokenName] || tokenImages['Default'],
      balance: allTokenBalances.value.get(principal.toString()) || 0n,
      decimals: Number(details.tokenDecimals),
      fee: details.tokenTransferFee,
        priceUSD: parseFloat(details.priceInUSD) || 0,
        isRegistered: false
      }
    })
})

// User registered tokens
const userRegisteredTokens = computed<WalletToken[]>(() => {
  const tokenDetailsMap = new Map(tacoStore.fetchedTokenDetails.map((entry) => [entry[0].toString(), entry[1]]))
  
  return userRegisteredTokenPrincipals.value
    .map(principal => {
      const details = tokenDetailsMap.get(principal)
      
      // If token is in trusted tokens, use those details
      if (details) {
        return {
          principal,
          name: details.tokenName,
          symbol: details.tokenSymbol,
          logo: tokenImages[details.tokenName] || tokenImages['Default'],
          balance: allTokenBalances.value.get(principal) || 0n,
          decimals: Number(details.tokenDecimals),
          fee: details.tokenTransferFee,
          priceUSD: parseFloat(details.priceInUSD) || 0,
          isRegistered: true
        }
      }
      
      // For custom ICRC1 tokens not in trusted list, use cached metadata or defaults
      const metadata = customTokenMetadata.value.get(principal)
      return {
        principal,
        name: metadata?.name || `Custom Token (${principal.slice(0, 5)}...)`,
        symbol: metadata?.symbol || 'UNKNOWN',
        logo: metadata?.logo || tokenImages['Default'],
        balance: allTokenBalances.value.get(principal) || 0n,
        decimals: metadata?.decimals || 8,
        fee: metadata?.fee || 10000n,
        priceUSD: 0, // Custom tokens don't have price data
        isRegistered: true
      }
    })
})

// All tokens for swap dialog
const allTokens = computed<WalletToken[]>(() => {
  return [
    ...coreTokens.value,
    ...trustedTokens.value,
    ...userRegisteredTokens.value
  ]
})

// Methods
const loadWalletData = async () => {
  try {
    loading.value = true
    
    // Load token details and user registered tokens
    await Promise.all([
      tacoStore.fetchTokenDetails(),
      fetchUserRegisteredTokens()
    ])
    
    // Load balances for all tokens
    await loadAllBalances()
    
  } catch (error) {
    console.error('Error loading wallet data:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'wallet-error',
      title: 'Error',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to load wallet data'
    })
  } finally {
    loading.value = false
  }
}

const fetchUserRegisteredTokens = async () => {
  try {
    const registeredTokens = await tacoStore.getUserRegisteredTokens()
    userRegisteredTokenPrincipals.value = registeredTokens.map(p => p.toString())
    
    // Load metadata for custom tokens
    await loadCustomTokenMetadata()
  } catch (error) {
    console.error('Error fetching user registered tokens:', error)
    userRegisteredTokenPrincipals.value = []
  }
}

const loadCustomTokenMetadata = async () => {
  console.log('Loading custom token metadata for:', userRegisteredTokenPrincipals.value)
      const tokenDetailsMap = new Map(tacoStore.fetchedTokenDetails.map((entry) => [entry[0].toString(), entry[1]]))
  
  // Load metadata for tokens not in trusted list
  for (const principal of userRegisteredTokenPrincipals.value) {
    console.log(`Processing token: ${principal}`)
    if (!tokenDetailsMap.has(principal)) {
      console.log(`Token ${principal} not in trusted list, loading custom metadata`)
      try {
        // Clear cache and fetch fresh metadata to get real ICRC1 data
        console.log(`Clearing cache and fetching fresh metadata for ${principal}`)
        tacoStore.clearTokenMetadataCache(principal)
        const metadata = await tacoStore.fetchTokenMetadata(principal)
        console.log(`Fetched fresh metadata for ${principal}:`, metadata)
        customTokenMetadata.value.set(principal, metadata)
      } catch (error) {
        console.error(`Error loading metadata for token ${principal}:`, error)
        // Set default metadata
        const defaultMetadata = {
          name: `Custom Token (${principal.slice(0, 5)}...)`,
          symbol: 'UNKNOWN',
          decimals: 8,
          fee: 10000n,
          logo: null
        }
        customTokenMetadata.value.set(principal, defaultMetadata)
        console.log(`Set default metadata for ${principal}:`, defaultMetadata)
      }
    } else {
      console.log(`Token ${principal} is in trusted list, skipping`)
    }
  }
  console.log('Final customTokenMetadata:', customTokenMetadata.value)
}

const loadAllBalances = async () => {
  const allTokens = [
    ...coreTokens.value,
    ...trustedTokens.value,
    ...userRegisteredTokens.value
  ]
  
  const balancePromises = allTokens.map(async (token) => {
    try {
      const balance = await tacoStore.fetchUserTokenBalance(token.principal, token.decimals)
      allTokenBalances.value.set(token.principal, balance)
    } catch (error) {
      console.error(`Error fetching balance for ${token.symbol}:`, error)
      allTokenBalances.value.set(token.principal, 0n)
    }
  })
  
  await Promise.all(balancePromises)
}

const openSendDialog = (token: WalletToken) => {
  selectedToken.value = token
  showSendDialog.value = true
}

const closeSendDialog = () => {
  showSendDialog.value = false
  selectedToken.value = null
}

const handleSendToken = async (params: { recipient: string; amount: bigint; memo?: string }) => {
  if (!selectedToken.value) return
  
  try {
    await tacoStore.sendToken(
      selectedToken.value.principal,
      params.recipient,
      params.amount,
      selectedToken.value.fee,
      params.memo
    )
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'send-success',
      title: 'Transaction Sent',
      icon: 'fa-solid fa-check',
      message: `Successfully sent ${params.amount} ${selectedToken.value.symbol}`
    })
    
    // Refresh balance
    const newBalance = await tacoStore.fetchUserTokenBalance(
      selectedToken.value.principal, 
      selectedToken.value.decimals
    )
    allTokenBalances.value.set(selectedToken.value.principal, newBalance)
    
    closeSendDialog()
  } catch (error) {
    console.error('Error sending token:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'send-error',
      title: 'Transaction Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to send token'
    })
  }
}



const unregisterToken = async (token: WalletToken) => {
  try {
    await tacoStore.unregisterUserToken(token.principal)
    tacoStore.addToast({
      id: Date.now(),
      code: 'unregister-success',
      title: 'Token Unregistered',
      icon: 'fa-solid fa-check',
      message: `${token.symbol} removed from your wallet`
    })
    await fetchUserRegisteredTokens() // Refresh
  } catch (error) {
    console.error('Error unregistering token:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'unregister-error',
      title: 'Unregistration Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to unregister token'
    })
  }
}

const handleStakeToNeuron = (neuron: any) => {
  console.log('Stake to neuron:', neuron)
  selectedNeuron.value = neuron
  showStakeDialog.value = true
}

const closeStakeDialog = () => {
  showStakeDialog.value = false
  selectedNeuron.value = null
}

const handleStakeCompleted = async (neuron: any) => {
  console.log('Staking completed for neuron:', neuron)
  // Refresh wallet data to show updated balances
  await loadWalletData()
}

const getTacoBalance = (): bigint => {
  const tacoPrincipal = 'kknbx-zyaaa-aaaaq-aae4a-cai'
  return allTokenBalances.value.get(tacoPrincipal) || 0n
}

const handleCreateNeuron = () => {
  console.log('Create neuron clicked')
  showCreateDialog.value = true
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
}

const handleNeuronCreated = async () => {
  console.log('Neuron created successfully')
  // Refresh wallet data to show updated balances
  await loadWalletData()
}

// Dissolve dialog handlers
const handleSetDissolve = (neuron: any) => {
  selectedNeuron.value = neuron
  showDissolveDialog.value = true
}

const closeDissolveDialog = () => {
  showDissolveDialog.value = false
  selectedNeuron.value = null
}

const handleDissolveSet = () => {
  // Refresh the wallet data to show updated neuron info
  loadWalletData()
}

const registerCustomToken = async () => {
  if (!newTokenPrincipal.value.trim()) return
  
  try {
    registeringToken.value = true
    
    // Validate principal format
    try {
      Principal.fromText(newTokenPrincipal.value.trim())
    } catch (error) {
      tacoStore.addToast({
        id: Date.now(),
        code: 'invalid-principal',
        title: 'Invalid Principal',
        icon: 'fa-solid fa-exclamation-triangle',
        message: 'Please enter a valid principal ID'
      })
      return
    }
    
    // Check if token is already registered
    if (userRegisteredTokenPrincipals.value.includes(newTokenPrincipal.value.trim())) {
      tacoStore.addToast({
        id: Date.now(),
        code: 'already-registered',
        title: 'Already Registered',
        icon: 'fa-solid fa-exclamation-triangle',
        message: 'This token is already in your wallet'
      })
      return
    }
    
    // Register the token
    await tacoStore.registerUserToken(newTokenPrincipal.value.trim())
    
    // Clear input and refresh
    const registeredPrincipal = newTokenPrincipal.value.trim()
    newTokenPrincipal.value = ''
    
    // Refresh registered tokens list
    await fetchUserRegisteredTokens()
    
    // Load balance for the new token
    await loadAllBalances()
    
    // Get the metadata for the registered token for the toast
    const metadata = customTokenMetadata.value.get(registeredPrincipal)
    const tokenName = metadata?.symbol || 'Custom Token'
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'register-success',
      title: 'Token Registered',
      icon: 'fa-solid fa-check',
      message: `${tokenName} added to your wallet`
    })
    
  } catch (error) {
    console.error('Error registering custom token:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'register-error',
      title: 'Registration Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to register custom token'
    })
  } finally {
    registeringToken.value = false
  }
}

// Swap-related methods
const openSwapDialog = (token: WalletToken) => {
  selectedTokenForSwap.value = token.symbol === 'TACO' ? null : token
  showSwapDialog.value = true
}

const closeSwapDialog = () => {
  showSwapDialog.value = false
  selectedTokenForSwap.value = null
}

const handleSwapConfirm = (swapData: any) => {
  swapConfirmData.value = swapData
  showSwapDialog.value = false
  showSwapConfirmDialog.value = true
}

const closeSwapConfirmDialog = () => {
  showSwapConfirmDialog.value = false
  swapConfirmData.value = null
}

const handleSwapSuccess = async (result: any) => {
  console.log('Swap successful:', result)
  
  // Close the confirm dialog
  closeSwapConfirmDialog()
  
  // Show success message
  tacoStore.addToast({
    id: Date.now(),
    code: 'swap-success',
    title: 'Swap Successful',
    icon: 'fa-solid fa-check',
    message: `Successfully swapped to TACO`
  })
  
  // Refresh wallet data to show updated balances
  await loadWalletData()
}

const handleSwapError = (error: string) => {
  console.error('Swap failed:', error)
  
  // Show error message
  tacoStore.addToast({
    id: Date.now(),
    code: 'swap-error',
    title: 'Swap Failed',
    icon: 'fa-solid fa-exclamation-triangle',
    message: error
  })
}

// Lifecycle
onMounted(async () => {
  try {
    // Wait for authentication to be checked first
    await tacoStore.checkIfLoggedIn()
    
    // Small delay to ensure state is fully updated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (tacoStore.userLoggedIn) {
      console.log('User is logged in, loading wallet data')
      await loadWalletData()
    } else {
      console.log('User not logged in, showing login prompt')
      loading.value = false
    }
  } catch (error) {
    console.error('Error in wallet onMounted:', error)
    loading.value = false
  }
})
</script>

<style scoped>
.page-title {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.page-title h1 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.card {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  color: white !important;
}

.card-header {
  background: #1a202c !important;
  border-bottom: 1px solid #4a5568 !important;
  padding: 1rem 1.5rem;
}

.card-header h5 {
  font-weight: 600;
  color: white !important;
}

.card-body {
  padding: 1.5rem;
  color: white !important;
}

/* Ensure all text in cards is white */
.card * {
  color: white !important;
}

.card .text-muted {
  color: #a0aec0 !important;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  border-radius: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

@media (max-width: 768px) {
  .page-title h1 {
    font-size: 2rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .btn-lg {
    padding: 0.625rem 1.5rem;
    font-size: 1rem;
  }
}
</style>