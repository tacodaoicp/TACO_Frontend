<template>

  <div class="app" 
      :class="{ 'overflow-hidden': appLoading }"
      :style="{ backgroundColor: showPageFx ? 'transparent' : appBackgroundColor }">

    <!-- decorative page background behind every page except home;
         it paints the base colour itself, so the app background above goes transparent -->
    <DrawerFx v-if="showPageFx" page :active="true" :base="appBackgroundColor" />

    <!-- app loading curtain -->
    <div v-if="appLoading" class="app__loading-curtain">

      <!-- astronaut -->
      <img :src="astronautLoaderUrl" class="loading-img">

    </div>

    <!-- Route-transition progress bar (shows while a lazy route chunk resolves) -->
    <div v-if="routePending" class="app__route-progress" role="progressbar" aria-label="Loading page"></div>

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

    <!-- bottom bar (phones and touch tablets), in flow below the content.
         hidden during the grand tour: its dialog covers the bottom edge and its backdrop blocks taps -->
    <BottomNav v-if="!grandTourActive" />

    <!-- grand tour overlay (lazy loaded) -->
    <GrandTour v-if="grandTourActive"
               :active="grandTourActive"
               @end="grandTourActive = false" />

    <!-- toast container (max-width keeps the 350px toast inside narrow phones, minus the m-3 margins) -->
    <TransitionGroup name="fade" tag="div" class="toast-container position-fixed end-0 m-3" style="bottom: var(--bottom-nav-h, 0px); max-width: calc(100% - 2rem)">
    
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

<!-- styles moved to style/taco.scss -->

