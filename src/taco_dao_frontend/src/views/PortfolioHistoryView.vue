<template>
  <div class="portfolio-history-view">
    <div class="container-fluid mt-4">
      <div class="row">
        <div class="col-12">
          <TacoTitle 
            title="Portfolio History" 
            subtitle="View OHLC candlestick charts of portfolio value over time"
            emoji="📊"
          />
          
          <!-- Quick Navigation -->
          <div class="mb-4">
            <div class="d-flex gap-3">
              <router-link to="/admin" class="btn btn-secondary">
                ← Back to Admin Panel
              </router-link>
              <router-link to="/admin/archives" class="btn btn-info">
                📦 Archive Management
              </router-link>
              <router-link to="/admin/pricehistory" class="btn btn-info">
                💰 Price History
              </router-link>
            </div>
          </div>
          
          <!-- Time Range and Interval Controls -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">📅 Time Range & Interval Settings</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <!-- Start Date -->
                <div class="col-md-3">
                  <label for="startDate" class="form-label">Start Date</label>
                  <input 
                    type="datetime-local" 
                    id="startDate"
                    class="form-control bg-dark text-white border-secondary" 
                    v-model="startDate"
                    :max="endDate">
                </div>
                
                <!-- End Date -->
                <div class="col-md-3">
                  <label for="endDate" class="form-label">End Date</label>
                  <input 
                    type="datetime-local" 
                    id="endDate"
                    class="form-control bg-dark text-white border-secondary" 
                    v-model="endDate"
                    :min="startDate">
                </div>
                
                <!-- Interval Unit -->
                <div class="col-md-2">
                  <label for="intervalUnit" class="form-label">Interval Unit</label>
                  <select 
                    id="intervalUnit"
                    class="form-select bg-dark text-white border-secondary" 
                    v-model="intervalUnit">
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                
                <!-- Interval Value -->
                <div class="col-md-2">
                  <label for="intervalValue" class="form-label">Interval</label>
                  <input 
                    type="number" 
                    id="intervalValue"
                    class="form-control bg-dark text-white border-secondary" 
                    v-model.number="intervalValue"
                    min="1"
                    :placeholder="getIntervalPlaceholder()">
                </div>
                
                <!-- Load Button -->
                <div class="col-md-2 d-flex align-items-end">
                  <button 
                    class="btn btn-primary w-100" 
                    @click="loadOHLCData"
                    :disabled="loading || !isValidDateRange()">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Loading...' : '📊 Load Chart' }}
                  </button>
                </div>
              </div>
              
              <!-- Quick Time Range Buttons -->
              <div class="row mt-3">
                <div class="col-12">
                  <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-light" @click="setQuickRange('1d', 'hours', 1)">
                      Last 24 Hours
                    </button>
                    <button class="btn btn-sm btn-outline-light" @click="setQuickRange('7d', 'hours', 6)">
                      Last 7 Days (6h intervals)
                    </button>
                    <button class="btn btn-sm btn-outline-light" @click="setQuickRange('30d', 'days', 1)">
                      Last 30 Days (daily)
                    </button>
                    <button class="btn btn-sm btn-outline-light" @click="setQuickRange('90d', 'days', 3)">
                      Last 90 Days (3-day intervals)
                    </button>
                    <button class="btn btn-sm btn-outline-light" @click="setQuickRange('1y', 'weeks', 1)">
                      Last Year (weekly)
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Data Info -->
              <div class="row mt-3" v-if="ohlcData.length > 0">
                <div class="col-12">
                  <div class="alert alert-info">
                    <strong>📈 Data Loaded:</strong> {{ ohlcData.length }} candles | 
                    <strong>Period:</strong> {{ formatDate(startDate) }} to {{ formatDate(endDate) }} | 
                    <strong>Interval:</strong> {{ intervalValue }} {{ intervalUnit }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- OHLC Candlestick Chart -->
          <div class="card bg-dark text-white mb-4" v-if="ohlcData.length > 0">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
                <button 
                  class="btn btn-sm btn-outline-light"
                  @click="chartCollapsed = !chartCollapsed"
                  :title="chartCollapsed ? 'Expand Chart' : 'Collapse Chart'">
                  {{ chartCollapsed ? '▶' : '▼' }}
                </button>
                <h3 class="mb-0">📊 Portfolio Value OHLC Chart</h3>
              </div>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-sm btn-outline-light" 
                  :class="{ active: valueType === 'usd' }"
                  @click="valueType = 'usd'">
                  💵 USD
                </button>
                <button 
                  class="btn btn-sm btn-outline-light" 
                  :class="{ active: valueType === 'icp' }"
                  @click="valueType = 'icp'">
                  🪙 ICP
                </button>
              </div>
            </div>
            <div class="card-body" v-show="!chartCollapsed">
              <div class="chart-container">
                <apexchart 
                  type="candlestick" 
                  :options="candlestickOptions" 
                  :series="candlestickSeries" 
                  height="500">
                </apexchart>
              </div>
            </div>
          </div>

          <!-- Portfolio Statistics -->
          <div class="card bg-dark text-white mb-4" v-if="ohlcData.length > 0">
            <div class="card-header">
              <h3 class="mb-0">📊 Portfolio Statistics</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Period High</h6>
                    <div class="stat-value">
                      {{ formatValue(stats.high) }}
                      <small class="text-muted">{{ valueType.toUpperCase() }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Period Low</h6>
                    <div class="stat-value">
                      {{ formatValue(stats.low) }}
                      <small class="text-muted">{{ valueType.toUpperCase() }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Latest Value</h6>
                    <div class="stat-value">
                      {{ formatValue(stats.latest) }}
                      <small class="text-muted">{{ valueType.toUpperCase() }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Period Change</h6>
                    <div class="stat-value" :class="stats.change >= 0 ? 'text-success' : 'text-danger'">
                      {{ stats.change >= 0 ? '+' : '' }}{{ stats.change.toFixed(2) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div class="card bg-danger text-white mb-4" v-if="errorMessage">
            <div class="card-header">
              <h3 class="mb-0">❌ Error</h3>
            </div>
            <div class="card-body">
              <p>{{ errorMessage }}</p>
              <button class="btn btn-outline-light" @click="errorMessage = ''">
                Clear Error
              </button>
            </div>
          </div>

          <!-- No Data Message -->
          <div class="card bg-dark text-white mb-4" v-if="!loading && ohlcData.length === 0 && !errorMessage">
            <div class="card-body text-center py-5">
              <i class="fas fa-chart-line fa-3x mb-3 text-muted"></i>
              <h4>No Data Available</h4>
              <p class="text-muted">
                Select a time range and interval, then click "Load Chart" to view portfolio OHLC data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { createActor } from '../../../declarations/portfolio_archive'
import { Principal } from '@dfinity/principal'

// Store
const store = useTacoStore()

// Reactive data
const loading = ref(false)
const errorMessage = ref('')
const chartCollapsed = ref(false)
const valueType = ref('usd') // 'usd' or 'icp'

// Date and interval controls
const startDate = ref('')
const endDate = ref('')
const intervalUnit = ref('hours')
const intervalValue = ref(1)

// OHLC data
const ohlcData = ref([])

// Initialize dates to last 24 hours
onMounted(() => {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  endDate.value = formatDateForInput(now)
  startDate.value = formatDateForInput(yesterday)
})

// Helper functions
const formatDateForInput = (date) => {
  return date.toISOString().slice(0, 16) // Format for datetime-local input
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const isValidDateRange = () => {
  return startDate.value && endDate.value && new Date(startDate.value) < new Date(endDate.value)
}

const getIntervalPlaceholder = () => {
  const examples = {
    minutes: 'e.g., 15',
    hours: 'e.g., 1',
    days: 'e.g., 1',
    weeks: 'e.g., 1',
    months: 'e.g., 1',
    years: 'e.g., 1'
  }
  return examples[intervalUnit.value] || '1'
}

// Convert interval to nanoseconds
const getIntervalNS = () => {
  const multipliers = {
    minutes: 60 * 1000000000,
    hours: 60 * 60 * 1000000000,
    days: 24 * 60 * 60 * 1000000000,
    weeks: 7 * 24 * 60 * 60 * 1000000000,
    months: 30 * 24 * 60 * 60 * 1000000000, // Approximate
    years: 365 * 24 * 60 * 60 * 1000000000 // Approximate
  }
  return intervalValue.value * multipliers[intervalUnit.value]
}

// Quick range setters
const setQuickRange = (period, unit, value) => {
  const now = new Date()
  let start = new Date()
  
  switch (period) {
    case '1d':
      start.setDate(now.getDate() - 1)
      break
    case '7d':
      start.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 90)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 1)
      break
  }
  
  startDate.value = formatDateForInput(start)
  endDate.value = formatDateForInput(now)
  intervalUnit.value = unit
  intervalValue.value = value
}

// Portfolio archive canister access
const getPortfolioArchiveActor = () => {
  const canisterId = store.portfolioArchiveCanisterId()
  return createActor(canisterId, {
    agentOptions: {
      identity: store.identity,
      host: store.host
    }
  })
}

// Load OHLC data
const loadOHLCData = async () => {
  if (!isValidDateRange()) {
    errorMessage.value = 'Please select a valid date range'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const portfolioArchive = getPortfolioArchiveActor()
    
    // Convert dates to nanoseconds (timestamps)
    const startTimeNS = BigInt(new Date(startDate.value).getTime()) * BigInt(1000000)
    const endTimeNS = BigInt(new Date(endDate.value).getTime()) * BigInt(1000000)
    const intervalNS = BigInt(getIntervalNS())
    
    console.log('Loading OHLC data:', {
      startTime: startTimeNS.toString(),
      endTime: endTimeNS.toString(),
      intervalNS: intervalNS.toString()
    })
    
    const result = await portfolioArchive.getOHLCCandles(
      startTimeNS,
      endTimeNS,
      intervalNS
    )
    
    if ('ok' in result) {
      ohlcData.value = result.ok
      console.log('OHLC data loaded:', ohlcData.value.length, 'candles')
    } else {
      throw new Error('Archive error: ' + JSON.stringify(result.err))
    }
    
  } catch (error) {
    console.error('Error loading OHLC data:', error)
    errorMessage.value = 'Failed to load OHLC data: ' + error.message
  } finally {
    loading.value = false
  }
}

// Format values for display
const formatValue = (value) => {
  if (typeof value === 'bigint') {
    value = Number(value)
  }
  
  if (valueType.value === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  } else {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(value)
  }
}

// Chart data and options
const candlestickSeries = computed(() => {
  if (!ohlcData.value.length) return []
  
  const data = ohlcData.value.map(candle => {
    const timestamp = Number(candle.timestamp) / 1000000 // Convert from nanoseconds to milliseconds
    const ohlc = valueType.value === 'usd' ? candle.usdOHLC : candle.icpOHLC
    
    return {
      x: timestamp,
      y: [
        Number(ohlc.open) / (valueType.value === 'icp' ? 100000000 : 1), // Convert ICP from e8s
        Number(ohlc.high) / (valueType.value === 'icp' ? 100000000 : 1),
        Number(ohlc.low) / (valueType.value === 'icp' ? 100000000 : 1),
        Number(ohlc.close) / (valueType.value === 'icp' ? 100000000 : 1)
      ]
    }
  })
  
  return [{
    name: `Portfolio Value (${valueType.value.toUpperCase()})`,
    data: data
  }]
})

const candlestickOptions = computed(() => ({
  chart: {
    type: 'candlestick',
    background: 'transparent',
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true
      }
    }
  },
  theme: {
    mode: 'dark'
  },
  title: {
    text: `Portfolio Value OHLC - ${valueType.value.toUpperCase()}`,
    style: {
      color: '#ffffff'
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      style: {
        colors: '#ffffff'
      }
    }
  },
  yaxis: {
    title: {
      text: `Value (${valueType.value.toUpperCase()})`,
      style: {
        color: '#ffffff'
      }
    },
    labels: {
      style: {
        colors: '#ffffff'
      },
      formatter: (value) => {
        if (valueType.value === 'usd') {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact'
          }).format(value)
        } else {
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            notation: 'compact'
          }).format(value) + ' ICP'
        }
      }
    }
  },
  plotOptions: {
    candlestick: {
      colors: {
        upward: '#00E396',
        downward: '#FEB019'
      }
    }
  },
  tooltip: {
    theme: 'dark'
  },
  grid: {
    borderColor: '#40475D'
  }
}))

