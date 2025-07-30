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
      refreshInterval: null
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
      await this.refreshStatus()
      await this.refreshLogs()
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
          return `Trades: ${this.legacyStatus.lastImportedTradeTimestamp || 0}, Alerts: ${this.legacyStatus.lastImportedPriceAlertId || 0}`
        case 'portfolio_archive':
          return `Last: ${this.formatTime(this.legacyStatus.lastPortfolioImportTime)}`
        case 'price_archive':
          return `Last: ${this.formatTime(this.legacyStatus.lastImportedPriceTime)}`
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