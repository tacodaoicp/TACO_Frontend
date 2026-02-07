<template>
  <div class="my-performance mx-3 mb-4">
    <div class="taco-container taco-container--l1">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 taco-text-brown-to-white">
          <i class="fas fa-user me-2"></i>
          My Performance
        </h5>
        <div class="d-flex align-items-center gap-2">
          <!-- Chart Toggle -->
          <button
            v-if="userPerformance && !isLoading"
            class="btn taco-nav-btn"
            :class="showChart ? 'taco-nav-btn--active' : ''"
            @click="showChart = !showChart"
            title="Toggle performance chart"
          >
            <i class="fas fa-chart-area"></i>
          </button>
          <button
            v-if="!isLoading"
            class="btn taco-nav-btn"
            @click="$emit('refresh')"
          >
            <i class="fas fa-sync-alt me-1"></i> Refresh
          </button>
        </div>
      </div>

      <div>
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-4">
          <div class="spinner-border" role="status" style="color: var(--brown);">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 perf-muted">Loading your performance data...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="text-center py-4">
          <i class="fas fa-exclamation-circle fa-2x mb-3" style="color: var(--dark-orange);"></i>
          <p class="perf-muted">{{ errorMessage }}</p>
        </div>

        <!-- No Data State -->
        <div v-else-if="!userPerformance" class="text-center py-4">
          <i class="fas fa-chart-line fa-2x mb-3 perf-muted"></i>
          <p class="perf-muted">No performance data available yet.</p>
          <p class="perf-muted small">Performance is calculated after participating in reward distributions.</p>
        </div>

        <!-- Performance Data -->
        <div v-else>
          <!-- Performance Chart (collapsible) -->
          <div v-if="showChart && principal" class="mb-4">
            <div class="chart-container">
              <PerformanceChart
                :principal="principal"
                :height="280"
              />
            </div>
          </div>

          <!-- Summary Stats Row -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="stat-card">
                <small class="perf-muted">Total Voting Power</small>
                <div class="h5 mb-0 perf-positive">
                  {{ formatVotingPower(userPerformance.totalVotingPower) }}
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <small class="perf-muted">Distributions Participated</small>
                <div class="h5 mb-0 perf-positive">
                  {{ Number(userPerformance.distributionsParticipated) }}
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <small class="perf-muted">Neurons</small>
                <div class="h5 mb-0 perf-positive">
                  {{ userPerformance.neurons?.length || 0 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Grid -->
          <h6 class="perf-muted mb-3">Performance by Timeframe</h6>
          <div class="performance-grid mb-4">
            <!-- USD Performance -->
            <div class="perf-section">
              <span class="perf-label">USD</span>
              <div class="perf-row">
                <div class="perf-item">
                  <span class="perf-timeframe">1 Week</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.oneWeekUSD)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.oneWeekUSD) }}
                  </span>
                </div>
                <div class="perf-item">
                  <span class="perf-timeframe">1 Month</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.oneMonthUSD)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.oneMonthUSD) }}
                  </span>
                </div>
                <div class="perf-item">
                  <span class="perf-timeframe">1 Year</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.oneYearUSD)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.oneYearUSD) }}
                  </span>
                </div>
                <div class="perf-item">
                  <span class="perf-timeframe">All-Time</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.allTimeUSD)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.allTimeUSD) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- ICP Performance -->
            <div class="perf-section">
              <span class="perf-label">ICP</span>
              <div class="perf-row">
                <div class="perf-item">
                  <span class="perf-timeframe">1 Week</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.oneWeekICP)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.oneWeekICP) }}
                  </span>
                </div>
                <div class="perf-item">
                  <span class="perf-timeframe">1 Month</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.oneMonthICP)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.oneMonthICP) }}
                  </span>
                </div>
                <div class="perf-item">
                  <span class="perf-timeframe">1 Year</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.oneYearICP)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.oneYearICP) }}
                  </span>
                </div>
                <div class="perf-item">
                  <span class="perf-timeframe">All-Time</span>
                  <span :class="getPerformanceClass(userPerformance.aggregatedPerformance?.allTimeICP)">
                    {{ formatPerformance(userPerformance.aggregatedPerformance?.allTimeICP) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Neurons Section -->
          <div v-if="userPerformance.neurons && userPerformance.neurons.length > 0">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="perf-muted mb-0">
                <i class="fas fa-brain me-1"></i>
                Your Neurons ({{ userPerformance.neurons.length }})
              </h6>
              <small class="perf-legend">Performance: USD / ICP</small>
            </div>
            <div class="neurons-list">
              <div
                v-for="neuron in userPerformance.neurons"
                :key="formatNeuronId(neuron.neuronId)"
                class="neuron-card"
              >
                <div class="neuron-header">
                  <code class="neuron-id">{{ formatNeuronId(neuron.neuronId) }}</code>
                  <span class="neuron-badge ms-2">
                    VP: {{ formatVotingPower(neuron.votingPower) }}
                  </span>
                </div>
                <div class="neuron-performance">
                  <div class="perf-mini">
                    <span class="label">All-Time</span>
                    <span class="perf-values">
                      <span :class="getPerformanceClass(neuron.performance?.allTimeUSD)">
                        {{ formatPerformance(neuron.performance?.allTimeUSD) }}
                      </span>
                      <span class="perf-separator">/</span>
                      <span :class="getPerformanceClass(neuron.performance?.allTimeICP)">
                        {{ formatPerformance(neuron.performance?.allTimeICP) }}
                      </span>
                    </span>
                  </div>
                  <div class="perf-mini">
                    <span class="label">1Y</span>
                    <span class="perf-values">
                      <span :class="getPerformanceClass(neuron.performance?.oneYearUSD)">
                        {{ formatPerformance(neuron.performance?.oneYearUSD) }}
                      </span>
                      <span class="perf-separator">/</span>
                      <span :class="getPerformanceClass(neuron.performance?.oneYearICP)">
                        {{ formatPerformance(neuron.performance?.oneYearICP) }}
                      </span>
                    </span>
                  </div>
                  <div class="perf-mini">
                    <span class="label">1M</span>
                    <span class="perf-values">
                      <span :class="getPerformanceClass(neuron.performance?.oneMonthUSD)">
                        {{ formatPerformance(neuron.performance?.oneMonthUSD) }}
                      </span>
                      <span class="perf-separator">/</span>
                      <span :class="getPerformanceClass(neuron.performance?.oneMonthICP)">
                        {{ formatPerformance(neuron.performance?.oneMonthICP) }}
                      </span>
                    </span>
                  </div>
                  <div class="perf-mini">
                    <span class="label">1W</span>
                    <span class="perf-values">
                      <span :class="getPerformanceClass(neuron.performance?.oneWeekUSD)">
                        {{ formatPerformance(neuron.performance?.oneWeekUSD) }}
                      </span>
                      <span class="perf-separator">/</span>
                      <span :class="getPerformanceClass(neuron.performance?.oneWeekICP)">
                        {{ formatPerformance(neuron.performance?.oneWeekICP) }}
                      </span>
                    </span>
                  </div>
                </div>
                <div class="neuron-meta">
                  <small class="perf-muted">
                    {{ Number(neuron.distributionsParticipated) }} distributions
                  </small>
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
import { ref } from 'vue'
import PerformanceChart from './PerformanceChart.vue'

export default {
  name: 'MyPerformance',
  components: {
    PerformanceChart
  },
  props: {
    userPerformance: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: ''
    },
    // User's principal for chart
    principal: {
      type: String,
      default: ''
    },
    // Current filter selections from parent
    selectedPriceType: {
      type: String,
      default: 'USD'
    },
    selectedTimeframe: {
      type: String,
      default: 'AllTime'
    }
  },
  emits: ['refresh'],

  setup() {
    // Toggle chart visibility
    const showChart = ref(true)
    // Format performance score to percentage
    const formatPerformance = (score) => {
      if (score === null || score === undefined) return 'N/A'

      // Handle optional array format from candid
      const value = Array.isArray(score) ? (score.length > 0 ? score[0] : null) : score
      if (value === null || value === undefined) return 'N/A'

      const pct = (value - 1.0) * 100
      const sign = pct >= 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    // Get CSS class based on performance
    const getPerformanceClass = (score) => {
      if (score === null || score === undefined) return 'text-muted'

      const value = Array.isArray(score) ? (score.length > 0 ? score[0] : null) : score
      if (value === null || value === undefined) return 'text-muted'

      if (value >= 1.0) return 'text-success'
      return 'text-danger'
    }

    // Format voting power (divide by 10^8 to get actual VP)
    const formatVotingPower = (vp) => {
      if (!vp) return '0'
      const value = Number(vp) / 1e8
      if (value >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(2) + 'B'
      }
      if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(2) + 'M'
      }
      if (value >= 1_000) {
        return (value / 1_000).toFixed(1) + 'K'
      }
      return value.toFixed(2)
    }

    // Format neuron ID
    const formatNeuronId = (neuronId) => {
      if (!neuronId) return 'Unknown'
      try {
        const id = neuronId instanceof Uint8Array ? neuronId : new Uint8Array(neuronId)
        const hex = Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('')
        return hex.length > 12 ? hex.substring(0, 8) + '...' + hex.substring(hex.length - 4) : hex
      } catch (error) {
        return 'Unknown'
      }
    }

    return {
      showChart,
      formatPerformance,
      getPerformanceClass,
      formatVotingPower,
      formatNeuronId
    }
  }
}
</script>

<style scoped>
.chart-container {
  background: color-mix(in srgb, var(--yellow-to-brown) 85%, #000);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.stat-card {
  background: var(--orange-to-light-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.performance-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.perf-section {
  background: var(--orange-to-light-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}

.perf-label {
  display: block;
  font-weight: 600;
  color: var(--brown-to-white);
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-family: 'Space Mono', monospace;
}

.perf-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.perf-item {
  display: flex;
  flex-direction: column;
  min-width: 80px;
}

.perf-timeframe {
  font-size: 0.75rem;
  color: var(--dark-brown-to-white);
  font-family: 'Space Mono', monospace;
}

.perf-item span:last-child {
  font-weight: 600;
  font-size: 1.1rem;
  font-family: 'Space Mono', monospace;
  background: rgba(0, 0, 0, 0.45);
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
}

.perf-muted {
  color: var(--dark-brown-to-white);
}

.perf-positive {
  color: var(--green);
}

.neurons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.neuron-card {
  background: var(--orange-to-light-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  padding: 1rem;
}

.neuron-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.neuron-id {
  font-size: 0.85rem;
  color: var(--brown-to-white);
}

.neuron-badge {
  background: var(--yellow);
  color: var(--black);
  border: 1px solid var(--dark-orange);
  border-radius: 0.375rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.neuron-performance {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.perf-mini {
  display: flex;
  flex-direction: column;
}

.perf-mini .label {
  font-size: 0.7rem;
  color: var(--dark-brown-to-white);
  font-family: 'Space Mono', monospace;
}

.perf-values {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
  background: rgba(0, 0, 0, 0.45);
  padding: 0.1rem 0.4rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}

.perf-separator {
  color: var(--brown-to-white);
  opacity: 0.5;
  font-weight: 400;
}

.perf-legend {
  color: var(--dark-brown-to-white);
  font-family: 'Space Mono', monospace;
}

.neuron-meta {
  border-top: 1px solid var(--dark-orange);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

/* Performance text colors - theme aware */
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
  .perf-row {
    gap: 0.5rem;
  }

  .perf-item {
    min-width: 70px;
  }

  .neurons-list {
    grid-template-columns: 1fr;
  }
}
</style>
