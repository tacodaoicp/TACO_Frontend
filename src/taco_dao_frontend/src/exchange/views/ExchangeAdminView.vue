<template>
  <div class="admin-view tx-scroll">
    <div class="admin-view__shell">
    <main class="admin-view__main">
      <!-- Admin chrome: ⚠ MAINNET badge + principal chip (danger tone) -->
      <div class="tx-row tx-row--between admin-view__chrome">
        <div class="tx-row" style="gap: 10px">
          <div class="tx-logo-mark">t</div>
          <div style="font-weight: 700; font-size: 18px">Admin</div>
          <span class="tx-badge tx-badge--warning" style="text-transform: uppercase">⚠ MAINNET</span>
        </div>
        <span v-if="store.principalText" class="tx-mono tx-ink-3" style="font-size: 11px">
          signed in as <span class="tx-orange">{{ store.principalText.slice(0, 8) }}…{{ store.principalText.slice(-5) }}</span>
        </span>
      </div>

      <div v-if="!store.isAuthenticated" class="admin-view__warning">
        Connect your wallet to access admin functions.
      </div>
      <div v-else-if="!isAdmin" class="admin-view__warning">
        Your wallet is not authorized for admin access.
      </div>

      <template v-else-if="isAdmin">
        <!-- Tabs -->
        <div class="ex-tab-bar admin-view__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="ex-tab-btn"
            :class="{ 'ex-tab-btn--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >{{ tab.label }}</button>
        </div>

        <div class="admin-view__content">
          <!-- Freeze Control -->
          <div v-if="activeTab === 'freeze'" class="admin-view__section">
            <h3>Exchange Freeze</h3>
            <p>Toggle the exchange on/off. When frozen, no trades can be executed.</p>
            <button class="ex-btn ex-btn--sell" @click="toggleFreeze" :disabled="busy">
              {{ busy ? 'Processing...' : 'Toggle Freeze' }}
            </button>
            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>

          <!-- Token Management -->
          <div v-if="activeTab === 'tokens'" class="admin-view__section">
            <h3>Token Management</h3>

            <div class="admin-view__subsection">
              <h4>Add Token</h4>
              <div class="admin-view__field">
                <label>Canister ID</label>
                <input v-model="tokenCanisterId" class="ex-input" placeholder="e.g., ryjl3-tyaaa-aaaaa-aaaba-cai" />
              </div>
              <div class="admin-view__field">
                <label>Minimum Amount</label>
                <input v-model="tokenMinAmount" type="text" inputmode="numeric" class="ex-input num" placeholder="10000" />
              </div>
              <div class="admin-view__field">
                <label>Standard</label>
                <select v-model="tokenStandard" class="ex-input">
                  <option value="ICP">ICP</option>
                  <option value="ICRC12">ICRC-1/2</option>
                  <option value="ICRC3">ICRC-3</option>
                </select>
              </div>
              <button class="ex-btn ex-btn--primary" @click="addToken" :disabled="busy">Add Token</button>
            </div>

            <div class="admin-view__subsection">
              <h4>Pause Token</h4>
              <select v-model="pauseTokenId" class="ex-input">
                <option value="">Select token</option>
                <option v-for="t in store.tokens" :key="t.address" :value="t.address">
                  {{ t.symbol }} ({{ t.address.slice(0, 10) }}...)
                </option>
              </select>
              <button class="ex-btn ex-btn--outline" @click="doPauseToken" :disabled="busy || !pauseTokenId">
                Toggle Pause
              </button>
            </div>
            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>

          <!-- Fee Management -->
          <div v-if="activeTab === 'fees'" class="admin-view__section">
            <h3>Fee Management</h3>
            <div class="admin-view__field">
              <label>Trading Fee (bps, current: {{ store.tradingFeeBps }})</label>
              <input v-model="newTradingFee" type="text" inputmode="numeric" class="ex-input num" placeholder="5" />
              <button class="ex-btn ex-btn--primary" @click="changeTradingFee" :disabled="busy">Update</button>
            </div>
            <div class="admin-view__field">
              <label>Revoke Fee Divisor (current: {{ store.revokeFeeDivisor }})</label>
              <input v-model="newRevokeFee" type="text" inputmode="numeric" class="ex-input num" placeholder="5" />
              <button class="ex-btn ex-btn--primary" @click="changeRevokeFee" :disabled="busy">Update</button>
            </div>
            <div class="admin-view__field">
              <label>Referral % (current: {{ store.referralFeePct }})</label>
              <input v-model="newReferralFee" type="text" inputmode="numeric" class="ex-input num" placeholder="20" />
              <button class="ex-btn ex-btn--primary" @click="changeReferralFee" :disabled="busy">Update</button>
            </div>
            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>

          <!-- Ban Management -->
          <div v-if="activeTab === 'bans'" class="admin-view__section">
            <h3>User Bans</h3>
            <div class="admin-view__field">
              <label>Remove from Day Ban (Principal)</label>
              <input v-model="unbanPrincipal" class="ex-input" placeholder="Principal text" />
              <button class="ex-btn ex-btn--primary" @click="removeFromDayBan" :disabled="busy">Remove Day Ban</button>
            </div>
            <div class="admin-view__field">
              <label>Add to Permanent Ban (Principal)</label>
              <input v-model="permaBanPrincipal" class="ex-input" placeholder="Principal text" />
              <button class="ex-btn ex-btn--sell" @click="addPermaBan" :disabled="busy">Permanent Ban</button>
            </div>
            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>

          <!-- Audit -->
          <div v-if="activeTab === 'audit'" class="admin-view__section">
            <h3>Balance Audit</h3>
            <button class="ex-btn ex-btn--outline" @click="runAudit" :disabled="busy">
              {{ busy ? 'Running...' : 'Run Audit (checkDiffs)' }}
            </button>
            <pre v-if="auditResult" class="admin-view__pre">{{ auditResult }}</pre>
          </div>

          <!-- Collect Fees -->
          <div v-if="activeTab === 'collect'" class="admin-view__section">
            <h3>Fee Collection</h3>
            <p>Collect accumulated trading fees from all pools.</p>
            <button class="ex-btn ex-btn--primary" @click="doCollectFees" :disabled="busy">
              {{ busy ? 'Collecting...' : 'Collect Fees' }}
            </button>
            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>

          <!-- Logs -->
          <div v-if="activeTab === 'logs'" class="admin-view__section">
            <h3>Operation Logs</h3>
            <div class="admin-view__field">
              <label>Log Category</label>
              <select v-model="logCategory" class="ex-input">
                <option value="addAcceptedToken">addAcceptedToken</option>
                <option value="FinishSellBatchDAO">FinishSellBatchDAO</option>
              </select>
            </div>
            <button class="ex-btn ex-btn--outline" @click="loadLogs" :disabled="busy">
              {{ busy ? 'Loading...' : 'Load Logs' }}
            </button>
            <pre v-if="logData" class="admin-view__pre">{{ logData }}</pre>
          </div>

          <!-- Trades (global view) -->
          <div v-if="activeTab === 'trades'" class="admin-view__section">
            <h3>Global Trade View</h3>
            <p>Fetch all trades globally. These queries are expensive — use sparingly.</p>
            <div class="admin-view__subsection">
              <h4>Public Trades</h4>
              <button class="ex-btn ex-btn--outline" @click="loadAllPublicTrades" :disabled="busy">
                {{ busy ? 'Loading...' : 'Dump All Public Trades' }}
              </button>
            </div>
            <div class="admin-view__subsection">
              <h4>Private Trades</h4>
              <button class="ex-btn ex-btn--outline" @click="loadAllPrivateTrades" :disabled="busy">
                {{ busy ? 'Loading...' : 'Dump All Private Trades' }}
              </button>
            </div>
            <div v-if="tradesData" class="admin-view__field">
              <label>Results ({{ tradesCount }} trades)</label>
              <pre class="admin-view__pre">{{ tradesData }}</pre>
            </div>
          </div>

          <!-- DAO Operations -->
          <div v-if="activeTab === 'dao'" class="admin-view__section">
            <h3>DAO Operations</h3>

            <div class="admin-view__subsection">
              <h4>Retrieve DAO Funds</h4>
              <p>Recover funds stuck in treasury from DAO operations.</p>
              <div class="admin-view__field">
                <label>Token Canister ID</label>
                <input v-model="daoRetrieveToken" class="ex-input" placeholder="e.g., ryjl3-tyaaa..." />
              </div>
              <div class="admin-view__field">
                <label>Block Number</label>
                <input v-model="daoRetrieveBlock" type="text" inputmode="numeric" class="ex-input num" placeholder="12345" />
              </div>
              <button class="ex-btn ex-btn--primary" @click="doRetrieveFundsDao" :disabled="busy">Retrieve Funds</button>
            </div>

            <div class="admin-view__subsection">
              <h4>Recalibrate DAO Position</h4>
              <p>Adjust an existing DAO order position.</p>
              <div class="admin-view__field">
                <label>Access Code</label>
                <input v-model="daoRecalAccesscode" class="ex-input" placeholder="PublicXYZ..." />
              </div>
              <div class="admin-view__field">
                <label>ICP Price (numerator, denominator)</label>
                <div style="display:flex;gap:8px">
                  <input v-model="daoRecalPriceNum" type="text" inputmode="numeric" class="ex-input num" placeholder="100000000" />
                  <input v-model="daoRecalPriceDen" type="text" inputmode="numeric" class="ex-input num" placeholder="1" />
                </div>
              </div>
              <div class="admin-view__field">
                <label>Decimals (token0, token1)</label>
                <div style="display:flex;gap:8px">
                  <input v-model="daoRecalDec0" type="text" inputmode="numeric" class="ex-input num" placeholder="8" />
                  <input v-model="daoRecalDec1" type="text" inputmode="numeric" class="ex-input num" placeholder="8" />
                </div>
              </div>
              <button class="ex-btn ex-btn--primary" @click="doRecalibrateDAO" :disabled="busy">Recalibrate</button>
            </div>

            <div class="admin-view__subsection">
              <h4>DAO Token Info</h4>
              <button class="ex-btn ex-btn--outline" @click="doSendDAOInfo" :disabled="busy">
                {{ busy ? 'Loading...' : 'Get DAO Info' }}
              </button>
            </div>

            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>

          <!-- Debug -->
          <div v-if="activeTab === 'debug'" class="admin-view__section">
            <h3>Debug Utilities</h3>

            <div class="admin-view__subsection">
              <h4>Cycle Balance</h4>
              <button class="ex-btn ex-btn--outline" @click="loadCycles" :disabled="busy">
                {{ busy ? 'Checking...' : 'Check Cycles' }}
              </button>
              <div v-if="cyclesDisplay" class="admin-view__result">{{ cyclesDisplay }}</div>
            </div>

            <div class="admin-view__subsection">
              <h4>Timer</h4>
              <p>Force-start the canister periodic timer if it appears stuck.</p>
              <button class="ex-btn ex-btn--outline" @click="doAddTimer" :disabled="busy">Trigger Timer</button>
            </div>

            <div class="admin-view__subsection">
              <h4>Flush Transfer Queue</h4>
              <button class="ex-btn ex-btn--outline" @click="doFlushQueue" :disabled="busy">Flush Queue</button>
            </div>

            <div class="admin-view__subsection">
              <h4>Test Mode</h4>
              <p>Toggle test mode (immediate transfers). Never enable on mainnet.</p>
              <div style="display:flex;gap:8px">
                <button class="ex-btn ex-btn--primary" @click="doSetTest(true)" :disabled="busy">Enable Test</button>
                <button class="ex-btn ex-btn--outline" @click="doSetTest(false)" :disabled="busy">Disable Test</button>
              </div>
            </div>

            <div class="admin-view__subsection">
              <h4>Change Owner</h4>
              <p>Extremely dangerous. Transfer owner principal.</p>
              <div class="admin-view__field">
                <label>New Owner2 Principal</label>
                <input v-model="newOwner2" class="ex-input" placeholder="Principal text" />
                <button class="ex-btn ex-btn--sell" @click="doChangeOwner2" :disabled="busy || !newOwner2">Change Owner2</button>
              </div>
              <div class="admin-view__field">
                <label>New Owner3 Principal</label>
                <input v-model="newOwner3" class="ex-input" placeholder="Principal text" />
                <button class="ex-btn ex-btn--sell" @click="doChangeOwner3" :disabled="busy || !newOwner3">Change Owner3</button>
              </div>
            </div>

            <div v-if="result" class="admin-view__result">{{ result }}</div>
          </div>
        </div>
      </template>
    </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Principal } from '@dfinity/principal'
