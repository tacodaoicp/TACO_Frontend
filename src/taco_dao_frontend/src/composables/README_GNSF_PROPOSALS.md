# GNSF Proposal System

A parametrized system for creating Generic Nervous System Function (GNSF) proposals on the TACO SNS DAO.

## Overview

The `useGNSFProposal` composable provides a flexible way to create proposals that execute any registered GNSF with custom parameters. It handles:

1. **Candid Encoding** - Automatically encodes parameters using `@dfinity/candid`
2. **Proposal Submission** - Submits via SNS Governance `manage_neuron` → `MakeProposal`
3. **Type Safety** - Strongly typed parameter configurations
4. **Error Handling** - Comprehensive error messages and status tracking

## Basic Usage

```typescript
import { useGNSFProposal } from '@/composables/useGNSFProposal'
import { Principal } from '@dfinity/principal'
import { IDL } from '@dfinity/candid'

const {
  submitting,
  error,
  lastProposalId,
  createProposalWithCustomParams
} = useGNSFProposal()

// Create a proposal
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,        // Uint8Array neuron ID
  functionId,           // bigint - registered function ID
  'Proposal Title',
  'https://forum.com/proposal',
  'Proposal summary',
  {
    functionName: 'my_function',
    parameters: [
      {
        name: 'principal',
        type: IDL.Principal,
        value: Principal.fromText('...')
      }
    ]
  }
)
```

## Examples by Parameter Type

### 1. Principal Parameter (test_gnsf1)

```typescript
import { IDL } from '@dfinity/candid'
import { Principal } from '@dfinity/principal'

const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1000),  // function_id for test_gnsf1
  'Call test_gnsf1',
  'https://github.com/dao/proposal',
  'Execute test_gnsf1 with a specific principal',
  {
    functionName: 'test_gnsf1',
    parameters: [{
      name: 'principal',
      type: IDL.Principal,
      value: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai')
    }]
  }
)
```

### 2. No Parameters

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1001),
  'Execute Simple Function',
  'https://github.com/dao/proposal',
  'Execute a function with no parameters',
  {
    functionName: 'simple_function',
    parameters: []  // Empty array for no parameters
  }
)
```

### 3. Multiple Parameters

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1002),
  'Update Configuration',
  'https://github.com/dao/proposal',
  'Update system configuration with new values',
  {
    functionName: 'update_config',
    parameters: [
      {
        name: 'threshold',
        type: IDL.Nat64,
        value: BigInt(1000)
      },
      {
        name: 'enabled',
        type: IDL.Bool,
        value: true
      },
      {
        name: 'owner',
        type: IDL.Principal,
        value: Principal.fromText('...')
      }
    ]
  }
)
```

### 4. Complex Types - Records

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1003),
  'Add User',
  'https://github.com/dao/proposal',
  'Add a new user with configuration',
  {
    functionName: 'add_user',
    parameters: [{
      name: 'user_config',
      type: IDL.Record({
        principal: IDL.Principal,
        name: IDL.Text,
        role: IDL.Variant({
          Admin: IDL.Null,
          Member: IDL.Null,
          Viewer: IDL.Null
        }),
        permissions: IDL.Vec(IDL.Nat32)
      }),
      value: {
        principal: Principal.fromText('...'),
        name: 'John Doe',
        role: { Admin: null },
        permissions: [1, 2, 3]
      }
    }]
  }
)
```

### 5. Variant Types

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1004),
  'Set Mode',
  'https://github.com/dao/proposal',
  'Set the system operating mode',
  {
    functionName: 'set_mode',
    parameters: [{
      name: 'mode',
      type: IDL.Variant({
        Active: IDL.Null,
        Maintenance: IDL.Null,
        Disabled: IDL.Null
      }),
      value: { Active: null }
    }]
  }
)
```

