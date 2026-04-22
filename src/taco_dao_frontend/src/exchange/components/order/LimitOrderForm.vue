<template>
  <div class="limit-order-form">
    <!-- Buy / Sell Toggle -->
    <div class="limit-order-form__side-toggle">
      <button
        class="limit-order-form__side-btn limit-order-form__side-btn--buy"
        :class="{ 'limit-order-form__side-btn--active': side === 'buy' }"
        @click="side = 'buy'"
      >Buy {{ baseSymbol }}</button>
      <button
        class="limit-order-form__side-btn limit-order-form__side-btn--sell"
        :class="{ 'limit-order-form__side-btn--active': side === 'sell' }"
        @click="side = 'sell'"
      >Sell {{ baseSymbol }}</button>
    </div>

    <!-- What you're paying with -->
    <div class="limit-order-form__deposit-info">
      Paying with <strong>{{ side === 'buy' ? quoteSymbol : baseSymbol }}</strong>
    </div>

    <!-- Price Input -->
    <div class="limit-order-form__field">
      <label class="limit-order-form__label">Price per {{ baseSymbol }} (in {{ quoteSymbol }})</label>
      <div class="limit-order-form__input-row">
        <input
          v-model="price"
          type="text"
          inputmode="decimal"
          class="ex-input limit-order-form__input num"
          placeholder="0.00"
          @keypress="onlyNumbers"
        />
        <button class="limit-order-form__tick-btn" @click="incrementPrice(-1)" title="Decrease price">-</button>
        <button class="limit-order-form__tick-btn" @click="incrementPrice(1)" title="Increase price">+</button>
      </div>
      <span v-if="priceUSD > 0" class="limit-order-form__usd-hint num">&asymp; {{ formatUSD(priceUSD) }}</span>
    </div>

    <!-- Amount Input -->
    <div class="limit-order-form__field">
      <label class="limit-order-form__label">Amount ({{ baseSymbol }}) <span v-if="depositBalance" class="limit-order-form__bal">Bal: {{ depositBalance }}</span></label>
      <input
        v-model="amount"
        type="text"
        inputmode="decimal"
        class="ex-input limit-order-form__input num"
        placeholder="0.00"
        @keypress="onlyNumbers"
      />
      <span v-if="amountUSD > 0" class="limit-order-form__usd-hint num">&asymp; {{ formatUSD(amountUSD) }}</span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        v-model.number="pctSlider"
        class="limit-order-form__slider"
        @input="setAmountPercentage(pctSlider)"
      />
      <div class="limit-order-form__pct-row">
        <button
          v-for="pct in [25, 50, 75, 100]"
          :key="pct"
          class="ex-pct-btn"
          :class="{ 'ex-pct-btn--active': pctSlider === pct }"
          @click="pctSlider = pct; setAmountPercentage(pct)"
        >{{ pct }}%</button>
      </div>
    </div>

    <!-- Total (read-only) -->
    <div class="limit-order-form__field">
      <label class="limit-order-form__label">Total ({{ quoteSymbol }})</label>
      <div class="limit-order-form__total num">
        {{ total > 0 ? total.toFixed(totalDecimals) : '—' }} {{ quoteSymbol }}
      </div>
      <span v-if="totalUSD > 0" class="limit-order-form__usd-hint num">&asymp; {{ formatUSD(totalUSD) }}</span>
    </div>

    <!-- Deposit / Receive summary -->
    <div v-if="total > 0" class="limit-order-form__summary">
      <div class="limit-order-form__summary-row">
        <span>You deposit</span>
        <span class="num">
          {{ side === 'buy' ? total.toFixed(totalDecimals) + ' ' + quoteSymbol : amount + ' ' + baseSymbol }}
          <span v-if="depositUSD > 0" class="limit-order-form__usd-subtle">&asymp; {{ formatUSD(depositUSD) }}</span>
        </span>
      </div>
      <div class="limit-order-form__summary-row">
        <span>You receive</span>
        <span class="num">
          ~{{ side === 'buy' ? amount + ' ' + baseSymbol : total.toFixed(totalDecimals) + ' ' + quoteSymbol }}
          <span v-if="receiveUSD > 0" class="limit-order-form__usd-subtle">&asymp; {{ formatUSD(receiveUSD) }}</span>
        </span>
      </div>
    </div>

    <!-- Advanced Settings -->
    <details class="limit-order-form__advanced">
      <summary class="limit-order-form__advanced-summary">Advanced Settings</summary>
      <div class="limit-order-form__advanced-body">
        <label class="limit-order-form__checkbox">
          <input type="checkbox" v-model="options.allOrNothing" />
          <span>All or Nothing</span>
        </label>
        <label class="limit-order-form__checkbox">
          <input type="checkbox" v-model="options.strictlyOTC" />
          <span>OTC Only (no matching)</span>
        </label>
        <div class="limit-order-form__field" style="margin-top:var(--space-2)">
          <label class="limit-order-form__label">OC Link (optional)</label>
          <input
            v-model="options.ocLink"
            type="text"
            class="ex-input limit-order-form__input"
            placeholder="OpenChat link"
            maxlength="30"
          />
        </div>
      </div>
    </details>

    <!-- Fee Display -->
    <div v-if="estimatedFee > 0" class="limit-order-form__fee num">
      Fee: ~{{ estimatedFee.toFixed(estimatedFee < 0.001 ? 6 : 4) }} {{ depositSymbol }} ({{ feePctText }})
      <span v-if="feeUSD > 0" class="limit-order-form__usd-subtle">&asymp; {{ formatUSD(feeUSD) }}</span>
    </div>

    <!-- Error -->
    <div v-if="error" class="ex-error-box">{{ error }}</div>

    <!-- Result messages -->
    <div v-if="phase === 'success'" class="ex-success-box limit-order-form__result">
      Order filled immediately!
      <button class="limit-order-form__result-close" @click="reset()">&times;</button>
    </div>
    <div v-if="phase === 'resting'" class="limit-order-form__result limit-order-form__result--resting">
      Order placed. Code: <span class="num">{{ resultAccesscode.slice(0, 12) }}...</span>
      <button class="limit-order-form__result-close" @click="reset()">&times;</button>
    </div>

    <!-- Submit Button -->
    <button
      class="ex-btn limit-order-form__submit"
      :class="side === 'buy' ? 'ex-btn--buy' : 'ex-btn--sell'"
      :disabled="!canSubmit"
      @click="placeOrder"
    >
      <template v-if="phase === 'depositing'">Depositing...</template>
      <template v-else-if="phase === 'submitting'">Placing Order...</template>
      <template v-else>{{ side === 'buy' ? 'Buy' : 'Sell' }} {{ baseSymbol }}</template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLimitOrder } from '../../composables/useLimitOrder'
