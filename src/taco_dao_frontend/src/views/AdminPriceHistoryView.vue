<template>
  <div class="admin-price-history-view">
    <div class="container-fluid mt-4">
      <div class="row">
        <div class="col-12">
          <TacoTitle
            level="h2"
            emoji="📊"
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
                    <option value="PORTFOLIO_DAO">📊 Portfolio (DAO) - Allocation History</option>
                    <option value="PORTFOLIO_TREASURY">📈 Portfolio (Treasury) - Live Snapshots</option>
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
              
              <div v-else-if="!filteredPriceData.length && timeRange === '24h'" class="text-center text-muted">
                <p>No portfolio data in the last 24 hours</p>
                <small>Portfolio snapshots are created when users update allocations. Try a longer time range.</small>
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

                      <!-- Time Slider (shows portfolio context for any token view) -->
          <div class="card bg-dark text-white mb-4" v-if="showSlider">
            <div class="card-header">
              <h3 class="mb-0">📅 Time Explorer</h3>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Select time point to explore portfolio composition:</label>
                <input 
                  type="range" 
                  class="form-range" 
                  :min="0" 
                  :max="filteredPriceData.length - 1" 
                  v-model="sliderPosition"
                  @input="updateSliderData"
                  :style="{ background: `linear-gradient(to right, #58BA56 0%, #58BA56 ${sliderPercent}%, #444 ${sliderPercent}%, #444 100%)` }">
              </div>
              <div class="d-flex justify-content-between text-muted small">
                <span>{{ formatSliderDate(filteredPriceData[0]?.time) }}</span>
                <span>{{ formatSliderDate(filteredPriceData[filteredPriceData.length - 1]?.time) }}</span>
              </div>
            </div>
          </div>

          <!-- Slider Data Display -->
          <div class="card bg-dark text-white mb-4" v-if="sliderData">
            <div class="card-header">
              <h3 class="mb-0">📊 {{ isPortfolioView ? 'Portfolio' : selectedTokenSymbol + ' & Portfolio Context' }} at {{ formatSliderDate(sliderData.time) }}</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <!-- Price Info -->
                <div class="col-md-4">
                  <div class="slider-info-section">
                    <h5 class="mb-3">💰 Price Information</h5>
                    
                    <!-- Individual Token Price (for token views) -->
                    <div v-if="!isPortfolioView && (sliderData.icpPrice || sliderData.usdPrice)">
                      <div class="info-item">
                        <span class="info-label">{{ selectedTokenSymbol }} Price:</span>
                        <span class="info-value">{{ formatSliderPrice(sliderData.icpPrice || sliderData.usdPrice, priceUnit) }}</span>
                      </div>
                      <hr class="my-2">
                    </div>
                    
                    <!-- Portfolio Values -->
                    <div v-if="sliderData.portfolioIcpValue || sliderData.portfolioUsdValue || isPortfolioView">
                      <div class="info-item">
                        <span class="info-label">Portfolio (ICP):</span>
                        <span class="info-value">{{ formatSliderPrice(sliderData.portfolioIcpValue || sliderData.icpPrice, 'icp') }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Portfolio (USD):</span>
                        <span class="info-value">{{ formatSliderPrice(sliderData.portfolioUsdValue || sliderData.usdPrice, 'usd') }}</span>
                      </div>
                    </div>
                    
                    <div class="info-item mt-2">
                      <span class="info-label">Date:</span>
                      <span class="info-value">{{ formatSliderDateTime(sliderData.time) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Portfolio Composition -->
                <div class="col-md-4" v-if="sliderData.tokens && sliderData.tokens.length">
                  <div class="slider-info-section">
                    <h5 class="mb-3">🏛️ Portfolio Holdings</h5>
                    <div class="pie-chart-container">
                      <apexchart 
                        type="pie" 
                        :options="holdingsChartOptions" 
                        :series="holdingsSeries" 
                        height="200">
                      </apexchart>
                    </div>
                  </div>
                </div>

                <!-- Target Allocations -->
                <div class="col-md-4" v-if="targetAllocationData.length">
                  <div class="slider-info-section">
                    <h5 class="mb-3">🎯 Target Allocations</h5>
                    <div class="pie-chart-container">
                      <apexchart 
                        type="pie" 
                        :options="allocationsChartOptions" 
                        :series="allocationsSeries" 
                        height="200">
                      </apexchart>
                    </div>
                  </div>
                </div>

                <!-- No Data Message -->
                <div class="col-md-8" v-if="!sliderData.tokens || !sliderData.tokens.length">
                  <div class="text-center text-muted py-4">
                    <i class="fas fa-info-circle fa-2x mb-2"></i>
                    <p>No portfolio composition data available for this time point.</p>
                    <small>Portfolio snapshots contain detailed token breakdowns only for treasury data.</small>
                  </div>
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
import TacoTitle from '../components/misc/TacoTitle.vue'
import { Principal } from '@dfinity/principal'
import { default as apexchart } from 'vue3-apexcharts'

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

// Time slider state
const sliderPosition = ref(0)
const sliderData = ref<any>(null)
const targetAllocationData = ref<any[]>([])

// Token data for colors (copied from DAO component)
const tokenData = [
  { symbol: 'taco', color: '#f8a01b' },
  { symbol: 'icp', color: '#3b00b9' },
  { symbol: 'ckbtc', color: '#f7931a' },
  { symbol: 'ckusdc', color: '#2775ca' },
  { symbol: 'sneed', color: '#047b3e' },
  { symbol: 'dkp', color: '#ff6b35' },
  { symbol: 'boom', color: '#e74c3c' },
  { symbol: 'chat', color: '#9b59b6' },
  { symbol: 'kinic', color: '#1abc9c' },
  { symbol: 'cycles', color: '#34495e' },
  { symbol: 'default', color: '#777777' }
]

// Computed properties
const isPortfolioView = computed(() => 
  selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || 
  selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
)

// Always show slider since we always load portfolio data
const showSlider = computed(() => filteredPriceData.value.length > 0)

const sliderPercent = computed(() => {
  if (filteredPriceData.value.length <= 1) return 0
  return (Number(sliderPosition.value) / (filteredPriceData.value.length - 1)) * 100
})

// Holdings chart configuration
const holdingsChartOptions = computed(() => ({
  chart: {
    type: 'pie' as const,
    fontFamily: 'Space Mono',
    animations: { enabled: true, easing: 'easeout', speed: 350 }
  },
  plotOptions: {
    pie: {
      startAngle: -90,
      endAngle: 90,
      customScale: 1,
      expandOnClick: false
    }
  },
  colors: holdingsColors.value,
  dataLabels: {
    enabled: true,
    formatter: function (val: any, opts: any) {
      return holdingsLabels.value[opts.seriesIndex] + ' ' + val.toFixed(1) + '%'
    },
    style: { fontSize: '12px', fontFamily: 'Space Mono', fontWeight: 'bold' },
    background: {
      enabled: true,
      foreColor: '#fff',
      padding: 4,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#fff',
      opacity: 1
    }
  },
  legend: { show: false },
  grid: { padding: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

const allocationsChartOptions = computed(() => ({
  chart: {
    type: 'pie' as const,
    fontFamily: 'Space Mono',
    animations: { enabled: true, easing: 'easeout', speed: 350 }
  },
  plotOptions: {
    pie: {
      startAngle: -90,
      endAngle: 90,
      customScale: 1,
      expandOnClick: false
    }
  },
  colors: allocationsColors.value,
  dataLabels: {
    enabled: true,
    formatter: function (val: any, opts: any) {
      return allocationsLabels.value[opts.seriesIndex] + ' ' + val.toFixed(1) + '%'
    },
    style: { fontSize: '12px', fontFamily: 'Space Mono', fontWeight: 'bold' },
    background: {
      enabled: true,
      foreColor: '#fff',
      padding: 4,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#fff',
      opacity: 1
    }
  },
  legend: { show: false },
  grid: { padding: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

// Chart series and colors - Always use Treasury data for portfolio holdings
const holdingsSeries = computed(() => {
  if (!sliderData.value?.tokens) return []
  
  const totalValue = sliderData.value.tokens.reduce((sum: number, token: any) => 
    sum + (token.valueInUSD || 0), 0)
  
  if (totalValue === 0) return []
  
  return sliderData.value.tokens
    .filter((token: any) => (token.valueInUSD || 0) > 0)
    .map((token: any) => ((token.valueInUSD / totalValue) * 100))
})

const holdingsLabels = computed(() => {
  if (!sliderData.value?.tokens) return []
  
  return sliderData.value.tokens
    .filter((token: any) => (token.valueInUSD || 0) > 0)
    .map((token: any) => token.symbol?.toUpperCase() || 'UNKNOWN')
})

const holdingsColors = computed(() => {
  if (!sliderData.value?.tokens) return []
  
  return sliderData.value.tokens
    .filter((token: any) => (token.valueInUSD || 0) > 0)
    .map((token: any) => {
      const symbol = token.symbol?.toLowerCase() || 'default'
      const tokenInfo = tokenData.find(t => t.symbol === symbol)
      return tokenInfo?.color || tokenData.find(t => t.symbol === 'default')?.color || '#777777'
    })
})

const allocationsSeries = computed(() => {
  // Use slider-specific historical target allocations if available
  if (sliderData.value?.targetAllocations) {
    return sliderData.value.targetAllocations.map((allocation: any) => allocation.percentage)
  }
  
  // Fallback to static current allocations
  if (targetAllocationData.value?.length) {
    return targetAllocationData.value.map((allocation: any) => allocation.percentage)
  }
  
  return []
})

const allocationsLabels = computed(() => {
  // Use slider-specific historical target allocations if available
  if (sliderData.value?.targetAllocations) {
    return sliderData.value.targetAllocations.map((allocation: any) => allocation.symbol?.toUpperCase() || 'UNKNOWN')
  }
  
  // Fallback to static current allocations
  if (targetAllocationData.value?.length) {
    return targetAllocationData.value.map((allocation: any) => allocation.symbol?.toUpperCase() || 'UNKNOWN')
  }
  
  return []
})

const allocationsColors = computed(() => {
  // Use slider-specific historical target allocations if available
  if (sliderData.value?.targetAllocations) {
    return sliderData.value.targetAllocations.map((allocation: any) => allocation.color || '#777777')
  }
  
  // Fallback to static current allocations
  if (targetAllocationData.value?.length) {
    return targetAllocationData.value.map((allocation: any) => {
      const symbol = allocation.symbol?.toLowerCase() || 'default'
      const tokenInfo = tokenData.find(t => t.symbol === symbol)
      return tokenInfo?.color || tokenData.find(t => t.symbol === 'default')?.color || '#777777'
    })
  }
  
  return []
})

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

const loadTargetAllocations = async () => {
  try {
    await store.fetchAggregateAllocation()
    const aggregateAllocation = store.fetchedAggregateAllocation || []
    
    targetAllocationData.value = aggregateAllocation
      .filter(([_, percentage]: any) => percentage > 0)
      .map(([principal, percentage]: any) => {
        const tokenDetails = availableTokens.value.find(([p, _]: any) => 
          p.toString() === principal.toString())
        const symbol = tokenDetails ? tokenDetails[1].tokenSymbol : principal.toString().slice(0, 8)
        
        return {
          symbol,
          percentage: Number(percentage) / 100, // Convert basis points to percentage
          principal: principal.toString()
        }
      })
  } catch (error) {
    console.error('Failed to load target allocations:', error)
    targetAllocationData.value = []
  }
}

// Store both portfolio datasets
const treasuryPortfolioData = ref<any[]>([])
const daoPortfolioData = ref<any[]>([])

const loadPriceHistory = async () => {
  if (!selectedTokenPrincipal.value) return
  
  loading.value = true
  try {
    // Always load both portfolio datasets in parallel for slider functionality
    const [treasuryResult, daoResult] = await Promise.all([
      store.getTreasuryPortfolioHistory(1000).catch(e => {
        console.error('Failed to load treasury portfolio:', e)
        return { snapshots: [] }
      }),
      store.getPortfolioHistory(2000).catch(e => {
        console.error('Failed to load DAO portfolio:', e)
        return []
      })
    ])
    
    // Process Treasury data
    if (treasuryResult && treasuryResult.snapshots) {
      treasuryPortfolioData.value = treasuryResult.snapshots.map((snapshot: any) => ({
        time: snapshot.timestamp,
        icpPrice: snapshot.totalValueICP,
        usdPrice: snapshot.totalValueUSD,
        tokens: snapshot.tokens
      }))
    } else {
      treasuryPortfolioData.value = []
    }
    
    // Process DAO data
    if (Array.isArray(daoResult)) {
      daoPortfolioData.value = daoResult.map(([timestamp, data]: any) => ({
        time: timestamp,
        icpPrice: typeof data.totalWorthInICP === 'bigint' ? data.totalWorthInICP : BigInt(data.totalWorthInICP || 0),
        usdPrice: typeof data.totalWorthInUSD === 'bigint' ? Number(data.totalWorthInUSD) : (data.totalWorthInUSD || 0),
        balances: data.balances || [],
        allocations: data.allocations || []
      })).reverse()
    } else {
      daoPortfolioData.value = []
    }
    
    // Load the main price chart data based on selection
    if (selectedTokenPrincipal.value === 'PORTFOLIO_DAO') {
      priceData.value = daoPortfolioData.value
      selectedTokenSymbol.value = 'Portfolio (DAO)'
      
    } else if (selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY') {
      priceData.value = treasuryPortfolioData.value
      selectedTokenSymbol.value = 'Portfolio (Treasury)'
      
    } else {
      // Load individual token price data
      const principal = Principal.fromText(selectedTokenPrincipal.value)
      const result = await store.getTokenPriceHistory([principal])
      
      if (result && result.length > 0) {
        priceData.value = result[0][1]
        const tokenDetails = availableTokens.value.find(([p, _]) => 
          p.toString() === selectedTokenPrincipal.value)
        selectedTokenSymbol.value = tokenDetails ? tokenDetails[1].tokenSymbol : 'Unknown'
      } else {
        priceData.value = []
      }
    }
    
    // Always load target allocations for the allocations pie chart
    await loadTargetAllocations()
    
    // Initialize slider to latest data point
    if (filteredPriceData.value.length > 0) {
      sliderPosition.value = filteredPriceData.value.length - 1
      updateSliderData()
    }
    
  } catch (error) {
    console.error('Failed to load price history:', error)
    priceData.value = []
  }
  loading.value = false
  
  nextTick(() => {
    drawChart()
  })
}

// Helper function to get token color from symbol
const getTokenColor = (symbol: string) => {
  const tokenInfo = tokenData.find(t => t.symbol === symbol?.toLowerCase())
  return tokenInfo?.color || tokenData.find(t => t.symbol === 'default')?.color || '#777777'
}

const updateSliderData = async () => {
  const index = Number(sliderPosition.value)
  if (index >= 0 && index < filteredPriceData.value.length) {
    const selectedPoint = filteredPriceData.value[index]
    const selectedTime = selectedPoint.time
    
    // Always start with the main chart data point
    sliderData.value = { ...selectedPoint }
    
    // For individual token views, we need to ensure price info is available
    // If the selected point doesn't have icpPrice/usdPrice, use the price data
    if (!sliderData.value.icpPrice && !sliderData.value.usdPrice) {
      if (priceUnit.value === 'icp') {
        sliderData.value.icpPrice = selectedPoint.price || 0
        sliderData.value.usdPrice = 0 // Individual tokens don't have USD data directly
      } else {
        sliderData.value.usdPrice = selectedPoint.price || 0
        sliderData.value.icpPrice = 0 // Individual tokens don't have ICP data directly
      }
    }
    
    // Find closest Treasury data point by timestamp for portfolio holdings
    if (treasuryPortfolioData.value.length > 0) {
      const closestTreasuryPoint = treasuryPortfolioData.value.reduce((closest, current) => {
        const currentDiff = Math.abs(Number(current.time) - Number(selectedTime))
        const closestDiff = Math.abs(Number(closest.time) - Number(selectedTime))
        return currentDiff < closestDiff ? current : closest
      })
      
      // Add Treasury tokens data for portfolio holdings
      if (closestTreasuryPoint.tokens) {
        sliderData.value.tokens = closestTreasuryPoint.tokens
        // Also add portfolio values for context
        sliderData.value.portfolioIcpValue = closestTreasuryPoint.icpPrice
        sliderData.value.portfolioUsdValue = closestTreasuryPoint.usdPrice
      }
    }
    
    // Find closest DAO data point by timestamp for target allocations
    if (daoPortfolioData.value.length > 0) {
      const closestDaoPoint = daoPortfolioData.value.reduce((closest, current) => {
        const currentDiff = Math.abs(Number(current.time) - Number(selectedTime))
        const closestDiff = Math.abs(Number(closest.time) - Number(selectedTime))
        return currentDiff < closestDiff ? current : closest
      })
      
      // Process DAO allocations data for target allocations pie chart
      if (closestDaoPoint.allocations && closestDaoPoint.allocations.length > 0) {
        sliderData.value.targetAllocations = closestDaoPoint.allocations
          .filter(([_, basisPoints]: [any, any]) => Number(basisPoints) > 0)
          .map(([principal, basisPoints]: [any, any]) => {
            const tokenDetails = store.fetchedTokenDetails.find((tokenEntry: any) => tokenEntry[0].toString() === principal.toString())
            const symbol = tokenDetails ? tokenDetails[1].tokenSymbol : 'Unknown'
            return {
              symbol,
              percentage: Number(basisPoints) / 100,
              color: getTokenColor(symbol)
            }
          })
      }
    }
    
  } else {
    sliderData.value = null
  }
}

const formatSliderDate = (timestamp: any) => {
  if (!timestamp) return ''
  const date = new Date(Number(timestamp) / 1_000_000)
  return date.toLocaleDateString()
}

const formatSliderDateTime = (timestamp: any) => {
  if (!timestamp) return ''
  const date = new Date(Number(timestamp) / 1_000_000)
  return date.toLocaleString()
}

const formatSliderPrice = (price: any, unit: string) => {
  if (price === null || price === undefined) return 'N/A'
  const numPrice = typeof price === 'bigint' ? Number(price) / 100_000_000 : Number(price)
  
  if (unit === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numPrice)
  } else {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(numPrice) + ' ICP'
  }
}

const setTimeRange = (range: '24h' | '7d' | '30d' | 'all') => {
  timeRange.value = range
  updateChart()
  // Reset slider to latest data point when time range changes
  if (filteredPriceData.value.length > 0) {
    sliderPosition.value = filteredPriceData.value.length - 1
    updateSliderData()
  }
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
    const isPortfolio = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
    const price = isPortfolio ?
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
  const isPortfolio = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
  const prices = filteredPriceData.value.map((point: any) => {
    if (isPortfolio) {
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
  
  const now = BigInt(Date.now() * 1_000_000)  // Convert milliseconds to nanoseconds as BigInt
  let cutoffTime = BigInt(0)
  
  switch (timeRange.value) {
    case '24h':
      cutoffTime = now - BigInt(24 * 60 * 60 * 1_000_000_000)  // 24 hours in nanoseconds
      break
    case '7d':
      cutoffTime = now - BigInt(7 * 24 * 60 * 60 * 1_000_000_000)  // 7 days in nanoseconds
      break
    case '30d':
      cutoffTime = now - BigInt(30 * 24 * 60 * 60 * 1_000_000_000)  // 30 days in nanoseconds
      break
    case 'all':
    default:
      cutoffTime = BigInt(0)
      break
  }
  
  const filtered = priceData.value.filter(point => {
    const pointTime = typeof point.time === 'bigint' ? point.time : BigInt(point.time)
    return pointTime >= cutoffTime
  })
  
  return filtered
})

// Current price
const currentPrice = computed(() => {
  if (!filteredPriceData.value.length) return 0
  const latest = filteredPriceData.value[filteredPriceData.value.length - 1]
  
  const isPortfolio = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
  if (isPortfolio) {
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
    const isPortfolio = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
    if (isPortfolio) {
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
  const now = BigInt(Date.now() * 1_000_000)
  const oneDayAgo = now - BigInt(24 * 60 * 60 * 1_000_000_000)  // 24 hours
  const last24hData = filteredPriceData.value.filter(point => {
    const pointTime = typeof point.time === 'bigint' ? point.time : BigInt(point.time)
    return pointTime >= oneDayAgo
  })
  const last24hPrices = last24hData.map(point => {
    const isPortfolio = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
    if (isPortfolio) {
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
  const isPortfolioForOldPrice = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
  const oldPrice = oldestIn24h ? (isPortfolioForOldPrice ? 
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
    const isPortfolio = selectedTokenPrincipal.value === 'PORTFOLIO_DAO' || selectedTokenPrincipal.value === 'PORTFOLIO_TREASURY'
    if (isPortfolio) {
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

watch(sliderPosition, () => {
  updateSliderData()
})

// Lifecycle
onMounted(async () => {
  await loadAvailableTokens()
  // Default to Portfolio view
  selectedTokenPrincipal.value = 'PORTFOLIO_DAO'
  selectedTokenSymbol.value = 'Portfolio (DAO)'
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
  /* Ensure the view itself can scroll on mobile */
  min-height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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

/* Time Slider Styles */
.form-range {
  background: transparent;
  height: 8px;
}

.form-range::-webkit-slider-track {
  background: #444;
  border-radius: 4px;
  height: 8px;
}

.form-range::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #58BA56;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.form-range::-moz-range-track {
  background: #444;
  border-radius: 4px;
  height: 8px;
  border: none;
}

.form-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #58BA56;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Slider Info Styles */
.slider-info-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  height: 100%;
}

.slider-info-section h5 {
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.info-value {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.pie-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* ApexCharts dark theme overrides */
:deep(.apexcharts-text) {
  fill: white !important;
}

:deep(.apexcharts-datalabel-label) {
  fill: white !important;
  font-weight: 600 !important;
}

:deep(.apexcharts-datalabel-value) {
  fill: white !important;
  font-weight: 600 !important;
}
</style> 