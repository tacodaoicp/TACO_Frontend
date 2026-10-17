<template>
  <div class="crossdex-card">
    <!-- Header -->
    <div class="crossdex-card__header">
      <div class="crossdex-card__titlebox">
        <slot name="title"><h2 class="crossdex-card__title">CrossDEX</h2></slot>
        <p class="crossdex-card__subtitle">Best mix across ICPSwap + TACO + Neutrinite</p>
      </div>
      <button
        class="crossdex-card__settings-btn"
        :class="{ 'crossdex-card__settings-btn--active': showSettings }"
        @click="showSettings = !showSettings"
        aria-label="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M7.5 3h3M9 3v3M3 7.5v3M3 9h3M7.5 15h3M9 12v3M15 7.5v3M12 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div v-if="showSettings" class="ex-field">
      <SlippageSelector v-model="cx.slippage.value" />
    </div>

    <!-- From -->
    <div class="ex-field crossdex-card__field">
      <div class="crossdex-card__field-header">
        <span class="crossdex-card__field-label">From</span>
        <span v-if="cx.tokenFrom.value" class="crossdex-card__balance">
          Balance: <span class="num">{{ fromBalanceDisplay }}</span>
        </span>
      </div>
      <div class="crossdex-card__field-row">
        <button class="crossdex-card__token-btn" @click="openTokenSelector('from')">
          <img v-if="fromIcon" :src="fromIcon" class="crossdex-card__token-img" width="20" height="20" />
          <span v-else-if="cx.tokenFrom.value" class="crossdex-card__token-icon">{{ cx.tokenFrom.value.symbol.charAt(0) }}</span>
          <span>{{ cx.tokenFrom.value?.symbol ?? 'Select' }}</span>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <input
          class="crossdex-card__amount-input num"
          type="text" inputmode="decimal" placeholder="0.00"
          v-model="cx.amountIn.value"
          :disabled="isProcessing"
        />
      </div>
      <div v-if="cx.fromBalance.value > 0n && cx.tokenFrom.value" class="crossdex-card__pct-row">
        <button v-for="p in [25, 50, 75, 100]" :key="p" class="ex-pct-btn" @click="setPercentage(p)">{{ p }}%</button>
      </div>
    </div>

    <!-- Flip -->
    <div class="crossdex-card__flip-wrap">
      <button class="crossdex-card__flip-btn" @click="flip" :disabled="isProcessing" aria-label="Swap direction">
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M5 7l4-4 4 4M5 11l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <!-- To -->
    <div class="ex-field crossdex-card__field">
      <div class="crossdex-card__field-header"><span class="crossdex-card__field-label">To</span></div>
      <div class="crossdex-card__field-row">
        <button class="crossdex-card__token-btn" @click="openTokenSelector('to')">
          <img v-if="toIcon" :src="toIcon" class="crossdex-card__token-img" width="20" height="20" />
          <span v-else-if="cx.tokenTo.value" class="crossdex-card__token-icon">{{ cx.tokenTo.value.symbol.charAt(0) }}</span>
          <span>{{ cx.tokenTo.value?.symbol ?? 'Select' }}</span>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="crossdex-card__output num">
          <div v-if="cx.phase.value === 'quoting'" class="ex-skeleton" style="width:120px;height:28px"></div>
          <template v-else-if="cx.plan.value">{{ outputDisplay }}</template>
          <span v-else class="crossdex-card__output-ph">0.00</span>
        </div>
      </div>
    </div>

    <!-- Plan details -->
    <div v-if="cx.plan.value && cx.phase.value === 'ready'" class="crossdex-card__info">
      <div v-if="cx.plan.value.kind === 'split'" class="crossdex-card__split">
        <span class="ex-badge ex-badge--sm ex-badge--success">Split</span>
        <span class="crossdex-card__split-detail">{{ splitSummary }}</span>
        <span v-if="cx.refining.value" class="crossdex-card__refining">
          <span class="crossdex-card__spinner"></span> finding precise split…
        </span>
      </div>
      <div v-else class="crossdex-card__info-row">
        <span>Route</span>
        <span class="num">100% via {{ dexLabel(cx.plan.value.legs[0].dex) }}</span>
      </div>
      <div v-for="(leg, idx) in cx.plan.value.legs" :key="idx" class="crossdex-card__leg-row">
        <span class="crossdex-card__leg-dex" :class="dexClass(leg.dex)">
          {{ dexLabel(leg.dex) }}
        </span>
        <span class="crossdex-card__leg-pct num">{{ leg.pctBP / 100 }}%</span>
        <span class="crossdex-card__leg-out num">
          ≈ {{ formatTokenAmount(leg.expectedOut, Number(cx.tokenTo.value?.decimals ?? 8), cx.tokenTo.value?.symbol ?? '') }}
        </span>
      </div>
    </div>

    <!-- Quote error (no route / pool lookup failed / pair unsupported) -->
    <div v-if="cx.quoteError.value && cx.phase.value === 'idle'" class="crossdex-card__quote-err">
      {{ cx.quoteError.value }}
    </div>

    <!-- Action button -->
    <button
      v-if="!['executing', 'success', 'partial', 'error'].includes(cx.phase.value)"
      class="ex-btn ex-btn--primary ex-btn--lg crossdex-card__btn"
      :disabled="!canClick"
      @click="onClick"
    >
      <template v-if="!store.isAuthenticated">Connect Wallet</template>
      <template v-else-if="!cx.tokenFrom.value || !cx.tokenTo.value">Select tokens</template>
      <template v-else-if="!cx.amountIn.value">Enter amount</template>
      <template v-else-if="cx.phase.value === 'quoting'">Finding best mix…</template>
      <template v-else-if="cx.plan.value && cx.plan.value.totalExpectedOut === 0n">No route available</template>
      <template v-else-if="cx.canSwap.value">Swap {{ cx.tokenFrom.value?.symbol }} → {{ cx.tokenTo.value?.symbol }}</template>
      <template v-else>Swap</template>
    </button>

    <!-- Token selector -->
    <TokenSelector
      :visible="tokenSelectorOpen"
      :disabledAddress="tokenSelectorDisabled"
      :selectedAddress="tokenSelectorSelected"
      @select="onTokenSelected"
      @close="tokenSelectorOpen = false"
    />

    <!-- Confirm -->
    <div v-if="cx.phase.value === 'confirming'" class="crossdex-card__confirm-overlay" @click.self="cx.cancelConfirm()">
      <div class="crossdex-card__confirm">
        <h3>Confirm CrossDEX swap</h3>
        <div class="crossdex-card__confirm-row">
          <span>You pay</span>
          <span class="num">{{ cx.amountIn.value }} {{ cx.tokenFrom.value?.symbol }}</span>
        </div>
        <div class="crossdex-card__confirm-row">
          <span>You receive (est.)</span>
          <span class="num">{{ outputDisplay }}</span>
        </div>
        <div class="crossdex-card__confirm-row">
          <span>Routing</span>
          <span class="num">{{ cx.plan.value?.kind === 'split' ? splitSummary : ('100% ' + dexLabel(cx.plan.value?.legs[0].dex ?? 'taco')) }}</span>
        </div>
        <p v-if="cx.neuFirst.value" class="crossdex-card__confirm-note">
          Neutrinite goes first. The other routes start as soon as it confirms your deposit, usually within seconds, so the swaps land close together. If one fails, its funds are refunded automatically, and the others still complete.
        </p>
        <p v-else class="crossdex-card__confirm-note">
          All routes run in parallel. If one fails, its funds are refunded automatically, and the others still complete.
        </p>
        <div class="crossdex-card__confirm-actions">
          <button class="ex-btn ex-btn--ghost" @click="cx.cancelConfirm()">Cancel</button>
          <button class="ex-btn ex-btn--primary" @click="cx.execute()">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Parallel-process execution modal -->
    <div v-if="executionVisible" class="crossdex-card__exec-overlay">
      <div class="crossdex-card__exec">
        <div class="crossdex-card__exec-head">
          <h3>CrossDEX Swap</h3>
          <span class="crossdex-card__exec-status" :class="`is-${verdictCls}`">{{ execStatusLabel }}</span>
        </div>
        <p class="crossdex-card__exec-sub">
          {{ legViews.length }} route{{ legViews.length === 1 ? '' : 's' }}{{ routesNote }} · {{ cx.tokenFrom.value?.symbol }} → {{ cx.tokenTo.value?.symbol }}
        </p>

        <!-- one card per leg, live -->
        <div class="crossdex-card__exec-legs">
          <div v-for="lv in legViews" :key="lv.dex" class="crossdex-card__exec-leg" :class="`is-${lv.status}`">
            <div class="crossdex-card__exec-leg-head">
              <span class="crossdex-card__leg-dex" :class="dexClass(lv.dex)">{{ lv.label }}</span>
              <span class="crossdex-card__leg-pct num">{{ lv.pct }}%</span>
              <span class="crossdex-card__exec-leg-icon">
                <span v-if="lv.status === 'running'" class="crossdex-card__spinner"></span>
                <span v-else-if="lv.status === 'success'" class="crossdex-card__check">✓</span>
                <!-- it may already be settled in the wallet: a warning, not a failure -->
                <span v-else-if="lv.status === 'unsure'" class="crossdex-card__warn" role="img" :aria-label="unsureAria(lv.outcome)">!</span>
                <!-- nothing left the wallet for this route: not sent, as Sell many draws it -->
                <span v-else-if="lv.status === 'skipped'" class="crossdex-card__skip" role="img" aria-label="Not sent, stayed in your wallet">○</span>
                <span v-else-if="lv.status === 'refunded'" class="crossdex-card__ref" role="img" aria-label="Refunded to your wallet">↩</span>
                <span v-else class="crossdex-card__cross">✕</span>
              </span>
            </div>
            <div class="crossdex-card__exec-leg-amt num">
              {{ formatFrom(lv.amountIn) }}
              <span class="crossdex-card__exec-arrow">→</span>
              <!-- sold, but the answer with the amount was lost: the wallet shows it -->
              <template v-if="lv.outcome && lv.outcome.success && lv.outcome.state === 'doneUnknown'">sold, see your wallet</template>
              <template v-else-if="lv.outcome && lv.outcome.success">{{ formatTo(lv.outcome.amountOut) }}</template>
              <template v-else>≈ {{ formatTo(lv.expectedOut) }}</template>
            </div>
            <div v-if="lv.status === 'running'" class="crossdex-card__exec-leg-step">
              {{ lv.step || 'Starting…' }}
            </div>
            <div v-else-if="lv.status !== 'success'" class="crossdex-card__exec-leg-err">
              <!-- only a real failure shows the DEX's raw error: a route that may already be settled in the wallet
                   (a raw "Failed to fetch" would read as a hard failure), one that was not sent and one that came
                   back say what happened in the note -->
              <div v-if="lv.status === 'failed'" class="crossdex-card__exec-err-msg">{{ lv.outcome?.error || 'Failed' }}</div>
              <div class="crossdex-card__exec-err-note" :class="`is-${lv.status}`">{{ routeNote(lv) }}</div>
            </div>
          </div>
        </div>

        <!-- aggregate result -->
        <div v-if="cx.phase.value !== 'executing'" class="crossdex-card__exec-summary" :class="`is-${verdictCls}`">
          {{ summaryLine }}
        </div>

        <div class="crossdex-card__exec-actions">
          <router-link
            v-if="['partial', 'error'].includes(cx.phase.value)"
            to="/recover"
            class="ex-btn ex-btn--ghost"
            @click="cx.reset()"
          >Recover page</router-link>
          <button
            v-if="cx.phase.value !== 'executing'"
            class="ex-btn ex-btn--primary"
            @click="cx.reset()"
          >New swap</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ICP_LEDGER_ID, FEE_HEADROOM_LEDGERS } from '../../constants/tokens'
