<template>

  <div class="dao-vote-power">

    <!-- dao vote power loading curtain -->
    <div v-if="componentLoading" class="dao-vote-power__loading-curtain">

        <!-- astronaut -->
        <img :src="astronautLoaderUrl" class="loading-img">

    </div>      

    <!-- you have x VP -->
    <div class="dao-vote-power__vp">
      <span class="dao-vote-power__vp__title">Your Voting Power</span>
      <span v-if="userLoggedIn" class="dao-vote-power__vp__count">{{ votePower }}</span>
      <span v-if="!userLoggedIn" class="dao-vote-power__vp__count">0</span>
    </div>

    <!-- go to voting -->
    <div class="dao-vote-power__go-to-voting">
      
      <!-- router link to voting -->
      <router-link to="/vote" 
        class="dao-vote-power__go-to-voting__link
          btn btn-lg taco-nav-btn taco-nav-btn--active mb-0">Go to voting</router-link>

    </div>

    <div class="d-flex justify-content-center">

      <!-- refresh voting power button -->
      <button class="btn btn-link mb-2"
              @click="refreshVotingPower"
              :class="{'disabled': refreshingVP}"
              style="color: var(--black-to-white);">

        <!-- refresh icon -->
        <span v-if="!refreshingVP && userLoggedIn" style="color: var(--black-to-white);">Refresh</span>
        <span v-if="refreshingVP" style="color: var(--black-to-white);">Refreshing</span>

      </button>    

    </div>
    
    <!-- last voted -->
    <div v-if="userLoggedIn" class="dao-vote-power__last-voted">
      <span v-if="formattedUserAllocation?.lastAllocationUpdate" class="dao-vote-power__last-voted__title small">Last Voted </span>
      <span v-if="formattedUserAllocation?.lastAllocationUpdate" class="dao-vote-power__last-voted__date small">{{ formatDate(formattedUserAllocation?.lastAllocationUpdate) }}</span>
      <span v-if="!formattedUserAllocation?.lastAllocationUpdate" class="dao-vote-power__last-voted__date small">Never Voted</span>
    </div>

    <!-- last voted -->
    <div v-if="!userLoggedIn" class="dao-vote-power__last-voted">
      <span class="dao-vote-power__last-voted__title small">Login to view voting power</span>
    </div>

  </div>
  
</template>
  
<style scoped lang="scss">

/////////////////////
// component style //
/////////////////////

// dao trusted tokens
.dao-vote-power {
  position: relative;

  // vp
  &__vp {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;

    // title
    &__title {
      color: var(--white);
      display: block;
      font-size: 1.125rem;
      font-weight: 600;
      background-color: var(--dark-orange-to-light-brown);
      width: 100%;
      text-align: center;
      margin: 1.25rem 0 0 0;
      padding: 1rem 0;
      border-radius: 0.5rem;
      border: 1px solid var(--dark-orange);
    }

    // count
    &__count {
      color: var(--white);
      display: block;
      font-size: 3rem;
      font-weight: 600;
      background-color: var(--dark-orange-to-light-brown);
      margin: 0.5rem 0 1.5rem 0;
      padding: 2rem 4rem;
      border-radius: 0.5rem;
      border: 1px solid var(--dark-orange);
    }
    
  }

  // go to voting
  &__go-to-voting {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    // link
    &__link {
      color: var(--white-to-black) !important;
      margin-bottom: 0.5rem;
      background-color: var(--light-brown-to-yellow);
    }
  }

  // last voted
  &__last-voted {
    display: inline-block;
    width: 100%;
    text-align: center;
    opacity: 0.75;
    margin-bottom: 1.5rem;

    // title
    &__title {
      color: var(--black-to-white);
    }

    // date
    &__date {
      color: var(--black-to-white);
    }

  }

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
      border-radius: 0.5rem;
      z-index: 99999; // above everything

      .loading-img {
          width: 10rem;
      }
  }  

}

///////////////
// overrides //
///////////////

// 


///////////////////
// media queries //
///////////////////

