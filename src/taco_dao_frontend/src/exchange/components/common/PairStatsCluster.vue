<template>
  <div v-if="visible" class="pair-stats">
    <div v-if="currentPrice" class="pair-stats__cell pair-stats__cell--last">
      <div
        class="tx-mono tx-tnum pair-stats__value pair-stats__value--lg"
        :class="priceChange !== null && priceChange >= 0 ? 'tx-buy' : priceChange !== null ? 'tx-sell' : ''"
      >{{ currentPrice }}</div>
      <div class="pair-stats__label">LAST</div>
    </div>
    <div v-if="priceChange !== null" class="pair-stats__cell pair-stats__cell--change">
      <div
        class="tx-mono tx-tnum pair-stats__value"
        :class="priceChange >= 0 ? 'tx-buy' : 'tx-sell'"
      >{{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%</div>
      <div class="pair-stats__label">24H</div>
    </div>
    <div v-if="stats24h.high" class="pair-stats__cell pair-stats__cell--high">
      <div class="tx-mono tx-tnum pair-stats__value">{{ stats24h.high }}</div>
      <div class="pair-stats__label">HIGH</div>
    </div>
    <div v-if="stats24h.low" class="pair-stats__cell pair-stats__cell--low">
      <div class="tx-mono tx-tnum pair-stats__value">{{ stats24h.low }}</div>
      <div class="pair-stats__label">LOW</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { useExchangePairs } from '../../composables/useExchangePairs'

const store = useExchangeStore()
const { activePair } = useExchangePairs()

const stats24h = ref<{ high: string | null; low: string | null; volume: string | null }>({
  high: null, low: null, volume: null,
})

const currentPrice = computed(() => {
  if (store.effectivePrice > 0) {
    const p = store.effectivePrice
    const dp = p >= 1000 ? 2 : p >= 1 ? 4 : p >= 0.01 ? 6 : 8
    return p.toFixed(dp)
  }
  return activePair.value?.lastPrice ?? null
})
const priceChange = computed<number | null>(() => activePair.value?.change24h ?? null)

const visible = computed(() =>
  !!(currentPrice.value || stats24h.value.high || stats24h.value.low),
)

function fmtPrice(p: number): string {
  if (!isFinite(p) || p <= 0) return '—'
  const dp = p >= 1000 ? 2 : p >= 1 ? 4 : p >= 0.01 ? 6 : 8
  return p.toFixed(dp)
}

// Backend returns daily candles newest-first. Pair button may swap
// display order vs pool order — invert high/low accordingly.
let statsTimer: number | null = null
async function loadStats24h() {
  const t0 = store.selectedToken0
  const t1 = store.selectedToken1
  if (!t0 || !t1) {
    stats24h.value = { high: null, low: null, volume: null }
    return
  }
  try {
    const candles = await store.getKlineData(t0, t1, { day: null } as any, true)
    if (!candles || candles.length === 0) return
    const latest = candles[0]
    const pair = activePair.value
    const swapped = pair ? (pair.base !== t0) : false
    const high = swapped && latest.high > 0 ? 1 / latest.low  : latest.high
    const low  = swapped && latest.low  > 0 ? 1 / latest.high : latest.low
    stats24h.value = {
      high: fmtPrice(high),
      low:  fmtPrice(low),
      volume: null,
    }
  } catch { /* soft-fail */ }
}

watch(
  [() => store.selectedToken0, () => store.selectedToken1],
  loadStats24h,
  { immediate: true },
)
onMounted(() => {
  statsTimer = window.setInterval(loadStats24h, 60_000)
})
onUnmounted(() => {
  if (statsTimer !== null) {
    clearInterval(statsTimer)
    statsTimer = null
  }
})
</script>

<style scoped>
.pair-stats {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-left: 6px;
}
.pair-stats__cell {
  display: flex;
  flex-direction: column;
}
.pair-stats__value {
  font-size: 13px;
  font-weight: 500;
  color: var(--tx-ink);
  line-height: 1.2;
}
.pair-stats__value--lg {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.1;
}
.pair-stats__label {
  font-size: 10px;
  color: var(--tx-ink-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 1px;
}

/* Progressive shed — drop the least-critical cell first so the cluster
   shrinks gracefully as the viewport narrows, without ever overlapping
   the nav tabs on the right. Last to go is LAST+24H. */
@media (max-width: 1280px) { .pair-stats__cell--low    { display: none; } }
@media (max-width: 1180px) { .pair-stats__cell--high   { display: none; } }
@media (max-width: 1080px) { .pair-stats__cell--change { display: none; } }
@media (max-width: 1024px) {
  .pair-stats { display: none; } /* brand + pair + tabs need all the room */
}
</style>
