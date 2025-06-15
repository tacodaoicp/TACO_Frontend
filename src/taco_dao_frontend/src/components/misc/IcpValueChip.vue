<template>

    <div class="taco-icp-value-chip">

        <!-- top -->
        <span class="taco-icp-value-chip__top">

            <!-- icp logo -->
            <img :src="icpLogo" 
                 alt="ICP" 
                 class="taco-icp-value-chip__icp-logo"
                 title="ICP token"
                 data-bs-toggle="tooltip"
                 data-bs-placement="left"
                 data-bs-custom-class="taco-tooltip">

            <!-- price in usd -->
            <span class="taco-text-black-to-white"
                  title="Value of ICP in USD"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip">${{ icpPriceUsd.toFixed(2) }}</span>

        </span>

    </div>

</template>

<style lang="scss" scoped>

    // taco icp value chip
    .taco-icp-value-chip {
        display: flex;
        flex-direction: column;
        align-items: end;
        
        // top
        &__top {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;

            // token icon
            img {
                width: 1rem;
                height: 1rem;
                outline: 1px solid var(--dark-orange-to-transparent);
                border-radius: 999rem;
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

    ///////////////////
    // media queries //
    ///////////////////

    // custom breakpoint
    @media (max-width: 490px) {

        // flip orientation of top row
        .taco-icp-value-chip__top {
            flex-direction: column;
        }

    }      

</style>

<script setup>

    /////////////
    // Imports //
    /////////////

    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"
    import icpLogo from "../../assets/tokens/snspng/icp.png"

    ///////////
    // Store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // crypto prices
    const { icpPriceUsd } = storeToRefs(tacoStore)

</script>