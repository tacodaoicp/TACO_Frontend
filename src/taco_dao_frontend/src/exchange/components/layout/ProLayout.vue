<template>
  <div
    class="pro-layout"
    :style="{
      gridTemplateColumns: `1fr 2px ${orderbookWidth}px ${orderEntryWidth}px`,
      gridTemplateRows: `48px 1fr 2px ${bottomHeight}px`,
    }"
  >
    <!-- Row 1: Header spans all columns -->
    <div class="pro-layout__header" style="grid-column: 1 / -1; grid-row: 1;">
      <slot name="header" />
    </div>

    <!-- Row 2: Chart | Resizer | Orderbook | Order Entry -->
    <div class="pro-layout__chart" style="grid-column: 1; grid-row: 2;">
      <slot name="chart" />
    </div>

    <PanelResizer
      direction="horizontal"
      style="grid-column: 2; grid-row: 2;"
      @resize="onOrderbookResize"
      @resizeEnd="saveSizes"
    />

    <div style="grid-column: 3; grid-row: 2;">
      <slot name="orderbook" />
    </div>

    <div style="grid-column: 4; grid-row: 2;">
      <slot name="order-entry" />
    </div>

    <!-- Row 3: Horizontal resizer for bottom panel -->
    <PanelResizer
      direction="vertical"
      style="grid-column: 1 / -1; grid-row: 3;"
      @resize="onBottomResize"
      @resizeEnd="saveSizes"
      @reset="resetBottomHeight"
    />

    <!-- Row 4: Bottom panel spans all columns -->
    <div class="pro-layout__bottom" style="grid-column: 1 / -1; grid-row: 4;">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from 'vue'
import PanelResizer from './PanelResizer.vue'

const STORAGE_KEY = 'taco_panel_sizes'

interface PanelSizes {
  orderbookWidth: number
  orderEntryWidth: number
  bottomHeight: number
}

const defaults: PanelSizes = {
  orderbookWidth: 260,
  orderEntryWidth: 320,
  bottomHeight: 200,
}

const orderbookWidth = ref(defaults.orderbookWidth)
const orderEntryWidth = ref(defaults.orderEntryWidth)
const bottomHeight = ref(defaults.bottomHeight)

provide('bottomHeight', bottomHeight)

function loadSizes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PanelSizes>
      orderbookWidth.value = parsed.orderbookWidth ?? defaults.orderbookWidth
      orderEntryWidth.value = parsed.orderEntryWidth ?? defaults.orderEntryWidth
      bottomHeight.value = parsed.bottomHeight ?? defaults.bottomHeight
    }
  } catch { /* use defaults */ }
}

function saveSizes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    orderbookWidth: orderbookWidth.value,
    orderEntryWidth: orderEntryWidth.value,
    bottomHeight: bottomHeight.value,
  }))
}

const BOTTOM_MIN = 120
function bottomMax() {
  // Cap at 75% of viewport so the main area always has breathing room,
  // but never let the cap drop below the min (tiny windows).
  return Math.max(BOTTOM_MIN, Math.floor(window.innerHeight * 0.75))
}

function onOrderbookResize(delta: number) {
  // Resizer is between chart and orderbook
  // Positive delta = moving right = orderbook gets narrower (chart gets bigger)
  const newWidth = orderbookWidth.value - delta
  orderbookWidth.value = Math.min(400, Math.max(220, newWidth))
}

function onBottomResize(delta: number) {
  // Moving resizer up = bottom gets taller (negative delta = increase height)
  const newHeight = bottomHeight.value - delta
  bottomHeight.value = Math.min(bottomMax(), Math.max(BOTTOM_MIN, newHeight))
}

function resetBottomHeight() {
  bottomHeight.value = defaults.bottomHeight
  saveSizes()
}

function onWindowResize() {
  // Re-clamp in case the viewport shrank below the saved height.
  bottomHeight.value = Math.min(bottomMax(), Math.max(BOTTOM_MIN, bottomHeight.value))
}

function resetLayout() {
  orderbookWidth.value = defaults.orderbookWidth
  orderEntryWidth.value = defaults.orderEntryWidth
  bottomHeight.value = defaults.bottomHeight
  localStorage.removeItem(STORAGE_KEY)
}

onMounted(() => {
  loadSizes()
  onWindowResize()
  window.addEventListener('resize', onWindowResize)
})
onUnmounted(() => window.removeEventListener('resize', onWindowResize))

defineExpose({ resetLayout })
</script>

<style scoped lang="scss">
.pro-layout {
  display: grid;
  flex: 1;
  min-height: 0;
  background: #2A1608;
  background: var(--bg-secondary, #2A1608);
  gap: 0;
  overflow: hidden;

  &__header {
    z-index: 100;
    background: var(--bg-secondary, #2A1608);
  }

  &__chart {
    overflow: hidden;
    background: var(--bg-primary, #1A0E05);
  }

  &__bottom {
    overflow: hidden;
    background: var(--bg-secondary, #2A1608);
  }

  // Responsive: hide pro layout on mobile
  @media (max-width: 767px) {
    display: none;
  }
}
</style>
