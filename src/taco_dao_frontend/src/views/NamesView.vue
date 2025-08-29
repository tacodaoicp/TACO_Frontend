<template>
    <div id="names-view">
        <div class="container">
            <div class="header">
                <h1>Manage Your Names</h1>
                <p>Set display names for your principal and TACO neurons</p>
            </div>

            <div class="content">
                <!-- Loading state -->
                <div v-if="appLoading" class="loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading...</span>
                </div>

                <!-- Login required -->
                <div v-else-if="!userLoggedIn" class="login-required">
                    <i class="fa-solid fa-user-lock"></i>
                    <h2>Login Required</h2>
                    <p>Please log in to manage your names</p>
                    <button @click="iidLogIn" class="login-btn">
                        <i class="fa-solid fa-sign-in-alt"></i>
                        Login with Internet Identity
                    </button>
                </div>

                <!-- Main content -->
                <div v-else class="names-content">
                    
                    <!-- Principal Name Section -->
                    <div class="section">
                        <h2>
                            <i class="fa-solid fa-user"></i>
                            Your Principal Name
                        </h2>
                        <div class="current-name">
                            <label>Current Principal:</label>
                            <span class="principal-id">{{ userPrincipal }}</span>
                        </div>
                        <div class="current-name">
                            <label>Current Display Name:</label>
                            <span class="display-name">{{ currentPrincipalName }}</span>
                        </div>
                        
                        <div class="name-input">
                            <input 
                                v-model="newPrincipalName" 
                                type="text" 
                                placeholder="Enter your display name"
                                maxlength="50"
                                @keyup.enter="savePrincipalName"
                            >
                            <button 
                                @click="savePrincipalName" 
                                :disabled="!newPrincipalName.trim() || principalNameSaving"
                                class="save-btn"
                            >
                                <i v-if="principalNameSaving" class="fa-solid fa-spinner fa-spin"></i>
                                <i v-else class="fa-solid fa-save"></i>
                                Save
                            </button>
                        </div>
                    </div>

                    <!-- Neurons Section -->
                    <div class="section">
                        <h2>
                            <i class="fa-solid fa-brain"></i>
                            Your TACO Neurons
                        </h2>
                        
                        <div v-if="neuronsLoading" class="loading">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            <span>Loading your neurons...</span>
                        </div>
                        
                        <div v-else-if="userNeurons.length === 0" class="no-neurons">
                            <i class="fa-solid fa-info-circle"></i>
                            <p>You don't have any TACO neurons yet.</p>
                        </div>
                        
                        <div v-else class="neurons-sections">
                            <!-- Owned Neurons Section -->
                            <div v-if="categorizedNeurons.owned.length > 0" class="neuron-section">
                                <div class="section-header">
                                    <i class="fa-solid fa-crown"></i>
                                    <span class="section-title">Owned ({{ categorizedNeurons.owned.length }})</span>
                                </div>
                                <div class="neurons-list">
                                    <div v-for="neuron in categorizedNeurons.owned" :key="neuronKey(neuron)" class="neuron-item">
                                        <div class="neuron-info">
                                            <div class="neuron-id">
                                                <label>Neuron ID:</label>
                                                <span class="id">{{ neuron.idHex || formatNeuronId(neuron.id) }}</span>
                                            </div>
                                            <div class="neuron-name">
                                                <label>Current Name:</label>
                                                <span class="display-name">{{ neuron.displayName || getNeuronCurrentName(neuron.id) }}</span>
                                            </div>
                                        </div>
                                        
                                        <div class="neuron-name-input">
                                            <input 
                                                v-model="neuronNameInputs[neuronKey(neuron)]" 
                                                type="text" 
                                                placeholder="Enter neuron name"
                                                maxlength="50"
                                                @keyup.enter="saveNeuronName(neuron.id)"
                                            >
                                            <button 
                                                @click="saveNeuronName(neuron.id)" 
                                                :disabled="neuronNameSaving[neuronKey(neuron)]"
                                                class="save-btn"
                                            >
                                                <i v-if="neuronNameSaving[neuronKey(neuron)]" class="fa-solid fa-spinner fa-spin"></i>
                                                <i v-else class="fa-solid fa-save"></i>
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Hotkeyed Neurons Section -->
                            <div v-if="categorizedNeurons.hotkeyed.length > 0" class="neuron-section">
                                <div class="section-header">
                                    <i class="fa-solid fa-key"></i>
                                    <span class="section-title">Hotkeyed ({{ categorizedNeurons.hotkeyed.length }})</span>
                                </div>
                                <div class="neurons-list">
                                    <div v-for="neuron in categorizedNeurons.hotkeyed" :key="neuronKey(neuron)" class="neuron-item">
                                        <div class="neuron-info">
                                            <div class="neuron-id">
                                                <label>Neuron ID:</label>
                                                <span class="id">{{ neuron.idHex || formatNeuronId(neuron.id) }}</span>
                                            </div>
                                            <div class="neuron-name">
                                                <label>Current Name:</label>
                                                <span class="display-name">{{ neuron.displayName || getNeuronCurrentName(neuron.id) }}</span>
                                            </div>
                                        </div>
                                        
                                        <div class="neuron-name-input">
                                            <input 
                                                v-model="neuronNameInputs[neuronKey(neuron)]" 
                                                type="text" 
                                                placeholder="Enter neuron name"
                                                maxlength="50"
                                                @keyup.enter="saveNeuronName(neuron.id)"
                                            >
                                            <button 
                                                @click="saveNeuronName(neuron.id)" 
                                                :disabled="neuronNameSaving[neuronKey(neuron)]"
                                                class="save-btn"
                                            >
                                                <i v-if="neuronNameSaving[neuronKey(neuron)]" class="fa-solid fa-spinner fa-spin"></i>
                                                <i v-else class="fa-solid fa-save"></i>
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Names Cache Info -->
                    <div class="section cache-info">
                        <h3>
                            <i class="fa-solid fa-info-circle"></i>
                            Names Cache Status
                        </h3>
                        <div class="cache-stats">
                            <div class="stat">
                                <label>Principal Names:</label>
                                <span>{{ namesCache.principals.size }}</span>
                            </div>
                            <div class="stat">
                                <label>Neuron Names:</label>
                                <span>{{ namesCache.neurons.size }}</span>
                            </div>
                            <div class="stat">
                                <label>Last Updated:</label>
                                <span>{{ lastLoadedFormatted }}</span>
                            </div>
                        </div>
                        <button @click="loadAllNames" :disabled="namesLoading" class="refresh-btn">
                            <i :class="namesLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-refresh'"></i>
                            Refresh Names Cache
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'
import { Principal } from '@dfinity/principal'

