<template>
  <div class="market-order-form">
    <!-- Buy / Sell Toggle -->
    <div class="market-order-form__side-toggle">
      <button
        class="market-order-form__side-btn market-order-form__side-btn--buy"
        :class="{ 'market-order-form__side-btn--active': side === 'buy' }"
        @click="setSide('buy')"
      >Buy {{ baseSymbol }}</button>
      <button
        class="market-order-form__side-btn market-order-form__side-btn--sell"
        :class="{ 'market-order-form__side-btn--active': side === 'sell' }"
        @click="setSide('sell')"
      >Sell {{ baseSymbol }}</button>
    </div>

    <!-- From Token -->
    <div class="market-order-form__field">
      <label class="market-order-form__label">
        You Pay ({{ fromSymbol }})
      </label>
      <input
        v-model="fromAmount"
        type="text"
        inputmode="decimal"
        class="ex-input market-order-form__input num"
        placeholder="0.00"
        @keypress="onlyNumbers"
        @input="onAmountChange"
      />
      <span v-if="payUSD > 0" class="market-order-form__usd-hint num">&asymp; {{ formatUSD(payUSD) }}</span>
      <input
        type="range" min="0" max="100" step="1"
        v-model.number="pctSlider"
        class="market-order-form__slider"
        @input="setPercentage(pctSlider)"
      />
      <div class="market-order-form__pct-row">
        <button
          v-for="pct in [25, 50, 75, 100]"
          :key="pct"
          class="ex-pct-btn"
          :class="{ 'ex-pct-btn--active': pctSlider === pct }"
          @click="pctSlider = pct; setPercentage(pct)"
        >{{ pct }}%</button>
      </div>
    </div>

    <!-- To Token -->
    <div class="market-order-form__field">
      <label class="market-order-form__label">
        You Receive ({{ toSymbol }})
      </label>
      <div class="ex-input market-order-form__output num">
        <template v-if="phase === 'quoteFetching'">...</template>
        <template v-else>{{ expectedOutput || '—' }}</template>
      </div>
      <span v-if="receiveUSD > 0" class="market-order-form__usd-hint num">&asymp; {{ formatUSD(receiveUSD) }}</span>
    </div>

    <!-- Quote Info -->
    <div v-if="quoteData" class="market-order-form__info">
      <div class="market-order-form__info-row">
        <span>Price Impact</span>
        <span :class="impactClass">{{ quoteData.priceImpact.toFixed(2) }}%</span>
      </div>
      <div class="market-order-form__info-row">
        <span>Route</span>
        <RouteDisplay
          :description="quoteData.routeDescription"
          :route="quoteData.route"
          :hopDetails="quoteData.hopDetails"
        />
      </div>
      <div class="market-order-form__info-row">
        <span>Fee</span>
        <span class="num">{{ feeDisplay }}</span>
      </div>
      <div class="market-order-form__info-row">
        <span>Slippage</span>
        <span>{{ slippage }}%</span>
      </div>
      <div v-if="!quoteData.canFulfillFully" class="ex-warning-box market-order-form__partial-warn">
        Only part can be filled immediately. Remainder becomes a limit order.
      </div>
      <div v-if="impactTier === 'high'" class="ex-warning-box market-order-form__impact-warn">
        Large price impact — you're moving the price significantly. Consider a smaller amount.
      </div>
      <div v-if="impactTier === 'extreme'" class="ex-error-box market-order-form__impact-warn">
        <div><strong>Extreme price impact ({{ quoteData.priceImpact.toFixed(2) }}%)</strong> — this swap will cost a large share to slippage.</div>
        <label class="market-order-form__impact-ack">
          <input type="checkbox" v-model="impactAcknowledged" />
          I understand this swap will cost ~{{ quoteData.priceImpact.toFixed(1) }}% to price impact.
        </label>
      </div>
    </div>

    <!-- Multi-hop alternative (when direct is chosen but multi-hop available) -->
    <div v-if="multiHopAlt && !quoteData?.isMultiHop" class="market-order-form__multihop-alt">
      <span>Multi-hop available: ~{{ formatMultiHopAmount }} {{ toSymbol }} ({{ multiHopAlt.hops }} hops)</span>
      <router-link
        :to="`/easy?from=${fromToken}&to=${toToken}&amount=${fromAmount}`"
        class="market-order-form__easy-link"
      >Open in Easy Swap →</router-link>
    </div>

    <!-- Error -->
    <div v-if="error" class="ex-error-box">{{ error }}</div>

    <!-- Success -->
    <div v-if="phase === 'success'" class="ex-success-box market-order-form__success">
      Swap executed successfully!
    </div>

    <!-- Submit -->
    <button
      class="ex-btn market-order-form__submit"
      :class="side === 'buy' ? 'ex-btn--buy' : 'ex-btn--sell'"
      :disabled="!canSubmit"
      @click="executeSwap"
    >
      <template v-if="quoteData && quoteData.expectedBuyAmount === 0n">Trade amount too small</template>
      <template v-else-if="phase === 'quoteFetching'">Getting Quote...</template>
      <template v-else-if="phase === 'depositing'">Depositing...</template>
      <template v-else-if="phase === 'submitting'">Swapping...</template>
      <template v-else>{{ side === 'buy' ? 'Buy' : 'Sell' }} {{ baseSymbol }}</template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { formatUSD } from '../../utils/format'
