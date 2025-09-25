<template>
    <div class="nns-vote-view" :class="[{ 'overflow-hidden': componentLoading }]">

        <!-- loading curtain -->
        <div v-show="componentLoading" class="nns-vote-view__loading-curtain">
            <img :src="astronautLoaderUrl" class="loading-img">
        </div>

        <!-- error state -->
        <div v-if="error" class="nns-vote-view__error">
            <div class="alert alert-danger">
                <h4>Error</h4>
                <p>{{ error }}</p>
                <router-link to="/chat/forum" class="btn btn-primary">
                    <i class="fa-light fa-arrow-left"></i> Back to Forum
                </router-link>
            </div>
        </div>

        <!-- main content -->
        <div v-if="!error && !componentLoading" class="nns-vote-view__content">

            <!-- header -->
            <div class="nns-vote-view__header">
                <h1 class="nns-vote-view__title">
                    <i class="fa-light fa-vote-yea"></i>
                    NNS Proposal Voting
                </h1>
                <p class="nns-vote-view__subtitle">
                    Vote on NNS proposals using your TACO neurons without risking your stake
                </p>
            </div>

            <!-- voting disabled notice -->
            <div v-if="daoAlreadyVoted" class="alert alert-warning mb-4">
                <i class="fa-light fa-info-circle"></i>
                <strong>Voting Closed:</strong> The DAO has already submitted its collective vote for this NNS proposal.
            </div>

            <!-- login required notice -->
            <div v-if="!isLoggedIn" class="alert alert-info mb-4">
                <i class="fa-light fa-sign-in"></i>
                <strong>Login Required:</strong> Please login to vote on this proposal.
                <button @click="iidLogIn" class="btn btn-sm btn-primary ms-2">
                    <i class="fa-light fa-sign-in"></i> Login
                </button>
            </div>

            <!-- proposals container -->
            <div class="nns-vote-view__proposals">

                <!-- NNS Proposal Section -->
                <div class="nns-vote-view__proposal-section">
                    <div class="nns-vote-view__proposal-header">
                        <h2>
                            <i class="fa-light fa-network-wired"></i>
                            Original NNS Proposal
                        </h2>
                        <a :href="nnsProposalLink" target="_blank" class="btn btn-outline-primary btn-sm">
                            <i class="fa-light fa-external-link"></i> View on NNS
                        </a>
                    </div>

                    <!-- NNS Proposal Details -->
                    <div v-if="nnsProposal" class="proposal-details-card">
                        <div class="proposal-details-card__content">
                            
                            <!-- title -->
                            <div class="proposal-details-card__title">
                                <span class="proposal-details-card__title-number">#{{ nnsProposalId }}&nbsp;</span>
                                <span class="proposal-details-card__title-text">{{ nnsProposal.title || 'NNS Proposal' }}</span>
                            </div>

                            <!-- NNS voting progress -->
                            <div v-if="nnsProposal.latest_tally" class="proposal-details-card__progress-container">
                                <div class="proposal-details-card__progress-container__top">
                                    <div class="proposal-details-card__progress-container__top__left">
                                        <div class="proposal-details-card__progress-container__yes-details">
                                            <span class="proposal-details-card__progress-container__yes-percentage">
                                                Yes <strong>{{ (Number(nnsProposal.latest_tally.yes) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) }}%</strong>
                                            </span>
                                            <span class="proposal-details-card__progress-container__yes-count">
                                                {{ Number((Number(nnsProposal.latest_tally.yes) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                    <div class="proposal-details-card__progress-container__top__center">
                                        <div class="proposal-details-card__progress-container__misc-details">
                                            <span class="proposal-details-card__progress-container__total-votes">Total Votes</span>
                                            <span class="proposal-details-card__progress-container__eligable-count">
                                                {{ Number((Number(nnsProposal.latest_tally.total) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                    <div class="proposal-details-card__progress-container__top__right">
                                        <div class="proposal-details-card__progress-container__no-details">
                                            <span class="proposal-details-card__progress-container__no-percentage">
                                                No <strong>{{ (Number(nnsProposal.latest_tally.no) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) }}%</strong>
                                            </span>
                                            <span class="proposal-details-card__progress-container__no-count">
                                                {{ Number((Number(nnsProposal.latest_tally.no) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="proposal-details-card__progress-container__bottom">
                                    <div class="progress proposal-details-card__progress-container__progress">
                                        <div class="progress-bar progress-bar--yes" 
                                            :style="{ width: (Number(nnsProposal.latest_tally.yes) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) + '%' }"></div>
                                        <div class="progress-bar progress-bar--no" 
                                            :style="{ width: (Number(nnsProposal.latest_tally.no) / Number(nnsProposal.latest_tally.total) * 100).toFixed(2) + '%' }"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- NNS proposal details -->
                            <div class="proposal-details-card__key-value-pairs">
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Topic</span>
                                    <span class="proposal-details-card__value">{{ getNNSTopicName(nnsProposal.topic) }}</span>
                                </div>
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Description</span>
                                    <span class="proposal-details-card__value wordwrap-anywhere" v-html="nnsProposal.summary || 'No description available'"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SNS Proposal Section -->
                <div class="nns-vote-view__proposal-section">
                    <div class="nns-vote-view__proposal-header">
                        <h2>
                            <i class="fa-light fa-comments"></i>
                            TACO DAO Discussion Proposal
                        </h2>
                        <router-link :to="`/chat/forum/${snsProposalId}`" class="btn btn-outline-primary btn-sm">
                            <i class="fa-light fa-comments"></i> View Discussion
                        </router-link>
                    </div>

                    <!-- SNS Proposal Details -->
                    <div v-if="snsProposal" class="proposal-details-card">
                        <div class="proposal-details-card__content">
                            
                            <!-- title -->
                            <div class="proposal-details-card__title">
                                <span class="proposal-details-card__title-number">#{{ snsProposal.id }}&nbsp;</span>
                                <span class="proposal-details-card__title-text">{{ snsProposal.title }}</span>
                            </div>

                            <!-- SNS voting progress -->
                            <div class="proposal-details-card__progress-container">
                                <div class="proposal-details-card__progress-container__top">
                                    <div class="proposal-details-card__progress-container__top__left">
                                        <div class="proposal-details-card__progress-container__yes-details">
                                            <span class="proposal-details-card__progress-container__yes-percentage">
                                                Yes <strong>{{ (Number(snsProposal.yesVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) }}%</strong>
                                            </span>
                                            <span class="proposal-details-card__progress-container__yes-count">
                                                {{ Number((Number(snsProposal.yesVotes) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                    <div class="proposal-details-card__progress-container__top__center">
                                        <div class="proposal-details-card__progress-container__misc-details">
                                            <span class="proposal-details-card__progress-container__total-votes">Total Votes</span>
                                            <span class="proposal-details-card__progress-container__eligable-count">
                                                {{ Number((Number(snsProposal.totalVotes) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                    <div class="proposal-details-card__progress-container__top__right">
                                        <div class="proposal-details-card__progress-container__no-details">
                                            <span class="proposal-details-card__progress-container__no-percentage">
                                                No <strong>{{ (Number(snsProposal.noVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) }}%</strong>
                                            </span>
                                            <span class="proposal-details-card__progress-container__no-count">
                                                {{ Number((Number(snsProposal.noVotes) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="proposal-details-card__progress-container__bottom">
                                    <div class="progress proposal-details-card__progress-container__progress">
                                        <div class="progress-bar progress-bar--yes" 
                                            :style="{ width: (Number(snsProposal.yesVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) + '%' }"></div>
                                        <div class="progress-bar progress-bar--no" 
                                            :style="{ width: (Number(snsProposal.noVotes) / Number(snsProposal.totalVotes) * 100).toFixed(2) + '%' }"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- SNS proposal details -->
                            <div class="proposal-details-card__key-value-pairs">
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Status</span>
                                    <span class="proposal-details-card__value">{{ snsProposal.status }}</span>
                                </div>
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Description</span>
                                    <span class="proposal-details-card__value wordwrap-anywhere" v-html="snsProposal.summary"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DAO Vote Tally Section -->
                <div class="nns-vote-view__proposal-section">
                    <div class="nns-vote-view__proposal-header">
                        <h2>
                            <i class="fa-light fa-chart-bar"></i>
                            TACO DAO Votes
                        </h2>
                        <button @click="refreshDAOVotes" class="btn btn-outline-primary btn-sm" :disabled="componentLoading">
                            <i class="fa-light fa-refresh" :class="{ 'fa-spin': componentLoading }"></i> Refresh
                        </button>
                    </div>

                    <!-- DAO Vote Tally -->
                    <div v-if="daoVoteTally" class="proposal-details-card">
                        <div class="proposal-details-card__content">
                            
                            <!-- title -->
                            <div class="proposal-details-card__title">
                                <span class="proposal-details-card__title-text">DAO Member Votes</span>
                            </div>

                            <!-- DAO voting progress -->
                            <div class="proposal-details-card__progress-container">
                                <div class="proposal-details-card__progress-container__top">
                                    <div class="proposal-details-card__progress-container__top__left">
                                        <div class="proposal-details-card__progress-container__yes-details">
                                            <span class="proposal-details-card__progress-container__yes-percentage">
                                                Adopt <strong>{{ daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.adopt_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) : 0 }}%</strong>
                                            </span>
                                            <span class="proposal-details-card__progress-container__yes-count">
                                                {{ Number((Number(daoVoteTally.adopt_voting_power) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                    <div class="proposal-details-card__progress-container__top__center">
                                        <div class="proposal-details-card__progress-container__misc-details">
                                            <span class="proposal-details-card__progress-container__total-votes">Total DAO Votes</span>
                                            <span class="proposal-details-card__progress-container__eligable-count">
                                                {{ Number((Number(daoVoteTally.total_voting_power) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                    <div class="proposal-details-card__progress-container__top__right">
                                        <div class="proposal-details-card__progress-container__no-details">
                                            <span class="proposal-details-card__progress-container__no-percentage">
                                                Reject <strong>{{ daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.reject_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) : 0 }}%</strong>
                                            </span>
                                            <span class="proposal-details-card__progress-container__no-count">
                                                {{ Number((Number(daoVoteTally.reject_voting_power) / 100000000).toFixed(0)).toLocaleString() }} VP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="proposal-details-card__progress-container__bottom">
                                    <div class="progress proposal-details-card__progress-container__progress">
                                        <div class="progress-bar progress-bar--yes" 
                                            :style="{ width: daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.adopt_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) + '%' : '0%' }"></div>
                                        <div class="progress-bar progress-bar--no" 
                                            :style="{ width: daoVoteTally.total_voting_power > 0 ? (Number(daoVoteTally.reject_voting_power) / Number(daoVoteTally.total_voting_power) * 100).toFixed(2) + '%' : '0%' }"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- DAO vote stats -->
                            <div class="proposal-details-card__key-value-pairs">
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Adopt Votes</span>
                                    <span class="proposal-details-card__value">{{ daoVoteTally.adopt_votes }} neurons</span>
                                </div>
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Reject Votes</span>
                                    <span class="proposal-details-card__value">{{ daoVoteTally.reject_votes }} neurons</span>
                                </div>
                                <div class="proposal-details-card__key-value-pair">
                                    <span class="proposal-details-card__key">Total Participants</span>
                                    <span class="proposal-details-card__value">{{ daoVoteTally.total_votes }} neurons</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- No votes yet -->
                    <div v-else class="proposal-details-card">
                        <div class="proposal-details-card__content text-center py-4">
                            <i class="fa-light fa-vote-yea fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No DAO votes cast yet. Be the first to vote!</p>
                        </div>
                    </div>
                </div>

                <!-- Voting Interface -->
                <div v-if="isLoggedIn && !daoAlreadyVoted" class="nns-vote-view__voting-section">
                    <div class="nns-vote-view__proposal-header">
                        <h2>
                            <i class="fa-light fa-ballot"></i>
                            Cast Your Vote
                        </h2>
                    </div>

                    <div class="voting-interface-card">
                        <div class="voting-interface-card__content">
                            
                            <!-- neuron selection -->
                            <div class="mb-4">
                                <h5>Select Neurons to Vote With</h5>
                                <div v-if="userNeurons.length > 0" class="neuron-selection">
                                    <div v-for="neuron in userNeurons" :key="uint8ArrayToHex(neuron.id.id)" 
                                        class="neuron-item" 
                                        :class="{ 'neuron-item--selected': isNeuronSelected(neuron.id.id), 'neuron-item--voted': hasVoted(neuron.id.id) }">
                                        
                                        <div class="form-check">
                                            <input 
                                                class="form-check-input" 
                                                type="checkbox" 
                                                :id="'neuron-' + uint8ArrayToHex(neuron.id.id)"
                                                :value="neuron.id.id"
                                                v-model="selectedNeurons"
                                                :disabled="hasVoted(neuron.id.id) || votingInProgress">
                                            <label class="form-check-label" :for="'neuron-' + uint8ArrayToHex(neuron.id.id)">
                                                <div class="neuron-info">
                                                    <div class="neuron-name">
                                                        {{ getNeuronDisplayName(tacoSnsRootCanisterId(), neuron.id.id) }}
                                                    </div>
                                                    <div class="neuron-details">
                                                        <span class="neuron-vp">{{ formatTokenAmount(BigInt(neuron.votingPower || 0), 8) }} VP</span>
                                                        <span v-if="hasVoted(neuron.id.id)" class="badge bg-success ms-2">Already Voted</span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-center py-3">
                                    <p class="text-muted">No TACO neurons found. You need TACO neurons to vote.</p>
                                    <router-link to="/wallet" class="btn btn-outline-primary">
                                        <i class="fa-light fa-wallet"></i> Go to Wallet
                                    </router-link>
                                </div>
                            </div>

                            <!-- vote decision -->
                            <div class="mb-4" v-if="selectedNeurons.length > 0">
                                <h5>Your Decision</h5>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" id="vote-adopt" v-model="voteDecision" value="Adopt" :disabled="votingInProgress">
                                    <label class="btn btn-outline-success" for="vote-adopt">
                                        <i class="fa-light fa-thumbs-up"></i> Adopt
                                    </label>
                                    <input type="radio" class="btn-check" id="vote-reject" v-model="voteDecision" value="Reject" :disabled="votingInProgress">
                                    <label class="btn btn-outline-danger" for="vote-reject">
                                        <i class="fa-light fa-thumbs-down"></i> Reject
                                    </label>
                                </div>
                            </div>

                            <!-- vote summary -->
                            <div v-if="selectedNeurons.length > 0 && voteDecision" class="vote-summary mb-4">
                                <div class="alert alert-info">
                                    <h6><i class="fa-light fa-info-circle"></i> Vote Summary</h6>
                                    <p class="mb-2">
                                        <strong>Decision:</strong> {{ voteDecision }} the NNS proposal<br>
                                        <strong>Neurons:</strong> {{ selectedNeurons.length }} selected<br>
                                        <strong>Total Voting Power:</strong> {{ formatTokenAmount(totalSelectedVotingPower, 8) }} VP
                                    </p>
                                    <small class="text-muted">
                                        This vote will be recorded on the TACO DAO backend and counted towards the collective decision.
                                    </small>
                                </div>
                            </div>

                            <!-- submit button -->
                            <div class="text-center">
                                <button 
                                    @click="submitVote" 
                                    class="btn btn-primary btn-lg"
                                    :disabled="!canSubmitVote || votingInProgress">
                                    <i class="fa-light fa-paper-plane" :class="{ 'fa-spin': votingInProgress }"></i>
                                    {{ votingInProgress ? 'Submitting Vote...' : 'Submit Vote' }}
                                </button>
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
import { useTacoStore } from '../stores/taco.store'

// Store and router
const tacoStore = useTacoStore()
const route = useRoute()
const router = useRouter()

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
const isLoggedIn = computed(() => tacoStore.isLoggedIn)
const astronautLoaderUrl = computed(() => tacoStore.astronautLoaderUrl)

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

        nnsProposal.value = nnsData
        snsProposal.value = tacoStore.formatSNSProposalForDisplay(snsData)

        // Load DAO vote tally
        await refreshDAOVotes()

        // Load user neurons if logged in
        if (isLoggedIn.value) {
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
            const voteStatus = await tacoStore.hasNeuronVoted(snsProposalId.value, neuron.id.id)
            if (voteStatus) {
                const key = tacoStore.uint8ArrayToHex(neuron.id.id)
                neuronVoteStatus.value.set(key, voteStatus)
            }
        }
    } catch (err) {
        console.error('Error loading user neurons:', err)
    }
}

const submitVote = async () => {
    if (!canSubmitVote.value) return

    try {
        votingInProgress.value = true

        const result = await tacoStore.submitDAOVotes(
            snsProposalId.value,
            selectedNeurons.value,
            voteDecision.value
        )

        // Show success message
        tacoStore.showSuccess(
            `Vote submitted successfully! ${result.successful_votes} neurons voted with ${tacoStore.formatTokenAmount(BigInt(result.total_voting_power), 8)} VP.`
        )

        // Reset form and refresh data
        selectedNeurons.value = []
        voteDecision.value = 'Adopt'
        await Promise.all([
            refreshDAOVotes(),
            loadUserNeurons()
        ])

    } catch (err: any) {
        console.error('Error submitting vote:', err)
        tacoStore.showError(err.message || 'Failed to submit vote')
    } finally {
        votingInProgress.value = false
    }
}

// Watch for login status changes
watch(isLoggedIn, async (newValue) => {
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
    tacoSnsRootCanisterId 
} = tacoStore
</script>

<style scoped>
.nns-vote-view {
    min-height: 100vh;
    padding: 2rem;
    background: var(--bs-body-bg);
}

.nns-vote-view__loading-curtain {
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

.loading-img {
    width: 100px;
    height: 100px;
}

.nns-vote-view__header {
    text-align: center;
    margin-bottom: 2rem;
}

.nns-vote-view__title {
    color: var(--bs-primary);
    margin-bottom: 0.5rem;
}

.nns-vote-view__subtitle {
    color: var(--bs-secondary);
    font-size: 1.1rem;
}

.nns-vote-view__proposals {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.nns-vote-view__proposal-section {
    background: var(--bs-card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nns-vote-view__proposal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.nns-vote-view__proposal-header h2 {
    margin: 0;
    color: var(--bs-heading-color);
}

.proposal-details-card,
.voting-interface-card {
    background: var(--bs-card-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 8px;
    overflow: hidden;
}

.proposal-details-card__content,
.voting-interface-card__content {
    padding: 1.5rem;
}

.proposal-details-card__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--bs-heading-color);
}

.proposal-details-card__title-number {
    color: var(--bs-primary);
}

.proposal-details-card__progress-container {
    margin-bottom: 1.5rem;
}

.proposal-details-card__progress-container__top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.proposal-details-card__progress-container__yes-details,
.proposal-details-card__progress-container__no-details,
.proposal-details-card__progress-container__misc-details {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.proposal-details-card__progress-container__yes-percentage {
    color: var(--bs-success);
    font-weight: 600;
}

.proposal-details-card__progress-container__no-percentage {
    color: var(--bs-danger);
    font-weight: 600;
}

.proposal-details-card__progress-container__total-votes {
    color: var(--bs-secondary);
    font-weight: 600;
}

.proposal-details-card__progress-container__yes-count,
.proposal-details-card__progress-container__no-count,
.proposal-details-card__progress-container__eligable-count {
    font-size: 0.9rem;
    color: var(--bs-secondary);
}

.proposal-details-card__progress-container__progress {
    height: 20px;
    background-color: var(--bs-gray-200);
    border-radius: 10px;
    overflow: hidden;
}

.progress-bar--yes {
    background-color: var(--bs-success);
}

.progress-bar--no {
    background-color: var(--bs-danger);
}

.proposal-details-card__key-value-pairs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.proposal-details-card__key-value-pair {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.proposal-details-card__key {
    font-weight: 600;
    color: var(--bs-secondary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.proposal-details-card__value {
    color: var(--bs-body-color);
}

.neuron-selection {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--bs-border-color);
    border-radius: 8px;
    padding: 1rem;
}

.neuron-item {
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 6px;
    transition: all 0.2s ease;
}

.neuron-item:hover {
    border-color: var(--bs-primary);
    background-color: var(--bs-primary-bg-subtle);
}

.neuron-item--selected {
    border-color: var(--bs-primary);
    background-color: var(--bs-primary-bg-subtle);
}

.neuron-item--voted {
    opacity: 0.6;
    background-color: var(--bs-success-bg-subtle);
    border-color: var(--bs-success);
}

.neuron-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.neuron-name {
    font-weight: 600;
    color: var(--bs-heading-color);
}

.neuron-details {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.neuron-vp {
    color: var(--bs-secondary);
    font-size: 0.9rem;
}

.vote-summary {
    background: var(--bs-info-bg-subtle);
    border: 1px solid var(--bs-info);
    border-radius: 8px;
    padding: 1rem;
}

@media (max-width: 768px) {
    .nns-vote-view {
        padding: 1rem;
    }
    
    .nns-vote-view__proposal-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .proposal-details-card__progress-container__top {
        flex-direction: column;
        gap: 1rem;
    }
}

.wordwrap-anywhere {
    word-wrap: anywhere;
}
</style>
