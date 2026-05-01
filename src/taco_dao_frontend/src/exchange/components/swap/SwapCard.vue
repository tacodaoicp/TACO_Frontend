<template>
  <div class="swap-card">
    <!-- Result modal — teleported to <body>, floats above the form rather
         than replacing it. The form stays mounted so the page doesn't
         collapse to the modal's height when the result appears. -->
    <SwapResult
      v-if="showResult"
      :type="resultType"
      :tokenFrom="swap.tokenFrom.value"
      :tokenTo="swap.tokenTo.value"
      :amountSent="swap.result.value?.amountSent"
      :amountReceived="swap.result.value?.amountReceived"
      :fee="swap.result.value?.fee"
      :errorMessage="swap.errorMsg.value"
      :canRetry="swap.errorCanRetry.value"
      :accesscode="swap.result.value?.accesscode"
      :fillPercent="swap.result.value?.fillPercent"
      @newSwap="swap.reset()"
      @tryAgain="swap.tryAgain()"
      @recover="$router.push('/recover')"
      @viewHistory="$router.push('/portfolio')"
      @viewPortfolio="$router.push('/portfolio')"
      @dismiss="swap.reset()"
    />

    <!-- Swap form -->
    <template>
      <!-- Header -->
      <div class="swap-card__header">
        <h2 class="swap-card__title">Swap</h2>
        <div class="swap-card__header-right">
          <button
            class="swap-card__settings-btn"
            :class="{ 'swap-card__settings-btn--active': showSettings }"
            @click="showSettings = !showSettings"
            aria-label="Swap settings"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M7.5 3h3M9 3v3M3 7.5v3M3 9h3M7.5 15h3M9 12v3M15 7.5v3M12 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <!-- Settings (slippage) -->
      <div v-if="showSettings" class="ex-field">
        <SlippageSelector v-model="swap.slippage.value" />
      </div>

      <!-- From -->
      <div class="ex-field swap-card__field">
        <div class="swap-card__field-header">
          <span class="swap-card__field-label">From</span>
          <span v-if="swap.tokenFrom.value" class="swap-card__balance">
            Balance: <span class="num">{{ fromBalanceDisplay }}</span>
          </span>
        </div>
        <div class="swap-card__field-row">
          <button class="swap-card__token-btn" @click="openTokenSelector('from')">
            <img v-if="fromIcon" :src="fromIcon" class="swap-card__token-img" width="20" height="20" />
            <span v-else-if="swap.tokenFrom.value" class="swap-card__token-icon">{{ swap.tokenFrom.value.symbol.charAt(0) }}</span>
            <span class="swap-card__token-symbol">{{ swap.tokenFrom.value?.symbol ?? 'Select' }}</span>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </button>
          <input
            class="swap-card__amount-input num"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            v-model="swap.amountIn.value"
            :disabled="swap.isProcessing.value"
          />
        </div>
        <div v-if="fromAmountUSD > 0" class="swap-card__usd-hint num">&asymp; {{ formatUSD(fromAmountUSD) }}</div>
        <!-- Percentage slider -->
        <div v-if="fromBalance > 0n && swap.tokenFrom.value" class="swap-card__pct-slider">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            v-model.number="pctSlider"
            class="swap-card__slider"
            @input="setPercentage(pctSlider)"
          />
          <div class="swap-card__pct-row">
            <button v-for="p in [25, 50, 75, 100]" :key="p" class="ex-pct-btn" :class="{ 'ex-pct-btn--active': pctSlider === p }" @click="setPercentage(p)">{{ p }}%</button>
          </div>
        </div>
      </div>

      <!-- Flip button -->
      <div class="swap-card__flip-wrap">
        <button class="swap-card__flip-btn" @click="swap.flipTokens()" :disabled="swap.isProcessing.value" aria-label="Swap token direction">
          <svg width="18" height="18" viewBox="0 0 18 18" :class="{ 'swap-card__flip-icon--flipped': flipCount % 2 === 1 }">
            <path d="M5 7l4-4 4 4M5 11l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- To -->
      <div class="ex-field swap-card__field">
        <div class="swap-card__field-header">
          <span class="swap-card__field-label">To</span>
        </div>
        <div class="swap-card__field-row">
          <button class="swap-card__token-btn" @click="openTokenSelector('to')">
            <img v-if="toIcon" :src="toIcon" class="swap-card__token-img" width="20" height="20" />
            <span v-else-if="swap.tokenTo.value" class="swap-card__token-icon">{{ swap.tokenTo.value.symbol.charAt(0) }}</span>
            <span class="swap-card__token-symbol">{{ swap.tokenTo.value?.symbol ?? 'Select' }}</span>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </button>
          <div class="swap-card__output num">
            <template v-if="swap.phase.value === 'quoteFetching'">
              <div class="ex-skeleton" style="width:120px;height:28px"></div>
            </template>
            <template v-else-if="swap.quote.value">
              {{ formatOutput }}
            </template>
            <template v-else>
              <span class="swap-card__output-placeholder">0.00</span>
            </template>
          </div>
        </div>
        <div v-if="toAmountUSD > 0" class="swap-card__usd-hint num">&asymp; {{ formatUSD(toAmountUSD) }}</div>
      </div>

      <!-- Quote details -->
      <div v-if="swap.quote.value && swap.phase.value === 'quoteReady'" class="swap-card__info">
        <div class="swap-card__info-row">
          <span>Rate</span>
          <span class="num swap-card__rate" @click="invertedRate = !invertedRate">
            <template v-if="!invertedRate">
              1 {{ swap.tokenFrom.value?.symbol }} = {{ rateDisplay }} {{ swap.tokenTo.value?.symbol }}
            </template>
            <template v-else>
              1 {{ swap.tokenTo.value?.symbol }} = {{ invertedRateDisplay }} {{ swap.tokenFrom.value?.symbol }}
            </template>
            <svg width="10" height="10" viewBox="0 0 10 10" style="margin-left:4px;opacity:0.5"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/></svg>
          </span>
        </div>
        <div v-if="!swap.quote.value.hopDetails?.length || swap.quote.value.hops <= 1" class="swap-card__info-row">
          <span>Price Impact</span>
          <span class="num" :class="impactColorClass">
            {{ swap.quote.value.priceImpact.toFixed(2) }}%
            <span v-if="swap.quote.value.priceImpact === 0 && swap.quote.value.expectedBuyAmount > 0n" class="swap-card__limit-tag">(100% limit)</span>
          </span>
        </div>
        <!-- Route: single or split -->
        <div v-if="swap.splitPlan.value" class="swap-card__split-routes">
          <div class="swap-card__split-header">
            <span class="ex-badge ex-badge--sm ex-badge--success">Split Route</span>
            <span class="swap-card__split-detail">{{ swap.splitPlan.value.improvement.toFixed(1) }}% better output</span>
          </div>
          <div v-for="(leg, idx) in swap.splitPlan.value.legs" :key="idx" class="swap-card__split-leg">
            <span class="swap-card__split-pct num">{{ leg.pctBP / 100 }}%</span>
            <RouteDisplay
              :description="leg.routeKey"
              :route="leg.route"
              :hopDetails="leg.hopDetails"
            />
          </div>
        </div>
        <div v-else class="swap-card__route-section">
          <span class="swap-card__route-label">Route</span>
          <RouteDisplay
            :description="swap.quote.value.routeDescription"
            :route="swap.quote.value.route"
            :hopDetails="swap.quote.value.hopDetails"
          />
        </div>

        <div class="swap-card__info-row">
          <span>Fee ({{ feePercent }})</span>
          <span class="num">{{ feeDisplay }} <span v-if="feeUSD > 0" class="swap-card__usd-subtle">&asymp; {{ formatUSD(feeUSD) }}</span></span>
        </div>

        <!-- Partial fill warning -->
        <div v-if="!swap.quote.value.canFulfillFully" class="ex-warning-box">
          Only part of this swap can be filled immediately. The remainder will be placed as a limit order.
        </div>

        <!-- Price-impact warnings (backend-team spec: elevated > 5 %, high > 15 %, extreme > 25 %) -->
        <div v-if="swap.priceImpactTier.value === 'high'" class="ex-warning-box">
          Large price impact — you're moving the price significantly. Consider a smaller amount.
        </div>
        <div v-if="swap.priceImpactTier.value === 'extreme'" class="ex-error-box swap-card__impact-ack">
          <div><strong>Extreme price impact ({{ swap.quote.value.priceImpact.toFixed(2) }}%)</strong> — this swap will cost a large share to slippage.</div>
          <label class="swap-card__impact-ack-row">
            <input type="checkbox" v-model="swap.impactAcknowledged.value" />
            <span>I understand this swap will cost ~{{ swap.quote.value.priceImpact.toFixed(1) }}% to price impact.</span>
          </label>
        </div>
      </div>

      <!-- Swap button -->
      <button
        class="ex-btn ex-btn--primary ex-btn--lg swap-card__swap-btn"
        :disabled="!canClickSwap"
        @click="onSwapClick"
      >
        <template v-if="!store.isAuthenticated">Connect Wallet</template>
        <template v-else-if="!swap.tokenFrom.value || !swap.tokenTo.value">Select tokens</template>
        <template v-else-if="!swap.amountIn.value">Enter amount</template>
        <template v-else-if="swap.quote.value && swap.quote.value.expectedBuyAmount === 0n">Trade amount too small</template>
        <template v-else-if="swap.phase.value === 'quoteFetching'">Fetching quote...</template>
        <template v-else-if="swap.phase.value === 'depositing'">
          <span class="swap-card__spinner"></span> Depositing...
        </template>
        <template v-else-if="swap.phase.value === 'submitting'">
          <span class="swap-card__spinner"></span> Swapping...
        </template>
        <template v-else-if="swap.canSwap.value">Swap {{ swap.tokenFrom.value?.symbol }} → {{ swap.tokenTo.value?.symbol }}</template>
        <template v-else-if="swap.priceImpactTier.value === 'extreme' && !swap.impactAcknowledged.value">Acknowledge price impact to continue</template>
        <template v-else>Swap</template>
      </button>
    </template>

    <!-- Token selector modal -->
    <TokenSelector
      :visible="tokenSelectorOpen"
      :disabledAddress="tokenSelectorDisabled"
      :selectedAddress="tokenSelectorSelected"
      @select="onTokenSelected"
      @close="tokenSelectorOpen = false"
    />

    <!-- Confirmation modal -->
    <SwapConfirm
      :visible="swap.phase.value === 'confirming'"
      :tokenFrom="swap.tokenFrom.value"
      :tokenTo="swap.tokenTo.value"
      :amountIn="swap.amountInBigInt.value"
      :expectedOut="swap.quote.value?.expectedBuyAmount ?? 0n"
      :priceImpact="swap.quote.value?.priceImpact ?? 0"
      :routeDescription="swap.quote.value?.routeDescription ?? ''"
      :fee="swap.quote.value?.fee ?? 0n"
      :slippage="swap.slippage.value"
      :hopDetails="swap.quote.value?.hopDetails"
      :splitPlan="swap.splitPlan.value"
      @confirm="swap.confirmSwap()"
      @cancel="swap.cancelConfirm()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExchangeStore } from '../../store/exchange.store'
