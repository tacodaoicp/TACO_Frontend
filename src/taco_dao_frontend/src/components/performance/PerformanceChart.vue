<template>
  <div class="performance-chart">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm" role="status" style="color: var(--brown);">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2 chart-muted">Loading chart data...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-4">
      <i class="fas fa-exclamation-triangle me-2" style="color: var(--dark-orange);"></i>
      <span class="chart-muted">{{ error }}</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasData" class="text-center py-4">
      <i class="fas fa-chart-area chart-muted me-2"></i>
      <span class="chart-muted">No performance history available</span>
    </div>

    <!-- Chart with baseline selector -->
    <div v-else>
      <div class="d-flex align-items-center gap-2 mb-2">
        <label class="baseline-label chart-muted">Start from:</label>
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
    },
  },

  setup(props) {
    const tacoStore = useTacoStore()
    const { fetchedTokenDetails } = storeToRefs(tacoStore)

    const loading = ref(false)
    const error = ref('')
    const usdCheckpoints = ref([])
    const icpCheckpoints = ref([])
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
      return usdCheckpoints.value.length > 0 || icpCheckpoints.value.length > 0
    })

    // Baseline options for the dropdown - use USD checkpoints (primary series)
    const baselineOptions = computed(() => {
      const cps = usdCheckpoints.value.length > 0 ? usdCheckpoints.value : icpCheckpoints.value
      return cps.map((cp, idx) => {
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

    // Helper: filter checkpoints, skip consecutive identical allocations, compute returns from baseline
    const buildSeriesData = (checkpointsArr, baselineIdx, valueKey) => {
      if (!checkpointsArr.length) return []

      const bIdx = Math.min(baselineIdx, checkpointsArr.length - 1)
      const baselineCp = checkpointsArr[bIdx]
      if (!baselineCp) return []

      const baseVal = baselineCp[valueKey] || 1
      const relevant = checkpointsArr.slice(bIdx)

      const filtered = []
      let lastAlloc = null

      for (let i = 0; i < relevant.length; i++) {
        const cp = relevant[i]
        const origIdx = bIdx + i
        const isFirst = i === 0
        const isLast = i === relevant.length - 1

        if (isFirst || isLast) {
          filtered.push({ cp, origIdx })
          lastAlloc = cp.allocations
        } else if (!allocationsEqual(cp.allocations, lastAlloc)) {
          filtered.push({ cp, origIdx })
          lastAlloc = cp.allocations
        }
      }

      const data = []
      for (const { cp, origIdx } of filtered) {
        const val = cp[valueKey]
        if (val == null || val <= 0) continue
        const ret = ((val / baseVal) - 1) * 100
        data.push({
          x: Number(cp.timestamp) / 1_000_000,
          y: parseFloat(ret.toFixed(2)),
          checkpointIndex: origIdx
        })
      }
      data.sort((a, b) => a.x - b.x)
      return data
    }

    // Process checkpoints into chart series data
    // USD line uses best-USD neuron checkpoints, ICP line uses best-ICP neuron checkpoints
    const chartSeries = computed(() => {
      const bIdx = baselineIndex.value

      const usdData = buildSeriesData(usdCheckpoints.value, bIdx, 'totalPortfolioValueUSD')
      const icpData = buildSeriesData(icpCheckpoints.value, bIdx, 'totalPortfolioValueICP')

      const series = []
      if (usdData.length > 0) {
        series.push({ name: 'Return (USD)', data: usdData })
      }
      if (icpData.length > 0) {
        series.push({ name: 'Return (ICP)', data: icpData })
      }
      return series
    })

    // Chart options - dual series: USD (green/red) and ICP (blue)
    const chartOptions = computed(() => {
      const usdColor = '#FEC800' // Yellow/Gold for USD
      const icpColor = '#7CDC86' // Light green for ICP

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
          labels: { colors: '#fff' },
          markers: { width: 10, height: 10, radius: 2 }
        },
        markers: {
          size: 4,
          strokeColors: '#934A17',
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
              colors: '#FEEAC1'
            }
          },
          axisBorder: {
            color: '#DA8D28'
          },
          axisTicks: {
            color: '#DA8D28'
          }
        },
        yaxis: {
          labels: {
            formatter: (val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`,
            style: {
              colors: '#FEEAC1'
            }
          }
        },
        tooltip: {
          theme: 'dark',
          shared: true,
          intersect: false,
          custom: function({ seriesIndex, dataPointIndex, w }) {
            // Determine if data point is in the left or right half of the chart
            const totalPoints = Math.max(...w.config.series.map(s => s.data?.length || 0), 1)
            const isLeftHalf = dataPointIndex < totalPoints / 2
            // Get the hovered timestamp from whichever series the user is hovering
            // seriesIndex may be -1 when shared tooltip triggers, so try each series
            let timestamp = null
            if (seriesIndex >= 0 && w.config.series[seriesIndex]?.data?.[dataPointIndex]) {
              timestamp = w.config.series[seriesIndex].data[dataPointIndex].x
            } else {
              // Fallback: try series 0, then series 1
              for (let s = 0; s < w.config.series.length; s++) {
                const dp = w.config.series[s]?.data?.[dataPointIndex]
                if (dp) {
                  timestamp = dp.x
                  break
                }
              }
            }
            if (timestamp === null) return ''
            const date = new Date(timestamp)
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            // For each series, find the closest data point by timestamp
            // (series may have different data points from different neurons)
            const findClosestPoint = (seriesData, ts) => {
              if (!seriesData || seriesData.length === 0) return null
              let closest = seriesData[0]
              let closestDiff = Math.abs(closest.x - ts)
              for (const pt of seriesData) {
                const diff = Math.abs(pt.x - ts)
                if (diff < closestDiff) {
                  closest = pt
                  closestDiff = diff
                }
              }
              return closest
            }

            // Build returns HTML for both series and track which has the best return
            let returnsHtml = ''
            let bestReturnVal = -Infinity
            let bestSeriesIdx = -1
            for (let i = 0; i < w.config.series.length; i++) {
              const pt = findClosestPoint(w.config.series[i].data, timestamp)
              if (!pt) continue
              const val = pt.y
              if (val === undefined || val === null) continue
              const name = w.config.series[i].name
              const color = w.config.colors[i]
              const sign = val >= 0 ? '+' : ''
              returnsHtml += `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <span style="color:${color};font-size:12px;">${name}</span>
                <span style="font-weight:600;color:${color};">${sign}${val.toFixed(2)}%</span>
              </div>`
              if (val > bestReturnVal) {
                bestReturnVal = val
                bestSeriesIdx = i
              }
            }

            // Show allocation from whichever neuron (USD or ICP) has the better return
            const findClosestCheckpoint = (cps, ts) => {
              if (!cps || cps.length === 0) return null
              let closest = cps[0]
              let closestDiff = Math.abs(Number(closest.timestamp) / 1_000_000 - ts)
              for (const cp of cps) {
                const diff = Math.abs(Number(cp.timestamp) / 1_000_000 - ts)
                if (diff < closestDiff) {
                  closest = cp
                  closestDiff = diff
                }
              }
              return closest
            }

            // Pick allocation from the neuron with the better return at this point
            let checkpoint = null
            const usdIsFirst = w.config.series[0]?.name?.includes('USD')
            if (bestSeriesIdx === 0) {
              checkpoint = findClosestCheckpoint(usdIsFirst ? usdCheckpoints.value : icpCheckpoints.value, timestamp)
            } else if (bestSeriesIdx === 1) {
              checkpoint = findClosestCheckpoint(usdIsFirst ? icpCheckpoints.value : usdCheckpoints.value, timestamp)
            }

            // Find next checkpoint for price change calculation
            const currentIndex = usdCheckpoints.value.findIndex(cp =>
              Math.abs(Number(cp.timestamp) / 1_000_000 - timestamp) < 1000
            )
            const nextCheckpoint = currentIndex >= 0 && currentIndex < usdCheckpoints.value.length - 1
              ? usdCheckpoints.value[currentIndex + 1]
              : null

            // Helper to get USD price from pricesUsed array
            const getPriceUsd = (cp, tokenPrincipal) => {
              if (!cp?.pricesUsed) return null
              const priceEntry = cp.pricesUsed.find(([p, _]) =>
                p.toString() === tokenPrincipal.toString()
              )
              return priceEntry ? priceEntry[1].usdPrice : null
            }

            // Build allocation HTML with price changes
            let allocationHtml = ''
            if (checkpoint?.allocations && checkpoint.allocations.length > 0) {
              const nonZeroAllocations = checkpoint.allocations
                .filter(alloc => Number(alloc.basisPoints) > 0)
                .map(alloc => {
                  const symbol = getTokenSymbol(alloc.token)
                  const percent = (Number(alloc.basisPoints) / 100).toFixed(1)

                  // Calculate price change to next checkpoint
                  let priceChangeHtml = ''
                  if (nextCheckpoint) {
                    const currentPrice = getPriceUsd(checkpoint, alloc.token)
                    const nextPrice = getPriceUsd(nextCheckpoint, alloc.token)
                    if (currentPrice && nextPrice && currentPrice > 0) {
                      const change = ((nextPrice - currentPrice) / currentPrice) * 100
                      const sign = change >= 0 ? '+' : ''
                      const color = change >= 0 ? '#4CAF50' : '#FF5252'
                      const emoji = change >= 0 ? '📈' : '📉'
                      priceChangeHtml = `<span style="color:${color};font-size:10px;margin-left:4px;">${emoji}${sign}${change.toFixed(1)}%</span>`
                    }
                  }

                  return `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
                    <span style="color:#FEEAC1;">${symbol}</span>
                    <span style="display:flex;align-items:center;gap:4px;">
                      <span style="color:#fff;">${percent}%</span>
                      ${priceChangeHtml}
                    </span>
                  </div>`
                })

              if (nonZeroAllocations.length > 0) {
                allocationHtml = `
                  <div style="border-top:1px solid #DA8D28;margin-top:8px;padding-top:8px;">
                    <div style="color:#FEEAC1;font-size:11px;margin-bottom:4px;">Allocation:</div>
                    ${nonZeroAllocations.join('')}
                  </div>
                `
              }
            }

            // Build note HTML
            let noteHtml = ''
            if (checkpoint?.reason && checkpoint.reason.length > 0 && checkpoint.reason[0]) {
              noteHtml = `
                <div style="border-top:1px solid #DA8D28;margin-top:8px;padding-top:8px;">
                  <div style="color:#FEEAC1;font-size:11px;margin-bottom:4px;">Note:</div>
                  <div style="color:#fff;font-size:11px;word-break:break-word;">${checkpoint.reason[0]}</div>
                </div>
              `
            }

            // Reposition tooltip to opposite side of cursor after render
            setTimeout(() => {
              const chartEl = w.globals.dom.baseEl
              if (!chartEl) return
              const tooltipEl = chartEl.querySelector('.apexcharts-tooltip')
              if (!tooltipEl) return
              const chartRect = chartEl.getBoundingClientRect()
              const tooltipWidth = tooltipEl.offsetWidth
              if (isLeftHalf) {
                // Point is on left, show tooltip on right
                tooltipEl.style.left = (chartRect.width - tooltipWidth - 10) + 'px'
              } else {
                // Point is on right, show tooltip on left
                tooltipEl.style.left = '10px'
              }
              tooltipEl.style.top = '0px'
            }, 0)

            return `
              <div style="background:#512100;border:1px solid #DA8D28;border-radius:6px;padding:10px;min-width:210px;color:#fff;">
                <div style="color:#FEEAC1;font-size:11px;margin-bottom:6px;">${dateStr}</div>
                ${returnsHtml}
                ${allocationHtml}
                ${noteHtml}
              </div>
            `
          }
        },
        grid: {
          borderColor: '#DA8D28',
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
            borderColor: '#934A17',
            label: {
              borderColor: '#934A17',
              style: {
                color: '#fff',
                background: '#512100'
              },
              text: 'Break-even'
            }
          }]
        }
      }
    })

    // Load performance data using getUserPerformanceGraphData API
    // Always requests AllTime so the graph shows the full history
    // Backend returns best USD neuron, best ICP neuron, and allocation neuron ID
    const loadPerformanceData = async () => {
      if (!props.principal) return

      loading.value = true
      error.value = ''
      usdCheckpoints.value = []
      icpCheckpoints.value = []

      try {
        const rewardsActor = await tacoStore.createRewardsActorAnonymous()
        const { Principal } = await import('@dfinity/principal')

        const nowMs = BigInt(Date.now())
        const endTime = nowMs * BigInt(1_000_000) // nanoseconds
        const startTime = BigInt(0) // Always AllTime for the graph

        const graphResult = await rewardsActor.getUserPerformanceGraphData(
          Principal.fromText(props.principal),
          startTime,
          endTime,
          { AllTime: null }
        )

        if ('err' in graphResult) {
          error.value = formatError(graphResult.err)
          return
        }

        const graphData = graphResult.ok

        // Process helper: map checkpoints to include both USD and ICP values
        const processCheckpoints = (neuron) => {
          if (!neuron || !neuron.checkpoints || neuron.checkpoints.length === 0) return []
          const cps = neuron.checkpoints.map(cp => ({
            ...cp,
            totalPortfolioValueUSD: cp.totalPortfolioValue,
            totalPortfolioValueICP: cp.totalPortfolioValueICP || cp.totalPortfolioValue
          }))
          cps.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
          return cps
        }

        // Select the longest neuron (most checkpoints), tiebreaker: best ICP performance
        const allNeurons = graphData.neurons || []
        let selectedNeuron = null
        if (allNeurons.length > 0) {
          selectedNeuron = allNeurons.reduce((best, curr) => {
            const bestLen = best.checkpoints?.length ?? 0
            const currLen = curr.checkpoints?.length ?? 0
            if (currLen > bestLen) return curr
            if (currLen === bestLen) {
              // Tiebreaker: better ICP performance
              const bestIcp = best.performanceScoreICP?.[0] ?? -Infinity
              const currIcp = curr.performanceScoreICP?.[0] ?? -Infinity
              return currIcp > bestIcp ? curr : best
            }
            return best
          })
        }

        // Use same neuron for both USD and ICP chart lines
        const cps = processCheckpoints(selectedNeuron)
        if (cps.length === 0) {
          error.value = 'No checkpoint data available'
          return
        }

        // Both chart lines use same checkpoints (different Y values: USD vs ICP)
        usdCheckpoints.value = cps
        icpCheckpoints.value = cps

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
  position: relative;
}

/* Allow tooltip to overflow the chart container */
.performance-chart :deep(.apexcharts-tooltip) {
  overflow: visible !important;
}

.performance-chart :deep(.apexcharts-canvas),
.performance-chart :deep(.apexcharts-svg),
.performance-chart :deep(.apexcharts-inner) {
  overflow: visible !important;
}

.baseline-label {
  font-size: 0.8rem;
  white-space: nowrap;
}

.baseline-select {
  max-width: 200px;
  background-color: var(--dark-brown);
  color: #fff;
  border-color: var(--dark-orange);
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  font-family: 'Space Mono', monospace;
}

.baseline-select:focus {
  background-color: var(--dark-brown);
  color: #fff;
  border-color: var(--brown);
  box-shadow: 0 0 0 0.15rem rgba(147, 74, 23, 0.35);
}

.chart-muted {
  color: var(--dark-brown-to-white);
}
</style>
