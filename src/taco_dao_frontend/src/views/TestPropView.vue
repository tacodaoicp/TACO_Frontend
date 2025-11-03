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

          <!-- Create GNSF Proposal Section -->
          <div v-if="isEligible" class="taco-container taco-container--l1 mt-3 p-4">
            <h5 class="mb-3">Create Test GNSF Proposal</h5>
            <p class="text-muted mb-3">
              Now that you're eligible, you can create a test Generic Nervous System Function proposal.
              This will call <code>test_gnsf1</code> with a Principal parameter.
            </p>

            <!-- Neuron Selection -->
            <div class="mb-3">
              <label class="form-label">Select Neuron for Proposal</label>
              <select 
                v-model="selectedNeuronIndex" 
                class="form-select"
                :disabled="proposalSubmitting"
              >
                <option :value="null">Choose a neuron...</option>
                <option 
                  v-for="(neuron, index) in eligibleNeurons.filter(n => n.meetsRequirements)" 
                  :key="index"
                  :value="index"
                >
                  Neuron {{ index + 1 }} - {{ formatTaco(neuron.stake) }} TACO
                </option>
              </select>
            </div>

            <!-- Function ID Input -->
            <div class="mb-3">
              <label class="form-label">Function ID</label>
              <input 
                v-model="functionId" 
                type="text" 
                class="form-control"
                placeholder="Enter the registered GNSF function ID (e.g., 1000)"
                :disabled="proposalSubmitting"
              />
              <small class="form-text text-muted">
                The function_id assigned when test_gnsf1 was registered via AddGenericNervousSystemFunction
              </small>
            </div>

            <!-- Principal Parameter Input -->
            <div class="mb-3">
              <label class="form-label">Principal Parameter</label>
              <input 
                v-model="principalParam" 
                type="text" 
                class="form-control"
                placeholder="Enter a principal (e.g., rrkah-fqaaa-aaaaa-aaaaq-cai)"
                :disabled="proposalSubmitting"
              />
              <small class="form-text text-muted">
                The principal parameter to pass to test_gnsf1
              </small>
            </div>

            <!-- Proposal Metadata -->
            <div class="mb-3">
              <label class="form-label">Proposal Title</label>
              <input 
                v-model="proposalTitle" 
                type="text" 
                class="form-control"
                placeholder="Test GNSF Proposal"
                :disabled="proposalSubmitting"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Proposal URL</label>
              <input 
                v-model="proposalUrl" 
                type="text" 
                class="form-control"
                placeholder="https://example.com/proposal"
                :disabled="proposalSubmitting"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Proposal Summary</label>
              <textarea 
                v-model="proposalSummary" 
                class="form-control"
                rows="3"
                placeholder="This is a test proposal to execute test_gnsf1..."
                :disabled="proposalSubmitting"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button 
              @click="submitTestProposal" 
              class="btn btn-primary btn-lg"
              :disabled="!canSubmitProposal || proposalSubmitting"
            >
              <span v-if="proposalSubmitting">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Submitting Proposal...
              </span>
              <span v-else>
                <i class="fa fa-paper-plane me-2"></i>
                Submit Test Proposal
              </span>
            </button>

            <!-- Success Message -->
            <div v-if="proposalSuccess" class="alert alert-success mt-3" role="alert">
              <i class="fa fa-check-circle me-2"></i>
              <strong>Proposal submitted successfully!</strong>
              <div class="mt-2">
                Proposal ID: <code>{{ lastProposalId }}</code>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="proposalError" class="alert alert-danger mt-3" role="alert">
              <i class="fa fa-exclamation-triangle me-2"></i>
              {{ proposalError }}
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
import { Principal } from '@dfinity/principal'
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { useProposalEligibility } from '../composables/useProposalEligibility'
import { useGNSFProposal } from '../composables/useGNSFProposal'
import { IDL } from '@dfinity/candid'

// Use the proposal eligibility composable
const {
  checking,
  eligibilityChecked,
  errorMessage,
  isLoggedIn,
  hasProposalPermission,
  hasSufficientTaco,
  eligibleNeurons,
  isEligible,
  checkEligibility,
  formatTaco
} = useProposalEligibility()

// Use the GNSF proposal composable
const {
  submitting: proposalSubmitting,
  error: proposalError,
  lastProposalId,
  createProposalWithCustomParams
} = useGNSFProposal()

// Proposal form state
const selectedNeuronIndex = ref<number | null>(null)
const functionId = ref('1000')
const principalParam = ref('')
const proposalTitle = ref('Test GNSF Proposal - test_gnsf1')
const proposalUrl = ref('https://github.com/yourdao/proposals')
const proposalSummary = ref('This is a test proposal to execute the test_gnsf1 Generic Nervous System Function with a Principal parameter.')
const proposalSuccess = ref(false)

// Computed
const canSubmitProposal = computed(() => {
  return selectedNeuronIndex.value !== null && 
         functionId.value && 
         principalParam.value &&
         proposalTitle.value &&
         proposalSummary.value &&
         !proposalSubmitting.value
})

// Submit the test proposal
const submitTestProposal = async () => {
  proposalSuccess.value = false
  
  try {
    // Validate inputs
    if (selectedNeuronIndex.value === null) {
      throw new Error('Please select a neuron')
    }
    
    if (!functionId.value) {
      throw new Error('Please enter a function ID')
    }
    
    if (!principalParam.value) {
      throw new Error('Please enter a principal parameter')
    }
    
    // Get the selected neuron
    const selectedNeuron = eligibleNeurons.value.filter(n => n.meetsRequirements)[selectedNeuronIndex.value]
    if (!selectedNeuron) {
      throw new Error('Selected neuron not found')
    }
    
    // Parse the principal
    let principal: Principal
    try {
      principal = Principal.fromText(principalParam.value.trim())
    } catch (err) {
      throw new Error('Invalid principal format')
    }
    
    // Parse function ID
    const funcId = BigInt(functionId.value)
    
    // Get neuron ID as Uint8Array
    const neuronId = selectedNeuron.id[0]?.id || selectedNeuron.id
    let neuronIdBytes: Uint8Array
    
    if (neuronId instanceof Uint8Array) {
      neuronIdBytes = neuronId
    } else if (Array.isArray(neuronId)) {
      neuronIdBytes = new Uint8Array(neuronId)
    } else {
      throw new Error('Invalid neuron ID format')
    }
    
    // Create the proposal with custom parameters
    const proposalId = await createProposalWithCustomParams(
      neuronIdBytes,
      funcId,
      proposalTitle.value,
      proposalUrl.value,
      proposalSummary.value,
      {
        functionName: 'test_gnsf1',
        parameters: [{
          name: 'principal',
          type: IDL.Principal,
          value: principal
        }]
      }
    )
    
    proposalSuccess.value = true
    console.log('Proposal created with ID:', proposalId.toString())
    
  } catch (err: any) {
    console.error('Error submitting test proposal:', err)
    // Error is already set by the composable
  }
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