const tacoStore = useTacoStore()

// Destructure reactive values from store
const { 
    appLoading, 
    userLoggedIn, 
    userPrincipal,
    namesCache,
    namesLoading
} = storeToRefs(tacoStore)

// Destructure methods
const { 
    iidLogIn,
    loadAllNames,
    getPrincipalDisplayName,
    getNeuronDisplayName,
    setPrincipalName,
    setNeuronName,
    getTacoNeurons
} = tacoStore

// Local state
const newPrincipalName = ref('')
const principalNameSaving = ref(false)
const neuronsLoading = ref(false)
const userNeurons = ref([])
const categorizedNeurons = ref({ owned: [], hotkeyed: [], all: [] })
const neuronNameInputs = ref({})
const neuronNameSaving = ref({})

// Computed properties
const currentPrincipalName = computed(() => {
    return getPrincipalDisplayName(userPrincipal.value)
})

const lastLoadedFormatted = computed(() => {
    if (!namesCache.value.lastLoaded) return 'Never'
    return new Date(namesCache.value.lastLoaded).toLocaleString()
})

// Helper methods
const neuronKey = (neuron) => {
    // Handle different input formats
    if (typeof neuron === 'object' && neuron !== null) {
        // Case 1: neuron object with idHex property (formatted neuron)
        if (neuron.idHex) {
            return neuron.idHex
        }
        // Case 2: neuron object with nested id structure
        if (neuron.id && neuron.id.id) {
            return Array.from(neuron.id.id, byte => byte.toString(16).padStart(2, '0')).join('')
        }
        // Case 3: neuron object with direct id property as Uint8Array
        if (neuron.id && neuron.id instanceof Uint8Array) {
            return Array.from(neuron.id, byte => byte.toString(16).padStart(2, '0')).join('')
        }
    }
    // Case 4: direct Uint8Array (for saveNeuronName calls)
    if (neuron instanceof Uint8Array) {
        return Array.from(neuron, byte => byte.toString(16).padStart(2, '0')).join('')
    }
    return 'unknown'
}

