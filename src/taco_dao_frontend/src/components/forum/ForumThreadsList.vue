<template>

    <div class="forum-threads-list">

        <!-- loading curtain -->
        <div v-if="appLoading" class="forum-threads-list__loading-curtain">
            <div class="forum-threads-list__loading-curtain__spinner"></div>
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
                placeholder="Search"
                class="forum-threads-list__search taco-input">

                <!-- filter -->
                <select class="forum-threads-list__filter taco-input">
                    <option value="all">Type</option>
                    <option value="active">addToken</option>
                    <option value="inactive">another type with a long name that might mess with the spaceing and layout</option>
                </select>

            </div>

          </div>
            
        </div>

        <!-- threads list container -->
        <div class="forum-threads-list__list-container">

            <!-- threads list -->
            <ul class="forum-threads-list__list">

                <!-- thread item -->
                <li v-for="thread in fetchedProposalsThreads"
                    :key="thread.id.toString()"
                    @click="goToThread(thread.id)"
                    :class="['forum-threads-list__list-item', { 'forum-threads-list__thread--active': activeThreadId === thread.id.toString() }]">

                    <!-- thread -->
                    <div class="forum-threads-list__thread">

                        <!-- left -->
                        <div class="forum-threads-list__thread__left">

                            <!-- thread icon -->              
                            <div class="forum-threads-list__thread__icon shadow">#{{ thread.id.toString() }}</div>

                            <!-- thread status -->
                            <span class="forum-threads-list__thread__status">OPEN</span>
                            <!-- <span class="forum-threads-list__thread__status">PASSED</span>
                            <span class="forum-threads-list__thread__status">FAILED</span> -->

                        </div>

                        <!-- right -->
                        <div class="forum-threads-list__thread__right">

                            <!-- top -->
                            <div class="forum-threads-list__thread__right__top">

                                <!-- type -->
                                <span class="forum-threads-list__thread__type">addToken</span>

                                <!-- date -->
                                <span class="forum-threads-list__thread__date">{{ formatDate(thread.created_at) }}</span>

                            </div>

                            <!-- middle -->
                            <div class="forum-threads-list__thread__right__middle">

                                <!-- title -->
                                <span class="forum-threads-list__thread__title">{{ truncateText(thread.body, 200) }}</span>

                            </div>

                            <!-- bottom -->
                            <div class="forum-threads-list__thread__right__bottom">
                                
                                <!-- author -->
                                <span class="forum-threads-list__thread__author">{{ getPrincipalDisplayName(thread.created_by) }}</span>

                                <!-- author principal -->
                                <!-- <span class="forum-threads-list__thread__principal">…kdnr4w</span> -->

                            </div>

                        </div>

                    </div>

                </li>
                
            </ul>

            <!-- load more button container -->
            <div class="forum-threads-list__load-more-button-container">

                <!-- load more button -->
                <button class="forum-threads-list__load-more-button btn taco-btn taco-btn--green taco-btn--big">Load More</button>

            </div>

        </div>

    </div>

</template>

<style lang="scss" scoped>

.forum-threads-list {
    overflow: auto;

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
      // placeholder
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
      }

      // type
      &__type {
        color: var(--brown-to-light-gray);
        font-size: 0.825rem;
        font-family: "Rubik";
        font-weight: 600;
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
      &--active {
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

    import { ref, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { storeToRefs } from 'pinia'
    import { useTacoStore } from '../../stores/taco.store'

    ///////////
    // store //
    ///////////

    // # SETUP #
    const tacoStore = useTacoStore()

    // # STATE #

    // 
    const { appLoading, fetchedProposalsThreads} = storeToRefs(tacoStore)

    // # ACTIONS #

    // 
    const { getProposalsThreads, getPrincipalDisplayName } = tacoStore

    /////////////////////
    // local variables //
    /////////////////////

    // router
    const router = useRouter()

    // error
    const error = ref('')

    // active thread id
    const activeThreadId = ref('')

    ///////////////////
    // local methods //
    ///////////////////

    // load forum data
    const loadForumData = async () => {
        try {
            error.value = ''
            await getProposalsThreads()
        } catch (err) {
            console.error('Error loading forum data:', err)
            error.value = 'Failed to load forum data. Please try again.'
        }
    }

    // go to thread
    const goToThread = (threadId) => {
        activeThreadId.value = threadId.toString()
        router.push(`/chat/forum/${threadId.toString()}`)
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

    // truncate text
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }
    
    //////////////
    // computed //
    //////////////

    // 
  
    /////////////////////
    // lifecycle hooks //
    /////////////////////  

    // on mounted
    onMounted(async () => {

        // log
        console.log('forum thread list mounted')

        // load forum data
        loadForumData()

    })

</script>