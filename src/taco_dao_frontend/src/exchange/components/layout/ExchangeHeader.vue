<template>
  <div class="ex-header-wrap" :class="{ 'ex-header-wrap--compact': isCompact }">
  <header class="ex-header" :class="{ 'ex-header--compact': isCompact }">
    <!-- LEFT: brand lockup + pair selector + stat cluster -->
    <div class="ex-header__left">
      <router-link to="/" class="ex-header__brand" aria-label="TACO Exchange home">
        <ExchangeBrandMark />
        <span class="ex-header__brand-text">
          taco<span class="tx-orange">·</span>exchange
        </span>
        <span
          v-if="!isCompact"
          class="tx-badge tx-badge--orange tx-badge--square ex-header__brand-badge"
        >PRO</span>
      </router-link>

      <div class="ex-header__divider" />

      <!-- Pair selector -->
      <div class="ex-header__pair" ref="pairDropdownRef">
        <button
          class="ex-header__pair-btn"
          @click="showPairSelector = !showPairSelector"
          aria-haspopup="listbox"
          :aria-expanded="showPairSelector"
        >
          <span class="ex-header__pair-mark" v-if="baseIcon || quoteIcon">
            <img v-if="baseIcon"  :src="baseIcon"  width="16" height="16" />
            <img v-if="quoteIcon" :src="quoteIcon" class="ex-header__pair-mark--quote" width="16" height="16" />
          </span>
          <span v-else class="ex-header__pair-markfallback">t</span>
          <span class="ex-header__pair-symbols">{{ currentPairLabel }}</span>
          <span class="tx-ink-3 ex-header__pair-chev" :class="{ 'ex-header__pair-chev--open': showPairSelector }">▾</span>
        </button>

        <div v-if="showPairSelector" class="ex-header__pair-dropdown">
          <input
            ref="pairSearchRef"
            v-model="pairSearch"
            class="ex-input ex-header__pair-search"
            placeholder="Search pairs..."
            @keydown.escape="showPairSelector = false"
          />
          <div class="ex-header__pair-hdr">
            <span class="ex-header__pair-hdr-col ex-header__pair-hdr-name" @click="togglePairSort('pair')">Pair{{ pairSortIndicator('pair') }}</span>
            <span class="ex-header__pair-hdr-col" @click="togglePairSort('usd')">USD{{ pairSortIndicator('usd') }}</span>
            <span class="ex-header__pair-hdr-col" @click="togglePairSort('price')">Price{{ pairSortIndicator('price') }}</span>
            <span class="ex-header__pair-hdr-col" @click="togglePairSort('change')">24h{{ pairSortIndicator('change') }}</span>
          </div>
          <div class="ex-header__pair-list" role="listbox">
            <div v-if="filteredPairs.length === 0" class="ex-header__pair-empty">
              No pairs found
            </div>
            <button
              v-for="pair in filteredPairs"
              :key="`${pair.base}-${pair.quote}`"
              class="ex-header__pair-option"
              :class="{ 'ex-header__pair-option--active': pair.base === selectedBase && pair.quote === selectedQuote }"
              role="option"
              @click="selectPair(pair)"
            >
              <span class="ex-header__pair-name">{{ pair.baseSymbol }}/{{ pair.quoteSymbol }}</span>
              <span v-if="pair.priceUSD" class="ex-header__pair-usd num">{{ pair.priceUSD }}</span>
              <span class="ex-header__pair-price num">{{ pair.lastPrice ?? '—' }}</span>
              <span
                v-if="pair.change24h !== null"
                class="ex-header__pair-change num"
                :class="pair.change24h >= 0 ? 'ex-header__pair-change--up' : 'ex-header__pair-change--down'"
              >{{ pair.change24h >= 0 ? '+' : '' }}{{ pair.change24h.toFixed(2) }}%</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stat cluster — value above, eyebrow below (Figma PT_Header).
           Hidden in compact (/trade) mode — the mobile body has its own
           price row. -->
      <div v-if="!isCompact" class="ex-header__stats">
        <div v-if="showHeaderPrice" class="ex-header__stat">
          <div
            class="tx-mono tx-tnum ex-header__stat-value ex-header__stat-value--lg"
            :class="[priceFlashClass, priceChange !== null && priceChange >= 0 ? 'tx-buy' : priceChange !== null ? 'tx-sell' : '']"
          >{{ currentPrice }}</div>
          <div class="ex-header__stat-label">LAST</div>
        </div>
        <div v-if="priceChange !== null" class="ex-header__stat">
          <div
            class="tx-mono tx-tnum ex-header__stat-value"
            :class="priceChange >= 0 ? 'tx-buy' : 'tx-sell'"
          >{{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%</div>
          <div class="ex-header__stat-label">24H</div>
        </div>
        <div v-if="stats24h.high" class="ex-header__stat">
          <div class="tx-mono tx-tnum ex-header__stat-value">{{ stats24h.high }}</div>
          <div class="ex-header__stat-label">HIGH</div>
        </div>
        <div v-if="stats24h.low" class="ex-header__stat">
          <div class="tx-mono tx-tnum ex-header__stat-value">{{ stats24h.low }}</div>
          <div class="ex-header__stat-label">LOW</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: nav + tools + wallet -->
    <div class="ex-header__right">
      <!-- Secondary nav hidden on mobile /trade — MobileNav below handles it. -->
      <nav v-if="!isCompact" class="ex-header__nav">
        <router-link to="/easy"      class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path === '/easy' }">Easy</router-link>
        <router-link to="/pool"      class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path === '/pool' }">Pool</router-link>
        <router-link to="/portfolio" class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path === '/portfolio' }">Portfolio</router-link>
        <router-link to="/otc"       class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path.startsWith('/otc') }">OTC</router-link>
      </nav>

      <div v-if="!isCompact" class="ex-header__divider" />

      <div
        v-if="callsRemaining < 10"
        class="ex-header__rate-limit"
        :class="{
          'ex-header__rate-limit--warning': callsRemaining <= 5,
          'ex-header__rate-limit--danger': callsRemaining <= 2,
        }"
        :title="`${callsRemaining} update calls remaining (resets in ~90s)`"
      >
        {{ callsRemaining }}/21
      </div>

      <ThemeToggle />

      <WalletButton />
    </div>
  </header>

  <!-- Mobile stats bar (narrow viewports). Skipped in compact mode —
       MobileTradeView has its own price hero directly below the header. -->
  <div v-if="!isCompact" class="ex-header-mobile-stats">
    <span v-if="showHeaderPrice" class="ex-header-mobile-stats__price num" :class="priceFlashClass">
      {{ currentPrice }}
    </span>
    <span v-if="showHeaderPrice && currentPriceUSD" class="ex-header-mobile-stats__usd num">{{ currentPriceUSD }}</span>
    <span v-if="showHeaderPrice && priceChange !== null" class="ex-header-mobile-stats__change num" :class="priceChange >= 0 ? 'ex-header-mobile-stats__change--up' : 'ex-header-mobile-stats__change--down'">
      {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
    </span>
    <span v-if="stats24h.high" class="ex-header-mobile-stats__item">H <span class="num">{{ stats24h.high }}</span></span>
    <span v-if="stats24h.low" class="ex-header-mobile-stats__item">L <span class="num">{{ stats24h.low }}</span></span>
    <span v-if="stats24h.volume" class="ex-header-mobile-stats__item">Vol <span class="num">{{ stats24h.volume }}</span></span>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExchangeStore } from '../../store/exchange.store'
