<template>

  <div class="dao-news">

      <!-- dao news loading curtain -->
      <div v-if="componentLoading" class="dao-news__loading-curtain">

          <!-- astronaut -->
          <img :src="astronautLoaderUrl" class="loading-img">

      </div>    

      <!-- toolbar container - l2 -->
      <div class="taco-container taco-container--l2 taco-container--l2--dark p-2">

        <!-- toolbar -->
        <div class="taco-toolbar">

            <!-- buttons -->
            <div class="btn-group">

                <!-- news -->
                <button @click="selectedNav = 'news'" 
                        class="btn taco-nav-btn"
                        :class="{'taco-nav-btn--active': selectedNav === 'news'}">News</button>

                <!-- trade logs -->
                <button @click="selectedNav = 'trade-log'" 
                        class="btn taco-nav-btn"
                        :class="{'taco-nav-btn--active': selectedNav === 'trade-log'}">Trade Log</button>

                <!-- changelog -->
                <button @click="selectedNav = 'change-log'" 
                        class="btn taco-nav-btn"
                        :class="{'taco-nav-btn--active': selectedNav === 'change-log'}">Change Log</button>                        

            </div>

        </div>

      </div>

      <!-- taco container - l2 -->
      <div class="dao-news__content">

        <!-- news -->
        <div v-show="selectedNav === 'news'"
            class="dao-news__content__news">

          <!-- news content -->
          <NewsContent />

        </div>

        <!-- trade log -->
        <div v-show="selectedNav === 'trade-log'"
            class="dao-news__content__trade-log">

          <!-- trade log content -->
          <DaoTradingLogs />

        </div>

        <!-- change log -->
        <div v-show="selectedNav === 'change-log'"
            class="dao-news__content__change-log">

          <!-- change log content -->
          <ChangelogContent />

        </div>        

      </div>

  </div>
  
</template>
  
<style scoped lang="scss">

/////////////////////
// component style //
/////////////////////

// dao news
.dao-news {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1rem;
  // min-height: 560px;
  height: 100%;
  padding: 1.25rem;
  position: relative;

  // content
  &__content {
    display: flex;
    flex-direction: column;
    overflow: auto;
    border: 1px solid var(--dark-orange-to-light-brown);
    border-radius: 0.5rem;

    // trade log
    &__trade-log {
      display: flex;
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

</style>
  
<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import { ref, watch } from "vue"
  import astronautLoader from '../../assets/images/astonautLoader.webp'
  import NewsContent from '../misc/NewsContent.vue'
  import DaoTradingLogs from '../dao/DaoTradingLogs.vue'
  import ChangelogContent from '../misc/ChangelogContent.vue'

  /////////////////////
  // local variables //
  /////////////////////

  // component
  const componentLoading = ref(false)  

  // images
  const astronautLoaderUrl =  astronautLoader

  // references
  const selectedNav = ref('news')
  // const hasShownOpenChat = ref(false)
  // const hasShownTwitter = ref(false)
  const hasShownTradeLog = ref(false)

  //////////////
  // watchers //
  //////////////

  watch(() => selectedNav.value, (newNav) => {
    // if (newNav === 'open-chat') hasShownOpenChat.value = true
    // if (newNav === 'twitter') hasShownTwitter.value = true
    if (newNav === 'trade-log') hasShownTradeLog.value = true
  })

</script>