<template>
  <div class="cl-add">
    <!-- Pool Header -->
    <div v-if="poolInfo" class="cl-add__header">
      <div class="cl-add__stats">
        <span v-if="!inverted">Current price: 1 {{ symbol0 }} = {{ currentPriceDisplay }} {{ symbol1 }}</span>
        <span v-else>Current price: 1 {{ symbol1 }} = {{ invertedPriceDisplay }} {{ symbol0 }}</span>
        <span>Fee: {{ feeDisplay }}</span>
      </div>
    </div>

    <div class="cl-add__columns">
      <!-- Left Column: Deposits -->
      <div class="cl-add__left">
        <h4 class="cl-add__section-title">Deposit amounts</h4>

        <!-- Token 0 -->
        <div class="cl-add__token-field" :class="{ 'cl-add__token-field--disabled': token0Disabled }">
          <div class="cl-add__token-header">
            <span class="cl-add__token-name">{{ symbol0 }}</span>
            <span v-if="props.balance0 > 0n" class="cl-add__token-bal">Bal: {{ formatBal(props.balance0, props.decimals0) }}</span>
          </div>
          <input
            v-model="amount0"
            type="text"
            inputmode="decimal"
            class="ex-input num cl-add__amount-input"
            placeholder="0.0"
            :disabled="token0Disabled"
            @input="onAmount0Change"
            @keypress="onlyNumbers"
          />
          <div class="cl-add__pct-btns">
            <button v-for="p in [25,50,75,100]" :key="'a0'+p"
              class="ex-pct-btn" :disabled="token0Disabled"
              @click="setPercentage0(p)"
            >{{ p }}%</button>
          </div>
        </div>

        <!-- Token 1 -->
        <div class="cl-add__token-field" :class="{ 'cl-add__token-field--disabled': token1Disabled }">
          <div class="cl-add__token-header">
            <span class="cl-add__token-name">{{ symbol1 }}</span>
            <span v-if="props.balance1 > 0n" class="cl-add__token-bal">Bal: {{ formatBal(props.balance1, props.decimals1) }}</span>
          </div>
          <input
            v-model="amount1"
            type="text"
            inputmode="decimal"
            class="ex-input num cl-add__amount-input"
            placeholder="0.0"
            :disabled="token1Disabled"
            @input="onAmount1Change"
            @keypress="onlyNumbers"
          />
          <div class="cl-add__pct-btns">
            <button v-for="p in [25,50,75,100]" :key="'a1'+p"
              class="ex-pct-btn" :disabled="token1Disabled"
              @click="setPercentage1(p)"
            >{{ p }}%</button>
          </div>
        </div>

        <!-- Efficiency Info -->
        <div v-if="efficiencyMultiplier > 1.01" class="cl-add__efficiency">
          {{ efficiencyMultiplier.toFixed(1) }}x capital efficiency vs full range
        </div>
      </div>

      <!-- Right Column: Chart + Range -->
      <div class="cl-add__right">
        <div class="cl-add__range-header">
          <h4 class="cl-add__section-title">Set price range</h4>
          <div class="cl-add__flip-toggle">
            <button
              class="cl-add__flip-btn"
              :class="{ 'cl-add__flip-btn--active': !inverted }"
              @click="inverted = false"
            >{{ symbol0 }}</button>
            <button
              class="cl-add__flip-btn"
              :class="{ 'cl-add__flip-btn--active': inverted }"
              @click="inverted = true"
            >{{ symbol1 }}</button>
          </div>
        </div>

        <!-- Chart -->
        <div class="cl-add__chart-wrap">
          <LiquidityDistributionChart
            v-if="props.token0 && props.token1 && displayCurrentPrice > 0"
            :token0="props.token0"
            :token1="props.token1"
            :decimals0="props.decimals0"
            :decimals1="props.decimals1"
            :currentPrice="displayCurrentPrice"
            :selectedLower="displayLower"
            :selectedUpper="displayUpper"
            @update:selectedLower="onChartLowerDrag($event)"
            @update:selectedUpper="onChartUpperDrag($event)"
          />
        </div>

        <!-- Range Selector -->
        <RangeSelector
          :currentPrice="displayCurrentPrice"
          :decimals0="props.decimals0"
          :decimals1="props.decimals1"
          :symbol0="inverted ? symbol1 : symbol0"
          :symbol1="inverted ? symbol0 : symbol1"
          :modelLower="displayLower"
          :modelUpper="displayUpper"
          @update:modelLower="onDisplayLowerChange($event)"
          @update:modelUpper="onDisplayUpperChange($event)"
        />
      </div>
    </div>

    <!-- Error / Phase -->
    <div v-if="error" class="ex-error-box">{{ error }}</div>
    <div v-if="phase !== 'idle' && phase !== 'success'" class="cl-add__phase">
      <template v-if="phase === 'deposit0'">Step 1/3: Depositing {{ symbol0 }}...</template>
      <template v-else-if="phase === 'deposit1'">Step 2/3: Depositing {{ symbol1 }}...</template>
      <template v-else-if="phase === 'adding'">Step 3/3: Adding liquidity...</template>
    </div>
    <div v-if="phase === 'success'" class="ex-success-box cl-add__success">
      Liquidity added! Position ID: #{{ resultPositionId }}
    </div>

    <!-- Submit -->
    <button
      class="ex-btn ex-btn--primary cl-add__submit"
      :disabled="!canSubmit && store.isAuthenticated"
      @click="store.isAuthenticated ? submit() : auth.connect()"
    >
      <template v-if="!store.isAuthenticated">Connect Wallet</template>
      <template v-else-if="phase === 'deposit0' || phase === 'deposit1' || phase === 'adding'">Processing...</template>
      <template v-else-if="!props.token0 || !props.token1">Select a pair</template>
      <template v-else-if="!parseFloat(amount0) && !parseFloat(amount1)">Enter the amount</template>
      <template v-else>Add Concentrated Liquidity</template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { depositTokenForLiquidity, removeDepositFromCache } from '../../utils/deposit'