import { useExchangeStore } from '../../store/exchange.store'
import { formatUSD } from '../../utils/format'
import { toRef } from 'vue'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  prefilledPrice?: number | null
  prefilledSide?: 'buy' | 'sell' | null
  // Cumulative base-token amount from orderbook click (sweep-up-to-this-level)
  prefilledAmount?: number | null
}>()

const store = useExchangeStore()
const pctSlider = ref(0)

const {
  side,
  price,
  amount,
  total,
  estimatedFee,
  phase,
  error,
  resultAccesscode,
  options,
  placeOrder,
  reset,
  incrementPrice,
  setAmountPercentage,
} = useLimitOrder(
  toRef(props, 'token0'),
  toRef(props, 'token1'),
  toRef(props, 'decimals0'),
  toRef(props, 'decimals1'),
)

// Apply prefilled price and side from orderbook click (reactive)
watch(() => props.prefilledPrice, (newPrice) => {
  if (newPrice != null && newPrice > 0) {
    price.value = newPrice.toString()
  }
}, { immediate: true })

watch(() => props.prefilledSide, (newSide) => {
  if (newSide) side.value = newSide
})

// Cumulative base-token amount from orderbook click — fill the amount field
// so the order sweeps up to the clicked level.
watch(() => props.prefilledAmount, (newAmount) => {
  if (newAmount != null && newAmount > 0) {
    const dp = Math.min(props.decimals0, 6)
    amount.value = newAmount.toFixed(dp).replace(/0+$/, '').replace(/\.$/, '')
  }
}, { immediate: true })

const baseSymbol = computed(() => {
  const token = store.tokens.find(t => t.address === props.token0)
  return token?.symbol ?? 'Token'
})

const quoteSymbol = computed(() => {
  const token = store.tokens.find(t => t.address === props.token1)
  return token?.symbol ?? 'Token'
})

const depositSymbol = computed(() =>
  side.value === 'buy' ? quoteSymbol.value : baseSymbol.value
)

// Fetch deposit token balance
const depositBalanceRaw = ref(0n)
const depositBalance = computed(() => {
  if (depositBalanceRaw.value <= 0n) return ''
  const dec = side.value === 'buy' ? props.decimals1 : props.decimals0
  const val = Number(depositBalanceRaw.value) / 10 ** dec
  return `${val.toLocaleString(undefined, { maximumFractionDigits: Math.min(dec, 4) })} ${depositSymbol.value}`
})

async function refreshDepositBalance() {
  if (!store.isAuthenticated) { depositBalanceRaw.value = 0n; return }
  const addr = side.value === 'buy' ? props.token1 : props.token0
  depositBalanceRaw.value = await store.getUserBalance(addr)
}

