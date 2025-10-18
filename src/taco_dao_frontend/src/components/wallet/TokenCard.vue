<template>

  <div class="token-card shadow">
    
    <!-- token card non-neuron content -->
    <div class="d-flex flex-wrap justify-content-between w-100 gap-4-2">

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
              <button  @click="dismissTooltips(); copyToClipboard(icpAccountId.hex)"
                      class="btn taco-btn taco-btn--green ms-1"
                      style="padding: 0.675rem 0.5rem;"
                      data-bs-toggle="tooltip"
                      data-bs-placement="bottom"
                      data-bs-custom-class="taco-tooltip"
                      title="Copy ICP account id">

                <!-- icon -->
                <i class="fa fa-sm fa-regular fa-copy"></i>

              </button>

              <!-- QR code button -->
              <button @click="dismissTooltips(); showQRCode(icpAccountId.hex, 'ICP Account ID')"
                      class="btn taco-btn taco-btn--green ms-1"
                      style="padding: 0.675rem 0.5rem;"
                      data-bs-toggle="tooltip"
                      data-bs-placement="bottom"
                      data-bs-custom-class="taco-tooltip"
                      title="Show QR code for ICP account id">

                <!-- icon -->
                <i class="fa fa-sm fa-qrcode"></i>

              </button>

            </div>        

          </div>

        </div>

        <!-- rewards (taco) -->
        <div v-if="token.symbol === 'TACO'" 
            class="d-flex flex-column gap-1">

          <!-- rewards header -->
          <div class="d-flex align-items-center gap-2">

            <!-- rewards header title -->
            <div class="d-flex flex-column gap-2">

              <!-- rewards header content -->
              <div class="d-flex align-items-center gap-2">

                <!-- rewards icon -->
                <i class="fa fa-coins"></i>

                <!-- rewards title text -->
                <span>Rewards</span>

                <!-- rewards loading -->
                <span v-if="loadingRewards">
                  Loading...
                </span>

                <!-- rewards balance -->
                <span v-if="totalRewards > 0 && !loadingRewards">
                  {{ formatBalance(BigInt(Math.floor(totalRewards)), 8) }} TACO
                </span>

                <!-- empty rewards balance -->
                <span v-if="totalRewards === 0 && !loadingRewards">(0)</span>

              </div>

              <!-- rewards buttons -->
              <div v-if="totalRewards > 0 && !loadingRewards"
                   class="d-flex flex-wrap gap-2">

                <!-- claim some -->
                <button @click="toggleNeuronsSection"
                        class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                        :disabled="loadingRewards || claimingAllRewards"
                        title="Claim some rewards">
                  Claim Some
                </button>            

                <!-- claim all -->
                <button @click="claimAllRewards"
                        class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                        :disabled="loadingRewards || claimingAllRewards"
                        title="Claim all rewards">
                  Claim All
                </button>

              </div>

            </div>

          </div>

        </div>
        
        <!-- neurons (taco) -->
        <div v-if="token.symbol === 'TACO'" 
            class="token-card__neurons flex-grow-1">

          <!-- neurons header -->
          <div class="d-flex flex-column gap-2">

            <!-- neurons header title -->
            <div class="d-flex align-items-center gap-2">

              <!-- expand icon -->
              <i @click="toggleNeuronsSection"
                 :class="neuronsExpanded ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" 
                 style="min-width: 1rem; cursor: pointer;"></i>

              <!-- neurons icon -->
              <i @click="toggleNeuronsSection" class="fa fa-brain"></i>

              <!-- neurons title text -->
              <span @click="toggleNeuronsSection">Neurons</span>

              <!-- neurons loading -->
              <span v-if="loadingNeurons">
                Loading...
              </span>

              <!-- neurons count -->
              <span v-if="(categorizedNeurons.owned.filter(n => n.stake > 0n).length + categorizedNeurons.hotkeyed.filter(n => n.stake > 0n).length) > 0 && !loadingNeurons"
                    @click="toggleNeuronsSection"
                    class="small">
                ({{ categorizedNeurons.owned.filter(n => n.stake > 0n).length + categorizedNeurons.hotkeyed.filter(n => n.stake > 0n).length }})
              </span>

              <!-- empty neurons count -->
              <span v-if="(categorizedNeurons.owned.filter(n => n.stake > 0n).length + categorizedNeurons.hotkeyed.filter(n => n.stake > 0n).length) === 0 && !loadingNeurons"
                    class="small">
                (0)
              </span>

            </div>

            <!-- neurons buttons -->
            <div v-if="!loadingNeurons"
                 class="d-flex flex-wrap gap-2">

              <!-- show neurons button -->
              <button @click="toggleNeuronsSection"
                      class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                      title="Show neurons">

                <!-- text -->
                <span v-if="!neuronsExpanded">Show Details</span>
                <span v-if="neuronsExpanded">Hide Details</span>

              </button>

              <!-- create neuron button -->
              <button @click="$emit('create-neuron')"
                      class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                      title="Create new neuron">
                
                <!-- text -->
                <span>Create</span>

              </button>   
              
              <!-- hotkey neuron button -->
              <a href="https://nns.ic0.app/neurons/?u=lacdn-3iaaa-aaaaq-aae3a-cai"
                 target="_blank"
                 class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                 title="Hotkey neuron">
                
                <!-- text -->
                <span>Hotkey</span>

            </a>
              
              <!-- refresh neurons button -->
              <button @click="loadNeurons"
                      class="btn btn-sm taco-btn taco-btn--green px-2 py-1"
                      :disabled="loadingNeurons">

                <!-- icon -->
                <i class="fa fa-refresh"></i>

              </button>

            </div>

          </div>

        </div>

      </div>

      <!-- right -->
      <div class="ms-auto">

        <!-- send, swap, and fee -->
        <div class="d-flex flex-column gap-2">

          <!-- actions -->
          <div class="d-flex gap-2">

            <!-- swap button -->
            <button @click="$emit('swap', token)"
                    class="btn taco-btn taco-btn--green px-3 py-1">

              <!-- icon -->
              <i class="fa fa-exchange-alt me-1"></i>

              <!-- text -->
              <span>Swap</span>

            </button>            

            <!-- send button -->
            <button @click="$emit('send', token)"
                    class="btn taco-btn taco-btn--green px-3 py-1"
                    :disabled="token.balance <= token.fee">

              <!-- icon -->
              <i class="fa fa-paper-plane me-1"></i>

              <!-- text -->
              <span>Send</span>

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
      
    <!-- neurons sections -->
    <div v-if="neuronsExpanded" class="d-flex flex-column gap-3 w-100">

      <!-- neurons owned -->
      <div class="d-flex flex-column gap-2 flex-grow-1">

        <!-- neurons owned header -->
        <span class="ps-2" style="font-size: 1.25rem;">
          🌮 TacoDao.com Neurons <span class="small">({{ categorizedNeurons.owned.length }})</span>
        </span>

        <!-- neurons owned list -->
        <div class="token-card__neurons__list">

          <!-- neuron owned -->
          <div v-for="neuron in categorizedNeurons.owned.filter(n => n.stake > 0n)" :key="neuron.idHex"
                class="token-card__neurons__neuron
                      d-flex flex-column shadow">

            <!-- neuron name, icon, and rewards indicator -->
            <div class="d-flex align-items-center justify-content-between gap-2 mb-3">

              <!-- neuron name and icon -->
              <span class="d-flex align-items-center gap-2">

                <!-- icon -->
                <i class="fa fa-brain"></i>

                <!-- neuron name -->
                <span style="font-size: 1.25rem; word-break: break-all;">{{ neuron.displayName }}</span>
                
              </span>

              <!-- rewards indicator -->
              <span v-if="getNeuronRewards(neuron.idHex) > 0"
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
              <div>

                <!-- neuron stake -->
                <div class="small">

                  <!-- to local string, max 2 decimal places -->
                  <span class="fw-bold">Staked: </span>

                  <!-- neuron stake value -->
                  <span>
                    {{ Number(formatBalance(neuron.stake, 8)).toLocaleString('en-US', { maximumFractionDigits: 2 }) }} TACO
                  </span>
                </div>

                <!-- neuron stake actions -->
                <div class="d-flex gap-2">

                  <!-- stake to neuron button -->
                  <button @click.stop="$emit('stake-to-neuron', neuron); dismissTooltips()"
                          class="btn btn-sm taco-btn taco-btn--green p-1"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          data-bs-custom-class="taco-tooltip"
                          title="Add to stake">

                    <!-- icon -->
                    <i class="fa fa-fw fa-plus"></i>

                  </button>

                  <!-- disburse neuron button -->
                  <button v-if="neuron.dissolveState.type === 'dissolved' || (neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds === 0)"
                          @click.stop="localDisburseNeuron(neuron.id); dismissTooltips()"
                          class="btn btn-sm taco-btn taco-btn--green p-1"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          data-bs-custom-class="taco-tooltip"
                          title="Disburse neuron to wallet">

                    <!-- icon -->
                    <i class="fa fa-fw fa-coins"></i>

                  </button>

                </div>

              </div>

              <!-- neuron rewards -->
              <div>

                <!-- detail label -->
                <span class="small"><span class="fw-bold">Rewards:</span> {{ formatBalance(BigInt(Math.floor(getNeuronRewards(neuron.idHex))), 8) }} TACO</span>

                <!-- claim rewards button -->
                <button v-if="getNeuronRewards(neuron.idHex) > 0"
                        @click.stop="claimNeuronRewards(neuron)"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        style="padding-top: 0.25rem; padding-bottom: 0.25rem;"
                        :disabled="loadingRewards || isNeuronClaiming(neuron.idHex)">
                  
                        <!-- tokens icon -->
                  <i class="fa fa-fw fa-coins"></i>

                </button>

              </div>

              <!-- dissolve state -->
              <div>
                <span class="small">
                  <span class="fw-bold">Dissolve State: </span>
                  <span v-if="neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds > 0">Not Dissolving</span>
                  <span v-else-if="neuron.dissolveState.type === 'dissolving'">Dissolving</span>
                  <span v-else>Dissolved</span>
                </span>

                <!-- start dissolving button -->
                <button v-if="neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds > 0" @click.stop="dismissTooltips(); startDissolving(neuron.id)"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        title="Start dissolving">

                  <!-- check icon -->
                  <i class="fa fa-fw fa-check"></i>

                </button>

                <!-- stop dissolving button -->
                <button v-if="neuron.dissolveState.type === 'dissolving'" @click.stop="dismissTooltips(); stopDissolving(neuron.id)"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        title="Stop dissolving">

                  <!-- x icon -->
                  <i class="fa fa-fw fa-xmark"></i>

                </button>

              </div>
              
              <!-- neuron dissolve period -->
              <div>
                <span class="small">
                  <span class="fw-bold">Dissolve Period: </span>
                  <span v-if="neuron.dissolveState.type === 'dissolved' || neuron.dissolveState.type === 'none' || (neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds === 0)">None</span>
                  <span v-else-if="neuron.dissolveState.type === 'dissolving'">{{ neuron.dissolveState.display.slice(14) }}</span>
                  <span v-else>{{ neuron.dissolveState.display }}</span>
                </span>

                <!-- set dissolve period button -->
                <button @click.stop="dismissTooltips(); $emit('set-dissolve', neuron)"
                      class="btn btn-sm taco-btn taco-btn--green p-1"
                      data-bs-toggle="tooltip"
                      data-bs-placement="bottom"
                      data-bs-custom-class="taco-tooltip"
                      title="Modify dissolve period">

                  <!-- icon -->
                  <i class="fa fa-regular fa-fw fa-clock"></i>

                </button>

              </div>

              <!-- neuron age -->
              <div>

                <span class="small"><span class="fw-bold">Age:</span> {{ neuron.age }}</span>

              </div>

              <!-- neuron created -->
              <div>

                <span class="small"><span class="fw-bold">Created:</span> {{ neuron.createdDate.toLocaleDateString() }}</span>

              </div>

              <!-- neuron id -->
              <div>

                <!-- show ellipsis and first 8 characters -->
                <span class="small">
                  <span class="fw-bold">Neuron ID: </span>
                  <span data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        :title="neuron.idHex">
                        {{ neuron.idHex.slice(0, 8) }}&hellip;
                  </span>
                </span>

                <!-- copy neuron id button -->
                <button @click.stop="dismissTooltips(); copy(neuron.idHex); addToast({
                            id: Date.now(),
                            code: 'code',
                            tradeAmount: '',
                            tokenSellIdentifier: '',
                            tradeLimit: '',
                            tokenInitIdentifier: '',
                            title: '👨‍🍳 Principal Copied!',
                            icon: '',
                            message: `Neuron principal was copied to your clipboard`
                          })"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        title="Copy neuron id">

                  <!-- icon -->
                  <i class="fa fa-regular fa-fw fa-copy"></i>

                </button>

              </div>                    

            </div>

          </div>

          <!-- add a neuron -->
          <div class="token-card__neurons__add-neuron-card
                      d-flex flex-column align-items-center justify-content-center"
              @click="$emit('create-neuron')">

            <!-- taco -->
            <span style="font-size: 2rem;">🌮</span>

            <!-- add a neuron -->
            <span class="text-center">Create a New Neuron</span>

          </div>

        </div>

      </div>

      <!-- neurons hotkeyed -->
      <div class="d-flex flex-column gap-2 flex-grow-1">

        <!--neurons hotkeyed header -->
        <span class="ps-2" style="font-size: 1.25rem;">
          <i class="fa fa-key"></i> Hotkeyed NNS Neurons <span class="small">({{ categorizedNeurons.hotkeyed.length }})</span>
        </span>

        <!-- neurons hotkeyed list -->
        <div class="token-card__neurons__list">

          <!-- neuron hotkeyed -->
          <div v-for="neuron in categorizedNeurons.hotkeyed.filter(n => n.stake > 0n)" 
              :key="neuron.idHex"
              class="token-card__neurons__neuron
                      d-flex flex-column shadow">

            <!-- neuron name, icon, and rewards indicator -->
            <div class="d-flex align-items-center justify-content-between gap-2 mb-3">

              <!-- neuron name and icon -->
              <span class="d-flex align-items-center gap-2">

                <!-- icon -->
                <i class="fa fa-brain"></i>

                <!-- neuron name -->
                <span style="font-size: 1.25rem; word-break: break-all;">{{ neuron.displayName }}</span>
                
              </span>

              <!-- rewards indicator -->
              <span v-if="getNeuronRewards(neuron.idHex) > 0"
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
              <div>

                <!-- neuron stake -->
                <div class="small">

                  <!-- to local string, max 2 decimal places -->
                  <span class="fw-bold">Staked: </span>

                  <!-- neuron stake value -->
                  <span>{{ Number(formatBalance(neuron.stake, 8)).toLocaleString('en-US', { maximumFractionDigits: 2 }) }} TACO</span>

                </div>

                <!-- neuron stake actions -->
                <div class="d-flex gap-2">

                  <!-- stake to neuron button -->
                  <button @click.stop="$emit('stake-to-neuron', neuron); dismissTooltips()"
                          class="btn btn-sm taco-btn taco-btn--green p-1"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          data-bs-custom-class="taco-tooltip"
                          title="Add to stake">

                    <!-- icon -->
                    <i class="fa fa-fw fa-plus"></i>

                  </button>

                  <!-- disburse neuron button -->
                  <button v-if="neuron.dissolveState.type === 'dissolved' || (neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds === 0)"
                          @click.stop="dismissTooltips()"
                          class="btn btn-sm taco-btn taco-btn--green p-1"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          data-bs-custom-class="taco-tooltip"
                          title="You must disburse this neuron from the NNS"
                          style="cursor: not-allowed; opacity: 0.5;">

                    <!-- icon -->
                    <i class="fa fa-fw fa-coins"></i>

                  </button>

                </div>

              </div>

              <!-- neuron rewards -->
              <div>

                <!-- detail label -->
                <span class="small"><span class="fw-bold">Rewards:</span> {{ formatBalance(BigInt(Math.floor(getNeuronRewards(neuron.idHex))), 8) }} TACO</span>

                <!-- claim rewards button -->
                <button v-if="getNeuronRewards(neuron.idHex) > 0"
                        @click.stop="claimNeuronRewards(neuron)"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        style="padding-top: 0.25rem; padding-bottom: 0.25rem;"
                        :disabled="loadingRewards || isNeuronClaiming(neuron.idHex)">
                  
                        <!-- tokens icon -->
                        <i class="fa fa-fw fa-coins"></i>

                </button>

              </div>

              <!-- dissolve state -->
              <div>
                <span class="small">
                  <span class="fw-bold">Dissolve State: </span>
                  <span v-if="neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds > 0">Not Dissolving</span>
                  <span v-else-if="neuron.dissolveState.type === 'dissolving'">Dissolving</span>
                  <span v-else>Dissolved</span>
                </span>

                <!-- stop dissolving button -->
                <button v-if="neuron.dissolveState.type === 'dissolving'" @click.stop="dismissTooltips();"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        title="You must stop dissolving from the NNS"
                        style="cursor: not-allowed; opacity: 0.5;">

                  <!-- x icon -->
                  <i class="fa fa-fw fa-xmark"></i>

                </button>

                <!-- start dissolving button -->
                <button v-if="neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds > 0" @click.stop="dismissTooltips();"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        title="You must start dissolving from the NNS"
                        style="cursor: not-allowed; opacity: 0.5;">

                  <!-- check icon -->
                  <i class="fa fa-fw fa-check"></i>

                </button>

              </div>
              
              <!-- neuron dissolve period -->
              <div>
                <span class="small">
                  <span class="fw-bold">Dissolve Period: </span>
                  <span v-if="neuron.dissolveState.type === 'dissolved' || neuron.dissolveState.type === 'none' || (neuron.dissolveState.type === 'delay' && neuron.dissolveState.seconds === 0)">None</span>
                  <span v-else-if="neuron.dissolveState.type === 'dissolving'">{{ neuron.dissolveState.display.slice(14) }}</span>
                  <span v-else>{{ neuron.dissolveState.display }}</span>
                </span>   

                <!-- set dissolve period button -->
                <button @click.stop="dismissTooltips();"
                      class="btn btn-sm taco-btn taco-btn--green p-1"
                      data-bs-toggle="tooltip"
                      data-bs-placement="bottom"
                      data-bs-custom-class="taco-tooltip"
                      title="You must modify the dissolve period from the NNS"
                      style="cursor: not-allowed; opacity: 0.5;"> 

                  <!-- icon -->
                  <i class="fa fa-regular fa-fw fa-clock"></i>

                </button>

              </div>

              <!-- neuron age -->
              <div>

                <span class="small"><span class="fw-bold">Age:</span> {{ neuron.age }}</span>

              </div>

              <!-- neuron created -->
              <div>

                <span class="small"><span class="fw-bold">Created:</span> {{ neuron.createdDate.toLocaleDateString() }}</span>

              </div>

              <!-- neuron id -->
              <div>

                <!-- show ellipsis and first 8 characters -->
                <span class="small">
                  <span class="fw-bold">Neuron ID: </span>
                  <span data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        :title="neuron.idHex">
                        {{ neuron.idHex.slice(0, 8) }}&hellip;
                  </span>
                </span>

                <!-- copy neuron id button -->
                <button @click.stop="dismissTooltips(); copy(neuron.idHex); addToast({
                            id: Date.now(),
                            code: 'code',
                            tradeAmount: '',
                            tokenSellIdentifier: '',
                            tradeLimit: '',
                            tokenInitIdentifier: '',
                            title: '👨‍🍳 Principal Copied!',
                            icon: '',
                            message: `Neuron principal was copied to your clipboard`
                          })"
                        class="btn btn-sm taco-btn taco-btn--green p-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-custom-class="taco-tooltip"
                        title="Copy neuron id">

                  <!-- icon -->
                  <i class="fa fa-regular fa-fw fa-copy"></i>

                </button>

              </div>                    

            </div>

          </div>

          <!-- add a neuron -->
          <a href="https://nns.ic0.app/neurons/?u=lacdn-3iaaa-aaaaq-aae3a-cai"
            target="_blank"
            class="token-card__neurons__add-neuron-card
                      d-flex flex-column align-items-center justify-content-center gap-1"
            style="color: var(--black-to-white); text-decoration: none;">

            <!-- taco -->
            <i class="fa fa-key"
                style="font-size: 2rem; color: var(--black-to-white) !important;"></i>

            <!-- add a neuron -->
            <span class="text-center" style="color: var(--black-to-white) !important;">Hotkey an NNS Neuron</span>

          </a>            

        </div>

      </div>

    </div>

  </div>

  <!-- QR Code Modal -->
  <QRCodeModal
    :show="qrModalShow"
    :address="qrModalAddress"
    :title="qrModalTitle"
    @close="closeQRModal"
  />

