<template>

  <!-- message modal -->
  <div class="wizard__message">
    
    <!-- message -->
    <div class="wizard__message__dialog">
      
      <!-- message top -->
      <div class="wizard__message__dialog__top px-2 p-2">

        <!-- message top left -->
        <div class="taco-text-white">Taco Wizard</div>

        <!-- message top right -->
        <div class="taco-text-black-to-white">

            <!-- close button -->
            <button class="btn btn-sm p-0 text-white px-2"
                    @click="toggleTacoWizard">
              <i class="fa-solid fa-xmark"></i>
            </button>

        </div>

      </div>

      <!-- message middle -->
      <div class="wizard__message__dialog__middle">

        <!-- top - wizard and intro text -->
        <div class="wizard__top">

          <!-- top left -->
          <ChefWizard />

          <!-- top right -->
          <div class="wizard__top__right flex-grow-1">
            
            <!--  -->
            <p class="fw-bold mb-0" style="font-size: 1.25rem;">Welcome to the Taco Wizard!</p>

            <p class="mb-4">He'll help you do everything you need to vote and get rewards <i class="fa-regular fa-coins"></i></p>

            <p>Just follow the steps and let the wizard do the rest!</p>

            <p v-if="userLoggedIn" class="text-nowrap">⬇️ Get Started Below ⬇️</p>

            <p v-if="!userLoggedIn" class="text-nowrap">Log in to get started</p>

            <button v-if="!userLoggedIn" class="btn d-flex align-items-center gap-2 p-0 mt-4" @click="tacoStore.iidLogIn()">
              <DfinityLogo style="width: 2rem;" />
              <span class="taco-text-black-to-white">Log In</span>
            </button>

          </div>

        </div>

        stakingComplete: {{  stakingComplete }}<br></br>
        <!-- currentStep: {{  currentStep }}<br></br> -->
        userNeurons.length: {{  userNeurons.length }}<br></br>
        fetchedIcpBalance: {{ fetchedIcpBalance }}<br></br>
        fetchedTacoBalance: {{ fetchedTacoBalance }}<br></br>
        userPrincipal: {{ userPrincipal }}<br></br>

        <!-- bottom - steps -->
        <div v-if="userLoggedIn && !loading" class="wizard__bottom">

          <!-- wizard steps -->
          <div class="wizard__steps">

            <!-- step 1 - Get Tokens -->
            <div v-if="userNeurons.length === 0 && fetchedIcpBalance <  1 && fetchedTacoBalance < 1" 
                 class="wizard__step">

              <!-- left - step info -->
              <div class="wizard__step__info">

                <!-- step circle -->
                <div class="wizard__step__circle">
                  <span class="wizard__step__circle__number">1</span>
                  <span class="wizard__step__circle__text">Deposit</span>
                  <span class="wizard__step__circle__text">Tokens</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <p class="mb-0">Deposit at least <span class="fw-bold">1</span> ICP to get started</p>

                <p class="mb-4">Your current ICP balance is <span class="fw-bold">{{ fetchedIcpBalance.toFixed(8) }}</span></p>

                <p class="mb-4">You can buy ICP on exchanges like <a class="wizard__step__link" href="https://www.coinbase.com" target="_blank">Coinbase</a>, <a class="wizard__step__link" href="https://www.binance.com" target="_blank">Binance</a>, or <a class="wizard__step__link" href="https://www.kraken.com" target="_blank">Kraken</a></p>   

                <p class="mb-0">Send some to this address:</p>

                <p class="mb-3"><span class="wizard__step__link"><span style="word-break: break-all;">{{ userPrincipal }}</span> <i class="fa-regular fa-copy"></i></span></p>

                <button class="btn taco-btn taco-btn--green taco-btn--big d-inline-block mb-3" @click="fetchIcrc1BalanceOfIcp(); fetchIcrc1BalanceOfTaco()">Then Refresh</button>

              </div>

            </div>

            <!-- step 1 - Get Tokens (completed) -->
            <div v-if="userNeurons.length > 0 || fetchedIcpBalance >= 1 || fetchedTacoBalance >= 1" 
                 class="wizard__step wizard__step--completed">

              <!-- left - step info -->
              <div class="wizard__step__info">

                <!-- step circle -->
                <div class="wizard__step__circle wizard__step__circle--completed">
                  <span class="wizard__step__circle__number">
                    <i class="fa-solid fa-check"></i>
                  </span>
                  <span class="wizard__step__circle__text">Deposit</span>
                  <span class="wizard__step__circle__text">ICP</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <p>Alakazam! First step is done!</p>

              </div>

            </div>

            <!-- step 2 - Swap Tokens -->
            <div v-if="userNeurons.length === 0 && fetchedTacoBalance < 1" 
                 class="wizard__step">

              <!-- left - step info -->
              <div class="wizard__step__info">

                <!-- step circle -->
                <div class="wizard__step__circle">
                  <span class="wizard__step__circle__number">2</span>
                  <span class="wizard__step__circle__text">Get</span>
                  <span class="wizard__step__circle__text">TACO</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <!-- not enough text -->
                <p v-if="fetchedIcpBalance < 1"
                   :class="{ 'mb-0': fetchedIcpBalance > 0, 'mb-3': fetchedIcpBalance <= 0 }">
                   You need <span class="fw-bold">1</span> ICP to swap
                </p>

                <!-- your taco balance -->
                <p v-if="fetchedIcpBalance > 0 && fetchedIcpBalance < 1"
                   class="mb-3">
                   You have {{ fetchedIcpBalance.toFixed(8) }} ICP
                </p>

                <!-- first sentence -->
                <div v-if="fetchedIcpBalance >= 1" 
                     class="d-flex align-items-baseline mb-0">

                  <!-- swap text -->
                  <span>Swap your {{ fetchedIcpBalance }} ICP for TACO via {{ bestExchange }}</span>

                </div>
                
                <!-- second sentence -->
                <p v-if="fetchedIcpBalance >= 1" 
                   class="wizard-custom-spacing-1" 
                   style="margin-bottom: 2rem;">
                  
                  <!-- text -->
                  <span>You'll get <span class="fw-bold">{{ swapOutputAmount }} TACO</span> for your <span class="fw-bold">{{ fetchedIcpBalance }} ICP</span></span>

                </p>

                <button :disabled="fetchedIcpBalance < 1"
                        class="wizard-custom-spacing-2 btn taco-btn taco-btn--green taco-btn--big">
                  Swap Tokens
                </button>

              </div>

            </div>

            <!-- step 2 - Swap Tokens (completed) -->
            <div v-if="userNeurons.length || fetchedTacoBalance >= 1" 
                 class="wizard__step wizard__step--completed">

              <!-- left - step info -->
              <div class="wizard__step__info">

                <!-- step circle -->
                <div class="wizard__step__circle wizard__step__circle--completed">
                  <span class="wizard__step__circle__number">
                    <i class="fa-solid fa-check"></i>
                  </span>
                  <span class="wizard__step__circle__text">Swap</span>
                  <span class="wizard__step__circle__text">Tokens</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <p>Whalah! You've got TACO</p>

              </div>

            </div>                 

            <!-- step 3 - Stake Tokens -->
            <div v-if="!userNeurons.length" 
                 class="wizard__step">

              <!-- left - step info -->
              <div class="wizard__step__info">

                <!-- step circle -->
                <div class="wizard__step__circle">
                  <span class="wizard__step__circle__number">3</span>
                  <span class="wizard__step__circle__text">Stake</span>
                  <span class="wizard__step__circle__text">Tokens</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <!-- not enough text -->
                <p v-if="fetchedTacoBalance < 1"
                   :class="{ 'mb-0': fetchedTacoBalance > 0, 'mb-3': fetchedTacoBalance <= 0 }">
                   You need <span class="fw-bold">1</span> TACO to stake
                </p>

                <!-- your taco balance -->
                <p v-if="fetchedTacoBalance > 0 && fetchedTacoBalance < 1"
                   class="mb-3">
                   You have {{ fetchedTacoBalance.toFixed(8) }} TACO
                </p>

                <p v-if="fetchedTacoBalance >= 1"
                   class="mb-0">
                   Stake your {{ fetchedTacoBalance }} TACO in a Neuron
                </p>

                <p v-if="fetchedTacoBalance >= 1"
                   class="wizard-custom-spacing-1" 
                   style="margin-bottom: 2rem;">
                  We'll stake it for 30 days
                </p>

                <button :disabled="fetchedTacoBalance < 1"
                        class="wizard-custom-spacing-2 btn taco-btn taco-btn--green taco-btn--big">
                  Stake Tokens
                </button>

              </div>

            </div>

            <!-- step 3 - Stake Tokens (completed) -->
            <div v-if="userNeurons.length" 
                 class="wizard__step wizard__step--completed">

              <!-- left - step info -->
              <div class="wizard__step__info">

                <!-- step circle -->
                <div class="wizard__step__circle wizard__step__circle--completed">
                  <span class="wizard__step__circle__number">
                    <i class="fa-solid fa-check"></i>
                  </span>
                  <span class="wizard__step__circle__text">Stake</span>
                  <span class="wizard__step__circle__text">Tokens</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <p class="mb-3">Presto! You've got a Taco Neuron</p>

                <p class="mb-2">You can now <router-link to="/vote" class="btn taco-btn taco-btn--green taco-btn--big d-inline-block">vote</router-link> on DAO allocations and earn rewards!</p>

                <p class="mb-3" style="font-size: 1rem;">Rewards are distributed ever Tuesday. Use the <router-link to="/wallet" class="wallet-link" style="color: var(--blue-to-light-blue)">wallet</router-link> to manage your funds, nuerons, and rewards</p>

              </div>

            </div>              

          </div>

        </div>

        <!-- or loading -->
        <div v-if="loading" class="wizard__loading">

          <!-- loading content -->
          <div class="wizard__loading__content">

            <!-- loading text -->
            <span class="taco-text-black-to-white d-block text-center p-5"><i class="fa fa-spinner fa-spin"></i> Loading...</span>

          </div>

        </div>

      </div>

      <!-- message bottom -->
      <div class="wizard__message__dialog__bottom p-2">

        <!-- message bottom left -->
        <div class="taco-text-black-to-white"></div>

        <!-- message bottom right -->
        <div class="taco-text-black-to-white">

          <!-- close button -->
          <button class="btn taco-nav-btn"
                  @click="toggleTacoWizard">
            Close
          </button>

        </div>

      </div>

    </div>
    
  </div>    

