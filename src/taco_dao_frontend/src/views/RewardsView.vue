<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <!-- scroll container -->
    <div class="scroll-y-container h-100">
      <!-- bootstrap container -->
      <div class="container p-0">
        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">
          
          <!-- rewards page -->
          <div class="rewards-view">
            
            <!-- title container -->
            <div class="d-flex align-items-center">
              <!-- rewards title -->
              <h1 class="taco-title mb-4 mt-4 px-3">
                <span class="taco-title__icon">🎁</span>
                <span class="taco-title__title">My Rewards</span>
              </h1>
            </div>

            <!-- top bar -->
            <div class="rewards-view__top-bar gap-2 mb-3 shadow">
              <!-- left-->
              <div class="d-flex align-items-center">
                <!-- if logged out, log in title -->
                <h2 v-if="!userLoggedIn" class="rewards-view__top-bar__title py-2">Log in to view your rewards</h2>                
                
                <!-- if logged in, welcome title -->
                <h2 v-if="userLoggedIn" class="rewards-view__top-bar__title py-2">
                  <span class="whitespace-nowrap">Welcome, &hellip;{{ truncatedPrincipal }}&nbsp;</span>
                </h2>               
              </div>

              <!-- right -->
              <div class="d-flex gap-2 flex-wrap ms-auto">
                <!-- if logged out, login button -->
                <button v-if="!userLoggedIn" class="btn iid-login m-2 me-2" @click="iidLogIn">
                  <!-- dfinity logo -->
                  <DfinityLogo />
                  <!-- login text -->
                   <span class="taco-text-white">Login</span>
                </button>

                <!-- if logged in, refresh button -->
                <button v-if="userLoggedIn" 
                  class="btn taco-nav-btn taco-nav-btn--active" 
                  @click="refreshData"
                  :disabled="isLoading">
                  <span class="taco-text-black">
                    <i v-if="isLoading" class="fas fa-spinner fa-spin me-1"></i>
                    🔄 Refresh
                  </span>
                </button>
              </div>
            </div>

            <!-- Error State -->
            <div v-if="errorMessage" class="alert alert-danger mx-3" role="alert">
              <strong>Error:</strong> {{ errorMessage }}
            </div>

            <!-- Main Content -->
            <div v-if="userLoggedIn && neurons.length > 0" class="mx-3">
          
          <!-- Summary Cards -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card bg-dark text-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="card-title text-light mb-1">Total Neurons</h6>
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
                      <h6 class="card-title text-light mb-1">Total Rewards</h6>
                      <div class="h4 mb-0 text-success">{{ formatTacoPrecise(totalRewards) }} TACO</div>
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
                      <h6 class="card-title text-light mb-1">Claimable Neurons</h6>
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

          <!-- Success Message -->
          <div v-if="successMessage" class="alert alert-success" role="alert">
            <strong>Success:</strong> {{ successMessage }}
          </div>

          <!-- Target Account Configuration -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-wallet me-2"></i>
                Withdrawal Account
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-8">
                  <label for="targetPrincipal" class="form-label">Target Principal <span class="text-danger">*</span></label>
                  <input 
                    id="targetPrincipal"
                    v-model="targetPrincipal"
                    @blur="saveAccount"
                    type="text" 
                    class="form-control bg-secondary text-white" 
                    placeholder="Enter the principal ID where you want to receive TACO tokens"
                  />
                  <div class="form-text text-muted">
                    This is where your claimed TACO tokens will be sent
                  </div>
                </div>
                <div class="col-md-4">
                  <label for="targetSubaccount" class="form-label">Subaccount (Optional)</label>
                  <input 
                    id="targetSubaccount"
                    v-model="targetSubaccount"
                    @blur="saveAccount"
                    type="text" 
                    class="form-control bg-secondary text-white" 
                    placeholder="64 hex characters"
                    maxlength="64"
                  />
                  <div class="form-text text-muted">
                    Leave empty for default account
                  </div>
                </div>
              </div>
              <div class="mt-2">
                <small class="text-info">
                  <i class="fas fa-info-circle me-1"></i>
                  Your account details are saved locally for convenience
                </small>
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
                        <span class="text-light">
                          {{ formatStake(neuron.cached_neuron_stake_e8s) }} ICP
                        </span>
                      </td>
                      <td>
                        <span class="text-light">
                          {{ formatMaturity(neuron.maturity_e8s_equivalent) }} ICP
                        </span>
                      </td>
                      <td>
                        <span 
                          :class="getBalanceClass(getNeuronBalance(neuron.id))"
                          class="fw-bold"
                        >
                          {{ formatTacoPrecise(getNeuronBalance(neuron.id)) }} TACO
                        </span>
                      </td>
                      <td>
                        <button 
                          v-if="getNeuronBalance(neuron.id) > 0"
                          @click="claimRewards([neuron.id[0].id])"
                          :disabled="isLoading || isNeuronClaiming(neuron.id)"
                          class="btn btn-success btn-sm"
                        >
                          <span v-if="isNeuronClaiming(neuron.id)" class="spinner-border spinner-border-sm me-1"></span>
                          💰 {{ isNeuronClaiming(neuron.id) ? 'Claiming...' : 'Claim' }}
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
                :disabled="isLoading || claimingNeurons.size > 0"
                class="btn btn-primary"
              >
                <span v-if="isLoading || claimingNeurons.size > 0" class="spinner-border spinner-border-sm me-2"></span>
                💎 {{ (claimingNeurons.size > 0) ? 'Claiming...' : 'Claim All Rewards' }} ({{ formatTacoPrecise(totalRewards) }} TACO)
              </button>
            </div>
          </div>

            </div>

            <!-- No Neurons State -->
            <div v-if="userLoggedIn && neurons.length === 0" class="mx-3">
              <div class="card bg-dark text-white">
                <div class="card-body text-center py-5">
                  <h4>🧠 No Neurons Found</h4>
                  <p class="text-muted">You don't have any hotkeyed neurons in the TACO SNS.</p>
                  <p class="text-muted">
                    To earn rewards, you need to have neurons that vote on TACO DAO proposals.
                  </p>
                </div>
              </div>
            </div>

            <!-- Claims History Section -->
            <div v-if="userLoggedIn" class="mx-3 mt-4">
              <div class="card bg-dark text-white">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">📋 Your Claims History</h5>
                  <button 
                    class="btn btn-outline-light btn-sm"
                    @click="loadUserWithdrawalHistory"
                    :disabled="isLoadingHistory"
                  >
                    <span v-if="isLoadingHistory" class="spinner-border spinner-border-sm me-1"></span>
                    🔄 Refresh
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="isLoadingHistory && userWithdrawalHistory.length === 0" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading your claims history...</p>
                  </div>

                  <div v-else-if="userWithdrawalHistory.length === 0" class="text-center py-4">
                    <p class="text-muted">No claims history found.</p>
                    <p class="text-muted">Your successful reward claims will appear here.</p>
                  </div>

                  <div v-else>
                    <div class="table-responsive">
                      <table class="table table-dark table-striped">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Neurons</th>
                            <th>Amount Claimed</th>
                            <th>Fee</th>
                            <th>Received</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="claim in userWithdrawalHistory" :key="claim.id">
                            <td>
                              <small>{{ formatTimestamp(claim.timestamp) }}</small>
                            </td>
                            <td>
                              <span class="badge bg-secondary me-1">{{ claim.neuronWithdrawals.length }}</span>
                              <div class="mt-1">
                                <small 
                                  v-for="[neuronId, amount] in claim.neuronWithdrawals.slice(0, 2)" 
                                  :key="neuronId"
                                  class="d-block text-light"
                                >
                                  {{ formatNeuronId(neuronId) }}: {{ formatTacoPrecise(amount) }}
                                </small>
                                <small 
                                  v-if="claim.neuronWithdrawals.length > 2" 
                                  class="d-block text-light"
                                >
                                  +{{ claim.neuronWithdrawals.length - 2 }} more...
                                </small>
                              </div>
                            </td>
                            <td>
                              <span class="text-info">{{ formatTacoPrecise(claim.totalAmount) }} TACO</span>
                            </td>
                            <td>
                              <span class="text-warning">{{ formatTacoPrecise(claim.fee) }} TACO</span>
                            </td>
                            <td>
                              <span class="text-success">{{ formatTacoPrecise(claim.amountSent) }} TACO</span>
                            </td>
                            <td>
                              <span v-if="claim.transactionId" class="badge bg-success">
                                ✅ Success
                              </span>
                              <span v-else class="badge bg-danger">❌ Failed</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div v-if="userWithdrawalHistory.length >= 20" class="text-center mt-3">
                      <small class="text-muted">
                        Showing your 20 most recent claims. Contact support if you need older records.
                      </small>
                    </div>
                  </div>
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
/////////////
// Imports //
/////////////

