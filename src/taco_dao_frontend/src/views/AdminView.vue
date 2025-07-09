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
            <div class="d-flex gap-3">
              <router-link to="/admin/trade" class="btn btn-info">
                📈 View Trading Logs
              </router-link>
              <router-link to="/admin/price" class="btn btn-warning">
                🚨 Price Failsafe Admin
              </router-link>
              <router-link to="/admin/neuron" class="btn btn-success">
                🧠 Neuron Snapshot Admin
              </router-link>
              <router-link to="/admin/votes" class="btn btn-primary">
                🗳️ Vote History Admin
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
                <h4>Snapshot Timer</h4>
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
                    @click="updateSnapshotInterval"
                    :disabled="!snapshotIntervalMinutes || snapshotIntervalMinutes < 1"
                  >
                    Update Interval
                  </button>
                </div>
                <div class="d-flex gap-2">
                  <button 
                    class="btn btn-warning" 
                    @click="triggerManualSnapshot"
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
                    <div v-if="fetchedTokenDetails && fetchedTokenDetails.length" class="token-list">
                      <div v-for="[principal, token] in fetchedTokenDetails" :key="principal.toString()" class="token-sync-item">
                        <div class="d-flex gap-3 align-items-center justify-content-between">
                          <div class="d-flex gap-3 align-items-center">
                            <div class="status-indicator" :class="getTokenStatusClass(token)"></div>
                            <span class="token-symbol">{{ token.tokenSymbol }}</span>
                            <span class="token-status">{{ getTokenStatusText(token) }}</span>
                            <span>Last Sync: {{ formatTime(token.lastTimeSynced) }}</span>
                          </div>
                          <div class="d-flex gap-2">
                            <button 
                              v-if="!token.isPaused" 
                              class="btn btn-warning btn-sm"
                              @click="pauseToken(principal)"
                            >
                              Pause
                            </button>
                            <button 
                              v-else 
                              class="btn btn-success btn-sm"
                              @click="unpauseToken(principal)"
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
                        <td>{{ neuron.lastAllocationMaker.toString() }}</td>
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
                        <td>{{ voter.principal.toString() }}</td>
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
                              {{ follow.follow.toString() }}<br>
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
              </div>
              <div v-else class="text-center py-4">Loading configuration...</div>
              <div class="d-flex gap-2 mt-4">
                <button 
                  @click="updateConfig" 
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

        </div>
      </div>
    </div>
    
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
import { Principal } from '@dfinity/principal';

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

// Get store
const tacoStore = useTacoStore();
const { 
  snapshotStatus, 
  timerHealth, 
  systemLogs, 
  fetchedTokenDetails, 
  rebalanceConfig,
  fetchedVotingPowerMetrics,
  fetchedAggregateAllocation,
  fetchedVoterDetails,
  fetchedNeuronAllocations
} = storeToRefs(tacoStore);

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
    console.log('AdminView: refreshTimerStatus completed');
}

async function triggerManualSnapshot() {
    console.log('AdminView: triggerManualSnapshot called');
    if (confirm('Are you sure you want to trigger a manual snapshot?')) {
        await tacoStore.triggerManualSnapshot();
        console.log('AdminView: Manual snapshot triggered');
    }
}

async function triggerManualSync() {
    console.log('AdminView: triggerManualSync called');
    if (confirm('Are you sure you want to force a treasury sync?')) {
        await tacoStore.triggerManualSync();
        console.log('AdminView: Manual sync triggered');
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

// Lifecycle hooks
onMounted(async () => {
    console.log('AdminView: Component mounted');
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
        refreshNeuronAllocations()
    ]);
    console.log('AdminView: Initial data loaded');
});

// New functions
async function startRebalancing() {
    console.log('AdminView: startRebalancing called');
    if (confirm('Are you sure you want to start the trading algorithm?')) {
        await tacoStore.startRebalancing();
        await refreshTimerStatus();
        console.log('AdminView: Trading started');
    }
}

async function stopRebalancing() {
    console.log('AdminView: stopRebalancing called');
    if (confirm('Are you sure you want to stop the trading algorithm?')) {
        await tacoStore.stopRebalancing();
        await refreshTimerStatus();
        console.log('AdminView: Trading stopped');
    }
}

async function recoverPoolBalances() {
    console.log('AdminView: recoverPoolBalances called');
    if (confirm('Are you sure you want to recover balances from ICPSwap pools?')) {
        isRecoveringBalances.value = true;
        try {
            await tacoStore.recoverPoolBalances();
            console.log('AdminView: Pool balances recovered');
        } catch (error) {
            console.error('AdminView: Error recovering pool balances:', error);
        } finally {
            isRecoveringBalances.value = false;
        }
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
  maxPriceHistoryEntries: 0
});

const isConfigValid = ref(true);
const hasConfigChanges = ref(false);

