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

            <button v-if="!userLoggedIn" class="btn d-flex align-items-center gap-2 p-0 mt-4 mx-auto" @click="tacoStore.iidLogIn()">
              <DfinityLogo style="width: 2rem;" />
              <span class="taco-text-black-to-white">Log In</span>
            </button>

          </div>

        </div>

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

                <p class="mb-4">Your current ICP balance is <span class="fw-bold">{{ Number(fetchedIcpBalance).toFixed(2).toString() }}</span></p>

                <p class="mb-4">You can buy ICP on exchanges like <a class="wizard__step__link" href="https://www.coinbase.com" target="_blank">Coinbase</a>, <a class="wizard__step__link" href="https://www.binance.com" target="_blank">Binance</a>, or <a class="wizard__step__link" href="https://www.kraken.com" target="_blank">Kraken</a></p>   

                <p class="mb-0">Send some to this address:</p>

                <p class="mb-3">

                  <span class="wizard__step__link">
                    <span style="word-break: break-all;">
                      {{ userPrincipal }}
                    </span>
                  </span>
                  
                  <button @click="copy(userPrincipal); tacoStore.addToast({ id: Date.now(), code: 'copy-success', title: 'Copied!', icon: 'fa-solid fa-check', message: 'Address copied to clipboard' })"
                          style="color: var(--brown-to-white);"
                          class="btn m-0 p-0 px-2">

                    <i class="fa-regular fa-copy"></i>

                  </button>

                </p>

                <button :disabled="refreshingBalances"
                        class="btn taco-btn taco-btn--green taco-btn--big d-inline-block mb-3" 
                        @click="refreshBalances()">
                  {{ refreshingBalances ? 'Refreshing...' : 'Then Refresh' }}
                </button>

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
                  <span class="wizard__step__circle__text">Tokens</span>
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
                   You have {{ Number(fetchedIcpBalance).toFixed(2).toString() }} ICP
                </p>

                <!-- first sentence -->
                <div v-if="fetchedIcpBalance >= 1" 
                     class="d-flex align-items-baseline mb-0">

                  <!-- swap text -->
                  <span class="taco-text-black-to-white">Swap your {{ Number(fetchedIcpBalance).toFixed(2).toString() }} ICP for TACO via {{ bestExchange }}</span>

                </div>
                
                <!-- second sentence -->
                <p v-if="fetchedIcpBalance >= 1" 
                   class="mb-3">
                  
                  <!-- text -->
                  <span>You'll get ~<span class="fw-bold">{{ Number(swapOutputAmount).toFixed(2).toString() }} TACO</span> for your <span class="fw-bold">{{ Number(fetchedIcpBalance).toFixed(2).toString() }} ICP</span></span>

                </p>

                <button @click="performSwap"
                        :disabled="fetchedIcpBalance < 1 || Number(swapOutputAmount) < 1 || isSwapping"
                        class="wizard-custom-spacing-2 btn taco-btn taco-btn--green taco-btn--big">
                  {{ isSwapping ? 'Swapping...' : 'Swap Tokens' }}
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
                  <span class="wizard__step__circle__text">Get</span>
                  <span class="wizard__step__circle__text">TACO</span>
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
                  <span class="wizard__step__circle__text">TACO</span>
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
                   You have {{ Number(fetchedTacoBalance).toFixed(2).toString() }} TACO
                </p>

                <p v-if="fetchedTacoBalance >= 1"
                   class="mb-0">
                   Stake your {{ Number(fetchedTacoBalance).toFixed(2).toString() }} TACO in a Neuron
                </p>

                <p v-if="fetchedTacoBalance >= 1"
                   class="wizard-custom-spacing-1" 
                   style="margin-bottom: 2rem;">
                  We'll stake it for 30 days
                </p>

                <button @click="performStake"
                        :disabled="fetchedTacoBalance < 1 || isStaking"
                        class="btn taco-btn taco-btn--green taco-btn--big">
                  {{ isStaking ? 'Staking...' : 'Stake Tokens' }}
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
                  <span class="wizard__step__circle__text">TACO</span>
                </div>

              </div>

              <!-- right - step content -->
              <div class="wizard__step__content">

                <p class="mb-3">Presto! You've got a Taco Neuron</p>

                <p class="mb-2">You can now <router-link @click="toggleTacoWizard" to="/vote" class="btn taco-btn taco-btn--green taco-btn--big d-inline-block">vote</router-link> on DAO allocations and earn rewards!</p>

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
            <span class="taco-text-black-to-white d-block text-center p-5" style="font-size: 1.25rem;"><span style="font-size: 2rem;">🧙</span> Summoning Steps...</span>

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

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../stores/taco.store'
import { useKongStore } from '../stores/kong.store'
import { useICPSwapStore } from '../stores/icpswap.store'
import { storeToRefs } from 'pinia'
import { useClipboard } from '@vueuse/core'
import ChefWizard from '../components/misc/chefWizard.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'

