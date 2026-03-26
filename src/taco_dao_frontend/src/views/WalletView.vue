<template>

  <div class="standard-view">

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

                <!-- TACO Special Section (MOVED TO TOP) -->
                <section v-if="tacoToken" class="taco-section taco-container taco-container--l2">
                  <h5 class="section-title">
                    <i class="fa fa-taco me-2"></i>
                    TACO Rewards & Neurons
                  </h5>

                  <!-- TACO Token Header -->
                  <div class="taco-header">
                    <img :src="tacoToken.logo" :alt="tacoToken.symbol" class="taco-logo" />
                    <div class="taco-info">
                      <span class="taco-symbol">{{ tacoToken.symbol }}</span>
                      <span class="taco-balance">
                        {{ formatBalance(tacoToken.balance, tacoToken.decimals) }} {{ tacoToken.symbol }}
                      </span>
                      <span v-if="tacoToken.priceUSD" class="taco-usd">
                        ${{ formatUSD(tacoToken.balance, tacoToken.decimals, tacoToken.priceUSD) }}
                      </span>
                    </div>
                    <div class="taco-actions ms-auto">
                      <button
                        class="btn btn-sm taco-btn taco-btn--green"
                        @click="openSwapDialog(tacoToken)">
                        <i class="fa fa-exchange-alt me-1"></i>
                        Swap
                      </button>
                      <button
                        class="btn btn-sm taco-btn taco-btn--green"
                        @click="openSendDialog(tacoToken)"
                        :disabled="tacoToken.balance <= tacoToken.fee">
                        <i class="fa fa-paper-plane me-1"></i>
                        Send
                      </button>
                    </div>
                  </div>

                  <!-- Rewards Summary - using new component -->
                  <WalletRewardsSummary
                    :totalRewards="tacoTokenCardRef?.totalRewards || 0"
                    :loading="tacoTokenCardRef?.loadingRewards || false"
                    :claiming="tacoTokenCardRef?.claimingAllRewards || false"
                    @claim-some="tacoTokenCardRef?.toggleNeuronsSection()"
                    @claim-all="tacoTokenCardRef?.claimAllRewards()" />

                  <!-- Distribution History Table -->
                  <WalletDistributionHistory
                    v-if="userNeuronIds.length > 0"
                    :userNeuronIds="userNeuronIds" />

                  <!-- TokenCard for Neurons Management (keep existing component) -->
                  <div class="taco-neurons-wrapper">
                    <TokenCard
                      ref="tacoTokenCardRef"
                      :token="tacoToken"
                      @send="openSendDialog"
                      @swap="openSwapDialog"
                      @stake-to-neuron="handleStakeToNeuron"
                      @create-neuron="handleCreateNeuron"
                      @set-dissolve="handleSetDissolve"
                      @transfer-neuron="handleTransferNeuron"
                      @refresh-balances="() => loadAllBalances(true)" />
                  </div>
                </section>

                <!-- Core Tokens (ICP, NACHOS) - Table Display -->
                <section v-if="nonTacoCoreTokens.length > 0" class="token-section">
                  <h5 class="section-title">
                    <i class="fa fa-coins me-2"></i>
                    Core Tokens <span class="opacity-75">({{ nonTacoCoreTokens.length }})</span>
                  </h5>
                  <TokenTable
                    :tokens="nonTacoCoreTokens"
                    @send="openSendDialog"
                    @swap="openSwapDialog" />
                </section>

                <!-- Trusted Tokens - Table Display -->
                <section v-if="trustedTokens.length > 0" class="token-section">
                  <h5 class="section-title">
                    <i class="fa fa-shield-alt me-2"></i>
                    Trusted Tokens <span class="opacity-75">({{ trustedTokens.length }})</span>
                  </h5>
                  <TokenTable
                    :tokens="trustedTokens"
                    @send="openSendDialog"
                    @swap="openSwapDialog" />
                </section>

                <!-- Registered Tokens - Table Display -->
                <section class="token-section registered-tokens-section">
                  <h5 class="section-title">
                    <i class="fa fa-user-plus me-2"></i>
                    Registered Tokens <span class="opacity-75">({{ userRegisteredTokens.length }})</span>
                  </h5>

                  <!-- Register Token Input -->
                  <div class="register-token-form d-flex gap-2 mb-3">
                    <input
                      v-model="newTokenPrincipal"
                      placeholder="Enter token principal"
                      class="register-token-input taco-input flex-grow-1" />
                    <button
                      @click="registerCustomToken"
                      :disabled="!newTokenPrincipal.trim() || registeringToken"
                      class="btn btn-sm taco-btn taco-btn--green px-3 py-1">
                      <i class="fa fa-plus me-1"></i>
                      Add
                    </button>
                  </div>

                  <!-- Registered Tokens Table -->
                  <div v-if="userRegisteredTokens.length > 0">
                    <TokenTable
                      :tokens="userRegisteredTokens"
                      :showUnregister="true"
                      @send="openSendDialog"
                      @swap="openSwapDialog"
                      @unregister="unregisterToken" />
                  </div>

                  <!-- No Registered Tokens Message -->
                  <div v-else class="text-center py-4" style="opacity: 0.6;">
                    <i class="fa fa-coins fa-2x mb-2"></i>
                    <p class="mb-0">No registered tokens</p>
                  </div>
                </section>

              </div>

              <!-- Floating Refresh Button -->
              <button
                v-if="tacoStore.userLoggedIn"
                class="taco-refresh-btn"
                @click="loadAllBalances(true)"
                title="Refresh all balances">
                <i class="fa fa-sync-alt"></i>
              </button>

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

    <!-- Manage Permissions Dialog -->
    <ManagePermissionsDialog
      :show="showPermissionsDialog"
      :neuron="selectedNeuron"
      @close="closePermissionsDialog"
      @permissions-updated="handlePermissionsUpdated"
    />

    <!-- Transfer Neuron Dialog -->
    <TransferNeuronDialog
      :show="showTransferDialog"
      :neuron="neuronToTransfer"
      @close="closeTransferDialog"
      @transferred="handleTransferCompleted"
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
    display: flex;
    flex-direction: column;
    gap: 3.5rem; // Increased from 2.5rem for more breathing room between sections
    position: relative;
    padding-bottom: 3rem; // Reduced from 5rem - space for floating button
  }

}

