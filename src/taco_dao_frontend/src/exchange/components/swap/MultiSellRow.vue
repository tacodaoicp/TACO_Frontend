<template>
  <div class="ms-row" :class="{ 'is-open': open }">
    <TokenCoin :token="token" :size="26" />
    <div class="ms-row__sym">
      <span>{{ token?.symbol ?? '…' }}</span>
      <span v-if="item.atMax && !issue" class="ms-row__maxtag">Max</span>
    </div>
    <input
      class="ms-row__amt num"
      :class="{ 'is-err': inputError }"
      type="text"
      inputmode="decimal"
      placeholder="0.00"
      :value="item.amountText"
      :style="{ '--len': Math.max(item.amountText.length, 1) }"
      :disabled="locked"
      :aria-label="`${token?.symbol ?? ''} amount`"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    />
    <button class="ms-row__x" :aria-label="`Remove ${token?.symbol ?? ''}`" :disabled="locked" @click="$emit('remove')">
      <svg width="14" height="14" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
    </button>

    <!-- balance line: on the focused or open row -->
    <div v-if="focused || open" class="ms-row__l2">
      <span class="num">{{ usdText }}</span>
      <span class="ms-row__bal">
        Balance <span class="num">{{ balanceText }}</span>
        <button class="ms-row__max" :class="{ 'is-on': item.atMax }" :disabled="locked" @mousedown.prevent @click="$emit('max')">MAX</button>
      </span>
    </div>

    <!-- result line: the whole line opens the routes (the chevron is the keyboard control) -->
    <div v-if="showResult" class="ms-row__l3" :class="{ 'is-toggle': canToggle }" @click="canToggle && $emit('toggle')">
      <template v-if="item.quoting">
        <span class="ex-skeleton ms-row__skbar"></span>
        <span class="ex-skeleton" style="width:84px;height:14px"></span>
      </template>
      <template v-else-if="plan && !plan.issue">
        <DexSplitBar :legs="plan.legs" />
        <span v-if="impactHint" class="ms-row__imp num">{{ impactHint }}</span>
        <span class="ms-row__out num" :class="impactClass">→ {{ fmtIcp(plan.receiveOut) }}</span>
        <button class="ms-row__chev" :aria-expanded="open" :aria-label="open ? 'Hide the routes' : 'Show the routes'" @click.stop="$emit('toggle')">{{ open ? '▴' : '▾' }}</button>
      </template>
    </div>

    <div v-if="message" class="ms-row__msg" :class="messageClass">
      {{ message }}
      <button v-if="messageAction === 'remove'" class="ms-row__link" @click="$emit('remove')">Remove</button>
      <button v-if="messageAction === 'retry'" class="ms-row__link" @click="$emit('retry')">Try again</button>
    </div>

    <div v-if="open && plan && !plan.issue" class="ms-row__legs">
      <div v-for="(l, i) in plan.legs" :key="i" class="ms-row__leg">
        <span class="ms-dex" :class="`ms-dex--${l.dex}`">{{ dexName(l.dex) }}</span>
        <span class="ms-row__pct num">{{ pct(l.pctBP) }}</span>
        <span v-if="l.dex === 'taco' && via(l)" class="ms-row__via">{{ via(l) }}</span>
        <span class="ms-row__lout num">≈ {{ fmtIcp(l.expectedOut) }}</span>
      </div>
      <div class="ms-row__foot">
        <span v-if="impact != null">Price impact {{ impact.toFixed(1) }}%</span>
        <span v-if="move">{{ move }}</span>
        <span v-if="tacoPaused">The TACO exchange has {{ token?.symbol }} paused right now.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { formatTokenAmount, formatUSD } from '../../utils/format'
import { parseAmount } from '../../composables/useMultiSell'
import type { BasketItem, RowIssue } from '../../composables/useMultiSell'
import type { AssetPlan } from '../../utils/multiSellPlanner'
import type { CrossDexLeg, CrossDexVenue } from '../../utils/crossDexOptimizer'
import TokenCoin from './TokenCoin.vue'
import DexSplitBar from './DexSplitBar.vue'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{
  item: BasketItem
  token: TokenInfo | null
  plan: AssetPlan | null
  issue: RowIssue | null
  icp: TokenInfo | null
  open: boolean
  move?: string
  waitSec?: number
  locked?: boolean
}>()
const emit = defineEmits<{ amount: [text: string]; max: []; remove: []; toggle: []; retry: [] }>()

const store = useExchangeStore()
const focused = ref(false)

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('amount', v)
}

