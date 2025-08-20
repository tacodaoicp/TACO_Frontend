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
                    @register="registerToken"
                    @unregister="unregisterToken"
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
                    @register="registerToken"
                    @unregister="unregisterToken"
                  />
                </div>
              </div>
            </div>
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
                    @register="registerToken"
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
              <p class="text-muted">You can register additional tokens by browsing the trusted tokens above and clicking "Register"</p>
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { Principal } from '@dfinity/principal'
import TokenCard from '../components/wallet/TokenCard.vue'
import SendTokenDialog from '../components/wallet/SendTokenDialog.vue'
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
const allTokenBalances = ref<Map<string, bigint>>(new Map())
const userRegisteredTokenPrincipals = ref<string[]>([])

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
    priceUSD: tacoStore.icpPriceUsd,
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
    priceUSD: tacoStore.tacoPriceUsd,
    isRegistered: false
  })

  return tokens
})

// Trusted tokens (excluding core tokens)
const trustedTokens = computed<WalletToken[]>(() => {
  const coreTokenPrincipals = new Set(coreTokens.value.map(t => t.principal))
  const userRegisteredPrincipals = new Set(userRegisteredTokenPrincipals.value)
  
  return tacoStore.fetchedTokenDetails
    .filter(([principal, details]) => 
      !coreTokenPrincipals.has(principal.toString()) && 
      !userRegisteredPrincipals.has(principal.toString()) &&
      details.Active && 
      !details.isPaused
    )
    .map(([principal, details]) => ({
      principal: principal.toString(),
      name: details.tokenName,
      symbol: details.tokenSymbol,
      logo: tokenImages[details.tokenName] || tokenImages['Default'],
      balance: allTokenBalances.value.get(principal.toString()) || 0n,
      decimals: Number(details.tokenDecimals),
      fee: details.tokenTransferFee,
      priceUSD: parseFloat(details.priceInUSD) || 0,
      isRegistered: false
    }))
})

// User registered tokens
const userRegisteredTokens = computed<WalletToken[]>(() => {
  const tokenDetailsMap = new Map(tacoStore.fetchedTokenDetails.map(([p, d]) => [p.toString(), d]))
  
  return userRegisteredTokenPrincipals.value
    .map(principal => {
      const details = tokenDetailsMap.get(principal)
      if (!details) return null
      
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
    })
    .filter((token): token is WalletToken => token !== null)
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
    tacoStore.addToast('error', 'Error', 'Failed to load wallet data')
  } finally {
    loading.value = false
  }
}

const fetchUserRegisteredTokens = async () => {
  try {
    const registeredTokens = await tacoStore.getUserRegisteredTokens()
    userRegisteredTokenPrincipals.value = registeredTokens.map(p => p.toString())
  } catch (error) {
    console.error('Error fetching user registered tokens:', error)
    userRegisteredTokenPrincipals.value = []
  }
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
    
    tacoStore.addToast(
      'success', 
      'Transaction Sent', 
      `Successfully sent ${params.amount} ${selectedToken.value.symbol}`
    )
    
    // Refresh balance
    const newBalance = await tacoStore.fetchUserTokenBalance(
      selectedToken.value.principal, 
      selectedToken.value.decimals
    )
    allTokenBalances.value.set(selectedToken.value.principal, newBalance)
    
    closeSendDialog()
  } catch (error) {
    console.error('Error sending token:', error)
    tacoStore.addToast('error', 'Transaction Failed', 'Failed to send token')
  }
}

const registerToken = async (token: WalletToken) => {
  try {
    await tacoStore.registerUserToken(token.principal)
    tacoStore.addToast('success', 'Token Registered', `${token.symbol} added to your wallet`)
    await fetchUserRegisteredTokens() // Refresh
  } catch (error) {
    console.error('Error registering token:', error)
    tacoStore.addToast('error', 'Registration Failed', 'Failed to register token')
  }
}

const unregisterToken = async (token: WalletToken) => {
  try {
    await tacoStore.unregisterUserToken(token.principal)
    tacoStore.addToast('success', 'Token Unregistered', `${token.symbol} removed from your wallet`)
    await fetchUserRegisteredTokens() // Refresh
  } catch (error) {
    console.error('Error unregistering token:', error)
    tacoStore.addToast('error', 'Unregistration Failed', 'Failed to unregister token')
  }
}

// Lifecycle
onMounted(async () => {
  if (!tacoStore.userLoggedIn) {
    tacoStore.router.push('/')
    return
  }
  
  await loadWalletData()
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
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: var(--card-header-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 1.5rem;
}

.card-header h5 {
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: 1.5rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

@media (max-width: 768px) {
  .page-title h1 {
    font-size: 2rem;
  }
  
  .card-body {
    padding: 1rem;
  }
}
</style>