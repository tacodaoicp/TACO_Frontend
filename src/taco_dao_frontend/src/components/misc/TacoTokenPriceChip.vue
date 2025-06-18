<template>

    <div class="taco-token-price-chip">

        <!-- top -->
        <span class="taco-token-price-chip__top">

            <!-- taco token icon -->
            <TacoCoinIcon 
                title="TACO token"
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-custom-class="taco-tooltip"/>

            <!-- price in usd -->
            <span class="taco-text-black-to-white"
                  title="Value of TACO token in USD"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip">${{ tacoPriceUsd.toFixed(2) }}</span>

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
            gap: 0.25rem;

            // token icon
            img, svg {
                width: 1.125rem;
                height: 1.125rem;
                border: 1px solid var(--dark-orange-to-transparent);
            }

            // price
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

    ///////////////////
    // media queries //
    ///////////////////

    // custom breakpoint
    @media (max-width: 490px) {

        // flip orientation of top row
        .taco-token-price-chip__top {
            flex-direction: column;
        }

    }     

</style>

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import TacoCoinIcon from "../../assets/tokens/tacoCoinIcon.vue"
    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"

    ////////////
    // Stores //
    ////////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // crypto prices
    const { tacoPriceUsd } = storeToRefs(tacoStore)

</script>