// ExchangeHeader replaced by inline admin chrome (MAINNET badge + principal).
import { useExchangeStore } from '../store/exchange.store'
import { ADMIN_PRINCIPALS } from '../../composables/useAdminCheck'
import { useExchangeToast } from '../composables/useExchangeToast'

const store = useExchangeStore()
const toast = useExchangeToast()
const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(store.principalText))

const activeTab = ref('freeze')
const busy = ref(false)
const result = ref('')

const tabs = [
  { key: 'freeze', label: 'Freeze' },
  { key: 'tokens', label: 'Tokens' },
  { key: 'fees', label: 'Fees' },
  { key: 'bans', label: 'Bans' },
  { key: 'audit', label: 'Audit' },
  { key: 'collect', label: 'Collect' },
  { key: 'logs', label: 'Logs' },
  { key: 'trades', label: 'Trades' },
  { key: 'dao', label: 'DAO' },
  { key: 'debug', label: 'Debug' },
]

// Token management
const tokenCanisterId = ref('')
const tokenMinAmount = ref('10000')
const tokenStandard = ref('ICRC12')
const pauseTokenId = ref('')

// Fee management
const newTradingFee = ref('')
const newRevokeFee = ref('')
const newReferralFee = ref('')

// Ban management
const unbanPrincipal = ref('')
const permaBanPrincipal = ref('')

