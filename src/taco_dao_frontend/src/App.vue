<template>

  <div class="app" 
      :class="{ 'overflow-hidden': appLoading }"
      :style="{ backgroundColor: appBackgroundColor }">

    <!-- app loading curtain -->
    <div v-if="appLoading" class="app__loading-curtain">

      <!-- astronaut -->
      <img :src="astronautLoaderUrl" class="loading-img" >

    </div>

    <!-- router view -->
    <router-view></router-view>

    <!-- toast container -->
    <TransitionGroup name="fade" tag="div" class="toast-container position-fixed bottom-0 end-0 m-3">
    
      <!-- toast -->
      <div v-for="toast in toasts" 
          :key="toast.id" 
          class="d-block toast" 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          >
        
        <!-- toast header -->
        <div class="toast-header">

          <!-- icon -->
          <i v-if="toast.icon !== ''" :class="toast.icon" class="rounded me-2"></i>

          <!-- title -->
          <strong class="me-auto">{{ toast.title }}</strong>

          <!-- close button -->
          <button @click="removeToast(toast.id)"
                  type="button" 
                  class="btn-close" 
                  data-bs-dismiss="toast" 
                  aria-label="Close"></button>
        
        </div>

        <!-- toast body -->
        <div v-html="toast.message" class="toast-body"></div>

      </div>

    </TransitionGroup>    

  </div>

</template>

