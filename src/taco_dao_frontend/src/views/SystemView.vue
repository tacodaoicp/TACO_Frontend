<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <div class="system-view w-100">

            <!-- title row -->
            <div class="d-flex align-items-center justify-content-between mt-4 mb-2 px-3">
              <h1 class="taco-title mb-0">
                <span class="taco-title__icon">🛠️</span>
                <span class="taco-title__title">System Overview</span>
              </h1>

              <!-- right controls -->
              <div class="d-flex align-items-center gap-2">
                <!-- env switch (admin only) -->
                <div v-if="isAdmin" class="form-inline d-flex align-items-center gap-2">
                  <label class="mb-0 small text-muted">Environment</label>
                  <select class="form-select form-select-sm" v-model="selectedEnv" @change="refreshCycles">
                    <option value="ic">Production</option>
                    <option value="staging">Staging</option>
                  </select>
                </div>
                <div v-else class="small text-muted">Environment: Production</div>

                <!-- expand/collapse all -->
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-secondary" @click="expandAll">Expand all</button>
                  <button class="btn btn-sm btn-outline-secondary" @click="collapseAll">Collapse all</button>
                </div>
              </div>
            </div>

            <!-- main canisters group -->
            <div class="taco-container taco-container--l1 d-flex flex-column gap-2 p-0 mt-3">
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between">
                <h2 class="h5 mb-0">Main Canisters</h2>
              </div>
              <div class="p-2 d-flex flex-column gap-2">
                <SystemCanisterCard
                  v-for="c in mainCanisters"
                  :key="c.key"
                  :title="c.title"
                  :principal="resolvePrincipal(c.key)"
                  v-model:expanded="expandedMap[c.key]"
                  :cyclesT="cyclesMap[c.key]"
                  :loading="loadingMap[c.key]"
                  :timerStatus="timerStatusMap[c.key]"
                  :treasuryHeader="c.key === 'treasury' ? (treasuryHeader || undefined) : undefined"
                  :treasuryDetails="c.key === 'treasury' ? (treasuryDetails || undefined) : undefined"
                  :tokenList="c.key === 'dao_backend' ? (daoTokenList || undefined) : undefined"
                  :tokenAggregateWorst="c.key === 'dao_backend' ? (daoTokenWorst || undefined) : undefined"
                  :oldestTokenSyncDisplay="c.key === 'dao_backend' ? (daoOldestSyncDisplay || undefined) : undefined"
                  :isAdmin="isAdmin"
                  :isArchive="false"
                  @refresh="() => fetchCyclesFor(c.key)"
                />
              </div>
            </div>

            <!-- archives group -->
            <div class="taco-container taco-container--l1 d-flex flex-column gap-2 p-0 mt-4">
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between">
                <h2 class="h5 mb-0">Archives</h2>
              </div>
              <div class="p-2 d-flex flex-column gap-2">
                <SystemCanisterCard
                  v-for="c in archiveCanisters"
                  :key="c.key"
                  :title="c.title"
                  :principal="resolvePrincipal(c.key)"
                  v-model:expanded="expandedMap[c.key]"
                  :cyclesT="cyclesMap[c.key]"
                  :loading="loadingMap[c.key]"
                  :timerStatus="timerStatusMap[c.key]"
                  :isAdmin="isAdmin"
                  :isArchive="true"
                  @refresh="() => fetchCyclesFor(c.key)"
                />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

  </div>

</template>