const formatNeuronId = (neuronId) => {
    if (neuronId && neuronId.id) {
        const hex = Array.from(neuronId.id, byte => byte.toString(16).padStart(2, '0')).join('')
        return hex.length > 12 ? `${hex.substring(0, 6)}...${hex.substring(hex.length - 6)}` : hex
    }
    return 'Unknown'
}

const getNeuronCurrentName = (neuronId) => {
    if (neuronId && neuronId.id) {
        const tacoSnsRoot = Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai') // TACO SNS root
        return getNeuronDisplayName(tacoSnsRoot, neuronId.id)
    }
    return 'Unknown'
}

// Action methods
const savePrincipalName = async () => {
    if (!newPrincipalName.value.trim()) return
    
    try {
        principalNameSaving.value = true
        await setPrincipalName(newPrincipalName.value.trim())
        newPrincipalName.value = ''
        
        // Show success message
        console.log('✅ Principal name saved successfully')
    } catch (error) {
        console.error('❌ Error saving principal name:', error)
        alert('Failed to save principal name: ' + error.message)
    } finally {
        principalNameSaving.value = false
    }
}

const saveNeuronName = async (neuronId) => {
    console.log('🔧 saveNeuronName called with neuronId:', neuronId)
    console.log('🔧 neuronId type:', typeof neuronId)
    console.log('🔧 neuronId instanceof Uint8Array:', neuronId instanceof Uint8Array)
    
    // neuronId is the actual Uint8Array from neuron.id
    const key = neuronKey(neuronId)
    const name = neuronNameInputs.value[key]
    
    console.log('🔧 neuronKey:', key)
    console.log('🔧 name from input:', name)
    console.log('🔧 neuronNameInputs.value:', neuronNameInputs.value)
    
    if (!name?.trim()) {
        console.log('❌ No name provided, returning early')
        return
    }
    
    try {
        neuronNameSaving.value[key] = true
        const tacoSnsRoot = Principal.fromText('lhdfz-wqaaa-aaaaq-aae3q-cai') // TACO SNS root
        console.log('🔧 Calling setNeuronName with TACO SNS root:', tacoSnsRoot.toText(), 'name:', name.trim())
        
        // neuronId is already the Uint8Array, no need to access .id
        await setNeuronName(tacoSnsRoot, neuronId, name.trim())
        neuronNameInputs.value[key] = ''
        
        // Don't reload neurons immediately - let's see if this is causing the issue
        // await loadUserNeurons()
        
        // Show success message
        console.log('✅ Neuron name saved successfully')
        alert('✅ Neuron name saved successfully!')
    } catch (error) {
        console.error('❌ Error saving neuron name:', error)
        alert('Failed to save neuron name: ' + error.message)
    } finally {
        neuronNameSaving.value[key] = false
    }
}

