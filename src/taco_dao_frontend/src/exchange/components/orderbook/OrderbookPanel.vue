<template>
  <div class="orderbook-panel">
    <!-- Header -->
    <div class="orderbook-panel__header">
      <span class="orderbook-panel__title">Order Book</span>
      <div class="orderbook-panel__modes">
        <button
          class="orderbook-panel__mode-btn"
          :class="{ 'orderbook-panel__mode-btn--active': displayMode === 'both' }"
          @click="displayMode = 'both'"
          title="Both sides"
          aria-label="Show both bids and asks"
        >
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="4" rx="1" stroke="#D94040" fill="none"/><rect x="2" y="8" width="10" height="4" rx="1" stroke="#2EA66A" fill="none"/></svg>
        </button>
        <button
          class="orderbook-panel__mode-btn"
          :class="{ 'orderbook-panel__mode-btn--active': displayMode === 'bids' }"
          @click="displayMode = 'bids'"
          title="Bids only"
          aria-label="Show only bids"
        >
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" rx="1" stroke="#2EA66A" fill="none"/></svg>
        </button>
        <button
          class="orderbook-panel__mode-btn"
          :class="{ 'orderbook-panel__mode-btn--active': displayMode === 'asks' }"
          @click="displayMode = 'asks'"
          title="Asks only"
          aria-label="Show only asks"
        >
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" rx="1" stroke="#D94040" fill="none"/></svg>
        </button>
        <!-- Precision selector -->
        <select
          class="orderbook-panel__precision-select"
          v-model.number="selectedPrecision"
          title="Price precision"
        >
          <option v-for="opt in precisionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Column headers -->
    <div class="orderbook-panel__col-headers">
      <span>Price</span>
      <span>Amount</span>
      <span>Total</span>
    </div>

    <!-- Content -->
    <div class="orderbook-panel__content" ref="contentRef">
      <!-- First-load skeleton (only when no data yet) -->
      <div v-if="isLoading && bids.length === 0 && asks.length === 0" class="orderbook-panel__loading">
        <div v-for="i in 12" :key="i" class="orderbook-panel__skeleton-row">
          <div class="ex-skeleton" style="width:60px;height:14px"></div>
          <div class="ex-skeleton" style="width:50px;height:14px"></div>
          <div class="ex-skeleton" style="width:50px;height:14px"></div>
        </div>
      </div>

      <template v-else>
        <!-- Dim overlay while new-pair data is loading; existing rows stay visible underneath -->
        <div v-if="isStale" class="orderbook-panel__stale-overlay" aria-hidden="true"></div>
        <!-- Asks (reversed so lowest ask is at bottom) -->
        <div v-if="displayMode !== 'bids'" class="orderbook-panel__asks" ref="asksContainer">
          <div
            v-for="(level, idx) in displayAsks"
            :key="`ask-${idx}`"
            class="orderbook-panel__row orderbook-panel__row--ask"
            :style="{ '--depth-width': depthPercent(level) + '%' }"
            :class="{ 'orderbook-panel__row--amm': level.source === 'AMM' }"
            @click="onAskClick(level.price, level.total)"
          >
            <span class="orderbook-panel__price num">{{ formatPrice(level.price) }}</span>
            <span class="orderbook-panel__amount num">{{ formatAmount(level.amount) }}</span>
            <span class="orderbook-panel__total num">{{ formatAmount(level.total) }}</span>
          </div>
        </div>

        <!-- Spread row -->
        <div v-if="displayMode === 'both'" class="orderbook-panel__spread">
          <span class="orderbook-panel__spread-price num" :class="store.effectivePriceDirection === 'up' ? 'orderbook-panel__spread-price--up' : store.effectivePriceDirection === 'down' ? 'orderbook-panel__spread-price--down' : ''">
            {{ formatPrice(store.effectivePrice > 0 ? store.effectivePrice : midPrice) }}
            <span v-if="store.effectivePriceDirection === 'up'" class="orderbook-panel__spread-arrow">&#9650;</span>
            <span v-else-if="store.effectivePriceDirection === 'down'" class="orderbook-panel__spread-arrow">&#9660;</span>
            <span v-if="effectivePriceUSD > 0" class="orderbook-panel__spread-usd">&asymp; {{ formatUSD(effectivePriceUSD) }}</span>
          </span>
          <span v-if="hasAMM" class="orderbook-panel__spread-label orderbook-panel__spread-label--tight">
            Spread: {{ spread.toFixed(2) }}% (AMM)
          </span>
          <span v-else class="orderbook-panel__spread-label" :class="`orderbook-panel__spread-label--${spreadClass}`">
            Spread: {{ spread.toFixed(2) }}%
          </span>
        </div>

        <!-- Bids -->
        <div v-if="displayMode !== 'asks'" class="orderbook-panel__bids">
          <div
            v-for="(level, idx) in displayBids"
            :key="`bid-${idx}`"
            class="orderbook-panel__row orderbook-panel__row--bid"
            :style="{ '--depth-width': depthPercent(level) + '%' }"
            :class="{ 'orderbook-panel__row--amm': level.source === 'AMM' }"
            @click="onBidClick(level.price, level.total)"
          >
            <span class="orderbook-panel__price num">{{ formatPrice(level.price) }}</span>
            <span class="orderbook-panel__amount num">{{ formatAmount(level.amount) }}</span>
            <span class="orderbook-panel__total num">{{ formatAmount(level.total) }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch, onMounted, onUnmounted } from 'vue'
