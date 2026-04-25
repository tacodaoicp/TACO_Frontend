import { computed } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { formatUSD } from '../utils/format'

export interface PairOption {
  base: string
  quote: string
  baseSymbol: string
  quoteSymbol: string
  lastPrice: string | null
  priceUSD: string | null
  change24h: number | null
  volume24h: bigint | null
  tvlUSD: number
}

// Canonical base/quote orientation — display non-base on the LEFT
// (e.g. TACO/ICP, not ICP/TACO).
const BASE_TOKEN_IDS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai',  // ckUSDC
])

export function useExchangePairs() {
  const store = useExchangeStore()

  function isBaseToken(addr: string): boolean {
    return BASE_TOKEN_IDS.has(addr)
  }

  const availablePairs = computed((): PairOption[] => {
    const info = store.exchangeInfoData
    if (!info?.pool_canister?.length) return []

    const pairs: PairOption[] = []
    const seen = new Set<string>()

    for (let i = 0; i < info.pool_canister.length; i++) {
      const [t0, t1] = info.pool_canister[i]
      const token0Info = store.getTokenByAddress(t0)
      const token1Info = store.getTokenByAddress(t1)
      if (!token0Info || !token1Info) continue

      // Reorder: display non-base first
      let displayBase = t0, displayQuote = t1
      let baseInfo = token0Info, quoteInfo = token1Info
      let swapped = false
      if (isBaseToken(t0) && !isBaseToken(t1)) {
        displayBase = t1; displayQuote = t0
        baseInfo = token1Info; quoteInfo = token0Info
        swapped = true
      }

      const dedupKey = [displayBase, displayQuote].sort().join('|')
      if (seen.has(dedupKey)) continue
      seen.add(dedupKey)

      // Backend prices are in pool order — invert when our display order differs.
      const rawPrice = info.last_traded_price?.[i] ?? 0
      const rawPriceBefore = info.price_day_before?.[i] ?? 0

      let displayPrice = rawPrice
      let displayPriceBefore = rawPriceBefore
      if (swapped && rawPrice > 0) {
        displayPrice = 1 / rawPrice
        displayPriceBefore = rawPriceBefore > 0 ? 1 / rawPriceBefore : 0
      }

      const change = displayPriceBefore > 0
        ? ((displayPrice - displayPriceBefore) / displayPriceBefore) * 100
        : null

      // Resolve USD price via base, then quote, then known stables.
      const ICP_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
      const CKUSDC_ID = 'xevnm-gaaaa-aaaar-qafnq-cai'
      const baseUSD = store.getTokenPriceUSD(displayBase)
      let usdPrice: number | null = baseUSD > 0 ? baseUSD : null
      if (usdPrice === null && displayPrice > 0) {
        const quoteUSD = store.getTokenPriceUSD(displayQuote)
        if (quoteUSD > 0) usdPrice = displayPrice * quoteUSD
      }
      if (usdPrice === null && displayPrice > 0) {
        if (displayQuote === ICP_ID && store.icpPriceUSD > 0) {
          usdPrice = displayPrice * store.icpPriceUSD
        } else if (displayQuote === CKUSDC_ID) {
          usdPrice = displayPrice
        }
      }

      const maxDec = Math.max(Number(baseInfo.decimals), Number(quoteInfo.decimals))
      const priceDp = displayPrice >= 1000 ? 2 : displayPrice >= 1 ? 4 : Math.min(6, maxDec)
      const usdFormatted = usdPrice !== null ? formatUSD(usdPrice) : null

      const r0raw = info.amm_reserve0?.[i] ?? 0n
      const r1raw = info.amm_reserve1?.[i] ?? 0n
      const dec0 = Number(token0Info.decimals)
      const dec1 = Number(token1Info.decimals)
      const r0val = Number(r0raw) / 10 ** dec0
      const r1val = Number(r1raw) / 10 ** dec1
      const p0usd = store.getTokenPriceUSD(t0)
      const p1usd = store.getTokenPriceUSD(t1)
      const tvlUSD = r0val * p0usd + r1val * p1usd

      pairs.push({
        base: displayBase,
        quote: displayQuote,
        baseSymbol: baseInfo.symbol,
        quoteSymbol: quoteInfo.symbol,
        lastPrice: displayPrice > 0 ? displayPrice.toFixed(priceDp) : null,
        priceUSD: usdFormatted,
        change24h: change,
        volume24h: info.volume_24h?.[i] ?? null,
        tvlUSD,
      })
    }

    // Default sort: TVL desc, volume as tiebreaker
    pairs.sort((a, b) => {
      if (b.tvlUSD !== a.tvlUSD) return b.tvlUSD - a.tvlUSD
      const va = Number(a.volume24h ?? 0n)
      const vb = Number(b.volume24h ?? 0n)
      return vb - va
    })

    return pairs
  })

  const activePair = computed(() =>
    availablePairs.value.find(
      p => p.base === store.selectedToken0 && p.quote === store.selectedToken1,
    ) ?? null,
  )

  return { availablePairs, activePair }
}
