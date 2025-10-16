<template>
  <div class="taco-container taco-container--l2 p-0">
    <div class="d-flex align-items-center justify-content-between px-3 py-2">
      <div class="d-flex align-items-center gap-2">
        <span :class="['status-indicator', statusClass]"></span>
        <span class="fw-bold">{{ title }}</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" @click="$emit('run')" :disabled="runDisabled">
          Run
        </button>
        <button class="btn btn-sm btn-outline-secondary" @click="toggle">
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
</style>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  status?: 'gray' | 'green' | 'red'
  expanded: boolean
  runDisabled?: boolean
}>()

const emits = defineEmits(['update:expanded','run'])

const toggle = () => emits('update:expanded', !props.expanded)

const statusClass = computed(() => {
  switch (props.status) {
    case 'green': return 'status-green'
    case 'red': return 'status-red'
    default: return 'status-gray'
  }
})

</script>



