<template>
  <Teleport to="body">
    <div v-if="visible" class="ms-pick-overlay" data-theme="exchange" @click.self="$emit('close')" @keydown.escape="$emit('close')">
      <div class="ms-pick" role="dialog" aria-modal="true" aria-label="Choose tokens to sell">
        <div class="ms-pick__h">
          <div>
            <h3>Choose tokens to sell</h3>
            <p>Everything you pick is sold for ICP.</p>
          </div>
          <button class="ms-pick__close" aria-label="Close" @click="$emit('close')">
            <svg width="18" height="18" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="ms-pick__search">
          <input ref="searchEl" v-model="search" class="ex-input" placeholder="Search your tokens" aria-label="Search your tokens" />
        </div>

        <div class="ms-pick__list">
          <template v-if="loading && entries.length === 0">
            <div v-for="i in 5" :key="i" class="ms-pick__row">
              <span class="ex-skeleton" style="width:18px;height:18px"></span>
              <span class="ex-skeleton" style="width:28px;height:28px;border-radius:50%"></span>
              <span class="ex-skeleton" style="width:90px;height:14px"></span>
              <span class="ex-skeleton" style="width:70px;height:14px"></span>
            </div>
          </template>
          <div v-else-if="entries.length === 0" class="ms-pick__empty">
            Nothing to sell yet. Your wallet has no tokens besides ICP.
          </div>
          <template v-else>
            <button
              v-for="e in mainList"
              :key="e.token.address"
              class="ms-pick__row"
              :class="{ 'is-on': isOn(e), 'is-dis': isDisabled(e) }"
              :disabled="isDisabled(e)"
              role="checkbox"
              :aria-checked="isOn(e)"
              @click="toggle(e)"
            >
              <span class="ms-ck" :class="{ 'ms-ck--on': isOn(e) }">
                <svg v-if="isOn(e)" width="11" height="11" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <TokenCoin :token="e.token" :size="28" />
              <span class="ms-pick__id">
                <span class="ms-pick__sym">{{ e.token.symbol }}</span>
                <span class="ms-pick__name">{{ e.token.name }}</span>
              </span>
              <span class="ms-pick__r">
                <template v-if="e.noMarket"><span class="ms-pick__tag">No ICP market here</span></template>
                <template v-else-if="e.tooSmall"><span class="ms-pick__tag">Too small to sell</span></template>
                <template v-else>
                  <span class="ms-pick__amt num">{{ e.amountText }}</span>
                  <span class="ms-pick__usd num">{{ e.usdText }}</span>
                </template>
              </span>
            </button>

            <button v-if="smallList.length" class="ms-pick__sec" @click="smallOpen = !smallOpen" :aria-expanded="smallOpen">
              <span>Small balances ({{ smallList.length }})</span>
              <span aria-hidden="true">{{ smallOpen ? '▴' : '▾' }}</span>
            </button>
            <template v-if="smallOpen">
              <button
                v-for="e in smallList"
                :key="e.token.address"
                class="ms-pick__row"
                :class="{ 'is-on': isOn(e), 'is-dis': isDisabled(e) }"
                :disabled="isDisabled(e)"
                role="checkbox"
                :aria-checked="isOn(e)"
                @click="toggle(e)"
              >
                <span class="ms-ck" :class="{ 'ms-ck--on': isOn(e) }">
                  <svg v-if="isOn(e)" width="11" height="11" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <TokenCoin :token="e.token" :size="28" />
                <span class="ms-pick__id">
                  <span class="ms-pick__sym">{{ e.token.symbol }}</span>
                  <span class="ms-pick__name">{{ e.token.name }}</span>
                </span>
                <span class="ms-pick__r">
                  <template v-if="e.noMarket"><span class="ms-pick__tag">No ICP market here</span></template>
                  <template v-else-if="e.tooSmall"><span class="ms-pick__tag">Too small to sell</span></template>
                  <template v-else>
                    <span class="ms-pick__amt num">{{ e.amountText }}</span>
                    <span class="ms-pick__usd num">{{ e.usdText }}</span>
                  </template>
                </span>
              </button>
            </template>
          </template>
        </div>

        <div class="ms-pick__f">
          <small>
            <template v-if="loading">Loading your balances…</template>
            <template v-else>{{ picked.length }} selected, {{ pickedUsd }}<br />Up to {{ MAX }} tokens per sale</template>
          </small>
          <button class="ex-btn ex-btn--primary" :disabled="picked.length === 0" @click="apply">
            {{ picked.length === 0 ? 'Pick at least one token' : editing ? 'Done' : picked.length === 1 ? 'Add 1 token' : `Add ${picked.length} tokens` }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { useHoldings } from '../../composables/useHoldings'
import { useIcpMarkets } from '../../composables/useIcpMarkets'
import { ICP_LEDGER_ID, FEE_HEADROOM_LEDGERS } from '../../constants/tokens'
import { crossDexMax } from '../../utils/crossDexCosts'
import { formatTokenAmount, formatUSD } from '../../utils/format'
import { MAX_TOKENS_PER_SALE } from '../../utils/multiSellPlanner'
import TokenCoin from './TokenCoin.vue'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{ visible: boolean; selected: string[] }>()
const emit = defineEmits<{ done: [addresses: string[]]; close: [] }>()

const MAX = MAX_TOKENS_PER_SALE
const store = useExchangeStore()
const holdings = useHoldings()
const markets = useIcpMarkets()
const search = ref('')
const searchEl = ref<HTMLInputElement | null>(null)
const picked = ref<string[]>([])
const smallOpen = ref(false)
const editing = computed(() => props.selected.length > 0)

watch(() => props.visible, async (v) => {
  if (!v) return
  picked.value = [...props.selected]
  search.value = ''
  holdings.ensureBalances(store.tokens)
  markets.ensure(store.tokens.filter(t => t.address !== ICP_LEDGER_ID).map(t => t.address))
  await nextTick()
  searchEl.value?.focus()
}, { immediate: true })

interface Entry { token: TokenInfo; usd: number; amountText: string; usdText: string; tooSmall: boolean; noMarket: boolean; small: boolean }

const loading = computed(() => store.tokens.some(t => t.address !== ICP_LEDGER_ID && holdings.balanceOf(t) == null) && store.isAuthenticated)

const entries = computed<Entry[]>(() => {
  const out: Entry[] = []
  for (const t of store.tokens) {
    if (t.address === ICP_LEDGER_ID) continue
    const bal = holdings.balanceOf(t)
    if (bal == null || bal <= 0n) continue
    const usd = holdings.usdValue(t)
    const v2 = !FEE_HEADROOM_LEDGERS.has(t.address) && store.useV2Deposit(t.address)
    const max = crossDexMax(bal, t.transfer_fee, store.tradingFeeBps, v2, FEE_HEADROOM_LEDGERS.has(t.address))
    const hasPrice = store.getTokenPriceUSD(t.address) > 0
    out.push({
      token: t,
      usd,
      amountText: formatTokenAmount(bal, Number(t.decimals)),
      usdText: hasPrice ? formatUSD(usd) : 'No price',
      tooSmall: max <= 0n,
      noMarket: markets.hasIcpMarket(t.address) === false,
      small: hasPrice ? usd < 1 : max <= 0n,
    })
  }
  return out.sort((a, b) => b.usd - a.usd || a.token.symbol.localeCompare(b.token.symbol))
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return entries.value
  return entries.value.filter(e => e.token.symbol.toLowerCase().includes(q) || e.token.name.toLowerCase().includes(q) || e.token.address.toLowerCase().includes(q))
})
const mainList = computed(() => filtered.value.filter(e => !e.small))
const smallList = computed(() => filtered.value.filter(e => e.small))

const isOn = (e: Entry) => picked.value.includes(e.token.address)
const isDisabled = (e: Entry) => !isOn(e) && (e.tooSmall || e.noMarket || picked.value.length >= MAX)
function toggle(e: Entry) {
  if (isOn(e)) picked.value = picked.value.filter(a => a !== e.token.address)
  else if (!isDisabled(e)) picked.value = [...picked.value, e.token.address]
}
const pickedUsd = computed(() => formatUSD(picked.value.reduce((s, a) => s + (entries.value.find(e => e.token.address === a)?.usd ?? 0), 0)))

function apply() {
  if (picked.value.length === 0) return
  // keep the basket order, new ones after it in the order they were picked
  const ordered = [...props.selected.filter(a => picked.value.includes(a)), ...picked.value.filter(a => !props.selected.includes(a))]
  emit('done', ordered)
}
</script>

<style scoped lang="scss">
.ms-pick-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: var(--tx-overlay);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ms-pick {
  width: 100%; max-width: 420px; max-height: min(640px, 88vh);
  background: linear-gradient(135deg, var(--tx-surface-2), var(--tx-surface-1));
  border: 1px solid var(--tx-line-2); border-radius: 12px; box-shadow: var(--tx-shadow-2);
  display: flex; flex-direction: column; overflow: hidden; color: var(--tx-ink);

  &__h {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 16px 16px 12px; border-bottom: 1px solid var(--tx-line);
    h3 { margin: 0; font-size: 16px; font-weight: 600; }
    p { margin: 3px 0 0; font-size: 12px; color: var(--tx-ink-3); }
  }
  &__close { background: none; border: 0; color: var(--tx-ink-3); padding: 2px; cursor: pointer; &:hover { color: var(--tx-ink); } }
  &__search { padding: 12px 16px 8px; input { width: 100%; } }
  &__list { overflow-y: auto; flex: 1; min-height: 120px; }
  &__empty { padding: 28px 16px; text-align: center; font-size: 13px; color: var(--tx-ink-3); line-height: 1.45; }
  &__row {
    display: grid; grid-template-columns: 18px 28px 1fr auto; gap: 12px; align-items: center;
    width: 100%; padding: 9px 16px; background: none; border: 0; text-align: left; color: inherit; cursor: pointer;
    &:hover:not(:disabled) { background: var(--tx-surface-3); }
    &.is-on { background: var(--tx-orange-dim); }
    &.is-dis { opacity: 0.45; cursor: default; }
  }
  &__id { display: flex; flex-direction: column; min-width: 0; }
  &__sym { font-weight: 600; font-size: 14px; }
  &__name { font-size: 11px; color: var(--tx-ink-3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__r { display: flex; flex-direction: column; align-items: flex-end; }
  &__amt { font-size: 13px; font-weight: 500; }
  &__usd { font-size: 11px; color: var(--tx-ink-3); margin-top: 1px; }
  &__tag { font-size: 11px; color: var(--tx-ink-3); }
  &__sec {
    display: flex; justify-content: space-between; align-items: center; width: 100%;
    padding: 12px 16px 6px; background: none; border: 0; cursor: pointer;
    font-size: 10.5px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--tx-ink-3);
  }
  &__f {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 16px; border-top: 1px solid var(--tx-line); background: var(--tx-surface-1);
    small { font-size: 11.5px; color: var(--tx-ink-3); line-height: 1.35; }
  }
}
.ms-ck {
  width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--tx-line-hi); background: var(--tx-surface-2);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;
  &--on { background: var(--tx-orange); border-color: var(--tx-orange); }
}
@media (max-width: 600px) {
  .ms-pick-overlay { padding: 0; align-items: stretch; }
  .ms-pick { max-width: none; max-height: none; border-radius: 0; border: 0; }
  .ms-pick__f { position: sticky; bottom: 0; padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
}
</style>
