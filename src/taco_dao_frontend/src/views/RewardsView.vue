<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 text-white mb-0">🎁 My Rewards</h1>
          <div class="d-flex gap-2">
            <router-link to="/admin" class="btn btn-outline-secondary btn-sm">
              🔧 Admin
            </router-link>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading your neurons and rewards...</p>
        </div>

        <!-- Error State -->
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          <strong>Error:</strong> {{ errorMessage }}
        </div>

        <!-- Not Authenticated -->
        <div v-if="!isLoading && !isAuthenticated" class="card bg-dark text-white">
          <div class="card-body text-center py-5">
            <h4>🔐 Authentication Required</h4>
            <p class="text-muted">Please log in to view your neuron rewards.</p>
            <button @click="login" class="btn btn-primary">
              Login with Internet Identity
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-if="!isLoading && isAuthenticated && neurons.length > 0">
          
          <!-- Summary Cards -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card bg-dark text-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="card-title text-muted mb-1">Total Neurons</h6>
                      <div class="h4 mb-0 text-primary">{{ neurons.length }}</div>
                    </div>
                    <div class="text-primary">
                      <i class="fas fa-brain fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-dark text-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="card-title text-muted mb-1">Total Rewards</h6>
                      <div class="h4 mb-0 text-success">{{ adminStore.formatTacoPrecise(totalRewards) }} TACO</div>
                    </div>
                    <div class="text-success">
                      <i class="fas fa-coins fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-dark text-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="card-title text-muted mb-1">Claimable Neurons</h6>
                      <div class="h4 mb-0 text-warning">{{ claimableNeurons }}</div>
                    </div>
                    <div class="text-warning">
                      <i class="fas fa-gift fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Neurons Table -->
          <div class="card bg-dark text-white">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h4 class="mb-0">Your Neurons & Rewards</h4>
              <button 
                @click="refreshData" 
                :disabled="isLoading"
                class="btn btn-outline-primary btn-sm"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                🔄 Refresh
              </button>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Neuron ID</th>
                      <th>Voting Power</th>
                      <th>Stake</th>
                      <th>Maturity</th>
                      <th>Rewards Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="neuron in neurons" :key="formatNeuronId(neuron.id)">
                      <td>
                        <code class="text-primary">{{ formatNeuronId(neuron.id) }}</code>
                      </td>
                      <td>
                        <span class="badge bg-info">
                          {{ formatVotingPower(neuron.voting_power_percentage_multiplier) }}%
                        </span>
                      </td>
                      <td>
                        <span class="text-muted">
                          {{ formatStake(neuron.cached_neuron_stake_e8s) }} ICP
                        </span>
                      </td>
                      <td>
                        <span class="text-muted">
                          {{ formatMaturity(neuron.maturity_e8s_equivalent) }} ICP
                        </span>
                      </td>
                      <td>
                        <span 
                          :class="getBalanceClass(getNeuronBalance(neuron.id))"
                          class="fw-bold"
                        >
                          {{ adminStore.formatTacoPrecise(getNeuronBalance(neuron.id)) }} TACO
                        </span>
                      </td>
                      <td>
                        <button 
                          v-if="getNeuronBalance(neuron.id) > 0"
                          @click="claimRewards([neuron.id])"
                          :disabled="isLoading"
                          class="btn btn-success btn-sm"
                        >
                          💰 Claim
                        </button>
                        <span v-else class="text-muted">No rewards</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Bulk Actions -->
          <div v-if="claimableNeurons > 0" class="card bg-dark text-white mt-4">
            <div class="card-body">
              <h5 class="card-title">Bulk Actions</h5>
              <p class="text-muted">Claim rewards from multiple neurons at once to save on fees.</p>
              <button 
                @click="claimAllRewards"
                :disabled="isLoading"
                class="btn btn-primary"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                💎 Claim All Rewards ({{ adminStore.formatTacoPrecise(totalRewards) }} TACO)
              </button>
            </div>
          </div>

        </div>

        <!-- No Neurons State -->
        <div v-if="!isLoading && isAuthenticated && neurons.length === 0" class="card bg-dark text-white">
          <div class="card-body text-center py-5">
            <h4>🧠 No Neurons Found</h4>
            <p class="text-muted">You don't have any hotkeyed neurons in the TACO SNS.</p>
            <p class="text-muted">
              To earn rewards, you need to have neurons that vote on TACO DAO proposals.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { AuthClient } from '@dfinity/auth-client'
