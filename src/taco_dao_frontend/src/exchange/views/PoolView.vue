<template>
  <div class="pool-view">
    <ExchangeHeader />
    <main class="pool-view__main">
      <h1 class="pool-view__heading">Liquidity Pools</h1>

      <!-- Mode Toggle -->
      <div class="pool-view__mode">
        <button
          class="pool-view__mode-btn"
          :class="{ 'pool-view__mode-btn--active': mode === 'list' }"
          @click="mode = 'list'"
        >All Pools</button>
        <button
          class="pool-view__mode-btn"
          :class="{ 'pool-view__mode-btn--active': mode === 'add' }"
          @click="mode = 'add'"
        >Add Liquidity</button>
      </div>

      <PoolList
        v-if="mode === 'list'"
        @addLiquidity="onAddLiquidity"
      />
      <AddLiquidity
        v-else
        :initialToken0="addToken0"
        :initialToken1="addToken1"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExchangeHeader from '../components/layout/ExchangeHeader.vue'
import PoolList from '../components/pool/PoolList.vue'
import AddLiquidity from '../components/pool/AddLiquidity.vue'

const mode = ref<'list' | 'add'>('list')
const addToken0 = ref('')
const addToken1 = ref('')

function onAddLiquidity(token0: string, token1: string) {
  addToken0.value = token0
  addToken1.value = token1
  mode.value = 'add'
}
</script>

<style scoped lang="scss">
.pool-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  background: var(--bg-primary);

  &__main {
    flex: 1 0 auto;
    padding: var(--space-4) var(--space-6);
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
  }

  &__heading {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4);
  }

  &__mode {
    display: flex;
    gap: 2px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 2px;
    margin-bottom: var(--space-4);
    width: fit-content;
  }

  &__mode-btn {
    padding: var(--space-2) var(--space-4);
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;

    &--active {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }
}
</style>