import { calculateAmounts, capitalEfficiency, priceToRatio, formatRangePrice, parseAddResult } from '../../utils/concentrated'
import { isTransportError, verifyAfterTransportError, type VerifyStatus } from '../../utils/errors'
import { useExchangeAuth } from '../../composables/useExchangeAuth'
import { useExchangeToast } from '../../composables/useExchangeToast'
import LiquidityDistributionChart from './LiquidityDistributionChart.vue'
import RangeSelector from './RangeSelector.vue'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  balance0: bigint
  balance1: bigint
}>()

const store = useExchangeStore()
const auth = useExchangeAuth()
const toast = useExchangeToast()

const symbol0 = computed(() => store.getTokenByAddress(props.token0)?.symbol ?? 'Token 0')
const symbol1 = computed(() => store.getTokenByAddress(props.token1)?.symbol ?? 'Token 1')
const info0 = computed(() => store.tokens.find(t => t.address === props.token0))
const info1 = computed(() => store.tokens.find(t => t.address === props.token1))

// Pool info
const poolInfo = ref<any>(null)
const currentPrice = ref(0)

// Amounts
const amount0 = ref('')
const amount1 = ref('')

// Range (always stored as token1-per-token0, the native direction)
// priceUpper = Infinity and priceLower <= 0 are the "unbounded" markers —
// the submit handler rejects either condition because full-range must go
// through addLiquidity (V2), not addConcentratedLiquidity (V3).
const priceLower = ref(0)
const priceUpper = ref(Infinity)
const inverted = ref(false) // when true, display as token0-per-token1

// Display values: flip when inverted
// Inverted: if native price = 1132 (ICP per ckETH), inverted = 1/1132 = 0.000883 (ckETH per ICP)
// When inverted, lower/upper swap: native lower becomes display upper and vice versa
const displayCurrentPrice = computed(() => {
  if (currentPrice.value <= 0) return 0
  return inverted.value ? 1 / currentPrice.value : currentPrice.value
})

const displayLower = computed(() => {
  if (inverted.value) {
    return !isFinite(priceUpper.value) ? 0 : 1 / priceUpper.value
  }
  return priceLower.value
})

const displayUpper = computed(() => {
  if (inverted.value) {
    return priceLower.value <= 0 ? Infinity : 1 / priceLower.value
  }
  return priceUpper.value
})

