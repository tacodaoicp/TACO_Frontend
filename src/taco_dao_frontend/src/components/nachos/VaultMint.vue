<template>

  <div class="vault-mint">

    <!-- section title -->
    <h3 class="vault-mint__title">Mint NACHOS</h3>

    <!-- cannot mint banner -->
    <div v-if="!nachosStore.canMint" class="vault-mint__disabled">
      Minting is currently unavailable.
    </div>

    <!-- mint content -->
    <div v-else class="vault-mint__content taco-container taco-container--l1">

      <!-- mode tabs -->
      <div class="vault-mint__tabs">
        <button v-for="mode in modes" :key="mode.key"
                class="btn btn-sm"
                :class="activeMode === mode.key ? 'taco-btn taco-btn--green' : 'taco-btn'"
                @click="activeMode = mode.key">
          {{ mode.label }}
        </button>
      </div>

      <!-- slippage selector -->
      <div class="vault-mint__slippage">
        <span class="vault-mint__slippage-label">Slippage:</span>
        <button v-for="bp in slippagePresets" :key="bp"
                class="btn btn-sm"
                :class="nachosStore.slippageBP === bp ? 'taco-btn taco-btn--green' : 'taco-btn'"
                @click="nachosStore.slippageBP = bp; customSlippage = (bp / 100).toFixed(1)">
          {{ (bp / 100).toFixed(1) }}%
        </button>
        <div class="vault-mint__slippage-stepper">
          <button class="vault-mint__slippage-step" @click="adjustSlippage(-0.1)">−</button>
          <div class="vault-mint__slippage-input-wrap">
            <input type="text"
                   inputmode="decimal"
                   v-model="customSlippage"
                   class="form-control taco-input vault-mint__slippage-custom"
                   placeholder="Custom"
                   @input="applyCustomSlippage" />
            <span class="vault-mint__slippage-pct">%</span>
          </div>
          <button class="vault-mint__slippage-step" @click="adjustSlippage(0.1)">+</button>
        </div>
      </div>

      <!-- rate limit info -->
      <div v-if="nachosStore.userRateLimits" class="vault-mint__limits">
        <span>
          Window: {{ nachosStore.formatE8s(BigInt(nachosStore.userRateLimits.mintValueIn4h)) }} /
          {{ nachosStore.formatE8s(nachosStore.maxMintICPPerUser4Hours) }} ICP
        </span>
        <span>
          Ops: {{ nachosStore.userRateLimits.mintOpsIn4h.toString() }} /
          {{ nachosStore.maxMintOpsPerUser4Hours.toString() }}
        </span>
        <span v-if="nachosStore.remainingMintICP !== null">
          Max: {{ nachosStore.formatE8s(BigInt(Math.round(nachosStore.remainingMintICP))) }} ICP
        </span>
      </div>

      <!-- ============ ICP MINT MODE ============ -->
      <div v-if="activeMode === 'icp'" class="vault-mint__form">

        <!-- amount input -->
        <div class="vault-mint__input-group">
          <div class="vault-mint__label-row">
            <label class="vault-mint__label">ICP Amount</label>
            <span v-if="icpBalance !== null" class="vault-mint__balance">
              Bal: {{ nachosStore.formatE8s(icpBalance) }} ICP
              <button class="btn btn-link vault-mint__max-btn" @click="setMaxICP">MAX</button>
            </span>
          </div>
          <div class="vault-mint__input-wrap">
            <input type="text"
                   inputmode="decimal"
                   v-model="icpAmount"
                   class="form-control taco-input"
                   placeholder="0.00"
                   @input="debouncedEstimateICP" />
            <span class="vault-mint__input-suffix">ICP</span>
          </div>
          <div v-if="maxMintableICP > 0" class="vault-mint__slider-row">
            <input type="range"
                   class="vault-mint__slider"
                   :min="0"
                   :max="maxMintableICP"
                   :value="Number(icpAmountE8s)"
                   @input="onICPSlider" />
            <div class="vault-mint__slider-pcts">
              <button class="vault-mint__slider-pct" @click="setICPPercent(25)">25%</button>
              <button class="vault-mint__slider-pct" @click="setICPPercent(50)">50%</button>
              <button class="vault-mint__slider-pct" @click="setICPPercent(75)">75%</button>
              <button class="vault-mint__slider-pct" @click="setICPPercent(100)">MAX</button>
            </div>
          </div>
          <span class="vault-mint__hint">
            Min: {{ nachosStore.formatE8s(nachosStore.minMintValueICP) }} ICP
            <template v-if="nachosStore.remainingMintICP !== null">
              · Max: {{ nachosStore.formatE8s(BigInt(Math.round(nachosStore.remainingMintICP))) }} ICP
            </template>
          </span>
        </div>

        <!-- estimate -->
        <VaultMintEstimate
          v-if="icpEstimate"
          :nachos-estimate="icpEstimate.nachosEstimate"
          :fee-estimate="icpEstimate.feeEstimate"
          :nav-used="icpEstimate.navUsed"
          :fee-pct="icpFeePct"
        />

        <!-- confirm button -->
        <button class="btn taco-btn taco-btn--green w-100"
                :disabled="!canConfirmICP || !!nachosStore.activeOperationStatus"
                @click="requestMintICP">
          <span v-if="nachosStore.activeOperationStatus">
            <i class="fa-solid fa-spinner fa-spin"></i>
            {{ nachosStore.activeOperationStatus === 'depositing' ? 'Transferring ICP...' : 'Minting NACHOS...' }}
          </span>
          <span v-else>Mint NACHOS</span>
        </button>

      </div>

      <!-- ============ SINGLE TOKEN MODE ============ -->
      <div v-if="activeMode === 'token'" class="vault-mint__form">

        <!-- token selector -->
        <div class="vault-mint__input-group">
          <label class="vault-mint__label">Select Token</label>
          <select v-model="selectedTokenPrincipal" class="form-control taco-input" @change="tokenEstimate = null">
            <option value="">Choose a token...</option>
            <option v-for="[principal, config] in nachosStore.acceptedTokens"
                    :key="principal.toText()"
                    :value="principal.toText()"
                    :disabled="!config.enabled">
              {{ getTokenSymbol(principal) }} {{ !config.enabled ? '(disabled)' : '' }}
            </option>
          </select>
        </div>

        <!-- amount input -->
        <div class="vault-mint__input-group">
          <label class="vault-mint__label">Amount</label>
          <div class="vault-mint__input-wrap">
            <input type="text"
                   inputmode="decimal"
                   v-model="tokenAmount"
                   class="form-control taco-input"
                   placeholder="0.00"
                   @input="debouncedEstimateToken" />
            <span v-if="selectedTokenSymbol" class="vault-mint__input-suffix">{{ selectedTokenSymbol }}</span>
          </div>
        </div>

        <!-- estimate with allocation info -->
        <div v-if="tokenEstimate" class="vault-mint__token-estimate">
          <VaultMintEstimate
            :nachos-estimate="tokenEstimate.nachosEstimate"
            :fee-estimate="tokenEstimate.feeEstimate"
            :nav-used="tokenEstimate.navUsed"
          />

          <!-- allocation bar -->
          <div class="vault-mint__allocation taco-container taco-container--l2">
            <div class="vault-mint__allocation-row">
              <span>Current: {{ (Number(tokenEstimate.allocation.currentBasisPoints) / 100).toFixed(1) }}%</span>
              <span>After: {{ (Number(tokenEstimate.allocation.afterDepositBasisPoints) / 100).toFixed(1) }}%</span>
              <span>Target: {{ (Number(tokenEstimate.allocation.targetBasisPoints) / 100).toFixed(1) }}%</span>
            </div>
            <div class="vault-mint__allocation-bar">
              <div class="vault-mint__allocation-bar-current"
                   :style="{ width: (Number(tokenEstimate.allocation.currentBasisPoints) / 100) + '%' }"></div>
              <div class="vault-mint__allocation-bar-after"
                   :style="{ width: (Number(tokenEstimate.allocation.afterDepositBasisPoints) / 100 - Number(tokenEstimate.allocation.currentBasisPoints) / 100) + '%' }"></div>
            </div>
            <div v-if="tokenEstimate.allocation.wouldExceed" class="vault-mint__allocation-warning">
              This token is near its target allocation. Only {{ nachosStore.formatE8s(tokenEstimate.usedAmount) }}
              will be accepted. {{ nachosStore.formatE8s(tokenEstimate.excessAmount) }} will be returned.
            </div>
          </div>
        </div>

        <!-- confirm -->
        <button class="btn taco-btn taco-btn--green w-100"
                :disabled="!canConfirmToken || !!nachosStore.activeOperationStatus"
                @click="requestMintToken">
          <span v-if="nachosStore.activeOperationStatus">
            <i class="fa-solid fa-spinner fa-spin"></i>
            {{ nachosStore.activeOperationStatus === 'depositing' ? 'Transferring token...' : 'Minting NACHOS...' }}
          </span>
          <span v-else>Mint NACHOS</span>
        </button>

      </div>

      <!-- ============ PORTFOLIO SHARE MODE ============ -->
      <div v-if="activeMode === 'portfolio'" class="vault-mint__form">

        <!-- total value input -->
        <div class="vault-mint__input-group">
          <label class="vault-mint__label">Total ICP Value to Deposit</label>
          <div class="vault-mint__input-wrap">
            <input type="text"
                   inputmode="decimal"
                   v-model="portfolioValue"
                   class="form-control taco-input"
                   placeholder="10.00"
                   @input="debouncedGetShares" />
            <span class="vault-mint__input-suffix">ICP</span>
          </div>
        </div>

        <!-- required deposits table -->
        <div v-if="portfolioShares" class="vault-mint__shares">
          <table class="vault-mint__shares-table">
            <thead>
              <tr>
                <th>Token</th>
                <th class="text-end">Required</th>
                <th class="text-end">Value (ICP)</th>
                <th class="text-end">Weight</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in portfolioShares.tokens" :key="t.symbol">
                <td class="fw-bold">{{ t.symbol }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(t.requiredAmount, Number(t.decimals)) }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(t.valueICP) }}</td>
                <td class="text-end">{{ (Number(t.basisPoints) / 100).toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>

          <!-- 30m low price note -->
          <div class="vault-mint__info-note">
            <i class="fa-solid fa-circle-info"></i>
            Token prices use 30-minute lows to protect the vault from price manipulation.
          </div>

          <VaultMintEstimate
            :nachos-estimate="portfolioShares.nachosEstimate"
            :fee-estimate="portfolioShares.feeEstimate"
            :nav-used="portfolioShares.navUsed"
          />
        </div>

        <!-- confirm -->
        <button class="btn taco-btn taco-btn--green w-100"
                :disabled="!canConfirmPortfolio || !!nachosStore.activeOperationStatus"
                @click="requestMintPortfolio">
          <span v-if="nachosStore.activeOperationStatus">
            <i class="fa-solid fa-spinner fa-spin"></i>
            {{ nachosStore.activeOperationStatus === 'depositing' ? 'Transferring tokens...' : 'Minting NACHOS...' }}
          </span>
          <span v-else>Mint NACHOS (Portfolio Share)</span>
        </button>

      </div>

    </div>

    <!-- confirmation dialog -->
    <VaultConfirmDialog
      :show="showConfirmDialog"
      :data="confirmDialogData"
      @confirm="onDialogConfirm"
      @close="onDialogClose"
    />

  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { useNachosStore } from '../../stores/nachos.store'
import VaultMintEstimate from './VaultMintEstimate.vue'
import VaultConfirmDialog from './VaultConfirmDialog.vue'

const emit = defineEmits<{ (e: 'operation-complete'): void }>()

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()

const icpBalance = ref<bigint | null>(null)
const ICP_FEE = 10_000n

const loadICPBalance = async () => {
  try {
    icpBalance.value = await nachosStore.getTokenBalance('ryjl3-tyaaa-aaaaa-aaaba-cai')
  } catch { icpBalance.value = null }
}
loadICPBalance()

// Refresh ICP balance when dashboard data updates (after operations)
watch(() => nachosStore.dashboardData, loadICPBalance)

// Poll ICP balance every 15s
const balanceInterval = setInterval(loadICPBalance, 15_000)

// mode state — only show 'Single Token' if there are non-ICP tokens in portfolio
const ICP_PRINCIPAL = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const hasNonICPTokens = computed(() =>
  nachosStore.acceptedTokens.some(([p, c]: [any, any]) => c.enabled && p.toText() !== ICP_PRINCIPAL)
)
const modes = computed(() => {
  const base = [{ key: 'icp', label: 'ICP' }]
  if (hasNonICPTokens.value) base.push({ key: 'token', label: 'Single Token' })
  base.push({ key: 'portfolio', label: 'Portfolio Share' })
  return base
})
const activeMode = ref('icp')
const slippagePresets = [50, 100, 200]
const customSlippage = ref('')

const applyCustomSlippage = () => {
  const val = parseFloat(customSlippage.value)
  if (isNaN(val) || val <= 0) return
  if (val > 50) {
    customSlippage.value = '50'
    nachosStore.slippageBP = 5000
    return
  }
  nachosStore.slippageBP = Math.round(val * 100)
}

const adjustSlippage = (delta: number) => {
  const current = parseFloat(customSlippage.value) || 0
  const next = Math.round((current + delta) * 10) / 10 // avoid float drift
  const clamped = Math.min(50, Math.max(0.1, next))
  customSlippage.value = clamped.toFixed(1)
  nachosStore.slippageBP = Math.round(clamped * 100)
}

// ============ ICP MODE ============

const icpAmount = ref('')
const icpEstimate = ref<any>(null)
let icpDebounce: ReturnType<typeof setTimeout> | null = null

const icpAmountE8s = computed(() => {
  const val = parseFloat(icpAmount.value)
  if (isNaN(val) || val <= 0) return 0n
  return BigInt(Math.round(val * 1e8))
})

const maxMintableICP = computed(() => {
  const bal = icpBalance.value !== null ? Number(icpBalance.value) - Number(ICP_FEE) : Infinity
  const rateLimit = nachosStore.remainingMintICP !== null ? nachosStore.remainingMintICP : Infinity
  const result = Math.min(bal, rateLimit)
  return result > 0 ? result : 0
})

const setMaxICP = () => {
  if (maxMintableICP.value <= 0) return
  icpAmount.value = (maxMintableICP.value / 1e8).toFixed(4)
  debouncedEstimateICP()
}

const setICPPercent = (pct: number) => {
  if (maxMintableICP.value <= 0) return
  const e8s = Math.floor(maxMintableICP.value * pct / 100)
  icpAmount.value = (e8s / 1e8).toFixed(4)
  debouncedEstimateICP()
}

const onICPSlider = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  icpAmount.value = (val / 1e8).toFixed(4)
  debouncedEstimateICP()
}

const icpFeePct = computed(() => {
  if (!icpEstimate.value || icpAmountE8s.value === 0n) return ''
  return ((Number(icpEstimate.value.feeEstimate) / Number(icpAmountE8s.value)) * 100).toFixed(2)
})

const canConfirmICP = computed(() => {
  if (icpAmountE8s.value < nachosStore.minMintValueICP) return false
  if (!icpEstimate.value) return false
  if (nachosStore.remainingMintICP !== null && Number(icpAmountE8s.value) > nachosStore.remainingMintICP) return false
  if (nachosStore.remainingMintOps !== null && nachosStore.remainingMintOps <= 0) return false
  return true
})

const debouncedEstimateICP = () => {
  if (icpDebounce) clearTimeout(icpDebounce)
  icpEstimate.value = null
  icpDebounce = setTimeout(async () => {
    if (icpAmountE8s.value > 0n) {
      try {
        icpEstimate.value = await nachosStore.estimateMintICP(icpAmountE8s.value)
      } catch (e) { console.error('Estimate failed:', e) }
    }
  }, 300)
}

const handleMintICP = async () => {
  if (!canConfirmICP.value) return
  try {
    const result = await nachosStore.mintWithICP(icpAmountE8s.value)
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-mint-success',
      title: 'NACHOS Minted!',
      icon: 'fa-solid fa-check',
      message: `Received ${nachosStore.formatNachos(result.nachosReceived)}`
    })
    icpAmount.value = ''
    icpEstimate.value = null
    emit('operation-complete')
    loadICPBalance()
  } catch (e: any) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-mint-error',
      title: 'Mint Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: e.message || 'Mint failed'
    })
  }
}

