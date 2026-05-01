<template>
  <div class="otc-view tx-scroll">
    <div class="otc-view__shell">
      <ExchangeTopNav active="otc" />
    <main class="otc-view__main">
      <!-- Fill mode: arrived via /otc/:code -->
      <div v-if="accessCode" class="otc-view__fill">
        <ExchangePageTitle label="Fill" qualifier="private order" />

        <div v-if="loadingTrade" class="otc-view__loading">Loading order...</div>
        <div v-else-if="!trade" class="otc-view__not-found">
          Order not found or expired.
        </div>
        <div v-else class="otc-view__trade-card">
          <div class="otc-view__trade-badge">Private Trade</div>
          <div class="otc-view__trade-row">
            <span>Access Code</span>
            <span class="num" style="font-size:var(--text-xs);word-break:break-all">{{ accessCode }}</span>
          </div>

          <div class="otc-view__trade-row">
            <span>Offering</span>
            <span class="num">{{ formatAmount(trade.amount_init, initDecimals) }} {{ initSymbol }}</span>
          </div>
          <div class="otc-view__trade-row">
            <span>Wanting</span>
            <span class="num">{{ formatAmount(trade.amount_sell, sellDecimals) }} {{ sellSymbol }}</span>
          </div>
          <div class="otc-view__trade-row">
            <span>Price</span>
            <span class="num">{{ tradePrice }}</span>
          </div>
          <div class="otc-view__trade-row">
            <span>Filled</span>
            <span class="num">{{ fillPct }}%</span>
          </div>

          <div v-if="trade.allOrNothing" class="otc-view__aon-notice">
            All-or-Nothing: Full fill required.
          </div>

          <div class="otc-view__fill-form">
            <label class="otc-view__label">You send ({{ sellSymbol }})
              <span v-if="fillBalance > 0n" style="float:right;text-transform:none;letter-spacing:normal;color:var(--text-secondary)">
                Bal: {{ formatAmount(fillBalance, sellDecimals) }}
              </span>
            </label>
            <input
              v-model="fillAmount"
              type="text"
              inputmode="decimal"
              class="ex-input num"
              :placeholder="trade.allOrNothing ? 'Full amount required' : '0.00'"
              :disabled="trade.allOrNothing"
              @keypress="onlyNumbers"
            />
            <div v-if="!trade.allOrNothing" class="otc-view__pct-row">
              <input type="range" min="0" max="100" step="1" v-model.number="fillPctSlider" class="otc-view__slider" @input="setFillPercentage(fillPctSlider)" />
              <div class="otc-view__pct-btns">
                <button v-for="p in [25,50,75,100]" :key="p" class="ex-pct-btn" :class="{'ex-pct-btn--active': fillPctSlider===p}" @click="fillPctSlider=p;setFillPercentage(p)">{{p}}%</button>
              </div>
            </div>
            <div v-if="expectedReceive" class="otc-view__expected">
              You receive: ~{{ expectedReceive }} {{ initSymbol }}
            </div>
          </div>

          <div v-if="fillError" class="ex-error-box">{{ fillError }}</div>
          <div v-if="fillPhase === 'success'" class="ex-success-box otc-view__success-centered" style="position:relative">
            Order filled successfully!
            <button class="otc-view__result-close" @click="fillPhase = 'idle'">&times;</button>
          </div>

          <button
            class="ex-btn ex-btn--primary otc-view__fill-btn"
            :disabled="!canFill"
            @click="fillOrder"
          >
            <template v-if="fillPhase === 'depositing'">Depositing...</template>
            <template v-else-if="fillPhase === 'filling'">Filling...</template>
            <template v-else-if="!store.isAuthenticated">Connect Wallet</template>
            <template v-else-if="fillBalance === 0n">No {{ sellSymbol }} Balance</template>
            <template v-else-if="insufficientBalance">Insufficient {{ sellSymbol }}</template>
            <template v-else>Fill Order</template>
          </button>
        </div>
      </div>

      <!-- Create mode: no code -->
      <div v-else class="otc-view__create">
        <ExchangePageTitle
          label="OTC"
          qualifier="private orders"
          subtitle="Quiet table. Hand-pick your counter-party, or burn the order into pure chaincode and let them find it."
        />

        <!-- Access Code Lookup -->
        <div class="otc-view__lookup">
          <h3 class="otc-view__section-title">Enter Access Code</h3>
          <div class="otc-view__lookup-input">
            <input
              v-model="lookupCode"
              class="ex-input"
              placeholder="Paste access code here..."
              @keyup.enter="lookupTrade"
            />
            <button
              class="ex-btn ex-btn--primary ex-btn--md"
              :disabled="!lookupCode.trim() || lookingUp"
              @click="lookupTrade"
            >{{ lookingUp ? 'Looking up...' : 'Look Up' }}</button>
          </div>
          <div v-if="lookupError" class="ex-error-box" style="margin-top:var(--space-2)">{{ lookupError }}</div>

          <!-- Saved Codes -->
          <div v-if="savedCodes.length > 0" class="otc-view__saved">
            <h4>Saved Codes</h4>
            <div class="ex-table-wrap">
              <table class="ex-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>You Send</th>
                    <th>You Get</th>
                    <th>Fill %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in savedCodes" :key="s.code">
                    <td class="num" style="font-size:var(--text-xs)">{{ s.code.slice(0, 8) }}...{{ s.code.slice(-4) }}</td>
                    <td class="num">{{ getSymbol(s.tokenSend) }}</td>
                    <td class="num">{{ getSymbol(s.tokenReceive) }}</td>
                    <td>
                      <span :class="s.fillPct < 100 ? 'text-buy' : 'text-sell'">
                        {{ s.fillPct.toFixed(0) }}%
                      </span>
                    </td>
                    <td>
                      <div style="display:flex;gap:4px">
                        <button class="ex-btn ex-btn--sm ex-btn--primary" @click="router.push(`/otc/${s.code}`)">Fill</button>
                        <button class="ex-btn ex-btn--sm ex-btn--danger-outline" @click="removeFromCache(s.code)">Remove</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- My Private/Secret Orders -->
        <div v-if="store.isAuthenticated" class="otc-view__my-orders">
          <h3 class="otc-view__section-title">My Private &amp; Secret Orders</h3>
          <div v-if="myPrivateOrders.length === 0" class="otc-view__empty">
            No private or secret orders. Create one below.
          </div>
          <div v-else class="otc-view__order-cards">
            <div v-for="order in myPrivateOrders" :key="order.accesscode" class="otc-view__order-card">
              <div class="otc-view__order-card-header">
                <span class="otc-view__order-card-pair">{{ getOrderPairLabel(order) }}</span>
                <span v-if="order.accesscode.endsWith('excl')" class="ex-badge ex-badge--sm">Secret</span>
                <span v-else class="ex-badge ex-badge--sm">Private</span>
                <span class="otc-view__order-card-age">{{ getAge(order.time) }}</span>
              </div>
              <div class="otc-view__order-card-details">
                <div class="otc-view__order-card-row">
                  <span>Offering</span>
                  <span class="num">{{ formatAmount(order.amount_init, getDecimals(order.token_init_identifier)) }} {{ getSymbol(order.token_init_identifier) }}</span>
                </div>
                <div class="otc-view__order-card-row">
                  <span>Wanting</span>
                  <span class="num">{{ formatAmount(order.amount_sell, getDecimals(order.token_sell_identifier)) }} {{ getSymbol(order.token_sell_identifier) }}</span>
                </div>
                <div class="otc-view__order-card-row">
                  <span>Price</span>
                  <span class="num">{{ getPrice(order) }}</span>
                </div>
                <div class="otc-view__order-card-row">
                  <span>Filled</span>
                  <span class="num">{{ getOrderFill(order) }}%</span>
                </div>
              </div>
              <div class="otc-view__order-card-actions">
                <button class="ex-btn ex-btn--sm ex-btn--outline" @click="copyAccessCode(order.accesscode)">{{ copiedFeedback === `code-${order.accesscode}` ? 'Copied!' : 'Copy Code' }}</button>
                <button class="ex-btn ex-btn--sm ex-btn--outline" @click="copyShareLink(order.accesscode)">{{ copiedFeedback === `link-${order.accesscode}` ? 'Copied!' : 'Share Link' }}</button>
                <button class="ex-btn ex-btn--sm ex-btn--danger-outline" @click="cancelPrivateOrder(order.accesscode)">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <h3 class="otc-view__section-title" style="margin-top:var(--space-6)">Create New Private Order</h3>

        <!-- Visibility -->
        <div class="otc-view__field">
          <label class="otc-view__label">Order Visibility</label>
          <div class="otc-view__visibility">
            <label class="otc-view__radio">
              <input type="radio" v-model="visibility" value="private" />
              <span>Private (access code only)</span>
            </label>
            <label class="otc-view__radio">
              <input type="radio" v-model="visibility" value="excluded" />
              <span>DAO-Excluded (maximum privacy)</span>
            </label>
          </div>
        </div>

        <!-- Token / Amount -->
        <div class="otc-view__field">
          <label class="otc-view__label">I'm offering</label>
          <select v-model="offerToken" class="ex-input">
            <option value="">Select token</option>
            <option v-for="t in store.tokens" :key="t.address" :value="t.address">{{ t.symbol }}</option>
          </select>
          <input v-model="offerAmount" type="text" inputmode="decimal" class="ex-input num" placeholder="Amount" @keypress="onlyNumbers" />
        </div>

        <div class="otc-view__field">
          <label class="otc-view__label">I want to receive</label>
          <select v-model="wantToken" class="ex-input">
            <option value="">Select token</option>
            <option v-for="t in store.tokens" :key="t.address" :value="t.address">{{ t.symbol }}</option>
          </select>
          <input v-model="wantAmount" type="text" inputmode="decimal" class="ex-input num" placeholder="Amount" @keypress="onlyNumbers" />
        </div>

        <!-- Advanced -->
        <details class="otc-view__advanced">
          <summary>Advanced Settings</summary>
          <label class="otc-view__checkbox">
            <input type="checkbox" v-model="allOrNothing" />
            <span>All or Nothing</span>
          </label>
          <label class="otc-view__checkbox">
            <input type="checkbox" v-model="strictlyOTC" />
            <span>OTC Only (no auto-matching)</span>
          </label>
        </details>

        <!-- DAO accessibility indicator: live derived state. The TACO DAO can
             match a private OTC order only when ALL THREE of excludeDAO,
             allOrNothing, strictlyOTC are false. Surface that here so users
             don't accidentally lock the DAO out by ticking AoN or OTC-Only. -->
        <div
          class="otc-view__dao-pill"
          :class="daoAccessible
            ? 'otc-view__dao-pill--ok'
            : 'otc-view__dao-pill--warn'"
        >
          <span class="otc-view__dao-pill-icon">{{ daoAccessible ? '✓' : '⚠' }}</span>
          <span class="otc-view__dao-pill-text">
            <template v-if="daoAccessible">DAO can match this order</template>
            <template v-else>
              DAO cannot match, turn off {{ daoBlockers.join(' and ') }} to enable
            </template>
          </span>
        </div>

        <div v-if="createError" class="ex-error-box">{{ createError }}</div>

        <!-- Created result -->
        <div v-if="createdCode" class="otc-view__created" style="position:relative">
          <button class="otc-view__result-close" @click="createdCode = ''; createPhase = 'idle'">&times;</button>
          <div class="otc-view__created-title">Order Created!</div>
          <div class="otc-view__code-row">
            <button class="ex-btn ex-btn--primary ex-btn--md" @click="copyLink" style="width:100%">{{ copiedLink ? 'Link Copied!' : 'Copy Share Link' }}</button>
          </div>
          <div class="otc-view__code-row">
            <span class="num" style="word-break:break-all">{{ createdCode }}</span>
            <button class="ex-btn ex-btn--sm ex-btn--outline" @click="copyCode">{{ copiedCode ? 'Copied!' : 'Copy Code' }}</button>
          </div>
          <div class="otc-view__code-row">
            <span class="otc-view__link">{{ shareLink }}</span>
          </div>
        </div>

        <button
          class="ex-btn ex-btn--primary otc-view__submit"
          :disabled="!canCreate"
          @click="createOrder"
        >
          <template v-if="createPhase === 'depositing'">Depositing...</template>
          <template v-else-if="createPhase === 'creating'">Creating...</template>
          <template v-else>Create Private Order</template>
        </button>
      </div>
    </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'
