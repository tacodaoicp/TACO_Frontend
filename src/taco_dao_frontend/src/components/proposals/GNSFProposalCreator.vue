<template>
  <div class="gnsf-proposal-creator">
    <div class="taco-container taco-container--l1 p-4">
      <h5 class="mb-3">
        <i class="fa fa-rocket me-2"></i>
        Create GNSF Proposal
      </h5>
      
      <!-- Function Selection -->
      <div class="mb-3">
        <label class="form-label">Function</label>
        <select v-model="selectedFunction" class="form-select" :disabled="submitting">
          <option :value="null">Select a function...</option>
          <option 
            v-for="func in availableFunctions" 
            :key="func.id"
            :value="func"
          >
            {{ func.name }} (ID: {{ func.id }})
          </option>
        </select>
        <small class="form-text text-muted" v-if="selectedFunction">
          {{ selectedFunction.description }}
        </small>
      </div>

      <!-- Dynamic Parameter Inputs -->
      <div v-if="selectedFunction">
        <div 
          v-for="(param, index) in selectedFunction.params" 
          :key="index"
          class="mb-3"
        >
          <label class="form-label">{{ param.label }}</label>
          <input 
            v-model="paramValues[param.name]" 
            :type="param.inputType || 'text'"
            class="form-control"
            :placeholder="param.placeholder"
            :disabled="submitting"
          />
          <small class="form-text text-muted">{{ param.hint }}</small>
        </div>
      </div>

      <!-- Neuron Selection -->
      <div class="mb-3">
        <label class="form-label">Neuron</label>
        <select v-model="selectedNeuronIndex" class="form-select" :disabled="submitting || checkingEligibility">
          <option :value="null">
            {{ checkingEligibility ? 'Loading neurons...' : 'Select a neuron...' }}
          </option>
          <option 
            v-for="(neuron, index) in eligibleNeurons.filter(n => n.meetsRequirements)" 
            :key="index"
            :value="index"
          >
            {{ formatTaco(neuron.stake) }} TACO
          </option>
        </select>
      </div>

      <!-- Proposal Metadata -->
      <div class="mb-3">
        <label class="form-label">Title</label>
        <input 
          v-model="title" 
          type="text" 
          class="form-control"
          :disabled="submitting"
        />
      </div>

      <div class="mb-3">
        <label class="form-label">URL</label>
        <input 
          v-model="url" 
          type="text" 
          class="form-control"
          placeholder="https://forum.com/proposal"
          :disabled="submitting"
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Summary</label>
        <textarea 
          v-model="summary" 
          class="form-control"
          rows="3"
          :disabled="submitting"
        ></textarea>
      </div>

      <!-- Submit Button -->
      <button 
        @click="handleSubmit" 
        class="btn btn-primary"
        :disabled="!canSubmit || submitting"
      >
        <span v-if="submitting">
          <i class="fa fa-spinner fa-spin me-2"></i>
          Submitting...
        </span>
        <span v-else>
          <i class="fa fa-paper-plane me-2"></i>
          Submit Proposal
        </span>
      </button>

      <!-- Success Message -->
      <div v-if="lastProposalId" class="alert alert-success mt-3" role="alert">
        <i class="fa fa-check-circle me-2"></i>
        <strong>Proposal submitted successfully!</strong>
        <div class="mt-2">
          Proposal ID: <code>{{ lastProposalId }}</code>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger mt-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Principal } from '@dfinity/principal'
import { IDL } from '@dfinity/candid'
import { useProposalEligibility } from '../../composables/useProposalEligibility'
import { useGNSFProposal } from '../../composables/useGNSFProposal'

// Available GNSF functions configuration
const availableFunctions = ref([
  {
    id: '1000',
    name: 'test_gnsf1',
    description: 'Test function that takes a Principal parameter',
    params: [
      {
        name: 'principal',
        label: 'Principal',
        inputType: 'text',
        placeholder: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
        hint: 'The principal parameter',
        idlType: IDL.Principal,
        parseValue: (value: string) => Principal.fromText(value)
      }
    ]
  },
  // Add more functions as needed
  // {
  //   id: '1001',
  //   name: 'update_threshold',
  //   description: 'Update the threshold value',
  //   params: [
  //     {
  //       name: 'threshold',
  //       label: 'Threshold',
  //       inputType: 'number',
  //       placeholder: '1000',
  //       hint: 'New threshold value',
  //       idlType: IDL.Nat64,
  //       parseValue: (value: string) => BigInt(value)
  //     }
  //   ]
  // }
])

// Use composables
const {
  checking: checkingEligibility,
  eligibleNeurons,
  checkEligibility,
  formatTaco
} = useProposalEligibility()

const {
  submitting,
  error,
  lastProposalId,
  createProposalWithCustomParams
} = useGNSFProposal()

// Form state
const selectedFunction = ref<any>(null)
const selectedNeuronIndex = ref<number | null>(null)
const paramValues = ref<Record<string, string>>({})
const title = ref('')
const url = ref('')
const summary = ref('')

// Computed
const canSubmit = computed(() => {
  return selectedFunction.value && 
         selectedNeuronIndex.value !== null &&
         title.value &&
         summary.value &&
         Object.keys(paramValues.value).length >= selectedFunction.value.params.length &&
         !submitting.value
})

// Load neurons on mount
onMounted(async () => {
  await checkEligibility()
})

// Handle submission
const handleSubmit = async () => {
  try {
    if (!selectedFunction.value) {
      throw new Error('Please select a function')
    }

    if (selectedNeuronIndex.value === null) {
      throw new Error('Please select a neuron')
    }

    // Get selected neuron
    const neuron = eligibleNeurons.value.filter(n => n.meetsRequirements)[selectedNeuronIndex.value]
    if (!neuron) {
      throw new Error('Selected neuron not found')
    }

    // Get neuron ID as Uint8Array
    const neuronId = neuron.id[0]?.id || neuron.id
    let neuronIdBytes: Uint8Array
    
    if (neuronId instanceof Uint8Array) {
      neuronIdBytes = neuronId
    } else if (Array.isArray(neuronId)) {
      neuronIdBytes = new Uint8Array(neuronId)
    } else {
      throw new Error('Invalid neuron ID format')
    }

    // Parse parameters
    const parameters = selectedFunction.value.params.map((param: any) => {
      const rawValue = paramValues.value[param.name]
      if (!rawValue) {
        throw new Error(`Missing parameter: ${param.label}`)
      }

      try {
        const parsedValue = param.parseValue(rawValue)
        return {
          name: param.name,
          type: param.idlType,
          value: parsedValue
        }
      } catch (err) {
        throw new Error(`Invalid ${param.label}: ${err}`)
      }
    })

    // Submit proposal
    await createProposalWithCustomParams(
      neuronIdBytes,
      BigInt(selectedFunction.value.id),
      title.value,
      url.value,
      summary.value,
      {
        functionName: selectedFunction.value.name,
        parameters
      }
    )

    // Reset form on success
    paramValues.value = {}
    title.value = ''
    summary.value = ''
    
  } catch (err: any) {
    console.error('Error submitting proposal:', err)
    // Error is set by composable
  }
}
</script>

<style scoped lang="scss">
.gnsf-proposal-creator {
  code {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
  }
}
</style>