// custom
@media (max-width: 375px) {
  .dao-vote-power__vp__count {
    font-size: 1.5rem !important;
  }
}

// phone protrait
@media (max-width: 575.98px) {
  .dao-vote-power__vp__count {
    font-size: 2rem;
  }
}

// // phone landscape
// @media (min-width: 576px) and (max-width: 767.98px) {
    
// }

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

  import { ref, onMounted, computed, watch } from "vue"
  import { useTacoStore } from "../../stores/taco.store"
  import { storeToRefs } from "pinia"
  import astronautLoader from '../../assets/images/astonautLoader.webp'

  ///////////
  // Store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // app

  // user
  const { userLoggedIn } = storeToRefs(tacoStore)  

  // otc backend
  const { fetchedUserAllocation } = storeToRefs(tacoStore)

  // # ACTIONS #

  // otc backend
  const { fetchUserAllocation } = tacoStore

  /////////////////////
  // local variables //
  /////////////////////

  // component
  const componentLoading = ref(false)  

  // images
  const astronautLoaderUrl =  astronautLoader

  // element references
  const formattedUserAllocation = ref()

  // user
  const refreshingVP = ref(false)

  ///////////////////
  // local methods //
  ///////////////////

  //////////////
  // handlers //

  // handle fetched user allocation
  const handleFetchedUserAllocation = async (userAllocation: any) => {

    // log
    // console.log('VoteView.vue: fetchedUserAllocation:', userAllocation)

    // set formatted user allocation
    formattedUserAllocation.value = userAllocation[0]

    // log
    // console.log('DaoVotePower.vue: formattedUserAllocation:', formattedUserAllocation.value)

  }

  // refresh voting power
  const refreshVotingPower = async () => {
    refreshingVP.value = true
    try {
      const { refreshUserVotingPower } = tacoStore
      await refreshUserVotingPower()
      // After refreshing, fetch updated user allocation
      await fetchUserAllocation()
      handleFetchedUserAllocation(fetchedUserAllocation.value)
    } catch (error) {
      console.error('Error refreshing voting power:', error)
    } finally {
      refreshingVP.value = false
    }
  }  

  /////////////
  // returns //

  // vote power
  const votePower = computed(() => {

    // if no value, return 0
    if (!formattedUserAllocation.value) return 0

    // return formatted voting power
    return (Number(formattedUserAllocation.value.votingPower) / Math.pow(10, 8)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  })

  // return formatted date
  const formatDate = (epochTimestamp: bigint) => {

    // if no value, return empty string
    if (!epochTimestamp) return ''

    // options
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: '2-digit', 
      year: 'numeric' 
    }
    // convert epoch timestamp (in nanoseconds) to milliseconds
    const date = new Date(Number(epochTimestamp / BigInt(1_000_000)))
    return date.toLocaleDateString('en-US', options)
  }  

  //////////////
  // computed //
  //////////////

  // 

  //////////////
  // watchers //
  //////////////

  // watch user logged in, run immediately
  watch(userLoggedIn, async () => {

    // log
    // console.log('DaoVotePower.vue: userLoggedIn changed')

    try {

      // if user is logged in, fetch user state
      if (userLoggedIn.value) {

        // turn on loading curtain
        componentLoading.value = true    

        // // fetch and handle user allocation
        // await fetchUserAllocation()
        // handleFetchedUserAllocation(fetchedUserAllocation.value)

        // refresh voting power
        await refreshVotingPower()

      } else {

        // log
        // console.log('DaoVotePower.vue: user is not logged in')

        // return
        return

      }

    } catch (error) {

      // log
      console.error('DaoVotePower.vue: error fetching user allocation', error)

    } finally {

      // turn off loading curtain
      componentLoading.value = false

    }    

  }, { immediate: true })

  /////////////
  // mounted //
  /////////////

  // on mounted
  onMounted(async () => {

    // log
    // console.log('DaoVotePower.vue: onMounted')

    // turn component loading on
    componentLoading.value = true

    // refresh voting power
    await refreshVotingPower()

    // turn component loading off
    componentLoading.value = false

  })
  
</script>