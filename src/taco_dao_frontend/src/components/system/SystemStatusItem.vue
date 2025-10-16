<template>
  <div class="taco-container taco-container--l2 p-0">
    <div class="d-flex align-items-center justify-content-between px-3 py-2 card-header-clickable" @click="toggle">
      <div class="d-flex align-items-center gap-2">
        <span v-if="running" class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Running...</span>
        </span>
        <span v-else :class="['status-indicator', statusClass]"></span>
        <span class="fw-bold">{{ title }}</span>
      </div>
      <div class="d-flex align-items-center gap-2" @click.stop>
        <button class="btn btn-sm btn-primary" @click="runTest" :disabled="runDisabled || running" title="Run check">
          <span v-if="running">
            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
            Running...
          </span>
          <span v-else>Run</span>
        </button>
        <button class="btn btn-sm btn-primary" @click="toggle" title="Toggle expand/collapse">
          <span v-if="expanded">Collapse</span>
          <span v-else>Expand</span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-show="expanded" class="px-3 pb-3">
        <slot>
          <div class="text-muted small">No content yet.</div>
        </slot>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-green { background-color: #28a745; }
.status-red { background-color: #dc3545; }
.status-gray { background-color: #6c757d; }

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
  status?: 'gray' | 'green' | 'red'
  expanded: boolean
  runDisabled?: boolean
  running?: boolean
}>()

const emits = defineEmits(['update:expanded','run'])

const toggle = () => emits('update:expanded', !props.expanded)
const runTest = () => emits('run')

const statusClass = computed(() => {
  switch (props.status) {
    case 'green': return 'status-green'
    case 'red': return 'status-red'
    default: return 'status-gray'
  }
})

</script>



