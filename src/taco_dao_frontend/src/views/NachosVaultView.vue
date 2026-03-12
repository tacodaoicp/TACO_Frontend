<template>

  <div class="standard-view">

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- vault page -->
          <div class="nachos-vault-view">

            <!-- title container -->
            <div class="d-flex align-items-center">

              <!-- vault title -->
              <TacoTitle level="h2" emoji="🧀" title="NACHOS Vault" class="mt-4" />

            </div>

            <!-- taco container -->
            <div class="taco-container
                        taco-container--l1
                        d-flex flex-column gap-0 w-100 p-0 flex-grow-1 overflow-hidden position-relative">

              <!-- refresh button -->
              <button v-if="tacoStore.userLoggedIn"
                      class="nachos-vault-view__refresh-btn"
                      :disabled="refreshing"
                      @click="handleRefresh">
                <i class="fa-solid" :class="refreshing ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'"></i>
              </button>

              <!-- logged out content -->
              <div v-if="!tacoStore.userLoggedIn"
                   class="nachos-vault-view__logged-out-content">

                <!-- vault icon -->
                <i class="fa-solid fa-vault"></i>

              </div>

              <!-- logged out curtain -->
              <div v-if="!tacoStore.userLoggedIn" class="login-curtain">

                <!-- login button -->
                <button class="btn iid-login" @click="tacoStore.iidLogIn()">

                  <!-- dfinity logo -->
                  <DfinityLogo />

                  <!-- login text -->
                  <span class="taco-text-white">Login to view</span>

                </button>

              </div>

              <!-- logged in content -->
              <div v-if="tacoStore.userLoggedIn"
                   class="nachos-vault-view__logged-in-content">

                <!-- system status banner -->
                <VaultStatusBanner />

                <!-- dashboard -->
                <VaultDashboard />

                <!-- nav chart -->
                <NAVChart />

                <!-- mint section -->
                <VaultMint @operation-complete="onOperationComplete" />

                <!-- burn section -->
                <VaultBurn @operation-complete="onOperationComplete" />

                <!-- operations tracker -->
                <VaultOperations />

                <!-- analytics -->
                <VaultAnalytics />

              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">

// nachos vault view
.nachos-vault-view {
  display: flex;
  flex-direction: column;
  color: var(--black-to-white);

  // logged out banner
  &__logged-out-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 300px;

    // vault icon
    i {
      font-size: 8rem;
      color: var(--dark-orange-to-dark-brown);
      transform: rotate(-10deg);
    }

  }

  // logged in content
  &__logged-in-content {
    padding: 0rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  // refresh button — fixed so it stays visible while scrolling
  &__refresh-btn {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 1040;
    background: var(--orange-to-dark-brown);
    border: 1px solid var(--dark-orange-to-dark-brown);
    color: var(--black-to-white);
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.85rem;
    transition: opacity 0.2s;

    &:hover { opacity: 0.8; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

}

// login curtain
.login-curtain {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--curtain-bg);
  padding: 0 3rem;
  border-radius: 0.5rem;
  z-index: 1000;

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

    &:active {
      border-color: transparent;
    }

  }

}

</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import TacoTitle from '../components/misc/TacoTitle.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'
import { useNachosStore } from '../stores/nachos.store'
import { getEffectiveNetwork } from '../config/network-config'

// sub-components
import VaultStatusBanner from '../components/nachos/VaultStatusBanner.vue'
import VaultDashboard from '../components/nachos/VaultDashboard.vue'
import NAVChart from '../components/nachos/NAVChart.vue'
import VaultMint from '../components/nachos/VaultMint.vue'
import VaultBurn from '../components/nachos/VaultBurn.vue'
import VaultOperations from '../components/nachos/VaultOperations.vue'
import VaultAnalytics from '../components/nachos/VaultAnalytics.vue'

////////////
// stores //
////////////

const router = useRouter()
const tacoStore = useTacoStore()
const nachosStore = useNachosStore()
const { appLoadingOn, appLoadingOff } = tacoStore

///////////////////
// local methods //
///////////////////

// refresh after any mint/burn operation
const onOperationComplete = async () => {
  await Promise.all([
    nachosStore.loadDashboard(),
    nachosStore.loadUserActivity(),
    nachosStore.loadNAVHistory(),
  ])
}

// ============ 30s auto-refresh ============

let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

const startAutoRefresh = () => {
  stopAutoRefresh()
  autoRefreshInterval = setInterval(async () => {
    try {
      await Promise.all([
        nachosStore.loadDashboard(),
        nachosStore.loadUserActivity(),
        nachosStore.loadNAVHistory(),
      ])
    } catch (_e) { /* silent */ }
  }, 30_000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

// manual refresh
const refreshing = ref(false)

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      nachosStore.loadDashboard(),
      nachosStore.loadUserActivity(),
      nachosStore.loadNAVHistory(),
      nachosStore.loadConfig(),
    ])
  } finally {
    refreshing.value = false
  }
}

/////////////////////
// lifecycle hooks //
/////////////////////

// on mounted — production guard + data loading
onMounted(async () => {
  // redirect to home on production
  if (getEffectiveNetwork() === 'ic') {
    router.replace('/')
    return
  }

  try {
    appLoadingOn()
    await tacoStore.checkIfLoggedIn()
    if (tacoStore.userLoggedIn) {
      await nachosStore.initialize()
      startAutoRefresh()
    }
  } catch (error) {
    console.error('Error in vault onMounted:', error)
  } finally {
    appLoadingOff()
  }
})

// re-load on login state change
watch(() => tacoStore.userLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await nachosStore.initialize()
    startAutoRefresh()
  } else {
    stopAutoRefresh()
    nachosStore.stopPolling()
  }
})

// cleanup polling + auto-refresh on unmount
onBeforeUnmount(() => {
  stopAutoRefresh()
  nachosStore.cleanup()
})

</script>
