<template>
  <div class="my-performance mx-3 mb-4">
    <div class="card bg-dark text-white">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="fas fa-user me-2"></i>
          My Performance
        </h5>
        <div class="d-flex align-items-center gap-2">
          <!-- Chart Toggle -->
          <button
            v-if="userPerformance && !isLoading"
            class="btn btn-sm"
            :class="showChart ? 'btn-info' : 'btn-outline-info'"
            @click="showChart = !showChart"
            title="Toggle performance chart"
          >
            <i class="fas fa-chart-area"></i>
          </button>
          <button
            v-if="!isLoading"
            class="btn btn-outline-primary btn-sm"
            @click="$emit('refresh')"
          >
            <i class="fas fa-sync-alt me-1"></i> Refresh
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading your performance data...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="text-center py-4">
          <i class="fas fa-exclamation-circle text-warning fa-2x mb-3"></i>
          <p class="text-muted">{{ errorMessage }}</p>
        </div>

        <!-- No Data State -->
        <div v-else-if="!userPerformance" class="text-center py-4">
          <i class="fas fa-chart-line text-muted fa-2x mb-3"></i>
          <p class="text-muted">No performance data available yet.</p>
          <p class="text-muted small">Performance is calculated after participating in reward distributions.</p>
        </div>

        <!-- Performance Data -->
        <div v-else>
          <!-- Performance Chart (collapsible) -->
          <div v-if="showChart && principal" class="mb-4">
            <div class="chart-container bg-dark-subtle rounded p-3">
              <PerformanceChart
                :principal="principal"
                :priceType="selectedPriceType"
                :timeframe="selectedTimeframe"
                :height="280"
              />
            </div>
          </div>

          <!-- Summary Stats Row -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="stat-card">
                <small class="text-muted">Total Voting Power</small>
                <div class="h5 mb-0 text-info">
                  {{ formatVotingPower(userPerformance.totalVotingPower) }}
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <small class="text-muted">Distributions Participated</small>
                <div class="h5 mb-0 text-success">
                  {{ Number(userPerformance.distributionsParticipated) }}
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <small class="text-muted">Neurons</small>
                <div class="h5 mb-0 text-warning">
                  {{ userPerformance.neurons?.length || 0 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Grid -->
          <h6 class="text-muted mb-3">Performance by Timeframe</h6>
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
            <h6 class="text-muted mb-3">
              <i class="fas fa-brain me-1"></i>
              Your Neurons ({{ userPerformance.neurons.length }})
            </h6>
            <div class="neurons-list">
              <div
                v-for="neuron in userPerformance.neurons"
                :key="formatNeuronId(neuron.neuronId)"
                class="neuron-card"
              >
                <div class="neuron-header">
                  <code class="text-primary">{{ formatNeuronId(neuron.neuronId) }}</code>
                  <span class="badge bg-info ms-2">
                    VP: {{ formatVotingPower(neuron.votingPower) }}
                  </span>
                </div>
                <div class="neuron-performance">
                  <div class="perf-mini">
                    <span class="label">1W USD</span>
                    <span :class="getPerformanceClass(neuron.performance?.oneWeekUSD)">
                      {{ formatPerformance(neuron.performance?.oneWeekUSD) }}
                    </span>
                  </div>
                  <div class="perf-mini">
                    <span class="label">1M USD</span>
                    <span :class="getPerformanceClass(neuron.performance?.oneMonthUSD)">
                      {{ formatPerformance(neuron.performance?.oneMonthUSD) }}
                    </span>
                  </div>
                  <div class="perf-mini">
                    <span class="label">All-Time</span>
                    <span :class="getPerformanceClass(neuron.performance?.allTimeUSD)">
                      {{ formatPerformance(neuron.performance?.allTimeUSD) }}
                    </span>
                  </div>
                </div>
                <div class="neuron-meta">
                  <small class="text-muted">
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

    // Format voting power
    const formatVotingPower = (vp) => {
      if (!vp) return '0'
      const value = Number(vp)
      if (value >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(2) + 'B'
      }
      if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(2) + 'M'
      }
      if (value >= 1_000) {
        return (value / 1_000).toFixed(1) + 'K'
      }
      return value.toString()
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
.my-performance .card {
  border: 1px solid #333;
}

.chart-container {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #333;
}

.bg-dark-subtle {
  background-color: rgba(255, 255, 255, 0.03) !important;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.performance-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.perf-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.perf-label {
  display: block;
  font-weight: 600;
  color: #888;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
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
  color: #666;
}

.perf-item span:last-child {
  font-weight: 600;
  font-size: 1.1rem;
}

.neurons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.neuron-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
}

.neuron-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.neuron-header code {
  font-size: 0.85rem;
}

.neuron-performance {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.perf-mini {
  display: flex;
  flex-direction: column;
}

.perf-mini .label {
  font-size: 0.7rem;
  color: #666;
}

.perf-mini span:last-child {
  font-weight: 600;
}

.neuron-meta {
  border-top: 1px solid #333;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
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

.text-info {
  color: #63b3ed !important;
}

.text-warning {
  color: #f6e05e !important;
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
