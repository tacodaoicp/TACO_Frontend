<template>
  <Teleport to="body">
    <div v-if="visible" class="swap-confirm-overlay" data-theme="exchange" @click.self="$emit('cancel')">
      <div class="swap-confirm" role="dialog" aria-label="Confirm swap">
        <div class="swap-confirm__header">
          <h3 class="swap-confirm__title">Confirm Swap</h3>
          <button class="swap-confirm__close" @click="$emit('cancel')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="swap-confirm__body">
          <!-- Amounts -->
          <div class="swap-confirm__amounts">
            <div class="swap-confirm__row">
              <span class="swap-confirm__label">You pay</span>
              <span class="swap-confirm__value num">
                {{ formatAmount(amountIn, tokenFrom?.decimals) }} {{ tokenFrom?.symbol }}
              </span>
            </div>
            <div class="swap-confirm__row">
              <span class="swap-confirm__label">You receive</span>
              <span class="swap-confirm__value num">
                ~{{ formatAmount(expectedOut, tokenTo?.decimals) }} {{ tokenTo?.symbol }}
              </span>
            </div>
            <div class="swap-confirm__row">
              <span class="swap-confirm__label">Minimum received</span>
              <span class="swap-confirm__value num">
                {{ formatAmount(minAmountOut, tokenTo?.decimals) }} {{ tokenTo?.symbol }}
              </span>
            </div>
          </div>

          <div class="ex-divider"></div>

          <!-- Details -->
          <div class="swap-confirm__details">
            <div class="swap-confirm__detail">
              <span>Rate</span>
              <span class="num">1 {{ tokenFrom?.symbol }} = {{ rate }} {{ tokenTo?.symbol }}</span>
            </div>
            <div class="swap-confirm__detail">
              <span>Price Impact</span>
              <span class="num" :class="impactClass">{{ priceImpact?.toFixed(2) }}%<span v-if="priceImpact === 0 && expectedOut > 0n" class="swap-confirm__limit-tag"> (100% limit)</span></span>
            </div>
            <div v-if="splitPlan" class="swap-confirm__detail swap-confirm__detail--split">
              <span>Route</span>
              <div class="swap-confirm__split-routes">
                <div class="swap-confirm__split-badge-row">
                  <span class="ex-badge ex-badge--sm ex-badge--success">Split Route</span>
                  <span class="swap-confirm__split-improvement">{{ splitPlan.improvement.toFixed(1) }}% better</span>
                </div>
                <div v-for="(leg, idx) in splitPlan.legs" :key="idx" class="swap-confirm__split-leg">
                  <span class="swap-confirm__split-pct num">{{ leg.pctBP / 100 }}%</span>
                  <RouteDisplay :description="leg.routeKey" :route="leg.route" :hopDetails="leg.hopDetails" />
                </div>
              </div>
            </div>
            <div v-else class="swap-confirm__detail">
              <span>Route</span>
              <RouteDisplay :description="routeDescription" :hopDetails="hopDetails" />
            </div>
            <div class="swap-confirm__detail">
              <span>Fee</span>
              <span class="num">{{ feeDisplay }}</span>
            </div>
            <div class="swap-confirm__detail">
              <span>Slippage</span>
              <span class="num">{{ slippage.toFixed(1) }}%</span>
            </div>
          </div>

          <!-- High impact warning -->
          <div v-if="priceImpact && priceImpact >= 2" class="swap-confirm__warning">
            <span v-if="priceImpact < 5">Price impact is moderate. You may receive less than expected.</span>
            <span v-else>Very high price impact! You may receive significantly less than expected.</span>
          </div>

          <!-- High impact acknowledgement -->
          <label v-if="priceImpact && priceImpact >= 5" class="swap-confirm__ack">
            <input type="checkbox" v-model="acknowledged" />
            <span>I understand the risks and want to proceed</span>
          </label>

          <div class="ex-divider"></div>

          <p class="swap-confirm__note">
            Rate may change between confirmation and execution.
          </p>
        </div>

        <div class="swap-confirm__footer">
          <button class="ex-btn ex-btn--secondary ex-btn--md" @click="$emit('cancel')">
            Cancel
          </button>
          <button
            class="ex-btn ex-btn--primary ex-btn--md"
            :disabled="needsAck && !acknowledged"
            @click="$emit('confirm')"
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TokenInfo, HopDetail } from 'declarations/OTC_backend/OTC_backend.did.d.ts'
import type { SplitPlan } from '../../composables/useSwapFlow'
import RouteDisplay from '../shared/RouteDisplay.vue'

