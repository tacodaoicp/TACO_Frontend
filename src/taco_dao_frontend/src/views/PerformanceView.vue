<template>
  <div class="standard-view">
    <!-- Floating Section Nav -->
    <div class="section-nav-floating" :class="{ 'section-nav-open': sectionNavOpen }">
      <button class="section-nav-toggle" @click="sectionNavOpen = !sectionNavOpen" title="Navigate sections">
        <i class="fas" :class="sectionNavOpen ? 'fa-times' : 'fa-bars'"></i>
      </button>
      <transition name="nav-fade">
        <div v-if="sectionNavOpen" class="section-nav-menu">
          <button class="section-nav-item" @click="scrollToSection('my-performance'); sectionNavOpen = false">
            <i class="fas fa-user me-2"></i>My Performance
          </button>
          <button class="section-nav-item" @click="scrollToSection('leaderboard'); sectionNavOpen = false">
            <i class="fas fa-trophy me-2"></i>Leaderboard
          </button>
          <button class="section-nav-item" @click="scrollToSection('follow-principal'); sectionNavOpen = false">
            <i class="fas fa-user-plus me-2"></i>Follow Principal
          </button>
          <button class="section-nav-item" @click="scrollToSection('my-following'); sectionNavOpen = false">
            <i class="fas fa-users me-2"></i>My Following
          </button>
          <button class="section-nav-item" @click="scrollToSection('display-name'); sectionNavOpen = false">
            <i class="fas fa-id-badge me-2"></i>Display Name
          </button>
        </div>
      </transition>
    </div>

    <!-- scroll container -->
    <div class="scroll-y-container h-100" ref="scrollContainer">
      <!-- bootstrap container -->
      <div class="container p-0">
        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- performance page -->
          <div class="performance-view">

            <!-- title container -->
            <div class="perf-title-bar d-flex align-items-center justify-content-between mx-3 mt-3 mb-4">
              <!-- performance title -->
              <h1 class="taco-title mb-0">
                <span class="taco-title__icon">🏆</span>
                <span class="taco-title__title">Performance</span>
                <span class="perf-beta-badge">BETA</span>
              </h1>

              <!-- refresh button -->
              <button
                class="btn taco-nav-btn taco-nav-btn--active"
                @click="refreshAllData"
                :disabled="isLoading">
                <span class="taco-text-black">
                  <i v-if="isLoading" class="fas fa-spinner fa-spin me-1"></i>
                  🔄 Refresh
                </span>
              </button>
            </div>

            <!-- Error State -->
            <div v-if="errorMessage" class="alert alert-danger mx-3" role="alert">
              <strong>Error:</strong> {{ errorMessage }}
            </div>

            <!-- MY PERFORMANCE SECTION (logged in users only) -->
            <div id="my-performance">
              <MyPerformance
                v-if="userLoggedIn"
                :userPerformance="userPerformance"
                :isLoading="isLoadingUserPerformance"
                :errorMessage="userPerformanceError"
                :principal="userPrincipal"
                :selectedPriceType="selectedPriceType"
                :selectedTimeframe="selectedTimeframe"
                @refresh="loadUserPerformance"
              />

              <!-- Login prompt for non-logged in users -->
              <div v-else class="mx-3 mb-4">
                <div class="taco-container taco-container--l1">
                  <div class="text-center py-4">
                    <h5 class="mb-3 taco-text-brown-to-white">View Your Performance</h5>
                    <p class="perf-muted mb-3">Log in to see your personal performance metrics and neuron details.</p>
                    <button class="btn iid-login" @click="iidLogIn">
                      <DfinityLogo />
                      <span class="taco-text-white ms-2">Login</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- LEADERBOARD SECTION -->
            <PerformanceLeaderboard id="leaderboard"
              :leaderboardEntries="leaderboardEntries"
              :followerInfos="followerInfos"
              :leaderboardInfo="leaderboardInfo"
              :isLoading="isLoadingLeaderboard"
              :selectedTimeframe="selectedTimeframe"
              :selectedPriceType="selectedPriceType"
              :userLoggedIn="userLoggedIn"
              :userFollows="userFollowPrincipals"
              @timeframe-change="onTimeframeChange"
              @price-type-change="onPriceTypeChange"
              @follow="onFollowUser"
              @unfollow="onUnfollowUser"
            />

            <!-- FOLLOW BY PRINCIPAL SECTION -->
            <div id="follow-principal" class="mx-3 mb-4" v-if="userLoggedIn">
              <div class="taco-container taco-container--l1">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <i class="fas fa-user-plus taco-text-brown-to-white"></i>
                  <h5 class="mb-0 taco-text-brown-to-white">Follow Principal</h5>
                </div>
                <p class="perf-muted small mb-3">Enter a principal ID to follow their allocation strategy.</p>
                <div class="d-flex gap-2">
                  <input
                    v-model="followPrincipalInput"
                    type="text"
                    class="taco-input flex-grow-1"
                    placeholder="Enter principal ID (e.g. abc12-xyz...)"
                    @keyup.enter="followByPrincipal"
                  />
                  <button
                    class="btn taco-btn taco-btn--success flex-shrink-0"
                    @click="followByPrincipal"
                    :disabled="isFollowingByPrincipal || !followPrincipalInput.trim()"
                  >
                    <i v-if="isFollowingByPrincipal" class="fas fa-spinner fa-spin me-1"></i>
                    <i v-else class="fas fa-user-plus me-1"></i>
                    Follow
                  </button>
                </div>

                <!-- Follow Error -->
                <div v-if="followByPrincipalError" class="perf-alert perf-alert--warning mt-3">
                  <small>{{ followByPrincipalError }}</small>
                </div>

                <!-- Follow Success -->
                <div v-if="followByPrincipalSuccess" class="perf-alert perf-alert--success mt-3">
                  <small>{{ followByPrincipalSuccess }}</small>
                </div>
              </div>
            </div>

            <!-- FOLLOWING + DISPLAY NAME (side by side) -->
            <div v-if="userLoggedIn" class="d-flex gap-3 mx-3 mb-4 bottom-row">
              <!-- MY FOLLOWING -->
              <div id="my-following" class="flex-fill bottom-col">
                <div class="taco-container taco-container--l1 h-100">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0 taco-text-brown-to-white">
                      <i class="fas fa-users me-2"></i>
                      Following ({{ userFollowsData.length }}/3)
                    </h5>
                    <small class="perf-muted">Your allocation copies</small>
                  </div>
                  <MyFollowing
                    :follows="userFollowsData"
                    :leaderboardEntries="leaderboardEntries"
                    :userLoggedIn="userLoggedIn"
                    :isLoading="isLoadingUserPerformance"
                    :selectedPriceType="selectedPriceType"
                    :selectedTimeframe="selectedTimeframe"
                    @unfollow="onUnfollowUser"
                    :inline="true"
                  />
                </div>
              </div>

              <!-- DISPLAY NAME -->
              <div id="display-name" class="flex-fill bottom-col">
                <div class="taco-container taco-container--l1 h-100">
                  <h5 class="mb-3 taco-text-brown-to-white">
                    <i class="fas fa-id-badge me-2"></i>Display Name
                  </h5>
                  <p class="perf-muted small mb-3">Set a name to show on the leaderboard instead of your principal ID.<br><br></p>
                  <div v-if="currentDisplayName" class="mb-3">  
                    <small class="perf-muted">Current: </small>
                    <strong class="taco-text-brown-to-white">{{ currentDisplayName }}</strong>
                  </div>
                  <div class="d-flex gap-2 align-items-center flex-wrap">
                    <input
                      v-model="displayNameInput"
                      type="text"
                      maxlength="24"
                      placeholder="Enter display name (2-24 chars)"
                      class="form-control form-control-sm taco-input"
                      style="max-width: 100%; flex: 1;"
                      @keyup.enter="onSetDisplayName"
                    />
                    <button
                      class="btn taco-btn taco-btn--success btn-sm"
                      @click="onSetDisplayName"
                      :disabled="displayNameLoading"
                    >
                      <i class="fas fa-save me-1"></i>
                      {{ displayNameLoading ? 'Saving...' : 'Set Name' }}
                    </button>
                    <button
                      v-if="currentDisplayName"
                      class="btn taco-btn taco-btn--danger btn-sm"
                      @click="onDeleteDisplayName"
                      :disabled="displayNameLoading"
                    >
                      <i class="fas fa-trash me-1"></i> Remove
                    </button>
                  </div>
                  <div v-if="displayNameError" class="perf-alert perf-alert--warning mt-2">
                    <small>{{ displayNameError }}</small>
                  </div>
                  <div v-if="displayNameSuccess" class="perf-alert perf-alert--success mt-2">
                    <small>{{ displayNameSuccess }}</small>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from "vue"
