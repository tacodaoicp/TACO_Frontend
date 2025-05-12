<template>

  <div class="header-bar">

    <!-- header bar left -->
    <div class="header-bar__left">

      <!-- escape hatch -->
      <router-link to="/">

        <!-- taco dao logo -->
        <TacoDaoLogo class="escape-hatch-logo"/>

      </router-link>

      <!-- page links -->
      <div class="header-bar__page-links">

        <!-- home - router link -->
        <router-link to="/" class="header-bar__rl">
                      
          <span class="header-bar__rl-span">Home</span>
        
        </router-link>

        <!-- dao - router link -->
        <router-link to="/dao" class="header-bar__rl">
                      
          <span class="header-bar__rl-span">DAO</span>
        
        </router-link>

        <!-- vote - router link -->
        <router-link to="/vote" class="header-bar__rl">
                      
          <span class="header-bar__rl-span">Vote</span>
        
        </router-link>

        <!-- sales - router link -->
        <router-link to="/sales" class="header-bar__rl">
                      
          <span class="header-bar__rl-span">Sales</span>
        
        </router-link>

        <!-- info - router link -->
        <router-link to="/info" class="header-bar__rl"><span class="header-bar__rl-span">Info</span></router-link>

        <!-- docs - router link -->
        <a href="https://github.com/tacodaoicp/" target="_blank" class="d-inline-flex" style="gap: 0.25rem; padding: 0 0.75rem;">
          
          <span class="header-bar__rl-span">Docs</span>
        
        </a>

      </div>

      <!-- pages menu button -->
      <button class="btn pages-menu__btn"
              @click="togglePagesMenu()">

        <!-- pages icon -->
        <i class="fa fal fa-bars"></i>

      </button>

    </div>

    <!-- header bar right -->
    <div class="header-bar__right">

      <!-- pre-sns disclaimer -->
      <div class="header-bar__pre-sns-disclaimer">

        <span class="badge bg-danger"
              title="We're conducting our SNS launch right now! Once it is complete, TACO holders will be able to stake and hotkey their TACO, enabling voting and DAO trading"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              data-bs-custom-class="taco-tooltip">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span class="ms-1 d-none d-md-inline">PRE-SNS</span>
        </span>

      </div>

      <!-- icp price, taco dao holdings, and wallet container -->
      <div class="header-bar__chips d-flex flex-nowrap align-items-center gap-3" 
            style="user-select: text;">

        <!-- icp value -->
        <IcpValueChip />

        <!-- taco value -->
        <TacoTokenPriceChip />

        <!-- portfolio value -->
        <TacoPortfolioValueChip />

      </div>

      <!-- user id, account menu, login btn, and theme toggle -->
      <div class="d-flex align-items-center gap-2">

        <!-- user id and account menu button -->
        <div class="d-flex align-items-center gap-1">

          <!-- user id -->
          <span v-if="userLoggedIn"
            class="taco-text-black-to-white small text-nowrap"
            :title="userPrincipal"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            data-bs-custom-class="taco-tooltip">&hellip;{{ truncatedPrincipal }}

            <span @click="copyUserPrincipalToClipboard()"
                  style="cursor: pointer;">
              <i class="fa-regular fa-copy"></i>
            </span>
            
          </span>

          <!-- account menu button -->
          <button v-if="userLoggedIn" 
                  id="accountMenuBtn"
                  class="btn account-menu__btn taco-text-black-to-white"
                  style="padding: 0.25rem 0.5rem;"
                  @click="toggleAccountMenu()">

            <!-- wallet icon -->
            <i class="fa-lg fa fa-user"></i>
            
          </button>

        </div>

        <!-- login button -->
        <button v-if="!userLoggedIn" 
                class="btn iid-login"
                @click="iidLogIn()">

          <!-- dfinity logo -->
          <DfinityLogo />

          <!-- login text -->
          <span class="taco-text-black-to-white">Login</span>

        </button>

        <!-- dark mode toggle component -->
        <DarkModeToggle />        

      </div>

    </div>

    <!-- pages menu content -->
    <div v-if="pagesMenuIsVisible"
         id="pagesMenu" 
         class="pages-menu"
         v-click-away="closePagesMenu">

      <!-- list group -->
      <div class="list-group">

        <!-- home - router link -->
        <router-link to="/" class="list-group-item">

          <!-- item text -->
          <span>Home</span>

        </router-link>

        <!-- dao - router link -->
        <router-link to="/dao" class="list-group-item">

          <!-- item text -->
          <span>DAO</span>

        </router-link>

        <!-- vote - router link -->
        <router-link to="/vote" class="list-group-item">

          <!-- item text -->
          <span>Vote</span>

        </router-link>    

        <!-- sales - router link -->
        <router-link to="/sales" class="list-group-item">

          <!-- item text -->
          <span>Sales</span>

        </router-link>

        <!-- info - router link -->
        <router-link to="/info" class="list-group-item">

          <!-- item text -->
          <span>Info</span>

        </router-link>

        <!-- docs - anchor -->
        <a class="list-group-item"
           href="https://github.com/tacodaoicp/"
           target="_blank">

          <!-- item text -->
          <span>Docs</span>

        </a>

      </div>

    </div>

    <!-- account menu content-->
    <div v-if="accountMenuIsVisible"
         id="accountMenu" 
         class="account-menu"
         v-click-away="closeAccountMenu">

      <!-- list group -->
      <div class="list-group">

        <!-- list group item -->
        <a class="list-group-item"
           href="#"
           @click.prevent="iidLogOut(), closeAccountMenu()">
          
          <!-- item icon-->
          <i class="fa-solid fa-right-from-bracket"></i>

          <!-- item text -->
          <span>Logout</span>

        </a>
      
      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  .header-bar {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    gap: 1.5rem;
    user-select: none;

    // focus and focus visible styles
    *:focus:focus-visible {
      outline: 3px solid var(--dark-orange);
      outline-offset: 2px;
      box-shadow: none;
      border-radius: 0.125rem;
    }      

    // header bar left
    &__left {
      display: flex;
      height: 100%;
      align-items: center;
      gap: 0.75rem;
    }

    // header bar right
    &__right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    // escape hatch
    .escape-hatch-logo {
      width: 3rem;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      margin-right: 1rem;

      // smooth transition lettering fill color
      path {
        transition: fill .25s;
      }

    }

    // page links
    &__page-links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      font-family: "Space Mono";
    }

    // header bar links
    a {
      display: flex;
      height: 100%;
      align-items: center;
      text-decoration: none;
      color: var(--brown);
    }

    // active router links
    .router-link-active {
      text-decoration: underline;
      text-decoration-thickness: 0.2rem;
    }

    // router link
    .header-bar__rl {
      padding: 0 0.75rem;
      display: inline-flex;
      color: var(--brown-to-white);
    }

    // router link span
    .header-bar__rl-span {
      color: var(--brown-to-white);
    }

    // login
    .iid-login {
      display: inline-flex;
      align-items: center;
      gap: 0.325rem;

      svg {
        width: 1.375rem;
      }

      span {
        font-size: 1rem;
        font-family: 'Space Mono', monospace;
      }

      &:hover {
        background-color: rgba(0,0,0,0.05);
      }

      &:active {
        border-color: transparent;
      }
    }

    // account and pages menus
    .account-menu, .pages-menu {
      position: absolute;
      top: calc( 100% - 0.5rem );
      border: 1px solid var(--dark-orange);
      background-color: var(--orange);
      border-radius: 0.5rem;
      box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.16);
      -webkit-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.16);
      -moz-box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.16);
      z-index: 99998; // below loading curtain

      // account menu button
      &__btn {
        anchor-name: --account-menu-btn-anchor;

        // user icon
        i {
          color: var(--brown-to-orange);
        }

        // hover
        &:hover {
          background-color: rgba(0,0,0,0.05);
        }

        &:active {
          border-color: transparent;
        }

      }

      // list group
      .list-group {
        padding: 0.5rem 0;
      }

      // list group item
      .list-group-item {
        display: flex;
        align-items: center;
        padding: 1rem 2rem;
        border: none;
        background-color: transparent;
        gap: 1rem;

        &:hover {
          background-color: rgba(0,0,0,0.04);
        }
      }

    }

    // account menu
    .account-menu {
      right: 1rem;
    }

    // pages menu
    .pages-menu {
      left: 1rem;

      &__btn {
        display: none;

        i {
          font-size: 1.5rem;
        }

      }
    }

  }

  ///////////////////
  // media queries //
  ///////////////////
  
  // super small
  @media (max-width: 440px) {

    // hide inline page links
    .header-bar__wallet-link {
      display: none !important;
    }

  }

  // phone protrait
  @media (max-width: 575.98px) {

    // hide inline page links
    .header-bar__page-links {
      display: none;
    }

    // show pages menu button
    .pages-menu__btn {
      display: block !important;
    }

    // 
    .header-bar__left {
      gap: 0;
    }

    // 
    .escape-hatch-logo {
      margin-right: 0.25rem !important;
    }

    // 
    .header-bar__chips {
      display: none !important;
    }

  }

  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
    
    // hide inline page links
    .header-bar__page-links {
      display: none;
    }

    // show pages menu button
    .pages-menu__btn {
      display: block !important;
    }

    // 
    .header-bar__left {
      gap: 0;
    } 
    
    // 
    .escape-hatch-logo {
      margin-right: 0.25rem !important;
    }

  }  

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
    
    // hide inline page links
    .header-bar__page-links {
      display: none;
    }

    // show pages menu button
    .pages-menu__btn {
      display: block !important;
    }

    // 
    .header-bar__left {
      gap: 0;
    } 
    
    // 
    .escape-hatch-logo {
      margin-right: 0.25rem !important;
    }    

  }

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import TacoDaoLogo from "../assets/images/tacoDaoLogo.vue"
  import IcpValueChip from "../components/misc/IcpValueChip.vue"
  import TacoTokenPriceChip from "../components/misc/TacoTokenPriceChip.vue"
  import TacoPortfolioValueChip from "../components/misc/TacoPortfolioValueChip.vue"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import DarkModeToggle from "./theme/DarkModeToggle.vue"
  import { Tooltip } from 'bootstrap'

  ////////////
  // Stores //
  ////////////

  // taco store
  const tacoStore = useTacoStore()

  // actions
  const { iidLogIn } = tacoStore // not reactive
  const { iidLogOut } = tacoStore // not reactive
  const { addToast } = tacoStore // not reactive
  const { checkIfLoggedIn } = tacoStore // not reactive

  // state and getters
  const { userLoggedIn } = storeToRefs(tacoStore) // reactive
  const { userPrincipal } = storeToRefs(tacoStore) // reactive
  const { truncatedPrincipal } = storeToRefs(tacoStore); // reactive

  /////////////////////
  // Local Variables //
  /////////////////////

  // account menu visiblility
  const accountMenuIsVisible = ref(false)

  // pages menu visiblility
  const pagesMenuIsVisible = ref(false)

  ///////////////////
  // Local Methods //
  ///////////////////  

  // toggle account menu
  const toggleAccountMenu = () => {
    accountMenuIsVisible.value = !accountMenuIsVisible.value
  }

  // toggle pages menu
  const togglePagesMenu = () => {
    pagesMenuIsVisible.value = !pagesMenuIsVisible.value
  }  

  // close account menu
  const closeAccountMenu = () => {
    accountMenuIsVisible.value = false
  }

  // close pages menu
  const closePagesMenu = () => {
    pagesMenuIsVisible.value = false
  }  

  // on click, copy user principal to clipboard
  const copyUserPrincipalToClipboard = () => {
    navigator.clipboard.writeText(userPrincipal.value)
    // alert('Copied user principal to clipboard: ' + userPrincipal.value)
    addToast({
      id: Date.now(),
      code: 'code',
      tradeAmount: '',
      tokenSellIdentifier: '',
      tradeLimit: '',
      tokenInitIdentifier: '',
      title: '👨‍🍳 Principal Copied!',
      icon: '',
      message: `Your principal was copied to your clipboard`
    })
  }

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {

      // check if user is logged in
      await checkIfLoggedIn()

      // if user is logged in, fetch user state
      if (userLoggedIn.value) {

      }

    // init bootstrap tooltips
    new Tooltip(document.body, {
      selector: "[data-bs-toggle='tooltip']",
    })

  })

  onBeforeUnmount(() => {

    // dismiss tooltips specifically on this component
    const tooltipElements = document.querySelectorAll('.header-bar [data-bs-toggle="tooltip"]')
    tooltipElements.forEach(element => {
      const tooltip = Tooltip.getInstance(element)
      if (tooltip) {
        tooltip.hide() // explicitly hide before disposal
        tooltip.dispose()
      }
    })

  })  
    
  
</script>