<template>
  <Teleport to="body">
    <div v-if="run" class="ms-modal-overlay" data-theme="exchange">
      <div ref="sheet" class="ms-md ms-md--wide ms-run" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
        <div class="ms-md__head">
          <h3>{{ title }}</h3>
          <span class="ms-pill" :class="`ms-pill--${pill.cls}`">{{ pill.text }}</span>
        </div>
        <p v-if="running" class="ms-md__sub">{{ subLine }}</p>

        <!-- one overall line -->
        <div class="ms-ov">
          <div class="ms-ov__bar"><div class="ms-ov__fill" :class="fillCls" :style="{ width: fillPct + '%' }"></div></div>
          <div class="ms-ov__t" aria-live="polite">
            <span>{{ progressText }}</span>
            <b v-if="running && run.phase !== 'preparing'" class="num">{{ fmtIcp(receivedSoFar) }} so far</b>
          </div>
        </div>

        <p v-if="approvalSlow" class="ms-md__note ms-note-warn" aria-live="polite">Still waiting for the approval. You can close this window and the sale goes on by itself.</p>

        <div v-if="final && (receivedSoFar > 0n || unknownParts > 0)" class="ms-res-total">
          <div><small>You received</small><b class="num">{{ fmtIcp(receivedSoFar) }}</b></div>
          <span v-if="usdText" class="num ms-res-total__usd">{{ usdText }}</span>
        </div>
        <p v-if="final && unknownParts > 0" class="ms-md__note">Plus {{ plural(unknownParts, 'part', 'parts') }} whose amount shows in your wallet.</p>

        <div v-if="run.phase === 'stopped'" class="ms-box-err">{{ stopMessage }}</div>

        <div class="ms-ar-list">
          <div v-for="(a, ai) in run.assets" :key="a.address" class="ms-ar" :class="{ 'is-open': isOpen(ai) }">
            <!-- the whole line opens the routes; a stopped sale sent nothing, so there is nothing to open -->
            <component
              :is="canToggle ? 'button' : 'div'"
              class="ms-ar__head"
              :type="canToggle ? 'button' : undefined"
              :aria-expanded="canToggle ? isOpen(ai) : undefined"
              @click="canToggle && toggle(ai)"
            >
              <TokenCoin :token="tokenOf(a.address)" :size="26" />
              <span class="ms-ar__id">
                <span class="ms-ar__sym">{{ a.symbol }}</span>
                <span class="ms-ar__amt num">{{ fmtTok(a.address, a.amountIn) }}</span>
              </span>
              <span class="ms-ar__state" :class="`is-${cell(a).cls}`">
                <span v-if="cell(a).spin" class="ms-spin"></span>
                <span v-if="cell(a).glyph">{{ cell(a).glyph }}</span>
                {{ cell(a).text }}
                <b v-if="cell(a).out != null" class="num">{{ fmtIcp(cell(a).out!) }}</b>
              </span>
              <span v-if="canToggle" class="ms-ar__chev" aria-hidden="true">{{ isOpen(ai) ? '▴' : '▾' }}</span>
            </component>
            <div class="ms-ar__chips">
              <DexLegChip v-for="(l, li) in a.legs" :key="li" :dex="l.venue" :state="run.phase === 'stopped' ? 'notSent' : l.state" />
              <span v-if="cell(a).tag" class="ms-ar__tag">{{ cell(a).tag }}</span>
            </div>
            <div v-if="isOpen(ai)" class="ms-ar__detail">
              <template v-for="(l, li) in a.legs" :key="li">
                <span v-if="running && !isFinal(l)">{{ venueLabel(l.venue) }}: {{ l.step || (l.state === 'waiting' ? 'Waiting…' : 'Starting…') }}</span>
                <span v-else>{{ detail(a, l) }}</span>
                <span v-if="l.error && showRawError(l)" class="ms-ar__err">{{ l.error }}</span>
              </template>
            </div>
          </div>
        </div>

        <template v-if="final && refunds.length">
          <div class="ms-md__sec">{{ recoverRows.length ? (returnRows.length || otherRows.length ? 'Refunds and recovery' : 'Recovery') : 'Refunds' }}</div>
          <div class="ms-rf">
            <div v-for="(r, i) in recoverRows" :key="'r' + i" class="ms-rf__row">
              <span>{{ r.what }}</span>
              <span class="ms-rf__where is-bad">{{ r.where }}</span>
            </div>
            <!-- a route that came back as another token never folds: the wallet now holds a token
                 that was not sold -->
            <div v-for="(r, i) in otherRows" :key="'o' + i" class="ms-rf__row">
              <span>{{ r.what }}</span>
              <span class="ms-rf__where">{{ r.where }}</span>
            </div>
            <div v-if="foldReturns" class="ms-rf__row">
              <span>{{ plural(returnRows.length, 'part', 'parts') }} sent back to your wallet</span>
              <button type="button" class="ms-rf__more" :aria-expanded="false" @click="showAllReturns = true">Show all</button>
            </div>
            <template v-else>
              <div v-for="(r, i) in returnRows" :key="'b' + i" class="ms-rf__row">
                <span>{{ r.what }}</span>
                <span class="ms-rf__where">{{ r.where }}</span>
              </div>
              <button v-if="returnRows.length > FOLD_AFTER" type="button" class="ms-rf__more ms-rf__more--less" :aria-expanded="true" @click="showAllReturns = false">Show less</button>
            </template>
          </div>
        </template>

        <p v-if="final && slowCount > 0" class="ms-md__note ms-note-warn">{{ slowCount === 1 ? '1 route is still finishing. Keep this page open until it does.' : `${slowCount} routes are still finishing. Keep this page open until they do.` }}</p>
        <p v-if="final && run.sessionExpired" class="ms-md__note ms-note-warn">Your session expired during the sale. Reconnect, then open the Recover page for anything that was not refunded.</p>
        <p v-if="final && !anyRecover && anyRefund" class="ms-md__note">Refunds are on their way to your wallet, minus network fees.</p>
        <p v-if="final && anyRecover" class="ms-md__note ms-note-bad">Some funds were not refunded automatically. Open the Recover page to get them back.</p>

        <p v-if="running" class="ms-md__foot">Keep this page open until it finishes. Anything that cannot finish goes back to your wallet, minus network fees.</p>
        <p v-if="run.phase === 'stopped'" class="ms-md__foot">Your tokens are still in your wallet.{{ run.approvalSpent ? ' Only the approval fee was spent.' : '' }}</p>

        <div v-if="approvalSlow" class="ms-md__acts">
          <button class="ex-btn ex-btn--ghost" @click="$emit('hide')">Close</button>
        </div>
        <div v-if="!running" class="ms-md__acts">
          <template v-if="run.phase === 'stopped'">
            <button v-if="run.stop === 'notAuthenticated' || run.stop === 'sessionEndsSoon'" class="ex-btn ex-btn--ghost" @click="$emit('back')">Back to the sale</button>
            <button v-if="run.stop === 'notAuthenticated' || run.stop === 'sessionEndsSoon'" class="ex-btn ex-btn--primary" @click="$emit('connect')">Connect Wallet</button>
            <button v-else class="ex-btn ex-btn--primary" @click="$emit('back')">Back to the sale</button>
          </template>
          <template v-else-if="anyRecover || run.sessionExpired">
            <button class="ex-btn ex-btn--ghost" @click="$emit('done')">Done</button>
            <button class="ex-btn ex-btn--primary" @click="$emit('recover')">Open Recover page</button>
          </template>
          <template v-else>
            <button v-if="soldAny" class="ex-btn ex-btn--ghost" @click="$emit('portfolio')">View in Portfolio</button>
            <button class="ex-btn ex-btn--primary" @click="$emit('done')">Done</button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { formatTokenAmount } from '../../utils/format'
