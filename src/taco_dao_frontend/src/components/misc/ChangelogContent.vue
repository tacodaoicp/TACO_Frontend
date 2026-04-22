<template>

    <div class="changelog-content">

        <!-- changelog list -->
        <div class="changelog-content__list">

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v2.1.0
                </h3>
                <span class="changelog-content__date">🍽️ April 14, 2026</span>
                <p class="changelog-content__text">
                    - Adds /exchange with TACO's own decentralized exchange
                    <br>
                    - Limit orders with orderbook
                    <br>
                    - AMM liquidity pools with concentrated liquidity (V3)
                    <br>
                    - Multi-hop swap routing
                    <br>
                    - Private OTC trades
                    <br>
                    - Easy mode and advanced trading interfaces
                </p>
            </div>

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v2.0.0
                </h3>
                <span class="changelog-content__date">🍽️ March 25, 2026</span>
                <p class="changelog-content__text">
                    - New site-wide visual refresh with updated styling and layout
                    <br>
                    - Adds /performance with leaderboard rankings, user allocation performance tracking, and the ability to follow other members' strategies
                    <br>
                    - Adds /buy with fiat on-ramp providers to purchase ICP for buying TACO or minting NACHOS, with step-by-step flow and auto-swap option
                    <br>
                    - Adds /vault for the NACHOS Vault with NAV chart, mint and burn flows, and live vault statistics
                </p>
            </div>

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.6
                </h3>
                <span class="changelog-content__date">🍽️ September 16, 2025</span>
                <p class="changelog-content__text">
                    - Adds /wallet
                    - Adds sending and receiving tokens
                    - Adds swapping tokens into TACO
                    - Adds neuron creation
                    - Adds rewards claiming
                    - Adds staking to neurons
                    - Adds start and stop neuron dissolution
                    - Adds modifying neuron dissolve period
                    - Adds neuron disbursal
                    - Adds registering of non-core/trusted tokens
                </p>
            </div>            

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.5
                </h3>
                <span class="changelog-content__date">🍽️ August 16, 2025</span>
                <p class="changelog-content__text">
                    - Updates the homepage to include more info about the DAO
                </p>
            </div>

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.4
                </h3>
                <span class="changelog-content__date">🍽️ July 26, 2025</span>
                <p class="changelog-content__text">
                    - Replaced Sneed tab with a custom Sneed Hub integration at /chat/forum
                </p>
            </div>

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.3
                </h3>
                <span class="changelog-content__date">🍽️ June 15, 2025</span>
                <p class="changelog-content__text">
                    - Added /reports
                </p>
            </div>               

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.2
                </h3>
                <span class="changelog-content__date">🍽️ June 3, 2025</span>
                <p class="changelog-content__text">
                    - Added Sneed tab to /chat
                </p>
            </div>            

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.1
                </h3>
                <span class="changelog-content__date">🍽️ May 28, 2025</span>
                <p class="changelog-content__text">
                    - Added /chat and Open Chat
                    <br>
                    - Added Change Log to /dao News Tile
                </p>
            </div>

        </div>

    </div>

</template>

<style scoped lang="scss">

.changelog-content {

    // list
    &__list {
        display: flex;
        flex-direction: column;
    }

    // item
    &__item {
        display: flex;
        flex-direction: column;
        background-color: rgba(0, 0, 0, 0.15);
        border-bottom: 1px solid var(--table-row-border);
        padding: 1rem;

        &:first-of-type {
            border-top: 0;
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
        }

        &:last-of-type {
            border-bottom: 0;
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }

        &:hover {
            background-color: var(--orange-to-brown);
        }
    }

    // title
    &__title {
        color: var(--black-to-white);
        margin: 0; 
        padding: 0;
        font-size: 1.25rem;
    } 
    
    // date
    &__date {
        font-size: 0.75rem;
        color: var(--dark-orange);
        margin: 0; 
        padding: 0;        
    }    

    // text
    &__text {
        color: var(--black-to-white);
        margin: 0; 
        padding: 0.25rem 0 0 0;
    }

}

</style>

<script setup lang="ts">

// placeholder

</script>