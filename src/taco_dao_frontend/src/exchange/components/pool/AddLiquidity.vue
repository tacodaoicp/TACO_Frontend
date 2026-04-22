<template>
  <div class="add-liquidity">
    <h3 class="add-liquidity__title">Add Liquidity</h3>

    <!-- Pair Selector (always visible, searchable) -->
    <div class="add-liquidity__field">
      <label class="add-liquidity__label">Pool</label>
      <div class="add-liquidity__pair-selector">
        <input
          v-model="pairSearch"
          type="text"
          class="ex-input"
          :placeholder="selectedPair ? pairs.find(p => p.key === selectedPair)?.label || 'Search pairs...' : 'Search pairs...'"
          @focus="pairDropdownOpen = true"
          @input="pairDropdownOpen = true"
        />
        <div v-if="pairDropdownOpen && filteredPairs.length > 0" class="add-liquidity__pair-dropdown">
          <div
            v-for="pair in filteredPairs"
            :key="pair.key"
            class="add-liquidity__pair-option"
            :class="{ 'add-liquidity__pair-option--active': selectedPair === pair.key }"
            @mousedown.prevent="selectPair(pair.key)"
          >{{ pair.label }}</div>
        </div>
      </div>
    </div>

    <!-- Mode Toggle -->
    <div class="add-liquidity__mode-toggle">
      <button
        class="add-liquidity__mode-btn"
        :class="{ 'add-liquidity__mode-btn--active': liquidityMode === 'concentrated' }"
        @click="liquidityMode = 'concentrated'"
      >Concentrated</button>
      <button
        class="add-liquidity__mode-btn"
        :class="{ 'add-liquidity__mode-btn--active': liquidityMode === 'full' }"
        @click="liquidityMode = 'full'"
      >Full Range</button>
    </div>

    <!-- Concentrated Mode -->
    <ConcentratedAddLiquidity
      v-if="liquidityMode === 'concentrated' && token0 && token1"
      :token0="token0"
      :token1="token1"
      :decimals0="decimals0"
      :decimals1="decimals1"
      :balance0="balance0"
      :balance1="balance1"
    />

    <!-- Full Range Mode (existing form) -->
    <template v-if="liquidityMode === 'full'">

    <!-- First Deposit Warning -->
    <div v-if="isNewPool" class="ex-warning-box add-liquidity__warning">
      You are creating a new pool. The ratio you provide sets the initial price.
      10,000 LP tokens will be permanently locked.
    </div>
    <div v-else-if="isDustPool" class="ex-warning-box add-liquidity__warning">
      Previous pool had residual dust — will be recreated with fresh prices based on your deposit ratio.
    </div>

    <!-- Pool Price (existing pool) -->
    <div v-if="poolPrice && !isNewPool" class="add-liquidity__price">
      <div>1 {{ symbol0 }} = {{ poolPrice }} {{ symbol1 }}</div>
      <div>1 {{ symbol1 }} = {{ poolPriceInverted }} {{ symbol0 }}</div>
    </div>

    <!-- New pool: show the ratio the user is setting -->
    <div v-if="isNewPool && userRatio" class="add-liquidity__price add-liquidity__price--new">
      <div class="add-liquidity__price-label">You are setting the initial price:</div>
      <div>1 {{ symbol0 }} = {{ userRatio }} {{ symbol1 }}</div>
      <div>1 {{ symbol1 }} = {{ userRatioInverted }} {{ symbol0 }}</div>
    </div>

    <!-- Amount 0 -->
    <div class="add-liquidity__field">
      <label class="add-liquidity__label">{{ symbol0 }} Amount <span v-if="balance0 > 0n" class="add-liquidity__bal">Bal: {{ formatBal(balance0, decimals0) }}</span></label>
      <input
        v-model="amount0"
        type="text"
        inputmode="decimal"
        class="ex-input num"
        placeholder="0.00"
        @input="onAmount0Change"
        @keypress="onlyNumbers"
      />
      <input type="range" min="0" max="100" step="1" v-model.number="pctSlider0" class="add-liquidity__slider" @input="setPercentage0(pctSlider0)" />
      <div class="add-liquidity__pct-row">
        <button v-for="p in [25,50,75,100]" :key="p" class="ex-pct-btn" :class="{'ex-pct-btn--active': pctSlider0===p}" @click="pctSlider0=p;setPercentage0(p)">{{p}}%</button>
      </div>
    </div>

    <!-- Amount 1 -->
    <div class="add-liquidity__field">
      <label class="add-liquidity__label">{{ symbol1 }} Amount <span v-if="balance1 > 0n" class="add-liquidity__bal">Bal: {{ formatBal(balance1, decimals1) }}</span></label>
      <input
        v-model="amount1"
        type="text"
        inputmode="decimal"
        class="ex-input num"
        placeholder="0.00"
        @input="onAmount1Change"
        @keypress="onlyNumbers"
      />
      <input type="range" min="0" max="100" step="1" v-model.number="pctSlider1" class="add-liquidity__slider" @input="setPercentage1(pctSlider1)" />
      <div class="add-liquidity__pct-row">
        <button v-for="p in [25,50,75,100]" :key="p" class="ex-pct-btn" :class="{'ex-pct-btn--active': pctSlider1===p}" @click="pctSlider1=p;setPercentage1(p)">{{p}}%</button>
      </div>
    </div>

    <!-- Recovery info for pending deposits -->
    <div v-if="pendingDeposit" class="add-liquidity__recovery">
      A previous deposit ({{ pendingDeposit.symbol }}, block {{ pendingDeposit.block }}) may be pending.
      <router-link to="/recover">Go to Recover</router-link> to retrieve it.
    </div>

    <!-- Error -->
    <div v-if="error" class="ex-error-box">{{ error }}</div>

    <!-- Recovery details -->
    <div v-if="recoveryInfo" class="add-liquidity__recovery">
      <pre style="white-space:pre-wrap;margin:0;font-family:var(--font-mono);font-size:var(--text-xs)">{{ recoveryInfo }}</pre>
      <router-link to="/recover" class="ex-btn ex-btn--sm ex-btn--outline" style="margin-top:8px;display:inline-block">Go to Recover Page</router-link>
    </div>

    <!-- Phase indicator -->
    <div v-if="phase !== 'idle'" class="add-liquidity__phase">
      <template v-if="phase === 'deposit0'">Step 1/2: Depositing {{ symbol0 }}...</template>
      <template v-else-if="phase === 'deposit1'">Step 2/2: Depositing {{ symbol1 }}...</template>
      <template v-else-if="phase === 'adding'">Adding liquidity...</template>
      <template v-else-if="phase === 'success'">
        Liquidity added! LP tokens minted: {{ lpMinted }}
      </template>
    </div>

    <!-- Submit -->
    <button
      class="ex-btn ex-btn--primary add-liquidity__submit"
      :disabled="!canSubmit && store.isAuthenticated"
      @click="store.isAuthenticated ? addLiquidity() : auth.connect()"
    >
      {{ submitLabel }}
    </button>

    </template><!-- end v-else (full range mode) -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { depositTokenForLiquidity, removeDepositFromCache } from '../../utils/deposit'
