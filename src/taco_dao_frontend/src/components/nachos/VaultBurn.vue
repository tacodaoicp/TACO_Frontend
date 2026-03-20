<template>

  <div class="vault-burn">

    <!-- section title -->
    <h3 class="vault-burn__title">Burn / Redeem NACHOS</h3>

    <!-- cannot burn banner -->
    <div v-if="!nachosStore.canBurn" class="vault-burn__disabled">
      Burning is currently unavailable.
    </div>

    <!-- burn content -->
    <div v-else class="vault-burn__content taco-container taco-container--l1">

      <!-- amount input -->
      <div class="vault-burn__input-group">
        <div class="vault-burn__label-row">
          <label class="vault-burn__label">NACHOS Amount</label>
          <span v-if="nachosBalance !== null" class="vault-burn__balance">
            Bal: {{ nachosStore.formatE8s(nachosBalance) }} NACHOS
            <button class="btn btn-link vault-burn__max-btn" @click="setMaxBurn">MAX</button>
          </span>
        </div>
        <div class="vault-burn__input-wrap">
          <input type="text"
                 inputmode="decimal"
                 v-model="nachosAmount"
                 class="form-control taco-input"
                 placeholder="0.00"
                 @input="debouncedEstimate" />
          <span class="vault-burn__input-suffix">NACHOS</span>
        </div>
        <div v-if="maxBurnable > 0" class="vault-burn__slider-row">
          <input type="range"
                 class="vault-burn__slider"
                 :min="0"
                 :max="maxBurnable"
                 :value="Number(nachosAmountE8s)"
                 @input="onBurnSlider" />
          <div class="vault-burn__slider-pcts">
            <button class="vault-burn__slider-pct" @click="setBurnPercent(25)">25%</button>
            <button class="vault-burn__slider-pct" @click="setBurnPercent(50)">50%</button>
            <button class="vault-burn__slider-pct" @click="setBurnPercent(75)">75%</button>
            <button class="vault-burn__slider-pct" @click="setBurnPercent(100)">MAX</button>
          </div>
        </div>
        <span class="vault-burn__hint">
          Min: {{ nachosStore.formatE8s(nachosStore.minBurnValueICP) }} ICP equivalent
        </span>
        <!-- rate limit info -->
        <div v-if="nachosStore.userRateLimits" class="vault-burn__limits">
          <span>
            Window: {{ nachosStore.formatE8s(BigInt(nachosStore.userRateLimits.burnValueIn4h)) }} /
            {{ nachosStore.formatE8s(nachosStore.maxBurnNachosPerUser4Hours) }} NACHOS
          </span>
          <span>
            Ops: {{ nachosStore.userRateLimits.burnOpsIn4h.toString() }} /
            {{ nachosStore.maxBurnOpsPerUser4Hours.toString() }}
          </span>
          <span v-if="nachosStore.remainingBurnNachos !== null">
            Max: {{ nachosStore.formatE8s(BigInt(Math.round(nachosStore.remainingBurnNachos))) }} NACHOS
          </span>
        </div>
      </div>

      <!-- estimate breakdown -->
      <div v-if="burnEstimate" class="vault-burn__estimate">

        <!-- summary -->
        <div class="vault-burn__summary taco-container taco-container--l2">
          <div class="vault-burn__summary-row">
            <span class="vault-burn__summary-label">Redemption value</span>
            <span class="vault-burn__summary-value">{{ nachosStore.formatE8s(burnEstimate.redemptionValueICP) }} ICP</span>
          </div>
          <div class="vault-burn__summary-row">
            <span class="vault-burn__summary-label">Fee</span>
            <span class="vault-burn__summary-value">
              {{ nachosStore.formatE8s(burnEstimate.feeEstimate) }} ICP
              <span v-if="feePct" class="vault-burn__summary-pct">({{ feePct }}%)</span>
            </span>
          </div>
          <div class="vault-burn__summary-row">
            <span class="vault-burn__summary-label">Net value</span>
            <span class="vault-burn__summary-value fw-bold">{{ nachosStore.formatE8s(burnEstimate.netValueICP) }} ICP</span>
          </div>
          <div class="vault-burn__summary-row">
            <span class="vault-burn__summary-label">NAV used</span>
            <span class="vault-burn__summary-value">{{ nachosStore.formatE8s(burnEstimate.navUsed) }} ICP</span>
          </div>
        </div>

        <!-- per-token breakdown -->
        <div class="vault-burn__tokens">
          <h4 class="vault-burn__tokens-title">Tokens to receive</h4>
          <table class="vault-burn__tokens-table">
            <thead>
              <tr>
                <th>Token</th>
                <th class="text-end">Amount</th>
                <th class="text-end">Value (ICP)</th>
                <th class="text-end">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in burnEstimate.tokens" :key="t.symbol"
                  :class="{ 'vault-burn__tokens-dust': t.isDust }">
                <td class="fw-bold">{{ t.symbol }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(t.amount, Number(t.decimals)) }}</td>
                <td class="text-end">{{ nachosStore.formatE8s(t.valueICP) }}</td>
                <td class="text-end">
                  <span v-if="t.isDust" class="vault-burn__dust-badge">dust - skipped</span>
                  <span v-else class="vault-burn__active-badge">payout</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- advanced: per-token slippage -->
        <div class="vault-burn__advanced">
          <button class="btn btn-sm taco-btn" @click="showAdvanced = !showAdvanced">
            <i :class="showAdvanced ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
            Advanced (per-token minimums)
          </button>

          <div v-if="showAdvanced" class="vault-burn__advanced-content">
            <p class="vault-burn__advanced-hint">
              Set minimum amounts per token. Leave empty to use default slippage ({{ (nachosStore.slippageBP / 100).toFixed(1) }}%).
            </p>
            <div v-for="t in nonDustTokens" :key="t.symbol" class="vault-burn__advanced-row">
              <span class="vault-burn__advanced-label">{{ t.symbol }}</span>
              <input type="text"
                     inputmode="decimal"
                     v-model="perTokenMins[t.token.toText()]"
                     class="form-control taco-input vault-burn__advanced-input"
                     :placeholder="nachosStore.formatE8s(defaultMinForToken(t), Number(t.decimals))" />
            </div>
          </div>
        </div>
      </div>

      <!-- confirm -->
      <button class="btn taco-btn taco-btn--green w-100"
              :disabled="!canConfirm || !!nachosStore.activeOperationStatus"
              @click="requestBurn">
        <span v-if="nachosStore.activeOperationStatus">
          <i class="fa-solid fa-spinner fa-spin"></i>
          {{ nachosStore.activeOperationStatus === 'depositing' ? 'Transferring NACHOS...' : 'Burning NACHOS...' }}
        </span>
        <span v-else>Burn & Redeem</span>
      </button>

      <!-- last burn result -->
      <div v-if="lastBurnResult" class="vault-burn__result taco-container taco-container--l2">
        <h4 class="vault-burn__result-title">
          <i class="fa-solid fa-check-circle"></i> Burn Complete
        </h4>
        <div class="vault-burn__result-row">
          <span>NACHOS burned</span>
          <span class="fw-bold">{{ nachosStore.formatNachos(lastBurnResult.nachosBurned) }}</span>
        </div>
        <div class="vault-burn__result-row">
          <span>Net redemption</span>
          <span>{{ nachosStore.formatE8s(lastBurnResult.netValueICP) }} ICP</span>
        </div>
        <div v-if="lastBurnResult.partialFailure" class="vault-burn__result-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Some token transfers failed. Check Operations for details.
        </div>
        <div v-if="lastBurnResult.skippedDustTokens.length > 0" class="vault-burn__result-dust">
          Skipped dust tokens: {{ lastBurnResult.skippedDustTokens.length }}
        </div>
        <div v-if="lastBurnResult.failedTokens.length > 0" class="vault-burn__result-failed">
          <div v-for="ft in lastBurnResult.failedTokens" :key="ft.token.toText()">
            Failed: {{ ft.token.toText().substring(0, 11) }}... - {{ ft.error }}
          </div>
        </div>
        <p class="vault-burn__result-hint">
          Payouts are processed asynchronously. Track transfers in the Operations section below.
        </p>
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
import { Principal } from '@dfinity/principal'
import { useTacoStore } from '../../stores/taco.store'
import { useNachosStore } from '../../stores/nachos.store'
import VaultConfirmDialog from './VaultConfirmDialog.vue'

