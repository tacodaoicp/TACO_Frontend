<template>
  <div class="pool-list">
    <div v-if="loading" class="pool-list__loading">Loading pools...</div>

    <div v-else-if="pools.length > 0">
      <div class="pool-list__search">
        <input
          v-model="poolSearch"
          type="text"
          class="ex-input"
          placeholder="Search pools..."
        />
      </div>

      <!-- Header Row -->
      <div class="pool-list__header">
        <span class="pool-list__header-pair pool-list__header-sortable" @click="toggleSort('pair')">Pair{{ sortIndicator('pair') }}</span>
        <span class="pool-list__header-col pool-list__header-sortable" @click="toggleSort('tvl')">TVL{{ sortIndicator('tvl') }}</span>
        <span class="pool-list__header-col pool-list__header-sortable" @click="toggleSort('volume')">Vol 24h{{ sortIndicator('volume') }}</span>
        <span class="pool-list__header-col pool-list__header-sortable" @click="toggleSort('apr')">APR{{ sortIndicator('apr') }}</span>
        <span class="pool-list__header-col pool-list__header-sortable" @click="toggleSort('price')">Price{{ sortIndicator('price') }}</span>
        <span class="pool-list__header-col pool-list__header-sortable" @click="toggleSort('change')">24h{{ sortIndicator('change') }}</span>
        <span class="pool-list__header-chevron"></span>
      </div>

      <div class="pool-list__items">
      <div v-for="pool in filteredPools" :key="`${pool.token0}/${pool.token1}`" class="pool-list__item">
        <!-- Collapsed Row -->
        <div class="pool-list__row" @click="toggleExpand(pool)">
          <span class="pool-list__pair"><span class="pool-list__pair-name">{{ pool.symbol0 }}/{{ pool.symbol1 }}</span><span v-if="pool.isDust" class="ex-badge ex-badge--sm ex-badge--warning">Inactive</span></span>
          <span class="num pool-list__col">{{ pool.isDust ? '' : pool.totalValueUSD > 0 ? formatUSD(pool.totalValueUSD) : '—' }}</span>
          <span class="num pool-list__col">{{ pool.isDust ? '' : pool.volume24hUSD > 0 ? formatUSD(pool.volume24hUSD) : '—' }}</span>
          <span class="num pool-list__col pool-list__apr">{{ pool.isDust ? '' : formatAPR(pool.apr24h) }}</span>
          <span class="num pool-list__col">{{ pool.isDust ? '' : pool.priceFormatted }}</span>
          <span
            v-if="pool.priceChange24h !== 0"
            class="num pool-list__col"
            :class="pool.priceChange24h >= 0 ? 'pool-list__change--up' : 'pool-list__change--down'"
          >{{ pool.priceChange24h >= 0 ? '+' : '' }}{{ pool.priceChange24h.toFixed(2) }}%</span>
          <span v-else class="num pool-list__col">—</span>
          <span class="pool-list__chevron">{{ expandedPool === `${pool.token0}/${pool.token1}` ? '▾' : '▸' }}</span>
        </div>

        <!-- Expanded Detail Panel -->
        <div v-if="expandedPool === `${pool.token0}/${pool.token1}`" class="pool-list__detail">
          <div class="pool-list__detail-grid">
            <!-- Stats Column -->
            <div class="pool-list__detail-stats">
              <div class="pool-list__stat-row">
                <span>Reserve {{ pool.symbol0 }}</span>
                <span class="num">{{ pool.reserve0Formatted }} <span v-if="pool.reserve0USD > 0" class="pool-list__usd-hint">{{ formatUSD(pool.reserve0USD) }}</span></span>
              </div>
              <div class="pool-list__stat-row">
                <span>Reserve {{ pool.symbol1 }}</span>
                <span class="num">{{ pool.reserve1Formatted }} <span v-if="pool.reserve1USD > 0" class="pool-list__usd-hint">{{ formatUSD(pool.reserve1USD) }}</span></span>
              </div>
              <div class="pool-list__stat-row">
                <span>Price</span>
                <span class="num">{{ pool.priceFormatted }}</span>
              </div>
              <div class="pool-list__stat-row">
                <span>Fee</span>
                <span class="num">{{ (pool.feeRateBps / 100).toFixed(2) }}%</span>
              </div>
              <div v-if="pool.volume24hUSD > 0" class="pool-list__stat-row">
                <span>Volume 24h</span>
                <span class="num">{{ formatUSD(pool.volume24hUSD) }}</span>
              </div>
              <div class="pool-list__stat-row">
                <span>APR (24h)</span>
                <span class="num pool-list__apr">{{ formatAPR(pool.apr24h) }}</span>
              </div>
              <div v-if="pool.totalValueUSD > 0" class="pool-list__stat-row">
                <span>Total Value</span>
                <span class="num">{{ formatUSD(pool.totalValueUSD) }}</span>
              </div>
              <!-- Expanded stats from getPoolStats -->
              <template v-if="expandedStats">
                <div v-if="expandedStats.vol7dUSD > 0" class="pool-list__stat-row">
                  <span>Volume 7d</span>
                  <span class="num">{{ formatUSD(expandedStats.vol7dUSD) }}</span>
                </div>
                <div class="pool-list__stat-row">
                  <span>APR (7d)</span>
                  <span class="num pool-list__apr">{{ formatAPR(expandedStats.apr7d) }}</span>
                </div>
                <div v-if="expandedStats.feesLifetime0 > 0 || expandedStats.feesLifetime1 > 0" class="pool-list__stat-row">
                  <span>Lifetime Fees</span>
                  <span class="num">{{ expandedStats.feesLifetime0Formatted }} + {{ expandedStats.feesLifetime1Formatted }}</span>
                </div>
              </template>
            </div>

            <!-- Distribution Chart Column -->
            <div class="pool-list__detail-chart">
              <PoolLiquidityCurve
                v-if="pool.hasLiquidity"
                :token0="pool.token0"
                :token1="pool.token1"
                :decimals0="getDecimals(pool.token0)"
                :decimals1="getDecimals(pool.token1)"
                :current-price="pool.currentPrice"
              />
              <div v-else class="pool-list__no-chart">No liquidity data</div>
            </div>
          </div>

          <!-- Active Ranges -->
          <div v-if="expandedRanges.length > 0" class="pool-list__ranges">
            <h5>Active Ranges</h5>
            <div v-for="(range, i) in expandedRanges" :key="i" class="pool-list__range-row">
              <span class="num">{{ range.fullRange ? 'Full Range' : `${range.lower} — ${range.upper}` }}</span>
              <span class="num">{{ range.liquidityFormatted }} LP</span>
            </div>
          </div>

          <button class="ex-btn ex-btn--primary ex-btn--sm pool-list__add-btn" @click.stop="$emit('addLiquidity', pool.token0, pool.token1)">
            {{ pool.isDust ? 'Recreate Pool' : pool.hasLiquidity ? 'Add Liquidity' : 'Bootstrap Pool' }}
          </button>
        </div>
      </div>
    </div>
    </div>

    <div v-else class="pool-list__empty">No trading pairs configured.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { ratioToHumanPrice, formatRangePrice, isEffectivelyFullRange } from '../../utils/concentrated'
