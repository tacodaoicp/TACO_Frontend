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
          <div class="taco-container taco-container--l2 taco-container--l2--dark p-2 mx-3 mt-3 mb-0">

            <!-- toolbar -->
            <div class="taco-toolbar gap-2">

              <!-- left -->
              <div class="taco-toolbar__left">

                <!-- buttons -->
                <div class="btn-group">

                    <!-- open chat -->
                    <button class="btn taco-nav-btn"
                            @click="router.push('/chat/oc')"
                            :class="{ 'taco-nav-btn--active': showOpenChat }">Open Chat</button>

                    <!-- sneed -->
                    <button class="btn taco-nav-btn"
                            @click="router.push('/chat/sneed')"
                            :class="{ 'taco-nav-btn--active': showSneed }">Sneed Hub</button>

                </div>

              </div>

              <!-- right -->
              <div class="taco-toolbar__right flex-grow-1 flex-wrap d-flex justify-content-end gap-2"> 

                <!-- open chat links -->
                <div v-show="showOpenChat" class="btn-group">

                  <!-- gated access tutorial -->
                  <button class="btn taco-nav-btn taco-nav-btn--green taco-nav-btn--active ms-auto animate__animated animate__delay-1s" 
                    :class="{ 'animate__swing': openChatSeenLocalValue }"
                    @click="showAccessTutorial()">
                    <i class="fa-solid fa-circle-question"></i> Gated Access
                  </button>                              

                </div>

                <!-- sneed links -->
                <div v-show="showSneed" class="btn-group">

                    <!-- sneed discussions tutorial -->
                    <button class="btn taco-nav-btn taco-nav-btn--green taco-nav-btn--active animate__animated animate__delay-1s" 
                    :class="{ 'animate__swing': sneedSeenLocalValue }"
                    @click="showSneedDiscussionsTutorial()"
                    title="How to Participate in Sneed Hub Discussions"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top">
                      <i class="fa-solid fa-circle-question"></i> Sneed Discussions
                    </button>

                </div>

                <!-- refresh sneed iframe -->
                <button 
                v-show="showSneed"
                class="btn taco-nav-btn taco-nav-btn--green taco-nav-btn--active" 
                @click="refreshSneedIframe()"
                title="Refresh Sneed Hub"
                data-bs-toggle="tooltip"
                data-bs-placement="top">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>                

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

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

    <!-- gated access tutorial modal -->
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
    
    <!-- sneed discussions modal -->
    <div v-if="userShownSneedDiscussionsTutorial" class="sneed-discussions__message">
      
      <!-- message -->
      <div class="sneed-discussions__message__dialog">
        
        <!-- message top -->
        <div class="sneed-discussions__message__dialog__top px-2 p-2">

          <!-- message top left -->
          <div class="taco-text-white ps-3">How To Participate in Sneed Hub Discussions</div>

          <!-- message top right -->
          <div class="taco-text-black-to-white"></div>

        </div>

        <!-- message middle -->
        <div class="sneed-discussions__message__dialog__middle">

          <!-- left -->
          <div class="d-flex flex-column align-items-center justify-content-start">

            <!-- sneed svg icon -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 92" class="taco-text-black-to-white" style="width: 3.5rem;">
              <path fill="currentColor" d="M24.905,52.704c.813.382,2.064,1.057,2.922,1.167,1.033.133,2.136.006,3.172.063,7.908.436,14.201,9.595,10.194,16.906-3.937,7.182-14.755,8.606-20.783,3.265-4.645-4.115-4.813-9.825-1.963-15.086.214-.396.667-.964.817-1.319.032-.076.064-.139.048-.226-1.152-.038-2.288.059-3.437.072-3.48,4.174-4.553,9.419-2.311,14.494,3.816,8.636,15.065,11.74,23.427,8.087,9.311-4.068,13.398-15.536,5.086-22.929-10.03-8.922-29.914-10.492-33.977-25.283-3.27-11.901,4.824-23.401,16.51-25.932,15.248-3.302,29.74,9.551,26.297,25.259-.438,1.998-1.208,3.948-2.213,5.723-.051.036.048.12.065.124h4.577c.052,0,.164-.11.2-.166.12-.183.328-.793.425-1.04,1.128-2.86,2.089-7.298,1.907-10.359-.677-11.399-8.763-20.552-19.638-23.449C17.56-2.9-.642,13.24,3.779,32.512c2.384,10.391,12.184,15.989,21.126,20.192Z"/>
              <path fill="currentColor" d="M32.841,40.984c-6.736-3.168-17.703-6.757-16.134-16.296,1.291-7.849,10.208-11.694,17.345-9.205,5.959,2.077,10.621,8.952,7.425,15.117-1.341,2.586-3.667,4.509-5.84,6.367-.058.032.046.118.062.122h6.408c5.069-5.023,6.094-12.269,2.399-18.45-6.764-11.314-24.235-10.926-30.514.71-4.293,7.954-.829,15.511,6.167,20.158,10.619,7.055,29.783,10.129,31.133,25.625.981,11.263-8.719,20.162-19.377,21.268-14.508,1.506-27.893-10.794-23.496-25.693.283-.958.777-1.959,1.026-2.88.025-.093.066-.224.046-.315-.05-.225-1.279-.042-1.497-.038-.792.016-1.892-.104-2.63-.006-.326.044-.465.606-.578.887-3.206,7.994-1.174,17.471,4.577,23.744,9.855,10.749,26.798,11.668,37.902,2.258,8.652-7.332,11.147-19.564,5.029-29.382-4.145-6.652-12.546-10.743-19.453-13.992Z"/>
              <path fill="currentColor" d="M27.46,18.719c-.02.031-.092.075-.092.092v15.929c0,.006.085.092.092.092h3.723c.006,0,.092-.085.092-.092v-15.929c0-.006-.085-.092-.092-.092h-3.723Z"/>
              <path fill="currentColor" d="M31.164,60.055c1.414.333,2.106,1.393,2.826,2.545h3.692c-.667-4.655-6.187-6.455-10.266-5.353-8.731,2.359-8.966,15.101.245,16.809,1.884.349,3.742.185,5.537-.469,2.116-.771,3.235-1.876,3.997-3.997.097-.271.298-.807.341-1.065.011-.066-.042-.126-.067-.126h-3.723c-.354.529-.519,1.107-.948,1.615-1.295,1.536-3.79,1.604-5.449.631-4.711-2.765-2.607-12.1,3.815-10.589Z"/>
            </svg>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              What are Sneed Hub Discussions?
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white text-center"
              style="font-size: 0.875rem;">
              Sneed Hub Discussions are Reddit-like forums where your up/down vote power is the same as your SNS voting power! 
              <br><br>
              A new discussion is automatically created for each SNS proposal
              <br><br>
              /chat/sneed automatically places you on the Taco Dao Proposals page, you can tell by the "Taco Dao" selection in the top right
              <br>
              <img :src="sneedHubSnsSelectorImage" alt="" class="py-2" style="width: 100%; max-width: 13rem;">
              <br>
              and the "Proposals" selection highlighted in the navigation
              <br>
              <img :src="sneedHubProposalsImage" alt="" class="py-2" style="width: 100%;">              
              <br>
              Select a proposal by clicking on it's link
              <br>
              <img :src="sneedHubProposalLinkImage" alt="" class="py-2" style="width: 100%; max-width: 3rem;">
              <br>
              Then scroll down to the discussion section to participate!
            </span>

          </div>

          <!-- right -->
          <div class="d-flex flex-column align-items-center justify-content-start">

            <!-- up/down vote icons -->
            <span class="d-flex align-items-center justify-content-center" style="font-size: 3.5rem;">
              <span style="color: rgb(107, 142, 107);">▲</span>
              <span style="color: rgb(184, 92, 92);">▼</span>
            </span>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              How to Up/Dowm Vote<br>With Your Voting Power
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white text-start"
              style="font-size: 0.875rem;">
              <ol style="list-style-type: decimal; padding-left: 1.75rem;">
                <li class="text-start">
                  Log into Sned Hub
                  <br>
                  <img :src="sneedHubLoginImage" alt="sneed discussions" class="sneed-discussions__message__dialog__img">
                </li>
                <li class="text-start">
                  Onced logged in, click this button to view and copy your principal
                  <br>
                  <img :src="sneedHubLoggedInImage" alt="sneed discussions" class="sneed-discussions__message__dialog__img">
                </li>
                <li class="text-start">
                  Go to <a href="https://nns.ic0.app/" style="color: var(--blue-to-light-blue);" target="_blank">The NNS</a> and login
                </li>    
                <li class="text-start">
                  Go to the Neuron Staking page and select a TacoDAO neuron
                </li>
                <li class="text-start">
                  Scroll to the bottom of the page and select "Add Hotkey"
                </li> 
                <li class="text-start">
                  Enter your Sneed Hub principal and click "Confirm"
                </li>                                                
              </ol>
              <span class="d-inline-flex text-center">That's it, you should now be able to vote in Sneed Hub Discussions!</span>
              <br><br> 
              <span class="d-inline-flex text-center">There are no stake amount, or duration, minumuns for participating in Sneed Hub Discussions</span>
              <br><br> 
              <p class="text-center m-0 p-0">Here is more information on <a href="https://support.dfinity.org/hc/en-us/articles/8939053696788-What-is-a-neuron-hotkey-and-how-do-I-use-it" style="color: var(--blue-to-light-blue);" target="_blank">Hotkeying</a> from Dfinity</p>
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
                    @click="hideSneedDiscussionsTutorial()">
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
  .chat-iframe, .sneed-iframe {
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

  // message modal
  .access__message, .sneed-discussions__message {
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
        .access__message__dialog__middle, .sneed-discussions__message__dialog__middle {
          flex-direction: row;
          padding: 3rem;
        }
        .access__message__dialog__middle > div, .sneed-discussions__message__dialog__middle > div {
          width: 50%;
        }
      }
      @container tutorial-dialog (inline-size < 400px) {
        .access__message__dialog__middle, .sneed-discussions__message__dialog__middle {
          flex-direction: column;
          padding: 3rem 1rem;
        }
        .access__message__dialog__middle > div, .sneed-discussions__message__dialog__middle > div {
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

  // phone protrait
  @media (max-width: 575.98px) {
    .chat-iframe__container, .sneed-iframe__container {
      padding: 0.5rem 0.5rem;
    }
    .chat-iframe, .sneed-iframe {
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
  import { ref, onMounted, watch } from "vue"
  import { initialise } from '@open-ic/openchat-xframe'
  import { useRoute, useRouter } from 'vue-router'
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"    
  import astronautLoader from '../assets/images/astonautLoader.webp'
  import sneedHubLoginImage from '../assets/images/tutorials/sneed-hub-login.png'
  import sneedHubLoggedInImage from '../assets/images/tutorials/sneed-hub-logged-in.png'
  import sneedHubProposalsImage from '../assets/images/tutorials/sneed-hub-proposals.png'
  import sneedHubSnsSelectorImage from '../assets/images/tutorials/sneed-hub-sns-selector.png'
  import sneedHubProposalLinkImage from '../assets/images/tutorials/sneed-hub-proposal-link.png'

  ///////////
  // store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // user
  const { openChatSeenStoreValue } = storeToRefs(tacoStore)
  const { setOpenChatSeenStoreValue } = tacoStore  
  const { sneedSeenStoreValue } = storeToRefs(tacoStore)
  const { setSneedSeenStoreValue } = tacoStore  

  // # ACTIONS #

  // app
  const { addToast } = tacoStore

  /////////////////////
  // local variables //
  /////////////////////

  // route
  const route = useRoute()
  const router = useRouter()

  // open chat iframe
  const iframe = ref<HTMLIFrameElement | null>(null)
  const sneedIframe = ref<HTMLIFrameElement | null>(null)

  // user first time seeing chat page
  const userFirstTimeSeeingChatPage = ref(true)

  // show open chat
  const showOpenChat = ref(true)

  // show sneed
  const showSneed = ref(false)

  // initialized flags
  const openChatInitialized = ref(false)
  const sneedInitialized = ref(false)

  // astronaut loader
  const astronautLoaderUrl = astronautLoader

  // gated accesstutorial
  const userShownAccessTutorial = ref(false)

  // sneed discussions tutorial
  const userShownSneedDiscussionsTutorial = ref(false)

  // users first time seeing the open chat page
  const openChatSeenLocalValue = ref(false)

  // users first time seeing the sneed page
  const sneedSeenLocalValue = ref(false)

  ///////////////////
  // local methods //
  ///////////////////  

  // initialize open chat
  const initializeOpenChat = async () => {

    // log
    // console.log('ChatView.vue: initializeOpenChat')

    if (iframe.value && !openChatInitialized.value) {
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
        openChatInitialized.value = true
      } catch (error) {
        console.error('Failed to initialize OpenChat:', error)
      }
    }

  }

  // initialize sneed
  const initializeSneed = async () => {

    // log
    // console.log('ChatView.vue: initializeSneed')

    if (sneedIframe.value && !sneedInitialized.value) {
      try {
        sneedIframe.value.src = 'https://app.sneeddao.com/proposals?sns=lacdn-3iaaa-aaaaq-aae3a-cai'
        sneedInitialized.value = true
      } catch (error) {
        console.error('Failed to initialize Sneed:', error)
      }
    }
    
  }

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

  // show sneed discussions tutorial
  const showSneedDiscussionsTutorial = () => {

    // log
    // console.log('VoteView.vue: accepting sneed discussions tutorial locally')

    // hide tooltip
    const tooltip = document.querySelector('.tooltip')
    if (tooltip) {
      tooltip.remove()
    }

    // show sneed discussions tutorial
    userShownSneedDiscussionsTutorial.value = true

  }

  // hide sneed discussions tutorial
  const hideSneedDiscussionsTutorial = () => {

    // log
    // console.log('VoteView.vue: accepting sneed discussions tutorial locally')

    userShownSneedDiscussionsTutorial.value = false

  }

  // refresh sneed iframe
  const refreshSneedIframe = () => {

    // log
    // console.log('ChatView.vue: refreshSneedIframe')

    // hide tooltip
    const tooltip = document.querySelector('.tooltip')
    if (tooltip) {
      tooltip.remove()
    }    

    // refresh sneed iframe by reassigning src
    if (sneedIframe.value) {
      const currentSrc = sneedIframe.value.src
      sneedIframe.value.src = 'about:blank'
      setTimeout(() => {
        if (sneedIframe.value) {
          sneedIframe.value.src = currentSrc
        }
      }, 500)
    }

    // log
    console.log('ChatView.vue: sneed iframe refreshed')

    // toast
    addToast({
      id: Date.now(),
      code: 'code',
      tradeAmount: '',
      tokenSellIdentifier: '',
      tradeLimit: '',
      tokenInitIdentifier: '',
      title: '👨‍🍳 Sneed Hub Refreshed!',
      icon: '',
      message: `Sneed Hub has been refreshed`
    })  

  }
  
  ///////////////
  // watchers //
  //////////////

  // watch for route changes
  watch(() => route.path, async (newPath) => {

    // log
    // console.log('ChatView.vue: watch route')

    // set showOpenChat and showSneed
    showOpenChat.value = newPath === '/chat/oc'
    showSneed.value = newPath === '/chat/sneed'

    // if showOpenChat is true, initialize open chat iframe
    if (showOpenChat.value) {

      // log
      // console.log('on /chat/oc')

      // if user has not seen the open chat page
      if (!openChatSeenStoreValue.value) {

        // log
        // console.log('user has not seen the open chat page')

        // set store values
        setOpenChatSeenStoreValue()

        // set local value
        openChatSeenLocalValue.value = true

      } else {

        // log
        // console.log('user has seen the open chat page before')

        // set local value
        openChatSeenLocalValue.value = false

      }

      // initialize open chat iframe
      await initializeOpenChat()

    }

    // if showSneed is true, initialize sneed iframe
    if (showSneed.value) {

      // log
      // console.log('on /chat/sneed')

      // if user has not seen the sneed page
      if (!sneedSeenStoreValue.value) {

        // log
        // console.log('user has not seen the sneed page')

        // set store value
        setSneedSeenStoreValue()

        // set local value
        sneedSeenLocalValue.value = true

      } else {

        // log
        // console.log('user has seen the sneed page before')

        // set local value
        sneedSeenLocalValue.value = false

      }

      // initialize sneed iframe
      await initializeSneed()

    }

  })

  /////////////////////
  // lifecycle hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {

    // log
    // console.log('ChatView.vue: on mounted')

    // set initial state based on route
    showOpenChat.value = route.path === '/chat/oc'
    showSneed.value = route.path === '/chat/sneed'

    // if showOpenChat is true, initialize open chat iframe
    if (showOpenChat.value) {

      // log
      // console.log('on /chat/oc')

      // if user has not seen the open chat page
      if (!openChatSeenStoreValue.value) {

        // log
        // console.log('user has not seen the open chat page')

        // set store values
        setOpenChatSeenStoreValue()

        // set local value
        openChatSeenLocalValue.value = true

      } else {

        // log
        // console.log('user has seen the open chat page before')

        // set local value
        openChatSeenLocalValue.value = false

      }

      // initialize open chat iframe
      await initializeOpenChat()

    }

    // if showSneed is true, initialize sneed iframe
    if (showSneed.value) {

      // log
      // console.log('on /chat/sneed')

      // if user has not seen the sneed page
      if (!sneedSeenStoreValue.value) {

        // log
        // console.log('user has not seen the sneed page')

        // set store value
        setSneedSeenStoreValue()

        // set local value
        sneedSeenLocalValue.value = true

      } else {

        // log
        // console.log('user has seen the sneed page before')

        // set local value
        sneedSeenLocalValue.value = false

      }

      // initialize sneed iframe
      await initializeSneed()

    }

  })

</script>