const props = defineProps<{
  visible: boolean
  tokenFrom: TokenInfo | null
  tokenTo: TokenInfo | null
  amountIn: bigint
  expectedOut: bigint
  priceImpact: number | null
  routeDescription: string
  fee: bigint
  slippage: number
  hopDetails?: HopDetail[]
  splitPlan?: SplitPlan | null
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()

const acknowledged = ref(false)

const needsAck = computed(() => (props.priceImpact ?? 0) >= 5)

const minAmountOut = computed(() => {
  if (!props.expectedOut) return 0n
  return props.expectedOut * BigInt(Math.floor((100 - props.slippage) * 100)) / 10000n
})

const rate = computed(() => {
  if (!props.tokenFrom || !props.tokenTo || !props.amountIn || props.amountIn === 0n) return '—'
  const decFrom = Number(props.tokenFrom.decimals)
  const decTo = Number(props.tokenTo.decimals)
  const from = Number(props.amountIn) / (10 ** decFrom)
  const to = Number(props.expectedOut) / (10 ** decTo)
  if (from === 0) return '—'
  return (to / from).toFixed(4)
})

const feeDisplay = computed(() => {
  if (!props.tokenFrom || !props.fee) return '—'
  const dec = Number(props.tokenFrom.decimals)
  const val = Number(props.fee) / (10 ** dec)
  return `${val.toFixed(val >= 1 ? 2 : 6)} ${props.tokenFrom.symbol}`
})

const impactClass = computed(() => {
  const impact = props.priceImpact ?? 0
  if (impact < 0.5) return 'swap-confirm__impact--low'
  if (impact < 2) return 'swap-confirm__impact--moderate'
  if (impact < 5) return 'swap-confirm__impact--high'
  return 'swap-confirm__impact--extreme'
})

function formatAmount(amount: bigint | undefined, decimals: bigint | undefined): string {
  if (!amount || !decimals) return '—'
  const dec = Number(decimals)
  const val = Number(amount) / (10 ** dec)
  const dp = val >= 1000 ? 2 : val >= 1 ? 4 : 8
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: dp })
}
</script>

<style scoped lang="scss">
.swap-confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.swap-confirm {
  width: 420px;
  max-width: 95vw;
  background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
  border: 1px solid var(--card-border);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(15, 5, 0, 0.5);
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: 4px;
    &:hover { color: var(--text-primary); }
  }

  &__body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__amounts {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__value {
    font-size: var(--text-base);
    color: var(--text-primary);
    font-weight: var(--weight-medium);
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__detail {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);

    span:last-child { color: var(--text-primary); }
  }

  &__impact {
    &--low { color: var(--color-buy) !important; }
    &--moderate { color: var(--color-warning) !important; }
    &--high { color: var(--accent-primary) !important; }
    &--extreme { color: var(--color-sell) !important; }
  }

  &__detail--split {
    flex-direction: column;
    gap: var(--space-2);
  }

  &__split-routes {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
  }

  &__split-badge-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }


  &__split-improvement {
    color: var(--color-buy);
    font-size: var(--text-xs);
  }

  &__split-leg {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  &__split-pct {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--accent-primary);
    min-width: 36px;
    flex-shrink: 0;
  }

  &__warning {
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    font-size: var(--text-sm);
    color: var(--color-warning);
    background: rgba(196, 90, 10, 0.1);
    border-left: 3px solid var(--color-warning);
  }

  &__ack {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-sell);
    cursor: pointer;

    input { accent-color: var(--color-sell); }
  }

  &__note {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin: 0;
  }

  &__limit-tag {
    font-size: var(--text-xs);
    opacity: 0.7;
  }

  &__footer {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    border-top: 1px solid var(--border-primary);

    .ex-btn { flex: 1; }
  }
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
