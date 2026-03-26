<template>
  <div class="my-distribution-rewards mx-3 mb-4">
    <div class="taco-container taco-container--l1">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 taco-text-brown-to-white">
          <i class="fas fa-coins me-2"></i>
          My Distribution Rewards
        </h5>
        <div class="d-flex align-items-center gap-2">
          <span v-if="totalRewardsEarned > 0n" class="total-badge">
            Total: {{ formatRewardAmount(totalRewardsEarned) }} TACO
          </span>
          <button
            class="btn taco-nav-btn"
            @click="refreshData"
            :disabled="isLoading"
          >
            <i class="fas fa-sync-alt me-1"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && distributions.length === 0" class="text-center py-4">
        <div class="spinner-border" role="status" style="color: var(--brown);">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 rewards-muted">Loading distribution rewards...</p>
      </div>

      <!-- No Neurons State -->
      <div v-else-if="userNeuronIds.length === 0 && !isLoadingUserPerformance" class="text-center py-4">
        <i class="fas fa-coins fa-2x mb-3 rewards-muted"></i>
        <p class="rewards-muted">No neurons found. Participate in distributions to earn rewards.</p>
      </div>

      <!-- No Distributions Found -->
      <div v-else-if="!isLoading && distributions.length === 0 && hasLoaded" class="text-center py-4">
        <i class="fas fa-coins fa-2x mb-3 rewards-muted"></i>
        <p class="rewards-muted">No distribution rewards found for your neurons.</p>
      </div>

      <!-- Data Table -->
      <div v-else-if="distributions.length > 0">
        <div class="table-responsive">
          <table class="rewards-table">
            <thead>
              <tr>
                <th></th>
                <th>Dist #</th>
                <th>Date</th>
                <th>Period</th>
                <th>Your Reward</th>
                <th>Avg Perf</th>
                <th>Your VP</th>
                <th>Neurons</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(dist, index) in distributions" :key="dist.distributionId">
                <!-- Summary Row -->
                <tr class="summary-row" @click="toggleExpand(index)">
                  <td class="expand-cell">
                    <i class="fas" :class="expanded[index] ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                  </td>
                  <td>#{{ dist.distributionId }}</td>
                  <td>{{ formatDate(dist.distributionTime) }}</td>
                  <td>{{ formatDateRange(dist.startTime, dist.endTime) }}</td>
                  <td class="reward-amount">{{ formatRewardAmount(dist.userTotalReward) }}</td>
                  <td :class="getPerformanceClass(dist.avgPerformanceScore)">
                    {{ formatPerformanceScore(dist.avgPerformanceScore) }}
                  </td>
                  <td>{{ formatVotingPower(dist.userTotalVotingPower) }}</td>
                  <td>{{ dist.neuronCount }}</td>
                </tr>
                <!-- Expanded Neuron Detail -->
                <tr v-if="expanded[index]" class="detail-row">
                  <td :colspan="8">
                    <div class="neuron-detail-container">
                      <table class="neuron-detail-table">
                        <thead>
                          <tr>
                            <th>Neuron ID</th>
                            <th>Reward</th>
                            <th>Perf (USD)</th>
                            <th>Perf (ICP)</th>
                            <th>Voting Power</th>
                            <th>Reward Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="nr in dist.neuronRewards" :key="neuronIdToHex(nr.neuronId)">
                            <td><code class="neuron-id">{{ formatNeuronId(nr.neuronId) }}</code></td>
                            <td class="reward-amount">{{ formatRewardAmount(nr.rewardAmount) }}</td>
                            <td :class="getPerformanceClass(nr.performanceScore)">
                              {{ formatPerformanceScore(nr.performanceScore) }}
                            </td>
                            <td :class="getPerformanceClass(nr.performanceScoreICP?.length > 0 ? nr.performanceScoreICP[0] : null)">
                              {{ formatPerformanceScore(nr.performanceScoreICP?.length > 0 ? nr.performanceScoreICP[0] : null) }}
                            </td>
                            <td>{{ formatVotingPower(nr.votingPower) }}</td>
                            <td>{{ nr.rewardScore.toFixed(4) }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div class="pot-info">
                        <small class="rewards-muted">
                          Total distribution pot: {{ formatRewardAmount(dist.totalRewardPot) }} TACO
                        </small>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="rewards-muted">
            Showing {{ distributions.length }} of {{ Number(total) }} distributions
          </small>
          <button
            v-if="hasMore"
            class="btn taco-btn taco-btn--success btn-sm"
            @click="loadMore"
            :disabled="isLoadingMore"
          >
            <i v-if="isLoadingMore" class="fas fa-spinner fa-spin me-1"></i>
            Load More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

export default {
  name: 'MyDistributionRewards',
  props: {
    userNeuronIds: {
      type: Array,
      default: () => []
    },
    isLoadingUserPerformance: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const tacoStore = useTacoStore()

    const rawRecords = ref([])
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const hasMore = ref(false)
    const hasLoaded = ref(false)
    const total = ref(BigInt(0))
    const currentOffset = ref(0)
    const expanded = reactive({})
    const PAGE_SIZE = 20

    // Process raw records into display-ready rows
    const distributions = computed(() => {
      return rawRecords.value.map(record => {
        const rewards = record.neuronRewards || []
        const userTotalReward = rewards.reduce(
          (sum, nr) => sum + BigInt(nr.rewardAmount), BigInt(0)
        )
        const avgPerformanceScore = rewards.length > 0
          ? rewards.reduce((sum, nr) => sum + nr.performanceScore, 0) / rewards.length
          : null
        const userTotalVotingPower = rewards.reduce(
          (sum, nr) => sum + BigInt(nr.votingPower), BigInt(0)
        )

        return {
          distributionId: Number(record.distributionId),
          distributionTime: record.distributionTime,
          startTime: record.startTime,
          endTime: record.endTime,
          totalRewardPot: record.totalRewardPot,
          userTotalReward,
          avgPerformanceScore,
          userTotalVotingPower,
          neuronCount: rewards.length,
          neuronRewards: rewards
        }
      })
    })

    const totalRewardsEarned = computed(() => {
      return distributions.value.reduce(
        (sum, d) => sum + d.userTotalReward, BigInt(0)
      )
    })

    const fetchDistributions = async (reset = true) => {
      if (props.userNeuronIds.length === 0) return

      if (reset) {
        isLoading.value = true
        currentOffset.value = 0
        rawRecords.value = []
      } else {
        isLoadingMore.value = true
      }

      try {
        const actor = await tacoStore.createRewardsActorAnonymous()
        const result = await actor.getUserDistributionRewards(
          props.userNeuronIds,
          BigInt(currentOffset.value),
          BigInt(PAGE_SIZE)
        )

        if (reset) {
          rawRecords.value = result.records
        } else {
          rawRecords.value = [...rawRecords.value, ...result.records]
        }

        currentOffset.value += result.records.length
        hasMore.value = result.hasMore
        total.value = result.total
        hasLoaded.value = true
      } catch (error) {
        console.error('Error loading distribution rewards:', error)
      } finally {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }

    const loadMore = () => fetchDistributions(false)
    const refreshData = () => fetchDistributions(true)

    const toggleExpand = (index) => {
      expanded[index] = !expanded[index]
    }

    // Watch for neuron IDs becoming available
    watch(() => props.userNeuronIds, (newIds, oldIds) => {
      if (newIds.length > 0 && (!oldIds || oldIds.length === 0)) {
        fetchDistributions(true)
      }
    }, { deep: true })

    onMounted(() => {
      if (props.userNeuronIds.length > 0) {
        fetchDistributions(true)
      }
    })

    // ── Formatters ──

    const neuronIdToHex = (neuronId) => {
      const id = neuronId instanceof Uint8Array ? neuronId : new Uint8Array(neuronId)
      return Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const formatNeuronId = (neuronId) => {
      const hex = neuronIdToHex(neuronId)
      return hex.length > 12 ? hex.substring(0, 8) + '...' + hex.substring(hex.length - 4) : hex
    }

    const formatRewardAmount = (amount) => {
      const value = Number(amount) / 1e8
      if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
      if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K'
      if (value >= 1) return value.toFixed(2)
      return value.toFixed(4)
    }

    const formatDate = (timestamp) => {
      try {
        const ms = Number(BigInt(timestamp)) / 1_000_000
        return new Date(ms).toLocaleDateString()
      } catch { return 'N/A' }
    }

    const formatDateRange = (start, end) => {
      return `${formatDate(start)} - ${formatDate(end)}`
    }

    const formatVotingPower = (vp) => {
      if (!vp) return '0'
      const value = Number(vp) / 1e8
      if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B'
      if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
      if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K'
      return value.toFixed(2)
    }

    const formatPerformanceScore = (score) => {
      if (score === null || score === undefined) return 'N/A'
      const pct = (score - 1.0) * 100
      const sign = pct >= 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    const getPerformanceClass = (score) => {
      if (score === null || score === undefined) return 'text-muted'
      return score >= 1.0 ? 'text-success' : 'text-danger'
    }

    return {
      distributions,
      isLoading,
      isLoadingMore,
      hasMore,
      hasLoaded,
      total,
      totalRewardsEarned,
      expanded,
      loadMore,
      refreshData,
      toggleExpand,
      neuronIdToHex,
      formatNeuronId,
      formatRewardAmount,
      formatDate,
      formatDateRange,
      formatVotingPower,
      formatPerformanceScore,
      getPerformanceClass
    }
  }
}
</script>

<style scoped>
.rewards-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
}

.rewards-table thead th {
  background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
  border-bottom: 2px solid var(--card-border);
  color: var(--text-cream);
  padding: 0.6rem 0.75rem;
  text-align: left;
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 600;
}

.rewards-table tbody td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--dark-orange);
  color: var(--brown-to-white);
  vertical-align: middle;
}

.summary-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.summary-row:hover {
  background: rgba(0, 0, 0, 0.1);
}

.expand-cell {
  width: 30px;
  text-align: center;
  color: var(--dark-brown-to-white);
  font-size: 0.7rem;
}

.reward-amount {
  color: var(--green);
  font-weight: 600;
}

.detail-row td {
  padding: 0 !important;
  border-bottom: 2px solid var(--dark-orange);
}

.neuron-detail-container {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.75rem;
  margin: 0;
}

.neuron-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
}

.neuron-detail-table thead th {
  color: var(--dark-brown-to-white);
  padding: 0.4rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-bottom: 1px solid var(--dark-orange);
  text-align: left;
}

.neuron-detail-table tbody td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--brown-to-white);
}

.neuron-id {
  font-size: 0.8rem;
  color: var(--brown-to-white);
}

.pot-info {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--dark-orange);
}

.total-badge {
  background: var(--green);
  color: var(--black);
  border-radius: 0.375rem;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.rewards-muted {
  color: var(--dark-brown-to-white);
}

.text-success {
  color: var(--green) !important;
}

.text-danger {
  color: #FF4444 !important;
}

.text-muted {
  color: var(--dark-brown-to-white) !important;
}

@media (max-width: 576px) {
  .rewards-table {
    font-size: 0.75rem;
  }

  .rewards-table thead th,
  .rewards-table tbody td {
    padding: 0.4rem 0.5rem;
  }

  .neuron-detail-table {
    font-size: 0.7rem;
  }
}
</style>
