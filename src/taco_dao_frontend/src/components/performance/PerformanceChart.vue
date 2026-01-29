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

    <!-- Chart with baseline selector -->
    <div v-else>
      <div class="d-flex align-items-center gap-2 mb-2">
        <label class="baseline-label text-muted">Start from:</label>
        <select
          v-model="baselineIndex"
          class="form-select form-select-sm baseline-select"
        >
          <option
            v-for="(opt, idx) in baselineOptions"
            :key="idx"
            :value="opt.index"
          >{{ opt.label }}</option>
        </select>
      </div>
      <apexchart
        type="area"
        :options="chartOptions"
        :series="chartSeries"
        :height="height"
      />
    </div>
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
    const baselineIndex = ref(0)

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

    // Baseline options for the dropdown - each checkpoint as a selectable start point
    const baselineOptions = computed(() => {
      return checkpoints.value.map((cp, idx) => {
        const date = new Date(Number(cp.timestamp) / 1_000_000)
        const label = idx === 0
          ? `${date.toLocaleDateString()} (First)`
          : date.toLocaleDateString()
        return { index: idx, label }
      })
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
    // Returns two series: USD and ICP, starting from the selected baseline checkpoint
    const chartSeries = computed(() => {
      if (!checkpoints.value.length) return []

      const bIdx = baselineIndex.value
      const baselineCp = checkpoints.value[bIdx]
      if (!baselineCp) return []

      const baseUSD = baselineCp.totalPortfolioValueUSD || 1
      const baseICP = baselineCp.totalPortfolioValueICP || 1

      // Only include checkpoints from the baseline onward
      const relevantCheckpoints = checkpoints.value.slice(bIdx)

      // Filter to skip consecutive ones with identical allocations
      const filteredCheckpoints = []
      let lastIncludedAllocation = null

      for (let i = 0; i < relevantCheckpoints.length; i++) {
        const cp = relevantCheckpoints[i]
        const originalIndex = bIdx + i
        const isFirst = i === 0
        const isLast = i === relevantCheckpoints.length - 1

        if (isFirst || isLast) {
          filteredCheckpoints.push({ checkpoint: cp, originalIndex })
          lastIncludedAllocation = cp.allocations
        } else {
          if (!allocationsEqual(cp.allocations, lastIncludedAllocation)) {
            filteredCheckpoints.push({ checkpoint: cp, originalIndex })
            lastIncludedAllocation = cp.allocations
          }
        }
      }

      const usdData = []
      const icpData = []

      for (const { checkpoint: cp, originalIndex } of filteredCheckpoints) {
        const timestampMs = Number(cp.timestamp) / 1_000_000
        const usdReturn = ((cp.totalPortfolioValueUSD / baseUSD) - 1) * 100
        const icpReturn = cp.totalPortfolioValueICP > 0
          ? ((cp.totalPortfolioValueICP / baseICP) - 1) * 100
          : null

        usdData.push({
          x: timestampMs,
          y: parseFloat(usdReturn.toFixed(2)),
          checkpointIndex: originalIndex
        })

        if (icpReturn !== null) {
          icpData.push({
            x: timestampMs,
            y: parseFloat(icpReturn.toFixed(2)),
            checkpointIndex: originalIndex
          })
        }
      }

      usdData.sort((a, b) => a.x - b.x)
      icpData.sort((a, b) => a.x - b.x)

      const series = [{ name: 'Return (USD)', data: usdData }]
      if (icpData.length > 0) {
        series.push({ name: 'Return (ICP)', data: icpData })
      }
      return series
    })

    // Chart options - dual series: USD (green/red) and ICP (blue)
    const chartOptions = computed(() => {
      const usdColor = '#68d391' // Green for USD
      const icpColor = '#63b3ed' // Blue for ICP

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
        colors: [usdColor, icpColor],
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.3,
            opacityTo: 0.05,
            stops: [0, 90, 100]
          }
        },
        dataLabels: {
          enabled: false
        },
        legend: {
          show: chartSeries.value.length > 1,
          position: 'top',
          horizontalAlign: 'left',
          labels: { colors: '#aaa' },
          markers: { width: 10, height: 10, radius: 2 }
        },
        markers: {
          size: 4,
          strokeColors: '#1a1a2e',
          strokeWidth: 2,
          hover: {
            size: 6
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
          shared: true,
          intersect: false,
          custom: function({ series, dataPointIndex, w }) {
            // Get timestamp from the first series' data point
            const dataPoint = w.config.series[0].data[dataPointIndex]
            if (!dataPoint) return ''
            const timestamp = dataPoint.x
            const date = new Date(timestamp)
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            // Get the checkpoint data for allocations
            const checkpointIndex = dataPoint.checkpointIndex
            const checkpoint = checkpoints.value[checkpointIndex]

            // Build returns HTML for both series
            let returnsHtml = ''
            for (let i = 0; i < w.config.series.length; i++) {
              const val = series[i]?.[dataPointIndex]
              if (val === undefined || val === null) continue
              const name = w.config.series[i].name
              const color = w.config.colors[i]
              const sign = val >= 0 ? '+' : ''
              returnsHtml += `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <span style="color:${color};font-size:12px;">${name}</span>
                <span style="font-weight:600;color:${color};">${sign}${val.toFixed(2)}%</span>
              </div>`
            }

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

            return `
              <div style="background:#1a1a2e;border:1px solid #333;border-radius:6px;padding:10px;min-width:160px;">
                <div style="color:#888;font-size:11px;margin-bottom:6px;">${dateStr}</div>
                ${returnsHtml}
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

    // Helper to get ICP/USD price from checkpoint's pricesUsed
    const getIcpUsdPrice = (cp) => {
      if (!cp.pricesUsed || cp.pricesUsed.length === 0) return null
      for (const [, priceInfo] of cp.pricesUsed) {
        if (priceInfo && priceInfo.usdPrice && priceInfo.icpPrice) {
          const icpPriceNum = Number(priceInfo.icpPrice)
          if (icpPriceNum > 0) {
            return priceInfo.usdPrice / (icpPriceNum / 1e8)
          }
        }
      }
      return null
    }

    // Load performance data using getUserPerformanceGraphData API
    // Always requests AllTime so the graph shows the full history
    // Passes priceType so backend selects the best neuron for that currency
    const loadPerformanceData = async () => {
      if (!props.principal) return

      loading.value = true
      error.value = ''
      checkpoints.value = []

      try {
        const rewardsActor = await tacoStore.createRewardsActorAnonymous()
        const { Principal } = await import('@dfinity/principal')

        const nowMs = BigInt(Date.now())
        const endTime = nowMs * BigInt(1_000_000) // nanoseconds
        const startTime = BigInt(0) // Always AllTime for the graph

        // Always use AllTime timeframe for graph, USD for best neuron selection
        const graphResult = await rewardsActor.getUserPerformanceGraphData(
          Principal.fromText(props.principal),
          startTime,
          endTime,
          { AllTime: null },
          { USD: null }
        )

        if ('err' in graphResult) {
          error.value = formatError(graphResult.err)
          return
        }

        const graphData = graphResult.ok

        // Backend returns at most 1 neuron - get its checkpoints directly
        const neuron = graphData.neuronData[0]
        if (!neuron || neuron.checkpoints.length === 0) {
          error.value = 'No checkpoint data available'
          return
        }

        // Process checkpoints - add ICP portfolio value
        const processedCheckpoints = neuron.checkpoints.map(cp => {
          const icpUsdPrice = getIcpUsdPrice(cp)
          return {
            ...cp,
            totalPortfolioValueUSD: cp.totalPortfolioValue,
            totalPortfolioValueICP: icpUsdPrice ? cp.totalPortfolioValue / icpUsdPrice : 0
          }
        })

        // Sort by timestamp and show all checkpoints (AllTime)
        processedCheckpoints.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

        if (processedCheckpoints.length === 0) {
          error.value = 'No checkpoint data available'
          return
        }

        checkpoints.value = processedCheckpoints
        // Reset baseline to first checkpoint when new data loads
        baselineIndex.value = 0

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

    // Watch for principal change and reload data
    watch(
      () => props.principal,
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
      baselineIndex,
      baselineOptions,
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

.baseline-label {
  font-size: 0.8rem;
  white-space: nowrap;
}

.baseline-select {
  max-width: 200px;
  background-color: #1a1a2e;
  color: #ccc;
  border-color: #444;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
}

.baseline-select:focus {
  background-color: #1a1a2e;
  color: #ccc;
  border-color: #63b3ed;
  box-shadow: 0 0 0 0.15rem rgba(99, 179, 237, 0.25);
}

.text-muted {
  color: #718096 !important;
}

.text-warning {
  color: #f6ad55 !important;
}
</style>
