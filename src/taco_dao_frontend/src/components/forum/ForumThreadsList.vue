<template>

    <div class="forum-threads-list">

        <!-- loading curtain -->
        <div v-show="componentLoading" class="forum-threads-list__loading-curtain">
            
          <!-- astronaut -->
          <img :src="astronautLoaderUrl" class="loading-img">

        </div>

        <!-- title container -->
        <div class="forum-threads-list__title-container">

          <!-- inner -->
          <div class="forum-threads-list__title-container__inner">
        
            <!-- title -->
            <h2 class="forum-threads-list__title
                        space-mono-semibold">Browse Proposals</h2>

            <!-- search and filter dropdown -->
            <div class="forum-threads-list__search-and-filter-dropdown">

                <!-- search -->
                <input type="text" 
                v-model="searchQuery"
                placeholder="Search"
                class="forum-threads-list__search taco-input">

                <!-- type filter -->
                <select v-model="selectedTopic" class="forum-threads-list__filter taco-input">
                    <option value="all">All Topics</option>
                    <option value="DaoCommunitySettings">DAO Community Settings</option>
                    <option value="SnsFrameworkManagement">SNS Framework Management</option>
                    <option value="DappCanisterManagement">Dapp Canister Management</option>
                    <option value="ApplicationBusinessLogic">Application Business Logic</option>
                    <option value="Governance">Governance</option>
                    <option value="TreasuryAssetManagement">Treasury Asset Management</option>
                    <option value="CriticalDappOperations">Critical Dapp Operations</option>
                </select>

            </div>

          </div>
            
        </div>

        <!-- threads list container -->
        <div class="forum-threads-list__list-container">

            <!-- threads list -->
            <ul class="forum-threads-list__list">

                <!-- thread item -->
                <router-link
                  v-for="proposal in filteredProposals"
                  :key="proposal.id.toString()"
                  :to="`/chat/forum/${proposal.id.toString()}`"
                  :class="['forum-threads-list__list-item', { 'forum-threads-list__thread--active': activeThreadId === proposal.id.toString() }]"
                  @click="toggleThreadMenu">

                  <!-- thread -->
                  <div class="forum-threads-list__thread">

                      <!-- left -->
                      <div class="forum-threads-list__thread__left">

                          <!-- thread icon -->              
                          <div class="forum-threads-list__thread__icon shadow">#{{ proposal.id.toString() }}</div>

                          <!-- thread status -->
                          <span class="forum-threads-list__thread__status"
                                :class="['forum-threads-list__thread__status', { 'forum-threads-list__thread__status--passed': proposal.status === 'Executed', 'forum-threads-list__thread__status--failed': proposal.status === 'Rejected' }]">
                          {{ formatStatus(proposal.status) }}</span>

                      </div>

                      <!-- right -->
                      <div class="forum-threads-list__thread__right">

                          <!-- top -->
                          <div class="forum-threads-list__thread__right__top">

                              <!-- type -->
                              <span class="forum-threads-list__thread__type">
                                {{ getTopicKey(proposal.topic) }}
                              </span>

                              <!-- date -->
                              <span class="forum-threads-list__thread__date">
                                {{ formatDate(proposal.createdAt) }}
                              </span>

                          </div>

                          <!-- middle -->
                          <div class="forum-threads-list__thread__right__middle">

                              <!-- title -->
                              <span class="forum-threads-list__thread__title">{{ proposal.title }}</span>

                          </div>

                          <!-- bottom -->
                          <div class="forum-threads-list__thread__right__bottom">
                              
                              <!-- author -->
                              <span class="forum-threads-list__thread__author">name</span>

                              <!-- principal -->
                              <span class="forum-threads-list__thread__principal">{{ truncateHex(proposal.proposer) }}</span>

                          </div>

                      </div>

                  </div>

                </router-link>
                
            </ul>

            <!-- load more button container -->
            <div v-if="hasMoreProposals" class="forum-threads-list__load-more-button-container">

                <!-- load more button -->
                <button @click="loadMoreProposals" 
                        class="forum-threads-list__load-more-button btn taco-btn taco-btn--green taco-btn--big">Load More</button>

            </div>

        </div>

    </div>

</template>

<style lang="scss" scoped>

