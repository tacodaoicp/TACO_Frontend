<template>

  <div class="dao-trusted-tokens">

      <!-- dao trusted tokens loading curtain -->
      <div v-if="componentLoading" class="taco-loading-curtain dao-trusted-tokens__loading-curtain">

          <!-- astronaut -->
          <img :src="astronautLoaderUrl" class="loading-img">

      </div>    

      <!-- toolbar container - l2 -->
      <div class="taco-container taco-container--l2 taco-container--l2--dark p-2">

        <!-- toolbar -->
        <div class="taco-toolbar">

            <!-- buttons -->
            <div class="btn-group">

                <!-- best performance -->
                <!-- <button @click="navSelected = 'best-performance'" 
                        class="btn taco-nav-btn"
                        :class="{'taco-nav-btn--active': isBestPerformance}">Performance</button> -->

                <!-- amount held -->
                <button @click="navSelected = 'amount-held'" 
                        class="btn taco-nav-btn"
                        :class="{'taco-nav-btn--active': isAmountHeld}">Amount Held</button>

            </div>

        </div>

      </div>

      <!-- taco container - l2 -->
      <div class="dao-trusted-tokens__table__cont">

          <!-- best performance table -->
          <table v-if="isBestPerformance"
                  class="dao-trusted-tokens__table
                        taco-table
                        table table-sm m-0">

            <!-- table head -->
            <thead>

              <!-- table row -->
              <tr>

                <!-- symbol -->
                <th class="fw-bold"
                    scope="col">
                    <span class="pe-3">Symbol</span>
                </th>

                <!-- 1 hour -->
                <th class="fw-bold text-center"
                    scope="col">
                    <span class="pe-3">1h</span>
                </th>

                <!-- 24 hour -->
                <th class="fw-bold text-center"
                    scope="col">
                    <span class="pe-3">24h</span>
                </th>

                <!-- 7 day -->
                <th class="fw-bold text-center"
                    scope="col">
                    <span class="pe-3">7D</span>
                </th>

                <!-- 1 month -->
                <th class="fw-bold text-center"
                    scope="col">
                    <span>30D</span>
                </th> 

              </tr>

            </thead>

            <!-- table body -->
            <tbody>

              <!-- table row -->
              <tr v-for="token in formattedTokenDetails">

                <!-- token symbol -->
                <td class="ps-3">

                  <div class="d-flex align-items-center gap-2 pe-3">

                    <!-- token image -->
                    <img :src="token.tokenIcon" class="dao-trusted-tokens__token-img">

                    <!-- token link -->
                    <a :href="token.tokenLink" 
                        target="_blank"
                        class="taco-text-blue-to-light-blue">{{ token.symbol }}</a>

                  </div>

                </td>

                <!-- 1 hour -->
                <td class="text-center">
                  <span class="pe-3"
                    :class="getPosNegClass(token.oneHour || 0)">{{ token.oneHour || 0 }}%</span>
                </td>

                <!-- 24 hour -->
                <td class="text-center">
                  <span class="pe-3"
                    :class="getPosNegClass(token.oneDay || 0)">{{ token.oneDay || 0 }}%</span>
                </td>

                <!-- 7 day -->
                <td class="text-center">
                  <span class="pe-3"
                    :class="getPosNegClass(token.oneWeek || 0)">{{ token.oneWeek || 0 }}%</span>
                </td>

                <!-- 1 month -->
                <td class="text-center">
                  <span class="pe-3"
                    :class="getPosNegClass(token.oneMonth || 0)">{{ token.oneMonth || 0 }}%</span>
                </td>

              </tr>

            </tbody>

          </table>      

          <!-- amounts held table -->
          <table v-if="isAmountHeld"
                  class="dao-trusted-tokens__table
                        taco-table
                        table table-sm m-0">

              <!-- table head -->
              <thead>

                <!-- table row-->
                <tr>

                  <!-- symbol -->
                  <th class="fw-bold" 
                      scope="col">
                      <span class="pe-4">Symbol</span>
                  </th>

                  <!-- percentage -->
                  <th class="fw-bold text-end"
                      scope="col">
                      <span class="pe-4">% Held</span>
                  </th> 

                  <!-- value -->
                  <th class="fw-bold text-end"
                      scope="col">
                      <span class="pe-4">Value</span>
                  </th>      
                  
                  <!-- date added (hidden on mobile) -->
                  <th class="fw-bold text-end d-none d-md-table-cell"
                      scope="col">
                      <span>Date Added</span>
                  </th>                  

                </tr>

              </thead>

              <!-- table body -->
              <tbody>

                <!-- table row -->
                <tr v-for="token in formattedTokenDetails">

                  <!-- token symbol -->
                  <td class="ps-3 pe-4">

                    <div class="d-flex align-items-center gap-2">

                      <!-- token image -->
                      <img :src="token.tokenIcon" class="dao-trusted-tokens__token-img">

                      <!-- token link -->
                      <a :href="token.tokenLink" 
                        target="_blank"
                        class="taco-text-blue-to-light-blue">{{ token.symbol }}</a>

                      <!-- paused indicator -->
                      <span v-if="token.isPaused" 
                            class="dao-trusted-tokens__table__paused-indicator"
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="This token is paused. It will not be included in the trading bots rotation until it is unpaused.">Paused</span>

                    </div>

                  </td>

                  <!-- % held -->
                  <td class="text-end pe-4">
                    <span>{{ token.holdingPercentage.amount }}%</span>
                  </td>

                  <!-- value -->
                  <td class="text-end pe-4">
                    <span>${{ (token.currentHoldings.amount * token.priceInUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                  </td>

                  <!-- date added (hidden on mobile) -->
                  <td class="pe-3 text-end d-none d-md-table-cell">
                    <span>{{ formatDate(token.epochAdded) }}</span>
                  </td>                  

                </tr>

              </tbody>

          </table>

          <!-- if no tokens -->
          <div v-if="formattedTokenDetails.length === 0"
            class="text-center pt-5 pb-4"
            style="opacity: 0.5;">
            <span class="text-center taco-text-black-to-white">No tokens available</span>
          </div>

      </div>

  </div>
  
</template>
  
<style scoped lang="scss">

/////////////////////
// component style //
/////////////////////

// dao trusted tokens
.dao-trusted-tokens {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1rem;
  // min-height: 560px;
  height: 100%;
  padding: 1.25rem;
  position: relative;

  // table
  &__table {

    // table container
    &__cont {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: auto;
    }

    // override taco-table for sticky headers
    thead th {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    // override taco-table td font size for compact display
    tbody td {
      font-size: 0.825rem;
      padding: 0.5rem 1rem;

      span {
        color: rgba(255, 255, 255, 0.85);
      }
    }

    // hover cursor
    tbody tr:hover {
      cursor: pointer;
    }

    // empty
    &__empty {
      text-align: center;
      padding: 0.5rem 0;
      background-color: rgba(0, 0, 0, 0.15);

      span {
        opacity: 0.5;
      }

    }

    // paused indicator
    &__paused-indicator {
      color: rgba(255, 255, 255, 0.85) !important;
      background-color: rgba(0, 0, 0, 0.25) !important;
      border-radius: 0.25rem;
      padding: 0rem 0.325rem;
      font-size: 0.75rem;
      border: 1px solid var(--card-border);
    }

  }

  // token image
  &__token-img {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
  }

  // loading curtain (extends .taco-loading-curtain)
  &__loading-curtain {
      z-index: 9998; // above everything, below global default
  }

}

///////////////
// overrides //
///////////////

// 


///////////////////
// media queries //
///////////////////

// // phone protrait
// @media (max-width: 575.98px) {

// }

// // phone landscape
// @media (min-width: 576px) and (max-width: 767.98px) {
    
// }

// // tablet
// @media (min-width: 767px) and (max-width: 991.98px) {

// }

// // small daktop
// @media (min-width: 992px) and (max-width: 1199.98px) {
    
// }

// // medium desktop
// @media (min-width: 1200px) and (max-width: 1399.98px) {
    
// }

</style>
  
<script setup lang="ts">

/*

ON MOUNTED
  fetch token details
  handleFetchedTokenDetails

LOCAL METHODS
  handleFetchedTokenDetails
    create formatted tokens array from fetched tokens array
      get token info from second element
      find 

*/
  
  /////////////
  // Imports //
  /////////////

  import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue"
  import { useTacoStore } from "../../stores/taco.store"
  import { storeToRefs } from "pinia"
  import astronautLoader from '../../assets/images/astonautLoader.webp'
  import { tokenData } from "../data/TokenData"

  ///////////
  // Store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // otc backend
  const { fetchedTokenDetails } = storeToRefs(tacoStore)

  // # ACTIONS #

  // otc backend
  const { ensureTokenDetails, fetchTokenDetails } = tacoStore

  /////////////////////
  // local variables //
  /////////////////////

  // component
  const componentLoading = ref(false)  

  // refresh timer
  const refreshTimer = ref<number | null>(null)  

  // images
  const astronautLoaderUrl =  astronautLoader  

  // dao trusted tokens stuff
  const navSelected = ref('amount-held')
  const isBestPerformance = computed(() => navSelected.value === 'best-performance')
  const isAmountHeld = computed(() => navSelected.value === 'amount-held')

  // formatted token details
  const formattedTokenDetails = ref<any[]>([])

  ///////////////////
  // local methods //
  ///////////////////

  //////////////
  // handlers //

  // handle fetched token details
  const handleFetchedTokenDetails = (fetchedTokenDetails: any) => {

    // filter for active tokens (including paused ones)
    const activeTokens = fetchedTokenDetails.filter((token: [any, { Active: boolean, isPaused: boolean }]) => {
      return token[1].Active === true
    })

    // calculate total value across all tokens
    const totalValue = activeTokens.reduce((sum: number, tokenArray: any) => {
      const token = tokenArray[1]
      const normalizedBalance = Number(token.balance) / Math.pow(10, Number(token.tokenDecimals))
      return sum + (normalizedBalance * Number(token.priceInUSD))
    }, 0)

    // map over fetched tokens and extract token details from inner array
    formattedTokenDetails.value = activeTokens.map((tokenArray: any) => {

      // get token details from sub array
      const token = tokenArray[1]

      // 
      const normalizedBalance = Number(token.balance) / Math.pow(10, Number(token.tokenDecimals))
      
      // find matching token data using symbol
      const tokenInfo = tokenData.find((t: any) => 
          t.symbol.toLowerCase() === token.tokenSymbol.toLowerCase()
      )
      
      // calculate holding percentage based on USD value
      const percentage = totalValue > 0 
        ? Number(((normalizedBalance * Number(token.priceInUSD) / totalValue) * 100).toFixed(2))
        : 0
      
      return {
        ...token,
        symbol: token.tokenSymbol,
        holdingPercentage: {
          amount: percentage.toFixed(2)
        },
        currentHoldings: {
          amount: normalizedBalance
        },
        tokenLink: tokenInfo?.link || '#',
        tokenDescription: tokenInfo?.description,
        tokenIcon: tokenInfo?.icon
      }

    })
    
  }

  /////////////
  // returns //

  // return red or green classes based on value
  const getPosNegClass = (value: number) => {
    if (value === 0) {
      return 'taco-text-dark-gray-to-gray'
    } else {
      return value > 0 ? "taco-text-light-green-to-success-green-hover" : "taco-text-red-to-light-red";
    }
  }  

  // return formatted date
  const formatDate = (epochTimestamp: bigint) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: '2-digit', 
      year: 'numeric' 
    }
    // convert epoch timestamp (in nanoseconds) to milliseconds
    const date = new Date(Number(epochTimestamp / BigInt(1_000_000)))
    return date.toLocaleDateString('en-US', options)
  }

  // format number to remove trailing zeros and add commas
  const formatNumber = (num: number) => {

    // if number is exactly 0, return 0
    if (num === 0) {
      return 0
    }

    // if the number is less that 0.0001, return ~0
    if (Number(num.toFixed(4).replace(/\.?0+$/, '')) < 0.0001) {
      return '~0'
    }

    // else return number with 4 decimal places and commas
    else {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      }).replace(/\.?0+$/, '')
    }

  }

  //////////////
  // computed //
  //////////////

  // computed
  computed(() => {

    //

  })

  //////////////
  // watchers //
  //////////////

  // Watch for data arriving from worker (update display when cached data arrives)
  watch(fetchedTokenDetails, (newData) => {
    if (newData && newData.length > 0) {
      handleFetchedTokenDetails(newData)
      componentLoading.value = false
    }
  })

  /////////////
  // mounted //
  /////////////

  // on mounted
  onMounted(async () => {

    // Check if we already have cached data
    const hasCachedData = fetchedTokenDetails.value && fetchedTokenDetails.value.length > 0

    // If we have cached data, use it immediately (no loading spinner)
    if (hasCachedData) {
      handleFetchedTokenDetails(fetchedTokenDetails.value)

      // Trigger background refresh (fire-and-forget)
      fetchTokenDetails().catch(console.error)
    } else {
      // No cached data - show loading and fetch
      componentLoading.value = true

      try {
        await fetchTokenDetails()
        handleFetchedTokenDetails(fetchedTokenDetails.value)
      } catch (error) {
        console.error('error fetching token details:', error)
      } finally {
        componentLoading.value = false
      }
    }

    // Refresh every minute - NO loading animation, just silent update
    refreshTimer.value = window.setInterval(async () => {
      try {
        // Fetch in background - no loading spinner
        await fetchTokenDetails()
        // Update the table with new data
        handleFetchedTokenDetails(fetchedTokenDetails.value)
      } catch (error) {
        console.error('error refreshing token details:', error)
      }
      // No loading animation - data updates silently

    }, 60000) // 60000ms = 1 minute

  })

  // on before unmounted
  onBeforeUnmount(() => {

    // clear refresh timer
    if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
    }

  }) 
  
</script>