import { useExchangeStore } from '../store/exchange.store'
import { depositToken } from '../utils/deposit'
import { fillPercentage, orderPrice } from '../utils/price-math'
import type { TradePosition, TradePrivate2 } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import { useExchangeToast } from '../composables/useExchangeToast'

const route = useRoute()
const router = useRouter()
const store = useExchangeStore()
const toast = useExchangeToast()

const accessCode = computed(() => route.params.code as string || '')

// ── My Private/Secret Orders ──
const myPrivateOrders = ref<TradePrivate2[]>([])

const BASE_TOKEN_IDS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai',  // ckUSDC
  'cngnf-vqaaa-aaaar-qag4q-cai',  // ckUSDT
])

function getSymbol(address: string) {
  return store.getTokenByAddress(address)?.symbol ?? '???'
}

function getOrderPairLabel(order: TradePrivate2): string {
  const init = order.token_init_identifier
  const sell = order.token_sell_identifier
  // Base tokens (ICP, ckUSDC) always appear second (as quote)
  if (BASE_TOKEN_IDS.has(init) && !BASE_TOKEN_IDS.has(sell)) {
    return `${getSymbol(sell)}/${getSymbol(init)}`
  }
  return `${getSymbol(init)}/${getSymbol(sell)}`
}
function getDecimals(address: string) {
  return Number(store.getTokenByAddress(address)?.decimals ?? 8n)
}
function getPrice(order: TradePrivate2) {
  const raw = orderPrice(order.amount_sell, order.amount_init, getDecimals(order.token_sell_identifier), getDecimals(order.token_init_identifier))
  const isBuy = BASE_TOKEN_IDS.has(order.token_init_identifier) && !BASE_TOKEN_IDS.has(order.token_sell_identifier)
  return (isBuy && raw > 0 ? 1 / raw : raw).toFixed(6)
}
function getOrderFill(order: TradePrivate2) {
  return fillPercentage(order.filledInit, order.amount_init).toFixed(0)
}
function getAge(time: bigint) {
  const ms = Number(time) / 1_000_000
  const diff = Date.now() - ms
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  return `${Math.floor(diff / 86_400_000)}d`
}
const copiedFeedback = ref<string | null>(null)
function copyAccessCode(code: string) {
  navigator.clipboard.writeText(code).catch(() => {})
  copiedFeedback.value = `code-${code}`
  setTimeout(() => { copiedFeedback.value = null }, 2000)
  toast.info('Code Copied')
}
function copyShareLink(code: string) {
  navigator.clipboard.writeText(`${window.location.origin}${router.resolve(`/otc/${code}`).href}`).catch(() => {})
  copiedFeedback.value = `link-${code}`
  setTimeout(() => { copiedFeedback.value = null }, 2000)
  toast.info('Link Copied')
}
async function cancelPrivateOrder(code: string) {
  if (!confirm('Cancel this private order? A revoke fee will be deducted.')) return
  try {
    const result = await store.revokeTrade(code, { Initiator: null })
    if ('Ok' in result) {
      myPrivateOrders.value = myPrivateOrders.value.filter(o => o.accesscode !== code)
      toast.success('Order Cancelled')
    } else {
      const { classifyExchangeError } = await import('../utils/errors')
      toast.error('Cancel Failed', classifyExchangeError(result.Err).message)
    }
  } catch (err: any) {
    toast.error('Cancel Failed', err.message || 'Cancel failed')
  }
}

