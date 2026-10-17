<template>
  <span class="dex-chip" :class="`dex-chip--${look}`" :aria-label="`${name} ${meaning}`">
    <span class="dex-chip__dot" :class="`dex-chip__dot--${dex}`"></span>
    {{ name }}
    <span v-if="look === 'run'" class="dex-chip__spin" aria-hidden="true"></span>
    <span v-else class="dex-chip__g" aria-hidden="true">{{ glyph }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CrossDexVenue } from '../../utils/crossDexOptimizer'
import type { LegState } from '../../utils/crossDexLegRunner'
import type { UnsureKind } from './multiSellCopy'

// unsure: the part may already be settled in the wallet (multiSellCopy unsureKind): its ICP ('icp'), its sale
// is not sure ('sale'), or Neutrinite sent its tokens back unswapped ('back'). The wallet first.
const props = defineProps<{ dex: CrossDexVenue; state: LegState; unsure?: UnsureKind | null }>()

const name = computed(() => (props.dex === 'icpswap' ? 'ICPSwap' : props.dex === 'neutrinite' ? 'Neutrinite' : 'TACO'))
const look = computed(() => {
  if (props.unsure && props.state === 'needsRecovery') return 'unsure'
  switch (props.state) {
    case 'running': case 'recovering': case 'slow': return 'run'
    case 'done': case 'doneUnknown': return 'done'
    case 'belowMin': return 'low'
    case 'refunded': return 'ref'
    case 'deferred': return 'defer'
    case 'notSent': return 'skip'
    case 'needsRecovery': case 'tracked': return 'fail'
    default: return 'wait'
  }
})
// the unsure chip's ? is never the tracked chip's ! (the two are not told apart by colour alone)
const glyph = computed(() => ({ done: '✓', low: '✓', ref: '↩', defer: '···', skip: '○', fail: props.state === 'tracked' ? '!' : '✕', unsure: '?', wait: '···', run: '' } as Record<string, string>)[look.value])
const meaning = computed(() => {
  if (look.value === 'unsure') {
    return props.unsure === 'sale' ? 'may not have sold, check your wallet'
      : props.unsure === 'back' ? 'not swapped, its tokens may already be back in your wallet'
      : 'sold, its ICP may already be in your wallet'
  }
  switch (props.state) {
    case 'running': case 'recovering': return 'running'
    case 'slow': return 'taking longer than usual'
    case 'done': return 'sold'
    case 'doneUnknown': return 'sold, the amount shows in your wallet'
    case 'belowMin': return 'sold below your minimum price'
    case 'refunded': return 'refunded to your wallet'
    case 'deferred': return 'refund waiting for the exchange call limit'
    case 'notSent': return 'not sent, stayed in your wallet'
    case 'needsRecovery': return 'not refunded, use the Recover page'
    case 'tracked': return 'tracked on chain, see the Recover page'
    default: return 'waiting to start'
  }
})
</script>

<style scoped lang="scss">
.dex-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px 0 7px;
  border-radius: 999px;
  background: var(--tx-surface-2);
  border: 1px solid var(--tx-line);
  font-size: 11px;
  font-weight: 600;
  color: var(--tx-ink-2);
  white-space: nowrap;

  &__dot {
    width: 6px; height: 6px; border-radius: 50%;
    &--icpswap { background: var(--tx-dex-icpswap); }
    &--taco { background: var(--tx-dex-taco); }
    &--neutrinite { background: var(--tx-dex-neutrinite); }
  }
  &__g { font-size: 11px; line-height: 1; }
  &__spin {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1.5px solid var(--tx-line-2); border-top-color: var(--tx-orange);
    animation: dex-chip-spin 0.7s linear infinite;
  }

  // the glyphs use the text inks (at least 4.5:1 on the chip in both themes); the borders keep the base colours
  &--done { border-color: color-mix(in srgb, var(--tx-buy) 35%, transparent); .dex-chip__g { color: var(--tx-buy-ink); } }
  &--low { border-color: color-mix(in srgb, var(--tx-warning) 45%, transparent); .dex-chip__g { color: var(--tx-warning-ink); } }
  &--ref { border-color: color-mix(in srgb, var(--tx-warning) 45%, transparent); .dex-chip__g { color: var(--tx-warning-ink); } }
  &--defer { .dex-chip__g { color: var(--tx-warning-ink); } }
  &--fail { border-color: color-mix(in srgb, var(--tx-sell) 45%, transparent); .dex-chip__g { color: var(--tx-sell-ink); } }
  &--unsure { border-color: color-mix(in srgb, var(--tx-warning) 55%, transparent); .dex-chip__g { color: var(--tx-warning-ink); font-weight: 800; } }
  &--skip { color: var(--tx-muted-ink); .dex-chip__g { color: var(--tx-ink-3); } }
  &--wait .dex-chip__g { color: var(--tx-ink-3); }
}
@keyframes dex-chip-spin { to { transform: rotate(360deg); } }
</style>
