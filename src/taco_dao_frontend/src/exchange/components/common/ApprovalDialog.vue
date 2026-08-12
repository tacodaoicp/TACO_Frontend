<template>
  <teleport to="body">
    <div
      v-if="req"
      class="ex-modal-overlay"
      data-theme="exchange"
      @keydown.esc="cancel"
    >
      <div class="ex-modal" role="dialog" aria-modal="true" aria-labelledby="approve-title">
        <div class="ex-modal__header">
          <h3 id="approve-title">Approve {{ symbol }}</h3>
          <button type="button" class="ex-modal__close" aria-label="Close" @click="cancel">✕</button>
        </div>

        <p style="margin: 0 0 var(--space-2)">
          The exchange needs your permission to take {{ symbol }} from your wallet for this trade.
        </p>
        <p style="margin: 0 0 var(--space-3); color: var(--tx-ink-3)">
          Needed for this trade: <strong class="tx-mono">{{ neededHuman }} {{ symbol }}</strong>
        </p>

        <label for="approve-amount" style="display: block; margin-bottom: var(--space-1)">Amount to approve</label>
        <div style="display: flex; gap: var(--space-2)">
          <input
            id="approve-amount"
            ref="amountEl"
            v-model="amountInput"
            class="ex-input tx-mono"
            inputmode="decimal"
            style="flex: 1"
            @keydown.enter="confirm"
          />
          <button class="tx-btn tx-btn--outline tx-btn--sm" @click="amountInput = minHuman">Minimum</button>
        </div>
        <p v-if="tooLow" style="margin: var(--space-1) 0 0; color: var(--tx-sell)">
          At least {{ neededHuman }} {{ symbol }} is needed for this trade.
        </p>
        <p v-else-if="invalid" style="margin: var(--space-1) 0 0; color: var(--tx-sell)">
          Enter a valid amount.
        </p>

        <label for="approve-duration" style="display: block; margin: var(--space-3) 0 var(--space-1)">Valid for</label>
        <select id="approve-duration" v-model="durationMs" class="ex-input">
          <option v-for="d in DURATIONS" :key="d.label" :value="d.ms">{{ d.label }}</option>
        </select>

        <p style="margin: var(--space-2) 0 0; font-size: var(--text-xs); color: var(--tx-ink-3)">
          Approving more than this trade needs lets you skip this step and its fee next time.
          The permission only applies to the exchange and ends on its own after the time
          you pick. Approved amounts stay in your wallet until you actually trade.
        </p>

        <div class="ex-modal__actions">
          <button class="tx-btn tx-btn--outline tx-btn--sm" @click="cancel">Cancel</button>
          <button class="tx-btn tx-btn--primary tx-btn--sm" :disabled="tooLow || parsed == null" @click="confirm">Approve</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { pendingApproval, settleApproval } from '../../utils/approvalPrompt'
import { useExchangeStore } from '../../store/exchange.store'

const store = useExchangeStore()
const req = pendingApproval

const amountInput = ref('')
const amountEl = ref<HTMLInputElement | null>(null)

const token = computed(() => req.value ? store.getTokenByAddress(req.value.tokenAddress) : undefined)
const symbol = computed(() => token.value?.symbol ?? req.value?.tokenAddress.slice(0, 8) ?? '')
const decimals = computed(() => token.value ? Number(token.value.decimals) : 8)

function toHuman(units: bigint): string {
  const dec = decimals.value
  const divisor = 10n ** BigInt(dec)
  const whole = units / divisor
  const frac = (units % divisor).toString().padStart(dec, '0').replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : `${whole}`
}

// Exact decimal-string parse. parseFloat breaks on 18-decimal tokens.
function toUnits(text: string): bigint | null {
  const t = text.trim()
  if (!t || !/^\d*\.?\d*$/.test(t) || t === '.') return null
  const dec = decimals.value
  const [whole, frac = ''] = t.split('.')
  try {
    return BigInt(whole || '0') * 10n ** BigInt(dec) + BigInt(frac.padEnd(dec, '0').slice(0, dec) || '0')
  } catch { return null }
}

const neededHuman = computed(() => req.value ? toHuman(req.value.needed) : '')
// The Minimum button adds one transfer fee of headroom above the strict
// need. Some ledgers (sGLDT, EXE) trap on a spec-exact allowance; the floor
// below still only requires `needed`, so a compliant token can go exact.
const minHuman = computed(() => req.value ? toHuman(req.value.needed + req.value.transferFee) : '')
const parsed = computed(() => toUnits(amountInput.value))
const tooLow = computed(() => req.value != null && parsed.value != null && parsed.value < req.value.needed)
const invalid = computed(() => parsed.value == null && amountInput.value.trim() !== '')

const HOUR = 3_600_000
const DAY = 24 * HOUR
const DURATIONS = [
  { label: '1 hour', ms: HOUR },
  { label: '1 day', ms: DAY },
  { label: '1 week', ms: 7 * DAY },
  { label: '1 month', ms: 30 * DAY },
  { label: '2 months', ms: 60 * DAY },
  { label: '6 months', ms: 180 * DAY },
]
const durationMs = ref(60 * DAY)

watch(req, (r) => {
  if (r) {
    amountInput.value = toHuman(r.proposed)
    durationMs.value = 60 * DAY
    // Move focus into the dialog so keystrokes/Enter/Esc act on it, not the
    // trade form behind the overlay.
    void nextTick(() => { amountEl.value?.focus(); amountEl.value?.select() })
  }
}, { immediate: true })

// A pending promise must never hang if this ever unmounts mid-decision.
onUnmounted(() => { if (req.value) settleApproval(null) })

function confirm() {
  if (!req.value || parsed.value == null || parsed.value < req.value.needed) return
  settleApproval({
    amount: parsed.value,
    expiresAtNs: BigInt(Date.now() + durationMs.value) * 1_000_000n,
  })
}

function cancel() {
  settleApproval(null)
}
</script>
