<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container - app util class -->
    <div class="scroll-y-container h-100 mt-2">

      <!-- container - l1 -->
      <div class="performance
                  taco-container taco-container--l1 shadow"
            style="margin: 0 5rem 0;">

        <!-- left -->
        <div class="performance__left
                    d-flex flex-column align-items-center gap-3">

          <!-- performance logo cont -->
          <div style="width: 220px; height: 69px;">

          <!-- performance logo -->
          <TacoExchangeLogo style="width: 100%; height: 100%;" />

          </div>

          <!-- views -->
          <div class="performance__views
                      taco-container taco-container--l2 shadow p-0">

            <h2 class="performance__views__title">Select a View</h2>

            <!-- views list -->
            <div class="performance__views__list">

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'All Taco Dao Assets'"
                   :class="{ active: selectedView === 'All Taco Dao Assets' }">

                <!-- view item text -->
                <span>
                  All Taco Dao Assets
                </span>

              </div>

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'Treasury vs Portfilio'"
                   :class="{ active: selectedView === 'Treasury vs Portfilio' }">

                <!-- view item text -->
                <span>
                  Treasury vs Portfilio
                </span>

              </div>

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'All Treasury Assets'"
                   :class="{ active: selectedView === 'All Treasury Assets' }">

                <!-- view item text -->
                <span>
                  All Treasury Assets
                </span>

              </div>

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'All Portfolio Assets'"
                   :class="{ active: selectedView === 'All Portfolio Assets' }">

                <!-- view item text -->
                <span>
                  All Portfolio Assets
                </span>

              </div>

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'DAO vs Me'"
                   :class="{ active: selectedView === 'DAO vs Me' }">

                <!-- view item text -->
                <span>
                  DAO vs Me
                </span>

              </div>

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'Leaderboard'"
                   :class="{ active: selectedView === 'Leaderboard' }">

                <!-- view item text -->
                <span>
                  Leaderboard
                </span>

              </div>              

            </div>
            
          </div>

        </div>

        <!-- center and right container -->
        <div class="performance__center-right gap-3">

          <!-- center -->
          <div class="performance__center
                      taco-container taco-container--l2
                      px-2 pb-2 gap-2 shadow">

            <!-- header -->
            <div class="performance__current-chart-info
                        gap-1-4 px-2">

              <span class="text-nowrap">
                {{ selectedView }}
              </span>

              <!-- range selector -->
              <div v-if="selectedView !== 'Leaderboard'" class="performance__range-selector btn-group">

                <button @click="handleSetChartRange('24h')" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === '24h'}" 
                        class="btn taco-nav-btn">24h</button>

                <button @click="handleSetChartRange('7d')" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === '7d'}" 
                        class="btn taco-nav-btn">7d</button>

                <button @click="handleSetChartRange('30d')" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === '30d'}" 
                        class="btn taco-nav-btn">30d</button>

                <button @click="handleSetChartRange('all')" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === 'all'}" 
                        class="btn taco-nav-btn">All</button>                          

              </div>

            </div>

            <!-- chart container -->
            <div ref="chartContainer"
                  class="performance__chart__cont
                        taco-container taco-container--l2 p-0">

              <!-- chart inner container -->
              <div v-if="selectedView !== 'Leaderboard'" class="performance__chart__cont__inner">

                <!-- chart -->
                <v-chart class="echart" :option="option" autoresize />

              </div>

              <!-- leaderboard -->
              <div v-if="selectedView === 'Leaderboard'" class="performance__leaderboard">

                <!-- title -->
                <span class="performance__leaderboard__title">🏆 Leaderboard 🏆</span>

                <!-- entries -->
                <div class="performance__leaderboard__entries">

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>1</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...ukmae</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">100</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>2</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">Custom account Name</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">98</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>3</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...mjkqw</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">95</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>4</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...quyzb</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">92</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>5</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">A really long account name can go here and needs to wrap if it is way way way to long for the screen</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">89</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>6</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...7lkqa</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">85</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>7</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...2l66p</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">82</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>8</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...ht8ie</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">80</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>9</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...kle12</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">79</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>10</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...opp52</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">76</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>11</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...xde2r</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">75</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>12</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...jtad1</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">72</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>13</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...ltadw</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">68</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>14</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...wazf6</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">65</div>

                  </div>

                  <!-- entry -->
                  <div class="performance__leaderboard__entry">

                    <!-- rank and account container -->
                    <div class="performance__leaderboard__entry__rank-account">

                      <!-- rank -->
                      <div class="performance__leaderboard__entry__rank">

                        <!-- rank number -->
                        <span>15</span>

                      </div>

                      <!-- account -->
                      <div class="performance__leaderboard__entry__account">...ppr35</div>

                    </div>

                    <!-- score -->
                    <div class="performance__leaderboard__entry__score">61</div>

                  </div>
                  
                </div>

              </div>

            </div>

          </div>

          <!-- right -->
          <div class="performance__top__right
                      d-flex flex-column align-items-center gap-3">

            <!-- header -->
            <div class="taco-container taco-container--l2
                        w-100 shadow">
            
              <!-- tools title -->
              <TacoTitle level="h2" emoji="📊" title="Statistics"
                          style="margin-bottom: 0 !important; padding: 0 !important;" />
                      
            </div>

            <!-- statistics area -->
            <div class="performance__statistics gap-3">

              <!-- top table container -->
              <div class="performance__statistics__table__cont flex-shrink-0">

                <!-- top table -->
                <table class="performance__statistics__table">

                  <!-- table head -->
                  <thead>

                    <!-- row -->
                    <tr>

                      <!-- heading -->
                      <th class="">Asset</th>

                      <!-- heading -->
                      <th class="">Price</th>

                      <!-- heading -->
                      <th class="">24h</th>

                      <!-- heading -->
                      <th class="">7d</th>
                      
                      <!-- heading -->
                      <th class="">30d</th>
                      
                      <!-- heading -->
                      <th class="">All</th>                    

                    </tr>

                  </thead>

                  <!-- table body -->
                  <tbody>

                    <!-- row -->
                    <tr>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="taco-text-black-to-white">
                          Total AUM
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                    </tr>  
                    
                    <!-- row -->
                    <tr>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="taco-text-black-to-white">
                          Portfolio
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                    </tr>  
                    
                    <!-- row -->
                    <tr>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="taco-text-black-to-white">
                          Treasury
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(-100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(-100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(100)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(100)">0.00%</span>
                          
                        </span>
                        
                      </td>

                    </tr>                      

                  </tbody>

                </table>

              </div>
              
              <!-- bottom table container -->
              <div class="performance__statistics__table__cont overflow-auto">

                <!-- bottom table -->
                <table class="performance__statistics__table">

                  <!-- table head -->
                  <thead>

                    <!-- row -->
                    <tr>

                      <!-- heading -->
                      <th class="">Asset</th>

                      <!-- heading -->
                      <th class="">Price</th>

                      <!-- heading -->
                      <th class="">24h</th>

                      <!-- heading -->
                      <th class="">7d</th>
                      
                      <!-- heading -->
                      <th class="">30d</th>
                      
                      <!-- heading -->
                      <th class="">All</th>                    

                    </tr>

                  </thead>

                  <!-- table body -->
                  <tbody>

                    <!-- row -->
                    <tr>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="taco-text-black-to-white">
                          ⚪️ XXX
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                    </tr>

                  </tbody>

                </table>                

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

  // performance
  .performance {
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    height: 100%;

    // left
    &__left {
      height: auto;
    }

    // center and right container
    &__center-right {
      height: 100%;
      display: flex;
      width: 100%;
    }

    // center
    &__center {
      background-color: var(--dark-orange-to-light-brown);
      min-height: 400px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      width: 100%;
    }

    // right
    &__right {



    }

    // views
    &__views {
      background-color: var(--orange-to-light-brown); 
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      overflow: hidden;
      overflow-y: auto;
      width: 100%;
      gap: 0;

      // title
      &__title {
        color: var(--dark-brown-to-white);
        font-family: "Space Mono";
        white-space: nowrap;
        font-size: 1.5rem;
        text-align: center;
        margin: 0;
        padding: 1rem;
      }

      // list
      &__list {
        width: 100%;
      }

      // item
      &__item {
        display: flex;
        flex-direction: column;
        padding: 1rem;

        span {
          color: var(--dark-brown-to-white);
          font-size: 0.875rem;
        }

        &:hover {
            background-color: var(--light-brown-to-brown);
            cursor: pointer;
            
            span {
              color: var(--white);
            }
        }

        &.active {
          background-color: var(--light-brown-to-brown);

          span {
            color: var(--white);
          }
          
        }

      }

    }

    // current chart info
    &__current-chart-info {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      margin-top: -0.25rem;

      span {
        color: var(--dark-brown-to-white);
        font-size: 1.25rem;
        font-family: 'Space Mono', monospace;
        margin-bottom: 0;
      }

    }

    // chart
    &__chart {
      // width: 600px;
      // height: 600px;
      width: 100%;
      height: 100%;
      min-height: 300px;

      // chart container
      &__cont {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        background-color: var(--light-orange-to-dark-brown);
        border-radius: 0.5rem;
        overflow: auto;

        // inner
        &__inner {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          overflow: clip;
        }

      }

    }

    // echart
    .echart {
      min-height: 350px;
    }

    // range selector
    &__range-selector {
      display: flex;

      // button
      button {
        font-size: 0.825rem;
        padding: 0rem 0.5rem;

        &:first-of-type {
          border-top-left-radius: 0.25rem;
          border-bottom-left-radius: 0.25rem;
        }

        &:last-of-type {
          border-top-right-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
        }
        
      }

    }    

    // statistics
    &__statistics {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: auto;
      width: 100%;

      // table
      &__table {
        width: 100%;
        border-collapse: collapse;

        // table container
        &__cont {
          border: 1px solid var(--dark-orange);
          border-radius: 0.55rem;
          overflow: clip;
          overflow-x: auto;
        }

        // thead
        thead {

          // thead row
          tr {

            // headiing
            th {
              color: var(--white);
              font-weight: bold;
              padding: 0.325rem 0 0.5rem 0.75rem;
              background-color: var(--brown-to-dark-orange);
              position: sticky;
              top: 0;
              z-index: 1;
              text-align: right;

              // first data
              &:first-of-type {
                padding-left: 1rem;
                padding-right: 0;
                text-align: left;
                border-top-left-radius: 0.5rem;
              }

              // last data
              &:last-of-type {
                padding-right: 1rem;
                border-top-right-radius: 0.5rem;
              }

            }

          }

        }

        // tbody
        tbody {

          // tbody row
          tr {

            // data
            td {
              font-size: 0.75rem;
              background-color: var(--light-orange-to-dark-brown);
              border-bottom: 1px solid var(--dark-orange);
              padding: 0.5rem 0 0.5rem 0.75rem;
              text-align: right;

              // 
              span {
                color: var(--black-to-white);
              }

              // first data
              &:first-of-type {
                padding-left: 1rem;
                padding-right: 0;
                text-align: left;
              }

              // last data
              &:last-of-type {
                padding-right: 1rem;
              }

            }

            // hover
            &:hover {

              td {
                background-color: var(--orange-to-brown);
              }

            }

            // last tbody row
            &:last-of-type {

              // data
              td {
                border-bottom: 0;

                // first data
                &:first-of-type {
                  border-bottom-left-radius: 0.5rem;
                }

                // last data
                &:last-of-type {
                  border-bottom-right-radius: 0.5rem;
                }

              }

            }

            // active
            &.active td {
              background-color: var(--yellow-to-black);
            }

          }

        }

      }

    }

    // leaderboard
    &__leaderboard {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 3rem;

      // title
      &__title {
        font-size: 2.25rem;
        color: var(--dark-brown-to-white);
        font-family: "Space Mono";
        margin-bottom: 2rem;
        white-space: nowrap;
      }

      // entries
      &__entries {
        display: flex;
        flex-direction: column;
      }
      
      // entry
      &__entry {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.25rem;
        padding: 0.5rem 1rem;
        max-width: 36rem;
        border-radius: 0.5rem;

        // hover
        &:hover {
          background-color: var(--orange-to-brown);
        }

        // first place
        &:nth-of-type(1) {
          .performance__leaderboard__entry__rank {
            position: relative;
            background-color: var(--yellow);
            span {
              color: var(--black);
            }
            &:before {
              content: "👑";
              position: absolute;
              top: -1.375ch;
              left: 50%;
              transform: translateX(-50%);
              font-size: 2rem;
              font-weight: bold;
            }
          }
          .performance__leaderboard__entry__score {
            background-color: var(--yellow);
            color: var(--black);
          }
        }

        // second place
        &:nth-of-type(2) {
          .performance__leaderboard__entry__rank {
            background-color: var(--dark-orange);
          }
          .performance__leaderboard__entry__score {
            background-color: var(--dark-orange);
          }
        }  
        
        // third place
        &:nth-of-type(3) {
          .performance__leaderboard__entry__rank {
            background-color: var(--dark-orange);
          }
          .performance__leaderboard__entry__score {
            background-color: var(--dark-orange);
          }
        }   
        
        // fourth place
        &:nth-of-type(4) {
          .performance__leaderboard__entry__rank {
            background-color: var(--light-brown);
          }
          .performance__leaderboard__entry__score {
            background-color: var(--light-brown);
          }
        }   
        
        // fifth place
        &:nth-of-type(5) {
          .performance__leaderboard__entry__rank {
            background-color: var(--light-brown);
          }
          .performance__leaderboard__entry__score {
            background-color: var(--light-brown);
          }
        }

        // sixth place
        &:nth-of-type(6) {
          .performance__leaderboard__entry__rank {
            background-color: var(--light-brown);
          }
          .performance__leaderboard__entry__score {
            background-color: var(--light-brown);
          }
        }
        
        // seventh place
        &:nth-of-type(7) {
          .performance__leaderboard__entry__rank {
            background-color: var(--light-brown);
          }
          .performance__leaderboard__entry__score {
            background-color: var(--light-brown);
          }
        }        

        * {
          color: var(--dark-brown-to-white);
        }

        // rank and account container
        &__rank-account {
          display: flex;
          align-items: baseline;
          gap: 1rem;
        }

        // rank
        &__rank {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: transparent;
          border-radius: 999rem;
          width: 2.5rem;
          height: 2.5rem;

          span {
            font-size: 1.25rem;
            font-weight: bold;
          }

        }
        
        // account
        &__account {
          
        }

        // score
        &__score {
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: bold;
          color: var(--dark-brown-to-white);
        }

      }

    }
    
  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    .performance {
      margin: 0 0.5rem 0 !important;
      flex-direction: column;
      height: auto;
    }
    .performance__center-right {
      height: auto;
      flex-direction: column;
    }
    .performance__chart {
      min-height: 450px;
    }
    .performance__tools {
      min-width: unset;
      width: 100%;
      max-width: unset;
    }
  }
  
  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
    .performance {
      margin: 0 0.5rem 0 !important;
      flex-direction: column;
      height: auto;
    }
    .performance__center-right {
      height: auto;
      flex-direction: column;
    }
    .performance__chart {
      min-height: 450px;
    }
  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
    .performance {
      margin: 0 2.5rem 0 !important;
      height: auto;
    }   
    .performance__center-right {
      flex-direction: column;
      height: auto;
    }
  }

  // small daktop
  @media (min-width: 992px) and (max-width: 1199.98px) {
    .performance {
      margin: 0 2.5rem 0 !important;
      height: auto;
    }  
    .performance__center-right {
      flex-direction: column;
      height: auto;
    }
  }

  // custom
  @media (max-width: 1399.98px) {
    .performance__leaderboard {
      padding: 2rem 1rem;
    }
    .performance__leaderboard__title {
      font-size: 1.75rem;
    }
  }

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import HeaderBar from "../components/HeaderBar.vue"
  import FooterBar from "../components/FooterBar.vue"
  import { ref, onMounted, onUnmounted, computed, onUpdated, watch, provide } from "vue"
  import TacoTitle from '../components/misc/TacoTitle.vue'
  import TacoExchangeLogo from "../assets/images/tacoExchangeLogo.vue"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { LineChart } from 'echarts/charts'
  import {
    TooltipComponent,
    GridComponent,
  } from 'echarts/components'
  import VChart, { THEME_KEY } from 'vue-echarts'

  ///////////
  // Store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // app
  const { darkModeToggled } = storeToRefs(tacoStore)

  // user
  const { userLoggedIn } = storeToRefs(tacoStore)

  // dap
  const { fetchedTokenDetails } = storeToRefs(tacoStore)
  
  // # ACTIONS #

  // user
  const { iidLogIn } = tacoStore

  // misc
  const { fetchTokenDetails } = tacoStore

  /////////////////////
  // Local Varialbes //
  /////////////////////

  // ui references
  const chartLoaded = ref(false)

  // selected view
  const selectedView = ref('allTacoDaoAssets')

  // selected chart range
  const selectedChartRange = ref('5m')

  // available tokens
  const availableTokens = ref<any[]>([])

  ///////////////////
  // Local Methods //
  ///////////////////

  //////////////
  // HANDLERS //

  // handle select chart range
  const handleSetChartRange = (range: string) => {
    selectedChartRange.value = range
  }

  /////////////
  // RETURNS //

  // load available tokens
  const loadAvailableTokens = async () => {

    // try
    try {

      // if fetched token details is empty
      if (fetchedTokenDetails.value.length === 0) {

        // fetch token details
        await fetchTokenDetails()

      }

      // set token details
      const tokenDetails = fetchedTokenDetails || []

      // filter token details
      availableTokens.value = tokenDetails.value.filter(([_, details]: any) => 
        details.Active && !details.isPaused
      )
      
    } 
    
    // catch
    catch (error) {

      // log error
      console.error('Failed to load available tokens:', error)

    }
    
  }

  // get pos neg class
  const getPosNegClass = (value: number) => {
    if (value === 0) return "taco-text-dark-gray-to-gray"
    return value > 0 ? "taco-text-light-green-to-success-green-hover" : "taco-text-red-to-light-red"
  }

  //////////////
  // Computed //
  //////////////

  //   

  //////////////
  // Watchers //
  //////////////

  // watch for selected view to update
  watch(selectedView, (newVal) => {

    // log
    console.log('selected view changed', newVal)

    // if new value is all taco dao assets
    if (newVal === 'All Taco Dao Assets') {

      // fetch price history for portfolio and treasury
      
      
    }

  }, { immediate: true })
  
  /////////////
  // eCharts //
  /////////////

  // use echarts
  use([
    CanvasRenderer,
    LineChart,
    TooltipComponent,
    GridComponent
  ])

  // chart data - separate from themes
  const chartData = {
    xAxisData: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    series: [
      {
        name: "ABC",
        type: "line",
        data: [120, 200, 150, 80, 70, 110, 130, 180, 220, 190, 250, 300],
        smooth: false,
        label: {
          show: false
        },
        endLabel: {
          show: true,
          color: '#EB0000',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{a}'
        },
        lineStyle: {
          color: "#EB0000"
        },
        itemStyle: {
          color: "#EB0000"
        }
      },
      {
        name: "DEF",
        type: "line",
        data: [100, 150, 120, 90, 85, 95, 110, 140, 160, 145, 180, 200],
        smooth: false,
        label: {
          show: false
        },
        endLabel: {
          show: true,
          color: '#4CAF50',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{a}'
        },
        lineStyle: {
          color: "#4CAF50"
        },
        itemStyle: {
          color: "#4CAF50"
        }
      },
      {
        name: "GHI",
        type: "line",
        data: [110, 130, 100, 85, 80, 90, 105, 125, 140, 130, 160, 175],
        smooth: false,
        label: {
          show: false
        },
        endLabel: {
          show: true,
          color: '#9C27B0',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{a}'
        },
        lineStyle: {
          color: "#9C27B0"
        },
        itemStyle: {
          color: "#9C27B0"
        }
      }
    ]
  }

  // provide theme
  const theme = ref<'light' | 'dark'>(darkModeToggled.value ? 'light' : 'dark')
  provide(THEME_KEY, theme)

  // custom light theme
  const lightTheme = {
    backgroundColor: "transparent",
    textStyle: {
      color: "#333333"
    },
    tooltip: {
      backgroundColor: "#ffffff",
      borderColor: "#e0e0e0",
      textStyle: {
        color: "#333333"
      }
    },
    grid: {
      left: '40px',
      right: '25px',
      top: '25px',
      bottom: '30px'
    },
    xAxis: {
      type: "category",
      axisLine: {
        lineStyle: {
          color: "#FEC800"
        }
      },
      axisLabel: {
        color: "#512100"
      }
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "#FEC800"
        }
      },
      axisLabel: {
        color: "#512100"
      },
      splitLine: {
        lineStyle: {
          color: "#FEC800"
        }
      }
    },
    series: [
      {
        // series styling moved to chartData
      }
    ]
  }

  // custom dark theme
  const darkTheme = {
    backgroundColor: "transparent",
    textStyle: {
      color: "#ffffff"
    },
    tooltip: {
      backgroundColor: "#2d3748",
      borderColor: "#4a5568",
      textStyle: {
        color: "#ffffff"
      }
    },
    grid: {
      left: '40px',
      right: '25px',
      top: '25px',
      bottom: '30px'
    },
    xAxis: {
      type: "category",
      axisLine: {
        lineStyle: {
          color: "#934A17"
        }
      },
      axisLabel: {
        color: "#FEEAC1"
      }
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "#934A17"
        }
      },
      axisLabel: {
        color: "#FEEAC1"
      },
      splitLine: {
        lineStyle: {
          color: "#934A17"
        }
      }
    },
    series: [
      {
        // series styling moved to chartData
      }
    ]
  }

  // echart option - initialize based on current dark mode state
  const option = ref({
    ...(darkModeToggled.value ? lightTheme : darkTheme),
    xAxis: {
      ...(darkModeToggled.value ? lightTheme : darkTheme).xAxis,
      data: chartData.xAxisData
    },
    series: chartData.series
  })

  // watch for dark mode to update
  watch(darkModeToggled, (newVal) => {

    // if light mode
    if (newVal) {

      // set theme
      theme.value = 'light'

      // set options
      option.value = {
        ...lightTheme,
        xAxis: {
          ...lightTheme.xAxis,
          data: chartData.xAxisData
        },
        series: chartData.series
      }

    } 
    
    // else dark mode
    else {

      // set theme
      theme.value = 'dark'

      // set options
      option.value = {
        ...darkTheme,
        xAxis: {
          ...darkTheme.xAxis,
          data: chartData.xAxisData
        },
        series: chartData.series
      }

    }

  }, { immediate: true })    

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {

    // set selected view
    selectedView.value = 'All Taco Dao Assets'  

    // load available tokens
    await loadAvailableTokens()

    // log
    console.log('available tokens', availableTokens.value)

    // 
    const treasuryPortfolioHistory = await tacoStore.getTreasuryPortfolioHistory(1000).catch(e => {
        console.error('Failed to load treasury portfolio:', e)
        return { snapshots: [] }
      })

    // log
    console.log('treasury portfolio history', treasuryPortfolioHistory)

  })

  // on unmounted
  onUnmounted(() => {

    // 

  })

  // on updated
  onUpdated(() => {

    // 

  })

</script>