// ============ SINGLE TOKEN MODE ============

const selectedTokenPrincipal = ref('')
const tokenAmount = ref('')
const tokenEstimate = ref<any>(null)
let tokenDebounce: ReturnType<typeof setTimeout> | null = null

const getTokenSymbol = (principal: any): string => {
  const entry = nachosStore.portfolio.find((p: any) => p.token.toText() === principal.toText())
  return entry?.symbol ?? principal.toText().substring(0, 8)
}

const selectedTokenSymbol = computed(() => {
  if (!selectedTokenPrincipal.value) return ''
  const entry = nachosStore.portfolio.find((p: any) => p.token.toText() === selectedTokenPrincipal.value)
  return entry?.symbol ?? ''
})

const tokenAmountRaw = computed(() => {
  const val = parseFloat(tokenAmount.value)
  if (isNaN(val) || val <= 0) return 0n
  // Assume 8 decimals — will be corrected by estimate
  return BigInt(Math.round(val * 1e8))
})

const canConfirmToken = computed(() =>
  selectedTokenPrincipal.value && tokenAmountRaw.value > 0n && tokenEstimate.value
)

const debouncedEstimateToken = () => {
  if (tokenDebounce) clearTimeout(tokenDebounce)
  tokenEstimate.value = null
  tokenDebounce = setTimeout(async () => {
    if (selectedTokenPrincipal.value && tokenAmountRaw.value > 0n) {
      try {
        const { Principal } = await import('@dfinity/principal')
        tokenEstimate.value = await nachosStore.estimateMintWithToken(
          Principal.fromText(selectedTokenPrincipal.value),
          tokenAmountRaw.value
        )
      } catch (e) { console.error('Token estimate failed:', e) }
    }
  }, 300)
}

