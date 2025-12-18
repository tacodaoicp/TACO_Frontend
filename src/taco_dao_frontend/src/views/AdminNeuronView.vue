<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />
    
    <div class="scroll-y-container h-100">
      <div class="container">
        <div class="row">
          <TacoTitle level="h2" emoji="🧠" title="Neuron Snapshot Admin" class="mt-4" style="padding-left: 1rem !important;"/>
          
          <!-- Back to Admin Navigation -->
          <div class="mb-4">
            <router-link to="/admin" class="btn btn-secondary">
              ← Back to Admin Panel
            </router-link>
          </div>
          
          <!-- Snapshot Configuration -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header">
              <h3 class="mb-0">Snapshot Configuration</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Maximum Snapshots to Keep</label>
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model="newMaxSnapshots"
                        :placeholder="currentMaxSnapshots.toString()"
                        min="1"
                        max="1000"
                      >
                      <button 
                        class="btn btn-primary" 
                        @click="updateMaxSnapshots"
                        :disabled="!newMaxSnapshots || newMaxSnapshots < 1 || updatingLimit"
                      >
                        {{ updatingLimit ? 'Updating...' : 'Update Limit' }}
                      </button>
                    </div>
                    <div class="form-text">
                      Current limit: {{ currentMaxSnapshots }} snapshots
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Snapshot Status</label>
                    <div class="d-flex gap-3 align-items-center">
                      <div class="status-indicator" :class="snapshotStatus === 'Ready' ? 'active' : 'inactive'"></div>
                      <span>{{ snapshotStatus }}</span>
                      <button 
                        class="btn btn-warning btn-sm" 
                        @click="takeSnapshot"
                        :disabled="snapshotStatus !== 'Ready' || takingSnapshot"
                      >
                        {{ takingSnapshot ? 'Taking...' : 'Take Snapshot' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Snapshots List -->
          <div class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Available Snapshots</h3>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="refreshSnapshots">
                  Refresh List
                </button>
                <select class="form-select" v-model="selectedSnapshotPageSize" @change="refreshSnapshots">
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>
            <div class="card-body">
              <div v-if="loadingSnapshots" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else-if="snapshots.length === 0" class="text-center text-muted">
                No snapshots available
              </div>
              <div v-else>
                <div class="table-responsive">
                  <table class="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th>Snapshot ID</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Age</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="snapshot in snapshots" :key="snapshot.id.toString()">
                        <td>{{ snapshot.id.toString() }}</td>
                        <td>{{ formatTimestamp(snapshot.timestamp) }}</td>
                        <td>
                          <span :class="getStatusClass(snapshot.result)">
                            {{ getStatusText(snapshot.result) }}
                          </span>
                        </td>
                        <td>{{ getSnapshotAge(snapshot.timestamp) }}</td>
                        <td>
                          <button 
                            class="btn btn-info btn-sm"
                            @click="inspectSnapshot(snapshot.id)"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {{ snapshots.length }} snapshots
                  </div>
                  <div class="d-flex gap-2">
                    <button 
                      class="btn btn-secondary btn-sm"
                      @click="loadMoreSnapshots"
                      :disabled="snapshots.length < selectedSnapshotPageSize"
                    >
                      Load More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Snapshot Details Modal -->
          <div v-if="selectedSnapshot" class="card bg-dark text-white mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="mb-0">Snapshot {{ selectedSnapshot.id.toString() }} Details</h3>
              <button class="btn btn-secondary" @click="closeInspection">
                Close
              </button>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-3">
                  <strong>Snapshot ID:</strong><br>
                  {{ selectedSnapshot.id.toString() }}
                </div>
                <div class="col-md-3">
                  <strong>Timestamp:</strong><br>
                  {{ formatTimestamp(selectedSnapshot.timestamp) }}
                </div>
                <div class="col-md-3">
                  <strong>Status:</strong><br>
                  <span :class="getStatusClass(selectedSnapshot.result)">
                    {{ getStatusText(selectedSnapshot.result) }}
                  </span>
                </div>
                <div class="col-md-3">
                  <strong>Age:</strong><br>
                  {{ getSnapshotAge(selectedSnapshot.timestamp) }}
                </div>
              </div>

              <!-- Cumulative Stats -->
              <div v-if="selectedSnapshotStats" class="row mb-3">
                <div class="col-md-6">
                  <strong>Total Voting Power:</strong><br>
                  {{ formatVotingPower(selectedSnapshotStats.total_staked_vp) }}
                </div>
                <div class="col-md-6">
                  <strong>Hotkey Setters VP:</strong><br>
                  {{ formatVotingPower(selectedSnapshotStats.total_staked_vp_by_hotkey_setters) }}
                </div>
              </div>

              <!-- Neuron Data -->
              <div class="mt-4">
                <h4>Neuron Data</h4>
                <div class="d-flex gap-2 mb-3">
                  <button 
                    class="btn btn-info btn-sm"
                    @click="loadNeuronData"
                    :disabled="loadingNeuronData"
                  >
                    {{ loadingNeuronData ? 'Loading...' : 'Load Neuron Data' }}
                  </button>
                  <select class="form-select" v-model="neuronDataPageSize" style="width: auto;">
                    <option value="10">10 entries</option>
                    <option value="25">25 entries</option>
                    <option value="50">50 entries</option>
                  </select>
                </div>

                <div v-if="neuronData && neuronData.length > 0">
                  <div class="table-responsive">
                    <table class="table table-dark table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Principal</th>
                          <th>Neurons Count</th>
                          <th>Total Voting Power</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="[principal, neurons] in neuronData" :key="principal.toString()">
                          <td>
                            <code style="font-size: 0.8em;">{{ principal.toString() }}</code>
                          </td>
                          <td>{{ neurons.length }}</td>
                          <td>{{ formatVotingPower(neurons.reduce((sum: bigint, n: any) => sum + n.votingPower, 0n)) }}</td>
                          <td>
                            <button 
                              class="btn btn-outline-info btn-sm"
                              @click="toggleNeuronDetails(principal.toString())"
                            >
                              {{ expandedPrincipals.has(principal.toString()) ? 'Hide' : 'Show' }} Details
                            </button>
                          </td>
                        </tr>
                        <template v-for="[principal, neurons] in neuronData" :key="principal.toString() + '-details'">
                          <tr v-if="expandedPrincipals.has(principal.toString())">
                            <td colspan="4" class="p-0">
                              <div class="p-3 bg-secondary">
                                <h6>Neurons for {{ principal.toString() }}</h6>
                                <div class="table-responsive">
                                  <table class="table table-sm table-secondary">
                                    <thead>
                                      <tr>
                                        <th>Neuron ID</th>
                                        <th>Voting Power</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr v-for="neuron in neurons" :key="Array.from(neuron.neuronId).join('')">
                                        <td><code>{{ Array.from(neuron.neuronId).join('') }}</code></td>
                                        <td>{{ formatVotingPower(neuron.votingPower) }}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                  
                  <div v-if="neuronDataInfo" class="mt-2">
                    <small class="text-muted">
                      Showing {{ neuronData.length }} of {{ neuronDataInfo.total_entries.toString() }} entries
                      <button 
                        v-if="neuronDataInfo.stopped_at && neuronDataInfo.stopped_at.length > 0"
                        class="btn btn-sm btn-outline-primary ms-2"
                        @click="loadMoreNeuronData"
                        :disabled="loadingNeuronData"
                      >
                        Load More
                      </button>
                    </small>
                  </div>
                </div>
                
                <div v-else-if="!loadingNeuronData && neuronData !== null">
                  <div class="text-muted">No neuron data available for this snapshot</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- GNSF Proposal Dialog for Non-Admin Users -->
  <GNSFProposalDialog
    :show="showProposalDialog"
    :function-name="proposalFunctionName"
    :reason-placeholder="proposalReasonPlaceholder"
    :context-params="proposalContextParams"
    @close="showProposalDialog = false"
    @success="handleProposalSuccess"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'
import GNSFProposalDialog from '../components/proposals/GNSFProposalDialog.vue'
import { useAdminCheck } from '../composables/useAdminCheck'
import { Principal } from '@dfinity/principal'
import * as workerBridge from '../stores/worker-bridge'

const store = useTacoStore()

// Extract cached refs from store for reactive binding
const {
  cachedNeuronSnapshots,
  cachedMaxNeuronSnapshots
} = storeToRefs(store)

// Admin check
const { isAdmin, checking, checkAdminStatus } = useAdminCheck()

// GNSF Proposal Dialog state
const showProposalDialog = ref(false)
const proposalFunctionName = ref('')
const proposalReasonPlaceholder = ref('')
const proposalContextParams = ref<any>({})

// Reactive state
const currentMaxSnapshots = ref(100)
const newMaxSnapshots = ref<number | null>(null)
const updatingLimit = ref(false)
const snapshotStatus = ref<'Ready' | 'TakingSnapshot' | 'StoringSnapshot'>('Ready')
const takingSnapshot = ref(false)

const snapshots = ref<any[]>([])
const loadingSnapshots = ref(false)
const selectedSnapshotPageSize = ref(25)
const snapshotStartIndex = ref(0)

const selectedSnapshot = ref<any>(null)
const selectedSnapshotStats = ref<any>(null)
const neuronData = ref<any[]>([])
const neuronDataInfo = ref<any>(null)
const loadingNeuronData = ref(false)
const neuronDataPageSize = ref(25)
const neuronDataStartIndex = ref(0)
const expandedPrincipals = ref(new Set<string>())

// Helper functions
const formatTimestamp = (timestamp: bigint) => {
  const milliseconds = Number(timestamp / BigInt(1_000_000))
  const date = new Date(milliseconds)
  return date.toLocaleString()
}

const formatVotingPower = (vp: bigint) => {
  return Number(vp).toLocaleString()
}

const getStatusClass = (result: any) => {
  if (result.Ok !== undefined) return 'text-success'
  if (result.Err?.Cancelled !== undefined) return 'text-warning'
  if (result.Err?.Timeout !== undefined) return 'text-danger'
  return 'text-muted'
}

const getStatusText = (result: any) => {
  if (result.Ok !== undefined) return 'Success'
  if (result.Err?.Cancelled !== undefined) return 'Cancelled'
  if (result.Err?.Timeout !== undefined) return 'Timeout'
  return 'Unknown'
}

const getSnapshotAge = (timestamp: bigint) => {
  const now = Date.now()
  const snapshotTime = Number(timestamp / BigInt(1_000_000))
  const diffMinutes = Math.floor((now - snapshotTime) / (1000 * 60))
  
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const toggleNeuronDetails = (principalStr: string) => {
  if (expandedPrincipals.value.has(principalStr)) {
    expandedPrincipals.value.delete(principalStr)
  } else {
    expandedPrincipals.value.add(principalStr)
  }
}

// API calls
const loadCurrentConfig = async () => {
  try {
    const maxSnapshots = await store.getMaxNeuronSnapshots()
    currentMaxSnapshots.value = Number(maxSnapshots)
    
    const status = await store.getNeuronSnapshotStatus()
    
    // Convert status to string format
    if ('Ready' in status) snapshotStatus.value = 'Ready'
    else if ('TakingSnapshot' in status) snapshotStatus.value = 'TakingSnapshot'
    else if ('StoringSnapshot' in status) snapshotStatus.value = 'StoringSnapshot'
  } catch (error) {
    console.error('Error loading config:', error)
  }
}

const updateMaxSnapshots = async () => {
  if (!newMaxSnapshots.value || newMaxSnapshots.value < 1) return
  
  // Check if user is admin
  await checkAdminStatus()
  
  // Capture value before potentially closing
  const newLimit = newMaxSnapshots.value
  
  if (isAdmin.value) {
    // Admin path - direct call
    updatingLimit.value = true
    try {
      await store.setMaxNeuronSnapshots(newLimit)
      currentMaxSnapshots.value = newLimit
      newMaxSnapshots.value = null
      
      // Show success message
      store.addToast({
        id: Date.now(),
        code: 'success',
        title: 'Success',
        icon: '✅',
        message: `Snapshot limit updated to ${currentMaxSnapshots.value}`
      })
    } catch (error) {
      console.error('Error updating max snapshots:', error)
      store.addToast({
        id: Date.now(),
        code: 'error',
        title: 'Error',
        icon: '❌',
        message: 'Failed to update snapshot limit'
      })
    } finally {
      updatingLimit.value = false
    }
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'setMaxNeuronSnapshots'
    proposalReasonPlaceholder.value = `Please explain why the maximum neuron snapshots should be changed to ${newLimit}...`
    proposalContextParams.value = {
      maxSnapshots: BigInt(newLimit)
    }
    showProposalDialog.value = true
  }
}

const takeSnapshot = async () => {
  // Check if user is admin
  await checkAdminStatus()
  
  if (isAdmin.value) {
    // Admin path - direct call
    takingSnapshot.value = true
    try {
      const result = await store.takeNeuronSnapshot()
      
      if ('Ok' in result) {
        snapshotStatus.value = 'TakingSnapshot'
        store.addToast({
          id: Date.now(),
          code: 'info',
          title: 'Snapshot Started',
          icon: '📸',
          message: `Neuron snapshot has been initiated (ID: ${result.Ok.toString()})`
        })
      } else {
        throw new Error(`Snapshot failed: ${JSON.stringify(result.Err)}`)
      }
      
      // Refresh snapshots after a delay
      setTimeout(refreshSnapshots, 2000)
    } catch (error) {
      console.error('Error taking snapshot:', error)
      store.addToast({
        id: Date.now(),
        code: 'error',
        title: 'Error',
        icon: '❌',
        message: 'Failed to take snapshot'
      })
    } finally {
      takingSnapshot.value = false
    }
  } else {
    // Non-admin path - show proposal dialog
    proposalFunctionName.value = 'takeNeuronSnapshot'
    proposalReasonPlaceholder.value = 'Please explain why a neuron snapshot should be taken now...'
    proposalContextParams.value = {}
    showProposalDialog.value = true
  }
}

// Refresh snapshots via worker (non-blocking)
const refreshSnapshots = () => {
  console.log('AdminNeuronView: Triggering worker refresh for neuron snapshots')
  loadingSnapshots.value = true
  // Reset pagination
  snapshotStartIndex.value = 0
  workerBridge.fetch('neuronSnapshots', true)
}

const loadMoreSnapshots = async () => {
  try {
    const nextIndex = snapshotStartIndex.value + selectedSnapshotPageSize.value
    const moreSnapshots = await store.getNeuronSnapshotsInfo(nextIndex, selectedSnapshotPageSize.value)
    snapshots.value.push(...moreSnapshots)
    snapshotStartIndex.value = nextIndex
  } catch (error) {
    console.error('Error loading more snapshots:', error)
  }
}

const inspectSnapshot = async (snapshotId: bigint) => {
  try {
    // Load snapshot details
    const snapshotInfo = await store.getNeuronSnapshotInfo(snapshotId)
    const cumulativeStats = await store.getCumulativeValuesAtSnapshot(snapshotId)
    
    if (snapshotInfo && snapshotInfo.length > 0) {
      selectedSnapshot.value = snapshotInfo[0]
    }
    
    if (cumulativeStats && cumulativeStats.length > 0) {
      selectedSnapshotStats.value = cumulativeStats[0]
    }
    
    // Reset neuron data
    neuronData.value = []
    neuronDataInfo.value = null
    neuronDataStartIndex.value = 0
    expandedPrincipals.value.clear()
    
  } catch (error) {
    console.error('Error inspecting snapshot:', error)
  }
}

const closeInspection = () => {
  selectedSnapshot.value = null
  selectedSnapshotStats.value = null
  neuronData.value = []
  neuronDataInfo.value = null
  expandedPrincipals.value.clear()
}

const loadNeuronData = async () => {
  if (!selectedSnapshot.value) return
  
  loadingNeuronData.value = true
  try {
    neuronDataStartIndex.value = 0
    const result = await store.getNeuronDataForDAO(
      selectedSnapshot.value.id,
      neuronDataStartIndex.value,
      neuronDataPageSize.value
    )
    
    if (result && result.length > 0 && result[0]) {
      neuronData.value = result[0].entries
      neuronDataInfo.value = result[0]
    } else {
      neuronData.value = []
      neuronDataInfo.value = null
    }
    
  } catch (error) {
    console.error('Error loading neuron data:', error)
  } finally {
    loadingNeuronData.value = false
  }
}

const loadMoreNeuronData = async () => {
  if (!selectedSnapshot.value || !neuronDataInfo.value?.stopped_at || neuronDataInfo.value.stopped_at.length === 0) return
  
  loadingNeuronData.value = true
  try {
    const nextIndex = neuronDataInfo.value.stopped_at[0]
    const result = await store.getNeuronDataForDAO(
      selectedSnapshot.value.id,
      Number(nextIndex),
      neuronDataPageSize.value
    )
    
    if (result && result.length > 0 && result[0]) {
      neuronData.value.push(...result[0].entries)
      neuronDataInfo.value = result[0]
    }
    
  } catch (error) {
    console.error('Error loading more neuron data:', error)
  } finally {
    loadingNeuronData.value = false
  }
}

// Handle successful proposal submission
const handleProposalSuccess = async () => {
  showProposalDialog.value = false
  proposalFunctionName.value = ''
  proposalReasonPlaceholder.value = ''
  proposalContextParams.value = {}
  console.log('AdminNeuronView: Proposal submitted successfully')
}

// Watchers to sync cached data to local refs
watch(cachedNeuronSnapshots, (newVal) => {
  if (newVal?.length > 0) {
    snapshots.value = newVal
    loadingSnapshots.value = false
  }
}, { immediate: true })

watch(cachedMaxNeuronSnapshots, (newVal) => {
  if (newVal) {
    currentMaxSnapshots.value = Number(newVal)
  }
}, { immediate: true })

// Initialize component
onMounted(() => {
  // Set loading state before fetching
  loadingSnapshots.value = true

  // Check admin status in background (don't block data loading or navigation)
  checkAdminStatus().catch(console.error)

  // Trigger worker fetches for neuron snapshot data
  workerBridge.fetch('neuronSnapshots', false)
  workerBridge.fetch('maxNeuronSnapshots', false)
  workerBridge.fetch('neuronSnapshotStatus', false)
})
</script>

<style scoped>
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.active {
  background-color: #28a745;
}

.status-indicator.inactive {
  background-color: #dc3545;
}

.table-responsive {
  max-height: 500px;
  overflow-y: auto;
}

.form-select {
  width: auto;
}

code {
  font-size: 0.8em;
  word-break: break-all;
}
</style>