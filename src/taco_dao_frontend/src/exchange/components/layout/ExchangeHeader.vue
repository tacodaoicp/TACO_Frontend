<template>
  <div class="ex-header-wrap">
  <header class="ex-header">
    <div class="ex-header__left">
      <router-link to="/" class="ex-header__logo" aria-label="TACO Exchange home">
        <span class="ex-header__logo-text">TACO</span>
        <span class="ex-header__logo-badge">Exchange</span>
      </router-link>

      <!-- Pair Selector -->
      <div class="ex-header__pair" ref="pairDropdownRef">
        <button
          class="ex-header__pair-btn"
          @click="showPairSelector = !showPairSelector"
          aria-haspopup="listbox"
          :aria-expanded="showPairSelector"
        >
          <span class="ex-header__pair-icons">
            <img v-if="baseIcon" :src="baseIcon" class="ex-header__pair-icon" width="20" height="20" />
            <img v-if="quoteIcon" :src="quoteIcon" class="ex-header__pair-icon ex-header__pair-icon--quote" width="20" height="20" />
          </span>
          <span class="ex-header__pair-symbols">{{ currentPairLabel }}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" class="ex-header__chevron" :class="{ 'ex-header__chevron--open': showPairSelector }">
            <path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
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

      <!-- Current Price -->
      <div v-if="showHeaderPrice" class="ex-header__price">
        <span class="ex-header__price-value num" :class="priceFlashClass">
          {{ currentPrice }}
        </span>
        <span v-if="currentPriceUSD" class="ex-header__price-usd num">{{ currentPriceUSD }}</span>
        <span v-if="priceChange !== null" class="ex-header__price-change num" :class="priceChange >= 0 ? 'ex-header__price-change--up' : 'ex-header__price-change--down'">
          {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
        </span>
      </div>

      <!-- 24h Stats (desktop only) -->
      <div class="ex-header__stats">
        <div v-if="stats24h.high" class="ex-header__stat">
          <span class="ex-header__stat-label">24h High</span>
          <span class="ex-header__stat-value num">{{ stats24h.high }}</span>
        </div>
        <div v-if="stats24h.low" class="ex-header__stat">
          <span class="ex-header__stat-label">24h Low</span>
          <span class="ex-header__stat-value num">{{ stats24h.low }}</span>
        </div>
        <div v-if="stats24h.volume" class="ex-header__stat">
          <span class="ex-header__stat-label">24h Vol</span>
          <span class="ex-header__stat-value num">{{ stats24h.volume }}</span>
        </div>
      </div>
    </div>

    <!-- Pro/Easy Toggle (centered between left & right on desktop) -->
    <div class="ex-header__mode-toggle">
      <button
        class="ex-header__mode-btn"
        :class="{ 'ex-header__mode-btn--active': mode === 'pro' }"
        @click="setMode('pro')"
      >Pro</button>
      <button
        class="ex-header__mode-btn"
        :class="{ 'ex-header__mode-btn--active': mode === 'easy' }"
        @click="setMode('easy')"
      >Easy</button>
    </div>

    <div class="ex-header__right">
      <!-- Nav Links -->
      <nav class="ex-header__nav">
        <router-link to="/otc" class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path.startsWith('/otc') }">OTC</router-link>
        <router-link to="/pool" class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path === '/pool' }">Pool</router-link>
        <router-link to="/portfolio" class="ex-header__nav-link" :class="{ 'ex-header__nav-link--active': route.path === '/portfolio' }">Portfolio</router-link>
      </nav>

      <!-- Rate Limit Indicator -->
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

      <!-- Wallet Button -->
      <button
        v-if="!isConnected"
        class="ex-btn ex-btn--primary ex-btn--sm"
        @click="connectWallet"
      >
        Connect Wallet
      </button>
      <div v-else class="ex-header__wallet" ref="walletDropdownRef">
        <button class="ex-header__wallet-btn" @click="showWalletMenu = !showWalletMenu">
          <span class="ex-header__wallet-principal">{{ truncatedPrincipal }}</span>
        </button>
        <div v-if="showWalletMenu" class="ex-header__wallet-dropdown">
          <div class="ex-header__wallet-info">
            <span class="ex-header__wallet-label">Principal</span>
            <button class="ex-header__wallet-copy" @click="copyText(principalText, 'Principal Copied')">
              {{ principalText }}
              <svg width="14" height="14" viewBox="0 0 14 14"><rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" fill="none"/><path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" fill="none"/></svg>
            </button>
          </div>
          <div v-if="accountIdHex" class="ex-header__wallet-info">
            <span class="ex-header__wallet-label">Account ID</span>
            <button class="ex-header__wallet-copy" @click="copyText(accountIdHex, 'Account ID Copied')">
              {{ accountIdHex }}
              <svg width="14" height="14" viewBox="0 0 14 14"><rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" fill="none"/><path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" fill="none"/></svg>
            </button>
          </div>
          <button class="ex-header__wallet-disconnect" @click="disconnectWallet">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile stats bar -->
  <div class="ex-header-mobile-stats">
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