import { useSwapFlow } from '../../composables/useSwapFlow'
import { formatTokenAmount, formatUSD } from '../../utils/format'
import { getTokenIcon } from '../../utils/token-icons'
import TokenSelector from './TokenSelector.vue'
import SwapConfirm from './SwapConfirm.vue'
import SwapResult from './SwapResult.vue'
import SlippageSelector from '../shared/SlippageSelector.vue'
import RouteDisplay from '../shared/RouteDisplay.vue'
import { useExchangeAuth } from '../../composables/useExchangeAuth'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const router = useRouter()
const store = useExchangeStore()
const swap = useSwapFlow()
const auth = useExchangeAuth()

const showSettings = ref(false)
const flipCount = ref(0)
const invertedRate = ref(false)

// Token selector state
const tokenSelectorOpen = ref(false)
const tokenSelectorField = ref<'from' | 'to'>('from')
const tokenSelectorDisabled = computed(() =>
  tokenSelectorField.value === 'from' ? swap.tokenTo.value?.address : swap.tokenFrom.value?.address
)
const tokenSelectorSelected = computed(() =>
  tokenSelectorField.value === 'from' ? swap.tokenFrom.value?.address : swap.tokenTo.value?.address
)

// Token icons
const fromIcon = computed(() => {
  const t = swap.tokenFrom.value
  return t ? getTokenIcon(t.symbol, t.name) : null
})
const toIcon = computed(() => {
  const t = swap.tokenTo.value
  return t ? getTokenIcon(t.symbol, t.name) : null
})