import ConcentratedAddLiquidity from './ConcentratedAddLiquidity.vue'
import { useExchangeAuth } from '../../composables/useExchangeAuth'
import { useExchangeToast } from '../../composables/useExchangeToast'
import { isTransportError, verifyAfterTransportError, type VerifyStatus } from '../../utils/errors'

const props = defineProps<{
  initialToken0?: string
  initialToken1?: string
}>()

const store = useExchangeStore()
const auth = useExchangeAuth()
const toast = useExchangeToast()

const pairSearch = ref('')
const pairDropdownOpen = ref(false)

const filteredPairs = computed(() => {
  const q = pairSearch.value.toLowerCase().trim()
  if (!q) return pairs.value
  return pairs.value.filter(p => p.label.toLowerCase().includes(q))
})

function selectPair(key: string) {
  selectedPair.value = key
  pairSearch.value = ''
  pairDropdownOpen.value = false
}

const liquidityMode = ref<'full' | 'concentrated'>('concentrated')

const selectedPair = ref(
  props.initialToken0 && props.initialToken1
    ? `${props.initialToken0}|${props.initialToken1}`
    : ''
)

const amount0 = ref('')
const amount1 = ref('')
const error = ref('')
const phase = ref<'idle' | 'deposit0' | 'deposit1' | 'adding' | 'success'>('idle')
const lpMinted = ref('')
const poolReserve0 = ref(0n)
const poolReserve1 = ref(0n)
const recoveryInfo = ref('')
const balance0 = ref(0n)
const balance1 = ref(0n)
const pctSlider0 = ref(0)
const pctSlider1 = ref(0)