import type { MultiSellRun } from '../../composables/useMultiSell'
import type { LegRun } from '../../utils/multiSellRunner'
import { plural, legDetail, stopText, routeHopToken, venueLabel, venueIn, recoverWhere, aboutUsd } from './multiSellCopy'
import { joinNames } from '../../utils/multiSellPlanner'
import TokenCoin from './TokenCoin.vue'
import DexLegChip from './DexLegChip.vue'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{ run: MultiSellRun | null; icp: TokenInfo | null }>()
const emit = defineEmits<{ done: []; recover: []; back: []; portfolio: []; connect: []; hide: [] }>()

const store = useExchangeStore()
const tokenOf = (a: string) => store.getTokenByAddress(a) ?? null
const fmtIcp = (v: bigint) => props.icp ? formatTokenAmount(v, Number(props.icp.decimals), props.icp.symbol) : v.toString()
const fmtTok = (a: string, v: bigint) => { const t = tokenOf(a); return t ? formatTokenAmount(v, Number(t.decimals)) : v.toString() }

const SOLD = ['done', 'doneUnknown', 'belowMin']
const FINAL = ['done', 'doneUnknown', 'belowMin', 'refunded', 'notSent', 'needsRecovery', 'tracked']
const isFinal = (l: LegRun) => FINAL.includes(l.state)

