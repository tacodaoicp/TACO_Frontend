import { ref } from 'vue'
import { Actor } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { AuthClient } from '@dfinity/auth-client'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../stores/taco.store'

export interface VoteParams {
  proposalId: bigint
  neuronId: Uint8Array
  vote: 'yes' | 'no'
}

export interface Neuron {
  id: Uint8Array
  displayId: string
  votingPower: bigint
  canVote: boolean
  hasVoted: boolean
  vote: 'yes' | 'no' | null
}

/**
 * Composable for voting on SNS proposals
 * 
 * This handles:
 * 1. Fetching user's neurons
 * 2. Checking voting eligibility
 * 3. Casting votes on proposals
 */
export function useVoting() {
  const tacoStore = useTacoStore()
  
  const loading = ref(false)
  const voting = ref(false)
  const error = ref<string | null>(null)
  const neurons = ref<Neuron[]>([])
  
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
   * Convert neuron ID bytes to hex string for display
   */
  const neuronIdToHex = (id: Uint8Array): string => {
    return Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * Fetch user's neurons that can vote on this proposal
   * 
   * @param proposalId - The proposal ID to check voting status for
   */
  const fetchNeurons = async (proposalId: bigint): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      if (!tacoStore.userLoggedIn || !tacoStore.userPrincipal) {
        throw new Error('User must be logged in to view neurons')
      }
      
      // Use the store's method to get all user neurons (owned + hotkeyed)
      const userNeurons = await tacoStore.getUserNeurons()
      
      if (!userNeurons || userNeurons.length === 0) {
        neurons.value = []
        return
      }
      
      const governanceActor = await createSnsGovernanceActor()
      
      // Get proposal data to check which neurons have voted
      const proposalResponse = await (governanceActor as any).get_proposal({
        proposal_id: [{ id: proposalId }]
      })
      
      const proposal = proposalResponse?.result?.[0]?.Proposal
      const ballots = proposal?.ballots || []
      
      // Format neurons with voting status
      neurons.value = userNeurons.map((neuron: any) => {
        const neuronId = neuron.id && neuron.id.length > 0 ? neuron.id[0].id : null
        if (!neuronId) return null
        
        const displayId = neuronIdToHex(neuronId)
        const votingPower = neuron.voting_power || BigInt(0)
        
        // Check if user has vote permission for this neuron
        const userPrincipal = Principal.fromText(tacoStore.userPrincipal!)
        let hasVotePermission = false
        
        if (neuron.permissions && Array.isArray(neuron.permissions)) {
          for (const permission of neuron.permissions) {
            if (permission.principal && permission.principal.length > 0) {
              const permissionPrincipal = permission.principal[0]
              if (permissionPrincipal.toText() === userPrincipal.toText()) {
                const permissionTypes = permission.permission_type || []
                // Permission type 3 is Vote permission
                if (permissionTypes.includes(3)) {
                  hasVotePermission = true
                  break
                }
              }
            }
          }
        }
        
        // Skip neurons where user doesn't have vote permission
        if (!hasVotePermission) {
          return null
        }
        
        // Check if this neuron has voted
        const neuronIdHex = displayId
        const ballot = ballots.find((b: any) => {
          const ballotNeuronId = b[0] // First element is the neuron ID
          if (ballotNeuronId && typeof ballotNeuronId === 'object' && ballotNeuronId.id) {
            const ballotIdHex = neuronIdToHex(ballotNeuronId.id)
            return ballotIdHex === neuronIdHex
          }
          return false
        })
        
        let hasVoted = false
        let vote: 'yes' | 'no' | null = null
        
        if (ballot && ballot[1]) {
          const voteValue = ballot[1].vote?.[0]
          if (voteValue !== undefined) {
            hasVoted = true
            // Vote values: 1 = Yes, 2 = No
            vote = voteValue === 1 ? 'yes' : voteValue === 2 ? 'no' : null
          }
        }
        
        // Can vote if has voting power and hasn't voted yet
        const canVote = votingPower > BigInt(0) && !hasVoted
        
        return {
          id: neuronId,
          displayId,
          votingPower,
          canVote,
          hasVoted,
          vote
        }
      }).filter(Boolean) as Neuron[]
      
    } catch (err: any) {
      console.error('Error fetching neurons:', err)
      error.value = err.message || 'Failed to fetch neurons'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Cast a vote on a proposal
   * 
   * @param params - Vote parameters including proposal ID, neuron ID, and vote choice
   */
  const castVote = async (params: VoteParams): Promise<void> => {
    voting.value = true
    error.value = null
    
    try {
      if (!tacoStore.userLoggedIn) {
        throw new Error('User must be logged in to vote')
      }
      
      const governanceActor = await createSnsGovernanceActor()
      
      // Vote value: 1 = Yes, 2 = No
      const voteValue = params.vote === 'yes' ? 1 : 2
      
      // Construct the manage_neuron request for voting
      const manageNeuronRequest = {
        subaccount: Array.from(params.neuronId),
        command: [{
          RegisterVote: {
            proposal: [{ id: params.proposalId }],
            vote: voteValue
          }
        }]
      }
      
      console.log('Casting vote:', {
        proposalId: params.proposalId.toString(),
        neuronId: neuronIdToHex(params.neuronId),
        vote: params.vote
      })
      
      // Submit the vote
      const result = await (governanceActor as any).manage_neuron(manageNeuronRequest)
      
      console.log('Vote result:', result)
      
      // Parse the result
      if (result.command && result.command.length > 0) {
        const command = result.command[0]
        
        if (command.Error) {
          throw new Error(`Vote failed: ${command.Error.error_message}`)
        }
        
        if (command.RegisterVote) {
          console.log('Vote cast successfully')
          // Refresh neurons to update voting status
          await fetchNeurons(params.proposalId)
          return
        }
      }
      
      throw new Error('Unexpected response format from governance canister')
      
    } catch (err: any) {
      console.error('Error casting vote:', err)
      error.value = err.message || 'Failed to cast vote'
      throw err
    } finally {
      voting.value = false
    }
  }
  
  /**
   * Reset state
   */
  const reset = () => {
    loading.value = false
    voting.value = false
    error.value = null
    neurons.value = []
  }
  
  return {
    // State
    loading,
    voting,
    error,
    neurons,
    
    // Methods
    fetchNeurons,
    castVote,
    reset
  }
}