const handleMintToken = async () => {
  if (!canConfirmToken.value) return
  try {
    // Get token fee from portfolio data
    const portfolioEntry = nachosStore.portfolio.find(
      (p: any) => p.token.toText() === selectedTokenPrincipal.value
    )
    const tokenFee = portfolioEntry ? 10_000n : 10_000n // default fee

    const result = await nachosStore.mintWithToken(
      selectedTokenPrincipal.value,
      tokenAmountRaw.value,
      tokenFee
    )
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-mint-success',
      title: 'NACHOS Minted!',
      icon: 'fa-solid fa-check',
      message: `Received ${nachosStore.formatNachos(result.nachosReceived)}`
    })
    tokenAmount.value = ''
    tokenEstimate.value = null
    emit('operation-complete')
    loadICPBalance()
  } catch (e: any) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-mint-error',
      title: 'Mint Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: e.message || 'Mint failed'
    })
  }
}

// ============ PORTFOLIO SHARE MODE ============

const portfolioValue = ref('')
const portfolioShares = ref<any>(null)
let portfolioDebounce: ReturnType<typeof setTimeout> | null = null

const portfolioValueE8s = computed(() => {
  const val = parseFloat(portfolioValue.value)
  if (isNaN(val) || val <= 0) return 0n
  return BigInt(Math.round(val * 1e8))
})

