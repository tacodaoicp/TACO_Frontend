<template>

    <div class="taco-token-price-chip">

        <!-- top -->
        <span class="taco-token-price-chip__top">

            <!-- token token icon -->
            <TacoCoinIcon 
                title="TACO token"
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-custom-class="taco-tooltip"/>

            <!-- price in icp -->
            <span class="taco-text-black-to-white"
                  title="Value of TACO token in ICP"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip">{{ truncateDecimals(lastTradedPrice, 2) }} ICP</span>

        </span>

        <!-- bottom -->
        <span class="taco-token-price-chip__bottom">

            <!-- price in usd -->
            <span class="taco-text-black-to-white"
                  title="Value of TACO token in USD"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  data-bs-custom-class="taco-tooltip">${{ truncateDecimals(icpPriceUsd * lastTradedPrice, 2) }}</span>

        </span>

    </div>

</template>

<style lang="scss" scoped>

    // taco token price chip
    .taco-token-price-chip {
        display: flex;
        flex-direction: column;
        align-items: end;
        
        // top
        &__top {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;

            // token icon
            img, svg {
                width: 1.125rem;
                height: 1.125rem;
                border: 1px solid var(--dark-orange-to-transparent);
            }

            // icp price
            span {
                white-space: nowrap;
                line-height: 1;
                font-size: 0.875rem;
                font-family: 'rubik';
                font-weight: bold;
            }

        }

        // bottom
        &__bottom {
            display: inline-flex;

            // usd price
            span {
                line-height: 1;
                font-size: 0.75rem;
                font-family: 'rubik';
            }
        }
    }

</style>

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import TacoCoinIcon from "../../assets/tokens/tacoCoinIcon.vue"
    import { computed, onMounted } from 'vue'
    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"

    ////////////
    // Stores //
    ////////////

    // taco store
    const tacoStore = useTacoStore()
    const { icpPriceUsd } = storeToRefs(tacoStore)

    ///////////////////
    // Local Methods //
    ///////////////////

    // # UTILITY #
    
  // truncate decimals without rounding
    const truncateDecimals = (num: number, places: number): string => {
        const multiplier = Math.pow(10, places)
        return (Math.floor(num * multiplier) / multiplier).toFixed(places)
    }      

    ///////////////
    // Computed //
    //////////////

    // get last traded price of taco as computed property
    const lastTradedPrice = computed(() => {

        // // check if exchange info exists and has data
        // // @ts-ignore
        // if (!fetchedExchangeInfo.value?.[0]?.last_traded_price?.length) {
        //     return 0
        // }

        // // get taco/licp price from first pair
        // // @ts-ignore
        // return fetchedExchangeInfo.value[0].last_traded_price[0]

        return 'todo'

    })

    /////////////////////
    // Lifecycle Hooks //
    /////////////////////

    onMounted(() => {
        
        // 

        
    })

</script>