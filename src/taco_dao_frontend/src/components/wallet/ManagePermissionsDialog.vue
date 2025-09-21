<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-key me-2"></i>
            Manage Neuron Permissions
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div v-if="neuron">
            <div class="neuron-info mb-4">
              <h6>{{ neuron.displayName }}</h6>
              <small class="text-muted">{{ neuron.idHex }}</small>
            </div>

            <!-- Current Permissions -->
            <div class="current-permissions mb-4">
              <h6 class="section-title">
                <i class="fa fa-users me-2"></i>
                Current Permissions ({{ neuron.permissions?.length || 0 }})
              </h6>
              <div v-if="neuron.permissions && neuron.permissions.length > 0" class="permissions-list">
                <div 
                  v-for="permission in neuron.permissions" 
                  :key="permission.principal"
                  class="permission-item"
                  :class="{ 'current-user': permission.isCurrentUser }"
                >
                  <div class="permission-header">
                    <div class="permission-principal">
                      <span class="principal-text" :title="permission.principal">
                        {{ permission.principalShort }}
                      </span>
                      <span v-if="permission.isCurrentUser" class="user-badge">
                        <i class="fa fa-user"></i> You
                      </span>
                    </div>
                    <div class="permission-actions" v-if="!permission.isCurrentUser">
                      <button 
                        @click="showRemovePermissions(permission)"
                        class="btn btn-outline-danger btn-sm"
                        title="Remove permissions"
                      >
                        <i class="fa fa-minus"></i>
                      </button>
                    </div>
                  </div>
                  <div class="permission-types">
                    <span 
                      v-for="permName in permission.permissionNames" 
                      :key="permName"
                      class="permission-badge"
                    >
                      {{ permName }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-muted">
                <i class="fa fa-info-circle me-2"></i>
                No additional permissions granted
              </div>
            </div>

            <!-- Add New Permission -->
            <div class="add-permission">
              <h6 class="section-title">
                <i class="fa fa-plus me-2"></i>
                Grant New Permission
              </h6>
              <form @submit.prevent="addPermission">
                <div class="mb-3">
                  <label for="principalId" class="form-label">Principal ID</label>
                  <input 
                    type="text" 
                    id="principalId"
                    class="form-control" 
                    v-model="newPermission.principalId"
                    placeholder="Enter principal ID (e.g., rdmx6-jaaaa-aaaah-qcaaa-cai)"
                    :class="{ 'is-invalid': principalError }"
                  >
                  <div v-if="principalError" class="invalid-feedback">
                    {{ principalError }}
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Permissions to Grant</label>
                  <div class="permission-checkboxes">
                    <div 
                      v-for="permType in availablePermissions" 
                      :key="permType.value"
                      class="form-check"
                    >
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="`perm-${permType.value}`"
                        :value="permType.value"
                        v-model="newPermission.selectedPermissions"
                      >
                      <label class="form-check-label" :for="`perm-${permType.value}`">
                        {{ permType.name }} - {{ permType.description }}
                      </label>
                    </div>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    :disabled="!newPermission.principalId || newPermission.selectedPermissions.length === 0 || loading"
                  >
                    <i v-if="loading" class="fa fa-spinner fa-spin me-2"></i>
                    <i v-else class="fa fa-plus me-2"></i>
                    Grant Permissions
                  </button>
                  <button type="button" class="btn btn-secondary" @click="resetForm">
                    <i class="fa fa-refresh me-2"></i>
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Remove Permission Confirmation Modal -->
  <div class="modal fade" :class="{ show: showRemoveModal }" :style="{ display: showRemoveModal ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-exclamation-triangle me-2 text-warning"></i>
            Remove Permissions
          </h5>
          <button type="button" class="btn-close" @click="closeRemoveModal"></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to remove permissions for:</p>
          <div v-if="permissionToRemove" class="permission-preview">
            <strong>{{ permissionToRemove.principalShort }}</strong>
            <div class="permission-types mt-2">
              <span 
                v-for="permName in permissionToRemove.permissionNames" 
                :key="permName"
                class="permission-badge"
              >
                {{ permName }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeRemoveModal">Cancel</button>
          <button 
            type="button" 
            class="btn btn-danger"
            @click="confirmRemovePermissions"
            :disabled="loading"
          >
            <i v-if="loading" class="fa fa-spinner fa-spin me-2"></i>
            <i v-else class="fa fa-trash me-2"></i>
            Remove Permissions
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Modal backdrop -->
  <div v-if="show || showRemoveModal" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../../stores/taco.store'

interface Props {
  show: boolean
  neuron: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'permissions-updated'): void
}>()

const tacoStore = useTacoStore()

// State
const loading = ref(false)
const principalError = ref('')
const showRemoveModal = ref(false)
const permissionToRemove = ref<any>(null)

// New permission form
const newPermission = ref({
  principalId: '',
  selectedPermissions: [] as number[]
})

// Available permission types
const availablePermissions = ref([
  { value: 1, name: 'Configure', description: 'Modify neuron settings (dissolve delay, auto-stake, etc.)' },
  { value: 2, name: 'Disburse', description: 'Disburse neuron stake and maturity' },
  { value: 3, name: 'Vote', description: 'Vote on proposals' },
  { value: 4, name: 'Submit Proposal', description: 'Submit new proposals' }
])

// Load grantable permissions on mount
onMounted(async () => {
  try {
    const grantablePermissions = await tacoStore.getGrantablePermissions()
    // Filter available permissions based on what's grantable
    if (grantablePermissions.length > 0) {
      availablePermissions.value = availablePermissions.value.filter(perm => 
        grantablePermissions.includes(perm.value)
      )
    }
  } catch (error) {
    console.warn('Could not load grantable permissions, using defaults:', error)
  }
})

// Validate principal ID
watch(() => newPermission.value.principalId, (newPrincipal) => {
  principalError.value = ''
  if (newPrincipal.trim()) {
    try {
      Principal.fromText(newPrincipal.trim())
    } catch (error) {
      principalError.value = 'Invalid principal ID format'
    }
  }
})

// Reset form
const resetForm = () => {
  newPermission.value = {
    principalId: '',
    selectedPermissions: []
  }
  principalError.value = ''
}

// Add permission
const addPermission = async () => {
  if (!props.neuron || principalError.value) return
  
  try {
    loading.value = true
    
    // Convert neuron ID from hex to Uint8Array
    const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    await tacoStore.addNeuronPermissions(
      neuronIdBytes,
      newPermission.value.principalId.trim(),
      newPermission.value.selectedPermissions
    )
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'permissions-granted',
      title: 'Permissions Granted',
      icon: 'fa-solid fa-check',
      message: `Successfully granted permissions to ${newPermission.value.principalId.trim().substring(0, 8)}...`
    })
    
    resetForm()
    emit('permissions-updated')
  } catch (error: any) {
    console.error('Error adding permissions:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'permissions-grant-error',
      title: 'Grant Permissions Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to grant permissions'
    })
  } finally {
    loading.value = false
  }
}

