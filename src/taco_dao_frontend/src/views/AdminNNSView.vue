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

                                <!-- Highest Processed NNS Proposal ID -->
                                <div class="col-md-6 mb-3">
                                    <label class="form-label taco-text-black-to-white">
                                        <i class="fas fa-list-ol me-2"></i>Highest Processed NNS Proposal ID
                                    </label>
                                    <div class="input-group">
                                        <input 
                                            v-model="newHighestProcessedNNSProposalId" 
                                            type="text" 
                                            class="form-control font-monospace" 
                                            placeholder="NNS Proposal ID (numeric)"
                                            style="font-size: 0.85rem;">
                                        <button 
                                            @click="updateHighestProcessedNNSProposalId" 
                                            :disabled="actionLoading || !newHighestProcessedNNSProposalId || !isValidProposalId(newHighestProcessedNNSProposalId)"
                                            class="btn taco-btn taco-btn--green">
                                            <i class="fas fa-save me-1"></i>Update
                                        </button>
                                    </div>
                                    <small class="text-muted">
                                        Current: {{ currentHighestProcessedNNSProposalId || 'Loading...' }}
                                        <span v-if="newHighestProcessedNNSProposalId && !isValidProposalId(newHighestProcessedNNSProposalId)" class="text-danger">
                                            (Invalid proposal ID format)
                                        </span>
                                        <br>
                                        The highest NNS proposal ID that has been processed for copying
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
                                            <td>
                                                <a 
                                                    :href="`https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=${proposal.nns_proposal_id}`"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-decoration-none">
                                                    {{ proposal.nns_proposal_id }}
                                                    <i class="fas fa-external-link-alt ms-1 small text-muted"></i>
                                                </a>
                                            </td>
                                            <td>
                                                <div class="d-flex align-items-center gap-2">
                                                    <router-link 
                                                        :to="`/nnsvote/${proposal.sns_proposal_id}`"
                                                        class="text-decoration-none">
                                                        {{ proposal.sns_proposal_id }}
                                                        <i class="fas fa-arrow-right ms-1 small text-muted"></i>
                                                    </router-link>
                                                    <a 
                                                        :href="`https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=${proposal.sns_proposal_id}`"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="text-decoration-none text-muted"
                                                        title="View SNS proposal on NNS dApp">
                                                        <i class="fas fa-external-link-alt small"></i>
                                                    </a>
                                                </div>
                                            </td>
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
                                                <div class="d-flex gap-1">
                                                    <button 
                                                        @click="forceVoteOnProposal(proposal.sns_proposal_id)" 
                                                        :disabled="votingLoading[proposal.sns_proposal_id]"
                                                        class="btn taco-btn taco-btn--orange btn-sm">
                                                        <i class="fas fa-gavel me-1"></i>Force Vote
                                                    </button>
                                                    <button 
                                                        v-if="proposal.is_expired"
                                                        @click="removeProposalMapping(proposal.nns_proposal_id)" 
                                                        :disabled="removingProposals[proposal.nns_proposal_id]"
                                                        class="btn btn-outline-danger btn-sm"
                                                        title="Remove NNS-SNS mapping for expired proposal">
                                                        <i class="fas fa-trash me-1"></i>
                                                        {{ removingProposals[proposal.nns_proposal_id] ? 'Removing...' : 'Remove' }}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- New Proposal Discovery Section -->
                    <div class="taco-container taco-container--l1 mb-4">
                        <div class="p-3">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <TacoTitle level="h3" emoji="🔍" title="Discover New NNS Proposals" />
                                <button 
                                    @click="startProposalDiscovery" 
                                    :disabled="discoveryLoading || actionLoading"
                                    class="btn taco-btn taco-btn--green">
                                    <i class="fas fa-search me-1"></i>{{ discoveryLoading ? 'Scanning...' : 'Start Discovery' }}
                                </button>
                            </div>

                            <!-- Discovery Settings and Filters -->
                            <div class="row g-3 mb-4">
                                <div class="col-md-3">
                                    <label for="discoveryStartId" class="form-label small">Start from Proposal ID:</label>
                                    <input 
                                        id="discoveryStartId"
                                        v-model="discoveryStartId" 
                                        type="number" 
                                        class="form-control form-control-sm"
                                        :disabled="discoveryLoading"
                                        placeholder="Enter proposal ID"
                                        min="1">
                                </div>
                                <div class="col-md-2">
                                    <label for="maxProposalsToFetch" class="form-label small">Max to fetch:</label>
                                    <input 
                                        id="maxProposalsToFetch"
                                        v-model="maxProposalsToFetch" 
                                        type="number" 
                                        class="form-control form-control-sm"
                                        :disabled="discoveryLoading"
                                        placeholder="Max"
                                        min="1"
                                        max="500">
                                </div>
                                <div class="col-md-7">
                                    <label class="form-label small">Filters:</label>
                                    <div class="d-flex flex-wrap gap-3">
                                        <div class="form-check form-check-sm">
                                            <input 
                                                id="hideNotEligible" 
                                                v-model="filters.hideNotEligible" 
                                                class="form-check-input" 
                                                type="checkbox">
                                            <label class="form-check-label small" for="hideNotEligible">
                                                Hide Not Eligible
                                            </label>
                                        </div>
                                        <div class="form-check form-check-sm">
                                            <input 
                                                id="hideCopied" 
                                                v-model="filters.hideCopied" 
                                                class="form-check-input" 
                                                type="checkbox">
                                            <label class="form-check-label small" for="hideCopied">
                                                Hide Copied
                                            </label>
                                        </div>
                                        <div class="form-check form-check-sm">
                                            <input 
                                                id="hideExpired" 
                                                v-model="filters.hideExpired" 
                                                class="form-check-input" 
                                                type="checkbox">
                                            <label class="form-check-label small" for="hideExpired">
                                                Hide Expired
                                            </label>
                                        </div>
                                        <div class="form-check form-check-sm">
                                            <input 
                                                id="hideVoted" 
                                                v-model="filters.hideVoted" 
                                                class="form-check-input" 
                                                type="checkbox">
                                            <label class="form-check-label small" for="hideVoted">
                                                Hide Voted
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="taco-text-black-to-white mb-0">
                                        {{ discoveryLoading ? 'Discovering proposals...' : `Showing ${filteredDiscoveredProposals.length} of ${discoveredProposals.length} proposals` }}
                                    </h5>
                                    <button 
                                        @click="clearDiscoveredProposals" 
                                        :disabled="discoveryLoading"
                                        class="btn btn-outline-secondary btn-sm">
                                        <i class="fas fa-times me-1"></i>Clear
                                    </button>
                                </div>
                                
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>NNS Proposal ID</th>
                                            <th>Topic</th>
                                            <th>Should Vote?</th>
                                            <th>Proposal Status</th>
                                            <th>Copy Status</th>
                                            <th>TACO DAO Voted?</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="discoveredProposals.length === 0 && discoveryLoading" class="text-center">
                                            <td colspan="7" class="py-4">
                                                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                                <span class="text-muted">Scanning for new NNS proposals starting from ID {{ discoveryStartId || (Number(currentHighestProcessedNNSProposalId) + 1) || 'unknown' }}...</span>
                                            </td>
                                        </tr>
                                        <tr v-else-if="discoveredProposals.length === 0 && !discoveryLoading" class="text-center">
                                            <td colspan="7" class="py-4">
                                                <div class="mb-2" style="font-size: 2rem;">🔍</div>
                                                <p class="taco-text-black-to-white mb-1">Click "Start Discovery" to scan for new NNS proposals</p>
                                                <p class="small text-muted mb-0">
                                                    Will start scanning from NNS proposal ID {{ discoveryStartId || (Number(currentHighestProcessedNNSProposalId) + 1) || 'unknown' }}
                                                </p>
                                            </td>
                                        </tr>
                                        <tr v-else-if="filteredDiscoveredProposals.length === 0" class="text-center">
                                            <td colspan="7" class="py-4">
                                                <div class="mb-2" style="font-size: 1.5rem;">🚫</div>
                                                <p class="taco-text-black-to-white mb-1">No proposals match the current filters</p>
                                                <p class="small text-muted mb-0">
                                                    Found {{ discoveredProposals.length }} total proposals, but all are filtered out
                                                </p>
                                            </td>
                                        </tr>
                                        <tr v-for="proposal in filteredDiscoveredProposals" :key="proposal.id">
                                            <td class="font-monospace">
                                                <a 
                                                    :href="`https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=${proposal.id}`"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-decoration-none">
                                                    {{ proposal.id }}
                                                    <i class="fas fa-external-link-alt ms-1 small text-muted"></i>
                                                </a>
                                            </td>
                                            <td>
                                                <span class="badge" :class="proposal.shouldVote ? 'bg-success' : 'bg-secondary'">
                                                    {{ proposal.topicName }}
                                                </span>
                                            </td>
                                            <td>
                                                <span v-if="proposal.shouldVote" class="text-success">
                                                    <i class="fas fa-check me-1"></i>Yes
                                                </span>
                                                <span v-else class="text-muted">
                                                    <i class="fas fa-times me-1"></i>No
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <span v-if="proposal.statusId === 1" class="badge bg-success">
                                                        <i class="fas fa-vote-yea me-1"></i>{{ proposal.statusName }}
                                                    </span>
                                                    <span v-else-if="proposal.statusId === 2" class="badge bg-danger">
                                                        <i class="fas fa-times me-1"></i>{{ proposal.statusName }}
                                                    </span>
                                                    <span v-else-if="proposal.statusId === 3" class="badge bg-primary">
                                                        <i class="fas fa-check me-1"></i>{{ proposal.statusName }}
                                                    </span>
                                                    <span v-else-if="proposal.statusId === 4" class="badge bg-info">
                                                        <i class="fas fa-cog me-1"></i>{{ proposal.statusName }}
                                                    </span>
                                                    <span v-else-if="proposal.statusId === 5" class="badge bg-warning">
                                                        <i class="fas fa-exclamation-triangle me-1"></i>{{ proposal.statusName }}
                                                    </span>
                                                    <span v-else class="badge bg-secondary">
                                                        <i class="fas fa-question me-1"></i>{{ proposal.statusName || 'Unknown' }}
                                                    </span>
                                                    <div v-if="proposal.isVotable && proposal.statusId !== 1" class="small text-success mt-1">
                                                        <i class="fas fa-clock me-1"></i>Still accepting votes
                                                    </div>
                                                    <div v-else-if="!proposal.isVotable && proposal.proposalInfo?.deadline_timestamp_seconds" class="small text-muted mt-1">
                                                        <i class="fas fa-clock-o me-1"></i>Voting ended
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span v-if="proposal.isCheckingCopyStatus" class="badge bg-light text-dark">
                                                    <i class="fas fa-spinner fa-spin me-1"></i>Checking...
                                                </span>
                                                <span v-else-if="proposal.isAlreadyCopied" class="badge bg-info">
                                                    <i class="fas fa-copy me-1"></i>Already Copied
                                                </span>
                                                <span v-else-if="!proposal.shouldVote" class="badge bg-secondary">
                                                    <i class="fas fa-ban me-1"></i>Skip (Topic)
                                                </span>
                                                <span v-else class="badge bg-warning">
                                                    <i class="fas fa-clock me-1"></i>Ready to Copy
                                                </span>
                                            </td>
                                            <td>
                                                <span v-if="proposal.isCheckingVoteStatus" class="badge bg-light text-dark">
                                                    <i class="fas fa-spinner fa-spin me-1"></i>Checking...
                                                </span>
                                                <span v-else-if="!proposal.isVotable" class="text-muted small">
                                                    <i class="fas fa-ban me-1"></i>N/A (Voting Ended)
                                                </span>
                                                <span v-else-if="proposal.tacoDAOHasVoted === true" class="badge bg-success">
                                                    <i class="fas fa-check me-1"></i>Voted
                                                </span>
                                                <span v-else-if="proposal.tacoDAOHasVoted === false" class="badge bg-secondary">
                                                    <i class="fas fa-times me-1"></i>Not Voted
                                                </span>
                                                <span v-else class="text-muted small">
                                                    Unknown
                                                </span>
                                            </td>
                                            <td>
                                                <div class="d-flex gap-1 flex-wrap">
                                                    <!-- Copy Button -->
                                                    <button 
                                                        v-if="proposal.shouldVote && !proposal.isAlreadyCopied && !proposal.isCheckingCopyStatus"
                                                        @click="copyProposal(proposal.id)" 
                                                        :disabled="copyingProposals[proposal.id]"
                                                        class="btn taco-btn taco-btn--orange btn-sm">
                                                        <i class="fas fa-copy me-1"></i>
                                                        {{ copyingProposals[proposal.id] ? 'Copying...' : 'Copy to SNS' }}
                                                    </button>
                                                    
                                                    <!-- Vote Button for copied but unvoted proposals -->
                                                    <button 
                                                        v-if="proposal.isAlreadyCopied && proposal.isVotable && proposal.tacoDAOHasVoted === false"
                                                        @click="voteOnProposal(proposal.id)" 
                                                        :disabled="votingProposals[proposal.id]"
                                                        class="btn taco-btn taco-btn--green btn-sm">
                                                        <i class="fas fa-vote-yea me-1"></i>
                                                        {{ votingProposals[proposal.id] ? 'Voting...' : 'Vote' }}
                                                    </button>
                                                    
                                                    <!-- Status Messages -->
                                                    <span v-if="proposal.isCheckingCopyStatus" class="text-muted small align-self-center">
                                                        <i class="fas fa-spinner fa-spin me-1"></i>Checking status...
                                                    </span>
                                                    <span v-else-if="!proposal.shouldVote" class="text-muted small align-self-center">
                                                        Not eligible
                                                    </span>
                                                    <span v-else-if="proposal.isAlreadyCopied && proposal.tacoDAOHasVoted === true" class="text-success small align-self-center">
                                                        <i class="fas fa-check me-1"></i>Complete
                                                    </span>
                                                    <span v-else-if="proposal.isAlreadyCopied && !proposal.isVotable" class="text-muted small align-self-center">
                                                        <i class="fas fa-clock-o me-1"></i>Voting ended
                                                    </span>
                                                </div>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import astronautLoader from '../assets/images/astonautLoader.webp'
