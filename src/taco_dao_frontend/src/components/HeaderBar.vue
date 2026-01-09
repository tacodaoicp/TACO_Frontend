<template>

  <div class="header-bar">

    <!-- header bar left -->
    <div class="header-bar__left">

      <!-- escape hatch -->
      <router-link to="/" class="header-bar__escape-hatch">

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

        <!-- chat - router link -->
        <router-link to="/chat/oc" 
                    class="header-bar__rl">
          
          <span class="header-bar__rl-span">Chat</span>
        
        </router-link>    
        
        <!-- forum - router link -->
        <router-link to="/chat/forum" 
                    class="header-bar__rl">
          
          <span class="header-bar__rl-span">Forum</span>
        
        </router-link>            
        
        <!-- reports - router link -->
        <router-link to="/reports" 
                    class="header-bar__rl"
                    :class="{ 'router-link-active': $route.path.startsWith('/reports/') }">
          
          <span class="header-bar__rl-span">Reports</span>
        
        </router-link>
        
         <!-- sales - router link -->
        <router-link to="/sales" class="header-bar__rl">
          
          <span class="header-bar__rl-span">Sales</span>
        
        </router-link>

        <!-- info - router link -->
        <router-link to="/info" class="header-bar__rl">
          
          <span class="header-bar__rl-span">Info</span>
        
        </router-link>        
        
        <!-- code - router link -->
        <a href="https://github.com/tacodaoicp/" target="_blank" class="d-inline-flex" style="gap: 0.25rem; padding: 0 0.75rem;">
          
          <span class="header-bar__rl-span">Code</span>
        
        </a>        
        
        <!-- wallet - router link -->
        <router-link to="/wallet" class="header-bar__rl">
          
          <span class="header-bar__rl-span">Wallet</span>
        
        </router-link>  

        <!-- wizard - router link -->
        <a v-if="localNeuronsCount < 1" href="#" @click="toggleTacoWizard()" class="header-bar__rl">
          
          <span class="header-bar__rl-span">🧙Taco Wizard</span>
        
        </a>          

      </div>

      <!-- environment indicator -->
      <!-- <EnvironmentIndicator /> -->

      <!-- pages menu button -->
      <button class="btn pages-menu__btn"
              @click="togglePagesMenu()">

        <!-- pages icon -->
        <i class="fa fal fa-bars"></i>

      </button>

    </div>

    <!-- header bar right -->
    <div class="header-bar__right">

      <!-- token chips, entity value chip -->
      <div class="header-bar__chips" 
            style="user-select: text;">

        <!-- icp value -->
        <IcpValueChip />

        <!-- taco value -->
        <TacoTokenPriceChip />

        <!-- entity value -->
        <TacoEntityValueChip />

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
              <i class="fa-regular fa-copy taco-text-black-to-white"></i>
            </span>
            
          </span>

          <!-- account menu button -->
          <button v-if="userLoggedIn"
                  id="accountMenuBtn"
                  class="btn account-menu__btn taco-text-black-to-white"
                  style="padding: 0.25rem 0.5rem;"
                  @click="toggleAccountMenu()">

            <!-- user icon -->
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

        <!-- wizard - router link -->
        <a v-if="localNeuronsCount < 1"
           class="list-group-item"
           href="#"
           @click.prevent="toggleTacoWizard(), togglePagesMenu()">
          
          <!-- item text -->
          <span>🧙Taco Wizard</span>
        </a>          

        <!-- home - router link -->
        <router-link @click="togglePagesMenu()" to="/" class="list-group-item">

          <!-- item text -->
          <span>Home</span>

        </router-link>

        <!-- dao - router link -->
        <router-link @click="togglePagesMenu()" to="/dao" class="list-group-item">

          <!-- item text -->
          <span>DAO</span>

        </router-link>

        <!-- vote - router link -->
        <router-link @click="togglePagesMenu()" to="/vote" class="list-group-item">

          <!-- item text -->
          <span>Vote</span>

        </router-link>

        <!-- chat - router link -->
        <router-link @click="togglePagesMenu()" to="/chat/oc" 
                    class="list-group-item">

          <!-- item text -->
          <span>Chat</span>

        </router-link>

        <!-- forum - router link -->
        <router-link @click="togglePagesMenu()" to="/chat/forum" 
                    class="list-group-item">

          <!-- item text -->
          <span>Forum</span>

        </router-link>        

        <!-- reports - router link -->
        <router-link @click="togglePagesMenu()" to="/reports" 
                    class="list-group-item"
                    :class="{ 'router-link-active': $route.path.startsWith('/reports/') }">

          <!-- item text -->
          <span>Reports</span>

        </router-link>         
        
        <!-- sales - router link -->
        <router-link @click="togglePagesMenu()" to="/sales" class="list-group-item">

          <!-- item text -->
          <span>Sales</span>

        </router-link>

        <!-- info - router link -->
        <router-link @click="togglePagesMenu()" to="/info" class="list-group-item">

          <!-- item text -->
          <span>Info</span>

        </router-link>          
        
        <!-- code - anchor -->
        <a class="list-group-item"
           href="https://github.com/tacodaoicp/"
           target="_blank">

          <!-- item text -->
          <span>Code</span>

        </a>       
        
        <!-- wallet - router link -->
        <router-link @click="togglePagesMenu()" to="/wallet" class="list-group-item">

          <!-- item text -->
          <span>Wallet</span>

        </router-link>                   

      </div>

    </div>

    <!-- account menu content-->
    <div v-if="accountMenuIsVisible"
         id="accountMenu" 
         class="account-menu"
         v-click-away="closeAccountMenu">

      <!-- list group -->
      <div class="list-group">

        <!-- wallet - router link -->
        <router-link to="/wallet" class="list-group-item">

          <!-- item icon-->
          <i class="fa-solid fa-wallet"></i>

          <!-- item text -->
          <span>Wallet</span>

        </router-link>            

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

  <!-- wizard modal -->
  <WizardModal v-if="tacoWizardOpen"/>

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
      z-index: 9999; // below loading curtain

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
        text-decoration: none;

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

    // chips
    &__chips {
      display: flex;
      flex-wrap: no-wrap;
      align-items: center;
      gap: 1rem;
    }

  }

  ///////////////////
  // media queries //
  ///////////////////
  
  // custom 400px breakpoint
  @media (max-width: 400px) {

    // hide escape hatch
    .header-bar__escape-hatch {
      display: none !important;
    }

  }

  // custom breakpoint
  @media (max-width: 490px) {

    // 
    .header-bar__chips {
      gap: 0.5rem !important;
      align-items: flex-end;;
    }    

    // 
    .header-bar__chips * {
      // display: none !important;
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

    // reduce gap
    .header-bar__left {
      gap: 0;
    }

    // reduce escape hatch logo margin
    .escape-hatch-logo {
      margin-right: 0.25rem !important;
    }

    // reduce header bar gap
    .header-bar {
      gap: 0.5rem;
    }

    // reduce right gap
    .header-bar__right {
      gap: 0.75rem;
    }

    // 
    .header-bar__chips {
      gap: 0.75rem;
    }

    // 
    .header-bar__chips * {
      font-size: 0.675rem !important;
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

  import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import TacoDaoLogo from "../assets/images/tacoDaoLogo.vue"
  import IcpValueChip from "../components/misc/IcpValueChip.vue"
  import TacoTokenPriceChip from "../components/misc/TacoTokenPriceChip.vue"
  import TacoEntityValueChip from "../components/misc/TacoEntityValueChip.vue"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import DarkModeToggle from "./theme/DarkModeToggle.vue"
  import { Tooltip } from 'bootstrap'
  // import EnvironmentIndicator from './misc/EnvironmentIndicator.vue'
  import WizardModal from "../views/WizardView.vue"

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
  const { toggleTacoWizard } = tacoStore // not reactive

  // state
  const { userLoggedIn } = storeToRefs(tacoStore) // reactive
  const { userPrincipal } = storeToRefs(tacoStore) // reactive
  const { truncatedPrincipal } = storeToRefs(tacoStore); // reactive
  const { tacoWizardOpen } = storeToRefs(tacoStore); // reactive

  /////////////////////
  // Local Variables //
  /////////////////////

  // account menu visiblility
  const accountMenuIsVisible = ref(false)

  // pages menu visiblility
  const pagesMenuIsVisible = ref(false)

  // neurons count
  const localNeuronsCount = ref(0)

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
  const copyUserPrincipalToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(userPrincipal.value)
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea')
        textarea.value = userPrincipal.value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      addToast({
        id: Date.now(),
        code: 'code',
        tradeAmount: '',
        tokenSellIdentifier: '',
        tradeLimit: '',
        tokenInitIdentifier: '',
        title: '👨‍🍳 Principal Copied!',
        icon: '',
        message: `Account principal was copied to your clipboard`
      })
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = userPrincipal.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      addToast({
        id: Date.now(),
        code: 'code',
        tradeAmount: '',
        tokenSellIdentifier: '',
        tradeLimit: '',
        tokenInitIdentifier: '',
        title: '👨‍🍳 Principal Copied!',
        icon: '',
        message: `Account principal was copied to your clipboard`
      })
    }
  }

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // on mounted
  onMounted(() => {
    // init bootstrap tooltips (non-blocking)
    new Tooltip(document.body, {
      selector: "[data-bs-toggle='tooltip']",
    })

    // Fetch neurons count in background if user is already logged in
    if (userLoggedIn.value) {
      tacoStore.getTacoNeurons().then(rawNeurons => {
        localNeuronsCount.value = rawNeurons.length
      })
    }
  })

  // Watch for login state changes to fetch neurons
  watch(userLoggedIn, (loggedIn) => {
    if (loggedIn) {
      tacoStore.getTacoNeurons().then(rawNeurons => {
        localNeuronsCount.value = rawNeurons.length
      })
    } else {
      localNeuronsCount.value = 0
    }
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