async function loadMyPrivateOrders() {
  if (!store.isAuthenticated) return
  try {
    const all = await store.getUserTrades()
    myPrivateOrders.value = all.filter(o =>
      !o.accesscode.startsWith('Public') && o.trade_done === 0n
    )
  } catch { /* ignore */ }
}

// ── Fill Mode ──
const trade = ref<TradePosition | null>(null)
const loadingTrade = ref(false)
const fillAmount = ref('')
const fillPhase = ref<'idle' | 'depositing' | 'filling' | 'success'>('idle')
const fillError = ref('')
const fillBalance = ref(0n)
const fillPctSlider = ref(0)

// Max fill: min of (remaining wanted amount, user balance minus fees)
const sellTokenInfo = computed(() => store.tokens.find(t => t.address === trade.value?.token_sell_identifier))
const maxFillByOrder = computed(() => {
  if (!trade.value) return 0n
  return trade.value.amount_sell - trade.value.filledSell
})
const maxFillByBalance = computed(() => {
  if (fillBalance.value <= 0n || !sellTokenInfo.value) return 0n
  const fee = sellTokenInfo.value.transfer_fee ?? 0n
  const tradingFee = (fillBalance.value * store.tradingFeeBps) / 10000n
  const available = fillBalance.value > (fee + tradingFee) ? fillBalance.value - fee - tradingFee : 0n
  return available
})