// Balance — queries ICRC-1 on token change
const fromBalance = ref(0n)
const fromBalanceDisplay = computed(() => {
  if (!swap.tokenFrom.value) return '—'
  return formatTokenAmount(fromBalance.value, Number(swap.tokenFrom.value.decimals), swap.tokenFrom.value.symbol)
})

watch(
  () => [swap.tokenFrom.value?.address, store.isAuthenticated] as const,
  async ([addr, authed]) => {
    if (!addr || !authed) { fromBalance.value = 0n; return }
    fromBalance.value = await store.getUserBalance(addr)
  },
  { immediate: true },
)

function openTokenSelector(field: 'from' | 'to') {
  tokenSelectorField.value = field
  tokenSelectorOpen.value = true
}

function onTokenSelected(token: TokenInfo) {
  if (tokenSelectorField.value === 'from') {
    swap.tokenFrom.value = token
  } else {
    swap.tokenTo.value = token
  }
}

// Flip with animation counter
const origFlip = swap.flipTokens
swap.flipTokens = () => {
  flipCount.value++
  origFlip()
}

// Percentage slider
const pctSlider = ref(0)

function bigIntToDecimal(amount: bigint, decimals: number, maxFrac: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = amount / divisor
  const frac = amount % divisor
  if (maxFrac === 0) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac)
  return `${whole}.${fracStr}`
}

