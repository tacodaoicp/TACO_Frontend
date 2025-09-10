<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🌮" title="Nachos Admin Panel" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Quick Navigation -->
          <div class="mb-4">
            <div class="d-flex gap-3 flex-wrap">
              <router-link to="/admin" class="btn btn-secondary">
                🔑 Main Admin Panel
              </router-link>
              <router-link to="/admin/nachos/trade" class="btn btn-info" v-if="false">
                📈 Nachos Trading Logs
              </router-link>
              <router-link to="/admin/nachos/price" class="btn btn-warning" v-if="false">
                🚨 Nachos Price Failsafe
              </router-link>
            </div>
          </div>
          
          <!-- Timer Health Dashboard -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Nachos Timer Health Dashboard</h3>
              <button class="btn btn-primary" @click="refreshTimerStatus">
                Refresh Status
              </button>
            </div>
            
            <div class="card-body">
              <!-- Nachos Sync Status -->
              <div class="timer-section">
                <h4>Nachos Sync</h4>
                <div class="d-flex flex-column gap-2">
                  <!-- Short Sync -->
                  <div class="d-flex gap-3 align-items-center">
                    <div class="status-indicator" :class="nachosTimerHealth.shortSync.active ? 'active' : 'inactive'"></div>
                    <span>Short Sync (15m)</span>
                    <span>Last: {{ formatTime(nachosTimerHealth.shortSync.lastSync) }}</span>
                  </div>
                  <!-- Trading Status -->
                  <div class="d-flex gap-3 align-items-center">
                    <div class="status-indicator" :class="nachosTimerHealth.rebalanceStatus === 'Trading' ? 'active' : 'inactive'"></div>
                    <span>Trading Status:</span>
                    <span>{{ nachosTimerHealth.rebalanceStatus }}</span>
                    <span v-if="nachosTimerHealth.rebalanceError" class="text-danger">({{ nachosTimerHealth.rebalanceError }})</span>
                    <div class="ms-auto">
                      <button 
                        class="btn btn-warning btn-sm me-2" 
                        @click="executeTradingCycle">
                        Execute Trading Cycle
                      </button>
                      <button 
                        class="btn btn-success btn-sm me-2" 
                        @click="startRebalancing"
                        :disabled="nachosTimerHealth.rebalanceStatus === 'Trading'">
                        Start Trading
                      </button>
                      <button 
                        class="btn btn-danger btn-sm" 
                        @click="stopRebalancing"
                        :disabled="nachosTimerHealth.rebalanceStatus === 'Idle'">
                        Stop Trading
                      </button>
                    </div>
                  </div>
                  <!-- Trading Metrics -->
                  <div v-if="nachosTimerHealth.tradingMetrics" class="trading-metrics mt-2">
                    <h5>Trading Metrics</h5>
                    
                    <!-- Trading Bot Warning -->
                    <div v-if="getTradingBotWarning().level !== 'none'" 
                         :class="['alert', 'mb-2', getTradingBotWarning().level === 'danger' ? 'alert-danger' : 'alert-warning']">
                      <small>{{ getTradingBotWarning().message }}</small>
                    </div>
                    
                    <div class="d-flex flex-column gap-1">
                      <div>Last Attempt: {{ formatTime(nachosTimerHealth.tradingMetrics.lastRebalanceAttempt) }}</div>
                      <div>Total Trades: {{ nachosTimerHealth.tradingMetrics.totalTradesExecuted.toString() }}</div>
                      <div>Failed Trades: {{ nachosTimerHealth.tradingMetrics.totalTradesFailed.toString() }}</div>
                      <div>Success Rate: {{ (nachosTimerHealth.tradingMetrics.successRate * 100).toFixed(1) }}%</div>
                      <div>Avg Slippage: {{ nachosTimerHealth.tradingMetrics.avgSlippage.toFixed(2) }}%</div>
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
                      @click="restartNachosSyncs"
                      v-if="!nachosTimerHealth.shortSync.active">
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
              <h3 class="mb-0">Nachos Portfolio Snapshot Management</h3>
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
                    @click="triggerManualSnapshot">
                    Take Manual Snapshot
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Rebalance Configuration -->
          <div class="card bg-dark text-white mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Nachos Rebalance Configuration</h3>
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
                  <div class="help-text text-muted">Range: 10-10,000 snapshots</div>
                </div>
              </div>
              
              <div class="mt-4">
                <button 
                  class="btn btn-primary me-2" 
                  @click="showUpdateConfigConfirmation"
                  :disabled="!isConfigValid || !hasConfigChanges">
                  Update Configuration
                </button>
                <button 
                  class="btn btn-secondary" 
                  @click="loadConfig">
                  Reset Changes
                </button>
              </div>
            </div>
          </div>

          <!-- System Logs -->
          <div class="card bg-dark text-white">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Nachos System Logs</h3>
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

        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <AdminConfirmationModal 
      :show="confirmationModal.show"
      :title="confirmationModal.title"
      :message="confirmationModal.message"
      :extraData="confirmationModal.extraData"
      :confirmButtonText="confirmationModal.confirmButtonText"
      :confirmButtonClass="confirmationModal.confirmButtonClass"
      :reasonPlaceholder="confirmationModal.reasonPlaceholder"
      :submitting="confirmationModal.submitting"
      @confirm="handleConfirmAction"
      @cancel="hideConfirmationModal"
    />
  </div>
