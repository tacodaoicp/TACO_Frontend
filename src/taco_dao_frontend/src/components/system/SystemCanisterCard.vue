<template>
  <div class="taco-container taco-container--l2 p-0">
    <div class="d-flex align-items-center justify-content-between px-3 py-2">
      <div class="d-flex align-items-center gap-2">
        <span class="fw-bold">{{ title }}</span>
        <span class="badge bg-light text-dark">{{ cyclesDisplay }}</span>
        <!-- archive timer lamps -->
        <div v-if="timerStatus" class="d-flex align-items-center gap-2 ms-2">
          <span class="status-indicator" :class="timerStatus.outerLoopRunning ? 'active' : 'inactive'" title="Outer"></span>
          <span class="status-indicator" :class="timerStatus.middleLoopRunning ? 'active' : 'inactive'" title="Middle"></span>
          <span class="status-indicator" :class="timerStatus.innerLoopRunning ? 'active' : 'inactive'" title="Inner"></span>
        </div>
        <span :class="['status-light', statusColorClass]"></span>
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

</script>


