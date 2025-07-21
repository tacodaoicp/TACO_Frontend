<template>

    <div class="taco-entity-value-chip"
        @mouseover="showTacoEntityTooltip" 
        @mouseleave="hideTacoEntityTooltip"
    >

        <!-- top -->
        <span class="taco-entity-value-chip__inner">

            <!-- some icon -->
            <!-- <TacoDaoLogo /> -->
            <TacoDaoTacoT />

            <!-- price in usd -->
            <span class="taco-text-black-to-white">${{ formatNumber(totalPortfolioValueInUsd + totalTreasuryValueInUsd) }}</span>

        </span>

        <!-- hover tooltip -->
        <div v-if="showingTacoEntityTooltip"
             class="taco-entity-value-chip__tooltip shadow">

             <!-- header -->
            <div class="taco-entity-value-chip__tooltip__header">

                 <!-- taco dao logo -->
                <TacoDaoLogo class="taco-entity-value-chip__tooltip__header__logo" />
                
            </div>

            <!-- kvp (total) -->
            <div class="taco-entity-value-chip__tooltip__kvp pt-2"
                style="padding-top: 0.75rem !important;">

                <!-- key -->
                <span class="taco-entity-value-chip__tooltip__kvp__key 
                    taco-text-black-to-white">
                    <i class="fa-solid fa-building-columns"></i>
                    Treasury
                </span>

                <!-- value -->
                <span class="taco-entity-value-chip__tooltip__kvp__value 
                    taco-text-black-to-white">${{formatNumber(totalTreasuryValueInUsd)}}</span>

            </div>               

            <!-- kvp (taco) -->
            <div class="taco-entity-value-chip__tooltip__kvp pt-2"
                style="padding-top: 0.75rem !important; padding-left: 1.25rem !important;">

                <!-- key -->
                <span class="taco-entity-value-chip__tooltip__kvp__key 
                    taco-text-black-to-white">
                    <TacoCoinIcon style="width: 1rem; height: 1rem;"/>
                    Taco
                </span>

                <!-- value -->
                <span class="taco-entity-value-chip__tooltip__kvp__value 
                    taco-text-black-to-white">${{formatNumber(snsTreasuryTacoValueInUsd)}}</span>

            </div>

            <!-- kvp (icp) -->
            <div class="taco-entity-value-chip__tooltip__kvp pt-2"
                style="padding: 0.75rem 1rem 1rem 1.25rem !important; border-bottom: 1px solid var(--dark-orange);">

                <!-- key -->
                <span class="taco-entity-value-chip__tooltip__kvp__key 
                    taco-text-black-to-white">
                    <img :src="icpLogo" style="width: 1rem; height: 1rem;"/>
                    ICP
                </span>

                <!-- value -->
                <span class="taco-entity-value-chip__tooltip__kvp__value 
                    taco-text-black-to-white">${{formatNumber(snsTreasuryIcpValueInUsd)}}</span>

            </div>         

            <!-- kvp (portfolio) -->
            <div class="taco-entity-value-chip__tooltip__kvp py-2"
                style="padding-bottom: 0.75rem !important; padding-top: 0.75rem !important;">

                <!-- key -->
                <span class="taco-entity-value-chip__tooltip__kvp__key 
                    taco-text-black-to-white">
                    <i class="fa-solid fa-chart-pie"></i>
                    Portfolio
                </span>

                <!-- value -->
                <span class="taco-entity-value-chip__tooltip__kvp__value 
                    taco-text-black-to-white">${{formatNumber(totalPortfolioValueInUsd)}}</span>

            </div>

            <!-- kvp (total) -->
            <div class="taco-entity-value-chip__tooltip__kvp py-2">

                <!-- key -->
                <span class="taco-entity-value-chip__tooltip__kvp__key 
                    taco-text-black-to-white">Total</span>

                <!-- value -->
                <span class="taco-entity-value-chip__tooltip__kvp__value 
                    taco-text-black-to-white">${{formatNumber(totalTreasuryValueInUsd + totalPortfolioValueInUsd)}}</span>

            </div>

        </div>

    </div>

</template>

<style lang="scss" scoped>

    // taco entity value chip
    .taco-entity-value-chip {
        display: flex;
        flex-direction: column;
        align-items: end;
        position: relative;
        
        // inner
        &__inner {
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

        // tooltip
        &__tooltip {
            border: 1px solid var(--dark-orange);
            position: absolute;
            top: calc(100% + 0.75rem);
            right: 0;
            width: fit-content;
            border-radius: 0.5rem;
            background-color: var(--orange-to-brown);
            color: var(--black-to-white);
            display: flex;
            flex-direction: column;
            // gap: 0.5rem;
            z-index: 9999;

            // header
            &__header {
                text-align: center;
                font-size: 0.875rem;
                border-bottom: 1px solid var(--dark-orange);
                padding: 0.5rem 1rem 0.5rem;

                // logo
                &__logo {
                    width: 3rem;
                    height: 3rem;
                }
            }

            // kvp
            &__kvp {
                display: flex;
                justify-content: space-between;
                gap: 0.75rem;
                padding: 0.25rem 1rem 0;

                // key
                &__key {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    text-align: left;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                // value
                &__value {
                    text-align: right;
                    font-size: 0.875rem;
                    font-family: 'rubik';
                    font-weight: 700;                    
                }

                // last of type
                &:last-of-type {
                    border-top: 1px solid var(--dark-orange);
                }
                
            }
            
        }
    }

    ///////////////////
    // media queries //
    ///////////////////

    // custom breakpoint
    @media (max-width: 490px) {

        // flip orientation of top row
        .taco-entity-value-chip__inner {
            flex-direction: column !important;

            svg {
                padding-bottom: 0.125rem;
            }
        }

    }     

    // custom breakpoint
    @media (max-width: 575px) {

        // reduce token icon size
        .taco-entity-value-chip__inner svg {
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
    import { Principal } from '@dfinity/principal'
    import icpLogo from "../../assets/tokens/snspng/icp.png"
    import TacoCoinIcon from "../../assets/tokens/tacoCoinIcon.vue"

    ///////////
    // Store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # ACTIONS #
    const { fetchTokenDetails, fetchTotalTreasuryValueInUsd } = tacoStore

    // # STATE #

    // dao
    const { totalPortfolioValueInUsd, totalTreasuryValueInUsd, snsTreasuryTacoValueInUsd, snsTreasuryIcpValueInUsd } = storeToRefs(tacoStore)

    /////////////////////
    // local variables //
    /////////////////////

    // showing taco entity tooltip
    const showingTacoEntityTooltip = ref(false)

    ///////////////////
    // local methods //
    ///////////////////

    //////////////
    // handlers //

    // show taco entity tooltip
    const showTacoEntityTooltip = () => {
        showingTacoEntityTooltip.value = true
    }

    // hide taco entity tooltip
    const hideTacoEntityTooltip = () => {
        showingTacoEntityTooltip.value = false
    }

    /////////////
    // returns //

    // format number
    const formatNumber = computed(() => {
        return (num) => {
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
    })

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    // on mount
    onMounted(async () => {

        // log
        // console.log('TacoEntityValueChip mounted')

        // fetch token details from dao backend
        await fetchTokenDetails()

        // fetch total treasury value in usd
        await fetchTotalTreasuryValueInUsd()

    })

</script>