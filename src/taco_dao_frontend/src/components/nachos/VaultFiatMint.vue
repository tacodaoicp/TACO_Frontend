<template>

  <div class="vault-fiat-mint">

    <!-- provider toggle -->
    <div class="vault-fiat-mint__provider-toggle">
      <button :class="['vault-fiat-mint__provider-btn', { active: selectedProvider === 'banxa' }]"
              :disabled="isActive"
              @click="selectedProvider = 'banxa'">
        Banxa
      </button>
      <button :class="['vault-fiat-mint__provider-btn', { active: selectedProvider === 'self' }]"
              :disabled="isActive"
              @click="selectedProvider = 'self'">
        Self
      </button>
    </div>

    <!-- amount + currency (Banxa only) -->
    <div v-if="selectedProvider === 'banxa'" class="vault-fiat-mint__amount-row">
      <div class="vault-fiat-mint__input-group" style="flex: 1;">
        <label class="vault-fiat-mint__label">Amount</label>
        <input type="text"
               inputmode="decimal"
               v-model="fiatAmount"
               class="form-control taco-input"
               placeholder="50"
               :disabled="isActive" />
      </div>
      <div class="vault-fiat-mint__input-group" style="width: 6rem;">
        <label class="vault-fiat-mint__label">Currency</label>
        <select v-model="fiatCurrency" class="form-control taco-input" :disabled="isActive">
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="CHF">CHF</option>
          <option value="CAD">CAD</option>
          <option value="AUD">AUD</option>
          <option value="JPY">JPY</option>
          <option value="INR">INR</option>
        </select>
      </div>
    </div>

    <!-- Self-send instructions (replaces amount row) -->
    <div v-else class="vault-fiat-mint__self-note">
      <i class="fa-solid fa-circle-info me-2"></i>
      Send ICP to the following account ID from any wallet or exchange. We'll auto-detect it.
    </div>

    <!-- deposit address -->
    <div class="vault-fiat-mint__deposit-addr">
      <label class="vault-fiat-mint__label">Your ICP Address</label>
      <div class="vault-fiat-mint__addr-row">
        <code v-if="userLedgerAccountId" class="vault-fiat-mint__addr-value">{{ userLedgerAccountId }}</code>
        <code v-else class="vault-fiat-mint__addr-value">
          <i class="fa-solid fa-spinner fa-spin me-1"></i>Log in to see your address
        </code>
        <button v-if="userLedgerAccountId"
                type="button"
                class="btn btn-sm vault-fiat-mint__copy-addr"
                @click="copyAddress"
                :title="addressCopied ? 'Copied!' : 'Copy ICP address'">
          <i :class="addressCopied ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
          {{ addressCopied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- buy button -->
    <button class="btn taco-btn taco-btn--green w-100"
            :disabled="isActive || !userLedgerAccountId"
            @click="openBuy">
      <i v-if="isActive" class="fa-solid fa-spinner fa-spin me-2"></i>
      {{ buyButtonText }}
    </button>

    <!-- Manual mint button (when ICP detected and idle) -->
    <div v-if="icpDetected && mintPhase === 'idle'" class="vault-fiat-mint__detected">
      <div class="vault-fiat-mint__detected-banner">
        <i class="fa-solid fa-check-circle me-2"></i>
        <strong>ICP Detected:</strong> {{ formatE8s(detectedIcpAmount) }} ICP
      </div>
      <button class="btn taco-btn taco-btn--green w-100"
              @click="confirmMint">
        <i class="fa-solid fa-coins me-2"></i>
        Mint NACHOS
      </button>
    </div>

    <!-- Progress tracker -->
    <div v-if="mintPhase !== 'idle'" class="vault-fiat-mint__progress-section">
      <SwapProgressTracker
        :steps="NACHOS_MINT_STEPS"
        :current-step="currentStep"
        :status="trackerStatus"
        :status-message="statusMessage"
        :error-message="mintPhase === 'error' ? mintError : null"
        :amounts="progressAmounts"
      />
    </div>

  </div>

</template>

<script setup lang="ts">

import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { useNachosStore } from '../../stores/nachos.store'
import { storeToRefs } from 'pinia'
import { Principal } from '@dfinity/principal'
import { buildBanxaUrl } from '../../utils/onramp/banxa'
import { isDevEnvironment } from '../../config/network-config'
import SwapProgressTracker from '../misc/SwapProgressTracker.vue'
import type { ProgressStep, ProgressAmount } from '../misc/SwapProgressTracker.vue'

const emit = defineEmits<{ (e: 'operation-complete'): void }>()

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()
const { userPrincipal, userLedgerAccountId } = storeToRefs(tacoStore)

///////////////
// constants //
///////////////

const DEPOSIT_POLL_MS = 3_000
const MAX_POLL_DURATION_MS = 1_200_000
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const DEPOSIT_MIN_E8S = 10_000n

///////////
// state //
///////////

type MintPhase = 'idle' | 'detecting' | 'minting' | 'complete' | 'error'
type Provider = 'banxa' | 'self'

const selectedProvider = ref<Provider>('banxa')
const fiatAmount = ref('50')
const fiatCurrency = ref('EUR')

const mintPhase = ref<MintPhase>('idle')
const mintStep = ref('')
const mintError = ref('')
const completionMessage = ref('')
const depositBalance = ref<bigint>(0n)
const baselineBalance = ref<bigint>(0n)
const icpDetected = ref(false)
const detectedIcpAmount = ref<bigint>(0n)

// Copy-to-clipboard feedback
const addressCopied = ref(false)

// Polling
let depositPollInterval: ReturnType<typeof setInterval> | null = null

//////////////
// computed //
//////////////

const isActive = computed(() =>
  mintPhase.value === 'detecting' || mintPhase.value === 'minting'
)

const buyButtonText = computed(() => {
  if (mintPhase.value === 'detecting') return 'Waiting for ICP...'
  if (mintPhase.value === 'minting') return 'Minting NACHOS...'
  return selectedProvider.value === 'banxa' ? 'Fund via Banxa' : 'Start Monitoring'
})

/////////////////////////////
// progress tracker state  //
/////////////////////////////

const NACHOS_MINT_STEPS: ProgressStep[] = [
  { key: 'fund', label: 'Fund Wallet', description: 'ICP deposited to your wallet', activeDescription: 'Waiting for ICP deposit...' },
  { key: 'mint', label: 'Mint NACHOS', description: 'NACHOS minted at current NAV', activeDescription: 'Depositing ICP and minting...' },
  { key: 'done', label: 'Complete', description: 'NACHOS in your wallet' },
]

const errorAtStep = ref(0)

watch(mintPhase, (newVal, oldVal) => {
  if (newVal === 'error') {
    switch (oldVal) {
      case 'detecting': errorAtStep.value = 0; break
      case 'minting': errorAtStep.value = 1; break
      default: errorAtStep.value = 0
    }
  }
})

const currentStep = computed(() => {
  switch (mintPhase.value) {
    case 'detecting': return 0
    case 'minting': return 1
    case 'complete': return 2
    case 'error': return errorAtStep.value
    default: return 0
  }
})

const trackerStatus = computed((): 'idle' | 'active' | 'complete' | 'failed' => {
  switch (mintPhase.value) {
    case 'detecting':
    case 'minting': return 'active'
    case 'complete': return 'complete'
    case 'error': return 'failed'
    default: return 'idle'
  }
})

const statusMessage = computed(() => {
  if (mintPhase.value === 'complete') return completionMessage.value
  if (mintStep.value && mintPhase.value === 'minting') return mintStep.value
  return ''
})

const progressAmounts = computed((): ProgressAmount[] => {
  const amounts: ProgressAmount[] = []
  if (detectedIcpAmount.value > 0n || depositBalance.value > 0n) {
    const amt = detectedIcpAmount.value > 0n ? detectedIcpAmount.value : depositBalance.value
    amounts.push({ label: 'ICP Amount', value: `${formatE8s(amt)} ICP` })
  }
  if (mintPhase.value === 'complete' && completionMessage.value) {
    amounts.push({ label: 'Result', value: completionMessage.value, highlight: true })
  }
  return amounts
})

/////////////
// helpers //
/////////////

const formatE8s = (e8s: bigint): string => {
  const whole = e8s / 100_000_000n
  const frac = e8s % 100_000_000n
  const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '')
  return fracStr ? `${whole}.${fracStr}` : whole.toString()
}

////////////////////
// payment flows  //
////////////////////

const openBuy = () => {
  if (selectedProvider.value === 'banxa') openBanxa()
  else startSelfMonitor()
}

const copyAddress = async () => {
  if (!userLedgerAccountId.value) return
  try {
    await navigator.clipboard.writeText(userLedgerAccountId.value)
    addressCopied.value = true
    setTimeout(() => { addressCopied.value = false }, 2000)
  } catch (e) {
    console.warn('Clipboard copy failed:', e)
  }
}

/** Record baseline ICP balance before opening onramp */
const recordBaseline = async () => {
  try {
    const balance = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(userPrincipal.value),
      new Uint8Array(32)
    )
    baselineBalance.value = balance !== false ? BigInt(balance) : 0n
  } catch {
    baselineBalance.value = 0n
  }
}