const dexName = (d: CrossDexVenue) => (d === 'icpswap' ? 'ICPSwap' : d === 'neutrinite' ? 'Neutrinite' : 'TACO')
const pct = (bp: number) => `${Math.round(bp / 10) / 10}%`
const fmtIcp = (v: bigint) => props.icp ? formatTokenAmount(v, Number(props.icp.decimals), props.icp.symbol) : v.toString()
const fmtTok = (v: bigint) => props.token ? formatTokenAmount(v, Number(props.token.decimals)) : v.toString()

const balanceText = computed(() => {
  const b = props.token ? store.userBalanceQuery(props.token.address).data.value : null
  return b == null ? '…' : fmtTok(b)
})
const usdText = computed(() => {
  const t = props.token
  if (!t) return ''
  const p = store.getTokenPriceUSD(t.address)
  if (!p) return ''
  const amt = parseAmount(props.item.amountText, Number(t.decimals))
  return `≈ ${formatUSD(Number(amt) / 10 ** Number(t.decimals) * p)}`
})
const tacoPaused = computed(() => !!props.token && store.isTokenPaused(props.token.address))

const impact = computed<number | null>(() => {
  const a = props.plan
  if (!a || !a.noImpactOut || a.noImpactOut <= 0n) return null
  return Math.max(0, (1 - Number(a.expectedOut) / Number(a.noImpactOut)) * 100)
})
const impactClass = computed(() => (impact.value == null ? '' : impact.value > 25 ? 'is-err' : impact.value > 5 ? 'is-warn' : ''))
/** Between 5% and 15% the amount turns orange: say why (above 15% the message line does). */
const impactHint = computed(() => (impact.value != null && impact.value > 5 && impact.value <= 15 ? `${impact.value.toFixed(1)}% impact` : ''))
const canToggle = computed(() => !props.item.quoting && !!props.plan && !props.plan.issue)

const showResult = computed(() => props.item.quoting || (!!props.plan && !props.plan.issue && props.issue == null))
const inputError = computed(() => ['overMax', 'tooSmall', 'balanceChanged'].includes(props.issue ?? ''))

const message = computed(() => {
  const s = props.token?.symbol ?? ''
  const max = props.item.maxSellable != null ? fmtTok(props.item.maxSellable) : ''
  switch (props.issue) {
    case 'overMax': return `More than you can sell. Your max is ${max} after fees.`
    case 'tooSmall': return 'Too small to sell after fees.'
    case 'balanceChanged': return `Your balance changed. Your max is now ${max}.`
    case 'noRoute': return `No way to sell ${s} for ICP right now.`
    case 'quoteFailed': return `Could not get a price for ${s}.`
    case 'zeroOut': return 'Too small to sell for ICP.'
    case 'tacoBusy': return `The TACO exchange takes only a few trades per wallet every 90 seconds. ${s} can sell in ${props.waitSec ?? 0} s.`
  }
  if (impact.value != null && impact.value > 25) return `Price impact ${impact.value.toFixed(1)}%. Confirm below or sell less.`
  if (impact.value != null && impact.value > 15) return `Price impact ${impact.value.toFixed(1)}%. You are moving the price a lot.`
  return ''
})
const messageClass = computed(() => (props.issue || (impact.value ?? 0) > 25 ? 'is-err' : 'is-warn'))
const messageAction = computed(() => (props.issue === 'noRoute' ? 'remove' : props.issue === 'quoteFailed' ? 'retry' : ''))

function via(l: CrossDexLeg): string {
  const hubs: string[] = []
  for (const t of l.tacoLegs ?? []) {
    for (let k = 0; k < (t.route?.length ?? 0) - 1; k++) {
      const h = t.route[k].tokenOut
      const sym = store.getTokenByAddress(h)?.symbol
      if (sym && !hubs.includes(sym)) hubs.push(sym)
    }
  }
  if (hubs.length === 0) return ''
  return hubs.length === 1 ? `via ${hubs[0]}` : `via ${hubs.slice(0, -1).join(', ')} and ${hubs[hubs.length - 1]}`
}
</script>