const canConfirmPortfolio = computed(() =>
  portfolioValueE8s.value > 0n && portfolioShares.value
)

const debouncedGetShares = () => {
  if (portfolioDebounce) clearTimeout(portfolioDebounce)
  portfolioShares.value = null
  portfolioDebounce = setTimeout(async () => {
    if (portfolioValueE8s.value > 0n) {
      try {
        portfolioShares.value = await nachosStore.getRequiredPortfolioShares(portfolioValueE8s.value)
      } catch (e) { console.error('Portfolio shares estimate failed:', e) }
    }
  }, 300)
}

const handleMintPortfolio = async () => {
  if (!canConfirmPortfolio.value || !portfolioShares.value) return
  try {
    const deposits = portfolioShares.value.tokens.map((t: any) => ({
      token: t.token.toText(),
      amount: t.requiredAmount,
      fee: t.tokenFee,
    }))
    const result = await nachosStore.mintWithPortfolioShare(deposits, portfolioShares.value.nachosEstimate)
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-mint-success',
      title: 'NACHOS Minted!',
      icon: 'fa-solid fa-check',
      message: `Received ${nachosStore.formatNachos(result.nachosReceived)}`
    })
    portfolioValue.value = ''
    portfolioShares.value = null
    emit('operation-complete')
    loadICPBalance()
  } catch (e: any) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-mint-error',
      title: 'Mint Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: e.message || 'Mint failed'
    })
  }
}