// Audit
const auditResult = ref('')

// Logs
const logData = ref('')
const logCategory = ref<'addAcceptedToken' | 'FinishSellBatchDAO'>('addAcceptedToken')

// Trades
const tradesData = ref('')
const tradesCount = ref(0)

// DAO
const daoRetrieveToken = ref('')
const daoRetrieveBlock = ref('')
const daoRecalAccesscode = ref('')
const daoRecalPriceNum = ref('100000000')
const daoRecalPriceDen = ref('1')
const daoRecalDec0 = ref('8')
const daoRecalDec1 = ref('8')

// Debug
const cyclesDisplay = ref('')
const newOwner2 = ref('')
const newOwner3 = ref('')

async function withBusy(fn: () => Promise<any>) {
  busy.value = true
  result.value = ''
  try {
    const r = await fn()
    if (r && typeof r === 'object' && 'Ok' in r) {
      result.value = typeof r.Ok === 'string' ? r.Ok : JSON.stringify(r.Ok, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
      toast.success('Action Complete', result.value.slice(0, 80))
    } else if (r && typeof r === 'object' && 'Err' in r) {
      const { classifyExchangeError } = await import('../utils/errors')
      const classified = classifyExchangeError(r.Err)
      result.value = classified.message
      toast.error('Action Failed', classified.message)
    } else {
      result.value = typeof r === 'string' ? r : JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
      toast.success('Action Complete', result.value.slice(0, 80))
    }
  } catch (err: any) {
    result.value = `Error: ${err.message || err}`
    toast.error('Action Failed', err.message || String(err))
  } finally {
    busy.value = false
  }
}

async function toggleFreeze() {
  await withBusy(() => store.freeze())
}

async function addToken() {
  const standards: Record<string, any> = { ICP: { ICP: null }, ICRC12: { ICRC12: null }, ICRC3: { ICRC3: null } }
  await withBusy(() => store.addAcceptedToken(
    { Add: null },
    tokenCanisterId.value,
    BigInt(tokenMinAmount.value || '10000'),
    standards[tokenStandard.value],
  ))
}

async function doPauseToken() {
  await withBusy(() => store.pauseToken(pauseTokenId.value))
}

async function changeTradingFee() {
  await withBusy(() => store.changeTradingFees(BigInt(newTradingFee.value || '5')))
}

async function changeRevokeFee() {
  await withBusy(() => store.changeRevokeFees(BigInt(newRevokeFee.value || '5')))
}

async function changeReferralFee() {
  await withBusy(() => store.changeReferralFees(BigInt(newReferralFee.value || '20')))
}

async function removeFromDayBan() {
  await withBusy(() => store.parameterManagement({
    deleteAllowedCanisters: [],
    changeAllowedCalls: [],
    deleteFromDayBan: [[unbanPrincipal.value]],
    treasury_principal: [],
    deleteFromAllTimeBan: [],
    addToAllTimeBan: [],
    addAllowedCanisters: [],
    changeallowedSilentWarnings: [],
  }))
}

async function addPermaBan() {
  await withBusy(() => store.parameterManagement({
    deleteAllowedCanisters: [],
    changeAllowedCalls: [],
    deleteFromDayBan: [],
    treasury_principal: [],
    deleteFromAllTimeBan: [],
    addToAllTimeBan: [[permaBanPrincipal.value]],
    addAllowedCanisters: [],
    changeallowedSilentWarnings: [],
  }))
}

async function runAudit() {
  busy.value = true
  auditResult.value = 'Running audit (this may take up to 2 minutes)...'
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Audit timed out after 2 minutes')), 120_000))
    const r = await Promise.race([store.checkDiffs(true, true), timeout])
    auditResult.value = JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
    toast.success('Audit Complete')
  } catch (err: any) {
    auditResult.value = `Error: ${err.message || err}`
    toast.error('Audit Failed', err.message || 'Unknown error')
  } finally {
    busy.value = false
  }
}

