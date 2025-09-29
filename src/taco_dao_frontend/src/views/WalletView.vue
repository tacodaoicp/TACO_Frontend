<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- wallet page -->
          <div class="wallet-view">

            <!-- title container -->
            <div class="d-flex align-items-center">

              <!-- wallet title -->
              <TacoTitle level="h2" emoji="💸" title="Wallet" class="mt-4" /> 

            </div>

            <!-- taco container -->
            <div class="taco-container
                        taco-container--l1
                        d-flex flex-column gap-0 w-100 p-0 flex-grow-1 overflow-hidden position-relative">          
              
              <!-- logged out content -->
              <div v-if="!tacoStore.userLoggedIn" 
                   class="wallet-view__logged-out-content">

                <!-- wallet icon -->
                <i class="fa-solid fa-wallet"></i>

              </div>

              <!-- logged out curtain -->
              <div v-if="!tacoStore.userLoggedIn" class="login-curtain">

                <!-- login button -->
                <button class="btn iid-login" @click="tacoStore.iidLogIn()">

                  <!-- dfinity logo -->
                  <DfinityLogo />

                  <!-- login text -->
                  <span class="taco-text-white">Login to view</span>

                </button>

              </div>              

              <!-- logged in content -->
              <div v-if="tacoStore.userLoggedIn"
                   class="wallet-view__logged-in-content">

                <!-- core tokens -->
                <div>

                  <div class="d-flex justify-content-between align-items-center">
                  
                    <!-- core tokens title -->
                    <h2 class="tokens-title">Core Tokens <span class="small">({{ coreTokens.length }})</span></h2>

                    <!-- refresh button -->
                    <button class="btn btn-sm taco-btn taco-btn--green"
                            style="padding: 0.75rem 1rem !important;"
                            @click="loadAllBalances()">
                      <i class="fa fa-refresh"></i>
                    </button>

                  </div>

                  <!-- trusted token -->
                  <div class="d-flex flex-column gap-2">

                    <!-- core token -->
                    <div v-for="token in coreTokens" 
                        :key="token.principal">

                      <!-- core token card -->
                      <TokenCard 
                        ref="tacoTokenCardRef"
                        :token="token" 
                        @send="openSendDialog"
                        @swap="openSwapDialog" 
                        @unregister="unregisterToken"
                        @stake-to-neuron="handleStakeToNeuron"
                        @create-neuron="handleCreateNeuron"
                        @set-dissolve="handleSetDissolve"
                        @refresh-balances="loadAllBalances" />

                    </div>

                  </div>

                </div>

                <!-- trusted tokens container -->
                <div>

                  <div class="d-flex justify-content-between align-items-center">

                    <!-- trusted tokens title -->
                    <h2 class="tokens-title">Trusted Tokens <span class="small">({{ trustedTokens.length }})</span></h2>

                    <!-- refresh button -->
                    <button class="btn btn-sm taco-btn taco-btn--green"
                            style="padding: 0.75rem 1rem !important;"
                            @click="loadAllBalances()">
                      <i class="fa fa-refresh"></i>
                    </button>

                  </div>

                  <!-- if trusted tokens -->
                  <div v-if="trustedTokens.length > 0">

                    <!-- trusted token -->
                    <div class="d-flex flex-column gap-2">

                      <!-- trusted token -->
                      <div v-for="token in trustedTokens" :key="token.principal">

                        <!-- token card -->
                        <TokenCard 
                          :token="token" 
                          @send="openSendDialog"
                          @swap="openSwapDialog" />
                      </div>

                    </div>

                  </div>

                </div>

                <!-- registered tokens container -->
                <div>

                  <div class="d-flex justify-content-between align-items-center">

                    <!-- registered tokens title -->
                    <h2 class="tokens-title">Registered Tokens <span class="small">({{ userRegisteredTokens.length }})</span></h2>

                    <!-- refresh button -->
                    <button class="btn btn-sm taco-btn taco-btn--green"
                            style="padding: 0.75rem 1rem !important;"
                            @click="loadAllBalances()">
                      <i class="fa fa-refresh"></i>
                    </button> 
                    
                  </div>

                  <!-- register a token -->
                  <div class="d-flex gap-2 mb-2">

                    <!-- input -->
                    <input v-model="newTokenPrincipal"
                           placeholder="Enter token principal"
                           class="register-token-input taco-input" />

                    <!-- add button -->
                    <button @click="registerCustomToken" 
                            :disabled="!newTokenPrincipal.trim() || registeringToken"
                            class="btn btn-sm taco-btn taco-btn--green px-3 py-1">
                      
                      <!-- plus icon -->
                      <i class="fa fa-plus"></i>

                    </button>
                  </div>                  

                  <!-- if registered tokens -->
                  <div v-if="userRegisteredTokens.length > 0">

                    <!-- registered tokens -->
                    <div class="d-flex flex-column gap-2">

                      <!-- registered token -->
                      <div v-for="token in userRegisteredTokens" :key="token.principal">

                        <!-- token card -->
                        <TokenCard 
                          :token="token" 
                          @send="openSendDialog"
                          @swap="openSwapDialog"
                          @unregister="unregisterToken" />
                      </div>

                    </div>

                  </div>

                  <!-- no registered tokens -->
                  <div v-if="userRegisteredTokens.length === 0">
                    
                    <div class="wallet-view__no-registered-tokens
                                d-flex align-items-center justify-content-center">

                      <span class="d-inline-block taco-text-black-to-white px-4 py-5">No registered tokens</span>

                    </div>
                    
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />    

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

    <!-- Manage Permissions Dialog -->
    <ManagePermissionsDialog
      :show="showPermissionsDialog"
      :neuron="selectedNeuron"
      @close="closePermissionsDialog"
      @permissions-updated="handlePermissionsUpdated"
    />

    <!-- Swap Dialog -->
    <SwapDialog
      ref="swapDialogRef"
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

