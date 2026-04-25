<template>
  <div class="pair-selector" ref="rootRef">
    <button
      class="pair-selector__btn"
      @click="open = !open"
      aria-haspopup="listbox"
      :aria-expanded="open"
    >
      <span class="pair-selector__mark" v-if="baseIcon || quoteIcon">
        <img v-if="baseIcon" :src="baseIcon" width="16" height="16" />
        <img
          v-if="quoteIcon"
          :src="quoteIcon"
          class="pair-selector__mark--quote"
          width="16"
          height="16"
        />
      </span>
      <span v-else class="pair-selector__markfallback">t</span>
      <span class="pair-selector__symbols">{{ currentPairLabel }}</span>
      <span class="tx-ink-3 pair-selector__chev" :class="{ 'pair-selector__chev--open': open }">▾</span>
    </button>

    <div v-if="open" class="pair-selector__dropdown">
      <input
        ref="searchRef"
        v-model="search"
        class="ex-input pair-selector__search"
        placeholder="Search pairs..."
        @keydown.escape="open = false"
      />
      <div class="pair-selector__hdr">
        <span class="pair-selector__hdr-col pair-selector__hdr-name" @click="toggleSort('pair')">Pair{{ sortIndicator('pair') }}</span>
        <span class="pair-selector__hdr-col" @click="toggleSort('usd')">USD{{ sortIndicator('usd') }}</span>
        <span class="pair-selector__hdr-col" @click="toggleSort('price')">Price{{ sortIndicator('price') }}</span>
        <span class="pair-selector__hdr-col" @click="toggleSort('change')">24h{{ sortIndicator('change') }}</span>
      </div>
      <div class="pair-selector__list" role="listbox">
        <div v-if="filteredPairs.length === 0" class="pair-selector__empty">
          No pairs found
        </div>
        <button
          v-for="pair in filteredPairs"
          :key="`${pair.base}-${pair.quote}`"
          class="pair-selector__option"
          :class="{ 'pair-selector__option--active': pair.base === store.selectedToken0 && pair.quote === store.selectedToken1 }"
          role="option"
          @click="select(pair)"
        >
          <span class="pair-selector__name">{{ pair.baseSymbol }}/{{ pair.quoteSymbol }}</span>
          <span v-if="pair.priceUSD" class="pair-selector__usd num">{{ pair.priceUSD }}</span>
          <span class="pair-selector__price num">{{ pair.lastPrice ?? '—' }}</span>
          <span
            v-if="pair.change24h !== null"
            class="pair-selector__change num"
            :class="pair.change24h >= 0 ? 'pair-selector__change--up' : 'pair-selector__change--down'"
          >{{ pair.change24h >= 0 ? '+' : '' }}{{ pair.change24h.toFixed(2) }}%</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExchangeStore } from '../../store/exchange.store'
import { useExchangePairs, type PairOption } from '../../composables/useExchangePairs'
import { getTokenIcon } from '../../utils/token-icons'

const store = useExchangeStore()
const router = useRouter()
const route = useRoute()
const { availablePairs } = useExchangePairs()

const open = ref(false)
const search = ref('')
const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

type SortKey = 'pair' | 'usd' | 'price' | 'change'
const sortKey = ref<SortKey | null>(null)
const sortAsc = ref(false)

function toggleSort(key: SortKey) {
  if (sortKey.value === key) { sortAsc.value = !sortAsc.value }
  else { sortKey.value = key; sortAsc.value = key === 'pair' }
}
function sortIndicator(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortAsc.value ? ' ▲' : ' ▼'
}

const filteredPairs = computed(() => {
  let list = availablePairs.value
  const q = search.value.toLowerCase()
  if (q) {
    list = list.filter(p =>
      p.baseSymbol.toLowerCase().includes(q) ||
      p.quoteSymbol.toLowerCase().includes(q),
    )
  }
  if (!sortKey.value) return list
  const dir = sortAsc.value ? 1 : -1
  return [...list].sort((a, b) => {
    switch (sortKey.value) {
      case 'pair':   return dir * `${a.baseSymbol}/${a.quoteSymbol}`.localeCompare(`${b.baseSymbol}/${b.quoteSymbol}`)
      case 'usd': {
        const au = parseFloat(a.priceUSD?.replace(/[$,]/g, '') ?? '0')
        const bu = parseFloat(b.priceUSD?.replace(/[$,]/g, '') ?? '0')
        return dir * (au - bu)
      }
      case 'price': {
        const ap = parseFloat(a.lastPrice ?? '0')
        const bp = parseFloat(b.lastPrice ?? '0')
        return dir * (ap - bp)
      }
      case 'change': return dir * ((a.change24h ?? 0) - (b.change24h ?? 0))
      default: return 0
    }
  })
})

