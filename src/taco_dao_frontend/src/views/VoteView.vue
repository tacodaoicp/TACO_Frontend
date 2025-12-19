<template>

  <div class="standard-view">

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- vote page -->
          <div class="vote-view">

            <!-- title container -->
            <div class="d-flex align-items-center">

              <!-- vote title -->
              <h1 class="taco-title
                         mb-4 mt-4 px-3">
                <span class="taco-title__icon">🗳️</span>
                <span class="taco-title__title">Allocation Voting</span>
              </h1>

            </div>

            <!-- top bar -->
            <div class="vote-view__top-bar gap-2 mb-3 shadow">

              <!-- left-->
              <div class="d-flex align-items-center">

                <!-- if logged out, log in title -->
                <h2 v-if="!userLoggedIn" class="vote-view__top-bar__title py-2">
                  Log in to Vote
                </h2>                

                <!-- if logged in, allocation voting title -->
                <h2 v-if="userLoggedIn" class="vote-view__top-bar__title py-2">

                  <span class="whitespace-nowrap">Welcome, &hellip;{{ truncatedPrincipal }}&nbsp;</span>

                  <span v-if="votePower !== '0'" class="vote-view__top-bar__vote-power text-nowrap">({{ votePower }} VP)</span>

                  <span v-if="votePower === '0'" class="vote-view__top-bar__vote-power text-nowrap">(0 VP)</span>
                  
                  <!-- refresh voting power button -->
                  <button 
                    class="btn btn-sm ms-2 px-2 py-1"
                    style="background-color: var(--yellow); color: var(--black); border-color: var(--yellow);"
                    @click="refreshVotingPower"
                    :class="{'disabled': refreshingVP}">

                    <!-- refresh icon -->
                    <span v-if="!refreshingVP">Refresh</span>
                    <span v-if="refreshingVP">Refreshing</span>

                  </button>

                </h2>               

              </div>

              <!-- right -->
              <div class="d-flex gap-2 flex-wrap ms-auto">

                <!-- if logged out, login button -->
                <button v-if="!userLoggedIn" class="btn iid-login m-1 me-2" @click="iidLogIn">
                  
                  <!-- dfinity logo -->
                  <DfinityLogo />
                  
                  <!-- login text -->
                   <span class="taco-text-white">Login</span>

                </button>

                <!-- if logged in, todays date -->
                <span v-if="userLoggedIn" class="taco-text-white py-2 pe-3">
                  {{ formatFullDate(BigInt(Date.now() * 1_000_000)) }}
                </span>

                <!-- if logged in, how to hotkey button -->
                <button v-if="userLoggedIn" 
                  class="btn taco-nav-btn taco-nav-btn--active" 
                  @click="reshowHotkeyTutorial">
                  <span class="taco-text-black">How to Hotkey</span>
                </button>

              </div>

            </div>

            <!-- content -->
            <div class="vote-view__content gap-4">

              <!-- left -->
              <div class="vote-view__content__left gap-4 position-relative" style="height: fit-content;">

                <!-- top - allocations -->
                <div>

                  <!-- l1 -->
                  <div class="taco-container taco-container--l1 shadow">

                    <!-- allocations -->
                    <div class="vote-allocations">

                      <!-- top - container - l2 -->
                      <div class="taco-container taco-container--l2 taco-container--l2--dark p-2">

                        <!-- toolbar -->
                        <div class="taco-toolbar">

                          <h3 class="taco-text-white mb-0 py-1 px-2" style="font-size: 1.125rem;">Current
                            Allocations</h3>

                        </div>

                      </div>

                      <!-- middle - container - l2 -->
                      <div ref="tacoChartContainer" 
                        class="vote-allocations__taco-chart-container
                              taco-container taco-container--l2
                              p-2"
                      >

                        <!-- no tokens curtain -->
                        <div v-if="allocationCount === 0" class="vote-allocations__no-tokens-curtain">

                          <p class="taco-text-white text-center mb-0"><i class="fa-solid fa-triangle-exclamation taco-text-orange"></i> No Allocations Yet</p>                          
                          
                        </div>
                        

                        <!-- chart -->
                        <apexchart type="pie" :options="chartOptions" :series="series"
                          class="vote-allocations__taco-chart" @dataPointSelection="handleChartSegmentClick">
                        </apexchart>

                      </div>

                      <!-- bottom - container - l2 -->
                      <div class="taco-container taco-container--l2 p-0 overflow-hidden d-flex">

                        <!-- flex container -->
                        <div class="d-flex w-100">

                          <!-- no tokens curtain -->
                          <div v-if="allocationCount === 0" class="vote-allocations__no-tokens-curtain">

                            <p class="taco-text-white text-center mb-0"><i class="fa-solid fa-triangle-exclamation taco-text-orange"></i> No Tokens Allocated</p>
                            
                          </div>

                          <!-- left -->
                          <div class="d-flex flex-column w-100">

                            <!-- left top -->
                            <div class="vote-allocations__token-title
                                                d-flex gap-3 align-items-center p-2">

                              <!-- token icon -->
                              <img :src="currentTokenIcon" class="dao-allocations__token-title__icon
                                                  rounded-circle shadow" alt="" style="width: 52px; height: 52px;" />

                              <!-- flex container -->
                              <div class="d-flex flex-column">

                                <!-- token name/link -->
                                <a :href="currentTokenLink" class="vote-allocations__token-title__name-link"
                                  target="_blank">
                                  {{ currentTokenTitle }}
                                </a>

                                <!-- bottom -->
                                <span class="taco-text-black-to-white small" style="text-transform: uppercase;">
                                  ({{currentTokenSymbol}})
                                </span>

                              </div>

                            </div>

                            <!-- left bottom -->
                            <div class="vote-allocations__token-description
                                                d-flex flex-column p-2 ps-4 gap-1 overflow-auto h-100">

                              <!-- description title -->
                              <span class="vote-allocations__token-description__title
                                                    taco-text-black-to-white">Description:</span>

                              <!-- description -->
                              <span class="vote-allocations__token-description__text
                                                    taco-text-black-to-white pb-3">
                                {{ currentTokenDescription }}
                              </span>

                            </div>

                          </div>

                          <!-- right -->
                          <div class="d-none">

                            <!-- list of key/value pairs -->
                            <ul class="vote-allocations__token-info-list">

                              <!-- symbol - list item -->
                              <li>

                                <!-- key -->
                                <span class="vote-allocations__token-info-list__key
                                                        taco-text-white">Symbol:</span>

                                <!-- value -->
                                <span class="vote-allocations__token-info-list__value
                                                        taco-text-white">SYM</span>

                              </li>

                              <!-- holdings - list item -->
                              <li>

                                <!-- key -->
                                <span class="vote-allocations__token-info-list__key
                                                        taco-text-white">Current Holdings:</span>

                                <!-- value -->
                                <span class="vote-allocations__token-info-list__value
                                                        taco-text-white d-flex align-items-center gap-1">

                                  <!-- token icon -->
                                  <img src="@/assets/tokens/dkp.png"
                                    class="vote-allocations__token-info-list__token-icon" alt="" />

                                  <!-- holding amount -->
                                  <span class="small">0</span>

                                </span>

                              </li>

                              <!-- list item -->
                              <li>

                                <!-- key -->
                                <span class="vote-allocations__token-info-list__key
                                                        taco-text-white">Current Percentage:</span>

                                <!-- value -->
                                <span class="vote-allocations__token-info-list__value
                                                        taco-text-white">0%</span>

                              </li>

                              <!-- list item -->
                              <li>

                                <!-- key -->
                                <span class="vote-allocations__token-info-list__key
                                                        taco-text-white">Trusted:</span>

                                <!-- value -->
                                <span class="vote-allocations__token-info-list__value
                                                        taco-text-white">

                                  <!-- force small -->
                                  <span class="small">???</span>

                                </span>

                              </li>

                            </ul>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                <!-- bottom - following -->
                <div v-if="followingEnabled">

                  <!-- l1 -->
                  <div class="taco-container taco-container--l1 
                              position-relative shadow">
                    
                    <!-- following -->
                    <div class="vote-following">

                      <!-- following - container - l2 -->
                      <div class="vote-following__input-container
                                  taco-container taco-container--l2
                                  p-2">

                        <!-- follow title -->
                        <h3 class="taco-text-black-to-white p-2 pb-0" style="font-size: 1.125rem;">Follow
                          <span class="taco-text-black-to-white"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Your allocations will automatically update when the principal you follow votes. Both follower and followee must make at least 1 allocation vote.">
                            <!-- icon -->
                            <i class="fa-solid fa-xs fa-circle-info" 
                              style="opacity: 0.5;"
                            ></i>
                          </span>
                        </h3>

                        <!-- follow input -->
                        <div class="input-group mb-3">

                          <!-- input -->
                          <input type="text" 
                            class="form-control" 
                            placeholder="Enter principal to follow" 
                            v-model="followPrincipalInput"
                            aria-label="Enter principal to follow" 
                            aria-describedby="follow-button"
                          />

                          <!-- button -->
                          <button class="btn taco-btn taco-btn--green"
                            id="follow-button"
                            :disabled="!validatePrincipal(followPrincipalInput) || maxFollowsReached || followPrincipalInput === userPrincipal"
                            @click="handleAddFollow(followPrincipalInput)">
                            <span v-if="!maxFollowsReached && followPrincipalInput !== userPrincipal || !userLoggedIn">Follow</span>
                            <span v-if="maxFollowsReached">Max Followed</span>
                            <span v-if="followPrincipalInput === userPrincipal && userLoggedIn">No Self Following 😛</span>
                          </button>

                        </div>

                        <!-- following title -->
                        <h3 class="taco-text-black-to-white p-2 pb-0" style="font-size: 1.125rem;">
                          Following ({{ followingCount }})
                          <span class="taco-text-black-to-white"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="You can follow up to 5 principals at once. Your allocations will be updated automatically by the last followed principal to vote.">
                            <!-- icon -->
                            <i class="fa-solid fa-xs fa-circle-info" 
                              style="opacity: 0.5;"
                            ></i>
                          </span>
                        </h3>

                        <!-- following table if following -->
                        <table v-if="userLoggedIn && formattedUserAllocation?.allocationFollows?.length" 
                          v-for="follow in formattedUserAllocation?.allocationFollows"
                          :key="follow.principal"
                          class="taco-table w-100">

                          <!-- header - screen reader only -->
                          <thead>

                            <tr>

                              <!-- since -->
                              <th class="fw-normal" style="font-size: 0.925rem;">Since</th>

                              <!-- principal -->
                              <th style="font-size: 0.925rem;">Principal</th>

                              <!-- actions -->
                              <th style="font-size: 0.925rem;">Actions</th>

                            </tr>

                          </thead>

                          <!-- body -->
                          <tbody>

                            <!-- principal -->
                            <tr v-for="formattedFollow in formattedUserAllocation?.allocationFollows">

                              <!-- since -->
                              <td>
                                
                                <!-- since text -->
                                <span class="taco-text-black-to-white">
                                  {{ formatDate(formattedFollow.since) }}
                                </span>

                              </td>

                              <!-- principal text -->
                              <td class="w-100">

                                <!-- principal text -->
                                <span class="taco-text-black-to-white"
                                  data-bs-toggle="tooltip"
                                  data-bs-placement="top"
                                  :title="formattedFollow.follow.toString()"
                                >
                                  {{ firstXEllipsisLastX(formattedFollow.follow.toString(), 5, 9) }}
                                </span>

                              </td>

                              <!-- actions -->
                              <td style="width: 1%; white-space: nowrap;">

                                <!-- delete button -->
                                <button class="btn btn-sm taco-btn taco-btn--danger m-0 my-2 p-0 px-2 py-2"
                                  @click="handleRemoveFollow(formattedFollow.follow)"
                                >

                                  <!-- icon -->
                                  <i class="fa-solid fa-fw fa-xmark"></i>

                                </button>

                              </td>

                            </tr>

                          </tbody>

                        </table>

                        <!-- if no following -->
                        <div v-if="!userLoggedIn || !formattedUserAllocation?.allocationFollows?.length" class="py-2">
                          <p class="taco-text-black-to-white text-center" style="opacity: 0.5;">Not following anyone</p>
                        </div>

                      </div>

                    </div>

                    <!-- logged out, curtain -->
                    <div v-if="!userLoggedIn" class="login-curtain">

                      <!-- login button -->
                      <button class="btn iid-login" @click="iidLogIn()">

                        <!-- dfinity logo -->
                        <DfinityLogo />

                        <!-- login text -->
                        <span class="taco-text-white">Login to follow</span>

                      </button>

                    </div>                       

                  </div>               

                </div>

                <!-- loading curtain -->
                <div v-if="leftLoading" class="vote-view__loading-curtain">
                  
                  <!-- astronaut -->
                  <img :src="astronautLoaderUrl" class="loading-img">

                </div>

              </div>

              <!-- right -->
              <div class="vote-view__content__right">

                <!-- current vote and your vote -->
                <div class="taco-container taco-container--l1
                            d-flex flex-column gap-3 shadow position-relative">

                  <!-- current vote -->
                  <div class="taco-container taco-container--l2 pb-1">

                    <!-- current vote title -->
                    <h3 class="taco-text-black-to-white" style="font-size: 1.125rem;">
                      Voting Participation ({{ votedByAbleToVote }}%)
                    </h3>

                    <!-- progress bar container -->
                    <div class="taco-progress
                                progress" role="progressbar" aria-label="Example 20px high" aria-valuenow="25"
                      aria-valuemin="0" aria-valuemax="100">

                      <!-- progress bar -->
                      <div class="taco-progress__bar
                                  progress-bar"
                        :style="{
                          'width': `
                            ${votedByAbleToVote}%`, 
                          'background-color': 'var(--green)'}">
                      </div>

                    </div>

                    <!-- voting points cast -->
                    <span class="taco-text-black-to-white d-inline-flex align-items-center gap-1
                                 d-flex w-100 justify-content-end text-end mt-2" style="font-size: 0.75rem;">
                      {{
                        (Number(fetchedVotingPowerMetrics?.ok?.allocatedVotingPower) / Math.pow(10, 8)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }}
                      of
                      {{
                        (Number(fetchedVotingPowerMetrics?.ok?.totalVotingPowerByHotkeySetters) / Math.pow(10, 8)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }} VP

                      <!-- info hover tooltip -->
                      <i class="fa-solid fa-circle-info m-0 p-0 taco-text-black-to-white"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Voting power cast out of total voting power attached to hotkeys"
                        style="opacity: 0.5;"></i>

                    </span>

                  </div>

                  <!-- voting controls -->
                  <div class="taco-container taco-container--l2
                              d-flex flex-column">

                    <!-- no tokens curtain -->
                    <div v-if="tokenCount < 2" class="vote-allocations__no-tokens-curtain">

                      <p v-if="tokenCount === 0" class="taco-text-white text-center"><i class="fa-solid fa-triangle-exclamation taco-text-orange"></i> No Trusted Tokens</p>
                      <p v-if="tokenCount === 1" class="taco-text-white text-center"><i class="fa-solid fa-triangle-exclamation taco-text-orange"></i> Only One Trusted Token</p>
                      <p v-if="tokenCount === 0 || tokenCount === 1" class="taco-text-white text-center mb-0 small">The DAO must trust at least two tokens <br> before voting has any impact</p>
                      
                    </div>                              

                    <!-- top - your vote title, voting power, and match current button -->
                    <div class="d-flex justify-content-between">

                      <!-- left -->
                      <div class="d-flex flex-column">

                        <!-- voting controls title -->
                        <h3 class="taco-text-black-to-white mb-0" style="font-size: 1.125rem;">Voting Controls</h3>

                        <!-- voting points cast -->
                        <span class="taco-text-black-to-white" style="font-size: 0.75rem;">{{ votePower }} VP</span>

                      </div>

                      <!-- right -->
                      <div class="d-flex flex-column gap-1">

                        <!-- match dao button -->
                        <button v-if="!userLockedVote"
                          class="btn taco-btn taco-btn--green btn-sm"
                          :class="{'disabled': matchesDao}"
                          @click="matchDao"
                          :disabled="matchesDao">
                          Match DAO
                        </button>

                        <!-- match last button -->
                        <button v-if="userLoggedIn && !userLockedVote && formattedUserAllocation?.allocations?.length"
                          class="btn taco-btn taco-btn--green btn-sm"
                          :class="{'disabled': matchesLast}"
                          @click="matchLast"
                          :disabled="matchesLast">
                          Match Last
                        </button>

                        <!-- lock/unlock all button -->
                        <button v-if="userLoggedIn && !userLockedVote"
                          class="btn taco-btn taco-btn--green btn-sm"
                          @click="toggleLockAll">
                          {{ allSlidersLocked ? 'Unlock All' : 'Lock All' }}
                        </button>

                      </div>

                    </div>

                    <!-- middle -->
                    <ul class="d-flex flex-column gap-3 m-0 p-0 mt-2"
                      :style="{
                        'align-items': userLockedVote ? 'center' : 'start',
                        'width': userLockedVote ? 'fit-content' : '100%',
                        'align-self': userLockedVote ? 'center' : 'start'
                      }"
                    >

                      <!-- trusted token slider -->
                      <li v-for="(control, index) in currentSliders" 
                        :key="index" 
                        class="d-flex flex-column w-100"
                      >

                        <!-- top - symbol badge, percentage input, and lock button -->
                        <div class="d-flex justify-content-between"
                          :style="{
                            'align-items': userLockedVote ? 'center' : 'start',
                            'gap': userLockedVote ? '1rem' : '0'
                            }"
                        >

                          <!-- left - symbol badge -->
                          <div>

                            <!-- symbol badge -->
                            <span class="vote-badge 
                                          taco-text-white" :style="{'background-color': control.badgeColor}">{{
                              control.symbol }}</span>

                          </div>

                          <!-- right - percentage input and lock button -->
                          <div class="d-flex gap-1">

                            <!-- percentage input -->
                            <input v-if="!userLockedVote" type="number" class="form-control"
                              :class="{'ready-to-vote': userLockedVote}" placeholder="0" min="0" max="100"
                              style="width: 6rem;" :step="step" :value="control.currentPercentage.toFixed(2)"
                              :disabled="control.isLocked || userLockedVote || unlockedCount === currentSliders.length - 1"
                              @input="onAllocationChange(index, ($event.target as HTMLInputElement).valueAsNumber)">

                            <!-- lock icon -->
                            <button v-if="!userLockedVote" class="btn" @click="toggleLock(index)">

                              <!-- unlock icon -->
                              <i v-if="!control.isLocked" class="fa-solid fa-unlock fa-lg"
                                style="color: var(--gray-to-light-gray)"></i>

                              <!-- lock icon -->
                              <i v-if="control.isLocked" class="fa-solid fa-lock fa-lg"
                                style="color: var(--dark-gray-to-yellow)"></i>

                            </button>

                            <!-- percentage amount when locked in -->
                            <span v-if="userLockedVote" class="taco-text-black-to-white fw-bold"
                              style="font-size: 1.5rem;">{{ control.currentPercentage.toFixed(2) }}%</span>

                          </div>

                        </div>

                        <!-- bottom - slider -->
                        <div>

                          <!-- slider -->
                          <input v-show="!userLockedVote"
                            type="range" 
                            class="slider"
                            :class="{'disabled': control.isLocked || userLockedVote || unlockedCount === currentSliders.length - 1}"
                            :id="'slider' + (control.symbol)" :value="control.currentPercentage" min="0" max="100"
                            :step="step"
                            :disabled="control.isLocked || userLockedVote || unlockedCount === currentSliders.length - 1"
                            @input="onAllocationChange(index, ($event.target as HTMLInputElement).valueAsNumber)">

                        </div>

                      </li>

                    </ul>

                    <!-- bottom - buttons -->
                    <div class="mt-3">

                      <!-- lock in vote button -->
                      <button v-if="!userLockedVote" 
                        @click="userLockedVote = true"
                        class="btn taco-btn taco-btn--green taco-btn--big w-100"
                        :class="{'disabled': !currentSlidersSumTo100 || matchesLast || !votePower}"
                        :disabled="!currentSlidersSumTo100 || matchesLast || !votePower">
                        <span v-if="votePower !== '0' && votePower && currentSlidersSumTo100 && !matchesLast && userLoggedIn">Lock In Vote</span>
                        <span v-if="userLoggedIn && (votePower === '0' || !votePower)">You have no voting power</span>
                        <span v-if="!userLoggedIn">Login to vote</span>
                        <span v-if="!currentSlidersSumTo100">All values do not equal 100%</span>
                        <span v-if="currentSlidersSumTo100 && matchesLast">Must Be A New Vote</span>
                      </button>

                      <!-- cancel and vote buttons -->
                      <div v-if="userLockedVote" class="d-flex gap-2">

                        <!-- cancel button -->
                        <button @click="userLockedVote = false"
                          class="btn taco-btn taco-btn--danger taco-btn--big">Cancel</button>

                        <!-- vote button -->
                        <button @click="castVote()" 
                          class="btn taco-btn taco-btn--success taco-btn--big w-100">Vote with
                          {{ votePower }} VP</button>

                      </div>

                    </div>

                  </div>

                  <!-- voting history -->
                  <div v-if="userLoggedIn && formattedUserAllocation"
                    class="taco-container taco-container--l2">

                    <!-- voting history title -->
                    <h3 class="taco-text-black-to-white" 
                      style="font-size: 1.125rem;">Voting History</h3>

                    <!-- receipt -->
                    <div class="voting-receipt">                 
                      
                      <!-- start -->
                      <div class="voting-receipt__start"></div>
                      
                      <!-- content -->
                      <div class="voting-receipt__content shadow">
                        
                        <!-- top section -->
                        <div class="voting-receipt__top">
                          
                          <!-- left -->
                          <div class="voting-receipt__top__left">
                            
                            <!-- top -->
                            <div class="voting-receipt__top__left__top">
                              
                              <!-- section title -->
                              <h3>TacoDAO</h3>
                              
                            </div>
                            
                            <!-- bottom -->
                            <div class="voting-receipt__top__left__bottom">
                              
                              <!-- website -->
                              <span>tacodao.com</span>
                              
                              <!-- tagline -->
                              <span>Together we perfect the recipe</span>
                              
                            </div>
                            
                          </div>
                          
                          <!-- right -->
                          <div class="voting-receipt__top__right">
                            
                            <!-- ascii taco dao -->
                            <pre class="ascii-tacodao">   ===
 ==   ==
