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
                  Total Assets Under Management
                </span>

              </div>

              <!-- view item -->
              <div class="performance__views__item"
                   @click="selectedView = 'Treasury vs Portfolio'"
                   :class="{ active: selectedView === 'Treasury vs Portfolio' }">

                <!-- view item text -->
                <span>
                  Treasury vs Portfolio
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

              <!-- logged out, curtain -->
              <div v-if="!userLoggedIn" class="login-curtain">

                <!-- login button -->
                <button class="btn iid-login" @click="iidLogIn()">

                  <!-- dfinity logo -->
                  <DfinityLogo />

                  <!-- login text -->
                  <span class="taco-text-white">Login to view</span>

                </button>

              </div>

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

<!-- total aum row -->
<tr>
  <td class="taco-text-black-to-white">
    <span class="taco-text-black-to-white">Total AUM</span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span class="taco-text-black-to-white">
        ${{ statisticsData.totalAUM.current.toFixed(2) }}
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.totalAUM.change24h.value)">
        ${{ statisticsData.totalAUM.change24h.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.totalAUM.change24h.percentage)">
        {{ statisticsData.totalAUM.change24h.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.totalAUM.change7d.value)">
        ${{ statisticsData.totalAUM.change7d.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.totalAUM.change7d.percentage)">
        {{ statisticsData.totalAUM.change7d.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.totalAUM.change30d.value)">
        ${{ statisticsData.totalAUM.change30d.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.totalAUM.change30d.percentage)">
        {{ statisticsData.totalAUM.change30d.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.totalAUM.changeAll.value)">
        ${{ statisticsData.totalAUM.changeAll.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.totalAUM.changeAll.percentage)">
        {{ statisticsData.totalAUM.changeAll.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
</tr>

<!-- portfolio row -->
<tr>
  <td class="taco-text-black-to-white">
    <span class="taco-text-black-to-white">Portfolio</span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span class="taco-text-black-to-white">
        ${{ statisticsData.portfolio.current.toFixed(2) }}
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.portfolio.change24h.value)">
        ${{ statisticsData.portfolio.change24h.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.portfolio.change24h.percentage)">
        {{ statisticsData.portfolio.change24h.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.portfolio.change7d.value)">
        ${{ statisticsData.portfolio.change7d.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.portfolio.change7d.percentage)">
        {{ statisticsData.portfolio.change7d.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.portfolio.change30d.value)">
        ${{ statisticsData.portfolio.change30d.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.portfolio.change30d.percentage)">
        {{ statisticsData.portfolio.change30d.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.portfolio.changeAll.value)">
        ${{ statisticsData.portfolio.changeAll.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.portfolio.changeAll.percentage)">
        {{ statisticsData.portfolio.changeAll.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
</tr>

<!-- treasury row -->
<tr>
  <td class="taco-text-black-to-white">
    <span class="taco-text-black-to-white">Treasury</span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span class="taco-text-black-to-white">
        ${{ statisticsData.treasury.current.toFixed(2) }}
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.treasury.change24h.value)">
        ${{ statisticsData.treasury.change24h.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.treasury.change24h.percentage)">
        {{ statisticsData.treasury.change24h.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.treasury.change7d.value)">
        ${{ statisticsData.treasury.change7d.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.treasury.change7d.percentage)">
        {{ statisticsData.treasury.change7d.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.treasury.change30d.value)">
        ${{ statisticsData.treasury.change30d.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.treasury.change30d.percentage)">
        {{ statisticsData.treasury.change30d.percentage.toFixed(2) }}%
      </span>
    </span>
  </td>
  <td class="taco-text-black-to-white">
    <span class="d-flex flex-column align-items-end">
      <span :class="getPosNegClass(statisticsData.treasury.changeAll.value)">
        ${{ statisticsData.treasury.changeAll.value.toFixed(2) }}
      </span>
      <span :class="getPosNegClass(statisticsData.treasury.changeAll.percentage)">
        {{ statisticsData.treasury.changeAll.percentage.toFixed(2) }}%
      </span>
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

                      <!-- tokendata -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="taco-text-black-to-white">
                          ⚪️ XXX
                        </span>
                        
                      </td>

                      <!-- price data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>
                          
                        </span>
                        
                      </td>

                      <!-- 24h data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- 7d data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- 30d data -->
                      <td class="taco-text-black-to-white">

                        <!-- entry -->
                        <span class="d-flex flex-column align-items-end">
                          
                          <!-- dollar amount -->
                          <span :class="getPosNegClass(0)">$0.00</span>

                          <!-- percentage -->
                          <span :class="getPosNegClass(0)">0.00%</span>
                          
                        </span>
                        
                      </td>

                      <!-- all data -->
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

    // login curtain
    .login-curtain {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-color: var(--curtain-bg);
      padding: 0 3rem;
      border-radius: 0.5rem;
      z-index: 1000;

      // login
      .iid-login {
        display: inline-flex;
        align-items: center;
        gap: 0.325rem;

        svg {
          width: 1.375rem;
        }

        span {
          font-size: 1rem;
          font-family: 'Space Mono', monospace;
        }

        &:active {
          border-color: transparent;
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
  import { ref, onMounted, onUnmounted, computed, onUpdated, watch, provide, nextTick } from "vue"
  import TacoTitle from '../components/misc/TacoTitle.vue'
  import TacoExchangeLogo from "../assets/images/tacoExchangeLogo.vue"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import { tokenData } from '../components/data/TokenData'
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
  const selectedView = ref('All Taco Dao Assets')

  // selected chart range
  const selectedChartRange = ref('all')

  // available tokens
  const availableTokens = ref<any[]>([])

  // treasury portfolio data
  const treasuryPortfolioData = ref<any[]>([])

  // dao portfolio data
  const daoPortfolioData = ref<any[]>([])

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

  // load price history
  const loadPriceHistory = async () => {

    // try
    try {

      // load both portfolio and treasury data
      const [treasuryResult, daoResult] = await Promise.all([
        tacoStore.getTreasuryPortfolioHistory(1000).catch(e => {
          console.error('Failed to load treasury portfolio:', e)
          return { snapshots: [] }
        }),
        tacoStore.getPortfolioHistory(2000).catch(e => {
          console.error('Failed to load DAO portfolio:', e)
          return []
        })
      ])
      
      // process treasury data
      if (treasuryResult && treasuryResult.snapshots) {
        treasuryPortfolioData.value = treasuryResult.snapshots.map((snapshot: any) => ({
          time: snapshot.timestamp,
          icpPrice: snapshot.totalValueICP,
          usdPrice: snapshot.totalValueUSD,
          tokens: snapshot.tokens
        }))
      } else {
        treasuryPortfolioData.value = []
      }
      
      // process DAO data
      if (Array.isArray(daoResult)) {
        daoPortfolioData.value = daoResult.map(([timestamp, data]: any) => ({
          time: timestamp,
          icpPrice: typeof data.totalWorthInICP === 'bigint' ? data.totalWorthInICP : BigInt(data.totalWorthInICP || 0),
          usdPrice: typeof data.totalWorthInUSD === 'bigint' ? Number(data.totalWorthInUSD) : (data.totalWorthInUSD || 0),
          balances: data.balances || [],
          allocations: data.allocations || []
        })).reverse()
      } else {
        daoPortfolioData.value = []
      }
      
    } catch (error) {
      console.error('Failed to load price history:', error)
    }

  }

  // filter data by time range
  const filterDataByTimeRange = (data: any[], range: string) => {
    if (range === 'all') return data
    
    const now = Date.now()
    const rangeInMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    
    const cutoffTime = now - rangeInMs[range as keyof typeof rangeInMs]
    
    return data.filter(item => {
      const itemTime = Number(item.time) / 1_000_000 // convert from nanoseconds to milliseconds
      return itemTime >= cutoffTime
    })
  }

  // check for data variation
  const hasDataVariation = (seriesData: number[]) => {
    if (seriesData.length <= 1) return false
    const firstValue = seriesData[0]
    return seriesData.some(value => value !== firstValue)
  }  

  // get pos neg class
  const getPosNegClass = (value: number) => {
    if (value === 0) return "taco-text-dark-gray-to-gray"
    return value > 0 ? "taco-text-light-green-to-success-green-hover" : "taco-text-red-to-light-red"
  }

  //////////////
  // Computed //
  //////////////

  const statisticsData = computed(() => {
    if (treasuryPortfolioData.value.length === 0 || daoPortfolioData.value.length === 0) {
      return {
        totalAUM: { current: 999999, change24h: { value: 999999, percentage: 999999 }, change7d: { value: 999999, percentage: 999999 }, change30d: { value: 999999, percentage: 999999 }, changeAll: { value: 999999, percentage: 999999 } },
        portfolio: { current: 999999, change24h: { value: 999999, percentage: 999999 }, change7d: { value: 999999, percentage: 999999 }, change30d: { value: 999999, percentage: 999999 }, changeAll: { value: 999999, percentage: 999999 } },
        treasury: { current: 999999, change24h: { value: 999999, percentage: 999999 }, change7d: { value: 999999, percentage: 999999 }, change30d: { value: 999999, percentage: 999999 }, changeAll: { value: 999999, percentage: 999999 } }
      }
    }

    // get current values (most recent - LAST index)
    const currentTreasury = Number(treasuryPortfolioData.value[treasuryPortfolioData.value.length - 1]?.usdPrice || 0)
    const currentPortfolio = Number(daoPortfolioData.value[daoPortfolioData.value.length - 1]?.usdPrice || 0)
    const currentTotal = currentTreasury + currentPortfolio

    // get values for different time periods
    const getValueAtTime = (data: any[], hoursAgo: number) => {
      const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000)
      const item = data.find(item => {
        const itemTime = Number(item.time) / 1_000_000
        return itemTime >= cutoffTime
      })
      return item ? Number(item.usdPrice) : 0
    }

    // calculate changes for different periods
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return { value: 0, percentage: 0 }
      const change = current - previous
      const percentage = (change / previous) * 100
      return { value: change, percentage }
    }

    // 24h changes
    const treasury24h = getValueAtTime(treasuryPortfolioData.value, 24)
    const portfolio24h = getValueAtTime(daoPortfolioData.value, 24)
    const total24h = treasury24h + portfolio24h

    // 7d changes
    const treasury7d = getValueAtTime(treasuryPortfolioData.value, 24 * 7)
    const portfolio7d = getValueAtTime(daoPortfolioData.value, 24 * 7)
    const total7d = treasury7d + portfolio7d

    // 30d changes
    const treasury30d = getValueAtTime(treasuryPortfolioData.value, 24 * 30)
    const portfolio30d = getValueAtTime(daoPortfolioData.value, 24 * 30)
    const total30d = treasury30d + portfolio30d

    // all time changes (oldest data - FIRST index)
    const oldestTreasury = Number(treasuryPortfolioData.value[0]?.usdPrice || 0)
    const oldestPortfolio = Number(daoPortfolioData.value[0]?.usdPrice || 0)
    const oldestTotal = oldestTreasury + oldestPortfolio

    return {
      totalAUM: {
        current: currentTotal,
        change24h: calculateChange(currentTotal, total24h),
        change7d: calculateChange(currentTotal, total7d),
        change30d: calculateChange(currentTotal, total30d),
        changeAll: calculateChange(currentTotal, oldestTotal)
      },
      portfolio: {
        current: currentPortfolio,
        change24h: calculateChange(currentPortfolio, portfolio24h),
        change7d: calculateChange(currentPortfolio, portfolio7d),
        change30d: calculateChange(currentPortfolio, portfolio30d),
        changeAll: calculateChange(currentPortfolio, oldestPortfolio)
      },
      treasury: {
        current: currentTreasury,
        change24h: calculateChange(currentTreasury, treasury24h),
        change7d: calculateChange(currentTreasury, treasury7d),
        change30d: calculateChange(currentTreasury, treasury30d),
        changeAll: calculateChange(currentTreasury, oldestTreasury)
      }
    }
  })
  
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

  // update chart data
  const updateChartData = (newChartData: { xAxisData: string[], series: any[] }) => {

    // set series data with common settings
    const processedSeries = newChartData.series.map(series => ({
      ...series,
      type: "line",
      smooth: false,
      label: { show: false },
      showSymbol: false,
    }))
    
    // update the chart
    option.value = {
      ...option.value,
      tooltip: {
        ...option.value.tooltip,
        trigger: 'axis', // shows tooltip anywhere on the line
        axisPointer: {
          type: 'line' // shows a vertical line indicator
        },
        valueFormatter: (value: number) => `$${value.toFixed(2)}` // format to 2 decimal places
      },
      xAxis: {
        ...option.value.xAxis,
        data: newChartData.xAxisData
      },
      series: processedSeries
    }

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
      },
      valueFormatter: (value: number) => `$${value}`
    },
    grid: {
      left: '40px',
      right: '10px',
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
        color: "#512100",
        formatter: (value: number) => `$${value}`
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
      },
      valueFormatter: (value: number) => `$${value}`
    },
    grid: {
      left: '40px',
      right: '10px',
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
        color: "#FEEAC1",
        formatter: (value: number) => `$${value}`
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

  // echart option
  const option = ref<any>({
    ...(darkModeToggled.value ? lightTheme : darkTheme),
    xAxis: {
      ...(darkModeToggled.value ? lightTheme : darkTheme).xAxis,
      data: []
    },
    series: []
  })

  // watch for selected view to update
  watch(selectedView, async (newVal) => {

    // log
    console.log('selected view changed')

    // if newVal is All Taco Dao Assets
    if (newVal === 'All Taco Dao Assets') {

      // log
      console.log('All Taco Dao Assets')

      // load price history only if data is not already loaded
      if (treasuryPortfolioData.value.length === 0 || daoPortfolioData.value.length === 0) {
        await loadPriceHistory()
      }

      // filter data by selected time range
      const filteredTreasuryData = filterDataByTimeRange(treasuryPortfolioData.value, selectedChartRange.value)
      const filteredDaoData = filterDataByTimeRange(daoPortfolioData.value, selectedChartRange.value)

      // check if the combined data has variation in the selected timeframe
      const combinedData = filteredTreasuryData.map((item, index) => {
        const treasuryValue = Number(item.usdPrice)
        const daoValue = filteredDaoData[index] ? Number(filteredDaoData[index].usdPrice) : 0
        return treasuryValue + daoValue
      })
      
      const hasVariation = hasDataVariation(combinedData)

      if (!hasVariation) {
        // show "No data variation in selected timeframe" message
        const newChartData = { 
          xAxisData: ['No Data'], 
          series: [{
            name: "No Variation",
            data: [0],
            lineStyle: { color: "#808080" },
            itemStyle: { color: "#808080" }
          }]
        }
        updateChartData(newChartData)
        return
      }

      const newChartData = {
        xAxisData: filteredTreasuryData.map(item => {
          // convert bigint time to readable date
          const timestamp = Number(item.time) / 1_000_000 // convert from nanoseconds to milliseconds
          return new Date(timestamp).toLocaleDateString()
        }),
        series: [
          {
            name: "Total AUM",
            data: filteredTreasuryData.map((item, index) => {
              const treasuryValue = Number(item.usdPrice)
              const daoValue = filteredDaoData[index] ? Number(filteredDaoData[index].usdPrice) : 0
              return treasuryValue + daoValue
            }),
            lineStyle: { color: "#FEA000" },
            itemStyle: { color: "#FEA000" }
          }
        ]
      }

      updateChartData(newChartData)

    }

    // else if newVal is Treasury vs Portfolio
    else if (newVal === 'Treasury vs Portfolio') {

      // log
      console.log('Treasury vs Portfolio')

      // load price history only if data is not already loaded
      if (treasuryPortfolioData.value.length === 0 || daoPortfolioData.value.length === 0) {
        await loadPriceHistory()
      }

      // filter data by selected time range
      const filteredTreasuryData = filterDataByTimeRange(treasuryPortfolioData.value, selectedChartRange.value)
      const filteredDaoData = filterDataByTimeRange(daoPortfolioData.value, selectedChartRange.value)

      // check if either treasury or portfolio has variation in the selected timeframe
      const treasuryData = filteredTreasuryData.map(item => Number(item.usdPrice))
      const portfolioData = filteredDaoData.map(item => Number(item.usdPrice))
      
      const hasTreasuryVariation = hasDataVariation(treasuryData)
      const hasPortfolioVariation = hasDataVariation(portfolioData)

      if (!hasTreasuryVariation && !hasPortfolioVariation) {
        // show "No data variation in selected timeframe" message
        const newChartData = { 
          xAxisData: ['No Data'], 
          series: [{
            name: "No Variation",
            data: [0],
            lineStyle: { color: "#808080" },
            itemStyle: { color: "#808080" }
          }]
        }
        updateChartData(newChartData)
        return
      }

      const newChartData = {
        xAxisData: filteredTreasuryData.map(item => {
          // convert bigint time to readable date
          const timestamp = Number(item.time) / 1_000_000 // convert from nanoseconds to milliseconds
          return new Date(timestamp).toLocaleDateString()
        }),
        series: [
          {
            name: "Treasury",
            data: filteredTreasuryData.map(item => Number(item.usdPrice)),
            lineStyle: { color: "#FEA000" },
            itemStyle: { color: "#FEA000" }
          },
          {
            name: "Portfolio", 
            data: filteredDaoData.map(item => Number(item.usdPrice)),
            lineStyle: { color: "#4CAF50" },
            itemStyle: { color: "#4CAF50" }
          }
        ]
      }

      updateChartData(newChartData) 

    }

    // else if newVal is All Treasury Assets
    else if (newVal === 'All Treasury Assets') {

      // log
      console.log('All Treasury Assets')

      // load price history only if data is not already loaded
      if (treasuryPortfolioData.value.length === 0 || daoPortfolioData.value.length === 0) {
        await loadPriceHistory()
      }      

      // get unique token names from the first snapshot
      const firstSnapshot = treasuryPortfolioData.value[0]
      if (!firstSnapshot || !firstSnapshot.tokens) {
        const newChartData = { xAxisData: [], series: [] }
        updateChartData(newChartData)
        return
      }

      // filter data by selected time range
      const filteredTreasuryData = filterDataByTimeRange(treasuryPortfolioData.value, selectedChartRange.value)

      const tokenNames = firstSnapshot.tokens.map((token: any) => token.symbol || 'Unknown')
      
      // check if any token has variation in the selected timeframe
      const hasAnyVariation = tokenNames.some((tokenName: string, tokenIndex: number) => {
        const tokenData = filteredTreasuryData.map(item => {
          const token = item.tokens[tokenIndex]
          return token ? Number(token.valueInUSD || 0) : 0
        })
        return hasDataVariation(tokenData)
      })

      if (!hasAnyVariation) {
        // show "No data variation in selected timeframe" message
        const newChartData = { 
          xAxisData: ['No Data'], 
          series: [{
            name: "No Variation",
            data: [0],
            lineStyle: { color: "#808080" },
            itemStyle: { color: "#808080" }
          }]
        }
        updateChartData(newChartData)
        return
      }

      const newChartData = {
        xAxisData: filteredTreasuryData.map(item => {
          const timestamp = Number(item.time) / 1_000_000
          return new Date(timestamp).toLocaleDateString()
        }),
        series: tokenNames.map((tokenName: string, tokenIndex: number) => {
          // find token in TokenData to get the color
          const tokenInfo = tokenData.find((t: any) => t.symbol.toLowerCase() === tokenName.toLowerCase())
          const color = tokenInfo?.color || '#808080' // fallback to gray if not found
          
          return {
            name: tokenName,
            data: filteredTreasuryData.map(item => {
              const token = item.tokens[tokenIndex]
              return token ? Number(token.valueInUSD || 0) : 0
            }),
            lineStyle: { color: color },
            itemStyle: { color: color }
          }
        })
      }

      updateChartData(newChartData) 

    }
        
    else if (newVal === 'All Portfolio Assets') {

      // log
      console.log('All Portfolio Assets')

      // load price history only if data is not already loaded
      if (treasuryPortfolioData.value.length === 0 || daoPortfolioData.value.length === 0) {
        await loadPriceHistory()
      }

      // get unique token principals from the first snapshot
      const firstSnapshot = daoPortfolioData.value[0]
      if (!firstSnapshot || !firstSnapshot.balances) {
        const newChartData = { xAxisData: [], series: [] }
        updateChartData(newChartData)
        return
      }

      // filter data by selected time range
      const filteredDaoData = filterDataByTimeRange(daoPortfolioData.value, selectedChartRange.value)

      // map token principals to symbols (you'll need to implement this mapping)
      const tokenPrincipals = firstSnapshot.balances.map((balance: any) => balance[0])
      
      // check if any token has variation in the selected timeframe
      const hasAnyVariation = tokenPrincipals.some((tokenPrincipal: any, tokenIndex: number) => {
        const tokenData = filteredDaoData.map(item => {
          const balance = item.balances[tokenIndex]
          if (balance && balance[1]) {
            // convert from cents to dollars (divide by 100)
            const balanceValue = Number(balance[1]) / 100
            return balanceValue
          }
          return 0
        })
        return hasDataVariation(tokenData)
      })

      if (!hasAnyVariation) {
        // show "No data variation in selected timeframe" message
        const newChartData = { 
          xAxisData: ['No Data'], 
          series: [{
            name: "No Variation",
            data: [0],
            lineStyle: { color: "#808080" },
            itemStyle: { color: "#808080" }
          }]
        }
        updateChartData(newChartData)
        return
      }

      const newChartData = {
        xAxisData: filteredDaoData.map(item => {
          const timestamp = Number(item.time) / 1_000_000
          return new Date(timestamp).toLocaleDateString()
        }),
        series: tokenPrincipals.map((tokenPrincipal: any, tokenIndex: number) => {
          // you'll need to implement a way to get the token symbol from the principal
          // for now, using a placeholder
          const tokenName = `Token ${tokenIndex + 1}`
          
          // find token in TokenData to get the color
          const tokenInfo = tokenData.find((t: any) => t.symbol.toLowerCase() === tokenName.toLowerCase())
          const color = tokenInfo?.color || '#808080' // fallback to gray if not found
          
          return {
            name: tokenName,
            data: filteredDaoData.map(item => {
              const balance = item.balances[tokenIndex]
              if (balance && balance[1]) {
                // convert from cents to dollars (divide by 100)
                const balanceValue = Number(balance[1]) / 100
                return balanceValue
              }
              return 0
            }),
            lineStyle: { color: color },
            itemStyle: { color: color }
          }
        })
      }

      updateChartData(newChartData) 

    }

  }, { immediate: true })

  // watch for chart range changes to update the current chart
  watch(selectedChartRange, async (newRange) => {
    // only update if we have a view selected and data loaded
    if (selectedView.value && (treasuryPortfolioData.value.length > 0 || daoPortfolioData.value.length > 0)) {
      // trigger the view update logic again with the new range
      const currentView = selectedView.value
      selectedView.value = '' // temporarily clear to trigger change
      await nextTick()
      selectedView.value = currentView // set back to trigger the watch
    }
  })  

  // watch for dark mode to update
  watch(darkModeToggled, async (newVal) => {

    // if light mode
    if (newVal) {
      // set theme
      theme.value = 'light'

      // set options
      option.value = {
        ...lightTheme,
        xAxis: {
          ...lightTheme.xAxis,
          data: option.value.xAxis?.data || []
        },
        series: option.value.series || []
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
          data: option.value.xAxis?.data || []
        },
        series: option.value.series || []
      }

    }

    // reload the current chart data to reapply tooltip settings
    if (selectedView.value && selectedView.value !== 'Leaderboard') {
      const currentView = selectedView.value
      selectedView.value = '' // temporarily clear
      await nextTick()
      selectedView.value = currentView // set back to trigger the watch and reload
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

  })

</script>