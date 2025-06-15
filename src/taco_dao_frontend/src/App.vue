<template>

  <div class="app">

    <!-- app loading curtain -->
    <div v-if="appLoading" class="app__loading-curtain">

      <!-- astronaut -->
      <img :src="astronautLoaderUrl" class="loading-img">

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
    // light orange to dark brown
    background-color: var(--light-orange-to-dark-brown);
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
    z-index: 99999; // above everything

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
    background-color: var(--white-to-light-orange);
  }

  .toast-header {
    background-color: var(--success-green-hover);
    color: var(--white);
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

  //////////////////////////
  // Animated Backgrounds //
  //////////////////////////

  // animated background container
  .floating-tacos {
    display: none; // remove to show
    position: absolute;
    top: 0%;
    left: 0%;
    width: 100%;
    height: 100%;
    list-style: none;

    li {
      position: absolute;
      width: fit-content;
      height: fit-content;
      opacity: 1;
      bottom: -3rem;
      font-size: 2rem;
      transform-origin: 50% 70%;
      user-select: none;
      animation-timing-function: linear;
      animation-iteration-count: infinite;

      &:nth-child(1) {
        left: 10%;
        animation-delay: 4s;
        animation-duration: 15s;
        animation-name: turnTacosClockwise;
      }

      &:nth-child(2) {
        left: 20%;
        animation-delay: 7s;
        animation-duration: 15s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(3) {
        left: 28%;
        animation-delay: 6s;
        animation-duration: 12s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(4) {
        left: 35%;
        animation-delay: 10s;
        animation-duration: 10s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(5) {
        left: 43%;
        animation-delay: 1s;
        animation-duration: 12s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(6) {
        left: 50%;
        animation-delay: 3s;
        animation-duration: 8s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(7) {
        left: 60%;
        animation-delay: 6s;
        animation-duration: 13s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(8) {
        left: 70%;
        animation-delay: 4s;
        animation-duration: 20s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(9) {
        left: 77%;
        animation-delay: 8s;
        animation-duration: 16s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(10) {
        left: 85%;
        animation-delay: 6s;
        animation-duration: 19s;
        animation-name: turnTacosCounterClockwise;
      }
    }

  }

  @keyframes turnTacosClockwise {
    0% {
      transform: translateY(0rem) rotate(0);
      opacity: 0.5;
    }
    100% {
      transform: translateY(-15rem) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes turnTacosCounterClockwise {
    0% {
      transform: translateY(0rem) rotate(0);
      opacity: 0.5;
    }
    100% {
      transform: translateY(-15rem) rotate(-360deg);
      opacity: 0;
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

<script setup>

  /////////////
  // Imports //
  /////////////

  import { onMounted } from 'vue';
  import { useTacoStore } from "./stores/taco.store";
  import { storeToRefs } from "pinia";
  import 'bootstrap/dist/css/bootstrap.css';
  import '@fortawesome/fontawesome-pro/css/fontawesome.css';
  import '@fortawesome/fontawesome-pro/css/light.css';
  import '@fortawesome/fontawesome-pro/css/regular.css';
  import '@fortawesome/fontawesome-pro/css/solid.css';
  import '@fortawesome/fontawesome-pro/css/duotone.css';
  import astronautLoader from './assets/images/astonautLoader.webp'

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
  const { userLoggedIn } = storeToRefs(tacoStore)

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

  // images
  const astronautLoaderUrl =  astronautLoader

  ///////////////////
  // Local Methods //
  ///////////////////  

  // mounted logic
  const mountedLogic = async () => {

    // log
    // // console.log('running app mounted logic')

    // fetch crypto prices
    fetchCryptoPrices()

  }

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // onMounted
  onMounted(async () => {

    // log
    // // console.log('app mounted')

    // friendly log
    // console.log('👨‍🍳 Weclome to \033[33mTaco Dao\033[0m!')
    console.log(
      "👨‍🍳 Welcome to %cTaco Dao",
      "color: yellow;",
      "\n❤️ Together, We Perfect The Recipe!\n🌮 v1.0.3"
    );

    // run mounted logic
    mountedLogic()

  })

</script>