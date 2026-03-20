<template>

  <div class="standard-view">

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- buy taco page -->
          <div class="buy-taco-view">

            <!-- title -->
            <TacoTitle level="h2" :emoji="selectedProduct === 'nachos' ? '🧀' : '🌮'" :title="selectedProduct === 'nachos' ? 'Fund & Mint' : 'Fund & Swap'" class="mt-4" />

            <!-- system paused banner -->
            <div v-if="systemPaused" class="buy-taco-view__paused-banner">
              <i class="fa-solid fa-triangle-exclamation me-2"></i>
              System is currently paused for maintenance. Purchases may be delayed.
            </div>

            <!-- how it works -->
            <div class="buy-taco-view__info taco-container taco-container--l1 w-100">
              <h3 class="buy-taco-view__section-title">How it works</h3>
              <div class="buy-taco-view__steps">
                <div class="buy-taco-view__step">
                  <span class="buy-taco-view__step-num">1</span>
                  <span>Fund your wallet with ICP using {{ selectedProvider === 'coinbase' ? 'Coinbase' : 'Transak' }}</span>
                </div>
                <div class="buy-taco-view__step">
                  <span class="buy-taco-view__step-num">2</span>
                  <span v-if="selectedProduct === 'nachos'">ICP is deposited to your NACHOS vault address</span>
                  <span v-else>ICP is deposited to your swap address</span>
                </div>
                <div class="buy-taco-view__step">
                  <span class="buy-taco-view__step-num">3</span>
                  <span v-if="selectedProduct === 'nachos'">Once ICP arrives, NACHOS are minted at current NAV</span>
                  <span v-else>Once ICP arrives, it is swapped to TACO on ICPSwap</span>
                </div>
                <div class="buy-taco-view__step">
                  <span class="buy-taco-view__step-num">4</span>
                  <span>{{ selectedProduct === 'nachos' ? 'NACHOS' : 'TACO' }} tokens arrive in your wallet</span>
                </div>
              </div>
            </div>

            <!-- login prompt (when not logged in) -->
            <div v-if="!tacoStore.userLoggedIn" class="buy-taco-view__login-prompt">
              <i class="fa-solid fa-lock"></i>
              <span>Log in to get started</span>
              <button class="btn iid-login" @click="tacoStore.iidLogIn()">
                <DfinityLogo />
                <span class="taco-text-white">Log in</span>
              </button>
            </div>

            <!-- buy interface (when logged in) -->
            <template v-if="tacoStore.userLoggedIn">

              <!-- buy card -->
              <div class="buy-taco-view__buy-card taco-container taco-container--l1 w-100">
                <h3 class="buy-taco-view__section-title">Fund with Fiat</h3>

                <!-- product toggle -->
                <div class="buy-taco-view__product-toggle">
                  <button :class="['buy-taco-view__product-btn', { active: selectedProduct === 'taco' }]"
                          :disabled="anySwapActive"
                          @click="selectedProduct = 'taco'">
                    TACO
                  </button>
                  <button :class="['buy-taco-view__product-btn', { active: selectedProduct === 'nachos' }]"
                          :disabled="anySwapActive"
                          @click="selectedProduct = 'nachos'">
                    NACHOS
                  </button>
                </div>

                <!-- provider toggle -->
                <div class="buy-taco-view__provider-toggle">
                  <button :class="['buy-taco-view__provider-btn', { active: selectedProvider === 'coinbase' }]"
                          @click="selectedProvider = 'coinbase'">
                    Coinbase
                  </button>
                  <button :class="['buy-taco-view__provider-btn', { active: selectedProvider === 'transak' }]"
                          @click="selectedProvider = 'transak'">
                    Transak
                  </button>
                </div>

                <!-- fiat amount + currency -->
                <div class="buy-taco-view__amount-row">
                  <div class="buy-taco-view__input-group" style="flex: 1;">
                    <label class="buy-taco-view__label">Amount</label>
                    <input type="text"
                           inputmode="decimal"
                           v-model="fiatAmount"
                           class="form-control taco-input"
                           placeholder="50" />
                  </div>
                  <div class="buy-taco-view__input-group" style="width: 6rem;">
                    <label class="buy-taco-view__label">Currency</label>
                    <select v-model="fiatCurrency" class="form-control taco-input">
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="CHF">CHF</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                      <option value="JPY">JPY</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                <!-- deposit address display -->
                <div class="buy-taco-view__deposit-addr">
                  <label class="buy-taco-view__label">Your ICP Address</label>
                  <code v-if="activeDepositAddress" class="buy-taco-view__addr-value">{{ activeDepositAddress }}</code>
                  <div v-else-if="activeAddrError" class="buy-taco-view__addr-error">
                    <span>Failed to load address</span>
                    <button class="btn btn-sm taco-btn" @click="retryLoadAddress">
                      <i class="fa-solid fa-arrows-rotate me-1"></i>Retry
                    </button>
                  </div>
                  <code v-else class="buy-taco-view__addr-value">
                    <i class="fa-solid fa-spinner fa-spin me-1"></i>Loading...
                  </code>
                </div>

                <!-- buy button -->
                <button class="btn taco-btn taco-btn--green w-100"
                        :disabled="anySwapActive || !activeDepositAddress || systemPaused"
                        @click="openBuy">
                  <i v-if="anySwapActive"
                     class="fa-solid fa-spinner fa-spin me-2"></i>
                  {{ activeBuyButtonText }}
                </button>
              </div>

              <!-- TACO order status + progress tracker -->
              <div v-if="selectedProduct === 'taco' && showProgress"
                   class="buy-taco-view__status taco-container taco-container--l2">
                <h4 class="buy-taco-view__section-title">Order Status</h4>
                <SwapProgressTracker
                  :steps="TACO_STEPS"
                  :current-step="currentStepNumber"
                  :status="tacoTrackerStatus"
                  :status-message="statusMessage"
                  :retry-count="swapProgress ? Number(swapProgress.retryCount) : 0"
                  :max-retries="MAX_RETRIES"
                  :error-message="progressErrorMessage || orderError"
                  :amounts="tacoAmounts"
                  :elapsed="tacoElapsed"
                />
              </div>

              <!-- NACHOS order status + progress tracker -->
              <div v-if="selectedProduct === 'nachos' && nachosShowProgress"
                   class="buy-taco-view__status taco-container taco-container--l2">
                <h4 class="buy-taco-view__section-title">Order Status</h4>
                <SwapProgressTracker
                  :steps="NACHOS_STEPS"
                  :current-step="nachosCurrentStep"
                  :status="nachosTrackerStatus"
                  :status-message="nachosStatusMessage"
                  :retry-count="nachosProgress ? Number(nachosProgress.retryCount) : 0"
                  :max-retries="MAX_RETRIES"
                  :error-message="nachosProgressError || nachosError"
                  :amounts="nachosAmounts"
                  :elapsed="nachosElapsed"
                />
              </div>

              <!-- claim pending (TACO or NACHOS based on product) -->
              <div class="buy-taco-view__claim taco-container taco-container--l1 w-100">
                <h3 class="buy-taco-view__section-title">Claim Pending {{ selectedProduct === 'nachos' ? 'NACHOS' : 'TACO' }}</h3>
                <p class="buy-taco-view__claim-desc">
                  If your purchase completed but {{ selectedProduct === 'nachos' ? 'NACHOS' : 'TACO' }} was not delivered automatically,
                  use this button to trigger a manual claim.
                </p>
                <button class="btn taco-btn taco-btn--green"
                        :disabled="claiming"
                        @click="selectedProduct === 'nachos' ? claimNachos() : claimTaco()">
                  <i v-if="claiming" class="fa-solid fa-spinner fa-spin me-2"></i>
                  {{ claiming ? 'Claiming...' : `Claim ${selectedProduct === 'nachos' ? 'NACHOS' : 'TACO'}` }}
                </button>
                <div v-if="claimResult"
                     class="buy-taco-view__claim-result"
                     :class="claimResult.success ? 'buy-taco-view__claim-result--success' : 'buy-taco-view__claim-result--error'">
                  {{ claimResult.message }}
                </div>
              </div>

              <!-- TACO order history -->
              <div v-if="selectedProduct === 'taco' && orderHistory.length > 0" class="buy-taco-view__history taco-container taco-container--l2">
                <h4 class="buy-taco-view__history-title">Order History</h4>
                <table class="buy-taco-view__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th class="text-end">Fiat</th>
                      <th class="text-end">ICP In</th>
                      <th class="text-end">TACO Out</th>
                      <th class="text-end">Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in orderHistory" :key="Number(order.id)">
                      <td>{{ formatTimestamp(order.timestamp) }}</td>
                      <td class="text-end">{{ formatFiat(order.fiatAmount, order.fiatCurrency) }}</td>
                      <td class="text-end">{{ formatE8s(order.icpDeposited) }}</td>
                      <td class="text-end">{{ formatE8s(order.tacoReceived) }}</td>
                      <td class="text-end">{{ formatClaimPath(order.claimPath) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- NACHOS order history -->
              <div v-if="selectedProduct === 'nachos' && nachosOrderHistory.length > 0" class="buy-taco-view__history taco-container taco-container--l2">
                <h4 class="buy-taco-view__history-title">Order History</h4>
                <table class="buy-taco-view__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th class="text-end">Fiat</th>
                      <th class="text-end">ICP In</th>
                      <th class="text-end">NACHOS Out</th>
                      <th class="text-end">NAV</th>
                      <th class="text-end">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in nachosOrderHistory" :key="Number(order.id)">
                      <td>{{ formatTimestamp(order.timestamp) }}</td>
                      <td class="text-end">{{ formatFiat(order.fiatAmount, order.fiatCurrency) }}</td>
                      <td class="text-end">{{ formatE8s(order.icpDeposited) }}</td>
                      <td class="text-end">{{ formatE8s(order.nachosReceived) }}</td>
                      <td class="text-end">{{ formatE8s(order.navUsed) }}</td>
                      <td class="text-end">{{ formatE8s(order.feeICP) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </template>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">

// buy taco view
.buy-taco-view {
  display: flex;
  flex-direction: column;
  color: var(--black-to-white);
  gap: 1.5rem;
  padding-bottom: 2rem;

  // section titles
  &__section-title {
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--brown-to-white);
  }

  // system paused banner
  &__paused-banner {
    padding: 0.75rem 1rem;
    background-color: rgba(244, 67, 54, 0.15);
    border: 1px solid var(--red);
    border-radius: 0.5rem;
    color: var(--red);
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    font-weight: 700;
  }

  // info section
  &__info {
    padding: 1.25rem;
  }

  // steps list
  &__steps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
  }

  &__step-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background-color: var(--dark-orange);
    color: var(--white);
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  // login prompt (mirrors NachosVaultView pattern)
  &__login-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    font-family: 'Space Mono', monospace;

    > i {
      font-size: 1.5rem;
      opacity: 0.6;
    }

    > span {
      font-size: 0.9rem;
      opacity: 0.75;
    }

    .iid-login {
      display: inline-flex;
      align-items: center;
      gap: 0.325rem;
      margin-top: 0.5rem;

      svg { width: 1.375rem; }

      span {
        font-size: 0.9rem;
        font-family: 'Space Mono', monospace;
      }

      &:active { border-color: transparent; }
    }
  }

  // product toggle
  &__product-toggle {
    display: flex;
    gap: 0;
    margin-bottom: 0.75rem;
    border: 1px solid var(--dark-orange);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  &__product-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--black-to-white);
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.15s;

    &.active {
      background-color: var(--dark-orange);
      color: var(--white);
    }

    &:not(.active):hover {
      background-color: var(--light-orange-to-dark-brown);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  // provider toggle
  &__provider-toggle {
    display: flex;
    gap: 0;
    margin-bottom: 1rem;
    border: 1px solid var(--dark-orange);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  &__provider-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--black-to-white);
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.15s;

    &.active {
      background-color: var(--dark-orange);
      color: var(--white);
    }

    &:not(.active):hover {
      background-color: var(--light-orange-to-dark-brown);
    }
  }

  // buy card
  &__buy-card {
    padding: 1.25rem;
  }

  // amount row (input + currency side by side)
  &__amount-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  // input group
  &__input-group {
    margin-bottom: 0;
  }

  &__label {
    display: block;
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: var(--brown-to-white);
  }

  // deposit address
  &__deposit-addr {
    margin-bottom: 1rem;
  }

  &__addr-value {
    display: block;
    font-size: 0.7rem;
    word-break: break-all;
    padding: 0.5rem;
    background-color: var(--light-orange-to-dark-brown);
    border-radius: 0.25rem;
    border: 1px solid var(--dark-orange);
    color: var(--black-to-white);
  }

  &__addr-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background-color: var(--light-orange-to-dark-brown);
    border-radius: 0.25rem;
    border: 1px solid var(--red, #dc3545);
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
    color: var(--red, #dc3545);

    .btn {
      font-size: 0.75rem;
      font-family: 'Space Mono', monospace;
      padding: 0.2rem 0.5rem;
    }
  }

  // status section
  &__status {
    padding: 1rem;
  }

  &__status-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
  }

  &__status-icon {
    font-size: 1.25rem;
  }

  &__status-text {
    flex: 1;
  }

  // (progress bar styles removed — now in SwapProgressTracker component)

  // claim section
  &__claim {
    padding: 1.25rem;
  }

  &__claim-desc {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-bottom: 0.75rem;
  }

  &__claim-result {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;

    &--success {
      background-color: rgba(76, 175, 80, 0.15);
      color: var(--success-green);
    }

    &--error {
      background-color: rgba(244, 67, 54, 0.15);
      color: var(--red);
    }
  }

  // order history
  &__history {
    border-top: 1px solid rgba(128, 128, 128, 0.15);
    padding-top: 0.75rem;
  }

  &__history-title {
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  &__table {
    width: 100%;
    font-size: 0.7rem;
    font-family: 'Space Mono', monospace;
    border-collapse: collapse;

    th, td {
      padding: 0.25rem 0.375rem;
      border-bottom: 1px solid var(--dark-orange-to-brown);
    }

    th {
      font-size: 0.65rem;
      text-transform: uppercase;
      opacity: 0.7;
      font-weight: 600;
      border-bottom: 2px solid var(--dark-orange-to-brown);
    }
  }
}

</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import TacoTitle from '../components/misc/TacoTitle.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'
import SwapProgressTracker from '../components/misc/SwapProgressTracker.vue'
import type { ProgressStep, ProgressAmount } from '../components/misc/SwapProgressTracker.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'
import { storeToRefs } from 'pinia'
import { getEffectiveNetwork } from '../config/network-config'
import { useAdminCheck } from '../composables/useAdminCheck'
import { Principal } from '@dfinity/principal'
import type { SwapProgress, NachosSwapProgress, NachosOrderRecord } from '../../../declarations/taco_swap/taco_swap.did'

///////////////
// constants //
///////////////

// Coinbase Onramp
const COINBASE_SESSION_WORKER = 'https://taco-onramp-session.xykominos.workers.dev'

// Transak staging
const TRANSAK_API_KEY = 'fac6ce0c-2b65-4982-a2e3-42e1c5fa15dc'
const TRANSAK_BASE_URL = 'https://global-stg.transak.com'
const TACO_BRAND_COLOR = 'DA8D28'

// Swap progress — TACO (7 steps)
const TACO_STEPS: ProgressStep[] = [
  { key: 'waiting',  label: 'Fund Wallet',  description: 'Purchasing ICP via fiat provider',            activeDescription: 'Funding your wallet with ICP...' },
  { key: 'deposit',  label: 'ICP Deposit',  description: 'ICP arriving at your address',                activeDescription: 'Watching for ICP deposit...' },
  { key: 'quote',    label: 'Quote',     description: 'Fetching the best TACO price from ICPSwap',   activeDescription: 'Getting quote...' },
  { key: 'transfer', label: 'Transfer',  description: 'Moving ICP to the swap pool',                 activeDescription: 'Transferring to pool...' },
  { key: 'swap',     label: 'Swap',      description: 'Executing the ICP to TACO swap',              activeDescription: 'Swapping tokens...' },
  { key: 'deliver',  label: 'Deliver',   description: 'Sending TACO to your wallet',                 activeDescription: 'Delivering TACO...' },
  { key: 'done',     label: 'Complete',  description: 'TACO delivered successfully!',                 activeDescription: 'Done!' },
]
const MAX_RETRIES = 3
const POLL_ACTIVE_MS = 2_000    // Active swap: poll every 2s
const POLL_PENDING_MS = 10_000  // Pending retry: poll every 10s
const DEPOSIT_POLL_MS = 3_000   // Poll ICP ledger every 3s during deposit phase
const MAX_POLL_DURATION_MS = 1_200_000 // 20 minutes
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const DEPOSIT_MIN_E8S = 10_000n // ~0.0001 ICP — above dust/fee threshold

// NACHOS (4 steps)
const NACHOS_STEPS: ProgressStep[] = [
  { key: 'deposit',  label: 'Fund Wallet',        description: 'ICP arriving at your address',                   activeDescription: 'Watching for your ICP deposit...' },
  { key: 'treasury', label: 'Treasury Transfer',  description: 'Moving ICP to the NACHOS treasury',             activeDescription: 'Transferring ICP to treasury...' },
  { key: 'minting',  label: 'Mint NACHOS',        description: 'Minting NACHOS tokens based on current NAV',    activeDescription: 'Minting your NACHOS...' },
  { key: 'done',     label: 'Complete',            description: 'NACHOS delivered to your wallet',               activeDescription: 'Done!' },
]

////////////
// stores //
////////////

const router = useRouter()
const route = useRoute()
const tacoStore = useTacoStore()
const { userPrincipal, darkModeToggled, userLoggedIn } = storeToRefs(tacoStore)
const { isAdmin } = useAdminCheck()

/////////////////
// local state //
/////////////////

type UIPhase = 'idle' | 'registering' | 'polling' | 'success' | 'error'
type Provider = 'coinbase' | 'transak'
type Product = 'taco' | 'nachos'

// Product & provider
const selectedProduct = ref<Product>(route.query.product === 'nachos' ? 'nachos' : 'taco')
const selectedProvider = ref<Provider>('coinbase')
const fiatAmount = ref('50')
const fiatCurrency = ref('EUR')

// TACO state
const uiPhase = ref<UIPhase>('idle')
const orderError = ref<string | null>(null)
const orderId = ref<string | null>(null)
const claiming = ref(false)
const claimResult = ref<{ success: boolean; message: string } | null>(null)
const swapProgress = ref<SwapProgress | null>(null)

// NACHOS state
const nachosPhase = ref<UIPhase>('idle')
const nachosError = ref<string | null>(null)
const nachosProgress = ref<NachosSwapProgress | null>(null)
const nachosOrderHistory = ref<NachosOrderRecord[]>([])
const nachosDepositAddress = ref('')

// canister data (shared/TACO)
const depositAddress = ref('')
const orderHistory = ref<any[]>([])
const systemPaused = ref(false)

// Transak SDK instance ref (for cleanup on unmount)
let transakInstance: any = null

// Deposit subaccounts (from get_full_swap_state)
const tacoDepositSubaccount = ref<Uint8Array | null>(null)
const nachosDepositSubaccount = ref<Uint8Array | null>(null)

// Live deposit balance (for UI display during Phase 1)
const depositBalance = ref<bigint>(0n)
const nachosDepositBalance = ref<bigint>(0n)

// Phase 1: Deposit polling (ICP ledger icrc1_balance_of)
let depositPollInterval: ReturnType<typeof setInterval> | null = null

// Phase 2: Swap polling (get_full_swap_state query)
let unifiedPollInterval: ReturnType<typeof setInterval> | null = null
let currentPollRate = 0

////////////////////
// computed props //
////////////////////

// --- TACO computed ---

const isActive = computed(() =>
  uiPhase.value === 'registering' || uiPhase.value === 'polling'
)

const showProgress = computed(() =>
  uiPhase.value !== 'idle'
)

const isDepositPolling = computed(() =>
  uiPhase.value === 'polling' && depositPollInterval !== null
)

const currentStepNumber = computed(() => {
  if (!swapProgress.value) {
    // During Phase 1 (deposit polling), show step 0 (Waiting)
    if (isDepositPolling.value) return 0
    return -1
  }
  return Number(swapProgress.value.stepNumber)
})

const isComplete = computed(() =>
  swapProgress.value != null && 'Complete' in swapProgress.value.step
)

const isFailed = computed(() =>
  swapProgress.value != null && 'Failed' in swapProgress.value.step
)

const progressIcpAmount = computed(() => {
  const amt = swapProgress.value?.icpAmount
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressEstimatedTaco = computed(() => {
  const amt = swapProgress.value?.estimatedTaco
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressActualTaco = computed(() => {
  const amt = swapProgress.value?.actualTaco
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressErrorMessage = computed(() => {
  const msg = swapProgress.value?.errorMessage
  return msg && msg.length > 0 ? (msg[0] as string) : null
})

const buyButtonText = computed(() => {
  if (systemPaused.value) return 'System Paused'
  if (uiPhase.value === 'registering') return 'Registering...'
  if (uiPhase.value === 'polling') {
    if (isDepositPolling.value) return 'Waiting for ICP...'
    if (swapProgress.value) {
      const step = swapProgress.value.step
      if ('WaitingForDeposit' in step || 'NotStarted' in step) return 'Waiting for ICP...'
      return 'Swapping...'
    }
  }
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
})

const statusMessage = computed(() => {
  if (uiPhase.value === 'registering') return 'Registering payment with canister...'
  if (isDepositPolling.value) {
    if (depositBalance.value > 0n) return `ICP deposit detected: ${formatE8s(depositBalance.value)} ICP — claiming...`
    return 'Waiting for ICP deposit...'
  }
  if (swapProgress.value && uiPhase.value !== 'idle') return swapProgress.value.description
  if (uiPhase.value === 'error') return orderError.value || 'An error occurred.'
  if (uiPhase.value === 'success') return 'Swap complete! TACO delivered.'
  return ''
})

// --- NACHOS computed ---

const nachosIsActive = computed(() =>
  nachosPhase.value === 'registering' || nachosPhase.value === 'polling'
)

const nachosShowProgress = computed(() =>
  nachosPhase.value !== 'idle'
)

const nachosIsDepositPolling = computed(() =>
  nachosPhase.value === 'polling' && depositPollInterval !== null
)

const nachosCurrentStep = computed(() => {
  if (!nachosProgress.value) {
    if (nachosIsDepositPolling.value) return 0
    return -1
  }
  return Number(nachosProgress.value.stepNumber)
})

const nachosIsComplete = computed(() =>
  nachosProgress.value != null && 'Complete' in nachosProgress.value.step
)

const nachosIsFailed = computed(() =>
  nachosProgress.value != null && 'Failed' in nachosProgress.value.step
)

const nachosProgressIcp = computed(() => {
  const amt = nachosProgress.value?.icpAmount
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const nachosProgressEstimated = computed(() => {
  const amt = nachosProgress.value?.estimatedNachos
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const nachosProgressActual = computed(() => {
  const amt = nachosProgress.value?.actualNachos
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const nachosProgressError = computed(() => {
  const msg = nachosProgress.value?.errorMessage
  return msg && msg.length > 0 ? (msg[0] as string) : null
})

const nachosBuyButtonText = computed(() => {
  if (systemPaused.value) return 'System Paused'
  if (nachosPhase.value === 'registering') return 'Starting...'
  if (nachosPhase.value === 'polling') {
    if (nachosIsDepositPolling.value) return 'Waiting for ICP...'
    if (nachosProgress.value) {
      const step = nachosProgress.value.step
      if ('NotStarted' in step) return 'Waiting for ICP...'
      if ('DepositReceived' in step) return 'Deposit received...'
      if ('TransferringToTreasury' in step) return 'Transferring...'
      if ('MintingNachos' in step) return 'Minting...'
      return 'Processing...'
    }
  }
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
})

const nachosStatusMessage = computed(() => {
  if (nachosPhase.value === 'registering') return 'Starting NACHOS mint...'
  if (nachosIsDepositPolling.value) {
    if (nachosDepositBalance.value > 0n) return `ICP deposit detected: ${formatE8s(nachosDepositBalance.value)} ICP — claiming...`
    return 'Waiting for ICP deposit...'
  }
  if (nachosProgress.value && nachosPhase.value !== 'idle') return nachosProgress.value.description
  if (nachosPhase.value === 'error') return nachosError.value || 'An error occurred.'
  if (nachosPhase.value === 'success') return 'NACHOS delivered to your wallet!'
  return ''
})

// --- NACHOS terminal failure ---

const nachosIsTerminalFailure = computed(() =>
  nachosIsFailed.value && nachosProgress.value != null
    && nachosProgress.value.retryCount >= BigInt(MAX_RETRIES)
)

// --- Cross-product computed ---

const anySwapActive = computed(() => isActive.value || nachosIsActive.value)

const activeDepositAddress = computed(() =>
  selectedProduct.value === 'nachos' ? nachosDepositAddress.value : depositAddress.value
)

const activeAddrError = computed(() =>
  selectedProduct.value === 'nachos' ? nachosAddrError.value : tacoAddrError.value
)

const retryLoadAddress = () => {
  if (selectedProduct.value === 'nachos') {
    loadNachosDepositAddress().catch(console.error)
  } else {
    loadDepositAddress().catch(console.error)
  }
}

const activeBuyButtonText = computed(() =>
  selectedProduct.value === 'nachos' ? nachosBuyButtonText.value : buyButtonText.value
)

// --- SwapProgressTracker computed ---

const tacoTrackerStatus = computed<'idle' | 'active' | 'complete' | 'failed'>(() => {
  if (uiPhase.value === 'success' || isComplete.value) return 'complete'
  if (uiPhase.value === 'error' || isFailed.value) return 'failed'
  if (isActive.value) return 'active'
  return 'idle'
})

const nachosTrackerStatus = computed<'idle' | 'active' | 'complete' | 'failed'>(() => {
  if (nachosPhase.value === 'success' || nachosIsComplete.value) return 'complete'
  if (nachosPhase.value === 'error' || nachosIsFailed.value) return 'failed'
  if (nachosIsActive.value) return 'active'
  return 'idle'
})

const tacoAmounts = computed<ProgressAmount[]>(() => {
  const items: ProgressAmount[] = []
  if (fiatAmount.value && isActive.value) items.push({ label: 'Fiat paid', value: `${fiatAmount.value} ${fiatCurrency.value}` })
  if (progressIcpAmount.value) items.push({ label: 'ICP deposited', value: `${progressIcpAmount.value} ICP` })
  if (progressEstimatedTaco.value && !isComplete.value) items.push({ label: 'Estimated TACO', value: `~${progressEstimatedTaco.value}` })
  if (progressActualTaco.value) items.push({ label: 'TACO received', value: `${progressActualTaco.value} TACO`, highlight: true })
  return items
})

const nachosAmounts = computed<ProgressAmount[]>(() => {
  const items: ProgressAmount[] = []
  if (fiatAmount.value && nachosIsActive.value) items.push({ label: 'Fiat paid', value: `${fiatAmount.value} ${fiatCurrency.value}` })
  if (nachosProgressIcp.value) items.push({ label: 'ICP deposited', value: `${nachosProgressIcp.value} ICP` })
  if (nachosProgressEstimated.value && !nachosIsComplete.value) items.push({ label: 'Estimated NACHOS', value: `~${nachosProgressEstimated.value}` })
  if (nachosProgressActual.value) items.push({ label: 'NACHOS received', value: `${nachosProgressActual.value} NACHOS`, highlight: true })
  return items
})

// --- Elapsed time tracking ---

const tacoStartTime = ref<number | null>(null)
const tacoElapsed = ref(0)
const nachosStartTime = ref<number | null>(null)
const nachosElapsed = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const startElapsedTimer = () => {
  if (elapsedInterval) return
  elapsedInterval = setInterval(() => {
    if (tacoStartTime.value != null && isActive.value) {
      tacoElapsed.value = Math.floor((Date.now() - tacoStartTime.value) / 1000)
    }
    if (nachosStartTime.value != null && nachosIsActive.value) {
      nachosElapsed.value = Math.floor((Date.now() - nachosStartTime.value) / 1000)
    }
    // Stop if neither active
    if (!isActive.value && !nachosIsActive.value) {
      stopElapsedTimer()
    }
  }, 1000)
}

const stopElapsedTimer = () => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
}

///////////////////
// local methods //
///////////////////

/** Format e8s (bigint) to human-readable decimal */
const formatE8s = (e8s: bigint): string => {
  const whole = e8s / 100_000_000n
  const frac = e8s % 100_000_000n
  const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '')
  return fracStr ? `${whole}.${fracStr}` : whole.toString()
}

/** Format timestamp (nanoseconds) to date string */
const formatTimestamp = (ns: bigint): string => {
  const ms = Number(ns / 1_000_000n)
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format ClaimPath variant to display string */
const formatClaimPath = (path: any): string => {
  if ('FrontendClaim' in path) return 'Auto'
  if ('WebhookClaim' in path) return 'Webhook'
  if ('ManualClaim' in path) return 'Manual'
  if ('TimerSweep' in path) return 'Timer'
  if ('CoinbaseWebhook' in path) return 'Coinbase'
  return '?'
}

/** Format optional fiat amount + currency from Candid opt fields */
const formatFiat = (amount: [] | [string], currency: [] | [string]): string => {
  const a = amount?.[0]
  const c = currency?.[0]
  if (!a) return '—'
  return c ? `${a} ${c}` : a
}

/** Generate a unique order ID */
const generateOrderId = (): string => {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `taco-${ts}-${rand}`
}

// ==========================
// TACO functions
// ==========================

/** Load TACO deposit address from canister (query call — fast) */
const tacoAddrError = ref(false)
const loadDepositAddress = async () => {
  tacoAddrError.value = false
  try {
    const actor = await tacoStore.createTacoSwapActor()
    depositAddress.value = await (actor as any).get_deposit_address()
  } catch (err) {
    console.error('Failed to load deposit address:', err)
    tacoAddrError.value = true
  }
}

/** Load canister config (system paused state) */
const loadConfig = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActorAnonymous()
    const config = await (actor as any).get_config()
    systemPaused.value = config.systemPaused
  } catch (err) {
    console.error('Failed to load swap config:', err)
  }
}

/** Load TACO order history */
const loadOrderHistory = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    orderHistory.value = await (actor as any).get_my_orders(20n)
  } catch (err) {
    console.error('Failed to load order history:', err)
  }
}

/** Open the selected provider's purchase widget */
const openBuy = () => {
  if (selectedProduct.value === 'nachos') {
    if (selectedProvider.value === 'coinbase') openCoinbaseNachos()
    else openTransakNachos()
  } else {
    if (selectedProvider.value === 'coinbase') openCoinbase()
    else openTransak()
  }
}

/** Register payment intent with the canister (TACO only). Returns true if OK to proceed. */
const registerPayment = async (): Promise<boolean> => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).register_payment([])

    if ('NotAuthorized' in result) {
      uiPhase.value = 'error'
      orderError.value = 'Not authorized. Please log in again.'
      return false
    }
    // 'Ok' or 'AlreadyProcessing' — both fine to proceed
    return true
  } catch (err: any) {
    uiPhase.value = 'error'
    orderError.value = `Failed to register payment: ${err.message || err}`
    return false
  }
}

/** Open Coinbase Onramp popup with session token (TACO) */
const openCoinbase = async () => {
  if (!depositAddress.value) {
    orderError.value = 'Deposit address not loaded. Please refresh and try again.'
    uiPhase.value = 'error'
    return
  }

  orderId.value = generateOrderId()
  uiPhase.value = 'registering'
  orderError.value = null
  claimResult.value = null
  swapProgress.value = null

  // 0. Register payment intent with backend
  const ok = await registerPayment()
  if (!ok) return

  try {
    // 1. Get session token from CF Worker
    const resp = await fetch(COINBASE_SESSION_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [{ address: depositAddress.value }],
        assets: ['ICP'],
      }),
    })
    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(`Session token error: ${err.error} ${err.details || ''}`)
    }
    const { token: sessionToken } = await resp.json()

    // 2. Generate Coinbase onramp URL
    const { generateOnRampURL } = await import('@coinbase/cbpay-js')

    const onrampUrl = generateOnRampURL({
      sessionToken,
      addresses: { [depositAddress.value]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    // 3. Open popup + start Phase 1 deposit polling (ICP ledger)
    uiPhase.value = 'polling'
    tacoStartTime.value = Date.now()
    tacoElapsed.value = 0
    startElapsedTimer()
    const popup = window.open(onrampUrl, 'coinbase-onramp', 'width=500,height=700,scrollbars=yes,resizable=yes')
    startDepositPolling('taco')

    // 4. When popup closes, keep polling — grace period if still waiting for deposit
    const popupPoll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupPoll)
        handlePopupClose(swapProgress, uiPhase, () => {
          swapProgress.value = null
          orderId.value = null
        })
      }
    }, 1500)

  } catch (err: any) {
    console.error('Failed to open Coinbase Onramp:', err)
    uiPhase.value = 'error'
    orderError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Build Transak widget URL with all required query parameters */
const buildTransakUrl = (addr: string, title: string): string => {
  const params = new URLSearchParams({
    apiKey: TRANSAK_API_KEY,
    referrerDomain: window.location.origin,
    productsAvailed: 'BUY',
    cryptoCurrencyCode: 'ICP',
    cryptoCurrencyList: 'ICP',
    network: 'mainnet',
    walletAddress: addr,
    disableWalletAddressForm: 'true',
    exchangeScreenTitle: title,
    themeColor: TACO_BRAND_COLOR,
    hideMenu: 'true',
    hideExchangeScreen: 'true',
    isFeeCalculationHidden: 'true',
    defaultFiatCurrency: fiatCurrency.value,
    defaultFiatAmount: fiatAmount.value || '50',
    partnerCustomerId: userPrincipal.value,
    partnerOrderId: orderId.value || generateOrderId(),
    colorMode: 'DARK',
  })

  return `${TRANSAK_BASE_URL}?${params.toString()}`
}

/** Open the Transak widget to initiate the purchase flow (TACO) */
const openTransak = async () => {
  if (!depositAddress.value) {
    orderError.value = 'Deposit address not loaded. Please refresh and try again.'
    uiPhase.value = 'error'
    return
  }

  orderId.value = generateOrderId()
  uiPhase.value = 'registering'
  orderError.value = null
  claimResult.value = null
  swapProgress.value = null

  // 0. Register payment intent with backend
  const ok = await registerPayment()
  if (!ok) return

  try {
    uiPhase.value = 'polling'
    tacoStartTime.value = Date.now()
    tacoElapsed.value = 0
    startElapsedTimer()

    // dynamic import of Transak SDK (lazy load — only downloaded when user clicks Buy)
    const { Transak } = await import('@transak/ui-js-sdk')

    const widgetUrl = buildTransakUrl(depositAddress.value, 'Buy TACO')
    transakInstance = new Transak({ widgetUrl })
    transakInstance.init()

    // Start Phase 1 deposit polling (ICP ledger)
    startDepositPolling('taco')

    // event: order created
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data: any) => {
      console.log('Transak order created:', data)
    })

    // event: order successful (ICP purchased and sent)
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data: any) => {
      console.log('Transak order successful:', data)
    })

    // event: widget closed — must call close() to remove the iframe from DOM
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      console.log('Transak widget closed')
      if (transakInstance) {
        transakInstance.close()
        transakInstance = null
      }
      handlePopupClose(swapProgress, uiPhase, () => {
        swapProgress.value = null
        orderId.value = null
      })
    })

  } catch (err: any) {
    console.error('Failed to initialize Transak:', err)
    uiPhase.value = 'error'
    orderError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Shared popup-close logic: 5-min grace if still at WaitingForDeposit/NotStarted */
const handlePopupClose = (
  progressRef: { value: any },
  phaseRef: { value: UIPhase },
  resetFn: () => void,
) => {
  if (phaseRef.value === 'polling' && progressRef.value) {
    const step = progressRef.value.step
    if ('NotStarted' in step || 'WaitingForDeposit' in step) {
      setTimeout(() => {
        if (phaseRef.value === 'polling' && progressRef.value) {
          const currentStep = progressRef.value.step
          if ('NotStarted' in currentStep || 'WaitingForDeposit' in currentStep) {
            phaseRef.value = 'idle'
            resetFn()
            stopDepositPolling()
            maybeStopPolling()
          }
        }
      }, 300_000) // 5 minutes
    }
  } else if (phaseRef.value === 'polling' && !progressRef.value) {
    setTimeout(() => {
      if (phaseRef.value === 'polling' && !progressRef.value) {
        phaseRef.value = 'idle'
        resetFn()
        stopDepositPolling()
        maybeStopPolling()
      }
    }, 300_000)
  }
}

// ==========================
// Unified polling via get_full_swap_state()
// ==========================

/** Start unified polling — one query updates both TACO and NACHOS state */
const startUnifiedPolling = (intervalMs: number) => {
  // If already polling at a faster or equal rate, don't restart
  if (unifiedPollInterval && intervalMs >= currentPollRate) return

  stopUnifiedPolling()
  currentPollRate = intervalMs
  const startedAt = Date.now()

  unifiedPollInterval = setInterval(async () => {
    // Timeout guard
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopUnifiedPolling()
      if (uiPhase.value === 'polling') {
        uiPhase.value = 'error'
        orderError.value = 'Swap timed out. You can try the manual "Claim TACO" button below.'
      }
      if (nachosPhase.value === 'polling') {
        nachosPhase.value = 'error'
        nachosError.value = 'Mint timed out. You can try the manual "Claim NACHOS" button below.'
      }
      return
    }

    try {
      const actor = await tacoStore.createTacoSwapActor()
      const state = await (actor as any).get_full_swap_state()

      // --- Update TACO ---
      if (uiPhase.value === 'polling') {
        swapProgress.value = state.tacoStatus
        const step = state.tacoStatus.step

        if ('Complete' in step) {
          uiPhase.value = 'success'
          loadOrderHistory().catch(console.error)
          maybeStopPolling()
          return
        }

        if ('Failed' in step && state.tacoStatus.retryCount >= BigInt(MAX_RETRIES)) {
          uiPhase.value = 'error'
          orderError.value = progressErrorMessage.value
            || 'Swap failed after multiple retries. Use the manual Claim button or contact support.'
          maybeStopPolling()
          return
        }
      }

      // --- Update NACHOS ---
      if (nachosPhase.value === 'polling') {
        nachosProgress.value = state.nachosStatus
        const step = state.nachosStatus.step

        if ('Complete' in step) {
          nachosPhase.value = 'success'
          loadNachosOrderHistory().catch(console.error)
          maybeStopPolling()
          return
        }

        if ('Failed' in step && !state.hasPendingNachos) {
          nachosPhase.value = 'error'
          nachosError.value = nachosProgressError.value
            || 'Mint failed. Use the manual Claim button or contact support.'
          maybeStopPolling()
          return
        }
      }
    } catch (err) {
      console.error('Error polling full swap state:', err)
    }
  }, intervalMs)
}

