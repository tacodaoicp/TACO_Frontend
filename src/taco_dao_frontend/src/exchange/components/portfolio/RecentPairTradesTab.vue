<template>
  <div class="recent-pair-trades">
    <div v-if="loading && trades.length === 0" class="recent-pair-trades__loading">
      Loading recent trades...
    </div>

    <div v-else-if="trades.length > 0" class="ex-table-wrap recent-pair-trades__wrap">
      <div v-if="isStale" class="recent-pair-trades__stale-overlay" aria-hidden="true"></div>
      <table class="ex-table recent-pair-trades__table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Side</th>
            <th class="num">Price</th>
            <th class="num">Amount ({{ baseSymbol }})</th>
            <th class="num">Total ({{ quoteSymbol }})</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(trade, idx) in trades" :key="idx" :class="trade.side === 'buy' ? 'recent-pair-trades__row--buy' : 'recent-pair-trades__row--sell'">
            <td>{{ formatTime(trade.timestamp) }}</td>
            <td>
              <span :class="trade.side === 'buy' ? 'text-buy' : 'text-sell'">
                {{ trade.side === 'buy' ? 'BUY' : 'SELL' }}
              </span>
            </td>
            <td class="num">{{ formatPrice(trade.price) }}</td>
            <td class="num">{{ formatNum(trade.amount) }}</td>
            <td class="num">{{ formatNum(trade.total) }}</td>
            <td>
              <span class="ex-badge ex-badge--sm" :class="trade.source === 'AMM' ? 'ex-badge--info' : ''">
                {{ trade.source }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="recent-pair-trades__empty">
      No recent trades for this pair.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStaleAwareLoad } from '../../composables/useStaleAwareLoad'
import { useExchangeStore } from '../../store/exchange.store'
import { formatPrice as fmtPrice } from '../../utils/format'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
}>()

const store = useExchangeStore()

const baseSymbol = computed(() => store.getTokenByAddress(props.token0)?.symbol ?? 'Token0')
const quoteSymbol = computed(() => store.getTokenByAddress(props.token1)?.symbol ?? 'Token1')

interface PairTradeRow {
  timestamp: number
  side: 'buy' | 'sell'
  price: number
  amount: number
  total: number
  source: 'AMM' | 'Orderbook'
}

const trades = ref<PairTradeRow[]>([])
const loading = ref(true)
const isStale = ref(false)
let switchId = 0

async function fetchTrades() {
  if (!props.token0 || !props.token1) return

  const mySwitchId = switchId
  try {
    const raw = await store.getPoolHistory(props.token0, props.token1, 50n)
    if (mySwitchId !== switchId) return
    const rows: PairTradeRow[] = []

    for (const [timestamp, entries] of (raw as any[])) {
      for (const trade of entries) {
        // Skip private/OTC trades
        if (trade.strictlyOTC) continue

        const isBuy = trade.token_init_identifier === props.token1
        let price: number, amount: number, total: number

        if (isBuy) {
          // Maker deposited token1 (quote), received token0 (base) → BUY base
          const amtQuote = Number(trade.amount_init) / 10 ** props.decimals1
          const amtBase = Number(trade.amount_sell) / 10 ** props.decimals0
          price = amtBase > 0 ? amtQuote / amtBase : 0
          amount = amtBase
          total = amtQuote
        } else {
          // Maker deposited token0 (base), received token1 (quote) → SELL base
          const amtBase = Number(trade.amount_init) / 10 ** props.decimals0
          const amtQuote = Number(trade.amount_sell) / 10 ** props.decimals1
          price = amtBase > 0 ? amtQuote / amtBase : 0
          amount = amtBase
          total = amtQuote
        }

        const source = (trade.sell_principal === 'AMM' || trade.sell_principal === '0')
          ? 'AMM' as const
          : 'Orderbook' as const

        rows.push({
          timestamp: Number(timestamp) / 1_000_000,
          side: isBuy ? 'buy' : 'sell',
          price,
          amount,
          total,
          source,
        })
      }
    }

    trades.value = rows
    loading.value = false
    isStale.value = false
  } catch (err) {
    if (mySwitchId !== switchId) return
    console.error('[RecentPairTrades] Fetch error:', err)
    loading.value = false
  }
}

function formatTime(ms: number): string {
  if (!ms) return '—'
  const d = new Date(ms)
  const diff = Date.now() - ms
  if (diff < 86_400_000) {
    // Today — show HH:MM:SS
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatPrice(price: number): string {
  const maxDec = Math.max(props.decimals0, props.decimals1)
  return fmtPrice(price, maxDec)
}

function formatNum(val: number): string {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(2) + 'K'
  if (val >= 1) return val.toFixed(4)
  return val.toFixed(6)
}

const tradesLoad = useStaleAwareLoad({
  load: fetchTrades,
  staleMs: 15000,
  // Public pair trades — no auth or mutation filtering needed.
})

// Pair changes invalidate the cache; force a fresh fetch.
watch([() => props.token0, () => props.token1], () => {
  switchId++
  isStale.value = true
  tradesLoad.invalidate()
  tradesLoad.load()
})
</script>

<style scoped lang="scss">
.recent-pair-trades {
  &__table { width: 100%; }

  &__wrap { position: relative; }

  &__stale-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 2;
  }

  &__row--buy td:first-child { border-left: 2px solid var(--color-buy); }
  &__row--sell td:first-child { border-left: 2px solid var(--color-sell); }

  &__loading, &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }
}

.text-buy { color: var(--color-buy); font-weight: var(--weight-semibold); }
.text-sell { color: var(--color-sell); font-weight: var(--weight-semibold); }
</style>
