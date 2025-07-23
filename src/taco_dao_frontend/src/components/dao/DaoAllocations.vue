<template>

    <div class="dao-allocations">

        <!-- dao allocations loading curtain -->
        <div v-if="componentLoading" class="dao-allocations__loading-curtain">

            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="loading-img">

        </div>

        <!-- toolbar container - l2 -->
        <div class="taco-container taco-container--l2 taco-container--l2--dark p-2">

            <!-- toolbar -->
            <div class="taco-toolbar flex-nowrap">

                <!-- if not viewing historical - current and historical buttons -->
                <div class="btn-group">

                    <!-- current button -->
                    <button @click="showCurrentAllocations = true; showCurrentHoldings = false" 
                            class="btn taco-nav-btn"
                            :class="{'taco-nav-btn--active': showCurrentAllocations}">Allocations</button>

                    <!-- historical button -->
                    <button @click="showCurrentAllocations = false; showCurrentHoldings = true" 
                            class="btn taco-nav-btn"
                            :class="{'taco-nav-btn--active': showCurrentHoldings}">Holdings</button>

                </div>

                <!-- hover tooltip info icon -->
                <div class="ms-2 me-auto taco-text-white" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    title="Allocations are the voted upon targets of the DAO. Holdings are the actual amounts held by the DAO portfolio">
                    <i class="fa-solid fa-circle-info"></i>
                </div>

                <!-- date -->
                <div class="d-none d-md-flex flex-column align-items-center gap-1 ms-auto">

                    <!-- if viewing current -->
                    <span class="taco-text-white 
                                fw-bold pe-2"
                        style="font-size: 0.875rem;">
                        {{ new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
                    </span>

                </div>                

            </div>

        </div>

        <!-- top - container - l2 -->
        <div ref="tacoChartContainer"
             class="dao-allocations__taco-chart-container
                    taco-container taco-container--l2
                    p-2 position-relative">

            <!-- dao allocations button -->
            <button class="btn taco-nav-btn position-absolute taco-nav-btn--active"
                    style="top: 0.5rem; left: 0.5rem; z-index: 1000;"
                    title="View DAO allocations"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top">
                DAO
            </button>

            <!-- my allocations button -->
            <button v-if="showCurrentAllocations"
                    class="btn taco-nav-btn position-absolute disabled"
                    style="top: 0.5rem; right: 0.5rem; z-index: 1000; pointer-events: all;"
                    title="Coming Soon"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top">
                Mine
            </button>

            <!-- chart -->
            <apexchart 
                v-if="showCurrentAllocations && currentAllocationsHaveValue || showCurrentHoldings && currentHoldingsHaveValue"
                type="pie" 
                :options="chartOptions" 
                :series="series" 
                class="dao-allocations__taco-chart"
                @dataPointSelection="handleChartSegmentClick"></apexchart>

            <!-- if no holdings -->
            <div v-if="showCurrentHoldings && !currentHoldingsHaveValue" class="dao-allocations__no-holdings py-5 text-center">
                <span class="taco-text-black-to-white">No holdings yet</span>
            </div>

            <!-- if no allocations -->
            <div v-if="showCurrentAllocations && !currentAllocationsHaveValue" class="dao-allocations__no-allocations py-5 text-center">
                <span class="taco-text-black-to-white">No allocations yet</span>
            </div>
        
        </div>

        <!-- bottom - container - l2 -->
        <div class="taco-container taco-container--l2 p-0 overflow-hidden d-flex">

            <!-- flex container -->
            <div class="d-flex w-100">

                <!-- left -->
                <div class="d-flex flex-column w-100">

                    <!-- left top -->
                    <div class="dao-allocations__token-title
                                d-flex gap-3 align-items-center p-2 ps-3">

                        <!-- token icon -->
                        <img :src="currentTokenIcon"
                             class="dao-allocations__token-title__icon
                                    rounded-circle shadow"
                             alt=""/>

                        <!-- flex container -->
                         <div class="d-flex flex-column">

                            <!-- token name/link -->
                            <a :href="currentTokenLink" 
                               class="dao-allocations__token-title__name-link" 
                               target="_blank">
                                {{ currentTokenTitle }}
                            </a>

                            <!-- bottom -->
                            <span class="taco-text-black-to-white small" 
                                  style="text-transform: uppercase;">
                                ({{currentTokenSymbol}})
                            </span>

                         </div>

                    </div>

                    <!-- left bottom -->
                    <div class="dao-allocations__token-description
                                d-flex flex-column p-2 ps-4 gap-1 overflow-auto h-100"
                         >

                        <!-- description title -->
                        <span class="dao-allocations__token-description__title
                                     taco-text-black-to-white">Description:</span>

                        <!-- description -->
                        <span class="dao-allocations__token-description__text
                                     taco-text-black-to-white pb-3">
                            {{ currentTokenDescription }}
                        </span>

                    </div>

                </div>

                <!-- right -->
                <div>

                    <!-- list of key/value pairs -->
                    <ul class="dao-allocations__token-info-list overflow-auto">

                        <!-- symbol - list item -->
                        <li>

                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">Symbol:</span>
                            
                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white text-uppercase ms-auto">{{ currentTokenSymbol }}</span>

                        </li>

                        <!-- holding amount in token - list item -->
                        <li v-if="showCurrentHoldings">

                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">Holdings:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white d-flex align-items-center gap-1 ms-auto">

                                <!-- token icon -->
                                <img :src="currentTokenIcon" 
                                     class="dao-allocations__token-info-list__token-icon
                                            rounded-circle" 
                                     alt=""/>

                                <!-- holding amount -->
                                <span class="small">{{ formatNumber(currentTokenHoldings) }}</span>

                            </span>

                        </li>

                        <!-- holding value in icp - list item -->
                        <li v-if="showCurrentHoldings">

                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">ICP Value:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white d-flex align-items-center gap-1 ms-auto">

                                <!-- holding value -->
                                <span class="small">{{ ((currentTokenHoldings * currentTokenPrice) / icpPriceUsd).toFixed(2) }} ICP</span>

                            </span>

                        </li>                           

                        <!-- holding value in usd - list item -->
                        <li v-if="showCurrentHoldings">

                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">USD Value:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white d-flex align-items-center gap-1 ms-auto">

                                <!-- holding value -->
                                <span class="small">${{ (currentTokenHoldings * currentTokenPrice).toFixed(2) }}</span>

                            </span>

                        </li>                        

                        <!-- holdings percentage - list item -->
                        <li v-if="showCurrentHoldings">

                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">Percentage:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white ms-auto">{{ currentTokenPercentage.toFixed(2) }}%</span>

                        </li>

                        <!-- allocations -  list item -->
                        <li v-if="showCurrentAllocations">

                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">Allocation:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white ms-auto">{{ currentTokenPercentage.toFixed(2) }}%</span>

                        </li>

                        <!-- added - list item -->
                        <li v-if="showCurrentAllocations">
                            
                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">Added:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white ms-auto">
                            
                                <!-- force small -->
                                <span class="small">{{ currentTokenTrusted }}</span>

                            </span>

                        </li>

                        <!-- icp coins link - list item -->
                        <li v-if="showCurrentAllocations">
                            
                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">ICPCoins.com:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white ms-auto">
                                <a class="small" style="color: var(--white-to-light-blue);" 
                                    :href="currentTokenIcpCoinsLink" 
                                    target="_blank">{{ currentTokenSymbol }}</a>
                            </span>

                        </li>

                        <!-- dd report - list item -->
                        <li v-if="showCurrentAllocations && ddReportRouteExists">
                            
                            <!-- key -->
                            <span class="dao-allocations__token-info-list__key
                                         taco-text-white">Due Diligence:</span>

                            <!-- value -->
                            <span class="dao-allocations__token-info-list__value
                                         taco-text-white ms-auto">

                                <!-- dd report link -->
                                <router-link class="small" style="color: var(--white-to-light-blue);" :to="`/reports/dd${currentTokenSymbol.toLowerCase()}`">View</router-link>
                                
                            </span>

                        </li>                        

                    </ul>

                </div>

            </div>

        </div>

    </div>
  
</template>
  
<style scoped lang="scss">

/////////////////////
// component style //
/////////////////////

// dao allocations
.dao-allocations {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    padding: 1.25rem;

    // taco chart container
    &__taco-chart-container {
        
        // placeholder
        
    }

    // taco chart
    &__taco-chart {

        // placeholder

    }

    // token title
    &__token-title {
        border-bottom: 1px solid var(--dark-orange);
        
        // token icon
        &__icon {
            width: 3.25rem;
            height: 3.25rem;
            background-color: #fff;
        }

        // token name link
        &__name-link {
            font-size: 1.25rem;
            font-weight: bold;
            color: var(--blue-to-light-blue);
        }

    }

    // token description
    &__token-description {

        // title
        &__title {
            font-size: 1rem;
        }

        // text
        &__text {
            font-size: 0.825rem;
            font-family: 'Roboto';
        }
    }

    // token info list
    &__token-info-list {
        background-color: var(--light-brown-to-dark-brown);
        border-top-right-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        margin: 0;
        padding: 0;
        height: 100%;
        width: 15rem;

        // token info list item
        li {
            font-size: 0.825rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--light-orange-to-dark-orange);
            padding: 0.75rem 1rem;
            gap: 0 1rem;

            // 
            &:last-of-type {
                border-bottom: none;
            }
        }

        // key
        &__key {
            font-size: 0.825rem;
        }

        // value
        &__value {
            font-size: 1rem;
        }

        // token icon
        &__token-icon {
            width: 1rem;
            height: 1rem;
        }
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
        z-index: 9998; // above everything

        // loading image
        .loading-img {
            width: 10rem;
        }
    }

    // overrides
    .taco-toolbar {
        flex-wrap: nowrap;
    }

    // custom tooltip styles to match dataLabels
    :deep(.custom-tooltip) {
        padding: 4px 8px !important;
        font-size: 14px !important;
        font-family: 'Space Mono' !important;
        font-weight: bold !important;
        color: #fff !important;
    }

}

///////////////
// overrides //
///////////////

// 


///////////////////
// media queries //
///////////////////

// phone protrait
@media (max-width: 575.98px) {
    .dao-allocations__taco-chart-container {
        
        // placeholder
        
    } 
    .dao-allocations__token-title__name-link {
        font-size: 0.875rem;
    }
    .dao-allocations__token-title__icon {
        width: 2.5rem;
        height: 2.5rem;
    }
    .dao-allocations__token-info-list {
        width: 150px;
    }
}

// phone landscape
@media (min-width: 576px) and (max-width: 767.98px) {
    .dao-allocations__taco-chart-container {
        
        // placeholder
        
    } 
    .dao-allocations__token-title__name-link {
        font-size: 0.875rem;
    }
    .dao-allocations__token-title__icon {
        width: 2.5rem;
        height: 2.5rem;
    }
    .dao-allocations__token-info-list {
        width: 150px;
    }
}

// tablet
@media (min-width: 767px) and (max-width: 991.98px) {
    .dao-allocations__taco-chart-container {
        
        // placeholder

    }  
    .dao-allocations__token-title__name-link {
        font-size: 1rem;
    }
    .dao-allocations__token-title__icon {
        width: 2.5rem;
        height: 2.5rem;
    }
}

// small daktop
@media (min-width: 992px) and (max-width: 1199.98px) {
    .dao-allocations__taco-chart-container {
        
        // placeholder

    }
    .dao-allocations__token-title__name-link {
        font-size: 0.875rem;
    }
    .dao-allocations__token-title__icon {
        width: 2.5rem;
        height: 2.5rem;
    }
    .dao-allocations__token-info-list {
        width: 150px;
    }
}

// medium desktop
@media (min-width: 1200px) and (max-width: 1399.98px) {
    .dao-allocations__taco-chart-container {
        
        // placeholder

    }
}

</style>
  
<script setup lang="ts">

/* notes:

HTML
    
MOUNTED
    handle chart stuff, init bs tooltips
        
WATCH NAV
    watch for "Allocations" selected (also run immediately)
        fetch token details and aggregate allocations
        safely extract allocations
        create array of percentages
        create array of canister ids
        create array for symbols
        get metadata for each canister id
        extract symbols from metadata
        create colors array from symbols and tokenData
        apply data to chart
        handleChartSegmentClick for first token with non-zero percentage

    watch for "Holdings" selected
        fetch token details
        safely extract holdings
        calculate total balance across all holdings
        create array of percentages
        create array of symbols
        apply data to chart
        handleChartSegmentClick for first token with non-zero percentage

LOCAL METHODS
    handleChartSegmentClick
        update symbol and percentage from chart data
        update title, link, icon, desc, and color from tokenData
        update holdings and date added from fetched token details
*/

    /////////////
    // imports //
    /////////////

    import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from "vue"
    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"
    import { tokenData } from "../data/TokenData"
    import astronautLoader from '../../assets/images/astonautLoader.webp'
    import placeholder52x52 from '../../assets/images/placeholder-52x52.png'
    import { Tooltip } from 'bootstrap'

    ///////////
    // Store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // dao backend
    const { fetchedTokenDetails } = storeToRefs(tacoStore)
    const { icpPriceUsd } = storeToRefs(tacoStore)
    const { fetchedAggregateAllocation } = storeToRefs(tacoStore)

    // # ACTIONS #

    // dao backend
    const { fetchTokenDetails } = tacoStore
    const { fetchAggregateAllocation } = tacoStore

    // ledger canisters
    const { icrc1Metadata } = tacoStore

    /////////////////////
    // local variables //
    /////////////////////

    // component
    const componentLoading = ref(false)

    // refresh timer
    const refreshTimer = ref<number | null>(null)

    // images
    const astronautLoaderUrl =  astronautLoader    

    // chart container
    const tacoChartContainer = ref<HTMLElement | null>(null)
    const maxWidthThreshold = 576

    // chart
    const series = ref([100])
    const seriesNames = ref(['loading'])
    const colors = ref(['#ccc'])

    // navigation
    const showCurrentHoldings = ref(false) // user is viewing current holdings
    const showCurrentAllocations = ref(true) // user is viewing current allocations

    // element references
    const currentTokenTitle = ref<string>('No Token Selected')
    const currentTokenSymbol = ref<string>('n/a')
    const currentTokenLink = ref<string>('#')
    const currentTokenIcon = ref<string>(placeholder52x52)
    const currentTokenDescription = ref<string>('No token selected')
    const currentTokenColor = ref<string>('#ccc')
    const currentTokenHoldings = ref<number>(0)
    const currentTokenPrice = ref<number>(0)
    const currentTokenPercentage = ref<number>(0)
    const currentTokenTrusted = ref<string>('N/A')
    const currentTokenIcpCoinsLink = ref<string>('#')

    // no allocations
    const currentAllocationsHaveValue = ref<boolean>(true)

    // no holdings
    const currentHoldingsHaveValue = ref<boolean>(true)

    ///////////////////
    // local methods //
    //////////////////

    //////////////
    // HANDLERS //

    // set taco chart max height
    const handleSetTacoChartMaxHeight = async () => {
        const element = tacoChartContainer.value
        if (element) {
            element.style.maxHeight = ''; // Temporarily remove max-width to allow natural height
            await nextTick() // Wait for the DOM to update
            const height = element.clientHeight
            const maxHeight = height / 2
            element.style.maxHeight = `${maxHeight}px`
        }
    }

    // handle apply allocation data to chart
    const handleApplyDataToChart = async (seriesParams: number[], seriesNamesParams: string[], colorsParams: string[]) => {
        
        // update all values at once using nextTick
        nextTick(() => {
            series.value = seriesParams
            seriesNames.value = seriesNamesParams
            colors.value = colorsParams
        })

        // force chart update by updating options
        chartOptions.value = {
            ...chartOptions.value,
            colors: colorsParams
        }

    }

    // handle clicking on a chart segment
    const handleChartSegmentClick = (event: any, chartContext: any, config: any) => {

        // get selected index
        const selectedIndex = config.dataPointIndex

        /////////////////////
        // from chart data //
        /////////////////////
        
        // get symbol
        const selectedSymbol = seriesNames.value[selectedIndex]

        // update symbol ref
        currentTokenSymbol.value = selectedSymbol
        
        // get percentage
        const selectedPercentage = series.value[selectedIndex]

        // update percentage ref
        currentTokenPercentage.value = selectedPercentage

        /////////////////////
        // from token data //
        /////////////////////
        
        // find matching token
        const selectedToken = tokenData.find((token: any) => token.symbol?.toLowerCase() === selectedSymbol.toLowerCase())

        // update title, link, icon, description, and color with tokenData
        if (selectedToken) {
            currentTokenTitle.value = selectedToken.title
            currentTokenLink.value = selectedToken.link
            currentTokenIcon.value = selectedToken.icon
            currentTokenDescription.value = selectedToken.description
            currentTokenColor.value = selectedToken.color
        }

        ////////////////////////////////
        // from fetched token details //
        ////////////////////////////////
        
        // find matching token
        const selectedToken2 = fetchedTokenDetails.value.find(([_, token]) => {
            const tokenSymbol = token.tokenSymbol?.toLowerCase()
            const searchSymbol = selectedSymbol.toLowerCase()
            
            // match exact symbols or special case for ICP/LICP
            return tokenSymbol === searchSymbol || 
                   (tokenSymbol === 'icp' && searchSymbol === 'licp') ||
                   (tokenSymbol === 'licp' && searchSymbol === 'icp')
        })?.[1]

        // log
        // console.log('fetched token details', fetchedTokenDetails.value)
        // console.log('selected symbol', selectedSymbol)
        // console.log('selectedToken2', selectedToken2)

        // update current token holdings and percentage with fetchedTokenDetails
        if (selectedToken2) {
            currentTokenHoldings.value = Number(selectedToken2.balance) / Math.pow(10, 8)
            currentTokenPrice.value = Number(selectedToken2.priceInUSD)
        }

        // update current token trusted date with fetchedTokenDetails
        if (selectedToken2) {
            const timestamp = selectedToken2.epochAdded
            currentTokenTrusted.value = formatTimestampDateOnly(timestamp)
        }

        // update current token icp coins link with tokenData
        if (selectedToken) {
            currentTokenIcpCoinsLink.value = selectedToken.icpCoinsLink
        }

    }

    /////////////
    // RETURNS //

    // return formatted date only from nanoseconds
    const formatTimestampDateOnly = (timestamp: string) => {
        const date = new Date(Number(timestamp) / 1e6)
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(date)
    }

    // format number to remove trailing zeros
    const formatNumber = (num: number) => {
        const formatted = num.toFixed(4).replace(/\.?0+$/, '')
        return formatted === '0' ? '~0' : formatted
    }    

    //////////////
    // computed //
    //////////////

    // check if dd report route exists for current token
    const ddReportRouteExists = computed(() => {
        const tokenSymbol = currentTokenSymbol.value.toLowerCase()
        const availableRoutes = ['ckbtc', 'sneed', 'motoko', 'sgldt']
        return availableRoutes.includes(tokenSymbol)
    })

    //////////////
    // watchers //
    //////////////
    
    // watch for current allocations, run this watcher immediately  
    watch(showCurrentAllocations, async (newVal) => {

        if (newVal) {

            // log
            // console.log('DaoAllocations.vue: showCurrentAllocations selected')

            // turn on component loading
            componentLoading.value = true

            // run allocations logic
            try {

                // fetch aggregate allocation from dao backend
                await fetchAggregateAllocation()

                // log
                // console.log('fetchedAggregateAllocation', fetchedAggregateAllocation.value)

                // safely extract allocation data (has canisters for each allocation, need to get symbols from tokenData)
                const allocations = (fetchedAggregateAllocation.value || []).map(([principal, basisPoints]) => ({
                    principal: principal.toString(), // convert principal object to string
                    basisPoints: basisPoints.toString().padStart(4, '0') // convert BigInt to string with zero padding
                }))

                // log transformed allocations
                // console.log('transformed allocations:', allocations)

                // create array of percentages from basis points and ensure exactly 100%
                const calculateExactPercentages = (allocations: any[]) => {

                    // convert to rounded percentages
                    let percentages = allocations.map((allocation: any) => 
                        Number((Number(allocation.basisPoints || 0) / 100).toFixed(2)) // convert basis points to percentage with 2 decimal places
                    ).filter(Boolean) // remove any 0 or null values
                    
                    // get the exact sum
                    const sum = percentages.reduce((a, b) => a + b, 0)
                    
                    // adjust if not exactly 100
                    if (Math.abs(sum - 100) >= 0.01 && percentages.length > 0) {
                        const diff = Number((100 - sum).toFixed(2))
                        const largestIndex = percentages.indexOf(Math.max(...percentages))
                        percentages[largestIndex] = Number((percentages[largestIndex] + diff).toFixed(2))
                    }
                    
                    // return percentages
                    return percentages

                }
                
                // calculate percentages once to use in both places
                const percentages = calculateExactPercentages(allocations)

                // log
                // console.log('percentages:', percentages)

                // create array of canister ids from allocations
                const canisterIds = allocations.map((allocation: any) => 
                    allocation.principal
                ).filter(Boolean) // remove any empty strings

                // log
                // console.log('canisterIds:', canisterIds)

                // create array for symbols
                let symbols: string[] = []

                // get metadata for each canister id
                for (const canisterId of canisterIds) {

                    // log
                    // console.log('fetching metadata for canisterId:', canisterId)

                    // fetch metadata
                    const fetchedMetadata = await icrc1Metadata(canisterId)

                    // log
                    // console.log('fetchedMetadata:', fetchedMetadata)
                    
                    // find the symbol entry and extract its value
                    const symbolEntry = fetchedMetadata.find((entry: any) => entry[0] === "icrc1:symbol")
                    
                    // log
                    // console.log('symbolEntry:', symbolEntry)
                    
                    // push symbol to symbols array
                    if (symbolEntry && symbolEntry[1]?.Text) {
                        symbols.push(symbolEntry[1].Text)
                    }
                }

                // log
                // console.log('extracted symbols:', symbols)

                // create colors array from symbols and tokenData
                const colors = symbols.map((symbol: string) => {
                    
                    // find matching token in tokenData, case-insensitive comparison
                    const token = tokenData.find((token: any) => 
                        token.symbol?.toLowerCase() === symbol.toLowerCase()
                    )

                    // return the color if found, otherwise return a fallback color
                    return token?.color || '#ff0000'

                })

                // log
                // console.log('colors:', colors)

                // if there are no holdings of value, show no holdings message
                if (percentages.length === 0) {

                    // log
                    // console.log('no allocations of value')

                    // set no holdings have value
                    currentAllocationsHaveValue.value = false

                    // return
                    return
                    
                }                

                // apply data to chart if we have valid arrays
                if (percentages.length && symbols.length && colors.length) {
                    await handleApplyDataToChart(percentages, symbols, colors)
                }

                // click the first chart segment that is greater than 0
                const firstNonZeroIndex = percentages.findIndex(percentage => percentage > 0)

                // log
                // console.log('firstNonZeroIndex:', firstNonZeroIndex)

                // click the first chart segment that is greater than 0
                handleChartSegmentClick(null, null, { 
                    dataPointIndex: firstNonZeroIndex >= 0 ? firstNonZeroIndex : 0 
                })

            } catch (error) {

                // log
                console.error('error fetching token details from dao backend:', error)

                // turn off component loading
                componentLoading.value = false

            } finally {

                // turn off component loading
                componentLoading.value = false

            }

        }

    }, { immediate: true })

    // watch for current holdings
    watch(showCurrentHoldings, async (newVal) => {

        // log
        // console.log('DaoAllocations.vue: showCurrentHoldings:', newVal)

        // if showCurrentHoldings is true
        if (newVal) {

            // log
            // console.log('DaoAllocations.vue: showCurrentHoldings selected')

            // turn on component loading
            componentLoading.value = true

            // run holdings logic
            try {

                // fetch token details from dao backend
                await fetchTokenDetails()

                // safely extract holdings data
                const holdings = fetchedTokenDetails.value || []

                // log
                // console.log('holdings', holdings)

                // calculate total value across all tokens
                const totalValue = holdings.reduce((sum, [_, token]) => {
                    return sum + (Number(token.balance) * Number(token.priceInICP))
                }, 0)

                // create percentages array
                const percentages = holdings.map(([_, token]) => {
                    if (totalValue === 0) return 0
                    const tokenValue = Number(token.balance) * Number(token.priceInICP)
                    const percentage = (tokenValue / totalValue) * 100
                    return Number(percentage.toFixed(2))
                })

                // log
                // console.log('percentages', percentages)

                // create symbols array
                const symbols = holdings.map(([_, token]) => token.tokenSymbol.toLowerCase())

                // log
                // console.log('symbols:', symbols)

                // create colors array
                const colors = symbols.map(symbol => {
                    const token = tokenData.find(token => token.symbol?.toLowerCase() === symbol)
                    return token?.color || '#ff0000'
                })

                // log
                // console.log('colors:', colors)

                // if there are no holdings of value, show no holdings message
                if (totalValue === 0) {

                    // log
                    // console.log('no holdings of value')

                    // set no holdings have value
                    currentHoldingsHaveValue.value = false

                    // return
                    return
                }

                // apply data to chart
                await handleApplyDataToChart(percentages, symbols, colors)

                // get the index of the first non-zero percentage chart segment
                const firstNonZeroIndex = percentages.findIndex(percentage => percentage > 0)

                // click the first non-zero chart segment
                handleChartSegmentClick(null, null, {
                    dataPointIndex: firstNonZeroIndex >= 0 ? firstNonZeroIndex : 0 
                })

            } catch (error) {

                // log
                console.error('error fetching token details from dao backend:', error)

                // turn off component loading
                componentLoading.value = false

            } finally {

                // turn off component loading
                componentLoading.value = false

            }

        }

    })

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    // on mounted
    onMounted(async () => {

        // turn on component loading
        componentLoading.value = true

        // handle taco chart max height
        handleSetTacoChartMaxHeight()

        // add event listener for resize
        window.addEventListener('resize', handleSetTacoChartMaxHeight)

        // init bootstrap tooltips
        new Tooltip(document.body, {
            selector: "[data-bs-toggle='tooltip']",
        })        

        // refresh every minute
        refreshTimer.value = window.setInterval(async () => {

            // log
            console.log('refreshing allocations tile...')

            // turn on component loading
            componentLoading.value = true

            // try
            try {

                // trigger the appropriate watcher based on current view
                if (showCurrentAllocations.value) {
                    await fetchAggregateAllocation()
                } else if (showCurrentHoldings.value) {
                    await fetchTokenDetails()
                }

            } catch (error) {

                // log
                console.error('error refreshing data:', error)

            } finally {

                componentLoading.value = false

            }
            
        }, 60000) // 60000ms = 1 minute

    })

    // on before unmounted
    onBeforeUnmount(() => {

        // remove event listener for resize
        window.removeEventListener('resize', handleSetTacoChartMaxHeight)

        // clear refresh timer
        if (refreshTimer.value) {
            clearInterval(refreshTimer.value)
            refreshTimer.value = null
        }

        // dismiss tooltips
        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        tooltipElements.forEach(element => {
            const tooltip = Tooltip.getInstance(element)
            if (tooltip) {
                tooltip.hide() // explicitly hide before disposal
                tooltip.dispose()
            }
        })        

    }) 

    /////////////////
    // apex charts //
    /////////////////

    // initialize chart options
    const chartOptions = ref({
        chart: {
            type: 'pie',
            animations: {
                enabled: true,
                easing: 'easeout',
                speed: 350,
                animateGradually: {
                    enabled: true,
                    delay: 1000
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 500
                }
            },
            fontFamily: 'Space Mono',
            id: 'currentAllocations',
        },
        states: {
            hover: {
                filter: {
                    type: 'darken',
                    value: 0.85
                }
            },
            active: {
                filter: {
                    type: 'darken',
                    value: 0.50
                }
            }
        },
        plotOptions: {
            pie: {
                startAngle: -90,
                endAngle: 90,
                customScale: 1,
                expandOnClick: true,
            },
        },
        // colors: ['#3b00b9', '#777', '#888', '#f8a01b', '#047b3e'],
        colors: colors,
        dataLabels: {
            enabled: true,
            formatter: function (val: any, opts: any) {
                return seriesNames.value[opts.seriesIndex].toUpperCase() + " " + val.toFixed(2) +'%'
            },
            textAnchor: 'middle',
            distributed: false,
            offsetX: 0,
            offsetY: 0,
            style: {
                fontSize: '16px',
                fontFamily: 'Space Mono',
                fontWeight: 'bold',
                colors: undefined
            },
            background: {
                enabled: true,
                foreColor: '#fff',
                padding: 4,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: '#fff',
                opacity: 1,
                dropShadow: {
                    enabled: false,
                    top: 1,
                    left: 1,
                    blur: 1,
                    color: '#000',
                    opacity: 0.25,
                }
            },
            dropShadow: {
                enabled: false,
                top: 1,
                left: 1,
                blur: 1,
                color: '#000',
                opacity: 0.45
            },
        },
        legend: {show: false},
        stroke: {show: false},
        tooltip: {
            enabled: true,
            fillSeriesColor: true,
            style: {
                fontSize: '16px',
                fontFamily: 'Space Mono',
                fontWeight: 'bold',
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
                const val = series[seriesIndex]
                const symbol = seriesNames.value[seriesIndex].toUpperCase()
                return `<div class="custom-tooltip">
                    <span>${symbol} ${val.toFixed(2)}%</span>
                </div>`
            }
        },
        markers: {
            size: 1,
        }
    })

</script>