// Token sections
.token-section {
  margin-bottom: 1.5rem; // Reduced for more compact layout
}

.section-title {
  font-size: 1.1rem; // Increased from 1rem
  font-family: 'Space Mono', monospace;
  margin-bottom: 1rem; // Increased from 0.75rem
  font-weight: 600;
  color: var(--brown-to-white);
  display: flex;
  align-items: center;

  i {
    font-size: 0.95rem; // Increased from 0.85rem
  }
}

// TACO Special Section
.taco-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; // Increased from 1rem
  padding: 1.25rem; // Added internal padding for better spacing
  margin-top: 1rem; // Reduced spacing before first section (TACO)
  margin-bottom: 1.5rem; // Reduced spacing after TACO section
}

.taco-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem; // Increased from 0.75rem
  background: rgba(0, 0, 0, 0.25); // MUCH DARKER - increased from 0.12 to 0.25
  border-radius: 0.375rem;
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.taco-logo {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
}

.taco-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex-grow: 1;
}

.taco-symbol {
  font-weight: 600;
  font-size: 1.05rem; // Increased from 0.95rem
  color: var(--black-to-white);
  font-family: 'Space Mono', monospace;
}

.taco-balance {
  font-size: 0.95rem; // Increased from 0.85rem
  color: var(--black-to-white);
  font-family: 'Space Mono', monospace;
}

.taco-usd {
  font-size: 0.85rem; // Increased from 0.75rem
  opacity: 0.7;
  color: var(--black-to-white);
  font-family: 'Space Mono', monospace;
}