const loadUserNeurons = async () => {
    if (!userLoggedIn.value) return
    
    try {
        neuronsLoading.value = true
        // Use getTacoNeurons and categorizeNeurons like in TokenCard.vue
        const rawNeurons = await getTacoNeurons()
        categorizedNeurons.value = tacoStore.categorizeNeurons(rawNeurons)
        // Keep backward compatibility
        userNeurons.value = categorizedNeurons.value.all
        
        // Initialize input refs for each neuron
        userNeurons.value.forEach(neuron => {
            const key = neuronKey(neuron)
            neuronNameInputs.value[key] = ''
            neuronNameSaving.value[key] = false
        })
        
        console.log('✅ Loaded user neurons:', userNeurons.value)
        console.log('✅ Categorized neurons:', categorizedNeurons.value)
    } catch (error) {
        console.error('❌ Error loading user neurons:', error)
        userNeurons.value = []
        categorizedNeurons.value = { owned: [], hotkeyed: [], all: [] }
    } finally {
        neuronsLoading.value = false
    }
}

// Lifecycle
onMounted(async () => {
    // Load names cache first
    await loadAllNames()
    
    if (userLoggedIn.value) {
        loadUserNeurons()
    }
})

// Watch for login state changes
watch(userLoggedIn, (newValue) => {
    if (newValue) {
        loadUserNeurons()
    } else {
        // Clear neurons when user logs out
        userNeurons.value = []
        categorizedNeurons.value = { owned: [], hotkeyed: [], all: [] }
    }
})
</script>

<style scoped>
#names-view {
    min-height: 100vh;
    padding: 2rem 0;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
}

.header {
    text-align: center;
    margin-bottom: 2rem;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

.header p {
    font-size: 1.1rem;
    color: var(--text-secondary);
}

.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    color: var(--text-secondary);
}

.login-required {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
}

.login-required i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.login-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
}

.login-btn:hover {
    background: var(--primary-hover);
}

.section {
    background: var(--background-secondary);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color);
}

.section h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
    font-size: 1.5rem;
}

.section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
    font-size: 1.2rem;
}

.current-name {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.current-name label {
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 140px;
}

.principal-id {
    font-family: monospace;
    background: var(--background-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    word-break: break-all;
}

.display-name {
    font-weight: 600;
    color: var(--text-primary);
}

.name-input {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.name-input input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--background-primary);
    color: var(--text-primary);
    font-size: 1rem;
}

.name-input input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.save-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
    min-width: 100px;
}

.save-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0056b3, #004085);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.save-btn:active:not(:disabled) {
    transform: translateY(0);
}

.save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.no-neurons {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.no-neurons i {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.neurons-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.neuron-section {
    background: var(--background-tertiary);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
}

.section-header i {
    font-size: 1.2rem;
    color: var(--primary-color);
}

.section-title {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--text-primary);
}

.neurons-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.neuron-item {
    background: var(--background-secondary);
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
}

.neuron-info {
    margin-bottom: 1rem;
}

.neuron-id {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.neuron-id label {
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 100px;
}

.neuron-id .id {
    font-family: monospace;
    background: var(--background-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
}

.neuron-name {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.neuron-name label {
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 100px;
}

.neuron-name-input {
    display: flex;
    gap: 1rem;
}

.neuron-name-input input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background-primary);
    color: var(--text-primary);
    font-size: 0.9rem;
}

.cache-info {
    background: var(--background-tertiary);
    border-left: 4px solid var(--primary-color);
}

.cache-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: var(--background-secondary);
    border-radius: 6px;
}

.stat label {
    font-weight: 600;
    color: var(--text-secondary);
}

.stat span {
    font-weight: 600;
    color: var(--primary-color);
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--background-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
    background: var(--primary-color);
    color: white;
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .name-input {
        flex-direction: column;
    }
    
    .neuron-name-input {
        flex-direction: column;
    }
    
    .current-name {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .neuron-id {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .neuron-name {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style> 