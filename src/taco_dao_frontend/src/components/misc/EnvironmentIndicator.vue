<template>

    <div v-if="isStaging || isLocal" class="taco-environment-indicator">

        <!-- environment indicator -->
        <div class="taco-environment-indicator__inner"
             :class="{ 'taco-environment-indicator__inner--staging': isStaging,
                      'taco-environment-indicator__inner--local': isLocal }"
        >

            <!-- staging icon -->
            <i v-if="isStaging" class="fa-solid fa-earth-americas"></i>

            <!-- staging title-->
            <span v-if="isStaging" class="">Staging</span>     
            
            <!-- local icon -->
            <i v-if="isLocal" class="fa-solid fa-desktop"></i>

            <!-- local title-->
            <span v-if="isLocal" class="">Local</span>

        </div>

    </div>

</template>

<style lang="scss" scoped>

    // taco environment indicator
    .taco-environment-indicator {
        
        // inner
        &__inner {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;

            // staging
            &--staging {
                background-color: var(--orange);

                // icon
                i {
                    font-size: 0.75rem;
                    color: black;
                }

                // text
                span {
                    font-size: 0.75rem;
                    font-family: 'rubik';
                    font-weight: bold;
                    color: black;
                }                

            }

            // local
            &--local {  
                background-color: var(--green);

                // icon
                i {
                    font-size: 0.75rem;
                    color: black;
                }

                // text
                span {
                    font-size: 0.75rem;
                    font-family: 'rubik';
                    font-weight: bold;
                    color: black;
                }                

            }

        }

    }

</style>

<script setup>

    /////////////
    // Imports //
    /////////////

    import { ref, onMounted } from 'vue'

    /////////////////////
    // local variables //
    ///////////////////// 

    // is ic
    const isIC = ref(false)

    // is staging
    const isStaging = ref(false)

    // is local
    const isLocal = ref(false)

    /////////////////////
    // lifecycle hooks //
    /////////////////////

    // on mount
    onMounted(async () => {

        // log
        // console.log('environment indicator mounted')

        // if host is staging
        if (process.env.DFX_NETWORK === "staging"){

            // log
            // console.log('host is staging')

            // set is staging
            isStaging.value = true

            // update title
            document.title = 'Taco Dao [Staging]'

        }

        // if host is local
        if (process.env.DFX_NETWORK === "local"){

            // log
            // console.log('host is local')

            // set is local
            isLocal.value = true

            // update title
            document.title = 'Taco Dao [Local]'

        }

    })

</script>