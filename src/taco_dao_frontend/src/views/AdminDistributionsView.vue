<template>
  <div class="standard-view">
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🎯" title="Rewards Distribution Management" class="mt-4" style="padding-left: 1rem !important;"/>

          <!-- Navigation Bar -->
          <div class="mb-4">
            <div class="d-flex gap-3 flex-wrap">
              <router-link to="/admin" class="btn btn-dark">
                🔑 Admin Panel
              </router-link>
              <router-link to="/admin/rewards" class="btn btn-outline-success">
                🏆 Neuron Performance Rewards
              </router-link>
              <router-link to="/admin/rewards/balances" class="btn btn-outline-success">
                💰 Reward Balances
              </router-link>
            </div>
          </div>

          <!-- Distribution Controls -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Distribution Controls</h3>
            </div>
            <div class="card-body">
              <!-- Quick Actions -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <button 
                    class="btn btn-success w-100 mb-3" 
                    @click="triggerDistribution"
                    :disabled="isLoading || distributionInProgress"
                  >
                    <span v-if="isLoading && currentAction === 'trigger'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    🚀 Trigger Default Distribution
                  </button>
                </div>
                <div class="col-md-4">
                  <button 
                    class="btn btn-primary w-100 mb-3" 
                    @click="startDistributionTimer"
                    :disabled="isLoading || !shouldShowStartButton"
                  >
                    <span v-if="isLoading && currentAction === 'start'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    ⏰ Start Auto Timer
                  </button>
                </div>
                <div class="col-md-4">
                  <button 
                    class="btn btn-warning w-100 mb-3" 
                    @click="stopDistributionTimer"
                    :disabled="isLoading || !shouldShowStopButton"
                  >
                    <span v-if="isLoading && currentAction === 'stop'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    ⏹️ Stop Auto Timer
                  </button>
                </div>
              </div>

              <!-- Custom Distribution Parameters -->
              <div class="border-top pt-3">
                <h5 class="mb-3">Custom Distribution</h5>
                <div class="row">
                  <div class="col-md-4">
                    <label for="customStartTime" class="form-label">Start Time:</label>
                    <input 
                      id="customStartTime" 
                      type="datetime-local" 
                      class="form-control bg-dark text-white" 
                      v-model="customStartTime"
                    />
                  </div>
                  <div class="col-md-4">
                    <label for="customEndTime" class="form-label">End Time:</label>
                    <input 
                      id="customEndTime" 
                      type="datetime-local" 
                      class="form-control bg-dark text-white" 
                      v-model="customEndTime"
                    />
                  </div>
                  <div class="col-md-4">
                    <label for="priceType" class="form-label">Price Denomination:</label>
                    <select 
                      id="priceType" 
                      class="form-select bg-dark text-white" 
                      v-model="selectedPriceType"
                    >
                      <option value="USD">USD</option>
                      <option value="ICP">ICP</option>
                    </select>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-12">
                    <button 
                      class="btn btn-info w-100" 
                      @click="triggerCustomDistribution"
                      :disabled="isLoading || distributionInProgress || !isValidCustomInput"
                    >
                      <span v-if="isLoading && currentAction === 'triggerCustom'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      🎯 Trigger Custom Distribution
                    </button>
                    <small v-if="!isValidCustomInput" class="text-warning">
                      Please set valid start and end times (start must be before end)
                    </small>
                  </div>
                </div>
              </div>
              
              <!-- Configuration Controls -->
              <div class="row mt-4">
                <div class="col-md-6">
                  <label for="rewardPot" class="form-label">Periodic Reward Pot:</label>
                  <div class="input-group">
                    <input 
                      id="rewardPot" 
                      type="number" 
                      class="form-control bg-dark text-white" 
                      v-model.number="newRewardPot"
                      step="0.01"
                      min="0"
                    />
                    <button 
                      class="btn btn-outline-primary" 
                      @click="updateRewardPot"
                      :disabled="isLoading"
                    >
                      Update
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <label for="distributionPeriod" class="form-label">Distribution Period (days):</label>
                  <div class="input-group">
                    <input 
                      id="distributionPeriod" 
                      type="number" 
                      class="form-control bg-dark text-white" 
                      v-model.number="newDistributionPeriod"
                      step="1"
                      min="1"
                    />
                    <button 
                      class="btn btn-outline-primary" 
                      @click="updateDistributionPeriod"
                      :disabled="isLoading"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Power Factor Controls -->
              <div class="row mt-3">
                <div class="col-md-6">
                  <label for="performanceScorePower" class="form-label">Performance Score Power:</label>
                  <div class="input-group">
                    <input 
                      id="performanceScorePower" 
                      type="number" 
                      class="form-control bg-dark text-white" 
                      v-model.number="newPerformanceScorePower"
                      step="0.1"
                      min="0"
                    />
                    <button 
                      class="btn btn-outline-primary" 
                      @click="updatePerformanceScorePower"
                      :disabled="isLoading"
                    >
                      Update
                    </button>
                  </div>
                  <small class="text-muted">
                    0 = no effect, 1 = linear, 2 = quadratic, etc.
                  </small>
                </div>
                <div class="col-md-6">
                  <label for="votingPowerPower" class="form-label">Voting Power Power:</label>
                  <div class="input-group">
                    <input 
                      id="votingPowerPower" 
                      type="number" 
                      class="form-control bg-dark text-white" 
                      v-model.number="newVotingPowerPower"
                      step="0.1"
                      min="0"
                    />
                    <button 
                      class="btn btn-outline-primary" 
                      @click="updateVotingPowerPower"
                      :disabled="isLoading"
                    >
                      Update
                    </button>
                  </div>
                  <small class="text-muted">
                    0 = no effect, 1 = linear, 2 = quadratic, etc.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <!-- Reward Penalties Section -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">⚖️ Reward Penalties ({{ rewardPenalties.length }})</h3>
              <button
                class="btn btn-sm btn-outline-warning"
                @click="refreshRewardPenalties"
                :disabled="isLoadingPenalties"
              >
                {{ isLoadingPenalties ? 'Loading...' : '🔄 Refresh' }}
              </button>
            </div>
            <div class="card-body">
              <p class="text-muted mb-3">
                Manage reward penalties for neurons. Penalized neurons receive a reduced percentage of their calculated rewards.
              </p>

              <!-- Add Penalty Form -->
              <div class="mb-4 p-3" style="background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem;">
                <h5>Add Reward Penalty</h5>
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group mb-2">
                      <label for="rewardPenaltyNeuronId">Neuron ID (hex)</label>
                      <input
                        type="text"
                        id="rewardPenaltyNeuronId"
                        v-model="newPenaltyNeuronId"
                        class="form-control bg-dark text-white font-monospace"
                        placeholder="Enter neuron ID in hex format..."
                      >
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-group mb-2">
                      <label for="rewardPenaltyMultiplier">Reward % (1-100)</label>
                      <input
                        type="number"
                        id="rewardPenaltyMultiplier"
                        v-model.number="newPenaltyMultiplier"
                        class="form-control bg-dark text-white"
                        placeholder="e.g. 50"
                        min="1"
                        max="100"
                      >
                    </div>
                  </div>
                  <div class="col-md-3 d-flex align-items-end">
                    <button
                      class="btn btn-warning mb-2"
                      @click="addPenalty"
                      :disabled="isAddingPenalty || !newPenaltyNeuronId.trim() || !newPenaltyMultiplier"
                    >
                      {{ isAddingPenalty ? 'Adding...' : '➕ Add Penalty' }}
                    </button>
                  </div>
                </div>
                <small class="text-muted">
                  Reward % determines how much of the neuron's calculated rewards they receive. E.g., 1 = 1% rewards, 50 = 50% rewards, 100 = full rewards (no penalty).
                </small>
              </div>

              <!-- Penalized Neurons Table -->
              <div v-if="rewardPenalties.length > 0">
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                  <table class="table table-dark table-striped table-sm">
                    <thead class="sticky-top">
                      <tr>
                        <th>Neuron ID</th>
                        <th>Reward %</th>
                        <th>Effect</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="neuron in rewardPenalties" :key="uint8ArrayToHex(neuron.neuronId)">
                        <td>
                          <div class="font-monospace">{{ formatNeuronId(neuron.neuronId) }}</div>
                        </td>
                        <td>{{ neuron.multiplier }}%</td>
                        <td>Receives {{ neuron.multiplier }}% of rewards</td>
                        <td>
                          <button
                            class="btn btn-sm btn-danger"
                            @click="removePenalty(uint8ArrayToHex(neuron.neuronId))"
                            :disabled="removingNeuronId === uint8ArrayToHex(neuron.neuronId)"
                          >
                            {{ removingNeuronId === uint8ArrayToHex(neuron.neuronId) ? 'Removing...' : '🗑️ Remove' }}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-center text-muted py-4">
                <p class="mb-0">No reward penalties configured</p>
                <small>All neurons will receive full rewards</small>
              </div>

              <!-- Penalty Error Message -->
              <div v-if="penaltyErrorMessage" class="alert alert-danger mt-3" role="alert">
                {{ penaltyErrorMessage }}
              </div>

              <!-- Penalty Success Message -->
              <div v-if="penaltySuccessMessage" class="alert alert-success mt-3" role="alert">
                {{ penaltySuccessMessage }}
              </div>
            </div>
          </div>

          <!-- Current Status -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Distribution Status</h3>
            </div>
            <div class="card-body">
              <div class="row" v-if="distributionStatus">
                <div class="col-md-3">
                  <strong>Current Status:</strong><br>
                  <span :class="distributionInProgress ? 'text-warning' : 'text-success'">
                    {{ distributionInProgress ? '🔄 In Progress' : '✅ Idle' }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Last Distribution:</strong><br>
                  <span class="text-info">
                    {{ formatTimestamp(distributionStatus.lastDistributionTime) }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Next Scheduled:</strong><br>
                  <span class="text-info">
                    {{ configuration?.nextScheduledDistribution ? formatTimestamp(Number(configuration.nextScheduledDistribution)) : 'Not scheduled' }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Total Distributions:</strong><br>
                  <span class="text-success">{{ distributionStatus.totalDistributions }}</span>
                </div>
              </div>
              <div class="row mt-3" v-if="configuration">
                <div class="col-md-4">
                  <strong>Current Reward Pot:</strong><br>
                  <span class="text-success">{{ configuration.periodicRewardPot }} tokens</span>
                </div>
                <div class="col-md-4">
                  <strong>Distribution Period:</strong><br>
                  <span class="text-info">{{ Math.round(Number(configuration.distributionPeriodNS) / (24 * 60 * 60 * 1_000_000_000)) }} days</span>
                </div>
                <div class="col-md-4">
                  <strong>Auto Timer:</strong><br>
                  <span :class="timerRunning ? 'text-success' : 'text-warning'">
                    {{ timerRunning ? '✅ Running' : '⚠️ Stopped' }}
                  </span>
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-md-3">
                  <strong>Total Distributed:</strong><br>
                  <span class="text-warning">{{ adminStore.formatTacoPrecise(totalDistributed) }} TACO</span>
                </div>
                <div class="col-md-3">
                  <strong>Canister TACO Balance:</strong><br>
                  <span class="text-primary">{{ adminStore.formatTacoPrecise(tacoBalance) }} TACO</span>
                </div>
                <div class="col-md-3">
                  <strong>Current Neuron Balances:</strong><br>
                  <span class="text-info">{{ adminStore.formatTacoPrecise(currentNeuronBalances) }} TACO</span>
                </div>
                <div class="col-md-3">
                  <strong>Available for Distribution:</strong><br>
                  <span :class="availableBalance >= 0 ? 'text-success' : 'text-danger'">
                    {{ adminStore.formatTacoPrecise(availableBalance) }} TACO
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            <strong>Error:</strong> {{ errorMessage }}
          </div>

          <!-- Success Display -->
          <div v-if="successMessage" class="alert alert-success" role="alert">
            <strong>Success:</strong> {{ successMessage }}
          </div>

          <!-- Distribution History -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">
                Distribution History
                <span v-if="historyTotal > 0" class="badge bg-secondary ms-2">{{ distributionHistory.length }} / {{ historyTotal }}</span>
              </h3>
              <button 
                class="btn btn-outline-primary btn-sm" 
                @click="refreshHistory"
                :disabled="isLoading"
              >
                <span v-if="isLoading && currentAction === 'refresh'" class="spinner-border spinner-border-sm me-2" role="status"></span>
                🔄 Refresh
              </button>
            </div>
            <div class="card-body">
              <div v-if="distributionHistory && distributionHistory.length > 0">
                <div v-for="(distribution, index) in distributionHistory" :key="distribution.id" class="distribution-record mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="mb-0">
                      Distribution #{{ distribution.id }}
                      <span 
                        class="badge ms-2" 
                        :class="getStatusBadgeClass(distribution.status)"
                      >
                        {{ getStatusText(distribution.status) }}
                      </span>
                    </h5>
                    <small class="text-muted">
                      {{ formatTimestamp(distribution.distributionTime) }}
                    </small>
                  </div>
                  
                  <div class="row">
                    <div class="col-md-3">
                      <strong>Period:</strong><br>
                      <small>
                        {{ formatTimestamp(distribution.startTime) }}<br>
                        to {{ formatTimestamp(distribution.endTime) }}
                      </small>
                    </div>
                    <div class="col-md-3">
                      <strong>Neurons Processed:</strong><br>
                      <span class="text-info">{{ distribution.neuronsProcessed }}</span>
                      <span v-if="isInProgress(distribution.status)" class="text-warning">
                        / {{ distribution.status.InProgress?.totalNeurons || '?' }}
                      </span>
                    </div>
                    <div class="col-md-3">
                      <strong>Total Reward Pot:</strong><br>
                      <span class="text-success">{{ Number(distribution.totalRewardPot || 0) }} TACO tokens</span>
                    </div>
                    <div class="col-md-3">
                      <strong>Total Reward Score:</strong><br>
                      <span class="text-info">{{ distribution.totalRewardScore.toFixed(6) }}</span>
                    </div>
                  </div>

                  <!-- Progress bar for in-progress distributions -->
                  <div v-if="isInProgress(distribution.status)" class="mt-3">
                    <div class="progress">
                      <div 
                        class="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        :style="{ width: getProgressPercent(distribution.status) + '%' }"
                      >
                        {{ getProgressPercent(distribution.status).toFixed(1) }}%
                      </div>
                    </div>
                  </div>

                  <!-- Neuron Details Expansion -->
                  <div v-if="distribution.neuronRewards && distribution.neuronRewards.length > 0" class="mt-3">
                    <button 
                      class="btn btn-outline-info btn-sm" 
                      @click="toggleRewardDetails(index)"
                    >
                      {{ showRewardDetails[index] ? '🔽 Hide' : '🔼 Show' }} Neuron Details ({{ distribution.neuronRewards.length }})
                    </button>
                    
                    <div v-if="showRewardDetails[index]" class="mt-3">
                      <!-- Controls for pagination -->
                      <div class="row mb-3">
                        <div class="col-md-6">
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">Show</span>
                            <select v-model="rewardDisplayLimits[index]" class="form-select">
                              <option value="10">10</option>
                              <option value="20">20</option>
                              <option value="50">50</option>
                              <option value="100">100</option>
                              <option :value="distribution.neuronRewards.length">All ({{ distribution.neuronRewards.length }})</option>
                            </select>
                            <span class="input-group-text">entries</span>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <input 
                            v-model="rewardSearchTerms[index]" 
                            type="text" 
                            class="form-control form-control-sm" 
                            placeholder="Search by Neuron ID..."
                          >
                        </div>
                      </div>

                      <!-- Neuron Rewards Table -->
                      <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                        <table class="table table-dark table-striped table-sm">
                          <thead class="sticky-top">
                            <tr>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'neuronId')">
                                Neuron ID <span class="sort-icon">{{ getSortIcon(index, 'neuronId') }}</span>
                              </th>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'performanceScore')">
                                Performance Score <span class="sort-icon">{{ getSortIcon(index, 'performanceScore') }}</span>
                              </th>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'votingPower')">
                                Voting Power <span class="sort-icon">{{ getSortIcon(index, 'votingPower') }}</span>
                              </th>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'rewardScore')">
                                Reward Score <span class="sort-icon">{{ getSortIcon(index, 'rewardScore') }}</span>
                              </th>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'rewardAmount')">
                                Reward Amount <span class="sort-icon">{{ getSortIcon(index, 'rewardAmount') }}</span>
                              </th>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'percentage')">
                                % of Total <span class="sort-icon">{{ getSortIcon(index, 'percentage') }}</span>
                              </th>
                              <th class="sortable-header" @click="sortNeuronRewards(index, 'makers')">
                                Makers <span class="sort-icon">{{ getSortIcon(index, 'makers') }}</span>
                              </th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(reward, rewardIndex) in getFilteredRewards(distribution, index)" :key="reward.neuronId">
                              <td class="font-monospace">
                                <span class="badge bg-secondary me-2">{{ rewardIndex + 1 }}</span>
                                {{ formatNeuronId(reward.neuronId) }}
                              </td>
                              <td>
                                <span :class="getPerformanceScoreClass(reward.performanceScore)">
                                  {{ reward.performanceScore.toFixed(6) }}
                                </span>
                              </td>
                              <td>
                                <span class="badge bg-info">
                                  {{ formatVotingPower(reward.votingPower) }}
                                </span>
                              </td>
                              <td>{{ reward.rewardScore.toFixed(6) }}</td>
                              <td class="text-success">
                                <strong>{{ formatTacoAmountShort(reward.rewardAmount) }}</strong>
                              </td>
                              <td>
                                <span class="badge bg-warning text-dark">
                                  {{ calculateRewardPercentage(reward.rewardAmount, distribution.totalRewardPot) }}%
                                </span>
                              </td>
                              <td>
                                <div v-if="getMakersFromReward(reward).length > 0" class="makers-list">
                                  <span 
                                    v-for="(maker, makerIndex) in getMakersFromReward(reward)" 
                                    :key="maker"
                                    class="badge bg-primary me-1 mb-1"
                                    :title="maker"
                                  >
                                    {{ formatPrincipal(maker) }}
                                    <small v-if="makerIndex === 0" class="ms-1" title="First/Oldest allocation maker">📅</small>
                                  </span>
                                </div>
                                <div v-else class="text-muted">
                                  <small>No makers</small>
                                </div>
                              </td>
                              <td>
                                <button 
                                  class="btn btn-outline-success btn-xs" 
                                  @click="viewNeuronPerformance(reward.neuronId, distribution)"
                                  title="View Performance Details"
                                >
                                  👁️ Details
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- Summary Statistics -->
                      <div class="row mt-3">
                        <div class="col-md-3">
                          <div class="card bg-dark border-info">
                            <div class="card-body text-center py-2">
                              <small class="text-muted">Total Neurons</small>
                              <div class="h6 mb-0 text-info">{{ distribution.neuronRewards.length }}</div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-3">
                          <div class="card bg-dark border-success">
                            <div class="card-body text-center py-2">
                              <small class="text-muted">Avg Performance</small>
                              <div class="h6 mb-0 text-success">{{ getAveragePerformance(distribution.neuronRewards).toFixed(4) }}</div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-3">
                          <div class="card bg-dark border-warning">
                            <div class="card-body text-center py-2">
                              <small class="text-muted">Total Voting Power</small>
                              <div class="h6 mb-0 text-warning">{{ getTotalVotingPower(distribution.neuronRewards).toLocaleString() }}</div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-3">
                          <div class="card bg-dark border-primary">
                            <div class="card-body text-center py-2">
                              <small class="text-muted">Rewards Distributed</small>
                              <div class="h6 mb-0 text-primary">{{ adminStore.formatTacoPrecise(distribution.actualDistributed || 0) }} TACO</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <small class="text-muted mt-2 d-block">
                        Showing {{ getFilteredRewards(distribution, index).length }} of {{ distribution.neuronRewards.length }} neurons
                        {{ rewardSearchTerms[index] ? ` (filtered by "${rewardSearchTerms[index]}")` : '' }}
                      </small>

                      <!-- Failed Neurons Section -->
                      <div v-if="distribution.failedNeurons && distribution.failedNeurons.length > 0" class="mt-4">
                        <h6 class="text-warning">⚠️ Failed Neurons ({{ distribution.failedNeurons.length }})</h6>
                        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                          <table class="table table-dark table-striped table-sm">
                            <thead class="sticky-top">
                              <tr>
                                <th>Neuron ID</th>
                                <th>Error Message</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(failedNeuron, failedIndex) in distribution.failedNeurons" :key="failedNeuron.neuronId">
                                <td class="font-monospace">
                                  <span class="badge bg-danger me-2">{{ failedIndex + 1 }}</span>
                                  {{ formatNeuronId(failedNeuron.neuronId) }}
                                </td>
                                <td class="text-warning">
                                  <small>{{ failedNeuron.errorMessage }}</small>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Error details for failed distributions -->
                  <div v-if="distribution.status.Failed" class="mt-3">
                    <div class="alert alert-danger">
                      <strong>Error:</strong> {{ distribution.status.Failed }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- Load More Button -->
              <div v-if="historyHasMore" class="text-center mt-4">
                <button 
                  class="btn btn-outline-info" 
                  @click="loadMoreHistory"
                  :disabled="isLoadingMore"
                >
                  <span v-if="isLoadingMore" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  {{ isLoadingMore ? 'Loading...' : '📜 Load More' }}
                </button>
                <p class="text-muted mt-2 mb-0">
                  <small>Showing {{ distributionHistory.length }} of {{ historyTotal }} distributions</small>
                </p>
              </div>
              
              <div v-else-if="!isLoading && distributionHistory.length === 0" class="text-center text-muted">
                <p>No distribution history available</p>
              </div>
              <div v-if="isLoading && currentAction === 'refresh'" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- GNSF Proposal Dialog for Non-Admin Users -->
  <GNSFProposalDialog
    :show="showProposalDialog"
    :function-name="proposalFunctionName"
    :reason-placeholder="proposalReasonPlaceholder"
    :context-params="proposalContextParams"
    @close="showProposalDialog = false"
    @success="handleProposalSuccess"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import { useAdminStore } from '../stores/admin.store'
import { useAdminCheck } from '../composables/useAdminCheck'
import TacoTitle from '../components/misc/TacoTitle.vue'
import GNSFProposalDialog from '../components/proposals/GNSFProposalDialog.vue'
import type { Rewards } from '../../../declarations/rewards/rewards.did'
import { workerBridge } from '../stores/worker-bridge'
import { deserializeFromTransfer } from '../workers/shared/fetch-functions'

const router = useRouter()
const tacoStore = useTacoStore()
const adminStore = useAdminStore()

// Destructure store refs and methods for reward penalties
const { fetchedRewardPenalties } = storeToRefs(tacoStore)
const { fetchRewardPenalties, adminAddRewardPenalty, adminRemoveRewardPenalty } = tacoStore

// Computed for reward penalties
const rewardPenalties = computed(() => fetchedRewardPenalties.value || [])

// Admin check
const { isAdmin, checking, checkAdminStatus } = useAdminCheck()

// Worker unsubscribers
const workerUnsubscribers: Array<() => void> = []

// GNSF Proposal Dialog state
const showProposalDialog = ref(false)
const proposalFunctionName = ref('')
const proposalReasonPlaceholder = ref('')
const proposalContextParams = ref<any>({})

// Loading state
const isLoading = ref(false)
const currentAction = ref('')
const errorMessage = ref('')
const successMessage = ref('')

// Distribution state
const distributionStatus = ref<any>(null)
const configuration = ref<any>(null)
const distributionHistory = ref<any[]>([])
const totalDistributed = ref(0)
const tacoBalance = ref(0)
const currentNeuronBalances = ref(0)
const availableBalance = ref(0)

// Pagination state for distribution history
const historyPageSize = 5
const historyOffset = ref(0)
const historyTotal = ref(0)
const historyHasMore = ref(false)
const isLoadingMore = ref(false)

// UI state
const showRewardDetails = ref<Record<number, boolean>>({})
const rewardDisplayLimits = ref<Record<number, number>>({})
const rewardSearchTerms = ref<Record<number, string>>({})

// Form inputs
const newRewardPot = ref(1000)
const newDistributionPeriod = ref(7)
const newPerformanceScorePower = ref(1.0)
const newVotingPowerPower = ref(1.0)
const customStartTime = ref('')
const customEndTime = ref('')
const selectedPriceType = ref('USD')

// Reward penalties state
const isLoadingPenalties = ref(false)
const isAddingPenalty = ref(false)
const removingNeuronId = ref<string | null>(null)
const newPenaltyNeuronId = ref('')
const newPenaltyMultiplier = ref<number>(50)
const penaltyErrorMessage = ref('')
const penaltySuccessMessage = ref('')

// Sorting state
const sortColumns = ref<Record<number, string | null>>({})
const sortDirections = ref<Record<number, 'asc' | 'desc'>>({})


// Refresh interval
let refreshInterval: any = null

// Computed properties
const distributionInProgress = computed(() => distributionStatus.value?.inProgress || false)

const timerRunning = computed(() => {
  if (!configuration.value?.nextScheduledDistribution) return false
  const scheduledTimeNS = Number(configuration.value.nextScheduledDistribution)
  const nowNS = Date.now() * 1_000_000
  return scheduledTimeNS > nowNS
})

const shouldShowStartButton = computed(() => !timerRunning.value)
const shouldShowStopButton = computed(() => timerRunning.value)

const isValidCustomInput = computed(() => {
  if (!customStartTime.value || !customEndTime.value) return false
  const startDate = new Date(customStartTime.value)
  const endDate = new Date(customEndTime.value)
  return startDate < endDate
})

// Helper functions
const getRewardsActor = async (): Promise<Rewards> => {
  // Use store's cached actor for proper identity management
  return await tacoStore.createRewardsActor() as Rewards
}

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const formatError = (error: any) => {
  if (typeof error === 'string') return error
  if (error.SystemError) return `System Error: ${error.SystemError}`
  if (error.NotAuthorized) return 'Not authorized to perform this action'
  if (error.DistributionInProgress) return 'Distribution already in progress'
  if (error.InvalidTimeRange) return 'Invalid time range: start time must be before end time'
  if (error.InsufficientRewardPot) return 'Insufficient reward pot'
  if (error.NeuronNotFound) return 'Neuron not found'
  if (error.AllocationDataMissing) return 'Allocation data missing for this neuron'
  if (error.PriceDataMissing) {
    return `Price data missing for token ${error.PriceDataMissing.token} at timestamp ${error.PriceDataMissing.timestamp}`
  }
  return `Unknown error: ${JSON.stringify(error)}`
}

const formatTimestamp = (timestamp: any) => {
  try {
    if (!timestamp || timestamp === 0) return 'Never'
    const timestampNum = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp)
    const date = new Date(timestampNum / 1_000_000)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleString()
  } catch (error) {
    return 'Format Error'
  }
}