async function loadFillBalance() {
  if (!trade.value || !store.isAuthenticated) return
  try {
    fillBalance.value = await store.getUserBalance(trade.value.token_sell_identifier)
  } catch { fillBalance.value = 0n }
}

function bigIntToDecimal(amount: bigint, decimals: number, maxFrac: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = amount / divisor
  const frac = amount % divisor
  if (maxFrac === 0) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac)
  return `${whole}.${fracStr}`
}

function setFillPercentage(pct: number) {
  fillPctSlider.value = pct
  if (!trade.value) return
  // Use the smaller of: what the order still wants, what the user can afford
  const maxOrder = maxFillByOrder.value
  const maxBal = maxFillByBalance.value
  const maxUsable = maxOrder < maxBal ? maxOrder : maxBal
  if (maxUsable <= 0n) return
  const useAmount = pct === 100 ? maxUsable : (maxUsable * BigInt(pct)) / 100n
  const dec = Math.min(sellDecimals.value, 6)
  fillAmount.value = bigIntToDecimal(useAmount, sellDecimals.value, dec)
}

const initSymbol = computed(() => store.tokens.find(t => t.address === trade.value?.token_init_identifier)?.symbol ?? '???')
const sellSymbol = computed(() => store.tokens.find(t => t.address === trade.value?.token_sell_identifier)?.symbol ?? '???')
const initDecimals = computed(() => Number(store.tokens.find(t => t.address === trade.value?.token_init_identifier)?.decimals ?? 8))
const sellDecimals = computed(() => Number(store.tokens.find(t => t.address === trade.value?.token_sell_identifier)?.decimals ?? 8))

