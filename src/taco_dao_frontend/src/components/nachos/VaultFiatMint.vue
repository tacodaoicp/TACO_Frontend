<template>

  <div class="vault-fiat-mint">

    <!-- provider toggle -->
    <div class="vault-fiat-mint__provider-toggle">
      <button :class="['vault-fiat-mint__provider-btn', { active: selectedProvider === 'coinbase' }]"
              :disabled="isActive"
              @click="selectedProvider = 'coinbase'">
        Coinbase
      </button>
      <button :class="['vault-fiat-mint__provider-btn', { active: selectedProvider === 'transak' }]"
              :disabled="isActive"
              @click="selectedProvider = 'transak'">
        Transak
      </button>
    </div>

    <!-- amount + currency -->
    <div class="vault-fiat-mint__amount-row">
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

    <!-- deposit address -->
    <div class="vault-fiat-mint__deposit-addr">
      <label class="vault-fiat-mint__label">Your ICP Address</label>
      <code v-if="userLedgerAccountId" class="vault-fiat-mint__addr-value">{{ userLedgerAccountId }}</code>
      <code v-else class="vault-fiat-mint__addr-value">
        <i class="fa-solid fa-spinner fa-spin me-1"></i>Log in to see your address
      </code>
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
import { signedSessionHeaders } from '../../utils/sign-session-request'
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

const COINBASE_SESSION_WORKER = 'https://taco-onramp-session.xykominos.workers.dev'
const TRANSAK_API_KEY = 'fac6ce0c-2b65-4982-a2e3-42e1c5fa15dc'
const TRANSAK_BASE_URL = 'https://global-stg.transak.com'
const TACO_BRAND_COLOR = 'DA8D28'
const DEPOSIT_POLL_MS = 3_000
const MAX_POLL_DURATION_MS = 1_200_000
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const DEPOSIT_MIN_E8S = 10_000n

///////////
// state //
///////////

type MintPhase = 'idle' | 'detecting' | 'minting' | 'complete' | 'error'
type Provider = 'coinbase' | 'transak'

const selectedProvider = ref<Provider>('coinbase')
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

// Transak SDK ref
let transakInstance: any = null

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
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
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

const generateOrderId = (): string => {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `nachos-${ts}-${rand}`
}

////////////////////
// payment flows  //
////////////////////

const openBuy = () => {
  if (selectedProvider.value === 'coinbase') openCoinbase()
  else openTransak()
}

const buildTransakUrl = (addr: string): string => {
  const params = new URLSearchParams({
    apiKey: TRANSAK_API_KEY,
    referrerDomain: window.location.origin,
    productsAvailed: 'BUY',
    cryptoCurrencyCode: 'ICP',
    cryptoCurrencyList: 'ICP',
    network: 'mainnet',
    walletAddress: addr,
    disableWalletAddressForm: 'true',
    exchangeScreenTitle: 'Buy NACHOS',
    themeColor: TACO_BRAND_COLOR,
    hideMenu: 'true',
    hideExchangeScreen: 'true',
    isFeeCalculationHidden: 'true',
    defaultFiatCurrency: fiatCurrency.value,
    defaultFiatAmount: fiatAmount.value || '50',
    partnerCustomerId: userPrincipal.value,
    partnerOrderId: generateOrderId(),
    colorMode: 'DARK',
  })
  return `${TRANSAK_BASE_URL}?${params.toString()}`
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

const openCoinbase = async () => {
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

    const sessionBody = {
      addresses: [{ address: userLedgerAccountId.value }],
      assets: ['ICP'],
    }
    const resp = await fetch(COINBASE_SESSION_WORKER, {
      method: 'POST',
      headers: await signedSessionHeaders(sessionBody, tacoStore.signWithUserIdentity),
      body: JSON.stringify(sessionBody),
    })
    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(`Session token error: ${err.error} ${err.details || ''}`)
    }
    const { token: sessionToken } = await resp.json()

    const { generateOnRampURL } = await import('@coinbase/cbpay-js')
    const onrampUrl = generateOnRampURL({
      sessionToken,
      addresses: { [userLedgerAccountId.value]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    const popup = window.open(onrampUrl, 'coinbase-onramp', 'width=500,height=700,scrollbars=yes,resizable=yes')
    startDepositPolling()

    const popupPoll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupPoll)
        handlePopupClose()
      }
    }, 1500)

  } catch (err: any) {
    console.error('Failed to open Coinbase Onramp (NACHOS vault):', err)
    mintPhase.value = 'error'
    mintError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

const openTransak = async () => {
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

    const { Transak } = await import('@transak/ui-js-sdk')
    const widgetUrl = buildTransakUrl(userLedgerAccountId.value)
    transakInstance = new Transak({ widgetUrl })
    transakInstance.init()
    startDepositPolling()

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data: any) => {
      console.log('Transak order created (vault NACHOS):', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data: any) => {
      console.log('Transak order successful (vault NACHOS):', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      if (transakInstance) {
        transakInstance.close()
        transakInstance = null
      }
      handlePopupClose()
    })

  } catch (err: any) {
    console.error('Failed to initialize Transak (vault NACHOS):', err)
    mintPhase.value = 'error'
    mintError.value = `Failed to open payment widget: ${err.message || err}`
  }
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
  if (transakInstance && typeof transakInstance.close === 'function') {
    transakInstance.close()
  }
  transakInstance = null
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

  &__addr-value {
    display: block;
    font-size: 0.65rem;
    word-break: break-all;
    padding: 0.375rem 0.5rem;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 0.25rem;
    border: 1px solid rgba(128, 128, 128, 0.15);
    color: var(--black-to-white);
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
