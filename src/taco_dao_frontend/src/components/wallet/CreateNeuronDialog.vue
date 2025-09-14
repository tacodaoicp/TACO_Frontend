<template>

  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1" @click="handleBackdropClick">
    
    <!-- modal dialog -->
    <div class="modal-dialog modal-dialog-centered">
      
      <!-- modal content -->
      <div class="modal-content">
        
        <!-- modal header -->
        <div class="modal-header">

          <!-- modal title -->
          <div class="modal-title gap-2">

            <!-- icon -->
            <i class="create-icon fa fa-brain me-2"></i>
            
            <!-- title -->
            <span class="create-title-text">Create New Neuron</span>

          </div>

          <!-- close button -->
          <button type="button" class="btn create-btn-close" @click="close">

            <!-- icon -->
            <i class="fa fa-times"></i>

          </button>

        </div>
        
        <!-- modal body -->
        <div class="modal-body">

          <!-- disclaimer -->
          <div v-if="!isSuccess" class="disclaimer">

            <!-- title -->
            <span>You're about to create a new TACO DAO neuron! This will:</span>

            <ul>
              <li>
                <span>Find the next available neuron ID for your account</span>
              </li>
              <li>
                <span>Transfer your TACO tokens to the neuron</span>
              </li>
              <li>
                <span>Create and activate the neuron for voting</span>
              </li>
            </ul>

          </div>

          <!-- amount to stake label -->
          <label v-if="!isSuccess" for="createAmount" class="form-label">

            <!-- title -->
            <span class="create-amount-text">Amount to Stake <span class="small">(TACO)</span></span>

          </label>

          <!-- amount to stake input -->
          <input
            v-if="!isSuccess"
            id="createAmount"
            v-model="stakeAmount"
            type="number"
            class="form-control taco-input"
            placeholder="0.00000000"
            step="0.00000001"
            min="0.00000001"
            :disabled="isCreating"
          />

          <!-- amount to stake info -->
          <div v-if="!isSuccess" class="d-flex justify-content-between flex-wrap w-100 mt-1">

            <div>

              <span v-if="stakeAmount && stakeAmountBigInt < 100000000n" class="small" style="color: var(--red-to-light-red);">Minimum stake: 1 TACO</span>

            </div>

            <div class="ms-auto">

              <span class="small">Available: {{ formatBalance(tacoBalance, 8) }} TACO</span>

            </div>

          </div>

          <!-- dissolve period label -->
          <label v-if="!isSuccess" for="dissolveDays" class="form-label mt-1">

            <!-- title -->
            <span class="dissolve-period-text">Dissolve Period <span class="small">(Days)</span></span>

          </label>

          <!-- dissolve period input -->
          <input
            v-if="!isSuccess"
            id="dissolveDays"
            v-model.number="dissolveDays"
            type="number"
            class="form-control taco-input"
            :class="{ 'is-invalid': dissolveDays && (dissolveDays < 7 || dissolveDays > 30.44) }"
            min="7"
            max="30.44"
            step="1"
            placeholder="Enter days"
            :disabled="isCreating"
          />

          <!-- dissolve period error -->
          <span v-if="dissolveDays && (dissolveDays < 7 || dissolveDays > 30.44) && !isSuccess" 
            class="small" 
            style="color: var(--red-to-light-red);">Min 7, Max 30.44 days</span>

          <!-- preview -->
          <div v-if="
            dissolveDays >= 7 
            && dissolveDays <= 30.44
            && dissolveDays >= 7
            && stakeAmount 
            && stakeAmountBigInt >= 100000000n" 
            class="dissolve-preview"
            :class="{ 'mt-3': !isSuccess }">
            
            <span v-if="!isSuccess" class="dissolve-preview-text">Neuron Preview:</span>

            <span v-if="isSuccess" class="dissolve-preview-text">Staked Neuron:</span>

            <div class="neuron-preview d-flex flex-column">

              <div class="d-flex justify-content-between flex-wrap">

                <span class="fw-bold">Dissolve Period:</span>

                <span class="ms-auto">{{ dissolveDays }} days ({{ Math.round(dissolveDays / 30 * 10) / 10 }} months)</span>
              
              </div>

              <div class="d-flex justify-content-between flex-wrap">

                <span class="fw-bold">Initial State:</span>
                
                <span class="ms-auto">Locked (not dissolving)</span>
              
              </div>

              <div class="d-flex justify-content-between flex-wrap">

                <span class="fw-bold">Amount to stake:</span>

                <span class="ms-auto">{{ formatBalance(stakeAmountBigInt, 8) }} TACO</span>
              
              </div>

              <div class="d-flex justify-content-between flex-wrap">

                <span class="fw-bold">Transfer fee:</span>

                <span class="ms-auto">{{ formatBalance(tacoFee, 8) }} TACO</span>

              </div>

              <div class="d-flex justify-content-between flex-wrap">

                <span class="fw-bold">Total required:</span>

                <span class="ms-auto">{{ formatBalance(stakeAmountBigInt + tacoFee, 8) }} TACO</span>

              </div>            

            </div>

          </div>

          <!-- success message -->
          <div v-if="successMessage" class="alert mb-0 mt-3 px-3 py-2" 
          style="background-color: var(--green);">

            <i class="fa fa-check-circle me-2"></i>

            <span style="color: var(--black) !important;">{{ successMessage }}</span>

          </div>

          <div v-if="successMessage" class="mt-3 mb-1">

            <span class="d-inline-block text-center">You can now <router-link to="/vote" class="vote-link" style="color: var(--blue-to-light-blue) !important;">Vote on allocations</router-link> and start earning rewards!</span>

          </div>

          <!-- error message -->
          <div v-if="error" class="alert mb-0 mt-3 px-3 py-2"
          style="background-color: var(--red);">

            <i class="fa fa-exclamation-triangle me-2" style="color: var(--white) !important;"></i>

            <span style="color: var(--white) !important;">{{ error }}</span>

          </div>

        </div>
        
        <div class="modal-footer">

          <button 
            v-if="!isSuccess"
            type="button" 
            class="btn"
            style="font-family: 'Space Mono'; color: var(--black-to-white);"
            @click="close" 
            :disabled="isCreating"
          >
            Cancel
          </button>

          <button 
            v-if="isSuccess"
            type="button" 
            class="btn taco-btn taco-btn--green"
            @click="close"
          >
            Close
          </button>

          <button 
            v-if="!isSuccess"
            type="button" 
            class="btn taco-btn taco-btn--green"
            @click="handleCreate"
            :disabled="!canCreate || isCreating">
            Create Neuron
          </button>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">
