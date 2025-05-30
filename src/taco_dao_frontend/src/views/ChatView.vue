<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container - app util class -->
    <div class="scroll-y-container h-100">

      <!-- container -->
      <div class="d-flex flex-column align-items-center h-100 mx-0 mx-sm-3 mx-md-5">

        <!-- taco container -->
        <div class="taco-container
                    taco-container--l1
                    d-flex flex-column gap-0 w-100 p-0 flex-grow-1 mt-2"
          style="max-width: 1600px;">

          <!-- toolbar container - l2 -->
          <div class="taco-container taco-container--l2 taco-container--l2--dark p-2 mx-3 mt-3 mb-3 mb-sm-0">

            <!-- toolbar -->
            <div class="taco-toolbar">

                <!-- buttons -->
                <div class="btn-group">

                    <!-- open chat -->
                    <button class="btn taco-nav-btn taco-nav-btn--active">Open Chat</button>                    

                </div>

            </div>

          </div>     
          
          <!-- iframe container -->
          <div class="chat-iframe__container">         

            <!-- Open Chat iFrame -->
            <iframe ref="iframe" title="OpenChat" frameborder="0" class="chat-iframe" />

            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="chat-iframe__loading-img">                

          </div>

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

  </div>

</template>

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  // Open Chat iFrame
  .chat-iframe {
    width: 100%;
    height: 100%;
    padding: 1rem;
    border-radius: 1.5rem;
    z-index: 2;

    // container
    &__container {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex-grow: 1;
      position: relative;      
    }

    // loading image
    &__loading-img {
      width: 10rem;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    }

  }

  ///////////////////
  // media queries //
  ///////////////////

  // // phone protrait
  // @media (max-width: 575.98px) {

  // }
  
  // // phone landscape
  // @media (min-width: 576px) and (max-width: 767.98px) { 

  // }

  // // tablet
  // @media (min-width: 767px) and (max-width: 991.98px) {
    
  // }

  // // small daktop
  // @media (min-width: 992px) and (max-width: 1199.98px) {
    
  // }

  // // medium desktop
  // @media (min-width: 1200px) and (max-width: 1399.98px) {
    
  // }

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import HeaderBar from "../components/HeaderBar.vue"
  import FooterBar from "../components/FooterBar.vue"
  import { ref, onMounted } from "vue"
  import { initialise } from '@open-ic/openchat-xframe'
  import astronautLoader from '../assets/images/astonautLoader.webp'

  /////////////////////
  // local variables //
  /////////////////////

  // iframe
  const iframe = ref<HTMLIFrameElement | null>(null)

  // astronaut loader
  const astronautLoaderUrl = astronautLoader

  /////////////////////
  // lifecycle hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {

    // if iframe is not found, return
    if (!iframe.value) return

    // try to initialize the client
    try {

      // initialize the client
      const client = await initialise(iframe.value, {
        targetOrigin: 'https://oc.app',
        initialPath: '/community/lizfz-ryaaa-aaaar-bagsa-cai/channel/1733722051',
        theme: {
          name: 'taco-theme',
          base: 'dark',
          overrides: {}
        }
      })

      // log
      // console.log('OpenChat initialized successfully')  

    } catch (error) {

      // log error
      console.error('Failed to initialize OpenChat:', error)

    }

  })

</script>