<template>

  <div v-if="show" class="modal-overlay" @click.self="handleClose">

    <!-- modal dialog -->
    <div class="modal-dialog">

      <!-- Step 1: Are you sure? -->
      <template v-if="step === 1">

        <!-- modal header -->
        <div class="modal-header">

          <!-- modal title -->
          <div class="modal-title gap-2">

            <!-- icon -->
            <i class="transfer-icon fa fa-exclamation-triangle me-2"></i>

            <!-- title -->
            <span class="transfer-title-text">Transfer Neuron</span>

          </div>

          <!-- close button -->
          <button type="button" class="btn transfer-btn-close" @click="handleClose">

            <!-- icon -->
            <i class="fa fa-times"></i>

          </button>

        </div>

        <!-- modal body -->
        <div class="modal-body">

          <!-- title -->
          <span style="font-size: 1.25rem;
                        display: inline-block;
                        margin-bottom: 0.5rem;">
            Transferring
          </span>

          <!-- neuron info -->
          <div class="neuron-info">

            <!-- neuron display name -->
            <span><span class="fw-bold">Neuron:</span> {{ neuron?.displayName }}</span>

            <!-- neuron stake -->
            <span><span class="fw-bold">Stake:</span> {{ formatBalance(neuron?.stake || 0n, 8) }} TACO</span>

            <!-- neuron id -->
            <span><span class="fw-bold">ID:</span> {{ neuron?.idHex }}</span>

          </div>

          <!-- warning message -->
          <div class="warning-box mt-3">

            <!-- icon -->
            <i class="fa fa-exclamation-circle me-2"></i>

            <!-- text -->
            <span>Are you sure you want to transfer this neuron to another principal?</span>

          </div>

          <!-- description -->
          <div class="mt-3">
            <span class="description-text">
              Transferring a neuron will grant full ownership to the new principal and remove all your permissions.
            </span>
          </div>

        </div>

        <!-- modal footer -->
        <div class="modal-footer">

          <!-- cancel button -->
          <button
            type="button"
            class="btn"
            style="font-family: 'Space Mono';"
            @click="handleClose">

            <!-- text -->
            <span style="color: var(--black-to-white);">Cancel</span>

          </button>

          <!-- yes i know button -->
          <button
            type="button"
            class="btn taco-btn taco-btn--green"
            @click="goToStep2">

            <!-- text -->
            <span style="color: var(--black) !important;">Yes, I know</span>

          </button>

        </div>

      </template>

      <!-- Step 2: Warning + Principal Input -->
      <template v-if="step === 2">

        <!-- modal header -->
        <div class="modal-header">

          <!-- modal title -->
          <div class="modal-title gap-2">

            <!-- icon -->
            <i class="transfer-icon fa fa-skull-crossbones me-2"></i>

            <!-- title -->
            <span class="transfer-title-text">Critical Warning</span>

          </div>

          <!-- close button -->
          <button type="button" class="btn transfer-btn-close" @click="handleClose">

            <!-- icon -->
            <i class="fa fa-times"></i>

          </button>

        </div>

        <!-- modal body -->
        <div class="modal-body">

          <!-- critical warning -->
          <div class="critical-warning-box">

            <!-- icon -->
            <i class="fa fa-skull-crossbones me-2"></i>

            <!-- text -->
            <div>
              <span class="fw-bold" style="color: #dc3545 !important;">WARNING:</span>
              <span> If you enter a wrong principal, you will </span>
              <span class="fw-bold" style="color: #dc3545 !important;">lose control over this neuron forever</span>
              <span>. There is </span>
              <span class="fw-bold" style="color: #dc3545 !important;">no way to recover it</span>
              <span>. Double-check the principal before proceeding.</span>
            </div>

          </div>

          <!-- principal input -->
          <div class="mt-3">

            <!-- label -->
            <label for="new-principal" class="mb-2">

              <!-- title -->
              <span style="font-size: 1.25rem;">New Owner Principal ID</span>

            </label>

            <!-- input -->
            <input
              id="new-principal"
              v-model="newPrincipal"
              type="text"
              class="form-control taco-input"
              :class="{ 'is-invalid': principalError }"
              placeholder="Enter the principal ID of the new owner" />

            <!-- principal error -->
            <span v-if="principalError"
              class="small"
              style="color: var(--red-to-light-red);">{{ principalError }}</span>

          </div>

        </div>

        <!-- modal footer -->
        <div class="modal-footer">

          <!-- back button -->
          <button
            type="button"
            class="btn"
            style="font-family: 'Space Mono';"
            @click="goToStep1"
            :disabled="loading">

            <!-- text -->
            <span style="color: var(--black-to-white);">Back</span>

          </button>

          <!-- transfer button -->
          <button
            type="button"
            class="btn transfer-btn-danger"
            @click="executeTransfer"
            :disabled="!isValidPrincipal || loading">

            <!-- loading spinner -->
            <i v-if="loading" class="fa fa-spinner fa-spin me-2"></i>

            <!-- icon -->
            <i v-else class="fa fa-share me-2"></i>

            <!-- text -->
            <span>Transfer Neuron</span>

          </button>

        </div>

      </template>

    </div>

  </div>

