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
            <div class="d-flex flex-column gap-0 w-100 p-0 flex-grow-1 overflow-hidden position-relative">

              <!-- refresh button -->
              <button v-if="tacoStore.userLoggedIn"
                      class="taco-refresh-btn"
                      :disabled="refreshing"
                      @click="handleRefresh">
                <i class="fa-solid" :class="refreshing ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'"></i>
              </button>

              <!-- public content (visible to all users) -->
              <div class="nachos-vault-view__public-content">
                <VaultStatusBanner />
                <VaultDashboard />
              </div>

              <!-- main action area: mint/burn + chart side by side -->
              <div id="vault-actions" class="nachos-vault-view__action-row">

                <!-- left column: mint + burn (or login prompt) -->
                <div class="nachos-vault-view__action-col">
                  <template v-if="showAsLoggedIn">
                    <VaultMint @operation-complete="onOperationComplete" />
                    <VaultBurn @operation-complete="onOperationComplete" />
                  </template>
                  <div v-else-if="!tacoStore.tourBypassAuth" class="nachos-vault-view__login-prompt">
                    <i class="fa-solid fa-lock"></i>
                    <span>Mint & burn NACHOS</span>
                    <button class="btn iid-login" @click="tacoStore.iidLogIn()">
                      <DfinityLogo />
                      <span class="taco-text-white">Log in</span>
                    </button>
                  </div>
                </div>

                <!-- right column: NAV chart -->
                <div class="nachos-vault-view__chart-col">
                  <NAVChart />
                </div>

              </div>

              <!-- portfolio breakdown (public, below actions) -->
              <div class="nachos-vault-view__portfolio-section">
                <VaultPortfolioBreakdown />
              </div>

              <!-- operations (login required) -->
              <div v-if="tacoStore.userLoggedIn"
                   class="nachos-vault-view__logged-in-content">
                <VaultOperations />
              </div>

              <!-- analytics (public) -->
              <div class="nachos-vault-view__public-content">
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

  // public content (visible to all users)
  &__public-content {
    padding: 0rem 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // main action row: mint/burn (left) + chart (right)
  &__action-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem 1rem 0;
    align-items: start;

    @media (max-width: 767.98px) {
      grid-template-columns: 1fr;
    }
  }

  // left column: mint + burn stacked
  &__action-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // right column: fixed height, doesn't stretch with left column
  &__chart-col {
    display: flex;
    flex-direction: column;
    height: 500px;

    > * { flex: 1; min-height: 0; }
  }

  // portfolio breakdown section — spacing below action row
  &__portfolio-section {
    padding: 1.5rem 1rem 0;
  }

  // logged in content (operations section)
  &__logged-in-content {
    padding: 1.5rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  // login prompt for unauthenticated users in the action column
  &__login-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    font-family: 'Space Mono', monospace;

    > i {
      font-size: 1.5rem;
      opacity: 0.6;
    }

    > span {
      font-size: 0.9rem;
      opacity: 0.75;
    }

    .iid-login {
      display: inline-flex;
      align-items: center;
      gap: 0.325rem;
      margin-top: 0.5rem;

      svg { width: 1.375rem; }

      span {
        font-size: 0.9rem;
      }

      &:active { border-color: transparent; }
    }
  }

  // refresh button — now uses global .taco-refresh-btn from App.vue

}


</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import TacoTitle from '../components/misc/TacoTitle.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { useNachosStore } from '../stores/nachos.store'

// sub-components
import VaultStatusBanner from '../components/nachos/VaultStatusBanner.vue'
import VaultDashboard from '../components/nachos/VaultDashboard.vue'
import NAVChart from '../components/nachos/NAVChart.vue'
import VaultMint from '../components/nachos/VaultMint.vue'
import VaultBurn from '../components/nachos/VaultBurn.vue'
import VaultPortfolioBreakdown from '../components/nachos/VaultPortfolioBreakdown.vue'
import VaultOperations from '../components/nachos/VaultOperations.vue'
import VaultAnalytics from '../components/nachos/VaultAnalytics.vue'

////////////
// stores //
////////////

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()
const { appLoadingOn, appLoadingOff } = tacoStore
const showAsLoggedIn = computed(() => tacoStore.userLoggedIn || tacoStore.tourBypassAuth)

///////////////////
// local methods //
///////////////////

// refresh after any mint/burn operation
const onOperationComplete = async () => {
  await Promise.all([
    nachosStore.loadDashboard(),
    nachosStore.loadUserActivity(),
    nachosStore.loadNAVHistory(),
    nachosStore.loadConfig(),
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
        nachosStore.loadConfig(),
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

// on mounted — data loading
onMounted(async () => {
  try {
    // Worker handles dashboard/config/nav data - no loading animation needed
    // Data is already cached and reactive via worker subscriptions

    await tacoStore.checkIfLoggedIn()
    if (tacoStore.userLoggedIn) {
      await nachosStore.initialize()  // Loads user activity only
      startAutoRefresh()              // Starts 30s polling for active operations
    }
  } catch (error) {
    console.error('Error in vault onMounted:', error)
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