const running = computed(() => !!props.run && ['preparing', 'selling', 'settling'].includes(props.run.phase))
const final = computed(() => !!props.run && ['complete', 'partial', 'failed'].includes(props.run.phase))
const legs = computed(() => props.run?.assets.flatMap(a => a.legs) ?? [])
const anyRecover = computed(() => legs.value.some(l => ['needsRecovery', 'tracked'].includes(l.state)))
const anyRefund = computed(() => legs.value.some(l => l.state === 'refunded'))
const soldAny = computed(() => legs.value.some(l => SOLD.includes(l.state)))
const slowCount = computed(() => legs.value.filter(l => l.state === 'slow' || (!isFinal(l) && l.state !== 'deferred')).length)
const unknownParts = computed(() => legs.value.filter(l => l.state === 'doneUnknown').length)
const receivedSoFar = computed(() => legs.value.reduce((s, l) => s + (SOLD.includes(l.state) && l.state !== 'doneUnknown' && l.amountOut != null
  ? l.amountOut - (l.venue === 'taco' ? 0n : 10_000n) : 0n), 0n))
// the picker's dollar rule: 2 decimals from a cent up, "< $0.01" below
const usdText = computed(() => {
  const p = props.icp ? store.getTokenPriceUSD(props.icp.address) : 0
  return p && props.icp && receivedSoFar.value > 0n ? aboutUsd(Number(receivedSoFar.value) / 10 ** Number(props.icp.decimals) * p) : ''
})

const n = computed(() => props.run?.assets.length ?? 0)
const assetDone = (a: MultiSellRun['assets'][number]) => a.legs.every(l => isFinal(l))
const tokensFinal = computed(() => props.run?.assets.filter(assetDone).length ?? 0)
const tokensSold = computed(() => props.run?.assets.filter(a => a.legs.every(l => SOLD.includes(l.state))).length ?? 0)