</template>

<style scoped lang="scss">

.token-card {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--dark-orange-to-dark-brown);
  border-radius: 0.5rem;
  background-color: var(--orange-to-dark-brown);
  gap: 1rem;

  h1, h2, h3, h4, h5, h6, span, i {
    color: var(--black-to-white);
  }

  button span,
  button i,
  a span,
  a i {
    color: var(--black) !important;
  }

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
    background-color: var(--dark-orange-to-light-brown);
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1;
    white-space: nowrap;
    padding: 0.25rem 0.4rem;

  }

  // neurons
  &__neurons {

    // list
    &__list {
      display: flex;
      flex-wrap: wrap;
      flex-grow: 1;
      gap: 1rem;
      background-color: var(--yellow-to-brown);
      border: 1px solid var(--dark-orange-to-dark-brown);
      padding: 1rem;
      border-radius: 0.5rem;
      width: 100%;
    }

    // neuron
    &__neuron {
      background-color: var(--orange-to-light-brown);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--dark-orange);
      width: 100%;
      max-width: 24.675rem;
      height: fit-content;
    }

    // add neuron card
    &__add-neuron-card {
      width: 100%;
      max-width: 24.675rem;
      min-height: 22rem;
      border: 1px dashed var(--dark-orange);
      border-radius: 0.5rem;
      cursor: pointer;
      padding: 0 2rem;

      &:hover {
        background-color: var(--orange-to-light-brown);
      }

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
    background-color: var(--light-orange-to-dark-brown);

    &:hover {
      background-color: var(--yellow-to-brown);
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
import { Tooltip } from 'bootstrap'
import QRCodeModal from '../misc/QRCodeModal.vue'

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
  (e: 'refresh-balances'): void
}

const props = withDefaults(defineProps<TokenCardProps>(), {
  showRegisterButton: true
})

const emit = defineEmits<TokenCardEmits>()

// Taco store for neuron operations
const tacoStore = useTacoStore()

// start dissolving
const startDissolving = async (neuronId: Uint8Array) => {

  // turn app loading on
  tacoStore.appLoadingOn()

  // log
  // console.log('Starting dissolving for neuron:', neuronId)
  await tacoStore.startDissolving(neuronId)

  // log
  // console.log('Dissolving started for neuron:', neuronId)

  // toast notification
  tacoStore.addToast({
    id: Date.now(),
    code: '',
    title: 'Dissolving Started',
    icon: 'fa-solid fa-check',
    message: 'Started dissolving neuron'
  })

  // load neurons
  loadNeurons()

  // turn app loading off
  tacoStore.appLoadingOff()

}

// stop dissolving
const stopDissolving = async (neuronId: Uint8Array) => {

  // turn app loading on
  tacoStore.appLoadingOn()

  // log
  // console.log('Stopping dissolving for neuron:', neuronId)
  await tacoStore.stopDissolving(neuronId)
  // log
  // console.log('Dissolving stopped for neuron:', neuronId)

  // toast notification
  tacoStore.addToast({
    id: Date.now(),
    code: '',
    title: 'Dissolving Stopped',
    icon: 'fa-solid fa-xmark',
    message: 'Stopped dissolving neuron'
  })

  // load neurons
  loadNeurons()

  // turn app loading off
  tacoStore.appLoadingOff()

}

// Clipboard functionality
const { copy } = useClipboard()

const { addToast } = tacoStore // not reactive

// disburse neuron
const localDisburseNeuron = async (neuronId: Uint8Array) => {

  // await disburse neuron
  const result = await tacoStore.disburseNeuron(neuronId)

  // load neurons
  loadNeurons()

  // refresh wallet balances via parent
  emit('refresh-balances')

  // it returns true
  if (result) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'disburse-success',
      title: 'Neuron Disbursed',
      icon: 'fa-solid fa-coins',
      message: 'Neuron disbursed successfully, the funds are now in your wallet'
    })
  }
  else {
    tacoStore.addToast({
      id: Date.now(),
      code: 'disburse-error',
      title: 'Neuron Disburse Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Neuron disburse failed, please try again'
    })
  }
}

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

