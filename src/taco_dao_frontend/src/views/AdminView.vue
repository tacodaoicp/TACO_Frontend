<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🔑" title="Admin Panel" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Quick Navigation -->
          <div class="mb-4">
            <div class="d-flex gap-3 flex-wrap">
              <router-link to="/admin/archives" class="btn btn-dark">
                📦 Archive Management
              </router-link>
              <router-link to="/admin/trade" class="btn btn-info">
                📈 View Trading Logs
              </router-link>
              <router-link to="/admin/price" class="btn btn-warning">
                🚨 Price Failsafe Admin
              </router-link>
              <router-link to="/admin/pricehistory" class="btn btn-secondary">
                📊 Price History
              </router-link>
              <router-link to="/admin/neuron" class="btn btn-success">
                🧠 Neuron Snapshot Admin
              </router-link>
              <router-link to="/admin/votes" class="btn btn-primary">
                🗳️ Vote History Admin
              </router-link>
              <router-link to="/admin/rewards" class="btn btn-success">
                🏆 Neuron Performance Rewards
              </router-link>
              <router-link to="/admin/rewards/balances" class="btn btn-outline-success">
                💰 Reward Balances
              </router-link>
              <router-link to="/admin/distributions" class="btn btn-outline-primary">
                🎯 Distribution Management
              </router-link>
              <router-link to="/admin/alarm" class="btn btn-outline-danger">
                🚨 Alarm
              </router-link>
              <router-link to="/admin/nns" class="btn btn-outline-info">
                🤖 NNS Automation
              </router-link>
            </div>
          </div>
          
          <!-- Timer Health Dashboard -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Timer Health Dashboard</h3>
              <button class="btn btn-primary" @click="refreshTimerStatus">
                Refresh Status
              </button>
            </div>
            
            <div class="card-body">
              <!-- Snapshot Timer Status -->
              <div class="timer-section mb-4">
                <h4>Neuron Snapshot Timer</h4>
                <div class="d-flex gap-3 align-items-center mb-2">
                  <div class="status-indicator" :class="snapshotStatus.active ? 'active' : 'inactive'"></div>
                  <span>Last Snapshot: {{ formatTime(snapshotStatus.lastSnapshotTime) }}</span>
                  <span>Next Expected: {{ formatTime(calculateNextExpectedSnapshot()) }}</span>
                </div>
                <!-- Add Snapshot Interval Control -->
                <div class="d-flex gap-3 align-items-center mb-2">
                  <label>Snapshot Interval (minutes):</label>
                  <input 
                    type="number" 
                    v-model="snapshotIntervalMinutes" 
                    class="form-control" 
                    style="width: 100px;"
                    min="1"
                  />
                  <button 
                    class="btn btn-primary" 
                    @click="showUpdateSnapshotIntervalConfirmation"
                    :disabled="!snapshotIntervalMinutes || snapshotIntervalMinutes < 1"
                  >
                    Update Interval
                  </button>
                </div>
                <div class="d-flex gap-2">
                  <button 
                    class="btn btn-warning" 
                    @click="triggerManualNeuronSnapshot"
                    :disabled="snapshotStatus.inProgress">
                    Trigger Manual Snapshot
                  </button>
                  <button 
                    class="btn btn-danger" 
                    @click="restartSnapshotTimer"
                    v-if="!snapshotStatus.active">
                    Restart Timer
                  </button>
                </div>
              </div>

              <!-- Treasury Sync Status -->
              <div class="timer-section">
                <h4>Treasury Sync</h4>
                <div class="d-flex flex-column gap-2">
                  <!-- Short Sync -->
                  <div class="d-flex gap-3 align-items-center">
                    <div class="status-indicator" :class="timerHealth.treasury.shortSync.active ? 'active' : 'inactive'"></div>
                    <span>Short Sync (15m)</span>
                    <span>Last: {{ formatTime(timerHealth.treasury.shortSync.lastSync) }}</span>
                  </div>
                  <!-- Long Sync -->
                  <div class="d-flex gap-3 align-items-center">
                    <div class="status-indicator" :class="timerHealth.treasury.longSync?.active ? 'active' : 'inactive'"></div>
                    <span>Long Sync</span>
                    <span>Last: {{ formatTime(timerHealth.treasury.longSync?.lastSync) }}</span>
                  </div>
                  <!-- Trading Status -->
                  <div class="d-flex gap-3 align-items-center">
                    <div class="status-indicator" :class="timerHealth.treasury.rebalanceStatus === 'Trading' ? 'active' : 'inactive'"></div>
                    <span>Trading Status:</span>
                    <span>{{ timerHealth.treasury.rebalanceStatus }}</span>
                    <span v-if="timerHealth.treasury.rebalanceError" class="text-danger">({{ timerHealth.treasury.rebalanceError }})</span>
                    <div class="ms-auto">
                      <button 
                        class="btn btn-warning btn-sm me-2" 
                        @click="executeTradingCycle">
                        Execute Trading Cycle
                      </button>
                      <button 
                        class="btn btn-success btn-sm me-2" 
                        @click="startRebalancing"
                        :disabled="timerHealth.treasury.rebalanceStatus === 'Trading'">
                        Start Trading
                      </button>
                      <button 
                        class="btn btn-danger btn-sm" 
                        @click="stopRebalancing"
                        :disabled="timerHealth.treasury.rebalanceStatus === 'Idle'">
                        Stop Trading
                      </button>
                    </div>
                  </div>
                  <!-- Trading Metrics -->
                  <div v-if="timerHealth.treasury.tradingMetrics" class="trading-metrics mt-2">
                    <h5>Trading Metrics</h5>
                    
                    <!-- Trading Bot Warning -->
                    <div v-if="getTradingBotWarning().level !== 'none'" 
                         :class="['alert', 'mb-2', getTradingBotWarning().level === 'danger' ? 'alert-danger' : 'alert-warning']">
                      <small>{{ getTradingBotWarning().message }}</small>
                    </div>
                    
                    <div class="d-flex flex-column gap-1">
                      <div>Last Attempt: {{ formatTime(timerHealth.treasury.tradingMetrics.lastRebalanceAttempt) }}</div>
                      <div>Total Trades: {{ timerHealth.treasury.tradingMetrics.totalTradesExecuted.toString() }}</div>
                      <div>Failed Trades: {{ timerHealth.treasury.tradingMetrics.totalTradesFailed.toString() }}</div>
                      <div>Success Rate: {{ (timerHealth.treasury.tradingMetrics.successRate * 100).toFixed(1) }}%</div>
                      <div>Avg Slippage: {{ timerHealth.treasury.tradingMetrics.avgSlippage.toFixed(2) }}%</div>
                    </div>
                  </div>
                  <!-- Token Sync Status -->
                  <div class="token-sync-status mt-2">
                    <h5>Token Sync Status</h5>
                    <div v-if="sortedTokenDetails.length" class="token-list">
                      <div v-for="[principal, token] in sortedTokenDetails" :key="principal.toString()" class="token-sync-item">
                        <div class="d-flex gap-3 align-items-center justify-content-between">
                          <div class="d-flex gap-3 align-items-center">
                            <div class="status-indicator" :class="getTokenStatusClass(token, principal)"></div>
                            <span class="token-symbol">{{ token.tokenSymbol }}</span>
                            <span class="token-status">{{ getTokenStatusText(token, principal) }}</span>
                            <span>Last Sync: {{ formatTime(token.lastTimeSynced) }}</span>
                          </div>
                          <div class="d-flex gap-2">
                            <button 
                              v-if="!token.isPaused" 
                              class="btn btn-warning btn-sm"
                              @click="showPauseConfirmation(principal.toString(), token.tokenSymbol)"
                            >
                              Pause
                            </button>
                            <button 
                              v-else 
                              class="btn btn-success btn-sm"
                              @click="showUnpauseConfirmation(principal.toString(), token.tokenSymbol)"
                            >
                              Unpause
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-muted">
                      No token data available
                    </div>
                  </div>
                  <div class="d-flex gap-2 mt-2">
                    <button 
                      class="btn btn-warning" 
                      @click="triggerManualSync">
                      Force Sync
                    </button>
                    <button 
                      class="btn btn-warning" 
                      @click="recoverPoolBalances"
                      :disabled="isRecoveringBalances">
                      {{ isRecoveringBalances ? 'Recovering...' : 'Recover Pool Balances' }}
                    </button>
                    <button 
                      class="btn btn-danger" 
                      @click="restartTreasurySyncs"
                      v-if="!timerHealth.treasury.shortSync.active">
                      Restart Syncs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Portfolio Snapshot Management -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Portfolio Snapshot Management</h3>
              <button class="btn btn-primary" @click="refreshPortfolioSnapshotStatus">
                Refresh Status
              </button>
            </div>
            
            <div class="card-body">
              <div class="timer-section">
                <div class="d-flex gap-3 align-items-center mb-3">
                  <div class="status-indicator" :class="'Running' in portfolioSnapshotStatus.status ? 'active' : 'inactive'"></div>
                  <span><strong>Status:</strong> {{ 'Running' in portfolioSnapshotStatus.status ? 'Running' : 'Stopped' }}</span>
                  <span><strong>Interval:</strong> {{ portfolioSnapshotStatus.intervalMinutes }} minutes</span>
                  <span><strong>Last Snapshot:</strong> {{ formatTime(portfolioSnapshotStatus.lastSnapshotTime) }}</span>
                </div>
                
                <!-- Interval Control -->
                <div class="d-flex gap-3 align-items-center mb-3">
                  <label>Snapshot Interval (minutes):</label>
                  <input 
                    type="number" 
                    v-model="newPortfolioSnapshotInterval" 
                    class="form-control" 
                    style="width: 100px;"
                    min="1"
                    max="1440"
                  />
                  <button 
                    class="btn btn-primary" 
                    @click="showUpdatePortfolioSnapshotIntervalConfirmation"
                    :disabled="!newPortfolioSnapshotInterval || newPortfolioSnapshotInterval < 1 || newPortfolioSnapshotInterval > 1440"
                  >
                    Update Interval
                  </button>
                </div>
                
                <!-- Control Buttons -->
                <div class="d-flex gap-2">
                  <button 
                    class="btn btn-success" 
                    @click="showStartPortfolioSnapshotsConfirmation"
                    :disabled="'Running' in portfolioSnapshotStatus.status">
                    Start Portfolio Snapshots
                  </button>
                  <button 
                    class="btn btn-danger" 
                    @click="showStopPortfolioSnapshotsConfirmation"
                    :disabled="'Stopped' in portfolioSnapshotStatus.status">
                    Stop Portfolio Snapshots
                  </button>
                  <button 
                    class="btn btn-warning" 
                    @click="triggerManualPortfolioSnapshot">
                    Take Manual Snapshot
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Voting Dashboard -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Voting Dashboard</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-success" @click="refreshUserVotingPower" :disabled="refreshingVP">
                  {{ refreshingVP ? 'Refreshing...' : '🔄 Refresh My Voting Power' }}
                </button>
                <button class="btn btn-primary" @click="refreshVotingMetrics">
                  Refresh Metrics
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <!-- Overall Voting Power -->
              <div class="voting-section mb-4">
                <h4>Overall Voting Power</h4>
                <div class="metrics-grid">
                  <div class="metric-item">
                    <label>Total Voting Power</label>
                    <div class="value">{{ formatNumber(votingMetrics.totalVotingPower) }}</div>
                  </div>
                  <div class="metric-item">
                    <label>Hotkey Setters VP</label>
                    <div class="value">{{ formatNumber(votingMetrics.totalVotingPowerByHotkeySetters) }}</div>
                  </div>
                  <div class="metric-item">
                    <label>Allocated VP</label>
                    <div class="value">{{ formatNumber(votingMetrics.allocatedVotingPower) }}</div>
                  </div>
                  <div class="metric-item">
                    <label>Allocation Utilization</label>
                    <div class="value">{{ calculateUtilization(votingMetrics) }}%</div>
                  </div>
                  <div class="metric-item">
                    <label>Hotkey Principals</label>
                    <div class="value">{{ formatNumber(votingMetrics.principalCount) }}</div>
                  </div>
                  <div class="metric-item">
                    <label>Voting Neurons</label>
                    <div class="value">{{ formatNumber(votingMetrics.neuronCount) }}</div>
                  </div>
                </div>
              </div>

              <!-- Current Aggregate Allocation -->
              <div class="voting-section mb-4">
                <h4>Current Token Allocations</h4>
                <div class="allocation-table">
                  <table class="table table-dark">
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Allocation (%)</th>
                        <th>Voting Power</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="allocation in aggregateAllocation" :key="allocation.token">
                        <td>{{ getTokenSymbol(allocation.token) }}</td>
                        <td>{{ (allocation.basisPoints / 100).toFixed(2) }}%</td>
                        <td>{{ formatNumber(allocation.votingPower) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          <!-- Neuron Allocations -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Neuron Allocations</h3>
              <button class="btn btn-primary" @click="refreshNeuronAllocations">
                Refresh Allocations
              </button>
            </div>
            
            <div class="card-body">
              <div v-if="fetchedNeuronAllocations.length > 0">
                <div class="table-responsive">
                  <table class="table table-dark">
                    <thead>
                      <tr>
                        <th>Neuron ID</th>
                        <th>Voting Power</th>
                        <th>Last Update</th>
                        <th>Last Allocation Maker</th>
                        <th>Token Allocations</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="neuron in fetchedNeuronAllocations" :key="uint8ArrayToHex(neuron.neuronId)">
                        <td>{{ uint8ArrayToHex(neuron.neuronId) }}</td>
                        <td>{{ formatNumber(neuron.votingPower) }}</td>
                        <td>{{ formatTime(neuron.lastUpdate) }}</td>
                        <td>
                          <a 
                            :href="createVoteHistoryLink(neuron.lastAllocationMaker)" 
                            target="_blank" 
                            class="text-decoration-none text-info"
                            @click.prevent="$router.push({ path: '/admin/votes', query: { principal: neuron.lastAllocationMaker.toString() } })"
                            title="View vote history for this principal"
                          >
                            🗳️ {{ getPrincipalDisplayName(neuron.lastAllocationMaker) }}
                          </a>
                        </td>
                        <td>
                          <div v-for="[token, basisPoints] in neuron.allocations" :key="token.toString()">
                            {{ getTokenSymbol(token) }}: {{ (Number(basisPoints) / 100).toFixed(2) }}%
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-center py-4">
                No neuron allocations available. Click refresh to load data.
              </div>
            </div>
          </div>


          <!-- Voter Details -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Voter Details</h3>
              <div class="d-flex gap-2 align-items-center">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" v-model="showOnlyActive" id="activeFilter">
                  <label class="form-check-label" for="activeFilter">Show only active voters</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" v-model="showOnlyFollowing" id="followingFilter">
                  <label class="form-check-label" for="followingFilter">Show only following</label>
                </div>
                <button class="btn btn-primary" @click="refreshVoterDetails">
                  Refresh Details
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div v-if="filteredVoterDetails.length > 0">
                <div class="table-responsive">
                  <table class="table table-dark">
                    <thead>
                      <tr>
                        <th>Principal ID</th>
                        <th>Voting Power</th>
                        <th>Neurons</th>
                        <th>Current Allocation</th>
                        <th>Last Update</th>
                        <th>Following</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="voter in filteredVoterDetails" :key="voter.principal.toString()">
                        <td>
                          <a 
                            :href="createVoteHistoryLink(voter.principal)" 
                            target="_blank" 
                            class="text-decoration-none text-info"
                            @click.prevent="$router.push({ path: '/admin/votes', query: { principal: voter.principal.toString() } })"
                            title="View vote history for this principal"
                          >
                            🗳️ {{ getPrincipalDisplayName(voter.principal) }}
                          </a>
                        </td>
                        <td>{{ formatNumber(voter.state.votingPower) }}</td>
                        <td>
                          <div v-for="neuron in voter.state.neurons" :key="neuron.neuronId">
                            ID: {{ uint8ArrayToHex(neuron.neuronId) }}<br>
                            VP: {{ formatNumber(neuron.votingPower) }}
                          </div>
                        </td>
                        <td>{{ formatAllocation(voter.state.allocations) }}</td>
                        <td>{{ formatTime(voter.state.lastAllocationUpdate) }}</td>
                        <td>
                          <div v-if="voter.state.allocationFollows.length > 0">
                            <div v-for="follow in voter.state.allocationFollows" :key="follow.follow.toString()">
                              <a 
                                :href="createVoteHistoryLink(follow.follow)" 
                                target="_blank" 
                                class="text-decoration-none text-info"
                                @click.prevent="$router.push({ path: '/admin/votes', query: { principal: follow.follow.toString() } })"
                                title="View vote history for this principal"
                              >
                                🗳️ {{ getPrincipalDisplayName(follow.follow) }}
                              </a><br>
                              Since: {{ formatTime(follow.since) }}
                            </div>
                          </div>
                          <div v-else>Not following anyone</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-center py-4">
                {{ showOnlyActive ? 'No active voters found.' : 'No voter details available. Click refresh to load data.' }}
              </div>
            </div>
          </div>

          <!-- System Logs -->
          <div class="card bg-dark text-white">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">System Logs</h3>
              <div class="d-flex gap-2">
                <select v-model="logLevel" class="form-select form-select-sm" style="width: auto;">
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                </select>
                <select v-model="selectedComponent" class="form-select form-select-sm" style="width: auto;">
                  <option value="all">All Components</option>
                  <option v-for="component in uniqueComponents" :key="component" :value="component">
                    {{ component }}
                  </option>
                </select>
                <button class="btn btn-primary btn-sm" @click="refreshLogs">
                  Refresh Logs
                </button>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="log-container">
                <div v-for="log in systemLogs" :key="log.timestamp" 
                     :class="['log-entry', getLogLevelClass(log.level)]"
                     v-show="(logLevel === 'all' || getLogLevelClass(log.level) === logLevel) && 
                            (selectedComponent === 'all' || log.component === selectedComponent)">
                  <span class="timestamp">{{ new Date(Number(log.timestamp) / 1000000).toLocaleString() }}</span>
                  <span class="level">{{ getLogLevelString(log.level) }}</span>
                  <span class="component">{{ log.component }}</span>
                  <span class="message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Trading Logs -->
          <div class="card bg-dark text-white mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Trading Logs</h3>
              <button class="btn btn-primary btn-sm" @click="refreshTradingLogs">
                Refresh Logs
              </button>
            </div>
            <div class="card-body">
              <TradingLogs ref="tradingLogsComponent" />
            </div>
          </div>

          <!-- Rebalance Configuration -->
          <div class="card bg-dark text-white mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Rebalance Configuration</h3>
            </div>
            <div class="card-body">
              <div v-if="rebalanceConfig" class="config-grid">
                <div class="config-item">
                  <label>Max Slippage (%)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxSlippageBasisPoints" 
                    step="0.01" 
                    min="0.35" 
                    max="5"
                    @input="validateInput('maxSlippageBasisPoints')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 0.35% - 5%</div>
                </div>
                <div class="config-item">
                  <label>Min Trade Value (ICP)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.minTradeValueICP" 
                    step="0.1" 
                    min="0.1"
                    @input="validateInput('minTradeValueICP')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Max Trade Value (ICP)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxTradeValueICP" 
                    step="1" 
                    min="1"
                    @input="validateInput('maxTradeValueICP')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Max Trades Stored</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxTradesStored" 
                    step="1" 
                    min="1"
                    @input="validateInput('maxTradesStored')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Max Trade Attempts per Interval</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxTradeAttemptsPerInterval" 
                    step="1" 
                    min="1"
                    @input="validateInput('maxTradeAttemptsPerInterval')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Max Kongswap Attempts</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxKongswapAttempts" 
                    step="1" 
                    min="1"
                    @input="validateInput('maxKongswapAttempts')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Rebalance Interval (minutes)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.rebalanceIntervalMinutes" 
                    step="1" 
                    min="1"
                    @input="validateInput('rebalanceIntervalMinutes')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Portfolio Rebalance Period (minutes)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.portfolioRebalancePeriodMinutes" 
                    step="1" 
                    min="1"
                    @input="validateInput('portfolioRebalancePeriodMinutes')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Short Sync Interval (seconds)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.shortSyncIntervalSeconds" 
                    step="1" 
                    min="1"
                    @input="validateInput('shortSyncIntervalSeconds')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Long Sync Interval (minutes)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.longSyncIntervalMinutes" 
                    step="1" 
                    min="1"
                    @input="validateInput('longSyncIntervalMinutes')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Token Sync Timeout (seconds)</label>
                  <input 
                    type="number" 
                    v-model="configInputs.tokenSyncTimeoutSeconds" 
                    step="1" 
                    min="1"
                    @input="validateInput('tokenSyncTimeoutSeconds')"
                    class="form-control"
                  />
                </div>
                <div class="config-item">
                  <label>Max Price History Entries</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxPriceHistoryEntries" 
                    step="1" 
                    min="10"
                    max="1000000"
                    @input="validateInput('maxPriceHistoryEntries')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 10-1,000,000 entries. At 1-min intervals: 1M entries ≈ 1.8 years</div>
                </div>
                <div class="config-item">
                  <label>Max Portfolio Snapshots</label>
                  <input 
                    type="number" 
                    v-model="configInputs.maxPortfolioSnapshots" 
                    step="1" 
                    min="10"
                    max="10000"
                    @input="validateInput('maxPortfolioSnapshots')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 10-10,000 snapshots. At hourly intervals: 1,000 snapshots ≈ 42 days</div>
                </div>
              </div>
              <div v-else class="text-center py-4">Loading configuration...</div>
              <div class="d-flex gap-2 mt-4">
                <button 
                  @click="showConfigUpdateConfirmation" 
                  :disabled="!isConfigValid || !hasConfigChanges"
                  class="btn btn-primary"
                >
                  Update Configuration
                </button>
                <button 
                  @click="resetConfig" 
                  :disabled="!hasConfigChanges"
                  class="btn btn-secondary"
                >
                  Reset Changes
                </button>
              </div>
            </div>
          </div>

          <!-- System Parameters -->
          <div class="card bg-dark text-white mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">System Parameters</h3>
              <button class="btn btn-primary btn-sm" @click="refreshSystemParameters">
                Refresh Parameters
              </button>
            </div>
            <div class="card-body">
              <div v-if="systemParametersData" class="config-grid">
                <div class="config-item">
                  <label>Follow Depth</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.FollowDepth" 
                    step="1" 
                    min="1" 
                    max="3"
                    @input="validateSystemParameterInput('FollowDepth')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 1-3. Max depth for following allocation strategies.</div>
                </div>
                <div class="config-item">
                  <label>Max Followed</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.MaxFollowed" 
                    step="1" 
                    min="1" 
                    max="10"
                    @input="validateSystemParameterInput('MaxFollowed')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 1-10. Max users a single user can follow.</div>
                </div>
                <div class="config-item">
                  <label>Max Follow/Unfollow Actions Per Day</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.MaxFollowUnfollowActionsPerDay" 
                    step="1" 
                    min="9" 
                    max="100"
                    @input="validateSystemParameterInput('MaxFollowUnfollowActionsPerDay')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 9-100. Max follow/unfollow actions per day.</div>
                </div>
                <div class="config-item">
                  <label>Max Allocations Per Window</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.MaxAllocationsPerDay" 
                    step="1" 
                    min="1" 
                    max="10"
                    @input="validateSystemParameterInput('MaxAllocationsPerDay')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 1-10. Max allocation updates per allocation window.</div>
                </div>
                <div class="config-item">
                  <label>Allocation Window (hours)</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.AllocationWindowHours" 
                    step="1" 
                    min="1" 
                    max="168"
                    @input="validateSystemParameterInput('AllocationWindowHours')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 1-168 hours (1 hour - 7 days). Time window for allocation rate limiting.</div>
                </div>
                <div class="config-item">
                  <label>Max Followers</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.MaxFollowers" 
                    step="1" 
                    min="50" 
                    max="5000"
                    @input="validateSystemParameterInput('MaxFollowers')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 50-5000. Max followers a single user can have.</div>
                </div>
                <div class="config-item">
                  <label>Max Total Updates</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.MaxTotalUpdates" 
                    step="1" 
                    min="200" 
                    max="10000"
                    @input="validateSystemParameterInput('MaxTotalUpdates')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 200-10000. Max neuron updates per allocation operation.</div>
                </div>
                <div class="config-item">
                  <label>Max Past Allocations</label>
                  <input 
                    type="number" 
                    v-model="systemParametersInputs.MaxPastAllocations" 
                    step="1" 
                    min="20" 
                    max="500"
                    @input="validateSystemParameterInput('MaxPastAllocations')"
                    class="form-control"
                  />
                  <div class="help-text text-muted">Range: 20-500. Max past allocations stored per user.</div>
                </div>
              </div>
              
              <div class="d-flex gap-2 mt-4">
                <button 
                  @click="showSystemParametersUpdateConfirmation" 
                  :disabled="!isSystemParametersValid || !hasSystemParametersChanges"
                  class="btn btn-primary"
                >
                  Update System Parameters
                </button>
                <button 
                  @click="resetSystemParameters" 
                  :disabled="!hasSystemParametersChanges"
                  class="btn btn-secondary"
                >
                  Reset Changes
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    
    <!-- Confirmation Modal for Admin Actions -->
    <AdminConfirmationModal
      :show="confirmationModal.show"
      :title="confirmationModal.title"
      :message="confirmationModal.message"
      :extra-data="confirmationModal.extraData"
      :confirm-button-text="confirmationModal.confirmButtonText"
      :confirm-button-class="confirmationModal.confirmButtonClass"
      :reason-placeholder="confirmationModal.reasonPlaceholder"
      :submitting="confirmationModal.submitting"
      @confirm="handleConfirmAction"
      @cancel="hideConfirmationModal"
    />
    
    <!-- GNSF Proposal Dialog for Non-Admin Users -->
    <GNSFProposalDialog
      :show="showProposalDialog"
      :function-name="proposalFunctionName"
      :reason-placeholder="proposalReasonPlaceholder"
      :context-params="proposalContextParams"
      @close="showProposalDialog = false"
      @success="handleProposalSuccess"
    />
    
    <!-- footer bar -->
    <FooterBar />
  </div>
</template>

<style scoped lang="scss">
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &.active {
    background-color: #28a745;
  }
  
  &.paused {
    background-color: #dc3545;
    
    &.price-alert {
      background-color: #fd7e14; // Orange for price alerts
    }
    
    &.circuit-breaker {
      background-color: #dc3545; // Red for circuit breakers
    }
    
    &.manual {
      background-color: #6f42c1; // Purple for manual pauses
    }
    
    &.sync-failure {
      background-color: #ffc107; // Yellow for sync failures
    }
  }

  &.sync-failed {
    background-color: #ffc107;
  }
  
  &.inactive {
    background-color: #6c757d;
  }
}

.timer-section {
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.log-container {
  height: 400px;
  overflow-y: auto;
  font-family: monospace;
  
  .log-entry {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    overflow-x: auto;
    
    &.error { color: #dc3545; }
    &.warn { color: #ffc107; }
    &.info { color: #0dcaf0; }
    
    .timestamp {
      margin-right: 1rem;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .level {
      margin-right: 1rem;
      font-weight: bold;
      display: inline-block;
      min-width: 5ch;
    }

    .component {
      margin-right: 1rem;
      color: rgba(255, 255, 255, 0.7);
      display: inline-block;
      min-width: 20ch;
    }

    .message {
      white-space: normal;
      display: inline-block;
    }
  }
}

.token-sync-status {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  max-height: 300px;
  overflow-y: auto;
}

.token-list {
  overflow-y: auto;
}

.token-sync-item {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.token-sync-item:last-child {
  border-bottom: none;
}

.token-symbol {
  min-width: 80px;
  font-weight: bold;
}

.token-status {
  font-size: 0.875rem;
  color: var(--light-orange);
}

.scroll-y-container {
  overflow-y: auto;
  height: 100%;
  padding-bottom: 2rem;
}

.trading-metrics {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 0.5rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-item label {
  font-weight: 500;
  color: var(--light-orange);
}

.config-item .help-text {
  font-size: 0.875rem;
}

.config-item .form-control {
  background-color: var(--black-to-white);
  border: 1px solid var(--dark-gray);
  color: var(--white-to-black);
}

.config-item .form-control:focus {
  background-color: var(--black-to-white);
  border-color: var(--light-orange);
  color: var(--white-to-black);
  box-shadow: 0 0 0 0.2rem rgba(254, 234, 193, 0.25);
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.primary-button {
  background-color: #4CAF50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.secondary-button {
  background-color: #f5f5f5;
  color: #333;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.secondary-button:disabled {
  color: #999;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.voting-section {
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.metric-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 0.5rem;
  
  label {
    color: var(--light-orange);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .value {
    font-size: 1.25rem;
    font-weight: 500;
  }
}

.allocation-table {
  margin-top: 1rem;
  overflow-x: auto;
  
  table {
    width: 100%;
    
    th, td {
      padding: 0.75rem;
      text-align: left;
    }
    
    th {
      color: var(--light-orange);
      font-weight: 500;
    }
  }
}

.chart-container {
  height: 300px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.table-responsive {
  max-height: 600px;
  overflow-y: auto;
}

.table td {
  vertical-align: top;
  white-space: normal;
  word-break: break-all;
}

/* Trading Bot Warning Alerts */
.trading-metrics .alert {
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.trading-metrics .alert-warning {
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.trading-metrics .alert-danger {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #dc3545;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Actor } from '@dfinity/agent';
import { useTacoStore, type GetSystemParameterResult } from '../stores/taco.store';
import { storeToRefs } from "pinia"  
import HeaderBar from "../components/HeaderBar.vue";
import FooterBar from "../components/FooterBar.vue";
import TacoTitle from '../components/misc/TacoTitle.vue';
import TradingLogs from '../components/admin/TradingLogs.vue';
import AdminConfirmationModal from '../components/admin/AdminConfirmationModal.vue';
import GNSFProposalDialog from '../components/proposals/GNSFProposalDialog.vue';
import { Principal } from '@dfinity/principal';
import { useAdminCheck } from '../composables/useAdminCheck';

// Add interface for VotingMetrics
interface VotingMetrics {
    totalVotingPower: bigint;
    totalVotingPowerByHotkeySetters: bigint;
    allocatedVotingPower: bigint;
    principalCount: bigint;
    neuronCount: bigint;
}

const logLevel = ref('all');
const selectedComponent = ref('all');
const isRecoveringBalances = ref(false);
const showOnlyActive = ref(false);
const showOnlyFollowing = ref(false);
const refreshingVP = ref(false);

// Trading pauses state
const tradingPauses = ref<any[]>([]);

// Get store
const tacoStore = useTacoStore();
const { 
  snapshotStatus, 
  timerHealth, 
  systemLogs, 
  fetchedTokenDetails: tokenDetailsRef, 
  rebalanceConfig,
  fetchedVotingPowerMetrics,
  fetchedAggregateAllocation,
  fetchedVoterDetails,
  fetchedNeuronAllocations
} = storeToRefs(tacoStore);

// Destructure utility methods
const { getPrincipalDisplayName, listTradingPauses } = tacoStore;

// Admin check composable
const { isAdmin, checkAdminStatus } = useAdminCheck();

// GNSF Proposal Dialog state
const showProposalDialog = ref(false);
const proposalFunctionName = ref('');
const proposalReasonPlaceholder = ref('');
const proposalContextParams = ref<Record<string, any>>({});

// Computed property to sort tokens with paused/inactive tokens first
const sortedTokenDetails = computed(() => {
  if (!tokenDetailsRef.value || !tokenDetailsRef.value.length) return [];
  
  return [...tokenDetailsRef.value].sort(([principalA, tokenA], [principalB, tokenB]) => {
    const statusA = getTokenStatusClass(tokenA, principalA);
    const statusB = getTokenStatusClass(tokenB, principalB);
    
    // Priority: inactive > paused > active
    const getPriority = (status: string) => {
      if (status.includes('inactive')) return 0;
      if (status.includes('paused')) return 1;
      return 2; // active
    };
    
    const priorityA = getPriority(statusA);
    const priorityB = getPriority(statusB);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by token symbol alphabetically
    return tokenA.tokenSymbol.localeCompare(tokenB.tokenSymbol);
  });
});

// Modal state for confirmation dialogs
const confirmationModal = ref({
  show: false,
  title: '',
  message: '',
  extraData: '',
  confirmButtonText: 'Confirm',
  confirmButtonClass: 'btn-primary',
  reasonPlaceholder: 'Please provide a reason for this action...',
  submitting: false,
  action: null as (() => Promise<void>) | null,
  actionData: null as { principal: string; tokenName: string } | { type: string } | { type: string; intervalMinutes: number } | null
});

// Update voting metrics state with type
const votingMetrics = ref<VotingMetrics>({
    totalVotingPower: 0n,
    totalVotingPowerByHotkeySetters: 0n,
    allocatedVotingPower: 0n,
    principalCount: 0n,
    neuronCount: 0n
});

const aggregateAllocation = ref<{ token: Principal; basisPoints: number; votingPower: bigint; }[]>([]);

// Add this computed property to get unique components from logs
const uniqueComponents = computed(() => {
  const components = new Set(systemLogs.value.map(log => log.component));
  return Array.from(components).sort();
});

// Timer status functions
async function refreshTimerStatus() {
  console.log('AdminView: refreshTimerStatus called');
  await tacoStore.refreshTimerStatus();
  await fetchTradingPauses();
  console.log('AdminView: refreshTimerStatus completed');
}

async function triggerManualPortfolioSnapshot() {
    console.log('AdminView: triggerManualPortfolioSnapshot called');
    
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        showManualPortfolioSnapshotConfirmation();
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'takeManualPortfolioSnapshot';
        proposalReasonPlaceholder.value = 'Please explain why a manual portfolio snapshot should be taken...';
        proposalContextParams.value = {};
        showProposalDialog.value = true;
    }
}

async function triggerManualNeuronSnapshot() {
    console.log('AdminView: triggerManualNeuronSnapshot called');
    
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        showManualNeuronSnapshotConfirmation();
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'takeNeuronSnapshot';
        proposalReasonPlaceholder.value = 'Please explain why a manual neuron snapshot should be taken...';
        proposalContextParams.value = {};
        showProposalDialog.value = true;
    }
}

// Legacy alias for backwards compatibility
async function triggerManualSnapshot() {
    await triggerManualPortfolioSnapshot();
}

async function triggerManualSync() {
    console.log('AdminView: triggerManualSync called');
    
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        confirmationModal.value = {
            show: true,
            title: 'Force Treasury Sync',
            message: 'Are you sure you want to force a treasury sync?',
            extraData: 'This will synchronize data between the treasury and DAO, update balances, and sync prices with DEX.',
            confirmButtonText: 'Force Sync',
            confirmButtonClass: 'btn-warning',
            reasonPlaceholder: 'Please explain why the treasury needs to be force-synced...',
            submitting: false,
            action: null,
            actionData: { type: 'syncWithDao' }
        };
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'syncWithDao';
        proposalReasonPlaceholder.value = 'Please explain why the treasury needs to be force-synced...';
        showProposalDialog.value = true;
    }
}

async function restartSnapshotTimer() {
    if (confirm('Are you sure you want to restart the snapshot timer?')) {
        await tacoStore.restartSnapshotTimer();
    }
}

async function restartTreasurySyncs() {
    if (confirm('Are you sure you want to restart treasury sync timers?')) {
        await tacoStore.restartTreasurySyncs();
    }
}

// Log management
async function refreshLogs() {
    console.log('AdminView: refreshLogs called');
    await tacoStore.fetchSystemLogs();
    console.log('AdminView: refreshLogs completed, systemLogs:', systemLogs.value);
}

// Add these helper functions
function getLogLevelClass(level: any): string {
  if (!level) return '';
  // Check which level type exists in the object
  if (level.ERROR !== undefined) return 'error';
  if (level.WARN !== undefined) return 'warn';
  if (level.INFO !== undefined) return 'info';
  return '';
}

function getLogLevelString(level: any): string {
  if (!level) return 'UNKNOWN';
  // Check which level type exists in the object
  if (level.ERROR !== undefined) return 'ERROR';
  if (level.WARN !== undefined) return 'WARN';
  if (level.INFO !== undefined) return 'INFO';
  return 'UNKNOWN';
}

const filteredLogs = computed(() => {
    console.log('AdminView: Computing filteredLogs with level:', logLevel.value, 'and component:', selectedComponent.value);
    let filtered = systemLogs.value;
    
    // Filter by log level
    if (logLevel.value !== 'all') {
        filtered = logLevel.value === 'error' 
            ? filtered.filter(log => log.level.ERROR !== undefined)
            : filtered.filter(log => log.level.ERROR !== undefined || log.level.WARN !== undefined);
    }
    
    // Filter by component
    if (selectedComponent.value !== 'all') {
        filtered = filtered.filter(log => log.component === selectedComponent.value);
    }
    
    // Sort by timestamp in descending order (newest first)
    return [...filtered].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
});

// Utility functions
function formatTime(timestamp: number | bigint | null): string {
    if (!timestamp) return 'Never';
    // Convert to nanoseconds if not already
    const nanoseconds = typeof timestamp === 'bigint' ? timestamp : BigInt(timestamp);
    const milliseconds = Number(nanoseconds / BigInt(1_000_000));
    const date = new Date(milliseconds);
    return date.toLocaleString();
}

// Handle proposal success
const handleProposalSuccess = (proposalId: bigint) => {
    console.log('Proposal created successfully:', proposalId);
    tacoStore.showSuccess(`Proposal ${proposalId} created successfully!`);
    // Optionally refresh any relevant data
};

// Lifecycle hooks
onMounted(async () => {
    console.log('AdminView: Component mounted');
    
    // Check admin status in background
    checkAdminStatus().catch(console.error);
    
    const params = await tacoStore.getSystemParameters() as any[];
    const snapshotParam = params.find(p => 'SnapshotInterval' in p);
    if (snapshotParam?.SnapshotInterval) {
        snapshotIntervalMinutes.value = Number(snapshotParam.SnapshotInterval) / (60 * 1_000_000_000);
    }
    await Promise.all([
        refreshTimerStatus(),
        loadConfig(),
        refreshLogs(),
        refreshVotingMetrics(),
        refreshVoterDetails(),
        refreshNeuronAllocations(),
        refreshPortfolioSnapshotStatus(),
        refreshSystemParameters()
    ]);
    console.log('AdminView: Initial data loaded');
});

// New functions
async function startRebalancing() {
    console.log('AdminView: startRebalancing called');
    
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        showStartRebalancingConfirmation();
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'startRebalancing';
        proposalReasonPlaceholder.value = 'Please explain why trading should be started...';
        showProposalDialog.value = true;
    }
}

async function stopRebalancing() {
    console.log('AdminView: stopRebalancing called');
    
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        showStopRebalancingConfirmation();
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'stopRebalancing';
        proposalReasonPlaceholder.value = 'Please explain why trading should be stopped...';
        showProposalDialog.value = true;
    }
}

async function recoverPoolBalances() {
    console.log('AdminView: recoverPoolBalances called');
    
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        confirmationModal.value = {
            show: true,
            title: 'Recover Pool Balances',
            message: 'Are you sure you want to recover balances from ICPSwap pools?',
            extraData: 'This will scan all ICPSwap liquidity pools and recover any unused or forgotten token balances.',
            confirmButtonText: 'Recover Balances',
            confirmButtonClass: 'btn-warning',
            reasonPlaceholder: 'Please explain why pool balances need to be recovered...',
            submitting: false,
            action: null,
            actionData: { type: 'recoverPoolBalances' }
        };
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'recoverPoolBalances';
        proposalReasonPlaceholder.value = 'Please explain why pool balances need to be recovered...';
        showProposalDialog.value = true;
    }
}

const configInputs = ref({
  maxSlippageBasisPoints: 0,
  minTradeValueICP: 0,
  maxTradeValueICP: 0,
  maxTradesStored: 0,
  maxTradeAttemptsPerInterval: 0,
  maxKongswapAttempts: 0,
  rebalanceIntervalMinutes: 0,
  portfolioRebalancePeriodMinutes: 0,
  shortSyncIntervalSeconds: 0,
  longSyncIntervalMinutes: 0,
  tokenSyncTimeoutSeconds: 0,
  maxPriceHistoryEntries: 0,
  maxPortfolioSnapshots: 0
});

const isConfigValid = ref(true);
const hasConfigChanges = ref(false);

// Track original maxPriceHistoryEntries for change detection
const originalMaxPriceHistoryEntries = ref(0);
const originalMaxPortfolioSnapshots = ref(0);

const NS_PER_SECOND = 1_000_000_000n;
const NS_PER_MINUTE = NS_PER_SECOND * 60n;

// Update conversion functions to properly handle BigInt
const nsToMinutes = (ns: bigint) => {
    return Number(ns / NS_PER_MINUTE);
};

const nsToSeconds = (ns: bigint) => {
    return Number(ns / NS_PER_SECOND);
};

const minutesToNs = (minutes: number) => {
    return BigInt(Math.round(minutes)) * NS_PER_MINUTE;
};

const secondsToNs = (seconds: number) => {
    return BigInt(Math.round(seconds)) * NS_PER_SECOND;
};

// Initialize config inputs when rebalanceConfig changes
watch(rebalanceConfig, async (newConfig) => {
  if (newConfig) {
    try {
      // Load current max price history entries and max portfolio snapshots
      let currentMaxPriceHistory = 0;
      let currentMaxPortfolioSnapshots = 0;
      try {
        const [maxPriceHistoryEntries, maxPortfolioSnapshots] = await Promise.all([
          tacoStore.getMaxPriceHistoryEntries(),
          tacoStore.getMaxPortfolioSnapshots()
        ]);
        currentMaxPriceHistory = Number(maxPriceHistoryEntries);
        currentMaxPortfolioSnapshots = Number(maxPortfolioSnapshots);
        originalMaxPriceHistoryEntries.value = currentMaxPriceHistory;
        originalMaxPortfolioSnapshots.value = currentMaxPortfolioSnapshots;
      } catch (error) {
        console.error('Error loading configuration limits:', error);
      }

      configInputs.value = {
        maxSlippageBasisPoints: Number(newConfig.maxSlippageBasisPoints) / 100,
        minTradeValueICP: Number(newConfig.minTradeValueICP),
        maxTradeValueICP: Number(newConfig.maxTradeValueICP),
        maxTradesStored: Number(newConfig.maxTradesStored),
        maxTradeAttemptsPerInterval: Number(newConfig.maxTradeAttemptsPerInterval),
        maxKongswapAttempts: Number(newConfig.maxKongswapAttempts),
        rebalanceIntervalMinutes: nsToMinutes(newConfig.rebalanceIntervalNS),
        portfolioRebalancePeriodMinutes: nsToMinutes(newConfig.portfolioRebalancePeriodNS),
        shortSyncIntervalSeconds: nsToSeconds(newConfig.shortSyncIntervalNS),
        longSyncIntervalMinutes: nsToMinutes(newConfig.longSyncIntervalNS),
        tokenSyncTimeoutSeconds: nsToSeconds(newConfig.tokenSyncTimeoutNS),
        maxPriceHistoryEntries: currentMaxPriceHistory,
        maxPortfolioSnapshots: currentMaxPortfolioSnapshots
      };
      hasConfigChanges.value = false;
    } catch (error) {
      console.error('Error initializing config inputs:', error);
      // Set default values on error
      configInputs.value = {
        maxSlippageBasisPoints: 0,
        minTradeValueICP: 0,
        maxTradeValueICP: 0,
        maxTradesStored: 0,
        maxTradeAttemptsPerInterval: 0,
        maxKongswapAttempts: 0,
        rebalanceIntervalMinutes: 0,
        portfolioRebalancePeriodMinutes: 0,
        shortSyncIntervalSeconds: 0,
        longSyncIntervalMinutes: 0,
        tokenSyncTimeoutSeconds: 0,
        maxPriceHistoryEntries: 0,
        maxPortfolioSnapshots: 0
      };
    }
  }
}, { immediate: true });

// Watch for changes in configInputs
watch(configInputs, () => {
  if (rebalanceConfig.value) {
    const current = configInputs.value;
    const original = rebalanceConfig.value;
    
    // Convert all values to strings for comparison to avoid BigInt mixing
    hasConfigChanges.value = 
      current.maxSlippageBasisPoints * 100 !== Number(original.maxSlippageBasisPoints) ||
      current.minTradeValueICP !== Number(original.minTradeValueICP) ||
      current.maxTradeValueICP !== Number(original.maxTradeValueICP) ||
      current.maxTradesStored !== Number(original.maxTradesStored) ||
      current.maxTradeAttemptsPerInterval !== Number(original.maxTradeAttemptsPerInterval) ||
      current.maxKongswapAttempts !== Number(original.maxKongswapAttempts) ||
      String(minutesToNs(current.rebalanceIntervalMinutes)) !== String(original.rebalanceIntervalNS) ||
      String(minutesToNs(current.portfolioRebalancePeriodMinutes)) !== String(original.portfolioRebalancePeriodNS) ||
      String(secondsToNs(current.shortSyncIntervalSeconds)) !== String(original.shortSyncIntervalNS) ||
      String(minutesToNs(current.longSyncIntervalMinutes)) !== String(original.longSyncIntervalNS) ||
      String(secondsToNs(current.tokenSyncTimeoutSeconds)) !== String(original.tokenSyncTimeoutNS) ||
      current.maxPriceHistoryEntries !== originalMaxPriceHistoryEntries.value ||
      current.maxPortfolioSnapshots !== originalMaxPortfolioSnapshots.value;
  }
}, { deep: true });

const validateInput = (field: string) => {
  // Add validation logic here
  isConfigValid.value = true; // Simplified for now
};

const updateConfigWithReason = async (reason: string) => {
  if (!isConfigValid.value || !rebalanceConfig.value) return;
  
  // Update rebalance config
  const updates = {
    maxSlippageBasisPoints: [BigInt(Math.round(configInputs.value.maxSlippageBasisPoints * 100))] as [bigint],
    minTradeValueICP: [BigInt(Math.round(configInputs.value.minTradeValueICP))] as [bigint],
    maxTradeValueICP: [BigInt(Math.round(configInputs.value.maxTradeValueICP))] as [bigint],
    maxTradesStored: [BigInt(Math.round(configInputs.value.maxTradesStored))] as [bigint],
    maxTradeAttemptsPerInterval: [BigInt(Math.round(configInputs.value.maxTradeAttemptsPerInterval))] as [bigint],
    maxKongswapAttempts: [BigInt(Math.round(configInputs.value.maxKongswapAttempts))] as [bigint],
    rebalanceIntervalNS: [minutesToNs(configInputs.value.rebalanceIntervalMinutes)] as [bigint],
    portfolioRebalancePeriodNS: [minutesToNs(configInputs.value.portfolioRebalancePeriodMinutes)] as [bigint],
    shortSyncIntervalNS: [secondsToNs(configInputs.value.shortSyncIntervalSeconds)] as [bigint],
    longSyncIntervalNS: [minutesToNs(configInputs.value.longSyncIntervalMinutes)] as [bigint],
    tokenSyncTimeoutNS: configInputs.value.tokenSyncTimeoutSeconds > 0 ? [secondsToNs(configInputs.value.tokenSyncTimeoutSeconds)] as [bigint] : [] as [],
    maxPriceHistoryEntries: configInputs.value.maxPriceHistoryEntries > 0 ? [BigInt(Math.round(configInputs.value.maxPriceHistoryEntries))] as [bigint] : [] as [],
    priceUpdateIntervalNS: [] as []
  };
  
  await tacoStore.updateRebalanceConfig(updates, reason);
  
  // Update max portfolio snapshots separately if it changed
  if (configInputs.value.maxPortfolioSnapshots !== originalMaxPortfolioSnapshots.value) {
    await tacoStore.updateMaxPortfolioSnapshots(configInputs.value.maxPortfolioSnapshots);
  }
  
  console.log('Configuration updated successfully');
};

const updateConfig = async () => {
  // Legacy method - now just calls the confirmation dialog
  showConfigUpdateConfirmation();
};

const resetConfig = () => {
  if (rebalanceConfig.value) {
    configInputs.value = {
      maxSlippageBasisPoints: Number(rebalanceConfig.value.maxSlippageBasisPoints) / 100,
      minTradeValueICP: Number(rebalanceConfig.value.minTradeValueICP),
      maxTradeValueICP: Number(rebalanceConfig.value.maxTradeValueICP),
      maxTradesStored: Number(rebalanceConfig.value.maxTradesStored),
      maxTradeAttemptsPerInterval: Number(rebalanceConfig.value.maxTradeAttemptsPerInterval),
      maxKongswapAttempts: Number(rebalanceConfig.value.maxKongswapAttempts),
      rebalanceIntervalMinutes: nsToMinutes(rebalanceConfig.value.rebalanceIntervalNS),
      portfolioRebalancePeriodMinutes: nsToMinutes(rebalanceConfig.value.portfolioRebalancePeriodNS),
      shortSyncIntervalSeconds: nsToSeconds(rebalanceConfig.value.shortSyncIntervalNS),
      longSyncIntervalMinutes: nsToMinutes(rebalanceConfig.value.longSyncIntervalNS),
      tokenSyncTimeoutSeconds: nsToSeconds(rebalanceConfig.value.tokenSyncTimeoutNS),
      maxPriceHistoryEntries: originalMaxPriceHistoryEntries.value,
      maxPortfolioSnapshots: originalMaxPortfolioSnapshots.value
    };
    hasConfigChanges.value = false;
  }
};

const configLoading = ref(true);
const configError = ref<string | null>(null);

const loadConfig = async () => {
  configLoading.value = true;
  configError.value = null;
  try {
    await tacoStore.getRebalanceConfig();
    //await tacoStore.getSystemParameters();
    if (!tacoStore.rebalanceConfig) {
      throw new Error('Failed to load configuration');
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    configError.value = 'Failed to load configuration. Please try again.';
  } finally {
    configLoading.value = false;
  }
};

const retryLoadConfig = () => {
  loadConfig();
};

// New function for refreshing trading logs
async function refreshTradingLogs() {
  console.log('AdminView: refreshTradingLogs called');
  await tacoStore.refreshTimerStatus();
  console.log('AdminView: refreshTradingLogs completed');
}

async function executeTradingCycle() {
  console.log('AdminView: executeTradingCycle called');
  
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus();
  
  if (isAdmin.value) {
      // User is admin - show direct action confirmation
      showExecuteTradingCycleConfirmation();
  } else {
      // User is not admin - show proposal creation dialog
      proposalFunctionName.value = 'executeTradingCycle';
      proposalReasonPlaceholder.value = 'Please explain why a trading cycle should be executed...';
      showProposalDialog.value = true;
  }
}

// Add these functions
// Helper function to get trading pause info for a token
const getTradingPauseInfo = (tokenPrincipal: Principal) => {
  const pause = tradingPauses.value.find(p => p.token.toString() === tokenPrincipal.toString());
  if (!pause) return null;
  
  if ('PriceAlert' in pause.reason) {
    return {
      type: 'PriceAlert',
      conditionName: pause.reason.PriceAlert.conditionName,
      triggeredAt: pause.reason.PriceAlert.triggeredAt
    };
  } else if ('CircuitBreaker' in pause.reason) {
    return {
      type: 'CircuitBreaker',
      reason: pause.reason.CircuitBreaker.reason,
      severity: pause.reason.CircuitBreaker.severity,
      triggeredAt: pause.reason.CircuitBreaker.triggeredAt
    };
  }
  return null;
};

const getTokenStatusClass = (token: any, principal?: Principal) => {
  if (!token.Active) return 'inactive';
  
  const tradingPause = principal ? getTradingPauseInfo(principal) : null;
  if (tradingPause) {
    if (tradingPause.type === 'PriceAlert') return 'paused price-alert';
    if (tradingPause.type === 'CircuitBreaker') return 'paused circuit-breaker';
  }
  
  if (token.isPaused) return 'paused manual';
  if (token.pausedDueToSyncFailure) return 'paused sync-failure';
  
  return 'active';
};

const getTokenStatusText = (token: any, principal?: Principal) => {
  if (!token.Active) return '(Inactive)';
  
  let statuses = [];
  if (token.isPaused) statuses.push('Manually Paused');
  if (token.pausedDueToSyncFailure) statuses.push('Sync Failed');
  
  if (principal) {
    const tradingPause = getTradingPauseInfo(principal);
    if (tradingPause) {
      if (tradingPause.type === 'PriceAlert') {
        statuses.push(`Price Alert: ${tradingPause.conditionName}`);
      } else if (tradingPause.type === 'CircuitBreaker') {
        statuses.push(`Circuit Breaker: ${tradingPause.reason}`);
      }
    }
  }
  
  return statuses.length ? `(${statuses.join(', ')})` : '';
};

// Modal helper functions
const showPauseConfirmation = async (principal: string, tokenName: string) => {
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus();
  
  if (isAdmin.value) {
    // User is admin - show direct action confirmation
    confirmationModal.value = {
      show: true,
      title: 'Pause Token',
      message: `Are you sure you want to pause ${tokenName}?`,
      extraData: `Principal: ${principal}`,
      confirmButtonText: 'Pause Token',
      confirmButtonClass: 'btn-warning',
      reasonPlaceholder: 'Please explain why this token should be paused...',
      submitting: false,
      action: null,
      actionData: { principal, tokenName }
    };
  } else {
    // User is not admin - show proposal creation dialog
    proposalFunctionName.value = 'pauseToken';
    proposalReasonPlaceholder.value = `Please explain why ${tokenName} should be paused...`;
    proposalContextParams.value = {
      tokenPrincipal: Principal.fromText(principal)
    };
    showProposalDialog.value = true;
  }
};

const showUnpauseConfirmation = async (principal: string, tokenName: string) => {
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus();
  
  if (isAdmin.value) {
    // User is admin - show direct action confirmation
    confirmationModal.value = {
      show: true,
      title: 'Unpause Token',
      message: `Are you sure you want to unpause ${tokenName}?`,
      extraData: `Principal: ${principal}`,
      confirmButtonText: 'Unpause Token',
      confirmButtonClass: 'btn-success',
      reasonPlaceholder: 'Please explain why this token should be unpaused...',
      submitting: false,
      action: null,
      actionData: { principal, tokenName }
    };
  } else {
    // User is not admin - show proposal creation dialog
    proposalFunctionName.value = 'unpauseToken';
    proposalReasonPlaceholder.value = `Please explain why ${tokenName} should be unpaused...`;
    proposalContextParams.value = {
      tokenPrincipal: Principal.fromText(principal)
    };
    showProposalDialog.value = true;
  }
};

const showConfigUpdateConfirmation = async () => {
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus();
  
  if (isAdmin.value) {
    // User is admin - show direct action confirmation
    confirmationModal.value = {
      show: true,
      title: 'Update Configuration',
      message: 'Are you sure you want to update the rebalance configuration?',
      extraData: 'This will change how the Treasury manages rebalancing operations.',
      confirmButtonText: 'Update Configuration',
      confirmButtonClass: 'btn-primary',
      reasonPlaceholder: 'Please explain why this configuration change is needed...',
      submitting: false,
      action: null,
      actionData: { type: 'configUpdate' }
    };
  } else {
    // User is not admin - show proposal creation dialog for config update
    // Determine if we need one or two proposals
    const needsMaxPortfolioSnapshotsProposal = configInputs.value.maxPortfolioSnapshots !== originalMaxPortfolioSnapshots.value;
    const needsRebalanceConfigProposal = hasRebalanceConfigChanges();
    
    if (needsRebalanceConfigProposal && needsMaxPortfolioSnapshotsProposal) {
      // Need two proposals - show info first
      proposalFunctionName.value = 'updateRebalanceConfig';
      proposalReasonPlaceholder.value = 'Please explain why this configuration change is needed... (Note: This will create 2 proposals - one for config updates and one for max portfolio snapshots)';
    } else if (needsMaxPortfolioSnapshotsProposal) {
      proposalFunctionName.value = 'updateMaxPortfolioSnapshots';
      proposalReasonPlaceholder.value = 'Please explain why the max portfolio snapshots limit should be changed...';
    } else {
      proposalFunctionName.value = 'updateRebalanceConfig';
      proposalReasonPlaceholder.value = 'Please explain why this configuration change is needed...';
    }
    
    // Build the context params with the config updates
    proposalContextParams.value = buildConfigProposalParams();
    showProposalDialog.value = true;
  }
};

// Helper function to check if any rebalance config values (excluding maxPortfolioSnapshots) have changed
const hasRebalanceConfigChanges = () => {
  if (!rebalanceConfig.value) return false;
  const current = configInputs.value;
  const original = rebalanceConfig.value;
  
  return (
    current.maxSlippageBasisPoints * 100 !== Number(original.maxSlippageBasisPoints) ||
    current.minTradeValueICP !== Number(original.minTradeValueICP) ||
    current.maxTradeValueICP !== Number(original.maxTradeValueICP) ||
    current.maxTradesStored !== Number(original.maxTradesStored) ||
    current.maxTradeAttemptsPerInterval !== Number(original.maxTradeAttemptsPerInterval) ||
    current.maxKongswapAttempts !== Number(original.maxKongswapAttempts) ||
    String(minutesToNs(current.rebalanceIntervalMinutes)) !== String(original.rebalanceIntervalNS) ||
    String(minutesToNs(current.portfolioRebalancePeriodMinutes)) !== String(original.portfolioRebalancePeriodNS) ||
    String(secondsToNs(current.shortSyncIntervalSeconds)) !== String(original.shortSyncIntervalNS) ||
    String(minutesToNs(current.longSyncIntervalMinutes)) !== String(original.longSyncIntervalNS) ||
    String(secondsToNs(current.tokenSyncTimeoutSeconds)) !== String(original.tokenSyncTimeoutNS) ||
    current.maxPriceHistoryEntries !== originalMaxPriceHistoryEntries.value
  );
};

// Build the config proposal parameters
const buildConfigProposalParams = () => {
  const needsMaxPortfolioSnapshotsProposal = configInputs.value.maxPortfolioSnapshots !== originalMaxPortfolioSnapshots.value;
  const needsRebalanceConfigProposal = hasRebalanceConfigChanges();
  
  // Build UpdateConfig record with only changed values as optional
  const updateConfig = {
    maxSlippageBasisPoints: [BigInt(Math.round(configInputs.value.maxSlippageBasisPoints * 100))],
    minTradeValueICP: [BigInt(Math.round(configInputs.value.minTradeValueICP))],
    maxTradeValueICP: [BigInt(Math.round(configInputs.value.maxTradeValueICP))],
    maxTradesStored: [BigInt(Math.round(configInputs.value.maxTradesStored))],
    maxTradeAttemptsPerInterval: [BigInt(Math.round(configInputs.value.maxTradeAttemptsPerInterval))],
    maxKongswapAttempts: [BigInt(Math.round(configInputs.value.maxKongswapAttempts))],
    rebalanceIntervalNS: [minutesToNs(configInputs.value.rebalanceIntervalMinutes)],
    portfolioRebalancePeriodNS: [minutesToNs(configInputs.value.portfolioRebalancePeriodMinutes)],
    shortSyncIntervalNS: [secondsToNs(configInputs.value.shortSyncIntervalSeconds)],
    longSyncIntervalNS: [minutesToNs(configInputs.value.longSyncIntervalMinutes)],
    tokenSyncTimeoutNS: configInputs.value.tokenSyncTimeoutSeconds > 0 ? [secondsToNs(configInputs.value.tokenSyncTimeoutSeconds)] : [],
    maxPriceHistoryEntries: configInputs.value.maxPriceHistoryEntries > 0 ? [BigInt(Math.round(configInputs.value.maxPriceHistoryEntries))] : [],
    priceUpdateIntervalNS: []
  };
  
  return {
    updateConfig,
    rebalanceStateNew: [],  // Keep current state
    newLimit: BigInt(configInputs.value.maxPortfolioSnapshots),
    needsRebalanceConfigProposal,
    needsMaxPortfolioSnapshotsProposal
  };
};

const showStartRebalancingConfirmation = () => {
  confirmationModal.value = {
    show: true,
    title: 'Start Trading',
    message: 'Are you sure you want to start the trading algorithm?',
    extraData: 'This will enable automatic trading and rebalancing operations.',
    confirmButtonText: 'Start Trading',
    confirmButtonClass: 'btn-success',
    reasonPlaceholder: 'Please explain why trading is being started...',
    submitting: false,
    action: null,
    actionData: { type: 'startRebalancing' }
  };
};

const showStopRebalancingConfirmation = () => {
  confirmationModal.value = {
    show: true,
    title: 'Stop Trading',
    message: 'Are you sure you want to stop the trading algorithm?',
    extraData: 'This will disable automatic trading and rebalancing operations.',
    confirmButtonText: 'Stop Trading',
    confirmButtonClass: 'btn-danger',
    reasonPlaceholder: 'Please explain why trading is being stopped...',
    submitting: false,
    action: null,
    actionData: { type: 'stopRebalancing' }
  };
};

const showManualPortfolioSnapshotConfirmation = () => {
  confirmationModal.value = {
    show: true,
    title: 'Take Manual Portfolio Snapshot',
    message: 'Are you sure you want to trigger a manual portfolio snapshot?',
    extraData: 'This will capture the current state of all portfolio positions.',
    confirmButtonText: 'Take Snapshot',
    confirmButtonClass: 'btn-warning',
    reasonPlaceholder: 'Please explain why a manual portfolio snapshot is needed...',
    submitting: false,
    action: null,
    actionData: { type: 'manualPortfolioSnapshot' }
  };
};

const showManualNeuronSnapshotConfirmation = () => {
  confirmationModal.value = {
    show: true,
    title: 'Take Manual Neuron Snapshot',
    message: 'Are you sure you want to trigger a manual neuron snapshot?',
    extraData: 'This will capture the current state of all neuron voting power data.',
    confirmButtonText: 'Take Snapshot',
    confirmButtonClass: 'btn-warning',
    reasonPlaceholder: 'Please explain why a manual neuron snapshot is needed...',
    submitting: false,
    action: null,
    actionData: { type: 'manualNeuronSnapshot' }
  };
};

// Legacy alias
const showManualSnapshotConfirmation = showManualPortfolioSnapshotConfirmation;

const showExecuteTradingCycleConfirmation = () => {
  confirmationModal.value = {
    show: true,
    title: 'Execute Trading Cycle',
    message: 'Are you sure you want to execute a manual trading cycle?',
    extraData: 'This will immediately run one complete trading cycle regardless of the current schedule.',
    confirmButtonText: 'Execute Cycle',
    confirmButtonClass: 'btn-warning',
    reasonPlaceholder: 'Please explain why a manual trading cycle is needed...',
    submitting: false,
    action: null,
    actionData: { type: 'executeTradingCycle' }
  };
};

const hideConfirmationModal = () => {
  confirmationModal.value.show = false;
  confirmationModal.value.submitting = false;
  confirmationModal.value.action = null;
  confirmationModal.value.actionData = null;
};

const handleConfirmAction = async (reason: string) => {
  if (!confirmationModal.value.actionData) return;
  
  confirmationModal.value.submitting = true;
  
  try {
    let success = false;
    const actionData = confirmationModal.value.actionData as any;
    
    if (confirmationModal.value.title === 'Update Configuration') {
      // Handle configuration update
      await updateConfigWithReason(reason);
      success = true;
    } else if (actionData.type === 'startRebalancing') {
      // Handle start trading
      success = await tacoStore.startRebalancing(reason);
      if (success) {
        await refreshTimerStatus();
        console.log('AdminView: Trading started');
      }
    } else if (actionData.type === 'stopRebalancing') {
      // Handle stop trading
      success = await tacoStore.stopRebalancing(reason);
      if (success) {
        await refreshTimerStatus();
        console.log('AdminView: Trading stopped');
      }
    } else if (actionData.type === 'manualSnapshot' || actionData.type === 'manualPortfolioSnapshot') {
      // Handle manual portfolio snapshot
      await tacoStore.takeManualPortfolioSnapshot(reason);
      console.log('AdminView: Manual portfolio snapshot triggered');
      success = true;
    } else if (actionData.type === 'manualNeuronSnapshot') {
      // Handle manual neuron snapshot
      await tacoStore.takeNeuronSnapshot();
      console.log('AdminView: Manual neuron snapshot triggered');
      success = true;
    } else if (actionData.type === 'executeTradingCycle') {
      // Handle execute trading cycle
      await tacoStore.executeTradingCycle(reason);
      await refreshTimerStatus();
      console.log('AdminView: Trading cycle executed');
      success = true;
    } else if (actionData.type === 'updateSnapshotInterval') {
      // Handle update snapshot interval
      await updateSnapshotInterval(reason);
      console.log('AdminView: Snapshot interval updated');
      success = true;
    } else if (actionData.type === 'startPortfolioSnapshots') {
      // Handle start portfolio snapshots
      success = await tacoStore.startPortfolioSnapshots(reason);
      if (success) {
        await refreshPortfolioSnapshotStatus();
        console.log('AdminView: Portfolio snapshots started');
      }
    } else if (actionData.type === 'stopPortfolioSnapshots') {
      // Handle stop portfolio snapshots
      success = await tacoStore.stopPortfolioSnapshots(reason);
      if (success) {
        await refreshPortfolioSnapshotStatus();
        console.log('AdminView: Portfolio snapshots stopped');
      }
    } else if (actionData.type === 'updatePortfolioSnapshotInterval') {
      // Handle update portfolio snapshot interval
      success = await tacoStore.updatePortfolioSnapshotInterval(actionData.intervalMinutes, reason);
      if (success) {
        await refreshPortfolioSnapshotStatus();
        console.log('AdminView: Portfolio snapshot interval updated');
      }
    } else if (actionData.type === 'updateSystemParameters') {
      // Handle system parameters update
      success = await updateSystemParameters(reason);
      if (success) {
        console.log('AdminView: System parameters updated');
      }
    } else if (actionData.type === 'syncWithDao') {
      // Handle force treasury sync
      await tacoStore.triggerManualSync();
      await refreshTimerStatus();
      console.log('AdminView: Manual sync triggered');
      success = true;
    } else if (actionData.type === 'recoverPoolBalances') {
      // Handle recover pool balances
      isRecoveringBalances.value = true;
      try {
        await tacoStore.recoverPoolBalances();
        console.log('AdminView: Pool balances recovered');
        success = true;
      } catch (error) {
        console.error('AdminView: Error recovering pool balances:', error);
        success = false;
      } finally {
        isRecoveringBalances.value = false;
      }
    } else if (actionData.principal && actionData.tokenName) {
      // Handle token pause/unpause actions
      const { principal, tokenName } = actionData;
      
      if (confirmationModal.value.title === 'Pause Token') {
        success = await tacoStore.pauseToken(Principal.fromText(principal), reason);
      } else if (confirmationModal.value.title === 'Unpause Token') {
        success = await tacoStore.unpauseToken(Principal.fromText(principal), reason);
      }
      
      if (success) {
        await refreshTimerStatus();
      }
    }
    
    if (success) {
      console.log(`AdminView: ${confirmationModal.value.title} completed successfully`);
      hideConfirmationModal();
    } else {
      console.error(`AdminView: Failed to ${confirmationModal.value.title.toLowerCase()}`);
      // Keep modal open to show error state
      confirmationModal.value.submitting = false;
    }
  } catch (error) {
    console.error(`AdminView: Error in ${confirmationModal.value.title}:`, error);
    confirmationModal.value.submitting = false;
  }
};

// Legacy pauseToken and unpauseToken functions replaced by modal approach above

// Add refreshVotingMetrics function
const refreshVotingMetrics = async () => {
  try {
    // Fetch metrics and allocations in parallel
    await Promise.all([
      tacoStore.fetchVotingPowerMetrics(),
      tacoStore.fetchAggregateAllocation()
    ]);

    // Get the metrics from the store using the reactive ref
    const rawMetrics = fetchedVotingPowerMetrics.value;
    console.log('Raw metrics from backend:', rawMetrics);

    // Get the allocations from the store using the reactive ref
    const rawAllocations = fetchedAggregateAllocation.value;
    console.log('Raw allocations from backend:', rawAllocations);

    // Update voting metrics
    if (rawMetrics?.ok) {
      votingMetrics.value = {
        totalVotingPower: rawMetrics.ok.totalVotingPower,
        totalVotingPowerByHotkeySetters: rawMetrics.ok.totalVotingPowerByHotkeySetters,
        allocatedVotingPower: rawMetrics.ok.allocatedVotingPower,
        principalCount: rawMetrics.ok.principalCount,
        neuronCount: rawMetrics.ok.neuronCount
      };
      console.log('Updated voting metrics:', votingMetrics.value);
    } else {
      console.error('Invalid metrics format:', rawMetrics);
    }

    // Update aggregate allocation
    if (rawAllocations && Array.isArray(rawAllocations)) {
      console.log('Processing raw allocations:', rawAllocations);
      
      // Ensure we have token details before processing allocations
      if (!tokenDetailsRef.value || !Array.isArray(tokenDetailsRef.value)) {
        console.log('Fetching token details first...');
        await tacoStore.fetchTokenDetails();
      }
      
      aggregateAllocation.value = rawAllocations.map(([token, basisPoints]) => {
        try {
          if (!token || !basisPoints) {
            console.warn('Invalid allocation entry:', { token, basisPoints });
            return null;
          }
          
          const allocation = {
            token: token,
            basisPoints: Number(basisPoints),
            votingPower: calculateVotingPower(basisPoints, votingMetrics.value.allocatedVotingPower)
          };
          console.log('Processed allocation:', allocation);
          return allocation;
        } catch (err) {
          console.error('Error processing allocation entry:', err);
          return null;
        }
      }).filter(Boolean); // Remove any null entries
      
      console.log('Updated aggregate allocation:', aggregateAllocation.value);
    } else {
      console.error('Invalid allocations format:', rawAllocations);
    }

  } catch (error) {
    console.error('Error refreshing voting metrics:', error);
  }
};

// Add helper functions
function calculateVotingPower(basisPoints: bigint, totalVotingPower: bigint): bigint {
    if (!totalVotingPower) return 0n;
    return (totalVotingPower * basisPoints) / 10000n;
}

function formatNumber(value: bigint | number | undefined): string {
    if (value === undefined) return '0';
    const numValue = typeof value === 'bigint' ? Number(value) : value;
    return new Intl.NumberFormat().format(numValue);
}

function calculateUtilization(metrics: typeof votingMetrics.value): string {
    if (!metrics.totalVotingPower || metrics.totalVotingPower === 0n) return '0';
    const utilization = (Number(metrics.allocatedVotingPower) / Number(metrics.totalVotingPower)) * 100;
    return utilization.toFixed(2);
}

// Cache a lookup map to avoid repeated scans and warnings during render
const warnedUnknownTokens = new Set<string>();
const tokenSymbolByPrincipal = computed(() => {
    if (!Array.isArray(tokenDetailsRef.value) || tokenDetailsRef.value.length === 0) {
        return new Map<string, string>();
    }
    try {
        const map = new Map<string, string>();
        (tokenDetailsRef.value as any[]).forEach((entry: any) => {
            if (!entry || entry.length < 2) return;
            const p = entry[0];
            const d = entry[1];
            const id = p?.toText ? p.toText() : String(p);
            map.set(id, d?.tokenSymbol ?? '');
        });
        return map;
    } catch {
        return new Map<string, string>();
    }
});

function getTokenSymbol(principal: any): string {
    try {
        const principalText = typeof principal === 'string'
            ? principal
            : ((principal as any)?.toText ? (principal as any).toText() : String(principal));

        const symbol = tokenSymbolByPrincipal.value.get(principalText);
        if (symbol) return symbol;

        // If token details aren't loaded yet, avoid spamming warnings during initial renders
        if (tokenSymbolByPrincipal.value.size === 0) return 'Unknown';

        if (!warnedUnknownTokens.has(principalText)) {
            console.warn('Token not found for principal:', principalText);
            warnedUnknownTokens.add(principalText);
        }
        return 'Unknown';
    } catch (error) {
        console.error('Error getting token symbol:', error);
        return 'Unknown';
    }
}

// Add new function for refreshing voter details
async function refreshVoterDetails() {
  console.log('AdminView: refreshVoterDetails called');
  try {
    await tacoStore.fetchVoterDetails();
    console.log('AdminView: Voter details refreshed');
  } catch (error) {
    console.error('AdminView: Error refreshing voter details:', error);
  }
}

// Add helper function for formatting allocations
function formatAllocation(allocation: any): string {
  if (!allocation || !Array.isArray(allocation)) return 'No allocation';
  return allocation.map(a => {
    const token = getTokenSymbol(a.token);
    const percentage = (Number(a.basisPoints) / 100).toFixed(2);
    return `${token}: ${percentage}%`;
  }).join(', ');
}

// Add this computed property near the other computed properties
const filteredVoterDetails = computed(() => {
  if (!fetchedVoterDetails.value) return [];
  
  return fetchedVoterDetails.value.filter(voter => {
    // Filter for active voters if the toggle is on
    if (showOnlyActive.value && (!voter.state.allocations || !Array.isArray(voter.state.allocations) || voter.state.allocations.length === 0)) {
      return false;
    }
    
    // Filter for following voters if the toggle is on
    if (showOnlyFollowing.value && (!voter.state.allocationFollows || voter.state.allocationFollows.length === 0)) {
      return false;
    }
    
    return true;
  });
});

// Add this function with other functions
async function refreshNeuronAllocations() {
  console.log('AdminView: refreshNeuronAllocations called');
  try {
    await tacoStore.fetchNeuronAllocations();
    console.log('AdminView: Neuron allocations refreshed');
  } catch (error) {
    console.error('AdminView: Error refreshing neuron allocations:', error);
  }
}

// Add this function with other utility functions
function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Add new function for updating snapshot interval
const snapshotIntervalMinutes = ref(15); // Default to 15 minutes

// Portfolio snapshot management
const portfolioSnapshotStatus = ref({
  status: { Stopped: null } as { Running: null } | { Stopped: null },
  intervalMinutes: 60,
  lastSnapshotTime: 0
});
const newPortfolioSnapshotInterval = ref(60);

// System Parameters
const systemParametersData = ref(null as any);
const systemParametersInputs = ref({
  FollowDepth: 1,
  MaxFollowed: 3,
  MaxFollowUnfollowActionsPerDay: 10,
  MaxAllocationsPerDay: 5,
  AllocationWindowHours: 24,
  MaxFollowers: 500,
  MaxTotalUpdates: 2000,
  MaxPastAllocations: 100
});
const originalSystemParameters = ref({} as any);
const isSystemParametersValid = ref(true);
const hasSystemParametersChanges = ref(false);

// Add refresh user voting power function
async function refreshUserVotingPower() {
    refreshingVP.value = true;
    try {
        await tacoStore.refreshUserVotingPower();
        console.log('AdminView: User voting power refreshed successfully');
    } catch (error) {
        console.error('AdminView: Error refreshing user voting power:', error);
    } finally {
        refreshingVP.value = false;
    }
}

// Portfolio snapshot management functions
async function refreshPortfolioSnapshotStatus() {
    try {
        const status = await tacoStore.getPortfolioSnapshotStatus();
        portfolioSnapshotStatus.value = status;
        newPortfolioSnapshotInterval.value = status.intervalMinutes;
        console.log('AdminView: Portfolio snapshot status refreshed');
    } catch (error) {
        console.error('AdminView: Error refreshing portfolio snapshot status:', error);
    }
}

async function showStartPortfolioSnapshotsConfirmation() {
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        confirmationModal.value = {
            show: true,
            title: 'Start Portfolio Snapshots',
            message: 'Are you sure you want to start automatic portfolio snapshots?',
            extraData: '',
            confirmButtonText: 'Start',
            confirmButtonClass: 'btn-success',
            reasonPlaceholder: 'Please provide a reason for starting portfolio snapshots...',
            submitting: false,
            action: null,
            actionData: { type: 'startPortfolioSnapshots' }
        };
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'startPortfolioSnapshots';
        proposalReasonPlaceholder.value = 'Please explain why portfolio snapshots should be started...';
        proposalContextParams.value = {};
        showProposalDialog.value = true;
    }
}

async function showStopPortfolioSnapshotsConfirmation() {
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        confirmationModal.value = {
            show: true,
            title: 'Stop Portfolio Snapshots',
            message: 'Are you sure you want to stop automatic portfolio snapshots?',
            extraData: '',
            confirmButtonText: 'Stop',
            confirmButtonClass: 'btn-danger',
            reasonPlaceholder: 'Please provide a reason for stopping portfolio snapshots...',
            submitting: false,
            action: null,
            actionData: { type: 'stopPortfolioSnapshots' }
        };
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'stopPortfolioSnapshots';
        proposalReasonPlaceholder.value = 'Please explain why portfolio snapshots should be stopped...';
        proposalContextParams.value = {};
        showProposalDialog.value = true;
    }
}

async function showUpdatePortfolioSnapshotIntervalConfirmation() {
    // Check if user is admin (await to ensure we have current status)
    await checkAdminStatus();
    
    if (isAdmin.value) {
        // User is admin - show direct action confirmation
        confirmationModal.value = {
            show: true,
            title: 'Update Portfolio Snapshot Interval',
            message: `Are you sure you want to update the portfolio snapshot interval to ${newPortfolioSnapshotInterval.value} minutes?`,
            extraData: '',
            confirmButtonText: 'Update',
            confirmButtonClass: 'btn-primary',
            reasonPlaceholder: 'Please provide a reason for updating the interval...',
            submitting: false,
            action: null,
            actionData: { 
                type: 'updatePortfolioSnapshotInterval',
                intervalMinutes: newPortfolioSnapshotInterval.value
            }
        };
    } else {
        // User is not admin - show proposal creation dialog
        proposalFunctionName.value = 'updatePortfolioSnapshotInterval';
        proposalReasonPlaceholder.value = `Please explain why the portfolio snapshot interval should be changed to ${newPortfolioSnapshotInterval.value} minutes...`;
        proposalContextParams.value = {
            intervalMinutes: BigInt(newPortfolioSnapshotInterval.value)
        };
        showProposalDialog.value = true;
    }
}

// Fetch trading pauses
const fetchTradingPauses = async () => {
    try {
        const result = await listTradingPauses();
        tradingPauses.value = result.pausedTokens;
        console.log('AdminView: Trading pauses fetched:', result.pausedTokens.length);
    } catch (error) {
        console.error('AdminView: Error fetching trading pauses:', error);
        tradingPauses.value = [];
    }
};

const showUpdateSnapshotIntervalConfirmation = async () => {
  if (!snapshotIntervalMinutes.value || snapshotIntervalMinutes.value < 1) return;
  
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus();
  
  if (isAdmin.value) {
    // User is admin - show direct action confirmation
    confirmationModal.value = {
      show: true,
      title: 'Update Neuron Snapshot Interval',
      message: `Are you sure you want to update the neuron snapshot interval to ${snapshotIntervalMinutes.value} minutes?`,
      extraData: 'This will change how frequently the system takes snapshots of neuron voting power data.',
      confirmButtonText: 'Update Interval',
      confirmButtonClass: 'btn-primary',
      reasonPlaceholder: 'Please explain why the neuron snapshot interval should be changed...',
      submitting: false,
      action: null,
      actionData: { type: 'updateSnapshotInterval' }
    };
  } else {
    // User is not admin - show proposal creation dialog
    // This uses the updateSystemParameter function with SnapshotInterval variant
    const intervalNS = BigInt(snapshotIntervalMinutes.value) * 60n * 1_000_000_000n;
    
    proposalFunctionName.value = 'updateSystemParameter';
    proposalReasonPlaceholder.value = `Please explain why the neuron snapshot interval should be changed to ${snapshotIntervalMinutes.value} minutes...`;
    proposalContextParams.value = {
      systemParameterChanges: [{
        key: 'SnapshotInterval',
        variant: { SnapshotInterval: intervalNS },
        displayName: 'Neuron Snapshot Interval'
      }]
    };
    showProposalDialog.value = true;
  }
};

async function updateSnapshotInterval(reason?: string) {
  if (!snapshotIntervalMinutes.value || snapshotIntervalMinutes.value < 1) return;
  
  try {
    // Convert minutes to nanoseconds
    const intervalNS = BigInt(snapshotIntervalMinutes.value) * 60n * 1_000_000_000n;
    await tacoStore.updateSnapshotInterval(intervalNS, reason);
    await refreshTimerStatus();
  } catch (error) {
    console.error('Error updating snapshot interval:', error);
  }
}

function calculateNextExpectedSnapshot(): bigint | null {
  if (!snapshotStatus.value.lastSnapshotTime) return null;
  const intervalNS = BigInt(snapshotIntervalMinutes.value) * 60n * 1_000_000_000n;
  return snapshotStatus.value.lastSnapshotTime + intervalNS;
}

// Helper function to create vote history link
const createVoteHistoryLink = (principal: Principal | string): string => {
  const principalStr = typeof principal === 'string' ? principal : principal.toString();
  return `/admin/votes?principal=${encodeURIComponent(principalStr)}`;
};

// Trading bot warning logic
const getTradingBotWarning = (): { level: 'none' | 'warning' | 'danger', message: string } => {
  if (!timerHealth.value.treasury.tradingMetrics?.lastRebalanceAttempt || !rebalanceConfig.value?.rebalanceIntervalNS) {
    return { level: 'none', message: '' };
  }

  const now = Date.now() * 1_000_000; // Convert to nanoseconds
  const lastAttempt = Number(timerHealth.value.treasury.tradingMetrics.lastRebalanceAttempt);
  const intervalNS = Number(rebalanceConfig.value.rebalanceIntervalNS);
  const timeSinceLastAttempt = now - lastAttempt;
  const periodsSinceLastAttempt = timeSinceLastAttempt / intervalNS;

  if (periodsSinceLastAttempt > 5) {
    const periodsOverdue = Math.floor(periodsSinceLastAttempt);
    return { 
      level: 'danger', 
      message: `⚠️ Trading bot is ${periodsOverdue} periods overdue! Last attempt was ${Math.floor(periodsSinceLastAttempt)} intervals ago.` 
    };
  } else if (periodsSinceLastAttempt > 2) {
    const periodsOverdue = Math.floor(periodsSinceLastAttempt);
    return { 
      level: 'warning', 
      message: `⚠️ Trading bot is ${periodsOverdue} periods overdue. Last attempt was ${Math.floor(periodsSinceLastAttempt)} intervals ago.` 
    };
  }

  return { level: 'none', message: '' };
};

// System Parameters Functions
async function refreshSystemParameters() {
  try {
    const params = await tacoStore.getSystemParameters();
    systemParametersData.value = params;
    
    // Convert parameters to input format
    const inputs = { ...systemParametersInputs.value };
    
    if (params && Array.isArray(params)) {
      params.forEach((param: any) => {
        if ('FollowDepth' in param) inputs.FollowDepth = Number(param.FollowDepth);
        else if ('MaxFollowed' in param) inputs.MaxFollowed = Number(param.MaxFollowed);
        else if ('MaxFollowUnfollowActionsPerDay' in param) inputs.MaxFollowUnfollowActionsPerDay = Number(param.MaxFollowUnfollowActionsPerDay);
        else if ('MaxAllocationsPerDay' in param) inputs.MaxAllocationsPerDay = Number(param.MaxAllocationsPerDay);
        else if ('AllocationWindow' in param) inputs.AllocationWindowHours = Number(param.AllocationWindow) / (60 * 60 * 1_000_000_000);
        else if ('MaxFollowers' in param) inputs.MaxFollowers = Number(param.MaxFollowers);
        else if ('MaxTotalUpdates' in param) inputs.MaxTotalUpdates = Number(param.MaxTotalUpdates);
        else if ('MaxPastAllocations' in param) inputs.MaxPastAllocations = Number(param.MaxPastAllocations);
      });
    }
    
    systemParametersInputs.value = inputs;
    originalSystemParameters.value = { ...inputs };
    hasSystemParametersChanges.value = false;
    
    console.log('AdminView: System parameters refreshed');
  } catch (error) {
    console.error('AdminView: Error refreshing system parameters:', error);
  }
}

function validateSystemParameterInput(field: string) {
  const value = (systemParametersInputs.value as any)[field];
  let isValid = true;
  
  switch (field) {
    case 'FollowDepth':
      isValid = value >= 1 && value <= 3;
      break;
    case 'MaxFollowed':
      isValid = value >= 1 && value <= 10;
      break;
    case 'MaxFollowUnfollowActionsPerDay':
      isValid = value >= 9 && value <= 100;
      break;
    case 'MaxAllocationsPerDay':
      isValid = value >= 1 && value <= 10;
      break;
    case 'AllocationWindowHours':
      isValid = value >= 1 && value <= 168;
      break;
    case 'MaxFollowers':
      isValid = value >= 50 && value <= 5000;
      break;
    case 'MaxTotalUpdates':
      isValid = value >= 200 && value <= 10000;
      break;
    case 'MaxPastAllocations':
      isValid = value >= 20 && value <= 500;
      break;
  }
  
  // Update validation state
  checkSystemParametersChanges();
  
  return isValid;
}

function checkSystemParametersChanges() {
  const current = systemParametersInputs.value as any;
  const original = originalSystemParameters.value as any;
  
  hasSystemParametersChanges.value = Object.keys(current).some(key => current[key] !== original[key]);
  
  // Validate all fields
  isSystemParametersValid.value = 
    current.FollowDepth >= 1 && current.FollowDepth <= 3 &&
    current.MaxFollowed >= 1 && current.MaxFollowed <= 10 &&
    current.MaxFollowUnfollowActionsPerDay >= 9 && current.MaxFollowUnfollowActionsPerDay <= 100 &&
    current.MaxAllocationsPerDay >= 1 && current.MaxAllocationsPerDay <= 10 &&
    current.AllocationWindowHours >= 1 && current.AllocationWindowHours <= 168 &&
    current.MaxFollowers >= 50 && current.MaxFollowers <= 5000 &&
    current.MaxTotalUpdates >= 200 && current.MaxTotalUpdates <= 10000 &&
    current.MaxPastAllocations >= 20 && current.MaxPastAllocations <= 500;
}

function resetSystemParameters() {
  systemParametersInputs.value = { ...originalSystemParameters.value as any };
  hasSystemParametersChanges.value = false;
  isSystemParametersValid.value = true;
}

async function showSystemParametersUpdateConfirmation() {
  if (!isSystemParametersValid.value || !hasSystemParametersChanges.value) return;
  
  const changes: string[] = [];
  const current = systemParametersInputs.value as any;
  const original = originalSystemParameters.value as any;
  
  Object.keys(current).forEach(key => {
    if (current[key] !== original[key]) {
      changes.push(`${key}: ${original[key]} → ${current[key]}`);
    }
  });
  
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus();
  
  if (isAdmin.value) {
    // User is admin - show direct action confirmation
    confirmationModal.value = {
      show: true,
      title: 'Update System Parameters',
      message: `Are you sure you want to update these system parameters?\n\n${changes.join('\n')}`,
      extraData: '',
      confirmButtonText: 'Update Parameters',
      confirmButtonClass: 'btn-primary',
      reasonPlaceholder: 'Please provide a reason for updating system parameters...',
      submitting: false,
      action: null,
      actionData: { type: 'updateSystemParameters' }
    };
  } else {
    // User is not admin - show proposal creation dialog for system parameters update
    // Build the list of changed parameters for proposals
    const changedParams = buildSystemParameterChanges();
    const numProposals = changedParams.length;
    
    proposalFunctionName.value = 'updateSystemParameter';
    proposalReasonPlaceholder.value = numProposals > 1 
      ? `Please explain why these system parameters should be changed... (Note: This will create ${numProposals} proposals - one for each parameter)`
      : 'Please explain why this system parameter should be changed...';
    proposalContextParams.value = {
      systemParameterChanges: changedParams,
      changesDescription: changes.join('\n')
    };
    showProposalDialog.value = true;
  }
}

// Build the list of changed system parameters for proposals
function buildSystemParameterChanges() {
  const changes: { key: string; variant: Record<string, any>; displayName: string }[] = [];
  const current = systemParametersInputs.value as any;
  const original = originalSystemParameters.value as any;
  
  for (const [key, value] of Object.entries(current)) {
    if (value !== original[key]) {
      let variant: Record<string, any> = {};
      let displayName = key;
      
      switch (key) {
        case 'FollowDepth':
          variant = { FollowDepth: BigInt(value as number) };
          displayName = 'Follow Depth';
          break;
        case 'MaxFollowed':
          variant = { MaxFollowed: BigInt(value as number) };
          displayName = 'Max Followed';
          break;
        case 'MaxFollowUnfollowActionsPerDay':
          variant = { MaxFollowUnfollowActionsPerDay: BigInt(value as number) };
          displayName = 'Max Follow/Unfollow Actions Per Day';
          break;
        case 'MaxAllocationsPerDay':
          variant = { MaxAllocationsPerDay: BigInt(value as number) };
          displayName = 'Max Allocations Per Day';
          break;
        case 'AllocationWindowHours':
          const windowNS = BigInt(value as number) * 60n * 60n * 1_000_000_000n;
          variant = { AllocationWindow: windowNS };
          displayName = 'Allocation Window';
          break;
        case 'MaxFollowers':
          variant = { MaxFollowers: BigInt(value as number) };
          displayName = 'Max Followers';
          break;
        case 'MaxTotalUpdates':
          variant = { MaxTotalUpdates: BigInt(value as number) };
          displayName = 'Max Total Updates';
          break;
        case 'MaxPastAllocations':
          variant = { MaxPastAllocations: BigInt(value as number) };
          displayName = 'Max Past Allocations';
          break;
      }
      
      if (Object.keys(variant).length > 0) {
        changes.push({ key, variant, displayName });
      }
    }
  }
  
  return changes;
}

async function updateSystemParameters(reason?: string) {
  try {
    const current = systemParametersInputs.value as any;
    const original = originalSystemParameters.value as any;
    
    // Update each changed parameter
    for (const [key, value] of Object.entries(current)) {
      if (value !== original[key]) {
        let success = false;
        
        switch (key) {
          case 'FollowDepth':
            success = await tacoStore.updateSystemParameter({ FollowDepth: BigInt(value) }, reason);
            break;
          case 'MaxFollowed':
            success = await tacoStore.updateSystemParameter({ MaxFollowed: BigInt(value) }, reason);
            break;
          case 'MaxFollowUnfollowActionsPerDay':
            success = await tacoStore.updateSystemParameter({ MaxFollowUnfollowActionsPerDay: BigInt(value) }, reason);
            break;
          case 'MaxAllocationsPerDay':
            success = await tacoStore.updateSystemParameter({ MaxAllocationsPerDay: BigInt(value) }, reason);
            break;
          case 'AllocationWindowHours':
            const windowNS = BigInt(value) * 60n * 60n * 1_000_000_000n;
            success = await tacoStore.updateSystemParameter({ AllocationWindow: windowNS }, reason);
            break;
          case 'MaxFollowers':
            success = await tacoStore.updateSystemParameter({ MaxFollowers: BigInt(value) }, reason);
            break;
          case 'MaxTotalUpdates':
            success = await tacoStore.updateSystemParameter({ MaxTotalUpdates: BigInt(value) }, reason);
            break;
          case 'MaxPastAllocations':
            success = await tacoStore.updateSystemParameter({ MaxPastAllocations: BigInt(value) }, reason);
            break;
        }
        
        if (!success) {
          throw new Error(`Failed to update ${key}`);
        }
      }
    }
    
    // Refresh parameters after successful update
    await refreshSystemParameters();
    
    console.log('AdminView: System parameters updated successfully');
    return true;
    
  } catch (error) {
    console.error('AdminView: Error updating system parameters:', error);
    return false;
  }
}
</script>