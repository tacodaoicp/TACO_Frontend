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
                      :class="entry.type === 'portfolio' ? 'log-portfolio' : entry.type === 'allocation' ? 'log-allocation' : entry.type === 'tradingCycleHeader' ? 'trading-cycle-header' : getLogLevelClass(entry.level)"
                    >
                      <!-- Trading Cycle Header -->
                      <div v-if="entry.type === 'tradingCycleHeader'" class="trading-cycle-header-content">
                        <div class="cycle-header-main" @click="toggleCycle(entry.cycleId)">
                          <div class="cycle-expand-icon">
                            {{ isCycleExpanded(entry.cycleId) ? '▼' : '▶' }}
                          </div>
                          <div class="cycle-header-info">
                            <div class="cycle-title">🔄 Trading Cycle</div>
                            <div class="cycle-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                            <div class="cycle-status" :class="'status-' + (entry.status || '').toLowerCase()">
                              Status: {{ entry.status }}
                            </div>
                          </div>
                        </div>
                      </div>
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
                      
                      <!-- Pair Selection Summary -->
                      <div v-else-if="entry.type === 'pairSelection'" class="pair-selection-summary" :class="{ 'failed': entry.failed }">
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level" :class="entry.failed ? 'level-warn' : 'level-info'">{{ entry.failed ? 'WARN' : 'INFO' }}</div>
                          <div class="log-context">PAIR_SELECTION</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="pair-selection-container mt-2">
                          <div class="pair-selection-header">
                            {{ entry.summaryMessage }}
                          </div>
                          <div class="pair-selection-result">
                            <!-- Success case -->
                            <div v-if="!entry.failed" class="pair-flow">
                              <div class="token-box sell-token">
                                <div class="token-label">SELL</div>
                                <div class="token-symbol">{{ entry.sellToken }}</div>
                                <div class="token-weight">Weight: {{ entry.sellWeight }}</div>
                              </div>
                              <div class="arrow">→</div>
                              <div class="token-box buy-token">
                                <div class="token-label">BUY</div>
                                <div class="token-symbol">{{ entry.buyToken }}</div>
                                <div class="token-weight">Weight: {{ entry.buyWeight }}</div>
                              </div>
                            </div>
                            <!-- Failure case -->
                            <div v-else class="pair-failure">
                              <div class="failure-icon">⚠️</div>
                              <div class="failure-message">{{ entry.failureReason }}</div>
                              <div class="failure-details">
                                <div class="failure-stat">
                                  <span class="stat-label">Total Candidates:</span>
                                  <span class="stat-value">{{ entry.totalCandidates }}</span>
                                </div>
                                <div class="failure-stat">
                                  <span class="stat-label">Required:</span>
                                  <span class="stat-value">{{ entry.minRequired }}</span>
                                </div>
                              </div>
                            </div>
                            <div class="pair-stats mt-2">
                              {{ entry.failed ? '' : entry.candidateStats }}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Trade Sizing Summary -->
                      <div v-else-if="entry.type === 'tradeSizing'" class="trade-sizing-summary">
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level level-info">INFO</div>
                          <div class="log-context">TRADE_SIZING</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="trade-sizing-container mt-2">
                          <div class="trade-sizing-header">
                            {{ entry.summaryMessage }}
                          </div>
                          <div class="trade-sizing-details">
                            <div class="sizing-strategy">
                              <div class="strategy-box">
                                <div class="strategy-label">TARGETING STRATEGY</div>
                                <div class="strategy-value">{{ entry.strategy }}</div>
                                <div class="strategy-reason">{{ entry.reason }}</div>
                              </div>
                              <div class="sizing-metrics">
                                <div class="metric-row">
                                  <span class="metric-label">Sell Diff:</span>
                                  <span class="metric-value">{{ entry.sellDiff }}</span>
                                </div>
                                <div class="metric-row">
                                  <span class="metric-label">Buy Diff:</span>
                                  <span class="metric-value">{{ entry.buyDiff }}</span>
                                </div>
                                <div class="metric-row">
                                  <span class="metric-label">Portfolio:</span>
                                  <span class="metric-value">{{ entry.portfolioValue }}</span>
                                </div>
                                <div class="metric-row">
                                  <span class="metric-label">Max Threshold:</span>
                                  <span class="metric-value">{{ entry.maxThreshold }}</span>
                                </div>
                              </div>
                            </div>
                            <div class="trade-amount">
                              <div class="amount-box">
                                <div class="amount-label">CALCULATED TRADE SIZE</div>
                                <div class="amount-value">{{ entry.icpValue }}</div>
                                <div class="amount-raw">{{ entry.rawAmount }} (raw)</div>
                                <div class="amount-limits">
                                  <span class="limit-min">Min: {{ entry.minAllowed }}</span>
                                  <span class="limit-max">Max: {{ entry.maxAllowed }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Exchange Comparison Summary -->
                      <div v-else-if="entry.type === 'exchangeComparison'" class="exchange-comparison-summary">
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level level-info">INFO</div>
                          <div class="log-context">EXCHANGE_COMPARISON</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="exchange-comparison-container mt-2">
                          <div class="exchange-comparison-header">
                            {{ entry.summaryMessage }}
                          </div>
                          <div class="comparison-details">
                            <div class="trade-info">
                              <div class="trade-pair">{{ entry.pair }}</div>
                              <div class="trade-amount">{{ entry.amountFormatted }}</div>
                              <div class="trade-slippage">Max Slippage: {{ entry.maxSlippage }}</div>
                            </div>
                            <div class="exchanges-comparison">
                              <div v-for="exchange in entry.exchanges" :key="exchange.name" 
                                   class="exchange-card" :class="{ 'selected': exchange.selected, 'not-selected': exchange.notSelected }">
                                <div class="exchange-header">
                                  <div class="exchange-name">{{ exchange.name }}</div>
                                  <div class="exchange-status" :class="exchange.statusClass">{{ exchange.status }}</div>
                                </div>
                                                                 <div class="exchange-details">
                                   <div class="exchange-metric">
                                     <span class="metric-label">Amount Out:</span>
                                     <span class="metric-value">{{ formatExchangeAmount(exchange.amountOut, entry.buyTokenDecimals) }}</span>
                                   </div>
                                  <div class="exchange-metric">
                                    <span class="metric-label">Slippage:</span>
                                    <span class="metric-value">{{ exchange.slippage }}</span>
                                  </div>
                                  <div v-if="exchange.price" class="exchange-metric">
                                    <span class="metric-label">Price:</span>
                                    <span class="metric-value">{{ exchange.price }}</span>
                                  </div>
                                  <div v-if="exchange.poolInfo" class="exchange-pool-info">
                                    {{ exchange.poolInfo }}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="final-selection">
                              <div class="selection-winner">
                                🏆 Winner: {{ entry.selectedExchange }}
                              </div>
                              <div class="selection-details">
                                Best Amount: {{ entry.bestAmount }} | Best Slippage: {{ entry.bestSlippage }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Trade Execution Summary -->
                      <div v-else-if="entry.type === 'tradeExecution'" class="trade-execution-summary" :class="{ 'success': entry.finalResult?.success, 'failed': !entry.finalResult?.success }">
                        <div class="log-header">
                          <div class="log-timestamp">{{ formatLogTime(entry.timestamp) }}</div>
                          <div class="log-level" :class="entry.finalResult?.success ? 'level-info' : 'level-error'">{{ entry.finalResult?.success ? 'INFO' : 'ERROR' }}</div>
                          <div class="log-context">TRADE_EXECUTION</div>
                          <div class="log-component">{{ entry.component }}</div>
                        </div>
                        <div class="trade-execution-container mt-2">
                          <div class="trade-execution-header">
                            {{ entry.summaryMessage }}
                          </div>
                          
                          <!-- Trade Overview -->
                          <div class="trade-overview">
                            <div class="trade-basic-info">
                              <div class="trade-pair-display">
                                <span class="pair-label">Trading Pair:</span>
                                <span class="pair-value">{{ entry.pair }}</span>
                              </div>
                              <div class="trade-exchange">
                                <span class="exchange-label">Exchange:</span>
                                <span class="exchange-value">{{ entry.exchange }}</span>
                              </div>
                              <div class="trade-amount-in">
                                <span class="amount-label">Amount In:</span>
                                <span class="amount-value">{{ entry.amountFormatted }}</span>
                                <span class="amount-raw">({{ entry.amountIn }} raw)</span>
                              </div>
                              <div class="trade-min-out">
                                <span class="min-label">Min Expected:</span>
                                <span class="min-value">{{ entry.minAmountFormatted }}</span>
                                <span class="min-raw">({{ entry.minAmountOut }} raw)</span>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Trade Steps -->
                          <div v-if="entry.tradeSteps && entry.tradeSteps.length > 0" class="trade-steps">
                            <div class="steps-header">Execution Steps:</div>
                            <div class="steps-list">
                              <div v-for="(step, index) in entry.tradeSteps" :key="index" class="trade-step" :class="step.type">
                                <!-- KongSwap Preparation -->
                                <div v-if="step.type === 'preparation'" class="step-content">
                                  <div class="step-icon">⚙️</div>
                                  <div class="step-details">
                                    <div class="step-title">{{ step.exchange }} Preparation</div>
                                    <div class="step-info">
                                      <span>Slippage: {{ step.slippageTolerance }}%</span>
                                      <span>Deadline: {{ step.deadline }}s</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <!-- KongSwap Execution Start -->
                                <div v-else-if="step.type === 'execution_start'" class="step-content">
                                  <div class="step-icon">🚀</div>
                                  <div class="step-details">
                                    <div class="step-title">{{ step.exchange }} Execution Started</div>
                                    <div class="step-info">{{ step.status }}</div>
                                  </div>
                                </div>
                                
                                <!-- ICPSwap Pool Validation -->
                                <div v-else-if="step.type === 'pool_validation'" class="step-content">
                                  <div class="step-icon">🔍</div>
                                  <div class="step-details">
                                    <div class="step-title">{{ step.exchange }} Pool Validation</div>
                                    <div class="step-info">
                                      <div>Pool ID: {{ step.poolId }}</div>
                                      <div>Token0: {{ step.token0 }}</div>
                                      <div>Token1: {{ step.token1 }}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <!-- ICPSwap Execution Parameters -->
                                <div v-else-if="step.type === 'execution_parameters'" class="step-content">
                                  <div class="step-icon">📊</div>
                                  <div class="step-details">
                                    <div class="step-title">{{ step.exchange }} Parameters Set</div>
                                    <div class="step-info">
                                      <div>Amount After Fee: {{ formatExchangeAmount(step.amountAfterFee, 8) }}</div>
                                      <div>Transfer Fee: {{ formatExchangeAmount(step.transferFee, 8) }}</div>
                                      <div>Zero For One: {{ step.zeroForOne }}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Final Result -->
                          <div v-if="entry.finalResult" class="trade-result" :class="{ 'success': entry.finalResult.success, 'failed': !entry.finalResult.success }">
                            <div class="result-header">
                              <div class="result-icon">{{ entry.finalResult.success ? '✅' : '❌' }}</div>
                              <div class="result-title">{{ entry.finalResult.success ? 'Trade Completed Successfully' : 'Trade Failed' }}</div>
                              <div class="result-exchange">{{ entry.finalResult.exchange }}</div>
                            </div>
                            
                            <div class="result-details">
                              <!-- Success Details -->
                              <div v-if="entry.finalResult.success" class="success-details">
                                <div class="result-metric">
                                  <span class="metric-label">Amount Received:</span>
                                  <span class="metric-value">{{ formatExchangeAmount(entry.finalResult.amountReceived, entry.buyTokenDecimals) }}</span>
                                  <span class="metric-raw">({{ entry.finalResult.amountReceived }} raw)</span>
                                </div>
                                <div class="result-metric">
                                  <span class="metric-label">Expected Minimum:</span>
                                  <span class="metric-value">{{ formatExchangeAmount(entry.finalResult.expectedMin, entry.buyTokenDecimals) }}</span>
                                  <span class="metric-raw">({{ entry.finalResult.expectedMin }} raw)</span>
                                </div>
                                <div class="result-metric">
                                  <span class="metric-label">{{ entry.finalResult.exchange === 'KongSwap' ? 'Actual Slippage' : 'Effective Slippage' }}:</span>
                                  <span class="metric-value">{{ entry.finalResult.exchange === 'KongSwap' ? entry.finalResult.actualSlippage : entry.finalResult.effectiveSlippage }}%</span>
                                </div>
                                <div class="result-metric">
                                  <span class="metric-label">Execution Time:</span>
                                  <span class="metric-value">{{ entry.finalResult.executionTime }}ms</span>
                                </div>
                              </div>
                              
                              <!-- Failure Details -->
                              <div v-else class="failure-details">
                                <div class="result-metric">
                                  <span class="metric-label">Error:</span>
                                  <span class="metric-value error-text">{{ entry.finalResult.error }}</span>
                                </div>
                                <div v-if="entry.finalResult.executionTime" class="result-metric">
                                  <span class="metric-label">Execution Time:</span>
                                  <span class="metric-value">{{ entry.finalResult.executionTime }}ms</span>
                                </div>
                                <div class="result-metric">
                                  <span class="metric-label">Status:</span>
                                  <span class="metric-value">{{ entry.finalResult.status }}</span>
                                </div>
                              </div>
                            </div>
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
      error: null,
      expandedCycles: new Set()
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
        
        // Check if this is a trading cycle start - add as collapsible header
        if (log.context === 'do_executeTradingCycle' && log.component === 'REBALANCE_CYCLE' && log.message.includes('Trading cycle started')) {
          const statusMatch = log.message.match(/Status=([^\\s]+)/);
          const status = statusMatch ? statusMatch[1].replace('#', '') : 'Unknown';
          const cycleId = `cycle_${log.timestamp}`;
          
          processed.push({
            type: 'tradingCycleHeader',
            cycleId: cycleId,
            timestamp: log.timestamp,
            level: log.level,
            context: log.context,
            component: log.component,
            message: log.message,
            status: status
          });
          
          i++;
          continue;
        }
        
        // Skip logs if they belong to a collapsed trading cycle
        if (this.isLogInCollapsedCycle(i)) {
          i++;
          continue;
        }
        
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
        
        // Check if this is a pair selection group
        if (log.context === 'selectTradingPair' && log.component === 'PAIR_SELECTION' && log.message.includes('Starting pair selection')) {
          console.log('Found pair selection, processing group...');
          const pairEntry = this.processPairSelectionGroup(i);
          if (pairEntry) {
            console.log('Successfully processed pair selection group:', pairEntry);
            processed.push(pairEntry.entry);
            i = pairEntry.nextIndex;
            continue;
          } else {
            console.log('Failed to process pair selection group');
          }
        }
        
        // Check if this is a trade sizing group
        if (log.context === 'do_executeTradingStep' && log.component === 'TRADE_SIZING' && log.message.startsWith('Using ')) {
          console.log('Found trade sizing, processing group...');
          const tradeSizingEntry = this.processTradeSizingGroup(i);
          if (tradeSizingEntry) {
            console.log('Successfully processed trade sizing group:', tradeSizingEntry);
            processed.push(tradeSizingEntry.entry);
            i = tradeSizingEntry.nextIndex;
            continue;
          } else {
            console.log('Failed to process trade sizing group');
          }
        }
        
        // Check if this is an exchange comparison group
        if (log.context === 'findBestExecution' && log.component === 'EXCHANGE_COMPARISON' && log.message.includes('Starting exchange comparison')) {
          console.log('Found exchange comparison, processing group...');
          const exchangeEntry = this.processExchangeComparisonGroup(i);
          if (exchangeEntry) {
            console.log('Successfully processed exchange comparison group:', exchangeEntry);
            processed.push(exchangeEntry.entry);
            i = exchangeEntry.nextIndex;
            continue;
          } else {
            console.log('Failed to process exchange comparison group');
          }
        }
        
        // Check if this is a trade execution group
        if (log.context === 'executeTrade' && log.component === 'TRADE_EXECUTION' && log.message.includes('Trade execution STARTED')) {
          console.log('Found trade execution, processing group...');
          const tradeEntry = this.processTradeExecutionGroup(i);
          if (tradeEntry) {
            console.log('Successfully processed trade execution group:', tradeEntry);
            processed.push(tradeEntry.entry);
            i = tradeEntry.nextIndex;
            continue;
          } else {
            console.log('Failed to process trade execution group');
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
    // Fetch token details to get proper decimals for formatting
    if (!this.tacoStore.fetchedTokenDetails.length) {
      await this.tacoStore.fetchTokenDetails();
    }
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
    },
    
    processPairSelectionGroup(startIndex) {
      const logs = this.logs;
      console.log('Processing pair selection group starting at index:', startIndex);
      
      let currentIndex = startIndex;
      const firstLog = logs[currentIndex];
      
      // Parse the first log to get total candidates and min required
      const startMatch = firstLog.message.match(/Total_candidates=(\d+) Min_required=(\d+)/);
      if (!startMatch) {
        console.log('Could not parse starting pair selection log');
        return null;
      }
      
      const totalCandidates = startMatch[1];
      const minRequired = startMatch[2];
      
      // Look for next log - could be candidates ready or insufficient candidates
      currentIndex++;
      if (currentIndex >= logs.length) return null;
      
      const nextLog = logs[currentIndex];
      
      // Check if this is an insufficient candidates warning
      if (nextLog.message.includes('Insufficient candidates for pair selection')) {
        const insufficientMatch = nextLog.message.match(/Need_at_least=(\d+) Have=(\d+)/);
        if (!insufficientMatch) {
          console.log('Could not parse insufficient candidates log');
          return null;
        }
        
        const needAtLeast = insufficientMatch[1];
        const have = insufficientMatch[2];
        
        // Create the compressed entry for failed selection
        const compressedEntry = {
          type: 'pairSelection',
          timestamp: firstLog.timestamp,
          component: 'selectTradingPair',
          summaryMessage: `Pair selection failed - Insufficient candidates`,
          failed: true,
          totalCandidates: totalCandidates,
          minRequired: minRequired,
          needAtLeast: needAtLeast,
          have: have,
          failureReason: `Need at least ${needAtLeast} candidates but only have ${have}`
        };
        
        console.log('Created failed pair selection entry:', compressedEntry);
        
        return {
          entry: compressedEntry,
          nextIndex: currentIndex + 1
        };
      }
      
      // Otherwise, expect candidates ready log
      if (!nextLog.message.includes('Candidates ready for weighted selection')) {
        console.log('Expected candidates ready log not found');
        return null;
      }
      
      // Parse sell and buy candidates
      const candidatesMatch = nextLog.message.match(/Sell_candidates=(\d+) Buy_candidates=(\d+)/);
      if (!candidatesMatch) {
        console.log('Could not parse candidates log');
        return null;
      }
      
      const sellCandidates = candidatesMatch[1];
      const buyCandidates = candidatesMatch[2];
      
      // Look for pair selected log
      currentIndex++;
      if (currentIndex >= logs.length) return null;
      
      const selectedLog = logs[currentIndex];
      if (!selectedLog.message.includes('Pair selected successfully')) {
        console.log('Expected pair selected log not found');
        return null;
      }
      
      // Parse the selected pair details
      const pairMatch = selectedLog.message.match(/Sell=([^(]+) \([^)]+\) Buy=([^(]+) \([^)]+\) Sell_random=(\d+)\/(\d+) Buy_random=(\d+)\/(\d+)/);
      if (!pairMatch) {
        console.log('Could not parse pair selected log');
        return null;
      }
      
      const sellToken = pairMatch[1].trim();
      const buyToken = pairMatch[2].trim();
      const sellRandom = pairMatch[3];
      const sellTotal = pairMatch[4];
      const buyRandom = pairMatch[5];
      const buyTotal = pairMatch[6];
      
      // Create the compressed entry for successful selection
      const compressedEntry = {
        type: 'pairSelection',
        timestamp: firstLog.timestamp,
        component: 'selectTradingPair',
        summaryMessage: `Pair selection completed - ${totalCandidates} candidates evaluated (min required: ${minRequired})`,
        failed: false,
        sellToken: sellToken,
        buyToken: buyToken,
        sellWeight: `${sellRandom}/${sellTotal}`,
        buyWeight: `${buyRandom}/${buyTotal}`,
        candidateStats: `Sell candidates: ${sellCandidates}, Buy candidates: ${buyCandidates}`
      };
      
      console.log('Created pair selection entry:', compressedEntry);
      
      return {
        entry: compressedEntry,
        nextIndex: currentIndex + 1
      };
    },
    
    processTradeSizingGroup(startIndex) {
      const logs = this.logs;
      console.log('Processing trade sizing group starting at index:', startIndex);
      
      let currentIndex = startIndex;
      const firstLog = logs[currentIndex];
      
      // Parse the first log to get targeting strategy details
      const strategyMatch = firstLog.message.match(/Using (\w+) (?:targeting|sizing) - Sell_diff=(\d+bp) Buy_diff=(\d+bp) Portfolio_value=([0-9.]+ICP) Max_trade_threshold=(\d+bp) Reason=(.+)/);
      if (!strategyMatch) {
        console.log('Could not parse trade sizing strategy log');
        return null;
      }
      
      const strategy = strategyMatch[1];
      const sellDiff = strategyMatch[2];
      const buyDiff = strategyMatch[3];
      const portfolioValue = strategyMatch[4];
      const maxThreshold = strategyMatch[5];
      const reason = strategyMatch[6].replace(/_/g, ' ');
      
      // Look for trade size calculation log
      currentIndex++;
      if (currentIndex >= logs.length) return null;
      
      const sizeLog = logs[currentIndex];
      if (!sizeLog.message.includes('Trade size calculated')) {
        console.log('Expected trade size calculation log not found');
        return null;
      }
      
      // Parse the trade size details
      const sizeMatch = sizeLog.message.match(/Trade size calculated - Amount=(\d+) \(raw\) ICP_value=([0-9.]+ICP) Min_allowed=([0-9.]+ICP) Max_allowed=([0-9.]+ICP)/);
      if (!sizeMatch) {
        console.log('Could not parse trade size calculation log');
        return null;
      }
      
      const rawAmount = sizeMatch[1];
      const icpValue = sizeMatch[2];
      const minAllowed = sizeMatch[3];
      const maxAllowed = sizeMatch[4];
      
      // Create the compressed entry
      const compressedEntry = {
        type: 'tradeSizing',
        timestamp: firstLog.timestamp,
        component: 'do_executeTradingStep',
        summaryMessage: `Trade sizing completed using ${strategy} targeting strategy`,
        strategy: strategy,
        reason: reason,
        sellDiff: sellDiff,
        buyDiff: buyDiff,
        portfolioValue: portfolioValue,
        maxThreshold: maxThreshold,
        rawAmount: rawAmount,
        icpValue: icpValue,
        minAllowed: minAllowed,
        maxAllowed: maxAllowed
      };
      
      console.log('Created trade sizing entry:', compressedEntry);
      
      return {
        entry: compressedEntry,
        nextIndex: currentIndex + 1
      };
    },
    
    processExchangeComparisonGroup(startIndex) {
      const logs = this.logs;
      console.log('Processing exchange comparison group starting at index:', startIndex);
      
      let currentIndex = startIndex;
      const firstLog = logs[currentIndex];
      
      // Parse the first log to get trade details
      const startMatch = firstLog.message.match(/Starting exchange comparison - Pair=([^\\s]+) Amount_in=(\d+) \(raw\) Amount_formatted=([0-9.]+) Max_slippage=(\d+bp)/);
      if (!startMatch) {
        console.log('Could not parse exchange comparison start log');
        return null;
      }
      
      const pair = startMatch[1];
      const amountIn = startMatch[2];
      const amountFormatted = startMatch[3];
      const maxSlippage = startMatch[4];
      
      // Extract buy token symbol and get its decimals
      const pairParts = pair.split('/');
      const buyTokenSymbol = pairParts.length > 1 ? pairParts[1] : '';
      let buyTokenDecimals = 8; // Default to 8 decimals
      
      // Find the buy token decimals from fetched token details
      if (this.tacoStore.fetchedTokenDetails) {
        const tokenEntry = this.tacoStore.fetchedTokenDetails.find(([_, details]) => 
          details.tokenSymbol.toLowerCase() === buyTokenSymbol.toLowerCase()
        );
        if (tokenEntry) {
          buyTokenDecimals = Number(tokenEntry[1].tokenDecimals);
        }
      }
      
      const exchanges = [];
      let selectedExchange = '';
      let bestAmount = '';
      let bestSlippage = '';
      
      // Process all exchange comparison logs in this group
      currentIndex++;
      while (currentIndex < logs.length && 
             logs[currentIndex].context === 'findBestExecution' && 
             logs[currentIndex].component === 'EXCHANGE_COMPARISON') {
        
        const log = logs[currentIndex];
        const message = log.message;
        
        console.log('Processing exchange comparison log:', message);
        
        // KongSwap quote received
        if (message.includes('KongSwap quote received')) {
          const kongMatch = message.match(/KongSwap quote received - Amount_out=(\d+) Slippage=([0-9.]+%) Price=([0-9.]+) Status=(\w+)/);
          if (kongMatch) {
            exchanges.push({
              name: 'KongSwap',
              amountOut: kongMatch[1],
              slippage: kongMatch[2],
              price: kongMatch[3],
              status: kongMatch[4],
              statusClass: 'status-' + kongMatch[4].toLowerCase(),
              selected: false,
              notSelected: false
            });
          }
        }
        
        // ICPSwap quote received (selected or not selected)
        else if (message.includes('ICPSwap quote')) {
          // Handle ICPSwap being selected as best
          const icpBestMatch = message.match(/ICPSwap quote accepted as BEST - Amount_out=(\d+) Slippage=([0-9.]+%) Previous_best=(\w+) Status=(\w+)/);
          if (icpBestMatch) {
            exchanges.push({
              name: 'ICPSwap',
              amountOut: icpBestMatch[1],
              slippage: icpBestMatch[2],
              status: icpBestMatch[4],
              statusClass: 'status-' + icpBestMatch[4].toLowerCase().replace('_', '-'),
              selected: false, // Will be marked as selected in final selection
              notSelected: false
            });
          } else {
            // Handle ICPSwap not being selected
            const icpNotSelectedMatch = message.match(/ICPSwap quote received but NOT selected - Amount_out=(\d+) Slippage=([0-9.]+%) Best_amount=(\d+) Status=(\w+)/);
            if (icpNotSelectedMatch) {
              exchanges.push({
                name: 'ICPSwap',
                amountOut: icpNotSelectedMatch[1],
                slippage: icpNotSelectedMatch[2],
                status: icpNotSelectedMatch[4],
                statusClass: 'status-' + icpNotSelectedMatch[4].toLowerCase().replace('_', '-'),
                selected: false,
                notSelected: true
              });
            }
          }
        }
        
        // ICPSwap pool info
        else if (message.includes('ICPSwap pool found')) {
          const poolMatch = message.match(/ICPSwap pool found - Pool_ID=([^\\s]+)/);
          if (poolMatch && exchanges.length > 0) {
            // Add pool info to the last exchange (should be ICPSwap)
            const lastExchange = exchanges[exchanges.length - 1];
            if (lastExchange && lastExchange.name === 'ICPSwap') {
              lastExchange.poolInfo = `Pool: ${poolMatch[1]}`;
            }
          }
        }
        
        // Final selection
        else if (message.includes('Exchange selection FINAL')) {
          const finalMatch = message.match(/Exchange selection FINAL - Selected=#(\w+) Amount_out=(\d+) Best_slippage=([0-9.]+%) Status=(\w+)/);
          if (finalMatch) {
            selectedExchange = finalMatch[1];
            bestAmount = finalMatch[2];
            bestSlippage = finalMatch[3];
            
            // Mark the selected exchange
            const selectedExch = exchanges.find(e => e.name === selectedExchange);
            if (selectedExch) {
              selectedExch.selected = true;
              selectedExch.statusClass = 'status-selected';
              selectedExch.status = 'SELECTED';
            }
          }
          break; // This should be the last log in the group
        }
        
        currentIndex++;
      }
      
      console.log('Found', exchanges.length, 'exchanges in comparison');
      console.log('Selected exchange:', selectedExchange);
      
      // Create the compressed entry
      const compressedEntry = {
        type: 'exchangeComparison',
        timestamp: firstLog.timestamp,
        component: 'findBestExecution',
        summaryMessage: `Exchange comparison completed for ${pair} trade`,
        pair: pair,
        amountIn: amountIn,
        amountFormatted: amountFormatted,
        maxSlippage: maxSlippage,
        buyTokenDecimals: buyTokenDecimals,
        exchanges: exchanges,
        selectedExchange: selectedExchange,
        bestAmount: bestAmount,
        bestSlippage: bestSlippage
      };
      
      console.log('Created exchange comparison entry:', compressedEntry);
      
      return {
        entry: compressedEntry,
        nextIndex: currentIndex + 1
      };
    },
    
    processTradeExecutionGroup(startIndex) {
      const logs = this.filteredLogs;
      const firstLog = logs[startIndex];
      
      console.log('Processing trade execution group starting at:', startIndex, firstLog);
      
      if (!firstLog || !firstLog.message.includes('Trade execution STARTED')) {
        console.log('Not a trade execution start log');
        return null;
      }
      
      // Parse the start message for basic trade info
      const startMessage = firstLog.message;
      console.log('Trade execution start message:', startMessage);
      
      // Extract trade details from start message
      const exchangeMatch = startMessage.match(/Exchange=(#\w+)/);
      const pairMatch = startMessage.match(/Pair=([^\s]+)/);
      const amountInMatch = startMessage.match(/Amount_in=(\d+) \(raw\)/);
      const amountFormattedMatch = startMessage.match(/Amount_formatted=([0-9.]+)/);
      const minAmountOutMatch = startMessage.match(/Min_amount_out=(\d+) \(raw\)/);
      const minAmountFormattedMatch = startMessage.match(/Min_amount_out_formatted=([0-9.]+)/);
      const timestampMatch = startMessage.match(/Timestamp=(\d+)/);
      
      if (!exchangeMatch || !pairMatch) {
        console.log('Failed to parse essential trade execution details');
        return null;
      }
      
      const exchange = exchangeMatch[1].replace('#', '');
      const pair = pairMatch[1];
      const amountIn = amountInMatch ? amountInMatch[1] : '0';
      const amountFormatted = amountFormattedMatch ? amountFormattedMatch[1] : '0';
      const minAmountOut = minAmountOutMatch ? minAmountOutMatch[1] : '0';
      const minAmountFormatted = minAmountFormattedMatch ? minAmountFormattedMatch[1] : '0';
      const timestamp = timestampMatch ? timestampMatch[1] : '';
      
      // Extract buy token symbol for decimal formatting
      const pairParts = pair.split('/');
      const buyTokenSymbol = pairParts.length > 1 ? pairParts[1] : '';
      let buyTokenDecimals = 8; // Default to 8 decimals
      
      // Find the buy token decimals from fetched token details
      if (this.tacoStore.fetchedTokenDetails) {
        const tokenEntry = this.tacoStore.fetchedTokenDetails.find(([_, details]) => 
          details.tokenSymbol.toLowerCase() === buyTokenSymbol.toLowerCase()
        );
        if (tokenEntry) {
          buyTokenDecimals = Number(tokenEntry[1].tokenDecimals);
        }
      }
      
      const tradeSteps = [];
      let currentIndex = startIndex + 1;
      let finalResult = null;
      
      // Process all trade execution logs in this group
      while (currentIndex < logs.length && 
             logs[currentIndex].context === 'executeTrade' && 
             logs[currentIndex].component === 'TRADE_EXECUTION') {
        
        const log = logs[currentIndex];
        const message = log.message;
        
        console.log('Processing trade execution log:', message);
        
        // KongSwap preparation step
        if (message.includes('KongSwap trade preparation')) {
          const prepMatch = message.match(/Symbols=([^\s]+) Slippage_tolerance=([0-9.]+)% Deadline=(\d+)s Min_amount_out=(\d+)/);
          if (prepMatch) {
            tradeSteps.push({
              type: 'preparation',
              exchange: 'KongSwap',
              symbols: prepMatch[1],
              slippageTolerance: prepMatch[2],
              deadline: prepMatch[3],
              minAmountOut: prepMatch[4]
            });
          }
        }
        
        // KongSwap execution start
        else if (message.includes('KongSwap execution STARTING')) {
          tradeSteps.push({
            type: 'execution_start',
            exchange: 'KongSwap',
            status: 'Parameters set, calling executeTransferAndSwap'
          });
        }
        
        // ICPSwap pool validation
        else if (message.includes('ICPSwap pool validation')) {
          const poolMatch = message.match(/Pool_ID=([^\s]+) Token0=([^\s]+) Token1=([^\s]+)/);
          if (poolMatch) {
            tradeSteps.push({
              type: 'pool_validation',
              exchange: 'ICPSwap',
              poolId: poolMatch[1],
              token0: poolMatch[2],
              token1: poolMatch[3]
            });
          }
        }
        
        // ICPSwap execution parameters
        else if (message.includes('ICPSwap execution parameters')) {
          const paramMatch = message.match(/Amount_after_fee=(\d+) Transfer_fee=(\d+) Min_amount_out=(\d+) Zero_for_one=([^\s]+)/);
          if (paramMatch) {
            tradeSteps.push({
              type: 'execution_parameters',
              exchange: 'ICPSwap',
              amountAfterFee: paramMatch[1],
              transferFee: paramMatch[2],
              minAmountOut: paramMatch[3],
              zeroForOne: paramMatch[4]
            });
          }
        }
        
        // Trade success (KongSwap)
        else if (message.includes('KongSwap trade SUCCESS')) {
          const successMatch = message.match(/Amount_received=(\d+) Expected_min=(\d+) Actual_slippage=([0-9.]+)% Execution_time=(\d+)ms Status=(\w+)/);
          if (successMatch) {
            finalResult = {
              success: true,
              exchange: 'KongSwap',
              amountReceived: successMatch[1],
              expectedMin: successMatch[2],
              actualSlippage: successMatch[3],
              executionTime: successMatch[4],
              status: successMatch[5]
            };
          }
          break; // This should be the last log in the group
        }
        
        // Trade success (ICPSwap)
        else if (message.includes('ICPSwap trade SUCCESS')) {
          const successMatch = message.match(/Amount_received=(\d+) Expected_min=(\d+) Effective_slippage=([0-9.]+)% Execution_time=(\d+)ms Status=(\w+)/);
          if (successMatch) {
            finalResult = {
              success: true,
              exchange: 'ICPSwap',
              amountReceived: successMatch[1],
              expectedMin: successMatch[2],
              effectiveSlippage: successMatch[3],
              executionTime: successMatch[4],
              status: successMatch[5]
            };
          }
          break; // This should be the last log in the group
        }
        
        // Trade failure (KongSwap)
        else if (message.includes('KongSwap trade FAILED')) {
          const failMatch = message.match(/Error=([^\s]+(?:\s+[^\s]+)*?) Execution_time=(\d+)ms Status=(\w+)/);
          if (failMatch) {
            finalResult = {
              success: false,
              exchange: 'KongSwap',
              error: failMatch[1],
              executionTime: failMatch[2],
              status: failMatch[3]
            };
          }
          break; // This should be the last log in the group
        }
        
        // Trade failure (ICPSwap)
        else if (message.includes('ICPSwap trade FAILED')) {
          const failMatch = message.match(/Error=([^\s]+(?:\s+[^\s]+)*?) Execution_time=(\d+)ms Status=(\w+)/);
          if (failMatch) {
            finalResult = {
              success: false,
              exchange: 'ICPSwap',
              error: failMatch[1],
              executionTime: failMatch[2],
              status: failMatch[3]
            };
          }
          break; // This should be the last log in the group
        }
        
        // Trade execution exception
        else if (message.includes('Trade execution EXCEPTION')) {
          const exceptionMatch = message.match(/Error=([^\s]+(?:\s+[^\s]+)*?) Exchange=(#\w+) Status=(\w+)/);
          if (exceptionMatch) {
            finalResult = {
              success: false,
              exchange: exceptionMatch[2].replace('#', ''),
              error: exceptionMatch[1],
              status: exceptionMatch[3]
            };
          }
          break; // This should be the last log in the group
        }
        
        currentIndex++;
      }
      
      console.log('Found', tradeSteps.length, 'trade execution steps');
      console.log('Final result:', finalResult);
      
      // Create the compressed entry
      const compressedEntry = {
        type: 'tradeExecution',
        timestamp: firstLog.timestamp,
        component: 'executeTrade',
        summaryMessage: `Trade execution ${finalResult?.success ? 'completed successfully' : 'failed'} on ${exchange}`,
        exchange: exchange,
        pair: pair,
        amountIn: amountIn,
        amountFormatted: amountFormatted,
        minAmountOut: minAmountOut,
        minAmountFormatted: minAmountFormatted,
        buyTokenDecimals: buyTokenDecimals,
        tradeSteps: tradeSteps,
        finalResult: finalResult
      };
      
      console.log('Created trade execution entry:', compressedEntry);
      
      return {
        entry: compressedEntry,
        nextIndex: currentIndex + 1
      };
    },
    
    formatExchangeAmount(rawAmount, decimals) {
      if (!rawAmount || !decimals) return rawAmount;
      
      const amount = parseFloat(rawAmount) / Math.pow(10, decimals);
      
      // Show all necessary decimals (up to the token's decimal precision)
      // Remove trailing zeros but keep at least 2 decimal places for readability
      const formatted = amount.toFixed(decimals);
      const trimmed = parseFloat(formatted).toString();
      
      // Add thousands separators while preserving all significant decimals
      const parts = trimmed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      return parts.join('.');
    },
    
    toggleCycle(cycleId) {
      if (this.expandedCycles.has(cycleId)) {
        this.expandedCycles.delete(cycleId);
      } else {
        this.expandedCycles.add(cycleId);
      }
    },
    
    isCycleExpanded(cycleId) {
      return this.expandedCycles.has(cycleId);
    },
    
    isLogInCollapsedCycle(logIndex) {
      // Find the most recent trading cycle before this log
      let lastCycleIndex = -1;
      let lastCycleId = null;
      
      for (let i = logIndex - 1; i >= 0; i--) {
        const log = this.filteredLogs[i];
        if (log.context === 'do_executeTradingCycle' && log.component === 'REBALANCE_CYCLE' && log.message.includes('Trading cycle started')) {
          lastCycleIndex = i;
          lastCycleId = `cycle_${log.timestamp}`;
          break;
        }
      }
      
      // If we found a cycle and it's collapsed, check if this log is before the next cycle
      if (lastCycleId && !this.isCycleExpanded(lastCycleId)) {
        // Check if there's another cycle after the last one but before this log
        for (let i = lastCycleIndex + 1; i < logIndex; i++) {
          const log = this.filteredLogs[i];
          if (log.context === 'do_executeTradingCycle' && log.component === 'REBALANCE_CYCLE' && log.message.includes('Trading cycle started')) {
            return false; // This log is after a new cycle started
          }
        }
        return true; // This log belongs to the collapsed cycle
      }
      
      return false;
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

/* Pair Selection Styles */
.pair-selection-summary {
  background: rgba(255, 107, 53, 0.1);
  border-left: 4px solid #ff6b35;
}

.pair-selection-container {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.pair-selection-header {
  font-weight: 600;
  color: #e9ecef;
  margin-bottom: 12px;
  font-size: 0.875rem;
}

.pair-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 16px 0;
}

.token-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  min-width: 120px;
}

.sell-token {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid #f44336;
}

.buy-token {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid #4caf50;
}

.token-label {
  font-size: 0.7em;
  font-weight: 600;
  color: #adb5bd;
  margin-bottom: 4px;
}

.token-symbol {
  font-size: 1.0em;
  font-weight: 700;
  color: #e9ecef;
  margin-bottom: 4px;
}

.token-weight {
  font-size: 0.75em;
  color: #adb5bd;
}

.arrow {
  font-size: 1.5em;
  font-weight: bold;
  color: #ff6b35;
}

.pair-stats {
  color: #adb5bd;
  font-size: 0.75rem;
  text-align: center;
  font-style: italic;
  background: rgba(255, 107, 53, 0.1);
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ff6b35;
}

.pair-selection-summary.failed {
  background: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
}

.pair-failure {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  text-align: center;
}

.failure-icon {
  font-size: 2em;
  margin-bottom: 8px;
}

.failure-message {
  font-size: 1.0em;
  font-weight: 600;
  color: #dc3545;
  margin-bottom: 12px;
}

.failure-details {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.failure-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.7em;
  color: #adb5bd;
  font-weight: 600;
}

.stat-value {
  font-size: 1.0em;
  color: #dc3545;
  font-weight: 700;
}

/* Trade Sizing Styles */
.trade-sizing-summary {
  background: rgba(138, 43, 226, 0.1);
  border-left: 4px solid #8a2be2;
}

.trade-sizing-container {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.trade-sizing-header {
  font-weight: 600;
  color: #e9ecef;
  margin-bottom: 12px;
  font-size: 0.875rem;
}

.trade-sizing-details {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.sizing-strategy {
  flex: 1;
}

.strategy-box {
  background: rgba(138, 43, 226, 0.1);
  border: 1px solid #8a2be2;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.strategy-label {
  font-size: 0.7em;
  font-weight: 600;
  color: #adb5bd;
  margin-bottom: 4px;
}

.strategy-value {
  font-size: 1.0em;
  font-weight: 700;
  color: #8a2be2;
  margin-bottom: 4px;
}

.strategy-reason {
  font-size: 0.75em;
  color: #adb5bd;
  font-style: italic;
}

.sizing-metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.metric-label {
  color: #adb5bd;
  min-width: 80px;
}

.metric-value {
  color: #e9ecef;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.trade-amount {
  flex: 1;
}

.amount-box {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid #28a745;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.amount-label {
  font-size: 0.7em;
  font-weight: 600;
  color: #adb5bd;
  margin-bottom: 6px;
}

.amount-value {
  font-size: 1.2em;
  font-weight: 700;
  color: #28a745;
  margin-bottom: 4px;
}

.amount-raw {
  font-size: 0.75em;
  color: #adb5bd;
  font-family: 'Courier New', monospace;
  margin-bottom: 8px;
}

.amount-limits {
  display: flex;
  justify-content: space-between;
  font-size: 0.7em;
  color: #adb5bd;
}

.limit-min,
.limit-max {
  font-family: 'Courier New', monospace;
}

/* Exchange Comparison Styles */
.exchange-comparison-summary {
  background: rgba(32, 201, 151, 0.1);
  border-left: 4px solid #20c997;
}

.exchange-comparison-container {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.exchange-comparison-header {
  font-weight: 600;
  color: #e9ecef;
  margin-bottom: 12px;
  font-size: 0.875rem;
}

.comparison-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trade-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 8px;
  background: rgba(32, 201, 151, 0.1);
  border-radius: 6px;
  border: 1px solid #20c997;
}

.trade-pair {
  font-size: 1.1em;
  font-weight: 700;
  color: #20c997;
}

.trade-amount {
  font-size: 1.0em;
  font-weight: 600;
  color: #e9ecef;
  font-family: 'Courier New', monospace;
}

.trade-slippage {
  font-size: 0.85em;
  color: #adb5bd;
}

.exchanges-comparison {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.exchange-card {
  flex: 1;
  max-width: 250px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid #495057;
  border-radius: 8px;
  padding: 12px;
}

.exchange-card.selected {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.exchange-card.not-selected {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.exchange-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exchange-name {
  font-size: 1.0em;
  font-weight: 700;
  color: #e9ecef;
}

.exchange-status {
  font-size: 0.75em;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.exchange-status.status-selected {
  background: #28a745;
  color: white;
}

.exchange-status.status-accepted {
  background: #17a2b8;
  color: white;
}

.exchange-status.status-not-selected {
  background: #dc3545;
  color: white;
}

.exchange-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exchange-metric {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.exchange-metric .metric-label {
  color: #adb5bd;
}

.exchange-metric .metric-value {
  color: #e9ecef;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.exchange-pool-info {
  font-size: 0.7em;
  color: #6c757d;
  font-style: italic;
  margin-top: 4px;
}

.final-selection {
  text-align: center;
  padding: 12px;
  background: rgba(32, 201, 151, 0.1);
  border: 1px solid #20c997;
  border-radius: 6px;
}

.selection-winner {
  font-size: 1.1em;
  font-weight: 700;
  color: #20c997;
  margin-bottom: 4px;
}

.selection-details {
  font-size: 0.85em;
  color: #adb5bd;
  font-family: 'Courier New', monospace;
}

/* Trade Execution Styles */
.trade-execution-summary {
  background: rgba(108, 117, 125, 0.1);
  border-left: 4px solid #6c757d;
}

.trade-execution-summary.success {
  background: rgba(40, 167, 69, 0.1);
  border-left: 4px solid #28a745;
}

.trade-execution-summary.failed {
  background: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
}

.trade-execution-container {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.trade-execution-header {
  font-weight: 600;
  color: #e9ecef;
  margin-bottom: 12px;
  font-size: 0.875rem;
}

.trade-overview {
  margin-bottom: 16px;
}

.trade-basic-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px;
  background: rgba(108, 117, 125, 0.1);
  border-radius: 6px;
  border: 1px solid #6c757d;
}

.trade-execution-summary.success .trade-basic-info {
  background: rgba(40, 167, 69, 0.1);
  border-color: #28a745;
}

.trade-execution-summary.failed .trade-basic-info {
  background: rgba(220, 53, 69, 0.1);
  border-color: #dc3545;
}

.trade-pair-display,
.trade-exchange,
.trade-amount-in,
.trade-min-out {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.pair-label,
.exchange-label,
.amount-label,
.min-label {
  color: #adb5bd;
  font-weight: 600;
}

.pair-value,
.exchange-value,
.amount-value,
.min-value {
  color: #e9ecef;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.amount-raw,
.min-raw {
  color: #6c757d;
  font-size: 0.65rem;
  margin-left: 4px;
}

.trade-steps {
  margin-bottom: 16px;
}

.steps-header {
  font-size: 0.8em;
  font-weight: 600;
  color: #adb5bd;
  margin-bottom: 8px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trade-step {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #495057;
  border-radius: 6px;
  padding: 8px;
}

.step-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.step-icon {
  font-size: 1.2em;
  line-height: 1;
}

.step-details {
  flex: 1;
}

.step-title {
  font-size: 0.8em;
  font-weight: 600;
  color: #e9ecef;
  margin-bottom: 4px;
}

.step-info {
  font-size: 0.7em;
  color: #adb5bd;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step-info > div {
  margin-bottom: 2px;
}

.trade-result {
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid #495057;
  border-radius: 8px;
  padding: 12px;
}

.trade-result.success {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.trade-result.failed {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #495057;
}

.result-icon {
  font-size: 1.2em;
}

.result-title {
  font-size: 1.0em;
  font-weight: 700;
  color: #e9ecef;
  flex: 1;
}

.result-exchange {
  font-size: 0.8em;
  font-weight: 600;
  color: #adb5bd;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.success-details,
.failure-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.result-metric .metric-label {
  color: #adb5bd;
  font-weight: 600;
  min-width: 120px;
}

.result-metric .metric-value {
  color: #e9ecef;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-align: right;
}

.result-metric .metric-raw {
  color: #6c757d;
  font-size: 0.65rem;
  margin-left: 4px;
}

.error-text {
  color: #dc3545 !important;
  font-weight: 700;
}

/* Trading Cycle Header Styles */
.trading-cycle-header {
  background: rgba(108, 117, 125, 0.15);
  border-left: 4px solid #6c757d;
  margin-bottom: 4px;
}

.trading-cycle-header-content {
  padding: 8px 12px;
}

.cycle-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.cycle-header-main:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.cycle-expand-icon {
  font-size: 0.9em;
  color: #adb5bd;
  min-width: 16px;
  text-align: center;
}

.cycle-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.cycle-title {
  font-size: 0.9em;
  font-weight: 700;
  color: #e9ecef;
}

.cycle-timestamp {
  font-size: 0.75rem;
  color: #6c757d;
  font-family: 'Courier New', monospace;
}

.cycle-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.status-ok {
  color: #28a745;
  background: rgba(40, 167, 69, 0.2);
}

.status-error {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.2);
}

.status-warning {
  color: #ffc107;
  background: rgba(255, 193, 7, 0.2);
}
</style> 