</template>

<style scoped lang="scss">

  // wizard
  .wizard {

    // message modal
    &__message {
      position: fixed;
      top: 0;
      left: 0;
      display: flex;
      justify-content: center;
      align-items: start;
      width: 100%;
      height: 100%;
      background-color: var(--curtain-bg);
      z-index: 1001;
      margin: 0;
      padding: 0;
      overflow: auto;

      // dialog
      &__dialog {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 65rem;
        border-radius: 0.5rem;
        background-color: var(--light-orange-to-dark-brown);
        border: 1px solid var(--dark-orange);
        overflow: clip;
        margin: 2rem 2rem 2rem;
        container: wizard-dialog / inline-size;

        // container queries
        @container wizard-dialog (inline-size > 600px) {
          // placeholder
        }
        @container wizard-dialog (inline-size < 600px) {
          .wizard__top {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }
          .wizard__top__right {
            text-align: center;
            padding-bottom: 1rem;
          }
          .wizard__step {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .wizard__step__content {
            display: flex;
            flex-direction: column;
            padding: 0rem 1rem 1rem;
            justify-content: center;
            width: 100%;
          }
          .wizard-custom-spacing-1 {
            margin-bottom: 1rem !important;
          }
          .wizard-custom-spacing-2 {
            margin-bottom: 0.5rem !important;
          }

        }

        // top and bottom
        &__top, &__bottom {
          display: flex;
          width: 100%;
          justify-content: space-between;
          background-color: var(--dark-orange);
        }

        // top
        &__top {
          
          &__right {
            flex-grow: 1;
          }

        }

        // middle
        &__middle {
          width: 100%;
        }        

        // bottom
        &__bottom {
          // placeholder
          min-height: 0;
        }

      }

    }

    // top
    &__top {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 3rem;
      padding: 2rem 2rem 0rem 2rem;

      &__right {
        padding-bottom: 1.5rem;
      }

      p {
        color: var(--black-to-white);
        margin-bottom: 0.5rem;
        font-size: 1rem;
      }

    }

    // bottom
    &__bottom {
      padding: 0rem 2rem 0rem 2rem;

      p {
        color: var(--black-to-white);
        margin-bottom: 0.5rem;
        font-size: 1rem;
      }

    }
    // wizard steps
    &__steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 1.5rem;
    }

    // wizard step
    &__step {
      display: flex;
      background-color: var(--orange-to-brown);
      border-radius: 0.5rem;
      border: 1px solid var(--dark-orange);

      // info
      &__info {
        padding: 1.5rem;
      }

      // circle
      &__circle {
        aspect-ratio: 1/1;
        width: 10rem;
        height: 10rem;
        border-radius: 999rem;
        background-color: var(--light-orange-to-light-brown);
        // border: 1px solid var(--dark-orange);
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        
        // circle number
        &__number {
          color: var(--dark-brown-to-white);
          font-size: 4rem;
          font-weight: 800;
          font-family: 'Rubik', sans-serif;
          line-height: 1;
        }

        // circle text
        &__text {
          color: var(--dark-brown-to-white);
          display: block;
          font-size: 1rem;
          font-weight: 500;
          font-family: 'Rubik', sans-serif;
          line-height: 1.125;
        }

        // completed
        &--completed {
          background-color: var(--green-to-success-green);

          .wizard__step__circle__number {
            color: var(--white-to-black);
          }

          .wizard__step__circle__text {
            color: var(--white-to-black);
          }

        }

      }

      // content
      &__content {
        padding: 1.5rem 1.5rem 0 0;
      }

      // link
      &__link {
        font-family: 'Space Mono';
        color: var(--brown-to-dark-orange);
      }

      // dropdown
      &__dropdown {
        position: relative;
        display: inline-block;
        background-color: transparent;
      }

      &__dropdown__menu {
        position: absolute;
        top: 100%;
        left: 0;
        color: var(--black-to-white);
        background-color: var(--light-orange-to-light-brown);
        border: 1px solid var(--dark-orange);
        border-radius: 0.5rem;
        overflow: hidden;
        overflow-y: auto;
        z-index: 1002;
        margin-top: 0.25rem;
      }

      &__dropdown__item {
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        color: var(--black-to-white);
        white-space: nowrap;
      }

      &__dropdown__item:hover {
        background-color: var(--orange-to-brown);
      }

      // completed
      &--completed {
        align-items: center;

        .wizard__step__content {
          padding: 0;
          p {
            margin-bottom: 0;
          }
        }
      }

    }

    // loading
    &__loading {
      padding: 0 2rem 1rem;

      // loading content
      &__content {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        background-color: var(--orange-to-brown);
        border-radius: 0.5rem;
        border: 1px solid var(--dark-orange);
      }

    }

  }