const invertedPriceDisplay = computed(() => {
  if (currentPrice.value <= 0) return '—'
  return formatRangePrice(1 / currentPrice.value)
})

function onDisplayLowerChange(val: number) {
  if (inverted.value) {
    // Display lower in inverted = native upper
    priceUpper.value = val <= 0 ? Infinity : 1 / val
  } else {
    priceLower.value = val
  }
  recalcAmounts()
}

function onDisplayUpperChange(val: number) {
  if (inverted.value) {
    // Display upper in inverted = native lower
    priceLower.value = !isFinite(val) || val <= 0 ? 0 : 1 / val
  } else {
    priceUpper.value = !isFinite(val) || val <= 0 ? Infinity : val
  }
  recalcAmounts()
}

function onChartLowerDrag(val: number) {
  if (inverted.value) {
    priceUpper.value = val <= 0 ? Infinity : 1 / val
  } else {
    priceLower.value = val
  }
  recalcAmounts()
}

function onChartUpperDrag(val: number) {
  if (inverted.value) {
    priceLower.value = val <= 0 ? 0 : 1 / val
  } else {
    priceUpper.value = val
  }
  recalcAmounts()
}

// Phase
const phase = ref<'idle' | 'deposit0' | 'deposit1' | 'adding' | 'success'>('idle')
const error = ref('')
const resultPositionId = ref(0n)

const efficiencyMultiplier = computed(() => {
  if (priceLower.value <= 0 || priceUpper.value <= priceLower.value) return 1
  return capitalEfficiency(priceLower.value, priceUpper.value)
})

const token0Disabled = computed(() => currentPrice.value > 0 && currentPrice.value >= priceUpper.value)
const token1Disabled = computed(() => currentPrice.value > 0 && priceLower.value > 0 && currentPrice.value <= priceLower.value)

const currentPriceDisplay = computed(() => {
  if (currentPrice.value <= 0) return '—'
  return formatRangePrice(currentPrice.value)
})
const feeDisplay = computed(() => `${Number(store.tradingFeeBps) / 100}%`)

const canSubmit = computed(() => {
  if (!store.isAuthenticated || !props.token0 || !props.token1) return false
  if (phase.value !== 'idle' && phase.value !== 'success') return false
  const a0 = parseFloat(amount0.value)
  const a1 = parseFloat(amount1.value)
  if (token0Disabled.value) return a1 > 0
  if (token1Disabled.value) return a0 > 0
  return (a0 > 0 || a1 > 0)
})

