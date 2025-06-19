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
                <!-- View Mode Toggle -->
                <div class="form-check form-switch ms-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="viewMode" 
                    v-model="overviewMode"
                  >
                  <label class="form-check-label text-white" for="viewMode">
                    {{ overviewMode ? 'Overview' : 'Detailed' }} View
                  </label>
                </div>
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
                  <!-- Overview Mode -->
                  <div v-if="overviewMode">
                    <!-- Debug header to confirm overview mode is active -->
                    <div class="overview-mode-header">
                      📊 Overview Mode Active - Showing {{ processedLogs.length }} processed entries
                    </div>
                    <div 
                      v-for="(entry, index) in processedLogs" 
                      :key="index"
                      class="log-entry"
                      :class="entry.type === 'portfolio' ? 'log-portfolio' : entry.type === 'allocation' ? 'log-allocation' : getLogLevelClass(entry.level)"
                    >
                      <!-- Portfolio State Table -->
                      <div v-if="entry.type === 'portfolio'" class="portfolio-summary">
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level level-info">INFO</div>
                          <div class="log-context">PORTFOLIO_STATE</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="portfolio-table-container mt-2">
                          <div class="portfolio-summary-header">
                            {{ entry.summaryMessage }}
                          </div>
                          <table class="portfolio-table">
                            <thead>
                              <tr>
                                <th>Token</th>
                                <th>Balance</th>
                                <th>ICP Price</th>
                                <th>USD Price</th>
                                <th>ICP Value</th>
                                <th>USD Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="token in entry.tokens" :key="token.symbol" class="token-row">
                                <td class="token-symbol">{{ token.symbol }}</td>
                                <td class="token-balance">{{ token.balance }}</td>
                                <td class="token-price">{{ token.priceICP }}</td>
                                <td class="token-price">{{ token.priceUSD }}</td>
                                <td class="token-value">{{ token.valueICP }}</td>
                                <td class="token-value">{{ token.valueUSD }}</td>
                              </tr>
                              <!-- Totals Row -->
                              <tr class="totals-row">
                                <td><strong>TOTAL</strong></td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td><strong>{{ entry.totalICP }}</strong></td>
                                <td><strong>{{ entry.totalUSD }}</strong></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <!-- Allocation Analysis Table -->
                      <div v-else-if="entry.type === 'allocation'" class="allocation-summary">
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level level-info">INFO</div>
                          <div class="log-context">ALLOCATION_ANALYSIS</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="allocation-table-container mt-2">
                          <div class="allocation-summary-header">
                            {{ entry.summaryMessage }}
                          </div>
                          <table class="allocation-table">
                            <thead>
                              <tr>
                                <th>Token</th>
                                <th>Current %</th>
                                <th>Target %</th>
                                <th>Difference</th>
                                <th>Status</th>
                                <th>Value (ICP)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="token in entry.tokens" :key="token.symbol" class="allocation-row" :class="token.statusClass">
                                <td class="token-symbol">{{ token.symbol }}</td>
                                <td class="allocation-percent">{{ token.currentPercent }}%</td>
                                <td class="allocation-percent">{{ token.targetPercent }}%</td>
                                <td class="allocation-diff" :class="token.diffClass">{{ token.difference }}</td>
                                <td class="allocation-status">{{ token.status }}</td>
                                <td class="token-value">{{ token.value }}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div class="allocation-summary-stats mt-2">
                            {{ entry.summaryStats }}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Regular Log Entry -->
                      <div v-else>
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level" :class="'level-' + entry.level.toLowerCase()">{{ entry.level }}</div>
                          <div class="log-context">{{ entry.context }}</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="log-message">{{ entry.message }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Detailed Mode (Original) -->
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
      overviewMode: false,
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
    },
    
    processedLogs() {
      if (!this.overviewMode) return this.filteredLogs;
      
      console.log('Processing logs for overview mode, total logs:', this.filteredLogs.length);
      
      const processed = [];
      let i = 0;
      
      while (i < this.filteredLogs.length) {
        const log = this.filteredLogs[i];
        
        // Debug: Log what we're checking
        if (log.context === 'logPortfolioState') {
          console.log('Found logPortfolioState log:', log.message);
        }
        
        // Check if this is a portfolio state summary log
        if (log.context === 'logPortfolioState' && log.message.includes('Portfolio Summary:')) {
          console.log('Found portfolio summary, processing group...');
          const portfolioEntry = this.processPortfolioStateGroup(i);
          if (portfolioEntry) {
            console.log('Successfully processed portfolio group:', portfolioEntry);
            processed.push(portfolioEntry.entry);
            i = portfolioEntry.nextIndex;
            continue;
          } else {
            console.log('Failed to process portfolio group');
          }
        }
        
        // Check if this is an allocation analysis group
        if (log.context === 'calculateTradeRequirements' && log.component === 'ALLOCATION_ANALYSIS' && log.message.includes('Starting allocation analysis')) {
          console.log('Found allocation analysis, processing group...');
          const allocationEntry = this.processAllocationAnalysisGroup(i);
          if (allocationEntry) {
            console.log('Successfully processed allocation analysis group:', allocationEntry);
            processed.push(allocationEntry.entry);
            i = allocationEntry.nextIndex;
            continue;
          } else {
            console.log('Failed to process allocation analysis group');
          }
        }
        
        // Regular log entry
        processed.push({
          type: 'regular',
          timestamp: log.timestamp,
          level: log.level,
          context: log.context,
          component: log.component,
          message: log.message
        });
        
        i++;
      }
      
      console.log('Processed logs result:', processed);
      return processed;
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
    },
    
    processPortfolioStateGroup(startIndex) {
      const logs = this.filteredLogs;
      const summaryLog = logs[startIndex];
      
      console.log('Processing portfolio group starting at:', startIndex, summaryLog);
      
      if (!summaryLog || !summaryLog.message.includes('Portfolio Summary:')) {
        console.log('Not a portfolio summary log');
        return null;
      }
      
      // Extract summary info from the first log
      const summaryMessage = summaryLog.message;
      console.log('Summary message:', summaryMessage);
      
      // Parse tokens from subsequent logs
      const tokens = [];
      let i = startIndex + 1;
      
      console.log('Looking for token logs starting at index:', i);
      
              // Look for token logs that follow the pattern: "Token: SYMBOL (address): Balance=... ICP_Value=... USD_Value=... Price_ICP=... Price_USD=... Status=Active"
        while (i < logs.length && 
               logs[i].context === 'logPortfolioState' && 
               logs[i].message.includes('Token:')) {
        
        const tokenLog = logs[i];
        const message = tokenLog.message;
        
        console.log('Checking token log:', message);
        
        // Only process active tokens
        if (message.includes('Status=Active')) {
          console.log('Found active token log, parsing...');
          
          // More flexible regex to handle different number formats
          const tokenMatch = message.match(/Token: (\w+) \([^)]+\): Balance=([0-9.]+) ICP_Value=([0-9.]+) USD_Value=([0-9.]+) Price_ICP=([0-9.]+) Price_USD=([0-9.]+) Status=Active/);
          
          if (tokenMatch) {
            console.log('Successfully parsed token:', tokenMatch[1]);
            tokens.push({
              symbol: tokenMatch[1],
              balance: tokenMatch[2],
              valueICP: tokenMatch[3],
              valueUSD: tokenMatch[4],
              priceICP: tokenMatch[5],
              priceUSD: tokenMatch[6]
            });
          } else {
            console.log('Failed to parse token with regex, trying simpler approach...');
            
            // Fallback: try to extract just the symbol for now
            const symbolMatch = message.match(/Token: (\w+)/);
            if (symbolMatch) {
              tokens.push({
                symbol: symbolMatch[1],
                balance: 'N/A',
                valueICP: 'N/A',
                valueUSD: 'N/A',
                priceICP: 'N/A',
                priceUSD: 'N/A'
              });
            }
          }
        } else {
          console.log('Skipping inactive/paused token');
        }
        
        i++;
      }
      
      console.log('Found', tokens.length, 'active tokens');
      
      // Extract totals from summary message
      const totalICPMatch = summaryMessage.match(/Total_ICP=([0-9.]+)/);
      const totalUSDMatch = summaryMessage.match(/Total_USD=([0-9.]+)/);
      
      console.log('Extracted totals - ICP:', totalICPMatch, 'USD:', totalUSDMatch);
      
      return {
        entry: {
          type: 'portfolio',
          timestamp: summaryLog.timestamp,
          component: summaryLog.component,
          summaryMessage: summaryMessage,
          tokens: tokens,
          totalICP: totalICPMatch ? totalICPMatch[1] + ' ICP' : '0 ICP',
          totalUSD: totalUSDMatch ? '$' + totalUSDMatch[1] : '$0'
        },
        nextIndex: i
      };
    },
    
    processAllocationAnalysisGroup(startIndex) {
      const logs = this.filteredLogs;
      const startLog = logs[startIndex];
      
      console.log('Processing allocation analysis group starting at:', startIndex, startLog);
      
      if (!startLog || !startLog.message.includes('Starting allocation analysis')) {
        console.log('Not an allocation analysis start log');
        return null;
      }
      
      // Extract summary info from the first log
      const summaryMessage = startLog.message;
      console.log('Allocation summary message:', summaryMessage);
      
      // Parse tokens and analysis from subsequent logs
      const tokens = [];
      let summaryStats = '';
      let i = startIndex + 1;
      
      console.log('Looking for allocation logs starting at index:', i);
      
      // Process all allocation analysis logs in this group
      while (i < logs.length && 
             logs[i].context === 'calculateTradeRequirements' && 
             logs[i].component === 'ALLOCATION_ANALYSIS') {
        
        const log = logs[i];
        const message = log.message;
        
        console.log('Processing allocation log:', message);
        
        // Parse target allocation logs
        if (message.includes('Target allocation -')) {
          const targetMatch = message.match(/Target allocation - (\w+) \([^)]+\): (\d+)bp \(([0-9.]+)%\)/);
          if (targetMatch) {
            const symbol = targetMatch[1];
            const basisPoints = targetMatch[2];
            const percentage = targetMatch[3];
            
            // Find or create token entry
            let token = tokens.find(t => t.symbol === symbol);
            if (!token) {
              token = { symbol: symbol };
              tokens.push(token);
            }
            token.targetPercent = percentage;
            token.targetBasisPoints = basisPoints;
          }
        }
        
        // Parse token analysis logs (current vs target)
        else if (message.includes('Token analysis -')) {
          const analysisMatch = message.match(/Token analysis - (\w+): Current=(\d+)bp Target=(\d+)bp Diff=(\w+) ([+-]\d+)bp Value=([0-9.]+)ICP/);
          if (analysisMatch) {
            const symbol = analysisMatch[1];
            const currentBp = analysisMatch[2];
            const targetBp = analysisMatch[3];
            const status = analysisMatch[4];
            const diffBp = analysisMatch[5];
            const value = analysisMatch[6];
            
            // Find or create token entry
            let token = tokens.find(t => t.symbol === symbol);
            if (!token) {
              token = { symbol: symbol };
              tokens.push(token);
            }
            
            token.currentPercent = (parseInt(currentBp) / 100).toFixed(1);
            token.targetPercent = (parseInt(targetBp) / 100).toFixed(1);
            token.difference = diffBp + 'bp';
            token.status = status;
            token.value = value + ' ICP';
            token.statusClass = status === 'OVERWEIGHT' ? 'overweight' : 'underweight';
            token.diffClass = diffBp.startsWith('+') ? 'positive-diff' : 'negative-diff';
          }
        }
        
        // Parse allocation summary
        else if (message.includes('Allocation summary -')) {
          summaryStats = message.replace('Allocation summary - ', '');
        }
        
        i++;
      }
      
      console.log('Found', tokens.length, 'tokens in allocation analysis');
      console.log('Summary stats:', summaryStats);
      
      return {
        entry: {
          type: 'allocation',
          timestamp: startLog.timestamp,
          component: startLog.context,
          summaryMessage: summaryMessage,
          tokens: tokens,
          summaryStats: summaryStats
        },
        nextIndex: i
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

/* Overview Mode Styles */
.overview-mode-header {
  background: #28a745;
  color: white;
  padding: 8px 16px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
}

/* Portfolio State Styles */
.log-portfolio {
  background: rgba(13, 110, 253, 0.1);
  border-left: 4px solid #0d6efd;
}

.portfolio-summary-header {
  color: #e9ecef;
  font-size: 0.875rem;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #495057;
}

.portfolio-table-container {
  overflow-x: auto;
}

.portfolio-table {
  width: 100%;
  font-size: 0.75rem;
  border-collapse: collapse;
  margin-top: 4px;
}

.portfolio-table th {
  background: #495057;
  color: #fff;
  padding: 6px 8px;
  text-align: left;
  font-weight: bold;
  border: 1px solid #6c757d;
}

.portfolio-table td {
  padding: 4px 8px;
  border: 1px solid #495057;
  color: #e9ecef;
}

.token-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.token-symbol {
  font-weight: bold;
  color: #17a2b8 !important;
}

.token-balance,
.token-price,
.token-value {
  font-family: 'Courier New', monospace;
  text-align: right;
}

.totals-row {
  background: rgba(40, 167, 69, 0.2);
  border-top: 2px solid #28a745;
}

.totals-row td {
  font-weight: bold;
  color: #28a745 !important;
}

/* Allocation Analysis Styles */
.log-allocation {
  background: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
}

.allocation-summary-header {
  color: #e9ecef;
  font-size: 0.875rem;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #495057;
}

.allocation-table-container {
  overflow-x: auto;
}

.allocation-table {
  width: 100%;
  font-size: 0.75rem;
  border-collapse: collapse;
  margin-top: 4px;
}

.allocation-table th {
  background: #495057;
  color: #fff;
  padding: 6px 8px;
  text-align: left;
  font-weight: bold;
  border: 1px solid #6c757d;
}

.allocation-table td {
  padding: 4px 8px;
  border: 1px solid #495057;
  color: #e9ecef;
}

.allocation-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.allocation-row.overweight {
  background: rgba(220, 53, 69, 0.1);
}

.allocation-row.underweight {
  background: rgba(13, 202, 240, 0.1);
}

.allocation-percent,
.token-value {
  font-family: 'Courier New', monospace;
  text-align: right;
}

.allocation-diff {
  font-family: 'Courier New', monospace;
  text-align: right;
  font-weight: bold;
}

.allocation-diff.positive-diff {
  color: #0dcaf0 !important;
}

.allocation-diff.negative-diff {
  color: #dc3545 !important;
}

.allocation-status {
  font-weight: bold;
  text-align: center;
}

.allocation-summary-stats {
  background: rgba(255, 193, 7, 0.1);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #ffc107;
  border: 1px solid #ffc107;
}
</style> 