const formatNeuronId = (neuronId: any) => {
  try {
    if (Array.isArray(neuronId)) {
      return neuronId.map(b => b.toString(16).padStart(2, '0')).join('')
    } else if (neuronId && neuronId._arr) {
      return Array.from(neuronId._arr as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('')
    } else if (neuronId && typeof neuronId === 'object' && neuronId.constructor === Uint8Array) {
      return Array.from(neuronId).map((b: number) => b.toString(16).padStart(2, '0')).join('')
    } else if (typeof neuronId === 'string') {
      return neuronId
    }
    return 'Invalid format'
  } catch (error) {
    return 'Format Error'
  }
}

const formatVotingPower = (votingPower: any) => {
  const vp = Number(votingPower)
  if (vp >= 1000000000) return (vp / 1000000000).toFixed(1) + 'B VP'
  if (vp >= 1000000) return (vp / 1000000).toFixed(1) + 'M VP'
  if (vp >= 1000) return (vp / 1000).toFixed(1) + 'K VP'
  return vp.toLocaleString() + ' VP'
}

const formatPrincipal = (principal: any) => {
  try {
    const principalStr = typeof principal === 'string' ? principal : principal.toString()
    return adminStore.formatPrincipal(principalStr)
  } catch (error) {
    return 'Invalid Principal'
  }
}

const formatTacoAmountShort = (satoshis: any) => adminStore.formatTacoPrecise(satoshis)

const calculateRewardPercentage = (rewardAmount: any, totalRewardPot: any) => {
  try {
    const rewardBI = typeof rewardAmount === 'bigint' ? rewardAmount : BigInt(rewardAmount || 0)
    const totalBI = typeof totalRewardPot === 'bigint' ? totalRewardPot : BigInt(totalRewardPot || 1)
    const rewardTaco = adminStore.tacoSatoshisToTokens(rewardBI)
    const totalTaco = Number(totalBI) * 1
    return adminStore.calculatePercentage(rewardTaco, totalTaco)
  } catch (error) {
    return '0.00'
  }
}

const getStatusText = (status: any) => {
  if (!status) return 'Unknown'
  if (status.InProgress || status['InProgress']) return 'In Progress'
  if (status.Completed || status['Completed']) return 'Completed'
  if (status.PartiallyCompleted || status['PartiallyCompleted']) {
    const partial = status.PartiallyCompleted || status['PartiallyCompleted']
    return `Partially Completed (${partial.successfulNeurons}/${partial.successfulNeurons + partial.failedNeurons})`
  }
  if (status.Failed || status['Failed']) return 'Failed'
  if (typeof status === 'string') return status.charAt(0).toUpperCase() + status.slice(1)
  const keys = Object.keys(status)
  if (keys.length === 1) {
    const key = keys[0]
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }
  return 'Unknown'
}

const getStatusBadgeClass = (status: any) => {
  if (!status) return 'bg-secondary'
  if (status.InProgress || status['InProgress']) return 'bg-warning'
  if (status.Completed || status['Completed']) return 'bg-success'
  if (status.PartiallyCompleted || status['PartiallyCompleted']) return 'bg-warning'
  if (status.Failed || status['Failed']) return 'bg-danger'
  return 'bg-secondary'
}

const isInProgress = (status: any) => status && (status.InProgress || status['InProgress'])

const getProgressPercent = (status: any) => {
  if (!status) return 0
  const inProgress = status.InProgress || status['InProgress']
  if (!inProgress) return 0
  const current = Number(inProgress.currentNeuron || 0)
  const total = Number(inProgress.totalNeurons || 1)
  return (current / total) * 100
}

const getPerformanceScoreClass = (score: number) => {
  if (score > 1.1) return 'text-success fw-bold'
  if (score > 1.0) return 'text-success'
  if (score > 0.9) return 'text-warning'
  return 'text-danger'
}

const getAveragePerformance = (rewards: any[]) => {
  if (!rewards || rewards.length === 0) return 0
  const total = rewards.reduce((sum, reward) => sum + reward.performanceScore, 0)
  return total / rewards.length
}

const getTotalVotingPower = (rewards: any[]) => {
  if (!rewards || rewards.length === 0) return 0
  return rewards.reduce((sum, reward) => sum + Number(reward.votingPower), 0)
}

const getMakersFromReward = (reward: any) => {
  try {
    if (!reward.checkpoints || !Array.isArray(reward.checkpoints)) return []
    const makers: any[] = []
    const seenMakers = new Set()
    for (const checkpoint of reward.checkpoints) {
      if (checkpoint.maker && !seenMakers.has(checkpoint.maker.toString())) {
        makers.push(checkpoint.maker)
        seenMakers.add(checkpoint.maker.toString())
      }
    }
    return makers
  } catch (error) {
    return []
  }
}

const neuronIdToFullHex = (neuronId: any) => {
  try {
    if (Array.isArray(neuronId)) {
      return neuronId.map(b => b.toString(16).padStart(2, '0')).join('')
    } else if (typeof neuronId === 'string') {
      return neuronId.replace(/^0x/, '')
    } else if (neuronId && neuronId._arr) {
      return Array.from(neuronId._arr as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('')
    } else if (neuronId && typeof neuronId === 'object' && neuronId.constructor === Uint8Array) {
      return Array.from(neuronId).map((b: number) => b.toString(16).padStart(2, '0')).join('')
    }
    throw new Error('Unknown neuron ID format')
  } catch (error) {
    throw error
  }
}

// Data loading functions
const loadConfigurationAndStatus = async () => {
  try {
    const actor = await getRewardsActor()
    const config = await actor.getConfiguration()

    // Update configuration
    configuration.value = config
    newRewardPot.value = Number(config.periodicRewardPot)
    newDistributionPeriod.value = Math.round(Number(config.distributionPeriodNS) / (24 * 60 * 60 * 1_000_000_000))
    newPerformanceScorePower.value = config.performanceScorePower
    newVotingPowerPower.value = config.votingPowerPower

    // Update distribution status from same config
    distributionStatus.value = {
      lastDistributionTime: config.lastDistributionTime,
      totalDistributions: config.totalDistributions,
      distributionEnabled: config.distributionEnabled,
      currentDistributionId: null,
      inProgress: false
    }
  } catch (error) {
    console.error('Error loading configuration:', error)
    throw error
  }
}

const loadDistributionHistory = async (reset: boolean = true) => {
  try {
    const actor = await getRewardsActor()
    
    if (reset) {
      historyOffset.value = 0
      distributionHistory.value = []
    }
    
    const result = await actor.getDistributionHistory(BigInt(historyOffset.value), BigInt(historyPageSize))
    
    if (reset) {
      distributionHistory.value = result.records
    } else {
      // Append to existing history
      distributionHistory.value = [...distributionHistory.value, ...result.records]
    }
    
    historyTotal.value = Number(result.total)
    historyHasMore.value = result.hasMore
    historyOffset.value += result.records.length
  } catch (error) {
    console.error('Error loading distribution history:', error)
    throw error
  }
}

const loadMoreHistory = async () => {
  if (isLoadingMore.value || !historyHasMore.value) return
  
  isLoadingMore.value = true
  try {
    await loadDistributionHistory(false)
  } catch (error) {
    console.error('Error loading more history:', error)
    errorMessage.value = 'Failed to load more distribution history'
  } finally {
    isLoadingMore.value = false
  }
}

const loadTotalDistributed = async () => {
  try {
    const actor = await getRewardsActor()
    totalDistributed.value = Number(await actor.getTotalDistributed())
  } catch (error) {
    console.error('Error loading total distributed:', error)
  }
}

const loadTacoBalance = async () => {
  try {
    const actor = await getRewardsActor()
    tacoBalance.value = Number(await actor.getTacoBalance())
  } catch (error) {
    console.error('Error loading TACO balance:', error)
  }
}

const loadCurrentNeuronBalances = async () => {
  try {
    const actor = await getRewardsActor()
    currentNeuronBalances.value = Number(await actor.getCurrentTotalNeuronBalances())
  } catch (error) {
    console.error('Error loading current neuron balances:', error)
  }
}

const loadAvailableBalance = async () => {
  try {
    const actor = await getRewardsActor()
    availableBalance.value = Number(await actor.getAvailableBalance())
  } catch (error) {
    console.error('Error loading available balance:', error)
  }
}

// Helper function to convert Uint8Array to hex string
const uint8ArrayToHex = (arr: Uint8Array | number[]): string => {
  const bytes = arr instanceof Uint8Array ? arr : new Uint8Array(arr)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Track if initial load is in progress to prevent double-loading
let isInitialLoading = false

const loadData = async () => {
  // Prevent concurrent data loads
  if (isInitialLoading) {
    return
  }
  isInitialLoading = true

  try {
    await Promise.all([
      loadConfigurationAndStatus(),
      loadDistributionHistory(true) // Reset pagination when loading data
    ])
  } catch (error) {
    console.error('Error loading data:', error)
    errorMessage.value = 'Failed to load distribution data'
  } finally {
    isInitialLoading = false
  }
}

const setDefaultCustomTimes = () => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  customEndTime.value = now.toISOString().slice(0, 16)
  customStartTime.value = weekAgo.toISOString().slice(0, 16)
}

// Admin action functions (with admin/non-admin pattern)
const triggerDistribution = async () => {
  await checkAdminStatus()
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    currentAction.value = 'trigger'
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.triggerDistribution()
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadData()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error triggering distribution:', error)
      errorMessage.value = 'Failed to trigger distribution: ' + error.message
    } finally {
      isLoading.value = false
      currentAction.value = ''
    }
  } else {
    proposalFunctionName.value = 'triggerDistribution'
    proposalReasonPlaceholder.value = 'Please explain why a rewards distribution should be triggered now...'
    proposalContextParams.value = {}
    showProposalDialog.value = true
  }
}

