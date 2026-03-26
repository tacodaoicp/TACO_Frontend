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
                        <td class="pe-3">{{ formatAmount(log.amountSold, getTokenDecimals(log.tokenSold)) }} <span style="text-transform: uppercase;">{{ getTokenInfo(log.tokenSold)?.symbol || '???' }}</span></td>

                        <!-- For -->
                        <td class="pe-3">
                            {{ formatAmount(log.amountBought, getTokenDecimals(log.tokenBought)) }} <span style="text-transform: uppercase;">{{ getTokenInfo(log.tokenBought)?.symbol || '???' }}</span>

                          <!-- failed indicator -->
                          <span v-if="!log.success"
                                class="dao-trading-logs__table__failed-indicator"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Trades typically fail due to slippage being over the allowed threshold">Failed</span>

                        </td>

                        <!-- On -->
                        <td>
                            
                          <span class="pe-3">{{ formatTimestamp(Number(log.timestamp)) }}</span>

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
    width: 100%;

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

    // failed indicator
    &__failed-indicator {
      color: rgba(255, 255, 255, 0.85);
      background-color: rgba(0, 0, 0, 0.25);
      border-radius: 0.25rem;
      margin-left: 0.5rem;
      padding: 0rem 0.325rem;
      font-size: 0.75rem;
      border: 1px solid var(--card-border);

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

    // dao backend
    const { ensureTokenDetails } = tacoStore

    // 
    const { fetchedTokenDetails } = storeToRefs(tacoStore)

    // # ACTIONS #

    // get trading status
    const { getTradingStatus } = tacoStore

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
            hour12: true
        }
        const dateOptions: Intl.DateTimeFormatOptions = {
            month: 'numeric',
            day: 'numeric'
        }
        return `${date.toLocaleTimeString('en-US', timeOptions)} ${date.toLocaleDateString('en-US', dateOptions)}`
    }

    // format amount
    const formatAmount = (amount: string | bigint, decimals: number | bigint) => {

        try {

            let strAmount: string

            // convert decimals to number to ensure string operations work
            const decimalPlaces = Number(decimals)
            
            if (typeof amount === 'bigint') {

                // convert BigInt to string and pad with zeros if needed
                strAmount = amount.toString()

                // pad with leading zeros if necessary
                if (strAmount.length <= decimalPlaces) {

                    strAmount = '0'.repeat(decimalPlaces - strAmount.length + 1) + strAmount

                }

                // insert decimal point from right
                const insertIndex = strAmount.length - decimalPlaces

                strAmount = strAmount.slice(0, insertIndex) + '.' + strAmount.slice(insertIndex)

                // remove trailing zeros and decimal point if no decimals
                strAmount = strAmount.replace(/\.?0+$/, '')

            } else {

                strAmount = amount
                
                // if the string is an integer-like value, treat it like bigint and decimalize
                const isIntegerString = /^[0-9]+$/.test(strAmount)
                if (isIntegerString) {
                    if (strAmount.length <= decimalPlaces) {
                        strAmount = '0'.repeat(decimalPlaces - strAmount.length + 1) + strAmount
                    }
                    const insertIndex = strAmount.length - decimalPlaces
                    strAmount = strAmount.slice(0, insertIndex) + '.' + strAmount.slice(insertIndex)
                }
                
                // remove trailing zeros and decimal point if no decimals
                strAmount = strAmount.replace(/\.?0+$/, '')

            }

            // parse the string amount
            const numAmount = parseFloat(strAmount)
            if (isNaN(numAmount)) return '0.00'
            
            // split into integer and decimal parts
            const [integerPart, decimalPart = ''] = strAmount.split('.')
            
            // add commas to the integer part
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            
            // cap at 5 decimals to prevent mobile horizontal scroll,
            // but for tiny numbers (e.g. 0.00000312 BTC) ensure at least 2 significant digits
            let maxDisplayDecimals = 5
            if (numAmount > 0 && numAmount < 0.001 && decimalPart.length > 5) {
                const leadingZeros = decimalPart.match(/^0*/)?.[0].length || 0
                maxDisplayDecimals = Math.max(5, leadingZeros + 2)
            }
            const targetLen = Math.max(2, Math.min(maxDisplayDecimals, decimalPart.length))
            const formattedDecimal = decimalPart.padEnd(2, '0').slice(0, targetLen)
            
            // return the formatted number
            return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : `${formattedInteger}.00`

        } catch (error) {

          // log
          console.error('Error formatting amount:', error)

          // return 0.00
          return '0.00'

        }
        
    }

    // get token decimals by principal from fetched token details
    const getTokenDecimals = (principal: string) => {
        const tokenDetail = fetchedTokenDetails.value?.find((entry) => entry[0].toString() === principal.toString())?.[1]
        return Number(tokenDetail?.tokenDecimals ?? 8)
    }

    // get token info - accepts Principal object or string
    const getTokenInfo = (principal: any) => {
        if (!principal) return null

        // Convert principal to string for comparison
        const principalStr = typeof principal === 'string' ? principal : principal.toString?.() || String(principal)

        // Find matching token in fetchedTokenDetails
        const tokenDetail = fetchedTokenDetails.value?.find((entry) => {
            const entryPrincipalStr = typeof entry[0] === 'string' ? entry[0] : entry[0]?.toString?.() || String(entry[0])
            return entryPrincipalStr === principalStr
        })?.[1]

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

        // ensure token details are loaded
        await ensureTokenDetails()
        
        // get trading status from treasury backend
        await getTradingStatus()

        // log
        // console.log('DaoTradingLogs.vue: onMounted() - fetched token details:', fetchedTokenDetails.value)

        // // set refresh interval
        // refreshInterval = window.setInterval(refreshData, 60_000)

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