import { crossDexMax } from '../../utils/crossDexCosts'
import { useCrossDexSwap, type LegOutcome } from '../../composables/useCrossDexSwap'
import { useExchangeStore } from '../../store/exchange.store'
import { useExchangeAuth } from '../../composables/useExchangeAuth'
import { formatTokenAmount } from '../../utils/format'
import { CHECK_WALLET, NOT_IN_WALLET, swapMaybeSentSummary, unsureKind, unsureKinds, maybeSentLeg } from './multiSellCopy'
import { isHeldReason } from '../../utils/crossDexLegRunner'
import { getTokenIcon } from '../../utils/token-icons'
import TokenSelector from './TokenSelector.vue'
import SlippageSelector from '../shared/SlippageSelector.vue'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const store = useExchangeStore()
const auth = useExchangeAuth()
const cx = useCrossDexSwap()

function dexLabel(dex: string): string {
  return dex === 'icpswap' ? 'ICPSwap' : dex === 'neutrinite' ? 'Neutrinite' : 'TACO'
}
function dexClass(dex: string): string {
  return dex === 'icpswap' ? 'is-icp' : dex === 'neutrinite' ? 'is-neu' : 'is-taco'
}

const showSettings = ref(false)
const tokenSelectorOpen = ref(false)
const tokenSelectorField = ref<'from' | 'to'>('from')

