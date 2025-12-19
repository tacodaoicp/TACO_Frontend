<template>
    <div>
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-content-center align-items-center min-vh-100">
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4 class="taco-text-black-to-white">Looking up NNS Proposal {{ nnsProposalId }}</h4>
                <p class="taco-text-black-to-white">Searching for corresponding TACO SNS proposal...</p>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="taco-container taco-container--l1 text-center p-5">
                        <div class="mb-4">
                            <i class="fas fa-exclamation-triangle text-warning fa-3x"></i>
                        </div>
                        <h2 class="taco-text-black-to-white mb-3">NNS Proposal Not Found</h2>
                        <p class="taco-text-black-to-white mb-4">
                            {{ error }}
                        </p>
                        <div class="d-flex gap-2 justify-content-center flex-wrap">
                            <button 
                                @click="retryLookup" 
                                class="btn taco-btn taco-btn--green">
                                <i class="fas fa-redo me-1"></i>Try Again
                            </button>
                            <router-link 
                                to="/nnsvote" 
                                class="btn taco-btn taco-btn--outline">
                                <i class="fas fa-arrow-left me-1"></i>Back to NNS Voting
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'

const route = useRoute()
const router = useRouter()
const tacoStore = useTacoStore()

const loading = ref(true)
const error = ref<string | null>(null)
const nnsProposalId = ref<string>('')

// Extract NNS proposal ID from route params
const extractNNSProposalId = (): string | null => {
    const id = route.params.id as string
    if (!id) {
        return null
    }
    
    // Validate that it's a valid number
    const numericId = parseInt(id, 10)
    if (isNaN(numericId) || numericId <= 0) {
        return null
    }
    
    return id
}

// Look up SNS proposal ID and redirect
const lookupAndRedirect = async () => {
    try {
        loading.value = true
        error.value = null
        
        const nnsId = extractNNSProposalId()
        if (!nnsId) {
            throw new Error('Invalid NNS proposal ID. Please provide a valid positive integer.')
        }
        
        nnsProposalId.value = nnsId
        
        // Look up the corresponding SNS proposal ID
        const snsProposalId = await tacoStore.getSNSProposalIdForNNS(BigInt(nnsId))
        
        if (!snsProposalId) {
            throw new Error(`NNS Proposal ${nnsId} has not been copied to TACO SNS yet. Only copied proposals can be voted on through the DAO.`)
        }
        
        // Redirect to the NNS vote page with the SNS proposal ID
        await router.replace(`/nnsvote/${snsProposalId}`)
        
    } catch (err: any) {
        console.error('Error looking up NNS proposal:', err)
        error.value = err.message || 'An unexpected error occurred while looking up the proposal.'
        loading.value = false
    }
}

// Retry the lookup
const retryLookup = () => {
    lookupAndRedirect()
}

// Initialize on mount
onMounted(() => {
    lookupAndRedirect()
})
</script>

<style scoped>
.min-vh-100 {
    min-height: 100vh;
}

.spinner-border {
    width: 3rem;
    height: 3rem;
}

.fa-3x {
    font-size: 3rem;
}
</style>
