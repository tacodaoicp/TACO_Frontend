<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container -->
    <div class="scroll-y-container h-100">
      <!-- bootstrap container -->
      <div class="container p-0">
        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">
          
          <!-- proposals title -->
          <TacoTitle level="h2" emoji="🗳️" title="TACO DAO Proposals" class="mt-4" />

          <!-- loading state -->
          <div v-if="loading" class="d-flex justify-content-center align-items-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading proposals...</span>
            </div>
          </div>

          <!-- error state -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="fa-solid fa-exclamation-triangle me-2"></i>
            Failed to load proposals: {{ error }}
            <button @click="loadProposals" class="btn btn-outline-danger btn-sm ms-2">
              <i class="fa-solid fa-refresh me-1"></i>
              Retry
            </button>
          </div>

          <!-- proposals list -->
          <div v-else class="proposals-container">
            
            <!-- refresh button -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-muted">{{ proposals.length }} proposals found</span>
              <button @click="loadProposals" class="btn btn-outline-primary btn-sm" :disabled="loading">
                <i class="fa-solid fa-refresh me-1"></i>
                Refresh
              </button>
            </div>

            <!-- proposals grid -->
            <div class="proposals-grid">
              <div
                v-for="proposal in proposals"
                :key="proposal.id.toString()"
                class="proposal-card taco-container taco-container--l1"
              >
                <!-- proposal header -->
                <div class="proposal-header">
                  <div class="d-flex justify-content-between align-items-start">
                    <h4 class="proposal-title">{{ proposal.title }}</h4>
                    <span :class="getStatusClass(proposal.status)" class="proposal-status">
                      {{ proposal.status }}
                    </span>
                  </div>
                  <div class="proposal-meta">
                    <span class="text-muted">
                      <i class="fa-solid fa-calendar me-1"></i>
                      {{ formatDate(proposal.createdAt) }}
                    </span>
                    <span v-if="proposal.proposer" class="text-muted ms-3">
                      <i class="fa-solid fa-user me-1"></i>
                      {{ truncateHex(proposal.proposer) }}
                    </span>
                  </div>
                </div>

                <!-- proposal summary -->
                <div class="proposal-summary">
                  <p class="text-muted mb-2">{{ proposal.summary || 'No summary provided' }}</p>
                </div>

                <!-- voting stats -->
                <div class="proposal-votes" v-if="proposal.totalVotes > 0">
                  <div class="vote-stats">
                    <div class="vote-stat">
                      <span class="vote-label">Yes</span>
                      <span class="vote-count text-success">{{ formatVotes(proposal.yesVotes) }}</span>
                    </div>
                    <div class="vote-stat">
                      <span class="vote-label">No</span>
                      <span class="vote-count text-danger">{{ formatVotes(proposal.noVotes) }}</span>
                    </div>
                    <div class="vote-stat">
                      <span class="vote-label">Total</span>
                      <span class="vote-count">{{ formatVotes(proposal.totalVotes) }}</span>
                    </div>
                  </div>
                  
                  <!-- vote progress bar -->
                  <div class="vote-progress mt-2">
                    <div class="progress">
                      <div 
                        class="progress-bar bg-success" 
                        role="progressbar" 
                        :style="{ width: calculateYesPercentage(proposal) + '%' }"
                      ></div>
                      <div 
                        class="progress-bar bg-danger" 
                        role="progressbar" 
                        :style="{ width: calculateNoPercentage(proposal) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- proposal actions -->
                <div class="proposal-actions mt-3">
                  <a 
                    v-if="proposal.url" 
                    :href="proposal.url" 
                    target="_blank" 
                    class="btn btn-outline-primary btn-sm"
                  >
                    <i class="fa-solid fa-external-link me-1"></i>
                    View Details
                  </a>
                  <span v-if="proposal.decidedAt" class="text-muted ms-3 small">
                    <i class="fa-solid fa-gavel me-1"></i>
                    Decided {{ formatDate(proposal.decidedAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- empty state -->
            <div v-if="proposals.length === 0" class="text-center py-5">
              <i class="fa-solid fa-inbox text-muted fa-3x mb-3"></i>
              <h5 class="text-muted">No proposals found</h5>
              <p class="text-muted">There are currently no proposals to display.</p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- footer bar -->
    <FooterBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'

const tacoStore = useTacoStore()

const loading = ref(false)
const error = ref<string | null>(null)

const proposals = computed(() => tacoStore.fetchedTacoProposals)

const loadProposals = async () => {
  loading.value = true
  error.value = null
  
  try {
    await tacoStore.fetchTacoProposals(50) // Fetch up to 50 proposals
  } catch (err: any) {
    error.value = err.message || 'Failed to load proposals'
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Open': return 'badge bg-primary'
    case 'Adopted': return 'badge bg-success'
    case 'Executed': return 'badge bg-info'
    case 'Rejected': return 'badge bg-danger'
    case 'Failed': return 'badge bg-warning'
    default: return 'badge bg-secondary'
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatVotes = (votes: bigint) => {
  const num = Number(votes)
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const truncateHex = (hex: string) => {
  if (hex.length <= 10) return hex
  return hex.substring(0, 6) + '...' + hex.substring(hex.length - 4)
}

const calculateYesPercentage = (proposal: any) => {
  if (proposal.totalVotes === BigInt(0)) return 0
  return (Number(proposal.yesVotes) / Number(proposal.totalVotes)) * 100
}

const calculateNoPercentage = (proposal: any) => {
  if (proposal.totalVotes === BigInt(0)) return 0
  return (Number(proposal.noVotes) / Number(proposal.totalVotes)) * 100
}

onMounted(() => {
  loadProposals()
})
</script>

<style scoped lang="scss">
.proposals-container {
  padding: 1rem 0;
}

.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.proposal-card {
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--light-orange);
  background: var(--black-to-white);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.proposal-header {
  margin-bottom: 1rem;
  
  .proposal-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--white-to-black);
    line-height: 1.3;
  }
  
  .proposal-status {
    font-size: 0.75rem;
    white-space: nowrap;
  }
  
  .proposal-meta {
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }
}

.proposal-summary {
  margin-bottom: 1rem;
  
  p {
    font-size: 0.9rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.proposal-votes {
  .vote-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .vote-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .vote-label {
      font-size: 0.75rem;
      color: var(--dark-gray);
      margin-bottom: 0.25rem;
    }
    
    .vote-count {
      font-weight: 600;
      font-size: 0.9rem;
    }
  }
  
  .vote-progress {
    .progress {
      height: 6px;
      background-color: var(--light-gray);
    }
  }
}

.proposal-actions {
  border-top: 1px solid var(--light-gray);
  padding-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// Responsive adjustments
@media (max-width: 768px) {
  .proposals-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .proposal-card {
    padding: 1rem;
  }
}
</style> 