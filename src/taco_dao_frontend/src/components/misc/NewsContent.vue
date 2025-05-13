<template>

    <div class="news-content">

        <!-- news list -->
        <div class="news-content__list">

            <!-- news item -->
            <div class="news-content__item">
                <h3 class="news-content__title">
                    Sale Update
                </h3>
                <span class="news-content__date">🍽️ May 11, 2025</span>
                <p class="news-content__text">
                    Hey Everyone!
                    <br>
                    The <a href="https://nns.ic0.app/project/?project=lacdn-3iaaa-aaaaq-aae3a-cai"
                     target="_blank"
                     class="taco-text-blue-to-light-blue">Decentralization Sale</a> is live and going great! Thank you to all the early birds! The sale runs through Friday, May 23, 2025, at 12:00 PM (noon) Pacific Time, or until we hit our maximum sale amount.
                </p>
            </div>                

            <!-- news item -->
            <div class="news-content__item">
                <h3 class="news-content__title">
                    Thank you from the Taco team!
                </h3>
                <span class="news-content__date">🍽️ May 5, 2025</span>
                <p class="news-content__text">
                    You guys rock. Thanks for being patient with us. Enjoy the tacos! 🌮
                </p>
            </div>    
            
            <!-- news item -->
            <div class="news-content__item">
                <h3 class="news-content__title">
                    Shameless Social Media Promotion
                </h3>
                <span class="news-content__date">🍽️ May 5, 2025</span>
                <p class="news-content__text">
                    <a href="https://oc.app/community/lizfz-ryaaa-aaaar-bagsa-cai" 
                    target="_blank"
                    class="taco-text-blue-to-light-blue">Open Chat</a><br>
                    <a href="https://nuance.xyz/user/tacodao" 
                    target="_blank"
                    class="taco-text-blue-to-light-blue">Nuance</a><br>
                    <a href="https://taggr.link/#/user/4914" 
                    target="_blank"
                    class="taco-text-blue-to-light-blue">TAGGR</a><br>
                    <a href="https://x.com/tacodaoicp" 
                    target="_blank"
                    class="taco-text-blue-to-light-blue">X</a><br>
                    <a href="https://discord.gg/eVe8kqdVQd" 
                    target="_blank"
                    class="taco-text-blue-to-light-blue">Discord</a>
                </p>
            </div>            

            <!-- news item -->
            <div class="news-content__item">
                <h3 class="news-content__title">
                    Hello World!
                </h3>
                <span class="news-content__date">🍽️ May 5, 2025</span>
                <p class="news-content__text">
                    👨‍🍳 Hey, we're live!
                </p>
            </div>

        </div>

    </div>

</template>

<style scoped lang="scss">

.news-content {

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