</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  pointer-events: auto;

  span {
    color: var(--black-to-white);
  }

}

.modal-dialog {
  background-color: var(--light-orange-to-dark-brown);
  border: 1px solid var(--dark-orange);
  border-radius: .5rem;
  overflow: clip;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: #ffffff;
  pointer-events: auto;
  position: relative;
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

.transfer-icon {
  font-size: 3.5rem;
  color: var(--dark-brown-to-white) !important;
}

.transfer-title-text {
  font-size: 1.5rem;
  font-weight: 600;
}

.transfer-btn-close {
  margin: 1rem .5rem 0 0;

  i {
    font-size: 1.5rem;
    color: var(--black-to-white);
  }
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

.warning-box {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background-color: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: 0.5rem;

  i {
    color: #ffc107 !important;
    margin-top: 0.15rem;
  }
}

.critical-warning-box {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background-color: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.4);
  border-radius: 0.5rem;
  line-height: 1.5;

  i {
    color: #dc3545 !important;
    margin-top: 0.15rem;
    font-size: 1.25rem;
  }
}

.description-text {
  opacity: 0.8;
  font-size: 0.9rem;
}

.modal-footer {
  border-top: none;
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.transfer-btn-danger {
  background-color: #dc3545;
  border: 1px solid #c82333;
  color: white !important;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-family: 'Space Mono', monospace;

  &:hover:not(:disabled) {
    background-color: #c82333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i, span {
    color: white !important;
  }
}

</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Principal } from '@dfinity/principal'
import { SnsNeuronPermissionType } from '@dfinity/sns'
import { useTacoStore } from '../../stores/taco.store'

interface Props {
  show: boolean
  neuron: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'transferred'): void
}>()

const tacoStore = useTacoStore()

// State
const step = ref(1)
const newPrincipal = ref('')
const principalError = ref('')
const loading = ref(false)

// All permission types for full transfer
const allPermissions = [
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_CONFIGURE_DISSOLVE_STATE,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_PRINCIPALS,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SUBMIT_PROPOSAL,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_VOTE,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SPLIT,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MERGE_MATURITY,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE_MATURITY,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_STAKE_MATURITY,
  SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_VOTING_PERMISSION
]

// Validate principal
const isValidPrincipal = computed(() => {
  if (!newPrincipal.value.trim()) return false

  try {
    const principal = Principal.fromText(newPrincipal.value.trim())
    // Check it's not the current user (userPrincipal is a string in the store)
    if (tacoStore.userPrincipal && principal.toText() === tacoStore.userPrincipal) {
      return false
    }
    return true
  } catch {
    return false
  }
})

// Watch for principal input changes
watch(() => newPrincipal.value, (value) => {
  principalError.value = ''
  if (value.trim()) {
    try {
      const principal = Principal.fromText(value.trim())
      if (tacoStore.userPrincipal && principal.toText() === tacoStore.userPrincipal) {
        principalError.value = 'Cannot transfer to yourself'
      }
    } catch {
      principalError.value = 'Invalid principal ID format'
    }
  }
})

// Reset state when dialog closes
watch(() => props.show, (show) => {
  if (!show) {
    step.value = 1
    newPrincipal.value = ''
    principalError.value = ''
    loading.value = false
  }
})

// Navigation
const goToStep1 = () => {
  step.value = 1
}

const goToStep2 = () => {
  step.value = 2
}

const handleClose = () => {
  emit('close')
}

// Format balance helper
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

// Execute transfer
const executeTransfer = async () => {
  if (!props.neuron || !isValidPrincipal.value || loading.value) return

  loading.value = true
  tacoStore.appLoadingOn()

  try {
    // Convert neuron ID from hex to Uint8Array
    const neuronIdBytes = new Uint8Array(
      props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16))
    )

    const targetPrincipal = newPrincipal.value.trim()
    const currentUserPrincipal = tacoStore.userPrincipal

    if (!currentUserPrincipal) {
      throw new Error('User not logged in')
    }

    // Step 1: Add full permissions to new principal
    await tacoStore.addNeuronPermissions(neuronIdBytes, targetPrincipal, allPermissions)

    // Step 2: Remove all permissions from current user
    await tacoStore.removeNeuronPermissions(neuronIdBytes, currentUserPrincipal, allPermissions)

    // Success toast
    tacoStore.addToast({
      id: Date.now(),
      code: 'transfer-success',
      title: 'Neuron Transferred',
      icon: 'fa-solid fa-check',
      message: `Neuron successfully transferred to ${targetPrincipal.substring(0, 8)}...`
    })

    emit('transferred')
    emit('close')

  } catch (error: any) {
    console.error('Error transferring neuron:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'transfer-error',
      title: 'Transfer Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to transfer neuron. Please try again.'
    })
  } finally {
    loading.value = false
    tacoStore.appLoadingOff()
  }
}
</script>