import { ADMIN_PRINCIPALS } from '../../../composables/useAdminCheck'
import { getTokenIcon } from '../../utils/token-icons'
import { formatUSD } from '../../utils/format'
import { useExchangeToast } from '../../composables/useExchangeToast'
import ThemeToggle from '../common/ThemeToggle.vue'
import ExchangeBrandMark from '../common/ExchangeBrandMark.vue'
import WalletButton from '../common/WalletButton.vue'

const router = useRouter()
const route = useRoute()
const exchangeStore = useExchangeStore()

const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(exchangeStore.principalText))

// Compact variant — used on the mobile /trade route. Hides the PRO badge,
// the stat cluster, and the secondary nav so the header matches the mobile
// body layout instead of the desktop Pro chrome. Pair selector + theme
// toggle + wallet chip stay.
const isCompact = computed(() => route.meta?.mode === 'trade')

const baseIcon = computed(() => {
  const t = exchangeStore.getTokenByAddress(exchangeStore.selectedToken0)
  return t ? getTokenIcon(t.symbol, t.name) : null
})

const quoteIcon = computed(() => {
  const t = exchangeStore.getTokenByAddress(exchangeStore.selectedToken1)
  return t ? getTokenIcon(t.symbol, t.name) : null
})

// ── Pair State (shared via store) ──
const selectedBase = computed({
  get: () => exchangeStore.selectedToken0,
  set: (v: string) => { exchangeStore.selectedToken0 = v },
})
const selectedQuote = computed({
  get: () => exchangeStore.selectedToken1,
  set: (v: string) => { exchangeStore.selectedToken1 = v },
})
const showPairSelector = ref(false)
const pairSearch = ref('')
const pairDropdownRef = ref<HTMLElement | null>(null)
const pairSearchRef = ref<HTMLInputElement | null>(null)

