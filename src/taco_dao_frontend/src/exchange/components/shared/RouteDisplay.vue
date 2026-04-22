<template>
  <div class="route-display">
    <!-- Simple route (no hop details) -->
    <template v-if="!hopDetails || hopDetails.length === 0">
      <span class="route-display__simple">{{ description || 'Direct' }}</span>
    </template>

    <!-- Route visualization with token columns -->
    <template v-else>
      <div class="route-display__route">
        <template v-for="(hop, idx) in formattedHops" :key="idx">
          <!-- From token (only for first hop) -->
          <div v-if="idx === 0" class="route-display__node">
            <img v-if="hop.fromIcon" :src="hop.fromIcon" class="route-display__icon" width="24" height="24" />
            <span class="route-display__symbol">{{ hop.fromSymbol }}</span>
          </div>

          <!-- Arrow + impact between tokens -->
          <div class="route-display__connector">
            <div class="route-display__line"></div>
            <span class="route-display__arrow">›</span>
            <div class="route-display__line"></div>
            <span v-if="hop.impact === 0" class="route-display__impact route-display__impact--low">0% <small>(limit)</small></span>
            <span v-else-if="hop.impact > 0" class="route-display__impact" :class="impactClass(hop.impact)">{{ hop.impact.toFixed(1) }}%</span>
          </div>

          <!-- To token -->
          <div class="route-display__node">
            <img v-if="hop.toIcon" :src="hop.toIcon" class="route-display__icon" width="24" height="24" />
            <span class="route-display__symbol">{{ hop.toSymbol }}</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { getTokenIcon } from '../../utils/token-icons'
import type { HopDetail } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{
  description: string
  route?: Array<{ tokenIn: string; tokenOut: string }> | null
  hopDetails?: HopDetail[] | null
}>()

const store = useExchangeStore()

function getSymbol(addr: string) {
  return store.getTokenByAddress(addr)?.symbol ?? addr.slice(0, 5) + '...'
}

function getDecimals(addr: string) {
  return Number(store.getTokenByAddress(addr)?.decimals ?? 8n)
}

function getIcon(addr: string) {
  const t = store.getTokenByAddress(addr)
  return t ? getTokenIcon(t.symbol, t.name) : null
}

function formatAmt(amount: bigint, addr: string) {
  const dec = getDecimals(addr)
  const val = Number(amount) / 10 ** dec
  if (val >= 1000) return val.toFixed(2)
  if (val >= 1) return val.toFixed(4)
  return val.toFixed(Math.min(dec, 6))
}

interface FormattedHop {
  fromSymbol: string
  toSymbol: string
  fromIcon: string | null
  toIcon: string | null
  amountInFormatted: string
  amountOutFormatted: string
  feeFormatted: string
  impact: number
}

const formattedHops = computed((): FormattedHop[] => {
  if (!props.hopDetails?.length) return []
  return props.hopDetails.map(hop => ({
    fromSymbol: getSymbol(hop.tokenIn),
    toSymbol: getSymbol(hop.tokenOut),
    fromIcon: getIcon(hop.tokenIn),
    toIcon: getIcon(hop.tokenOut),
    amountInFormatted: formatAmt(hop.amountIn, hop.tokenIn),
    amountOutFormatted: formatAmt(hop.amountOut, hop.tokenOut),
    feeFormatted: formatAmt(hop.fee, hop.tokenIn),
    impact: hop.priceImpact,
  }))
})

function impactClass(impact: number): string {
  if (impact < 0.5) return 'route-display__impact--low'
  if (impact < 2) return 'route-display__impact--med'
  return 'route-display__impact--high'
}
</script>

<style scoped lang="scss">
.route-display {
  &__simple {
    color: var(--text-secondary);
  }

  &__route {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 0;
    padding: var(--space-2) 0;
  }

  &__node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 44px;
  }

  &__icon {
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid var(--border-secondary);
  }

  &__symbol {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }

  &__connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding-top: 10px; // vertically center arrow with icon
    min-width: 40px;
  }

  &__line {
    display: none; // keep for potential future dashed-line style
  }

  &__arrow {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-tertiary);
    line-height: 1;
  }

  &__impact {
    font-size: 9px;
    font-weight: var(--weight-semibold);
    line-height: 1;
    margin-top: -1px;

    &--low { color: var(--color-buy); }
    &--med { color: var(--color-warning); }
    &--high { color: var(--color-sell); }
  }
}
</style>