import { useOrderbook } from '../../composables/useOrderbook'
import { useExchangeStore } from '../../store/exchange.store'
import { formatPrice as fmtPrice, formatUSD } from '../../utils/format'
import type { OrderbookLevel } from '../../utils/orderbook-merge'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  enabled?: boolean
}>()

const store = useExchangeStore()

const emit = defineEmits<{
  // cumulativeBase is the orderbook's TOTAL column for the clicked row — the
  // sum of base-token amounts from the best price up through this level. Used
  // by order forms to pre-fill "sweep up to this level" trades.
  clickPrice: [price: number, side: 'buy' | 'sell', cumulativeBase: number]
}>()

// Price precision — capped at max token decimals
const maxPriceDecimals = computed(() => Math.max(props.decimals0, props.decimals1))

const precisionOptions = computed(() => {
  const max = maxPriceDecimals.value
  const opts = [{ value: 0, label: 'Auto' }]
  // Start from 1dp for widest view, go up to max or 16
  const steps = [1, 2, 4, 6, 8, 10, 12, 14, 16]
  for (const d of steps) {
    if (d <= max) opts.push({ value: d, label: `${d} dp` })
  }
  // Add max if not already included and it's odd
  if (max > 0 && !steps.includes(max)) opts.push({ value: max, label: `${max} dp` })
  return opts
})

const PRECISION_KEY = 'taco_ob_precision'
const selectedPrecision = ref(parseInt(localStorage.getItem(PRECISION_KEY) || '0'))
watch(selectedPrecision, v => localStorage.setItem(PRECISION_KEY, v.toString()))

const {
  bids,
  asks,
  bestBid,
  bestAsk,
  midPrice,
  spread,
  spreadClass,
  displayMode,
  isLoading,
  isStale,
  bidMaxDepth,
  askMaxDepth,
  lastTradePrice,
  lastTradeDirection,
} = useOrderbook(
  toRef(props, 'token0'),
  toRef(props, 'token1'),
  toRef(props, 'decimals0'),
  toRef(props, 'decimals1'),
  ref(props.enabled !== false),
  selectedPrecision,
)

const midPriceUSD = computed(() => {
  if (!midPrice.value || midPrice.value <= 0) return 0
  return midPrice.value * store.getTokenPriceUSD(props.token1)
})

const effectivePriceUSD = computed(() => {
  const p = store.effectivePrice > 0 ? store.effectivePrice : midPrice.value
  if (!p || p <= 0) return 0
  return p * store.getTokenPriceUSD(props.token1)
})

