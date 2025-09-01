<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        
        <!-- Page Title -->
        <div class="page-title">
          <h1>
            <i class="fa fa-magic me-3"></i>
            Swap & Stake Wizard
          </h1>
          <p class="text-muted">Easy 3-step process to get tokens, swap to TACO, and stake in neurons</p>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Analyzing your wallet...</p>
        </div>

        <!-- Login required state -->
        <div v-else-if="!tacoStore.userLoggedIn" class="text-center py-5">
          <div class="card">
            <div class="card-body py-5">
              <i class="fa fa-lock fa-4x text-muted mb-4"></i>
              <h3 class="mb-3">Login Required</h3>
              <p class="text-muted mb-4">You need to log in to use the Swap & Stake Wizard.</p>
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

        <!-- Wizard Content -->
        <div v-else class="wizard-container">
          
          <!-- Progress Indicator -->
          <div class="wizard-progress">
            <div class="progress-steps">
              <div class="step" :class="{ 
                'active': currentStep >= 1, 
                'completed': currentStep > 1,
                'current': currentStep === 1 
              }">
                <div class="step-number">1</div>
                <div class="step-label">Get Tokens</div>
              </div>
              <div class="step-connector" :class="{ 'completed': currentStep > 1 }"></div>
              <div class="step" :class="{ 
                'active': currentStep >= 2, 
                'completed': currentStep > 2,
                'current': currentStep === 2 
              }">
                <div class="step-number">2</div>
                <div class="step-label">Swap to TACO</div>
              </div>
              <div class="step-connector" :class="{ 'completed': currentStep > 2 }"></div>
              <div class="step" :class="{ 
                'active': currentStep >= 3,
                'current': currentStep === 3 
              }">
                <div class="step-number">3</div>
                <div class="step-label">Stake TACO</div>
              </div>
            </div>
          </div>

          <!-- Step 1: Get Tokens -->
          <div class="wizard-step-card">
            <div class="step-header" @click="toggleStep(1)">
              <div class="step-info">
                <h3 class="step-title">
                  <i class="fa fa-wallet me-2"></i>
                  Step 1: Get Tokens to Your Wallet
                </h3>
                <p class="step-description">
                  Transfer tokens from an exchange or another wallet to start swapping
                </p>
              </div>
              <div class="step-controls">
                <div v-if="currentStep === 1" class="current-step-badge">
                  <i class="fa fa-arrow-right"></i> Current Step
                </div>
                <div v-else-if="currentStep > 1" class="completed-badge">
                  <i class="fa fa-check"></i> Completed
                </div>
                <button class="expand-button">
                  <i :class="expandedSteps.has(1) ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"></i>
                </button>
              </div>
            </div>
            
            <div v-show="expandedSteps.has(1) || currentStep === 1" class="step-content">
              <div class="get-tokens-section">
                <!-- Token Selection -->
                <div class="token-selection">
                  <label class="form-label">Select Token to Receive:</label>
                  <select v-model="selectedGetTokenSymbol" class="form-select">
                    <option value="ICP">ICP (Recommended)</option>
                    <option v-for="token in availableTokensForDeposit" :key="token.symbol" :value="token.symbol">
                      {{ token.symbol }} - {{ token.name }}
                    </option>
                  </select>
                </div>

                <!-- Instructions for selected token -->
                <div class="deposit-instructions">
                  <div v-if="selectedGetTokenSymbol === 'ICP'" class="icp-instructions">
                    <div class="instruction-card">
                      <div class="instruction-header">
                        <i class="fa fa-info-circle me-2"></i>
                        <h5>How to get ICP to your wallet:</h5>
                      </div>
                      <ol class="instruction-list">
                        <li>Buy ICP on a centralized exchange like Coinbase, Binance, or Kraken</li>
                        <li>Copy your ICP Legacy Account ID below</li>
                        <li>Withdraw ICP from the exchange to this address</li>
                        <li>Wait for the transaction to confirm (usually within a few seconds)</li>
                      </ol>
                    </div>

                    <!-- ICP Account Display -->
                    <div class="account-display">
                      <div class="account-header">
                        <h6>Your ICP Legacy Account ID:</h6>
                      </div>
                      <div class="account-id-container">
                        <code class="account-id">{{ icpAccountId.hex }}</code>
                        <button 
                          @click="copyToClipboard(icpAccountId.hex)"
                          class="btn btn-outline-primary btn-sm"
                          title="Copy to clipboard"
                        >
                          <i class="fa fa-copy"></i>
                        </button>
                      </div>
                      <small class="account-help-text">
                        This is your unique ICP address. Use this exact address when withdrawing from exchanges.
                      </small>
                    </div>
                  </div>

                  <div v-else class="other-token-instructions">
                    <div class="instruction-card">
                      <div class="instruction-header">
                        <i class="fa fa-info-circle me-2"></i>
                        <h5>How to get {{ selectedGetTokenSymbol }} to your wallet:</h5>
                      </div>
                      <ol class="instruction-list">
                        <li>Get {{ selectedGetTokenSymbol }} from a DEX or transfer from another wallet</li>
                        <li>Copy your Principal ID below</li>
                        <li>Send {{ selectedGetTokenSymbol }} to this Principal ID</li>
                        <li>Wait for the transaction to confirm</li>
                      </ol>
                    </div>

                    <!-- Principal ID Display -->
                    <div class="account-display">
                      <div class="account-header">
                        <h6>Your Principal ID:</h6>
                      </div>
                      <div class="account-id-container">
                        <code class="account-id">{{ tacoStore.userPrincipal }}</code>
                        <button 
                          @click="copyToClipboard(tacoStore.userPrincipal)"
                          class="btn btn-outline-primary btn-sm"
                          title="Copy to clipboard"
                        >
                          <i class="fa fa-copy"></i>
                        </button>
                      </div>
                      <small class="account-help-text">
                        This is your Principal ID. Use this when sending ICRC-1 tokens.
                      </small>
                    </div>
                  </div>
                </div>

                <!-- Register Custom Token Section -->
                <div class="register-token-section">
                  <h6>Register Custom ICRC1 Token:</h6>
                  <p class="section-description">
                    If you have a custom ICRC1 token that's not listed above, you can register it here:
                  </p>
                  <div class="register-token-form">
                    <div class="input-group">
                      <input 
                        v-model="newTokenPrincipal"
                        placeholder="Token principal (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)"
                        class="form-control"
                        :disabled="registeringToken"
                      />
                      <button 
                        @click="registerCustomToken" 
                        :disabled="!newTokenPrincipal.trim() || registeringToken"
                        class="btn btn-outline-primary"
                      >
                        <i v-if="registeringToken" class="fa fa-spinner fa-spin me-1"></i>
                        <i v-else class="fa fa-plus me-1"></i>
                        {{ registeringToken ? 'Registering...' : 'Register Token' }}
                      </button>
                    </div>
                    <small class="form-text text-muted">
                      Enter the principal ID of an ICRC1 token to add it to your wallet
                    </small>
                  </div>
                </div>

                <!-- Current Balance Display -->
                <div class="current-balance">
                  <h6>Current Balance:</h6>
                  <div class="balance-grid">
                    <div v-for="token in coreTokens.concat(trustedTokens).concat(userRegisteredTokens)" 
                         :key="token.principal" 
                         v-show="token.balance > 0n"
                         class="balance-item">
                      <img :src="token.logo" :alt="token.symbol" class="balance-token-logo" />
                      <div class="balance-info">
                        <div class="balance-amount">
                          {{ formatBalance(token.balance, token.decimals) }} {{ token.symbol }}
                        </div>
                        <div v-if="token.priceUSD && token.priceUSD > 0" class="balance-usd">
                          ${{ formatUSDValue(token.balance, token.decimals, token.priceUSD) }}
                        </div>
                      </div>
                    </div>
                    <div v-if="!hasAnyTokens" class="no-tokens">
                      <i class="fa fa-info-circle me-2"></i>
                      No tokens found in your wallet yet
                    </div>
                  </div>
                </div>

                <!-- Next Step Button -->
                <div v-if="hasSwappableTokens" class="step-actions">
                  <button @click="goToStep(2)" class="btn btn-primary btn-lg">
                    <i class="fa fa-arrow-right me-2"></i>
                    Continue to Swap
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Swap Tokens -->
          <div class="wizard-step-card">
            <div class="step-header" @click="toggleStep(2)">
              <div class="step-info">
                <h3 class="step-title">
                  <i class="fa fa-exchange-alt me-2"></i>
                  Step 2: Swap to TACO
                </h3>
                <p class="step-description">
                  Exchange your tokens for TACO to prepare for staking
                </p>
              </div>
              <div class="step-controls">
                <div v-if="currentStep === 2" class="current-step-badge">
                  <i class="fa fa-arrow-right"></i> Current Step
                </div>
                <div v-else-if="currentStep > 2" class="completed-badge">
                  <i class="fa fa-check"></i> Completed
                </div>
                <button class="expand-button">
                  <i :class="expandedSteps.has(2) ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"></i>
                </button>
              </div>
            </div>
            
            <div v-show="expandedSteps.has(2) || currentStep === 2" class="step-content">
              <div class="swap-section">
                <!-- Token Selection for Swap -->
                <div class="swap-input">
                  <div class="token-input-group">
                    <select v-model="selectedSwapFromToken" class="form-select" @change="onStep2DropdownChange">
                      <option value="">Select token to swap from</option>
                      <option v-for="token in swappableTokens" :key="token.principal" :value="token.principal">
                        {{ token.symbol }} - Balance: {{ formatBalance(token.balance, token.decimals) }}
                      </option>
                    </select>
                  </div>
                  
                  <!-- Token Info Display -->
                  <div v-if="selectedSwapFromToken" class="token-info-display">
                    <div class="selected-token-info">
                      <img :src="getTokenByPrincipal(selectedSwapFromToken)?.logo" :alt="getTokenByPrincipal(selectedSwapFromToken)?.symbol" class="token-logo-small" />
                      <div class="token-details">
                        <div class="token-name">{{ getTokenByPrincipal(selectedSwapFromToken)?.name }}</div>
                        <div class="token-balance">
                          Available: {{ formatBalance(getTokenByPrincipal(selectedSwapFromToken)?.balance || 0n, getTokenByPrincipal(selectedSwapFromToken)?.decimals || 8) }}
                          {{ getTokenByPrincipal(selectedSwapFromToken)?.symbol || '' }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Swap Arrow -->
                  <div class="swap-arrow">
                    <i class="fa fa-arrow-down"></i>
                  </div>
                </div>

                <!-- TACO Output -->
                <div class="swap-output">
                  <div class="token-output-display">
                    <img :src="tacoToken.logo" :alt="tacoToken.symbol" class="token-logo" />
                    <div class="token-info">
                      <div class="token-name">{{ tacoToken.symbol }}</div>
                      <div class="token-balance">
                        Balance: {{ formatBalance(tacoToken.balance, tacoToken.decimals) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Swap & Stake Information -->
                <div v-if="selectedSwapFromToken" class="swap-stake-info mb-4">
                  <div class="info-box">
                    <h6><i class="fa fa-magic me-2"></i>Swap & Stake Preview:</h6>
                    <div class="preview-items">
                      <div class="preview-item">
                        <span class="label">Will swap:</span>
                        <span class="value">{{ formatBalance(selectedSwapToken.balance - selectedSwapToken.fee, selectedSwapToken.decimals) }} {{ selectedSwapToken.symbol }}</span>
                      </div>
                      <div class="preview-item">
                        <span class="label">Auto-stake:</span>
                        <span class="value">All received TACO</span>
                      </div>
                      <div class="preview-item">
                        <span class="label">Dissolve period:</span>
                        <span class="value">28 days (default)</span>
                      </div>
                    </div>
                    <p class="info-note">
                      <i class="fa fa-info-circle me-1"></i>
                      For custom amounts or dissolve periods, use "Swap" then "Stake" separately.
                    </p>
                  </div>
                </div>

                <!-- Swap Actions -->
                <div v-if="selectedSwapFromToken" class="swap-actions">
                  <button 
                    @click="performSwapAndStake"
                    class="btn btn-success btn-lg me-3 primary-action-btn"
                    :disabled="isSwapping"
                  >
                    <i v-if="isSwapping" class="fa fa-spinner fa-spin me-2"></i>
                    <i v-else class="fa fa-magic me-2"></i>
                    {{ isSwapping ? 'Processing...' : 'Swap & Stake All' }}
                  </button>
                  
                  <button 
                    @click="performSwap"
                    class="btn btn-outline-primary btn-lg"
                    :disabled="isSwapping"
                  >
                    <i v-if="isSwapping" class="fa fa-spinner fa-spin me-2"></i>
                    <i v-else class="fa fa-exchange-alt me-2"></i>
                    {{ isSwapping ? 'Swapping...' : 'Swap to TACO' }}
                  </button>
                </div>

                <!-- Next Step Button (if has TACO) -->
                <div v-if="hasTacoTokens" class="step-actions">
                  <button @click="goToStep(3)" class="btn btn-primary btn-lg">
                    <i class="fa fa-arrow-right me-2"></i>
                    Continue to Staking
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Stake TACO -->
          <div class="wizard-step-card">
            <div class="step-header" @click="toggleStep(3)">
              <div class="step-info">
                <h3 class="step-title">
                  <i class="fa fa-coins me-2"></i>
                  Step 3: Stake TACO in Neurons
                </h3>
                <p class="step-description">
                  Create neurons or stake to existing ones to earn rewards and participate in governance
                </p>
              </div>
              <div class="step-controls">
                <div v-if="currentStep === 3" class="current-step-badge">
                  <i class="fa fa-arrow-right"></i> Current Step
                </div>
                <button class="expand-button">
                  <i :class="expandedSteps.has(3) ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"></i>
                </button>
              </div>
            </div>
            
            <div v-show="expandedSteps.has(3) || currentStep === 3" class="step-content">
              <div class="stake-section">
                <!-- TACO Balance -->
                <div class="taco-balance-display">
                  <h5>Available TACO Balance:</h5>
                  <div class="balance-amount">
                    {{ formatBalance(tacoToken.balance, tacoToken.decimals) }} TACO
                  </div>
                  <div v-if="tacoToken.priceUSD && tacoToken.priceUSD > 0" class="balance-usd">
                    ${{ formatUSDValue(tacoToken.balance, tacoToken.decimals, tacoToken.priceUSD) }}
                  </div>
                </div>

                <!-- Staking Options -->
                <div class="staking-options">

                  <!-- Stake to Existing Neuron Section -->
                  <div v-if="userNeurons.length > 0" class="staking-section">
                    <h6 class="section-header">
                      <i class="fa fa-plus me-2"></i>
                      Stake to Existing Neuron
                    </h6>
                    <p class="section-description">
                      Add more TACO tokens to your existing neurons. Each dialog will let you specify the amount.
                    </p>
                    <div class="neurons-list">
                      <div v-for="neuron in userNeurons" :key="neuron.idHex" class="neuron-item" :class="neuron.relationship">
                        <div class="neuron-info">
                          <div class="neuron-name">
                            <i v-if="neuron.relationship === 'owned'" class="fa fa-crown me-1" title="Owned"></i>
                            <i v-else-if="neuron.relationship === 'hotkeyed'" class="fa fa-key me-1" title="Hotkeyed"></i>
                            {{ neuron.displayName }}
                          </div>
                          <div class="neuron-stake">
                            Stake: {{ formatBalance(neuron.stake, 8) }} TACO
                          </div>
                        </div>
                        <button 
                          @click="stakeToExistingNeuron(neuron)"
                          class="btn btn-outline-primary btn-sm"
                          :disabled="!hasTacoTokens || isStaking"
                        >
                          <i v-if="isStaking" class="fa fa-spinner fa-spin me-1"></i>
                          <i v-else class="fa fa-plus me-1"></i>
                          {{ isStaking ? 'Staking...' : 'Add Stake' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Create New Neuron Section -->
                  <div class="staking-section">
                    <h6 class="section-header">
                      <i class="fa fa-brain me-2"></i>
                      Create New Neuron
                    </h6>
                    <div class="create-neuron-content">
                      <p class="section-description">
                        Create a new neuron with your TACO tokens. The dialog will let you specify the amount and dissolve period.
                      </p>
                      
                      <button 
                        @click="createNewNeuron"
                        class="btn btn-success btn-lg"
                        :disabled="!hasTacoTokens || isStaking"
                      >
                        <i v-if="isStaking" class="fa fa-spinner fa-spin me-2"></i>
                        <i v-else class="fa fa-brain me-2"></i>
                        {{ isStaking ? 'Creating...' : 'Create New Neuron' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Success Message -->
                <div v-if="stakingComplete" class="success-message">
                  <div class="alert alert-success">
                    <i class="fa fa-check-circle me-2"></i>
                    <strong>Congratulations!</strong> You've successfully completed the Swap & Stake process. 
                    Your TACO tokens are now staked and earning rewards!
                  </div>
                  <div class="final-actions">
                    <button @click="goToWallet" class="btn btn-outline-primary me-3">
                      <i class="fa fa-wallet me-2"></i>
                      View Wallet
                    </button>
                    <button @click="resetWizard" class="btn btn-outline-secondary">
                      <i class="fa fa-refresh me-2"></i>
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Swap Dialog -->
    <SwapDialog
      :show="showSwapDialog"
      :preselected-token="preselectedSwapToken"
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

    <!-- Stake to Neuron Dialog -->
    <StakeToNeuronDialog
      :show="showStakeDialog"
      :neuron="selectedNeuron"
      :taco-balance="tacoToken.balance"
      @close="closeStakeDialog"
      @staked="handleStakeCompleted"
    />

    <!-- Create Neuron Dialog -->
    <CreateNeuronDialog
      :show="showCreateDialog"
      :taco-balance="tacoToken.balance"
      :prefilled-amount="maxTacoAmount"
      @close="closeCreateDialog"
      @created="handleNeuronCreated"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../stores/taco.store'
import { useKongStore } from '../stores/kong.store'
import { useICPSwapStore } from '../stores/icpswap.store'
import { getLegacyAccountId } from '../utils/accountUtils'
import { useClipboard } from '@vueuse/core'
import { tokenImages } from '../components/data/TokenData'
import SwapDialog from '../components/wallet/SwapDialog.vue'
import SwapConfirmDialog from '../components/wallet/SwapConfirmDialog.vue'
import StakeToNeuronDialog from '../components/wallet/StakeToNeuronDialog.vue'
import CreateNeuronDialog from '../components/wallet/CreateNeuronDialog.vue'

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

const router = useRouter()
const tacoStore = useTacoStore()
const kongStore = useKongStore()
const icpswapStore = useICPSwapStore()
const { copy } = useClipboard()

// State
const loading = ref(true)
const currentStep = ref(1)
const expandedSteps = ref<Set<number>>(new Set([1]))
const selectedGetTokenSymbol = ref('ICP')
const selectedSwapFromToken = ref('')
const userChangedStep2Selection = ref(false) // Track if user manually changed step 2
const isSwapping = ref(false)
const isStaking = ref(false)
const isSwapAndStake = ref(false) // Flag to track if we're doing swap & stake
const stakingComplete = ref(false)
const newTokenPrincipal = ref('')
const registeringToken = ref(false)

// Token data
const allTokenBalances = ref<Map<string, bigint>>(new Map())
const userRegisteredTokenPrincipals = ref<string[]>([])
const customTokenMetadata = ref<Map<string, any>>(new Map())
const userNeurons = ref<any[]>([])

// Dialog states
const showSwapDialog = ref(false)
const showSwapConfirmDialog = ref(false)
const showStakeDialog = ref(false)
const showCreateDialog = ref(false)
const selectedNeuron = ref<any | null>(null)
const preselectedSwapToken = ref<WalletToken | null>(null)
const swapConfirmData = ref<any | null>(null)

// Computed properties
const icpAccountId = computed(() => {
  if (tacoStore.userLoggedIn && tacoStore.userPrincipal) {
    return getLegacyAccountId(tacoStore.userPrincipal)
  }
  return { hex: '', dashed: '' }
})

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
    fee: 10000n,
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
    fee: 10000n,
    priceUSD: tacoStore.tacoPriceUsd || 0,
    isRegistered: false
  })

  return tokens
})

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
      const principalStr = principal.toString()
      
      const freshMetadata = customTokenMetadata.value.get(principalStr)
      
      if (freshMetadata) {
        return {
          principal: principalStr,
          name: freshMetadata.name,
          symbol: freshMetadata.symbol,
          logo: freshMetadata.logo || tokenImages[freshMetadata.name] || tokenImages['Default'],
          balance: allTokenBalances.value.get(principalStr) || 0n,
          decimals: freshMetadata.decimals,
          fee: freshMetadata.fee,
          priceUSD: parseFloat(details.priceInUSD) || 0,
          isRegistered: false
        }
      } else {
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

const userRegisteredTokens = computed<WalletToken[]>(() => {
  const tokenDetailsMap = new Map(tacoStore.fetchedTokenDetails.map((entry) => [entry[0].toString(), entry[1]]))
  
  return userRegisteredTokenPrincipals.value
    .map(principal => {
      const details = tokenDetailsMap.get(principal)
      
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
      
      const metadata = customTokenMetadata.value.get(principal)
      return {
        principal,
        name: metadata?.name || `Custom Token (${principal.slice(0, 5)}...)`,
        symbol: metadata?.symbol || 'UNKNOWN',
        logo: metadata?.logo || tokenImages['Default'],
        balance: allTokenBalances.value.get(principal) || 0n,
        decimals: metadata?.decimals || 8,
        fee: metadata?.fee || 10000n,
        priceUSD: 0,
        isRegistered: true
      }
    })
})

const allTokens = computed<WalletToken[]>(() => {
  return [
    ...coreTokens.value,
    ...trustedTokens.value,
    ...userRegisteredTokens.value
  ]
})

const tacoToken = computed(() => {
  return coreTokens.value.find(t => t.symbol === 'TACO') || coreTokens.value[1]
})

const availableTokensForDeposit = computed(() => {
  return trustedTokens.value.concat(userRegisteredTokens.value)
    .filter(t => t.symbol !== 'TACO')
})

const hasAnyTokens = computed(() => {
  return allTokens.value.some(token => token.balance > 0n)
})

const hasSwappableTokens = computed(() => {
  return allTokens.value.some(token => token.symbol !== 'TACO' && token.balance > token.fee)
})

const hasTacoTokens = computed(() => {
  return tacoToken.value.balance > 0n
})

const swappableTokens = computed(() => {
  return allTokens.value.filter(token => token.symbol !== 'TACO' && token.balance > token.fee)
})

const canSwap = computed(() => {
  if (!selectedSwapFromToken.value) return false
  
  const token = getTokenByPrincipal(selectedSwapFromToken.value)
  if (!token) return false
  
  return token.balance > token.fee
})

const maxTacoAmount = computed(() => {
  const maxAmount = Number(tacoToken.value.balance - tacoToken.value.fee) / (10 ** tacoToken.value.decimals)
  return maxAmount.toString()
})

const selectedSwapToken = computed(() => {
  return getTokenByPrincipal(selectedSwapFromToken.value)
})



// Methods
const loadWalletData = async () => {
  try {
    loading.value = true
    
    await Promise.all([
      tacoStore.fetchTokenDetails(),
      fetchUserRegisteredTokens(),
      loadUserNeurons()
    ])
    
    await loadTrustedTokenMetadata()
    await loadAllBalances()
    
    // Determine starting step based on wallet state
    determineStartingStep()
    
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
    await loadCustomTokenMetadata()
  } catch (error) {
    console.error('Error fetching user registered tokens:', error)
    userRegisteredTokenPrincipals.value = []
  }
}

const loadCustomTokenMetadata = async () => {
  const tokenDetailsMap = new Map(tacoStore.fetchedTokenDetails.map((entry) => [entry[0].toString(), entry[1]]))
  
  for (const principal of userRegisteredTokenPrincipals.value) {
    if (!tokenDetailsMap.has(principal)) {
      try {
        tacoStore.clearTokenMetadataCache(principal)
        const metadata = await tacoStore.fetchTokenMetadata(principal)
        customTokenMetadata.value.set(principal, metadata)
      } catch (error) {
        console.error(`Error loading metadata for token ${principal}:`, error)
        const defaultMetadata = {
          name: `Custom Token (${principal.slice(0, 5)}...)`,
          symbol: 'UNKNOWN',
          decimals: 8,
          fee: 10000n,
          logo: null
        }
        customTokenMetadata.value.set(principal, defaultMetadata)
      }
    }
  }
}

const loadTrustedTokenMetadata = async () => {
  const trustedTokenPrincipals = tacoStore.fetchedTokenDetails
    .filter((entry) => {
      const principal = entry[0]
      const details = entry[1]
      const coreTokenPrincipals = new Set(['ryjl3-tyaaa-aaaaa-aaaba-cai', 'kknbx-zyaaa-aaaaq-aae4a-cai'])
      const userRegisteredPrincipals = new Set(userRegisteredTokenPrincipals.value)
      
      return !coreTokenPrincipals.has(principal.toString()) && 
             !userRegisteredPrincipals.has(principal.toString()) &&
             details.Active && 
             !details.isPaused
    })
    .map(entry => entry[0].toString())
  
  for (const principal of trustedTokenPrincipals) {
    try {
      tacoStore.clearTokenMetadataCache(principal)
      const metadata = await tacoStore.fetchTokenMetadata(principal)
      customTokenMetadata.value.set(principal, metadata)
    } catch (error) {
      console.error(`Error loading metadata for trusted token ${principal}:`, error)
    }
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

const loadUserNeurons = async () => {
  try {
    const rawNeurons = await tacoStore.getTacoNeurons()
    const categorizedNeurons = tacoStore.categorizeNeurons(rawNeurons)
    // Include both owned and hotkeyed neurons in wizard
    userNeurons.value = [...categorizedNeurons.owned, ...categorizedNeurons.hotkeyed]
  } catch (error) {
    console.error('Error loading user neurons:', error)
    userNeurons.value = []
  }
}

const syncSwapTokenSelection = () => {
  if (allTokens.value.length === 0) return
  
  // Don't sync if user has manually changed step 2 selection
  if (userChangedStep2Selection.value) return
  
  // Try to use the token selected in step 1
  const selectedGetToken = allTokens.value.find(t => t.symbol === selectedGetTokenSymbol.value)
  
  if (selectedGetToken && selectedGetToken.symbol !== 'TACO' && selectedGetToken.balance > selectedGetToken.fee) {
    selectedSwapFromToken.value = selectedGetToken.principal
    return
  }
  
  // If step 1 selection isn't swappable, don't change step 2 selection
}

const initializeTokenSelections = () => {
  // Set both dropdowns to ICP by default
  selectedGetTokenSymbol.value = 'ICP'
  
  // Find ICP token and set step 2 dropdown
  const icpToken = allTokens.value.find(t => t.symbol === 'ICP')
  if (icpToken) {
    selectedSwapFromToken.value = icpToken.principal
  }
  
  // Reset the manual change flag
  userChangedStep2Selection.value = false
}

const onStep2DropdownChange = () => {
  // User manually changed step 2 dropdown
  userChangedStep2Selection.value = true
}

const determineStartingStep = () => {
  const minimumSwapThreshold = 100000000n // 1 ICP equivalent threshold
  
  // If user has TACO, go to staking step
  if (hasTacoTokens.value) {
    currentStep.value = 3
    expandedSteps.value = new Set([3])
    return
  }
  
  // If user has swappable tokens above threshold, go to swap step
  if (hasSwappableTokens.value) {
    const hasSignificantTokens = swappableTokens.value.some(token => 
      token.balance > minimumSwapThreshold || 
      (token.priceUSD && token.priceUSD > 0 && 
       (Number(token.balance) / (10 ** token.decimals)) * token.priceUSD >= 1)
    )
    
    if (hasSignificantTokens) {
      currentStep.value = 2
      expandedSteps.value = new Set([2])
      return
    }
  }
  
  // Otherwise start with getting tokens
  currentStep.value = 1
  expandedSteps.value = new Set([1])
}

const toggleStep = (step: number) => {
  if (expandedSteps.value.has(step)) {
    expandedSteps.value.delete(step)
  } else {
    expandedSteps.value.add(step)
  }
}

const goToStep = (step: number) => {
  currentStep.value = step
  expandedSteps.value = new Set([step])
}

const copyToClipboard = async (text: string) => {
  try {
    await copy(text)
    tacoStore.addToast({
      id: Date.now(),
      code: 'copy-success',
      title: 'Copied!',
      icon: 'fa-solid fa-check',
      message: 'Address copied to clipboard'
    })
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'copy-error',
      title: 'Copy Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to copy to clipboard'
    })
  }
}

const getTokenByPrincipal = (principal: string): WalletToken | undefined => {
  return allTokens.value.find(t => t.principal === principal)
}





const performSwap = async () => {
  if (!canSwap.value) return
  
  const token = getTokenByPrincipal(selectedSwapFromToken.value)
  if (!token) return
  
  // Clear the swap & stake flag for regular swaps
  if (!isSwapAndStake.value) {
    isSwapAndStake.value = false
  }
  
  preselectedSwapToken.value = token
  showSwapDialog.value = true
}

const performSwapAndStake = async () => {
  if (!canSwap.value) return
  
  const token = getTokenByPrincipal(selectedSwapFromToken.value)
  if (!token) return
  
  // Set flags for auto-swap & stake
  isSwapAndStake.value = true
  isSwapping.value = true
  
  try {
    // Calculate max swap amount (all tokens minus fee)
    const maxSwapAmount = Number(token.balance - token.fee) / (10 ** token.decimals)
    
    console.log(`Auto-swapping ${maxSwapAmount} ${token.symbol} to TACO...`)
    
    // Convert amount to BigInt for quotes
    const amountInBigInt = BigInt(Math.floor(maxSwapAmount * (10 ** token.decimals)))
    
    // Get quotes from both exchanges
    const [kongQuote, icpSwapQuote] = await Promise.allSettled([
      kongStore.getQuote({
        sellTokenSymbol: token.symbol,
        buyTokenSymbol: 'TACO',
        amountIn: amountInBigInt
      }),
      icpswapStore.getQuote({
        sellTokenPrincipal: token.principal,
        buyTokenPrincipal: tacoStore.tacoPrincipal,
        amountIn: amountInBigInt
      })
    ])
    
    // Process quotes and find the best one
    const quotes = []
    
    if (kongQuote.status === 'fulfilled' && kongQuote.value) {
      quotes.push({
        exchange: 'Kong',
        amountOut: typeof kongQuote.value.receive_amount === 'bigint' ? kongQuote.value.receive_amount : BigInt(kongQuote.value.receive_amount),
        slippage: kongQuote.value.slippage,
        price: kongQuote.value.price,
        fee: 0,
        rawData: kongQuote.value
      })
    }
    
    if (icpSwapQuote.status === 'fulfilled' && icpSwapQuote.value) {
      quotes.push({
        exchange: 'ICPSwap',
        amountOut: typeof icpSwapQuote.value.amountOut === 'bigint' ? icpSwapQuote.value.amountOut : BigInt(icpSwapQuote.value.amountOut),
        slippage: icpSwapQuote.value.slippage,
        price: icpSwapQuote.value.effectivePrice,
        fee: typeof icpSwapQuote.value.fee === 'bigint' ? Number(icpSwapQuote.value.fee) : icpSwapQuote.value.fee,
        rawData: icpSwapQuote.value
      })
    }
    
    if (quotes.length === 0) {
      throw new Error('No swap quotes available')
    }
    
    // Sort by amount out (highest first) and pick the best
    const bestQuote = quotes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut))[0]
    
    console.log(`Using ${bestQuote.exchange} with expected output: ${Number(bestQuote.amountOut) / 1e8} TACO`)
    
    // Execute the swap with ICRC2 (preferred method)
    let swapResult
    const swapParams = {
      sellTokenPrincipal: token.principal,
      buyTokenPrincipal: tacoStore.tacoPrincipal,
      amountIn: amountInBigInt.toString(),
      amountOutMinimum: (BigInt(Math.floor(Number(bestQuote.amountOut) * 0.99))).toString(), // 1% slippage tolerance
      deadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      fee: bestQuote.fee
    }
    
    if (bestQuote.exchange === 'Kong') {
      swapResult = await kongStore.icrc2_swap(swapParams)
    } else {
      swapResult = await icpswapStore.icrc2_swap(swapParams)
    }
    
    if (swapResult.success) {
      console.log('Swap successful, proceeding with auto-staking...')
      await handleSwapSuccess(swapResult)
    } else {
      throw new Error(swapResult.error || 'Swap failed')
    }
    
  } catch (error: any) {
    console.error('Auto-swap & stake failed:', error)
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'swap-stake-failed',
      title: 'Swap & Stake Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to execute swap & stake. Please try manual swap.',
      type: 'error'
    })
  } finally {
    isSwapping.value = false
    isSwapAndStake.value = false
  }
}