/** Stop the unified poll if neither TACO nor NACHOS needs it */
const maybeStopPolling = () => {
  if (uiPhase.value !== 'polling' && nachosPhase.value !== 'polling') {
    stopUnifiedPolling()
  }
}

/** Stop the unified polling interval */
const stopUnifiedPolling = () => {
  if (unifiedPollInterval) {
    clearInterval(unifiedPollInterval)
    unifiedPollInterval = null
    currentPollRate = 0
  }
}

// ==========================
// Initial state + resume via get_full_swap_state()
// ==========================

/**
 * Load initial swap state from get_full_swap_state().
 * Determines whether to show idle, resume polling, or show results.
 * KEY BUG FIX: If no active lock AND no pending retry, treat stale
 * WaitingForDeposit/NotStarted as idle (don't resume).
 */
const loadInitialState = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    const state = await (actor as any).get_full_swap_state()

    // Store deposit subaccounts for ledger polling
    tacoDepositSubaccount.value = state.tacoDepositSubaccount instanceof Uint8Array
      ? state.tacoDepositSubaccount
      : new Uint8Array(state.tacoDepositSubaccount)
    nachosDepositSubaccount.value = state.nachosDepositSubaccount instanceof Uint8Array
      ? state.nachosDepositSubaccount
      : new Uint8Array(state.nachosDepositSubaccount)

    // --- TACO status ---
    const tacoStep = state.tacoStatus.step
    const tacoIsNotStarted = 'NotStarted' in tacoStep
    const tacoIsComplete = 'Complete' in tacoStep
    const tacoIsWaiting = 'WaitingForDeposit' in tacoStep
    const tacoIsFailed = 'Failed' in tacoStep
    const tacoTerminal = tacoIsFailed && state.tacoStatus.retryCount >= BigInt(MAX_RETRIES)

    // Stale = no lock, no pending retry, and still just waiting/not started
    const tacoIsStale = !state.hasActiveLock && !state.hasPendingTaco
      && (tacoIsNotStarted || tacoIsWaiting)

    if (tacoIsStale) {
      // Do nothing — leave uiPhase as 'idle'
    } else if (tacoIsComplete) {
      const updatedMs = Number(state.tacoStatus.updatedAt / 1_000_000n)
      if (Date.now() - updatedMs < 300_000) {
        swapProgress.value = state.tacoStatus
        uiPhase.value = 'success'
      }
    } else if (tacoTerminal) {
      swapProgress.value = state.tacoStatus
      uiPhase.value = 'error'
      orderError.value = state.tacoStatus.errorMessage.length > 0
        ? (state.tacoStatus.errorMessage[0] as string)
        : 'Swap failed. Use the manual Claim button.'
    } else if (tacoIsFailed && state.hasPendingTaco) {
      swapProgress.value = state.tacoStatus
      uiPhase.value = 'polling'
      startUnifiedPolling(POLL_PENDING_MS)
    } else if (tacoIsWaiting && state.hasActiveLock) {
      // Genuinely active WaitingForDeposit — poll ledger for ICP arrival
      swapProgress.value = state.tacoStatus
      uiPhase.value = 'polling'
      startDepositPolling('taco')
    } else if (!tacoIsNotStarted && !tacoIsWaiting) {
      // Past deposit phase (DepositReceived, GettingQuote, etc.) — poll swap state
      swapProgress.value = state.tacoStatus
      uiPhase.value = 'polling'
      startUnifiedPolling(POLL_ACTIVE_MS)
    }

    // --- NACHOS status ---
    const nachosStep = state.nachosStatus.step
    const nachosIsNotStarted = 'NotStarted' in nachosStep
    const nachosIsWaiting = 'WaitingForDeposit' in nachosStep
    const nachosIsComplete_ = 'Complete' in nachosStep
    const nachosIsFailed_ = 'Failed' in nachosStep

    const nachosIsStale = !state.hasActiveLock && !state.hasPendingNachos
      && (nachosIsNotStarted || nachosIsWaiting)

    if (nachosIsStale) {
      // Idle
    } else if (nachosIsComplete_) {
      const updatedMs = Number(state.nachosStatus.updatedAt / 1_000_000n)
      if (Date.now() - updatedMs < 300_000) {
        nachosProgress.value = state.nachosStatus
        nachosPhase.value = 'success'
      }
    } else if (nachosIsFailed_ && !state.hasPendingNachos) {
      nachosProgress.value = state.nachosStatus
      nachosPhase.value = 'error'
      nachosError.value = state.nachosStatus.errorMessage.length > 0
        ? (state.nachosStatus.errorMessage[0] as string)
        : 'Mint failed. Use the manual Claim button.'
    } else if (nachosIsFailed_ && state.hasPendingNachos) {
      nachosProgress.value = state.nachosStatus
      nachosPhase.value = 'polling'
      selectedProduct.value = 'nachos'
      startUnifiedPolling(POLL_PENDING_MS)
    } else if (nachosIsWaiting && state.hasActiveLock) {
      // Genuinely active WaitingForDeposit — poll ledger
      nachosProgress.value = state.nachosStatus
      nachosPhase.value = 'polling'
      selectedProduct.value = 'nachos'
      startDepositPolling('nachos')
    } else if (!nachosIsNotStarted && !nachosIsWaiting) {
      // Past deposit phase — poll swap state
      nachosProgress.value = state.nachosStatus
      nachosPhase.value = 'polling'
      selectedProduct.value = 'nachos'
      startUnifiedPolling(POLL_ACTIVE_MS)
    }
  } catch (err) {
    console.error('Failed to load initial swap state:', err)
  }
}