const title = computed(() => {
  const r = props.run
  if (!r) return ''
  if (running.value) return n.value === 1 ? `Selling ${r.assets[0].symbol}` : `Selling ${n.value} tokens`
  if (r.phase === 'complete') return 'Sale complete'
  if (r.phase === 'partial') return 'Partly done'
  if (r.phase === 'stopped') return r.stop === 'notAuthenticated' ? 'Session expired' : 'Nothing was sold'
  return anyRecover.value ? 'Sale failed' : 'Nothing was sold'
})
const pill = computed(() => {
  const p = props.run?.phase
  if (running.value) return { text: 'Running', cls: 'run' }
  if (p === 'complete') return { text: 'Complete', cls: 'ok' }
  if (p === 'partial') return { text: 'Partly done', cls: 'part' }
  if (p === 'stopped') return { text: 'Stopped', cls: 'stop' }
  return { text: 'Failed', cls: 'fail' }
})
const routes = computed(() => legs.value.length)
const subLine = computed(() => `${plural(n.value, 'token', 'tokens')} to ICP, ${plural(routes.value, 'route', 'routes')}`)
const fillPct = computed(() => {
  const r = props.run
  if (!r || r.phase === 'preparing') return 0
  if (final.value || r.phase === 'stopped') return 100
  return n.value ? Math.round(tokensFinal.value / n.value * 100) : 0
})
const fillCls = computed(() => {
  const p = props.run?.phase
  return { 'is-prep': p === 'preparing', 'is-ok': p === 'complete', 'is-part': p === 'partial', 'is-fail': p === 'failed', 'is-stop': p === 'stopped' }
})

const now = ref(Date.now())
const tick = setInterval(() => { now.value = Date.now() }, 1000)
onBeforeUnmount(() => clearInterval(tick))
const deferSec = computed(() => Math.max(0, Math.ceil(((props.run?.deferredUntil ?? 0) - now.value) / 1000)))
/** A TACO approval in preflight has had no answer for 10 s: say so, and let the sheet close. */
const APPROVAL_SLOW_MS = 10_000
const approvalSlow = computed(() => {
  const r = props.run
  return !!r && r.phase === 'preparing' && r.approvalSince != null && now.value - r.approvalSince >= APPROVAL_SLOW_MS
})

const progressText = computed(() => {
  const r = props.run
  if (!r) return ''
  if (r.phase === 'preparing') return 'Getting ready. Nothing has moved yet.'
  if (r.phase === 'stopped') return r.approvalSpent ? 'Stopped before anything was sold.' : 'Stopped before any funds moved.'
  if (r.phase === 'settling') {
    const k = legs.value.filter(l => l.state === 'deferred').length
    if (k) return deferSec.value > 0 ? `Refunding ${plural(k, 'route', 'routes')} after the TACO exchange's 90 second limit, in ${deferSec.value} s` : `Refunding ${plural(k, 'route', 'routes')}…`
  }
  if (running.value) {
    const recovering = legs.value.filter(l => l.state === 'recovering').length
    if (recovering && legs.value.every(l => isFinal(l) || l.state === 'recovering')) return `Refunding ${plural(recovering, 'route', 'routes')}…`
    return `${tokensSold.value} of ${n.value} tokens sold`
  }
  if (r.phase === 'complete') return n.value === 1 ? `${r.assets[0].symbol} sold` : `All ${n.value} tokens sold`
  return `${tokensSold.value} of ${n.value} tokens fully sold`
})

const stopMessage = computed(() => {
  const r = props.run
  const sym = r?.assets.find(a => a.address === r.stopAsset)?.symbol ?? ''
  // the wait counts down with the sheet's clock
  const waitSec = r?.waitUntil != null ? Math.max(0, Math.ceil((r.waitUntil - now.value) / 1000)) : Math.ceil((r?.waitMs ?? 0) / 1000)
  return stopText(r?.stop, sym, waitSec)
})

