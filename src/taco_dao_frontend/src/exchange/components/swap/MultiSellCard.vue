<template>
  <div ref="cardEl" class="ms-card">
    <!-- the same header box as the Single swap card, so the mode switch does not move between modes -->
    <div class="ms-card__head">
      <div class="ms-card__titlebox">
        <slot name="title" />
        <p class="ms-card__sub">Sell several tokens for ICP in one go.</p>
      </div>
      <button
        class="ms-card__gear"
        :class="{ 'is-on': showSettings }"
        aria-label="Settings"
        @click="showSettings = !showSettings"
      >
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M7.5 3h3M9 3v3M3 7.5v3M3 9h3M7.5 15h3M9 12v3M15 7.5v3M12 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div v-if="showSettings" class="ex-field">
      <SlippageSelector v-model="ms.slippage.value" />
    </div>

    <!-- not connected -->
    <div v-if="!store.isAuthenticated" class="ms-empty">
      <div class="ms-empty__b">Connect your wallet to see the tokens you can sell.</div>
    </div>

    <!-- nothing picked -->
    <button v-else-if="ms.basket.value.length === 0" class="ms-empty ms-empty--btn" @click="pickerOpen = true">
      <div class="ms-empty__coins" aria-hidden="true">
        <TokenCoin v-for="t in topHoldings" :key="t.address" :token="t" :size="28" />
      </div>
      <div class="ms-empty__t">Pick the tokens you want to sell</div>
      <div class="ms-empty__b">Up to {{ MAX }} tokens, all sold for ICP in one go.</div>
    </button>

    <template v-else>
      <div class="ms-label">
        <span>You sell</span>
        <small class="num">{{ countText }}{{ basketUsd ? `, ${basketUsd}` : '' }}</small>
      </div>
      <div class="ms-list">
        <MultiSellRow
          v-for="r in ms.rows.value"
          :key="r.item.address"
          :item="r.item"
          :token="r.token"
          :plan="r.plan"
          :issue="r.issue"
          :icp="ms.icp.value"
          :open="openRow === r.item.address"
          :move="moveOf(r.item.address)"
          :wait-sec="ms.waitSec.value"
          :locked="ms.isBusy.value"
          @amount="(v) => ms.setAmount(r.item.address, v)"
          @max="ms.setMax(r.item.address)"
          @remove="ms.removeToken(r.item.address)"
          @toggle="openRow = openRow === r.item.address ? '' : r.item.address"
          @retry="ms.requote(true)"
        />
        <button class="ms-add" :disabled="ms.basket.value.length >= MAX || ms.isBusy.value" @click="pickerOpen = true">
          {{ ms.basket.value.length >= MAX ? `${MAX} tokens is the most per sale` : '+ Add tokens' }}
        </button>
      </div>

      <div class="ms-arrow" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>

      <div class="ms-recv">
        <div class="ms-recv__h">
          <span>You receive</span>
          <span v-if="updating" class="ms-refine"><span class="ms-spin"></span> updating…</span>
          <span v-else-if="ms.refining.value" class="ms-refine"><span class="ms-spin"></span> finding precise split…</span>
        </div>
        <div ref="recvRow" class="ms-recv__row">
          <span class="ms-recv__pill"><TokenCoin :token="ms.icp.value" :size="20" /> ICP</span>
          <span class="ms-recv__total num" :class="{ 'is-stale': updating }">
            <span v-if="ms.quoting.value && !plan" class="ex-skeleton" style="width:120px;height:24px;display:inline-block"></span>
            <template v-else>{{ plan ? fmtIcp(plan.totalReceiveOut) : '0.00' }}</template>
          </span>
        </div>
        <div v-if="receiveUsd" class="ms-recv__usd num" :class="{ 'is-stale': updating }">{{ receiveUsd }}</div>
      </div>

      <div v-if="plan && !ms.quoting.value && ms.ready.value" class="ms-details">
        <div class="ms-drow">
          <span>Price impact</span>
          <b class="num" :class="impactCls">{{ plan.impactPct == null ? '…' : plan.impactPct.toFixed(1) + '%' }}</b>
        </div>
        <div class="ms-drow">
          <span>DEX mix</span>
          <span class="ms-dexmix">
            <span v-for="v in mix" :key="v.dex" class="ms-dex" :class="`ms-dex--${v.dex}`">{{ v.label }} {{ v.pct }}%</span>
          </span>
        </div>
        <div class="ms-drow"><span>Minimum received</span><b class="num">{{ fmtIcp(plan.totalMinReceive) }}</b></div>
        <div v-if="budgetInfo" class="ms-info">{{ budgetInfo }}</div>
        <div v-if="poolNote" class="ms-info"><i aria-hidden="true">i</i><span>{{ poolNote }}</span></div>
      </div>

      <div v-if="ms.extreme.value.length && ms.ready.value" class="ms-box-err">
        <strong>{{ extremeTitle }}</strong> Selling it now costs a large share of its value.
        <label>
          <input type="checkbox" :checked="ms.impactAcknowledged.value" @change="(e) => ms.acknowledgeImpact((e.target as HTMLInputElement).checked)" />
          <span>{{ extremeAck }}</span>
        </label>
      </div>

      <div v-if="ms.quoteError.value" class="ms-box-err">
        {{ ms.quoteError.value }}
        <button class="ms-link" @click="ms.requote(true)">Try again</button>
      </div>
    </template>

    <div ref="barEl" class="ms-card__bar" :class="{ 'is-stuck': barStuck }">
      <!-- the bar's own total only while the one above is out of view -->
      <div v-if="plan && (ms.ready.value || updating) && !recvInView" class="ms-card__bar-total">
        <span>{{ updating ? 'Updating…' : 'You receive' }}</span>
        <b class="num" :class="{ 'is-stale': updating }">{{ fmtIcp(plan.totalReceiveOut) }}</b>
      </div>
      <button
        class="ex-btn ex-btn--primary ex-btn--lg ex-btn--block"
        :disabled="!button.enabled"
        @click="onButton"
      >{{ button.label }}</button>
      <p v-if="waitHelper" class="ms-helper">
        {{ waitHelper }}
        <button class="ms-link" @click="ms.sellAnyway.value = true">{{ sellNowText }}</button>
      </p>
    </div>
    <div ref="barSentinel" class="ms-card__sentinel" aria-hidden="true"></div>

    <MultiTokenPicker
      :visible="pickerOpen"
      :selected="ms.basket.value.map(b => b.address)"
      @done="onPicked"
      @close="pickerOpen = false"
    />
    <MultiSellConfirm
      :visible="ms.confirmOpen.value"
      :plan="plan"
      :icp="ms.icp.value"
      :slippage="ms.slippage.value"
      :max-rows="ms.basket.value.filter(b => b.atMax).map(b => b.address)"
      :principal="ms.confirmFor.value || store.principalText"
      :refreshing="ms.quoting.value"
      :back-note="ms.backNote.value"
      @cancel="ms.cancelConfirm()"
      @confirm="ms.confirm()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { useExchangeAuth } from '../../composables/useExchangeAuth'