<style scoped lang="scss">

// wallet view
.wallet-view {
  display: flex;
  flex-direction: column;
  color: var(--black-to-white);

  // logged out banner
  &__logged-out-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 300px;

    // wallet icon
    i {
      font-size: 8rem;
      color: var(--dark-orange-to-dark-brown);
      transform: rotate(-10deg);
    }

  }

  // logged in content
  &__logged-in-content {
    padding: 0rem 1rem 1rem;
  }

  // no registered tokens
  &__no-registered-tokens {
    background-color: var(--orange-to-dark-brown);
    border-radius: 0.5rem;
    border: 1px solid var(--dark-orange-to-dark-brown);
  }

  // tokens title
  .tokens-title {
    font-size: 1.5rem;
    line-height: 1;
    font-family: 'Space Mono';
    padding: 1.5rem 0 1rem;
    margin-bottom: 0;
  }

}

// login curtain
.login-curtain {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--curtain-bg);
  padding: 0 3rem;
  border-radius: 0.5rem;
  z-index: 1000;

  // login
  .iid-login {
    display: inline-flex;
    align-items: center;
    gap: 0.325rem;

    svg {
      width: 1.375rem;
    }

    span {
      font-size: 1rem;
      font-family: 'Space Mono', monospace;
    }

    &:active {
      border-color: transparent;
    }

  }

}

// register token input
.register-token-input {
  padding: 0.375rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  width: 100%;
  max-width: 280px;
}

</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import HeaderBar from "../components/HeaderBar.vue";
import FooterBar from "../components/FooterBar.vue";
import TacoTitle from '../components/misc/TacoTitle.vue'
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
import ManagePermissionsDialog from '../components/wallet/ManagePermissionsDialog.vue'
import { tokenImages } from '../components/data/TokenData'
import DfinityLogo from '../assets/images/dfinityLogo.vue'

////////////////
// interfaces //
////////////////

// wallet token interface
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

///////////
// store //
///////////

// # SETUP #
const tacoStore = useTacoStore()

// # STATE #
const showSendDialog = ref(false)
const tacoTokenCardRef = ref<any | null>(null)
const selectedToken = ref<WalletToken | null>(null)
const showStakeDialog = ref(false)
const selectedNeuron = ref<any | null>(null)
const showCreateDialog = ref(false)
const showDissolveDialog = ref(false)
const showPermissionsDialog = ref(false)
const showSwapDialog = ref(false)
const showSwapConfirmDialog = ref(false)
const selectedTokenForSwap = ref<WalletToken | null>(null)
const swapConfirmData = ref<any | null>(null)
const swapDialogRef = ref<any>(null)
const allTokenBalances = ref<Map<string, bigint>>(new Map())
const userRegisteredTokenPrincipals = ref<string[]>([])
const customTokenMetadata = ref<Map<string, any>>(new Map())
const newTokenPrincipal = ref('')
const registeringToken = ref(false)

