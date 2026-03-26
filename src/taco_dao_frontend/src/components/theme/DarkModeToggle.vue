<template>
    <div class="dark-mode-toggle" title="Light mode will be implemented later">
        <button ref="darkModeToggle" class="btn dark-mode-toggle__btn" disabled>
            🌙
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

    // on mounted — always force dark mode
    onMounted(() => {
        darkModeToggled.value = false
        toggleDarkMode(true) // apply dark mode styles
    })

</script>