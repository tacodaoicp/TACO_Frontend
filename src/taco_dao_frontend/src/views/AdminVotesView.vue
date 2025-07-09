<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🗳️" title="Admin Vote History" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Quick Navigation -->
          <div class="mb-4">
            <div class="d-flex gap-3">
              <router-link to="/admin" class="btn btn-secondary">
                ← Back to Admin Panel
              </router-link>
              <router-link to="/admin/trade" class="btn btn-info">
                📈 Trading Logs
              </router-link>
              <router-link to="/admin/price" class="btn btn-info">
                🚨 Price Management
              </router-link>
              <router-link to="/admin/neuron" class="btn btn-success">
                🧠 Neuron Admin
              </router-link>
            </div>
          </div>
          
          <!-- Search Form -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Search User Vote History</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-8">
                  <div class="form-group">
                    <label for="principalInput">User Principal</label>
                    <input 
                      type="text" 
                      id="principalInput"
                      v-model="principalInput" 
                      class="form-control"
                      placeholder="Enter user principal ID..."
                      @keyup.enter="searchUserVotes"
                    >
                  </div>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <button 
                    class="btn btn-primary"
                    @click="searchUserVotes"
                    :disabled="isLoading || !principalInput.trim()"
                  >
                    {{ isLoading ? 'Searching...' : 'Search' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- User Vote History -->
          <div v-if="userVoteHistory" class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Vote History for {{ searchedPrincipal }}</h3>
            </div>
            <div class="card-body">
              
              <!-- User Summary -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Current Voting Power</label>
                    <div class="value">{{ formatVotingPower(userVoteHistory.votingPower) }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Active Neurons</label>
                    <div class="value">{{ userVoteHistory.neurons.length }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Total Past Votes</label>
                    <div class="value">{{ userVoteHistory.pastAllocations.length }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Last Vote</label>
                    <div class="value">{{ formatTime(userVoteHistory.lastAllocationUpdate) }}</div>
                  </div>
                </div>
              </div>

              <!-- Current Allocation -->
              <div class="mb-4">
                <h4>Current Allocation</h4>
                <div v-if="userVoteHistory.allocations.length > 0">
                  <div class="table-responsive">
                    <table class="table table-dark table-striped">
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th>Allocation %</th>
                          <th>Voting Power Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="allocation in userVoteHistory.allocations" :key="allocation.token.toString()">
                          <td>{{ getTokenSymbol(allocation.token) }}</td>
                          <td>{{ (Number(allocation.basisPoints) / 100).toFixed(2) }}%</td>
                          <td>{{ calculateVotingPowerUsed(allocation.basisPoints) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="text-muted">
                  No current allocation set
                </div>
              </div>

              <!-- Neurons Information -->
              <div class="mb-4">
                <h4>Neurons Used for Voting</h4>
                <div v-if="userVoteHistory.neurons.length > 0">
                  <div class="table-responsive">
                    <table class="table table-dark table-striped">
                      <thead>
                        <tr>
                          <th>Neuron ID</th>
                          <th>Voting Power</th>
                          <th>Formatted VP</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="neuron in userVoteHistory.neurons" :key="uint8ArrayToHex(neuron.neuronId)">
                          <td>
                            <code style="font-size: 0.8em;">{{ uint8ArrayToHex(neuron.neuronId) }}</code>
                          </td>
                          <td>{{ neuron.votingPower.toString() }}</td>
                          <td>{{ formatVotingPower(neuron.votingPower) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="text-muted">
                  No neurons found
                </div>
              </div>

              <!-- Past Allocations / Vote History -->
              <div class="mb-4">
                <h4>Vote History ({{ userVoteHistory.pastAllocations.length }} past votes)</h4>
                <div v-if="userVoteHistory.pastAllocations.length > 0">
                  <div class="table-responsive">
                    <table class="table table-dark table-striped">
                      <thead>
                        <tr>
                          <th>Vote Period</th>
                          <th>Duration</th>
                          <th>Allocation</th>
                          <th>Vote Maker</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(pastAllocation, index) in sortedPastAllocations" :key="index">
                          <td>
                            <div>
                              <strong>From:</strong> {{ formatTime(pastAllocation.from) }}
                            </div>
                            <div>
                              <strong>To:</strong> {{ formatTime(pastAllocation.to) }}
                            </div>
                          </td>
                          <td>{{ calculateDuration(pastAllocation.from, pastAllocation.to) }}</td>
                          <td>
                            <div v-if="pastAllocation.allocation.length > 0">
                              <div v-for="allocation in pastAllocation.allocation" :key="allocation.token.toString()">
                                {{ getTokenSymbol(allocation.token) }}: {{ (Number(allocation.basisPoints) / 100).toFixed(2) }}%
                              </div>
                            </div>
                            <div v-else class="text-muted">
                              Empty allocation
                            </div>
                          </td>
                          <td>
                            <code style="font-size: 0.8em;">{{ pastAllocation.allocationMaker.toString() }}</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="text-muted">
                  No past vote history available
                </div>
              </div>

              <!-- Following Information -->
              <div class="row">
                <div class="col-md-6">
                  <h4>Following ({{ userVoteHistory.allocationFollows.length }})</h4>
                  <div v-if="userVoteHistory.allocationFollows.length > 0">
                    <div class="table-responsive">
                      <table class="table table-dark table-striped table-sm">
                        <thead>
                          <tr>
                            <th>Following</th>
                            <th>Since</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="follow in userVoteHistory.allocationFollows" :key="follow.follow.toString()">
                            <td>
                              <code style="font-size: 0.8em;">{{ follow.follow.toString() }}</code>
                            </td>
                            <td>{{ formatTime(follow.since) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="text-muted">
                    Not following anyone
                  </div>
                </div>
                
                <div class="col-md-6">
                  <h4>Followed By ({{ userVoteHistory.allocationFollowedBy.length }})</h4>
                  <div v-if="userVoteHistory.allocationFollowedBy.length > 0">
                    <div class="table-responsive">
                      <table class="table table-dark table-striped table-sm">
                        <thead>
                          <tr>
                            <th>Follower</th>
                            <th>Since</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="follower in userVoteHistory.allocationFollowedBy" :key="follower.follow.toString()">
                            <td>
                              <code style="font-size: 0.8em;">{{ follower.follow.toString() }}</code>
                            </td>
                            <td>{{ formatTime(follower.since) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="text-muted">
                    No followers
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <!-- No Results Message -->
          <div v-if="searchAttempted && !userVoteHistory && !errorMessage" class="alert alert-info" role="alert">
            No vote history found for the provided principal.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 0.5rem;
  
  label {
    color: var(--light-orange);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .value {
    font-size: 1.25rem;
    font-weight: 500;
  }
}

.table-responsive {
  max-height: 500px;
  overflow-y: auto;
}

.table td {
  vertical-align: top;
  white-space: normal;
  word-break: break-all;
}

.form-control {
  background-color: var(--black-to-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--white-to-black);
}

.form-control:focus {
  background-color: var(--black-to-white);
  border-color: var(--light-orange);
  color: var(--white-to-black);
  box-shadow: 0 0 0 0.2rem rgba(254, 234, 193, 0.25);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Principal } from '@dfinity/principal';
import { useTacoStore } from '../stores/taco.store';
import { storeToRefs } from "pinia";
import HeaderBar from "../components/HeaderBar.vue";
import TacoTitle from '../components/misc/TacoTitle.vue';

// Get store
const tacoStore = useTacoStore();
const { fetchedTokenDetails } = storeToRefs(tacoStore);

// Component state
const principalInput = ref('');
const searchedPrincipal = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const searchAttempted = ref(false);
const userVoteHistory = ref<any>(null);

// Search for user votes
const searchUserVotes = async () => {
  if (!principalInput.value.trim()) {
    errorMessage.value = 'Please enter a valid principal ID';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  searchAttempted.value = true;
  userVoteHistory.value = null;

  try {
    // Validate principal format
    const principal = Principal.fromText(principalInput.value.trim());
    searchedPrincipal.value = principal.toString();
    
    // Fetch user allocation from backend
    const result = await tacoStore.adminGetUserAllocation(principal);
    
    if (result) {
      userVoteHistory.value = result;
      console.log('AdminVotesView: User vote history:', result);
    } else {
      errorMessage.value = 'No vote history found for this principal';
    }
  } catch (error) {
    console.error('AdminVotesView: Error fetching user votes:', error);
    errorMessage.value = 'Error fetching vote history. Please check the principal format and try again.';
  } finally {
    isLoading.value = false;
  }
};

// Utility functions
const formatTime = (timestamp: number | bigint | null): string => {
  if (!timestamp) return 'Never';
  const nanoseconds = typeof timestamp === 'bigint' ? timestamp : BigInt(timestamp);
  const milliseconds = Number(nanoseconds / BigInt(1_000_000));
  const date = new Date(milliseconds);
  return date.toLocaleString();
};

const formatVotingPower = (votingPower: number | bigint): string => {
  const vp = typeof votingPower === 'bigint' ? Number(votingPower) : votingPower;
  return (vp / Math.pow(10, 8)).toFixed(2);
};

const uint8ArrayToHex = (array: Uint8Array): string => {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const getTokenSymbol = (principal: Principal): string => {
  try {
    if (!fetchedTokenDetails.value || !Array.isArray(fetchedTokenDetails.value)) {
      return 'Unknown';
    }

    const token = fetchedTokenDetails.value.find(entry => {
      if (!entry || !Array.isArray(entry) || entry.length < 2) {
        return false;
      }
      try {
        return entry[0].toString() === principal.toString();
      } catch (err) {
        return false;
      }
    });

    if (!token || !Array.isArray(token) || !token[1] || !token[1].tokenSymbol) {
      return 'Unknown';
    }

    return token[1].tokenSymbol;
  } catch (error) {
    console.error('Error getting token symbol:', error);
    return 'Unknown';
  }
};

const calculateVotingPowerUsed = (basisPoints: number | bigint): string => {
  if (!userVoteHistory.value) return '0';
  const bp = typeof basisPoints === 'bigint' ? Number(basisPoints) : basisPoints;
  const totalVP = typeof userVoteHistory.value.votingPower === 'bigint' 
    ? Number(userVoteHistory.value.votingPower) 
    : userVoteHistory.value.votingPower;
  const usedVP = (totalVP * bp) / 10000;
  return (usedVP / Math.pow(10, 8)).toFixed(2);
};

const calculateDuration = (from: number | bigint, to: number | bigint): string => {
  const fromMs = typeof from === 'bigint' ? Number(from / BigInt(1_000_000)) : from / 1_000_000;
  const toMs = typeof to === 'bigint' ? Number(to / BigInt(1_000_000)) : to / 1_000_000;
  const durationMs = toMs - fromMs;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
};

// Computed properties
const sortedPastAllocations = computed(() => {
  if (!userVoteHistory.value || !userVoteHistory.value.pastAllocations) return [];
  
  return [...userVoteHistory.value.pastAllocations].sort((a, b) => {
    const aTime = typeof a.from === 'bigint' ? Number(a.from) : a.from;
    const bTime = typeof b.from === 'bigint' ? Number(b.from) : b.from;
    return bTime - aTime; // Sort by most recent first
  });
});

// Lifecycle hooks
onMounted(async () => {
  console.log('AdminVotesView: Component mounted');
  await tacoStore.fetchTokenDetails();
});
</script> 