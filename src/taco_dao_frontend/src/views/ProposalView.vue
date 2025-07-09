<template>
  <div class="standard-view">
    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container -->
    <div class="scroll-y-container h-100">
      <!-- bootstrap container -->
      <div class="container p-0">
        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">
          
          <!-- loading state -->
          <div v-if="loading" class="d-flex justify-content-center align-items-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading proposal...</span>
            </div>
          </div>

          <!-- error state -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="fa-solid fa-exclamation-triangle me-2"></i>
            {{ error }}
            <button @click="loadProposal" class="btn btn-outline-danger btn-sm ms-2">
              <i class="fa-solid fa-refresh me-1"></i>
              Retry
            </button>
          </div>

          <!-- proposal not found -->
          <div v-else-if="!proposal" class="text-center py-5">
            <i class="fa-solid fa-search text-muted fa-3x mb-3"></i>
            <h5 class="text-muted">Proposal Not Found</h5>
            <p class="text-muted">Proposal ID {{ proposalId }} could not be found.</p>
            <router-link to="/proposals" class="btn btn-primary">
              <i class="fa-solid fa-arrow-left me-1"></i>
              Back to Proposals
            </router-link>
          </div>

          <!-- proposal content -->
          <div v-else>
            
            <!-- proposal header -->
            <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
              <router-link to="/proposals" class="btn btn-outline-secondary btn-sm">
                <i class="fa-solid fa-arrow-left me-1"></i>
                Back to Proposals
              </router-link>
              <span class="text-muted">Proposal #{{ proposal.id.toString() }}</span>
            </div>

            <!-- proposal details card -->
            <div class="proposal-details taco-container taco-container--l1 mb-4">
              <div class="proposal-header">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h2 class="proposal-title">{{ proposal.title }}</h2>
                  <span :class="getStatusClass(proposal.status)" class="proposal-status">
                    {{ proposal.status }}
                  </span>
                </div>
                
                <div class="proposal-meta">
                  <span class="text-muted">
                    <i class="fa-solid fa-calendar me-1"></i>
                    Created {{ formatDate(proposal.createdAt) }}
                  </span>
                  <span v-if="proposal.proposer" class="text-muted ms-3">
                    <i class="fa-solid fa-user me-1"></i>
                    {{ truncateHex(proposal.proposer) }}
                  </span>
                  <span v-if="proposal.decidedAt" class="text-muted ms-3">
                    <i class="fa-solid fa-gavel me-1"></i>
                    Decided {{ formatDate(proposal.decidedAt) }}
                  </span>
                  <span v-if="proposal.executedAt" class="text-muted ms-3">
                    <i class="fa-solid fa-check-circle me-1"></i>
                    Executed {{ formatDate(proposal.executedAt) }}
                  </span>
                </div>
              </div>

              <!-- proposal summary -->
              <div class="proposal-summary mt-3" v-if="proposal.summary">
                <h5>Summary</h5>
                <div class="proposal-content">{{ proposal.summary }}</div>
              </div>

              <!-- voting stats -->
              <div class="proposal-votes mt-4" v-if="proposal.totalVotes > 0">
                <h5>Voting Results</h5>
                <div class="vote-stats">
                  <div class="vote-stat">
                    <span class="vote-label">Yes</span>
                    <span class="vote-count text-success">{{ formatVotes(proposal.yesVotes) }}</span>
                    <span class="vote-percentage text-success">({{ calculateYesPercentage(proposal).toFixed(1) }}%)</span>
                  </div>
                  <div class="vote-stat">
                    <span class="vote-label">No</span>
                    <span class="vote-count text-danger">{{ formatVotes(proposal.noVotes) }}</span>
                    <span class="vote-percentage text-danger">({{ calculateNoPercentage(proposal).toFixed(1) }}%)</span>
                  </div>
                  <div class="vote-stat">
                    <span class="vote-label">Total</span>
                    <span class="vote-count">{{ formatVotes(proposal.totalVotes) }}</span>
                  </div>
                </div>
                
                <!-- vote progress bar -->
                <div class="vote-progress mt-3">
                  <div class="progress">
                    <div 
                      class="progress-bar bg-success" 
                      role="progressbar" 
                      :style="{ width: calculateYesPercentage(proposal) + '%' }"
                    ></div>
                    <div 
                      class="progress-bar bg-danger" 
                      role="progressbar" 
                      :style="{ width: calculateNoPercentage(proposal) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- proposal actions -->
              <div class="proposal-actions mt-3" v-if="proposal.url">
                <a 
                  :href="proposal.url" 
                  target="_blank" 
                  class="btn btn-outline-primary"
                >
                  <i class="fa-solid fa-external-link me-1"></i>
                  View on NNS
                </a>
              </div>
            </div>

            <!-- discussion section -->
            <div class="discussion-section">
              <TacoTitle level="h3" emoji="💬" title="Discussion" class="mb-3" />
              
              <!-- thread loading -->
              <div v-if="threadLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading discussion...</span>
                </div>
              </div>

              <!-- no thread exists -->
              <div v-else-if="!threadData.exists" class="no-thread-container taco-container taco-container--l1">
                <div class="text-center py-4">
                  <i class="fa-solid fa-comments text-muted fa-3x mb-3"></i>
                  <h5 class="text-muted">No Discussion Thread Yet</h5>
                  <p class="text-muted">Be the first to start the discussion for this proposal.</p>
                  
                  <button 
                    v-if="tacoStore.userLoggedIn" 
                    @click="createThread" 
                    class="btn btn-primary"
                    :disabled="creatingThread"
                  >
                    <span v-if="creatingThread">
                      <i class="fa-solid fa-spinner fa-spin me-2"></i>
                      Creating Thread...
                    </span>
                    <span v-else>
                      <i class="fa-solid fa-plus me-2"></i>
                      Start Discussion
                    </span>
                  </button>
                  
                  <p v-else class="text-muted mt-3">
                    <i class="fa-solid fa-info-circle me-1"></i>
                    Please log in to start a discussion thread.
                  </p>
                </div>
              </div>

              <!-- thread exists -->
              <div v-else class="thread-container">
                <!-- thread info -->
                <div class="thread-info taco-container taco-container--l1 mb-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="thread-title">{{ threadData.thread?.title || `Proposal #${proposal.id} Discussion` }}</h5>
                      <div class="thread-meta">
                        <span class="text-muted">
                          <i class="fa-solid fa-calendar me-1"></i>
                          Started {{ formatDate(new Date(Number(threadData.thread?.created_at || 0) / 1_000_000)) }}
                        </span>
                        <span class="text-muted ms-3">
                          <i class="fa-solid fa-user me-1"></i>
                          {{ tacoStore.getPrincipalDisplayName(threadData.thread?.created_by || '') }}
                        </span>
                      </div>
                    </div>
                    <a 
                      :href="`/forum/thread/${threadData.thread?.id}`" 
                      class="btn btn-outline-primary btn-sm"
                    >
                      <i class="fa-solid fa-external-link me-1"></i>
                      Open in Forum
                    </a>
                  </div>
                  
                  <!-- thread body -->
                  <div v-if="threadData.thread?.body" class="thread-body mt-3">
                    <div class="thread-content">{{ threadData.thread.body }}</div>
                  </div>
                </div>

                <!-- posts loading -->
                <div v-if="postsLoading" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading posts...</span>
                  </div>
                </div>

                <!-- new post form (when thread exists) -->
                <div v-if="tacoStore.userLoggedIn" class="new-post-section mb-4">
                  <div v-if="!showNewPostForm" class="text-center">
                    <button @click="toggleNewPostForm" class="btn btn-primary">
                      <i class="fa-solid fa-plus me-2"></i>
                      Add Comment
                    </button>
                  </div>
                  
                  <div v-else class="new-post-form taco-container taco-container--l1">
                    <div class="mb-3">
                      <label for="newPostBody" class="form-label">
                        <strong>Add a comment</strong>
                      </label>
                      <textarea
                        id="newPostBody"
                        v-model="newPostBody"
                        class="form-control"
                        rows="4"
                        placeholder="Share your thoughts on this proposal..."
                        :disabled="creatingPost"
                      ></textarea>
                    </div>
                    
                    <div class="d-flex justify-content-end gap-2">
                      <button 
                        @click="toggleNewPostForm" 
                        class="btn btn-outline-secondary"
                        :disabled="creatingPost"
                      >
                        Cancel
                      </button>
                      <button 
                        @click="createNewPost" 
                        class="btn btn-primary"
                        :disabled="creatingPost || !newPostBody.trim()"
                      >
                        <span v-if="creatingPost">
                          <i class="fa-solid fa-spinner fa-spin me-2"></i>
                          Posting...
                        </span>
                        <span v-else>
                          <i class="fa-solid fa-paper-plane me-2"></i>
                          Post Comment
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- posts list -->
                <div v-if="posts.length > 0" class="posts-list">
                  <div 
                    v-for="post in posts" 
                    :key="post.id.toString()"
                    :id="`post-${post.id.toString()}`"
                    class="post-card taco-container taco-container--l1 mb-3"
                    :class="{ 'post-highlighted': highlightedPost === post.id.toString() }"
                  >
                    <div class="post-header">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="post-author">
                          <strong>{{ tacoStore.getPrincipalDisplayName(post.created_by) }}</strong>
                          <span class="text-muted ms-2">
                            {{ formatDate(new Date(Number(post.created_at) / 1_000_000)) }}
                          </span>
                          <button 
                            v-if="post.reply_to_post_id && post.reply_to_post_id.length > 0" 
                            @click="scrollToParentPost(post.reply_to_post_id[0])"
                            class="btn btn-link btn-sm text-muted ms-2 p-0 reply-indicator"
                            title="Go to parent post"
                          >
                            <i class="fa-solid fa-reply me-1"></i>
                            reply
                            <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
                          </button>
                        </div>
                        <div class="post-votes">
                          <span class="text-success me-2">
                            <i class="fa-solid fa-thumbs-up me-1"></i>
                            {{ post.upvote_score.toString() }}
                          </span>
                          <span class="text-danger">
                            <i class="fa-solid fa-thumbs-down me-1"></i>
                            {{ post.downvote_score.toString() }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="post-content mt-2">
                      {{ post.body }}
                    </div>
                    
                    <!-- post actions -->
                    <div class="post-actions mt-3">
                      <button 
                        v-if="tacoStore.userLoggedIn && replyingToPost !== post.id"
                        @click="startReply(post.id)" 
                        class="btn btn-outline-primary btn-sm"
                        :disabled="creatingPost"
                      >
                        <i class="fa-solid fa-reply me-1"></i>
                        Reply
                      </button>
                    </div>
                    
                    <!-- reply form -->
                    <div v-if="replyingToPost === post.id" class="reply-form mt-3 ps-3 border-start border-primary">
                      <div class="mb-3">
                        <label :for="`replyBody-${post.id}`" class="form-label">
                          <strong>Reply to {{ tacoStore.getPrincipalDisplayName(post.created_by) }}</strong>
                        </label>
                        <textarea
                          :id="`replyBody-${post.id}`"
                          v-model="replyBody"
                          class="form-control"
                          rows="3"
                          placeholder="Write your reply..."
                          :disabled="creatingPost"
                        ></textarea>
                      </div>
                      
                      <div class="d-flex justify-content-end gap-2">
                        <button 
                          @click="cancelReply" 
                          class="btn btn-outline-secondary btn-sm"
                          :disabled="creatingPost"
                        >
                          Cancel
                        </button>
                        <button 
                          @click="createReply(post.id)" 
                          class="btn btn-primary btn-sm"
                          :disabled="creatingPost || !replyBody.trim()"
                        >
                          <span v-if="creatingPost">
                            <i class="fa-solid fa-spinner fa-spin me-2"></i>
                            Replying...
                          </span>
                          <span v-else>
                            <i class="fa-solid fa-paper-plane me-2"></i>
                            Post Reply
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- no posts -->
                <div v-else-if="!tacoStore.userLoggedIn" class="text-center py-4">
                  <i class="fa-solid fa-inbox text-muted fa-2x mb-2"></i>
                  <p class="text-muted">No posts in this discussion yet.</p>
                  <p class="text-muted">Please log in to start the conversation.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>

    <!-- footer bar -->
    <FooterBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
import TacoTitle from '../components/misc/TacoTitle.vue'

const route = useRoute()
const tacoStore = useTacoStore()

// Get proposal ID from route params
const proposalId = computed(() => {
  const id = route.params.id as string
  return BigInt(id)
})

// State
const loading = ref(false)
const error = ref<string | null>(null)
const threadLoading = ref(false)
const postsLoading = ref(false)
const creatingThread = ref(false)
const creatingPost = ref(false)
const showNewPostForm = ref(false)
const newPostBody = ref('')
const replyingToPost = ref<bigint | null>(null)
const replyBody = ref('')
const highlightedPost = ref<string | null>(null)

// Reactive data
const proposal = ref<any>(null)
const threadData = ref<any>({ exists: false, mapping: null, thread: null })
const posts = ref<any[]>([])

// Find proposal from store
const findProposal = () => {
  return tacoStore.fetchedTacoProposals.find(p => p.id === proposalId.value)
}

// Load proposal data
const loadProposal = async () => {
  try {
    loading.value = true
    error.value = null
    
    // First try to find in already loaded proposals
    let foundProposal = findProposal()
    
    if (!foundProposal) {
      // If not found, fetch more proposals to find it
      console.log('Proposal not in current list, fetching more...')
      await tacoStore.fetchTacoProposals(100) // Fetch more proposals
      foundProposal = findProposal()
    }
    
    if (foundProposal) {
      proposal.value = foundProposal
      await loadThreadData()
    } else {
      error.value = `Proposal #${proposalId.value} not found`
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load proposal'
    console.error('Error loading proposal:', err)
  } finally {
    loading.value = false
  }
}

// Load thread data for proposal
const loadThreadData = async () => {
  try {
    threadLoading.value = true
    threadData.value = await tacoStore.getProposalThread(proposalId.value)
    
    if (threadData.value.exists && threadData.value.thread) {
      await loadPosts(threadData.value.thread.id)
    }
  } catch (err: any) {
    console.error('Error loading thread data:', err)
    // Don't show error for missing thread - it's expected
  } finally {
    threadLoading.value = false
  }
}

// Load posts for thread
const loadPosts = async (threadId: bigint) => {
  try {
    postsLoading.value = true
    posts.value = await tacoStore.getPostsByThread(threadId)
  } catch (err: any) {
    console.error('Error loading posts:', err)
  } finally {
    postsLoading.value = false
  }
}

// Create new thread for proposal
const createThread = async () => {
  try {
    creatingThread.value = true
    error.value = null
    
    const result = await tacoStore.createProposalThread(proposalId.value)
    if (result.success) {
      // Reload thread data to show the new thread
      await loadThreadData()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create discussion thread'
    console.error('Error creating thread:', err)
  } finally {
    creatingThread.value = false
  }
}

// Create new post
const createNewPost = async () => {
  if (!newPostBody.value.trim()) return
  
  try {
    creatingPost.value = true
    error.value = null
    
    const result = await tacoStore.createPost(
      threadData.value.thread.id,
      newPostBody.value.trim()
    )
    
    if (result.success) {
      newPostBody.value = ''
      showNewPostForm.value = false
      // Reload posts to show the new post
      await loadPosts(threadData.value.thread.id)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create post'
    console.error('Error creating post:', err)
  } finally {
    creatingPost.value = false
  }
}

// Create reply to post
const createReply = async (parentPostId: bigint) => {
  if (!replyBody.value.trim()) return
  
  try {
    creatingPost.value = true
    error.value = null
    
    const result = await tacoStore.createPost(
      threadData.value.thread.id,
      replyBody.value.trim(),
      parentPostId
    )
    
    if (result.success) {
      replyBody.value = ''
      replyingToPost.value = null
      // Reload posts to show the new reply
      await loadPosts(threadData.value.thread.id)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create reply'
    console.error('Error creating reply:', err)
  } finally {
    creatingPost.value = false
  }
}

// Toggle new post form
const toggleNewPostForm = () => {
  showNewPostForm.value = !showNewPostForm.value
  if (!showNewPostForm.value) {
    newPostBody.value = ''
  }
}

// Start replying to a post
const startReply = (postId: bigint) => {
  replyingToPost.value = postId
  replyBody.value = ''
  // Close new post form if open
  showNewPostForm.value = false
}

// Cancel reply
const cancelReply = () => {
  replyingToPost.value = null
  replyBody.value = ''
}

// Scroll to parent post
const scrollToParentPost = (parentPostId: bigint) => {
  const parentPostElement = document.getElementById(`post-${parentPostId.toString()}`)
  if (parentPostElement) {
    parentPostElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedPost.value = parentPostId.toString()
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      highlightedPost.value = null
    }, 3000)
  } else {
    console.warn('Parent post not found:', parentPostId.toString())
    // Show toast or alert that parent post is not visible
    tacoStore.addToast({
      id: Date.now(),
      code: 'parent-post-not-found',
      title: 'Parent Post Not Found',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'The parent post may be in a different page or not loaded yet.'
    })
  }
}

// Utility functions
const getStatusClass = (status: string) => {
  switch (status) {
    case 'Open': return 'badge bg-primary'
    case 'Adopted': return 'badge bg-success'
    case 'Executed': return 'badge bg-info'
    case 'Rejected': return 'badge bg-danger'
    case 'Failed': return 'badge bg-warning'
    default: return 'badge bg-secondary'
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatVotes = (votes: bigint) => {
  const num = Number(votes)
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const truncateHex = (hex: string) => {
  if (hex.length <= 10) return hex
  return hex.substring(0, 6) + '...' + hex.substring(hex.length - 4)
}

const calculateYesPercentage = (proposal: any) => {
  if (proposal.totalVotes === BigInt(0)) return 0
  return (Number(proposal.yesVotes) / Number(proposal.totalVotes)) * 100
}

const calculateNoPercentage = (proposal: any) => {
  if (proposal.totalVotes === BigInt(0)) return 0
  return (Number(proposal.noVotes) / Number(proposal.totalVotes)) * 100
}

onMounted(() => {
  loadProposal()
})
</script>

<style scoped lang="scss">
.proposal-details {
  padding: 2rem;
  
  .proposal-header {
    .proposal-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      color: var(--white-to-black);
      line-height: 1.3;
    }
    
    .proposal-status {
      font-size: 0.85rem;
      white-space: nowrap;
    }
    
    .proposal-meta {
      font-size: 0.9rem;
    }
  }
  
  .proposal-summary {
    .proposal-content {
      white-space: pre-wrap;
      line-height: 1.6;
      background: var(--light-orange-to-orange);
      padding: 1rem;
      border-radius: 0.375rem;
      border-left: 4px solid var(--orange);
    }
  }
  
  .proposal-votes {
    .vote-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .vote-stat {
      text-align: center;
      padding: 1rem;
      background: var(--light-orange-to-orange);
      border-radius: 0.375rem;
      
      .vote-label {
        display: block;
        font-size: 0.85rem;
        color: var(--dark-gray);
        margin-bottom: 0.5rem;
      }
      
      .vote-count {
        display: block;
        font-weight: 600;
        font-size: 1.2rem;
        margin-bottom: 0.25rem;
      }
      
      .vote-percentage {
        font-size: 0.85rem;
        font-weight: 500;
      }
    }
    
    .vote-progress {
      .progress {
        height: 10px;
        background-color: var(--light-gray);
      }
    }
  }
}

.discussion-section {
  margin-top: 2rem;
}

.no-thread-container,
.thread-info {
  padding: 2rem;
  text-align: center;
  
  .thread-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
    color: var(--white-to-black);
  }
  
  .thread-meta {
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  
  .thread-content {
    white-space: pre-wrap;
    line-height: 1.6;
    background: var(--light-orange-to-orange);
    padding: 1rem;
    border-radius: 0.375rem;
    border-left: 4px solid var(--orange);
  }
}

.thread-info {
  text-align: left;
}

.new-post-section {
  .new-post-form {
    padding: 1.5rem;
    
    .form-label {
      color: var(--white-to-black);
      margin-bottom: 0.5rem;
    }
    
    .form-control {
      background: var(--light-orange-to-orange);
      border: 1px solid var(--orange);
      color: var(--white-to-black);
      
      &:focus {
        background: var(--light-orange-to-orange);
        border-color: var(--dark-orange);
        box-shadow: 0 0 0 0.2rem rgba(218, 141, 40, 0.25);
        color: var(--white-to-black);
      }
      
      &::placeholder {
        color: var(--dark-gray);
      }
    }
  }
}

.post-card {
  padding: 1.5rem;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  
  &.post-highlighted {
    background-color: var(--yellow-to-orange);
    border: 2px solid var(--orange);
    box-shadow: 0 0 10px rgba(254, 200, 0, 0.3);
  }
  
  .post-header {
    margin-bottom: 1rem;
    
    .post-author {
      font-size: 0.9rem;
      
      .reply-indicator {
        text-decoration: none;
        color: var(--dark-gray) !important;
        font-size: 0.85rem;
        border: none;
        background: none;
        padding: 0;
        margin: 0;
        
        &:hover {
          color: var(--orange) !important;
          text-decoration: underline;
        }
        
        &:focus {
          outline: none;
          box-shadow: none;
        }
      }
    }
    
    .post-votes {
      font-size: 0.85rem;
    }
  }
  
  .post-content {
    white-space: pre-wrap;
    line-height: 1.6;
  }
  
  .post-actions {
    border-top: 1px solid var(--light-orange);
    padding-top: 1rem;
  }
  
  .reply-form {
    background: var(--light-orange-to-orange);
    padding: 1rem;
    border-radius: 0.375rem;
    margin-top: 1rem;
    
    .form-label {
      color: var(--white-to-black);
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    
    .form-control {
      background: var(--white-to-light-orange);
      border: 1px solid var(--orange);
      color: var(--white-to-black);
      
      &:focus {
        background: var(--white-to-light-orange);
        border-color: var(--dark-orange);
        box-shadow: 0 0 0 0.2rem rgba(218, 141, 40, 0.25);
        color: var(--white-to-black);
      }
      
      &::placeholder {
        color: var(--dark-gray);
      }
    }
  }
}
</style> 