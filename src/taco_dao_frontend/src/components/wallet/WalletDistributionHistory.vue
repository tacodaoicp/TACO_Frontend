<template>
  <div class="distribution-history">
    <h6 class="distribution-title">
      <i class="fa fa-history me-2"></i>
      Recent Distributions
      <span v-if="distributions.length > 0" class="opacity-75">
        ({{ distributions.length }}{{ hasMore ? '+' : '' }})
      </span>
    </h6>

    <div class="distribution-table-wrapper">
      <!-- Distribution Table -->
      <table v-if="distributions.length > 0 && !loading" class="distribution-table">
        <thead>
          <tr>
            <th>Dist #</th>
            <th>Date</th>
            <th class="text-end">Reward</th>
            <th class="text-end">Neurons</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dist in distributions" :key="dist.distributionId">
            <td>#{{ dist.distributionId }}</td>
            <td>{{ formatDate(dist.distributionTime) }}</td>
            <td class="text-end">{{ formatReward(dist.userTotalReward) }} TACO</td>
            <td class="text-end">{{ dist.neuronCount }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Load More Button -->
      <div v-if="hasMore && !loading" class="load-more-wrapper">
        <button
          @click="loadMore"
          class="btn btn-sm taco-btn taco-btn--green load-more-btn">
          <i class="fa fa-chevron-down me-1"></i>
          Load More
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="distributions.length === 0 && !loading" class="empty-state">
        <i class="fa fa-inbox fa-2x mb-2"></i>
        <p>No distribution history yet</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span>Loading distributions...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineProps } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

// Props
interface Props {
  userNeuronIds: string[]
}

const props = defineProps<Props>()
const tacoStore = useTacoStore()

// State
const distributions = ref<any[]>([])
const loading = ref(false)
const hasMore = ref(false)
const currentOffset = ref(0)
const PAGE_SIZE = 5 // Load 5 at a time

// Fetch distributions with pagination
const fetchDistributions = async (reset = false) => {
  if (props.userNeuronIds.length === 0) return

  if (reset) {
    currentOffset.value = 0
    distributions.value = []
  }

  loading.value = true
  try {
    const actor = await tacoStore.createRewardsActorAnonymous()
    const result = await actor.getUserDistributionRewards(
      props.userNeuronIds,
      BigInt(currentOffset.value),
      BigInt(PAGE_SIZE)
    )

    const newDistributions = result.records.map((record: any) => ({
      distributionId: Number(record.distributionId),
      distributionTime: record.distributionTime,
      userTotalReward: record.neuronRewards.reduce(
        (sum: bigint, nr: any) => sum + BigInt(nr.rewardAmount),
        BigInt(0)
      ),
      neuronCount: record.neuronRewards.length
    }))

    distributions.value = [...distributions.value, ...newDistributions]
    currentOffset.value += result.records.length
    hasMore.value = result.hasMore
  } catch (error) {
    console.error('Error fetching distributions:', error)
  } finally {
    loading.value = false
  }
}

// Load more distributions
const loadMore = () => {
  fetchDistributions(false)
}

// Format date from nanosecond timestamp
function formatDate(timestamp: bigint): string {
  try {
    // Convert nanoseconds to milliseconds
    const ms = Number(timestamp / BigInt(1000000))
    const date = new Date(ms)

    // Format as "MMM DD, YYYY"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return 'Invalid Date'
  }
}

// Format reward amount (e8s to TACO)
function formatReward(amount: bigint): string {
  const divisor = BigInt(100000000) // 1e8
  const integerPart = amount / divisor
  const fractionalPart = amount % divisor

  // Convert fractional part to string with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(8, '0')

  // Trim trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, '')

  if (trimmedFractional === '') {
    return integerPart.toString()
  }

  // Show max 2 decimal places
  const displayFractional = trimmedFractional.substring(0, 2)

  return `${integerPart}.${displayFractional}`
}

// Initialize on mount
onMounted(() => fetchDistributions(true))

// Reload when neuron IDs change
watch(() => props.userNeuronIds, () => fetchDistributions(true), { deep: true })
</script>

<style scoped lang="scss">
.distribution-history {
  margin-top: 1.5rem;
}

.distribution-title {
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
  color: var(--brown-to-white);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;

  i {
    font-size: 0.85rem;
  }
}

.distribution-table-wrapper {
  background: rgba(0, 0, 0, 0.25); // MUCH DARKER - increased from 0.08 to 0.25
  border-radius: 0.375rem;
  padding: 0.75rem;
  min-height: 3rem; // Prevent layout shift during loading
}

.distribution-table {
  width: 100%;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  border-collapse: collapse;

  th, td {
    padding: 0.5rem 0.625rem;
    border-bottom: 1px solid var(--dark-orange-to-brown);
  }

  th {
    font-size: 0.75rem;
    text-transform: uppercase;
    opacity: 0.85;
    font-weight: 600;
    border-bottom: 2px solid var(--dark-orange-to-brown);
    color: var(--brown-to-white);
  }

  td {
    color: var(--black-to-white);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr {
    transition: background-color 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }
}

.load-more-wrapper {
  margin-top: 0.75rem;
  text-align: center;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(128, 128, 128, 0.15);
}

.load-more-btn {
  font-size: 0.8rem;
  padding: 0.375rem 0.75rem;

  i {
    font-size: 0.75rem;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.6;
  font-size: 0.85rem;
  color: var(--black-to-white);

  i {
    display: block;
    margin-bottom: 0.5rem;
    opacity: 0.4;
  }

  p {
    margin: 0;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  font-size: 0.85rem;
  color: var(--black-to-white);
  opacity: 0.7;

  .spinner-border {
    color: var(--brown);
  }
}

// Mobile responsiveness
@media (max-width: 767.98px) {
  .distribution-table {
    font-size: 0.75rem;

    th, td {
      padding: 0.375rem 0.5rem;
    }

    th {
      font-size: 0.7rem;
    }
  }

  .distribution-title {
    font-size: 0.85rem;

    i {
      font-size: 0.8rem;
    }
  }
}
</style>
