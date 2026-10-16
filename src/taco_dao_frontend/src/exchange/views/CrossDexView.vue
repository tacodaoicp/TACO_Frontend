<template>
  <div class="crossdex-view">
    <div class="crossdex-view__glow" aria-hidden="true"></div>

    <div class="crossdex-view__shell">
      <ExchangeTopNav active="crossdex" />

      <div class="crossdex-view__body">
        <ExchangePageTitle
          label="CrossDEX"
          qualifier="best mix"
          :subtitle="mode === 'many'
            ? 'All your tokens sell at the same time, each on the DEXes that pay the most ICP for it.'
            : 'Splits one swap across ICPSwap + TACO + Neutrinite for the best total output.'"
        />

        <main id="ex-main" class="crossdex-view__main">
          <CrossDexCard v-show="mode === 'swap'" class="crossdex-view__card">
            <template #title><CrossDexModeSwitch :model-value="mode" :disabled="switchLocked" @update:model-value="setMode" /></template>
          </CrossDexCard>
          <MultiSellCard v-if="manyMounted" v-show="mode === 'many'" class="crossdex-view__card">
            <template #title><CrossDexModeSwitch :model-value="mode" :disabled="switchLocked" @update:model-value="setMode" /></template>
            <template #banner>
              <div v-if="ms.finishingRoutes.value > 0 && ms.run.value?.dismissed" class="crossdex-view__banner">
                Your last sale is still finishing {{ ms.finishingRoutes.value === 1 ? '1 route' : `${ms.finishingRoutes.value} routes` }}.
              </div>
              <div v-if="interrupted" class="crossdex-view__banner crossdex-view__banner--warn">
                <strong>Your last sale did not finish</strong>
                <span>It stopped {{ interruptedAgo }} ago, before every part was done. Open the Recover page to get back anything left on a DEX.</span>
                <span class="crossdex-view__banner-acts">
                  <router-link to="/recover" class="ex-btn ex-btn--sm ex-btn--primary">Open Recover page</router-link>
                  <button class="ex-btn ex-btn--sm ex-btn--ghost" @click="dismissInterrupted">Dismiss</button>
                </span>
              </div>
            </template>
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
              The other routes start once it has your deposit. If one DEX fails, its funds are refunded automatically, so nothing gets stuck.
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
  overflow: hidden;

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

  &__banner {
    font-size: 12.5px; line-height: 1.45; color: var(--tx-ink-2);
    background: var(--tx-info-dim); border-radius: 8px; padding: 8px 10px;
    display: flex; flex-direction: column; gap: 4px;
    &--warn { background: var(--tx-warning-dim); color: var(--tx-ink); strong { color: var(--tx-warning); } }
  }
  &__banner-acts { display: flex; gap: 6px; margin-top: 4px; }

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