/** Handle a ClaimResult from the canister — returns true if swap is done */
const handleClaimResult = (result: any): boolean => {
  if ('Success' in result) {
    const { tacoAmount, txId } = result.Success
    uiPhase.value = 'success'
    claimResult.value = {
      success: true,
      message: `Received ${formatE8s(tacoAmount)} TACO! (tx: ${txId})`
    }
    loadOrderHistory().catch(console.error)
    return true
  }
  if ('NoDeposit' in result) {
    return false
  }
  if ('AlreadyProcessing' in result) {
    return false
  }
  if ('BelowMinimum' in result) {
    const { balance, minimum } = result.BelowMinimum
    uiPhase.value = 'error'
    orderError.value = `Deposit too small: ${formatE8s(balance)} ICP (min: ${formatE8s(minimum)} ICP)`
    return true
  }
  if ('SwapFailed' in result) {
    orderError.value = `Swap failed: ${result.SwapFailed}. Will auto-retry in 5 minutes.`
    return false
  }
  if ('SystemPaused' in result) {
    uiPhase.value = 'error'
    orderError.value = 'System is paused for maintenance. Your ICP is safe and will be processed when resumed.'
    return true
  }
  if ('RateLimited' in result) {
    return false
  }
  if ('NotAuthorized' in result) {
    uiPhase.value = 'error'
    orderError.value = 'Not authorized. Please log in again.'
    return true
  }
  return false
}

