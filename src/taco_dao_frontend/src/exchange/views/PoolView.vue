<template>
  <div class="pool-view tx-scroll">
    <div class="pool-view__shell">
      <ExchangeTopNav active="pool" />

      <ExchangePageTitle
        label="Liquidity"
        qualifier="pools"
        subtitle="Provide liquidity for TACO pairs. Concentrated ranges earn more fees."
      />

      <!-- Mode segment: All Pools / Add Liquidity -->
      <div class="tx-segment pool-view__segment">
        <button
          :aria-pressed="mode === 'list'"
          @click="mode = 'list'"
        >All Pools</button>
        <button
          :aria-pressed="mode === 'add'"
          @click="mode = 'add'"
        >Add Liquidity</button>
      </div>

      <main class="pool-view__main">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PoolList from '../components/pool/PoolList.vue'
import AddLiquidity from '../components/pool/AddLiquidity.vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'

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
  min-height: 100vh;
  background: var(--tx-bg);
  /* Fluid padding so resize desktop↔mobile has no visible step. */
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 60px;
  overflow-y: auto;

  &__shell {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__segment {
    align-self: flex-start;
  }

  &__main { flex: 1; }
}
</style>