const watchPopupForGrace = (popup: Window | null) => {
  const popupPoll = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(popupPoll)
      handlePopupClose()
    }
  }, 1500)
}

const openBanxa = async () => {
  if (!userLedgerAccountId.value) {
    mintError.value = 'Not logged in. Please log in first.'
    mintPhase.value = 'error'
    return
  }

  mintPhase.value = 'detecting'
  mintError.value = ''
  completionMessage.value = ''

  try {
    await recordBaseline()

    const url = buildBanxaUrl({
      walletAddress: userLedgerAccountId.value,
      fiatAmount: Number(fiatAmount.value) || 50,
      fiatCurrency: fiatCurrency.value,
    })

    const popup = window.open(url, '_blank', 'noopener,noreferrer')
    startDepositPolling()
    watchPopupForGrace(popup)

  } catch (err: any) {
    console.error('Failed to open Banxa (NACHOS vault):', err)
    mintPhase.value = 'error'
    mintError.value = `Failed to open payment page: ${err.message || err}`
  }
}

const startSelfMonitor = async () => {
  if (!userLedgerAccountId.value) {
    mintError.value = 'Not logged in. Please log in first.'
    mintPhase.value = 'error'
    return
  }

  mintPhase.value = 'detecting'
  mintError.value = ''
  completionMessage.value = ''

  await recordBaseline()
  startDepositPolling()
}

