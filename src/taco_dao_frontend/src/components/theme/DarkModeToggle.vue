<template>
    <div class="dark-mode-toggle">
        <button ref="darkModeToggle" class="btn dark-mode-toggle__btn" @click="toggleDarkMode(false)">
            {{ darkModeToggled ? "☀️" : "🌙" }}
        </button>
    </div>
</template>

<!-- styles moved to style/taco.scss -->

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import { onMounted } from "vue";
    import { useTacoStore } from "../../stores/taco.store";
    import { storeToRefs } from "pinia";

    ////////////
    // Stores //
    ////////////

    // taco store
    const tacoStore = useTacoStore()
    const { darkModeToggled } = storeToRefs(tacoStore) // reactive
    const { toggleDarkMode } = tacoStore // not reactive

    /////////////////
    // Local State //
    /////////////////

    // 


    ///////////////////
    // Local Methods //
    ///////////////////  

    // 
    

    /////////////////////
    // Lifecycle Hooks //
    /////////////////////

    // on mounted
    onMounted(() => {

        // if dark mode is toggled
        if(darkModeToggled){

            // toggle dark mode
            toggleDarkMode(true)

        } 
        
        else {

            // do nothing

        }

    })

</script>