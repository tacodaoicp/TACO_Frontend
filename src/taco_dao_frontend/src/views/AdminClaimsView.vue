<template>
  <div class="admin-claims-view">
    <!-- Header Bar -->
    <div class="header-bar">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h1 class="mb-0">Admin Claims</h1>
          </div>
          <div class="col-md-6 text-end">
            <button class="btn btn-outline-light btn-sm me-2" @click="$router.push('/admin')">
              ← Back to Admin
            </button>
            <button class="btn btn-outline-light btn-sm me-2" @click="$router.push('/admin/distributions')">
              📊 Distributions
            </button>
            <button class="btn btn-outline-light btn-sm me-2" @click="$router.push('/admin/balances')">
              💰 Balances
            </button>
            <button class="btn btn-outline-light btn-sm" @click="$router.push('/admin/rewards')">
              🏆 Rewards
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid mt-4">
      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card bg-dark border-info">
            <div class="card-body">
              <h6 class="card-title text-info">Total Withdrawn</h6>
              <h4 class="text-white">{{ adminStore.formatTacoPrecise(withdrawalStats.totalWithdrawn) }} TACO</h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark border-success">
            <div class="card-body">
              <h6 class="card-title text-success">Total Claims</h6>
              <h4 class="text-white">{{ withdrawalStats.totalWithdrawals }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark border-warning">
            <div class="card-body">
              <h6 class="card-title text-warning">Records in History</h6>
              <h4 class="text-white">{{ withdrawalStats.totalRecordsInHistory }}</h4>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text">Records to load:</span>
            <select class="form-select" v-model="recordLimit" @change="loadWithdrawalHistory">
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
        <div class="col-md-6 text-end">
          <button 
            class="btn btn-primary" 
            @click="refreshData"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="alert alert-danger" role="alert">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success" role="alert">
        {{ successMessage }}
      </div>

      <!-- Withdrawal History Table -->
      <div class="card bg-dark">
        <div class="card-header">
          <h5 class="mb-0">Withdrawal History</h5>
        </div>
        <div class="card-body">
          <div v-if="isLoading && withdrawalHistory.length === 0" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading withdrawal history...</p>
          </div>

          <div v-else-if="withdrawalHistory.length === 0" class="text-center py-4">
            <p class="text-muted">No withdrawal history found.</p>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-dark table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>User</th>
                  <th>Neurons</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Sent</th>
                  <th>Target Account</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="withdrawal in withdrawalHistory" :key="withdrawal.id">
                  <td>
                    <code class="text-info">#{{ withdrawal.id }}</code>
                  </td>
                  <td>
                    <small>{{ formatTimestamp(withdrawal.timestamp) }}</small>
                  </td>
                  <td>
                    <code class="text-warning">{{ formatPrincipal(withdrawal.caller) }}</code>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ withdrawal.neuronWithdrawals.length }}</span>
                    <div class="mt-1">
                      <small 
                        v-for="[neuronId, amount] in withdrawal.neuronWithdrawals" 
                        :key="neuronId" 
                        class="d-block text-muted"
                      >
                        {{ formatNeuronId(neuronId) }}: {{ adminStore.formatTacoPrecise(amount) }}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span class="text-info">{{ adminStore.formatTacoPrecise(withdrawal.totalAmount) }} TACO</span>
                  </td>
                  <td>
                    <span class="text-warning">{{ adminStore.formatTacoPrecise(withdrawal.fee) }} TACO</span>
                  </td>
                  <td>
                    <span class="text-success">{{ adminStore.formatTacoPrecise(withdrawal.amountSent) }} TACO</span>
                  </td>
                  <td>
                    <div>
                      <code class="text-primary">{{ formatPrincipal(withdrawal.targetAccount.owner) }}</code>
                      <div v-if="withdrawal.targetAccount.subaccount.length > 0" class="mt-1">
                        <small class="text-muted">
                          Sub: {{ formatSubaccount(withdrawal.targetAccount.subaccount[0]) }}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span v-if="withdrawal.transactionId" class="badge bg-success">
                      ✅ Success
                      <div class="mt-1">
                        <small>TX: {{ withdrawal.transactionId }}</small>
                      </div>
                    </span>
                    <span v-else class="badge bg-danger">❌ Failed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAdminStore } from '../stores/admin.store'
import { useTacoStore } from '../stores/taco.store'
import { AuthClient } from '@dfinity/auth-client'
import { Actor } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { idlFactory as rewardsIDL } from '../../../declarations/rewards/rewards.did.js'