const startDistributionTimer = async () => {
  await checkAdminStatus()
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    currentAction.value = 'start'
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.startDistributionTimer()
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadConfigurationAndStatus()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error starting distribution timer:', error)
      errorMessage.value = 'Failed to start distribution timer: ' + error.message
    } finally {
      isLoading.value = false
      currentAction.value = ''
    }
  } else {
    proposalFunctionName.value = 'startDistributionTimer'
    proposalReasonPlaceholder.value = 'Please explain why the automatic distribution timer should be started...'
    proposalContextParams.value = {}
    showProposalDialog.value = true
  }
}

const stopDistributionTimer = async () => {
  await checkAdminStatus()
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    currentAction.value = 'stop'
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.stopDistributionTimer()
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadConfigurationAndStatus()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error stopping distribution timer:', error)
      errorMessage.value = 'Failed to stop distribution timer: ' + error.message
    } finally {
      isLoading.value = false
      currentAction.value = ''
    }
  } else {
    proposalFunctionName.value = 'stopDistributionTimer'
    proposalReasonPlaceholder.value = 'Please explain why the automatic distribution timer should be stopped...'
    proposalContextParams.value = {}
    showProposalDialog.value = true
  }
}

const triggerCustomDistribution = async () => {
  await checkAdminStatus()
  
  const startDate = new Date(customStartTime.value)
  const endDate = new Date(customEndTime.value)
  const startTimeNS = BigInt(startDate.getTime() * 1_000_000)
  const endTimeNS = BigInt(endDate.getTime() * 1_000_000)
  const priceType = selectedPriceType.value === 'USD' ? { USD: null } : { ICP: null }
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    currentAction.value = 'triggerCustom'
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.triggerDistributionCustom(startTimeNS, endTimeNS, priceType)
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadData()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error triggering custom distribution:', error)
      errorMessage.value = 'Failed to trigger custom distribution: ' + error.message
    } finally {
      isLoading.value = false
      currentAction.value = ''
    }
  } else {
    proposalFunctionName.value = 'triggerDistributionCustom'
    proposalReasonPlaceholder.value = `Please explain why a custom distribution from ${startDate.toLocaleString()} to ${endDate.toLocaleString()} should be triggered...`
    proposalContextParams.value = {
      startTimeNS,
      endTimeNS,
      priceType
    }
    showProposalDialog.value = true
  }
}