import { useMultiSell } from '../../composables/useMultiSell'
import { useHoldings } from '../../composables/useHoldings'
import { ICP_LEDGER_ID } from '../../constants/tokens'
import { formatTokenAmount } from '../../utils/format'
import { MAX_TOKENS_PER_SALE, joinNames } from '../../utils/multiSellPlanner'
import { poolNoteText, aboutIcp, plural, someNames, usdCell, aboutUsd } from './multiSellCopy'
import MultiSellRow from './MultiSellRow.vue'
import MultiTokenPicker from './MultiTokenPicker.vue'
import MultiSellConfirm from './MultiSellConfirm.vue'
import TokenCoin from './TokenCoin.vue'
import SlippageSelector from '../shared/SlippageSelector.vue'

const MAX = MAX_TOKENS_PER_SALE
const store = useExchangeStore()
const auth = useExchangeAuth()
const ms = useMultiSell()
const holdings = useHoldings()
const showSettings = ref(false)
const pickerOpen = ref(false)
const openRow = ref('')

const plan = computed(() => ms.plan.value)
/** A plan is shown while a changed basket or amount is being quoted again: it is dimmed until the new one lands. */
const updating = computed(() => !!plan.value && ms.quoting.value)

// the holdings (empty state coins, the picker) read the Portfolio's balance cache
onMounted(() => { if (store.isAuthenticated) holdings.ensureBalances(store.tokens) })
watch(() => store.isAuthenticated, (a) => { if (a) holdings.ensureBalances(store.tokens) })
const fmtIcp = (v: bigint) => ms.icp.value ? formatTokenAmount(v, Number(ms.icp.value.decimals), ms.icp.value.symbol) : v.toString()