const tradePrice = computed(() => {
  if (!trade.value) return '—'
  const raw = orderPrice(trade.value.amount_sell, trade.value.amount_init, sellDecimals.value, initDecimals.value)
  const isBuy = BASE_TOKEN_IDS.has(trade.value.token_init_identifier) && !BASE_TOKEN_IDS.has(trade.value.token_sell_identifier)
  return (isBuy && raw > 0 ? 1 / raw : raw).toFixed(6)
})

const fillPct = computed(() => {
  if (!trade.value) return 0
  return fillPercentage(trade.value.filledInit ?? 0n, trade.value.amount_init).toFixed(0)
})

const expectedReceive = computed(() => {
  if (!trade.value || !fillAmount.value) return ''
  const fa = parseFloat(fillAmount.value)
  if (!fa || fa <= 0) return ''
  // Filler sends fa units of token_sell (human-readable)
  // Receives: fa_raw * amount_init / amount_sell (in init-token raw units)
  const faRaw = BigInt(Math.round(fa * 10 ** sellDecimals.value))
  if (trade.value.amount_sell === 0n) return ''
  const receiveRaw = faRaw * trade.value.amount_init / trade.value.amount_sell
  const receiveHuman = Number(receiveRaw) / 10 ** initDecimals.value
  return receiveHuman.toFixed(Math.min(initDecimals.value, 6))
})

const insufficientBalance = computed(() => {
  if (!trade.value || fillBalance.value <= 0n) return true
  const fa = parseFloat(fillAmount.value)
  if (!fa || fa <= 0) return false // no amount entered yet, don't show as insufficient
  const rawAmount = BigInt(Math.round(fa * 10 ** sellDecimals.value))
  const fee = sellTokenInfo.value?.transfer_fee ?? 0n
  const tradingFee = (rawAmount * store.tradingFeeBps) / 10000n
  return fillBalance.value < rawAmount + fee + tradingFee
})

const canFill = computed(() => {
  if (!trade.value || !store.isAuthenticated) return false
  if (fillPhase.value !== 'idle') return false
  const fa = parseFloat(fillAmount.value)
  if (!fa || fa <= 0) return false
  if (insufficientBalance.value) return false
  return true
})