import * as workerBridge from '../stores/worker-bridge'

// Store
const tacoStore = useTacoStore()
const {
  userLoggedIn,
  cachedVotableProposals,
  cachedPeriodicTimerStatus,
  cachedAutoVotingThreshold,
  cachedProposerSubaccount,
  cachedTacoDAONeuronId,
  cachedDefaultVoteBehavior,
  cachedHighestProcessedNNSProposalId
} = storeToRefs(tacoStore)

// Component state
const loading = ref(true)
const actionLoading = ref(false)
const proposalsLoading = ref(false)
const votingLoading = ref<Record<number, boolean>>({})
const discoveryLoading = ref(false)
const copyingProposals = ref<Record<number, boolean>>({})
const votingProposals = ref<Record<number, boolean>>({})
const removingProposals = ref<Record<number, boolean>>({})

// Discovery settings
const discoveryStartId = ref('')
const maxProposalsToFetch = ref(50) // Default to 50, max 500
const filters = ref({
    hideNotEligible: false,
    hideCopied: false,
    hideExpired: false,
    hideVoted: false
})

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
const newHighestProcessedNNSProposalId = ref('')
const currentHighestProcessedNNSProposalId = ref('')

// Proposals
const votableProposals = ref<any[]>([])
const discoveredProposals = ref<any[]>([])

