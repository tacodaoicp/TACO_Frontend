<template>

  <div class="vault-ops">

    <h3 class="vault-ops__title">Operations</h3>

    <div class="vault-ops__content taco-container taco-container--l1">

      <div v-if="allOperations.length === 0" class="vault-ops__empty">
        No operations yet.
      </div>

      <table v-else class="vault-ops__table">
        <thead>
          <tr>
            <th>Type</th>
            <th class="text-end">Amount</th>
            <th class="text-end">Status</th>
            <th class="text-end d-none d-md-table-cell">Time</th>
            <th class="text-end"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="op in allOperations" :key="op.key">
            <tr>
              <!-- type -->
              <td>
                <span :class="'vault-ops__type--' + op.typeClass">{{ op.typeLabel }}</span>
              </td>
              <!-- amount -->
              <td class="text-end">
                {{ op.displayAmount }}
                <span class="vault-ops__symbol">{{ op.symbol }}</span>
              </td>
              <!-- status badge -->
              <td class="text-end">
                <span class="vault-ops__status" :class="'vault-ops__status--' + op.statusClass">
                  {{ op.statusLabel }}
                </span>
                <span v-if="op.blockConfirmed" class="vault-ops__block">
                  Block #{{ op.blockConfirmed }}
                </span>
              </td>
              <!-- time -->
              <td class="text-end d-none d-md-table-cell">{{ op.time }}</td>
              <!-- actions -->
              <td class="text-end">
                <div v-if="op.canRetry || op.canCancel" class="vault-ops__actions">
                  <button v-if="op.canRetry"
                          class="btn btn-sm taco-btn taco-btn--green"
                          :disabled="!!nachosStore.activeOperationStatus"
                          @click="handleRetry(op)">
                    <i class="fa-solid fa-rotate"></i> Retry
                  </button>
                  <button v-if="op.canCancel"
                          class="btn btn-sm taco-btn"
                          :disabled="!!nachosStore.activeOperationStatus || op.showCancelConfirm"
                          @click="op.showCancelConfirm = true">
                    <i class="fa-solid fa-xmark"></i> Cancel
                  </button>
                </div>
              </td>
            </tr>

            <!-- error row -->
            <tr v-if="op.error" class="vault-ops__error-row">
              <td colspan="5">
                <i class="fa-solid fa-triangle-exclamation"></i> {{ op.error }}
              </td>
            </tr>

            <!-- cancel confirmation row -->
            <tr v-if="op.showCancelConfirm" class="vault-ops__cancel-row">
              <td colspan="5">
                <div class="vault-ops__cancel-confirm">
                  <p class="vault-ops__cancel-warn">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Cancellation incurs a 10x fee to prevent abuse. Are you sure?
                  </p>
                  <div class="vault-ops__cancel-btns">
                    <button class="btn btn-sm taco-btn taco-btn--green" @click="op.showCancelConfirm = false">
                      Keep Deposit
                    </button>
                    <button class="btn btn-sm taco-btn"
                            :disabled="!!nachosStore.activeOperationStatus"
                            @click="handleCancel(op)">
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
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

// ============ Unified Operation Interface ============

interface UnifiedOperation {
  key: string
  source: 'deposit' | 'cached' | 'transfer' | 'transaction'
  typeLabel: string
  typeClass: string        // 'mint' | 'burn' | 'transfer'
  displayAmount: string
  symbol: string
  statusLabel: string
  statusClass: string
  time: string
  sortTimestamp: number    // ms for sorting
  error?: string
  blockConfirmed?: string  // block number for confirmed transfers
  canRetry: boolean
  canCancel: boolean
  showCancelConfirm: boolean
  // For retry/cancel actions
  cachedOp?: CachedOperation
  raw?: any
  tokenPrincipal?: string
  blockNumber?: string
}

// ============ Build Unified List ============

