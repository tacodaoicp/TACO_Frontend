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

<!-- styles moved to style/taco.scss -->

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

  // bootstrap & font-awesome CSS moved to main.js (loads before taco.scss for correct cascade)
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