<template>

    <iframe
        ref="chatFrame"
        title="OpenChat"
        class="w-full h-full border-0 rounded-lg"
        style="width: 100%; height: 100%; min-height: 371px; border-radius: 0.5rem;" />

</template>

<style scoped lang="scss">



</style>

<script setup lang="ts">

/////////////
// Imports //
/////////////

import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import {
    initialise,
    type OpenChatXFrame,
    type OpenChatXFrameOptions,
} from '@open-ic/openchat-xframe'

interface Props {
    initialPath?: string
    baseTheme?: 'dark' | 'light'
    disableNav?: boolean
}

const props = defineProps<Props>()  

const chatFrame = ref<HTMLIFrameElement | null>(null)
let client: OpenChatXFrame | null = null  

//////////////
// watchers //
//////////////

// change path
watch(() => props.initialPath, newPath => {
    if (client && newPath) client.changePath(newPath)
})

/////////////////////
// lifecycle hooks //
/////////////////////

onMounted(async () => {

    // safety
    if (!chatFrame.value) return
  
    // options
    const options: OpenChatXFrameOptions = {
        targetOrigin: 'https://oc.app',
        initialPath: props.initialPath,
        settings: { disableLeftNav: !!props.disableNav },
        theme: {
            name : 'taco-site',
            base : props.baseTheme ?? 'dark',
            // overrides : {
            //     primary: '#68D391',
            //     bd     : '#333A40',
            //     bg     : 'transparent',
            //     txt    : '#E6E6E6',
            // },
        },
        onUserIdentified: uid => console.info('[OpenChat] logged-in user id:', uid),
    }

    // initialize
    client = await initialise(chatFrame.value, options)

})

onBeforeUnmount(() => {

//   // logs the user out of the OC instance in this iframe only
//   client?.logout()
//   client = null

})

</script>