const openSwapDialog = (token: WalletToken) => {
  preselectedSwapToken.value = token.symbol === 'TACO' ? null : token
  showSwapDialog.value = true
}

const closeSwapDialog = () => {
  showSwapDialog.value = false
  preselectedSwapToken.value = null
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
  
  closeSwapConfirmDialog()
  
  // Refresh wallet data first to get updated TACO balance
  await loadWalletData()
  
  if (isSwapAndStake.value) {
    // Auto-stake all the TACO we just received
    console.log('Auto-staking TACO after swap...')
    
    try {
      isStaking.value = true
      
      // Calculate max stakeable amount (balance - fee)
      const maxStakeAmount = tacoToken.value.balance - tacoToken.value.fee
      
      if (maxStakeAmount >= 100000000n) { // Minimum 1 TACO
        // Create neuron with all available TACO and default dissolve period
        const result = await tacoStore.createNeuron(maxStakeAmount)
        
        if (result.success && result.subaccount) {
          // Set default dissolve delay (28 days)
          try {
            const defaultDissolveDays = 28
            const delayMonths = defaultDissolveDays / 30
            await tacoStore.setNeuronDissolveDelay(result.subaccount, delayMonths)
            console.log(`Auto-set dissolve delay to ${defaultDissolveDays} days`)
          } catch (dissolveError: any) {
            console.warn('Failed to set dissolve delay for auto-created neuron:', dissolveError)
          }
          
          // Show success message
          tacoStore.addToast({
            id: Date.now(),
            code: 'swap-stake-success',
            title: 'Swap & Stake Complete!',
            icon: 'fa-solid fa-magic',
            message: `Successfully swapped and staked ${formatBalance(maxStakeAmount, 8)} TACO in a new neuron!`
          })
          
          // Mark staking as complete and move to final step
          stakingComplete.value = true
          goToStep(3)
          
        } else {
          throw new Error('Failed to create neuron')
        }
      } else {
        throw new Error('Insufficient TACO balance to create neuron (minimum 1 TACO required)')
      }
      
    } catch (error: any) {
      console.error('Auto-staking failed:', error)
      
      // Show error and fall back to manual staking
      tacoStore.addToast({
        id: Date.now(),
        code: 'swap-success-stake-failed',
        title: 'Swap Successful, Staking Failed',
        icon: 'fa-solid fa-exclamation-triangle',
        message: `Swap completed successfully, but auto-staking failed: ${error.message}. Please stake manually.`,
        type: 'warning'
      })
      
      // Move to staking step for manual staking
      goToStep(3)
    } finally {
      isStaking.value = false
      isSwapAndStake.value = false // Reset the flag
    }
    
  } else {
    // Regular swap - just show success message and move to staking step
    tacoStore.addToast({
      id: Date.now(),
      code: 'swap-success',
      title: 'Swap Successful',
      icon: 'fa-solid fa-check',
      message: `Successfully swapped to TACO`
    })
    
    // Move to staking step
    goToStep(3)
  }
}