/** Handle a NachosClaimResult — returns true if terminal (success/error) */
const handleNachosClaimResult = (result: any): boolean => {
  if ('Success' in result) {
    const { nachosAmount, mintId, orderId: oid } = result.Success
    nachosPhase.value = 'success'
    claimResult.value = {
      success: true,
      message: `Received ${formatE8s(nachosAmount)} NACHOS! (mint: ${mintId}, order: ${oid})`
    }
    loadNachosOrderHistory().catch(console.error)
    return true
  }
  if ('NoDeposit' in result) return false
  if ('AlreadyProcessing' in result) return false
  if ('BelowMinimum' in result) {
    const { balance, minimum } = result.BelowMinimum
    nachosPhase.value = 'error'
    nachosError.value = `Deposit too small: ${formatE8s(balance)} ICP (min: ${formatE8s(minimum)} ICP)`
    return true
  }
  if ('MintFailed' in result) {
    nachosError.value = `Mint failed: ${result.MintFailed}. Will auto-retry.`
    return false
  }
  if ('SystemPaused' in result) {
    nachosPhase.value = 'error'
    nachosError.value = 'System paused. Your ICP is safe.'
    return true
  }
  if ('RateLimited' in result) return false
  if ('NotAuthorized' in result) {
    nachosPhase.value = 'error'
    nachosError.value = 'Not authorized. Please log in again.'
    return true
  }
  return false
}