==== ====
==== ====
 TACODAO
</pre>
                            
                          </div>
                          
                        </div>
                        
                        <!-- fullwidth divider -->
                        <div class="voting-receipt__divider">&nbsp;</div>
                        
                        <!-- no votes -->
                        <div class="voting-receipt__no-votes">

                        </div>
                        
                        <!-- current vote -->
                        <div v-if="formattedUserAllocation?.allocations?.length > 0" 
                          class="voting-receipt__current-vote">
                          
                          <!-- current vote inner -->
                          <div class="voting-receipt__current-vote__inner">

                            <!-- top -->
                            <div class="voting-receipt__current-vote__top">
                              
                              <!-- section title -->
                              <h3>Current Vote</h3>            
                              
                            </div>
                            
                            <!-- bottom -->
                            <div class="voting-receipt__current-vote__bottom">
                              
                              <!-- left -->
                              <div class="voting-receipt__current-vote__bottom__left">

                                <!-- current vote table -->
                                <table class="voting-receipt__table">
                                  <thead>
                                    <tr>
                                      <th><span>Token</span></th>
                                      <th><span>Allocation</span></th>
                                    </tr>                
                                  </thead>
                                  <tbody>
                                    <tr v-if="formattedUserAllocation" v-for="currentAllocation in formattedUserAllocation?.allocations">
                                      <td>
                                        <span>{{ fetchedTokenDetails?.find((entry) => entry[0].toString() === currentAllocation.token.toString())?.[1]?.tokenSymbol || currentAllocation.token }}</span>
                                      </td>
                                      <td>
                                        <span>{{ Number(currentAllocation.basisPoints) / 100 }}%</span>
                                      </td>
                                    </tr>               
                                  </tbody>
                                </table>

                              </div>

                              <!-- right -->
                              <div class="voting-receipt__current-vote__bottom__right">
                                
                                <!-- kvps -->
                                <div class="voting-receipt__kvps">
                                  
                                  <!-- kvp -->
                                  <div class="voting-receipt__kvp">

                                    <!-- key -->
                                    <span class="voting-receipt__kvp__key">Allocator: </span>

                                    <!-- value -->
                                    <span class="voting-receipt__kvp__value">{{ formattedUserAllocation?.lastAllocationMaker.toString() === userPrincipal.toString() ? 'You' : firstXEllipsisLastX(formattedUserAllocation?.lastAllocationMaker.toString(), 5, 9) }}</span>

                                  </div>                
                                  
                                </div>

                              </div>
                              
                            </div>

                          </div>

                          <!-- fullwidth divider -->
                          <div v-if="formattedUserAllocation.pastAllocations.length > 0" 
                            class="voting-receipt__divider">&nbsp;</div>                          
                          
                        </div>

                        <!-- for each past allocation -->
                        <div v-if="formattedUserAllocation.pastAllocations.length > 0" 
                          v-for="(pastAllocation, index) in displayedPastAllocations">

                          <!-- previous vote -->
                          <div class="voting-receipt__previous-vote">
                            
                            <!-- top -->
                            <div class="voting-receipt__previous-vote__top">
                              
                              <!-- section title -->
                              <h3>Previous Vote {{ index + 1 }}</h3>
                              
                            </div>
                            
                            <!-- bottom -->
                            <div class="voting-receipt__previous-vote__bottom">
                              
                              <!-- left -->
                              <div class="voting-receipt__previous-vote__bottom__left">

                                <!-- previous vote table -->
                                <table class="voting-receipt__table">
                                  <thead>
                                    <tr>
                                      <th><span>Token</span></th>
                                      <th><span>Allocation</span></th>
                                    </tr>                
                                  </thead>
                                  <tbody>
                                    <tr v-for="actualAllocation in pastAllocation.allocation">
                                      <td>
                                        <span>{{ fetchedTokenDetails?.find((entry) => entry[0].toString() === actualAllocation.token.toString())?.[1]?.tokenSymbol || actualAllocation.token }}</span>
                                      </td>
                                      <td>
                                        <span>{{ Number(actualAllocation.basisPoints) / 100 }}%</span>
                                      </td>
                                    </tr>             
                                  </tbody>
                                </table>

                              </div>

                              <!-- right -->
                              <div class="voting-receipt__previous-vote__bottom__right">
                                
                                <!-- kvps -->
                                <div class="voting-receipt__kvps">
                                  
                                  <!-- kvp -->
                                  <div class="voting-receipt__kvp">

                                    <!-- key -->
                                    <span class="voting-receipt__kvp__key">Allocator: </span>

                                    <!-- value -->
                                    <span class="voting-receipt__kvp__value">{{ pastAllocation.allocationMaker.toString() === userPrincipal.toString() ? 'You' : firstXEllipsisLastX(pastAllocation.allocationMaker.toString(), 5, 9) }}</span>

                                  </div>

                                  <!-- kvp -->
                                  <div class="voting-receipt__kvp">

                                    <!-- key -->
                                    <span class="voting-receipt__kvp__key">From:</span>

                                    <!-- value -->
                                    <span class="voting-receipt__kvp__value">{{ formatDate(pastAllocation.from) }}</span>

                                  </div>

                                  <!-- kvp -->
                                  <div class="voting-receipt__kvp">

                                    <!-- key -->
                                    <span class="voting-receipt__kvp__key">To:</span>

                                    <!-- value -->
                                    <span class="voting-receipt__kvp__value">{{ formatDate(pastAllocation.to) }}</span>

                                  </div>  
                                  
                                </div>

                              </div>
                              
                            </div>
                            
                          </div>  
                          
                          <!-- fullwidth divider -->
                          <div v-if="index !== displayedPastAllocations.length - 1" class="voting-receipt__divider">&nbsp;</div>
                        
                        </div>

                        <!-- show more button -->
                        <div v-if="formattedUserAllocation.pastAllocations.length > initialDisplayCount && displayedPastAllocations.length < formattedUserAllocation.pastAllocations.length" 
                          class="voting-receipt__show-more">
                          <button class="btn taco-btn taco-btn--secondary" @click="showMorePastAllocations">
                            Show More
                          </button>
                        </div>
                        
                        <!-- asterisk break -->
                        <span class="voting-receipt__closing__break"></span>
                        
                        <!-- closing section -->
                        <div class="voting-receipt__closing">
                          
                          <!-- thank you -->
                          <span class="voting-receipt__closing__title">Thank you for your vote!</span>
                          
                          <!-- thank you message -->
                          <span class="voting-receipt__closing__text">TacoDAO only works when we work together</span>
                          <span class="voting-receipt__closing__text">Thank you for participating in voting</span>          
                          <span class="voting-receipt__closing__text">Have a tacotastic day!</span>
                          
                        </div>
                        
                      </div>

                      <!-- end -->      
                      <div class="voting-receipt__end"></div>
                      
                    </div>

                  </div>

                  <!-- loading curtain -->
                  <div v-if="rightLoading" class="vote-view__loading-curtain">
                    
                    <!-- astronaut -->
                    <img :src="astronautLoaderUrl" class="loading-img">

                  </div>                  

                  <!-- logged out, curtain -->
                  <div v-if="!userLoggedIn && tokenCount >= 3 && !rightLoading" class="login-curtain">

                    <!-- login button -->
                    <button class="btn iid-login" @click="iidLogIn()">

                      <!-- dfinity logo -->
                      <DfinityLogo />

                      <!-- login text -->
                      <span class="taco-text-white">Login to vote</span>

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

    <!-- message modal -->
    <div v-if="!userAcceptedHotkeyTutorial || userReshownHotkeyTutorial" class="vote__message">
      
      <!-- message -->
      <div class="vote__message__dialog">
        
        <!-- message top -->
        <div class="vote__message__dialog__top px-2 p-2">

          <!-- message top left -->
          <div class="taco-text-white">How To Hotkey</div>

          <!-- message top right -->
          <div class="taco-text-black-to-white"></div>

        </div>

        <!-- message middle -->
        <div class="vote__message__dialog__middle">

          <!-- left -->
          <div class="d-flex flex-column align-items-center justify-content-start">

            <!-- hotkey svg icon -->
            <svg xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 533 558" 
              style="width: 100%; max-width: 80px;">
              <path fill="var(--dark-orange-to-light-brown)" d="M414.645,190.32c36.157,0,65.468,29.311,65.468,65.468s-29.311,65.468-65.468,65.468-65.468-29.311-65.468-65.468,29.311-65.468,65.468-65.468ZM414.645,373.63c65.059,0,117.842-52.783,117.842-117.842s-52.783-117.842-117.842-117.842-117.842,52.783-117.842,117.842c0,23.077,6.629,44.6,18.085,62.767l-141.329,141.329c-10.229,10.229-10.229,26.842,0,37.071l52.374,52.374c10.229,10.229,26.842,10.229,37.071,0,10.229-10.229,10.229-26.842,0-37.071l-33.88-33.88,15.303-15.303,33.88,33.88c10.229,10.229,26.842,10.229,37.071,0,10.229-10.229,10.229-26.842,0-37.071l-33.88-33.88,70.46-70.46c18.167,11.457,39.69,18.085,62.767,18.085h-.082Z"/>
              <path fill="var(--dark-orange-to-light-brown)" d="M170.178,434.981l119.966-119.966c-8.763-18.406-13.341-38.602-13.341-59.227,0-26.358,7.357-51.589,21.095-73.354-9.854-17.062-22.145-32.804-36.658-46.663l-71.793-68.488c-8.052-7.629-12.63-18.309-12.63-29.412v-18.817c0-9.917-8.137-18.054-18.054-18.054-5.679,0-11.104,2.712-14.494,7.29l-13.562,18.054c-14.07,18.732-21.699,41.703-21.699,65.182,0,28.819,11.443,56.536,31.786,76.879l32.718,32.718c10.765,10.765,16.868,25.429,16.868,40.686v3.306c0,29.921-24.327,54.248-54.248,54.248s-54.248-24.327-54.248-54.248v-75.777c0-10.595-8.561-19.156-19.156-19.156-5.086,0-10.002,2.034-13.562,5.594l-2.967,2.967C16.957,187.984.513,227.653.513,269.017v3.221c0,89.848,72.895,162.743,162.743,162.743h6.922Z"/>
            </svg>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              What is Hotkeying?
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white text-center"
              style="font-size: 0.875rem;">
              Hotkeying your SNS Neurons with you TacoDao.com principal allows you to vote via the TacoDAO interface. <br><br> You can always manually vote via command line if TacoDao.com is down, but hotkeying is the easiest way to vote. It's free, and allows you to support TacoDao by using our dApp! <br><br> Here is more information on <a href="https://support.dfinity.org/hc/en-us/articles/8939053696788-What-is-a-neuron-hotkey-and-how-do-I-use-it" style="color: var(--blue-to-light-blue);" target="_blank">Hotkeying</a> from Dfinity
            </span>

          </div>

          <!-- right -->
          <div class="d-flex flex-column align-items-center justify-content-start">

            <!-- info icon -->
            <i class="fa-solid fa-circle-info"
              style="color: var(--dark-orange-to-light-brown); font-size: 4.5rem;"></i>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              How to Hotkey
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white text-start"
              style="font-size: 0.875rem;">
              To Hotkey your SNS Neurons
              <ol style="list-style-type: decimal; padding-left: 1.75rem;">
                <li class="text-start">
                  Copy your TacoDao.com principal from the top right corner of the screen
                </li>
                <li class="text-start">
                  Go to <a href="https://nns.ic0.app/" style="color: var(--blue-to-light-blue);" target="_blank">The NNS</a> and login
                </li>
                <li class="text-start">
                  Go to the Neuron Staking page and select a TacoDAO neuron
                </li>    
                <li class="text-start">
                  Scroll to the bottom of the page and select "Add Hotkey"
                </li> 
                <li class="text-start">
                  Enter your TacoDao.com principal and click "Confirm"
                </li>                                                
              </ol>
              <span class="d-inline-flex text-center">That's it, You've hotkeyed an SNS Neuron! You should now see your voting power, and you'll be able to vote on TacoDao.com</span>
            </span>

          </div>

        </div>

        <!-- message bottom -->
        <div class="vote__message__dialog__bottom p-2">

          <!-- message bottom left -->
          <div class="taco-text-black-to-white"></div>

          <!-- message bottom right -->
          <div class="taco-text-black-to-white">

            <!-- close button -->
            <button class="btn taco-nav-btn"
                    @click="acceptHotkeyTutorial(); acceptHotkeyTutorialLocally()">
              Got It
            </button>

          </div>

        </div>

      </div>
      
    </div>    

  </div>

