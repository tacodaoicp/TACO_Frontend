<template>

  <!-- status banner — only shown when system is degraded -->
  <div v-if="showBanner" class="vault-status-banner">

    <!-- system paused -->
    <div v-if="nachosStore.systemPaused" class="vault-status-banner__alert vault-status-banner__alert--danger">
      <i class="fa-solid fa-circle-pause"></i>
      <span>System is currently paused for maintenance.</span>
    </div>

    <!-- circuit breaker -->
    <div v-if="nachosStore.circuitBreakerActive" class="vault-status-banner__alert vault-status-banner__alert--danger">
      <i class="fa-solid fa-shield-halved"></i>
      <span>Circuit breaker active. Trading halted due to unusual market conditions.</span>
    </div>

    <!-- genesis not complete -->
    <div v-if="!nachosStore.genesisComplete" class="vault-status-banner__alert vault-status-banner__alert--warning">
      <i class="fa-solid fa-hourglass-half"></i>
      <span>System not yet initialized. Genesis mint pending.</span>
    </div>

    <!-- minting disabled -->
    <div v-if="nachosStore.genesisComplete && !nachosStore.mintingEnabled" class="vault-status-banner__alert vault-status-banner__alert--warning">
      <i class="fa-solid fa-ban"></i>
      <span>Minting is currently disabled.</span>
    </div>

    <!-- burning disabled -->
    <div v-if="nachosStore.genesisComplete && !nachosStore.burningEnabled" class="vault-status-banner__alert vault-status-banner__alert--warning">
      <i class="fa-solid fa-ban"></i>
      <span>Burning is currently disabled.</span>
    </div>

    <!-- paused tokens -->
    <div v-if="nachosStore.hasPausedTokens" class="vault-status-banner__alert vault-status-banner__alert--warning">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>
        Minting paused due to stale prices:
        {{ nachosStore.pausedTokens.map((t: any) => t.symbol).join(', ') }}
      </span>
    </div>

    <!-- cached data indicator -->
    <div v-if="nachosStore.dataSource === 'cached'" class="vault-status-banner__alert vault-status-banner__alert--info">
      <i class="fa-solid fa-clock"></i>
      <span>Data may be slightly delayed (using cached data).</span>
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()

const showBanner = computed(() =>
  nachosStore.systemPaused ||
  nachosStore.circuitBreakerActive ||
  !nachosStore.genesisComplete ||
  (nachosStore.genesisComplete && !nachosStore.mintingEnabled) ||
  (nachosStore.genesisComplete && !nachosStore.burningEnabled) ||
  nachosStore.hasPausedTokens ||
  nachosStore.dataSource === 'cached'
)
</script>

<style scoped lang="scss">
.vault-status-banner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-family: 'Space Mono', monospace;

    i {
      font-size: 1rem;
      flex-shrink: 0;
    }

    &--danger {
      background-color: rgba(220, 53, 69, 0.15);
      border: 1px solid rgba(220, 53, 69, 0.4);
      color: var(--red-to-light-red);
    }

    &--warning {
      background-color: rgba(255, 193, 7, 0.15);
      border: 1px solid rgba(255, 193, 7, 0.4);
      color: var(--dark-orange-to-brown);
    }

    &--info {
      background-color: rgba(13, 110, 253, 0.15);
      border: 1px solid rgba(13, 110, 253, 0.3);
      color: var(--brown-to-white);
    }
  }
}
</style>
