<template>

    <div class="forum-thread-view">

        <!-- hamburger menu for small screens -->
        <div class="forum-thread-view__hamburger-menu shadow"
            @click="toggleThreadMenuOnMobile">

            <!-- icon -->
            <i class="fa-light fa-bars forum-thread-view__hamburger-menu__icon"></i>

        </div>

        <!-- no thread selected -->
        <div v-if="!currentThread" class="forum-thread-view__no-thread-selected">

            <!-- twisty arrow -->
            <TwistyArrow class="twisty-arrow" />

            <!-- wiggly arrow -->
            <WigglyArrow class="wiggly-arrow" />

            <!-- no thread selected text -->
            <p>Select a thread to get started</p>

        </div>

        <!-- thread navigation -->
        <div v-if="currentThread" class="forum-thread-view__navigation">

            <!-- thread navigation left -->
            <div class="forum-thread-view__navigation__left">
                
                <!-- buttons -->
                <div class="btn-group">

                    <!-- discussion -->
                    <button class="btn taco-nav-btn taco-nav-btn--active">Discussion</button>

                    <!-- voting -->
                    <button class="btn taco-nav-btn">Voting</button>

                    <!-- vote -->
                    <button class="btn taco-nav-btn">Vote</button>

                    <!-- details -->
                    <button class="btn taco-nav-btn">Details</button>

                </div>

            </div>

            <!-- thread navigation right -->
            <div class="forum-thread-view__navigation__right">

                <!-- sneed head tiny -->
                <img :src="sneedHeadTiny" 
                    alt="Sneed Head Tiny" 
                    class="forum-thread-view__navigation__sneed-head">
                
                <!-- powered by sneed hub -->
                <span class="forum-thread-view__navigation__powered-by">powered by <a href="https://app.sneeddao.com/hub" target="_blank">Sneed Hub</a></span>

            </div>

        </div>

        <!-- thread header -->
        <div v-if="currentThread && !error" class="forum-thread-view__header shadow">

            <!-- thread header left -->
            <div class="forum-thread-view__header__left">
                
                <!-- thread title -->
                <span class="forum-thread-view__header__title">{{ getThreadTitle(currentThread) }}</span>

            </div>

            <!-- thread header right -->
            <div class="forum-thread-view__header__right">
                
                <!-- thread create date -->
                <span class="forum-thread-view__header__date"
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      :title="formatFullDate(currentThread.created_at)">
                    {{ formatDate(currentThread.created_at) }}
                </span>

                <!-- comment count and refresh button -->
                <div class="d-flex align-items-center">

                    <!-- comment count -->
                    <span class="forum-thread-view__header__comment-count">
                        {{ fetchedThreadPosts.length }} comments
                    </span>

                    <!-- refresh button -->
                    <button @click="loadThreadData" class="forum-thread-view__header__refresh btn">
                        <i class="fa-solid fa-refresh"></i>
                    </button>

                </div>

            </div>

        </div>

        <!-- thread content -->
        <div v-if="currentThread" class="forum-thread-view__content">

            <!-- error state -->
            <div v-if="error" class="forum-thread-view__error-container">

                <!--  -->
                <span class="forum-thread-view__error-container__title">Something went tacos up 😱</span>

                <!-- error message -->
                <span class="forum-thread-view__error-container__message">error: {{ error || 'none provided' }}</span>

                <!--  -->
                <div class="forum-thread-view__error-container__reload-container">
                    
                    <!-- retry button -->
                    <button @click="loadThreadData" class="btn taco-nav-btn taco-nav-btn--active">

                        <!-- reload icon -->
                        <i class="fa-solid fa-refresh"></i>

                        <!-- retry text -->
                        <span>Retry</span>
                        
                    </button>

                </div>

            </div>

            <!-- thread posts -->
            <div v-else class="forum-thread-view__posts">

                <!-- original thread post -->
                <div v-if="currentThread" class="forum-thread-view__post shadow">
                    
                    <!-- post header -->
                    <div class="post-header">

                        <!-- post author -->
                        <div class="post-author">
                            <i class="fa-solid fa-user"></i>
                            <span>{{ getPrincipalDisplayName(currentThread.created_by) }}</span>
                            <span class="post-type">Original Post</span>
                        </div>

                        <!-- post date -->
                        <div class="post-date">
                            {{ formatDate(currentThread.created_at) }}
                        </div>

                    </div>

                    <!-- post body -->
                    <div class="post-body">
                        <p>{{ currentThread.body }}</p>
                    </div>
                    
                </div>

                <!-- posts list -->
                <div v-if="fetchedThreadPosts.length > 0" class="forum-thread-view__post-list">

                    <!-- post -->
                    <div v-for="post in fetchedThreadPosts" 
                        :key="post.id.toString()"
                        class="forum-thread-view__post shadow">

                        <!-- post header -->
                        <div class="post-header">

                            <!-- post author -->
                            <div class="post-author">
                                <i class="fa-solid fa-user"></i>
                                <span>{{ getPrincipalDisplayName(post.created_by) }}</span>
                                <span v-if="getPostTitle(post)" class="post-title">{{ getPostTitle(post) }}</span>
                            </div>

                            <!-- post date -->
                            <div class="post-date">
                                <span>{{ formatDate(post.created_at) }}</span>
                                <span v-if="post.updated_at !== post.created_at" class="updated">
                                    (edited {{ formatDate(post.updated_at) }})
                                </span>
                            </div>

                        </div>
                        
                        <!-- post body -->
                        <div class="post-body">
                            <p>{{ post.body }}</p>
                        </div>
                        
                        <!-- post footer -->
                        <div class="post-footer">

                            <!-- voting -->
                            <div class="voting">

                                <!-- upvotes -->
                                <div class="vote-count upvotes">
                                    <i class="fa-solid fa-arrow-up"></i>
                                    <span>{{ post.upvote_score.toString() }}</span>
                                </div>

                                <!-- downvotes -->
                                <div class="vote-count downvotes">
                                    <i class="fa-solid fa-arrow-down"></i>
                                    <span>{{ post.downvote_score.toString() }}</span>
                                </div>

                            </div>

                            <!-- post id -->
                            <div class="post-id">
                                Post #{{ post.id.toString() }}
                            </div>

                        </div>

                    </div>

                </div>

                <!-- no posts -->
                <div v-else class="forum-thread-view__no-posts">
                    <p>No comments yet</p>
                </div>

            </div>

        </div>

        <!-- add a comment button container -->
        <div v-if="currentThread && !error" 
            class="forum-thread-view__add-comment-container">

            <!-- add a comment button -->
            <button class="btn taco-btn taco-btn--green taco-btn--big">Add Comment</button>

        </div>

    </div>