import HeaderBar from "../components/HeaderBar.vue"
import { ref, onMounted, computed, watch } from "vue"
import { useTacoStore } from "../stores/taco.store"
import { storeToRefs } from "pinia"
import DfinityLogo from "../assets/images/dfinityLogo.vue"
import { AuthClient } from '@dfinity/auth-client'
import { Actor } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { Principal } from '@dfinity/principal'
import { idlFactory as rewardsIDL } from '../../../declarations/rewards/rewards.did.js'

export default {
  name: 'RewardsView',
  components: {
    HeaderBar,
    DfinityLogo
  },

  setup() {
    /////////////
    // Imports //
    /////////////
    
    const tacoStore = useTacoStore()
    
    // user authentication state from taco store
    const { userLoggedIn } = storeToRefs(tacoStore)
    const { userPrincipal } = storeToRefs(tacoStore)
    const { truncatedPrincipal } = storeToRefs(tacoStore)
    
    /////////////////
    // Reactive Data //
    /////////////////
    
    const isLoading = ref(false)
    const errorMessage = ref('')
    const neurons = ref([])
    const neuronBalances = ref(new Map())
    const claimingNeurons = ref(new Set())
    const successMessage = ref('')
    
    // Account fields with localStorage persistence
    const targetPrincipal = ref('')
    const targetSubaccount = ref('') // neuronId -> balance
    
    // Withdrawal history
    const userWithdrawalHistory = ref([])
    const isLoadingHistory = ref(false)
    
    ///////////////
    // Computed //
    ///////////////
    
    const totalRewards = computed(() => {
      let total = 0
      for (const balance of neuronBalances.value.values()) {
        total += Number(balance)
      }
      return total
    })

    const claimableNeurons = computed(() => {
      let count = 0
      for (const balance of neuronBalances.value.values()) {
        if (balance > 0) count++
      }
      return count
    })
    
    /////////////
    // Methods //
    /////////////
    
    const iidLogIn = () => {
      tacoStore.iidLogIn()
    }

    // Account management with localStorage
    const loadSavedAccount = () => {
      try {
        const savedPrincipal = localStorage.getItem('taco-rewards-target-principal')
        const savedSubaccount = localStorage.getItem('taco-rewards-target-subaccount')
        
        if (savedPrincipal) {
          targetPrincipal.value = savedPrincipal
        }
        if (savedSubaccount) {
          targetSubaccount.value = savedSubaccount
        }
      } catch (error) {
        console.warn('Failed to load saved account from localStorage:', error)
      }
    }
    
    const saveAccount = () => {
      try {
        if (targetPrincipal.value.trim()) {
          localStorage.setItem('taco-rewards-target-principal', targetPrincipal.value.trim())
        } else {
          localStorage.removeItem('taco-rewards-target-principal')
        }
        
        if (targetSubaccount.value.trim()) {
          localStorage.setItem('taco-rewards-target-subaccount', targetSubaccount.value.trim())
        } else {
          localStorage.removeItem('taco-rewards-target-subaccount')
        }
      } catch (error) {
        console.warn('Failed to save account to localStorage:', error)
      }
    }
    
    const validateAccount = () => {
      if (!targetPrincipal.value.trim()) {
        return { valid: false, error: 'Target principal is required' }
      }
      
      try {
        // Validate principal format
        Principal.fromText(targetPrincipal.value.trim())
      } catch (error) {
        return { valid: false, error: 'Invalid principal format' }
      }
      
      // Validate subaccount if provided (should be hex string, 32 bytes = 64 hex chars)
      if (targetSubaccount.value.trim()) {
        const subaccountHex = targetSubaccount.value.trim()
        if (!/^[0-9a-fA-F]{64}$/.test(subaccountHex)) {
          return { valid: false, error: 'Subaccount must be 64 hex characters (32 bytes) or empty' }
        }
      }
      
      return { valid: true }
    }

    const loadUserNeurons = async () => {
      if (!userLoggedIn.value) return
      
      isLoading.value = true
      errorMessage.value = ''

      try {
        // Call SNS Governance to get user's neurons
        const snsGovId = 'lhdfz-wqaaa-aaaaq-aae3q-cai' // TACO SNS Governance
        const snsGov = await createSnsGovernanceActor(snsGovId)
        
        const neuronsResult = await snsGov.list_neurons({
          of_principal: [Principal.fromText(userPrincipal.value)],
          limit: 1000,
          start_page_at: []
        })

        neurons.value = neuronsResult.neurons || []
        
        // Get balances for all neurons
        await loadNeuronBalances()

      } catch (error) {
        console.error('Error loading neurons:', error)
        errorMessage.value = 'Failed to load neurons: ' + error.message
      } finally {
        isLoading.value = false
      }
    }

    const loadNeuronBalances = async () => {
      if (neurons.value.length === 0) return

      try {
        const rewardsActor = await getRewardsActor()
        
        // Extract neuron IDs (handle optional IDs) for filtering
        const userNeuronIds = new Set()
        neurons.value
          .filter(neuron => neuron.id && neuron.id.length > 0)
          .forEach(neuron => {
            const neuronIdHex = formatNeuronIdForMap(neuron.id[0].id)
            userNeuronIds.add(neuronIdHex)
          })

        if (userNeuronIds.size === 0) return

        // Get all balances from the canister
        const allBalances = await rewardsActor.getAllNeuronRewardBalances()
        
        // Filter for only the user's neurons and store in map
        neuronBalances.value.clear()
        for (const [neuronId, balance] of allBalances) {
          const neuronIdHex = formatNeuronIdForMap(neuronId)
          if (userNeuronIds.has(neuronIdHex)) {
            neuronBalances.value.set(neuronIdHex, balance)
          }
        }

      } catch (error) {
        console.error('Error loading neuron balances:', error)
        errorMessage.value = 'Failed to load neuron balances: ' + error.message
      }
    }

    const createSnsGovernanceActor = async (canisterId) => {
      const authClient = await AuthClient.create({
        idleOptions: { disableIdle: true }
      })
      const identity = await authClient.getIdentity()
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
    }

    const getRewardsActor = async () => {
      const canisterId = tacoStore.rewardsCanisterId()
      if (!canisterId) {
        throw new Error('Rewards canister ID not found')
      }

      const authClient = await AuthClient.create({
        idleOptions: { disableIdle: true }
      })
      const identity = await authClient.getIdentity()
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
    }

    const refreshData = async () => {
      await loadUserNeurons()
    }

    const claimRewards = async (neuronIds) => {
      const validation = validateAccount()
      if (!validation.valid) {
        errorMessage.value = validation.error
        return
      }
      
      // Save account for future use
      saveAccount()
      
      // Clear messages
      errorMessage.value = ''
      successMessage.value = ''
      
      // Mark neurons as being claimed
      neuronIds.forEach(id => {
        const key = formatNeuronIdForMap(id)
        claimingNeurons.value.add(key)
      })
      
      try {
        const rewardsActor = await getRewardsActor()
        
        // Build ICRC1 Account object
        const account = {
          owner: Principal.fromText(targetPrincipal.value.trim()),
          subaccount: targetSubaccount.value.trim() ? 
            [hexStringToUint8Array(targetSubaccount.value.trim())] : []
        }
        
        // Call withdraw with account and neuron IDs
        const result = await rewardsActor.withdraw(account, neuronIds)
        
        if ('Ok' in result) {
          const transactionId = result.Ok
          successMessage.value = `Successfully claimed rewards! Transaction ID: ${transactionId}`
          
          // Refresh balances and withdrawal history to show updated amounts
          await loadNeuronBalances()
          await loadUserWithdrawalHistory()
        } else {
          // Handle ICRC1 transfer errors
          const error = result.Err
          if ('InsufficientFunds' in error) {
            errorMessage.value = `Insufficient funds: Balance is ${error.InsufficientFunds.balance}`
          } else if ('BadFee' in error) {
            errorMessage.value = `Bad fee: Expected ${error.BadFee.expected_fee}`
          } else if ('GenericError' in error) {
            errorMessage.value = `Error ${error.GenericError.error_code}: ${error.GenericError.message}`
          } else {
            errorMessage.value = `Claim failed: ${JSON.stringify(error)}`
          }
        }
      } catch (error) {
        console.error('Error claiming rewards:', error)
        errorMessage.value = 'Failed to claim rewards: ' + error.message
      } finally {
        // Remove neurons from claiming set
        neuronIds.forEach(id => {
          const key = formatNeuronIdForMap(id)
          claimingNeurons.value.delete(key)
        })
      }
    }

    const claimAllRewards = async () => {
      const claimableNeuronIds = neurons.value
        .filter(neuron => getNeuronBalance(neuron.id) > 0)
        .map(neuron => neuron.id[0].id)
      
      await claimRewards(claimableNeuronIds)
    }

    const formatNeuronId = (neuronId) => {
      try {
        if (!neuronId) return 'Unknown'
        
        let id
        // Handle different neuronId formats
        if (Array.isArray(neuronId) && neuronId.length > 0 && neuronId[0].id) {
          // Format from SNS governance: [{ id: Uint8Array }]
          id = neuronId[0].id
        } else if (neuronId instanceof Uint8Array || Array.isArray(neuronId)) {
          // Direct Uint8Array or array format (from withdrawal history)
          id = neuronId
        } else {
          return 'Unknown Format'
        }
        
        if (!id || id.length === 0) return 'Unknown'
        
        const hex = Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('')
        return hex.length > 12 ? hex.substring(0, 8) + '...' + hex.substring(hex.length - 4) : hex
      } catch (error) {
        console.error('Error formatting neuron ID:', error, neuronId)
        return 'Format Error'
      }
    }

    const formatNeuronIdForMap = (neuronId) => {
      try {
        return Array.from(neuronId).map(b => b.toString(16).padStart(2, '0')).join('')
      } catch (error) {
        return 'unknown'
      }
    }

    const getNeuronBalance = (neuronId) => {
      if (!neuronId || neuronId.length === 0) return 0
      const key = formatNeuronIdForMap(neuronId[0].id)
      return neuronBalances.value.get(key) || 0
    }

    const getBalanceClass = (balance) => {
      if (balance > 0) return 'text-success'
      return 'text-muted'
    }
    
    const isNeuronClaiming = (neuronId) => {
      if (!neuronId || neuronId.length === 0) return false
      const key = formatNeuronIdForMap(neuronId[0].id)
      return claimingNeurons.value.has(key)
    }

    const formatVotingPower = (multiplier) => {
      try {
        return (Number(multiplier) / 100).toFixed(0)
      } catch (error) {
        return '0'
      }
    }

    const formatStake = (stakeE8s) => {
      try {
        return (Number(stakeE8s) / 100_000_000).toFixed(2)
      } catch (error) {
        return '0.00'
      }
    }

    const formatMaturity = (maturityE8s) => {
      try {
        return (Number(maturityE8s) / 100_000_000).toFixed(2)
      } catch (error) {
        return '0.00'
      }
    }

    // Format TACO amount from satoshis with full precision
    const formatTacoPrecise = (satoshis) => {
      try {
        const TACO_SATOSHIS_PER_TOKEN = 100_000_000 // 10^8
        const satoshisBI = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis || 0)
        const tacoTokens = Number(satoshisBI) / TACO_SATOSHIS_PER_TOKEN
        const formatted = tacoTokens.toFixed(8)
        return formatted.replace(/\.?0+$/, '') || '0'
      } catch (error) {
        console.error('Error formatting TACO amount:', error, satoshis)
        return '0'
      }
    }
    
    // Convert hex string to Uint8Array for subaccount
    const hexStringToUint8Array = (hexString) => {
      const result = new Uint8Array(hexString.length / 2)
      for (let i = 0; i < hexString.length; i += 2) {
        result[i / 2] = parseInt(hexString.substr(i, 2), 16)
      }
      return result
    }

    // Load user's withdrawal history
    const loadUserWithdrawalHistory = async () => {
      isLoadingHistory.value = true
      try {
        const rewardsActor = await getRewardsActor()
        const result = await rewardsActor.getUserWithdrawalHistory([20]) // Get last 20 records
        
        if ('ok' in result) {
          // Convert BigInt values to regular numbers to avoid JSON.stringify issues
          userWithdrawalHistory.value = result.ok.map(record => ({
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
          console.error('Error loading withdrawal history:', result.err)
        }
      } catch (error) {
        console.error('Failed to load withdrawal history:', error)
      } finally {
        isLoadingHistory.value = false
      }
    }

    // Format timestamp from nanoseconds
    const formatTimestamp = (timestampNS) => {
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
    }

    ///////////
    // Watchers //
    ///////////
    
    // Watch for changes in user logged in state
    watch(userLoggedIn, (newState) => {
      if (newState) {
        loadUserNeurons()
        loadUserWithdrawalHistory()
      } else {
        // Clear data when user logs out
        neurons.value = []
        neuronBalances.value.clear()
        userWithdrawalHistory.value = []
        errorMessage.value = ''
      }
    }, { immediate: true })

    /////////////
    // Lifecycle //
    /////////////
    
    onMounted(() => {
      loadSavedAccount()
      if (userLoggedIn.value) {
        loadUserNeurons()
        loadUserWithdrawalHistory()
      }
    })

    ////////////
    // Return //
    ////////////
    
    return {
      // reactive data
      userLoggedIn,
      truncatedPrincipal,
      isLoading,
      errorMessage,
      successMessage,
      neurons,
      totalRewards,
      claimableNeurons,
      targetPrincipal,
      targetSubaccount,
      claimingNeurons,
      userWithdrawalHistory,
      isLoadingHistory,
      
      // methods
      iidLogIn,
      refreshData,
      claimRewards,
      claimAllRewards,
      formatNeuronId,
      getNeuronBalance,
      getBalanceClass,
      formatVotingPower,
      formatStake,
      formatMaturity,
      formatTacoPrecise,
      isNeuronClaiming,
      saveAccount,
      loadUserWithdrawalHistory,
      formatTimestamp
    }
  }
}
</script>

<style scoped>
/* Rewards view specific styles */
.rewards-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.rewards-view__top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--dark-orange-to-light-orange);
  border-radius: 10px;
  padding: 0 1rem;
  margin: 0 1rem;
}

.rewards-view__top-bar__title {
  color: var(--black-to-white);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

/* Table styles */
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

/* Ensure consistent styling with other views */
.standard-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scroll-y-container {
  overflow-y: auto;
}
</style>
