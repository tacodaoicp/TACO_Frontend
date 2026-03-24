<template>
  <div class="rewards-summary">
    <div class="rewards-header">
      <i class="fa fa-coins"></i>
      <span class="rewards-title">Available Rewards</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="rewards-loading">
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
import { defineProps, defineEmits } from 'vue'

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