import { useTacoStore } from "../stores/taco.store"
import { storeToRefs } from "pinia"
import DfinityLogo from "../assets/images/dfinityLogo.vue"
import MyPerformance from "../components/performance/MyPerformance.vue"
import PerformanceLeaderboard from "../components/performance/PerformanceLeaderboard.vue"
import MyFollowing from "../components/performance/MyFollowing.vue"

export default {
  name: 'PerformanceView',
  components: {
    DfinityLogo,
    MyPerformance,
    PerformanceLeaderboard,
    MyFollowing
  },

  setup() {
    const tacoStore = useTacoStore()

    // User authentication state from store
    const {
      userLoggedIn,
      userPrincipal,
      // Leaderboard data from workers (8 combinations cached)
      leaderboardAllTimeUSD,
      leaderboardAllTimeICP,
      leaderboardOneYearUSD,
      leaderboardOneYearICP,
      leaderboardOneMonthUSD,
      leaderboardOneMonthICP,
      leaderboardOneWeekUSD,
      leaderboardOneWeekICP,
      leaderboardInfo: storeLeaderboardInfo,
      leaderboardLoading
    } = storeToRefs(tacoStore)

    // Section nav
    const sectionNavOpen = ref(false)
    const scrollContainer = ref(null)

    // Follow by principal
    const followPrincipalInput = ref('')
    const isFollowingByPrincipal = ref(false)
    const followByPrincipalError = ref('')
    const followByPrincipalSuccess = ref('')

    // Display name
    const displayNameInput = ref('')
    const currentDisplayName = ref(null)
    const displayNameLoading = ref(false)
    const displayNameError = ref('')
    const displayNameSuccess = ref('')

    // Loading states
    const isLoading = ref(false)
    const isLoadingUserPerformance = ref(false)
    const isLoadingFollowerInfo = ref(false)

    // Error states
    const errorMessage = ref('')
    const userPerformanceError = ref('')

    // Leaderboard data - computed from store based on filters
    const followerInfos = ref([])

    // Computed: select the right leaderboard data based on current filters
    const leaderboardEntries = computed(() => {
      const key = `${selectedTimeframe.value}${selectedPriceType.value}`
      switch (key) {
        case 'AllTimeUSD': return leaderboardAllTimeUSD.value || []
        case 'AllTimeICP': return leaderboardAllTimeICP.value || []
        case 'OneYearUSD': return leaderboardOneYearUSD.value || []
        case 'OneYearICP': return leaderboardOneYearICP.value || []
        case 'OneMonthUSD': return leaderboardOneMonthUSD.value || []
        case 'OneMonthICP': return leaderboardOneMonthICP.value || []
        case 'OneWeekUSD': return leaderboardOneWeekUSD.value || []
        case 'OneWeekICP': return leaderboardOneWeekICP.value || []
        default: return leaderboardAllTimeUSD.value || []
      }
    })

    // Computed: use leaderboardInfo from store
    const leaderboardInfo = computed(() => storeLeaderboardInfo.value)

    // Computed: loading state - only show spinner on initial load, not background refreshes
    const isLoadingLeaderboard = computed(() => {
      // If we already have leaderboard data, don't show loading state
      // (background worker updates and follower info refreshes should be silent)
      if (leaderboardEntries.value && leaderboardEntries.value.length > 0) return false
      return leaderboardLoading.value || isLoadingFollowerInfo.value
    })

    // User performance data
    const userPerformance = ref(null)
    const userFollowsData = ref([]) // Full follow data: [{ principal: string, since: bigint }]

    // Computed: extract just principal strings for leaderboard component
    const userFollowPrincipals = computed(() => {
      return userFollowsData.value.map(f => f.principal)
    })

    // Filters
    const selectedTimeframe = ref('AllTime') // OneWeek, OneMonth, OneYear, AllTime
    const selectedPriceType = ref('ICP') // USD, ICP

    // Login function
    const iidLogIn = () => {
      tacoStore.iidLogIn()
    }

    // Convert timeframe string to candid variant
    const getTimeframeVariant = (timeframe) => {
      switch (timeframe) {
        case 'OneWeek': return { OneWeek: null }
        case 'OneMonth': return { OneMonth: null }
        case 'OneYear': return { OneYear: null }
        case 'AllTime':
        default: return { AllTime: null }
      }
    }

    // Load follower info for leaderboard entries (leaderboard data comes from workers)
    const loadFollowerInfo = async () => {
      const entries = leaderboardEntries.value
      if (!entries || entries.length === 0) {
        followerInfos.value = []
        return
      }

      // Only show loading spinner if we have no follower data yet (initial load)
      const isInitialLoad = followerInfos.value.length === 0
      if (isInitialLoad) {
        isLoadingFollowerInfo.value = true
      }

      try {
        const principals = entries.map(e => e.principal)
        const daoActor = await tacoStore.createDAOActorAnonymous()
        const followerData = await daoActor.getUsersFollowerInfo(principals)
        followerInfos.value = followerData
      } catch (followerError) {
        console.warn('Failed to load follower info (non-critical):', followerError)
        // Only clear on initial load failure; keep existing data on background refresh
        if (isInitialLoad) {
          followerInfos.value = []
        }
      } finally {
        isLoadingFollowerInfo.value = false
      }
    }

    // Watch leaderboard entries to load follower info when data changes
    watch(leaderboardEntries, (newEntries) => {
      if (newEntries && newEntries.length > 0) {
        loadFollowerInfo()
      }
    }, { immediate: true })

    // Load user's performance data
    // Uses getUserPerformanceGraphData which returns checkpoint data for graphs
    // and provides pre-calculated timeframe performance scores from the backend
    const loadUserPerformance = async () => {
      if (!userLoggedIn.value || !userPrincipal.value) return

      isLoadingUserPerformance.value = true
      userPerformanceError.value = ''

      try {
        const rewardsActor = await tacoStore.createRewardsActorAnonymous()
        const { Principal } = await import('@dfinity/principal')

        const nowMs = BigInt(Date.now())
        const endTime = nowMs * BigInt(1_000_000) // nanoseconds
        const startTime = BigInt(0) // AllTime - backend returns all checkpoints

        // Backend now returns best USD neuron and best ICP neuron separately
        const graphResult = await rewardsActor.getUserPerformanceGraphData(
          Principal.fromText(userPrincipal.value),
          startTime,
          endTime,
          getTimeframeVariant(selectedTimeframe.value)
        )

        if ('ok' in graphResult) {
          const graphData = graphResult.ok

          // Use backend-provided timeframe performance values (exact match with leaderboard)
          const aggregatedPerformance = {
            allTimeUSD: graphData.aggregatedPerformanceUSD ? [graphData.aggregatedPerformanceUSD] : [],
            allTimeICP: graphData.aggregatedPerformanceICP?.length > 0 ? [graphData.aggregatedPerformanceICP[0]] : [],
            oneWeekUSD: graphData.oneWeekUSD?.length > 0 ? [graphData.oneWeekUSD[0]] : [],
            oneWeekICP: graphData.oneWeekICP?.length > 0 ? [graphData.oneWeekICP[0]] : [],
            oneMonthUSD: graphData.oneMonthUSD?.length > 0 ? [graphData.oneMonthUSD[0]] : [],
            oneMonthICP: graphData.oneMonthICP?.length > 0 ? [graphData.oneMonthICP[0]] : [],
            oneYearUSD: graphData.oneYearUSD?.length > 0 ? [graphData.oneYearUSD[0]] : [],
            oneYearICP: graphData.oneYearICP?.length > 0 ? [graphData.oneYearICP[0]] : []
          }

          // Build neurons array from bestUsdNeuron and bestIcpNeuron
          const neurons = []
          const seenNeuronIds = new Set()
          const bestUsd = graphData.bestUsdNeuron?.[0] || null
          const bestIcp = graphData.bestIcpNeuron?.[0] || null

          const addNeuron = (nd) => {
            if (!nd) return
            const idStr = Array.from(nd.neuronId).join(',')
            if (seenNeuronIds.has(idStr)) return
            seenNeuronIds.add(idStr)
            neurons.push({
              neuronId: nd.neuronId,
              votingPower: BigInt(0),
              distributionsParticipated: nd.checkpoints.length,
              lastAllocationChange: nd.checkpoints.length > 0
                ? nd.checkpoints[nd.checkpoints.length - 1].timestamp
                : BigInt(0),
              performance: {
                allTimeUSD: nd.performanceScoreUSD ? [nd.performanceScoreUSD] : [],
                allTimeICP: nd.performanceScoreICP?.length > 0 ? [nd.performanceScoreICP[0]] : [],
                oneWeekUSD: graphData.oneWeekUSD?.length > 0 ? [graphData.oneWeekUSD[0]] : [],
                oneWeekICP: graphData.oneWeekICP?.length > 0 ? [graphData.oneWeekICP[0]] : [],
                oneMonthUSD: graphData.oneMonthUSD?.length > 0 ? [graphData.oneMonthUSD[0]] : [],
                oneMonthICP: graphData.oneMonthICP?.length > 0 ? [graphData.oneMonthICP[0]] : [],
                oneYearUSD: graphData.oneYearUSD?.length > 0 ? [graphData.oneYearUSD[0]] : [],
                oneYearICP: graphData.oneYearICP?.length > 0 ? [graphData.oneYearICP[0]] : []
              }
            })
          }
          addNeuron(bestUsd)
          addNeuron(bestIcp)

          const totalCheckpoints = neurons.reduce(
            (sum, nd) => sum + nd.distributionsParticipated, 0
          )

          userPerformance.value = {
            principal: Principal.fromText(userPrincipal.value),
            totalVotingPower: BigInt(0),
            distributionsParticipated: totalCheckpoints > 0 ? totalCheckpoints : 0,
            lastActivity: graphData.timeframe.endTime,
            aggregatedPerformance,
            neurons
          }
        } else {
          // Handle errors
          const errKey = Object.keys(graphResult.err)[0]
          if (errKey === 'NeuronNotFound') {
            console.log('User has no performance data yet (NeuronNotFound)')
            userPerformance.value = null
          } else {
            console.error('Error from getUserPerformanceGraphData:', graphResult.err)
            userPerformanceError.value = formatError(graphResult.err)
          }
        }

        // Also load user's follows list
        await loadUserFollows()

      } catch (error) {
        console.error('Error loading user performance:', error)
        userPerformanceError.value = formatNetworkError(error)
      } finally {
        isLoadingUserPerformance.value = false
      }
    }

    // Load user's follow list (who they follow)
    const loadUserFollows = async () => {
      if (!userLoggedIn.value) return

      try {
        const daoActor = await tacoStore.createDAOActor()
        const userState = await daoActor.getUserAllocation()

        if (userState && userState.length > 0 && userState[0].allocationFollows) {
          // Store full follow data with principal and since timestamp
          userFollowsData.value = userState[0].allocationFollows.map(f => ({
            principal: f.follow.toString(),
            since: f.since
          }))
        } else {
          userFollowsData.value = []
        }
      } catch (error) {
        console.error('Error loading user follows:', error)
      }
    }

    // Format error from canister
    const formatError = (err) => {
      if ('NeuronNotFound' in err) return 'No performance data found yet'
      if ('NotAuthorized' in err) return 'Not authorized to view this data'
      if ('SystemError' in err) return err.SystemError
      if ('AllocationDataMissing' in err) return 'Allocation data not available yet'
      if ('PriceDataMissing' in err) return 'Price data not available - please try again later'
      if ('DistributionInProgress' in err) return 'A distribution is in progress - please try again later'
      if ('InvalidTimeRange' in err) return 'Invalid time range'
      if ('InsufficientRewardPot' in err) return 'Insufficient reward pot'
      return 'An error occurred'
    }

    // Format network/canister errors for display
    const formatNetworkError = (error) => {
      const msg = error?.message || String(error)
      if (msg.includes('not found')) {
        return 'Performance service temporarily unavailable'
      }
      if (msg.includes('reject')) {
        return 'Request was rejected by the network'
      }
      return 'Failed to load performance data'
    }

    // Scroll to a section by id
    const scrollToSection = (sectionId) => {
      nextTick(() => {
        const el = document.getElementById(sectionId)
        if (el && scrollContainer.value) {
          const containerRect = scrollContainer.value.getBoundingClientRect()
          const elRect = el.getBoundingClientRect()
          const offset = elRect.top - containerRect.top + scrollContainer.value.scrollTop - 16
          scrollContainer.value.scrollTo({ top: offset, behavior: 'smooth' })
        }
      })
    }

    // Follow a user by entering their principal ID
    const followByPrincipal = async () => {
      const input = followPrincipalInput.value.trim()
      if (!input || !userLoggedIn.value) return

      isFollowingByPrincipal.value = true
      followByPrincipalError.value = ''
      followByPrincipalSuccess.value = ''

      try {
        const { Principal } = await import('@dfinity/principal')
        let principalObj
        try {
          principalObj = Principal.fromText(input)
        } catch {
          followByPrincipalError.value = 'Invalid principal ID format.'
          isFollowingByPrincipal.value = false
          return
        }

        const daoActor = await tacoStore.createDAOActor()
        const result = await daoActor.followAllocation(principalObj)

        if ('ok' in result) {
          followByPrincipalSuccess.value = `Successfully followed ${input.substring(0, 12)}...`
          followPrincipalInput.value = ''
          await loadUserFollows()
          await loadFollowerInfo()
        } else {
          followByPrincipalError.value = formatFollowError(result.err)
        }
      } catch (error) {
        console.error('Error following principal:', error)
        followByPrincipalError.value = 'Failed to follow. Please check the principal ID and try again.'
      } finally {
        isFollowingByPrincipal.value = false
      }
    }

    // Refresh all data
    const refreshAllData = async () => {
      isLoading.value = true
      await Promise.all([
        loadFollowerInfo(),
        userLoggedIn.value ? loadUserPerformance() : Promise.resolve()
      ])
      isLoading.value = false
    }

    // Handle timeframe filter change
    // Leaderboard data is already cached by workers - just update the filter
    // No need to reload user performance: chart shows AllTime with both USD+ICP,
    // and all 8 timeframe performance scores are already loaded
    const onTimeframeChange = (timeframe) => {
      selectedTimeframe.value = timeframe
      // Follower info will be loaded via the watch on leaderboardEntries
    }

    // Handle price type filter change
    // Leaderboard data is already cached by workers - just update the filter
    const onPriceTypeChange = (priceType) => {
      selectedPriceType.value = priceType
      // Follower info will be loaded via the watch on leaderboardEntries
    }

    // Handle follow action
    const onFollowUser = async (principal) => {
      if (!userLoggedIn.value) return

      try {
        const daoActor = await tacoStore.createDAOActor()
        const { Principal } = await import('@dfinity/principal')
        const result = await daoActor.followAllocation(Principal.fromText(principal))

        if ('ok' in result) {
          tacoStore.showSuccess('Successfully followed user')
          await loadUserFollows()
          await loadFollowerInfo() // Refresh follower counts
        } else {
          tacoStore.showError(formatFollowError(result.err))
        }
      } catch (error) {
        console.error('Error following user:', error)
        tacoStore.showError('Failed to follow user')
      }
    }

    // Handle unfollow action
    const onUnfollowUser = async (principal) => {
      if (!userLoggedIn.value) return

      try {
        const daoActor = await tacoStore.createDAOActor()
        const { Principal } = await import('@dfinity/principal')
        const result = await daoActor.unfollowAllocation(Principal.fromText(principal))

        if ('ok' in result) {
          tacoStore.showSuccess('Successfully unfollowed user')
          await loadUserFollows()
          await loadFollowerInfo() // Refresh follower counts
        } else {
          tacoStore.showError(formatUnfollowError(result.err))
        }
      } catch (error) {
        console.error('Error unfollowing user:', error)
        tacoStore.showError('Failed to unfollow user')
      }
    }

    // Format follow error
    const formatFollowError = (err) => {
      if ('NotAllowed' in err) return 'You are not allowed to follow'
      if ('SystemInactive' in err) return 'System is currently inactive'
      if ('FolloweeIsSelf' in err) return 'You cannot follow yourself'
      if ('FolloweeNotFound' in err) return 'User not found'
      if ('FollowerNotFound' in err) return 'You need to make an allocation first'
      if ('FolloweeNoAllocationYetMade' in err) return 'This user has not made any allocations yet'
      if ('FollowerNoAllocationYetMade' in err) return 'You need to make an allocation first'
      if ('FollowLimitReached' in err) return 'You can only follow up to 3 users'
      if ('FolloweeLimitReached' in err) return 'This user has reached maximum followers'
      if ('AlreadyFollowing' in err) return 'You are already following this user'
      if ('FollowUnfollowLimitReached' in err) return 'Daily action limit reached (10 per day)'
      if ('UnexpectedError' in err) return err.UnexpectedError
      return 'Follow action failed'
    }

    // Format unfollow error
    const formatUnfollowError = (err) => {
      if ('NotAllowed' in err) return 'You are not allowed to unfollow'
      if ('SystemInactive' in err) return 'System is currently inactive'
      if ('FolloweeIsSelf' in err) return 'You cannot unfollow yourself'
      if ('FolloweeNotFound' in err) return 'User not found'
      if ('FollowerNotFound' in err) return 'You are not registered'
      if ('AlreadyUnfollowing' in err) return 'You are not following this user'
      if ('FollowUnfollowLimitReached' in err) return 'Daily action limit reached (10 per day)'
      if ('UnexpectedError' in err) return err.UnexpectedError
      return 'Unfollow action failed'
    }

    // Display name functions
    const loadDisplayName = async () => {
      if (!userLoggedIn.value || !userPrincipal.value) return
      try {
        const rewardsActor = await tacoStore.createRewardsActorAnonymous()
        const { Principal } = await import('@dfinity/principal')
        const result = await rewardsActor.getDisplayName(Principal.fromText(userPrincipal.value))
        if (result && result.length > 0) {
          currentDisplayName.value = result[0]
          displayNameInput.value = result[0]
        } else {
          currentDisplayName.value = null
        }
      } catch (error) {
        console.error('Error loading display name:', error)
      }
    }

    const onSetDisplayName = async () => {
      if (!displayNameInput.value.trim()) return
      displayNameLoading.value = true
      displayNameError.value = ''
      displayNameSuccess.value = ''
      try {
        const rewardsActor = await tacoStore.createRewardsActor()
        const result = await rewardsActor.setDisplayName(displayNameInput.value.trim())
        if ('ok' in result) {
          currentDisplayName.value = displayNameInput.value.trim()
          displayNameSuccess.value = 'Display name set successfully'
          setTimeout(() => { displayNameSuccess.value = '' }, 3000)
        } else {
          const err = result.err
          if ('InvalidDisplayName' in err) {
            displayNameError.value = err.InvalidDisplayName
          } else if ('NotAuthorized' in err) {
            displayNameError.value = 'Not authorized'
          } else {
            displayNameError.value = 'Failed to set display name'
          }
        }
      } catch (error) {
        console.error('Error setting display name:', error)
        displayNameError.value = 'Failed to set display name'
      } finally {
        displayNameLoading.value = false
      }
    }

    const onDeleteDisplayName = async () => {
      displayNameLoading.value = true
      displayNameError.value = ''
      displayNameSuccess.value = ''
      try {
        const rewardsActor = await tacoStore.createRewardsActor()
        const result = await rewardsActor.deleteMyDisplayName()
        if ('ok' in result) {
          currentDisplayName.value = null
          displayNameInput.value = ''
          displayNameSuccess.value = 'Display name removed'
          setTimeout(() => { displayNameSuccess.value = '' }, 3000)
        } else {
          displayNameError.value = 'Failed to remove display name'
        }
      } catch (error) {
        console.error('Error deleting display name:', error)
        displayNameError.value = 'Failed to remove display name'
      } finally {
        displayNameLoading.value = false
      }
    }

    // Watch for login state changes
    watch(userLoggedIn, (newState) => {
      if (newState) {
        loadUserPerformance()
        loadDisplayName()
      } else {
        userPerformance.value = null
        userFollowsData.value = []
        currentDisplayName.value = null
        displayNameInput.value = ''
      }
    })

    // Load data on mount
    onMounted(async () => {
      await tacoStore.checkIfLoggedIn()
      await refreshAllData()
      loadDisplayName()
    })

    return {
      // State
      userLoggedIn,
      userPrincipal,
      isLoading,
      isLoadingLeaderboard,
      isLoadingUserPerformance,
      errorMessage,
      userPerformanceError,
      leaderboardEntries,
      followerInfos,
      leaderboardInfo,
      userPerformance,
      userFollowsData,
      userFollowPrincipals,
      selectedTimeframe,
      selectedPriceType,

      // Section nav
      sectionNavOpen,
      scrollContainer,

      // Follow by principal
      followPrincipalInput,
      isFollowingByPrincipal,
      followByPrincipalError,
      followByPrincipalSuccess,

      // Display name
      displayNameInput,
      currentDisplayName,
      displayNameLoading,
      displayNameError,
      displayNameSuccess,

      // Methods
      iidLogIn,
      refreshAllData,
      loadUserPerformance,
      onTimeframeChange,
      onPriceTypeChange,
      onFollowUser,
      onUnfollowUser,
      scrollToSection,
      followByPrincipal,
      onSetDisplayName,
      onDeleteDisplayName
    }
  }
}
</script>