// Prepare levels for display: slice to fit, compute cumulative totals
function groupByPrecision(levels: OrderbookLevel[], side: 'asks' | 'bids', limit: number = 25): OrderbookLevel[] {
  // Backend already aggregates by precision via stepBasisPoints.
  // For auto mode (precision=0), additionally bucket client-side.
  let grouped: OrderbookLevel[]

  const ep = selectedPrecision.value
  // Bucket at selected precision (or max decimals for auto)
  const factor = ep > 0 ? 10 ** ep : 10 ** Math.max(props.decimals0, props.decimals1)
  const buckets = new Map<number, OrderbookLevel>()
  for (const level of levels) {
    const key = Math.round(level.price * factor) / factor
    const existing = buckets.get(key)
    if (existing) {
      existing.amount += level.amount
      existing.ammAmount += level.ammAmount
      existing.limitAmount += level.limitAmount
      existing.orders += level.orders
      if (existing.source !== level.source && level.source !== 'AMM') existing.source = 'Both'
    } else {
      buckets.set(key, { ...level, price: key })
    }
  }
  grouped = Array.from(buckets.values())

  if (side === 'asks') {
    // Asks: sort ascending (lowest first = nearest spread), take 25 closest, then reverse for display
    grouped.sort((a, b) => a.price - b.price)
    grouped = grouped.slice(0, limit)
    // Recalculate cumulative (from spread outward)
    let cum = 0
    for (const l of grouped) { cum += l.amount; l.total = cum }
    // Reverse so lowest ask is at bottom (closest to spread row)
    grouped.reverse()
  } else {
    // Bids: sort descending (highest first = nearest spread), take 25 closest
    grouped.sort((a, b) => b.price - a.price)
    grouped = grouped.slice(0, limit)
    // Recalculate cumulative (from spread outward)
    let cum = 0
    for (const l of grouped) { cum += l.amount; l.total = cum }
  }

  return grouped
}

// Dynamic row count based on available height
const ROW_HEIGHT = 22 // matches CSS .orderbook-panel__row height
const SPREAD_HEIGHT = 32 // spread row: 6px padding × 2 + ~20px content
const contentRef = ref<HTMLElement | null>(null)
const maxRows = ref(15) // default fallback

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (contentRef.value) {
    resizeObserver = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? 400
      const available = h - SPREAD_HEIGHT
      maxRows.value = Math.max(3, Math.floor(available / 2 / ROW_HEIGHT))
    })
    resizeObserver.observe(contentRef.value)
  }
})
onUnmounted(() => resizeObserver?.disconnect())

const displayAsks = computed(() => groupByPrecision(asks.value, 'asks', maxRows.value))
const displayBids = computed(() => groupByPrecision(bids.value, 'bids', maxRows.value))
const hasAMM = computed(() => bids.value.some(l => l.source === 'AMM' || l.source === 'Both') || asks.value.some(l => l.source === 'AMM' || l.source === 'Both'))

// Use shared max across both sides so bars scale consistently
const sharedMaxDepth = computed(() => Math.max(bidMaxDepth.value, askMaxDepth.value))

function depthPercent(level: OrderbookLevel): number {
  const max = sharedMaxDepth.value
  if (max === 0) return 0
  return (level.total / max) * 100
}

function formatPrice(price: number): string {
  const ep = selectedPrecision.value
  const max = maxPriceDecimals.value
  return fmtPrice(price, max, ep > 0 ? Math.min(ep, max) : undefined)
}

function formatAmount(amount: number): string {
  const dec = props.decimals0
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(Math.min(2, dec)) + 'M'
  if (amount >= 1_000) return (amount / 1_000).toFixed(Math.min(2, dec)) + 'K'
  if (amount >= 1) return amount.toFixed(Math.min(4, dec))
  return amount.toFixed(Math.min(dec, 6))
}

function onAskClick(price: number, cumulativeBase: number) { emit('clickPrice', price, 'buy', cumulativeBase) }
function onBidClick(price: number, cumulativeBase: number) { emit('clickPrice', price, 'sell', cumulativeBase) }
</script>