const currentPairLabel = computed(() => {
  if (!selectedBase.value || !selectedQuote.value) return 'Select Pair'
  const base = exchangeStore.getTokenByAddress(selectedBase.value)
  const quote = exchangeStore.getTokenByAddress(selectedQuote.value)
  return `${base?.symbol ?? '???'} / ${quote?.symbol ?? '???'}`
})

interface PairOption {
  base: string
  quote: string
  baseSymbol: string
  quoteSymbol: string
  lastPrice: string | null
  priceUSD: string | null
  change24h: number | null
  volume24h: bigint | null
  tvlUSD: number  // for default sort
}

// Base tokens — always shown as quote (second) in pair display
const BASE_TOKEN_IDS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai',  // ckUSDC
  'cngnf-vqaaa-aaaar-qag4q-cai',  // ckUSDT
])

function isBaseToken(address: string): boolean {
  return BASE_TOKEN_IDS.has(address)
}

const availablePairs = computed((): PairOption[] => {
  const info = exchangeStore.exchangeInfoData
  if (!info?.pool_canister?.length) return []

  const pairs: PairOption[] = []
  const seen = new Set<string>()

  for (let i = 0; i < info.pool_canister.length; i++) {
    const [t0, t1] = info.pool_canister[i]
    // Skip unknown tokens
    const token0Info = exchangeStore.getTokenByAddress(t0)
    const token1Info = exchangeStore.getTokenByAddress(t1)
    if (!token0Info || !token1Info) continue

    // Order: non-base / base (e.g., TACO/ICP not ICP/TACO)
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

    // Price from exchangeInfo (now correctly scaled by backend)
    const rawPrice = info.last_traded_price?.[i] ?? 0
    const rawPriceBefore = info.price_day_before?.[i] ?? 0

    if (baseInfo.symbol === 'TACO' || quoteInfo.symbol === 'TACO') {
      console.log(`[Header] TACO pool: canonical=(${token0Info.symbol}, ${token1Info.symbol}), display=(${baseInfo.symbol}/${quoteInfo.symbol}), swapped=${swapped}, rawPrice=${rawPrice}, 1/rawPrice=${rawPrice > 0 ? 1/rawPrice : 0}`)
    }

    // If display order is swapped from pool order, invert the price
    let displayPrice = rawPrice
    let displayPriceBefore = rawPriceBefore
    if (swapped && rawPrice > 0) {
      displayPrice = 1 / rawPrice
      displayPriceBefore = rawPriceBefore > 0 ? 1 / rawPriceBefore : 0
    }

    const change = displayPriceBefore > 0
      ? ((displayPrice - displayPriceBefore) / displayPriceBefore) * 100
      : null

    // USD price of base token — use backend-provided token prices (covers ALL tokens)
    const ICP_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
    const CKUSDC_ID = 'xevnm-gaaaa-aaaar-qafnq-cai'
    const baseUSD = exchangeStore.getTokenPriceUSD(displayBase)
    let usdPrice: number | null = baseUSD > 0 ? baseUSD : null
    // Fallback 1: derive from quote token's USD price
    if (usdPrice === null && displayPrice > 0) {
      const quoteUSD = exchangeStore.getTokenPriceUSD(displayQuote)
      if (quoteUSD > 0) usdPrice = displayPrice * quoteUSD
    }
    // Fallback 2: derive from known quote token prices (ICP from store, ckUSDC = $1)
    if (usdPrice === null && displayPrice > 0) {
      if (displayQuote === ICP_ID && exchangeStore.icpPriceUSD > 0) {
        usdPrice = displayPrice * exchangeStore.icpPriceUSD
      } else if (displayQuote === CKUSDC_ID) {
        usdPrice = displayPrice
      }
    }

    const maxDec = Math.max(Number(baseInfo.decimals), Number(quoteInfo.decimals))
    const priceDp = displayPrice >= 1000 ? 2 : displayPrice >= 1 ? 4 : Math.min(6, maxDec)
    const usdFormatted = usdPrice !== null ? formatUSD(usdPrice) : null

    // Compute TVL from reserves + USD prices
    const r0raw = info.amm_reserve0?.[i] ?? 0n
    const r1raw = info.amm_reserve1?.[i] ?? 0n
    const dec0 = Number(token0Info.decimals)
    const dec1 = Number(token1Info.decimals)
    const r0val = Number(r0raw) / 10 ** dec0
    const r1val = Number(r1raw) / 10 ** dec1
    const p0usd = exchangeStore.getTokenPriceUSD(t0)
    const p1usd = exchangeStore.getTokenPriceUSD(t1)
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

  // Sort by TVL (highest first), then volume 24h as tiebreaker
  pairs.sort((a, b) => {
    if (b.tvlUSD !== a.tvlUSD) return b.tvlUSD - a.tvlUSD
    const va = Number(a.volume24h ?? 0n)
    const vb = Number(b.volume24h ?? 0n)
    return vb - va
  })

  return pairs
})

type PairSortKey = 'pair' | 'usd' | 'price' | 'change'
const pairSortKey = ref<PairSortKey | null>(null) // null = default TVL sort
const pairSortAsc = ref(false)

function togglePairSort(key: PairSortKey) {
  if (pairSortKey.value === key) { pairSortAsc.value = !pairSortAsc.value }
  else { pairSortKey.value = key; pairSortAsc.value = key === 'pair' }
}

function pairSortIndicator(key: PairSortKey): string {
  if (pairSortKey.value !== key) return ''
  return pairSortAsc.value ? ' ▲' : ' ▼'
}

const filteredPairs = computed(() => {
  let list = availablePairs.value
  const q = pairSearch.value.toLowerCase()
  if (q) {
    list = list.filter(p =>
      p.baseSymbol.toLowerCase().includes(q) ||
      p.quoteSymbol.toLowerCase().includes(q)
    )
  }
  // Default: keep TVL sort from availablePairs. Only re-sort if user clicked a column.
  if (!pairSortKey.value) return list
  const dir = pairSortAsc.value ? 1 : -1
  return [...list].sort((a, b) => {
    switch (pairSortKey.value) {
      case 'pair': return dir * `${a.baseSymbol}/${a.quoteSymbol}`.localeCompare(`${b.baseSymbol}/${b.quoteSymbol}`)
      case 'usd': {
        const au = parseFloat(a.priceUSD?.replace(/[$,]/g, '') ?? '0')
        const bu = parseFloat(b.priceUSD?.replace(/[$,]/g, '') ?? '0')
        return dir * (au - bu)
      }
      case 'price': {
        const ap = parseFloat(a.lastPrice ?? '0')
        const bp = parseFloat(b.lastPrice ?? '0')
        return dir * (ap - bp)
      }
      case 'change': return dir * ((a.change24h ?? 0) - (b.change24h ?? 0))
      default: return 0
    }
  })
})

function selectPair(pair: PairOption) {
  selectedBase.value = pair.base
  selectedQuote.value = pair.quote
  showPairSelector.value = false
  pairSearch.value = ''

  // Navigate to trading view if not already on one
  const path = route.path
  if (path !== '/' && path !== '/easy' && path !== '/trade') {
    const isMobile = window.innerWidth <= 767
    router.push(isMobile ? '/trade' : '/')
  }
}

watch(showPairSelector, async (open) => {
  if (open && window.innerWidth > 767) {
    await nextTick()
    pairSearchRef.value?.focus()
  }
})

// ── Price Display (derived from active pair in filteredPairs) ──
const activePair = computed(() =>
  filteredPairs.value.find(p => p.base === selectedBase.value && p.quote === selectedQuote.value) ?? null
)
const currentPrice = computed(() => {
  if (exchangeStore.effectivePrice > 0) {
    const p = exchangeStore.effectivePrice
    const dp = p >= 1000 ? 2 : p >= 1 ? 4 : p >= 0.01 ? 6 : 8
    return p.toFixed(dp)
  }
  return activePair.value?.lastPrice ?? null
})
const priceChange = computed(() => activePair.value?.change24h ?? null)
const currentPriceUSD = computed(() => {
  if (exchangeStore.effectivePrice > 0 && activePair.value) {
    const quoteAddr = activePair.value.quote
    const usd = exchangeStore.effectivePrice * exchangeStore.getTokenPriceUSD(quoteAddr)
    if (usd > 0) return `$${usd >= 1 ? usd.toFixed(2) : usd >= 0.01 ? usd.toFixed(4) : usd.toPrecision(3)}`
  }
  return activePair.value?.priceUSD ?? null
})
// Hide the header price/USD/change block in easy mode when the selected pair
// has no AMM — a synthetic cross-rate there is misleading, not informative.
const currentPairHasAMM = computed(() =>
  exchangeStore.hasAMMPool(exchangeStore.selectedToken0, exchangeStore.selectedToken1)
)
const showHeaderPrice = computed(() =>
  currentPrice.value !== null && !(mode.value === 'easy' && !currentPairHasAMM.value)
)
const priceFlashClass = ref('')
const stats24h = ref<{ high: string | null; low: string | null; volume: string | null }>({
  high: null, low: null, volume: null,
})

// ── 24h HIGH / LOW / VOL 24H (Figma Pro stat cluster) ──────────────
// One kline fetch per pair, refreshed every 60s. Picks the latest daily
// candle. Formats numbers to the same precision as the pair's lastPrice
// so the column reads cleanly. Volume collapses to K/M/B.
let statsTimer: number | null = null
function fmtVol(raw: bigint, decimals: number): string {
  const n = Number(raw) / 10 ** decimals
  if (!isFinite(n) || n <= 0) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(0)
}
function fmtPrice(p: number): string {
  if (!isFinite(p) || p <= 0) return '—'
  const dp = p >= 1000 ? 2 : p >= 1 ? 4 : p >= 0.01 ? 6 : 8
  return p.toFixed(dp)
}
async function loadStats24h() {
  const t0 = selectedBase.value
  const t1 = selectedQuote.value
  if (!t0 || !t1) {
    stats24h.value = { high: null, low: null, volume: null }
    return
  }
  try {
    // Backend returns daily candles NEWEST-FIRST — candles[0] is today.
    const candles = await exchangeStore.getKlineData(t0, t1, { day: null } as any, true)
    if (!candles || candles.length === 0) return
    const latest = candles[0]
    const quote = exchangeStore.getTokenByAddress(t1)
    const quoteDecimals = quote ? Number(quote.decimals) : 8
    // Pair button swaps the display; prices from backend are in pool order.
    // activePair handles the inversion for lastPrice; for HIGH/LOW we apply
    // the same logic: if base/quote display is swapped vs t0/t1, invert.
    const pair = activePair.value
    const swapped = pair ? (pair.base !== t0) : false
    const high = swapped && latest.high > 0 ? 1 / latest.low  : latest.high
    const low  = swapped && latest.low  > 0 ? 1 / latest.high : latest.low
    stats24h.value = {
      high: fmtPrice(high),
      low:  fmtPrice(low),
      volume: fmtVol(latest.volume, quoteDecimals),
    }
  } catch {
    /* soft-fail — stat cluster hides empty values */
  }
}

// ── Mode Toggle ──
const mode = ref<'pro' | 'easy'>(
  (localStorage.getItem('taco_exchange_mode') as 'pro' | 'easy') || 'pro'
)

// If the current pair has no AMM, pro mode would load a dead chart/orderbook.
// Resolve a sensible pair: keep current if it trades, else sellToken/ICP,
// else TACO/ICP. Returns null if nothing tradable is available.
function resolveProPair(): [string, string] | null {
  const ICP = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
  const t0 = exchangeStore.selectedToken0
  const t1 = exchangeStore.selectedToken1
  const taco = exchangeStore.tokens.find(t => t.symbol === 'TACO')?.address

  if (t0 && t1 && exchangeStore.hasAMMPool(t0, t1)) return [t0, t1]
  if (t0 && t0 !== ICP && exchangeStore.hasAMMPool(t0, ICP)) return [t0, ICP]
  if (taco && exchangeStore.hasAMMPool(taco, ICP)) return [taco, ICP]
  return null
}

function setMode(m: 'pro' | 'easy') {
  mode.value = m
  localStorage.setItem('taco_exchange_mode', m)
  if (m === 'pro') {
    const pair = resolveProPair()
    if (pair) {
      exchangeStore.selectedToken0 = pair[0]
      exchangeStore.selectedToken1 = pair[1]
    }
    // If no tradable fallback exists, pro mode will show its empty-state
    // placeholder — we still route so the user isn't stuck on the easy page.
  }
  router.push(m === 'easy' ? '/easy' : '/')
}

// Sync mode from route
watch(() => route.path, (path) => {
  if (path === '/easy') mode.value = 'easy'
  else if (path === '/') mode.value = 'pro'
}, { immediate: true })

// ── Wallet ──
const toast = useExchangeToast()
const isConnected = ref(false)
const principalText = ref('')
const accountIdHex = ref('')
const showWalletMenu = ref(false)
const walletDropdownRef = ref<HTMLElement | null>(null)

const truncatedPrincipal = computed(() => {
  const p = principalText.value
  if (!p || p.length < 16) return p
  return `${p.slice(0, 5)}…${p.slice(-3)}`
})

// Two-letter avatar derived from the principal — stable per-session.
const walletInitials = computed(() => {
  const p = principalText.value
  if (!p) return ''
  return p.slice(0, 2).toUpperCase()
})

async function deriveAccountId() {
  if (!principalText.value) { accountIdHex.value = ''; return }
  try {
    const { Principal } = await import('@dfinity/principal')
    const { AccountIdentifier } = await import('@dfinity/ledger-icp')
    const principal = Principal.fromText(principalText.value)
    accountIdHex.value = AccountIdentifier.fromPrincipal({ principal, subAccount: undefined }).toHex()
  } catch {
    accountIdHex.value = ''
  }
}

async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.info(message)
  } catch { /* fallback */ }
}