.taco-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  .btn {
    font-size: 0.85rem; // Add explicit button font size
    padding: 0.5rem 0.75rem; // Slightly larger padding

    i {
      font-size: 0.8rem;
    }
  }
}

.taco-neurons-wrapper {
  // Hide the token header/balance/rewards/actions from TokenCard since we show them above
  :deep(.token-card) {
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;

    // Hide only non-neuron content within first child div
    // This hides token info and rewards, but keeps neurons section visible
    > div:first-child > div > div:not(.token-card__neurons) {
      display: none !important;
    }
  }
}

// Registered Tokens Section - Last section with border
.registered-tokens-section {
  margin-bottom: 0 !important; // Remove bottom margin from last section
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.20); // MUCH DARKER - increased from 0.10 to 0.20
  border: 2px solid var(--dark-orange-to-brown);
  border-radius: 0.5rem;
}

// Register token form
.register-token-form {
  margin-bottom: 1rem;
}

.register-token-input {
  padding: 0.375rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'Space Mono', monospace;
}

// Floating refresh button — now uses global .taco-refresh-btn from App.vue

// Login curtain
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

// Mobile responsiveness
@media (max-width: 767.98px) {
  .taco-header {
    flex-wrap: wrap;
  }

  .taco-actions {
    width: 100%;

    .btn {
      flex: 1;
    }
  }

}

@media (max-width: 575.98px) {
  .taco-actions {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }
}

</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import TacoTitle from '../components/misc/TacoTitle.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { Principal } from '@dfinity/principal'
import TokenCard from '../components/wallet/TokenCard.vue'
import TokenTable from '../components/wallet/TokenTable.vue'
import WalletRewardsSummary from '../components/wallet/WalletRewardsSummary.vue'
import WalletDistributionHistory from '../components/wallet/WalletDistributionHistory.vue'
import SendTokenDialog from '../components/wallet/SendTokenDialog.vue'
import SwapDialog from '../components/wallet/SwapDialog.vue'
import SwapConfirmDialog from '../components/wallet/SwapConfirmDialog.vue'
import StakeToNeuronDialog from '../components/wallet/StakeToNeuronDialog.vue'
import CreateNeuronDialog from '../components/wallet/CreateNeuronDialog.vue'
import SetDissolveDialog from '../components/wallet/SetDissolveDialog.vue'
import ManagePermissionsDialog from '../components/wallet/ManagePermissionsDialog.vue'
import TransferNeuronDialog from '../components/wallet/TransferNeuronDialog.vue'
import { tokenImages } from '../components/data/TokenData'
import DfinityLogo from '../assets/images/dfinityLogo.vue'
import { getEffectiveNetwork } from '../config/network-config'

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
const showTransferDialog = ref(false)
const neuronToTransfer = ref<any | null>(null)
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

  // NACHOS token — staging only
  if (getEffectiveNetwork() !== 'ic') {
    const nachosPrincipal = 'pabnq-2qaaa-aaaam-qhryq-cai'
    tokens.push({
      principal: nachosPrincipal,
      name: 'NACHOS',
      symbol: 'NACHOS',
      logo: tokenImages['Default'],
      balance: allTokenBalances.value.get(nachosPrincipal) || 0n,
      decimals: 8,
      fee: 10000n,
      isRegistered: false
    })
  }

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
        // Try multiple lookups: name, symbol (upper), symbol (as-is)
        const logo = freshMetadata.logo
          || tokenImages[freshMetadata.name]
          || tokenImages[freshMetadata.symbol?.toUpperCase()]
          || tokenImages[freshMetadata.symbol]
          || tokenImages['Default']
        return {
          principal: principalStr,
          name: freshMetadata.name,
          symbol: freshMetadata.symbol,
          logo,
          balance: allTokenBalances.value.get(principalStr) || 0n,
          decimals: freshMetadata.decimals,
          fee: freshMetadata.fee,
          priceUSD: parseFloat(details.priceInUSD) || 0, // Keep price from original source
          isRegistered: false
        }
      } else {
        // Fall back to original metadata
        // Try multiple lookups: tokenName, symbol (upper), symbol (as-is)
        const logo = tokenImages[details.tokenName]
          || tokenImages[details.tokenSymbol?.toUpperCase()]
          || tokenImages[details.tokenSymbol]
          || tokenImages['Default']
        return {
          principal: principalStr,
          name: details.tokenName,
          symbol: details.tokenSymbol,
          logo,
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
        // Try multiple lookups: tokenName, symbol (upper), symbol (as-is)
        const logo = tokenImages[details.tokenName]
          || tokenImages[details.tokenSymbol?.toUpperCase()]
          || tokenImages[details.tokenSymbol]
          || tokenImages['Default']
        return {
          principal,
          name: details.tokenName,
          symbol: details.tokenSymbol,
          logo,
          balance: allTokenBalances.value.get(principal) || 0n,
          decimals: Number(details.tokenDecimals),
          fee: details.tokenTransferFee,
          priceUSD: parseFloat(details.priceInUSD) || 0,
          isRegistered: true
        }
      }

      // For custom ICRC1 tokens not in trusted list, use cached metadata or defaults
      const metadata = customTokenMetadata.value.get(principal)
      // Try multiple lookups for custom tokens too
      const logo = metadata?.logo
        || tokenImages[metadata?.name]
        || tokenImages[metadata?.symbol?.toUpperCase()]
        || tokenImages[metadata?.symbol]
        || tokenImages['Default']
      return {
        principal,
        name: metadata?.name || `Custom Token (${principal.slice(0, 5)}...)`,
        symbol: metadata?.symbol || 'UNKNOWN',
        logo,
        balance: allTokenBalances.value.get(principal) || 0n,
        decimals: metadata?.decimals || 8,
        fee: metadata?.fee || 10000n,
        priceUSD: 0, // Custom tokens don't have price data
        isRegistered: true
      }
    })
})

