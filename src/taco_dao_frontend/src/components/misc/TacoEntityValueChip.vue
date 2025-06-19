<template>

    <div class="taco-entity-value-chip">

        <!-- top -->
        <span class="taco-entity-value-chip__top">

            <!-- some icon -->
            <!-- <TacoDaoLogo /> -->
            <TacoDaoTacoT title="Taco Dao Entity"
                  data-bs-toggle="tooltip"
                  data-bs-placement="right"
                  data-bs-custom-class="taco-tooltip"/>

            <!-- price in usd -->
            <span class="taco-text-black-to-white" @mouseover="showTacoEntityTooltip" @mouseleave="hideTacoEntityTooltip">${{ formatNumber(tacoEntityValueUsd) }}</span>

        </span>

        <!-- hover tooltip -->
        <div v-if="showingTacoEntityTooltip"
             class="taco-entity-value-chip__tooltip">
            <span class="taco-text-black-to-white">stuff here</span>
        </div>

    </div>

</template>

<style lang="scss" scoped>

    // taco entity value chip
    .taco-entity-value-chip {
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
                width: 1.5rem;
                // height: 1.125rem;
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
        .taco-entity-value-chip__top {
            flex-direction: column;
        }

    }     

    // custom breakpoint
    @media (max-width: 575px) {

        // reduce token icon size
        .taco-entity-value-chip__top svg {
            width: 1.5rem !important;
        }

    }      

</style>

<script setup>

    /////////////
    // Imports //
    /////////////

    import TacoDaoLogo from "../../assets/images/tacoDaoLogo.vue"
    import TacoDaoTacoT from "../../assets/images/tacoDaoTacoT.vue"
    import { ref, onMounted, onUnmounted, computed } from 'vue'
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
    // local variables //
    /////////////////////

    // showing taco entity tooltip
    const showingTacoEntityTooltip = ref(false)

    ///////////////////
    // local methods //
    ///////////////////

    // format number
    const formatNumber = (num) => {
        if (typeof num !== 'number') {
            return num
        }
        if (num >= 10000000) {
            return '10m+'
        }
        if (num >= 1000) {
            return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short'
            }).format(num).toLowerCase();
        }
        return num.toFixed(2)
    }

    // show taco entity tooltip
    const showTacoEntityTooltip = () => {
        showingTacoEntityTooltip.value = true
    }

    // hide taco entity tooltip
    const hideTacoEntityTooltip = () => {
        showingTacoEntityTooltip.value = false
    }

    //////////////
    // computed //
    //////////////

    // taco entity value in usd
    const tacoEntityValueUsd = computed(() => {
        return formatNumber(1)
    })

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    // on mount
    onMounted(async () => {

        // fetch token details from dao backend
        await fetchTokenDetails()

    })

</script>