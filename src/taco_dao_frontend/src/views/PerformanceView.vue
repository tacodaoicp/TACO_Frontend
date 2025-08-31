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

              <!-- view item - Portfolio -->
              <div class="performance__views__item"
                   @click="selectedView = 'Portfolio Performance'"
                   :class="{ active: selectedView === 'Portfolio Performance' }">

                <!-- view item text -->
                <span>
                  Portfolio Performance
                </span>

              </div>

              <!-- view item - Assets Performance -->
              <div class="performance__views__item"
                   @click="selectedView = 'Assets Performance'"
                   :class="{ active: selectedView === 'Assets Performance' }">

                <!-- view item text -->
                <span>
                  Assets Performance
                </span>

              </div>

              <!-- dynamic token items -->
              <div
                   v-for="t in availableTokenNavList"
                   :key="t.principal"
                   class="performance__views__item"
                   @click="selectTokenView(t.principal)"
                   :class="{ active: selectedView === 'X Asset Performance' && selectedToken === t.principal }">

                <!-- view item text -->
                <span>{{ t.label }} Performance</span>

              </div>

              <!-- view item - Leaderboard -->
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
                {{ selectedViewLabel }}
              </span>

              <!-- range selector -->
              <div v-if="selectedView !== 'Leaderboard'" class="performance__range-selector btn-group">

                <button @click="selectedChartRange = '24h'" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === '24h'}" 
                        class="btn taco-nav-btn">24h</button>

                <button @click="selectedChartRange = '7d'" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === '7d'}" 
                        class="btn taco-nav-btn">7d</button>

                <button @click="selectedChartRange = '30d'" 
                        type="button" 
                        :class="{'taco-nav-btn--active': selectedChartRange === '30d'}" 
                        class="btn taco-nav-btn">30d</button>

                <button @click="selectedChartRange = 'all'" 
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
                      <th class="">Value</th>

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

                    <!-- portfolio -->
                    <tr>
                      <td class="taco-text-black-to-white">
                        <span class="taco-text-black-to-white">Portfolio</span>
                      </td>
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span class="taco-text-black-to-white">{{ formatUsd(portfolioStats.current) }}</span>
                        </span>
                      </td>
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(portfolioStats.changes['24h'].abs)">{{ formatUsd(portfolioStats.changes['24h'].abs) }}</span>
                          <span :class="getPosNegClass(portfolioStats.changes['24h'].abs)">{{ formatPct(portfolioStats.changes['24h'].pct) }}</span>
                        </span>
                      </td>
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(portfolioStats.changes['7d'].abs)">{{ formatUsd(portfolioStats.changes['7d'].abs) }}</span>
                          <span :class="getPosNegClass(portfolioStats.changes['7d'].abs)">{{ formatPct(portfolioStats.changes['7d'].pct) }}</span>
                        </span>
                      </td>
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(portfolioStats.changes['30d'].abs)">{{ formatUsd(portfolioStats.changes['30d'].abs) }}</span>
                          <span :class="getPosNegClass(portfolioStats.changes['30d'].abs)">{{ formatPct(portfolioStats.changes['30d'].pct) }}</span>
                        </span>
                      </td>
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(portfolioStats.changes['all'].abs)">{{ formatUsd(portfolioStats.changes['all'].abs) }}</span>
                          <span :class="getPosNegClass(portfolioStats.changes['all'].abs)">{{ formatPct(portfolioStats.changes['all'].pct) }}</span>
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
                      <th class="">Value</th>

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
                    <tr v-for="t in tokenStats" :key="t.principal">
                      <!-- tokendata -->
                      <td class="taco-text-black-to-white">
                        <span class="taco-text-black-to-white">{{ t.label }}</span>
                      </td>
                      <!-- value data -->
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span class="taco-text-black-to-white">{{ formatUsd(t.current) }}</span>
                        </span>
                      </td>
                      <!-- 24h data -->
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(t.changes['24h'].abs)">{{ formatUsd(t.changes['24h'].abs) }}</span>
                          <span :class="getPosNegClass(t.changes['24h'].abs)">{{ formatPct(t.changes['24h'].pct) }}</span>
                        </span>
                      </td>
                      <!-- 7d data -->
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(t.changes['7d'].abs)">{{ formatUsd(t.changes['7d'].abs) }}</span>
                          <span :class="getPosNegClass(t.changes['7d'].abs)">{{ formatPct(t.changes['7d'].pct) }}</span>
                        </span>
                      </td>
                      <!-- 30d data -->
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(t.changes['30d'].abs)">{{ formatUsd(t.changes['30d'].abs) }}</span>
                          <span :class="getPosNegClass(t.changes['30d'].abs)">{{ formatPct(t.changes['30d'].pct) }}</span>
                        </span>
                      </td>
                      <!-- all data -->
                      <td class="taco-text-black-to-white">
                        <span class="d-flex flex-column align-items-end">
                          <span :class="getPosNegClass(t.changes['all'].abs)">{{ formatUsd(t.changes['all'].abs) }}</span>
                          <span :class="getPosNegClass(t.changes['all'].abs)">{{ formatPct(t.changes['all'].pct) }}</span>
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
  import { ref, shallowRef, markRaw, onMounted, onUnmounted, computed, onUpdated, watch, provide, nextTick } from "vue"
  import { useStorage } from '@vueuse/core'
  import TacoTitle from '../components/misc/TacoTitle.vue'
  import TacoExchangeLogo from "../assets/images/tacoExchangeLogo.vue"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import { tokenData } from '../components/data/TokenData'
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { LineChart } from 'echarts/charts'
  import { TooltipComponent, GridComponent } from 'echarts/components'
  import VChart, { THEME_KEY } from 'vue-echarts'
  import { Principal } from '@dfinity/principal'
  import { createActor as createPortfolioActor } from '../../../declarations/portfolio_archive'
  import { createActor as createRewardDistributionActor } from '../../../declarations/reward_distribution_archive'
  import { createActor as createDaoAllocationActor } from '../../../declarations/dao_allocation_archive'

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

  // dao
  const { fetchedTokenDetails } = storeToRefs(tacoStore)

  // naming system
  const { namesCache } = storeToRefs(tacoStore)

  // archives
  const { fetchedPortfolioArchiveBlocks } = storeToRefs(tacoStore)
  
  // # ACTIONS #

  // user
  const { iidLogIn } = tacoStore

  // misc
  const { fetchTokenDetails } = tacoStore

  // naming system
  const { loadAllNames } = tacoStore

  // archives
  const { fetchPortfolioArchiveBlocks } = tacoStore

  // metadata
  const { icrc1Metadata } = tacoStore

  /////////////////////
  // Local Varialbes //
  /////////////////////

  // ui references
  const chartLoaded = ref(false)

  // selected view
  const selectedView = ref('')

  // selected chart range
  const selectedChartRange = ref('all')

  // available tokens
  const availableTokens = ref<any[]>([])
  const availableTokenNavList = ref<{ principal: string, label: string }[]>([])
  const selectedToken = useStorage('performanceSelectedToken', '')

  // parsed caches
  const portfolioPointsCache = shallowRef<{ ms: number, usd: number }[]>([])
  const tokenPointsCache = shallowRef<Map<string, { ms: number, usd: number }[]>>(new Map())
  const blocksParsed = ref(false)

  // token label cache and resolvers (reactive so labels update when symbols resolve)
  const tokenSymbolCache = shallowRef<Map<string, string>>(new Map()) 
  
  // series colors by symbol with fallback hashing
  const symbolColorMap = new Map<string, string>()
  const defaultPalette = [
    '#FEC800', '#934A17', '#5E64D7', '#E48142', '#24e8a6',
    '#D93777', '#58BA56', '#9992F4', '#F13036', '#1ED760',
    '#2C6235', '#B3F8FF', '#80AC53', '#BBFD50'
  ]  

  // // treasury portfolio data
  // const treasuryPortfolioData = ref<any[]>([])

  // // dao portfolio data
  // const daoPortfolioData = ref<any[]>([])



  // // 
  // const portfolioActor = ref<any>(null)

  // // 
  // const daoAllocationActor = ref<any>(null)

  // // 
  // const rewardDistributionActor = ref<any>(null)



  ///////////////////
  // Local Methods //
  ///////////////////

  // safely get a nested candid map entry by key
  const getFromMapByKey = (mapContainer: any, key: string) => {
    const pairs = mapContainer?.Map
    if (!Array.isArray(pairs)) return undefined
    const match = pairs.find((pair: any) => Array.isArray(pair) && pair[0] === key)
    return match ? match[1] : undefined
  }

  // extract total_value_usd values from portfolio archive blocks
  const extractTotalUsdSeries = (blocksContainer: any) => {
    const blocks = blocksContainer?.blocks || []
    const series: number[] = []
    for (const item of blocks) {
      const tx = getFromMapByKey(item?.block, 'tx')
      const data = getFromMapByKey(tx, 'data')
      const totalUsdObj = getFromMapByKey(data, 'total_value_usd')
      const valStr = totalUsdObj?.Text
      if (typeof valStr === 'string') {
        const num = parseFloat(valStr)
        if (!Number.isNaN(num)) series.push(num)
      }
    }
    return series
  }

  // format ms timestamp to a concise label
  const formatMsToLabel = (ms: number) => {
    const d = new Date(ms)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  // bucket sizing based on selected range
  const getBucketMsForRange = (range?: string) => {
    if (range === '7d') return 60 * 60 * 1000 // hourly buckets
    if (range === '30d' || range === 'all') return 24 * 60 * 60 * 1000 // daily buckets
    return 0 // 24h uses all points
  }

  // reduce points by bucket (take the last point in each bucket)
  const bucketizePoints = (points: { ms: number, usd: number }[], bucketMs: number) => {
    if (!bucketMs || bucketMs <= 0) return points
    const byBucket = new Map<number, { ms: number, usd: number }>()
    for (const p of points) {
      const bucketStart = Math.floor(p.ms / bucketMs) * bucketMs
      const existing = byBucket.get(bucketStart)
      if (!existing || p.ms > existing.ms) byBucket.set(bucketStart, p)
    }
    return Array.from(byBucket.values()).sort((a, b) => a.ms - b.ms)
  }

  // build x axis labels and usd values sorted by timestamp, with optional range filter
  const extractPortfolioUsdTimeSeries = (blocksContainer: any, range?: string) => {
    if (!blocksParsed.value) buildParsedCaches(blocksContainer)
    const points = portfolioPointsCache.value.slice()

    // filter by selected range relative to last timestamp
    let filtered = points
    if (range && range !== 'all' && points.length > 0) {
      const endMs = points[points.length - 1].ms
      const windowMs = range === '24h' ? 24 * 60 * 60 * 1000
                      : range === '7d' ? 7 * 24 * 60 * 60 * 1000
                      : range === '30d' ? 30 * 24 * 60 * 60 * 1000
                      : Number.MAX_SAFE_INTEGER
      const cutoff = endMs - windowMs
      filtered = points.filter(p => p.ms >= cutoff)
    }

    const bucketMs = getBucketMsForRange(range)
    const reduced = bucketizePoints(filtered, bucketMs)
    return {
      labels: reduced.map(p => formatMsToLabel(p.ms)),
      values: reduced.map(p => p.usd)
    }
  }

  // // token label cache and resolvers
  // const tokenSymbolCache = new Map<string, string>()

  const blobToBytes = (blobObj: any): number[] => {
    const obj = blobObj?.Blob
    if (!obj || typeof obj !== 'object') return []
    return Object.keys(obj)
      .map(k => Number(k))
      .sort((a, b) => a - b)
      .map(k => obj[String(k)])
      .filter((v: any) => typeof v === 'number')
  }

  const blobToPrincipalText = (blobObj: any): string | null => {
    try {
      const bytes = blobToBytes(blobObj)
      if (!bytes.length) return null
      const p = Principal.fromUint8Array(Uint8Array.from(bytes))
      return p.toText()
    } catch {
      return null
    }
  }

  const getTokenLabel = (principalText: string) => {
    const sym = tokenSymbolCache.value.get(principalText)
    if (sym && typeof sym === 'string' && sym.length > 0) return sym.toUpperCase()
    if (principalText && principalText.length > 12) return `${principalText.slice(0, 6)}...${principalText.slice(-5)}`
    return principalText || 'unknown'
  }

  const buildParsedCaches = (blocksContainer: any) => {
    portfolioPointsCache.value = []
    tokenPointsCache.value = new Map()
    const blocks = blocksContainer?.blocks || []
    for (const item of blocks) {
      const tx = getFromMapByKey(item?.block, 'tx')
      const data = getFromMapByKey(tx, 'data')
      const tsObj = getFromMapByKey(data, 'ts') || getFromMapByKey(tx, 'timestamp')
      let ns: any = tsObj?.Int
      if (typeof ns === 'string' && ns.endsWith('n')) ns = BigInt(ns.slice(0, -1))
      if (typeof ns !== 'bigint') continue
      const ms = Number(ns / 1000000n)
      if (Number.isNaN(ms)) continue

      const totalUsdStr = getFromMapByKey(data, 'total_value_usd')?.Text
      if (typeof totalUsdStr === 'string') {
        const usd = parseFloat(totalUsdStr)
        if (!Number.isNaN(usd)) portfolioPointsCache.value.push({ ms, usd })
      }

      const tokensArr = getFromMapByKey(data, 'tokens')?.Array
      if (Array.isArray(tokensArr)) {
        for (const t of tokensArr) {
          const tokenBlob = getFromMapByKey(t, 'token')
          const principal = blobToPrincipalText(tokenBlob) || blobToHex(tokenBlob)
          const valStr = getFromMapByKey(t, 'value_in_usd')?.Text
          if (typeof valStr !== 'string') continue
          const usd = parseFloat(valStr)
          if (Number.isNaN(usd)) continue
          if (!tokenPointsCache.value.has(principal)) tokenPointsCache.value.set(principal, [])
          tokenPointsCache.value.get(principal)!.push({ ms, usd })
        }
      }
    }
    portfolioPointsCache.value.sort((a, b) => a.ms - b.ms)
    for (const [, pts] of tokenPointsCache.value) pts.sort((a, b) => a.ms - b.ms)
    blocksParsed.value = true
  }

  // prune large reactive blocks payload after caches are built
  const pruneFetchedBlocks = () => {
    try {
      const original: any = fetchedPortfolioArchiveBlocks.value
      const logLen = original && typeof original.log_length === 'bigint' ? original.log_length : BigInt(0)
      // keep only minimal metadata; drop heavy arrays from reactivity
      // @ts-ignore
      fetchedPortfolioArchiveBlocks.value = { log_length: logLen }
    } catch (e) {
      // noop
    }
  }

  const collectTokenPrincipals = (blocksContainer: any): string[] => {
    const blocks = blocksContainer?.blocks || []
    const set = new Set<string>()
    for (const item of blocks) {
      const tx = getFromMapByKey(item?.block, 'tx')
      const data = getFromMapByKey(tx, 'data')
      const tokensArr = getFromMapByKey(data, 'tokens')?.Array
      if (!Array.isArray(tokensArr)) continue
      for (const t of tokensArr) {
        const principalText = blobToPrincipalText(getFromMapByKey(t, 'token'))
        if (principalText) set.add(principalText)
      }
    }
    return Array.from(set.values())
  }

  const resolveSymbolsForBlocks = async (blocksContainer: any) => {
    const principals = collectTokenPrincipals(blocksContainer)
    const unresolved = principals.filter(p => !tokenSymbolCache.value.has(p))
    if (unresolved.length === 0) return
    // fetch in parallel with soft cap
    const chunks: string[][] = []
    const size = 10
    for (let i = 0; i < unresolved.length; i += size) chunks.push(unresolved.slice(i, i + size))
    for (const chunk of chunks) {
      await Promise.all(chunk.map(async p => {
        try {
          const md = await icrc1Metadata(p)
          let sym: string | undefined
          if (Array.isArray(md)) {
            const entry = md.find((m: any) => Array.isArray(m) && (m[0] === 'icrc1:symbol' || m[0] === 'symbol' || (typeof m[0] === 'string' && m[0].endsWith(':symbol'))))
            const val = entry?.[1]?.Text
            if (typeof val === 'string') sym = val
          }
          if (sym) {
            const next = new Map(tokenSymbolCache.value)
            next.set(p, sym)
            tokenSymbolCache.value = next
          }
        } catch (e) {
          // leave unresolved, will fall back to principal truncation
        }
      }))
    }
  }

  const buildTokenNavFromBlocks = async (blocksContainer: any) => {
    await resolveSymbolsForBlocks(blocksContainer)
    const principals = collectTokenPrincipals(blocksContainer)
    availableTokenNavList.value = principals
      .map(p => ({ principal: p, label: getTokenLabel(p) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  // // series colors by symbol with fallback hashing
  // const symbolColorMap = new Map<string, string>()
  // const defaultPalette = [
  //   '#FEC800', '#934A17', '#5E64D7', '#E48142', '#24e8a6',
  //   '#D93777', '#58BA56', '#9992F4', '#F13036', '#1ED760',
  //   '#2C6235', '#B3F8FF', '#80AC53', '#BBFD50'
  // ]

  const buildSymbolColorMap = () => {
    try {
      if (Array.isArray(tokenData)) {
        for (const t of tokenData) {
          const sym = typeof t?.symbol === 'string' ? t.symbol.toLowerCase() : null
          const color = typeof t?.color === 'string' ? t.color : null
          if (sym && color) symbolColorMap.set(sym, color)
        }
      }
    } catch {}
  }
  buildSymbolColorMap()

  const hashStringToIndex = (s: string, mod: number) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h % mod
  }

  const getSeriesColorForPrincipal = (principalOrId: string) => {
    const sym = tokenSymbolCache.value.get(principalOrId)
    if (sym) {
      const col = symbolColorMap.get(sym.toLowerCase())
      if (col) return col
    }
    return defaultPalette[hashStringToIndex(principalOrId, defaultPalette.length)]
  }

  // blob to hex string for token id labeling
  const blobToHex = (blobObj: any) => {
    const obj = blobObj?.Blob
    if (!obj || typeof obj !== 'object') return 'unknown'
    const bytes = Object.keys(obj)
      .map(k => Number(k))
      .sort((a, b) => a - b)
      .map(k => obj[String(k)])
      .filter((v: any) => typeof v === 'number')
    return bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('') || 'unknown'
  }

  // extract per-token usd time series, range-aware, aligned on a unified x axis
  const extractAssetsUsdTimeSeries = (blocksContainer: any, range?: string) => {
    if (!blocksParsed.value) buildParsedCaches(blocksContainer)

    // sort and determine global end timestamp
    let globalEnd = 0
    for (const [, pts] of tokenPointsCache.value) {
      pts.sort((a, b) => a.ms - b.ms)
      if (pts.length > 0) globalEnd = Math.max(globalEnd, pts[pts.length - 1].ms)
    }

    // range filter
    let cutoff = -Infinity
    if (range && range !== 'all' && globalEnd > 0) {
      const windowMs = range === '24h' ? 24 * 60 * 60 * 1000
                      : range === '7d' ? 7 * 24 * 60 * 60 * 1000
                      : range === '30d' ? 30 * 24 * 60 * 60 * 1000
                      : Number.MAX_SAFE_INTEGER
      cutoff = globalEnd - windowMs
    }

    const bucketMs = getBucketMsForRange(range)

    // unified timeline
    const allMsSet = new Set<number>()
    const tokenToMap = new Map<string, Map<number, number>>()
    for (const [tokenId, pts] of tokenPointsCache.value) {
      const filteredPts = cutoff === -Infinity ? pts : pts.filter(p => p.ms >= cutoff)
      const reduced = bucketizePoints(filteredPts, bucketMs)
      const map = new Map<number, number>()
      for (const p of reduced) {
        map.set(p.ms, p.usd)
        allMsSet.add(p.ms)
      }
      tokenToMap.set(tokenId, map)
    }

    const msList = Array.from(allMsSet.values()).sort((a, b) => a - b)
    const labels = msList.map(ms => formatMsToLabel(ms))

    const series = Array.from(tokenToMap.entries()).map(([tokenId, map]) => ({
      name: getTokenLabel(tokenId),
      data: msList.map(ms => map.get(ms) ?? null),
      lineStyle: { color: getSeriesColorForPrincipal(tokenId) },
      itemStyle: { color: getSeriesColorForPrincipal(tokenId) }
    }))

    return { labels, series }
  }

  const extractSingleTokenUsdTimeSeries = (blocksContainer: any, tokenPrincipal: string, range?: string) => {
    if (!blocksParsed.value) buildParsedCaches(blocksContainer)
    const points = (tokenPointsCache.value.get(tokenPrincipal) || []).slice()
    let filtered = points
    if (range && range !== 'all' && points.length > 0) {
      const endMs = points[points.length - 1].ms
      const windowMs = range === '24h' ? 24 * 60 * 60 * 1000
                      : range === '7d' ? 7 * 24 * 60 * 60 * 1000
                      : range === '30d' ? 30 * 24 * 60 * 60 * 1000
                      : Number.MAX_SAFE_INTEGER
      const cutoff = endMs - windowMs
      filtered = points.filter(p => p.ms >= cutoff)
    }
    const bucketMs = getBucketMsForRange(range)
    const reduced = bucketizePoints(filtered, bucketMs)
    return {
      labels: reduced.map(p => formatMsToLabel(p.ms)),
      values: reduced.map(p => p.usd)
    }
  }

  const selectTokenView = (principal: string) => {
    selectedToken.value = principal
    selectedView.value = 'X Asset Performance'
  }

  //////////////
  // HANDLERS //

  // 

  /////////////
  // RETURNS //

  // get pos neg class
  const getPosNegClass = (value: number) => {
    if (value === 0) return "taco-text-dark-gray-to-gray"
    return value > 0 ? "taco-text-light-green-to-success-green-hover" : "taco-text-red-to-light-red"
  }

  // formatters
  const formatUsd = (n: number) => {
    if (!Number.isFinite(n)) return '$0.00'
    try {
      return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } catch {
      return `$${n.toFixed(2)}`
    }
  }

  const formatPct = (n: number) => {
    if (!Number.isFinite(n)) return '0.00%'
    try {
      return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    } catch {
      return `${n.toFixed(2)}%`
    }
  }

  //////////////
  // Computed //
  //////////////

  const portfolioStats = computed(() => {
    const points = portfolioPointsCache.value || []
    if (!points.length) {
      return {
        current: 0,
        changes: {
          '24h': { abs: 0, pct: 0 },
          '7d': { abs: 0, pct: 0 },
          '30d': { abs: 0, pct: 0 },
          'all': { abs: 0, pct: 0 }
        }
      }
    }
    const latest = points[points.length - 1]
    const endMs = latest.ms
    const windows: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    const findBaseline = (cutoff: number) => {
      for (let i = 0; i < points.length; i++) {
        if (points[i].ms >= cutoff) return points[i].usd
      }
      return points[0].usd
    }

    const compute = (windowMs: number | 'all') => {
      const startVal = windowMs === 'all' ? points[0].usd : findBaseline(endMs - (windowMs as number))
      const endVal = latest.usd
      const abs = endVal - startVal
      const pct = startVal !== 0 ? (abs / startVal) * 100 : 0
      return { abs, pct }
    }

    return {
      current: latest.usd,
      changes: {
        '24h': compute(windows['24h']),
        '7d': compute(windows['7d']),
        '30d': compute(windows['30d']),
        'all': compute('all')
      }
    }
  })

  const tokenStats = computed(() => {
    const out: { principal: string, label: string, current: number, changes: Record<string, { abs: number, pct: number }> }[] = []
    const map = tokenPointsCache.value || new Map()
    for (const [principal, points] of map) {
      if (!points || points.length === 0) continue
      const latest = points[points.length - 1]
      const endMs = latest.ms
      const windows: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }

      const findBaseline = (cutoff: number) => {
        for (let i = 0; i < points.length; i++) {
          if (points[i].ms >= cutoff) return points[i].usd
        }
        return points[0].usd
      }

      const compute = (windowMs: number | 'all') => {
        const startVal = windowMs === 'all' ? points[0].usd : findBaseline(endMs - (windowMs as number))
        const endVal = latest.usd
        const abs = endVal - startVal
        const pct = startVal !== 0 ? (abs / startVal) * 100 : 0
        return { abs, pct }
      }

      out.push({
        principal,
        label: getTokenLabel(principal),
        current: latest.usd,
        changes: {
          '24h': compute(windows['24h']),
          '7d': compute(windows['7d']),
          '30d': compute(windows['30d']),
          'all': compute('all')
        }
      })
    }
    return out.sort((a, b) => a.label.localeCompare(b.label))
  })

  const selectedViewLabel = computed(() => {
    if (selectedView.value === 'X Asset Performance' && selectedToken.value) {
      return `${getTokenLabel(selectedToken.value)} Performance`
    }
    return selectedView.value
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
      animation: false,
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

    // Portfolio Performance
    if (newVal === 'Portfolio Performance') {

      // log
      console.log('Portfolio Performance')

      // log fetched portfolio archive blocks
      console.log('fetched portfolio archive blocks', fetchedPortfolioArchiveBlocks.value)

      // extract and log total_value_usd series
      const totalUsdSeries = extractTotalUsdSeries(fetchedPortfolioArchiveBlocks.value)
      console.log('total_value_usd series', totalUsdSeries)

      // map to chart with timestamps on x-axis and selected range
      const { labels, values } = extractPortfolioUsdTimeSeries(fetchedPortfolioArchiveBlocks.value, selectedChartRange.value)
      console.log('portfolio performance chart points', { labelsCount: labels.length, valuesCount: values.length })
      updateChartData({ xAxisData: labels, series: [{ name: 'total usd', data: values, lineStyle: { color: '#DA8D28' }, itemStyle: { color: '#DA8D28' } }] })

    }

    // Assets Performance
    else if (newVal === 'Assets Performance') {

      // log
      console.log('Assets Performance')
      // symbols already cached during nav build; no need to refetch here
      const { labels, series } = extractAssetsUsdTimeSeries(fetchedPortfolioArchiveBlocks.value, selectedChartRange.value)
      updateChartData({ xAxisData: labels, series })

    }

    // Leaderboard
    else if (newVal === 'Leaderboard') {

      // log
      console.log('Leaderboard')

      // code

      
    }

    else {

      // log
      console.log('Asset X Performance')
      await resolveSymbolsForBlocks(fetchedPortfolioArchiveBlocks.value)
      if (selectedToken.value) {
        const { labels, values } = extractSingleTokenUsdTimeSeries(
          fetchedPortfolioArchiveBlocks.value,
          selectedToken.value,
          selectedChartRange.value
        )
        updateChartData({ xAxisData: labels, series: [{ name: getTokenLabel(selectedToken.value), data: values, lineStyle: { color: getSeriesColorForPrincipal(selectedToken.value) }, itemStyle: { color: getSeriesColorForPrincipal(selectedToken.value) } }] })
      } else {
        const { labels, series } = extractAssetsUsdTimeSeries(fetchedPortfolioArchiveBlocks.value, selectedChartRange.value)
        updateChartData({ xAxisData: labels, series })
      }
      
    }

    // Asset X Performance

  })

  // watch for chart range changes to update the current chart
  watch(selectedChartRange, async (newRange) => {
    if (!selectedView.value) return
    if (selectedView.value === 'Portfolio Performance') {
      const { labels, values } = extractPortfolioUsdTimeSeries(fetchedPortfolioArchiveBlocks.value, newRange)
      updateChartData({ xAxisData: labels, series: [{ name: 'total usd', data: values, lineStyle: { color: '#DA8D28' }, itemStyle: { color: '#DA8D28' } }] })
    } else if (selectedView.value === 'Assets Performance') {
      const { labels, series } = extractAssetsUsdTimeSeries(fetchedPortfolioArchiveBlocks.value, newRange)
      updateChartData({ xAxisData: labels, series })
    } else if (selectedView.value === 'X Asset Performance' && selectedToken.value) {
      const { labels, values } = extractSingleTokenUsdTimeSeries(
        fetchedPortfolioArchiveBlocks.value,
        selectedToken.value,
        newRange
      )
      updateChartData({ xAxisData: labels, series: [{ name: getTokenLabel(selectedToken.value), data: values, lineStyle: { color: getSeriesColorForPrincipal(selectedToken.value) }, itemStyle: { color: getSeriesColorForPrincipal(selectedToken.value) } }] })
    }
    // future: add handling for other views when they are wired to data
  })  

  // watch for selected token changes when viewing a single asset
  watch(selectedToken, async (newPrincipal) => {
    if (selectedView.value !== 'X Asset Performance') return
    if (!newPrincipal) return
    const { labels, values } = extractSingleTokenUsdTimeSeries(
      fetchedPortfolioArchiveBlocks.value,
      newPrincipal,
      selectedChartRange.value
    )
    updateChartData({ xAxisData: labels, series: [{ name: getTokenLabel(newPrincipal), data: values, lineStyle: { color: getSeriesColorForPrincipal(newPrincipal) }, itemStyle: { color: getSeriesColorForPrincipal(newPrincipal) } }] })
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

    // log
    console.log('PerformanceView mounted')

    // if we already have blocks in store, reuse them; else fetch once
    const hasBlocks = Array.isArray((fetchedPortfolioArchiveBlocks.value as any)?.blocks) && (fetchedPortfolioArchiveBlocks.value as any).blocks.length > 0
    if (!hasBlocks) {
      await fetchPortfolioArchiveBlocks(3000)
    }

    // set selected view
    selectedView.value = 'Portfolio Performance'

    // build caches and token nav if not already built
    if (!blocksParsed.value) {
      buildParsedCaches(fetchedPortfolioArchiveBlocks.value)
      await buildTokenNavFromBlocks(fetchedPortfolioArchiveBlocks.value)
    }

  })

  onUnmounted(() => {
    try {
      option.value = {
        ...(darkModeToggled.value ? lightTheme : darkTheme),
        xAxis: { ...(darkModeToggled.value ? lightTheme : darkTheme).xAxis, data: [] },
        series: []
      }
      portfolioPointsCache.value = markRaw([])
      tokenPointsCache.value = markRaw(new Map())
      availableTokenNavList.value = []
      selectedToken.value = ''
    } catch {}
  })

</script>