// ==========================
// Phase 1: Deposit polling via ICP ledger icrc1_balance_of
// ==========================

/** Poll ICP ledger for deposit balance. When ICP arrives, auto-claim and switch to Phase 2. */
const startDepositPolling = (product: Product) => {
  stopDepositPolling()
  const startedAt = Date.now()
  const swapCanisterId = tacoStore.tacoSwapCanisterId()

  depositPollInterval = setInterval(async () => {
    // Timeout guard
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopDepositPolling()
      if (product === 'taco' && uiPhase.value === 'polling') {
        uiPhase.value = 'error'
        orderError.value = 'Timed out waiting for ICP deposit.'
      }
      if (product === 'nachos' && nachosPhase.value === 'polling') {
        nachosPhase.value = 'error'
        nachosError.value = 'Timed out waiting for ICP deposit.'
      }
      return
    }

    const subaccount = product === 'taco'
      ? tacoDepositSubaccount.value
      : nachosDepositSubaccount.value
    if (!subaccount) return

    const balance = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(swapCanisterId),
      subaccount instanceof Uint8Array ? subaccount : new Uint8Array(subaccount)
    )

    if (balance === false) return // query error, retry next tick

    const balanceBigInt = BigInt(balance)

    // Update live balance for UI
    if (product === 'taco') {
      depositBalance.value = balanceBigInt
    } else {
      nachosDepositBalance.value = balanceBigInt
    }

    // ICP arrived — auto-claim
    if (balanceBigInt > DEPOSIT_MIN_E8S) {
      stopDepositPolling()

      try {
        const actor = await tacoStore.createTacoSwapActor()

        if (product === 'taco') {
          const result = await (actor as any).claim_taco([fiatAmount.value], [fiatCurrency.value])
          const done = handleClaimResult(result)
          if (!done && uiPhase.value === 'polling') {
            // Claim accepted but still processing — switch to Phase 2 (swap polling)
            startUnifiedPolling(POLL_ACTIVE_MS)
          }
        } else {
          const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])
          const done = handleNachosClaimResult(result)
          if (!done && nachosPhase.value === 'polling') {
            startUnifiedPolling(POLL_ACTIVE_MS)
          }
        }
      } catch (err) {
        console.error(`Auto-claim ${product} failed:`, err)
        // Fall back to swap polling — backend may still process it
        startUnifiedPolling(POLL_ACTIVE_MS)
      }
    }
  }, DEPOSIT_POLL_MS)
}