watch([() => side.value, () => props.token0, () => props.token1], refreshDepositBalance, { immediate: true })

const priceUSD = computed(() => {
  const p = parseFloat(price.value)
  if (!p || p <= 0) return 0
  return p * store.getTokenPriceUSD(props.token1)
})

const totalUSD = computed(() => {
  if (total.value <= 0) return 0
  return total.value * store.getTokenPriceUSD(props.token1)
})

const amountUSD = computed(() => {
  const a = parseFloat(amount.value)
  if (!a || a <= 0) return 0
  return a * store.getTokenPriceUSD(props.token0)
})

const depositUSD = computed(() => {
  if (total.value <= 0) return 0
  if (side.value === 'buy') return total.value * store.getTokenPriceUSD(props.token1)
  const a = parseFloat(amount.value)
  return a > 0 ? a * store.getTokenPriceUSD(props.token0) : 0
})

const receiveUSD = computed(() => {
  if (total.value <= 0) return 0
  if (side.value === 'buy') {
    const a = parseFloat(amount.value)
    return a > 0 ? a * store.getTokenPriceUSD(props.token0) : 0
  }
  return total.value * store.getTokenPriceUSD(props.token1)
})

const feeUSD = computed(() => {
  if (estimatedFee.value <= 0) return 0
  const depositToken = side.value === 'buy' ? props.token1 : props.token0
  return estimatedFee.value * store.getTokenPriceUSD(depositToken)
})

const totalDecimals = computed(() => Math.min(props.decimals1, 6))

const feePctText = computed(() => {
  const bps = Number(store.tradingFeeBps)
  return `${(bps / 100).toFixed(2)}%`
})

const canSubmit = computed(() => {
  if (phase.value === 'depositing' || phase.value === 'submitting') return false
  if (!store.isAuthenticated) return false
  const p = parseFloat(price.value)
  const a = parseFloat(amount.value)
  return p > 0 && a > 0
})

function onlyNumbers(e: KeyboardEvent) {
  const char = e.key
  if (char !== '.' && (char < '0' || char > '9')) {
    e.preventDefault()
  }
}
</script>

<style scoped lang="scss">
.limit-order-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);

  &__side-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: var(--bg-primary);
    border-radius: 6px;
    padding: 2px;
  }

  &__deposit-info {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-align: center;
    strong { color: var(--text-primary); }
  }

  &__bal {
    font-weight: normal;
    color: var(--text-secondary);
    text-transform: none;
    letter-spacing: normal;
    margin-left: var(--space-1);
  }

  &__side-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    background: transparent;
    color: var(--text-tertiary);
    transition: all 0.15s;

    &--buy.limit-order-form__side-btn--active {
      background: var(--color-buy);
      color: var(--text-cream);
    }

    &--sell.limit-order-form__side-btn--active {
      background: var(--color-sell);
      color: var(--text-cream);
    }
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

  &__input-row {
    display: flex;
    gap: 2px;
  }

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__tick-btn {
    width: 32px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: var(--text-base);
    font-weight: var(--weight-bold);
    cursor: pointer;
    flex-shrink: 0;

    &:hover { background: var(--bg-primary); color: var(--text-primary); }
    &:active { transform: scale(0.95); }
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
    margin-top: var(--space-1);

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


  &__total {
    padding: var(--space-2);
    background: var(--bg-primary);
    border-radius: 4px;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-2);
    background: var(--bg-primary);
    border-radius: 4px;
    font-size: var(--text-xs);
  }

  &__summary-row {
    display: flex;
    justify-content: space-between;
    color: var(--text-tertiary);
    span:last-child { color: var(--text-primary); }
  }

  &__advanced {
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    overflow: hidden;
  }

  &__advanced-summary {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;

    &:hover { color: var(--text-primary); }
  }

  &__advanced-body {
    padding: var(--space-2) var(--space-3) var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;

    input[type="checkbox"] {
      accent-color: var(--accent-primary);
    }
  }

  &__fee {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-align: center;
  }

  &__result {
    text-align: center;
    position: relative;

    &--resting {
      font-size: var(--text-sm);
      padding: var(--space-2);
      border-radius: 4px;
      color: var(--accent-primary);
      background: var(--accent-primary-muted);
    }
  }

  &__result-close {
    position: absolute;
    top: 4px;
    right: 6px;
    background: none;
    border: none;
    color: inherit;
    opacity: 0.6;
    font-size: 16px;
    cursor: pointer;
    line-height: 1;
    padding: 2px;
    &:hover { opacity: 1; }
  }

  &__usd-hint {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__usd-subtle {
    color: var(--text-tertiary);
    font-size: var(--text-xs);
  }

  &__submit {
    width: 100%;
    padding: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
  }
}
</style>
