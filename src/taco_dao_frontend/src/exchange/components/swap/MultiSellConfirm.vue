<template>
  <Teleport to="body">
    <div v-if="visible && plan" class="ms-modal-overlay" data-theme="exchange" @click.self="$emit('cancel')">
      <div class="ms-md" role="dialog" aria-modal="true" aria-label="Confirm sale">
        <h3>Confirm sale</h3>
        <div v-if="backNote" class="ms-md__back">{{ backNote }}</div>
        <div class="ms-md__sec">You sell</div>
        <div class="ms-md__sells">
          <div v-for="a in assets" :key="a.address" class="ms-md__sell">
            <TokenCoin :token="tokenOf(a.address)" :size="20" />
            <span class="num">{{ fmtTok(a.address, a.amountIn) }} {{ a.symbol }}</span>
            <span v-if="isMax(a.address)" class="ms-md__max">Max</span>
            <span class="ms-md__r num">≈ {{ fmtIcp(a.receiveOut) }}</span>
          </div>
        </div>
        <hr class="ms-md__hr" />
        <div class="ms-md__rows">
          <div class="ms-md__row ms-md__row--big"><span>You receive (est.)</span><b class="num">{{ fmtIcp(plan.totalReceiveOut) }}</b></div>
          <div class="ms-md__row"><span>Minimum received</span><b class="num">{{ fmtIcp(plan.totalMinReceive) }}</b></div>
          <div class="ms-md__row"><span>Price impact</span><b class="num">{{ plan.impactPct == null ? '…' : plan.impactPct.toFixed(1) + '%' }}</b></div>
          <div class="ms-md__row"><span>Slippage tolerance</span><b class="num">{{ slippage }}%</b></div>
        </div>
        <hr class="ms-md__hr" />
        <p class="ms-md__note">{{ batchNote }}</p>
        <p v-if="gateNote" class="ms-md__note">{{ gateNote }}</p>
        <p v-if="queueNote" class="ms-md__note">{{ queueNote }}</p>
        <p v-if="anyMax" class="ms-md__note">For tokens at Max, whatever is not needed for fees is sold too.</p>
        <p v-if="poolNote" class="ms-md__note">{{ poolNote }}</p>
        <div class="ms-md__wallet num">Prices updated {{ ageText }} · wallet {{ shortP }}</div>
        <div class="ms-md__acts">
          <button ref="cancelBtn" class="ex-btn ex-btn--ghost" @click="$emit('cancel')">Cancel</button>
          <button class="ex-btn ex-btn--primary" :disabled="cooling || refreshing" @click="onConfirm">
            {{ refreshing ? 'Updating prices…' : assets.length === 1 ? `Sell ${assets[0].symbol}` : `Sell ${assets.length} tokens` }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { formatTokenAmount } from '../../utils/format'
import { joinNames, type BatchPlan } from '../../utils/multiSellPlanner'
import { poolNoteText, queueNoteText } from './multiSellCopy'
import TokenCoin from './TokenCoin.vue'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{
  visible: boolean
  plan: BatchPlan | null
  icp: TokenInfo | null
  slippage: number
  maxRows: string[]
  principal: string
  refreshing?: boolean
  backNote?: string
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const store = useExchangeStore()
const tokenOf = (a: string) => store.getTokenByAddress(a) ?? null
const assets = computed(() => (props.plan?.assets ?? []).filter(a => !a.issue))
// the tokens go out in one batch; the Neutrinite gate and the queued TACO exchange parts say what waits
const batchNote = computed(() => {
  const back = 'Anything that cannot finish goes back to your wallet, minus network fees.'
  const n = assets.value.length
  return n === 1 ? back : n === 2 ? `Both tokens sell in one batch. ${back}` : `All ${n} tokens sell in one batch. ${back}`
})
const queueNote = computed(() => (props.plan ? queueNoteText(props.plan) : ''))
const fmtIcp = (v: bigint) => props.icp ? formatTokenAmount(v, Number(props.icp.decimals), props.icp.symbol) : v.toString()
const fmtTok = (addr: string, v: bigint) => { const t = tokenOf(addr); return t ? formatTokenAmount(v, Number(t.decimals)) : v.toString() }
const isMax = (a: string) => props.maxRows.includes(a)
const anyMax = computed(() => assets.value.some(a => isMax(a.address)))
const shortP = computed(() => (props.principal.length > 12 ? `${props.principal.slice(0, 5)}…${props.principal.slice(-3)}` : props.principal))

const gateNote = computed(() => {
  const g = props.plan?.gate
  if (!g) return ''
  const sym = assets.value.find(a => a.address === g.token)?.symbol ?? ''
  const waitingAssets = [...new Set(g.legs.map(l => l.asset))]
  const allLegs = assets.value.reduce((n, a) => n + a.legs.filter(l => l.dex !== 'neutrinite' || a.address !== g.token).length, 0)
  if (g.legs.length >= allLegs) return `${sym} starts first on Neutrinite. Everything else starts when Neutrinite confirms that deposit, usually within 10 seconds.`
  const own = waitingAssets.includes(g.token)
  const names = waitingAssets.filter(a => a !== g.token).map(a => assets.value.find(x => x.address === a)?.symbol ?? '').filter(Boolean)
  const others = `the ${joinNames(names)} ${names.length === 1 ? 'route' : 'routes'} that use the same markets`
  const who = own && names.length ? `Its other routes and ${others}` : own ? 'Its other routes' : others.charAt(0).toUpperCase() + others.slice(1)
  return `${sym} starts first on Neutrinite. ${who} wait until Neutrinite confirms that deposit, usually within 10 seconds.`
})
const poolNote = computed(() => (props.plan?.note && props.icp ? poolNoteText(props.plan.note, props.icp) : ''))

const now = ref(Date.now())
const tick = setInterval(() => { now.value = Date.now() }, 1000)
onBeforeUnmount(() => clearInterval(tick))
const ageText = computed(() => {
  const s = Math.max(0, Math.round((now.value - (props.plan?.quotedAt ?? now.value)) / 1000))
  return s < 5 ? 'just now' : `${s} s ago`
})

// the button ignores taps for 1 s after the numbers change
const cooling = ref(false)
let coolTimer: ReturnType<typeof setTimeout> | null = null
watch(() => props.plan?.totalReceiveOut, () => {
  cooling.value = true
  if (coolTimer) clearTimeout(coolTimer)
  coolTimer = setTimeout(() => { cooling.value = false }, 1000)
})
function onConfirm() { if (!cooling.value && !props.refreshing) emit('confirm') }

// Keyboard: focus moves into the sheet (Cancel, so Enter never sells by accident), Escape
// cancels wherever focus is, and focus goes back to what opened the sheet when it closes.
const cancelBtn = ref<HTMLButtonElement | null>(null)
let opener: HTMLElement | null = null
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { e.preventDefault(); emit('cancel') } }
watch(() => props.visible && !!props.plan, async (open, was) => {
  if (open && !was) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onKey)
    await nextTick()
    cancelBtn.value?.focus()
  } else if (!open && was) {
    document.removeEventListener('keydown', onKey)
    if (opener?.isConnected) opener.focus()
    opener = null
  }
}, { immediate: true })
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped lang="scss">
@use './multiSellModal' as *;
.ms-md__back {
  font-size: 12.5px; color: var(--tx-warning); background: var(--tx-warning-dim);
  padding: 8px 10px; border-radius: 6px; line-height: 1.45;
}
.ms-md__sells { display: flex; flex-direction: column; gap: 6px; }
.ms-md__sell {
  display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--tx-ink);
  .num { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
.ms-md__max {
  font-size: 10px; font-weight: 700; color: var(--tx-ink-3); border: 1px solid var(--tx-line-2);
  border-radius: 4px; padding: 0 4px; line-height: 15px;
}
.ms-md__r { margin-left: auto; color: var(--tx-ink-3); font-size: 12.5px; white-space: nowrap; }
</style>
