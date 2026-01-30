<template>
  <!-- Full standalone mode (with wrapper + header) -->
  <div v-if="!inline" class="my-following mx-3 mb-4">
    <div class="taco-container taco-container--l1">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 taco-text-brown-to-white">
          <i class="fas fa-users me-2"></i>
          Following ({{ follows.length }}/3)
        </h5>
        <small class="fol-muted">Your allocation copies</small>
      </div>

      <div>
        <!-- Not logged in -->
        <div v-if="!userLoggedIn" class="text-center py-4">
          <i class="fas fa-lock fa-2x mb-3 fol-muted"></i>
          <p class="fol-muted">Log in to see who you're following</p>
        </div>

        <!-- Loading State -->
        <div v-else-if="isLoading" class="text-center py-4">
          <div class="spinner-border spinner-border-sm" role="status" style="color: var(--brown);">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-2 fol-muted">Loading follows...</span>
        </div>

        <!-- No follows -->
        <div v-else-if="follows.length === 0" class="text-center py-4">
          <i class="fas fa-user-plus fa-2x mb-3 fol-muted"></i>
          <p class="fol-muted mb-2">Not following anyone yet</p>
          <p class="fol-muted small">
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
                  {{ follow.principal }}
                </code>
                <!-- Rank badge if on leaderboard -->
                <span v-if="getLeaderboardRank(follow.principal)" class="rank-badge">
                  #{{ getLeaderboardRank(follow.principal) }}
                </span>
              </div>

              <div class="d-flex align-items-center gap-3">
                <!-- Performance from leaderboard -->
                <span
                  v-if="getLeaderboardEntry(follow.principal)"
                  :class="getPerformanceClass(getLeaderboardEntry(follow.principal).performanceScore)"
                  class="fw-bold perf-value"
                >
                  {{ formatPerformance(getLeaderboardEntry(follow.principal).performanceScore) }}
                </span>
                <span v-else class="fol-muted">-</span>

                <!-- Unfollow button -->
                <button
                  class="btn taco-btn taco-btn--danger btn-sm"
                  @click="$emit('unfollow', follow.principal)"
                  title="Unfollow this user"
                >
                  <i class="fas fa-user-minus"></i>
                </button>
              </div>
            </div>

            <!-- Meta row -->
            <div class="follow-meta">
              <small class="fol-muted">
                <i class="fas fa-calendar-alt me-1"></i>
                Following since {{ formatDate(follow.since) }}
              </small>
              <small v-if="getLeaderboardEntry(follow.principal)" class="fol-muted">
                <i class="fas fa-chart-bar me-1"></i>
                {{ Number(getLeaderboardEntry(follow.principal).distributionsCount) }} distributions
              </small>
            </div>

            <!-- Expandable Chart -->
            <div v-if="isExpanded(follow.principal)" class="follow-chart">
              <PerformanceChart
                :principal="follow.principal"
                :height="200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Inline mode (no wrapper, parent provides container + header) -->
  <div v-else class="my-following-inline">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm" role="status" style="color: var(--brown);">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2 fol-muted">Loading follows...</span>
    </div>

    <!-- No follows -->
    <div v-else-if="follows.length === 0" class="text-center py-3">
      <i class="fas fa-user-plus fa-2x mb-3 fol-muted"></i>
      <p class="fol-muted mb-2">Not following anyone yet</p>
      <p class="fol-muted small">
        Follow top performers from the leaderboard to copy their allocations.
      </p>
    </div>

    <!-- Follows List -->
    <div v-else class="follows-list">
      <div
        v-for="(follow, index) in follows"
        :key="follow.principal"
        class="follow-card"
      >
        <div class="follow-header">
          <div class="d-flex align-items-center gap-2">
            <i
              class="fas fa-chevron-right expand-icon"
              :class="{ 'rotated': isExpanded(follow.principal) }"
              @click="toggleExpanded(follow.principal)"
            ></i>
            <code class="principal-id" :title="follow.principal">
              {{ follow.principal }}
            </code>
            <span v-if="getLeaderboardRank(follow.principal)" class="rank-badge">
              #{{ getLeaderboardRank(follow.principal) }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-3">
            <span
              v-if="getLeaderboardEntry(follow.principal)"
              :class="getPerformanceClass(getLeaderboardEntry(follow.principal).performanceScore)"
              class="fw-bold perf-value"
            >
              {{ formatPerformance(getLeaderboardEntry(follow.principal).performanceScore) }}
            </span>
            <span v-else class="fol-muted">-</span>

            <button
              class="btn taco-btn taco-btn--danger btn-sm"
              @click="$emit('unfollow', follow.principal)"
              title="Unfollow this user"
            >
              <i class="fas fa-user-minus"></i>
            </button>
          </div>
        </div>

        <div class="follow-meta">
          <small class="fol-muted">
            <i class="fas fa-calendar-alt me-1"></i>
            Following since {{ formatDate(follow.since) }}
          </small>
          <small v-if="getLeaderboardEntry(follow.principal)" class="fol-muted">
            <i class="fas fa-chart-bar me-1"></i>
            {{ Number(getLeaderboardEntry(follow.principal).distributionsCount) }} distributions
          </small>
        </div>

        <div v-if="isExpanded(follow.principal)" class="follow-chart">
          <PerformanceChart
            :principal="follow.principal"
            :height="200"
          />
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
    inline: {
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
        return principal.substring(0, 10) + '...' + principal.substring(principal.length - 6)
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
.follows-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.follow-card {
  background: var(--orange-to-light-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
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
  color: var(--dark-brown-to-white);
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 12px;
}

.expand-icon:hover {
  color: var(--brown-to-white);
}

.expand-icon.rotated {
  transform: rotate(90deg);
}

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

.rank-badge {
  background: var(--yellow);
  color: var(--black);
  border: 1px solid var(--dark-orange);
  border-radius: 0.375rem;
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.follow-meta {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--dark-orange);
  margin-top: 0.5rem;
}

.follow-chart {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--dark-orange);
  background: color-mix(in srgb, var(--yellow-to-brown) 85%, #000);
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.fol-muted {
  color: var(--dark-brown-to-white);
}

.perf-value {
  background: rgba(0, 0, 0, 0.45);
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
  font-family: 'Space Mono', monospace;
}

/* Text colors */
.text-success {
  color: var(--green) !important;
}

.text-danger {
  color: #FF4444 !important;
}

.text-muted {
  color: var(--dark-brown-to-white) !important;
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
