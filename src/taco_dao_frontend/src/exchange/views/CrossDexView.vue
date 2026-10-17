<template>
  <div class="crossdex-view">
    <!-- the glow is clipped by its own box: the page itself must not clip (overflow hidden makes it
         a scroll container, and the phone's sticky You receive bar then never sticks) -->
    <div class="crossdex-view__glow-clip" aria-hidden="true"><div class="crossdex-view__glow"></div></div>

    <div class="crossdex-view__shell">
      <ExchangeTopNav active="crossdex" />

      <div class="crossdex-view__body">
        <ExchangePageTitle label="CrossDEX" qualifier="best mix">
          <!-- both subtitles share one grid cell, so the box is as tall as the longer one in either
               mode and a wrap of one can never move the mode switch -->
          <template #sub>
            <span class="crossdex-view__subs">
              <span :class="{ 'is-off': mode !== 'swap' }" :aria-hidden="mode !== 'swap'">Splits one swap across ICPSwap + TACO + Neutrinite for the best total output.</span>
              <span :class="{ 'is-off': mode !== 'many' }" :aria-hidden="mode !== 'many'">Your tokens sell in one batch, each on the DEXes that pay the most ICP.</span>
            </span>
          </template>
        </ExchangePageTitle>

        <!-- above both modes: Single swap is the default, and a sale's state matters whichever card shows.
             The sale is named per mode; both names share one grid cell (as the subtitles do), so a
             banner is as tall in either mode and switching never moves the mode switch below it. -->
        <div v-if="finishing || finished || interrupted" class="crossdex-view__banners">
          <div v-if="finishing" class="crossdex-view__banner">
            <span class="crossdex-view__alt">
              <span v-for="s in saleNames" :key="s.mode" :class="{ 'is-off': mode !== s.mode }" :aria-hidden="mode !== s.mode">
                <template v-if="ms.run.value?.phase === 'preparing'">{{ s.name }} is waiting for its approval. Nothing has been sold yet.</template>
                <template v-else>{{ s.name }} is still finishing{{ ms.finishingRoutes.value > 0 ? ` ${ms.finishingRoutes.value === 1 ? '1 route' : `${ms.finishingRoutes.value} routes`}` : '' }}. Keep this page open.</template>
              </span>
            </span>
            <span class="crossdex-view__banner-acts">
              <button class="ex-btn ex-btn--sm ex-btn--primary" @click="ms.reopenRun()">View</button>
            </span>
          </div>
          <div v-else-if="finished" class="crossdex-view__banner">
            <span class="crossdex-view__alt">
              <span v-for="s in saleNames" :key="s.mode" :class="{ 'is-off': mode !== s.mode }" :aria-hidden="mode !== s.mode">{{ s.name }} {{ ms.run.value?.phase === 'stopped' ? 'did not start.' : 'has finished.' }}</span>
            </span>
            <span class="crossdex-view__banner-acts">
              <button class="ex-btn ex-btn--sm ex-btn--primary" @click="ms.reopenRun()">View the result</button>
            </span>
          </div>
          <div v-if="interrupted" class="crossdex-view__banner crossdex-view__banner--warn">
            <strong class="crossdex-view__alt">
              <span v-for="s in saleNames" :key="s.mode" :class="{ 'is-off': mode !== s.mode }" :aria-hidden="mode !== s.mode">{{ s.name }} did not finish</span>
            </strong>
            <span>It stopped {{ interruptedAgo }} ago, before every part was done. Open the Recover page to get back anything left on a DEX.</span>
            <span class="crossdex-view__banner-acts">
              <router-link to="/recover" class="ex-btn ex-btn--sm ex-btn--primary">Open Recover page</router-link>
              <button class="ex-btn ex-btn--sm ex-btn--ghost" @click="dismissInterrupted">Dismiss</button>
            </span>
          </div>
        </div>

        <main id="ex-main" class="crossdex-view__main">
          <CrossDexCard v-show="mode === 'swap'" class="crossdex-view__card">
            <template #title><CrossDexModeSwitch :model-value="mode" :disabled="switchLocked" @update:model-value="setMode" /></template>
          </CrossDexCard>
          <MultiSellCard v-if="manyMounted" v-show="mode === 'many'" class="crossdex-view__card">
            <template #title><CrossDexModeSwitch :model-value="mode" :disabled="switchLocked" @update:model-value="setMode" /></template>
          </MultiSellCard>
        </main>

        <div v-if="mode === 'many'" class="crossdex-view__tip tx-row">
          <div class="crossdex-view__tip-icon">⇄</div>
          <div>
            <div class="crossdex-view__tip-title">If part of a sale fails</div>
            <div class="tx-ink-3 crossdex-view__tip-body">
              Anything that cannot finish goes back to your wallet, minus network fees. The summary shows anything that needs the <router-link to="/recover">Recover page</router-link>.
            </div>
          </div>
        </div>
        <div v-else class="crossdex-view__tip tx-row">
          <div class="crossdex-view__tip-icon">⇄</div>
          <div>
            <div class="crossdex-view__tip-title">Neutrinite goes first when it is part of the mix.</div>
            <div class="tx-ink-3 crossdex-view__tip-body">
              The other routes start once it has your deposit. If one DEX fails, its funds are refunded automatically.
            </div>
          </div>
        </div>
      </div>
    </div>

    <MultiSellRunModal
      v-if="viewActive && manyMounted"
      :run="ms.run.value && !ms.run.value.dismissed ? ms.run.value : null"
      :icp="ms.icp.value"
      @done="ms.done()"
      @back="ms.done()"
      @recover="goRecover"
      @portfolio="goPortfolio"
      @connect="reconnect"
      @hide="ms.hideRun()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onActivated, onDeactivated, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import CrossDexCard from '../components/swap/CrossDexCard.vue'
import CrossDexModeSwitch from '../components/swap/CrossDexModeSwitch.vue'
import MultiSellCard from '../components/swap/MultiSellCard.vue'
import MultiSellRunModal from '../components/swap/MultiSellRunModal.vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'
import { useMultiSell } from '../composables/useMultiSell'
import { useExchangeAuth } from '../composables/useExchangeAuth'
import { useExchangeStore } from '../store/exchange.store'
import { useInterruptedSale } from '../composables/useInterruptedSale'
import { dedupLedgers } from '../utils/ledgerDedup'

const route = useRoute()
const router = useRouter()
const auth = useExchangeAuth()
const store = useExchangeStore()
const ms = useMultiSell()
const { interrupted, interruptedAgo, dismissInterrupted, check: checkInterrupted } = useInterruptedSale()

// Swap on every fresh entry; ?mode=many keeps Sell many across a reload; ?sell= (Portfolio Trade) forces Swap.
const mode = ref<'swap' | 'many'>('swap')
const manyMounted = ref(false)
function modeFromRoute() {
  if (typeof route.query.sell === 'string') return 'swap'
  return route.query.mode === 'many' ? 'many' : 'swap'
}
watch(() => [route.query.mode, route.query.sell], () => {
  if (route.name !== 'CrossDEX') return
  mode.value = modeFromRoute()
}, { immediate: true })
watch(mode, (m) => { if (m === 'many') manyMounted.value = true }, { immediate: true })
// a sale that runs (or still finishes) shows its modal whatever the mode
watch(() => ms.run.value, (r) => { if (r) manyMounted.value = true }, { immediate: true })

function setMode(m: 'swap' | 'many') {
  mode.value = m
  const { mode: _m, ...rest } = route.query
  router.replace({ query: m === 'many' ? { ...rest, mode: 'many' } : rest })
}
const switchLocked = computed(() => ms.isBusy.value)
/** The banners sit above both modes: in Single swap they name the mode the sale came from. */
const saleNames = [
  { mode: 'swap', name: 'Your last Sell many sale' },
  { mode: 'many', name: 'Your last sale' },
] as const
/** A result closed while a route was still running, and that result once every route settled. */
const finishing = computed(() => !!ms.run.value?.dismissed && !ms.run.value.settled)
const finished = computed(() => !!ms.run.value?.dismissed && !!ms.run.value.settled)

const viewActive = ref(true)
onActivated(() => { viewActive.value = true; void checkInterrupted() })
onDeactivated(() => { viewActive.value = false })
onMounted(() => {
  void checkInterrupted()
  // warm the deduplicating ledger list (two anonymous queries, cached 24 h) before any Confirm
  void dedupLedgers()
})
watch(() => store.principalText, () => { void checkInterrupted() })

// Browser back while a sale runs: it keeps going; ask before leaving.
onBeforeRouteLeave(() => {
  if (!ms.isBusy.value) return true
  return window.confirm('Your sale is still running. It keeps going if you leave, and you can come back to CrossDEX to see it.')
})

function goRecover() { void ms.done(); void router.push('/recover') }
function goPortfolio() { void ms.done(); void router.push('/portfolio') }
function reconnect() { void ms.done(); void auth.connect() }
</script>

<style scoped lang="scss">
.crossdex-view {
  position: relative;
  min-height: 100vh;
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 60px;
  background: var(--tx-bg);
  // clip, not hidden: clipping keeps the view out of the scroll container chain, so position
  // sticky inside it (the phone's You receive bar) sticks to the viewport
  overflow-x: clip;

  &__glow-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  &__glow {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    width: 520px;
    height: 320px;
    background: radial-gradient(ellipse at center, var(--tx-orange-dim) 0%, transparent 65%);
    pointer-events: none;
    filter: blur(20px);
    z-index: 0;
  }

  &__shell {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__body {
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__main { display: flex; justify-content: center; }
  &__card { width: 100%; }

  &__subs, &__alt {
    display: grid;
    > span { grid-area: 1 / 1; }
    .is-off { visibility: hidden; }
  }

  &__banners { display: flex; flex-direction: column; gap: 8px; }
  &__banner {
    font-size: 12.5px; line-height: 1.45; color: var(--tx-ink-2);
    background: var(--tx-info-dim); border-radius: 8px; padding: 8px 10px;
    display: flex; flex-direction: column; gap: 4px;
    &--warn { background: var(--tx-warning-dim); color: var(--tx-ink); strong { color: var(--tx-warning); } }
  }
  &__banner-acts {
    display: flex; gap: 6px; margin-top: 4px;
    // a finger sized target on touch screens
    @media (pointer: coarse) { .ex-btn { min-height: 40px; padding: 0 14px; } }
  }

  &__tip {
    gap: 10px;
    padding: 10px 14px;
    background: var(--tx-surface-1);
    border: 1px dashed var(--tx-line-2);
    border-radius: var(--tx-r-md);
    a { color: var(--tx-orange); text-decoration: underline; text-underline-offset: 2px; }
  }
  &__tip-icon { font-size: 18px; line-height: 1; color: var(--tx-orange); }
  &__tip-title { font-weight: 600; font-size: 13px; color: var(--tx-ink); }
  &__tip-body { font-size: 12px; margin-top: 2px; line-height: 1.4; }
}
</style>
