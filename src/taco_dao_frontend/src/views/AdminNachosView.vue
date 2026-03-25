<template>
  <div class="standard-view">
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="💎" title="NACHOS Vault Admin" class="mt-4"
                     style="padding-left: 1rem !important;" />

          <!-- Back + section tabs -->
          <div class="mb-4">
            <div class="d-flex gap-3 flex-wrap">
              <router-link to="/admin" class="btn btn-secondary">← Back to Admin Panel</router-link>
              <button v-for="tab in tabs" :key="tab.key"
                      class="btn" :class="activeTab === tab.key ? 'btn-warning' : 'btn-dark'"
                      @click="activeTab = tab.key">
                {{ tab.icon }} {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Loading spinner -->
          <div v-if="loading && !adminData" class="text-center py-5">
            <div class="spinner-border text-warning" role="status"></div>
            <p class="mt-2 text-muted">Loading admin dashboard...</p>
          </div>

          <!-- Error state -->
          <div v-else-if="loadError" class="alert alert-danger">
            <strong>Error:</strong> {{ loadError }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="loadAdminDashboard">Retry</button>
          </div>

          <!-- Content -->
          <div v-else-if="adminData">

            <!-- =============== Section 1: System Health =============== -->
            <div v-if="activeTab === 'health'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h3 class="mb-0">System Health</h3>
                  <button class="btn btn-sm btn-outline-primary" @click="loadAdminDashboard" :disabled="loading">
                    <i class="fa-solid fa-rotate me-1"></i>{{ loading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <div class="card-body">
                  <!-- Status indicator cards -->
                  <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3" v-for="flag in statusFlags" :key="flag.label">
                      <div class="p-3 rounded text-center" :class="flag.ok ? 'bg-success bg-opacity-25 border border-success' : 'bg-danger bg-opacity-25 border border-danger'">
                        <i :class="flag.icon" class="mb-1 d-block" style="font-size:1.5rem"></i>
                        <div class="small fw-bold">{{ flag.label }}</div>
                        <div class="small">{{ flag.display }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Key metrics row -->
                  <h5 class="mb-3">Key Metrics</h5>
                  <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3" v-for="m in keyMetrics" :key="m.label">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted">{{ m.label }}</div>
                        <div class="fw-bold">{{ m.value }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Analytics -->
                  <h5 class="mb-3">Analytics</h5>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted mb-2">Mint Volume</div>
                        <div>{{ formatE8s(adminData.totalMintVolumeICP) }} ICP</div>
                        <div class="small text-muted">{{ Number(adminData.totalMintCount) }} mints total</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted mb-2">Burn Volume</div>
                        <div>{{ formatE8s(adminData.totalBurnVolumeICP) }} ICP</div>
                        <div class="small text-muted">{{ Number(adminData.totalBurnCount) }} burns total</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted mb-2">Fees Collected</div>
                        <div>{{ formatE8s(adminData.totalFeesCollectedICP) }} ICP</div>
                        <div class="small text-muted">{{ Number(adminData.feeCount) }} fee records</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted mb-2">Mints by Mode</div>
                        <div class="small">ICP: {{ Number(adminData.mintsByMode.icp) }}</div>
                        <div class="small">Portfolio: {{ Number(adminData.mintsByMode.portfolioShare) }}</div>
                        <div class="small">Single Token: {{ Number(adminData.mintsByMode.singleToken) }}</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted mb-2">Global Rate Limits (4h)</div>
                        <div class="small">Mint: {{ formatE8s(adminData.globalMintIn4h) }} / {{ formatE8s(adminData.maxMintPer4h) }} ICP</div>
                        <div class="progress mt-1" style="height:6px">
                          <div class="progress-bar bg-info" :style="{ width: ratioPercent(adminData.globalMintIn4h, adminData.maxMintPer4h) + '%' }"></div>
                        </div>
                        <div class="small mt-1">Burn: {{ formatE8s(adminData.globalBurnIn4h) }} / {{ formatE8s(adminData.maxBurnPer4h) }} NACHOS</div>
                        <div class="progress mt-1" style="height:6px">
                          <div class="progress-bar bg-warning" :style="{ width: ratioPercent(adminData.globalBurnIn4h, adminData.maxBurnPer4h) + '%' }"></div>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted mb-2">Canister Cycles</div>
                        <div>{{ formatCycles(adminData.canisterCycles) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 2: Portfolio & NAV =============== -->
            <div v-if="activeTab === 'portfolio'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header"><h3 class="mb-0">Portfolio & NAV</h3></div>
                <div class="card-body">
                  <!-- NAV info -->
                  <div class="row g-3 mb-4" v-if="adminData.nav && adminData.nav.length > 0">
                    <div class="col-md-3">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted">NAV per NACHOS</div>
                        <div class="fw-bold">{{ formatE8s(adminData.nav[0].navPerTokenE8s) }} ICP</div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted">Portfolio Value</div>
                        <div class="fw-bold">{{ formatE8s(adminData.portfolioValueICP) }} ICP</div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted">NACHOS Supply</div>
                        <div class="fw-bold">{{ formatE8s(adminData.nachosSupply) }}</div>
                      </div>
                    </div>
                    <div class="col-md-3" v-if="adminData.navChangePercent && adminData.navChangePercent.length > 0">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="small text-muted">NAV Change</div>
                        <div class="fw-bold" :class="adminData.navChangePercent[0] >= 0 ? 'text-success' : 'text-danger'">
                          {{ adminData.navChangePercent[0].toFixed(4) }}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Portfolio table -->
                  <h5 class="mb-3">Portfolio Breakdown</h5>
                  <div class="table-responsive">
                    <table class="table table-dark table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th>Principal</th>
                          <th class="text-end">Balance</th>
                          <th class="text-end">Price (ICP)</th>
                          <th class="text-end">Value (ICP)</th>
                          <th class="text-end">Current %</th>
                          <th class="text-end">Target %</th>
                          <th class="text-end">Deviation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="t in adminData.portfolio" :key="t.token.toText()">
                          <td class="fw-bold">{{ t.symbol }}</td>
                          <td><code class="small">{{ formatPrincipal(t.token) }}</code>
                            <button class="btn btn-sm btn-link p-0 ms-1" @click="copyToClipboard(t.token.toText())" title="Copy">
                              <i class="fa-solid fa-copy small"></i>
                            </button>
                          </td>
                          <td class="text-end">{{ formatTokenBalance(t.balance, t.decimals) }}</td>
                          <td class="text-end">{{ formatE8s(t.priceICP) }}</td>
                          <td class="text-end">{{ formatE8s(t.valueICP) }}</td>
                          <td class="text-end">{{ formatBP(t.currentBasisPoints) }}</td>
                          <td class="text-end">{{ formatBP(t.targetBasisPoints) }}</td>
                          <td class="text-end" :class="deviationClass(t.currentBasisPoints, t.targetBasisPoints)">
                            {{ deviationDisplay(t.currentBasisPoints, t.targetBasisPoints) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 3: Configuration =============== -->
            <div v-if="activeTab === 'config'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h3 class="mb-0">Configuration</h3>
                  <button v-if="configEditing" class="btn btn-sm btn-success" @click="saveConfig" :disabled="configSaving">
                    {{ configSaving ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
                <div class="card-body">
                  <div v-for="group in configGroups" :key="group.label" class="mb-4">
                    <h5 class="border-bottom pb-2 mb-3">{{ group.label }}</h5>
                    <div class="row g-3">
                      <div v-for="field in group.fields" :key="field.key" class="col-md-6">
                        <div class="p-3 rounded bg-black bg-opacity-25">
                          <div class="d-flex justify-content-between align-items-center">
                            <label class="small text-muted">{{ field.label }}</label>
                            <button v-if="!configEditing" class="btn btn-sm btn-outline-secondary py-0" @click="startConfigEdit">Edit</button>
                          </div>
                          <div v-if="!configEditing" class="fw-bold mt-1">{{ field.displayValue }}</div>
                          <input v-else type="text" class="form-control form-control-sm mt-1 bg-dark text-white"
                                 v-model="configEditValues[field.key]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="configEditing" class="d-flex gap-2 mt-3">
                    <button class="btn btn-success" @click="saveConfig" :disabled="configSaving">
                      {{ configSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button class="btn btn-secondary" @click="configEditing = false">Cancel</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 4: System Controls =============== -->
            <div v-if="activeTab === 'controls'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header"><h3 class="mb-0">System Controls</h3></div>
                <div class="card-body">
                  <div class="row g-3 mb-4">
                    <div class="col-md-4" v-for="ctrl in systemControls" :key="ctrl.label">
                      <div class="p-3 rounded bg-black bg-opacity-25">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <span class="fw-bold">{{ ctrl.label }}</span>
                          <span class="badge" :class="ctrl.active ? 'bg-success' : 'bg-danger'">
                            {{ ctrl.active ? ctrl.activeText : ctrl.inactiveText }}
                          </span>
                        </div>
                        <div class="d-flex gap-2">
                          <button class="btn btn-sm" :class="ctrl.enableClass"
                                  @click="showConfirmation(ctrl.enableAction, ctrl.enableLabel, ctrl.enableMsg)"
                                  :disabled="ctrl.enableDisabled">
                            {{ ctrl.enableLabel }}
                          </button>
                          <button class="btn btn-sm" :class="ctrl.disableClass"
                                  @click="showConfirmation(ctrl.disableAction, ctrl.disableLabel, ctrl.disableMsg)"
                                  :disabled="ctrl.disableDisabled">
                            {{ ctrl.disableLabel }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Emergency controls -->
                  <h5 class="mb-3 text-danger">Emergency Controls</h5>
                  <div class="d-flex gap-3 flex-wrap mb-4">
                    <button class="btn btn-danger" @click="showConfirmation('emergencyPause', 'Emergency Pause', 'This will pause ALL system operations immediately. Type CONFIRM in the reason field.')" :disabled="adminData.systemPaused">
                      <i class="fa-solid fa-circle-pause me-1"></i> Emergency Pause
                    </button>
                    <button class="btn btn-success" @click="showConfirmation('emergencyUnpause', 'Emergency Unpause', 'This will resume ALL system operations.')" :disabled="!adminData.systemPaused">
                      <i class="fa-solid fa-circle-play me-1"></i> Emergency Unpause
                    </button>
                    <button class="btn btn-warning" @click="showConfirmation('resetCircuitBreaker', 'Reset Circuit Breaker', 'This will clear the active circuit breaker state.')" :disabled="!adminData.circuitBreakerActive">
                      <i class="fa-solid fa-bolt me-1"></i> Reset Circuit Breaker
                    </button>
                  </div>

                  <!-- DEX tools -->
                  <h5 class="mb-3">DEX Tools</h5>
                  <div class="d-flex gap-3 flex-wrap">
                    <button class="btn btn-outline-info" @click="adminCall(async (a: any) => a.refreshICPSwapPools(), 'ICPSwap pools refreshed')">
                      <i class="fa-solid fa-rotate me-1"></i> Refresh ICPSwap Pools
                    </button>
                    <button class="btn btn-outline-info" @click="adminCall(async (a: any) => a.testRefreshPrices(), 'Prices refreshed')">
                      <i class="fa-solid fa-chart-line me-1"></i> Test Refresh Prices
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 5: Circuit Breakers =============== -->
            <div v-if="activeTab === 'circuit'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h3 class="mb-0">Circuit Breaker Conditions</h3>
                  <button class="btn btn-sm btn-success" @click="showAddCondition = !showAddCondition">
                    <i class="fa-solid fa-plus me-1"></i>Add Condition
                  </button>
                </div>
                <div class="card-body">
                  <!-- Add condition form -->
                  <div v-if="showAddCondition" class="mb-4 p-3 rounded bg-black bg-opacity-25">
                    <h5>New Circuit Breaker Condition</h5>
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label small">Type</label>
                        <select class="form-select form-select-sm bg-dark text-white" v-model="newCondition.type">
                          <option value="PriceChange">PriceChange</option>
                          <option value="BalanceChange">BalanceChange</option>
                          <option value="NavDrop">NavDrop</option>
                          <option value="DecimalChange">DecimalChange</option>
                          <option value="TokenPaused">TokenPaused</option>
                        </select>
                      </div>
                      <div class="col-md-4" v-if="newCondition.type !== 'DecimalChange' && newCondition.type !== 'TokenPaused'">
                        <label class="form-label small">Threshold %</label>
                        <input type="number" step="0.1" class="form-control form-control-sm bg-dark text-white" v-model.number="newCondition.threshold" />
                      </div>
                      <div class="col-md-4" v-if="newCondition.type !== 'DecimalChange' && newCondition.type !== 'TokenPaused'">
                        <label class="form-label small">Time Window (minutes)</label>
                        <input type="number" class="form-control form-control-sm bg-dark text-white" v-model.number="newCondition.timeWindowMin" />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small">Direction</label>
                        <select class="form-select form-select-sm bg-dark text-white" v-model="newCondition.direction">
                          <option value="Both">Both</option>
                          <option value="Up">Up</option>
                          <option value="Down">Down</option>
                        </select>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small">Action</label>
                        <select class="form-select form-select-sm bg-dark text-white" v-model="newCondition.action">
                          <option value="PauseBoth">PauseBoth</option>
                          <option value="PauseMint">PauseMint</option>
                          <option value="PauseBurn">PauseBurn</option>
                          <option value="RejectOperation">RejectOperation</option>
                        </select>
                      </div>
                      <div class="col-md-4" v-if="newCondition.type !== 'NavDrop'">
                        <label class="form-label small">Applicable Tokens</label>
                        <div class="token-multiselect">
                          <button class="form-select form-select-sm bg-dark text-white text-start"
                                  type="button"
                                  @click="tokenDropdownOpen = !tokenDropdownOpen">
                            {{ selectedTokensLabel }}
                          </button>
                          <div v-if="tokenDropdownOpen" class="token-multiselect__menu">
                            <label class="token-multiselect__item">
                              <input type="checkbox" :checked="newCondition.selectedTokens.length === 0"
                                     @change="toggleAllTokens" />
                              <span class="fw-bold">All Tokens</span>
                            </label>
                            <hr class="my-1 border-secondary" />
                            <label v-for="t in portfolioTokenOptions" :key="t.principal"
                                   class="token-multiselect__item">
                              <input type="checkbox" :value="t.principal"
                                     v-model="newCondition.selectedTokens" />
                              <span>{{ t.symbol }}</span>
                              <code class="small ms-1 opacity-50">{{ formatPrincipal(t.principal) }}</code>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="mt-3 d-flex gap-2">
                      <button class="btn btn-success btn-sm" @click="addCondition" :disabled="addingCondition">
                        {{ addingCondition ? 'Adding...' : 'Add Condition' }}
                      </button>
                      <button class="btn btn-secondary btn-sm" @click="showAddCondition = false">Cancel</button>
                    </div>
                  </div>

                  <!-- Conditions table -->
                  <div class="table-responsive">
                    <table class="table table-dark table-sm table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Type</th>
                          <th>Threshold</th>
                          <th>Window</th>
                          <th>Direction</th>
                          <th>Action</th>
                          <th>Tokens</th>
                          <th>Enabled</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="c in adminData.circuitBreakerConditions" :key="Number(c.id)">
                          <td>{{ Number(c.id) }}</td>
                          <td><span class="badge bg-info">{{ getVariantKey(c.conditionType) }}</span></td>
                          <td>{{ c.thresholdPercent.toFixed(1) }}%</td>
                          <td>{{ formatTimeWindow(c.timeWindowNS) }}</td>
                          <td>{{ getVariantKey(c.direction) }}</td>
                          <td><span class="badge" :class="actionBadgeClass(c.action)">{{ getVariantKey(c.action) }}</span></td>
                          <td>{{ c.applicableTokens.length === 0 ? 'All' : c.applicableTokens.map((t: any) => formatPrincipal(t)).join(', ') }}</td>
                          <td>
                            <button class="btn btn-sm" :class="c.enabled ? 'btn-success' : 'btn-outline-secondary'"
                                    @click="toggleCondition(c.id, !c.enabled)">
                              {{ c.enabled ? 'ON' : 'OFF' }}
                            </button>
                          </td>
                          <td>
                            <button class="btn btn-sm btn-outline-danger" @click="showConfirmation('removeCondition_' + Number(c.id), 'Remove Condition', `Remove circuit breaker condition #${Number(c.id)}?`)">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                        <tr v-if="adminData.circuitBreakerConditions.length === 0">
                          <td colspan="9" class="text-muted text-center">No conditions configured</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Recent alerts -->
                  <h5 class="mt-4 mb-3">Recent Alerts</h5>
                  <div class="table-responsive">
                    <table class="table table-dark table-sm">
                      <thead>
                        <tr><th>Time</th><th>Condition</th><th>Type</th><th>Token</th><th>Action</th><th>Details</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="a in adminData.recentAlerts" :key="Number(a.id)">
                          <td class="small">{{ formatNanos(a.timestamp) }}</td>
                          <td>#{{ Number(a.conditionId) }}</td>
                          <td><span class="badge bg-info">{{ getVariantKey(a.conditionType) }}</span></td>
                          <td>{{ a.tokenSymbol || (a.token.length > 0 ? formatPrincipal(a.token[0]) : 'N/A') }}</td>
                          <td><span class="badge" :class="actionBadgeClass(a.actionTaken)">{{ getVariantKey(a.actionTaken) }}</span></td>
                          <td class="small">{{ a.details }}</td>
                        </tr>
                        <tr v-if="adminData.recentAlerts.length === 0">
                          <td colspan="6" class="text-muted text-center">No recent alerts</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button class="btn btn-sm btn-outline-secondary mt-2" @click="loadMoreAlerts" :disabled="loadingAlerts">
                    {{ loadingAlerts ? 'Loading...' : 'Load Full Alert History' }}
                  </button>
                  <div v-if="fullAlerts.length > 0" class="mt-3">
                    <div class="table-responsive">
                      <table class="table table-dark table-sm">
                        <thead>
                          <tr><th>Time</th><th>Condition</th><th>Type</th><th>Token</th><th>Action</th><th>Details</th></tr>
                        </thead>
                        <tbody>
                          <tr v-for="a in fullAlerts" :key="Number(a.id)">
                            <td class="small">{{ formatNanos(a.timestamp) }}</td>
                            <td>#{{ Number(a.conditionId) }}</td>
                            <td><span class="badge bg-info">{{ getVariantKey(a.conditionType) }}</span></td>
                            <td>{{ a.tokenSymbol || 'N/A' }}</td>
                            <td><span class="badge" :class="actionBadgeClass(a.actionTaken)">{{ getVariantKey(a.actionTaken) }}</span></td>
                            <td class="small">{{ a.details }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 6: Token Management =============== -->
            <div v-if="activeTab === 'tokens'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header"><h3 class="mb-0">Accepted Mint Tokens</h3></div>
                <div class="card-body">
                  <!-- Add token form -->
                  <div class="d-flex gap-2 mb-4">
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="newTokenPrincipal" placeholder="Token principal..." style="max-width:400px" />
                    <button class="btn btn-sm btn-success" @click="addToken" :disabled="!newTokenPrincipal.trim()">
                      <i class="fa-solid fa-plus me-1"></i>Add Token
                    </button>
                  </div>

                  <div class="table-responsive">
                    <table class="table table-dark table-sm table-hover">
                      <thead>
                        <tr><th>Principal</th><th>Symbol</th><th>Enabled</th><th>Added</th><th>Added By</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="[principal, config] in adminData.acceptedTokens" :key="principal.toText()">
                          <td><code class="small">{{ formatPrincipal(principal) }}</code>
                            <button class="btn btn-sm btn-link p-0 ms-1" @click="copyToClipboard(principal.toText())" title="Copy">
                              <i class="fa-solid fa-copy small"></i>
                            </button>
                          </td>
                          <td>{{ resolveSymbol(principal) }}</td>
                          <td>
                            <button class="btn btn-sm" :class="config.enabled ? 'btn-success' : 'btn-outline-secondary'"
                                    @click="toggleToken(principal, !config.enabled)">
                              {{ config.enabled ? 'ON' : 'OFF' }}
                            </button>
                          </td>
                          <td class="small">{{ formatNanos(config.addedAt) }}</td>
                          <td class="small"><code>{{ formatPrincipal(config.addedBy) }}</code></td>
                          <td>
                            <button class="btn btn-sm btn-outline-danger" @click="showConfirmation('removeToken_' + principal.toText(), 'Remove Token', `Remove accepted token ${formatPrincipal(principal)}?`)">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 7: Fees & Rate Limits =============== -->
            <div v-if="activeTab === 'fees'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header"><h3 class="mb-0">Fees & Rate Limits</h3></div>
                <div class="card-body">
                  <!-- Fee exempt principals -->
                  <h5 class="mb-3">Fee Exempt Principals</h5>
                  <div class="d-flex gap-2 mb-3">
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="newFeeExemptPrincipal" placeholder="Principal..." style="max-width:300px" />
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="newFeeExemptReason" placeholder="Reason..." style="max-width:200px" />
                    <button class="btn btn-sm btn-success" @click="addFeeExempt" :disabled="!newFeeExemptPrincipal.trim() || !newFeeExemptReason.trim()">Add</button>
                  </div>
                  <div class="table-responsive mb-4">
                    <table class="table table-dark table-sm">
                      <thead><tr><th>Principal</th><th>Reason</th><th>Added</th><th>Actions</th></tr></thead>
                      <tbody>
                        <tr v-for="[p, cfg] in adminData.feeExemptPrincipals" :key="p.toText()">
                          <td><code class="small">{{ formatPrincipal(p) }}</code></td>
                          <td>{{ cfg.reason }}</td>
                          <td class="small">{{ formatNanos(cfg.addedAt) }}</td>
                          <td><button class="btn btn-sm btn-outline-danger" @click="removeFeeExempt(p)"><i class="fa-solid fa-trash"></i></button></td>
                        </tr>
                        <tr v-if="adminData.feeExemptPrincipals.length === 0"><td colspan="4" class="text-muted text-center">None</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Rate limit exempt principals -->
                  <h5 class="mb-3">Rate Limit Exempt Principals</h5>
                  <div class="d-flex gap-2 mb-3">
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="newRateLimitExemptPrincipal" placeholder="Principal..." style="max-width:300px" />
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="newRateLimitExemptReason" placeholder="Reason..." style="max-width:200px" />
                    <button class="btn btn-sm btn-success" @click="addRateLimitExempt" :disabled="!newRateLimitExemptPrincipal.trim() || !newRateLimitExemptReason.trim()">Add</button>
                  </div>
                  <div class="table-responsive mb-4">
                    <table class="table table-dark table-sm">
                      <thead><tr><th>Principal</th><th>Reason</th><th>Added</th><th>Actions</th></tr></thead>
                      <tbody>
                        <tr v-for="[p, cfg] in adminData.rateLimitExemptPrincipals" :key="p.toText()">
                          <td><code class="small">{{ formatPrincipal(p) }}</code></td>
                          <td>{{ cfg.reason }}</td>
                          <td class="small">{{ formatNanos(cfg.addedAt) }}</td>
                          <td><button class="btn btn-sm btn-outline-danger" @click="removeRateLimitExempt(p)"><i class="fa-solid fa-trash"></i></button></td>
                        </tr>
                        <tr v-if="adminData.rateLimitExemptPrincipals.length === 0"><td colspan="4" class="text-muted text-center">None</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Shared recipient input -->
                  <div class="d-flex gap-2 align-items-center mb-4">
                    <label class="small text-muted text-nowrap">Claim recipient:</label>
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="claimMintFeeRecipient" placeholder="Recipient principal" />
                  </div>

                  <!-- Claimable mint fees -->
                  <h5 class="mb-3">Claimable Mint Fees</h5>
                  <div class="table-responsive mb-4">
                    <table class="table table-dark table-sm">
                      <thead><tr><th>Token</th><th>Accumulated</th><th>Claimed</th><th>Claimable</th><th>Actions</th></tr></thead>
                      <tbody>
                        <tr v-for="fee in adminData.claimableMintFees" :key="fee.token.toText()">
                          <td><code class="small">{{ formatPrincipal(fee.token) }}</code></td>
                          <td>{{ formatE8s(fee.accumulated) }}</td>
                          <td>{{ formatE8s(fee.claimed) }}</td>
                          <td class="fw-bold text-success">{{ formatE8s(fee.claimable) }}</td>
                          <td>
                            <button class="btn btn-sm btn-success" :disabled="Number(fee.claimable) === 0"
                                    @click="claimMintFee(fee.token)">Claim</button>
                          </td>
                        </tr>
                        <tr v-if="adminData.claimableMintFees.length === 0"><td colspan="5" class="text-muted text-center">None</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Claimable burn fees -->
                  <h5 class="mb-3">Claimable Burn Fees</h5>
                  <div class="table-responsive mb-4">
                    <table class="table table-dark table-sm">
                      <thead><tr><th>Token</th><th>Accumulated</th><th>Claimed</th><th>Claimable</th><th>Actions</th></tr></thead>
                      <tbody>
                        <tr v-for="fee in adminData.claimableBurnFees" :key="fee.token.toText()">
                          <td><code class="small">{{ formatPrincipal(fee.token) }}</code></td>
                          <td>{{ formatE8s(fee.accumulated) }}</td>
                          <td>{{ formatE8s(fee.claimed) }}</td>
                          <td class="fw-bold text-success">{{ formatE8s(fee.claimable) }}</td>
                          <td>
                            <button class="btn btn-sm btn-success" :disabled="Number(fee.claimable) === 0"
                                    @click="claimBurnFee(fee.token)">Claim</button>
                          </td>
                        </tr>
                        <tr v-if="adminData.claimableBurnFees.length === 0"><td colspan="5" class="text-muted text-center">None</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Claimable cancellation fees -->
                  <h5 class="mb-3">Claimable Cancellation Fees</h5>
                  <div class="table-responsive mb-4">
                    <table class="table table-dark table-sm">
                      <thead><tr><th>Token</th><th>Accumulated</th><th>Claimed</th><th>Claimable</th><th>Actions</th></tr></thead>
                      <tbody>
                        <tr v-for="fee in adminData.claimableCancellationFees" :key="fee.token.toText()">
                          <td><code class="small">{{ formatPrincipal(fee.token) }}</code></td>
                          <td>{{ formatE8s(fee.accumulated) }}</td>
                          <td>{{ formatE8s(fee.claimed) }}</td>
                          <td class="fw-bold text-success">{{ formatE8s(fee.claimable) }}</td>
                          <td>
                            <button class="btn btn-sm btn-success" :disabled="Number(fee.claimable) === 0"
                                    @click="claimCancellationFee(fee.token)">Claim</button>
                          </td>
                        </tr>
                        <tr v-if="adminData.claimableCancellationFees.length === 0"><td colspan="5" class="text-muted text-center">None</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- User rate limit lookup -->
                  <h5 class="mb-3">User Rate Limit Lookup</h5>
                  <div class="d-flex gap-2 mb-3">
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="rateLimitLookupPrincipal" placeholder="User principal..." style="max-width:400px" />
                    <button class="btn btn-sm btn-info" @click="lookupUserRateLimit" :disabled="!rateLimitLookupPrincipal.trim() || lookingUpRateLimit">
                      {{ lookingUpRateLimit ? 'Looking up...' : 'Lookup' }}
                    </button>
                  </div>
                  <div v-if="userRateLimitData" class="p-3 rounded bg-black bg-opacity-25">
                    <div class="row g-2">
                      <div class="col-md-3"><span class="small text-muted">Mint ops (4h):</span> {{ Number(userRateLimitData.mintOpsIn4h) }}</div>
                      <div class="col-md-3"><span class="small text-muted">Mint value (4h):</span> {{ formatE8s(userRateLimitData.mintValueIn4h) }} ICP</div>
                      <div class="col-md-3"><span class="small text-muted">Burn ops (4h):</span> {{ Number(userRateLimitData.burnOpsIn4h) }}</div>
                      <div class="col-md-3"><span class="small text-muted">Burn value (4h):</span> {{ formatE8s(userRateLimitData.burnValueIn4h) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 8: Transfer Queue =============== -->
            <div v-if="activeTab === 'transfers'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h3 class="mb-0">Transfer Queue</h3>
                  <button class="btn btn-sm btn-warning" @click="retryTransfers" :disabled="Number(adminData.transferQueue.exhausted) === 0">
                    <i class="fa-solid fa-rotate-right me-1"></i>Retry Failed ({{ Number(adminData.transferQueue.exhausted) }})
                  </button>
                </div>
                <div class="card-body">
                  <!-- Summary cards -->
                  <div class="row g-3 mb-4">
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25 text-center">
                        <div class="small text-muted">Pending</div>
                        <div class="h4 mb-0">{{ Number(adminData.transferQueue.pending) }}</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25 text-center">
                        <div class="small text-muted">Completed</div>
                        <div class="h4 mb-0 text-success">{{ Number(adminData.transferQueue.completed) }}</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3 rounded bg-black bg-opacity-25 text-center">
                        <div class="small text-muted">Exhausted</div>
                        <div class="h4 mb-0" :class="Number(adminData.transferQueue.exhausted) > 0 ? 'text-danger' : ''">{{ Number(adminData.transferQueue.exhausted) }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Tasks table -->
                  <div class="table-responsive">
                    <table class="table table-dark table-sm table-hover">
                      <thead>
                        <tr><th>ID</th><th>Caller</th><th>Token</th><th>Amount</th><th>Type</th><th>Status</th><th>Block</th><th>Retries</th><th>Created</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="t in adminData.transferQueue.tasks" :key="Number(t.id)">
                          <td>{{ Number(t.id) }}</td>
                          <td><code class="small">{{ formatPrincipal(t.caller) }}</code></td>
                          <td><code class="small">{{ formatPrincipal(t.tokenPrincipal) }}</code></td>
                          <td class="text-end">{{ formatE8s(t.amount) }}</td>
                          <td><span class="badge bg-secondary">{{ getVariantKey(t.operationType) }}</span></td>
                          <td><span class="badge" :class="transferStatusClass(t.status)">{{ transferStatusText(t.status) }}</span></td>
                          <td>{{ t.blockIndex.length > 0 ? Number(t.blockIndex[0]) : '-' }}</td>
                          <td>{{ Number(t.retryCount) }}</td>
                          <td class="small">{{ formatNanos(t.createdAt) }}</td>
                        </tr>
                        <tr v-if="adminData.transferQueue.tasks.length === 0">
                          <td colspan="9" class="text-muted text-center">No tasks in queue</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Recovery form -->
                  <h5 class="mt-4 mb-3">Token Recovery</h5>
                  <div class="alert alert-warning small">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>
                    Recovery charges 3x the normal cancellation fee. Only use for tokens sent to the vault by mistake.
                  </div>
                  <div class="d-flex gap-2 flex-wrap">
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="recoveryTokenPrincipal" placeholder="Token principal" style="max-width:280px" />
                    <input type="number" class="form-control form-control-sm bg-dark text-white" v-model.number="recoveryBlockNumber" placeholder="Block number" style="max-width:150px" />
                    <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="recoverySenderPrincipal" placeholder="Sender principal" style="max-width:280px" />
                    <button class="btn btn-sm btn-warning" @click="recoverTokens" :disabled="!recoveryTokenPrincipal || !recoveryBlockNumber || !recoverySenderPrincipal">
                      Recover
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- =============== Section 9: History & Logs =============== -->
            <div v-if="activeTab === 'history'">
              <div class="card bg-dark text-white mb-4">
                <div class="card-header"><h3 class="mb-0">Transaction History & Logs</h3></div>
                <div class="card-body">
                  <!-- Sub-tabs -->
                  <div class="d-flex gap-2 mb-4">
                    <button v-for="st in historySubTabs" :key="st.key" class="btn btn-sm"
                            :class="historyTab === st.key ? 'btn-info' : 'btn-outline-secondary'"
                            @click="historyTab = st.key; loadHistoryTab(st.key)">
                      {{ st.label }}
                    </button>
                  </div>

                  <!-- Mint history -->
                  <div v-if="historyTab === 'mints'">
                    <div class="table-responsive">
                      <table class="table table-dark table-sm table-hover">
                        <thead><tr><th>ID</th><th>Time</th><th>Caller</th><th>Mode</th><th>NACHOS</th><th>Value ICP</th><th>Fee ICP</th><th>Tx</th></tr></thead>
                        <tbody>
                          <tr v-for="m in mintHistory" :key="Number(m.id)">
                            <td>{{ Number(m.id) }}</td>
                            <td class="small">{{ formatNanos(m.timestamp) }}</td>
                            <td><code class="small">{{ formatPrincipal(m.caller) }}</code></td>
                            <td><span class="badge bg-info">{{ getVariantKey(m.mintMode) }}</span></td>
                            <td class="text-end">{{ formatE8s(m.nachosReceived) }}</td>
                            <td class="text-end">{{ formatE8s(m.netValueICP) }}</td>
                            <td class="text-end">{{ formatE8s(m.feeValueICP) }}</td>
                            <td>{{ m.nachosLedgerTxId.length > 0 ? Number(m.nachosLedgerTxId[0]) : '-' }}</td>
                          </tr>
                          <tr v-if="mintHistory.length === 0"><td colspan="8" class="text-muted text-center">No mint records</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                      <button class="btn btn-sm btn-outline-secondary" @click="loadMoreMints" :disabled="loadingHistory">Load More</button>
                    </div>
                  </div>

                  <!-- Burn history -->
                  <div v-if="historyTab === 'burns'">
                    <div class="table-responsive">
                      <table class="table table-dark table-sm table-hover">
                        <thead><tr><th>ID</th><th>Time</th><th>Caller</th><th>NACHOS Burned</th><th>Value ICP</th><th>Fee ICP</th><th>Partial?</th><th>Tx</th></tr></thead>
                        <tbody>
                          <tr v-for="b in burnHistory" :key="Number(b.id)">
                            <td>{{ Number(b.id) }}</td>
                            <td class="small">{{ formatNanos(b.timestamp) }}</td>
                            <td><code class="small">{{ formatPrincipal(b.caller) }}</code></td>
                            <td class="text-end">{{ formatE8s(b.nachosBurned) }}</td>
                            <td class="text-end">{{ formatE8s(b.netValueICP) }}</td>
                            <td class="text-end">{{ formatE8s(b.feeValueICP) }}</td>
                            <td>{{ b.partialFailure ? '⚠️ Yes' : 'No' }}</td>
                            <td>{{ b.nachosLedgerTxId.length > 0 ? Number(b.nachosLedgerTxId[0]) : '-' }}</td>
                          </tr>
                          <tr v-if="burnHistory.length === 0"><td colspan="8" class="text-muted text-center">No burn records</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                      <button class="btn btn-sm btn-outline-secondary" @click="loadMoreBurns" :disabled="loadingHistory">Load More</button>
                    </div>
                  </div>

                  <!-- User activity lookup -->
                  <div v-if="historyTab === 'user'">
                    <div class="d-flex gap-2 mb-3">
                      <input type="text" class="form-control form-control-sm bg-dark text-white" v-model="userLookupPrincipal" placeholder="User principal..." style="max-width:400px" />
                      <button class="btn btn-sm btn-info" @click="lookupUserActivity" :disabled="!userLookupPrincipal.trim() || lookingUpUser">
                        {{ lookingUpUser ? 'Loading...' : 'Lookup' }}
                      </button>
                    </div>
                    <div v-if="userActivityData">
                      <div class="row g-3 mb-3">
                        <div class="col-md-3"><div class="p-2 rounded bg-black bg-opacity-25"><div class="small text-muted">Total Mints</div><div>{{ Number(userActivityData.totalMints) }}</div></div></div>
                        <div class="col-md-3"><div class="p-2 rounded bg-black bg-opacity-25"><div class="small text-muted">Total Burns</div><div>{{ Number(userActivityData.totalBurns) }}</div></div></div>
                        <div class="col-md-3"><div class="p-2 rounded bg-black bg-opacity-25"><div class="small text-muted">Mint Volume</div><div>{{ formatE8s(userActivityData.userTotalMintVolumeICP) }} ICP</div></div></div>
                        <div class="col-md-3"><div class="p-2 rounded bg-black bg-opacity-25"><div class="small text-muted">Burn Volume</div><div>{{ formatE8s(userActivityData.userTotalBurnVolumeICP) }} ICP</div></div></div>
                      </div>
                      <h6>Recent Transactions</h6>
                      <div class="table-responsive">
                        <table class="table table-dark table-sm">
                          <thead><tr><th>ID</th><th>Time</th><th>Type</th><th>NACHOS</th><th>Value ICP</th><th>Fee ICP</th></tr></thead>
                          <tbody>
                            <tr v-for="tx in userActivityData.recentTransactions" :key="Number(tx.id)">
                              <td>{{ Number(tx.id) }}</td>
                              <td class="small">{{ formatNanos(tx.timestamp) }}</td>
                              <td><span class="badge" :class="'Mint' in tx.txType ? 'bg-success' : 'bg-warning'">{{ getVariantKey(tx.txType) }}</span></td>
                              <td class="text-end">{{ formatE8s(tx.nachosAmount) }}</td>
                              <td class="text-end">{{ formatE8s(tx.valueICP) }}</td>
                              <td class="text-end">{{ formatE8s(tx.feeICP) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <h6 class="mt-3">Rate Limits</h6>
                      <div class="row g-2">
                        <div class="col-md-3"><span class="small text-muted">Mint ops:</span> {{ Number(userActivityData.rateLimits.mintOpsIn4h) }} / {{ Number(userActivityData.rateLimits.maxMintOps) }}</div>
                        <div class="col-md-3"><span class="small text-muted">Mint value:</span> {{ formatE8s(userActivityData.rateLimits.mintValueIn4h) }} / {{ formatE8s(userActivityData.rateLimits.maxMintICPPerUser4Hours) }}</div>
                        <div class="col-md-3"><span class="small text-muted">Burn ops:</span> {{ Number(userActivityData.rateLimits.burnOpsIn4h) }} / {{ Number(userActivityData.rateLimits.maxBurnOps) }}</div>
                        <div class="col-md-3"><span class="small text-muted">Burn value:</span> {{ formatE8s(userActivityData.rateLimits.burnValueIn4h) }} / {{ formatE8s(userActivityData.rateLimits.maxBurnNachosPerUser4Hours) }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- System logs -->
                  <div v-if="historyTab === 'logs'">
                    <div class="d-flex gap-2 mb-3 align-items-center">
                      <select class="form-select form-select-sm bg-dark text-white" v-model.number="logCount" style="max-width:120px">
                        <option :value="50">50 logs</option>
                        <option :value="100">100 logs</option>
                        <option :value="200">200 logs</option>
                        <option :value="500">500 logs</option>
                      </select>
                      <select class="form-select form-select-sm bg-dark text-white" v-model="logFilter" style="max-width:120px">
                        <option value="ALL">All Levels</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                      <button class="btn btn-sm btn-info" @click="loadLogs" :disabled="loadingLogs">
                        {{ loadingLogs ? 'Loading...' : 'Load Logs' }}
                      </button>
                    </div>
                    <div class="table-responsive">
                      <table class="table table-dark table-sm" style="font-size:0.8rem">
                        <thead><tr><th>Time</th><th>Level</th><th>Component</th><th>Message</th><th>Context</th></tr></thead>
                        <tbody>
                          <tr v-for="(log, i) in filteredLogs" :key="i">
                            <td class="text-nowrap">{{ formatNanos(log.timestamp) }}</td>
                            <td><span class="badge" :class="logLevelClass(log.level)">{{ getVariantKey(log.level) }}</span></td>
                            <td>{{ log.component }}</td>
                            <td>{{ log.message }}</td>
                            <td class="small text-muted">{{ log.context }}</td>
                          </tr>
                          <tr v-if="filteredLogs.length === 0"><td colspan="5" class="text-muted text-center">No logs</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Fee history -->
                  <div v-if="historyTab === 'feeHistory'">
                    <div class="d-flex gap-2 mb-3">
                      <button class="btn btn-sm btn-info" @click="loadFeeHistory" :disabled="loadingHistory">
                        {{ loadingHistory ? 'Loading...' : 'Load Fee History' }}
                      </button>
                    </div>
                    <div class="table-responsive">
                      <table class="table table-dark table-sm">
                        <thead><tr><th>Time</th><th>Type</th><th>Op ID</th><th>User</th><th>Amount ICP</th></tr></thead>
                        <tbody>
                          <tr v-for="(f, i) in feeHistory" :key="i">
                            <td class="small">{{ formatNanos(f.timestamp) }}</td>
                            <td><span class="badge" :class="'Mint' in f.feeType ? 'bg-success' : 'bg-warning'">{{ getVariantKey(f.feeType) }}</span></td>
                            <td>{{ Number(f.operationId) }}</td>
                            <td><code class="small">{{ formatPrincipal(f.userPrincipal) }}</code></td>
                            <td class="text-end">{{ formatE8s(f.feeAmountICP) }}</td>
                          </tr>
                          <tr v-if="feeHistory.length === 0"><td colspan="5" class="text-muted text-center">No fee records</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <AdminConfirmationModal
      :show="confirmModal.show"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirmButtonText="'Confirm'"
      :confirmButtonClass="'btn-danger'"
      :submitting="confirmModal.submitting"
      @confirm="handleConfirmAction"
      @cancel="confirmModal.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../stores/taco.store'
import { useNachosStore } from '../stores/nachos.store'
import TacoTitle from '../components/misc/TacoTitle.vue'
import AdminConfirmationModal from '../components/admin/AdminConfirmationModal.vue'

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()

// ============================================================================
// Constants & Tabs
// ============================================================================

const tabs = [
  { key: 'health', icon: '🟢', label: 'System Health' },
  { key: 'portfolio', icon: '📊', label: 'Portfolio & NAV' },
  { key: 'config', icon: '⚙️', label: 'Configuration' },
  { key: 'controls', icon: '🎛️', label: 'System Controls' },
  { key: 'circuit', icon: '⚡', label: 'Circuit Breakers' },
  { key: 'tokens', icon: '🪙', label: 'Token Management' },
  { key: 'fees', icon: '💰', label: 'Fees & Rate Limits' },
  { key: 'transfers', icon: '📤', label: 'Transfer Queue' },
  { key: 'history', icon: '📜', label: 'History & Logs' },
]

const historySubTabs = [
  { key: 'mints', label: 'Mint History' },
  { key: 'burns', label: 'Burn History' },
  { key: 'user', label: 'User Lookup' },
  { key: 'logs', label: 'System Logs' },
  { key: 'feeHistory', label: 'Fee History' },
]

const activeTab = ref('health')

// ============================================================================
// Admin Dashboard Data
// ============================================================================

const adminData = ref<any>(null)
const loading = ref(true)
const loadError = ref('')

const loadAdminDashboard = async () => {
  try {
    loading.value = true
    loadError.value = ''
    // Use authenticated actor — getAdminDashboard may require admin caller
    const actor = await nachosStore.createVaultActor(true)
    adminData.value = await (actor as any).getAdminDashboard()
  } catch (e: any) {
    console.error('Failed to load admin dashboard:', e)
    loadError.value = e.message || 'Failed to load admin dashboard'
  } finally {
    loading.value = false
  }
}

// Auto-refresh every 30s
let refreshInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  loadAdminDashboard()
  refreshInterval = setInterval(loadAdminDashboard, 30_000)
})
onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

// ============================================================================
// Helpers
// ============================================================================

const formatE8s = (val: bigint) => (Number(val) / 1e8).toFixed(4)
const formatBP = (bp: bigint) => `${(Number(bp) / 100).toFixed(2)}%`
const formatPrincipal = (p: any) => {
  const t = typeof p === 'string' ? p : p.toText()
  return t.length > 15 ? t.slice(0, 7) + '...' + t.slice(-5) : t
}
const formatNanos = (ns: bigint) => {
  try { return new Date(Number(BigInt(ns) / 1_000_000n)).toLocaleString() }
  catch { return '-' }
}
const formatTimeWindow = (ns: bigint) => {
  const mins = Number(ns) / 60_000_000_000
  if (mins < 60) return `${mins.toFixed(0)}m`
  return `${(mins / 60).toFixed(1)}h`
}
const formatCycles = (c: bigint) => `${(Number(c) / 1e12).toFixed(2)}T`
const formatTokenBalance = (balance: bigint, decimals: bigint) => {
  const d = Number(decimals)
  return (Number(balance) / Math.pow(10, d)).toFixed(Math.min(d, 4))
}

const ratioPercent = (a: bigint, b: bigint) => {
  if (Number(b) === 0) return 0
  return Math.min(100, (Number(a) / Number(b)) * 100)
}

const getVariantKey = (v: any): string => {
  if (!v || typeof v !== 'object') return String(v)
  const keys = Object.keys(v)
  return keys[0] || 'Unknown'
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

const resolveSymbol = (principal: any): string => {
  const p = principal.toText()
  const match = adminData.value?.portfolio?.find((t: any) => t.token.toText() === p)
  return match?.symbol || '-'
}

const deviationDisplay = (current: bigint, target: bigint) => {
  const diff = (Number(current) - Number(target)) / 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}%`
}

const deviationClass = (current: bigint, target: bigint) => {
  const diff = Math.abs(Number(current) - Number(target)) / 100
  if (diff > 5) return 'text-danger fw-bold'
  if (diff > 2) return 'text-warning'
  return 'text-success'
}

const actionBadgeClass = (action: any) => {
  const key = getVariantKey(action)
  if (key === 'PauseBoth') return 'bg-danger'
  if (key === 'PauseMint' || key === 'PauseBurn') return 'bg-warning text-dark'
  return 'bg-secondary'
}

const transferStatusClass = (status: any) => {
  const key = getVariantKey(status)
  if (key === 'Confirmed' || key === 'Sent') return 'bg-success'
  if (key === 'Pending') return 'bg-info'
  if (key === 'Failed') return 'bg-danger'
  return 'bg-secondary'
}

const transferStatusText = (status: any) => {
  const key = getVariantKey(status)
  if (key === 'Confirmed') return `Confirmed (#${Number(status.Confirmed)})`
  if (key === 'Failed') return `Failed: ${status.Failed}`
  return key
}

const logLevelClass = (level: any) => {
  const key = getVariantKey(level)
  if (key === 'ERROR') return 'bg-danger'
  if (key === 'WARN') return 'bg-warning text-dark'
  return 'bg-info'
}

// ============================================================================
// System Health Computed
// ============================================================================

const statusFlags = computed(() => {
  if (!adminData.value) return []
  const d = adminData.value
  return [
    { label: 'System', icon: 'fa-solid fa-server', ok: !d.systemPaused, display: d.systemPaused ? 'PAUSED' : 'Running' },
    { label: 'Minting', icon: 'fa-solid fa-coins', ok: d.mintingEnabled, display: d.mintingEnabled ? 'Enabled' : 'Disabled' },
    { label: 'Burning', icon: 'fa-solid fa-fire', ok: d.burningEnabled, display: d.burningEnabled ? 'Enabled' : 'Disabled' },
    { label: 'Circuit Breaker', icon: 'fa-solid fa-bolt', ok: !d.circuitBreakerActive, display: d.circuitBreakerActive ? 'ACTIVE' : 'Clear' },
    { label: 'Mint CB', icon: 'fa-solid fa-shield-halved', ok: !d.mintPausedByCircuitBreaker, display: d.mintPausedByCircuitBreaker ? 'Paused' : 'Clear' },
    { label: 'Burn CB', icon: 'fa-solid fa-shield-halved', ok: !d.burnPausedByCircuitBreaker, display: d.burnPausedByCircuitBreaker ? 'Paused' : 'Clear' },
    { label: 'Genesis', icon: 'fa-solid fa-seedling', ok: d.genesisComplete, display: d.genesisComplete ? 'Complete' : 'Pending' },
    { label: 'Paused Tokens', icon: 'fa-solid fa-triangle-exclamation', ok: !d.hasPausedTokens, display: d.hasPausedTokens ? `${d.pausedTokens.length} paused` : 'None' },
  ]
})

const keyMetrics = computed(() => {
  if (!adminData.value) return []
  const d = adminData.value
  const nav = d.nav?.length > 0 ? d.nav[0] : null
  return [
    { label: 'NAV per NACHOS', value: nav ? formatE8s(nav.navPerTokenE8s) + ' ICP' : 'N/A' },
    { label: 'Portfolio Value', value: formatE8s(d.portfolioValueICP) + ' ICP' },
    { label: 'NACHOS Supply', value: formatE8s(d.nachosSupply) },
    { label: 'Total Mints', value: Number(d.totalMintCount).toLocaleString() },
    { label: 'Total Burns', value: Number(d.totalBurnCount).toLocaleString() },
    { label: 'Pending Transfers', value: Number(d.pendingTransferCount).toLocaleString() },
    { label: 'Active Deposits', value: Number(d.activeDepositCount).toLocaleString() },
    { label: 'Canister Cycles', value: formatCycles(d.canisterCycles) },
  ]
})

// ============================================================================
// System Controls
// ============================================================================

const systemControls = computed(() => {
  if (!adminData.value) return []
  const d = adminData.value
  return [
    {
      label: 'Minting', active: d.mintingEnabled,
      activeText: 'Enabled', inactiveText: 'Disabled',
      enableClass: 'btn-success', enableLabel: 'Enable', enableMsg: 'Enable minting?',
      enableAction: 'unpauseMinting', enableDisabled: d.mintingEnabled,
      disableClass: 'btn-outline-danger', disableLabel: 'Disable', disableMsg: 'Disable minting?',
      disableAction: 'pauseMinting', disableDisabled: !d.mintingEnabled,
    },
    {
      label: 'Burning', active: d.burningEnabled,
      activeText: 'Enabled', inactiveText: 'Disabled',
      enableClass: 'btn-success', enableLabel: 'Enable', enableMsg: 'Enable burning?',
      enableAction: 'unpauseBurning', enableDisabled: d.burningEnabled,
      disableClass: 'btn-outline-danger', disableLabel: 'Disable', disableMsg: 'Disable burning?',
      disableAction: 'pauseBurning', disableDisabled: !d.burningEnabled,
    },
  ]
})

// ============================================================================
// Confirmation Modal
// ============================================================================

const confirmModal = reactive({
  show: false,
  title: '',
  message: '',
  action: '',
  submitting: false,
})

const showConfirmation = (action: string, title: string, message: string) => {
  confirmModal.action = action
  confirmModal.title = title
  confirmModal.message = message
  confirmModal.show = true
  confirmModal.submitting = false
}

const handleConfirmAction = async (_reason: string) => {
  confirmModal.submitting = true
  try {
    const actor = await nachosStore.createVaultActor(true) as any
    let result: any

    if (confirmModal.action === 'emergencyPause') result = await actor.emergencyPause()
    else if (confirmModal.action === 'emergencyUnpause') result = await actor.emergencyUnpause()
    else if (confirmModal.action === 'resetCircuitBreaker') result = await actor.resetCircuitBreaker()
    else if (confirmModal.action === 'pauseMinting') result = await actor.pauseMinting()
    else if (confirmModal.action === 'unpauseMinting') result = await actor.unpauseMinting()
    else if (confirmModal.action === 'pauseBurning') result = await actor.pauseBurning()
    else if (confirmModal.action === 'unpauseBurning') result = await actor.unpauseBurning()
    else if (confirmModal.action.startsWith('removeCondition_')) {
      const id = BigInt(confirmModal.action.split('_')[1])
      result = await actor.removeCircuitBreakerCondition(id)
    } else if (confirmModal.action.startsWith('removeToken_')) {
      const principal = Principal.fromText(confirmModal.action.replace('removeToken_', ''))
      result = await actor.removeAcceptedMintToken(principal)
    }

    if (result && 'ok' in result) {
      addToast('Success', result.ok || 'Operation completed', 'fa-solid fa-check')
    } else if (result && 'err' in result) {
      addToast('Error', result.err, 'fa-solid fa-exclamation-triangle')
    }
    await loadAdminDashboard()
  } catch (e: any) {
    addToast('Call Failed', e.message || 'Unknown error', 'fa-solid fa-exclamation-triangle')
  } finally {
    confirmModal.submitting = false
    confirmModal.show = false
  }
}

// ============================================================================
// Generic admin call (for non-confirmation actions)
// ============================================================================

const adminCall = async (fn: (actor: any) => Promise<any>, successMsg: string) => {
  try {
    const actor = await nachosStore.createVaultActor(true)
    const result = await fn(actor)
    if (result && 'ok' in result) {
      addToast('Success', result.ok || successMsg, 'fa-solid fa-check')
    } else if (result && 'err' in result) {
      addToast('Error', result.err, 'fa-solid fa-exclamation-triangle')
    }
    await loadAdminDashboard()
  } catch (e: any) {
    addToast('Call Failed', e.message || 'Unknown error', 'fa-solid fa-exclamation-triangle')
  }
}

const addToast = (title: string, message: string, icon: string) => {
  tacoStore.addToast({ id: Date.now(), code: 'admin-vault', title, icon, message })
}

// ============================================================================
// Configuration Edit
// ============================================================================

const configEditing = ref(false)
const configSaving = ref(false)
const configEditValues = reactive<Record<string, string>>({})

const configGroups = computed(() => {
  if (!adminData.value) return []
  const cfg = adminData.value.fullConfig
  const d = adminData.value
  return [
    {
      label: 'Fees',
      fields: [
        { key: 'mintFeeBasisPoints', label: 'Mint Fee (BP)', displayValue: `${Number(d.mintFeeBasisPoints)} BP (${(Number(d.mintFeeBasisPoints) / 100).toFixed(2)}%)` },
        { key: 'burnFeeBasisPoints', label: 'Burn Fee (BP)', displayValue: `${Number(d.burnFeeBasisPoints)} BP (${(Number(d.burnFeeBasisPoints) / 100).toFixed(2)}%)` },
        { key: 'cancellationFeeMultiplier', label: 'Cancellation Fee Multiplier', displayValue: `${Number(cfg.cancellationFeeMultiplier)}x` },
      ]
    },
    {
      label: 'Minimums',
      fields: [
        { key: 'minMintValueICP', label: 'Min Mint Value (e8s)', displayValue: `${formatE8s(d.minMintValueICP)} ICP` },
        { key: 'minBurnValueICP', label: 'Min Burn Value (e8s)', displayValue: `${formatE8s(d.minBurnValueICP)} ICP` },
      ]
    },
    {
      label: 'Per-Op Maximums',
      fields: [
        { key: 'maxMintAmountICP', label: 'Max Mint ICP per Op (e8s)', displayValue: `${formatE8s(cfg.maxMintAmountICP)} ICP` },
        { key: 'maxBurnAmountNachos', label: 'Max Burn NACHOS per Op (e8s)', displayValue: formatE8s(cfg.maxBurnAmountNachos) },
      ]
    },
    {
      label: 'Global Rate Limits (4h)',
      fields: [
        { key: 'maxMintICPWorthPer4Hours', label: 'Max Mint ICP Worth (e8s)', displayValue: `${formatE8s(cfg.maxMintICPWorthPer4Hours)} ICP` },
        { key: 'maxNachosBurnPer4Hours', label: 'Max NACHOS Burn (e8s)', displayValue: formatE8s(cfg.maxNachosBurnPer4Hours) },
      ]
    },
    {
      label: 'Per-User Rate Limits (4h)',
      fields: [
        { key: 'maxMintOpsPerUser4Hours', label: 'Max Mint Ops', displayValue: Number(cfg.maxMintOpsPerUser4Hours).toString() },
        { key: 'maxMintICPPerUser4Hours', label: 'Max Mint ICP per User (e8s)', displayValue: `${formatE8s(cfg.maxMintICPPerUser4Hours)} ICP` },
        { key: 'maxBurnOpsPerUser4Hours', label: 'Max Burn Ops', displayValue: Number(cfg.maxBurnOpsPerUser4Hours).toString() },
        { key: 'maxBurnNachosPerUser4Hours', label: 'Max Burn NACHOS per User (e8s)', displayValue: formatE8s(cfg.maxBurnNachosPerUser4Hours) },
      ]
    },
    {
      label: 'Slippage & Portfolio',
      fields: [
        { key: 'maxSlippageBasisPoints', label: 'Max Slippage (BP)', displayValue: `${Number(cfg.maxSlippageBasisPoints)} BP` },
        { key: 'portfolioShareMaxDeviationBP', label: 'Portfolio Deviation (BP)', displayValue: `${Number(cfg.portfolioShareMaxDeviationBP)} BP` },
      ]
    },
    {
      label: 'Circuit Breaker',
      fields: [
        { key: 'navDropThresholdPercent', label: 'NAV Drop Threshold %', displayValue: `${cfg.navDropThresholdPercent}%` },
      ]
    },
  ]
})

const startConfigEdit = () => {
  configEditing.value = true
  if (!adminData.value) return
  const cfg = adminData.value.fullConfig
  const d = adminData.value
  // Pre-populate with current raw values
  configEditValues['mintFeeBasisPoints'] = Number(d.mintFeeBasisPoints).toString()
  configEditValues['burnFeeBasisPoints'] = Number(d.burnFeeBasisPoints).toString()
  configEditValues['cancellationFeeMultiplier'] = Number(cfg.cancellationFeeMultiplier).toString()
  configEditValues['minMintValueICP'] = Number(d.minMintValueICP).toString()
  configEditValues['minBurnValueICP'] = Number(d.minBurnValueICP).toString()
  configEditValues['maxMintAmountICP'] = Number(cfg.maxMintAmountICP).toString()
  configEditValues['maxBurnAmountNachos'] = Number(cfg.maxBurnAmountNachos).toString()
  configEditValues['maxMintICPWorthPer4Hours'] = Number(cfg.maxMintICPWorthPer4Hours).toString()
  configEditValues['maxNachosBurnPer4Hours'] = Number(cfg.maxNachosBurnPer4Hours).toString()
  configEditValues['maxMintOpsPerUser4Hours'] = Number(cfg.maxMintOpsPerUser4Hours).toString()
  configEditValues['maxMintICPPerUser4Hours'] = Number(cfg.maxMintICPPerUser4Hours).toString()
  configEditValues['maxBurnOpsPerUser4Hours'] = Number(cfg.maxBurnOpsPerUser4Hours).toString()
  configEditValues['maxBurnNachosPerUser4Hours'] = Number(cfg.maxBurnNachosPerUser4Hours).toString()
  configEditValues['maxSlippageBasisPoints'] = Number(cfg.maxSlippageBasisPoints).toString()
  configEditValues['portfolioShareMaxDeviationBP'] = Number(cfg.portfolioShareMaxDeviationBP).toString()
  configEditValues['navDropThresholdPercent'] = cfg.navDropThresholdPercent.toString()
}

const saveConfig = async () => {
  configSaving.value = true
  try {
    const cfg = adminData.value.fullConfig
    const d = adminData.value

    // Build update config — only include changed values
    const update: any = {}
    const optBigInt = (key: string, currentVal: bigint) => {
      const newVal = configEditValues[key]
      if (newVal !== undefined && BigInt(newVal) !== BigInt(Number(currentVal))) {
        update[key] = [BigInt(newVal)]
      } else {
        update[key] = []
      }
    }
    const optFloat = (key: string, currentVal: number) => {
      const newVal = configEditValues[key]
      if (newVal !== undefined && parseFloat(newVal) !== currentVal) {
        update[key] = [parseFloat(newVal)]
      } else {
        update[key] = []
      }
    }

    optBigInt('mintFeeBasisPoints', d.mintFeeBasisPoints)
    optBigInt('burnFeeBasisPoints', d.burnFeeBasisPoints)
    optBigInt('cancellationFeeMultiplier', cfg.cancellationFeeMultiplier)
    optBigInt('minMintValueICP', d.minMintValueICP)
    optBigInt('minBurnValueICP', d.minBurnValueICP)
    optBigInt('maxMintAmountICP', cfg.maxMintAmountICP)
    optBigInt('maxBurnAmountNachos', cfg.maxBurnAmountNachos)
    optBigInt('maxMintICPWorthPer4Hours', cfg.maxMintICPWorthPer4Hours)
    optBigInt('maxNachosBurnPer4Hours', cfg.maxNachosBurnPer4Hours)
    optBigInt('maxMintOpsPerUser4Hours', cfg.maxMintOpsPerUser4Hours)
    optBigInt('maxMintICPPerUser4Hours', cfg.maxMintICPPerUser4Hours)
    optBigInt('maxBurnOpsPerUser4Hours', cfg.maxBurnOpsPerUser4Hours)
    optBigInt('maxBurnNachosPerUser4Hours', cfg.maxBurnNachosPerUser4Hours)
    optBigInt('maxSlippageBasisPoints', cfg.maxSlippageBasisPoints)
    optBigInt('portfolioShareMaxDeviationBP', cfg.portfolioShareMaxDeviationBP)
    optFloat('navDropThresholdPercent', cfg.navDropThresholdPercent)

    // Fill in remaining required NachosUpdateConfig fields with empty (unchanged)
    update.navDropTimeWindowNS = update.navDropTimeWindowNS || []
    update.PRICE_HISTORY_WINDOW = update.PRICE_HISTORY_WINDOW || []
    update.MAX_PRICE_STALENESS_NS = update.MAX_PRICE_STALENESS_NS || []
    update.burningEnabled = []
    update.mintingEnabled = []

    const actor = await nachosStore.createVaultActor(true)
    const result = await (actor as any).updateNachosConfig(update)
    if ('ok' in result) {
      addToast('Config Updated', result.ok, 'fa-solid fa-check')
      configEditing.value = false
      await loadAdminDashboard()
    } else {
      addToast('Config Error', result.err, 'fa-solid fa-exclamation-triangle')
    }
  } catch (e: any) {
    addToast('Config Failed', e.message || 'Unknown error', 'fa-solid fa-exclamation-triangle')
  } finally {
    configSaving.value = false
  }
}

// ============================================================================
// Circuit Breaker Management
// ============================================================================

const showAddCondition = ref(false)
const addingCondition = ref(false)
const newCondition = reactive({
  type: 'PriceChange',
  threshold: 10,
  timeWindowMin: 60,
  direction: 'Both',
  action: 'PauseBoth',
  selectedTokens: [] as string[],
})

const tokenDropdownOpen = ref(false)

const portfolioTokenOptions = computed(() => {
  if (!adminData.value?.portfolio) return []
  return adminData.value.portfolio.map((t: any) => ({
    principal: t.token.toText(),
    symbol: t.symbol,
  }))
})

const selectedTokensLabel = computed(() => {
  if (newCondition.selectedTokens.length === 0) return 'All Tokens'
  if (newCondition.selectedTokens.length === 1) {
    const match = portfolioTokenOptions.value.find((t: any) => t.principal === newCondition.selectedTokens[0])
    return match?.symbol || '1 token'
  }
  return `${newCondition.selectedTokens.length} tokens selected`
})

const toggleAllTokens = () => {
  newCondition.selectedTokens = []
  tokenDropdownOpen.value = false
}

const addCondition = async () => {
  addingCondition.value = true
  try {
    const input: any = {
      conditionType: { [newCondition.type]: null },
      thresholdPercent: newCondition.threshold,
      timeWindowNS: BigInt(newCondition.timeWindowMin) * 60_000_000_000n,
      direction: { [newCondition.direction]: null },
      action: { [newCondition.action]: null },
      enabled: true,
      applicableTokens: newCondition.selectedTokens.map((s: string) => Principal.fromText(s)),
    }
    const actor = await nachosStore.createVaultActor(true)
    const result = await (actor as any).addCircuitBreakerCondition(input)
    if ('ok' in result) {
      addToast('Condition Added', `ID: ${Number(result.ok)}`, 'fa-solid fa-check')
      showAddCondition.value = false
      await loadAdminDashboard()
    } else {
      addToast('Error', result.err, 'fa-solid fa-exclamation-triangle')
    }
  } catch (e: any) {
    addToast('Error', e.message || 'Failed to add condition', 'fa-solid fa-exclamation-triangle')
  } finally {
    addingCondition.value = false
  }
}

const toggleCondition = async (id: bigint, enabled: boolean) => {
  await adminCall(async (a: any) => a.enableCircuitBreakerCondition(id, enabled), `Condition ${enabled ? 'enabled' : 'disabled'}`)
}

// Circuit breaker alerts
const fullAlerts = ref<any[]>([])
const loadingAlerts = ref(false)

const loadMoreAlerts = async () => {
  loadingAlerts.value = true
  try {
    const actor = await nachosStore.createVaultActor()
    fullAlerts.value = await (actor as any).getCircuitBreakerAlerts(BigInt(100), BigInt(0))
  } catch (e) {
    console.error('Failed to load alerts:', e)
  } finally {
    loadingAlerts.value = false
  }
}

// ============================================================================
// Token Management
// ============================================================================

const newTokenPrincipal = ref('')

const addToken = async () => {
  try {
    const principal = Principal.fromText(newTokenPrincipal.value.trim())
    await adminCall(async (a: any) => a.addAcceptedMintToken(principal), 'Token added')
    newTokenPrincipal.value = ''
  } catch (e: any) {
    addToast('Error', e.message || 'Invalid principal', 'fa-solid fa-exclamation-triangle')
  }
}

const toggleToken = async (principal: any, enabled: boolean) => {
  await adminCall(async (a: any) => a.setAcceptedMintTokenEnabled(principal, enabled), `Token ${enabled ? 'enabled' : 'disabled'}`)
}

// ============================================================================
// Fee & Rate Limit Management
// ============================================================================

const newFeeExemptPrincipal = ref('')
const newFeeExemptReason = ref('')
const newRateLimitExemptPrincipal = ref('')
const newRateLimitExemptReason = ref('')
const claimMintFeeRecipient = ref('')
const rateLimitLookupPrincipal = ref('')
const userRateLimitData = ref<any>(null)
const lookingUpRateLimit = ref(false)

const addFeeExempt = async () => {
  try {
    const principal = Principal.fromText(newFeeExemptPrincipal.value.trim())
    await adminCall(async (a: any) => a.addFeeExemptPrincipal(principal, newFeeExemptReason.value.trim()), 'Fee exemption added')
    newFeeExemptPrincipal.value = ''
    newFeeExemptReason.value = ''
  } catch (e: any) {
    addToast('Error', e.message || 'Invalid principal', 'fa-solid fa-exclamation-triangle')
  }
}

const removeFeeExempt = async (principal: any) => {
  await adminCall(async (a: any) => a.removeFeeExemptPrincipal(principal), 'Fee exemption removed')
}

const addRateLimitExempt = async () => {
  try {
    const principal = Principal.fromText(newRateLimitExemptPrincipal.value.trim())
    await adminCall(async (a: any) => a.addRateLimitExemptPrincipal(principal, newRateLimitExemptReason.value.trim()), 'Rate limit exemption added')
    newRateLimitExemptPrincipal.value = ''
    newRateLimitExemptReason.value = ''
  } catch (e: any) {
    addToast('Error', e.message || 'Invalid principal', 'fa-solid fa-exclamation-triangle')
  }
}

const removeRateLimitExempt = async (principal: any) => {
  await adminCall(async (a: any) => a.removeRateLimitExemptPrincipal(principal), 'Rate limit exemption removed')
}

const claimMintFee = async (tokenPrincipal: any) => {
  try {
    const recipient = Principal.fromText(claimMintFeeRecipient.value.trim())
    const fee = adminData.value?.claimableMintFees?.find((f: any) => f.token.toText() === tokenPrincipal.toText())
    if (!fee) return
    await adminCall(async (a: any) => a.claimMintFees(recipient, tokenPrincipal, fee.claimable), 'Mint fees claimed')
  } catch (e: any) {
    addToast('Error', e.message || 'Invalid recipient', 'fa-solid fa-exclamation-triangle')
  }
}

const claimBurnFee = async (tokenPrincipal: any) => {
  try {
    const recipient = Principal.fromText(claimMintFeeRecipient.value.trim())
    const fee = adminData.value?.claimableBurnFees?.find((f: any) => f.token.toText() === tokenPrincipal.toText())
    if (!fee) return
    await adminCall(async (a: any) => a.claimBurnFees(recipient, tokenPrincipal, fee.claimable), 'Burn fees claimed')
  } catch (e: any) {
    addToast('Error', e.message || 'Invalid recipient', 'fa-solid fa-exclamation-triangle')
  }
}

const claimCancellationFee = async (tokenPrincipal: any) => {
  try {
    const recipient = Principal.fromText(claimMintFeeRecipient.value.trim())
    const fee = adminData.value?.claimableCancellationFees?.find((f: any) => f.token.toText() === tokenPrincipal.toText())
    if (!fee) return
    await adminCall(async (a: any) => a.claimCancellationFees(recipient, tokenPrincipal, fee.claimable), 'Cancellation fees claimed')
  } catch (e: any) {
    addToast('Error', e.message || 'Failed to claim', 'fa-solid fa-exclamation-triangle')
  }
}

const lookupUserRateLimit = async () => {
  lookingUpRateLimit.value = true
  try {
    const principal = Principal.fromText(rateLimitLookupPrincipal.value.trim())
    const actor = await nachosStore.createVaultActor()
    userRateLimitData.value = await (actor as any).getUserRateLimitStatus(principal)
  } catch (e: any) {
    addToast('Error', e.message || 'Lookup failed', 'fa-solid fa-exclamation-triangle')
  } finally {
    lookingUpRateLimit.value = false
  }
}

// ============================================================================
// Transfer Queue
// ============================================================================

const recoveryTokenPrincipal = ref('')
const recoveryBlockNumber = ref<number | null>(null)
const recoverySenderPrincipal = ref('')

const retryTransfers = async () => {
  await adminCall(async (a: any) => a.retryFailedTransfers(), 'Failed transfers retried')
}

const recoverTokens = async () => {
  try {
    const token = Principal.fromText(recoveryTokenPrincipal.value.trim())
    const sender = Principal.fromText(recoverySenderPrincipal.value.trim())
    const block = BigInt(recoveryBlockNumber.value || 0)
    await adminCall(async (a: any) => a.recoverWronglySentTokens(token, block, sender), 'Recovery initiated')
    recoveryTokenPrincipal.value = ''
    recoveryBlockNumber.value = null
    recoverySenderPrincipal.value = ''
  } catch (e: any) {
    addToast('Error', e.message || 'Recovery failed', 'fa-solid fa-exclamation-triangle')
  }
}

// ============================================================================
// History & Logs
// ============================================================================

const historyTab = ref('mints')
const loadingHistory = ref(false)
const mintHistory = ref<any[]>([])
const burnHistory = ref<any[]>([])
const feeHistory = ref<any[]>([])
const userLookupPrincipal = ref('')
const userActivityData = ref<any>(null)
const lookingUpUser = ref(false)
const logCount = ref(100)
const logFilter = ref('ALL')
const systemLogs = ref<any[]>([])
const loadingLogs = ref(false)

const mintHistoryOffset = ref(0)
const burnHistoryOffset = ref(0)
const HISTORY_PAGE_SIZE = BigInt(50)

const loadHistoryTab = async (tab: string) => {
  if (tab === 'mints' && mintHistory.value.length === 0) await loadMoreMints()
  else if (tab === 'burns' && burnHistory.value.length === 0) await loadMoreBurns()
  else if (tab === 'logs' && systemLogs.value.length === 0) await loadLogs()
}

const loadMoreMints = async () => {
  loadingHistory.value = true
  try {
    const actor = await nachosStore.createVaultActor()
    const result = await (actor as any).getMintHistory(HISTORY_PAGE_SIZE, BigInt(mintHistoryOffset.value))
    mintHistory.value = [...mintHistory.value, ...result]
    mintHistoryOffset.value += result.length
  } catch (e) {
    console.error('Failed to load mint history:', e)
  } finally {
    loadingHistory.value = false
  }
}

const loadMoreBurns = async () => {
  loadingHistory.value = true
  try {
    const actor = await nachosStore.createVaultActor()
    const result = await (actor as any).getBurnHistory(HISTORY_PAGE_SIZE, BigInt(burnHistoryOffset.value))
    burnHistory.value = [...burnHistory.value, ...result]
    burnHistoryOffset.value += result.length
  } catch (e) {
    console.error('Failed to load burn history:', e)
  } finally {
    loadingHistory.value = false
  }
}

const loadFeeHistory = async () => {
  loadingHistory.value = true
  try {
    const actor = await nachosStore.createVaultActor()
    feeHistory.value = await (actor as any).getFeeHistory(BigInt(200))
  } catch (e) {
    console.error('Failed to load fee history:', e)
  } finally {
    loadingHistory.value = false
  }
}

const lookupUserActivity = async () => {
  lookingUpUser.value = true
  try {
    const principal = Principal.fromText(userLookupPrincipal.value.trim())
    const actor = await nachosStore.createVaultActor()
    userActivityData.value = await (actor as any).getUserActivity(principal, BigInt(20), BigInt(0), BigInt(20), BigInt(0))
  } catch (e: any) {
    addToast('Error', e.message || 'User lookup failed', 'fa-solid fa-exclamation-triangle')
  } finally {
    lookingUpUser.value = false
  }
}

const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const actor = await nachosStore.createVaultActor()
    systemLogs.value = await (actor as any).getLogs(BigInt(logCount.value))
  } catch (e) {
    console.error('Failed to load logs:', e)
  } finally {
    loadingLogs.value = false
  }
}

const filteredLogs = computed(() => {
  if (logFilter.value === 'ALL') return systemLogs.value
  return systemLogs.value.filter((l: any) => getVariantKey(l.level) === logFilter.value)
})
</script>

<style scoped>
.table-dark {
  --bs-table-bg: transparent;
}
code {
  color: #e0e0e0;
}
/* Override text-muted inside dark cards for better contrast */
:deep(.text-muted) {
  color: rgba(255, 255, 255, 0.55) !important;
}
/* Make form placeholders visible on dark backgrounds */
:deep(.form-control::placeholder) {
  color: rgba(255, 255, 255, 0.35) !important;
}
:deep(.form-select) {
  color: #fff;
}
/* Token multi-select dropdown */
.token-multiselect {
  position: relative;
}
.token-multiselect__menu {
  position: absolute;
  z-index: 10;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  background: #1a1a2e;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 0.375rem;
  padding: 0.375rem;
  margin-top: 2px;
}
.token-multiselect__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.375rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.token-multiselect__item:hover {
  background: rgba(255,255,255,0.08);
}
.token-multiselect__item input[type="checkbox"] {
  accent-color: #ffc107;
}
</style>
