<template>

  <div class="dao-trusted-tokens">

      <!-- dao trusted tokens loading curtain -->
      <div v-if="componentLoading" class="dao-trusted-tokens__loading-curtain">

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
                        table table-sm table-responsive m-0">

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
                        table table-sm table-responsive m-0">

              <!-- table head -->
              <thead>

                <!-- table row-->
                <tr>

                  <!-- symbol -->
                  <th class="fw-bold" 
                      scope="col">
                      <span class="ps-3 pe-4">Symbol</span>
                  </th>

                  <!-- percentage -->
                  <th class="fw-bold text-end"
                      scope="col">
                      <span class="pe-4">%</span>
                  </th> 

                  <!-- holdings -->
                  <th class="fw-bold text-end"
                      scope="col">
                      <span class="pe-4">Holdings</span>
                  </th>

                  <!-- value -->
                  <th class="fw-bold text-end"
                      scope="col">
                      <span class="pe-4">Value</span>
                  </th>      
                  
                  <!-- date added -->
                  <th class="fw-bold text-end"
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

                    </div>

                  </td>

                  <!-- holding % -->
                  <td class="text-end pe-4">
                    <span>{{ token.holdingPercentage.amount }}%</span>
                  </td>

                  <!-- holdings -->
                  <td class="text-end pe-4">
                    <span data-bs-toggle="tooltip" data-bs-placement="top" :title="token.currentHoldings.amount">{{ formatNumber(token.currentHoldings.amount) }}</span>
                  </td>

                  <!-- value -->
                  <td class="text-end pe-4">
                    <span>${{ (token.currentHoldings.amount * token.priceInUSD).toFixed(2) }}</span>
                  </td>

                  <!-- date added -->
                  <td class="pe-3 text-end">
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

      <!-- pagination container - l2 -->
      <div class="taco-container taco-container--l2 taco-container--l2--dark
                  p-2 d-flex justify-content-center">

        <!-- pagination -->
        <div class="d-flex gap-2 overflow-auto">

            <button type="button" 
                class="taco-nav-btn disabled
                        btn">
            <i class="fa-solid fa-angle-left"></i>
            </button>
            <button type="button" 
                    class="taco-nav-btn taco-nav-btn--active
                            btn">
            1
            </button>
            <button type="button" 
                    class="taco-nav-btn disabled
                            btn">
            <i class="fa-solid fa-angle-right"></i>
            </button>

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
    width: 100%;
    border-collapse: collapse;

    // table container
    &__cont {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      border-radius: 0.5rem;
      overflow: auto;
    }

    // thead
    thead {

      // thead row
      tr {

        // headiing
        th {
          color: var(--white);
          font-weight: bold;
          padding: 0.325rem 0;
          background-color: var(--dark-orange-to-light-brown);
          position: sticky;
          top: 0;
          z-index: 1;

          // first heading
          &:first-of-type {
            border-top-left-radius: 0.5rem;
          padding-left: 1rem;
          }

          // last heading
          &:last-of-type {
            border-top-right-radius: 0.5rem;
            padding-right: 1rem;
          }

        }

      }

    }

    // tbody
    tbody {

      // tbody row
      tr {

        // data
        td {
          font-size: 0.825rem;
          // font-weight: bold;
          color: var(--black-to-white);
          background-color: var(--light-orange-to-dark-brown);
          border-bottom: 1px solid var(--dark-orange);
          padding: 0.5rem 0;
          transition: background-color 0.075s;

          // 
          span {
            color: var(--black-to-white);
          }

          // first data
          &:first-of-type {
            // padding-left: 1rem;
            // padding-right: 2rem;
          }

          // last data
          &:last-of-type {
            // padding-left: 2rem;
            // padding-right: 1rem;

          }

        }

        // hover
        &:hover {
          cursor: pointer;

          td {
            background-color: var(--orange-to-brown);
          }

        }

        // last tbody row
        &:last-of-type {

          // data
          td {
            // border-bottom: 0;

            // first data
            &:first-of-type {
              border-bottom-left-radius: 0.5rem;
            }

            // last data
            &:last-of-type {
              border-bottom-right-radius: 0.5rem;
            }

            // 
            

          }

        }

      }

    }

    // empty
    &__empty {
      text-align: center;
      padding: 0.5rem 0;
      background-color: var(--light-orange-to-dark-brown);
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;

      span {
        opacity: 0.5;
      }

    }

  }

  // token image
  &__token-img {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
  }

  // loading curtain
  &__loading-curtain {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      z-index: 99999; // above everything

      .loading-img {
          width: 10rem;
      }
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

  import { ref, onMounted, computed, onBeforeUnmount } from "vue"
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
  const { fetchTokenDetails } = tacoStore

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
  const formattedTokenDetails = ref([])

  ///////////////////
  // local methods //
  ///////////////////

  //////////////
  // handlers //

  // handle fetched token details
  const handleFetchedTokenDetails = (fetchedTokenDetails: any) => {

    // filter for active tokens
    const activeTokens = fetchedTokenDetails.filter((token: [any, { Active: boolean, isPaused: boolean }]) => {
      return token[1].Active === true && token[1].isPaused === false
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

  // format number to remove trailing zeros
  const formatNumber = (num: number) => {
    return num.toFixed(4).replace(/\.?0+$/, '')
  }

  //////////////
  // computed //
  //////////////

  // computed
  computed(() => {
    
    // 

  })

  /////////////
  // mounted //
  /////////////

  // on mounted
  onMounted(async () => {

    // turn on loading
    componentLoading.value = true

    // try
    try { 

      // fetch token details from dao backend
      await fetchTokenDetails()

      // log
      // console.log('fetchedTokenDetails: ', fetchedTokenDetails.value)
      
      // log
      // console.log('tokenData: ', tokenData)

      // handle fetched token details
      handleFetchedTokenDetails( fetchedTokenDetails.value )

      // 

    } catch (error) {

      // log
      console.error('error fetching token details:', error)

      // turn off loading
      componentLoading.value = false

    } finally {

      // turn off loading
      componentLoading.value = false

    }

    // refresh every minute
    refreshTimer.value = window.setInterval(async () => {

      // log
      console.log('refreshing trusted tokens tile...')

      // turn on loading
      componentLoading.value = true

      // try
      try { 

        // fetch token details from dao backend
        await fetchTokenDetails()

        // handle fetched token details
        handleFetchedTokenDetails(fetchedTokenDetails.value)

      } catch (error) {

        // log
        console.error('error refreshing token details:', error)

      } finally {

        // turn off loading
        componentLoading.value = false

      }

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