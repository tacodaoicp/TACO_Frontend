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
                  title="Value of TACO portfolio in ICP"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip">{{ totalPortfolioValueInIcp.toFixed(2) }} ICP</span>

        </span>

        <!-- bottom -->
        <span class="taco-portfolio-value-chip__bottom">

            <!-- price in usd -->
            <span class="taco-text-black-to-white"
                  title="Value of TACO portfolio in USD"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
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

</style>

<script setup>

    /////////////
    // Imports //
    /////////////

    import TacoDaoTacoT from "../../assets/images/tacoDaoTacoT.vue"
    import { ref, onMounted } from 'vue'
    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"

    ///////////
    // Store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // dao
    const { totalPortfolioValueInUsd, totalPortfolioValueInIcp } = storeToRefs(tacoStore)

</script>