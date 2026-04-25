<template>
  <div class="easy-swap-view">
    <div class="easy-swap-view__glow" aria-hidden="true"></div>

    <div class="easy-swap-view__shell">
      <ExchangeTopNav active="easy" />

      <div class="easy-swap-view__body">
        <ExchangePageTitle
          label="Swap"
          qualifier="instantly"
          subtitle="Best route across TACO pools. No wrappers, no bridges."
        />

        <main id="ex-main" class="easy-swap-view__main">
          <SwapCard class="easy-swap-view__card" />
        </main>

        <!-- Trusted-tokens tip (no food emoji per Exchange voice — neutral glyph) -->
        <div class="easy-swap-view__tip tx-row">
          <div class="easy-swap-view__tip-icon">◎</div>
          <div>
            <div class="easy-swap-view__tip-title">Trusted tokens only.</div>
            <div class="tx-ink-3 easy-swap-view__tip-body">
              DAO-voted token list, contact us on our Socials for any token suggestions.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SwapCard from '../components/swap/SwapCard.vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'
</script>

<style scoped lang="scss">
.easy-swap-view {
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

  // Full-width shell (nav aligns with Pool/Portfolio at 1200px)
  &__shell {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  // Narrow body for the swap card (keeps the 480px Figma spec)
  &__body {
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__main {
    display: flex;
    justify-content: center;
  }

  &__card {
    width: 100%;
  }

  &__tip {
    gap: 10px;
    padding: 10px 14px;
    background: var(--tx-surface-1);
    border: 1px dashed var(--tx-line-2);
    border-radius: var(--tx-r-md);
  }
  &__tip-icon {
    font-size: 18px;
    line-height: 1;
    color: var(--tx-orange);
  }
  &__tip-title {
    font-weight: 600;
    font-size: 13px;
    color: var(--tx-ink);
  }
  &__tip-body {
    font-size: 12px;
    margin-top: 2px;
    line-height: 1.4;
  }
}
</style>
