<template>

  <div class="vault-analytics">

    <h3 class="vault-analytics__title">Vault Analytics</h3>

    <div v-if="!analytics" class="vault-analytics__loading">
      <i class="fa-solid fa-spinner fa-spin"></i> Loading analytics...
    </div>

    <div v-else class="vault-analytics__content taco-container taco-container--l2">

      <!-- key metrics grid -->
      <div class="vault-analytics__metrics">
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">Total Mints</span>
          <span class="vault-analytics__metric-value">{{ analytics.totalMintCount.toString() }}</span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">Total Burns</span>
          <span class="vault-analytics__metric-value">{{ analytics.totalBurnCount.toString() }}</span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">Mint Volume</span>
          <span class="vault-analytics__metric-value">{{ nachosStore.formatE8s(analytics.totalMintVolumeICP) }} ICP</span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">Burn Volume</span>
          <span class="vault-analytics__metric-value">{{ nachosStore.formatE8s(analytics.totalBurnVolumeICP) }} ICP</span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">NACHOS Supply</span>
          <span class="vault-analytics__metric-value">{{ nachosStore.formatNachos(analytics.nachosSupply) }}</span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">Portfolio Value</span>
          <span class="vault-analytics__metric-value">{{ nachosStore.formatE8s(analytics.portfolioValueICP) }} ICP</span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">NAV Change (24h)</span>
          <span class="vault-analytics__metric-value" :class="navChangeClass">
            {{ navChangeText }}
          </span>
        </div>
        <div class="vault-analytics__metric">
          <span class="vault-analytics__metric-label">Fees Collected</span>
          <span class="vault-analytics__metric-value">{{ nachosStore.formatE8s(analytics.totalFeesCollectedICP) }} ICP</span>
        </div>
      </div>

      <!-- mints by mode (hidden when only 1 mode used) -->
      <div v-if="usedModeCount > 1" class="vault-analytics__section">
        <h4 class="vault-analytics__section-title">Mints by Mode</h4>
        <div class="vault-analytics__modes">
          <div class="vault-analytics__mode-row">
            <span class="vault-analytics__mode-label">ICP</span>
            <div class="vault-analytics__mode-bar-container">
              <div class="vault-analytics__mode-bar vault-analytics__mode-bar--icp"
                   :style="{ width: modeBarWidth('icp') }"></div>
            </div>
            <span class="vault-analytics__mode-count">{{ analytics.mintsByMode.icp.toString() }}</span>
          </div>
          <div v-if="hasNonICPTokens" class="vault-analytics__mode-row">
            <span class="vault-analytics__mode-label">Token</span>
            <div class="vault-analytics__mode-bar-container">
              <div class="vault-analytics__mode-bar vault-analytics__mode-bar--token"
                   :style="{ width: modeBarWidth('singleToken') }"></div>
            </div>
            <span class="vault-analytics__mode-count">{{ analytics.mintsByMode.singleToken.toString() }}</span>
          </div>
          <div class="vault-analytics__mode-row">
            <span class="vault-analytics__mode-label">Portfolio</span>
            <div class="vault-analytics__mode-bar-container">
              <div class="vault-analytics__mode-bar vault-analytics__mode-bar--portfolio"
                   :style="{ width: modeBarWidth('portfolioShare') }"></div>
            </div>
            <span class="vault-analytics__mode-count">{{ analytics.mintsByMode.portfolioShare.toString() }}</span>
          </div>
        </div>
      </div>

      <!-- rate limits (global 4h window) -->
      <div class="vault-analytics__section">
        <h4 class="vault-analytics__section-title">Global Rate Limits (4h Window)</h4>
        <div class="vault-analytics__rate-limits">
          <div class="vault-analytics__rate-row">
            <span class="vault-analytics__rate-label">Mint Usage</span>
            <div class="vault-analytics__rate-bar-container">
              <div class="vault-analytics__rate-bar vault-analytics__rate-bar--mint"
                   :style="{ width: rateLimitPct('mint') + '%' }"></div>
            </div>
            <span class="vault-analytics__rate-text">
              {{ nachosStore.formatE8s(analytics.globalMintIn4h) }} / {{ nachosStore.formatE8s(analytics.maxMintPer4h) }} ICP
            </span>
          </div>
          <div class="vault-analytics__rate-row">
            <span class="vault-analytics__rate-label">Burn Usage</span>
            <div class="vault-analytics__rate-bar-container">
              <div class="vault-analytics__rate-bar vault-analytics__rate-bar--burn"
                   :style="{ width: rateLimitPct('burn') + '%' }"></div>
            </div>
            <span class="vault-analytics__rate-text">
              {{ nachosStore.formatE8s(analytics.globalBurnIn4h) }} / {{ nachosStore.formatE8s(analytics.maxBurnPer4h) }} NACHOS
            </span>
          </div>
        </div>
      </div>

    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNachosStore } from '../../stores/nachos.store'

const nachosStore = useNachosStore()
const analytics = ref<any>(null)

const usedModeCount = computed(() => {
  if (!analytics.value) return 0
  let count = 0
  if (Number(analytics.value.mintsByMode.icp) > 0) count++
  if (Number(analytics.value.mintsByMode.singleToken) > 0) count++
  if (Number(analytics.value.mintsByMode.portfolioShare) > 0) count++
  return count
})