// QR Modal state
const qrModalShow = ref(false)
const qrModalAddress = ref('')
const qrModalTitle = ref('')

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

    // turn app loading on
    tacoStore.appLoadingOn()

    // For categorized neurons, neuron.id is already a Uint8Array
    if (!neuron.id || !(neuron.id instanceof Uint8Array)) {
      throw new Error('Invalid neuron ID format - expected Uint8Array')
    }
    
    // console.log('Claiming rewards for neuron:', neuron.idHex, 'with ID:', neuron.id)
    
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

    // turn app loading off
    tacoStore.appLoadingOff()
  }
}

const claimAllRewards = async () => {
  if (!tacoStore.userLoggedIn || totalRewards.value <= 0) return
  
  claimingAllRewards.value = true
  try {

    // turn app loading on
    tacoStore.appLoadingOn()

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

    // turn app loading off
    tacoStore.appLoadingOff()
    
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
    // console.log('Raw neurons for rewards:', rawNeurons)
    
    // Load real rewards data from taco store using raw neurons
    const rewardsMap = await tacoStore.loadNeuronRewardBalances(rawNeurons)
    // console.log('Rewards map from store:', rewardsMap)
    
    // Convert the rewards map to use neuron hex IDs as keys for the categorized neurons
    const neuronRewards = new Map<string, number>()
    for (const neuron of categorizedNeurons.value.all) {
      if (neuron.idHex) {
        const balance = rewardsMap.get(neuron.idHex) || 0
        neuronRewards.set(neuron.idHex, balance)
        // console.log(`Neuron ${neuron.idHex}: ${balance} rewards`)
      }
    }
    
    neuronBalances.value = neuronRewards
    // console.log('Final neuron balances:', neuronBalances.value)
  } catch (error) {
    console.error('Error loading rewards:', error)
  } finally {
    loadingRewards.value = false
  }
}

// dismiss tooltips
const dismissTooltips = () => {
  const tooltipElements = document.querySelectorAll('.token-card [data-bs-toggle="tooltip"]')
  tooltipElements.forEach(element => {
    const tooltip = Tooltip.getInstance(element)
    if (tooltip) {
      tooltip.hide() // explicitly hide before disposal
      tooltip.dispose()
    }
  })
}

// QR Modal methods
const showQRCode = (address: string, title: string) => {
  qrModalAddress.value = address
  qrModalTitle.value = title
  qrModalShow.value = true
}

const closeQRModal = () => {
  qrModalShow.value = false
  qrModalAddress.value = ''
  qrModalTitle.value = ''
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

// expose to parent so wallet view can refresh neurons on demand
defineExpose({ loadNeurons })
</script>