// state cell per token (plan 6.4)
function cell(a: MultiSellRun['assets'][number]): { text: string; cls: string; spin?: boolean; glyph?: string; out?: bigint; tag?: string } {
  if (props.run?.phase === 'stopped') return { text: 'Not sent', cls: 'skip' }
  const ls = a.legs
  const sold = ls.filter(l => SOLD.includes(l.state))
  const out = sold.reduce((s, l) => s + (l.amountOut != null && l.state !== 'doneUnknown' ? l.amountOut - (l.venue === 'taco' ? 0n : 10_000n) : 0n), 0n)
  const unfinished = ls.filter(l => !isFinal(l))
  if (unfinished.length) {
    // a part handed to the refund after TACO's call window is waiting to be refunded, not to sell
    if (unfinished.every(l => l.state === 'deferred')) {
      const sec = Math.max(0, Math.ceil(((unfinished[0].deferUntil ?? props.run?.deferredUntil ?? 0) - now.value) / 1000))
      return { text: sec > 0 ? `Refund in ${sec} s` : 'Refunding', cls: 'run', spin: sec === 0 }
    }
    const allWait = unfinished.every(l => l.state === 'waiting' || l.state === 'deferred')
    return { text: allWait ? 'Waiting' : 'Running', cls: 'run', spin: !allWait }
  }
  const bad = ls.some(l => ['needsRecovery', 'tracked'].includes(l.state))
  // a part sold below the minimum price counts as sold, and says so
  const tag = ls.some(l => l.state === 'belowMin') ? 'below minimum' : undefined
  if (sold.length === ls.length) {
    if (sold.every(l => l.state === 'doneUnknown')) return { text: 'Sold', cls: 'ok', glyph: '✓', tag }
    return { text: '', cls: 'ok', glyph: '✓', out, tag }
  }
  if (sold.length > 0) return { text: 'Partly sold', cls: 'part', out, tag }
  if (bad) return { text: 'Needs recovery', cls: 'fail' }
  if (ls.some(l => l.state === 'refunded')) return { text: 'Refunded', cls: 'ref', glyph: '↩' }
  return { text: 'Not sent', cls: 'skip' }
}

// row detail: open on tap; on the result, rows that need the user open by themselves (needs
// recovery, tracked, sold below the minimum, a route that came back as another token). Other
// refunded rows stay closed: the list below has them.
const opened = ref<Set<number>>(new Set())
const canToggle = computed(() => props.run?.phase !== 'stopped')
const isOpen = (ai: number) => canToggle.value && opened.value.has(ai)
function toggle(ai: number) {
  const s = new Set(opened.value)
  s.has(ai) ? s.delete(ai) : s.add(ai)
  opened.value = s
}
const ATTENTION = ['needsRecovery', 'tracked', 'belowMin']
const needsLook = (l: LegRun) => ATTENTION.includes(l.state) || (l.state === 'refunded' && routeHopToken(l) != null)
const attentionRows = computed(() => (final.value && props.run
  ? props.run.assets.map((a: MultiSellRun['assets'][number], ai: number) => (a.legs.some(needsLook) ? ai : -1)).filter((ai: number) => ai >= 0)
  : []))
let autoOpened = new Set<number>()
// immediate: the sheet can also open on a sale that already finished (back from another page);
// a slow route that settles later opens its row once, a row the user closed stays closed
watch([() => props.run?.id, () => attentionRows.value.join(',')], ([id], [oldId]) => {
  const fresh = id !== oldId
  if (fresh) autoOpened = new Set()
  const s = fresh ? new Set<number>() : new Set(opened.value)
  for (const ai of attentionRows.value) if (!autoOpened.has(ai)) { autoOpened.add(ai); s.add(ai) }
  opened.value = s
}, { immediate: true })

function detail(a: MultiSellRun['assets'][number], l: LegRun): string {
  const owners = joinNames((l.waitsFor ?? []).map(x => props.run?.assets.find(y => y.address === x)?.symbol ?? '').filter(Boolean))
  const out = l.amountOut != null ? fmtIcp(l.amountOut - (l.venue === 'taco' ? 0n : 10_000n)) : ''
  return legDetail(l, a.symbol, fmtTok(a.address, l.amountIn), out, owners, (x) => tokenOf(x)?.symbol ?? '')
}
// Keyboard: focus moves into the sheet when it opens and back to what was focused when it
// closes; Escape closes a finished or stopped sale (never one that is still running).
const sheet = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !props.run) return
  if (props.run.phase === 'stopped') { e.preventDefault(); emit('back') }
  else if (final.value) { e.preventDefault(); emit('done') }
  else if (approvalSlow.value) { e.preventDefault(); emit('hide') }
}
watch(() => !!props.run, async (open, was) => {
  if (open && !was) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onKey)
    await nextTick()
    sheet.value?.focus()
  } else if (!open && was) {
    document.removeEventListener('keydown', onKey)
    if (opener?.isConnected) opener.focus()
    opener = null
  }
}, { immediate: true })
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

