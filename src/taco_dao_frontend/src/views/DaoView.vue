<template>

  <div class="standard-view">

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- dao quadrants -->
          <div class="dao__quad__top-bottom
                      d-flex flex-column w-100 align-items-center">

            <!-- top -->
            <div class="dao__quad__left-right 
                        d-flex w-100">

              <!-- left -->
              <div class="dao__quad__cont">

                <!-- allocations title -->
                <TacoTitle level="h2" emoji="📊" title="Allocations" class="mt-4" />                

                <!-- dao tile - taco container -->
                <div class="dao__tile
                            taco-container
                            taco-container--l1
                            d-flex flex-column gap-3 w-100 p-0">

                  <!-- DaoAllocations.vue component here -->
                  <DaoAllocations />

                </div>

              </div>

              <!-- right -->
              <div class="dao__quad__cont">

                <!-- trusted tokens title -->
                <TacoTitle level="h2" emoji="🪙" title="Trusted Tokens" class="mt-4" />

                 <!-- dao tile - taco container -->
                <div class="dao__tile
                            taco-container
                            taco-container--l1
                            d-flex flex-column gap-3 w-100 p-0">

                  <!-- DaoTrustedTokens.vue component here -->
                  <DaoTrustedTokens />

                </div>

              </div>

            </div>

            <!-- bottom -->
            <div class="dao__quad__left-right
                        d-flex w-100">

              <!-- left -->
              <div class="dao__quad__cont">

                <!-- news title -->
                <TacoTitle level="h2" emoji="📰" title="News" class="mt-4" />

                 <!-- dao tile - taco container -->
                <div class="dao__tile
                            taco-container
                            taco-container--l1
                            d-flex flex-column gap-3 w-100 p-0">

                  <!-- DaoNews.vue component here -->
                  <DaoNews />

                </div>

              </div>

              <!-- right -->
              <div class="dao__quad__cont">

                <!-- trusted tokens title -->
                <TacoTitle level="h2" emoji="🗳️" title="Voting" class="mt-4" />

                 <!-- dao tile - taco container -->
                <div class="dao__tile
                            taco-container
                            taco-container--l1
                            d-flex flex-column gap-3 w-100 p-0">

                  <!-- DaoVotePower.vue component here -->
                  <DaoVotePower />

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

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  // dao
  .dao {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    // layout
    &__quad {
      gap: 1rem;

      // 
      &__top-bottom {
        gap: 1rem;
      }

      // 
      &__left-right {
        gap: 1rem;
      }

      // 
      &__cont {
        // display: flex;
        // flex-direction: column;
        width: 50%;
      }

    }

    // tile
    &__tile {
      max-height: 600px;
      
      // tile component
      > div {
        overflow: hidden;
      }

    } 

  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    .dao__quad__top-bottom {
      gap: 0.25rem;
    }
    .dao__quad__left-right {
      gap: 0.25rem;
      flex-direction: column;
    }
    .dao__tile {
      width: 100%;
    }
    .dao__quad__cont {
      width: 100%;
    }    
  }

  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
    .dao__quad__top-bottom {
      gap: 0.25rem;
    }
    .dao__quad__left-right {
      gap: 0.25rem;
      flex-direction: column;
    }
    .dao__tile {
      width: 100%;
    }
    .dao__quad__cont {
      width: 100%;
    }
    .dao__tile {
      max-height: 650px;
    }
  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
    .dao__quad__top-bottom {
      gap: 0.25rem;
    }
    .dao__quad__left-right {
      gap: 0.25rem;
      flex-direction: column;
    }
    .dao__tile {
      width: 100%;
    }
    .dao__quad__cont {
      width: 100%;
    }.dao__tile {
      max-height: 720px;
    }
  }

  // small daktop
  @media (min-width: 992px) and (max-width: 1199.98px) {
      
  }

  // medium desktop
  @media (min-width: 1200px) and (max-width: 1399.98px) {
    
  }  

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import FooterBar from "../components/FooterBar.vue";
  import TacoTitle from '../components/misc/TacoTitle.vue'
  import DaoAllocations from "../components/dao/DaoAllocations.vue";
  import DaoTrustedTokens from "../components/dao/DaoTrustedTokens.vue";
  import DaoVotePower from "../components/dao/DaoVotePower.vue";
  import DaoNews from "../components/dao/DaoNews.vue";

</script>