// ============ CONFIRMATION DIALOG ============

const showConfirmDialog = ref(false)
const pendingAction = ref<(() => Promise<void>) | null>(null)
const skipConfirmation = ref(localStorage.getItem('nachos-skip-mint-confirm') === 'true')

const confirmDialogData = ref<{
  title: string
  rows: Array<{ label: string; value: string }>
  actionLabel: string
} | null>(null)

const requestMintICP = () => {
  if (skipConfirmation.value) { handleMintICP(); return }
  confirmDialogData.value = {
    title: 'Confirm Mint (ICP)',
    rows: [
      { label: 'Deposit', value: `${icpAmount.value} ICP` },
      { label: 'NACHOS estimate', value: nachosStore.formatNachos(icpEstimate.value.nachosEstimate) },
      { label: 'Fee', value: `${nachosStore.formatE8s(icpEstimate.value.feeEstimate)} ICP` },
      { label: 'NAV', value: `${nachosStore.formatE8s(icpEstimate.value.navUsed)} ICP` },
    ],
    actionLabel: 'Confirm Mint',
  }
  pendingAction.value = handleMintICP
  showConfirmDialog.value = true
}

const requestMintToken = () => {
  if (skipConfirmation.value) { handleMintToken(); return }
  const sym = getTokenSymbol({ toText: () => selectedTokenPrincipal.value })
  confirmDialogData.value = {
    title: `Confirm Mint (${sym})`,
    rows: [
      { label: 'Deposit', value: `${tokenAmount.value} ${sym}` },
      { label: 'NACHOS estimate', value: nachosStore.formatNachos(tokenEstimate.value.nachosEstimate) },
      { label: 'Fee', value: `${nachosStore.formatE8s(tokenEstimate.value.feeEstimate)} ICP` },
      { label: 'NAV', value: `${nachosStore.formatE8s(tokenEstimate.value.navUsed)} ICP` },
    ],
    actionLabel: 'Confirm Mint',
  }
  pendingAction.value = handleMintToken
  showConfirmDialog.value = true
}

