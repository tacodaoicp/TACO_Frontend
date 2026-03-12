<template>

  <div v-if="nachosEstimate" class="mint-estimate taco-container taco-container--l2">

    <div class="mint-estimate__row">
      <span class="mint-estimate__label">NACHOS to receive</span>
      <span class="mint-estimate__value fw-bold">{{ nachosStore.formatE8s(nachosEstimate) }}</span>
    </div>

    <div class="mint-estimate__row">
      <span class="mint-estimate__label">Fee</span>
      <span class="mint-estimate__value">
        {{ nachosStore.formatE8s(feeEstimate) }} ICP
        <span v-if="feePct" class="mint-estimate__pct">({{ feePct }}%)</span>
      </span>
    </div>

    <div class="mint-estimate__row">
      <span class="mint-estimate__label">NAV used</span>
      <span class="mint-estimate__value">{{ nachosStore.formatE8s(navUsed) }} ICP</span>
    </div>

  </div>

</template>

<script setup lang="ts">
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

defineProps<{
  nachosEstimate: bigint
  feeEstimate: bigint
  navUsed: bigint
  feePct?: string
}>()
</script>

<style scoped lang="scss">
.mint-estimate {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.875rem;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    opacity: 0.7;
  }

  &__pct {
    opacity: 0.6;
    font-size: 0.8rem;
  }
}
</style>