/** Stop deposit polling */
const stopDepositPolling = () => {
  if (depositPollInterval) {
    clearInterval(depositPollInterval)
    depositPollInterval = null
  }
}

/** Manual claim — TACO fallback */
const claimTaco = async () => {
  claiming.value = true
  claimResult.value = null

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).claim_taco([fiatAmount.value], [fiatCurrency.value])

    if ('Success' in result) {
      const { tacoAmount, txId } = result.Success
      claimResult.value = {
        success: true,
        message: `Claimed ${formatE8s(tacoAmount)} TACO! (tx: ${txId})`
      }
      loadOrderHistory().catch(console.error)
    } else if ('NoDeposit' in result) {
      claimResult.value = {
        success: false,
        message: 'No pending ICP found. If you recently paid, please wait a few minutes for the ICP to arrive.'
      }
    } else if ('BelowMinimum' in result) {
      const { balance, minimum } = result.BelowMinimum
      claimResult.value = {
        success: false,
        message: `Deposit too small: ${formatE8s(balance)} ICP (minimum: ${formatE8s(minimum)} ICP)`
      }
    } else if ('SwapFailed' in result) {
      claimResult.value = {
        success: false,
        message: `Swap failed: ${result.SwapFailed}. The canister will auto-retry.`
      }
    } else if ('AlreadyProcessing' in result) {
      claimResult.value = {
        success: false,
        message: 'A swap is already in progress for your account. Please wait a moment.'
      }
    } else if ('SystemPaused' in result) {
      claimResult.value = {
        success: false,
        message: 'System is paused for maintenance. Your ICP is safe and will be processed when resumed.'
      }
    } else if ('RateLimited' in result) {
      claimResult.value = {
        success: false,
        message: 'Too many requests. Please wait a minute before trying again.'
      }
    } else if ('NotAuthorized' in result) {
      claimResult.value = {
        success: false,
        message: 'Not authorized. Please log in and try again.'
      }
    }
  } catch (err: any) {
    claimResult.value = {
      success: false,
      message: `Claim error: ${err.message || err}`
    }
  } finally {
    claiming.value = false
  }
}

