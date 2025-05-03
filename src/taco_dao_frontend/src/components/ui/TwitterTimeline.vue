<template>

    <!-- twitter timeline -->
    <a class="twitter-timeline" href="https://twitter.com/tacodaoicp?ref_src=twsrc%5Etfw">
        Tweets by @tacodaoicp
    </a>

</template>

<style scoped lang="scss">



</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import { ref, onMounted } from 'vue'

/////////////////////
// lifecycle hooks //
/////////////////////

onMounted(async () => {

    try {

        // log
        console.log('twitter timeline mounted')

        // if the Twitter widget script is not yet loaded
        if (!window.twttr && process.env.DFX_NETWORK === "ic") {

            // log
            console.log('Twitter script not loaded, loading...')

            // create script element
            const script = document.createElement('script')

            // set attributes
            script.setAttribute('src', 'https://platform.twitter.com/widgets.js')
            script.setAttribute('async', 'true')
            script.setAttribute('charset', 'utf-8')

            // append it first so it starts loading
            document.head.appendChild(script)

            // wait for the script to fully load
            await new Promise((resolve, reject) => {

                // on load
                script.onload = () => {
                    console.log('Twitter script loaded')
                    resolve(true)
                }

                // on error
                script.onerror = () => reject(new Error('Failed to load Twitter script'))

            })

        } else if (window.twttr && process.env.DFX_NETWORK === "ic") {

            // log  
            console.log('Twitter script already loaded, re-rendering...')

            // re-render
            window.twttr.widgets.load()

        } else {

            // log
            console.log('Twitter script not loaded in dev environment for rate limiting concerns, skipping...')

        }

    } catch (error) {

        // log error
        console.error('error fetching twitter timeline:', error)

    } finally {

        // log
        console.log('twitter timeline mounted')

    }

})

</script>