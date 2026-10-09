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

            <!-- title container — ps-3 aligns with the 1rem horizontal padding on
                 .nachos-vault-view__public-content so the title sits over the cards. -->
            <div class="d-flex align-items-center ps-3">

              <!-- vault title -->
              <TacoTitle level="h2" :iconSrc="nachoLogo" title="Nacho Vault" class="mt-4" />

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
                  <!-- sign in check still running and this device had a session:
                       placeholders, not a log in prompt that the signed in user
                       would see first (without a session the prompt shows at once) -->
                  <template v-else-if="!tacoStore.loginChecked && tacoStore.sessionLikely">
                    <div class="nachos-vault-view__action-skeleton taco-container taco-container--l1" aria-label="Loading"></div>
                    <div class="nachos-vault-view__action-skeleton nachos-vault-view__action-skeleton--short taco-container taco-container--l1"></div>
                  </template>
                  <div v-else-if="!tacoStore.tourBypassAuth" class="nachos-vault-view__login-prompt">
                    <i class="fa-solid fa-lock"></i>
                    <span>Mint & burn NACHO</span>
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

  // placeholders in the action column while the sign in check runs: empty
  // cards (taco-container--l1, so they read in both themes). The opacity pulse
  // runs on the compositor; a moving gradient would repaint on the main thread
  // every frame while the page is still booting.
  &__action-skeleton {
    height: 16rem;
    animation: nachos-vault-view-pulse 1.4s ease-in-out infinite;

    &--short { height: 10rem; }
  }

  // stands in for the NAV chart (an empty card) while its chunk
  // (lightweight-charts) loads
  &__chart-placeholder {
    flex: 1;
    min-height: 300px;
    animation: nachos-vault-view-pulse 1.4s ease-in-out infinite;
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

@keyframes nachos-vault-view-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}


</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import TacoTitle from '../components/misc/TacoTitle.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'
import nachoLogo from '../assets/tokens/nacho.png'
import { ref, computed, defineAsyncComponent, h, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { useNachosStore } from '../stores/nachos.store'

// sub-components — eager. All of them render cached data as soon as the page
// mounts; as separate chunks they each showed up a round trip later.
import VaultStatusBanner from '../components/nachos/VaultStatusBanner.vue'
import VaultDashboard from '../components/nachos/VaultDashboard.vue'
import VaultMint from '../components/nachos/VaultMint.vue'
import VaultBurn from '../components/nachos/VaultBurn.vue'
import VaultPortfolioBreakdown from '../components/nachos/VaultPortfolioBreakdown.vue'
import VaultOperations from '../components/nachos/VaultOperations.vue'
import VaultAnalytics from '../components/nachos/VaultAnalytics.vue'

// lazy: the chart library (lightweight-charts) is the one heavy part. A pulsing
// placeholder holds its column until the chunk is in.
const NAVChart = defineAsyncComponent({
  loader: () => import('../components/nachos/NAVChart.vue'),
  loadingComponent: () => h('div', { class: 'nachos-vault-view__chart-placeholder taco-container taco-container--l1', 'aria-label': 'Loading NAV history' }),
  delay: 0,
})

////////////
// stores //
////////////

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()
const showAsLoggedIn = computed(() => tacoStore.userLoggedIn || tacoStore.tourBypassAuth)

///////////////////
// local methods //
///////////////////

// Public data refreshes through the data worker (and its cache); the user's
// own activity is queried directly. All in parallel.
const refreshAll = () => Promise.all([
  nachosStore.loadDashboard(),
  nachosStore.loadUserActivity({ fresh: true }),
  nachosStore.loadNAVHistory(),
  nachosStore.loadConfig(),
  nachosStore.loadAnalytics(),
])

// refresh after any mint/burn operation
const onOperationComplete = async () => {
  await refreshAll()
}

// ============ user-activity-only auto-refresh ============
// The worker already polls dashboard / config / navHistory at appropriate
// staleness; only userActivity is auth-only and not in the worker.

let userActivityInterval: ReturnType<typeof setInterval> | null = null

const startUserActivityRefresh = () => {
  stopUserActivityRefresh()
  userActivityInterval = setInterval(() => {
    nachosStore.loadUserActivity().catch(() => { /* silent */ })
  }, 30_000)
}

const stopUserActivityRefresh = () => {
  if (userActivityInterval) {
    clearInterval(userActivityInterval)
    userActivityInterval = null
  }
}

// manual refresh — user-initiated, fine to fire everything
const refreshing = ref(false)

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await refreshAll()
  } finally {
    refreshing.value = false
  }
}

// the signed-in user's own data: last known activity first (seeded by the
// store from its per-account cache), then a refresh every 30 s
const startUserData = () => {
  nachosStore.initialize()  // fire-and-forget; userActivity arrives reactively
  startUserActivityRefresh()
}

/////////////////////
// lifecycle hooks //
/////////////////////

// on mounted — don't block the public render on the auth check.
// Worker subscriptions already feed dashboard/config/navHistory/analytics reactively.
onMounted(() => {
  if (tacoStore.userLoggedIn) startUserData()
  // App.vue runs the same check on load; while one is in flight it is shared.
  // A sign in it finds is picked up by the watcher below.
  tacoStore.checkIfLoggedIn().catch((error) => {
    console.error('Error in vault onMounted:', error)
  })
})

// re-load on login state change
watch(() => tacoStore.userLoggedIn, (loggedIn) => {
  if (loggedIn) {
    startUserData()
  } else {
    stopUserActivityRefresh()
    nachosStore.stopPolling()
  }
})

// cleanup on unmount
onBeforeUnmount(() => {
  stopUserActivityRefresh()
  nachosStore.cleanup()
})

</script>
