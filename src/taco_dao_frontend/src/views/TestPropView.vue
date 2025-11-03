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
          
          <!-- title -->
          <TacoTitle level="h2" emoji="🧪" title="Test Proposal Eligibility" class="mt-4" />

          <!-- description -->
          <div class="taco-container taco-container--l1 mt-3 p-4">
            <h5 class="mb-3">Generic Nervous System Function Proposal</h5>
            <p class="text-muted mb-0">
              This page allows you to check if you're eligible to create a Generic Nervous System Function (GNSF) proposal on the TACO SNS DAO.
            </p>
            <p class="text-muted mt-2 mb-0">
              To create a proposal, you must:
            </p>
            <ul class="text-muted mt-2">
              <li>Be logged in with your Internet Identity</li>
              <li>Have access to a TACO neuron with proposal submission permission</li>
              <li>Have at least 7 TACO that are not dissolved in that neuron</li>
            </ul>
          </div>

          <!-- check eligibility button -->
          <div class="taco-container taco-container--l1 mt-3 p-4">
            <h5 class="mb-3">Check Your Eligibility</h5>
            
            <button 
              @click="checkEligibility" 
              class="btn btn-primary btn-lg"
              :disabled="checking"
            >
              <span v-if="checking">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Checking...
              </span>
              <span v-else>
                <i class="fa fa-check-circle me-2"></i>
                Check Eligibility
              </span>
            </button>

            <!-- results -->
            <div v-if="eligibilityChecked" class="mt-4">
              <div class="eligibility-results">
                <!-- logged in status -->
                <div class="eligibility-item" :class="{ 'success': isLoggedIn, 'error': !isLoggedIn }">
                  <div class="eligibility-icon">
                    <i :class="isLoggedIn ? 'fa fa-check-circle text-success' : 'fa fa-times-circle text-danger'"></i>
                  </div>
                  <div class="eligibility-content">
                    <h6>Logged In</h6>
                    <p class="text-muted mb-0">
                      {{ isLoggedIn ? 'You are logged in with Internet Identity' : 'You need to log in with Internet Identity' }}
                    </p>
                  </div>
                </div>

                <!-- neuron with permission status -->
                <div class="eligibility-item" :class="{ 'success': hasProposalPermission, 'error': !hasProposalPermission }">
                  <div class="eligibility-icon">
                    <i :class="hasProposalPermission ? 'fa fa-check-circle text-success' : 'fa fa-times-circle text-danger'"></i>
                  </div>
                  <div class="eligibility-content">
                    <h6>Neuron with Proposal Permission</h6>
                    <p class="text-muted mb-0" v-if="hasProposalPermission">
                      You have {{ eligibleNeurons.length }} neuron(s) with proposal submission permission
                    </p>
                    <p class="text-muted mb-0" v-else>
                      You don't have a neuron with proposal submission permission
                    </p>
                  </div>
                </div>

                <!-- sufficient TACO status -->
                <div class="eligibility-item" :class="{ 'success': hasSufficientTaco, 'error': !hasSufficientTaco }">
                  <div class="eligibility-icon">
                    <i :class="hasSufficientTaco ? 'fa fa-check-circle text-success' : 'fa fa-times-circle text-danger'"></i>
                  </div>
                  <div class="eligibility-content">
                    <h6>Sufficient Undissolved TACO</h6>
                    <p class="text-muted mb-0" v-if="hasSufficientTaco">
                      You have at least 7 TACO that are not dissolved
                    </p>
                    <p class="text-muted mb-0" v-else-if="hasProposalPermission">
                      Your neurons with proposal permission don't have enough undissolved TACO (need 7 TACO minimum)
                    </p>
                    <p class="text-muted mb-0" v-else>
                      N/A - You need a neuron with proposal permission first
                    </p>
                  </div>
                </div>

                <!-- overall eligibility -->
                <div class="eligibility-summary mt-4 p-3" :class="{ 'eligible': isEligible, 'not-eligible': !isEligible }">
                  <h5 class="mb-2">
                    <i :class="isEligible ? 'fa fa-check-circle text-success' : 'fa fa-exclamation-triangle text-warning'"></i>
                    {{ isEligible ? 'You are eligible!' : 'Not eligible yet' }}
                  </h5>
                  <p class="mb-0" v-if="isEligible">
                    You meet all requirements to create a Generic Nervous System Function proposal.
                  </p>
                  <p class="mb-0" v-else>
                    Please address the requirements above to become eligible for proposal creation.
                  </p>
                </div>

                <!-- eligible neurons details -->
                <div v-if="eligibleNeurons.length > 0" class="mt-4">
                  <h6 class="mb-3">Your Eligible Neurons</h6>
                  <div class="eligible-neurons-list">
                    <div 
                      v-for="(neuron, index) in eligibleNeurons" 
                      :key="neuron.id"
                      class="neuron-card taco-container taco-container--l2 p-3 mb-2"
                    >
                      <div class="d-flex justify-content-between align-items-start">
                        <div>
                          <div class="neuron-id">
                            <strong>Neuron {{ index + 1 }}</strong>
                          </div>
                          <div class="neuron-details mt-2">
                            <div class="neuron-detail-item">
                              <span class="text-muted">Stake:</span>
                              <span class="ms-2">{{ formatTaco(neuron.stake) }} TACO</span>
                            </div>
                            <div class="neuron-detail-item">
                              <span class="text-muted">Status:</span>
                              <span class="ms-2" :class="neuron.isUndissolved ? 'text-success' : 'text-warning'">
                                {{ neuron.isUndissolved ? 'Not Dissolved' : 'Dissolving/Dissolved' }}
                              </span>
                            </div>
                            <div class="neuron-detail-item">
                              <span class="text-muted">Eligible:</span>
                              <span class="ms-2" :class="neuron.meetsRequirements ? 'text-success' : 'text-danger'">
                                {{ neuron.meetsRequirements ? 'Yes' : 'No (insufficient stake)' }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- error message -->
            <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">
              <i class="fa fa-exclamation-triangle me-2"></i>
              {{ errorMessage }}
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- footer bar -->
    <FooterBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'

const tacoStore = useTacoStore()

// State
const checking = ref(false)
const eligibilityChecked = ref(false)
const errorMessage = ref<string | null>(null)

// Eligibility results
const isLoggedIn = ref(false)
const hasProposalPermission = ref(false)
const hasSufficientTaco = ref(false)
const eligibleNeurons = ref<any[]>([])

// Computed
const isEligible = computed(() => {
  return isLoggedIn.value && hasProposalPermission.value && hasSufficientTaco.value
})

// Methods
const checkEligibility = async () => {
  checking.value = true
  eligibilityChecked.value = false
  errorMessage.value = null
  
  // Reset results
  isLoggedIn.value = false
  hasProposalPermission.value = false
  hasSufficientTaco.value = false
  eligibleNeurons.value = []

  try {
    // Check 1: Is user logged in?
    isLoggedIn.value = tacoStore.userLoggedIn
    
    if (!isLoggedIn.value) {
      eligibilityChecked.value = true
      checking.value = false
      return
    }

    // Check 2 & 3: Fetch neurons and check permissions and TACO amount
    const neurons = await tacoStore.getTacoNeurons()
    
    if (!neurons || neurons.length === 0) {
      eligibilityChecked.value = true
      checking.value = false
      return
    }

    // Get user's principal
    const userPrincipalStr = tacoStore.userPrincipal

    // Check each neuron for proposal permission and sufficient undissolved TACO
    const minTacoE8s = BigInt(7_00000000) // 7 TACO in e8s
    
    for (const neuron of neurons) {
      let hasSubmitProposalPermission = false
      
      // Check if user has submit proposal permission (type 4) on this neuron
      if (neuron.permissions && Array.isArray(neuron.permissions)) {
        for (const permission of neuron.permissions) {
          if (permission.principal && permission.principal.length > 0) {
            const permissionPrincipal = permission.principal[0]
            
            // Check if this permission is for the current user
            if (permissionPrincipal.toText() === userPrincipalStr) {
              const permissionTypes = permission.permission_type || []
              
              // Check for submit proposal permission (type 4)
              if (permissionTypes.includes(4)) {
                hasSubmitProposalPermission = true
                break
              }
            }
          }
        }
      }
      
      if (hasSubmitProposalPermission) {
        hasProposalPermission.value = true
        
        // Get neuron stake
        const stake = neuron.cached_neuron_stake_e8s || BigInt(0)
        
        // Check dissolve state - neuron should not be dissolved
        const dissolveState = neuron.dissolve_state || []
        let isUndissolved = true
        
        if (dissolveState.length > 0) {
          const state = dissolveState[0]
          
          // If WhenDissolvedTimestampSeconds exists and is in the past, it's dissolved
          if (state.WhenDissolvedTimestampSeconds !== undefined) {
            const dissolveTimestamp = Number(state.WhenDissolvedTimestampSeconds) * 1000
            const now = Date.now()
            
            if (dissolveTimestamp <= now) {
              isUndissolved = false
            }
          }
        }
        
        const meetsRequirements = isUndissolved && stake >= minTacoE8s
        
        if (meetsRequirements && !hasSufficientTaco.value) {
          hasSufficientTaco.value = true
        }
        
        // Add to eligible neurons list
        eligibleNeurons.value.push({
          id: neuron.id,
          stake: stake,
          isUndissolved: isUndissolved,
          meetsRequirements: meetsRequirements
        })
      }
    }
    
  } catch (error: any) {
    console.error('Error checking eligibility:', error)
    errorMessage.value = error.message || 'Failed to check eligibility. Please try again.'
  } finally {
    checking.value = false
    eligibilityChecked.value = true
  }
}

const formatTaco = (e8s: bigint): string => {
  const taco = Number(e8s) / 100000000
  return taco.toFixed(2)
}
</script>

<style scoped lang="scss">
.eligibility-results {
  .eligibility-item {
    display: flex;
    align-items: start;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.5rem;
    border: 2px solid var(--light-gray);
    background: var(--black-to-white);
    
    &.success {
      border-color: var(--success-color, #28a745);
      background: rgba(40, 167, 69, 0.05);
    }
    
    &.error {
      border-color: var(--danger-color, #dc3545);
      background: rgba(220, 53, 69, 0.05);
    }
    
    .eligibility-icon {
      font-size: 1.5rem;
      margin-right: 1rem;
      margin-top: 0.25rem;
    }
    
    .eligibility-content {
      flex: 1;
      
      h6 {
        margin-bottom: 0.5rem;
        color: var(--white-to-black);
      }
    }
  }
  
  .eligibility-summary {
    border-radius: 0.5rem;
    border: 2px solid var(--light-gray);
    
    &.eligible {
      border-color: var(--success-color, #28a745);
      background: rgba(40, 167, 69, 0.1);
    }
    
    &.not-eligible {
      border-color: var(--warning-color, #ffc107);
      background: rgba(255, 193, 7, 0.1);
    }
    
    h5 {
      color: var(--white-to-black);
      
      i {
        margin-right: 0.5rem;
      }
    }
    
    p {
      color: var(--dark-gray);
    }
  }
}

.eligible-neurons-list {
  .neuron-card {
    border: 1px solid var(--light-orange);
    border-radius: 0.5rem;
    
    .neuron-id {
      font-size: 1rem;
      color: var(--white-to-black);
    }
    
    .neuron-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .neuron-detail-item {
        font-size: 0.9rem;
        color: var(--white-to-black);
      }
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .eligibility-item {
    flex-direction: column;
    
    .eligibility-icon {
      margin-bottom: 0.5rem;
    }
  }
}
</style>