////////////////////
// popup close    //
////////////////////

const handlePopupClose = () => {
  // If still detecting and no deposit found, keep polling for 5 minutes then give up
  if (mintPhase.value === 'detecting') {
    setTimeout(() => {
      if (mintPhase.value === 'detecting') {
        mintPhase.value = 'idle'
        stopDepositPolling()
      }
    }, 300_000)
  }
}

/////////////////////
// deposit polling //
/////////////////////

/** Poll user's personal ICP wallet for balance increase, then auto-mint */
const startDepositPolling = () => {
  stopDepositPolling()
  const startedAt = Date.now()

  depositPollInterval = setInterval(async () => {
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopDepositPolling()
      if (mintPhase.value === 'detecting') {
        mintPhase.value = 'error'
        mintError.value = 'Timed out waiting for ICP deposit.'
      }
      return
    }

    try {
      const balance = await tacoStore.icrc1BalanceOf(
        ICP_LEDGER_CANISTER_ID,
        Principal.fromText(userPrincipal.value),
        new Uint8Array(32)
      )

      if (balance === false) return

      const currentBalance = BigInt(balance)
      const diff = currentBalance - baselineBalance.value

      if (diff > DEPOSIT_MIN_E8S) {
        depositBalance.value = diff
        stopDepositPolling()
        // Show confirmation button — user must manually trigger mint (compliance)
        icpDetected.value = true
        detectedIcpAmount.value = diff
        mintPhase.value = 'idle'
      }
    } catch (err) {
      console.error('Deposit poll error (vault fiat):', err)
    }
  }, DEPOSIT_POLL_MS)
}

const stopDepositPolling = () => {
  if (depositPollInterval) {
    clearInterval(depositPollInterval)
    depositPollInterval = null
  }
}

/////////////////////
// mint execution  //
/////////////////////

/** User confirmed — kick off the mint */
const confirmMint = () => {
  if (!icpDetected.value || detectedIcpAmount.value === 0n) return
  const amount = detectedIcpAmount.value
  icpDetected.value = false
  detectedIcpAmount.value = 0n
  executeMint(amount)
}

const executeMint = async (amount: bigint) => {
  mintPhase.value = 'minting'
  mintStep.value = 'Depositing ICP to treasury...'

  try {
    const result = await nachosStore.mintWithICP(amount)
    mintPhase.value = 'complete'
    const mintId = result?.mintId != null ? ` (mint #${result.mintId})` : ''
    completionMessage.value = `NACHOS minted successfully!${mintId}`
    emit('operation-complete')
  } catch (err: any) {
    console.error('NACHOS mint failed (vault fiat):', err)
    mintPhase.value = 'error'
    mintError.value = `Mint failed: ${err.message || err}`
  }
}

///////////////
// lifecycle //
///////////////

/** Check if user already has ICP above threshold (for manual mint) */
const checkExistingBalance = async () => {
  if (!userPrincipal.value) return
  try {
    const balance = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(userPrincipal.value),
      new Uint8Array(32)
    )
    if (balance !== false) {
      const bal = BigInt(balance)
      if (bal > DEPOSIT_MIN_E8S) {
        icpDetected.value = true
        detectedIcpAmount.value = bal
      }
    }
  } catch {
    // Ignore
  }
}

watch(() => tacoStore.userLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await checkExistingBalance()
  } else {
    mintPhase.value = 'idle'
    icpDetected.value = false
    detectedIcpAmount.value = 0n
    stopDepositPolling()
  }
})

onBeforeUnmount(() => {
  stopDepositPolling()
})

</script>