///////////
// Setup //
///////////

const router = useRouter()
const { copy } = useClipboard()

////////////
// Stores //
////////////

// # SETUP #
const tacoStore = useTacoStore()
const kongStore = useKongStore()
const icpswapStore = useICPSwapStore()

// # STATE #
const { userLoggedIn } = storeToRefs(tacoStore)
const { userPrincipal } = storeToRefs(tacoStore)

// # ACTIONS #
const { toggleTacoWizard } = tacoStore

/////////////////////
// Local Variables //
/////////////////////

const loading = ref(true)
const loadingQuotes = ref(false)
const bestQuote = ref<any>(null)
const bestExchange = ref<string>('')
const isSwapping = ref(false)
const isStaking = ref(false)
const userNeurons = ref<any[]>([])
const fetchedIcpBalance = ref<bigint>(0n)
const fetchedIcpRawBalance = ref<bigint>(0n)
const refreshingBalances = ref(false)
const fetchedTacoBalance = ref<bigint>(0n)
const fetchedTacoRawBalance = ref<bigint>(0n)

////////////////////////
// Computed Variables //
////////////////////////

// swap output amount
const swapOutputAmount = computed(() => {

  // if no best quote, return 0
  if (!bestQuote.value) return '0'
  
  // convert from BigInt to decimal
  const outputAmount = Number(bestQuote.value.amountOut) / 1e8 // TACO has 8 decimals

  // return output amount as a string with 8 decimal places
  return outputAmount.toFixed(8)

})

///////////////////
// Local Methods //
///////////////////

// fetch ICRC1 balance of ICP
const fetchIcrc1BalanceOfIcp = async () => {

  // try
  try {

    // fetch ICRC1 balance of ICP
    const balance = await tacoStore.icrc1BalanceOf('ryjl3-tyaaa-aaaaa-aaaba-cai', Principal.fromText(tacoStore.userPrincipal))

    // // log
    // console.log('icp balance:', balance)

    // account for 8 zero decimals
    const balanceWithDecimals = Number(balance as bigint) / 10 ** 8

    // // log
    // console.log('icp balanceWithDecimals:', balanceWithDecimals)

    // set fetched ICP balance
    fetchedIcpBalance.value = balanceWithDecimals

    // set fetched ICP raw balance
    fetchedIcpRawBalance.value = balance as bigint

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

// fetch ICRC1 balance of TACO
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

    // set fetched TACO raw balance
    fetchedTacoRawBalance.value = balance as bigint

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

// refresh balances
const refreshBalances = async () => {

  // try
  try {

    // turn refreshing balances on
    refreshingBalances.value = true

    // fetch ICRC1 balance of ICP
    await fetchIcrc1BalanceOfIcp()

    // fetch ICRC1 balance of TACO
    await fetchIcrc1BalanceOfTaco()

    // if icp balance is greater than 1
    if (fetchedIcpBalance.value >= 1) {

      // get quotes
      await fetchSwapQuotes()

    }

  } catch (error) {

    // log error
    console.error('Error refreshing balances:', error)

  } finally {

    // turn refreshing balances off
    refreshingBalances.value = false

    // if more than 1 icp, get quotes
    if (fetchedIcpBalance.value > 1) {
      await fetchSwapQuotes()
    }

  }

}

// load user neurons
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

// fetch swap quotes
const fetchSwapQuotes = async () => {

  // // log
  // console.log('get quotes from both exchanges...')

  loadingQuotes.value = true
  bestQuote.value = null
  bestExchange.value = ''
  
  try {

    // get quotes from both exchanges
    const [kongQuote, icpSwapQuote] = await Promise.allSettled([
      kongStore.getQuote({
        sellTokenSymbol: 'ICP',
        buyTokenSymbol: 'TACO',
        amountIn: fetchedIcpRawBalance.value
      }),
      icpswapStore.getQuote({
        sellTokenPrincipal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
        buyTokenPrincipal: 'kknbx-zyaaa-aaaaq-aae4a-cai',
        amountIn: fetchedIcpRawBalance.value
      })
    ])
    
    // process quotes and find the best one
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

      // sort by amount out (highest first) and pick the best
      const sortedQuotes = quotes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut))
      bestQuote.value = sortedQuotes[0]
      bestExchange.value = sortedQuotes[0].exchange

      // log
      // console.log('sortedQuotes:', sortedQuotes)
      // console.log('bestQuote', bestQuote.value)
      // console.log('bestExchange:', bestExchange.value)
      // console.log('found a best quote on wizard load')

    } else {

      // // log
      // console.log('no quotes available')

    }
    
  } catch (error) {
    console.error('Error fetching quotes:', error)
  } finally {
    loadingQuotes.value = false
  }
}