</style>

<script setup lang="ts">

/////////////
// Imports //
/////////////

import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../stores/taco.store'
import { useKongStore } from '../stores/kong.store'
import { useICPSwapStore } from '../stores/icpswap.store'
import { storeToRefs } from 'pinia'
import { getLegacyAccountId } from '../utils/accountUtils'
import { useClipboard } from '@vueuse/core'
import { tokenImages } from '../components/data/TokenData'
import SwapDialog from '../components/wallet/SwapDialog.vue'
import SwapConfirmDialog from '../components/wallet/SwapConfirmDialog.vue'
import StakeToNeuronDialog from '../components/wallet/StakeToNeuronDialog.vue'
import CreateNeuronDialog from '../components/wallet/CreateNeuronDialog.vue'
import SwapStakeProgressDialog from '../components/wallet/SwapStakeProgressDialog.vue'
import ChefWizard from '../components/misc/chefWizard.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'

///////////
// Setup //
///////////
const router = useRouter()
const { copy } = useClipboard()

////////////////
// Interfaces //
////////////////

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

////////////
// Stores //
////////////

// # SETUP #
const tacoStore = useTacoStore()
const kongStore = useKongStore()
const icpswapStore = useICPSwapStore()

// # STATE #
const { tacoWizardOpen, userLoggedIn, userPrincipal } = storeToRefs(tacoStore)