const ICP_PRINCIPAL = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const hasNonICPTokens = computed(() =>
  nachosStore.acceptedTokens.some(([p, c]: [any, any]) => c.enabled && p.toText() !== ICP_PRINCIPAL)
)

onMounted(async () => {
  try {
    const actor = await createAnalyticsActor()
    analytics.value = await actor.getVaultAnalytics()
  } catch (e) {
    console.error('Failed to load vault analytics:', e)
  }
})

// Create anonymous actor for analytics query
const createAnalyticsActor = async () => {
  const { Actor } = await import('@dfinity/agent')
  const { useTacoStore } = await import('../../stores/taco.store')
  const { idlFactory } = await import('../../../../declarations/nachos_vault/nachos_vault.did.js')
  const { getEffectiveNetwork } = await import('../../config/network-config')

  const tacoStore = useTacoStore()
  const agent = await tacoStore.getAnonymousAgentPublic()

  const canisterId = getEffectiveNetwork() === 'staging'
    ? 'p4nog-baaaa-aaaad-qkwpa-cai'
    : 'p4nog-baaaa-aaaad-qkwpa-cai'

  return Actor.createActor(idlFactory, { agent, canisterId })
}

// 24h NAV change — from navHistory, skipping genesis snapshot
const navChange24h = computed(() => {
  const history = nachosStore.navHistory
  if (history.length < 2) return null
  const current = history[history.length - 1]
  const currentNav = Number(current.navPerTokenE8s)
  if (currentNav === 0) return null
  const now = BigInt(Date.now()) * 1_000_000n
  const oneDayAgo = now - 86_400_000_000_000n
  let best = history[1]
  for (let i = history.length - 2; i >= 1; i--) {
    if (history[i].timestamp <= oneDayAgo) {
      best = history[i]
      break
    }
    best = history[i]
  }
  const baseNav = Number(best.navPerTokenE8s)
  if (baseNav === 0) return null
  return ((currentNav - baseNav) / baseNav) * 100
})

const navChangeText = computed(() => {
  if (navChange24h.value === null) return 'N/A'
  const sign = navChange24h.value >= 0 ? '+' : ''
  return `${sign}${navChange24h.value.toFixed(2)}% (24h)`
})

const navChangeClass = computed(() => {
  if (navChange24h.value === null) return ''
  return navChange24h.value >= 0 ? 'text-success' : 'text-danger'
})

// Mint mode bar widths
const modeBarWidth = (mode: string): string => {
  if (!analytics.value) return '0%'
  const total = Number(analytics.value.mintsByMode.icp) +
                Number(analytics.value.mintsByMode.singleToken) +
                Number(analytics.value.mintsByMode.portfolioShare)
  if (total === 0) return '0%'
  const val = Number(analytics.value.mintsByMode[mode] ?? 0n)
  return Math.max(2, (val / total) * 100).toFixed(1) + '%'
}

// Rate limit percentages
const rateLimitPct = (type: 'mint' | 'burn'): number => {
  if (!analytics.value) return 0
  if (type === 'mint') {
    const max = Number(analytics.value.maxMintPer4h)
    if (max === 0) return 0
    return Math.min(100, (Number(analytics.value.globalMintIn4h) / max) * 100)
  } else {
    const max = Number(analytics.value.maxBurnPer4h)
    if (max === 0) return 0
    return Math.min(100, (Number(analytics.value.globalBurnIn4h) / max) * 100)
  }
}
</script>

<style scoped lang="scss">
.vault-analytics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__title {
    font-size: 1.25rem;
    font-family: 'Space Mono', monospace;
    margin-bottom: 0;
  }

  &__loading {
    text-align: center;
    padding: 1rem;
    opacity: 0.75;
    font-family: 'Space Mono', monospace;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  // ============ Metrics Grid ============

  &__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  &__metric {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    background: var(--orange-to-dark-brown);

    &-label {
      font-size: 0.7rem;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      opacity: 0.8;
    }

    &-value {
      font-size: 1rem;
      font-family: 'Space Mono', monospace;
      font-weight: bold;
    }
  }

  // ============ Sections ============

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-title {
      font-size: 0.95rem;
      font-family: 'Space Mono', monospace;
      margin-bottom: 0;
    }
  }

  // ============ Mints by Mode ============

  &__modes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__mode-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
  }

  &__mode-label {
    min-width: 70px;
    opacity: 0.85;
  }

  &__mode-bar-container {
    flex: 1;
    height: 12px;
    background: rgba(128, 128, 128, 0.15);
    border-radius: 6px;
    overflow: hidden;
  }

  &__mode-bar {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease;

    &--icp { background: #3498db; }
    &--token { background: #2ecc71; }
    &--portfolio { background: #e67e22; }
  }

  &__mode-count {
    min-width: 30px;
    text-align: right;
    font-weight: bold;
  }

  // ============ Rate Limits ============

  &__rate-limits {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__rate-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__rate-label {
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.85;
  }

  &__rate-bar-container {
    height: 10px;
    background: rgba(128, 128, 128, 0.15);
    border-radius: 5px;
    overflow: hidden;
  }

  &__rate-bar {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s ease;

    &--mint { background: linear-gradient(90deg, #2ecc71, #f39c12); }
    &--burn { background: linear-gradient(90deg, #e74c3c, #f39c12); }
  }

  &__rate-text {
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    opacity: 0.75;
  }
}
</style>