// perform swap
const performSwap = async () => {

  // // log
  // console.log('performing swap...')

  // turn swapping on
  isSwapping.value = true
  
  // try
  try {

    const extraFeeReserve = 10000n // reserve one additional fee for ICPSwap operations
    const amountInBigInt = fetchedIcpRawBalance.value - 10000n - extraFeeReserve
    const maxSwapAmount = Number(amountInBigInt) / (10 ** 8)

    // // log
    // console.log('extraFeeReserve:', extraFeeReserve)
    // console.log('amountInBigInt:', amountInBigInt)
    // console.log('maxSwapAmount:', maxSwapAmount)
    
    // get quotes from both exchanges
    const [kongQuote, icpSwapQuote] = await Promise.allSettled([
      kongStore.getQuote({
        sellTokenSymbol: 'ICP',
        buyTokenSymbol: 'TACO',
        amountIn: amountInBigInt
      }),
      icpswapStore.getQuote({
        sellTokenPrincipal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
        buyTokenPrincipal: 'kknbx-zyaaa-aaaaq-aae4a-cai',
        amountIn: amountInBigInt
      })
    ])
    
    // empty quotes array
    const quotes = []
    
    // if kong quote is fulfilled, push to quotes
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
    
    // if icp swap quote is fulfilled, push to quotes
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
    
    // if no quotes are available, throw an error
    if (quotes.length === 0) {
      throw new Error('No swap quotes available')
    }
    
    // Sort by amount out (highest first) and pick the best
    const bestQuote = quotes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut))[0]

    // // log
    // console.log('bestQuote on wizard perform swap:', bestQuote)
    // console.log('found a best quote on wizard perform swap')
    
    // // log
    // console.log(`Using ${bestQuote.exchange} with expected output: ${Number(bestQuote.amountOut) / 1e8} TACO`)
    
    // Execute the swap using the same approach as SwapConfirmDialog
    let swapResult
    const slippageTolerance = 0.03 // 3% slippage
    const minAmountOut = BigInt(Math.floor(Number(bestQuote.amountOut) * (1 - slippageTolerance)))
    
    const swapParams = {
      sellTokenPrincipal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
      sellTokenSymbol: 'ICP',
      buyTokenPrincipal: 'kknbx-zyaaa-aaaaq-aae4a-cai',
      buyTokenSymbol: 'TACO',
      amountIn: amountInBigInt,
      minAmountOut,
      slippageTolerance,
    }
    
    // if kong quote is best, swap with kong
    if (bestQuote.exchange === 'Kong') {

      // // log
      // console.log('SWAP WITH KONG')

      // try
      try {

        // swap with kong
        swapResult = await kongStore.icrc1_swap(swapParams)

      } catch (error) {

        // log error
        console.error('Kong swap failed:', error)

      }

    } 
    
    // else use icpswap
    else {

      // try
      try {

        // // log
        // console.log('SWAP WITH ICPSWAP')

        // // swap with icpswap
        swapResult = await icpswapStore.icrc2_swap(swapParams)

      } catch (error) {

        // log error
        console.error('ICPSwap swap failed:', error)

      }

    }
    
  } 
  
  // catch
  catch (error: any) {

    // log error
    console.error('Swap failed:', error)

    // show error toast
    tacoStore.addToast({
      id: Date.now(),
      code: 'swap-failed',
      title: 'Swap Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to execute swap. Please try again.'
    })

  } 
  
  // finally
  finally {

    // // log
    // console.log('swap over')

    // turn swapping off
    isSwapping.value = false

    // wait for 2 seconds then refresh balances
    setTimeout(async () => {
      await refreshBalances()
    }, 3000)

  }

}

