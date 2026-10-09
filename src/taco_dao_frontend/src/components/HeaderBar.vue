<template>

  <div class="header-bar">

    <!-- header bar left -->
    <div class="header-bar__left">

      <!-- escape hatch -->
      <router-link to="/" class="header-bar__escape-hatch">

        <!-- taco dao logo -->
        <TacoDaoLogo class="escape-hatch-logo"/>

      </router-link>

      <!-- page links (one list, see navItems.ts) -->
      <div class="header-bar__page-links">

        <component v-for="item in visibleNavItems"
                   :key="item.label"
                   :is="item.to && !item.action ? RouterLink : 'a'"
                   v-bind="item.to && !item.action ? { to: item.to } : { href: item.href ?? item.to ?? '#' }"
                   class="header-bar__rl"
                   :class="{ 'header-bar__rl--active': isNavActive(item, route) }"
                   @click="onNavClick($event, item)">
          <span class="header-bar__rl-span">{{ item.label }}</span>
        </component>

      </div>

      <!-- environment indicator -->
      <!-- <EnvironmentIndicator /> -->

      <!-- menu button, opens the nav drawer -->
      <button class="btn pages-menu__btn"
              aria-controls="nav-drawer"
              :aria-expanded="navDrawerOpen"
              aria-label="Open menu"
              @click="openDrawer">

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

        <!-- taco value (with fair value badge + hover modal) -->
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
            class="header-bar__principal taco-text-black-to-white small text-nowrap"
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
                @click="iidLogIn('v2')">

          <!-- dfinity logo -->
          <DfinityLogo />

          <!-- login text -->
          <span class="taco-text-black-to-white">Login</span>

        </button>

        <!-- dark mode toggle component -->
        <DarkModeToggle />        

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

  <!-- nav drawer (phones and touch tablets), a native modal dialog so it sits above every z-index -->
  <dialog ref="drawerEl"
          id="nav-drawer"
          class="nav-drawer"
          aria-label="Menu"
          @close="closeDrawer"
          @click.self="closeDrawer">

    <!-- panel fills the dialog, so only backdrop clicks reach the dialog itself -->
    <div class="nav-drawer__panel">

      <!-- logo and close -->
      <div class="nav-drawer__top">

        <TacoDaoLogo class="nav-drawer__logo"/>

        <button type="button"
                class="btn nav-drawer__close"
                aria-label="Close menu"
                @click="closeDrawer">
          <i class="fa-solid fa-xmark"></i>
        </button>

      </div>

      <!-- prices and dao assets -->
      <div class="nav-drawer__stats">

        <div class="nav-drawer__stat">
          <span>ICP</span>
          <span class="nav-drawer__stat-value">{{ usd(icpPriceUsd, 2) }}</span>
        </div>

        <div class="nav-drawer__stat">
          <span>TACO</span>
          <span class="nav-drawer__stat-value"><span v-if="tacoPriceIcp > 0" class="nav-drawer__stat-sub">{{ Number(tacoPriceIcp).toFixed(3) }} ICP</span>{{ usd(tacoPriceUsd, 3) }}</span>
        </div>

        <!-- fair value, only when TACO trades below it (same rule as the header chip) -->
        <template v-if="showFair">
          <button type="button" class="nav-drawer__stat nav-drawer__stat--button"
                  :aria-expanded="fairInfoOpen" @click="fairInfoOpen = !fairInfoOpen">
            <span>Fair value <i class="fa-solid fa-circle-info nav-drawer__info-icon" aria-hidden="true"></i></span>
            <span class="nav-drawer__stat-value">{{ usd(tacoFairValueUsd, 3) }}</span>
          </button>
          <p v-if="fairInfoOpen" class="nav-drawer__fair-info">
            Fair value is the backing behind each TACO in circulation.
            The backing is every treasury asset except TACO (ICP, DKP, Solum, Simwin and NTN), worth {{ fairTreasury }}, plus the DAO's part of the NACHO vault portfolio.
            The treasury holds {{ fairNachoPct }} of all NACHO, so it counts for {{ fairNachoShare }} of the {{ fairPortfolio }} portfolio (TACO left out).
            Together that is {{ fairBacking }}.
            That is split over the TACO in circulation, which is the total supply minus the TACO the DAO holds (in the treasury, in its ICPSwap positions and its part of the vault's TACO): {{ fairSupply }} TACO.
            {{ fairBacking }} / {{ fairSupply }} = {{ usd(tacoFairValueUsd, 3) }} per TACO, and TACO trades {{ Math.abs(tacoBelowFairPct).toFixed(1) }}% below it.
          </p>
        </template>

        <div class="nav-drawer__stat">
          <span>DAO assets</span>
          <span class="nav-drawer__stat-value">{{ daoAssets }}</span>
        </div>

      </div>

      <!-- wallet (tap to copy) or login -->
      <div class="nav-drawer__account">

        <button v-if="userLoggedIn"
                type="button"
                class="nav-drawer__wallet"
                :title="userPrincipal"
                @click="copyFromDrawer">
          <i class="fa-solid fa-wallet" aria-hidden="true"></i>
          {{ userPrincipal.slice(0, 5) }}…{{ truncatedPrincipal }}
          <span aria-live="polite">{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>

        <button v-else
                type="button"
                class="btn taco-btn taco-btn--green"
                @click="loginFromDrawer">Login</button>

      </div>

      <!-- every page not in the bottom bar -->
      <nav class="nav-drawer__links" aria-label="More pages">

        <component v-for="item in drawerItems"
                   :key="item.label"
                   :is="item.to && !item.action ? RouterLink : 'a'"
                   v-bind="item.to && !item.action ? { to: item.to } : { href: item.href ?? item.to ?? '#' }"
                   class="nav-drawer__link"
                   :class="{ 'nav-drawer__link--active': isNavActive(item, route) }"
                   @click="onNavClick($event, item)">
          <i v-if="item.icon" :class="item.icon" aria-hidden="true"></i>
          <span>{{ item.label }}</span>
        </component>

      </nav>

      <!-- decorative background (plus the style lab on staging) -->
      <DrawerFx :active="navDrawerOpen" />

    </div>

  </dialog>

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

    // active page link (see isNavActive in navItems.ts)
    .header-bar__rl--active {
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

    // router link with badge
    .header-bar__rl--with-badge {
      align-items: center;
      gap: 0.3rem;
    }

    // beta badge for nav links
    .header-bar__rl-beta {
      font-size: 0.5rem;
      padding: 0.1rem 0.3rem;
      background-color: var(--dark-orange-to-brown);
      color: var(--white-to-black);
      border-radius: 0.2rem;
      font-weight: 700;
      text-transform: uppercase;
      line-height: 1;
      vertical-align: super;
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
      border: 2px solid var(--card-border);
      background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
      border-radius: 0.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
        color: var(--text-cream);

        &:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }

        &.router-link-active,
        &.router-link-exact-active {
          color: var(--gold);
        }
      }

    }

    // account menu
    .account-menu {
      right: 1rem;
    }

    // pages menu button (opens the nav drawer)
    .pages-menu {

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

  ////////////////////////////////////////////////////////
  // nav drawer (native dialog, sibling of .header-bar) //
  ////////////////////////////////////////////////////////

  // never set display on the dialog, it would override the rule that hides it when closed
  .nav-drawer {
    inset: 0 auto 0 0;
    margin: 0;
    padding: 0;
    width: min(20rem, 85vw);
    height: auto;
    max-width: none;
    max-height: none;
    border: 0;
    border-right: 2px solid var(--card-border);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    color: var(--text-cream);

    &::backdrop {
      background: rgba(0, 0, 0, 0.55);
    }

    &[open] {
      animation: nav-drawer-in 0.2s ease-out;
    }

    // own focus ring, the .header-bar rule does not reach this sibling root
    *:focus-visible {
      outline: 3px solid var(--dark-orange);
      outline-offset: -3px;
      box-shadow: none;
    }

    // panel
    &__panel {
      position: relative;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 1rem;

      // content sits above the decorative background layer
      > :not(.drawer-fx) {
        position: relative;
        z-index: 1;
      }
    }

    // logo and close
    &__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.5rem 0 1.25rem;
    }

    &__logo {
      width: 3rem;
    }

    &__close {
      min-width: 44px;
      min-height: 44px;

      i {
        font-size: 1.25rem;
        color: var(--text-cream);
      }
    }

    // prices and dao assets
    &__stats {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0 1.25rem;
    }

    &__stat {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.875rem;
    }

    &__stat-value {
      font-family: 'Rubik';
      font-weight: 700;
      font-size: 1rem;
      white-space: nowrap;
    }

    &__stat-sub {
      margin-right: 0.5rem;
      font-family: 'Space Mono';
      font-weight: 400;
      font-size: 0.875rem;
      opacity: 0.75;
    }

    // the fair value row opens its explanation
    &__stat--button {
      width: 100%;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }

    &__info-icon {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    &__fair-info {
      margin: -0.25rem 0 0;
      font-size: 0.8125rem;
      line-height: 1.45;
      opacity: 0.85;
    }

    // wallet or login
    &__account {
      padding: 0 1.25rem;
    }

    &__wallet {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      min-height: 44px;
      padding: 0 1rem;
      border: 1px solid var(--card-border);
      border-radius: 0.5rem;
      background: none;
      color: var(--text-cream);
      font-family: 'Space Mono';
      font-size: 1rem;

      span {
        margin-left: auto;
        color: var(--gold);
        font-size: 0.875rem;
      }
    }

    // page links
    &__links {
      display: flex;
      flex-direction: column;
      padding-top: 0.5rem;
      border-top: 1px solid var(--table-row-border);
    }

    &__link {
      display: flex;
      align-items: center;
      min-height: 48px;
      padding: 0 1.25rem;
      gap: 0.875rem;
      font-size: 1rem;
      color: var(--text-cream);
      text-decoration: none;

      i {
        width: 1.25rem;
        text-align: center;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }

      &--active {
        color: var(--gold);
        box-shadow: inset 3px 0 0 var(--gold);
      }
    }

  }

  // slide in from the left
  @keyframes nav-drawer-in {
    from {
      transform: translateX(-100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-drawer[open] {
      animation: none;
    }
  }

  ///////////////////
  // media queries //
  ///////////////////

  // phones and touch tablets: logo and menu button left, account and theme right.
  // chips and principal are only hidden, they stay mounted to fetch the drawer prices
  @media (max-width: 991.98px), (pointer: coarse) {

    .header-bar {
      gap: 0.5rem;
      padding: 0 0.5rem;
    }

    .header-bar__left {
      gap: 0;
    }

    .header-bar__page-links,
    .header-bar__chips,
    .header-bar__principal {
      display: none;
    }

    .header-bar .pages-menu__btn {
      display: block;
    }

    .header-bar .escape-hatch-logo {
      margin-right: 0.25rem;
    }

  }

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { RouterLink, useRouter, useRoute } from 'vue-router'
  import { navItems, isNavActive, navDrawerOpen, openDrawer, closeDrawer, inBottomBar, type NavItem } from './navItems'
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import TacoDaoLogo from "../assets/images/tacoDaoLogo.vue"
  import DrawerFx from "./DrawerFx.vue"
  import IcpValueChip from "../components/misc/IcpValueChip.vue"
  import TacoTokenPriceChip from "../components/misc/TacoTokenPriceChip.vue"
  import TacoEntityValueChip from "../components/misc/TacoEntityValueChip.vue"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import DarkModeToggle from "./theme/DarkModeToggle.vue"
  import { Tooltip } from 'bootstrap'
  // import EnvironmentIndicator from './misc/EnvironmentIndicator.vue'
  import { getEffectiveNetwork } from '../config/network-config'
  import WizardModal from "../views/WizardView.vue"

  ////////////
  // Stores //
  ////////////

  // router
  const router = useRouter()
  const route = useRoute()

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
  const { icpPriceUsd, tacoPriceUsd, tacoPriceIcp, tacoFairValueUsd } = storeToRefs(tacoStore) // reactive
  const { tacoBackingValueUsd, tacoCirculatingSupply, tacoBelowFairPct } = storeToRefs(tacoStore) // reactive
  const { treasuryValueExTacoInUsd, totalPortfolioValueInUsd } = storeToRefs(tacoStore) // reactive
  const { portfolioValueExTacoInUsd, nachoOwnershipFraction, daoAssetsDisplayUsd } = storeToRefs(tacoStore) // reactive

  /////////////////////
  // Local Variables //
  /////////////////////

  // account menu visiblility
  const accountMenuIsVisible = ref(false)

  // neurons count
  const localNeuronsCount = ref(0)

  // nav drawer dialog element
  const drawerEl = ref<HTMLDialogElement | null>(null)

  // drawer wallet copy feedback
  const copied = ref(false)
  let copiedTimer: ReturnType<typeof setTimeout> | undefined

  //////////////
  // Computed //
  //////////////

  // header and drawer links, wizard only while the user has no neurons (count loads async)
  const visibleNavItems = computed(() => navItems.filter(i => i.action !== 'wizard' || localNeuronsCount.value < 1))

  // drawer: every page not in the bottom bar, wizard first
  const drawerItems = computed(() => {
    const rest = visibleNavItems.value.filter(i => !inBottomBar(i, userLoggedIn.value))
    return [...rest.filter(i => i.action === 'wizard'), ...rest.filter(i => i.action !== 'wizard')]
  })

  // fair value only when TACO trades below it (same rule as the header chip)
  const showFair = computed(() => tacoPriceUsd.value > 0 && tacoFairValueUsd.value > tacoPriceUsd.value)

  // fair value explanation figures
  const fairInfoOpen = ref(false)
  const compactNum = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
  // the note's total is the sum of the rounded parts it prints, so the sentence always adds up
  const fairBacking = computed(() => compactUsd.format(daoAssetsDisplayUsd.value))
  const fairTreasury = computed(() => compactUsd.format(treasuryValueExTacoInUsd.value))
  const fairPortfolio = computed(() => compactUsd.format(portfolioValueExTacoInUsd.value))
  const fairNachoShare = computed(() => compactUsd.format(portfolioValueExTacoInUsd.value * nachoOwnershipFraction.value))
  const fairNachoPct = computed(() => `${(nachoOwnershipFraction.value * 100).toFixed(1)}%`)
  const fairSupply = computed(() => compactNum.format(tacoCirculatingSupply.value))

  // dao assets total, compact (e.g. $1.2M)
  const compactUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' })
  // same total as the header value card: treasury without TACO plus the whole vault portfolio with its TACO,
  // summed from parts rounded to thousands (the treasury part is never 0, so wait for the portfolio)
  const daoAssets = computed(() => totalPortfolioValueInUsd.value > 0
    ? compactUsd.format(Math.round(treasuryValueExTacoInUsd.value / 1000) * 1000 + Math.round(totalPortfolioValueInUsd.value / 1000) * 1000)
    : '…')

  ///////////////////
  // Local Methods //
  ///////////////////  

  // toggle account menu
  const toggleAccountMenu = () => {
    accountMenuIsVisible.value = !accountMenuIsVisible.value
  }

  // close account menu
  const closeAccountMenu = () => {
    accountMenuIsVisible.value = false
  }

  // price for the drawer, ellipsis until loaded
  const usd = (v: number, d: number) => v > 0 ? '$' + v.toFixed(d) : '…'

  // header and drawer link click: close the drawer, run action items
  const onNavClick = (e: MouseEvent, item: NavItem) => {
    closeDrawer()
    if (!item.action) return
    e.preventDefault()
    if (item.action === 'wizard') toggleTacoWizard()
    else goToRoadmap()
  }

  // drawer wallet: copy the principal, confirm inline (toasts render under the dialog)
  const copyFromDrawer = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(userPrincipal.value)
      ok = true
    } catch {
      // body is inert under the modal, so the fallback textarea goes inside the dialog
      const textarea = document.createElement('textarea')
      textarea.value = userPrincipal.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      drawerEl.value?.appendChild(textarea)
      textarea.select()
      try { ok = document.execCommand('copy') } catch { ok = false }
      textarea.remove()
    }
    if (!ok) return
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 1500)
  }

  // drawer login: close first, or the dialog's top layer covers the loading curtain
  const loginFromDrawer = () => {
    closeDrawer()
    iidLogIn('v2')
  }

  // navigate to roadmap section on info page
  const goToRoadmap = () => {
    if (route.path === '/info') {
      // already on info - update hash and scroll directly
      router.replace('/info#roadmap')
      const appContent = document.querySelector('.app__content')
      const el = document.getElementById('roadmap')
      if (el && appContent) {
        const containerRect = appContent.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const offset = elRect.top - containerRect.top + appContent.scrollTop - 16
        appContent.scrollTo({ top: offset, behavior: 'smooth' })
      }
    } else {
      router.push('/info#roadmap')
    }
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

  // open and close the native dialog from the shared drawer state
  watch(navDrawerOpen, (open) => {
    const el = drawerEl.value
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  })

  // any navigation closes the drawer
  watch(() => route.fullPath, closeDrawer)

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