import { useExchangeToast } from '../../composables/useExchangeToast'
import RouteDisplay from '../shared/RouteDisplay.vue'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  // Orderbook-click pre-fill (optional). prefilledAmount is always in base
  // (token0) units — we convert to quote for buy side using prefilledPrice.
  prefilledSide?: 'buy' | 'sell' | null
  prefilledAmount?: number | null
  prefilledPrice?: number | null
}>()

const store = useExchangeStore()
const toast = useExchangeToast()

const side = ref<'buy' | 'sell'>('buy')
const pctSlider = ref(0)

// Buy: user pays token1 (quote) to get token0 (base)
// Sell: user pays token0 (base) to get token1 (quote)
const fromToken = computed(() => side.value === 'buy' ? props.token1 : props.token0)
const toToken = computed(() => side.value === 'buy' ? props.token0 : props.token1)
const fromDecimals = computed(() => side.value === 'buy' ? props.decimals1 : props.decimals0)
const toDecimals = computed(() => side.value === 'buy' ? props.decimals0 : props.decimals1)

const baseSymbol = computed(() => store.getTokenByAddress(props.token0)?.symbol ?? 'Token')
const quoteSymbol = computed(() => store.getTokenByAddress(props.token1)?.symbol ?? 'Token')
const fromSymbol = computed(() => store.getTokenByAddress(fromToken.value)?.symbol ?? 'Token')
const toSymbol = computed(() => store.getTokenByAddress(toToken.value)?.symbol ?? 'Token')

const fromAmount = ref('')
const expectedOutput = ref('')
const slippage = ref<number>(
  (() => {
    try {
      const stored = localStorage.getItem('taco_slippage')
      if (stored) return JSON.parse(stored).value ?? 0.5
    } catch { /* ignore */ }
    return 0.5
  })()
)
const phase = ref<'idle' | 'quoteFetching' | 'depositing' | 'submitting' | 'success' | 'error'>('idle')
const error = ref('')

interface SwapHop { tokenIn: string; tokenOut: string }
interface HopDetailData { tokenIn: string; tokenOut: string; amountIn: bigint; amountOut: bigint; fee: bigint; priceImpact: number }
interface QuoteData {
  expectedBuyAmount: bigint
  fee: bigint
  priceImpact: number
  routeDescription: string
  canFulfillFully: boolean
  isMultiHop: boolean
  route: SwapHop[] | null
  hopDetails: HopDetailData[]
}
const quoteData = ref<QuoteData | null>(null)
const multiHopAlt = ref<{ amount: bigint; hops: number; route: SwapHop[] } | null>(null)

const formatMultiHopAmount = computed(() => {
  if (!multiHopAlt.value) return '—'
  return (Number(multiHopAlt.value.amount) / 10 ** toDecimals.value).toFixed(Math.min(toDecimals.value, 6))
})

let quoteTimeout: ReturnType<typeof setTimeout> | null = null

const payUSD = computed(() => {
  const a = parseFloat(fromAmount.value)
  if (!a || a <= 0) return 0
  return a * store.getTokenPriceUSD(fromToken.value)
})

const receiveUSD = computed(() => {
  const out = parseFloat(expectedOutput.value)
  if (!out || out <= 0) return 0
  return out * store.getTokenPriceUSD(toToken.value)
})