// Computed
const astronautLoaderUrl = astronautLoader

// Filter discovered proposals based on checkboxes
const filteredDiscoveredProposals = computed(() => {
    return discoveredProposals.value.filter(proposal => {
        if (filters.value.hideNotEligible && !proposal.shouldVote) return false
        if (filters.value.hideCopied && proposal.isAlreadyCopied) return false
        if (filters.value.hideExpired && !proposal.isVotable) return false
        if (filters.value.hideVoted && proposal.tacoDAOHasVoted === true) return false
        return true
    })
})

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

const isValidProposalId = (proposalId: string) => {
    if (!proposalId) return true // Allow empty for display purposes
    // Check if it's a valid positive integer
    return /^\d+$/.test(proposalId) && BigInt(proposalId) > 0
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

const updateHighestProcessedNNSProposalId = async () => {
    if (!newHighestProcessedNNSProposalId.value || !isValidProposalId(newHighestProcessedNNSProposalId.value)) {
        tacoStore.showError('Invalid proposal ID format. Please enter a positive integer.')
        return
    }

    try {
        actionLoading.value = true
        await tacoStore.setHighestProcessedNNSProposalId(BigInt(newHighestProcessedNNSProposalId.value))
        tacoStore.showSuccess('Highest processed NNS proposal ID updated successfully')
        await loadConfiguration()
    } catch (error: any) {
        console.error('Error updating highest processed NNS proposal ID:', error)
        tacoStore.showError('Error updating highest processed NNS proposal ID: ' + error.message)
    } finally {
        actionLoading.value = false
    }
}

// Proposal methods - use worker for non-blocking fetch
const refreshVotableProposals = () => {
    console.log('AdminNNSView: Triggering worker refresh for votable proposals')
    workerBridge.fetch('votableProposals', true)
}

const forceVoteOnProposal = async (snsProposalId: number) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to force vote on SNS Proposal ${snsProposalId}?\n\nThis will cast a vote using the current default vote behavior.`)
    if (!confirmed) {
        return
    }

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

// Proposal discovery methods
const startProposalDiscovery = async () => {
    try {
        discoveryLoading.value = true
        discoveredProposals.value = []
        
        // Use custom start ID if provided, otherwise use highest processed + 1
        const startId = discoveryStartId.value ? Number(discoveryStartId.value) : (Number(currentHighestProcessedNNSProposalId.value) || 0) + 1
        let currentId = startId
        let consecutiveNotFound = 0
        const maxConsecutiveNotFound = 10 // Stop after 10 consecutive missing proposals
        
        // Respect max proposals limit (1-500)
        const maxToFetch = Math.min(Math.max(Number(maxProposalsToFetch.value) || 50, 1), 500)
        let proposalsFound = 0
        
        tacoStore.showSuccess(`Starting proposal discovery from ID ${currentId} (max ${maxToFetch} proposals)`)
        
        while (consecutiveNotFound < maxConsecutiveNotFound && proposalsFound < maxToFetch) {
            try {
                console.log('Checking NNS proposal ID:', currentId)
                const proposalInfo = await tacoStore.getNNSProposalInfo(BigInt(currentId))
                
                if (proposalInfo) {
                    consecutiveNotFound = 0 // Reset counter when we find a proposal
                    
                    // Extract topic ID and status from the proposal
                    const topicId = Number(proposalInfo.topic || 0)
                    const topicName = tacoStore.getTopicName(topicId)
                    const shouldVote = tacoStore.shouldVoteTopic(topicId)
                    
                    // Extract proposal status
                    const statusId = Number(proposalInfo.status || 0)
                    const statusName = tacoStore.getProposalStatusName(statusId)
                    const isVotable = tacoStore.isProposalVotable(proposalInfo)
                    
                    // Create the proposal object first (without copy/vote checks)
                    const discoveredProposal = {
                        id: currentId,
                        topicId: topicId,
                        topicName: topicName,
                        shouldVote: shouldVote,
                        statusId: statusId,
                        statusName: statusName,
                        isVotable: isVotable,
                        isAlreadyCopied: false, // Will be updated below
                        proposalInfo: proposalInfo,
                        isCheckingCopyStatus: shouldVote, // Show loading state for copy check
                        tacoDAOHasVoted: null as boolean | null, // Will be updated below
                        isCheckingVoteStatus: isVotable // Only check vote status for votable proposals
                    }
                    
                    // Add to table immediately for progressive display
                    discoveredProposals.value.push(discoveredProposal)
                    proposalsFound++ // Increment counter for max limit
                    
                    // Force DOM update
                    await nextTick()
                    
                    console.log('Found proposal:', discoveredProposal)
                    console.log(`Total discovered proposals now: ${discoveredProposals.value.length} (${proposalsFound}/${maxToFetch})`)
                    
                    // Check TACO DAO voting status only for votable (open) proposals
                    if (isVotable) {
                        try {
                            const tacoDAONeuronId = BigInt(currentTacoDAONeuronId.value || '0')
                            if (tacoDAONeuronId > 0) {
                                const hasVoted = await tacoStore.hasNeuronVotedOnNNSProposal(BigInt(currentId), tacoDAONeuronId)
                                console.log(`Proposal ${currentId} TACO DAO vote check:`, { hasVoted })
                                
                                // Update the proposal in the array reactively
                                const proposalIndex = discoveredProposals.value.findIndex(p => p.id === currentId)
                                if (proposalIndex !== -1) {
                                    discoveredProposals.value[proposalIndex] = {
                                        ...discoveredProposals.value[proposalIndex],
                                        tacoDAOHasVoted: hasVoted,
                                        isCheckingVoteStatus: false
                                    }
                                }
                            } else {
                                // No TACO DAO neuron ID set
                                const proposalIndex = discoveredProposals.value.findIndex(p => p.id === currentId)
                                if (proposalIndex !== -1) {
                                    discoveredProposals.value[proposalIndex] = {
                                        ...discoveredProposals.value[proposalIndex],
                                        tacoDAOHasVoted: null,
                                        isCheckingVoteStatus: false
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn('Error checking TACO DAO vote status:', error)
                            // Update the proposal in the array reactively
                            const proposalIndex = discoveredProposals.value.findIndex(p => p.id === currentId)
                            if (proposalIndex !== -1) {
                                discoveredProposals.value[proposalIndex] = {
                                    ...discoveredProposals.value[proposalIndex],
                                    tacoDAOHasVoted: null,
                                    isCheckingVoteStatus: false
                                }
                            }
                        }
                    } else {
                        // For non-votable proposals, set vote status immediately without checking
                        const proposalIndex = discoveredProposals.value.findIndex(p => p.id === currentId)
                        if (proposalIndex !== -1) {
                            discoveredProposals.value[proposalIndex] = {
                                ...discoveredProposals.value[proposalIndex],
                                tacoDAOHasVoted: null, // N/A for non-votable proposals
                                isCheckingVoteStatus: false
                            }
                        }
                    }
                    
                    // Check if already copied (async, will update the proposal in place)
                    if (shouldVote) {
                        try {
                            const copiedSnsId = await tacoStore.isNNSProposalCopied(BigInt(currentId))
                            const isAlreadyCopied = copiedSnsId !== null
                            console.log(`Proposal ${currentId} copy check:`, { copiedSnsId, isAlreadyCopied })
                            
                            // Update the proposal in the array reactively
                            const proposalIndex = discoveredProposals.value.findIndex(p => p.id === currentId)
                            if (proposalIndex !== -1) {
                                discoveredProposals.value[proposalIndex] = {
                                    ...discoveredProposals.value[proposalIndex],
                                    isAlreadyCopied: isAlreadyCopied,
                                    isCheckingCopyStatus: false
                                }
                            }
                        } catch (error) {
                            console.warn('Error checking if proposal is copied:', error)
                            // Update the proposal in the array reactively
                            const proposalIndex = discoveredProposals.value.findIndex(p => p.id === currentId)
                            if (proposalIndex !== -1) {
                                discoveredProposals.value[proposalIndex] = {
                                    ...discoveredProposals.value[proposalIndex],
                                    isCheckingCopyStatus: false
                                }
                            }
                        }
                    }
                } else {
                    consecutiveNotFound++
                    console.log(`Proposal ${currentId} not found (${consecutiveNotFound}/${maxConsecutiveNotFound})`)
                }
                
                currentId++
                
                // Add a small delay to avoid overwhelming the network
                await new Promise(resolve => setTimeout(resolve, 50))
                
            } catch (error: any) {
                console.error(`Error checking proposal ${currentId}:`, error)
                consecutiveNotFound++
                currentId++
            }
        }
        
        const foundCount = discoveredProposals.value.length
        const eligibleCount = discoveredProposals.value.filter(p => p.shouldVote && !p.isAlreadyCopied).length
        
        if (foundCount > 0) {
            const hitLimit = proposalsFound >= maxToFetch
            const limitText = hitLimit ? ` (reached limit of ${maxToFetch})` : ''
            tacoStore.showSuccess(`Discovery complete! Found ${foundCount} proposals${limitText}, ${eligibleCount} eligible for copying`)
        } else {
            tacoStore.showSuccess('No new proposals found')
        }
        
    } catch (error: any) {
        console.error('Error during proposal discovery:', error)
        tacoStore.showError('Error during proposal discovery: ' + error.message)
    } finally {
        discoveryLoading.value = false
    }
}

const clearDiscoveredProposals = () => {
    discoveredProposals.value = []
    tacoStore.showSuccess('Cleared discovered proposals')
}

const copyProposal = async (nnsProposalId: number) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to copy NNS Proposal ${nnsProposalId} to SNS?\n\nThis will create a new SNS motion proposal.`)
    if (!confirmed) {
        return
    }

    try {
        copyingProposals.value[nnsProposalId] = true
        
        const result = await tacoStore.copyNNSProposal(BigInt(nnsProposalId))
        
        if ('ok' in result) {
            tacoStore.showSuccess(`Successfully copied NNS proposal ${nnsProposalId} to SNS proposal ${result.ok}`)
            
            // Update the proposal in our list to show it's now copied
            const proposalIndex = discoveredProposals.value.findIndex(p => p.id === nnsProposalId)
            if (proposalIndex !== -1) {
                discoveredProposals.value[proposalIndex] = {
                    ...discoveredProposals.value[proposalIndex],
                    isAlreadyCopied: true,
                    isCheckingCopyStatus: false
                }
            }
            
            // Refresh the votable proposals list
            await refreshVotableProposals()
        } else {
            let errorMessage = 'Unknown error'
            if (result.err) {
                if (typeof result.err === 'string') {
                    errorMessage = result.err
                } else if (result.err.error_message) {
                    errorMessage = result.err.error_message
                } else if (typeof result.err === 'object') {
                    // Handle different error object structures
                    const errorKeys = Object.keys(result.err)
                    if (errorKeys.length > 0) {
                        const firstKey = errorKeys[0]
                        const errorValue = result.err[firstKey]
                        if (typeof errorValue === 'string') {
                            errorMessage = errorValue
                        } else {
                            errorMessage = firstKey
                        }
                    } else {
                        errorMessage = JSON.stringify(result.err)
                    }
                }
            }
            tacoStore.showError(`Failed to copy proposal ${nnsProposalId}: ${errorMessage}`)
        }
    } catch (error: any) {
        console.error('Error copying proposal:', error)
        tacoStore.showError('Error copying proposal: ' + error.message)
    } finally {
        copyingProposals.value[nnsProposalId] = false
    }
}

