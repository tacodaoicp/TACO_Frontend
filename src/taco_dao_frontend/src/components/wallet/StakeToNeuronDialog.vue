<template>

  <div class="modal" 
        :class="{ show: show }" 
        :style="{ display: show ? 'block' : 'none' }" 
        tabindex="-1" 
        @click="handleBackdropClick">
    
    <div class="modal-dialog modal-dialog-centered">

      <div class="modal-content">

        <div class="modal-header">

          <div class="modal-title gap-2">

            <i class="stake-icon fa fa-plus-circle me-2"></i>
            
            <span class="stake-title-text">Add to Stake</span>

          </div>

          <button type="button" class="btn stake-btn-close" @click="close">

            <i class="fa fa-times"></i>

          </button>

        </div>
        
        <div class="modal-body">

          <!-- neuron info -->
          <div v-if="neuron"
          class="d-flex flex-column">

            <span class="stake-to-text">Staking to</span>

            <div class="neuron-info">

              <span class="fw-bold">{{ neuron.displayName }}</span>

              <span><span class="fw-bold">Current Stake:</span> {{ formatBalance(neuron.stake, 8) }} TACO</span>

            </div>

          </div>

          <!-- amount to stake -->
          <div class="mt-3">

            <label for="stakeAmount" class="form-label">

              <span class="stake-amount-text">Amount to Stake <span class="small">(TACO)</span></span>
                
            </label>

            <input
                id="stakeAmount"
                v-model="stakeAmount"
                type="number"
                class="form-control taco-input"
                placeholder="0"
                step="0.00000001"
                min="0.00000001"
                :disabled="isStaking"/>            

            <div class="d-flex justify-content-end w-100 mt-1">

              <span class="small">Available: {{ formatBalance(tacoBalance, 8) }} TACO</span>

            </div>

          </div>

          <!-- stake preview -->
          <div v-if="stakeAmountBigInt > 0n" class="mt-3">

            <div class="stake-preview d-flex flex-column">

              <div class="stake-preview-row d-flex flex-wrap justify-content-between align-items-center">

                <span class="fw-bold">Amount to stake: </span>

                <span class="ms-auto">{{ formatBalance(stakeAmountBigInt, 8) }} TACO</span>

              </div>

              <div class="stake-preview-row d-flex flex-wrap justify-content-between align-items-center">

                <span class="fw-bold">Transfer fee: </span>

                <span class="ms-auto">{{ formatBalance(tacoFee, 8) }} TACO</span>

              </div>

              <div class="stake-preview-row d-flex flex-wrap justify-content-between align-items-center">

                <span class="fw-bold">Total required: </span>

                <span class="ms-auto">{{ formatBalance(stakeAmountBigInt + tacoFee, 8) }} TACO</span>

              </div>

            </div>

          </div>

          <!-- success message -->
          <div v-if="successMessage" class="alert mb-0 mt-3 px-3 py-2" 
          style="background-color: var(--green);">

            <i class="fa fa-check-circle me-2" style="color: var(--black) !important;"></i>

            <span style="color: var(--black) !important;">{{ successMessage }}</span>

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
            :disabled="isStaking">

            <span>Cancel</span>

          </button>

          <button 
            v-if="!isSuccess"
            type="button" 
            class="btn taco-btn taco-btn--green"
            @click="handleStake"
            :disabled="!canStake || isStaking">

            <span style="color: var(--black) !important;">Add to Stake</span>

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
  margin-bottom: 0.75rem;
}

.modal-body {
  padding: 0 1.5rem 0;
}

.modal-title {
  display: flex;
  align-items: center;
  margin: 1.5rem 0px 0px 1.5rem;
}

.stake-icon {
  font-size: 3.5rem;
  color: var(--dark-brown-to-white) !important;
}

.stake-title-text {
  font-size: 1.5rem;
  font-weight: 600;
}

.stake-btn-close {
  margin: 1rem .5rem 0 0;

  i {
    font-size: 1.5rem;
    color: var(--black-to-white);
  }
}

.stake-to-text {
  font-size: 1.25rem;
  display: inline-block;
  margin-bottom: .5rem;
}

.stake-amount-text {
  font-size: 1.25rem;
}

.neuron-info {
  display: flex;
  flex-direction: column;
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: .5rem;
  overflow: clip;

  > span {
    padding: .5rem .75rem;
    border-bottom: 1px solid var(--dark-orange);

    &:hover {
      background-color: var(--dark-orange);
    }

    &:last-child {
      border-bottom: none;
    }

  }

}

.stake-preview {
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);  
  border-radius: .5rem;
  overflow: clip;
}

.stake-preview-row {
  padding: .5rem .75rem;
  border-bottom: 1px solid var(--dark-orange);

  &:hover {
    background-color: var(--dark-orange);
  }

  &:last-child {
    border-bottom: none;
  }
}

.modal-footer {
  border-top: none;
}

</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

///////////
// store //
///////////

// # SETUP #
const tacoStore = useTacoStore()

// # STATE #
// none

// # ACTIONS #
const { appLoadingOn, appLoadingOff } = tacoStore




interface StakeToNeuronDialogProps {
  show: boolean
  neuron: any | null
  tacoBalance: bigint
}

interface StakeToNeuronDialogEmits {
  (e: 'close'): void
  (e: 'staked', neuron: any): void
}

const props = defineProps<StakeToNeuronDialogProps>()
const emit = defineEmits<StakeToNeuronDialogEmits>()

// State
const stakeAmount = ref('')
const isStaking = ref(false)
const error = ref('')
const successMessage = ref('')
const isSuccess = ref(false)

// Constants
const tacoFee = 10000n // 0.0001 TACO

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

const canStake = computed(() => {
  return stakeAmountBigInt.value > 0n && 
         stakeAmountBigInt.value + tacoFee <= props.tacoBalance &&
         !isStaking.value &&
         props.neuron
})

// Watch for dialog open/close to reset state
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

const resetForm = () => {
  stakeAmount.value = ''
  error.value = ''
  successMessage.value = ''
  isStaking.value = false
  isSuccess.value = false
}

const close = () => {
  if (!isStaking.value) {
    emit('close')
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const handleStake = async () => {

  if (!props.neuron || !canStake.value) return

  // turn on app loading
  appLoadingOn()  
  
  isStaking.value = true
  error.value = ''
  
  try {
    await tacoStore.stakeToNeuron(props.neuron.id, stakeAmountBigInt.value)
    
    // Show success state in dialog
    isSuccess.value = true
    successMessage.value = `Successfully staked ${formatBalance(stakeAmountBigInt.value, 8)} TACO to ${props.neuron.displayName}!`
    
    // Also show toast notification
    tacoStore.addToast({
      id: Date.now(),
      code: '',
      title: 'Staking Successful!',
      icon: 'fa-solid fa-check',
      message: `Successfully staked ${formatBalance(stakeAmountBigInt.value, 8)} TACO to ${props.neuron.displayName}`
    })
    
    emit('staked', props.neuron)
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      close()
    }, 3000)
  } catch (err: any) {
    console.error('Staking error:', err)
    error.value = err.message || 'Failed to stake TACO. Please try again.'
    tacoStore.addToast({
      id: Date.now(),
      code: '',
      title: 'Staking Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: `Failed to stake, please try again.`
    })
  } finally {
    isStaking.value = false
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