// # ACTIONS #
const { toggleTacoWizard } = tacoStore
const { ensureTokenDetails } = tacoStore
const { getUserNeurons } = tacoStore



const loading = ref(true)
// const currentStep = ref(1)
const expandedSteps = ref<Set<number>>(new Set([1]))
const selectedGetTokenSymbol = ref('ICP')
const selectedSwapFromToken = ref('')
const userChangedStep2Selection = ref(false) // Track if user manually changed step 2
const isSwapping = ref(false)
const isStaking = ref(false)
const isSwapAndStake = ref(false) // Flag to track if we're doing swap & stake
const stakingComplete = ref(false)
const loadingQuotes = ref(false)
const bestQuote = ref<any>(null)
const bestExchange = ref<string>('')
const newTokenPrincipal = ref('')
const registeringToken = ref(false)
const refreshingBalance = ref(false)
const showRegisterToken = ref(false)

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
const showProgressDialog = ref(false)
const selectedNeuron = ref<any | null>(null)
const progressDialog = ref<any>(null)
const preselectedSwapToken = ref<WalletToken | null>(null)
const swapConfirmData = ref<any | null>(null)

// dropdown state
const isTokenDropdownOpen = ref(false)
const tokenDropdownRef = ref<HTMLElement | null>(null)
const isSwapDropdownOpen = ref(false)
const swapDropdownRef = ref<HTMLElement | null>(null)

const closeTokenDropdownOnClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (isTokenDropdownOpen.value && tokenDropdownRef.value && !tokenDropdownRef.value.contains(target)) {
    isTokenDropdownOpen.value = false
  }
  if (isSwapDropdownOpen.value && swapDropdownRef.value && !swapDropdownRef.value.contains(target)) {
    isSwapDropdownOpen.value = false
  }
}

const selectToken = (symbol: string) => {
  selectedGetTokenSymbol.value = symbol
  isTokenDropdownOpen.value = false
}

const selectSwapToken = (principal: string) => {
  selectedSwapFromToken.value = principal
  isSwapDropdownOpen.value = false
  onStep2DropdownChange()
}

/////////////////////
// Local Variables //
/////////////////////

// fetched ICRC1 balance of ICP
const fetchedIcpBalance = ref<bigint>(0n)

// fetched ICRC1 balance of TACO
const fetchedTacoBalance = ref<bigint>(0n)

/////////////////////////
// Computed Properties //
/////////////////////////

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

const swapInputAmount = computed(() => {
  const token = selectedSwapToken.value
  if (!token) return '0'
  
  // Use available balance minus fees - reserve extra fee for ICPSwap operations
  const extraFeeReserve = token.fee // Reserve one additional fee for ICPSwap operations
  const availableAmountBigInt = token.balance - token.fee - extraFeeReserve
  const availableAmount = Number(availableAmountBigInt) / (10 ** token.decimals)
  return availableAmount.toFixed(8)
})

const swapOutputAmount = computed(() => {
  if (!bestQuote.value) return '0'
  
  // Convert from BigInt to decimal
  const outputAmount = Number(bestQuote.value.amountOut) / 1e8 // TACO has 8 decimals
  return outputAmount.toFixed(8)
})



// Methods