</template>

<style scoped>
/* Timer Health Dashboard Styles */
.timer-section {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  padding: 1rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.active {
  background-color: #28a745;
  box-shadow: 0 0 5px rgba(40, 167, 69, 0.5);
}

.status-indicator.inactive {
  background-color: #dc3545;
  box-shadow: 0 0 5px rgba(220, 53, 69, 0.5);
}

.status-indicator.paused {
  background-color: #ffc107;
  box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
}

/* Token sync styles */
.token-sync-status {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  padding: 1rem;
}

.token-sync-item {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.token-sync-item:last-child {
  border-bottom: none;
}

.token-symbol {
  font-weight: bold;
  min-width: 80px;
}

.token-status {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Configuration grid */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.config-item label {
  font-weight: 500;
  font-size: 0.875rem;
}

.help-text {
  font-size: 0.75rem;
}

/* Log styles */
.log-container {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.log-entry {
  padding: 0.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: grid;
  grid-template-columns: 180px 60px 120px 1fr;
  gap: 1rem;
  align-items: center;
}

.log-entry.error {
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 3px solid #dc3545;
}

.log-entry.warn {
  background-color: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
}

.log-entry.info {
  background-color: rgba(23, 162, 184, 0.1);
  border-left: 3px solid #17a2b8;
}

.timestamp {
  font-size: 0.75rem;
  color: #6c757d;
}

.level {
  font-weight: bold;
  text-transform: uppercase;
}

.component {
  font-weight: 500;
  color: #17a2b8;
}

.message {
  word-break: break-word;
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
import TacoTitle from '../components/misc/TacoTitle.vue';
import AdminConfirmationModal from '../components/admin/AdminConfirmationModal.vue';
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
const refreshingVP = ref(false);

// Nachos-specific state
const nachosTimerHealth = ref({
  shortSync: {
    active: false,
    lastSync: 0n
  },
  rebalanceStatus: 'Idle' as 'Idle' | 'Trading' | 'Failed',
  rebalanceError: undefined as string | undefined,
  tradingMetrics: undefined as any
});

const nachosTokenDetails = ref<any[]>([]);
const nachosSystemLogs = ref<any[]>([]);
const portfolioSnapshotStatus = ref({
  status: { Stopped: null },
  intervalMinutes: 60,
  lastSnapshotTime: 0n
});
const newPortfolioSnapshotInterval = ref(60);
const rebalanceConfig = ref<any>(null);

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

// Get store
const tacoStore = useTacoStore();

// Computed property to sort tokens with paused/inactive tokens first
const sortedTokenDetails = computed(() => {
  if (!nachosTokenDetails.value || !nachosTokenDetails.value.length) return [];
  
  return [...nachosTokenDetails.value].sort(([principalA, tokenA], [principalB, tokenB]) => {
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

// Add this computed property to get unique components from logs
const uniqueComponents = computed(() => {
  const components = new Set(nachosSystemLogs.value.map(log => log.component));
  return Array.from(components).sort();
});

// Configuration inputs
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

// Timer status functions
async function refreshTimerStatus() {
  console.log('AdminNachosView: refreshTimerStatus called');
  try {
    const result = await tacoStore.refreshNachosTimerStatus();
    
    if (result) {
      // Update token details
      if (result.tokenDetails && Array.isArray(result.tokenDetails)) {
        nachosTokenDetails.value = result.tokenDetails;
        console.log('AdminNachosView: Updated token details', result.tokenDetails.length);
      }
      
      // Update trading status
      if (result.tradingStatus && 'ok' in result.tradingStatus && result.tradingStatus.ok) {
        const { metrics, rebalanceStatus } = result.tradingStatus.ok;
        nachosTimerHealth.value = {
          shortSync: {
            active: true, // We'll assume active if we got data
            lastSync: metrics.lastUpdate || 0n
          },
          rebalanceStatus: 'Idle' in rebalanceStatus ? 'Idle' 
            : 'Trading' in rebalanceStatus ? 'Trading'
            : 'Failed',
          rebalanceError: 'Failed' in rebalanceStatus ? rebalanceStatus.Failed : undefined,
          tradingMetrics: {
            lastRebalanceAttempt: metrics.lastRebalanceAttempt || 0n,
            totalTradesExecuted: metrics.totalTradesExecuted || 0n,
            totalTradesFailed: metrics.totalTradesFailed || 0n,
            successRate: metrics.successRate || 0,
            avgSlippage: metrics.avgSlippage || 0
          }
        };
        console.log('AdminNachosView: Updated timer health');
      }
    }
  } catch (error) {
    console.error('AdminNachosView: Error refreshing timer status:', error);
  }
  console.log('AdminNachosView: refreshTimerStatus completed');
}

async function triggerManualSync() {
    console.log('AdminNachosView: triggerManualSync called');
    if (confirm('Are you sure you want to force a nachos sync?')) {
        await tacoStore.triggerNachosManualSync();
        console.log('AdminNachosView: Manual nachos sync triggered');
    }
}

async function restartNachosSyncs() {
    if (confirm('Are you sure you want to restart nachos sync timers?')) {
        await tacoStore.restartNachosSyncs();
    }
}

async function refreshTokenDetails() {
    console.log('AdminNachosView: refreshTokenDetails called');
    try {
        const tokenDetails = await tacoStore.getNachosTokenDetails();
        if (tokenDetails && Array.isArray(tokenDetails)) {
            nachosTokenDetails.value = tokenDetails;
            console.log('AdminNachosView: Updated token details', tokenDetails.length);
        }
    } catch (error) {
        console.error('AdminNachosView: Error refreshing token details:', error);
    }
}

async function recoverPoolBalances() {
    console.log('AdminNachosView: recoverPoolBalances called');
    if (confirm('Are you sure you want to recover balances from ICPSwap pools for nachos?')) {
        isRecoveringBalances.value = true;
        try {
            await tacoStore.recoverNachosPoolBalances();
            console.log('AdminNachosView: Nachos pool balances recovered');
        } catch (error) {
            console.error('AdminNachosView: Error recovering nachos pool balances:', error);
        } finally {
            isRecoveringBalances.value = false;
        }
    }
}

// Log management
async function refreshLogs() {
    console.log('AdminNachosView: refreshLogs called');
    await tacoStore.fetchNachosSystemLogs();
    console.log('AdminNachosView: refreshLogs completed');
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
  if (!level) return '';
  if (level.ERROR !== undefined) return 'ERROR';
  if (level.WARN !== undefined) return 'WARN';
  if (level.INFO !== undefined) return 'INFO';
  return '';
}

// Token status functions
function getTokenStatusClass(token: any, principal: any): string {
  try {
    if (token?.isPaused) return 'paused';
    
    const now = Date.now() * 1_000_000; // Convert to nanoseconds
    const lastSync = Number(token?.lastTimeSynced || 0n);
    const timeSinceSync = now - lastSync;
    const thirtyMinutesNS = 30 * 60 * 1_000_000_000;
    
    if (timeSinceSync > thirtyMinutesNS) return 'inactive';
    return 'active';
  } catch (error) {
    console.error('Error in getTokenStatusClass:', error);
    return 'inactive';
  }
}

function getTokenStatusText(token: any, principal: any): string {
  try {
    if (token?.isPaused) return 'Paused';
    
    const now = Date.now() * 1_000_000;
    const lastSync = Number(token?.lastTimeSynced || 0n);
    const timeSinceSync = now - lastSync;
    const thirtyMinutesNS = 30 * 60 * 1_000_000_000;
    
    if (timeSinceSync > thirtyMinutesNS) return 'Inactive';
    return 'Active';
  } catch (error) {
    console.error('Error in getTokenStatusText:', error);
    return 'Unknown';
  }
}

// Trading functions
async function startRebalancing() {
    console.log('AdminNachosView: startRebalancing called');
    showStartRebalancingConfirmation();
}

async function stopRebalancing() {
    console.log('AdminNachosView: stopRebalancing called');
    showStopRebalancingConfirmation();
}

async function executeTradingCycle() {
    console.log('AdminNachosView: executeTradingCycle called');
    showExecuteTradingCycleConfirmation();
}

// Portfolio functions
async function refreshPortfolioSnapshotStatus() {
    try {
        console.log('AdminNachosView: refreshPortfolioSnapshotStatus called');
        const status = await tacoStore.getNachosPortfolioSnapshotStatus();
        if (status) {
            portfolioSnapshotStatus.value = status;
            newPortfolioSnapshotInterval.value = status.intervalMinutes;
            console.log('AdminNachosView: Portfolio snapshot status updated', {
                status: status.status,
                intervalMinutes: status.intervalMinutes,
                lastSnapshotTime: status.lastSnapshotTime
            });
        }
    } catch (error) {
        console.error('AdminNachosView: Error refreshing portfolio snapshot status:', error);
    }
}

async function triggerManualSnapshot() {
    showManualSnapshotConfirmation();
}

// Configuration functions
async function loadConfig() {
    try {
        const config = await tacoStore.getNachosRebalanceConfig();
        if (config) {
            rebalanceConfig.value = config;
            console.log('AdminNachosView: Loaded nachos config:', config);
            
            // Helper functions for nanosecond conversions
            const nsToMinutes = (ns: bigint | number) => Number(ns || 0n) / (60 * 1_000_000_000);
            const nsToSeconds = (ns: bigint | number) => Number(ns || 0n) / 1_000_000_000;
            
            // Update form inputs - safely convert BigInt values
            configInputs.value = {
                maxSlippageBasisPoints: Number(config.maxSlippageBasisPoints || 0) / 100,
                minTradeValueICP: Number(config.minTradeValueICP || 0),
                maxTradeValueICP: Number(config.maxTradeValueICP || 0),
                maxTradesStored: Number(config.maxTradesStored || 0),
                maxTradeAttemptsPerInterval: Number(config.maxTradeAttemptsPerInterval || 0),
                maxKongswapAttempts: Number(config.maxKongswapAttempts || 0),
                rebalanceIntervalMinutes: nsToMinutes(config.rebalanceIntervalNS || 0n),
                portfolioRebalancePeriodMinutes: nsToMinutes(config.portfolioRebalancePeriodNS || 0n),
                shortSyncIntervalSeconds: nsToSeconds(config.shortSyncIntervalNS || 0n),
                longSyncIntervalMinutes: nsToMinutes(config.longSyncIntervalNS || 0n),
                tokenSyncTimeoutSeconds: nsToSeconds(config.tokenSyncTimeoutNS || 0n),
                maxPriceHistoryEntries: Number(config.maxPriceHistoryEntries || 0),
                maxPortfolioSnapshots: Number(config.maxPortfolioSnapshots || 0)
            };
            console.log('AdminNachosView: Updated config inputs:', configInputs.value);
            hasConfigChanges.value = false;
        }
    } catch (error) {
        console.error('Error loading nachos config:', error);
        // Initialize with default values if config load fails
        configInputs.value = {
            maxSlippageBasisPoints: 1.0,
            minTradeValueICP: 0.1,
            maxTradeValueICP: 100,
            maxTradesStored: 1000,
            maxTradeAttemptsPerInterval: 5,
            maxKongswapAttempts: 3,
            rebalanceIntervalMinutes: 60,
            portfolioRebalancePeriodMinutes: 1440,
            shortSyncIntervalSeconds: 900,
            longSyncIntervalMinutes: 60,
            tokenSyncTimeoutSeconds: 30,
            maxPriceHistoryEntries: 10000,
            maxPortfolioSnapshots: 1000
        };
    }
}

function validateInput(field: string) {
    // Mark that we have changes
    hasConfigChanges.value = true;
    
    // Basic validation
    isConfigValid.value = true;
    
    if (configInputs.value.maxSlippageBasisPoints < 0.35 || configInputs.value.maxSlippageBasisPoints > 5) {
        isConfigValid.value = false;
    }
    
    if (configInputs.value.minTradeValueICP < 0.1) {
        isConfigValid.value = false;
    }
    
    if (configInputs.value.maxTradeValueICP < 1) {
        isConfigValid.value = false;
    }
}

// Utility functions
function formatTime(timestamp: bigint | number): string {
    if (!timestamp || timestamp === 0n || timestamp === 0) return 'Never';
    const time = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(time / 1_000_000).toLocaleString();
}

function formatNumber(value: bigint | number): string {
    const num = typeof value === 'bigint' ? Number(value) : value;
    return num.toLocaleString();
}

// Modal functions
function showPauseConfirmation(principal: string, tokenName: string) {
    confirmationModal.value = {
        show: true,
        title: 'Pause Token',
        message: `Are you sure you want to pause trading for ${tokenName}?`,
        extraData: `This will prevent the nachos canister from trading this token until manually unpaused.`,
        confirmButtonText: 'Pause Token',
        confirmButtonClass: 'btn-warning',
        reasonPlaceholder: 'Please provide a reason for pausing this token...',
        submitting: false,
        action: null,
        actionData: { principal, tokenName }
    };
}

function showUnpauseConfirmation(principal: string, tokenName: string) {
    confirmationModal.value = {
        show: true,
        title: 'Unpause Token',
        message: `Are you sure you want to unpause trading for ${tokenName}?`,
        extraData: `This will allow the nachos canister to resume trading this token.`,
        confirmButtonText: 'Unpause Token',
        confirmButtonClass: 'btn-success',
        reasonPlaceholder: 'Please provide a reason for unpausing this token...',
        submitting: false,
        action: null,
        actionData: { principal, tokenName }
    };
}

function showStartRebalancingConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Start Nachos Trading',
        message: 'Are you sure you want to start nachos trading/rebalancing?',
        extraData: 'This will enable automatic trading based on the current configuration.',
        confirmButtonText: 'Start Trading',
        confirmButtonClass: 'btn-success',
        reasonPlaceholder: 'Please provide a reason for starting trading...',
        submitting: false,
        action: null,
        actionData: { type: 'startRebalancing' }
    };
}

function showStopRebalancingConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Stop Nachos Trading',
        message: 'Are you sure you want to stop nachos trading/rebalancing?',
        extraData: 'This will disable automatic trading until manually restarted.',
        confirmButtonText: 'Stop Trading',
        confirmButtonClass: 'btn-danger',
        reasonPlaceholder: 'Please provide a reason for stopping trading...',
        submitting: false,
        action: null,
        actionData: { type: 'stopRebalancing' }
    };
}

function showExecuteTradingCycleConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Execute Nachos Trading Cycle',
        message: 'Are you sure you want to manually execute a nachos trading cycle?',
        extraData: 'This will trigger an immediate rebalancing attempt.',
        confirmButtonText: 'Execute Cycle',
        confirmButtonClass: 'btn-warning',
        reasonPlaceholder: 'Please provide a reason for executing this trading cycle...',
        submitting: false,
        action: null,
        actionData: { type: 'executeTradingCycle' }
    };
}

function showManualSnapshotConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Take Manual Nachos Snapshot',
        message: 'Are you sure you want to take a manual nachos portfolio snapshot?',
        extraData: 'This will capture the current nachos portfolio state.',
        confirmButtonText: 'Take Snapshot',
        confirmButtonClass: 'btn-warning',
        reasonPlaceholder: 'Please provide a reason for taking this snapshot...',
        submitting: false,
        action: null,
        actionData: { type: 'manualSnapshot' }
    };
}

function showStartPortfolioSnapshotsConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Start Nachos Portfolio Snapshots',
        message: 'Are you sure you want to start automatic nachos portfolio snapshots?',
        extraData: 'This will enable periodic snapshots based on the configured interval.',
        confirmButtonText: 'Start Snapshots',
        confirmButtonClass: 'btn-success',
        reasonPlaceholder: 'Please provide a reason for starting portfolio snapshots...',
        submitting: false,
        action: null,
        actionData: { type: 'startPortfolioSnapshots' }
    };
}

function showStopPortfolioSnapshotsConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Stop Nachos Portfolio Snapshots',
        message: 'Are you sure you want to stop automatic nachos portfolio snapshots?',
        extraData: 'This will disable periodic snapshots until manually restarted.',
        confirmButtonText: 'Stop Snapshots',
        confirmButtonClass: 'btn-danger',
        reasonPlaceholder: 'Please provide a reason for stopping portfolio snapshots...',
        submitting: false,
        action: null,
        actionData: { type: 'stopPortfolioSnapshots' }
    };
}

function showUpdatePortfolioSnapshotIntervalConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Update Nachos Portfolio Snapshot Interval',
        message: `Are you sure you want to update the nachos portfolio snapshot interval to ${newPortfolioSnapshotInterval.value} minutes?`,
        extraData: 'This will change how frequently automatic snapshots are taken.',
        confirmButtonText: 'Update Interval',
        confirmButtonClass: 'btn-primary',
        reasonPlaceholder: 'Please provide a reason for changing the snapshot interval...',
        submitting: false,
        action: null,
        actionData: { type: 'updatePortfolioSnapshotInterval', intervalMinutes: newPortfolioSnapshotInterval.value }
    };
}

function showUpdateConfigConfirmation() {
    confirmationModal.value = {
        show: true,
        title: 'Update Nachos Configuration',
        message: 'Are you sure you want to update the nachos rebalance configuration?',
        extraData: 'This will change the trading behavior parameters.',
        confirmButtonText: 'Update Configuration',
        confirmButtonClass: 'btn-primary',
        reasonPlaceholder: 'Please provide a reason for updating the configuration...',
        submitting: false,
        action: null,
        actionData: { type: 'updateConfig' }
    };
}

