<template>
  <div class="standard-view">
    <!-- scroll container -->
    <div class="scroll-y-container h-100">
      <!-- bootstrap container -->
      <div class="container p-0">
        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- performance page -->
          <div class="performance-view">

            <!-- title container -->
            <div class="d-flex align-items-center justify-content-between">
              <!-- performance title -->
              <h1 class="taco-title mb-4 mt-4 px-3">
                <span class="taco-title__icon">🏆</span>
                <span class="taco-title__title">Performance</span>
              </h1>

              <!-- refresh button -->
              <button
                class="btn taco-nav-btn taco-nav-btn--active me-3"
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
              <div class="card bg-dark text-white">
                <div class="card-body text-center py-4">
                  <h5 class="mb-3">View Your Performance</h5>
                  <p class="text-muted mb-3">Log in to see your personal performance metrics and neuron details.</p>
                  <button class="btn iid-login" @click="iidLogIn">
                    <DfinityLogo />
                    <span class="taco-text-white ms-2">Login</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- LEADERBOARD SECTION -->
            <PerformanceLeaderboard
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

            <!-- MY FOLLOWING SECTION (logged in users only) -->
            <MyFollowing
              v-if="userLoggedIn"
              :follows="userFollowsData"
              :leaderboardEntries="leaderboardEntries"
              :userLoggedIn="userLoggedIn"
              :isLoading="isLoadingUserPerformance"
              :selectedPriceType="selectedPriceType"
              :selectedTimeframe="selectedTimeframe"
              @unfollow="onUnfollowUser"
            />

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue"
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
    const selectedPriceType = ref('USD') // USD, ICP

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

    // Convert price type string to candid variant
    const getPriceTypeVariant = (priceType) => {
      return priceType === 'ICP' ? { ICP: null } : { USD: null }
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

        // Pass current timeframe and priceType so backend selects the best neuron
        const graphResult = await rewardsActor.getUserPerformanceGraphData(
          Principal.fromText(userPrincipal.value),
          startTime,
          endTime,
          getTimeframeVariant(selectedTimeframe.value),
          getPriceTypeVariant(selectedPriceType.value)
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

          // neuronData now has at most 1 neuron (the best for the selected timeframe/priceType)
          const neurons = graphData.neuronData.map(nd => ({
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
          }))

          const totalCheckpoints = graphData.neuronData.reduce(
            (sum, nd) => sum + nd.checkpoints.length, 0
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

    // Watch for login state changes
    watch(userLoggedIn, (newState) => {
      if (newState) {
        loadUserPerformance()
      } else {
        userPerformance.value = null
        userFollowsData.value = []
      }
    })

    // Load data on mount
    onMounted(async () => {
      await tacoStore.checkIfLoggedIn()
      await refreshAllData()
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

      // Methods
      iidLogIn,
      refreshAllData,
      loadUserPerformance,
      onTimeframeChange,
      onPriceTypeChange,
      onFollowUser,
      onUnfollowUser
    }
  }
}
</script>

<style scoped>
.performance-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.standard-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scroll-y-container {
  overflow-y: auto;
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
</style>