// the raw message adds something only when it is the DEX's own words (the runner's notes repeat the row)
const showRawError = (l: LegRun) => ['needsRecovery', 'tracked'].includes(l.state) && !!l.error
  && !['maySent', 'tacoPaused', 'rateLimited'].includes(l.reason ?? '') && !/may have been sent|TACO takes only/i.test(l.error)

// Refunds and recovery: what needs the user first (each with what to do for its reason), then what
// came back as another token, then what came back by itself; more than FOLD_AFTER of those fold
// into one line.
const FOLD_AFTER = 4
const refunds = computed(() => {
  const out: Array<{ what: string; where: string; bad: boolean; other?: boolean }> = []
  for (const a of props.run?.assets ?? []) for (const l of a.legs) {
    const amt = `≈ ${fmtTok(a.address, l.amountIn)} ${a.symbol}`
    const mid = l.state === 'refunded' ? routeHopToken(l) : null
    if (mid != null) out.push({ what: `${a.symbol} route on the TACO exchange`, where: mid && tokenOf(mid) ? `Came back as ${tokenOf(mid)!.symbol}.` : 'Came back as another token.', bad: false, other: true })
    else if (l.state === 'refunded') out.push({ what: `${amt} from ${venueIn(l.venue)}`, where: 'Sent back to your wallet.', bad: false })
    else if (l.state === 'tracked' || (l.state === 'needsRecovery' && l.reason === 'maySent')) out.push({ what: `${a.symbol} deposit on the TACO exchange`, where: recoverWhere(l), bad: true })
    else if (l.state === 'needsRecovery' && l.failedAfterSwap) out.push({ what: `ICP from your ${a.symbol} sale on ${venueIn(l.venue)}`, where: recoverWhere(l), bad: true })
    else if (l.state === 'needsRecovery') out.push({ what: `${amt} on ${venueIn(l.venue)}`, where: recoverWhere(l), bad: true })
  }
  return out
})
const recoverRows = computed(() => refunds.value.filter(r => r.bad))
const otherRows = computed(() => refunds.value.filter(r => !r.bad && r.other))
const returnRows = computed(() => refunds.value.filter(r => !r.bad && !r.other))
const showAllReturns = ref(false)
watch(() => props.run?.id, () => { showAllReturns.value = false })
const foldReturns = computed(() => returnRows.value.length > FOLD_AFTER && !showAllReturns.value)
</script>

