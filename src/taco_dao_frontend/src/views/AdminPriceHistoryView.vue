<template>
  <div class="admin-price-history-view">
    <HeaderBar />
    
    <div class="container-fluid mt-4">
      <div class="row">
        <div class="col-12">
          <TacoTitle 
            title="Price History" 
            subtitle="View historical price data for treasury tokens" 
          />
          
          <!-- Quick Navigation -->
          <div class="mb-4">
            <div class="d-flex gap-3">
              <router-link to="/admin" class="btn btn-secondary">
                ← Back to Admin Panel
              </router-link>
              <router-link to="/admin/price" class="btn btn-info">
                🚨 Price Management
              </router-link>
              <router-link to="/admin/trade" class="btn btn-info">
                📈 Trading Logs
              </router-link>
            </div>
          </div>
          
          <!-- Token Selection -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Select Token</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <select 
                    class="form-select" 
                    v-model="selectedTokenPrincipal" 
                    @change="loadPriceHistory">
                    <option value="">Choose a token...</option>
                    <option value="PORTFOLIO">📊 Portfolio - Total Value</option>
                    <option 
                      v-for="[principal, details] in availableTokens" 
                      :key="principal.toString()" 
                      :value="principal.toString()">
                      {{ details.tokenSymbol }} - {{ details.tokenName }}
                    </option>
                  </select>
                </div>
                <div class="col-md-3">
                  <select class="form-select" v-model="priceUnit" @change="updateChart">
                    <option value="icp">Price in ICP</option>
                    <option value="usd">Price in USD</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <button 
                    class="btn btn-primary" 
                    @click="loadPriceHistory" 
                    :disabled="!selectedTokenPrincipal || loading">
                    🔄 Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Price Chart -->
          <div class="card bg-dark text-white mb-4" v-if="selectedTokenPrincipal">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
                <button 
                  class="btn btn-sm btn-outline-light"
                  @click="chartCollapsed = !chartCollapsed"
                  :title="chartCollapsed ? 'Expand Chart' : 'Collapse Chart'">
                  {{ chartCollapsed ? '▶' : '▼' }}
                </button>
                <h3 class="mb-0">
                  {{ selectedTokenSymbol }} Price History
                  <span class="badge bg-secondary ms-2">{{ priceUnit.toUpperCase() }}</span>
                </h3>
                <div v-if="!chartCollapsed && priceData.length" class="badge bg-info">
                  Range: {{ chartRangePercent }}%
                </div>
              </div>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-sm btn-outline-light" 
                  :class="{ active: timeRange === '24h' }"
                  @click="setTimeRange('24h')">
                  24H
                </button>
                <button 
                  class="btn btn-sm btn-outline-light" 
                  :class="{ active: timeRange === '7d' }"
                  @click="setTimeRange('7d')">
                  7D
                </button>
                <button 
                  class="btn btn-sm btn-outline-light" 
                  :class="{ active: timeRange === '30d' }"
                  @click="setTimeRange('30d')">
                  30D
                </button>
                <button 
                  class="btn btn-sm btn-outline-light" 
                  :class="{ active: timeRange === 'all' }"
                  @click="setTimeRange('all')">
                  ALL
                </button>
              </div>
            </div>
            
            <div class="card-body" v-show="!chartCollapsed">
              <div v-if="loading" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading price data...</span>
                </div>
                <p class="mt-2">Loading price history...</p>
              </div>
              
              <div v-else-if="!priceData.length" class="text-center text-muted">
                <p>No price history available for this token</p>
              </div>
              
              <div v-else class="chart-container">
                <canvas 
                  ref="chartCanvas" 
                  :key="chartKey"
                  @mousemove="handleMouseMove"
                  @mouseleave="handleMouseLeave">
                </canvas>
                <div v-if="hoveredPoint" class="chart-tooltip" :style="tooltipStyle">
                  <div><strong>{{ hoveredPoint.date }}</strong></div>
                  <div>{{ hoveredPoint.price }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Price Statistics -->
          <div class="card bg-dark text-white mb-4" v-if="selectedTokenPrincipal && priceData.length">
            <div class="card-header">
              <h3 class="mb-0">Price Statistics</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Current Price</h6>
                    <div class="stat-value">
                      {{ formatPrice(currentPrice) }}
                      <small class="text-muted">{{ priceUnit.toUpperCase() }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>24h High</h6>
                    <div class="stat-value">
                      {{ formatPrice(stats.high24h) }}
                      <small class="text-muted">{{ priceUnit.toUpperCase() }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>24h Low</h6>
                    <div class="stat-value">
                      {{ formatPrice(stats.low24h) }}
                      <small class="text-muted">{{ priceUnit.toUpperCase() }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>24h Change</h6>
                    <div class="stat-value" :class="stats.change24h >= 0 ? 'text-success' : 'text-danger'">
                      {{ stats.change24h >= 0 ? '+' : '' }}{{ stats.change24h.toFixed(2) }}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>All-Time High</h6>
                    <div class="stat-value">
                      {{ formatPrice(stats.allTimeHigh) }}
                      <small class="text-muted">{{ priceUnit.toUpperCase() }}</small>
                    </div>
                    <small class="text-muted">{{ formatDate(stats.allTimeHighDate) }}</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>All-Time Low</h6>
                    <div class="stat-value">
                      {{ formatPrice(stats.allTimeLow) }}
                      <small class="text-muted">{{ priceUnit.toUpperCase() }}</small>
                    </div>
                    <small class="text-muted">{{ formatDate(stats.allTimeLowDate) }}</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Average Price</h6>
                    <div class="stat-value">
                      {{ formatPrice(stats.averagePrice) }}
                      <small class="text-muted">{{ priceUnit.toUpperCase() }}</small>
                    </div>
                    <small class="text-muted">{{ timeRange.toUpperCase() }} period</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h6>Data Points</h6>
                    <div class="stat-value">
                      {{ filteredPriceData.length }}
                      <small class="text-muted">entries</small>
                    </div>
                    <small class="text-muted">{{ timeRange.toUpperCase() }} period</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import { Principal } from '@dfinity/principal'

// Store
const store = useTacoStore()

// State
const selectedTokenPrincipal = ref<string>('')
const selectedTokenSymbol = ref<string>('')
const priceUnit = ref<'icp' | 'usd'>('usd')
const timeRange = ref<'24h' | '7d' | '30d' | 'all'>('24h')
const loading = ref(false)
const priceData = ref<any[]>([])
const availableTokens = ref<any[]>([])
const chartKey = ref(0)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const hoveredPoint = ref<any>(null)
const tooltipStyle = ref<any>({})
const chartCollapsed = ref(false)

// Methods
const loadAvailableTokens = async () => {
  try {
    await store.fetchTokenDetails()
    const tokenDetails = store.fetchedTokenDetails || []
    availableTokens.value = tokenDetails.filter(([_, details]: any) => 
      details.Active && !details.isPaused
    )
  } catch (error) {
    console.error('Failed to load available tokens:', error)
  }
}

const loadPriceHistory = async () => {
  if (!selectedTokenPrincipal.value) return
  
  loading.value = true
  try {
    if (selectedTokenPrincipal.value === 'PORTFOLIO') {
      // Load portfolio history from DAO
      const portfolioHistory = await store.getPortfolioHistory(2000) as any[]
      
      // Convert portfolio history to price data format
      priceData.value = portfolioHistory.map(([timestamp, balanceAllocation]: any) => ({
        time: timestamp,
        icpPrice: balanceAllocation.totalWorthInICP,
        usdPrice: balanceAllocation.totalWorthInUSD
      })).reverse() // Reverse to get chronological order (oldest first)
      
      selectedTokenSymbol.value = 'Portfolio'
      
      // Draw chart after data is loaded
      nextTick(() => {
        drawChart()
      })
    } else {
      // Load individual token price history
      const principal = Principal.fromText(selectedTokenPrincipal.value)
      const result = await store.getTokenPriceHistory([principal])
      
      if (result && result.length > 0) {
        priceData.value = result[0][1]
        
        const tokenDetails = availableTokens.value.find(([p, _]) => 
          p.toString() === selectedTokenPrincipal.value
        )
        selectedTokenSymbol.value = tokenDetails ? tokenDetails[1].tokenSymbol : 'Unknown'
        
        // Draw chart after data is loaded
        nextTick(() => {
          drawChart()
        })
      } else {
        priceData.value = []
      }
    }
  } catch (error) {
    console.error('Failed to load price history:', error)
    priceData.value = []
  }
  loading.value = false
}

const setTimeRange = (range: '24h' | '7d' | '30d' | 'all') => {
  timeRange.value = range
  updateChart()
}

const updateChart = () => {
  chartKey.value += 1
  nextTick(() => {
    drawChart()
  })
}

const handleMouseMove = (event: MouseEvent) => {
  // Simple hover detection for tooltip
  const canvas = chartCanvas.value
  if (!canvas || !filteredPriceData.value.length) return
  
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Use the same padding calculation as the chart
  const paddingLeft = priceUnit.value === 'icp' ? 120 : 80
  const paddingRight = 40
  
  // Only detect points within the chart area
  if (x < paddingLeft || x > rect.width - paddingRight) {
    hoveredPoint.value = null
    return
  }
  
  // Calculate the relative position within the chart area
  const chartWidth = rect.width - paddingLeft - paddingRight
  const relativeX = x - paddingLeft
  const dataPoints = filteredPriceData.value.length
  
  // Calculate which data point we're hovering over
  const pointIndex = Math.floor((relativeX / chartWidth) * dataPoints)
  
  if (pointIndex >= 0 && pointIndex < dataPoints) {
    const point = filteredPriceData.value[pointIndex]
    const date = new Date(Number(point.time) / 1_000_000)
    const price = selectedTokenPrincipal.value === 'PORTFOLIO' ?
      (priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice) :
      (priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice)
    
    hoveredPoint.value = {
      date: date.toLocaleDateString(),
      price: formatPrice(price)
    }
    
    tooltipStyle.value = {
      position: 'absolute',
      left: `${x + 10}px`,
      top: `${y - 40}px`,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      pointerEvents: 'none',
      zIndex: 1000
    }
  } else {
    hoveredPoint.value = null
  }
}

const handleMouseLeave = () => {
  hoveredPoint.value = null
}

const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas || !filteredPriceData.value.length) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Set canvas size
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * devicePixelRatio
  canvas.height = rect.height * devicePixelRatio
  ctx.scale(devicePixelRatio, devicePixelRatio)
  
  const width = rect.width
  const height = rect.height
  const paddingLeft = priceUnit.value === 'icp' ? 120 : 80  // More space for ICP prices
  const paddingRight = 40
  const paddingTop = 40
  const paddingBottom = 40
  
  // Clear canvas
  ctx.fillStyle = 'transparent'
  ctx.fillRect(0, 0, width, height)
  
  // Get price data
  const prices = filteredPriceData.value.map((point: any) => {
    if (selectedTokenPrincipal.value === 'PORTFOLIO') {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000  // Portfolio ICP values are already in e8s
        : point.usdPrice                        // Portfolio USD values are already in dollars
    } else {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    }
  })
  
  if (prices.length === 0) return
  
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1
  
  // Draw grid and Y-axis labels
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.font = '12px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.textAlign = 'right'
  
  // Horizontal grid lines with Y-axis labels
  for (let i = 0; i <= 5; i++) {
    const y = paddingTop + (i * (height - paddingTop - paddingBottom)) / 5
    
    // Draw grid line
    ctx.beginPath()
    ctx.moveTo(paddingLeft, y)
    ctx.lineTo(width - paddingRight, y)
    ctx.stroke()
    
    // Calculate and draw price label
    const priceAtY = maxPrice - (i * priceRange) / 5
    const formattedPrice = priceUnit.value === 'usd' 
      ? '$' + priceAtY.toFixed(priceAtY < 1 ? 6 : 2)
      : priceAtY.toFixed(priceAtY < 1 ? 8 : 4) + ' ICP'
    
    ctx.fillText(formattedPrice, paddingLeft - 5, y + 4)
  }
  
  // Vertical grid lines
  ctx.textAlign = 'center'
  for (let i = 0; i <= 10; i++) {
    const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / 10
    ctx.beginPath()
    ctx.moveTo(x, paddingTop)
    ctx.lineTo(x, height - paddingBottom)
    ctx.stroke()
  }
  
  // Draw price line
  ctx.strokeStyle = '#58BA56'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  prices.forEach((price, index) => {
    const x = paddingLeft + (index / (prices.length - 1)) * (width - paddingLeft - paddingRight)
    const y = height - paddingBottom - ((price - minPrice) / priceRange) * (height - paddingTop - paddingBottom)
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // Fill area under line
  ctx.fillStyle = 'rgba(88, 186, 86, 0.1)'
  ctx.lineTo(width - paddingRight, height - paddingBottom)
  ctx.lineTo(paddingLeft, height - paddingBottom)
  ctx.closePath()
  ctx.fill()
}

const formatPrice = (price: number) => {
  if (priceUnit.value === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price)
  } else {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price) + ' ICP'
  }
}

// Computed
const filteredPriceData = computed(() => {
  if (!priceData.value.length) return []
  
  const now = Date.now() * 1_000_000
  let cutoffTime = 0
  
  switch (timeRange.value) {
    case '24h':
      cutoffTime = now - (24 * 60 * 60 * 1_000_000_000)
      break
    case '7d':
      cutoffTime = now - (7 * 24 * 60 * 60 * 1_000_000_000)
      break
    case '30d':
      cutoffTime = now - (30 * 24 * 60 * 60 * 1_000_000_000)
      break
    case 'all':
    default:
      cutoffTime = 0
      break
  }
  
  return priceData.value.filter(point => Number(point.time) >= cutoffTime)
})

// Current price
const currentPrice = computed(() => {
  if (!filteredPriceData.value.length) return 0
  const latest = filteredPriceData.value[filteredPriceData.value.length - 1]
  
  if (selectedTokenPrincipal.value === 'PORTFOLIO') {
    return priceUnit.value === 'icp' 
      ? Number(latest.icpPrice) / 100_000_000 
      : latest.usdPrice
  } else {
    return priceUnit.value === 'icp' 
      ? Number(latest.icpPrice) / 100_000_000 
      : latest.usdPrice
  }
})

// Price statistics
const stats = computed(() => {
  if (!filteredPriceData.value.length) {
    return {
      high24h: 0,
      low24h: 0,
      change24h: 0,
      allTimeHigh: 0,
      allTimeLow: 0,
      allTimeHighDate: 0,
      allTimeLowDate: 0,
      averagePrice: 0
    }
  }
  
  const prices = filteredPriceData.value.map(point => {
    if (selectedTokenPrincipal.value === 'PORTFOLIO') {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    } else {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    }
  })
  
  const times = filteredPriceData.value.map(point => Number(point.time))
  
  // 24h data
  const now = Date.now() * 1_000_000
  const oneDayAgo = now - (24 * 60 * 60 * 1_000_000_000)
  const last24hData = filteredPriceData.value.filter(point => Number(point.time) >= oneDayAgo)
  const last24hPrices = last24hData.map(point => {
    if (selectedTokenPrincipal.value === 'PORTFOLIO') {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    } else {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    }
  })
  
  const high24h = last24hPrices.length ? Math.max(...last24hPrices) : 0
  const low24h = last24hPrices.length ? Math.min(...last24hPrices) : 0
  
  // 24h change
  const oldestIn24h = last24hData.length ? last24hData[0] : null
  const oldPrice = oldestIn24h ? (selectedTokenPrincipal.value === 'PORTFOLIO' ? 
    (priceUnit.value === 'icp' 
      ? Number(oldestIn24h.icpPrice) / 100_000_000 
      : oldestIn24h.usdPrice) :
    (priceUnit.value === 'icp' 
      ? Number(oldestIn24h.icpPrice) / 100_000_000 
      : oldestIn24h.usdPrice)) : 0
  const change24h = oldPrice ? ((currentPrice.value - oldPrice) / oldPrice) * 100 : 0
  
  // All-time stats
  const allTimeHigh = Math.max(...prices)
  const allTimeLow = Math.min(...prices)
  const allTimeHighIndex = prices.indexOf(allTimeHigh)
  const allTimeLowIndex = prices.indexOf(allTimeLow)
  const allTimeHighDate = times[allTimeHighIndex]
  const allTimeLowDate = times[allTimeLowIndex]
  
  // Average price
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
  
  return {
    high24h,
    low24h,
    change24h,
    allTimeHigh,
    allTimeLow,
    allTimeHighDate,
    allTimeLowDate,
    averagePrice
  }
})

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp / 1_000_000) // Convert nanoseconds to milliseconds
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Chart range percentage (difference between highest and lowest price in the visible range)
const chartRangePercent = computed(() => {
  if (!filteredPriceData.value.length) return '0.00'
  
  const prices = filteredPriceData.value.map(point => {
    if (selectedTokenPrincipal.value === 'PORTFOLIO') {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    } else {
      return priceUnit.value === 'icp' 
        ? Number(point.icpPrice) / 100_000_000 
        : point.usdPrice
    }
  })
  
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  
  if (minPrice === 0) return '∞'
  
  const percentChange = ((maxPrice - minPrice) / minPrice) * 100
  return percentChange.toFixed(2)
})

// Watchers
watch([priceUnit, timeRange], () => {
  updateChart()
})

// Lifecycle
onMounted(async () => {
  await loadAvailableTokens()
  // Default to Portfolio view
  selectedTokenPrincipal.value = 'PORTFOLIO'
  selectedTokenSymbol.value = 'Portfolio'
  await loadPriceHistory()
  
  // Draw chart after data is loaded
  nextTick(() => {
    drawChart()
  })
})
</script>

<style scoped>
.admin-price-history-view {
  padding-bottom: 2rem;
}

/* Override the global .app overflow:clip for this page only */
:global(.app) {
  overflow: auto !important;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

.chart-container canvas {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
}

.stat-card h6 {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.form-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.form-select:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}

.form-select option {
  background: #2d2d2d;
  color: white;
}

.btn-outline-light.active {
  background-color: #58BA56;
  border-color: #58BA56;
  color: white;
}

.card {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
</style> 