const handleSwapError = (error: string) => {
  console.error('Swap failed:', error)
  
  tacoStore.addToast({
    id: Date.now(),
    code: 'swap-error',
    title: 'Swap Failed',
    icon: 'fa-solid fa-exclamation-triangle',
    message: error
  })
}

const stakeToExistingNeuron = (neuron: any) => {
  selectedNeuron.value = neuron
  showStakeDialog.value = true
}



const createNewNeuron = () => {
  showCreateDialog.value = true
}

const closeStakeDialog = () => {
  showStakeDialog.value = false
  selectedNeuron.value = null
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
}

const handleStakeCompleted = async (neuron: any) => {
  console.log('Staking completed for neuron:', neuron)
  
  closeStakeDialog()
  
  tacoStore.addToast({
    id: Date.now(),
    code: 'stake-success',
    title: 'Staking Successful',
    icon: 'fa-solid fa-check',
    message: 'Successfully staked TACO to neuron'
  })
  
  await loadWalletData()
  stakingComplete.value = true
}

const handleNeuronCreated = async () => {
  console.log('Neuron created successfully')
  
  closeCreateDialog()
  
  tacoStore.addToast({
    id: Date.now(),
    code: 'neuron-created',
    title: 'Neuron Created',
    icon: 'fa-solid fa-check',
    message: 'Successfully created new neuron'
  })
  
  await loadWalletData()
  stakingComplete.value = true
}