const updateRewardPot = async () => {
  await checkAdminStatus()
  
  const newValue = newRewardPot.value
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.setPeriodicRewardPot(BigInt(newValue))
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadConfigurationAndStatus()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error updating reward pot:', error)
      errorMessage.value = 'Failed to update reward pot: ' + error.message
    } finally {
      isLoading.value = false
    }
  } else {
    proposalFunctionName.value = 'setPeriodicRewardPot'
    proposalReasonPlaceholder.value = `Please explain why the periodic reward pot should be changed to ${newValue}...`
    proposalContextParams.value = {
      rewardPot: newValue
    }
    showProposalDialog.value = true
  }
}

const updateDistributionPeriod = async () => {
  await checkAdminStatus()
  
  const periodDays = newDistributionPeriod.value
  const periodNS = BigInt(Math.round(periodDays * 24 * 60 * 60 * 1_000_000_000))
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.setDistributionPeriod(periodNS)
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadConfigurationAndStatus()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error updating distribution period:', error)
      errorMessage.value = 'Failed to update distribution period: ' + error.message
    } finally {
      isLoading.value = false
    }
  } else {
    proposalFunctionName.value = 'setDistributionPeriod'
    proposalReasonPlaceholder.value = `Please explain why the distribution period should be changed to ${periodDays} days...`
    proposalContextParams.value = {
      periodNS
    }
    showProposalDialog.value = true
  }
}

