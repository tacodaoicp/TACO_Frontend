<template>
  <div class="alarm-view">
    <HeaderBar />
    
    <div class="alarm-view__inner container">
      <div class="page-header">
        <TacoTitle 
          level="h2" 
          emoji="🚨" 
          title="Alarm Management" 
          subtitle="Monitor system health and manage alert configurations"
          style="padding-left: 1rem !important; margin-bottom: 0 !important;"
        />
      </div>

      <!-- Quick Navigation -->
      <div class="ms-3 mb-3">
        <div class="d-flex gap-3">
          <router-link to="/admin" class="btn btn-secondary">
            ← Back to Admin Panel
          </router-link>
        </div>
      </div>

      <!-- System Status Overview -->
      <div class="status-overview">
        <div class="status-card">
          <h3>System Health</h3>
          <div class="health-metrics">
            <div class="metric">
              <span class="label">Monitoring Status:</span>
              <span class="value" :class="systemStatus.enabled ? 'success' : 'warning'">
                {{ systemStatus.enabled ? 'Active' : 'Disabled' }}
              </span>
            </div>
            <div class="metric">
              <span class="label">Pending Alarms:</span>
              <span class="value">{{ systemStatus.pendingAlarmsCount || 0 }}</span>
            </div>
            <div class="metric">
              <span class="label">SMS Queue:</span>
              <span class="value">{{ systemStatus.smsQueueSize || 0 }}</span>
            </div>
            <div class="metric">
              <span class="label">Email Queue:</span>
              <span class="value">{{ systemStatus.emailQueueSize || 0 }}</span>
            </div>
          </div>
          <div class="actions">
            <button @click="performSystemHealthCheck" :disabled="loading" class="btn btn-primary">
              {{ loading ? 'Checking...' : 'Run Health Check' }}
            </button>
            <button @click="refreshSystemStatus" class="btn btn-secondary">Refresh Status</button>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Admin Management -->
      <div class="admin-section" v-if="userStore.isLoggedIn">
        <div class="section-card">
          <h3>Admin Management</h3>
          <div class="form-group">
            <label for="adminPrincipal">Add Admin Principal:</label>
            <div class="input-group">
              <input 
                id="adminPrincipal"
                v-model="newAdminPrincipal" 
                type="text" 
                placeholder="Enter principal ID"
                class="form-control"
              />
              <button @click="addAdmin" :disabled="!newAdminPrincipal || loading" class="btn btn-primary">
                Add Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="section-card">
          <h3>Admin Management</h3>
          <p>You must be an admin to access this page.</p>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Contact Management -->
      <div class="contact-section">
        <div class="section-card">
          <h3>Contact Management</h3>
          
          <!-- Add Contact Form -->
          <div class="form-section">
            <h4>Add New Contact</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="contactName">Name:</label>
                <input 
                  id="contactName"
                  v-model="newContact.name" 
                  type="text" 
                  placeholder="Contact name"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label for="contactType">Type:</label>
                <select id="contactType" v-model="newContact.type" class="form-control">
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <div class="form-group">
                <label for="contactValue">{{ newContact.type === 'Email' ? 'Email Address' : 'Phone Number' }}:</label>
                <input 
                  id="contactValue"
                  v-model="newContact.value" 
                  :type="newContact.type === 'Email' ? 'email' : 'tel'"
                  :placeholder="newContact.type === 'Email' ? 'user@example.com' : '+1234567890'"
                  class="form-control"
                />
              </div>
              <button @click="addContact" :disabled="!isContactValid || loading" class="btn btn-primary">
                Add Contact
              </button>
            </div>
          </div>

          <!-- Contacts List -->
          <div class="contacts-list" v-if="contacts.length > 0">
            <h4>Existing Contacts</h4>
            <div class="table-container">
              <table class="contacts-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Contact Info</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contact in contacts" :key="contact.id">
                    <td>{{ contact.id }}</td>
                    <td>{{ contact.name }}</td>
                    <td>
                      <span class="contact-type" :class="getContactTypeFromVariant(contact.contactType).toLowerCase()">
                        {{ getContactTypeFromVariant(contact.contactType) }}
                      </span>
                    </td>
                    <td>{{ getContactValueFromVariant(contact.contactType) }}</td>
                    <td>
                      <span class="status" :class="contact.active ? 'active' : 'inactive'">
                        {{ contact.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="actions">
                      <button 
                        @click="toggleContactStatus(contact.id, !contact.active)"
                        class="btn btn-sm"
                        :class="contact.active ? 'btn-secondary' : 'btn-primary'"
                      >
                        {{ contact.active ? 'Disable' : 'Enable' }}
                      </button>
                      <button @click="testContact(contact)" class="btn btn-sm btn-success">Test</button>
                      <button @click="removeContact(contact.id)" class="btn btn-sm btn-danger">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Pending Alarms & Acknowledgment -->
      <div class="alarms-section">
        <div class="section-card">
          <h3>Pending Level 2 Alarms</h3>
          <button @click="fetchPendingAlarms" class="btn btn-secondary refresh-btn">Refresh</button>
          
          <div v-if="pendingAlarms.length === 0" class="no-data">
            <p>No pending alarms requiring acknowledgment</p>
          </div>
          
          <div v-else class="alarms-list">
            <div v-for="alarm in pendingAlarms" :key="alarm.id" class="alarm-item">
              <div class="alarm-header">
                <span class="alarm-id">Alarm ID: {{ alarm.id }}</span>
                <span class="alarm-level" :class="alarm.importanceLevel">
                  {{ formatImportanceLevel(alarm.importanceLevel) }}
                </span>
                <span class="alarm-time">{{ formatTimestamp(alarm.emailSentAt) }}</span>
              </div>
              <div class="alarm-message">{{ alarm.message }}</div>
              <div class="alarm-actions">
                <button 
                  @click="acknowledgeAlarm(alarm.id)" 
                  class="btn btn-primary"
                  :disabled="loading"
                >
                  Acknowledge
                </button>
                <div v-if="alarm.smsPendingAt" class="sms-pending">
                  SMS will be sent in: {{ formatTimeRemaining(alarm.smsPendingAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- System Errors -->
      <div class="errors-section">
        <div class="section-card">
          <h3>System Errors</h3>
          <div class="section-header">
            <button @click="fetchSystemErrors" class="btn btn-secondary">Refresh Errors</button>
            <div class="form-group inline">
              <label for="errorLimit">Limit:</label>
              <select id="errorLimit" v-model="errorLimit" class="form-control small">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          
          <div v-if="systemErrors.length === 0" class="no-data">
            <p>No system errors found</p>
          </div>
          
          <div v-else class="errors-list">
            <div v-for="error in systemErrors" :key="error.id" class="error-item">
              <div class="error-header">
                <span class="error-id">Error ID: {{ error.id }}</span>
                <span class="error-type">{{ formatErrorType(error.errorType) }}</span>
                <span class="error-time">{{ formatTimestamp(error.timestamp) }}</span>
                <span class="error-status" :class="error.resolved ? 'resolved' : 'unresolved'">
                  {{ error.resolved ? 'Resolved' : 'Unresolved' }}
                </span>
              </div>
              <div class="error-message">{{ error.errorMessage }}</div>
              <div class="error-details">
                <span class="retry-count">Retries: {{ error.retryAttempts }}</span>
                <button 
                  v-if="!error.resolved"
                  @click="resolveError(error.id)" 
                  class="btn btn-sm btn-primary"
                  :disabled="loading"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Sent Message History -->
      <div class="message-history-section">
        <div class="section-card">
          <h3>Message History</h3>
          <div class="section-header">
            <div class="history-tabs">
              <button 
                @click="activeHistoryTab = 'all'"
                :class="['btn', activeHistoryTab === 'all' ? 'primary' : 'secondary']"
              >
                All Messages
              </button>
              <button 
                @click="activeHistoryTab = 'sms'"
                :class="['btn', activeHistoryTab === 'sms' ? 'primary' : 'secondary']"
              >
                SMS Only
              </button>
              <button 
                @click="activeHistoryTab = 'email'"
                :class="['btn', activeHistoryTab === 'email' ? 'primary' : 'secondary']"
              >
                Email Only
              </button>
            </div>
            
            <div class="history-controls">
              <div class="form-group inline">
                <label for="messageLimit">Show:</label>
                <select id="messageLimit" v-model="messageLimit" class="form-control small">
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <button @click="fetchMessageHistory" class="btn btn-secondary">Refresh</button>
            </div>
          </div>
          
          <div v-if="sentMessages.length === 0" class="no-data">
            <p>No sent messages found</p>
          </div>
          
          <div v-else class="messages-list">
            <div class="table-container">
              <table class="messages-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>Alarm ID</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="message in sentMessages" :key="message.id">
                    <td>
                      <span class="message-type" :class="getMessageTypeClass(message.messageType)">
                        {{ formatMessageType(message.messageType) }}
                      </span>
                    </td>
                    <td class="contact-info">{{ message.contactInfo }}</td>
                    <td class="message-content">{{ truncateMessage(message.message) }}</td>
                    <td>
                      <span class="message-status" :class="message.success ? 'success' : 'failed'">
                        {{ message.success ? 'Sent' : 'Failed' }}
                      </span>
                      <div v-if="!message.success && message.errorMessage" class="error-tooltip">
                        {{ message.errorMessage }}
                      </div>
                    </td>
                    <td class="timestamp">{{ formatTimestamp(message.sentAt) }}</td>
                    <td class="alarm-link">
                      <span v-if="message.alarmId" class="alarm-id">{{ message.alarmId }}</span>
                      <span v-else class="no-alarm">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Monitoring Configuration -->
      <div class="config-section">
        <div class="section-card">
          <h3>Monitoring Configuration</h3>
          <div class="config-grid">
            <div class="config-item">
              <h4>Treasury Monitoring</h4>
              <div class="form-group">
                <label for="checkInterval">Check Interval (minutes):</label>
                <input 
                  id="checkInterval"
                  v-model.number="configIntervals.treasuryCheckMinutes" 
                  type="number" 
                  min="5" 
                  max="60"
                  class="form-control"
                />
              </div>
              <div class="actions">
                <button @click="updateCheckInterval" :disabled="loading" class="btn btn-primary">
                  Update Treasury Interval
                </button>
                <button 
                  @click="toggleMonitoring" 
                  :class="systemStatus.enabled ? 'btn btn-danger' : 'btn btn-success'"
                  :disabled="loading"
                >
                  {{ systemStatus.enabled ? 'Stop Monitoring' : 'Start Monitoring' }}
                </button>
              </div>
            </div>
            
            <div class="config-item">
              <h4>Canister Monitoring</h4>
              <div class="form-group">
                <label for="canisterMonitoringInterval">Check Interval (minutes):</label>
                <input 
                  id="canisterMonitoringInterval"
                  v-model.number="configIntervals.canisterMonitoringMinutes" 
                  type="number" 
                  min="5" 
                  max="60"
                  class="form-control"
                />
              </div>
              <div class="actions">
                <button @click="updateCanisterMonitoringInterval" :disabled="loading" class="btn btn-primary">
                  Update Canister Interval
                </button>
              </div>
            </div>
            
            <div class="config-item">
              <h4>Level 2 SMS Checking</h4>
              <div class="form-group">
                <label for="level2SMSInterval">Check Interval (minutes):</label>
                <input 
                  id="level2SMSInterval"
                  v-model.number="configIntervals.level2SMSCheckMinutes" 
                  type="number" 
                  min="1" 
                  max="30"
                  class="form-control"
                />
              </div>
              <div class="actions">
                <button @click="updateLevel2SMSInterval" :disabled="loading" class="btn btn-primary">
                  Update SMS Check Interval
                </button>
              </div>
            </div>
            
            <div class="config-item">
              <h4>Level 2 SMS Delay</h4>
              <div class="form-group">
                <label>SMS Delay Time:</label>
                <div class="read-only-value">{{ configIntervals.level2AlarmDelayMinutes }} minutes</div>
                <div class="help-text">Time to wait before sending SMS for Level 2 alarms</div>
              </div>
            </div>
          </div>
          
          <div class="config-actions">
            <button @click="refreshConfigIntervals" class="btn btn-secondary" :disabled="loading">
              Refresh Configuration
            </button>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Canister Monitoring -->
      <div class="canister-monitoring-section">
        <div class="section-card">
          <h3>Canister Monitoring</h3>
          
          <!-- Add Canister Form -->
          <div class="form-section">
            <h4>Add Monitored Canister</h4>
            <div class="canister-form">
              <div class="form-row canister-row">
                <div class="form-group">
                  <label for="canisterPrincipal">Canister ID:</label>
                  <input 
                    id="canisterPrincipal"
                    v-model="newCanister.canisterId" 
                    type="text" 
                    placeholder="Enter principal ID"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label for="canisterName">Name:</label>
                  <input 
                    id="canisterName"
                    v-model="newCanister.name" 
                    type="text" 
                    placeholder="Canister name"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label for="minimumCycles">Minimum Cycles:</label>
                  <input 
                    id="minimumCycles"
                    v-model="newCanister.minimumCycles" 
                    type="text" 
                    placeholder="e.g., 1000000000000"
                    class="form-control"
                  />
                </div>
              </div>
              
              <div class="form-row canister-row">
                <div class="form-group checkbox-group">
                  <label>
                    <input 
                      v-model="newCanister.isSNSControlled" 
                      type="checkbox"
                      class="form-checkbox"
                    />
                    SNS Controlled
                  </label>
                </div>
                <div class="form-group" v-if="newCanister.isSNSControlled">
                  <label for="snsRootId">SNS Root Canister ID:</label>
                  <input 
                    id="snsRootId"
                    v-model="newCanister.snsRootCanisterId" 
                    type="text" 
                    placeholder="SNS root principal ID"
                    class="form-control"
                  />
                </div>
              </div>
              
              <div class="form-row canister-row">
                <div class="form-group">
                  <label for="cyclesAlertLevel">Cycles Alert Level:</label>
                  <select id="cyclesAlertLevel" v-model="newCanister.cyclesAlertLevel" class="form-control">
                    <option value="Level1Immediate">Level 1 (Immediate SMS + Email)</option>
                    <option value="Level2DelayedSMS">Level 2 (Email first, SMS if no ack)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="timersAlertLevel">Timers Alert Level:</label>
                  <select id="timersAlertLevel" v-model="newCanister.timersAlertLevel" class="form-control">
                    <option value="Level1Immediate">Level 1 (Immediate SMS + Email)</option>
                    <option value="Level2DelayedSMS">Level 2 (Email first, SMS if no ack)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="statusAlertLevel">Status Alert Level:</label>
                  <select id="statusAlertLevel" v-model="newCanister.statusAlertLevel" class="form-control">
                    <option value="Level1Immediate">Level 1 (Immediate SMS + Email)</option>
                    <option value="Level2DelayedSMS">Level 2 (Email first, SMS if no ack)</option>
                  </select>
                </div>
              </div>
              
              <div class="form-actions">
                <button @click="addMonitoredCanister" :disabled="!isCanisterFormValid || loading" class="btn btn-primary">
                  Add Canister
                </button>
              </div>
            </div>
          </div>

          <!-- Monitored Canisters List -->
          <div class="monitored-canisters-list" v-if="monitoredCanisters.length > 0">
            <h4>Monitored Canisters</h4>
            <div class="table-container">
              <table class="canisters-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Canister ID</th>
                    <th>Type</th>
                    <th>Min Cycles</th>
                    <th>Alert Levels (C/T/S)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="canister in monitoredCanisters" :key="canister.id">
                    <td>{{ canister.id }}</td>
                    <td>{{ canister.name }}</td>
                    <td class="canister-id">{{ formatCanisterId(canister.canisterId) }}</td>
                    <td>
                      <span class="canister-type" :class="canister.isSNSControlled ? 'sns' : 'regular'">
                        {{ canister.isSNSControlled ? 'SNS' : 'Regular' }}
                      </span>
                    </td>
                    <td>{{ formatCycles(canister.minimumCycles) }}</td>
                    <td class="alert-levels">
                      <span class="alert-level" :class="canister.cyclesAlertLevel">C</span>
                      <span class="alert-level" :class="canister.timersAlertLevel">T</span>
                      <span class="alert-level" :class="canister.statusAlertLevel">S</span>
                    </td>
                    <td>
                      <span class="status" :class="canister.enabled ? 'active' : 'inactive'">
                        {{ canister.enabled ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                    <td class="actions">
                      <button 
                        @click="toggleCanisterStatus(canister.id, !canister.enabled)"
                        class="btn small"
                        :class="canister.enabled ? 'secondary' : 'primary'"
                      >
                        {{ canister.enabled ? 'Disable' : 'Enable' }}
                      </button>
                      <button @click="removeMonitoredCanister(canister.id)" class="btn btn-sm btn-danger">
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="canister-monitoring-controls">
              <button 
                @click="toggleCanisterMonitoring" 
                :class="systemStatus.canisterMonitoringEnabled ? 'btn btn-danger' : 'btn btn-success'"
                :disabled="loading"
              >
                {{ systemStatus.canisterMonitoringEnabled ? 'Stop Canister Monitoring' : 'Start Canister Monitoring' }}
              </button>
              <button @click="fetchCanisterHealthStatus" class="btn btn-secondary">
                Check Health Status
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr class="m-0"></hr>

      <!-- Admin Actions Log -->
      <div class="admin-actions-section" v-if="userStore.isLoggedIn">
        <div class="section-card">
          <div class="section-header">
            <h3>Admin Actions Log</h3>
            <div class="actions">
              <button @click="fetchAdminActions" class="btn btn-secondary" :disabled="loading">
                Refresh Log
              </button>
            </div>
          </div>
          
          <div v-if="adminActions.length === 0" class="no-data">
            No admin actions recorded
          </div>
          
          <div v-else class="admin-actions-list">
            <div v-for="action in adminActions" :key="action.id" class="action-item">
              <div class="action-header">
                <div class="action-id">Action #{{ action.id }}</div>
                <div class="action-time">{{ formatTimestamp(action.timestamp) }}</div>
              </div>
              <div class="action-details">
                <div class="action-admin">
                  <span class="label">Admin:</span>
                  <span class="value">{{ formatCanisterId(action.admin) }}</span>
                </div>
                <div class="action-type">
                  <span class="label">Action:</span>
                  <span class="value">{{ action.actionType }}</span>
                </div>
                <div class="action-description" v-if="action.description">
                  <span class="label">Description:</span>
                  <div class="action-message">{{ action.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="section-card">
          <h3>Admin Actions Log</h3>
          <p>You must be an admin to access this page.</p>
        </div>
      </div>

    </div>
    
    <FooterBar />

    <!-- Confirmation Modal -->
    <AdminConfirmationModal
      v-if="showConfirmModal"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirmText="confirmModal.confirmText"
      :cancelText="confirmModal.cancelText"
      @confirm="handleConfirm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped lang="scss">
.alarm-view {
  min-height: 100vh;
  background: var(--bg-primary);
}

.alarm-view__inner {

  *:not(.btn) {
    color: var(--black-to-white) !important;
  }

  input {
    border: 1px solid var(--black-to-white) !important;

    &::placeholder {
      color: var(--gray-to-dark-gray) !important;
    }
  }

  select {
    position: relative;
    border: 1px solid var(--black-to-white) !important;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>');
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 16px;
    padding-right: 2rem;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    -ms-appearance: none;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    -ms-appearance: none;
  }

}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.status-overview {
  margin-bottom: 2rem;
  
  .status-card {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
  }
  
  .health-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .label {
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .value {
      font-weight: 600;
      
      &.success {
        color: var(--success-color);
      }
      
      &.warning {
        color: var(--warning-color);
      }
    }
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
}

.section-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
  
  h3 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }
  
  h4 {
    margin: 1rem 0 0.5rem 0;
    color: var(--text-secondary);
  }
}

.form-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr auto;
  gap: 1rem;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  
  &.inline {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--text-secondary);
  }
}

.form-control {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  
  &.small {
    max-width: 100px;
  }
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
}

.input-group {
  display: flex;
  gap: 0.5rem;
  
  .form-control {
    flex: 1;
  }
}

.refresh-btn {
  float: right;
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.contacts-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
    background: var(--bg-tertiary);
    font-weight: 600;
    color: var(--text-secondary);
  }
  
  td.actions {
    display: flex;
    gap: 0.5rem;
  }
}

.contact-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.email {
    background: var(--info-color);
    color: white;
  }
  
  &.sms {
    background: var(--warning-color);
    color: white;
  }
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.active {
    background: var(--success-color);
    color: white;
  }
  
  &.inactive {
    background: var(--danger-color);
    color: white;
  }
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.alarms-list, .errors-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alarm-item, .error-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--bg-primary);
}

.alarm-header, .error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .alarm-id, .error-id {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .alarm-level {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    
    &.Level1Immediate {
      background: var(--danger-color);
      color: white;
    }
    
    &.Level2DelayedSMS {
      background: var(--warning-color);
      color: white;
    }
  }
  
  .error-type {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--info-color);
    color: white;
  }
  
  .error-status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    
    &.resolved {
      background: var(--success-color);
      color: white;
    }
    
    &.unresolved {
      background: var(--danger-color);
      color: white;
    }
  }
  
  .alarm-time, .error-time {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

.alarm-message, .error-message {
  margin: 0.5rem 0;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
}

.alarm-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.error-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  
  .retry-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

.sms-pending {
  font-size: 0.875rem;
  color: var(--warning-color);
  font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.config-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  
  h4 {
    margin: 0 0 1rem 0;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
}

// Canister monitoring styles
.canister-monitoring-section {
  margin-bottom: 2rem;
}

.canister-form {
  .canister-row {
    grid-template-columns: 2fr 2fr 2fr;
    
    &:last-of-type {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
    justify-content: center;
    
    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    
    .form-checkbox {
      width: auto;
      margin: 0;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.canisters-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
    background: var(--bg-tertiary);
    font-weight: 600;
    color: var(--text-secondary);
  }
  
  .canister-id {
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .alert-levels {
    display: flex;
    gap: 0.25rem;
  }
  
  .alert-level {
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 600;
    
    &.Level1Immediate {
      background: var(--danger-color);
      color: white;
    }
    
    &.Level2DelayedSMS {
      background: var(--warning-color);
      color: white;
    }
  }
  
  td.actions {
    display: flex;
    gap: 0.5rem;
  }
}

.canister-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.sns {
    background: var(--accent-color);
    color: white;
  }
  
  &.regular {
    background: var(--info-color);
    color: white;
  }
}

.canister-monitoring-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-start;
}

// Message history styles
.message-history-section {
  margin-bottom: 2rem;
}

.history-tabs {
  display: flex;
  gap: 0.5rem;
}

.history-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.messages-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
    background: var(--bg-tertiary);
    font-weight: 600;
    color: var(--text-secondary);
  }
  
  .contact-info {
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .message-content {
    max-width: 300px;
    word-wrap: break-word;
    font-size: 0.875rem;
  }
  
  .timestamp {
    font-size: 0.875rem;
    white-space: nowrap;
  }
}

.message-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.sms {
    background: var(--warning-color);
    color: white;
  }
  
  &.email {
    background: var(--info-color);
    color: white;
  }
}

.message-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.success {
    background: var(--success-color);
    color: white;
  }
  
  &.failed {
    background: var(--danger-color);
    color: white;
  }
}

.error-tooltip {
  font-size: 0.75rem;
  color: var(--danger-color);
  margin-top: 0.25rem;
  font-style: italic;
}

.alarm-link {
  .alarm-id {
    font-family: monospace;
    background: var(--accent-color);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 3px;
    font-size: 0.875rem;
  }
  
  .no-alarm {
    color: var(--text-secondary);
    font-style: italic;
  }
}

// Configuration styles
.config-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.read-only-value {
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-weight: 500;
  color: var(--text-primary);
}

.help-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-style: italic;
}

// Admin actions styles
.admin-actions-section {
  margin-bottom: 2rem;
}

.admin-actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--bg-primary);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .action-id {
    font-weight: 600;
    color: var(--text-primary);
    font-family: monospace;
  }
  
  .action-time {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

.action-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  .action-admin,
  .action-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .label {
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 80px;
    }
    
    .value {
      font-family: monospace;
      background: var(--bg-tertiary);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
  }
  
  .action-description {
    .label {
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }
    
    .action-message {
      background: var(--bg-tertiary);
      padding: 0.75rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import AdminConfirmationModal from '../components/admin/AdminConfirmationModal.vue'

///////////
// store //
///////////

// # SETUP #
const tacoStore = useTacoStore()
const userStore = tacoStore

// # STATE #

// none

// # ACTIONS #

const { 
  performSystemHealthCheck,
  getEnhancedAlarmSystemStatus,
  getMonitoringStatus,
  addAlarmAdmin,
  addAlarmContact,
  getAlarmContacts,
  updateContactStatus,
  removeAlarmContact,
  testAlarmContact,
  getPendingAlarms,
  acknowledgeAlarm,
  getSystemErrors,
  resolveSystemError,
  setCheckInterval,
  startMonitoring,
  stopMonitoring,
  addMonitoredCanister,
  getMonitoredCanisters,
  removeMonitoredCanister,
  updateMonitoredCanisterStatus,
  startCanisterMonitoring,
  stopCanisterMonitoring,
  getCanisterHealthStatus,
  getQueueStatus,
  clearQueues,
  getSentMessages,
  getSentSMSMessages,
  getSentEmailMessages,
  setCanisterMonitoringInterval,
  setLevel2SMSCheckInterval,
  getConfigurationIntervals,
  getAdminActionLogs
} = tacoStore 

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
const contacts = ref([])
const pendingAlarms = ref([])
const systemErrors = ref([])
const monitoredCanisters = ref([])
const sentMessages = ref([])
const systemStatus = ref({})
const adminActions = ref([])
const configIntervals = ref({
  treasuryCheckMinutes: 30,
  canisterMonitoringMinutes: 10,
  level2SMSCheckMinutes: 5,
  level2AlarmDelayMinutes: 30
})

// Message history state
const activeHistoryTab = ref('all')
const messageLimit = ref(25)

// Computed properties
const isContactValid = computed(() => {
  return newContact.value.name.trim() && 
         newContact.value.value.trim() && 
         (newContact.value.type === 'Email' ? 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContact.value.value) : 
           /^\+?[\d\s-()]+$/.test(newContact.value.value))
})

const isCanisterFormValid = computed(() => {
  const principalRegex = /^[a-z0-9-]+$/
  const cyclesValid = newCanister.value.minimumCycles.trim() && /^\d+$/.test(newCanister.value.minimumCycles)
  
  return newCanister.value.canisterId.trim() && 
         principalRegex.test(newCanister.value.canisterId) &&
         newCanister.value.name.trim() && 
         cyclesValid &&
         (!newCanister.value.isSNSControlled || newCanister.value.snsRootCanisterId.trim())
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchSystemStatus(),
    fetchContacts(),
    fetchPendingAlarms(),
    fetchSystemErrors(),
    fetchMonitoredCanisters(),
    fetchMessageHistory(),
    fetchConfigIntervals(),
    fetchAdminActions()
  ])
})

