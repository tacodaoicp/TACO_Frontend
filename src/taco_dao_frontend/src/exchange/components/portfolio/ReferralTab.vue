<template>
  <div class="referral-tab">
    <!-- Referral Link -->
    <div class="referral-tab__section">
      <h3 class="referral-tab__title">Your Referral Link</h3>
      <div class="referral-tab__link-row">
        <input
          :value="referralLink"
          readonly
          class="ex-input referral-tab__link-input"
          @click="copyLink"
        />
        <button class="ex-btn ex-btn--sm ex-btn--primary" @click="copyLink">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <p class="referral-tab__info">
        You earn {{ referralPct }}% of your referrals' trading fees.
      </p>
    </div>

    <!-- Referral Info -->
    <div v-if="referredBy" class="referral-tab__section">
      <div class="referral-tab__referred-by">
        Referred by: <span class="num">{{ referredBy }}</span> (permanent)
      </div>
    </div>

    <!-- Unclaimed Earnings -->
    <div class="referral-tab__section">
      <h3 class="referral-tab__title">Unclaimed Earnings</h3>

      <div v-if="loadingEarnings" class="referral-tab__loading">Loading...</div>

      <table v-else-if="earnings.length > 0" class="ex-table referral-tab__table">
        <thead>
          <tr>
            <th>Token</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="earning in earnings" :key="earning.token">
            <td class="referral-tab__token">{{ earning.symbol }}</td>
            <td class="num">{{ earning.amountFormatted }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="referral-tab__no-earnings">
        No unclaimed earnings.
      </div>

      <button
        v-if="earnings.length > 0"
        class="ex-btn ex-btn--primary referral-tab__claim-btn"
        @click="claimAll"
        :disabled="claiming"
      >
        {{ claiming ? 'Claiming...' : 'Claim All Earnings' }}
      </button>

      <div v-if="claimResult" class="ex-success-box">
        {{ claimResult }}
      </div>
    </div>

    <!-- Warning -->
    <div class="ex-warning-box referral-tab__warning">
      Unclaimed earnings expire after 2 months and are redirected to the DAO.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExchangeStore } from '../../store/exchange.store'
import { isTransportError, verifyAfterTransportError, type VerifyStatus } from '../../utils/errors'
import { useExchangeToast } from '../../composables/useExchangeToast'

const router = useRouter()
const store = useExchangeStore()
const toast = useExchangeToast()

const loadingEarnings = ref(true)
const rawEarnings = ref<[string, bigint][]>([])
const referredBy = ref<string | null>(null)
const copied = ref(false)
const claiming = ref(false)
const claimResult = ref('')

const referralPct = computed(() => Number(store.referralFeePct))

const referralLink = computed(() => {
  if (!store.principalText) return 'Connect wallet to get your referral link'
  return `${window.location.origin}${router.resolve(`/easy?ref=${store.principalText}`).href}`
})

interface EarningRow {
  token: string
  symbol: string
  amount: bigint
  decimals: number
  amountFormatted: string
}

const earnings = computed((): EarningRow[] => {
  return rawEarnings.value
    .filter(([, amount]) => amount > 0n)
    .map(([token, amount]) => {
      const info = store.tokens.find(t => t.address === token)
      const decimals = Number(info?.decimals ?? 8)
      return {
        token,
        symbol: info?.symbol ?? '???',
        amount,
        decimals,
        amountFormatted: (Number(amount) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: Math.min(decimals, 6) }),
      }
    })
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
    toast.info('Referral Link Copied')
  } catch { /* fallback */ }
}

async function claimAll() {
  claiming.value = true
  claimResult.value = ''

  const preEarnings = rawEarnings.value.slice()

  try {
    const result = await store.claimFeesReferrer()
    if (result && result.length > 0) {
      const claimed = result.map(([token, amount]: [string, bigint]) => {
        const info = store.tokens.find(t => t.address === token)
        const decimals = Number(info?.decimals ?? 8)
        return `${(Number(amount) / 10 ** decimals).toFixed(4)} ${info?.symbol ?? '???'}`
      }).join(', ')
      claimResult.value = `Claimed: ${claimed}`
      rawEarnings.value = []
      await store.refreshAfterMutation('referral')
      toast.success('Referral Fees Claimed', claimed)
    } else {
      claimResult.value = 'Nothing to claim.'
      toast.info('Nothing to Claim')
    }
  } catch (err: any) {
    if (isTransportError(err)) {
      const probe = async (): Promise<VerifyStatus> => {
        try {
          const post = await store.checkFeesReferrer()
          // Claim succeeded if the unclaimed list dropped (or went to empty).
          if (!post || post.length < preEarnings.length) return 'succeeded'
          return 'failed'
        } catch {
          return 'unknown'
        }
      }
      const status = await verifyAfterTransportError(probe)
      if (status === 'succeeded') {
        claimResult.value = 'Referral fees claimed (confirmed via query after network hiccup).'
        rawEarnings.value = []
        await store.refreshAfterMutation('referral')
        toast.success('Referral Fees Claimed', 'Network hiccup during submit — confirmed via query.')
        return
      }
      claimResult.value = status === 'failed'
        ? 'Network issue — claim did not land. Try again.'
        : 'Network issue — refresh to verify before retrying.'
      toast.warning('Network issue', claimResult.value)
      return
    }
    claimResult.value = `Claim failed: ${err.message || 'Unknown error'}`
    toast.error('Claim Failed', err.message || 'Unknown error')
  } finally {
    claiming.value = false
  }
}

async function loadReferralState() {
  try {
    const [earningsResult, referralInfo] = await Promise.all([
      store.checkFeesReferrer().catch(() => []),
      store.getUserReferralInfo().catch(() => null),
    ])
    rawEarnings.value = earningsResult
    if (referralInfo && (referralInfo as any).referrer) {
      referredBy.value = (referralInfo as any).referrer
    }
  } finally {
    loadingEarnings.value = false
  }
}

let offMutation: (() => void) | null = null
onMounted(() => {
  loadReferralState()
  offMutation = store.onMutation(kind => {
    if (kind === 'referral') loadReferralState()
  })
})
onUnmounted(() => offMutation?.())
</script>

<style scoped lang="scss">
.referral-tab {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 600px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__link-row {
    display: flex;
    gap: var(--space-2);
  }

  &__link-input {
    flex: 1;
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    cursor: pointer;
  }

  &__info {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
  }

  &__referred-by {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__table { width: 100%; }

  &__token {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  &__loading, &__no-earnings {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    padding: var(--space-4);
    text-align: center;
  }

  &__claim-btn {
    margin-top: var(--space-2);
  }

  &__warning {
    font-size: var(--text-xs);
    padding: var(--space-3);
    border-radius: 6px;
    line-height: 1.4;
  }
}
</style>