</template>

<style lang="scss" scoped>

/////////////////////
// component style //
/////////////////////

.forum-thread-view {
    overflow: auto;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: var(--light-orange-to-dark-brown);

    // hamburger menu
    &__hamburger-menu {
      display: none;
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background-color: var(--dark-orange-to-light-brown);
      height: fit-content;
      padding: 0.5rem 0.75rem;
      border-radius: 0.25rem;
      z-index: 2000;
      cursor: pointer;
      border: 1px solid var(--dark-orange);

      // icon
      &__icon {
        font-size: 1.5rem;
        color: white;
      }

    }
    
    // no thread selected
    &__no-thread-selected {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        gap: 1rem;
        width: 100%;
        height: 100%;

        p {
            color: var(--black-to-white);
            font-size: 1.5rem;
            text-align: center;
            transform: translateY(-3rem);
        }

        // twisty and wiggly arrows
        .twisty-arrow, .wiggly-arrow {
            color: var(--light-brown-to-dark-orange);
            transform: translateY(-3rem);
        }

        // hide wiggly arrow when not on small screens
        .wiggly-arrow { 
            display: none;
            width: 6rem;
            transform: translate(2rem, -3rem) rotate(-10deg);
        }

        // show twisty arrow when on small screens
        .twisty-arrow {
            display: block;
            width: 100%;
            max-width: 27rem;
        }
    }

    // thread navigation
    &__navigation {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem 0.5rem 0.5rem;
        background-color: var(--dark-orange);
        position: sticky;
        top: 0;
        z-index: 1000;
        border-bottom: 1px solid var(--brown);

        // left
        &__left {
            // placeholder
        }
        
        // right
        &__right {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: auto;
        }

        // button group
        .btn-group {
            
            // button
            .btn {
                padding: 0.25rem 1rem;
            }

        }

        // powered by sneed hub
        &__powered-by {
            font-size: 0.875rem;
            font-family: "Space Mono";
            color: var(--white);

            a {
                color: var(--white);
            }

        }

    }

    // thread header
    &__header {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        justify-content: space-between;
        align-items: center;
        background-color: var(--dark-orange-to-light-brown);
        color: var(--black-to-white);
        margin: 1rem;
        border-radius: 0.5rem;
        padding: 0.5rem 0.5rem 0.5rem 1rem;

        // left
        &__left {
            // placeholder
        }
        
        // right
        &__right {  
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-left: auto;
        }

        // title
        &__title {
            font-size: 1.125rem;
            font-weight: 600;
        }

        // date
        &__date {
            font-size: 1rem;
            font-weight: 400;
        }

        // comment count
        &__comment-count {
            padding: 0.25rem 0.75rem;
            border: 1px solid var(--brown);
            border-radius: 0.25rem;
            background-color: var(--light-orange);
            font-weight: 600;
            text-wrap: nowrap;
            color: var(--black);
        }

        // refresh button
        &__refresh {
            color: var(--dark-brown-to-light-orange);
        }

    }

    // error container
    &__error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        width: 100%;
        gap: 1rem;
        margin-top: 5rem;

        // title
        &__title {
            
        }

        // message  
        &__message {
            
        }

        // reload container 
        &__reload-container {

            // reload button
            .btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
        }
    }

    // thread content
    &__content {
        
    }

    // thread posts
    &__posts {
        padding: 0 1rem;
    }

    // post list
    &__post-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
    }

    // post
    &__post {
        padding: 1rem;
        background-color: var(--orange-to-brown);
        border-radius: 0.5rem;
        border: 1px solid var(--dark-orange);
        color: var(--black-to-white);
    }

    // no posts
    &__no-posts {
        padding: 1rem;
        background-color: var(--black-to-white);
    }

    // add comment container
    &__add-comment-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem 1rem 1.5rem 1rem;
    }
    
}

