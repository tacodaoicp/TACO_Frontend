<template>

  <div class="standard-view">

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <div class="system-view w-100">

            <!-- environment selector and auto-refresh interval -->
            <div class="d-flex align-items-center justify-content-end gap-3 mt-3 px-3">
              <!-- environment selector -->
              <div v-if="isAdmin || isRunningOnStaging" class="d-flex align-items-center gap-2">
                <label class="mb-0 small text-muted">Environment</label>
                <select class="form-select form-select-sm" style="width: auto;" v-model="selectedEnv" @change="handleEnvironmentChange">
                  <option value="ic">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </div>
              <div v-else class="d-flex align-items-center gap-2">
                <span class="small text-muted">Environment: Production</span>
              </div>

              <!-- auto-refresh interval selector -->
              <div class="d-flex align-items-center gap-2">
                <label class="mb-0 small text-muted">Auto-refresh</label>
                <select class="form-select form-select-sm" style="width: auto;" v-model="autoRunInterval" @change="handleIntervalChange">
                  <option :value="0">Off</option>
                  <option :value="5">Every 5 min</option>
                  <option :value="10">Every 10 min</option>
                  <option :value="15">Every 15 min</option>
                  <option :value="30">Every 30 min</option>
                  <option :value="60">Every 1 hour</option>
                </select>
              </div>

              <!-- auto-expand checkbox -->
              <div class="d-flex align-items-center gap-2">
                <div class="form-check mb-0">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="autoExpandCheck" 
                    v-model="autoExpandOnRed"
                    @change="handleAutoExpandChange"
                  >
                  <label class="form-check-label small text-muted" for="autoExpandCheck">
                    Auto-expand on errors
                  </label>
                </div>
              </div>
            </div>

            <!-- system status group -->
            <div class="taco-container taco-container--l1 d-flex flex-column gap-2 p-0 mt-3">
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between section-header-clickable" @click="toggleSystemStatus">
                <div class="d-flex align-items-center gap-3">
                  <span v-if="overallSystemStatus === 'running'" class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Running tests...</span>
                  </span>
                  <span v-else :class="['status-light', `status-${overallSystemStatus}`]"></span>
                <h2 class="h5 mb-0">System Status</h2>
                  <div class="d-flex align-items-center gap-3 small">
                    <!-- Checklist items summary -->
                    <div class="d-flex align-items-center gap-2">
                      <span class="text-muted small">Items:</span>
                      <span v-if="testSummary.green > 0" class="badge bg-success" title="Passing checklist items">
                        <i class="fa-solid fa-check me-1"></i>{{ testSummary.green }}
                      </span>
                      <span v-if="testSummary.red > 0" class="badge bg-danger" title="Failing checklist items">
                        <i class="fa-solid fa-xmark me-1"></i>{{ testSummary.red }}
                      </span>
                      <span v-if="testSummary.gray > 0" class="badge bg-secondary" title="Not yet run">
                        <i class="fa-solid fa-minus me-1"></i>{{ testSummary.gray }}
                      </span>
              </div>
                    
                    <!-- Divider -->
                    <span v-if="testSummary.totalTests > 0" class="text-muted">|</span>
                    
                    <!-- Individual tests summary -->
                    <div v-if="testSummary.totalTests > 0" class="d-flex align-items-center gap-2">
                      <span class="text-muted small">Tests:</span>
                      <span v-if="testSummary.totalPassingTests > 0" class="badge bg-success" title="Passing individual tests">
                        <i class="fa-solid fa-check me-1"></i>{{ testSummary.totalPassingTests }}
                      </span>
                      <span v-if="testSummary.totalFailingTests > 0" class="badge bg-danger" title="Failing individual tests">
                        <i class="fa-solid fa-xmark me-1"></i>{{ testSummary.totalFailingTests }}
                      </span>
                    </div>
                  </div>
              </div>
                <div class="d-flex align-items-center gap-2">
                  <button 
                    class="btn btn-sm btn-primary" 
                    @click.stop="runAllTests" 
                    :disabled="runningAllTests"
                    title="Run all tests">
                    <span v-if="runningAllTests" class="spinner-border spinner-border-sm me-1" role="status">
                      <span class="visually-hidden">Running...</span>
                    </span>
                    <i v-else class="fa-solid fa-play me-1"></i>
                    {{ runningAllTests ? 'Running...' : 'Run All Tests' }}
                  </button>
                <button class="btn btn-sm btn-outline-secondary" @click.stop="toggleSystemStatus" :title="systemStatusExpanded ? 'Collapse' : 'Expand'">
                  <i :class="systemStatusExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
                </div>
              </div>
              <div v-if="systemStatusExpanded" class="p-2 d-flex flex-column gap-2">
                <SystemStatusItem
                  v-for="item in checklist"
                  :key="item.key"
                  :title="item.title"
                  v-model:expanded="item.expanded"
                  :status="item.status"
                  :running="item.running"
                  :runDisabled="false"
                  @run="runTest(item.key)"
                >
                  <div v-if="item.report" v-html="item.report" class="test-report"></div>
                  <div v-else class="text-muted small">Click "Run" to execute this test</div>
                </SystemStatusItem>
              </div>
            </div>

            <!-- title row -->
            <div class="d-flex align-items-center justify-content-between mt-4 mb-2 px-3">
              <h1 class="taco-title mb-0">
                <span class="taco-title__icon">🛠️</span>
                <span class="taco-title__title">System Overview</span>
              </h1>

              <!-- right controls -->
              <div class="d-flex align-items-center gap-2">
                <!-- expand/collapse all -->
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-secondary" @click="expandAll">Expand all</button>
                  <button class="btn btn-sm btn-outline-secondary" @click="collapseAll">Collapse all</button>
                </div>
              </div>
            </div>

            <!-- main canisters group -->
            <div id="main-canisters-section" class="taco-container taco-container--l1 d-flex flex-column gap-2 p-0 mt-3">
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between section-header-clickable" @click="toggleMainCanisters">
                <div class="d-flex align-items-center gap-3">
                  <span :class="['status-light', `status-${mainCanistersStatus}`]"></span>
                <h2 class="h5 mb-0">Main Canisters</h2>
                  <div v-if="mainCanistersSummary.total > 0" class="d-flex align-items-center gap-2 small">
                    <span v-if="mainCanistersSummary.passing > 0" class="badge bg-success" title="Canisters with sufficient cycles (≥10T) AND all critical services running">
                      <i class="fa-solid fa-check me-1"></i>{{ mainCanistersSummary.passing }}
                    </span>
                    <span v-if="mainCanistersSummary.failing > 0" class="badge bg-danger" title="Canisters with low cycles (<10T) OR critical services not running">
                      <i class="fa-solid fa-xmark me-1"></i>{{ mainCanistersSummary.failing }}
                    </span>
                    <span v-if="mainCanistersSummary.unknown > 0" class="badge bg-secondary" title="Canisters with unknown status">
                      <i class="fa-solid fa-question me-1"></i>{{ mainCanistersSummary.unknown }}
                    </span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn btn-sm btn-outline-primary" @click.stop="refreshMainCanisters" title="Refresh all main canisters">
                    <i class="fa-solid fa-rotate me-1"></i>Refresh All
                  </button>
                <button class="btn btn-sm btn-outline-secondary" @click.stop="toggleMainCanisters" :title="mainCanistersExpanded ? 'Collapse' : 'Expand'">
                  <i :class="mainCanistersExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
                </div>
              </div>
              <div v-if="mainCanistersExpanded" class="p-2 d-flex flex-column gap-2">
                <SystemCanisterCard
                  v-for="c in mainCanisters"
                  :key="c.key"
                  :title="c.title"
                  :principal="resolvePrincipal(c.key)"
                  v-model:expanded="expandedMap[c.key]"
                  :cyclesT="cyclesMap[c.key]"
                  :loading="loadingMap[c.key]"
                  :timerStatus="timerStatusMap[c.key]"
                  :treasuryHeader="c.key === 'treasury' ? (treasuryHeader || undefined) : undefined"
                  :treasuryDetails="c.key === 'treasury' ? (treasuryDetails || undefined) : undefined"
                  :rewardsHeader="c.key === 'rewards' ? (rewardsHeader || undefined) : undefined"
                  :rewardsDetails="c.key === 'rewards' ? (rewardsDetails || undefined) : undefined"
                  :tokenList="c.key === 'dao_backend' ? (daoTokenList || undefined) : undefined"
                  :tokenAggregateWorst="c.key === 'dao_backend' ? (daoTokenWorst || undefined) : undefined"
                  :oldestTokenSyncDisplay="c.key === 'dao_backend' ? (daoOldestSyncDisplay || undefined) : undefined"
                  :governanceHeader="c.key === 'neuronSnapshot' ? (governanceHeader || undefined) : undefined"
                  :governanceDetails="c.key === 'neuronSnapshot' ? (governanceDetails || undefined) : undefined"
                  :isAdmin="isAdmin"
                  :isArchive="false"
                  @refresh="() => fetchCyclesFor(c.key)"
                />
              </div>
            </div>

            <!-- archives group -->
            <div id="archives-section" class="taco-container taco-container--l1 d-flex flex-column gap-2 p-0 mt-4">
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between section-header-clickable" @click="toggleArchives">
                <div class="d-flex align-items-center gap-3">
                  <span :class="['status-light', `status-${archiveCanistersStatus}`]"></span>
                <h2 class="h5 mb-0">Archives</h2>
                  <div v-if="archiveCanistersSummary.total > 0" class="d-flex align-items-center gap-2 small">
                    <span v-if="archiveCanistersSummary.passing > 0" class="badge bg-success" title="Canisters with sufficient cycles (≥10T) AND timer running">
                      <i class="fa-solid fa-check me-1"></i>{{ archiveCanistersSummary.passing }}
                    </span>
                    <span v-if="archiveCanistersSummary.failing > 0" class="badge bg-danger" title="Canisters with low cycles (<10T) OR timer not running">
                      <i class="fa-solid fa-xmark me-1"></i>{{ archiveCanistersSummary.failing }}
                    </span>
                    <span v-if="archiveCanistersSummary.unknown > 0" class="badge bg-secondary" title="Canisters with unknown status">
                      <i class="fa-solid fa-question me-1"></i>{{ archiveCanistersSummary.unknown }}
                    </span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn btn-sm btn-outline-primary" @click.stop="refreshArchiveCanisters" title="Refresh all archive canisters">
                    <i class="fa-solid fa-rotate me-1"></i>Refresh All
                  </button>
                <button class="btn btn-sm btn-outline-secondary" @click.stop="toggleArchives" :title="archivesExpanded ? 'Collapse' : 'Expand'">
                  <i :class="archivesExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
                </div>
              </div>
              <div v-if="archivesExpanded" class="p-2 d-flex flex-column gap-2">
                <SystemCanisterCard
                  v-for="c in archiveCanisters"
                  :key="c.key"
                  :title="c.title"
                  :principal="resolvePrincipal(c.key)"
                  v-model:expanded="expandedMap[c.key]"
                  :cyclesT="cyclesMap[c.key]"
                  :loading="loadingMap[c.key]"
                  :timerStatus="timerStatusMap[c.key]"
                  :governanceHeader="c.key === 'neuronSnapshot' ? (governanceHeader || undefined) : undefined"
                  :isAdmin="isAdmin"
                  :isArchive="true"
                  @refresh="() => fetchCyclesFor(c.key)"
                />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">