function hideConfirmationModal() {
  confirmationModal.value.show = false;
  confirmationModal.value.submitting = false;
  confirmationModal.value.action = null;
  confirmationModal.value.actionData = null;
}

const handleConfirmAction = async (reason: string) => {
  if (!confirmationModal.value.actionData) return;
  
  confirmationModal.value.submitting = true;
  
  try {
    let success = false;
    const actionData = confirmationModal.value.actionData as any;
    
    if (confirmationModal.value.title === 'Update Nachos Configuration') {
      // Handle configuration update
      await updateConfigWithReason(reason);
      success = true;
    } else if (actionData.type === 'startRebalancing') {
      // Handle start trading
      success = await tacoStore.startNachosRebalancing(reason);
      if (success) {
        await refreshTimerStatus();
        console.log('AdminNachosView: Nachos trading started');
      }
    } else if (actionData.type === 'stopRebalancing') {
      // Handle stop trading
      success = await tacoStore.stopNachosRebalancing(reason);
      if (success) {
        await refreshTimerStatus();
        console.log('AdminNachosView: Nachos trading stopped');
      }
    } else if (actionData.type === 'manualSnapshot') {
      // Handle manual snapshot
      await tacoStore.takeNachosManualPortfolioSnapshot(reason);
      console.log('AdminNachosView: Manual nachos snapshot triggered');
      success = true;
    } else if (actionData.type === 'executeTradingCycle') {
      // Handle execute trading cycle
      await tacoStore.executeNachosTradingCycle(reason);
      await refreshTimerStatus();
      console.log('AdminNachosView: Nachos trading cycle executed');
      success = true;
    } else if (actionData.type === 'startPortfolioSnapshots') {
      // Handle start portfolio snapshots
      success = await tacoStore.startNachosPortfolioSnapshots(reason);
      if (success) {
        await refreshPortfolioSnapshotStatus();
        console.log('AdminNachosView: Nachos portfolio snapshots started');
      }
    } else if (actionData.type === 'stopPortfolioSnapshots') {
      success = await tacoStore.stopNachosPortfolioSnapshots(reason);
      if (success) {
        await refreshPortfolioSnapshotStatus();
        console.log('AdminNachosView: Nachos portfolio snapshots stopped');
      }
    } else if (actionData.type === 'updatePortfolioSnapshotInterval') {
      // Handle update portfolio snapshot interval
      success = await tacoStore.updateNachosPortfolioSnapshotInterval(actionData.intervalMinutes, reason);
      if (success) {
        await refreshPortfolioSnapshotStatus();
        console.log('AdminNachosView: Nachos portfolio snapshot interval updated');
      }
    } else if (actionData.principal && actionData.tokenName) {
      // Handle token pause/unpause actions
      const { principal, tokenName } = actionData;
      
      if (confirmationModal.value.title === 'Pause Token') {
        success = await tacoStore.pauseNachosToken(Principal.fromText(principal), reason);
      } else if (confirmationModal.value.title === 'Unpause Token') {
        success = await tacoStore.unpauseNachosToken(Principal.fromText(principal), reason);
      }
      
      if (success) {
        await refreshTimerStatus();
      }
    }
    
    if (success) {
      console.log(`AdminNachosView: ${confirmationModal.value.title} completed successfully`);
      hideConfirmationModal();
    } else {
      console.error(`AdminNachosView: Failed to ${confirmationModal.value.title.toLowerCase()}`);
      // Keep modal open to show error state
      confirmationModal.value.submitting = false;
    }
  } catch (error) {
    console.error(`AdminNachosView: Error in ${confirmationModal.value.title}:`, error);
    confirmationModal.value.submitting = false;
  }
};