function formatAmount(amount: bigint, decimals: number): string {
  return (Number(amount) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

async function fillOrder() {
  if (!trade.value) return
  fillError.value = ''
  const fa = parseFloat(fillAmount.value)
  const rawAmount = BigInt(Math.round(fa * 10 ** sellDecimals.value))

  const sellTokenInfo = store.tokens.find(t => t.address === trade.value!.token_sell_identifier)
  if (!sellTokenInfo) { fillError.value = 'Token not found'; return }

  try {
    fillPhase.value = 'depositing'
    const blockNumber = await depositToken(
      trade.value.token_sell_identifier,
      sellTokenInfo.asset_type as any,
      rawAmount,
      store.tradingFeeBps,
      BigInt(sellTokenInfo.transfer_fee),
      store.treasuryAccountId,
      store.treasuryPrincipal,
    )

    fillPhase.value = 'filling'
    const result = await store.finishSell(blockNumber, accessCode.value, rawAmount)

    if ('Ok' in result) {
      fillPhase.value = 'success'
      toast.success('Order Filled')
    } else {
      const { classifyExchangeError } = await import('../utils/errors')
      const classified = classifyExchangeError(result.Err)
      fillError.value = classified.message
      fillPhase.value = 'idle'
      toast.error('Fill Failed', classified.message)
    }
  } catch (err: any) {
    fillError.value = err.message || 'Fill failed'
    fillPhase.value = 'idle'
    toast.error('Fill Failed', fillError.value)
  }
}

// ── Create Mode ──
const visibility = ref<'private' | 'excluded'>('private')
const offerToken = ref('')
const offerAmount = ref('')
const wantToken = ref('')
const wantAmount = ref('')
const allOrNothing = ref(false)
const strictlyOTC = ref(false)

// DAO matching is only possible when ALL THREE of these are false. Live-derived
// from the form state so the indicator pill reacts to every toggle.
const daoAccessible = computed(() =>
  visibility.value !== 'excluded' && !allOrNothing.value && !strictlyOTC.value
)
const daoBlockers = computed<string[]>(() => {
  const out: string[] = []
  if (visibility.value === 'excluded') out.push('DAO-Excluded visibility')
  if (allOrNothing.value) out.push('All-or-Nothing')
  if (strictlyOTC.value) out.push('OTC-Only')
  return out
})
const createPhase = ref<'idle' | 'depositing' | 'creating' | 'done'>('idle')
const createError = ref('')
const createdCode = ref('')
const copiedCode = ref(false)
const copiedLink = ref(false)

const shareLink = computed(() => `${window.location.origin}${router.resolve(`/otc/${createdCode.value}`).href}`)

// ── Access Code Lookup + Cache ──
const lookupCode = ref('')
const lookingUp = ref(false)
const lookupError = ref('')

interface CachedCode {
  code: string
  addedAt: number
  tokenSend: string
  tokenReceive: string
  amountSend: string
  amountReceive: string
  fillPct: number
  status: 'active' | 'unknown'
}

const savedCodes = ref<CachedCode[]>([])
const CACHE_KEY = 'taco_otc_saved_codes'
const MAX_CACHED = 50
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function loadCache(): CachedCode[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') }
  catch { return [] }
}

function saveCache(codes: CachedCode[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(codes.slice(0, MAX_CACHED)))
}

function addToCache(code: string, trade: TradePosition) {
  const cached = loadCache()
  if (cached.some(c => c.code === code)) return
  cached.unshift({
    code,
    addedAt: Date.now(),
    tokenSend: trade.token_sell_identifier,
    tokenReceive: trade.token_init_identifier,
    amountSend: trade.amount_sell.toString(),
    amountReceive: trade.amount_init.toString(),
    fillPct: Number(trade.filledInit * 100n / (trade.filledInit + trade.amount_init)),
    status: 'active',
  })
  saveCache(cached)
  savedCodes.value = cached
}

function removeFromCache(code: string) {
  const filtered = loadCache().filter(c => c.code !== code)
  saveCache(filtered)
  savedCodes.value = filtered
}

async function lookupTrade() {
  const code = lookupCode.value.trim()
  if (code.length < 10) {
    lookupError.value = 'Access code is too short'
    return
  }
  lookingUp.value = true
  lookupError.value = ''
  try {
    console.log('[OTC] Lookup code:', code)
    const result = await store.getPrivateTrade(code)
    console.log('[OTC] Lookup result:', result)
    const t = Array.isArray(result) ? result[0] ?? null : (result as any)
    if (!t || Number(t.trade_number) === 0) {
      lookupError.value = 'Trade not found. It may have been filled instantly or cancelled.'
      return
    }
    if (Number(t.trade_done) > 0) {
      lookupError.value = 'This trade has already been completed'
      return
    }
    addToCache(code, t)
    lookupCode.value = ''
    router.push(`/otc/${code}`)
  } catch (err: any) {
    lookupError.value = err.message || 'Failed to look up trade'
  } finally {
    lookingUp.value = false
  }
}

async function verifyCachedCodes() {
  const cached = loadCache()
  if (!cached.length) return

  const now = Date.now()
  const checks = await Promise.allSettled(
    cached.map(c => store.getPrivateTrade(c.code))
  )

  const stillValid: CachedCode[] = []
  for (let i = 0; i < cached.length; i++) {
    if (now - cached[i].addedAt > MAX_AGE_MS) continue
    const r = checks[i]
    if (r.status !== 'fulfilled') {
      stillValid.push({ ...cached[i], status: 'unknown' })
      continue
    }
    const t = Array.isArray(r.value) ? r.value[0] ?? null : (r.value as any)
    if (!t || Number(t.trade_done) > 0) continue
    stillValid.push({
      ...cached[i],
      tokenSend: t.token_sell_identifier,
      tokenReceive: t.token_init_identifier,
      amountSend: t.amount_sell.toString(),
      amountReceive: t.amount_init.toString(),
      fillPct: Number(t.filledInit * 100n / (t.filledInit + t.amount_init)),
      status: 'active',
    })
  }
  saveCache(stillValid)
  savedCodes.value = stillValid
}

const canCreate = computed(() => {
  if (!store.isAuthenticated || createPhase.value !== 'idle') return false
  return offerToken.value && wantToken.value && parseFloat(offerAmount.value) > 0 && parseFloat(wantAmount.value) > 0
})

async function createOrder() {
  createError.value = ''
  const offerInfo = store.tokens.find(t => t.address === offerToken.value)
  if (!offerInfo) { createError.value = 'Token not found'; return }

  const offerDec = Number(offerInfo.decimals)
  const wantDec = Number(store.tokens.find(t => t.address === wantToken.value)?.decimals ?? 8)
  const rawOffer = BigInt(Math.round(parseFloat(offerAmount.value) * 10 ** offerDec))
  const rawWant = BigInt(Math.round(parseFloat(wantAmount.value) * 10 ** wantDec))

  try {
    createPhase.value = 'depositing'
    const blockNumber = await depositToken(
      offerToken.value,
      offerInfo.asset_type as any,
      rawOffer,
      store.tradingFeeBps,
      BigInt(offerInfo.transfer_fee),
      store.treasuryAccountId,
      store.treasuryPrincipal,
    )

    createPhase.value = 'creating'
    const result = await store.addPosition(
      blockNumber,
      rawWant,
      rawOffer,
      wantToken.value,
      offerToken.value,
      false,
      visibility.value === 'excluded',
      [],
      '',
      allOrNothing.value,
      strictlyOTC.value,
    )

    if ('Ok' in result) {
      createdCode.value = result.Ok.accessCode
      createPhase.value = 'done'
      toast.success('Order Created')
    } else {
      const { classifyExchangeError } = await import('../utils/errors')
      const classified = classifyExchangeError(result.Err)
      createError.value = classified.message
      createPhase.value = 'idle'
      toast.error('Create Failed', classified.message)
    }
  } catch (err: any) {
    createError.value = err.message || 'Creation failed'
    createPhase.value = 'idle'
    toast.error('Create Failed', createError.value)
  }
}

function copyCode() {
  navigator.clipboard.writeText(createdCode.value).catch(() => {})
  copiedCode.value = true
  setTimeout(() => { copiedCode.value = false }, 2000)
  toast.info('Code Copied')
}

function copyLink() {
  navigator.clipboard.writeText(shareLink.value).catch(() => {})
  copiedLink.value = true
  setTimeout(() => { copiedLink.value = false }, 2000)
}

function onlyNumbers(e: KeyboardEvent) {
  if (e.key !== '.' && (e.key < '0' || e.key > '9')) e.preventDefault()
}

async function loadTrade(code: string) {
  loadingTrade.value = true
  trade.value = null
  try {
    const result = await store.getPrivateTrade(code)
    const t = Array.isArray(result) ? result[0] ?? null : result as any
    let found = (t && Number(t.trade_number) > 0) ? t : null

    // Retry once after 2s if not found (replica may be behind)
    if (!found) {
      await new Promise(r => setTimeout(r, 2000))
      const retry = await store.getPrivateTrade(code)
      const t2 = Array.isArray(retry) ? retry[0] ?? null : retry as any
      found = (t2 && Number(t2.trade_number) > 0) ? t2 : null
    }

    trade.value = found
    if (found && Number(found.trade_done) === 0) {
      addToCache(code, found)
      loadFillBalance()
      // Auto-fill amount for all-or-nothing trades
      if (found.allOrNothing) {
        fillAmount.value = (Number(found.amount_sell) / 10 ** sellDecimals.value).toFixed(Math.min(sellDecimals.value, 6))
      }
    }
  } catch { trade.value = null }
  finally { loadingTrade.value = false }
}

// Watch for route changes (Vue Router reuses component when navigating /otc → /otc/:code)
watch(accessCode, (code) => {
  if (code) {
    loadTrade(code.trim())
  } else {
    trade.value = null
    loadMyPrivateOrders()
    verifyCachedCodes()
  }
})

onMounted(() => {
  if (accessCode.value) {
    loadTrade(accessCode.value.trim())
  } else {
    loadMyPrivateOrders()
    verifyCachedCodes()
  }
})
</script>

<style scoped lang="scss">
.otc-view {
  min-height: 100vh;
  background: var(--tx-bg);
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 60px;
  overflow-y: auto;

  &__shell {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__main {
    flex: 1 0 auto;
    // OTC content body is narrower than the nav for readability.
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
  }

  &__my-orders {
    margin-bottom: var(--space-4);
  }

  &__section-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-3);
  }

  &__order-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  &__order-card {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: var(--space-3);
  }

  &__order-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  &__order-card-pair {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  &__order-card-age {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__order-card-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
  }

  &__order-card-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__order-card-actions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__empty {
    padding: var(--space-4);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  &__heading {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4);
  }

  &__loading, &__not-found { padding: var(--space-8); text-align: center; color: var(--text-tertiary); }

  &__trade-card {
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__trade-badge {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--accent-primary);
  }

  &__trade-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__aon-notice {
    font-size: var(--text-xs);
    color: var(--color-warning);
    background: rgba(196, 90, 10, 0.1);
    padding: var(--space-2);
    border-radius: 4px;
  }

  &__fill-form { display: flex; flex-direction: column; gap: var(--space-2); }

  &__pct-row { display: flex; flex-direction: column; gap: 4px; }

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
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--accent-primary);
      cursor: pointer;
    }
    &::-moz-range-thumb {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--accent-primary);
      border: none;
      cursor: pointer;
    }
  }

  &__pct-btns { display: flex; gap: 4px; }

  &__label { font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; }
  &__expected { font-size: var(--text-sm); color: var(--text-secondary); }
  &__fill-btn, &__submit { width: 100%; padding: var(--space-3); margin-top: var(--space-2); }

  &__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); }

  &__visibility { display: flex; flex-direction: column; gap: var(--space-2); }
  &__radio, &__checkbox {
    display: flex; align-items: center; gap: var(--space-2);
    font-size: var(--text-sm); color: var(--text-secondary); cursor: pointer;
    input { accent-color: var(--accent-primary); }
  }

  &__advanced {
    border: 1px solid var(--border-primary); border-radius: 6px; padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-3);
    summary { font-size: var(--text-sm); color: var(--text-secondary); cursor: pointer; }
  }

  &__dao-pill {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    font-size: var(--text-sm);
    line-height: 1.4;
    margin-bottom: var(--space-3);

    &--ok {
      background: rgba(40, 167, 69, 0.08);
      border: 1px solid rgba(40, 167, 69, 0.3);
      color: var(--color-buy);
    }
    &--warn {
      background: rgba(216, 138, 63, 0.08);
      border: 1px solid rgba(216, 138, 63, 0.3);
      color: var(--color-warning, #d88a3f);
    }
  }
  &__dao-pill-icon {
    font-weight: var(--weight-bold);
    font-size: var(--text-base);
    flex-shrink: 0;
  }
  &__dao-pill-text { flex: 1; }

  &__success-centered { text-align: center; }

  &__created {
    background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 8px; padding: var(--space-3); margin-bottom: var(--space-3);
    display: flex; flex-direction: column; gap: var(--space-2);
  }
  &__created-title { font-weight: var(--weight-semibold); color: var(--color-buy); }
  &__code-row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); word-break: break-all; }
  &__link { color: var(--text-tertiary); font-size: var(--text-xs); word-break: break-all; }

  &__result-close {
    position: absolute;
    top: 6px;
    right: 8px;
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 2px;
    &:hover { color: var(--text-primary); }
  }

  &__lookup {
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 1px solid var(--card-border);
    border-radius: 8px;
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }

  &__lookup-input {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  &__saved {
    margin-top: var(--space-4);

    h4 {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 var(--space-2);
    }
  }
}

.text-buy { color: var(--color-buy); font-weight: var(--weight-semibold); }
.text-sell { color: var(--color-sell); font-weight: var(--weight-semibold); }
</style>
