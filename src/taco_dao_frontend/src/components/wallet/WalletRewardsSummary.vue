<template>
  <div class="rewards-summary">
    <div class="rewards-header">
      <i class="fa fa-coins"></i>
      <span class="rewards-title">Available Rewards</span>
    </div>

    <!-- Loading State — also covers the pre-first-load window so the
         "No rewards available to claim" empty state doesn't flash. -->
    <div v-if="loading || !hasLoadedOnce" class="rewards-loading">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="rewards-loading-text">Loading rewards...</span>
    </div>

    <!-- Rewards Content -->
    <div v-else class="rewards-content">
      <!-- Total Rewards Display -->
      <div class="rewards-total">
        <span class="rewards-amount" :class="{ 'rewards-amount--zero': totalRewards === 0 }">
          {{ formatBalance(BigInt(Math.floor(totalRewards)), 8) }}
        </span>
        <span class="rewards-symbol">TACO</span>
      </div>

      <!-- Action Buttons (if rewards > 0) -->
      <div v-if="totalRewards > 0" class="rewards-actions">
        <button
          class="btn taco-btn taco-btn--green"
          @click="$emit('claim-some')"
          :disabled="claiming"
          title="Choose specific neurons to claim rewards from">
          <i class="fa fa-coins me-1"></i>
          Claim Some
        </button>
        <button
          class="btn taco-btn taco-btn--green"
          @click="$emit('claim-all')"
          :disabled="claiming"
          title="Claim all available rewards from all neurons">
          <i class="fa fa-coins me-1"></i>
          Claim All
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="rewards-empty">
        <span class="rewards-muted">No rewards available to claim</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  totalRewards: number
  loading?: boolean
  claiming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  claiming: false
})

// Emits
const emit = defineEmits<{
  'claim-some': []
  'claim-all': []
}>()

// `hasLoadedOnce` gates the "No rewards available to claim" empty state so it
// doesn't flash before parent's first load has run. Flips when any of:
//   1. `totalRewards > 0` arrives (data observed).
//   2. `loading` transitions true → false (parent finished a load).
//   3. A mount-time safety timeout fires — needed because the parent
//      (TokenCard.loadRewards) is called with showLoading=false on the
//      initial neuron load, so `loading` never goes through `true` for the
//      first fetch and (1) + (2) alone would leave the spinner forever for
//      users who legitimately have zero rewards.
const hasLoadedOnce = ref(false)
watch(
  [() => props.totalRewards, () => props.loading],
  ([rewards, loading], prev) => {
    if (rewards > 0) hasLoadedOnce.value = true
    const prevLoading = prev?.[1]
    if (prevLoading === true && loading === false) hasLoadedOnce.value = true
  },
  { immediate: true },
)

let mountFallbackTimer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  // 500 ms is well past first paint + a typical canister roundtrip; if the
  // parent's silent load hasn't delivered data by then, treat the current
  // state (totalRewards = 0) as authoritative and reveal the empty state.
  mountFallbackTimer = setTimeout(() => {
    if (!hasLoadedOnce.value) hasLoadedOnce.value = true
  }, 500)
})
onUnmounted(() => {
  if (mountFallbackTimer) clearTimeout(mountFallbackTimer)
})

// Format balance (BigInt to readable decimal)
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = balance / divisor
  const fractionalPart = balance % divisor

  // Convert fractional part to string with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')

  // Trim trailing zeros and decimal point if not needed
  const trimmedFractional = fractionalStr.replace(/0+$/, '')

  if (trimmedFractional === '') {
    return integerPart.toString()
  }

  // Show max 2 decimal places for rewards display
  const displayFractional = trimmedFractional.substring(0, 2)

  return `${integerPart}.${displayFractional}`
}
</script>

<style scoped lang="scss">
.rewards-summary {
  background: rgba(0, 0, 0, 0.25); // MUCH DARKER - increased from 0.12 to 0.25
  border-radius: 0.375rem;
  padding: 1.25rem; // Increased from 0.75rem
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.rewards-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  i {
    font-size: 0.95rem; // Increased from 0.85rem
    color: var(--brown-to-white);
  }
}

.rewards-title {
  font-size: 0.9rem; // Increased from 0.8rem
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.85;
  font-family: 'Space Mono', monospace;
  color: var(--brown-to-white);
}

.rewards-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;

  .spinner-border {
    color: var(--brown);
  }
}

.rewards-loading-text {
  font-size: 0.85rem; // Increased from 0.75rem
  opacity: 0.7;
  font-family: 'Space Mono', monospace;
  color: var(--black-to-white);
}

.rewards-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rewards-total {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.rewards-amount {
  font-size: 1.75rem; // Increased from 1.5rem
  font-weight: 600;
  font-family: 'Space Mono', monospace;
  color: var(--green);

  &--zero {
    color: var(--black-to-white);
    opacity: 0.5;
  }
}

.rewards-symbol {
  font-size: 1rem; // Increased from 0.9rem
  opacity: 0.8;
  font-family: 'Space Mono', monospace;
  color: var(--black-to-white);
}

.rewards-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  .btn {
    flex: 1;
    padding: 0.5rem 1rem;
    font-size: 0.85rem; // Increased from 0.75rem
    white-space: nowrap;
    min-width: fit-content;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    i {
      font-size: 0.7rem;
    }
  }
}

.rewards-empty {
  padding: 0.5rem 0;
}

.rewards-muted {
  font-size: 0.75rem;
  opacity: 0.6;
  font-family: 'Space Mono', monospace;
  color: var(--black-to-white);
}

// Mobile responsive
@media (max-width: 575.98px) {
  .rewards-amount {
    font-size: 1.2rem;
  }

  .rewards-symbol {
    font-size: 0.8rem;
  }

  .rewards-actions {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }
}
</style>
