<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-dialog">
      <div class="modal-content taco-container taco-container--l1">
        <!-- Header -->
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-gavel me-2"></i>
            Create Proposal: {{ functionInfo?.displayName }}
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            :disabled="submitting"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Description -->
          <div class="alert alert-info">
            <i class="fa fa-info-circle me-2"></i>
            <strong>What this does:</strong> {{ functionInfo?.description }}
          </div>

          <!-- Eligibility Check Section -->
          <div v-if="!eligibilityChecked" class="eligibility-section mb-3">
            <button 
              @click="checkElig" 
              class="btn btn-primary"
              :disabled="checkingEligibility"
            >
              <i :class="checkingEligibility ? 'fa fa-spinner fa-spin' : 'fa fa-check-circle'" class="me-2"></i>
              {{ checkingEligibility ? 'Checking...' : 'Check Eligibility' }}
            </button>
          </div>

          <!-- Eligibility Results -->
          <div v-if="eligibilityChecked" class="eligibility-results mb-3">
            <div class="eligibility-item" :class="{ 'success': isLoggedIn, 'error': !isLoggedIn }">
              <i :class="isLoggedIn ? 'fa fa-check-circle text-success' : 'fa fa-times-circle text-danger'" class="me-2"></i>
              {{ isLoggedIn ? 'Logged in' : 'Not logged in - Please log in first' }}
            </div>
            
            <div v-if="isLoggedIn" class="eligibility-item" :class="{ 'success': hasProposalPermission, 'error': !hasProposalPermission }">
              <i :class="hasProposalPermission ? 'fa fa-check-circle text-success' : 'fa fa-times-circle text-danger'" class="me-2"></i>
              {{ hasProposalPermission ? 'Has proposal permission' : 'No neuron with proposal permission' }}
            </div>
            
            <div v-if="hasProposalPermission" class="eligibility-item" :class="{ 'success': hasSufficientTaco, 'error': !hasSufficientTaco }">
              <i :class="hasSufficientTaco ? 'fa fa-check-circle text-success' : 'fa fa-times-circle text-danger'" class="me-2"></i>
              {{ hasSufficientTaco ? 'Has sufficient undissolved TACO (7+)' : 'Insufficient undissolved TACO (need 7+)' }}
            </div>
          </div>

          <!-- Form (only if eligible) -->
          <div v-if="isEligible">
            <!-- Neuron Selection -->
            <div class="mb-3">
              <label class="form-label">Select Neuron</label>
              <select v-model="selectedNeuronIndex" class="form-select" :disabled="submitting">
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

            <!-- Reason Input -->
            <div class="mb-3">
              <label class="form-label">Reason <span class="text-danger">*</span></label>
              <textarea 
                v-model="reason" 
                class="form-control"
                rows="3"
                :placeholder="reasonPlaceholder"
                :disabled="submitting"
              ></textarea>
              <small class="form-text text-muted">
                Please explain why this action is needed. This will be visible to all DAO members.
              </small>
            </div>

            <!-- Proposal Metadata (Auto-filled, can be edited) -->
            <div class="mb-3">
              <label class="form-label">Proposal Title</label>
              <input 
                v-model="proposalTitle" 
                type="text" 
                class="form-control"
                :disabled="submitting"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Proposal URL</label>
              <input 
                v-model="proposalUrl" 
                type="text" 
                class="form-control"
                :disabled="submitting"
              />
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="proposalId" class="alert alert-success mt-3">
            <i class="fa fa-check-circle me-2"></i>
            <strong>Proposal submitted successfully!</strong>
            <div class="mt-2">
              <div>Proposal ID: <code>{{ proposalId }}</code></div>
              <div class="mt-2">
                <a :href="`/chat/forum/${proposalId}`" class="btn btn-sm btn-outline-success">
                  <i class="fa fa-comments me-1"></i>
                  View Discussion
                </a>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-danger mt-3">
            <i class="fa fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="handleClose"
            :disabled="submitting"
          >
            {{ proposalId ? 'Close' : 'Cancel' }}
          </button>
          <button 
            v-if="isEligible && !proposalId"
            type="button" 
            class="btn btn-primary" 
            @click="submitProposal"
            :disabled="!canSubmit || submitting"
          >
            <i :class="submitting ? 'fa fa-spinner fa-spin' : 'fa fa-paper-plane'" class="me-2"></i>
            {{ submitting ? 'Submitting...' : 'Submit Proposal' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IDL } from '@dfinity/candid'
import { useProposalEligibility } from '../../composables/useProposalEligibility'
import { useGNSFProposal } from '../../composables/useGNSFProposal'
import { GNSF_REGISTRY, type GNSFunctionInfo } from '../../stores/taco.store'

interface Props {
  show: boolean
  functionName: string
  reasonPlaceholder?: string
  contextParams?: Record<string, any>  // Additional context parameters (e.g., token principal)
}

const props = withDefaults(defineProps<Props>(), {
  reasonPlaceholder: 'Please explain why this action is needed...',
  contextParams: () => ({})
})

const emit = defineEmits<{
  'close': []
  'success': [proposalId: bigint]
}>()

// Get function info from registry
const functionInfo = computed<GNSFunctionInfo | undefined>(() => {
  return GNSF_REGISTRY[props.functionName]
})

// Eligibility composable
const {
  checking: checkingEligibility,
  eligibilityChecked,
  isLoggedIn,
  hasProposalPermission,
  hasSufficientTaco,
  eligibleNeurons,
  isEligible,
  checkEligibility,
  formatTaco
} = useProposalEligibility()

// GNSF proposal composable
const {
  submitting,
  error,
  createProposalWithCustomParams
} = useGNSFProposal()

// Form state
const selectedNeuronIndex = ref<number | null>(null)
const reason = ref('')
const proposalTitle = ref('')
const proposalUrl = ref('https://github.com/tacodaoicp/TACO_Backend')
const proposalId = ref<bigint | null>(null)

// Set title when function changes
watch(() => props.functionName, (newName) => {
  if (functionInfo.value) {
    proposalTitle.value = functionInfo.value.displayName
  }
}, { immediate: true })

// Computed
const canSubmit = computed(() => {
  return selectedNeuronIndex.value !== null && 
         reason.value.trim() !== '' &&
         !submitting.value
})

// Check eligibility
const checkElig = async () => {
  await checkEligibility()
}

// Submit proposal
const submitProposal = async () => {
  if (!functionInfo.value) {
    error.value = 'Function not found in registry'
    return
  }

  try {
    // Get selected neuron
    if (selectedNeuronIndex.value === null) {
      throw new Error('Please select a neuron')
    }

    const selectedNeuron = eligibleNeurons.value.filter(n => n.meetsRequirements)[selectedNeuronIndex.value]
    if (!selectedNeuron) {
      throw new Error('Selected neuron not found')
    }

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

    // Build summary with reason
    const summary = `${functionInfo.value.description}\n\nReason: ${reason.value}`

    // Create parameters based on function requirements
    const parameters: { name: string; type: any; value: any }[] = []
    
    // Add additional parameters first (e.g., token principal)
    if (functionInfo.value.additionalParams) {
      for (const param of functionInfo.value.additionalParams) {
        const contextValue = props.contextParams?.[param.name]
        if (contextValue !== undefined) {
          parameters.push({
            name: param.name,
            type: param.type,
            value: contextValue
          })
        }
      }
    }
    
    // Add reason parameter
    if (functionInfo.value.requiresReason) {
      // Check if reason is optional or required based on parameterTypes
      const reasonIsOptional = functionInfo.value.parameterTypes.some(
        (type: any) => type?.name === 'opt' || type?.toString().includes('Opt')
      )
      
      parameters.push({
        name: 'reason',
        type: reasonIsOptional ? IDL.Opt(IDL.Text) : IDL.Text,
        value: reasonIsOptional ? [reason.value] : reason.value
      })
    }

    // Submit proposal
    const id = await createProposalWithCustomParams(
      neuronIdBytes,
      functionInfo.value.functionId,
      proposalTitle.value,
      proposalUrl.value,
      summary,
      {
        functionName: props.functionName,
        parameters
      }
    )

    proposalId.value = id
    emit('success', id)
  } catch (err: any) {
    console.error('Error submitting proposal:', err)
    // Error is set by composable
  }
}

// Handle close
const handleClose = () => {
  if (!submitting.value) {
    emit('close')
  }
}

// Reset when dialog is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    // Reset form
    selectedNeuronIndex.value = null
    reason.value = ''
    proposalId.value = null
    error.value = null
  }
})
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-dialog {
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content {
  border-radius: 0.5rem;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--light-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .modal-title {
    margin: 0;
    color: var(--white-to-black);
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.5;
    
    &:hover {
      opacity: 1;
    }
    
    &::before {
      content: '×';
    }
  }
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--light-gray);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.eligibility-section {
  padding: 1rem;
  background: var(--taco-container-l2-bg);
  border-radius: 0.5rem;
}

.eligibility-results {
  .eligibility-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
    
    &.success {
      background: rgba(40, 167, 69, 0.1);
    }
    
    &.error {
      background: rgba(220, 53, 69, 0.1);
    }
  }
}

code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
</style>

