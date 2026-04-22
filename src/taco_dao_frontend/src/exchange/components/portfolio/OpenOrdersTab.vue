<template>
  <div class="open-orders-tab">
    <div class="open-orders-tab__toolbar">
      <span class="open-orders-tab__count">{{ filteredOrders.length }} order{{ filteredOrders.length !== 1 ? 's' : '' }}</span>
      <label class="open-orders-tab__filter-toggle">
        <input type="checkbox" v-model="currentPairOnly" />
        <span>This pair only</span>
      </label>
      <button
        v-if="filteredOrders.length > 0"
        class="open-orders-tab__cancel-all"
        @click="showCancelAll = true"
      >Cancel All</button>
    </div>

    <div v-if="loading" class="open-orders-tab__loading">Loading orders...</div>

    <div v-else-if="filteredOrders.length > 0" class="ex-table-wrap">
    <table class="ex-table open-orders-tab__table">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Side</th>
          <th>Type</th>
          <th class="num">Price</th>
          <th class="num">Amount</th>
          <th>Filled</th>
          <th>Age</th>
          <th class="num">Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.accesscode">
          <td>{{ getOrderPair(order) }}</td>
          <td>
            <span :class="getOrderSide(order) === 'Buy' ? 'text-buy' : 'text-sell'">
              {{ getOrderSide(order) }}
            </span>
          </td>
          <td>
            <span class="ex-badge" :class="getTypeBadgeClass(order)">{{ getOrderType(order) }}</span>
          </td>
          <td class="num">{{ getOrderPrice(order) }}</td>
          <td class="num">{{ getOrderAmount(order) }}</td>
          <td>
            <div class="open-orders-tab__fill">
              <div class="open-orders-tab__fill-bar">
                <div
                  class="open-orders-tab__fill-progress"
                  :style="{ width: `${getOrderFill(order)}%` }"
                  :class="fillClass(getOrderFill(order))"
                />
              </div>
              <span class="num">{{ getOrderFill(order).toFixed(0) }}%</span>
            </div>
          </td>
          <td>{{ getOrderAge(order) }}</td>
          <td class="num">{{ getOrderTotal(order) }}</td>
          <td>
            <div class="open-orders-tab__actions">
              <button class="ex-btn ex-btn--sm ex-btn--danger-outline" @click="cancelOrder(order)">
                Cancel
              </button>
              <button
                v-if="!order.accesscode.startsWith('Public')"
                class="ex-btn ex-btn--sm ex-btn--outline"
                @click="shareOrder(order)"
              >{{ sharedOrder === order.accesscode ? 'Copied!' : 'Share' }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <div v-else class="open-orders-tab__empty">
      No open orders.
    </div>

    <!-- Cancel Confirmation Dialog -->
    <Teleport to="body">
      <div v-if="cancelTarget" class="ex-modal-overlay" data-theme="exchange" @click.self="cancelTarget = null">
        <div class="ex-modal">
          <h3 class="ex-modal__title">Cancel Order</h3>
          <p class="ex-modal__text">
            Cancel {{ getOrderPair(cancelTarget) }} {{ getOrderAmount(cancelTarget) }} @ {{ getOrderPrice(cancelTarget) }}?
          </p>
          <p class="ex-modal__text" style="font-size:var(--text-sm);color:var(--text-tertiary)">
            Revoke fee: ~{{ getRevokeFee(cancelTarget) }}<br>
            You receive the remaining amount minus the revoke fee.
          </p>
          <div v-if="cancelError" class="ex-error-box open-orders-tab__error">{{ cancelError }}</div>
          <div class="ex-modal__actions">
            <button class="ex-btn ex-btn--outline" @click="cancelTarget = null">Keep Order</button>
            <button class="ex-btn ex-btn--sell" @click="confirmCancel" :disabled="cancelling">
              {{ cancelling ? 'Cancelling...' : 'Cancel Order' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel All Confirmation -->
    <Teleport to="body">
      <div v-if="showCancelAll" class="ex-modal-overlay" data-theme="exchange" @click.self="showCancelAll = false">
        <div class="ex-modal">
          <h3 class="ex-modal__title">Cancel All Orders</h3>
          <p class="ex-modal__text">
            This will cancel {{ orders.length }} orders. Revoke fees will be deducted from each.
          </p>
          <div v-if="cancelAllProgress" class="open-orders-tab__progress">
            Cancelling {{ cancelAllProgress }}...
          </div>
          <div class="ex-modal__actions">
            <button class="ex-btn ex-btn--outline" @click="showCancelAll = false">Keep All</button>
            <button class="ex-btn ex-btn--sell" @click="confirmCancelAll" :disabled="cancelling">
              {{ cancelling ? 'Cancelling...' : 'Cancel All' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import { useExchangeStore } from '../../store/exchange.store'
import { fillPercentage, orderPrice, calculateRevokeFee } from '../../utils/price-math'
import type { TradePrivate2 } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import { isTransportError, verifyAfterTransportError, type VerifyStatus } from '../../utils/errors'
import { useExchangeToast } from '../../composables/useExchangeToast'

const router = useRouter()
const store = useExchangeStore()
const toast = useExchangeToast()

const orders = ref<TradePrivate2[]>([])
const loading = ref(true)
const currentPairOnly = ref(false)
const cancelTarget = ref<TradePrivate2 | null>(null)
const cancelling = ref(false)
const cancelError = ref('')
const showCancelAll = ref(false)
const cancelAllProgress = ref('')

const filteredOrders = computed(() => {
  if (!currentPairOnly.value) return orders.value
  const t0 = store.selectedToken0
  const t1 = store.selectedToken1
  if (!t0 || !t1) return orders.value
  return orders.value.filter(o =>
    (o.token_init_identifier === t0 && o.token_sell_identifier === t1) ||
    (o.token_init_identifier === t1 && o.token_sell_identifier === t0)
  )
})

function getTokenSymbol(address: string): string {
  return store.tokens.find(t => t.address === address)?.symbol ?? '???'
}

function getTokenDecimals(address: string): number {
  return Number(store.tokens.find(t => t.address === address)?.decimals ?? 8)
}

function getOrderPair(order: TradePrivate2): string {
  const init = order.token_init_identifier
  const sell = order.token_sell_identifier
  // Base tokens (ICP, ckUSDC) always appear second (as quote)
  if (BASE_TOKEN_IDS.has(init) && !BASE_TOKEN_IDS.has(sell)) {
    return `${getTokenSymbol(sell)}/${getTokenSymbol(init)}`
  }
  if (!BASE_TOKEN_IDS.has(init) && BASE_TOKEN_IDS.has(sell)) {
    return `${getTokenSymbol(init)}/${getTokenSymbol(sell)}`
  }
  return `${getTokenSymbol(init)}/${getTokenSymbol(sell)}`
}

const BASE_TOKEN_IDS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai',  // ckUSDC
])

function getOrderSide(order: TradePrivate2): string {
  const initSymbol = store.getTokenByAddress(order.token_init_identifier)?.symbol ?? '?'
  const sellSymbol = store.getTokenByAddress(order.token_sell_identifier)?.symbol ?? '?'
  console.log(`[OpenOrders] token_init=${initSymbol}(${order.token_init_identifier.slice(0,10)}), amount_init=${order.amount_init}, token_sell=${sellSymbol}(${order.token_sell_identifier.slice(0,10)}), amount_sell=${order.amount_sell}`)
  // token_init = token the user deposited (offered)
  // token_sell = token the user wants to receive
  // If user deposited a base token (ICP/ckUSDC) and wants a non-base = Buy
  // If user deposited a non-base and wants a base = Sell
  if (BASE_TOKEN_IDS.has(order.token_init_identifier) && !BASE_TOKEN_IDS.has(order.token_sell_identifier)) {
    return 'Buy'
  }
  if (!BASE_TOKEN_IDS.has(order.token_init_identifier) && BASE_TOKEN_IDS.has(order.token_sell_identifier)) {
    return 'Sell'
  }
  // Both base or both non-base: check convention (first listed is base)
  return order.token_init_identifier < order.token_sell_identifier ? 'Sell' : 'Buy'
}

function getOrderType(order: TradePrivate2): string {
  if (order.accesscode.endsWith('excl')) return 'DAO-Excl'
  const isPublic = order.accesscode.startsWith('Public')
  if (order.allOrNothing) return 'AON'
  if (order.strictlyOTC) return 'OTC'
  if (!isPublic) return 'Private'
  return 'Public'
}

function getTypeBadgeClass(order: TradePrivate2): string {
  const type = getOrderType(order)
  const map: Record<string, string> = {
    'Public': 'ex-badge--info',
    'Private': 'ex-badge--purple',
    'OTC': 'ex-badge--warning',
    'AON': 'ex-badge--warning',
    'DAO-Excl': 'ex-badge--purple',
  }
  return map[type] || ''
}

function getOrderPrice(order: TradePrivate2): string {
  // orderPrice returns amount_sell/amount_init
  // For Buy orders (init=ICP, sell=TACO): this gives TACO/ICP
  // But orderbook shows ICP/TACO, so invert for consistency
  const rawPrice = orderPrice(
    order.amount_sell,
    order.amount_init,
    getTokenDecimals(order.token_sell_identifier),
    getTokenDecimals(order.token_init_identifier),
  )
  const isBuy = BASE_TOKEN_IDS.has(order.token_init_identifier) && !BASE_TOKEN_IDS.has(order.token_sell_identifier)
  const displayPrice = isBuy && rawPrice > 0 ? 1 / rawPrice : rawPrice
  return displayPrice.toFixed(6)
}

function getOrderAmount(order: TradePrivate2): string {
  // Show base token amount: Buy → amount_sell (TACO), Sell → amount_init (TACO)
  const isBuy = BASE_TOKEN_IDS.has(order.token_init_identifier) && !BASE_TOKEN_IDS.has(order.token_sell_identifier)
  const token = isBuy ? order.token_sell_identifier : order.token_init_identifier
  const amount = isBuy ? order.amount_sell : order.amount_init
  const decimals = getTokenDecimals(token)
  return (Number(amount) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function getOrderFill(order: TradePrivate2): number {
  return fillPercentage(order.filledInit, order.amount_init)
}

function fillClass(pct: number): string {
  if (pct < 25) return 'open-orders-tab__fill-progress--low'
  if (pct < 75) return 'open-orders-tab__fill-progress--mid'
  return 'open-orders-tab__fill-progress--high'
}

function getOrderAge(order: TradePrivate2): string {
  const createdMs = Number(order.time) / 1_000_000
  const ageMs = Date.now() - createdMs
  const hours = Math.floor(ageMs / 3_600_000)
  if (hours < 1) return `${Math.floor(ageMs / 60_000)}m`
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function getOrderTotal(order: TradePrivate2): string {
  // Total in quote currency (ICP/ckUSDC)
  const isBuy = BASE_TOKEN_IDS.has(order.token_init_identifier) && !BASE_TOKEN_IDS.has(order.token_sell_identifier)
  const quoteToken = isBuy ? order.token_init_identifier : order.token_sell_identifier
  const quoteAmount = isBuy ? order.amount_init : order.amount_sell
  const decimals = getTokenDecimals(quoteToken)
  return (Number(quoteAmount) / 10 ** decimals).toFixed(4)
}

function getRevokeFee(order: TradePrivate2): string {
  const fee = calculateRevokeFee(order.amount_init, store.tradingFeeBps, store.revokeFeeDivisor)
  const decimals = getTokenDecimals(order.token_init_identifier)
  const symbol = getTokenSymbol(order.token_init_identifier)
  return `${(Number(fee) / 10 ** decimals).toFixed(6)} ${symbol}`
}

function cancelOrder(order: TradePrivate2) {
  cancelTarget.value = order
  cancelError.value = ''
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  cancelError.value = ''
  const accessCode = cancelTarget.value.accesscode

  try {
    const result = await store.revokeTrade(accessCode, { Initiator: null })
    if ('Ok' in result) {
      orders.value = orders.value.filter(o => o.accesscode !== accessCode)
      cancelTarget.value = null
      await store.refreshAfterMutation('revoke')
      toast.success('Order Cancelled')
    } else {
      const { classifyExchangeError } = await import('../../utils/errors')
      const classified = classifyExchangeError(result.Err)
      cancelError.value = classified.message
      toast.error('Cancel Failed', classified.message)
    }
  } catch (err: any) {
    if (isTransportError(err)) {
      const probe = async (): Promise<VerifyStatus> => {
        try {
          const post = await store.getUserTrades()
          const stillOpen = post.some(o => o.accesscode === accessCode)
          return stillOpen ? 'failed' : 'succeeded'
        } catch {
          return 'unknown'
        }
      }
      const status = await verifyAfterTransportError(probe)
      if (status === 'succeeded') {
        orders.value = orders.value.filter(o => o.accesscode !== accessCode)
        cancelTarget.value = null
        await store.refreshAfterMutation('revoke')
        toast.success('Order Cancelled', 'Network hiccup during submit — confirmed via query.')
        return
      }
      if (status === 'failed') {
        cancelError.value = 'Network issue — order is still open. Try again.'
        toast.warning('Network issue', cancelError.value)
        return
      }
      cancelError.value = 'Network issue — refresh to check whether the order was cancelled.'
      toast.warning('Network issue', cancelError.value)
      return
    }
    cancelError.value = err.message || 'Cancel failed'
    toast.error('Cancel Failed', cancelError.value)
  } finally {
    cancelling.value = false
  }
}

async function confirmCancelAll() {
  cancelling.value = true
  const toCancel = [...orders.value]
  const total = toCancel.length
  let completed = 0

  // Cancel in parallel batches of 5 (respects rate limit of 21 calls per 90s)
  const BATCH_SIZE = 5
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = toCancel.slice(i, i + BATCH_SIZE)
    cancelAllProgress.value = `${Math.min(i + BATCH_SIZE, total)}/${total}`

    const results = await Promise.allSettled(
      batch.map(order => store.revokeTrade(order.accesscode, { Initiator: null }))
    )

    // Remove successfully cancelled orders
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        const val = (results[j] as PromiseFulfilledResult<any>).value
        if ('Ok' in val) {
          const idx = orders.value.findIndex(o => o.accesscode === batch[j].accesscode)
          if (idx !== -1) orders.value.splice(idx, 1)
          completed++
        }
      }
    }

    // If any rejected (network error), stop
    if (results.some(r => r.status === 'rejected')) break
  }

  cancelling.value = false
  cancelAllProgress.value = ''
  showCancelAll.value = false
  if (completed > 0) await store.refreshAfterMutation('revoke')
  toast.success('Orders Cancelled', completed + ' of ' + total + ' cancelled')
}

const sharedOrder = ref<string | null>(null)
function shareOrder(order: TradePrivate2) {
  const link = `${window.location.origin}${router.resolve(`/otc/${order.accesscode}`).href}`
  navigator.clipboard.writeText(link).catch(() => {})
  sharedOrder.value = order.accesscode
  setTimeout(() => { sharedOrder.value = null }, 2000)
  toast.info('Link Copied')
}

let initialLoadDone = false
async function loadOrders() {
  if (!initialLoadDone) loading.value = true
  try {
    orders.value = await store.getUserTrades()
  } catch (err) {
    console.error('[OpenOrdersTab] Load error:', err)
  } finally {
    loading.value = false
    initialLoadDone = true
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(loadOrders, 5000)
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}
let offMutation: (() => void) | null = null
onMounted(() => {
  loadOrders()
  startPolling()
  offMutation = store.onMutation(kind => {
    if (kind === 'order' || kind === 'revoke') loadOrders()
  })
})
onUnmounted(() => { stopPolling(); offMutation?.() })
onActivated(() => { loadOrders(); startPolling() })
onDeactivated(() => stopPolling())
</script>

<style scoped lang="scss">
.open-orders-tab {
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  &__count {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__filter-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    cursor: pointer;

    input { accent-color: var(--accent-primary); }
  }

  &__cancel-all {
    background: none;
    border: 1px solid var(--color-sell);
    border-radius: 6px;
    color: var(--color-sell);
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;

    &:hover { background: rgba(217, 64, 64, 0.1); }
  }

  &__table { width: 100%; }

  &__fill {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__fill-bar {
    width: 48px;
    height: 6px;
    background: var(--bg-primary);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill-progress {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;

    &--low { background: var(--color-sell); }
    &--mid { background: var(--color-warning); }
    &--high { background: var(--color-buy); }
  }

  &__actions {
    display: flex;
    gap: var(--space-1);
  }

  &__loading, &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  &__error {
    margin-bottom: var(--space-2);
  }

  &__progress {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    text-align: center;
    padding: var(--space-2);
  }
}

.text-buy { color: var(--color-buy); font-weight: var(--weight-semibold); }
.text-sell { color: var(--color-sell); font-weight: var(--weight-semibold); }
</style>