const updatePerformanceScorePower = async () => {
  await checkAdminStatus()
  
  const newValue = newPerformanceScorePower.value
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.setPerformanceScorePower(newValue)
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadConfigurationAndStatus()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error updating performance score power:', error)
      errorMessage.value = 'Failed to update performance score power: ' + error.message
    } finally {
      isLoading.value = false
    }
  } else {
    proposalFunctionName.value = 'setPerformanceScorePower'
    proposalReasonPlaceholder.value = `Please explain why the performance score power should be changed to ${newValue}...`
    proposalContextParams.value = {
      power: newValue
    }
    showProposalDialog.value = true
  }
}

const updateVotingPowerPower = async () => {
  await checkAdminStatus()
  
  const newValue = newVotingPowerPower.value
  
  if (isAdmin.value) {
    clearMessages()
    isLoading.value = true
    
    try {
      const actor = await getRewardsActor()
      const result = await actor.setVotingPowerPower(newValue)
      
      if ('ok' in result) {
        successMessage.value = result.ok
        await loadConfigurationAndStatus()
      } else {
        errorMessage.value = formatError(result.err)
      }
    } catch (error: any) {
      console.error('Error updating voting power power:', error)
      errorMessage.value = 'Failed to update voting power power: ' + error.message
    } finally {
      isLoading.value = false
    }
  } else {
    proposalFunctionName.value = 'setVotingPowerPower'
    proposalReasonPlaceholder.value = `Please explain why the voting power power should be changed to ${newValue}...`
    proposalContextParams.value = {
      power: newValue
    }
    showProposalDialog.value = true
  }
}