// Only lock inputs while a swap is actually executing. Quoting must NOT lock —
// the user can still flip sides / change tokens and we re-quote the new direction.
const isProcessing = computed(() => cx.phase.value === 'executing')

const fromIcon = computed(() => {
  const t = cx.tokenFrom.value
  return t ? getTokenIcon(t.symbol, t.name, t.address) : null
})
const toIcon = computed(() => {
  const t = cx.tokenTo.value
  return t ? getTokenIcon(t.symbol, t.name, t.address) : null
})

const fromBalanceDisplay = computed(() => {
  if (!cx.tokenFrom.value) return '0'
  return formatTokenAmount(cx.fromBalance.value, Number(cx.tokenFrom.value.decimals), cx.tokenFrom.value.symbol)
})

const outputDisplay = computed(() => {
  if (!cx.plan.value || !cx.tokenTo.value) return '0.00'
  return formatTokenAmount(cx.plan.value.totalExpectedOut, Number(cx.tokenTo.value.decimals), cx.tokenTo.value.symbol)
})

const splitSummary = computed(() => {
  const p = cx.plan.value
  if (!p || p.kind !== 'split') return ''
  return p.legs.map(l => `${l.pctBP / 100}% ${dexLabel(l.dex)}`).join(' + ')
})

const tokenSelectorDisabled = computed(() =>
  tokenSelectorField.value === 'from' ? cx.tokenTo.value?.address : cx.tokenFrom.value?.address,
)
const tokenSelectorSelected = computed(() =>
  tokenSelectorField.value === 'from' ? cx.tokenFrom.value?.address : cx.tokenTo.value?.address,
)