// fetch ICRC1 balance of ICP
const fetchIcrc1BalanceOfIcp = async () => {

  // try
  try {

    // fetch ICRC1 balance of ICP
    const balance = await tacoStore.icrc1BalanceOf('ryjl3-tyaaa-aaaaa-aaaba-cai', Principal.fromText(tacoStore.userPrincipal))

    // log
    console.log('icp balance:', balance)

    // account for 8 zero decimals
    const balanceWithDecimals = Number(balance as bigint) / 10 ** 8

    // log
    console.log('icp balanceWithDecimals:', balanceWithDecimals)

    // set fetched ICP balance
    fetchedIcpBalance.value = balanceWithDecimals

    // // log
    // console.log('fetchedIcpBalance:', fetchedIcpBalance.value)

  } 
  
  // catch
  catch (error) {

    // log error
    console.error('Error fetching ICRC1 balance of ICP:', error)

    // set fetched ICP balance to 0
    fetchedIcpBalance.value = 0n

  }
  
}
const fetchIcrc1BalanceOfTaco = async () => {

  // // log
  // console.log('fetching taco balance...')

// try
try {

  // fetch ICRC1 balance of TACO
  const balance = await tacoStore.icrc1BalanceOf('kknbx-zyaaa-aaaaq-aae4a-cai', Principal.fromText(tacoStore.userPrincipal))

  // // log
  // console.log('taco balance:', balance)

  // account for 8 zero decimals
  const balanceWithDecimals = Number(balance as bigint) / 10 ** 8

  // // log
  // console.log('taco balanceWithDecimals:', balanceWithDecimals)

  // set fetched TACO balance
  fetchedTacoBalance.value = balanceWithDecimals

  // // log
  // console.log('fetchedTacoBalance:', fetchedTacoBalance.value)

} 

// catch
catch (error) {

  // log error
  console.error('Error fetching ICRC1 balance of ICP:', error)

  // set fetched ICP balance to 0
  fetchedIcpBalance.value = 0n

}

}

