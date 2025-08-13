<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🏆" title="Neuron Performance Rewards" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Input Form -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Calculate Neuron Performance</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <label for="neuronId" class="form-label">Neuron ID (hex):</label>
                  <input 
                    id="neuronId" 
                    type="text" 
                    class="form-control bg-dark text-white" 
                    v-model="neuronId"
                    placeholder="e.g., 0075df8981..."
                  />
                  <small class="text-muted">Enter the neuron ID as a hex string (without 0x prefix)</small>
                </div>
                <div class="col-md-3">
                  <label for="priceType" class="form-label">Price Type:</label>
                  <select 
                    id="priceType" 
                    class="form-select bg-dark text-white" 
                    v-model="priceType"
                  >
                    <option value="USD">USD</option>
                    <option value="ICP">ICP</option>
                  </select>
                </div>
                <div class="col-md-3 d-flex align-items-end">
                  <button 
                    class="btn btn-primary w-100" 
                    @click="calculatePerformance"
                    :disabled="isLoading || !isValidInput"
                  >
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    🏆 Calculate Performance
                  </button>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-md-6">
                  <label for="startTime" class="form-label">Start Time:</label>
                  <input 
                    id="startTime" 
                    type="datetime-local" 
                    class="form-control bg-dark text-white" 
                    v-model="startTime"
                  />
                </div>
                <div class="col-md-6">
                  <label for="endTime" class="form-label">End Time:</label>
                  <input 
                    id="endTime" 
                    type="datetime-local" 
                    class="form-control bg-dark text-white" 
                    v-model="endTime"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            <strong>Error:</strong> {{ errorMessage }}
          </div>

          <!-- Results Display -->
          <div v-if="performanceResult" class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Performance Results</h3>
              <span class="badge" :class="performanceResult.performanceScore >= 1.0 ? 'bg-success' : 'bg-warning'">
                {{ (performanceResult.performanceScore * 100).toFixed(2) }}%
              </span>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <strong>Initial Value:</strong><br>
                  <span class="text-success">{{ performanceResult.initialValue.toFixed(6) }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Final Value:</strong><br>
                  <span :class="performanceResult.finalValue >= performanceResult.initialValue ? 'text-success' : 'text-danger'">
                    {{ performanceResult.finalValue.toFixed(6) }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Performance Score:</strong><br>
                  <span :class="performanceResult.performanceScore >= 1.0 ? 'text-success' : 'text-warning'">
                    {{ performanceResult.performanceScore.toFixed(6) }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Allocation Changes:</strong><br>
                  <span class="text-info">{{ performanceResult.allocationChanges }}</span>
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-12">
                  <strong>Time Period:</strong><br>
                  {{ formatTimestamp(performanceResult.startTime) }} → {{ formatTimestamp(performanceResult.endTime) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Checkpoints Timeline -->
          <div v-if="performanceResult && performanceResult.checkpoints" class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Performance Timeline ({{ performanceResult.checkpoints.length }} Checkpoints)</h3>
            </div>
            <div class="card-body">
              <div v-for="(checkpoint, index) in performanceResult.checkpoints" :key="index" class="checkpoint mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="mb-0">
                    <span class="badge bg-primary me-2">{{ index + 1 }}</span>
                    {{ formatTimestamp(checkpoint.timestamp) }}
                  </h5>
                  <span class="badge" :class="checkpoint.totalPortfolioValue >= 1.0 ? 'bg-success' : 'bg-warning'">
                    Portfolio Value: {{ checkpoint.totalPortfolioValue.toFixed(6) }}
                  </span>
                </div>

                <!-- Token Allocations -->
                <div class="row mb-3">
                  <div class="col-md-6">
                    <h6>Allocations:</h6>
                    <div class="allocation-list">
                      <div v-for="allocation in checkpoint.allocations" :key="allocation.token" class="d-flex justify-content-between">
                        <span class="text-truncate me-2" :title="allocation.token">{{ getTokenSymbol(allocation.token) }}</span>
                        <span>{{ (allocation.basisPoints / 100).toFixed(2) }}%</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h6>Token Values:</h6>
                    <div class="token-values">
                      <div v-for="[token, value] in checkpoint.tokenValues" :key="token" class="d-flex justify-content-between">
                        <span class="text-truncate me-2" :title="token">{{ getTokenSymbol(token) }}</span>
                        <span>{{ value.toFixed(6) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Prices Used -->
                <div class="row">
                  <div class="col-12">
                    <h6>Prices Used:</h6>
                    <div class="prices-used">
                      <div v-for="[token, priceInfo] in checkpoint.pricesUsed" :key="token" class="price-info mb-1">
                        <small class="text-muted">
                          {{ getTokenSymbol(token) }}: 
                          <span v-if="priceType === 'USD'">${{ priceInfo.usdPrice.toFixed(6) }}</span>
                          <span v-else>{{ (priceInfo.icpPrice / 100000000).toFixed(8) }} ICP</span>
                          <span class="text-muted ms-2">({{ formatTimestamp(priceInfo.timestamp) }})</span>
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <hr v-if="index < performanceResult.checkpoints.length - 1" class="my-3">
              </div>
            </div>
          </div>

          <!-- Raw Data (Collapsible) -->
          <div v-if="performanceResult" class="card bg-dark text-white">
            <div class="card-header">
              <h3 class="mb-0">
                <button 
                  class="btn btn-link text-white p-0" 
                  type="button" 
                  @click="showRawData = !showRawData"
                >
                  {{ showRawData ? '▼' : '▶' }} Raw Data
                </button>
              </h3>
            </div>
            <div v-if="showRawData" class="card-body">
              <pre class="bg-black p-3 text-light"><code>{{ JSON.stringify(performanceResult, null, 2) }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { useTacoStore } from '../stores/taco.store'
import { mapStores } from 'pinia'
import { Principal } from '@dfinity/principal'

// Import rewards actor
import { createActor as createRewardsActor } from '../../../declarations/rewards'

export default {
  name: 'AdminRewardsView',
  components: {
    HeaderBar,
    TacoTitle
  },
  computed: {
    ...mapStores(useTacoStore),
    isValidInput() {
      return this.neuronId && 
             this.startTime && 
             this.endTime && 
             this.neuronId.length >= 10 && // Basic validation
             new Date(this.startTime) < new Date(this.endTime)
    }
  },
  data() {
    return {
      neuronId: '0075df8981c4c2d1c2e2e429fe65d62c3a4a251fd733e4f6692d5949add5b9', // Default example
      startTime: '2024-12-08T10:00',
      endTime: '2024-12-08T12:00',
      priceType: 'USD',
      isLoading: false,
      errorMessage: '',
      performanceResult: null,
      showRawData: false,
      rewardsActor: null
    }
  },
  async mounted() {
    try {
      // Create rewards actor with the proper canister ID from store
      this.rewardsActor = createRewardsActor(this.tacoStore.rewardsCanisterId())
      // Load token metadata
      await this.tacoStore.loadAllNames()
    } catch (error) {
      console.error('Failed to create rewards actor:', error)
      this.errorMessage = 'Failed to connect to rewards canister'
    }
  },
  methods: {
    async calculatePerformance() {
      if (!this.isValidInput) {
        this.errorMessage = 'Please provide valid inputs'
        return
      }

      this.isLoading = true
      this.errorMessage = ''
      this.performanceResult = null

      try {
        // Convert neuron ID from hex string to Uint8Array
        const neuronIdBytes = this.hexStringToBytes(this.neuronId)
        
        // Convert datetime to nanoseconds
        const startTimeNs = this.dateTimeToNanoseconds(this.startTime)
        const endTimeNs = this.dateTimeToNanoseconds(this.endTime)
        
        // Create price type variant
        const priceTypeVariant = this.priceType === 'USD' ? { USD: null } : { ICP: null }
        
        console.log('Calling calculateNeuronPerformance with:', {
          neuronIdBytes,
          startTimeNs,
          endTimeNs,
          priceTypeVariant
        })

        const result = await this.rewardsActor.calculateNeuronPerformance(
          neuronIdBytes,
          startTimeNs,
          endTimeNs,
          priceTypeVariant
        )

        if (result.ok) {
          this.performanceResult = result.ok
          console.log('Performance result:', this.performanceResult)
        } else {
          this.errorMessage = `Calculation failed: ${JSON.stringify(result.err)}`
        }
      } catch (error) {
        console.error('Error calculating performance:', error)
        this.errorMessage = `Error: ${error.message}`
      } finally {
        this.isLoading = false
      }
    },

    hexStringToBytes(hexString) {
      // Remove 0x prefix if present
      const cleanHex = hexString.replace(/^0x/, '')
      
      // Convert hex string to Uint8Array
      const bytes = new Uint8Array(cleanHex.length / 2)
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
      }
      return bytes
    },

    dateTimeToNanoseconds(dateTimeString) {
      const date = new Date(dateTimeString)
      return BigInt(date.getTime()) * BigInt(1000000) // Convert milliseconds to nanoseconds
    },

    formatTimestamp(nanoseconds) {
      // Convert nanoseconds to milliseconds
      const milliseconds = Number(BigInt(nanoseconds) / BigInt(1000000))
      const date = new Date(milliseconds)
      return date.toLocaleString()
    },

    getTokenSymbol(tokenPrincipal) {
      try {
        const principal = Principal.fromText(tokenPrincipal)
        const tokenMetadata = this.getTokenMetadata(principal)
        
        if (tokenMetadata && tokenMetadata.tokenSymbol) {
          return tokenMetadata.tokenSymbol
        }
        
        // Fallback to truncated principal
        return tokenPrincipal.substring(0, 8) + '...'
      } catch (error) {
        console.warn('Error getting token symbol:', error)
        return tokenPrincipal.substring(0, 8) + '...'
      }
    },

    // Get token metadata from the taco store
    getTokenMetadata(principal) {
      try {
        if (!this.tacoStore.fetchedTokenDetails || !Array.isArray(this.tacoStore.fetchedTokenDetails)) {
          return null
        }

        const tokenEntry = this.tacoStore.fetchedTokenDetails.find(entry => {
          if (!entry || !Array.isArray(entry) || entry.length < 2) {
            return false
          }
          try {
            const entryPrincipal = entry[0].toString()
            const searchPrincipal = principal.toString()
            return entryPrincipal === searchPrincipal
          } catch (err) {
            console.warn('Error comparing principals:', err)
            return false
          }
        })

        return tokenEntry && tokenEntry[1] ? tokenEntry[1] : null
      } catch (error) {
        console.warn('Error getting token metadata:', error)
        return null
      }
    }
  }
}
</script>

<style scoped>
.checkpoint {
  border-left: 3px solid #0d6efd;
  padding-left: 1rem;
}

.allocation-list, .token-values, .prices-used {
  font-family: monospace;
  font-size: 0.9em;
}

.price-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

pre code {
  font-size: 0.8em;
  line-height: 1.2;
}

.text-truncate {
  max-width: 120px;
}
</style>