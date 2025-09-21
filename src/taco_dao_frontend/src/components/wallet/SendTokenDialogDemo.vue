<template>
  <div v-if="show" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-lg">
      <div class="modal-content bg-dark text-white">
        <div class="modal-header">
          <h5 class="modal-title">
            <img v-if="token" :src="token.logo" :alt="token.symbol" class="token-logo me-2" />
            Send {{ token?.symbol || 'Token' }}
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="handleClose"></button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="handleSend" v-if="token">
            
            <!-- Token Info -->
            <div class="token-info-card mb-4">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">{{ token.name }}</h6>
                  <small class="text-muted">{{ token.symbol }}</small>
                </div>
                <div class="text-end">
                  <div class="balance-display">
                    {{ formatBalance(token.balance, token.decimals) }} {{ token.symbol }}
                  </div>
                  <small class="text-muted">Available Balance</small>
                </div>
              </div>
            </div>

            <!-- Recipient Address -->
            <div class="mb-3">
              <label class="form-label">
                Recipient Address <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                class="form-control" 
                v-model="recipient" 
                required
                :class="{ 'is-invalid': recipientError }"
                placeholder="Enter recipient principal or account ID"
              />
              <div v-if="recipientError" class="invalid-feedback">
                {{ recipientError }}
              </div>
              <small class="text-muted">
                Enter a valid principal ID or account identifier
              </small>
            </div>

            <!-- Amount Input -->
            <div class="mb-3">
              <label class="form-label">
                Amount <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="amount"
                  required
                  min="0"
                  :max="maxAmount"
                  step="any"
                  :class="{ 'is-invalid': amountError }"
                  placeholder="0.00"
                />
                <span class="input-group-text">{{ token.symbol }}</span>
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="setMaxAmount"
                  :disabled="maxAmountBigInt <= 0n"
                >
                  MAX
                </button>
              </div>
              <div v-if="amountError" class="invalid-feedback d-block">
                {{ amountError }}
              </div>
              <small class="text-muted">
                Maximum: {{ formatBalance(maxAmountBigInt, token.decimals) }} {{ token.symbol }}
              </small>
            </div>

            <!-- Transaction Details -->
            <div class="transaction-details mb-4">
              <div class="details-header">
                <h6>Transaction Details</h6>
              </div>
              <div class="details-body">
                <div class="detail-row">
                  <span>Amount to send:</span>
                  <span>{{ amount || '0' }} {{ token.symbol }}</span>
                </div>
                <div class="detail-row">
                  <span>Transaction fee:</span>
                  <span>{{ formatBalance(token.fee, token.decimals) }} {{ token.symbol }}</span>
                </div>
                <div class="detail-row total-row">
                  <span><strong>Total deducted:</strong></span>
                  <span><strong>{{ formatBalance(totalDeducted, token.decimals) }} {{ token.symbol }}</strong></span>
                </div>
                <div v-if="token.priceUSD && token.priceUSD > 0" class="detail-row">
                  <span>Estimated USD value:</span>
                  <span>${{ formatUSDValue(totalDeducted, token.decimals, token.priceUSD) }}</span>
                </div>
              </div>
            </div>

            <!-- Memo (Optional) -->
            <div class="mb-4">
              <label class="form-label">
                Memo (Optional)
              </label>
              <textarea 
                class="form-control" 
                v-model="memo"
                rows="2"
                maxlength="32"
                placeholder="Optional transaction memo"
              ></textarea>
              <small class="text-muted">{{ memo.length }}/32 characters</small>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" @click="handleClose">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!canSend || submitting"
              >
                {{ submitting ? 'Sending...' : 'Send Transaction' }}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Principal } from '@dfinity/principal'

interface SendTokenProps {
  show: boolean
  token: {
    principal: string
    name: string
    symbol: string
    logo: string
    balance: bigint
    decimals: number
    fee: bigint
    priceUSD?: number
  } | null
}

interface SendTokenEmits {
  (e: 'close'): void
  (e: 'send', params: { recipient: string; amount: bigint; memo?: string }): void
}