// Reward penalty functions
const refreshRewardPenalties = async () => {
  isLoadingPenalties.value = true
  penaltyErrorMessage.value = ''
  try {
    await fetchRewardPenalties()
  } catch (error: any) {
    penaltyErrorMessage.value = 'Failed to load reward penalties: ' + (error.message || error)
  } finally {
    isLoadingPenalties.value = false
  }
}

const addPenalty = async () => {
  if (!newPenaltyNeuronId.value.trim() || !newPenaltyMultiplier.value) return

  isAddingPenalty.value = true
  penaltyErrorMessage.value = ''
  penaltySuccessMessage.value = ''

  try {
    // Clean the hex input (remove spaces, 0x prefix if any)
    const cleanHex = newPenaltyNeuronId.value.trim().replace(/^0x/, '').replace(/\s/g, '')

    await adminAddRewardPenalty(cleanHex, newPenaltyMultiplier.value)
    penaltySuccessMessage.value = `Successfully added penalty (${newPenaltyMultiplier.value}% rewards) for neuron`

    // Clear form
    newPenaltyNeuronId.value = ''
    newPenaltyMultiplier.value = 50

    // Auto-hide success message after 5 seconds
    setTimeout(() => { penaltySuccessMessage.value = '' }, 5000)
  } catch (error: any) {
    penaltyErrorMessage.value = 'Failed to add penalty: ' + (error.message || error)
  } finally {
    isAddingPenalty.value = false
  }
}

