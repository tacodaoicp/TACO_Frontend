<template>
  <div class="standard-view">
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="📦" title="Archive Management" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Overview: All Archives -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Overview: Archive Loop Status</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-light" @click="refreshOverviewStatuses" :disabled="overviewLoading">
                  🔄 Refresh Overview
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="overviewLoading" class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else class="row g-3">
                <div 
                  v-for="def in archiveDefs" 
                  :key="def.key" 
                  class="col-12 col-md-6 col-lg-4"
                >
                  <div class="p-3 border rounded h-100" style="cursor: pointer;"
                       @click="selectedArchive = def.key; onArchiveChange()">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h5 class="mb-0 d-flex align-items-center gap-2">
                        <span class="badge" :class="def.badgeClass">{{ def.label }}</span>
                      </h5>
                      <span class="badge" :class="getOverviewOverallBadge(def.key)">
                        {{ getOverviewOverallStatus(def.key) }}
                      </span>
                    </div>
                    <div class="d-flex align-items-center gap-4">
                      <div class="d-flex align-items-center gap-2">
                        <div class="status-indicator" :class="getOverviewLampClass(def.key, 'outer')"></div>
                        <small>Outer</small>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <div class="status-indicator" :class="getOverviewLampClass(def.key, 'middle')"></div>
                        <small>Middle</small>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <div class="status-indicator" :class="getOverviewLampClass(def.key, 'inner')"></div>
                        <small>Inner</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    <option value="dao_neuron_allocation_archive">🧠 DAO Neuron Allocation Archive</option>
                    <option value="dao_governance_archive">🗳️ DAO Governance Archive</option>
                    <option value="reward_distribution_archive">🎁 Reward Distribution Archive</option>
                    <option value="reward_withdrawal_archive">💸 Reward Withdrawal Archive</option>
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
                  
                  <div v-if="selectedArchive === 'dao_neuron_allocation_archive'" class="mt-3">
                    <h6>DAO Neuron Allocation Archive</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <button 
                        class="btn btn-sm btn-outline-success" 
                        @click="runArchiveSpecificImport('importNeuronAllocationChanges')"
                        :disabled="loading"
                      >
                        🧠 Import Neuron Allocations
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
                  
                  <div v-if="selectedArchive === 'reward_distribution_archive'" class="mt-3">
                    <h6>Reward Distribution Archive</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <button 
                        class="btn btn-sm btn-outline-primary" 
                        @click="runArchiveSpecificImport('importRewardDistributions')"
                        :disabled="loading"
                      >
                        🎁 Import Reward Distributions
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="selectedArchive === 'reward_withdrawal_archive'" class="mt-3">
                    <h6>Reward Withdrawal Archive</h6>
                    <div class="d-flex flex-wrap gap-2">
                      <button 
                        class="btn btn-sm btn-outline-warning" 
                        @click="runArchiveSpecificImport('importRewardWithdrawals')"
                        :disabled="loading"
                      >
                        💸 Import Reward Withdrawals
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
    
    <!-- GNSF Proposal Dialog for Non-Admin Users -->
    <GNSFProposalDialog
      :show="showProposalDialog"
      :function-name="proposalFunctionName"
      :reason-placeholder="proposalReasonPlaceholder"
      :context-params="proposalContextParams"
      @close="showProposalDialog = false"
      @success="handleProposalSuccess"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import GNSFProposalDialog from '../components/proposals/GNSFProposalDialog.vue'
import { useTacoStore } from '../stores/taco.store'
import { mapStores } from 'pinia'
import { Principal } from '@dfinity/principal'
import ApexCharts from 'apexcharts'

// Import composables
import { useAdminCheck } from '../composables/useAdminCheck'

// Import archive actors
import { createActor as createTradingActor } from '../../../declarations/trading_archive'
import { createActor as createPortfolioActor } from '../../../declarations/portfolio_archive'
import { createActor as createPriceActor } from '../../../declarations/price_archive'
import { createActor as createDaoAdminActor } from '../../../declarations/dao_admin_archive'
import { createActor as createDaoAllocationActor } from '../../../declarations/dao_allocation_archive'
import { createActor as createDaoNeuronAllocationActor } from '../../../declarations/dao_neuron_allocation_archive'
import { createActor as createDaoGovernanceActor } from '../../../declarations/dao_governance_archive'
import { createActor as createRewardDistributionActor } from '../../../declarations/reward_distribution_archive'
import { createActor as createRewardWithdrawalActor } from '../../../declarations/reward_withdrawal_archive'
import { getEffectiveNetwork } from '../config/network-config'

// Helper function for runtime network detection
function getNetworkHost() {
  const network = getEffectiveNetwork()
  if (network === 'local') {
    const port = import.meta.env.VITE_LOCAL_PORT || '4943'
    return `http://localhost:${port}`
  }
  return 'https://ic0.app'
}

// Archive canister IDs (mapped from archive type to principal)
const ARCHIVE_CANISTER_IDS = {
  trading_archive: 'jlycp-kqaaa-aaaan-qz4xa-cai',
  portfolio_archive: 'lrekt-uaaaa-aaaan-qz4ya-cai',
  price_archive: 'l7gh3-pqaaa-aaaan-qz4za-cai',
  dao_admin_archive: 'b6ygs-xaaaa-aaaan-qz5ca-cai',
  dao_governance_archive: 'bzzag-2yaaa-aaaan-qz5cq-cai',
  dao_allocation_archive: 'bq2l2-mqaaa-aaaan-qz5da-cai',
  dao_neuron_allocation_archive: 'cajb4-qqaaa-aaaan-qz5la-cai',
  reward_distribution_archive: 'cq4d3-3qaaa-aaaan-qz5lq-cai',
  reward_withdrawal_archive: 'c4ful-6iaaa-aaaan-qz5ma-cai'
}

