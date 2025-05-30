<template>

    <div class="taco-portfolio-value-chip">

        <!-- top -->
        <span class="taco-portfolio-value-chip__top">

            <!-- token portfolio icon -->
            <TacoDaoTacoT 
                title="TACO portfolio"
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-custom-class="taco-tooltip"/>

            <!-- price in icp -->
            <span class="taco-text-black-to-white"
                  title="Value of TACO portfolio in USD"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip">${{ totalPortfolioValueInUsd.toFixed(2) }}</span>

        </span>

    </div>

</template>

<style lang="scss" scoped>

    // taco portfolio value chip
    .taco-portfolio-value-chip {
        display: flex;
        flex-direction: column;
        align-items: end;
        
        // top
        &__top {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;

            // token icon
            svg {
                width: 1.75rem;
                height: 1.125rem;
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
    @media (max-width: 575px) {

        // reduce token icon size
        .taco-portfolio-value-chip__top svg {
            width: 1.5rem !important;
        }

    }      

</style>

<script setup>

    /////////////
    // Imports //
    /////////////

    import TacoDaoTacoT from "../../assets/images/tacoDaoTacoT.vue"
    import { ref, onMounted, onUnmounted } from 'vue'
    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"

    ///////////
    // Store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # ACTIONS #
    const { fetchTokenDetails } = tacoStore

    // # STATE #

    // dao
    const { totalPortfolioValueInUsd } = storeToRefs(tacoStore)

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    // on mount
    onMounted(async () => {

        // fetch token details from dao backend
        await fetchTokenDetails()

    })

</script>