const emit = defineEmits<{ (e: 'operation-complete'): void }>()

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()

const NACHOS_PRINCIPAL = 'pabnq-2qaaa-aaaam-qhryq-cai'
const NACHOS_FEE = 10_000n
const nachosBalance = ref<bigint | null>(null)

const loadNachosBalance = async () => {
  try {
    nachosBalance.value = await nachosStore.getTokenBalance(NACHOS_PRINCIPAL)
  } catch { nachosBalance.value = null }
}
loadNachosBalance()

// Refresh NACHOS balance when dashboard data updates (after operations)
watch(() => nachosStore.dashboardData, loadNachosBalance)

// Poll NACHOS balance every 15s
const balanceInterval = setInterval(loadNachosBalance, 15_000)

const nachosAmount = ref('')
const burnEstimate = ref<any>(null)
const showAdvanced = ref(false)
const perTokenMins = ref<Record<string, string>>({})
const lastBurnResult = ref<any>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const nachosAmountE8s = computed(() => {
  const val = parseFloat(nachosAmount.value)
  if (isNaN(val) || val <= 0) return 0n
  return BigInt(Math.round(val * 1e8))
})

const maxBurnable = computed(() => {
  const bal = nachosBalance.value !== null ? Number(nachosBalance.value) - Number(NACHOS_FEE) : Infinity
  const rateLimit = nachosStore.remainingBurnNachos !== null ? nachosStore.remainingBurnNachos : Infinity
  const result = Math.min(bal, rateLimit)
  return result > 0 ? result : 0
})

