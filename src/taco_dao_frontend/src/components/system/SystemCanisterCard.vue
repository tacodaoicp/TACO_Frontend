<template>
  <div class="taco-container taco-container--l2 p-0">
    <div class="d-flex align-items-center justify-content-between px-3 py-2">
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

        <!-- treasury header indicators -->
        <div v-if="treasuryHeader" class="d-flex align-items-center gap-2 ms-3">
          <!-- trading bot lamp + last trade time -->
          <span class="text-muted small d-inline-flex align-items-center" title="Trading Bot">
            <i class="fa-solid fa-robot"></i>
          </span>
          <span class="status-indicator" :class="treasuryHeader.tradingActive ? 'active' : 'inactive'"></span>
          <span :class="['small', treasuryHeader.tradingStale ? 'text-danger' : 'text-muted']" :title="'Last trade time'">{{ treasuryHeader.lastTradeDisplay }}</span>
          
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
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" @click="$emit('refresh')" :disabled="loading">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary" @click="toggle">
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

        <div class="d-flex justify-content-end mt-3" v-if="isAdmin && isArchive">
          <router-link to="/admin/archives" class="btn btn-sm btn-outline-primary">
            Manage
          </router-link>
        </div>

        <!-- Treasury read-only details -->
        <div v-if="treasuryDetails" class="mt-3">
          <h6 class="mb-2">Trading Metrics</h6>
          <div class="d-flex flex-column small gap-1">
            <div><strong>Last Attempt:</strong> {{ treasuryDetails.tradingMetrics?.lastRebalanceAttemptDisplay || 'Never' }}</div>
            <div><strong>Total Trades:</strong> {{ treasuryDetails.tradingMetrics?.totalTradesExecuted ?? 0 }}</div>
            <div><strong>Failed Trades:</strong> {{ treasuryDetails.tradingMetrics?.totalTradesFailed ?? 0 }}</div>
            <div><strong>Success Rate:</strong> {{ treasuryDetails.tradingMetrics?.successRatePct ?? '0.0%' }}</div>
            <div><strong>Avg Slippage:</strong> {{ treasuryDetails.tradingMetrics?.avgSlippagePct ?? '0.00%' }}</div>
            <div v-if="treasuryDetails.tradingWarning" :class="['mt-1', treasuryDetails.tradingWarning.level === 'danger' ? 'text-danger' : 'text-warning']">{{ treasuryDetails.tradingWarning.message }}</div>
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
  }
  treasuryDetails?: any
  tokenList?: Array<{ symbol: string; lastSyncDisplay: string; statusClass: string; statusText: string }>
  tokenAggregateWorst?: 'green' | 'orange' | 'red'
  oldestTokenSyncDisplay?: string
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