// # ACTIONS #
const { appLoadingOn, appLoadingOff } = tacoStore

//////////////
// computed //
//////////////

// core tokens (ICP and TACO)
const coreTokens = computed<WalletToken[]>(() => {

  // create tokens array
  const tokens: WalletToken[] = []
  
  // ICP token principal
  const icpPrincipal = 'ryjl3-tyaaa-aaaaa-aaaba-cai'

  // add ICP token to tokens array
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

  // TACO token principal
  const tacoPrincipal = 'kknbx-zyaaa-aaaaq-aae4a-cai'

  // add TACO token to tokens array
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

  // return tokens array
  return tokens

})

// trusted tokens (excluding core tokens)
const trustedTokens = computed<WalletToken[]>(() => {

  // create core token principals set
  const coreTokenPrincipals = new Set(coreTokens.value.map(t => t.principal))

  // create user registered token principals set
  const userRegisteredPrincipals = new Set(userRegisteredTokenPrincipals.value)
  
  // return fetched token details filtered by core token principals and user registered token principals
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
      const principalStr = principal.toString()
      
      // Check if we have fresh metadata for this token
      const freshMetadata = customTokenMetadata.value.get(principalStr)
      
      if (freshMetadata) {
        // Use fresh ICRC1 metadata
        return {
          principal: principalStr,
          name: freshMetadata.name,
          symbol: freshMetadata.symbol,
          logo: freshMetadata.logo || tokenImages[freshMetadata.name] || tokenImages['Default'],
          balance: allTokenBalances.value.get(principalStr) || 0n,
          decimals: freshMetadata.decimals,
          fee: freshMetadata.fee,
          priceUSD: parseFloat(details.priceInUSD) || 0, // Keep price from original source
          isRegistered: false
        }
      } else {
        // Fall back to original metadata
        return {
          principal: principalStr,
          name: details.tokenName,
          symbol: details.tokenSymbol,
          logo: tokenImages[details.tokenName] || tokenImages['Default'],
          balance: allTokenBalances.value.get(principalStr) || 0n,
          decimals: Number(details.tokenDecimals),
          fee: details.tokenTransferFee,
          priceUSD: parseFloat(details.priceInUSD) || 0,
          isRegistered: false
        }
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

///////////////////
// local methods //
///////////////////

// load wallet data
const loadWalletData = async () => {
  try {
    
    // turn app loading on
    appLoadingOn()
    
    // Load token details and user registered tokens
    await Promise.all([
      tacoStore.fetchTokenDetails(),
      fetchUserRegisteredTokens()
    ])

    // turn app loading on
    appLoadingOn()    
    
    // Load fresh metadata for trusted tokens using ICRC1 calls
    await loadTrustedTokenMetadata()

    // turn app loading on
    appLoadingOn()    
    
    // Load balances for all tokens
    await loadAllBalances()

    // turn app loading on
    appLoadingOn()    
    
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

    // turn app loading off
    appLoadingOff()

  }

}

// fetch user registered tokens
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

// load custom token metadata
const loadCustomTokenMetadata = async () => {
  // console.log('Loading custom token metadata for:', userRegisteredTokenPrincipals.value)
      const tokenDetailsMap = new Map(tacoStore.fetchedTokenDetails.map((entry) => [entry[0].toString(), entry[1]]))
  
  // Load metadata for tokens not in trusted list
  for (const principal of userRegisteredTokenPrincipals.value) {
    // console.log(`Processing token: ${principal}`)
    if (!tokenDetailsMap.has(principal)) {
      // console.log(`Token ${principal} not in trusted list, loading custom metadata`)
      try {
        // Clear cache and fetch fresh metadata to get real ICRC1 data
        // console.log(`Clearing cache and fetching fresh metadata for ${principal}`)
        tacoStore.clearTokenMetadataCache(principal)
        const metadata = await tacoStore.fetchTokenMetadata(principal)
        // console.log(`Fetched fresh metadata for ${principal}:`, metadata)
        customTokenMetadata.value.set(principal, metadata)
      } catch (error) {
        // console.error(`Error loading metadata for token ${principal}:`, error)
        // Set default metadata
        const defaultMetadata = {
          name: `Custom Token (${principal.slice(0, 5)}...)`,
          symbol: 'UNKNOWN',
          decimals: 8,
          fee: 10000n,
          logo: null
        }
        customTokenMetadata.value.set(principal, defaultMetadata)
        // console.log(`Set default metadata for ${principal}:`, defaultMetadata)
      }
    } else {
      // console.log(`Token ${principal} is in trusted list, skipping`)
    }
  }
  // console.log('Final customTokenMetadata:', customTokenMetadata.value)
}

// load trusted token metadata
const loadTrustedTokenMetadata = async () => {
  // console.log('Loading fresh metadata for trusted tokens')
  
  // Get all trusted token principals
  const trustedTokenPrincipals = tacoStore.fetchedTokenDetails
    .filter((entry) => {
      const principal = entry[0]
      const details = entry[1]
      const coreTokenPrincipals = new Set(['ryjl3-tyaaa-aaaaa-aaaba-cai', 'kknbx-zyaaa-aaaaq-aae4a-cai']) // ICP and TACO
      const userRegisteredPrincipals = new Set(userRegisteredTokenPrincipals.value)
      
      return !coreTokenPrincipals.has(principal.toString()) && 
             !userRegisteredPrincipals.has(principal.toString()) &&
             details.Active && 
             !details.isPaused
    })
    .map(entry => entry[0].toString())
  
  // console.log('Trusted token principals to refresh:', trustedTokenPrincipals)
  
  // Load fresh metadata for each trusted token
  for (const principal of trustedTokenPrincipals) {
    try {
      // console.log(`Loading fresh metadata for trusted token: ${principal}`)
      // Clear cache to ensure we get fresh data
      tacoStore.clearTokenMetadataCache(principal)
      const metadata = await tacoStore.fetchTokenMetadata(principal)
      // console.log(`Fetched fresh metadata for ${principal}:`, metadata)
      customTokenMetadata.value.set(principal, metadata)
    } catch (error) {
      console.error(`Error loading metadata for trusted token ${principal}:`, error)
      // Keep the original metadata from fetchedTokenDetails as fallback
    }
  }
  
  // console.log('Finished loading trusted token metadata')
}

// load all balances
const loadAllBalances = async () => {

  // turn app loading on
  appLoadingOn()
  
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

      // turn app loading off
      appLoadingOff()

    }
  })
  
  await Promise.all(balancePromises)

  // turn app loading off
  appLoadingOff()
  
}

