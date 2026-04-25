<template>
  <div class="wallet-tab">
    <div class="wallet-tab__toolbar">
      <label class="wallet-tab__toggle">
        <input type="checkbox" v-model="hideZero" />
        <span>Hide zero balances</span>
      </label>
    </div>

    <div v-if="loading && displayRows.length === 0" class="wallet-tab__loading">Loading balances...</div>

    <div v-else class="ex-table-wrap">
    <table class="ex-table wallet-tab__table">
      <thead>
        <tr>
          <th style="width:200px">Token</th>
          <th style="width:124px">Trend</th>
          <th class="num">24h</th>
          <th class="num">Balance</th>
          <th class="num">USD Value</th>
          <th>Status</th>
          <th style="width:1%;white-space:nowrap">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in displayRows" :key="row.address">
          <td class="wallet-tab__token-cell">
            <img
              v-if="row.icon"
              :src="row.icon"
              :alt="row.symbol"
              class="wallet-tab__icon"
              width="24"
              height="24"
            />
            <span v-else class="wallet-tab__icon-fallback">{{ row.symbol.charAt(0) }}</span>
            <span>
              <span class="wallet-tab__symbol">{{ row.symbol }}</span>
              <span class="wallet-tab__name">{{ row.name }}</span>
            </span>
          </td>
          <td class="wallet-tab__trend">
            <Sparkline
              v-if="hasTrend(row.address)"
              :up="trendUp(row.address)"
              :points="cleanPoints(row.address)"
            />
            <span v-else class="tx-ink-3 wallet-tab__trend-empty">—</span>
          </td>
          <td class="num wallet-tab__chg" :class="chgClass(row.address)">
            {{ chgText(row.address) }}
          </td>
          <td class="num">{{ row.balanceFormatted }}</td>
          <td class="num">{{ row.usdFormatted }}</td>
          <td>
            <span v-if="row.onExchange" class="wallet-tab__badge wallet-tab__badge--active">Trading</span>
            <span v-else class="wallet-tab__badge wallet-tab__badge--inactive">Not Listed</span>
          </td>
          <td>
            <div class="wallet-tab__actions">
              <button
                v-if="row.balance > 0n"
                class="ex-btn ex-btn--sm ex-btn--outline"
                @click="openTransfer(row)"
              >Send</button>
              <button
                v-if="row.onExchange"
                class="ex-btn ex-btn--sm ex-btn--outline"
                @click="$emit('trade', row.address)"
              >Trade</button>
              <button
                v-if="!row.onExchange && isAdmin"
                class="ex-btn ex-btn--sm ex-btn--primary"
                @click="addToExchange(row)"
                :disabled="addingToken"
              >{{ addingToken === row.address ? 'Adding...' : 'Add to Exchange' }}</button>
            </div>
          </td>
        </tr>
        <tr v-if="displayRows.length === 0">
          <td colspan="7" class="wallet-tab__empty">
            {{ hideZero ? 'No tokens with balance.' : 'No tokens found.' }}
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <div v-if="addResult" class="wallet-tab__result" :class="addResult.startsWith('Error') ? 'wallet-tab__result--error' : ''">
      {{ addResult }}
    </div>

    <!-- Transfer Dialog -->
    <TransferDialog
      :visible="showTransfer"
      :token="transferToken"
      @close="showTransfer = false"
      @sent="handleTransferSent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { Actor, HttpAgent } from '@dfinity/agent'
import { useExchangeStore, type TokenTrend7d } from '../../store/exchange.store'
import { getCachedAgent, getCachedIdentity, getNetworkHost } from '../../../shared/auth-cache'
import { getTokenIcon } from '../../utils/token-icons'
import { ADMIN_PRINCIPALS } from '../../../composables/useAdminCheck'
import { idlFactory as daoBackendIDL } from 'declarations/dao_backend/DAO_backend.did.js'
import { getCanisterId } from '../../../constants/canisterIds'
import { useExchangeToast } from '../../composables/useExchangeToast'
import TransferDialog from './TransferDialog.vue'
import Sparkline from '../common/Sparkline.vue'

const props = defineProps<{
  // 7-day trend data per token, keyed by canister address. Optional —
  // if omitted, the Trend/24h columns render placeholders.
  trends?: Map<string, TokenTrend7d>
}>()

const emit = defineEmits<{
  trade: [address: string]
  'total-usd': [total: number]
  'holdings': [holdings: Array<{ address: string; symbol: string; usdValue: number; color: string }>]
}>()