// perform stake
const performStake = async () => {

  // // log
  // console.log('performing stake...')

  // try
  try {
    
    // turn staking on
    isStaking.value = true

    // max stakeable amount (balance - fee)
    const maxStakeAmount = fetchedTacoRawBalance.value - 10000n

    // // log
    // console.log('max stakeable amount:', maxStakeAmount)
    
    // if a minimum of 1 TACO
    if (maxStakeAmount >= 100000000n) {

      // create neuron with all available TACO and default dissolve delay
      const result = await tacoStore.createNeuron(maxStakeAmount)
      
      // if neuron created successfully
      if (result.success && result.subaccount) {
        
        // try
        try {

          // define dissolve delay in months
          const delayMonths = 1

          // set dissolve delay
          await tacoStore.setNeuronDissolveDelay(result.subaccount, delayMonths)

          // // log
          // console.log(`dissolve delay successfully set to 1 month`)

        } 
        
        // catch
        catch (dissolveError: any) {

          // log error
          console.error('failed to set dissolve delay to 1 month:', dissolveError)

        }
        
        // Show success message
        tacoStore.addToast({
          id: Date.now(),
          code: 'swap-stake-success',
          title: 'Swap & Stake Complete!',
          icon: 'fa-solid fa-magic',
          message: `Successfully staked ${formatBalance(maxStakeAmount, 8)} TACO in a new neuron!`
        })
        
        // Refresh neurons list to show the new neuron
        await loadUserNeurons()
        
        
      } 
      
      // else failed to create neuron
      else {

        // log error
        console.error('failed to create neuron')

      }

    } 
    
    // else insufficient taco
    else {

      // log error
      console.error('insufficient taco balance to create neuron (minimum 1 TACO required)')

    }
    
  } 
  
  // catch
  catch (error: any) {

    // log error
    console.error('staking failed:', error)

    // refresh balances
    await refreshBalances()
    
    // refresh user neurons
    await loadUserNeurons()
    
  } 
  
  // finally
  finally {

    // turn staking off
    isStaking.value = false

    // wait for 2 seconds then load user neurons
    setTimeout(async () => {
      await loadUserNeurons()
    }, 2000)      

  }

}

// format balance
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

/////////////////////
// Lifecycle Hooks //
/////////////////////

// on mounted
onMounted(async () => {

  // try
  try {

    // check if logged in
    await tacoStore.checkIfLoggedIn()

    // wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100))

    // if user is logged in
    if (tacoStore.userLoggedIn) {

      // get user neurons
      await loadUserNeurons()
      
      // if user has neurons, return early
      if (userNeurons.value.length > 0) {
        
        // return early
        return
        
      }

      // // log
      // console.log('user has no neurons, continuing...')

      // get user taco balance
      await fetchIcrc1BalanceOfTaco()
      
      // if user has taco balance, return early
      if (fetchedTacoBalance.value >= 1) {
        
        // return early
        return
        
      }

      // // log
      // console.log('user has no taco balance, continuing...')

      // get user icp balance
      await fetchIcrc1BalanceOfIcp()

      // if user has icp balance greater that or equal to 1, get quotes
      if (fetchedIcpBalance.value >= 1) {

        // // log
        // console.log('user has icp balance, fetching quotes...')
        
        // fetch quotes
        await fetchSwapQuotes()
        
      }

    }

  } 
  
  // catch
  catch (error) {

    // log error
    console.error('Error in wizard onMounted:', error)

    // turn app loading off
    loading.value = false

  }

  // finally
  finally {

    // turn app loading off
    loading.value = false

  }

})

</script>