const voteOnProposal = async (nnsProposalId: number) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to vote on NNS Proposal ${nnsProposalId}?\n\nThis will cast a vote using the current default vote behavior.`)
    if (!confirmed) {
        return
    }

    try {
        votingProposals.value[nnsProposalId] = true
        
        // Vote using the same logic as the main voting table
        const result = await tacoStore.voteOnNNSProposal(BigInt(nnsProposalId))
        
        if ('ok' in result) {
            tacoStore.showSuccess(`Successfully voted on NNS proposal ${nnsProposalId}`)
            
            // Update the proposal in our list to show vote status
            const proposalIndex = discoveredProposals.value.findIndex(p => p.id === nnsProposalId)
            if (proposalIndex !== -1) {
                discoveredProposals.value[proposalIndex] = {
                    ...discoveredProposals.value[proposalIndex],
                    tacoDAOHasVoted: true,
                    isCheckingVoteStatus: false
                }
            }
            
            // Refresh the votable proposals list
            await refreshVotableProposals()
        } else {
            let errorMessage = 'Unknown error'
            if (result.err) {
                if (typeof result.err === 'string') {
                    errorMessage = result.err
                } else if (result.err.error_message) {
                    errorMessage = result.err.error_message
                } else if (typeof result.err === 'object') {
                    // Handle different error object structures
                    const errorKeys = Object.keys(result.err)
                    if (errorKeys.length > 0) {
                        const firstKey = errorKeys[0]
                        const errorValue = result.err[firstKey]
                        if (typeof errorValue === 'string') {
                            errorMessage = errorValue
                        } else {
                            errorMessage = firstKey
                        }
                    } else {
                        errorMessage = JSON.stringify(result.err)
                    }
                }
            }
            tacoStore.showError(`Failed to vote on proposal ${nnsProposalId}: ${errorMessage}`)
        }
    } catch (error: any) {
        console.error('Error voting on proposal:', error)
        tacoStore.showError('Error voting on proposal: ' + error.message)
    } finally {
        votingProposals.value[nnsProposalId] = false
    }
}

const removeProposalMapping = async (nnsProposalId: number) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to remove the NNS-SNS mapping for NNS Proposal ${nnsProposalId}?\n\nThis will permanently delete the relationship between the NNS and SNS proposals.`)
    if (!confirmed) {
        return
    }

    try {
        removingProposals.value[nnsProposalId] = true
        
        await tacoStore.removeCopiedNNSProposal(BigInt(nnsProposalId))
        
        tacoStore.showSuccess(`Successfully removed NNS-SNS mapping for proposal ${nnsProposalId}`)
        
        // Refresh the votable proposals list to remove it from the table
        await refreshVotableProposals()
        
    } catch (error: any) {
        console.error('Error removing proposal mapping:', error)
        tacoStore.showError('Error removing proposal mapping: ' + error.message)
    } finally {
        removingProposals.value[nnsProposalId] = false
    }
}

