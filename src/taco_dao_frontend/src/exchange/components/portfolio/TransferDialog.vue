<template>
  <Teleport to="body">
    <div v-if="visible" class="transfer-overlay" data-theme="exchange" @click.self="close">
      <div class="transfer-dialog" role="dialog" aria-label="Transfer token">
        <!-- Header -->
        <div class="transfer-dialog__header">
          <div class="transfer-dialog__title-row">
            <img v-if="tokenIcon" :src="tokenIcon" class="transfer-dialog__icon" width="28" height="28" />
            <h3 class="transfer-dialog__title">Send {{ token?.symbol }}</h3>
          </div>
          <button class="transfer-dialog__close" @click="close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="transfer-dialog__body">
          <!-- Balance -->
          <div class="transfer-dialog__balance num">
            Balance: {{ balanceFormatted }} {{ token?.symbol }}
          </div>

          <!-- Recipient -->
          <label class="transfer-dialog__label">Recipient</label>
          <input
            type="text"
            class="ex-input transfer-dialog__input"
            v-model="recipient"
            :placeholder="isICP ? 'Principal or Account ID (64-char hex)' : 'Principal'"
            :class="{ 'transfer-dialog__input--error': recipientError }"
          />
          <div v-if="recipientError" class="transfer-dialog__error">{{ recipientError }}</div>
          <div v-if="recipient.trim() && !recipientError" class="transfer-dialog__hint">
            {{ detectedType === 'accountId' ? 'Account ID detected' : 'Principal' }}
          </div>

          <!-- Subaccount (principal only) -->
          <div v-if="detectedType === 'principal' && recipient.trim() && !recipientError" class="transfer-dialog__subaccount">
            <label class="transfer-dialog__check">
              <input type="checkbox" v-model="useSubaccount" />
              <span>Send to subaccount</span>
            </label>
            <div v-if="useSubaccount" class="transfer-dialog__sub-input-wrap">
              <input
                type="text"
                class="ex-input transfer-dialog__input"
                v-model="subaccount"
                placeholder="64-character hex (32 bytes)"
                maxlength="64"
                :class="{ 'transfer-dialog__input--error': subaccountError }"
              />
              <div v-if="subaccountError" class="transfer-dialog__error">{{ subaccountError }}</div>
            </div>
          </div>

          <!-- Amount -->
          <label class="transfer-dialog__label">Amount</label>
          <div class="transfer-dialog__amount-row">
            <input
              type="number"
              class="ex-input transfer-dialog__input transfer-dialog__input--amount num"
              v-model="amountStr"
              placeholder="0.00"
              min="0"
              step="any"
              :class="{ 'transfer-dialog__input--error': amountError }"
            />
            <button class="transfer-dialog__max-btn" @click="setMaxAmount">MAX</button>
          </div>
          <div v-if="amountError" class="transfer-dialog__error">{{ amountError }}</div>

          <!-- Slider -->
          <div class="transfer-dialog__slider-wrap">
            <input
              type="range" min="0" max="100" step="1"
              v-model.number="pctSlider"
              class="transfer-dialog__slider"
              @input="setAmountFromPct(pctSlider)"
            />
            <div class="transfer-dialog__pct-row">
              <button
                v-for="pct in [25, 50, 75, 100]"
                :key="pct"
                class="transfer-dialog__pct-btn"
                :class="{ 'transfer-dialog__pct-btn--active': pctSlider === pct }"
                @click="setAmountFromPct(pct)"
              >{{ pct }}%</button>
            </div>
          </div>

          <!-- Summary -->
          <div class="transfer-dialog__summary">
            <div class="transfer-dialog__row">
              <span>Amount</span>
              <span class="num">{{ amountStr || '0' }} {{ token?.symbol }}</span>
            </div>
            <div class="transfer-dialog__row">
              <span>Fee</span>
              <span class="num">{{ feeFormatted }} {{ token?.symbol }}</span>
            </div>
            <div class="transfer-dialog__row transfer-dialog__row--total">
              <span>Total deducted</span>
              <span class="num">{{ totalDeductedFormatted }} {{ token?.symbol }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="transfer-dialog__footer">
          <button class="ex-btn ex-btn--md" @click="close">Cancel</button>
          <button
            class="ex-btn ex-btn--primary ex-btn--md"
            :disabled="!canSend || sending"
            @click="handleSend"
          >{{ sending ? 'Sending...' : 'Send' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Principal } from '@dfinity/principal'
import { Actor } from '@dfinity/agent'
import { getCachedAgent, getCachedIdentity } from '../../../shared/auth-cache'
import { getTokenIcon } from '../../utils/token-icons'

interface TransferToken {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: bigint
  transferFee: bigint
}

const props = defineProps<{
  visible: boolean
  token: TransferToken | null
}>()

const emit = defineEmits<{
  close: []
  sent: [{ address: string; amount: bigint }]
}>()

// Form state
const recipient = ref('')
const amountStr = ref('')
const pctSlider = ref(0)
const useSubaccount = ref(false)
const subaccount = ref('')
const sending = ref(false)
const recipientError = ref('')
const amountError = ref('')
const subaccountError = ref('')

const ICP_CANISTER = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const isICP = computed(() => props.token?.address === ICP_CANISTER)

const tokenIcon = computed(() => {
  if (!props.token) return null
  return getTokenIcon(props.token.symbol, props.token.name)
})

// Address type detection
const isAccountId = (v: string) => /^[a-f0-9]{64}$/i.test(v.trim())
const detectedType = computed<'principal' | 'accountId'>(() => {
  if (isICP.value && isAccountId(recipient.value)) return 'accountId'
  return 'principal'
})

// Amount math
const maxSendable = computed(() => {
  if (!props.token) return 0n
  return props.token.balance > props.token.transferFee
    ? props.token.balance - props.token.transferFee
    : 0n
})

const amountBigInt = computed(() => {
  if (!props.token || !amountStr.value) return 0n
  try {
    const n = parseFloat(amountStr.value)
    if (isNaN(n) || n <= 0) return 0n
    return BigInt(Math.floor(n * 10 ** props.token.decimals))
  } catch { return 0n }
})

const totalDeducted = computed(() => {
  if (!props.token) return 0n
  return amountBigInt.value + props.token.transferFee
})

const computedPct = computed(() => {
  if (maxSendable.value <= 0n || amountBigInt.value <= 0n) return 0
  return Math.min(100, Math.max(0, Number((amountBigInt.value * 100n) / maxSendable.value)))
})

// Formatting
function fmt(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const frac = amount % divisor
  if (frac === 0n) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '')
  return fracStr ? `${whole}.${fracStr}` : whole.toString()
}

const balanceFormatted = computed(() => {
  if (!props.token) return '0'
  return fmt(props.token.balance, props.token.decimals)
})

const feeFormatted = computed(() => {
  if (!props.token) return '0'
  return fmt(props.token.transferFee, props.token.decimals)
})

const totalDeductedFormatted = computed(() => {
  if (!props.token) return '0'
  return fmt(totalDeducted.value, props.token.decimals)
})

// Slider
function setAmountFromPct(pct: number) {
  if (!props.token) return
  pctSlider.value = pct
  if (pct === 0) { amountStr.value = ''; return }
  if (pct === 100) { setMaxAmount(); return }
  const scaled = (maxSendable.value * BigInt(pct)) / 100n
  amountStr.value = fmt(scaled, props.token.decimals)
}

function setMaxAmount() {
  if (!props.token) return
  amountStr.value = fmt(maxSendable.value, props.token.decimals)
  pctSlider.value = 100
}

// Validation
function validateRecipient() {
  recipientError.value = ''
  if (!recipient.value.trim()) return
  if (isICP.value && isAccountId(recipient.value)) return
  try {
    Principal.fromText(recipient.value.trim())
  } catch {
    recipientError.value = isICP.value
      ? 'Invalid principal or account ID'
      : 'Invalid principal'
  }
}

function validateAmount() {
  amountError.value = ''
  if (!amountStr.value || !props.token) return
  const n = parseFloat(amountStr.value)
  if (isNaN(n) || n <= 0) { amountError.value = 'Must be > 0'; return }
  if (amountBigInt.value <= 0n) { amountError.value = 'Amount too small'; return }
  if (totalDeducted.value > props.token.balance) { amountError.value = 'Insufficient balance (incl. fee)'; return }
}

function validateSubaccount() {
  subaccountError.value = ''
  if (!useSubaccount.value || !subaccount.value.trim()) return
  if (!/^[a-fA-F0-9]{64}$/.test(subaccount.value.trim())) {
    subaccountError.value = 'Must be 64 hex characters (32 bytes)'
  }
}

watch(recipient, validateRecipient)
watch(amountStr, () => { validateAmount(); pctSlider.value = computedPct.value })
watch([subaccount, useSubaccount], validateSubaccount)
watch(detectedType, (t) => {
  if (t === 'accountId') {
    useSubaccount.value = false
    subaccount.value = ''
    subaccountError.value = ''
  }
})
watch(() => props.visible, (v) => { if (v) resetForm() })

const canSend = computed(() =>
  !recipientError.value &&
  !amountError.value &&
  !subaccountError.value &&
  (!useSubaccount.value || subaccount.value.trim() !== '') &&
  recipient.value.trim() !== '' &&
  amountStr.value !== '' &&
  amountBigInt.value > 0n &&
  totalDeducted.value <= (props.token?.balance ?? 0n)
)

function resetForm() {
  recipient.value = ''
  amountStr.value = ''
  pctSlider.value = 0
  useSubaccount.value = false
  subaccount.value = ''
  recipientError.value = ''
  amountError.value = ''
  subaccountError.value = ''
  sending.value = false
}

function close() {
  resetForm()
  emit('close')
}

// IDLs
const icrc1TransferIdl = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  })
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
      BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
      InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
      TooOld: IDL.Null,
      CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
      Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
      TemporarilyUnavailable: IDL.Null,
      GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
    }),
  })
  return IDL.Service({
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], []),
  })
}

