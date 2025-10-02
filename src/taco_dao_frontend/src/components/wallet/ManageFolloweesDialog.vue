<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-users me-2"></i>
            Manage Neuron Followees
          </h5>
          <div class="header-actions">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm me-2"
              @click="refreshNeuronData"
              :disabled="loading"
              title="Refresh neuron data"
            >
              <i v-if="loading" class="fa fa-spinner fa-spin"></i>
              <i v-else class="fa fa-refresh"></i>
            </button>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>
        </div>
        <div class="modal-body">
          <div v-if="neuron">
            <div class="neuron-info mb-4">
              <h6>{{ neuron.displayName }}</h6>
              <small class="text-muted">{{ neuron.idHex }}</small>
            </div>

            <!-- Current Followees by Topic -->
            <div class="current-followees mb-4">
              <div class="section-header">
                <h6 class="section-title">
                  <i class="fa fa-list me-2"></i>
                  Current Following by Topic
                </h6>
                <div class="section-description">
                  <small class="text-muted">
                    <i class="fa fa-info-circle me-1"></i>
                    Your neuron follows other neurons on specific governance topics
                  </small>
                </div>
              </div>

              <div class="topics-grid">
                <div 
                  v-for="topic in allTopics" 
                  :key="topic.id"
                  class="topic-card"
                  :class="{ 'has-followees': getFolloweesForTopic(topic.id).length > 0, 'is-critical': topic.isCritical }"
                >
                  <div class="topic-header">
                    <div class="topic-info">
                      <i :class="`fa ${topic.icon} me-2`" :style="{ color: topic.color }"></i>
                      <span class="topic-name">{{ topic.name }}</span>
                      <span v-if="topic.isCritical" class="critical-badge">
                        <i class="fa fa-exclamation-triangle"></i>
                        Critical
                      </span>
                    </div>
                    <div class="followee-count">
                      {{ getFolloweesForTopic(topic.id).length }} followees
                    </div>
                  </div>
                  
                  <div class="topic-description">
                    <small class="text-muted">{{ topic.description }}</small>
                  </div>

                  <div class="followees-list" v-if="getFolloweesForTopic(topic.id).length > 0">
                    <div 
                      v-for="followee in getFolloweesForTopic(topic.id)" 
                      :key="followee.neuronId"
                      class="followee-item"
                    >
                      <div class="followee-info">
                        <span class="followee-id" :title="followee.neuronId">
                          {{ followee.neuronIdShort }}
                        </span>
                        <span v-if="followee.alias" class="followee-alias">
                          ({{ followee.alias }})
                        </span>
                      </div>
                      <button 
                        @click="removeFollowee(topic.id, followee.neuronId)"
                        class="btn btn-outline-danger btn-xs"
                        :disabled="loading"
                        title="Remove followee"
                      >
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </div>

                  <div class="add-followee-section">
                    <div class="input-group input-group-sm">
                      <input 
                        type="text" 
                        class="form-control" 
                        :placeholder="`Add neuron ID for ${topic.name}`"
                        v-model="newFollowees[topic.id]"
                        @keyup.enter="addFollowee(topic.id)"
                      >
                      <button 
                        class="btn btn-outline-primary" 
                        type="button"
                        @click="addFollowee(topic.id)"
                        :disabled="!newFollowees[topic.id] || loading"
                      >
                        <i class="fa fa-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
              <div class="section-header">
                <h6 class="section-title">
                  <i class="fa fa-bolt me-2"></i>
                  Quick Actions
                </h6>
              </div>
              
              <div class="action-buttons">
                <button 
                  class="btn btn-outline-info btn-sm"
                  @click="showBulkFollowModal = true"
                  :disabled="loading"
                >
                  <i class="fa fa-users me-1"></i>
                  Bulk Follow Neuron
                </button>
                <button 
                  class="btn btn-outline-warning btn-sm"
                  @click="clearAllFollowees"
                  :disabled="loading"
                >
                  <i class="fa fa-times-circle me-1"></i>
                  Clear All Followees
                </button>
                <button 
                  class="btn btn-outline-secondary btn-sm"
                  @click="copyFromAnotherNeuron"
                  :disabled="loading"
                >
                  <i class="fa fa-copy me-1"></i>
                  Copy from Another Neuron
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Bulk Follow Modal -->
  <div class="modal fade" :class="{ show: showBulkFollowModal }" :style="{ display: showBulkFollowModal ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-users me-2"></i>
            Bulk Follow Neuron
          </h5>
          <button type="button" class="btn-close" @click="closeBulkFollowModal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="bulkFollowNeuronId" class="form-label">Neuron ID to Follow</label>
            <input 
              type="text" 
              id="bulkFollowNeuronId"
              class="form-control" 
              v-model="bulkFollowNeuronId"
              placeholder="Enter neuron ID (hex format)"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">Topics to Follow On</label>
            <div class="topic-checkboxes">
              <div 
                v-for="topic in allTopics" 
                :key="topic.id"
                class="form-check"
              >
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :id="`bulk-topic-${topic.id}`"
                  :value="topic.id"
                  v-model="bulkFollowTopics"
                >
                <label class="form-check-label" :for="`bulk-topic-${topic.id}`">
                  <i :class="`fa ${topic.icon} me-1`" :style="{ color: topic.color }"></i>
                  {{ topic.name }}
                  <span v-if="topic.isCritical" class="critical-badge ms-1">Critical</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeBulkFollowModal">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary"
            @click="confirmBulkFollow"
            :disabled="!bulkFollowNeuronId || bulkFollowTopics.length === 0 || loading"
          >
            <i v-if="loading" class="fa fa-spinner fa-spin me-2"></i>
            <i v-else class="fa fa-users me-2"></i>
            Follow on Selected Topics
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Modal backdrop -->
  <div v-if="show || showBulkFollowModal" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { useTopicMapping } from '../../composables/useTopicMapping'