const loadWalletData = async () => {
  try {
    loading.value = true
    
    // await Promise.all([
    //   tacoStore.fetchTokenDetails(),
    //   fetchUserRegisteredTokens(),
    //   loadUserNeurons()
    // ])

    await ensureTokenDetails()

    await fetchUserRegisteredTokens()
    await loadUserNeurons()  
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

const refreshTokenBalance = async () => {
  refreshingBalance.value = true
  
  try {
    // Reload wallet data to refresh all balances
    await loadWalletData()
    
    // Show success toast
    tacoStore.addToast({
      id: Date.now(),
      code: 'balance-refreshed',
      title: 'Balance Updated',
      icon: 'fa-solid fa-refresh',
      message: `${selectedGetTokenSymbol.value} balance refreshed successfully`
    })
    
  } catch (error: any) {
    console.error('Error refreshing balance:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'refresh-error',
      title: 'Refresh Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to refresh balance. Please try again.'
    })
  } finally {
    refreshingBalance.value = false
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

const fetchSwapQuotes = async () => {
  const token = selectedSwapToken.value
  if (!token || !tacoToken.value) return
  
  const inputAmountBigInt = token.balance - token.fee
  if (inputAmountBigInt <= 0n) return
  
  loadingQuotes.value = true
  bestQuote.value = null
  bestExchange.value = ''
  
  try {
    // Get quotes from both exchanges
    const [kongQuote, icpSwapQuote] = await Promise.allSettled([
      kongStore.getQuote({
        sellTokenSymbol: token.symbol,
        buyTokenSymbol: 'TACO',
        amountIn: inputAmountBigInt
      }),
      icpswapStore.getQuote({
        sellTokenPrincipal: token.principal,
        buyTokenPrincipal: tacoToken.value.principal,
        amountIn: inputAmountBigInt
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
    
    if (quotes.length > 0) {
      // Sort by amount out (highest first) and pick the best
      const sortedQuotes = quotes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut))
      bestQuote.value = sortedQuotes[0]
      bestExchange.value = sortedQuotes[0].exchange
    }
    
  } catch (error) {
    console.error('Error fetching quotes:', error)
  } finally {
    loadingQuotes.value = false
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
  // // Set both dropdowns to ICP by default
  // selectedGetTokenSymbol.value = 'ICP'
  
  // // Find ICP token and set step 2 dropdown
  // const icpToken = allTokens.value.find(t => t.symbol === 'ICP')
  // if (icpToken) {
  //   selectedSwapFromToken.value = icpToken.principal
  //   // Fetch quotes for initial selection
  //   setTimeout(() => fetchSwapQuotes(), 100)
  // }
  
  // // Reset the manual change flag
  // userChangedStep2Selection.value = false
}

const onStep2DropdownChange = () => {
  // User manually changed step 2 dropdown
  userChangedStep2Selection.value = true
}

// const determineStartingStep = () => {
//   const minimumSwapThreshold = 100000000n // 1 ICP equivalent threshold
  
//   // If user has TACO, go to staking step
//   if (hasTacoTokens.value) {
//     currentStep.value = 3
//     expandedSteps.value = new Set([3])
//     return
//   }
  
//   // If user has swappable tokens above threshold, go to swap step
//   if (hasSwappableTokens.value) {
//     const hasSignificantTokens = swappableTokens.value.some(token => 
//       token.balance > minimumSwapThreshold || 
//       (token.priceUSD && token.priceUSD > 0 && 
//        (Number(token.balance) / (10 ** token.decimals)) * token.priceUSD >= 1)
//     )
    
//     if (hasSignificantTokens) {
//       currentStep.value = 2
//       expandedSteps.value = new Set([2])
//       return
//     }
//   }
  
//   // Otherwise start with getting tokens
//   currentStep.value = 1
//   expandedSteps.value = new Set([1])
// }

// const toggleStep = (step: number) => {
//   if (expandedSteps.value.has(step)) {
//     expandedSteps.value.delete(step)
//   } else {
//     expandedSteps.value.add(step)
//   }
// }

// const goToStep = (step: number) => {
//   currentStep.value = step
//   expandedSteps.value = new Set([step])
// }

// const copyToClipboard = async (text: string) => {
//   try {
//     await copy(text)
//     tacoStore.addToast({
//       id: Date.now(),
//       code: 'copy-success',
//       title: 'Copied!',
//       icon: 'fa-solid fa-check',
//       message: 'Address copied to clipboard'
//     })
//   } catch (error) {
//     console.error('Failed to copy to clipboard:', error)
//     tacoStore.addToast({
//       id: Date.now(),
//       code: 'copy-error',
//       title: 'Copy Failed',
//       icon: 'fa-solid fa-exclamation-triangle',
//       message: 'Failed to copy to clipboard'
//     })
//   }
// }

const getTokenByPrincipal = (principal: string): WalletToken | undefined => {
  return allTokens.value.find(t => t.principal === principal)
}

// const getTokenBalance = (symbol: string): bigint => {
//   const token = allTokens.value.find(t => t.symbol === symbol)
//   return token ? token.balance : 0n
// }

// const getTokenDecimals = (symbol: string): number => {
//   const token = allTokens.value.find(t => t.symbol === symbol)
//   return token ? token.decimals : 8
// }

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
  
  // Show progress dialog and reset state
  showProgressDialog.value = true
  progressDialog.value?.reset()
  
  try {
    // Step 1: Getting quotes
    progressDialog.value?.setStepActive('quotes')
    // Calculate max swap amount - reserve extra fee for ICPSwap operations
    // ICPSwap requires additional fee reserves beyond the basic transfer fee
    const extraFeeReserve = token.fee // Reserve one additional fee for ICPSwap operations
    const amountInBigInt = token.balance - token.fee - extraFeeReserve
    const maxSwapAmount = Number(amountInBigInt) / (10 ** token.decimals)
    
    console.log(`Auto-swapping ${maxSwapAmount} ${token.symbol} (${amountInBigInt} base units) to TACO...`)
    console.log(`Reserved fees: ${token.fee + extraFeeReserve} base units for exchange operations`)
    
    // Get quotes from both exchanges
    const [kongQuote, icpSwapQuote] = await Promise.allSettled([
      kongStore.getQuote({
        sellTokenSymbol: token.symbol,
        buyTokenSymbol: 'TACO',
        amountIn: amountInBigInt
      }),
      icpswapStore.getQuote({
        sellTokenPrincipal: token.principal,
        buyTokenPrincipal: tacoToken.value.principal,
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
    
    // Complete quotes step and show swap details
    progressDialog.value?.setStepCompleted('quotes')
    progressDialog.value?.setSwapDetails({
      exchange: bestQuote.exchange,
      inputAmount: maxSwapAmount.toFixed(6),
      inputSymbol: token.symbol,
      outputAmount: (Number(bestQuote.amountOut) / 1e8).toFixed(6)
    })
    
    // Step 2: Executing swap
    progressDialog.value?.setStepActive('swap')
    
    // Execute the swap using the same approach as SwapConfirmDialog
    let swapResult
    const slippageTolerance = 0.01 // 1% slippage
    const minAmountOut = BigInt(Math.floor(Number(bestQuote.amountOut) * (1 - slippageTolerance)))
    
    const swapParams = {
      sellTokenPrincipal: token.principal,
      sellTokenSymbol: token.symbol,
      buyTokenPrincipal: tacoToken.value.principal,
      buyTokenSymbol: 'TACO',
      amountIn: amountInBigInt,
      minAmountOut,
      slippageTolerance,
    }

    // Create a step update callback (like SwapConfirmDialog)
    const updateStep = (step: string) => {
      console.log('Swap step:', step)
    }

    // Add step callback to swap params (exactly like SwapConfirmDialog)
    const swapParamsWithCallback = {
      ...swapParams,
      onStep: updateStep
    }
    
    // Use the exact same logic as SwapConfirmDialog
    if (bestQuote.exchange === 'Kong') {
      const tokenSupportsICRC2 = await tacoStore.checkTokenSupportsICRC2(token.principal)
      
      if (tokenSupportsICRC2) {
        try {
          swapResult = await kongStore.icrc2_swap(swapParamsWithCallback)
        } catch (error) {
          console.log('Kong ICRC2 failed, trying ICRC1:', error)
          swapResult = await kongStore.icrc1_swap(swapParamsWithCallback)
        }
      } else {
        swapResult = await kongStore.icrc1_swap(swapParamsWithCallback)
      }
    } else {
      // ICPSwap
      const tokenSupportsICRC2 = await tacoStore.checkTokenSupportsICRC2(token.principal)
      
      if (tokenSupportsICRC2) {
        try {
          swapResult = await icpswapStore.icrc2_swap(swapParamsWithCallback)
        } catch (error) {
          console.log('ICPSwap ICRC2 failed, trying ICRC1:', error)
          swapResult = await icpswapStore.icrc1_swap(swapParamsWithCallback)
        }
      } else {
        swapResult = await icpswapStore.icrc1_swap(swapParamsWithCallback)
      }
    }
    
    // Kong/ICPSwap stores return results directly, not wrapped in success/error objects
    console.log('Swap successful, proceeding with auto-staking...')
    
    // Complete swap step
    progressDialog.value?.setStepCompleted('swap')
    
    await handleSwapSuccess(swapResult)
    
  } catch (error: any) {
    console.error('Auto-swap & stake failed:', error)
    
    // Show error in progress dialog
    progressDialog.value?.setError(error.message || 'Failed to execute swap & stake')
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'swap-stake-failed',
      title: 'Swap & Stake Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to execute swap & stake. Please try manual swap.'
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
    
    // Step 3: Creating neuron
    progressDialog.value?.setStepActive('stake')
    
    try {
      isStaking.value = true
      
      // Calculate max stakeable amount (balance - fee)
      const maxStakeAmount = tacoToken.value.balance - tacoToken.value.fee
      
      if (maxStakeAmount >= 100000000n) { // Minimum 1 TACO
        // Create neuron with all available TACO and default dissolve period
        const result = await tacoStore.createNeuron(maxStakeAmount)
        
        if (result.success && result.subaccount) {
          // Complete stake step and start dissolve step
          progressDialog.value?.setStepCompleted('stake')
          progressDialog.value?.setStepActive('dissolve')
          
          // Set default dissolve delay (28 days)
          try {
            const defaultDissolveDays = 28
            const delayMonths = defaultDissolveDays / 30
            await tacoStore.setNeuronDissolveDelay(result.subaccount, delayMonths)
            console.log(`Auto-set dissolve delay to ${defaultDissolveDays} days`)
            
            // Complete dissolve step
            progressDialog.value?.setStepCompleted('dissolve')
          } catch (dissolveError: any) {
            console.warn('Failed to set dissolve delay for auto-created neuron:', dissolveError)
            progressDialog.value?.setStepError('dissolve')
          }
          
          // Show success message
          tacoStore.addToast({
            id: Date.now(),
            code: 'swap-stake-success',
            title: 'Swap & Stake Complete!',
            icon: 'fa-solid fa-magic',
            message: `Successfully swapped and staked ${formatBalance(maxStakeAmount, 8)} TACO in a new neuron!`
          })
          
          // Refresh neurons list to show the new neuron
          await loadUserNeurons()
          
          // Mark staking as complete and move to final step
          stakingComplete.value = true
          
          // Auto-close progress dialog after 3 seconds
          setTimeout(() => {
            showProgressDialog.value = false
            goToStep(3)
          }, 3000)
          
        } else {
          progressDialog.value?.setStepError('stake')
          throw new Error('Failed to create neuron')
        }
      } else {
        throw new Error('Insufficient TACO balance to create neuron (minimum 1 TACO required)')
      }
      
    } catch (error: any) {
      console.error('Auto-staking failed:', error)
      
      // Show error in progress dialog
      progressDialog.value?.setError(`Swap completed successfully, but staking failed: ${error.message}`)
      
      // Show error and fall back to manual staking
      tacoStore.addToast({
        id: Date.now(),
        code: 'swap-success-stake-failed',
        title: 'Swap Successful, Staking Failed',
        icon: 'fa-solid fa-exclamation-triangle',
        message: `Swap completed successfully, but auto-staking failed: ${error.message}. Please stake manually.`
      })
      
      // Refresh neurons list for manual staking
      await loadUserNeurons()
      
      // Auto-close progress dialog and move to staking step for manual staking
      setTimeout(() => {
        showProgressDialog.value = false
        goToStep(3)
      }, 3000)
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

// const stakeToExistingNeuron = (neuron: any) => {
//   selectedNeuron.value = neuron
//   showStakeDialog.value = true
// }

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

const closeProgressDialog = () => {
  showProgressDialog.value = false
}

const handleStakeCompleted = async (neuron: any) => {
  console.log('Stake completed for neuron:', neuron)
  
  // Refresh neurons list to show updated stake
  await loadUserNeurons()
  
  // Close dialog
  closeStakeDialog()
  
  // Show success message
  tacoStore.addToast({
    id: Date.now(),
    code: 'stake-success',
    title: 'Stake Added Successfully',
    icon: 'fa-solid fa-check',
    message: `Successfully added stake to ${neuron?.displayName || 'neuron'}`
  })
}

const handleNeuronCreated = async () => {
  console.log('Neuron created successfully')
  
  // Refresh neurons list to show new neuron
  await loadUserNeurons()
  
  // Close dialog
  closeCreateDialog()
  
  // Show success message
  tacoStore.addToast({
    id: Date.now(),
    code: 'neuron-created-success',
    title: 'Neuron Created Successfully',
    icon: 'fa-solid fa-check',
    message: 'New neuron created successfully'
  })
}

// const goToWallet = () => {
//   router.push('/wallet')
// }

// const resetWizard = () => {
//   currentStep.value = 1
//   expandedSteps.value = new Set([1])
//   selectedSwapFromToken.value = ''
//   stakingComplete.value = false
//   isSwapAndStake.value = false
//   loadWalletData()
// }

// const registerCustomToken = async () => {
//   if (!newTokenPrincipal.value.trim()) return
  
//   try {
//     registeringToken.value = true
    
//     // Validate principal format
//     try {
//       Principal.fromText(newTokenPrincipal.value.trim())
//     } catch (error) {
//       tacoStore.addToast({
//         id: Date.now(),
//         code: 'invalid-principal',
//         title: 'Invalid Principal',
//         icon: 'fa-solid fa-exclamation-triangle',
//         message: 'Please enter a valid principal ID'
//       })
//       return
//     }
    
//     // Check if token is already registered
//     if (userRegisteredTokenPrincipals.value.includes(newTokenPrincipal.value.trim())) {
//       tacoStore.addToast({
//         id: Date.now(),
//         code: 'already-registered',
//         title: 'Already Registered',
//         icon: 'fa-solid fa-exclamation-triangle',
//         message: 'This token is already in your wallet'
//       })
//       return
//     }
    
//     // Register the token
//     await tacoStore.registerUserToken(newTokenPrincipal.value.trim())
    
//     // Clear input and refresh
//     const registeredPrincipal = newTokenPrincipal.value.trim()
//     newTokenPrincipal.value = ''
    
//     // Refresh registered tokens list
//     await fetchUserRegisteredTokens()
    
//     // Load balance for the new token
//     await loadAllBalances()
    
//     // Get the metadata for the registered token for the toast
//     const metadata = customTokenMetadata.value.get(registeredPrincipal)
//     const tokenName = metadata?.symbol || 'Custom Token'
    
//     tacoStore.addToast({
//       id: Date.now(),
//       code: 'register-success',
//       title: 'Token Registered',
//       icon: 'fa-solid fa-check',
//       message: `${tokenName} added to your wallet`
//     })
    
//     // Update the dropdown to include the new token
//     if (metadata?.symbol && metadata.symbol !== 'TACO') {
//       selectedGetTokenSymbol.value = metadata.symbol
//     }
    
//   } catch (error) {
//     console.error('Error registering custom token:', error)
//     tacoStore.addToast({
//       id: Date.now(),
//       code: 'register-error',
//       title: 'Registration Failed',
//       icon: 'fa-solid fa-exclamation-triangle',
//       message: 'Failed to register custom token'
//     })
//   } finally {
//     registeringToken.value = false
//   }
// }

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

// const formatUSDValue = (balance: bigint, decimals: number, priceUSD: number): string => {
//   const balanceNum = Number(balance) / (10 ** decimals)
//   const usdValue = balanceNum * priceUSD
  
//   if (usdValue < 0.01) {
//     return '< 0.01'
//   }
  
//   return usdValue.toLocaleString('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   })
// }

//////////////
// Watchers //
//////////////

// // Watchers to sync token selections
// watch(selectedGetTokenSymbol, (newSymbol) => {
//   // Sync step 2 when step 1 changes (unless user manually changed step 2)
//   if (!newSymbol || allTokens.value.length === 0) return
//   syncSwapTokenSelection()
// })

// // Watch for swap token changes to fetch quotes
// watch(selectedSwapFromToken, (newToken) => {
//   if (newToken && allTokens.value.length > 0) {
//     fetchSwapQuotes()
//   }
// })

// // Initialize selections when token data loads
// watch(allTokens, (newTokens) => {
//   if (newTokens.length > 0 && !selectedSwapFromToken.value) {
//     initializeTokenSelections()
//   }
// }, { deep: true })

/////////////////////
// Lifecycle Hooks //
/////////////////////

// on mounted
onMounted(async () => {

  // try
  try {

    // wait for authentication to be checked first
    await tacoStore.checkIfLoggedIn()

    // wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100))

    await fetchIcrc1BalanceOfIcp()
    await fetchIcrc1BalanceOfTaco()

    // if user is logged in
    if (tacoStore.userLoggedIn) {

      selectedGetTokenSymbol.value = 'ICP'

      await loadUserNeurons()

      // load wallet data
      await loadWalletData()
      
      // Initialize token selections after data loads
      if (allTokens.value.length > 0) {
        initializeTokenSelections()
      }

    } 
    
    // else user not logged in
    else {

      // turn app loading off
      loading.value = false

    }

  } 
  
  // catch
  catch (error) {

    // log error
    console.error('Error in wizard onMounted:', error)

    // turn app loading off
    loading.value = false

  }

})

</script>