<style scoped>
.performance-view {
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
}

/* Bottom row: Following + Display Name side by side */
.bottom-row {
  align-items: stretch;
}

.bottom-col {
  min-width: 0;
  flex-basis: 50%;
}

@media (max-width: 768px) {
  .bottom-row {
    flex-direction: column;
  }

  .bottom-col {
    flex-basis: auto;
  }
}

.perf-title-bar {
  background: var(--yellow-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
}

.perf-beta-badge {
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  background-color: var(--dark-orange);
  color: #fff;
  border-radius: 0.25rem;
  font-weight: 700;
  text-transform: uppercase;
  vertical-align: super;
  margin-left: 0.25rem;
  letter-spacing: 0.05em;
}

/* Theme text helpers */
.perf-muted {
  color: var(--dark-brown-to-white);
}

/* Theme alert boxes */
.perf-alert {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--dark-orange);
}

.perf-alert--warning {
  background: var(--dark-orange-to-light-brown);
  color: var(--brown-to-white);
}

.perf-alert--success {
  background: var(--green);
  color: var(--black);
}

/* Button styling */
.iid-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #522785 0%, #29235c 100%);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;
}

.iid-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 39, 133, 0.4);
}

/* Floating Section Nav */
.section-nav-floating {
  position: fixed;
  top: 80px;
  left: 120px;
  z-index: 1050;
}

.section-nav-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--dark-orange);
  background: var(--yellow-to-brown);
  color: var(--brown-to-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.section-nav-toggle:hover {
  background: var(--orange-to-light-brown);
  color: var(--brown-to-white);
  border-color: var(--brown);
}

.section-nav-open .section-nav-toggle {
  background: var(--brown);
  border-color: var(--dark-brown);
  color: #fff;
}

.section-nav-menu {
  position: absolute;
  top: 48px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--yellow-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 6px;
  min-width: 200px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.section-nav-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--brown-to-white);
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  white-space: nowrap;
}

.section-nav-item:hover {
  background: var(--orange-to-light-brown);
  color: var(--brown-to-white);
}

/* Nav transition */
.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 576px) {
  .section-nav-floating {
    top: 70px;
    left: 80px;
  }

  .section-nav-toggle {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }

  .section-nav-menu {
    top: 44px;
    min-width: 180px;
  }

  .section-nav-item {
    padding: 8px 12px;
    font-size: 0.75rem;
  }
}
</style>