interface Props {
  show: boolean
  neuron: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'followees-updated'): void
  (e: 'neuron-refreshed', neuron: any): void
}>()

const tacoStore = useTacoStore()
const { getAllTopics } = useTopicMapping()

// State
const loading = ref(false)
const showBulkFollowModal = ref(false)
const newFollowees = ref<Record<string, string>>({})
const bulkFollowNeuronId = ref('')
const bulkFollowTopics = ref<string[]>([])

// Get all available topics
const allTopics = computed(() => getAllTopics())

// Initialize newFollowees object
onMounted(() => {
  const followeeInputs: Record<string, string> = {}
  allTopics.value.forEach(topic => {
    followeeInputs[topic.id] = ''
  })
  newFollowees.value = followeeInputs
})

// Get followees for a specific topic
const getFolloweesForTopic = (topicId: string) => {
  if (!props.neuron?.followings) return []
  
  // Find the following entry for this topic
  const topicFollowing = props.neuron.followings.find((f: any) => f.topicId === topicId)
  if (!topicFollowing) return []
  
  return topicFollowing.followedNeurons.map((neuron: any) => ({
    neuronId: neuron.idHex,
    neuronIdShort: neuron.idShort,
    alias: neuron.alias || null
  }))
}

// Add followee to a topic
const addFollowee = async (topicId: string) => {
  const neuronId = newFollowees.value[topicId]?.trim()
  if (!neuronId || !props.neuron) return
  
  try {
    loading.value = true
    
    // Convert neuron ID from hex to Uint8Array
    const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    // Convert followee neuron ID from hex to Uint8Array
    const followeeIdBytes = new Uint8Array(neuronId.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    await tacoStore.addNeuronFollowee(neuronIdBytes, topicId, followeeIdBytes)
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'followee-added',
      title: 'Followee Added',
      icon: 'fa-solid fa-check',
      message: `Successfully added followee for ${topicId}`
    })
    
    // Clear input
    newFollowees.value[topicId] = ''
    
    // Refresh the neuron data to show the new followee
    await refreshNeuronData()
    emit('followees-updated')
  } catch (error: any) {
    console.error('Error adding followee:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'followee-add-error',
      title: 'Add Followee Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to add followee'
    })
  } finally {
    loading.value = false
  }
}

// Remove followee from a topic
const removeFollowee = async (topicId: string, followeeNeuronId: string) => {
  if (!props.neuron) return
  
  try {
    loading.value = true
    
    // Convert neuron ID from hex to Uint8Array
    const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    // Convert followee neuron ID from hex to Uint8Array
    const followeeIdBytes = new Uint8Array(followeeNeuronId.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    await tacoStore.removeNeuronFollowee(neuronIdBytes, topicId, followeeIdBytes)
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'followee-removed',
      title: 'Followee Removed',
      icon: 'fa-solid fa-check',
      message: `Successfully removed followee from ${topicId}`
    })
    
    // Refresh the neuron data to show the removal
    await refreshNeuronData()
    emit('followees-updated')
  } catch (error: any) {
    console.error('Error removing followee:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'followee-remove-error',
      title: 'Remove Followee Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to remove followee'
    })
  } finally {
    loading.value = false
  }
}

// Bulk follow modal methods
const closeBulkFollowModal = () => {
  showBulkFollowModal.value = false
  bulkFollowNeuronId.value = ''
  bulkFollowTopics.value = []
}

const confirmBulkFollow = async () => {
  if (!bulkFollowNeuronId.value || bulkFollowTopics.value.length === 0) return
  
  try {
    loading.value = true
    
    // Add the neuron as followee for all selected topics
    for (const topicId of bulkFollowTopics.value) {
      await addFolloweeToTopic(topicId, bulkFollowNeuronId.value)
    }
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'bulk-follow-success',
      title: 'Bulk Follow Completed',
      icon: 'fa-solid fa-check',
      message: `Successfully added followee to ${bulkFollowTopics.value.length} topics`
    })
    
    closeBulkFollowModal()
    
    // Refresh the neuron data to show the new followees
    await refreshNeuronData()
    emit('followees-updated')
  } catch (error: any) {
    console.error('Error in bulk follow:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'bulk-follow-error',
      title: 'Bulk Follow Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to complete bulk follow'
    })
  } finally {
    loading.value = false
  }
}