const feeDisplay = computed(() => {
  if (!quoteData.value) return '—'
  const fee = Number(quoteData.value.fee) / 10 ** fromDecimals.value
  return `${fee.toFixed(fee >= 0.001 ? 4 : 6)} ${fromSymbol.value}`
})

// Backend-team spec: elevated > 5 %, high > 15 %, extreme > 25 %.
const impactTier = computed<'low' | 'elevated' | 'high' | 'extreme'>(() => {
  const impact = quoteData.value?.priceImpact ?? 0
  if (impact > 25) return 'extreme'
  if (impact > 15) return 'high'
  if (impact > 5) return 'elevated'
  return 'low'
})
const impactClass = computed(() => {
  switch (impactTier.value) {
    case 'low':      return 'market-order-form__impact--low'
    case 'elevated': return 'market-order-form__impact--medium'
    case 'high':
    case 'extreme':  return 'market-order-form__impact--high'
  }
})
const impactAcknowledged = ref(false)
watch(() => quoteData.value?.priceImpact, () => { impactAcknowledged.value = false })

const canSubmit = computed(() => {
  if (!store.isAuthenticated) return false
  if (phase.value === 'depositing' || phase.value === 'submitting' || phase.value === 'quoteFetching') return false
  const a = parseFloat(fromAmount.value)
  if (!(a > 0) || quoteData.value === null) return false
  if (impactTier.value === 'extreme' && !impactAcknowledged.value) return false
  return true
})

function setSide(s: 'buy' | 'sell') {
  side.value = s
  fromAmount.value = ''
  expectedOutput.value = ''
  quoteData.value = null
  pctSlider.value = 0
}

// Orderbook-click pre-fill: switch to the clicked side and load the
// cumulative sweep amount into fromAmount. Buy side converts base → quote
// using the clicked level's price (fromAmount is always in the current
// "from" token).
watch(
  () => [props.prefilledAmount, props.prefilledSide, props.prefilledPrice] as const,
  ([amountBase, newSide, price]) => {
    if (amountBase == null || !(amountBase > 0) || !newSide) return
    if (side.value !== newSide) side.value = newSide
    let inFromUnits: number
    if (newSide === 'sell') {
      // Selling base → fromAmount is in base. Direct.
      inFromUnits = amountBase
    } else {
      // Buying base → fromAmount is in quote. Convert via the clicked price
      // (level price; good-enough approximation for sweep-to-this-level).
      if (!price || !(price > 0)) return
      inFromUnits = amountBase * price
    }
    const dp = Math.min(fromDecimals.value, 6)
    fromAmount.value = inFromUnits.toFixed(dp).replace(/0+$/, '').replace(/\.$/, '')
    onAmountChange()
  },
  { immediate: true },
)

function onAmountChange() {
  if (quoteTimeout) clearTimeout(quoteTimeout)
  quoteTimeout = setTimeout(fetchQuote, 500)
}

