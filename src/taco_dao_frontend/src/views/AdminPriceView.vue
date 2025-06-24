<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
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
                        <div><strong>Threshold:</strong> {{ (condition.percentage * 100).toFixed(1) }}%</div>
                        <div><strong>Time Window:</strong> {{ formatTimeWindow(condition.timeWindowNS) }}</div>
                        <div><strong>Applies to:</strong> 
                          <span v-if="condition.applicableTokens.length === 0">All tokens</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'

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

// State
const conditions = ref<TriggerCondition[]>([])
const alerts = ref<PriceAlertLog[]>([])
const loadingConditions = ref(false)
const loadingAlerts = ref(false)
const submitting = ref(false)

// Modal state
const showAddModal = ref(false)
const newCondition = ref({
  name: '',
  direction: 'Up',
  percentage: 20.0,
  timeValue: 2,
  timeUnit: 'hours',
  tokenScope: 'all'
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

const refreshConditions = async () => {
  loadingConditions.value = true
  try {
    const result = await store.listTriggerConditions()
    conditions.value = result
  } catch (error) {
    console.error('Failed to fetch conditions:', error)
  }
  loadingConditions.value = false
}

const refreshAlerts = async () => {
  loadingAlerts.value = true
  try {
    const result = await store.getPriceAlerts(0, 50)
    alerts.value = result.alerts
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  }
  loadingAlerts.value = false
}

const toggleActive = async (id: number, isActive: boolean) => {
  try {
    await store.setTriggerConditionActive(id, isActive)
    await refreshConditions()
  } catch (error) {
    console.error('Failed to toggle condition:', error)
  }
}

const deleteCondition = async (id: number) => {
  if (!confirm('Are you sure you want to delete this condition?')) return
  
  try {
    await store.removeTriggerCondition(id)
    await refreshConditions()
  } catch (error) {
    console.error('Failed to delete condition:', error)
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
  submitting.value = true
  try {
    const timeWindowNS = BigInt(newCondition.value.timeValue * getTimeMultiplier() * 1_000_000_000)
    const applicableTokens: any[] = [] // Empty array means all tokens
    
    await store.addTriggerCondition(
      newCondition.value.name,
      newCondition.value.direction,
      newCondition.value.percentage / 100,
      timeWindowNS,
      applicableTokens
    )
    
    await refreshConditions()
    closeModal()
  } catch (error) {
    console.error('Failed to add condition:', error)
  }
  submitting.value = false
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

// Lifecycle
onMounted(async () => {
  await refreshConditions()
  await refreshAlerts()
})
</script>

<style scoped>
.condition-card, .alert-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.condition-details, .alert-details {
  font-size: 0.9em;
  line-height: 1.4;
}

.condition-details > div, .alert-details > div {
  margin-bottom: 0.25rem;
}

.form-control, .form-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
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