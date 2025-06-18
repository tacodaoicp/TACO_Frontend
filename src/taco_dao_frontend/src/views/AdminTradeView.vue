<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="📈" title="Treasury Trading Logs" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Back to Admin Button -->
          <div class="mb-3">
            <router-link to="/admin" class="btn btn-secondary">
              ← Back to Admin Panel
            </router-link>
          </div>
          
          <!-- Controls Panel -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Log Controls</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="refreshLogs" :disabled="isLoading">
                  {{ isLoading ? 'Loading...' : 'Refresh Logs' }}
                </button>
                <button class="btn btn-warning" @click="clearLogs" :disabled="isLoading">
                  Clear All Logs
                </button>
                <div class="form-check form-switch ms-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="autoRefresh" 
                    v-model="autoRefresh"
                  >
                  <label class="form-check-label text-white" for="autoRefresh">
                    Auto-refresh (30s)
                  </label>
                </div>
              </div>
            </div>
            
            <div class="card-body">
              <!-- Filter Controls -->
              <div class="row mb-3">
                <div class="col-md-3">
                  <label class="form-label">Log Context</label>
                  <select class="form-select" v-model="selectedContext" @change="refreshLogs">
                    <option value="ALL">All Contexts</option>
                    <option value="REBALANCE_CYCLE">Rebalance Cycle</option>
                    <option value="PORTFOLIO_STATE">Portfolio State</option>
                    <option value="ALLOCATION_ANALYSIS">Allocation Analysis</option>
                    <option value="PAIR_SELECTION">Pair Selection</option>
                    <option value="EXCHANGE_COMPARISON">Exchange Comparison</option>
                    <option value="TRADE_EXECUTION">Trade Execution</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Log Level</label>
                  <select class="form-select" v-model="selectedLevel" @change="refreshLogs">
                    <option value="ALL">All Levels</option>
                    <option value="INFO">Info</option>
                    <option value="WARN">Warning</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Number of Logs</label>
                  <select class="form-select" v-model="logCount" @change="refreshLogs">
                    <option :value="50">50 logs</option>
                    <option :value="100">100 logs</option>
                    <option :value="200">200 logs</option>
                    <option :value="500">500 logs</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Search</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="Search logs..." 
                    v-model="searchTerm"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Trading Status Summary -->
          <div class="card bg-dark text-white mb-4" v-if="tradingStatus">
            <div class="card-header">
              <h3 class="mb-0">Current Trading Status</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Status</label>
                    <div class="value" :class="getStatusClass(getStatusText(tradingStatus.rebalanceStatus))">
                      {{ getStatusText(tradingStatus.rebalanceStatus) }}
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Total Trades</label>
                    <div class="value">{{ tradingStatus.metrics?.totalTradesExecuted || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Failed Trades</label>
                    <div class="value text-danger">{{ tradingStatus.metrics?.totalTradesFailed || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Success Rate</label>
                    <div class="value">{{ tradingStatus.metrics?.successRate ? (tradingStatus.metrics.successRate * 100).toFixed(1) : '0.0' }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Logs Display -->
          <div class="card bg-dark text-white">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Trading Logs</h3>
              <div class="text-muted">
                {{ filteredLogs.length }} of {{ logs.length }} logs
                <span v-if="lastRefresh"> | Last updated: {{ formatTime(lastRefresh) }}</span>
              </div>
            </div>
            
            <div class="card-body p-0">
              <div class="logs-container" style="max-height: 800px; overflow-y: auto;">
                <div v-if="isLoading" class="text-center p-4">
                  <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <div class="mt-2">Loading logs...</div>
                </div>
                
                <div v-else-if="filteredLogs.length === 0" class="text-center p-4 text-muted">
                  No logs found matching the current filters.
                </div>
                
                <div v-else>
                  <div 
                    v-for="(log, index) in filteredLogs" 
                    :key="index"
                    class="log-entry"
                    :class="getLogLevelClass(log.level)"
                  >
                    <div class="log-header">
                      <div class="log-timestamp">{{ formatLogTime(log.timestamp) }}</div>
                      <div class="log-level" :class="'level-' + log.level.toLowerCase()">{{ log.level }}</div>
                      <div class="log-context">{{ log.context }}</div>
                      <div class="log-component">{{ log.component }}</div>
                    </div>
                    <div class="log-message">{{ log.message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { useTacoStore } from '../stores/taco.store'
import { mapStores } from 'pinia'

export default {
  name: 'AdminTradeView',
  components: {
    HeaderBar,
    TacoTitle
  },
  data() {
    return {
      logs: [],
      tradingStatus: null,
      isLoading: false,
      selectedContext: 'ALL',
      selectedLevel: 'ALL',
      logCount: 100,
      searchTerm: '',
      autoRefresh: false,
      refreshInterval: null,
      lastRefresh: null,
      error: null
    }
  },
  computed: {
    ...mapStores(useTacoStore),
    filteredLogs() {
      let filtered = this.logs;
      
      // Filter by search term
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          log.context.toLowerCase().includes(searchLower) ||
          log.component.toLowerCase().includes(searchLower)
        );
      }
      
      return filtered;
    }
  },
  watch: {
    autoRefresh(newVal) {
      if (newVal) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }
  },
  async mounted() {
    await this.refreshLogs();
    await this.refreshTradingStatus();
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  },
  methods: {
    async refreshLogs() {
      this.isLoading = true;
      this.error = null;
      
      try {
        let logsResult;
        if (this.selectedContext === 'ALL' && this.selectedLevel === 'ALL') {
          logsResult = await this.tacoStore.getTreasuryLogs(this.logCount);
        } else if (this.selectedContext !== 'ALL' && this.selectedLevel === 'ALL') {
          logsResult = await this.tacoStore.getTreasuryLogsByContext(this.selectedContext, this.logCount);
        } else if (this.selectedContext === 'ALL' && this.selectedLevel !== 'ALL') {
          // Convert level string to the expected format
          const levelMap = {
            'INFO': { INFO: null },
            'WARN': { WARN: null },
            'ERROR': { ERROR: null }
          };
          logsResult = await this.tacoStore.getTreasuryLogsByLevel(levelMap[this.selectedLevel], this.logCount);
        } else {
          // Get by context first, then filter by level client-side
          logsResult = await this.tacoStore.getTreasuryLogsByContext(this.selectedContext, this.logCount);
          if (this.selectedLevel !== 'ALL') {
            logsResult = logsResult.filter(log => 
              Object.keys(log.level)[0] === this.selectedLevel
            );
          }
        }
        
        // Transform logs to have consistent structure
        this.logs = logsResult.map(log => ({
          timestamp: Number(log.timestamp),
          level: Object.keys(log.level)[0], // Extract level from variant
          context: log.context,
          message: log.message,
          component: log.component
        })); // Keep backend order - no sorting needed
        
        this.lastRefresh = Date.now();
        
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        this.error = error.message || 'Failed to fetch logs';
      } finally {
        this.isLoading = false;
      }
    },
    
    async refreshTradingStatus() {
      try {
        await this.tacoStore.getTradingStatus();
        // Get the trading status from store state
        const storeStatus = this.tacoStore.fetchedTradingStatus;
        if (storeStatus && storeStatus.ok) {
          this.tradingStatus = storeStatus.ok;
        } else {
          console.warn('Trading status not available or in error state:', storeStatus);
          this.tradingStatus = null;
        }
      } catch (error) {
        console.error('Failed to fetch trading status:', error);
        this.tradingStatus = null;
      }
    },
    
    async clearLogs() {
      if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
        return;
      }
      
      try {
        await this.tacoStore.clearTreasuryLogs();
        this.logs = [];
        this.lastRefresh = Date.now();
      } catch (error) {
        console.error('Failed to clear logs:', error);
        this.error = error.message || 'Failed to clear logs';
      }
    },
    
    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.refreshLogs();
        this.refreshTradingStatus();
      }, 30000); // 30 seconds
    },
    
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },
    
    formatTime(timestamp) {
      if (!timestamp) return 'Never';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    
    formatLogTime(timestamp) {
      const date = new Date(Number(timestamp) / 1000000); // Convert from nanoseconds
      return date.toLocaleString();
    },
    
    getLogLevelClass(level) {
      return {
        'log-info': level === 'INFO',
        'log-warn': level === 'WARN', 
        'log-error': level === 'ERROR'
      };
    },
    
    getStatusText(status) {
      if (!status) return 'Unknown';
      if (status.Idle !== undefined) return 'Idle';
      if (status.Trading !== undefined) return 'Trading';
      if (status.Failed !== undefined) return `Failed: ${status.Failed}`;
      return 'Unknown';
    },
    
    getStatusClass(status) {
      return {
        'text-success': status === 'Trading',
        'text-warning': status === 'Idle',
        'text-danger': status.startsWith && status.startsWith('Failed')
      };
    }
  }
}
</script>

<style scoped>
.metric-item {
  text-align: center;
  padding: 1rem;
  border: 1px solid #495057;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.metric-item label {
  display: block;
  font-size: 0.875rem;
  color: #adb5bd;
  margin-bottom: 0.5rem;
}

.metric-item .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
}

.logs-container {
  background: #1a1a1a;
}

.log-entry {
  padding: 12px 16px;
  border-bottom: 1px solid #333;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.75rem;
}

.log-timestamp {
  color: #6c757d;
  min-width: 140px;
}

.log-level {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.level-info {
  background: #0d6efd;
  color: white;
}

.level-warn {
  background: #ffc107;
  color: black;
}

.level-error {
  background: #dc3545;
  color: white;
}

.log-context {
  background: #495057;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 120px;
  text-align: center;
}

.log-component {
  color: #adb5bd;
  font-style: italic;
}

.log-message {
  color: #fff;
  word-break: break-word;
  white-space: pre-wrap;
}

.log-info {
  border-left: 3px solid #0d6efd;
}

.log-warn {
  border-left: 3px solid #ffc107;
}

.log-error {
  border-left: 3px solid #dc3545;
}
</style> 