function formatBal(balance: bigint, decimals: number): string {
  return (Number(balance) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function onlyNumbers(e: KeyboardEvent) {
  if (e.key !== '.' && (e.key < '0' || e.key > '9')) e.preventDefault()
}



function recalcAmounts() {
  const a0 = parseFloat(amount0.value)
  if (a0 > 0 && !token0Disabled.value && currentPrice.value > 0) {
    onAmount0Change()
  } else {
    const a1 = parseFloat(amount1.value)
    if (a1 > 0 && !token1Disabled.value && currentPrice.value > 0) {
      onAmount1Change()
    }
  }
}

function onAmount0Change() {
  const a0 = parseFloat(amount0.value)
  if (!a0 || a0 <= 0 || currentPrice.value <= 0) return
  const pl = priceLower.value > 0 ? priceLower.value : 0.0001
  const pu = priceUpper.value
  const result = calculateAmounts(a0, true, currentPrice.value, pl, pu)
  amount1.value = result.amount1 > 0 ? result.amount1.toFixed(Math.min(props.decimals1, 6)) : '0'
}

function onAmount1Change() {
  const a1 = parseFloat(amount1.value)
  if (!a1 || a1 <= 0 || currentPrice.value <= 0) return
  const pl = priceLower.value > 0 ? priceLower.value : 0.0001
  const pu = priceUpper.value
  const result = calculateAmounts(a1, false, currentPrice.value, pl, pu)
  amount0.value = result.amount0 > 0 ? result.amount0.toFixed(Math.min(props.decimals0, 6)) : '0'
}

function bigIntToDecimal(amount: bigint, decimals: number, maxFrac: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = amount / divisor
  const frac = amount % divisor
  if (maxFrac === 0) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac)
  return `${whole}.${fracStr}`
}

function setPercentage0(pct: number) {
  if (props.balance0 <= 0n || !info0.value) return
  const fee = info0.value.transfer_fee ?? 0n
  const max = props.balance0 > fee ? props.balance0 - fee : 0n
  const use = pct === 100 ? max : (max * BigInt(pct)) / 100n
  amount0.value = bigIntToDecimal(use, props.decimals0, Math.min(props.decimals0, 6))
  onAmount0Change()
}

function setPercentage1(pct: number) {
  if (props.balance1 <= 0n || !info1.value) return
  const fee = info1.value.transfer_fee ?? 0n
  const max = props.balance1 > fee ? props.balance1 - fee : 0n
  const use = pct === 100 ? max : (max * BigInt(pct)) / 100n
  amount1.value = bigIntToDecimal(use, props.decimals1, Math.min(props.decimals1, 6))
  onAmount1Change()
}

async function loadPoolInfo() {
  if (!props.token0 || !props.token1) return
  try {
    const raw = await store.getAMMPoolInfo(props.token0, props.token1)
    const p = Array.isArray(raw) ? raw[0] ?? null : raw
    if (p && 'reserve0' in (p as any)) {
      poolInfo.value = p
      // price0 from backend is already correctly scaled
      currentPrice.value = (p as any).price0 || 0
      // Set default range: ±25% from current price
      if (currentPrice.value > 0 && priceLower.value <= 0) {
        priceLower.value = currentPrice.value * 0.75
        priceUpper.value = currentPrice.value * 1.25
      }
    }
  } catch { /* ignore */ }
}

async function submit() {
  error.value = ''
  const a0Raw = BigInt(Math.round(parseFloat(amount0.value || '0') * 10 ** props.decimals0))
  const a1Raw = BigInt(Math.round(parseFloat(amount1.value || '0') * 10 ** props.decimals1))

  if (a0Raw <= 0n && a1Raw <= 0n) { error.value = 'Enter an amount'; return }

  // Validate LP minimums (minimum_amount * 10) — only check non-zero sides
  const min0 = (info0.value?.minimum_amount ?? 0n) * 10n
  const min1 = (info1.value?.minimum_amount ?? 0n) * 10n
  if (a0Raw > 0n && a0Raw < min0) {
    error.value = `Minimum LP deposit for ${info0.value?.symbol ?? 'Token 0'} is ${Number(min0) / 10 ** props.decimals0}`
    return
  }
  if (a1Raw > 0n && a1Raw < min1) {
    error.value = `Minimum LP deposit for ${info1.value?.symbol ?? 'Token 1'} is ${Number(min1) / 10 ** props.decimals1}`
    return
  }

  // Full-range must use addLiquidity (V2); addConcentratedLiquidity rejects
  // FULL_RANGE_LOWER / FULL_RANGE_UPPER sentinels. Reject before depositing.
  if (priceLower.value <= 0 || !isFinite(priceUpper.value) || priceUpper.value <= priceLower.value) {
    error.value = 'Set a bounded price range. For unbounded (full-range) positions, use the Add Liquidity tab.'
    return
  }

  const ratioLower = priceToRatio(priceLower.value, props.decimals0, props.decimals1)
  const ratioUpper = priceToRatio(priceUpper.value, props.decimals0, props.decimals1)

  let block0 = 0n
  let block1 = 0n
  let prePositionCount = 0

  try {
    try {
      const pre = await store.getUserLiquidityDetailed()
      prePositionCount = pre.length
    } catch { /* probe falls back to 'unknown' */ }

    if (a0Raw > 0n) {
      phase.value = 'deposit0'
      block0 = await depositTokenForLiquidity(
        props.token0, info0.value!.asset_type as any,
        a0Raw, store.treasuryAccountId, store.treasuryPrincipal,
      )
    }

    if (a1Raw > 0n) {
      phase.value = 'deposit1'
      block1 = await depositTokenForLiquidity(
        props.token1, info1.value!.asset_type as any,
        a1Raw, store.treasuryAccountId, store.treasuryPrincipal,
      )
    }

    phase.value = 'adding'
    const result = await store.addConcentratedLiquidity(
      props.token0, props.token1,
      a0Raw, a1Raw,
      ratioLower, ratioUpper,
      block0, block1,
    )

    if ('Ok' in result) {
      resultPositionId.value = result.Ok.positionId
      if (block0 > 0n) removeDepositFromCache(block0.toString())
      if (block1 > 0n) removeDepositFromCache(block1.toString())
      phase.value = 'success'
      amount0.value = ''
      amount1.value = ''
      await store.refreshAfterMutation('lp')
      toast.success('Position Created', 'Position ID: #' + resultPositionId.value.toString())
    } else {
      const { classifyExchangeError, isAutoRefundError } = await import('../../utils/errors')
      if (isAutoRefundError(result.Err)) {
        if (block0 > 0n) removeDepositFromCache(block0.toString())
        if (block1 > 0n) removeDepositFromCache(block1.toString())
        error.value = 'Transaction rejected — your tokens are being refunded automatically.'
        phase.value = 'idle'
        toast.info('Auto-Refund', 'Transaction rejected — your tokens are being refunded automatically.')
      } else {
        const classified = classifyExchangeError(result.Err)
        error.value = classified.message
        phase.value = 'idle'
        toast.error('Add Liquidity Failed', classified.message)
      }
    }
  } catch (err: any) {
    if (isTransportError(err)) {
      const probe = async (): Promise<VerifyStatus> => {
        try {
          const post: any[] = await store.getUserLiquidityDetailed()
          if (post.length > prePositionCount) return 'succeeded'
          return 'unknown'
        } catch {
          return 'unknown'
        }
      }
      const status = await verifyAfterTransportError(probe)
      if (status === 'succeeded') {
        if (block0 > 0n) removeDepositFromCache(block0.toString())
        if (block1 > 0n) removeDepositFromCache(block1.toString())
        phase.value = 'success'
        amount0.value = ''
        amount1.value = ''
        await store.refreshAfterMutation('lp')
        toast.success('Position Created', 'Network hiccup during submit — confirmed via query.')
        return
      }
      error.value = 'Network issue during submit — refresh to verify before retrying.'
      phase.value = 'idle'
      toast.warning('Network issue', error.value)
      return
    }
    error.value = err.message || 'Failed to add liquidity'
    phase.value = 'idle'
    toast.error('Add Liquidity Failed', error.value)
  }
}

onMounted(loadPoolInfo)

watch([() => props.token0, () => props.token1], () => {
  poolInfo.value = null
  currentPrice.value = 0
  priceLower.value = 0
  priceUpper.value = Infinity
  amount0.value = ''
  amount1.value = ''
  loadPoolInfo()
})
</script>

<style scoped lang="scss">
.cl-add {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__header {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: var(--space-2) var(--space-3);
  }

  &__stats {
    display: flex;
    gap: var(--space-4);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    flex-wrap: wrap;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  &__section-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  &__flip-toggle {
    display: flex;
    background: var(--bg-tertiary);
    border-radius: 4px;
    padding: 1px;
    gap: 1px;
  }

  &__flip-btn {
    padding: 2px 8px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;

    &--active {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }

  &__token-field {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: var(--space-3);
    margin-bottom: var(--space-2);

    &--disabled { opacity: 0.5; }
  }

  &__token-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-1);
  }

  &__token-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  &__token-bal {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__amount-input {
    width: 100%;
    font-size: var(--text-lg);
    text-align: right;
    margin-bottom: var(--space-1);
  }

  &__pct-btns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }


  &__chart-wrap {
    height: 220px;
    margin-bottom: var(--space-3);
    background: var(--bg-tertiary);
    border-radius: 8px;
    overflow: hidden;

    @media (max-width: 767px) { height: 180px; }
  }

  &__efficiency {
    font-size: var(--text-xs);
    color: var(--color-buy);
    font-weight: var(--weight-semibold);
    text-align: center;
    padding: var(--space-2);
    background: rgba(46, 166, 106, 0.1);
    border-radius: 6px;
  }

  &__phase {
    font-size: var(--text-sm);
    text-align: center;
    padding: var(--space-2);
    border-radius: 4px;
    color: var(--accent-primary);
  }

  &__success {
    text-align: center;
  }

  &__submit {
    width: 100%;
    padding: var(--space-3);
  }
}
</style>
