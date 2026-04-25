<template>
  <div class="add-liquidity">
    <div class="add-liquidity__grid">
      <!-- ═══════════════════ LEFT COLUMN ═══════════════════ -->
      <div class="add-liquidity__left">

        <!-- Pool card -->
        <section class="tx-card add-liquidity__pool-card">
          <div class="tx-eyebrow add-liquidity__eyebrow">Pool</div>

          <!-- Pair picker -->
          <div class="add-liquidity__pair" ref="pairRootRef">
            <button
              type="button"
              class="add-liquidity__pair-btn"
              :class="{ 'add-liquidity__pair-btn--open': pairDropdownOpen }"
              @click="pairDropdownOpen = !pairDropdownOpen"
              aria-haspopup="listbox"
              :aria-expanded="pairDropdownOpen"
            >
              <PairIcon
                v-if="token0 && token1"
                :symbolA="symbol0"
                :symbolB="symbol1"
                :nameA="info0?.name"
                :nameB="info1?.name"
                :colorA="colorForSymbol(symbol0)"
                :colorB="colorForSymbol(symbol1)"
                :size="22"
              />
              <span class="add-liquidity__pair-label">
                {{ selectedPair ? `${symbol0} / ${symbol1}` : 'Select a pair' }}
              </span>
              <span class="tx-ink-3">▾</span>
            </button>
            <div v-if="pairDropdownOpen" class="add-liquidity__pair-dropdown">
              <input
                v-model="pairSearch"
                type="text"
                class="ex-input add-liquidity__pair-search"
                placeholder="Search pairs…"
                @keydown.escape="pairDropdownOpen = false"
              />
              <div class="add-liquidity__pair-list">
                <button
                  v-for="pair in filteredPairs"
                  :key="pair.key"
                  type="button"
                  class="add-liquidity__pair-option"
                  :class="{ 'add-liquidity__pair-option--active': selectedPair === pair.key }"
                  @click="selectPair(pair.key)"
                >{{ pair.label }}</button>
                <div v-if="filteredPairs.length === 0" class="add-liquidity__pair-empty">
                  No pairs found
                </div>
              </div>
            </div>
          </div>

          <!-- Mode segment -->
          <div class="tx-segment add-liquidity__mode">
            <button
              type="button"
              :aria-pressed="mode === 'concentrated'"
              @click="mode = 'concentrated'"
            >Concentrated</button>
            <button
              type="button"
              :aria-pressed="mode === 'full'"
              @click="mode = 'full'"
            >Full Range</button>
          </div>

          <!-- Current price + Fee tier -->
          <div class="tx-panel-2 add-liquidity__price-info">
            <div class="tx-row tx-row--between">
              <span class="tx-ink-3">Current price</span>
              <span class="tx-mono tx-tnum">
                <template v-if="currentPrice > 0">1 {{ symbol0 }} = {{ formatPrice(currentPrice) }} {{ symbol1 }}</template>
                <template v-else-if="isNewPool">New pool — you set the price</template>
                <template v-else>—</template>
              </span>
            </div>
            <div class="tx-row tx-row--between add-liquidity__price-info-row2">
              <span class="tx-ink-3">Fee tier</span>
              <span class="tx-badge tx-badge--orange tx-badge--square">{{ feeDisplay }}</span>
            </div>
          </div>
        </section>

        <!-- Deposit amounts card -->
        <section class="tx-card add-liquidity__deposit-card">
          <div class="tx-eyebrow add-liquidity__eyebrow">Deposit amounts</div>

          <div class="add-liquidity__amounts">
            <!-- Token 0 -->
            <div
              class="tx-panel-2 add-liquidity__amount"
              :class="{ 'add-liquidity__amount--disabled': token0Disabled }"
            >
              <div class="tx-row tx-row--between">
                <div class="tx-row add-liquidity__amount-ident">
                  <CoinIcon :symbol="symbol0" :name="info0?.name" :color="colorForSymbol(symbol0)" :size="22" />
                  <span class="add-liquidity__amount-sym">{{ symbol0 }}</span>
                </div>
                <span v-if="balance0 > 0n" class="tx-ink-3 add-liquidity__amount-bal">
                  Bal <span class="tx-mono tx-tnum tx-ink-2">{{ formatBal(balance0, decimals0) }}</span>
                </span>
              </div>
              <input
                v-model="amount0"
                type="text"
                inputmode="decimal"
                class="tx-input tx-input--mono add-liquidity__amount-input"
                placeholder="0.0"
                :disabled="token0Disabled"
                @input="onAmount0Change"
                @keypress="onlyNumbers"
              />
              <div class="tx-row add-liquidity__pct-row">
                <button
                  v-for="p in [25, 50, 75, 100]"
                  :key="'a0' + p"
                  type="button"
                  class="tx-btn tx-btn--ghost tx-btn--sm add-liquidity__pct-btn"
                  :disabled="token0Disabled"
                  @click="setPercentage0(p)"
                >{{ p === 100 ? 'Max' : `${p}%` }}</button>
              </div>
            </div>

            <!-- Token 1 -->
            <div
              class="tx-panel-2 add-liquidity__amount"
              :class="{ 'add-liquidity__amount--disabled': token1Disabled }"
            >
              <div class="tx-row tx-row--between">
                <div class="tx-row add-liquidity__amount-ident">
                  <CoinIcon :symbol="symbol1" :name="info1?.name" :color="colorForSymbol(symbol1)" :size="22" />
                  <span class="add-liquidity__amount-sym">{{ symbol1 }}</span>
                </div>
                <span v-if="balance1 > 0n" class="tx-ink-3 add-liquidity__amount-bal">
                  Bal <span class="tx-mono tx-tnum tx-ink-2">{{ formatBal(balance1, decimals1) }}</span>
                </span>
              </div>
              <input
                v-model="amount1"
                type="text"
                inputmode="decimal"
                class="tx-input tx-input--mono add-liquidity__amount-input"
                placeholder="0.0"
                :disabled="token1Disabled"
                @input="onAmount1Change"
                @keypress="onlyNumbers"
              />
              <div class="tx-row add-liquidity__pct-row">
                <button
                  v-for="p in [25, 50, 75, 100]"
                  :key="'a1' + p"
                  type="button"
                  class="tx-btn tx-btn--ghost tx-btn--sm add-liquidity__pct-btn"
                  :disabled="token1Disabled"
                  @click="setPercentage1(p)"
                >{{ p === 100 ? 'Max' : `${p}%` }}</button>
              </div>
            </div>
          </div>

          <!-- Capital efficiency — concentrated-only -->
          <CapitalEfficiencyCallout
            v-if="mode === 'concentrated' && efficiencyMultiplier > 1.01"
            :multiplier="efficiencyMultiplier"
            class="add-liquidity__eff"
          />

          <!-- New-pool warning -->
          <div
            v-if="mode === 'full' && isNewPool"
            class="add-liquidity__first-deposit-warning"
          >
            You are creating a new pool. The ratio you provide sets the initial price.
            10,000 LP tokens will be permanently locked.
          </div>
          <div
            v-else-if="mode === 'full' && isDustPool"
            class="add-liquidity__first-deposit-warning"
          >
            Previous pool had residual dust — will be recreated with fresh prices based on your deposit ratio.
          </div>
        </section>
      </div>

      <!-- ═══════════════════ RIGHT COLUMN ═══════════════════ -->
      <div class="add-liquidity__right">

        <!-- Concentrated: set price range -->
        <section v-if="mode === 'concentrated'" class="tx-card add-liquidity__range-card">
          <div class="tx-row tx-row--between add-liquidity__range-header">
            <h2 class="tx-h2">Set price range</h2>
            <div class="tx-segment add-liquidity__range-flip">
              <button
                type="button"
                :aria-pressed="!inverted"
                @click="inverted = false"
              >{{ symbol0 }}</button>
              <button
                type="button"
                :aria-pressed="inverted"
                @click="inverted = true"
              >{{ symbol1 }}</button>
            </div>
          </div>

          <!-- Chart -->
          <div class="add-liquidity__chart">
            <LiquidityCurve
              :min-pct="chartMinPct"
              :max-pct="chartMaxPct"
              :current-price-pct="50"
              :peak-index="24"
              :real-bars="realLiquidityBars"
              @update:min-pct="onChartMinPct"
              @update:max-pct="onChartMaxPct"
            />
            <div class="add-liquidity__chart-axis">
              <span v-for="(label, i) in chartAxisLabels" :key="i">{{ label }}</span>
            </div>
          </div>

          <!-- Min / Max price cards -->
          <div class="add-liquidity__price-cards">
            <div class="tx-panel-2 add-liquidity__price-card">
              <div class="tx-ink-3 add-liquidity__price-card-label">Min price</div>
              <div class="tx-row add-liquidity__price-card-row">
                <button
                  type="button"
                  class="tx-btn tx-btn--ghost tx-btn--sm add-liquidity__price-nudge"
                  @click="nudgePrice('lower', -1)"
                >−</button>
                <input
                  :value="formatInputPrice(displayLower)"
                  @input="onDisplayLowerInput(($event.target as HTMLInputElement).value)"
                  class="tx-mono tx-tnum add-liquidity__price-input"
                  inputmode="decimal"
                />
                <button
                  type="button"
                  class="tx-btn tx-btn--ghost tx-btn--sm add-liquidity__price-nudge"
                  @click="nudgePrice('lower', 1)"
                >+</button>
              </div>
              <div class="tx-ink-3 add-liquidity__price-card-unit">
                {{ inverted ? symbol0 : symbol1 }} per {{ inverted ? symbol1 : symbol0 }}
              </div>
            </div>
            <div class="tx-panel-2 add-liquidity__price-card">
              <div class="tx-ink-3 add-liquidity__price-card-label">Max price</div>
              <div class="tx-row add-liquidity__price-card-row">
                <button
                  type="button"
                  class="tx-btn tx-btn--ghost tx-btn--sm add-liquidity__price-nudge"
                  @click="nudgePrice('upper', -1)"
                >−</button>
                <input
                  :value="formatInputPrice(displayUpper)"
                  @input="onDisplayUpperInput(($event.target as HTMLInputElement).value)"
                  class="tx-mono tx-tnum add-liquidity__price-input"
                  inputmode="decimal"
                />
                <button
                  type="button"
                  class="tx-btn tx-btn--ghost tx-btn--sm add-liquidity__price-nudge"
                  @click="nudgePrice('upper', 1)"
                >+</button>
              </div>
              <div class="tx-ink-3 add-liquidity__price-card-unit">
                {{ inverted ? symbol0 : symbol1 }} per {{ inverted ? symbol1 : symbol0 }}
              </div>
            </div>
          </div>

          <RangePresetChips
            class="add-liquidity__preset-chips"
            @select="applyPresetPct"
          />

          <div class="tx-row add-liquidity__range-actions">
            <button
              type="button"
              class="tx-btn tx-btn--outline tx-btn--sm"
              @click="applyAutoRange"
            >Auto</button>
            <button
              type="button"
              class="tx-btn tx-btn--ghost tx-btn--sm"
              @click="applyFullRangeInConcentrated"
            >Full Range</button>
            <button
              type="button"
              class="tx-btn tx-btn--ghost tx-btn--sm"
              @click="applyAutoRange"
            >Reset</button>
          </div>
        </section>

        <!-- Full Range: explainer -->
        <section v-else class="tx-card add-liquidity__full-card">
          <h2 class="tx-h2">Full Range</h2>
          <div class="tx-panel-2 add-liquidity__full-rates">
            <div class="tx-row tx-row--between">
              <span class="tx-ink-3">1 {{ symbol0 }}</span>
              <span class="tx-mono tx-tnum">
                = {{ currentPrice > 0 ? formatPrice(currentPrice) : '—' }} {{ symbol1 }}
              </span>
            </div>
            <div class="tx-row tx-row--between add-liquidity__full-rates-row2">
              <span class="tx-ink-3">1 {{ symbol1 }}</span>
              <span class="tx-mono tx-tnum">
                = {{ currentPrice > 0 ? formatPrice(1 / currentPrice) : '—' }} {{ symbol0 }}
              </span>
            </div>
          </div>
          <p class="tx-ink-3 add-liquidity__full-body">
            Provides liquidity across all prices (0 → ∞). Simpler, lower capital
            efficiency, no range management.
          </p>
        </section>

        <!-- Position summary -->
        <section class="tx-card add-liquidity__summary-card">
          <div class="tx-eyebrow add-liquidity__eyebrow">Position summary</div>
          <div class="add-liquidity__summary-grid">
            <div class="tx-panel-2 add-liquidity__summary-cell">
              <div class="tx-ink-3">Total deposit</div>
              <div class="tx-mono tx-tnum add-liquidity__summary-value">
                $ {{ totalDepositDisplay }}
              </div>
            </div>
            <div class="tx-panel-2 add-liquidity__summary-cell">
              <div class="tx-ink-3">Est. APR</div>
              <div
                class="tx-mono tx-tnum add-liquidity__summary-value"
                :class="estimatedAprSign >= 0 ? 'tx-buy' : 'tx-sell'"
              >
                {{ estimatedAprSign >= 0 ? '+' : '' }}{{ estimatedAprDisplay }}
              </div>
            </div>
            <div class="tx-panel-2 add-liquidity__summary-cell">
              <div class="tx-ink-3">Pool share</div>
              <div class="tx-mono tx-tnum add-liquidity__summary-value add-liquidity__summary-value--sm">
                {{ poolShareDisplay }}
              </div>
            </div>
            <div class="tx-panel-2 add-liquidity__summary-cell">
              <div class="tx-ink-3">Fee tier</div>
              <div class="tx-mono tx-tnum add-liquidity__summary-value add-liquidity__summary-value--sm">
                {{ feeDisplay }}
              </div>
            </div>
          </div>

          <!-- Errors + recovery info -->
          <div v-if="error" class="ex-error-box add-liquidity__error">{{ error }}</div>
          <div v-if="recoveryInfo" class="add-liquidity__recovery">
            <pre>{{ recoveryInfo }}</pre>
            <router-link to="/recover" class="tx-btn tx-btn--outline tx-btn--sm">Go to Recover</router-link>
          </div>

          <!-- Phase indicator -->
          <div v-if="phase !== 'idle' && phase !== 'success'" class="add-liquidity__phase">
            <template v-if="phase === 'deposit0'">Step 1/3: Depositing {{ symbol0 }}…</template>
            <template v-else-if="phase === 'deposit1'">Step 2/3: Depositing {{ symbol1 }}…</template>
            <template v-else-if="phase === 'adding'">Step 3/3: Adding liquidity…</template>
          </div>
          <div v-if="phase === 'success'" class="ex-success-box add-liquidity__success">
            <template v-if="mode === 'concentrated'">Liquidity added! Position ID: #{{ resultPositionId }}</template>
            <template v-else>Liquidity added! LP tokens minted: {{ lpMinted }}</template>
          </div>

          <!-- Submit -->
          <button
            type="button"
            class="tx-btn tx-btn--primary tx-btn--lg tx-btn--block add-liquidity__submit"
            :disabled="!canSubmit && store.isAuthenticated"
            @click="store.isAuthenticated ? submit() : auth.connect()"
          >{{ submitLabel }}</button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { depositTokenForLiquidity, removeDepositFromCache } from '../../utils/deposit'