async function updateConfigWithReason(reason: string) {
    // Helper functions for nanosecond conversions
    const minutesToNs = (minutes: number): bigint => BigInt(Math.round(minutes * 60 * 1_000_000_000));
    const secondsToNs = (seconds: number): bigint => BigInt(Math.round(seconds * 1_000_000_000));
    
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
    
    console.log('AdminNachosView: Updating nachos config with:', updates);
    await tacoStore.updateNachosRebalanceConfig(updates, reason);
    
    // Update max portfolio snapshots separately if it changed
    // Note: We need to track the original value to detect changes
    if (configInputs.value.maxPortfolioSnapshots > 0) {
        console.log('AdminNachosView: Updating max portfolio snapshots to:', configInputs.value.maxPortfolioSnapshots);
        await tacoStore.updateNachosMaxPortfolioSnapshots(configInputs.value.maxPortfolioSnapshots, reason);
    }
    
    await loadConfig(); // Reload to get the updated config
}

// Trading bot warning logic
const getTradingBotWarning = (): { level: 'none' | 'warning' | 'danger', message: string } => {
  try {
    if (!nachosTimerHealth.value.tradingMetrics?.lastRebalanceAttempt || !rebalanceConfig.value?.rebalanceIntervalNS) {
      return { level: 'none', message: '' };
    }

    const now = Date.now() * 1_000_000; // Convert to nanoseconds
    const lastAttempt = Number(nachosTimerHealth.value.tradingMetrics.lastRebalanceAttempt || 0n);
    const intervalNS = Number(rebalanceConfig.value.rebalanceIntervalNS || 0n);
    const timeSinceLastAttempt = now - lastAttempt;

    // Warning if more than 1.5x the interval has passed
    if (timeSinceLastAttempt > intervalNS * 1.5) {
      const minutesLate = Math.floor((timeSinceLastAttempt - intervalNS) / (60 * 1_000_000_000));
      
      if (timeSinceLastAttempt > intervalNS * 3) {
        // Danger if more than 3x the interval has passed
        return {
          level: 'danger',
          message: `Trading bot appears to be stuck! No rebalance attempt for ${minutesLate} minutes past due.`
        };
      } else {
        return {
          level: 'warning',
          message: `Trading bot is running late. Rebalance is ${minutesLate} minutes overdue.`
        };
      }
    }

    return { level: 'none', message: '' };
  } catch (error) {
    console.error('Error in getTradingBotWarning:', error);
    return { level: 'none', message: '' };
  }
};

// Lifecycle hooks
onMounted(async () => {
    console.log('AdminNachosView: Component mounted');
    try {
        await Promise.all([
            refreshTimerStatus().catch(err => console.error('Error refreshing timer status:', err)),
            loadConfig().catch(err => console.error('Error loading config:', err)),
            refreshLogs().catch(err => console.error('Error refreshing logs:', err)),
            refreshPortfolioSnapshotStatus().catch(err => console.error('Error refreshing portfolio status:', err))
        ]);
        
        // If we still don't have token details, try to fetch them separately
        if (!nachosTokenDetails.value || nachosTokenDetails.value.length === 0) {
            console.log('AdminNachosView: No token details found, fetching separately...');
            await refreshTokenDetails().catch(err => console.error('Error refreshing token details:', err));
        }
        
        console.log('AdminNachosView: Initial data loaded, token count:', nachosTokenDetails.value?.length || 0);
    } catch (error) {
        console.error('AdminNachosView: Error during initialization:', error);
    }
});

// Watch for config changes
watch(configInputs, () => {
    hasConfigChanges.value = true;
}, { deep: true });
</script>
