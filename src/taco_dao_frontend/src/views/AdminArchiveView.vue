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
              <h3 class="mb-0">Recent Logs</h3>
              <button class="btn btn-sm btn-outline-primary" @click="refreshLogs">
                Refresh Logs
              </button>
            </div>
            <div class="card-body">
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
                      <h6>Full Block Data:</h6>
                      <pre class="bg-secondary p-2 rounded small text-wrap">{{ formatBlockJson(block.block) }}</pre>
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

// Import archive actors
import { createActor as createTradingActor } from '../../../declarations/trading_archive'
import { createActor as createPortfolioActor } from '../../../declarations/portfolio_archive'
import { createActor as createPriceActor } from '../../../declarations/price_archive'

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
      errorMessage: '',
      successMessage: '',
      showConfigModal: false,
      configMaxIterations: 10,
      
      // Archive actors
      tradingActor: null,
      portfolioActor: null,
      priceActor: null,
      
      // Refresh interval
      refreshInterval: null,
      
      // ICRC3 Block Browser
      blockBrowserBlocks: [],
      blockBrowserLoading: false,
      blockBrowserIndex: null,
      blockBrowserPageSize: 10,
      currentBlockStart: 0,
      expandedBlocks: []
    }
  },
  computed: {
    ...mapStores(useTacoStore),
    currentArchiveActor() {
      switch (this.selectedArchive) {
        case 'trading_archive': return this.tradingActor
        case 'portfolio_archive': return this.portfolioActor
        case 'price_archive': return this.priceActor
        default: return this.tradingActor
      }
    }
  },
  async mounted() {
    // Alternative approach: You could use JSON.stringify with a replacer like this:
    // JSON.stringify(someObject, (key, value) => typeof value === 'bigint' ? Number(value) : value)
    // But for Vue reactivity, it's better to convert the data upfront as we're doing
    
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
          return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_IC || 'lrekt-uaaaa-aaaan-qz4ya-cai'; // fallback to staging as no IC deployment yet
        case "staging":  
          return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_STAGING || 'lrekt-uaaaa-aaaan-qz4ya-cai';
      }
      return 'lrekt-uaaaa-aaaan-qz4ya-cai'; // fallback to staging canisterId for local
    },

    priceArchiveCanisterId() {
      switch (process.env.DFX_NETWORK) {
        case "ic":
          return process.env.CANISTER_ID_PRICE_ARCHIVE_IC || 'l7gh3-pqaaa-aaaan-qz4za-cai'; // fallback to staging as no IC deployment yet
        case "staging":
          return process.env.CANISTER_ID_PRICE_ARCHIVE_STAGING || 'l7gh3-pqaaa-aaaan-qz4za-cai';
      }
      return 'l7gh3-pqaaa-aaaan-qz4za-cai'; // fallback to staging canisterId for local
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
        
        console.log('Archive actors created with identity:', identity.getPrincipal().toString())
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
      console.log('startBatchImportSystem called')
      this.loading = true
      this.clearMessages()
      
      try {
        console.log('Calling startBatchImportSystem on actor:', this.currentArchiveActor)
        const result = await this.currentArchiveActor.startBatchImportSystem()
        console.log('startBatchImportSystem result:', result)
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
      console.log('resetImportTimestamps called')
      this.loading = true
      this.clearMessages()
      
      try {
        const result = await this.currentArchiveActor.resetImportTimestamps()
        console.log('resetImportTimestamps result:', result)
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
      console.log('runManualBatchImport called')
      this.loading = true
      this.clearMessages()
      this.successMessage = 'Manual batch import started. Check logs for progress...'
      
      try {
        console.log('Calling runManualBatchImport on actor:', this.currentArchiveActor)
        const result = await this.currentArchiveActor.runManualBatchImport()
        console.log('runManualBatchImport result:', result)
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
      } else {
        this.expandedBlocks.push(blockId)
      }
    },

    getBlockTypeName(blockData) {
      if (!blockData || typeof blockData !== 'object') {
        return 'Unknown'
      }
      
      // Check for ICRC3 block type field
      if (blockData.btype) {
        return blockData.btype
      }
      
      // Try to infer type from content
      if (blockData.trader || blockData.tokenSold) {
        return 'Trade'
      }
      if (blockData.eventType || blockData.tokensAffected) {
        return 'Circuit Breaker'
      }
      if (blockData.portfolioSnapshot || blockData.totalValue) {
        return 'Portfolio'
      }
      if (blockData.priceHistory || blockData.price) {
        return 'Price'
      }
      
      return 'Data'
    },

    getBlockSummary(blockData) {
      if (!blockData || typeof blockData !== 'object') {
        return 'Invalid block data'
      }
      
      // Trading block
      if (blockData.trader || blockData.tokenSold) {
        const success = blockData.success ? '✅' : '❌'
        const trader = blockData.trader ? `Trader: ${blockData.trader.toString().slice(0, 8)}...` : ''
        const tokens = blockData.tokenSold && blockData.tokenBought 
          ? `${blockData.tokenSold} → ${blockData.tokenBought}`
          : ''
        const amounts = blockData.amountSold && blockData.amountBought
          ? `(${blockData.amountSold} → ${blockData.amountBought})`
          : ''
        return `${success} Trade: ${trader} ${tokens} ${amounts}`.trim()
      }
      
      // Circuit breaker block
      if (blockData.eventType || blockData.tokensAffected) {
        const event = blockData.eventType || 'Unknown Event'
        const tokens = blockData.tokensAffected?.length ? `Tokens: ${blockData.tokensAffected.join(', ')}` : ''
        return `🚨 Circuit Breaker: ${event} ${tokens}`.trim()
      }
      
      // Portfolio block
      if (blockData.portfolioSnapshot || blockData.totalValue) {
        const value = blockData.totalValue || blockData.portfolioSnapshot?.totalValue || 'Unknown'
        const tokens = blockData.portfolioSnapshot?.holdings?.length || 0
        return `💼 Portfolio: ${tokens} tokens, Total Value: ${value}`
      }
      
      // Price block
      if (blockData.priceHistory || blockData.price) {
        const token = blockData.token || 'Unknown Token'
        const price = blockData.price || blockData.priceHistory?.currentPrice || 'Unknown'
        return `💲 Price: ${token} = ${price}`
      }
      
      // Generic block
      const keys = Object.keys(blockData).slice(0, 3).join(', ')
      return `📄 Data Block: ${keys}${Object.keys(blockData).length > 3 ? '...' : ''}`
    },

    formatBlockJson(blockData) {
      return JSON.stringify(blockData, (key, value) => {
        // Convert BigInt to string for display
        if (typeof value === 'bigint') {
          return value.toString() + 'n'
        }
        return value
      }, 2)
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
</style> 