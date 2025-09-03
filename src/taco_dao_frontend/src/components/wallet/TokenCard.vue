<template>

  <div class="token-card">

    <!-- left -->
    <div class="d-flex flex-wrap gap-3-5 flex-grow-1">

      <!-- token logo, balance, symbol, usd value, and name -->
      <div class="d-flex align-items-start gap-2">

        <!-- token logo -->
        <img :src="token.logo" 
            :alt="token.symbol" 
            class="token-card__logo" />

        <!-- token balance, symbol, and name -->
        <div class="d-flex flex-column gap-2">

          <!-- balance balance and symbol -->
          <div class="d-flex align-items-center gap-2">

            <!-- balance amount and symbol -->
            <span class="token-card__balance">
              {{ formatBalance(token.balance, token.decimals) }}
            </span>

            <!-- token symbol -->
            <span class="token-card__symbol">{{ token.symbol }}</span>    
            
            <!-- unregister button -->
            <button v-if="token.isRegistered" 
                    @click="$emit('unregister', token)"
                    class="token-card__action-btn
                          btn btn-sm"
                    title="Remove from wallet">

              <!-- icon -->
              <i class="fa fa-xmark"></i>

            </button>          

          </div>

          <!-- balance usd value -->
          <span v-if="token.priceUSD && token.priceUSD > 0" 
                class="token-card__usd-value">
            ${{ formatUSDValue(token.balance, token.decimals, token.priceUSD) }}
          </span>

          <!-- token name -->
          <span class="token-card__name">{{ token.name }}</span>

          <!-- account id container -->
          <div v-if="token.symbol === 'ICP'"
              class="d-flex gap-1 align-items-center gap-1"
              style="margin-top: -0.25rem;">

            <!-- account id, bootstrap tooltip -->
            <span class="small"
                  style="word-break: break-all;"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  data-bs-custom-class="taco-tooltip"
                  :title="icpAccountId.hex">
              &hellip;{{ icpAccountId.hex.slice(-15) }}
            </span>

            <!-- copy button -->
            <button  @click="copyToClipboard(icpAccountId.hex)"
                    class="btn btn-sm m-0 p-0 taco-text-black-to-white"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-custom-class="taco-tooltip"
                    title="Copy account ID">

              <!-- icon -->
              <i class="fa fa-regular fa-copy"></i>

            </button>

          </div>        

        </div>

      </div>

      <!-- rewards (taco) -->
      <div v-if="token.symbol === 'TACO'" 
          class="d-flex flex-column gap-1 ml-auto">

        <!-- rewards header -->
        <div class="d-flex align-items-center gap-2 mt-1">

          <!-- rewards header title -->
          <div class="d-flex align-items-center gap-2">

            <!-- rewards icon -->
            <i class="fa fa-coins"></i>

            <!-- rewards title text -->
            <span>Rewards</span>

            <!-- rewards balance -->
            <span v-if="totalRewards > 0" class="small">
              {{ formatBalance(BigInt(Math.floor(totalRewards)), 8) }} TACO
            </span>

            <!-- empty rewards balance -->
            <span v-else class="small">(0)</span>

            <button v-if="totalRewards > 0"
                    class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                    :disabled="loadingRewards || claimingAllRewards"
                    title="Claim some rewards">
              Calim Some
            </button>            

            <button v-if="totalRewards > 0"
                    @click="claimAllRewards"
                    class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                    :disabled="loadingRewards || claimingAllRewards"
                    title="Claim all rewards">
              Calim All
            </button>

          </div>

        </div>

        <!-- loading rewards -->
        <div v-if="loadingRewards" 
            class="d-flex align-items-center gap-2">

          <!-- spinner -->
          <div class="spinner-border spinner-border-sm" role="status">

            <!-- hidden text -->
            <span class="visually-hidden">Loading rewards</span>

          </div>

          <!-- text -->
          <span class="small">Loading rewards...</span>

        </div>

        <!-- loaded rewards -->
        <div v-else>

          <!-- rewards balance -->
          <span>{{ formatBalance(BigInt(Math.floor(totalRewards)), 8) }} TACO</span>

        </div>

      </div>
      
      <!-- neurons (taco) -->
      <div v-if="token.symbol === 'TACO'" 
          class="token-card__neurons flex-grow-1">

        <!-- neurons header -->
        <div class="d-flex align-items-center gap-2">

          <!-- neurons header title -->
          <div @click="toggleNeuronsSection"
              class="d-flex align-items-center gap-2"
              style="cursor: pointer;">

            <!-- expand icon -->
            <i :class="neuronsExpanded ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" 
              style="min-width: 1rem;"></i>          

            <!-- neurons icon -->
            <i class="fa fa-brain"></i>

            <!-- neurons title text -->
            <span>Neurons</span>

            <!-- neurons count -->
            <span v-if="categorizedNeurons.all.length > 0"
                  class="small">
              ({{ categorizedNeurons.all.length }})
            </span>

            <!-- empty neurons count -->
            <span v-else class="small">(0)</span>

          </div>

          <!-- create neuron button -->
          <button @click="$emit('create-neuron')"
                  class="btn btn-sm taco-btn taco-btn--green px-2 py-2"
                  title="Create new neuron">
            
            <!-- icon -->
            <i class="fa fa-plus"></i>

          </button>      
          
          <!-- refresh neurons button -->
          <button @click="loadNeurons"
                  class="btn btn-sm taco-btn taco-btn--green px-2 py-2"
                  :disabled="loadingNeurons"
                  title="Refresh neurons">

            <!-- icon -->
            <i class="fa fa-refresh" :class="{ 'fa-spin': loadingNeurons }"></i>

          </button>        

        </div>

        <!-- neurons content -->
        <div v-if="neuronsExpanded">

          <!-- loading neurons -->
          <div v-if="loadingNeurons" 
              class="d-flex align-items-center gap-2">

            <!-- spinner -->
            <div class="spinner-border spinner-border-sm" role="status">

              <!-- hidden text -->
              <span class="visually-hidden">Loading neurons</span>

            </div>

            <!-- text -->
            <span class="small">Loading neurons...</span>

          </div>
          
          <!-- no neurons -->
          <!-- v-else-if="categorizedNeurons.all.length === 0" -->
          <div v-if="false">

            <!-- text -->
            <span>No neurons found</span>

          </div>
          
          <!-- neurons sections -->
          <!-- v-else -->
          <div v-else class="d-flex flex-column gap-3">

            <!-- neurons owned -->
            <!-- v-if="categorizedNeurons.owned.length > 0" -->
            <div class="d-flex flex-column gap-2">

              <!-- neurons owned header -->
              <span>

                <!-- icon -->
                <i class="fa fa-crown"></i>

                <!-- title -->
                <!-- {{ categorizedNeurons.owned.length }} -->
                <span>
                  Owned <span class="small">(X)</span>
                </span>

              </span>

              <!-- neurons owned list -->
              <div class="token-card__neurons__list">

                <!-- neuron owned -->
                <!-- v-for="neuron in categorizedNeurons.owned" :key="neuron.idHex" -->
                <div class="token-card__neurons__neuron
                            d-flex flex-column">

                  <!-- neuron name -->
                  <div class="d-flex align-items-center justify-content-between gap-2 mb-3">

                    <span class="d-flex align-items-center gap-2">

                      <!-- icon -->
                      <i class="fa fa-brain"></i>

                      <!-- neuron name -->
                      <!-- {{ neuron.displayName }} -->
                      <span style="font-size: 1.25rem;">My Neuron</span>
                      
                    </span>

                    <!-- rewards indicator -->
                    <!-- v-if="getNeuronRewards(neuron.idHex) > 0" -->
                    <span  
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          data-bs-custom-class="taco-tooltip"
                          title="This neuron has unclaimed rewards">

                      <!-- icon -->
                      <i class="fa fa-coins"></i>

                    </span>

                  </div>                            

                  <!-- neuron info -->
                  <div class="neuron-info-section d-flex flex-column">

                    <!-- neuron stake -->
                    <div class="">

                      <!-- neuron stake -->
                      <!-- {{ formatBalance(neuron.stake, 8) }} -->
                      <div class="small">
                        <span class="fw-bold">Staked:</span> X TACO
                      </div>

                      <div class="d-flex gap-2">

                        <!-- stake to neuron button -->
                        <!-- @click.stop="$emit('stake-to-neuron', neuron)" -->
                        <button 
                                class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                                title="Stake to this neuron">

                          <!-- icon -->
                          <i class="fa fa-plus"></i>

                        </button>

                        <!-- set dissolve period button -->
                        <!-- @click.stop="$emit('set-dissolve', neuron)" -->
                        <button 
                                class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                                title="Set dissolve period">

                          <!-- icon -->
                          <i class="fa fa-regular fa-clock"></i>

                        </button>

                      </div>



                    </div>

                    <!-- neuron rewards -->
                    <!-- :class="{ '--has-rewards': getNeuronRewards(neuron.idHex) > 0 }" -->
                    <div class=""
                        >

                      <!-- detail label -->
                      <span class="small"><span class="fw-bold">Rewards:</span> X TACO</span>

                      <!-- v-if="getNeuronRewards(neuron.idHex) > 0" -->
                      <!-- {{ formatBalance(BigInt(Math.floor(getNeuronRewards(neuron.idHex))), 8) }} -->
                      <!-- <span  class="small">X TACO</span> -->

                      <!-- @click.stop="claimNeuronRewards(neuron)" -->
                      <!-- :disabled="loadingRewards || isNeuronClaiming(neuron.idHex)" -->
                      <button 
                        
                        class="btn btn-sm taco-btn taco-btn--green px-2"
                        style="padding-top: 0.125rem; padding-bottom: 0.125rem;"
                        
                        title="Claim this neuron's rewards">
                        Claim
                      </button>

                      <!-- v-else -->
                      <span  class="d-none small">
                        <span class="fw-bold">Rewards:</span> 0 TACO
                      </span>

                    </div>
                    
                    <!-- neuron dissolve period -->
                    <div class="">

                      <span class="small"><span class="fw-bold">Dissolve Period:</span> X days</span>

                      <!-- :class="'dissolve-' + neuron.dissolveState.type" -->
                      <!-- {{ neuron.dissolveState.display }} -->
                      <!-- <span class="" 
                            >
                        dissolve state
                      </span> -->

                    </div>

                    <!-- neuron age -->
                    <div class="">

                      <span class="small"><span class="fw-bold">Age:</span> X days</span>

                      <!-- {{ neuron.age }} -->
                      <!-- <span class="">neuron age</span> -->

                    </div>

                    <!-- neuron maturity -->
                    <div class="d-none">

                      <span class=""><span class="fw-bold">Maturity:</span> X TACO</span>

                      <!-- {{ formatBalance(neuron.maturity, 8) }} -->
                      <!-- <span class="">
                        X TACO
                      </span> -->

                    </div>

                    <!-- neuron staked maturity -->
                    <!-- v-if="neuron.stakedMaturity > 0" -->
                    <div class="d-none">

                      <span class="fw-bold">Staked Maturity:</span>

                      <!-- {{ formatBalance(neuron.stakedMaturity, 8) }}  -->
                      <span class="">
                        X TACO
                      </span>

                    </div>

                    <!-- neuron voting power -->
                    <div class="">

                      <span class="small"><span class="fw-bold">Voting Power:</span> X%</span>

                      <!-- {{ neuron.votingPowerMultiplier }} -->
                      <!-- <span class="">X%</span> -->

                    </div>

                    <!-- neuron auto-stake -->
                    <div class="">

                      <span class="small">
                        
                        <span class="fw-bold">Auto-stake:</span> Enabled
                      
                        <!-- :class="neuron.autoStakeMaturity ? 'fa fa-check text-success' : 'fa fa-times text-muted'" -->
                        <i class="fa fa-check"></i>  
                      
                      </span>

                      <!-- disable button -->
                      <button class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                              title="Disable auto-stake">
                        <i class="fa fa-times"></i>
                      </button>                      

                      <span class="d-none">

                        <!-- :class="neuron.autoStakeMaturity ? 'fa fa-check text-success' : 'fa fa-times text-muted'" -->
                        <!-- <i class="fa fa-check"></i> -->

                        <!-- {{ neuron.autoStakeMaturity ? 'Enabled' : 'Disabled' }} -->
                        <!-- <span>
                          Enabled
                        </span> -->

                      </span>

                    </div>

                    <!-- neuron created -->
                    <div class="">

                      <span class="small"><span class="fw-bold">Created:</span> xx/xx/xxxx</span>

                      <!-- {{ neuron.createdDate.toLocaleDateString() }} -->
                      <!-- <span class="">
                        created date
                      </span> -->

                    </div>

                    <!-- neuron id -->
                    <div class="">

                      <span class="small"><span class="fw-bold">Neuron ID:</span> &hellip;xxxxxxxxxxxxxxx</span>

                      <!-- {{ neuron.idHex }} -->
                      <!-- <span class="">
                        neuron id hex
                      </span> -->

                      <!-- copy neuron id button -->
                      <button class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                              title="Copy neuron id">
                        <i class="fa fa-regular fa-copy"></i>
                      </button>

                    </div>                    

                  </div>
                  
                  <!-- permissions section -->
                  <!-- v-if="neuron.permissions && neuron.permissions.length > 0"  -->
                  <div class="d-flex flex-column gap-2 mt-3">

                    <!-- permissions header -->
                    <span class="">

                      <i class="fa fa-key me-2"></i>
                      
                      <!-- {{ neuron.permissions.length }} -->
                      <span>Permissions <span class="small">(X)</span></span>

                    </span>

                    <!-- v-for="permission in neuron.permissions"  -->
                    <!-- :key="permission.principal" -->
                    <!-- :class="{ 'current-user': permission.isCurrentUser }" -->
                    <div class="neuron-info-section">

                      <div class="">

                        <!-- :title="permission.principal" -->
                        <!-- {{ permission.principalShort }} -->
                        <span class="small" 
                              >
                          <span class="fw-bold">Principal:</span> You
                        </span>

                        <!-- v-if="permission.isCurrentUser" -->
                        <!-- <span  class="user-badge">

                          <i class="fa fa-user"></i> You

                        </span> -->

                      </div>

                      <div class="">

                        <!-- v-for="permName in permission.permissionNames"  -->
                        <!-- :key="permName" -->
                        <!-- {{ permName }} -->
                        <span 
                              
                              class="small">
                          <span class="fw-bold">Permission:</span> permission name
                        </span>

                      </div>

                    </div>

                  </div>
                  
                  <!-- followings section -->
                  <!-- v-if="neuron.followings && neuron.followings.length > 0"  -->
                  <div class="d-flex flex-column gap-2 mt-3">

                    <!-- followings header -->
                    <span class="">

                      <!-- {{ neuron.followings.reduce((acc: number, f: any) => acc + f.followedCount, 0) }} -->
                      <span><i class="fa-solid fa-person-walking"></i> Following <span class="small">(X)</span></span>

                    </span>

                    <!-- v-for="following in neuron.followings"  -->
                    <!-- :key="following.functionId" -->
                    <div 
                        
                        class="neuron-info-section">

                      <div class="d-flex align-items-center gap-2">

                        <!-- {{ following.functionName }} -->
                        <span class="fw-bold small">Motion <span class="small fw-normal">(x)</span></span>

                        <!-- {{ following.followedCount }} -->
                        <!-- <span class="">(x)</span> -->

                        <!-- add to following button -->
                        <button class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                                title="Add to following">
                          <i class="fa fa-plus"></i>
                        </button>

                      </div>

                      <div class="">

                        <!-- v-for="followedNeuron in following.followedNeurons" 
                              :key="followedNeuron.idHex"
                              :title="followedNeuron.idHex" -->
                              <!-- followedNeuron.idShort -->
                        <div
                              class="d-flex align-items-center gap-2">
                          
                              <span class="small"><span class="fw-bold">Following:</span> &hellip;xxxxxxxxxxxxxxx</span>

                          <!-- unfollow button -->
                          <button class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                                  title="Unfollow">
                            <i class="fa fa-times"></i>
                          </button>

                        </div>

                      </div>

                    </div>
                    
                  </div>

                </div>

              </div>

            </div>

            <!-- neurons hotkeyed -->
            <!-- v-if="categorizedNeurons.hotkeyed.length > 0" class="token-card__neurons__section" -->
            <div class="token-card__neurons__hotkeyed">

              <!-- neurons hotkeyed header -->
              <div>

                <i class="fa fa-key me-2"></i>

                <!-- {{ categorizedNeurons.hotkeyed.length }} -->
                <span class="section-title">Hotkeyed (X)</span>

              </div>

              <!-- neurons hotkeyed list -->
              <div class="token-card__neurons__list">

                <!-- neuron hotkeyed -->
                <!-- v-for="neuron in categorizedNeurons.hotkeyed" 
                  :key="neuron.idHex" -->
                <div 
                  
                  class="neuron-item hotkeyed"
                >

                <!-- @click="toggleNeuronExpansion(neuron.idHex)" -->
                  <div class="neuron-header" >

                    <div class="neuron-info">

                      <div class="neuron-name">

                        <!-- :class="expandedNeurons.has(neuron.idHex) ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" -->
                        <i 
                          
                          class="expand-icon"
                        ></i>

                        <!-- {{ neuron.displayName }} -->
                        <span class="">neuron display name</span>

                        <!-- v-if="getNeuronRewards(neuron.idHex) > 0" -->
                        <span  
                              class="neuron-rewards-indicator" 
                              title="Has rewards">

                          <i class="fa fa-coins text-success"></i>

                        </span>

                      </div>

                      <!-- {{ formatBalance(neuron.stake, 8) }} -->
                      <div class="neuron-stake">
                        X TACO
                      </div>

                    </div>

                    <!-- @click.stop="$emit('stake-to-neuron', neuron)" -->
                    <button 
                      
                      class="btn btn-primary btn-sm"
                      title="Stake to this neuron"
                    >

                      <i class="fa fa-plus"></i>

                    </button>

                  </div>
                  
                  <!-- Expanded details -->
                  <!-- v-if="expandedNeurons.has(neuron.idHex)"  -->
                  <div class="neuron-details">

                    <div class="detail-grid">

                      <!-- :class="{ 'has-rewards': getNeuronRewards(neuron.idHex) > 0 }" -->
                      <div class="detail-item rewards-item">

                        <span class="detail-label">

                          <i class="fa fa-coins me-1"></i>

                          Rewards:

                        </span>

                        <!-- v-if="getNeuronRewards(neuron.idHex) > 0" -->
                        <span class="detail-value text-success">

                          <!-- {{ formatBalance(BigInt(Math.floor(getNeuronRewards(neuron.idHex))), 8) }} -->
                          X TACO

                          <!-- @click.stop="claimNeuronRewards(neuron)" -->
                          <!-- :disabled="loadingRewards || isNeuronClaiming(neuron.idHex)" -->
                          <button 
                            
                            class="btn btn-success btn-xs ms-2"
                            
                            title="Claim this neuron's rewards"
                          >

                          <!-- v-if="isNeuronClaiming(neuron.idHex)" -->
                            <i  class="fa fa-spinner fa-spin"></i>

                            <!-- v-else -->
                            <i  class="fa fa-coins"></i>

                          </button>

                        </span>

                        <!-- v-else class="detail-value text-muted" -->
                        <span >
                          0 TACO
                        </span>

                      </div>
                      
                      <div class="detail-item">

                        <span class="detail-label">Dissolve Period:</span>

                        <!-- :class="'dissolve-' + neuron.dissolveState.type" -->
                        <span class="detail-value" >
                          <!-- {{ neuron.dissolveState.display }} -->
                          dissolve state display
                        </span>

                      </div>

                      <div class="detail-item">

                        <span class="detail-label">Age:</span>

                        <span class="detail-value">
                          <!-- {{ neuron.age }} -->
                          neuron age
                        </span>

                      </div>

                      <div class="detail-item">

                        <span class="detail-label">Maturity:</span>

                        <span class="detail-value">
                          <!-- {{ formatBalance(neuron.maturity, 8) }} -->
                          X TACO
                        </span>

                      </div>

                      <!-- v-if="neuron.stakedMaturity > 0"  -->
                      <div class="detail-item">

                        <span class="detail-label">Staked Maturity:</span>

                        <span class="detail-value">
                          <!-- {{ formatBalance(neuron.stakedMaturity, 8) }} -->
                          X TACO
                        </span>

                      </div>

                      <div class="detail-item">

                        <span class="detail-label">Voting Power:</span>

                        <span class="detail-value">
                          <!-- {{ neuron.votingPowerMultiplier }}% -->
                          X%
                        </span>

                      </div>

                      <div class="detail-item">

                        <span class="detail-label">Auto-stake:</span>

                        <span class="detail-value">

                          <!-- :class="neuron.autoStakeMaturity ? 'fa fa-check text-success' : 'fa fa-times text-muted'" -->
                          <i class="fa fa-check"></i>
                          <!-- {{ neuron.autoStakeMaturity ? 'Enabled' : 'Disabled' }} -->
                          Enabled
                        </span>

                      </div>

                      <div class="detail-item">

                        <span class="detail-label">Created:</span>

                        <span class="detail-value">
                          <!-- {{ neuron.createdDate.toLocaleDateString() }} -->
                          created date
                        </span>

                      </div>

                      <div class="detail-item">

                        <span class="detail-label">Neuron ID:</span>

                        <span class="detail-value neuron-id">
                          <!-- {{ neuron.idHex }} -->
                          neuron id hex
                        </span>

                      </div>

                    </div>
                    
                    <!-- Permissions Section -->
                    <!-- v-if="neuron.permissions && neuron.permissions.length > 0" -->
                    <div  class="detail-section">

                      <h6 class="section-title">

                        <i class="fa fa-key me-2"></i>

                        <!-- {{ neuron.permissions.length }} -->

                        <span>perm length</span>

                      </h6>

                      <div class="permissions-list">

                        <!-- v-for="permission in neuron.permissions" 
                          :key="permission.principal" -->
                          <!-- :class="{ 'current-user': permission.isCurrentUser }" -->
                        <div 
                          
                          class="permission-item"
                          
                        >

                          <div class="permission-principal">

                            <!-- :title="permission.principal" -->
                            <span class="principal-text" >

                              <!-- {{ permission.principalShort }} -->
                              principal short

                            </span>

                            <!-- v-if="permission.isCurrentUser" -->
                            <span  class="user-badge">

                              <i class="fa fa-user"></i> You

                            </span>

                          </div>

                          <div class="permission-types">

                            <!-- v-for="permName in permission.permissionNames" 
                              :key="permName" -->
                            <span 
                              
                              class="permission-badge"
                            >
                              <!-- {{ permName }} -->
                              perm name
                            </span>

                          </div>
                          
                        </div>
                        
                      </div>
                      
                    </div>
                    
                    <!-- Followings Section -->
                    <!-- v-if="neuron.followings && neuron.followings.length > 0" -->
                    <div  class="detail-section">

                      <h6 class="section-title">

                        <i class="fa fa-users me-2"></i>

                        <!-- {{ neuron.followings.reduce((acc: number, f: any) => acc + f.followedCount, 0) }} -->
                        <span>Following (X neurons)</span>

                      </h6>

                      <div class="followings-list">

                        <!-- v-for="following in neuron.followings" 
                          :key="following.functionId" -->
                        <div 
                          
                          class="following-item"
                        >

                          <div class="following-function">

                            <span class="function-name">
                              <!-- {{ following.functionName }} -->
                              following function name
                            </span>

                            <span class="function-count">
                              <!-- {{ following.followedCount }}) -->
                              (x)
                            </span>

                          </div>

                          <div class="followed-neurons">

                            <!-- v-for="followedNeuron in following.followedNeurons" 
                              :key="followedNeuron.idHex" -->
                              <!-- :title="followedNeuron.idHex" -->
                            <span 

                              
                              class="followed-neuron"
                              
                            >

                              <!-- {{ followedNeuron.idShort }} -->
                              followed neuron id short
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>



    <!-- right -->
    <div>

      <!-- send, swap, and fee -->
      <div class="d-flex flex-column gap-2">

        <!-- actions -->
        <div class="d-flex gap-2">

          <!-- send button -->
          <button @click="$emit('send', token)"
                  class="btn taco-btn taco-btn--green px-3 py-1"
                  :disabled="token.balance <= token.fee">

            <!-- icon -->
            <i class="fa fa-paper-plane me-1"></i>

            <!-- text -->
            <span>Send</span>

          </button>

          <!-- swap button -->
          <button @click="$emit('swap', token)"
                  class="btn taco-btn taco-btn--green px-3 py-1">

            <!-- icon -->
            <i class="fa fa-exchange-alt me-1"></i>

            <!-- text -->
            <span>Swap</span>

          </button>

        </div>

        <!-- fee -->
        <div class="d-flex justify-content-center">

          <!-- fee -->
          <span class="small">Fee: {{ formatBalance(token.fee, token.decimals) }} {{ token.symbol }}</span>

        </div>

      </div>

    </div>



  </div>

