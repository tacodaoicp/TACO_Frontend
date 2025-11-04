# useProposalEligibility Composable

A reusable Vue 3 composable for checking if a user is eligible to create Generic Nervous System Function (GNSF) proposals on the TACO SNS DAO.

## Requirements Checked

1. **Logged In** - User must be authenticated with Internet Identity
2. **Proposal Permission** - User must have a neuron with permission type 4 (Submit Proposal)
3. **Sufficient Stake** - The neuron must have at least 7 TACO (configurable) that are not dissolved

## Basic Usage

```typescript
import { useProposalEligibility } from '@/composables/useProposalEligibility'

export default {
  setup() {
    const {
      checking,
      isEligible,
      checkEligibility
    } = useProposalEligibility()

    // Check eligibility
    const handleCheck = async () => {
      await checkEligibility() // Default: 7 TACO minimum
      // Or with custom minimum:
      // await checkEligibility(10) // Require 10 TACO
    }

    return {
      checking,
      isEligible,
      handleCheck
    }
  }
}
```

## Full Example with All Features

```typescript
import { useProposalEligibility } from '@/composables/useProposalEligibility'

const {
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
  formatTaco,
  reset
} = useProposalEligibility()

// Full check with UI updates
const doFullCheck = async () => {
  const result = await checkEligibility(7)
  console.log('Is eligible:', result.isEligible)
  console.log('Eligible neurons:', result.eligibleNeurons)
}

// Quick check without ref updates (useful for v-if conditions)
const canShowButton = await quickCheckEligibility(7)

// Get all neurons with proposal permission
const neurons = await getNeuronsWithProposalPermission()

// Format TACO amounts
const formatted = formatTaco(BigInt(700000000)) // "7.00"

// Reset state
reset()
```

## API Reference

### State (Refs)

- `checking: Ref<boolean>` - Whether an eligibility check is in progress
- `eligibilityChecked: Ref<boolean>` - Whether a check has been completed
- `errorMessage: Ref<string | null>` - Error message if check failed
- `isLoggedIn: Ref<boolean>` - Whether user is logged in
- `hasProposalPermission: Ref<boolean>` - Whether user has a neuron with proposal permission
- `hasSufficientTaco: Ref<boolean>` - Whether user has sufficient undissolved TACO
- `eligibleNeurons: Ref<EligibleNeuron[]>` - List of eligible neurons
- `isEligible: ComputedRef<boolean>` - Overall eligibility (all requirements met)

### Methods

#### `checkEligibility(minTacoAmount?: number): Promise<EligibilityResult>`
Performs a full eligibility check and updates all reactive state.
- **Parameters:**
  - `minTacoAmount` (optional, default: 7) - Minimum TACO required
- **Returns:** Promise with `EligibilityResult` object

#### `quickCheckEligibility(minTacoAmount?: number): Promise<boolean>`
Quick check without updating reactive state. Useful for conditional rendering.
- **Parameters:**
  - `minTacoAmount` (optional, default: 7) - Minimum TACO required
- **Returns:** Promise with boolean indicating eligibility

#### `getNeuronsWithProposalPermission(): Promise<any[]>`
Gets all neurons where the user has proposal submission permission (regardless of stake).
- **Returns:** Promise with array of neurons

#### `hasSubmitProposalPermission(neuron: any, userPrincipalStr: string): boolean`
Utility function to check if a specific neuron has proposal permission for a user.
- **Parameters:**
  - `neuron` - The neuron object
  - `userPrincipalStr` - User's principal as string
- **Returns:** Boolean indicating if permission exists

#### `isNeuronUndissolved(neuron: any): boolean`
Utility function to check if a neuron is not dissolved.
- **Parameters:**
  - `neuron` - The neuron object
- **Returns:** Boolean indicating if neuron is undissolved

#### `hasSufficientStake(neuron: any, minTacoE8s?: bigint): boolean`
Utility function to check if a neuron has sufficient stake.
- **Parameters:**
  - `neuron` - The neuron object
  - `minTacoE8s` (optional, default: 700000000) - Minimum stake in e8s
- **Returns:** Boolean indicating if stake is sufficient

#### `formatTaco(e8s: bigint): string`
Formats TACO amount from e8s to human-readable string.
- **Parameters:**
  - `e8s` - Amount in e8s (smallest unit)
- **Returns:** Formatted string (e.g., "7.00")

#### `reset(): void`
Resets all state to initial values.

## Types

```typescript
interface EligibleNeuron {
  id: any
  stake: bigint
  isUndissolved: boolean
  meetsRequirements: boolean
}

interface EligibilityResult {
  isLoggedIn: boolean
  hasProposalPermission: boolean
  hasSufficientTaco: boolean
  isEligible: boolean
  eligibleNeurons: EligibleNeuron[]
  error: string | null
}
```

## Use Cases

### 1. Conditional Button Rendering

```vue
<template>
  <button v-if="isEligible" @click="createProposal">
    Create Proposal
  </button>
  <div v-else>
    <p>You need to be eligible to create proposals</p>
    <button @click="checkEligibility">Check Eligibility</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProposalEligibility } from '@/composables/useProposalEligibility'

const { isEligible, checkEligibility } = useProposalEligibility()

onMounted(async () => {
  await checkEligibility()
})
</script>
```

### 2. Quick Check for Navigation Guard

```typescript
import { useProposalEligibility } from '@/composables/useProposalEligibility'

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresProposalEligibility) {
    const { quickCheckEligibility } = useProposalEligibility()
    const eligible = await quickCheckEligibility()
    
    if (!eligible) {
      next('/not-eligible')
    } else {
      next()
    }
  } else {
    next()
  }
})
```

### 3. Neuron Selection Dropdown

```vue
<template>
  <select v-model="selectedNeuronId">
    <option value="">Select a neuron</option>
    <option 
      v-for="neuron in eligibleNeurons" 
      :key="neuron.id"
      :value="neuron.id"
    >
      Neuron - {{ formatTaco(neuron.stake) }} TACO
      {{ neuron.meetsRequirements ? '✓' : '(insufficient)' }}
    </option>
  </select>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProposalEligibility } from '@/composables/useProposalEligibility'

const selectedNeuronId = ref('')
const { eligibleNeurons, formatTaco, checkEligibility } = useProposalEligibility()

onMounted(async () => {
  await checkEligibility()
})
</script>
```

### 4. Different Minimum Stakes for Different Proposal Types

```typescript
import { useProposalEligibility } from '@/composables/useProposalEligibility'

const checkForUpgrade = async () => {
  // Upgrade proposals might require more TACO
  const result = await checkEligibility(50)
  return result.isEligible
}

const checkForStandardProposal = async () => {
  // Standard proposals require 7 TACO
  const result = await checkEligibility(7)
  return result.isEligible
}
```

## Notes

- The composable fetches neuron data from `tacoStore.getTacoNeurons()`
- Permission type 4 corresponds to "Submit Proposal" permission in SNS
- TACO amounts are handled in e8s internally (1 TACO = 100,000,000 e8s)
- A neuron is considered "undissolved" if its `WhenDissolvedTimestampSeconds` is in the future or doesn't exist


