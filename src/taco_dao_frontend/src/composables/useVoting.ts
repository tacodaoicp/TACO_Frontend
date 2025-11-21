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
      console.log('Fetching user neurons...')
      const userNeurons = await tacoStore.getTacoNeurons()
      console.log('User neurons fetched:', userNeurons?.length || 0, 'neurons')
      
      // Log first neuron to see structure
      if (userNeurons && userNeurons.length > 0) {
        console.log('Sample neuron structure:', {
          hasVotingPower: 'voting_power' in userNeurons[0],
          hasStake: 'cached_neuron_stake_e8s' in userNeurons[0],
          hasMultiplier: 'voting_power_percentage_multiplier' in userNeurons[0],
          votingPowerValue: userNeurons[0].voting_power,
          stakeValue: userNeurons[0].cached_neuron_stake_e8s,
          multiplierValue: userNeurons[0].voting_power_percentage_multiplier
        })
      }
      
      if (!userNeurons || userNeurons.length === 0) {
        console.log('No neurons found')
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
        if (!neuronId) {
          console.log('Skipping neuron with no ID')
          return null
        }
        
        const displayId = neuronIdToHex(neuronId)
        
        // Calculate voting power properly with bonuses
        let votingPower = BigInt(0)
        
        // The SNS neuron should have voting_power_percentage_multiplier
        // This is a bigint representing the multiplier as a percentage (e.g., 150 = 1.5x)
        const stake = neuron.cached_neuron_stake_e8s ? BigInt(neuron.cached_neuron_stake_e8s) : BigInt(0)
        
        // Get multiplier - it should be a bigint
        let multiplier = BigInt(100) // Default 100 = 1x (no bonus)
        if (neuron.voting_power_percentage_multiplier !== undefined && neuron.voting_power_percentage_multiplier !== null) {
          multiplier = BigInt(neuron.voting_power_percentage_multiplier)
        }
        
        // Voting power = stake * (multiplier / 100)
        if (stake > BigInt(0)) {
          votingPower = (stake * multiplier) / BigInt(100)
        }
        
        console.log('Processing neuron:', displayId, 
                    '\n  Stake:', stake.toString(),
                    '\n  Multiplier:', multiplier.toString(), 
                    '\n  Calculated VP:', votingPower.toString(),
                    '\n  Direct VP field:', neuron.voting_power?.toString() || 'N/A')
        
        // Check if user has vote permission for this neuron
        const userPrincipal = Principal.fromText(tacoStore.userPrincipal!)
        let hasVotePermission = false
        
        if (neuron.permissions && Array.isArray(neuron.permissions)) {
          console.log('Neuron has', neuron.permissions.length, 'permission entries')
          for (const permission of neuron.permissions) {
            if (permission.principal && permission.principal.length > 0) {
              const permissionPrincipal = permission.principal[0]
              const permissionTypes = permission.permission_type || []
              console.log('  Permission for:', permissionPrincipal.toText().substring(0, 15) + '...', 'Types:', permissionTypes)
              
              if (permissionPrincipal.toText() === userPrincipal.toText()) {
                console.log('  -> Matches current user! Permission types:', permissionTypes)
                // Permission type 3 is Vote permission
                if (permissionTypes.includes(3)) {
                  hasVotePermission = true
                  console.log('  -> Has VOTE permission (type 3)')
                  break
                }
              }
            }
          }
        } else {
          console.log('Neuron has no permissions array')
        }
        
        // Skip neurons where user doesn't have vote permission
        if (!hasVotePermission) {
          console.log('-> Neuron filtered out: no vote permission for current user')
          return null
        }
        
        console.log('-> Neuron INCLUDED with vote permission')
        
        // Check if this neuron has voted
        const neuronIdHex = displayId
        console.log('Looking for ballot for neuron:', neuronIdHex)
        console.log('Total ballots in proposal:', ballots.length)
        
        // Log first ballot to understand structure
        if (ballots.length > 0) {
          const firstBallot = ballots[0]
          console.log('First ballot structure:', {
            key: typeof firstBallot[0],
            keyValue: firstBallot[0],
            hasId: firstBallot[0]?.id ? true : false
          })
        }
        
        const ballot = ballots.find((b: any) => {
          const ballotKey = b[0] // First element is the ballot key (neuron ID in some format)
          
          // The ballot key might be a string (hex) or an object with id
          if (typeof ballotKey === 'string') {
            // Direct hex comparison
            const matches = ballotKey === neuronIdHex
            if (matches) console.log('Match found via string comparison:', ballotKey)
            return matches
          } else if (ballotKey && typeof ballotKey === 'object' && ballotKey.id) {
            // Object with id field (Uint8Array)
            const ballotIdHex = neuronIdToHex(ballotKey.id)
            const matches = ballotIdHex === neuronIdHex
            if (matches) console.log('Match found via object id:', ballotIdHex)
            return matches
          }
          
          return false
        })
        
        let hasVoted = false
        let vote: 'yes' | 'no' | null = null
        
        // Use voting power from ballot if available (includes bonuses)
        if (ballot && ballot[1] && ballot[1].voting_power) {
          const ballotVP = ballot[1].voting_power
          if (ballotVP) {
            votingPower = BigInt(ballotVP)
            console.log('Using ballot voting power (with bonuses):', votingPower.toString())
          }
        }
        
        if (ballot) {
          console.log('Found ballot for neuron! Ballot:', JSON.stringify(ballot, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          ))
          const ballotData = ballot[1]
          
          // Check different ballot formats
          if (ballotData) {
            // Try to get vote value from different possible structures
            let voteValue = undefined
            
            // Try different structures
            if (Array.isArray(ballotData.vote) && ballotData.vote.length > 0) {
              voteValue = ballotData.vote[0]
            } else if (typeof ballotData.vote === 'number' || typeof ballotData.vote === 'bigint') {
              voteValue = Number(ballotData.vote)
            } else if (ballotData.vote && typeof ballotData.vote === 'object') {
              // Might be a variant like { Yes: null } or { No: null }
              if ('Yes' in ballotData.vote || 1 in ballotData.vote) {
                voteValue = 1
              } else if ('No' in ballotData.vote || 2 in ballotData.vote) {
                voteValue = 2
              }
            }
            
            console.log('Vote value from ballot:', voteValue, 'Type:', typeof voteValue)
            
            // IMPORTANT: vote: 0 means NOT voted, vote: 1 = Yes, vote: 2 = No
            if (voteValue !== undefined && voteValue !== null && voteValue !== 0) {
              hasVoted = true
              // Vote values: 1 = Yes, 2 = No
              vote = voteValue === 1 ? 'yes' : voteValue === 2 ? 'no' : null
              console.log('Neuron HAS VOTED:', vote)
            } else {
              console.log('Neuron has NOT voted yet (vote value:', voteValue, ')')
            }
          }
        } else {
          console.log('No ballot found for neuron - neuron has NOT voted')
        }
        
        // Can vote if has voting power and hasn't voted yet
        const canVote = votingPower > BigInt(0) && !hasVoted
        
        const neuronData = {
          id: neuronId,
          displayId,
          votingPower,
          canVote,
          hasVoted,
          vote
        }
        
        console.log('Final neuron data:', {
          id: displayId,
          votingPower: votingPower.toString(),
          canVote,
          hasVoted,
          vote
        })
        
        return neuronData
      }).filter(Boolean) as Neuron[]
      
      console.log('Total neurons with vote permission:', neurons.value.length)
      
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
   * @param skipRefresh - If true, skip refreshing neurons after voting (for bulk operations)
   */
  const castVote = async (params: VoteParams, skipRefresh: boolean = false): Promise<void> => {
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
          
          if (!skipRefresh) {
            console.log('Refreshing neuron list...')
            // Wait a moment for the vote to be registered on-chain
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Refresh neurons to update voting status
            await fetchNeurons(params.proposalId)
            console.log('Neuron list refreshed after vote')
          }
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
   * Cast votes with all eligible neurons
   * 
   * @param proposalId - The proposal ID
   * @param vote - The vote choice (yes/no)
   */
  const castBulkVote = async (proposalId: bigint, vote: 'yes' | 'no'): Promise<{ 
    successful: number, 
    failed: number,
    totalVP: bigint 
  }> => {
    voting.value = true
    error.value = null
    
    try {
      if (!tacoStore.userLoggedIn) {
        throw new Error('User must be logged in to vote')
      }
      
      // Get all neurons that can vote
      const eligibleNeurons = neurons.value.filter(n => n.canVote)
      
      if (eligibleNeurons.length === 0) {
        throw new Error('No eligible neurons to vote with')
      }
      
      console.log(`Casting ${vote} vote with ${eligibleNeurons.length} neurons...`)
      
      let successful = 0
      let failed = 0
      let totalVP = BigInt(0)
      const errors: string[] = []
      
      // Vote with each neuron (skip refresh on individual votes)
      for (const neuron of eligibleNeurons) {
        try {
          await castVote({
            proposalId,
            neuronId: neuron.id,
            vote
          }, true) // Skip refresh for individual votes
          successful++
          totalVP += neuron.votingPower
          console.log(`✓ Voted with neuron ${neuron.displayId.substring(0, 8)}...`)
        } catch (err: any) {
          failed++
          const errorMsg = err.message || 'Unknown error'
          errors.push(`Neuron ${neuron.displayId.substring(0, 8)}...: ${errorMsg}`)
          console.error(`✗ Failed to vote with neuron ${neuron.displayId.substring(0, 8)}...`, err)
        }
      }
      
      if (errors.length > 0 && successful === 0) {
        // All votes failed
        throw new Error(`All votes failed:\n${errors.join('\n')}`)
      }
      
      // Wait a moment for all votes to be registered on-chain
      console.log('All votes cast, waiting for blockchain confirmation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refresh neuron list once after all voting is complete
      console.log('Refreshing neuron list...')
      await fetchNeurons(proposalId)
      
      return { successful, failed, totalVP }
      
    } catch (err: any) {
      console.error('Error casting bulk vote:', err)
      error.value = err.message || 'Failed to cast bulk vote'
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
    castBulkVote,
    reset
  }
}

