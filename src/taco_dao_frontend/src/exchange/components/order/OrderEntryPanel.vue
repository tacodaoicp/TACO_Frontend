<template>
  <div class="order-entry-panel">
    <!-- Tab Bar -->
    <div class="ex-tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="ex-tab-btn order-entry-panel__tab"
        :class="{ 'ex-tab-btn--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- Tab Content -->
    <div class="order-entry-panel__content">
      <LimitOrderForm
        v-if="activeTab === 'limit'"
        :token0="props.token0"
        :token1="props.token1"
        :decimals0="props.decimals0"
        :decimals1="props.decimals1"
        :prefilledPrice="props.prefilledPrice"
        :prefilledSide="props.prefilledSide"
        :prefilledAmount="props.prefilledAmount"
      />
      <MarketOrderForm
        v-else-if="activeTab === 'market'"
        :token0="token0"
        :token1="token1"
        :decimals0="decimals0"
        :decimals1="decimals1"
        :prefilledSide="props.prefilledSide"
        :prefilledAmount="props.prefilledAmount"
        :prefilledPrice="props.prefilledPrice"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LimitOrderForm from './LimitOrderForm.vue'
import MarketOrderForm from './MarketOrderForm.vue'

const props = defineProps<{
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  prefilledPrice?: number | null
  prefilledSide?: 'buy' | 'sell' | null
  // Cumulative base-token amount from orderbook click (sweep-up-to-this-level)
  prefilledAmount?: number | null
}>()

// Auto-switch to limit tab when orderbook click comes in
import { watch } from 'vue'
watch(() => props.prefilledPrice, () => {
  if (props.prefilledPrice != null) activeTab.value = 'limit'
})

const tabs = [
  { key: 'limit', label: 'Limit' },
  { key: 'market', label: 'Market' },
]

const activeTab = ref('limit')
</script>

<style scoped lang="scss">
.order-entry-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tx-bg);

  &__tab {
    flex: 1;
    justify-content: center;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
  }

  @media (max-width: 767px) {
    &__tab {
      padding: 6px 8px;
      font-size: 12px;
    }
  }
}
</style>