export default {
  name: 'AdminClaimsView',
  
  data() {
    return {
      withdrawalHistory: [],
      withdrawalStats: {
        totalWithdrawn: 0,
        totalWithdrawals: 0,
        totalRecordsInHistory: 0
      },
      recordLimit: 50,
      isLoading: false,
      errorMessage: '',
      successMessage: ''
    }
  },

  computed: {
    tacoStore() {
      return useTacoStore()
    },

    adminStore() {
      return useAdminStore()
    }
  },

  async mounted() {
    await this.loadData()
  },

  methods: {
    async loadData() {
      this.isLoading = true
      this.clearMessages()
      
      try {
        await Promise.all([
          this.loadWithdrawalStats(),
          this.loadWithdrawalHistory()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        this.errorMessage = 'Failed to load claims data: ' + error.message
      } finally {
        this.isLoading = false
      }
    },

    async getRewardsActor() {
      try {
        const canisterId = this.tacoStore.rewardsCanisterId()
        if (!canisterId) {
          throw new Error('Rewards canister ID not found')
        }

        const authClient = await AuthClient.create({
          idleOptions: { disableIdle: true }
        })

        if (!await authClient.isAuthenticated()) {
          throw new Error('User not authenticated')
        }

        const identity = authClient.getIdentity()
        const agent = await createAgent({
          identity,
          host: process.env.DFX_NETWORK === 'local' ? 'http://localhost:4943' : 'https://ic0.app'
        })

        return Actor.createActor(rewardsIDL, {
          agent,
          canisterId
        })
      } catch (error) {
        console.error('Error creating rewards actor:', error)
        throw error
      }
    },

    async loadWithdrawalStats() {
      try {
        const actor = await this.getRewardsActor()
        const result = await actor.getWithdrawalStats()
        
        if ('ok' in result) {
          // Convert BigInt values to regular numbers to avoid JSON.stringify issues
          this.withdrawalStats = {
            totalWithdrawn: Number(result.ok.totalWithdrawn),
            totalWithdrawals: Number(result.ok.totalWithdrawals),
            totalRecordsInHistory: Number(result.ok.totalRecordsInHistory)
          }
        } else {
          throw new Error(this.formatError(result.err))
        }
      } catch (error) {
        console.error('Error loading withdrawal stats:', error)
        throw error
      }
    },

    async loadWithdrawalHistory() {
      try {
        const actor = await this.getRewardsActor()
        const result = await actor.getAllWithdrawalHistory([this.recordLimit])
        
        if ('ok' in result) {
          // Convert BigInt values to regular numbers to avoid JSON.stringify issues
          this.withdrawalHistory = result.ok.map(record => ({
            ...record,
            totalAmount: Number(record.totalAmount),
            amountSent: Number(record.amountSent),
            fee: Number(record.fee),
            timestamp: Number(record.timestamp),
            transactionId: record.transactionId ? Number(record.transactionId) : null,
            neuronWithdrawals: record.neuronWithdrawals.map(([neuronId, amount]) => [
              neuronId,
              Number(amount)
            ])
          }))
        } else {
          throw new Error(this.formatError(result.err))
        }
      } catch (error) {
        console.error('Error loading withdrawal history:', error)
        throw error
      }
    },

    async refreshData() {
      this.successMessage = ''
      await this.loadData()
      this.successMessage = 'Data refreshed successfully'
    },

    formatTimestamp(timestampNS) {
      try {
        if (!timestampNS || timestampNS === 0) {
          return 'Never'
        }
        
        const timestampMS = Number(timestampNS) / 1_000_000
        const date = new Date(timestampMS)
        
        if (isNaN(date.getTime())) {
          return 'Invalid Date'
        }
        
        return date.toLocaleString()
      } catch (error) {
        console.error('Error formatting timestamp:', error, timestampNS)
        return 'Format Error'
      }
    },

    formatPrincipal(principal) {
      try {
        const principalStr = typeof principal === 'string' ? principal : principal.toString()
        return principalStr.length > 12 ? 
          principalStr.substring(0, 6) + '...' + principalStr.substring(principalStr.length - 6) : 
          principalStr
      } catch (error) {
        console.error('Error formatting principal:', error)
        return 'Format Error'
      }
    },

    formatNeuronId(neuronId) {
      try {
        if (Array.isArray(neuronId)) {
          const hex = neuronId.map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        } else if (typeof neuronId === 'string') {
          return neuronId.length > 12 ? neuronId.substring(0, 8) + '...' + neuronId.substring(neuronId.length - 4) : neuronId
        } else if (neuronId && neuronId._arr) {
          const hex = Array.from(neuronId._arr).map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        } else if (neuronId && typeof neuronId === 'object' && neuronId.constructor === Uint8Array) {
          const hex = Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        }
        
        return 'Unknown Format'
      } catch (error) {
        console.error('Error formatting neuron ID:', error, neuronId)
        return 'Format Error'
      }
    },

    formatSubaccount(subaccount) {
      try {
        if (Array.isArray(subaccount)) {
          const hex = subaccount.map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        } else if (subaccount && subaccount._arr) {
          const hex = Array.from(subaccount._arr).map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        } else if (subaccount && typeof subaccount === 'object' && subaccount.constructor === Uint8Array) {
          const hex = Array.from(subaccount).map(b => b.toString(16).padStart(2, '0')).join('')
          return hex.substring(0, 8) + '...' + hex.substring(hex.length - 4)
        }
        
        return 'Unknown Format'
      } catch (error) {
        console.error('Error formatting subaccount:', error, subaccount)
        return 'Format Error'
      }
    },

    formatError(error) {
      if (typeof error === 'string') return error
      if (error.SystemError) return error.SystemError
      if (error.NotAuthorized) return 'Not authorized to perform this action'
      if (error.NeuronNotFound) return 'Neuron not found'
      if (error.InvalidTimeRange) return 'Invalid time range'
      return 'Unknown error occurred'
    },

    clearMessages() {
      this.errorMessage = ''
      this.successMessage = ''
    }
  }
}
</script>

<style scoped>
.admin-claims-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  color: #e2e8f0;
}

.header-bar {
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #4a5568;
  padding: 1rem 0;
}

.card {
  background-color: #1a202c !important;
  border-color: #4a5568 !important;
}

.table-dark {
  --bs-table-bg: #1a202c;
  --bs-table-striped-bg: #2d3748;
}

.input-group-text {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.form-select {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.form-select:focus {
  background-color: #2d3748;
  border-color: #63b3ed;
  color: #e2e8f0;
  box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25);
}

code {
  background-color: #2d3748;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.text-muted {
  color: #a0aec0 !important;
}

.badge {
  font-size: 0.75rem;
}
</style>
