<template>
  <div class="swap-result-overlay" @click.self="$emit('dismiss')">
    <div class="swap-result" :class="`swap-result--${type}`">
      <button class="swap-result__close" @click="$emit('dismiss')">&times;</button>

      <!-- Success -->
      <template v-if="type === 'success'">
        <div class="swap-result__icon swap-result__icon--success">
          <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15 24l6 6 12-12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3 class="swap-result__title">Swap Complete</h3>
        <div class="swap-result__details">
          <div class="swap-result__row">
            <span>Sent</span>
            <span class="num">{{ formatAmount(amountSent, tokenFrom?.decimals) }} {{ tokenFrom?.symbol }}</span>
          </div>
          <div class="swap-result__row">
            <span>Received</span>
            <span class="num">{{ formatAmount(amountReceived, tokenTo?.decimals) }} {{ tokenTo?.symbol }}</span>
          </div>
          <div class="swap-result__row">
            <span>Fee</span>
            <span class="num">{{ formatAmount(fee, tokenFrom?.decimals) }} {{ tokenFrom?.symbol }}</span>
          </div>
        </div>
        <div class="swap-result__actions">
          <button class="ex-btn ex-btn--secondary ex-btn--md" @click="$emit('viewHistory')">
            View in History
          </button>
          <button class="ex-btn ex-btn--primary ex-btn--md" @click="$emit('newSwap')">
            New Swap
          </button>
        </div>
      </template>

      <!-- Error -->
      <template v-else-if="type === 'error'">
        <div class="swap-result__icon swap-result__icon--error">
          <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" fill="none"/><path d="M17 17l14 14M31 17L17 31" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
        <h3 class="swap-result__title">Swap Failed</h3>
        <p class="swap-result__message">{{ errorMessage }}</p>
        <div class="swap-result__actions">
          <button v-if="canRetry" class="ex-btn ex-btn--primary ex-btn--md" @click="$emit('tryAgain')">
            Try Again
          </button>
          <button class="ex-btn ex-btn--secondary ex-btn--md" @click="$emit('recover')">
            Recover Funds
          </button>
        </div>
      </template>

      <!-- Partial Fill -->
      <template v-else-if="type === 'partialFill'">
        <div class="swap-result__icon swap-result__icon--partial">
          <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 24h16M24 16v16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
        <h3 class="swap-result__title">Partially Filled</h3>
        <div class="swap-result__details">
          <div class="swap-result__row">
            <span>Fill progress</span>
            <span class="num">{{ fillPercent?.toFixed(0) ?? 0 }}%</span>
          </div>
          <div class="swap-result__row">
            <span>Remaining placed as limit order</span>
          </div>
        </div>
        <div v-if="accesscode" class="swap-result__code">
          <span class="swap-result__code-label">Order Code</span>
          <div class="swap-result__code-value">
            <span class="num">{{ accesscode }}</span>
            <button class="swap-result__code-copy" @click="copyCode" :title="copied ? 'Copied!' : 'Copy'">
              <svg width="14" height="14" viewBox="0 0 14 14"><rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" fill="none"/><path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" fill="none"/></svg>
            </button>
          </div>
        </div>
        <div class="swap-result__actions">
          <button class="ex-btn ex-btn--secondary ex-btn--md" @click="$emit('viewPortfolio')">
            View in Portfolio
          </button>
          <button class="ex-btn ex-btn--primary ex-btn--md" @click="$emit('newSwap')">
            New Swap
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = defineProps<{
  type: 'success' | 'error' | 'partialFill'
  tokenFrom?: TokenInfo | null
  tokenTo?: TokenInfo | null
  amountSent?: bigint
  amountReceived?: bigint
  fee?: bigint
  errorMessage?: string
  canRetry?: boolean
  accesscode?: string
  fillPercent?: number
}>()

defineEmits<{
  newSwap: []
  tryAgain: []
  recover: []
  viewHistory: []
  viewPortfolio: []
  dismiss: []
}>()

const copied = ref(false)

async function copyCode() {
  if (!props.accesscode) return
  try {
    await navigator.clipboard.writeText(props.accesscode)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* fallback */ }
}

function formatAmount(amount: bigint | undefined, decimals: bigint | undefined): string {
  if (!amount || !decimals) return '—'
  const dec = Number(decimals)
  const val = Number(amount) / (10 ** dec)
  const dp = val >= 1000 ? 2 : val >= 1 ? 4 : 8
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: dp })
}
</script>

<style scoped lang="scss">
.swap-result-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay-bg, rgba(15, 5, 0, 0.70));
  border-radius: inherit;
}

.swap-result {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-6) var(--space-4);
  gap: var(--space-4);
  border-left: 3px solid transparent;
  border-radius: 12px;
  background: var(--bg-secondary);
  max-width: 400px;
  width: 100%;

  &--success { border-left-color: var(--color-buy); }
  &--error { border-left-color: var(--color-sell); }
  &--partialFill { border-left-color: var(--color-warning); }

  &__close {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
    &:hover { color: var(--text-primary); }
  }

  &__icon {
    &--success { color: var(--color-buy); }
    &--error { color: var(--color-sell); }
    &--partial { color: var(--color-warning); }
  }

  &__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__message {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    max-width: 320px;
    margin: 0;
  }

  &__details {
    width: 100%;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    span:last-child { color: var(--text-primary); }
  }

  &__code {
    width: 100%;
    max-width: 320px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: var(--space-3);
  }

  &__code-label {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    margin-bottom: var(--space-1);
  }

  &__code-value {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);

    span {
      font-size: var(--text-xs);
      color: var(--text-primary);
      word-break: break-all;
    }
  }

  &__code-copy {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    flex-shrink: 0;
    padding: 2px;
    &:hover { color: var(--text-primary); }
  }

  &__actions {
    display: flex;
    gap: var(--space-3);
    width: 100%;
    max-width: 320px;

    .ex-btn { flex: 1; }
  }
}
</style>