const callsRemaining = computed(() => exchangeStore.callsRemaining)

async function connectWallet() {
  try {
    const { getCachedAuthClient } = await import('../../../shared/auth-cache')
    const authClient = await getCachedAuthClient()

    // Anchor to tacodao.com on the custom subdomain so the principal matches the DAO app.
    const derivationOrigin =
      window.location.hostname === 'exchange.tacodao.com'
        ? 'https://tacodao.com'
        : undefined

    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: 'https://id.ai',
        derivationOrigin,
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      })
    })

    const identity = authClient.getIdentity()
    principalText.value = identity.getPrincipal().toText()
    isConnected.value = true
    exchangeStore.isAuthenticated = true
    exchangeStore.principalText = principalText.value
    deriveAccountId()

    // Reinitialize the store with authenticated actor
    exchangeStore.clearActorCache()
  } catch (err) {
    console.error('Wallet connect failed:', err)
  }
}

async function disconnectWallet() {
  try {
    const { getCachedAuthClient } = await import('../../../shared/auth-cache')
    const authClient = await getCachedAuthClient()
    await authClient.logout()
  } catch {
    // ignore logout errors
  }
  isConnected.value = false
  principalText.value = ''
  accountIdHex.value = ''
  showWalletMenu.value = false
  exchangeStore.isAuthenticated = false
  exchangeStore.principalText = ''
  exchangeStore.clearActorCache()
}