export default {
  name: 'AdminArchiveView',
  components: {
    TacoTitle,
    GNSFProposalDialog
  },
  setup() {
    // Use admin check composable
    const { isAdmin, checking: adminChecking, checkAdminStatus } = useAdminCheck()
    
    // GNSF Proposal Dialog state
    const showProposalDialog = ref(false)
    const proposalFunctionName = ref('')
    const proposalReasonPlaceholder = ref('')
    const proposalContextParams = ref({})
    
    return {
      isAdmin,
      adminChecking,
      checkAdminStatus,
      showProposalDialog,
      proposalFunctionName,
      proposalReasonPlaceholder,
      proposalContextParams
    }
  },
  data() {
    return {
      selectedArchive: 'trading_archive',
      loading: false,
      overviewLoading: false,
      overviewStatuses: {},
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
      daoNeuronAllocationActor: null,
      daoGovernanceActor: null,
      rewardDistributionActor: null,
      rewardWithdrawalActor: null,
      
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
      portfolioCharts: new Map(),
      
      // Fetch states for allocation cards
      fetchStates: new Map(), // blockId -> { votingPower: 'loading'|'loaded'|'error', previousAllocation: 'loading'|'loaded'|'error' }
      fetchedData: new Map(),  // blockId -> { votingPower: number, previousAllocation: allocation, allPreviousAllocations: [allocations] }
      
      // Simple voting power display for each block (reactive)
      votingPowerDisplays: {},
      
      // Simple previous allocation display for each block (reactive)
      previousAllocationDisplays: {}
    }
  },
  computed: {
    ...mapStores(useTacoStore),
    archiveDefs() {
      return [
        { key: 'trading_archive', label: 'Trading Archive', badgeClass: 'bg-success' },
        { key: 'portfolio_archive', label: 'Portfolio Archive', badgeClass: 'bg-info' },
        { key: 'price_archive', label: 'Price Archive', badgeClass: 'bg-warning' },
        { key: 'dao_admin_archive', label: 'DAO Admin Archive', badgeClass: 'bg-primary' },
        { key: 'dao_allocation_archive', label: 'DAO Allocation Archive', badgeClass: 'bg-info' },
        { key: 'dao_neuron_allocation_archive', label: 'DAO Neuron Allocation', badgeClass: 'bg-success' },
        { key: 'dao_governance_archive', label: 'DAO Governance Archive', badgeClass: 'bg-secondary' },
        { key: 'reward_distribution_archive', label: 'Reward Distribution', badgeClass: 'bg-success' },
        { key: 'reward_withdrawal_archive', label: 'Reward Withdrawal', badgeClass: 'bg-warning' }
      ]
    },
    currentArchiveActor() {
      switch (this.selectedArchive) {
        case 'trading_archive': return this.tradingActor
        case 'portfolio_archive': return this.portfolioActor
        case 'price_archive': return this.priceActor
        case 'dao_admin_archive': return this.daoAdminActor
        case 'dao_allocation_archive': return this.daoAllocationActor
        case 'dao_neuron_allocation_archive': return this.daoNeuronAllocationActor
        case 'dao_governance_archive': return this.daoGovernanceActor
        case 'reward_distribution_archive': return this.rewardDistributionActor
        case 'reward_withdrawal_archive': return this.rewardWithdrawalActor
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
    this.refreshOverviewStatuses()
    this.refreshLogs()
    
    // Load the first blocks
    await this.loadFirstBlocks()
    
    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.refreshStatus()
      this.refreshOverviewStatuses()
    }, 10000)
    
    // Add event delegation for fetch buttons
    document.addEventListener('click', this.handleFetchButtonClick)
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    
    // Remove event delegation
    document.removeEventListener('click', this.handleFetchButtonClick)
    
    // Clean up portfolio charts
    this.cleanupPortfolioCharts()
  },
  methods: {
    // ===== Overview helpers =====
    getOverviewLampClass(key, tier) {
      const s = this.overviewStatuses[key]
      if (!s) return 'inactive'
      if (tier === 'outer') return s.outerLoopRunning ? 'active' : 'inactive'
      if (tier === 'middle') return s.middleLoopRunning ? 'active' : 'inactive'
      if (tier === 'inner') return s.innerLoopRunning ? 'active' : 'inactive'
      return 'inactive'
    },

    getOverviewOverallStatus(key) {
      const s = this.overviewStatuses[key]
      if (!s) return 'Unknown'
      if (s.innerLoopRunning) return 'Importing'
      if (s.middleLoopRunning) return 'Coordinating'
      if (s.outerLoopRunning) return 'Scheduled'
      return 'Stopped'
    },

    getOverviewOverallBadge(key) {
      const status = this.getOverviewOverallStatus(key)
      switch (status) {
        case 'Importing': return 'bg-success'
        case 'Coordinating': return 'bg-info'
        case 'Scheduled': return 'bg-primary'
        case 'Stopped': return 'bg-secondary'
        default: return 'bg-dark'
      }
    },

    async refreshOverviewStatuses() {
      try {
        this.overviewLoading = true
        const actorMap = {
          trading_archive: this.tradingActor,
          portfolio_archive: this.portfolioActor,
          price_archive: this.priceActor,
          dao_admin_archive: this.daoAdminActor,
          dao_allocation_archive: this.daoAllocationActor,
          dao_neuron_allocation_archive: this.daoNeuronAllocationActor,
          dao_governance_archive: this.daoGovernanceActor,
          reward_distribution_archive: this.rewardDistributionActor,
          reward_withdrawal_archive: this.rewardWithdrawalActor,
        }

        const entries = Object.entries(actorMap)
        const results = await Promise.all(entries.map(async ([key, actor]) => {
          try {
            if (!actor || !actor.getTimerStatus) return [key, null]
            const raw = await actor.getTimerStatus()
            return [key, this.convertBigIntFields(raw)]
          } catch (e) {
            return [key, null]
          }
        }))

        const statusObj = {}
        for (const [key, val] of results) {
          if (val) statusObj[key] = val
        }
        this.overviewStatuses = statusObj
      } finally {
        this.overviewLoading = false
      }
    },
    // Canister ID functions using actual deployed canister IDs from canister_ids.json
    tradingArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_TRADING_ARCHIVE_IC || 'jmze3-hiaaa-aaaan-qz4xq-cai';
        case "staging":
          return process.env.CANISTER_ID_TRADING_ARCHIVE_STAGING || 'jlycp-kqaaa-aaaan-qz4xa-cai';
      }
      return 'jlycp-kqaaa-aaaan-qz4xa-cai'; // fallback to staging canisterId for local
    },

    portfolioArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_IC || 'bl7x7-wiaaa-aaaan-qz5bq-cai'; // fallback to staging as no IC deployment yet
        case "staging":
          return process.env.CANISTER_ID_PORTFOLIO_ARCHIVE_STAGING || 'lrekt-uaaaa-aaaan-qz4ya-cai';
      }
      return 'lrekt-uaaaa-aaaan-qz4ya-cai'; // fallback to staging canisterId for local
    },

    priceArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_PRICE_ARCHIVE_IC || 'bm6rl-3qaaa-aaaan-qz5ba-cai'; // fallback to staging as no IC deployment yet
        case "staging":
          return process.env.CANISTER_ID_PRICE_ARCHIVE_STAGING || 'l7gh3-pqaaa-aaaan-qz4za-cai';
      }
      return 'l7gh3-pqaaa-aaaan-qz4za-cai'; // fallback to staging canisterId for local
    },

    daoAdminArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_DAO_ADMIN_ARCHIVE_IC || 'cspwf-4aaaa-aaaan-qz5ia-cai'; // fallback to staging
        case "staging":
          return process.env.CANISTER_ID_DAO_ADMIN_ARCHIVE_STAGING || 'b6ygs-xaaaa-aaaan-qz5ca-cai';
      }
      return 'b6ygs-xaaaa-aaaan-qz5ca-cai'; // fallback to staging canisterId for local
    },

    daoAllocationArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_DAO_ALLOCATION_ARCHIVE_IC || 'cvoqr-ryaaa-aaaan-qz5iq-cai'; // fallback to staging
        case "staging":
          return process.env.CANISTER_ID_DAO_ALLOCATION_ARCHIVE_STAGING || 'bq2l2-mqaaa-aaaan-qz5da-cai';
      }
      return 'bq2l2-mqaaa-aaaan-qz5da-cai'; // fallback to staging canisterId for local
    },

    daoNeuronAllocationArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_DAO_NEURON_ALLOCATION_ARCHIVE_IC || 'dnhfs-7yaaa-aaaan-qz5mq-cai';
        case "staging":
          return process.env.CANISTER_ID_DAO_NEURON_ALLOCATION_ARCHIVE_STAGING || 'cajb4-qqaaa-aaaan-qz5la-cai';
      }
      return 'cajb4-qqaaa-aaaan-qz5la-cai'; // fallback for local
    },

    daoGovernanceArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_DAO_GOVERNANCE_ARCHIVE_IC || 'c4n3n-hqaaa-aaaan-qz5ja-cai'; // fallback to staging
        case "staging":
          return process.env.CANISTER_ID_DAO_GOVERNANCE_ARCHIVE_STAGING || 'bzzag-2yaaa-aaaan-qz5cq-cai';
      }
      return 'bzzag-2yaaa-aaaan-qz5cq-cai'; // fallback to staging canisterId for local
    },

    rewardDistributionArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_REWARD_DISTRIBUTION_ARCHIVE_IC || 'uqkap-jiaaa-aaaan-qz6tq-cai';
        case "staging":
          return process.env.CANISTER_ID_REWARD_DISTRIBUTION_ARCHIVE_STAGING || 'ddfi2-eiaaa-aaaan-qz5nq-cai';
      }
      return 'ddfi2-eiaaa-aaaan-qz5nq-cai'; // fallback for local
    },

    rewardWithdrawalArchiveCanisterId() {
      const network = getEffectiveNetwork()
      switch (network) {
        case "ic":
          return process.env.CANISTER_ID_REWARD_WITHDRAWAL_ARCHIVE_IC || 'v5eeb-gaaaa-aaaan-qz6ua-cai';
        case "staging":
          return process.env.CANISTER_ID_REWARD_WITHDRAWAL_ARCHIVE_STAGING || 'dwczx-faaaa-aaaan-qz5oa-cai';
      }
      return 'dwczx-faaaa-aaaan-qz5oa-cai'; // fallback for local
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
        const host = getNetworkHost()

        // Create agent with authenticated identity
        const agent = await createAgent({
          identity: identity,
          host: host,
          fetchRootKey: getEffectiveNetwork() === "local"
        })
        
        // Create actors with proper canister IDs and authenticated agent
        this.tradingActor = createTradingActor(this.tradingArchiveCanisterId(), { agent })
        this.portfolioActor = createPortfolioActor(this.portfolioArchiveCanisterId(), { agent })
        this.priceActor = createPriceActor(this.priceArchiveCanisterId(), { agent })
        this.daoAdminActor = createDaoAdminActor(this.daoAdminArchiveCanisterId(), { agent })
        this.daoAllocationActor = createDaoAllocationActor(this.daoAllocationArchiveCanisterId(), { agent })
        this.daoNeuronAllocationActor = createDaoNeuronAllocationActor(this.daoNeuronAllocationArchiveCanisterId(), { agent })
        this.daoGovernanceActor = createDaoGovernanceActor(this.daoGovernanceArchiveCanisterId(), { agent })
        this.rewardDistributionActor = createRewardDistributionActor(this.rewardDistributionArchiveCanisterId(), { agent })
        this.rewardWithdrawalActor = createRewardWithdrawalActor(this.rewardWithdrawalArchiveCanisterId(), { agent })
        
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
      // Check if user is admin
      await this.checkAdminStatus()
      
      if (this.isAdmin) {
        // Admin path - direct call
        this.loading = true
        this.clearMessages()
        
        try {
          const result = await this.currentArchiveActor.startBatchImportSystem()
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
      } else {
        // Non-admin path - open proposal dialog
        this.openProposalDialog(
          'archiveProxy_startBatchImportSystem',
          'Please explain why the batch import system should be started on this archive...'
        )
      }
    },

    async stopBatchImportSystem() {
      // Check if user is admin
      await this.checkAdminStatus()
      
      if (this.isAdmin) {
        // Admin path - direct call
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
      } else {
        // Non-admin path - open proposal dialog
        this.openProposalDialog(
          'archiveProxy_stopBatchImportSystem',
          'Please explain why the batch import system should be stopped on this archive...'
        )
      }
    },

    async resetImportTimestamps() {
      // Check if user is admin
      await this.checkAdminStatus()
      
      if (this.isAdmin) {
        // Admin path - direct call
        this.loading = true
        this.clearMessages()
        
        try {
          const result = await this.currentArchiveActor.resetImportTimestamps()
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
      } else {
        // Non-admin path - open proposal dialog
        this.openProposalDialog(
          'archiveProxy_resetImportTimestamps',
          'Please explain why the import timestamps should be reset on this archive (this will re-import all historical data)...'
        )
      }
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
      // Check if user is admin
      await this.checkAdminStatus()
      
      if (this.isAdmin) {
        // Admin path - direct call
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
      } else {
        // Non-admin path - open proposal dialog
        this.openProposalDialog(
          'archiveProxy_stopAllTimers',
          'Please explain why all timers should be emergency stopped on this archive...'
        )
      }
    },

    async runManualBatchImport() {
      // Check if user is admin
      await this.checkAdminStatus()
      
      if (this.isAdmin) {
        // Admin path - direct call
        this.loading = true
        this.clearMessages()
        this.successMessage = 'Manual batch import started. Check logs for progress...'
        
        try {
          const result = await this.currentArchiveActor.runManualBatchImport()
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
      } else {
        // Non-admin path - open proposal dialog
        this.openProposalDialog(
          'archiveProxy_runManualBatchImport',
          'Please explain why a manual batch import should be triggered on this archive...'
        )
      }
    },

    async updateConfiguration() {
      // Check if user is admin
      await this.checkAdminStatus()
      
      if (this.isAdmin) {
        // Admin path - direct call
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
      } else {
        // Non-admin path - open proposal dialog with iterations parameter
        this.showConfigModal = false
        this.openProposalDialog(
          'archiveProxy_setMaxInnerLoopIterations',
          'Please explain why the max inner loop iterations should be changed on this archive...',
          { iterations: parseInt(this.configMaxIterations) }
        )
      }
    },

    clearMessages() {
      this.errorMessage = ''
      this.successMessage = ''
    },

    // Get the current archive canister principal
    getCurrentArchivePrincipal() {
      const principalId = ARCHIVE_CANISTER_IDS[this.selectedArchive]
      if (!principalId) {
        console.error('Unknown archive type:', this.selectedArchive)
        return null
      }
      return Principal.fromText(principalId)
    },

    // Handle successful proposal submission
    handleProposalSuccess(proposalId) {
      console.log('Proposal created successfully:', proposalId)
      this.successMessage = `Proposal ${proposalId} created successfully! The archive operation will be executed when the proposal passes.`
    },

    // Open proposal dialog for non-admin users
    openProposalDialog(functionName, reasonPlaceholder, additionalParams = {}) {
      const archivePrincipal = this.getCurrentArchivePrincipal()
      if (!archivePrincipal) {
        this.errorMessage = 'Could not determine archive canister principal'
        return
      }
      
      this.proposalFunctionName = functionName
      this.proposalReasonPlaceholder = reasonPlaceholder
      this.proposalContextParams = {
        archivePrincipal: archivePrincipal,
        ...additionalParams
      }
      this.showProposalDialog = true
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
        case 'dao_neuron_allocation_archive': return 'bg-success'
        case 'dao_governance_archive': return 'bg-secondary'
        case 'reward_distribution_archive': return 'bg-success'
        case 'reward_withdrawal_archive': return 'bg-warning'
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
        case 'dao_neuron_allocation_archive':
          // DAO neuron allocation archive status - shows neuron-level allocation changes
          return 'Neuron Allocation Archive - Neuron-level allocation changes for rewards tracking'
        case 'dao_governance_archive':
          // DAO governance archive status - shows voting power and neuron updates
          return 'Governance Archive - Voting power changes and neuron updates'
        case 'reward_distribution_archive':
          // Reward distribution archive status - shows reward distribution records
          return 'Reward Distribution Archive - Periodic reward distribution records and neuron rewards'
        case 'reward_withdrawal_archive':
          // Reward withdrawal archive status - shows reward withdrawal records
          return 'Reward Withdrawal Archive - User reward withdrawals and transaction records'
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
        
        // Extract the raw principal ID from the blob (not the display name)
        const userPrincipal = Principal.fromUint8Array(new Uint8Array(allocationData.user)).toText()
        const userDisplayName = this.formatPrincipalFromBlob(allocationData.user) // For display only
        const changeType = allocationData.changeType?.type || 'Unknown'
        const userInitiated = allocationData.changeType?.userInitiated === 1n || allocationData.changeType?.userInitiated === '1'
        const reason = allocationData.reason || 'No reason provided'
        const timestamp = allocationData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        const blockId = allocationData.id || 'unknown'
        
        // Debug logging
        console.log('Allocation card - userPrincipal:', userPrincipal, 'userDisplayName:', userDisplayName, 'blockId:', blockId, 'timestamp:', timestamp)
        
        // Get fetch states and data for this block
        const fetchState = this.fetchStates.get(blockId) || {}
        const fetchedData = this.fetchedData.get(blockId) || {}
        
        // Simple voting power display using reactive data
        const vpDisplayText = this.votingPowerDisplays[blockId] || '0 VP'
        
        // Voting power - show fetched data or fetch button
        let votingPowerHtml = ''
        if (fetchState.votingPower === 'loading') {
          votingPowerHtml = '<span class="text-info">⏳ Loading...</span>'
        } else if (fetchState.votingPower === 'loaded') {
          const vp = fetchedData.votingPower || 0
          votingPowerHtml = `<strong>${vp} VP</strong> <button class="btn btn-xs btn-outline-secondary ms-1" data-action="fetchVP" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">🔄 Refresh</button>`
        } else if (fetchState.votingPower === 'error') {
          votingPowerHtml = `<span class="text-danger">❌ Error</span> <button class="btn btn-xs btn-outline-primary ms-1" data-action="fetchVP" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">🔄 Retry</button>`
        } else {
          votingPowerHtml = `<button class="btn btn-xs btn-outline-primary" data-action="fetchVP" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">📊 Fetch VP</button>`
        }
        
        // Previous allocations - show fetched data or fetch button
        let oldAllocationsHtml = ''
        if (fetchState.previousAllocation === 'loading') {
          oldAllocationsHtml = '<span class="text-info">⏳ Loading...</span>'
        } else if (fetchState.previousAllocation === 'loaded') {
          const prevAlloc = fetchedData.previousAllocation
          if (prevAlloc && prevAlloc.newAllocations && prevAlloc.newAllocations.length > 0) {
            const allocBadges = prevAlloc.newAllocations.map(allocation => {
              const tokenName = this.formatTokenName(allocation.token)
              const percentage = (allocation.basisPoints / 100).toFixed(2)
              return `<span class="badge bg-secondary me-1">${tokenName}: ${percentage}%</span>`
            }).join('')
            oldAllocationsHtml = `${allocBadges}<br><small class="text-muted">From: ${this.formatTime(prevAlloc.timestamp)}</small>`
          } else {
            oldAllocationsHtml = '<em class="text-muted">No previous allocation found</em>'
          }
          oldAllocationsHtml += `<br><button class="btn btn-xs btn-outline-secondary mt-1" data-action="fetchPrevious" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">🔄 Refresh</button>`
          oldAllocationsHtml += ` <button class="btn btn-xs btn-outline-info mt-1" data-action="fetchAll" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">📋 Fetch All</button>`
        } else if (fetchState.previousAllocation === 'error') {
          oldAllocationsHtml = `<span class="text-danger">❌ Error</span><br><button class="btn btn-xs btn-outline-primary mt-1" data-action="fetchPrevious" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">🔄 Retry</button>`
        } else {
          oldAllocationsHtml = `<button class="btn btn-xs btn-outline-primary" data-action="fetchPrevious" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">📊 Fetch Previous</button>`
          oldAllocationsHtml += ` <button class="btn btn-xs btn-outline-info" data-action="fetchAll" data-block-id="${blockId}" data-user-id="${userPrincipal}" data-timestamp="${timestamp}">📋 Fetch All</button>`
        }
        
        // Add reactive display text (can't fail approach)
        const prevAllocDisplayText = this.previousAllocationDisplays[blockId] || ''
        if (prevAllocDisplayText) {
          oldAllocationsHtml += `<br><span style="color: white; font-size: 0.85em;">${prevAllocDisplayText}</span>`
        }
        
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
                <tr><td><strong>User:</strong></td><td><code>${userDisplayName}</code></td></tr>
                <tr><td><strong>Change Type:</strong></td><td><span class="badge ${userInitiated ? 'bg-success' : 'bg-warning'}">${changeType}</span></td></tr>
                <tr><td><strong>Initiated By:</strong></td><td>${userInitiated ? '👤 User' : '🤖 System'}</td></tr>
                <tr><td><strong>Timestamp:</strong></td><td><span class="text-info">🕐 ${formattedTime}</span></td></tr>
                <tr><td><strong>Voting Power:</strong></td><td>${votingPowerHtml} <span style="color: white;">${vpDisplayText}</span></td></tr>
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
                      <td><code class="text-info">${userId}</code><br><small class="text-muted">${Principal.fromUint8Array(new Uint8Array(votingPowerData.user)).toText()}</small></td>
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
            const userPrincipal = Principal.fromUint8Array(new Uint8Array(userBlob)).toText()
            const userShort = userId.length > 16 ? userId.substring(0, 6) + '...' + userId.substring(userId.length - 6) : userId
            return `<div class="mb-1"><span class="badge bg-warning text-dark me-1">${userShort}</span><br><small class="text-muted">${userPrincipal}</small></div>`
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
                  ${this.renderOldNewValues(adminData.actionType)}
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

      // Reward distribution block details
      if ((parsedData.tx && parsedData.tx.operation === '3reward_distribution') || tradeData.operation === '3reward_distribution') {
        // Extract reward distribution data from the nested structure
        let distributionData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          distributionData = parsedData.tx.data
        }
        
        if (!distributionData) {
          return '<div class="text-muted">No reward distribution data available</div>'
        }
        
        // Extract key metrics
        const distributionId = distributionData.id || 'Unknown'
        const totalRewardPot = Number(distributionData.totalRewardPot || 0)
        const actualDistributed = Number(distributionData.actualDistributed || 0)
        const neuronsProcessed = Number(distributionData.neuronsProcessed || 0)
        const totalRewardScore = parseFloat(distributionData.totalRewardScore || '0')
        const status = distributionData.status || {}
        const neuronRewards = distributionData.neuronRewards || []
        const failedNeurons = distributionData.failedNeurons || []
        
        // Format amounts (convert from satoshis to TACO)
        const distributedTACO = (actualDistributed / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
        const potTACO = totalRewardPot.toLocaleString()
        
        // Status formatting
        const statusType = status.type || 'Unknown'
        const successfulNeurons = Number(status.successfulNeurons || neuronsProcessed - failedNeurons.length)
        const failedCount = failedNeurons.length
        
        const statusClass = statusType === 'Completed' ? 'bg-success' : 
                           statusType === 'PartiallyCompleted' ? 'bg-warning text-dark' : 
                           statusType === 'Failed' ? 'bg-danger' : 'bg-secondary'
        
        // Top 3 reward recipients
        const topRewards = neuronRewards
          .sort((a, b) => Number(b.rewardAmount || 0) - Number(a.rewardAmount || 0))
          .slice(0, 3)
          .map(reward => {
            const neuronId = this.formatNeuronFromBlob(reward.neuronId)
            const amount = (Number(reward.rewardAmount || 0) / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
            const votingPower = (Number(reward.votingPower || 0) / 100000000).toLocaleString(undefined, { maximumFractionDigits: 0 })
            return { neuronId, amount, votingPower }
          })
        
        // Time formatting
        const distributionTime = this.formatTime(Number(distributionData.timestamp))
        const startTime = this.formatTime(Number(distributionData.startTime))
        const endTime = this.formatTime(Number(distributionData.endTime))
        
        return `
          <div class="card bg-dark border-success">
            <div class="card-header bg-success text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">🎁 Reward Distribution #${distributionId}</h6>
                <span class="badge ${statusClass}">${statusType}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>💰 Distribution Summary</h6>
                  <table class="table table-sm table-dark">
                    <tr>
                      <td><strong>Reward Pot:</strong></td>
                      <td><span class="text-warning">${potTACO} TACO</span></td>
                    </tr>
                    <tr>
                      <td><strong>Distributed:</strong></td>
                      <td><span class="text-success">${distributedTACO} TACO</span></td>
                    </tr>
                    <tr>
                      <td><strong>Total Score:</strong></td>
                      <td><span class="text-info">${totalRewardScore.toLocaleString()}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Neurons:</strong></td>
                      <td>
                        <span class="text-success">${successfulNeurons} ✅</span>
                        ${failedCount > 0 ? `<span class="text-danger ms-2">${failedCount} ❌</span>` : ''}
                      </td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>📅 Timing</h6>
                  <table class="table table-sm table-dark">
                    <tr>
                      <td><strong>Period Start:</strong></td>
                      <td>🕐 ${startTime}</td>
                    </tr>
                    <tr>
                      <td><strong>Period End:</strong></td>
                      <td>🕐 ${endTime}</td>
                    </tr>
                    <tr>
                      <td><strong>Distribution Time:</strong></td>
                      <td>🕐 ${distributionTime}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              ${topRewards.length > 0 ? `
                <div class="mt-3">
                  <h6>🏆 Top Rewards</h6>
                  <div class="row">
                    ${topRewards.map((reward, index) => `
                      <div class="col-md-4">
                        <div class="alert alert-success">
                          <strong>#${index + 1}</strong><br>
                          <code class="text-light">${reward.neuronId}</code><br>
                          <span class="text-warning">${reward.amount} TACO</span><br>
                          <small class="text-muted">${reward.votingPower} VP</small>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  
                  ${neuronRewards.length > 3 ? `
                    <div class="mt-3">
                      <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#allNeurons${distributionId}" aria-expanded="false">
                        <i class="fas fa-list"></i> View All ${neuronRewards.length} Neurons
                      </button>
                      <div class="collapse mt-3" id="allNeurons${distributionId}">
                        <div class="card bg-secondary">
                          <div class="card-header">
                            <h6 class="mb-0 text-light">🧠 All Neuron Rewards</h6>
                          </div>
                          <div class="card-body p-0" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-sm table-dark table-striped mb-0">
                              <thead class="table-secondary">
                                <tr>
                                  <th>#</th>
                                  <th>Neuron ID</th>
                                  <th>Reward</th>
                                  <th>Voting Power</th>
                                  <th>Performance</th>
                                  <th>Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${neuronRewards.map((reward, index) => {
                                  const neuronId = this.formatNeuronFromBlob(reward.neuronId)
                                  const amount = (Number(reward.rewardAmount || 0) / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                  const votingPower = (Number(reward.votingPower || 0) / 100000000).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                  const performanceScore = parseFloat(reward.performanceScore || '0').toFixed(3)
                                  const rewardScore = parseFloat(reward.rewardScore || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })
                                  
                                  return `
                                    <tr>
                                      <td><span class="text-muted">${index + 1}</span></td>
                                      <td><code class="text-info" style="font-size: 0.75em;">${neuronId}</code></td>
                                      <td><span class="text-warning"><strong>${amount}</strong></span></td>
                                      <td><span class="text-light">${votingPower}</span></td>
                                      <td><span class="text-success">${performanceScore}</span></td>
                                      <td><span class="text-light">${rewardScore}</span></td>
                                    </tr>
                                  `
                                }).join('')}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              
              ${failedNeurons.length > 0 ? `
                <div class="mt-3">
                  <h6 class="text-danger">❌ Failed Neurons (${failedNeurons.length})</h6>
                  <div class="alert alert-danger">
                    ${failedNeurons.slice(0, 3).map(failed => {
                      const neuronId = this.formatNeuronFromBlob(failed.neuronId)
                      return `<div><code>${neuronId}</code>: ${failed.errorMessage}</div>`
                    }).join('')}
                    ${failedNeurons.length > 3 ? `<div><em>... and ${failedNeurons.length - 3} more</em></div>` : ''}
                  </div>
                </div>
              ` : ''}
              
              <small class="text-muted">
                Distribution processed ${neuronsProcessed} neurons with ${totalRewardScore.toLocaleString()} total reward score
              </small>
            </div>
          </div>
        `
      }

      // Reward withdrawal block details
      if ((parsedData.tx && parsedData.tx.operation === '3reward_withdrawal') || tradeData.operation === '3reward_withdrawal') {
        // Extract reward withdrawal data from the nested structure
        let withdrawalData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          withdrawalData = parsedData.tx.data
        }
        
        if (!withdrawalData) {
          return '<div class="text-muted">No reward withdrawal data available</div>'
        }
        
        // Extract key information from the actual structure
        const withdrawalId = withdrawalData.id || 'Unknown'
        const caller = withdrawalData.caller ? this.formatPrincipalFromBlob(withdrawalData.caller) : 'Unknown'
        const totalAmount = Number(withdrawalData.totalAmount || 0)
        const amountSent = Number(withdrawalData.amountSent || 0)
        const fee = Number(withdrawalData.fee || 0)
        const targetAccountOwner = withdrawalData.targetAccountOwner ? this.formatPrincipalFromBlob(withdrawalData.targetAccountOwner) : 'Unknown'
        const targetAccountSubaccount = withdrawalData.targetAccountSubaccount || ''
        const transactionId = withdrawalData.transactionId || null
        const neuronWithdrawals = withdrawalData.neuronWithdrawals || []
        
        // Format amounts (convert from satoshis to TACO)
        const totalTACO = (totalAmount / 100000000).toLocaleString(undefined, { maximumFractionDigits: 8 })
        const sentTACO = (amountSent / 100000000).toLocaleString(undefined, { maximumFractionDigits: 8 })
        const feeTACO = (fee / 100000000).toLocaleString(undefined, { maximumFractionDigits: 8 })
        
        // Format caller and target displays
        const callerShort = caller.length > 16 ? caller.substring(0, 8) + '...' + caller.substring(caller.length - 8) : caller
        const targetShort = targetAccountOwner.length > 16 ? targetAccountOwner.substring(0, 8) + '...' + targetAccountOwner.substring(targetAccountOwner.length - 8) : targetAccountOwner
        
        // Format subaccount if present
        const subaccountDisplay = targetAccountSubaccount && targetAccountSubaccount !== '' ? 
          `<tr>
            <td><strong>Subaccount:</strong></td>
            <td><code class="text-info">${targetAccountSubaccount}</code></td>
          </tr>` : ''
        
        // Time formatting
        const withdrawalTime = this.formatTime(Number(withdrawalData.timestamp))
        
        // Status is always completed if we have a transaction ID
        const status = transactionId ? 'Completed' : 'Unknown'
        const statusClass = 'bg-success'
        const statusIcon = '✅'
        
        return `
          <div class="card bg-dark border-warning">
            <div class="card-header bg-warning text-dark">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">💸 Reward Withdrawal #${withdrawalId}</h6>
                <span class="badge ${statusClass}">${statusIcon} ${status}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="text-light">💰 Withdrawal Details</h6>
                  <table class="table table-sm table-dark">
                    <tr>
                      <td><strong>Caller:</strong></td>
                      <td>
                        <code class="text-info">${callerShort}</code>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Total Amount:</strong></td>
                      <td><span class="text-warning">${totalTACO} TACO</span></td>
                    </tr>
                    <tr>
                      <td><strong>Amount Sent:</strong></td>
                      <td><span class="text-success">${sentTACO} TACO</span></td>
                    </tr>
                    <tr>
                      <td><strong>Fee:</strong></td>
                      <td><span class="text-light">${feeTACO} TACO</span></td>
                    </tr>
                    <tr>
                      <td><strong>Neurons:</strong></td>
                      <td><span class="text-info">${neuronWithdrawals.length} withdrawal${neuronWithdrawals.length !== 1 ? 's' : ''}</span></td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6 class="text-light">📋 Transaction Info</h6>
                  <table class="table table-sm table-dark">
                    <tr>
                      <td><strong>Target Account:</strong></td>
                      <td>
                        <code class="text-success">${targetShort}</code>
                      </td>
                    </tr>
                    ${subaccountDisplay}
                    ${transactionId !== null ? `
                      <tr>
                        <td><strong>Transaction ID:</strong></td>
                        <td><code class="text-success">${transactionId}</code></td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td><strong>Timestamp:</strong></td>
                      <td>🕐 ${withdrawalTime}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              ${neuronWithdrawals.length > 0 ? `
                <div class="mt-3">
                  <h6 class="text-light">🧠 Neuron Withdrawals</h6>
                  <div class="row">
                    ${neuronWithdrawals.slice(0, 3).map(withdrawal => {
                      const neuronId = this.formatNeuronFromBlob(withdrawal.neuronId)
                      const amount = (Number(withdrawal.amount || 0) / 100000000).toLocaleString(undefined, { maximumFractionDigits: 8 })
                      return `
                        <div class="col-md-4">
                          <div class="alert alert-info">
                            <code class="text-light">${neuronId}</code><br>
                            <span class="text-warning">${amount} TACO</span>
                          </div>
                        </div>
                      `
                    }).join('')}
                    ${neuronWithdrawals.length > 3 ? `
                      <div class="col-md-12">
                        <small class="text-muted">... and ${neuronWithdrawals.length - 3} more neuron withdrawals</small>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
              
              <small class="text-muted">
                Withdrawal processed ${neuronWithdrawals.length} neuron${neuronWithdrawals.length !== 1 ? 's' : ''}
                ${transactionId ? ` with transaction ID ${transactionId}` : ''}
              </small>
            </div>
          </div>
        `
      }

      // Neuron allocation change block details
      if ((parsedData.tx && parsedData.tx.operation === '3neuron_allocation_change') || tradeData.operation === '3neuron_allocation_change') {
        //console.log('=== Processing neuron allocation change block ===', tradeData)
        
        // Extract neuron allocation data from the nested structure
        let neuronAllocationData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          neuronAllocationData = parsedData.tx.data
        }
        
        // Extract basic information
        let neuronId = 'Unknown'
        
        // Use the global neuron naming utility method
        neuronId = neuronAllocationData.neuronId ? this.formatNeuronFromBlob(neuronAllocationData.neuronId) : 'Unknown'
        const userPrincipal = Principal.fromUint8Array(new Uint8Array(neuronAllocationData.user)).toText()
        const userDisplayName = this.formatPrincipalFromBlob(neuronAllocationData.user)
        const changeType = neuronAllocationData.changeType?.type || 'Unknown'
        const userInitiated = neuronAllocationData.changeType?.userInitiated === 1n || neuronAllocationData.changeType?.userInitiated === '1'
        const reason = neuronAllocationData.reason || 'No reason provided'
        const timestamp = neuronAllocationData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        const votingPower = Number(neuronAllocationData.votingPower || 0)
        
        // Format voting power with commas
        const formatVotingPower = (vp) => {
          return (vp / 100000000).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }) + ' VP'
        }
        
        // Format old allocations
        let oldAllocationsHtml = '<em class="text-muted">None</em>'
        if (neuronAllocationData.oldAllocations && neuronAllocationData.oldAllocations.length > 0) {
          oldAllocationsHtml = neuronAllocationData.oldAllocations.map(allocation => {
            const tokenName = this.formatTokenNameFromBlob(allocation.token)
            const percentage = (Number(allocation.basisPoints) / 100).toFixed(2)
            return `<span class="badge bg-secondary me-1 mb-1">${tokenName}: ${percentage}%</span>`
          }).join('')
        }
        
        // Format new allocations
        let newAllocationsHtml = '<em class="text-muted">None</em>'
        if (neuronAllocationData.newAllocations && neuronAllocationData.newAllocations.length > 0) {
          newAllocationsHtml = neuronAllocationData.newAllocations.map(allocation => {
            const tokenName = this.formatTokenNameFromBlob(allocation.token)
            const percentage = (Number(allocation.basisPoints) / 100).toFixed(2)
            return `<span class="badge bg-success me-1 mb-1">${tokenName}: ${percentage}%</span>`
          }).join('')
        }
        
        // Calculate total percentages
        const oldTotal = neuronAllocationData.oldAllocations ? 
          (neuronAllocationData.oldAllocations.reduce((sum, a) => sum + Number(a.basisPoints), 0) / 100).toFixed(2) : '0.00'
        const newTotal = neuronAllocationData.newAllocations ? 
          (neuronAllocationData.newAllocations.reduce((sum, a) => sum + Number(a.basisPoints), 0) / 100).toFixed(2) : '0.00'
        
        // Calculate allocation changes
        const allocationChanges = []
        if (neuronAllocationData.oldAllocations && neuronAllocationData.newAllocations) {
          // Create a map of old allocations by token
          const oldMap = new Map()
          neuronAllocationData.oldAllocations.forEach(alloc => {
            const tokenKey = this.formatTokenNameFromBlob(alloc.token)
            oldMap.set(tokenKey, Number(alloc.basisPoints))
          })
          
          // Calculate changes
          neuronAllocationData.newAllocations.forEach(newAlloc => {
            const tokenName = this.formatTokenNameFromBlob(newAlloc.token)
            const newBP = Number(newAlloc.basisPoints)
            const oldBP = oldMap.get(tokenName) || 0
            const change = newBP - oldBP
            const changePercent = (change / 100).toFixed(2)
            
            if (Math.abs(change) > 0) {
              const changeClass = change > 0 ? 'text-success' : 'text-danger'
              const changeIcon = change > 0 ? '📈' : '📉'
              allocationChanges.push(`<div class="mb-1"><span class="badge bg-info">${tokenName}</span> <span class="${changeClass}">${changeIcon} ${changePercent}%</span></div>`)
            }
          })
        }
        
        const changesHtml = allocationChanges.length > 0 ? allocationChanges.join('') : '<em class="text-muted">No changes detected</em>'
        
        return `
          <div class="card bg-dark border-primary">
            <div class="card-header bg-primary text-white">
              <h6 class="mb-0">🧠 Neuron Allocation Change</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="text-light">🔧 Change Details</h6>
                  <table class="table table-sm table-dark table-borderless">
                    <tr>
                      <td><strong>Neuron ID:</strong></td>
                      <td><code class="text-primary">${neuronId}</code></td>
                    </tr>
                    <tr>
                      <td><strong>User:</strong></td>
                      <td><code class="text-info">${userDisplayName}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Change Type:</strong></td>
                      <td><span class="badge ${userInitiated ? 'bg-success' : 'bg-warning text-dark'}">${changeType}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Initiated By:</strong></td>
                      <td>${userInitiated ? '👤 User' : '🤖 System'}</td>
                    </tr>
                    <tr>
                      <td><strong>Voting Power:</strong></td>
                      <td><strong class="text-warning">${formatVotingPower(votingPower)}</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Timestamp:</strong></td>
                      <td><span class="text-info">🕐 ${formattedTime}</span></td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6 class="text-light">📊 Allocation Changes</h6>
                  <div class="mb-3">
                    <strong class="text-light">Previous Allocations:</strong><br>
                    <div class="mt-1">${oldAllocationsHtml}</div>
                    <small class="text-muted">Total: ${oldTotal}%</small>
                  </div>
                  <div class="mb-3">
                    <strong class="text-light">New Allocations:</strong><br>
                    <div class="mt-1">${newAllocationsHtml}</div>
                    <small class="text-muted">Total: ${newTotal}%</small>
                  </div>
                  <div>
                    <strong class="text-light">Changes:</strong><br>
                    <div class="mt-1">${changesHtml}</div>
                  </div>
                </div>
              </div>
              ${reason && reason !== 'No reason provided' && reason.trim() !== '' ? `
                <div class="row mt-3">
                  <div class="col-12">
                    <div class="alert alert-info">
                      <strong>Reason:</strong> ${reason}
                    </div>
                  </div>
                </div>
              ` : ''}
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
        if (parsedData.tx.operation === '3neuron_allocation_change') return 'Neuron Allocation Change'
        if (parsedData.tx.operation === '3voting_power') return 'Voting Power Change'
        if (parsedData.tx.operation === '3neuron_update') return 'Neuron Update'
        if (parsedData.tx.operation === '3admin') return 'Admin Action'
        if (parsedData.tx.operation === '3admin_action') return 'Admin Action'
        if (parsedData.tx.operation === '3follow_action') return 'Follow Action'
        if (parsedData.tx.operation === '3reward_distribution') return 'Reward Distribution'
        if (parsedData.tx.operation === '3reward_withdrawal') return 'Reward Withdrawal'
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
        // Check if it's a neuron allocation change by looking for neuronId
        if (blockTypeData.neuronId) {
          return 'Neuron Allocation Change'
        }
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
      
      // Neuron allocation change block
      if ((parsedData.tx && parsedData.tx.operation === '3neuron_allocation_change') || tradeData.operation === '3neuron_allocation_change') {
        // Extract neuron allocation data from the nested structure
        let neuronAllocationData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          neuronAllocationData = parsedData.tx.data
        }
        
        // Use the global neuron naming utility method
        let neuronId = neuronAllocationData.neuronId ? this.formatNeuronFromBlob(neuronAllocationData.neuronId) : 'Unknown'
        const neuronShort = neuronId.length > 12 ? neuronId.substring(0, 6) + '...' + neuronId.substring(neuronId.length - 6) : neuronId
        const userId = this.formatPrincipalFromBlob(neuronAllocationData.user)
        const userShort = userId ? userId.substring(0, 8) + '...' : 'Unknown'
        const changeType = neuronAllocationData.changeType?.type || 'Unknown'
        const userInitiated = neuronAllocationData.changeType?.userInitiated === 1n || neuronAllocationData.changeType?.userInitiated === '1'
        
        // Count allocations
        const oldCount = neuronAllocationData.oldAllocations ? neuronAllocationData.oldAllocations.length : 0
        const newCount = neuronAllocationData.newAllocations ? neuronAllocationData.newAllocations.length : 0
        
        // Calculate total percentages
        const newTotal = neuronAllocationData.newAllocations ? 
          (neuronAllocationData.newAllocations.reduce((sum, a) => sum + Number(a.basisPoints), 0) / 100).toFixed(1) : '0.0'
        
        // Format voting power
        const votingPower = Number(neuronAllocationData.votingPower || 0)
        const formattedVP = (votingPower / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
        
        // Extract timestamp
        const timestamp = neuronAllocationData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        const initiator = userInitiated ? '👤' : '🤖'
        return `🧠 ${initiator} Neuron ${changeType}: ${neuronShort} (${userShort}) ${oldCount}→${newCount} allocations (${newTotal}%, ${formattedVP} VP) • 🕐 ${formattedTime}`
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
      
      // Reward distribution summary
      if ((parsedData.tx && parsedData.tx.operation === '3reward_distribution') || tradeData.operation === '3reward_distribution') {
        let distributionData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          distributionData = parsedData.tx.data
        }
        
        const distributionId = distributionData.id || 'Unknown'
        const actualDistributed = Number(distributionData.actualDistributed || 0)
        const neuronsProcessed = Number(distributionData.neuronsProcessed || 0)
        const status = distributionData.status?.type || 'Unknown'
        const failedCount = (distributionData.failedNeurons || []).length
        
        const distributedTACO = (actualDistributed / 100000000).toFixed(2)
        const statusIcon = status === 'Completed' ? '✅' : 
                          status === 'PartiallyCompleted' ? '⚠️' : 
                          status === 'Failed' ? '❌' : '❓'
        
        const timestamp = distributionData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        
        return `🎁 Distribution #${distributionId}: ${distributedTACO} TACO to ${neuronsProcessed} neurons ${statusIcon}${failedCount > 0 ? ` (${failedCount} failed)` : ''} • 🕐 ${formattedTime}`
      }
      
      // Reward withdrawal summary
      if ((parsedData.tx && parsedData.tx.operation === '3reward_withdrawal') || tradeData.operation === '3reward_withdrawal') {
        let withdrawalData = tradeData
        if (parsedData.tx && parsedData.tx.data) {
          withdrawalData = parsedData.tx.data
        }
        
        const caller = withdrawalData.caller ? this.formatPrincipalFromBlob(withdrawalData.caller) : 'Unknown'
        const totalAmount = Number(withdrawalData.totalAmount || 0)
        const neuronCount = (withdrawalData.neuronWithdrawals || []).length
        const transactionId = withdrawalData.transactionId
        
        const withdrawnTACO = (totalAmount / 100000000).toFixed(2)
        const statusIcon = transactionId ? '✅' : '❓'
        
        const timestamp = withdrawalData.timestamp || Date.now()
        const formattedTime = this.formatTime(Number(timestamp))
        const callerShort = caller.length > 16 ? caller.substring(0, 8) + '...' + caller.substring(caller.length - 8) : caller
        
        return `💸 ${callerShort}: ${withdrawnTACO} TACO from ${neuronCount} neuron${neuronCount !== 1 ? 's' : ''} ${statusIcon} • 🕐 ${formattedTime}`
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
          
          // Fallback to truncated neuron ID hex string if requested
          if (fallbackToTruncated) {
            const hexStr = Array.from(uint8Array)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
            return hexStr.length > 16 ? 
              hexStr.substring(0, 8) + '...' + hexStr.substring(hexStr.length - 8) : 
              hexStr
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

    renderOldNewValues(actionType) {
      if (!actionType || !actionType.type) {
        return ''
      }

      const formatValue = (key, value, actionType, parameter) => {
        if (value === null || value === undefined) return 'N/A'
        
        const numValue = parseInt(value)
        
        switch (key) {
          case 'oldIntervalNS':
          case 'newIntervalNS':
            return this.formatDuration(numValue / 1_000_000_000) // Convert ns to seconds
          case 'oldThreshold':
          case 'newThreshold':
            return numValue.toLocaleString() + ' tokens'
          case 'oldLimit':
          case 'newLimit':
            if (actionType === 'UpdateMaxPortfolioSnapshots') {
              return numValue.toLocaleString() + ' snapshots'
            }
            return numValue.toLocaleString()
          case 'oldCondition':
          case 'newCondition':
            return value // Keep as text for conditions
          case 'oldValue':
          case 'newValue':
            // Format parameter values based on parameter type
            if (parameter && actionType === 'ParameterUpdate') {
              return this.formatParameterValue(parameter, value)
            }
            return value.toString()
          default:
            return value.toString()
        }
      }

      const getFieldName = (actionType) => {
        switch (actionType) {
          case 'UpdateTriggerCondition':
            return 'Price Alert Condition'
          case 'UpdatePortfolioCircuitBreaker':
            return 'Circuit Breaker Condition'
          case 'UpdatePausedTokenThreshold':
            return 'Paused Token Threshold'
          case 'UpdateMaxPortfolioSnapshots':
            return 'Max Portfolio Snapshots'
          case 'UpdatePortfolioSnapshotInterval':
            return 'Portfolio Snapshot Interval'
          default:
            return 'Setting'
        }
      }

      const getParameterName = (parameter) => {
        // Handle both string format "MaxFollowers(550)" and object format {type: "MaxFollowers"}
        let paramType;
        if (typeof parameter === 'string') {
          // Extract parameter name from string like "MaxFollowers(550)"
          const match = parameter.match(/^([^(]+)/);
          paramType = match ? match[1] : parameter;
        } else if (parameter && parameter.type) {
          paramType = parameter.type;
        } else {
          return 'System Parameter';
        }
        
        switch (paramType) {
          case 'FollowDepth':
            return 'Follow Depth'
          case 'MaxFollowers':
            return 'Max Followers'
          case 'MaxPastAllocations':
            return 'Max Past Allocations'
          case 'SnapshotInterval':
            return 'Snapshot Interval'
          case 'MaxTotalUpdates':
            return 'Max Total Updates'
          case 'MaxAllocationsPerDay':
            return 'Max Allocations Per Day'
          case 'AllocationWindow':
            return 'Allocation Window'
          case 'MaxFollowUnfollowActionsPerDay':
            return 'Max Follow/Unfollow Actions Per Day'
          case 'MaxFollowed':
            return 'Max Followed'
          case 'LogAdmin':
            return 'Log Admin Principal'
          default:
            return paramType || 'System Parameter'
        }
      }

      let oldValue, newValue, fieldName
      
      switch (actionType.type) {
        case 'UpdateTriggerCondition':
          if (actionType.oldCondition !== undefined && actionType.newCondition !== undefined) {
            oldValue = formatValue('oldCondition', actionType.oldCondition, actionType.type)
            newValue = formatValue('newCondition', actionType.newCondition, actionType.type)
            fieldName = getFieldName(actionType.type)
          }
          break
          
        case 'UpdatePortfolioCircuitBreaker':
          if (actionType.oldCondition !== undefined && actionType.newCondition !== undefined) {
            oldValue = formatValue('oldCondition', actionType.oldCondition, actionType.type)
            newValue = formatValue('newCondition', actionType.newCondition, actionType.type)
            fieldName = getFieldName(actionType.type)
          }
          break
          
        case 'UpdatePausedTokenThreshold':
          if (actionType.oldThreshold !== undefined && actionType.newThreshold !== undefined) {
            oldValue = formatValue('oldThreshold', actionType.oldThreshold, actionType.type)
            newValue = formatValue('newThreshold', actionType.newThreshold, actionType.type)
            fieldName = getFieldName(actionType.type)
          }
          break
          
        case 'UpdateMaxPortfolioSnapshots':
          if (actionType.oldLimit !== undefined && actionType.newLimit !== undefined) {
            oldValue = formatValue('oldLimit', actionType.oldLimit, actionType.type)
            newValue = formatValue('newLimit', actionType.newLimit, actionType.type)
            fieldName = getFieldName(actionType.type)
          }
          break
          
        case 'UpdatePortfolioSnapshotInterval':
          if (actionType.oldIntervalNS !== undefined && actionType.newIntervalNS !== undefined) {
            oldValue = formatValue('oldIntervalNS', actionType.oldIntervalNS, actionType.type)
            newValue = formatValue('newIntervalNS', actionType.newIntervalNS, actionType.type)
            fieldName = getFieldName(actionType.type)
          }
          break
          
        case 'ParameterUpdate':
          if (actionType.oldValue !== undefined && actionType.newValue !== undefined && actionType.parameter !== undefined) {
            oldValue = formatValue('oldValue', actionType.oldValue, actionType.type, actionType.parameter)
            newValue = formatValue('newValue', actionType.newValue, actionType.type, actionType.parameter)
            fieldName = getParameterName(actionType.parameter)
          }
          break
          
        default:
          return ''
      }

      if (!oldValue || !newValue || !fieldName) {
        return ''
      }

      return `
        <div class="alert alert-secondary mt-2">
          <strong>📊 Value Change:</strong>
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
                  <tr style="background-color: #e2e3e5;">
                    <td><strong>${fieldName}</strong></td>
                    <td class="text-muted">${oldValue}</td>
                    <td class="text-primary"><strong>→ ${newValue}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `
    },

    // Helper method to format parameter values based on parameter type
    formatParameterValue(parameter, value) {
      if (!parameter || !parameter.type) return value
      
      const numValue = parseInt(value)
      
      switch (parameter.type) {
        case 'FollowDepth':
        case 'MaxFollowers':
        case 'MaxPastAllocations':
        case 'MaxTotalUpdates':
        case 'MaxAllocationsPerDay':
        case 'MaxFollowUnfollowActionsPerDay':
        case 'MaxFollowed':
          return numValue.toLocaleString()
          
        case 'SnapshotInterval':
        case 'AllocationWindow':
          // These are likely in nanoseconds, convert to human readable
          if (numValue > 1_000_000_000) {
            return this.formatDuration(numValue / 1_000_000_000)
          }
          return numValue.toLocaleString() + ' ns'
          
        case 'LogAdmin':
          // Principal ID - keep as text but truncate if too long
          if (value.length > 30) {
            return value.substring(0, 15) + '...' + value.substring(value.length - 10)
          }
          return value
          
        default:
          return value
      }
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
    },

    // Fetch voting power for a specific user at a specific timestamp
    async fetchVotingPower(blockId, user, timestamp) {
      try {
        // Set loading state
        const currentState = this.fetchStates.get(blockId) || {}
        this.fetchStates.set(blockId, { ...currentState, votingPower: 'loading' })
        
        // Update display text
        this.votingPowerDisplays[blockId] = 'Fetching...'
        
        // Call the dao_governance_archive method
        // The user parameter should already be a valid principal string
        console.log('Fetching voting power for user:', user, 'at timestamp:', timestamp)
        console.log('Timestamp type:', typeof timestamp, 'value:', timestamp)
        console.log('Current time for reference:', Date.now(), 'vs', Date.now() * 1000000, '(nanoseconds)')
        console.log('daoGovernanceActor available:', !!this.daoGovernanceActor)
        console.log('getUserVotingPowerAtTime method available:', !!this.daoGovernanceActor?.getUserVotingPowerAtTime)
        
        const userPrincipal = Principal.fromText(user)
        console.log('Converted to Principal:', userPrincipal.toText())
        
        // Convert timestamp to nanoseconds if needed
        // The backend expects nanoseconds (19-digit numbers like 1754564244618898112)
        let timestampNs
        const timestampStr = timestamp.toString()
        
        console.log('Timestamp string length:', timestampStr.length, 'value:', timestampStr)
        
        if (timestampStr.length >= 18) {
          // Already in nanoseconds (18-19 digits)
          timestampNs = BigInt(timestamp)
          console.log('Timestamp appears to be in nanoseconds already')
        } else if (timestampStr.length >= 15) {
          // Microseconds (15-16 digits), multiply by 1000
          timestampNs = BigInt(timestamp) * 1000n
          console.log('Converting from microseconds to nanoseconds')
        } else if (timestampStr.length >= 12) {
          // Milliseconds (13 digits), multiply by 1000000
          timestampNs = BigInt(timestamp) * 1000000n
          console.log('Converting from milliseconds to nanoseconds')
        } else {
          // Seconds, multiply by 1000000000
          timestampNs = BigInt(timestamp) * 1000000000n
          console.log('Converting from seconds to nanoseconds')
        }
        
        console.log('Original timestamp:', timestamp, 'Converted to nanoseconds:', timestampNs.toString())
        
        const result = await this.daoGovernanceActor.getUserVotingPowerAtTime(userPrincipal, timestampNs)
        console.log('Backend result:', result)
        
        if (result.ok !== undefined) {
          // Update fetched data
          const currentData = this.fetchedData.get(blockId) || {}
          this.fetchedData.set(blockId, { ...currentData, votingPower: Number(result.ok) })
          
          // Update state to loaded
          this.fetchStates.set(blockId, { ...currentState, votingPower: 'loaded' })
          
          // Update display text with formatted voting power
          const vp = Number(result.ok)
          const formattedVP = (vp / 100000000).toLocaleString(undefined, { maximumFractionDigits: 2 })
          this.votingPowerDisplays[blockId] = formattedVP + ' VP'
          
          console.log('Updated voting power display for block', blockId, 'to:', formattedVP + ' VP')
        } else {
          throw new Error(`Backend returned error: ${JSON.stringify(result.err) || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error fetching voting power:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          user: user,
          timestamp: timestamp,
          blockId: blockId
        })
        const currentState = this.fetchStates.get(blockId) || {}
        this.fetchStates.set(blockId, { ...currentState, votingPower: 'error' })
        
        // Update display text for error
        this.votingPowerDisplays[blockId] = 'Error'
      }
    },

    // Fetch previous allocation for a specific user before a specific timestamp
    async fetchPreviousAllocation(blockId, user, timestamp) {
      try {
        // Set loading state
        const currentState = this.fetchStates.get(blockId) || {}
        this.fetchStates.set(blockId, { ...currentState, previousAllocation: 'loading' })
        
        // Set loading display
        this.previousAllocationDisplays[blockId] = 'Fetching...'
        
        console.log('Fetching previous allocation for user:', user, 'before timestamp:', timestamp)
        
        // Get the current blocks from the block browser (more efficient than fetching all)
        const currentBlocks = this.blockBrowserBlocks || []
        console.log('Searching through', currentBlocks.length, 'blocks for previous allocations')
        console.log('Raw blockBrowserBlocks:', JSON.stringify(this.blockBrowserBlocks?.slice(0, 2), (key, value) => 
          typeof value === 'bigint' ? value.toString() + 'n' : value, 2))
        
        let previousAllocation = null
        let mostRecentTimestamp = -1
        
        // Parse blocks to find allocation changes for this user before the timestamp
        for (const block of currentBlocks) {
          try {
            // Check if this is an allocation change block
            if (block.block && typeof block.block === 'object') {
              const blockData = block.block
              
              console.log('Checking block ID:', block.id, 'structure:', Object.keys(blockData))
              console.log('Raw block data:', JSON.stringify(blockData, (key, value) => 
                typeof value === 'bigint' ? value.toString() + 'n' : value, 2))
              console.log('Full raw block:', JSON.stringify(block, (key, value) => 
                typeof value === 'bigint' ? value.toString() + 'n' : value, 2))
              
              // Parse ICRC3 Map structure
              let blockUser = null
              let blockTimestamp = 0
              let allocationData = null
              let isAllocationBlock = false
              
              // Handle nested Map structure from ICRC3
              if (blockData.Map && Array.isArray(blockData.Map)) {
                console.log('Parsing ICRC3 Map structure with', blockData.Map.length, 'entries')
                
                // Parse the top-level Map entries
                for (const [key, value] of blockData.Map) {
                  if (key === 'tx' && value.Map && Array.isArray(value.Map)) {
                    // Found tx entry, parse its Map
                    for (const [txKey, txValue] of value.Map) {
                      if (txKey === 'operation' && txValue.Text === '3allocation_change') {
                        isAllocationBlock = true
                        console.log('Found allocation change operation')
                      } else if (txKey === 'data' && txValue.Map && Array.isArray(txValue.Map)) {
                        // Found data entry, parse the data Map
                        const parsedData = {}
                        for (const [dataKey, dataValue] of txValue.Map) {
                          if (dataKey === 'user' && dataValue.Blob) {
                            // Convert Blob object to Uint8Array
                            const blobArray = Object.values(dataValue.Blob)
                            blockUser = Principal.fromUint8Array(new Uint8Array(blobArray)).toText()
                            parsedData.user = new Uint8Array(blobArray)
                            console.log('Parsed user:', blockUser)
                          } else if (dataKey === 'timestamp' && dataValue.Int) {
                            // Handle both string and BigInt forms
                            if (typeof dataValue.Int === 'string') {
                              blockTimestamp = Number(dataValue.Int.replace('n', ''))
                            } else {
                              blockTimestamp = Number(dataValue.Int)
                            }
                            parsedData.timestamp = blockTimestamp
                            console.log('Parsed timestamp:', blockTimestamp, 'from:', dataValue.Int)
                          } else if (dataKey === 'newAllocations' && dataValue.Array) {
                            // Parse newAllocations array
                            const newAllocations = dataValue.Array.map(allocMap => {
                              const alloc = {}
                              if (allocMap.Map) {
                                for (const [allocKey, allocValue] of allocMap.Map) {
                                  if (allocKey === 'token' && allocValue.Blob) {
                                    alloc.token = new Uint8Array(Object.values(allocValue.Blob))
                                  } else if (allocKey === 'basisPoints' && allocValue.Nat) {
                                    // Handle both string and BigInt forms
                                    if (typeof allocValue.Nat === 'string') {
                                      alloc.basisPoints = Number(allocValue.Nat.replace('n', ''))
                                    } else {
                                      alloc.basisPoints = Number(allocValue.Nat)
                                    }
                                  }
                                }
                              }
                              return alloc
                            })
                            parsedData.newAllocations = newAllocations
                            console.log('Parsed newAllocations:', newAllocations.length, 'items')
                          } else if (dataKey === 'oldAllocations' && dataValue.Array) {
                            // Parse oldAllocations array (similar to newAllocations)
                            const oldAllocations = dataValue.Array.map(allocMap => {
                              const alloc = {}
                              if (allocMap.Map) {
                                for (const [allocKey, allocValue] of allocMap.Map) {
                                  if (allocKey === 'token' && allocValue.Blob) {
                                    alloc.token = new Uint8Array(Object.values(allocValue.Blob))
                                  } else if (allocKey === 'basisPoints' && allocValue.Nat) {
                                    // Handle both string and BigInt forms
                                    if (typeof allocValue.Nat === 'string') {
                                      alloc.basisPoints = Number(allocValue.Nat.replace('n', ''))
                                    } else {
                                      alloc.basisPoints = Number(allocValue.Nat)
                                    }
                                  }
                                }
                              }
                              return alloc
                            })
                            parsedData.oldAllocations = oldAllocations
                          }
                        }
                        allocationData = parsedData
                      }
                    }
                  }
                }
                
                console.log('Parsed ICRC3 Map - user:', blockUser, 'timestamp:', blockTimestamp, 'isAllocation:', isAllocationBlock)
              } else {
                console.log('Unknown block structure, skipping')
              }
              
              if (blockUser === user && 
                  blockTimestamp < timestamp && 
                  blockTimestamp > mostRecentTimestamp &&
                  isAllocationBlock &&
                  allocationData && allocationData.newAllocations) {
                
                // Parse the allocation data - keep raw token data for proper formatting
                const newAllocations = allocationData.newAllocations?.map(alloc => ({
                  token: alloc.token, // Keep raw Uint8Array for token name lookup
                  basisPoints: Number(alloc.basisPoints)
                })) || []
                
                previousAllocation = {
                  id: Number(block.id || 0),
                  timestamp: blockTimestamp,
                  user: blockUser,
                  newAllocations,
                  oldAllocations: allocationData.oldAllocations?.map(alloc => ({
                    token: alloc.token, // Keep raw Uint8Array for token name lookup
                    basisPoints: Number(alloc.basisPoints)
                  })) || []
                }
                mostRecentTimestamp = blockTimestamp
              }
            }
          } catch (parseError) {
            console.warn('Error parsing block:', parseError)
            continue
          }
        }
        
        console.log('Found previous allocation:', previousAllocation)
        
        // Update fetched data
        const currentData = this.fetchedData.get(blockId) || {}
        this.fetchedData.set(blockId, { ...currentData, previousAllocation })
        
        // Update state to loaded
        this.fetchStates.set(blockId, { ...currentState, previousAllocation: 'loaded' })
        
        // Update reactive display (Vue 3 compatible)
        if (previousAllocation) {
          // Create detailed allocation breakdown
          // Note: allocation.token is now a raw Uint8Array, same as blue pills
          const allocDetails = previousAllocation.newAllocations.map(allocation => {
            const tokenName = this.formatTokenNameFromBlob(allocation.token)
            const percentage = (allocation.basisPoints / 100).toFixed(2)
            return `${tokenName}: ${percentage}%`
          }).join(', ')
          
          const date = new Date(previousAllocation.timestamp / 1000000).toLocaleDateString()
          const displayText = `Found from ${date}: ${allocDetails}`
          this.previousAllocationDisplays[blockId] = displayText
        } else {
          this.previousAllocationDisplays[blockId] = 'No previous allocation found'
        }
      } catch (error) {
        console.error('Error fetching previous allocation:', error)
        const currentState = this.fetchStates.get(blockId) || {}
        this.fetchStates.set(blockId, { ...currentState, previousAllocation: 'error' })
        
        // Set error display
        this.previousAllocationDisplays[blockId] = 'Error'
      }
    },

    // Fetch all previous allocations for a specific user before a specific timestamp
    async fetchAllPreviousAllocations(blockId, user, timestamp) {
      try {
        // Set loading state
        const currentState = this.fetchStates.get(blockId) || {}
        this.fetchStates.set(blockId, { ...currentState, allPreviousAllocations: 'loading' })
        
        console.log('Fetching all previous allocations for user:', user, 'before timestamp:', timestamp)
        
        // Get the current blocks from the block browser
        const currentBlocks = this.blockBrowserBlocks || []
        const allPreviousAllocations = []
        
        // Parse blocks to find all allocation changes for this user before the timestamp
        for (const block of currentBlocks) {
          try {
            // Check if this is an allocation change block
            if (block.block && typeof block.block === 'object') {
              const blockData = block.block
              
              // Parse ICRC3 Map structure (same as single fetch)
              let blockUser = null
              let blockTimestamp = 0
              let allocationData = null
              let isAllocationBlock = false
              
              // Handle Map structure from ICRC3
              if (Array.isArray(blockData) && blockData.length > 0) {
                // This is a Map array structure
                for (const [key, value] of blockData) {
                  if (key === 'tx' && Array.isArray(value)) {
                    // Found tx entry, look for data and operation
                    for (const [txKey, txValue] of value) {
                      if (txKey === 'data' && Array.isArray(txValue)) {
                        // Found data entry
                        const parsedData = {}
                        for (const [dataKey, dataValue] of txValue) {
                          if (dataKey === 'user' && dataValue instanceof Uint8Array) {
                            blockUser = Principal.fromUint8Array(dataValue).toText()
                            parsedData.user = dataValue
                          } else if (dataKey === 'timestamp') {
                            blockTimestamp = Number(dataValue)
                            parsedData.timestamp = dataValue
                          } else if (dataKey === 'newAllocations') {
                            parsedData.newAllocations = dataValue
                          } else if (dataKey === 'oldAllocations') {
                            parsedData.oldAllocations = dataValue
                          }
                        }
                        allocationData = parsedData
                      } else if (txKey === 'operation' && txValue === '3allocation_change') {
                        isAllocationBlock = true
                      }
                    }
                  }
                }
              } else {
                // Fallback for non-Map structure
                blockUser = blockData.user ? Principal.fromUint8Array(new Uint8Array(blockData.user)).toText() : null
                blockTimestamp = blockData.timestamp ? Number(blockData.timestamp) : 0
                allocationData = blockData
              }
              
              if (blockUser === user && 
                  blockTimestamp < timestamp &&
                  isAllocationBlock &&
                  allocationData && allocationData.newAllocations) {
                
                // Parse the allocation data - keep raw token data for proper formatting
                const newAllocations = allocationData.newAllocations?.map(alloc => ({
                  token: alloc.token, // Keep raw Uint8Array for token name lookup
                  basisPoints: Number(alloc.basisPoints)
                })) || []
                
                const allocation = {
                  id: Number(block.id || 0),
                  timestamp: blockTimestamp,
                  user: blockUser,
                  newAllocations,
                  oldAllocations: allocationData.oldAllocations?.map(alloc => ({
                    token: alloc.token, // Keep raw Uint8Array for token name lookup
                    basisPoints: Number(alloc.basisPoints)
                  })) || []
                }
                allPreviousAllocations.push(allocation)
              }
            }
          } catch (parseError) {
            console.warn('Error parsing block:', parseError)
            continue
          }
        }
        
        // Sort by timestamp (oldest first)
        allPreviousAllocations.sort((a, b) => a.timestamp - b.timestamp)
        
        console.log('Found all previous allocations:', allPreviousAllocations)
        
        // Update fetched data
        const currentData = this.fetchedData.get(blockId) || {}
        this.fetchedData.set(blockId, { ...currentData, allPreviousAllocations })
        
        // Update state to loaded
        this.fetchStates.set(blockId, { ...currentState, allPreviousAllocations: 'loaded' })
      } catch (error) {
        console.error('Error fetching all previous allocations:', error)
        const currentState = this.fetchStates.get(blockId) || {}
        this.fetchStates.set(blockId, { ...currentState, allPreviousAllocations: 'error' })
      }
    },

    // Helper method to parse allocation change data from ICRC3 block
    parseAllocationChangeFromBlock(block) {
      try {
        // Check if this is an allocation change block
        if (!block.block || typeof block.block !== 'object') {
          return null
        }
        
        // The block structure should be a Map with allocation change data
        const blockData = block.block
        if (!blockData || !blockData.user || !blockData.newAllocations) {
          return null
        }
        
        // Extract user principal from blob
        const userPrincipal = this.formatPrincipalFromBlob(blockData.user)
        
        // Parse allocations
        const newAllocations = blockData.newAllocations?.map(alloc => ({
          token: this.formatPrincipalFromBlob(alloc.token),
          basisPoints: Number(alloc.basisPoints)
        })) || []
        
        const oldAllocations = blockData.oldAllocations?.map(alloc => ({
          token: this.formatPrincipalFromBlob(alloc.token),
          basisPoints: Number(alloc.basisPoints)
        })) || []
        
        return {
          id: Number(blockData.id),
          timestamp: Number(blockData.timestamp),
          user: userPrincipal,
          changeType: blockData.changeType,
          oldAllocations,
          newAllocations,
          votingPower: Number(blockData.votingPower || 0),
          maker: blockData.maker ? this.formatPrincipalFromBlob(blockData.maker) : null,
          reason: blockData.reason || null
        }
      } catch (error) {
        console.error('Error parsing allocation change block:', error)
        return null
      }
    },

    // Handle clicks on fetch buttons using event delegation
    handleFetchButtonClick(event) {
      const button = event.target.closest('[data-action]')
      if (!button) return
      
      const action = button.dataset.action
      const blockId = button.dataset.blockId
      const userId = button.dataset.userId
      const timestamp = parseInt(button.dataset.timestamp)
      
      switch (action) {
        case 'fetchVP':
          this.fetchVotingPower(blockId, userId, timestamp)
          break
        case 'fetchPrevious':
          this.fetchPreviousAllocation(blockId, userId, timestamp)
          break
        case 'fetchAll':
          this.fetchAllPreviousAllocations(blockId, userId, timestamp)
          break
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