const removePenalty = async (neuronIdHex: string) => {
  removingNeuronId.value = neuronIdHex
  penaltyErrorMessage.value = ''
  penaltySuccessMessage.value = ''

  try {
    await adminRemoveRewardPenalty(neuronIdHex)
    penaltySuccessMessage.value = 'Successfully removed penalty from neuron'

    // Auto-hide success message after 5 seconds
    setTimeout(() => { penaltySuccessMessage.value = '' }, 5000)
  } catch (error: any) {
    penaltyErrorMessage.value = 'Failed to remove penalty: ' + (error.message || error)
  } finally {
    removingNeuronId.value = null
  }
}

// Non-admin functions (data fetching only)
const refreshHistory = async () => {
  clearMessages()
  isLoading.value = true
  currentAction.value = 'refresh'

  try {
    // Force refresh from worker (bypasses cache)
    await Promise.all([
      workerBridge.fetch('rewardsConfiguration', true),
      workerBridge.fetch('distributionHistory', true)
    ])
  } catch (error) {
    console.error('Error refreshing data:', error)
    errorMessage.value = 'Failed to refresh distribution data'
  } finally {
    isLoading.value = false
    currentAction.value = ''
  }
}

// UI functions
const toggleRewardDetails = (index: number) => {
  showRewardDetails.value = {
    ...showRewardDetails.value,
    [index]: !showRewardDetails.value[index]
  }
  
  if (!rewardDisplayLimits.value[index]) {
    rewardDisplayLimits.value = { ...rewardDisplayLimits.value, [index]: 20 }
  }
  if (!rewardSearchTerms.value[index]) {
    rewardSearchTerms.value = { ...rewardSearchTerms.value, [index]: '' }
  }
}

