<template>
  <div class="standard-view">
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
          <div v-if="userData" class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Vote History for {{ formatPrincipalWithName(Principal.fromText(searchedPrincipal)) }}</h3>
            </div>
            <div class="card-body">
              
              <!-- User Summary -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Current Voting Power</label>
                    <div class="value">{{ formatVotingPower(userData.votingPower) }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Active Neurons</label>
                    <div class="value">{{ userData.neurons?.length || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Total Past Votes</label>
                    <div class="value">{{ userData.pastAllocations?.length || 0 }}</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-item">
                    <label>Last Vote</label>
                    <div class="value">{{ formatTime(userData.lastAllocationUpdate) }}</div>
                  </div>
                </div>
              </div>

              <!-- Current Allocation -->
              <div class="mb-4">
                <h4>Current Allocation</h4>
                <div v-if="userData.allocations?.length > 0">
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
                        <tr v-for="allocation in userData.allocations" :key="allocation.token.toString()">
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
                <div v-if="userData.neurons?.length > 0">
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
                        <tr v-for="neuron in userData.neurons" :key="uint8ArrayToHex(neuron.neuronId)">
                          <td>
                            <div>{{ formatNeuronWithName(neuron.neuronId) }}</div>
                            <small class="text-muted">{{ uint8ArrayToHex(neuron.neuronId) }}</small>
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
                <h4>Vote History ({{ userData.pastAllocations?.length || 0 }} past votes)</h4>
                <div v-if="userData.pastAllocations?.length > 0">
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
                            <div>{{ formatPrincipalWithName(pastAllocation.allocationMaker) }}</div>
                            <small class="text-muted">{{ pastAllocation.allocationMaker.toString() }}</small>
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
                  <h4>Following ({{ userData.allocationFollows?.length || 0 }})</h4>
                  <div v-if="userData.allocationFollows?.length > 0">
                    <div class="table-responsive">
                      <table class="table table-dark table-striped table-sm">
                        <thead>
                          <tr>
                            <th>Following</th>
                            <th>Since</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="follow in userData.allocationFollows" :key="follow.follow.toString()">
                            <td>
                              <div>{{ formatPrincipalWithName(follow.follow) }}</div>
                              <small class="text-muted">{{ follow.follow.toString() }}</small>
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
                  <h4>Followed By ({{ userData.allocationFollowedBy?.length || 0 }})</h4>
                  <div v-if="userData.allocationFollowedBy?.length > 0">
                    <div class="table-responsive">
                      <table class="table table-dark table-striped table-sm">
                        <thead>
                          <tr>
                            <th>Follower</th>
                            <th>Since</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="follower in userData.allocationFollowedBy" :key="follower.follow.toString()">
                            <td>
                              <div>{{ formatPrincipalWithName(follower.follow) }}</div>
                              <small class="text-muted">{{ follower.follow.toString() }}</small>
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

          <!-- Penalized Neurons Section -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Penalized Neurons ({{ penalizedNeurons.length }})</h3>
              <button
                class="btn btn-sm btn-outline-warning"
                @click="refreshPenalizedNeurons"
                :disabled="isLoadingPenalized"
              >
                {{ isLoadingPenalized ? 'Loading...' : '🔄 Refresh' }}
              </button>
            </div>
            <div class="card-body">

              <!-- Add Penalty Form -->
              <div class="mb-4 p-3" style="background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem;">
                <h5>Add Neuron Penalty</h5>
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group mb-2">
                      <label for="penaltyNeuronId">Neuron ID (hex)</label>
                      <input
                        type="text"
                        id="penaltyNeuronId"
                        v-model="newPenaltyNeuronId"
                        class="form-control"
                        placeholder="Enter neuron ID in hex format..."
                      >
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-group mb-2">
                      <label for="penaltyMultiplier">VP % (1-100)</label>
                      <input
                        type="number"
                        id="penaltyMultiplier"
                        v-model.number="newPenaltyMultiplier"
                        class="form-control"
                        placeholder="e.g. 50"
                        min="1"
                        max="100"
                      >
                    </div>
                  </div>
                  <div class="col-md-3 d-flex align-items-end">
                    <button
                      class="btn btn-warning mb-2"
                      @click="addPenalty"
                      :disabled="isAddingPenalty || !newPenaltyNeuronId.trim() || !newPenaltyMultiplier"
                    >
                      {{ isAddingPenalty ? 'Adding...' : '➕ Add Penalty' }}
                    </button>
                  </div>
                </div>
                <small class="text-muted">
                  VP % determines how much of the neuron's voting power is used. E.g., 1 = 1% VP, 50 = 50% VP, 100 = full VP (no penalty).
                </small>
              </div>

              <!-- Penalized Neurons Table -->
              <div v-if="penalizedNeurons.length > 0">
                <div class="table-responsive">
                  <table class="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th>Neuron ID</th>
                        <th>VP %</th>
                        <th>Effect</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="neuron in penalizedNeurons" :key="uint8ArrayToHex(neuron.neuronId)">
                        <td>
                          <div>{{ formatNeuronWithName(neuron.neuronId) }}</div>
                          <small class="text-muted">{{ uint8ArrayToHex(neuron.neuronId) }}</small>
                        </td>
                        <td>{{ neuron.multiplier }}%</td>
                        <td>Uses {{ neuron.multiplier }}% of VP</td>
                        <td>
                          <button
                            class="btn btn-sm btn-danger"
                            @click="removePenalty(uint8ArrayToHex(neuron.neuronId))"
                            :disabled="removingNeuronId === uint8ArrayToHex(neuron.neuronId)"
                          >
                            {{ removingNeuronId === uint8ArrayToHex(neuron.neuronId) ? 'Removing...' : '🗑️ Remove' }}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-muted">
                No penalized neurons configured.
              </div>

              <!-- Penalty Error Message -->
              <div v-if="penaltyErrorMessage" class="alert alert-danger mt-3" role="alert">
                {{ penaltyErrorMessage }}
              </div>

              <!-- Penalty Success Message -->
              <div v-if="penaltySuccessMessage" class="alert alert-success mt-3" role="alert">
                {{ penaltySuccessMessage }}
              </div>

            </div>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Principal } from '@dfinity/principal';
import { useTacoStore } from '../stores/taco.store';
import { storeToRefs } from "pinia";
import TacoTitle from '../components/misc/TacoTitle.vue';

// Get route and router
const route = useRoute();
const router = useRouter();

// Get store
const tacoStore = useTacoStore();
const { fetchedTokenDetails, fetchedPenalizedNeurons } = storeToRefs(tacoStore);

// Destructure utility methods
const { getPrincipalDisplayName, getNeuronDisplayName, fetchPenalizedNeurons, adminAddPenalizedNeuron, adminRemovePenalizedNeuron } = tacoStore;

// Component state
const principalInput = ref('');
const searchedPrincipal = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const searchAttempted = ref(false);
const userVoteHistory = ref<any>(null);

// Penalized neurons state
const isLoadingPenalized = ref(false);
const isAddingPenalty = ref(false);
const removingNeuronId = ref<string | null>(null);
const newPenaltyNeuronId = ref('');
const newPenaltyMultiplier = ref<number>(50);
const penaltyErrorMessage = ref('');
const penaltySuccessMessage = ref('');

// Computed for penalized neurons
const penalizedNeurons = computed(() => fetchedPenalizedNeurons.value || []);

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

// Penalized neurons functions
const refreshPenalizedNeurons = async () => {
  isLoadingPenalized.value = true;
  penaltyErrorMessage.value = '';
  try {
    await fetchPenalizedNeurons();
  } catch (error: any) {
    penaltyErrorMessage.value = 'Failed to load penalized neurons: ' + (error.message || error);
  } finally {
    isLoadingPenalized.value = false;
  }
};

const addPenalty = async () => {
  if (!newPenaltyNeuronId.value.trim() || !newPenaltyMultiplier.value) return;

  isAddingPenalty.value = true;
  penaltyErrorMessage.value = '';
  penaltySuccessMessage.value = '';

  try {
    // Clean the hex input (remove spaces, 0x prefix if any)
    const cleanHex = newPenaltyNeuronId.value.trim().replace(/^0x/, '').replace(/\s/g, '');

    await adminAddPenalizedNeuron(cleanHex, newPenaltyMultiplier.value);
    penaltySuccessMessage.value = `Successfully added penalty (${newPenaltyMultiplier.value}% VP) for neuron`;

    // Clear form
    newPenaltyNeuronId.value = '';
    newPenaltyMultiplier.value = 50;

    // Auto-hide success message after 5 seconds
    setTimeout(() => { penaltySuccessMessage.value = ''; }, 5000);
  } catch (error: any) {
    penaltyErrorMessage.value = 'Failed to add penalty: ' + (error.message || error);
  } finally {
    isAddingPenalty.value = false;
  }
};

const removePenalty = async (neuronIdHex: string) => {
  removingNeuronId.value = neuronIdHex;
  penaltyErrorMessage.value = '';
  penaltySuccessMessage.value = '';

  try {
    await adminRemovePenalizedNeuron(neuronIdHex);
    penaltySuccessMessage.value = 'Successfully removed penalty from neuron';

    // Auto-hide success message after 5 seconds
    setTimeout(() => { penaltySuccessMessage.value = ''; }, 5000);
  } catch (error: any) {
    penaltyErrorMessage.value = 'Failed to remove penalty: ' + (error.message || error);
  } finally {
    removingNeuronId.value = null;
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

const formatPrincipalWithName = (principal: Principal): string => {
  if (!principal) return 'Unknown';
  const displayName = getPrincipalDisplayName(principal);
  return displayName;
};

const formatNeuronWithName = (neuronId: Uint8Array): string => {
  if (!neuronId) return 'Unknown';
  const tacoSnsRoot = Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai'); // TACO DAO SNS governance
  const neuronName = getNeuronDisplayName(tacoSnsRoot, neuronId);
  
  if (neuronName) {
    return neuronName;
  }
  
  // Fallback to truncated neuron ID
  const hex = Array.from(neuronId, byte => byte.toString(16).padStart(2, '0')).join('');
  return hex.length > 12 ? `${hex.substring(0, 6)}...${hex.substring(hex.length - 6)}` : hex;
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
  if (!userData.value) return '0';
  const bp = typeof basisPoints === 'bigint' ? Number(basisPoints) : basisPoints;
  const totalVP = typeof userData.value.votingPower === 'bigint' 
    ? Number(userData.value.votingPower) 
    : userData.value.votingPower;
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
const userData = computed(() => {
  // The API returns an array with the user data at index 0, or null if not found
  return Array.isArray(userVoteHistory.value) && userVoteHistory.value.length > 0 
    ? userVoteHistory.value[0] 
    : null;
});

const sortedPastAllocations = computed(() => {
  if (!userData.value || !userData.value.pastAllocations) return [];
  
  return [...userData.value.pastAllocations].sort((a, b) => {
    const aTime = typeof a.from === 'bigint' ? Number(a.from) : a.from;
    const bTime = typeof b.from === 'bigint' ? Number(b.from) : b.from;
    return bTime - aTime; // Sort by most recent first
  });
});

// Handle URL parameter for principal
const handleUrlPrincipal = () => {
  const urlPrincipal = route.query.principal as string;
  if (urlPrincipal) {
    principalInput.value = urlPrincipal;
    // Auto-search if principal is provided in URL
    searchUserVotes();
  }
};

// Watch for route changes
watch(() => route.query.principal, (newPrincipal) => {
  if (newPrincipal && typeof newPrincipal === 'string') {
    principalInput.value = newPrincipal;
    searchUserVotes();
  }
}, { immediate: true });

// Lifecycle hooks
onMounted(async () => {
  console.log('AdminVotesView: Component mounted');
  await tacoStore.fetchTokenDetails();
  // Handle URL parameter after token details are loaded
  handleUrlPrincipal();
  // Load penalized neurons
  refreshPenalizedNeurons();
});
</script> 