const allOperations = computed((): UnifiedOperation[] => {
  const ops: UnifiedOperation[] = []

  const canisterDeposits = nachosStore.userActivity?.activeDeposits ?? []
  const canisterDepositKeys = new Set(
    canisterDeposits.map((d: any) => `${d.tokenPrincipal.toText()}-${d.blockNumber.toString()}`)
  )

  // 1. Active deposits (skip Consumed — those show as completed transactions)
  for (const dep of canisterDeposits) {
    if ('Consumed' in dep.status) continue

    const tokenPrincipal = dep.tokenPrincipal.toText()
    const symbol = getSymbolForPrincipal(tokenPrincipal)
    const status = mapDepositStatus(dep.status)
    const isICP = tokenPrincipal === 'ryjl3-tyaaa-aaaaa-aaaba-cai'

    ops.push(reactive({
      key: `dep-${tokenPrincipal}-${dep.blockNumber.toString()}`,
      source: 'deposit' as const,
      typeLabel: isICP ? 'Mint (ICP)' : `Mint (${symbol})`,
      typeClass: 'mint',
      displayAmount: nachosStore.formatE8s(dep.amount),
      symbol,
      statusLabel: status.label,
      statusClass: status.cssClass,
      time: formatTimeAgo(dep.timestamp),
      sortTimestamp: Number(dep.timestamp / 1_000_000n),
      canRetry: 'Verified' in dep.status,
      canCancel: 'Verified' in dep.status,
      showCancelConfirm: false,
      raw: dep,
      tokenPrincipal,
      blockNumber: dep.blockNumber.toString(),
    }))
  }

  // 2. Cached operations (pending/failed, not already on-chain)
  for (const op of nachosStore.cachedOperations) {
    if (op.status !== 'failed' && op.status !== 'pending_mint') continue
    const existsOnChain = canisterDepositKeys.has(`${op.tokenPrincipal}-${op.blockNumber}`)
    if (existsOnChain) continue

    const symbol = getSymbolForPrincipal(op.tokenPrincipal)
    ops.push(reactive({
      key: `cached-${op.tokenPrincipal}-${op.blockNumber}`,
      source: 'cached' as const,
      typeLabel: cachedOpTypeLabel(op),
      typeClass: op.type === 'burn' ? 'burn' : 'mint',
      displayAmount: nachosStore.formatE8s(BigInt(op.amount)),
      symbol,
      statusLabel: op.status === 'failed' ? 'Failed' : 'Pending',
      statusClass: op.status === 'failed' ? 'failed' : 'pending',
      time: formatTimeAgo(BigInt(op.timestamp * 1_000_000)),
      sortTimestamp: op.timestamp,
      error: op.error,
      canRetry: op.status === 'failed' && op.type !== 'burn',
      canCancel: op.status === 'failed',
      showCancelConfirm: false,
      cachedOp: op,
      tokenPrincipal: op.tokenPrincipal,
      blockNumber: op.blockNumber,
    }))
  }

  // 3. Transfer tasks
  const transfers = nachosStore.userActivity?.transfers ?? []
  for (const t of transfers) {
    const status = mapTransferStatus(t.status)
    ops.push(reactive({
      key: `tx-${t.id.toString()}`,
      source: 'transfer' as const,
      typeLabel: transferOpLabel(t.operationType),
      typeClass: 'transfer',
      displayAmount: nachosStore.formatE8s(t.amount),
      symbol: getSymbolForPrincipal(t.tokenPrincipal.toText()),
      statusLabel: status.label,
      statusClass: status.cssClass,
      time: formatTimeAgo(t.createdAt),
      sortTimestamp: Number(t.createdAt / 1_000_000n),
      blockConfirmed: 'Confirmed' in t.status ? t.status.Confirmed.toString() : undefined,
      canRetry: false,
      canCancel: false,
      showCancelConfirm: false,
    }))
  }

  // 4. Recent transactions (completed mints/burns)
  const transactions = nachosStore.userActivity?.recentTransactions ?? []
  for (const tx of transactions) {
    const isMint = 'Mint' in tx.txType
    ops.push(reactive({
      key: `hist-${tx.id.toString()}`,
      source: 'transaction' as const,
      typeLabel: isMint ? 'Mint' : 'Burn',
      typeClass: isMint ? 'mint' : 'burn',
      displayAmount: nachosStore.formatE8s(tx.nachosAmount),
      symbol: 'NACHOS',
      statusLabel: 'Completed',
      statusClass: 'completed',
      time: formatTimestamp(tx.timestamp),
      sortTimestamp: Number(tx.timestamp / 1_000_000n),
      canRetry: false,
      canCancel: false,
      showCancelConfirm: false,
    }))
  }

  // Sort newest first
  ops.sort((a, b) => b.sortTimestamp - a.sortTimestamp)
  return ops
})

// ============ Pagination ============

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

// ============ Status Mappers ============

const mapDepositStatus = (status: any): { label: string; cssClass: string } => {
  if ('Verified' in status) return { label: 'Deposited', cssClass: 'deposited' }
  if ('Processing' in status) return { label: 'Processing', cssClass: 'processing' }
  if ('Cancelled' in status) return { label: 'Cancelled', cssClass: 'cancelled' }
  if ('Expired' in status) return { label: 'Expired', cssClass: 'expired' }
  return { label: 'Unknown', cssClass: 'unknown' }
}

const mapTransferStatus = (status: any): { label: string; cssClass: string } => {
  if ('Pending' in status) return { label: 'Pending', cssClass: 'pending' }
  if ('Sent' in status) return { label: 'Sending', cssClass: 'sending' }
  if ('Confirmed' in status) return { label: 'Confirmed', cssClass: 'confirmed' }
  if ('Failed' in status) return { label: 'Failed', cssClass: 'failed' }
  return { label: 'Unknown', cssClass: 'unknown' }
}

// ============ Label Helpers ============

