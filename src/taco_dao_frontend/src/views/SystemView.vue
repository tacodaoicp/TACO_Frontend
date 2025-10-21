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

            <!-- system status group -->
            <div class="taco-container taco-container--l1 d-flex flex-column gap-2 p-0 mt-3">
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between section-header-clickable" @click="toggleSystemStatus">
                <div class="d-flex align-items-center gap-2">
                  <span v-if="overallSystemStatus === 'running'" class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Running tests...</span>
                  </span>
                  <span v-else :class="['status-light', `status-${overallSystemStatus}`]"></span>
                <h2 class="h5 mb-0">System Status</h2>
              </div>
                <button class="btn btn-sm btn-outline-secondary" @click.stop="toggleSystemStatus" :title="systemStatusExpanded ? 'Collapse' : 'Expand'">
                  <i :class="systemStatusExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
              </div>
              <div v-if="systemStatusExpanded" class="p-2 d-flex flex-column gap-2">
                <SystemStatusItem
                  v-for="item in checklist"
                  :key="item.key"
                  :title="item.title"
                  v-model:expanded="item.expanded"
                  :status="item.status"
                  :running="item.running"
                  :runDisabled="false"
                  @run="runTest(item.key)"
                >
                  <div v-if="item.report" v-html="item.report" class="test-report"></div>
                  <div v-else class="text-muted small">Click "Run" to execute this test</div>
                </SystemStatusItem>
              </div>
            </div>

            <!-- title row -->
            <div class="d-flex align-items-center justify-content-between mt-4 mb-2 px-3">
              <h1 class="taco-title mb-0">
                <span class="taco-title__icon">🛠️</span>
                <span class="taco-title__title">System Overview</span>
              </h1>

              <!-- right controls -->
              <div class="d-flex align-items-center gap-2">
                <!-- env switch (admin or running on staging) -->
                <div v-if="isAdmin || isRunningOnStaging" class="form-inline d-flex align-items-center gap-2">
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
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between section-header-clickable" @click="toggleMainCanisters">
                <h2 class="h5 mb-0">Main Canisters</h2>
                <button class="btn btn-sm btn-outline-secondary" @click.stop="toggleMainCanisters" :title="mainCanistersExpanded ? 'Collapse' : 'Expand'">
                  <i :class="mainCanistersExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
              </div>
              <div v-if="mainCanistersExpanded" class="p-2 d-flex flex-column gap-2">
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
              <div class="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between section-header-clickable" @click="toggleArchives">
                <h2 class="h5 mb-0">Archives</h2>
                <button class="btn btn-sm btn-outline-secondary" @click.stop="toggleArchives" :title="archivesExpanded ? 'Collapse' : 'Expand'">
                  <i :class="archivesExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
              </div>
              <div v-if="archivesExpanded" class="p-2 d-flex flex-column gap-2">
                <SystemCanisterCard
                  v-for="c in archiveCanisters"
                  :key="c.key"
                  :title="c.title"
                  :principal="resolvePrincipal(c.key)"
                  v-model:expanded="expandedMap[c.key]"
                  :cyclesT="cyclesMap[c.key]"
                  :loading="loadingMap[c.key]"
                  :timerStatus="timerStatusMap[c.key]"
                  :governanceHeader="c.key === 'neuronSnapshot' ? (governanceHeader || undefined) : undefined"
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
    display: inline-block;
  }
}