const topHoldings = computed(() => store.tokens
  .filter(t => t.address !== ICP_LEDGER_ID && holdings.usdValue(t) > 0)
  .sort((a, b) => holdings.usdValue(b) - holdings.usdValue(a)).slice(0, 4))

const countText = computed(() => plural(ms.basket.value.length, 'token', 'tokens'))
// dollar values follow the picker's rule: 2 decimals from a cent up, "< $0.01" below
const basketUsd = computed(() => {
  let s = 0
  for (const r of ms.rows.value) {
    const t = r.token
    if (!t) continue
    const p = store.getTokenPriceUSD(t.address)
    if (p) s += Number(r.amount) / 10 ** Number(t.decimals) * p
  }
  return usdCell(s)
})
const receiveUsd = computed(() => {
  const p = plan.value, icp = ms.icp.value
  if (!p || !icp) return ''
  const price = store.getTokenPriceUSD(icp.address)
  return price ? aboutUsd(Number(p.totalReceiveOut) / 10 ** Number(icp.decimals) * price) : ''
})
const impactCls = computed(() => {
  const x = plan.value?.impactPct ?? 0
  return x > 25 ? 'is-err' : x > 5 ? 'is-warn' : ''
})
const mix = computed(() => {
  const s = plan.value?.venueShareBp
  if (!s) return []
  const order: Array<'taco' | 'icpswap' | 'neutrinite'> = ['taco', 'icpswap', 'neutrinite']
  return order.filter(d => s[d] > 0).map(d => ({ dex: d, label: d === 'icpswap' ? 'ICPSwap' : d === 'neutrinite' ? 'Neutrinite' : 'TACO', pct: Math.max(1, Math.round(s[d] / 100)) }))
    .sort((a, b) => b.pct - a.pct)
})
const poolNote = computed(() => (plan.value?.note && ms.icp.value ? poolNoteText(plan.value.note, ms.icp.value) : ''))
const moveOf = (addr: string) => plan.value?.moves.find(m => m.asset === addr)?.text

const skippedSyms = computed(() => (plan.value?.budget.skipped ?? []).map(a => plan.value!.assets.find(x => x.address === a)?.symbol ?? '').filter(Boolean))
const costlySkip = computed(() => !!plan.value?.budget.ask && skippedSyms.value.length > 0 && !ms.sellAnyway.value && ms.waitSec.value > 0)
const tacoBusy = computed(() => (plan.value?.assets ?? []).some(a => a.issue === 'tacoBusy'))
const budgetInfo = computed(() => {
  const p = plan.value
  if (!p || skippedSyms.value.length === 0 || costlySkip.value) return ''
  const s = ms.waitSec.value
  return skippedSyms.value.length === 1
    ? `The TACO exchange takes only a few trades per wallet every 90 seconds, so ${skippedSyms.value[0]} skips it this time.${s > 0 ? ` Wait ${s} s to include ${skippedSyms.value[0]}.` : ''}`
    : `The TACO exchange takes only a few trades per wallet every 90 seconds, so ${joinNames(skippedSyms.value)} skip it this time.${s > 0 ? ` Wait ${s} s to include them.` : ''}`
})
const waitHelper = computed(() => {
  if (!costlySkip.value || !ms.icp.value) return ''
  return `The TACO exchange takes only a few trades per wallet every 90 seconds. Waiting ${ms.waitSec.value} s lets ${someNames(skippedSyms.value)} use the TACO exchange too, for about ${aboutIcp(plan.value!.budget.gainIfWait, ms.icp.value)} ICP more.`
})
const sellNowText = computed(() => 'Sell now without waiting')
watch(() => plan.value, () => { ms.sellAnyway.value = false })