const canClick = computed(() => {
  if (!store.isAuthenticated) return true
  return cx.canSwap.value
})

// ── Parallel-process execution modal ──
const executionVisible = computed(() =>
  ['executing', 'success', 'partial', 'error'].includes(cx.phase.value),
)

function formatFrom(amt: bigint): string {
  const t = cx.tokenFrom.value
  return t ? formatTokenAmount(amt, Number(t.decimals), t.symbol) : amt.toString()
}
function formatTo(amt: bigint): string {
  const t = cx.tokenTo.value
  return t ? formatTokenAmount(amt, Number(t.decimals), t.symbol) : amt.toString()
}

/** A route that may already be settled in the wallet, by kind (multiSellCopy unsureKind): the wallet first. */
function maybeSentNote(o: LegOutcome): string {
  const sym = cx.tokenTo.value?.symbol ?? 'output'
  const kind = unsureKind(o)
  const lead = kind === 'back'
    ? `Not swapped, because the amount Neutrinite received did not match this route. Check your wallet first. ${NOT_IN_WALLET}`
    : kind === 'sale'
      ? `This route may not have sold. Check your wallet first. ${NOT_IN_WALLET}`
      : `The swap went through. The ${sym} may already be in your wallet. Check it before using the Recover page.`
  return lead + (o.reason === 'session' ? ' If it is not there, reconnect your wallet first.' : '')
}
function unsureAria(o?: LegOutcome): string {
  const kind = o ? unsureKind(o) : null
  return kind === 'sale' ? 'May not have sold, check your wallet'
    : kind === 'back' ? 'Not swapped, your tokens may already be back in your wallet'
    : 'Sold, the output may already be in your wallet'
}
/** The note under a route that did not sell for sure. */
function routeNote(lv: { status: LegStatus; label: string; outcome?: LegOutcome }): string {
  const o = lv.outcome
  if (!o) return ''
  if (lv.status === 'unsure') return maybeSentNote(o)
  if (lv.status === 'skipped') {
    return isHeldReason(o.reason)
      ? `Your funds for this route stayed in your wallet. ${lv.label} may still hold funds from another swap of yours, and the Recover page can send them back.`
      : 'Your funds for this route stayed in your wallet.'
  }
  if (lv.status === 'refunded') {
    // TACO V2 settles a missed minimum on chain (the classified message says what came back)
    return o.refundedBy === 'exchange' && o.error ? o.error : 'Its funds went back to your wallet, minus network fees.'
  }
  return o.reason === 'session'
    ? 'Your session expired before the funds could be recovered. Reconnect your wallet, then use the Recover page.'
    : 'Funds were not recovered automatically. Use the Recover page to sweep them.'
}