.modal {
  background-color: rgba(0, 0, 0, 0.5);

  span {
    color: var(--black-to-white);
  }

}

.modal-content {
  background-color: var(--light-orange-to-dark-brown);
  border: 1px solid var(--dark-orange);
}

.modal-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin: 0;
  margin-bottom: 0.5rem;
  padding: 0;
  border-bottom: 0;
  margin-bottom: 1rem;
}

.modal-body {
  padding: 0 1.5rem 0;
}

.modal-title {
  display: flex;
  align-items: center;
  margin: 1.5rem 0px 0px 1.5rem;
}

.create-icon {
  font-size: 3.5rem;
  color: var(--dark-brown-to-white) !important;
}

.create-title-text {
  font-size: 1.5rem;
  font-weight: 600;
}

.create-btn-close {
  margin: 1rem .5rem 0 0;

  i {
    font-size: 1.5rem;
    color: var(--black-to-white);
  }
}

.disclaimer {
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: .5rem;
  padding: .5rem .75rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;

  > span {
    font-size: 1rem;
    display: inline-block;
    margin-bottom: .25rem;
  }

  ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: .5rem;

    li::marker {
      color: var(--black-to-white);
    }

  }

}

.create-amount-text,
.dissolve-period-text,
.dissolve-preview-text {
  font-size: 1.25rem;
}

.dissolve-preview-text {
  display: inline-block;
  margin-bottom: 0.5rem;
}

.neuron-preview {
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  overflow: clip;

  > div {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--dark-orange);

    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background-color: var(--dark-orange);
    }

  }

}

