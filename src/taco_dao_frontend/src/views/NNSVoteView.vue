<template>
    <div class="standard-view">

        <!-- header bar -->
        <HeaderBar />

        <!-- scroll container -->
        <div class="scroll-y-container h-100">

            <!-- bootstrap container -->
            <div class="container p-0">

                <!-- bootstrap row -->
                <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

                    <!-- loading curtain -->
                    <div v-show="componentLoading" class="login-curtain">
                        <img :src="astronautLoaderUrl" class="loading-img">
                    </div>

                    <!-- error state -->
                    <div v-if="error" class="taco-container taco-container--l1 mt-4 p-4">
                        <div class="text-center">
                            <h4 class="taco-text-black-to-white mb-3">⚠️ Error</h4>
                            <p class="taco-text-black-to-white mb-3">{{ error }}</p>
                            <router-link to="/chat/forum" class="btn taco-btn taco-btn--green">
                                ← Back to Forum
                            </router-link>
                        </div>
                    </div>

                    <!-- main content -->
                    <div v-if="!error" class="nns-vote-view">

                        <!-- title container -->
                        <div class="d-flex align-items-center">
                            <!-- page title -->
                            <h1 class="taco-title mb-4 mt-4 px-3">
                                <span class="taco-title__icon">🗳️</span>
                                <span class="taco-title__title">NNS Proposal Voting</span>
                            </h1>
                        </div>

                        <!-- top bar -->
                        <div class="nns-vote-view__top-bar gap-2 mb-3 shadow">
                            <!-- left-->
                            <div class="d-flex align-items-center">
                                <!-- if logged out, log in title -->
                                <h2 v-if="!userLoggedIn" class="nns-vote-view__top-bar__title py-2">Log in to Vote on NNS Proposals</h2>                
                                <!-- if logged in, welcome title -->
                                <h2 v-if="userLoggedIn" class="nns-vote-view__top-bar__title py-2">
                                    <span class="whitespace-nowrap">Welcome, …{{ truncatedPrincipal }}&nbsp;</span>
                                    <span class="nns-vote-view__top-bar__vote-power text-nowrap">({{ votePower }} VP)</span>
                                </h2>               
                            </div>
                            <!-- right -->
                            <div class="d-flex gap-2 flex-wrap ms-auto">
                                <!-- if logged out, login button -->
                                <button v-if="!userLoggedIn" class="btn iid-login m-2 me-2" @click="iidLogIn">
                                    <!-- dfinity logo -->
                                    <DfinityLogo />
                                    <!-- login text -->
                                    <span class="taco-text-white">Login</span>
                                </button>
                                <!-- if logged in, refresh button -->
                                <button v-if="userLoggedIn" 
                                    class="btn taco-nav-btn taco-nav-btn--active m-2" 
                                    @click="refreshData"
                                    :disabled="componentLoading">
                                    <span class="taco-text-black">
                                        {{ componentLoading ? 'Refreshing...' : 'Refresh Data' }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <!-- voting disabled notice -->
                        <div v-if="daoAlreadyVoted" class="taco-container taco-container--l1 mb-4 p-3">
                            <div class="text-center">
                                <h5 class="taco-text-black-to-white mb-2">⚠️ Voting Closed</h5>
                                <p class="taco-text-black-to-white mb-0">The DAO has already submitted its collective vote for this NNS proposal.</p>
                            </div>
                        </div>

                        <!-- proposals container -->
                        <div class="nns-vote-view__proposals gap-4">

                            <!-- NNS Proposal Section -->
                            <div class="taco-container taco-container--l1 mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-3 p-3 pb-0">
                                    <TacoTitle level="h3" emoji="🌐" title="Original NNS Proposal" />
                                    <a :href="nnsProposalLink" target="_blank" class="btn taco-btn taco-btn--green btn-sm">
                                        View on NNS →
                                    </a>
                                </div>

                                <!-- NNS Proposal Details -->
                                <div v-if="nnsProposal" class="p-3">
                                    <!-- title -->
                                    <div class="mb-3">
                                        <h4 class="taco-text-black-to-white mb-2">
                                            #{{ nnsProposalId }} {{ nnsProposal.title || 'NNS Proposal' }}
                                        </h4>
                                    </div>

                                    <!-- NNS voting progress -->
                                    <div v-if="nnsProposal.latest_tally" class="mb-3">
                                        <!-- Vote percentages -->
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-success fw-bold">
                                                Yes {{ (Number(nnsProposal.latest_tally.yes) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) }}%
                                            </span>
                                            <span class="taco-text-black-to-white fw-bold">
                                                Total: {{ Number((Number(nnsProposal.latest_tally.total) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                            <span class="text-danger fw-bold">
                                                No {{ (Number(nnsProposal.latest_tally.no) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) }}%
                                            </span>
                                        </div>
                                        <!-- Progress bar -->
                                        <div class="progress mb-2" style="height: 20px;">
                                            <div class="progress-bar bg-success" 
                                                :style="{ width: (Number(nnsProposal.latest_tally.yes) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) + '%' }"></div>
                                            <div class="progress-bar bg-danger" 
                                                :style="{ width: (Number(nnsProposal.latest_tally.no) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) + '%' }"></div>
                                        </div>
                                    </div>

                                    <!-- NNS proposal details -->
                                    <div class="mb-3">
                                        <div class="row">
                                            <div class="col-md-6 mb-2">
                                                <small class="text-muted">TOPIC</small>
                                                <div class="taco-text-black-to-white">{{ getNNSTopicName(nnsProposal.topic) }}</div>
                                            </div>
                                        </div>
                                        <div class="mb-2">
                                            <small class="text-muted">DESCRIPTION</small>
                                            <div class="taco-text-black-to-white" v-html="nnsProposal.summary || 'No description available'"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- SNS Proposal Section -->
                            <div class="taco-container taco-container--l1 mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-3 p-3 pb-0">
                                    <TacoTitle level="h3" emoji="💬" title="TACO DAO Discussion" />
                                    <router-link :to="`/chat/forum/${snsProposalId}`" class="btn taco-btn taco-btn--green btn-sm">
                                        View Discussion →
                                    </router-link>
                                </div>

                                <!-- SNS Proposal Details -->
                                <div v-if="snsProposal" class="p-3">
                                    <!-- title -->
                                    <div class="mb-3">
                                        <h4 class="taco-text-black-to-white mb-2">
                                            #{{ snsProposal.id }} {{ snsProposal.title }}
                                        </h4>
                                    </div>

                                    <!-- SNS voting progress -->
                                    <div class="mb-3">
                                        <!-- Vote percentages -->
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-success fw-bold">
                                                Yes {{ snsProposal.totalVotes > 0 ? (Number(snsProposal.yesVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) : 0 }}%
                                            </span>
                                            <span class="taco-text-black-to-white fw-bold">
                                                Total: {{ Number((Number(snsProposal.totalVotes) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                            <span class="text-danger fw-bold">
                                                No {{ snsProposal.totalVotes > 0 ? (Number(snsProposal.noVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) : 0 }}%
                                            </span>
                                        </div>
                                        <!-- Progress bar -->
                                        <div class="progress mb-2" style="height: 20px;">
                                            <div class="progress-bar bg-success" 
                                                :style="{ width: snsProposal.totalVotes > 0 ? (Number(snsProposal.yesVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) + '%' : '0%' }"></div>
                                            <div class="progress-bar bg-danger" 
                                                :style="{ width: snsProposal.totalVotes > 0 ? (Number(snsProposal.noVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) + '%' : '0%' }"></div>
                                        </div>
                                    </div>

                                    <!-- SNS proposal details -->
                                    <div class="mb-3">
                                        <div class="row">
                                            <div class="col-md-6 mb-2">
                                                <small class="text-muted">STATUS</small>
                                                <div class="taco-text-black-to-white">{{ snsProposal.status }}</div>
                                            </div>
                                        </div>
                                        <div class="mb-2">
                                            <small class="text-muted">DESCRIPTION</small>
                                            <div class="taco-text-black-to-white" v-html="snsProposal.summary"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- DAO Vote Tally Section -->
                            <div class="taco-container taco-container--l1 mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-3 p-3 pb-0">
                                    <TacoTitle level="h3" emoji="📊" title="TACO DAO Votes" />
                                    <button @click="refreshDAOVotes" class="btn taco-btn taco-btn--green btn-sm" :disabled="componentLoading">
                                        {{ componentLoading ? 'Refreshing...' : 'Refresh' }}
                                    </button>
                                </div>

                                <!-- DAO Vote Tally -->
                                <div v-if="daoVoteTally" class="p-3">
                                    <div class="mb-3">
                                        <!-- Vote percentages -->
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-success fw-bold">
                                                Adopt {{ daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.adopt_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) : 0 }}%
                                            </span>
                                            <span class="taco-text-black-to-white fw-bold">
                                                Total: {{ Number((Number(daoVoteTally.total_voting_power) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                            <span class="text-danger fw-bold">
                                                Reject {{ daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.reject_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) : 0 }}%
                                            </span>
                                        </div>
                                        <!-- Progress bar -->
                                        <div class="progress mb-3" style="height: 20px;">
                                            <div class="progress-bar bg-success" 
                                                :style="{ width: daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.adopt_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) + '%' : '0%' }"></div>
                                            <div class="progress-bar bg-danger" 
                                                :style="{ width: daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.reject_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) + '%' : '0%' }"></div>
                                        </div>
                                    </div>

                                    <!-- DAO vote stats -->
                                    <div class="row text-center">
                                        <div class="col-md-4 mb-2">
                                            <small class="text-muted">ADOPT VOTES</small>
                                            <div class="taco-text-black-to-white fw-bold">{{ daoVoteTally.adopt_votes }} neurons</div>
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <small class="text-muted">REJECT VOTES</small>
                                            <div class="taco-text-black-to-white fw-bold">{{ daoVoteTally.reject_votes }} neurons</div>
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <small class="text-muted">TOTAL PARTICIPANTS</small>
                                            <div class="taco-text-black-to-white fw-bold">{{ daoVoteTally.total_votes }} neurons</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- No votes yet -->
                                <div v-else class="p-3 text-center">
                                    <div class="py-4">
                                        <div class="mb-3" style="font-size: 3rem;">🗳️</div>
                                        <p class="taco-text-black-to-white">No DAO votes cast yet. Be the first to vote!</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Voting Interface -->
                            <div v-if="userLoggedIn && !daoAlreadyVoted" class="taco-container taco-container--l1 mb-4">
                                <div class="p-3">
                                    <TacoTitle level="h3" emoji="🗳️" title="Cast Your Vote" class="mb-4" />

                                    <!-- Simple voting interface for now -->
                                    <div v-if="userNeurons.length > 0" class="mb-4">
                                        <h5 class="taco-text-black-to-white mb-3">Select Decision</h5>
                                        <div class="d-flex gap-3 mb-3">
                                            <button 
                                                @click="voteDecision = 'Adopt'"
                                                class="btn taco-btn flex-fill"
                                                :class="voteDecision === 'Adopt' ? 'taco-btn--green' : 'taco-btn--outline'">
                                                👍 Adopt
                                            </button>
                                            <button 
                                                @click="voteDecision = 'Reject'"
                                                class="btn taco-btn flex-fill"
                                                :class="voteDecision === 'Reject' ? 'taco-btn--red' : 'taco-btn--outline'">
                                                👎 Reject
                                            </button>
                                        </div>

                                        <div v-if="voteDecision" class="text-center">
                                            <button 
                                                @click="submitVoteSimple" 
                                                class="btn taco-btn taco-btn--green"
                                                :disabled="votingInProgress">
                                                {{ votingInProgress ? 'Submitting...' : `Submit ${voteDecision} Vote` }}
                                            </button>
                                            <div class="mt-2">
                                                <small class="text-muted">
                                                    Will vote with all your TACO neurons ({{ userNeurons.length }} neurons)
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="text-center py-4">
                                        <div class="mb-3" style="font-size: 2rem;">💰</div>
                                        <p class="taco-text-black-to-white mb-3">No TACO neurons found.</p>
                                        <router-link to="/wallet" class="btn taco-btn taco-btn--green">
                                            Go to Wallet →
                                        </router-link>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'

// Store and router
const tacoStore = useTacoStore()
const route = useRoute()
const router = useRouter()

// Store refs
const { userLoggedIn, truncatedPrincipal } = storeToRefs(tacoStore)

// Component state
const componentLoading = ref(true)
const error = ref('')
const snsProposalId = ref<bigint>(0n)
const nnsProposalId = ref<bigint>(0n)
const nnsProposal = ref<any>(null)
const snsProposal = ref<any>(null)
const daoVoteTally = ref<any>(null)
const daoAlreadyVoted = ref(false)
const userNeurons = ref<any[]>([])
const selectedNeurons = ref<Uint8Array[]>([])
const voteDecision = ref<'Adopt' | 'Reject'>('Adopt')
const votingInProgress = ref(false)
const neuronVoteStatus = ref<Map<string, any>>(new Map())

// Computed properties
const astronautLoaderUrl = computed(() => tacoStore.astronautLoaderUrl)
const votePower = computed(() => tacoStore.votePower || '0')

const nnsProposalLink = computed(() => {
    return tacoStore.formatNNSProposalLink(nnsProposalId.value)
})

const totalSelectedVotingPower = computed(() => {
    return selectedNeurons.value.reduce((total, neuronId) => {
        const neuron = userNeurons.value.find(n => 
            tacoStore.uint8ArrayToHex(n.id.id) === tacoStore.uint8ArrayToHex(neuronId)
        )
        return total + BigInt(neuron?.votingPower || 0)
    }, 0n)
})

const canSubmitVote = computed(() => {
    return selectedNeurons.value.length > 0 && 
           voteDecision.value && 
           !votingInProgress.value && 
           !daoAlreadyVoted.value
})

// Methods
const isNeuronSelected = (neuronId: Uint8Array) => {
    return selectedNeurons.value.some(id => 
        tacoStore.uint8ArrayToHex(id) === tacoStore.uint8ArrayToHex(neuronId)
    )
}

const hasVoted = (neuronId: Uint8Array) => {
    const key = tacoStore.uint8ArrayToHex(neuronId)
    return neuronVoteStatus.value.has(key)
}

const getNNSTopicName = (topicId: number) => {
    const topics: Record<number, string> = {
        0: 'Unspecified',
        1: 'Neuron Management',
        2: 'Exchange Rate',
        3: 'Network Economics',
        4: 'Governance',
        5: 'Node Admin',
        6: 'Participant Management',
        7: 'Subnet Management',
        8: 'Network Canister Management',
        9: 'KYC',
        10: 'Node Provider Rewards',
        11: 'SNS Decentralization Sale',
        12: 'Subnet Replica Version Management',
        13: 'Replica Version Management',
        14: 'SNS and Community Fund',
        15: 'API Boundary Node Management'
    }
    return topics[topicId] || `Topic ${topicId}`
}

const loadProposalData = async () => {
    try {
        componentLoading.value = true
        error.value = ''

        // Get SNS proposal ID from route
        const proposalIdParam = route.params.id as string
        if (!proposalIdParam) {
            throw new Error('No proposal ID provided')
        }

        snsProposalId.value = BigInt(proposalIdParam)

        // Find corresponding NNS proposal
        nnsProposalId.value = await tacoStore.findNNSProposalForSNS(snsProposalId.value) || 0n
        if (nnsProposalId.value === 0n) {
            throw new Error('No corresponding NNS proposal found for this SNS proposal')
        }

        // Check if DAO has already voted
        daoAlreadyVoted.value = await tacoStore.hasDAOVoted(nnsProposalId.value)

        // Load both proposals
        const [nnsData, snsData] = await Promise.all([
            tacoStore.getNNSProposal(nnsProposalId.value),
            tacoStore.getSNSProposal(snsProposalId.value)
        ])

        // Debug logging
        console.log('Raw NNS data:', nnsData)
        console.log('Raw SNS data:', snsData)

        nnsProposal.value = nnsData
        snsProposal.value = tacoStore.formatSNSProposalForDisplay(snsData)
        
        // Debug formatted data
        console.log('Formatted NNS proposal:', nnsProposal.value)
        console.log('Formatted SNS proposal:', snsProposal.value)

        // Load DAO vote tally
        await refreshDAOVotes()

        // Load user neurons if logged in
        if (userLoggedIn.value) {
            await loadUserNeurons()
        }

    } catch (err: any) {
        console.error('Error loading proposal data:', err)
        error.value = err.message || 'Failed to load proposal data'
    } finally {
        componentLoading.value = false
    }
}

const refreshDAOVotes = async () => {
    try {
        daoVoteTally.value = await tacoStore.getDAOVoteTally(snsProposalId.value)
    } catch (err) {
        console.error('Error refreshing DAO votes:', err)
    }
}

const loadUserNeurons = async () => {
    try {
        userNeurons.value = await tacoStore.getUserVotingNeurons()
        
        // Check vote status for each neuron
        for (const neuron of userNeurons.value) {
            // Handle different neuron ID formats
            let neuronIdBlob = null;
            if (neuron.id instanceof Uint8Array) {
                // Categorized neuron format
                neuronIdBlob = neuron.id;
            } else if (neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                // Raw neuron format from SNS governance
                neuronIdBlob = neuron.id[0].id;
            }
            
            if (neuronIdBlob) {
                const voteStatus = await tacoStore.hasNeuronVoted(snsProposalId.value, neuronIdBlob)
                if (voteStatus) {
                    const key = tacoStore.uint8ArrayToHex(neuronIdBlob)
                    neuronVoteStatus.value.set(key, voteStatus)
                }
            }
        }
    } catch (err) {
        console.error('Error loading user neurons:', err)
    }
}

const submitVoteSimple = async () => {
    if (!voteDecision.value || votingInProgress.value) return

    try {
        votingInProgress.value = true

        // Get all user neuron IDs
        const allNeuronIds = userNeurons.value.map(neuron => {
            // Handle different neuron ID formats
            if (neuron.id instanceof Uint8Array) {
                // Categorized neuron format
                return neuron.id;
            } else if (neuron.id && Array.isArray(neuron.id) && neuron.id.length > 0) {
                // Raw neuron format from SNS governance
                return neuron.id[0].id;
            }
            return null;
        }).filter(id => id !== null)

        const result = await tacoStore.submitDAOVotes(
            snsProposalId.value,
            allNeuronIds,
            voteDecision.value
        )

        // Show success message
        tacoStore.showSuccess(
            `Vote submitted successfully! ${result.successful_votes} neurons voted with ${tacoStore.formatTokenAmount(BigInt(result.total_voting_power), 8)} VP.`
        )

        // Reset form and refresh data
        voteDecision.value = 'Adopt'
        await refreshData()

    } catch (err: any) {
        console.error('Error submitting vote:', err)
        tacoStore.showError(err.message || 'Failed to submit vote')
    } finally {
        votingInProgress.value = false
    }
}

const refreshData = async () => {
    await Promise.all([
        refreshDAOVotes(),
        loadUserNeurons()
    ])
}

// Watch for login status changes
watch(userLoggedIn, async (newValue) => {
    if (newValue) {
        await loadUserNeurons()
    } else {
        userNeurons.value = []
        selectedNeurons.value = []
        neuronVoteStatus.value.clear()
    }
})

// Initialize on mount
onMounted(async () => {
    await loadProposalData()
})

// Expose store methods to template
const { 
    iidLogIn, 
    uint8ArrayToHex, 
    formatTokenAmount, 
    getNeuronDisplayName,
    tacoSnsRootCanisterId,
    checkIfLoggedIn
} = tacoStore
</script>

<style scoped>
/* Use TACO's existing styles - most styling comes from taco-container classes */

.nns-vote-view__top-bar {
    background: var(--dark-bg);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
}

.nns-vote-view__top-bar__title {
    color: var(--white);
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
}

.nns-vote-view__top-bar__vote-power {
    color: var(--yellow);
    font-weight: 500;
}

.loading-img {
    width: 100px;
    height: 100px;
}

.login-curtain {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

@media (max-width: 768px) {
    .nns-vote-view__top-bar {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
}
</style>