// running, sold, may already be settled in the wallet (unsure), not sent (nothing left the wallet), came back
// (refunded), or failed (the Recover page)
type LegStatus = 'running' | 'success' | 'failed' | 'unsure' | 'skipped' | 'refunded'
const statusOf = (o?: LegOutcome): LegStatus => !o ? 'running'
  : o.success ? 'success'
  : maybeSentLeg(o) ? 'unsure'
  : o.state === 'notSent' ? 'skipped'
  : o.state === 'refunded' ? 'refunded'
  : 'failed'
const legViews = computed(() => {
  const legs = cx.plan.value?.legs ?? []
  return legs.map(leg => {
    const outcome = cx.outcomes.value.find(o => o.dex === leg.dex)
    const status: LegStatus = statusOf(outcome)
    return {
      dex: leg.dex,
      label: dexLabel(leg.dex),
      pct: leg.pctBP / 100,
      amountIn: leg.amountIn,
      expectedOut: leg.expectedOut,
      step: cx.legSteps.value[leg.dex] || '',
      status,
      outcome,
    }
  })
})

// a failed route that may already be settled in the wallet: the verdict says to check the wallet, never that
// everything failed or that only some routes filled
const maybeSent = computed(() => ['partial', 'error'].includes(cx.phase.value) && cx.outcomes.value.some(o => !o.success && maybeSentLeg(o)))
const verdictCls = computed(() => (maybeSent.value ? 'partial' : cx.phase.value))

const execStatusLabel = computed(() => {
  if (maybeSent.value) return CHECK_WALLET
  switch (cx.phase.value) {
    case 'executing': return 'Running'
    case 'success': return 'Complete'
    case 'partial': return 'Partial fill'
    case 'error': return 'Failed'
    default: return ''
  }
})

// the routes run in parallel while the swap runs (Neutrinite first when it is part of a split)
const routesNote = computed(() => (cx.neuFirst.value ? ', Neutrinite first' : legViews.value.length > 1 && cx.phase.value === 'executing' ? ' running in parallel' : ''))

const summaryLine = computed(() => {
  const total = cx.outcomes.value.reduce((s, o) => s + o.amountOut, 0n)
  // a route that sold without its amount (the answer was lost) is in the wallet, not in this total
  const unknown = cx.outcomes.value.some(o => o.success && o.state === 'doneUnknown')
  const totalStr = formatTo(total) + (unknown ? ', plus a route whose amount shows in your wallet' : '')
  if (cx.phase.value === 'success') return `Received ${totalStr}`
  if (maybeSent.value) {
    return swapMaybeSentSummary({
      received: cx.phase.value === 'partial' ? totalStr : undefined,
      sym: cx.tokenTo.value?.symbol ?? 'output',
      routes: legViews.value.length,
      confirmed: cx.outcomes.value.filter(o => o.success).length,
      kinds: unsureKinds(cx.outcomes.value.filter(o => !o.success)),
    })
  }
  if (cx.phase.value === 'partial') return `Partial fill: received ${totalStr}. Check each route's status above. Anything not recovered automatically is on the Recover page.`
  if (cx.phase.value === 'error') return `No route went through. Check each route's status above. Anything not recovered automatically is on the Recover page.`
  return ''
})

function openTokenSelector(field: 'from' | 'to') {
  tokenSelectorField.value = field
  tokenSelectorOpen.value = true
}
function onTokenSelected(token: TokenInfo) {
  if (tokenSelectorField.value === 'from') cx.tokenFrom.value = token
  else cx.tokenTo.value = token
  tokenSelectorOpen.value = false
}

function flip() {
  const t = cx.tokenFrom.value
  cx.tokenFrom.value = cx.tokenTo.value
  cx.tokenTo.value = t
}