// Check existing auth on mount
onMounted(async () => {
  try {
    const { getCachedIdentity } = await import('../../../shared/auth-cache')
    const identity = await getCachedIdentity()
    if (identity && !identity.getPrincipal().isAnonymous()) {
      principalText.value = identity.getPrincipal().toText()
      isConnected.value = true
      exchangeStore.isAuthenticated = true
      exchangeStore.principalText = principalText.value
      deriveAccountId()
    }
  } catch {
    // not authenticated
  }

  // Set default pair from tokens
  setDefaultPair()
})

function setDefaultPair() {
  if (exchangeStore.selectedToken0) return
  if (exchangeStore.tokens.length >= 2) {
    const taco = exchangeStore.tokens.find(t => t.symbol === 'TACO')
    const icp = exchangeStore.tokens.find(t => t.address === 'ryjl3-tyaaa-aaaaa-aaaba-cai')
    if (taco && icp) {
      exchangeStore.selectedToken0 = taco.address
      exchangeStore.selectedToken1 = icp.address
    } else {
      exchangeStore.selectedToken0 = exchangeStore.tokens[0].address
      exchangeStore.selectedToken1 = exchangeStore.tokens[1].address
    }
  }
}

// Watch for tokens loading (async init may finish after mount)
watch(() => exchangeStore.tokens.length, () => setDefaultPair())