interface PendingDeposit { token: string; block: string; symbol: string; timestamp: number }
const pendingDeposit = ref<PendingDeposit | null>(null)

function formatBal(balance: bigint, decimals: number): string {
  const val = Number(balance) / 10 ** decimals
  return val.toLocaleString(undefined, { maximumFractionDigits: Math.min(decimals, 4) })
}

async function fetchBalances() {
  if (!store.isAuthenticated || !token0.value || !token1.value) return
  balance0.value = await store.getUserBalance(token0.value)
  balance1.value = await store.getUserBalance(token1.value)
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
  pctSlider0.value = pct
  if (balance0.value <= 0n) return
  const fee = info0.value?.transfer_fee ?? 0n
  const maxUsable = balance0.value > fee ? balance0.value - fee : 0n
  const useAmount = pct === 100 ? maxUsable : (maxUsable * BigInt(pct)) / 100n
  amount0.value = bigIntToDecimal(useAmount, decimals0.value, Math.min(decimals0.value, 6))
  onAmount0Change()
}

function setPercentage1(pct: number) {
  pctSlider1.value = pct
  if (balance1.value <= 0n) return
  const fee = info1.value?.transfer_fee ?? 0n
  const maxUsable = balance1.value > fee ? balance1.value - fee : 0n
  const useAmount = pct === 100 ? maxUsable : (maxUsable * BigInt(pct)) / 100n
  amount1.value = bigIntToDecimal(useAmount, decimals1.value, Math.min(decimals1.value, 6))
  onAmount1Change()
}

function savePendingDeposit(token: string, block: bigint, symbol: string) {
  const entry = { token, block: block.toString(), symbol, timestamp: Date.now() }
  localStorage.setItem('taco_pending_lp_deposit', JSON.stringify(entry))
  pendingDeposit.value = entry
}

function clearPendingDeposit() {
  localStorage.removeItem('taco_pending_lp_deposit')
  pendingDeposit.value = null
}

function loadPendingDeposit() {
  try {
    const raw = localStorage.getItem('taco_pending_lp_deposit')
    if (raw) {
      const entry = JSON.parse(raw) as PendingDeposit
      // Only show if less than 21 days old
      if (Date.now() - entry.timestamp < 21 * 86400 * 1000) {
        pendingDeposit.value = entry
      } else {
        clearPendingDeposit()
      }
    }
  } catch { /* ignore */ }
}

const BASE_TOKENS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai',  // ckUSDC
])