import { formatUSD } from '../../utils/format'
import PoolLiquidityCurve from './PoolLiquidityCurve.vue'

defineEmits<{
  addLiquidity: [token0: string, token1: string]
}>()

const store = useExchangeStore()

interface PoolRow {
  token0: string
  token1: string
  symbol0: string
  symbol1: string
  reserve0Formatted: string
  reserve1Formatted: string
  priceFormatted: string
  hasLiquidity: boolean
  isDust: boolean
  currentPrice: number
  reserve0USD: number
  reserve1USD: number
  totalValueUSD: number
  volume24hUSD: number
  feeRateBps: number
  apr24h: number
  priceChange24h: number
}

interface ExpandedStats {
  vol7dUSD: number
  apr7d: number
  feesLifetime0: number
  feesLifetime1: number
  feesLifetime0Formatted: string
  feesLifetime1Formatted: string
}

const pools = ref<PoolRow[]>([])
const loading = ref(true)
const expandedPool = ref<string | null>(null)
const poolSearch = ref('')
const expandedStats = ref<ExpandedStats | null>(null)

type SortKey = 'pair' | 'tvl' | 'volume' | 'apr' | 'price' | 'change'
const sortKey = ref<SortKey>('tvl')
const sortAsc = ref(false)

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = false
  }
}

function sortIndicator(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortAsc.value ? ' ▲' : ' ▼'
}

