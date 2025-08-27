<template>
  <div class="standard-view">
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🚨" title="Alarm Management" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Back to Admin Button -->
          <div class="mb-3">
            <router-link to="/admin" class="btn btn-secondary">
              ← Back to Admin Panel
            </router-link>
          </div>

          <!-- System Status Overview -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">System Health</h3>
              <div class="d-flex gap-2">
                <button @click="performSystemHealthCheck" :disabled="loading" class="btn btn-primary">
                  {{ loading ? 'Checking...' : 'Run Health Check' }}
                </button>
                <button @click="refreshSystemStatus" class="btn btn-secondary">Refresh Status</button>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 mb-2">
                  <strong>Monitoring Status:</strong>
                  <span :class="systemStatus.enabled ? 'text-success' : 'text-warning'">
                    {{ systemStatus.enabled ? 'Active' : 'Disabled' }}
                  </span>
                </div>
                <div class="col-md-3 mb-2">
                  <strong>Pending Alarms:</strong>
                  <span class="text-info">{{ systemStatus.pendingAlarmsCount || 0 }}</span>
                </div>
                <div class="col-md-3 mb-2">
                  <strong>SMS Queue:</strong>
                  <span class="text-info">{{ systemStatus.smsQueueSize || 0 }}</span>
                </div>
                <div class="col-md-3 mb-2">
                  <strong>Email Queue:</strong>
                  <span class="text-info">{{ systemStatus.emailQueueSize || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Admin Management -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Admin Management</h3>
            </div>
            <div class="card-body">
              <div class="input-group mb-3">
                <input 
                  v-model="newAdminPrincipal" 
                  type="text" 
                  class="form-control"
                  placeholder="Enter principal ID"
                />
                <button @click="addAdmin" :disabled="!newAdminPrincipal || loading" class="btn btn-primary">
                  Add Admin
                </button>
              </div>
            </div>
          </div>

          <!-- Contact Management -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Contact Management</h3>
            </div>
            <div class="card-body">
              <!-- Add Contact Form -->
              <div class="border rounded p-3 mb-3">
                <h5>Add New Contact</h5>
                <div class="row">
                  <div class="col-md-3">
                    <input 
                      v-model="newContact.name" 
                      type="text" 
                      class="form-control mb-2"
                      placeholder="Contact name"
                    />
                  </div>
                  <div class="col-md-2">
                    <select v-model="newContact.type" class="form-select mb-2">
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <input 
                      v-model="newContact.value" 
                      :type="newContact.type === 'Email' ? 'email' : 'tel'"
                      class="form-control mb-2"
                      :placeholder="newContact.type === 'Email' ? 'user@example.com' : '+1234567890'"
                    />
                  </div>
                  <div class="col-md-3">
                    <button @click="addContact" :disabled="!isContactValid || loading" class="btn btn-success">
                      Add Contact
                    </button>
                  </div>
                </div>
              </div>

              <!-- Contacts List -->
              <div v-if="contacts.length > 0">
                <h5>Existing Contacts</h5>
                <div class="table-responsive">
                  <table class="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Contact Info</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="contact in contacts" :key="contact.id">
                        <td>{{ contact.id }}</td>
                        <td>{{ contact.name }}</td>
                        <td>
                          <span class="badge" :class="getContactTypeFromVariant(contact.contactType) === 'Email' ? 'bg-info' : 'bg-warning'">
                            {{ getContactTypeFromVariant(contact.contactType) }}
                          </span>
                        </td>
                        <td>{{ getContactValueFromVariant(contact.contactType) }}</td>
                        <td>
                          <span class="badge" :class="contact.active ? 'bg-success' : 'bg-danger'">
                            {{ contact.active ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button 
                              @click="toggleContactStatus(contact.id, !contact.active)"
                              :class="contact.active ? 'btn btn-outline-warning' : 'btn btn-outline-success'"
                            >
                              {{ contact.active ? 'Disable' : 'Enable' }}
                            </button>
                            <button 
                              @click="testContact(contact, getContactTypeFromVariant(contact.contactType).toLowerCase() as 'email' | 'sms')" 
                              :class="getContactTypeFromVariant(contact.contactType) === 'Email' ? 'btn btn-outline-primary' : 'btn btn-outline-warning'"
                              :title="'Test ' + getContactTypeFromVariant(contact.contactType)"
                            >
                              {{ getContactTypeFromVariant(contact.contactType) === 'Email' ? '📧' : '📱' }} Test
                            </button>
                            <button @click="removeContact(contact.id)" class="btn btn-outline-danger">Remove</button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Alarms -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Pending Level 2 Alarms</h3>
              <button @click="fetchPendingAlarms" class="btn btn-secondary">Refresh</button>
            </div>
            <div class="card-body">
              <div v-if="pendingAlarms.length === 0" class="text-center py-3">
                <p class="mb-0">No pending alarms requiring acknowledgment</p>
              </div>
              
              <div v-else>
                <div v-for="alarm in pendingAlarms" :key="alarm.id" class="border rounded p-3 mb-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>Alarm ID: {{ alarm.id }}</strong>
                      <span class="badge ms-2" :class="alarm.importanceLevel.Level1Immediate !== undefined ? 'bg-danger' : 'bg-warning'">
                        {{ formatImportanceLevel(alarm.importanceLevel) }}
                      </span>
                    </div>
                    <small class="text-muted">{{ formatTimestamp(alarm.emailSentAt?.[0]) }}</small>
                  </div>
                  <div class="mb-2">{{ alarm.message }}</div>
                  <div class="d-flex justify-content-between align-items-center">
                    <button 
                      @click="acknowledgeAlarm(alarm.id)" 
                      class="btn btn-primary"
                      :disabled="loading"
                    >
                      Acknowledge
                    </button>
                    <div v-if="alarm.smsPendingAt?.[0]" class="text-warning">
                      SMS will be sent in: {{ formatTimeRemaining(alarm.smsPendingAt[0]) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- System Errors -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">System Errors</h3>
              <div class="d-flex gap-2">
                <select v-model="errorLimit" class="form-select form-select-sm" style="width: auto;">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <button @click="fetchSystemErrors" class="btn btn-secondary">Refresh</button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="systemErrors.length === 0" class="text-center py-3">
                <p class="mb-0">No system errors found</p>
              </div>
              
              <div v-else>
                <div v-for="error in systemErrors" :key="error.id" class="border rounded p-3 mb-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>Error ID: {{ error.id }}</strong>
                      <span class="badge bg-info ms-2">{{ formatErrorType(error.errorType) }}</span>
                      <span class="badge ms-2" :class="error.resolved ? 'bg-success' : 'bg-danger'">
                        {{ error.resolved ? 'Resolved' : 'Unresolved' }}
                      </span>
                    </div>
                    <small class="text-muted">{{ formatTimestamp(error.timestamp) }}</small>
                  </div>
                  <div class="mb-2">{{ error.errorMessage }}</div>
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">Retries: {{ error.retryAttempts }}</small>
                    <button 
                      v-if="!error.resolved"
                      @click="resolveError(error.id)" 
                      class="btn btn-sm btn-success"
                      :disabled="loading"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Queue Status -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Queue Status</h3>
              <button @click="fetchQueueStatus" class="btn btn-secondary">Refresh</button>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <strong>SMS Queue Size:</strong>
                  <span class="text-info ms-2">{{ queueStatus.smsQueueSize || 0 }}</span>
                </div>
                <div class="col-md-4">
                  <strong>Email Queue Size:</strong>
                  <span class="text-info ms-2">{{ queueStatus.emailQueueSize || 0 }}</span>
                </div>
                <div class="col-md-4">
                  <strong>Processing Interval:</strong>
                  <span class="text-info ms-2">{{ queueStatus.processingIntervalMinutes || 0 }} min</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sent Messages History -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Sent Messages History</h3>
              <div class="d-flex gap-2">
                <select v-model="messageFilter" class="form-select form-select-sm">
                  <option value="all">All Messages</option>
                  <option value="sms">SMS Only</option>
                  <option value="email">Email Only</option>
                </select>
                <button @click="fetchSentMessages" class="btn btn-secondary">Refresh</button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="sentMessages.length === 0" class="text-center py-3">
                <p class="mb-0">No sent messages found</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Contact</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="message in sentMessages" :key="message.id">
                      <td>{{ message.id }}</td>
                      <td>
                        <span class="badge" :class="message.messageType?.SMS !== undefined ? 'bg-warning' : 'bg-info'">
                          {{ message.messageType?.SMS !== undefined ? 'SMS' : 'Email' }}
                        </span>
                      </td>
                      <td>{{ message.contactInfo }}</td>
                      <td class="text-truncate" style="max-width: 200px;">{{ message.message }}</td>
                      <td>
                        <span class="badge" :class="message.success ? 'bg-success' : 'bg-danger'">
                          {{ message.success ? 'Sent' : 'Failed' }}
                        </span>
                      </td>
                      <td>{{ formatTimestamp(message.sentAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Alarm Acknowledgments -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Alarm Acknowledgments</h3>
              <button @click="fetchAlarmAcknowledgments" class="btn btn-secondary">Refresh</button>
            </div>
            <div class="card-body">
              <div v-if="alarmAcknowledgments.length === 0" class="text-center py-3">
                <p class="mb-0">No alarm acknowledgments found</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Alarm ID</th>
                      <th>Acknowledged By</th>
                      <th>Acknowledged At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ack in alarmAcknowledgments" :key="ack.alarmId">
                      <td>{{ ack.alarmId }}</td>
                      <td>{{ formatCanisterId(ack.acknowledgedBy) }}</td>
                      <td>{{ formatTimestamp(ack.acknowledgedAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card bg-dark text-white mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0">Admin Action Logs</h3>
            <div class="d-flex gap-2">
              <select v-model="logLimit" class="form-select form-select-sm" style="width: auto;">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <button @click="fetchAdminActionLogs" class="btn btn-secondary">Refresh</button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="adminActionLogs.length === 0" class="text-center py-3">
              <p class="mb-0">No admin action logs found</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-dark table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Timestamp</th>
                    <th>Caller</th>
                    <th>Action</th>
                    <th>Parameters</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in adminActionLogs" :key="String(log.id)">
                    <td>{{ log.id }}</td>
                    <td>{{ formatTimestamp(log.timestamp) }}</td>
                    <td>{{ formatCanisterId(log.caller.toText()) }}</td>
                    <td>
                      <span class="badge bg-primary">{{ log.action }}</span>
                    </td>
                    <td class="text-truncate" style="max-width: 200px;">{{ log.parameters }}</td>
                    <td class="text-truncate" style="max-width: 200px;">{{ log.result }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

          <!-- Add Monitored Canister -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Add Monitored Canister</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Canister ID</label>
                  <input v-model="newCanister.canisterId" type="text" class="form-control" placeholder="Enter canister principal ID">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Name</label>
                  <input v-model="newCanister.name" type="text" class="form-control" placeholder="Canister name">
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Minimum Cycles</label>
                  <input v-model="newCanister.minimumCycles" type="text" class="form-control" placeholder="e.g., 1000000000000">
                </div>
                <div class="col-md-6 mb-3">
                  <div class="form-check">
                    <input v-model="newCanister.isSNSControlled" class="form-check-input" type="checkbox" id="isSNS">
                    <label class="form-check-label" for="isSNS">
                      SNS Controlled
                    </label>
                  </div>
                  <div v-if="newCanister.isSNSControlled" class="mt-2">
                    <input v-model="newCanister.snsRootCanisterId" type="text" class="form-control" placeholder="SNS Root Canister ID">
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Cycles Alert Level</label>
                  <select v-model="newCanister.cyclesAlertLevel" class="form-select">
                    <option value="Level1Immediate">Level 1 (Immediate)</option>
                    <option value="Level2DelayedSMS">Level 2 (Delayed SMS)</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Timers Alert Level</label>
                  <select v-model="newCanister.timersAlertLevel" class="form-select">
                    <option value="Level1Immediate">Level 1 (Immediate)</option>
                    <option value="Level2DelayedSMS">Level 2 (Delayed SMS)</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Status Alert Level</label>
                  <select v-model="newCanister.statusAlertLevel" class="form-select">
                    <option value="Level1Immediate">Level 1 (Immediate)</option>
                    <option value="Level2DelayedSMS">Level 2 (Delayed SMS)</option>
                  </select>
                </div>
              </div>
              <button @click="addMonitoredCanister" :disabled="!isCanisterFormValid || loading" class="btn btn-success">
                Add Monitored Canister
              </button>
            </div>
          </div>

                  <div class="card bg-dark text-white mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0">Monitored Canisters</h3>
            <button @click="fetchMonitoredCanisters" class="btn btn-secondary">Refresh</button>
          </div>
          <div class="card-body">
            <div v-if="monitoredCanisters.length === 0" class="text-center py-3">
              <p class="mb-0">No canisters are currently being monitored.</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-dark table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Canister ID</th>
                    <th>Status</th>
                    <th>Min Cycles</th>
                    <th>Alert Levels</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="canister in monitoredCanisters" :key="String(canister.id)">
                    <td>{{ canister.name }}</td>
                    <td>{{ formatCanisterId(canister.canisterId.toText()) }}</td>
                    <td>
                      <span class="badge" :class="canister.enabled ? 'bg-success' : 'bg-danger'">
                        {{ canister.enabled ? 'Enabled' : 'Disabled' }}
                      </span>
                    </td>
                    <td>{{ canister.minimumCycles.toLocaleString() }}</td>
                    <td>
                      <div><small>Cycles: {{ formatImportanceLevel(canister.cyclesAlertLevel) }}</small></div>
                      <div><small>Timers: {{ formatImportanceLevel(canister.timersAlertLevel) }}</small></div>
                      <div><small>Status: {{ formatImportanceLevel(canister.statusAlertLevel) }}</small></div>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button
                          @click="toggleCanisterMonitoring(canister.id, !canister.enabled)"
                          :class="canister.enabled ? 'btn btn-outline-warning' : 'btn btn-outline-success'"
                          :disabled="loading"
                        >
                          {{ canister.enabled ? 'Disable' : 'Enable' }}
                        </button>
                        <button @click="removeMonitoredCanister(canister.id)" class="btn btn-outline-danger" :disabled="loading">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

          <!-- Test Email Section -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Send Test Email</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-5 mb-2">
                  <input v-model="testEmail.email" type="email" class="form-control" placeholder="Enter email address">
                </div>
                <div class="col-md-5 mb-2">
                  <input v-model="testEmail.subject" type="text" class="form-control" placeholder="Email subject">
                </div>
                <div class="col-md-2 mb-2">
                  <button @click="sendTestEmail" :disabled="!testEmail.email || !testEmail.subject || loading" class="btn btn-info">
                    Send Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Configuration -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Monitoring Configuration</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4 mb-3">
                  <h5>Treasury Monitoring</h5>
                  <div class="input-group mb-2">
                    <span class="input-group-text">Check Interval (min):</span>
                    <input 
                      v-model.number="configIntervals.treasuryCheckMinutes" 
                      type="number" 
                      min="5" 
                      max="60"
                      class="form-control"
                    />
                    <button @click="updateCheckInterval" :disabled="loading" class="btn btn-primary">
                      Update
                    </button>
                  </div>
                  <div class="d-flex gap-2">
                    <button 
                      @click="toggleMonitoring" 
                      :class="systemStatus.enabled ? 'btn btn-danger' : 'btn btn-success'"
                      :disabled="loading"
                    >
                      {{ systemStatus.enabled ? 'Stop Monitoring' : 'Start Monitoring' }}
                    </button>
                  </div>
                </div>


                
                <div class="col-md-4 mb-3">
                  <h5>Canister Monitoring</h5>
                  <div class="input-group mb-2">
                    <span class="input-group-text">Check Interval (min):</span>
                    <input 
                      v-model.number="configIntervals.canisterMonitoringMinutes" 
                      type="number" 
                      min="5" 
                      max="60"
                      class="form-control"
                    />
                    <button @click="updateCanisterMonitoringInterval" :disabled="loading" class="btn btn-primary">
                      Update
                    </button>
                  </div>
                </div>

                <div class="col-md-4 mb-3">
                  <h5>Level 2 SMS Check</h5>
                  <div class="input-group mb-2">
                    <span class="input-group-text">Check Interval (min):</span>
                    <input 
                      v-model.number="configIntervals.level2SMSCheckMinutes" 
                      type="number" 
                      min="1" 
                      max="30"
                      class="form-control"
                    />
                    <button @click="updateLevel2SMSInterval" :disabled="loading" class="btn btn-primary">
                      Update
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <button @click="refreshConfigIntervals" class="btn btn-secondary" :disabled="loading">
                  Refresh Configuration
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
    
    <FooterBar />

    <!-- Confirmation Modal -->
    <AdminConfirmationModal
      v-if="showConfirmModal"
      :title="confirmModal.title"
      :show="showConfirmModal"  
      :message="confirmModal.message"
      :confirmText="confirmModal.confirmText"
      :cancelText="confirmModal.cancelText"
      @confirm="handleConfirm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import AdminConfirmationModal from '../components/admin/AdminConfirmationModal.vue'

const tacoStore = useTacoStore()
const userStore = tacoStore // Assuming user functions are in taco store

// Reactive state
const loading = ref(false)
const newAdminPrincipal = ref('')
const errorLimit = ref(25)

// Contact form
const newContact = ref({
  name: '',
  type: 'Email',
  value: ''
})

// Canister form
const newCanister = ref({
  canisterId: '',
  name: '',
  minimumCycles: '',
  isSNSControlled: false,
  snsRootCanisterId: '',
  cyclesAlertLevel: 'Level2DelayedSMS',
  timersAlertLevel: 'Level2DelayedSMS',
  statusAlertLevel: 'Level1Immediate'
})

const monitoredCanisters = ref([] as any[]);

// Test email form
const testEmail = ref({
  email: '',
  subject: ''
})

// Modal state
const showConfirmModal = ref(false)
const confirmModal = ref({
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  action: () => {}
})

// Data arrays
const contacts = ref([] as any[])
const pendingAlarms = ref([] as any[])
const systemErrors = ref([] as any[])
const systemStatus = ref({} as any)
const messageFilter = ref('all')
const sentMessages = ref([] as any[])
const alarmAcknowledgments = ref([] as any[])
const queueStatus = ref({} as any)
const configIntervals = ref({
  treasuryCheckMinutes: BigInt(30),
  canisterMonitoringMinutes: BigInt(10),
  level2SMSCheckMinutes: BigInt(5),
  level2AlarmDelayMinutes: BigInt(30)
})
const logLimit = ref(25)
const adminActionLogs = ref([] as any[])

// Auto-refresh state
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const refreshCount = ref(0)
const maxRefreshCount = 30 // 30 minutes worth of refreshes (1 per minute)


// Computed properties
const isContactValid = computed(() => {
  return newContact.value.name.trim() && 
         newContact.value.value.trim() && 
         (newContact.value.type === 'Email' ? 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContact.value.value) : 
           /^\+?[\d\s-()]+$/.test(newContact.value.value))
})

const isCanisterFormValid = computed(() => {
  return newCanister.value.canisterId.trim() && 
         newCanister.value.name.trim() && 
         newCanister.value.minimumCycles.trim() &&
         (!newCanister.value.isSNSControlled || newCanister.value.snsRootCanisterId.trim())
})

// Auto-refresh function
async function refreshData() {
  try {
    await Promise.all([
      fetchSystemStatus(),
      fetchContacts(),
      fetchPendingAlarms(),
      fetchSystemErrors(),
      fetchConfigIntervals(),
      fetchQueueStatus(),
      fetchSentMessages(),
      fetchAlarmAcknowledgments(),
      fetchAdminActionLogs(),
      fetchMonitoredCanisters()
    ])
  } catch (error) {
    console.error('Error during auto-refresh:', error)
  }
}

function startAutoRefresh() {
  refreshInterval.value = setInterval(async () => {
    refreshCount.value++
    if (refreshCount.value > maxRefreshCount) {
      stopAutoRefresh()
      return
    }
    await refreshData()
  }, 60000) // Refresh every 1 minute (60000 milliseconds)
}

function stopAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Lifecycle
onMounted(async () => {
  // Initial data load
  await refreshData()
  // Start auto-refresh
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Watch for error limit changes
watch(errorLimit, () => {
  fetchSystemErrors()
})

// Methods
async function performSystemHealthCheck() {
  loading.value = true
  try {
    await tacoStore.performSystemHealthCheck()
    await fetchSystemStatus()
    tacoStore.showSuccess('System health check completed')
  } catch (error: any) {
    tacoStore.showError('Failed to perform health check: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function refreshSystemStatus() {
  await fetchSystemStatus()
}

async function fetchSystemStatus() {
  try {
    const status = await tacoStore.getEnhancedAlarmSystemStatus()
    const monitoringStatus = await tacoStore.getMonitoringStatus()
    systemStatus.value = { ...status, ...monitoringStatus }
  } catch (error) {
    console.error('Failed to fetch system status:', error)
  }
}

async function addAdmin() {
  if (!newAdminPrincipal.value.trim()) return
  
  loading.value = true
  try {
    await tacoStore.addAlarmAdmin(newAdminPrincipal.value)
    newAdminPrincipal.value = ''
    tacoStore.showSuccess('Admin added successfully')
  } catch (error: any) {
    tacoStore.showError('Failed to add admin: ' + error.message)
  } finally {const logLimit = ref(25)
const adminActionLogs = ref([] as any[])
    loading.value = false
  }
}

async function addContact() {
  if (!isContactValid.value) return
  
  loading.value = true
  try {
    await tacoStore.addAlarmContact(
      newContact.value.name,
      newContact.value.type,
      newContact.value.value
    )
    newContact.value = { name: '', type: 'Email', value: '' }
    await fetchContacts()
    tacoStore.showSuccess('Contact added successfully')
  } catch (error: any) {
    tacoStore.showError('Failed to add contact: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchContacts() {
  try {
    contacts.value = await tacoStore.getAlarmContacts()
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
  }
}

async function toggleContactStatus(contactId: number, active: boolean) {
  loading.value = true;
  const monitoredCanisters = ref([] as any[]);
  try {
    await tacoStore.updateContactStatus(contactId, active)
    await fetchContacts()
    tacoStore.showSuccess(`Contact ${active ? 'enabled' : 'disabled'}`)
  } catch (error: any) {
    tacoStore.showError('Failed to update contact: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function removeContact(contactId: number) {
  confirmModal.value = {
    title: 'Remove Contact',
    message: 'Are you sure you want to remove this contact? This action cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    action: async () => {
      loading.value = true
      try {
        await tacoStore.removeAlarmContact(contactId)
        await fetchContacts()
        tacoStore.showSuccess('Contact removed successfully')
      } catch (error: any) {
        tacoStore.showError('Failed to remove contact: ' + error.message)
      } finally {
        loading.value = false
      }
    }
  }
  showConfirmModal.value = true
}

async function testContact(contact: any, testType: 'email' | 'sms') {
  loading.value = true
  try {
    const options = {
      email: testType === 'email',
      sms: testType === 'sms'
    }
    
    await tacoStore.testAlarmContact([contact.id], options)
  } catch (error: any) {
    tacoStore.showError('Failed to send test message: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchAdminActionLogs() {
 try {
  adminActionLogs.value = await tacoStore.getAdminActionLogs(logLimit.value)
 } catch (error) {
  console.error('Failed to fetch admin action logs:', error)
 }
}

async function fetchPendingAlarms() {
  try {
    pendingAlarms.value = await tacoStore.getPendingAlarms()
  } catch (error) {
    console.error('Failed to fetch pending alarms:', error)
  }
}

async function acknowledgeAlarm(alarmId: number) {
  loading.value = true
  try {
    await tacoStore.acknowledgeAlarm(alarmId)
    await fetchPendingAlarms()
    tacoStore.showSuccess('Alarm acknowledged successfully')
  } catch (error: any) {
    tacoStore.showError('Failed to acknowledge alarm: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchSystemErrors() {
  try {
    systemErrors.value = await tacoStore.getSystemErrors(errorLimit.value)
  } catch (error) {
    console.error('Failed to fetch system errors:', error)
  }
}

async function resolveError(errorId: number) {
  loading.value = true
  try {
    await tacoStore.resolveSystemError(errorId)
    await fetchSystemErrors()
    tacoStore.showSuccess('Error marked as resolved')
  } catch (error: any) {
    tacoStore.showError('Failed to resolve error: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function updateCheckInterval() {
  loading.value = true
  try {
    await tacoStore.setCheckInterval(Number(configIntervals.value.treasuryCheckMinutes))
    await fetchSystemStatus()
    await fetchConfigIntervals()
    tacoStore.showSuccess('Treasury check interval updated')
  } catch (error: any) {
    tacoStore.showError('Failed to update interval: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function updateCanisterMonitoringInterval() {
  loading.value = true
  try {
    await tacoStore.setCanisterMonitoringInterval(Number(configIntervals.value.canisterMonitoringMinutes))
    await fetchConfigIntervals()
    tacoStore.showSuccess('Canister monitoring interval updated')
  } catch (error: any) {
    tacoStore.showError('Failed to update canister monitoring interval: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchMonitoredCanisters() {
  try {
    monitoredCanisters.value = await tacoStore.getMonitoredCanisters();
  } catch (error) {
    console.error('Failed to fetch monitored canisters:', error);
  }
}

async function toggleCanisterMonitoring(canisterId: bigint, enabled: boolean) {
  loading.value = true;
  try {
    await tacoStore.updateMonitoredCanisterStatus(Number(canisterId), enabled);
    await fetchMonitoredCanisters();
    tacoStore.showSuccess(`Canister monitoring ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error: any) {
    tacoStore.showError('Failed to update canister status: ' + error.message);
  } finally {
    loading.value = false;
  }
}

async function removeMonitoredCanister(canisterId: bigint) {
  confirmModal.value = {
    title: 'Remove Monitored Canister',
    message: 'Are you sure you want to remove this canister from monitoring? This cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    action: async () => {
      loading.value = true;
      try {
        await tacoStore.removeMonitoredCanister(Number(canisterId));
        await fetchMonitoredCanisters();
        tacoStore.showSuccess('Monitored canister removed successfully');
      } catch (error: any) {
        tacoStore.showError('Failed to remove canister: ' + error.message);
      } finally {
        loading.value = false;
      }
    }
  };
  showConfirmModal.value = true;
}

async function fetchConfigIntervals() {
  try {
    const intervals = await tacoStore.getConfigurationIntervals()
    configIntervals.value = intervals
  } catch (error) {
    console.error('Failed to fetch configuration intervals:', error)
  }
}

async function fetchQueueStatus() {
  try {
    queueStatus.value = await tacoStore.getQueueStatus()
  } catch (error) {
    console.error('Failed to fetch queue status:', error)
  }
}

async function fetchSentMessages() {
  try {
    let messages
    if (messageFilter.value === 'sms') {
      messages = await tacoStore.getSentSMSMessages()
    } else if (messageFilter.value === 'email') {
      messages = await tacoStore.getSentEmailMessages()
    } else {
      messages = await tacoStore.getSentMessages()
    }
    sentMessages.value = messages
  } catch (error) {
    console.error('Failed to fetch sent messages:', error)
  }
}

async function fetchAlarmAcknowledgments() {
  try {
    alarmAcknowledgments.value = await tacoStore.getAlarmAcknowledgments()
  } catch (error) {
    console.error('Failed to fetch alarm acknowledgments:', error)
  }
}

async function addMonitoredCanister() {
  if (!isCanisterFormValid.value) return
  
  loading.value = true
  try {
    await tacoStore.addMonitoredCanister(
      newCanister.value.canisterId,
      newCanister.value.name,
      newCanister.value.isSNSControlled,
      newCanister.value.isSNSControlled ? newCanister.value.snsRootCanisterId : null,
      BigInt(newCanister.value.minimumCycles),
      newCanister.value.cyclesAlertLevel,
      newCanister.value.timersAlertLevel,
      newCanister.value.statusAlertLevel
    )
    
    // Reset form
    newCanister.value = {
      canisterId: '',
      name: '',
      minimumCycles: '',
      isSNSControlled: false,
      snsRootCanisterId: '',
      cyclesAlertLevel: 'Level2DelayedSMS',
      timersAlertLevel: 'Level2DelayedSMS',
      statusAlertLevel: 'Level1Immediate'
    }
    
    tacoStore.showSuccess('Monitored canister added successfully')
  } catch (error: any) {
    tacoStore.showError('Failed to add monitored canister: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function sendTestEmail() {
  if (!testEmail.value.email || !testEmail.value.subject) return
  
  loading.value = true
  try {
    await tacoStore.sendTestEmailSingle(testEmail.value.email, testEmail.value.subject)
    testEmail.value = { email: '', subject: '' }
    tacoStore.showSuccess('Test email sent successfully')
  } catch (error: any) {
    tacoStore.showError('Failed to send test email: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function updateLevel2SMSInterval() {
  loading.value = true
  try {
    await tacoStore.setLevel2SMSCheckInterval(Number(configIntervals.value.level2SMSCheckMinutes))
    await fetchConfigIntervals()
    tacoStore.showSuccess('Level 2 SMS check interval updated')
  } catch (error: any) {
    tacoStore.showError('Failed to update Level 2 SMS interval: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function refreshConfigIntervals() {
  loading.value = true
  try {
    await fetchConfigIntervals()
    tacoStore.showSuccess('Configuration refreshed')
  } catch (error: any) {
    tacoStore.showError('Failed to refresh configuration: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function toggleMonitoring() {
  loading.value = true
  try {
    if (systemStatus.value.enabled) {
      await tacoStore.stopMonitoring()
      tacoStore.showSuccess('Monitoring stopped')
    } else {
      await tacoStore.startMonitoring()
      tacoStore.showSuccess('Monitoring started')
    }
    await fetchSystemStatus()
  } catch (error: any) {
    tacoStore.showError('Failed to toggle monitoring: ' + error.message)
  } finally {
    loading.value = false
  }
}

function handleConfirm() {
  showConfirmModal.value = false
  confirmModal.value.action()
}

// Utility functions
function getContactTypeFromVariant(contactType: any): string {
  if (contactType.Email !== undefined) return 'Email'
  if (contactType.SMS !== undefined) return 'SMS'
  return 'Unknown'
}

function getContactValueFromVariant(contactType: any): string {
  if (contactType.Email !== undefined) return contactType.Email
  if (contactType.SMS !== undefined) return contactType.SMS
  return 'Unknown'
}

function formatImportanceLevel(level: any): string {
  if (level.Level1Immediate !== undefined) return 'Level 1 (Immediate)'
  if (level.Level2DelayedSMS !== undefined) return 'Level 2 (Delayed SMS)'
  return 'Unknown'
}

function formatErrorType(errorType: any): string {
  if (errorType.InterCanisterCall) return 'Inter-Canister Call'
  if (errorType.QueueProcessing) return 'Queue Processing'
  if (errorType.TimerSetup) return 'Timer Setup'
  if (errorType.MonitoringError) return 'Monitoring Error'
  if (errorType.SystemHealth) return 'System Health'
  return 'Unknown'
}

function formatTimestamp(timestamp: number | bigint | string): string {
  if (!timestamp) return 'N/A'
  
  // Convert to number if it's a BigInt or string
  let timestampNum: number
  if (typeof timestamp === 'bigint') {
    timestampNum = Number(timestamp)
  } else if (typeof timestamp === 'string') {
    timestampNum = parseInt(timestamp, 10)
  } else {
    timestampNum = timestamp
  }
  
  // Handle nanosecond timestamps (divide by 1M to get milliseconds)
  return new Date(timestampNum / 1000000).toLocaleString()
}

function formatCanisterId(canisterId: string): string {
  if (!canisterId) return 'N/A'
  // Show first 5 and last 5 characters with ellipsis in between
  if (canisterId.length > 15) {
    return `${canisterId.slice(0, 5)}...${canisterId.slice(-5)}`
  }
  return canisterId
}

function formatTimeRemaining(futureTimestamp: number): string {
  if (!futureTimestamp) return 'N/A'
  const now = Date.now() * 1000000 // Convert to nanoseconds
  const remaining = Math.max(0, futureTimestamp - now)
  const minutes = Math.floor(remaining / 60000000000) // Convert from nanoseconds to minutes
  return `${minutes} minutes`
}
</script>

<style scoped>
/* No additional styles needed - using Bootstrap classes */
</style>