<script setup>

  /////////////
  // Imports //
  /////////////

  import { onMounted, onUnmounted, watch, computed, defineAsyncComponent, ref } from 'vue';
  import { useTacoStore } from "./stores/taco.store";
  import { storeToRefs } from "pinia";
  import { useRoute, useRouter, START_LOCATION } from 'vue-router'
  import { CHART_ROUTES, loadApexcharts, warmRoute, warmWizard } from './components/navItems'

  // Lazy load HomeView to reduce initial bundle
  const HomeView = defineAsyncComponent(() => import('./views/HomeView.vue'))

  // Lazy load Grand Tour (only loaded when activated)
  const GrandTour = defineAsyncComponent(() => import('./components/tour/GrandTour.vue'))

  // HeaderBar and FooterBar are rendered once in App.vue and persist across all routes
  import HeaderBar from './components/HeaderBar.vue'
  import FooterBar from './components/FooterBar.vue'
  import BottomNav from './components/BottomNav.vue'
  import DrawerFx from './components/DrawerFx.vue'
  import { fx } from './components/fxState'

  // bootstrap & font-awesome CSS moved to main.js (loads before taco.scss for correct cascade)
  import astronautLoader from './assets/images/astonautLoader.webp'
  import { initWorkerBridge, setCurrentRoute, setNetwork } from './stores/worker-bridge'
  import { initNetworkConfig, registerNetworkChangeCallback } from './config/network-config'

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

  const showPageFx = computed(() => fx.value.page && route.path !== '/')

  // browser bar and phone status bar in the page colour (Chrome on Android reads theme-color)
  const syncThemeColor = () => {
    const colour = getComputedStyle(document.documentElement).getPropertyValue('--card-gradient-from').trim()
    if (!colour) return
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = colour
  }
  const { darkModeToggled } = storeToRefs(tacoStore)
  watch(darkModeToggled, () => requestAnimationFrame(syncThemeColor))
  const router = useRouter()

  // Track if router is ready (prevents flash when navigating directly to non-home routes)
  const routerReady = ref(false)
  router.isReady().then(() => {
    routerReady.value = true
  })

  // Route-transition progress. Lazy route chunks fetch+parse on first visit with
  // no built-in feedback, so a click to e.g. /performance can feel dead until the
  // chunk mounts. Show a thin top bar while a navigation is resolving — debounced
  // ~120ms so instant/cached navigations don't flicker.
  const routePending = ref(false)
  let routePendingTimer = null
  const clearRoutePending = () => {
    if (routePendingTimer) { clearTimeout(routePendingTimer); routePendingTimer = null }
    routePending.value = false
  }
  // a chart page opened from another page loads apexcharts together with its own code, so its first
  // chart never shows collapsed while the library loads (main.js registers <apexchart> as a lazy component)
  let chartLib = null
  router.beforeEach((to, from) => {
    if (to.path !== from.path) {
      if (routePendingTimer) clearTimeout(routePendingTimer)
      routePendingTimer = setTimeout(() => { routePending.value = true }, 120)
    }
    chartLib = from !== START_LOCATION && CHART_ROUTES.includes(to.path) ? loadApexcharts() : null
    return true
  })
  router.beforeResolve(async () => { await chartLib })
  router.afterEach(clearRoutePending)
  router.onError(clearRoutePending)

  // the Grand Tour opens its pages (and offers the wizard at the end) with no tap to warm them on;
  // they are warmed once the tour itself has loaded (a tour that fails to load recovers as before)
  watch(grandTourActive, (active) => {
    if (!active) return
    Promise.all([import('./components/tour/GrandTour.vue'), import('./components/tour/tourScript')])
      .then(([, { tourScript }]) => {
        for (const scene of tourScript) warmRoute(router, scene.route)
        warmWizard()
      })
      .catch(() => {})
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

    // A redirect can resolve to the start path '/', which the route watcher
    // does not see as a change; make sure the worker has the resolved route
    syncWorkerRoute(route.path)

    // Worker bridge, network config, subscriptions, identity, and crypto prices
    // run synchronously after router.isReady() — deferring them races against
    // login restoration (sendIdentityToWorker / setUserPrincipal silently no-op
    // if mainWorker is still null), and against any onMounted in deep routes
    // (/performance, /admin, /wallet) that immediately calls workerBridge.fetch.

    // Initialize SharedWorkers with the current route for correct priority loading
    initWorkerBridge(route.path)

    // Initialize network config with worker bridge (allows runtime network switching)
    initNetworkConfig(setNetwork)

    // Clear actor caches when network changes via tacoConfig
    registerNetworkChangeCallback(() => tacoStore.clearActorCaches())

    // Setup store subscriptions to worker updates
    setupWorkerSubscriptions()

    // Check if user is logged in (calls initializeShims internally if needed);
    // UI reactively updates when userLoggedIn changes.
    checkIfLoggedIn().catch(console.error)

    // Fetch crypto prices (triggers worker fetch)
    fetchCryptoPrices()

    // Only `initializeShims()` is safe to defer — it's a parallel preload of
    // IDL factories that everything else awaits internally on first use.
    const idleShims = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
    idleShims(() => { tacoStore.initializeShims() })

    // Deeper idle: download the pages people open next without running them (a first visit, a tap while
    // offline or in a tab that outlived a deploy then reads them from the HTTP cache). Only a chart page
    // runs apexcharts now, so its chart does not collapse and reflow while the 574 KB lib loads; other
    // pages get it with the first chart page (router guard above). The wizard runs so it opens at once.
    const idleDeep = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000))
    idleDeep(() => {
      prefetchPages()
      if (CHART_ROUTES.includes(route.path)) loadApexcharts()
      warmWizard()
    })

  }

  // the files build/page-prefetch.js lists in index.html: the pages a tab used to load and run at startup
  const prefetchPages = async () => {
    let lists = null
    try { lists = JSON.parse(document.getElementById('taco-prefetch')?.textContent || 'null') } catch { /* no list */ }
    if (!lists) return
    const files = [...lists.pages]
    if (userLoggedIn.value) {
      files.push(...lists.login)
      // admin pages for admins, or for a browser that opened them before
      let admin = false
      try { admin = localStorage.getItem('hasVisitedAdmin') === 'true' } catch { /* storage blocked */ }
      if (!admin) {
        try { admin = (await import('./composables/useAdminCheck')).ADMIN_PRINCIPALS.includes(tacoStore.userPrincipal) } catch { /* offline */ }
      }
      if (admin) files.push(...lists.admin)
    }
    const fetched = new Set(performance.getEntriesByType('resource').map((e) => e.name))
    for (const file of files) {
      const href = `${location.origin}/${file}`
      if (fetched.has(href)) continue
      const link = document.createElement('link')
      link.rel = 'prefetch'
      // same request mode as the later load (module scripts use CORS); a full URL so Vite's loader
      // still adds its own modulepreload links as before
      if (file.endsWith('.js')) { link.as = 'script'; link.crossOrigin = '' } else link.as = 'style'
      link.href = href
      link.onload = link.onerror = () => link.remove()
      document.head.appendChild(link)
    }
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

  // canonical URL per page on tacodao.com (set here, not in index.html: one fixed tag made search engines treat
  // every page as a copy of the home page). The exchange router sets its own canonical.
  watch(
    () => route.path,
    (path) => {
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', `https://tacodao.com${path}`)
    },
    { immediate: true }
  )

  // watch for changes to the route
  watch(
    () => route.meta.robots,
    (robots) => {
      updateRobotsMeta(robots || 'index')
    },
    { immediate: true }
  )

  // watch for route changes to update worker priorities. Immediate so the
  // landing route also produces a SET_ROUTE — the dedicated-worker fallback
  // relies on it as redundancy for its initial load.
  // The immediate run happens before the first navigation resolves, while
  // route.path is still the router's start location '/'. That used to start
  // the worker on the home page's data even on a reload of /vault, so until
  // the router is ready the path comes from the address bar instead.
  let workerRoute = null
  const syncWorkerRoute = (path) => {
    if (path === workerRoute) return
    workerRoute = path
    setCurrentRoute(path)
  }
  watch(
    () => route.path,
    (newPath) => {
      syncWorkerRoute(routerReady.value ? newPath : window.location.pathname)
    },
    { immediate: true }
  )

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // onMounted
  onMounted(async () => {

    // the theme sets its colour variables on mount, so read them a frame later
    requestAnimationFrame(syncThemeColor)

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

<style scoped>
/* Thin top route-transition progress bar — indeterminate sweep while a lazy
   route chunk resolves, so clicking to a new page never feels dead. */
.app__route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 2000;
  background: linear-gradient(90deg, transparent, var(--taco-accent, #ffb347), transparent);
  background-size: 40% 100%;
  background-repeat: no-repeat;
  animation: app-route-progress 1s ease-in-out infinite;
  pointer-events: none;
}
@keyframes app-route-progress {
  0%   { background-position: -40% 0; }
  100% { background-position: 140% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .app__route-progress { animation-duration: 2.4s; }
}
</style>