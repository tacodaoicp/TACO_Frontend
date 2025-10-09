<template>
  <div class="taco-container taco-container--l2 p-0">
    <div class="d-flex align-items-center justify-content-between px-3 py-2">
      <div class="d-flex align-items-center gap-2">
        <span class="fw-bold">{{ title }}</span>
        <span class="badge bg-light text-dark">{{ cyclesDisplay }}</span>
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
        <code class="user-select-all text-white">{{ principal }}</code>
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
</style>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  principal: string
  cyclesT: number | null
  expanded: boolean
  loading?: boolean
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

</script>