<style scoped lang="scss">
@use './multiSellModal' as *;
.ms-pill {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 999px; white-space: nowrap;
  &--run { background: var(--tx-orange-dim); color: var(--tx-orange); }
  &--ok { background: var(--tx-buy-dim); color: var(--tx-buy); }
  &--part { background: var(--tx-warning-dim); color: var(--tx-warning); }
  &--fail { background: var(--tx-sell-dim); color: var(--tx-sell); }
  &--stop { background: var(--tx-surface-3); color: var(--tx-ink-2); }
}
.ms-ov {
  display: flex; flex-direction: column; gap: 7px;
  &__bar { height: 6px; border-radius: 3px; background: var(--tx-surface-3); overflow: hidden; }
  &__fill {
    height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--tx-orange), var(--tx-orange-2)); transition: width 0.4s;
    &.is-ok { background: var(--tx-buy); }
    &.is-part { background: var(--tx-warning); }
    &.is-fail { background: var(--tx-sell); }
    &.is-stop { background: var(--tx-ink-4); }
  }
  &__t { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; color: var(--tx-ink-2); b { font-size: 12.5px; font-weight: 500; color: var(--tx-ink); white-space: nowrap; } }
}
.ms-res-total {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;
  small { display: block; font-size: 12px; color: var(--tx-ink-3); margin-bottom: 2px; }
  b { font-size: 26px; font-weight: 500; letter-spacing: -0.01em; }
  &__usd { font-size: 12px; color: var(--tx-ink-3); }
}
.ms-box-err { font-size: 12.5px; color: var(--tx-sell); background: var(--tx-sell-dim); padding: 8px 10px; border-radius: 6px; line-height: 1.45; }
.ms-ar-list { background: var(--tx-surface-1); border: 1px solid var(--tx-line); border-radius: 10px; overflow: hidden; flex-shrink: 0; }
.ms-ar {
  display: grid; grid-template-columns: 26px minmax(0, 1fr); column-gap: 10px; row-gap: 6px; padding: 4px 12px 10px;
  border-bottom: 1px solid var(--tx-line); align-items: center;
  &:last-child { border-bottom: 0; }
  // the whole first line is the toggle (a 44 px target on touch screens), the chevron shows it
  &__head {
    grid-column: 1 / -1; display: grid; grid-template-columns: 26px minmax(0, 1fr) auto 14px; column-gap: 10px; align-items: center;
    min-height: 38px; width: 100%; margin: 0; padding: 0; background: none; border: 0; border-radius: 8px;
    color: inherit; font: inherit; text-align: left;
    @media (pointer: coarse) { min-height: 44px; }
  }
  button.ms-ar__head {
    cursor: pointer;
    &:hover .ms-ar__chev, &:hover .ms-ar__sym { color: var(--tx-ink); }
    &:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--tx-orange-line); }
  }
  &__id { min-width: 0; display: flex; align-items: baseline; gap: 8px; }
  &__sym { font-weight: 600; font-size: 14px; }
  &__amt { font-size: 12px; color: var(--tx-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__state {
    display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--tx-ink-2); white-space: nowrap;
    b { font-size: 13px; font-weight: 600; }
    &.is-ok { color: var(--tx-buy); }
    &.is-part, &.is-ref { color: var(--tx-warning); }
    &.is-fail { color: var(--tx-sell); }
    &.is-skip { color: var(--tx-ink-3); }
  }
  &__tag {
    font-size: 10px; font-weight: 700; letter-spacing: 0.02em; color: var(--tx-warning);
    border: 1px solid color-mix(in srgb, var(--tx-warning) 55%, transparent); border-radius: 4px; padding: 0 4px; line-height: 15px;
  }
  &__chev { justify-self: end; color: var(--tx-ink-3); font-size: 11px; line-height: 1; }
  &__chips { grid-column: 2 / -1; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  &__detail {
    grid-column: 2 / -1; font-size: 12px; color: var(--tx-ink-2); line-height: 1.45; background: var(--tx-surface-2);
    border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px;
  }
  &__err { color: var(--tx-sell); font-size: 11.5px; word-break: break-word; }
}
.ms-spin {
  width: 12px; height: 12px; border: 2px solid var(--tx-line-2); border-top-color: var(--tx-orange); border-radius: 50%;
  display: inline-block; animation: ms-run-spin 0.7s linear infinite;
}
@keyframes ms-run-spin { to { transform: rotate(360deg); } }
.ms-rf { display: flex; flex-direction: column; gap: 6px; }
.ms-rf__row {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-size: 12.5px; color: var(--tx-ink-2); line-height: 1.4;
}
.ms-rf__where { text-align: right; color: var(--tx-ink-3); font-size: 12px; &.is-bad { color: var(--tx-sell); } }
.ms-rf__more {
  // a 28 px tall target around a text link (the negative margin keeps the line height)
  background: none; border: 0; padding: 7px 4px; margin: -7px -4px; color: var(--tx-ink-2); font-size: 12px; font-weight: 600; cursor: pointer;
  text-decoration: underline; text-underline-offset: 2px; white-space: nowrap;
  &:hover { color: var(--tx-ink); }
  &--less { align-self: flex-start; }
}
.ms-note-warn { color: var(--tx-warning); }
.ms-note-bad { color: var(--tx-sell); }
</style>