<style scoped lang="scss">
.system-view {
  .status-light {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import HeaderBar from "../components/HeaderBar.vue"
import FooterBar from "../components/FooterBar.vue"
// @ts-ignore - Vue SFC import resolution
import SystemCanisterCard from "../components/system/SystemCanisterCard.vue"
import { useTacoStore } from "../stores/taco.store"
import { Actor, HttpAgent } from '@dfinity/agent'
import { CANISTER_IDS, type EnvKey } from '../constants/canisterIds'

// Minimal IDL with only get_canister_cycles
const minimalCyclesIdl = ({ IDL }: any) => IDL.Service({
  'get_canister_cycles': IDL.Func([], [IDL.Record({ cycles: IDL.Nat })], ['query'])
})

const tacoStore = useTacoStore()

// Determine admin: call DAO hasAdminPermission or use a simple check if available
const isAdmin = ref(false)

// Environment selection
const selectedEnv = ref<EnvKey>('ic')

// Canister groups and keys
type CanKey = 'dao_backend' | 'frontend' | 'treasury' | 'rewards' | 'neuronSnapshot' | 'validation'
  | 'trading_archive' | 'portfolio_archive' | 'price_archive' | 'dao_admin_archive' | 'dao_governance_archive'
  | 'dao_allocation_archive' | 'dao_neuron_allocation_archive' | 'reward_distribution_archive' | 'reward_withdrawal_archive'

const mainCanisters = [
  { key: 'dao_backend' as CanKey, title: 'Backend (DAO.mo)' },
  { key: 'frontend' as CanKey, title: 'Frontend' },
  { key: 'treasury' as CanKey, title: 'Portfolio (treasury.mo)' },
  { key: 'rewards' as CanKey, title: 'Rewards (rewards.mo)' },
  { key: 'neuronSnapshot' as CanKey, title: 'Governance (neuronSnapshot.mo)' },
  { key: 'validation' as CanKey, title: 'Validation (validation.mo)' },
]

const archiveCanisters = [
  { key: 'trading_archive' as CanKey, title: 'Trading Archive' },
  { key: 'portfolio_archive' as CanKey, title: 'Portfolio Archive' },
  { key: 'price_archive' as CanKey, title: 'Price Archive' },
  { key: 'dao_admin_archive' as CanKey, title: 'DAO Admin Archive' },
  { key: 'dao_governance_archive' as CanKey, title: 'DAO Governance Archive' },
  { key: 'dao_allocation_archive' as CanKey, title: 'DAO Allocation Archive' },
  { key: 'dao_neuron_allocation_archive' as CanKey, title: 'DAO Neuron Allocation Archive' },
  { key: 'reward_distribution_archive' as CanKey, title: 'Reward Distribution Archive' },
  { key: 'reward_withdrawal_archive' as CanKey, title: 'Reward Withdrawal Archive' },
]

const resolvePrincipal = (key: CanKey): string => {
  const rec = CANISTER_IDS[key as keyof typeof CANISTER_IDS]
  if (!rec) return ''
  return rec[selectedEnv.value]
}

// Cycles state
const cyclesMap = reactive<Record<CanKey, number | null>>({
  dao_backend: null,
  frontend: null,
  treasury: null,
  rewards: null,
  neuronSnapshot: null,
  validation: null,
  trading_archive: null,
  portfolio_archive: null,
  price_archive: null,
  dao_admin_archive: null,
  dao_governance_archive: null,
  dao_allocation_archive: null,
  dao_neuron_allocation_archive: null,
  reward_distribution_archive: null,
  reward_withdrawal_archive: null
})
const loadingMap = reactive<Record<CanKey, boolean>>({
  dao_backend: false,
  frontend: false,
  treasury: false,
  rewards: false,
  neuronSnapshot: false,
  validation: false,
  trading_archive: false,
  portfolio_archive: false,
  price_archive: false,
  dao_admin_archive: false,
  dao_governance_archive: false,
  dao_allocation_archive: false,
  dao_neuron_allocation_archive: false,
  reward_distribution_archive: false,
  reward_withdrawal_archive: false
})
const timerStatusMap = reactive<Record<CanKey, any>>({
  dao_backend: null,
  frontend: null,
  treasury: null,
  rewards: null,
  neuronSnapshot: null,
  validation: null,
  trading_archive: null,
  portfolio_archive: null,
  price_archive: null,
  dao_admin_archive: null,
  dao_governance_archive: null,
  dao_allocation_archive: null,
  dao_neuron_allocation_archive: null,
  reward_distribution_archive: null,
  reward_withdrawal_archive: null
})
const treasuryHeader = ref<{
  tradingActive: boolean
  tradingStale: boolean
  lastTradeDisplay: string
  tokenWorst: 'green' | 'orange' | 'red'
  snapshotActive: boolean
} | null>(null)

const treasuryDetails = ref<any | null>(null)
const daoTokenList = ref<Array<{ symbol: string; lastSyncDisplay: string; statusClass: string; statusText: string }> | null>(null)
const daoTokenWorst = ref<'green' | 'orange' | 'red' | null>(null)
const daoOldestSyncDisplay = ref<string | null>(null)
const expandedMap = reactive<Record<CanKey, boolean>>({
  dao_backend: false,
  frontend: false,
  treasury: false,
  rewards: false,
  neuronSnapshot: false,
  validation: false,
  trading_archive: false,
  portfolio_archive: false,
  price_archive: false,
  dao_admin_archive: false,
  dao_governance_archive: false,
  dao_allocation_archive: false,
  dao_neuron_allocation_archive: false,
  reward_distribution_archive: false,
  reward_withdrawal_archive: false
})

const createGenericActor = async (canisterId: string) => {
  // Use anonymous identity for public queries to avoid CORS/II session issues
  const agent = new HttpAgent({ host: "https://ic0.app" })
  if (process.env.DFX_NETWORK === 'local') {
    await agent.fetchRootKey()
  }
  return Actor.createActor(minimalCyclesIdl as any, {
    agent,
    canisterId
  }) as any
}

const isArchiveKey = (key: CanKey) => (
  key === 'trading_archive' ||
  key === 'portfolio_archive' ||
  key === 'price_archive' ||
  key === 'dao_admin_archive' ||
  key === 'dao_governance_archive' ||
  key === 'dao_allocation_archive' ||
  key === 'dao_neuron_allocation_archive' ||
  key === 'reward_distribution_archive' ||
  key === 'reward_withdrawal_archive'
)

const createArchiveActor = async (key: CanKey, canisterId: string) => {
  try {
    // Use the generated declarations (like AdminArchiveView) so getTimerStatus exists
    const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app' })
    if (process.env.DFX_NETWORK === 'local') {
      await agent.fetchRootKey()
    }
    switch (key) {
      case 'trading_archive': {
        const mod = await import('../../../declarations/trading_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'portfolio_archive': {
        const mod = await import('../../../declarations/portfolio_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'price_archive': {
        const mod = await import('../../../declarations/price_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_admin_archive': {
        const mod = await import('../../../declarations/dao_admin_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_governance_archive': {
        const mod = await import('../../../declarations/dao_governance_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_allocation_archive': {
        const mod = await import('../../../declarations/dao_allocation_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'dao_neuron_allocation_archive': {
        const mod = await import('../../../declarations/dao_neuron_allocation_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'reward_distribution_archive': {
        const mod = await import('../../../declarations/reward_distribution_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
      case 'reward_withdrawal_archive': {
        const mod = await import('../../../declarations/reward_withdrawal_archive')
        return mod.createActor(canisterId, { agent }) as any
      }
    }
  } catch (e) {
    console.error('Failed to create archive actor', key, e)
    return null
  }
  return null
}

const fetchCyclesFor = async (key: CanKey) => {
  try {
    loadingMap[key] = true
    // Frontend canister is an asset canister and does not expose get_canister_cycles
    if (key === 'frontend') {
      cyclesMap[key] = null
      timerStatusMap[key] = null
      return
    }
    const cid = resolvePrincipal(key)
    if (!cid) { cyclesMap[key] = null; loadingMap[key] = false; return }
    const actor = await createGenericActor(cid)
    const res = await actor.get_canister_cycles() as any
    const rec = Array.isArray(res) ? res[0] : res
    // Convert to T (trillion cycles)
    const trillion = 1_000_000_000_000n
    const t = Number((rec?.cycles ?? 0n) / trillion)
    cyclesMap[key] = t
    // Try fetching timer status if method exists (archives only)
    try {
      if (isArchiveKey(key)) {
        const archiveActor = await createArchiveActor(key, cid)
        if (archiveActor && typeof archiveActor.getTimerStatus === 'function') {
          const timerRes = await archiveActor.getTimerStatus()
          timerStatusMap[key] = timerRes
        } else {
          timerStatusMap[key] = null
        }
      } else if (key === 'treasury') {
        // Build treasury header + read-only details using selected environment actors
        try {
          const cid = resolvePrincipal('treasury')
          const { idlFactory: treasuryIDL } = await import('../../../declarations/treasury/treasury.did.js')
          const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
          const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app' })
          if (process.env.DFX_NETWORK === 'local') { await agent.fetchRootKey() }
          const tActor: any = Actor.createActor(treasuryIDL, { agent, canisterId: cid })
          const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })

          const [tsRes, cfgRaw, tokensResp, snapStatus] = await Promise.all([
            tActor.getTradingStatus(),
            tActor.getRebalanceConfig?.() ?? Promise.resolve(null),
            dActor.getTokenDetails(),
            tActor.getPortfolioSnapshotStatus()
          ])

          // Trading metrics and status
          let tradingActive = false
          let lastAttemptNs: any = null
          let lastTradeDisplay = 'Never'
          let intervalNs: any = null
          let successRatePct = '0.0%'
          let avgSlippagePct = '0.00%'
          let totalTradesExecuted = 0
          let totalTradesFailed = 0
          if (tsRes && 'ok' in tsRes) {
            const { metrics, rebalanceStatus } = tsRes.ok
            tradingActive = !!('Trading' in rebalanceStatus)
            lastAttemptNs = metrics?.lastRebalanceAttempt
            totalTradesExecuted = Number(metrics?.totalTradesExecuted ?? 0)
            totalTradesFailed = Number(metrics?.totalTradesFailed ?? 0)
            successRatePct = metrics?.successRate != null ? `${(Number(metrics.successRate) * 100).toFixed(1)}%` : '0.0%'
            avgSlippagePct = metrics?.avgSlippage != null ? `${Number(metrics.avgSlippage).toFixed(2)}%` : '0.00%'
            if (lastAttemptNs) lastTradeDisplay = new Date(Number(BigInt(lastAttemptNs) / 1_000_000n)).toLocaleString()
          }
          if (cfgRaw) {
            const cfg = Array.isArray(cfgRaw) ? cfgRaw[0] : cfgRaw
            intervalNs = cfg?.rebalanceIntervalNS
          }
          let tradingStale = false
          if (intervalNs && lastAttemptNs) {
            const periods = Number((BigInt(Date.now()) * 1_000_000n - BigInt(lastAttemptNs)) / BigInt(intervalNs))
            tradingStale = periods > 2
          }

          // Tokens from selected DAO
          const tokenDetails = tokensResp || []
          let worst: 'green' | 'orange' | 'red' = 'green'
          const tokens = tokenDetails.map((entry: any) => {
            const token = entry[1]
            const symbol = token?.tokenSymbol || 'UNKNOWN'
            const lastSyncDisplay = token?.lastTimeSynced ? new Date(Number(BigInt(token.lastTimeSynced) / 1_000_000n)).toLocaleString() : 'Never'
            let statusClass = 'active'
            let statusText = ''
            if (!token?.Active) statusClass = 'inactive'
            else if (token?.pausedDueToSyncFailure) { statusClass = 'paused'; statusText = '(Sync Failed)' }
            else if (token?.isPaused) { statusClass = 'paused'; statusText = '(Manually Paused)' }
            if (statusClass === 'inactive' || token?.pausedDueToSyncFailure) worst = 'red'
            else if (statusClass === 'paused' && worst !== 'red') worst = 'orange'
            return { symbol, lastSyncDisplay, statusClass, statusText }
          })

          // Snapshot status from selected treasury
          const snapshotActive = !!('Running' in snapStatus.status)

          treasuryHeader.value = {
            tradingActive,
            tradingStale,
            lastTradeDisplay,
            tokenWorst: worst,
            snapshotActive
          }

          let tradingWarning: any = null
          if (intervalNs && lastAttemptNs) {
            const periods = Number((BigInt(Date.now()) * 1_000_000n - BigInt(lastAttemptNs)) / BigInt(intervalNs))
            if (periods > 5) tradingWarning = { level: 'danger', message: `Trading bot is ${periods} periods overdue.` }
            else if (periods > 2) tradingWarning = { level: 'warning', message: `Trading bot is ${periods} periods overdue.` }
          }

          treasuryDetails.value = {
            tradingMetrics: {
              lastRebalanceAttemptDisplay: lastTradeDisplay,
              totalTradesExecuted,
              totalTradesFailed,
              successRatePct,
              avgSlippagePct
            },
            tradingWarning,
            tokens,
            snapshots: {
              active: snapshotActive,
              intervalMinutes: snapStatus.intervalMinutes,
              lastSnapshotDisplay: new Date(Number(BigInt(snapStatus.lastSnapshotTime) / 1_000_000n)).toLocaleString()
            },
            shortSync: {
              active: true,
              intervalMinutes: cfgRaw && (Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : cfgRaw as any)?.shortSyncIntervalNS ? Number(((Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : cfgRaw as any).shortSyncIntervalNS) / (60n * 1_000_000_000n)) : undefined,
              lastSyncDisplay: state?.shortSync?.lastSync ? new Date(Number(BigInt(state.shortSync.lastSync) / 1_000_000n)).toLocaleString() : undefined
            },
            longSync: {
              active: true,
              intervalMinutes: cfgRaw && (Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : cfgRaw as any)?.longSyncIntervalNS ? Number(((Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : cfgRaw as any).longSyncIntervalNS) / (60n * 1_000_000_000n)) : undefined,
              lastSyncDisplay: undefined
            }
          }
        } catch (_) {
          treasuryHeader.value = null
          treasuryDetails.value = null
        }
      } else if (key === 'dao_backend') {
        // Load DAO token sync list and aggregate lamp from selected env
        try {
          const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
          const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app' })
          if (process.env.DFX_NETWORK === 'local') { await agent.fetchRootKey() }
          const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })
          const tokenDetails = await dActor.getTokenDetails()
          const tokens = (tokenDetails || []).map((entry: any) => {
            const token = entry[1]
            const symbol = token?.tokenSymbol || 'UNKNOWN'
            const lastSyncDisplay = token?.lastTimeSynced ? new Date(Number(BigInt(token.lastTimeSynced) / 1_000_000n)).toLocaleString() : 'Never'
            let statusClass = 'active'
            let statusText = ''
            if (!token?.Active) statusClass = 'inactive'
            else if (token?.pausedDueToSyncFailure) { statusClass = 'paused'; statusText = '(Sync Failed)' }
            else if (token?.isPaused) { statusClass = 'paused'; statusText = '(Manually Paused)' }
            return { symbol, lastSyncDisplay, statusClass, statusText }
          })
          // compute oldest token sync time for backend header display
          const times = (tokenDetails || []).map((entry: any) => Number(BigInt(entry[1]?.lastTimeSynced || 0n) / 1_000_000n)).filter((n: number) => n > 0)
          const oldestMs = times.length ? Math.min(...times) : 0
          const oldestDisplay = oldestMs ? new Date(oldestMs).toLocaleString() : 'Never'
          let worst: 'green' | 'orange' | 'red' = 'green'
          for (const t of tokens) {
            if (t.statusClass === 'inactive') { worst = 'red'; break }
            if (t.statusClass === 'paused' && (worst === 'green' || worst === 'orange')) worst = 'orange'
          }
          daoTokenList.value = tokens
          daoTokenWorst.value = worst
          daoOldestSyncDisplay.value = oldestDisplay
        } catch (_) {
          daoTokenList.value = null
          daoTokenWorst.value = null
          daoOldestSyncDisplay.value = null
        }
      } else {
        timerStatusMap[key] = null
      }
    } catch (_) {
      timerStatusMap[key] = null
    }
  } catch (e) {
    console.error('get_canister_cycles failed for', key, e)
    cyclesMap[key] = null
    timerStatusMap[key] = null
  } finally {
    loadingMap[key] = false
  }
}

const refreshCycles = async () => {
  const allKeys: CanKey[] = [...mainCanisters, ...archiveCanisters].map(x => x.key)
  await Promise.all(allKeys.map(k => fetchCyclesFor(k)))
}

const expandAll = () => { Object.keys(expandedMap).forEach(k => expandedMap[k as CanKey] = true) }
const collapseAll = () => { Object.keys(expandedMap).forEach(k => expandedMap[k as CanKey] = false) }

onMounted(async () => {
  try {
    // Determine admin via DAO canister hasAdminPermission(getLogs)
    const { Actor, HttpAgent } = await import('@dfinity/agent')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const { AuthClient } = await import('@dfinity/auth-client')
    const authClient = await AuthClient.create()
    const identity = await authClient.getIdentity()
    const agent = new HttpAgent({ identity, host: "https://ic0.app" })
    if (process.env.DFX_NETWORK === 'local') { await agent.fetchRootKey() }
    const daoActor = Actor.createActor(daoIDL, { agent, canisterId: tacoStore.daoBackendCanisterId() }) as any
    const me = tacoStore.userPrincipal ? tacoStore.userPrincipal : tacoStore.userPrincipal
    // check permission for a read-safe function like getLogs
    isAdmin.value = await daoActor.hasAdminPermission(identity.getPrincipal(), { getLogs: null })
  } catch (_) {
    isAdmin.value = false
  }
  await refreshCycles()
})

</script>


