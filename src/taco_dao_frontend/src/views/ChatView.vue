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
            <div class="taco-toolbar gap-2">

              <!-- left -->
              <div class="taco-toolbar__left">

                <!-- buttons -->
                <div class="btn-group">

                    <!-- open chat -->
                    <button class="btn taco-nav-btn"
                            @click="showOpenChat = true; showSneed = false; showDiscord = false;"
                            :class="{ 'taco-nav-btn--active': showOpenChat }">Open Chat</button>

                    <!-- sneed -->
                    <button class="btn taco-nav-btn"
                            @click="showOpenChat = false; showSneed = true; showDiscord = false;"
                            :class="{ 'taco-nav-btn--active': showSneed }">Sneed Hub</button>

                    <!-- discord -->
                    <button class="btn taco-nav-btn"
                            @click="showOpenChat = false; showSneed = false; showDiscord = true;"
                            :class="{ 'taco-nav-btn--active': showDiscord }">Discord</button>

                </div>

              </div>

              <!-- right -->
              <div class="taco-toolbar__right flex-grow-1 d-flex justify-content-end"> 

                <!-- buttons -->
                <div class="btn-group">

                    <!-- open chat -->
                    <button v-show="showOpenChat" class="btn taco-nav-btn taco-nav-btn--green taco-nav-btn--active ms-auto" @click="showAccessTutorial()"><i class="fa-solid fa-lock"></i> Gated Access</button>                    

                </div>

              </div>

            </div>

          </div>     
          
          <!-- open chat iframe container -->
          <div v-show="showOpenChat" class="chat-iframe__container">         

            <!-- Open Chat iFrame -->
            <iframe ref="iframe" title="OpenChat" frameborder="0" class="chat-iframe" />

            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="chat-iframe__loading-img">                

          </div>

          <!-- sneed iframe container -->
          <div v-show="showSneed" class="sneed-iframe__container">

            <!-- sneed iFrame -->
            <iframe ref="sneedIframe" title="Sneed" frameborder="0" class="sneed-iframe" />

            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="chat-iframe__loading-img"> 

          </div>

          <!-- discord iframe container -->
          <div v-show="showDiscord" class="discord-iframe__container">

            <!-- discord iFrame -->
            <iframe
              ref="discordIframe"
              title="Discord"
              class="discord-iframe"
              src="https://discord.com/widget?id=1184741598936977418&theme=dark"
              allowtransparency="true"
              frameborder="0"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            ></iframe>


            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="chat-iframe__loading-img"> 

          </div>          

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

    <!-- message modal -->
    <div v-if="userShownAccessTutorial" class="access__message">
      
      <!-- message -->
      <div class="access__message__dialog">
        
        <!-- message top -->
        <div class="access__message__dialog__top px-2 p-2">

          <!-- message top left -->
          <div class="taco-text-white ps-3">How To Access Taco HQ</div>

          <!-- message top right -->
          <div class="taco-text-black-to-white"></div>

        </div>

        <!-- message middle -->
        <div class="access__message__dialog__middle">

          <!-- left -->
          <div class="d-flex flex-column align-items-center justify-content-start">

            <!-- hotkey svg icon -->
            <svg xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 533 558" 
              style="width: 100%; max-width: 80px;">
              <path fill="var(--dark-orange-to-light-brown)" d="M414.645,190.32c36.157,0,65.468,29.311,65.468,65.468s-29.311,65.468-65.468,65.468-65.468-29.311-65.468-65.468,29.311-65.468,65.468-65.468ZM414.645,373.63c65.059,0,117.842-52.783,117.842-117.842s-52.783-117.842-117.842-117.842-117.842,52.783-117.842,117.842c0,23.077,6.629,44.6,18.085,62.767l-141.329,141.329c-10.229,10.229-10.229,26.842,0,37.071l52.374,52.374c10.229,10.229,26.842,10.229,37.071,0,10.229-10.229,10.229-26.842,0-37.071l-33.88-33.88,15.303-15.303,33.88,33.88c10.229,10.229,26.842,10.229,37.071,0,10.229-10.229,10.229-26.842,0-37.071l-33.88-33.88,70.46-70.46c18.167,11.457,39.69,18.085,62.767,18.085h-.082Z"/>
              <path fill="var(--dark-orange-to-light-brown)" d="M170.178,434.981l119.966-119.966c-8.763-18.406-13.341-38.602-13.341-59.227,0-26.358,7.357-51.589,21.095-73.354-9.854-17.062-22.145-32.804-36.658-46.663l-71.793-68.488c-8.052-7.629-12.63-18.309-12.63-29.412v-18.817c0-9.917-8.137-18.054-18.054-18.054-5.679,0-11.104,2.712-14.494,7.29l-13.562,18.054c-14.07,18.732-21.699,41.703-21.699,65.182,0,28.819,11.443,56.536,31.786,76.879l32.718,32.718c10.765,10.765,16.868,25.429,16.868,40.686v3.306c0,29.921-24.327,54.248-54.248,54.248s-54.248-24.327-54.248-54.248v-75.777c0-10.595-8.561-19.156-19.156-19.156-5.086,0-10.002,2.034-13.562,5.594l-2.967,2.967C16.957,187.984.513,227.653.513,269.017v3.221c0,89.848,72.895,162.743,162.743,162.743h6.922Z"/>
            </svg>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              What is Hotkeying?
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white text-center"
              style="font-size: 0.875rem;">
              Hotkeying your SNS Neurons with you Open Chat principal allows you to access the gated chat room, Taco HQ <br><br> This allows Open Chat to confirm you have a voting stake in Taco Dao, and grant you access to the private room <br><br> You must have <span style="font-weight: 900; text-decoration: underline;">at least 77 Taco staked for at least 27 days</span>. This is re-evaluated every 77 days<br><br> Here is more information on <a href="https://support.dfinity.org/hc/en-us/articles/8939053696788-What-is-a-neuron-hotkey-and-how-do-I-use-it" target="_blank">Hotkeying</a> from Dfinity
            </span>

          </div>

          <!-- right -->
          <div class="d-flex flex-column align-items-center justify-content-start">

            <!-- open chat icon -->
            <svg mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 638.815 636.5" style="width: 100%; max-width: 5rem;">
              <defs>
                <linearGradient id="linear-gradient" x1="863.861" y1="-292.726" x2="863.861" y2="343.754" gradientTransform="translate(1182.017 255.742) rotate(179.913) scale(1 1.259)" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#fbb03b"/>
                  <stop offset="1" stop-color="#f05a24"/>
                </linearGradient>
                <linearGradient id="linear-gradient1" x1="512.13" y1="-777.806" x2="512.13" y2="-269.661" gradientTransform="translate(146.444 1058.732) rotate(-13.064) scale(1.032 1.417)" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#5f2583"/>
                  <stop offset="1" stop-color="#ed1e79"/>
                </linearGradient>
              </defs>
              <path d="M0,318.2c0,175.8,142.5,318.3,318.2,318.3s318.3-142.5,318.3-318.2S494,0,318.2,0,0,142.4,0,318.2ZM141.4,318.2c0-97.6,79.2-176.8,176.8-176.8s176.8,79.2,176.8,176.8-79.2,176.8-176.8,176.8-176.8-79.2-176.8-176.8Z" fill="url(#linear-gradient)"/>
              <path d="M502.3,58.8c144.8,100.3,180,297.7,78.6,441-21.4,30.3-48,56.6-78.6,77.8l-82.1-116.1c80-55.4,99.4-164.5,43.4-243.6-11.8-16.7-26.5-31.3-43.4-43l82.1-116.1Z" fill="url(#linear-gradient1)"/>
            </svg>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              How to Hotkey
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white text-start"
              style="font-size: 0.875rem;">
              To Hotkey your SNS Neurons
              <ol style="list-style-type: decimal; padding-left: 1.75rem;">
                <li class="text-start">
                  Copy your Open Chat principal. You can find it in Open Chat under Profile Settings > Advanced > User ID
                </li>
                <li class="text-start">
                  Go to <a href="https://nns.ic0.app/" target="_blank">The NNS</a> and login
                </li>
                <li class="text-start">
                  Go to the Neuron Staking page and select a TacoDAO neuron
                </li>    
                <li class="text-start">
                  Scroll to the bottom of the page and select "Add Hotkey"
                </li> 
                <li class="text-start">
                  Enter your Open Chat principal and click "Confirm"
                </li>                                                
              </ol>
              <span class="d-inline-flex text-center">That's it, You've hotkeyed a SNS Neuron! You should now be able to access Taco HQ</span>
            </span>

          </div>

        </div>

        <!-- message bottom -->
        <div class="access__message__dialog__bottom p-2">

          <!-- message bottom left -->
          <div class="taco-text-black-to-white"></div>

          <!-- message bottom right -->
          <div class="taco-text-black-to-white">

            <!-- close button -->
            <button class="btn taco-nav-btn"
                    @click="hideAccessTutorial()">
              Got It
            </button>

          </div>

        </div>

      </div>
      
    </div>      

  </div>