async function fetchQuote() {
  const a = parseFloat(fromAmount.value)
  if (!a || a <= 0) {
    expectedOutput.value = ''
    quoteData.value = null
    return
  }

  phase.value = 'quoteFetching'
  error.value = ''

  try {
    const rawAmount = BigInt(Math.round(a * 10 ** fromDecimals.value))

    // Always use getExpectedMultiHopAmount — works for both direct (1-hop) and multi-hop
    const multiHop = await store.getExpectedMultiHopAmount(fromToken.value, toToken.value, rawAmount).catch(() => null)
    const m = multiHop as any

    if (m?.bestRoute?.length > 0 && m?.expectedAmountOut > 0n) {
      quoteData.value = {
        expectedBuyAmount: m.expectedAmountOut,
        fee: m.totalFee ?? 0n,
        priceImpact: (m.priceImpact ?? 0) * 100,
        routeDescription: Number(m.hops ?? 1) > 1 ? `Multi-hop (${m.hops} hops)` : 'Direct',
        canFulfillFully: true,
        isMultiHop: true, // always use swapMultiHop
        route: m.bestRoute,
        hopDetails: (m.hopDetails ?? []) as HopDetailData[],
      }
    } else {
      // Fallback: no route found
      quoteData.value = {
        expectedBuyAmount: 0n,
        fee: 0n,
        priceImpact: 0,
        routeDescription: 'No route available',
        canFulfillFully: false,
        isMultiHop: false,
        route: null,
        hopDetails: [],
      }
    }
    multiHopAlt.value = null

    // Convert per-hop priceImpact from 0-1 ratio to percentage
    if (quoteData.value.hopDetails?.length) {
      for (const hop of quoteData.value.hopDetails) {
        if (hop.priceImpact > 0 && hop.priceImpact <= 1) {
          hop.priceImpact = hop.priceImpact * 100
        }
      }
    }

    // Fallback: if backend returned priceImpact 0, estimate from spot rate
    if (quoteData.value.priceImpact === 0 && quoteData.value.expectedBuyAmount > 0n && rawAmount > 0n) {
      try {
        const oneUnit = 10n ** BigInt(fromDecimals.value)
        const spotQuote = await store.getExpectedReceiveAmount(fromToken.value, toToken.value, oneUnit)
        const spotOut = (spotQuote as any)?.expectedBuyAmount ?? 0n
        if (spotOut > 0n) {
          const spotRate = Number(spotOut) / (10 ** toDecimals.value)
          const execRate = Number(quoteData.value.expectedBuyAmount) / (10 ** toDecimals.value) / (Number(rawAmount) / (10 ** fromDecimals.value))
          if (spotRate > 0) {
            quoteData.value.priceImpact = Math.abs((1 - execRate / spotRate)) * 100
          }
        }
      } catch { /* keep 0 if spot quote fails */ }
    }

    // Fallback: fix per-hop priceImpact when backend returns 0
    if (quoteData.value.hopDetails?.length) {
      for (const hop of quoteData.value.hopDetails) {
        if (hop.priceImpact === 0 && hop.amountIn > 0n && hop.amountOut > 0n) {
          try {
            const decIn = Number(store.getTokenByAddress(hop.tokenIn)?.decimals ?? 8n)
            const decOut = Number(store.getTokenByAddress(hop.tokenOut)?.decimals ?? 8n)
            const oneUnit = 10n ** BigInt(decIn)
            const spotQuote = await store.getExpectedReceiveAmount(hop.tokenIn, hop.tokenOut, oneUnit)
            const spotOut = (spotQuote as any)?.expectedBuyAmount ?? 0n
            if (spotOut > 0n) {
              const spotRate = Number(spotOut) / (10 ** decOut)
              const execRate = (Number(hop.amountOut) / (10 ** decOut)) / (Number(hop.amountIn) / (10 ** decIn))
              if (spotRate > 0) {
                hop.priceImpact = Math.abs((1 - execRate / spotRate)) * 100
              }
            }
          } catch { /* keep 0 */ }
        }
      }
    }

    const output = Number(quoteData.value.expectedBuyAmount) / 10 ** toDecimals.value
    expectedOutput.value = output.toFixed(Math.min(toDecimals.value, 6))
    phase.value = 'idle'
  } catch (err: any) {
    error.value = err.message || 'Failed to get quote'
    expectedOutput.value = ''
    quoteData.value = null
    multiHopAlt.value = null
    phase.value = 'idle'
  }
}

async function executeSwap() {
  const a = parseFloat(fromAmount.value)
  if (!a || a <= 0 || !quoteData.value) return

  error.value = ''
  phase.value = 'depositing'

  try {
    const fromInfo = store.getTokenByAddress(fromToken.value)
    if (!fromInfo) throw new Error('Token not found')

    const { depositToken } = await import('../../utils/deposit')
    const rawAmount = BigInt(Math.round(a * 10 ** fromDecimals.value))

    const blockNumber = await depositToken(
      fromToken.value,
      fromInfo.asset_type as any,
      rawAmount,
      store.tradingFeeBps,
      BigInt(fromInfo.transfer_fee),
      store.treasuryAccountId,
      store.treasuryPrincipal,
    )

    phase.value = 'submitting'

    if (!quoteData.value.route?.length) {
      error.value = 'No route available for this swap'
      phase.value = 'error'
      return
    }

    const minOut = quoteData.value.expectedBuyAmount *
      BigInt(Math.floor((100 - slippage.value) * 100)) / 10000n

    const result = await store.swapMultiHop(
      fromToken.value,
      toToken.value,
      rawAmount,
      quoteData.value.route,
      minOut,
      blockNumber,
    )

    if ('Ok' in result) {
      phase.value = 'success'
      store.refreshExchangeInfo()
      const received = Number(result.Ok.amountOut) / 10 ** toDecimals.value
      toast.success('Swap Complete', received.toFixed(Math.min(toDecimals.value, 6)) + ' ' + toSymbol.value + ' received')
      setTimeout(() => { phase.value = 'idle'; fromAmount.value = ''; expectedOutput.value = ''; quoteData.value = null; multiHopAlt.value = null }, 3000)
    } else {
      const { classifyExchangeError } = await import('../../utils/errors')
      const hops = (quoteData.value?.hopDetails ?? []) as Array<{ tokenOut: string }>
      const classified = classifyExchangeError(result.Err, {
        outDecimals: toDecimals.value,
        outSymbol: toSymbol.value,
        hopTokens: hops.map(h => {
          const tok = store.getTokenByAddress(h.tokenOut)
          return { symbol: tok?.symbol ?? h.tokenOut.slice(0, 8) }
        }),
      })
      error.value = classified.message
      phase.value = 'error'
      toast.error(classified.title, classified.message)
    }
  } catch (err: any) {
    error.value = err.message || 'Swap failed'
    phase.value = 'error'
    toast.error('Swap Failed', error.value)
  }
}

