<template>

  <div class="vault-fiat-mint">

    <!-- system paused banner -->
    <div v-if="systemPaused" class="vault-fiat-mint__paused">
      <i class="fa-solid fa-triangle-exclamation"></i>
      System paused for maintenance. Purchases may be delayed.
    </div>

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
      <code v-if="depositAddress" class="vault-fiat-mint__addr-value">{{ depositAddress }}</code>
      <div v-else-if="addrError" class="vault-fiat-mint__addr-error">
        <span>Failed to load address</span>
        <button class="btn btn-sm taco-btn" @click="loadDashboard()">
          <i class="fa-solid fa-arrows-rotate me-1"></i>Retry
        </button>
      </div>
      <code v-else class="vault-fiat-mint__addr-value">
        <i class="fa-solid fa-spinner fa-spin me-1"></i>Loading...
      </code>
    </div>

    <!-- buy button -->
    <button class="btn taco-btn taco-btn--green w-100"
            :disabled="isActive || !depositAddress || systemPaused"
            @click="openBuy">
      <i v-if="isActive" class="fa-solid fa-spinner fa-spin me-2"></i>
      {{ buyButtonText }}
    </button>

    <!-- progress tracker -->
    <div v-if="showProgress" class="vault-fiat-mint__progress-section">
      <SwapProgressTracker
        :steps="NACHOS_STEPS"
        :current-step="currentStep"
        :status="trackerStatus"
        :status-message="statusMessage"
        :retry-count="nachosProgress ? Number(nachosProgress.retryCount) : 0"
        :max-retries="MAX_RETRIES"
        :error-message="progressError || phaseError"
        :amounts="progressAmounts"
        :elapsed="elapsed"
      />
    </div>

    <!-- claim section -->
    <div v-if="!isActive" class="vault-fiat-mint__claim">
      <p class="vault-fiat-mint__claim-desc">
        If your purchase completed but NACHOS was not delivered automatically,
        use this button to trigger a manual claim.
      </p>
      <button class="btn taco-btn taco-btn--green"
              :disabled="claiming"
              @click="claimNachos">
        <i v-if="claiming" class="fa-solid fa-spinner fa-spin me-2"></i>
        {{ claiming ? 'Claiming...' : 'Claim NACHOS' }}
      </button>
      <div v-if="claimResult"
           class="vault-fiat-mint__claim-result"
           :class="claimResult.success ? 'vault-fiat-mint__claim-result--success' : 'vault-fiat-mint__claim-result--error'">
        {{ claimResult.message }}
      </div>
    </div>

    <!-- order history -->
    <div v-if="orderHistory.length > 0" class="vault-fiat-mint__history">
      <h4 class="vault-fiat-mint__history-title">Fiat Order History</h4>
      <table class="vault-fiat-mint__table">
        <thead>
          <tr>
            <th>Date</th>
            <th class="text-end">Fiat</th>
            <th class="text-end">ICP In</th>
            <th class="text-end">NACHOS Out</th>
            <th class="text-end">NAV</th>
            <th class="text-end">Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orderHistory" :key="Number(order.id)">
            <td>{{ formatTimestamp(order.timestamp) }}</td>
            <td class="text-end">{{ formatFiat(order.fiatAmount, order.fiatCurrency) }}</td>
            <td class="text-end">{{ formatE8s(order.icpDeposited) }}</td>
            <td class="text-end">{{ formatE8s(order.nachosReceived) }}</td>
            <td class="text-end">{{ formatE8s(order.navUsed) }}</td>
            <td class="text-end">{{ formatE8s(order.feeICP) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

</template>

<script setup lang="ts">

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { storeToRefs } from 'pinia'
import { Principal } from '@dfinity/principal'
import { signedSessionHeaders } from '../../utils/sign-session-request'
import SwapProgressTracker from '../misc/SwapProgressTracker.vue'
import type { ProgressStep, ProgressAmount } from '../misc/SwapProgressTracker.vue'
import type { SwapDashboard, NachosSwapProgress, NachosOrderRecord } from '../../../../declarations/taco_swap/taco_swap.did'

const emit = defineEmits<{ (e: 'operation-complete'): void }>()

const tacoStore = useTacoStore()
const { userPrincipal } = storeToRefs(tacoStore)

///////////////
// constants //
///////////////

const COINBASE_SESSION_WORKER = 'https://taco-onramp-session.xykominos.workers.dev'
const TRANSAK_API_KEY = 'fac6ce0c-2b65-4982-a2e3-42e1c5fa15dc'
const TRANSAK_BASE_URL = 'https://global-stg.transak.com'
const TACO_BRAND_COLOR = 'DA8D28'
const MAX_RETRIES = 3
const POLL_ACTIVE_MS = 2_000
const POLL_PENDING_MS = 10_000
const DEPOSIT_POLL_MS = 3_000
const MAX_POLL_DURATION_MS = 1_200_000
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const DEPOSIT_MIN_E8S = 10_000n

const NACHOS_STEPS: ProgressStep[] = [
  { key: 'deposit',  label: 'Fund Wallet',        description: 'ICP arriving at your address',                   activeDescription: 'Watching for your ICP deposit...' },
  { key: 'treasury', label: 'Treasury Transfer',  description: 'Moving ICP to the NACHOS treasury',             activeDescription: 'Transferring ICP to treasury...' },
  { key: 'minting',  label: 'Mint NACHOS',        description: 'Minting NACHOS tokens based on current NAV',    activeDescription: 'Minting your NACHOS...' },
  { key: 'done',     label: 'Complete',            description: 'NACHOS delivered to your wallet',               activeDescription: 'Done!' },
]

///////////
// state //
///////////

type UIPhase = 'idle' | 'registering' | 'polling' | 'success' | 'error'
type Provider = 'coinbase' | 'transak'

const selectedProvider = ref<Provider>('coinbase')
const fiatAmount = ref('50')
const fiatCurrency = ref('EUR')

const phase = ref<UIPhase>('idle')
const phaseError = ref<string | null>(null)
const nachosProgress = ref<NachosSwapProgress | null>(null)
const depositAddress = ref('')
const depositBalance = ref<bigint>(0n)
const orderHistory = ref<NachosOrderRecord[]>([])
const systemPaused = ref(false)
const claiming = ref(false)
const claimResult = ref<{ success: boolean; message: string } | null>(null)

// Deposit subaccount (from get_full_swap_state)
const depositSubaccount = ref<Uint8Array | null>(null)

// Transak SDK ref
let transakInstance: any = null

// Polling
let depositPollInterval: ReturnType<typeof setInterval> | null = null
let unifiedPollInterval: ReturnType<typeof setInterval> | null = null
let currentPollRate = 0

// Elapsed timer
const startTime = ref<number | null>(null)
const elapsed = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

//////////////
// computed //
//////////////

const isActive = computed(() =>
  phase.value === 'registering' || phase.value === 'polling'
)

const showProgress = computed(() =>
  phase.value !== 'idle'
)

const isDepositPolling = computed(() =>
  phase.value === 'polling' && depositPollInterval !== null
)

const currentStep = computed(() => {
  if (!nachosProgress.value) {
    if (isDepositPolling.value) return 0
    return -1
  }
  return Number(nachosProgress.value.stepNumber)
})

const isComplete = computed(() =>
  nachosProgress.value != null && 'Complete' in nachosProgress.value.step
)

const isFailed = computed(() =>
  nachosProgress.value != null && 'Failed' in nachosProgress.value.step
)

const progressIcp = computed(() => {
  const amt = nachosProgress.value?.icpAmount
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressEstimated = computed(() => {
  const amt = nachosProgress.value?.estimatedNachos
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressActual = computed(() => {
  const amt = nachosProgress.value?.actualNachos
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressError = computed(() => {
  const msg = nachosProgress.value?.errorMessage
  return msg && msg.length > 0 ? (msg[0] as string) : null
})

const trackerStatus = computed<'idle' | 'active' | 'complete' | 'failed'>(() => {
  if (phase.value === 'success' || isComplete.value) return 'complete'
  if (phase.value === 'error' || isFailed.value) return 'failed'
  if (isActive.value) return 'active'
  return 'idle'
})

const progressAmounts = computed<ProgressAmount[]>(() => {
  const items: ProgressAmount[] = []
  if (fiatAmount.value && isActive.value) items.push({ label: 'Fiat paid', value: `${fiatAmount.value} ${fiatCurrency.value}` })
  if (progressIcp.value) items.push({ label: 'ICP deposited', value: `${progressIcp.value} ICP` })
  if (progressEstimated.value && !isComplete.value) items.push({ label: 'Estimated NACHOS', value: `~${progressEstimated.value}` })
  if (progressActual.value) items.push({ label: 'NACHOS received', value: `${progressActual.value} NACHOS`, highlight: true })
  return items
})

const buyButtonText = computed(() => {
  if (systemPaused.value) return 'System Paused'
  if (phase.value === 'registering') return 'Starting...'
  if (phase.value === 'polling') {
    if (isDepositPolling.value) return 'Waiting for ICP...'
    if (nachosProgress.value) {
      const step = nachosProgress.value.step
      if ('NotStarted' in step) return 'Waiting for ICP...'
      if ('DepositReceived' in step) return 'Deposit received...'
      if ('TransferringToTreasury' in step) return 'Transferring...'
      if ('MintingNachos' in step) return 'Minting...'
      return 'Processing...'
    }
  }
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
})

const statusMessage = computed(() => {
  if (phase.value === 'registering') return 'Starting NACHOS mint...'
  if (isDepositPolling.value) {
    if (depositBalance.value > 0n) return `ICP deposit detected: ${formatE8s(depositBalance.value)} ICP — claiming...`
    return 'Waiting for ICP deposit...'
  }
  if (nachosProgress.value && phase.value !== 'idle') return nachosProgress.value.description
  if (phase.value === 'error') return phaseError.value || 'An error occurred.'
  if (phase.value === 'success') return 'NACHOS delivered to your wallet!'
  return ''
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

const formatTimestamp = (ns: bigint): string => {
  const ms = Number(ns / 1_000_000n)
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatFiat = (amount: [] | [string], currency: [] | [string]): string => {
  const a = amount?.[0]
  const c = currency?.[0]
  if (!a) return '—'
  return c ? `${a} ${c}` : a
}

const generateOrderId = (): string => {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `nachos-${ts}-${rand}`
}

//////////////////
// elapsed time //
//////////////////

const startElapsedTimer = () => {
  if (elapsedInterval) return
  startTime.value = Date.now()
  elapsed.value = 0
  elapsedInterval = setInterval(() => {
    if (startTime.value != null && isActive.value) {
      elapsed.value = Math.floor((Date.now() - startTime.value) / 1000)
    } else {
      stopElapsedTimer()
    }
  }, 1000)
}

const stopElapsedTimer = () => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
}

/////////////////
// data loading //
/////////////////

const addrError = ref(false)

/** Load canister config (system paused state) — anonymous, works pre-login */
const loadConfig = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActorAnonymous()
    const config = await (actor as any).get_config()
    systemPaused.value = config.systemPaused
  } catch (err) {
    console.error('Failed to load swap config:', err)
  }
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

const openCoinbase = async () => {
  if (!depositAddress.value) {
    phaseError.value = 'Deposit address not loaded. Please refresh and try again.'
    phase.value = 'error'
    return
  }

  phase.value = 'registering'
  phaseError.value = null
  claimResult.value = null
  nachosProgress.value = null

  try {
    const sessionBody = {
      addresses: [{ address: depositAddress.value }],
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
      addresses: { [depositAddress.value]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    phase.value = 'polling'
    startElapsedTimer()
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
    phase.value = 'error'
    phaseError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

const openTransak = async () => {
  if (!depositAddress.value) {
    phaseError.value = 'Deposit address not loaded. Please refresh and try again.'
    phase.value = 'error'
    return
  }

  phase.value = 'registering'
  phaseError.value = null
  claimResult.value = null
  nachosProgress.value = null

  try {
    phase.value = 'polling'
    startElapsedTimer()

    const { Transak } = await import('@transak/ui-js-sdk')
    const widgetUrl = buildTransakUrl(depositAddress.value)
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
    phase.value = 'error'
    phaseError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

////////////////////
// popup close    //
////////////////////

const handlePopupClose = () => {
  if (phase.value === 'polling' && nachosProgress.value) {
    const step = nachosProgress.value.step
    if ('NotStarted' in step || 'WaitingForDeposit' in step) {
      setTimeout(() => {
        if (phase.value === 'polling' && nachosProgress.value) {
          const cur = nachosProgress.value.step
          if ('NotStarted' in cur || 'WaitingForDeposit' in cur) {
            phase.value = 'idle'
            nachosProgress.value = null
            stopDepositPolling()
            maybeStopPolling()
          }
        }
      }, 300_000)
    }
  } else if (phase.value === 'polling' && !nachosProgress.value) {
    setTimeout(() => {
      if (phase.value === 'polling' && !nachosProgress.value) {
        phase.value = 'idle'
        stopDepositPolling()
        maybeStopPolling()
      }
    }, 300_000)
  }
}

/////////////////////
// claim handler   //
/////////////////////

const handleClaimResult = (result: any): boolean => {
  if ('Success' in result) {
    const { nachosAmount, mintId, orderId: oid } = result.Success
    phase.value = 'success'
    claimResult.value = {
      success: true,
      message: `Received ${formatE8s(nachosAmount)} NACHOS! (mint: ${mintId}, order: ${oid})`
    }
    refreshOrders().catch(console.error)
    emit('operation-complete')
    return true
  }
  if ('NoDeposit' in result) return false
  if ('AlreadyProcessing' in result) return false
  if ('BelowMinimum' in result) {
    const { balance, minimum } = result.BelowMinimum
    phase.value = 'error'
    phaseError.value = `Deposit too small: ${formatE8s(balance)} ICP (min: ${formatE8s(minimum)} ICP)`
    return true
  }
  if ('MintFailed' in result) {
    phaseError.value = `Mint failed: ${result.MintFailed}. Will auto-retry.`
    return false
  }
  if ('SystemPaused' in result) {
    phase.value = 'error'
    phaseError.value = 'System paused. Your ICP is safe.'
    return true
  }
  if ('RateLimited' in result) return false
  if ('NotAuthorized' in result) {
    phase.value = 'error'
    phaseError.value = 'Not authorized. Please log in again.'
    return true
  }
  return false
}

/////////////////////
// deposit polling //
/////////////////////

const startDepositPolling = () => {
  stopDepositPolling()
  const startedAt = Date.now()
  const swapCanisterId = tacoStore.tacoSwapCanisterId()

  depositPollInterval = setInterval(async () => {
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopDepositPolling()
      if (phase.value === 'polling') {
        phase.value = 'error'
        phaseError.value = 'Timed out waiting for ICP deposit.'
      }
      return
    }

    if (!depositSubaccount.value) return

    const balance = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(swapCanisterId),
      depositSubaccount.value instanceof Uint8Array ? depositSubaccount.value : new Uint8Array(depositSubaccount.value)
    )

    if (balance === false) return

    const balanceBigInt = BigInt(balance)
    depositBalance.value = balanceBigInt

    if (balanceBigInt > DEPOSIT_MIN_E8S) {
      stopDepositPolling()
      try {
        const actor = await tacoStore.createTacoSwapActor()
        const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])
        const done = handleClaimResult(result)
        if (!done && phase.value === 'polling') {
          startUnifiedPolling(POLL_ACTIVE_MS)
        }
      } catch (err) {
        console.error('Auto-claim NACHOS (vault fiat) failed:', err)
        startUnifiedPolling(POLL_ACTIVE_MS)
      }
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
// unified polling //
/////////////////////

const startUnifiedPolling = (intervalMs: number) => {
  if (unifiedPollInterval && intervalMs >= currentPollRate) return
  stopUnifiedPolling()
  currentPollRate = intervalMs
  const startedAt = Date.now()

  unifiedPollInterval = setInterval(async () => {
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopUnifiedPolling()
      if (phase.value === 'polling') {
        phase.value = 'error'
        phaseError.value = 'Mint timed out. You can try the manual "Claim NACHOS" button below.'
      }
      return
    }

    try {
      const actor = await tacoStore.createTacoSwapActor()
      const db: SwapDashboard = await (actor as any).getSwapDashboard()

      if (phase.value === 'polling') {
        nachosProgress.value = db.nachosStatus
        const step = db.nachosStatus.step

        if ('Complete' in step) {
          phase.value = 'success'
          orderHistory.value = db.recentNachosOrders
          emit('operation-complete')
          maybeStopPolling()
          return
        }

        if ('Failed' in step && !db.hasPendingNachos) {
          phase.value = 'error'
          phaseError.value = progressError.value
            || 'Mint failed. Use the manual Claim button or contact support.'
          maybeStopPolling()
          return
        }
      }
    } catch (err) {
      console.error('Error polling swap dashboard (vault fiat):', err)
    }
  }, intervalMs)
}

const maybeStopPolling = () => {
  if (phase.value !== 'polling') {
    stopUnifiedPolling()
  }
}

const stopUnifiedPolling = () => {
  if (unifiedPollInterval) {
    clearInterval(unifiedPollInterval)
    unifiedPollInterval = null
    currentPollRate = 0
  }
}

/////////////////////////
// dashboard loading   //
/////////////////////////

/**
 * Load all swap data from a single getSwapDashboard() query.
 * Populates address, orders, config, subaccount, and evaluates NACHOS phase state.
 */
const loadDashboard = async () => {
  addrError.value = false

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const db: SwapDashboard = await (actor as any).getSwapDashboard()

    // --- Populate state ---
    depositAddress.value = db.nachosDepositAddress
    orderHistory.value = db.recentNachosOrders
    systemPaused.value = db.config.systemPaused

    depositSubaccount.value = db.nachosDepositSubaccount instanceof Uint8Array
      ? db.nachosDepositSubaccount
      : new Uint8Array(db.nachosDepositSubaccount)

    // --- NACHOS phase evaluation ---
    const step = db.nachosStatus.step
    const isNotStarted = 'NotStarted' in step
    const isWaiting = 'WaitingForDeposit' in step
    const isComplete_ = 'Complete' in step
    const isFailed_ = 'Failed' in step

    const isStale = !db.hasActiveLock && !db.hasPendingNachos
      && (isNotStarted || isWaiting)

    if (isStale) {
      // idle
    } else if (isComplete_) {
      const updatedMs = Number(db.nachosStatus.updatedAt / 1_000_000n)
      if (Date.now() - updatedMs < 300_000) {
        nachosProgress.value = db.nachosStatus
        phase.value = 'success'
      }
    } else if (isFailed_ && !db.hasPendingNachos) {
      nachosProgress.value = db.nachosStatus
      phase.value = 'error'
      phaseError.value = db.nachosStatus.errorMessage.length > 0
        ? (db.nachosStatus.errorMessage[0] as string)
        : 'Mint failed. Use the manual Claim button.'
    } else if (isFailed_ && db.hasPendingNachos) {
      nachosProgress.value = db.nachosStatus
      phase.value = 'polling'
      startElapsedTimer()
      startUnifiedPolling(POLL_PENDING_MS)
    } else if (isWaiting && db.hasActiveLock) {
      nachosProgress.value = db.nachosStatus
      phase.value = 'polling'
      startElapsedTimer()
      startDepositPolling()
    } else if (!isNotStarted && !isWaiting) {
      nachosProgress.value = db.nachosStatus
      phase.value = 'polling'
      startElapsedTimer()
      startUnifiedPolling(POLL_ACTIVE_MS)
    }
  } catch (err) {
    console.error('Failed to load swap dashboard (vault fiat):', err)
    if (!depositAddress.value) addrError.value = true
  }
}

/**
 * Refresh only order history from the dashboard.
 * Called after successful claims — does NOT re-evaluate phase state.
 */
const refreshOrders = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    const db: SwapDashboard = await (actor as any).getSwapDashboard()
    orderHistory.value = db.recentNachosOrders
  } catch (err) {
    console.error('Failed to refresh orders:', err)
  }
}

///////////////////
// manual claim  //
///////////////////

const claimNachos = async () => {
  claiming.value = true
  claimResult.value = null

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])

    const done = handleClaimResult(result)

    if (!done) {
      if ('NoDeposit' in result) {
        claimResult.value = {
          success: false,
          message: 'No pending ICP found. If you recently paid, please wait a few minutes for the ICP to arrive.'
        }
      } else if ('AlreadyProcessing' in result) {
        claimResult.value = {
          success: false,
          message: 'A mint is already in progress for your account. Please wait a moment.'
        }
      } else if ('RateLimited' in result) {
        claimResult.value = {
          success: false,
          message: 'Too many requests. Please wait a minute before trying again.'
        }
      }
    }
  } catch (err: any) {
    claimResult.value = {
      success: false,
      message: `Claim error: ${err.message || err}`
    }
  } finally {
    claiming.value = false
  }
}

///////////////
// lifecycle //
///////////////

onMounted(async () => {
  loadConfig().catch(console.error)
  if (tacoStore.userLoggedIn) {
    loadDashboard().catch(console.error)
  }
})

watch(() => tacoStore.userLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadDashboard().catch(console.error)
  } else {
    depositAddress.value = ''
    orderHistory.value = []
    nachosProgress.value = null
    phase.value = 'idle'
    stopDepositPolling()
    stopUnifiedPolling()
    stopElapsedTimer()
  }
})

onBeforeUnmount(() => {
  stopDepositPolling()
  stopUnifiedPolling()
  stopElapsedTimer()
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
      background-color: var(--light-orange-to-dark-brown);
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
