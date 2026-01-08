<template>
  <div class="standard-view">
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🚨" title="Price Failsafe Admin" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Quick Navigation -->
          <div class="mb-4">
            <div class="d-flex gap-3">
              <router-link to="/admin" class="btn btn-secondary">
                ← Back to Admin Panel
              </router-link>
              <router-link to="/admin/trade" class="btn btn-info">
                📈 View Trading Logs
              </router-link>
              <router-link to="/admin/pricehistory" class="btn btn-primary">
                📊 Price History
              </router-link>
            </div>
          </div>

          <!-- Trigger Conditions Management -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Price Trigger Conditions</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="refreshConditions">
                  🔄 Refresh
                </button>
                <button class="btn btn-success" @click="showAddModal = true">
                  ➕ Add Condition
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div v-if="loadingConditions" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              
              <div v-else-if="conditions.length === 0" class="text-center text-muted">
                No trigger conditions configured
              </div>
              
              <div v-else class="conditions-list">
                <div v-for="condition in conditions" :key="Number(condition.id)" class="condition-card mb-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="condition-info">
                      <h5 class="mb-2">
                        {{ condition.name }}
                        <span v-if="!condition.isActive" class="badge bg-secondary ms-2">Inactive</span>
                        <span v-else class="badge bg-success ms-2">Active</span>
                      </h5>
                      <div class="condition-details">
                        <div><strong>Direction:</strong> {{ condition.direction.Up !== undefined ? '📈 Up' : '📉 Down' }}</div>
                        <div><strong>Threshold:</strong> {{ condition.percentage.toFixed(1) }}%</div>
                        <div><strong>Time Window:</strong> {{ formatTimeWindow(condition.timeWindowNS) }}</div>
                        <div><strong>Applies to:</strong>
                          <span v-if="!condition.applicableTokens || condition.applicableTokens.length === 0">All tokens</span>
                          <span v-else>{{ condition.applicableTokens.length }} specific token(s)</span>
                        </div>
                        <div class="text-muted small">
                          Created: {{ formatTimestamp(condition.createdAt) }}
                        </div>
                      </div>
                    </div>
                    <div class="condition-actions d-flex gap-2">
                      <button 
                        class="btn btn-sm" 
                        :class="condition.isActive ? 'btn-secondary' : 'btn-success'"
                        @click="toggleActive(Number(condition.id), !condition.isActive)">
                        {{ condition.isActive ? '⏸️' : '▶️' }}
                      </button>
                      <button 
                        class="btn btn-sm btn-danger" 
                        @click="deleteCondition(Number(condition.id))">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Price Alerts Log -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Price Alert History</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="refreshAlerts">
                  🔄 Refresh
                </button>
                <button class="btn btn-warning" @click="clearAlerts">
                  🧹 Clear All
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div v-if="loadingAlerts" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              
              <div v-else-if="alerts.length === 0" class="text-center text-muted">
                No price alerts triggered yet
              </div>
              
              <div v-else class="alerts-list">
                <div v-for="alert in alerts" :key="Number(alert.id)" class="alert-card mb-3">
                  <div class="alert-info">
                    <h6 class="mb-2">
                      🚨 {{ alert.triggeredCondition.name }}
                      <span class="badge bg-danger ms-2">{{ alert.triggeredCondition.direction.Up !== undefined ? '📈' : '📉' }} {{ (alert.priceData.actualChangePercent).toFixed(2) }}%</span>
                    </h6>
                    <div class="alert-details">
                      <div><strong>Token:</strong> {{ getTokenSymbol(alert.token) }}</div>
                      <div><strong>Triggered:</strong> {{ formatTimestamp(alert.timestamp) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trading Pauses Management -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Trading Pauses</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="refreshTradingPauses">
                  🔄 Refresh
                </button>
                <button class="btn btn-success" @click="showManualPauseModal = true">
                  ⏸️ Manual Pause
                </button>
                <button class="btn btn-danger" @click="clearAllTradingPauses" v-if="tradingPauses.length > 0">
                  🧹 Clear All
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div v-if="loadingTradingPauses" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              
              <div v-else-if="tradingPauses.length === 0" class="text-center text-muted">
                No tokens currently paused from trading
              </div>
              
              <div v-else class="trading-pauses-list">
                <div v-for="pause in tradingPauses" :key="pause.token.toString()" class="pause-card mb-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="pause-info">
                      <h6 class="mb-2">
                        ⏸️ {{ pause.tokenSymbol }}
                        <span class="badge ms-2" :class="getPauseReasonBadgeClass(pause.reason)">
                          {{ getPauseReasonText(pause.reason) }}
                        </span>
                      </h6>
                      <div class="pause-details">
                        <div><strong>Token:</strong> {{ getTokenSymbol(pause.token) }}</div>
                        <div><strong>Paused:</strong> {{ formatTimestamp(pause.pausedAt) }}</div>
                        <div><strong>Duration:</strong> {{ getPauseDuration(pause.pausedAt) }}</div>
                        <div v-if="pause.reason.PriceAlert">
                          <strong>Condition:</strong> {{ pause.reason.PriceAlert.conditionName }}
                          <br><strong>Alert ID:</strong> {{ pause.reason.PriceAlert.alertId }}
                        </div>
                        <div v-if="pause.reason.CircuitBreaker">
                          <strong>Reason:</strong> {{ pause.reason.CircuitBreaker.reason }}
                          <br><strong>Severity:</strong> {{ pause.reason.CircuitBreaker.severity }}
                        </div>
                      </div>
                    </div>
                    <div class="pause-actions">
                      <button 
                        class="btn btn-sm btn-success" 
                        @click="unpauseToken(pause.token)">
                        ▶️ Unpause
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Portfolio Circuit Breakers Management -->
    <div class="card bg-dark text-white mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="mb-0">Portfolio Circuit Breakers</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="refreshPortfolioConditions">
            🔄 Refresh
          </button>
          <button class="btn btn-success" @click="showAddPortfolioModal = true">
            ➕ Add Portfolio Condition
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="loadingPortfolioConditions" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="portfolioConditions.length === 0" class="text-center text-muted">
          No portfolio circuit breaker conditions configured
        </div>
        
        <div v-else class="conditions-list">
          <div v-for="condition in portfolioConditions" :key="Number(condition.id)" class="condition-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div class="condition-info">
                <h5 class="mb-2">
                  {{ condition.name }}
                  <span v-if="!condition.isActive" class="badge bg-secondary ms-2">Inactive</span>
                  <span v-else class="badge bg-success ms-2">Active</span>
                </h5>
                <div class="condition-details">
                  <div><strong>Direction:</strong> {{ condition.direction.Up !== undefined ? '📈 Up' : '📉 Down' }}</div>
                  <div><strong>Threshold:</strong> {{ condition.percentage.toFixed(1) }}%</div>
                  <div><strong>Value Type:</strong> {{ condition.valueType.ICP !== undefined ? 'ICP' : 'USD' }}</div>
                  <div><strong>Time Window:</strong> {{ formatTimeWindow(condition.timeWindowNS) }}</div>
                  <div class="text-muted small">
                    Created: {{ formatTimestamp(condition.createdAt) }}
                  </div>
                </div>
              </div>
              <div class="condition-actions d-flex gap-2">
                <button 
                  class="btn btn-sm" 
                  :class="condition.isActive ? 'btn-secondary' : 'btn-success'"
                  @click="togglePortfolioActive(Number(condition.id), !condition.isActive)">
                  {{ condition.isActive ? '⏸️' : '▶️' }}
                </button>
                <button 
                  class="btn btn-sm btn-danger" 
                  @click="deletePortfolioCondition(Number(condition.id))">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Circuit Breaker Logs -->
    <div class="card bg-dark text-white mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="mb-0">Portfolio Circuit Breaker History</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="refreshPortfolioLogs">
            🔄 Refresh
          </button>
          <button class="btn btn-warning" @click="clearPortfolioLogs">
            🧹 Clear All
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="loadingPortfolioLogs" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="portfolioLogs.length === 0" class="text-center text-muted">
          No portfolio circuit breakers triggered yet
        </div>
        
        <div v-else class="alerts-list">
          <div v-for="log in portfolioLogs" :key="Number(log.id)" class="alert-card mb-3">
            <div class="alert-info">
              <h6 class="mb-2">
                🔥 {{ log.triggeredCondition.name }}
                <span class="badge bg-danger ms-2">{{ log.triggeredCondition.direction.Up !== undefined ? '📈' : '📉' }} {{ (log.portfolioData.actualChangePercent).toFixed(2) }}%</span>
              </h6>
              <div class="alert-details">
                <div><strong>Value Type:</strong> {{ log.triggeredCondition.valueType.ICP !== undefined ? 'ICP' : 'USD' }}</div>
                <div><strong>Triggered:</strong> {{ formatTimestamp(log.timestamp) }}</div>
                <div><strong>Current Value:</strong> {{ formatPortfolioValue(log.portfolioData.currentValue, log.triggeredCondition.valueType) }}</div>
                <div><strong>Min Value:</strong> {{ formatPortfolioValue(log.portfolioData.minValueInWindow, log.triggeredCondition.valueType) }}</div>
                <div><strong>Max Value:</strong> {{ formatPortfolioValue(log.portfolioData.maxValueInWindow, log.triggeredCondition.valueType) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Condition Modal -->
    <div v-if="showAddModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content bg-dark text-white">
          <div class="modal-header">
            <h5 class="modal-title">Add Trigger Condition</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitCondition">
              <div class="mb-3">
                <label class="form-label">Condition Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newCondition.name" 
                  required 
                  placeholder="e.g., High Volatility Alert">
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Price Direction</label>
                    <select class="form-select" v-model="newCondition.direction" required>
                      <option value="Up">📈 Up (Price Increase)</option>
                      <option value="Down">📉 Down (Price Decrease)</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Threshold Percentage</label>
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model="newCondition.percentage" 
                        required 
                        min="0.1" 
                        max="1000" 
                        step="0.1"
                        placeholder="20.0">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Time Window</label>
                <div class="row">
                  <div class="col-md-8">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="newCondition.timeValue" 
                      required 
                      min="1" 
                      placeholder="2">
                  </div>
                  <div class="col-md-4">
                    <select class="form-select" v-model="newCondition.timeUnit" required>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Applicable Tokens</label>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="tokenScope" 
                    value="all" 
                    v-model="newCondition.tokenScope">
                  <label class="form-check-label">
                    Apply to all tokens
                  </label>
                </div>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="tokenScope" 
                    value="specific" 
                    v-model="newCondition.tokenScope">
                  <label class="form-check-label">
                    Apply to specific tokens only
                  </label>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  {{ submitting ? 'Saving...' : 'Add Condition' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Pause Modal -->
    <div v-if="showManualPauseModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content bg-dark text-white">
          <div class="modal-header">
            <h5 class="modal-title">Manual Trading Pause</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeManualPauseModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitManualPause">
              <div class="mb-3">
                <label class="form-label">Token Principal</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="manualPauseForm.tokenPrincipal" 
                  required 
                  placeholder="rdmx6-jaaaa-aaaah-qcaiq-cai">
                <small class="text-muted">Enter the principal ID of the token to pause</small>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Reason</label>
                <textarea 
                  class="form-control" 
                  v-model="manualPauseForm.reason" 
                  required 
                  rows="3"
                  placeholder="Explain why this token should be paused from trading..."></textarea>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="closeManualPauseModal">Cancel</button>
                <button type="submit" class="btn btn-danger" :disabled="submittingPause">
                  {{ submittingPause ? 'Pausing...' : 'Pause Token' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Portfolio Condition Modal -->
    <div v-if="showAddPortfolioModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content bg-dark text-white">
          <div class="modal-header">
            <h5 class="modal-title">Add Portfolio Circuit Breaker</h5>
            <button type="button" class="btn-close btn-close-white" @click="closePortfolioModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitPortfolioCondition">
              <div class="mb-3">
                <label class="form-label">Condition Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newPortfolioCondition.name" 
                  required 
                  placeholder="e.g., Portfolio Crash Protection">
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Portfolio Direction</label>
                    <select class="form-select" v-model="newPortfolioCondition.direction" required>
                      <option value="Up">📈 Up (Portfolio Increase)</option>
                      <option value="Down">📉 Down (Portfolio Decrease)</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Threshold Percentage</label>
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model="newPortfolioCondition.percentage" 
                        required 
                        min="0.1" 
                        max="1000" 
                        step="0.1"
                        placeholder="20.0">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Value Type</label>
                    <select class="form-select" v-model="newPortfolioCondition.valueType" required>
                      <option value="ICP">🪙 ICP</option>
                      <option value="USD">💵 USD</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Time Window</label>
                    <div class="row">
                      <div class="col-8">
                        <input 
                          type="number" 
                          class="form-control" 
                          v-model="newPortfolioCondition.timeValue" 
                          required 
                          min="1" 
                          placeholder="2">
                      </div>
                      <div class="col-4">
                        <select class="form-select" v-model="newPortfolioCondition.timeUnit" required>
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="closePortfolioModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="submittingPortfolio">
                  {{ submittingPortfolio ? 'Saving...' : 'Add Portfolio Condition' }}
                </button>
              </div>
            </form>
          </div>
        </div>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import TacoTitle from '../components/misc/TacoTitle.vue'
import AdminConfirmationModal from '../components/admin/AdminConfirmationModal.vue'
import GNSFProposalDialog from '../components/proposals/GNSFProposalDialog.vue'
import { useAdminCheck } from '../composables/useAdminCheck'
import { Principal } from '@dfinity/principal'
import * as workerBridge from '../stores/worker-bridge'

interface PriceDirection {
  Up?: null;
  Down?: null;
}

interface TriggerCondition {
  id: bigint;
  name: string;
  direction: PriceDirection;
  percentage: number;
  timeWindowNS: bigint;
  applicableTokens: any[];
  isActive: boolean;
  createdAt: bigint;
  createdBy: any;
}

interface TriggerPriceData {
  currentPrice: bigint;
  minPriceInWindow: bigint;
  maxPriceInWindow: bigint;
  windowStartTime: bigint;
  actualChangePercent: number;
  changeType: any;
}

interface PriceAlertLog {
  id: bigint;
  timestamp: bigint;
  token: any;
  tokenSymbol: string;
  triggeredCondition: TriggerCondition;
  priceData: TriggerPriceData;
}

const store = useTacoStore()

// Extract cached refs from store for reactive binding
const {
  cachedPriceAlerts,
  cachedTradingPauses,
  cachedCircuitBreakerConditions,
  cachedPortfolioCircuitBreakerConditions,
  cachedCircuitBreakerLogs
} = storeToRefs(store)

// Admin check
const { isAdmin, checking, checkAdminStatus } = useAdminCheck()

// GNSF Proposal Dialog state
const showProposalDialog = ref(false)
const proposalFunctionName = ref('')
const proposalReasonPlaceholder = ref('')
const proposalContextParams = ref<any>({})

// State - initialize from cache if available for instant display on navigation
const conditions = ref<TriggerCondition[]>(cachedCircuitBreakerConditions.value || [])
const alerts = ref<PriceAlertLog[]>(cachedPriceAlerts.value?.alerts || [])
const tradingPauses = ref<any[]>(cachedTradingPauses.value?.pausedTokens || [])
const portfolioConditions = ref<any[]>(cachedPortfolioCircuitBreakerConditions.value || [])
const portfolioLogs = ref<any[]>(cachedCircuitBreakerLogs.value || [])
// Only show loading if no cached data
const loadingConditions = ref(!cachedCircuitBreakerConditions.value)
const loadingAlerts = ref(!cachedPriceAlerts.value)
const loadingTradingPauses = ref(!cachedTradingPauses.value)
const loadingPortfolioConditions = ref(!cachedPortfolioCircuitBreakerConditions.value)
const loadingPortfolioLogs = ref(!cachedCircuitBreakerLogs.value)
const submitting = ref(false)
const submittingPause = ref(false)
const submittingPortfolio = ref(false)

// Modal state
const showAddModal = ref(false)
const showManualPauseModal = ref(false)
const showAddPortfolioModal = ref(false)

// Confirmation modal state
const confirmationModal = ref<{
  show: boolean
  title: string
  message: string
  extraData: string
  confirmButtonText: string
  confirmButtonClass: string
  reasonPlaceholder: string
  submitting: boolean
  action: (() => Promise<void>) | null
  actionData: { type: string; token?: any; tokenSymbol?: string } | null
}>({
  show: false,
  title: '',
  message: '',
  extraData: '',
  confirmButtonText: '',
  confirmButtonClass: '',
  reasonPlaceholder: '',
  submitting: false,
  action: null,
  actionData: null
})
const newCondition = ref({
  name: '',
  direction: 'Up',
  percentage: 20.0,
  timeValue: 2,
  timeUnit: 'hours',
  tokenScope: 'all'
})
const manualPauseForm = ref({
  tokenPrincipal: '',
  reason: ''
})
const newPortfolioCondition = ref({
  name: '',
  direction: 'Down',
  percentage: 20.0,
  timeValue: 2,
  timeUnit: 'hours',
  valueType: 'USD'
})

// Methods
const formatTimestamp = (timestamp: bigint) => {
  const milliseconds = Number(timestamp / BigInt(1_000_000))
  const date = new Date(milliseconds)
  return date.toLocaleString()
}

const formatTimeWindow = (timeWindowNS: bigint) => {
  const seconds = Number(timeWindowNS / BigInt(1_000_000_000))
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

const getTokenSymbol = (principal: any) => {
  return principal.toString().slice(0, 8) + '...'
}

// Refresh functions - use workers for non-blocking fetches
const refreshConditions = () => {
  console.log('AdminPriceView: Triggering worker refresh for conditions')
  loadingConditions.value = true
  workerBridge.fetch('circuitBreakerConditions', true)
}

const refreshAlerts = () => {
  console.log('AdminPriceView: Triggering worker refresh for alerts')
  loadingAlerts.value = true
  workerBridge.fetch('priceAlerts', true)
}

const toggleActive = async (id: number, isActive: boolean) => {
  // Check if user is admin
  await checkAdminStatus()
  
  // Find condition name for display
  const condition = conditions.value.find(c => Number(c.id) === id)
  const conditionName = condition?.name || `ID ${id}`
  
  if (isAdmin.value) {
    // Admin path - direct call
    try {
      await store.setTriggerConditionActive(id, isActive)
      await refreshConditions()
    } catch (error) {
      console.error('Failed to toggle condition:', error)
    }
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'setTriggerConditionActive'
    proposalReasonPlaceholder.value = `Please explain why the price trigger condition "${conditionName}" should be ${isActive ? 'activated' : 'deactivated'}...`
    proposalContextParams.value = {
      conditionId: BigInt(id),
      isActive: isActive
    }
    showProposalDialog.value = true
  }
}

const deleteCondition = async (id: number) => {
  // Check if user is admin
  await checkAdminStatus()
  
  // Find condition name for display
  const condition = conditions.value.find(c => Number(c.id) === id)
  const conditionName = condition?.name || `ID ${id}`
  
  if (isAdmin.value) {
    // Admin path - confirm and direct call
    if (!confirm('Are you sure you want to delete this condition?')) return
    
    try {
      await store.removeTriggerCondition(id)
      await refreshConditions()
    } catch (error) {
      console.error('Failed to delete condition:', error)
    }
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'removeTriggerCondition'
    proposalReasonPlaceholder.value = `Please explain why the price trigger condition "${conditionName}" should be removed...`
    proposalContextParams.value = {
      conditionId: BigInt(id)
    }
    showProposalDialog.value = true
  }
}

const clearAlerts = async () => {
  if (!confirm('Are you sure you want to clear all alerts?')) return
  
  try {
    await store.clearPriceAlerts()
    alerts.value = []
  } catch (error) {
    console.error('Failed to clear alerts:', error)
  }
}

const submitCondition = async () => {
  // Check if user is admin (await to ensure we have current status)
  await checkAdminStatus()
  
  // Capture form values before potentially closing modal
  const conditionName = newCondition.value.name
  const conditionDirection = newCondition.value.direction
  const conditionPercentage = newCondition.value.percentage
  const timeWindowNS = BigInt(newCondition.value.timeValue * getTimeMultiplier() * 1_000_000_000)
  const applicableTokens: any[] = [] // Empty array means all tokens
  const directionVariant = conditionDirection === 'Up' ? { Up: null } : { Down: null }
  
  if (isAdmin.value) {
    // Admin path - direct call
    submitting.value = true
    try {
      await store.addTriggerCondition(
        conditionName,
        conditionDirection,
        conditionPercentage,
        timeWindowNS,
        applicableTokens
      )
      
      await refreshConditions()
      closeModal()
    } catch (error) {
      console.error('Failed to add condition:', error)
    }
    submitting.value = false
  } else {
    // Non-admin path - show proposal dialog
    closeModal()
    proposalFunctionName.value = 'addTriggerCondition'
    proposalReasonPlaceholder.value = `Please explain why this price trigger condition "${conditionName}" should be added...`
    proposalContextParams.value = {
      name: conditionName,
      direction: directionVariant,
      percentage: conditionPercentage,
      timeWindowNS: timeWindowNS,
      applicableTokens: applicableTokens
    }
    showProposalDialog.value = true
  }
}

const getTimeMultiplier = () => {
  const multipliers: Record<string, number> = {
    minutes: 60,
    hours: 60 * 60,
    days: 60 * 60 * 24
  }
  return multipliers[newCondition.value.timeUnit]
}

const closeModal = () => {
  showAddModal.value = false
  newCondition.value = {
    name: '',
    direction: 'Up',
    percentage: 20.0,
    timeValue: 2,
    timeUnit: 'hours',
    tokenScope: 'all'
  }
}

// Trading pause functions - use worker for non-blocking fetch
const refreshTradingPauses = () => {
  console.log('AdminPriceView: Triggering worker refresh for trading pauses')
  loadingTradingPauses.value = true
  workerBridge.fetch('tradingPauses', true)
}

const unpauseToken = async (token: any) => {
  // Check if user is admin
  await checkAdminStatus()
  
  const tokenSymbol = getTokenSymbol(token)
  
  if (isAdmin.value) {
    // Admin path - show confirmation modal
    showUnpauseTokenConfirmation(token)
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'unpauseTokenFromTrading'
    proposalReasonPlaceholder.value = `Please explain why ${tokenSymbol} should be unpaused from trading...`
    proposalContextParams.value = {
      token: token
    }
    showProposalDialog.value = true
  }
}

const clearAllTradingPauses = async () => {
  // Check if user is admin
  await checkAdminStatus()
  
  if (isAdmin.value) {
    // Admin path - show confirmation modal
    showClearAllTradingPausesConfirmation()
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'clearAllTradingPauses'
    proposalReasonPlaceholder.value = `Please explain why all ${tradingPauses.value.length} trading pause(s) should be cleared...`
    proposalContextParams.value = {}
    showProposalDialog.value = true
  }
}

const getPauseReasonText = (reason: any) => {
  if (reason.PriceAlert) {
    return 'Price Alert'
  } else if (reason.CircuitBreaker) {
    return 'Circuit Breaker'
  }
  return 'Unknown'
}

const getPauseReasonBadgeClass = (reason: any) => {
  if (reason.PriceAlert) {
    return 'bg-warning'
  } else if (reason.CircuitBreaker) {
    return 'bg-danger'
  }
  return 'bg-secondary'
}

const getPauseDuration = (pausedAt: bigint) => {
  const now = Date.now()
  const pausedTime = Number(pausedAt / BigInt(1_000_000))
  const diffMs = now - pausedTime
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
  if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`
  return `${diffMinutes}m`
}

const submitManualPause = async () => {
  // Check if user is admin
  await checkAdminStatus()
  
  const tokenPrincipal = Principal.fromText(manualPauseForm.value.tokenPrincipal)
  const reason = manualPauseForm.value.reason
  
  if (isAdmin.value) {
    // Admin path - direct call
    submittingPause.value = true
    try {
      await store.pauseTokenFromTradingManual(tokenPrincipal, reason)
      await refreshTradingPauses()
      closeManualPauseModal()
    } catch (error) {
      console.error('Failed to pause token manually:', error)
    }
    submittingPause.value = false
  } else {
    // Non-admin path - show proposal dialog
    closeManualPauseModal()
    proposalFunctionName.value = 'pauseTokenFromTradingManual'
    proposalReasonPlaceholder.value = reason // Use the reason they already entered
    proposalContextParams.value = {
      token: tokenPrincipal,
      manualPauseReason: reason
    }
    showProposalDialog.value = true
  }
}

const closeManualPauseModal = () => {
  showManualPauseModal.value = false
  manualPauseForm.value = {
    tokenPrincipal: '',
    reason: ''
  }
}

// Portfolio circuit breaker functions - use workers for non-blocking fetches
const refreshPortfolioConditions = () => {
  console.log('AdminPriceView: Triggering worker refresh for portfolio conditions')
  loadingPortfolioConditions.value = true
  workerBridge.fetch('portfolioCircuitBreakerConditions', true)
}

const refreshPortfolioLogs = () => {
  console.log('AdminPriceView: Triggering worker refresh for portfolio logs')
  loadingPortfolioLogs.value = true
  workerBridge.fetch('circuitBreakerLogs', true)
}

const togglePortfolioActive = async (id: number, isActive: boolean) => {
  // Check if user is admin
  await checkAdminStatus()
  
  // Find condition name for display
  const condition = portfolioConditions.value.find((c: any) => Number(c.id) === id)
  const conditionName = condition?.name || `ID ${id}`
  
  if (isAdmin.value) {
    // Admin path - direct call
    try {
      await store.setPortfolioCircuitBreakerConditionActive(id, isActive)
      await refreshPortfolioConditions()
    } catch (error) {
      console.error('Failed to toggle portfolio condition:', error)
    }
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'setPortfolioCircuitBreakerConditionActive'
    proposalReasonPlaceholder.value = `Please explain why the portfolio circuit breaker "${conditionName}" should be ${isActive ? 'activated' : 'deactivated'}...`
    proposalContextParams.value = {
      conditionId: BigInt(id),
      isActive: isActive
    }
    showProposalDialog.value = true
  }
}

const deletePortfolioCondition = async (id: number) => {
  // Check if user is admin
  await checkAdminStatus()
  
  // Find condition name for display
  const condition = portfolioConditions.value.find((c: any) => Number(c.id) === id)
  const conditionName = condition?.name || `ID ${id}`
  
  if (isAdmin.value) {
    // Admin path - confirm and direct call
    if (!confirm('Are you sure you want to delete this portfolio condition?')) return
    
    try {
      await store.removePortfolioCircuitBreakerCondition(id)
      await refreshPortfolioConditions()
    } catch (error) {
      console.error('Failed to delete portfolio condition:', error)
    }
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'removePortfolioCircuitBreakerCondition'
    proposalReasonPlaceholder.value = `Please explain why the portfolio circuit breaker "${conditionName}" should be removed...`
    proposalContextParams.value = {
      conditionId: BigInt(id)
    }
    showProposalDialog.value = true
  }
}

const clearPortfolioLogs = async () => {
  if (!confirm('Are you sure you want to clear all portfolio circuit breaker logs?')) return
  
  try {
    await store.clearPortfolioCircuitBreakerLogs()
    portfolioLogs.value = []
  } catch (error) {
    console.error('Failed to clear portfolio logs:', error)
  }
}

const formatPortfolioValue = (value: number, valueType: any) => {
  if (valueType.ICP !== undefined) {
    return `${value.toFixed(2)} ICP`
  } else {
    return `$${value.toFixed(2)}`
  }
}

const submitPortfolioCondition = async () => {
  // Check if user is admin
  await checkAdminStatus()
  
  // Capture form values before potentially closing modal
  const conditionName = newPortfolioCondition.value.name
  const conditionDirection = newPortfolioCondition.value.direction
  const conditionPercentage = newPortfolioCondition.value.percentage
  const conditionValueType = newPortfolioCondition.value.valueType
  const timeWindowNS = BigInt(newPortfolioCondition.value.timeValue * getTimeMultiplier() * 1_000_000_000)
  const directionVariant = conditionDirection === 'Up' ? { Up: null } : { Down: null }
  const valueTypeVariant = conditionValueType === 'ICP' ? { ICP: null } : { USD: null }
  
  if (isAdmin.value) {
    // Admin path - direct call
    submittingPortfolio.value = true
    try {
      await store.addPortfolioCircuitBreakerCondition(
        conditionName,
        conditionDirection,
        conditionPercentage,
        timeWindowNS,
        conditionValueType
      )
      
      await refreshPortfolioConditions()
      closePortfolioModal()
    } catch (error) {
      console.error('Failed to add portfolio condition:', error)
    }
    submittingPortfolio.value = false
  } else {
    // Non-admin path - show proposal dialog
    closePortfolioModal()
    proposalFunctionName.value = 'addPortfolioCircuitBreakerCondition'
    proposalReasonPlaceholder.value = `Please explain why this portfolio circuit breaker "${conditionName}" should be added...`
    proposalContextParams.value = {
      name: conditionName,
      direction: directionVariant,
      percentage: conditionPercentage,
      timeWindowNS: timeWindowNS,
      valueType: valueTypeVariant
    }
    showProposalDialog.value = true
  }
}

const closePortfolioModal = () => {
  showAddPortfolioModal.value = false
  newPortfolioCondition.value = {
    name: '',
    direction: 'Down',
    percentage: 20.0,
    timeValue: 2,
    timeUnit: 'hours',
    valueType: 'USD'
  }
}

// Confirmation modal functions
const showUnpauseTokenConfirmation = (token: any) => {
  const tokenSymbol = getTokenSymbol(token)
  confirmationModal.value = {
    show: true,
    title: 'Unpause Token',
    message: `Are you sure you want to unpause ${tokenSymbol} from trading?`,
    extraData: 'This will allow the token to resume trading operations.',
    confirmButtonText: 'Unpause Token',
    confirmButtonClass: 'btn-success',
    reasonPlaceholder: 'Please explain why this token is being unpaused...',
    submitting: false,
    action: null,
    actionData: { type: 'unpauseToken', token, tokenSymbol }
  }
}

const showClearAllTradingPausesConfirmation = () => {
  confirmationModal.value = {
    show: true,
    title: 'Clear All Trading Pauses',
    message: 'Are you sure you want to clear ALL trading pauses?',
    extraData: `This will unpause ${tradingPauses.value.length} token(s) and allow them to resume trading.`,
    confirmButtonText: 'Clear All Pauses',
    confirmButtonClass: 'btn-danger',
    reasonPlaceholder: 'Please explain why all trading pauses are being cleared...',
    submitting: false,
    action: null,
    actionData: { type: 'clearAllTradingPauses' }
  }
}

const hideConfirmationModal = () => {
  confirmationModal.value.show = false
  confirmationModal.value.submitting = false
  confirmationModal.value.action = null
  confirmationModal.value.actionData = null
}

const handleConfirmAction = async (reason: string) => {
  if (!confirmationModal.value.actionData) return
  
  confirmationModal.value.submitting = true
  
  try {
    let success = false
    const actionData = confirmationModal.value.actionData as any
    
    if (actionData.type === 'unpauseToken') {
      // Handle unpause token
      await store.unpauseTokenFromTrading(actionData.token, reason)
      await refreshTradingPauses()
      console.log('Token unpaused successfully')
      success = true
    } else if (actionData.type === 'clearAllTradingPauses') {
      // Handle clear all trading pauses
      await store.clearAllTradingPauses(reason)
      tradingPauses.value = []
      console.log('All trading pauses cleared successfully')
      success = true
    }
    
    if (success) {
      console.log(`AdminPriceView: ${confirmationModal.value.title} completed successfully`)
      hideConfirmationModal()
    } else {
      console.error(`AdminPriceView: Failed to ${confirmationModal.value.title.toLowerCase()}`)
      confirmationModal.value.submitting = false
    }
  } catch (error) {
    console.error(`AdminPriceView: Error in ${confirmationModal.value.title}:`, error)
    confirmationModal.value.submitting = false
  }
}

// Handle successful proposal submission
const handleProposalSuccess = async () => {
  showProposalDialog.value = false
  proposalFunctionName.value = ''
  proposalReasonPlaceholder.value = ''
  proposalContextParams.value = {}
  console.log('AdminPriceView: Proposal submitted successfully')
}

// Watch cached data and sync to local refs
watch(cachedCircuitBreakerConditions, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    conditions.value = newVal || []
    loadingConditions.value = false
  }
}, { immediate: true })

watch(cachedPriceAlerts, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    alerts.value = newVal?.alerts || []
    loadingAlerts.value = false
  }
}, { immediate: true })

watch(cachedTradingPauses, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    tradingPauses.value = newVal?.pausedTokens || []
    loadingTradingPauses.value = false
  }
}, { immediate: true })

watch(cachedPortfolioCircuitBreakerConditions, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    portfolioConditions.value = newVal || []
    loadingPortfolioConditions.value = false
  }
}, { immediate: true })

watch(cachedCircuitBreakerLogs, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    portfolioLogs.value = newVal || []
    loadingPortfolioLogs.value = false
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Only set loading if data isn't already available from cache
  if (!cachedCircuitBreakerConditions.value) loadingConditions.value = true
  if (!cachedPriceAlerts.value) loadingAlerts.value = true
  if (!cachedTradingPauses.value) loadingTradingPauses.value = true
  if (!cachedPortfolioCircuitBreakerConditions.value) loadingPortfolioConditions.value = true
  if (!cachedCircuitBreakerLogs.value) loadingPortfolioLogs.value = true

  // Check admin status in background (don't block data loading or navigation)
  checkAdminStatus().catch(console.error)

  // Trigger worker fetches for data needed by this view
  // Workers will update cached refs, which watchers will sync to local refs
  workerBridge.fetch('circuitBreakerConditions', false)
  workerBridge.fetch('priceAlerts', false)
  workerBridge.fetch('tradingPauses', false)
  workerBridge.fetch('portfolioCircuitBreakerConditions', false)
  workerBridge.fetch('circuitBreakerLogs', false)

  // Fallback: clear loading states after 10 seconds if data never arrives
  setTimeout(() => {
    loadingConditions.value = false
    loadingAlerts.value = false
    loadingTradingPauses.value = false
    loadingPortfolioConditions.value = false
    loadingPortfolioLogs.value = false
  }, 10000)
})
</script>

<style scoped>
.condition-card, .alert-card, .pause-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.condition-details, .alert-details, .pause-details {
  font-size: 0.9em;
  line-height: 1.4;
}

.condition-details > div, .alert-details > div, .pause-details > div {
  margin-bottom: 0.25rem;
}

.form-control, .form-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.form-control:focus, .form-select:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}

.form-control:focus, .form-select:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: #ffc107;
  color: white;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
}

.modal-content {
  border: none;
}
</style> 