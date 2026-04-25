<template>
  <div class="lp-positions-tab">
    <div v-if="loading" class="lp-positions-tab__loading">Loading LP positions...</div>

    <div v-else-if="poolGroups.length > 0" class="lp-positions-tab__groups">
      <div v-for="group in poolGroups" :key="group.pairKey" class="tx-card lp-positions-tab__group">
        <!-- Pool Summary Row (clickable) -->
        <div class="lp-positions-tab__group-header" @click="togglePool(group.pairKey)">
          <span class="lp-positions-tab__group-pair">{{ getSymbol(group.token0) }}/{{ getSymbol(group.token1) }}</span>
          <span class="tx-ink-3 lp-positions-tab__group-info">
            {{ group.posCount }} position{{ group.posCount !== 1 ? 's' : '' }}
            <span v-if="group.inRangeCount > 0" class="tx-buy lp-positions-tab__group-in-range">{{ group.inRangeCount }} in range</span>
          </span>
          <span class="num lp-positions-tab__group-value">
            {{ formatAmount(group.totalAmount0, getDecimals(group.token0)) }} {{ getSymbol(group.token0) }}
            + {{ formatAmount(group.totalAmount1, getDecimals(group.token1)) }} {{ getSymbol(group.token1) }}
          </span>
          <span v-if="group.totalFee0 > 0n || group.totalFee1 > 0n" class="tx-buy lp-positions-tab__group-fees">
            Fees: {{ formatAmount(group.totalFee0, getDecimals(group.token0)) }} + {{ formatAmount(group.totalFee1, getDecimals(group.token1)) }}
          </span>
          <span class="tx-ink-3 lp-positions-tab__group-chevron">{{ expandedPool === group.pairKey ? '▾' : '▸' }}</span>
        </div>

        <!-- Expanded: Individual Positions -->
        <div v-if="expandedPool === group.pairKey" class="lp-positions-tab__group-positions">
          <div v-for="pos in group.positions" :key="pos.key" class="tx-panel-2 lp-positions-tab__card">
            <div class="lp-positions-tab__card-header">
              <span v-if="pos.isConcentrated" class="tx-mono tx-ink-3 lp-positions-tab__card-id">#{{ pos.positionId }}</span>
              <span
                v-if="pos.isConcentrated"
                class="tx-badge"
                :class="pos.inRange ? 'tx-badge--buy' : 'tx-badge--warning'"
              >{{ pos.inRange ? 'In Range' : 'Out of Range' }}</span>
              <span v-else class="tx-badge tx-badge--orange">Full Range</span>
            </div>

            <div v-if="pos.isConcentrated" class="tx-ink-3 lp-positions-tab__card-range">
              Range: {{ formatPrice(pos.priceLower) }} — {{ formatPrice(pos.priceUpper) }} {{ getSymbol(pos.token1) }} per {{ getSymbol(pos.token0) }}
            </div>

            <div class="lp-positions-tab__card-details">
              <div class="lp-positions-tab__card-row">
                <span class="tx-ink-3">Liquidity</span>
                <span class="num">{{ formatAmount(pos.lpTokens, 8) }} LP</span>
              </div>
              <div class="lp-positions-tab__card-row">
                <span class="tx-ink-3">Value</span>
                <span class="num">{{ formatAmount(pos.amount0, getDecimals(pos.token0)) }} {{ getSymbol(pos.token0) }} + {{ formatAmount(pos.amount1, getDecimals(pos.token1)) }} {{ getSymbol(pos.token1) }}</span>
              </div>
              <div v-if="pos.shareOfPool > 0" class="lp-positions-tab__card-row">
                <span class="tx-ink-3">Pool Share</span>
                <span class="num">{{ (pos.shareOfPool * 100).toFixed(2) }}%</span>
              </div>
              <div v-if="pos.fee0 > 0n || pos.fee1 > 0n" class="lp-positions-tab__card-row">
                <span class="tx-ink-3">Unclaimed Fees</span>
                <span class="num tx-buy">
                  {{ formatAmount(pos.fee0, getDecimals(pos.token0)) }} {{ getSymbol(pos.token0) }}
                  + {{ formatAmount(pos.fee1, getDecimals(pos.token1)) }} {{ getSymbol(pos.token1) }}
                </span>
              </div>
            </div>

            <div class="lp-positions-tab__card-actions">
              <button
                v-if="pos.fee0 > 0n || pos.fee1 > 0n"
                class="tx-btn tx-btn--sm tx-btn--primary"
                :disabled="claimingPair !== null"
                @click="claimFees(pos)"
              >
                {{ claimingPair === `${pos.token0}/${pos.token1}` ? 'Claiming...' : 'Claim Fees' }}
              </button>
              <button class="tx-btn tx-btn--sm tx-btn--outline" @click="openRemoveModal(pos)">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="lp-positions-tab__empty">
      No liquidity positions.
    </div>

    <!-- Remove Liquidity Modal -->
    <Teleport to="body">
      <div v-if="removeTarget" class="ex-modal-overlay" data-theme="exchange" @click.self="removeTarget = null">
        <div class="ex-modal">
          <h3 class="ex-modal__title">Remove Liquidity: {{ getSymbol(removeTarget.token0) }}/{{ getSymbol(removeTarget.token1) }}</h3>

          <div class="lp-positions-tab__remove-info">
            <div>Your LP: {{ formatAmount(removeTarget.lpTokens, 8) }}</div>
            <div v-if="removeTarget.isConcentrated">Range: {{ formatPrice(removeTarget.priceLower) }} — {{ formatPrice(removeTarget.priceUpper) }}</div>
          </div>

          <div class="lp-positions-tab__slider-row">
            <label>Amount: {{ removePercent }}%</label>
            <input type="range" min="1" max="100" v-model.number="removePercent" class="lp-positions-tab__slider" />
            <div class="lp-positions-tab__slider-presets">
              <button v-for="pct in [25, 50, 75, 100]" :key="pct" @click="removePercent = pct"
                class="lp-positions-tab__preset-btn">{{ pct }}%</button>
            </div>
          </div>

          <div class="lp-positions-tab__receive">
            <div>You receive (estimated):</div>
            <div class="num">~{{ estimatedReceive0 }} {{ getSymbol(removeTarget.token0) }}</div>
            <div class="num">~{{ estimatedReceive1 }} {{ getSymbol(removeTarget.token1) }}</div>
            <div style="font-size:var(--text-xs);color:var(--text-tertiary)">(includes accrued fees)</div>
          </div>

          <div v-if="removeError" class="ex-error-box lp-positions-tab__error">{{ removeError }}</div>

          <div class="ex-modal__actions">
            <button class="ex-btn ex-btn--outline" @click="removeTarget = null">Cancel</button>
            <button class="ex-btn ex-btn--sell" @click="confirmRemove" :disabled="removing">
              {{ removing ? 'Removing...' : 'Remove Liquidity' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { ratioToHumanPrice, isFullRange, formatRangePrice, parseRemoveResult, liquidityToAmounts } from '../../utils/concentrated'
import { isTransportError, verifyAfterTransportError, type VerifyStatus } from '../../utils/errors'
import { useExchangeToast } from '../../composables/useExchangeToast'

const store = useExchangeStore()
const toast = useExchangeToast()

interface UnifiedPosition {
  key: string
  token0: string
  token1: string
  lpTokens: bigint
  amount0: bigint
  amount1: bigint
  shareOfPool: number
  fee0: bigint
  fee1: bigint
  isConcentrated: boolean
  positionId: bigint
  priceLower: number
  priceUpper: number
  inRange: boolean
}

const fullRangePositions = ref<UnifiedPosition[]>([])
const concentratedPositions = ref<UnifiedPosition[]>([])
const loading = ref(true)
const removeTarget = ref<UnifiedPosition | null>(null)
const removePercent = ref(50)
const removing = ref(false)
const removeError = ref('')
const claimingPair = ref<string | null>(null)

const allPositions = computed(() => [...concentratedPositions.value, ...fullRangePositions.value])

interface PoolGroup {
  pairKey: string
  token0: string
  token1: string
  positions: UnifiedPosition[]
  totalLiquidity: bigint
  totalAmount0: bigint
  totalAmount1: bigint
  totalFee0: bigint
  totalFee1: bigint
  posCount: number
  inRangeCount: number
}

const BASE_TOKEN_IDS = new Set([
  'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
  'xevnm-gaaaa-aaaar-qafnq-cai',  // ckUSDC
])

const poolGroups = computed((): PoolGroup[] => {
  const map = new Map<string, PoolGroup>()
  for (const pos of allPositions.value) {
    // Normalize: base tokens (ICP, ckUSDC) always second
    let t0 = pos.token0, t1 = pos.token1
    if (BASE_TOKEN_IDS.has(t0) && !BASE_TOKEN_IDS.has(t1)) {
      ;[t0, t1] = [t1, t0]
    }
    const pairKey = `${t0}/${t1}`
    let group = map.get(pairKey)
    if (!group) {
      group = {
        pairKey,
        token0: t0,
        token1: t1,
        positions: [],
        totalLiquidity: 0n,
        totalAmount0: 0n,
        totalAmount1: 0n,
        totalFee0: 0n,
        totalFee1: 0n,
        posCount: 0,
        inRangeCount: 0,
      }
      map.set(pairKey, group)
    }
    group.positions.push(pos)
    group.totalLiquidity += pos.lpTokens
    group.totalAmount0 += pos.amount0
    group.totalAmount1 += pos.amount1
    group.totalFee0 += pos.fee0
    group.totalFee1 += pos.fee1
    group.posCount++
    if (pos.inRange) group.inRangeCount++
  }
  return Array.from(map.values()).sort((a, b) => Number(b.totalLiquidity - a.totalLiquidity))
})

const expandedPool = ref<string | null>(null)

function togglePool(pairKey: string) {
  expandedPool.value = expandedPool.value === pairKey ? null : pairKey
}

function getSymbol(address: string): string {
  return store.tokens.find(t => t.address === address)?.symbol ?? '???'
}

function getDecimals(address: string): number {
  return Number(store.tokens.find(t => t.address === address)?.decimals ?? 8)
}

function formatAmount(amount: bigint, decimals: number): string {
  return (Number(amount) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function formatPrice(price: number): string {
  return formatRangePrice(price)
}

function openRemoveModal(pos: UnifiedPosition) {
  removeTarget.value = pos
  removePercent.value = 50
  removeError.value = ''
}

const estimatedReceive0 = computed(() => {
  if (!removeTarget.value) return '0'
  const amt = (removeTarget.value.amount0 * BigInt(removePercent.value)) / 100n
  return formatAmount(amt, getDecimals(removeTarget.value.token0))
})

const estimatedReceive1 = computed(() => {
  if (!removeTarget.value) return '0'
  const amt = (removeTarget.value.amount1 * BigInt(removePercent.value)) / 100n
  return formatAmount(amt, getDecimals(removeTarget.value.token1))
})

async function confirmRemove() {
  if (!removeTarget.value) return
  removing.value = true
  removeError.value = ''

  const target = removeTarget.value
  const preLiquidity = target.lpTokens

  try {
    const lpToRemove = (target.lpTokens * BigInt(removePercent.value)) / 100n
    let result: any

    if (target.isConcentrated) {
      result = await store.removeConcentratedLiquidity(
        target.token0,
        target.token1,
        target.positionId,
        lpToRemove,
      )
    } else {
      result = await store.removeLiquidity(
        target.token0,
        target.token1,
        lpToRemove,
      )
    }

    if ('Ok' in result) {
      removeTarget.value = null
      await store.refreshAfterMutation('lp')
      toast.success('Liquidity Removed')
    } else {
      const { classifyExchangeError } = await import('../../utils/errors')
      const classified = classifyExchangeError(result.Err)
      removeError.value = classified.message
      toast.error('Remove Failed', classified.message)
    }
  } catch (err: any) {
    if (isTransportError(err)) {
      const probe = async (): Promise<VerifyStatus> => {
        try {
          const post: any[] = await store.getUserLiquidityDetailed()
          const match = post.find((p: any) =>
            p.token0 === target.token0 && p.token1 === target.token1
            && (!target.isConcentrated || (p.positionId?.length && p.positionId[0] === target.positionId))
          )
          if (!match) return 'succeeded' // position gone → fully removed
          if (match.liquidity < preLiquidity) return 'succeeded'
          return 'failed'
        } catch {
          return 'unknown'
        }
      }
      const status = await verifyAfterTransportError(probe)
      if (status === 'succeeded') {
        removeTarget.value = null
        await store.refreshAfterMutation('lp')
        toast.success('Liquidity Removed', 'Network hiccup during submit — confirmed via query.')
        return
      }
      if (status === 'failed') {
        removeError.value = 'Network issue — transaction did not land; your position is unchanged.'
        toast.warning('Network issue', removeError.value)
        return
      }
      removeError.value = 'Network issue — refresh to verify whether the remove went through.'
      toast.warning('Network issue', removeError.value)
      return
    }
    removeError.value = err.message || 'Remove failed'
    toast.error('Remove Failed', removeError.value)
  } finally {
    removing.value = false
  }
}

async function claimFees(pos: UnifiedPosition) {
  const pairKey = `${pos.token0}/${pos.token1}`
  claimingPair.value = pairKey
  const preFee0 = pos.fee0
  const preFee1 = pos.fee1
  try {
    const result = pos.isConcentrated
      ? await store.claimConcentratedFees(pos.positionId)
      : await store.claimLPFees(pos.token0, pos.token1)
    if ('Ok' in result) {
      await store.refreshAfterMutation('claim')
      toast.success('Fees Claimed')
    } else {
      const { classifyExchangeError } = await import('../../utils/errors')
      const classified = classifyExchangeError(result.Err)
      console.error('[LP Fees] Claim failed:', classified.message)
      toast.error('Claim Failed', classified.message)
    }
  } catch (err: any) {
    console.error('[LP Fees] Claim failed:', err)
    if (isTransportError(err)) {
      const probe = async (): Promise<VerifyStatus> => {
        try {
          const post: any[] = await store.getUserLiquidityDetailed()
          const match = post.find((p: any) =>
            p.token0 === pos.token0 && p.token1 === pos.token1
            && (!pos.isConcentrated || (p.positionId?.length && p.positionId[0] === pos.positionId))
          )
          if (!match) return 'unknown'
          if (match.fee0 < preFee0 || match.fee1 < preFee1) return 'succeeded'
          return 'failed'
        } catch {
          return 'unknown'
        }
      }
      const status = await verifyAfterTransportError(probe)
      if (status === 'succeeded') {
        await store.refreshAfterMutation('claim')
        toast.success('Fees Claimed', 'Network hiccup during submit — confirmed via query.')
        return
      }
      toast.warning('Network issue',
        status === 'failed' ? 'Transaction did not land.' : 'Refresh to verify before retrying.')
      return
    }
    toast.error('Claim Failed', err.message || 'Failed to claim fees')
  } finally {
    claimingPair.value = null
  }
}

async function loadPositions() {
  if (!loading.value) loading.value = fullRangePositions.value.length === 0 && concentratedPositions.value.length === 0

  try {
    // getUserLiquidityDetailed now returns ALL positions (V2 + V3) with computed amounts, fees, and share
    const allPositionsRaw = await store.getUserLiquidityDetailed().catch(() => []) as any[]

    // Get pool prices for inRange detection
    const poolPrices = new Map<string, number>()
    try {
      const allPools = await store.getAllAMMPools() as any[]
      for (const pool of allPools) {
        poolPrices.set(`${pool.token0}|${pool.token1}`, pool.price0 ?? 0)
        poolPrices.set(`${pool.token1}|${pool.token0}`, pool.price1 ?? 0)
      }
    } catch { /* no pool data */ }

    const frPositions: UnifiedPosition[] = []
    const clPositions: UnifiedPosition[] = []

    for (const pos of allPositionsRaw) {
      const t0 = pos.token0 ?? ''
      const t1 = pos.token1 ?? ''
      const dec0 = getDecimals(t0)
      const dec1 = getDecimals(t1)
      const isConcentrated = pos.positionType && 'concentrated' in pos.positionType
      const posId = pos.positionId?.length > 0 ? pos.positionId[0] : 0n

      // Range (concentrated only)
      const hasRange = pos.ratioLower?.length > 0 && pos.ratioUpper?.length > 0
      const priceLower = hasRange ? ratioToHumanPrice(pos.ratioLower[0], dec0, dec1) : 0
      const priceUpper = hasRange ? ratioToHumanPrice(pos.ratioUpper[0], dec0, dec1) : Infinity
      const fullRange = !isConcentrated || (hasRange && isFullRange(pos.ratioLower[0], pos.ratioUpper[0]))

      // In-range detection
      const currentPrice = poolPrices.get(`${t0}|${t1}`) || 0
      const inRange = fullRange || (currentPrice > 0 && currentPrice >= priceLower && currentPrice <= priceUpper)

      const unified: UnifiedPosition = {
        key: isConcentrated ? `cl-${posId}` : `fr-${t0}-${t1}`,
        token0: t0,
        token1: t1,
        lpTokens: pos.liquidity ?? 0n,
        amount0: pos.token0Amount ?? 0n,
        amount1: pos.token1Amount ?? 0n,
        shareOfPool: Number(pos.shareOfPool ?? 0),
        fee0: pos.fee0 ?? 0n,
        fee1: pos.fee1 ?? 0n,
        isConcentrated: isConcentrated && !fullRange,
        positionId: posId,
        priceLower: fullRange ? 0 : priceLower,
        priceUpper: fullRange ? Infinity : priceUpper,
        inRange,
      }

      if (isConcentrated && !fullRange) {
        clPositions.push(unified)
      } else {
        frPositions.push(unified)
      }
    }

    fullRangePositions.value = frPositions
    concentratedPositions.value = clPositions
  } catch (err) {
    console.error('[LPPositionsTab] Load error:', err)
  } finally {
    loading.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(loadPositions, 15000)
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}
let offMutation: (() => void) | null = null
watch(() => store.isAuthenticated, (v, prev) => { if (v && !prev) loadPositions() })
onMounted(() => {
  loadPositions()
  startPolling()
  offMutation = store.onMutation(kind => {
    if (kind === 'lp' || kind === 'claim') loadPositions()
  })
})
onUnmounted(() => { stopPolling(); offMutation?.() })
onActivated(() => { loadPositions(); startPolling() })
onDeactivated(() => stopPolling())
</script>

<style scoped lang="scss">
.lp-positions-tab {
  &__loading, &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  &__groups {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--border-primary);
  }

  // .tx-card provides bg + border + radius; just add the layout here.
  &__group {
    overflow: hidden; // keep rounded corners intact when expanded
  }

  &__group-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    cursor: pointer;
    transition: background 120ms;

    &:hover { background: var(--tx-surface-1); }
  }

  &__group-pair {
    font-weight: 600;
    color: var(--tx-ink);
    min-width: 90px;
  }

  &__group-info {
    font-size: 11px;
    flex-shrink: 0;
  }
  &__group-in-range { margin-left: 4px; }

  &__group-value {
    flex: 1;
    text-align: right;
    font-size: 11px;
    color: var(--tx-ink-2);
  }

  &__group-fees {
    font-size: 11px;
    margin-left: 8px;
  }

  &__group-chevron {
    font-size: 13px;
    flex-shrink: 0;
  }

  &__group-positions {
    padding: 0 var(--space-4) var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  // .tx-panel-2 provides the card bg + border + radius now.
  &__card {
    padding: 12px;
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__card-pair {
    font-weight: 600;
    color: var(--tx-ink);
  }

  &__card-id {
    font-size: 11px;
  }

  // Badge positioning — let the last child push right without needing a
  // standalone badge style (handled by .tx-badge--* classes now).
  &__card-header > .tx-badge:last-child { margin-left: auto; }

  &__card-range {
    font-size: 11px;
    margin-bottom: 8px;
    font-family: var(--font-mono);
  }

  &__card-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  &__card-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--tx-ink-2);
  }

  &__card-actions {
    display: flex;
    gap: 4px;
  }

  &__remove-info {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
  }

  &__slider-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  &__slider { accent-color: var(--accent-primary); width: 100%; }

  &__slider-presets {
    display: flex;
    gap: var(--space-2);
  }

  &__preset-btn {
    flex: 1;
    padding: var(--space-1);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    &:hover { border-color: var(--accent-primary); color: var(--text-primary); }
  }

  &__receive {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2);
    background: var(--bg-primary);
    border-radius: 6px;
    margin-bottom: var(--space-3);
  }

  &__error {
    margin-bottom: var(--space-2);
  }
}
</style>
