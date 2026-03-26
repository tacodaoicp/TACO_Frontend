<template>

  <div class="app" 
      :class="{ 'overflow-hidden': appLoading }"
      :style="{ backgroundColor: appBackgroundColor }">

    <!-- app loading curtain -->
    <div v-if="appLoading" class="app__loading-curtain">

      <!-- astronaut -->
      <img :src="astronautLoaderUrl" class="loading-img">

    </div>

    <!-- Persistent HeaderBar - renders once and stays across all routes -->
    <HeaderBar />

    <!-- Main content area with persistent footer -->
    <div class="app__content">
      <!-- HomeView with KeepAlive - use v-show to keep in DOM and preserve iframe state -->
      <KeepAlive>
        <HomeView v-if="routerReady" v-show="route.path === '/'" />
      </KeepAlive>

      <!-- Router view for all other pages - only render after router is ready -->
      <router-view v-slot="{ Component }">
        <component v-if="routerReady && route.path !== '/'" :is="Component" />
      </router-view>

      <!-- Persistent FooterBar - renders once and stays across all routes -->
      <FooterBar />
    </div>

    <!-- grand tour overlay (lazy loaded) -->
    <GrandTour v-if="grandTourActive"
               :active="grandTourActive"
               @end="grandTourActive = false" />

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
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
    // box sizing border box
    box-sizing: border-box;
  }

  // app
  .app {

    // full dynamic window height
    height: 100dvh;

    // clipped overflow
    overflow: clip;

    // flex column so header + content fill viewport
    display: flex;
    flex-direction: column;

    // default text color black
    color: var(--black);

    // app content area - scrolls as one unit so footer is at bottom of content
    &__content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow-y: auto;

      // Views fill remaining space (pushes footer to bottom on short pages)
      > *:not(:last-child) {
        flex: 1 0 auto;
      }

      // Footer never shrinks
      > :last-child {
        flex-shrink: 0;
      }

      // Prevent double scrollbar: views flow naturally, app__content is the sole scroll container
      .standard-view {
        height: auto;
        min-height: 100%;
      }

      .scroll-y-container {
        overflow: visible;
        height: auto;
      }
    }

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
    width: 6px;
    height: 6px;
  }
  *::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }
  *::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
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

    // level 1, dark gradient card
    &--l1 {
      border-radius: 0.5rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
      border: 2px solid var(--card-border);
      box-shadow: var(--card-shadow);
    }

    // level 2, subtle dark inner panel
    &--l2 {
      position: relative;
      border-radius: 0.5rem;
      padding: 1rem 1.25rem 1rem;
      background-color: rgba(0, 0, 0, 0.15);
      border: 1px solid var(--table-row-border);

      // hover mod
      &--hover {

        // hover
        &:hover {
          background-color: rgba(0, 0, 0, 0.25);
        }

      }

      // dark mod
      &--dark {
        background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
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
      background: linear-gradient(135deg, #5E7A2E, #3D5A1A);
      color: var(--text-cream);
      border: 2px solid #7A8B3A;

      &:hover {
          background: linear-gradient(135deg, #6E8A38, #4A6A22);
          color: #fff;
      }

      &:focus {
        background: linear-gradient(135deg, #6E8A38, #4A6A22);
        outline: none;
        color: #fff;
      }

      &:focus:focus-visible {
          background: linear-gradient(135deg, #6E8A38, #4A6A22);
          outline: 3px solid var(--light-brown-to-orange);
          outline-offset: 2px;
      }

      &:active, &:active:focus, &:active:focus-visible {
          background: linear-gradient(135deg, #6E8A38, #4A6A22);
          border-color: #7A8B3A;
          color: #fff;
      }

      &.disabled,
      &:disabled,
      &[disabled]{
        color: var(--dark-gray) !important;
        background: linear-gradient(135deg, #5E7A2E, #3D5A1A) !important;
        border-color: #7A8B3A !important;
        opacity: 0.5;
      }

    }
    &--success {
      background: linear-gradient(135deg, #2E7D32, #1B5E20) !important;
      color: var(--text-cream) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;

      &:hover {
        background: linear-gradient(135deg, #388E3C, #2E7D32) !important;
        color: #fff !important;
      }

      &:focus, &:focus:focus-visible {
        background: linear-gradient(135deg, #388E3C, #2E7D32) !important;
        outline: 3px solid rgba(46, 125, 50, 0.5);
        outline-offset: 2px;
        color: #fff !important;
      }

      &:active, &:active:focus, &:active:focus-visible {
        background: linear-gradient(135deg, #388E3C, #2E7D32) !important;
        color: #fff !important;
      }

      &:disabled,
      &[disabled],
      &.disabled {
        background: linear-gradient(135deg, #2E7D32, #1B5E20) !important;
        color: var(--light-gray) !important;
        opacity: 0.5;
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
    background-color: rgba(218, 141, 40, 0.12);
    border: 2px solid var(--card-border);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-family: 'Space Mono';
    height: fit-content;
    transition: all 0.2s ease;
    opacity: 0.7;

    &:hover {
      background-color: rgba(254, 214, 108, 0.15);
      border-color: var(--card-border);
      color: var(--white);
      opacity: 1;
    }

    &:focus {
      color: var(--white);
      background-color: rgba(254, 214, 108, 0.15);
      border-color: var(--card-border);
      outline: none;
      opacity: 1;
    }

    &:focus-visible {
      outline: 3px solid var(--card-border);
      outline-offset: 0px;
    }

    &:active, &:active:focus, &:active:focus-visible {
      background-color: rgba(254, 214, 108, 0.15);
      border-color: var(--card-border);
      color: var(--white);
      opacity: 1;
    }

    &--active {
      background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
      color: var(--gold) !important;
      border-color: var(--card-border) !important;
      font-weight: 700;
      box-shadow: 0 4px 16px rgba(60, 30, 0, 0.5);
      opacity: 1;

      &:hover {
        background: linear-gradient(135deg, var(--card-hover-from), var(--card-hover-to));
        border-color: var(--card-border);
        color: var(--gold);
      }

      &:focus {
        color: var(--gold);
        border-color: var(--card-border);
        background: linear-gradient(135deg, var(--card-hover-from), var(--card-hover-to));
        outline: none;
      }

      &:focus-visible {
        outline: 3px solid var(--card-border);
        outline-offset: 0px;
      }

      &:active, &:active:focus, &:active:focus-visible {
        background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
        border-color: var(--card-border);
        color: var(--gold);
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
      border: 2px solid var(--card-border);
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

  // taco table (matches /buy premium style)
  .taco-table {
    width: 100%;
    font-family: 'Space Mono', monospace;
    border-collapse: separate;
    border-spacing: 0;
    border: 2px solid var(--card-border);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &--min-width {
      width: min-content;
    }

    thead {
      background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));

      th {
        padding: 1rem 1.25rem;
        font-family: 'Rubik';
        font-weight: 700;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--white);
        border-bottom: none;
        background-color: transparent;
        white-space: nowrap;
        vertical-align: middle;
      }
    }

    tbody {
      background-color: rgba(0, 0, 0, 0.15);

      tr {
        transition: background-color 0.15s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.25);
        }

        &:not(:last-child) td {
          border-bottom: 1px solid var(--table-row-border);
        }
      }

      td {
        padding: 1rem 1.25rem;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.85);
        background-color: transparent;
        white-space: nowrap;
        vertical-align: middle;
        border-bottom: none;
      }
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

  // taco title
  .taco-title {
    font-family: 'Rubik', sans-serif;
    font-weight: 700;
    color: var(--gold);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    margin: 0;
  }

  // taco refresh button (floating, bottom-right)
  .taco-refresh-btn {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 1040;
    background: var(--orange-to-dark-brown);
    border: 1px solid var(--dark-orange-to-dark-brown);
    color: var(--black-to-white);
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.95rem;
    transition: opacity 0.2s, background-color 0.2s, transform 0.15s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:hover {
      opacity: 0.9;
      background: var(--dark-orange-to-dark-brown);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    i {
      font-size: 0.95rem;
    }

    @media (max-width: 576px) {
      bottom: 1rem;
      right: 1rem;
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.85rem;

      i {
        font-size: 0.85rem;
      }
    }
  }

  // taco modal (unified dialog background)
  .taco-modal {
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to)) !important;
    border: 2px solid var(--card-border) !important;
    border-radius: 0.5rem;
    box-shadow: var(--card-shadow);
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

  // hide native number input spinners globally
  input[type="number"] {
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  // house-style select dropdowns
  select.taco-input,
  select.form-select,
  select.form-control {
    appearance: none;
    -webkit-appearance: none;
    font-family: 'Space Mono';
    cursor: pointer;
    // custom chevron arrow (dark-orange #DA8D28)
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23DA8D28' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 0.75rem;
    padding-right: 2.25rem;

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

<script setup>

  /////////////
  // Imports //
  /////////////

  import { onMounted, onUnmounted, watch, computed, defineAsyncComponent, ref } from 'vue';
  import { useTacoStore } from "./stores/taco.store";
  import { storeToRefs } from "pinia";
  import { useRoute, useRouter } from 'vue-router'

  // Lazy load HomeView to reduce initial bundle
  const HomeView = defineAsyncComponent(() => import('./views/HomeView.vue'))

  // Lazy load Grand Tour (only loaded when activated)
  const GrandTour = defineAsyncComponent(() => import('./components/tour/GrandTour.vue'))

  // HeaderBar and FooterBar are rendered once in App.vue and persist across all routes
  import HeaderBar from './components/HeaderBar.vue'
  import FooterBar from './components/FooterBar.vue'

  import 'bootstrap/dist/css/bootstrap.css';
  import '@fortawesome/fontawesome-pro/css/fontawesome.css';
  import '@fortawesome/fontawesome-pro/css/light.css';
  import '@fortawesome/fontawesome-pro/css/regular.css';
  import '@fortawesome/fontawesome-pro/css/solid.css';
  import '@fortawesome/fontawesome-pro/css/duotone.css';
  import astronautLoader from './assets/images/astonautLoader.webp'
  import { initWorkerBridge, setCurrentRoute, setNetwork } from './stores/worker-bridge'
  import { initNetworkConfig } from './config/network-config'

  ////////////
  // Stores //
  ////////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // app
  const { appLoading } = storeToRefs(tacoStore)
  const { toasts } = storeToRefs(tacoStore)
  const { grandTourActive } = storeToRefs(tacoStore)

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

  // worker subscriptions
  const { setupWorkerSubscriptions, cleanupWorkerSubscriptions } = tacoStore
  
  /////////////////////
  // Local Variables //
  /////////////////////

  // route
  const route = useRoute()
  const router = useRouter()

  // Track if router is ready (prevents flash when navigating directly to non-home routes)
  const routerReady = ref(false)
  router.isReady().then(() => {
    routerReady.value = true
  })

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
    
    // default dark gradient
    return 'var(--card-gradient-from)'

  })

  ///////////////////
  // Local Methods //
  ///////////////////  

  // mounted logic
  const mountedLogic = async () => {

    // log
    // // console.log('running app mounted logic')

    // Wait for router to resolve the URL before initializing workers
    // This ensures /admin gets admin data prioritized, not homepage data
    await router.isReady()

    // Initialize SharedWorkers with the current route for correct priority loading
    initWorkerBridge(route.path)

    // Initialize network config with worker bridge (allows runtime network switching)
    initNetworkConfig(setNetwork)

    // Setup store subscriptions to worker updates
    setupWorkerSubscriptions()

    // Start loading @dfinity shims in background (don't block UI)
    // Functions that need shims will await initializeShims() themselves
    tacoStore.initializeShims()

    // check if user is logged in (this will trigger name loading if logged in)
    // Note: checkIfLoggedIn internally calls initializeShims if needed
    // Non-blocking: UI will reactively update when userLoggedIn.value changes
    checkIfLoggedIn().catch(console.error)

    // fetch crypto prices (now triggers worker fetch)
    fetchCryptoPrices()

    // Preload chart compute worker during idle time (warm before Performance tab)
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000))
    idle(() => {
      import('./workers/chart-worker-port').then(m => m.getChartPort())

      // Preload commonly-used route components (in navigation, frequently accessed)
      import('./views/WalletView.vue')
      import('./views/NachosVaultView.vue')
      import('./views/BuyTacoView.vue')
    })

  }

  // update robots meta
  const updateRobotsMeta = (robotsContent) => {
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
      updateRobotsMeta(robots || 'index')
    },
    { immediate: true }
  )

  // watch for route changes to update worker priorities
  watch(
    () => route.path,
    (newPath) => {
      setCurrentRoute(newPath)
    }
  )  

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // onMounted
  onMounted(async () => {

    // log
    // // console.log('app mounted')

    // friendly log
    console.log(
      "👨‍🍳 Welcome to %cTaco Dao",
      "color: yellow;",
      "\n❤️ Together, We Perfect The Recipe!\n🌮 v1.0.6"
    );

    // run mounted logic
    mountedLogic()

  })

  // onUnmounted - cleanup worker subscriptions
  onUnmounted(() => {
    cleanupWorkerSubscriptions()
  })

</script>