const goToWallet = () => {
  router.push('/wallet')
}

const resetWizard = () => {
  currentStep.value = 1
  expandedSteps.value = new Set([1])
  selectedSwapFromToken.value = ''
  stakingComplete.value = false
  isSwapAndStake.value = false
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
    
    // Update the dropdown to include the new token
    if (metadata?.symbol && metadata.symbol !== 'TACO') {
      selectedGetTokenSymbol.value = metadata.symbol
    }
    
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

// Watchers to sync token selections
watch(selectedGetTokenSymbol, (newSymbol) => {
  // Sync step 2 when step 1 changes (unless user manually changed step 2)
  if (!newSymbol || allTokens.value.length === 0) return
  syncSwapTokenSelection()
})

// Initialize selections when token data loads
watch(allTokens, (newTokens) => {
  if (newTokens.length > 0 && !selectedSwapFromToken.value) {
    initializeTokenSelections()
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  try {
    await tacoStore.checkIfLoggedIn()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (tacoStore.userLoggedIn) {
      await loadWalletData()
      
      // Initialize token selections after data loads
      if (allTokens.value.length > 0) {
        initializeTokenSelections()
      }
    } else {
      loading.value = false
    }
  } catch (error) {
    console.error('Error in wizard onMounted:', error)
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
  color: white;
}

.wizard-container {
  max-width: 1000px;
  margin: 0 auto;
}

.wizard-progress {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a202c, #2d3748);
  border-radius: 12px;
  border: 1px solid #4a5568;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 120px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  background: #4a5568;
  color: #a0aec0;
  border: 2px solid #4a5568;
}

.step.active .step-number {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.step.completed .step-number {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.step.current .step-number {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(var(--primary-color-rgb), 0.2);
  transform: scale(1.1);
}

.step-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #a0aec0;
}

.step.active .step-label {
  color: white;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #4a5568;
  transition: all 0.3s ease;
}

.step-connector.completed {
  background: var(--success-color);
}

.wizard-step-card {
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.wizard-step-card:hover {
  border-color: #718096;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.step-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: white;
}

.step-description {
  color: #a0aec0;
  margin: 0;
}

.step-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-step-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.completed-badge {
  background: var(--success-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.expand-button {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.expand-button:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.step-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #4a5568;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.get-tokens-section,
.swap-section,
.stake-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.token-selection,
.swap-input,
.amount-input,
.stake-amount-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.form-select,
.form-control {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
}

.form-select option {
  background: #2d3748;
  color: white;
}

.form-select:focus,
.form-control:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(var(--primary-color-rgb), 0.25);
  color: white;
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.instruction-card {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
}

.instruction-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #87ceeb;
}

.instruction-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #a0aec0;
}

.instruction-list li {
  margin-bottom: 0.5rem;
}

.account-display {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.account-header h6 {
  color: white;
  margin-bottom: 0.75rem;
}

.account-id-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.account-id {
  font-family: 'Courier New', monospace;
  background: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 4px;
  padding: 0.5rem;
  color: white;
  word-break: break-all;
  flex: 1;
  font-size: 0.85rem;
}

.register-token-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.register-token-section h6 {
  color: white;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.register-token-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.register-token-form .input-group {
  display: flex;
  gap: 0.5rem;
}

.register-token-form .form-control {
  flex: 1;
}

.register-token-form .btn {
  white-space: nowrap;
}

.current-balance {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
}

.current-balance h6 {
  color: white;
  margin-bottom: 0.75rem;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.balance-token-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.balance-info {
  flex: 1;
}

.balance-amount {
  font-weight: 600;
  color: white;
  font-size: 0.9rem;
}

.balance-usd {
  color: #a0aec0;
  font-size: 0.8rem;
}

.no-tokens {
  grid-column: 1 / -1;
  text-align: center;
  color: #a0aec0;
  padding: 1rem;
  font-style: italic;
}

.token-input-group {
  display: flex;
  gap: 0.5rem;
}

.token-info-display {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.selected-token-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-logo-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.token-details .token-name {
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.token-details .token-balance {
  color: #a0aec0;
  font-size: 0.85rem;
}

.swap-arrow {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.swap-arrow i {
  font-size: 1.5rem;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  padding: 0.75rem;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
}

.token-output-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.token-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.token-info {
  flex: 1;
}

.token-name {
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.token-balance {
  color: #a0aec0;
  font-size: 0.85rem;
}

.taco-balance-display {
  text-align: center;
  padding: 1.5rem;
  background: rgba(0, 128, 0, 0.1);
  border: 1px solid rgba(0, 128, 0, 0.3);
  border-radius: 8px;
}

.taco-balance-display h5 {
  color: white;
  margin-bottom: 1rem;
}

.taco-balance-display .balance-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--success-color);
  margin-bottom: 0.5rem;
}

.taco-balance-display .balance-usd {
  color: #a0aec0;
}

.existing-neurons {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
}

.existing-neurons h6 {
  color: white;
  margin-bottom: 0.75rem;
}

.neurons-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.neuron-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  position: relative;
}

.neuron-item.owned {
  border-left: 3px solid #ffd700; /* Gold for owned */
}

.neuron-item.hotkeyed {
  border-left: 3px solid #87ceeb; /* Light blue for hotkeyed */
}

.neuron-name {
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.neuron-stake {
  color: #a0aec0;
  font-size: 0.85rem;
  font-family: monospace;
}

.staking-options {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.staking-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.section-header {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-description {
  color: #a0aec0;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.create-neuron-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}



.create-neuron-content .btn-success {
  align-self: center;
}

.swap-stake-info {
  margin-bottom: 1.5rem;
}

.info-box {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.info-box h6 {
  margin: 0 0 0.75rem 0;
  color: #ffffff;
  font-weight: 600;
}

.preview-items {
  margin-bottom: 0.75rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item .label {
  color: #a0aec0;
  font-weight: 500;
}

.preview-item .value {
  color: #ffffff;
  font-weight: 600;
  text-align: right;
}

.info-note {
  margin: 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 0.85rem;
  color: #a0aec0;
  border-left: 3px solid rgba(0, 123, 255, 0.5);
}

.primary-action-btn {
  border: 2px solid rgba(40, 167, 69, 0.6) !important;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
  transition: all 0.2s ease;
}

.primary-action-btn:hover:not(:disabled) {
  border-color: rgba(40, 167, 69, 0.8) !important;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.3);
  transform: translateY(-1px);
}

.register-token-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.register-token-form {
  margin-top: 1rem;
}

.register-token-form .input-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: stretch;
}

.register-token-form .form-control {
  flex: 1;
  min-width: 250px;
  max-width: 100%;
}

.register-token-form .btn {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 140px;
}

@media (max-width: 768px) {
  .register-token-form .input-group {
    flex-direction: column;
  }
  
  .register-token-form .form-control {
    min-width: 100%;
  }
}

.account-help-text {
  color: #a0aec0 !important;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-top: 0.5rem;
  display: block;
}

.swap-section {
  display: flex;
  flex-direction: column;
  position: relative;
}

.swap-input {
  position: relative;
  z-index: 2;
}

.swap-input .swap-arrow {
  position: absolute;
  bottom: -20px; /* Position at bottom of input card */
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  width: 40px;
  height: 40px;
  background: #374151;
  border: 2px solid #4b5563;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.swap-output {
  position: relative;
  z-index: 1;
  margin-top: -20px; /* Overlap the cards */
}

.swap-arrow i {
  color: #ffffff;
}

/* Add circular cutouts to the cards */
.swap-input .token-info-display::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 22px;
  background: #374151; /* Match card background */
  border-radius: 0 0 22px 22px;
  z-index: 1;
}

.swap-output .token-output-display::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 22px;
  background: #374151; /* Match card background */
  border-radius: 22px 22px 0 0;
  z-index: 1;
}

.step-actions,
.swap-actions,
.stake-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: center;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  border-radius: 8px;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
}

.btn-success {
  background: linear-gradient(135deg, var(--success-color), var(--success-hover));
  border: none;
  transition: all 0.3s ease;
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--success-hover), var(--success-color));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--success-color-rgb), 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.success-message {
  text-align: center;
  padding: 2rem;
}

.success-message .alert {
  margin-bottom: 1.5rem;
}

.final-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.card {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  color: white !important;
}

.card-body {
  padding: 1.5rem;
  color: white !important;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .page-title h1 {
    font-size: 2rem;
  }
  
  .progress-steps {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step-connector {
    width: 2px;
    height: 30px;
    align-self: center;
  }
  
  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .step-controls {
    align-self: flex-end;
  }
  
  .swap-actions,
  .stake-actions {
    flex-direction: column;
  }
  
  .balance-grid {
    grid-template-columns: 1fr;
  }
  
  .register-token-form .input-group {
    flex-direction: column;
  }
  
  .register-token-form .btn {
    margin-top: 0.5rem;
  }
}
</style>