import {
  calculateAmounts,
  capitalEfficiency,
  priceToRatio,
  formatRangePrice,
  ratioToHumanPrice,
  isEffectivelyFullRange,
} from '../../utils/concentrated'
import { useExchangeAuth } from '../../composables/useExchangeAuth'
import { useExchangeToast } from '../../composables/useExchangeToast'
import { isTransportError, verifyAfterTransportError, type VerifyStatus } from '../../utils/errors'

import CoinIcon from '../common/CoinIcon.vue'
import PairIcon from '../common/PairIcon.vue'
import LiquidityCurve, { type LiquidityBar } from '../common/LiquidityCurve.vue'
import CapitalEfficiencyCallout from '../common/CapitalEfficiencyCallout.vue'
import RangePresetChips from '../common/RangePresetChips.vue'

const props = defineProps<{
  initialToken0?: string
  initialToken1?: string
  /** Matches Figma's PoolFullRange — use 'full' to default to full-range mode. */
  initialMode?: 'concentrated' | 'full'
}>()

const store = useExchangeStore()
const auth = useExchangeAuth()
const toast = useExchangeToast()

// ── Mode ──────────────────────────────────────────────────────────
const mode = ref<'concentrated' | 'full'>(props.initialMode ?? 'concentrated')

// ── Pair selection ────────────────────────────────────────────────
const selectedPair = ref(
  props.initialToken0 && props.initialToken1
    ? `${props.initialToken0}|${props.initialToken1}`
    : '',
)
const pairSearch = ref('')
const pairDropdownOpen = ref(false)
const pairRootRef = ref<HTMLElement | null>(null)

