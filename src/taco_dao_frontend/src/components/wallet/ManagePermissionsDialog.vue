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
              <div class="section-header">
                <h6 class="section-title">
                  <i class="fa fa-users me-2"></i>
                  Current Permissions ({{ neuron.permissions?.length || 0 }})
                </h6>
                <div class="section-description">
                  <small class="text-muted">
                    <i class="fa fa-info-circle me-1"></i>
                    Toggle individual permissions or remove principals entirely
                  </small>
                </div>
              </div>
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
                        title="Remove all permissions for this principal"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div class="permission-types">
                    <div 
                      v-for="permType in availablePermissionTypes" 
                      :key="permType.value"
                      class="permission-toggle"
                      v-if="!permission.isCurrentUser"
                    >
                      <div class="form-check form-switch">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          :id="`perm-toggle-${permission.principal}-${permType.value}`"
                          :checked="permission.permissionTypes.includes(permType.value)"
                          @change="toggleIndividualPermission(permission, permType.value, $event)"
                          :disabled="loading"
                        >
                        <label class="form-check-label" :for="`perm-toggle-${permission.principal}-${permType.value}`">
                          {{ permType.name }} - {{ permType.description }}
                        </label>
                      </div>
                    </div>
                    <div v-if="permission.isCurrentUser" class="permission-badges">
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
              </div>
              <div v-else class="text-muted">
                <i class="fa fa-info-circle me-2"></i>
                No additional permissions granted
              </div>
            </div>

            <!-- Add New Permission -->
            <div class="add-permission">
              <div class="section-header">
                <h6 class="section-title">
                  <i class="fa fa-plus me-2"></i>
                  Grant New Permission
                </h6>
                <div class="section-description">
                  <small class="text-muted">
                    <i class="fa fa-info-circle me-1"></i>
                    Add a new principal and select which permissions to grant
                  </small>
                </div>
              </div>
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
                  <div class="alert alert-info mb-3">
                    <i class="fa fa-info-circle me-2"></i>
                    <strong>Important:</strong> The "Manage Principals" permission allows the recipient to add/remove other principals and manage all permissions. Only grant this to trusted parties.
                  </div>
                  <div class="permission-checkboxes">
                    <div 
                      v-for="permType in availablePermissionTypes" 
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
            Remove Principal from Permissions
          </h5>
          <button type="button" class="btn-close" @click="closeRemoveModal"></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to completely remove this principal from the neuron's permissions?</p>
          <div v-if="permissionToRemove" class="permission-preview">
            <div class="principal-info">
              <strong>Principal:</strong>
              <code class="ms-2">{{ permissionToRemove.principalShort }}</code>
            </div>
            <div class="current-permissions mt-3">
              <strong>Current Permissions:</strong>
              <div class="permission-badges mt-2">
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
          <div class="alert alert-warning mt-3">
            <i class="fa fa-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This will remove ALL permissions for this principal and they will no longer have any access to this neuron.
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
            Remove Principal
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
import { SnsNeuronPermissionType } from '@dfinity/sns'
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

// Available permission types using @dfinity/sns enums
const availablePermissionTypes = ref([
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_CONFIGURE_DISSOLVE_STATE, 
    name: 'Configure Dissolve State', 
    description: 'Modify neuron dissolve delay and dissolving state' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_PRINCIPALS, 
    name: 'Manage Principals', 
    description: 'Add/remove principals and manage their permissions (ADMIN PERMISSION)' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SUBMIT_PROPOSAL, 
    name: 'Submit Proposal', 
    description: 'Submit new governance proposals' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_VOTE, 
    name: 'Vote', 
    description: 'Vote on governance proposals' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE, 
    name: 'Disburse', 
    description: 'Disburse neuron stake' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SPLIT, 
    name: 'Split', 
    description: 'Split neuron into multiple neurons' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MERGE_MATURITY, 
    name: 'Merge Maturity', 
    description: 'Merge maturity into neuron stake' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE_MATURITY, 
    name: 'Disburse Maturity', 
    description: 'Disburse neuron maturity rewards' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_STAKE_MATURITY, 
    name: 'Stake Maturity', 
    description: 'Stake maturity to increase neuron stake' 
  },
  { 
    value: SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_VOTING_PERMISSION, 
    name: 'Manage Voting Permission', 
    description: 'Manage voting and following settings' 
  }
])

// Load grantable permissions on mount
onMounted(async () => {
  try {
    const grantablePermissions = await tacoStore.getGrantablePermissions()
    // Filter available permissions based on what's grantable
    if (grantablePermissions.length > 0) {
      availablePermissionTypes.value = availablePermissionTypes.value.filter(perm => 
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

// Toggle individual permission
const toggleIndividualPermission = async (permission: any, permissionType: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const isChecked = target.checked
  
  if (!props.neuron) return
  
  try {
    loading.value = true
    
    // Convert neuron ID from hex to Uint8Array
    const neuronIdBytes = new Uint8Array(props.neuron.idHex.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)))
    
    if (isChecked) {
      // Add the permission
      await tacoStore.addNeuronPermissions(
        neuronIdBytes,
        permission.principal,
        [permissionType]
      )
      
      tacoStore.addToast({
        id: Date.now(),
        code: 'permission-added',
        title: 'Permission Added',
        icon: 'fa-solid fa-check',
        message: `Successfully added permission for ${permission.principalShort}`
      })
    } else {
      // Remove the permission
      await tacoStore.removeNeuronPermissions(
        neuronIdBytes,
        permission.principal,
        [permissionType]
      )
      
      tacoStore.addToast({
        id: Date.now(),
        code: 'permission-removed',
        title: 'Permission Removed',
        icon: 'fa-solid fa-check',
        message: `Successfully removed permission for ${permission.principalShort}`
      })
    }
    
    emit('permissions-updated')
  } catch (error: any) {
    console.error('Error toggling permission:', error)
    
    // Revert the checkbox state on error
    target.checked = !isChecked
    
    tacoStore.addToast({
      id: Date.now(),
      code: 'permission-toggle-error',
      title: 'Permission Update Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: error.message || 'Failed to update permission'
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
  transition: all 0.2s ease;
}

.permission-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.permission-item.current-user {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.permission-item.current-user:hover {
  background: rgba(0, 123, 255, 0.15);
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
  flex-direction: column;
  gap: 0.5rem;
}

.permission-badges {
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

.permission-toggle {
  padding: 0.25rem 0;
}

.permission-toggle .form-check {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0;
  transition: all 0.2s ease;
}

.permission-toggle .form-check:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.permission-toggle .form-check-label {
  font-size: 0.85rem;
  color: #e9ecef;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
  margin-bottom: 0;
}

.permission-toggle .form-check-input {
  cursor: pointer;
  margin-top: 0.1rem;
}

.permission-toggle .form-check-input:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.permission-toggle .form-check-input:checked + .form-check-label {
  color: #28a745;
}

.permission-toggle .form-check-input:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.permission-toggle .form-check-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-toggle .form-check-input:disabled + .form-check-label {
  opacity: 0.5;
  cursor: not-allowed;
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

.principal-info {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.principal-info code {
  background: rgba(255, 255, 255, 0.1);
  color: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.current-permissions {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid;
}

.alert-warning {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.alert-info {
  background: rgba(23, 162, 184, 0.1);
  border-color: rgba(23, 162, 184, 0.3);
  color: #17a2b8;
}
</style>