.modal-footer {
  border-top: none;
}

</style>


<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

interface CreateNeuronDialogProps {
  show: boolean
  tacoBalance: bigint
  prefilledAmount?: string
}

interface CreateNeuronDialogEmits {
  (e: 'close'): void
  (e: 'created'): void
}

const props = defineProps<CreateNeuronDialogProps>()
const emit = defineEmits<CreateNeuronDialogEmits>()

const tacoStore = useTacoStore()

// # ACTIONS #
const { appLoadingOn, appLoadingOff } = tacoStore


// State
const stakeAmount = ref('')
const dissolveDays = ref(30.44)
const isCreating = ref(false)
const error = ref('')
const successMessage = ref('')
const isSuccess = ref(false)

// Constants
const tacoFee = 10000n // 0.0001 TACO
const minStake = 100000000n // 1 TACO minimum

// Computed
const stakeAmountBigInt = computed(() => {
  try {
    const amount = parseFloat(stakeAmount.value || '0')
    if (isNaN(amount) || amount <= 0) return 0n
    return BigInt(Math.floor(amount * 100000000)) // Convert to e8s
  } catch {
    return 0n
  }
})

const canCreate = computed(() => {
  return stakeAmountBigInt.value >= minStake && 
         stakeAmountBigInt.value + tacoFee <= props.tacoBalance &&
         dissolveDays.value >= 7 && dissolveDays.value <= 30.44 &&
         !isCreating.value
})

// Watch for dialog open/close to reset state
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

const resetForm = () => {
  // Use prefilled amount if provided, otherwise empty
  stakeAmount.value = props.prefilledAmount || ''
  dissolveDays.value = 30.44
  error.value = ''
  successMessage.value = ''
  isCreating.value = false
  isSuccess.value = false
}

const close = () => {
  if (!isCreating.value) {
    emit('close')
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const handleCreate = async () => {
  if (!canCreate.value) return

  // turn on app loading
  appLoadingOn()
  
  isCreating.value = true
  error.value = ''
  
  try {
    const result = await tacoStore.createNeuron(stakeAmountBigInt.value)
    
    if (result.success && result.subaccount) {
      // Set dissolve delay for the newly created neuron
      try {
        console.log('Setting dissolve delay for new neuron...')
        const delayMonths = dissolveDays.value / 30
        await tacoStore.setNeuronDissolveDelay(result.subaccount, delayMonths)
        console.log(`Dissolve delay set to ${dissolveDays.value} days (${delayMonths} months)`)
      } catch (dissolveError: any) {
        console.warn('Failed to set dissolve delay, but neuron was created:', dissolveError)
        // Don't fail the whole operation, just warn the user
        error.value = `Neuron created successfully, but failed to set dissolve period: ${dissolveError.message}`
      }
      
      // Show success state in dialog
      isSuccess.value = true
      successMessage.value = `Successfully created new neuron with ${formatBalance(stakeAmountBigInt.value, 8)} TACO and ${dissolveDays.value} day dissolve period!`
      
      // Also show toast notification
      tacoStore.addToast({
        id: Date.now(),
        code: '',
        title: 'Neuron Successfully Created!',
        icon: 'fa-solid fa-brain',
        message: `Successfully created new neuron with ${formatBalance(stakeAmountBigInt.value, 8)} TACO and ${dissolveDays.value} day dissolve period`
      })

      emit('created')

    }
  } catch (err: any) {
    console.error('Neuron creation error:', err)
    error.value = err.message || 'Failed to create neuron. Please try again.'
  } finally {
    isCreating.value = false
    appLoadingOff()
  }
}



const formatBalance = (balance: bigint, decimals: number): string => {
  const divisor = BigInt(10 ** decimals)
  const wholePart = balance / divisor
  const fractionalPart = balance % divisor
  
  if (fractionalPart === 0n) {
    return wholePart.toString()
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmedFractional = fractionalStr.replace(/0+$/, '')
  
  if (trimmedFractional === '') {
    return wholePart.toString()
  }
  
  return `${wholePart}.${trimmedFractional}`
}
</script>