<style scoped lang="scss">
.vault-fiat-mint {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  // paused banner
  &__paused {
    padding: 0.5rem 0.75rem;
    background: rgba(244, 67, 54, 0.12);
    border: 1px solid var(--red);
    border-radius: 0.375rem;
    color: var(--red);
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  // provider toggle
  &__provider-toggle {
    display: flex;
    gap: 0;
    border: 1px solid var(--dark-orange);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  &__provider-btn {
    flex: 1;
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--black-to-white);
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.15s;

    &.active {
      background-color: var(--dark-orange);
      color: var(--white);
    }

    &:not(.active):hover {
      background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  // amount row
  &__amount-row {
    display: flex;
    gap: 0.5rem;
  }

  &__input-group {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  &__label {
    font-size: 0.7rem;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    opacity: 0.75;
  }

  // deposit address
  &__deposit-addr {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  &__addr-row {
    display: flex;
    align-items: stretch;
    gap: 0.375rem;
  }

  &__addr-value {
    display: block;
    font-size: 0.65rem;
    word-break: break-all;
    padding: 0.375rem 0.5rem;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 0.25rem;
    border: 1px solid rgba(128, 128, 128, 0.15);
    color: var(--black-to-white);
    flex: 1;
  }

  &__copy-addr {
    flex-shrink: 0;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background: var(--dark-orange);
    color: var(--white);
    border: 1px solid var(--dark-orange);
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;

    &:hover { filter: brightness(1.05); }
  }

  &__provider-note {
    margin: 0.25rem 0 0;
    font-size: 0.65rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.7;
    text-align: center;
  }

  &__self-note {
    padding: 0.5rem 0.625rem;
    border-radius: 0.375rem;
    background: rgba(128, 128, 128, 0.08);
    border: 1px solid rgba(128, 128, 128, 0.2);
    color: var(--black-to-white);
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    line-height: 1.35;
  }

  &__addr-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.5rem;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 0.25rem;
    border: 1px solid var(--red, #dc3545);
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
    color: var(--red, #dc3545);

    .btn {
      font-size: 0.7rem;
      font-family: 'Space Mono', monospace;
      padding: 0.15rem 0.4rem;
    }
  }

  // progress section
  &__progress-section {
    margin-top: 0.25rem;
  }

  &__status {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    background: rgba(128, 128, 128, 0.08);
    border: 1px solid rgba(128, 128, 128, 0.15);
    display: flex;
    align-items: center;

    &--success {
      background: rgba(76, 175, 80, 0.12);
      border-color: var(--success-green);
      color: var(--success-green);
    }

    &--error {
      background: rgba(244, 67, 54, 0.12);
      border-color: var(--red);
      color: var(--red);
    }
  }

  &__status-detail {
    margin-left: 0.25rem;
    opacity: 0.8;
  }

  // ICP detected confirmation
  &__detected {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__detected-banner {
    padding: 0.5rem 0.75rem;
    background: rgba(76, 175, 80, 0.12);
    border: 1px solid var(--success-green);
    border-radius: 0.375rem;
    color: var(--success-green);
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
  }

  &__detected-hint {
    font-size: 0.65rem;
    opacity: 0.7;
    text-align: center;
  }

  // claim
  &__claim {
    border-top: 1px solid rgba(128, 128, 128, 0.15);
    padding-top: 0.75rem;
  }

  &__claim-desc {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }

  &__claim-result {
    margin-top: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;

    &--success {
      background: rgba(76, 175, 80, 0.12);
      color: var(--success-green);
    }

    &--error {
      background: rgba(244, 67, 54, 0.12);
      color: var(--red);
    }
  }

  // history
  &__history {
    border-top: 1px solid rgba(128, 128, 128, 0.15);
    padding-top: 0.75rem;
  }

  &__history-title {
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  &__table {
    width: 100%;
    font-size: 0.7rem;
    font-family: 'Space Mono', monospace;
    border-collapse: collapse;

    th, td {
      padding: 0.25rem 0.375rem;
      border-bottom: 1px solid rgba(128, 128, 128, 0.15);
    }

    th {
      font-size: 0.65rem;
      text-transform: uppercase;
      opacity: 0.7;
      font-weight: 600;
    }
  }
}

.taco-input {
  background: var(--orange-to-dark-brown);
  border: 1px solid var(--dark-orange-to-dark-brown);
  color: var(--black-to-white);
  font-family: 'Space Mono', monospace;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;

  &:focus {
    border-color: var(--dark-orange);
    outline: none;
    box-shadow: 0 0 0 2px rgba(218, 141, 40, 0.2);
  }
}

select.taco-input {
  background-color: var(--orange-to-dark-brown);

  option {
    background-color: var(--orange-to-dark-brown);
    color: var(--black-to-white);
    font-family: 'Space Mono', monospace;
  }
}
</style>