### 6. Optional Parameters

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1005),
  'Update Settings',
  'https://github.com/dao/proposal',
  'Update settings with optional email',
  {
    functionName: 'update_settings',
    parameters: [
      {
        name: 'username',
        type: IDL.Text,
        value: 'alice'
      },
      {
        name: 'email',
        type: IDL.Opt(IDL.Text),
        value: [['alice@example.com']]  // Some value
        // value: []  // None
      }
    ]
  }
)
```

### 7. Vector/Array Parameters

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1006),
  'Update Whitelist',
  'https://github.com/dao/proposal',
  'Update the whitelist of principals',
  {
    functionName: 'update_whitelist',
    parameters: [{
      name: 'principals',
      type: IDL.Vec(IDL.Principal),
      value: [
        Principal.fromText('...'),
        Principal.fromText('...'),
        Principal.fromText('...')
      ]
    }]
  }
)
```

### 8. Blob/Vec Nat8 (Binary Data)

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1007),
  'Upload Data',
  'https://github.com/dao/proposal',
  'Upload binary data to the canister',
  {
    functionName: 'upload_data',
    parameters: [{
      name: 'data',
      type: IDL.Vec(IDL.Nat8),
      value: new Uint8Array([1, 2, 3, 4, 5])
    }]
  }
)
```

### 9. Nested Records

```typescript
const proposalId = await createProposalWithCustomParams(
  neuronIdBytes,
  BigInt(1008),
  'Configure Treasury',
  'https://github.com/dao/proposal',
  'Configure treasury with nested settings',
  {
    functionName: 'configure_treasury',
    parameters: [{
      name: 'config',
      type: IDL.Record({
        tokens: IDL.Vec(IDL.Record({
          canister_id: IDL.Principal,
          symbol: IDL.Text,
          decimals: IDL.Nat8
        })),
        rebalance: IDL.Record({
          enabled: IDL.Bool,
          interval_seconds: IDL.Nat64
        })
      }),
      value: {
        tokens: [
          {
            canister_id: Principal.fromText('...'),
            symbol: 'ICP',
            decimals: 8
          },
          {
            canister_id: Principal.fromText('...'),
            symbol: 'TACO',
            decimals: 8
          }
        ],
        rebalance: {
          enabled: true,
          interval_seconds: BigInt(3600)
        }
      }
    }]
  }
)
```

## Helper Methods

### 1. Simple Principal Parameter

```typescript
const { createProposalWithPrincipal } = useGNSFProposal()

const proposalId = await createProposalWithPrincipal(
  neuronIdBytes,
  BigInt(1000),
  Principal.fromText('...'),
  'Title',
  'URL',
  'Summary'
)
```

### 2. No Parameters

```typescript
const { createProposalWithNoParams } = useGNSFProposal()

const proposalId = await createProposalWithNoParams(
  neuronIdBytes,
  BigInt(1001),
  'Title',
  'URL',
  'Summary'
)
```

### 3. Custom Encoding Only

```typescript
const { encodeGNSFPayload } = useGNSFProposal()

const payload = encodeGNSFPayload({
  functionName: 'my_function',
  parameters: [
    { name: 'value', type: IDL.Nat64, value: BigInt(100) }
  ]
})

// Use payload however you want
```

## Complete Component Example

```vue
<template>
  <div>
    <button @click="submitProposal" :disabled="submitting">
      {{ submitting ? 'Submitting...' : 'Create Proposal' }}
    </button>
    
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="lastProposalId">
      Success! Proposal ID: {{ lastProposalId }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Principal } from '@dfinity/principal'
import { IDL } from '@dfinity/candid'
import { useGNSFProposal } from '@/composables/useGNSFProposal'

const {
  submitting,
  error,
  lastProposalId,
  createProposalWithCustomParams
} = useGNSFProposal()

const neuronIdBytes = ref<Uint8Array>(/* your neuron ID */)

