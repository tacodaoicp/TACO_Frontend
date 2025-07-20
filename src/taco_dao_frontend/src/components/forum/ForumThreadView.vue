<template>

    <div class="forum-thread-view">

        <!-- loading curtain -->
        <div v-show="componentLoading" class="forum-thread-view__loading-curtain">
            
            <!-- astronaut -->
            <img :src="astronautLoaderUrl" class="loading-img">
  
        </div>

        <!-- hamburger menu for small screens -->
        <div class="forum-thread-view__hamburger-menu shadow"
            @click="toggleThreadMenuOnMobile">

            <!-- icon -->
            <i class="fa-light fa-bars forum-thread-view__hamburger-menu__icon"></i>

        </div>

        <!-- no proposal selected -->
        <div v-if="!proposalSelected && !error" class="forum-thread-view__no-thread-selected">

            <!-- twisty arrow -->
            <TwistyArrow class="twisty-arrow" />

            <!-- wiggly arrow -->
            <WigglyArrow class="wiggly-arrow" />

            <!-- no thread selected text -->
            <p>Select a proposal to discuss</p>

        </div>

        <!-- thread navigation -->
        <div v-if="proposalSelected && !error" class="forum-thread-view__navigation">

            <!-- thread navigation left -->
            <div class="forum-thread-view__navigation__left">
                
                <!-- buttons -->
                <div class="btn-group">

                    <!-- discussion -->
                    <button class="btn taco-nav-btn taco-nav-btn--active">Discussion</button>

                    <!-- voting -->
                    <!-- <button class="btn taco-nav-btn">Voting</button> -->

                    <!-- vote -->
                    <!-- <button class="btn taco-nav-btn">Vote</button> -->

                    <!-- details -->
                    <!-- <button class="btn taco-nav-btn">Details</button> -->

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
        <div v-if="proposalSelected && !error" class="forum-thread-view__header shadow">

            <!-- thread header left -->
            <div class="forum-thread-view__header__left">
                
                <!-- thread title -->
                <span v-if="proposal" class="forum-thread-view__header__title">{{ proposal.title }}</span>

            </div>

            <!-- thread header right -->
            <div class="forum-thread-view__header__right">
                
                <!-- thread create date -->
                <!-- :title="formatFullDate(currentThread.created_at)" -->
                <span v-if="proposal"
                      class="forum-thread-view__header__date"
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      title="test">
                    {{ formatShortDate(proposal.createdAt) }}
                </span>

                <!-- comment count and refresh button -->
                <div class="d-flex align-items-center">

                    <!-- comment count -->
                    <span class="forum-thread-view__header__comment-count">
                        {{ posts.length }} comments
                    </span>

                    <!-- refresh button -->
                    <!-- @click="loadThreadData" -->
                    <button @click="refreshPosts"
                        class="forum-thread-view__header__refresh btn">
                        <i class="fa-solid fa-refresh"></i>
                    </button>

                </div>

            </div>

        </div>

        <!-- thread content -->
        <div v-if="proposalSelected && !error" class="forum-thread-view__content">

            <!-- thread posts -->
            <div class="forum-thread-view__posts">

                <!-- posts list -->
                <div v-if="posts.length > 0" class="forum-thread-view__post-list">

                    <!-- post -->
                    <div v-for="post in sortedPosts" :key="post.id.toString()" class="forum-thread-view__post shadow">

                        <!-- post header -->
                        <div class="forum-thread-view__post-header">

                            <!-- expand/collapse button -->
                            <button class="forum-thread-view__post-expand-collapse-btn">
                                <i class="fa-solid fa-minus"></i>
                            </button>

                            <!-- post author -->
                            <div class="forum-thread-view__post-author">
                                <span>{{ getPrincipalDisplayName(post.created_by) }}</span>
                            </div>

                            <!-- separator -->
                            <span class="forum-thread-view__post-bullet">•</span>

                            <!-- post date -->
                            <div class="forum-thread-view__post-date">

                                <!-- post date text -->
                                <span data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                :title="formatTimestampDateLong(post.created_at)">
                                    {{ formatTimestampDate(post.created_at) }}
                                </span>

                            </div>

                            <!-- post update -->
                            <div v-if="isPostEdited(post)" class="forum-thread-view__post-updated">

                                <!-- update date text -->
                                <span data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                :title="formatTimestampDateLong(post.updated_at)">
                                    edited {{ formatTimestampDate(post.updated_at) }}
                                </span>

                            </div>

                        </div>
                        
                        <!-- post body -->
                        <div class="forum-thread-view__post-body">

                            <!-- post title -->
                            <p class="forum-thread-view__post-title">{{ post.title[0] }}</p>

                            <!-- post body text-->
                            <p class="forum-thread-view__post-text">{{ post.body }}</p>

                        </div>
                        
                        <!-- post footer -->
                        <div class="forum-thread-view__post-footer">

                            <!-- voting -->
                            <div class="forum-thread-view__post-voting">

                                <!-- voting top -->
                                <div class="forum-thread-view__post-voting__top">

                                    <!-- upvote button -->
                                    <div class="forum-thread-view__post-voting__upvote-btn">

                                        <!-- vote arrow -->
                                        <svg class="forum-thread-view__post-voting__vote-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.087 11.252">
                                            <path fill="currentColor" d="M.909,6.24h2.225v5.012h4.816v-5.012h2.222c.239,0,.47-.093.643-.258.348-.331.363-.881.032-1.23-.01-.011-.021-.022-.032-.032h0L6.2.258h0c-.366-.348-.941-.348-1.307,0L.269,4.718c-.348.332-.362.883-.031,1.231.01.01.02.021.031.031.172.164.399.257.637.26" />
                                        </svg>

                                    </div>

                                    <!-- vote count -->
                                    <div class="forum-thread-view__post-voting__vote-count">

                                        <!-- vote count number -->
                                        <span class="forum-thread-view__post-voting__vote-count-number">0</span>

                                    </div>

                                    <!-- downvote button -->
                                    <div class="forum-thread-view__post-voting__downvote-btn">

                                        <!-- vote arrow -->
                                        <svg class="forum-thread-view__post-voting__vote-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.087 11.252">
                                            <path fill="currentColor" d="M.909,6.24h2.225v5.012h4.816v-5.012h2.222c.239,0,.47-.093.643-.258.348-.331.363-.881.032-1.23-.01-.011-.021-.022-.032-.032h0L6.2.258h0c-.366-.348-.941-.348-1.307,0L.269,4.718c-.348.332-.362.883-.031,1.231.01.01.02.021.031.031.172.164.399.257.637.26" />
                                        </svg>

                                    </div>

                                </div>

                                <!-- voting bottom -->
                                <div class="forum-thread-view__post-voting__bottom">

                                    <!-- my vp -->
                                    <span class="forum-thread-view__post-voting__my-vp">0</span>

                                </div>



                            </div>

                            <!-- reply button -->
                            <button class="forum-thread-view__post-reply-btn">

                                <!-- reply icon -->
                                <i class="fa-solid fa-comment"></i>

                                <!-- reply text -->
                                <span>Reply</span>

                            </button>

                        </div>

                    </div>

                </div>

                <!-- no posts -->
                <div v-else class="forum-thread-view__no-posts">
                    <span>No comments yet</span>
                </div>

            </div>

        </div>

        <!-- add a comment button container -->
        <div v-if="proposalSelected && !error" 
            class="forum-thread-view__add-comment-container">

            <!-- login to comment -->
            <button v-if="!userLoggedIn"
                    class="btn d-flex align-items-center gap-1"
                    @click="iidLogIn()">

                <!-- dfinity logo -->
                <DfinityLogo style="width: 1.375rem;" />
                
                <!-- login to post -->
                <span>Login to Comment</span>

            </button>

            <!-- add a comment button -->
            <button v-else
                    class="btn taco-btn taco-btn--green taco-btn--big">Add a Comment</button>

        </div>

        <!-- error -->
        <div v-if="error" class="forum-thread-view__error-container">

            <!-- title -->
            <span class="forum-thread-view__error-container__title">Something went tacos up 😱</span>

            <!-- error message -->
            <span class="forum-thread-view__error-container__message">error: {{ error || 'none provided' }}</span>

            <!-- reload container -->
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
    border-top-right-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;

    // loading curtain
    &__loading-curtain {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;

      .loading-img {
        width: 10rem;
      }

    }    

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

        // post header
        &-header {
            display: flex;
            align-items: baseline;
        }

        // post expand/collapse button
        &-expand-collapse-btn {
            background-color: transparent;
            border: none;
            cursor: pointer;
            border: 1px solid var(--dark-orange);
            border-radius: 0.25rem;
            margin-right: 0.5rem;

            // icon
            i {
                color: var(--black-to-white);
                font-size: 0.75rem;
            }
        }

        // post author
        &-author {
            font-weight: 600;
        }

        // post bullet
        &-bullet {
            margin: 0 0.375rem;
            transform: scale(1.5);
        }

        // post date
        &-date {
            font-size: 0.925rem;
        }

        // post updated
        &-updated {
            font-size: 0.925rem;
            margin-left: 0.75rem;

            span {
                font-style: italic;
            }
        }

        // post body
        &-body {
            margin-top: 0.75rem;
        }

        // post title
        &-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
            font-size: 1.125rem;
        }

        // post text
        &-text {
            margin-bottom: 0;
        }

        // post footer
        &-footer {
            display: flex;
            align-items: start;
            gap: 0.5rem;
            margin-top: 0.75rem;
        }

        // post voting
        &-voting {
            display: flex;
            flex-direction: column;
            align-items: center;

            // voting top
            &__top {
                display: flex;
                gap: 0.125rem;
            }

            // voting bottom
            &__bottom {
                
            }

            // upvote and downvote buttons
            &__upvote-btn, &__downvote-btn, &__vote-count {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--light-orange);
                border: 1px solid var(--dark-orange);
                border-radius: 0.25rem;
                padding: 0.5rem;
            }

            // upvote button
            &__upvote-btn {

                // vote arrow
                .forum-thread-view__post-voting__vote-arrow {
                    color: var(--success-green);
                }
            }

            // downvote button
            &__downvote-btn {
                color: var(--black);

                // vote arrow
                .forum-thread-view__post-voting__vote-arrow {
                    transform: rotate(180deg);
                    color: var(--red);
                }
            }

            // vote count
            &__vote-count {
                
                // vote count number
                &-number {
                    line-height: 0;
                    font-weight: 600;
                    color: var(--dark-gray);
                }
            }

            // vote arrow
            &__vote-arrow {
                width: 0.75rem;
            }

            // my vp
            &__my-vp {
                color: var(--brown);
                font-size: 0.875rem;
            }

        }

        // post reply button
        &-reply-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background-color: var(--light-orange);
            border: 1px solid var(--dark-orange);
            border-radius: 0.25rem;
            padding: 0.25rem 0.75rem;

            // icon
            i {
                color: var(--black);
                font-size: 0.875rem;
            }

            // text
            span {
                font-size: 0.875rem;
            }

        }
        
    }

    // no posts
    &__no-posts {
        text-align: center;
        padding: 1.5rem 0 1rem;
        
        span {
            font-size: 1.25rem;
            color: var(--black-to-white);
        }
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
    import { useRoute } from 'vue-router'
    import { useTacoStore } from '../../stores/taco.store'
    import TwistyArrow from '../../assets/images/twistyArrow.vue'
    import WigglyArrow from '../../assets/images/wigglyArrow.vue'
    import SneedHeadTiny from '../../assets/images/sneed-head-tiny.png'
    import astronautLoader from '../../assets/images/astonautLoader.webp'
    import DfinityLogo from "../../assets/images/dfinityLogo.vue"

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    const {
        fetchedThreadPosts,
        getPostsByThread,
        getThread,
        getPrincipalDisplayName,
        userLoggedIn
    } = tacoStore

    // # ACTIONS #

    // iid login
    const { iidLogIn } = tacoStore // not reactive

    /////////////////////
    // local variables //
    /////////////////////

    // router
    const route = useRoute()

    // component loading
    const componentLoading = ref(false)

    // error
    const error = ref<string | null>(null)

    // proposal
    const proposal = ref<any>(null)

    // proposal selected
    const proposalSelected = ref(true)

    // thread has been started
    const threadStarted = ref(false)

    // images
    const astronautLoaderUrl = astronautLoader
    const sneedHeadTiny = SneedHeadTiny    



    

    const creatingThread = ref(false)
    const creatingPost = ref(false)
    const showNewPostForm = ref(false)
    const newPostBody = ref('')
    const replyingToPost = ref<bigint | null>(null)
    const replyBody = ref('')
    const highlightedPost = ref<string | null>(null)
    const userVotes = ref<Map<string, { voteType: 'upvote' | 'downvote' | null; voting: boolean }>>(new Map())

    
    const threadData = ref<any>({ exists: false, mapping: null, thread: null })
    const posts = ref<any[]>([])



    ///////////////////
    // local methods //
    ///////////////////

    // load proposal
    const loadProposal = async () => {

        // log
        // console.log('loading proposal')

        // set component loading to true
        componentLoading.value = true

        // try
        try {

            // nullify error
            error.value = null
            
            // try to find in already loaded proposals
            let foundProposal = findProposal()
            
            // if no proposal found
            if (!foundProposal) {

                // log
                // console.log('Proposal not in current list, fetching more...')

                // fetch more proposals
                await tacoStore.fetchTacoProposals(100)

                // try to find proposal again
                foundProposal = findProposal()

            }
            
            // if proposal found
            if (foundProposal) {

                // log
                // console.log('proposal found')

                // set proposal to found proposal
                proposal.value = foundProposal

                // load thread data
                await loadThreadData()

            } 
            
            // else
            else {

                // set error
                error.value = `Proposal #${proposalId.value} not found`

            }

        } 

        // catch
        catch (err: any) {

            // set error
            error.value = err.message || 'Failed to load proposal'

            // log error
            console.error('Error loading proposal:', err)

        } 
        
        // finally
        finally {

            // set component loading to false
            componentLoading.value = false
            
        }

    }

    // find proposal from store
    const findProposal = () => {
        return tacoStore.fetchedTacoProposals.find(p => p.id === proposalId.value)
    }

    // load thread
    const loadThreadData = async () => {

        // log
        // console.log('loading thread data')

        // try
        try {

            // get thread data
            threadData.value = await tacoStore.getProposalThread(proposalId.value!)
            
            // if thread data exists and thread exists
            if (threadData.value.exists && threadData.value.thread) {

                // load posts
                await loadPosts(threadData.value.thread.id)

                // initialize user votes
                await initializeUserVotes()

            }

        }
        
        // catch
        catch (err: any) {

            // log error
            console.error('Error loading thread data:', err)
            
            // Don't show error for missing thread - it's expected
        }

    }

    // load posts
    const loadPosts = async (threadId: bigint) => {    

        // try
        try {

            // get posts by thread
            posts.value = await tacoStore.getPostsByThread(threadId)

        } catch (err: any) {

            // log error
            console.error('Error loading posts:', err)

        }

    }

    // refresh posts
    const refreshPosts = async () => {

        // component loading
        componentLoading.value = true

        // load posts
        await loadPosts(threadData.value.thread.id)

        // component loading
        componentLoading.value = false
    }

    // initialize user votes
    const initializeUserVotes = async () => {

        // if user is not logged in or there are no posts
        if (!tacoStore.userLoggedIn || posts.value.length === 0) return
        
        // try
        try {

            // get user principal
            const userPrincipal = tacoStore.userPrincipal

            // map through posts
            const voteChecks = posts.value.map(async (post) => {

                // try
                try {

                    // get votes for post
                    const votes = await tacoStore.getPostVotes(post.id)

                    // find user vote
                    const userVote = votes.find(vote => vote.voter_principal.toString() === userPrincipal)

                    // get vote type
                    const voteType = userVote ? ('upvote' in userVote.vote_type ? 'upvote' : 'downvote') : null
                    
                    // set user vote
                    userVotes.value.set(post.id.toString(), {
                        voteType,
                        voting: false
                    })

                } 
                
                // catch
                catch (error) {

                    // log error
                    console.error('Error getting votes for post:', post.id, error)

                    // set user vote to null
                    userVotes.value.set(post.id.toString(), {
                        voteType: null,
                        voting: false
                    })

                }

            })
            
            // wait for all vote checks to complete
            await Promise.all(voteChecks)

        } 
        
        // catch
        catch (error) {

            // log error
            console.error('Error initializing user votes:', error)

        }

    }






    // get user's current vote for a post
    const getUserVote = (postId: bigint) => {
        return userVotes.value.get(postId.toString()) || { voteType: null, voting: false }
    }

    // vote on a post
    const voteOnPost = async (postId: bigint, voteType: 'upvote' | 'downvote') => {
        if (!tacoStore.userLoggedIn) return
        
        const currentVote = getUserVote(postId)
        
        try {
            // Set voting state
            userVotes.value.set(postId.toString(), {
            ...currentVote,
            voting: true
            })
            
            // If user is clicking the same vote type, retract the vote
            if (currentVote.voteType === voteType) {
            await tacoStore.retractVote(postId)
            userVotes.value.set(postId.toString(), {
                voteType: null,
                voting: false
            })
            } else {
            // Vote or change vote
            await tacoStore.voteOnPost(postId, voteType)
            userVotes.value.set(postId.toString(), {
                voteType,
                voting: false
            })
            }
            
            // Refresh the posts to get updated vote counts
            if (threadData.value.exists && threadData.value.thread) {
            await loadPosts(threadData.value.thread.id)
            // Reinitialize user votes for the updated posts
            await initializeUserVotes()
            }
            
        } catch (error: any) {
            console.error('Error voting on post:', error)
            userVotes.value.set(postId.toString(), {
            ...currentVote,
            voting: false
            })
            
            // Show error toast
            tacoStore.addToast({
            id: Date.now(),
            code: 'vote-error',
            title: 'Vote Failed',
            icon: 'fa-solid fa-exclamation-triangle',
            message: `Failed to vote: ${error.message || 'Unknown error'}`
            })
        }
    }

    // create new thread for proposal
    const createThread = async () => {
        try {
            creatingThread.value = true
            error.value = null
            
            const result = await tacoStore.createProposalThread(proposalId.value!)
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

    // create new post
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
            // Reinitialize user votes for the updated posts
            await initializeUserVotes()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to create post'
            console.error('Error creating post:', err)
        } finally {
            creatingPost.value = false
        }
    }

    // create reply to post
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
            // Reinitialize user votes for the updated posts
            await initializeUserVotes()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to create reply'
            console.error('Error creating reply:', err)
        } finally {
            creatingPost.value = false
        }
    }

    // toggle new post form
    const toggleNewPostForm = () => {
        showNewPostForm.value = !showNewPostForm.value
        if (!showNewPostForm.value) {
            newPostBody.value = ''
        }
    }

    // start replying to a post
    const startReply = (postId: bigint) => {
        replyingToPost.value = postId
        replyBody.value = ''
        // Close new post form if open
        showNewPostForm.value = false
    }

    // cancel reply
    const cancelReply = () => {
        replyingToPost.value = null
        replyBody.value = ''
    }

    // scroll to parent post
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

    // toggle thread menu on mobile
    const toggleThreadMenuOnMobile = () => {
        // placeholder for mobile menu toggle functionality
        // console.log('toggle thread menu on mobile')
    }    

    // utility functions
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
    const formatShortDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }
    const formatTimestampDate = (timestamp: bigint) => {
        // convert nanoseconds to milliseconds for Date constructor
        const milliseconds = Number(timestamp) / 1_000_000
        return new Date(milliseconds).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }
    const formatTimestampDateLong = (timestamp: bigint) => {
        // convert nanoseconds to milliseconds for Date constructor
        const milliseconds = Number(timestamp) / 1_000_000
        return new Date(milliseconds).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // check if post was edited (at least 1 minute apart)
    const isPostEdited = (post: any) => {
        // convert nanoseconds to milliseconds
        const createdMs = Number(post.created_at) / 1_000_000
        const updatedMs = Number(post.updated_at) / 1_000_000
        
        // calculate time difference in seconds
        const timeDiffSeconds = (updatedMs - createdMs) / 1000
        
        // only show edited if difference is 60+ seconds (1 minute)
        return timeDiffSeconds >= 60
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
    
    //////////////
    // computed //
    //////////////

    // proposal id as bigint
    const proposalId = computed(() => {

        // get id from route params
        const id = route.params.id as string

        // return proposal id if id exists, otherwise null
        return id ? BigInt(id) : null

    })

    // sorted posts by created date (most recent first)
    const sortedPosts = computed(() => {
        return [...posts.value].sort((a, b) => {
            const aCreated = Number(a.created_at)
            const bCreated = Number(b.created_at)
            return bCreated - aCreated // descending order (newest first)
        })
    })

    //////////////
    // watchers //
    //////////////

    // watch for route change
    watch(() => route.path, async (newPath) => {

        // log
        // console.log('ForumThreadView: route changed')

        // if proposalId is not null
        if (proposalId.value) {
            
            // log
            // console.log('a proposal was selected')

            // set proposal selected to true
            proposalSelected.value = true

            // clear posts
            posts.value = []

            // load proposal
            await loadProposal()

        } else {

            // log
            // console.log('no proposal was selected')

            // set proposal selected to false
            proposalSelected.value = false

        }

    }, { immediate: true })
  
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // on mounted
    onMounted(async () => {

        // log
        // console.log('forum discussion view mounted')

        // if proposalId is not null
        if (proposalId.value) {

            // log
            // console.log('a proposal is already selected')

            // load proposal
            await loadProposal()

        } else {

            // log
            // console.log('no proposal selected yet')

            // set proposal selected to false
            proposalSelected.value = false

        }

    })

</script>