// Helper method for bulk follow
const addFolloweeToTopic = async (topicId: string, neuronId: string) => {
  if (!props.neuron) return
  
  // Convert neuron ID from hex to Uint8Array
  const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
  
  // Convert followee neuron ID from hex to Uint8Array
  const followeeIdBytes = new Uint8Array(neuronId.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
  
  await tacoStore.addNeuronFollowee(neuronIdBytes, topicId, followeeIdBytes)
}

// Clear all followees
const clearAllFollowees = async () => {
  if (!props.neuron || !confirm('Are you sure you want to remove all followees from all topics?')) return
  
  try {
    loading.value = true
    
    // Count total followees first
    let totalFollowees = 0
    for (const topic of allTopics.value) {
      totalFollowees += getFolloweesForTopic(topic.id).length
    }
    
    if (totalFollowees === 0) {
      tacoStore.addToast({
        id: Date.now(),
        code: 'no-followees',
        title: 'No Followees to Clear',
        icon: 'fa-solid fa-info',
        message: 'This neuron has no followees to remove'
      })
      return
    }
    
    // Remove all followees from all topics
    for (const topic of allTopics.value) {
      const followees = getFolloweesForTopic(topic.id)
      for (const followee of followees) {
        await removeFollowee(topic.id, followee.neuronId)
      }
    }
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'clear-all-success',
      title: 'All Followees Cleared',
      icon: 'fa-solid fa-check',
      message: 'Successfully removed all followees from all topics'
    })
    
    // Refresh the neuron data to show the changes
    await refreshNeuronData()
    emit('followees-updated')
  } catch (error: any) {
    console.error('Error clearing all followees:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'clear-all-error',
      title: 'Clear All Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to clear all followees'
    })
  } finally {
    loading.value = false
  }
}

// Copy from another neuron (placeholder for future implementation)
const copyFromAnotherNeuron = () => {
  tacoStore.addToast({
    id: Date.now(),
    code: 'feature-coming-soon',
    title: 'Feature Coming Soon',
    icon: 'fa-solid fa-info',
    message: 'Copy followees from another neuron feature will be available soon'
  })
}

// Refresh neuron data to show updated followees
const refreshNeuronData = async () => {
  if (!props.neuron) return
  
  try {
    loading.value = true
    
    // Get fresh neuron data from SNS governance
    const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    const authClient = await tacoStore.getAuthClient()
    const identity = authClient.getIdentity()
    
    const agent = await tacoStore.createAgent({
      identity,
      host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
      fetchRootKey: process.env.DFX_NETWORK === "local",
    })

    const snsGov = await tacoStore.createSnsGovernanceActor(agent, 'lhdfz-wqaaa-aaaaq-aae3q-cai')
    
    const freshNeuronData = await snsGov.get_neuron({ 
      neuron_id: [{ id: Array.from(neuronIdBytes) }] 
    }) as any
    
    if (freshNeuronData.result && freshNeuronData.result.length > 0) {
      // Update the neuron prop with fresh data by emitting an event
      emit('neuron-refreshed', freshNeuronData.result[0])
    }
  } catch (error) {
    console.error('Error refreshing neuron data:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'refresh-error',
      title: 'Refresh Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to refresh neuron data'
    })
  } finally {
    loading.value = false
  }
}

// Reset form when dialog closes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    // Reset inputs
    Object.keys(newFollowees.value).forEach(key => {
      newFollowees.value[key] = ''
    })
  }
})
</script>

<style scoped>
.neuron-info {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  color: #fff;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.section-description {
  margin-bottom: 0.5rem;
}

.section-description .text-muted {
  color: #a0aec0 !important;
  font-size: 0.8rem;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1rem;
}

.topic-card {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.topic-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.topic-card.has-followees {
  border-color: rgba(40, 167, 69, 0.3);
  background: rgba(40, 167, 69, 0.05);
}

.topic-card.is-critical {
  border-left: 4px solid #dc3545;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.topic-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topic-name {
  font-weight: 600;
  color: #fff;
}

.critical-badge {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.followee-count {
  background: rgba(255, 255, 255, 0.1);
  color: #a0aec0;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.topic-description {
  margin-bottom: 1rem;
}

.followees-list {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.followee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.followee-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.followee-id {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #e9ecef;
}

.followee-alias {
  color: #a0aec0;
  font-style: italic;
  font-size: 0.8rem;
}

.add-followee-section {
  margin-top: 1rem;
}

.quick-actions {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-buttons .btn {
  flex: 1;
  min-width: 150px;
}

.topic-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.form-check {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-check-label {
  font-size: 0.9rem;
  color: #e9ecef;
  cursor: pointer;
  width: 100%;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions .btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
}

.header-actions .btn i {
  font-size: 0.9rem;
}
</style>
