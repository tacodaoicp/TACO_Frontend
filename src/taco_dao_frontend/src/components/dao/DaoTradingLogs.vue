<template>

    <div class="dao-trading-logs">

        <!-- taco container - l2 -->
        <div class="dao-trading-logs__table__cont">    

            <!-- amounts held table -->
            <table class="dao-trading-logs__table
                        taco-table
                        table table-sm table-responsive m-0">

                <!-- table head -->
                <thead>

                    <!-- table row-->
                    <tr>

                        <!-- Sold -->
                        <th class="fw-bold" 
                            scope="col">
                            <span class="pe-3">Sold</span>
                        </th>

                        <!-- For -->
                        <th class="fw-bold"
                            scope="col">
                            <span class="pe-3">For</span>
                        </th> 

                        <!-- On -->
                        <th class="fw-bold"
                            scope="col">
                            <span>On</span>
                        </th>             

                    </tr>

                </thead>

                <!-- table body -->
                <tbody>

                    <!-- table row -->
                    <tr v-for="log in logs" :key="log.id">

                        <!-- Sold -->
                        <td class="pe-3">{{ formatAmount(log.amountSold, 8) }} <span style="text-transform: uppercase;">{{ getTokenInfo(log.tokenSold)?.symbol || '???' }}</span></td>

                        <!-- For -->
                        <td class="pe-3">
                            {{ formatAmount(log.amountBought, 8) }} <span style="text-transform: uppercase;">{{ getTokenInfo(log.tokenBought)?.symbol || '???' }}</span>
                        </td>

                        <!-- On -->
                        <td>
                            {{ formatTimestamp(Number(log.timestamp)) }}
                        </td>

                    </tr>

                    <!-- empty row -->
                    <tr v-if="logs.length === 0">
                        <td colspan="3" class="text-center">
                            <span style="opacity: 0.5;">No trades yet</span>
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    </div>

</template>

<style lang="scss" scoped>

.dao-trading-logs {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    background: var(--light-orange-to-brown);
    border-radius: 8px;
    width: 100%;

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
            padding-left: 1rem;
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

}
</style> 

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
    import { useTacoStore } from '../../stores/taco.store'
    import { storeToRefs } from 'pinia'
    import { tokenData } from '../data/TokenData'

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // fetched trading status
    const { fetchedTradingStatus } = storeToRefs(tacoStore)

    // 
    const { fetchedTokenDetails } = storeToRefs(tacoStore)

    // # ACTIONS #

    // get trading status
    const { getTradingStatus } = tacoStore

    // 
    const { fetchTokenDetails } = tacoStore

    /////////////////////
    // local variables //
    /////////////////////

    // refresh interval
    let refreshInterval: number | null = null

    ///////////////////
    // local methods //
    ///////////////////

    // refresh data
    const refreshData = async () => {
        
        // log
        console.log('refreshing news tile...')

        // get trading status
        await getTradingStatus()
    }

    // format date
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(Number(timestamp) / 1_000_000)
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
            timeZoneName: 'short'
        }
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }
        return `${date.toLocaleTimeString('en-US', timeOptions)} ${date.toLocaleDateString('en-US', dateOptions)}`
    }

    // format amount
    const formatAmount = (amount: string | bigint, decimals: number | bigint) => {
        try {
            let strAmount: string;
            // Convert decimals to number to ensure string operations work
            const decimalPlaces = Number(decimals);
            
            if (typeof amount === 'bigint') {
                // Convert BigInt to string and pad with zeros if needed
                strAmount = amount.toString();
                // Pad with leading zeros if necessary
                if (strAmount.length <= decimalPlaces) {
                    strAmount = '0'.repeat(decimalPlaces - strAmount.length + 1) + strAmount;
                }
                // Insert decimal point from right
                const insertIndex = strAmount.length - decimalPlaces;
                strAmount = strAmount.slice(0, insertIndex) + '.' + strAmount.slice(insertIndex);
                // Remove trailing zeros and decimal point if no decimals
                strAmount = strAmount.replace(/\.?0+$/, '');
            } else {
                strAmount = amount;
            }

            // Parse the string amount
            const numAmount = parseFloat(strAmount);
            if (isNaN(numAmount)) return '0.00';
            
            // Split into integer and decimal parts
            const [integerPart, decimalPart = ''] = strAmount.split('.');
            
            // Add commas to the integer part
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            
            // Pad or truncate decimal part as needed
            const formattedDecimal = decimalPart.padEnd(2, '0').slice(0, decimalPlaces);
            
            // Return the formatted number
            return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : `${formattedInteger}.00`;
        } catch (error) {
            console.error('Error formatting amount:', error);
            return '0.00';
        }
    }

    // get token info
    const getTokenInfo = (principal: string) => {
        if (!principal) return null
        const tokenDetail = fetchedTokenDetails.value?.find((entry) => entry[0].toString() === principal.toString())?.[1]
        if (!tokenDetail) return null
        return tokenData.find(t => t.symbol.toLowerCase() === tokenDetail.tokenSymbol.toLowerCase())
    }    
    
    //////////////
    // computed //
    //////////////

    // logs
    const logs = computed(() => {
        const trades = fetchedTradingStatus?.value?.ok?.executedTrades || []
        return trades.slice(-20).reverse() // get last 20 and reverse to show newest first
    })
  
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // on mounted
    onMounted(async () => {
        
        // get trading status from treasury backend
        await getTradingStatus()

        // log
        // console.log('DaoTradingLogs.vue: onMounted() - fetched trading status:', fetchedTradingStatus.value)

        // if no token details, fetch them
        if (!fetchedTokenDetails.value.length) {
            await fetchTokenDetails()
        }

        // log
        // console.log('DaoTradingLogs.vue: onMounted() - fetched token details:', fetchedTokenDetails.value)

        // set refresh interval
        refreshInterval = window.setInterval(refreshData, 60_000)

    })

    // on before unmount
    onBeforeUnmount(() => {
        // clear refresh interval
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    })

</script>