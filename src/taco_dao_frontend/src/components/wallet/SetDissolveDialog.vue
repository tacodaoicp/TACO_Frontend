<template>

  <div v-if="show" class="modal-overlay">

    <!-- modal dialog -->
    <div class="modal-dialog">

      <!-- modal header -->
      <div class="modal-header">

        <!-- modal title -->
        <div class="modal-title gap-2">

          <!-- icon -->
          <i class="dissolve-icon fa fa-clock me-2"></i>
          
          <!-- title -->
          <span class="dissolve-title-text">Modify Dissolve Period</span>

        </div>

        <!-- close button -->
        <button type="button" class="btn dissolve-btn-close" @click="closeDialog">

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
          Adjusting
        </span>
  
        <!-- neuron info -->
        <div class="neuron-info">

          <!-- neuron display name -->
          <span class="fw-bold">{{ neuron?.displayName }}</span>

          <!-- current dissolve state -->
          <span><span class="fw-bold">Dissolve Period:</span> {{ neuron?.dissolveState?.display }}</span>

        </div>

        <!-- dissolve period -->
        <div class="mt-3">

          <!-- label -->
          <label for="dissolve-days" class="mb-2">
          
            <!-- title -->
            <span style="font-size: 1.25rem;">New Dissolve Period (Days)</span>

          </label>

          <!-- input -->
          <input
            id="dissolve-days"
            v-model.number="dissolveDays"
            type="number"
            class="form-control taco-input"
            :class="{ 'is-invalid': dissolveDays < 7 || dissolveDays > 30.44 || (currentDissolveDays > 0 && dissolveDays <= currentDissolveDays) }"
            min="7"
            max="30.44"
            step="1"
            placeholder="Enter days" />

          <!-- dissolve period error -->
          <span v-if="dissolveDays && dissolveDays < 7 || dissolveDays > 30.44" 
            class="small" 
            style="color: var(--red-to-light-red);">Min 7, Max 30.44 days</span> 
          <span v-else-if="dissolveDays && currentDissolveDays > 0 && dissolveDays <= currentDissolveDays"
            class="small"
            style="color: var(--red-to-light-red);">Must be greater than current</span>
          
        </div>

        <!-- preview -->
        <div v-if="dissolveDays >= 7 && dissolveDays <= 30.44 && (currentDissolveDays > 0 && dissolveDays > currentDissolveDays)" class="mt-3">

          <!-- title -->
          <span style="font-size: 1.25rem; margin-bottom: 0.5rem; display: inline-block;">Preview:</span>

          <!--  -->
          <div class="neuron-info">

            <!--  -->
            <span>New Dissolve Period: {{ dissolveDays }} days</span>

            <!--  -->
            <span>New Dissolve Date: {{ formatFutureDate(dissolveDays) }}</span>

          </div>

        </div>

        <!-- error message -->
        <div v-if="errorMessage" class="alert mb-0 mt-3 px-3 py-2"
              style="background-color: var(--red);">

          <!-- icon -->
          <i class="fa fa-exclamation-triangle me-2" style="color: var(--white) !important;"></i>

          <!-- text -->
          <span style="color: var(--white) !important;">{{ errorMessage }}</span>

        </div>

      </div> 

      <!-- modal footer -->
      <div class="modal-footer">

        <!-- cancel button -->
        <button 
          type="button" 
          class="btn" 
          style="font-family: 'Space Mono';"
          @click="closeDialog"
          :disabled="loading">

          <!-- text -->
          <span style="color: var(--black-to-white);">Cancel</span>

        </button>

        <!-- set dissolve period button -->
        <button 
          type="button" 
          class="btn taco-btn taco-btn--green"
          @click="setDissolveDelay"
          :disabled="loading || dissolveDays < 7 || dissolveDays > 30.44 || (currentDissolveDays > 0 && dissolveDays <= currentDissolveDays)">

          <!-- text -->
          <span style="color: var(--black) !important;">Set Dissolve Period</span>

        </button>

      </div>

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

.dissolve-icon {
  font-size: 3.5rem;
  color: var(--dark-brown-to-white) !important;
}

.dissolve-title-text {
  font-size: 1.5rem;
  font-weight: 600;
}

.dissolve-btn-close {
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
  padding: 1rem;
}

</style>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

interface Props {
  show: boolean
  neuron: any | null
}

interface Emits {
  (e: 'close'): void
  (e: 'dissolve-set'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tacoStore = useTacoStore()

// # ACTIONS #
const { appLoadingOn, appLoadingOff } = tacoStore



// Form state
const dissolveDays = ref(30.44)
const loading = ref(false)
const errorMessage = ref('')

// current dissolve days (float)
const currentDissolveDays = computed(() => {
  const seconds = props.neuron?.dissolveState?.seconds
  if (!seconds || seconds <= 0) return 0
  return seconds / (24 * 60 * 60)
})

// Reset form when dialog opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    dissolveDays.value = 30.44
    loading.value = false
    errorMessage.value = ''
  }
})

const formatFutureDate = (days: number) => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  return futureDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const setDissolveDelay = async () => {
  if (!props.neuron || dissolveDays.value < 7 || dissolveDays.value > 30.44 || (currentDissolveDays.value > 0 && dissolveDays.value <= currentDissolveDays.value)) return

  // turn on app loading
  appLoadingOn()

  loading.value = true
  errorMessage.value = ''

  try {
    // console.log('Setting dissolve delay for neuron:', props.neuron.idHex, 'to', dissolveDays.value, 'days')
    
    // Convert days to months for the backend function
    const delayMonths = dissolveDays.value / 30
    const result = await tacoStore.setNeuronDissolveDelay(props.neuron.id, delayMonths)
    
    // console.log('Dissolve delay set successfully:', result)

    // Also show toast notification
    tacoStore.addToast({
      id: Date.now(),
      code: '',
      title: 'Dissolve delay successfully updated!',
      icon: 'fa-solid fa-clock',
      message: `Successfully updated dissolve delay to ${dissolveDays.value} days`
    })

    emit('dissolve-set')

    emit('close')
    
  } catch (error: any) {
    console.error('Error setting dissolve delay:', error)
    errorMessage.value = error.message || 'Failed to set dissolve period. Please try again.'
  } finally {
    loading.value = false
    appLoadingOff()
  }
}

const closeDialog = () => {
  if (!loading.value) {
    emit('close')
  }
}
</script>