const BASE_TOKENS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai', // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai', // ckUSDC
])

const pairs = computed(() => {
  const tokens = store.tokens
  const out: { key: string; label: string }[] = []
  const seen = new Set<string>()
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      let baseIdx = i, quoteIdx = j
      if (BASE_TOKENS.has(tokens[i].address) && !BASE_TOKENS.has(tokens[j].address)) {
        baseIdx = j; quoteIdx = i
      }
      const key = `${tokens[baseIdx].address}|${tokens[quoteIdx].address}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ key, label: `${tokens[baseIdx].symbol} / ${tokens[quoteIdx].symbol}` })
    }
  }
  return out
})
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
function onPairOutside(e: MouseEvent) {
  if (pairRootRef.value && !pairRootRef.value.contains(e.target as Node)) {
    pairDropdownOpen.value = false
  }
}

// ── Token info ────────────────────────────────────────────────────
const token0 = computed(() => selectedPair.value.split('|')[0] || '')
const token1 = computed(() => selectedPair.value.split('|')[1] || '')
const info0 = computed(() => store.tokens.find(t => t.address === token0.value))
const info1 = computed(() => store.tokens.find(t => t.address === token1.value))
const symbol0 = computed(() => info0.value?.symbol ?? 'Token 0')
const symbol1 = computed(() => info1.value?.symbol ?? 'Token 1')
const decimals0 = computed(() => Number(info0.value?.decimals ?? 8))
const decimals1 = computed(() => Number(info1.value?.decimals ?? 8))

// ── Token colors for CoinIcon / PairIcon ──────────────────────────
const TOKEN_COLOR_MAP: Record<string, string> = {
  TACO: '#f28b3a', ICP: '#29abe2', ckBTC: '#f7931a', ckETH: '#627eea',
  ckUSDC: '#2775ca', ckUSDT: '#26a17b', NACHOS: '#f5c06b',
  DKP: '#b25e95', SGLDT: '#b8860b',
}
const FALLBACK = ['#9b59b6', '#3498db', '#1abc9c', '#e67e22', '#16a085', '#c0392b', '#d35400', '#8e44ad']
function colorForSymbol(sym: string): string {
  if (TOKEN_COLOR_MAP[sym]) return TOKEN_COLOR_MAP[sym]
  let h = 0
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) | 0
  return FALLBACK[Math.abs(h) % FALLBACK.length]
}

// ── Balances + pool info ──────────────────────────────────────────
const balance0 = ref(0n)
const balance1 = ref(0n)
const poolInfo = ref<any>(null)
const poolReserve0 = ref(0n)
const poolReserve1 = ref(0n)
const currentPrice = ref(0) // token1-per-token0

async function fetchBalances() {
  if (!store.isAuthenticated || !token0.value || !token1.value) return
  balance0.value = await store.getUserBalance(token0.value)
  balance1.value = await store.getUserBalance(token1.value)
}

async function loadPoolInfo() {
  if (!token0.value || !token1.value) return
  try {
    const raw = await store.getAMMPoolInfo(token0.value, token1.value)
    const p = Array.isArray(raw) ? raw[0] ?? null : raw
    if (p && 'reserve0' in (p as any)) {
      poolInfo.value = p
      const pp = p as any
      if (pp.token0 === token0.value) {
        poolReserve0.value = pp.reserve0
        poolReserve1.value = pp.reserve1
      } else {
        poolReserve0.value = pp.reserve1
        poolReserve1.value = pp.reserve0
      }
      currentPrice.value = pp.price0 || 0
      // Default concentrated range: ±25% of current price (only if unset)
      if (currentPrice.value > 0 && priceLower.value <= 0) {
        priceLower.value = currentPrice.value * 0.75
        priceUpper.value = currentPrice.value * 1.25
      }
    } else {
      poolInfo.value = null
      poolReserve0.value = 0n
      poolReserve1.value = 0n
      currentPrice.value = 0
    }
  } catch {
    poolInfo.value = null
    poolReserve0.value = 0n
    poolReserve1.value = 0n
    currentPrice.value = 0
  }
}

const isNewPool = computed(() => poolReserve0.value === 0n && poolReserve1.value === 0n)
const isDustPool = computed(() => {
  if (isNewPool.value) return false
  const min0 = (info0.value?.minimum_amount ?? 0n) * 10n
  const min1 = (info1.value?.minimum_amount ?? 0n) * 10n
  return poolReserve0.value < min0 || poolReserve1.value < min1
})
const shouldUseInitial = computed(() => isNewPool.value || isDustPool.value)

const feeDisplay = computed(() => `${Number(store.tradingFeeBps) / 100}%`)

// ── Amounts ───────────────────────────────────────────────────────
const amount0 = ref('')
const amount1 = ref('')

function formatBal(balance: bigint, decimals: number): string {
  return (Number(balance) / 10 ** decimals).toLocaleString(undefined, {
    maximumFractionDigits: Math.min(decimals, 4),
  })
}
function bigIntToDecimal(amount: bigint, decimals: number, maxFrac: number): string {
  const div = 10n ** BigInt(decimals)
  const whole = amount / div
  const frac = amount % div
  if (maxFrac === 0) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac)
  return `${whole}.${fracStr}`
}
function onlyNumbers(e: KeyboardEvent) {
  if (e.key !== '.' && (e.key < '0' || e.key > '9')) e.preventDefault()
}
function setPercentage0(pct: number) {
  if (balance0.value <= 0n || !info0.value) return
  const fee = info0.value.transfer_fee ?? 0n
  const max = balance0.value > fee ? balance0.value - fee : 0n
  const use = pct === 100 ? max : (max * BigInt(pct)) / 100n
  amount0.value = bigIntToDecimal(use, decimals0.value, Math.min(decimals0.value, 6))
  onAmount0Change()
}
function setPercentage1(pct: number) {
  if (balance1.value <= 0n || !info1.value) return
  const fee = info1.value.transfer_fee ?? 0n
  const max = balance1.value > fee ? balance1.value - fee : 0n
  const use = pct === 100 ? max : (max * BigInt(pct)) / 100n
  amount1.value = bigIntToDecimal(use, decimals1.value, Math.min(decimals1.value, 6))
  onAmount1Change()
}
function onAmount0Change() {
  const a0 = parseFloat(amount0.value)
  if (!a0 || a0 <= 0) return
  if (mode.value === 'concentrated') {
    if (currentPrice.value <= 0) return
    const pl = priceLower.value > 0 ? priceLower.value : 0.0001
    const pu = priceUpper.value
    const r = calculateAmounts(a0, true, currentPrice.value, pl, pu)
    amount1.value = r.amount1 > 0 ? r.amount1.toFixed(Math.min(decimals1.value, 6)) : '0'
  } else {
    if (isNewPool.value || poolReserve0.value === 0n) return
    const a1 = a0 * Number(poolReserve1.value) / Number(poolReserve0.value)
      * (10 ** decimals0.value) / (10 ** decimals1.value)
    amount1.value = a1.toFixed(Math.min(decimals1.value, 6))
  }
}
function onAmount1Change() {
  const a1 = parseFloat(amount1.value)
  if (!a1 || a1 <= 0) return
  if (mode.value === 'concentrated') {
    if (currentPrice.value <= 0) return
    const pl = priceLower.value > 0 ? priceLower.value : 0.0001
    const pu = priceUpper.value
    const r = calculateAmounts(a1, false, currentPrice.value, pl, pu)
    amount0.value = r.amount0 > 0 ? r.amount0.toFixed(Math.min(decimals0.value, 6)) : '0'
  } else {
    if (isNewPool.value || poolReserve1.value === 0n) return
    const a0 = a1 * Number(poolReserve0.value) / Number(poolReserve1.value)
      * (10 ** decimals1.value) / (10 ** decimals0.value)
    amount0.value = a0.toFixed(Math.min(decimals0.value, 6))
  }
}

// ── Concentrated range state (absolute prices) ────────────────────
// priceUpper = Infinity and priceLower <= 0 mark the "unbounded" case —
// those paths go through addLiquidity, not addConcentratedLiquidity.
const priceLower = ref(0)
const priceUpper = ref(Infinity)
const inverted = ref(false)

// Display values flip when inverted
const displayLower = computed<number>(() => {
  if (inverted.value) return !isFinite(priceUpper.value) ? 0 : 1 / priceUpper.value
  return priceLower.value
})
const displayUpper = computed<number>(() => {
  if (inverted.value) return priceLower.value <= 0 ? Infinity : 1 / priceLower.value
  return priceUpper.value
})
const displayCurrentPrice = computed(() =>
  currentPrice.value <= 0 ? 0 : (inverted.value ? 1 / currentPrice.value : currentPrice.value),
)

const token0Disabled = computed(() =>
  currentPrice.value > 0 && currentPrice.value >= priceUpper.value,
)
const token1Disabled = computed(() =>
  currentPrice.value > 0 && priceLower.value > 0 && currentPrice.value <= priceLower.value,
)

const efficiencyMultiplier = computed(() => {
  if (priceLower.value <= 0 || priceUpper.value <= priceLower.value) return 1
  return capitalEfficiency(priceLower.value, priceUpper.value)
})

// ── Chart bridge: absolute display prices ↔ 0–100 percent ─────────
// Chart covers priceNow / R → priceNow * R, log scale, priceNow at 50%.
// R starts at 4 and grows monotonically as the user pushes a handle or
// types a price beyond the current view — never shrinks during a session
// (so dragging back in doesn't make the handles snap back to a new edge).
const CHART_RANGE_DEFAULT = 4
const chartRange = ref(CHART_RANGE_DEFAULT)
function priceToPct(price: number): number {
  const base = displayCurrentPrice.value
  if (base <= 0 || price <= 0 || !isFinite(price)) return price <= 0 ? 0 : 100
  const off = Math.log(price / base) / Math.log(chartRange.value)
  return Math.max(0, Math.min(100, 50 + off * 50))
}
function pctToPrice(pct: number): number {
  const base = displayCurrentPrice.value
  if (base <= 0) return 0
  return base * Math.exp(((pct - 50) / 50) * Math.log(chartRange.value))
}

// Expand chart range to fit a handle at price `p` (display-space). Adds
// 15% headroom so the handle doesn't sit right at the edge.
function ensureRangeFits(p: number) {
  const base = displayCurrentPrice.value
  if (base <= 0 || p <= 0 || !isFinite(p)) return
  const ratio = p > base ? p / base : base / p
  const needed = ratio * 1.15
  if (needed > chartRange.value) chartRange.value = needed
}
const chartMinPct = computed(() => priceToPct(displayLower.value))
const chartMaxPct = computed(() => priceToPct(displayUpper.value))
const chartAxisLabels = computed<string[]>(() => {
  const base = displayCurrentPrice.value
  if (base <= 0) return ['', '', '', '', '', '']
  // 6 evenly-spaced points from 0% to 100%
  return [0, 20, 40, 60, 80, 100].map(p => formatRangePrice(pctToPrice(p)))
})

// ── Real on-chain liquidity density for the curve ────────────────
// Fetched from `getPoolRanges` on pair change. Each range is converted to
// the same pct-space the handles use, so bars and handles line up.
const rangesRaw = ref<Array<any>>([])
async function loadRanges() {
  if (!token0.value || !token1.value) {
    rangesRaw.value = []
    return
  }
  try {
    const raw = await store.getPoolRanges(token0.value, token1.value)
    rangesRaw.value = Array.isArray(raw) ? raw : []
  } catch {
    rangesRaw.value = []
  }
}

// V3-style "TVL by price" curve: for each chart column we sum the dollar
// value of token0 + token1 each position would have locked in that price
// slice. This makes full-range render as a curve peaked at current price
// and tapering to both sides (constant-product behavior in log-price), and
// concentrated positions render as taller bars within their range.
//
// Math (Uniswap V3 invariants): for a position with liquidity L active in
// [pa, pb], between any two prices p1 < p2 inside the range:
//   amount1 = L · (√p2 - √p1)        (when both ≤ current — token1 leg)
//   amount0 = L · (1/√p1 - 1/√p2)    (when both ≥ current — token0 leg)
// USD = amount0 / 10^d0 · price0 + amount1 / 10^d1 · price1.
//
// Falls back to plain L summing when token USD prices aren't known yet —
// chart still renders, just with the old "constant L per column" shape.
const CURVE_COLUMNS = 60
const realLiquidityBars = computed<LiquidityBar[]>(() => {
  if (currentPrice.value <= 0 || rangesRaw.value.length === 0) return []
  const pNow = currentPrice.value
  const p0Usd = store.getTokenPriceUSD(token0.value) || 0
  const p1Usd = store.getTokenPriceUSD(token1.value) || 0
  const useUsd = p0Usd > 0 && p1Usd > 0
  const dec0 = 10 ** decimals0.value
  const dec1 = 10 ** decimals1.value
  // Decimal-half-scale correction (matches `liquidityToAmounts` in
  // utils/concentrated.ts) so mismatched decimals don't skew the curve.
  const decHalf = (decimals0.value - decimals1.value) / 2
  const scale0  = Math.pow(10,  decHalf)
  const scale1  = Math.pow(10, -decHalf)

  // Precompute each column's NATIVE (token1/token0) price bounds. The
  // chart axis is in display space; flip when `inverted` is on.
  const colLo = new Array<number>(CURVE_COLUMNS)
  const colHi = new Array<number>(CURVE_COLUMNS)
  for (let c = 0; c < CURVE_COLUMNS; c++) {
    const dispLo = pctToPrice((c / CURVE_COLUMNS) * 100)
    const dispHi = pctToPrice(((c + 1) / CURVE_COLUMNS) * 100)
    colLo[c] = inverted.value ? 1 / dispHi : dispLo
    colHi[c] = inverted.value ? 1 / dispLo : dispHi
  }

  const cells = new Array<number>(CURVE_COLUMNS).fill(0)
  for (const r of rangesRaw.value) {
    const L = Number(r.liquidity)
    if (!isFinite(L) || L <= 0) continue

    let paN: number, pbN: number
    if (isEffectivelyFullRange(r.ratioLower, r.ratioUpper)) {
      paN = 0
      pbN = Infinity
    } else {
      paN = ratioToHumanPrice(r.ratioLower, decimals0.value, decimals1.value)
      pbN = ratioToHumanPrice(r.ratioUpper, decimals0.value, decimals1.value)
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
      if (useUsd) {
        cells[c] += (amount0 / dec0) * p0Usd + (amount1 / dec1) * p1Usd
      } else {
        // Token1-human-unit fallback when USD prices aren't loaded.
        cells[c] += (amount1 / dec1) + (amount0 / dec0) * pNow
      }
    }
  }

  const out: LiquidityBar[] = []
  for (let c = 0; c < CURVE_COLUMNS; c++) {
    if (cells[c] <= 0) continue
    out.push({
      pctLow:  (c / CURVE_COLUMNS) * 100,
      pctHigh: ((c + 1) / CURVE_COLUMNS) * 100,
      // sqrt-compress so concentrated spikes don't visually annihilate
      // the full-range baseline. LiquidityCurve normalizes by max anyway.
      liquidity: Math.sqrt(cells[c]),
    })
  }
  return out
})

function setPriceLowerFromDisplay(dispVal: number) {
  if (inverted.value) {
    priceUpper.value = dispVal <= 0 ? Infinity : 1 / dispVal
  } else {
    priceLower.value = dispVal
  }
  onAmount0Change()
}
function setPriceUpperFromDisplay(dispVal: number) {
  if (inverted.value) {
    priceLower.value = !isFinite(dispVal) || dispVal <= 0 ? 0 : 1 / dispVal
  } else {
    priceUpper.value = !isFinite(dispVal) || dispVal <= 0 ? Infinity : dispVal
  }
  onAmount0Change()
}
// Drag handler: when the handle hits the edge, widen the chart slightly
// each move event so the user can keep dragging to extend the range.
// Curve clamps emitted pct to [0, 100], so an edge-pinned drag keeps
// firing pct=0 / pct=100 — we use that as a "user wants wider" signal.
const CHART_RANGE_MAX = 100  // safety cap (10x both sides)
function widenAtEdge() {
  if (chartRange.value < CHART_RANGE_MAX) {
    chartRange.value = Math.min(CHART_RANGE_MAX, chartRange.value * 1.01)
  }
}
function onChartMinPct(pct: number) {
  if (pct <= 0.5) widenAtEdge()
  setPriceLowerFromDisplay(pctToPrice(pct))
}
function onChartMaxPct(pct: number) {
  if (pct >= 99.5) widenAtEdge()
  setPriceUpperFromDisplay(pctToPrice(pct))
}
function onDisplayLowerInput(raw: string) {
  const v = parseFloat(raw)
  if (!isFinite(v)) return
  setPriceLowerFromDisplay(v)
  ensureRangeFits(displayLower.value)
}
function onDisplayUpperInput(raw: string) {
  const v = parseFloat(raw)
  if (!isFinite(v)) return
  setPriceUpperFromDisplay(v)
  ensureRangeFits(displayUpper.value)
}
function nudgePrice(which: 'lower' | 'upper', dir: 1 | -1) {
  const step = 1.01 ** dir // 1% step
  if (which === 'lower') {
    const cur = displayLower.value > 0 ? displayLower.value : displayCurrentPrice.value * 0.75
    setPriceLowerFromDisplay(cur * step)
  } else {
    const cur = isFinite(displayUpper.value) ? displayUpper.value : displayCurrentPrice.value * 1.25
    setPriceUpperFromDisplay(cur * step)
  }
}
// Full-range sentinel display: lower = 0 sticks at 0, upper = Infinity
// shows as ∞ — matches the Figma Full Range explainer for the
// "unbounded" case when the user clicks the Full Range button inside
// the Concentrated range card.
function formatInputPrice(v: number): string {
  if (v === 0) return '0'
  if (!isFinite(v)) return '∞'
  if (v < 0) return '—'
  return formatRangePrice(v)
}

// Preset chips set ±N% around native current price (token1/token0).
function applyPresetPct(pct: number) {
  if (currentPrice.value <= 0) return
  const frac = pct / 100
  priceLower.value = currentPrice.value * (1 - frac)
  priceUpper.value = currentPrice.value * (1 + frac)
  onAmount0Change()
}
function applyAutoRange() {
  if (currentPrice.value <= 0) return
  priceLower.value = currentPrice.value * 0.75
  priceUpper.value = currentPrice.value * 1.25
  onAmount0Change()
}
function applyFullRangeInConcentrated() {
  // Sentinel for unbounded; the submit handler redirects to full-range flow
  priceLower.value = 0
  priceUpper.value = Infinity
  // Don't recompute amounts — calculateAmounts returns NaN for unbounded,
  // and the user may just be previewing.
}

// ── Phase / error / recovery state ────────────────────────────────
const phase = ref<'idle' | 'deposit0' | 'deposit1' | 'adding' | 'success'>('idle')
const error = ref('')
const recoveryInfo = ref('')
const lpMinted = ref('')
const resultPositionId = ref(0n)

interface PendingDeposit { token: string; block: string; symbol: string; timestamp: number }
const pendingDeposit = ref<PendingDeposit | null>(null)
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
      if (Date.now() - entry.timestamp < 21 * 86400 * 1000) {
        pendingDeposit.value = entry
      } else {
        clearPendingDeposit()
      }
    }
  } catch { /* ignore */ }
}

// ── Submit ────────────────────────────────────────────────────────
const canSubmit = computed(() => {
  if (!selectedPair.value || !store.isAuthenticated) return false
  if (phase.value !== 'idle' && phase.value !== 'success') return false
  const a0 = parseFloat(amount0.value)
  const a1 = parseFloat(amount1.value)
  if (mode.value === 'concentrated') {
    if (token0Disabled.value) return a1 > 0
    if (token1Disabled.value) return a0 > 0
    return a0 > 0 || a1 > 0
  }
  return a0 > 0 && a1 > 0
})

const submitLabel = computed(() => {
  if (!store.isAuthenticated) return 'Connect Wallet'
  if (phase.value === 'deposit0' || phase.value === 'deposit1' || phase.value === 'adding') return 'Processing…'
  if (!selectedPair.value) return 'Select a pair'
  if (mode.value === 'full') {
    if (isNewPool.value) return 'Create Pool'
    if (isDustPool.value) return 'Recreate Pool'
    return 'Add Liquidity (Full Range)'
  }
  return 'Add Liquidity'
})

async function submit() {
  if (mode.value === 'concentrated') await submitConcentrated()
  else await submitFullRange()
}

async function submitFullRange() {
  error.value = ''
  recoveryInfo.value = ''
  const a0Raw = BigInt(Math.round(parseFloat(amount0.value) * 10 ** decimals0.value))
  const a1Raw = BigInt(Math.round(parseFloat(amount1.value) * 10 ** decimals1.value))
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
    try {
      const pre = await store.getUserLiquidityDetailed()
      prePositionCount = pre.length
      preLiqByPair = new Map(pre.map((p: any) => [`${p.token0}|${p.token1}`, p.liquidity]))
    } catch { /* probe falls back to 'unknown' */ }

    phase.value = 'deposit0'
    block0 = await depositTokenForLiquidity(
      token0.value, info0.value!.asset_type as any,
      a0Raw, store.treasuryAccountId, store.treasuryPrincipal,
    )
    savePendingDeposit(token0.value, block0, symbol0.value)

    phase.value = 'deposit1'
    block1 = await depositTokenForLiquidity(
      token1.value, info1.value!.asset_type as any,
      a1Raw, store.treasuryAccountId, store.treasuryPrincipal,
    )
    savePendingDeposit(token1.value, block1, symbol1.value)

    phase.value = 'adding'
    const useInitial = shouldUseInitial.value ? true : undefined
    const result = await store.addLiquidity(
      token0.value, token1.value,
      a0Raw, a1Raw, block0, block1, useInitial,
    )
    if ('Ok' in result) {
      clearPendingDeposit()
      removeDepositFromCache(block0.toString())
      removeDepositFromCache(block1.toString())
      lpMinted.value = result.Ok.liquidityMinted.toString()
      phase.value = 'success'
      amount0.value = ''
      amount1.value = ''
      await store.refreshAfterMutation('lp')
      toast.success('Liquidity Added', 'LP tokens minted: ' + lpMinted.value)
    } else {
      const { classifyExchangeError, isAutoRefundError } = await import('../../utils/errors')
      if (isAutoRefundError(result.Err)) {
        clearPendingDeposit()
        removeDepositFromCache(block0.toString())
        removeDepositFromCache(block1.toString())
        error.value = 'Transaction rejected — your tokens are being refunded automatically.'
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
        } catch { return 'unknown' }
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
    recoveryInfo.value = 'If you deposited tokens, go to Recover to retrieve them.'
    phase.value = 'idle'
    toast.error('Add Liquidity Failed', error.value)
  }
}

async function submitConcentrated() {
  error.value = ''
  recoveryInfo.value = ''
  const a0Raw = BigInt(Math.round(parseFloat(amount0.value || '0') * 10 ** decimals0.value))
  const a1Raw = BigInt(Math.round(parseFloat(amount1.value || '0') * 10 ** decimals1.value))
  if (a0Raw <= 0n && a1Raw <= 0n) {
    error.value = 'Enter an amount'
    return
  }
  const min0 = (info0.value?.minimum_amount ?? 0n) * 10n
  const min1 = (info1.value?.minimum_amount ?? 0n) * 10n
  if (a0Raw > 0n && a0Raw < min0) {
    error.value = `Minimum LP deposit for ${symbol0.value} is ${Number(min0) / 10 ** decimals0.value}`
    return
  }
  if (a1Raw > 0n && a1Raw < min1) {
    error.value = `Minimum LP deposit for ${symbol1.value} is ${Number(min1) / 10 ** decimals1.value}`
    return
  }
  if (priceLower.value <= 0 || !isFinite(priceUpper.value) || priceUpper.value <= priceLower.value) {
    error.value = 'Set a bounded price range. For unbounded positions, switch to Full Range.'
    return
  }
  const ratioLower = priceToRatio(priceLower.value, decimals0.value, decimals1.value)
  const ratioUpper = priceToRatio(priceUpper.value, decimals0.value, decimals1.value)

  let block0 = 0n
  let block1 = 0n
  let prePositionCount = 0
  try {
    try {
      const pre = await store.getUserLiquidityDetailed()
      prePositionCount = pre.length
    } catch { /* fall back to 'unknown' */ }

    if (a0Raw > 0n) {
      phase.value = 'deposit0'
      block0 = await depositTokenForLiquidity(
        token0.value, info0.value!.asset_type as any,
        a0Raw, store.treasuryAccountId, store.treasuryPrincipal,
      )
    }
    if (a1Raw > 0n) {
      phase.value = 'deposit1'
      block1 = await depositTokenForLiquidity(
        token1.value, info1.value!.asset_type as any,
        a1Raw, store.treasuryAccountId, store.treasuryPrincipal,
      )
    }

    phase.value = 'adding'
    const result = await store.addConcentratedLiquidity(
      token0.value, token1.value,
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
        } catch { return 'unknown' }
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

// ── Summary displays ─────────────────────────────────────────────
function formatPrice(p: number): string {
  if (!isFinite(p) || p <= 0) return '—'
  return formatRangePrice(p)
}

// Total USD value of what the user is about to deposit.
const newDepositUsd = computed(() => {
  const a0 = parseFloat(amount0.value) || 0
  const a1 = parseFloat(amount1.value) || 0
  const p0 = store.getTokenPriceUSD(token0.value) || 0
  const p1 = store.getTokenPriceUSD(token1.value) || 0
  return a0 * p0 + a1 * p1
})

const totalDepositDisplay = computed(() => {
  const usd = newDepositUsd.value
  if (usd <= 0) return '—'
  return usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

// Pool's position in exchangeInfoData (pool_canister / volume_24h arrays
// are index-aligned). -1 when the pair isn't indexed yet.
const poolIndex = computed<number>(() => {
  const info = store.exchangeInfoData
  if (!info?.pool_canister) return -1
  for (let i = 0; i < info.pool_canister.length; i++) {
    const [t0, t1] = info.pool_canister[i]
    if ((t0 === token0.value && t1 === token1.value) ||
        (t0 === token1.value && t1 === token0.value)) return i
  }
  return -1
})

const poolTvlUsd = computed(() => {
  const r0 = Number(poolReserve0.value) / 10 ** decimals0.value
  const r1 = Number(poolReserve1.value) / 10 ** decimals1.value
  const p0 = store.getTokenPriceUSD(token0.value) || 0
  const p1 = store.getTokenPriceUSD(token1.value) || 0
  return r0 * p0 + r1 * p1
})

// 24h pool volume in USD. `volume_24h` is in the pool's canonical token0
// units (backend convention — same path used by the header stat cluster).
const pool24hVolumeUsd = computed(() => {
  const info = store.exchangeInfoData
  const idx = poolIndex.value
  if (!info?.volume_24h || idx < 0) return 0
  const vol = info.volume_24h[idx] ?? 0n
  const [canonicalT0] = info.pool_canister[idx]
  const volDecimals = canonicalT0 === token0.value ? decimals0.value : decimals1.value
  const volPrice = store.getTokenPriceUSD(canonicalT0) || 0
  return (Number(vol) / 10 ** volDecimals) * volPrice
})

const poolShareDisplay = computed(() => {
  const tvl = poolTvlUsd.value
  const deposit = newDepositUsd.value
  if (deposit <= 0) return '—'
  const pct = (deposit / (tvl + deposit)) * 100
  if (!isFinite(pct) || pct <= 0) return '—'
  if (pct >= 100) return '100%'
  if (pct < 0.0001) return '< 0.0001%'
  return pct < 0.01
    ? pct.toFixed(4) + '%'
    : pct < 1 ? pct.toFixed(3) + '%' : pct.toFixed(2) + '%'
})

// Est. APR — pool fee yield on a 24h-volume basis, annualized. In
// concentrated mode we boost by the capital-efficiency multiplier (wider
// ranges earn the pool's base APR; tighter ranges earn proportionally
// more of the same fee stream). Always positive — fees accrue, they
// don't go negative — but the tone prop on the summary cell can still
// drive coloring.
const estimatedAprPct = computed<number | null>(() => {
  const tvl = poolTvlUsd.value
  const vol = pool24hVolumeUsd.value
  if (tvl <= 0 || vol <= 0) return null
  const feeRate = Number(store.tradingFeeBps) / 10000
  let apr = (vol * feeRate * 365) / tvl * 100
  if (mode.value === 'concentrated' && efficiencyMultiplier.value > 1) {
    apr *= efficiencyMultiplier.value
  }
  return apr
})
const estimatedAprSign = computed(() => 1)
const estimatedAprDisplay = computed(() => {
  const apr = estimatedAprPct.value
  if (apr == null) return '—'
  if (apr < 0.01) return '< 0.01%'
  if (apr >= 1000) return apr.toFixed(0) + '%'
  if (apr >= 100) return apr.toFixed(1) + '%'
  return apr.toFixed(2) + '%'
})

// ── Watchers + lifecycle ──────────────────────────────────────────
watch(selectedPair, () => {
  // Reset pair-scoped state when the pair changes
  amount0.value = ''
  amount1.value = ''
  priceLower.value = 0
  priceUpper.value = Infinity
  poolReserve0.value = 0n
  poolReserve1.value = 0n
  currentPrice.value = 0
  rangesRaw.value = []
  chartRange.value = CHART_RANGE_DEFAULT
  loadPoolInfo()
  fetchBalances()
  loadRanges()
})

// If the caller didn't preselect a pair, default to TACO/ICP once the
// token list loads. This matches the user's expectation on entering the
// Add Liquidity view with no pool preselected.
const ICP_ADDR = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
function ensureDefaultPair() {
  if (selectedPair.value) return
  if (!store.tokens.length) return
  const taco = store.tokens.find(t => t.symbol === 'TACO')
  const icp  = store.tokens.find(t => t.address === ICP_ADDR)
  if (taco && icp) {
    // Non-base first (TACO), base second (ICP) — matches the pairs list ordering.
    selectedPair.value = `${taco.address}|${icp.address}`
  } else if (store.tokens.length >= 2) {
    // Fallback: first two tokens so the form isn't blank.
    const [a, b] = store.tokens
    selectedPair.value = BASE_TOKENS.has(a.address) && !BASE_TOKENS.has(b.address)
      ? `${b.address}|${a.address}`
      : `${a.address}|${b.address}`
  }
}
// Tokens may load async after mount.
watch(() => store.tokens.length, ensureDefaultPair)

onMounted(() => {
  loadPendingDeposit()
  fetchBalances()
  ensureDefaultPair()
  if (token0.value && token1.value) {
    loadPoolInfo()
    loadRanges()
  }
  document.addEventListener('click', onPairOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', onPairOutside)
})
</script>

<style scoped lang="scss">
.add-liquidity {
  &__grid {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 20px;

    @media (max-width: 820px) {
      grid-template-columns: minmax(0, 1fr);
      max-width: 540px;
      margin-inline: auto;
    }
  }

  &__left,
  &__right {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  &__eyebrow { margin-bottom: 8px; }

  /* ─── Pool card ──────────────────────────────────────────────── */
  &__pool-card {
    padding: 16px;
  }

  &__pair { position: relative; }
  &__pair-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 44px;
    padding: 0 12px;
    background: var(--tx-surface-1);
    border: 1px solid var(--tx-line);
    color: var(--tx-ink);
    border-radius: var(--tx-r-md);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    transition: border-color 140ms;

    &:hover,
    &--open { border-color: var(--tx-line-hi); }
  }
  &__pair-label {
    flex: 1;
    font-weight: 600;
  }
  &__pair-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--tx-panel-bg-2);
    border: 1px solid var(--tx-line-2);
    border-radius: var(--tx-r-lg);
    box-shadow: var(--tx-shadow-2);
    overflow: hidden;
  }
  &__pair-search {
    margin: 8px;
    width: calc(100% - 16px);
  }
  &__pair-list {
    max-height: 280px;
    overflow-y: auto;
  }
  &__pair-option {
    display: block;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--tx-line);
    color: var(--tx-ink);
    font-size: 13px;
    cursor: pointer;
    text-align: left;

    &:hover { background: var(--tx-surface-1); }
    &--active { background: var(--tx-orange-dim); color: var(--tx-orange); }
  }
  &__pair-empty {
    padding: 14px;
    color: var(--tx-ink-3);
    font-size: 13px;
    text-align: center;
  }

  &__mode { width: 100%; margin-top: 12px; }
  &__mode > button { flex: 1; }

  &__price-info {
    margin-top: 12px;
    padding: 10px 12px;
    font-size: 12px;
  }
  &__price-info-row2 { margin-top: 4px; }

  /* ─── Deposit amounts ────────────────────────────────────────── */
  &__deposit-card {
    padding: 16px;
  }
  &__amounts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  &__amount {
    padding: 12px;

    &--disabled { opacity: 0.5; }
  }
  &__amount-ident {
    gap: 8px;
  }
  &__amount-sym { font-weight: 600; font-size: 14px; }
  &__amount-bal { font-size: 11px; }
  &__amount-input {
    width: 100%;
    margin-top: 8px;
    border: 0;
    background: transparent;
    font-size: 22px;
    font-weight: 500;
    height: 32px;
    padding: 0;
    letter-spacing: -0.01em;
  }
  &__pct-row {
    gap: 4px;
    margin-top: 6px;
  }
  &__pct-btn {
    flex: 1;
    height: 22px;
    padding: 0;
    font-size: 11px;
  }

  &__eff { margin-top: 12px; }

  &__first-deposit-warning {
    margin-top: 12px;
    padding: 10px 12px;
    font-size: 12px;
    color: var(--tx-warning);
    background: var(--tx-warning-dim);
    border: 1px solid rgba(216, 138, 63, 0.3);
    border-radius: var(--tx-r-md);
    line-height: 1.4;
  }

  /* ─── Right column — range / full range cards ────────────────── */
  &__range-card,
  &__full-card {
    padding: 16px;
  }
  &__range-header { margin-bottom: 10px; }
  &__range-flip { padding: 2px; }
  &__range-flip > button { font-size: 11px; }

  &__chart {
    background: var(--tx-surface-1);
    border: 1px solid var(--tx-line);
    border-radius: var(--tx-r-md);
    padding: 8px 12px 4px;
    margin-bottom: 14px;
  }
  &__chart-axis {
    display: flex;
    justify-content: space-between;
    padding: 4px 2px 0;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--tx-ink-3);
  }

  &__price-cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
    margin-bottom: 12px;

    // Stack under ~480px so a long Max price doesn't overflow.
    @media (max-width: 480px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  &__price-card {
    padding: 10px 12px;
    min-width: 0; // let the input shrink below its intrinsic width
    overflow: hidden;
  }
  &__price-card-label { font-size: 11px; }
  &__price-card-row {
    gap: 6px;
    margin-top: 4px;
    align-items: center;
    min-width: 0;
  }
  &__price-nudge {
    width: 26px;
    height: 26px;
    padding: 0;
  }
  &__price-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 0;
    color: var(--tx-ink);
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    padding: 0;
    outline: none;
  }
  &__price-card-unit {
    font-size: 10px;
    text-align: center;
    margin-top: 2px;
  }

  &__preset-chips { margin-bottom: 6px; }
  &__range-actions {
    gap: 6px;
  }
  &__range-actions > button { flex: 1; }

  /* ─── Full Range card ────────────────────────────────────────── */
  &__full-rates {
    margin-top: 10px;
    padding: 12px 14px;
    font-size: 13px;
  }
  &__full-rates-row2 { margin-top: 6px; }
  &__full-body {
    font-size: 12px;
    margin-top: 10px;
    line-height: 1.5;
  }

  /* ─── Summary ────────────────────────────────────────────────── */
  &__summary-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  &__summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 12px;
  }
  &__summary-cell {
    padding: 10px 12px;
  }
  &__summary-value {
    font-size: 18px;
    font-weight: 500;
    margin-top: 2px;

    &--sm { font-size: 14px; }
  }

  &__phase {
    font-size: 13px;
    color: var(--tx-orange);
    text-align: center;
  }
  &__success { text-align: center; }
  &__recovery {
    font-size: 12px;
    color: var(--tx-warning);
    background: var(--tx-warning-dim);
    border-radius: var(--tx-r-md);
    padding: 10px 12px;

    pre {
      white-space: pre-wrap;
      margin: 0 0 8px;
      font-family: var(--font-mono);
      font-size: 11px;
    }
  }

  &__submit {
    height: 48px;
    font-size: 14px;
    border-radius: var(--tx-r-lg);
    margin-top: 4px;
  }
}
</style>