// Backend returns 28 6h samples but carry-forward only fills INTERNAL gaps —
// LEADING gaps (no history before first sample) come back as literal 0.
// Rendering those zeros would pin most of the sparkline to the bottom and
// show a single spike at the end. Trim leading zeros here so the line only
// shows the valid window.
function cleanPoints(addr: string): number[] {
  const t = props.trends?.get(addr)
  if (!t) return []
  let i = 0
  while (i < t.points.length && t.points[i] === 0) i++
  return t.points.slice(i)
}
function hasTrend(addr: string): boolean {
  return cleanPoints(addr).length >= 2
}

// Color the sparkline by the direction of the VISIBLE window (first vs
// last cleanPoint), not by the backend's `changePct7d`. The backend
// currently returns `0.0` for change_pct_7d on any token whose 7d-ago
// sample is a leading-gap zero — which means nearly every token —
// so using it would paint every line green regardless of shape.
function trendUp(addr: string): boolean {
  const pts = cleanPoints(addr)
  if (pts.length < 2) return true
  return pts[pts.length - 1] >= pts[0]
}

function chgText(addr: string): string {
  const t = props.trends?.get(addr)
  if (!t) return '—'
  const pct = t.changePct24h
  if (!isFinite(pct)) return '—'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}
function chgClass(addr: string): string {
  const t = props.trends?.get(addr)
  if (!t || !isFinite(t.changePct24h)) return ''
  return t.changePct24h >= 0 ? 'tx-buy' : 'tx-sell'
}

// Deterministic color per symbol. Known tokens keep their brand color;
// unknowns get a palette-picked hue by symbol hash so the allocation bar
// is stable across reloads.
const TOKEN_COLOR_MAP: Record<string, string> = {
  TACO:   '#f28b3a',
  ICP:    '#29abe2',
  ckBTC:  '#f7931a',
  ckETH:  '#627eea',
  ckUSDC: '#2775ca',
  ckUSDT: '#26a17b',
  NACHOS: '#f5c06b',
  DKP:    '#b25e95',
  SGLDT:  '#b8860b',
  TENDY:  '#8cc63f',
  CLOWN:  '#e94f64',
}
const TOKEN_COLOR_FALLBACK = [
  '#9b59b6', '#3498db', '#1abc9c', '#e67e22',
  '#16a085', '#c0392b', '#d35400', '#8e44ad',
]
function colorForSymbol(symbol: string): string {
  if (TOKEN_COLOR_MAP[symbol]) return TOKEN_COLOR_MAP[symbol]
  let hash = 0
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) | 0
  return TOKEN_COLOR_FALLBACK[Math.abs(hash) % TOKEN_COLOR_FALLBACK.length]
}

const store = useExchangeStore()
const toast = useExchangeToast()

const loading = ref(false)
const hideZero = ref(false)
const balances = ref<Map<string, bigint>>(new Map())
const addingToken = ref<string | false>(false)
const addResult = ref('')
const showTransfer = ref(false)
const transferToken = ref<{
  address: string; symbol: string; name: string;
  decimals: number; balance: bigint; transferFee: bigint;
} | null>(null)

// DAO token details
interface DaoToken {
  address: string
  symbol: string
  name: string
  decimals: number
  transferFee: bigint
  priceInUSD: number
  priceInICP: bigint
  active: boolean
  tokenType: { ICP: null } | { ICRC12: null } | { ICRC3: null }
}
const daoTokens = ref<DaoToken[]>([])

const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(store.principalText))

interface WalletRow {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: bigint
  balanceFormatted: string
  usdValue: number
  usdFormatted: string
  onExchange: boolean
  icon: string | null
  tokenType: { ICP: null } | { ICRC12: null } | { ICRC3: null }
}