const extremeTitle = computed(() => {
  const ex = ms.extreme.value
  if (ex.length === 1) return `Extreme price impact on ${ex[0].a.symbol} (${ex[0].pct.toFixed(1)}%).`
  return `Extreme price impact on ${joinNames(ex.map(x => `${x.a.symbol} (${x.pct.toFixed(1)}%)`))}.`
})
const extremeAck = computed(() => {
  const ex = ms.extreme.value
  if (ex.length === 1) return `I understand ${ex[0].a.symbol} loses about ${Math.round(ex[0].pct)}% to price impact.`
  const lo = Math.round(Math.min(...ex.map(x => x.pct))), hi = Math.round(Math.max(...ex.map(x => x.pct)))
  return `I understand these lose about ${lo}% to ${hi}% to price impact.`
})

const button = computed<{ label: string; enabled: boolean; action: 'connect' | 'pick' | 'sell' | 'none' }>(() => {
  if (!store.isAuthenticated) return { label: 'Connect Wallet', enabled: true, action: 'connect' }
  const rows = ms.rows.value
  if (rows.length === 0) return { label: 'Choose tokens', enabled: true, action: 'pick' }
  if (ms.isRunning.value) return { label: ms.run.value?.phase === 'preparing' ? 'Your last sale is still starting' : 'Your last sale is still finishing', enabled: false, action: 'none' }
  if (ms.opening.value) return { label: 'Checking balances…', enabled: false, action: 'none' }
  if (rows.some(r => r.issue === 'empty')) return { label: 'Enter amounts', enabled: false, action: 'none' }
  if (rows.some(r => ['overMax', 'tooSmall', 'balanceChanged'].includes(r.issue ?? ''))) return { label: 'Fix the amounts above', enabled: false, action: 'none' }
  const blocked = rows.filter(r => ['noRoute', 'zeroOut', 'quoteFailed', 'paused'].includes(r.issue ?? ''))
  if (blocked.length === 1) return { label: `Remove ${blocked[0].token?.symbol ?? ''} to continue`, enabled: false, action: 'none' }
  if (blocked.length > 1) return { label: 'Remove the tokens marked above', enabled: false, action: 'none' }
  if (ms.quoting.value || !plan.value) return { label: 'Finding best mix…', enabled: false, action: 'none' }
  if (!ms.impactAcknowledged.value) return { label: 'Confirm the price impact to continue', enabled: false, action: 'none' }
  if ((tacoBusy.value || costlySkip.value) && ms.waitSec.value > 0) return { label: `Wait ${ms.waitSec.value} s`, enabled: false, action: 'none' }
  if (!ms.ready.value) return { label: 'Finding best mix…', enabled: false, action: 'none' }
  const sellable = (plan.value.assets ?? []).filter(a => !a.issue)
  return { label: sellable.length === 1 ? `Sell ${sellable[0].symbol} for ICP` : `Sell ${sellable.length} tokens for ICP`, enabled: true, action: 'sell' }
})

function onButton() {
  const b = button.value
  if (b.action === 'connect') { void auth.connect(); return }
  if (b.action === 'pick') { pickerOpen.value = true; return }
  if (b.action === 'sell') void ms.openConfirm()
}
function onPicked(addrs: string[]) {
  pickerOpen.value = false
  void ms.setBasket(addrs)
}