const currentPairLabel = computed(() => {
  if (!store.selectedToken0 || !store.selectedToken1) return 'Select Pair'
  const base = store.getTokenByAddress(store.selectedToken0)
  const quote = store.getTokenByAddress(store.selectedToken1)
  return `${base?.symbol ?? '???'} / ${quote?.symbol ?? '???'}`
})

const baseIcon = computed(() => {
  const t = store.getTokenByAddress(store.selectedToken0)
  return t ? getTokenIcon(t.symbol, t.name) : null
})
const quoteIcon = computed(() => {
  const t = store.getTokenByAddress(store.selectedToken1)
  return t ? getTokenIcon(t.symbol, t.name) : null
})

function select(pair: PairOption) {
  store.selectedToken0 = pair.base
  store.selectedToken1 = pair.quote
  open.value = false
  search.value = ''

  // If not on a trading route, route to the user's preferred trading view.
  const path = route.path
  if (path !== '/' && path !== '/easy' && path !== '/trade') {
    const isMobile = window.innerWidth <= 767
    router.push(isMobile ? '/trade' : '/')
  }
}

watch(open, async (isOpen) => {
  if (isOpen && window.innerWidth > 767) {
    await nextTick()
    searchRef.value?.focus()
  }
})

function onOutsideClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('click', onOutsideClick))
onUnmounted(() => document.removeEventListener('click', onOutsideClick))
</script>

<style scoped lang="scss">
.pair-selector {
  position: relative;

  &__btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--tx-surface-2);
    border: 1px solid var(--tx-line);
    color: var(--tx-ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: var(--tx-r-md);
    transition: border-color 140ms, background 140ms;

    &:hover { border-color: var(--tx-line-hi); background: var(--tx-surface-3); }
  }

  &__mark {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    img { border-radius: 50%; width: 16px; height: 16px; object-fit: cover; }
    &--quote { margin-left: -4px; border: 1.5px solid var(--tx-surface-2); }
  }
  &__markfallback {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--tx-orange);
    color: #0b0906;
    font-size: 9px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__symbols { font-weight: 600; }
  &__chev {
    font-size: 11px;
    transition: transform 140ms;
    &--open { transform: rotate(180deg); }
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 340px;
    background: var(--tx-panel-bg-2);
    border: 1px solid var(--tx-line-2);
    border-radius: var(--tx-r-lg);
    box-shadow: var(--tx-shadow-2);
    z-index: 200;
    overflow: hidden;

    @media (max-width: 767px) {
      position: fixed;
      top: 52px;
      left: 8px;
      right: 8px;
      width: auto;
      max-height: 70vh;
    }
  }
  &__search {
    margin: 8px;
    width: calc(100% - 16px);
  }
  &__hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    font-size: 10px;
    color: var(--tx-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--tx-line);
    user-select: none;
  }
  &__hdr-col {
    cursor: pointer;
    flex: 1;
    text-align: left;
    &:hover { color: var(--tx-ink); }
  }
  &__hdr-name { min-width: 90px; flex: none; }

  &__list {
    max-height: 300px;
    overflow-y: auto;
  }
  &__empty {
    padding: 14px;
    color: var(--tx-ink-3);
    font-size: 13px;
    text-align: center;
  }
  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid var(--tx-line);
    color: var(--tx-ink);
    font-size: 13px;
    cursor: pointer;
    text-align: left;

    &:hover { background: var(--tx-surface-1); }
    &--active { background: var(--tx-orange-dim); }
  }
  &__name {
    font-weight: 500;
    min-width: 90px;
  }
  &__usd, &__price {
    color: var(--tx-ink-3);
    font-size: 11px;
    min-width: 50px;
  }
  &__change {
    font-size: 11px;
    min-width: 55px;
    margin-left: auto;

    &--up   { color: var(--tx-buy); }
    &--down { color: var(--tx-sell); }
  }
}
</style>