const setMaxBurn = () => {
  if (maxBurnable.value <= 0) return
  nachosAmount.value = (Math.floor(maxBurnable.value / 1e4) / 1e4).toFixed(4)
  debouncedEstimate()
}

const setBurnPercent = (pct: number) => {
  if (maxBurnable.value <= 0) return
  const e8s = Math.floor(maxBurnable.value * pct / 100)
  nachosAmount.value = (Math.floor(e8s / 1e4) / 1e4).toFixed(4)
  debouncedEstimate()
}

const onBurnSlider = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  nachosAmount.value = (Math.floor(val / 1e4) / 1e4).toFixed(4)
  debouncedEstimate()
}

const feePct = computed(() => {
  if (!burnEstimate.value || burnEstimate.value.redemptionValueICP === 0n) return ''
  return ((Number(burnEstimate.value.feeEstimate) / Number(burnEstimate.value.redemptionValueICP)) * 100).toFixed(2)
})

const nonDustTokens = computed(() =>
  burnEstimate.value?.tokens?.filter((t: any) => !t.isDust) ?? []
)

const canConfirm = computed(() => {
  if (nachosAmountE8s.value <= 0n) return false
  if (!burnEstimate.value) return false
  return true
})

const defaultMinForToken = (t: any): bigint => {
  const bp = BigInt(nachosStore.slippageBP)
  return (t.amount * (10000n - bp)) / 10000n
}

const debouncedEstimate = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  burnEstimate.value = null
  debounceTimer = setTimeout(async () => {
    if (nachosAmountE8s.value > 0n) {
      try {
        burnEstimate.value = await nachosStore.estimateBurn(nachosAmountE8s.value)
      } catch (e) { console.error('Burn estimate failed:', e) }
    }
  }, 300)
}

const buildPerTokenMinimums = (): Array<{ token: Principal; minAmount: bigint }> | undefined => {
  if (!showAdvanced.value || !burnEstimate.value) return undefined

  const mins: Array<{ token: Principal; minAmount: bigint }> = []
  for (const t of nonDustTokens.value) {
    const customVal = perTokenMins.value[t.token.toText()]
    if (customVal) {
      const parsed = parseFloat(customVal)
      if (!isNaN(parsed) && parsed > 0) {
        mins.push({
          token: t.token,
          minAmount: BigInt(Math.round(parsed * (10 ** Number(t.decimals)))),
        })
      }
    } else {
      mins.push({ token: t.token, minAmount: defaultMinForToken(t) })
    }
  }
  return mins.length > 0 ? mins : undefined
}

const handleBurn = async () => {
  if (!canConfirm.value) return
  try {
    const minimums = buildPerTokenMinimums()
    const result = await nachosStore.burnNachos(nachosAmountE8s.value, minimums)
    lastBurnResult.value = result

    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-burn-success',
      title: 'NACHOS Burned!',
      icon: 'fa-solid fa-fire',
      message: `Redeemed ${nachosStore.formatE8s(result.netValueICP)} ICP worth of tokens`
    })
    nachosAmount.value = ''
    burnEstimate.value = null
    perTokenMins.value = {}
    emit('operation-complete')
    loadNachosBalance()
  } catch (e: any) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-burn-error',
      title: 'Burn Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: e.message || 'Burn failed'
    })
  }
}

// ============ CONFIRMATION DIALOG ============

const showConfirmDialog = ref(false)
const pendingAction = ref<(() => Promise<void>) | null>(null)
const skipConfirmation = ref(localStorage.getItem('nachos-skip-burn-confirm') === 'true')

