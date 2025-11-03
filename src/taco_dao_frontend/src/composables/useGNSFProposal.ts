import { ref } from 'vue'
import { IDL } from '@dfinity/candid'
import { Principal } from '@dfinity/principal'
import { Actor } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { AuthClient } from '@dfinity/auth-client'
import { useTacoStore } from '../stores/taco.store'

export interface GNSFProposalParams {
  neuronId: Uint8Array  // The ID of the neuron to use for submitting the proposal
  functionId: bigint    // The registered GNSF function ID
  title: string
  url: string
  summary: string
  payload: Uint8Array   // The Candid-encoded payload
}

export interface GNSFPayloadConfig {
  functionName: string  // For reference/logging
  parameters: {
    name: string
    type: any  // IDL type
    value: any
  }[]
}

/**
 * Composable for creating Generic Nervous System Function (GNSF) proposals
 * 
 * This handles:
 * 1. Encoding Candid payloads for GNSF calls
 * 2. Submitting proposals via SNS Governance
 * 3. Tracking proposal creation status
 */
export function useGNSFProposal() {
  const tacoStore = useTacoStore()
  
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const lastProposalId = ref<bigint | null>(null)
  
  /**
   * Encode a Candid payload for a GNSF call
   * 
   * @param config - Configuration with parameter types and values
   * @returns Uint8Array of encoded Candid bytes
   */
  const encodeGNSFPayload = (config: GNSFPayloadConfig): Uint8Array => {
    try {
      const types = config.parameters.map(p => p.type)
      const values = config.parameters.map(p => p.value)
      
      const encoded = IDL.encode(types, values)
      return new Uint8Array(encoded)
    } catch (err: any) {
      console.error('Error encoding GNSF payload:', err)
      throw new Error(`Failed to encode payload: ${err.message}`)
    }
  }
  
  /**
   * Create an SNS Governance actor
   */
  const createSnsGovernanceActor = async () => {
    try {
      const authClient = await AuthClient.create()
      const identity = authClient.getIdentity()
      
      const agent = await createAgent({
        identity,
        host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
        fetchRootKey: process.env.DFX_NETWORK === "local",
      })
      
      // Import the SNS governance IDL
      const { idlFactory } = await import('../../../declarations/sns_governance')
      
      // TACO SNS Governance canister ID
      const governanceCanisterId = 'lhdfz-wqaaa-aaaaq-aae3q-cai'
      
      return Actor.createActor(idlFactory, {
        agent,
        canisterId: governanceCanisterId
      })
    } catch (err: any) {
      console.error('Error creating SNS Governance actor:', err)
      throw new Error(`Failed to create governance actor: ${err.message}`)
    }
  }
  
  /**
   * Submit a GNSF proposal to the SNS
   * 
   * @param params - Proposal parameters including neuron ID, function ID, metadata, and payload
   * @returns The proposal ID if successful
   */
  const submitGNSFProposal = async (params: GNSFProposalParams): Promise<bigint> => {
    submitting.value = true
    error.value = null
    
    try {
      if (!tacoStore.userLoggedIn) {
        throw new Error('User must be logged in to submit proposals')
      }
      
      const governanceActor = await createSnsGovernanceActor()
      
      // Construct the manage_neuron request
      const manageNeuronRequest = {
        subaccount: Array.from(params.neuronId),
        command: [{
          MakeProposal: {
            url: params.url,
            title: params.title,
            summary: params.summary,
            action: [{
              ExecuteGenericNervousSystemFunction: {
                function_id: params.functionId,
                payload: Array.from(params.payload)
              }
            }]
          }
        }]
      }
      
      console.log('Submitting GNSF proposal:', {
        title: params.title,
        functionId: params.functionId.toString(),
        payloadLength: params.payload.length
      })
      
      // Submit the proposal
      const result = await (governanceActor as any).manage_neuron(manageNeuronRequest)
      
      console.log('Proposal submission result:', result)
      
      // Parse the result
      if (result.command && result.command.length > 0) {
        const command = result.command[0]
        
        if (command.Error) {
          throw new Error(`Proposal submission failed: ${command.Error.error_message}`)
        }
        
        if (command.MakeProposal) {
          const proposalId = command.MakeProposal.proposal_id
          if (proposalId && proposalId.length > 0 && proposalId[0].id) {
            const id = proposalId[0].id
            lastProposalId.value = id
            console.log('Proposal created successfully with ID:', id.toString())
            return id
          }
        }
      }
      
      throw new Error('Unexpected response format from governance canister')
      
    } catch (err: any) {
      console.error('Error submitting GNSF proposal:', err)
      error.value = err.message || 'Failed to submit proposal'
      throw err
    } finally {
      submitting.value = false
    }
  }
  
  /**
   * Helper: Create a proposal for a function that takes a Principal parameter
   * 
   * @param neuronId - Neuron ID to submit from
   * @param functionId - Registered GNSF function ID
   * @param principalValue - Principal value to pass
   * @param title - Proposal title
   * @param url - Proposal URL
   * @param summary - Proposal summary
   */
  const createProposalWithPrincipal = async (
    neuronId: Uint8Array,
    functionId: bigint,
    principalValue: Principal,
    title: string,
    url: string,
    summary: string
  ): Promise<bigint> => {
    const payload = encodeGNSFPayload({
      functionName: 'generic_function_with_principal',
      parameters: [{
        name: 'principal',
        type: IDL.Principal,
        value: principalValue
      }]
    })
    
    return await submitGNSFProposal({
      neuronId,
      functionId,
      title,
      url,
      summary,
      payload
    })
  }
  
  /**
   * Helper: Create a proposal for a function with no parameters
   */
  const createProposalWithNoParams = async (
    neuronId: Uint8Array,
    functionId: bigint,
    title: string,
    url: string,
    summary: string
  ): Promise<bigint> => {
    const payload = encodeGNSFPayload({
      functionName: 'generic_function_no_params',
      parameters: []
    })
    
    return await submitGNSFProposal({
      neuronId,
      functionId,
      title,
      url,
      summary,
      payload
    })
  }
  
  /**
   * Helper: Create a proposal for a function with custom parameters
   * This is the most flexible option - you can define any parameter structure
   */
  const createProposalWithCustomParams = async (
    neuronId: Uint8Array,
    functionId: bigint,
    title: string,
    url: string,
    summary: string,
    payloadConfig: GNSFPayloadConfig
  ): Promise<bigint> => {
    const payload = encodeGNSFPayload(payloadConfig)
    
    return await submitGNSFProposal({
      neuronId,
      functionId,
      title,
      url,
      summary,
      payload
    })
  }
  
  /**
   * Reset state
   */
  const reset = () => {
    submitting.value = false
    error.value = null
    lastProposalId.value = null
  }
  
  return {
    // State
    submitting,
    error,
    lastProposalId,
    
    // Methods
    encodeGNSFPayload,
    submitGNSFProposal,
    createProposalWithPrincipal,
    createProposalWithNoParams,
    createProposalWithCustomParams,
    reset
  }
}