///////////////////
// media queries //
///////////////////

// phone protrait
@media (max-width: 575.98px) {
    
    // hide twisty arrow
    .twisty-arrow {
        display: none !important;
    }

    // show wiggly arrow
    .wiggly-arrow {
        display: block !important;
    }

    // show hamburger menu
    .forum-thread-view__hamburger-menu {
        display: block !important;
    }

}

// phone landscape
@media (min-width: 576px) and (max-width: 767.98px) { 

    // hide twisty arrow
    .twisty-arrow {
        display: none !important;
    }

    // show wiggly arrow
    .wiggly-arrow {
        display: block !important;
    }

    // show hamburger menu
    .forum-thread-view__hamburger-menu {
        display: block !important;
    }
    
}

// // tablet
// @media (min-width: 767px) and (max-width: 991.98px) {
    
// }

// // small daktop
// @media (min-width: 992px) and (max-width: 1199.98px) {
    
// }

// // medium desktop
// @media (min-width: 1200px) and (max-width: 1399.98px) {
    
// }    

</style> 

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import { ref, onMounted, computed, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { useTacoStore } from '../../stores/taco.store'
    import TwistyArrow from '../../assets/images/twistyArrow.vue'
    import WigglyArrow from '../../assets/images/wigglyArrow.vue'
    import SneedHeadTiny from '../../assets/images/sneed-head-tiny.png'

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // state variables
    const {
        fetchedThreadPosts,
        getPostsByThread,
        getThread,
        getPrincipalDisplayName
    } = tacoStore

    // # ACTIONS #

    // 

    /////////////////////
    // local variables //
    /////////////////////

    // router
    const router = useRouter()
    const route = useRoute()

    // error
    const error = ref('')

    // current thread
    const currentThread = ref(null)

    // show thread menu on mobile
    const showThreadMenuOnMobile = ref(true)

    // images
    const sneedHeadTiny = SneedHeadTiny

    ///////////////////
    // local methods //
    ///////////////////

    // toggle report menu on mobile
    const toggleThreadMenuOnMobile = () => {

        // log
        // console.log('ReportsView.vue: toggle report menu on mobile')

        // toggle
        showThreadMenuOnMobile.value = !showThreadMenuOnMobile.value

        // log
        // console.log('ReportsView.vue: showReportMenuOnMobile', showReportMenuOnMobile.value)

    }

    // load thread data
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

    // get thread title
    const getThreadTitle = (thread) => {
        if (thread.title && thread.title.length > 0) {
            return thread.title[0]
        }
        return `Thread #${thread.id.toString()}`
    }

    // get post title
    const getPostTitle = (post) => {
        if (post.title && post.title.length > 0) {
            return post.title[0]
        }
        return null
    }

    // format date
    const formatDate = (timestamp) => {
        const date = new Date(Number(timestamp) / 1_000_000) // Convert nanoseconds to milliseconds
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }      

    // format full date
    const formatFullDate = (timestamp) => {
        const date = new Date(Number(timestamp) / 1_000_000) // Convert nanoseconds to milliseconds
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }    
    
    //////////////
    // computed //
    //////////////

    // thread id
    const threadId = computed(() => route.params.id)

    //////////////
    // watchers //
    //////////////

    // watch for route change
    watch(() => route.path, async (newPath) => {

        // log
        console.log('ForumThreadView route changed')

        // if threadId is not null, load thread data
        if (threadId.value) {
            loadThreadData()
        } else {
            // error.value = 'No thread ID provided'
            currentThread.value = null
        }

    }, { immediate: true })
  
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // on mounted
    onMounted(async () => {

        // log
        console.log('forum discussion view mounted')

        // 
        if (threadId.value) {
            loadThreadData()
        } else {
            error.value = 'No thread ID provided'
        }

    })

</script>