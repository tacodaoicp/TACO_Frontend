<template>

  <div v-if="filteredHistory.length > 0" class="nav-chart">

    <!-- section title -->
    <h3 class="nav-chart__title">NAV History</h3>

    <!-- chart -->
    <div class="nav-chart__wrap taco-container taco-container--l1">
      <div class="nav-chart__inner">
        <apexchart
          ref="chartRef"
          type="line"
          :options="chartOptions"
          :series="series"
          height="100%"
        />
      </div>

      <!-- legend -->
      <div class="nav-chart__legend">
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" style="background:#4CAF50"></span> Mint
        </span>
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" style="background:#F44336"></span> Burn
        </span>
        <span class="nav-chart__legend-item">
          <span class="nav-chart__legend-dot" style="background:#FF9800"></span> Manual
        </span>
      </div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

// Skip first NAV snapshot (genesis / initialization point)
const filteredHistory = computed(() =>
  nachosStore.navHistory.length > 1 ? nachosStore.navHistory.slice(1) : nachosStore.navHistory
)

// Single-pass build: produce series points + marker overrides together so the
// history list is iterated only once per change.
const chartData = computed(() => {
  const data: Array<{ x: number; y: number }> = []
  const markers: Array<{
    seriesIndex: number
    dataPointIndex: number
    fillColor: string
    strokeColor: string
    size: number
  }> = []

  const history = filteredHistory.value
  for (let i = 0; i < history.length; i++) {
    const snap: any = history[i]
    data.push({
      x: new Date(Number(snap.timestamp / 1_000_000n)).getTime(),
      y: Number(snap.navPerTokenE8s) / 1e8,
    })

    let color = '#4CAF50'
    const isScheduled = 'Scheduled' in snap.reason
    if ('Burn' in snap.reason) color = '#F44336'
    else if ('Mint' in snap.reason) color = '#4CAF50'
    else if (isScheduled) color = '#FFD600'
    else if ('Manual' in snap.reason) color = '#FF9800'

    markers.push({
      seriesIndex: 0,
      dataPointIndex: i,
      fillColor: color,
      strokeColor: color,
      size: isScheduled ? 0 : 4,
    })
  }
  return { data, markers }
})

const series = computed(() => [{
  name: 'NAV per NACHOS (ICP)',
  data: chartData.value.data,
}])

// Static options — extracted once so they aren't rebuilt on every history change.
const STATIC_CHART_OPTIONS = {
  chart: {
    type: 'line' as const,
    background: 'transparent',
    toolbar: { show: true },
    zoom: { enabled: true },
    animations: {
      enabled: true,
      dynamicAnimation: { enabled: true, speed: 300 },
      animateGradually: { enabled: false },
    },
  },
  xaxis: {
    type: 'datetime' as const,
    labels: {
      datetimeUTC: false,
      style: { colors: 'var(--black-to-white)', fontSize: '0.7rem' },
    },
  },
  yaxis: {
    title: { text: 'NAV (ICP)', style: { color: 'var(--black-to-white)' } },
    labels: {
      style: { colors: 'var(--black-to-white)', fontSize: '0.7rem' },
      formatter: (val: number) => val.toFixed(4),
    },
  },
  stroke: { curve: 'smooth' as const, width: 2 },
  colors: ['#4CAF50'],
  grid: { borderColor: 'rgba(128, 128, 128, 0.2)' },
  tooltip: {
    theme: 'dark',
    x: { format: 'MMM dd, HH:mm' },
    y: { formatter: (val: number) => val.toFixed(8) + ' ICP' },
  },
}

const chartOptions = computed(() => ({
  ...STATIC_CHART_OPTIONS,
  markers: {
    size: 3,
    discrete: chartData.value.markers,
  },
}))
</script>

<style scoped lang="scss">
.nav-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 300px;

  &__title {
    font-size: 1rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gold);
    margin-bottom: 0;
  }

  &__wrap {
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__inner {
    flex: 1;
    min-height: 0;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  &__legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.7;
    flex-wrap: wrap;
    padding-top: 0.5rem;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  &__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
}
</style>
