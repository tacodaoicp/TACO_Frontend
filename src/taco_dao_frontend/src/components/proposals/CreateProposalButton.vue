<template>
  <div class="create-proposal-button">
    <!-- Show different UI based on eligibility status -->
    <div v-if="!eligibilityChecked && !checking">
      <!-- Initial state - check eligibility on first render -->
      <button class="btn btn-primary" disabled>
        <i class="fa fa-spinner fa-spin me-2"></i>
        Checking eligibility...
      </button>
    </div>
    
    <div v-else-if="isEligible">
      <!-- User is eligible - show create button -->
      <button 
        class="btn btn-primary btn-lg"
        @click="handleCreateProposal"
        :disabled="creatingProposal"
      >
        <i class="fa fa-plus-circle me-2"></i>
        Create Proposal
      </button>
    </div>
    
    <div v-else>
      <!-- User is not eligible - show info and check button -->
      <div class="not-eligible-info">
        <div class="alert alert-warning mb-2" role="alert">
          <i class="fa fa-exclamation-triangle me-2"></i>
          <strong>Not eligible to create proposals</strong>
          <div class="mt-2 small">
            <div v-if="!isLoggedIn">
              ❌ You need to log in with Internet Identity
            </div>
            <div v-if="isLoggedIn && !hasProposalPermission">
              ❌ You need a neuron with proposal submission permission
            </div>
            <div v-if="isLoggedIn && hasProposalPermission && !hasSufficientTaco">
              ❌ Your neuron needs at least {{ minTacoAmount }} undissolved TACO
            </div>
          </div>
        </div>
        <button 
          class="btn btn-outline-primary btn-sm"
          @click="recheckEligibility"
          :disabled="checking"
        >
          <i :class="checking ? 'fa fa-spinner fa-spin' : 'fa fa-refresh'" class="me-2"></i>
          {{ checking ? 'Checking...' : 'Check Again' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProposalEligibility } from '../../composables/useProposalEligibility'

// Props
interface Props {
  minTacoAmount?: number
  redirectToProposalPage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minTacoAmount: 7,
  redirectToProposalPage: true
})

// Emits
const emit = defineEmits<{
  'eligible': []
  'not-eligible': [reason: string]
  'create-proposal-click': []
}>()

const router = useRouter()
const creatingProposal = ref(false)

// Use the proposal eligibility composable
const {
  checking,
  eligibilityChecked,
  isLoggedIn,
  hasProposalPermission,
  hasSufficientTaco,
  isEligible,
  checkEligibility
} = useProposalEligibility()

// Check eligibility on mount
onMounted(async () => {
  await checkEligibility(props.minTacoAmount)
  
  if (isEligible.value) {
    emit('eligible')
  } else {
    let reason = 'Unknown'
    if (!isLoggedIn.value) reason = 'Not logged in'
    else if (!hasProposalPermission.value) reason = 'No proposal permission'
    else if (!hasSufficientTaco.value) reason = 'Insufficient TACO'
    emit('not-eligible', reason)
  }
})

// Handle create proposal button click
const handleCreateProposal = () => {
  emit('create-proposal-click')
  
  if (props.redirectToProposalPage) {
    // Redirect to proposal creation page
    router.push('/create_proposal')
  }
}

// Recheck eligibility
const recheckEligibility = async () => {
  await checkEligibility(props.minTacoAmount)
  
  if (isEligible.value) {
    emit('eligible')
  } else {
    let reason = 'Unknown'
    if (!isLoggedIn.value) reason = 'Not logged in'
    else if (!hasProposalPermission.value) reason = 'No proposal permission'
    else if (!hasSufficientTaco.value) reason = 'Insufficient TACO'
    emit('not-eligible', reason)
  }
}
</script>

<style scoped lang="scss">
.create-proposal-button {
  .not-eligible-info {
    .alert {
      margin-bottom: 0.5rem;
    }
  }
}
</style>