// Refresh 24h stats whenever the pair changes or every 60s while mounted.
watch([selectedBase, selectedQuote], () => { loadStats24h() }, { immediate: true })
onMounted(() => {
  statsTimer = window.setInterval(loadStats24h, 60_000)
})
onUnmounted(() => {
  if (statsTimer !== null) {
    clearInterval(statsTimer)
    statsTimer = null
  }
})

// Close dropdowns on outside click
function onClickOutside(e: MouseEvent) {
  if (pairDropdownRef.value && !pairDropdownRef.value.contains(e.target as Node)) {
    showPairSelector.value = false
  }
  if (walletDropdownRef.value && !walletDropdownRef.value.contains(e.target as Node)) {
    showWalletMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped lang="scss">
// Figma PT_Header — flat surface-1 + 1px bottom line, no gradient, no shadow.
.ex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--tx-surface-1);
  border-bottom: 1px solid var(--tx-line);
  gap: 14px;
  z-index: 100;

  @media (max-width: 767px) {
    padding: 8px 12px;
    gap: 8px;
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  &__left  { flex: 1; min-width: 0; }
  &__right { flex-shrink: 0; gap: 8px; }

  // Vertical divider (1px × 22px)
  &__divider {
    width: 1px;
    height: 22px;
    background: var(--tx-line);
    flex-shrink: 0;
  }

  // Brand lockup: logo-mark + "taco·exchange" + PRO badge
  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: var(--tx-ink);
    flex-shrink: 0;
  }
  &__brand-text {
    font-weight: 700;
    letter-spacing: -0.01em;
    font-size: 14px;

    @media (max-width: 767px) { display: none; }
  }
  &__brand-badge { margin-left: 6px; }

  // Nav links (right side)
  &__nav {
    display: flex;
    align-items: center;
    gap: 4px;

    @media (max-width: 767px) { display: none; }
  }
  &__nav-link {
    font-size: 13px;
    font-weight: 500;
    color: var(--tx-ink-3);
    text-decoration: none;
    padding: 6px 10px;
    border-radius: var(--tx-r-sm);
    transition: color 140ms, background 140ms;

    &:hover   { color: var(--tx-ink); background: var(--tx-surface-2); }
    &--active { color: var(--tx-orange); }
  }

  // Pair selector
  &__pair { position: relative; }

  &__pair-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--tx-surface-2);
    border: 1px solid var(--tx-line);
    color: var(--tx-ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: var(--tx-r-md);
    transition: border-color 140ms, background 140ms;

    &:hover { border-color: var(--tx-line-hi); background: var(--tx-surface-3); }
  }
  &__pair-mark {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    img { border-radius: 50%; width: 16px; height: 16px; object-fit: cover; }
    &--quote { margin-left: -4px; border: 1.5px solid var(--tx-surface-2); }
  }
  &__pair-markfallback {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--tx-orange);
    color: #0b0906;
    font-size: 9px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__pair-symbols { font-weight: 600; }
  &__pair-chev {
    font-size: 11px;
    transition: transform 140ms;
    &--open { transform: rotate(180deg); }
  }

  &__pair-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 340px;
    background: var(--tx-panel-bg-2);
    border: 1px solid var(--tx-line-2);
    border-radius: var(--tx-r-lg);
    box-shadow: var(--tx-shadow-2);
    z-index: 200;
    overflow: hidden;

    @media (max-width: 767px) {
      position: fixed;
      top: 52px;
      left: 8px;
      right: 8px;
      width: auto;
      max-height: 70vh;
    }
  }
  &__pair-search {
    margin: 8px;
    width: calc(100% - 16px);
  }
  &__pair-hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    font-size: 10px;
    color: var(--tx-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--tx-line);
    user-select: none;
  }
  &__pair-hdr-col {
    cursor: pointer;
    flex: 1;
    text-align: left;
    &:hover { color: var(--tx-ink); }
  }
  &__pair-hdr-name { min-width: 90px; flex: none; }

  &__pair-list {
    max-height: 300px;
    overflow-y: auto;
  }
  &__pair-empty {
    padding: 14px;
    color: var(--tx-ink-3);
    font-size: 13px;
    text-align: center;
  }
  &__pair-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid var(--tx-line);
    color: var(--tx-ink);
    font-size: 13px;
    cursor: pointer;
    text-align: left;

    &:hover { background: var(--tx-surface-1); }
    &--active { background: var(--tx-orange-dim); }
  }
  &__pair-name {
    font-weight: 500;
    min-width: 90px;
  }
  &__pair-usd, &__pair-price {
    color: var(--tx-ink-3);
    font-size: 11px;
    min-width: 50px;
  }
  &__pair-change {
    font-size: 11px;
    min-width: 55px;
    margin-left: auto;

    &--up   { color: var(--tx-buy); }
    &--down { color: var(--tx-sell); }
  }

  // Stat cluster — 5 cells, value above (16px / 13px mono), eyebrow below (10px uppercase)
  &__stats {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding-left: 6px;

    @media (max-width: 1024px) { display: none; }
  }
  &__stat {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  &__stat-value {
    font-size: 13px;
    font-weight: 500;
    color: var(--tx-ink);
    line-height: 1.2;

    &--lg {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.1;
    }
  }
  &__stat-label {
    font-size: 10px;
    color: var(--tx-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 1px;
  }

  // Rate limit pill
  &__rate-limit {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--tx-ink-2);
    padding: 3px 7px;
    border-radius: var(--tx-r-sm);
    background: var(--tx-surface-2);
    border: 1px solid var(--tx-line);

    &--warning {
      color: var(--tx-warning);
      background: var(--tx-warning-dim);
      border-color: transparent;
    }
    &--danger {
      color: var(--tx-sell);
      background: var(--tx-sell-dim);
      border-color: transparent;
    }
  }

  // Wallet — compact chip with initials avatar + truncated principal
  &__wallet { position: relative; }
  &__wallet-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--tx-surface-2);
    border: 1px solid var(--tx-line);
    border-radius: var(--tx-r-md);
    color: var(--tx-ink);
    font-size: 11px;
    padding: 3px 8px 3px 3px;
    cursor: pointer;
    transition: border-color 140ms, background 140ms;

    &:hover { border-color: var(--tx-line-hi); background: var(--tx-surface-3); }
  }
  &__wallet-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--tx-surface-3);
    color: var(--tx-ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-ui);
  }
  &__wallet-principal {
    font-size: 11px;
    @media (max-width: 767px) { display: none; }
  }

  &__wallet-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: 280px;
    background: var(--tx-panel-bg-2);
    border: 1px solid var(--tx-line-2);
    border-radius: var(--tx-r-lg);
    box-shadow: var(--tx-shadow-2);
    z-index: 200;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;

    @media (max-width: 767px) {
      position: fixed;
      top: 52px;
      left: 8px;
      right: 8px;
      width: auto;
    }
  }
  &__wallet-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__wallet-label {
    font-size: 10px;
    color: var(--tx-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  &__wallet-copy {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--tx-ink-2);
    font-size: 11px;
    font-family: var(--font-mono);
    cursor: pointer;
    padding: 2px 0;
    word-break: break-all;

    &:hover { color: var(--tx-ink); }
    svg { flex-shrink: 0; }
  }
  &__wallet-disconnect {
    background: transparent;
    border: 1px solid rgba(224, 84, 74, 0.4);
    border-radius: var(--tx-r-md);
    color: var(--tx-sell);
    font-size: 12px;
    padding: 6px 10px;
    cursor: pointer;

    &:hover { background: var(--tx-sell-dim); }
  }
}

.ex-header-wrap {
  display: contents;

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
}

.ex-header-mobile-stats {
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 12px;
    background: var(--tx-surface-1);
    border-bottom: 1px solid var(--tx-line);
    font-size: 10px;
    overflow-x: auto;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__price {
    font-weight: 600;
    color: var(--tx-ink);
    font-size: 11px;
  }

  &__usd {
    color: var(--tx-ink-3);
  }

  &__change {
    font-weight: 500;
    &--up   { color: var(--tx-buy); }
    &--down { color: var(--tx-sell); }
  }

  &__item {
    color: var(--tx-ink-3);
    margin-left: 4px;

    .num { color: var(--tx-ink-2); }
  }
}
</style>