// ==========================
// NACHOS functions
// ==========================

/** Load NACHOS deposit address from canister (update call — retry with backoff) */
const nachosAddrError = ref(false)
const loadNachosDepositAddress = async () => {
  nachosAddrError.value = false
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const actor = await tacoStore.createTacoSwapActor()
      nachosDepositAddress.value = await (actor as any).get_nachos_deposit_address_for([])
      return
    } catch (err) {
      console.error(`Failed to load NACHOS deposit address (attempt ${attempt}/3):`, err)
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
  nachosAddrError.value = true
}

/** Load NACHOS order history */
const loadNachosOrderHistory = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    nachosOrderHistory.value = await (actor as any).get_my_nachos_orders(20n)
  } catch (err) {
    console.error('Failed to load NACHOS order history:', err)
  }
}

/** Open Coinbase Onramp popup (NACHOS — uses nachosDepositAddress) */
const openCoinbaseNachos = async () => {
  if (!nachosDepositAddress.value) {
    nachosError.value = 'NACHOS deposit address not loaded. Please refresh and try again.'
    nachosPhase.value = 'error'
    return
  }

  nachosPhase.value = 'registering'
  nachosError.value = null
  claimResult.value = null
  nachosProgress.value = null

  try {
    // 1. Get session token from CF Worker
    const resp = await fetch(COINBASE_SESSION_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [{ address: nachosDepositAddress.value }],
        assets: ['ICP'],
      }),
    })
    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(`Session token error: ${err.error} ${err.details || ''}`)
    }
    const { token: sessionToken } = await resp.json()

    // 2. Generate Coinbase onramp URL
    const { generateOnRampURL } = await import('@coinbase/cbpay-js')

    const onrampUrl = generateOnRampURL({
      sessionToken,
      addresses: { [nachosDepositAddress.value]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    // 3. Open popup + start Phase 1 NACHOS deposit polling (ICP ledger)
    nachosPhase.value = 'polling'
    nachosStartTime.value = Date.now()
    nachosElapsed.value = 0
    startElapsedTimer()
    const popup = window.open(onrampUrl, 'coinbase-onramp', 'width=500,height=700,scrollbars=yes,resizable=yes')
    startDepositPolling('nachos')

    // 4. When popup closes — grace period
    const popupPoll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupPoll)
        handlePopupClose(nachosProgress, nachosPhase, () => {
          nachosProgress.value = null
        })
      }
    }, 1500)

  } catch (err: any) {
    console.error('Failed to open Coinbase Onramp (NACHOS):', err)
    nachosPhase.value = 'error'
    nachosError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Open the Transak widget (NACHOS) */
const openTransakNachos = async () => {
  if (!nachosDepositAddress.value) {
    nachosError.value = 'NACHOS deposit address not loaded. Please refresh and try again.'
    nachosPhase.value = 'error'
    return
  }

  nachosPhase.value = 'registering'
  nachosError.value = null
  claimResult.value = null
  nachosProgress.value = null

  try {
    nachosPhase.value = 'polling'
    nachosStartTime.value = Date.now()
    nachosElapsed.value = 0
    startElapsedTimer()

    const { Transak } = await import('@transak/ui-js-sdk')

    const widgetUrl = buildTransakUrl(nachosDepositAddress.value, 'Buy NACHOS')
    transakInstance = new Transak({ widgetUrl })
    transakInstance.init()

    startDepositPolling('nachos')

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data: any) => {
      console.log('Transak order created (NACHOS):', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data: any) => {
      console.log('Transak order successful (NACHOS):', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      console.log('Transak widget closed (NACHOS)')
      if (transakInstance) {
        transakInstance.close()
        transakInstance = null
      }
      handlePopupClose(nachosProgress, nachosPhase, () => {
        nachosProgress.value = null
      })
    })

  } catch (err: any) {
    console.error('Failed to initialize Transak (NACHOS):', err)
    nachosPhase.value = 'error'
    nachosError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Manual claim — NACHOS fallback */
const claimNachos = async () => {
  claiming.value = true
  claimResult.value = null

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])

    const done = handleNachosClaimResult(result)

    // For manual claim, also set user-facing claimResult messages for non-terminal cases
    if (!done) {
      if ('NoDeposit' in result) {
        claimResult.value = {
          success: false,
          message: 'No pending ICP found. If you recently paid, please wait a few minutes for the ICP to arrive.'
        }
      } else if ('AlreadyProcessing' in result) {
        claimResult.value = {
          success: false,
          message: 'A mint is already in progress for your account. Please wait a moment.'
        }
      } else if ('RateLimited' in result) {
        claimResult.value = {
          success: false,
          message: 'Too many requests. Please wait a minute before trying again.'
        }
      }
    }
  } catch (err: any) {
    claimResult.value = {
      success: false,
      message: `Claim error: ${err.message || err}`
    }
  } finally {
    claiming.value = false
  }
}