const filteredPools = computed(() => {
  let list = pools.value
  const q = poolSearch.value.toLowerCase().trim()
  if (q) {
    list = list.filter(p =>
      p.symbol0.toLowerCase().includes(q) ||
      p.symbol1.toLowerCase().includes(q) ||
      `${p.symbol0}/${p.symbol1}`.toLowerCase().includes(q)
    )
  }

  const dir = sortAsc.value ? 1 : -1
  return [...list].sort((a, b) => {
    switch (sortKey.value) {
      case 'pair': return dir * `${a.symbol0}/${a.symbol1}`.localeCompare(`${b.symbol0}/${b.symbol1}`)
      case 'tvl': return dir * (a.totalValueUSD - b.totalValueUSD)
      case 'volume': return dir * (a.volume24hUSD - b.volume24hUSD)
      case 'apr': return dir * (a.apr24h - b.apr24h)
      case 'price': return dir * (a.currentPrice - b.currentPrice)
      case 'change': return dir * (a.priceChange24h - b.priceChange24h)
      default: return 0
    }
  })
})
const expandedRanges = ref<{ lower: string; upper: string; liquidityFormatted: string; fullRange: boolean }[]>([])

function getDecimals(address: string): number {
  return Number(store.tokens.find(t => t.address === address)?.decimals ?? 8)
}

// Fallback when the per-pool lpFeeSharePct isn't available (getAllPoolStats
// doesn't return it today — only getPoolStats does). 70 mirrors the backend's
// current convention. Once getAllPoolStats exposes lpFeeSharePct, read it
// from stats instead of this constant.
const LP_FEE_SHARE_PCT_DEFAULT = 70

function computePoolMetrics(stats: any) {
  const p0usd = store.getTokenPriceUSD(stats.token0)
  const p1usd = store.getTokenPriceUSD(stats.token1)
  const dec0 = Number(stats.decimals0)
  const dec1 = Number(stats.decimals1)
  const tvl = (Number(stats.reserve0) / 10 ** dec0) * p0usd
            + (Number(stats.reserve1) / 10 ** dec1) * p1usd
  // CONTRACT: backend returns volume in token1 (quote) base units (post-2026-04-17 backend upgrade).
  const vol24hUSD = (Number(stats.volume24h) / 10 ** dec1) * p1usd
  const feeRate = Number(stats.feeRateBps)
  const lpShare = Number(stats.lpFeeSharePct ?? LP_FEE_SHARE_PCT_DEFAULT)
  const fee24hUSD = vol24hUSD * feeRate * lpShare / (10000 * 100)
  const apr24h = tvl > 0 ? (fee24hUSD * 365 / tvl) * 100 : 0
  return { tvl, vol24hUSD, fee24hUSD, apr24h }
}

// Display-friendly APR: avoids rounding genuinely tiny-but-positive yields
// down to "0.00 %" (which reads as "no yield" even when the pool earns fees).
function formatAPR(apr: number): string {
  if (!apr || apr <= 0) return '—'
  if (apr < 0.01) return '< 0.01%'
  if (apr < 1) return apr.toFixed(2) + '%'
  return apr.toFixed(1) + '%'
}

const BASE_TOKENS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',
  'xevnm-gaaaa-aaaar-qafnq-cai',
])

async function toggleExpand(pool: PoolRow) {
  const key = `${pool.token0}/${pool.token1}`
  if (expandedPool.value === key) {
    expandedPool.value = null
    expandedRanges.value = []
    expandedStats.value = null
    return
  }

  expandedPool.value = key
  expandedRanges.value = []
  expandedStats.value = null

  // Lazy-load ranges and detailed stats in parallel
  const rangesPromise = pool.hasLiquidity
    ? store.getPoolRanges(pool.token0, pool.token1).catch(() => [])
    : Promise.resolve([])

  const statsPromise = store.getPoolStats(pool.token0, pool.token1).catch(() => [])

  const [ranges, detailResult] = await Promise.all([rangesPromise, statsPromise])

  // Process ranges
  const dec0 = getDecimals(pool.token0)
  const dec1 = getDecimals(pool.token1)
  expandedRanges.value = (ranges as any[])
    .filter((r: any) => Number(r.liquidity) > 0)
    .sort((a: any, b: any) => Number(b.liquidity) - Number(a.liquidity))
    .slice(0, 10)
    .map((r: any) => {
      const lower = ratioToHumanPrice(r.ratioLower, dec0, dec1)
      const upper = ratioToHumanPrice(r.ratioUpper, dec0, dec1)
      const lowerStr = formatRangePrice(lower)
      const upperStr = formatRangePrice(upper)
      // Detect full range: either by sentinel values or when both bounds round to zero
      const fullRange = isEffectivelyFullRange(r.ratioLower, r.ratioUpper)
        || (lowerStr === '0' && upperStr === '0')
      return {
        lower: fullRange ? '0' : lowerStr,
        upper: fullRange ? '∞' : upperStr,
        liquidityFormatted: Number(r.liquidity).toLocaleString(),
        fullRange,
      }
    })

  // Process detailed pool stats
  const detail = Array.isArray(detailResult) ? detailResult[0] : detailResult
  if (detail && 'volume7d' in detail) {
    const p0usd = store.getTokenPriceUSD(pool.token0)
    const p1usd = store.getTokenPriceUSD(pool.token1)
    const vol7dUSD = (Number(detail.volume7d) / 10 ** dec1) * p1usd
    const feeRate = Number(detail.feeRateBps)
    const lpShare = Number(detail.lpFeeSharePct ?? LP_FEE_SHARE_PCT_DEFAULT)
    const fee7dUSD = vol7dUSD * feeRate * lpShare / (10000 * 100)
    const apr7d = pool.totalValueUSD > 0 ? (fee7dUSD * 52 / pool.totalValueUSD) * 100 : 0

    const f0 = Number(detail.feesLifetimeToken0) / 10 ** dec0
    const f1 = Number(detail.feesLifetimeToken1) / 10 ** dec1

    expandedStats.value = {
      vol7dUSD,
      apr7d,
      feesLifetime0: f0,
      feesLifetime1: f1,
      feesLifetime0Formatted: f0 > 0 ? f0.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' ' + pool.symbol0 : '—',
      feesLifetime1Formatted: f1 > 0 ? f1.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' ' + pool.symbol1 : '—',
    }
  }
}