</template>

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  // vote view
  .vote-view {
    display: flex;
    flex-direction: column;

    // top bar
    &__top-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      background-color: var(--dark-orange-to-light-brown);
      border-radius: 0.5rem;
      padding: 0.5rem;
      padding-left: 2rem;
      
      // title
      &__title {
        color: var(--white);
        font-size: 1.125rem;
        font-family: 'Space Mono';
        font-weight: bold;
        margin: 0;
      }      

      // vote power
      &__vote-power {
        color: var(--light-gray);
        font-size: 0.825rem;
      }

    }

    // content
    &__content {
      display: flex;

      // left
      &__left {
        display: flex;
        flex-direction: column;
        width: 50%;
      }

      // right
      &__right {
        width: 50%;
      }

    }

    // allocations container
    &__allocations {
      max-height: 482px;
    }

    // percentage input
    input[type="number"] {
      background-color: var(--white);
      border: 1px solid var(--dark-gray);
      border-radius: 0.325rem;
      padding: 0.25rem 0.5rem;
      font-size: 1.125rem;
      font-weight: bold;
      color: var(--black);
      text-align: right;

      &:disabled {
        opacity: 0.5;
      }
    }

    /********** Range Input Styles **********/
    /*Range Reset*/
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      cursor: pointer;
      width: 100%;
    }

    input[type="range"].disabled {
      opacity: 0.25;
    }

    /* Removes default focus */
    input[type="range"]:focus {
      outline: none;
    }

    // progressed part of the track
    input[type="range"]::range-progress {
      background-color: var(--light-blue);
      border-top-left-radius: 999rem;
      border-bottom-left-radius: 999rem;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      height: 0.5rem;
    }    

    /***** Chrome, Safari, Opera and Edge Chromium styles *****/
    /* slider track */
    input[type="range"]::-webkit-slider-runnable-track {
      background-color: var(--light-orange);
      border-radius: 0.5rem;
      height: 0.5rem;
    }

    /* slider thumb */
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; /* Override default look */
      appearance: none;
      margin-top: -0.5rem; /* Centers thumb on the track */

      /*custom styles*/
      background-color: var(--blue-hover);
      height: 1.5rem;
      width: 1.5rem;
      border-radius: 999rem;
    }

    // focus
    input[type="range"]:focus::-webkit-slider-thumb {   
      border: 1px solid var(--blue-hover);
      outline: 3px solid var(--blue-hover);
      outline-offset: 0.125rem; 
    }

    // progressed part of the track
    input[type="range"]::-webkit-progress-value {
      background-color: var(--light-blue);
      border-top-left-radius: 999rem;
      border-bottom-left-radius: 999rem;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      height: 0.5rem;
    }

    /******** Firefox styles ********/
    /* slider track */
    input[type="range"]::-moz-range-track {
      background-color: var(--light-orange);
      border-radius: 0.5rem;
      height: 0.5rem;
    }

    /* slider thumb */
    input[type="range"]::-moz-range-thumb {
      border: none; /*Removes extra border that FF applies*/
      border-radius: 0; /*Removes default border-radius that FF applies*/

      /*custom styles*/
      background-color: var(--blue-hover);
      height: 1.5rem;
      width: 1.5rem;
      border-radius: 999rem;
    }

    // focus
    input[type="range"]:focus::-moz-range-thumb {
      border: 1px solid var(--blue-hover);
      outline: 3px solid var(--blue-hover);
      outline-offset: 0.125rem; 
    }

    // progressed part of the track
    input[type="range"]::-moz-range-progress {
      background-color: var(--light-blue);
      border-top-left-radius: 999rem;
      border-bottom-left-radius: 999rem;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      height: 0.5rem;
    }

    /********** end Range Input Styles **********/

    // loading curtain
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
        z-index: 999; // above everything

        // loading image
        .loading-img {
            width: 10rem;
        }

    }

  }

  // vote badge
  .vote-badge {
    background-color: var(--light-orange);
    padding: 0.125rem 0.5rem;
    border-radius: 0.325rem;
    font-weight: bold;
    font-size: 1.125rem;
  }

  // token allocation
  .token-allocation {
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .token-control {
      display: flex;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #ccc;

      .token-info {
        flex: 1;
        .token-name {
          font-weight: bold;
        }
        .token-symbol {
          margin-left: 5px;
          color: #666;
        }
      }

      .token-controls {
        display: flex;
        align-items: center;

        input[type='range'] {
          margin-right: 10px;
        }

        input[type='number'] {
          width: 60px;
          margin-right: 10px;
        }

        button {
          padding: 5px 10px;
          border: none;
          background-color: #007bff;
          color: white;
          border-radius: 3px;
          cursor: pointer;

          &:disabled {
            background-color: #aaa;
            cursor: not-allowed;
          }
        }
      }
    }
  }

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

    &:hover {
      background-color: rgba(0,0,0,0.05);
    }

    &:active {
      border-color: transparent;
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
    z-index: 998;

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

  // vote allocations
  .vote-allocations {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow: hidden;

      // 
      &__taco-chart-container {
          max-height: 257px;
          position: relative;
      }

      // 
      &__taco-chart {
          
      }

      // 
      &__token-title {
          border-bottom: 1px solid var(--dark-orange);
          
          // 
          &__icon {
              width: 3.25rem;
              height: 3.25rem;
          }

          // 
          &__name-link {
              font-size: 1.25rem;
              font-weight: bold;
              color: var(--blue-to-light-blue);
          }

      }

      //  
      &__token-description {

          // title
          &__title {
              font-size: 1rem;
          }

          // 
          &__text {
              font-size: 0.825rem;
              font-family: 'Roboto';
          }
      }

      // token info list
      &__token-info-list {
          background-color: var(--light-brown-to-dark-brown);
          border-top-right-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          margin: 0;
          padding: 0;
          height: 100%;
          width: 190px;

          // token info list item
          li {
              font-size: 0.825rem;
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid var(--light-orange-to-dark-orange);
              padding: 0.75rem 1rem;
              gap: 0 1rem;

              // 
              &:last-of-type {
                  border-bottom: none;
              }
          }

          // key
          &__key {
              font-size: 0.825rem;
          }

          // value
          &__value {
              font-size: 1rem;
          }

          // token icon
          &__token-icon {
              width: 1rem;
              height: 1rem;
          }
      }

      // historical list
      &__historical-list {

          .taco-container {
              // max-height: 468px;
          }
      }

      // no tokens curtain
      &__no-tokens-curtain {
        position: absolute;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.75);
        padding: 0 1rem;
        z-index: 997;
        border-radius: 0.5rem;
      }
            
  }

  // vote following
  .vote-following {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // vote message modal
  .vote__message {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: start;
    width: 100%;
    height: 100%;
    background-color: var(--curtain-bg);
    z-index: 1000;
    margin: 0;
    padding: 0;
    overflow: auto;

    // dialog
    &__dialog {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 40rem;
      border-radius: 0.5rem;
      background-color: var(--light-orange-to-dark-brown);
      border: 1px solid var(--dark-orange);
      overflow: clip;
      margin: 2rem 2rem 2rem;

      container: tutorial-dialog / inline-size;

      // container queries
      @container tutorial-dialog (inline-size > 400px) {
        .vote__message__dialog__middle {
          flex-direction: row;
          padding: 3rem;
        }
        .vote__message__dialog__middle > div {
          width: 50%;
        }
      }
      @container tutorial-dialog (inline-size < 400px) {
        .vote__message__dialog__middle {
          flex-direction: column;
          padding: 3rem 1rem;
        }
        .vote__message__dialog__middle > div {
          width: 100%;
        }
      }

      // top and bottom
      &__top, &__bottom {
        display: flex;
        width: 100%;
        justify-content: space-between;
        background-color: var(--dark-orange);
      }

      // top
      &__top {

      }

      // middle
      &__middle {
        display: flex;
        flex-direction: row;
        align-items: start;
        gap: 2rem;
      }        

      // bottom
      &__bottom {

      }

    }

  }  

  // voting receipt
  .voting-receipt {
    
    &__start {
      position: relative;
      height: 20px;
      width: 100%;
      margin-bottom: -1px;
      
      &::after {
        content: "";
        display: block;
        position: absolute;
        left: 0;
        right: 0;
        height: 20px;
        background:
          linear-gradient(
            45deg, 
            #ffffff 33.333%, 
            transparent 33.333%, 
            transparent 66.667%, 
            #ffffff 66.667%), 
          linear-gradient(
            -45deg, 
            #ffffff 33.333%, 
            transparent 33.333%, 
            transparent  66.667%, 
            #ffffff 66.667%
          );
        background-position-x: 0%, 0%;
        background-position-y: 0%, 0%;
        background-size: auto, auto;
        background-size: 16px 40px;
        background-position: 0 20px;
      }
      
    }
    
    &__content {
      background-color: #ffffff;
      background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj48c3R5bGUgdHlwZT0idGV4dC9jc3MiPnRleHQgeyBmaWxsOiAjZjZmNmY2OyB9PC9zdHlsZT48ZGVmcz48cGF0dGVybiBpZD0idGFjb2RhbyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiPjx0ZXh0IHk9IjMwIiBmb250LXNpemU9IjQwIiBpZD0ibmFtZSI+VGFjb0RBTzwvdGV4dD48L3BhdHRlcm4+PHBhdHRlcm4geGxpbms6aHJlZj0iI3RhY29kYW8iPjx0ZXh0IHk9IjEyMCIgeD0iMjAwIiBmb250LXNpemU9IjI5IiBpZD0idm90aW5ncmVjZWlwdCI+Vm90aW5nIFJlY2VpcHQ8L3RleHQ+PC9wYXR0ZXJuPjxwYXR0ZXJuIGlkPSJjb21ibyIgeGxpbms6aHJlZj0iI3RhY29kYW8iIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgtNDUpIj48dXNlIHhsaW5rOmhyZWY9IiNuYW1lIiAvPjx1c2UgeGxpbms6aHJlZj0iI3ZvdGluZ3JlY2VpcHQiIC8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NvbWJvKSIgLz48L3N2Zz4=");
    }
    
    &__end {
      position: relative;
      height: 20px;
      width: 100%;
      margin-top: -1px;
      
      &::after {
        content: "";
        display: block;
        position: absolute;
        left: 0;
        right: 0;
        height: 20px;
        background:
          linear-gradient(
            45deg, 
            transparent 33.333%, 
            #ffffff 33.333%, 
            #ffffff 66.667%, 
            transparent 66.667%
          ), 
          linear-gradient(
            -45deg, 
            transparent 33.333%, 
            #ffffff 33.333%, 
            #ffffff 66.667%, 
            transparent 66.667%
          );
        background-position-x: 0%, 0%;
        background-position-y: 0%, 0%;
        background-size: auto, auto;
        background-size: 16px 40px;
        background-position:
      0 -20px;
      }
      
    }
    
    &__top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1.25rem 0.5rem;
      
      &__left {
        
        &__top {
          
          h3 {
            font-family: 'Merchant Copy Double';
            font-size: 1.125rem;
            color: #434343;
            margin: 0;
            padding: 0 0 0.25rem 0;
          }
          
        }
        
        &__bottom {
          display: flex;
          flex-direction: column;
          
          span {
            font-family: 'Merchant Copy';
            font-size: 1.125rem;
            color: #434343;
            line-height: 1;
          }
          
        }        
        
      }
      
      &__right {}
      
    }
    
    &__bottom {
      padding: 0 1.25rem;
    }
    
    &__divider {
      border-bottom: 1px dashed #6c6c6c;
      line-height: 0;
    }
    
    &__table {
      font-family: 'Merchant Copy Double';
      font-size: 0.75rem;
      color: #434343;
      
      thead {}
      tbody {}
      tr {}
      th {
        text-align: left;
        &:first-of-type {
          padding-right: 3rem;
        }
        span {
          font-size: 1rem;
          font-weight: bold;
        }
      }
      td {
        &:first-of-type {
          padding-right: 3rem;
        }
        span {
          font-size: 1rem;
          line-height: 1;
        }
      }
      
    }
    
    &__kvps {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    &__kvp {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-family: 'Merchant Copy Double';
      font-size: 1rem;
      color: #434343;
      
      &__key {
        font-weight: bold;
        line-height: 1;
      }
      
      &__value {
        line-height: 1;
      }
    }
    
    .ascii-tacodao {
      font-family: 'Merchant Copy Wide';
      font-size: 0.75rem;
      color: #b4b4b4;
      line-height: 1;
    }

    h3 {
      font-size: 1.125rem;
    }
    
    &__current-vote {

      &__inner {
        padding: 0 1.25rem 0.75rem;
      }
      
      &__top {
        
        h3 {
          font-family: 'Merchant Copy Double';
          color: #434343;
          margin: 0;
          padding: 1rem 0 0.25rem;
        }
        
      }
      
      &__bottom {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        padding-top: 0.25rem;
        
        &__left {
          padding-left: 0.5rem;
        }

        &__right {

        }        
        
      }
      
    }
    
    &__previous-vote {
      padding: 0 1.25rem 0.75rem;
      
      &__top {
        
        h3 {
          font-family: 'Merchant Copy Double';
          color: #434343;
          margin: 0;
          padding: 1rem 0 0.25rem;
        }
        
      }
      
      &__bottom {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        padding-top: 0.25rem;
        
        &__left {
          padding-left: 0.5rem;
        }

        &__right {

        }        
        
      }
      
    }
    
    &__closing {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 1rem 0.5rem;
      
      &__break {
        display: inline-block;
        width: 100%;
        overflow: hidden;
        line-height: 1;
        
        &::after {
          content: '**************************************************************************************************************************************************************************************************************';
          color: #8d8d8d;
          font-family: 'Merchant Copy Wide';
          font-size: 0.75rem;
        }
        
      }
      
      &__title {
        font-family: 'Merchant Copy Wide';
        color: #b4b4b4;
        font-size: 1.25rem;   
        padding: 0;
        text-align: center;
        line-height: 1;
      }
      
      &__text {
        font-family: 'Merchant Copy Wide';
        color: #b4b4b4;
        font-size: 0.875rem;
        text-align: center;
        line-height: 1;
      }
      
    }

    &__show-more {
      display: flex;
      justify-content: center;
      
      button {
        color: #5b5b5b;
        outline: 2px solid #aaaaaa;
        font-family: 'Merchant Copy Wide';
        border-radius: 0;
        padding: 0 0.75rem;
        margin-bottom: 0.5rem;
      }
    }
    
  }

  // custom tooltip styles to match dataLabels
  :deep(.custom-tooltip) {
    padding: 4px 8px !important;
    font-size: 14px !important;
    font-family: 'Space Mono' !important;
    font-weight: bold !important;
    color: #fff !important;
  }

  ////////////////////////////////////
  // vote allocations media queries //
  ////////////////////////////////////

  // phone protrait
  @media (max-width: 575.98px) {
      .vote-allocations__taco-chart-container {
          max-height: unset; // needs an event listener to adjust height
      } 
      .vote-allocations__token-title__name-link {
          font-size: 0.875rem;
      }
      .vote-allocations__token-title__icon {
          width: 2.5rem;
          height: 2.5rem;
      }
      .vote-allocations__token-info-list {
          width: 150px;
      }
      .vote-view__top-bar {
        padding-left: 1rem;
        padding-right: 1rem;
      }      
  }

  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
      .vote-allocations__taco-chart-container {
          max-height: 210px;
      } 
      .vote-allocations__token-title__name-link {
          font-size: 0.875rem;
      }
      .vote-allocations__token-title__icon {
          width: 2.5rem;
          height: 2.5rem;
      }
      .vote-allocations__token-info-list {
          width: 150px;
      }
  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
      .vote-allocations__taco-chart-container {
          max-height: 285px;
      }  
      .vote-allocations__token-title__name-link {
          font-size: 1rem;
      }
      .vote-allocations__token-title__icon {
          width: 2.5rem;
          height: 2.5rem;
      }
      .vote-view__top-bar {
        // padding-left: 0.25rem;
        // padding-right: 0.25rem;
      }
  }

  // small daktop
  @media (min-width: 992px) and (max-width: 1199.98px) {
      .vote-allocations__taco-chart-container {
          max-height: 182px;
      }
      .vote-allocations__token-title__name-link {
          font-size: 0.875rem;
      }
      .vote-allocations__token-title__icon {
          width: 2.5rem;
          height: 2.5rem;
      }
      .vote-allocations__token-info-list {
          width: 150px;
      }
  }

  // medium desktop
  @media (min-width: 1200px) and (max-width: 1399.98px) {
      .vote-allocations__taco-chart-container {
          max-height: 220px;
      }
  }  

  // hardcoded taco title
  .taco-title {
    display: inline-flex;
    margin-bottom: 0;
    font-size: 1.5rem;
    font-weight: 500;
    font-family: "Rubik Mono One", monospace;
    gap: 0.75rem;

    &__icon {
      color: var(--brown-to-white);
    }

    &__title {
      color: var(--brown-to-white);
    }
  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    .vote-view__content {
      gap: 0.25rem;
      flex-direction: column-reverse;
    }
    .vote-view__content__left {
      width: 100%;
    }
    .vote-view__content__right {
      width: 100%;
    }  
  }

  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
    .vote-view__content {
      gap: 0.25rem;
      flex-direction: column-reverse;
    }
    .vote-view__content__left {
      width: 100%;
    }
    .vote-view__content__right {
      width: 100%;
    }
  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {
    .vote-view__content {
      gap: 0.25rem;
      flex-direction: column-reverse;
    }
    .vote-view__content__left {
      width: 100%;
    }
    .vote-view__content__right {
      width: 100%;
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
  // imports //
  /////////////

  import FooterBar from "../components/FooterBar.vue"
  import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue"
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"
  import { tokenData } from "../components/data/TokenData"
  import DfinityLogo from "../assets/images/dfinityLogo.vue"
  import { Principal } from "@dfinity/principal"
  import astronautLoader from "../assets/images/astonautLoader.webp"

  ////////////////
  // interfaces //
  ////////////////

  interface TokenControl {
      id: number;
      name: string;
      symbol: string;
      allocation: number;
      locked: boolean;
  }

  ///////////
  // setup //
  ///////////  

  // images
  const astronautLoaderUrl = astronautLoader  

  ///////////
  // store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // app
  const { darkModeToggled } = tacoStore

  // user
  const { userLoggedIn } = storeToRefs(tacoStore)  
  const { userPrincipal } = storeToRefs(tacoStore)
  const { truncatedPrincipal } = storeToRefs(tacoStore)
  const { userAcceptedHotkeyTutorial } = storeToRefs(tacoStore)

  // dao backend
  const { fetchedTokenDetails } = storeToRefs(tacoStore)
  const { fetchedVotingPowerMetrics } = storeToRefs(tacoStore)
  const { fetchedUserAllocation } = storeToRefs(tacoStore)
  const { fetchedAggregateAllocation } = storeToRefs(tacoStore)

  // # ACTIONS #

  // user
  const { iidLogIn } = tacoStore  
  const { checkIfLoggedIn } = tacoStore

  // app
  const { addToast } = tacoStore
  const { acceptHotkeyTutorial } = tacoStore

  // dao backend
  const { updateAllocation } = tacoStore
  const { fetchVotingPowerMetrics } = tacoStore
  const { fetchUserAllocation } = tacoStore
  const { followAllocation } = tacoStore
  const { unfollowAllocation } = tacoStore
  const { fetchAggregateAllocation } = tacoStore

  // ledger canisters
  const { icrc1Metadata } = tacoStore

  // dao backend
  const { ensureTokenDetails } = tacoStore

  /////////////////////
  // local variables //
  /////////////////////

  // left loading
  const leftLoading = ref(false)

  // right loading
  const rightLoading = ref(false)

  // feature flags
  const followingEnabled = ref(false)

  // element references
  const tacoChartContainer = ref<HTMLElement | null>(null)
  const maxWidthThreshold = 576  
  const currentTokenIcon = ref<string>('')
  const currentTokenTitle = ref<string>('')
  const currentTokenSymbol = ref<string>('')
  const currentTokenLink = ref<string>('')
  const currentTokenDescription = ref<string>('')
  const currentTokenColor = ref<string>('#ccc')
  const currentSliders = ref<any>([])
  const followPrincipalInput = ref<string>('')
  const formattedUserAllocation = ref()

  // tutorial
  const userReshownHotkeyTutorial = ref(false)

  // user
  const userLockedVote = ref(false)
  const refreshingVP = ref(false)

  // chart
  const series = ref([100])
  const seriesNames = ref(['loading'])
  const colors = ref(['#ccc'])

  // token count
  const tokenCount = ref(0)

  ///////////////////
  // local methods //
  ///////////////////  

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

  //////////////
  // handlers //  

  // move me

  // working array
  let workingArray: any[] = []

  // updated array
  let updatedArray: any[] = []  

  // handle fetched token details
  // Optional: pass initialPercentages to avoid equal-segment animation when we already have allocation data
  const handleFetchedTokenDetails = async (tokenDetails: any, initialPercentages?: number[]) => {

    // log
    // console.log('VoteView.vue: fetchedTokenDetails:', tokenDetails)

    // count of tokens
    tokenCount.value = tokenDetails.length

    //////////////////
    // update chart //
    //////////////////

    // safely extract token data - now an array of [principal, basisPoints] tuples
    const allTokens = tokenDetails || []

    // filter out tokens that are inactive
    const extractedTokens = allTokens.filter((token: [any, { Active: boolean }]) => {
      return token[1].Active === true
    })

    // log
    // console.log('VoteView.vue: allTokens:', allTokens)
    // console.log('VoteView.vue: extractedTokens (filtered):', extractedTokens)

    // Use initialPercentages if provided, otherwise evenly distribute
    const percentages = initialPercentages || extractedTokens.map((token: any) => 100 / extractedTokens.length)

    // create array for symbols
    let symbols: string[] = extractedTokens.map((token: [any, { tokenSymbol: string }]) => token[1].tokenSymbol)

    // create colors array from symbols and tokenData
    const colors = symbols.map((symbol: string) => {
      const token = tokenData.find((token: any) => 
        token.symbol.toLowerCase() === symbol.toLowerCase()
      )
      return token?.color || '#ff0000'
    })

    // apply colors to chart and create sliders if we have valid arrays
    if (percentages && symbols && colors) {

      // handle apply data to chart
      await handleApplyDataToChart(percentages, symbols, colors)

      // save to working array
      workingArray = [percentages, symbols, colors]

      /////////////////////////////////
      // create currentSliders array //
      /////////////////////////////////

      // create canister IDs array from token details
      const canisterIds = extractedTokens.map((token: [any, { tokenSymbol: string }]) => token[0].toString())

      // create currentSliders array using default percentages
      currentSliders.value = percentages.map((percentage: any, index: number) => {
        return {
          symbol: symbols[index],
          canisterId: canisterIds[index], // Store the canister ID
          currentPercentage: percentage,
          initialPercentage: percentage, // store initial percentage
          isLocked: false,
          badgeColor: colors[index]
        }
      })    
      
    }

    // else there is a problem
    else {

      // log error
      console.error('VoteView.vue: error applying data to chart')

    }
    
  }

  // handle fetched aggregate allocation
  const handleFetchedAggregateAllocation = async (aggregateAllocation: any) => {

    // log
    // console.log('VoteView.vue: fetchedAggregateAllocation:', aggregateAllocation)

    try {

      //////////////////
      // update chart //
      //////////////////

      // safely extract allocation data - now an array of [principal, basisPoints] tuples
      const allocations = fetchedAggregateAllocation?.value || []

      // log
      // console.log('taco.store: aggregateAllocation:', allocations)

      // create array of percentages from basis points and ensure exactly 100%
      const calculateExactPercentages = (allocations: any[]) => {

        // convert to rounded percentages
        let percentages = allocations.map((allocation: any) => 
          Number((Number(allocation[1]) / 100).toFixed(2)) // convert basis points to percentage with 2 decimal places
        )
        
        // get the exact sum
        const sum = percentages.reduce((a, b) => a + b, 0)
        
        // adjust if not exactly 100
        if (Math.abs(sum - 100) >= 0.01 && percentages.length > 0) {
          const diff = Number((100 - sum).toFixed(2))
          const largestIndex = percentages.indexOf(Math.max(...percentages))
          percentages[largestIndex] = Number((percentages[largestIndex] + diff).toFixed(2))
        }
        
        // return percentages
        return percentages

      }
      
      // calculate percentages once to use in both places
      const percentages = calculateExactPercentages(allocations)

      // log
      // console.log('percentages:', percentages)
      
      // create array of canister ids from principals
      const canisterIds = allocations.map((allocation: any) => 
        allocation[0].toString() // convert principal to string
      )

      // log
      // console.log('canisterIds:', canisterIds)

      // create symbols array - use tokenDetails for fast lookup instead of icrc1Metadata
      let symbols: string[] = []

      // Build a map from principal -> symbol using fetchedTokenDetails (fast path)
      const tokenDetailsMap = new Map<string, string>()
      if (fetchedTokenDetails.value && fetchedTokenDetails.value.length > 0) {
        for (const entry of fetchedTokenDetails.value) {
          const principal = entry[0]
          const details = entry[1]
          const principalStr = typeof principal === 'string' ? principal : principal?.toString?.() || ''
          if (principalStr && details?.tokenSymbol) {
            tokenDetailsMap.set(principalStr, details.tokenSymbol)
          }
        }
      }

      // Map canister IDs to symbols
      for (const canisterId of canisterIds) {
        // Check tokenDetails map first (fast path)
        if (tokenDetailsMap.has(canisterId)) {
          symbols.push(tokenDetailsMap.get(canisterId)!)
          continue
        }

        // Fall back to icrc1Metadata call (slow path) - only if not in tokenDetails
        const fetchedMetadata = await icrc1Metadata(canisterId)
        // @ts-ignore
        const symbolEntry = fetchedMetadata.find((entry: any) => entry[0] === "icrc1:symbol")

        if (symbolEntry && symbolEntry[1]?.Text) {
          symbols.push(symbolEntry[1].Text)
        } else {
          console.error('VoteView.vue: error fetching metadata for canister id:', canisterId)
        }
      }

      // log
      // console.log('percentages:', percentages)
      // console.log('symbols from metadata:', symbols)
      // console.log('working array:', workingArray)

      // create new array for chart update that respects the existing order
      const newArray = workingArray[1].map((symbol: string) => {

        // find the index of this symbol in the new symbols array
        const symbolIndex = symbols.findIndex((s: string) => s === symbol)
        
        // if found, use the corresponding percentage, otherwise use 0
        return symbolIndex !== -1 ? percentages[symbolIndex] : 0

      })

      // console.log('new array for chart:', newArray)

      // save to updated array
      updatedArray = newArray  
      
      // log
      // console.log('updatedArray:', updatedArray)

      // update chart with new array
      await handleUpdateDataOnChart(newArray)

      // check if user has past allocations
      if (formattedUserAllocation.value && formattedUserAllocation.value.allocations && formattedUserAllocation.value.allocations.length > 0){

        // log
        // console.log('user has past allocations, matching last')

        // match last
        matchLast()

      } else {

        // log
        // console.log('user has no past allocations, matching dao')

        // update the current sliders
        currentSliders.value = currentSliders.value.map((slider: any, index: number) => ({
          ...slider,
          currentPercentage: updatedArray[index] || 0,
          isLocked: false // unlock sliders
        }))

      }

      /////////////////
      // click chart //
      /////////////////

      const firstNonZeroIndex = percentages.findIndex((percentage: number) => percentage > 0)
      
      handleChartSegmentClick(null, null, { 
        dataPointIndex: firstNonZeroIndex >= 0 ? firstNonZeroIndex : 0 
      })

    } catch (error) {

      // log
      console.error('VoteView.vue: error updating chart:', error)

    }

  }

  // handle fetched voting power metrics
  const handleFetchedVotingPowerMetrics = async (votingPowerMetrics: any) => {

    // log
    // console.log('VoteView.vue: fetchedVotingPowerMetrics:', votingPowerMetrics)

  }

  // handle fetched user allocation
  const handleFetchedUserAllocation = async (userAllocation: any) => {

    // log
    // console.log('VoteView.vue: fetchedUserAllocation:', userAllocation)

    // set formatted user allocation
    formattedUserAllocation.value = userAllocation[0]

    // log
    // console.log('VoteView.vue: formattedUserAllocation:', formattedUserAllocation.value)

  }

  // handle apply allocation data to chart
  const handleApplyDataToChart = async (seriesParams: number[], seriesNamesParams: string[], colorsParams: string[]) => {
      
      // update all values at once using nextTick
      nextTick(() => {
          series.value = seriesParams
          seriesNames.value = seriesNamesParams
          colors.value = colorsParams
      })

      // force chart update by updating options
      chartOptions.value = {
          ...chartOptions.value,
          colors: colorsParams
      }

  }

  // handle update data on chart
  const handleUpdateDataOnChart = async (newValues: any[]) => {

    // log
    // console.log('handleUpdateDataOnChart: newValues:', newValues)

      // update all values at once using nextTick
      nextTick(() => {
          series.value = newValues
      })

      // force chart update by updating options
      chartOptions.value = {
          ...chartOptions.value
      }    
    
  }

  // handle clicking on a chart segment
  const handleChartSegmentClick = (event: any, chartContext: any, config: any) => {

    // log
    // console.log('handleChartSegmentClick')

    // get selected index
    const selectedIndex = config.dataPointIndex

    /////////////////////
    // from chart data //
    /////////////////////
    
    // get symbol
    const selectedSymbol = seriesNames.value[selectedIndex]

    // log
    // console.log('selectedSymbol:', selectedSymbol)

    // update symbol
    currentTokenSymbol.value = selectedSymbol

    // log
    // console.log('currentTokenSymbol:', currentTokenSymbol.value)

    /////////////////////
    // from token data //
    /////////////////////
    
    // find matching token in tokenData
    const selectedToken = tokenData.find((token: any) => token.symbol.toLowerCase() === selectedSymbol.toLowerCase())

    // log selected token
    // console.log('selectedToken: ', selectedToken)

    // update title, link, icon, description, and color with tokenData
    if (selectedToken) {
        currentTokenTitle.value = selectedToken.title
        currentTokenLink.value = selectedToken.link
        currentTokenIcon.value = selectedToken.icon
        currentTokenDescription.value = selectedToken.description
        currentTokenColor.value = selectedToken.color
    }

  } 
  
  // set taco chart max height
  const setTacoChartMaxHeight = async () => {
      const element = tacoChartContainer.value;
      if (element) {
          element.style.maxHeight = ''; // Temporarily remove max-width to allow natural height

          await nextTick(); // Wait for the DOM to update

          if (window.innerWidth < maxWidthThreshold) {
              const height = element.clientHeight;
              const maxHeight = height / 2 + 12;
              element.style.maxHeight = `${maxHeight}px`;
          } else {
              element.style.maxHeight = ''; // Ensure max-width is removed if above the threshold
          }
      }
  }    

  // cast vote
  const castVote = async () => {

    // log
    // console.log('Casting Vote...')

    // turn left loading
    leftLoading.value = true

    // turn right loading
    rightLoading.value = true

    // create allocations array with basis points (percentage * 100)
    const allocations = currentSliders.value.map((slider: any) => ({
      token: Principal.fromText(slider.canisterId),
      basisPoints: Math.round(slider.currentPercentage * 100)
    }))

    // log
    // console.log('VoteView.vue: allocation basis points:', allocations)

    // confirm allocations sum to 10000 basis points
    const sum = allocations.reduce((acc: number, curr: any) => acc + curr.basisPoints, 0)

    // if allocations do not sum to 10000, return to allocation sliders and do not continue
    if (Math.abs(sum - 10000) > 1) {
      userLockedVote.value = false
      return
    }

    // log
    // console.log('allocations sum to 10000 basis points, casting vote')

    // cast vote with backend
    try { 

      // cast vote with backend
      await updateAllocation(allocations)

      // refresh everything (must await handlers in order)
      await ensureTokenDetails()
      await handleFetchedTokenDetails(fetchedTokenDetails.value)
      await fetchAggregateAllocation()
      await handleFetchedAggregateAllocation(fetchedAggregateAllocation.value)
      await fetchVotingPowerMetrics()
      await handleFetchedVotingPowerMetrics(fetchedVotingPowerMetrics.value)
      await fetchUserAllocation()
      await handleFetchedUserAllocation(fetchedUserAllocation.value)

      // return to allocation sliders
      userLockedVote.value = false      

      // add toast
      addToast({
        id: Date.now(),
        code: 'code',
        tradeAmount: '',
        tokenSellIdentifier: '',
        tradeLimit: '',
        tokenInitIdentifier: '',
        title: '👨‍🍳 Vote Cast!',
        icon: '',
        message: `Allocation vote cast with ${votePower.value} VP`
      })

      // // add temp toast
      // addToast({
      //   id: Date.now(),
      //   code: 'code',
      //   tradeAmount: '',
      //   tokenSellIdentifier: '',
      //   tradeLimit: '',
      //   tokenInitIdentifier: '',
      //   title: '👨‍🍳 Test Vote Cast!',
      //   icon: '',
      //   message: `Test allocation vote cast with ${votePower.value} VP. We're turning the trading bot on soon!`
      // })      

    } catch (error) {

      // log
      console.error('VoteView.vue: error casting vote:', error)

      // return to allocation sliders
      userLockedVote.value = false      
    } finally {

      // turn off left loading
      leftLoading.value = false

      // turn off right loading
      rightLoading.value = false

    }

  }

  // handle add follow
  const handleAddFollow = async (principalStr: string) => {
    try {
      await followAllocation(Principal.fromText(principalStr))
    } catch (error) {
      console.error('VoteView.vue: error following allocation:', error)
    }
  }

  // handle remove follow
  const handleRemoveFollow = async (principalStr: string) => {
    try {
      await unfollowAllocation(Principal.fromText(principalStr))
    } catch (error) {
      console.error('VoteView.vue: error unfollowing allocation:', error)
    }
  }

  // match dao
  const matchDao = () => {

    // log
    // console.log('VoteView.vue: matching dao allocations')

    // update each slider to use current dao allocation from updatedArray
    currentSliders.value = currentSliders.value.map((slider: any, index: number) => ({
      ...slider,
      currentPercentage: updatedArray[index] || 0,
      isLocked: false // unlock sliders
    }))
    
  }  

  // match last
  const matchLast = () => {

    // log user allocation
    // console.log('VoteView.vue: user allocation:', formattedUserAllocation.value)

    // if allocations array is empty or undefined, return
    if (!formattedUserAllocation.value || formattedUserAllocation.value.length === 0){

      // log
      // console.log('VoteView.vue: no user allocation, matching dao')

      // match dao
      matchDao()

      // return
      return

    }

    // log
    // console.log('VoteView.vue: matching last allocations')

    // log all allocations
    // console.log('VoteView.vue: all allocations:', formattedUserAllocation.value.allocations)

    // set sliders to last allocation percentages
    currentSliders.value = currentSliders.value.map((slider: any) => {
      
      // if formattedUserAllocation exists
      if (formattedUserAllocation.value) {

        // find matching allocation by canister id
        const matchingAllocation = formattedUserAllocation.value.allocations.find(
          (allocation: any) => allocation.token.toString() === slider.canisterId
        )

        // return updated slider
        return {
          ...slider,
          currentPercentage: matchingAllocation ? Number(matchingAllocation.basisPoints) / 100 : 0,
          isLocked: false // unlock all sliders when matching
        }

      } else {

       // return slider with current percentages
        return {
          ...slider,
          currentPercentage: slider.currentPercentage,
          isLocked: false // unlock all sliders when matching
        }

      }

    })

  }

  // reshown hotkey tutorial
  const reshowHotkeyTutorial = () => {

    // log
    // console.log('VoteView.vue: reshown hotkey tutorial')

    // set user reshown hotkey tutorial to true
    userReshownHotkeyTutorial.value = true

  }

  // accept hotkey tutorial locally
  const acceptHotkeyTutorialLocally = () => {

    // log
    // console.log('VoteView.vue: accepting hotkey tutorial locally')


    userReshownHotkeyTutorial.value = false
    
  }

  /////////////
  // returns //  

  // return formatted date
  const formatFullDate = (epochTimestamp: bigint) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }
    // convert epoch timestamp (in nanoseconds) to milliseconds
    const date = new Date(Number(epochTimestamp / BigInt(1_000_000)))
    return date.toLocaleDateString('en-US', options).replace(' at ', ' ')
  }

  // entered principal passes validation

  // current version const regex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/
  // other version?  const regex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/
  const validatePrincipal = (principal: string): boolean => {
    const regex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/
    return regex.test(principal)
  }  

  // first X characters, ellipsis, last X characters, takes count of before and after characters
  const firstXEllipsisLastX = (input: string, before: number, after: number) => {
    
    if(input){

      if (input?.length <= before + after) {
        return input
      } else {
        return `${input.slice(0, before)}...${input.slice(-after)}`
      }

    } else {

      return 'loading...'

    }

  }  

  // return formatted date
  const formatDate = (epochTimestamp: bigint) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: '2-digit', 
      year: 'numeric' 
    }
    // convert epoch timestamp (in nanoseconds) to milliseconds
    const date = new Date(Number(epochTimestamp / BigInt(1_000_000)))
    return date.toLocaleDateString('en-US', options)
  }  

  // return allocation count
  const allocationCount = computed(() => {
    return fetchedAggregateAllocation.value.length
  })

  /////////////
  // utility //  
  
  //////////////
  // computed //
  //////////////

  // computed voted percentage
  const votedByAbleToVote = computed(() => {

    // get values from store
    // @ts-ignore
    const votedVP = Number(fetchedVotingPowerMetrics?.value?.ok?.allocatedVotingPower) || 0
    // @ts-ignore
    const ableToVoteVP = Number(fetchedVotingPowerMetrics?.value?.ok?.totalVotingPowerByHotkeySetters) || 0
    
    // if total able to vote voting power is 0, return 0
    if (ableToVoteVP === 0) return 0
    
    // calculate percentage of voting power that's been cast
    const percentage = (votedVP / ableToVoteVP) * 100
    
    // return clamped to maximum of 100%
    return Number(Math.min(100, percentage).toFixed(2))

  })    

  // check if currentSliders percentages sum to essentially 100 (within small epsilon)
  const currentSlidersSumTo100 = computed(() => {

    // if all currentSliders percentages sum to 100, return true, otherwise return false
    return Math.abs(currentSliders.value.reduce((sum: number, slider: any) => sum + slider.currentPercentage, 0) - 100) < 0.01

  })

  // vote power
  const votePower = computed(() => {

    // if no value, return 0
    if (!formattedUserAllocation.value) return 0

    // return formatted voting power
    return (Number(formattedUserAllocation.value.votingPower) / Math.pow(10, 8)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

    // log
    // console.log('VoteView.vue: vote power:', votePower.value)

  })  

  // following count
  const followingCount = computed(() => {

    // if no value, return 0
    if (!formattedUserAllocation.value) return 0

    // return following
    return formattedUserAllocation.value.allocationFollows.length

  })

  // matches dao
  const matchesDao = computed(() => {

    // return true if all sliders match the current dao allocations (same as matchDao function)
    return currentSliders.value.every((slider: any, index: number) => {

      // compare current percentage with current dao allocation from updatedArray
      return Math.abs(
        slider.currentPercentage - 
        (updatedArray[index] || 0)
      ) < 0.01
      
    })

  })  

  // matches last
  const matchesLast = computed(() => {

    // if no user allocations yet, return false
    if (!formattedUserAllocation.value?.allocations) return false

    // return true if all sliders match their corresponding last allocation
    return currentSliders.value.every((slider: any) => {

      // find matching allocation by canister id
      const matchingAllocation = formattedUserAllocation.value.allocations.find(
        (allocation: any) => allocation.token.toString() === slider.canisterId
      )

      // compare current percentage with last allocation (converting basis points to percentage)
      return Math.abs(
        slider.currentPercentage - 
        (matchingAllocation ? Number(matchingAllocation.basisPoints) / 100 : 0)
      ) < 0.01
      
    })

  })

  // max follows reached
  const maxFollowsReached = computed(() => {
    return followingCount.value >= 5
  })

  //////////////
  // watchers //
  //////////////

  // watch for changes in user logged in state
  watch(userLoggedIn, async (newState) => {

    // log
    // console.log('VoteView.vue: checking user logged in state')

    if (userLoggedIn.value) {

      // log
      // console.log('VoteView.vue: user is logged in')

      // turn on right loading
      rightLoading.value = true

      // refresh voting power
      await refreshVotingPower()

      // turn off right loading
      rightLoading.value = false


    } else {

      // log
      // console.log('VoteView.vue: user is not logged in')

    }

  })

  /////////////////////
  // lifecycle hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {

    // chart stuff
    setTacoChartMaxHeight()
    window.addEventListener('resize', setTacoChartMaxHeight)

    // Check for existing cached data FIRST before any await calls or loading flags
    const hasCachedTokenDetails = fetchedTokenDetails.value && fetchedTokenDetails.value.length > 0
    const hasCachedAggregateAllocation = fetchedAggregateAllocation.value && fetchedAggregateAllocation.value.length > 0
    const hasCachedVotingPowerMetrics = fetchedVotingPowerMetrics.value !== null

    // If we have all cached data, use it immediately without showing loading
    if (hasCachedTokenDetails && hasCachedAggregateAllocation) {

      // Extract initial percentages from aggregate allocation to avoid equal-segment animation
      // This builds a map of principal -> percentage, then maps it to token order
      const allocationMap = new Map<string, number>()
      for (const allocation of fetchedAggregateAllocation.value as any[]) {
        const principal = String(allocation[0]?.toString?.() || allocation[0])
        const percentage = Number(allocation[1]) / 100 // basis points to percentage
        allocationMap.set(principal, percentage)
      }

      // Get active tokens and their initial percentages in the correct order
      const activeTokens = (fetchedTokenDetails.value as any[]).filter((token: any) => token[1]?.Active === true)
      const initialPercentages = activeTokens.map((token: any) => {
        const principal = String(token[0]?.toString?.() || token[0])
        return allocationMap.get(principal) || 0
      })

      // Ensure percentages sum to 100 (adjust largest if needed due to rounding)
      const sum = initialPercentages.reduce((a: number, b: number) => a + b, 0)
      if (Math.abs(sum - 100) >= 0.01 && initialPercentages.length > 0) {
        const diff = 100 - sum
        const largestIndex = initialPercentages.indexOf(Math.max(...initialPercentages))
        initialPercentages[largestIndex] = Number((initialPercentages[largestIndex] + diff).toFixed(2))
      }

      // Pass initial percentages to avoid equal-segment animation
      await handleFetchedTokenDetails(fetchedTokenDetails.value, initialPercentages)
      await handleFetchedAggregateAllocation(fetchedAggregateAllocation.value)
      if (hasCachedVotingPowerMetrics) {
        await handleFetchedVotingPowerMetrics(fetchedVotingPowerMetrics.value)
      }

      // Check login and user allocation in background (don't block)
      checkIfLoggedIn().then(async () => {
        if (userLoggedIn.value) {
          // Check if we already have cached userAllocation
          const hasCachedUserAllocation = fetchedUserAllocation.value && fetchedUserAllocation.value.length > 0
          if (hasCachedUserAllocation) {
            handleFetchedUserAllocation(fetchedUserAllocation.value)
            // Background refresh (fire-and-forget)
            fetchUserAllocation().catch(console.error)
          } else {
            await fetchUserAllocation()
            handleFetchedUserAllocation(fetchedUserAllocation.value)
          }
        }
      })

      // Trigger background refresh (fire-and-forget, don't await)
      ensureTokenDetails().catch(console.error)
      fetchAggregateAllocation().catch(console.error)
      fetchVotingPowerMetrics().catch(console.error)

      return // Early return - we're done with immediate rendering
    }

    // No cached data - turn on component-level loading spinners only
    // (no full-page appLoadingOn - let component spinners handle it)
    leftLoading.value = true
    rightLoading.value = true

    try {
      // Fetch all data in parallel for faster loading
      await Promise.all([
        ensureTokenDetails(),
        fetchAggregateAllocation(),
        fetchVotingPowerMetrics(),
      ])

      // Extract initial percentages to avoid equal-segment animation
      const allocationMap = new Map<string, number>()
      for (const allocation of fetchedAggregateAllocation.value as any[]) {
        const principal = String(allocation[0]?.toString?.() || allocation[0])
        const percentage = Number(allocation[1]) / 100
        allocationMap.set(principal, percentage)
      }
      const activeTokens = (fetchedTokenDetails.value as any[]).filter((token: any) => token[1]?.Active === true)
      const initialPercentages = activeTokens.map((token: any) => {
        const principal = String(token[0]?.toString?.() || token[0])
        return allocationMap.get(principal) || 0
      })
      // Adjust for rounding
      const sum = initialPercentages.reduce((a: number, b: number) => a + b, 0)
      if (Math.abs(sum - 100) >= 0.01 && initialPercentages.length > 0) {
        const diff = 100 - sum
        const largestIndex = initialPercentages.indexOf(Math.max(...initialPercentages))
        initialPercentages[largestIndex] = Number((initialPercentages[largestIndex] + diff).toFixed(2))
      }

      // Handle the fetched data with initial percentages (avoid equal-segment animation)
      await handleFetchedTokenDetails(fetchedTokenDetails.value, initialPercentages)
      await handleFetchedAggregateAllocation(fetchedAggregateAllocation.value)
      await handleFetchedVotingPowerMetrics(fetchedVotingPowerMetrics.value)

      // check if user is logged in
      await checkIfLoggedIn()

      // if user is logged in, fetch user state
      if (userLoggedIn.value) {
        // Check if we already have cached userAllocation
        const hasCachedUserAllocation = fetchedUserAllocation.value && fetchedUserAllocation.value.length > 0
        if (hasCachedUserAllocation) {
          handleFetchedUserAllocation(fetchedUserAllocation.value)
          // Background refresh (fire-and-forget)
          fetchUserAllocation().catch(console.error)
        } else {
          await fetchUserAllocation()
          handleFetchedUserAllocation(fetchedUserAllocation.value)
        }
      }

    } catch (error) {
      console.error('VoteView.vue: error on mounted:', error)
    } finally {
      leftLoading.value = false
      rightLoading.value = false
    }

  })

  // Watch for data arriving from worker (update display when cached data arrives)
  let hasProcessedInitialData = false

  watch([fetchedTokenDetails, fetchedAggregateAllocation], async ([tokenDetails, aggregateAllocation]) => {
    // Only process if we have both sets of data and haven't loaded yet
    if (tokenDetails && tokenDetails.length > 0 &&
        aggregateAllocation && aggregateAllocation.length > 0 &&
        !hasProcessedInitialData) {
      hasProcessedInitialData = true

      // Extract initial percentages to avoid equal-segment animation
      const allocationMap = new Map<string, number>()
      for (const allocation of aggregateAllocation as any[]) {
        const principal = String(allocation[0]?.toString?.() || allocation[0])
        const percentage = Number(allocation[1]) / 100
        allocationMap.set(principal, percentage)
      }
      const activeTokens = (tokenDetails as any[]).filter((token: any) => token[1]?.Active === true)
      const initialPercentages = activeTokens.map((token: any) => {
        const principal = String(token[0]?.toString?.() || token[0])
        return allocationMap.get(principal) || 0
      })
      // Adjust for rounding
      const sum = initialPercentages.reduce((a: number, b: number) => a + b, 0)
      if (Math.abs(sum - 100) >= 0.01 && initialPercentages.length > 0) {
        const diff = 100 - sum
        const largestIndex = initialPercentages.indexOf(Math.max(...initialPercentages))
        initialPercentages[largestIndex] = Number((initialPercentages[largestIndex] + diff).toFixed(2))
      }

      await handleFetchedTokenDetails(tokenDetails, initialPercentages)
      await handleFetchedAggregateAllocation(aggregateAllocation)

      if (fetchedVotingPowerMetrics.value) {
        await handleFetchedVotingPowerMetrics(fetchedVotingPowerMetrics.value)
      }
    }
  })

  // Watch for userAllocation data arriving from worker (for logged-in users)
  watch(fetchedUserAllocation, (newData) => {
    if (newData && newData.length > 0 && userLoggedIn.value) {
      handleFetchedUserAllocation(newData)
    }
  })

  // on before unmounted
  onBeforeUnmount(() => {

      //
      window.removeEventListener('resize', setTacoChartMaxHeight)

  })

  /////////////////
  // apex charts //
  /////////////////

  // initialize chart options
  const chartOptions = ref({
    chart: {
        type: 'pie',
        animations: {
            enabled: true,
            easing: 'easeout',
            speed: 300,
            animateGradually: {
                enabled: false,  // disable "popping up" animation on initial load
                delay: 0
            },
            dynamicAnimation: {
                enabled: true,   // keep smooth transitions when data changes
                speed: 300
            }
        },
        fontFamily: 'Space Mono',
        id: 'currentAllocations',
    },
    states: {
        hover: {
            filter: {
                type: 'darken',
                value: 0.85
            }
        },
        active: {
            filter: {
                type: 'darken',
                value: 0.50
            }
        }
    },
    plotOptions: {
        pie: {
            startAngle: -90,
            endAngle: 90,
            customScale: 1,
            expandOnClick: true,
        },
    },
    // colors: ['#3b00b9', '#777', '#888', '#f8a01b', '#047b3e'],
    colors: colors,
    dataLabels: {
        enabled: true,
        formatter: function (val: any, opts: any) {
            return seriesNames.value[opts.seriesIndex].toUpperCase() + " " + val.toFixed(2) +'%'
        },
        textAnchor: 'middle',
        distributed: false,
        offsetX: 0,
        offsetY: 0,
        style: {
            fontSize: '16px',
            fontFamily: 'Space Mono',
            fontWeight: 'bold',
            colors: undefined
        },
        background: {
            enabled: true,
            foreColor: '#fff',
            padding: 4,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: '#fff',
            opacity: 1,
            dropShadow: {
                enabled: false,
                top: 1,
                left: 1,
                blur: 1,
                color: '#000',
                opacity: 0.25,
            }
        },
        dropShadow: {
            enabled: false,
            top: 1,
            left: 1,
            blur: 1,
            color: '#000',
            opacity: 0.45
        },
    },
    legend: {show: false},
    stroke: {show: false},
    tooltip: {
        enabled: true,
        fillSeriesColor: true,
        style: {
            fontSize: '16px',
            fontFamily: 'Space Mono',
            fontWeight: 'bold',
        },
        custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
            const val = series[seriesIndex]
            const symbol = seriesNames.value[seriesIndex].toUpperCase()
            return `<div class="custom-tooltip">
                <span>${symbol} ${val.toFixed(2)}%</span>
            </div>`
        }
    },
    markers: {
        size: 1,
    }
  })

  ////////////////////
  // token controls //
  ////////////////////

  // max decimals
  const MAX_DECIMALS = 2

  // use a step that matches the maximum decimals (e.g. 0.01 if 2 decimals).
  const step = Number((1 / Math.pow(10, MAX_DECIMALS)).toFixed(MAX_DECIMALS))

  // rounds a number to MAX_DECIMALS
  function round(value: number): number {

    // return the value rounded to MAX_DECIMALS
    return Number(value.toFixed(MAX_DECIMALS))

  }

  // computed total number of unlocked tokens
  const unlockedCount = computed(() =>

    // get the count of all locked tokens in currentSliders
    currentSliders.value.filter((token: any) => token.isLocked).length

  )

  // computed property to check if all sliders are locked
  const allSlidersLocked = computed(() =>
    currentSliders.value.length > 0 && currentSliders.value.every((token: any) => token.isLocked)
  )

  // distributes the reduction of delta among the unlocked tokens
  function distributeReduction(delta: number, freeIndices: number[]): boolean {

    // create a local copy of current allocations for free tokens
    let freeTokens = freeIndices.map((i) => ({
      index: i,
      allocation: currentSliders.value[i].currentPercentage,
    }))

    while (freeTokens.length > 0 && delta > 0.0001) {
      const equalShare = delta / freeTokens.length;
      
      // find tokens that cannot afford the full equal share
      const tokensBelowShare = freeTokens.filter(
        (t) => t.allocation < equalShare + 0.0001
      )

      // if there are tokens that cannot afford the full equal share
      if (tokensBelowShare.length > 0) {

        // reduce delta by the amount of the tokens that cannot afford the full equal share
        for (const t of tokensBelowShare) {
          delta = round(delta - t.allocation)
          currentSliders.value[t.index].currentPercentage = 0
        }

        // remove tokens that were clamped to 0
        freeTokens = freeTokens.filter((t) => t.allocation >= equalShare + 0.0001)

        // update the freeTokens array with the current allocations.
        freeTokens = freeTokens.map((t) => ({
          index: t.index,
          allocation: currentSliders.value[t.index].currentPercentage,
        }))

      } else {

        // distribute the delta among the free tokens
        for (const t of freeTokens) {
          const newAlloc = currentSliders.value[t.index].currentPercentage - equalShare
          currentSliders.value[t.index].currentPercentage = round(newAlloc)
        }

        // set delta to 0
        delta = 0

        // break
        break

      }

    }

    return delta < 0.0001

  }

  // distributes the increase of delta among the unlocked tokens
  function distributeIncrease(delta: number, freeIndices: number[]): boolean {

    // increase is positive
    let increase = -delta

    // create a local copy of current allocations for free tokens
    let freeTokens = freeIndices.map((i) => ({
      index: i,
      available: 100 - currentSliders.value[i].currentPercentage,
    }))

    // distribute the increase among the free tokens
    while (freeTokens.length > 0 && increase > 0.0001) {

      // calculate the equal share of the increase
      const equalShare = increase / freeTokens.length

      // find tokens that cannot afford the full equal share
      const tokensBelowShare = freeTokens.filter(
        (t) => t.available < equalShare + 0.0001
      )

      // if there are tokens that cannot afford the full equal share
      if (tokensBelowShare.length > 0) {

        // reduce the increase by the amount of the tokens that cannot afford the full equal share
        for (const t of tokensBelowShare) {
          increase = round(increase - t.available)
          currentSliders.value[t.index].currentPercentage = 100
        }

        // remove tokens that were clamped to 100
        freeTokens = freeTokens.filter((t) => t.available >= equalShare + 0.0001)

        // update the freeTokens array with the current allocations
        freeTokens = freeTokens.map((t) => ({
          index: t.index,
          available: 100 - currentSliders.value[t.index].currentPercentage,
        }))

      } else {
        for (const t of freeTokens) {
          const newAlloc = currentSliders.value[t.index].currentPercentage + equalShare
          currentSliders.value[t.index].currentPercentage = round(newAlloc)
        }

        // set increase to 0
        increase = 0

        // break
        break

      }

    }

    return increase < 0.0001

  }

  // adjusts the allocation for a token
  function adjustAllocation(index: number, newAllocation: number) {

    // do nothing if the token is locked
    if (currentSliders.value[index].isLocked) return

    // // if this is the only unlocked token, disallow changes
    // if (unlockedCount === currentSliders.value.length - 1) return

    // round the new allocation
    newAllocation = round(Number(newAllocation))

    // if the new allocation is NaN, return
    if (isNaN(newAllocation)) return

    // clamp the new allocation between 0 and 100
    newAllocation = Math.max(0, Math.min(100, newAllocation))

    // round the new allocation
    newAllocation = round(newAllocation)

    // get the old allocation
    const oldAllocation = currentSliders.value[index].currentPercentage

    // get the delta
    const delta = round(newAllocation - oldAllocation)

    // if there is no effective change, return
    if (Math.abs(delta) < 0.0001) return

    // get the indices of all other unlocked tokens
    const freeIndices = currentSliders.value
      // @ts-ignore
      .map((t, i) => i)
      // @ts-ignore
      .filter((i) => i !== index && !currentSliders.value[i].isLocked)

    // if there are no free tokens to adjust, revert change
    if (freeIndices.length === 0) return

    // set the target token's allocation
    currentSliders.value[index].currentPercentage = newAllocation

    // Distribute the delta among the other tokens
    if (delta > 0) {
      const success = distributeReduction(delta, freeIndices)
      if (!success) {
        currentSliders.value[index].currentPercentage = oldAllocation
      }
    } else {
      const success = distributeIncrease(delta, freeIndices)
      if (!success) {
        currentSliders.value[index].currentPercentage = oldAllocation
      }
    }

    // fix any rounding error so that the total is exactly 100.
    const total = round(currentSliders.value.reduce((sum: number, t: any) => sum + t.currentPercentage, 0))
    const diff = round(100 - total)
    if (Math.abs(diff) > 0.001 && freeIndices.length > 0) {
      currentSliders.value[freeIndices[0]].currentPercentage = round(
        currentSliders.value[freeIndices[0]].currentPercentage + diff
      )
    }
  }

  // called when a slider or input changes
  function onAllocationChange(index: number, newVal: number) {
    adjustAllocation(index, newVal)
  }

  // toggle the locked state for a token
  function toggleLock(index: number) {
    currentSliders.value[index].isLocked = !currentSliders.value[index].isLocked
  }

  // toggle the locked state for all tokens
  function toggleLockAll() {
    const shouldLockAll = !allSlidersLocked.value
    currentSliders.value.forEach((token: any) => {
      token.isLocked = shouldLockAll
    })
  }

  // how many history allocations to show
  const initialDisplayCount = 3
  const displayedPastAllocations = ref<any[]>([])

  // watch for changes in pastAllocations
  watch(() => formattedUserAllocation.value?.pastAllocations, (newVal) => {
    if (newVal) {
      displayedPastAllocations.value = newVal.slice().reverse().slice(0, initialDisplayCount)
    }
  }, { immediate: true })

  // show more past allocations
  const showMorePastAllocations = () => {
    displayedPastAllocations.value = formattedUserAllocation.value.pastAllocations.slice().reverse()
  }

</script>