const allRows = computed((): WalletRow[] => {
  const exchangeAddresses = new Set(store.tokens.map(t => t.address))

  // Start with exchange tokens
  const rows: WalletRow[] = store.tokens.map(token => {
    const balance = balances.value.get(token.address) ?? 0n
    const decimals = Number(token.decimals)
    const balanceNum = Number(balance) / 10 ** decimals
    // Try to find USD price from DAO data
    const daoToken = daoTokens.value.find(d => d.address === token.address)
    const usdValue = daoToken ? balanceNum * daoToken.priceInUSD : 0

    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals,
      balance,
      balanceFormatted: balanceNum.toLocaleString(undefined, { maximumFractionDigits: Math.min(decimals, 6) }),
      usdValue,
      usdFormatted: usdValue > 0.01 ? `$${usdValue.toFixed(2)}` : usdValue > 0 ? `$${usdValue.toFixed(6)}` : '—',
      onExchange: true,
      icon: getTokenIcon(token.symbol, token.name),
      tokenType: token.asset_type,
    }
  })

  // Add DAO tokens that are NOT on the exchange
  for (const dt of daoTokens.value) {
    if (exchangeAddresses.has(dt.address)) continue
    if (!dt.active) continue

    const balance = balances.value.get(dt.address) ?? 0n
    const balanceNum = Number(balance) / 10 ** dt.decimals
    const usdValue = balanceNum * dt.priceInUSD

    rows.push({
      address: dt.address,
      symbol: dt.symbol,
      name: dt.name,
      decimals: dt.decimals,
      balance,
      balanceFormatted: balanceNum.toLocaleString(undefined, { maximumFractionDigits: Math.min(dt.decimals, 6) }),
      usdValue,
      usdFormatted: usdValue > 0.01 ? `$${usdValue.toFixed(2)}` : usdValue > 0 ? `$${usdValue.toFixed(6)}` : '—',
      onExchange: false,
      icon: getTokenIcon(dt.symbol, dt.name),
      tokenType: dt.tokenType,
    })
  }

  return rows.sort((a, b) => {
    // Exchange tokens first, then by USD value
    if (a.onExchange !== b.onExchange) return a.onExchange ? -1 : 1
    return b.usdValue - a.usdValue || a.symbol.localeCompare(b.symbol)
  })
})

const displayRows = computed(() => {
  if (hideZero.value) return allRows.value.filter(r => r.balance > 0n)
  return allRows.value
})

// Emit total USD net-worth + per-token holdings to parent
// (Portfolio hero + wallet-composition bar listen)
watch(
  () => allRows.value.reduce((s, r) => s + (r.usdValue || 0), 0),
  (total) => emit('total-usd', total),
  { immediate: true },
)
// Emit every token the user actually holds (balance > 0), not only those
// with a USD price. This matters because the backend's 7d-trend query
// receives the FULL address list — tokens it knows return data, unknowns
// return empty points, frontend shows "—" for the latter. If we filter by
// usdValue > 0 here, zero-price (or not-yet-priced) held tokens never get
// a trend query, so the sparkline column stays empty for them even though
// the backend has data.
watch(
  () => allRows.value
    .filter(r => r.balance > 0n)
    .map(r => ({
      address: r.address,
      symbol: r.symbol,
      usdValue: r.usdValue,
      color: colorForSymbol(r.symbol),
    })),
  (holdings) => emit('holdings', holdings),
  { immediate: true, deep: true },
)

// Minimal ICRC1 IDL for balance query
const icrc1BalanceIdl = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
  })
}

async function fetchDaoTokens() {
  try {
    const agent = new HttpAgent({ host: getNetworkHost() })
    const daoActor = Actor.createActor(daoBackendIDL, {
      agent,
      canisterId: getCanisterId('dao_backend'),
    })
    const result = await (daoActor as any).getTokenDetailsWithoutPastPrices()
    if (!result || !Array.isArray(result)) return

    daoTokens.value = result.map((entry: any) => {
      const [principal, details] = entry
      return {
        address: principal.toText ? principal.toText() : String(principal),
        symbol: details.tokenSymbol || '???',
        name: details.tokenName || '',
        decimals: Number(details.tokenDecimals || 8n),
        transferFee: details.tokenTransferFee || 0n,
        priceInUSD: details.priceInUSD || 0,
        priceInICP: details.priceInICP || 0n,
        active: details.Active ?? true,
        tokenType: details.tokenType || { ICRC12: null },
      }
    })
  } catch (err) {
    console.error('Failed to fetch DAO tokens:', err)
  }
}

async function refreshBalances() {
  const agent = await getCachedAgent()
  if (!agent) return

  const identity = await getCachedIdentity()
  if (!identity || identity.getPrincipal().isAnonymous()) return

  const owner = identity.getPrincipal()

  // Collect all unique token addresses
  const allAddresses = new Set<string>()
  for (const t of store.tokens) allAddresses.add(t.address)
  for (const d of daoTokens.value) if (d.active) allAddresses.add(d.address)

  const results = await Promise.all(
    Array.from(allAddresses).map(async address => {
      try {
        const tokenActor = Actor.createActor(icrc1BalanceIdl, { agent, canisterId: address })
        const balance = await tokenActor.icrc1_balance_of({ owner, subaccount: [] })
        return { address, balance: balance as bigint }
      } catch {
        return { address, balance: 0n }
      }
    })
  )

  const newBalances = new Map<string, bigint>()
  for (const r of results) newBalances.set(r.address, r.balance)
  balances.value = newBalances
}

