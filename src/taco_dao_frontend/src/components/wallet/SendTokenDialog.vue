<template>

  <div v-if="show" class="modal d-block" tabindex="-1">

    <!-- modal dialog -->
    <div class="modal-dialog">

      <!-- modal content -->
      <div class="modal-content">

        <!-- modal header -->
        <div class="modal-header">

          <!-- token logo and title -->
          <div class="d-flex align-items-center gap-2"
          style="margin: 1.5rem 0 0 1.5rem;">

            <!-- token logo -->
            <img v-if="token" 
            :src="token.logo"
            :alt="token.symbol" 
            class="token-logo me-2" />

            <div class="d-flex flex-column">

              <!-- token title -->
              <span class="send-token-title">Send {{ token?.symbol || 'Token' }}</span>

              <!-- token name -->
              <span class="send-token-name">{{ token.name }}</span>

            </div>

          </div>

          <button type="button" 
          class="btn modal-close-btn"
          @click="handleClose">

            <i class="fa fa-times"></i>

          </button>

        </div>
        
        <!-- modal body -->
        <div class="modal-body">

          <!-- form -->
          <form @submit.prevent="handleSend" v-if="token">
            
            <!-- available balance -->
            <span class="available-balance">Available Balance: {{ formatBalance(token.balance, token.decimals) }} {{ token.symbol }}</span>

            <!-- recipient address -->
            <div class="mb-2">

              <!-- label -->
              <label class="form-label">
                <span>Recipient Address</span>
              </label>

              <!-- input -->
              <input 
                type="text" 
                class="form-control taco-input" 
                v-model="recipient" 
                required
                :class="{ 'is-invalid': recipientError }"
                placeholder="Enter principal or account ID"
              />

              <!-- invalid feedback -->
              <div v-if="recipientError" 
              class="mt-2">
                <span class="small" 
                style="color: var(--red-to-light-red);">
                  {{ recipientError }}
                </span>
              </div>              

            </div>

            <!-- input label -->
            <label class="form-label">
              <span>Amount</span>
            </label>

            <!-- input and max button -->
            <div class="d-flex flex-column align-items-end">

              <!-- input -->
              <input 
                type="number" 
                class="form-control taco-input" 
                v-model="amount"
                required
                min="0"
                :max="maxAmount"
                step="any"
                :class="{ 'is-invalid': amountError }"
                placeholder="0.00"/>
              
              <!-- invalid feedback and max button -->
              <div class="d-flex align-items-center justify-content-between w-100">
                
                <!-- invalid feedback -->
                <div>
                  <span v-if="amountError" 
                  class="small" 
                  style="color: var(--red-to-light-red);">
                    {{ amountError }}
                  </span>
                </div>

                <!-- max button -->
                <button 
                  type="button" 
                  class="btn btn-link"
                  style="color: var(--black-to-white);"
                  @click="setMaxAmount">
                  <span>MAX</span>
                </button>                  

              </div>

            </div>

            <!-- transaction details title -->
            <span class="transaction-details-title">Transaction Details</span>            

            <!-- transaction details -->
            <div class="d-flex flex-column transaction-details"
            style="overflow: clip;">

              <!-- amount to send -->
              <div class="d-flex justify-content-between flex-wrap">
                <span class="fw-bold">Amount to send:</span>
                <span class="ms-auto">{{ amount || '0' }} {{ token.symbol }}</span>
              </div>
                
              <!-- transaction fee -->
              <div class="d-flex justify-content-between flex-wrap">
                <span class="fw-bold">Transaction fee:</span>
                <span class="ms-auto">{{ formatBalance(token.fee, token.decimals) }} {{ token.symbol }}</span>
              </div>

              <!-- total deducted -->
              <div class="d-flex justify-content-between flex-wrap">
                <span class="fw-bold">Total deducted:</span>
                <span class="ms-auto">{{ formatBalance(totalDeducted, token.decimals) }} {{ token.symbol }}</span>
              </div>
                
              <!-- estimated USD value -->
              <div v-if="token.priceUSD && token.priceUSD > 0" 
                class="d-flex justify-content-between flex-wrap">
                <span class="fw-bold">Estimated USD value:</span>
                <span class="ms-auto">${{ formatUSDValue(totalDeducted, token.decimals, token.priceUSD) }}</span>
              </div>

            </div>

            <!-- buttons -->
            <div class="d-flex justify-content-end flex-wrap gap-2">

              <!-- cancel button -->
              <button type="button" 
              class="btn"
              style="font-family: 'Space Mono'; color: var(--black-to-white);" 
              @click="handleClose">
                Cancel
              </button>

              <!-- send button -->
              <button 
                type="submit" 
                class="btn taco-btn taco-btn--green"
                :disabled="!canSend || submitting">
                {{ submitting ? 'Sending...' : 'Send Transaction' }}
              </button>

            </div>
            
          </form>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped>

.modal {
  background-color: rgba(0,0,0,0.5);

  span {
    color: var(--black-to-white);
  }

}

.modal-content {
  background-color: var(--light-orange-to-dark-brown);
  border: 1px solid var(--dark-orange);
}

.modal-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin: 0;
  margin-bottom: 0.5rem;
  padding: 0;
  border-bottom: 0;
  margin-bottom: 0.75rem;
}

.modal-body {
  padding: 0 1.5rem 1rem;
}

.token-logo {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  object-fit: cover;
}

.send-token-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--black-to-white);
  line-height: 1;
}

.modal-close-btn {
  margin: 1rem 0.5rem 0 0;

  i {
    font-size: 1.5rem;
    color: var(--black-to-white);
  }

}

.available-balance {
  font-size: 1.25rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.max-btn {
  font-size: 1rem;
  color: var(--black-to-white);
  font-family: 'Rubik';
}

.transaction-details-title {
  font-size: 1.25rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.transaction-details {
  background-color: var(--orange-to-brown);
  border: 1px solid var(--dark-orange);
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  > div {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--dark-orange);

    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background-color: var(--dark-orange);
    }

  }

}

.memo-label {
  font-size: 1.25rem;
  display: inline-block;
}

</style>

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