function setPercentage(pct: number) {
  pctSlider.value = pct
  if (!swap.tokenFrom.value || fromBalance.value <= 0n) return
  const fee = swap.tokenFrom.value.transfer_fee
  const tradingFee = (fromBalance.value * store.tradingFeeBps) / 10000n
  const maxAmount = fromBalance.value - fee - tradingFee
  if (maxAmount <= 0n) return
  const useAmount = pct === 100 ? maxAmount : (maxAmount * BigInt(pct)) / 100n
  if (useAmount <= 0n) { swap.amountIn.value = ''; return }
  const dec = Number(swap.tokenFrom.value.decimals)
  swap.amountIn.value = bigIntToDecimal(useAmount, dec, dec)
}

// Formatted output
const formatOutput = computed(() => {
  if (!swap.quote.value || !swap.tokenTo.value) return '—'
  return formatTokenAmount(swap.quote.value.expectedBuyAmount, Number(swap.tokenTo.value.decimals))
})

// Rate display
const rateDisplay = computed(() => {
  if (!swap.exchangeRate.value) return '—'
  return swap.exchangeRate.value.toFixed(swap.exchangeRate.value >= 1 ? 4 : 6)
})

const invertedRateDisplay = computed(() => {
  if (!swap.exchangeRate.value || swap.exchangeRate.value === 0) return '—'
  const inv = 1 / swap.exchangeRate.value
  return inv.toFixed(inv >= 1 ? 4 : 6)
})

// Fee display
const feePercent = computed(() => `${Number(store.tradingFeeBps) / 100}%`)
const feeDisplay = computed(() => {
  if (!swap.quote.value || !swap.tokenFrom.value) return '—'
  return formatTokenAmount(swap.quote.value.fee, Number(swap.tokenFrom.value.decimals), swap.tokenFrom.value.symbol)
})

// USD equivalents
const fromAmountUSD = computed(() => {
  const a = parseFloat(swap.amountIn.value)
  if (!a || !swap.tokenFrom.value) return 0
  return a * store.getTokenPriceUSD(swap.tokenFrom.value.address)
})

const toAmountUSD = computed(() => {
  if (!swap.quote.value || !swap.tokenTo.value) return 0
  const out = Number(swap.quote.value.expectedBuyAmount) / 10 ** Number(swap.tokenTo.value.decimals)
  return out * store.getTokenPriceUSD(swap.tokenTo.value.address)
})

const feeUSD = computed(() => {
  if (!swap.quote.value || !swap.tokenFrom.value) return 0
  const fee = Number(swap.quote.value.fee) / 10 ** Number(swap.tokenFrom.value.decimals)
  return fee * store.getTokenPriceUSD(swap.tokenFrom.value.address)
})

// Impact color
const impactColorClass = computed(() => {
  const tier = swap.priceImpactTier.value
  if (tier === 'low') return 'swap-card__impact--low'
  if (tier === 'elevated') return 'swap-card__impact--moderate'
  if (tier === 'high') return 'swap-card__impact--high'
  return 'swap-card__impact--extreme'
})

// Show result overlay
const showResult = computed(() =>
  ['success', 'error', 'partialFill'].includes(swap.phase.value)
)

const resultType = computed(() => swap.phase.value as 'success' | 'error' | 'partialFill')

// Swap button logic
const isTooSmall = computed(() =>
  swap.quote.value && swap.quote.value.expectedBuyAmount === 0n
)