// Load data methods - use workers for non-blocking fetches
const loadTimerStatus = () => {
    console.log('AdminNNSView: Triggering worker refresh for timer status')
    workerBridge.fetch('periodicTimerStatus', true)
}

// Load configuration - use workers for non-blocking fetches
// Watchers will process and sync to local refs when data arrives
const loadConfiguration = () => {
    console.log('AdminNNSView: Triggering worker refresh for NNS configuration')
    workerBridge.fetch('autoVotingThreshold', true)
    workerBridge.fetch('proposerSubaccount', true)
    workerBridge.fetch('tacoDAONeuronId', true)
    workerBridge.fetch('defaultVoteBehavior', true)
    workerBridge.fetch('highestProcessedNNSProposalId', true)
}

// Watchers to sync cached data to local refs
watch(cachedVotableProposals, (newVal) => {
    if (newVal?.length > 0) {
        votableProposals.value = newVal.map((proposal: any) => ({
            ...proposal,
            nns_proposal_id: Number(proposal.nns_proposal_id),
            sns_proposal_id: Number(proposal.sns_proposal_id),
            time_remaining_seconds: Number(proposal.time_remaining_seconds)
        }))
        loading.value = false
    }
}, { immediate: true })

watch(cachedPeriodicTimerStatus, (status) => {
    if (status) {
        periodicTimerStatus.value = {
            is_running: status.is_running,
            interval_seconds: Number(status.interval_seconds),
            last_run_time: status.last_run_time ? Number(status.last_run_time) : null,
            next_run_time: status.next_run_time ? Number(status.next_run_time) : null,
            timer_id: status.timer_id ? Number(status.timer_id) : null
        }
        newPeriodicInterval.value = periodicTimerStatus.value.interval_seconds
        loading.value = false
    }
}, { immediate: true })