// open send dialog
const openSendDialog = (token: WalletToken) => {
  selectedToken.value = token
  showSendDialog.value = true
}

// close send dialog
const closeSendDialog = () => {
  showSendDialog.value = false
  selectedToken.value = null
}

// handle send token
const handleSendToken = async (params: { recipient: string; amount: bigint; memo?: string }) => {
  if (!selectedToken.value) return

  // turn on app loading
  appLoadingOn()
  
  try {
    await tacoStore.sendToken(
      selectedToken.value.principal,
      params.recipient,
      params.amount,
      selectedToken.value.fee,
      params.memo
    )
    
    const decimals = selectedToken.value.decimals
    const divisor = 10n ** BigInt(decimals)
    const whole = params.amount / divisor
    const frac = params.amount % divisor
    const fracStr = frac === 0n ? '' : `.${frac.toString().padStart(decimals, '0').replace(/0+$/, '')}`
    const formattedAmount = `${whole.toString()}${fracStr}`

    tacoStore.addToast({
      id: Date.now(),
      code: 'send-success',
      title: 'Transaction Sent',
      icon: 'fa-solid fa-check',
      message: `Successfully sent ${formattedAmount} ${selectedToken.value.symbol}`
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
  } finally {
    appLoadingOff()
  }
}

// unregister token
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

// handle stake to neuron
const handleStakeToNeuron = (neuron: any) => {
  // console.log('Stake to neuron:', neuron)
  selectedNeuron.value = neuron
  showStakeDialog.value = true
}

// close stake dialog
const closeStakeDialog = () => {
  showStakeDialog.value = false
  selectedNeuron.value = null
}

// handle stake completed
const handleStakeCompleted = async (neuron: any) => {
  // console.log('Staking completed for neuron:', neuron)
  // Refresh wallet data to show updated balances
  await loadWalletData()
  // then refresh neurons in the taco token card specifically
  try {
    const refVal = tacoTokenCardRef.value as any
    const instances = Array.isArray(refVal) ? refVal : [refVal]
    for (const inst of instances) {
      if (inst && typeof inst.loadNeurons === 'function') await inst.loadNeurons()
    }
  } catch (e) {
    console.error('error refreshing neurons after stake', e)
  }
}

// get taco balance
const getTacoBalance = (): bigint => {
  const tacoPrincipal = 'kknbx-zyaaa-aaaaq-aae4a-cai'
  return allTokenBalances.value.get(tacoPrincipal) || 0n
}

// handle create neuron
const handleCreateNeuron = () => {
  // console.log('Create neuron clicked')
  showCreateDialog.value = true
}

// close create dialog
const closeCreateDialog = () => {
  showCreateDialog.value = false
}

// handle neuron created
const handleNeuronCreated = async () => {
  // console.log('Neuron created successfully')
  // Refresh wallet data to show updated balances
  await loadWalletData()
  // then refresh neurons in the taco token card specifically
  try {
    const refVal = tacoTokenCardRef.value as any
    const instances = Array.isArray(refVal) ? refVal : [refVal]
    for (const inst of instances) {
      if (inst && typeof inst.loadNeurons === 'function') await inst.loadNeurons()
    }
  } catch (e) {
    console.error('error refreshing neurons after create', e)
  }

  // the refresh user voting power
  await tacoStore.refreshUserVotingPower()
  
}

// dissolve dialog handlers
const handleSetDissolve = (neuron: any) => {
  selectedNeuron.value = neuron
  showDissolveDialog.value = true
}

// close dissolve dialog
const closeDissolveDialog = () => {
  showDissolveDialog.value = false
  selectedNeuron.value = null
}

// handle dissolve set
const handleDissolveSet = async () => {
  // refresh the wallet data to show updated balances etc
  await loadWalletData()
  // then refresh neurons in the taco token card specifically
  try {
    const refVal = tacoTokenCardRef.value as any
    // handle both single and v-for array refs
    const instances = Array.isArray(refVal) ? refVal : [refVal]
    for (const inst of instances) {
      if (inst && typeof inst.loadNeurons === 'function') await inst.loadNeurons()
    }
  } catch (e) {
    console.error('error refreshing neurons after dissolve-set', e)
  }
}

// register custom token
const registerCustomToken = async () => {
  
  if (!newTokenPrincipal.value.trim()) return

  // turn app loading on
  appLoadingOn()
  
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

    // turn app loading off
    appLoadingOff()

  }
}

// open swap dialog
const openSwapDialog = (token: WalletToken) => {
  selectedTokenForSwap.value = token.symbol === 'TACO' ? null : token
  showSwapDialog.value = true
}

// clear all swap data
const clearSwapData = () => {
  // clear wallet view state
  selectedTokenForSwap.value = null
  swapConfirmData.value = null
  
  // clear swap dialog internal state
  if (swapDialogRef.value && swapDialogRef.value.clearSwapData) {
    swapDialogRef.value.clearSwapData()
  }
}

// close swap dialog
const closeSwapDialog = () => {
  showSwapDialog.value = false
  clearSwapData()
}

// handle swap confirm
const handleSwapConfirm = (swapData: any) => {
  swapConfirmData.value = swapData
  showSwapDialog.value = false
  showSwapConfirmDialog.value = true
}

// close swap confirm dialog
const closeSwapConfirmDialog = () => {
  showSwapConfirmDialog.value = false
  clearSwapData()
}

// handle swap success
const handleSwapSuccess = async (result: any) => {
  // console.log('Swap successful:', result)
  
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

// handle swap error
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

/////////////////////
// lifecycle hooks //
/////////////////////

// on mounted
onMounted(async () => {

  // try
  try {

    // wait for authentication to be checked first
    await tacoStore.checkIfLoggedIn()
    
    // small delay to ensure state is fully updated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // if user is logged in, load wallet data
    if (tacoStore.userLoggedIn) {

      // log
      // console.log('User is logged in, loading wallet data')

      // load wallet data
      await loadWalletData()

    } 
    
    // else user not logged in
    else {

      // log
      // console.log('User not logged in, showing login prompt')

      // turn app loading off
      appLoadingOff()

    }
  } catch (error) {

    // log error
    console.error('Error in wallet onMounted:', error)

    // turn app loading off
    appLoadingOff()

  }

})

</script>