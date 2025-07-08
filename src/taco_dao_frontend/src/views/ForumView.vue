<template>
    <div id="forum-view">
        <div class="container">
            <div class="header">
                <h1>TACO DAO Forum - Proposals</h1>
                <p>Discussion threads for TACO DAO proposals</p>
            </div>

            <div class="content">
                <!-- Loading state -->
                <div v-if="appLoading" class="loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading forum data...</span>
                </div>

                <!-- Error state -->
                <div v-else-if="error" class="error">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <span>{{ error }}</span>
                    <button @click="loadForumData" class="retry-btn">
                        <i class="fa-solid fa-refresh"></i>
                        Retry
                    </button>
                </div>

                <!-- Threads list -->
                <div v-else-if="fetchedProposalsThreads.length > 0" class="threads-list">
                    <div class="threads-header">
                        <h3>Proposal Discussion Threads ({{ fetchedProposalsThreads.length }})</h3>
                        <button @click="loadForumData" class="refresh-btn">
                            <i class="fa-solid fa-refresh"></i>
                            Refresh
                        </button>
                    </div>

                    <div class="threads-container">
                        <div 
                            v-for="thread in fetchedProposalsThreads" 
                            :key="thread.id.toString()"
                            class="thread-card"
                            @click="goToThread(thread.id)"
                        >
                            <div class="thread-header">
                                <h4 class="thread-title">
                                    {{ getThreadTitle(thread) }}
                                </h4>
                                <div class="thread-meta">
                                    <span class="thread-id">Thread #{{ thread.id.toString() }}</span>
                                    <span class="thread-date">{{ formatDate(thread.created_at) }}</span>
                                </div>
                            </div>
                            
                            <div class="thread-body">
                                <p>{{ truncateText(thread.body, 200) }}</p>
                            </div>
                            
                            <div class="thread-footer">
                                <div class="author">
                                    <i class="fa-solid fa-user"></i>
                                    <span>{{ getPrincipalDisplayName(thread.created_by) }}</span>
                                </div>
                                <div class="updated">
                                    <i class="fa-solid fa-clock"></i>
                                    <span>Updated {{ formatDate(thread.updated_at) }} by {{ getPrincipalDisplayName(thread.updated_by) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else class="empty-state">
                    <i class="fa-solid fa-comments"></i>
                    <h3>No Proposal Threads Found</h3>
                    <p>There are currently no discussion threads for proposals.</p>
                    <button @click="loadForumData" class="refresh-btn">
                        <i class="fa-solid fa-refresh"></i>
                        Check Again
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTacoStore } from '../stores/taco.store'

const router = useRouter()
const tacoStore = useTacoStore()

// Destructure reactive values from store (maintaining reactivity)
const { 
    appLoading, 
    fetchedProposalsThreads
} = storeToRefs(tacoStore)

// Destructure methods (methods don't need reactivity)
const { getProposalsThreads, getPrincipalDisplayName } = tacoStore

// Local state
const error = ref('')

// Methods
const loadForumData = async () => {
    try {
        error.value = ''
        await getProposalsThreads()
    } catch (err) {
        console.error('Error loading forum data:', err)
        error.value = 'Failed to load forum data. Please try again.'
    }
}

const goToThread = (threadId) => {
    router.push(`/forum/thread/${threadId.toString()}`)
}

const getThreadTitle = (thread) => {
    if (thread.title && thread.title.length > 0) {
        return thread.title[0]
    }
    return `Thread #${thread.id.toString()}`
}

const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) / 1_000_000) // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

// Load data on mount
onMounted(() => {
    loadForumData()
})
</script>

<style scoped>
#forum-view {
    padding: 2rem 0;
    min-height: 100vh;
    background: var(--black-to-white);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.header {
    text-align: center;
    margin-bottom: 3rem;
}

.header h1 {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--white-to-black);
    margin-bottom: 0.5rem;
}

.header p {
    font-size: 1.1rem;
    color: var(--gray);
    margin: 0;
}

.content {
    background: var(--light-orange-to-dark-orange);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading, .error, .empty-state {
    text-align: center;
    padding: 3rem 1rem;
}

.loading i, .error i, .empty-state i {
    font-size: 3rem;
    color: var(--orange);
    margin-bottom: 1rem;
}

.loading span, .error span {
    display: block;
    font-size: 1.1rem;
    color: var(--white-to-black);
    margin-top: 1rem;
}

.retry-btn, .refresh-btn {
    background: var(--orange);
    color: var(--black);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.3s ease;
}

.retry-btn:hover, .refresh-btn:hover {
    background: var(--orange-hover);
    transform: translateY(-2px);
}

.threads-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--orange);
}

.threads-header h3 {
    font-size: 1.5rem;
    color: var(--white-to-black);
    margin: 0;
}

.threads-container {
    display: grid;
    gap: 1.5rem;
}

.thread-card {
    background: var(--dark-orange-to-light-orange);
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.thread-card:hover {
    border-color: var(--orange);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.thread-header {
    margin-bottom: 1rem;
}

.thread-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--white-to-black);
    margin: 0 0 0.5rem 0;
}

.thread-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: var(--gray);
}

.thread-body {
    margin-bottom: 1rem;
}

.thread-body p {
    color: var(--white-to-black);
    line-height: 1.5;
    margin: 0;
}

.thread-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--gray);
    padding-top: 1rem;
    border-top: 1px solid var(--orange);
}

.author, .updated {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.empty-state h3 {
    font-size: 1.8rem;
    color: var(--white-to-black);
    margin: 1rem 0 0.5rem 0;
}

.empty-state p {
    color: var(--gray);
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .header h1 {
        font-size: 2rem;
    }
    
    .content {
        padding: 1.5rem;
    }
    
    .threads-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .thread-footer {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
    }
}
</style> 