.status-green { background-color: #28a745; }
.status-orange { background-color: #fd7e14; }
.status-red { background-color: #dc3545; }
.status-gray { background-color: #6c757d; }

.section-header-clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.section-header-clickable:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.test-report {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.test-report .canister-results {
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  padding-left: 1rem;
  margin-top: 0.5rem;
}

.test-report .alert-danger {
  background-color: rgba(220, 53, 69, 0.2);
  border: 1px solid #dc3545;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  color: #ff6b6b;
  font-weight: 500;
}

.test-report .alert-danger strong {
  color: #ff8787;
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import HeaderBar from "../components/HeaderBar.vue"
import FooterBar from "../components/FooterBar.vue"
// @ts-ignore - Vue SFC import resolution
import SystemCanisterCard from "../components/system/SystemCanisterCard.vue"
import SystemStatusItem from "../components/system/SystemStatusItem.vue"
import { useTacoStore } from "../stores/taco.store"
import { Actor, HttpAgent } from '@dfinity/agent'
import { CANISTER_IDS, type EnvKey } from '../constants/canisterIds'

// Minimal IDL with only get_canister_cycles
const minimalCyclesIdl = ({ IDL }: any) => IDL.Service({
  'get_canister_cycles': IDL.Func([], [IDL.Record({ cycles: IDL.Nat })], ['query'])
})

const tacoStore = useTacoStore()
const { appLoading } = storeToRefs(tacoStore)

// Section expanded states
const systemStatusExpanded = ref(true)
const mainCanistersExpanded = ref(true)
const archivesExpanded = ref(true)

// Computed: Overall system status based on all checklist items
const overallSystemStatus = computed(() => {
  const allGray = checklist.every(item => item.status === 'gray')
  const anyRunning = checklist.some(item => item.running)
  const anyRed = checklist.some(item => item.status === 'red')
  const allGreen = checklist.every(item => item.status === 'green' || item.status === 'gray')
  
  if (anyRunning) return 'running'
  if (anyRed) return 'red'
  if (allGray) return 'gray'
  if (allGreen && !allGray) return 'green'
  return 'gray'
})

// Checklist state
const checklist = reactive([
  { key: 'canisters-running', title: 'Are all canisters running and in gas?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'trading-regular', title: 'Is the trading bot trading regularly?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'rewards-regular', title: 'Are rewards distributed regularly?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'snapshots-portfolio', title: 'Are portfolio snapshots regular?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'snapshots-neuron', title: 'Are neuron snapshots regular?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'price-history', title: 'Is price history updating?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'allocation-voting', title: 'Does allocation voting work?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'grant-system', title: 'Is grant system cloning and voting?', status: 'gray', expanded: false, running: false, report: '' },
  { key: 'archives-regular', title: 'Are archives importing regularly?', status: 'gray', expanded: false, running: false, report: '' },
] as Array<{ key: string; title: string; status: 'gray' | 'green' | 'red'; expanded: boolean; running: boolean; report: string }>)

// Determine admin: call DAO hasAdminPermission or use a simple check if available
const isAdmin = ref(false)

// Check if running on staging network
const isRunningOnStaging = computed(() => process.env.DFX_NETWORK === 'staging')

// Environment selection - default to staging if running on staging
const selectedEnv = ref<EnvKey>(process.env.DFX_NETWORK === 'staging' ? 'staging' : 'ic')

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
const governanceHeader = ref<{ active: boolean; lastSnapshotDisplay: string } | null>(null)
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

          const [tsRes, cfgRaw, tokensResp, snapStatus, longSyncTimerRes] = await Promise.all([
            tActor.getTradingStatus(),
            tActor.getRebalanceConfig?.() ?? Promise.resolve(null),
            dActor.getTokenDetails(),
            tActor.getPortfolioSnapshotStatus(),
            tActor.getLongSyncTimerStatus?.() ?? Promise.resolve(null)
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
          // Fallback to store config if cfgRaw failed
          if (!intervalNs && tacoStore.rebalanceConfig?.rebalanceIntervalNS) {
            intervalNs = tacoStore.rebalanceConfig.rebalanceIntervalNS
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
            const nowNs = BigInt(Date.now()) * 1_000_000n
            const lastAttemptBigInt = BigInt(lastAttemptNs)
            const intervalBigInt = BigInt(intervalNs)
            const delayNs = nowNs - lastAttemptBigInt
            const periods = Math.floor(Number(delayNs) / Number(intervalBigInt))
            console.log('[Treasury Warning] Now:', Date.now(), 'Last:', lastAttemptNs, 'Interval:', intervalNs, 'Periods:', periods)
            if (periods > 5) tradingWarning = { level: 'danger', message: `Trading bot is ${periods} periods overdue! Last attempt was ${periods} intervals ago.` }
            else if (periods > 2) tradingWarning = { level: 'warning', message: `Trading bot is ${periods} periods overdue.` }
          }

          // derive latest short sync time from trading metrics (lastUpdate)
          const metricsObj: any = (tsRes && 'ok' in tsRes) ? tsRes.ok.metrics : null
          
          // Extract long sync timer status
          let longSyncActive = false
          let longSyncLastRun = null
          if (longSyncTimerRes) {
            const timerStatus = longSyncTimerRes
            longSyncActive = timerStatus.isRunning || false
            longSyncLastRun = timerStatus.lastRunTime || null
          }
          
          treasuryDetails.value = {
            tradingActive, // Add trading status
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
              intervalMinutes: cfgRaw && (Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any))?.shortSyncIntervalNS ? Number(((Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any)).shortSyncIntervalNS) / (60n * 1_000_000_000n)) : undefined,
              lastSyncDisplay: metricsObj?.lastUpdate ? new Date(Number(BigInt(metricsObj.lastUpdate) / 1_000_000n)).toLocaleString() : undefined
            },
            longSync: {
              active: longSyncActive,
              intervalMinutes: cfgRaw && (Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any))?.longSyncIntervalNS ? Number(((Array.isArray(cfgRaw) ? (cfgRaw as any)[0] : (cfgRaw as any)).longSyncIntervalNS) / (60n * 1_000_000_000n)) : undefined,
              lastSyncDisplay: longSyncLastRun ? new Date(Number(BigInt(longSyncLastRun) / 1_000_000n)).toLocaleString() : undefined
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
      } else if (key === 'neuronSnapshot') {
        // Load governance snapshot status from selected env
        try {
          const { idlFactory: neuronIDL } = await import('../../../declarations/neuronSnapshot/neuronSnapshot.did.js')
          const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app' })
          if (process.env.DFX_NETWORK === 'local') { await agent.fetchRootKey() }
          const nActor: any = Actor.createActor(neuronIDL, { agent, canisterId: resolvePrincipal('neuronSnapshot') })
          const snapInfoArr = await nActor.getSnapshotInfo()
          if (Array.isArray(snapInfoArr) && snapInfoArr.length) {
            const info = snapInfoArr[0]
            const lastSnapshotDisplay = info?.lastSnapshotTime ? new Date(Number(info.lastSnapshotTime) / 1_000_000).toLocaleString() : 'Never'
            governanceHeader.value = { active: true, lastSnapshotDisplay }
          } else {
            governanceHeader.value = { active: false, lastSnapshotDisplay: 'Never' }
          }
        } catch (_) {
          governanceHeader.value = null
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

const refreshCycles = () => {
  const allKeys: CanKey[] = [...mainCanisters, ...archiveCanisters].map(x => x.key)
  // Fetch each canister independently without blocking - UI updates as each completes
  allKeys.forEach(k => fetchCyclesFor(k))
}

const toggleSystemStatus = () => { 
  systemStatusExpanded.value = !systemStatusExpanded.value 
}
const toggleMainCanisters = () => { 
  mainCanistersExpanded.value = !mainCanistersExpanded.value 
}
const toggleArchives = () => { 
  archivesExpanded.value = !archivesExpanded.value 
}

const expandAll = () => { Object.keys(expandedMap).forEach(k => expandedMap[k as CanKey] = true) }
const collapseAll = () => { Object.keys(expandedMap).forEach(k => expandedMap[k as CanKey] = false) }

// Test runner
const runTest = async (testKey: string) => {
  const test = checklist.find(t => t.key === testKey)
  if (!test) return

  test.running = true
  test.status = 'gray'
  test.report = ''
  test.expanded = true // Auto-expand to show results

  try {
    if (testKey === 'canisters-running') {
      await testCanistersRunning(test)
    } else if (testKey === 'archives-regular') {
      await testArchivesImporting(test)
    } else if (testKey === 'trading-regular') {
      await testTradingBotRegular(test)
    } else if (testKey === 'snapshots-portfolio') {
      await testPortfolioSnapshots(test)
    } else {
      // Placeholder for other tests
      test.status = 'gray'
      test.report = '<div class="text-muted">Test not yet implemented</div>'
    }
  } catch (error) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error}</div>`
  } finally {
    test.running = false
  }
}

// Test: Are all canisters running and in gas?
const testCanistersRunning = async (test: any) => {
  const allKeys: CanKey[] = [...mainCanisters, ...archiveCanisters].map(x => x.key)
  const results: Array<{ name: string; key: CanKey; cycles: number | null; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  // Test all canisters in parallel
  await Promise.all(allKeys.map(async (key) => {
    const canisterName = [...mainCanisters, ...archiveCanisters].find(c => c.key === key)?.title || key
    
    try {
      // Frontend is an asset canister and doesn't expose get_canister_cycles
      if (key === 'frontend') {
        results.push({
          name: canisterName,
          key,
          cycles: null,
          status: 'pass',
          message: 'Asset canister (no cycles check available)'
        })
        return
      }

      const cid = resolvePrincipal(key)
      if (!cid) {
        results.push({
          name: canisterName,
          key,
          cycles: null,
          status: 'error',
          message: 'No canister ID configured'
        })
        return
      }

      const actor = await createGenericActor(cid)
      const res = await actor.get_canister_cycles() as any
      const rec = Array.isArray(res) ? res[0] : res
      const trillion = 1_000_000_000_000n
      const cyclesT = Number((rec?.cycles ?? 0n) / trillion)
      
      // Determine status based on cycles
      let status: 'pass' | 'fail' = 'pass'
      let message = `${cyclesT}T cycles`
      
      if (cyclesT < 5) {
        status = 'fail'
        message = `${cyclesT}T cycles - CRITICAL: Below 5T`
      } else if (cyclesT < 10) {
        status = 'fail'
        message = `${cyclesT}T cycles - WARNING: Below 10T`
      }
      
      results.push({
        name: canisterName,
        key,
        cycles: cyclesT,
        status,
        message
      })
    } catch (error: any) {
      results.push({
        name: canisterName,
        key,
        cycles: null,
        status: 'error',
        message: `Failed to fetch: ${error.message || 'Unknown error'}`
      })
    }
  }))

  // Generate report
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const errors = results.filter(r => r.status === 'error').length
  const total = results.length

  // Overall status
  if (errors > 0 || failed > 0) {
    test.status = 'red'
  } else {
    test.status = 'green'
  }

  // Build HTML report
  let reportHTML = `
    <div class="mb-3">
      <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors out of ${total} canisters
    </div>
    <div class="canister-results">
  `

  results.forEach(result => {
    const icon = result.status === 'pass' 
      ? '<i class="fa-solid fa-check-circle text-success"></i>' 
      : result.status === 'fail'
      ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
      : '<i class="fa-solid fa-times-circle text-danger"></i>'
    
    const rowClass = result.status === 'pass' ? 'text-success' : result.status === 'fail' ? 'text-warning' : 'text-danger'
    
    reportHTML += `
      <div class="d-flex align-items-center gap-2 py-1 small ${rowClass}">
        ${icon}
        <span class="fw-bold" style="min-width: 200px">${result.name}</span>
        <span>${result.message}</span>
      </div>
    `
  })

  reportHTML += '</div>'
  test.report = reportHTML
}

// Test: Are archives importing regularly?
const testArchivesImporting = async (test: any) => {
  const results: Array<{ name: string; key: CanKey; running: boolean; lastRun: number | null; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  // Test all archive canisters in parallel
  await Promise.all(archiveCanisters.map(async (canister) => {
    const key = canister.key
    const canisterName = canister.title
    
    try {
      const cid = resolvePrincipal(key)
      if (!cid) {
        results.push({
          name: canisterName,
          key,
          running: false,
          lastRun: null,
          status: 'error',
          message: 'No canister ID configured'
        })
        return
      }

      // Create archive actor to get timer status
      const archiveActor = await createArchiveActor(key, cid)
      if (!archiveActor || typeof archiveActor.getTimerStatus !== 'function') {
        results.push({
          name: canisterName,
          key,
          running: false,
          lastRun: null,
          status: 'error',
          message: 'Timer status not available'
        })
        return
      }

      const timerStatus = await archiveActor.getTimerStatus()
      
      // Check if outer loop is running
      const isRunning = timerStatus.outerLoopRunning
      const lastRun = timerStatus.outerLoopLastRun
      const lastRunMs = lastRun && Number(lastRun) > 0 ? Number(lastRun) / 1_000_000 : null
      
      // Calculate time since last run
      const nowMs = Date.now()
      const timeSinceLastRun = lastRunMs ? nowMs - lastRunMs : null
      
      // Check if last run was within 90 minutes (3 periods of 30 minutes)
      const maxDelayMs = 90 * 60 * 1000 // 90 minutes in milliseconds
      
      let status: 'pass' | 'fail' = 'pass'
      let message = ''
      
      if (!isRunning) {
        status = 'fail'
        message = 'Outer timer is NOT running'
      } else if (!lastRunMs || Number(lastRun) === 0) {
        status = 'fail'
        message = 'Never run - no last run time recorded'
      } else if (timeSinceLastRun && timeSinceLastRun > maxDelayMs) {
        status = 'fail'
        const minutesAgo = Math.round(timeSinceLastRun / (60 * 1000))
        message = `Last run ${minutesAgo} minutes ago (>90 min threshold)`
      } else {
        const minutesAgo = timeSinceLastRun ? Math.round(timeSinceLastRun / (60 * 1000)) : 0
        message = `Running - last import ${minutesAgo} minutes ago`
      }
      
      results.push({
        name: canisterName,
        key,
        running: isRunning,
        lastRun: lastRunMs,
        status,
        message
      })
    } catch (error: any) {
      results.push({
        name: canisterName,
        key,
        running: false,
        lastRun: null,
        status: 'error',
        message: `Failed to check: ${error.message || 'Unknown error'}`
      })
    }
  }))

  // Generate report
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const errors = results.filter(r => r.status === 'error').length
  const total = results.length

  // Overall status
  if (errors > 0 || failed > 0) {
    test.status = 'red'
  } else {
    test.status = 'green'
  }

  // Build HTML report
  let reportHTML = `
    <div class="mb-3">
      <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors out of ${total} archive canisters
    </div>
    <div class="canister-results">
  `

  results.forEach(result => {
    const icon = result.status === 'pass' 
      ? '<i class="fa-solid fa-check-circle text-success"></i>' 
      : result.status === 'fail'
      ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
      : '<i class="fa-solid fa-times-circle text-danger"></i>'
    
    const rowClass = result.status === 'pass' ? 'text-success' : result.status === 'fail' ? 'text-warning' : 'text-danger'
    
    reportHTML += `
      <div class="d-flex align-items-center gap-2 py-1 small ${rowClass}">
        ${icon}
        <span class="fw-bold" style="min-width: 250px">${result.name}</span>
        <span>${result.message}</span>
      </div>
    `
  })

  reportHTML += '</div>'
  test.report = reportHTML
}

// Helper function to format nanosecond timestamps
const formatNanoTime = (nanoTime: bigint): string => {
  return new Date(Number(nanoTime / 1_000_000n)).toLocaleString()
}

// Test: Is the trading bot trading regularly?
const testTradingBotRegular = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('treasury')
    const { idlFactory: treasuryIDL } = await import('../../../declarations/treasury/treasury.did.js')
    const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
    const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app' })
    if (process.env.DFX_NETWORK === 'local') { await agent.fetchRootKey() }
    const tActor: any = Actor.createActor(treasuryIDL, { agent, canisterId: cid })
    const dActor: any = Actor.createActor(daoIDL, { agent, canisterId: resolvePrincipal('dao_backend') })

    let tsRes, tokensResp, longSyncTimerRes
    try {
      [tsRes, tokensResp, , longSyncTimerRes] = await Promise.all([
        tActor.getTradingStatus(),
        dActor.getTokenDetails(),
        tacoStore.getRebalanceConfig().catch(() => null), // Fetch config into store (no variable needed)
        tActor.getLongSyncTimerStatus?.() ?? Promise.resolve(null),
      ])
    } catch (fetchError: any) {
      console.error('[Trading Bot Test] Fetch error:', fetchError)
      const errorMsg = fetchError.message || String(fetchError)
      if (errorMsg.includes('503') || errorMsg.includes('Service Unavailable')) {
        throw new Error('Treasury or DAO canister is unavailable (503 error). The canister may be out of cycles, upgrading, or experiencing network issues.')
      }
      throw new Error(`Failed to fetch trading data: ${errorMsg}`)
    }

    console.log('[Trading Bot Test] tsRes:', tsRes)
    console.log('[Trading Bot Test] rebalanceConfig:', tacoStore.rebalanceConfig)
    console.log('[Trading Bot Test] tokensResp:', tokensResp)

    // Get trading status and interval
    let tradingActive = false
    let lastAttemptNs: any = null
    let intervalNs: any = null
    
    if (tsRes && 'ok' in tsRes) {
      const { metrics, rebalanceStatus } = tsRes.ok
      tradingActive = !!('Trading' in rebalanceStatus)
      lastAttemptNs = metrics?.lastRebalanceAttempt
      console.log('[Trading Bot Test] tradingActive:', tradingActive)
      console.log('[Trading Bot Test] lastAttemptNs:', lastAttemptNs)
    }
    
    // Extract interval from config (now loaded into store)
    if (tacoStore.rebalanceConfig?.rebalanceIntervalNS) {
      intervalNs = tacoStore.rebalanceConfig.rebalanceIntervalNS
      console.log('[Trading Bot Test] intervalNs from store:', intervalNs)
    } else {
      // If config unavailable, use default 30-minute interval (1,800,000,000,000 ns)
      intervalNs = 1_800_000_000_000n
      console.log('[Trading Bot Test] Config unavailable, using default 30min interval')
    }

    // Check 1: Trading bot running and last trade within 5 periods
    if (!tradingActive) {
      checks.push({
        name: 'Trading Bot Status',
        status: 'fail',
        message: '❌ Trading bot is NOT active (status: not Trading)'
      })
    } else if (!lastAttemptNs || Number(lastAttemptNs) === 0) {
      checks.push({
        name: 'Trading Bot Status',
        status: 'fail',
        message: '❌ Trading bot active but no trades recorded (never traded)'
      })
    } else {
      const nowNs = BigInt(Date.now()) * 1_000_000n
      const timeSinceLastTrade = nowNs - BigInt(lastAttemptNs)
      const periods = Number(timeSinceLastTrade / BigInt(intervalNs))
      const lastTradeDisplay = new Date(Number(BigInt(lastAttemptNs) / 1_000_000n)).toLocaleString()
      const intervalMinutes = Number(BigInt(intervalNs) / 1_000_000_000n / 60n)
      
      if (periods > 5) {
        checks.push({
          name: 'Trading Bot Status',
          status: 'fail',
          message: `❌ Last trade was <strong>${periods.toFixed(1)} periods</strong> ago (${lastTradeDisplay}). Expected within 5 periods (interval: ${intervalMinutes}min).`
        })
      } else {
        checks.push({
          name: 'Trading Bot Status',
          status: 'pass',
          message: `✅ Trading bot active. Last trade was <strong>${periods.toFixed(1)} periods</strong> ago (${lastTradeDisplay}, interval: ${intervalMinutes}min).`
        })
      }
    }

    // Parse token data
    const tokenDetails = tokensResp || []
    const tokens = tokenDetails.map((entry: any) => {
      const token = entry[1]
      return {
        symbol: token?.tokenSymbol || 'UNKNOWN',
        active: token?.Active,
        pausedManually: token?.isPaused,
        pausedSyncFailure: token?.pausedDueToSyncFailure,
        isPaused: token?.isPaused || token?.pausedDueToSyncFailure || false
      }
    })

    const totalTokens = tokens.length
    const pausedTokens = tokens.filter((t: any) => t.isPaused)
    const pausedCount = pausedTokens.length
    const icpToken = tokens.find((t: any) => t.symbol === 'ICP')

    // Check 2: All tokens paused (circuit breaker hit)
    if (pausedCount === totalTokens && totalTokens > 0) {
      checks.push({
        name: 'Circuit Breaker Status',
        status: 'fail',
        message: `All ${totalTokens} tokens are paused - Circuit breaker has hit! DAO must unpause tokens to restart trading.`
      })
    } else if (pausedCount === 0) {
      checks.push({
        name: 'Circuit Breaker Status',
        status: 'pass',
        message: 'No tokens paused - circuit breaker not triggered'
      })
    } else {
      checks.push({
        name: 'Circuit Breaker Status',
        status: 'pass',
        message: `${pausedCount} token(s) paused - circuit breaker not triggered`
      })
    }

    // Check 3: ICP paused but others not (error - circuit breaker should have hit)
    if (icpToken && icpToken.isPaused) {
      checks.push({
        name: 'ICP Token Status',
        status: 'fail',
        message: `ICP is paused but ${totalTokens - pausedCount} other tokens are not - Circuit breaker should have hit! DAO must investigate immediately!`
      })
    } else {
      checks.push({
        name: 'ICP Token Status',
        status: 'pass',
        message: 'ICP is trading normally'
      })
    }

    // Check 4: 3+ tokens paused but not all (circuit breaker should have hit)
    if (pausedCount >= 3 && pausedCount < totalTokens) {
      checks.push({
        name: 'Multiple Token Pause Check',
        status: 'fail',
        message: `${pausedCount} tokens are paused (≥3) but not all - Circuit breaker should have hit! DAO should investigate.`
      })
    } else if (pausedCount > 0 && pausedCount < 3) {
      checks.push({
        name: 'Multiple Token Pause Check',
        status: 'pass',
        message: `${pausedCount} token(s) paused - below circuit breaker threshold`
      })
    } else {
      checks.push({
        name: 'Multiple Token Pause Check',
        status: 'pass',
        message: 'All tokens trading normally - no pauses detected'
      })
    }

    // Get executed trades and metrics for analysis
    const executedTrades = tsRes?.ok?.executedTrades || []
    const metrics = tsRes?.ok?.metrics
    const allTimeAvgSlippage = metrics?.avgSlippage ? Number(metrics.avgSlippage).toFixed(2) : 'N/A'
    
    // Get slippage tolerance from config (now loaded into store)
    let maxSlippagePct = null
    if (tacoStore.rebalanceConfig?.maxSlippageBasisPoints) {
      maxSlippagePct = Number(tacoStore.rebalanceConfig.maxSlippageBasisPoints) / 100
      console.log('[Trading Bot Test] Slippage tolerance from store:', maxSlippagePct, '%')
    } else {
      console.warn('[Trading Bot Test] Slippage tolerance not available - config not loaded')
    }

    // Check 5: Failed trades analysis
    if (executedTrades.length > 0) {
      const last100 = executedTrades.slice(-100)
      const failedLast100 = last100.filter((t: any) => !t.success).length
      const failedAll = executedTrades.filter((t: any) => !t.success).length
      
      const failRateLast100 = (failedLast100 / last100.length) * 100
      const failRateAll = (failedAll / executedTrades.length) * 100
      
      let failStatus: 'pass' | 'fail' | 'error' = 'pass'
      let failMessage = ''
      
      if (failRateLast100 > 10) {
        failStatus = 'fail'
        failMessage = `❌ <strong>${failedLast100}/${last100.length}</strong> trades failed in last 100 (<strong>${failRateLast100.toFixed(1)}%</strong> > 10% threshold). All trades: ${failedAll}/${executedTrades.length} (<strong>${failRateAll.toFixed(1)}%</strong>).`
      } else if (failRateAll > 3) {
        failStatus = 'fail'
        failMessage = `❌ Overall failure rate is <strong>${failRateAll.toFixed(1)}%</strong> (${failedAll}/${executedTrades.length} trades) > 3% threshold. Last 100: ${failedLast100}/${last100.length} (<strong>${failRateLast100.toFixed(1)}%</strong>).`
      } else {
        failMessage = `✅ Failure rates within limits. Last 100: ${failedLast100}/${last100.length} (<strong>${failRateLast100.toFixed(1)}%</strong>). All: ${failedAll}/${executedTrades.length} (<strong>${failRateAll.toFixed(1)}%</strong>).`
      }
      
      checks.push({
        name: 'Trade Failure Rate',
        status: failStatus,
        message: failMessage
      })

      // Check 6: Slippage analysis
      const tradesWithSlippage = executedTrades.filter((t: any) => t.success && t.slippage != null)
      const last100WithSlippage = last100.filter((t: any) => t.success && t.slippage != null)
      
      if (tradesWithSlippage.length > 0) {
        const slippagesLast100 = last100WithSlippage.map((t: any) => Number(t.slippage))
        const slippagesAll = tradesWithSlippage.map((t: any) => Number(t.slippage))
        
        const avgSlippageLast100 = slippagesLast100.reduce((a: number, b: number) => a + b, 0) / slippagesLast100.length
        const avgSlippageAll = slippagesAll.reduce((a: number, b: number) => a + b, 0) / slippagesAll.length
        const worstSlippageLast100 = Math.max(...slippagesLast100)
        
        // Slippage is already stored as percentage (0.49 = 0.49%), no need to multiply by 100
        const avgSlippageLast100Pct = avgSlippageLast100.toFixed(2)
        const avgSlippageAllPct = avgSlippageAll.toFixed(2)
        const worstSlippageLast100Pct = worstSlippageLast100.toFixed(2)
        
        let slippageStatus: 'pass' | 'fail' | 'error' = 'pass'
        let slippageMessage = ''
        
        if (maxSlippagePct && worstSlippageLast100 > maxSlippagePct) {
          slippageStatus = 'fail'
          slippageMessage = `❌ Worst slippage in last 100 trades: <strong>${worstSlippageLast100Pct}%</strong> exceeds tolerance of <strong>${maxSlippagePct.toFixed(2)}%</strong>. Avg last 100: ${avgSlippageLast100Pct}%. Avg all: ${avgSlippageAllPct}%. All-time avg: ${allTimeAvgSlippage}%.`
        } else if (maxSlippagePct) {
          slippageMessage = `✅ Worst slippage: <strong>${worstSlippageLast100Pct}%</strong> ≤ tolerance (${maxSlippagePct.toFixed(2)}%). Avg last 100: <strong>${avgSlippageLast100Pct}%</strong>. Avg all: <strong>${avgSlippageAllPct}%</strong>. All-time: ${allTimeAvgSlippage}%.`
        } else {
          slippageMessage = `⚠️ Slippage stats: Worst last 100: <strong>${worstSlippageLast100Pct}%</strong>. Avg last 100: <strong>${avgSlippageLast100Pct}%</strong>. Avg all: <strong>${avgSlippageAllPct}%</strong>. All-time: ${allTimeAvgSlippage}%. (Tolerance not available - failed to fetch config).`
        }
        
        checks.push({
          name: 'Slippage Analysis',
          status: slippageStatus,
          message: slippageMessage
        })
      } else {
        checks.push({
          name: 'Slippage Analysis',
          status: 'error',
          message: '⚠️ No successful trades with slippage data available for analysis'
        })
      }
    } else {
      checks.push({
        name: 'Trade History',
        status: 'error',
        message: '⚠️ No trade history available for analysis'
      })
    }

    // ===== Check 7: Short Sync Timer Status =====
    const shortSyncActive = tsRes && 'ok' in tsRes ? tsRes.ok.metrics?.lastUpdate : null
    const shortSyncIntervalNs = 900_000_000_000n // 15 minutes
    const shortSyncMaxDelayNs = shortSyncIntervalNs * 5n // 5 periods
    
    if (shortSyncActive) {
      const nowNs = BigInt(Date.now()) * 1_000_000n
      const shortSyncLastNs = BigInt(shortSyncActive)
      const shortSyncDelayNs = nowNs - shortSyncLastNs
      const shortSyncPeriodsBehind = Number(shortSyncDelayNs) / Number(shortSyncIntervalNs)
      
      let shortSyncStatus: 'pass' | 'fail' | 'error' = 'pass'
      let shortSyncMessage = ''
      
      if (shortSyncDelayNs > shortSyncMaxDelayNs) {
        shortSyncStatus = 'fail'
        shortSyncMessage = `❌ Short sync is overdue by <strong>${shortSyncPeriodsBehind.toFixed(1)}</strong> periods (last sync: ${formatNanoTime(shortSyncLastNs)}). Maximum allowed: 5 periods.`
      } else {
        shortSyncMessage = `✅ Short sync is on schedule (last sync: ${formatNanoTime(shortSyncLastNs)}, <strong>${shortSyncPeriodsBehind.toFixed(1)}</strong> periods ago).`
      }
      
      checks.push({
        name: 'Short Sync Timer',
        status: shortSyncStatus,
        message: shortSyncMessage
      })
    } else {
      checks.push({
        name: 'Short Sync Timer',
        status: 'error',
        message: '⚠️ Unable to determine short sync timer status'
      })
    }

    // ===== Check 8: Long Sync Timer Status =====
    if (longSyncTimerRes) {
      const timerStatus: any = longSyncTimerRes
      const longSyncRunning = timerStatus.isRunning || false
      const longSyncLastRun = timerStatus.lastRunTime || null
      const longSyncIntervalNs = timerStatus.intervalNS ? BigInt(timerStatus.intervalNS) : 18_000_000_000_000n // 5 hours default
      const longSyncMaxDelayNs = longSyncIntervalNs * 5n // 5 periods
      
      let longSyncStatus: 'pass' | 'fail' | 'error' = 'pass'
      let longSyncMessage = ''
      
      if (!longSyncRunning) {
        longSyncStatus = 'fail'
        longSyncMessage = `❌ Long sync timer is <strong>not running</strong>.`
      } else if (longSyncLastRun) {
        const nowNs = BigInt(Date.now()) * 1_000_000n
        const longSyncLastNs = BigInt(longSyncLastRun)
        const longSyncDelayNs = nowNs - longSyncLastNs
        const longSyncPeriodsBehind = Number(longSyncDelayNs) / Number(longSyncIntervalNs)
        
        if (longSyncDelayNs > longSyncMaxDelayNs) {
          longSyncStatus = 'fail'
          longSyncMessage = `❌ Long sync is overdue by <strong>${longSyncPeriodsBehind.toFixed(1)}</strong> periods (last sync: ${formatNanoTime(longSyncLastNs)}). Maximum allowed: 5 periods.`
        } else {
          longSyncMessage = `✅ Long sync is on schedule (last sync: ${formatNanoTime(longSyncLastNs)}, <strong>${longSyncPeriodsBehind.toFixed(1)}</strong> periods ago).`
        }
      } else {
        longSyncMessage = `✅ Long sync timer is running (no previous run recorded yet).`
      }
      
      checks.push({
        name: 'Long Sync Timer',
        status: longSyncStatus,
        message: longSyncMessage
      })
    } else {
      checks.push({
        name: 'Long Sync Timer',
        status: 'error',
        message: '⚠️ Unable to fetch long sync timer status'
      })
    }

    // Overall status
    const anyFailed = checks.some(c => c.status === 'fail')
    const anyError = checks.some(c => c.status === 'error')
    
    if (anyError || anyFailed) {
      test.status = 'red'
    } else {
      test.status = 'green'
    }

    // Build HTML report
    const passed = checks.filter(c => c.status === 'pass').length
    const failed = checks.filter(c => c.status === 'fail').length
    const errors = checks.filter(c => c.status === 'error').length

    let reportHTML = `
      <div class="mb-3">
        <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors
      </div>
      <div class="canister-results">
    `

    checks.forEach(check => {
      const icon = check.status === 'pass' 
        ? '<i class="fa-solid fa-check-circle text-success"></i>' 
        : check.status === 'fail'
        ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
        : '<i class="fa-solid fa-times-circle text-danger"></i>'
      
      const rowClass = check.status === 'pass' ? 'text-success' : check.status === 'fail' ? 'text-warning' : 'text-danger'
      
      reportHTML += `
        <div class="d-flex align-items-start gap-2 py-2 small ${rowClass}">
          <div class="mt-1">${icon}</div>
          <div>
            <div class="fw-bold">${check.name}</div>
            <div>${check.message}</div>
          </div>
        </div>
      `
    })

    // Add paused tokens list if any
    if (pausedTokens.length > 0 && pausedTokens.length < totalTokens) {
      reportHTML += `
        <div class="mt-3 pt-2 border-top border-secondary">
          <div class="fw-bold small mb-2">Paused Tokens (${pausedTokens.length}):</div>
          <div class="d-flex flex-wrap gap-2">
      `
      pausedTokens.forEach((token: any) => {
        const reason = token.pausedSyncFailure ? 'Sync Failed' : 'Manually Paused'
        reportHTML += `
          <span class="badge bg-warning text-dark">${token.symbol} (${reason})</span>
        `
      })
      reportHTML += '</div></div>'
    }

    reportHTML += '</div>'
    test.report = reportHTML

  } catch (error: any) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check trading bot status'}</div>`
  }
}

// Test: Are portfolio snapshots regular?
const testPortfolioSnapshots = async (test: any) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'error'; message: string }> = []
  
  try {
    const cid = resolvePrincipal('treasury')
    const { idlFactory: treasuryIDL } = await import('../../../declarations/treasury/treasury.did.js')
    const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://ic0.app' })
    if (process.env.DFX_NETWORK === 'local') { await agent.fetchRootKey() }
    const tActor: any = Actor.createActor(treasuryIDL, { agent, canisterId: cid })

    // Fetch snapshot status
    const snapStatus = await tActor.getPortfolioSnapshotStatus()
    
    // Check 1: Snapshot timer running
    const snapshotRunning = !!('Running' in snapStatus.status)
    
    if (!snapshotRunning) {
      checks.push({
        name: 'Snapshot Timer Status',
        status: 'fail',
        message: '❌ Portfolio snapshot timer is <strong>not running</strong>.'
      })
    } else {
      checks.push({
        name: 'Snapshot Timer Status',
        status: 'pass',
        message: '✅ Portfolio snapshot timer is running.'
      })
    }
    
    // Check 2: Last snapshot not too old
    if (snapStatus.lastSnapshotTime && snapStatus.intervalMinutes) {
      const intervalNs = BigInt(snapStatus.intervalMinutes) * 60n * 1_000_000_000n // Convert minutes to nanoseconds
      const maxDelayNs = intervalNs * 5n // 5 periods
      const nowNs = BigInt(Date.now()) * 1_000_000n
      const lastSnapshotNs = BigInt(snapStatus.lastSnapshotTime)
      const delayNs = nowNs - lastSnapshotNs
      const periodsBehind = Number(delayNs) / Number(intervalNs)
      
      let snapshotTimingStatus: 'pass' | 'fail' | 'error' = 'pass'
      let snapshotTimingMessage = ''
      
      if (delayNs > maxDelayNs) {
        snapshotTimingStatus = 'fail'
        snapshotTimingMessage = `❌ Last snapshot is overdue by <strong>${periodsBehind.toFixed(1)}</strong> periods (last snapshot: ${formatNanoTime(lastSnapshotNs)}). Maximum allowed: 5 periods. Interval: ${snapStatus.intervalMinutes} minutes.`
      } else {
        snapshotTimingMessage = `✅ Snapshots are on schedule (last snapshot: ${formatNanoTime(lastSnapshotNs)}, <strong>${periodsBehind.toFixed(1)}</strong> periods ago). Interval: ${snapStatus.intervalMinutes} minutes.`
      }
      
      checks.push({
        name: 'Snapshot Timing',
        status: snapshotTimingStatus,
        message: snapshotTimingMessage
      })
    } else {
      checks.push({
        name: 'Snapshot Timing',
        status: 'error',
        message: '⚠️ Unable to determine snapshot timing (missing lastSnapshotTime or intervalMinutes)'
      })
    }
    
    // Overall status
    const anyFailed = checks.some(c => c.status === 'fail')
    const anyError = checks.some(c => c.status === 'error')
    
    if (anyError || anyFailed) {
      test.status = 'red'
    } else {
      test.status = 'green'
    }

    // Build HTML report
    const passed = checks.filter(c => c.status === 'pass').length
    const failed = checks.filter(c => c.status === 'fail').length
    const errors = checks.filter(c => c.status === 'error').length

    let reportHTML = `
      <div class="mb-3">
        <strong>Results:</strong> ${passed} passed, ${failed} failed, ${errors} errors
      </div>
      <div class="canister-results">
    `

    checks.forEach(check => {
      const icon = check.status === 'pass' 
        ? '<i class="fa-solid fa-check-circle text-success"></i>' 
        : check.status === 'fail'
        ? '<i class="fa-solid fa-exclamation-triangle text-warning"></i>'
        : '<i class="fa-solid fa-times-circle text-danger"></i>'
      
      const rowClass = check.status === 'pass' ? 'text-success' : check.status === 'fail' ? 'text-warning' : 'text-danger'
      
      reportHTML += `
        <div class="d-flex align-items-start gap-2 py-2 small ${rowClass}">
          <div class="mt-1">${icon}</div>
          <div>
            <div class="fw-bold">${check.name}</div>
            <div>${check.message}</div>
          </div>
        </div>
      `
    })

    reportHTML += '</div>'
    test.report = reportHTML

  } catch (error: any) {
    test.status = 'red'
    test.report = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message || 'Failed to check portfolio snapshot status'}</div>`
  }
}

onMounted(() => {
  // CRITICAL FIX: Turn off app loading immediately - SystemView doesn't need it
  // The app-level loading curtain was blocking all user interaction
  if (appLoading.value) {
    tacoStore.appLoadingOff()
  }
  
  // Start data fetching in background without blocking UI
  refreshCycles()
  
  // Check admin permissions asynchronously without blocking
  ;(async () => {
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
    // check permission for a read-safe function like getLogs
    isAdmin.value = await daoActor.hasAdminPermission(identity.getPrincipal(), { getLogs: null })
  } catch (_) {
    isAdmin.value = false
  }
  })()
})

</script>


