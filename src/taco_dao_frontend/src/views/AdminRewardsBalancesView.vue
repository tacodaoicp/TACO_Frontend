<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="💰" title="Neuron Reward Balances" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Controls -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Claimable Reward Balances</h3>
              <button 
                class="btn btn-outline-primary btn-sm" 
                @click="refreshBalances"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                🔄 Refresh
              </button>
            </div>
            <div class="card-body">
              <!-- Summary Stats -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="card bg-dark border-info">
                    <div class="card-body text-center py-2">
                      <small class="text-muted">Total Neurons</small>
                      <div class="h5 mb-0 text-info">{{ balances.length }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-dark border-success">
                    <div class="card-body text-center py-2">
                      <small class="text-muted">Total Rewards</small>
                      <div class="h5 mb-0 text-success">{{ getTotalRewards().toFixed(2) }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-dark border-warning">
                    <div class="card-body text-center py-2">
                      <small class="text-muted">With Balance</small>
                      <div class="h5 mb-0 text-warning">{{ getNeuronsWithBalance() }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-dark border-primary">
                    <div class="card-body text-center py-2">
                      <small class="text-muted">Avg Balance</small>
                      <div class="h5 mb-0 text-primary">{{ getAverageBalance().toFixed(2) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Filters and Controls -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Show</span>
                    <select v-model="displayLimit" class="form-select">
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="250">250</option>
                      <option :value="balances.length">All ({{ balances.length }})</option>
                    </select>
                    <span class="input-group-text">entries</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <input 
                    v-model="searchTerm" 
                    type="text" 
                    class="form-control form-control-sm" 
                    placeholder="Search by Neuron ID..."
                  >
                </div>
                <div class="col-md-4">
                  <div class="form-check form-switch">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="showOnlyWithBalance"
                      v-model="showOnlyWithBalance"
                    >
                    <label class="form-check-label text-light" for="showOnlyWithBalance">
                      Only show neurons with balance > 0
                    </label>
                  </div>
                </div>
              </div>

              <!-- Error/Success Messages -->
              <div v-if="errorMessage" class="alert alert-danger" role="alert">
                {{ errorMessage }}
              </div>
              <div v-if="successMessage" class="alert alert-success" role="alert">
                {{ successMessage }}
              </div>

              <!-- Loading State -->
              <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading neuron reward balances...</p>
              </div>

              <!-- Balances Table -->
              <div v-else-if="filteredBalances.length > 0" class="table-responsive" style="max-height: 600px; overflow-y: auto;">
                <table class="table table-dark table-striped table-sm">
                  <thead class="sticky-top">
                    <tr>
                      <th style="cursor: pointer;" @click="sortBy('rank')">
                        Rank
                        <i v-if="sortField === 'rank'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                      </th>
                      <th style="cursor: pointer;" @click="sortBy('neuronId')">
                        Neuron ID
                        <i v-if="sortField === 'neuronId'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                      </th>
                      <th style="cursor: pointer;" @click="sortBy('balance')">
                        Claimable Balance
                        <i v-if="sortField === 'balance'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                      </th>
                      <th>% of Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(balance, index) in paginatedBalances" :key="balance.neuronId">
                      <td>
                        <span class="badge" :class="getRankBadgeClass(balance.rank)">
                          {{ balance.rank }}
                        </span>
                      </td>
                      <td class="font-monospace">
                        {{ formatNeuronId(balance.neuronId) }}
                      </td>
                      <td>
                        <span :class="getBalanceClass(balance.balance)">
                          <strong>{{ balance.balance.toFixed(6) }}</strong>
                        </span>
                      </td>
                      <td>
                        <span class="badge bg-info">
                          {{ ((balance.balance / getTotalRewards()) * 100).toFixed(2) }}%
                        </span>
                      </td>
                      <td>
                        <span :class="getStatusClass(balance.balance)">
                          {{ getStatusText(balance.balance) }}
                        </span>
                      </td>
                      <td>
                        <button 
                          v-if="balance.balance > 0"
                          class="btn btn-outline-success btn-xs me-2" 
                          @click="viewNeuronDetails(balance.neuronId)"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          v-if="balance.balance > 0"
                          class="btn btn-outline-warning btn-xs" 
                          @click="copyNeuronId(balance.neuronId)"
                          title="Copy Neuron ID"
                        >
                          📋
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- No Data State -->
              <div v-else-if="!isLoading && balances.length === 0" class="text-center py-5">
                <div class="text-muted">
                  <i class="fas fa-inbox fa-3x mb-3"></i>
                  <h5>No reward balances found</h5>
                  <p>No neurons have claimable reward balances at this time.</p>
                </div>
              </div>

              <!-- No Filtered Results -->
              <div v-else-if="!isLoading && filteredBalances.length === 0" class="text-center py-5">
                <div class="text-muted">
                  <i class="fas fa-search fa-3x mb-3"></i>
                  <h5>No results found</h5>
                  <p>No neurons match your current filters.</p>
                  <button class="btn btn-outline-secondary btn-sm" @click="clearFilters">
                    Clear Filters
                  </button>
                </div>
              </div>

              <!-- Pagination Info -->
              <div v-if="filteredBalances.length > 0" class="mt-3">
                <small class="text-muted">
                  Showing {{ paginatedBalances.length }} of {{ filteredBalances.length }} entries
                  {{ searchTerm ? ` (filtered by "${searchTerm}")` : '' }}
                  {{ showOnlyWithBalance ? ' (with balance > 0 only)' : '' }}
                </small>
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
import { AuthClient } from '@dfinity/auth-client'

export default {
  name: 'AdminRewardsBalancesView',
  components: {
    HeaderBar,
    TacoTitle
  },

  data() {
    return {
      isLoading: false,
      errorMessage: '',
      successMessage: '',
      balances: [],
      searchTerm: '',
      displayLimit: 50,
      showOnlyWithBalance: true,
      sortField: 'balance',
      sortDirection: 'desc'
    }
  },

  computed: {
    tacoStore() {
      return useTacoStore()
    },

    filteredBalances() {
      let filtered = [...this.balances]

      // Apply search filter
      if (this.searchTerm) {
        filtered = filtered.filter(balance => 
          this.formatNeuronId(balance.neuronId).toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      }

      // Apply balance filter
      if (this.showOnlyWithBalance) {
        filtered = filtered.filter(balance => balance.balance > 0)
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal, bVal
        
        switch (this.sortField) {
          case 'balance':
            aVal = a.balance
            bVal = b.balance
            break
          case 'neuronId':
            aVal = this.formatNeuronId(a.neuronId)
            bVal = this.formatNeuronId(b.neuronId)
            break
          case 'rank':
            aVal = a.rank
            bVal = b.rank
            break
          default:
            return 0
        }

        if (this.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      // Add ranks after sorting
      filtered.forEach((balance, index) => {
        balance.rank = index + 1
      })

      return filtered
    },

    paginatedBalances() {
      const limit = Number(this.displayLimit)
      return this.filteredBalances.slice(0, limit)
    }
  },

  async mounted() {
    await this.refreshBalances()
  },

  methods: {
    async refreshBalances() {
      this.clearMessages()
      this.isLoading = true

      try {
        console.log('Starting refreshBalances...')
        const actor = await this.getRewardsActor()
        console.log('Actor created successfully:', actor)
        
        console.log('Calling getAllNeuronRewardBalances...')
        const balancesResult = await actor.getAllNeuronRewardBalances()
        console.log('Method call completed successfully')
        
        // Process the balances data
        console.log('Raw balances result:', balancesResult)
        
        this.balances = balancesResult.map((item) => {
          // Handle different response formats
          let neuronId, balance
          
          if (Array.isArray(item) && item.length === 2) {
            // Format: [neuronId, balance]
            [neuronId, balance] = item
          } else if (typeof item === 'object' && item !== null) {
            // Format: { neuronId: blob, balance: number } or record format
            const keys = Object.keys(item)
            if (keys.length === 2) {
              // Assuming first key is neuronId, second is balance
              neuronId = item[keys[0]]
              balance = item[keys[1]]
            } else {
              console.error('Unexpected item format:', item)
              return null
            }
          } else {
            console.error('Unexpected item format:', item)
            return null
          }
          
          return {
            neuronId,
            balance: Number(balance),
            rank: 0 // Will be set in computed property
          }
        }).filter(Boolean) // Remove null entries

        // Sort by balance descending initially
        this.balances.sort((a, b) => b.balance - a.balance)

        this.successMessage = `Loaded ${this.balances.length} neuron balances`
      } catch (error) {
        console.error('Error loading reward balances:', error)
        this.errorMessage = 'Failed to load reward balances: ' + error.message
      } finally {
        this.isLoading = false
      }
    },

    async getRewardsActor() {
      try {
        console.log('Getting rewards canister ID...')
        const canisterId = this.tacoStore.rewardsCanisterId()
        console.log('Canister ID:', canisterId)
        
        if (!canisterId) {
          throw new Error('Rewards canister ID not found')
        }

        // Ensure authenticated identity like other admin pages
        const authClient = await AuthClient.create({
          idleOptions: { disableIdle: true }
        })

        if (!await authClient.isAuthenticated()) {
          throw new Error('User not authenticated')
        }

        const identity = await authClient.getIdentity()
        const host = process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app'

        console.log('Identity principal:', identity?.getPrincipal?.().toString?.())
        console.log('Is identity anonymous:', identity?.getPrincipal?.().isAnonymous?.())
        console.log('Using host:', host)

        const actor = createRewardsActor(canisterId, {
          agentOptions: {
            identity,
            host
          }
        })
        
        console.log('Created actor:', actor)
        return actor
      } catch (error) {
        console.error('Error creating rewards actor:', error)
        throw error
      }
    },

    formatNeuronId(neuronId) {
      try {
        // Handle different neuron ID formats
        if (Array.isArray(neuronId)) {
          // Convert byte array to hex string
          const hex = neuronId.map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        } else if (typeof neuronId === 'string') {
          // Already a string, just truncate
          return neuronId.length > 12 ? neuronId.substring(0, 8) + '...' + neuronId.substring(neuronId.length - 4) : neuronId
        } else if (neuronId && neuronId._arr) {
          // Handle Uint8Array format
          const hex = Array.from(neuronId._arr).map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        } else if (neuronId && typeof neuronId === 'object' && neuronId.constructor === Uint8Array) {
          // Handle Uint8Array directly
          const hex = Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        }
        
        return 'Unknown Format'
      } catch (error) {
        console.error('Error formatting neuron ID:', error, neuronId)
        return 'Format Error'
      }
    },

    neuronIdToFullHex(neuronId) {
      try {
        // Convert neuron ID to full hex string (not truncated)
        if (Array.isArray(neuronId)) {
          // Convert byte array to hex string
          return neuronId.map(b => b.toString(16).padStart(2, '0')).join('')
        } else if (typeof neuronId === 'string') {
          // If it's already a hex string, return as-is (remove any 0x prefix if present)
          return neuronId.replace(/^0x/, '')
        } else if (neuronId && neuronId._arr) {
          // Handle Uint8Array format
          return Array.from(neuronId._arr).map(b => b.toString(16).padStart(2, '0')).join('')
        } else if (neuronId && typeof neuronId === 'object' && neuronId.constructor === Uint8Array) {
          // Handle Uint8Array directly
          return Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join('')
        }
        
        throw new Error('Unknown neuron ID format')
      } catch (error) {
        console.error('Error converting neuron ID to hex:', error, neuronId)
        throw error
      }
    },

    getTotalRewards() {
      return this.balances.reduce((sum, balance) => sum + balance.balance, 0)
    },

    getNeuronsWithBalance() {
      return this.balances.filter(balance => balance.balance > 0).length
    },

    getAverageBalance() {
      if (this.balances.length === 0) return 0
      return this.getTotalRewards() / this.balances.length
    },

    getBalanceClass(balance) {
      if (balance > 100) return 'text-success fw-bold'
      if (balance > 10) return 'text-success'
      if (balance > 1) return 'text-warning'
      if (balance > 0) return 'text-info'
      return 'text-muted'
    },

    getStatusClass(balance) {
      if (balance > 0) return 'text-success'
      return 'text-muted'
    },

    getStatusText(balance) {
      if (balance > 0) return 'Claimable'
      return 'No Balance'
    },

    getRankBadgeClass(rank) {
      if (rank <= 3) return 'bg-warning text-dark'
      if (rank <= 10) return 'bg-info'
      if (rank <= 50) return 'bg-success'
      return 'bg-secondary'
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortDirection = field === 'balance' ? 'desc' : 'asc'
      }
    },

    clearFilters() {
      this.searchTerm = ''
      this.showOnlyWithBalance = false
    },

    viewNeuronDetails(neuronId) {
      try {
        // Convert neuron ID to full hex format for the rewards page
        const fullHexId = this.neuronIdToFullHex(neuronId)
        
        // Navigate to the rewards page with the neuron ID parameter
        this.$router.push({
          path: '/admin/rewards',
          query: { neuronId: fullHexId }
        })
      } catch (error) {
        console.error('Error navigating to neuron details:', error)
        this.errorMessage = 'Failed to navigate to neuron details'
      }
    },

    async copyNeuronId(neuronId) {
      try {
        const formattedId = this.formatNeuronId(neuronId)
        await navigator.clipboard.writeText(formattedId)
        this.successMessage = 'Neuron ID copied to clipboard!'
      } catch (error) {
        console.error('Failed to copy:', error)
        this.errorMessage = 'Failed to copy neuron ID'
      }
    },

    clearMessages() {
      this.errorMessage = ''
      this.successMessage = ''
    }
  }
}
</script>

<style scoped>
.table th {
  font-size: 0.9em;
  font-weight: 600;
  background-color: #2d3748 !important;
}

.table th.sticky-top {
  background-color: #2d3748 !important;
  z-index: 10;
}

.table td {
  font-size: 0.85em;
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.font-monospace {
  font-family: monospace !important;
}

.btn-xs {
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
}

/* Fix text visibility issues */
.text-muted {
  color: #a0aec0 !important;
}

.card-body small.text-muted {
  color: #a0aec0 !important;
}

.card .text-muted {
  color: #9ca3af !important;
}

.card .h5 {
  color: #f7fafc !important;
}

/* Search and pagination controls */
.input-group-text {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.form-select, .form-control {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.form-select:focus, .form-control:focus {
  background-color: #2d3748;
  border-color: #63b3ed;
  color: #e2e8f0;
  box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25);
}

.form-check-input:checked {
  background-color: #3182ce;
  border-color: #3182ce;
}

.form-check-input:focus {
  border-color: #63b3ed;
  box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25);
}

.form-check-label {
  color: #e2e8f0;
}

.table-responsive {
  border-radius: 6px;
  border: 1px solid #444;
}

.badge {
  font-size: 0.7rem;
}

.card.bg-dark {
  background-color: #1a202c !important;
}

.card.border-info { border-color: #3182ce !important; }
.card.border-success { border-color: #38a169 !important; }
.card.border-warning { border-color: #d69e2e !important; }
.card.border-primary { border-color: #3182ce !important; }

/* Performance score colors */
.text-success.fw-bold {
  color: #38a169 !important;
  font-weight: 700 !important;
}

.text-success {
  color: #68d391 !important;
}

.text-warning {
  color: #f6e05e !important;
}

.text-info {
  color: #63b3ed !important;
}
</style>
