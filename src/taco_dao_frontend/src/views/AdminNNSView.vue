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
                            <TacoTitle level="h3" emoji="⏰" title="Timer Status" class="mb-4" />

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
                            <TacoTitle level="h3" emoji="⚙️" title="Configuration" class="mb-4" />

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
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'

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

// Proposals
const votableProposals = ref<any[]>([])

// Computed
const astronautLoaderUrl = computed(() => tacoStore.astronautLoaderUrl)

// Methods
const formatSeconds = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}

const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp * 1000).toLocaleString()
}

const formatTimeRemaining = (seconds: number) => {
    if (seconds < 0) {
        const absSeconds = Math.abs(seconds)
        return `Expired ${formatSeconds(absSeconds)} ago`
    }
    return formatSeconds(seconds)
}

const isUrgent = (proposal: any) => {
    if (!proposal.time_remaining_seconds) return false
    return proposal.time_remaining_seconds <= currentVotingThreshold.value && !proposal.is_expired
}

// Timer control methods
const startPeriodicTimer = async () => {
    try {
        actionLoading.value = true
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'startPeriodicTimer', [])
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
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'stopPeriodicTimer', [])
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
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'startAutoProcessNNSProposals', [new Uint8Array()])
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
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'stopAutoProcessNNSProposals', [])
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
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'startAutoVoteOnUrgentProposals', [])
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
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'stopAutoVoteOnUrgentProposals', [])
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
        await tacoStore.callCanisterMethod('neuronSnapshot', 'setPeriodicTimerIntervalSeconds', [BigInt(newPeriodicInterval.value)])
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
        await tacoStore.callCanisterMethod('neuronSnapshot', 'setAutoVotingThresholdSeconds', [BigInt(newVotingThreshold.value)])
        tacoStore.showSuccess('Voting threshold updated successfully')
        await loadConfiguration()
    } catch (error: any) {
        console.error('Error updating voting threshold:', error)
        tacoStore.showError('Error updating voting threshold: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

// Proposal methods
const refreshVotableProposals = async () => {
    try {
        proposalsLoading.value = true
        const proposals = await tacoStore.callCanisterMethod('neuronSnapshot', 'getVotableProposalsWithTimeLeft', [])
        votableProposals.value = proposals || []
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
        const result = await tacoStore.callCanisterMethod('neuronSnapshot', 'voteOnNNSProposal', [BigInt(snsProposalId)])
        
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
            tacoStore.callCanisterMethod('neuronSnapshot', 'getPeriodicTimerStatus', []),
            tacoStore.callCanisterMethod('neuronSnapshot', 'isAutoProcessingRunning', []),
            tacoStore.callCanisterMethod('neuronSnapshot', 'isAutoVotingRunning', [])
        ])
        
        periodicTimerStatus.value = periodicStatus || periodicTimerStatus.value
        isAutoProcessingRunning.value = autoProcessing || false
        isAutoVotingRunning.value = autoVoting || false
        
        // Update form values
        newPeriodicInterval.value = Number(periodicTimerStatus.value.interval_seconds)
    } catch (error: any) {
        console.error('Error loading timer status:', error)
        tacoStore.showError('Error loading timer status: ' + error.message)
    }
}

const loadConfiguration = async () => {
    try {
        const votingThreshold = await tacoStore.callCanisterMethod('neuronSnapshot', 'getAutoVotingThresholdSeconds', [])
        currentVotingThreshold.value = Number(votingThreshold || 7200)
        newVotingThreshold.value = currentVotingThreshold.value
    } catch (error: any) {
        console.error('Error loading configuration:', error)
        tacoStore.showError('Error loading configuration: ' + error.message)
    }
}

// Initialize
onMounted(async () => {
    try {
        if (!userLoggedIn.value) {
            tacoStore.showError('You must be logged in to access admin functions')
            return
        }
        
        await Promise.all([
            loadTimerStatus(),
            loadConfiguration(),
            refreshVotableProposals()
        ])
    } catch (error: any) {
        console.error('Error initializing admin NNS page:', error)
        tacoStore.showError('Error loading admin data: ' + error.message)
    } finally {
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