<style scoped lang="scss">
.ms-row {
  display: grid;
  grid-template-columns: 26px 1fr auto 28px;
  column-gap: 10px;
  row-gap: 4px;
  padding: 10px 8px 10px 12px;
  align-items: center;
  border-bottom: 1px solid var(--tx-line);

  &__sym {
    display: flex; align-items: center; gap: 6px; min-width: 0;
    font-weight: 600; font-size: 14px; color: var(--tx-ink);
    span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
  &__maxtag {
    font-size: 10px; font-weight: 700; letter-spacing: 0.03em; color: var(--tx-ink-3);
    border: 1px solid var(--tx-line-2); border-radius: 4px; padding: 0 4px; line-height: 15px;
  }
  &__amt {
    width: 150px; height: 32px; border-radius: 6px;
    background: var(--tx-surface-2); border: 1px solid var(--tx-line-2);
    text-align: right; padding: 0 10px; font-weight: 500;
    // long amounts (Max of a big balance) shrink to stay fully visible
    font-size: min(15px, calc(128px / (var(--len, 1) * 0.6))); color: var(--tx-ink); outline: none;
    &:focus { border-color: var(--tx-orange-line); box-shadow: 0 0 0 2px var(--tx-orange-dim); }
    &.is-err { border-color: var(--tx-sell); }
    &:disabled { opacity: 0.6; }
  }
  &__x {
    width: 28px; height: 28px; border: 0; background: none; color: var(--tx-ink-3); border-radius: 6px;
    display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
    &:hover:not(:disabled) { color: var(--tx-ink); background: var(--tx-surface-3); }
  }
  &__l2 {
    grid-column: 2 / 5; display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: var(--tx-ink-3); padding-right: 2px;
    .num { font-size: 11.5px; }
  }
  &__bal { display: inline-flex; align-items: center; gap: 6px; }
  &__max {
    appearance: none; height: 24px; min-width: 40px; padding: 0 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.03em;
    border-radius: 4px; border: 1px solid var(--tx-line); background: var(--tx-surface-2); color: var(--tx-ink-3); cursor: pointer;
    &.is-on { color: var(--tx-orange); background: var(--tx-orange-dim); border-color: var(--tx-orange-line); }
  }
  &__l3 {
    grid-column: 2 / 5; display: flex; align-items: center; gap: 10px; padding-right: 4px; margin-top: 2px;
    &.is-toggle { cursor: pointer; }
  }
  &__imp { font-size: 11px; color: var(--tx-warning); white-space: nowrap; }
  &__skbar { flex: 1; height: 4px; }
  &__out {
    font-size: 13px; font-weight: 500; color: var(--tx-ink); white-space: nowrap;
    &.is-warn { color: var(--tx-warning); }
    &.is-err { color: var(--tx-sell); }
  }
  // a 32 px target drawn at the size of the glyph
  &__chev {
    background: none; border: 0; color: var(--tx-ink-3); font-size: 11px; cursor: pointer; padding: 0;
    width: 32px; height: 32px; margin: -8px -8px -8px -8px; border-radius: 6px;
    &:hover { color: var(--tx-ink); }
  }
  &__msg {
    grid-column: 2 / 5; font-size: 12px; line-height: 1.4;
    &.is-err { color: var(--tx-sell); }
    &.is-warn { color: var(--tx-warning); }
  }
  &__link { background: none; border: 0; padding: 0; margin-left: 6px; color: inherit; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-size: inherit; }
  &__legs {
    grid-column: 2 / 5; display: flex; flex-direction: column; gap: 6px; margin-top: 6px;
    padding: 8px 10px; background: var(--tx-surface-2); border-radius: 8px; font-size: 12px;
  }
  &__leg { display: flex; align-items: center; gap: 8px; }
  &__pct { color: var(--tx-ink-2); font-size: 12px; }
  &__via { color: var(--tx-ink-3); font-size: 11px; }
  &__lout { margin-left: auto; font-size: 12px; color: var(--tx-ink); }
  &__foot {
    display: flex; flex-wrap: wrap; gap: 2px 12px; justify-content: space-between;
    color: var(--tx-ink-3); font-size: 11.5px; border-top: 1px solid var(--tx-line); padding-top: 6px; margin-top: 2px;
  }

  @media (max-width: 600px) {
    &__amt { width: 132px; font-size: min(14px, calc(110px / (var(--len, 1) * 0.6))); }
    // a 44 px tall target that grows to the left, into the column gap, never past the row's edge
    &__x { width: 38px; height: 44px; margin: -8px 0; justify-self: end; }
  }
}
.ms-dex {
  font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap;
  &--icpswap { background: var(--tx-dex-icpswap-dim); color: var(--tx-dex-icpswap); }
  &--taco { background: var(--tx-dex-taco-dim); color: var(--tx-dex-taco); }
  &--neutrinite { background: var(--tx-dex-neutrinite-dim); color: var(--tx-dex-neutrinite); }
}
</style>
