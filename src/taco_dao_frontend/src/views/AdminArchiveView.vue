<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="📦" title="Archive Management" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Archive Selection -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Archive Selection</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <label for="archiveSelect" class="form-label">Select Archive:</label>
                  <select 
                    id="archiveSelect" 
                    class="form-select bg-dark text-white" 
                    v-model="selectedArchive"
                    @change="onArchiveChange"
                  >
                    <option value="trading_archive">📈 Trading Archive</option>
                    <option value="portfolio_archive">💼 Portfolio Archive</option>
                    <option value="price_archive">💰 Price Archive</option>
                    <option value="dao_admin_archive">🔑 DAO Admin Archive</option>
                    <option value="dao_allocation_archive">📊 DAO Allocation Archive</option>
                    <option value="dao_governance_archive">🗳️ DAO Governance Archive</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                  <button class="btn btn-primary me-2" @click="refreshStatus">
                    🔄 Refresh Status
                  </button>
                  <button class="btn btn-warning" @click="refreshLogs">
                    📋 Refresh Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Three-Tier Timer Status Dashboard -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Three-Tier Timer Status</h3>
              <div class="d-flex gap-2">
                <span class="badge" :class="getArchiveStatusBadge()">
                  {{ selectedArchive.replace('_', ' ').toUpperCase() }}
                </span>
                <span class="badge" :class="getOverallStatusBadge()">
                  {{ getOverallStatus() }}
                </span>
              </div>
            </div>
            
            <div class="card-body">
              <div v-if="loading" class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              
              <div v-else class="row">
                <!-- Outer Loop Status -->
                <div class="col-md-4">
                  <div class="timer-tier-card">
                    <h5 class="d-flex align-items-center gap-2">
                      <div class="status-indicator" :class="timerStatus?.outerLoopRunning ? 'active' : 'inactive'"></div>
                      Outer Loop (Scheduler)
                    </h5>
                    <div class="timer-details">
                      <p><strong>Status:</strong> {{ timerStatus?.outerLoopRunning ? 'Running' : 'Stopped' }}</p>
                      <p><strong>Interval:</strong> {{ timerStatus?.outerLoopIntervalSeconds }}s</p>
                      <p><strong>Total Runs:</strong> {{ timerStatus?.outerLoopTotalRuns || 0 }}</p>
                      <p><strong>Last Run:</strong> {{ formatTime(timerStatus?.outerLoopLastRun) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Middle Loop Status -->
                <div class="col-md-4">
                  <div class="timer-tier-card">
                    <h5 class="d-flex align-items-center gap-2">
                      <div class="status-indicator" :class="timerStatus?.middleLoopRunning ? 'active' : 'inactive'"></div>
                      Middle Loop (Coordinator)
                    </h5>
                    <div class="timer-details">
                      <p><strong>Status:</strong> {{ timerStatus?.middleLoopRunning ? 'Running' : 'Stopped' }}</p>
                      <p><strong>State:</strong> {{ timerStatus?.middleLoopCurrentState || 'Done' }}</p>
                      <p><strong>Total Runs:</strong> {{ timerStatus?.middleLoopTotalRuns || 0 }}</p>
                      <p><strong>Last Run:</strong> {{ formatTime(timerStatus?.middleLoopLastRun) }}</p>
                      <p><strong>Next Scheduled:</strong> {{ formatTime(timerStatus?.middleLoopNextScheduled) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Inner Loop Status -->
                <div class="col-md-4">
                  <div class="timer-tier-card">
                    <h5 class="d-flex align-items-center gap-2">
                      <div class="status-indicator" :class="timerStatus?.innerLoopRunning ? 'active' : 'inactive'"></div>
                      Inner Loop (Worker)
                    </h5>
                    <div class="timer-details">
                      <p><strong>Status:</strong> {{ timerStatus?.innerLoopRunning ? 'Running' : 'Stopped' }}</p>
                      <p><strong>Type:</strong> {{ timerStatus?.innerLoopCurrentType || 'None' }}</p>
                      <p><strong>Current Batch:</strong> {{ timerStatus?.innerLoopCurrentBatch || 0 }}</p>
                      <p><strong>Total Batches:</strong> {{ timerStatus?.innerLoopTotalBatches || 0 }}</p>
                      <p><strong>Last Run:</strong> {{ formatTime(timerStatus?.innerLoopLastRun) }}</p>
                      <p><strong>Next Scheduled:</strong> {{ formatTime(timerStatus?.innerLoopNextScheduled) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timer Controls -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Timer Controls</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <!-- System Controls -->
                <div class="col-md-6">
                  <h5>System Controls</h5>
                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <button 
                      class="btn btn-success" 
                      @click="startBatchImportSystem"
                      :disabled="timerStatus?.outerLoopRunning || loading"
                    >
                      ▶️ Start System
                    </button>
                    <button 
                      class="btn btn-warning" 
                      @click="stopBatchImportSystem"
                      :disabled="!timerStatus?.outerLoopRunning || loading"
                    >
                      ⏸️ Stop System
                    </button>
                    <button 
                      class="btn btn-danger" 
                      @click="stopAllTimers"
                      :disabled="loading"
                    >
                      🛑 Emergency Stop All
                    </button>
                  </div>
                </div>

                <!-- Manual Import Controls -->
                <div class="col-md-6">
                  <h5>Manual Import</h5>
                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <button 
                      class="btn btn-info" 
                      @click="runManualBatchImport"
                      :disabled="timerStatus?.middleLoopRunning || loading"
                    >
                      🔄 Manual Import
                    </button>
                    <button class="btn btn-secondary" @click="showConfigModal = true">
                      ⚙️ Configuration
                    </button>
                    <button 
                      class="btn btn-warning" 
                      @click="resetImportTimestamps"
                      :disabled="loading"
                      title="Reset import timestamps to re-import all historical data"
                    >
                      🔄 Reset Timestamps
                    </button>
                  </div>
                  
                  <!-- Archive-Specific Import Buttons -->
                  <div v-if="selectedArchive === 'dao_admin_archive'" class="mt-3">
                    <h6>DAO Admin Archive</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <button 
                        class="btn btn-sm btn-outline-primary" 
                        @click="runArchiveSpecificImport('importAdminActions')"
                        :disabled="loading"
                      >
                        📝 Import Admin Actions
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="selectedArchive === 'dao_allocation_archive'" class="mt-3">
                    <h6>DAO Allocation Archive</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <button 
                        class="btn btn-sm btn-outline-info" 
                        @click="runArchiveSpecificImport('importAllocationChanges')"
                        :disabled="loading"
                      >
                        📊 Import Allocation Changes
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-info" 
                        @click="runArchiveSpecificImport('importFollowActions')"
                        :disabled="loading"
                      >
                        👥 Import Follow Actions
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="selectedArchive === 'dao_governance_archive'" class="mt-3">
                    <h6>DAO Governance Archive</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <button 
                        class="btn btn-sm btn-outline-secondary" 
                        @click="runArchiveSpecificImport('importVotingPowerChanges')"
                        :disabled="loading"
                      >
                        🗳️ Import Voting Power
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-secondary" 
                        @click="runArchiveSpecificImport('importNeuronUpdates')"
                        :disabled="loading"
                      >
                        🧠 Import Neuron Updates
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Legacy Import Status -->
              <div class="row mt-3">
                <div class="col-12">
                  <h5>Legacy Status</h5>
                  <div class="row">
                    <div class="col-md-4">
                      <p><strong>System Running:</strong> {{ legacyStatus?.isRunning ? 'Yes' : 'No' }}</p>
                    </div>
                    <div class="col-md-4">
                      <p><strong>Interval:</strong> {{ legacyStatus?.intervalSeconds }}s</p>
                    </div>
                    <div class="col-md-4">
                      <p><strong>Archive Specific:</strong> {{ getArchiveSpecificStatus() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Archive Status & Statistics -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Archive Statistics</h3>
            </div>
            <div class="card-body">
              <div class="row" v-if="archiveStatus">
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Total Blocks</h6>
                    <h4 class="text-primary">{{ archiveStatus.totalBlocks || 0 }}</h4>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Oldest Block</h6>
                    <h4 class="text-info">{{ archiveStatus.oldestBlock !== null ? archiveStatus.oldestBlock : 'None' }}</h4>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Newest Block</h6>
                    <h4 class="text-success">{{ archiveStatus.newestBlock !== null ? archiveStatus.newestBlock : 'None' }}</h4>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Last Archive</h6>
                    <h4 class="text-warning">{{ formatTime(archiveStatus.lastArchiveTime) }}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Logs -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <button 
                  class="btn btn-sm btn-outline-secondary me-2" 
                  @click="showRecentLogs = !showRecentLogs"
                  :title="showRecentLogs ? 'Collapse Recent Logs' : 'Expand Recent Logs'"
                >
                  <i :class="showRecentLogs ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </button>
                <h3 class="mb-0">Recent Logs</h3>
              </div>
              <button class="btn btn-sm btn-outline-primary" @click="refreshLogs">
                Refresh Logs
              </button>
            </div>
            <div class="card-body" v-show="showRecentLogs">
              <div v-if="logs.length === 0" class="text-muted text-center">
                No logs available
              </div>
              <div v-else class="log-container">
                <div 
                  v-for="(log, index) in logs.slice(0, 20)" 
                  :key="index"
                  class="log-entry"
                  :class="getLogLevelClass(log.level)"
                >
                  <span class="log-timestamp">{{ formatTime(Number(log.timestamp)) }}</span>
                  <span class="log-category badge bg-secondary">{{ log.category }}</span>
                  <span class="log-message">{{ log.message }}</span>
                  <small class="log-function text-muted">{{ log.function }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- ICRC3 Block Browser -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">ICRC3 Block Browser</h3>
              <div class="d-flex gap-2 align-items-center">
                <div class="input-group input-group-sm" style="width: 200px;">
                  <input 
                    type="number" 
                    class="form-control bg-dark text-white border-secondary" 
                    placeholder="Block index" 
                    v-model.number="blockBrowserIndex"
                    @keyup.enter="loadSpecificBlock"
                  >
                  <button class="btn btn-outline-primary" @click="loadSpecificBlock">Go</button>
                </div>
                <button class="btn btn-sm btn-outline-primary" @click="refreshBlocks">
                  Refresh
                </button>
              </div>
            </div>
            <div class="card-body">
              <!-- Navigation Controls -->
              <div class="d-flex justify-content-between align-items-center mb-3" v-if="archiveStatus?.totalBlocks > 0">
                <div class="btn-group" role="group">
                  <button 
                    class="btn btn-sm btn-outline-secondary" 
                    @click="loadFirstBlocks"
                    :disabled="blockBrowserLoading"
                  >
                    ⏮️ First
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-secondary" 
                    @click="loadPreviousBlocks"
                    :disabled="blockBrowserLoading || currentBlockStart <= 0"
                  >
                    ⬅️ Previous
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-secondary" 
                    @click="loadNextBlocks"
                    :disabled="blockBrowserLoading || (currentBlockStart + blockBrowserPageSize >= (archiveStatus?.totalBlocks || 0))"
                  >
                    Next ➡️
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-secondary" 
                    @click="loadLastBlocks"
                    :disabled="blockBrowserLoading"
                  >
                    Last ⏭️
                  </button>
                </div>
                <div class="text-muted">
                  Showing blocks {{ currentBlockStart }}-{{ Math.min(currentBlockStart + blockBrowserPageSize - 1, (archiveStatus?.totalBlocks || 0) - 1) }} 
                  of {{ (archiveStatus?.totalBlocks || 0) - 1 }} 
                  ({{ blockBrowserPageSize }} per page)
                </div>
                <div class="input-group input-group-sm" style="width: 120px;">
                  <span class="input-group-text bg-dark border-secondary text-white">Page Size:</span>
                  <select class="form-select bg-dark text-white border-secondary" v-model.number="blockBrowserPageSize" @change="refreshBlocks">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>

              <!-- Loading State -->
              <div v-if="blockBrowserLoading" class="text-center text-muted py-3">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Loading blocks...
              </div>

              <!-- No Blocks Message -->
              <div v-else-if="!blockBrowserBlocks || blockBrowserBlocks.length === 0" class="text-muted text-center py-3">
                <div v-if="archiveStatus?.totalBlocks === 0">
                  No blocks archived yet. Run an import to create blocks.
                </div>
                <div v-else>
                  No blocks found at the specified range.
                </div>
              </div>

              <!-- Block List -->
              <div v-else class="block-list">
                <div 
                  v-for="block in blockBrowserBlocks" 
                  :key="block.id"
                  :data-block-id="block.id"
                  class="block-entry border border-secondary rounded p-3 mb-3"
                >
                  <!-- Block Header -->
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="block-header">
                      <h5 class="mb-1">
                        Block #{{ block.id }}
                        <span class="badge bg-info ms-2">{{ getBlockTypeName(block.block) }}</span>
                      </h5>
                      <small class="text-muted">{{ formatTime(Number(block.timestamp)) }}</small>
                    </div>
                    <button 
                      class="btn btn-sm btn-outline-secondary"
                      @click="toggleBlockExpanded(block.id)"
                    >
                      {{ expandedBlocks.includes(block.id) ? '▼ Collapse' : '▶️ Expand' }}
                    </button>
                  </div>

                  <!-- Block Summary -->
                  <div class="block-summary mb-2">
                    {{ getBlockSummary(block.block) }}
                  </div>

                  <!-- Expanded Block Details -->
                  <div v-if="expandedBlocks.includes(block.id)" class="block-details">
                    <div class="border-top border-secondary pt-2">
                      <!-- Formatted Block Details -->
                      <div v-html="getFormattedBlockDetails(block.block)"></div>
                      
                      <!-- Raw JSON (collapsible) -->
                      <div class="mt-3">
                        <button 
                          class="btn btn-sm btn-outline-secondary mb-2"
                          @click="toggleRawJson(block.id)"
                        >
                          {{ showRawJson.includes(block.id) ? 'Hide Raw JSON' : 'Show Raw JSON' }}
                        </button>
                        <div v-if="showRawJson.includes(block.id)">
                          <h6>Raw Block Data:</h6>
                          <pre class="bg-secondary p-2 rounded small text-wrap">{{ formatBlockJson(block.block) }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Messages -->
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <!-- Success Messages -->
          <div v-if="successMessage" class="alert alert-success" role="alert">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Modal -->
    <div class="modal fade" :class="{ show: showConfigModal }" :style="{ display: showConfigModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content bg-dark text-white">
          <div class="modal-header">
            <h5 class="modal-title">Timer Configuration</h5>
            <button type="button" class="btn-close btn-close-white" @click="showConfigModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="maxIterations" class="form-label">Max Inner Loop Iterations:</label>
              <input 
                type="number" 
                class="form-control bg-dark text-white" 
                id="maxIterations"
                v-model="configMaxIterations"
                min="1"
                max="50"
              />
              <div class="form-text">Maximum number of batches per inner loop execution (1-50)</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showConfigModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="updateConfiguration">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showConfigModal" class="modal-backdrop fade show" @click="showConfigModal = false"></div>
  </div>
</template>

<script>
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { useTacoStore } from '../stores/taco.store'
import { mapStores } from 'pinia'
import { Principal } from '@dfinity/principal'
import ApexCharts from 'apexcharts'

// Import archive actors
import { createActor as createTradingActor } from '../../../declarations/trading_archive'
import { createActor as createPortfolioActor } from '../../../declarations/portfolio_archive'
import { createActor as createPriceActor } from '../../../declarations/price_archive'
import { createActor as createDaoAdminActor } from '../../../declarations/dao_admin_archive'
import { createActor as createDaoAllocationActor } from '../../../declarations/dao_allocation_archive'
import { createActor as createDaoGovernanceActor } from '../../../declarations/dao_governance_archive'

export default {
  name: 'AdminArchiveView',
  components: {
    HeaderBar,
    TacoTitle
  },
  data() {
    return {
      selectedArchive: 'trading_archive',
      loading: false,
      timerStatus: null,
      legacyStatus: null,
      archiveStatus: null,
      logs: [],
      showRecentLogs: false, // Default to collapsed
      errorMessage: '',
      successMessage: '',
      showConfigModal: false,
      configMaxIterations: 10,
      
      // Archive actors
      tradingActor: null,
      portfolioActor: null,
      priceActor: null,
      daoAdminActor: null,
      daoAllocationActor: null,
      daoGovernanceActor: null,
      
      // Refresh interval
      refreshInterval: null,
      
      // ICRC3 Block Browser
      blockBrowserBlocks: [],
      blockBrowserLoading: false,
      blockBrowserIndex: null,
      blockBrowserPageSize: 10,
      currentBlockStart: 0,
      expandedBlocks: [],
      showRawJson: [],
      
      // Portfolio Charts - store multiple instances by ID
      portfolioCharts: new Map()
    }
  },
  computed: {
    ...mapStores(useTacoStore),
    currentArchiveActor() {
      switch (this.selectedArchive) {
        case 'trading_archive': return this.tradingActor
        case 'portfolio_archive': return this.portfolioActor
        case 'price_archive': return this.priceActor
        case 'dao_admin_archive': return this.daoAdminActor
        case 'dao_allocation_archive': return this.daoAllocationActor
        case 'dao_governance_archive': return this.daoGovernanceActor
        default: return this.tradingActor
      }
    }
  },
  async mounted() {
    // Alternative approach: You could use JSON.stringify with a replacer like this:
    // JSON.stringify(someObject, (key, value) => typeof value === 'bigint' ? Number(value) : value)
    // But for Vue reactivity, it's better to convert the data upfront as we're doing
    
    // Load naming system data for principal and neuron names
    try {
      await this.tacoStore.loadAllNames()
    } catch (error) {
      console.warn('Failed to load naming system data:', error)
    }
    
    // Create archive actors
    await this.createArchiveActors()
    
    this.refreshStatus()
    this.refreshLogs()
    
    // Load the first blocks
    await this.loadFirstBlocks()
    
    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.refreshStatus()
    }, 10000)
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    
    // Clean up portfolio charts
    this.cleanupPortfolioCharts()
  },
  methods: {
    // Canister ID functions using actual deployed canister IDs from canister_ids.json
    tradingArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_TRADING_ARCHIVE_IC || 'jmze3-hiaaa-aaaan-qz4xq-cai';
        case "staging":
          return process.env.CANISTER_ID_TRADING_ARCHIVE_STAGING || 'jlycp-kqaaa-aaaan-qz4xa-cai';
      }
      return 'jlycp-kqaaa-aaaan-qz4xa-cai'; // fallback to staging canisterId for local
    },

    portfolioArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_IC || 'bl7x7-wiaaa-aaaan-qz5bq-cai'; // fallback to staging as no IC deployment yet
        case "staging":  
          return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_STAGING || 'lrekt-uaaaa-aaaan-qz4ya-cai';
      }
      return 'lrekt-uaaaa-aaaan-qz4ya-cai'; // fallback to staging canisterId for local
    },

    priceArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_PRICE_ARCHIVE_IC || 'bm6rl-3qaaa-aaaan-qz5ba-cai'; // fallback to staging as no IC deployment yet
        case "staging":
          return process.env.CANISTER_ID_PRICE_ARCHIVE_STAGING || 'l7gh3-pqaaa-aaaan-qz4za-cai';
      }
      return 'l7gh3-pqaaa-aaaan-qz4za-cai'; // fallback to staging canisterId for local
    },

    daoAdminArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_DAO_ADMIN_ARCHIVE_IC || 'b6ygs-xaaaa-aaaan-qz5ca-cai'; // fallback to staging
        case "staging":
          return process.env.CANISTER_ID_DAO_ADMIN_ARCHIVE_STAGING || 'b6ygs-xaaaa-aaaan-qz5ca-cai';
      }
      return 'b6ygs-xaaaa-aaaan-qz5ca-cai'; // fallback to staging canisterId for local
    },

    daoAllocationArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_DAO_ALLOCATION_ARCHIVE_IC || 'bq2l2-mqaaa-aaaan-qz5da-cai'; // fallback to staging
        case "staging":
          return process.env.CANISTER_ID_DAO_ALLOCATION_ARCHIVE_STAGING || 'bq2l2-mqaaa-aaaan-qz5da-cai';
      }
      return 'bq2l2-mqaaa-aaaan-qz5da-cai'; // fallback to staging canisterId for local
    },

    daoGovernanceArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_DAO_GOVERNANCE_ARCHIVE_IC || 'bzzag-2yaaa-aaaan-qz5cq-cai'; // fallback to staging
        case "staging":
          return process.env.CANISTER_ID_DAO_GOVERNANCE_ARCHIVE_STAGING || 'bzzag-2yaaa-aaaan-qz5cq-cai';
      }
      return 'bzzag-2yaaa-aaaan-qz5cq-cai'; // fallback to staging canisterId for local
    },

    async createArchiveActors() {
      try {
        // Create authenticated agent (same pattern as store functions)
        const { createAgent } = await import('@dfinity/utils')
        const { AuthClient } = await import('@dfinity/auth-client')
        
        // Get authenticated identity using the same pattern as taco store
        const authClient = await AuthClient.create({
          idleOptions: {
            disableIdle: true,
            disableDefaultIdleCallback: true
          }
        })
        
        const identity = await authClient.getIdentity()
        
        // Determine host
        const host = process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://icp0.io"
        
        // Create agent with authenticated identity
        const agent = await createAgent({
          identity: identity,
          host: host,
          fetchRootKey: process.env.DFX_NETWORK === "local"
        })
        
        // Create actors with proper canister IDs and authenticated agent
        this.tradingActor = createTradingActor(this.tradingArchiveCanisterId(), { agent })
        this.portfolioActor = createPortfolioActor(this.portfolioArchiveCanisterId(), { agent })
        this.priceActor = createPriceActor(this.priceArchiveCanisterId(), { agent })
        this.daoAdminActor = createDaoAdminActor(this.daoAdminArchiveCanisterId(), { agent })
        this.daoAllocationActor = createDaoAllocationActor(this.daoAllocationArchiveCanisterId(), { agent })
        this.daoGovernanceActor = createDaoGovernanceActor(this.daoGovernanceArchiveCanisterId(), { agent })
        
        //console.log('Archive actors created with identity:', identity.getPrincipal().toString())
      } catch (error) {
        console.error('Failed to create archive actors:', error)
        this.errorMessage = 'Failed to initialize archive actors'
      }
    },

    // Helper method to recursively convert BigInt fields to regular numbers for Vue reactivity
    convertBigIntFields(obj) {
      if (obj === null || obj === undefined) return obj
      
      // Handle primitive BigInt
      if (typeof obj === 'bigint') {
        return Number(obj)
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => this.convertBigIntFields(item))
      }
      
      // Handle objects
      if (typeof obj === 'object') {
        const converted = {}
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = this.convertBigIntFields(value)
        }
        return converted
      }
      
      // Return primitive values as-is
      return obj
    },

    async onArchiveChange() {
      this.clearMessages()
      // Reset block browser state when switching archives
      this.blockBrowserBlocks = []
      this.currentBlockStart = 0
      this.expandedBlocks = []
      this.showRawJson = []
      this.blockBrowserIndex = null
      
      await this.refreshStatus()
      await this.refreshLogs()
      // Load the first blocks for the new archive
      await this.loadFirstBlocks()
    },

    async refreshStatus() {
      this.loading = true
      this.clearMessages()
      
      try {
        // Get comprehensive timer status
        const rawTimerStatus = await this.currentArchiveActor.getTimerStatus()
        this.timerStatus = this.convertBigIntFields(rawTimerStatus)
        
        // Get legacy status for compatibility
        const rawLegacyStatus = await this.currentArchiveActor.getBatchImportStatus()
        this.legacyStatus = this.convertBigIntFields(rawLegacyStatus)
        
        // Get archive status - try new public method first, fallback to old method
        try {
          if (this.currentArchiveActor.getArchiveStats) {
            const rawStatus = await this.currentArchiveActor.getArchiveStats()
            this.archiveStatus = this.convertBigIntFields(rawStatus)
          } else {
            const archiveStatusResult = await this.currentArchiveActor.getArchiveStatus()
            if (archiveStatusResult.ok) {
              this.archiveStatus = this.convertBigIntFields(archiveStatusResult.ok)
            } else {
              console.error('Failed to get archive status:', archiveStatusResult.err)
              this.errorMessage = `Failed to get archive status: ${archiveStatusResult.err}`
            }
          }
        } catch (error) {
          console.error('Error getting archive stats, trying fallback method:', error)
          // Fallback to old method
          const archiveStatusResult = await this.currentArchiveActor.getArchiveStatus()
          if (archiveStatusResult.ok) {
            this.archiveStatus = this.convertBigIntFields(archiveStatusResult.ok)
          } else {
            throw new Error(`Both methods failed: ${archiveStatusResult.err}`)
          }
        }
      } catch (error) {
        this.errorMessage = `Failed to refresh status: ${error.message}`
        console.error('Status refresh error:', error)
      }
      
      this.loading = false
    },

    async refreshLogs() {
      try {
        this.logs = await this.currentArchiveActor.getLogs(50)
      } catch (error) {
        console.error('Failed to refresh logs:', error)
      }
    },

    async startBatchImportSystem() {
      //console.log('startBatchImportSystem called')
      this.loading = true
      this.clearMessages()
      
      try {
        //console.log('Calling startBatchImportSystem on actor:', this.currentArchiveActor)
        const result = await this.currentArchiveActor.startBatchImportSystem()
        //console.log('startBatchImportSystem result:', result)
        if (result.ok) {
          this.successMessage = result.ok
        } else {
          this.errorMessage = result.err
        }
        await this.refreshStatus()
      } catch (error) {
        console.error('startBatchImportSystem error:', error)
        this.errorMessage = `Failed to start batch import system: ${error.message}`
      }
      
      this.loading = false
    },

    async stopBatchImportSystem() {
      this.loading = true
      this.clearMessages()
      
      try {
        const result = await this.currentArchiveActor.stopBatchImportSystem()
        if (result.ok) {
          this.successMessage = result.ok
        } else {
          this.errorMessage = result.err
        }
        await this.refreshStatus()
      } catch (error) {
        this.errorMessage = `Failed to stop batch import system: ${error.message}`
      }
      
      this.loading = false
    },

    async resetImportTimestamps() {
      //console.log('resetImportTimestamps called')
      this.loading = true
      this.clearMessages()
      
      try {
        const result = await this.currentArchiveActor.resetImportTimestamps()
        //console.log('resetImportTimestamps result:', result)
        if (result.ok) {
          this.successMessage = `Import timestamps reset: ${result.ok}`
        } else {
          this.errorMessage = `Failed to reset timestamps: ${result.err}`
        }
        await this.refreshStatus()
      } catch (error) {
        console.error('resetImportTimestamps error:', error)
        this.errorMessage = `Failed to reset import timestamps: ${error.message}`
      }
      
      this.loading = false
    },

    async runArchiveSpecificImport(methodName) {
      this.loading = true
      this.clearMessages()
      
      try {
        this.successMessage = `Running ${methodName}... Check logs for progress.`
        const result = await this.currentArchiveActor[methodName]()
        
        if (result.ok) {
          this.successMessage = `${methodName} completed: ${result.ok}`
        } else {
          this.errorMessage = `${methodName} failed: ${result.err}`
        }
        await this.refreshStatus()
      } catch (error) {
        console.error(`${methodName} error:`, error)
        this.errorMessage = `Failed to run ${methodName}: ${error.message}`
      }
      
      this.loading = false
    },

    async stopAllTimers() {
      this.loading = true
      this.clearMessages()
      
      try {
        const result = await this.currentArchiveActor.stopAllTimers()
        if (result.ok) {
          this.successMessage = result.ok
        } else {
          this.errorMessage = result.err
        }
        await this.refreshStatus()
      } catch (error) {
        this.errorMessage = `Failed to stop all timers: ${error.message}`
      }
      
      this.loading = false
    },

    async runManualBatchImport() {
      //console.log('runManualBatchImport called')
      this.loading = true
      this.clearMessages()
      this.successMessage = 'Manual batch import started. Check logs for progress...'
      
      try {
        //console.log('Calling runManualBatchImport on actor:', this.currentArchiveActor)
        const result = await this.currentArchiveActor.runManualBatchImport()
        //console.log('runManualBatchImport result:', result)
        if (result.ok) {
          this.successMessage = result.ok
        } else {
          this.errorMessage = result.err
        }
        await this.refreshStatus()
        await this.refreshLogs()
      } catch (error) {
        console.error('runManualBatchImport error:', error)
        this.errorMessage = `Failed to run manual batch import: ${error.message}`
      }
      
      this.loading = false
    },

    async updateConfiguration() {
      this.loading = true
      this.clearMessages()
      
      try {
        const result = await this.currentArchiveActor.setMaxInnerLoopIterations(
          parseInt(this.configMaxIterations)
        )
        if (result.ok) {
          this.successMessage = result.ok
          this.showConfigModal = false
        } else {
          this.errorMessage = result.err
        }
        await this.refreshStatus()
      } catch (error) {
        this.errorMessage = `Failed to update configuration: ${error.message}`
      }
      
      this.loading = false
    },

    clearMessages() {
      this.errorMessage = ''
      this.successMessage = ''
    },

    formatTime(timestamp) {
      if (!timestamp || timestamp === 0) return 'Never'
      
      const date = new Date(Number(timestamp) / 1000000) // Convert nanoseconds to milliseconds
      return date.toLocaleString()
    },

    getOverallStatus() {
      if (!this.timerStatus) return 'Unknown'
      
      if (this.timerStatus.innerLoopRunning) return 'Importing'
      if (this.timerStatus.middleLoopRunning) return 'Coordinating'
      if (this.timerStatus.outerLoopRunning) return 'Scheduled'
      return 'Stopped'
    },

    getOverallStatusBadge() {
      const status = this.getOverallStatus()
      switch (status) {
        case 'Importing': return 'bg-success'
        case 'Coordinating': return 'bg-info' 
        case 'Scheduled': return 'bg-primary'
        case 'Stopped': return 'bg-secondary'
        default: return 'bg-dark'
      }
    },

    getArchiveStatusBadge() {
      switch (this.selectedArchive) {
        case 'trading_archive': return 'bg-success'
        case 'portfolio_archive': return 'bg-info'
        case 'price_archive': return 'bg-warning'
        case 'dao_admin_archive': return 'bg-primary'
        case 'dao_allocation_archive': return 'bg-info'
        case 'dao_governance_archive': return 'bg-secondary'
        default: return 'bg-secondary'
      }
    },

    getArchiveSpecificStatus() {
      if (!this.legacyStatus) return 'Unknown'
      
      // Add archive-specific status details
      switch (this.selectedArchive) {
        case 'trading_archive':
          const tradeTime = this.legacyStatus.lastImportedTradeTimestamp || 0
          return `Trades: ${this.formatTime(tradeTime)} (${tradeTime}), Alerts: ${this.legacyStatus.lastImportedPriceAlertId || 0}`
        case 'portfolio_archive':
          const portfolioTime = this.legacyStatus.lastPortfolioImportTime || 0
          return `Last: ${this.formatTime(portfolioTime)} (${portfolioTime})`
        case 'price_archive':
          const priceTime = this.legacyStatus.lastImportedPriceTime || 0
          return `Last: ${this.formatTime(priceTime)} (${priceTime})`
        case 'dao_admin_archive':
          // DAO admin archive status - shows admin action imports
          return 'Admin Actions Archive - Structured logging of administrative events'
        case 'dao_allocation_archive':
          // DAO allocation archive status - shows allocation and follow actions
          return 'Allocation Archive - User allocation changes and follow relationships'
        case 'dao_governance_archive':
          // DAO governance archive status - shows voting power and neuron updates
          return 'Governance Archive - Voting power changes and neuron updates'
        default:
          return 'Unknown'
      }
    },

    getLogLevelClass(level) {
      switch (level) {
        case 'ERROR': return 'log-error'
        case 'WARN': return 'log-warn'
        case 'INFO': return 'log-info'
        default: return ''
      }
    },

    // ========== ICRC3 Block Browser Methods ==========

    async refreshBlocks() {
      await this.loadBlocks(this.currentBlockStart, this.blockBrowserPageSize)
    },

    async loadBlocks(start, length) {
      if (!this.currentArchiveActor) return
      
      this.blockBrowserLoading = true
      try {
        // ICRC3 takes a vector of ranges, not a single range object
        const args = [
          {
            start: start,
            length: length
          }
        ]
        
        const result = await this.currentArchiveActor.icrc3_get_blocks(args)
        
        if (result.blocks) {
          this.blockBrowserBlocks = result.blocks.map(block => ({
            ...block,
            // Convert any BigInt values to Numbers for display
            id: typeof block.id === 'bigint' ? Number(block.id) : block.id,
            timestamp: typeof block.timestamp === 'bigint' ? Number(block.timestamp) : block.timestamp
          }))
          this.currentBlockStart = start
        } else {
          this.blockBrowserBlocks = []
          console.error('Unexpected block result format:', result)
        }
      } catch (error) {
        console.error('Failed to load blocks:', error)
        this.errorMessage = `Failed to load blocks: ${error.message}`
        this.blockBrowserBlocks = []
      }
      this.blockBrowserLoading = false
    },

    async loadFirstBlocks() {
      await this.loadBlocks(0, this.blockBrowserPageSize)
    },

    async loadPreviousBlocks() {
      const newStart = Math.max(0, this.currentBlockStart - this.blockBrowserPageSize)
      await this.loadBlocks(newStart, this.blockBrowserPageSize)
    },

    async loadNextBlocks() {
      const newStart = this.currentBlockStart + this.blockBrowserPageSize
      await this.loadBlocks(newStart, this.blockBrowserPageSize)
    },

    async loadLastBlocks() {
      const totalBlocks = this.archiveStatus?.totalBlocks || 0
      if (totalBlocks === 0) return
      
      const lastPageStart = Math.max(0, totalBlocks - this.blockBrowserPageSize)
      await this.loadBlocks(lastPageStart, this.blockBrowserPageSize)
    },

    async loadSpecificBlock() {
      if (this.blockBrowserIndex === null || this.blockBrowserIndex === undefined) {
        this.errorMessage = 'Please enter a valid block index'
        return
      }
      
      // Load a range around the specific block
      const start = Math.max(0, this.blockBrowserIndex - Math.floor(this.blockBrowserPageSize / 2))
      await this.loadBlocks(start, this.blockBrowserPageSize)
    },

    toggleBlockExpanded(blockId) {
      const index = this.expandedBlocks.indexOf(blockId)
      if (index > -1) {
        this.expandedBlocks.splice(index, 1)
        // Clean up charts in the collapsed block
        this.cleanupChartsInBlock(blockId)
      } else {
        this.expandedBlocks.push(blockId)
        
        // Wait for DOM update, then check if we need to render a portfolio chart
        this.$nextTick(() => {
          this.renderPortfolioChartsIfNeeded()
        })
      }
    },

    // Clean up charts in a specific block
    cleanupChartsInBlock(blockId) {
      // Find charts within the collapsed block and destroy them
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`)
      if (blockElement) {
        const chartContainers = blockElement.querySelectorAll('.portfolio-chart')
        chartContainers.forEach(container => {
          const chartId = container.id
          if (chartId && this.portfolioCharts.has(chartId)) {
            try {
              this.portfolioCharts.get(chartId).destroy()
              this.portfolioCharts.delete(chartId)
              container.innerHTML = '' // Clear container
            } catch (error) {
              console.warn('Error destroying chart:', chartId, error)
              // Force cleanup
              this.portfolioCharts.delete(chartId)
              container.innerHTML = ''
            }
          }
        })
      }
    },

    // Clean up all portfolio charts
    cleanupPortfolioCharts() {
      // Destroy all chart instances
      this.portfolioCharts.forEach((chart, chartId) => {
        try {
          chart.destroy()
        } catch (error) {
          console.warn('Error destroying chart during cleanup:', chartId, error)
        }
      })
      this.portfolioCharts.clear()
      
      // Also clean up any orphaned charts
      const chartContainers = document.querySelectorAll('.portfolio-chart')
      chartContainers.forEach(container => {
        if (container.innerHTML) {
          container.innerHTML = '' // Clear any remaining chart content
        }
      })
    },

    // Simplified portfolio chart rendering 
    renderPortfolioChartsIfNeeded() {
      // Single reliable check with proper timing
      this.$nextTick(() => {
        setTimeout(() => {
          this.findAndRenderMissingCharts()
        }, 200)
      })
    },

    // Find and render any missing portfolio charts
    findAndRenderMissingCharts() {
      const chartContainers = document.querySelectorAll('.portfolio-chart')
      
      chartContainers.forEach((container) => {
        const chartId = container.id
        
        // Only render if container is empty and we don't already have this chart
        if (chartId && container.children.length === 0 && !this.portfolioCharts.has(chartId)) {
          // Find the parent block to extract data
          const blockElement = container.closest('[data-block-id]')
          if (blockElement) {
            const blockId = blockElement.getAttribute('data-block-id')
            const blockData = this.blockBrowserBlocks.find(block => block.id.toString() === blockId.toString())
            
            if (blockData) {
              const parsedData = this.parseICRC3Value(blockData.block)
              
              // Extract data from ICRC3 nested structure
              let blockDataToProcess = parsedData
              if (parsedData.tx && parsedData.tx.data) {
                blockDataToProcess = parsedData.tx.data
              }
              
              if (blockDataToProcess.tokens || blockDataToProcess.btype === '3portfolio') {
                const chartData = this.preparePortfolioChartData(blockDataToProcess.tokens)
                
                if (chartData) {
                  this.renderPortfolioChart(chartData, chartId)
                }
              }
            }
          }
        }
      })
    },

    toggleRawJson(blockId) {
      const index = this.showRawJson.indexOf(blockId)
      if (index > -1) {
        this.showRawJson.splice(index, 1)
      } else {
        this.showRawJson.push(blockId)
      }
    },

    getFormattedBlockDetails(blockData) {
      //console.log('=== getFormattedBlockDetails called ===', blockData)
      
      if (!blockData || typeof blockData !== 'object') {
        return '<p class="text-muted">Invalid block data</p>'
      }

      const parsedData = this.parseICRC3Value(blockData)
      //console.log('Parsed block data:', parsedData)

      // Extract trade data from new ICRC3 nested structure
      // New format: { tx: { data: { btype: "3trade", trader: ..., etc } } }
      // Old format: { btype: "3trade", trader: ..., etc } (direct)
      let tradeData = parsedData
      if (parsedData.tx && parsedData.tx.data) {
        tradeData = parsedData.tx.data
        //console.log('Extracted trade data from ICRC3 structure:', tradeData)
      }

      // Trading block details  
      if (tradeData.btype === '3trade' || tradeData.trader || tradeData.token_sold) {
        //console.log('=== Processing detailed trading block ===', tradeData)
        
        // Fix success detection - handle BigInt 1n, "1n", "1", 1, or BigInt 0n, "0n", "0", 0
        const successValue = tradeData.success
        //console.log('Raw success value in details:', successValue, typeof successValue)
        
        let success = false
        if (typeof successValue === 'bigint') {
          // Handle BigInt: 1n = success, 0n = failure
          success = successValue === 1n
        } else if (typeof successValue === 'string') {
          success = successValue === '1n' || successValue === '1'
        } else if (typeof successValue === 'number') {
          success = successValue === 1
        }
        
        const traderDisplay = this.formatTraderDisplay(tradeData.trader)
        
        const tokenSold = this.formatTokenName(tradeData.token_sold)
        const tokenBought = this.formatTokenName(tradeData.token_bought)
        const amountSold = this.formatAmount(tradeData.amount_sold, tradeData.token_sold)
        const amountBought = this.formatAmount(tradeData.amount_bought, tradeData.token_bought)
        const exchange = tradeData.exchange || 'Unknown Exchange'
        const slippage = tradeData.slippage ? `${parseFloat(tradeData.slippage).toFixed(4)}%` : '0%'
        const fee = this.formatAmount(tradeData.fee || '0')
        const error = tradeData.error || null

        // Calculate exchange rate with proper decimal handling
        let exchangeRate = 'N/A'
        try {
          const soldMetadata = this.getTokenMetadataFromBlob(tradeData.token_sold)
          const boughtMetadata = this.getTokenMetadataFromBlob(tradeData.token_bought)
          
          const soldDecimals = soldMetadata?.decimals ? Number(soldMetadata.decimals) : 8
          const boughtDecimals = boughtMetadata?.decimals ? Number(boughtMetadata.decimals) : 8
          
          const soldAmount = parseFloat(tradeData.amount_sold || 0) / Math.pow(10, soldDecimals)
          const boughtAmount = parseFloat(tradeData.amount_bought || 0) / Math.pow(10, boughtDecimals)
          
          if (soldAmount > 0) {
            exchangeRate = (boughtAmount / soldAmount).toFixed(6)
          }
        } catch (rateError) {
          console.warn('Error calculating exchange rate:', rateError)
        }

        // Extract and format timestamp
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `
          <div class="row">
            <div class="col-md-6">
              <h6>🔄 Trade Details</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Status:</strong></td><td>${success ? '<span class="text-success">✅ Successful</span>' : '<span class="text-danger">❌ Failed</span>'}</td></tr>
                <tr><td><strong>Exchange:</strong></td><td>${exchange}</td></tr>
                <tr><td><strong>Trader:</strong></td><td><code>${traderDisplay}</code></td></tr>
                <tr><td><strong>Executed:</strong></td><td><span class="text-info">🕐 ${formattedTime}</span></td></tr>
                <tr><td><strong>Slippage:</strong></td><td>${slippage}</td></tr>
                <tr><td><strong>Fee:</strong></td><td>${fee}</td></tr>
              </table>
            </div>
            <div class="col-md-6">
              <h6>💱 Transaction</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Sold:</strong></td><td>${amountSold} ${tokenSold}</td></tr>
                <tr><td><strong>Bought:</strong></td><td>${amountBought} ${tokenBought}</td></tr>
                <tr><td><strong>Rate:</strong></td><td>1 ${tokenSold} = ${exchangeRate} ${tokenBought}</td></tr>
              </table>
            </div>
          </div>
          ${error ? `<div class="alert alert-warning mt-2"><strong>Error:</strong> ${error}</div>` : ''}
        `
      }

      // Circuit breaker block details
      if (tradeData.btype === '3circuit' || tradeData.event_type || tradeData.eventType) {
        //console.log('=== Processing detailed circuit breaker block ===', tradeData)
        
        const eventType = tradeData.event_type || tradeData.eventType || 'Unknown Event'
        const eventName = this.formatEventTypeName(eventType)
        const severity = tradeData.severity || 'Unknown'
        const thresholdValue = tradeData.threshold_value || 'N/A'
        const actualValue = tradeData.actual_value || 'N/A'
        const systemResponse = tradeData.system_response || 'No response recorded'
        
        // Format affected tokens
        let affectedTokens = 'None specified'
        if (tradeData.tokens_affected && Array.isArray(tradeData.tokens_affected)) {
          const tokenNames = tradeData.tokens_affected.map(token => this.formatTokenName(token)).filter(name => name !== 'Unknown')
          affectedTokens = tokenNames.length ? tokenNames.join(', ') : 'None specified'
        }
        
        // Format trigger token
        let triggerToken = 'N/A'
        if (tradeData.trigger_token) {
          triggerToken = this.formatTokenName(tradeData.trigger_token)
        }
        
        // Extract and format timestamp
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `
          <div class="row">
            <div class="col-md-6">
              <h6>🚨 Circuit Breaker Event</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Event Type:</strong></td><td>${eventName}</td></tr>
                <tr><td><strong>Severity:</strong></td><td><span class="badge ${this.getSeverityClass(severity)}">${severity}</span></td></tr>
                <tr><td><strong>Triggered:</strong></td><td><span class="text-warning">🕐 ${formattedTime}</span></td></tr>
                <tr><td><strong>Trigger Token:</strong></td><td>${triggerToken}</td></tr>
                <tr><td><strong>Affected Tokens:</strong></td><td>${affectedTokens}</td></tr>
              </table>
            </div>
            <div class="col-md-6">
              <h6>📊 Event Details</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Threshold:</strong></td><td>${thresholdValue}</td></tr>
                <tr><td><strong>Actual Value:</strong></td><td>${actualValue}</td></tr>
                <tr><td><strong>System Response:</strong></td><td><em>"${systemResponse}"</em></td></tr>
              </table>
            </div>
          </div>
        `
      }

      // Portfolio block details
      if (tradeData.btype === '3portfolio' || tradeData.portfolioSnapshot || tradeData.total_value_icp || tradeData.token_count || tradeData.tokens) {
        //console.log('=== Processing detailed portfolio block ===', tradeData)
        
        // Extract comprehensive portfolio data
        const tokenCount = tradeData.token_count || tradeData.tokens?.length || 0
        const totalValueIcp = this.formatPortfolioAmount(tradeData.total_value_icp)
        const totalValueUsd = tradeData.total_value_usd || 'N/A'
        const reason = tradeData.reason || 'Unknown'
        
        // Process detailed token information
        let tokenDetailsHtml = 'No detailed token information available'
        if (tradeData.tokens && Array.isArray(tradeData.tokens)) {
          //console.log('=== Processing detailed tokens ===', tradeData.tokens)
          
          const tokenRows = tradeData.tokens.map(token => {
            //console.log('=== Processing individual token ===', token)
            
            // Extract detailed token data from ICRC3 Map structure
            const tokenPrincipal = this.extractTokenPrincipal(token.token)
            const balance = this.extractBigIntValue(token.balance) || 0
            const decimals = this.extractNatValue(token.decimals) || 8
            const priceInICP = this.extractBigIntValue(token.price_in_icp) || 0
            const priceInUSD = this.extractTextValue(token.price_in_usd) || '0'
            const valueInICP = this.extractBigIntValue(token.value_in_icp) || 0
            const valueInUSD = this.extractTextValue(token.value_in_usd) || '0'
            
            //console.log('=== Extracted token data ===', {
            //  tokenPrincipal, balance, decimals, priceInICP, priceInUSD, valueInICP, valueInUSD
            //})
            
            // Get token symbol (fallback to truncated principal)
            const tokenSymbol = this.formatTokenName(tokenPrincipal)
            
            // Format balance with proper decimals
            const formattedBalance = this.formatAmount(balance, { decimals: decimals })
            const formattedPriceICP = this.formatPortfolioAmount(priceInICP)
            const formattedValueICP = this.formatPortfolioAmount(valueInICP)
            
            return `
              <tr>
                <td><strong>${tokenSymbol}</strong></td>
                <td>${formattedBalance}</td>
                <td>${formattedPriceICP} ICP<br/><small class="text-muted">$${priceInUSD}</small></td>
                <td>${formattedValueICP} ICP<br/><small class="text-muted">$${valueInUSD}</small></td>
              </tr>
            `
          }).join('')
          
          tokenDetailsHtml = `
            <table class="table table-sm table-dark table-striped">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Balance</th>
                  <th>Price</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${tokenRows}
              </tbody>
            </table>
          `
        }
        
        // Format paused tokens (these are still just Principal IDs)
        let pausedTokensList = 'None'
        if (tradeData.paused_tokens && Array.isArray(tradeData.paused_tokens) && tradeData.paused_tokens.length > 0) {
          const pausedNames = tradeData.paused_tokens.map(token => this.formatTokenName(token)).filter(name => name !== 'Unknown')
          pausedTokensList = pausedNames.length ? pausedNames.join(', ') : 'None'
        }
        
        // Prepare chart data for the half-pie
        const chartData = this.preparePortfolioChartData(tradeData.tokens)
        
        // Generate unique chart ID
        const chartId = `portfolio-chart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        
        // Store chart data for rendering after DOM is ready
        if (chartData) {
          // Direct chart rendering with proper timing
          this.$nextTick(() => {
            setTimeout(() => {
              const container = document.querySelector(`#${chartId}`)
              if (container && !this.portfolioCharts.has(chartId)) {
                this.renderPortfolioChart(chartData, chartId)
              }
            }, 150) // Balanced delay for DOM readiness
          })
        }
        
        // Extract and format timestamp
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `
          <div class="row">
            <div class="col-md-5">
              <h6>💼 Portfolio Summary</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Total Tokens:</strong></td><td>${tokenCount}</td></tr>
                <tr><td><strong>Total Value (ICP):</strong></td><td>${totalValueIcp || 'N/A'}</td></tr>
                <tr><td><strong>Total Value (USD):</strong></td><td>$${totalValueUsd}</td></tr>
                <tr><td><strong>Snapshot Taken:</strong></td><td><span class="text-success">🕐 ${formattedTime}</span></td></tr>
                <tr><td><strong>Snapshot Reason:</strong></td><td><span class="badge ${this.getSnapshotReasonClass(reason)}">${this.formatSnapshotReason(reason)}</span></td></tr>
                ${pausedTokensList !== 'None' ? `<tr><td><strong>Paused Tokens:</strong></td><td>${pausedTokensList}</td></tr>` : ''}
              </table>
              
              <!-- Half-pie chart container -->
              <div class="portfolio-chart-container mt-3" style="height: 200px;">
                <div class="portfolio-chart" id="${chartId}"></div>
              </div>
            </div>
            <div class="col-md-7">
              <h6>📊 Detailed Token Holdings</h6>
              ${tokenDetailsHtml}
            </div>
          </div>
        `
      }

      // Price block details
      if (tradeData.btype === '3price' || tradeData.price_icp || tradeData.price_usd) {
        // Extract price data
        const tokenSymbol = this.formatTokenName(tradeData.token) || 'Unknown Token'
        const priceUSD = tradeData.price_usd || 'Unknown'
        const source = tradeData.source || 'Unknown Source'
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        
        // Calculate price ratios and trends
        const icpAmount = this.extractBigIntValue(tradeData.price_icp) || 0
        const usdPrice = parseFloat(priceUSD) || 0
        
        // Format ICP amount properly (from e8s)
        const icpFormatted = icpAmount > 0 ? (Number(icpAmount) / 100000000).toFixed(8) + ' ICP' : 'Unknown'
        const usdFormatted = usdPrice > 0 ? '$' + usdPrice.toFixed(6) : 'Unknown'
        
        // Calculate ICP/USD rate if both prices available
        let icpUsdRate = 'Unknown'
        if (icpAmount > 0 && usdPrice > 0) {
          const icpValue = Number(icpAmount) / 100000000
          const rate = usdPrice / icpValue
          icpUsdRate = '$' + rate.toFixed(2) + ' per ICP'
        }
        
        return `
          <div class="row">
            <div class="col-md-6">
              <h6>💰 Price Update</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Token:</strong></td><td><span class="badge bg-primary">${tokenSymbol}</span></td></tr>
                <tr><td><strong>Price (ICP):</strong></td><td class="text-warning">${icpFormatted}</td></tr>
                <tr><td><strong>Price (USD):</strong></td><td class="text-success">${usdFormatted}</td></tr>
                <tr><td><strong>Source:</strong></td><td><span class="badge bg-secondary">${source}</span></td></tr>
              </table>
            </div>
            <div class="col-md-6">
              <h6>📊 Price Details</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>Recorded:</strong></td><td><span class="text-primary">🕐 ${this.formatTime(Number(timestamp))}</span></td></tr>
                <tr><td><strong>ICP Rate:</strong></td><td class="text-info">${icpUsdRate}</td></tr>
                <tr><td><strong>Data Source:</strong></td><td>${source === 'NTN' ? '🌐 NTN Network' : source}</td></tr>
                <tr><td><strong>Block Type:</strong></td><td><span class="badge bg-info">Price Feed</span></td></tr>
              </table>
            </div>
          </div>
        `
      }

      // Allocation change block details
      if ((parsedData.tx && parsedData.tx.operation === '3allocation_change') || tradeData.operation === '3allocation_change') {
        //console.log('=== Processing allocation change block ===', tradeData)
        
        // Extract allocation data from the nested structure
        let allocationData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          allocationData = parsedData.tx.data
        }
        
        const userId = this.formatPrincipalFromBlob(allocationData.user)
        const changeType = allocationData.changeType?.type || 'Unknown'
        const userInitiated = allocationData.changeType?.userInitiated === 1n || allocationData.changeType?.userInitiated === '1'
        // Voting power not available in current data structure (always 0)
        const votingPower = 0
        const reason = allocationData.reason || 'No reason provided'
        const timestamp = allocationData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        // Old allocations not available in current data structure
        let oldAllocationsHtml = '<em class="text-muted">Not available (requires DAO migration)</em>'
        
        // Format new allocations
        let newAllocationsHtml = '<em class="text-muted">None</em>'
        if (allocationData.newAllocations && allocationData.newAllocations.length > 0) {
          newAllocationsHtml = allocationData.newAllocations.map(allocation => {
            const tokenName = this.formatTokenNameFromBlob(allocation.token)
            const percentage = (Number(allocation.basisPoints) / 100).toFixed(2)
            return `<span class="badge bg-primary me-1">${tokenName}: ${percentage}%</span>`
          }).join('')
        }
        
        // Calculate total percentages
        const oldTotal = allocationData.oldAllocations ? 
          (allocationData.oldAllocations.reduce((sum, a) => sum + Number(a.basisPoints), 0) / 100).toFixed(2) : '0.00'
        const newTotal = allocationData.newAllocations ? 
          (allocationData.newAllocations.reduce((sum, a) => sum + Number(a.basisPoints), 0) / 100).toFixed(2) : '0.00'
        
        return `
          <div class="row">
            <div class="col-md-6">
              <h6>📊 Allocation Change</h6>
              <table class="table table-sm table-dark">
                <tr><td><strong>User:</strong></td><td><code>${userId}</code></td></tr>
                <tr><td><strong>Change Type:</strong></td><td><span class="badge ${userInitiated ? 'bg-success' : 'bg-warning'}">${changeType}</span></td></tr>
                <tr><td><strong>Initiated By:</strong></td><td>${userInitiated ? '👤 User' : '🤖 System'}</td></tr>
                <tr><td><strong>Timestamp:</strong></td><td><span class="text-info">🕐 ${formattedTime}</span></td></tr>
                <tr><td><strong>Voting Power:</strong></td><td>${votingPower}</td></tr>
              </table>
            </div>
            <div class="col-md-6">
              <h6>🔄 Allocation Details</h6>
              <table class="table table-sm table-dark">
                <tr>
                  <td><strong>Previous:</strong></td>
                  <td>
                    ${oldAllocationsHtml}
                    <br><small class="text-muted">Total: ${oldTotal}%</small>
                  </td>
                </tr>
                <tr>
                  <td><strong>New:</strong></td>
                  <td>
                    ${newAllocationsHtml}
                    <br><small class="text-muted">Total: ${newTotal}%</small>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          <!-- Allocation changes don't have reasons, only admin actions do -->
        `
      }

      // Check for voting power change (dao_governance_archive)
      if ((parsedData.tx && parsedData.tx.operation === '3voting_power') || tradeData.operation === '3voting_power') {
        const votingPowerData = parsedData.tx ? parsedData.tx.data : tradeData
        
        if (!votingPowerData) {
          return '<div class="text-muted">No voting power data available</div>'
        }
        
        const userId = this.formatPrincipalFromBlob(votingPowerData.user)
        const changeType = votingPowerData.changeType || 'Unknown'
        const oldVotingPower = Number(votingPowerData.oldVotingPower || 0)
        const newVotingPower = Number(votingPowerData.newVotingPower || 0)
        const timestamp = votingPowerData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        // Format voting power with commas
        const formatVotingPower = (vp) => {
          return (vp / 100000000).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }) + ' VP'
        }
        
        // Format neurons if available
        let neuronsHtml = '<em class="text-muted">None</em>'
        if (votingPowerData.neurons && votingPowerData.neurons.length > 0) {
          neuronsHtml = votingPowerData.neurons.map(neuron => {
            const neuronId = neuron.neuronId ? this.formatNeuronFromBlob(neuron.neuronId) : 'Unknown'
            const neuronVP = Number(neuron.votingPower || 0)
            const formattedNeuronVP = formatVotingPower(neuronVP)
            return `<span class="badge bg-info me-1">${neuronId}: ${formattedNeuronVP}</span>`
          }).join('')
        }
        
        // Calculate change
        const vpChange = newVotingPower - oldVotingPower
        const changeDirection = vpChange > 0 ? '📈' : vpChange < 0 ? '📉' : '➡️'
        const changeClass = vpChange > 0 ? 'text-success' : vpChange < 0 ? 'text-danger' : 'text-muted'
        
        return `
          <div class="card bg-dark border-info">
            <div class="card-header bg-info text-dark">
              <h6 class="mb-0">🗳️ Voting Power Change</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>📊 Power Details</h6>
                  <table class="table table-sm table-dark table-borderless">
                    <tr>
                      <td><strong>User:</strong></td>
                      <td><code class="text-info">${userId}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Change Type:</strong></td>
                      <td><span class="badge bg-secondary">${changeType}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Previous:</strong></td>
                      <td>${formatVotingPower(oldVotingPower)}</td>
                    </tr>
                    <tr>
                      <td><strong>New:</strong></td>
                      <td><strong class="${changeClass}">${formatVotingPower(newVotingPower)}</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Change:</strong></td>
                      <td><span class="${changeClass}">${changeDirection} ${formatVotingPower(Math.abs(vpChange))}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Timestamp:</strong></td>
                      <td>🕐 ${formattedTime}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>🧠 Neurons</h6>
                  <div class="mb-2">
                    ${neuronsHtml}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      }

      // Check for neuron update (dao_governance_archive) - detailed view
      if ((parsedData.tx && parsedData.tx.operation === '3neuron_update') || tradeData.operation === '3neuron_update') {
        const neuronUpdateData = parsedData.tx ? parsedData.tx.data : tradeData
        
        if (!neuronUpdateData) {
          return '<div class="text-muted">No neuron update data available</div>'
        }
        
        const neuronId = neuronUpdateData.neuronId ? this.formatNeuronFromBlob(neuronUpdateData.neuronId) : 'Unknown'
        const neuronIdShort = neuronId
        const updateType = neuronUpdateData.updateType || 'Unknown'
        const oldVotingPower = Number(neuronUpdateData.oldVotingPower || 0)
        const newVotingPower = Number(neuronUpdateData.newVotingPower || 0)
        const timestamp = neuronUpdateData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        // Format voting power with commas
        const formatVotingPower = (vp) => {
          return (vp / 100000000).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }) + ' VP'
        }
        
        // Format affected users
        let affectedUsersHtml = '<em class="text-muted">None</em>'
        if (neuronUpdateData.affectedUsers && neuronUpdateData.affectedUsers.length > 0) {
          affectedUsersHtml = neuronUpdateData.affectedUsers.map(userBlob => {
            const userId = this.formatPrincipalFromBlob(userBlob)
            const userShort = userId.length > 16 ? userId.substring(0, 6) + '...' + userId.substring(userId.length - 6) : userId
            return `<span class="badge bg-warning text-dark me-1">${userShort}</span>`
          }).join('')
        }
        
        // Calculate change
        const vpChange = newVotingPower - oldVotingPower
        const changeDirection = vpChange > 0 ? '📈' : vpChange < 0 ? '📉' : '➡️'
        const changeClass = vpChange > 0 ? 'text-success' : vpChange < 0 ? 'text-danger' : 'text-muted'
        
        // Update type styling
        const updateTypeClass = updateType === 'StateChanged' ? 'bg-info' : 
                               updateType === 'VotingPowerChanged' ? 'bg-success' : 
                               updateType === 'Dissolved' ? 'bg-danger' : 'bg-secondary'
        
        return `
          <div class="card bg-dark border-warning">
            <div class="card-header bg-warning text-dark">
              <h6 class="mb-0">🧠 Neuron Update</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>🔧 Update Details</h6>
                  <table class="table table-sm table-dark table-borderless">
                    <tr>
                      <td><strong>Neuron ID:</strong></td>
                      <td><code class="text-warning">${neuronIdShort}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Update Type:</strong></td>
                      <td><span class="badge ${updateTypeClass}">${updateType}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Previous Power:</strong></td>
                      <td>${formatVotingPower(oldVotingPower)}</td>
                    </tr>
                    <tr>
                      <td><strong>New Power:</strong></td>
                      <td><strong class="${changeClass}">${formatVotingPower(newVotingPower)}</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Change:</strong></td>
                      <td><span class="${changeClass}">${changeDirection} ${formatVotingPower(Math.abs(vpChange))}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Timestamp:</strong></td>
                      <td>🕐 ${formattedTime}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>👥 Affected Users</h6>
                  <div class="mb-2">
                    ${affectedUsersHtml}
                  </div>
                  <small class="text-muted">
                    ${neuronUpdateData.affectedUsers ? neuronUpdateData.affectedUsers.length : 0} user(s) affected by this neuron change
                  </small>
                </div>
              </div>
            </div>
          </div>
        `
      }

      // Check for admin action (dao_admin_archive) - detailed view
      if ((parsedData.tx && parsedData.tx.operation === '3admin') || tradeData.operation === '3admin') {
        const adminData = parsedData.tx ? parsedData.tx.data : tradeData
        
        if (!adminData) {
          return '<div class="text-muted">No admin action data available</div>'
        }
        
        const adminId = adminData.admin ? this.formatPrincipalFromBlob(adminData.admin) : 'Unknown'
        const adminShort = adminId.length > 16 ? adminId.substring(0, 8) + '...' + adminId.substring(adminId.length - 8) : adminId
        const canister = adminData.canister || 'Unknown'
        const actionType = adminData.actionType?.type || 'Unknown'
        const reason = adminData.reason || 'No reason provided'
        const success = adminData.success === 1n || adminData.success === '1' || adminData.success === 1
        const errorMessage = adminData.errorMessage || ''
        const timestamp = adminData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        // Format token if present in actionType
        let tokenInfo = ''
        if (adminData.actionType?.token) {
          const tokenPrincipal = this.formatPrincipalFromBlob(adminData.actionType.token)
          const tokenName = this.formatTokenNameFromBlob(adminData.actionType.token)
          tokenInfo = `<tr>
            <td><strong>Token:</strong></td>
            <td><code class="text-info">${tokenName}</code><br><small class="text-muted">${tokenPrincipal}</small></td>
          </tr>`
        }
        
        // Action type styling
        const getActionTypeClass = (type) => {
          switch(type) {
            case 'TokenPause': return 'bg-warning text-dark'
            case 'TokenUnpause': return 'bg-success'
            case 'TokenAdd': return 'bg-primary'
            case 'TokenRemove': return 'bg-danger'
            case 'SystemPause': return 'bg-danger'
            case 'SystemUnpause': return 'bg-success'
            case 'ParameterUpdate': return 'bg-info'
            default: return 'bg-secondary'
          }
        }
        
        // Success/failure styling
        const statusClass = success ? 'text-success' : 'text-danger'
        const statusIcon = success ? '✅' : '❌'
        const statusText = success ? 'Success' : 'Failed'
        
        return `
          <div class="card bg-dark border-danger">
            <div class="card-header bg-danger text-white">
              <h6 class="mb-0">⚙️ Admin Action</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>🔧 Action Details</h6>
                  <table class="table table-sm table-dark table-borderless">
                    <tr>
                      <td><strong>Admin:</strong></td>
                      <td><code class="text-danger">${adminShort}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Canister:</strong></td>
                      <td><span class="badge bg-dark border">${canister}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Action Type:</strong></td>
                      <td><span class="badge ${getActionTypeClass(actionType)}">${actionType}</span></td>
                    </tr>
                    ${tokenInfo}
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td><span class="${statusClass}"><strong>${statusIcon} ${statusText}</strong></span></td>
                    </tr>
                    <tr>
                      <td><strong>Timestamp:</strong></td>
                      <td>🕐 ${formattedTime}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>📝 Reason & Details</h6>
                  <div class="alert alert-info">
                    <strong>Reason:</strong><br>
                    <em>"${reason}"</em>
                  </div>
                  ${this.renderConfigChanges(adminData.actionType)}
                  ${!success && errorMessage ? `
                    <div class="alert alert-danger">
                      <strong>Error:</strong><br>
                      <code>${errorMessage}</code>
                    </div>
                  ` : ''}
                  <small class="text-muted">
                    Admin action executed on ${canister} canister
                  </small>
                </div>
              </div>
            </div>
          </div>
        `
      }

      // Generic block
      const keys = Object.keys(parsedData)
      return `
        <div>
          <h6>📄 Data Block</h6>
          <table class="table table-sm table-dark">
            ${keys.slice(0, 5).map(key => {
              // Use BigInt-safe JSON.stringify with replacer function
              const jsonStr = JSON.stringify(parsedData[key], (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              );
              return `<tr><td><strong>${key}:</strong></td><td>${jsonStr.slice(0, 50)}${jsonStr.length > 50 ? '...' : ''}</td></tr>`;
            }).join('')}
            ${keys.length > 5 ? `<tr><td colspan="2"><em>... and ${keys.length - 5} more fields</em></td></tr>` : ''}
          </table>
        </div>
      `
    },

    getBlockTypeName(blockData) {
      if (!blockData || typeof blockData !== 'object') {
        return 'Unknown'
      }
      
      // Parse ICRC3 Value format
      const parsedData = this.parseICRC3Value(blockData)
      
      // Extract data from new ICRC3 nested structure (same logic as getFormattedBlockDetails)
      let blockTypeData = parsedData
      if (parsedData.tx && parsedData.tx.data) {
        blockTypeData = parsedData.tx.data
      }
      
      // Check for ICRC3 block type field
      if (blockTypeData.btype) {
        if (blockTypeData.btype === '3trade') return 'Trade'
        if (blockTypeData.btype === '3circuit') return 'Circuit Breaker'
        if (blockTypeData.btype === '3portfolio') return 'Portfolio'
        if (blockTypeData.btype === '3price') return 'Price'
        return blockTypeData.btype
      }
      
      // Check for operation field (for DAO archive blocks)
      if (parsedData.tx && parsedData.tx.operation) {
        if (parsedData.tx.operation === '3allocation_change') return 'Allocation Change'
        if (parsedData.tx.operation === '3voting_power') return 'Voting Power Change'
        if (parsedData.tx.operation === '3neuron_update') return 'Neuron Update'
        if (parsedData.tx.operation === '3admin') return 'Admin Action'
        if (parsedData.tx.operation === '3admin_action') return 'Admin Action'
        if (parsedData.tx.operation === '3follow_action') return 'Follow Action'
        return parsedData.tx.operation
      }
      
      // Try to infer type from content
      if (blockTypeData.trader || blockTypeData.token_sold || blockTypeData.tokenSold) {
        return 'Trade'
      }
      if (blockTypeData.event_type || blockTypeData.eventType || blockTypeData.tokensAffected || blockTypeData.tokens_affected) {
        return 'Circuit Breaker'
      }
      if (blockTypeData.portfolioSnapshot || blockTypeData.totalValue || blockTypeData.total_value_icp || blockTypeData.token_count || blockTypeData.active_tokens || blockTypeData.tokens) {
        return 'Portfolio'
      }
      if (blockTypeData.priceHistory || blockTypeData.price || blockTypeData.price_icp || blockTypeData.price_usd) {
        return 'Price'
      }
      if (blockTypeData.user && (blockTypeData.oldAllocations || blockTypeData.newAllocations)) {
        return 'Allocation Change'
      }
      
      return 'Data'
    },

    getBlockSummary(blockData) {
      //console.log('=== getBlockSummary called ===', blockData)
      
      if (!blockData || typeof blockData !== 'object') {
        return 'Invalid block data'
      }
      
      // Parse ICRC3 Value format (Map structure)
      const parsedData = this.parseICRC3Value(blockData)
      //console.log('Parsed summary data:', parsedData)
      
      // Extract trade data from new ICRC3 nested structure
      let tradeData = parsedData
      if (parsedData.tx && parsedData.tx.data) {
        tradeData = parsedData.tx.data
        //console.log('Extracted trade data from ICRC3 structure for summary:', tradeData)
      }
      
      // Trading block
      if (tradeData.btype === '3trade' || tradeData.trader || tradeData.token_sold) {
        //console.log('=== Processing trading block ===', tradeData)
        
        // Fix success detection - handle BigInt 1n, "1n", "1", 1, or BigInt 0n, "0n", "0", 0
        const successValue = tradeData.success
        //console.log('Raw success value:', successValue, typeof successValue)
        
        let isSuccess = false
        if (typeof successValue === 'bigint') {
          // Handle BigInt: 1n = success, 0n = failure
          isSuccess = successValue === 1n
        } else if (typeof successValue === 'string') {
          // Handle "1n" or "1" or "0n" or "0"
          isSuccess = successValue === '1n' || successValue === '1'
        } else if (typeof successValue === 'number') {
          isSuccess = successValue === 1
        }
        
        const success = isSuccess ? '✅' : '❌'
        //console.log('Determined success:', success, 'from value:', successValue)
        
        const exchange = tradeData.exchange || 'Unknown Exchange'
        const tokenSold = this.formatTokenName(tradeData.token_sold)
        const tokenBought = this.formatTokenName(tradeData.token_bought)
        const amountSold = this.formatAmount(tradeData.amount_sold, tradeData.token_sold)
        const amountBought = this.formatAmount(tradeData.amount_bought, tradeData.token_bought)
        const slippage = tradeData.slippage ? `${parseFloat(tradeData.slippage).toFixed(4)}%` : '0%'
        
        // Extract and format timestamp for summary
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `${success} ${exchange}: ${amountSold} ${tokenSold} → ${amountBought} ${tokenBought} (${slippage} slippage) • 🕐 ${formattedTime}`
      }
      
      // Circuit breaker block
      if (tradeData.btype === '3circuit' || tradeData.event_type || tradeData.eventType || tradeData.tokensAffected) {
        //console.log('=== Processing circuit breaker block ===', tradeData)
        
        const eventType = tradeData.event_type || tradeData.eventType || 'Unknown Event'
        const eventName = this.formatEventTypeName(eventType)
        const severity = tradeData.severity || ''
        const thresholdValue = tradeData.threshold_value || ''
        const actualValue = tradeData.actual_value || ''
        
        // Format affected tokens
        let tokensInfo = ''
        if (tradeData.tokens_affected && Array.isArray(tradeData.tokens_affected)) {
          const tokenNames = tradeData.tokens_affected.map(token => this.formatTokenName(token)).filter(name => name !== 'Unknown')
          tokensInfo = tokenNames.length ? ` affecting ${tokenNames.join(', ')}` : ''
        }
        
        // Extract and format timestamp for summary
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        // Build summary with key info
        let summary = `🚨 ${eventName}`
        if (severity) summary += ` (${severity})`
        if (thresholdValue && actualValue) {
          summary += `: ${actualValue} vs ${thresholdValue} threshold`
        }
        summary += tokensInfo
        summary += ` • 🕐 ${formattedTime}`
        
        return summary
      }
      
      // Portfolio block
      if (tradeData.btype === '3portfolio' || tradeData.portfolioSnapshot || tradeData.totalValue || tradeData.total_value_icp || tradeData.token_count || tradeData.tokens) {
        //console.log('=== Processing portfolio block ===', tradeData)
        
        // Extract portfolio data
        const tokenCount = tradeData.token_count || tradeData.tokens?.length || 0
        const totalValueIcp = this.formatPortfolioAmount(tradeData.total_value_icp)
        const totalValueUsd = tradeData.total_value_usd || tradeData.portfolioSnapshot?.totalValueUsd
        const reason = tradeData.reason || 'unknown'
        
        // Format token information - now using detailed tokens data
        let tokensInfo = ''
        if (tradeData.tokens && Array.isArray(tradeData.tokens)) {
          //console.log('=== Processing tokens for summary ===', tradeData.tokens)
          
          // Get top tokens by value for summary
          const topTokens = tradeData.tokens
            .map(token => {
              // Extract data from ICRC3 Map structure
              const tokenPrincipal = this.extractTokenPrincipal(token.token)
              const valueICP = this.extractBigIntValue(token.value_in_icp) || 0
              
              return {
                symbol: this.formatTokenName(tokenPrincipal),
                valueICP: valueICP
              }
            })
            .sort((a, b) => Number(b.valueICP) - Number(a.valueICP))
            .slice(0, 3)
            .filter(token => token.symbol !== 'Unknown')
          
          //console.log('=== Top tokens for summary ===', topTokens)
          tokensInfo = topTokens.length ? ` (${topTokens.map(t => t.symbol).join(', ')}${tradeData.tokens.length > 3 ? '...' : ''})` : ''
        } else if (tradeData.active_tokens && Array.isArray(tradeData.active_tokens)) {
          // Fallback to old format for backward compatibility
          const tokenNames = tradeData.active_tokens.map(token => this.formatTokenName(token)).filter(name => name !== 'Unknown')
          tokensInfo = tokenNames.length ? ` (${tokenNames.slice(0, 3).join(', ')}${tokenNames.length > 3 ? '...' : ''})` : ''
        }
        
        // Extract and format timestamp for summary
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        // Build summary
        let summary = `💼 Portfolio: ${tokenCount} tokens`
        if (totalValueIcp) {
          summary += `, ${totalValueIcp} ICP`
        }
        if (totalValueUsd) {
          summary += ` ($${totalValueUsd})`
        }
        summary += tokensInfo
        if (reason && reason !== 'unknown') {
          summary += ` - ${this.formatSnapshotReason(reason)}`
        }
        summary += ` • 🕐 ${formattedTime}`
        
        return summary
      }
      
      // Price block
      if (tradeData.btype === '3price' || tradeData.price_icp || tradeData.price_usd) {
        const tokenSymbol = this.formatTokenName(tradeData.token) || 'Unknown Token'
        const priceUSD = tradeData.price_usd || 'Unknown'
        const source = tradeData.source || 'Unknown'
        
        // Format ICP price from e8s
        const icpAmount = this.extractBigIntValue(tradeData.price_icp) || 0
        const icpFormatted = icpAmount > 0 ? (Number(icpAmount) / 100000000).toFixed(8) : 'Unknown'
        
        const usdPrice = parseFloat(priceUSD) || 0
        const usdFormatted = usdPrice > 0 ? '$' + usdPrice.toFixed(6) : 'Unknown'
        
        // Extract and format timestamp for summary
        const timestamp = tradeData.ts || tradeData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `💰 ${tokenSymbol}: ${icpFormatted} ICP (${usdFormatted}) via ${source} • 🕐 ${formattedTime}`
      }
      
      // Allocation change block
      if ((parsedData.tx && parsedData.tx.operation === '3allocation_change') || tradeData.operation === '3allocation_change') {
        // Extract allocation data from the nested structure
        let allocationData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          allocationData = parsedData.tx.data
        }
        
        const userId = this.formatPrincipalFromBlob(allocationData.user)
        const userShort = userId ? userId.substring(0, 8) + '...' : 'Unknown'
        const changeType = allocationData.changeType?.type || 'Unknown'
        const userInitiated = allocationData.changeType?.userInitiated === 1n || allocationData.changeType?.userInitiated === '1'
        
        // Count allocations
        const oldCount = allocationData.oldAllocations ? allocationData.oldAllocations.length : 0
        const newCount = allocationData.newAllocations ? allocationData.newAllocations.length : 0
        
        // Calculate total percentages
        const newTotal = allocationData.newAllocations ? 
          (allocationData.newAllocations.reduce((sum, a) => sum + Number(a.basisPoints), 0) / 100).toFixed(1) : '0.0'
        
        // Extract timestamp
        const timestamp = allocationData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        const initiator = userInitiated ? '👤' : '🤖'
        return `📊 ${initiator} ${changeType}: ${userShort} changed ${oldCount}→${newCount} allocations (${newTotal}% total) • 🕐 ${formattedTime}`
      }
      
      // Voting power change block
      if ((parsedData.tx && parsedData.tx.operation === '3voting_power') || tradeData.operation === '3voting_power') {
        // Extract voting power data from the nested structure
        let votingPowerData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          votingPowerData = parsedData.tx.data
        }
        
        const userId = this.formatPrincipalFromBlob(votingPowerData.user)
        const userShort = userId ? userId.substring(0, 8) + '...' : 'Unknown'
        const changeType = votingPowerData.changeType || 'Unknown'
        const oldVP = Number(votingPowerData.oldVotingPower || 0)
        const newVP = Number(votingPowerData.newVotingPower || 0)
        
        // Format voting power (convert from e8s to VP)
        const formatVP = (vp) => (vp / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
        
        // Calculate change
        const vpChange = newVP - oldVP
        const changeDirection = vpChange > 0 ? '📈' : vpChange < 0 ? '📉' : '➡️'
        
        const timestamp = votingPowerData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `🗳️ ${userShort}: ${formatVP(oldVP)} → ${formatVP(newVP)} VP ${changeDirection} (${changeType}) • 🕐 ${formattedTime}`
      }
      
      // Neuron update block (summary)
      if ((parsedData.tx && parsedData.tx.operation === '3neuron_update') || tradeData.operation === '3neuron_update') {
        // Extract neuron update data from the nested structure
        let neuronUpdateData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          neuronUpdateData = parsedData.tx.data
        }
        
        const neuronId = neuronUpdateData.neuronId ? this.formatNeuronFromBlob(neuronUpdateData.neuronId) : 'Unknown'
        const neuronIdShort = neuronId
        const updateType = neuronUpdateData.updateType || 'Unknown'
        const oldVP = Number(neuronUpdateData.oldVotingPower || 0)
        const newVP = Number(neuronUpdateData.newVotingPower || 0)
        const affectedCount = neuronUpdateData.affectedUsers ? neuronUpdateData.affectedUsers.length : 0
        
        // Format voting power (convert from e8s to VP)
        const formatVP = (vp) => (vp / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
        
        // Calculate change
        const vpChange = newVP - oldVP
        const changeDirection = vpChange > 0 ? '📈' : vpChange < 0 ? '📉' : '➡️'
        
        const timestamp = neuronUpdateData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `🧠 ${neuronIdShort}: ${formatVP(oldVP)} → ${formatVP(newVP)} VP ${changeDirection} (${updateType}) affecting ${affectedCount} user(s) • 🕐 ${formattedTime}`
      }
      
      // Admin action block (summary)
      if ((parsedData.tx && parsedData.tx.operation === '3admin') || tradeData.operation === '3admin') {
        // Extract admin action data from the nested structure
        let adminData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          adminData = parsedData.tx.data
        }
        
        const adminId = adminData.admin ? this.formatPrincipalFromBlob(adminData.admin) : 'Unknown'
        const adminShort = adminId.length > 16 ? adminId.substring(0, 6) + '...' + adminId.substring(adminId.length - 6) : adminId
        const canister = adminData.canister || 'Unknown'
        const actionType = adminData.actionType?.type || 'Unknown'
        const success = adminData.success === 1n || adminData.success === '1' || adminData.success === 1
        const statusIcon = success ? '✅' : '❌'
        
        // Get token name if present
        let tokenInfo = ''
        if (adminData.actionType?.token) {
          const tokenName = this.formatTokenNameFromBlob(adminData.actionType.token)
          tokenInfo = ` (${tokenName})`
        }
        
        const timestamp = adminData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `⚙️ ${adminShort}: ${actionType}${tokenInfo} on ${canister} ${statusIcon} • 🕐 ${formattedTime}`
      }
      
      // Generic block
      const keys = Object.keys(parsedData).slice(0, 3).join(', ')
      return `📄 Data Block: ${keys}${Object.keys(parsedData).length > 3 ? '...' : ''}`
    },

    formatBlockJson(blockData) {
      return JSON.stringify(blockData, (key, value) => {
        // Convert BigInt to string for display
        if (typeof value === 'bigint') {
          return value.toString() + 'n'
        }
        return value
      }, 2)
    },

    // Parse ICRC3 Value format (Map structure) into a plain JavaScript object
    parseICRC3Value(blockData) {
      //console.log('=== parseICRC3Value called ===', blockData)
      
      if (!blockData || typeof blockData !== 'object') {
        return {}
      }

      // If it's already a plain object, return as-is
      if (!blockData.Map && !Array.isArray(blockData)) {
        //console.log('Already plain object, returning as-is')
        return blockData
      }

      // Handle ICRC3 Map format: { "Map": [ ["key", value], ... ] }
      if (blockData.Map && Array.isArray(blockData.Map)) {
        //console.log('Found Map format, parsing...', blockData.Map)
        const result = {}
        for (const [key, value] of blockData.Map) {
          if (typeof key === 'string') {
            result[key] = this.parseICRC3ValueRecursive(value)
          }
        }
        //console.log('Parsed result:', result)
        return result
      }

      // Handle array format directly
      if (Array.isArray(blockData)) {
        const result = {}
        for (const [key, value] of blockData) {
          if (typeof key === 'string') {
            result[key] = this.parseICRC3ValueRecursive(value)
          }
        }
        return result
      }

      return blockData
    },

    parseICRC3ValueRecursive(value) {
      if (!value || typeof value !== 'object') {
        return value
      }

      // Handle Text values
      if (value.Text !== undefined) {
        return value.Text
      }

      // Handle Nat values
      if (value.Nat !== undefined) {
        return value.Nat
      }

      // Handle Int values  
      if (value.Int !== undefined) {
        return value.Int
      }

      // Handle Blob values (convert to hex or keep as-is)
      if (value.Blob !== undefined) {
        return value.Blob
      }

      // Handle nested Maps
      if (value.Map && Array.isArray(value.Map)) {
        const result = {}
        for (const [key, val] of value.Map) {
          if (typeof key === 'string') {
            result[key] = this.parseICRC3ValueRecursive(val)
          }
        }
        return result
      }

      // Handle Arrays
      if (value.Array && Array.isArray(value.Array)) {
        return value.Array.map(item => this.parseICRC3ValueRecursive(item))
      }

      return value
    },

    formatTokenName(tokenBlob) {
      //console.log('=== formatTokenName called ===', tokenBlob)
      if (!tokenBlob) return 'Unknown'
      
      try {
        // Token blob format: decode Principal from blob
        if (typeof tokenBlob === 'string') {
          return tokenBlob
        }
        
        let uint8Array = null
        
        // Handle direct Uint8Array format (new format)
        if (tokenBlob instanceof Uint8Array) {
          //console.log('Direct Uint8Array format detected')
          uint8Array = tokenBlob
        }
        // Handle wrapped Blob format (old format)
        else if (tokenBlob.Blob && typeof tokenBlob.Blob === 'object') {
          //console.log('Wrapped Blob format detected')
          const blobData = tokenBlob.Blob
          uint8Array = new Uint8Array(Object.keys(blobData).map(key => blobData[key]))
        }
        
        if (uint8Array) {
          try {
            // Decode Principal from the Uint8Array
            const principal = Principal.fromUint8Array(uint8Array)
            const principalStr = principal.toString()
            
            //console.log('Decoded token principal:', principalStr)
            //console.log('Available token details:', this.tacoStore.fetchedTokenDetails)
            
            // Look up token metadata using the decoded Principal
            const tokenMetadata = this.getTokenMetadata(principal)
            //console.log('Found token metadata:', tokenMetadata)
            
            if (tokenMetadata && tokenMetadata.tokenSymbol) {
              return tokenMetadata.tokenSymbol
            }
            
            // Return full Principal if no metadata found (for debugging)
            return principalStr
          } catch (principalError) {
            console.warn('Failed to decode Principal from Uint8Array:', principalError, uint8Array)
            return 'Token'
          }
        }
        
        return 'Unknown'
      } catch (error) {
        console.warn('Error in formatTokenName:', error)
        return 'Unknown'
      }
    },

    formatAmount(amount, tokenBlob = null) {
      if (!amount) return '0'
      
      try {
        // Get token metadata to determine correct decimals
        let decimals = 8 // Default to 8 decimals (ICP standard)
        
        if (tokenBlob) {
          const tokenMetadata = this.getTokenMetadataFromBlob(tokenBlob)
          if (tokenMetadata && tokenMetadata.decimals !== undefined) {
            decimals = Number(tokenMetadata.decimals)
          }
        }
        
        // Use the same logic as other trading logs components
        let strAmount
        const decimalPlaces = Number(decimals)
        
        if (typeof amount === 'bigint') {
          strAmount = amount.toString()
          // Pad with leading zeros if necessary
          if (strAmount.length <= decimalPlaces) {
            strAmount = '0'.repeat(decimalPlaces - strAmount.length + 1) + strAmount
          }
          // Insert decimal point from right
          const insertIndex = strAmount.length - decimalPlaces
          strAmount = strAmount.slice(0, insertIndex) + '.' + strAmount.slice(insertIndex)
          // Remove trailing zeros and decimal point if no decimals
          strAmount = strAmount.replace(/\.?0+$/, '')
        } else {
          // For regular numbers, convert using decimals
          const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
          const scaledAmount = numAmount / Math.pow(10, decimalPlaces)
          strAmount = scaledAmount.toString()
        }
        
        // Format for readability (add K, M, B, T suffixes)
        const numValue = parseFloat(strAmount)
        if (numValue >= 1e12) {
          return (numValue / 1e12).toFixed(3) + 'T'
        } else if (numValue >= 1e9) {
          return (numValue / 1e9).toFixed(3) + 'B'
        } else if (numValue >= 1e6) {
          return (numValue / 1e6).toFixed(3) + 'M'
        } else if (numValue >= 1e3) {
          return (numValue / 1e3).toFixed(3) + 'K'
        } else if (numValue >= 1) {
          return numValue.toFixed(3).replace(/\.?0+$/, '')
        } else {
          return numValue.toFixed(8).replace(/\.?0+$/, '')
        }
      } catch (error) {
        console.warn('Error in formatAmount:', error)
        return amount.toString()
      }
    },

    // Helper method to format token name from blob (wrapper for formatTokenName)
    formatTokenNameFromBlob(tokenBlob) {
      return this.formatTokenName(tokenBlob)
    },

    // Helper method to format principal from blob with naming system integration
    formatPrincipalFromBlob(principalBlob) {
      if (!principalBlob) return 'Unknown'
      
      try {
        let uint8Array = null
        
        // Handle direct Uint8Array format
        if (principalBlob instanceof Uint8Array) {
          uint8Array = principalBlob
        }
        // Handle wrapped Blob format
        else if (principalBlob.Blob && typeof principalBlob.Blob === 'object') {
          const blobData = principalBlob.Blob
          uint8Array = new Uint8Array(Object.keys(blobData).map(key => blobData[key]))
        }
        // Handle object with numeric keys (like your example)
        else if (typeof principalBlob === 'object' && !Array.isArray(principalBlob)) {
          const keys = Object.keys(principalBlob).map(k => parseInt(k)).sort((a, b) => a - b)
          uint8Array = new Uint8Array(keys.map(key => principalBlob[key]))
        }
        
        if (uint8Array) {
          const principal = Principal.fromUint8Array(uint8Array)
          
          // Use the naming system to get display name
          const displayName = this.tacoStore.getPrincipalDisplayName(principal)
          return displayName
        }
        
        return 'Unknown'
      } catch (error) {
        console.warn('Error in formatPrincipalFromBlob:', error)
        return 'Unknown'
      }
    },

    // Helper method to format neuron from blob with naming system integration
    formatNeuronFromBlob(neuronBlob, fallbackToTruncated = true) {
      if (!neuronBlob) return 'Unknown'
      
      try {
        let uint8Array = null
        
        // Handle direct Uint8Array format
        if (neuronBlob instanceof Uint8Array) {
          uint8Array = neuronBlob
        }
        // Handle wrapped Blob format
        else if (neuronBlob.Blob && typeof neuronBlob.Blob === 'object') {
          const blobData = neuronBlob.Blob
          uint8Array = new Uint8Array(Object.keys(blobData).map(key => blobData[key]))
        }
        // Handle object with numeric keys
        else if (typeof neuronBlob === 'object' && !Array.isArray(neuronBlob)) {
          const keys = Object.keys(neuronBlob).map(k => parseInt(k)).sort((a, b) => a - b)
          uint8Array = new Uint8Array(keys.map(key => neuronBlob[key]))
        }
        
        if (uint8Array) {
          // For neurons, we need the SNS governance canister as the root
          const tacoSnsRoot = Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai') // TACO DAO SNS governance
          
          // Try to get the neuron name from the naming system
          const neuronName = this.tacoStore.getNeuronDisplayName(tacoSnsRoot, uint8Array)
          
          if (neuronName) {
            return neuronName
          }
          
          // Fallback to truncated neuron ID if requested
          if (fallbackToTruncated) {
            const principal = Principal.fromUint8Array(uint8Array)
            const principalStr = principal.toString()
            return principalStr.length > 16 ? 
              principalStr.substring(0, 6) + '...' + principalStr.substring(principalStr.length - 6) : 
              principalStr
          }
          
          return 'Unknown Neuron'
        }
        
        return 'Unknown'
      } catch (error) {
        console.warn('Error in formatNeuronFromBlob:', error)
        return 'Unknown'
      }
    },

    renderConfigChanges(actionType) {
      if (!actionType || actionType.type !== 'UpdateRebalanceConfig') {
        return ''
      }

      const oldConfig = actionType.oldConfig || ''
      const newConfig = actionType.newConfig || ''

      if (!oldConfig || !newConfig) {
        return ''
      }

      // Parse the pipe-separated config format: field=value|field=value|...
      const parseConfig = (configText) => {
        const config = {}
        if (!configText) return config
        
        configText.split('|').forEach(pair => {
          const [key, value] = pair.split('=')
          if (key && value !== undefined) {
            config[key.trim()] = value.trim().replace(/_/g, '') // Remove underscores from numbers
          }
        })
        return config
      }

      // Format values for display
      const formatConfigValue = (key, rawValue) => {
        if (!rawValue || rawValue === 'N/A') return rawValue
        
        const numValue = parseInt(rawValue)
        
        switch (key) {
          case 'rebalanceIntervalNS':
            return this.formatDuration(numValue / 1_000_000_000) // Convert ns to seconds
          case 'portfolioRebalancePeriodNS':
            return this.formatDuration(numValue / 1_000_000_000)
          case 'shortSyncIntervalNS':
            return this.formatDuration(numValue / 1_000_000_000)
          case 'longSyncIntervalNS':
            return this.formatDuration(numValue / 1_000_000_000)
          case 'tokenSyncTimeoutNS':
            return this.formatDuration(numValue / 1_000_000_000)
          case 'minTradeValueICP':
          case 'maxTradeValueICP':
            return `${(numValue / 100_000_000).toFixed(2)} ICP` // Convert e8s to ICP
          case 'maxSlippageBasisPoints':
            return `${(numValue / 100).toFixed(2)}%` // Convert basis points to percentage
          case 'maxTradeAttemptsPerInterval':
          case 'maxKongswapAttempts':
            return numValue.toLocaleString() + ' attempts'
          case 'maxTradesStored':
            return numValue.toLocaleString() + ' trades'
          default:
            return rawValue
        }
      }

      // Format field names for display
      const formatFieldName = (key) => {
        const fieldNames = {
          'rebalanceIntervalNS': 'Rebalance Interval',
          'maxTradeAttemptsPerInterval': 'Max Trade Attempts',
          'minTradeValueICP': 'Min Trade Value',
          'maxTradeValueICP': 'Max Trade Value',
          'portfolioRebalancePeriodNS': 'Portfolio Rebalance Period',
          'maxSlippageBasisPoints': 'Max Slippage',
          'maxTradesStored': 'Max Trades Stored',
          'maxKongswapAttempts': 'Max Kongswap Attempts',
          'shortSyncIntervalNS': 'Short Sync Interval',
          'longSyncIntervalNS': 'Long Sync Interval',
          'tokenSyncTimeoutNS': 'Token Sync Timeout'
        }
        return fieldNames[key] || key
      }

      const oldParsed = parseConfig(oldConfig)
      const newParsed = parseConfig(newConfig)

      // Get all fields and categorize as changed/unchanged
      const allKeys = new Set([...Object.keys(oldParsed), ...Object.keys(newParsed)])
      const changedFields = []
      const unchangedFields = []
      
      allKeys.forEach(key => {
        const oldVal = oldParsed[key] || 'N/A'
        const newVal = newParsed[key] || 'N/A'
        
        const fieldData = {
          field: formatFieldName(key),
          oldFormatted: formatConfigValue(key, oldVal),
          newFormatted: formatConfigValue(key, newVal),
          changed: oldVal !== newVal
        }
        
        if (fieldData.changed) {
          changedFields.push(fieldData)
        } else {
          unchangedFields.push(fieldData)
        }
      })

      if (changedFields.length === 0 && unchangedFields.length === 0) {
        return ''
      }

      return `
        <div class="alert alert-warning mt-2">
          <strong>⚙️ Configuration Changes:</strong>
          <div class="mt-2">
            <div class="table-responsive">
              <table class="table table-sm table-borderless mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 40%">Setting</th>
                    <th style="width: 30%">Before</th>
                    <th style="width: 30%">After</th>
                  </tr>
                </thead>
                <tbody>
                  ${changedFields.map(field => `
                    <tr style="background-color: #fff3cd;">
                      <td><strong>${field.field}</strong></td>
                      <td class="text-muted">${field.oldFormatted}</td>
                      <td class="text-success"><strong>→ ${field.newFormatted}</strong></td>
                    </tr>
                  `).join('')}
                  ${unchangedFields.length > 0 ? `
                    <tr>
                      <td colspan="3" class="text-muted small pt-2">
                        <em>Unchanged settings:</em>
                      </td>
                    </tr>
                    ${unchangedFields.map(field => `
                      <tr class="text-muted small">
                        <td>${field.field}</td>
                        <td colspan="2">${field.oldFormatted}</td>
                      </tr>
                    `).join('')}
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `
    },

    // Helper method to format duration in seconds to human-readable format
    formatDuration(seconds) {
      if (seconds < 60) {
        return `${seconds}s`
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600)
        const remainingMinutes = Math.floor((seconds % 3600) / 60)
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
      } else {
        const days = Math.floor(seconds / 86400)
        const remainingHours = Math.floor((seconds % 86400) / 3600)
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
      }
    },

    // Get token metadata from the taco store
    getTokenMetadata(principal) {
      try {
        //console.log('Looking for token metadata for principal:', principal.toString())
        //console.log('fetchedTokenDetails available:', !!this.tacoStore.fetchedTokenDetails)
        //console.log('fetchedTokenDetails length:', this.tacoStore.fetchedTokenDetails?.length)
        
        if (!this.tacoStore.fetchedTokenDetails || !Array.isArray(this.tacoStore.fetchedTokenDetails)) {
          //console.log('No fetchedTokenDetails available')
          return null
        }

        // Log all available token principals for debugging
        //console.log('Available token principals:', this.tacoStore.fetchedTokenDetails.map(entry => {
        //  try {
        //    return entry[0]?.toString()
        //  } catch {
        //    return 'invalid'
        //  }
        //}))

        const tokenEntry = this.tacoStore.fetchedTokenDetails.find(entry => {
          if (!entry || !Array.isArray(entry) || entry.length < 2) {
            return false
          }
          try {
            const entryPrincipal = entry[0].toString()
            const searchPrincipal = principal.toString()
            //console.log('Comparing:', entryPrincipal, 'vs', searchPrincipal, '=', entryPrincipal === searchPrincipal)
            return entryPrincipal === searchPrincipal
          } catch (err) {
            console.warn('Error comparing principals:', err)
            return false
          }
        })

        //console.log('Found token entry:', tokenEntry)
        return tokenEntry && tokenEntry[1] ? tokenEntry[1] : null
      } catch (error) {
        console.warn('Error getting token metadata:', error)
        return null
      }
    },

    // Helper to get token metadata from blob
    getTokenMetadataFromBlob(tokenBlob) {
      if (!tokenBlob) return null
      
      try {
        let uint8Array = null
        
        // Handle direct Uint8Array format (new format)
        if (tokenBlob instanceof Uint8Array) {
          uint8Array = tokenBlob
        }
        // Handle wrapped Blob format (old format)
        else if (tokenBlob.Blob) {
          const blobData = tokenBlob.Blob
          uint8Array = new Uint8Array(Object.keys(blobData).map(key => blobData[key]))
        }
        
        if (uint8Array) {
          const principal = Principal.fromUint8Array(uint8Array)
          return this.getTokenMetadata(principal)
        }
        
        return null
      } catch (error) {
        return null
      }
    },

    // Enhanced trader display with Principal decoding
    formatTraderDisplay(traderBlob) {
      //console.log('=== formatTraderDisplay called ===', traderBlob)
      if (!traderBlob) return 'Unknown'
      
      try {
        let uint8Array = null
        
        // Handle direct Uint8Array format (new format)
        if (traderBlob instanceof Uint8Array) {
          //console.log('Direct Uint8Array format detected for trader')
          uint8Array = traderBlob
        }
        // Handle wrapped Blob format (old format)
        else if (traderBlob.Blob && typeof traderBlob.Blob === 'object') {
          //console.log('Wrapped Blob format detected for trader')
          const blobData = traderBlob.Blob
          uint8Array = new Uint8Array(Object.keys(blobData).map(key => blobData[key]))
        }
        
        if (uint8Array) {
          try {
            const principal = Principal.fromUint8Array(uint8Array)
            const principalStr = principal.toString()
            
            //console.log('Decoded trader principal:', principalStr)
            //console.log('Treasury canister ID:', this.tacoStore.treasuryCanisterId?.())
            
            // Check if it's a known principal (like Treasury)
            if (this.tacoStore.treasuryCanisterId && principalStr === this.tacoStore.treasuryCanisterId()) {
              return 'Treasury'
            }
            
            // Return full principal for now (for debugging) - you can truncate later
            return principalStr
          } catch (principalError) {
            console.warn('Failed to decode trader Principal from Uint8Array:', principalError, uint8Array)
            return 'DecodeFailed'
          }
        }
        
        return typeof traderBlob === 'string' ? traderBlob : 'Unknown'
      } catch (error) {
        console.warn('Error formatting trader:', error, traderBlob)
        return 'Unknown'
      }
    },

    // Format event type names for better readability
    formatEventTypeName(eventType) {
      if (!eventType) return 'Unknown Event'
      
      const eventTypeMap = {
        'price_alert': 'Price Alert',
        'liquidity_warning': 'Liquidity Warning',
        'trade_halt': 'Trade Halt',
        'system_pause': 'System Pause',
        'volume_spike': 'Volume Spike',
        'slippage_warning': 'Slippage Warning',
        'circuit_breaker': 'Circuit Breaker'
      }
      
      return eventTypeMap[eventType.toLowerCase()] || eventType
    },

    // Get CSS class for severity levels
    getSeverityClass(severity) {
      if (!severity) return 'bg-secondary'
      
      switch (severity.toLowerCase()) {
        case 'critical': return 'bg-danger'
        case 'high': return 'bg-warning'
        case 'medium': return 'bg-info'
        case 'low': return 'bg-success'
        default: return 'bg-secondary'
      }
    },

    // Format portfolio amounts (typically in e8s for ICP)
    formatPortfolioAmount(amount) {
      if (!amount) return null
      
      try {
        let numAmount
        if (typeof amount === 'bigint') {
          numAmount = Number(amount)
        } else if (typeof amount === 'string') {
          // Remove 'n' suffix if present
          const cleanAmount = amount.replace(/n$/, '')
          numAmount = parseFloat(cleanAmount)
        } else {
          numAmount = Number(amount)
        }
        
        // Convert from e8s to ICP (8 decimal places)
        const icpAmount = numAmount / 100_000_000
        
        // Format for readability
        if (icpAmount >= 1000) {
          return (icpAmount / 1000).toFixed(2) + 'K'
        } else if (icpAmount >= 1) {
          return icpAmount.toFixed(3)
        } else {
          return icpAmount.toFixed(6).replace(/\.?0+$/, '')
        }
      } catch (error) {
        console.warn('Error formatting portfolio amount:', error, amount)
        return null
      }
    },

    // Helper methods for extracting data from ICRC3 structures
    extractBigIntValue(field) {
      if (!field) return 0
      if (typeof field === 'bigint') return field
      if (typeof field === 'string') return BigInt(field.replace('n', ''))
      if (field.Nat) return BigInt(field.Nat.replace('n', ''))
      if (field.Int) return BigInt(field.Int.replace('n', ''))
      return 0
    },
    
    extractNatValue(field) {
      if (!field) return 0
      if (typeof field === 'number') return field
      if (typeof field === 'string') return parseInt(field.replace('n', ''))
      if (field.Nat) return parseInt(field.Nat.replace('n', ''))
      return 0
    },
    
    extractTextValue(field) {
      if (!field) return '0'
      if (typeof field === 'string') return field
      if (field.Text) return field.Text
      return '0'
    },
    
    extractTokenPrincipal(tokenBlob) {
      if (!tokenBlob) return null
      if (tokenBlob instanceof Uint8Array) return tokenBlob
      if (tokenBlob.Blob && typeof tokenBlob.Blob === 'object') {
        const blobData = tokenBlob.Blob
        return new Uint8Array(Object.keys(blobData).map(key => blobData[key]))
      }
      return tokenBlob
    },

    // Prepare portfolio chart data for half-pie visualization
    preparePortfolioChartData(tokens) {
      if (!tokens || !Array.isArray(tokens)) {
        return null
      }

      // Extract and process token data
      const tokenData = tokens.map(token => {
        const tokenPrincipal = this.extractTokenPrincipal(token.token)
        const valueInICP = this.extractBigIntValue(token.value_in_icp) || 0
        const symbol = this.formatTokenName(tokenPrincipal)
        
        return {
          symbol: symbol,
          valueICP: Number(valueInICP),
          principal: tokenPrincipal
        }
      }).filter(token => token.valueICP > 0 && token.symbol !== 'Unknown')

      if (tokenData.length === 0) {
        return null
      }

      // Calculate total value for percentages
      const totalValue = tokenData.reduce((sum, token) => sum + token.valueICP, 0)

      // Create chart series and labels
      const series = tokenData.map(token => {
        const percentage = (token.valueICP / totalValue) * 100
        return Number(percentage.toFixed(2))
      })

      const labels = tokenData.map(token => token.symbol.toUpperCase())

      // Create colors array based on token symbols
      const colors = tokenData.map(token => {
        // Define colors for common tokens - you can expand this
        const colorMap = {
          'ICP': '#3b00b9',
          'CKBTC': '#f7931a', 
          'DKP': '#00d4ff',
          'EXE': '#ff6b35',
          'MOTOKO': '#ff0040',
          'SGLDT': '#ffd700',
          'SNEED': '#32cd32'
        }
        return colorMap[token.symbol.toUpperCase()] || this.generateColorFromString(token.symbol)
      })

      return {
        series,
        labels,
        colors,
        tokenData
      }
    },

    // Generate a consistent color from a string
    generateColorFromString(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
      }
      const hue = hash % 360
      return `hsl(${hue}, 70%, 50%)`
    },

    // Render portfolio chart using ApexCharts
    renderPortfolioChart(chartData, containerId) {
      if (!chartData) {
        return
      }

      // Don't render if chart already exists and container has content
      const container = document.querySelector(`#${containerId}`)
      if (this.portfolioCharts.has(containerId) && container && container.children.length > 0) {
        return
      }

      // Destroy existing chart with this ID if any
      if (this.portfolioCharts.has(containerId)) {
        try {
          this.portfolioCharts.get(containerId).destroy()
          this.portfolioCharts.delete(containerId)
        } catch (error) {
          console.warn('Error destroying existing chart:', error)
        }
      }

      const options = {
        chart: {
          type: 'pie',
          height: 200,
          animations: {
            enabled: true,
            easing: 'easeout',
            speed: 350,
          },
          fontFamily: 'Space Mono',
        },
        series: chartData.series,
        labels: chartData.labels,
        colors: chartData.colors,
        plotOptions: {
          pie: {
            startAngle: -90,
            endAngle: 90,
            customScale: 1,
            expandOnClick: false,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val, opts) {
            return chartData.labels[opts.seriesIndex] + ' ' + val.toFixed(1) + '%'
          },
          style: {
            fontSize: '12px',
            fontFamily: 'Space Mono',
            fontWeight: 'bold',
            colors: ['#fff']
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            padding: 2,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: '#fff',
            opacity: 0.9,
          }
        },
        legend: { 
          show: false 
        },
        stroke: { 
          show: false 
        },
        tooltip: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontFamily: 'Space Mono',
          },
          custom: function({ series, seriesIndex }) {
            const val = series[seriesIndex]
            const symbol = chartData.labels[seriesIndex]
            const valueICP = (chartData.tokenData[seriesIndex].valueICP / 100_000_000).toFixed(3)
            return `<div class="chart-tooltip">
              <strong>${symbol}</strong><br/>
              ${val.toFixed(1)}% (${valueICP} ICP)
            </div>`
          }
        }
      }

      // Use the container we already found
      if (!container) {
        console.error('Chart container not found:', containerId)
        return
      }
      
      try {
        const chart = new ApexCharts(container, options)
        chart.render()
        
        // Store the chart instance with its unique ID
        this.portfolioCharts.set(containerId, chart)
        console.log('📊 Chart rendered:', containerId, '(Total:', this.portfolioCharts.size + ')')
      } catch (error) {
        console.error('Error rendering chart:', containerId, error)
      }
    },

    // Format snapshot reason for better readability
    formatSnapshotReason(reason) {
      if (!reason) return 'Unknown'
      
      const reasonMap = {
        'scheduled': 'Scheduled',
        'manual': 'Manual Trigger',
        'trade_trigger': 'Trade Triggered',
        'time_trigger': 'Time Based',
        'price_trigger': 'Price Change',
        'rebalance': 'Rebalancing',
        'emergency': 'Emergency'
      }
      
      return reasonMap[reason.toLowerCase()] || reason
    },

    // Get CSS class for snapshot reasons
    getSnapshotReasonClass(reason) {
      if (!reason) return 'bg-secondary'
      
      switch (reason.toLowerCase()) {
        case 'emergency': return 'bg-danger'
        case 'manual': return 'bg-warning'
        case 'scheduled': return 'bg-success'
        case 'trade_trigger': return 'bg-info'
        case 'rebalance': return 'bg-primary'
        default: return 'bg-secondary'
      }
    }
  }
}
</script>

