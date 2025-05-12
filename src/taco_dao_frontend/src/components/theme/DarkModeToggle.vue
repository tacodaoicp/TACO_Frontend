<template>
    <div class="dark-mode-toggle">
        <button ref="darkModeToggle" class="btn dark-mode-toggle__btn" @click="toggleDarkMode(false)">
            {{ darkModeToggled ? "☀️" : "🌙" }}
        </button>
    </div>
</template>

<style lang="scss">

// dark mode toggle
.dark-mode-toggle {

    // button
    &__btn {
        font-size: 1.75rem;
        user-select: none;
        cursor: pointer;
        outline: none;
        border: none;
        box-shadow: none;
        padding: 0;      

        &:focus, &:active {
            outline: none;
            border: none;
            box-shadow: none;
        }

        &:focus:focus-visible {
            outline: 3px solid var(--dark-orange);
            outline-offset: 2px;
            box-shadow: none;
        }
    }

    // light icon
    &--light-icon {
        font-size: inherit;
    }

    // dark icon
    &--dark-icon {
        font-size: inherit;
    }

}
</style>

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