.forum-threads-list {
    overflow: auto;
    position: relative;
    min-height: 100%;

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
      border-top-left-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;

      .loading-img {
        width: 10rem;
      }
    }

    ///////////
    // title //
    ///////////

    // title container
    &__title-container {
      margin: 0;
      padding: 1rem 0 0;
      position: sticky;
      top: 0;
      background-color: var(--orange-to-light-brown);
      transition: background-color 0.25s;
      border-top-left-radius: 0.5rem;

      // inner
      &__inner {
        padding: 0 0 0.5rem;
        margin: 0 1rem;
        border-bottom: 1px solid var(--black-to-white);
        transition: border-color 0.25s;
      }

    }

    // title
    &__title {
      position: relative;
      font-size: 1.5rem;
      text-align: center;
      font-family: "Space Mono";
      color: var(--black-to-white);
    }

    // search and filter dropdown
    &__search-and-filter-dropdown {
        display: flex;
        width: 100%;
        gap: 0.25rem;
        margin-bottom: 0.25rem;
    }

    // search
    &__search {
        display: flex;
        width: 100%;
        font-size: 14px;
        padding: 0rem 0.5rem;
        border-radius: 0.25rem;
        border: 0.5px solid black;
    }

    // filter
    &__filter {
        font-size: 12px;
        padding: 0rem 0.5rem;
        border-radius: 0.25rem;
        border: 0.5px solid black;
        background-color: #fff;
        max-width: 50%;
    }

    //////////
    // body //
    //////////

    // list container
    &__list-container {
      padding-top: 1rem;
    }

    // list
    &__list {
      list-style-type: none;
      padding: 0;
    }

    // list item
    &__list-item {
      text-decoration: none;
    }

    ////////////
    // thread //
    ////////////

    // thread
    &__thread {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;

      // left
      &__left {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
        gap: 0.325rem;
        min-width: 3rem;
        width: 3rem;
      }

      // right
      &__right {
        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: start;
        gap: 0.125rem;
        overflow: hidden;

        // top
        &__top {
          display: flex;
          gap: 0.5rem;
          justify-content: space-between;
          width: 100%;
        }

        // middle
        &__middle {
          display: flex;
          gap: 0.5rem;
        }
        
        // bottom
        &__bottom {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
      }
      
      // icon
      &__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        width: 48px;
        max-width: 48px;
        height: 48px;
        border: none;
        border-radius: 999rem;
        font-size: 1.125rem;
        font-family: "Space Mono";
        color: #000;
        background-color: var(--light-orange);
      }

      // status
      &__status {
        background-color: var(--white);
        border-radius: 0.25rem;
        padding: 0 0.375rem;
        color: var(--brown);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;

        // passed
        &--passed {
          background-color: var(--success-green-hover);
          color: var(--white);
        }

        // failed
        &--failed {
          background-color: var(--red);
          color: var(--white);
        }
        
      }

      // type
      &__type {
        color: var(--brown-to-light-gray);
        font-size: 0.825rem;
        font-family: "Rubik";
        font-weight: 600;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;  
        overflow: hidden;
        text-overflow: ellipsis;
      }

      // date
      &__date {
        color: var(--brown-to-light-gray);
        font-size: 0.875rem;
        font-family: "Rubik";
        font-weight: 400;
      }

      // title
      &__title {
        color: var(--black-to-white);
        font-size: 1rem;
        font-family: "Space Mono";
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;  
        overflow: hidden;
      }

      // author
      &__author {
        color: var(--brown-to-light-gray);
        font-size: 0.825rem;
        font-family: "Rubik";
        font-weight: 600;
        text-wrap: nowrap;
      }

      // principal
      &__principal {
        color: var(--brown);
        background-color: var(--white);
        border-radius: 0.25rem;
        padding: 0 0.5rem;
        font-size: 0.75rem;
        font-family: "Rubik";
        text-wrap: nowrap;
        font-weight: 600;
      }

      /////////////
      // effects //
      /////////////

      // hover
      &:hover {
        cursor: pointer;
        background-color: var(--dark-orange-to-brown);
      }  

      // active
      &--active .forum-threads-list__thread {
        background-color: var(--dark-orange-to-brown);
      }

    }

    // load more button container
    &__load-more-button-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin-bottom: 1.5rem;
    }

}

</style> 

