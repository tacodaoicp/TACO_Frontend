<template>

  <div class="vault-ops">

    <h3 class="vault-ops__title">Operations</h3>

    <div class="vault-ops__content taco-container taco-container--l2">

      <!-- ============ SECTION 1: Active Deposits ============ -->
      <div class="vault-ops__section">
        <h4 class="vault-ops__section-title">
          <i class="fa-solid fa-inbox"></i> Active Deposits
        </h4>

        <div v-if="allDeposits.length === 0" class="vault-ops__empty">
          No active deposits.
        </div>

        <div v-for="dep in allDeposits" :key="dep.key" class="vault-ops__deposit">
          <div class="vault-ops__deposit-header">
            <span class="vault-ops__deposit-token">{{ dep.symbol || dep.tokenPrincipal.substring(0, 11) }}</span>
            <span class="vault-ops__deposit-amount">{{ dep.displayAmount }}</span>
            <span class="vault-ops__deposit-status" :class="'vault-ops__deposit-status--' + dep.statusClass">
              {{ dep.statusLabel }}
            </span>
          </div>

          <div class="vault-ops__deposit-meta">
            <span>Block: {{ dep.blockNumber }}</span>
            <span>{{ dep.timeAgo }}</span>
          </div>

          <!-- error message for failed -->
          <div v-if="dep.error" class="vault-ops__deposit-error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ dep.error }}
          </div>

          <!-- actions for verified/failed deposits -->
          <div v-if="dep.showActions" class="vault-ops__deposit-actions">
            <button v-if="dep.canRetry"
                    class="btn btn-sm taco-btn taco-btn--green"
                    :disabled="!!nachosStore.activeOperationStatus"
                    @click="handleRetry(dep)">
              <i class="fa-solid fa-rotate"></i> Retry Mint
            </button>
            <button v-if="dep.canCancel"
                    class="btn btn-sm taco-btn"
                    :disabled="!!nachosStore.activeOperationStatus || dep.showCancelConfirm"
                    @click="dep.showCancelConfirm = true">
              <i class="fa-solid fa-xmark"></i> Cancel & Refund
            </button>
          </div>

          <!-- cancel confirmation -->
          <div v-if="dep.showCancelConfirm" class="vault-ops__deposit-cancel-confirm">
            <p class="vault-ops__deposit-cancel-warn">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Cancellation incurs a 10x fee to prevent abuse. Are you sure?
            </p>
            <div class="vault-ops__deposit-cancel-btns">
              <button class="btn btn-sm taco-btn taco-btn--green" @click="dep.showCancelConfirm = false">
                Keep Deposit
              </button>
              <button class="btn btn-sm taco-btn"
                      :disabled="!!nachosStore.activeOperationStatus"
                      @click="handleCancel(dep)">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ SECTION 2: Transfer Tasks ============ -->
      <div class="vault-ops__section">
        <h4 class="vault-ops__section-title">
          <i class="fa-solid fa-paper-plane"></i> Transfer Tasks
        </h4>

        <div v-if="transfers.length === 0" class="vault-ops__empty">
          No transfer tasks.
        </div>

        <table v-else class="vault-ops__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th class="text-end">Amount</th>
              <th class="text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in transfers" :key="Number(t.id)">
              <td>#{{ t.id.toString() }}</td>
              <td>{{ transferOpLabel(t.operationType) }}</td>
              <td class="text-end">{{ nachosStore.formatE8s(t.amount) }}</td>
              <td class="text-end">
                <span class="vault-ops__transfer-status" :class="'vault-ops__transfer-status--' + transferStatusClass(t.status)">
                  {{ transferStatusLabel(t.status) }}
                </span>
                <span v-if="'Confirmed' in t.status" class="vault-ops__transfer-block">
                  Block #{{ t.status.Confirmed.toString() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ============ SECTION 3: Transaction History ============ -->
      <div class="vault-ops__section">
        <h4 class="vault-ops__section-title">
          <i class="fa-solid fa-clock-rotate-left"></i> Transaction History
        </h4>

        <div v-if="recentTransactions.length === 0" class="vault-ops__empty">
          No transaction history.
        </div>

        <table v-else class="vault-ops__table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th class="text-end">NACHOS</th>
              <th class="text-end">Value (ICP)</th>
              <th class="text-end">Fee (ICP)</th>
              <th class="text-end d-none d-md-table-cell">Mode</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in recentTransactions" :key="Number(tx.id)">
              <td>
                <span :class="'Mint' in tx.txType ? 'text-success' : 'text-danger'">
                  {{ 'Mint' in tx.txType ? 'Mint' : 'Burn' }}
                </span>
              </td>
              <td>{{ formatTimestamp(tx.timestamp) }}</td>
              <td class="text-end">{{ nachosStore.formatE8s(tx.nachosAmount) }}</td>
              <td class="text-end">{{ nachosStore.formatE8s(tx.valueICP) }}</td>
              <td class="text-end">{{ nachosStore.formatE8s(tx.feeICP) }}</td>
              <td class="text-end d-none d-md-table-cell">{{ mintModeLabel(tx.mintMode) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- pagination -->
        <div v-if="totalPages > 1" class="vault-ops__pagination">
          <button class="btn btn-sm taco-btn" :disabled="currentPage === 0" @click="changePage(-1)">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="vault-ops__pagination-label">{{ currentPage + 1 }} / {{ totalPages }}</span>
          <button class="btn btn-sm taco-btn" :disabled="currentPage >= totalPages - 1" @click="changePage(1)">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { useNachosStore } from '../../stores/nachos.store'
import type { CachedOperation } from '../../stores/nachos.store'

const tacoStore = useTacoStore()
const nachosStore = useNachosStore()

const PAGE_SIZE = 10
const currentPage = ref(0)

// ============ Active Deposits ============

interface DisplayDeposit {
  key: string
  tokenPrincipal: string
  symbol: string
  blockNumber: string
  displayAmount: string
  statusLabel: string
  statusClass: string
  timeAgo: string
  error?: string
  showActions: boolean
  canRetry: boolean
  canCancel: boolean
  showCancelConfirm: boolean
  cachedOp?: CachedOperation
  raw?: any // ActiveDeposit from canister
}

const allDeposits = computed((): DisplayDeposit[] => {
  const deposits: DisplayDeposit[] = []

  // From canister userActivity.activeDeposits
  const canisterDeposits = nachosStore.userActivity?.activeDeposits ?? []
  for (const dep of canisterDeposits) {
    const tokenPrincipal = dep.tokenPrincipal.toText()
    const symbol = getSymbolForPrincipal(tokenPrincipal)
    const status = getDepositStatusInfo(dep.status)

    deposits.push(reactive({
      key: `${tokenPrincipal}-${dep.blockNumber.toString()}`,
      tokenPrincipal,
      symbol,
      blockNumber: dep.blockNumber.toString(),
      displayAmount: nachosStore.formatE8s(dep.amount),
      statusLabel: status.label,
      statusClass: status.cssClass,
      timeAgo: formatTimeAgo(dep.timestamp),
      showActions: 'Verified' in dep.status,
      canRetry: 'Verified' in dep.status,
      canCancel: 'Verified' in dep.status,
      showCancelConfirm: false,
      raw: dep,
    }))
  }

  // From localStorage cached operations that are pending/failed (not yet on-chain)
  for (const op of nachosStore.cachedOperations) {
    if (op.status === 'failed' || op.status === 'pending_mint') {
      // Check if already in canister deposits
      const alreadyExists = deposits.some(
        d => d.blockNumber === op.blockNumber && d.tokenPrincipal === op.tokenPrincipal
      )
      if (!alreadyExists) {
        deposits.push(reactive({
          key: `cached-${op.tokenPrincipal}-${op.blockNumber}`,
          tokenPrincipal: op.tokenPrincipal,
          symbol: getSymbolForPrincipal(op.tokenPrincipal),
          blockNumber: op.blockNumber,
          displayAmount: nachosStore.formatE8s(BigInt(op.amount)),
          statusLabel: op.status === 'failed' ? 'Failed' : 'Pending',
          statusClass: op.status === 'failed' ? 'failed' : 'pending',
          timeAgo: formatTimeAgo(BigInt(op.timestamp * 1_000_000)),
          error: op.error,
          showActions: op.status === 'failed',
          canRetry: op.status === 'failed' && op.type !== 'burn',
          canCancel: op.status === 'failed',
          showCancelConfirm: false,
          cachedOp: op,
        }))
      }
    }
  }

  return deposits
})

// ============ Transfer Tasks ============

const transfers = computed(() =>
  nachosStore.userActivity?.transfers ?? []
)

// ============ Transaction History ============

const recentTransactions = computed(() =>
  nachosStore.userActivity?.recentTransactions ?? []
)

const totalMints = computed(() => Number(nachosStore.userActivity?.totalMints ?? 0n))
const totalBurns = computed(() => Number(nachosStore.userActivity?.totalBurns ?? 0n))
const totalPages = computed(() => Math.max(1, Math.ceil((totalMints.value + totalBurns.value) / PAGE_SIZE)))

const changePage = async (direction: number) => {
  const newPage = currentPage.value + direction
  if (newPage < 0 || newPage >= totalPages.value) return
  currentPage.value = newPage
  const offset = BigInt(newPage * PAGE_SIZE)
  await nachosStore.loadUserActivity(BigInt(PAGE_SIZE), offset, BigInt(PAGE_SIZE), offset)
}

// ============ Helpers ============

const getSymbolForPrincipal = (principal: string): string => {
  const entry = nachosStore.portfolio.find((p: any) => p.token.toText() === principal)
  if (entry) return entry.symbol
  if (principal === 'ryjl3-tyaaa-aaaaa-aaaba-cai') return 'ICP'
  if (principal === 'pabnq-2qaaa-aaaam-qhryq-cai') return 'NACHOS'
  return principal.substring(0, 8) + '...'
}

const getDepositStatusInfo = (status: any): { label: string; cssClass: string } => {
  if ('Verified' in status) return { label: 'Verified', cssClass: 'verified' }
  if ('Processing' in status) return { label: 'Processing', cssClass: 'processing' }
  if ('Consumed' in status) return { label: 'Consumed', cssClass: 'consumed' }
  if ('Cancelled' in status) return { label: 'Cancelled', cssClass: 'cancelled' }
  if ('Expired' in status) return { label: 'Expired', cssClass: 'expired' }
  return { label: 'Unknown', cssClass: 'unknown' }
}

const transferStatusClass = (status: any): string => {
  if ('Pending' in status) return 'pending'
  if ('Sent' in status) return 'sent'
  if ('Confirmed' in status) return 'confirmed'
  if ('Failed' in status) return 'failed'
  return 'unknown'
}

const transferStatusLabel = (status: any): string => {
  if ('Pending' in status) return 'Pending'
  if ('Sent' in status) return 'Sent'
  if ('Confirmed' in status) return 'Confirmed'
  if ('Failed' in status) return `Failed: ${status.Failed}`
  return 'Unknown'
}

const transferOpLabel = (opType: any): string => {
  if ('BurnPayout' in opType) return 'Burn Payout'
  if ('MintReturn' in opType) return 'Mint Return'
  if ('ExcessReturn' in opType) return 'Excess Return'
  if ('CancelReturn' in opType) return 'Cancel Refund'
  if ('Recovery' in opType) return 'Recovery'
  return 'Unknown'
}

const mintModeLabel = (mode: any): string => {
  if (!mode || mode.length === 0) return '-'
  const m = mode[0]
  if ('ICP' in m) return 'ICP'
  if ('SingleToken' in m) return 'Token'
  if ('PortfolioShare' in m) return 'Portfolio'
  return '-'
}

const formatTimestamp = (nanos: bigint): string => {
  const date = new Date(Number(nanos / 1_000_000n))
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTimeAgo = (nanos: bigint): string => {
  const ms = Number(nanos / 1_000_000n)
  const diff = Date.now() - ms
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// ============ Actions ============

const handleRetry = async (dep: DisplayDeposit) => {
  try {
    let op = dep.cachedOp
    if (!op && dep.raw) {
      // Create a cached op from the canister deposit
      op = {
        type: dep.raw.tokenPrincipal.toText() === 'ryjl3-tyaaa-aaaaa-aaaba-cai' ? 'mint_icp' : 'mint_token',
        userPrincipal: nachosStore.userPrincipal,
        tokenPrincipal: dep.tokenPrincipal,
        blockNumber: dep.blockNumber,
        amount: dep.raw.amount.toString(),
        status: 'failed',
        timestamp: Date.now(),
      } as CachedOperation
    }
    if (!op) return

    const result = await nachosStore.retryMint(op)
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-retry-success',
      title: 'Mint Retry Successful!',
      icon: 'fa-solid fa-check',
      message: `Received ${nachosStore.formatNachos(result.nachosReceived)}`
    })
    await nachosStore.loadUserActivity()
  } catch (e: any) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-retry-error',
      title: 'Retry Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: e.message || 'Retry failed'
    })
  }
}