// Watch for error limit changes
watch(errorLimit, () => {
  fetchSystemErrors()
})

// Watch for message history changes
watch([activeHistoryTab, messageLimit], () => {
  fetchMessageHistory()
})

// Methods
async function performSystemHealthCheck() {
  loading.value = true
  try {
    await tacoStore.performSystemHealthCheck()
    await fetchSystemStatus()
    tacoStore.showSuccess('System health check completed')
  } catch (error) {
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
  } catch (error) {
    tacoStore.showError('Failed to add admin: ' + error.message)
  } finally {
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
  } catch (error) {
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
  loading.value = true
  try {
    await tacoStore.updateContactStatus(contactId, active)
    await fetchContacts()
    tacoStore.showSuccess(`Contact ${active ? 'enabled' : 'disabled'}`)
  } catch (error) {
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
      } catch (error) {
        tacoStore.showError('Failed to remove contact: ' + error.message)
      } finally {
        loading.value = false
      }
    }
  }
  showConfirmModal.value = true
}

async function testContact(contact: any) {
  loading.value = true
  try {
    await tacoStore.testAlarmContact([contact.id])
    tacoStore.showSuccess('Test message sent')
  } catch (error) {
    tacoStore.showError('Failed to send test message: ' + error.message)
  } finally {
    loading.value = false
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
  } catch (error) {
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
  } catch (error) {
    tacoStore.showError('Failed to resolve error: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function updateCheckInterval() {
  loading.value = true
  try {
    await tacoStore.setCheckInterval(configIntervals.value.treasuryCheckMinutes)
    await fetchSystemStatus()
    await fetchConfigIntervals()
    tacoStore.showSuccess('Treasury check interval updated')
  } catch (error) {
    tacoStore.showError('Failed to update interval: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function updateCanisterMonitoringInterval() {
  loading.value = true
  try {
    await tacoStore.setCanisterMonitoringInterval(configIntervals.value.canisterMonitoringMinutes)
    await fetchConfigIntervals()
    tacoStore.showSuccess('Canister monitoring interval updated')
  } catch (error) {
    tacoStore.showError('Failed to update canister monitoring interval: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function updateLevel2SMSInterval() {
  loading.value = true
  try {
    await tacoStore.setLevel2SMSCheckInterval(configIntervals.value.level2SMSCheckMinutes)
    await fetchConfigIntervals()
    tacoStore.showSuccess('Level 2 SMS check interval updated')
  } catch (error) {
    tacoStore.showError('Failed to update Level 2 SMS interval: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchConfigIntervals() {
  try {
    const intervals = await tacoStore.getConfigurationIntervals()
    configIntervals.value = intervals
  } catch (error) {
    console.error('Failed to fetch configuration intervals:', error)
  }
}

async function refreshConfigIntervals() {
  loading.value = true
  try {
    await fetchConfigIntervals()
    tacoStore.showSuccess('Configuration refreshed')
  } catch (error) {
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
  } catch (error) {
    tacoStore.showError('Failed to toggle monitoring: ' + error.message)
  } finally {
    loading.value = false
  }
}

function handleConfirm() {
  showConfirmModal.value = false
  confirmModal.value.action()
}

// Canister monitoring methods
async function addMonitoredCanister() {
  if (!isCanisterFormValid.value) return
  
  loading.value = true
  try {
    const minimumCycles = BigInt(newCanister.value.minimumCycles)
    const snsRootCanisterId = newCanister.value.isSNSControlled ? newCanister.value.snsRootCanisterId : null
    
    await tacoStore.addMonitoredCanister(
      newCanister.value.canisterId,
      newCanister.value.name,
      newCanister.value.isSNSControlled,
      snsRootCanisterId,
      minimumCycles,
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
    
    await fetchMonitoredCanisters()
    tacoStore.showSuccess('Canister added for monitoring')
  } catch (error) {
    tacoStore.showError('Failed to add canister: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchMonitoredCanisters() {
  try {
    monitoredCanisters.value = await tacoStore.getMonitoredCanisters()
  } catch (error) {
    console.error('Failed to fetch monitored canisters:', error)
  }
}

async function toggleCanisterStatus(configId: number, enabled: boolean) {
  loading.value = true
  try {
    await tacoStore.updateMonitoredCanisterStatus(configId, enabled)
    await fetchMonitoredCanisters()
    tacoStore.showSuccess(`Canister ${enabled ? 'enabled' : 'disabled'}`)
  } catch (error) {
    tacoStore.showError('Failed to update canister status: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function removeMonitoredCanister(configId: number) {
  confirmModal.value = {
    title: 'Remove Monitored Canister',
    message: 'Are you sure you want to remove this canister from monitoring? This action cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    action: async () => {
      loading.value = true
      try {
        await tacoStore.removeMonitoredCanister(configId)
        await fetchMonitoredCanisters()
        tacoStore.showSuccess('Canister removed from monitoring')
      } catch (error) {
        tacoStore.showError('Failed to remove canister: ' + error.message)
      } finally {
        loading.value = false
      }
    }
  }
  showConfirmModal.value = true
}

async function toggleCanisterMonitoring() {
  loading.value = true
  try {
    if (systemStatus.value.canisterMonitoringEnabled) {
      await tacoStore.stopCanisterMonitoring()
      tacoStore.showSuccess('Canister monitoring stopped')
    } else {
      await tacoStore.startCanisterMonitoring()
      tacoStore.showSuccess('Canister monitoring started')
    }
    await fetchSystemStatus()
  } catch (error) {
    tacoStore.showError('Failed to toggle canister monitoring: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function fetchCanisterHealthStatus() {
  loading.value = true
  try {
    const healthStatus = await tacoStore.getCanisterHealthStatus()
    // You could show this in a modal or update the UI to show health status
    console.log('Canister Health Status:', healthStatus)
    tacoStore.showSuccess('Health status check completed - see console for details')
  } catch (error) {
    tacoStore.showError('Failed to fetch health status: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Message history methods
async function fetchMessageHistory() {
  try {
    let messages = []
    const limit = messageLimit.value
    
    switch (activeHistoryTab.value) {
      case 'sms':
        messages = await tacoStore.getSentSMSMessages(limit)
        break
      case 'email':
        messages = await tacoStore.getSentEmailMessages(limit)
        break
      default:
        messages = await tacoStore.getSentMessages(limit)
        break
    }
    
    sentMessages.value = messages
  } catch (error) {
    console.error('Failed to fetch message history:', error)
    sentMessages.value = []
  }
}

// Admin actions methods
async function fetchAdminActions() {
  try {
    adminActions.value = await tacoStore.getAdminActionLogs(25)
  } catch (error) {
    console.error('Failed to fetch admin actions:', error)
    adminActions.value = []
  }
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

function formatTimestamp(timestamp: number): string {
  if (!timestamp) return 'N/A'
  return new Date(timestamp / 1000000).toLocaleString()
}

function formatTimeRemaining(futureTimestamp: number): string {
  if (!futureTimestamp) return 'N/A'
  const now = Date.now() * 1000000 // Convert to nanoseconds
  const remaining = Math.max(0, futureTimestamp - now)
  const minutes = Math.floor(remaining / 60000000000) // Convert from nanoseconds to minutes
  return `${minutes} minutes`
}

function formatCanisterId(principalId: any): string {
  const id = typeof principalId === 'object' ? principalId.toText() : principalId.toString()
  return id.length > 15 ? `${id.slice(0, 8)}...${id.slice(-5)}` : id
}

function formatCycles(cycles: any): string {
  const num = typeof cycles === 'bigint' ? Number(cycles) : Number(cycles)
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return num.toString()
}

function formatMessageType(messageType: any): string {
  if (messageType.SMS !== undefined) return 'SMS'
  if (messageType.Email !== undefined) return 'Email'
  return messageType || 'Unknown'
}

function getMessageTypeClass(messageType: any): string {
  if (messageType.SMS !== undefined) return 'sms'
  if (messageType.Email !== undefined) return 'email'
  return ''
}

function truncateMessage(message: string): string {
  if (message.length <= 50) return message
  return message.substring(0, 50) + '...'
}
</script>