const pairs = computed(() => {
  const tokens = store.tokens
  const result: { key: string; label: string }[] = []
  const seen = new Set<string>()
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      // Order: non-base / base
      let baseIdx = i, quoteIdx = j
      if (BASE_TOKENS.has(tokens[i].address) && !BASE_TOKENS.has(tokens[j].address)) {
        baseIdx = j; quoteIdx = i
      }
      const key = `${tokens[baseIdx].address}|${tokens[quoteIdx].address}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ key, label: `${tokens[baseIdx].symbol} / ${tokens[quoteIdx].symbol}` })
    }
  }
  return result
})

const token0 = computed(() => selectedPair.value.split('|')[0] || '')
const token1 = computed(() => selectedPair.value.split('|')[1] || '')

const info0 = computed(() => store.tokens.find(t => t.address === token0.value))
const info1 = computed(() => store.tokens.find(t => t.address === token1.value))
const symbol0 = computed(() => info0.value?.symbol ?? 'Token 0')
const symbol1 = computed(() => info1.value?.symbol ?? 'Token 1')
const decimals0 = computed(() => Number(info0.value?.decimals ?? 8))
const decimals1 = computed(() => Number(info1.value?.decimals ?? 8))

const isNewPool = computed(() => poolReserve0.value === 0n && poolReserve1.value === 0n)

const isDustPool = computed(() => {
  if (isNewPool.value) return false
  const min0 = (info0.value?.minimum_amount ?? 0n) * 10n
  const min1 = (info1.value?.minimum_amount ?? 0n) * 10n
  return poolReserve0.value < min0 || poolReserve1.value < min1
})

const shouldUseInitial = computed(() => isNewPool.value || isDustPool.value)

const poolPrice = computed(() => {
  if (poolReserve0.value === 0n) return null
  const r0 = Number(poolReserve0.value) / 10 ** decimals0.value
  const r1 = Number(poolReserve1.value) / 10 ** decimals1.value
  return (r1 / r0).toFixed(6)
})

const poolPriceInverted = computed(() => {
  if (poolReserve1.value === 0n) return null
  const r0 = Number(poolReserve0.value) / 10 ** decimals0.value
  const r1 = Number(poolReserve1.value) / 10 ** decimals1.value
  return (r0 / r1).toFixed(6)
})

// For new pools: show the ratio from user's input amounts
const userRatio = computed(() => {
  const a0 = parseFloat(amount0.value)
  const a1 = parseFloat(amount1.value)
  if (!a0 || !a1 || a0 <= 0 || a1 <= 0) return null
  return (a1 / a0).toFixed(6)
})

const userRatioInverted = computed(() => {
  const a0 = parseFloat(amount0.value)
  const a1 = parseFloat(amount1.value)
  if (!a0 || !a1 || a0 <= 0 || a1 <= 0) return null
  return (a0 / a1).toFixed(6)
})

const canSubmit = computed(() => {
  if (!selectedPair.value || !store.isAuthenticated) return false
  if (phase.value !== 'idle' && phase.value !== 'success') return false
  const a0 = parseFloat(amount0.value)
  const a1 = parseFloat(amount1.value)
  return a0 > 0 && a1 > 0
})

const submitLabel = computed(() => {
  if (!store.isAuthenticated) return 'Connect Wallet'
  if (phase.value === 'deposit0') return 'Depositing...'
  if (phase.value === 'deposit1') return 'Depositing...'
  if (phase.value === 'adding') return 'Adding...'
  if (!selectedPair.value) return 'Select a pair'
  if (isNewPool.value) return 'Create Pool'
  if (isDustPool.value) return 'Recreate Pool'
  return 'Add Liquidity (Full Range)'
})

function onAmount0Change() {
  if (isNewPool.value) return
  const a0 = parseFloat(amount0.value)
  if (!a0 || poolReserve0.value === 0n) return
  const a1 = a0 * Number(poolReserve1.value) / Number(poolReserve0.value)
    * (10 ** decimals0.value) / (10 ** decimals1.value)
  amount1.value = a1.toFixed(Math.min(decimals1.value, 6))
}

function onAmount1Change() {
  if (isNewPool.value) return
  const a1 = parseFloat(amount1.value)
  if (!a1 || poolReserve1.value === 0n) return
  const a0 = a1 * Number(poolReserve0.value) / Number(poolReserve1.value)
    * (10 ** decimals1.value) / (10 ** decimals0.value)
  amount0.value = a0.toFixed(Math.min(decimals0.value, 6))
}

async function loadPoolInfo() {
  if (!token0.value || !token1.value) return
  try {
    const raw = await store.getAMMPoolInfo(token0.value, token1.value)
    // Candid optional: returns [] (empty) or [poolData]
    const poolInfo = Array.isArray(raw) ? raw[0] ?? null : raw
    if (poolInfo && 'reserve0' in (poolInfo as any)) {
      // Backend normalizes order — match reserves to our token0/token1
      const p = poolInfo as any
      if (p.token0 === token0.value) {
        poolReserve0.value = p.reserve0
        poolReserve1.value = p.reserve1
      } else {
        poolReserve0.value = p.reserve1
        poolReserve1.value = p.reserve0
      }
    } else {
      poolReserve0.value = 0n
      poolReserve1.value = 0n
    }
  } catch (err) {
    console.error('[AddLiquidity] loadPoolInfo failed:', err)
    poolReserve0.value = 0n
    poolReserve1.value = 0n
  }
}

watch(selectedPair, () => { loadPoolInfo(); fetchBalances() })

async function addLiquidity() {
  error.value = ''
  recoveryInfo.value = ''
  const a0Raw = BigInt(Math.round(parseFloat(amount0.value) * 10 ** decimals0.value))
  const a1Raw = BigInt(Math.round(parseFloat(amount1.value) * 10 ** decimals1.value))

  // Validate: amounts must be > minimum * 10 for addLiquidity
  const min0 = info0.value?.minimum_amount ?? 0n
  const min1 = info1.value?.minimum_amount ?? 0n
  if (a0Raw <= min0 * 10n) {
    error.value = `${symbol0.value} amount too low. Must be > ${Number(min0 * 10n) / 10 ** decimals0.value}`
    return
  }
  if (a1Raw <= min1 * 10n) {
    error.value = `${symbol1.value} amount too low. Must be > ${Number(min1 * 10n) / 10 ** decimals1.value}`
    return
  }

  let block0: bigint | null = null
  let block1: bigint | null = null
  let prePositionCount = 0
  let preLiqByPair = new Map<string, bigint>()

  try {
    // Snapshot LP state so a transport-error probe can detect a successful add.
    try {
      const pre = await store.getUserLiquidityDetailed()
      prePositionCount = pre.length
      preLiqByPair = new Map(pre.map((p: any) => [`${p.token0}|${p.token1}`, p.liquidity]))
    } catch { /* probe will fall back to 'unknown' */ }

    // Step 1: Deposit token0 — exact amount, no fee additions
    phase.value = 'deposit0'
    console.log(`[AddLiquidity] Depositing ${symbol0.value}: amount=${a0Raw}, to treasury=${store.treasuryPrincipal} / ${store.treasuryAccountId.slice(0,16)}...`)
    console.log(`[AddLiquidity] Token0: ${token0.value}, assetType: ${JSON.stringify(info0.value!.asset_type)}`)
    block0 = await depositTokenForLiquidity(
      token0.value,
      info0.value!.asset_type as any,
      a0Raw,
      store.treasuryAccountId,
      store.treasuryPrincipal,
    )
    console.log(`[AddLiquidity] ${symbol0.value} deposited, block=${block0}`)
    savePendingDeposit(token0.value, block0, symbol0.value)

    // Step 2: Deposit token1 — exact amount, no fee additions
    phase.value = 'deposit1'
    console.log(`[AddLiquidity] Depositing ${symbol1.value}: amount=${a1Raw}, to treasury=${store.treasuryPrincipal}`)
    console.log(`[AddLiquidity] Token1: ${token1.value}, assetType: ${JSON.stringify(info1.value!.asset_type)}`)
    block1 = await depositTokenForLiquidity(
      token1.value,
      info1.value!.asset_type as any,
      a1Raw,
      store.treasuryAccountId,
      store.treasuryPrincipal,
    )
    console.log(`[AddLiquidity] ${symbol1.value} deposited, block=${block1}`)

    // Save both deposit blocks for recovery
    savePendingDeposit(token1.value, block1, symbol1.value)

    // Step 3: Add liquidity
    phase.value = 'adding'
    const useInitial = shouldUseInitial.value ? true : undefined
    console.log(`[AddLiquidity] Calling addLiquidity(${token0.value.slice(0,10)}, ${token1.value.slice(0,10)}, ${a0Raw}, ${a1Raw}, block0=${block0}, block1=${block1}, isInitial=${useInitial})`)
    const result = await store.addLiquidity(
      token0.value,
      token1.value,
      a0Raw,
      a1Raw,
      block0,
      block1,
      useInitial,
    )
    console.log('[AddLiquidity] Result:', result)

    if ('Ok' in result) {
      const ok = result.Ok
      clearPendingDeposit()
      removeDepositFromCache(block0.toString())
      removeDepositFromCache(block1.toString())
      lpMinted.value = ok.liquidityMinted.toString()
      phase.value = 'success'
      amount0.value = ''
      amount1.value = ''
      await store.refreshAfterMutation('lp')
      toast.success('Liquidity Added', 'LP tokens minted: ' + lpMinted.value)
    } else {
      const { classifyExchangeError, isAutoRefundError } = await import('../../composables/../utils/errors')
      if (isAutoRefundError(result.Err)) {
        clearPendingDeposit()
        removeDepositFromCache(block0.toString())
        removeDepositFromCache(block1.toString())
        error.value = 'Transaction rejected — your tokens are being refunded automatically.'
        recoveryInfo.value = ''
        phase.value = 'idle'
        toast.info('Auto-Refund', 'Transaction rejected — your tokens are being refunded automatically.')
      } else {
        const classified = classifyExchangeError(result.Err)
        error.value = classified.message
        recoveryInfo.value = `Your deposits are safe in the treasury. Recover them at /recover:\n` +
          `• ${symbol0.value}: block ${block0.toString()}\n` +
          `• ${symbol1.value}: block ${block1.toString()}`
        phase.value = 'idle'
        toast.error('Add Liquidity Failed', classified.message)
      }
    }
  } catch (err: any) {
    // Transport failure — verify before telling the user they need Recover.
    if (isTransportError(err) && block0 != null && block1 != null) {
      const probe = async (): Promise<VerifyStatus> => {
        try {
          const post: any[] = await store.getUserLiquidityDetailed()
          if (post.length > prePositionCount) return 'succeeded'
          for (const p of post) {
            const key = `${p.token0}|${p.token1}`
            const preL = preLiqByPair.get(key)
            if (preL != null && p.liquidity > preL) return 'succeeded'
          }
          return 'unknown'
        } catch {
          return 'unknown'
        }
      }
      const status = await verifyAfterTransportError(probe)
      if (status === 'succeeded') {
        clearPendingDeposit()
        removeDepositFromCache(block0.toString())
        removeDepositFromCache(block1.toString())
        phase.value = 'success'
        amount0.value = ''
        amount1.value = ''
        await store.refreshAfterMutation('lp')
        toast.success('Liquidity Added', 'Network hiccup during submit — confirmed via query.')
        return
      }
      error.value = 'Network issue during submit — refresh to verify before retrying.'
      recoveryInfo.value = `If the deposits went through, their blocks are:\n` +
        `• ${symbol0.value}: block ${block0.toString()}\n` +
        `• ${symbol1.value}: block ${block1.toString()}\n` +
        `Refresh first; use Recover only if the add truly failed.`
      phase.value = 'idle'
      toast.warning('Network issue', error.value)
      return
    }
    error.value = err.message || 'Failed to add liquidity'
    recoveryInfo.value = 'If you deposited tokens, go to Recover to retrieve them using the block numbers shown in your wallet transaction history.'
    phase.value = 'idle'
    toast.error('Add Liquidity Failed', error.value)
  }
}

onMounted(() => {
  loadPendingDeposit()
  fetchBalances()
})

function onlyNumbers(e: KeyboardEvent) {
  const char = e.key
  if (char !== '.' && (char < '0' || char > '9')) e.preventDefault()
}
</script>

<style scoped lang="scss">
.add-liquidity {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  max-width: 480px;

  &__title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__pair-selector {
    position: relative;
  }

  &__pair-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--bg-elevated);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    max-height: 240px;
    overflow-y: auto;
    margin-top: 4px;
    box-shadow: 0 8px 24px rgba(15, 5, 0, 0.5);
  }

  &__pair-option {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;

    &:hover { background: var(--bg-tertiary); color: var(--text-primary); }
    &--active { color: var(--accent-primary); }
  }

  &__mode-toggle {
    display: flex;
    background: var(--bg-tertiary);
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
  }

  &__mode-btn {
    flex: 1;
    padding: var(--space-2);
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;

    &--active {
      background: var(--bg-secondary);
      color: var(--text-primary);
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

  &__warning {
    padding: var(--space-3);
    border-radius: 6px;
    line-height: 1.4;
  }

  &__price {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-tertiary);
    border-radius: 6px;

    &--new {
      background: rgba(196, 90, 10, 0.08);
      border: 1px solid rgba(196, 90, 10, 0.2);
    }
  }

  &__price-label {
    font-size: var(--text-xs);
    color: var(--accent-primary);
    font-weight: var(--weight-semibold);
  }

  &__bal {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-left: var(--space-2);
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
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


  &__recovery {
    font-size: var(--text-sm);
    color: var(--color-warning);
    background: rgba(196, 90, 10, 0.1);
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    a { color: var(--accent-primary); text-decoration: underline; }
  }


  &__phase {
    font-size: var(--text-sm);
    color: var(--accent-primary);
    text-align: center;
  }

  &__submit {
    width: 100%;
    padding: var(--space-3);
  }
}
</style>