async function setPercentage(pct: number) {
  const token = cx.tokenFrom.value
  if (!token || cx.fromBalance.value <= 0n) return
  // Fresh ledger reads so Max never computes from a stale balance or an old fee.
  const [, liveFee] = await Promise.all([
    store.userBalanceQuery(token.address).refresh().catch(() => { /* cached value stands */ }),
    store.fetchLedgerFee(token.address).catch(() => null),
  ])
  if (cx.tokenFrom.value?.address !== token.address || cx.fromBalance.value <= 0n) return
  const fee = liveFee != null && liveFee > token.transfer_fee ? liveFee : token.transfer_fee
  // Worst three venue split: ICPSwap 2 fees, TACO 2 (3 on the V2 approve and
  // pull path), Neutrinite 1, plus the trading fee and the sGLDT/EXE headroom.
  const max = crossDexMax(cx.fromBalance.value, fee, store.tradingFeeBps,
    store.useV2Deposit(token.address), FEE_HEADROOM_LEDGERS.has(token.address))
  const useAmount = pct === 100 ? max : (max * BigInt(pct)) / 100n
  if (useAmount <= 0n) { cx.amountIn.value = ''; return }
  const dec = Number(token.decimals)
  const divisor = 10n ** BigInt(dec)
  const whole = useAmount / divisor
  const frac = (useAmount % divisor).toString().padStart(dec, '0').replace(/0+$/, '')
  cx.amountIn.value = frac ? `${whole}.${frac}` : `${whole}`
}

function onClick() {
  if (!store.isAuthenticated) { auth.connect(); return }
  cx.confirmSwap()
}

// Debounced quote on amount / token change.
let debounce: ReturnType<typeof setTimeout> | null = null
function scheduleQuote() {
  if (debounce) clearTimeout(debounce)
  if (!cx.isAmountValid.value) {
    if (cx.phase.value !== 'executing') { cx.phase.value = 'idle'; cx.plan.value = null }
    return
  }
  cx.phase.value = 'quoting'
  debounce = setTimeout(() => cx.fetchPlan(), 500)
}
watch(() => cx.amountIn.value, scheduleQuote)
watch([() => cx.tokenFrom.value, () => cx.tokenTo.value], () => { if (cx.amountIn.value) scheduleQuote() })

// ?sell=<token> (from the portfolio Trade button): sell that token for ICP, or for TACO when it is ICP.
// Applied once the token list has loaded, then dropped from the URL so later choices are not overwritten.
const route = useRoute()
const router = useRouter()
watch([() => route.query.sell, () => store.tokens.length], ([sell]) => {
  if (typeof sell !== 'string' || !store.tokens.length) return
  const from = store.getTokenByAddress(sell)
  if (!from) return
  const to = sell === ICP_LEDGER_ID
    ? store.tokens.find(t => t.symbol === 'TACO')
    : store.getTokenByAddress(ICP_LEDGER_ID)
  cx.tokenFrom.value = from
  if (to) cx.tokenTo.value = to
  const { sell: _drop, ...rest } = route.query
  router.replace({ query: rest })
}, { immediate: true })

onMounted(() => {
  if (!cx.tokenFrom.value) {
    cx.tokenFrom.value = (store.selectedToken0 ? store.getTokenByAddress(store.selectedToken0) : null) ?? store.tokens[0] ?? null
  }
  if (!cx.tokenTo.value) {
    cx.tokenTo.value = (store.selectedToken1 ? store.getTokenByAddress(store.selectedToken1) : null) ?? store.tokens[1] ?? null
  }
})
</script>

