<template>
  <div class="crossdex-view">
    <div class="crossdex-view__glow" aria-hidden="true"></div>

    <div class="crossdex-view__shell">
      <ExchangeTopNav active="crossdex" />

      <div class="crossdex-view__body">
        <ExchangePageTitle
          label="CrossDEX"
          qualifier="best mix"
          subtitle="Splits one swap across ICPSwap + TACO + Neutrinite for the best total output."
        />

        <main id="ex-main" class="crossdex-view__main">
          <CrossDexCard class="crossdex-view__card" />
        </main>

        <div class="crossdex-view__tip tx-row">
          <div class="crossdex-view__tip-icon">⇄</div>
          <div>
            <div class="crossdex-view__tip-title">All legs run in parallel.</div>
            <div class="tx-ink-3 crossdex-view__tip-body">
              If one DEX fails, its funds are refunded automatically, so nothing gets stuck.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CrossDexCard from '../components/swap/CrossDexCard.vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'
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

  &__tip {
    gap: 10px;
    padding: 10px 14px;
    background: var(--tx-surface-1);
    border: 1px dashed var(--tx-line-2);
    border-radius: var(--tx-r-md);
  }
  &__tip-icon { font-size: 18px; line-height: 1; color: var(--tx-orange); }
  &__tip-title { font-weight: 600; font-size: 13px; color: var(--tx-ink); }
  &__tip-body { font-size: 12px; margin-top: 2px; line-height: 1.4; }
}
</style>