const canClickSwap = computed(() => {
  if (!store.isAuthenticated) return true // will prompt connect
  if (isTooSmall.value) return false
  return swap.canSwap.value
})

function onSwapClick() {
  if (!store.isAuthenticated) {
    auth.connect()
    return
  }
  swap.startSwap()
}

// Set default tokens on mount — prefer store's selected pair
onMounted(() => {
  if (!swap.tokenFrom.value) {
    swap.tokenFrom.value = (store.selectedToken0 ? store.getTokenByAddress(store.selectedToken0) : null)
      ?? store.tokens[0] ?? null
  }
  if (!swap.tokenTo.value) {
    swap.tokenTo.value = (store.selectedToken1 ? store.getTokenByAddress(store.selectedToken1) : null)
      ?? store.tokens[1] ?? null
  }
})
</script>

<style scoped lang="scss">
.swap-card {
  background: var(--tx-panel-bg);
  border: var(--tx-panel-border);
  border-radius: var(--tx-r-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--tx-shadow-1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__header-right {
    display: flex;
    gap: var(--space-2);
  }

  &__settings-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: 6px;
    transition: color 0.15s;

    &:hover, &--active { color: var(--accent-primary); }
  }

  // Field (From / To)
  &__field {
    border-radius: 12px;
  }

  &__field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  &__field-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__balance {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__token-img {
    border-radius: 50%;
    object-fit: cover;
  }

  &__pct-slider {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }

  &__slider {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--bg-tertiary);
    border-radius: 2px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent-primary);
      cursor: pointer;
    }
    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent-primary);
      border: none;
      cursor: pointer;
    }
  }

  &__pct-row {
    display: flex;
    gap: 4px;
  }


  &__field-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__token-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: rgba(196, 90, 10, 0.08);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    padding: 4px 10px 4px 6px;
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:hover { border-color: var(--accent-primary); background: rgba(196, 90, 10, 0.15); }
  }

  &__token-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent-primary-muted);
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: var(--weight-bold);
  }

  &__token-symbol {
    font-weight: var(--weight-semibold);
  }

  &__amount-input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: var(--text-2xl);
    font-family: var(--font-mono);
    text-align: right;
    outline: none;
    min-width: 0;

    &::placeholder { color: var(--text-tertiary); }
    &:disabled { opacity: 0.5; }
  }

  &__output {
    flex: 1;
    text-align: right;
    font-size: var(--text-2xl);
    font-family: var(--font-mono);
    color: var(--text-primary);
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__output-placeholder {
    color: var(--text-tertiary);
  }

  &__usd-hint {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-align: right;
    padding-right: 2px;
  }

  &__usd-subtle {
    color: var(--text-tertiary);
    font-size: var(--text-xs);
  }

  &__split-routes {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__split-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
  }


  &__split-detail {
    color: var(--color-buy);
    font-size: var(--text-xs);
  }

  &__split-leg {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  &__split-pct {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--accent-primary);
    min-width: 36px;
    flex-shrink: 0;
  }

  // Flip button (mockup: 36×36 circle, sits on the seam between wells,
  // 3px bg border creates the "cut-out" look, -20px negative margins)
  &__flip-wrap {
    display: flex;
    justify-content: center;
    margin: -20px 0;
    position: relative;
    z-index: 2;
  }

  &__flip-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--tx-surface-2);
    border: 3px solid var(--tx-bg);
    color: var(--tx-ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--tx-shadow-1);
    transition: color 140ms, transform 140ms;

    &:hover { color: var(--tx-orange); }
    &:active { transform: scale(0.92); }
  }

  &__flip-icon--flipped {
    transform: rotate(180deg);
    transition: transform 0.3s ease;
  }

  // Info section
  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-tertiary);
    border-radius: 8px;
  }

  &__info-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);

    span:last-child { color: var(--text-primary); }
  }

  &__rate {
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover { color: var(--accent-primary) !important; }
  }

  &__impact {
    &--low { color: var(--color-buy) !important; }
    &--moderate { color: var(--color-warning) !important; }
    &--high { color: var(--accent-primary) !important; }
    &--extreme { color: var(--color-sell) !important; }
  }

  &__limit-tag {
    font-size: var(--text-xs);
    opacity: 0.7;
  }

  &__route-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2) 0;
    border-top: 1px solid var(--border-primary);
  }

  &__route-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    align-self: flex-start;
  }


  // Swap button
  &__swap-btn {
    width: 100%;
    margin-top: var(--space-2);
    font-size: var(--text-lg);
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
