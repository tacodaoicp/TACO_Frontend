<template>
  <div class="performance-leaderboard mx-3 mb-4">
    <div class="taco-container taco-container--l1">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h5 class="mb-0 taco-text-brown-to-white">
          <i class="fas fa-trophy me-2" style="color: var(--dark-orange);"></i>
          Best Performers
        </h5>

        <!-- Last Updated -->
        <small v-if="leaderboardInfo" class="lb-muted">
          Updated: {{ formatTimestamp(leaderboardInfo.lastUpdate) }}
        </small>
      </div>

      <!-- Filters -->
      <div class="filters mb-3 d-flex flex-wrap gap-2">
        <!-- Timeframe Filters -->
        <div class="btn-group" role="group">
          <button
            v-for="tf in timeframes"
            :key="tf.value"
            type="button"
            class="btn taco-nav-btn"
            :class="selectedTimeframe === tf.value ? 'taco-nav-btn--active' : ''"
            @click="$emit('timeframe-change', tf.value)"
          >
            {{ tf.label }}
          </button>
        </div>

        <!-- Price Type Filters -->
        <div class="btn-group" role="group">
          <button
            v-for="pt in priceTypes"
            :key="pt.value"
            type="button"
            class="btn taco-nav-btn"
            :class="selectedPriceType === pt.value ? 'taco-nav-btn--active' : ''"
            @click="$emit('price-type-change', pt.value)"
          >
            {{ pt.label }}
          </button>
        </div>
      </div>

      <div>
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border" role="status" style="color: var(--brown);">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 lb-muted">Loading leaderboard...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!leaderboardEntries || leaderboardEntries.length === 0" class="text-center py-5">
          <i class="fas fa-trophy fa-3x mb-3" style="color: var(--dark-orange);"></i>
          <h5 class="lb-muted">No Leaderboard Data Yet</h5>
          <p class="lb-muted">Performance data will appear after reward distributions.</p>
        </div>

        <!-- Leaderboard Table -->
        <div v-else class="table-responsive">
          <table class="lb-table">
            <thead>
              <tr>
                <th class="text-center" style="width: 60px;">Rank</th>
                <th>User</th>
                <th class="text-end">Return</th>
                <th class="text-center">Distributions</th>
                <th class="text-center">Followers</th>
                <th class="text-center" style="width: 100px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(entry, index) in leaderboardEntries" :key="entry.principal.toString()">
                <!-- Main Row -->
                <tr
                  :class="{
                    'highlight-row': isCurrentUser(entry.principal),
                    'expanded-row': isExpanded(entry.principal),
                    'clickable-row': true
                  }"
                  @click="toggleExpanded(entry.principal)"
                >
                  <!-- Rank -->
                  <td class="text-center">
                    <span class="rank-badge" :class="getRankBadgeClass(Number(entry.rank))">
                      {{ Number(entry.rank) }}
                    </span>
                  </td>

                  <!-- User -->
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <i
                        class="fas fa-chevron-right expand-icon"
                        :class="{ 'rotated': isExpanded(entry.principal) }"
                      ></i>
                      <div class="d-flex flex-column">
                        <span v-if="entry.displayName && entry.displayName.length > 0" class="display-name" :title="entry.principal.toString()">
                          {{ entry.displayName[0] }}
                        </span>
                        <code
                          class="principal-id"
                          :class="{ 'principal-id--small': entry.displayName && entry.displayName.length > 0 }"
                          :title="entry.principal.toString()"
                        >
                          {{ entry.principal.toString() }}
                        </code>
                      </div>
                      <span v-if="isCurrentUser(entry.principal)" class="you-badge">You</span>
                    </div>
                  </td>

                  <!-- Performance Return -->
                  <td class="text-end">
                    <span :class="getPerformanceClass(entry.performanceScore)" class="fw-bold perf-value">
                      {{ formatPerformance(entry.performanceScore) }}
                    </span>
                  </td>

                  <!-- Distributions Count -->
                  <td class="text-center">
                    <span class="lb-muted">{{ Number(entry.distributionsCount) }}</span>
                  </td>

                  <!-- Followers -->
                  <td class="text-center">
                    <span v-if="followerInfos[index]" class="follower-count">
                      {{ Number(followerInfos[index].followerCount) }}/500
                    </span>
                    <span v-else class="lb-muted">-</span>
                  </td>

                  <!-- Follow Action -->
                  <td class="text-center" @click.stop>
                    <template v-if="userLoggedIn && !isCurrentUser(entry.principal)">
                      <!-- Already following -->
                      <button
                        v-if="isFollowing(entry.principal)"
                        class="btn taco-btn taco-btn--danger btn-sm"
                        @click="$emit('unfollow', entry.principal.toString())"
                        title="Unfollow this user"
                      >
                        Unfollow
                      </button>

                      <!-- Can follow -->
                      <button
                        v-else-if="canFollow(index)"
                        class="btn taco-btn taco-btn--success btn-sm"
                        @click="$emit('follow', entry.principal.toString())"
                        title="Follow this user's allocations"
                      >
                        Follow
                      </button>

                      <!-- Cannot follow (at capacity) -->
                      <span
                        v-else
                        class="full-badge"
                        title="This user has reached maximum followers"
                      >
                        FULL
                      </span>
                    </template>

                    <!-- Not logged in or self -->
                    <span v-else class="lb-muted">-</span>
                  </td>
                </tr>

                <!-- Expanded Chart Row -->
                <tr v-if="isExpanded(entry.principal)" class="expanded-content-row">
                  <td colspan="6" class="p-0">
                    <div class="expanded-chart-container">
                      <PerformanceChart
                        :principal="entry.principal.toString()"
                        :height="220"
                      />
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Leaderboard Stats Footer -->
        <div v-if="leaderboardInfo && leaderboardEntries.length > 0" class="lb-footer">
          <small class="lb-muted">
            Showing {{ leaderboardEntries.length }} of {{ getLeaderboardCount() }} entries
            <span class="mx-2">|</span>
            Total Distributions: {{ Number(leaderboardInfo.totalDistributions) }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useTacoStore } from "../../stores/taco.store"
