<template>

    <div class="changelog-content">

        <!-- changelog list -->
        <div class="changelog-content__list">

            <!-- changelog item -->
            <div class="changelog-content__item">
                <h3 class="changelog-content__title">
                    v1.0.4
                </h3>
                <span class="changelog-content__date">🍽️ July 21, 2025</span>
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
        background-color: var(--light-orange-to-dark-brown);
        border-bottom: 1px solid var(--dark-orange);
        padding: 1rem;
        &:first-of-type {
            border-top: 1px solid var(--dark-orange);
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
        }

        &:last-of-type {
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