<template>
    <div id="thread-view">
        <div class="container">
            <!-- Thread header -->
            <div class="thread-header">
                <button @click="goBack" class="back-btn">
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Forum
                </button>
                
                <div v-if="currentThread" class="thread-info">
                    <h1>{{ getThreadTitle(currentThread) }}</h1>
                    <div class="thread-meta">
                        <div class="meta-item">
                            <i class="fa-solid fa-hashtag"></i>
                            <span>Thread #{{ threadId }}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-solid fa-user"></i>
                            <span>{{ getPrincipalDisplayName(currentThread.created_by) }}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-solid fa-calendar"></i>
                            <span>{{ formatDate(currentThread.created_at) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content">
                <!-- Loading state -->
                <div v-if="appLoading" class="loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading thread...</span>
                </div>

                <!-- Error state -->
                <div v-else-if="error" class="error">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <span>{{ error }}</span>
                    <button @click="loadThreadData" class="retry-btn">
                        <i class="fa-solid fa-refresh"></i>
                        Retry
                    </button>
                </div>

                <!-- Thread content and posts -->
                <div v-else class="thread-content">
                    <!-- Original thread post -->
                    <div v-if="currentThread" class="original-post">
                        <div class="post-header">
                            <div class="post-author">
                                <i class="fa-solid fa-user"></i>
                                <span>{{ getPrincipalDisplayName(currentThread.created_by) }}</span>
                                <span class="post-type">Original Post</span>
                            </div>
                            <div class="post-date">
                                {{ formatDate(currentThread.created_at) }}
                            </div>
                        </div>
                        <div class="post-body">
                            <p>{{ currentThread.body }}</p>
                        </div>
                    </div>

                    <!-- Posts list -->
                    <div class="posts-section">
                        <div class="posts-header">
                            <h3>Replies ({{ fetchedThreadPosts.length }})</h3>
                            <button @click="loadThreadData" class="refresh-btn">
                                <i class="fa-solid fa-refresh"></i>
                                Refresh
                            </button>
                        </div>

                        <div v-if="fetchedThreadPosts.length > 0" class="posts-list">
                            <div 
                                v-for="post in fetchedThreadPosts" 
                                :key="post.id.toString()"
                                class="post-card"
                            >
                                <div class="post-header">
                                    <div class="post-author">
                                        <i class="fa-solid fa-user"></i>
                                        <span>{{ getPrincipalDisplayName(post.created_by) }}</span>
                                        <span v-if="getPostTitle(post)" class="post-title">{{ getPostTitle(post) }}</span>
                                    </div>
                                    <div class="post-date">
                                        <span>{{ formatDate(post.created_at) }}</span>
                                        <span v-if="post.updated_at !== post.created_at" class="updated">
                                            (edited {{ formatDate(post.updated_at) }})
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="post-body">
                                    <p>{{ post.body }}</p>
                                </div>
                                
                                <div class="post-footer">
                                    <div class="voting">
                                        <div class="vote-count upvotes">
                                            <i class="fa-solid fa-arrow-up"></i>
                                            <span>{{ post.upvote_score.toString() }}</span>
                                        </div>
                                        <div class="vote-count downvotes">
                                            <i class="fa-solid fa-arrow-down"></i>
                                            <span>{{ post.downvote_score.toString() }}</span>
                                        </div>
                                    </div>
                                    <div class="post-id">
                                        Post #{{ post.id.toString() }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="no-posts">
                            <i class="fa-solid fa-comment"></i>
                            <p>No replies yet. Be the first to comment!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'

const router = useRouter()
const route = useRoute()
const tacoStore = useTacoStore()

// Destructure reactive values from store
const { 
    appLoading, 
    fetchedThreadPosts,
    getPostsByThread,
    getThread,
    getPrincipalDisplayName
} = tacoStore

// Local state
const error = ref('')
const currentThread = ref(null)

// Computed
const threadId = computed(() => route.params.id)

// Methods
const loadThreadData = async () => {
    try {
        error.value = ''
        
        // Get thread details
        const thread = await getThread(BigInt(threadId.value))
        if (thread.length > 0) {
            currentThread.value = thread[0]
        } else {
            throw new Error('Thread not found')
        }
        
        // Get posts for this thread
        await getPostsByThread(BigInt(threadId.value))
    } catch (err) {
        console.error('Error loading thread data:', err)
        error.value = 'Failed to load thread data. Please try again.'
    }
}

const goBack = () => {
    router.push('/forum')
}

const getThreadTitle = (thread) => {
    if (thread.title && thread.title.length > 0) {
        return thread.title[0]
    }
    return `Thread #${thread.id.toString()}`
}

const getPostTitle = (post) => {
    if (post.title && post.title.length > 0) {
        return post.title[0]
    }
    return null
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

// Load data on mount
onMounted(() => {
    if (threadId.value) {
        loadThreadData()
    } else {
        error.value = 'No thread ID provided'
    }
})
</script>

<style scoped>
#thread-view {
    padding: 2rem 0;
    min-height: 100vh;
    background: var(--black-to-white);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.thread-header {
    margin-bottom: 2rem;
}

.back-btn {
    background: var(--orange);
    color: var(--black);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.back-btn:hover {
    background: var(--orange-hover);
    transform: translateY(-2px);
}

.thread-info h1 {
    font-size: 2.2rem;
    font-weight: bold;
    color: var(--white-to-black);
    margin-bottom: 1rem;
}

.thread-meta {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--gray);
    font-size: 0.95rem;
}

.content {
    background: var(--light-orange-to-dark-orange);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading, .error {
    text-align: center;
    padding: 3rem 1rem;
}

.loading i, .error i {
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

.original-post {
    background: var(--dark-orange-to-light-orange);
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
    border-left: 4px solid var(--orange);
}

.posts-section {
    margin-top: 2rem;
}

.posts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--orange);
}

.posts-header h3 {
    font-size: 1.5rem;
    color: var(--white-to-black);
    margin: 0;
}

.posts-list {
    display: grid;
    gap: 1.5rem;
}

.post-card {
    background: var(--dark-orange-to-light-orange);
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid var(--orange);
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.post-author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--white-to-black);
    font-weight: 600;
}

.post-type {
    background: var(--orange);
    color: var(--black);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
}

.post-title {
    background: var(--gray);
    color: var(--white);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
}

.post-date {
    color: var(--gray);
    font-size: 0.9rem;
}

.updated {
    font-style: italic;
}

.post-body {
    margin-bottom: 1rem;
}

.post-body p {
    color: var(--white-to-black);
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
}

.post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid var(--orange);
}

.voting {
    display: flex;
    gap: 1rem;
}

.vote-count {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--gray);
    font-size: 0.9rem;
}

.upvotes i {
    color: var(--success-green);
}

.downvotes i {
    color: var(--red);
}

.post-id {
    color: var(--gray);
    font-size: 0.9rem;
}

.no-posts {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--gray);
}

.no-posts i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--orange);
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .thread-info h1 {
        font-size: 1.8rem;
    }
    
    .thread-meta {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .content {
        padding: 1.5rem;
    }
    
    .posts-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .post-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .post-footer {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
}
</style> 