let initialLoadDone = false
async function refreshAll() {
  if (!initialLoadDone) loading.value = true
  try {
    await fetchDaoTokens()
    if (store.isAuthenticated) await refreshBalances()
  } finally {
    loading.value = false
    initialLoadDone = true
  }
}

function openTransfer(row: WalletRow) {
  // Find transfer fee: exchange token has fee in metadata, DAO token has transferFee
  const daoToken = daoTokens.value.find(d => d.address === row.address)
  const exToken = store.tokens.find(t => t.address === row.address)
  const transferFee = daoToken?.transferFee ?? (exToken ? BigInt(exToken.transfer_fee) : 10_000n)

  transferToken.value = {
    address: row.address,
    symbol: row.symbol,
    name: row.name,
    decimals: row.decimals,
    balance: row.balance,
    transferFee,
  }
  showTransfer.value = true
}

function handleTransferSent(info: { address: string; amount: bigint }) {
  toast.success('Transfer Sent', `Sent ${info.amount > 0n ? '' : ''}${transferToken.value?.symbol || 'tokens'} successfully`)
  showTransfer.value = false
  refreshAll()
}

async function addToExchange(row: WalletRow) {
  addingToken.value = row.address
  addResult.value = ''
  try {
    // Map DAO tokenType to exchange format
    const standard = row.tokenType
    // Use a reasonable default minimum (100_000 = 0.001 for 8-decimal tokens)
    const minimumAmount = 100_000n
    const result = await store.addAcceptedToken({ Add: null }, row.address, minimumAmount, standard)
    if ('Ok' in result) {
      addResult.value = `Added ${row.symbol} to exchange: ${result.Ok}`
      toast.success('Token Added', row.symbol + ' added to exchange')
      await store.initExchange()
    } else {
      const { classifyExchangeError } = await import('../../utils/errors')
      const classified = classifyExchangeError(result.Err)
      addResult.value = `Error adding ${row.symbol}: ${classified.message}`
      toast.error('Add Token Failed', classified.message)
    }
  } catch (err: any) {
    addResult.value = `Error adding ${row.symbol}: ${err.message || err}`
    toast.error('Add Token Failed', err.message || String(err))
  } finally {
    addingToken.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(refreshAll, 10000)
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

// Any user-initiated mutation moves balances — refresh immediately instead
// of waiting for the next 10 s poll tick.
let offMutation: (() => void) | null = null

// On a cold F5, tokens + auth often populate AFTER WalletTab's onMounted
// runs. Without these watchers the wallet would sit empty until the next
// 10 s poll tick. Fire the moment either becomes available.
watch(() => store.tokens.length, (n, prev) => {
  if (n > 0 && (prev ?? 0) === 0) refreshAll()
})
watch(() => store.isAuthenticated, (v, prev) => {
  if (v && !prev) refreshAll()
})

onMounted(() => {
  refreshAll()
  startPolling()
  offMutation = store.onMutation(() => { refreshAll() })
})
onUnmounted(() => { stopPolling(); offMutation?.() })
onActivated(() => { refreshAll(); startPolling() })
onDeactivated(() => stopPolling())
</script>

<style scoped lang="scss">
.wallet-tab {
  &__trend {
    width: 124px;
    padding-top: 6px !important;
    padding-bottom: 6px !important;

    svg { display: block; }
  }

  &__trend-empty {
    font-size: 12px;
  }

  &__chg {
    white-space: nowrap;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  &__refresh {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;

    &:hover { color: var(--text-primary); border-color: var(--accent-primary); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;

    input { accent-color: var(--accent-primary); }
  }

  &__table {
    width: 100%;
  }

  &__token-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__icon-fallback {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__symbol {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  &__name {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-left: var(--space-2);
  }

  &__badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;

    &--active {
      background: var(--color-buy-bg);
      color: var(--color-buy);
    }

    &--inactive {
      background: #B89A7820;
      color: var(--text-secondary);
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-1);
    white-space: nowrap;
  }

  &__loading, &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  &__result {
    margin: var(--space-3) var(--space-4);
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    font-size: var(--text-sm);
    font-family: var(--font-mono);
    background: #2EA66A15;
    color: var(--color-buy);

    &--error {
      background: #C4303015;
      color: var(--color-sell);
    }
  }
}
</style>