const requestMintPortfolio = () => {
  if (skipConfirmation.value) { handleMintPortfolio(); return }
  confirmDialogData.value = {
    title: 'Confirm Mint (Portfolio)',
    rows: [
      { label: 'Total deposit', value: `${portfolioValue.value} ICP` },
      { label: 'Tokens', value: portfolioShares.value.tokens.map((t: any) => t.symbol).join(', ') },
      { label: 'NACHOS estimate', value: nachosStore.formatNachos(portfolioShares.value.nachosEstimate) },
      { label: 'Fee', value: `${nachosStore.formatE8s(portfolioShares.value.feeEstimate)} ICP` },
    ],
    actionLabel: 'Confirm Mint',
  }
  pendingAction.value = handleMintPortfolio
  showConfirmDialog.value = true
}

const onDialogConfirm = (dontShowAgain: boolean) => {
  showConfirmDialog.value = false
  if (dontShowAgain) {
    skipConfirmation.value = true
    localStorage.setItem('nachos-skip-mint-confirm', 'true')
  }
  if (pendingAction.value) pendingAction.value()
}

const onDialogClose = () => {
  showConfirmDialog.value = false
  pendingAction.value = null
}

// ============ AUTO-REFRESH ESTIMATES (7s) ============

let refreshInterval: ReturnType<typeof setInterval> | null = null