.system-view {
  .status-light {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
}

.status-green { background-color: #28a745; }
.status-orange { background-color: #fd7e14; }
.status-red { background-color: #dc3545; }
.status-gray { background-color: #6c757d; }

.section-header-clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.section-header-clickable:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.test-report {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.test-report .canister-results {
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  padding-left: 1rem;
  margin-top: 0.5rem;
}

.test-report .alert-danger {
  background-color: rgba(220, 53, 69, 0.2);
  border: 1px solid #dc3545;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  color: #ff6b6b;
  font-weight: 500;
}

.test-report .alert-danger strong {
  color: #ff8787;
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
// @ts-ignore - Vue SFC import resolution
import SystemCanisterCard from "../components/system/SystemCanisterCard.vue"
import SystemStatusItem from "../components/system/SystemStatusItem.vue"
import { useTacoStore } from "../stores/taco.store"
import { Actor } from '@dfinity/agent'
import { CANISTER_IDS, type EnvKey } from '../constants/canisterIds'
import { getEffectiveNetwork } from '../config/network-config'

// Minimal IDL with only get_canister_cycles
const minimalCyclesIdl = ({ IDL }: any) => IDL.Service({
  'get_canister_cycles': IDL.Func([], [IDL.Record({ cycles: IDL.Nat })], ['query'])
})

const tacoStore = useTacoStore()
const { appLoading } = storeToRefs(tacoStore)

// Helper to get anonymous agent from store (centralized caching)
const getAnonymousAgent = async () => {
  return await tacoStore.getAnonymousAgentPublic()
}

// Section expanded states
const systemStatusExpanded = ref(false) // Default collapsed, expand on test failure
const mainCanistersExpanded = ref(false) // Default collapsed
const archivesExpanded = ref(false) // Default collapsed

// Run all tests state
const runningAllTests = ref(false)

// Computed: Test summary counts
const testSummary = computed(() => {
  const green = checklist.filter(item => item.status === 'green').length
  const red = checklist.filter(item => item.status === 'red').length
  const gray = checklist.filter(item => item.status === 'gray').length
  const total = checklist.length
  
  // Sum up individual test counts across all checklist items
  const totalPassingTests = checklist.reduce((sum, item) => sum + item.passCount, 0)
  const totalFailingTests = checklist.reduce((sum, item) => sum + item.failCount, 0)
  const totalTests = checklist.reduce((sum, item) => sum + item.totalCount, 0)
  
  return { 
    green, red, gray, total,
    totalPassingTests, totalFailingTests, totalTests
  }
})

// Computed: Overall system status based on all checklist items
const overallSystemStatus = computed(() => {
  const allGray = checklist.every(item => item.status === 'gray')
  const anyRunning = checklist.some(item => item.running)
  const anyRed = checklist.some(item => item.status === 'red')
  const allGreen = checklist.every(item => item.status === 'green' || item.status === 'gray')
  
  if (anyRunning) return 'running'
  if (anyRed) return 'red'
  if (allGray) return 'gray'
  if (allGreen && !allGray) return 'green'
  return 'gray'
})

// Computed: Main canisters overall status
const mainCanistersStatus = computed(() => {
  const keys = mainCanisters.map(c => c.key)
  const allLoading = keys.every(k => loadingMap[k])
  const allNull = keys.every(k => cyclesMap[k] === null)
  
  // Only show gray if ALL are loading or ALL are null (no data yet)
  if (allLoading || allNull) return 'gray'
  
  // Check cycles AND important lamps for each canister (only those that have loaded)
  let hasIssue = false
  let hasCritical = false
  
  for (const k of keys) {
    const cycles = cyclesMap[k]
    
    // Skip canisters that haven't loaded yet
    if (cycles === null) continue
    
    // Check cycles
    if (cycles < 5) {
      hasCritical = true
      break
    }
    if (cycles < 10) {
      hasIssue = true
    }
    
    // Check canister-specific important lamps
    if (k === 'treasury') {
      // Trading and snapshot status
      if (treasuryHeader.value) {
        if (!treasuryHeader.value.tradingActive || !treasuryHeader.value.snapshotActive) {
          hasIssue = true
        }
      }
    } else if (k === 'rewards') {
      // Distribution timer status
      if (rewardsHeader.value) {
        if (!rewardsHeader.value.timerRunning) {
          hasIssue = true
        }
      }
    } else if (k === 'neuronSnapshot') {
      // Periodic timer and snapshot status
      if (governanceHeader.value) {
        if (!governanceHeader.value.periodicTimerRunning || !governanceHeader.value.snapshotActive) {
          hasIssue = true
        }
      }
    } else if (k === 'dao_backend') {
      // Token sync status (red = critical, orange = issue)
      if (daoTokenWorst.value === 'red') {
        hasCritical = true
        break
      } else if (daoTokenWorst.value === 'orange') {
        hasIssue = true
      }
    }
  }
  
  if (hasCritical) return 'red'
  if (hasIssue) return 'orange'
  return 'green'
})

// Computed: Archive canisters overall status
const archiveCanistersStatus = computed(() => {
  const keys = archiveCanisters.map(c => c.key)
  const allLoading = keys.every(k => loadingMap[k])
  const allNull = keys.every(k => cyclesMap[k] === null)
  
  // Only show gray if ALL are loading or ALL are null (no data yet)
  if (allLoading || allNull) return 'gray'
  
  // Check if any canister is low on cycles (< 10T) OR timer is not running (only loaded ones)
  const anyLow = keys.some(k => {
    const cycles = cyclesMap[k]
    if (cycles === null) return false // Skip unloaded
    const timerStatus = timerStatusMap[k]
    // Only check timer if we have status loaded; archives use outerLoopRunning
    const timerRunning = timerStatus ? (timerStatus.outerLoopRunning ?? true) : true
    return cycles < 10 || !timerRunning
  })
  
  // Check if any canister is critical (< 5T) OR timer is not running (only loaded ones)
  const anyCritical = keys.some(k => {
    const cycles = cyclesMap[k]
    if (cycles === null) return false // Skip unloaded
    const timerStatus = timerStatusMap[k]
    // Only check timer if we have status loaded; archives use outerLoopRunning
    const timerRunning = timerStatus ? (timerStatus.outerLoopRunning ?? true) : true
    return cycles < 5 || !timerRunning
  })
  
  if (anyCritical) return 'red'
  if (anyLow) return 'orange'
  return 'green'
})

// Computed: Main canisters summary counts
const mainCanistersSummary = computed(() => {
  const keys = mainCanisters.map(c => c.key)
  let passing = 0
  let failing = 0
  let unknown = 0
  
  keys.forEach(k => {
    const cycles = cyclesMap[k]
    let hasFail = false
    
    if (cycles === null) {
      unknown++
      return
    }
    
    // Check cycles
    if (cycles < 10) {
      hasFail = true
    }
    
    // Check canister-specific important lamps
    if (k === 'treasury') {
      // Trading and snapshot status
      if (treasuryHeader.value) {
        if (!treasuryHeader.value.tradingActive || !treasuryHeader.value.snapshotActive) {
          hasFail = true
        }
      }
    } else if (k === 'rewards') {
      // Distribution timer status
      if (rewardsHeader.value) {
        if (!rewardsHeader.value.timerRunning) {
          hasFail = true
        }
      }
    } else if (k === 'neuronSnapshot') {
      // Periodic timer and snapshot status
      if (governanceHeader.value) {
        if (!governanceHeader.value.periodicTimerRunning || !governanceHeader.value.snapshotActive) {
          hasFail = true
        }
      }
    } else if (k === 'dao_backend') {
      // Token sync status (red or orange = failing)
      if (daoTokenWorst.value === 'red' || daoTokenWorst.value === 'orange') {
        hasFail = true
      }
    }
    
    if (hasFail) {
      failing++
    } else {
      passing++
    }
  })
  
  return { passing, failing, unknown, total: keys.length }
})

// Computed: Archive canisters summary counts
const archiveCanistersSummary = computed(() => {
  const keys = archiveCanisters.map(c => c.key)
  let passing = 0
  let failing = 0
  let unknown = 0
  
  keys.forEach(k => {
    const cycles = cyclesMap[k]
    const timerStatus = timerStatusMap[k]
    // Only check timer if we have status loaded; archives use outerLoopRunning
    const timerRunning = timerStatus ? (timerStatus.outerLoopRunning ?? true) : true
    
    if (cycles === null) {
      unknown++
    } else if (cycles < 10 || !timerRunning) {
      // Failing if low cycles OR timer not running
      failing++
    } else {
      // Passing only if sufficient cycles AND timer running
      passing++
    }
  })
  
  return { passing, failing, unknown, total: keys.length }
})

// Checklist state
const checklist = reactive([
  { key: 'canisters-running', title: 'Are all canisters running and in gas?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'trading-regular', title: 'Is the trading bot trading regularly?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'rewards-regular', title: 'Are rewards distributed regularly?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'snapshots-portfolio', title: 'Are portfolio snapshots regular?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'snapshots-neuron', title: 'Are neuron snapshots regular?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'price-history', title: 'Is price history updating?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'allocation-voting', title: 'Does allocation voting work?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'grant-system', title: 'Is grant system cloning and voting?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
  { key: 'archives-regular', title: 'Are archives importing regularly?', status: 'gray', expanded: false, running: false, report: '', passCount: 0, failCount: 0, totalCount: 0 },
] as Array<{ key: string; title: string; status: 'gray' | 'green' | 'red'; expanded: boolean; running: boolean; report: string; passCount: number; failCount: number; totalCount: number }>)

// Determine admin: call DAO hasAdminPermission or use a simple check if available
const isAdmin = ref(false)

// Check if running on staging network
const isRunningOnStaging = computed(() => getEffectiveNetwork() === 'staging')

// Environment selection - default to staging if running on staging
const selectedEnv = ref<EnvKey>(getEffectiveNetwork() === 'staging' ? 'staging' : 'ic')

// Auto-refresh interval (in minutes, 0 = off)
const autoRunInterval = ref<number>(30) // Default: every 30 minutes
let autoRunTimerId: number | null = null

// Auto-expand on red status setting (default: false)
const autoExpandOnRed = ref<boolean>(false)

// Load auto-expand setting from localStorage
const loadAutoExpandSetting = () => {
  const saved = localStorage.getItem('taco-system-auto-expand')
  if (saved !== null) {
    autoExpandOnRed.value = saved === 'true'
  }
}

// Save auto-expand setting to localStorage
const handleAutoExpandChange = () => {
  localStorage.setItem('taco-system-auto-expand', String(autoExpandOnRed.value))
}

// Canister groups and keys
type CanKey = 'dao_backend' | 'treasury' | 'rewards' | 'neuronSnapshot' | 'validation'
  | 'trading_archive' | 'portfolio_archive' | 'price_archive' | 'dao_admin_archive' | 'dao_governance_archive'
  | 'dao_neuron_allocation_archive' | 'reward_distribution_archive' | 'reward_withdrawal_archive'

const mainCanisters = [
  { key: 'dao_backend' as CanKey, title: 'Backend (DAO.mo)' },
  { key: 'treasury' as CanKey, title: 'Portfolio (treasury.mo)' },
  { key: 'rewards' as CanKey, title: 'Rewards (rewards.mo)' },
  { key: 'neuronSnapshot' as CanKey, title: 'Governance (neuronSnapshot.mo)' },
  { key: 'validation' as CanKey, title: 'Validation (validation.mo)' },
]

const archiveCanisters = [
  { key: 'trading_archive' as CanKey, title: 'Trading Archive' },
  { key: 'portfolio_archive' as CanKey, title: 'Portfolio Archive' },
  { key: 'price_archive' as CanKey, title: 'Price Archive' },
  { key: 'dao_admin_archive' as CanKey, title: 'DAO Admin Archive' },
  { key: 'dao_governance_archive' as CanKey, title: 'DAO Governance Archive' },
  { key: 'dao_neuron_allocation_archive' as CanKey, title: 'DAO Neuron Allocation Archive' },
  { key: 'reward_distribution_archive' as CanKey, title: 'Reward Distribution Archive' },
  { key: 'reward_withdrawal_archive' as CanKey, title: 'Reward Withdrawal Archive' },
]

const resolvePrincipal = (key: CanKey): string => {
  const rec = CANISTER_IDS[key as keyof typeof CANISTER_IDS]
  if (!rec) return ''
  return rec[selectedEnv.value]
}

// Cycles state
const cyclesMap = reactive<Record<CanKey, number | null>>({
  dao_backend: null,
  treasury: null,
  rewards: null,
  neuronSnapshot: null,
  validation: null,
  trading_archive: null,
  portfolio_archive: null,
  price_archive: null,
  dao_admin_archive: null,
  dao_governance_archive: null,
  dao_neuron_allocation_archive: null,
  reward_distribution_archive: null,
  reward_withdrawal_archive: null
})
const loadingMap = reactive<Record<CanKey, boolean>>({
  dao_backend: false,
  treasury: false,
  rewards: false,
  neuronSnapshot: false,
  validation: false,
  trading_archive: false,
  portfolio_archive: false,
  price_archive: false,
  dao_admin_archive: false,
  dao_governance_archive: false,
  dao_neuron_allocation_archive: false,
  reward_distribution_archive: false,
  reward_withdrawal_archive: false
})
const timerStatusMap = reactive<Record<CanKey, any>>({
  dao_backend: null,
  treasury: null,
  rewards: null,
  neuronSnapshot: null,
  validation: null,
  trading_archive: null,
  portfolio_archive: null,
  price_archive: null,
  dao_admin_archive: null,
  dao_governance_archive: null,
  dao_neuron_allocation_archive: null,
  reward_distribution_archive: null,
  reward_withdrawal_archive: null
})
const treasuryHeader = ref<{
  tradingActive: boolean
  tradingStale: boolean
  lastTradeDisplay: string
  tokenWorst: 'green' | 'orange' | 'red'
  snapshotActive: boolean
  shortSyncActive: boolean
  longSyncActive: boolean
} | null>(null)

const treasuryDetails = ref<any | null>(null)
const rewardsHeader = ref<{
  timerRunning: boolean
  distributionStale: boolean
  lastDistributionDisplay: string
  isUnderfunded: boolean
} | null>(null)
const rewardsDetails = ref<any | null>(null)
const daoTokenList = ref<Array<{ symbol: string; lastSyncDisplay: string; statusClass: string; statusText: string }> | null>(null)
const daoTokenWorst = ref<'green' | 'orange' | 'red' | null>(null)
const daoOldestSyncDisplay = ref<string | null>(null)
const governanceHeader = ref<{ 
  snapshotActive: boolean
  lastSnapshotDisplay: string
  periodicTimerRunning: boolean
  lastPeriodicRunDisplay: string
  periodicTimerStale: 'green' | 'orange' | 'red'
} | null>(null)
const governanceDetails = ref<any | null>(null)
const expandedMap = reactive<Record<CanKey, boolean>>({
  dao_backend: false,
  treasury: false,
  rewards: false,
  neuronSnapshot: false,
  validation: false,
  trading_archive: false,
  portfolio_archive: false,
  price_archive: false,
  dao_admin_archive: false,
  dao_governance_archive: false,
  dao_neuron_allocation_archive: false,
  reward_distribution_archive: false,
  reward_withdrawal_archive: false
})

const createGenericActor = async (canisterId: string) => {
  // Use centralized anonymous agent from store
  const agent = await getAnonymousAgent()
  return Actor.createActor(minimalCyclesIdl as any, {
    agent,
    canisterId
  }) as any
}

const isArchiveKey = (key: CanKey) => (
  key === 'trading_archive' ||
  key === 'portfolio_archive' ||
  key === 'price_archive' ||
  key === 'dao_admin_archive' ||
  key === 'dao_governance_archive' ||
  key === 'dao_neuron_allocation_archive' ||
  key === 'reward_distribution_archive' ||
  key === 'reward_withdrawal_archive'
)

const createArchiveActor = async (key: CanKey, canisterId: string) => {
  try {
    // Use centralized anonymous agent from store
    const agent = await getAnonymousAgent()
    switch (key) {
      case 'trading_archive': {
        const mod = await import('../../../declarations/trading_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'portfolio_archive': {
        const mod = await import('../../../declarations/portfolio_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'price_archive': {
        const mod = await import('../../../declarations/price_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_admin_archive': {
        const mod = await import('../../../declarations/dao_admin_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_governance_archive': {
        const mod = await import('../../../declarations/dao_governance_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_neuron_allocation_archive': {
        const mod = await import('../../../declarations/dao_neuron_allocation_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'reward_distribution_archive': {
        const mod = await import('../../../declarations/reward_distribution_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'reward_withdrawal_archive': {
        const mod = await import('../../../declarations/reward_withdrawal_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
    }
  } catch (e) {
    console.error('Failed to create archive actor', key, e)
    return null
  }
  return null
}

const fetchCyclesFor = async (key: CanKey) => {
  try {
    loadingMap[key] = true
    const cid = resolvePrincipal(key)
    if (!cid) { cyclesMap[key] = null; loadingMap[key] = false; return }
    const actor = await createGenericActor(cid)
    const res = await actor.get_canister_cycles() as any
    const rec = Array.isArray(res) ? res[0] : res
    // Convert to T (trillion cycles)
    const trillion = 1_000_000_000_000n
    const t = Number((rec?.cycles ?? 0n) / trillion)
    cyclesMap[key] = t
    // Try fetching timer status if method exists (archives only)
    try {
      if (isArchiveKey(key)) {
        const archiveActor = await createArchiveActor(key, cid)
        if (archiveActor && typeof archiveActor.getTimerStatus === 'function') {
          const timerRes = await archiveActor.getTimerStatus()
          timerStatusMap[key] = timerRes
        } else {
          timerStatusMap[key] = null
        }
      } else if (key === 'treasury') {
        // Build treasury header + read-only details using selected environment actors
        try {
          const cid = resolvePrincipal('treasury')
          const { idlFactory: treasuryIDL } = await import('../../../declarations/treasury/treasury.did.js')
          const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
          const agent = await getAnonymousAgent()
          const tActor: any = Actor.createActor(treasuryIDL, { agent, canisterId: cid })
          const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })

          const [tsRes, cfgRaw, tokensResp, snapStatus, longSyncTimerRes] = await Promise.all([
            tActor.getTradingStatus(),
            tActor.getRebalanceConfig?.() ?? Promise.resolve(null),
            dActor.getTokenDetailsWithoutPastPrices(),
            tActor.getPortfolioSnapshotStatus(),
            tActor.getLongSyncTimerStatus?.() ?? Promise.resolve(null),
            tacoStore.getRebalanceConfig().catch(() => null) // Ensure store config is loaded
          ])

          // Trading metrics and status
          let tradingActive = false
          let lastAttemptNs: any = null
          let lastTradeDisplay = 'Never'
          let intervalNs: any = null
          let successRatePct = '0.0%'
          let avgSlippagePct = '0.00%'
          let totalTradesExecuted = 0
          let totalTradesFailed = 0
          if (tsRes && 'ok' in tsRes) {
            const { metrics, rebalanceStatus } = tsRes.ok
            tradingActive = !!('Trading' in rebalanceStatus)
            lastAttemptNs = metrics?.lastRebalanceAttempt
            totalTradesExecuted = Number(metrics?.totalTradesExecuted ?? 0)
            totalTradesFailed = Number(metrics?.totalTradesFailed ?? 0)
            successRatePct = metrics?.successRate != null ? `${(Number(metrics.successRate) * 100).toFixed(1)}%` : '0.0%'
            avgSlippagePct = metrics?.avgSlippage != null ? `${Number(metrics.avgSlippage).toFixed(2)}%` : '0.00%'
            if (lastAttemptNs) lastTradeDisplay = new Date(Number(BigInt(lastAttemptNs) / 1_000_000n)).toLocaleString()
          }
          if (cfgRaw) {
            const cfg = Array.isArray(cfgRaw) ? cfgRaw[0] : cfgRaw
            intervalNs = cfg?.rebalanceIntervalNS
          }
          console.log('[Treasury Data] cfgRaw:', cfgRaw, 'intervalNs from cfgRaw:', intervalNs)
          console.log('[Treasury Data] tacoStore.rebalanceConfig:', tacoStore.rebalanceConfig)
          // Fallback to store config if cfgRaw failed
          if (!intervalNs && tacoStore.rebalanceConfig?.rebalanceIntervalNS) {
            intervalNs = tacoStore.rebalanceConfig.rebalanceIntervalNS
            console.log('[Treasury Data] Using intervalNs from store:', intervalNs)
          }
          console.log('[Treasury Data] Final intervalNs:', intervalNs, 'lastAttemptNs:', lastAttemptNs)
          let tradingStale = false
          if (intervalNs && lastAttemptNs) {
            const periods = Number((BigInt(Date.now()) * 1_000_000n - BigInt(lastAttemptNs)) / BigInt(intervalNs))
            tradingStale = periods > 2
          }

          // Tokens from selected DAO
          const tokenDetails = tokensResp || []
          let worst: 'green' | 'orange' | 'red' = 'green'
          const tokens = tokenDetails.map((entry: any) => {
            const token = entry[1]
            const symbol = token?.tokenSymbol || 'UNKNOWN'
            const lastSyncDisplay = token?.lastTimeSynced ? new Date(Number(BigInt(token.lastTimeSynced) / 1_000_000n)).toLocaleString() : 'Never'
            let statusClass = 'active'
            let statusText = ''
            if (!token?.Active) statusClass = 'inactive'
            else if (token?.pausedDueToSyncFailure) { statusClass = 'paused'; statusText = '(Sync Failed)' }
            else if (token?.isPaused) { statusClass = 'paused'; statusText = '(Manually Paused)' }
            if (statusClass === 'inactive' || token?.pausedDueToSyncFailure) worst = 'red'
            else if (statusClass === 'paused' && worst !== 'red') worst = 'orange'
            return { symbol, lastSyncDisplay, statusClass, statusText }
          })

          // Snapshot status from selected treasury
          const snapshotActive = !!('Running' in snapStatus.status)
          
          // Extract long sync timer status (needed for header)
          let longSyncActive = false
          let longSyncLastRun = null
          if (longSyncTimerRes) {
            const timerStatus = longSyncTimerRes
            longSyncActive = timerStatus.isRunning || false
            longSyncLastRun = timerStatus.lastRunTime || null
          }

          treasuryHeader.value = {
            tradingActive,
            tradingStale,
            lastTradeDisplay,
            tokenWorst: worst,
            snapshotActive,
            shortSyncActive: true, // Short sync is always active when trading is running
            longSyncActive
          }

          let tradingWarning: any = null
          if (intervalNs && lastAttemptNs) {
            const nowNs = BigInt(Date.now()) * 1_000_000n
            const lastAttemptBigInt = BigInt(lastAttemptNs)
            const intervalBigInt = BigInt(intervalNs)
            const delayNs = nowNs - lastAttemptBigInt
            const periods = Math.floor(Number(delayNs) / Number(intervalBigInt))
            console.log('[Treasury Warning] Now:', Date.now(), 'Last:', lastAttemptNs, 'Interval:', intervalNs, 'Periods:', periods)
            if (periods > 5) tradingWarning = { level: 'danger', message: `Trading bot is ${periods} periods overdue! Last attempt was ${periods} intervals ago.` }
            else if (periods > 2) tradingWarning = { level: 'warning', message: `Trading bot is ${periods} periods overdue.` }
          }

          // derive latest short sync time from trading metrics (lastUpdate)
          const metricsObj: any = (tsRes && 'ok' in tsRes) ? tsRes.ok.metrics : null
          
          // Calculate trading interval and periods for display
          let tradingIntervalMinutes = null
          let periodsSinceLastTrade = null
          if (intervalNs && lastAttemptNs) {
            tradingIntervalMinutes = Math.round(Number(intervalNs) / (60 * 1_000_000_000))
            const nowNs = BigInt(Date.now()) * 1_000_000n
            const lastAttemptBigInt = BigInt(lastAttemptNs)
            const intervalBigInt = BigInt(intervalNs)
            const delayNs = nowNs - lastAttemptBigInt
            periodsSinceLastTrade = Math.floor(Number(delayNs) / Number(intervalBigInt))
          }

          treasuryDetails.value = {
            tradingActive, // Add trading status
            tradingIntervalMinutes,
            periodsSinceLastTrade,
            tradingMetrics: {
              lastRebalanceAttemptDisplay: lastTradeDisplay,
              totalTradesExecuted,
              totalTradesFailed,
              successRatePct,
              avgSlippagePct
            },
            tradingWarning,
            tokens,
            snapshots: {
              active: snapshotActive,
              intervalMinutes: snapStatus.intervalMinutes,
              lastSnapshotDisplay: new Date(Number(BigInt(snapStatus.lastSnapshotTime) / 1_000_000n)).toLocaleString()
            },
            shortSync: {
              active: true,
              intervalMinutes: cfgRaw && (Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any))?.shortSyncIntervalNS ? Number(((Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any)).shortSyncIntervalNS) / (60n * 1_000_000_000n)) : undefined,
              lastSyncDisplay: metricsObj?.lastUpdate ? new Date(Number(BigInt(metricsObj.lastUpdate) / 1_000_000n)).toLocaleString() : undefined
            },
            longSync: {
              active: longSyncActive,
              intervalMinutes: cfgRaw && (Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any))?.longSyncIntervalNS ? Number(((Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any)).longSyncIntervalNS) / (60n * 1_000_000_000n)) : undefined,
              lastSyncDisplay: longSyncLastRun ? new Date(Number(BigInt(longSyncLastRun) / 1_000_000n)).toLocaleString() : undefined
            }
          }
        } catch (_) {
          treasuryHeader.value = null
          treasuryDetails.value = null
        }
      } else if (key === 'dao_backend') {
        // Load DAO token sync list and aggregate lamp from selected env
        try {
          const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
          const agent = await getAnonymousAgent()
          const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })
          const tokenDetails = await dActor.getTokenDetailsWithoutPastPrices()
          const tokens = (tokenDetails || []).map((entry: any) => {
            const token = entry[1]
            const symbol = token?.tokenSymbol || 'UNKNOWN'
            const lastSyncDisplay = token?.lastTimeSynced ? new Date(Number(BigInt(token.lastTimeSynced) / 1_000_000n)).toLocaleString() : 'Never'
            let statusClass = 'active'
            let statusText = ''
            if (!token?.Active) statusClass = 'inactive'
            else if (token?.pausedDueToSyncFailure) { statusClass = 'paused'; statusText = '(Sync Failed)' }
            else if (token?.isPaused) { statusClass = 'paused'; statusText = '(Manually Paused)' }
            return { symbol, lastSyncDisplay, statusClass, statusText }
          })
          // compute oldest token sync time for backend header display
          const times = (tokenDetails || []).map((entry: any) => Number(BigInt(entry[1]?.lastTimeSynced || 0n) / 1_000_000n)).filter((n: number) => n > 0)
          const oldestMs = times.length ? Math.min(...times) : 0
          const oldestDisplay = oldestMs ? new Date(oldestMs).toLocaleString() : 'Never'
          let worst: 'green' | 'orange' | 'red' = 'green'
          for (const t of tokens) {
            if (t.statusClass === 'inactive') { worst = 'red'; break }
            if (t.statusClass === 'paused' && (worst === 'green' || worst === 'orange')) worst = 'orange'
          }
          daoTokenList.value = tokens
          daoTokenWorst.value = worst
          daoOldestSyncDisplay.value = oldestDisplay
        } catch (_) {
          daoTokenList.value = null
          daoTokenWorst.value = null
          daoOldestSyncDisplay.value = null
        }
      } else if (key === 'neuronSnapshot') {
        // Load governance snapshot status and NNS periodic timer from selected env
        try {
          const { idlFactory: neuronIDL } = await import('../../../declarations/neuronSnapshot/neuronSnapshot.did.js')
          const agent = await getAnonymousAgent()
          const nActor: any = Actor.createActor(neuronIDL, { agent, canisterId: resolvePrincipal('neuronSnapshot') })
          
          const [snapInfoArr, periodicStatus] = await Promise.all([
            nActor.get_neuron_snapshots_info(0, 1), // Get the latest snapshot
            nActor.getPeriodicTimerStatus?.() ?? Promise.resolve(null),
          ])
          
          // Process snapshot info
          let snapshotActive = false
          let lastSnapshotDisplay = 'Never'
          if (Array.isArray(snapInfoArr) && snapInfoArr.length) {
            const info = snapInfoArr[0]
            snapshotActive = true
            lastSnapshotDisplay = info?.timestamp ? new Date(Number(info.timestamp) / 1_000_000).toLocaleString() : 'Never'
          }
          
          // Process periodic timer status
          let periodicTimerRunning = false
          let lastPeriodicRunDisplay = 'Never'
          let periodicTimerStale: 'green' | 'orange' | 'red' = 'green'
          let intervalSeconds = 3600 // Default 1 hour
          let nextRunDisplay = 'Not scheduled'
          
          if (periodicStatus) {
            periodicTimerRunning = periodicStatus.is_running || false
            intervalSeconds = Number(periodicStatus.interval_seconds || 3600)
            
            const lastRunTime = periodicStatus.last_run_time
            if (lastRunTime && Number(lastRunTime) > 0) {
              // Timestamps are in seconds, convert to milliseconds
              const lastRunMs = Number(lastRunTime) * 1000
              lastPeriodicRunDisplay = new Date(lastRunMs).toLocaleString()
              
              // Calculate staleness based on periods (1 period = interval seconds)
              const nowMs = Date.now()
              const timeSinceLastRun = nowMs - lastRunMs
              const periodMs = intervalSeconds * 1000
              const periodsOverdue = timeSinceLastRun / periodMs
              
              if (periodsOverdue > 3) {
                periodicTimerStale = 'red' // More than 3 periods
              } else if (periodsOverdue > 1) {
                periodicTimerStale = 'orange' // More than 1 period
          } else {
                periodicTimerStale = 'green' // Within 1 period
              }
            }
            
            const nextRunTime = periodicStatus.next_run_time
            if (nextRunTime && Number(nextRunTime) > 0) {
              // Timestamps are in seconds, convert to milliseconds
              nextRunDisplay = new Date(Number(nextRunTime) * 1000).toLocaleString()
            } else if (lastRunTime && Number(lastRunTime) > 0 && periodicTimerRunning) {
              // If next run time not provided but we have last run time, calculate it
              const calculatedNextRunMs = (Number(lastRunTime) + intervalSeconds) * 1000
              nextRunDisplay = new Date(calculatedNextRunMs).toLocaleString()
            }
          }
          
          governanceHeader.value = {
            snapshotActive,
            lastSnapshotDisplay,
            periodicTimerRunning,
            lastPeriodicRunDisplay,
            periodicTimerStale
          }
          
          governanceDetails.value = {
            snapshotActive,
            lastSnapshotDisplay,
            periodicTimerRunning,
            lastPeriodicRunDisplay,
            nextRunDisplay,
            intervalSeconds,
            intervalDisplay: formatSeconds(intervalSeconds),
            periodicTimerStale
          }
        } catch (err) {
          console.error('[SystemView] Error loading governance data:', err)
          governanceHeader.value = null
          governanceDetails.value = null
        }
      } else if (key === 'rewards') {
        // Load rewards distribution status from selected env
        try {
          const { idlFactory: rewardsIDL } = await import('../../../declarations/rewards/rewards.did.js')
          const agent = await getAnonymousAgent()
          const rActor: any = Actor.createActor(rewardsIDL, { agent, canisterId: resolvePrincipal('rewards') })
          
          // Fetch config and status
          const [config, totalDistributed, tacoBalance, currentNeuronBalances] = await Promise.all([
            rActor.getConfiguration(),
            rActor.getTotalDistributed?.() ?? Promise.resolve(0),
            rActor.getTacoBalance?.() ?? Promise.resolve(0),
            rActor.getCurrentTotalNeuronBalances?.() ?? Promise.resolve(0),
          ])
          
          const timerRunning = config?.timerRunning || false
          const lastDistributionTime = config?.lastDistributionTime || 0
          const nextScheduledDistribution = config?.nextScheduledDistribution || null
          const totalDistributions = config?.totalDistributions || 0
          const distributionPeriodNS = config?.distributionPeriodNS || 0
          const periodicRewardPot = config?.periodicRewardPot || 0
          
          // Format timestamps
          const lastDistributionDisplay = lastDistributionTime ? new Date(Number(BigInt(lastDistributionTime) / 1_000_000n)).toLocaleString() : 'Never'
          const nextScheduledDisplay = nextScheduledDistribution ? new Date(Number(BigInt(nextScheduledDistribution) / 1_000_000n)).toLocaleString() : 'Not scheduled'
          
          // Check if distribution is stale (more than 2 periods overdue)
          const now = Date.now() * 1_000_000
          const periodNS = Number(distributionPeriodNS)
          const timeSinceLastDistribution = now - Number(lastDistributionTime)
          const periodsOverdue = periodNS > 0 ? timeSinceLastDistribution / periodNS : 0
          const distributionStale = periodsOverdue > 2
          
          // Calculate available balance and check if underfunded
          // Balances are in e8s format (could be BigInt or object with e8s property)
          const tacoBalanceNum = (typeof tacoBalance === 'object' && 'e8s' in tacoBalance) 
            ? Number(tacoBalance.e8s) / 1e8 
            : (typeof tacoBalance === 'bigint' || typeof tacoBalance === 'number') 
              ? Number(tacoBalance) / 1e8 
              : 0
          const currentNeuronBalancesNum = (typeof currentNeuronBalances === 'object' && 'e8s' in currentNeuronBalances) 
            ? Number(currentNeuronBalances.e8s) / 1e8 
            : (typeof currentNeuronBalances === 'bigint' || typeof currentNeuronBalances === 'number') 
              ? Number(currentNeuronBalances) / 1e8 
              : 0
          const availableBalanceNum = tacoBalanceNum - currentNeuronBalancesNum
          const periodicRewardPotNum = Number(periodicRewardPot)
          
          // Check if next distribution is scheduled and underfunded
          const hasScheduledDistribution = nextScheduledDistribution && Number(nextScheduledDistribution) > 0
          const isUnderfunded = hasScheduledDistribution && availableBalanceNum < periodicRewardPotNum
          
          // Distribution warning similar to trading bot
          let distributionWarning = null
          if (periodsOverdue > 5) {
            distributionWarning = {
              level: 'danger',
              message: `Distribution is ${Math.floor(periodsOverdue)} periods overdue! Last distribution was ${Math.floor(periodsOverdue)} periods ago.`
            }
          } else if (periodsOverdue > 2) {
            distributionWarning = {
              level: 'warning',
              message: `Distribution is ${Math.floor(periodsOverdue)} periods overdue. Last distribution was ${Math.floor(periodsOverdue)} periods ago.`
            }
          }
          
          // Funding warning
          let fundingWarning = null
          if (isUnderfunded) {
            const shortfall = periodicRewardPotNum - availableBalanceNum
            fundingWarning = {
              message: `Available balance (${availableBalanceNum.toFixed(2)} TACO) is insufficient for the next scheduled distribution. Reward pot requires ${periodicRewardPotNum.toFixed(2)} TACO. Shortfall: ${shortfall.toFixed(2)} TACO. Please fund the rewards canister before the next distribution.`
            }
          }
          
          // Funding runway report
          let fundingReport = null
          if (periodicRewardPotNum > 0) {
            const periodsFunded = Math.floor(availableBalanceNum / periodicRewardPotNum)
            const distributionPeriodDays = Math.round(periodNS / (24 * 60 * 60 * 1_000_000_000))
            const daysCovered = periodsFunded * distributionPeriodDays
            
            // Format time display
            let timeDisplay = ''
            if (daysCovered === 0) {
              timeDisplay = '< 1 period'
            } else if (daysCovered < 7) {
              timeDisplay = `${daysCovered} day${daysCovered !== 1 ? 's' : ''}`
            } else if (daysCovered < 30) {
              const weeks = Math.floor(daysCovered / 7)
              const remainingDays = daysCovered % 7
              timeDisplay = `${weeks} week${weeks !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`
            } else if (daysCovered < 365) {
              const months = Math.floor(daysCovered / 30)
              const remainingDays = daysCovered % 30
              timeDisplay = `${months} month${months !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`
            } else {
              const years = Math.floor(daysCovered / 365)
              const remainingMonths = Math.floor((daysCovered % 365) / 30)
              timeDisplay = `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
            }
            
            // Calculate next funding date (when funds will be depleted)
            let nextFundingDate = null
            if (lastDistributionTime && periodsFunded > 0) {
              const lastDistMs = Number(BigInt(lastDistributionTime) / 1_000_000n)
              const depletionMs = lastDistMs + (daysCovered * 24 * 60 * 60 * 1000)
              nextFundingDate = new Date(depletionMs).toLocaleString()
            }
            
            // Determine color class based on funding level
            let periodsClass = 'text-success'
            if (periodsFunded < 1) {
              periodsClass = 'text-danger fw-bold'
            } else if (periodsFunded < 3) {
              periodsClass = 'text-warning fw-bold'
            }
            
            fundingReport = {
              periodsFunded: periodsFunded > 0 ? periodsFunded : '< 1',
              timeDisplay,
              nextFundingDate,
              periodsClass
            }
          }
          
          rewardsHeader.value = {
            timerRunning,
            distributionStale,
            lastDistributionDisplay,
            isUnderfunded
          }
          
          // Format totalDistributed (also in e8s format)
          const totalDistributedNum = (typeof totalDistributed === 'object' && 'e8s' in totalDistributed) 
            ? Number(totalDistributed.e8s) / 1e8 
            : (typeof totalDistributed === 'bigint' || typeof totalDistributed === 'number') 
              ? Number(totalDistributed) / 1e8 
              : 0
          
          rewardsDetails.value = {
            timerRunning,
            distributionWarning,
            fundingWarning,
            fundingReport,
            lastDistributionDisplay,
            nextScheduledDisplay,
            totalDistributions,
            distributionPeriodDays: Math.round(periodNS / (24 * 60 * 60 * 1_000_000_000)),
            periodicRewardPot: periodicRewardPotNum.toString(),
            tacoBalance: tacoBalanceNum.toFixed(2),
            currentNeuronBalances: currentNeuronBalancesNum.toFixed(2),
            totalDistributed: totalDistributedNum.toFixed(2),
            availableBalance: availableBalanceNum.toFixed(2)
          }
        } catch (_) {
          rewardsHeader.value = null
          rewardsDetails.value = null
        }
      } else {
        timerStatusMap[key] = null
      }
    } catch (_) {
      timerStatusMap[key] = null
    }
  } catch (e) {
    console.error('get_canister_cycles failed for', key, e)
    cyclesMap[key] = null
    timerStatusMap[key] = null
  } finally {
    loadingMap[key] = false
  }
}

// Utility: Format seconds to human-readable duration
const formatSeconds = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
  return `${hours}h ${mins}m`
}

const refreshCycles = () => {
  // Clear all cached header/detail data when switching environments
  treasuryHeader.value = null
  treasuryDetails.value = null
  rewardsHeader.value = null
  rewardsDetails.value = null
  governanceHeader.value = null
  governanceDetails.value = null
  daoTokenList.value = null
  daoTokenWorst.value = null
  daoOldestSyncDisplay.value = null
  
  const allKeys: CanKey[] = [...mainCanisters, ...archiveCanisters].map(x => x.key)
  // Fetch each canister independently without blocking - UI updates as each completes
  allKeys.forEach(k => fetchCyclesFor(k))
}

// Full auto-run sequence (used by initial load, environment change, and auto-refresh)
const runFullAutoRunSequence = async () => {
  try {
    console.log('[Auto-Run] Starting full auto-run sequence...')
    
    // Step 1: Run all tests
    console.log('[Auto-Run] Step 1: Running all tests...')
    await runAllTests()
    console.log('[Auto-Run] All tests completed')
    
    // Step 2: Refresh main canisters
    console.log('[Auto-Run] Step 2: Refreshing main canisters...')
    refreshMainCanisters()
    
    // Step 3: Refresh archive canisters
    console.log('[Auto-Run] Step 3: Refreshing archive canisters...')
    refreshArchiveCanisters()
    
    console.log('[Auto-Run] Full auto-run sequence completed')
  } catch (error) {
    console.error('[Auto-Run] Error in auto-run sequence:', error)
  }
}

// Handle environment change - clear all state and run full auto-run sequence
const handleEnvironmentChange = async () => {
  console.log('[Environment Change] Switching to:', selectedEnv.value)
  console.log('[Environment Change] Clearing all previous state...')
  
  // 1. Clear all checklist items (System Status section)
  checklist.forEach(item => {
    item.status = 'gray'
    item.report = ''
    item.running = false
    item.expanded = false
    item.passCount = 0
    item.failCount = 0
    item.totalCount = 0
  })
  
  // 2. Clear all canister data (Main Canisters & Archives sections)
  const allKeys: CanKey[] = [...mainCanisters, ...archiveCanisters].map(x => x.key)
  allKeys.forEach(k => {
    cyclesMap[k] = null
    loadingMap[k] = false
    timerStatusMap[k] = null
    expandedMap[k] = false // Collapse all individual canister cards
  })
  
  // 3. Clear all cached header/detail data
  treasuryHeader.value = null
  treasuryDetails.value = null
  rewardsHeader.value = null
  rewardsDetails.value = null
  governanceHeader.value = null
  governanceDetails.value = null
  daoTokenList.value = null
  daoTokenWorst.value = null
  daoOldestSyncDisplay.value = null
  
  // 4. Collapse all sections to start fresh
  systemStatusExpanded.value = false
  mainCanistersExpanded.value = false
  archivesExpanded.value = false
  
  console.log('[Environment Change] State cleared. Running full auto-run sequence...')
  
  // 5. Run full auto-run sequence in order: tests, main canisters, archives
  await runFullAutoRunSequence()
}

// Set up auto-refresh timer
const setupAutoRefreshTimer = () => {
  // Clear existing timer if any
  if (autoRunTimerId !== null) {
    clearInterval(autoRunTimerId)
    autoRunTimerId = null
  }
  
  // If interval is 0 (off), don't set up timer
  if (autoRunInterval.value === 0) {
    console.log('[Auto-Refresh] Auto-refresh disabled')
    return
  }
  
  // Set up new timer
  const intervalMs = autoRunInterval.value * 60 * 1000 // Convert minutes to milliseconds
  console.log(`[Auto-Refresh] Setting up auto-refresh every ${autoRunInterval.value} minutes`)
  
  autoRunTimerId = window.setInterval(() => {
    console.log(`[Auto-Refresh] Triggering scheduled refresh (every ${autoRunInterval.value} min)`)
    runFullAutoRunSequence()
  }, intervalMs)
}

// Handle interval change
const handleIntervalChange = () => {
  console.log('[Auto-Refresh] Interval changed to:', autoRunInterval.value === 0 ? 'Off' : `${autoRunInterval.value} min`)
  setupAutoRefreshTimer()
}

const toggleSystemStatus = () => { 
  systemStatusExpanded.value = !systemStatusExpanded.value 
}
const toggleMainCanisters = () => { 
  mainCanistersExpanded.value = !mainCanistersExpanded.value 
}
const toggleArchives = () => { 
  archivesExpanded.value = !archivesExpanded.value 
}

const expandAll = () => { Object.keys(expandedMap).forEach(k => expandedMap[k as CanKey] = true) }
const collapseAll = () => { Object.keys(expandedMap).forEach(k => expandedMap[k as CanKey] = false) }

// Refresh functions for sections
const refreshMainCanisters = () => {
  console.log('[RefreshMainCanisters] Refreshing all main canisters')
  mainCanisters.forEach(c => {
    fetchCyclesFor(c.key).then(() => {
      // After refresh, expand/collapse individual cards based on status
      // Check both cycles AND important lamps
      const cycles = cyclesMap[c.key]
      let hasFail = false
      
      if (cycles !== null) {
        // Check cycles
        if (cycles < 10) {
          hasFail = true
        }
        
        // Check canister-specific important lamps
        if (c.key === 'treasury') {
          if (treasuryHeader.value && (!treasuryHeader.value.tradingActive || !treasuryHeader.value.snapshotActive)) {
            hasFail = true
          }
        } else if (c.key === 'rewards') {
          if (rewardsHeader.value && !rewardsHeader.value.timerRunning) {
            hasFail = true
          }
        } else if (c.key === 'neuronSnapshot') {
          if (governanceHeader.value && (!governanceHeader.value.periodicTimerRunning || !governanceHeader.value.snapshotActive)) {
            hasFail = true
          }
        } else if (c.key === 'dao_backend') {
          if (daoTokenWorst.value === 'red' || daoTokenWorst.value === 'orange') {
            hasFail = true
          }
        }
        
        // Only auto-expand/collapse if setting is enabled
        if (autoExpandOnRed.value) {
          expandedMap[c.key] = hasFail // Expand if failing, collapse if passing
        }
      }
    })
  })
}

const refreshArchiveCanisters = () => {
  console.log('[RefreshArchiveCanisters] Refreshing all archive canisters')
  archiveCanisters.forEach(c => {
    fetchCyclesFor(c.key).then(() => {
      // After refresh, expand/collapse individual cards based on status (only if auto-expand enabled)
      // Archives require BOTH sufficient cycles AND timer running
      if (autoExpandOnRed.value) {
        const cycles = cyclesMap[c.key]
        const timerStatus = timerStatusMap[c.key]
        // Only check timer if we have status loaded; archives use outerLoopRunning
        const timerRunning = timerStatus ? (timerStatus.outerLoopRunning ?? true) : true
        
        if (cycles !== null) {
          if (cycles < 10 || !timerRunning) {
            expandedMap[c.key] = true // Expand if failing (low cycles OR timer not running)
          } else {
            expandedMap[c.key] = false // Collapse if passing (sufficient cycles AND timer running)
          }
        }
      }
    })
  })
}

// Helper: Scroll to and expand a section
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Expand the section if it's collapsed
    if (sectionId === 'main-canisters-section') {
      mainCanistersExpanded.value = true
    } else if (sectionId === 'archives-section') {
      archivesExpanded.value = true
    }
  }
}

// Helper: Expand a specific canister card
const expandCanister = (canisterKey: CanKey) => {
  expandedMap[canisterKey] = true
  const sectionId = mainCanisters.some(c => c.key === canisterKey) 
    ? 'main-canisters-section' 
    : 'archives-section'
  scrollToSection(sectionId)
}

// Test runner
const runTest = async (testKey: string) => {
  const test = checklist.find(t => t.key === testKey)
  if (!test) return

  test.running = true
  test.status = 'gray'
  test.report = ''
  // Don't auto-expand here - let it be controlled by the auto-expand setting after test completes

  try {
    if (testKey === 'canisters-running') {
      await testCanistersRunning(test)
    } else if (testKey === 'archives-regular') {
      await testArchivesImporting(test)
    } else if (testKey === 'trading-regular') {
      await testTradingBotRegular(test)
    } else if (testKey === 'rewards-regular') {
      await testRewardsRegular(test)
    } else if (testKey === 'grant-system') {
      await testGrantSystem(test)
    } else if (testKey === 'snapshots-neuron') {
      await testNeuronSnapshots(test)
    } else if (testKey === 'price-history') {
      await testPriceHistory(test)
    } else if (testKey === 'allocation-voting') {
      await testAllocationVoting(test)
    } else if (testKey === 'snapshots-portfolio') {
      await testPortfolioSnapshots(test)
    } else {
      // Placeholder for other tests
      test.status = 'gray'
      test.report = '<div class="text-muted">Test not yet implemented</div>'
    }
  } catch (error) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error}</div>`
  } finally {
    test.running = false
    
    // After test completes, conditionally expand/collapse based on status and setting
    if (autoExpandOnRed.value) {
      test.expanded = test.status === 'red' // Expand if red, collapse otherwise
    }
  }
}

// Run all tests sequentially
const runAllTests = async () => {
  if (runningAllTests.value) return
  
  runningAllTests.value = true
  systemStatusExpanded.value = true // Ensure section is expanded
  
  try {
    // Reset all checklist items before starting
    console.log('[Run All Tests] Resetting all checklist items...')
    for (const item of checklist) {
      item.status = 'gray'
      item.report = ''
      item.running = false
      item.expanded = false
      item.passCount = 0
      item.failCount = 0
      item.totalCount = 0
    }
    
    // Small delay to let UI update and show reset state
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Run each test sequentially
    for (const item of checklist) {
      console.log(`[Run All Tests] Starting test: ${item.key}`)
      await runTest(item.key)
      // Note: expand/collapse is now handled in runTest's finally block based on autoExpandOnRed setting
      
      // Small delay between tests to avoid overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('[Run All Tests] All tests completed')
  } catch (error) {
    console.error('[Run All Tests] Error:', error)
  } finally {
    runningAllTests.value = false
  }
}

// Test: Are all canisters running and in gas?
const testCanistersRunning = async (test: any) => {
  const allKeys: CanKey[] = [...mainCanisters, ...archiveCanisters].map(x => x.key)
  const results: Array<{ name: string; key: CanKey; cycles: number | null; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  // Test all canisters in parallel
  await Promise.all(allKeys.map(async (key) => {
    const canisterName = [...mainCanisters, ...archiveCanisters].find(c => c.key === key)?.title || key
    
    try {
      const cid = resolvePrincipal(key)
      if (!cid) {
        results.push({
          name: canisterName,
          key,
          cycles: null,
          status: 'error',
          message: 'No canister ID configured'
        })
        return
      }

      const actor = await createGenericActor(cid)
      const res = await actor.get_canister_cycles() as any
      const rec = Array.isArray(res) ? res[0] : res
      const trillion = 1_000_000_000_000n
      const cyclesT = Number((rec?.cycles ?? 0n) / trillion)
      
      // Determine status based on cycles
      let status: 'pass' | 'fail' = 'pass'
      let message = `${cyclesT}T cycles`
      
      if (cyclesT < 5) {
        status = 'fail'
        message = `${cyclesT}T cycles - CRITICAL: Below 5T`
      } else if (cyclesT < 10) {
        status = 'fail'
        message = `${cyclesT}T cycles - WARNING: Below 10T`
      }
      
      results.push({
        name: canisterName,
        key,
        cycles: cyclesT,
        status,
        message
      })
    } catch (error: any) {
      results.push({
        name: canisterName,
        key,
        cycles: null,
        status: 'error',
        message: `Failed to fetch: ${error.message || 'Unknown error'}`
      })
    }
  }))

  // Generate report
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const errors = results.filter(r => r.status === 'error').length
  const total = results.length

  // Set counts
  test.passCount = passed
  test.failCount = failed + errors
  test.totalCount = total

  // Overall status
  if (errors > 0 || failed > 0) {
    test.status = 'red'
  } else {
    test.status = 'green'
  }

  // Build HTML report
  let reportHTML = `
    <div class="mb-3">
      <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors out of ${total} canisters
    </div>
    <div class="canister-results">
  `

  results.forEach(result => {
    const icon = result.status === 'pass' 
      ? '<i class="fa-solid fa-check-circle text-success"></i>' 
      : result.status === 'fail'
      ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
      : '<i class="fa-solid fa-times-circle text-danger"></i>'
    
    const rowClass = result.status === 'pass' ? 'text-success' : result.status === 'fail' ? 'text-warning' : 'text-danger'
    
    reportHTML += `
      <div class="d-flex align-items-center gap-2 py-1 small ${rowClass}">
        ${icon}
        <span class="fw-bold" style="min-width: 200px">${result.name}</span>
        <span>${result.message}</span>
      </div>
    `
  })

  reportHTML += '</div>'
  
  // Add links section
  reportHTML += `
    <div class="mt-3 pt-2 border-top">
      <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('main-canisters-section').scrollIntoView({behavior:'smooth'})">
          Main Canisters Section ↓
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('archives-section').scrollIntoView({behavior:'smooth'})">
          Archives Section ↓
        </button>
      </div>
    </div>
  `
  
  test.report = reportHTML
}

// Test: Are neuron snapshots regular?
const testNeuronSnapshots = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('neuronSnapshot')
    const { idlFactory: neuronIDL } = await import('../../../declarations/neuronSnapshot/neuronSnapshot.did.js')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const agent = await getAnonymousAgent()
    const nActor: any = Actor.createActor(neuronIDL, { agent, canisterId: cid })
    const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })

    // Fetch snapshot status, latest snapshot info, and system parameters (for interval)
    const [snapshotStatus, headId, latestSnapshotArr, systemParams] = await Promise.all([
      nActor.get_neuron_snapshot_status?.() ?? Promise.resolve(null),
      nActor.get_neuron_snapshot_head_id?.() ?? Promise.resolve(0),
      nActor.get_neuron_snapshots_info(0, 1), // Get the latest snapshot
      dActor.getSystemParameters?.() ?? Promise.resolve([]),
    ])

    // Get snapshot interval from DAO system parameters (stored in nanoseconds)
    // Default to 24 hours (86400000000000 ns) if not available
    let snapshotIntervalNs = 86400n * 1_000_000_000n // Default 24 hours in ns
    if (Array.isArray(systemParams)) {
      const snapshotParam = systemParams.find((p: any) => 'SnapshotInterval' in p)
      if (snapshotParam?.SnapshotInterval) {
        snapshotIntervalNs = BigInt(snapshotParam.SnapshotInterval)
      }
    }
    const snapshotIntervalMinutes = Math.round(Number(snapshotIntervalNs / 1_000_000_000n) / 60)
    const snapshotIntervalMs = Number(snapshotIntervalNs / 1_000_000n)

    // Check 1: Snapshots exist
    const headIdNum = Number(headId)
    if (headIdNum > 0) {
      checks.push({ 
        name: 'Snapshots Exist', 
        status: 'pass', 
        message: `${headIdNum} neuron snapshots have been created` 
      })
    } else {
      checks.push({ 
        name: 'Snapshots Exist', 
        status: 'fail', 
        message: '❌ No neuron snapshots have been created yet' 
      })
    }

    // Check 2: Snapshot status is not stuck
    if (snapshotStatus) {
      const statusKey = Object.keys(snapshotStatus)[0]
      if (statusKey === 'Ready') {
        checks.push({ 
          name: 'Snapshot Status', 
          status: 'pass', 
          message: 'System is ready to take snapshots' 
        })
      } else if (statusKey === 'TakingSnapshot' || statusKey === 'StoringSnapshot') {
        // These are temporary states, so they're OK if recent
        checks.push({ 
          name: 'Snapshot Status', 
          status: 'pass', 
          message: `System is currently ${statusKey === 'TakingSnapshot' ? 'taking' : 'storing'} a snapshot` 
        })
      } else {
        checks.push({ 
          name: 'Snapshot Status', 
          status: 'fail', 
          message: `⚠️ Unexpected status: ${statusKey}` 
        })
      }
    } else {
      checks.push({ name: 'Snapshot Status', status: 'fail', message: '❌ Could not retrieve snapshot status' })
    }

    // Check 3: Last snapshot timing and result
    if (Array.isArray(latestSnapshotArr) && latestSnapshotArr.length > 0) {
      const latestSnapshot = latestSnapshotArr[0]
      const snapshotTimestampNs = BigInt(latestSnapshot.timestamp)
      const snapshotTimestampMs = Number(snapshotTimestampNs / 1_000_000n)
      const nowMs = Date.now()
      const timeSinceLastSnapshot = nowMs - snapshotTimestampMs
      const periodsOverdue = timeSinceLastSnapshot / snapshotIntervalMs
      const maxPeriodsOverdue = 3 // Allow up to 3 periods (45 minutes)
      const lastSnapshotDisplay = new Date(snapshotTimestampMs).toLocaleString()

      // Check if snapshot was successful
      const resultKey = Object.keys(latestSnapshot.result)[0]
      if (resultKey === 'Ok') {
        checks.push({ 
          name: 'Last Snapshot Successful', 
          status: 'pass', 
          message: `Last snapshot (ID ${latestSnapshot.id}) completed successfully` 
        })
      } else {
        checks.push({ 
          name: 'Last Snapshot Successful', 
          status: 'fail', 
          message: `❌ Last snapshot (ID ${latestSnapshot.id}) failed: ${JSON.stringify(latestSnapshot.result)}` 
        })
      }

      // Check timing
      // Format interval display (show hours if >= 60 minutes)
      const intervalDisplay = snapshotIntervalMinutes >= 60 
        ? `${(snapshotIntervalMinutes / 60).toFixed(snapshotIntervalMinutes % 60 === 0 ? 0 : 1)} hours` 
        : `${snapshotIntervalMinutes} minutes`
      
      if (periodsOverdue <= maxPeriodsOverdue) {
        checks.push({ 
          name: 'Last Snapshot Timing', 
          status: 'pass', 
          message: `Last snapshot: ${lastSnapshotDisplay} (within ${maxPeriodsOverdue} periods of ${intervalDisplay})` 
        })
      } else {
        checks.push({ 
          name: 'Last Snapshot Timing', 
          status: 'fail', 
          message: `❌ Last snapshot was ${periodsOverdue.toFixed(1)} periods ago (${lastSnapshotDisplay}). Maximum: ${maxPeriodsOverdue} periods of ${intervalDisplay}` 
        })
      }
    } else {
      checks.push({ name: 'Last Snapshot Timing', status: 'fail', message: '❌ No snapshot information available' })
    }

    // Generate report
    const allPass = checks.every(c => c.status === 'pass')
    
    // Count passes and fails
    test.passCount = checks.filter(c => c.status === 'pass').length
    test.failCount = checks.filter(c => c.status === 'fail' || c.status === 'error').length
    test.totalCount = checks.length

    let reportHtml = '<div class="d-flex flex-column gap-2">'
    for (const check of checks) {
      const icon = check.status === 'pass' ? '✅' : '❌'
      const colorClass = check.status === 'pass' ? 'text-success' : 'text-danger'
      reportHtml += `<div class="${colorClass}"><strong>${icon} ${check.name}:</strong> ${check.message}</div>`
    }
    reportHtml += '</div>'
    
    // Add links section
    reportHtml += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <a href="/admin/nns" class="btn btn-sm btn-outline-primary">
            NNS Admin Page →
          </a>
        </div>
      </div>
    `

    test.status = allPass ? 'green' : 'red'
    test.report = reportHtml
  } catch (error: any) {
    console.error('Neuron snapshot test error:', error)
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check neuron snapshot status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Test: Is price history updating?
const testPriceHistory = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('dao_backend')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const agent = await getAnonymousAgent()
    const daoActor: any = Actor.createActor(daoIDL, { agent, canisterId: cid })

    // Fetch token details
    const tokenDetails = await daoActor.getTokenDetailsWithoutPastPrices?.() ?? []

    console.log('[Price History Test] Token details:', tokenDetails)
    // Expected sync interval: tokens should sync at least once per day
    const maxSyncAgeMs = 24 * 60 * 60 * 1000 // 24 hours

    // Check 1: Tokens exist
    if (tokenDetails.length > 0) {
      checks.push({ 
        name: 'Tokens Exist', 
        status: 'pass', 
        message: `${tokenDetails.length} tokens are configured` 
      })
    } else {
      checks.push({ 
        name: 'Tokens Exist', 
        status: 'fail', 
        message: '❌ No tokens are configured in the system' 
      })
    }

    // Check 2: Active tokens count
    const activeTokens = tokenDetails.filter((entry: any) => entry[1]?.Active)
    if (activeTokens.length > 0) {
      checks.push({ 
        name: 'Active Tokens', 
        status: 'pass', 
        message: `${activeTokens.length} tokens are active` 
      })
    } else {
      checks.push({ 
        name: 'Active Tokens', 
        status: 'fail', 
        message: '❌ No active tokens found' 
      })
    }

    // Check 3: Recent price sync for all active tokens
    const nowMs = Date.now()
    const staleTokens: Array<{ symbol: string; lastSync: string; ageHours: number }> = []
    const failedTokens: Array<{ symbol: string }> = []
    let allSynced = true

    for (const entry of activeTokens) {
      const token = entry[1]
      const symbol = token?.tokenSymbol || 'UNKNOWN'
      
      // Check if token has sync failure
      if (token?.pausedDueToSyncFailure) {
        failedTokens.push({ symbol })
        allSynced = false
        continue
      }

      // Check last sync time
      const lastSyncMs = token?.lastTimeSynced ? Number(BigInt(token.lastTimeSynced) / 1_000_000n) : 0
      if (lastSyncMs === 0) {
        staleTokens.push({ symbol, lastSync: 'Never', ageHours: Infinity })
        allSynced = false
      } else {
        const ageMs = nowMs - lastSyncMs
        const ageHours = ageMs / (60 * 60 * 1000)
        if (ageMs > maxSyncAgeMs) {
          staleTokens.push({ 
            symbol, 
            lastSync: new Date(lastSyncMs).toLocaleString(), 
            ageHours: Math.round(ageHours) 
          })
          allSynced = false
        }
      }
    }

    // Report on failed tokens
    if (failedTokens.length > 0) {
      checks.push({ 
        name: 'Sync Failures', 
        status: 'fail', 
        message: `❌ ${failedTokens.length} token(s) paused due to sync failure: ${failedTokens.map(t => t.symbol).join(', ')}` 
      })
    }

    // Report on stale tokens
    if (staleTokens.length > 0) {
      let message = `❌ ${staleTokens.length} token(s) with stale prices (>24h old): `
      message += staleTokens.map(t => `${t.symbol} (${t.ageHours === Infinity ? 'never synced' : t.ageHours + 'h ago'})`).join(', ')
      checks.push({ 
        name: 'Price Freshness', 
        status: 'fail', 
        message 
      })
    } else if (allSynced && activeTokens.length > 0) {
      checks.push({ 
        name: 'Price Freshness', 
        status: 'pass', 
        message: `All ${activeTokens.length} active tokens have recent price data (within 24 hours)` 
      })
    }

    // Check 4: Find oldest sync time for informational purposes
    if (activeTokens.length > 0) {
      const times = activeTokens.map((entry: any) => {
        const token = entry[1]
        return {
          symbol: token?.tokenSymbol || 'UNKNOWN',
          time: token?.lastTimeSynced ? Number(BigInt(token.lastTimeSynced) / 1_000_000n) : 0
        }
      }).filter((t: any) => t.time > 0)

      if (times.length > 0) {
        const oldest = times.reduce((prev: any, curr: any) => prev.time < curr.time ? prev : curr)
        const oldestDisplay = new Date(oldest.time).toLocaleString()
        const ageHours = Math.round((nowMs - oldest.time) / (60 * 60 * 1000))
        checks.push({ 
          name: 'Oldest Price Update', 
          status: 'pass', 
          message: `Oldest synced token: ${oldest.symbol} at ${oldestDisplay} (${ageHours}h ago)` 
        })
      }
    }

    // Generate report
    const allPass = checks.every(c => c.status === 'pass')
    
    // Count passes and fails
    test.passCount = checks.filter(c => c.status === 'pass').length
    test.failCount = checks.filter(c => c.status === 'fail' || c.status === 'error').length
    test.totalCount = checks.length

    let reportHtml = '<div class="d-flex flex-column gap-2">'
    for (const check of checks) {
      const icon = check.status === 'pass' ? '✅' : '❌'
      const colorClass = check.status === 'pass' ? 'text-success' : 'text-danger'
      reportHtml += `<div class="${colorClass}"><strong>${icon} ${check.name}:</strong> ${check.message}</div>`
    }
    reportHtml += '</div>'
    
    // Add links section
    reportHtml += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('main-canisters-section').scrollIntoView({behavior:'smooth'})">
            Treasury Section ↓
          </button>
          <a href="/admin/price" class="btn btn-sm btn-outline-primary">
            Price Admin →
          </a>
          <a href="/admin/pricehistory" class="btn btn-sm btn-outline-primary">
            Price History →
          </a>
        </div>
      </div>
    `

    test.status = allPass ? 'green' : 'red'
    test.report = reportHtml
  } catch (error: any) {
    console.error('Price history test error:', error)
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check price history status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Test: Does allocation voting work?
const testAllocationVoting = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('dao_backend')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const agent = await getAnonymousAgent()
    const daoActor: any = Actor.createActor(daoIDL, { agent, canisterId: cid })

    // Fetch allocation stats and aggregate allocation (both publicly accessible)
    const [allocationStats, aggregateAllocation] = await Promise.all([
      daoActor.getAllocationStats?.() ?? null,
      daoActor.getAggregateAllocation?.() ?? [],
    ])

    console.log('[Allocation Test] Allocation stats:', allocationStats)
    console.log('[Allocation Test] Aggregate allocation tokens:', aggregateAllocation.length)

    if (!allocationStats) {
      checks.push({ 
        name: 'Stats Available', 
        status: 'fail', 
        message: '❌ Unable to fetch allocation statistics' 
      })
      throw new Error('getAllocationStats returned null')
    }

    const totalAllocators = Number(allocationStats.usersWithAllocations || 0) + Number(allocationStats.neuronsWithAllocations || 0)
    const usersCount = Number(allocationStats.usersWithAllocations || 0)
    const neuronsCount = Number(allocationStats.neuronsWithAllocations || 0)

    // Check 1: Users or neurons with allocations
    if (totalAllocators > 0) {
      let message = ''
      if (usersCount > 0 && neuronsCount > 0) {
        message = `${usersCount} users and ${neuronsCount} neurons have set token allocations`
      } else if (usersCount > 0) {
        message = `${usersCount} users have set token allocations`
      } else {
        message = `${neuronsCount} neurons have set token allocations`
      }
      checks.push({ 
        name: 'Allocations Exist', 
        status: 'pass', 
        message 
      })
    } else {
      checks.push({ 
        name: 'Allocations Exist', 
        status: 'fail', 
        message: '❌ No users or neurons have set token allocations yet' 
      })
    }

    // Check 2: Aggregate allocation computed
    if (aggregateAllocation.length > 0) {
      checks.push({ 
        name: 'Aggregate Allocation Computed', 
        status: 'pass', 
        message: `Aggregate allocation includes ${aggregateAllocation.length} tokens` 
      })
    } else {
      checks.push({ 
        name: 'Aggregate Allocation Computed', 
        status: 'fail', 
        message: '❌ No aggregate allocation computed (no tokens receiving votes)' 
      })
    }

    // Check 3: Recent allocation activity (at least one update in the past 30 days)
    if (totalAllocators > 0) {
      const recentCount = Number(allocationStats.recentUpdatesCount || 0)

      if (recentCount > 0) {
        checks.push({ 
          name: 'Recent Allocation Activity', 
          status: 'pass', 
          message: `${recentCount} allocation updates in the past 30 days` 
        })
      } else {
        checks.push({ 
          name: 'Recent Allocation Activity', 
          status: 'fail', 
          message: '⚠️ No allocation updates in the past 30 days (system may be stale)' 
        })
      }

      // Check 4: Find most recent allocation update (informational)
      const mostRecentTime = allocationStats.mostRecentUpdateTime
      if (mostRecentTime && Number(mostRecentTime) > 0) {
        const mostRecentMs = Number(BigInt(mostRecentTime) / 1_000_000n)
        const nowMs = Date.now()
        const mostRecentDisplay = new Date(mostRecentMs).toLocaleString()
        const ageHours = Math.round((nowMs - mostRecentMs) / (60 * 60 * 1000))
        const ageDays = Math.floor(ageHours / 24)
        const ageDisplay = ageDays > 0 ? `${ageDays}d ${ageHours % 24}h ago` : `${ageHours}h ago`
        
        checks.push({ 
          name: 'Most Recent Update', 
          status: 'pass', 
          message: `Most recent allocation update: ${mostRecentDisplay} (${ageDisplay})` 
        })
      }
    }

    // Check 5: Voting power distribution (users and neurons have VP)
    const userVP = Number(allocationStats.totalUserVotingPower || 0)
    const neuronVP = Number(allocationStats.totalNeuronVotingPower || 0)
    const totalVP = userVP + neuronVP

    if (totalVP > 0) {
      let message = ''
      if (userVP > 0 && neuronVP > 0) {
        message = `${usersCount} users and ${neuronsCount} neurons with voting power (total: ${totalVP.toLocaleString()} VP)`
      } else if (userVP > 0) {
        message = `${usersCount} users with voting power (total: ${totalVP.toLocaleString()} VP)`
      } else {
        message = `${neuronsCount} neurons with voting power (total: ${totalVP.toLocaleString()} VP)`
      }
      
      checks.push({ 
        name: 'Voting Power Active', 
        status: 'pass', 
        message 
      })
    } else {
      checks.push({ 
        name: 'Voting Power Active', 
        status: 'fail', 
        message: '⚠️ No users or neurons have voting power (allocations won\'t affect portfolio)' 
      })
    }

    // Generate report
    const allPass = checks.every(c => c.status === 'pass')
    
    // Count passes and fails
    test.passCount = checks.filter(c => c.status === 'pass').length
    test.failCount = checks.filter(c => c.status === 'fail' || c.status === 'error').length
    test.totalCount = checks.length

    let reportHtml = '<div class="d-flex flex-column gap-2">'
    for (const check of checks) {
      const icon = check.status === 'pass' ? '✅' : '❌'
      const colorClass = check.status === 'pass' ? 'text-success' : 'text-danger'
      reportHtml += `<div class="${colorClass}"><strong>${icon} ${check.name}:</strong> ${check.message}</div>`
    }
    reportHtml += '</div>'
    
    // Add links section
    reportHtml += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('main-canisters-section').scrollIntoView({behavior:'smooth'})">
            DAO Backend Section ↓
          </button>
          <a href="/admin/votes" class="btn btn-sm btn-outline-primary">
            Voting Admin →
          </a>
        </div>
      </div>
    `

    test.status = allPass ? 'green' : 'red'
    test.report = reportHtml
  } catch (error: any) {
    console.error('Allocation voting test error:', error)
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check allocation voting status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Test: Is grant system cloning and voting?
const testGrantSystem = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('neuronSnapshot')
    const { idlFactory: neuronIDL } = await import('../../../declarations/neuronSnapshot/neuronSnapshot.did.js')
    const agent = await getAnonymousAgent()
    const nActor: any = Actor.createActor(neuronIDL, { agent, canisterId: cid })

    // Fetch timer status and activity counts
    const [periodicStatus, copiedCount, votedCount, highestProcessedId] = await Promise.all([
      nActor.getPeriodicTimerStatus?.() ?? Promise.resolve(null),
      nActor.getCopiedNNSProposalsCount?.() ?? Promise.resolve(0),
      nActor.getDAOVotedNNSProposalsCount?.() ?? Promise.resolve(0),
      nActor.getHighestProcessedNNSProposalId?.() ?? Promise.resolve(0),
    ])

    // Check 1: Periodic timer is running
    const timerRunning = periodicStatus?.is_running || false
    if (timerRunning) {
      checks.push({ name: 'Periodic Timer Running', status: 'pass', message: 'Master periodic timer is active' })
    } else {
      checks.push({ name: 'Periodic Timer Running', status: 'fail', message: '❌ Master periodic timer is NOT running' })
    }

    // Check 2: Last periodic run timing
    if (periodicStatus && periodicStatus.last_run_time && Number(periodicStatus.last_run_time) > 0) {
      const intervalSeconds = Number(periodicStatus.interval_seconds || 3600)
      const lastRunMs = Number(periodicStatus.last_run_time) * 1000
      const nowMs = Date.now()
      const timeSinceLastRun = nowMs - lastRunMs
      const periodMs = intervalSeconds * 1000
      const periodsOverdue = timeSinceLastRun / periodMs
      const maxPeriodsOverdue = 3
      const lastRunDisplay = new Date(lastRunMs).toLocaleString()

      if (periodsOverdue <= maxPeriodsOverdue) {
        checks.push({ 
          name: 'Last Timer Run Recent', 
          status: 'pass', 
          message: `Last run: ${lastRunDisplay} (within ${maxPeriodsOverdue} periods)` 
        })
      } else {
        checks.push({ 
          name: 'Last Timer Run Recent', 
          status: 'fail', 
          message: `❌ Last run was ${periodsOverdue.toFixed(1)} periods ago (${lastRunDisplay}). Maximum: ${maxPeriodsOverdue} periods` 
        })
      }
    } else {
      checks.push({ name: 'Last Timer Run Recent', status: 'fail', message: '❌ No last run time recorded' })
    }

    // Check 3: Cloning activity (copied proposals count)
    const copiedCountNum = Number(copiedCount)
    if (copiedCountNum > 0) {
      checks.push({ 
        name: 'Cloning Activity', 
        status: 'pass', 
        message: `${copiedCountNum} NNS proposals have been cloned to SNS` 
      })
    } else {
      checks.push({ 
        name: 'Cloning Activity', 
        status: 'fail', 
        message: '⚠️ No NNS proposals have been cloned yet' 
      })
    }

    // Check 4: Voting activity (voted proposals count)
    const votedCountNum = Number(votedCount)
    if (votedCountNum > 0) {
      checks.push({ 
        name: 'Voting Activity', 
        status: 'pass', 
        message: `${votedCountNum} NNS proposals have been voted on by DAO` 
      })
    } else {
      checks.push({ 
        name: 'Voting Activity', 
        status: 'fail', 
        message: '⚠️ No NNS proposals have been voted on yet' 
      })
    }

    // Check 5: Highest processed NNS proposal ID is reasonable
    const highestIdNum = Number(highestProcessedId)
    if (highestIdNum > 0) {
      checks.push({ 
        name: 'NNS Processing Activity', 
        status: 'pass', 
        message: `Highest processed NNS proposal ID: ${highestIdNum}` 
      })
    } else {
      checks.push({ 
        name: 'NNS Processing Activity', 
        status: 'fail', 
        message: '⚠️ No NNS proposals have been processed yet' 
      })
    }

    // Generate report
    const allPass = checks.every(c => c.status === 'pass')
    const anyFail = checks.some(c => c.status === 'fail')
    
    // Count passes and fails
    test.passCount = checks.filter(c => c.status === 'pass').length
    test.failCount = checks.filter(c => c.status === 'fail').length
    test.totalCount = checks.length

    let reportHtml = '<div class="d-flex flex-column gap-2">'
    for (const check of checks) {
      const icon = check.status === 'pass' ? '✅' : '❌'
      const colorClass = check.status === 'pass' ? 'text-success' : 'text-danger'
      reportHtml += `<div class="${colorClass}"><strong>${icon} ${check.name}:</strong> ${check.message}</div>`
    }
    reportHtml += '</div>'
    
    // Add links section
    reportHtml += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <a href="/admin/nns" class="btn btn-sm btn-outline-primary">
            NNS Admin Page →
          </a>
        </div>
      </div>
    `

    test.status = allPass ? 'green' : 'red'
    test.report = reportHtml
  } catch (error: any) {
    console.error('Grant system test error:', error)
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check grant system status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Test: Are archives importing regularly?
const testArchivesImporting = async (test: any) => {
  const results: Array<{ name: string; key: CanKey; checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> }> = []
  
  // Archive period: 30 minutes
  const archivePeriodMinutes = 30
  const archivePeriodMs = archivePeriodMinutes * 60 * 1000
  const maxPeriodsOverdue = 3
  const maxDelayMs = maxPeriodsOverdue * archivePeriodMs // 90 minutes
  
  // Test all archive canisters in parallel
  await Promise.all(archiveCanisters.map(async (canister) => {
    const key = canister.key
    const canisterName = canister.title
    const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
    
    try {
      const cid = resolvePrincipal(key)
      if (!cid) {
        checks.push({
          name: 'Configuration',
          status: 'error',
          message: 'No canister ID configured'
        })
        results.push({ name: canisterName, key, checks })
        return
      }

      // Create archive actor to get timer status
      const archiveActor = await createArchiveActor(key, cid)
      if (!archiveActor || typeof archiveActor.getTimerStatus !== 'function') {
        checks.push({
          name: 'Timer Status',
          status: 'error',
          message: 'Timer status not available'
        })
        results.push({ name: canisterName, key, checks })
        return
      }

      const timerStatus = await archiveActor.getTimerStatus()
      
      // Check if outer loop is running
      const isRunning = timerStatus.outerLoopRunning
      const lastRun = timerStatus.outerLoopLastRun
      const lastRunMs = lastRun && Number(lastRun) > 0 ? Number(lastRun) / 1_000_000 : null
      
      // Check 1: Timer is running
      if (!isRunning) {
        checks.push({
          name: 'Outer Timer Running',
          status: 'fail',
          message: '❌ Outer timer is <strong>NOT running</strong>. Archive imports will not happen automatically.'
        })
      } else {
        checks.push({
          name: 'Outer Timer Running',
          status: 'pass',
          message: '✅ Outer timer is running.'
        })
      }
      
      // Check 2: Last run timing (within 3 periods)
      if (!lastRunMs || Number(lastRun) === 0) {
        checks.push({
          name: 'Last Import Timing',
          status: 'fail',
          message: '❌ Never run - no last run time recorded.'
        })
      } else {
        const nowMs = Date.now()
        const timeSinceLastRun = nowMs - lastRunMs
        const periodsOverdue = timeSinceLastRun / archivePeriodMs
        const minutesAgo = Math.round(timeSinceLastRun / (60 * 1000))
        const lastRunDisplay = new Date(lastRunMs).toLocaleString()
        
        if (periodsOverdue > maxPeriodsOverdue) {
          checks.push({
            name: 'Last Import Timing',
            status: 'fail',
            message: `❌ Last import was <strong>${periodsOverdue.toFixed(1)} periods</strong> ago (${minutesAgo} minutes, ${lastRunDisplay}). Expected within ${maxPeriodsOverdue} periods (${maxPeriodsOverdue * archivePeriodMinutes} minutes).`
          })
      } else {
          checks.push({
            name: 'Last Import Timing',
            status: 'pass',
            message: `✅ Last import was <strong>${periodsOverdue.toFixed(1)} periods</strong> ago (${minutesAgo} minutes, ${lastRunDisplay}, period: ${archivePeriodMinutes}min).`
          })
        }
      }
      
      results.push({
        name: canisterName,
        key,
        checks
      })
    } catch (error: any) {
      checks.push({
        name: 'Error',
        status: 'error',
        message: `Failed to check: ${error.message || 'Unknown error'}`
      })
      results.push({
        name: canisterName,
        key,
        checks
      })
    }
  }))

  // Generate report
  // Count all checks across all archives
  let totalChecks = 0
  let passedChecks = 0
  let failedChecks = 0
  let errorChecks = 0
  
  results.forEach(result => {
    result.checks.forEach(check => {
      totalChecks++
      if (check.status === 'pass') passedChecks++
      else if (check.status === 'fail') failedChecks++
      else errorChecks++
    })
  })

  // Overall status - fail if ANY check fails or errors
  if (errorChecks > 0 || failedChecks > 0) {
    test.status = 'red'
  } else {
    test.status = 'green'
  }
  
  // Set counts
  test.passCount = passedChecks
  test.failCount = failedChecks + errorChecks
  test.totalCount = totalChecks

  // Build HTML report
  let reportHTML = `
    <div class="mb-3">
      <strong>Results:</strong> ${passedChecks} passed, ${failedChecks} failed, ${errorChecks} errors out of ${totalChecks} checks across ${results.length} archives
    </div>
    <div class="archive-results">
  `

  results.forEach(result => {
    // Determine overall status for this archive
    const hasError = result.checks.some(c => c.status === 'error')
    const hasFail = result.checks.some(c => c.status === 'fail')
    const allPass = result.checks.every(c => c.status === 'pass')
    
    const archiveStatusIcon = allPass 
      ? '<i class="fa-solid fa-check-circle text-success"></i>' 
      : hasFail
      ? '<i class="fa-solid fa-times-circle text-danger"></i>'
      : '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
    
    const archiveRowClass = allPass ? 'text-success' : hasFail ? 'text-danger' : 'text-warning'
    
    reportHTML += `
      <div class="mb-3 border-bottom pb-2">
        <div class="d-flex align-items-center gap-2 py-1 ${archiveRowClass}">
          ${archiveStatusIcon}
          <span class="fw-bold">${result.name}</span>
        </div>
    `
    
    // Show each check for this archive
    result.checks.forEach(check => {
      const checkIcon = check.status === 'pass' 
        ? '<i class="fa-solid fa-check-circle text-success"></i>' 
        : check.status === 'fail'
        ? '<i class="fa-solid fa-times-circle text-danger"></i>'
        : '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
      
      const checkRowClass = check.status === 'pass' ? 'text-success' : check.status === 'fail' ? 'text-danger' : 'text-warning'
      
      reportHTML += `
        <div class="d-flex align-items-start gap-2 py-1 small ${checkRowClass} ms-4">
          <div style="min-width: 20px; margin-top: 2px;">${checkIcon}</div>
          <div>
            <div class="fw-bold" style="font-size: 0.85rem;">${check.name}</div>
            <div style="font-size: 0.8rem;">${check.message}</div>
          </div>
      </div>
    `
    })
    
    reportHTML += `</div>`
  })

  reportHTML += '</div>'
  
  // Add links section
  reportHTML += `
    <div class="mt-3 pt-2 border-top">
      <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('archives-section').scrollIntoView({behavior:'smooth'})">
          Archives Section ↓
        </button>
        <a href="/admin/archives" class="btn btn-sm btn-outline-primary">
          Archives Admin →
        </a>
      </div>
    </div>
  `
  
  test.report = reportHTML
}

// Helper function to format nanosecond timestamps
const formatNanoTime = (nanoTime: bigint): string => {
  return new Date(Number(nanoTime / 1_000_000n)).toLocaleString()
}

// Test: Is the trading bot trading regularly?
const testTradingBotRegular = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('treasury')
    const { idlFactory: treasuryIDL } = await import('../../../declarations/treasury/treasury.did.js')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const agent = await getAnonymousAgent()
    const tActor: any = Actor.createActor(treasuryIDL, { agent, canisterId: cid })
    const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })

    let tsRes, tokensResp, longSyncTimerRes
    try {
      [tsRes, tokensResp, , longSyncTimerRes] = await Promise.all([
        tActor.getTradingStatus(),
        dActor.getTokenDetailsWithoutPastPrices(),
        tacoStore.getRebalanceConfig().catch(() => null), // Fetch config into store (no variable needed)
        tActor.getLongSyncTimerStatus?.() ?? Promise.resolve(null),
      ])
    } catch (fetchError: any) {
      console.error('[Trading Bot Test] Fetch error:', fetchError)
      const errorMsg = fetchError.message || String(fetchError)
      if (errorMsg.includes('503') || errorMsg.includes('Service Unavailable')) {
        throw new Error('Treasury or DAO canister is unavailable (503 error). The canister may be out of cycles, upgrading, or experiencing network issues.')
      }
      throw new Error(`Failed to fetch trading data: ${errorMsg}`)
    }

    console.log('[Trading Bot Test] tsRes:', tsRes)
    console.log('[Trading Bot Test] rebalanceConfig:', tacoStore.rebalanceConfig)
    console.log('[Trading Bot Test] tokensResp:', tokensResp)

    // Get trading status and interval
    let tradingActive = false
    let lastAttemptNs: any = null
    let intervalNs: any = null
    
    if (tsRes && 'ok' in tsRes) {
      const { metrics, rebalanceStatus } = tsRes.ok
      tradingActive = !!('Trading' in rebalanceStatus)
      lastAttemptNs = metrics?.lastRebalanceAttempt
      console.log('[Trading Bot Test] tradingActive:', tradingActive)
      console.log('[Trading Bot Test] lastAttemptNs:', lastAttemptNs)
    }
    
    // Extract interval from config (now loaded into store)
    if (tacoStore.rebalanceConfig?.rebalanceIntervalNS) {
      intervalNs = tacoStore.rebalanceConfig.rebalanceIntervalNS
      console.log('[Trading Bot Test] intervalNs from store:', intervalNs)
    } else {
      // If config unavailable, use default 30-minute interval (1,800,000,000,000 ns)
      intervalNs = 1_800_000_000_000n
      console.log('[Trading Bot Test] Config unavailable, using default 30min interval')
    }

    // Check 1: Trading bot running and last trade within 5 periods
    if (!tradingActive) {
      checks.push({
        name: 'Trading Bot Status',
        status: 'fail',
        message: '❌ Trading bot is NOT active (status: not Trading)'
      })
    } else if (!lastAttemptNs || Number(lastAttemptNs) === 0) {
      checks.push({
        name: 'Trading Bot Status',
        status: 'fail',
        message: '❌ Trading bot active but no trades recorded (never traded)'
      })
    } else {
      const nowNs = BigInt(Date.now()) * 1_000_000n
      const timeSinceLastTrade = nowNs - BigInt(lastAttemptNs)
      const periods = Number(timeSinceLastTrade / BigInt(intervalNs))
      const lastTradeDisplay = new Date(Number(BigInt(lastAttemptNs) / 1_000_000n)).toLocaleString()
      const intervalMinutes = Number(BigInt(intervalNs) / 1_000_000_000n / 60n)
      
      if (periods > 5) {
        checks.push({
          name: 'Trading Bot Status',
          status: 'fail',
          message: `❌ Last trade was <strong>${periods.toFixed(1)} periods</strong> ago (${lastTradeDisplay}). Expected within 5 periods (interval: ${intervalMinutes}min).`
        })
      } else {
        checks.push({
          name: 'Trading Bot Status',
          status: 'pass',
          message: `✅ Trading bot active. Last trade was <strong>${periods.toFixed(1)} periods</strong> ago (${lastTradeDisplay}, interval: ${intervalMinutes}min).`
        })
      }
    }

    // Parse token data
    const tokenDetails = tokensResp || []
    const tokens = tokenDetails.map((entry: any) => {
      const token = entry[1]
      return {
        symbol: token?.tokenSymbol || 'UNKNOWN',
        active: token?.Active,
        pausedManually: token?.isPaused,
        pausedSyncFailure: token?.pausedDueToSyncFailure,
        isPaused: token?.isPaused || token?.pausedDueToSyncFailure || false
      }
    })

    const totalTokens = tokens.length
    const pausedTokens = tokens.filter((t: any) => t.isPaused)
    const pausedCount = pausedTokens.length
    const icpToken = tokens.find((t: any) => t.symbol === 'ICP')

    // Check 2: All tokens paused (circuit breaker hit)
    if (pausedCount === totalTokens && totalTokens > 0) {
      checks.push({
        name: 'Circuit Breaker Status',
        status: 'fail',
        message: `All ${totalTokens} tokens are paused - Circuit breaker has hit! DAO must unpause tokens to restart trading.`
      })
    } else if (pausedCount === 0) {
      checks.push({
        name: 'Circuit Breaker Status',
        status: 'pass',
        message: 'No tokens paused - circuit breaker not triggered'
      })
    } else {
      checks.push({
        name: 'Circuit Breaker Status',
        status: 'pass',
        message: `${pausedCount} token(s) paused - circuit breaker not triggered`
      })
    }

    // Check 3: ICP paused but others not (error - circuit breaker should have hit)
    if (icpToken && icpToken.isPaused) {
      checks.push({
        name: 'ICP Token Status',
        status: 'fail',
        message: `ICP is paused but ${totalTokens - pausedCount} other tokens are not - Circuit breaker should have hit! DAO must investigate immediately!`
      })
    } else {
      checks.push({
        name: 'ICP Token Status',
        status: 'pass',
        message: 'ICP is trading normally'
      })
    }

    // Check 4: 3+ tokens paused but not all (circuit breaker should have hit)
    if (pausedCount >= 3 && pausedCount < totalTokens) {
      checks.push({
        name: 'Multiple Token Pause Check',
        status: 'fail',
        message: `${pausedCount} tokens are paused (≥3) but not all - Circuit breaker should have hit! DAO should investigate.`
      })
    } else if (pausedCount > 0 && pausedCount < 3) {
      checks.push({
        name: 'Multiple Token Pause Check',
        status: 'pass',
        message: `${pausedCount} token(s) paused - below circuit breaker threshold`
      })
    } else {
      checks.push({
        name: 'Multiple Token Pause Check',
        status: 'pass',
        message: 'All tokens trading normally - no pauses detected'
      })
    }

    // Get executed trades and metrics for analysis
    const executedTrades = tsRes?.ok?.executedTrades || []
    const metrics = tsRes?.ok?.metrics
    const allTimeAvgSlippage = metrics?.avgSlippage ? Number(metrics.avgSlippage).toFixed(2) : 'N/A'
    
    // Get slippage tolerance from config (now loaded into store)
    let maxSlippagePct = null
    if (tacoStore.rebalanceConfig?.maxSlippageBasisPoints) {
      maxSlippagePct = Number(tacoStore.rebalanceConfig.maxSlippageBasisPoints) / 100
      console.log('[Trading Bot Test] Slippage tolerance from store:', maxSlippagePct, '%')
    } else {
      console.warn('[Trading Bot Test] Slippage tolerance not available - config not loaded')
    }

    // Check 5: Last successful trade timing (same as portfolio snapshot timing check)
    if (executedTrades.length > 0) {
      const successfulTrades = executedTrades.filter((t: any) => t.success)
      
      if (successfulTrades.length > 0) {
        const lastSuccessfulTrade = successfulTrades[successfulTrades.length - 1]
        const lastTradeTimestampNs = BigInt(lastSuccessfulTrade.timestamp)
        const nowNs = BigInt(Date.now()) * 1_000_000n
        const timeSinceLastTrade = nowNs - lastTradeTimestampNs
        const periods = Number(timeSinceLastTrade / BigInt(intervalNs))
        const maxDelayNs = BigInt(intervalNs) * 5n // 5 periods
        const lastTradeDisplay = new Date(Number(lastTradeTimestampNs / 1_000_000n)).toLocaleString()
        const intervalMinutes = Number(BigInt(intervalNs) / 1_000_000_000n / 60n)
        
        if (timeSinceLastTrade > maxDelayNs) {
          checks.push({
            name: 'Last Successful Trade Timing',
            status: 'fail',
            message: `❌ Last successful trade is overdue by <strong>${periods.toFixed(1)}</strong> periods (${lastTradeDisplay}). Maximum allowed: 5 periods. Interval: ${intervalMinutes} minutes.`
          })
        } else {
          checks.push({
            name: 'Last Successful Trade Timing',
            status: 'pass',
            message: `✅ Last successful trade is on schedule (${lastTradeDisplay}, <strong>${periods.toFixed(1)}</strong> periods ago). Interval: ${intervalMinutes} minutes.`
          })
        }
      } else {
        checks.push({
          name: 'Last Successful Trade Timing',
          status: 'fail',
          message: '❌ No successful trades recorded - all trades have failed!'
        })
      }
    } else {
      checks.push({
        name: 'Last Successful Trade Timing',
        status: 'error',
        message: '⚠️ No trade history available to determine last successful trade timing'
      })
    }

    // Check 6: Failed trades analysis
    if (executedTrades.length > 0) {
      const last100 = executedTrades.slice(-100)
      const failedLast100 = last100.filter((t: any) => !t.success).length
      const failedAll = executedTrades.filter((t: any) => !t.success).length
      
      const failRateLast100 = (failedLast100 / last100.length) * 100
      const failRateAll = (failedAll / executedTrades.length) * 100
      
      let failStatus: 'pass' | 'fail' | 'error' = 'pass'
      let failMessage = ''
      
      if (failRateLast100 > 10) {
        failStatus = 'fail'
        failMessage = `❌ <strong>${failedLast100}/${last100.length}</strong> trades failed in last 100 (<strong>${failRateLast100.toFixed(1)}%</strong> > 10% threshold). All trades: ${failedAll}/${executedTrades.length} (<strong>${failRateAll.toFixed(1)}%</strong>).`
      } else if (failRateAll > 3) {
        failStatus = 'fail'
        failMessage = `❌ Overall failure rate is <strong>${failRateAll.toFixed(1)}%</strong> (${failedAll}/${executedTrades.length} trades) > 3% threshold. Last 100: ${failedLast100}/${last100.length} (<strong>${failRateLast100.toFixed(1)}%</strong>).`
      } else {
        failMessage = `✅ Failure rates within limits. Last 100: ${failedLast100}/${last100.length} (<strong>${failRateLast100.toFixed(1)}%</strong>). All: ${failedAll}/${executedTrades.length} (<strong>${failRateAll.toFixed(1)}%</strong>).`
      }
      
      checks.push({
        name: 'Trade Failure Rate',
        status: failStatus,
        message: failMessage
      })

      // Check 7: Slippage analysis
      const tradesWithSlippage = executedTrades.filter((t: any) => t.success && t.slippage != null)
      const last100WithSlippage = last100.filter((t: any) => t.success && t.slippage != null)
      
      if (tradesWithSlippage.length > 0) {
        const slippagesLast100 = last100WithSlippage.map((t: any) => Number(t.slippage))
        const slippagesAll = tradesWithSlippage.map((t: any) => Number(t.slippage))
        
        const avgSlippageLast100 = slippagesLast100.reduce((a: number, b: number) => a + b, 0) / slippagesLast100.length
        const avgSlippageAll = slippagesAll.reduce((a: number, b: number) => a + b, 0) / slippagesAll.length
        const worstSlippageLast100 = Math.max(...slippagesLast100)
        
        // Slippage is already stored as percentage (0.49 = 0.49%), no need to multiply by 100
        const avgSlippageLast100Pct = avgSlippageLast100.toFixed(2)
        const avgSlippageAllPct = avgSlippageAll.toFixed(2)
        const worstSlippageLast100Pct = worstSlippageLast100.toFixed(2)
        
        let slippageStatus: 'pass' | 'fail' | 'error' = 'pass'
        let slippageMessage = ''
        
        if (maxSlippagePct && worstSlippageLast100 > maxSlippagePct) {
          slippageStatus = 'fail'
          slippageMessage = `❌ Worst slippage in last 100 trades: <strong>${worstSlippageLast100Pct}%</strong> exceeds tolerance of <strong>${maxSlippagePct.toFixed(2)}%</strong>. Avg last 100: ${avgSlippageLast100Pct}%. Avg all: ${avgSlippageAllPct}%. All-time avg: ${allTimeAvgSlippage}%.`
        } else if (maxSlippagePct) {
          slippageMessage = `✅ Worst slippage: <strong>${worstSlippageLast100Pct}%</strong> ≤ tolerance (${maxSlippagePct.toFixed(2)}%). Avg last 100: <strong>${avgSlippageLast100Pct}%</strong>. Avg all: <strong>${avgSlippageAllPct}%</strong>. All-time: ${allTimeAvgSlippage}%.`
        } else {
          slippageMessage = `⚠️ Slippage stats: Worst last 100: <strong>${worstSlippageLast100Pct}%</strong>. Avg last 100: <strong>${avgSlippageLast100Pct}%</strong>. Avg all: <strong>${avgSlippageAllPct}%</strong>. All-time: ${allTimeAvgSlippage}%. (Tolerance not available - failed to fetch config).`
        }
        
        checks.push({
          name: 'Slippage Analysis',
          status: slippageStatus,
          message: slippageMessage
        })
      } else {
        checks.push({
          name: 'Slippage Analysis',
          status: 'error',
          message: '⚠️ No successful trades with slippage data available for analysis'
        })
      }
    } else {
      checks.push({
        name: 'Trade History',
        status: 'error',
        message: '⚠️ No trade history available for analysis'
      })
    }

    // ===== Check 8: Short Sync Timer Status =====
    const shortSyncActive = tsRes && 'ok' in tsRes ? tsRes.ok.metrics?.lastUpdate : null
    const shortSyncIntervalNs = 900_000_000_000n // 15 minutes
    const shortSyncMaxDelayNs = shortSyncIntervalNs * 5n // 5 periods
    
    if (shortSyncActive) {
      const nowNs = BigInt(Date.now()) * 1_000_000n
      const shortSyncLastNs = BigInt(shortSyncActive)
      const shortSyncDelayNs = nowNs - shortSyncLastNs
      const shortSyncPeriodsBehind = Number(shortSyncDelayNs) / Number(shortSyncIntervalNs)
      
      let shortSyncStatus: 'pass' | 'fail' | 'error' = 'pass'
      let shortSyncMessage = ''
      
      if (shortSyncDelayNs > shortSyncMaxDelayNs) {
        shortSyncStatus = 'fail'
        shortSyncMessage = `❌ Short sync is overdue by <strong>${shortSyncPeriodsBehind.toFixed(1)}</strong> periods (last sync: ${formatNanoTime(shortSyncLastNs)}). Maximum allowed: 5 periods.`
      } else {
        shortSyncMessage = `✅ Short sync is on schedule (last sync: ${formatNanoTime(shortSyncLastNs)}, <strong>${shortSyncPeriodsBehind.toFixed(1)}</strong> periods ago).`
      }
      
      checks.push({
        name: 'Short Sync Timer',
        status: shortSyncStatus,
        message: shortSyncMessage
      })
    } else {
      checks.push({
        name: 'Short Sync Timer',
        status: 'error',
        message: '⚠️ Unable to determine short sync timer status'
      })
    }

    // ===== Check 9: Long Sync Timer Status =====
    if (longSyncTimerRes) {
      const timerStatus: any = longSyncTimerRes
      const longSyncRunning = timerStatus.isRunning || false
      const longSyncLastRun = timerStatus.lastRunTime || null
      const longSyncIntervalNs = timerStatus.intervalNS ? BigInt(timerStatus.intervalNS) : 18_000_000_000_000n // 5 hours default
      const longSyncMaxDelayNs = longSyncIntervalNs * 5n // 5 periods
      
      let longSyncStatus: 'pass' | 'fail' | 'error' = 'pass'
      let longSyncMessage = ''
      
      if (!longSyncRunning) {
        longSyncStatus = 'fail'
        longSyncMessage = `❌ Long sync timer is <strong>not running</strong>.`
      } else if (longSyncLastRun) {
        const nowNs = BigInt(Date.now()) * 1_000_000n
        const longSyncLastNs = BigInt(longSyncLastRun)
        const longSyncDelayNs = nowNs - longSyncLastNs
        const longSyncPeriodsBehind = Number(longSyncDelayNs) / Number(longSyncIntervalNs)
        
        if (longSyncDelayNs > longSyncMaxDelayNs) {
          longSyncStatus = 'fail'
          longSyncMessage = `❌ Long sync is overdue by <strong>${longSyncPeriodsBehind.toFixed(1)}</strong> periods (last sync: ${formatNanoTime(longSyncLastNs)}). Maximum allowed: 5 periods.`
        } else {
          longSyncMessage = `✅ Long sync is on schedule (last sync: ${formatNanoTime(longSyncLastNs)}, <strong>${longSyncPeriodsBehind.toFixed(1)}</strong> periods ago).`
        }
      } else {
        longSyncMessage = `✅ Long sync timer is running (no previous run recorded yet).`
      }
      
      checks.push({
        name: 'Long Sync Timer',
        status: longSyncStatus,
        message: longSyncMessage
      })
    } else {
      checks.push({
        name: 'Long Sync Timer',
        status: 'error',
        message: '⚠️ Unable to fetch long sync timer status'
      })
    }

    // Overall status
    const anyFailed = checks.some(c => c.status === 'fail')
    const anyError = checks.some(c => c.status === 'error')
    
    if (anyError || anyFailed) {
      test.status = 'red'
    } else {
      test.status = 'green'
    }

    // Build HTML report
    const passed = checks.filter(c => c.status === 'pass').length
    const failed = checks.filter(c => c.status === 'fail').length
    const errors = checks.filter(c => c.status === 'error').length
    
    // Set counts
    test.passCount = passed
    test.failCount = failed + errors
    test.totalCount = checks.length

    let reportHTML = `
      <div class="mb-3">
        <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors
      </div>
      <div class="canister-results">
    `

    checks.forEach(check => {
      const icon = check.status === 'pass' 
        ? '<i class="fa-solid fa-check-circle text-success"></i>' 
        : check.status === 'fail'
        ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
        : '<i class="fa-solid fa-times-circle text-danger"></i>'
      
      const rowClass = check.status === 'pass' ? 'text-success' : check.status === 'fail' ? 'text-warning' : 'text-danger'
      
      reportHTML += `
        <div class="d-flex align-items-start gap-2 py-2 small ${rowClass}">
          <div class="mt-1">${icon}</div>
          <div>
            <div class="fw-bold">${check.name}</div>
            <div>${check.message}</div>
          </div>
        </div>
      `
    })

    // Add paused tokens list if any
    if (pausedTokens.length > 0 && pausedTokens.length < totalTokens) {
      reportHTML += `
        <div class="mt-3 pt-2 border-top border-secondary">
          <div class="fw-bold small mb-2">Paused Tokens (${pausedTokens.length}):</div>
          <div class="d-flex flex-wrap gap-2">
      `
      pausedTokens.forEach((token: any) => {
        const reason = token.pausedSyncFailure ? 'Sync Failed' : 'Manually Paused'
        reportHTML += `
          <span class="badge bg-warning text-dark">${token.symbol} (${reason})</span>
        `
      })
      reportHTML += '</div></div>'
    }

    reportHTML += '</div>'
    
    // Add links section
    reportHTML += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('main-canisters-section').scrollIntoView({behavior:'smooth'})">
            Treasury Section ↓
          </button>
          <a href="/admin/trade" class="btn btn-sm btn-outline-primary">
            Trading Admin →
          </a>
        </div>
      </div>
    `
    
    test.report = reportHTML

  } catch (error: any) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check trading bot status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Test: Are rewards distributed regularly?
const testRewardsRegular = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('rewards')
    const { idlFactory: rewardsIDL } = await import('../../../declarations/rewards/rewards.did.js')
    const agent = await getAnonymousAgent()
    const rActor: any = Actor.createActor(rewardsIDL, { agent, canisterId: cid })

    // Fetch config and balances
    const [config, tacoBalance, currentNeuronBalances] = await Promise.all([
      rActor.getConfiguration(),
      rActor.getTacoBalance?.() ?? Promise.resolve(0),
      rActor.getCurrentTotalNeuronBalances?.() ?? Promise.resolve(0),
    ])

    const timerRunning = config?.timerRunning || false
    const lastDistributionTime = config?.lastDistributionTime || 0
    const nextScheduledDistribution = config?.nextScheduledDistribution || null
    const distributionPeriodNS = config?.distributionPeriodNS || 0
    const periodicRewardPot = config?.periodicRewardPot || 0

    // Parse balances (in e8s format)
    const tacoBalanceNum = (typeof tacoBalance === 'object' && 'e8s' in tacoBalance) 
      ? Number(tacoBalance.e8s) / 1e8 
      : (typeof tacoBalance === 'bigint' || typeof tacoBalance === 'number') 
        ? Number(tacoBalance) / 1e8 
        : 0
    const currentNeuronBalancesNum = (typeof currentNeuronBalances === 'object' && 'e8s' in currentNeuronBalances) 
      ? Number(currentNeuronBalances.e8s) / 1e8 
      : (typeof currentNeuronBalances === 'bigint' || typeof currentNeuronBalances === 'number') 
        ? Number(currentNeuronBalances) / 1e8 
        : 0
    const availableBalanceNum = tacoBalanceNum - currentNeuronBalancesNum
    const periodicRewardPotNum = Number(periodicRewardPot)
    const periodNS = Number(distributionPeriodNS)

    // Check 1: Auto timer is running
    if (!timerRunning) {
      checks.push({
        name: 'Distribution Timer Status',
        status: 'fail',
        message: '❌ Distribution timer is <strong>not running</strong>. Rewards will not be distributed automatically.'
      })
    } else {
      checks.push({
        name: 'Distribution Timer Status',
        status: 'pass',
        message: '✅ Distribution timer is running.'
      })
    }

    // Check 2: Last distribution date was not more than 2 periods ago
    if (lastDistributionTime && Number(lastDistributionTime) > 0 && periodNS > 0) {
      const nowNs = Date.now() * 1_000_000
      const timeSinceLastDistribution = nowNs - Number(lastDistributionTime)
      const periodsOverdue = timeSinceLastDistribution / periodNS
      const lastDistributionDisplay = new Date(Number(BigInt(lastDistributionTime) / 1_000_000n)).toLocaleString()
      const distributionPeriodDays = Math.round(periodNS / (24 * 60 * 60 * 1_000_000_000))

      if (periodsOverdue > 2) {
        checks.push({
          name: 'Last Distribution Timing',
          status: 'fail',
          message: `❌ Last distribution was <strong>${Math.floor(periodsOverdue)} periods</strong> ago (${lastDistributionDisplay}). Expected within 2 periods (period: ${distributionPeriodDays} days).`
        })
      } else {
        checks.push({
          name: 'Last Distribution Timing',
          status: 'pass',
          message: `✅ Last distribution was <strong>${periodsOverdue.toFixed(1)} periods</strong> ago (${lastDistributionDisplay}, period: ${distributionPeriodDays} days).`
        })
      }
    } else {
      checks.push({
        name: 'Last Distribution Timing',
        status: 'fail',
        message: '❌ No distribution history available or period not configured.'
      })
    }

    // Check 3: Next distribution date is scheduled and not more than 1 period in the future
    if (nextScheduledDistribution && Number(nextScheduledDistribution) > 0 && periodNS > 0) {
      const nowNs = Date.now() * 1_000_000
      const timeUntilNextDistribution = Number(nextScheduledDistribution) - nowNs
      const periodsUntilNext = timeUntilNextDistribution / periodNS
      const nextDistributionDisplay = new Date(Number(BigInt(nextScheduledDistribution) / 1_000_000n)).toLocaleString()

      if (periodsUntilNext > 1) {
        checks.push({
          name: 'Next Distribution Scheduling',
          status: 'fail',
          message: `❌ Next distribution is scheduled <strong>${periodsUntilNext.toFixed(1)} periods</strong> in the future (${nextDistributionDisplay}). Expected within 1 period.`
        })
      } else if (periodsUntilNext < -1) {
        checks.push({
          name: 'Next Distribution Scheduling',
          status: 'fail',
          message: `❌ Next distribution was scheduled <strong>${Math.abs(periodsUntilNext).toFixed(1)} periods</strong> ago (${nextDistributionDisplay}) but hasn't been executed.`
        })
      } else {
        checks.push({
          name: 'Next Distribution Scheduling',
          status: 'pass',
          message: `✅ Next distribution scheduled for ${nextDistributionDisplay} (<strong>${periodsUntilNext.toFixed(1)} periods</strong> away).`
        })
      }
    } else {
      checks.push({
        name: 'Next Distribution Scheduling',
        status: 'fail',
        message: '❌ No next distribution is scheduled.'
      })
    }

    // Check 4: Next 3 distribution periods are funded
    if (periodicRewardPotNum > 0) {
      const periodsFunded = Math.floor(availableBalanceNum / periodicRewardPotNum)
      
      if (periodsFunded < 3) {
        checks.push({
          name: 'Funding for Next 3 Periods',
          status: 'fail',
          message: `❌ Only <strong>${periodsFunded} period(s)</strong> funded. Available: ${availableBalanceNum.toFixed(2)} TACO, Need for 3 periods: ${(periodicRewardPotNum * 3).toFixed(2)} TACO. Shortfall: ${((periodicRewardPotNum * 3) - availableBalanceNum).toFixed(2)} TACO.`
        })
      } else {
        checks.push({
          name: 'Funding for Next 3 Periods',
          status: 'pass',
          message: `✅ <strong>${periodsFunded} periods</strong> funded. Available: ${availableBalanceNum.toFixed(2)} TACO (${periodicRewardPotNum.toFixed(2)} TACO per period).`
        })
      }
    } else {
      checks.push({
        name: 'Funding for Next 3 Periods',
        status: 'error',
        message: '❌ Reward pot not configured (0 TACO).'
      })
    }

    // Generate final report
    const passed = checks.filter(c => c.status === 'pass').length
    const failed = checks.filter(c => c.status === 'fail').length
    const errors = checks.filter(c => c.status === 'error').length
    const total = checks.length

    // Set counts
    test.passCount = passed
    test.failCount = failed + errors
    test.totalCount = total

    // Overall status
    if (errors > 0 || failed > 0) {
      test.status = 'red'
    } else {
      test.status = 'green'
    }

    // Build HTML report
    let reportHTML = `
      <div class="mb-3">
        <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors out of ${total} checks
      </div>
      <div class="checks-results">
    `

    checks.forEach(check => {
      const icon = check.status === 'pass' 
        ? '<i class="fa-solid fa-check-circle text-success"></i>' 
        : check.status === 'fail'
        ? '<i class="fa-solid fa-times-circle text-danger"></i>'
        : '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
      
      const rowClass = check.status === 'pass' ? 'text-success' : check.status === 'fail' ? 'text-danger' : 'text-warning'
      
      reportHTML += `
        <div class="d-flex align-items-start gap-2 py-2 small ${rowClass}">
          <div style="min-width: 20px; margin-top: 2px;">${icon}</div>
          <div>
            <div class="fw-bold mb-1">${check.name}</div>
            <div>${check.message}</div>
          </div>
        </div>
      `
    })

    reportHTML += '</div>'
    
    // Add links section
    reportHTML += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('main-canisters-section').scrollIntoView({behavior:'smooth'})">
            Rewards Section ↓
          </button>
          <a href="/admin/distributions" class="btn btn-sm btn-outline-primary">
            Distributions Admin Page →
          </a>
        </div>
      </div>
    `
    
    test.report = reportHTML

  } catch (error: any) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check rewards distribution status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Test: Are portfolio snapshots regular?
const testPortfolioSnapshots = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('treasury')
    const { idlFactory: treasuryIDL } = await import('../../../declarations/treasury/treasury.did.js')
    const agent = await getAnonymousAgent()
    const tActor: any = Actor.createActor(treasuryIDL, { agent, canisterId: cid })

    // Fetch snapshot status
    const snapStatus = await tActor.getPortfolioSnapshotStatus()
    
    // Check 1: Snapshot timer running
    const snapshotRunning = !!('Running' in snapStatus.status)
    
    if (!snapshotRunning) {
      checks.push({
        name: 'Snapshot Timer Status',
        status: 'fail',
        message: '❌ Portfolio snapshot timer is <strong>not running</strong>.'
      })
    } else {
      checks.push({
        name: 'Snapshot Timer Status',
        status: 'pass',
        message: '✅ Portfolio snapshot timer is running.'
      })
    }
    
    // Check 2: Last snapshot not too old
    if (snapStatus.lastSnapshotTime && snapStatus.intervalMinutes) {
      const intervalNs = BigInt(snapStatus.intervalMinutes) * 60n * 1_000_000_000n // Convert minutes to nanoseconds
      const maxDelayNs = intervalNs * 5n // 5 periods
      const nowNs = BigInt(Date.now()) * 1_000_000n
      const lastSnapshotNs = BigInt(snapStatus.lastSnapshotTime)
      const delayNs = nowNs - lastSnapshotNs
      const periodsBehind = Number(delayNs) / Number(intervalNs)
      
      let snapshotTimingStatus: 'pass' | 'fail' | 'error' = 'pass'
      let snapshotTimingMessage = ''
      
      if (delayNs > maxDelayNs) {
        snapshotTimingStatus = 'fail'
        snapshotTimingMessage = `❌ Last snapshot is overdue by <strong>${periodsBehind.toFixed(1)}</strong> periods (last snapshot: ${formatNanoTime(lastSnapshotNs)}). Maximum allowed: 5 periods. Interval: ${snapStatus.intervalMinutes} minutes.`
      } else {
        snapshotTimingMessage = `✅ Snapshots are on schedule (last snapshot: ${formatNanoTime(lastSnapshotNs)}, <strong>${periodsBehind.toFixed(1)}</strong> periods ago). Interval: ${snapStatus.intervalMinutes} minutes.`
      }
      
      checks.push({
        name: 'Snapshot Timing',
        status: snapshotTimingStatus,
        message: snapshotTimingMessage
      })
    } else {
      checks.push({
        name: 'Snapshot Timing',
        status: 'error',
        message: '⚠️ Unable to determine snapshot timing (missing lastSnapshotTime or intervalMinutes)'
      })
    }
    
    // Overall status
    const anyFailed = checks.some(c => c.status === 'fail')
    const anyError = checks.some(c => c.status === 'error')
    
    if (anyError || anyFailed) {
      test.status = 'red'
    } else {
      test.status = 'green'
    }

    // Build HTML report
    const passed = checks.filter(c => c.status === 'pass').length
    const failed = checks.filter(c => c.status === 'fail').length
    const errors = checks.filter(c => c.status === 'error').length
    
    // Set counts
    test.passCount = passed
    test.failCount = failed + errors
    test.totalCount = checks.length

    let reportHTML = `
      <div class="mb-3">
        <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors
      </div>
      <div class="canister-results">
    `

    checks.forEach(check => {
      const icon = check.status === 'pass' 
        ? '<i class="fa-solid fa-check-circle text-success"></i>' 
        : check.status === 'fail'
        ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
        : '<i class="fa-solid fa-times-circle text-danger"></i>'
      
      const rowClass = check.status === 'pass' ? 'text-success' : check.status === 'fail' ? 'text-warning' : 'text-danger'
      
      reportHTML += `
        <div class="d-flex align-items-start gap-2 py-2 small ${rowClass}">
          <div class="mt-1">${icon}</div>
          <div>
            <div class="fw-bold">${check.name}</div>
            <div>${check.message}</div>
          </div>
        </div>
      `
    })

    reportHTML += '</div>'
    
    // Add links section
    reportHTML += `
      <div class="mt-3 pt-2 border-top">
        <small class="text-muted d-block mb-2"><strong>📍 View details:</strong></small>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('main-canisters-section').scrollIntoView({behavior:'smooth'})">
            Treasury Section ↓
          </button>
        </div>
      </div>
    `
    
    test.report = reportHTML

  } catch (error: any) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check portfolio snapshot status'}</div>`
    test.passCount = 0
    test.failCount = 1
    test.totalCount = 1
  }
}

// Watch main canisters status and auto-expand/collapse section
watch(mainCanistersStatus, (newStatus) => {
  if (!autoExpandOnRed.value) return // Skip auto-expand if disabled
  
  if (newStatus === 'red') {
    mainCanistersExpanded.value = true
    console.log('[MainCanisters] Auto-expanding section due to red status')
  } else if (newStatus === 'green') {
    mainCanistersExpanded.value = false
    console.log('[MainCanisters] Auto-collapsing section due to green status')
  }
})

// Watch archive canisters status and auto-expand/collapse section
watch(archiveCanistersStatus, (newStatus) => {
  if (!autoExpandOnRed.value) return // Skip auto-expand if disabled
  
  if (newStatus === 'red') {
    archivesExpanded.value = true
    console.log('[ArchiveCanisters] Auto-expanding section due to red status')
  } else if (newStatus === 'green') {
    archivesExpanded.value = false
    console.log('[ArchiveCanisters] Auto-collapsing section due to green status')
  }
})

// Watch checklist for failures and auto-expand System Status if needed
watch(() => checklist.map(item => item.status), (statuses) => {
  if (!autoExpandOnRed.value) return // Skip auto-expand if disabled
  
  const anyFailed = statuses.some(status => status === 'red')
  if (anyFailed && !systemStatusExpanded.value) {
    systemStatusExpanded.value = true
    console.log('[SystemStatus] Auto-expanding due to test failure')
  }
}, { deep: true })

onMounted(() => {
  // Load auto-expand setting from localStorage
  loadAutoExpandSetting()
  
  // CRITICAL FIX: Turn off app loading immediately - SystemView doesn't need it
  // The app-level loading curtain was blocking all user interaction
  if (appLoading.value) {
    tacoStore.appLoadingOff()
  }
  
  // Initial auto-run sequence
  runFullAutoRunSequence()
  
  // Set up auto-refresh timer
  setupAutoRefreshTimer()
  
  // Check admin permissions asynchronously without blocking
  ;(async () => {
  try {
    // Check if user is logged in first
    if (!tacoStore.userLoggedIn) {
      isAdmin.value = false
      return
    }

    // Use store's getAuthenticatedAgent for proper identity management
    const { Actor } = await import('@dfinity/agent')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const agent = await tacoStore.getAuthenticatedAgent()
    const daoActor = Actor.createActor(daoIDL, { agent, canisterId: tacoStore.daoBackendCanisterId() }) as any
    // Get identity principal from agent
    const principal = await agent.getPrincipal()
    // check permission for a read-safe function like getLogs
    isAdmin.value = await daoActor.hasAdminPermission(principal, { getLogs: null })
  } catch (_) {
    isAdmin.value = false
  }
  })()
})

onBeforeUnmount(() => {
  // Clean up auto-refresh timer
  if (autoRunTimerId !== null) {
    console.log('[Auto-Refresh] Cleaning up timer on component unmount')
    clearInterval(autoRunTimerId)
    autoRunTimerId = null
  }
})

</script>