</template>

<style scoped lang="scss">

.token-card {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  background-color: var(--dark-brown);
  gap: 1rem;

  // logo
  &__logo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  // symbol
  &__symbol {
    font-size: 1.25rem;
    font-weight: bold;
    line-height: 1;
  }

  // name
  &__name {
    font-size: 0.875rem;
    line-height: 1;
  }

  // balance
  &__balance {
    font-size: 1.25rem;
    font-weight: bold;
    line-height: 1;
  }

  // usd value
  &__usd-value {
    font-size: 0.875rem;
    line-height: 1;
    white-space: nowrap;
  }

  // action button
  &__action-btn {
    background-color: var(--light-brown);
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1;
    white-space: nowrap;
    padding: 0.25rem 0.4rem;

    // icon
    i {
      color: var(--black-to-white);
    }

  }

  // neurons
  &__neurons {

    // list
    &__list {
      background-color: var(--brown);
      padding: 1rem;
      border-radius: 0.5rem;
    }

    // neuron
    &__neuron {
      background-color: var(--light-brown);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--dark-orange);
    }
    
  }

}

.neuron-info-section {
  > div {
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px solid var(--dark-orange);
    border-left: 1px solid var(--dark-orange);
    border-right: 1px solid var(--dark-orange);

    &:hover {
      background-color: var(--dark-orange);
    }

    &:first-of-type {
      border-top: 1px solid var(--dark-orange);
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
    }

    &:last-of-type {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
    
  }

}

</style>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { getLegacyAccountId } from '../../utils/accountUtils'
import { useClipboard } from '@vueuse/core'

interface TokenCardProps {
  token: {
    principal: string
    name: string
    symbol: string
    logo: string
    balance: bigint
    decimals: number
    fee: bigint
    priceUSD?: number
    isRegistered?: boolean
  }
  showRegisterButton?: boolean
}

interface TokenCardEmits {
  (e: 'send', token: TokenCardProps['token']): void
  (e: 'swap', token: TokenCardProps['token']): void
  (e: 'register', token: TokenCardProps['token']): void
  (e: 'unregister', token: TokenCardProps['token']): void
  (e: 'stake-to-neuron', neuron: any): void
  (e: 'create-neuron'): void
  (e: 'set-dissolve', neuron: any): void
}

const props = withDefaults(defineProps<TokenCardProps>(), {
  showRegisterButton: true
})

defineEmits<TokenCardEmits>()

// Taco store for neuron operations
const tacoStore = useTacoStore()

// Clipboard functionality
const { copy } = useClipboard()

// ICP Account ID computation
const icpAccountId = computed(() => {
  if (props.token.symbol === 'ICP' && tacoStore.userLoggedIn && tacoStore.userPrincipal) {
    return getLegacyAccountId(tacoStore.userPrincipal)
  }
  return { hex: '', dashed: '' }
})

// Copy to clipboard function
const copyToClipboard = async (text: string) => {
  try {
    await copy(text)
    tacoStore.addToast({
      id: Date.now(),
      code: 'copy-success',
      title: 'Copied!',
      icon: 'fa-solid fa-check',
      message: 'Account ID copied to clipboard'
    })
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    tacoStore.addToast({
      id: Date.now() + 1,
      code: 'copy-error',
      title: 'Copy Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to copy to clipboard'
    })
  }
}

// Neurons state
const neurons = ref<any[]>([])
const loadingNeurons = ref(false)
const categorizedNeurons = ref<{owned: any[], hotkeyed: any[], all: any[]}>({owned: [], hotkeyed: [], all: []})
const expandedNeurons = ref<Set<string>>(new Set())
const neuronsExpanded = ref(false) // Default to collapsed

// Rewards state
const neuronBalances = ref<Map<string, number>>(new Map())
const loadingRewards = ref(false)
const claimingAllRewards = ref(false)
const claimingNeurons = ref<Set<string>>(new Set())

// Load neurons for TACO token
const loadNeurons = async () => {
  if (!tacoStore.userLoggedIn || props.token.symbol !== 'TACO') {
    return
  }
  
  loadingNeurons.value = true
  try {
    const rawNeurons = await tacoStore.getTacoNeurons()
    categorizedNeurons.value = tacoStore.categorizeNeurons(rawNeurons)
    neurons.value = categorizedNeurons.value.all // Keep for backward compatibility
    
    // Load rewards after neurons are loaded
    await loadRewards()
  } catch (error) {
    console.error('Error loading neurons:', error)
    neurons.value = []
    categorizedNeurons.value = {owned: [], hotkeyed: [], all: []}
  } finally {
    loadingNeurons.value = false
  }
}

// Toggle neuron expansion
const toggleNeuronExpansion = (neuronId: string) => {
  if (expandedNeurons.value.has(neuronId)) {
    expandedNeurons.value.delete(neuronId)
  } else {
    expandedNeurons.value.add(neuronId)
  }
}

// Toggle neurons section expansion
const toggleNeuronsSection = () => {
  neuronsExpanded.value = !neuronsExpanded.value
}

// Computed rewards properties
const totalRewards = computed(() => {
  let total = 0
  for (const balance of neuronBalances.value.values()) {
    total += balance
  }
  return total
})

// Watch totalRewards to auto-expand rewards section when there are rewards
watch(totalRewards, (newTotal) => {
  if (newTotal > 0 && !rewardsExpanded.value) {
    rewardsExpanded.value = true
  }
}, { immediate: true })

// Rewards functions
const getNeuronRewards = (neuronIdHex: string): number => {
  return neuronBalances.value.get(neuronIdHex) || 0
}

const isNeuronClaiming = (neuronIdHex: string): boolean => {
  return claimingNeurons.value.has(neuronIdHex)
}

const claimNeuronRewards = async (neuron: any) => {
  if (!tacoStore.userLoggedIn) return
  
  claimingNeurons.value.add(neuron.idHex)
  try {
    // For categorized neurons, neuron.id is already a Uint8Array
    if (!neuron.id || !(neuron.id instanceof Uint8Array)) {
      throw new Error('Invalid neuron ID format - expected Uint8Array')
    }
    
    console.log('Claiming rewards for neuron:', neuron.idHex, 'with ID:', neuron.id)
    
    // Call the real claim function with the neuron ID
    const success = await tacoStore.claimNeuronRewards([neuron.id])
    
    if (success) {
      // Update the neuron balance to 0 after successful claim
      neuronBalances.value.set(neuron.idHex, 0)
      
      // Reload rewards to get updated balances
      await loadRewards()
    }
  } catch (error) {
    console.error('Error claiming neuron rewards:', error)
    tacoStore.addToast({
      id: Date.now() + 1,
      code: 'claim-error',
      title: 'Claim Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to claim neuron rewards: ' + (error as Error).message
    })
  } finally {
    claimingNeurons.value.delete(neuron.idHex)
  }
}

const claimAllRewards = async () => {
  if (!tacoStore.userLoggedIn || totalRewards.value <= 0) return
  
  claimingAllRewards.value = true
  try {
    // Use the real claim all function from taco store
    const success = await tacoStore.claimAllNeuronRewards(categorizedNeurons.value.all)
    
    if (success) {
      // Clear all neuron balances after successful claim
      neuronBalances.value.clear()
      
      // Reload rewards to get updated balances
      await loadRewards()
    }
  } catch (error) {
    console.error('Error claiming all rewards:', error)
    tacoStore.addToast({
      id: Date.now() + 1,
      code: 'claim-all-error',
      title: 'Claim Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to claim all rewards: ' + (error as Error).message
    })
  } finally {
    claimingAllRewards.value = false
  }
}

const loadRewards = async () => {
  if (!tacoStore.userLoggedIn || props.token.symbol !== 'TACO') {
    return
  }
  
  loadingRewards.value = true
  try {
    // Use the same approach as RewardsView - work with raw neurons directly
    const rawNeurons = await tacoStore.getTacoNeurons()
    console.log('Raw neurons for rewards:', rawNeurons)
    
    // Load real rewards data from taco store using raw neurons
    const rewardsMap = await tacoStore.loadNeuronRewardBalances(rawNeurons)
    console.log('Rewards map from store:', rewardsMap)
    
    // Convert the rewards map to use neuron hex IDs as keys for the categorized neurons
    const neuronRewards = new Map<string, number>()
    for (const neuron of categorizedNeurons.value.all) {
      if (neuron.idHex) {
        const balance = rewardsMap.get(neuron.idHex) || 0
        neuronRewards.set(neuron.idHex, balance)
        console.log(`Neuron ${neuron.idHex}: ${balance} rewards`)
      }
    }
    
    neuronBalances.value = neuronRewards
    console.log('Final neuron balances:', neuronBalances.value)
  } catch (error) {
    console.error('Error loading rewards:', error)
  } finally {
    loadingRewards.value = false
  }
}

// Auto-load neurons and rewards on mount for TACO token
onMounted(() => {
  if (props.token.symbol === 'TACO' && tacoStore.userLoggedIn) {
    loadNeurons() // This already calls loadRewards() after loading neurons
  }
})

const formatBalance = (balance: bigint, decimals: number): string => {
  const divisor = BigInt(10 ** decimals)
  const wholePart = balance / divisor
  const fractionalPart = balance % divisor
  
  if (fractionalPart === 0n) {
    return wholePart.toString()
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmedFractional = fractionalStr.replace(/0+$/, '')
  
  if (trimmedFractional === '') {
    return wholePart.toString()
  }
  
  return `${wholePart}.${trimmedFractional}`
}

const formatUSDValue = (balance: bigint, decimals: number, priceUSD: number): string => {
  const balanceNum = Number(balance) / (10 ** decimals)
  const usdValue = balanceNum * priceUSD
  
  if (usdValue < 0.01) {
    return '< 0.01'
  }
  
  return usdValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>