<script setup>

    /////////////
    // Imports //
    /////////////

    import { ref, onMounted, computed, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { storeToRefs } from 'pinia'
    import { useTacoStore } from '../../stores/taco.store'
    import astronautLoader from '../../assets/images/astonautLoader.webp'

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // 

    // # ACTIONS #

    // forum
    const { toggleThreadMenu } = tacoStore // not reactive

    /////////////////////
    // local variables //
    /////////////////////

    // loading curtain
    const componentLoading = ref(false)

    // images
    const astronautLoaderUrl = astronautLoader

    // route
    const route = useRoute()

    // error
    const error = ref('')

    // search query
    const searchQuery = ref('')
    
    // track if we've loaded all proposals for search
    const hasLoadedAllForSearch = ref(false)
    
    // track if there are more proposals to load
    const hasMoreProposals = ref(true)
    
    // selected topic filter
    const selectedTopic = ref('all')    

    ///////////////////
    // local methods //
    ///////////////////

    // load forum data
    const loadProposals = async () => {

      // log
      // console.log('loadProposals')

      // nullify error
      error.value = null
      
      // try
      try {

        // fetch proposals
        await tacoStore.fetchTacoProposals(20) // Fetch 20 proposals at a time

      } catch (err) {

        // set error
        error.value = err.message || 'Failed to load proposals'

      }

    }

    // load more proposals
    const loadMoreProposals = async () => {

      // log
      // console.log('loadMoreProposals')

      // show loading curtain
      componentLoading.value = true

      // set error to null
      error.value = null
      
      // load more proposals
      try {

        // get previous count
        const previousCount = proposals.value.length

        // load more proposals
        await tacoStore.loadMoreTacoProposals(20)

        // get new count
        const newCount = proposals.value.length
        
        // if no new proposals were loaded, we've reached the end
        if (newCount === previousCount) {

          // set has more proposals to false
          hasMoreProposals.value = false

        }

      } catch (err) {

        // set error
        error.value = err.message || 'Failed to load more proposals'

      } finally {

        // hide loading curtain
        componentLoading.value = false

      }

    }

    // load all proposals
    const loadAllProposals = async () => {

      // log
      // console.log('loadAllProposals')

      // show loading curtain
      componentLoading.value = true

      // set error to null
      error.value = null
      
      // load all proposals
      try {

        // load all proposals
        await tacoStore.loadMoreTacoProposals(99999)

        // set has loaded all for search to true
        hasLoadedAllForSearch.value = true

        // set has more proposals to false
        hasMoreProposals.value = false // no more proposals to load after loading all

      } catch (err) {

        // set error
        error.value = err.message || 'Failed to load all proposals'

      } finally {

        // hide loading curtain
        componentLoading.value = false

      }

    }    

    // format date
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    // truncate hex
    const truncateHex = (hex) => {
      if (hex.length <= 10) return hex
      return '...' + hex.substring(hex.length - 5)
    }
    
    //////////////
    // computed //
    //////////////

    // format status
    const formatStatus = (status) => {
      if (status === "Executed") return "PASSED"
      if (status === "Rejected") return "FAILED"
      return status
    }

    // get topic key
    const getTopicKey = (topic) => {
      if (typeof topic === 'object' && topic !== null) {
        return Object.keys(topic)[0] || 'Unknown'
      }
      return topic || 'Unknown'
    }
    
    // filtered proposals
    const filteredProposals = computed(() => {
      let filtered = proposals.value
      
      // apply topic filter
      if (selectedTopic.value !== 'all') {
        filtered = filtered.filter(proposal => {
          const topicKey = getTopicKey(proposal.topic)
          return topicKey === selectedTopic.value
        })
      }
      
      // apply search filter
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        
        filtered = filtered.filter(proposal => {
          // search in title
          if (proposal.title && proposal.title.toLowerCase().includes(query)) {
            return true
          }
          
          // search in topic
          const topicKey = getTopicKey(proposal.topic)
          if (topicKey.toLowerCase().includes(query)) {
            return true
          }
          
          // search in proposer address
          if (proposal.proposer && proposal.proposer.toLowerCase().includes(query)) {
            return true
          }
          
          // search in status
          if (proposal.status && proposal.status.toLowerCase().includes(query)) {
            return true
          }
          
          return false
        })
      }
      
      return filtered
    })

    // active thread id
    const activeThreadId = computed(() => {
      
        // get id from route params
        const id = route.params.id
        
        // return thread id if id exists, otherwise empty string
        return id || ''
        
    })

    // fetched proposals
    const proposals = computed(() => tacoStore.fetchedTacoProposals)
  
    //////////////
    // watchers //
    //////////////
    
    // watch search query to load all proposals when user starts searching
    watch(searchQuery, (newQuery) => {
      if (newQuery.trim() && !hasLoadedAllForSearch.value) {
        loadAllProposals()
      }
    })
    
    // watch topic filter to load all proposals when user selects a topic
    watch(selectedTopic, (newTopic) => {
      if (newTopic !== 'all' && !hasLoadedAllForSearch.value) {
        loadAllProposals()
      }
    })
    
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // on mounted
    onMounted(async () => {

        // log
        // console.log('forum thread list mounted')

        // show loading curtain
        componentLoading.value = true

        // load forum data
        await loadProposals()

        // hide loading curtain
        componentLoading.value = false

    })

</script>