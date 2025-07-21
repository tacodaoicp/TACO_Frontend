<template>

    <div class="forum-view">

        <!-- left -->
        <div v-show="threadMenuOpen" class="forum-view__left">

            <!-- forum threads -->
            <ForumThreadsList />

        </div>

        <!-- right -->
        <div class="forum-view__right">

            <!-- forum thread -->
            <ForumThreadView />

        </div>

    </div>

</template>

<style lang="scss" scoped>

.forum-view {
    width: 100%;
    height: 100%;
    display: flex;
    border-radius: 0.5rem;
    border: 1px solid var(--dark-orange);
    position: relative;

    // left
    &__left {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 22rem;
      border-right: 1px solid var(--dark-orange);
      border-top-left-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
      background-color: var(--orange-to-light-brown);
    }

    // right
    &__right {
      display: flex;
      width: 100%;
    }

}

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    .forum-view__left {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      border: none;
      outline: 1px solid var(--dark-orange);
      border-radius: 0.5rem;
      height: 100%;
    }
  }
  
  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) { 
    .forum-view__left {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      border: none;
      outline: 1px solid var(--dark-orange);
      border-radius: 0.5rem;
      height: 100%;
    }
  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
    .forum-view__left {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      border: none;
      outline: 1px solid var(--dark-orange);
      border-radius: 0.5rem;
      height: 100%;
    }
  }

  // greater than 991px
  @media (min-width: 992px) {
    .forum-view__left {
      display: flex !important;
    }
  }

  // small daktop
  @media (min-width: 992px) and (max-width: 1199.98px) {
    .forum-view__left {
        max-width: 20rem;
    }
  }

  // // medium desktop
  // @media (min-width: 1200px) and (max-width: 1399.98px) {
    
  // }

</style> 

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import { ref, computed, onMounted } from 'vue'
    import ForumThreadsList from './ForumThreadsList.vue'
    import ForumThreadView from './ForumThreadView.vue'
    import { useTacoStore } from '../../stores/taco.store'
    import { storeToRefs } from 'pinia'

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // forum
    const { threadMenuOpen } = storeToRefs(tacoStore) // reactive

    // # ACTIONS #

    // 

    /////////////////////
    // local variables //
    /////////////////////

    // 

    ///////////////////
    // local methods //
    ///////////////////

    //   
    
    //////////////
    // computed //
    //////////////

    // 
  
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // // on mounted
    // onMounted(async () => {

    //     // log
    //     // console.log('forum view mounted')

    // })

</script>