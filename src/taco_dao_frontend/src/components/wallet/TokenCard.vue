<template>
  <div class="token-card">
    <div class="token-header">
      <div class="token-info">
        <img :src="token.logo" :alt="token.symbol" class="token-logo" />
        <div class="token-details">
          <h6 class="token-name">{{ token.name }}</h6>
          <span class="token-symbol">{{ token.symbol }}</span>
        </div>
      </div>
      <div class="token-actions">
        <button 
          v-if="!token.isRegistered && showRegisterButton" 
          @click="$emit('register', token)"
          class="btn btn-outline-primary btn-sm"
          title="Add to wallet"
        >
          <i class="fa fa-plus"></i>
        </button>
        <button 
          v-if="token.isRegistered" 
          @click="$emit('unregister', token)"
          class="btn btn-outline-danger btn-sm"
          title="Remove from wallet"
        >
          <i class="fa fa-minus"></i>
        </button>
      </div>
    </div>
    
    <div class="token-balance">
      <div class="balance-amount">
        {{ formatBalance(token.balance, token.decimals) }}
        <span class="balance-symbol">{{ token.symbol }}</span>
      </div>
      <div v-if="token.priceUSD && token.priceUSD > 0" class="balance-usd">
        ${{ formatUSDValue(token.balance, token.decimals, token.priceUSD) }}
      </div>
    </div>
    
    <!-- ICP Account section for ICP token -->
    <div v-if="token.symbol === 'ICP'" class="icp-account-section">
      <div class="icp-account-header">
        <h6 class="icp-account-title">
          <i class="fa fa-wallet me-2"></i>
          ICP Account
        </h6>
      </div>
      <div class="icp-account-content">
        <div class="account-id-display">
          <small class="account-label">Account ID:</small>
          <div class="account-id-value">
            <code class="account-id-text">{{ icpAccountId.hex }}</code>
            <button 
              @click="copyToClipboard(icpAccountId.hex)"
              class="btn btn-outline-secondary btn-sm ms-2"
              title="Copy full hex to clipboard"
            >
              <i class="fa fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Rewards section for TACO token -->
    <div v-if="token.symbol === 'TACO'" class="rewards-section">
      <div class="rewards-header" @click="toggleRewardsSection">
        <h6 class="rewards-title">
          <i 
            :class="rewardsExpanded ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" 
            class="expand-icon me-2"
          ></i>
          <div class="rewards-icon-container">
            <i class="fa fa-coins me-2"></i>
            <span v-if="totalRewards > 0" class="rewards-header-indicator"></span>
          </div>
          Rewards
          <span v-if="!rewardsExpanded && totalRewards > 0" class="rewards-count-badge">
            {{ formatBalance(BigInt(Math.floor(totalRewards)), 8) }} TACO
          </span>
        </h6>
        <div class="rewards-actions" @click.stop>
          <button 
            v-if="totalRewards > 0"
            @click="claimAllRewards"
            class="btn btn-success btn-sm"
            :disabled="loadingRewards || claimingAllRewards"
            title="Claim all rewards"
          >
            <i v-if="claimingAllRewards" class="fa fa-spinner fa-spin" :class="{ 'me-1': rewardsExpanded }"></i>
            <i v-else class="fa fa-coins" :class="{ 'me-1': rewardsExpanded }"></i>
            <span v-if="rewardsExpanded">{{ claimingAllRewards ? 'Claiming...' : 'Claim All' }}</span>
          </button>
        </div>
      </div>
      <div v-if="rewardsExpanded" class="rewards-content">
        <div v-if="loadingRewards" class="rewards-loading">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-2">Loading rewards...</span>
        </div>
        <div v-else class="rewards-balance">
          <div class="balance-amount">
            {{ formatBalance(BigInt(Math.floor(totalRewards)), 8) }}
            <span class="balance-symbol">TACO</span>
          </div>
          <div v-if="totalRewards === 0" class="balance-subtitle text-muted">
            No rewards available
          </div>
          <div v-else class="balance-subtitle text-success">
            Available to claim
          </div>
        </div>
      </div>
    </div>
    
    <!-- Neurons section for TACO token -->
    <div v-if="token.symbol === 'TACO'" class="neurons-section">
      <div class="neurons-header" @click="toggleNeuronsSection">
        <h6 class="neurons-title">
          <i 
            :class="neuronsExpanded ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" 
            class="expand-icon me-2"
          ></i>
          <i class="fa fa-brain me-2"></i>
          Neurons
          <span v-if="!neuronsExpanded && categorizedNeurons.all.length > 0" class="neuron-count-badge">
            {{ categorizedNeurons.all.length }}
          </span>
        </h6>
        <div class="neurons-actions" @click.stop>
          <button 
            @click="$emit('create-neuron')"
            class="btn btn-outline-primary btn-sm me-2"
            title="Create new neuron"
          >
            <i class="fa fa-plus"></i>
          </button>
          <button 
            @click="loadNeurons"
            class="btn btn-outline-secondary btn-sm"
            :disabled="loadingNeurons"
            title="Refresh neurons"
          >
            <i class="fa fa-refresh" :class="{ 'fa-spin': loadingNeurons }"></i>
          </button>
        </div>
      </div>
      
      <div v-if="neuronsExpanded" class="neurons-content">
        <div v-if="loadingNeurons" class="neurons-loading">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-2">Loading neurons...</span>
        </div>
        
        <div v-else-if="categorizedNeurons.all.length === 0" class="neurons-empty">
          <i class="fa fa-info-circle me-2"></i>
          <span>No neurons found</span>
        </div>
        
        <div v-else class="neurons-sections">
        <!-- Owned Neurons Section -->
        <div v-if="categorizedNeurons.owned.length > 0" class="neuron-section">
          <div class="section-header">
            <i class="fa fa-crown me-2"></i>
            <span class="section-title">Owned ({{ categorizedNeurons.owned.length }})</span>
          </div>
          <div class="neurons-list">
            <div 
              v-for="neuron in categorizedNeurons.owned" 
              :key="neuron.idHex"
              class="neuron-item owned"
            >
              <div class="neuron-header" @click="toggleNeuronExpansion(neuron.idHex)">
                <div class="neuron-info">
                  <div class="neuron-name">
                    <i 
                      :class="expandedNeurons.has(neuron.idHex) ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" 
                      class="expand-icon"
                    ></i>
                    {{ neuron.displayName }}
                    <span v-if="getNeuronRewards(neuron.idHex) > 0" class="neuron-rewards-indicator" title="Has rewards">
                      <i class="fa fa-coins text-success"></i>
                    </span>
                  </div>
                  <div class="neuron-stake">
                    {{ formatBalance(neuron.stake, 8) }} TACO
                  </div>
                </div>
                <div class="neuron-actions">
                  <button 
                    @click.stop="$emit('stake-to-neuron', neuron)"
                    class="btn btn-primary btn-sm"
                    title="Stake to this neuron"
                  >
                    <i class="fa fa-plus"></i>
                  </button>
                  <button 
                    @click.stop="$emit('set-dissolve', neuron)"
                    class="btn btn-secondary btn-sm"
                    title="Set dissolve period"
                  >
                    <i class="fa fa-clock"></i>
                  </button>
                  
                  <!-- Dissolving buttons based on state -->
                  <button 
                    v-if="neuron.dissolveState.type === 'delay' || neuron.dissolveState.type === 'none'"
                    @click.stop="$emit('start-dissolving', neuron)"
                    class="btn btn-warning btn-sm"
                    title="Start dissolving this neuron"
                  >
                    <i class="fa fa-play"></i>
                  </button>
                  <button 
                    v-if="neuron.dissolveState.type === 'dissolving'"
                    @click.stop="$emit('stop-dissolving', neuron)"
                    class="btn btn-info btn-sm"
                    title="Stop dissolving this neuron"
                  >
                    <i class="fa fa-stop"></i>
                  </button>
                  <button 
                    v-if="neuron.dissolveState.type === 'dissolved' && (neuron.stake > 0 || neuron.maturity > 0)"
                    @click.stop="$emit('disburse-neuron', neuron)"
                    class="btn btn-success btn-sm"
                    title="Disburse this neuron"
                  >
                    <i class="fa fa-coins"></i>
                  </button>
                  <button 
                    @click.stop="$emit('manage-permissions', neuron)"
                    class="btn btn-outline-light btn-sm"
                    title="Manage permissions for this neuron"
                  >
                    <i class="fa fa-key"></i>
                  </button>
                </div>
              </div>
              
              <!-- Expanded details -->
              <div v-if="expandedNeurons.has(neuron.idHex)" class="neuron-details">
                <div class="detail-grid">
                  <!-- Rewards section - moved to top and always shown -->
                  <div class="detail-item rewards-item" :class="{ 'has-rewards': getNeuronRewards(neuron.idHex) > 0 }">
                    <span class="detail-label">
                      <i class="fa fa-coins me-1"></i>
                      Rewards:
                    </span>
                    <span v-if="getNeuronRewards(neuron.idHex) > 0" class="detail-value text-success">
                      {{ formatBalance(BigInt(Math.floor(getNeuronRewards(neuron.idHex))), 8) }} TACO
                      <button 
                        @click.stop="claimNeuronRewards(neuron)"
                        class="btn btn-success btn-xs ms-2"
                        :disabled="loadingRewards || isNeuronClaiming(neuron.idHex)"
                        title="Claim this neuron's rewards"
                      >
                        <i v-if="isNeuronClaiming(neuron.idHex)" class="fa fa-spinner fa-spin"></i>
                        <i v-else class="fa fa-coins"></i>
                      </button>
                    </span>
                    <span v-else class="detail-value text-muted">
                      0 TACO
                    </span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Dissolve Period:</span>
                    <span class="detail-value" :class="'dissolve-' + neuron.dissolveState.type">
                      {{ neuron.dissolveState.display }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Age:</span>
                    <span class="detail-value">{{ neuron.age }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Maturity:</span>
                    <span class="detail-value">{{ formatBalance(neuron.maturity, 8) }} TACO</span>
                  </div>
                  <div v-if="neuron.stakedMaturity > 0" class="detail-item">
                    <span class="detail-label">Staked Maturity:</span>
                    <span class="detail-value">{{ formatBalance(neuron.stakedMaturity, 8) }} TACO</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Voting Power:</span>
                    <span class="detail-value">{{ neuron.votingPowerMultiplier }}%</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Auto-stake:</span>
                    <span class="detail-value">
                      <i :class="neuron.autoStakeMaturity ? 'fa fa-check text-success' : 'fa fa-times text-muted'"></i>
                      {{ neuron.autoStakeMaturity ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ neuron.createdDate.toLocaleDateString() }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Neuron ID:</span>
                    <span class="detail-value neuron-id">{{ neuron.idHex }}</span>
                  </div>
                </div>
                
                <!-- Permissions Section -->
                <div v-if="neuron.permissions && neuron.permissions.length > 0" class="detail-section">
                  <h6 class="section-title">
                    <i class="fa fa-key me-2"></i>
                    Permissions ({{ neuron.permissions.length }})
                  </h6>
                  <div class="permissions-list">
                    <div 
                      v-for="permission in neuron.permissions" 
                      :key="permission.principal"
                      class="permission-item"
                      :class="{ 'current-user': permission.isCurrentUser }"
                    >
                      <div class="permission-principal">
                        <span class="principal-text" :title="permission.principal">
                          {{ permission.principalShort }}
                        </span>
                        <span v-if="permission.isCurrentUser" class="user-badge">
                          <i class="fa fa-user"></i> You
                        </span>
                      </div>
                      <div class="permission-types">
                        <span 
                          v-for="permName in permission.permissionNames" 
                          :key="permName"
                          class="permission-badge"
                        >
                          {{ permName }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Followings Section -->
                <div v-if="neuron.followings && neuron.followings.length > 0" class="detail-section">
                  <h6 class="section-title">
                    <i class="fa fa-users me-2"></i>
                    Following ({{ neuron.followings.reduce((acc: number, f: any) => acc + f.followedCount, 0) }} neurons)
                  </h6>
                  <div class="followings-list">
                    <div 
                      v-for="following in neuron.followings" 
                      :key="following.functionId"
                      class="following-item"
                    >
                      <div class="following-function">
                        <span class="function-name">{{ following.functionName }}</span>
                        <span class="function-count">({{ following.followedCount }})</span>
                      </div>
                      <div class="followed-neurons">
                        <span 
                          v-for="followedNeuron in following.followedNeurons" 
                          :key="followedNeuron.idHex"
                          class="followed-neuron"
                          :title="followedNeuron.idHex"
                        >
                          {{ followedNeuron.idShort }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hotkeyed Neurons Section -->
        <div v-if="categorizedNeurons.hotkeyed.length > 0" class="neuron-section">
          <div class="section-header">
            <i class="fa fa-key me-2"></i>
            <span class="section-title">Hotkeyed ({{ categorizedNeurons.hotkeyed.length }})</span>
          </div>
          <div class="neurons-list">
            <div 
              v-for="neuron in categorizedNeurons.hotkeyed" 
              :key="neuron.idHex"
              class="neuron-item hotkeyed"
            >
              <div class="neuron-header" @click="toggleNeuronExpansion(neuron.idHex)">
                <div class="neuron-info">
                  <div class="neuron-name">
                    <i 
                      :class="expandedNeurons.has(neuron.idHex) ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" 
                      class="expand-icon"
                    ></i>
                    {{ neuron.displayName }}
                    <span v-if="getNeuronRewards(neuron.idHex) > 0" class="neuron-rewards-indicator" title="Has rewards">
                      <i class="fa fa-coins text-success"></i>
                    </span>
                  </div>
                  <div class="neuron-stake">
                    {{ formatBalance(neuron.stake, 8) }} TACO
                  </div>
                </div>
                <button 
                  @click.stop="$emit('stake-to-neuron', neuron)"
                  class="btn btn-primary btn-sm"
                  title="Stake to this neuron"
                >
                  <i class="fa fa-plus"></i>
                </button>
              </div>
              
              <!-- Expanded details -->
              <div v-if="expandedNeurons.has(neuron.idHex)" class="neuron-details">
                <div class="detail-grid">
                  <!-- Rewards section - moved to top and always shown -->
                  <div class="detail-item rewards-item" :class="{ 'has-rewards': getNeuronRewards(neuron.idHex) > 0 }">
                    <span class="detail-label">
                      <i class="fa fa-coins me-1"></i>
                      Rewards:
                    </span>
                    <span v-if="getNeuronRewards(neuron.idHex) > 0" class="detail-value text-success">
                      {{ formatBalance(BigInt(Math.floor(getNeuronRewards(neuron.idHex))), 8) }} TACO
                      <button 
                        @click.stop="claimNeuronRewards(neuron)"
                        class="btn btn-success btn-xs ms-2"
                        :disabled="loadingRewards || isNeuronClaiming(neuron.idHex)"
                        title="Claim this neuron's rewards"
                      >
                        <i v-if="isNeuronClaiming(neuron.idHex)" class="fa fa-spinner fa-spin"></i>
                        <i v-else class="fa fa-coins"></i>
                      </button>
                    </span>
                    <span v-else class="detail-value text-muted">
                      0 TACO
                    </span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Dissolve Period:</span>
                    <span class="detail-value" :class="'dissolve-' + neuron.dissolveState.type">
                      {{ neuron.dissolveState.display }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Age:</span>
                    <span class="detail-value">{{ neuron.age }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Maturity:</span>
                    <span class="detail-value">{{ formatBalance(neuron.maturity, 8) }} TACO</span>
                  </div>
                  <div v-if="neuron.stakedMaturity > 0" class="detail-item">
                    <span class="detail-label">Staked Maturity:</span>
                    <span class="detail-value">{{ formatBalance(neuron.stakedMaturity, 8) }} TACO</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Voting Power:</span>
                    <span class="detail-value">{{ neuron.votingPowerMultiplier }}%</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Auto-stake:</span>
                    <span class="detail-value">
                      <i :class="neuron.autoStakeMaturity ? 'fa fa-check text-success' : 'fa fa-times text-muted'"></i>
                      {{ neuron.autoStakeMaturity ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ neuron.createdDate.toLocaleDateString() }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Neuron ID:</span>
                    <span class="detail-value neuron-id">{{ neuron.idHex }}</span>
                  </div>
                </div>
                
                <!-- Permissions Section -->
                <div v-if="neuron.permissions && neuron.permissions.length > 0" class="detail-section">
                  <h6 class="section-title">
                    <i class="fa fa-key me-2"></i>
                    Permissions ({{ neuron.permissions.length }})
                  </h6>
                  <div class="permissions-list">
                    <div 
                      v-for="permission in neuron.permissions" 
                      :key="permission.principal"
                      class="permission-item"
                      :class="{ 'current-user': permission.isCurrentUser }"
                    >
                      <div class="permission-principal">
                        <span class="principal-text" :title="permission.principal">
                          {{ permission.principalShort }}
                        </span>
                        <span v-if="permission.isCurrentUser" class="user-badge">
                          <i class="fa fa-user"></i> You
                        </span>
                      </div>
                      <div class="permission-types">
                        <span 
                          v-for="permName in permission.permissionNames" 
                          :key="permName"
                          class="permission-badge"
                        >
                          {{ permName }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Followings Section -->
                <div v-if="neuron.followings && neuron.followings.length > 0" class="detail-section">
                  <h6 class="section-title">
                    <i class="fa fa-users me-2"></i>
                    Following ({{ neuron.followings.reduce((acc: number, f: any) => acc + f.followedCount, 0) }} neurons)
                  </h6>
                  <div class="followings-list">
                    <div 
                      v-for="following in neuron.followings" 
                      :key="following.functionId"
                      class="following-item"
                    >
                      <div class="following-function">
                        <span class="function-name">{{ following.functionName }}</span>
                        <span class="function-count">({{ following.followedCount }})</span>
                      </div>
                      <div class="followed-neurons">
                        <span 
                          v-for="followedNeuron in following.followedNeurons" 
                          :key="followedNeuron.idHex"
                          class="followed-neuron"
                          :title="followedNeuron.idHex"
                        >
                          {{ followedNeuron.idShort }}
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

    <div class="token-footer">
      <div class="token-actions-row">
        <button 
          @click="$emit('send', token)"
          class="btn btn-primary btn-send"
          :disabled="token.balance <= token.fee"
        >
          <i class="fa fa-paper-plane me-1"></i>
          Send
        </button>
        <button 
          @click="$emit('swap', token)"
          class="btn btn-secondary btn-swap"
        >
          <i class="fa fa-exchange-alt me-1"></i>
          Swap
        </button>
      </div>
      <div class="token-fee">
        Fee: {{ formatBalance(token.fee, token.decimals) }} {{ token.symbol }}
      </div>
    </div>
  </div>
</template>

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
  (e: 'start-dissolving', neuron: any): void
  (e: 'stop-dissolving', neuron: any): void
  (e: 'disburse-neuron', neuron: any): void
  (e: 'manage-permissions', neuron: any): void
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
const rewardsExpanded = ref(false) // Will be set based on rewards availability
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

// Toggle rewards section expansion
const toggleRewardsSection = () => {
  rewardsExpanded.value = !rewardsExpanded.value
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

<style scoped>
.token-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.token-details {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.2;
}

.token-symbol {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
}

.token-actions {
  display: flex;
  gap: 0.5rem;
}

.token-actions .btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.token-balance {
  margin-bottom: 0.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.balance-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.125rem;
  word-break: break-all;
}

.balance-symbol {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.balance-usd {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.token-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
}

.token-actions-row {
  display: flex;
  gap: 0.5rem;
}

.btn-send, .btn-swap {
  flex: 1;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-send:hover:not(:disabled),
.btn-swap:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.token-fee {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  padding: 0.25rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

/* ICP Account section styles */
.icp-account-section {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.icp-account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.icp-account-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.icp-account-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.account-id-display {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.account-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-id-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.account-id-text {
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  color: var(--text-primary);
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

/* Rewards section styles */
.rewards-section {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 128, 0, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.rewards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.rewards-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rewards-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.rewards-count-badge {
  background: var(--success-color);
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.rewards-icon-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.rewards-header-indicator {
  position: absolute;
  top: -2px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: var(--success-color);
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.rewards-actions {
  display: flex;
  align-items: center;
}

.rewards-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.rewards-balance {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
}

.rewards-balance .balance-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.rewards-balance .balance-symbol {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.rewards-balance .balance-subtitle {
  font-size: 0.8rem;
  font-weight: 500;
}

.rewards-content {
  animation: slideDown 0.3s ease-out;
  overflow: hidden;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Neurons section styles */
.neurons-section {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.neurons-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.neurons-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.neurons-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.neuron-count-badge {
  background: var(--bs-primary);
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.neurons-content {
  margin-top: 0.5rem;
}

.neurons-actions {
  display: flex;
  align-items: center;
}

.neurons-loading,
.neurons-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.neurons-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.neuron-section {
  border-radius: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.neurons-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.neuron-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
}

.neuron-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.neuron-item.owned {
  border-left: 3px solid #ffd700; /* Gold for owned */
}

.neuron-item.hotkeyed {
  border-left: 3px solid #87ceeb; /* Light blue for hotkeyed */
}

.neuron-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.neuron-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.expand-icon {
  font-size: 0.7rem;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.neurons-title .expand-icon {
  margin-right: 0.5rem;
}

.neuron-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.neuron-actions .btn {
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  min-width: auto;
}

.btn-xs {
  padding: 0.15rem 0.35rem;
  font-size: 0.7rem;
  line-height: 1;
  border-radius: 3px;
}

.neuron-details {
  padding: 0 0.75rem 0.75rem 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.85rem;
}

.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 400;
}

.detail-value.neuron-id {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
  word-break: break-all;
}

/* Dissolve state colors */
.dissolve-none {
  color: #6c757d; /* Gray for not dissolving */
}

.dissolve-delay {
  color: #28a745; /* Green for locked */
}

.dissolve-dissolving {
  color: #ffc107; /* Yellow for dissolving */
}

.dissolve-dissolved {
  color: #dc3545; /* Red for dissolved */
}

.dissolve-unknown {
  color: #6c757d; /* Gray for unknown */
}

/* Detail sections for permissions and followings */
.detail-section {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-section .section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

/* Permissions styling */
.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.permission-item {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.permission-item.current-user {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.permission-principal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.principal-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.user-badge {
  background: #007bff;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.permission-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.permission-badge {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

/* Followings styling */
.followings-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.following-item {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.following-function {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.function-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.function-count {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.followed-neurons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.followed-neuron {
  background: rgba(135, 206, 235, 0.2);
  color: #87ceeb;
  padding: 0.1rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  font-family: monospace;
  border: 1px solid rgba(135, 206, 235, 0.3);
  cursor: help;
}

.neuron-info {
  flex-grow: 1;
}

.neuron-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.neuron-stake {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .token-card {
    background: var(--dark-card-bg, #2d3748);
    border-color: var(--dark-border-color, #4a5568);
  }
  
  .token-logo {
    border-color: var(--dark-border-color, #4a5568);
  }
  
  .token-fee {
    background: var(--dark-bg-secondary, #1a202c);
  }
}

/* Rewards indicator in neuron header */
.neuron-rewards-indicator {
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

.neuron-rewards-indicator i {
  animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* Enhanced rewards item styling */
.rewards-item {
  background: rgba(40, 167, 69, 0.1);
  border-radius: 6px;
  padding: 0.75rem !important;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.rewards-item.has-rewards {
  background: rgba(40, 167, 69, 0.15);
  border-color: rgba(40, 167, 69, 0.3);
}

.rewards-item .detail-label {
  font-weight: 600;
  color: var(--text-primary);
}

/* Mobile responsiveness */
@media (max-width: 576px) {
  .token-card {
    padding: 1rem;
  }
  
  .token-name {
    font-size: 0.9rem;
  }
  
  .balance-amount {
    font-size: 1.1rem;
  }
  
  .token-logo {
    width: 36px;
    height: 36px;
  }
}
</style>