const refreshActiveEstimate = async () => {
  if (nachosStore.activeOperationStatus) return // skip during operations
  try {
    if (activeMode.value === 'icp' && icpAmountE8s.value > 0n) {
      icpEstimate.value = await nachosStore.estimateMintICP(icpAmountE8s.value)
    } else if (activeMode.value === 'token' && selectedTokenPrincipal.value && tokenAmountRaw.value > 0n) {
      const { Principal } = await import('@dfinity/principal')
      tokenEstimate.value = await nachosStore.estimateMintWithToken(
        Principal.fromText(selectedTokenPrincipal.value),
        tokenAmountRaw.value
      )
    } else if (activeMode.value === 'portfolio' && portfolioValueE8s.value > 0n) {
      portfolioShares.value = await nachosStore.getRequiredPortfolioShares(portfolioValueE8s.value)
    }
  } catch (_e) { /* silent refresh */ }
}

const hasActiveInput = computed(() => {
  if (activeMode.value === 'icp') return icpAmountE8s.value > 0n
  if (activeMode.value === 'token') return selectedTokenPrincipal.value && tokenAmountRaw.value > 0n
  if (activeMode.value === 'portfolio') return portfolioValueE8s.value > 0n
  return false
})

watch(hasActiveInput, (active) => {
  if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null }
  if (active) {
    refreshInterval = setInterval(refreshActiveEstimate, 7000)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  clearInterval(balanceInterval)
})
</script>