import { Actor } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { useTacoStore } from '@/stores/taco.store'
import { useAdminStore } from '@/stores/admin.store'
import { idlFactory as rewardsIDL } from '../../../declarations/rewards/rewards.did.js'

export default {
  name: 'RewardsView',

  data() {
    return {
      isLoading: false,
      errorMessage: '',
      isAuthenticated: false,
      neurons: [],
      neuronBalances: new Map(), // neuronId -> balance
      authClient: null,
      userPrincipal: null
    }
  },

  computed: {
    tacoStore() {
      return useTacoStore()
    },

    adminStore() {
      return useAdminStore()
    },

    totalRewards() {
      let total = 0
      for (const balance of this.neuronBalances.values()) {
        total += Number(balance)
      }
      return total
    },

    claimableNeurons() {
      let count = 0
      for (const balance of this.neuronBalances.values()) {
        if (balance > 0) count++
      }
      return count
    }
  },

  async mounted() {
    await this.initAuth()
    if (this.isAuthenticated) {
      await this.loadUserNeurons()
    }
  },

  methods: {
    async initAuth() {
      try {
        this.authClient = await AuthClient.create({
          idleOptions: { disableIdle: true }
        })
        
        this.isAuthenticated = await this.authClient.isAuthenticated()
        
        if (this.isAuthenticated) {
          const identity = await this.authClient.getIdentity()
          this.userPrincipal = identity.getPrincipal()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.errorMessage = 'Failed to initialize authentication'
      }
    },

    async login() {
      try {
        await this.authClient.login({
          identityProvider: process.env.DFX_NETWORK === 'local' 
            ? `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`
            : 'https://identity.ic0.app',
          onSuccess: async () => {
            this.isAuthenticated = true
            const identity = await this.authClient.getIdentity()
            this.userPrincipal = identity.getPrincipal()
            await this.loadUserNeurons()
          },
        })
      } catch (error) {
        console.error('Login error:', error)
        this.errorMessage = 'Login failed: ' + error.message
      }
    },

    async loadUserNeurons() {
      this.isLoading = true
      this.errorMessage = ''

      try {
        // Call SNS Governance to get user's neurons
        const snsGovId = 'lhdfz-wqaaa-aaaaq-aae3q-cai' // TACO SNS Governance
        const snsGov = await this.createSnsGovernanceActor(snsGovId)
        
        const neuronsResult = await snsGov.list_neurons({
          of_principal: [this.userPrincipal],
          limit: 1000,
          start_page_at: []
        })

        this.neurons = neuronsResult.neurons || []
        
        // Get balances for all neurons
        await this.loadNeuronBalances()

      } catch (error) {
        console.error('Error loading neurons:', error)
        this.errorMessage = 'Failed to load neurons: ' + error.message
      } finally {
        this.isLoading = false
      }
    },

    async loadNeuronBalances() {
      if (this.neurons.length === 0) return

      try {
        const rewardsActor = await this.getRewardsActor()
        
        // Extract neuron IDs (handle optional IDs)
        const neuronIds = this.neurons
          .filter(neuron => neuron.id && neuron.id.length > 0)
          .map(neuron => neuron.id[0].id)

        if (neuronIds.length === 0) return

        // Batch fetch balances
        const balances = await rewardsActor.getNeuronRewardBalances(neuronIds)
        
        // Store in map for quick lookup
        this.neuronBalances.clear()
        for (const [neuronId, balance] of balances) {
          this.neuronBalances.set(this.formatNeuronIdForMap(neuronId), balance)
        }

      } catch (error) {
        console.error('Error loading neuron balances:', error)
        this.errorMessage = 'Failed to load neuron balances: ' + error.message
      }
    },

    async createSnsGovernanceActor(canisterId) {
      const identity = await this.authClient.getIdentity()
      const host = process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app'
      
      const agent = await createAgent({
        identity,
        host,
        fetchRootKey: process.env.DFX_NETWORK === 'local',
      })

      // Create a simplified IDL for list_neurons
      const snsGovernanceIDL = ({ IDL }) => {
        const NeuronId = IDL.Record({ 'id': IDL.Vec(IDL.Nat8) })
        const ListNeurons = IDL.Record({
          'of_principal': IDL.Opt(IDL.Principal),
          'limit': IDL.Nat32,
          'start_page_at': IDL.Opt(NeuronId)
        })
        
        // Simplified neuron type for our needs
        const Neuron = IDL.Record({
          'id': IDL.Opt(NeuronId),
          'cached_neuron_stake_e8s': IDL.Nat64,
          'maturity_e8s_equivalent': IDL.Nat64,
          'voting_power_percentage_multiplier': IDL.Nat64
        })
        
        const ListNeuronsResponse = IDL.Record({
          'neurons': IDL.Vec(Neuron)
        })

        return IDL.Service({
          'list_neurons': IDL.Func([ListNeurons], [ListNeuronsResponse], ['query'])
        })
      }

      return Actor.createActor(snsGovernanceIDL, {
        agent,
        canisterId
      })
    },

    async getRewardsActor() {
      const canisterId = this.tacoStore.rewardsCanisterId()
      if (!canisterId) {
        throw new Error('Rewards canister ID not found')
      }

      const identity = await this.authClient.getIdentity()
      const host = process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app'

      const agent = await createAgent({
        identity,
        host,
        fetchRootKey: process.env.DFX_NETWORK === 'local',
      })

      return Actor.createActor(rewardsIDL, {
        agent,
        canisterId
      })
    },

    async refreshData() {
      await this.loadUserNeurons()
    },

    async claimRewards(neuronIds) {
      // TODO: Implement claim functionality
      console.log('Claiming rewards for neurons:', neuronIds)
    },

    async claimAllRewards() {
      const claimableNeuronIds = this.neurons
        .filter(neuron => this.getNeuronBalance(neuron.id) > 0)
        .map(neuron => neuron.id[0].id)
      
      await this.claimRewards(claimableNeuronIds)
    },

    formatNeuronId(neuronId) {
      try {
        if (!neuronId || neuronId.length === 0) return 'Unknown'
        
        const id = neuronId[0].id
        const hex = Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('')
        return hex.length > 12 ? hex.substring(0, 8) + '...' + hex.substring(hex.length - 4) : hex
      } catch (error) {
        console.error('Error formatting neuron ID:', error)
        return 'Format Error'
      }
    },

    formatNeuronIdForMap(neuronId) {
      try {
        return Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join('')
      } catch (error) {
        return 'unknown'
      }
    },

    getNeuronBalance(neuronId) {
      if (!neuronId || neuronId.length === 0) return 0
      const key = this.formatNeuronIdForMap(neuronId[0].id)
      return this.neuronBalances.get(key) || 0
    },

    getBalanceClass(balance) {
      if (balance > 0) return 'text-success'
      return 'text-muted'
    },

    formatVotingPower(multiplier) {
      try {
        return (Number(multiplier) / 100).toFixed(0)
      } catch (error) {
        return '0'
      }
    },

    formatStake(stakeE8s) {
      try {
        return (Number(stakeE8s) / 100_000_000).toFixed(2)
      } catch (error) {
        return '0.00'
      }
    },

    formatMaturity(maturityE8s) {
      try {
        return (Number(maturityE8s) / 100_000_000).toFixed(2)
      } catch (error) {
        return '0.00'
      }
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

.table td {
  font-size: 0.85em;
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.card.bg-dark {
  background-color: #1a202c !important;
}

code {
  font-size: 0.8em;
}

.badge {
  font-size: 0.7rem;
}
</style>