const handleCancel = async (dep: DisplayDeposit) => {
  try {
    await nachosStore.cancelDeposit(dep.tokenPrincipal, BigInt(dep.blockNumber))
    dep.showCancelConfirm = false
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-cancel-success',
      title: 'Deposit Cancelled',
      icon: 'fa-solid fa-check',
      message: 'Refund is being processed. Track in Transfer Tasks.'
    })
    await nachosStore.loadUserActivity()
  } catch (e: any) {
    dep.showCancelConfirm = false
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-cancel-error',
      title: 'Cancel Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: e.message || 'Cancel failed'
    })
  }
}
</script>

<style scoped lang="scss">
.vault-ops {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__title {
    font-size: 1.25rem;
    font-family: 'Space Mono', monospace;
    margin-bottom: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-title {
      font-size: 0.95rem;
      font-family: 'Space Mono', monospace;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i { opacity: 0.85; }
    }
  }

  &__empty {
    font-size: 0.8rem;
    opacity: 0.75;
    font-family: 'Space Mono', monospace;
    padding: 0.5rem 0;
  }

  // ============ Deposit cards ============

  &__deposit {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.375rem;
    background: var(--orange-to-dark-brown);
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;

    &-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    &-token { font-weight: bold; }

    &-amount {
      margin-left: auto;
      margin-right: 0.5rem;
    }

    &-status {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      text-transform: uppercase;

      &--verified { background: rgba(255, 193, 7, 0.2); color: var(--dark-orange-to-brown); }
      &--processing { background: rgba(13, 110, 253, 0.2); color: #4d9eff; }
      &--consumed { background: rgba(40, 167, 69, 0.2); color: var(--success-green); }
      &--cancelled { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
      &--expired { background: rgba(128, 128, 128, 0.2); color: #999; }
      &--failed { background: rgba(220, 53, 69, 0.2); color: var(--red-to-light-red); }
      &--pending { background: rgba(13, 110, 253, 0.15); color: #4d9eff; }
    }

    &-meta {
      display: flex;
      justify-content: space-between;
      opacity: 0.65;
      font-size: 0.7rem;
    }

    &-error {
      color: var(--red-to-light-red);
      font-size: 0.75rem;
      i { margin-right: 0.25rem; }
    }

    &-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.25rem;
      .btn { font-size: 0.75rem; }
    }

    &-cancel-confirm {
      padding: 0.5rem;
      background: rgba(220, 53, 69, 0.08);
      border-radius: 0.25rem;
    }

    &-cancel-warn {
      font-size: 0.75rem;
      color: var(--dark-orange-to-brown);
      margin-bottom: 0.5rem;
      i { margin-right: 0.25rem; }
    }

    &-cancel-btns {
      display: flex;
      gap: 0.5rem;
      .btn { font-size: 0.75rem; }
    }
  }

  // ============ Tables ============

  &__table {
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
      opacity: 0.85;
      font-weight: 600;
      border-bottom: 2px solid var(--dark-orange-to-brown);
    }
  }

  &__transfer-status {
    font-size: 0.7rem;
    padding: 0.1rem 0.375rem;
    border-radius: 0.25rem;

    &--pending { background: rgba(13, 110, 253, 0.15); color: #4d9eff; }
    &--sent { background: rgba(255, 193, 7, 0.2); color: var(--dark-orange-to-brown); }
    &--confirmed { background: rgba(40, 167, 69, 0.2); color: var(--success-green); }
    &--failed { background: rgba(220, 53, 69, 0.2); color: var(--red-to-light-red); }
  }

  &__transfer-block {
    font-size: 0.65rem;
    opacity: 0.75;
    margin-left: 0.25rem;
  }

  // ============ Pagination ============

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 0.5rem;

    &-label {
      font-size: 0.8rem;
      font-family: 'Space Mono', monospace;
      opacity: 0.85;
    }
  }
}
</style>