// Show remove permissions modal
const showRemovePermissions = (permission: any) => {
  permissionToRemove.value = permission
  showRemoveModal.value = true
}

// Close remove permissions modal
const closeRemoveModal = () => {
  showRemoveModal.value = false
  permissionToRemove.value = null
}

// Confirm remove permissions
const confirmRemovePermissions = async () => {
  if (!props.neuron || !permissionToRemove.value) return
  
  try {
    loading.value = true
    
    // Convert neuron ID from hex to Uint8Array
    const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    await tacoStore.removeNeuronPermissions(
      neuronIdBytes,
      permissionToRemove.value.principal,
      permissionToRemove.value.permissionTypes
    )
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'permissions-removed',
      title: 'Permissions Removed',
      icon: 'fa-solid fa-check',
      message: `Successfully removed permissions from ${permissionToRemove.value.principalShort}`
    })
    
    closeRemoveModal()
    emit('permissions-updated')
  } catch (error: any) {
    console.error('Error removing permissions:', error)
    tacoStore.addToast({
      id: Date.now(),
      code: 'permissions-remove-error',
      title: 'Remove Permissions Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to remove permissions'
    })
  } finally {
    loading.value = false
  }
}

// Reset form when dialog closes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    resetForm()
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

.section-title {
  color: #fff;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.permission-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.permission-item.current-user {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.permission-principal {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.principal-text {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #e9ecef;
}

.user-badge {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.permission-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.permission-badge {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
}

.permission-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
}

.permission-preview {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.add-permission {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>