<style scoped lang="scss">
// Figma PT_Orderbook spec — flat surface, eyebrow-style header,
// `.tx-depth` row pattern (3-col grid, 12px mono, ::before at 22% opacity).
.orderbook-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tx-bg);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background: transparent;
    border-bottom: 1px solid var(--tx-line);
  }

  &__title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--tx-ink-2);
  }

  &__modes {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  &__precision-select {
    appearance: none;
    -webkit-appearance: none;
    background: var(--tx-surface-2);
    border: 1px solid var(--tx-line);
    border-radius: var(--tx-r-sm);
    color: var(--tx-ink-2);
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 18px 2px 6px;
    cursor: pointer;
    margin-left: 4px;
    background-image: url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23897e6f' stroke-width='1' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 5px center;

    &:focus { border-color: var(--tx-orange); outline: none; box-shadow: 0 0 0 2px var(--tx-orange-dim); }
    option { background: var(--tx-surface-2); color: var(--tx-ink); }
  }

  &__mode-btn {
    background: transparent;
    border: 1px solid transparent;
    padding: 3px;
    border-radius: var(--tx-r-sm);
    cursor: pointer;
    opacity: 0.5;
    color: var(--tx-ink-3);
    transition: opacity 140ms, background 140ms, border-color 140ms;

    &:hover { opacity: 0.85; }
    &--active {
      opacity: 1;
      background: var(--tx-surface-2);
      border-color: var(--tx-line);
    }
  }

  &__col-headers {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 4px 10px;
    font-size: 10px;
    color: var(--tx-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
    background: transparent;
    border-bottom: 1px solid var(--tx-line);

    span:nth-child(2),
    span:nth-child(3) { text-align: right; }
  }

  &__content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  &__stale-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 2;
  }

  &__asks {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
    min-height: 0;
    // Backend returns ~40 levels per side; the container is only ~10 rows
    // tall. Clip from the TOP (farthest-from-spread) so the rows closest
    // to the spread stay visible. justify-content: flex-end + overflow
    // hidden keeps the bottom anchored.
    overflow: hidden;
  }

  &__bids {
    flex: 1;
    // Clip from the BOTTOM (farthest-from-spread). content starts at top
    // by default so overflow hidden naturally clips the tail.
    overflow: hidden;
    min-height: 0;
  }

  // Depth row — grid of 3 equal cols, mono tabular, ::before depth fill
  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 2px 10px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    height: 22px;
    align-items: center;
    position: relative;
    cursor: pointer;
    transition: background 120ms;

    &:hover { background: var(--tx-surface-2); }

    &::before {
      content: '';
      position: absolute;
      top: 1px; bottom: 1px; right: 0;
      width: var(--depth-width, 0%);
      opacity: 0.22;
      border-radius: 1px;
      pointer-events: none;
    }

    &--ask {
      .orderbook-panel__price { color: var(--tx-sell); }
      &::before { background: var(--tx-sell); }
    }
    &--bid {
      .orderbook-panel__price { color: var(--tx-buy); }
      &::before { background: var(--tx-buy); }
    }
    &--amm { opacity: var(--ob-amm-opacity, 0.55); }
  }

  &__price  { }
  &__amount { text-align: right; color: var(--tx-ink); }
  &__total  { text-align: right; color: var(--tx-ink-3); }

  // Spread row — taller, surface-2 bg, top+bottom 1px line
  &__spread {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: var(--tx-surface-2);
    border-top: 1px solid var(--tx-line);
    border-bottom: 1px solid var(--tx-line);
  }
  &__spread-price {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 600;
    color: var(--tx-ink);

    &--up   { color: var(--tx-buy); }
    &--down { color: var(--tx-sell); }
  }
  &__spread-arrow {
    font-size: 8px;
    margin-right: 2px;
  }
  &__spread-usd {
    color: var(--tx-ink-3);
    font-size: 11px;
    font-weight: 400;
    margin-left: 4px;
  }
  &__spread-label {
    font-size: 10px;
    color: var(--tx-ink-3);

    &--tight  { color: var(--tx-buy); }
    &--normal { color: var(--tx-warning); }
    &--wide   { color: var(--tx-sell); }
  }

  // Loading skeleton
  &__loading {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__skeleton-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  // Mobile adaptations
  @media (max-width: 767px) {
    &__header { padding: 6px 8px; }
    &__title  { display: none; }

    &__col-headers {
      grid-template-columns: 1fr 1fr;
      padding: 4px 8px;
      span:nth-child(3) { display: none; }
    }

    &__row {
      grid-template-columns: 1fr 1fr;
      padding: 2px 8px;
      font-size: 11px;
      height: 20px;
    }

    &__total { display: none; }

    &__spread { padding: 5px 8px; }
    &__spread-price { font-size: 12px; }
  }
}
</style>
