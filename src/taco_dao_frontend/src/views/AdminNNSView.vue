<template>
    <div class="standard-view">
        <!-- Header Bar -->
        <HeaderBar />

        <!-- Scroll Container -->
        <div class="scroll-y-container h-100">
            <!-- Bootstrap Container -->
            <div class="container p-0">
                <!-- Bootstrap Row -->
                <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

                    <!-- Loading Curtain -->
                    <div v-show="loading" class="login-curtain">
                        <img :src="astronautLoaderUrl" class="loading-img">
                    </div>

                    <!-- Header -->
                    <div class="taco-container taco-container--l1 mt-4 mb-4">
                        <div class="p-3">
                            <TacoTitle level="h2" emoji="🤖" title="NNS Automation Admin" />
                            <p class="taco-text-black-to-white mb-0">
                                Manage automated NNS proposal processing and voting systems
                            </p>
                        </div>
                    </div>

                    <!-- Timer Status Section -->
                    <div class="taco-container taco-container--l1 mb-4">
                        <div class="p-3">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <TacoTitle level="h3" emoji="⏰" title="Timer Status" />
                                <button 
                                    @click="loadTimerStatus" 
                                    :disabled="actionLoading"
                                    class="btn taco-btn taco-btn--outline btn-sm">
                                    <i class="fas fa-refresh me-1"></i>Refresh Status
                                </button>
                            </div>

                            <!-- Periodic Timer -->
                            <div class="mb-4">
                                <h5 class="taco-text-black-to-white mb-3">
                                    <i class="fas fa-clock me-2"></i>Periodic Timer (Master)
                                </h5>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card bg-light">
                                            <div class="card-body">
                                                <h6 class="card-title">Status</h6>
                                                <span v-if="periodicTimerStatus.is_running" class="badge bg-success">
                                                    <i class="fas fa-play me-1"></i>Running
                                                </span>
                                                <span v-else class="badge bg-secondary">
                                                    <i class="fas fa-stop me-1"></i>Stopped
                                                </span>
                                                <div class="mt-2">
                                                    <small class="text-muted">
                                                        Timer ID: {{ periodicTimerStatus.timer_id || 'None' }}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-light">
                                            <div class="card-body">
                                                <h6 class="card-title">Timing</h6>
                                                <div class="small">
                                                    <div><strong>Interval:</strong> {{ formatSeconds(periodicTimerStatus.interval_seconds) }}</div>
                                                    <div><strong>Last Run:</strong> {{ formatTimestamp(periodicTimerStatus.last_run_time) }}</div>
                                                    <div><strong>Next Run:</strong> {{ formatTimestamp(periodicTimerStatus.next_run_time) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <button 
                                        @click="startPeriodicTimer" 
                                        :disabled="periodicTimerStatus.is_running || actionLoading"
                                        class="btn taco-btn taco-btn--green me-2">
                                        <i class="fas fa-play me-1"></i>Start Periodic Timer
                                    </button>
                                    <button 
                                        @click="stopPeriodicTimer" 
                                        :disabled="!periodicTimerStatus.is_running || actionLoading"
                                        class="btn taco-btn taco-btn--red">
                                        <i class="fas fa-stop me-1"></i>Stop Periodic Timer
                                    </button>
                                </div>
                            </div>

                            <!-- Auto Processing Status -->
                            <div class="mb-4">
                                <h5 class="taco-text-black-to-white mb-3">
                                    <i class="fas fa-cogs me-2"></i>Auto NNS Processing
                                </h5>
                                <div class="d-flex align-items-center mb-3">
                                    <span v-if="isAutoProcessingRunning" class="badge bg-success me-3">
                                        <i class="fas fa-play me-1"></i>Running
                                    </span>
                                    <span v-else class="badge bg-secondary me-3">
                                        <i class="fas fa-stop me-1"></i>Stopped
                                    </span>
                                    <button 
                                        @click="startAutoProcessing" 
                                        :disabled="isAutoProcessingRunning || actionLoading"
                                        class="btn taco-btn taco-btn--green btn-sm me-2">
                                        Start Processing
                                    </button>
                                    <button 
                                        @click="stopAutoProcessing" 
                                        :disabled="!isAutoProcessingRunning || actionLoading"
                                        class="btn taco-btn taco-btn--red btn-sm">
                                        Stop Processing
                                    </button>
                                </div>
                            </div>

                            <!-- Auto Voting Status -->
                            <div class="mb-4">
                                <h5 class="taco-text-black-to-white mb-3">
                                    <i class="fas fa-vote-yea me-2"></i>Auto Urgent Voting
                                </h5>
                                <div class="d-flex align-items-center mb-3">
                                    <span v-if="isAutoVotingRunning" class="badge bg-success me-3">
                                        <i class="fas fa-play me-1"></i>Running
                                    </span>
                                    <span v-else class="badge bg-secondary me-3">
                                        <i class="fas fa-stop me-1"></i>Stopped
                                    </span>
                                    <button 
                                        @click="startAutoVoting" 
                                        :disabled="isAutoVotingRunning || actionLoading"
                                        class="btn taco-btn taco-btn--green btn-sm me-2">
                                        Start Auto Voting
                                    </button>
                                    <button 
                                        @click="stopAutoVoting" 
                                        :disabled="!isAutoVotingRunning || actionLoading"
                                        class="btn taco-btn taco-btn--red btn-sm">
                                        Stop Auto Voting
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Configuration Section -->
                    <div class="taco-container taco-container--l1 mb-4">
                        <div class="p-3">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <TacoTitle level="h3" emoji="⚙️" title="Configuration" />
                                <button 
                                    @click="loadConfiguration" 
                                    :disabled="actionLoading"
                                    class="btn taco-btn taco-btn--outline btn-sm">
                                    <i class="fas fa-refresh me-1"></i>Refresh Config
                                </button>
                            </div>

                            <div class="row">
                                <!-- Periodic Timer Interval -->
                                <div class="col-md-6 mb-3">
                                    <label class="form-label taco-text-black-to-white">
                                        <strong>Periodic Timer Interval</strong>
                                    </label>
                                    <div class="input-group">
                                        <input 
                                            v-model="newPeriodicInterval" 
                                            type="number" 
                                            class="form-control" 
                                            placeholder="Seconds"
                                            min="60">
                                        <button 
                                            @click="updatePeriodicInterval" 
                                            :disabled="actionLoading"
                                            class="btn taco-btn taco-btn--green">
                                            Update
                                        </button>
                                    </div>
                                    <small class="text-muted">
                                        Current: {{ formatSeconds(periodicTimerStatus.interval_seconds) }} 
                                        (Must be less than voting threshold)
                                    </small>
                                </div>

                                <!-- Voting Threshold -->
                                <div class="col-md-6 mb-3">
                                    <label class="form-label taco-text-black-to-white">
                                        <strong>Urgent Voting Threshold</strong>
                                    </label>
                                    <div class="input-group">
                                        <input 
                                            v-model="newVotingThreshold" 
                                            type="number" 
                                            class="form-control" 
                                            placeholder="Seconds"
                                            min="300">
                                        <button 
                                            @click="updateVotingThreshold" 
                                            :disabled="actionLoading"
                                            class="btn taco-btn taco-btn--green">
                                            Update
                                        </button>
                                    </div>
                                    <small class="text-muted">
                                        Current: {{ formatSeconds(currentVotingThreshold) }} 
                                        (Must be greater than timer interval)
                                    </small>
                                </div>

                                <!-- Proposer Subaccount -->
                                <div class="col-md-6 mb-3">
                                    <label class="form-label taco-text-black-to-white">
                                        <strong>Proposer Subaccount</strong>
                                    </label>
                                    <div class="input-group">
                                        <input 
                                            v-model="newProposerSubaccount" 
                                            type="text" 
                                            class="form-control font-monospace" 
                                            placeholder="Hex string (64 characters)"
                                            maxlength="64"
                                            style="font-size: 0.85rem;">
                                        <button 
                                            @click="updateProposerSubaccount" 
                                            :disabled="actionLoading || !newProposerSubaccount || !isValidHex(newProposerSubaccount)"
                                            class="btn taco-btn taco-btn--green">
                                            Update
                                        </button>
                                    </div>
                                    <small class="text-muted">
                                        Current: {{ currentProposerSubaccount || 'Loading...' }} 
                                        <span v-if="newProposerSubaccount && !isValidHex(newProposerSubaccount)" class="text-danger">
                                            (Invalid hex format)
                                        </span>
                                    </small>
                                </div>

                                <!-- TACO DAO Neuron ID -->
                                <div class="col-md-6 mb-3">
                                    <label class="form-label taco-text-black-to-white">
                                        <strong>TACO DAO Neuron ID</strong>
                                    </label>
                                    <div class="input-group">
                                        <input 
                                            v-model="newTacoDAONeuronId" 
                                            type="text" 
                                            class="form-control font-monospace" 
                                            placeholder="Neuron ID (numeric)"
                                            style="font-size: 0.85rem;">
                                        <button 
                                            @click="updateTacoDAONeuronId" 
                                            :disabled="actionLoading || !newTacoDAONeuronId || !isValidNeuronId(newTacoDAONeuronId)"
                                            class="btn taco-btn taco-btn--green">
                                            Update
                                        </button>
                                    </div>
                                    <small class="text-muted">
                                        Current: {{ currentTacoDAONeuronId || 'Loading...' }}
                                        <span v-if="newTacoDAONeuronId && !isValidNeuronId(newTacoDAONeuronId)" class="text-danger">
                                            (Invalid neuron ID format)
                                        </span>
                                    </small>
                                </div>

                                <!-- Default Vote Behavior -->
                                <div class="col-md-6 mb-3">
                                    <label class="form-label taco-text-black-to-white">
                                        <i class="fas fa-balance-scale me-2"></i>Default Vote Behavior
                                    </label>
                                    <div class="input-group">
                                        <select 
                                            v-model="newDefaultVoteBehavior" 
                                            class="form-select taco-input"
                                            :disabled="actionLoading">
                                            <option value="VoteAdopt">Vote Adopt (Default)</option>
                                            <option value="VoteReject">Vote Reject</option>
                                            <option value="Skip">Skip Voting</option>
                                        </select>
                                        <button 
                                            @click="updateDefaultVoteBehavior"
                                            :disabled="actionLoading || newDefaultVoteBehavior === currentDefaultVoteBehavior"
                                            class="btn taco-btn taco-btn--green">
                                            <i class="fas fa-save me-1"></i>Update
                                        </button>
                                    </div>
                                    <small class="text-muted">
                                        Current: {{ currentDefaultVoteBehavior || 'Loading...' }}
                                        <br>
                                        What to do when there are no DAO votes or there's a tie vote
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Votable Proposals Section -->
                    <div class="taco-container taco-container--l1 mb-4">
                        <div class="p-3">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <TacoTitle level="h3" emoji="🗳️" title="Votable Proposals" />
                                <button 
                                    @click="refreshVotableProposals" 
                                    :disabled="proposalsLoading"
                                    class="btn taco-btn taco-btn--outline btn-sm">
                                    <i class="fas fa-refresh me-1"></i>Refresh
                                </button>
                            </div>

                            <div v-if="proposalsLoading" class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>

                            <div v-else-if="votableProposals.length === 0" class="text-center py-4">
                                <div class="mb-3" style="font-size: 2rem;">📭</div>
                                <p class="taco-text-black-to-white">No votable proposals found</p>
                            </div>

                            <div v-else class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>NNS ID</th>
                                            <th>SNS ID</th>
                                            <th>Time Remaining</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="proposal in votableProposals" :key="proposal.nns_proposal_id">
                                            <td>{{ proposal.nns_proposal_id }}</td>
                                            <td>{{ proposal.sns_proposal_id }}</td>
                                            <td>
                                                <span v-if="proposal.time_remaining_seconds !== null">
                                                    {{ formatTimeRemaining(proposal.time_remaining_seconds) }}
                                                </span>
                                                <span v-else class="text-muted">No deadline</span>
                                            </td>
                                            <td>
                                                <span v-if="proposal.is_expired" class="badge bg-danger">
                                                    <i class="fas fa-clock me-1"></i>Expired
                                                </span>
                                                <span v-else-if="isUrgent(proposal)" class="badge bg-warning">
                                                    <i class="fas fa-exclamation-triangle me-1"></i>Urgent
                                                </span>
                                                <span v-else class="badge bg-info">
                                                    <i class="fas fa-clock me-1"></i>Active
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    @click="forceVoteOnProposal(proposal.sns_proposal_id)" 
                                                    :disabled="votingLoading[proposal.sns_proposal_id]"
                                                    class="btn taco-btn taco-btn--orange btn-sm">
                                                    <i class="fas fa-gavel me-1"></i>Force Vote
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import astronautLoader from '../assets/images/astonautLoader.webp'

// Store
const tacoStore = useTacoStore()
const { userLoggedIn } = storeToRefs(tacoStore)

// Component state
const loading = ref(true)
const actionLoading = ref(false)
const proposalsLoading = ref(false)
const votingLoading = ref<Record<number, boolean>>({})

// Timer status
const periodicTimerStatus = ref({
    is_running: false,
    timer_id: null as number | null,
    last_run_time: null as number | null,
    next_run_time: null as number | null,
    interval_seconds: 3600
})
const isAutoProcessingRunning = ref(false)
const isAutoVotingRunning = ref(false)

// Configuration
const newPeriodicInterval = ref(3600)
const newVotingThreshold = ref(7200)
const currentVotingThreshold = ref(7200)
const newProposerSubaccount = ref('')
const currentProposerSubaccount = ref('')
const newTacoDAONeuronId = ref('')
const currentTacoDAONeuronId = ref('')
const newDefaultVoteBehavior = ref('VoteAdopt')
const currentDefaultVoteBehavior = ref('Loading...')

// Proposals
const votableProposals = ref<any[]>([])

// Computed
const astronautLoaderUrl = astronautLoader

// Methods
const formatSeconds = (seconds: number | bigint) => {
    // Convert BigInt to Number if needed
    const numSeconds = typeof seconds === 'bigint' ? Number(seconds) : seconds
    if (numSeconds < 60) return `${numSeconds}s`
    if (numSeconds < 3600) return `${Math.floor(numSeconds / 60)}m ${numSeconds % 60}s`
    const hours = Math.floor(numSeconds / 3600)
    const minutes = Math.floor((numSeconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}

const formatTimestamp = (timestamp: number | bigint | null) => {
    if (!timestamp) return 'Never'
    // Convert BigInt to Number if needed
    const numTimestamp = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
    return new Date(numTimestamp * 1000).toLocaleString()
}

const formatTimeRemaining = (seconds: number | bigint) => {
    // Convert BigInt to Number if needed
    const numSeconds = typeof seconds === 'bigint' ? Number(seconds) : seconds
    if (numSeconds < 0) {
        const absSeconds = Math.abs(numSeconds)
        return `Expired ${formatSeconds(absSeconds)} ago`
    }
    return formatSeconds(numSeconds)
}

const isUrgent = (proposal: any) => {
    if (!proposal.time_remaining_seconds) return false
    // Convert BigInt to Number for comparison
    const timeRemaining = typeof proposal.time_remaining_seconds === 'bigint' 
        ? Number(proposal.time_remaining_seconds) 
        : proposal.time_remaining_seconds
    return timeRemaining <= currentVotingThreshold.value && !proposal.is_expired
}

// Validation functions
const isValidHex = (hex: string) => {
    if (!hex) return true // Allow empty for display purposes
    // Remove any whitespace and convert to lowercase
    const cleanHex = hex.replace(/\s/g, '').toLowerCase()
    // Check if it's exactly 64 characters and only contains hex characters
    return /^[0-9a-f]{64}$/.test(cleanHex)
}

const isValidNeuronId = (neuronId: string) => {
    if (!neuronId) return true // Allow empty for display purposes
    // Check if it's a valid positive integer
    return /^\d+$/.test(neuronId) && BigInt(neuronId) > 0
}

// Helper function to convert hex string to Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
    const cleanHex = hex.replace(/\s/g, '').toLowerCase()
    const bytes = new Uint8Array(cleanHex.length / 2)
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
    }
    return bytes
}

// Helper function to convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Timer control methods
const startPeriodicTimer = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.startPeriodicTimer()
        if (result) {
            tacoStore.showSuccess('Periodic timer started successfully')
            await loadTimerStatus()
        } else {
            tacoStore.showError('Failed to start periodic timer')
        }
    } catch (error: any) {
        console.error('Error starting periodic timer:', error)
        tacoStore.showError('Error starting periodic timer: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const stopPeriodicTimer = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.stopPeriodicTimer()
        if (result) {
            tacoStore.showSuccess('Periodic timer stopped successfully')
            await loadTimerStatus()
        } else {
            tacoStore.showError('Failed to stop periodic timer')
        }
    } catch (error: any) {
        console.error('Error stopping periodic timer:', error)
        tacoStore.showError('Error stopping periodic timer: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const startAutoProcessing = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.startAutoProcessNNSProposals()
        if (result) {
            tacoStore.showSuccess('Auto-processing started successfully')
            await loadTimerStatus()
        } else {
            tacoStore.showError('Failed to start auto-processing')
        }
    } catch (error: any) {
        console.error('Error starting auto-processing:', error)
        tacoStore.showError('Error starting auto-processing: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const stopAutoProcessing = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.stopAutoProcessNNSProposals()
        if (result) {
            tacoStore.showSuccess('Auto-processing stopped successfully')
            await loadTimerStatus()
        } else {
            tacoStore.showError('Failed to stop auto-processing')
        }
    } catch (error: any) {
        console.error('Error stopping auto-processing:', error)
        tacoStore.showError('Error stopping auto-processing: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const startAutoVoting = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.startAutoVoteOnUrgentProposals()
        if (result) {
            tacoStore.showSuccess('Auto-voting started successfully')
            await loadTimerStatus()
        } else {
            tacoStore.showError('Failed to start auto-voting')
        }
    } catch (error: any) {
        console.error('Error starting auto-voting:', error)
        tacoStore.showError('Error starting auto-voting: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const stopAutoVoting = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.stopAutoVoteOnUrgentProposals()
        if (result) {
            tacoStore.showSuccess('Auto-voting stopped successfully')
            await loadTimerStatus()
        } else {
            tacoStore.showError('Failed to stop auto-voting')
        }
    } catch (error: any) {
        console.error('Error stopping auto-voting:', error)
        tacoStore.showError('Error stopping auto-voting: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

// Configuration methods
const updatePeriodicInterval = async () => {
    try {
        actionLoading.value = true
        await tacoStore.setPeriodicTimerIntervalSeconds(BigInt(newPeriodicInterval.value))
        tacoStore.showSuccess('Periodic timer interval updated successfully')
        await loadTimerStatus()
    } catch (error: any) {
        console.error('Error updating periodic interval:', error)
        tacoStore.showError('Error updating periodic interval: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const updateVotingThreshold = async () => {
    try {
        actionLoading.value = true
        await tacoStore.setAutoVotingThresholdSeconds(BigInt(newVotingThreshold.value))
        tacoStore.showSuccess('Voting threshold updated successfully')
        await loadConfiguration()
    } catch (error: any) {
        console.error('Error updating voting threshold:', error)
        tacoStore.showError('Error updating voting threshold: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const updateProposerSubaccount = async () => {
    if (!newProposerSubaccount.value || !isValidHex(newProposerSubaccount.value)) {
        tacoStore.showError('Invalid hex format. Please enter a 64-character hex string.')
        return
    }

    try {
        actionLoading.value = true
        const bytes = hexToBytes(newProposerSubaccount.value)
        await tacoStore.setProposerSubaccount(bytes)
        tacoStore.showSuccess('Proposer subaccount updated successfully')
        await loadConfiguration()
    } catch (error: any) {
        console.error('Error updating proposer subaccount:', error)
        tacoStore.showError('Error updating proposer subaccount: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const updateTacoDAONeuronId = async () => {
    if (!newTacoDAONeuronId.value || !isValidNeuronId(newTacoDAONeuronId.value)) {
        tacoStore.showError('Invalid neuron ID format. Please enter a positive integer.')
        return
    }

    try {
        actionLoading.value = true
        await tacoStore.setTacoDAONeuronId(BigInt(newTacoDAONeuronId.value))
        tacoStore.showSuccess('TACO DAO neuron ID updated successfully')
        await loadConfiguration()
    } catch (error: any) {
        console.error('Error updating TACO DAO neuron ID:', error)
        tacoStore.showError('Error updating TACO DAO neuron ID: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

const updateDefaultVoteBehavior = async () => {
    try {
        actionLoading.value = true
        
        // Convert string to variant format expected by backend
        const behaviorVariant = { [newDefaultVoteBehavior.value]: null }
        
        await tacoStore.setDefaultVoteBehavior(behaviorVariant)
        tacoStore.showSuccess('Default vote behavior updated successfully')
        await loadConfiguration()
    } catch (error: any) {
        console.error('Error updating default vote behavior:', error)
        tacoStore.showError('Error updating default vote behavior: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

// Proposal methods
const refreshVotableProposals = async () => {
    try {
        proposalsLoading.value = true
        const proposals = await tacoStore.getVotableProposalsWithTimeLeft()
        
        // Convert BigInt values to Numbers to avoid JSON serialization issues
        votableProposals.value = (proposals || []).map(proposal => ({
            ...proposal,
            nns_proposal_id: Number(proposal.nns_proposal_id),
            sns_proposal_id: Number(proposal.sns_proposal_id),
            time_remaining_seconds: Number(proposal.time_remaining_seconds)
        }))
    } catch (error: any) {
        console.error('Error loading votable proposals:', error)
        tacoStore.showError('Error loading votable proposals: ' + error.message)
    } finally {
        proposalsLoading.value = false
    }
}

const forceVoteOnProposal = async (snsProposalId: number) => {
    try {
        votingLoading.value[snsProposalId] = true
        const result = await tacoStore.voteOnNNSProposal(BigInt(snsProposalId))
        
        if ('ok' in result) {
            tacoStore.showSuccess(`Successfully voted ${result.ok.dao_decision} on proposal ${snsProposalId}`)
            await refreshVotableProposals()
        } else {
            tacoStore.showError(`Failed to vote on proposal ${snsProposalId}: ${result.err}`)
        }
    } catch (error: any) {
        console.error('Error voting on proposal:', error)
        tacoStore.showError('Error voting on proposal: ' + error.message)
    } finally {
        votingLoading.value[snsProposalId] = false
    }
}

// Load data methods
const loadTimerStatus = async () => {
    try {
        const [periodicStatus, autoProcessing, autoVoting] = await Promise.all([
            tacoStore.getPeriodicTimerStatus(),
            tacoStore.isAutoProcessingRunning(),
            tacoStore.isAutoVotingRunning()
        ])
        
        // Convert BigInt values to Numbers to avoid JSON serialization issues
        if (periodicStatus) {
            periodicTimerStatus.value = {
                is_running: periodicStatus.is_running,
                interval_seconds: Number(periodicStatus.interval_seconds),
                last_run_time: periodicStatus.last_run_time ? Number(periodicStatus.last_run_time) : null,
                next_run_time: periodicStatus.next_run_time ? Number(periodicStatus.next_run_time) : null,
                timer_id: periodicStatus.timer_id ? Number(periodicStatus.timer_id) : null
            }
        }
        
        isAutoProcessingRunning.value = autoProcessing || false
        isAutoVotingRunning.value = autoVoting || false
        
        // Update form values
        newPeriodicInterval.value = periodicTimerStatus.value.interval_seconds
    } catch (error: any) {
        console.error('Error loading timer status:', error)
        tacoStore.showError('Error loading timer status: ' + error.message)
    }
}

const loadConfiguration = async () => {
    try {
        console.log('Loading configuration...')
        console.log('TacoStore methods available:', {
            getAutoVotingThresholdSeconds: typeof tacoStore.getAutoVotingThresholdSeconds,
            getProposerSubaccount: typeof tacoStore.getProposerSubaccount,
            getTacoDAONeuronId: typeof tacoStore.getTacoDAONeuronId
        })
        
        const [votingThreshold, proposerSubaccount, tacoDAONeuronId, defaultVoteBehavior] = await Promise.all([
            tacoStore.getAutoVotingThresholdSeconds(),
            tacoStore.getProposerSubaccount(),
            tacoStore.getTacoDAONeuronId(),
            tacoStore.getDefaultVoteBehavior()
        ])
        
        console.log('Raw responses:', { votingThreshold, proposerSubaccount, tacoDAONeuronId })
        
        // Voting threshold
        currentVotingThreshold.value = Number(votingThreshold || 7200)
        newVotingThreshold.value = currentVotingThreshold.value
        
        // Proposer subaccount
        if (proposerSubaccount) {
            try {
                // Handle different possible formats
                let bytes: Uint8Array
                if (proposerSubaccount instanceof Uint8Array) {
                    bytes = proposerSubaccount
                } else if (Array.isArray(proposerSubaccount)) {
                    bytes = new Uint8Array(proposerSubaccount)
                } else if (proposerSubaccount._buffer) {
                    // Handle ArrayBuffer-like objects
                    bytes = new Uint8Array(proposerSubaccount._buffer || proposerSubaccount)
                } else {
                    console.warn('Unknown proposer subaccount format:', proposerSubaccount)
                    bytes = new Uint8Array()
                }
                
                const hexString = bytesToHex(bytes)
                console.log('Proposer subaccount hex:', hexString)
                
                if (bytes.length === 0) {
                    currentProposerSubaccount.value = 'Empty (needs to be set)'
                    newProposerSubaccount.value = '712b9424940499b2a59979c3605c83772b636f8fce15bc963937da4812f89928' // Default to the correct value
                } else {
                    currentProposerSubaccount.value = hexString
                    newProposerSubaccount.value = hexString
                }
            } catch (subError) {
                console.error('Error processing proposer subaccount:', subError)
                currentProposerSubaccount.value = 'Error loading'
                newProposerSubaccount.value = ''
            }
        } else {
            currentProposerSubaccount.value = 'Not set'
            newProposerSubaccount.value = '712b9424940499b2a59979c3605c83772b636f8fce15bc963937da4812f89928' // Default to the correct value
        }
        
        // TACO DAO neuron ID
        if (tacoDAONeuronId) {
            try {
                console.log('Neuron ID object:', tacoDAONeuronId)
                let neuronIdValue: bigint | number
                
                if (tacoDAONeuronId.id !== undefined) {
                    neuronIdValue = tacoDAONeuronId.id
                } else if (typeof tacoDAONeuronId === 'object' && Object.keys(tacoDAONeuronId).length === 1) {
                    // Handle case where the response might be wrapped
                    neuronIdValue = Object.values(tacoDAONeuronId)[0] as bigint | number
                } else {
                    neuronIdValue = tacoDAONeuronId as bigint | number
                }
                
                const neuronIdString = neuronIdValue.toString()
                console.log('Neuron ID string:', neuronIdString)
                currentTacoDAONeuronId.value = neuronIdString
                newTacoDAONeuronId.value = neuronIdString
            } catch (neuronError) {
                console.error('Error processing neuron ID:', neuronError)
                currentTacoDAONeuronId.value = 'Error loading'
                newTacoDAONeuronId.value = ''
            }
        } else {
            currentTacoDAONeuronId.value = 'Not set'
            newTacoDAONeuronId.value = ''
        }
        
        // Default vote behavior
        if (defaultVoteBehavior) {
            try {
                console.log('Default vote behavior object:', defaultVoteBehavior)
                
                // Handle different possible formats from backend
                let behaviorKey = null
                if (typeof defaultVoteBehavior === 'object' && defaultVoteBehavior !== null) {
                    // Find the key that has a non-undefined value (variant format)
                    const keys = Object.keys(defaultVoteBehavior)
                    behaviorKey = keys.find(key => defaultVoteBehavior[key] !== undefined) || keys[0]
                } else if (typeof defaultVoteBehavior === 'string') {
                    behaviorKey = defaultVoteBehavior
                }
                
                console.log('Default vote behavior key:', behaviorKey)
                
                if (behaviorKey && ['VoteAdopt', 'VoteReject', 'Skip'].includes(behaviorKey)) {
                    currentDefaultVoteBehavior.value = behaviorKey
                    newDefaultVoteBehavior.value = behaviorKey
                } else {
                    currentDefaultVoteBehavior.value = 'VoteAdopt' // Default fallback
                    newDefaultVoteBehavior.value = 'VoteAdopt'
                }
            } catch (behaviorError) {
                console.error('Error processing default vote behavior:', behaviorError)
                currentDefaultVoteBehavior.value = 'Error loading'
                newDefaultVoteBehavior.value = 'VoteAdopt'
            }
        } else {
            currentDefaultVoteBehavior.value = 'VoteAdopt' // Default fallback
            newDefaultVoteBehavior.value = 'VoteAdopt'
        }
        
        console.log('Final values:', {
            currentVotingThreshold: currentVotingThreshold.value,
            currentProposerSubaccount: currentProposerSubaccount.value,
            currentTacoDAONeuronId: currentTacoDAONeuronId.value,
            currentDefaultVoteBehavior: currentDefaultVoteBehavior.value
        })
        
    } catch (error: any) {
        console.error('Error loading configuration:', error)
        tacoStore.showError('Error loading configuration: ' + error.message)
    }
}

// Function to initialize data
const initializeData = async () => {
    console.log('Initializing admin data, user logged in:', userLoggedIn.value)
    
    if (!userLoggedIn.value) {
        console.log('User not logged in, skipping initialization')
        loading.value = false
        return
    }
    
    try {
        console.log('Starting to load admin data...')
        await Promise.all([
            loadTimerStatus(),
            loadConfiguration(), 
            refreshVotableProposals()
        ])
        console.log('All admin data loaded successfully')
    } catch (error: any) {
        console.error('Error initializing admin NNS page:', error)
        tacoStore.showError('Error loading admin data: ' + error.message)
    } finally {
        console.log('Setting loading to false')
        loading.value = false
    }
}

// Watch for login state changes and initialize when user logs in
watch(userLoggedIn, async (newValue, oldValue) => {
    console.log('User login state changed:', { oldValue, newValue })
    if (newValue && !oldValue) {
        console.log('User just logged in, initializing data...')
        await initializeData()
    }
}, { immediate: false })

// Initialize on mount if already logged in
onMounted(async () => {
    console.log('AdminNNSView mounted, user logged in:', userLoggedIn.value)
    
    if (userLoggedIn.value) {
        console.log('User already logged in, initializing immediately')
        await initializeData()
    } else {
        console.log('User not logged in, waiting for login state change')
        loading.value = false
    }
})
</script>

<style scoped>
.login-curtain {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
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

.table th {
    background-color: var(--taco-container-l2-bg);
    color: var(--text-primary);
    border-bottom: 2px solid var(--border-color);
}

.table td {
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
}

.table-striped tbody tr:nth-of-type(odd) {
    background-color: rgba(var(--taco-container-l2-bg-rgb), 0.5);
}

.card {
    border: 1px solid var(--border-color);
}

.card-body {
    background-color: var(--taco-container-l2-bg);
    color: var(--text-primary);
}

.form-control {
    background-color: var(--taco-container-l2-bg);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
}

.form-control:focus {
    background-color: var(--taco-container-l2-bg);
    border-color: var(--green);
    color: var(--text-primary);
    box-shadow: 0 0 0 0.2rem rgba(var(--green-rgb), 0.25);
}
</style>
