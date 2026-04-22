<template>
  <div class="trade-history-tab">
    <!-- Toolbar -->
    <div class="trade-history-tab__toolbar">
      <div class="trade-history-tab__filters">
        <select v-model="filterSide" class="ex-input trade-history-tab__filter-select">
          <option value="">All Sides</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <select v-model="filterType" class="ex-input trade-history-tab__filter-select">
          <option value="">All Types</option>
          <option value="direct">Swap</option>
          <option value="multihop">Multi-hop</option>
          <option value="limit">Order Filled</option>
          <option value="otc">OTC</option>
        </select>
        <select v-model="filterRange" class="ex-input trade-history-tab__filter-select">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
        </select>
      </div>
      <label class="trade-history-tab__pair-filter">
        <input type="checkbox" v-model="currentPairOnly" />
        <span>This pair only</span>
      </label>
      <div class="trade-history-tab__export">
        <button class="ex-btn ex-btn--sm ex-btn--outline" @click="exportCSV">Export CSV</button>
      </div>
    </div>

    <div v-if="loading" class="trade-history-tab__loading">Loading trade history...</div>

    <div v-else-if="filteredTrades.length > 0" class="ex-table-wrap">
    <table class="ex-table trade-history-tab__table">
      <thead>
        <tr>
          <th class="trade-history-tab__sortable" @click="toggleSort('date')">
            Date {{ sortIcon('date') }}
          </th>
          <th>Route</th>
          <th>Type</th>
          <th>Side</th>
          <th class="num">Sent</th>
          <th class="num">Received</th>
          <th class="num">Fee</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in paginatedTrades" :key="Number(trade.swapId)">
          <td>{{ formatDate(trade.timestamp) }}</td>
          <td class="trade-history-tab__route">{{ trade.routeLabel }}</td>
          <td><span class="ex-badge ex-badge--sm" :class="typeBadgeClass(trade.swapType)">{{ trade.swapType }}</span></td>
          <td>
            <span :class="trade.side === 'buy' ? 'text-buy' : 'text-sell'">
              {{ trade.side === 'buy' ? 'Buy' : 'Sell' }}
            </span>
          </td>
          <td class="num">{{ trade.amountInFormatted }} {{ trade.tokenInSymbol }}</td>
          <td class="num">{{ trade.amountOutFormatted }} {{ trade.tokenOutSymbol }}</td>
          <td class="num">{{ trade.feeFormatted }}</td>
        </tr>
      </tbody>
    </table>
    </div>

    <div v-else class="trade-history-tab__empty">
      No trade history found.
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="trade-history-tab__pagination">
      <button class="ex-btn ex-btn--sm ex-btn--outline" @click="page--" :disabled="page <= 1">Prev</button>
      <span class="trade-history-tab__page-info">{{ page }} / {{ totalPages }}</span>
      <button class="ex-btn ex-btn--sm ex-btn--outline" @click="page++" :disabled="page >= totalPages">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import type { SwapRecord } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const store = useExchangeStore()

const loading = ref(true)
const rawSwaps = ref<SwapRecord[]>([])
const filterSide = ref('')
const filterType = ref('')
const filterRange = ref('all')
const sortKey = ref<'date' | ''>('date')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const perPage = 25
const currentPairOnly = ref(false)

const BASE_TOKENS = new Set(['ryjl3-tyaaa-aaaaa-aaaba-cai', 'xevnm-gaaaa-aaaar-qafnq-cai'])

function getSymbol(addr: string): string {
  return store.tokens.find(t => t.address === addr)?.symbol ?? addr.slice(0, 5) + '...'
}

function getDecimals(addr: string): number {
  return Number(store.tokens.find(t => t.address === addr)?.decimals ?? 8)
}

function formatAmt(amount: bigint, addr: string): string {
  const dec = getDecimals(addr)
  const val = Number(amount) / 10 ** dec
  return val.toLocaleString(undefined, { maximumFractionDigits: Math.min(dec, 6) })
}

function getSwapTypeLabel(swapType: SwapRecord['swapType']): string {
  if ('direct' in swapType) return 'Swap'
  if ('multihop' in swapType) return 'Multi-hop'
  if ('limit' in swapType) return 'Order Filled'
  if ('otc' in swapType) return 'OTC'
  return 'Unknown'
}

function getSwapTypeKey(swapType: SwapRecord['swapType']): string {
  if ('direct' in swapType) return 'direct'
  if ('multihop' in swapType) return 'multihop'
  if ('limit' in swapType) return 'limit'
  if ('otc' in swapType) return 'otc'
  return ''
}

interface TradeRow {
  swapId: bigint
  timestamp: number
  routeLabel: string
  side: 'buy' | 'sell'
  swapType: string
  swapTypeKey: string
  tokenInSymbol: string
  tokenOutSymbol: string
  amountInFormatted: string
  amountOutFormatted: string
  feeFormatted: string
  raw: SwapRecord
}