const router = useRouter()
const route = useRoute()
const exchangeStore = useExchangeStore()

const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(exchangeStore.principalText))

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
  return `${p.slice(0, 5)}...${p.slice(-3)}`
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
.ex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--space-4);
  background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
  border-bottom: 1px solid var(--card-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  gap: var(--space-4);
  z-index: 100;

  @media (max-width: 767px) {
    padding: 0 var(--space-2);
    gap: var(--space-2);
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__left {
    flex: 1;
    min-width: 0;
  }

  &__right {
    flex-shrink: 0;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    text-decoration: none;
    flex-shrink: 0;

    @media (max-width: 767px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      line-height: 1;
    }
  }

  &__logo-text {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--accent-primary);

    @media (max-width: 767px) {
      font-size: var(--text-sm);
      line-height: 1.1;
    }
  }

  &__logo-badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;

    @media (max-width: 767px) {
      font-size: 9px;
      line-height: 1.1;
    }
  }

  // Nav links
  &__nav {
    display: flex;
    align-items: center;
    gap: var(--space-1);

    @media (max-width: 767px) { display: none; }
  }

  &__nav-link {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;

    &:hover { color: var(--text-primary); background: rgba(196, 90, 10, 0.08); }
    &--active { color: var(--gold); }
    &--admin { color: var(--color-warning); }
  }

  &__pair-icons {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__pair-icon {
    border-radius: 50%;
    object-fit: cover;

    &--quote {
      margin-left: -6px;
      border: 2px solid var(--bg-secondary);
    }
  }

  // Pair selector
  &__pair {
    position: relative;
  }

  &__pair-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    padding: var(--space-1) var(--space-2);
    border-radius: 4px;

    &:hover { background: var(--bg-tertiary); }
  }

  &__chevron {
    color: var(--text-tertiary);
    transition: transform 0.15s;
    &--open { transform: rotate(180deg); }
  }

  &__pair-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 340px;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 1px solid var(--card-border);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 200;
    overflow: hidden;

    @media (max-width: 767px) {
      position: fixed;
      top: 52px;
      left: var(--space-2);
      right: var(--space-2);
      width: auto;
      max-height: 70vh;
    }
  }

  &__pair-search {
    margin: var(--space-2);
    width: calc(100% - var(--space-4));
  }

  &__pair-hdr {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border-primary);
    user-select: none;
  }

  &__pair-hdr-col {
    cursor: pointer;
    flex: 1;
    text-align: left;
    &:hover { color: var(--text-primary); }
  }

  &__pair-hdr-name {
    min-width: 90px;
    flex: none;
  }

  &__pair-list {
    max-height: 300px;
    overflow-y: auto;
  }

  &__pair-empty {
    padding: var(--space-4);
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    text-align: center;
  }

  &__pair-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;

    &:hover { background: var(--bg-tertiary); }
    &--active { background: var(--accent-primary-muted); }
  }

  &__pair-name {
    font-weight: var(--weight-medium);
    min-width: 90px;
  }

  &__pair-usd {
    color: var(--text-secondary);
    font-size: var(--text-xs);
    min-width: 50px;
    text-align: left;
  }

  &__pair-price {
    color: var(--text-secondary);
    font-size: var(--text-xs);
    text-align: left;
  }

  &__pair-change {
    font-size: var(--text-xs);
    min-width: 55px;
    text-align: left;
    margin-left: auto;

    &--up { color: var(--color-buy); }
    &--down { color: var(--color-sell); }
  }

  // Price
  &__price {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);

    @media (max-width: 767px) { display: none; }
  }

  &__price-value {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  &__price-usd {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  &__price-change {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    &--up { color: var(--color-buy); }
    &--down { color: var(--color-sell); }
  }

  // 24h Stats
  &__stats {
    display: flex;
    gap: var(--space-4);

    @media (max-width: 1024px) { display: none; }
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__stat-label {
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__stat-value {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  // Mode toggle (taco-nav-btn style, centered between left & right)
  &__mode-toggle {
    display: flex;
    gap: 0;

    @media (max-width: 767px) { display: none; }
  }

  &__mode-btn {
    color: var(--text-cream);
    background: rgba(196, 90, 10, 0.10);
    border: 2px solid var(--card-border);
    padding: 4px 18px;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    height: 32px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.65;

    &:first-child {
      border-radius: 6px 0 0 6px;
      border-right: 1px solid var(--card-border);
    }
    &:last-child {
      border-radius: 0 6px 6px 0;
      border-left: 1px solid var(--card-border);
    }

    &:hover {
      background: rgba(196, 90, 10, 0.18);
      opacity: 1;
    }

    &--active {
      background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
      color: var(--gold);
      border-color: var(--card-border);
      font-weight: var(--weight-bold);
      box-shadow: 0 2px 12px rgba(60, 30, 0, 0.5);
      opacity: 1;

      &:hover {
        background: linear-gradient(135deg, var(--card-hover-from), var(--card-hover-to));
        color: var(--gold);
      }
    }
  }

  // Rate limit
  &__rate-limit {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--text-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--bg-tertiary);

    &--warning { color: var(--color-warning); background: rgba(196, 90, 10, 0.1); }
    &--danger { color: var(--color-sell); background: rgba(217, 64, 64, 0.1); }
  }

  // Wallet
  &__wallet {
    position: relative;
  }

  &__wallet-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: rgba(196, 90, 10, 0.08);
    border: 1px solid var(--card-border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: var(--text-sm);
    padding: 4px 12px;
    height: 32px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(196, 90, 10, 0.15);
      border-color: var(--accent-primary);
    }
  }

  &__wallet-principal {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  &__wallet-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    width: 280px;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 1px solid var(--card-border);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 200;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    @media (max-width: 767px) {
      position: fixed;
      top: 52px;
      left: var(--space-2);
      right: var(--space-2);
      width: auto;
    }
  }

  &__wallet-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__wallet-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__wallet-copy {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    cursor: pointer;
    padding: 2px 0;
    word-break: break-all;

    &:hover { color: var(--text-primary); }
    svg { flex-shrink: 0; }
  }

  &__wallet-disconnect {
    background: none;
    border: 1px solid var(--color-sell);
    border-radius: 6px;
    color: var(--color-sell);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;

    &:hover { background: rgba(217, 64, 64, 0.1); }
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
    gap: var(--space-2);
    padding: 2px var(--space-2);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--card-border);
    font-size: 10px;
    overflow-x: auto;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__price {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    font-size: 11px;
  }

  &__usd {
    color: var(--text-tertiary);
  }

  &__change {
    font-weight: var(--weight-medium);
    &--up { color: var(--color-buy); }
    &--down { color: var(--color-sell); }
  }

  &__item {
    color: var(--text-tertiary);
    margin-left: var(--space-1);

    .num { color: var(--text-secondary); }
  }
}
</style>
