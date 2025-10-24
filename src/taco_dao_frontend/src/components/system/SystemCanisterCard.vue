<template>
  <div class="taco-container taco-container--l2 p-0">
    <div class="d-flex align-items-center justify-content-between px-3 py-2 card-header-clickable" @click="toggle">
      <div class="d-flex align-items-center gap-2">
        <!-- cycles status lamp first -->
        <span :class="['status-light', statusColorClass]"></span>
        <span class="fw-bold">{{ title }}</span>
        <span class="badge bg-light text-dark">{{ cyclesDisplay }}</span>
        <!-- archive timer lamps with clock icon -->
        <div v-if="timerStatus" class="d-flex align-items-center gap-2 ms-2">
          <span class="text-muted small d-inline-flex align-items-center">
            <i class="fa-regular fa-clock"></i>
          </span>
          <span class="status-indicator" :class="timerStatus.outerLoopRunning ? 'active' : 'status-red'" title="Outer"></span>
          <span class="status-indicator" :class="timerStatus.middleLoopRunning ? 'active' : 'inactive'" title="Middle"></span>
          <span class="status-indicator" :class="timerStatus.innerLoopRunning ? 'active' : 'inactive'" title="Inner"></span>
          <span :class="['small', outerLate ? 'text-danger' : 'text-muted']" :title="'Outer last run'">{{ outerLastRunDisplay }}</span>
        </div>
        
        <!-- generic token sync aggregate lamp (e.g., DAO backend) -->
        <div v-if="tokenAggregateWorst" class="d-flex align-items-center gap-2 ms-3">
          <span class="text-muted small d-inline-flex align-items-center" title="Token Sync">
            <i class="fa-solid fa-database"></i>
          </span>
          <span class="status-indicator" :class="tokenAggregateWorst === 'red' ? 'status-red' : tokenAggregateWorst === 'orange' ? 'status-orange' : 'active'"></span>
          <span v-if="oldestTokenSyncDisplay" class="small text-muted">{{ oldestTokenSyncDisplay }}</span>
        </div>

        <!-- governance header indicators -->
        <div v-if="governanceHeader" class="d-flex align-items-center gap-2 ms-3">
          <!-- periodic timer lamp + last run time -->
          <span class="text-muted small d-inline-flex align-items-center" title="NNS Periodic Timer (Master)">
            <i class="fa-solid fa-robot"></i>
          </span>
          <span class="status-indicator" :class="governanceHeader.periodicTimerRunning ? 'active' : 'inactive'"></span>
          <span 
            :class="['small', governanceHeader.periodicTimerStale === 'red' ? 'text-danger' : governanceHeader.periodicTimerStale === 'orange' ? 'text-warning' : 'text-muted']" 
            :title="'NNS Periodic Timer Last Run'">
            {{ governanceHeader.lastPeriodicRunDisplay }}
          </span>
        </div>

        <!-- treasury header indicators -->
        <div v-if="treasuryHeader" class="d-flex align-items-center gap-2 ms-3">
          <!-- trading bot lamp + last trade time -->
          <span class="text-muted small d-inline-flex align-items-center" title="Trading Bot">
            <i class="fa-solid fa-robot"></i>
          </span>
          <span class="status-indicator" :class="treasuryHeader.tradingActive ? 'active' : 'inactive'"></span>
          <span :class="['small', treasuryHeader.tradingStale ? 'text-danger' : 'text-muted']" :title="'Last trade time'">{{ treasuryHeader.lastTradeDisplay }}</span>
          
          <!-- short sync lamp -->
          <span class="text-muted small d-inline-flex align-items-center ms-2" title="Short Sync">
            <i class="fa-regular fa-clock"></i>
          </span>
          <span class="status-indicator" :class="treasuryHeader.shortSyncActive ? 'active' : 'inactive'"></span>

          <!-- long sync lamp -->
          <span class="text-muted small d-inline-flex align-items-center ms-2" title="Long Sync">
            <i class="fa-regular fa-clock"></i>
          </span>
          <span class="status-indicator" :class="treasuryHeader.longSyncActive ? 'active' : 'inactive'"></span>

          <!-- token sync aggregate lamp -->
          <span class="text-muted small d-inline-flex align-items-center ms-2" title="Token Sync">
            <i class="fa-solid fa-database"></i>
          </span>
          <span class="status-indicator" :class="treasuryHeader.tokenWorst === 'red' ? 'status-red' : treasuryHeader.tokenWorst === 'orange' ? 'status-orange' : 'active'"></span>
          
          <!-- snapshot bot lamp -->
          <span class="text-muted small d-inline-flex align-items-center ms-2" title="Snapshots">
            <i class="fa-regular fa-image"></i>
          </span>
          <span class="status-indicator" :class="treasuryHeader.snapshotActive ? 'active' : 'inactive'"></span>
        </div>

        <!-- rewards header indicators -->
        <div v-if="rewardsHeader" class="d-flex align-items-center gap-2 ms-3">
          <!-- distribution timer lamp + last distribution time -->
          <span class="text-muted small d-inline-flex align-items-center" title="Distribution Timer">
            <i class="fa-regular fa-clock"></i>
          </span>
          <span class="status-indicator" :class="rewardsHeader.timerRunning ? 'active' : 'inactive'"></span>
          <span :class="['small', rewardsHeader.distributionStale ? 'text-danger' : 'text-muted']" :title="'Last distribution time'">{{ rewardsHeader.lastDistributionDisplay }}</span>
          
          <!-- underfunded warning icon -->
          <span v-if="rewardsHeader.isUnderfunded" class="text-danger small d-inline-flex align-items-center ms-2" title="Distribution is underfunded!">
            <i class="fa-solid fa-exclamation-triangle"></i>
            <span class="ms-1">underfunded</span>
          </span>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2" @click.stop>
        <button class="btn btn-sm btn-primary" @click="$emit('refresh')" :disabled="loading" title="Refresh">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <button class="btn btn-sm btn-primary" @click="toggle" title="Toggle expand/collapse">
          <span v-if="expanded">Collapse</span>
          <span v-else>Expand</span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-show="expanded" class="px-3 pb-3">
        <div class="small text-muted">Principal</div>
        <code class="user-select-all text-white d-block mb-2">{{ principal }}</code>

        <div v-if="timerStatus" class="mt-2">
          <h6 class="mb-2">Three-Tier Timer Status</h6>
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <div class="timer-tier-card">
                <h6 class="d-flex align-items-center gap-2 mb-2">
                  <span class="status-indicator" :class="timerStatus.outerLoopRunning ? 'active' : 'inactive'"></span>
                  Outer Loop (Scheduler)
                </h6>
                <ul class="list-unstyled small mb-0">
                  <li><strong>Status:</strong> {{ timerStatus.outerLoopRunning ? 'Running' : 'Stopped' }}</li>
                  <li><strong>Interval:</strong> {{ timerStatus.outerLoopIntervalSeconds }}s</li>
                  <li><strong>Total Runs:</strong> {{ timerStatus.outerLoopTotalRuns || 0 }}</li>
                  <li><strong>Last Run:</strong> {{ formatTime(timerStatus.outerLoopLastRun) }}</li>
                </ul>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="timer-tier-card">
                <h6 class="d-flex align-items-center gap-2 mb-2">
                  <span class="status-indicator" :class="timerStatus.middleLoopRunning ? 'active' : 'inactive'"></span>
                  Middle Loop (Coordinator)
                </h6>
                <ul class="list-unstyled small mb-0">
                  <li><strong>Status:</strong> {{ timerStatus.middleLoopRunning ? 'Running' : 'Stopped' }}</li>
                  <li><strong>State:</strong> {{ timerStatus.middleLoopCurrentState || 'Done' }}</li>
                  <li><strong>Total Runs:</strong> {{ timerStatus.middleLoopTotalRuns || 0 }}</li>
                  <li><strong>Last Run:</strong> {{ formatTime(timerStatus.middleLoopLastRun) }}</li>
                  <li><strong>Next:</strong> {{ formatTime(timerStatus.middleLoopNextScheduled) }}</li>
                </ul>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="timer-tier-card">
                <h6 class="d-flex align-items-center gap-2 mb-2">
                  <span class="status-indicator" :class="timerStatus.innerLoopRunning ? 'active' : 'inactive'"></span>
                  Inner Loop (Worker)
                </h6>
                <ul class="list-unstyled small mb-0">
                  <li><strong>Status:</strong> {{ timerStatus.innerLoopRunning ? 'Running' : 'Stopped' }}</li>
                  <li><strong>Type:</strong> {{ timerStatus.innerLoopCurrentType || 'None' }}</li>
                  <li><strong>Current Batch:</strong> {{ timerStatus.innerLoopCurrentBatch || 0 }}</li>
                  <li><strong>Total Batches:</strong> {{ timerStatus.innerLoopTotalBatches || 0 }}</li>
                  <li><strong>Last Run:</strong> {{ formatTime(timerStatus.innerLoopLastRun) }}</li>
                  <li><strong>Next:</strong> {{ formatTime(timerStatus.innerLoopNextScheduled) }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end mt-3" v-if="isArchive">
          <router-link to="/admin/archives" class="btn btn-sm btn-outline-primary">
            View Archives Admin →
          </router-link>
        </div>

        <!-- Treasury read-only details -->
        <div v-if="treasuryDetails" class="mt-3">
          <h6 class="mb-2">Trading Metrics</h6>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="status-indicator" :class="treasuryDetails.tradingActive ? 'active' : 'inactive'"></span>
            <span class="small"><strong>Trading Status:</strong> {{ treasuryDetails.tradingActive ? 'Trading' : 'Idle' }}</span>
          </div>
          <div v-if="treasuryDetails.tradingWarning" :class="['mb-2 alert', treasuryDetails.tradingWarning.level === 'danger' ? 'alert-danger' : 'alert-warning']">⚠️ {{ treasuryDetails.tradingWarning.message }}</div>
          <div class="d-flex flex-column small gap-1">
            <div><strong>Last Attempt:</strong> {{ treasuryDetails.tradingMetrics?.lastRebalanceAttemptDisplay || 'Never' }}</div>
            <div><strong>Trading Interval:</strong> {{ treasuryDetails.tradingIntervalMinutes ? `${treasuryDetails.tradingIntervalMinutes} minutes` : 'N/A (config not loaded)' }}</div>
            <div><strong>Periods Since Last Trade:</strong> {{ treasuryDetails.periodsSinceLastTrade !== null ? treasuryDetails.periodsSinceLastTrade : 'N/A (config not loaded)' }}</div>
            <div><strong>Total Trades:</strong> {{ treasuryDetails.tradingMetrics?.totalTradesExecuted ?? 0 }}</div>
            <div><strong>Failed Trades:</strong> {{ treasuryDetails.tradingMetrics?.totalTradesFailed ?? 0 }}</div>
            <div><strong>Success Rate:</strong> {{ treasuryDetails.tradingMetrics?.successRatePct ?? '0.0%' }}</div>
            <div><strong>Avg Slippage:</strong> {{ treasuryDetails.tradingMetrics?.avgSlippagePct ?? '0.00%' }}</div>
          </div>

          <!-- token sync list moved to DAO backend card -->

          <h6 class="mb-2 mt-3">Portfolio Snapshot Management</h6>
          <div class="d-flex align-items-center gap-3 small">
            <span class="status-indicator" :class="treasuryDetails.snapshots?.active ? 'active' : 'inactive'"></span>
            <span><strong>Status:</strong> {{ treasuryDetails.snapshots?.active ? 'Running' : 'Stopped' }}</span>
            <span><strong>Interval:</strong> {{ treasuryDetails.snapshots?.intervalMinutes }} minutes</span>
            <span><strong>Last Snapshot:</strong> {{ treasuryDetails.snapshots?.lastSnapshotDisplay }}</span>
          </div>

          <h6 class="mb-2 mt-3">Sync Timers</h6>
          <div class="row g-3 small">
            <div class="col-12 col-md-6 d-flex align-items-center gap-2">
              <span class="status-indicator" :class="treasuryDetails.shortSync?.active ? 'active' : 'inactive'"></span>
              <span><strong>Short Sync ({{ treasuryDetails.shortSync?.intervalMinutes }}m)</strong></span>
              <span>Last: {{ treasuryDetails.shortSync?.lastSyncDisplay }}</span>
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center gap-2">
              <span class="status-indicator" :class="treasuryDetails.longSync?.active ? 'active' : 'inactive'"></span>
              <span><strong>Long Sync ({{ treasuryDetails.longSync?.intervalMinutes }}m)</strong></span>
              <span>Last: {{ treasuryDetails.longSync?.lastSyncDisplay }}</span>
            </div>
          </div>
          
          <div class="d-flex justify-content-end mt-3 gap-2">
            <router-link to="/admin/trade" class="btn btn-sm btn-outline-primary">
              Trading →
            </router-link>
            <router-link to="/admin/price" class="btn btn-sm btn-outline-primary">
              Prices →
            </router-link>
            <router-link to="/admin/pricehistory" class="btn btn-sm btn-outline-primary">
              Price History →
            </router-link>
          </div>
        </div>

        <!-- Rewards read-only details -->
        <div v-if="rewardsDetails" class="mt-3">
          <h6 class="mb-2">Distribution Status</h6>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="status-indicator" :class="rewardsDetails.timerRunning ? 'active' : 'inactive'"></span>
            <span class="small"><strong>Auto Timer:</strong> {{ rewardsDetails.timerRunning ? 'Running' : 'Stopped' }}</span>
          </div>
          
          <!-- Underfunded warning - prominent -->
          <div v-if="rewardsDetails.fundingWarning" class="mb-2 alert alert-danger">
            <strong><i class="fa-solid fa-exclamation-triangle"></i> Distribution Underfunded!</strong><br>
            {{ rewardsDetails.fundingWarning.message }}
          </div>
          
          <div v-if="rewardsDetails.distributionWarning" :class="['mb-2 alert', rewardsDetails.distributionWarning.level === 'danger' ? 'alert-danger' : 'alert-warning']">⚠️ {{ rewardsDetails.distributionWarning.message }}</div>
          <div class="d-flex flex-column small gap-1">
            <div><strong>Last Distribution:</strong> {{ rewardsDetails.lastDistributionDisplay || 'Never' }}</div>
            <div><strong>Next Scheduled:</strong> {{ rewardsDetails.nextScheduledDisplay || 'Not scheduled' }}</div>
            <div><strong>Total Distributions:</strong> {{ rewardsDetails.totalDistributions ?? 0 }}</div>
            <div><strong>Distribution Period:</strong> {{ rewardsDetails.distributionPeriodDays }} days</div>
            <div><strong>Current Reward Pot:</strong> {{ rewardsDetails.periodicRewardPot }} TACO</div>
          </div>

          <h6 class="mb-2 mt-3">Balances</h6>
          <div class="d-flex flex-column small gap-1">
            <div><strong>Canister TACO Balance:</strong> {{ rewardsDetails.tacoBalance }} TACO</div>
            <div><strong>Current Neuron Balances:</strong> {{ rewardsDetails.currentNeuronBalances }} TACO</div>
            <div><strong>Available for Distribution:</strong> {{ rewardsDetails.availableBalance }} TACO</div>
            <div><strong>Total Distributed (All Time):</strong> {{ rewardsDetails.totalDistributed }} TACO</div>
          </div>

          <!-- Funding runway report -->
          <div v-if="rewardsDetails.fundingReport" class="mt-3 p-2 bg-dark border rounded text-white">
            <h6 class="mb-2 small text-white">📊 Funding Runway</h6>
            <div class="d-flex flex-column small gap-1">
              <div>
                <strong>Distributions Funded:</strong> 
                <span :class="rewardsDetails.fundingReport.periodsClass">{{ rewardsDetails.fundingReport.periodsFunded }}</span> periods
              </div>
              <div>
                <strong>Time Coverage:</strong> 
                <span :class="rewardsDetails.fundingReport.periodsClass">{{ rewardsDetails.fundingReport.timeDisplay }}</span>
              </div>
              <div v-if="rewardsDetails.fundingReport.nextFundingDate" class="text-light">
                <small>Funds will be depleted around: {{ rewardsDetails.fundingReport.nextFundingDate }}</small>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-3 gap-2">
            <router-link to="/admin/rewards" class="btn btn-sm btn-outline-primary">
              Rewards Config →
            </router-link>
            <router-link to="/admin/rewards/balances" class="btn btn-sm btn-outline-primary">
              Balances →
            </router-link>
            <router-link to="/admin/distributions" class="btn btn-sm btn-outline-primary">
              Distributions →
            </router-link>
            <router-link to="/admin/claims" class="btn btn-sm btn-outline-primary">
              Claims →
            </router-link>
          </div>
        </div>

        <!-- DAO Backend read-only token sync list -->
        <div v-if="tokenList && tokenList.length" class="mt-3">
          <h6 class="mb-2">Token Sync Status</h6>
          <div class="d-flex flex-column gap-1">
            <div v-for="t in tokenList" :key="t.symbol" class="d-flex align-items-center gap-2 small">
              <span class="status-indicator" :class="t.statusClass"></span>
              <span class="token-symbol">{{ t.symbol }}</span>
              <span class="text-muted">Last Sync: {{ t.lastSyncDisplay }}</span>
              <span class="text-muted">{{ t.statusText }}</span>
            </div>
          </div>
          
          <div class="d-flex justify-content-end mt-3">
            <router-link to="/admin/votes" class="btn btn-sm btn-outline-primary">
              View Voting Admin →
            </router-link>
          </div>
        </div>

        <!-- Governance read-only details -->
        <div v-if="governanceDetails" class="mt-3">
          <h6 class="mb-2">NNS Periodic Timer (Master)</h6>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="status-indicator" :class="governanceDetails.periodicTimerRunning ? 'active' : 'inactive'"></span>
            <span class="small"><strong>Timer Status:</strong> {{ governanceDetails.periodicTimerRunning ? 'Running' : 'Stopped' }}</span>
          </div>
          
          <!-- Warning if more than 1 period old -->
          <div v-if="governanceDetails.periodicTimerStale === 'orange' || governanceDetails.periodicTimerStale === 'red'" 
               :class="['mb-2 alert', governanceDetails.periodicTimerStale === 'red' ? 'alert-danger' : 'alert-warning']">
            ⚠️ NNS Periodic Timer last ran more than 1 period ago ({{ governanceDetails.lastPeriodicRunDisplay }}). 
            Grant system automation may not be processing regularly.
          </div>
          
          <div class="d-flex flex-column small gap-1">
            <div><strong>Interval:</strong> {{ governanceDetails.intervalDisplay }}</div>
            <div><strong>Last Run:</strong> {{ governanceDetails.lastPeriodicRunDisplay }}</div>
            <div><strong>Next Run:</strong> {{ governanceDetails.nextRunDisplay }}</div>
          </div>
          
          <h6 class="mb-2 mt-3">Neuron Snapshot Timer</h6>
          <div class="d-flex align-items-center gap-2">
            <span class="status-indicator" :class="governanceDetails.snapshotActive ? 'active' : 'inactive'"></span>
            <span class="small"><strong>Last Snapshot:</strong> {{ governanceDetails.lastSnapshotDisplay }}</span>
          </div>
          
          <div class="d-flex justify-content-end mt-3 gap-2">
            <router-link to="/admin/neuron" class="btn btn-sm btn-outline-primary">
              Neuron Admin →
            </router-link>
            <router-link to="/admin/nns" class="btn btn-sm btn-outline-primary">
              NNS Automation →
            </router-link>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.status-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-green { background-color: #28a745; }
.status-orange { background-color: #fd7e14; }
.status-red { background-color: #dc3545; }
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-indicator.active { background-color: #28a745; }
.status-indicator.inactive { background-color: #6c757d; }

.card-header-clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.card-header-clickable:hover {
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
</style>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  principal: string
  cyclesT: number | null
  expanded: boolean
  loading?: boolean
  timerStatus?: any
  isAdmin?: boolean
  isArchive?: boolean
  treasuryHeader?: {
    tradingActive: boolean
    tradingStale: boolean
    lastTradeDisplay: string
    tokenWorst: 'green' | 'orange' | 'red'
    snapshotActive: boolean
    shortSyncActive?: boolean
    longSyncActive?: boolean
  }
  treasuryDetails?: any
  rewardsHeader?: {
    timerRunning: boolean
    distributionStale: boolean
    lastDistributionDisplay: string
    isUnderfunded: boolean
  }
  rewardsDetails?: any
  tokenList?: Array<{ symbol: string; lastSyncDisplay: string; statusClass: string; statusText: string }>
  tokenAggregateWorst?: 'green' | 'orange' | 'red'
  oldestTokenSyncDisplay?: string
  governanceHeader?: {
    snapshotActive: boolean
    lastSnapshotDisplay: string
    periodicTimerRunning: boolean
    lastPeriodicRunDisplay: string
    periodicTimerStale: 'green' | 'orange' | 'red'
  }
  governanceDetails?: any
}>()

const emits = defineEmits(['update:expanded','refresh'])

const toggle = () => emits('update:expanded', !props.expanded)

const cyclesDisplay = computed(() => {
  if (props.loading) return '…'
  if (props.cyclesT === null || props.cyclesT === undefined) return 'n/a'
  return `${props.cyclesT}T`
})

const statusColorClass = computed(() => {
  if (props.cyclesT === null || props.cyclesT === undefined) return 'status-orange'
  if (props.cyclesT >= 10) return 'status-green'
  if (props.cyclesT < 5) return 'status-red'
  return 'status-orange'
})

const formatTime = (timestamp?: number | bigint | null) => {
  if (!timestamp || Number(timestamp) === 0) return 'Never'
  const date = new Date(Number(timestamp) / 1_000_000)
  return date.toLocaleString()
}

const outerLastRunDisplay = computed(() => formatTime(props.timerStatus?.outerLoopLastRun as any))
const outerLate = computed(() => {
  const lastRun = props.timerStatus?.outerLoopLastRun as any
  if (!lastRun || Number(lastRun) === 0) return true
  const lastMs = Number(lastRun) / 1_000_000
  const nowMs = Date.now()
  // 30 minutes in ms
  const threshold = 30 * 60 * 1000
  return nowMs - lastMs > threshold
})

</script>


