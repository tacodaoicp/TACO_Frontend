<template>
  <div class="my-following mx-3 mb-4">
    <div class="card bg-dark text-white">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="fas fa-users me-2"></i>
          Following ({{ follows.length }}/3)
        </h5>
        <small class="text-muted">Your allocation copies</small>
      </div>

      <div class="card-body">
        <!-- Not logged in -->
        <div v-if="!userLoggedIn" class="text-center py-4">
          <i class="fas fa-lock text-muted fa-2x mb-3"></i>
          <p class="text-muted">Log in to see who you're following</p>
        </div>

        <!-- Loading State -->
        <div v-else-if="isLoading" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-2 text-muted">Loading follows...</span>
        </div>

        <!-- No follows -->
        <div v-else-if="follows.length === 0" class="text-center py-4">
          <i class="fas fa-user-plus text-muted fa-2x mb-3"></i>
          <p class="text-muted mb-2">Not following anyone yet</p>
          <p class="text-muted small">
            Follow top performers from the leaderboard above to copy their allocations.
          </p>
        </div>

        <!-- Follows List -->
        <div v-else class="follows-list">
          <div
            v-for="(follow, index) in follows"
            :key="follow.principal"
            class="follow-card"
          >
            <!-- Header Row -->
            <div class="follow-header">
              <div class="d-flex align-items-center gap-2">
                <i
                  class="fas fa-chevron-right expand-icon"
                  :class="{ 'rotated': isExpanded(follow.principal) }"
                  @click="toggleExpanded(follow.principal)"
                ></i>
                <code class="principal-id" :title="follow.principal">
                  {{ formatPrincipal(follow.principal) }}
                </code>
                <!-- Rank badge if on leaderboard -->
                <span v-if="getLeaderboardRank(follow.principal)" class="badge bg-warning text-dark">
                  #{{ getLeaderboardRank(follow.principal) }}
                </span>
              </div>

              <div class="d-flex align-items-center gap-3">
                <!-- Performance from leaderboard -->
                <span
                  v-if="getLeaderboardEntry(follow.principal)"
                  :class="getPerformanceClass(getLeaderboardEntry(follow.principal).performanceScore)"
                  class="fw-bold"
                >
                  {{ formatPerformance(getLeaderboardEntry(follow.principal).performanceScore) }}
                </span>
                <span v-else class="text-muted">-</span>

                <!-- Unfollow button -->
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click="$emit('unfollow', follow.principal)"
                  title="Unfollow this user"
                >
                  <i class="fas fa-user-minus"></i>
                </button>
              </div>
            </div>

            <!-- Meta row -->
            <div class="follow-meta">
              <small class="text-muted">
                <i class="fas fa-calendar-alt me-1"></i>
                Following since {{ formatDate(follow.since) }}
              </small>
              <small v-if="getLeaderboardEntry(follow.principal)" class="text-muted">
                <i class="fas fa-chart-bar me-1"></i>
                {{ Number(getLeaderboardEntry(follow.principal).distributionsCount) }} distributions
              </small>
            </div>

            <!-- Expandable Chart -->
            <div v-if="isExpanded(follow.principal)" class="follow-chart">
              <PerformanceChart
                :principal="follow.principal"
                :priceType="selectedPriceType"
                :timeframe="selectedTimeframe"
                :height="200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import PerformanceChart from './PerformanceChart.vue'

export default {
  name: 'MyFollowing',
  components: {
    PerformanceChart
  },
  props: {
    // Array of { principal: string, since: bigint }
    follows: {
      type: Array,
      default: () => []
    },
    // Leaderboard entries for looking up performance
    leaderboardEntries: {
      type: Array,
      default: () => []
    },
    userLoggedIn: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    selectedPriceType: {
      type: String,
      default: 'USD'
    },
    selectedTimeframe: {
      type: String,
      default: 'AllTime'
    }
  },
  emits: ['unfollow'],

  setup(props) {
    // Track expanded cards
    const expandedPrincipal = ref(null)

    const toggleExpanded = (principal) => {
      if (expandedPrincipal.value === principal) {
        expandedPrincipal.value = null
      } else {
        expandedPrincipal.value = principal
      }
    }

    const isExpanded = (principal) => {
      return expandedPrincipal.value === principal
    }

    // Get leaderboard entry for a principal
    const getLeaderboardEntry = (principal) => {
      return props.leaderboardEntries.find(e => e.principal.toString() === principal)
    }

    // Get rank from leaderboard
    const getLeaderboardRank = (principal) => {
      const entry = getLeaderboardEntry(principal)
      return entry ? Number(entry.rank) : null
    }

    // Format principal for display
    const formatPrincipal = (principal) => {
      if (principal.length > 20) {
        return principal.substring(0, 8) + '...' + principal.substring(principal.length - 4)
      }
      return principal
    }

    // Format performance score
    const formatPerformance = (score) => {
      if (score === null || score === undefined) return 'N/A'
      const pct = (score - 1.0) * 100
      const sign = pct >= 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    // Get CSS class for performance
    const getPerformanceClass = (score) => {
      if (score === null || score === undefined) return 'text-muted'
      if (score >= 1.0) return 'text-success'
      return 'text-danger'
    }

    // Format date from nanoseconds
    const formatDate = (timestampNS) => {
      if (!timestampNS) return 'Unknown'
      try {
        const timestampMS = Number(timestampNS) / 1_000_000
        const date = new Date(timestampMS)
        return date.toLocaleDateString()
      } catch (error) {
        return 'Unknown'
      }
    }

    return {
      expandedPrincipal,
      toggleExpanded,
      isExpanded,
      getLeaderboardEntry,
      getLeaderboardRank,
      formatPrincipal,
      formatPerformance,
      getPerformanceClass,
      formatDate
    }
  }
}
</script>

<style scoped>
.my-following .card {
  border: 1px solid #333;
}

.follows-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.follow-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
}

.follow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.expand-icon {
  font-size: 0.7rem;
  color: #666;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 12px;
}

.expand-icon:hover {
  color: #888;
}

.expand-icon.rotated {
  transform: rotate(90deg);
}

.principal-id {
  font-size: 0.85rem;
  color: #63b3ed;
}

.follow-meta {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #333;
  margin-top: 0.5rem;
}

.follow-chart {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 0.75rem;
}

/* Text colors */
.text-success {
  color: #68d391 !important;
}

.text-danger {
  color: #fc8181 !important;
}

.text-muted {
  color: #718096 !important;
}

/* Responsive */
@media (max-width: 576px) {
  .follow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .follow-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
