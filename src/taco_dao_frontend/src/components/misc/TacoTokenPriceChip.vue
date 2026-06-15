<template>

    <div class="taco-token-price-chip"
        @mouseover="showingFairModal = true"
        @mouseleave="showingFairModal = false"
    >

        <!-- top -->
        <span class="taco-token-price-chip__top">

            <!-- taco token icon -->
            <TacoCoinIcon title="TACO token"/>

            <!-- price + fair badge -->
            <span class="taco-token-price-chip__price-wrap">

                <!-- price in usd -->
                <span class="taco-text-black-to-white">${{ tacoPriceUsd.toFixed(2) }}</span>

                <!-- tiny fair value badge (reuses the beta tag look) -->
                <span v-if="tacoFairValueUsd > 0" class="taco-token-price-chip__fair">
                    <span class="taco-token-price-chip__fair-tag">Fair</span>
                    <span class="taco-token-price-chip__fair-value taco-text-black-to-white">${{ tacoFairValueUsd.toFixed(2) }}</span>
                </span>

            </span>

        </span>

        <!-- hover modal -->
        <div v-if="showingFairModal"
             class="taco-token-price-chip__modal taco-container--l1 shadow">

            <!-- title -->
            <div class="taco-token-price-chip__modal__title">
                <i class="fa-solid fa-scale-balanced"></i>
                TACO fair value
            </div>

            <!-- price row -->
            <div class="taco-token-price-chip__modal__row">
                <span class="taco-token-price-chip__modal__row__label">Price</span>
                <span class="taco-token-price-chip__modal__row__usd">${{ Number(tacoPriceUsd).toFixed(3) }}</span>
                <span class="taco-token-price-chip__modal__row__icp">{{ Number(tacoPriceIcp).toFixed(3) }} ICP</span>
            </div>

            <!-- fair value row -->
            <div class="taco-token-price-chip__modal__row">
                <span class="taco-token-price-chip__modal__row__label">Fair value</span>
                <span class="taco-token-price-chip__modal__row__usd">${{ tacoFairValueUsd.toFixed(3) }}</span>
                <span class="taco-token-price-chip__modal__row__icp">{{ tacoFairValueIcp.toFixed(3) }} ICP</span>
            </div>

            <!-- below fair value pill -->
            <div class="taco-token-price-chip__modal__pill"
                :class="tacoBelowFairPct >= 0 ? 'is-below' : 'is-above'">
                {{ Math.abs(tacoBelowFairPct).toFixed(1) }}% {{ tacoBelowFairPct >= 0 ? 'below' : 'above' }} fair value
            </div>

            <!-- explanation -->
            <p class="taco-token-price-chip__modal__note">
                Fair value is the backing behind each circulating TACO. We total every treasury and portfolio asset except TACO, then divide by the circulating supply. Shown in dollars and ICP.
            </p>

        </div>

    </div>

</template>

<style lang="scss" scoped>

    // taco token price chip
    .taco-token-price-chip {
        display: flex;
        flex-direction: column;
        align-items: end;
        position: relative;

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

        // price + badge wrapper
        &__price-wrap {
            position: relative;
            display: inline-flex;
        }

        // fair value badge, sits on the top right of the price (reuses the beta tag look)
        &__fair {
            position: absolute;
            top: -0.62rem;
            right: -0.4rem;
            display: inline-flex;
            align-items: center;
            gap: 0.2rem;
            line-height: 1;
            white-space: nowrap;
        }

        // "Fair" tag, styled like the nav beta badge
        &__fair-tag {
            font-family: 'rubik' !important;
            font-size: 0.5rem !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            padding: 0.1rem 0.3rem;
            background-color: var(--dark-orange-to-brown);
            color: var(--white-to-black);
            border-radius: 0.2rem;
            text-transform: uppercase;
        }

        // fair value amount next to the tag
        &__fair-value {
            font-family: 'rubik' !important;
            font-size: 0.6rem !important;
            font-weight: 700 !important;
            line-height: 1 !important;
        }

        // hover modal
        &__modal {
            position: absolute;
            top: calc(100% + 0.75rem);
            right: 0;
            width: 19rem;
            color: var(--black-to-white);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            z-index: 9999;

            // title
            &__title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
                font-family: 'rubik';
                font-weight: 700;
                font-size: 0.95rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--table-row-border);

                i { font-size: 0.85rem; opacity: 0.8; }
            }

            // price / fair row
            &__row {
                display: flex;
                align-items: baseline;
                gap: 0.5rem;

                &__label {
                    flex: 1;
                    text-align: left;
                    font-family: 'Space Mono', monospace;
                    font-size: 0.8rem;
                    opacity: 0.85;
                }

                &__usd {
                    font-family: 'rubik';
                    font-weight: 700;
                    font-size: 0.95rem;
                }

                &__icp {
                    min-width: 5rem;
                    text-align: right;
                    font-family: 'Space Mono', monospace;
                    font-size: 0.72rem;
                    opacity: 0.7;
                }
            }

            // below / above fair value pill
            &__pill {
                text-align: center;
                font-family: 'rubik';
                font-weight: 700;
                font-size: 0.85rem;
                padding: 0.35rem 0.5rem;
                border-radius: 0.4rem;
                margin-top: 0.15rem;

                &.is-below {
                    color: #74e39b;
                    background: rgba(116, 227, 155, 0.12);
                }
                &.is-above {
                    color: #f08a8a;
                    background: rgba(240, 138, 138, 0.12);
                }
            }

            // explanation note
            &__note {
                margin: 0;
                padding-top: 0.5rem;
                border-top: 1px solid var(--table-row-border);
                font-family: 'Space Mono', monospace;
                font-size: 0.7rem;
                line-height: 1.45;
                opacity: 0.75;
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
    import { ref, onMounted, watch } from 'vue'
    import { useTacoStore } from "../../stores/taco.store"
    import { storeToRefs } from "pinia"

    ////////////
    // Stores //
    ////////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # ACTIONS #
    const { ensureTokenDetails, fetchTotalTreasuryValueInUsd, fetchTacoTotalSupply } = tacoStore

    // # STATE #
    const { tacoPriceUsd, tacoPriceIcp, icpPriceUsd, dkpPriceUsd, tacoFairValueUsd, tacoFairValueIcp, tacoBelowFairPct } = storeToRefs(tacoStore)

    // showing fair value modal
    const showingFairModal = ref(false)

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    onMounted(async () => {
        await ensureTokenDetails()
        await fetchTotalTreasuryValueInUsd()
        await fetchTacoTotalSupply()
    })

    //////////////
    // watchers //
    //////////////

    // once prices load, fetch treasury balances and total supply
    watch(
        () => icpPriceUsd.value + tacoPriceUsd.value + dkpPriceUsd.value,
        (newTotal, oldTotal) => {
            if (oldTotal === 0 && newTotal > 0) {
                fetchTotalTreasuryValueInUsd()
                fetchTacoTotalSupply()
            }
        }
    )

</script>
