<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🎯" title="Rewards Distribution Management" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Distribution Controls -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Distribution Controls</h3>
            </div>
            <div class="card-body">
              <!-- Quick Actions -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <button 
                    class="btn btn-success w-100 mb-3" 
                    @click="triggerDistribution"
                    :disabled="isLoading || distributionInProgress"
                  >
                    <span v-if="isLoading && currentAction === 'trigger'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    🚀 Trigger Default Distribution
                  </button>
                </div>
                <div class="col-md-4">
                  <button 
                    class="btn btn-primary w-100 mb-3" 
                    @click="startDistributionTimer"
                    :disabled="isLoading || timerRunning"
                  >
                    <span v-if="isLoading && currentAction === 'start'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    ⏰ Start Auto Timer
                  </button>
                </div>
                <div class="col-md-4">
                  <button 
                    class="btn btn-warning w-100 mb-3" 
                    @click="stopDistributionTimer"
                    :disabled="isLoading || !timerRunning"
                  >
                    <span v-if="isLoading && currentAction === 'stop'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    ⏹️ Stop Auto Timer
                  </button>
                </div>
              </div>

              <!-- Custom Distribution Parameters -->
              <div class="border-top pt-3">
                <h5 class="mb-3">Custom Distribution</h5>
                <div class="row">
                  <div class="col-md-4">
                    <label for="customStartTime" class="form-label">Start Time:</label>
                    <input 
                      id="customStartTime" 
                      type="datetime-local" 
                      class="form-control bg-dark text-white" 
                      v-model="customStartTime"
                    />
                  </div>
                  <div class="col-md-4">
                    <label for="customEndTime" class="form-label">End Time:</label>
                    <input 
                      id="customEndTime" 
                      type="datetime-local" 
                      class="form-control bg-dark text-white" 
                      v-model="customEndTime"
                    />
                  </div>
                  <div class="col-md-4">
                    <label for="priceType" class="form-label">Price Denomination:</label>
                    <select 
                      id="priceType" 
                      class="form-select bg-dark text-white" 
                      v-model="selectedPriceType"
                    >
                      <option value="USD">USD</option>
                      <option value="ICP">ICP</option>
                    </select>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-12">
                    <button 
                      class="btn btn-info w-100" 
                      @click="triggerCustomDistribution"
                      :disabled="isLoading || distributionInProgress || !isValidCustomInput"
                    >
                      <span v-if="isLoading && currentAction === 'triggerCustom'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      🎯 Trigger Custom Distribution
                    </button>
                    <small v-if="!isValidCustomInput" class="text-warning">
                      Please set valid start and end times (start must be before end)
                    </small>
                  </div>
                </div>
              </div>
              
              <!-- Configuration Controls -->
              <div class="row">
                <div class="col-md-6">
                  <label for="rewardPot" class="form-label">Weekly Reward Pot:</label>
                  <div class="input-group">
                    <input 
                      id="rewardPot" 
                      type="number" 
                      class="form-control bg-dark text-white" 
                      v-model.number="newRewardPot"
                      step="0.01"
                      min="0"
                    />
                    <button 
                      class="btn btn-outline-primary" 
                      @click="updateRewardPot"
                      :disabled="isLoading"
                    >
                      Update
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <label for="distributionPeriod" class="form-label">Distribution Period (days):</label>
                  <div class="input-group">
                    <input 
                      id="distributionPeriod" 
                      type="number" 
                      class="form-control bg-dark text-white" 
                      v-model.number="newDistributionPeriod"
                      step="1"
                      min="1"
                    />
                    <button 
                      class="btn btn-outline-primary" 
                      @click="updateDistributionPeriod"
                      :disabled="isLoading"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Status -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Distribution Status</h3>
            </div>
            <div class="card-body">
              <div class="row" v-if="distributionStatus">
                <div class="col-md-3">
                  <strong>Current Status:</strong><br>
                  <span :class="distributionInProgress ? 'text-warning' : 'text-success'">
                    {{ distributionInProgress ? '🔄 In Progress' : '✅ Idle' }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Last Distribution:</strong><br>
                  <span class="text-info">
                    {{ formatTimestamp(distributionStatus.lastDistributionTime) }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Next Scheduled:</strong><br>
                  <span class="text-info">
                    {{ formatTimestamp(nextDistributionTime) }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Total Distributions:</strong><br>
                  <span class="text-success">{{ distributionStatus.totalDistributions }}</span>
                </div>
              </div>
              <div class="row mt-3" v-if="configuration">
                <div class="col-md-4">
                  <strong>Current Reward Pot:</strong><br>
                  <span class="text-success">{{ configuration.weeklyRewardPot }} tokens</span>
                </div>
                <div class="col-md-4">
                  <strong>Distribution Period:</strong><br>
                  <span class="text-info">{{ Math.round(Number(configuration.distributionPeriodNS) / (24 * 60 * 60 * 1_000_000_000)) }} days</span>
                </div>
                <div class="col-md-4">
                  <strong>Auto Timer:</strong><br>
                  <span :class="distributionStatus?.distributionEnabled ? 'text-success' : 'text-warning'">
                    {{ distributionStatus?.distributionEnabled ? '✅ Enabled' : '⚠️ Disabled' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            <strong>Error:</strong> {{ errorMessage }}
          </div>

          <!-- Success Display -->
          <div v-if="successMessage" class="alert alert-success" role="alert">
            <strong>Success:</strong> {{ successMessage }}
          </div>

          <!-- Distribution History -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Distribution History</h3>
              <button 
                class="btn btn-outline-primary btn-sm" 
                @click="refreshHistory"
                :disabled="isLoading"
              >
                <span v-if="isLoading && currentAction === 'refresh'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                🔄 Refresh
              </button>
            </div>
            <div class="card-body">
              <div v-if="distributionHistory && distributionHistory.length > 0">
                <div v-for="(distribution, index) in distributionHistory" :key="distribution.id" class="distribution-record mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="mb-0">
                      Distribution #{{ distribution.id }}
                      <span 
                        class="badge ms-2" 
                        :class="getStatusBadgeClass(distribution.status)"
                      >
                        {{ getStatusText(distribution.status) }}
                      </span>
                    </h5>
                    <small class="text-muted">
                      {{ formatTimestamp(distribution.distributionTime) }}
                    </small>
                  </div>
                  
                  <div class="row">
                    <div class="col-md-3">
                      <strong>Period:</strong><br>
                      <small>
                        {{ formatTimestamp(distribution.startTime) }}<br>
                        to {{ formatTimestamp(distribution.endTime) }}
                      </small>
                    </div>
                    <div class="col-md-3">
                      <strong>Neurons Processed:</strong><br>
                      <span class="text-info">{{ distribution.neuronsProcessed }}</span>
                      <span v-if="isInProgress(distribution.status)" class="text-warning">
                        / {{ distribution.status.InProgress?.totalNeurons || '?' }}
                      </span>
                    </div>
                    <div class="col-md-3">
                      <strong>Total Reward Pot:</strong><br>
                      <span class="text-success">{{ distribution.totalRewardPot }} tokens</span>
                    </div>
                    <div class="col-md-3">
                      <strong>Total Reward Score:</strong><br>
                      <span class="text-info">{{ distribution.totalRewardScore.toFixed(6) }}</span>
                    </div>
                  </div>

                  <!-- Progress bar for in-progress distributions -->
                  <div v-if="isInProgress(distribution.status)" class="mt-3">
                    <div class="progress">
                      <div 
                        class="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        :style="{ width: getProgressPercent(distribution.status) + '%' }"
                      >
                        {{ getProgressPercent(distribution.status).toFixed(1) }}%
                      </div>
                    </div>
                  </div>

                  <!-- Neuron Rewards Details (for completed distributions) -->
                  <div v-if="distribution.status.Completed && distribution.neuronRewards && distribution.neuronRewards.length > 0" class="mt-3">
                    <button 
                      class="btn btn-outline-info btn-sm" 
                      @click="toggleRewardDetails(index)"
                    >
                      {{ showRewardDetails[index] ? '🔽 Hide' : '🔼 Show' }} Neuron Rewards ({{ distribution.neuronRewards.length }})
                    </button>
                    
                    <div v-if="showRewardDetails[index]" class="mt-3">
                      <div class="table-responsive">
                        <table class="table table-dark table-striped table-sm">
                          <thead>
                            <tr>
                              <th>Neuron ID</th>
                              <th>Performance Score</th>
                              <th>Voting Power</th>
                              <th>Reward Score</th>
                              <th>Reward Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="reward in distribution.neuronRewards.slice(0, 20)" :key="reward.neuronId">
                              <td class="font-monospace">{{ formatNeuronId(reward.neuronId) }}</td>
                              <td>{{ reward.performanceScore.toFixed(6) }}</td>
                              <td>{{ reward.votingPower }}</td>
                              <td>{{ reward.rewardScore.toFixed(6) }}</td>
                              <td class="text-success">{{ reward.rewardAmount.toFixed(6) }}</td>
                            </tr>
                          </tbody>
                        </table>
                        <small v-if="distribution.neuronRewards.length > 20" class="text-muted">
                          Showing first 20 of {{ distribution.neuronRewards.length }} rewards
                        </small>
                      </div>
                    </div>
                  </div>

                  <!-- Error details for failed distributions -->
                  <div v-if="distribution.status.Failed" class="mt-3">
                    <div class="alert alert-danger">
                      <strong>Error:</strong> {{ distribution.status.Failed }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="!isLoading" class="text-center text-muted">
                <p>No distribution history available</p>
              </div>
              <div v-if="isLoading && currentAction === 'refresh'" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
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
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { createActor as createRewardsActor } from '../../../declarations/rewards'

export default {
  name: 'AdminDistributionsView',
  components: {
    HeaderBar,
    TacoTitle
  },

  data() {
    return {
      isLoading: false,
      currentAction: '',
      errorMessage: '',
      successMessage: '',
      distributionStatus: null,
      configuration: null,
      distributionHistory: [],
      showRewardDetails: {},
      newRewardPot: 1000,
      newDistributionPeriod: 7,
      timerRunning: false,
      customStartTime: '',
      customEndTime: '',
      selectedPriceType: 'USD'
    }
  },

  computed: {
    tacoStore() {
      return useTacoStore()
    },

    distributionInProgress() {
      return this.distributionStatus?.inProgress || false
    },

    nextDistributionTime() {
      if (!this.distributionStatus || !this.configuration) return 0
      return Number(this.distributionStatus.lastDistributionTime) + Number(this.configuration.distributionPeriodNS)
    },

    isValidCustomInput() {
      if (!this.customStartTime || !this.customEndTime) return false
      const startDate = new Date(this.customStartTime)
      const endDate = new Date(this.customEndTime)
      return startDate < endDate
    }
  },

  async mounted() {
    await this.loadData()
    this.setDefaultCustomTimes()
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadData()
    }, 30000)
  },

  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },

  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.loadDistributionStatus(),
          this.loadConfiguration(),
          this.loadDistributionHistory()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        this.errorMessage = 'Failed to load distribution data'
      }
    },

    async getRewardsActor() {
      try {
        const canisterId = this.tacoStore.rewardsCanisterId()
        if (!canisterId) {
          throw new Error('Rewards canister ID not found')
        }
        return createRewardsActor(canisterId, {
          agentOptions: {
            identity: this.tacoStore.identity,
            host: this.tacoStore.host
          }
        })
      } catch (error) {
        console.error('Error creating rewards actor:', error)
        throw error
      }
    },

    async loadDistributionStatus() {
      try {
        const actor = await this.getRewardsActor()
        this.distributionStatus = await actor.getCurrentDistributionStatus()
      } catch (error) {
        console.error('Error loading distribution status:', error)
        throw error
      }
    },

    async loadConfiguration() {
      try {
        const actor = await this.getRewardsActor()
        this.configuration = await actor.getConfiguration()
        this.newRewardPot = this.configuration.weeklyRewardPot
        this.newDistributionPeriod = Math.round(Number(this.configuration.distributionPeriodNS) / (24 * 60 * 60 * 1_000_000_000))
      } catch (error) {
        console.error('Error loading configuration:', error)
        throw error
      }
    },

    async loadDistributionHistory() {
      try {
        const actor = await this.getRewardsActor()
        this.distributionHistory = await actor.getDistributionHistory([10]) // Get last 10
      } catch (error) {
        console.error('Error loading distribution history:', error)
        throw error
      }
    },

    async triggerDistribution() {
      this.clearMessages()
      this.isLoading = true
      this.currentAction = 'trigger'
      
      try {
        const actor = await this.getRewardsActor()
        const result = await actor.triggerDistribution()
        
        if ('ok' in result) {
          this.successMessage = result.ok
          await this.loadData()
        } else {
          this.errorMessage = this.formatError(result.err)
        }
      } catch (error) {
        console.error('Error triggering distribution:', error)
        this.errorMessage = 'Failed to trigger distribution: ' + error.message
      } finally {
        this.isLoading = false
        this.currentAction = ''
      }
    },

    async startDistributionTimer() {
      this.clearMessages()
      this.isLoading = true
      this.currentAction = 'start'
      
      try {
        const actor = await this.getRewardsActor()
        const result = await actor.startDistributionTimer()
        
        if ('ok' in result) {
          this.successMessage = result.ok
          this.timerRunning = true
          await this.loadData()
        } else {
          this.errorMessage = this.formatError(result.err)
        }
      } catch (error) {
        console.error('Error starting distribution timer:', error)
        this.errorMessage = 'Failed to start distribution timer: ' + error.message
      } finally {
        this.isLoading = false
        this.currentAction = ''
      }
    },

    async stopDistributionTimer() {
      this.clearMessages()
      this.isLoading = true
      this.currentAction = 'stop'
      
      try {
        const actor = await this.getRewardsActor()
        const result = await actor.stopDistributionTimer()
        
        if ('ok' in result) {
          this.successMessage = result.ok
          this.timerRunning = false
          await this.loadData()
        } else {
          this.errorMessage = this.formatError(result.err)
        }
      } catch (error) {
        console.error('Error stopping distribution timer:', error)
        this.errorMessage = 'Failed to stop distribution timer: ' + error.message
      } finally {
        this.isLoading = false
        this.currentAction = ''
      }
    },

    async updateRewardPot() {
      this.clearMessages()
      this.isLoading = true
      
      try {
        const actor = await this.getRewardsActor()
        const result = await actor.setWeeklyRewardPot(this.newRewardPot)
        
        if ('ok' in result) {
          this.successMessage = result.ok
          await this.loadConfiguration()
        } else {
          this.errorMessage = this.formatError(result.err)
        }
      } catch (error) {
        console.error('Error updating reward pot:', error)
        this.errorMessage = 'Failed to update reward pot: ' + error.message
      } finally {
        this.isLoading = false
      }
    },

    async updateDistributionPeriod() {
      this.clearMessages()
      this.isLoading = true
      
      try {
        const actor = await this.getRewardsActor()
        const periodNS = BigInt(Math.round(this.newDistributionPeriod * 24 * 60 * 60 * 1_000_000_000))
        const result = await actor.setDistributionPeriod(periodNS)
        
        if ('ok' in result) {
          this.successMessage = result.ok
          await this.loadConfiguration()
        } else {
          this.errorMessage = this.formatError(result.err)
        }
      } catch (error) {
        console.error('Error updating distribution period:', error)
        this.errorMessage = 'Failed to update distribution period: ' + error.message
      } finally {
        this.isLoading = false
      }
    },

    async triggerCustomDistribution() {
      this.clearMessages()
      this.isLoading = true
      this.currentAction = 'triggerCustom'
      
      try {
        const actor = await this.getRewardsActor()
        
        // Convert datetime-local to nanosecond timestamps
        const startDate = new Date(this.customStartTime)
        const endDate = new Date(this.customEndTime)
        const startTimeNS = BigInt(startDate.getTime() * 1_000_000)
        const endTimeNS = BigInt(endDate.getTime() * 1_000_000)
        
        // Convert price type to backend format
        const priceType = this.selectedPriceType === 'USD' ? { USD: null } : { ICP: null }
        
        const result = await actor.triggerDistributionCustom(startTimeNS, endTimeNS, priceType)
        
        if ('ok' in result) {
          this.successMessage = result.ok
          await this.loadData()
        } else {
          this.errorMessage = this.formatError(result.err)
        }
      } catch (error) {
        console.error('Error triggering custom distribution:', error)
        this.errorMessage = 'Failed to trigger custom distribution: ' + error.message
      } finally {
        this.isLoading = false
        this.currentAction = ''
      }
    },

    setDefaultCustomTimes() {
      // Set default to last 7 days
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      this.customEndTime = now.toISOString().slice(0, 16)
      this.customStartTime = weekAgo.toISOString().slice(0, 16)
    },

    async refreshHistory() {
      this.clearMessages()
      this.isLoading = true
      this.currentAction = 'refresh'
      
      try {
        await this.loadData()
        this.successMessage = 'Distribution data refreshed'
      } catch (error) {
        console.error('Error refreshing history:', error)
        this.errorMessage = 'Failed to refresh distribution data'
      } finally {
        this.isLoading = false
        this.currentAction = ''
      }
    },

    toggleRewardDetails(index) {
      this.showRewardDetails = {
        ...this.showRewardDetails,
        [index]: !this.showRewardDetails[index]
      }
    },

    clearMessages() {
      this.errorMessage = ''
      this.successMessage = ''
    },

    formatError(error) {
      if (typeof error === 'string') return error
      if (error.SystemError) return error.SystemError
      if (error.NotAuthorized) return 'Not authorized'
      if (error.DistributionInProgress) return 'Distribution already in progress'
      return 'Unknown error'
    },

    formatTimestamp(timestamp) {
      try {
        // Handle both BigInt and regular numbers
        const timestampNum = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp)
        const date = new Date(timestampNum / 1_000_000)
        return date.toLocaleString()
      } catch (error) {
        return 'Invalid date'
      }
    },

    formatNeuronId(neuronId) {
      try {
        if (Array.isArray(neuronId)) {
          const hex = neuronId.map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...'
        }
        return 'Invalid ID'
      } catch (error) {
        return 'Invalid ID'
      }
    },

    getStatusText(status) {
      if (status.InProgress) return 'In Progress'
      if (status.Completed) return 'Completed'
      if (status.Failed) return 'Failed'
      return 'Unknown'
    },

    getStatusBadgeClass(status) {
      if (status.InProgress) return 'bg-warning'
      if (status.Completed) return 'bg-success'
      if (status.Failed) return 'bg-danger'
      return 'bg-secondary'
    },

    isInProgress(status) {
      return status && status.InProgress
    },

    getProgressPercent(status) {
      if (!status.InProgress) return 0
      const current = status.InProgress.currentNeuron || 0
      const total = status.InProgress.totalNeurons || 1
      return (current / total) * 100
    }
  }
}
</script>

<style scoped>
.distribution-record {
  border-left: 3px solid #0d6efd;
  padding-left: 1rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
}

.progress {
  height: 8px;
}

.table th {
  font-size: 0.9em;
  font-weight: 600;
}

.table td {
  font-size: 0.85em;
}

.font-monospace {
  font-family: monospace !important;
}

.alert {
  font-size: 0.9em;
}
</style>