const processedTrades = computed((): TradeRow[] => {
  return rawSwaps.value.map(r => {
    const routeLabel = r.route.map(id => getSymbol(id)).join(' → ')
    const side: 'buy' | 'sell' = BASE_TOKENS.has(r.tokenIn) ? 'buy' : 'sell'

    return {
      swapId: r.swapId,
      timestamp: Number(r.timestamp) / 1_000_000, // nanoseconds → ms
      routeLabel,
      side,
      swapType: getSwapTypeLabel(r.swapType),
      swapTypeKey: getSwapTypeKey(r.swapType),
      tokenInSymbol: getSymbol(r.tokenIn),
      tokenOutSymbol: getSymbol(r.tokenOut),
      amountInFormatted: formatAmt(r.amountIn, r.tokenIn),
      amountOutFormatted: formatAmt(r.amountOut, r.tokenOut),
      feeFormatted: r.fee > 0n ? formatAmt(r.fee, r.tokenIn) + ' ' + getSymbol(r.tokenIn) : '—',
      raw: r,
    }
  })
})

const filteredTrades = computed(() => {
  let result = processedTrades.value

  if (currentPairOnly.value) {
    const t0 = store.selectedToken0
    const t1 = store.selectedToken1
    if (t0 && t1) {
      result = result.filter(t =>
        (t.raw.tokenIn === t0 && t.raw.tokenOut === t1) ||
        (t.raw.tokenIn === t1 && t.raw.tokenOut === t0)
      )
    }
  }

  if (filterType.value) {
    result = result.filter(t => t.swapTypeKey === filterType.value)
  }

  if (filterSide.value) {
    result = result.filter(t => t.side === filterSide.value)
  }

  if (filterRange.value !== 'all') {
    const now = Date.now()
    const ranges: Record<string, number> = {
      today: 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }
    const cutoff = now - (ranges[filterRange.value] || 0)
    result = result.filter(t => t.timestamp >= cutoff)
  }

  if (sortKey.value === 'date') {
    result = [...result].sort((a, b) => {
      const m = sortDir.value === 'asc' ? 1 : -1
      return (a.timestamp - b.timestamp) * m
    })
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredTrades.value.length / perPage))
const paginatedTrades = computed(() => {
  const start = (page.value - 1) * perPage
  return filteredTrades.value.slice(start, start + perPage)
})

function toggleSort(key: 'date') {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
}

function sortIcon(key: string): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? '\u25B2' : '\u25BC'
}

function formatDate(ms: number): string {
  if (!ms) return '—'
  const diff = Date.now() - ms
  if (diff < 86_400_000) {
    const hours = Math.floor(diff / 3_600_000)
    if (hours < 1) return `${Math.floor(diff / 60_000)}m ago`
    return `${hours}h ago`
  }
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function typeBadgeClass(type: string): string {
  if (type === 'Multi-hop') return 'ex-badge--info'
  if (type === 'Order Filled') return 'ex-badge--warning'
  if (type === 'OTC') return 'ex-badge--accent'
  return ''
}

function exportCSV() {
  const headers = ['Date', 'Route', 'Type', 'Side', 'Token In', 'Amount In', 'Token Out', 'Amount Out', 'Fee']
  const rows = filteredTrades.value.map(t => [
    new Date(t.timestamp).toISOString(),
    t.routeLabel,
    t.swapType,
    t.side,
    t.tokenInSymbol,
    t.amountInFormatted,
    t.tokenOutSymbol,
    t.amountOutFormatted,
    t.feeFormatted,
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `taco_swaps_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

let initialLoadDone = false
async function loadHistory() {
  if (!initialLoadDone) loading.value = true
  try {
    rawSwaps.value = await store.getUserSwapHistory(200n)
  } catch (err) {
    console.error('[TradeHistoryTab] Load error:', err)
  } finally {
    loading.value = false
    initialLoadDone = true
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(loadHistory, 10000)
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}
let offMutation: (() => void) | null = null
onMounted(() => {
  loadHistory()
  startPolling()
  offMutation = store.onMutation(kind => {
    if (kind === 'swap' || kind === 'order') loadHistory()
  })
})
onUnmounted(() => { stopPolling(); offMutation?.() })
onActivated(() => { loadHistory(); startPolling() })
onDeactivated(() => stopPolling())
</script>

<style scoped lang="scss">
.trade-history-tab {
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-primary);
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    gap: var(--space-2);
  }

  &__filter-select {
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-2);
    max-width: 130px;
  }

  &__pair-filter {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;

    input { accent-color: var(--accent-primary); }
  }

  &__table { width: 100%; }

  &__route {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__sortable {
    cursor: pointer;
    user-select: none;
    &:hover { color: var(--text-primary); }
  }

  &__loading, &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border-top: 1px solid var(--border-primary);
  }

  &__page-info {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }
}

.text-buy { color: var(--color-buy); font-weight: var(--weight-semibold); }
.text-sell { color: var(--color-sell); font-weight: var(--weight-semibold); }
</style>