<style lang="scss">

  ///////////////////////
  // Application Style //
  ///////////////////////
  
  // prevent overscroll
  html, body {
    overscroll-behavior-y: none;
  }

  // everything
  * {
    // start with roboto as base font
    font-family: "Roboto";
    // smooth transition text color and background color
    transition: color 0.25s, background-color 0.25s, fill 0.25s, opacity 0.25s;
    // scrollbar color
    scrollbar-color: var(--dark-orange) var(--yellow);
    // box sizing border box
    box-sizing: border-box;
  }

  // app
  .app {

    // full dynamic window height
    height: 100dvh;

    // clipped overflow
    overflow: clip;

    // default text color black
    color: var(--black);

  }

  // app loading curtain
  .app__loading-curtain {
    position: fixed;
    height: 100dvh;
    width: 100vw;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999; // above everything

    .loading-img {
      width: 10rem;
    }
  }

  // scrollbars
  *::-webkit-scrollbar {
    width: 5px; /* Mostly for vertical scrollbars */
    height: 5px; /* Mostly for horizontal scrollbars */
  }
  *::-webkit-scrollbar-thumb {
    background: var(--dark-orange); /* Foreground */
  }
  *::-webkit-scrollbar-track {
    background: var(--yellow); /* Background */
  }

  // headings
  h1, h2, h3, h4, h5, h6 {
    font-family: "Rubik";
  }

  // links, paragraphs, and spans
  a, p, span {
    font-family: "Space Mono";
  }

  // custom tooltip (apex charts related)
  .customtt {
    background-color: #934a17;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem !important;
    padding: 0.5rem 2rem;
    border-radius: 0.25rem;
    gap: 0.175rem;
    z-index: 9999; //canvas is 9998
  }

  // large title (deprecated?)
  .large-title {

    svg {
      width: 5.875rem;
      margin-right: 1rem;
    }

    span {
      color: var(--white);
      font-weight: bold;
      font-size: 1.75rem;
    }  

  }
  // large title - phone protrait
  @media (max-width: 575.98px) { 
    .large-title svg {width: 4.5rem;}
    .large-title span {font-size: 1.25rem;}
  }
  // large title - phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
    .large-title svg {width: 5rem;}
    .large-title span {font-size: 1.375rem;}
  }
  // large title - tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
    .large-title svg {width: 5rem;}
    .large-title span {font-size: 1.5rem;}
  }

  // toasts
  .toast {
    background-color: #ffffff !important; // Solid white background
    border: 1px solid #dee2e6; // Light border for definition
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); // Subtle shadow
  }

  .toast-header {
    background-color: var(--success-green-hover);
    color: var(--white);
    
    // Error toast headers should be red
    .toast:has(.fa-exclamation-triangle) & {
      background-color: #dc3545 !important; // Bootstrap danger red
    }
  }

  /////////////////////
  // Taco Components //
  /////////////////////

  // taco containers
  .taco-container {
    gap: 1rem;

    // level 1, yellow to brown
    &--l1 {
      border-radius: 0.5rem;
      padding: 1.25rem;
      background-color: var(--yellow-to-brown);
      border: 1px solid var(--dark-orange-to-brown);
    }

    // level 2, orange to light brown
    &--l2 {
      position: relative;
      border-radius: 0.5rem;
      padding: 1rem 1.25rem 1rem;
      background-color: var(--orange-to-light-brown);
      border: 1px solid var(--dark-orange);

      // hover mod
      &--hover {

        // hover
        &:hover {
          background-color: var(--light-orange-hover-to-light-brown-hover);
        }

      }

      // dark mod
      &--dark {
        background-color: var(--dark-orange-to-light-brown);
      }

    }

  }
  @media (max-width: 575.98px) {

    .taco-container {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      gap: 0.6rem;
    }

    .taco-container--l1 {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }

    .taco-container--l2 {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }    

  }

  // taco buttons
  .taco-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    font-family: 'Space Mono';

    &--green {
      background-color: var(--green);
      color: var(--black);

      &:hover {
          background-color: var(--green-hover);
          color: var(--black);
      }

      &:focus {
        background-color: var(--green-hover);
        outline: none;
        color: var(--black);
      }

      &:focus:focus-visible {
          background-color: var(--green-hover);
          outline: 3px solid var(--light-brown-to-orange);
          outline-offset: 2px;
      }

      &:active, &:active:focus, &:active:focus-visible {
          background-color: var(--green-hover);
          border-color: var(--green-hover);
          color: var(--black);
      }

      &.disabled,
      &:disabled,
      &[disabled]{
        color: var(--dark-gray) !important;
        background-color: var(--green) !important;
        border-color: transparent !important;
      }

    }
    &--success {
      color: var(--white);
      background-color: var(--success-green);
      border-color: transparent;

      &:hover {
        color: var(--white);
        background-color: var(--success-green-hover);
        border-color: transparent;
      }

      &:focus, &:focus:focus-visible {
        color: var(--white);
        background-color: var(--success-green-hover);
        outline: 3px solid var(--success-green-hover);
        outline-offset: 2px;
        border-color: transparent;
      }

      &:active, &:active:focus, &:active:focus-visible {
        color: var(--white);
        background-color: var(--success-green-hover);
        border-color: transparent;
      }

      &:disabled,
      &[disabled],
      &.disabled {
        color: var(--light-gray);
        border-color: transparent;
        background-color: var(--success-green);
        opacity: 50%;
      }

    }
    &--danger {
      color: var(--white);
      background-color: var(--red);
      border-color: transparent;

      &:hover {
        background-color: var(--red-hover);
        border-color: transparent;
        color: var(--white);
      }

      &:focus, &:focus:focus-visible {
          background-color: var(--red-hover);
          outline: 3px solid var(--red-hover);
          outline-offset: 2px;
          border-color: transparent;
          color: var(--white);
      }

      &:active, &:active:focus, &:active:focus-visible {
          background-color: var(--red-hover);
          border-color: transparent;
          color: var(--white);
      }

      &:disabled,
      &[disabled],
      &.disabled {
        color: var(--light-gray);
        border-color: transparent;
        background-color: var(--red);
        opacity: 50%;
      }  

    }

    &--big {
      padding: 0.75rem 1.5rem;
    }
    &--small {
      // placeholder
    }
  }

  // taco nav buttons
  .taco-nav-btn {
    color: var(--white);
    background-color: transparent;
    border: 1px solid var(--white);
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
    font-family: 'Space Mono';
    height: fit-content;

    &:hover {
      background-color: rgba(0,0,0,0.05);
      border-color: var(--white);
      color: var(--white);
    }

    &:focus {
      color: var(--white);
      background-color: rgba(0,0,0,0.05);
      border-color: var(--white);
      outline: none;
    }

    &:focus-visible {
      outline: 3px solid var(--light-brown-to-orange);
      outline-offset: 0px;
    }

    &:active, &:active:focus, &:active:focus-visible {
      background-color: rgba(0,0,0,0.05);
      border-color: var(--white);
      color: var(--white);
    }  

    &--active {
      color: var(--black) !important;
      background-color: var(--yellow);
      border-color: var(--yellow) !important;

      &:hover {
        background-color: var(--yellow-hover);
        border-color: var(--yellow-hover);
        color: var(--black);
      }

      &:focus {
        color: var(--black);
        border-color: var(--yellow-hover);
        background-color: var(--yellow-hover);
        outline: none;
      }

      &:focus-visible {
        outline: 3px solid var(--light-brown-to-orange);
        outline-offset: 0px;
      }

      &:active, &:active:focus, &:active:focus-visible {
        background-color: var(--yellow-hover);
        border-color: var(--yellow-hover);
        color: var(--black);
      }      

    }

    &--alt:not(.taco-nav-btn--active) {
      color: var(--black-to-white);
      border-color: var(--gray);

      &:hover {
        color: var(--black-to-white);
        border-color: var(--gray) !important;
      }

    }

    &.disabled {
      border: 1px solid var(--white);
      color: var(--white);
      opacity: 0.25;
    }

    &--green {
      border-color: var(--green) !important;
      background-color: var(--green);

      &:hover {
        background-color: var(--green-hover);
        border-color: var(--green-hover) !important;
      }

      &:focus {
        background-color: var(--green-hover);
        border-color: var(--green-hover) !important;
      }

      &:focus-visible {
        outline: 3px solid var(--light-brown-to-orange);
        outline-offset: 0px;
      }

      &:active, &:active:focus, &:active:focus-visible {  
        background-color: var(--green-hover);
        border-color: var(--green-hover) !important;
      }
    }

  }
  @media (max-width: 575.98px) {

    .taco-nav-btn--secondary {
      font-size: 0.875rem;
    }

  }

  // taco lists
  .taco-list {
    
    padding: 1rem 0 1.5rem;
    border: 1px solid var(--dark-orange);
    border-radius: 0.5rem;

    // taco list item
    &__item {
      background-color: transparent;
      border: none;
      border-radius: 0;

      // first item in list
      &:first-of-type {
          padding-top: 0;
      }

      // hover effect
      &:hover {
          background-color: rgba(0, 0, 0, 0.05);
      }

      // force no hover effect
      &--no-hover {
          &:hover {
              background-color: transparent;
          }
      }

      // title list item
      &--title {
          color: var(--brown);
          display: flex;
          gap: 0.75rem;

          // title icon
          i {
              font-size: 1.5rem;
          }

      }

    }

    // key value pairs
    &__kvp {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.25rem;

      // all text
      span {
          color: var(--black);
      }

      // just value
      span:last-of-type {
          font-weight: bold;
      }
    }

  }

  // taco bootstrap list
  .taco-bs-list {
    border: 1px solid var(--dark-orange);

    li {
      background-color: transparent;
      border: none;
      border-bottom: 1px solid var(--dark-orange);

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      &:last-of-type {
        border-bottom: none;
      }

      &.selected {
        background-color: var(--green-to-brown);
      }

      &.disabled {
        color: inherit;
        pointer-events: none;
        background-color: var(--dark-green-to-dark-brown);
      }
    }
  }

  // taco table
  .taco-table {
    

    &--min-width {
      width: min-content;
    }

    thead tr {

      &:hover {
        background-color: transparent;
      }

    }

    tr {

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

    }

    th {
      font-size: 1.125rem;
    }
    
    th, td {
      color: var(--black-to-white);
      background-color: transparent;
      border-bottom: none;
      white-space: nowrap;
      width: 1%;
      font-family: "Space Mono";
      vertical-align: middle;
      padding-left: 1rem;
      padding-right: 1rem;
    }

    tr th:first-of-type {
      font-weight: bold;
    }

    tr th:first-of-type,
    td:first-of-type {
      // text-align: right;
    }

  }

  // taco toolbar
  .taco-toolbar {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    overflow: visible;

    .btn-group {
      flex-wrap: wrap;
    }
  }

  // taco badge
  .taco-badge {
    border: 1px solid var(--dark-orange);
    background-color: var(--yellow);
    font-size: 1rem;
    transition: transform 0.5s;

    &:hover,
    &:focus,
    &:active {
        transform: scale(1.1, 1.1);
    }

    &:focus,
    &:focus:focus-visible {
        outline: 3px solid var(--dark-orange);
        outline-offset: 2px;
    }
  }

  // taco input
  .taco-input {
    font-family: 'Space Mono';
    font-weight: bold;
    font-size: 1.125rem;
    color: var(--black);
    border: 1px solid var(--light-brown-to-white);
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;

    &::placeholder {
      color: var(--dark-gray);
      opacity: 1; /* Firefox */
    }

    &::-ms-input-placeholder { /* Edge 12 -18 */
      color: var(--dark-gray);
    }

    &:disabled,
    &[disabled]{

      &::placeholder {
        color: var(--gray);
      }

      &::-ms-input-placeholder { /* Edge 12 -18 */
        color: var(--gray);
      }

    }

    &:focus {
      outline: none;
      box-shadow: none;
    }

    &:focus-visible {
      outline: 3px solid var(--light-brown-to-orange);
      outline-offset: 2px;
    }

  }

  // taco text copy area
  .taco-text-copy-area {
    padding: 1.375rem 1.825rem;
    background-color: var(--yellow);
    border: 1px solid var(--dark-orange);
    border-radius: 0.5rem;
    font-size: 1.125rem;
    font-weight: bold;
  }

  // taco coin icons
  .taco-coin-icon {
    border-radius: 100%;

    // extra small coin icons
    &--xs {
      width: 1rem;
      height: 1rem;
      // small box shadow
      box-shadow:         0px 2px 6px 0px rgba(0,0,0,0.5);
      -webkit-box-shadow: 0px 2px 6px 0px rgba(0,0,0,0.5);
      -moz-box-shadow:    0px 2px 6px 0px rgba(0,0,0,0.5);
    }

    // small coin icons
    &--sm {
      width: 2rem;
      height: 2rem;
      // small box shadow
      box-shadow:         0px 2px 6px 0px rgba(0,0,0,0.5);
      -webkit-box-shadow: 0px 2px 6px 0px rgba(0,0,0,0.5);
      -moz-box-shadow:    0px 2px 6px 0px rgba(0,0,0,0.5);      
    }

    // medium coin icons
    &--md {
      width: 2.375rem;
      height: 2.375rem;
      // large box shadow
      box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
      -webkit-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
      -moz-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);      
    }

    // large coin icons
    &--lg {
      width: 3.25rem;
      height: 3.25rem;
      // large box shadow
      box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
      -webkit-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
      -moz-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
    }

    // extra large coin icons
    &--xl {
      width: 5.625rem;
      height: 5.625rem;
      // large box shadow
      box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
      -webkit-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);
      -moz-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5);      
    } 

  }

  // taco progress
  .taco-progress {
    border: 1px solid var(--dark-orange) !important;
    background-color: var(--light-orange) !important;
    height: 1.25rem;

    // taco progress bar
    &__bar {
      background-color: var(--green) !important;
    }

  }

  //////////////////
  // Utility Comp //
  //////////////////

  .scroll-container {
    overflow: auto;
  }

  .scroll-x-container {
    overflow-y: hidden; 
    overflow-x: auto;
  }

  .scroll-y-container {
    overflow-y: auto; 
    overflow-x: hidden;
  }

  // views
  .standard-view {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  ////////////////////////
  // Animation Utilites //
  ////////////////////////

  .rotating-char {
    display: inline-block;
    animation: spin 8s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  ////////////////////////
  // Transition Classes //
  ////////////////////////
  
  // transition classes
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }  

  ///////////////////////////
  // Example Media Queries //
  ///////////////////////////

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

  import { onMounted, watch, computed } from 'vue';
  import { useTacoStore } from "./stores/taco.store";
  import { storeToRefs } from "pinia";
  import { useRoute } from 'vue-router'
  // CSS imports moved to main.js to avoid duplicate loading
  // Only solid style is used for icons, removed light/regular/duotone to reduce bundle size
  import astronautLoader from './assets/images/astonautLoader.webp'
  import { initializeBackgroundProcesses } from './services/backgroundProcesses'
  import type { UserType } from './services/backgroundProcessManager'

  ////////////
  // Stores //
  ////////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // app
  const { appLoading } = storeToRefs(tacoStore)
  const { toasts } = storeToRefs(tacoStore)

  // user
  const { userLoggedIn, userPrincipal } = storeToRefs(tacoStore)

  // # ACTIONS #

  // app
  const { addToast } = tacoStore
  const { removeToast } = tacoStore

  // user
  const { checkIfLoggedIn } = tacoStore

  // misc
  const { fetchCryptoPrices } = tacoStore
  
  /////////////////////
  // Local Variables //
  /////////////////////

  // route
  const route = useRoute()

  // images
  const astronautLoaderUrl = astronautLoader

  //////////////
  // Computed //
  //////////////

  // date based background color
  const appBackgroundColor = computed(() => {

    // // get today's date
    // const today = new Date()

    // // get the month
    // const month = today.getMonth() + 1 // getMonth() returns 0-11

    // // get the day
    // const day = today.getDate()

    // // halloween: October 31st
    // if (month === 10 && day === 31) {
    //   return '#'
    // }    
    
    // // christmas: December 25th
    // if (month === 12 && day === 25) {
    //   return '#'
    // }

    // // new years: January 1st
    // if (month === 1 && day === 1) {
    //   return '#'
    // }    

    // // valentines day: February 14th
    // if (month === 2 && day === 14) {
    //   return '#'
    // }

    // // st. patrick's day: March 17th
    // if (month === 3 && day === 17) {
    //   return '#'
    // }
    
    // // easter: April 9th
    // if (month === 4 && day === 9) {
    //   return '#'
    // }
    
    // // independence day: July 4th
    // if (month === 7 && day === 4) {
    //   return '#'
    // }
    
    // default brown
    return 'var(--light-orange-to-dark-brown)'

  })

  ///////////////////
  // Local Methods //
  ///////////////////

  // Admin principals list
  const ADMIN_PRINCIPALS = [
    'odoge-dr36c-i3lls-orjen-eapnp-now2f-dj63m-3bdcd-nztox-5gvzy-sqe',
    'cspwf-4aaaa-aaaan-qz5ia-cai',
    'tisou-7aaaa-aaaai-atiea-cai',
    'tgqd4-eqaaa-aaaai-atifa-cai',
    'tptia-syaaa-aaaai-atieq-cai',
    'tbrfi-jiaaa-aaaai-atifq-cai',
    'jlycp-kqaaa-aaaan-qz4xa-cai',
    'lrekt-uaaaa-aaaan-qz4ya-cai',
    'l7gh3-pqaaa-aaaan-qz4za-cai',
    'b6ygs-xaaaa-aaaan-qz5ca-cai',
    'bzzag-2yaaa-aaaan-qz5cq-cai',
    'bq2l2-mqaaa-aaaan-qz5da-cai',
    'cjkka-gyaaa-aaaan-qz5kq-cai',
    'cajb4-qqaaa-aaaan-qz5la-cai',
    'vxqw7-iqaaa-aaaan-qzziq-cai',
    'vzs3x-taaaa-aaaan-qzzjq-cai',
    'v6t5d-6yaaa-aaaan-qzzja-cai',
    'th44n-iyaaa-aaaan-qzz5a-cai',
    'jmze3-hiaaa-aaaan-qz4xq-cai',
    'bl7x7-wiaaa-aaaan-qz5bq-cai',
    'bm6rl-3qaaa-aaaan-qz5ba-cai',
    'c4n3n-hqaaa-aaaan-qz5ja-cai',
    'cvoqr-ryaaa-aaaan-qz5iq-cai',
    'dkgdg-saaaa-aaaan-qz5ma-cai',
    'dnhfs-7yaaa-aaaan-qz5mq-cai',
    'uuyso-zydjd-tsb4o-lgpgj-dfsvq-awald-j2zfp-e6h72-d2je3-whmjr-xae',
    '6mxg4-njnu6-qzizq-2ekit-rnagc-4d42s-qyayx-jghoe-nd72w-elbsy-xqe',
    'yjdlk-jqx52-ha6xa-w6iqe-b4jrr-s5ova-mirv4-crlfi-xgsaa-ib3cg-3ae',
    'chxs6-z6h3t-hjrgk-i5x57-rm7fm-3tvlz-b352m-heq2g-hu23b-sxasf-kqe',
    '6q3ra-pds56-nqzzc-itigw-tsw4r-vs235-yqx5u-dg34n-nnsus-kkpqf-aqe',
    'd7zib-qo5mr-qzmpb-dtyof-l7yiu-pu52k-wk7ng-cbm3n-ffmys-crbkz-nae',
    'as6jn-gaoo7-k4kji-tdkxg-jlsrk-avxkc-zu76j-vz7hj-di3su-2f74z-qqe',
    'r27hb-ckxon-xohqv-afcvx-yhemm-xoggl-37dg6-sfyt3-n6jer-ditge-6qe',
    '5uvsz-em754-ulbgb-vxihq-wqyzd-brdgs-snzlu-mhlqw-k74uu-4l5h3-2qe',
    'k2xol-5avzc-lf3wt-vwoft-pjx6k-77fjh-7pera-6b7qt-fwt5e-a3ekl-vqe',
    'hxjcv-hbraf-oathz-repfu-x7szv-j6p2f-2cu6n-fywhf-yxago-plyz5-5ae',
    '4ggui-2celt-yxv2h-z6zyh-sq5ok-rycog-tjyfl-gzxsj-kiq3y-c4sm4-lqe',
    'hzeez-ilt5k-pzrtz-hdcg3-pwjq5-564tv-uu46m-esqun-chj7o-uptsv-aae',
    'nfzo4-i26mj-e2tuj-bt3ba-cuco4-vcqxx-ybjw7-gzyzh-kvyp7-wjeyp-hqe'
  ]

  // Check if user is an admin
  const isUserAdmin = (principal: string): boolean => {
    return ADMIN_PRINCIPALS.includes(principal)
  }

  // Initialize background processes based on user type
  const initBackgroundProcesses = async () => {
    const t3 = performance.now()
    console.log('🔍 Step 3: Inside initBackgroundProcesses function', `(${t3.toFixed(2)}ms)`)

    // Start with guest type immediately, then upgrade if logged in
    const t4 = performance.now()
    console.log('🔍 Step 4: About to call checkIfLoggedIn', `(${t4.toFixed(2)}ms)`)

    // Fire off checkIfLoggedIn in background, don't wait for it
    checkIfLoggedIn().then(() => {
      const t5 = performance.now()
      console.log('🔍 Step 5: checkIfLoggedIn completed', `(${t5.toFixed(2)}ms, took ${(t5 - t4).toFixed(2)}ms)`)

      // Determine user type after login check completes
      let userType: UserType = 'guest'

      if (userLoggedIn.value) {
        // Check if user principal is in admin list
        const isAdmin = isUserAdmin(userPrincipal.value)
        userType = isAdmin ? 'admin' : 'member'
        console.log(`👤 User principal: ${userPrincipal.value}`)
        console.log(`🔑 Is admin: ${isAdmin}`)
      }

      const t6 = performance.now()
      console.log('🔍 Step 6: User type determined:', userType, `(${t6.toFixed(2)}ms)`)
      console.log('🔍 Step 7: About to call initializeBackgroundProcesses', `(${t6.toFixed(2)}ms)`)

      // Start background processes for determined user type
      initializeBackgroundProcesses(userType).catch(error => {
        console.error('Error initializing background processes:', error)
      })

      const t8 = performance.now()
      console.log('🔍 Step 8: initializeBackgroundProcesses called', `(${t8.toFixed(2)}ms, took ${(t8 - t6).toFixed(2)}ms)`)
    }).catch(error => {
      console.error('Error checking login status:', error)
      // Fallback to guest if login check fails
      initializeBackgroundProcesses('guest').catch(err => {
        console.error('Error initializing guest processes:', err)
      })
    })

    const t9 = performance.now()
    console.log('🔍 Step 9: Exiting initBackgroundProcesses (async operations continuing)', `(${t9.toFixed(2)}ms, total ${(t9 - t3).toFixed(2)}ms)`)
  }

  // mounted logic (for non-homepage routes)
  const mountedLogic = async () => {

    // log
    // // console.log('running app mounted logic')

    // check if user is logged in (this will trigger name loading if logged in)
    //console.log('🚀 Running app initialization - checking login status...');
    await checkIfLoggedIn()

    // fetch crypto prices
    fetchCryptoPrices()

  }

  // update robots meta
  const updateRobotsMeta = (robotsContent: string) => {
    let tag = document.querySelector('meta[name="robots"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'robots')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', robotsContent)
  }

  //////////////
  // Wathcers //
  //////////////

  // watch for changes to the route
  watch(
    () => route.meta.robots,
    (robots) => {
      updateRobotsMeta((robots as string) || 'index')
    },
    { immediate: true }
  )  

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // onMounted
  onMounted(async () => {
    const appMountStart = performance.now()
    console.log('🚀 [APP] onMounted START', `(${appMountStart.toFixed(2)}ms)`)

    // Schedule a check to see when the browser is actually free to render
    requestAnimationFrame(() => {
      const firstFrame = performance.now();
      console.log('🖼️ [RENDER] First animation frame (browser is free to render)', `(${firstFrame.toFixed(2)}ms, ${(firstFrame - appMountStart).toFixed(2)}ms after mount)`);
    });

    // log
    // // console.log('app mounted')

    // friendly log
    console.log(
      "👨‍🍳 Welcome to %cTaco Dao",
      "color: yellow;",
      "\n❤️ Together, We Perfect The Recipe!\n🌮 v1.0.6"
    );

    // Check if logged in BEFORE initializing background processes
    const checkLoginStart = performance.now()
    console.log('🔍 [APP] Checking login status...', `(${checkLoginStart.toFixed(2)}ms)`)
    await checkIfLoggedIn()
    const checkLoginEnd = performance.now()
    console.log('✅ [APP] Login check complete', `(${checkLoginEnd.toFixed(2)}ms, took ${(checkLoginEnd - checkLoginStart).toFixed(2)}ms)`)

    // Fetch crypto prices (can run in parallel with other init)
    const cryptoPriceStart = performance.now()
    console.log('💰 [APP] Fetching crypto prices...', `(${cryptoPriceStart.toFixed(2)}ms)`)
    fetchCryptoPrices().then(() => {
      const cryptoPriceEnd = performance.now()
      console.log('✅ [APP] Crypto prices fetched', `(${cryptoPriceEnd.toFixed(2)}ms, took ${(cryptoPriceEnd - cryptoPriceStart).toFixed(2)}ms)`)
    }).catch(error => {
      console.error('❌ [APP] Crypto price fetch error:', error)
    })

    // Initialize background processes with detailed logging
    const perfStart = performance.now()
    console.log('🔍 [APP] About to call initBackgroundProcesses', `(${perfStart.toFixed(2)}ms)`)
    initBackgroundProcesses().catch(error => {
      console.error('❌ [APP] Background process initialization error:', error)
    })
    const perfAfterCall = performance.now()
    console.log('🔍 [APP] initBackgroundProcesses called (non-blocking)', `(${perfAfterCall.toFixed(2)}ms, took ${(perfAfterCall - perfStart).toFixed(2)}ms)`)

    // For non-homepage routes, also run the traditional mounted logic
    if (route.path !== '/') {
      const mountedLogicStart = performance.now()
      console.log('🔍 [APP] Running mountedLogic for non-homepage route...', `(${mountedLogicStart.toFixed(2)}ms)`)
      mountedLogic()
      const mountedLogicEnd = performance.now()
      console.log('✅ [APP] mountedLogic complete', `(${mountedLogicEnd.toFixed(2)}ms, took ${(mountedLogicEnd - mountedLogicStart).toFixed(2)}ms)`)
    }

    const appMountEnd = performance.now()
    console.log('🏁 [APP] onMounted COMPLETE', `(${appMountEnd.toFixed(2)}ms, total took ${(appMountEnd - appMountStart).toFixed(2)}ms)`)

  })

</script>