import { storeToRefs } from "pinia"
import PerformanceChart from './PerformanceChart.vue'

export default {
  name: 'PerformanceLeaderboard',
  components: {
    PerformanceChart
  },
  props: {
    leaderboardEntries: {
      type: Array,
      default: () => []
    },
    followerInfos: {
      type: Array,
      default: () => []
    },
    leaderboardInfo: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    selectedTimeframe: {
      type: String,
      default: 'AllTime'
    },
    selectedPriceType: {
      type: String,
      default: 'USD'
    },
    userLoggedIn: {
      type: Boolean,
      default: false
    },
    userFollows: {
      type: Array,
      default: () => []
    }
  },
  emits: ['timeframe-change', 'price-type-change', 'follow', 'unfollow'],

  setup(props) {
    const tacoStore = useTacoStore()
    const { userPrincipal } = storeToRefs(tacoStore)

    // Track which row is expanded (only one at a time)
    const expandedPrincipal = ref(null)

    // Toggle expanded row
    const toggleExpanded = (principal) => {
      const principalStr = principal.toString()
      if (expandedPrincipal.value === principalStr) {
        expandedPrincipal.value = null
      } else {
        expandedPrincipal.value = principalStr
      }
    }

    // Check if a row is expanded
    const isExpanded = (principal) => {
      return expandedPrincipal.value === principal.toString()
    }

    // Filter options
    const timeframes = [
      { value: 'OneWeek', label: '1W' },
      { value: 'OneMonth', label: '1M' },
      { value: 'OneYear', label: '1Y' },
      { value: 'AllTime', label: 'All' }
    ]

    const priceTypes = [
      { value: 'USD', label: 'USD' },
      { value: 'ICP', label: 'ICP' }
    ]

    // Check if entry is current user
    const isCurrentUser = (principal) => {
      if (!userPrincipal.value) return false
      return principal.toString() === userPrincipal.value
    }

    // Check if user is following this principal
    const isFollowing = (principal) => {
      return props.userFollows.includes(principal.toString())
    }

    // Check if user can follow (leader not at capacity)
    const canFollow = (index) => {
      if (!props.followerInfos[index]) return true
      return props.followerInfos[index].canBeFollowed
    }

    // Format principal for display
    const formatPrincipal = (principal) => {
      const str = principal.toString()
      if (str.length > 20) {
        return str.substring(0, 10) + '...' + str.substring(str.length - 6)
      }
      return str
    }

    // Format performance score to percentage
    const formatPerformance = (score) => {
      if (score === null || score === undefined) return 'N/A'
      const pct = (score - 1.0) * 100
      const sign = pct >= 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    // Get CSS class based on performance
    const getPerformanceClass = (score) => {
      if (score === null || score === undefined) return 'text-muted'
      if (score >= 1.0) return 'text-success'
      return 'text-danger'
    }

    // Get badge class for rank
    const getRankBadgeClass = (rank) => {
      if (rank === 1) return 'rank-gold'
      if (rank === 2) return 'rank-silver'
      if (rank === 3) return 'rank-bronze'
      if (rank <= 10) return 'rank-top10'
      return 'rank-default'
    }

    // Format timestamp from nanoseconds
    const formatTimestamp = (timestampNS) => {
      if (!timestampNS) return 'Never'
      try {
        const timestampMS = Number(timestampNS) / 1_000_000
        const date = new Date(timestampMS)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch (error) {
        return 'Unknown'
      }
    }

    // Get leaderboard count based on current filters
    const getLeaderboardCount = () => {
      if (!props.leaderboardInfo?.leaderboardCounts) return 0

      const counts = props.leaderboardInfo.leaderboardCounts
      const key = `${props.selectedTimeframe.toLowerCase().replace('onew', 'oneW').replace('onem', 'oneM').replace('oney', 'oneY').replace('allt', 'allT')}${props.selectedPriceType}`

      // Map to correct key names
      const keyMap = {
        'oneWeekUSD': 'oneWeekUSD',
        'oneWeekICP': 'oneWeekICP',
        'oneMonthUSD': 'oneMonthUSD',
        'oneMonthICP': 'oneMonthICP',
        'oneYearUSD': 'oneYearUSD',
        'oneYearICP': 'oneYearICP',
        'allTimeUSD': 'allTimeUSD',
        'allTimeICP': 'allTimeICP'
      }

      const mappedKey = `${props.selectedTimeframe.charAt(0).toLowerCase()}${props.selectedTimeframe.slice(1)}${props.selectedPriceType}`

      return Number(counts[mappedKey] || 0)
    }

    return {
      timeframes,
      priceTypes,
      userPrincipal,
      expandedPrincipal,
      toggleExpanded,
      isExpanded,
      isCurrentUser,
      isFollowing,
      canFollow,
      formatPrincipal,
      formatPerformance,
      getPerformanceClass,
      getRankBadgeClass,
      formatTimestamp,
      getLeaderboardCount
    }
  }
}
</script>

<style scoped>
.filters .btn-group {
  flex-wrap: nowrap;
}

/* Table styling */
.lb-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  color: var(--black-to-white);
}

.lb-table th {
  border-top: none;
  border-bottom: 2px solid var(--dark-orange);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--brown-to-white);
  padding: 0.75rem;
  font-family: 'Rubik', sans-serif;
}