</template>

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  // iFrame
  .chat-iframe, .sneed-iframe, .discord-iframe {
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

  // vote message modal
  .access__message {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: start;
    width: 100%;
    height: 100%;
    background-color: var(--curtain-bg);
    z-index: 1000;
    margin: 0;
    padding: 0;
    overflow: auto;

    // dialog
    &__dialog {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 40rem;
      border-radius: 0.5rem;
      background-color: var(--light-orange-to-dark-brown);
      border: 1px solid var(--dark-orange);
      overflow: clip;
      margin: 2rem 2rem 2rem;

      container: tutorial-dialog / inline-size;

      // the magic
      @container tutorial-dialog (inline-size > 400px) {
        .access__message__dialog__middle {
          flex-direction: row;
          padding: 3rem;
        }
        .access__message__dialog__middle > div {
          width: 50%;
        }
      }
      @container tutorial-dialog (inline-size < 400px) {
        .access__message__dialog__middle {
          flex-direction: column;
          padding: 3rem 1rem;
        }
        .access__message__dialog__middle > div {
          width: 100%;
        }
      }

      // top and bottom
      &__top, &__bottom {
        display: flex;
        width: 100%;
        justify-content: space-between;
        background-color: var(--dark-orange);
      }

      // top
      &__top {

      }

      // middle
      &__middle {
        display: flex;
        flex-direction: row;
        align-items: start;
        gap: 2rem;
      }        

      // bottom
      &__bottom {

      }

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
  import { ref, onMounted, watch } from "vue"
  import { initialise } from '@open-ic/openchat-xframe'
  import astronautLoader from '../assets/images/astonautLoader.webp'

  /////////////////////
  // local variables //
  /////////////////////

  // open chat iframe
  const iframe = ref<HTMLIFrameElement | null>(null)

  // sneed iframe
  const sneedIframe = ref<HTMLIFrameElement | null>(null)

  // show open chat
  const showOpenChat = ref(true)

  // show sneed
  const showSneed = ref(false)

  // show discord
  const showDiscord = ref(false)

  // astronaut loader
  const astronautLoaderUrl = astronautLoader

  // tutorial
  const userShownAccessTutorial = ref(false)


  ///////////////////
  // local methods //
  ///////////////////  

  //////////////
  // handlers //  

  // show access tutorial
  const showAccessTutorial = () => {

    // log
    // console.log('VoteView.vue: accepting access tutorial locally')

    userShownAccessTutorial.value = true

  }

  // hide access tutorial
  const hideAccessTutorial = () => {

    // log
    // console.log('VoteView.vue: accepting access tutorial locally')

    userShownAccessTutorial.value = false

  }


  /////
  // watcherse //
  /////

  // watch for showSneed
  watch(showSneed, async (newVal) => {

    // log
    // console.log('ChatView.vue: showSneed:', newVal)

    // initialize sneed iframe
    if (sneedIframe.value) {
      try {
        sneedIframe.value.src = 'https://app.sneeddao.com/proposals?sns=lacdn-3iaaa-aaaaq-aae3a-cai'
      } catch (error) {
        console.error('Failed to initialize Sneed:', error)
      }
    }    

  })


  /////////////////////
  // lifecycle hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {
    // initialize open chat iframe
    if (iframe.value) {
      try {
        const client = await initialise(iframe.value, {
          targetOrigin: 'https://oc.app',
          initialPath: '/community/lizfz-ryaaa-aaaar-bagsa-cai/channel/1733722051',
          theme: {
            name: 'taco-theme',
            base: 'dark',
            overrides: {}
          }
        })
      } catch (error) {
        console.error('Failed to initialize OpenChat:', error)
      }
    }
  })

</script>