<style scoped lang="scss">
.crossdex-card {
  background: var(--tx-panel-bg);
  border: var(--tx-panel-border);
  border-radius: var(--tx-r-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--tx-shadow-1);

  &__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  // the mode switch keeps its own width on desktop (the same as in Sell many), and fills the row on phones
  &__titlebox { display: flex; flex-direction: column; gap: 4px; min-width: 0; align-items: flex-start; @media (max-width: 600px) { flex: 1; align-items: stretch; } }
  &__title { font-size: var(--text-xl); font-weight: var(--weight-semibold); color: var(--text-primary); margin: 0; }
  &__subtitle { font-size: var(--text-xs); color: var(--text-tertiary); margin: 2px 0 0; }
  &__settings-btn {
    background: none; border: none; color: var(--text-tertiary); cursor: pointer;
    padding: 4px; border-radius: 6px; transition: color 0.15s;
    &:hover, &--active { color: var(--accent-primary); }
  }

  &__field { border-radius: 12px; }
  &__field-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  &__field-label { font-size: var(--text-sm); color: var(--text-secondary); }
  &__balance { font-size: var(--text-xs); color: var(--text-tertiary); }
  &__field-row { display: flex; align-items: center; gap: 8px; }

  &__token-btn {
    display: flex; align-items: center; gap: 4px;
    background: rgba(196, 90, 10, 0.08); border: 1px solid var(--card-border);
    border-radius: 20px; padding: 4px 10px 4px 6px; color: var(--text-primary);
    font-weight: var(--weight-medium); cursor: pointer; flex-shrink: 0; transition: all 0.2s ease;
    &:hover { border-color: var(--accent-primary); background: rgba(196, 90, 10, 0.15); }
  }
  &__token-img { border-radius: 50%; object-fit: cover; }
  &__token-icon {
    width: 22px; height: 22px; border-radius: 50%; background: var(--accent-primary-muted);
    color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-size: 11px;
  }
  &__amount-input {
    flex: 1; min-width: 0; background: none; border: none; outline: none;
    text-align: right; font-size: var(--text-xl); color: var(--text-primary);
  }
  &__output { flex: 1; text-align: right; font-size: var(--text-xl); color: var(--text-primary); }
  &__output-ph { color: var(--text-tertiary); }

  &__pct-row { display: flex; gap: 4px; margin-top: 8px; }

  &__flip-wrap { display: flex; justify-content: center; margin: -4px 0; }
  &__flip-btn {
    background: var(--tx-surface-1); border: 1px solid var(--card-border); color: var(--text-secondary);
    width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
    &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
  }

  &__info { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: var(--tx-surface-1); border-radius: 10px; }
  &__info-row { display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--text-secondary); }
  &__split { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  &__split-detail { font-size: var(--text-sm); color: var(--text-secondary); }
  &__refining { display: inline-flex; align-items: center; gap: 5px; font-size: var(--text-xs); color: var(--text-tertiary); margin-left: auto; }

  &__leg-row, &__progress-row, &__outcome-row { display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); }
  &__leg-dex {
    font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px;
    &.is-icp { background: var(--tx-dex-icpswap-dim); color: var(--tx-dex-icpswap); }
    &.is-taco { background: var(--tx-dex-taco-dim); color: var(--tx-dex-taco); }
    &.is-neu { background: var(--tx-dex-neutrinite-dim); color: var(--tx-dex-neutrinite); }
  }
  &__leg-pct { color: var(--text-secondary); }
  &__leg-out { margin-left: auto; color: var(--text-primary); }

  &__progress { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: var(--tx-surface-1); border-radius: 10px; }
  &__progress-step { display: flex; align-items: center; gap: 6px; margin-left: auto; color: var(--text-secondary); }

  &__outcome {
    display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 10px;
    background: var(--tx-surface-1); border: 1px solid var(--card-border);
    &.is-success { border-color: rgba(60, 180, 90, 0.4); }
    &.is-partial { border-color: rgba(220, 160, 40, 0.4); }
    &.is-error { border-color: rgba(220, 70, 70, 0.4); }
  }
  &__outcome-title { font-weight: 600; color: var(--text-primary); }
  &__ok { margin-left: auto; color: #3cb45a; }
  &__fail { margin-left: auto; color: #d65b5b; }

  &__spinner {
    width: 12px; height: 12px; border: 2px solid var(--card-border); border-top-color: var(--accent-primary);
    border-radius: 50%; display: inline-block; animation: crossdex-spin 0.7s linear infinite;
  }

  &__btn { margin-top: 4px; }

  &__confirm-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  &__confirm {
    background: var(--tx-panel-bg); border: var(--tx-panel-border); border-radius: var(--tx-r-xl);
    padding: 20px; width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 10px;
    h3 { margin: 0 0 4px; font-size: var(--text-lg); color: var(--text-primary); }
  }
  &__confirm-row { display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--text-secondary); }
  &__confirm-note { font-size: var(--text-xs); color: var(--text-tertiary); line-height: 1.4; margin: 4px 0 0; }
  &__confirm-actions { display: flex; gap: 8px; margin-top: 8px; .ex-btn { flex: 1; } }

  // ── quote error banner ──
  &__quote-err {
    padding: 8px 12px; border-radius: 8px; font-size: var(--text-sm); line-height: 1.4;
    color: #d65b5b; background: rgba(220, 70, 70, 0.1); border: 1px solid rgba(220, 70, 70, 0.3);
    word-break: break-word;
  }

  // ── parallel-process execution modal ──
  &__exec-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  &__exec {
    background: var(--tx-panel-bg); border: var(--tx-panel-border); border-radius: var(--tx-r-xl);
    padding: 20px; width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 12px;
    max-height: 88vh; overflow-y: auto; box-shadow: var(--tx-shadow-1);
  }
  &__exec-head { display: flex; align-items: center; justify-content: space-between; }
  &__exec-head h3 { margin: 0; font-size: var(--text-lg); color: var(--text-primary); }
  &__exec-status {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    padding: 3px 8px; border-radius: 999px;
    // theme tokens: each ink keeps at least 4.5:1 on its dim fill in both themes (RUNNING, COMPLETE,
    // CHECK YOUR WALLET, PARTIAL FILL, FAILED)
    &.is-executing { background: var(--tx-orange-dim); color: var(--tx-orange-ink); }
    &.is-success { background: var(--tx-buy-dim); color: var(--tx-buy-ink); }
    &.is-partial { background: var(--tx-warning-dim); color: var(--tx-warning-ink); }
    &.is-error { background: var(--tx-sell-dim); color: var(--tx-sell-ink); }
  }
  &__exec-sub { margin: 0; font-size: var(--text-xs); color: var(--text-tertiary); }

  &__exec-legs { display: flex; flex-direction: column; gap: 10px; }
  &__exec-leg {
    padding: 12px; border-radius: 10px; background: var(--tx-surface-1); border: 1px solid var(--card-border);
    display: flex; flex-direction: column; gap: 6px;
    &.is-success { border-color: color-mix(in srgb, var(--tx-buy) 40%, transparent); }
    &.is-failed { border-color: color-mix(in srgb, var(--tx-sell) 40%, transparent); }
    &.is-unsure { border-color: color-mix(in srgb, var(--tx-warning) 55%, transparent); }
    // not sent (nothing left the wallet) and came back: neither is a failure
    &.is-skipped { border-color: var(--tx-line-2); }
    &.is-refunded { border-color: var(--tx-line-hi); }
  }
  &__exec-leg-head { display: flex; align-items: center; gap: 8px; }
  &__exec-leg-icon { margin-left: auto; display: inline-flex; align-items: center; }
  &__check { color: var(--tx-buy-ink); font-weight: 700; }
  &__cross { color: var(--tx-sell-ink); font-weight: 700; }
  &__skip { color: var(--tx-ink-3); font-weight: 700; }
  &__ref { color: var(--tx-ink-2); font-weight: 700; }
  &__warn {
    width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; line-height: 1; color: var(--tx-warning-ink);
    background: var(--tx-warning-dim); border: 1.5px solid var(--tx-warning-ink);
  }
  &__exec-leg-amt { font-size: var(--text-sm); color: var(--text-primary); }
  &__exec-arrow { color: var(--text-tertiary); margin: 0 4px; }
  &__exec-leg-step { font-size: var(--text-xs); color: var(--text-secondary); }
  &__exec-leg-err { display: flex; flex-direction: column; gap: 3px; }
  &__exec-err-msg {
    font-size: var(--text-xs); color: var(--tx-sell-ink); word-break: break-word; line-height: 1.4;
    background: var(--tx-sell-dim); border-radius: 6px; padding: 6px 8px;
  }
  &__exec-err-note {
    font-size: 11px; color: var(--tx-muted-ink); line-height: 1.4;
    // a note that says what happened or what to do is the only message of its route: the readable size
    &.is-unsure, &.is-skipped, &.is-refunded { font-size: 12px; }
    &.is-unsure { color: var(--tx-warning-ink); }
    &.is-skipped, &.is-refunded { color: var(--tx-ink-2); }
  }

  &__exec-summary {
    font-size: var(--text-sm); padding: 10px 12px; border-radius: 10px; line-height: 1.4;
    &.is-success { background: rgba(60, 180, 90, 0.12); color: var(--text-primary); }
    &.is-partial { background: rgba(220, 160, 40, 0.12); color: var(--text-primary); }
    &.is-error { background: rgba(220, 70, 70, 0.1); color: var(--text-primary); }
  }
  &__exec-actions { display: flex; gap: 8px; .ex-btn { flex: 1; text-align: center; } }
}

@keyframes crossdex-spin { to { transform: rotate(360deg); } }
</style>
