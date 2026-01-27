<template>
  <div class="performance-chart">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2 text-muted">Loading chart data...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-4">
      <i class="fas fa-exclamation-triangle text-warning me-2"></i>
      <span class="text-muted">{{ error }}</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasData" class="text-center py-4">
      <i class="fas fa-chart-area text-muted me-2"></i>
      <span class="text-muted">No performance history available</span>
    </div>

    <!-- Chart -->
    <apexchart
      v-else
      type="area"
      :options="chartOptions"
      :series="chartSeries"
      :height="height"
    />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { storeToRefs } from 'pinia'

export default {
  name: 'PerformanceChart',
  props: {
    // Principal of the user to show performance for
    principal: {
      type: String,
      required: true
    },
    // Price type: 'USD' or 'ICP'
    priceType: {
      type: String,
      default: 'USD',
      validator: (val) => ['USD', 'ICP'].includes(val)
    },
    // Timeframe: 'OneWeek', 'OneMonth', 'OneYear', 'AllTime'
    timeframe: {
      type: String,
      default: 'AllTime',
      validator: (val) => ['OneWeek', 'OneMonth', 'OneYear', 'AllTime'].includes(val)
    },
    // Chart height
    height: {
      type: [Number, String],
      default: 250
    }
  },

  setup(props) {
    const tacoStore = useTacoStore()
    const { fetchedTokenDetails } = storeToRefs(tacoStore)

    const loading = ref(false)
    const error = ref('')
    const checkpoints = ref([])
    const initialValue = ref(1)

    // Build a map of token principal -> symbol for quick lookup
    const tokenSymbolMap = computed(() => {
      const map = new Map()
      if (fetchedTokenDetails.value) {
        for (const [principal, details] of fetchedTokenDetails.value) {
          try {
            const principalStr = principal.toText ? principal.toText() : principal.toString()
            map.set(principalStr, details.tokenSymbol || 'Unknown')
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      return map
    })

    // Get token symbol from principal
    const getTokenSymbol = (principal) => {
      if (!principal) return 'Unknown'
      try {
        const principalStr = principal.toText ? principal.toText() : principal.toString()
        return tokenSymbolMap.value.get(principalStr) || shortenPrincipal(principalStr)
      } catch (e) {
        return 'Unknown'
      }
    }

    // Shorten principal for display if no symbol found
    const shortenPrincipal = (principal) => {
      if (principal.length > 10) {
        return principal.substring(0, 5) + '...'
      }
      return principal
    }

    // Check if we have data to display
    const hasData = computed(() => {
      return checkpoints.value.length > 0
    })

    // Helper to check if two allocations are identical
    const allocationsEqual = (alloc1, alloc2) => {
      if (!alloc1 && !alloc2) return true
      if (!alloc1 || !alloc2) return false
      if (alloc1.length !== alloc2.length) return false

      // Create maps of token -> basisPoints for comparison
      const map1 = new Map()
      const map2 = new Map()

      for (const a of alloc1) {
        const tokenStr = a.token?.toText ? a.token.toText() : a.token?.toString() || ''
        map1.set(tokenStr, Number(a.basisPoints))
      }
      for (const a of alloc2) {
        const tokenStr = a.token?.toText ? a.token.toText() : a.token?.toString() || ''
        map2.set(tokenStr, Number(a.basisPoints))
      }

      if (map1.size !== map2.size) return false

      for (const [token, bp] of map1) {
        if (map2.get(token) !== bp) return false
      }
      return true
    }

    // Process checkpoints into chart series data, skipping consecutive identical allocations
    const chartSeries = computed(() => {
      if (!checkpoints.value.length) return []

      // First, filter checkpoints to skip consecutive ones with identical allocations
      const filteredCheckpoints = []
      let lastIncludedAllocation = null

      for (let i = 0; i < checkpoints.value.length; i++) {
        const cp = checkpoints.value[i]
        const isFirst = i === 0
        const isLast = i === checkpoints.value.length - 1

        // Always include first and last checkpoint
        if (isFirst || isLast) {
          filteredCheckpoints.push({ checkpoint: cp, originalIndex: i })
          lastIncludedAllocation = cp.allocations
        } else {
          // Include if allocation changed from last included
          if (!allocationsEqual(cp.allocations, lastIncludedAllocation)) {
            filteredCheckpoints.push({ checkpoint: cp, originalIndex: i })
            lastIncludedAllocation = cp.allocations
          }
        }
      }

      const data = filteredCheckpoints.map(({ checkpoint: cp, originalIndex }) => {
        // Convert timestamp from nanoseconds to milliseconds
        const timestampMs = Number(cp.timestamp) / 1_000_000
        // Calculate % return from initial value
        const percentReturn = ((cp.totalPortfolioValue / initialValue.value) - 1) * 100

        return {
          x: timestampMs,
          y: parseFloat(percentReturn.toFixed(2)),
          checkpointIndex: originalIndex // Store original index to look up allocation data
        }
      })

      // Sort by timestamp
      data.sort((a, b) => a.x - b.x)

      return [{
        name: `Return (${props.priceType})`,
        data
      }]
    })

    // Chart options
    const chartOptions = computed(() => {
      const isPositive = chartSeries.value[0]?.data?.length > 0
        ? chartSeries.value[0].data[chartSeries.value[0].data.length - 1]?.y >= 0
        : true

      return {
        chart: {
          type: 'area',
          toolbar: {
            show: true,
            tools: {
              download: false,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true
            }
          },
          zoom: { enabled: true },
          background: 'transparent',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 500
          }
        },
        theme: { mode: 'dark' },
        colors: [isPositive ? '#68d391' : '#fc8181'], // Green for positive, red for negative
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 90, 100]
          }
        },
        dataLabels: {
          enabled: false
        },
        markers: {
          size: 5,
          colors: [isPositive ? '#68d391' : '#fc8181'],
          strokeColors: '#1a1a2e',
          strokeWidth: 2,
          hover: {
            size: 7
          }
        },
        xaxis: {
          type: 'datetime',
          labels: {
            datetimeUTC: false,
            style: {
              colors: '#888'
            }
          },
          axisBorder: {
            color: '#333'
          },
          axisTicks: {
            color: '#333'
          }
        },
        yaxis: {
          labels: {
            formatter: (val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`,
            style: {
              colors: '#888'
            }
          }
        },
        tooltip: {
          theme: 'dark',
          custom: function({ series, seriesIndex, dataPointIndex, w }) {
            const dataPoint = w.config.series[seriesIndex].data[dataPointIndex]
            const value = series[seriesIndex][dataPointIndex]
            const timestamp = dataPoint.x
            const date = new Date(timestamp)
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            // Get the checkpoint data for allocations
            const checkpointIndex = dataPoint.checkpointIndex
            const checkpoint = checkpoints.value[checkpointIndex]

            // Build allocation HTML
            let allocationHtml = ''
            if (checkpoint?.allocations && checkpoint.allocations.length > 0) {
              const nonZeroAllocations = checkpoint.allocations
                .filter(alloc => Number(alloc.basisPoints) > 0)
                .map(alloc => {
                  const symbol = getTokenSymbol(alloc.token)
                  const percent = (Number(alloc.basisPoints) / 100).toFixed(1)
                  return `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#aaa;">${symbol}</span><span>${percent}%</span></div>`
                })

              if (nonZeroAllocations.length > 0) {
                allocationHtml = `
                  <div style="border-top:1px solid #444;margin-top:8px;padding-top:8px;">
                    <div style="color:#888;font-size:11px;margin-bottom:4px;">Allocation:</div>
                    ${nonZeroAllocations.join('')}
                  </div>
                `
              }
            }

            const returnColor = value >= 0 ? '#68d391' : '#fc8181'
            const returnSign = value >= 0 ? '+' : ''

            return `
              <div style="background:#1a1a2e;border:1px solid #333;border-radius:6px;padding:10px;min-width:140px;">
                <div style="color:#888;font-size:11px;margin-bottom:6px;">${dateStr}</div>
                <div style="font-size:16px;font-weight:600;color:${returnColor};">${returnSign}${value.toFixed(2)}%</div>
                ${allocationHtml}
              </div>
            `
          }
        },
        grid: {
          borderColor: '#333',
          strokeDashArray: 4,
          xaxis: {
            lines: {
              show: false
            }
          }
        },
        annotations: {
          yaxis: [{
            y: 0,
            strokeDashArray: 5,
            borderColor: '#666',
            label: {
              borderColor: '#666',
              style: {
                color: '#aaa',
                background: '#333'
              },
              text: 'Break-even'
            }
          }]
        }
      }
    })

    // Calculate time range based on timeframe
    const getTimeRange = () => {
      // Use BigInt throughout to avoid Number overflow (nanosecond timestamps exceed MAX_SAFE_INTEGER)
      const nowMs = BigInt(Date.now())
      const now = nowMs * BigInt(1_000_000) // Convert to nanoseconds as BigInt
      let startTime

      // One day in nanoseconds as BigInt
      const DAY_NS = BigInt(24) * BigInt(60) * BigInt(60) * BigInt(1000) * BigInt(1_000_000)

      switch (props.timeframe) {
        case 'OneWeek':
          startTime = now - (BigInt(7) * DAY_NS)
          break
        case 'OneMonth':
          startTime = now - (BigInt(30) * DAY_NS)
          break
        case 'OneYear':
          startTime = now - (BigInt(365) * DAY_NS)
          break
        case 'AllTime':
        default:
          // Use null to indicate "all time" - the canister will return all data
          // We'll use the first checkpoint's timestamp as the actual start
          startTime = null
      }

      return {
        startTime,
        endTime: now
      }
    }

    // Load performance data using the new getUserPerformanceGraphData API
    const loadPerformanceData = async () => {
      if (!props.principal) return

      loading.value = true
      error.value = ''
      checkpoints.value = []

      try {
        const rewardsActor = await tacoStore.createRewardsActorAnonymous()
        const { Principal } = await import('@dfinity/principal')

        const { startTime, endTime } = getTimeRange()
        // For canister call, use BigInt(0) when startTime is null (AllTime)
        const queryStartTime = startTime === null ? BigInt(0) : startTime

        // Use the new getUserPerformanceGraphData API which returns checkpoint data directly
        const graphResult = await rewardsActor.getUserPerformanceGraphData(
          Principal.fromText(props.principal),
          queryStartTime,
          endTime
        )

        if ('err' in graphResult) {
          error.value = formatError(graphResult.err)
          return
        }

        const graphData = graphResult.ok

        // Flatten checkpoints from all neurons into a single timeline
        const allCheckpoints = graphData.neuronData.flatMap(n => n.checkpoints)

        // Sort by timestamp (chronological order)
        allCheckpoints.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

        if (allCheckpoints.length === 0) {
          error.value = 'No checkpoint data available'
          return
        }

        checkpoints.value = allCheckpoints
        initialValue.value = allCheckpoints[0]?.totalPortfolioValue || 1

      } catch (err) {
        console.error('Error loading performance chart data:', err)
        const msg = err?.message || String(err)
        if (msg.includes('not found') || msg.includes('subnet')) {
          error.value = 'Performance data temporarily unavailable'
        } else {
          error.value = 'Failed to load chart data'
        }
      } finally {
        loading.value = false
      }
    }

    // Format error messages
    const formatError = (err) => {
      if ('NeuronNotFound' in err) return 'No performance data yet'
      if ('NotAuthorized' in err) return 'Not authorized'
      if ('SystemError' in err) return 'System temporarily unavailable'
      if ('AllocationDataMissing' in err) return 'Allocation data not available'
      if ('PriceDataMissing' in err) return 'Price data not available'
      if ('InvalidTimeRange' in err) return 'Invalid time range'
      return 'Failed to load data'
    }

    // Watch for prop changes and reload
    watch(
      () => [props.principal, props.priceType, props.timeframe],
      () => {
        loadPerformanceData()
      },
      { immediate: false }
    )

    // Load on mount
    onMounted(() => {
      loadPerformanceData()
    })

    return {
      loading,
      error,
      hasData,
      chartSeries,
      chartOptions
    }
  }
}
</script>

<style scoped>
.performance-chart {
  width: 100%;
  min-height: 100px;
}

.text-muted {
  color: #718096 !important;
}

.text-warning {
  color: #f6ad55 !important;
}
</style>