const getSymbolForPrincipal = (principal: string): string => {
  const entry = nachosStore.portfolio.find((p: any) => p.token.toText() === principal)
  if (entry) return entry.symbol
  if (principal === 'ryjl3-tyaaa-aaaaa-aaaba-cai') return 'ICP'
  if (principal === 'pabnq-2qaaa-aaaam-qhryq-cai') return 'NACHOS'
  return principal.substring(0, 8) + '...'
}

const cachedOpTypeLabel = (op: CachedOperation): string => {
  if (op.type === 'mint_icp') return 'Mint (ICP)'
  if (op.type === 'mint_token') return `Mint (${getSymbolForPrincipal(op.tokenPrincipal)})`
  if (op.type === 'mint_portfolio') return 'Mint (Portfolio)'
  if (op.type === 'burn') return 'Burn'
  return 'Unknown'
}

const transferOpLabel = (opType: any): string => {
  if ('BurnPayout' in opType) return 'Payout'
  if ('MintReturn' in opType) return 'Return'
  if ('ExcessReturn' in opType) return 'Excess Return'
  if ('CancelReturn' in opType) return 'Refund'
  if ('Recovery' in opType) return 'Recovery'
  return 'Unknown'
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

const handleRetry = async (op: UnifiedOperation) => {
  try {
    let cachedOp = op.cachedOp
    if (!cachedOp && op.raw) {
      cachedOp = {
        type: op.raw.tokenPrincipal.toText() === 'ryjl3-tyaaa-aaaaa-aaaba-cai' ? 'mint_icp' : 'mint_token',
        userPrincipal: nachosStore.userPrincipal,
        tokenPrincipal: op.tokenPrincipal!,
        blockNumber: op.blockNumber!,
        amount: op.raw.amount.toString(),
        status: 'failed',
        timestamp: Date.now(),
      } as CachedOperation
    }
    if (!cachedOp) return

    const result = await nachosStore.retryMint(cachedOp)
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

const handleCancel = async (op: UnifiedOperation) => {
  try {
    await nachosStore.cancelDeposit(op.tokenPrincipal!, BigInt(op.blockNumber!))
    op.showCancelConfirm = false
    tacoStore.addToast({
      id: Date.now(),
      code: 'nachos-cancel-success',
      title: 'Deposit Cancelled',
      icon: 'fa-solid fa-check',
      message: 'Refund is being processed.'
    })
    await nachosStore.loadUserActivity()
  } catch (e: any) {
    op.showCancelConfirm = false
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
    gap: 0.75rem;
  }

  &__empty {
    font-size: 0.8rem;
    opacity: 0.75;
    font-family: 'Space Mono', monospace;
    padding: 0.5rem 0;
  }

  // ============ Table ============

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

  &__symbol {
    font-size: 0.7rem;
    opacity: 0.65;
  }

  // ============ Type labels ============

  &__type {
    &--mint { color: var(--success-green); }
    &--burn { color: var(--red-to-light-red); }
    &--transfer { opacity: 0.85; }
  }

  // ============ Status badges ============

  &__status {
    font-size: 0.7rem;
    padding: 0.1rem 0.375rem;
    border-radius: 0.25rem;
    text-transform: uppercase;

    &--pending { background: rgba(13, 110, 253, 0.15); color: #4d9eff; }
    &--deposited { background: rgba(255, 193, 7, 0.2); color: var(--dark-orange-to-brown); }
    &--processing { background: rgba(13, 110, 253, 0.2); color: #4d9eff; }
    &--completed { background: rgba(40, 167, 69, 0.2); color: var(--success-green); }
    &--sending { background: rgba(255, 193, 7, 0.2); color: var(--dark-orange-to-brown); }
    &--confirmed { background: rgba(40, 167, 69, 0.2); color: var(--success-green); }
    &--failed { background: rgba(220, 53, 69, 0.2); color: var(--red-to-light-red); }
    &--cancelled { background: rgba(128, 128, 128, 0.2); color: #999; }
    &--expired { background: rgba(128, 128, 128, 0.2); color: #999; }
  }

  &__block {
    font-size: 0.65rem;
    opacity: 0.75;
    margin-left: 0.25rem;
  }

  // ============ Actions ============

  &__actions {
    display: inline-flex;
    gap: 0.375rem;
    .btn { font-size: 0.7rem; }
  }

  // ============ Error row ============

  &__error-row td {
    color: var(--red-to-light-red);
    font-size: 0.75rem;
    border-bottom: none;
    padding-top: 0;

    i { margin-right: 0.25rem; }
  }

  // ============ Cancel confirmation row ============

  &__cancel-row td {
    border-bottom: none;
    padding-top: 0;
  }

  &__cancel-confirm {
    padding: 0.5rem;
    background: rgba(220, 53, 69, 0.08);
    border-radius: 0.25rem;
  }

  &__cancel-warn {
    font-size: 0.75rem;
    color: var(--dark-orange-to-brown);
    margin-bottom: 0.5rem;
    i { margin-right: 0.25rem; }
  }

  &__cancel-btns {
    display: flex;
    gap: 0.5rem;
    .btn { font-size: 0.75rem; }
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
