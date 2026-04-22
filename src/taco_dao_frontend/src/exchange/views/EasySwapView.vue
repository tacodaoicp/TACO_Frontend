<template>
  <div class="easy-swap-view">
    <ExchangeHeader />
    <main id="ex-main" class="easy-swap-view__main">
      <SwapCard class="easy-swap-view__card" />
    </main>
  </div>
</template>

<script setup lang="ts">
import ExchangeHeader from '../components/layout/ExchangeHeader.vue'
import SwapCard from '../components/swap/SwapCard.vue'
</script>

<style scoped lang="scss">
.easy-swap-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);

  &__main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    overflow-y: auto;
  }

  &__card {
    max-width: 480px;
    width: 100%;
  }
}
</style>