const icpLedgerIdl = ({ IDL }: { IDL: any }) => {
  const Tokens = IDL.Record({ e8s: IDL.Nat64 })
  const TimeStamp = IDL.Record({ timestamp_nanos: IDL.Nat64 })
  const SendArgs = IDL.Record({
    to: IDL.Text,
    fee: Tokens,
    memo: IDL.Nat64,
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(TimeStamp),
    amount: Tokens,
  })
  return IDL.Service({
    send_dfx: IDL.Func([SendArgs], [IDL.Nat64], []),
  })
}

async function handleSend() {
  if (!canSend.value || sending.value || !props.token) return
  validateRecipient()
  validateAmount()
  validateSubaccount()
  if (recipientError.value || amountError.value || subaccountError.value) return

  sending.value = true
  try {
    const agent = await getCachedAgent()
    if (!agent) throw new Error('Not authenticated')

    const token = props.token
    const amount = amountBigInt.value

    if (detectedType.value === 'accountId') {
      // ICP legacy transfer by account ID
      const actor = Actor.createActor(icpLedgerIdl, { agent, canisterId: ICP_CANISTER })
      await actor.send_dfx({
        to: recipient.value.trim(),
        fee: { e8s: token.transferFee },
        memo: 0n,
        from_subaccount: [],
        created_at_time: [],
        amount: { e8s: amount },
      })
    } else {
      // ICRC-1 transfer by principal (+ optional subaccount)
      const subBytes = useSubaccount.value && subaccount.value.trim()
        ? [new Uint8Array(subaccount.value.trim().match(/.{1,2}/g)!.map(b => parseInt(b, 16)))]
        : []

      const actor = Actor.createActor(icrc1TransferIdl, { agent, canisterId: token.address })
      const result = await actor.icrc1_transfer({
        to: {
          owner: Principal.fromText(recipient.value.trim()),
          subaccount: subBytes,
        },
        amount,
        fee: [token.transferFee],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
      }) as { Ok?: bigint; Err?: any }

      if (result.Err) {
        const errKey = Object.keys(result.Err)[0]
        const errVal = (result.Err as any)[errKey]
        if (errKey === 'InsufficientFunds') {
          throw new Error(`Insufficient funds. Balance: ${fmt(errVal.balance, token.decimals)} ${token.symbol}`)
        }
        throw new Error(`${errKey}: ${JSON.stringify(errVal)}`)
      }
    }

    emit('sent', { address: token.address, amount })
    close()
  } catch (err: any) {
    amountError.value = err.message || 'Transfer failed'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped lang="scss">
.transfer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.transfer-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  width: 420px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__icon {
    border-radius: 50%;
    object-fit: cover;
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    &:hover { color: var(--text-primary); }
  }

  &__body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__balance {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: -8px;
  }

  &__input {
    width: 100%;
    &--amount { flex: 1; }
    &--error { border-color: var(--color-sell) !important; }
  }

  &__error {
    font-size: var(--text-xs);
    color: var(--color-sell);
    margin-top: -6px;
  }

  &__hint {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-top: -6px;
  }

  &__subaccount {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__check {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
    input { accent-color: var(--accent-primary); }
  }

  &__sub-input-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__amount-row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  &__max-btn {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;
    &:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
  }

  &__slider-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--bg-tertiary);
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent-primary);
      cursor: pointer;
    }
    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent-primary);
      border: none;
      cursor: pointer;
    }
  }

  &__pct-row {
    display: flex;
    gap: var(--space-1);
  }

  &__pct-btn {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    padding: var(--space-1) 0;
    border: 1px solid var(--border-primary);
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;

    &:hover, &--active {
      background: var(--accent-primary-muted);
      color: var(--accent-primary);
      border-color: var(--accent-primary);
    }
  }

  &__summary {
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    overflow: hidden;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-primary);

    &:last-child { border-bottom: none; }

    &--total {
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }
  }

  &__footer {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    border-top: 1px solid var(--border-primary);
    justify-content: flex-end;
  }
}
</style>
