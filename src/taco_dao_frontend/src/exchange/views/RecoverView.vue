<template>
  <div class="recover-view tx-scroll">
    <div class="recover-view__shell">
    <main class="recover-view__main">
      <ExchangeTopNav active="portfolio" />
      <ExchangePageTitle
        label="Recover"
        qualifier="stuck funds"
        subtitle="We scan failed and interrupted transactions for balances the exchange still holds for your principal, and refund them here."
      />
      <!-- Warning banner — only use recovery when an on-chain TX didn't settle -->
      <div class="recover-view__warn">
        <div class="recover-view__warn-icon">⚠</div>
        <div>
          <strong class="tx-warning">Only use this if a deposit, withdraw, or swap completed on-chain but never appeared in your balance.</strong>
          <div class="tx-ink-3" style="margin-top:4px;font-size:13px">Normal pending transactions settle within 2 minutes — don't recover those.</div>
        </div>
      </div>

      <!-- Stuck Transaction Detection -->
      <section class="recover-view__section">
        <h2 class="recover-view__subtitle">Stuck Transactions</h2>
        <p class="recover-view__desc">
          If a trade got interrupted mid-execution, your tokens may be stuck. Click "Scan" to check.
        </p>

        <button class="ex-btn ex-btn--outline" @click="scanStuck" :disabled="scanning">
          {{ scanning ? 'Scanning...' : 'Scan for Stuck Transactions' }}
        </button>

        <div v-if="stuckTrades.length > 0" class="recover-view__stuck-list">
          <div v-for="stuck in stuckTrades" :key="stuck.accesscode" class="recover-view__stuck-item">
            <div class="recover-view__stuck-info">
              <span>Order: <span class="num">{{ stuck.accesscode.slice(0, 16) }}...</span></span>
              <span class="recover-view__stuck-reason">{{ stuck.reason }}</span>
            </div>
            <button
              class="ex-btn ex-btn--sm ex-btn--primary"
              @click="fixStuck(stuck.accesscode)"
              :disabled="fixingId === stuck.accesscode"
            >
              {{ fixingId === stuck.accesscode ? 'Fixing...' : 'Fix' }}
            </button>
          </div>
        </div>

        <div v-else-if="scanned" class="recover-view__no-stuck">
          No stuck transactions found.
        </div>
      </section>

      <!-- Recent Deposits (auto-saved) -->
      <section v-if="cachedDeposits.length > 0" class="recover-view__section">
        <h2 class="recover-view__subtitle">Recent Deposits</h2>
        <p class="recover-view__desc">
          These deposits were automatically saved. If a trade or liquidity add failed after depositing,
          click "Recover" to get your tokens back.
        </p>

        <button v-if="cachedDeposits.length > 1" class="ex-btn ex-btn--primary" @click="recoverAllCached" :disabled="recovering" style="margin-bottom:var(--space-3)">
          {{ recovering ? 'Recovering...' : `Recover All (${cachedDeposits.length} deposits)` }}
        </button>

        <table class="ex-table recover-view__deposits-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Block</th>
              <th>Type</th>
              <th>When</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dep in cachedDeposits" :key="dep.block">
              <td>{{ getTokenSymbol(dep.token) }} <span class="recover-view__token-id">{{ dep.token.slice(0, 10) }}...</span></td>
              <td class="num">{{ dep.block }}</td>
              <td>{{ dep.type }}</td>
              <td>{{ formatDepositAge(dep.timestamp) }}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button
                    class="ex-btn ex-btn--sm ex-btn--primary"
                    @click="recoverCachedDeposit(dep)"
                    :disabled="recovering"
                  >{{ recovering ? '...' : 'Recover' }}</button>
                  <button
                    class="ex-btn ex-btn--sm ex-btn--outline"
                    @click="dismissDeposit(dep.block)"
                  >Dismiss</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Exchange V2 pending pulls (unknown-outcome deposits, tracked on chain) -->
      <section v-if="pendingPulls.length > 0" class="recover-view__section">
        <h2 class="recover-view__subtitle">Pending Exchange Deposits</h2>
        <p class="recover-view__desc">
          These deposits were pulled by the exchange but the ledger did not confirm the outcome.
          They are tracked on chain and an admin will resolve them. Do not repeat the trade that
          created them.
        </p>
        <button class="ex-btn ex-btn--outline" @click="loadPendingPulls" :disabled="pullsLoading" style="margin-bottom:var(--space-3)">
          {{ pullsLoading ? 'Checking...' : 'Refresh' }}
        </button>
        <table class="ex-table recover-view__deposits-table">
          <thead>
            <tr>
              <th>Pull</th>
              <th>Amount</th>
              <th>Context</th>
              <th>When</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pendingPulls" :key="p.id.toString()">
              <td class="num">#{{ p.id.toString() }}</td>
              <td>{{ formatPullAmount(p) }}</td>
              <td>{{ p.context }}</td>
              <td>{{ formatPullTime(p.time) }}</td>
              <td>{{ p.note }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- ICPSwap Recovery (sweep stranded pool funds) -->
      <section class="recover-view__section">
        <h2 class="recover-view__subtitle">ICPSwap Recovery</h2>
        <p class="recover-view__desc">
          If a CrossDEX swap was interrupted (for example you closed the tab mid-swap), tokens can be left inside
          an ICPSwap pool. Sweep pulls any stranded balance back to your wallet.
        </p>

        <!-- Auto-detected pending CrossDEX swaps -->
        <div v-if="pendingSwaps.length > 0" class="recover-view__stuck-list">
          <div v-for="p in pendingSwaps" :key="p.sell + p.buy" class="recover-view__stuck-item">
            <div class="recover-view__stuck-info">
              <span>{{ getTokenSymbol(p.sell) }} → {{ getTokenSymbol(p.buy) }}</span>
              <span class="recover-view__stuck-reason">Interrupted {{ formatDepositAge(p.timestamp) }}</span>
            </div>
            <div style="display:flex;gap:4px">
              <button
                class="ex-btn ex-btn--sm ex-btn--primary"
                @click="sweepPending(p)"
                :disabled="sweeping === p.sell + p.buy"
              >{{ sweeping === (p.sell + p.buy) ? 'Sweeping...' : 'Sweep' }}</button>
              <button
                class="ex-btn ex-btn--sm ex-btn--outline"
                @click="dismissPendingSwap(p)"
              >Dismiss</button>
            </div>
          </div>
        </div>

        <!-- Manual sweep by pair -->
        <div class="recover-view__field">
          <label class="recover-view__label">Token A Canister ID</label>
          <input v-model="sweepTokenA" type="text" class="ex-input" placeholder="e.g., ryjl3-tyaaa-aaaaa-aaaba-cai" />
        </div>
        <div class="recover-view__field">
          <label class="recover-view__label">Token B Canister ID</label>
          <input v-model="sweepTokenB" type="text" class="ex-input" placeholder="The other token in the pair" />
        </div>
        <div v-if="sweepError" class="ex-error-box">{{ sweepError }}</div>
        <div v-if="sweepSuccess" class="ex-success-box">Sweep complete. Any stranded funds were returned to your wallet.</div>
        <button class="ex-btn ex-btn--outline" :disabled="!canSweepManual" @click="sweepManual">
          {{ sweeping === 'manual' ? 'Sweeping...' : 'Sweep ICPSwap Pool' }}
        </button>
      </section>

      <!-- Neutrinite Recovery (sweep pylon virtual balance) -->
      <section class="recover-view__section">
        <h2 class="recover-view__subtitle">Neutrinite Recovery</h2>
        <p class="recover-view__desc">
          If a CrossDEX swap via Neutrinite was interrupted, your tokens may sit as a balance inside the
          Neutrinite pylon under your account. Sweep returns them to your wallet.
        </p>

        <div v-if="pendingNeu.length > 0" class="recover-view__stuck-list">
          <div v-for="p in pendingNeu" :key="p.sell + p.buy" class="recover-view__stuck-item">
            <div class="recover-view__stuck-info">
              <span>{{ getTokenSymbol(p.sell) }} → {{ getTokenSymbol(p.buy) }}</span>
              <span class="recover-view__stuck-reason">Interrupted {{ formatDepositAge(p.timestamp) }}</span>
            </div>
            <div style="display:flex;gap:4px">
              <button
                class="ex-btn ex-btn--sm ex-btn--primary"
                @click="sweepNeuPending(p)"
                :disabled="sweeping === ('neu:' + p.sell + p.buy)"
              >{{ sweeping === ('neu:' + p.sell + p.buy) ? 'Sweeping...' : 'Sweep' }}</button>
              <button
                class="ex-btn ex-btn--sm ex-btn--outline"
                @click="dismissPendingNeu(p)"
              >Dismiss</button>
            </div>
          </div>
        </div>

        <button class="ex-btn ex-btn--outline" :disabled="!canSweepManual" @click="sweepNeuManual">
          {{ sweeping === 'neu-manual' ? 'Sweeping...' : 'Sweep Neutrinite (uses the two token IDs above)' }}
        </button>
      </section>

      <!-- Recover Wrongly-Sent Tokens (manual) -->
      <section class="recover-view__section">
        <h2 class="recover-view__subtitle">Manual Recovery</h2>
        <p class="recover-view__desc">
          If you know the token canister ID and block number, enter them manually.
        </p>

        <div class="recover-view__field">
          <label class="recover-view__label">Token Canister ID</label>
          <input v-model="recoverTokenId" type="text" class="ex-input" placeholder="e.g., ryjl3-tyaaa-aaaaa-aaaba-cai" />
        </div>

        <div class="recover-view__field">
          <label class="recover-view__label">Block Number</label>
          <input v-model="recoverBlock" type="text" inputmode="numeric" class="ex-input num" placeholder="Block number from your transfer" />
        </div>

        <div class="recover-view__field">
          <label class="recover-view__label">Token Standard</label>
          <select v-model="recoverStandard" class="ex-input">
            <option value="ICP">ICP</option>
            <option value="ICRC12">ICRC-1/2</option>
            <option value="ICRC3">ICRC-3</option>
          </select>
        </div>

        <div v-if="recoverError" class="ex-error-box">{{ recoverError }}</div>
        <div v-if="recoverSuccess" class="ex-success-box">Tokens recovered successfully!</div>

        <button
          class="ex-btn ex-btn--primary"
          :disabled="!canRecover"
          @click="recoverTokens"
        >
          {{ recovering ? 'Recovering...' : 'Recover Tokens' }}
        </button>
      </section>
    </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onVisible } from '../composables/useVisibilityAware'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'