onMounted(async () => {
  try {
    const allStats = await store.getAllPoolStats().catch(() => []) as any[]

    if (allStats.length > 0) {
      const seen = new Set<string>()
      pools.value = allStats.map((stats: any) => {
        let t0 = stats.token0 as string
        let t1 = stats.token1 as string
        let s0 = stats.symbol0 as string
        let s1 = stats.symbol1 as string

        // Reorder: non-base / base — swap everything including reserves/decimals
        const swapped = BASE_TOKENS.has(t0) && !BASE_TOKENS.has(t1)
        if (swapped) {
          ;[t0, t1] = [t1, t0]
          ;[s0, s1] = [s1, s0]
        }

        const key = [t0, t1].sort().join('/')
        if (seen.has(key)) return null
        seen.add(key)

        const dec0 = Number(swapped ? stats.decimals1 : stats.decimals0)
        const dec1 = Number(swapped ? stats.decimals0 : stats.decimals1)
        const r0 = Number(swapped ? stats.reserve1 : stats.reserve0) / 10 ** dec0
        const r1 = Number(swapped ? stats.reserve0 : stats.reserve1) / 10 ** dec1

        // Price: if we swapped token order, invert the price
        let price = stats.price0 as number
        if (swapped && price > 0) {
          price = 1 / price
        }
        // Fallback: derive from reserves if price0 is 0
        if (price <= 0 && r0 > 0 && r1 > 0) {
          price = r1 / r0
        }

        const { tvl, vol24hUSD, apr24h } = computePoolMetrics(stats)
        const r0usd = r0 * store.getTokenPriceUSD(t0)
        const r1usd = r1 * store.getTokenPriceUSD(t1)

        return {
          token0: t0,
          token1: t1,
          symbol0: s0,
          symbol1: s1,
          reserve0Formatted: r0 > 0 ? r0.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—',
          reserve1Formatted: r1 > 0 ? r1.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—',
          priceFormatted: price > 0 ? price.toFixed(6) : '—',
          hasLiquidity: r0 > 0 && r1 > 0,
          isDust: (r0 > 0 || r1 > 0) && (
            r0 < Number(store.getTokenByAddress(t0)?.minimum_amount ?? 0n) * 10 / 10 ** dec0 ||
            r1 < Number(store.getTokenByAddress(t1)?.minimum_amount ?? 0n) * 10 / 10 ** dec1
          ),
          currentPrice: price,
          reserve0USD: r0usd,
          reserve1USD: r1usd,
          totalValueUSD: tvl > 0 ? tvl : r0usd + r1usd,
          volume24hUSD: vol24hUSD,
          feeRateBps: Number(stats.feeRateBps),
          apr24h,
          priceChange24h: stats.priceChange24hPct as number,
        }
      }).filter((p: PoolRow | null): p is PoolRow => p !== null)

      pools.value.sort((a, b) => {
        if (a.hasLiquidity !== b.hasLiquidity) return a.hasLiquidity ? -1 : 1
        if (b.totalValueUSD !== a.totalValueUSD) return b.totalValueUSD - a.totalValueUSD
        return b.volume24hUSD - a.volume24hUSD
      })
    } else {
      // Fallback to old method if getAllPoolStats not available
      const info = store.exchangeInfoData
      const ammPools = await store.getAllAMMPools().catch(() => []) as any[]
      const ammByPair = new Map<string, any>()
      for (const p of ammPools) {
        const pt0 = p.token0 ?? ''
        const pt1 = p.token1 ?? ''
        ammByPair.set(`${pt0}/${pt1}`, p)
        ammByPair.set(`${pt1}/${pt0}`, p)
      }

      if (info?.pool_canister?.length) {
        const seen = new Set<string>()
        pools.value = info.pool_canister.map((pair: [string, string]) => {
          let [t0, t1] = pair
          if (BASE_TOKENS.has(t0) && !BASE_TOKENS.has(t1)) { ;[t0, t1] = [t1, t0] }
          const key = [t0, t1].sort().join('/')
          if (seen.has(key)) return null
          seen.add(key)

          const info0 = store.getTokenByAddress(t0)
          const info1 = store.getTokenByAddress(t1)
          if (!info0 || !info1) return null
          const dec0 = Number(info0.decimals)
          const dec1 = Number(info1.decimals)

          const amm = ammByPair.get(`${t0}/${t1}`)
          const r0 = amm ? Number(amm.reserve0 ?? 0n) / 10 ** dec0 : 0
          const r1 = amm ? Number(amm.reserve1 ?? 0n) / 10 ** dec1 : 0
          const price = r0 > 0 ? r1 / r0 : 0
          const r0usd = r0 * store.getTokenPriceUSD(t0)
          const r1usd = r1 * store.getTokenPriceUSD(t1)

          return {
            token0: t0, token1: t1,
            symbol0: info0.symbol ?? t0.slice(0, 5) + '...',
            symbol1: info1.symbol ?? t1.slice(0, 5) + '...',
            reserve0Formatted: r0 > 0 ? r0.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—',
            reserve1Formatted: r1 > 0 ? r1.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—',
            priceFormatted: price > 0 ? price.toFixed(6) : '—',
            hasLiquidity: r0 > 0 && r1 > 0,
            isDust: (r0 > 0 || r1 > 0) && (
              r0 < Number(info0.minimum_amount ?? 0n) * 10 / 10 ** dec0 ||
              r1 < Number(info1.minimum_amount ?? 0n) * 10 / 10 ** dec1
            ),
            currentPrice: price,
            reserve0USD: r0usd, reserve1USD: r1usd,
            totalValueUSD: r0usd + r1usd,
            volume24hUSD: 0, feeRateBps: Number(store.tradingFeeBps),
            apr24h: 0, priceChange24h: 0,
          }
        }).filter((p: PoolRow | null): p is PoolRow => p !== null)

        pools.value.sort((a, b) => {
          if (a.hasLiquidity !== b.hasLiquidity) return a.hasLiquidity ? -1 : 1
          if (b.totalValueUSD !== a.totalValueUSD) return b.totalValueUSD - a.totalValueUSD
          return b.volume24hUSD - a.volume24hUSD
        })
      }
    }
  } catch (err) {
    console.error('[PoolList] Load error:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.pool-list {
  &__search {
    padding: var(--space-3);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: var(--weight-medium);
    border-bottom: 1px solid var(--border-primary);
    background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
  }

  &__header-pair {
    min-width: 100px;
    flex-shrink: 0;
  }

  &__header-col {
    flex: 1;
    text-align: right;
  }

  &__header-sortable {
    cursor: pointer;
    user-select: none;
    &:hover { color: var(--text-primary); }
  }

  &__header-chevron {
    width: 16px;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--border-primary);
  }

  &__item {
    background: var(--bg-secondary);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    transition: background 0.1s;

    &:hover { background: var(--bg-tertiary); }
  }

  &__pair {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    width: 160px;
    min-width: 160px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__pair-name {
    min-width: 90px;
    display: inline-block;
  }


  &__col {
    flex: 1;
    text-align: right;
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  &__apr {
    color: var(--color-buy);
  }

  &__change--up { color: var(--color-buy); }
  &__change--down { color: var(--color-sell); }

  &__chevron {
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    width: 16px;
    text-align: center;
  }

  &__detail {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border-primary);
    background: var(--bg-primary);
  }

  &__detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    margin-bottom: var(--space-3);

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  &__detail-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__stat-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__detail-chart {
    height: 180px;
    background: var(--bg-tertiary);
    border-radius: 6px;
    overflow: hidden;
  }

  &__no-chart {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-tertiary);
    font-size: var(--text-xs);
  }

  &__ranges {
    margin-bottom: var(--space-3);

    h5 {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      margin: 0 0 var(--space-1);
    }
  }

  &__range-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    padding: 2px 0;
  }

  &__usd-hint {
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    margin-left: var(--space-1);
  }

  &__add-btn {
    width: 100%;
  }

  &__loading, &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }
}
</style>