.lb-table td {
  vertical-align: middle;
  padding: 0.75rem;
  border-bottom: 1px solid var(--dark-orange);
  color: var(--black-to-white);
}

.lb-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.lb-muted {
  color: var(--dark-brown-to-white);
}

.highlight-row {
  background-color: rgba(218, 141, 40, 0.15) !important;
}

/* Expandable rows */
.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable-row:hover {
  background-color: rgba(0, 0, 0, 0.08) !important;
}

.expanded-row {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.expanded-row td {
  border-bottom: none !important;
}

.expand-icon {
  font-size: 0.7rem;
  color: var(--dark-brown-to-white);
  transition: transform 0.2s ease;
  width: 12px;
}

.expand-icon.rotated {
  transform: rotate(90deg);
}

.expanded-content-row {
  background-color: color-mix(in srgb, var(--yellow-to-brown) 85%, #000) !important;
}

.expanded-content-row:hover {
  background-color: color-mix(in srgb, var(--yellow-to-brown) 85%, #000) !important;
}

.expanded-chart-container {
  padding: 1rem;
  border-top: 1px solid var(--dark-orange);
  background: color-mix(in srgb, var(--yellow-to-brown) 85%, #000);
}

/* Display name styling */
.display-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--black-to-white);
}

/* Principal styling */
.principal-id {
  font-size: 0.85rem;
  color: var(--brown-to-white);
  font-family: 'Space Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
  display: inline-block;
  vertical-align: middle;
}

.principal-id--small {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* Rank badges */
.rank-badge {
  display: inline-block;
  font-size: 0.8rem;
  min-width: 32px;
  text-align: center;
  padding: 0.2rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 700;
  font-family: 'Space Mono', monospace;
}

.rank-gold {
  background: var(--yellow);
  color: var(--black);
  border: 1px solid var(--dark-orange);
}

.rank-silver {
  background: #c0c0c0;
  color: var(--black);
  border: 1px solid #999;
}

.rank-bronze {
  background: #cd7f32;
  color: #fff;
  border: 1px solid #a0622a;
}

.rank-top10 {
  background: var(--dark-orange);
  color: #fff;
}

.rank-default {
  background: var(--orange-to-light-brown);
  color: var(--brown-to-white);
  border: 1px solid var(--dark-orange);
}

.you-badge {
  background: var(--green);
  color: var(--black);
  border-radius: 0.375rem;
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.full-badge {
  background: var(--dark-gray);
  color: #fff;
  border-radius: 0.375rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
}

/* Follower count */
.follower-count {
  font-size: 0.85rem;
  font-family: 'Space Mono', monospace;
  color: var(--black-to-white);
}

/* Action buttons */
.btn-sm {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

.perf-value {
  background: rgba(0, 0, 0, 0.45);
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
  font-family: 'Space Mono', monospace;
}

/* Performance colors */
.text-success {
  color: var(--green) !important;
}

.text-danger {
  color: #FF4444 !important;
}

.text-muted {
  color: var(--dark-brown-to-white) !important;
}

/* Footer */
.lb-footer {
  padding: 0.75rem 0;
  margin-top: 0.75rem;
  border-top: 1px solid var(--dark-orange);
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .filters .btn-group {
    width: 100%;
  }

  .filters .btn {
    flex: 1;
  }

  .lb-table th,
  .lb-table td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .principal-id {
    font-size: 0.75rem;
    max-width: 140px;
  }
}
</style>