<style scoped lang="scss">
.vault-mint {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__title {
    font-size: 1rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0;
  }

  &__disabled {
    padding: 1rem;
    text-align: center;
    opacity: 0.75;
    font-family: 'Space Mono', monospace;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .taco-btn:not(.taco-btn--green) {
      background: var(--orange-to-dark-brown);
      border: 1px solid var(--dark-orange-to-dark-brown);
      color: var(--black-to-white);

      &:hover { opacity: 0.85; }
    }
  }

  &__slippage {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;

    &-label { opacity: 0.85; }
    .btn {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
    }
    .taco-btn:not(.taco-btn--green) {
      background: var(--orange-to-dark-brown);
      border: 1px solid var(--dark-orange-to-dark-brown);
      color: var(--black-to-white);

      &:hover { opacity: 0.85; }
    }

    &-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    &-custom {
      width: 4.5rem;
      font-size: 0.75rem;
      padding: 0.125rem 1rem 0.125rem 0.375rem;
      height: auto;
      border-radius: 0;
      text-align: center;
    }

    &-pct {
      position: absolute;
      right: 0.3rem;
      font-size: 0.65rem;
      font-family: 'Space Mono', monospace;
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
    }

    &-stepper {
      display: flex;
      align-items: center;
    }

    &-step {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 100%;
      background: var(--dark-orange);
      border: 1px solid var(--dark-orange);
      color: var(--white);
      font-family: 'Space Mono', monospace;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.125rem 0;
      transition: opacity 0.15s;

      &:first-child { border-radius: 0.25rem 0 0 0.25rem; }
      &:last-child { border-radius: 0 0.25rem 0.25rem 0; }
      &:hover { opacity: 0.8; }
      &:active { opacity: 0.6; }
    }
  }

  &__limits {
    display: flex;
    gap: 1rem;
    font-size: 0.7rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.55;
    flex-wrap: wrap;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 0.375rem;
    padding: 0.75rem;
  }

  &__input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    opacity: 0.85;
  }

  &__balance {
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.85;
  }

  &__max-btn {
    font-size: 0.7rem;
    padding: 0;
    color: var(--black-to-white);
    text-decoration: underline;
    font-family: 'Space Mono', monospace;
  }

  // input wrapper for currency suffix
  &__input-wrap {
    position: relative;
    display: flex;
    align-items: center;

    .taco-input { padding-right: 3.5rem; width: 100%; }
  }

  &__input-suffix {
    position: absolute;
    right: 0.75rem;
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
  }

  // slider + percentage quick-select
  &__slider-row {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  &__slider {
    width: 100%;
    height: 0.375rem;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(128, 128, 128, 0.2);
    border-radius: 0.25rem;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: var(--dark-orange);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: var(--dark-orange);
      cursor: pointer;
      border: none;
    }
  }

  &__slider-pcts {
    display: flex;
    justify-content: space-between;
  }

  &__slider-pct {
    background: none;
    border: 1px solid var(--dark-orange-to-dark-brown);
    color: var(--black-to-white);
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.15s, background 0.15s;

    &:hover {
      opacity: 1;
      background: var(--orange-to-dark-brown);
    }
  }

  &__hint {
    font-size: 0.7rem;
    opacity: 0.5;
  }

  // select dropdown house styling
  select.taco-input {
    background-color: var(--orange-to-dark-brown);
    padding-right: 2.25rem;

    option {
      background-color: var(--orange-to-dark-brown);
      color: var(--black-to-white);
      font-family: 'Space Mono', monospace;
    }

    option:disabled {
      opacity: 0.5;
    }
  }

  // confirm button
  &__confirm {
    padding: 0.625rem 1rem;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  &__allocation {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;

    &-row {
      display: flex;
      justify-content: space-between;
      opacity: 0.7;
    }

    &-bar {
      height: 8px;
      background: rgba(128, 128, 128, 0.2);
      border-radius: 4px;
      display: flex;
      overflow: hidden;
    }

    &-bar-current {
      background-color: var(--success-green);
      height: 100%;
    }

    &-bar-after {
      background-color: var(--dark-orange);
      height: 100%;
    }

    &-warning {
      color: var(--dark-orange-to-brown);
      font-size: 0.8rem;
      padding: 0.5rem;
      background: rgba(255, 193, 7, 0.1);
      border-radius: 0.25rem;
    }
  }

  &__shares-table {
    width: 100%;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
    border-collapse: collapse;
    margin-bottom: 0.5rem;

    th, td {
      padding: 0.375rem 0.5rem;
      border-bottom: 1px solid var(--dark-orange-to-brown);
    }

    th {
      font-size: 0.7rem;
      text-transform: uppercase;
      opacity: 0.7;
    }
  }

  &__token-estimate {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__info-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.8;
    padding: 0.5rem 0.75rem;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 0.375rem;

    i { font-size: 0.85rem; }
  }
}

.taco-input {
  background: var(--orange-to-dark-brown);
  border: 1px solid var(--dark-orange-to-dark-brown);
  color: var(--black-to-white);
  font-family: 'Space Mono', monospace;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    border-color: var(--dark-orange);
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--dark-orange), 0.25);
  }
}
</style>
