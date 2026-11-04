import { ref, computed } from 'vue'
import { useTacoStore } from '../stores/taco.store'

export interface EligibleNeuron {
  id: any
  stake: bigint
  isUndissolved: boolean
  meetsRequirements: boolean
}

export interface EligibilityResult {
  isLoggedIn: boolean
  hasProposalPermission: boolean
  hasSufficientTaco: boolean
  isEligible: boolean
  eligibleNeurons: EligibleNeuron[]
  error: string | null
}

// NeuronPermissionType in SNS governance: 3 is SubmitProposal, 4 is Vote.
const SUBMIT_PROPOSAL_PERMISSION = 3

/**
 * Composable for checking if a user is eligible to create GNSF proposals
 *
 * The same checks SNS governance makes on a new proposal, with its live numbers:
 * 1. User must be logged in
 * 2. User must have a neuron with SubmitProposal permission
 * 3. That neuron's stake, minus its fees, must cover the reject cost
 * 4. Its dissolve delay must be at least the minimum to vote
 */
export function useProposalEligibility() {
  const tacoStore = useTacoStore()
  
  const checking = ref(false)
  const eligibilityChecked = ref(false)
  const errorMessage = ref<string | null>(null)
  
  // Eligibility results
  const isLoggedIn = ref(false)
  const hasProposalPermission = ref(false)
  const hasSufficientTaco = ref(false)
  const eligibleNeurons = ref<EligibleNeuron[]>([])
  const requirements = ref<{ rejectCostE8s: bigint; minDissolveDelaySeconds: bigint } | null>(null)

  const requirementText = computed(() => {
    if (!requirements.value) return 'a neuron that meets the current proposal requirements'
    const { rejectCostE8s, minDissolveDelaySeconds } = requirements.value
    return `a neuron with at least ${Number(rejectCostE8s) / 1e8} TACO and a dissolve delay of at least ${Number(minDissolveDelaySeconds) / 86400} days`
  })
  const rejectCostText = computed(() =>
    requirements.value ? `${Number(requirements.value.rejectCostE8s) / 1e8} TACO is deducted if rejected` : ''
  )

  const isEligible = computed(() => {
    return isLoggedIn.value && hasProposalPermission.value && hasSufficientTaco.value
  })
  
  /**
   * Checks if a neuron has submit proposal permission for the given user
   */
  const hasSubmitProposalPermission = (neuron: any, userPrincipalStr: string): boolean => {
    if (!neuron.permissions || !Array.isArray(neuron.permissions)) {
      return false
    }
    
    for (const permission of neuron.permissions) {
      if (permission.principal && permission.principal.length > 0) {
        const permissionPrincipal = permission.principal[0]
        
        // Check if this permission is for the current user
        if (permissionPrincipal.toText() === userPrincipalStr) {
          const permissionTypes = permission.permission_type || []
          
          if (permissionTypes.includes(SUBMIT_PROPOSAL_PERMISSION)) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  /**
   * A neuron's dissolve delay as SNS governance reads it: what is left of a dissolving
   * neuron's timer, and 0 with no dissolve state.
   */
  const dissolveDelaySeconds = (neuron: any): bigint => {
    const state = neuron.dissolve_state?.[0]
    if (state?.DissolveDelaySeconds !== undefined) return BigInt(state.DissolveDelaySeconds)
    if (state?.WhenDissolvedTimestampSeconds !== undefined) {
      const left = BigInt(state.WhenDissolvedTimestampSeconds) - BigInt(Math.floor(Date.now() / 1000))
      return left > 0n ? left : 0n
    }
    return 0n
  }

  /**
   * Checks if a neuron is undissolved (not dissolved)
   */
  const isNeuronUndissolved = (neuron: any): boolean => dissolveDelaySeconds(neuron) > 0n

  /**
   * A neuron's stake as SNS governance reads it: fees already charged do not count.
   */
  const neuronStakeE8s = (neuron: any): bigint => {
    const stake = BigInt(neuron.cached_neuron_stake_e8s || 0) - BigInt(neuron.neuron_fees_e8s || 0)
    return stake > 0n ? stake : 0n
  }

  /**
   * Main eligibility check function
   */
  const checkEligibility = async (): Promise<EligibilityResult> => {
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
        return {
          isLoggedIn: isLoggedIn.value,
          hasProposalPermission: hasProposalPermission.value,
          hasSufficientTaco: hasSufficientTaco.value,
          isEligible: isEligible.value,
          eligibleNeurons: eligibleNeurons.value,
          error: null
        }
      }
      
      // Check 2 to 4: Fetch the requirements and neurons, then check each neuron
      const [neurons, live] = await Promise.all([tacoStore.getTacoNeurons(), tacoStore.getProposalRequirements()])
      requirements.value = live
      
      if (!neurons || neurons.length === 0) {
        eligibilityChecked.value = true
        return {
          isLoggedIn: isLoggedIn.value,
          hasProposalPermission: hasProposalPermission.value,
          hasSufficientTaco: hasSufficientTaco.value,
          isEligible: isEligible.value,
          eligibleNeurons: eligibleNeurons.value,
          error: null
        }
      }
      
      // Get user's principal
      const userPrincipalStr = tacoStore.userPrincipal
      
      // Check each neuron for proposal permission, stake and dissolve delay
      for (const neuron of neurons) {
        const hasPermission = hasSubmitProposalPermission(neuron, userPrincipalStr)
        
        if (hasPermission) {
          hasProposalPermission.value = true
          
          const stake = neuronStakeE8s(neuron)
          const isUndissolved = isNeuronUndissolved(neuron)
          const meetsRequirements = stake >= live.rejectCostE8s && dissolveDelaySeconds(neuron) >= live.minDissolveDelaySeconds
          
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
      
      eligibilityChecked.value = true
      
      return {
        isLoggedIn: isLoggedIn.value,
        hasProposalPermission: hasProposalPermission.value,
        hasSufficientTaco: hasSufficientTaco.value,
        isEligible: isEligible.value,
        eligibleNeurons: eligibleNeurons.value,
        error: null
      }
      
    } catch (error: any) {
      console.error('Error checking eligibility:', error)
      errorMessage.value = error.message || 'Failed to check eligibility. Please try again.'
      eligibilityChecked.value = true
      
      return {
        isLoggedIn: isLoggedIn.value,
        hasProposalPermission: hasProposalPermission.value,
        hasSufficientTaco: hasSufficientTaco.value,
        isEligible: false,
        eligibleNeurons: eligibleNeurons.value,
        error: errorMessage.value
      }
    } finally {
      checking.value = false
    }
  }
  
  /**
   * Get all neurons with proposal permission (regardless of stake)
   */
  const getNeuronsWithProposalPermission = async (): Promise<any[]> => {
    try {
      if (!tacoStore.userLoggedIn) {
        return []
      }
      
      const neurons = await tacoStore.getTacoNeurons()
      if (!neurons || neurons.length === 0) {
        return []
      }
      
      const userPrincipalStr = tacoStore.userPrincipal
      const neuronsWithPermission: any[] = []
      
      for (const neuron of neurons) {
        if (hasSubmitProposalPermission(neuron, userPrincipalStr)) {
          neuronsWithPermission.push(neuron)
        }
      }
      
      return neuronsWithPermission
    } catch (error) {
      console.error('Error getting neurons with proposal permission:', error)
      return []
    }
  }
  
  /**
   * Format TACO amount from e8s
   */
  const formatTaco = (e8s: bigint): string => {
    const taco = Number(e8s) / 100000000
    return taco.toFixed(2)
  }
  
  /**
   * Reset all state
   */
  const reset = () => {
    checking.value = false
    eligibilityChecked.value = false
    errorMessage.value = null
    isLoggedIn.value = false
    hasProposalPermission.value = false
    hasSufficientTaco.value = false
    eligibleNeurons.value = []
    requirements.value = null
  }

  return {
    // State
    checking,
    eligibilityChecked,
    errorMessage,
    isLoggedIn,
    hasProposalPermission,
    hasSufficientTaco,
    eligibleNeurons,
    isEligible,
    
    // Methods
    checkEligibility,
    getNeuronsWithProposalPermission,
    hasSubmitProposalPermission,
    isNeuronUndissolved,
    dissolveDelaySeconds,
    neuronStakeE8s,
    formatTaco,
    requirementText,
    rejectCostText,
    reset
  }
}