// The total and the Sell button stay in view when the card is taller than the screen (8 to 10
// tokens): the bar is sticky. On wider screens it draws its box only while it floats (a sentinel
// at its place in the card is below the screen); phones always float it above the bottom nav. Its
// own total shows only while the main total is out of view, so the total never shows twice.
const cardEl = ref<HTMLElement | null>(null)
const barEl = ref<HTMLElement | null>(null)
const barSentinel = ref<HTMLElement | null>(null)
const recvRow = ref<HTMLElement | null>(null)
const barStuck = ref(false)
const recvInView = ref(false)
// Both are measured from live boxes on scroll, resize and any size change of the page, the card or
// the bar (no fixed margins). The bar floats while its place in the card (the sentinel) is more than
// 12 px below the screen's bottom. The main total is in view while its row is inside the screen and
// wholly above the bar: the bar is taller with its own total or the wait helper, and on phones it
// floats over the bottom nav. Measured, not observed: the card stays mounted under v-show, and its
// size change when it shows again after Single swap measures both anew, so neither goes stale.
let frame = 0
function measureRecv() {
  frame = 0
  const s = barSentinel.value
  barStuck.value = !!s && s.getBoundingClientRect().top > window.innerHeight - 12
  const row = recvRow.value, bar = barEl.value
  if (!row || !bar) { recvInView.value = false; return }
  const r = row.getBoundingClientRect()
  const bottom = Math.min(window.innerHeight, bar.getBoundingClientRect().top)
  recvInView.value = r.height > 0 && r.top >= 0 && r.bottom <= bottom
}
function remeasure() { if (!frame) frame = requestAnimationFrame(measureRecv) }
let sizes: ResizeObserver | null = null
onMounted(() => {
  // capture: a scroll of any scrolling box above the card counts too
  window.addEventListener('scroll', remeasure, { passive: true, capture: true })
  window.addEventListener('resize', remeasure, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    sizes = new ResizeObserver(remeasure)
    sizes.observe(document.documentElement)
    if (cardEl.value) sizes.observe(cardEl.value)
    if (barEl.value) sizes.observe(barEl.value)
  }
  remeasure()
})
watch(recvRow, remeasure, { flush: 'post' })
onBeforeUnmount(() => {
  sizes?.disconnect()
  window.removeEventListener('scroll', remeasure, { capture: true })
  window.removeEventListener('resize', remeasure)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<style scoped lang="scss">
.ms-card {
  background: var(--tx-panel-bg);
  border: var(--tx-panel-border);
  border-radius: var(--tx-r-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--tx-shadow-1);
  color: var(--tx-ink);

  // the same header box as the Single swap card (CrossDexCard __header and __titlebox)
  &__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  &__titlebox { display: flex; flex-direction: column; gap: 4px; min-width: 0; align-items: flex-start; @media (max-width: 600px) { flex: 1; align-items: stretch; } }
  &__gear {
    background: none; border: none; color: var(--tx-ink-3); cursor: pointer; padding: 4px; border-radius: 6px;
    &:hover, &.is-on { color: var(--tx-orange); }
  }
  &__sub { font-size: 12px; color: var(--tx-ink-3); margin: 2px 0 0; line-height: 1.4; }
  &__bar { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; position: sticky; bottom: 12px; z-index: 5; }
  &__bar-total {
    display: flex; justify-content: space-between; align-items: baseline; font-size: 12.5px; color: var(--tx-ink-2);
    b { font-size: 15px; font-weight: 600; color: var(--tx-ink); }
  }
  // marks where the bar sits in the card (the negative margin takes back the card's gap)
  &__sentinel { height: 0; margin-top: -12px; }

  @media (min-width: 601px) {
    // the box is there all the time (transparent, the margins take back its border and padding) and
    // shows only while the bar floats over the list
    &__bar {
      padding: 9px; margin: -6px -10px -10px; border: 1px solid transparent; border-radius: 12px;
      transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
      &.is-stuck { background: var(--tx-panel-bg); border-color: var(--tx-line-2); box-shadow: var(--tx-shadow-2); }
      &:not(.is-stuck) .ms-card__bar-total { display: none; }
    }
  }
  @media (max-width: 600px) {
    // the total and the button stay visible above the bottom nav
    &__bar {
      bottom: calc(var(--tx-mobile-nav-h) + 8px);
      background: var(--tx-panel-bg); border: 1px solid var(--tx-line-2); border-radius: 12px;
      padding: 10px; box-shadow: var(--tx-shadow-2); margin: 4px -6px 0;
    }
  }
}
.ms-label { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: var(--tx-ink-2); small { font-size: 12px; color: var(--tx-ink-3); } }
.ms-list { background: var(--tx-surface-1); border: 1px solid var(--tx-line); border-radius: 10px; overflow: hidden; }
.ms-add {
  display: flex; align-items: center; justify-content: center; gap: 6px; height: 38px; width: 100%;
  border: 0; border-top: 1px dashed var(--tx-line-2); background: transparent; color: var(--tx-ink-2);
  font-size: 13px; font-weight: 600; cursor: pointer;
  &:hover:not(:disabled) { color: var(--tx-orange); }
  &:disabled { cursor: default; opacity: 0.6; }
}
.ms-arrow {
  align-self: center; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--tx-line-2);
  background: var(--tx-surface-1); display: flex; align-items: center; justify-content: center; color: var(--tx-ink-3); margin: -4px 0;
}
.ms-recv {
  &__h { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--tx-ink-2); margin-bottom: 8px; }
  &__row { display: flex; align-items: center; gap: 8px; }
  &__pill {
    display: flex; align-items: center; gap: 6px; background: var(--tx-surface-2); border: 1px solid var(--tx-line-2);
    border-radius: 20px; padding: 4px 12px 4px 6px; font-weight: 600;
  }
  &__total { flex: 1; text-align: right; font-size: 22px; font-weight: 500; letter-spacing: -0.01em; transition: opacity 0.2s; }
  &__usd { text-align: right; font-size: 12px; color: var(--tx-ink-3); margin-top: 2px; transition: opacity 0.2s; }
}
.is-stale { opacity: 0.45; transition: opacity 0.2s; }
.ms-refine { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--tx-ink-3); }
.ms-spin {
  width: 10px; height: 10px; border: 2px solid var(--tx-line-2); border-top-color: var(--tx-orange); border-radius: 50%;
  display: inline-block; animation: ms-card-spin 0.7s linear infinite;
}
@keyframes ms-card-spin { to { transform: rotate(360deg); } }
.ms-details { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: var(--tx-surface-1); border-radius: 10px; }
.ms-drow {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; font-size: 13px; color: var(--tx-ink-2); gap: 6px 12px;
  > span:first-child { white-space: nowrap; }
  b { font-weight: 500; color: var(--tx-ink); font-size: 12.5px; &.is-warn { color: var(--tx-warning); } &.is-err { color: var(--tx-sell); } }
}
.ms-dexmix { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.ms-dex {
  font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap;
  &--icpswap { background: var(--tx-dex-icpswap-dim); color: var(--tx-dex-icpswap); }
  &--taco { background: var(--tx-dex-taco-dim); color: var(--tx-dex-taco); }
  &--neutrinite { background: var(--tx-dex-neutrinite-dim); color: var(--tx-dex-neutrinite); }
}
.ms-info {
  display: flex; gap: 8px; align-items: flex-start; border-radius: 8px; padding: 8px 10px;
  background: var(--tx-info-dim); font-size: 12.5px; color: var(--tx-ink); line-height: 1.45;
  i {
    font-style: normal; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--tx-info); color: var(--tx-info);
    font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
  }
}
.ms-box-err {
  font-size: 12.5px; color: var(--tx-sell); background: var(--tx-sell-dim); padding: 8px 10px; border-radius: 6px; line-height: 1.45;
  label { display: flex; gap: 8px; align-items: flex-start; margin-top: 6px; color: var(--tx-ink); cursor: pointer; }
}
.ms-link { background: none; border: 0; padding: 0; margin-left: 4px; color: inherit; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-size: inherit; }
.ms-helper { font-size: 12px; color: var(--tx-ink-3); text-align: center; margin: -2px 0 0; line-height: 1.4; }
.ms-empty {
  border: 1px dashed var(--tx-line-hi); border-radius: 12px; padding: 26px 18px; display: flex; flex-direction: column;
  align-items: center; gap: 8px; text-align: center; background: transparent; color: var(--tx-ink); width: 100%;
  &--btn { cursor: pointer; &:hover { border-color: var(--tx-orange-line); } }
  &__coins { display: flex; :deep(.tk-coin) { border: 2px solid var(--tx-surface-1); margin-left: -8px; } :deep(.tk-coin:first-child) { margin-left: 0; } }
  &__t { font-weight: 600; font-size: 14px; margin-top: 4px; }
  &__b { font-size: 12.5px; color: var(--tx-ink-3); max-width: 300px; line-height: 1.45; }
}
</style>
