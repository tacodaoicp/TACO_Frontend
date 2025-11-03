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

/**
 * Composable for checking if a user is eligible to create GNSF proposals
 * 
 * Requirements:
 * 1. User must be logged in
 * 2. User must have a neuron with proposal submission permission (type 4)
 * 3. That neuron must have at least 7 TACO that are not dissolved
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
  
  const isEligible = computed(() => {
    return isLoggedIn.value && hasProposalPermission.value && hasSufficientTaco.value
  })
  
  /**
   * Checks if a neuron has submit proposal permission (type 4) for the given user
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
          
          // Check for submit proposal permission (type 4)
          if (permissionTypes.includes(4)) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  /**
   * Checks if a neuron is undissolved (not dissolved)
   */
  const isNeuronUndissolved = (neuron: any): boolean => {
    const dissolveState = neuron.dissolve_state || []
    
    if (dissolveState.length === 0) {
      return true // No dissolve state means not dissolving
    }
    
    const state = dissolveState[0]
    
    // If WhenDissolvedTimestampSeconds exists and is in the past, it's dissolved
    if (state.WhenDissolvedTimestampSeconds !== undefined) {
      const dissolveTimestamp = Number(state.WhenDissolvedTimestampSeconds) * 1000
      const now = Date.now()
      
      return dissolveTimestamp > now // Still dissolving or will dissolve in future
    }
    
    // If it has DissolveDelaySeconds, it's not dissolved yet
    return true
  }
  
  /**
   * Checks if a neuron has sufficient stake (at least 7 TACO)
   */
  const hasSufficientStake = (neuron: any, minTacoE8s: bigint = BigInt(7_00000000)): boolean => {
    const stake = neuron.cached_neuron_stake_e8s || BigInt(0)
    return stake >= minTacoE8s
  }
  
  /**
   * Main eligibility check function
   */
  const checkEligibility = async (minTacoAmount: number = 7): Promise<EligibilityResult> => {
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
      
      // Check 2 & 3: Fetch neurons and check permissions and TACO amount
      const neurons = await tacoStore.getTacoNeurons()
      
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
      const minTacoE8s = BigInt(minTacoAmount * 100000000) // Convert to e8s
      
      // Check each neuron for proposal permission and sufficient undissolved TACO
      for (const neuron of neurons) {
        const hasPermission = hasSubmitProposalPermission(neuron, userPrincipalStr)
        
        if (hasPermission) {
          hasProposalPermission.value = true
          
          const stake = neuron.cached_neuron_stake_e8s || BigInt(0)
          const isUndissolved = isNeuronUndissolved(neuron)
          const meetsStakeRequirement = hasSufficientStake(neuron, minTacoE8s)
          const meetsRequirements = isUndissolved && meetsStakeRequirement
          
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
   * Quick check without updating refs (useful for conditional rendering)
   */
  const quickCheckEligibility = async (minTacoAmount: number = 7): Promise<boolean> => {
    try {
      if (!tacoStore.userLoggedIn) {
        return false
      }
      
      const neurons = await tacoStore.getTacoNeurons()
      if (!neurons || neurons.length === 0) {
        return false
      }
      
      const userPrincipalStr = tacoStore.userPrincipal
      const minTacoE8s = BigInt(minTacoAmount * 100000000)
      
      for (const neuron of neurons) {
        if (hasSubmitProposalPermission(neuron, userPrincipalStr)) {
          if (isNeuronUndissolved(neuron) && hasSufficientStake(neuron, minTacoE8s)) {
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.error('Error in quick eligibility check:', error)
      return false
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
    quickCheckEligibility,
    getNeuronsWithProposalPermission,
    hasSubmitProposalPermission,
    isNeuronUndissolved,
    hasSufficientStake,
    formatTaco,
    reset
  }
}