const props = defineProps<SendTokenProps>()
const emit = defineEmits<SendTokenEmits>()

// Form state
const recipient = ref('')
const amount = ref('')
const memo = ref('')
const submitting = ref(false)

// Validation
const recipientError = ref('')
const amountError = ref('')

// Computed values
const maxAmountBigInt = computed(() => {
  if (!props.token) return 0n
  return props.token.balance > props.token.fee ? props.token.balance - props.token.fee : 0n
})

const maxAmount = computed(() => {
  if (!props.token) return '0'
  return formatBalance(maxAmountBigInt.value, props.token.decimals)
})

const amountBigInt = computed(() => {
  if (!props.token || !amount.value) return 0n
  try {
    const amountNum = parseFloat(amount.value)
    if (isNaN(amountNum) || amountNum <= 0) return 0n
    return BigInt(Math.floor(amountNum * (10 ** props.token.decimals)))
  } catch {
    return 0n
  }
})

const totalDeducted = computed(() => {
  if (!props.token) return 0n
  return amountBigInt.value + props.token.fee
})

const canSend = computed(() => {
  return !recipientError.value && 
         !amountError.value && 
         recipient.value.trim() !== '' && 
         amount.value !== '' && 
         amountBigInt.value > 0n &&
         totalDeducted.value <= (props.token?.balance || 0n)
})

// Validation watchers
watch([recipient], () => {
  validateRecipient()
})

watch([amount, () => props.token], () => {
  validateAmount()
})

// Reset form when modal is shown/hidden
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

// Methods
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

const validateRecipient = () => {
  recipientError.value = ''
  
  if (!recipient.value.trim()) {
    return
  }
  
  try {
    // Try to parse as Principal
    Principal.fromText(recipient.value.trim())
  } catch {
    // If not a valid Principal, check if it looks like an account ID
    const cleaned = recipient.value.trim().toLowerCase()
    if (!/^[a-f0-9]{64}$/.test(cleaned)) {
      recipientError.value = 'Invalid recipient address format'
    }
  }
}

const validateAmount = () => {
  amountError.value = ''
  
  if (!amount.value || !props.token) {
    return
  }
  
  const amountNum = parseFloat(amount.value)
  
  if (isNaN(amountNum) || amountNum <= 0) {
    amountError.value = 'Amount must be greater than 0'
    return
  }
  
  if (amountBigInt.value <= 0n) {
    amountError.value = 'Amount too small'
    return
  }
  
  if (totalDeducted.value > props.token.balance) {
    amountError.value = 'Insufficient balance (including fees)'
    return
  }
}

const setMaxAmount = () => {
  if (!props.token) return
  amount.value = formatBalance(maxAmountBigInt.value, props.token.decimals)
}

const resetForm = () => {
  recipient.value = ''
  amount.value = ''
  memo.value = ''
  recipientError.value = ''
  amountError.value = ''
  submitting.value = false
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSend = async () => {
  if (!canSend.value || submitting.value) return
  
  // Final validation
  validateRecipient()
  validateAmount()
  
  if (recipientError.value || amountError.value) {
    return
  }
  
  submitting.value = true
  
  try {
    emit('send', {
      recipient: recipient.value.trim(),
      amount: amountBigInt.value,
      memo: memo.value.trim() || undefined
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-content {
  border: 1px solid #495057;
}

.token-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.token-info-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.balance-display {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(128, 189, 255, 0.25);
}

.input-group .btn {
  border-color: var(--border-color);
}

.transaction-details {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.details-header {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.details-header h6 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.details-body {
  padding: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.total-row {
  background: rgba(0, 123, 255, 0.1);
  margin: 0.5rem -1rem -1rem -1rem;
  padding: 0.75rem 1rem;
  border-top: 2px solid rgba(0, 123, 255, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile responsiveness */
@media (max-width: 576px) {
  .modal-dialog {
    margin: 0.5rem;
  }
  
  .token-info-card,
  .details-body {
    padding: 0.75rem;
  }
  
  .detail-row {
    font-size: 0.85rem;
  }
}
</style>