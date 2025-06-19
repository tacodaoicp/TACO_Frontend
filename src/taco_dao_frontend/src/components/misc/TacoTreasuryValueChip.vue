<template>

    <div class="taco-treasury-value-chip">

        <!-- top -->
        <span class="taco-treasury-value-chip__top">

            <!-- treasury icon -->
            <i class="fa-solid fa-building-columns"
                title="TACO treasury"
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-custom-class="taco-tooltip"></i>
            <!-- 🏦 -->

            <!-- price in usd -->
            <span class="taco-text-black-to-white"
                  title="Value of TACO treasury in USD"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip">$500k</span>

        </span>

    </div>

</template>

<style lang="scss" scoped>

    // taco treasury value chip
    .taco-treasury-value-chip {
        display: flex;
        flex-direction: column;
        align-items: end;
        
        // top
        &__top {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;

            // treasury icon
            i {
                // color: var(--black-to-white);
                color: var(--light-orange);
                font-size: 0.875rem !important;
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

        // // bottom
        // &__bottom {
        //     display: inline-flex;

        //     // usd price
        //     span {
        //         line-height: 1;
        //         font-size: 0.75rem;
        //         font-family: 'rubik';
        //     }
        // }
    }

    ///////////////////
    // media queries //
    ///////////////////

    // custom breakpoint
    @media (max-width: 490px) {

        // flip orientation of top row
        .taco-treasury-value-chip__top {
            flex-direction: column;
        }

    }     

    // custom breakpoint
    @media (max-width: 575px) {

        // reduce token icon size
        .taco-treasury-value-chip__top svg {
            width: 1.5rem !important;
        }

    }      

</style>

<script setup>

    /////////////
    // Imports //
    /////////////

    // import TacoDaoTacoT from "../../assets/images/tacoDaoTacoT.vue"
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