async function doCollectFees() {
  await withBusy(() => store.collectFees())
}

async function loadLogs() {
  busy.value = true
  logData.value = ''
  try {
    const cat = logCategory.value === 'FinishSellBatchDAO'
      ? { FinishSellBatchDAO: null } as const
      : { addAcceptedToken: null } as const
    const r = await store.getLogging(cat, 50n)
    logData.value = JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
  } catch (err: any) {
    logData.value = `Error: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

// ── Trades ──

const jsonReplacer = (_: string, v: unknown) => typeof v === 'bigint' ? v.toString() : v

async function loadAllPublicTrades() {
  busy.value = true
  tradesData.value = ''
  tradesCount.value = 0
  try {
    const r = await store.getAllTradesPublic()
    const data = r.length ? r[0] : null
    tradesCount.value = data ? data[1].length : 0
    tradesData.value = JSON.stringify(data, jsonReplacer, 2)
  } catch (err: any) {
    tradesData.value = `Error: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

async function loadAllPrivateTrades() {
  busy.value = true
  tradesData.value = ''
  tradesCount.value = 0
  try {
    const r = await store.getAllTradesPrivateCostly()
    const data = r.length ? r[0] : null
    tradesCount.value = data ? data[1].length : 0
    tradesData.value = JSON.stringify(data, jsonReplacer, 2)
  } catch (err: any) {
    tradesData.value = `Error: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

// ── DAO ──

async function doRetrieveFundsDao() {
  await withBusy(async () => {
    const pairs: [string, bigint][] = [[daoRetrieveToken.value, BigInt(daoRetrieveBlock.value || '0')]]
    return store.retrieveFundsDao(pairs)
  })
}

async function doRecalibrateDAO() {
  await withBusy(async () => {
    const positions = [{
      accesscode: daoRecalAccesscode.value,
      ICPprice: [BigInt(daoRecalPriceNum.value || '0'), BigInt(daoRecalPriceDen.value || '1')] as [bigint, bigint],
      decimals: [BigInt(daoRecalDec0.value || '8'), BigInt(daoRecalDec1.value || '8')] as [bigint, bigint],
    }]
    return store.recalibrateDAOpositions(positions)
  })
}

async function doSendDAOInfo() {
  await withBusy(() => store.sendDAOInfo())
}

// ── Debug ──

async function loadCycles() {
  busy.value = true
  cyclesDisplay.value = ''
  try {
    const cycles = await store.getCycles()
    const t = Number(cycles) / 1e12
    const status = t > 5 ? '🟢 Healthy' : t > 1 ? '🟡 Low' : '🔴 Critical'
    cyclesDisplay.value = `${t.toFixed(2)}T cycles — ${status}`
  } catch (err: any) {
    cyclesDisplay.value = `Error: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

async function doAddTimer() {
  await withBusy(() => store.addTimer())
}

async function doFlushQueue() {
  await withBusy(() => store.fixStuckTX('partial'))
}

async function doSetTest(enabled: boolean) {
  await withBusy(() => store.setTest(enabled))
}

async function doChangeOwner2() {
  if (!confirm(`Change owner2 to ${newOwner2.value}? This is extremely dangerous.`)) return
  if (!confirm('Are you ABSOLUTELY sure? This cannot be undone.')) return
  await withBusy(() => store.changeOwner2(Principal.fromText(newOwner2.value)))
}

async function doChangeOwner3() {
  if (!confirm(`Change owner3 to ${newOwner3.value}? This is extremely dangerous.`)) return
  if (!confirm('Are you ABSOLUTELY sure? This cannot be undone.')) return
  await withBusy(() => store.changeOwner3(Principal.fromText(newOwner3.value)))
}
</script>

<style scoped lang="scss">
.admin-view {
  min-height: 100vh;
  background: var(--tx-bg);
  padding: clamp(20px, 3vw, 24px) clamp(16px, 4vw, 36px) 60px;
  overflow-y: auto;

  &__shell {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__chrome { margin-bottom: 4px; }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__heading {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4);
  }

  &__warning {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    padding: var(--space-8);
    text-align: center;
  }

  &__tabs {
    flex-wrap: wrap;
  }

  &__content {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-top: none;
    border-radius: 0 0 8px 8px;
    min-height: 300px;
  }

  &__section {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    h3 { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--text-primary); margin: 0; }
    h4 { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-secondary); margin: 0; }
    p { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
  }

  &__subsection {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-primary);
    border-radius: 8px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
    }
  }

  &__result {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    background: var(--bg-primary);
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    font-family: var(--font-mono);
    word-break: break-all;
  }

  &__pre {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--text-secondary);
    background: var(--bg-primary);
    padding: var(--space-3);
    border-radius: 6px;
    overflow: auto;
    max-height: 400px;
    white-space: pre-wrap;
    margin: 0;
  }
}
</style>