/////////////////////
// lifecycle hooks //
/////////////////////

onMounted(async () => {
  // redirect to home on production (unless admin)
  if (getEffectiveNetwork() === 'ic' && !isAdmin.value) {
    router.replace('/')
    return
  }

  // load config (anonymous — works without login)
  loadConfig().catch(console.error)

  // if already logged in, load user-specific data + check for active swaps
  if (tacoStore.userLoggedIn) {
    loadDepositAddress().catch(console.error)
    loadNachosDepositAddress().catch(console.error)
    loadOrderHistory().catch(console.error)
    loadNachosOrderHistory().catch(console.error)
    loadInitialState()
  }
})

// when user logs in after page load, fetch their data
watch(userLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadDepositAddress().catch(console.error)
    loadNachosDepositAddress().catch(console.error)
    loadOrderHistory().catch(console.error)
    loadNachosOrderHistory().catch(console.error)
    loadInitialState()
  } else {
    depositAddress.value = ''
    nachosDepositAddress.value = ''
    orderHistory.value = []
    nachosOrderHistory.value = []
    swapProgress.value = null
    nachosProgress.value = null
    uiPhase.value = 'idle'
    nachosPhase.value = 'idle'
    stopDepositPolling()
    stopUnifiedPolling()
  }
})

onBeforeUnmount(() => {
  stopDepositPolling()
  stopUnifiedPolling()
  stopElapsedTimer()
  if (transakInstance && typeof transakInstance.close === 'function') {
    transakInstance.close()
  }
  transakInstance = null
})

</script>