function bigIntToDecimal(amount: bigint, decimals: number, maxFrac: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = amount / divisor
  const frac = amount % divisor
  if (maxFrac === 0) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac)
  return `${whole}.${fracStr}`
}

async function setPercentage(pct: number) {
  pctSlider.value = pct
  const balance = await store.getUserBalance(fromToken.value)
  if (balance > 0n) {
    const fromInfo = store.getTokenByAddress(fromToken.value)
    const fee = fromInfo ? BigInt(fromInfo.transfer_fee) : 0n
    const tradingFee = (balance * store.tradingFeeBps) / 10000n
    const maxAmount = balance - fee - tradingFee
    if (maxAmount <= 0n) return
    const useAmount = pct === 100 ? maxAmount : (maxAmount * BigInt(pct)) / 100n
    const dec = Math.min(fromDecimals.value, 6)
    fromAmount.value = bigIntToDecimal(useAmount, fromDecimals.value, dec)
    onAmountChange()
  }
}

function onlyNumbers(e: KeyboardEvent) {
  const char = e.key
  if (char !== '.' && (char < '0' || char > '9')) e.preventDefault()
}

// Reset when pair changes
watch([() => props.token0, () => props.token1], () => {
  fromAmount.value = ''
  expectedOutput.value = ''
  quoteData.value = null
  pctSlider.value = 0
})
</script>

<style scoped lang="scss">
.market-order-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);

  &__side-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: var(--bg-primary);
    border-radius: 6px;
    padding: 2px;
  }

  &__side-btn {
    padding: var(--space-2);
    border: none;
    border-radius: 4px;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    background: transparent;
    color: var(--text-tertiary);

    &--buy.market-order-form__side-btn--active { background: var(--color-buy); color: var(--text-cream); }
    &--sell.market-order-form__side-btn--active { background: var(--color-sell); color: var(--text-cream); }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input { width: 100%; }

  &__output {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    min-height: 36px;
    display: flex;
    align-items: center;
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
    margin-top: 2px;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--accent-primary); cursor: pointer;
    }
    &::-moz-range-thumb {
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--accent-primary); border: none; cursor: pointer;
    }
  }

  &__pct-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }


  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-xs);
  }

  &__info-row {
    display: flex;
    justify-content: space-between;
    color: var(--text-tertiary);
  }

  &__partial-warn {
    margin-top: var(--space-1);
  }

  &__impact {
    &--low { color: var(--color-buy); }
    &--medium { color: var(--color-warning); }
    &--high { color: var(--color-sell); }
  }

  &__multihop-alt {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--text-xs);
    color: var(--accent-primary);
    background: rgba(196, 90, 10, 0.08);
    padding: var(--space-2);
    border-radius: 4px;
    border: 1px solid rgba(196, 90, 10, 0.2);
  }

  &__easy-link {
    color: var(--accent-primary);
    text-decoration: underline;
    font-weight: 600;
    &:hover { color: var(--accent-primary-hover); }
  }

  &__success {
    text-align: center;
  }

  &__usd-hint {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__submit {
    width: 100%;
    padding: var(--space-3);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
  }
}
</style>
