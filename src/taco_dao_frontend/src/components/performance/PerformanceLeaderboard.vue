<template>
  <div class="performance-leaderboard mx-3 mb-4">
    <div class="card bg-dark text-white">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 class="mb-0">
            <i class="fas fa-trophy me-2 text-warning"></i>
            Top 100 Performers
          </h5>

          <!-- Last Updated -->
          <small v-if="leaderboardInfo" class="text-muted">
            Updated: {{ formatTimestamp(leaderboardInfo.lastUpdate) }}
          </small>
        </div>

        <!-- Filters -->
        <div class="filters mt-3 d-flex flex-wrap gap-2">
          <!-- Timeframe Filters -->
          <div class="btn-group" role="group">
            <button
              v-for="tf in timeframes"
              :key="tf.value"
              type="button"
              class="btn btn-sm"
              :class="selectedTimeframe === tf.value ? 'btn-primary' : 'btn-outline-secondary'"
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
              class="btn btn-sm"
              :class="selectedPriceType === pt.value ? 'btn-warning' : 'btn-outline-secondary'"
              @click="$emit('price-type-change', pt.value)"
            >
              {{ pt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading leaderboard...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!leaderboardEntries || leaderboardEntries.length === 0" class="text-center py-5">
          <i class="fas fa-trophy text-muted fa-3x mb-3"></i>
          <h5 class="text-muted">No Leaderboard Data Yet</h5>
          <p class="text-muted">Performance data will appear after reward distributions.</p>
        </div>

        <!-- Leaderboard Table -->
        <div v-else class="table-responsive">
          <table class="table table-dark table-hover mb-0">
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
                    <span class="badge" :class="getRankBadgeClass(Number(entry.rank))">
                      {{ Number(entry.rank) }}
                    </span>
                  </td>

                  <!-- User Principal -->
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <i
                        class="fas fa-chevron-right expand-icon"
                        :class="{ 'rotated': isExpanded(entry.principal) }"
                      ></i>
                      <code class="principal-id" :title="entry.principal.toString()">
                        {{ formatPrincipal(entry.principal) }}
                      </code>
                      <span v-if="isCurrentUser(entry.principal)" class="badge bg-info">You</span>
                    </div>
                  </td>

                  <!-- Performance Return -->
                  <td class="text-end">
                    <span :class="getPerformanceClass(entry.performanceScore)" class="fw-bold">
                      {{ formatPerformance(entry.performanceScore) }}
                    </span>
                  </td>

                  <!-- Distributions Count -->
                  <td class="text-center">
                    <span class="text-muted">{{ Number(entry.distributionsCount) }}</span>
                  </td>

                  <!-- Followers -->
                  <td class="text-center">
                    <span v-if="followerInfos[index]" class="follower-count">
                      {{ Number(followerInfos[index].followerCount) }}/500
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>

                  <!-- Follow Action -->
                  <td class="text-center" @click.stop>
                    <template v-if="userLoggedIn && !isCurrentUser(entry.principal)">
                      <!-- Already following -->
                      <button
                        v-if="isFollowing(entry.principal)"
                        class="btn btn-sm btn-outline-danger"
                        @click="$emit('unfollow', entry.principal.toString())"
                        title="Unfollow this user"
                      >
                        Unfollow
                      </button>

                      <!-- Can follow -->
                      <button
                        v-else-if="canFollow(index)"
                        class="btn btn-sm btn-outline-success"
                        @click="$emit('follow', entry.principal.toString())"
                        title="Follow this user's allocations"
                      >
                        Follow
                      </button>

                      <!-- Cannot follow (at capacity) -->
                      <span
                        v-else
                        class="badge bg-secondary"
                        title="This user has reached maximum followers"
                      >
                        FULL
                      </span>
                    </template>

                    <!-- Not logged in or self -->
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>

                <!-- Expanded Chart Row -->
                <tr v-if="isExpanded(entry.principal)" class="expanded-content-row">
                  <td colspan="6" class="p-0">
                    <div class="expanded-chart-container">
                      <PerformanceChart
                        :principal="entry.principal.toString()"
                        :priceType="selectedPriceType"
                        :timeframe="selectedTimeframe"
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
        <div v-if="leaderboardInfo && leaderboardEntries.length > 0" class="card-footer bg-transparent border-top">
          <small class="text-muted">
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
        return str.substring(0, 8) + '...' + str.substring(str.length - 4)
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
      if (rank === 1) return 'bg-warning text-dark'
      if (rank === 2) return 'bg-secondary'
      if (rank === 3) return 'bg-warning-subtle text-dark'
      if (rank <= 10) return 'bg-info'
      return 'bg-dark border'
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
.performance-leaderboard .card {
  border: 1px solid #333;
}

.filters .btn-group {
  flex-wrap: nowrap;
}

.filters .btn {
  padding: 0.25rem 0.75rem;
}

/* Table styling */
.table {
  margin-bottom: 0;
}

.table th {
  border-top: none;
  border-bottom: 2px solid #444;
  font-weight: 600;
  font-size: 0.85rem;
  color: #aaa;
  padding: 0.75rem;
}

.table td {
  vertical-align: middle;
  padding: 0.75rem;
  border-color: #333;
}

.table-hover tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.highlight-row {
  background-color: rgba(99, 179, 237, 0.1) !important;
}

/* Expandable rows */
.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable-row:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.expanded-row {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border-bottom: none !important;
}

.expanded-row td {
  border-bottom: none !important;
}

.expand-icon {
  font-size: 0.7rem;
  color: #666;
  transition: transform 0.2s ease;
  width: 12px;
}

.expand-icon.rotated {
  transform: rotate(90deg);
}

.expanded-content-row {
  background-color: rgba(0, 0, 0, 0.3) !important;
}

.expanded-content-row:hover {
  background-color: rgba(0, 0, 0, 0.3) !important;
}

.expanded-chart-container {
  padding: 1rem;
  border-top: 1px solid #222;
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%);
}

/* Principal styling */
.principal-id {
  font-size: 0.85rem;
  color: #63b3ed;
}

/* Rank badges */
.badge {
  font-size: 0.8rem;
  min-width: 32px;
}

.bg-warning-subtle {
  background-color: #cd7f32 !important;
}

/* Follower count */
.follower-count {
  font-size: 0.85rem;
}

/* Action buttons */
.btn-sm {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

/* Performance colors */
.text-success {
  color: #68d391 !important;
}

.text-danger {
  color: #fc8181 !important;
}

/* Card footer */
.card-footer {
  padding: 0.75rem 1rem;
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

  .table th,
  .table td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .principal-id {
    font-size: 0.75rem;
  }
}
</style>