const getFilteredRewards = (distribution: any, index: number) => {
  if (!distribution.neuronRewards) return []
  
  let rewards = [...distribution.neuronRewards]
  
  const searchTerm = rewardSearchTerms.value[index] || ''
  if (searchTerm) {
    rewards = rewards.filter(reward =>
      formatNeuronId(reward.neuronId).toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
  
  const sortColumn = sortColumns.value[index]
  const sortDirection = sortDirections.value[index] || 'desc'
  if (sortColumn) {
    const rewardsWithTotal = rewards.map(reward => ({
      ...reward,
      totalRewardPot: distribution.totalRewardPot
    }))
    rewards = sortRewardsArray(rewardsWithTotal, sortColumn, sortDirection)
  }
  
  const limit = rewardDisplayLimits.value[index] || 20
  return rewards.slice(0, Number(limit))
}

const sortNeuronRewards = (distributionIndex: number, column: string) => {
  if (!sortColumns.value[distributionIndex]) {
    sortColumns.value = { ...sortColumns.value, [distributionIndex]: null }
    sortDirections.value = { ...sortDirections.value, [distributionIndex]: 'desc' }
  }

  if (sortColumns.value[distributionIndex] === column) {
    sortDirections.value = {
      ...sortDirections.value,
      [distributionIndex]: sortDirections.value[distributionIndex] === 'desc' ? 'asc' : 'desc'
    }
  } else {
    sortColumns.value = { ...sortColumns.value, [distributionIndex]: column }
    sortDirections.value = { ...sortDirections.value, [distributionIndex]: 'desc' }
  }
}

const getSortIcon = (distributionIndex: number, column: string) => {
  if (sortColumns.value[distributionIndex] !== column) return '↕️'
  return sortDirections.value[distributionIndex] === 'desc' ? '🔽' : '🔼'
}

const sortRewardsArray = (rewards: any[], column: string, direction: 'asc' | 'desc') => {
  const sorted = [...rewards]
  
  sorted.sort((a, b) => {
    let aVal: any, bVal: any
    
    switch (column) {
      case 'neuronId':
        aVal = formatNeuronId(a.neuronId).toLowerCase()
        bVal = formatNeuronId(b.neuronId).toLowerCase()
        break
      case 'performanceScore':
        aVal = Number(a.performanceScore)
        bVal = Number(b.performanceScore)
        break
      case 'votingPower':
        aVal = Number(a.votingPower)
        bVal = Number(b.votingPower)
        break
      case 'rewardScore':
        aVal = Number(a.rewardScore)
        bVal = Number(b.rewardScore)
        break
      case 'rewardAmount':
        aVal = Number(a.rewardAmount)
        bVal = Number(b.rewardAmount)
        break
      case 'percentage':
        aVal = Number(a.rewardAmount) / Number(a.totalRewardPot || 1)
        bVal = Number(b.rewardAmount) / Number(b.totalRewardPot || 1)
        break
      case 'makers':
        aVal = getMakersFromReward(a).length
        bVal = getMakersFromReward(b).length
        break
      default:
        return 0
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }
    
    return direction === 'desc' ? bVal - aVal : aVal - bVal
  })
  
  return sorted
}

const viewNeuronPerformance = (neuronId: any, distribution: any) => {
  try {
    const fullHexId = neuronIdToFullHex(neuronId)
    const startTimeNS = distribution.startTime
    const endTimeNS = distribution.endTime
    const priceType = distribution.priceType || 'USD'
    
    router.push({
      path: '/admin/rewards',
      query: {
        neuronId: fullHexId,
        startTime: startTimeNS.toString(),
        endTime: endTimeNS.toString(),
        priceType: priceType
      }
    })
  } catch (error) {
    console.error('Error navigating to neuron performance:', error)
    errorMessage.value = 'Failed to navigate to neuron performance details'
  }
}

// Handle successful proposal submission
const handleProposalSuccess = async () => {
  showProposalDialog.value = false
  proposalFunctionName.value = ''
  proposalReasonPlaceholder.value = ''
  proposalContextParams.value = {}
  console.log('AdminDistributionsView: Proposal submitted successfully')
}

// Lifecycle hooks
onMounted(async () => {
  setDefaultCustomTimes()


  // Check admin status
  checkAdminStatus()

  // Subscribe to worker data for configuration
  workerUnsubscribers.push(
    workerBridge.subscribe('rewardsConfiguration', (data: unknown) => {
      if (data && typeof data === 'object') {
        const configData = deserializeFromTransfer(data) as any

        // Update configuration
        configuration.value = configData
        newRewardPot.value = configData.periodicRewardPot
        newDistributionPeriod.value = Math.round(Number(configData.distributionPeriodNS) / (24 * 60 * 60 * 1_000_000_000))
        newPerformanceScorePower.value = configData.performanceScorePower
        newVotingPowerPower.value = configData.votingPowerPower

        // Update distribution status
        distributionStatus.value = {
          lastDistributionTime: configData.lastDistributionTime,
          totalDistributions: configData.totalDistributions,
          distributionEnabled: configData.distributionEnabled,
          currentDistributionId: null,
          inProgress: false
        }

        // Update balances from combined config
        totalDistributed.value = configData.totalDistributed
        tacoBalance.value = configData.tacoBalance
        currentNeuronBalances.value = configData.currentNeuronBalances
        availableBalance.value = configData.availableBalance
      }
    })
  )

  // Subscribe to worker data for distribution history
  workerUnsubscribers.push(
    workerBridge.subscribe('distributionHistory', (data: unknown) => {
      if (data && typeof data === 'object') {
        const historyData = deserializeFromTransfer(data) as any
        distributionHistory.value = historyData.records || []
        historyTotal.value = Number(historyData.total || 0)
        historyHasMore.value = historyData.hasMore || false
        historyOffset.value = historyData.records?.length || 0
      }
    })
  )

  // Fetch data from worker (will use cache if available)
  workerBridge.fetch('rewardsConfiguration')
  workerBridge.fetch('distributionHistory')

  // Load reward penalties
  refreshRewardPenalties()
})

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  // Clean up worker subscriptions
  workerUnsubscribers.forEach(unsub => unsub())
})

</script>

<style scoped>
.distribution-record {
  border-left: 3px solid #0d6efd;
  padding-left: 1rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
}

.progress {
  height: 8px;
}

.table th {
  font-size: 0.9em;
  font-weight: 600;
  background-color: #2d3748 !important;
}

.table th.sticky-top {
  background-color: #2d3748 !important;
  z-index: 10;
}

.table td {
  font-size: 0.85em;
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.font-monospace {
  font-family: monospace !important;
}

.alert {
  font-size: 0.9em;
}

.table-responsive {
  border-radius: 6px;
  border: 1px solid #444;
}

.badge {
  font-size: 0.7rem;
}

.card.bg-dark {
  background-color: #1a202c !important;
}

.card.border-info { border-color: #3182ce !important; }
.card.border-success { border-color: #38a169 !important; }
.card.border-warning { border-color: #d69e2e !important; }
.card.border-primary { border-color: #3182ce !important; }

.input-group-text {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.form-select, .form-control {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.form-select:focus, .form-control:focus {
  background-color: #2d3748;
  border-color: #63b3ed;
  color: #e2e8f0;
  box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25);
}

.text-muted {
  color: #a0aec0 !important;
}

.card-body small.text-muted {
  color: #a0aec0 !important;
}

.card .text-muted {
  color: #9ca3af !important;
}

.card .h6 {
  color: #f7fafc !important;
}

small.text-muted {
  color: #cbd5e0 !important;
}

.mt-2.d-block.text-muted {
  color: #a0aec0 !important;
}

.badge.bg-secondary {
  background-color: #4a5568 !important;
}

.text-success.fw-bold {
  color: #38a169 !important;
  font-weight: 700 !important;
}

.text-success {
  color: #68d391 !important;
}

.text-warning {
  color: #f6e05e !important;
}

.text-danger {
  color: #fc8181 !important;
}

.btn-xs {
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
}

.makers-list {
  max-width: 200px;
}

.makers-list .badge {
  font-size: 0.6rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable-header:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sort-icon {
  font-size: 0.8em;
  margin-left: 0.25rem;
  opacity: 0.7;
}

.sortable-header:hover .sort-icon {
  opacity: 1;
}
</style>