const confirmDialogData = ref<{
  title: string
  rows: Array<{ label: string; value: string }>
  actionLabel: string
} | null>(null)

const requestBurn = () => {
  if (!canConfirm.value) return
  if (skipConfirmation.value) { handleBurn(); return }
  confirmDialogData.value = {
    title: 'Confirm Burn & Redeem',
    rows: [
      { label: 'Burn', value: `${nachosAmount.value} NACHOS` },
      { label: 'Redemption value', value: `${nachosStore.formatE8s(burnEstimate.value.redemptionValueICP)} ICP` },
      { label: 'Fee', value: `${nachosStore.formatE8s(burnEstimate.value.feeEstimate)} ICP` },
      { label: 'Net value', value: `${nachosStore.formatE8s(burnEstimate.value.netValueICP)} ICP` },
      { label: 'Tokens', value: nonDustTokens.value.map((t: any) => t.symbol).join(', ') },
    ],
    actionLabel: 'Confirm Burn',
  }
  pendingAction.value = handleBurn
  showConfirmDialog.value = true
}

const onDialogConfirm = (dontShowAgain: boolean) => {
  showConfirmDialog.value = false
  if (dontShowAgain) {
    skipConfirmation.value = true
    localStorage.setItem('nachos-skip-burn-confirm', 'true')
  }
  if (pendingAction.value) pendingAction.value()
}

const onDialogClose = () => {
  showConfirmDialog.value = false
  pendingAction.value = null
}

// ============ AUTO-REFRESH ESTIMATE (7s) ============

let refreshInterval: ReturnType<typeof setInterval> | null = null

const refreshBurnEstimate = async () => {
  if (nachosStore.activeOperationStatus) return
  if (nachosAmountE8s.value > 0n) {
    try {
      burnEstimate.value = await nachosStore.estimateBurn(nachosAmountE8s.value)
    } catch (_e) { /* silent refresh */ }
  }
}

watch(() => nachosAmountE8s.value > 0n, (active) => {
  if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null }
  if (active) {
    refreshInterval = setInterval(refreshBurnEstimate, 7000)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  clearInterval(balanceInterval)
})
</script>

<style scoped lang="scss">
.vault-burn {
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

  // darker inner area for form content
  &__input-group,
  &__estimate {
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

    .taco-input { padding-right: 4.5rem; width: 100%; }
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

  &__limits {
    display: flex;
    gap: 1rem;
    font-size: 0.7rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.55;
    flex-wrap: wrap;
  }

  &__estimate {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;

    &-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &-label { opacity: 0.85; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }
    &-pct { opacity: 0.75; font-size: 0.8rem; }
  }

  &__tokens {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-title {
      font-size: 0.9rem;
      font-family: 'Space Mono', monospace;
      margin-bottom: 0;
    }

    &-table {
      width: 100%;
      font-size: 0.8rem;
      font-family: 'Space Mono', monospace;
      border-collapse: collapse;

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

    &-dust {
      opacity: 0.4;
    }
  }

  &__dust-badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.375rem;
    border-radius: 0.25rem;
    background: rgba(128, 128, 128, 0.2);
    color: var(--brown-to-white);
  }

  &__active-badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.375rem;
    border-radius: 0.25rem;
    background: rgba(40, 167, 69, 0.15);
    color: var(--success-green);
  }

  &__advanced {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    &-hint {
      font-size: 0.75rem;
      opacity: 0.75;
      margin: 0;
    }

    &-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-family: 'Space Mono', monospace;
    }

    &-label {
      min-width: 60px;
      font-weight: bold;
    }

    &-input {
      max-width: 200px;
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
    }
  }

  &__result {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;

    &-title {
      font-size: 1rem;
      margin-bottom: 0;
      color: var(--success-green);

      i { margin-right: 0.375rem; }
    }

    &-row {
      display: flex;
      justify-content: space-between;
    }

    &-warning {
      color: var(--dark-orange-to-brown);
      font-size: 0.8rem;
      padding: 0.5rem;
      background: rgba(255, 193, 7, 0.1);
      border-radius: 0.25rem;

      i { margin-right: 0.25rem; }
    }

    &-dust {
      font-size: 0.8rem;
      opacity: 0.75;
    }

    &-failed {
      font-size: 0.8rem;
      color: var(--red-to-light-red);
    }

    &-hint {
      font-size: 0.75rem;
      opacity: 0.65;
      margin: 0;
    }
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
