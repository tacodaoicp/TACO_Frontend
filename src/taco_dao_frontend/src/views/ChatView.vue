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

          <!-- Open Chat iFrame -->
          <iframe ref="iframe" title="OpenChat" frameborder="0" class="chat-iframe" />

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
  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {

    .chat-iframe {
      padding: 0;
      border-radius: 0.5rem;
    }

  }
  
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

  /////////////////////
  // local variables //
  /////////////////////

  const iframe = ref<HTMLIFrameElement | null>(null)

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
        initialPath: '/community/rfeib-riaaa-aaaar-ar3oq-cai/channel/334961401678552956581044255076222828441',
        theme: {
          name: 'taco-theme',
          base: 'dark',
          overrides: {
            primary: "#db8d27", // taco orange
            bd: '#db8d27',
            bg: 'transparent',
            txt: "var(--brown-to-light-orange)",
            placeholder: "#db8d27",
            'txt-light': '#75c8af',
            timeline: {
              txt: "var(--brown-to-light-orange)"
            },
          }
        }
      })

      // client is now properly initialized
      console.log('OpenChat initialized successfully')

    } catch (error) {

      // log error
      console.error('Failed to initialize OpenChat:', error)

    }

  })

</script>