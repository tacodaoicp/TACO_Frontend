<template>
  <div class="pool-liq-curve">
    <template v-if="bars.length > 0">
      <LiquidityCurve
        readonly
        :min-pct="0"
        :max-pct="100"
        :current-price-pct="50"
        :real-bars="bars"
      />
      <div class="pool-liq-curve__axis">
        <span v-for="(label, i) in axisLabels" :key="i">{{ label }}</span>
      </div>
    </template>
    <div v-else class="pool-liq-curve__empty">No liquidity data</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { ratioToHumanPrice, isEffectivelyFullRange, formatRangePrice } from '../../utils/concentrated'
import LiquidityCurve, { type LiquidityBar } from '../common/LiquidityCurve.vue'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  /** token1-per-token0 in human units. */
  currentPrice: number
}>()

const store = useExchangeStore()
const ranges = ref<Array<any>>([])
const rangesLoaded = ref(false)

async function loadRanges() {
  if (!props.token0 || !props.token1) {
    ranges.value = []
    rangesLoaded.value = true
    return
  }
  try {
    const raw = await store.getPoolRanges(props.token0, props.token1)
    ranges.value = Array.isArray(raw) ? raw : []
  } catch {
    ranges.value = []
  } finally {
    rangesLoaded.value = true
  }
}

// Some pools (V2-only AMMs) don't return their full-range liquidity through
// `getPoolRanges`. When the call comes back empty but the pool has a price,
// synthesize a single full-range entry so the curve still renders a sensible
// bell shape. Absolute height is arbitrary — LiquidityCurve normalizes to max.
const effectiveRanges = computed(() => {
  if (ranges.value.length > 0) return ranges.value
  if (!rangesLoaded.value || props.currentPrice <= 0) return []
  return [{
    liquidity: 1e12,
    ratioLower: 10n ** 20n,
    ratioUpper: 10n ** 120n,
  }]
})

// Same V3 "TVL by price" curve as AddLiquidity, but with a fixed ±4× window
// and no inversion (token1 per token0 throughout).
const CURVE_COLUMNS = 60
const CHART_RANGE = 4
function pctToPrice(pct: number, base: number): number {
  if (base <= 0) return 0
  return base * Math.exp(((pct - 50) / 50) * Math.log(CHART_RANGE))
}

const bars = computed<LiquidityBar[]>(() => {
  if (props.currentPrice <= 0 || effectiveRanges.value.length === 0) return []
  const pNow = props.currentPrice
  const dec0 = 10 ** props.decimals0
  const dec1 = 10 ** props.decimals1
  // The canister stores L in a normalized space; converting V3 amounts
  // back to raw token units needs a decimal-half-scale correction (same
  // factors used in `liquidityToAmounts` in utils/concentrated.ts).
  // Without these, mismatched decimals (e.g. ICP 8 vs ckUSDC 6) skew the
  // bell curve toward the larger-decimals side.
  const decHalf = (props.decimals0 - props.decimals1) / 2
  const scale0  = Math.pow(10,  decHalf) // → token0 raw
  const scale1  = Math.pow(10, -decHalf) // → token1 raw

  const colLo = new Array<number>(CURVE_COLUMNS)
  const colHi = new Array<number>(CURVE_COLUMNS)
  for (let c = 0; c < CURVE_COLUMNS; c++) {
    colLo[c] = pctToPrice((c / CURVE_COLUMNS) * 100, pNow)
    colHi[c] = pctToPrice(((c + 1) / CURVE_COLUMNS) * 100, pNow)
  }

  const cells = new Array<number>(CURVE_COLUMNS).fill(0)
  for (const r of effectiveRanges.value) {
    const L = Number(r.liquidity)
    if (!isFinite(L) || L <= 0) continue
    let paN: number, pbN: number
    if (isEffectivelyFullRange(r.ratioLower, r.ratioUpper)) {
      paN = 0
      pbN = Infinity
    } else {
      paN = ratioToHumanPrice(r.ratioLower, props.decimals0, props.decimals1)
      pbN = ratioToHumanPrice(r.ratioUpper, props.decimals0, props.decimals1)
      if (!isFinite(paN) || paN <= 0 || pbN <= paN) continue
    }
    for (let c = 0; c < CURVE_COLUMNS; c++) {
      const lo = Math.max(paN, colLo[c])
      const hi = Math.min(pbN, colHi[c])
      if (hi <= lo) continue
      let amount0 = 0, amount1 = 0
      if (hi <= pNow) amount1 = L * (Math.sqrt(hi) - Math.sqrt(lo)) * scale1
      else if (lo >= pNow) amount0 = L * (1 / Math.sqrt(lo) - 1 / Math.sqrt(hi)) * scale0
      else {
        amount1 = L * (Math.sqrt(pNow) - Math.sqrt(lo)) * scale1
        amount0 = L * (1 / Math.sqrt(pNow) - 1 / Math.sqrt(hi)) * scale0
      }
      // Express both legs in token1-human units via the current price. Doesn't
      // depend on cross-token USD lookups (so the curve renders even when one
      // side of the pair has no USD price feed).
      cells[c] += (amount1 / dec1) + (amount0 / dec0) * pNow
    }
  }

  const out: LiquidityBar[] = []
  for (let c = 0; c < CURVE_COLUMNS; c++) {
    if (cells[c] <= 0) continue
    out.push({
      pctLow:  (c / CURVE_COLUMNS) * 100,
      pctHigh: ((c + 1) / CURVE_COLUMNS) * 100,
      liquidity: Math.sqrt(cells[c]),
    })
  }
  return out
})

// 6 evenly-spaced price labels across the chart range.
const axisLabels = computed<string[]>(() => {
  if (props.currentPrice <= 0) return []
  return [0, 20, 40, 60, 80, 100].map(p =>
    formatRangePrice(pctToPrice(p, props.currentPrice)),
  )
})

watch(() => `${props.token0}|${props.token1}`, () => {
  rangesLoaded.value = false
  loadRanges()
})
onMounted(loadRanges)
</script>

<style scoped lang="scss">
.pool-liq-curve {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.pool-liq-curve__axis {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px 0;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--tx-ink-3, var(--text-tertiary));
}
.pool-liq-curve__empty {
  align-self: center;
  color: var(--tx-ink-3, var(--text-tertiary));
  font-size: 12px;
}
</style>