import { useExchangeStore } from '../store/exchange.store'
import { getDepositHistory, removeDepositFromCache } from '../utils/deposit'
import { useExchangeToast } from '../composables/useExchangeToast'
import * as icpswap from '../services/icpswap'
import * as neutrinite from '../services/neutrinite'

const store = useExchangeStore()
const toast = useExchangeToast()

// ── Cached Deposits ──
interface CachedDeposit { token: string; block: string; amount: string; type: string; timestamp: number }
const cachedDeposits = ref<CachedDeposit[]>([])

function loadCachedDeposits() {
  cachedDeposits.value = getDepositHistory()
}

function getTokenSymbol(address: string): string {
  return store.getTokenByAddress(address)?.symbol ?? address.slice(0, 5) + '...'
}

function formatDepositAge(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

async function recoverCachedDeposit(dep: CachedDeposit) {
  console.log(`[Recover] Attempting recovery: token=${dep.token.slice(0, 10)} block=${dep.block} type=${dep.type}`)
  const tokenType: Record<string, any> = {
    ICP: { ICP: null },
    ICRC12: { ICRC12: null },
    ICRC3: { ICRC3: null },
  }
  recovering.value = true
  recoverError.value = ''
  recoverSuccess.value = false
  try {
    if (!store.isAuthenticated) {
      recoverError.value = 'Connect your wallet first'
      return
    }
    // Prefer the LIVE backend asset_type (authoritative ICRC3/ICRC12/ICP) over the cached
    // dep.type, which may have been tagged ICRC12 by a stale/fallback token load.
    const standard = store.getTokenByAddress(dep.token)?.asset_type ?? tokenType[dep.type] ?? { ICRC12: null }
    console.log(`[Recover] Calling recoverWronglysent(${dep.token}, ${dep.block}, ${JSON.stringify(standard)})`)
    const result = await store.recoverWronglysent(
      dep.token,
      BigInt(dep.block),
      standard,
    )
    console.log('[Recover] Result:', result)
    if (result) {
      removeDepositFromCache(dep.block)
      cachedDeposits.value = cachedDeposits.value.filter(d => d.block !== dep.block)
      recoverSuccess.value = true
      toast.success('Deposit Recovered')
    } else {
      // A bare false usually means the deposit was already used by its trade or
      // already refunded. Keep the row so a support-resolved case stays one
      // click away; the user can dismiss it once confirmed.
      recoverError.value = `Block ${dep.block} was already used by its trade or already refunded. Check your wallet history for the refund. If you cannot find it, contact support with this block number. The entry stays in the list; dismiss it once settled.`
      toast.warning('Recovery Notice', recoverError.value)
    }
  } catch (err: any) {
    console.error('[Recover] Error:', err)
    // Still remove — if the canister rejects it, the block is consumed
    removeDepositFromCache(dep.block)
    cachedDeposits.value = cachedDeposits.value.filter(d => d.block !== dep.block)
    const msg = err.message || String(err)
    if (msg.includes('assertion failed') || msg.includes('trap')) {
      recoverError.value = `Block ${dep.block} already processed — removed from list.`
    } else {
      recoverError.value = `Recovery error: ${msg} — removed from list.`
    }
    toast.error('Recovery Failed', recoverError.value)
  } finally {
    recovering.value = false
  }
}

async function recoverAllCached() {
  if (!store.isAuthenticated) {
    recoverError.value = 'Connect your wallet first'
    return
  }
  recovering.value = true
  recoverError.value = ''
  recoverSuccess.value = false

  try {
    const tokenType: Record<string, any> = {
      ICP: { ICP: null },
      ICRC12: { ICRC12: null },
      ICRC3: { ICRC3: null },
    }

    // Build batch (max 20 per call)
    const batch = cachedDeposits.value.slice(0, 20).map(dep => ({
      identifier: dep.token,
      block: BigInt(dep.block),
      tType: store.getTokenByAddress(dep.token)?.asset_type ?? tokenType[dep.type] ?? { ICRC12: null },
    }))

    console.log(`[Recover] Batch recovering ${batch.length} deposits`)
    const results = await store.recoverBatch(batch)

    let recovered = 0
    for (const result of results) {
      const blockStr = result.block.toString()
      // Always remove from cache — whether success, "Block already used", or other error
      removeDepositFromCache(blockStr)
      cachedDeposits.value = cachedDeposits.value.filter(d => d.block !== blockStr)
      if (result.success) recovered++
    }

    if (recovered > 0) {
      recoverSuccess.value = true
      recoverError.value = recovered < results.length
        ? `Recovered ${recovered}/${results.length} deposits. The others were already used by their trades, already refunded, or expired.`
        : ''
      toast.success('Batch Recovery Complete', recovered + ' deposits recovered')
    } else if (results.length > 0) {
      recoverError.value = 'No deposits needed recovery. They were already used by their trades or already refunded; check your wallet history if in doubt.'
      toast.warning('Recovery Notice', recoverError.value)
    }
  } catch (err: any) {
    console.error('[Recover] Batch error:', err)
    recoverError.value = err.message || 'Batch recovery failed'
    toast.error('Recovery Failed', recoverError.value)
  } finally {
    recovering.value = false
  }
}

function dismissDeposit(block: string) {
  removeDepositFromCache(block)
  cachedDeposits.value = cachedDeposits.value.filter(d => d.block !== block)
}

// ── Stuck TX ──
const scanning = ref(false)
const scanned = ref(false)
const stuckTrades = ref<{ accesscode: string; reason: string }[]>([])
const fixingId = ref('')

async function scanStuck() {
  scanning.value = true
  stuckTrades.value = []
  try {
    const trades = await store.getUserTrades()
    stuckTrades.value = trades
      .filter(t => t.trade_done === 1n && ((t as any).init_paid2 === 0n || (t as any).seller_paid2 === 0n))
      .map(t => ({
        accesscode: t.accesscode,
        reason: (t as any).init_paid2 === 0n ? 'Creator payment stuck' : 'Filler payment stuck',
      }))
  } catch (err) {
    console.error('[RecoverView] Scan error:', err)
  } finally {
    scanning.value = false
    scanned.value = true
  }
}

async function fixStuck(accesscode: string) {
  fixingId.value = accesscode
  try {
    const result = await store.fixStuckTX(accesscode)
    if ('Ok' in result) {
      stuckTrades.value = stuckTrades.value.filter(t => t.accesscode !== accesscode)
      toast.success('Transaction Fixed', result.Ok)
    } else {
      const { classifyExchangeError } = await import('../utils/errors')
      toast.error('Fix Failed', classifyExchangeError(result.Err).message)
    }
  } catch (err: any) {
    console.error('[RecoverView] Fix error:', err)
    toast.error('Fix Failed', err.message || 'Failed to fix stuck transaction')
  } finally {
    fixingId.value = ''
  }
}

// ── Recover Wrongly-Sent ──
const recoverTokenId = ref('')
const recoverBlock = ref('')
const recoverStandard = ref('ICRC12')
const recovering = ref(false)
const recoverError = ref('')
const recoverSuccess = ref(false)

const canRecover = computed(() => {
  return store.isAuthenticated && recoverTokenId.value && recoverBlock.value && !recovering.value
})

async function recoverTokens() {
  recoverError.value = ''
  recoverSuccess.value = false
  recovering.value = true

  try {
    const tokenType: Record<string, any> = {
      ICP: { ICP: null },
      ICRC12: { ICRC12: null },
      ICRC3: { ICRC3: null },
    }

    let blockNum: bigint
    try { blockNum = BigInt(recoverBlock.value.trim()) }
    catch { recoverError.value = 'Invalid block number'; recovering.value = false; return }

    // Prefer the token's real backend asset_type; the manual dropdown is only a fallback
    // for a token that isn't in the accepted-token list.
    const standard = store.getTokenByAddress(recoverTokenId.value.trim())?.asset_type ?? tokenType[recoverStandard.value]
    if (!standard) { recoverError.value = 'Invalid token standard'; recovering.value = false; return }

    const result = await store.recoverWronglysent(
      recoverTokenId.value.trim(),
      blockNum,
      standard,
    )

    if (result) {
      recoverSuccess.value = true
      toast.success('Tokens Recovered')
    } else {
      recoverError.value = 'Recovery failed. If this deposit was already refunded or used by a trade, this is the double refund guard doing its job: check your wallet history for the refund before retrying. Otherwise verify the block number and token canister ID, and contact support with the block number if it keeps failing.'
      toast.error('Recovery Failed', recoverError.value)
    }
  } catch (err: any) {
    recoverError.value = err.message || 'Recovery failed'
    toast.error('Recovery Failed', recoverError.value)
  } finally {
    recovering.value = false
  }
}

// ── ICPSwap sweep ──
const pendingSwaps = ref<icpswap.PendingIcpSwap[]>([])
const sweeping = ref('') // key of the row being swept, or 'manual'
const sweepTokenA = ref('')
const sweepTokenB = ref('')
const sweepError = ref('')
const sweepSuccess = ref(false)

function loadPendingSwaps() {
  pendingSwaps.value = icpswap.getPendingSwaps()
}

const canSweepManual = computed(() =>
  store.isAuthenticated && !!sweepTokenA.value.trim() && !!sweepTokenB.value.trim() && !sweeping.value,
)

async function sweepPending(p: icpswap.PendingIcpSwap) {
  if (!store.isAuthenticated) { sweepError.value = 'Connect your wallet first'; return }
  sweeping.value = p.sell + p.buy
  sweepError.value = ''
  sweepSuccess.value = false
  try {
    const recovered = await icpswap.sweep({ token0Principal: p.sell, token1Principal: p.buy })
    if (recovered) {
      icpswap.removePendingSwap(p.sell, p.buy)
      pendingSwaps.value = pendingSwaps.value.filter(e => !(e.sell === p.sell && e.buy === p.buy))
      sweepSuccess.value = true
      toast.success('Sweep Complete')
    } else {
      sweepError.value = 'Nothing to recover yet. If you just swapped, the deposit may still be crediting. Try again in a few seconds, or dismiss this entry if it stays empty.'
      toast.warning('Nothing to sweep yet', sweepError.value)
    }
  } catch (err: any) {
    sweepError.value = err.message || 'Sweep failed'
    toast.error('Sweep Failed', sweepError.value)
  } finally {
    sweeping.value = ''
  }
}

function dismissPendingSwap(p: icpswap.PendingIcpSwap) {
  icpswap.removePendingSwap(p.sell, p.buy)
  pendingSwaps.value = pendingSwaps.value.filter(e => !(e.sell === p.sell && e.buy === p.buy))
}

async function sweepManual() {
  if (!canSweepManual.value) return
  sweeping.value = 'manual'
  sweepError.value = ''
  sweepSuccess.value = false
  try {
    const recovered = await icpswap.sweep({ token0Principal: sweepTokenA.value.trim(), token1Principal: sweepTokenB.value.trim() })
    if (recovered) {
      sweepSuccess.value = true
      toast.success('Sweep Complete')
    } else {
      sweepError.value = 'Nothing found to sweep for this pair.'
      toast.warning('Nothing to sweep', sweepError.value)
    }
  } catch (err: any) {
    sweepError.value = err.message || 'Sweep failed'
    toast.error('Sweep Failed', sweepError.value)
  } finally {
    sweeping.value = ''
  }
}

// ── Neutrinite sweep ──
const pendingNeu = ref<neutrinite.PendingNeutrinite[]>([])
function loadPendingNeu() {
  pendingNeu.value = neutrinite.getPendingSwaps()
}

function dismissPendingNeu(p: neutrinite.PendingNeutrinite) {
  neutrinite.removePendingSwap(p.sell, p.buy)
  pendingNeu.value = pendingNeu.value.filter(e => !(e.sell === p.sell && e.buy === p.buy))
}

async function sweepNeuPending(p: neutrinite.PendingNeutrinite) {
  if (!store.isAuthenticated) { sweepError.value = 'Connect your wallet first'; return }
  sweeping.value = 'neu:' + p.sell + p.buy
  sweepError.value = ''
  sweepSuccess.value = false
  try {
    const recovered = await neutrinite.sweep(p.sell, p.buy)
    if (recovered) {
      neutrinite.removePendingSwap(p.sell, p.buy)
      pendingNeu.value = pendingNeu.value.filter(e => !(e.sell === p.sell && e.buy === p.buy))
      sweepSuccess.value = true
      toast.success('Sweep Complete')
    } else {
      sweepError.value = 'Nothing to recover yet. If you just swapped, the deposit may still be crediting — try again in a few seconds.'
      toast.warning('Nothing to sweep yet', sweepError.value)
    }
  } catch (err: any) {
    sweepError.value = err.message || 'Sweep failed'
    toast.error('Sweep Failed', sweepError.value)
  } finally {
    sweeping.value = ''
  }
}

async function sweepNeuManual() {
  if (!canSweepManual.value) return
  sweeping.value = 'neu-manual'
  sweepError.value = ''
  sweepSuccess.value = false
  try {
    const recovered = await neutrinite.sweep(sweepTokenA.value.trim(), sweepTokenB.value.trim())
    if (recovered) {
      sweepSuccess.value = true
      toast.success('Sweep Complete')
    } else {
      sweepError.value = 'Nothing to recover for this pair (no stranded balance in the Neutrinite pylon).'
      toast.warning('Nothing to sweep', sweepError.value)
    }
  } catch (err: any) {
    sweepError.value = err.message || 'Sweep failed'
    toast.error('Sweep Failed', sweepError.value)
  } finally {
    sweeping.value = ''
  }
}

// ── Exchange V2 pending pulls ──
// Deposits the exchange pulled whose outcome the ledger never confirmed.
// Tracked on chain; an admin resolves them. Display-only here.
const pendingPulls = ref<any[]>([])
const pullsLoading = ref(false)
async function loadPendingPulls() {
  if (!store.isAuthenticated) { pendingPulls.value = []; return }
  pullsLoading.value = true
  try {
    pendingPulls.value = await store.getMyPendingPulls() as any[]
  } catch { /* best-effort; section stays as-is */ }
  finally { pullsLoading.value = false }
}
function formatPullAmount(p: any): string {
  const t = store.getTokenByAddress(p.token)
  const dec = t ? Number(t.decimals) : 8
  const amount = Number(p.gross) / 10 ** dec
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${t?.symbol ?? String(p.token).slice(0, 8)}`
}
function formatPullTime(timeNs: bigint): string {
  return formatDepositAge(Number(BigInt(timeNs) / 1_000_000n))
}

onMounted(() => {
  loadCachedDeposits()
  loadPendingNeu()
  loadPendingSwaps()
  void loadPendingPulls()
})

// Markers can be written while this tab is hidden (a failed leg in another
// tab, a zombie leg finishing late). Refresh every list on return.
onVisible(() => {
  loadCachedDeposits()
  loadPendingNeu()
  loadPendingSwaps()
  void loadPendingPulls()
})
</script>

<style scoped lang="scss">
.recover-view {
  min-height: 100vh;
  background: var(--tx-bg);
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 60px;
  overflow-y: auto;

  &__shell {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__warn {
    padding: 12px 14px;
    background: var(--tx-warning-dim);
    border: 1px solid rgba(216, 138, 63, 0.35);
    border-radius: var(--tx-r-md);
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  &__warn-icon {
    font-size: 18px;
    line-height: 1;
    margin-top: 1px;
    color: var(--tx-warning);
  }

  &__heading {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4);
  }

  &__section {
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: var(--space-4);
    margin-bottom: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__subtitle {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__desc {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
    line-height: 1.5;
  }

  &__stuck-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__stuck-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-primary);
    border-radius: 6px;
  }

  &__stuck-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__stuck-reason {
    font-size: var(--text-xs);
    color: var(--color-warning);
  }

  &__no-stuck {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    text-align: center;
    padding: var(--space-3);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__deposits-table { width: 100%; }

  &__token-id { font-size: var(--text-xs); color: var(--text-tertiary); margin-left: 4px; }

}
</style>