// Core tokens except TACO (for table display)
const nonTacoCoreTokens = computed<WalletToken[]>(() => {
  return coreTokens.value.filter(token => token.symbol !== 'TACO')
})

// TACO token (for special section)
const tacoToken = computed<WalletToken | null>(() => {
  return coreTokens.value.find(token => token.symbol === 'TACO') || null
})

// User neuron IDs (for distribution rewards)
const userNeuronIds = computed<string[]>(() => {
  if (!tacoToken.value) {
    console.log('[DEBUG] No tacoToken, returning empty neuronIds')
    return []
  }
  // Get neurons from TokenCard ref if available
  const neurons = tacoTokenCardRef.value?.neurons || []
  console.log('[DEBUG] TokenCard neurons:', neurons)
  const ids = neurons.map((n: any) => n.idHex || '')
  console.log('[DEBUG] userNeuronIds:', ids)
  return ids
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

// Format balance (BigInt to readable decimal)
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = balance / divisor
  const fractionalPart = balance % divisor

  // Convert fractional part to string with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')

  // Trim trailing zeros and decimal point if not needed
  const trimmedFractional = fractionalStr.replace(/0+$/, '')

  if (trimmedFractional === '') {
    return integerPart.toString()
  }

  // Show max 4 decimal places for display
  const displayFractional = trimmedFractional.substring(0, 4)

  return `${integerPart}.${displayFractional}`
}

// Format USD value
function formatUSD(balance: bigint, decimals: number, priceUSD: number): string {
  const divisor = BigInt(10 ** decimals)
  const balanceNum = Number(balance) / Number(divisor)
  const usdValue = balanceNum * priceUSD

  if (usdValue < 0.01) {
    return '< 0.01'
  }

  return usdValue.toFixed(2)
}

// load wallet data
const loadWalletData = async (showSpinner = true) => {
  try {
    // Check if we already have cached token details
    const hasCachedTokenDetails = tacoStore.fetchedTokenDetails && tacoStore.fetchedTokenDetails.length > 0

    // Only show app loading if no cached data and spinner requested
    if (showSpinner && !hasCachedTokenDetails) {
      appLoadingOn()
    }

    // Load token details and user registered tokens in parallel
    // fetchTokenDetails will be fast if worker already has cached data
    await Promise.all([
      tacoStore.fetchTokenDetails(),
      fetchUserRegisteredTokens()
    ])

    // Load balances for all tokens (this is the critical path)
    await loadAllBalances()

    // Load fresh metadata for trusted tokens in the BACKGROUND (not blocking)
    // This enriches display with ICRC1 data but isn't required for initial render
    loadTrustedTokenMetadata().catch(console.error)

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

  // Load metadata in parallel for speed (don't clear cache - use cached data when available)
  const metadataPromises = trustedTokenPrincipals.map(async (principal) => {
    try {
      const metadata = await tacoStore.fetchTokenMetadata(principal)
      return { principal, metadata }
    } catch (error) {
      console.error(`Error loading metadata for trusted token ${principal}:`, error)
      return null
    }
  })

  const results = await Promise.all(metadataPromises)
  results.forEach(result => {
    if (result) {
      customTokenMetadata.value.set(result.principal, result.metadata)
    }
  })
}

// load all balances
const loadAllBalances = async (showSpinner = false) => {

  // turn app loading on only if requested
  if (showSpinner) {
    appLoadingOn()
  }

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

  // turn app loading off
  if (showSpinner) {
    appLoadingOff()
  }

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
const handleSendToken = async (params: { recipient: string; amount: bigint; memo?: string; addressType: 'principal' | 'accountId' }) => {
  if (!selectedToken.value) return

  // turn on app loading
  appLoadingOn()

  try {
    if (params.addressType === 'accountId') {
      await tacoStore.sendIcpByAccountId(
        params.recipient,
        params.amount,
        selectedToken.value.fee,
        params.memo
      )
    } else {
      await tacoStore.sendToken(
        selectedToken.value.principal,
        params.recipient,
        params.amount,
        selectedToken.value.fee,
        params.memo
      )
    }
    
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
  // then refresh neurons in the taco token card specifically (force refresh to bypass cache)
  try {
    const refVal = tacoTokenCardRef.value as any
    const instances = Array.isArray(refVal) ? refVal : [refVal]
    for (const inst of instances) {
      if (inst && typeof inst.loadNeurons === 'function') await inst.loadNeurons(true)
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

// close permissions dialog
const closePermissionsDialog = () => {
  showPermissionsDialog.value = false
  selectedNeuron.value = null
}

// handle permissions updated
const handlePermissionsUpdated = async () => {
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
    console.error('error refreshing neurons after permissions update', e)
  }
}

// handle transfer neuron
const handleTransferNeuron = (neuron: any) => {
  neuronToTransfer.value = neuron
  showTransferDialog.value = true
}

// close transfer dialog
const closeTransferDialog = () => {
  showTransferDialog.value = false
  neuronToTransfer.value = null
}

// handle transfer completed
const handleTransferCompleted = async () => {
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
    console.error('error refreshing neurons after transfer', e)
  }
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
  try {
    // Wait for authentication to be checked
    await tacoStore.checkIfLoggedIn()

    // If user is logged in, load wallet data
    if (tacoStore.userLoggedIn) {
      await loadWalletData()
    } else {
      // Not logged in - no loading needed
      appLoadingOff()
    }
  } catch (error) {
    console.error('Error in wallet onMounted:', error)
    appLoadingOff()
  }
})

// watch user login state and refresh balances when it changes
watch(() => tacoStore.userLoggedIn, async () => {
  try {
    await loadAllBalances()
  } catch (e) {
    console.error('error reloading balances on auth change', e)
  }
})

</script>