// Track original maxPriceHistoryEntries for change detection
const originalMaxPriceHistoryEntries = ref(0);

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
      // Load current max price history entries
      let currentMaxPriceHistory = 0;
      try {
        const maxPriceHistoryEntries = await tacoStore.getMaxPriceHistoryEntries();
        currentMaxPriceHistory = Number(maxPriceHistoryEntries);
        originalMaxPriceHistoryEntries.value = currentMaxPriceHistory;
      } catch (error) {
        console.error('Error loading max price history entries:', error);
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
        maxPriceHistoryEntries: currentMaxPriceHistory
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
        maxPriceHistoryEntries: 0
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
      current.maxPriceHistoryEntries !== originalMaxPriceHistoryEntries.value;
  }
}, { deep: true });

const validateInput = (field: string) => {
  // Add validation logic here
  isConfigValid.value = true; // Simplified for now
};

const updateConfig = async () => {
  if (!isConfigValid.value || !rebalanceConfig.value) return;
  
  const updates = {
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
    tokenSyncTimeoutNS: [secondsToNs(configInputs.value.tokenSyncTimeoutSeconds)],
    maxPriceHistoryEntries: configInputs.value.maxPriceHistoryEntries > 0 ? [BigInt(Math.round(configInputs.value.maxPriceHistoryEntries))] as [bigint] : [] as [],
    priceUpdateIntervalNS: [] as []
  };
  
  await tacoStore.updateRebalanceConfig(updates);
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
      maxPriceHistoryEntries: originalMaxPriceHistoryEntries.value
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
  if (confirm('Are you sure you want to execute a trading cycle?')) {
    try {
      await tacoStore.executeTradingCycle();
      await refreshTimerStatus();
      console.log('AdminView: Trading cycle executed');
    } catch (error) {
      console.error('AdminView: Error executing trading cycle:', error);
    }
  }
}

// Add these functions
const getTokenStatusClass = (token: any) => {
  if (!token.Active) return 'inactive';
  if (token.isPaused || token.pausedDueToSyncFailure) return 'paused';
  return 'active';
};

const getTokenStatusText = (token: any) => {
  if (!token.Active) return '(Inactive)';
  
  let statuses = [];
  if (token.isPaused) statuses.push('Manually Paused');
  if (token.pausedDueToSyncFailure) statuses.push('Sync Failed');
  
  return statuses.length ? `(${statuses.join(', ')})` : '';
};

async function pauseToken(principal: Principal) {
    console.log('AdminView: pauseToken called');
    if (confirm('Are you sure you want to pause this token?')) {
        try {
            const success = await tacoStore.pauseToken(principal);
            if (success) {
                await refreshTimerStatus();
                console.log('AdminView: Token paused successfully');
            } else {
                console.error('AdminView: Failed to pause token');
            }
        } catch (error) {
            console.error('AdminView: Error pausing token:', error);
        }
    }
}

async function unpauseToken(principal: Principal) {
    console.log('AdminView: unpauseToken called');
    if (confirm('Are you sure you want to unpause this token?')) {
        try {
            const success = await tacoStore.unpauseToken(principal);
            if (success) {
                await refreshTimerStatus();
                console.log('AdminView: Token unpaused successfully');
            } else {
                console.error('AdminView: Failed to unpause token');
            }
        } catch (error) {
            console.error('AdminView: Error unpausing token:', error);
        }
    }
}

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
      if (!fetchedTokenDetails.value || !Array.isArray(fetchedTokenDetails.value)) {
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

function getTokenSymbol(principal: Principal): string {
    try {
        //console.log('Looking for token symbol for principal:', principal.toString());
        //console.log('Available tokens:', fetchedTokenDetails.value);
        
        if (!fetchedTokenDetails.value || !Array.isArray(fetchedTokenDetails.value)) {
            console.warn('Token details not available or not in expected format');
            return 'Unknown';
        }

        const token = fetchedTokenDetails.value.find(entry => {
            if (!entry || !Array.isArray(entry) || entry.length < 2) {
                console.warn('Invalid token entry format:', entry);
                return false;
            }
            try {
                return entry[0].toString() === principal.toString();
            } catch (err) {
                console.warn('Error comparing principals:', err);
                return false;
            }
        });

        if (!token || !Array.isArray(token) || !token[1] || !token[1].tokenSymbol) {
            console.warn('Token not found or invalid format for principal:', principal.toString());
            return 'Unknown';
        }

        return token[1].tokenSymbol;
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

async function updateSnapshotInterval() {
  if (!snapshotIntervalMinutes.value || snapshotIntervalMinutes.value < 1) return;
  
  try {
    // Convert minutes to nanoseconds
    const intervalNS = BigInt(snapshotIntervalMinutes.value) * 60n * 1_000_000_000n;
    await tacoStore.updateSnapshotInterval(intervalNS);
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
</script>