watch(cachedAutoVotingThreshold, (newVal) => {
    if (newVal) {
        currentVotingThreshold.value = Number(newVal)
        newVotingThreshold.value = currentVotingThreshold.value
    }
}, { immediate: true })

watch(cachedHighestProcessedNNSProposalId, (newVal) => {
    if (newVal) {
        currentHighestProcessedNNSProposalId.value = newVal.toString()
        discoveryStartId.value = (Number(newVal) + 1).toString()
    }
}, { immediate: true })

watch(cachedProposerSubaccount, (newVal) => {
    if (newVal) {
        currentProposerSubaccount.value = newVal
    }
}, { immediate: true })

watch(cachedTacoDAONeuronId, (newVal) => {
    if (newVal) {
        currentTacoDAONeuronId.value = newVal.toString()
    }
}, { immediate: true })

watch(cachedDefaultVoteBehavior, (newVal) => {
    if (newVal) {
        currentDefaultVoteBehavior.value = newVal
        newDefaultVoteBehavior.value = newVal
    }
}, { immediate: true })

// Function to initialize data
const initializeData = async () => {
    console.log('Initializing admin data, user logged in:', userLoggedIn.value)

    if (!userLoggedIn.value) {
        console.log('User not logged in, skipping initialization')
        loading.value = false
        return
    }

    // Check if we have any cached data - if so, hide loading
    const hasCachedData = !!(
        cachedVotableProposals.value?.length > 0 ||
        cachedPeriodicTimerStatus.value ||
        cachedAutoVotingThreshold.value
    )

    if (hasCachedData) {
        loading.value = false
    }

    // Trigger worker fetches for NNS data
    workerBridge.fetch('votableProposals', false)
    workerBridge.fetch('periodicTimerStatus', false)
    workerBridge.fetch('autoVotingThreshold', false)
    workerBridge.fetch('proposerSubaccount', false)
    workerBridge.fetch('tacoDAONeuronId', false)
    workerBridge.fetch('defaultVoteBehavior', false)
    workerBridge.fetch('highestProcessedNNSProposalId', false)

    // Hide loading after a short delay if no cached data
    if (!hasCachedData) {
        setTimeout(() => {
            loading.value = false
        }, 2000) // 2 second max wait
    }

    console.log('AdminNNSView: Triggered worker fetches for NNS data')
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