// Statistics
const stats = computed(() => {
  if (!ohlcData.value.length) {
    return { high: 0, low: 0, latest: 0, change: 0 }
  }
  
  const values = ohlcData.value.map(candle => {
    const ohlc = valueType.value === 'usd' ? candle.usdOHLC : candle.icpOHLC
    return {
      high: Number(ohlc.high) / (valueType.value === 'icp' ? 100000000 : 1),
      low: Number(ohlc.low) / (valueType.value === 'icp' ? 100000000 : 1),
      open: Number(ohlc.open) / (valueType.value === 'icp' ? 100000000 : 1),
      close: Number(ohlc.close) / (valueType.value === 'icp' ? 100000000 : 1)
    }
  })
  
  const high = Math.max(...values.map(v => v.high))
  const low = Math.min(...values.map(v => v.low))
  const latest = values[values.length - 1]?.close || 0
  const first = values[0]?.open || 0
  const change = first ? ((latest - first) / first) * 100 : 0
  
  return { high, low, latest, change }
})
</script>

<style scoped>
.portfolio-history-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-card h6 {
  color: #adb5bd;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #ffffff;
}

.chart-container {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1rem;
}

.btn.active {
  background-color: #0d6efd !important;
  border-color: #0d6efd !important;
}

/* ApexCharts dark theme overrides */
:deep(.apexcharts-text) {
  fill: white !important;
}

:deep(.apexcharts-title-text) {
  fill: white !important;
}

:deep(.apexcharts-legend-text) {
  color: white !important;
}

:deep(.apexcharts-tooltip) {
  background: #343a40 !important;
  border: 1px solid #6c757d !important;
}
</style>