const submitProposal = async () => {
  try {
    await createProposalWithCustomParams(
      neuronIdBytes.value,
      BigInt(1000),
      'My Proposal',
      'https://forum.dao.com/proposal',
      'This proposal does something important',
      {
        functionName: 'test_gnsf1',
        parameters: [{
          name: 'principal',
          type: IDL.Principal,
          value: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai')
        }]
      }
    )
  } catch (err) {
    console.error('Failed to submit:', err)
  }
}
</script>
```

## Candid Type Reference

### Common IDL Types

```typescript
// Primitive types
IDL.Bool           // boolean
IDL.Nat            // bigint (unbounded natural number)
IDL.Int            // bigint (unbounded integer)
IDL.Nat8           // number (0-255)
IDL.Nat16          // number (0-65535)
IDL.Nat32          // number (0-4294967295)
IDL.Nat64          // bigint
IDL.Int8           // number (-128 to 127)
IDL.Int16          // number
IDL.Int32          // number
IDL.Int64          // bigint
IDL.Float32        // number
IDL.Float64        // number
IDL.Text           // string
IDL.Principal      // Principal
IDL.Null           // null

// Compound types
IDL.Opt(IDL.Text)              // Optional/Option type: [] or [[value]]
IDL.Vec(IDL.Nat64)             // Array: [1, 2, 3]
IDL.Record({ ... })            // Record/Object
IDL.Variant({ ... })           // Variant/Enum
IDL.Tuple(IDL.Nat, IDL.Text)   // Tuple: [1, "text"]
IDL.Func([IDL.Text], [IDL.Nat], []) // Function type
IDL.Service({ ... })           // Service/Interface
```

### Value Examples

```typescript
// Optional values
IDL.Opt(IDL.Text)
// Some: [['value']]
// None: []

// Variant values
IDL.Variant({ Success: IDL.Nat, Error: IDL.Text })
// { Success: 42 }
// { Error: "failed" }

// Vector values
IDL.Vec(IDL.Principal)
// [Principal.fromText('...'), Principal.fromText('...')]
```

## API Reference

### State

- `submitting: Ref<boolean>` - Whether a proposal is being submitted
- `error: Ref<string | null>` - Error message if submission failed
- `lastProposalId: Ref<bigint | null>` - ID of the last successfully created proposal

### Methods

#### `encodeGNSFPayload(config: GNSFPayloadConfig): Uint8Array`
Encodes parameters into Candid bytes.

#### `submitGNSFProposal(params: GNSFProposalParams): Promise<bigint>`
Submits a proposal with pre-encoded payload.

#### `createProposalWithPrincipal(...): Promise<bigint>`
Helper for proposals with a single Principal parameter.

#### `createProposalWithNoParams(...): Promise<bigint>`
Helper for proposals with no parameters.

#### `createProposalWithCustomParams(...): Promise<bigint>`
Main method for creating proposals with any parameter structure.

#### `reset(): void`
Resets all state.

## Error Handling

```typescript
try {
  const proposalId = await createProposalWithCustomParams(...)
  console.log('Success:', proposalId)
} catch (err) {
  // Error is also available in the error ref
  console.error('Failed:', err.message)
}
```

## Integration with Eligibility Check

```typescript
import { useProposalEligibility } from '@/composables/useProposalEligibility'
import { useGNSFProposal } from '@/composables/useGNSFProposal'

// Check eligibility first
const { isEligible, eligibleNeurons } = useProposalEligibility()
await checkEligibility()

if (isEligible.value) {
  // Get first eligible neuron
  const neuron = eligibleNeurons.value.find(n => n.meetsRequirements)
  
  // Submit proposal
  const { createProposalWithPrincipal } = useGNSFProposal()
  await createProposalWithPrincipal(/* ... */)
}
```

## Notes

- Function IDs are assigned when the GNSF is registered via `AddGenericNervousSystemFunction`
- The neuron must have permission type 4 (Submit Proposal)
- The neuron must have sufficient undissolved stake
- Payloads are Candid-encoded; the types must match what the target method expects
- The validator and executor methods both receive the same payload bytes
- Recent governance requires GNSFs to have a topic assigned

## Troubleshooting

### "Invalid principal format"
Ensure the principal string is valid. Test with `Principal.fromText(str)`

### "Unexpected response format from governance canister"
Check that the neuron has proposal submission permission and sufficient stake

### "Failed to encode payload"
Verify that the IDL types match the expected Candid signature of the target method

### "NervousSystemFunction must have a topic"
Ensure the GNSF was registered with a topic assigned