<style scoped>
.timer-tier-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  height: 100%;
}

.timer-details p {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.active {
  background-color: #28a745;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
}

.status-indicator.inactive {
  background-color: #6c757d;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-timestamp {
  color: #adb5bd;
  font-size: 0.8rem;
  min-width: 120px;
}

.log-category {
  font-size: 0.75rem;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-function {
  font-size: 0.75rem;
  min-width: 100px;
  text-align: right;
}

.log-error {
  background: rgba(220, 53, 69, 0.1);
  border-left: 3px solid #dc3545;
}

.log-warn {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
}

.log-info {
  background: rgba(13, 202, 240, 0.1);
  border-left: 3px solid #0dcaf0;
}

.modal.show {
  background: rgba(0, 0, 0, 0.5);
}

.btn:disabled {
  opacity: 0.6;
}

/* Portfolio Chart Styles */
.portfolio-chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 8px;
  border: 1px solid #424242;
}

.portfolio-chart {
  width: 100%;
  height: 100%;
  min-height: 180px;
}

/* Custom tooltip styles for portfolio charts */
.chart-tooltip {
  padding: 8px 12px !important;
  background: rgba(0, 0, 0, 0.8) !important;
  border: 1px solid #fff !important;
  border-radius: 4px !important;
  font-family: 'Space Mono', monospace !important;
  font-size: 12px !important;
  color: #fff !important;
  text-align: center !important;
}

/* ApexCharts override for better dark theme integration */
.apexcharts-tooltip {
  background: rgba(0, 0, 0, 0.8) !important;
  border: 1px solid #fff !important;
  border-radius: 4px !important;
}

.apexcharts-tooltip-text {
  color: #fff !important;
  font-family: 'Space Mono', monospace !important;
}
</style> 