<template>
  <div class="bridge-view tx-scroll">
    <div class="bridge-view__shell">
      <ExchangeTopNav />
        <ExchangePageTitle
          label="Bridge"
          qualifier="ck tokens"
          subtitle="Move BTC, ETH and ERC20 tokens between their native chains and the Internet Computer. Deposits mint the ck version, withdrawals send the native asset back."
        />

        <div v-if="bridge.infoError" class="tx-card bridge-view__error-card">
          <span class="tx-warning">{{ bridge.infoError }}</span>
          <button class="ex-btn ex-btn--sm ex-btn--outline" @click="bridge.loadMinterInfo(true)">Retry</button>
        </div>

        <section class="tx-card bridge-view__card">
          <!-- Token selector -->
          <div class="bridge-view__token-select" ref="tokenMenuRef">
            <button class="bridge-view__token bridge-view__token--trigger" @click="tokenMenuOpen = !tokenMenuOpen">
              <template v-if="selected">
                <img v-if="iconFor(selected)" :src="iconFor(selected)!" :alt="selected.symbol" class="bridge-view__token-icon" />
                <span v-else class="bridge-view__token-letter">{{ selected.symbol.slice(2, 3) }}</span>
                {{ selected.symbol }}
              </template>
              <template v-else>Select a token</template>
              <span class="bridge-view__token-caret">▾</span>
            </button>
            <div v-if="tokenMenuOpen" class="bridge-view__token-menu">
              <button
                v-for="t in bridge.bridgeTokens"
                :key="t.key"
                class="bridge-view__token-option"
                :class="{ 'bridge-view__token-option--active': selected?.key === t.key }"
                @click="selectToken(t); tokenMenuOpen = false"
              >
                <img v-if="iconFor(t)" :src="iconFor(t)!" :alt="t.symbol" class="bridge-view__token-icon" />
                <span v-else class="bridge-view__token-letter">{{ t.symbol.slice(2, 3) }}</span>
                <span>{{ t.symbol }}</span>
                <span class="tx-ink-3 bridge-view__token-native">{{ t.nativeSymbol }}</span>
              </button>
            </div>
          </div>

          <template v-if="selected">
            <!-- Direction -->
            <div class="bridge-view__direction">
              <button
                class="ex-btn"
                :class="direction === 'deposit' ? 'ex-btn--primary' : 'ex-btn--outline'"
                @click="setDirection('deposit')"
              >Deposit {{ selected.nativeSymbol }}</button>
              <button
                class="ex-btn"
                :class="direction === 'withdraw' ? 'ex-btn--primary' : 'ex-btn--outline'"
                @click="setDirection('withdraw')"
              >Withdraw {{ selected.nativeSymbol }}</button>
            </div>

            <div class="bridge-view__balance tx-ink-3">
              Your {{ selected.symbol }} balance:
              <span class="tx-mono">{{ formatUnits(ckBalance, selected.decimals) }}</span>
            </div>

            <div v-if="!store.isAuthenticated" class="bridge-view__connect">
              <span class="tx-ink-3">Connect your wallet to use the bridge.</span>
              <button class="ex-btn ex-btn--primary" :disabled="isConnecting" @click="connect()">
                {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
              </button>
            </div>

            <!-- ── BTC deposit ── -->
            <div v-else-if="direction === 'deposit' && selected.chain === 'btc'" class="bridge-view__panel">
              <p class="tx-ink-3">
                Send BTC to your personal deposit address below. After
                {{ bridge.ckbtcInfo?.minConfirmations ?? 6 }} confirmations, press "Check for BTC" to mint ckBTC.
              </p>
              <div v-if="btcAddress" class="bridge-view__btc-deposit">
                <img v-if="btcQr" :src="btcQr" alt="BTC deposit address QR" class="bridge-view__qr" />
                <div class="bridge-view__btc-addr">
                  <code class="tx-mono">{{ btcAddress }}</code>
                  <button class="ex-btn ex-btn--sm ex-btn--outline" @click="copy(btcAddress)">Copy</button>
                </div>
              </div>
              <button v-else class="ex-btn ex-btn--primary" :disabled="busy" @click="loadBtcAddress">
                {{ busy ? 'Loading...' : 'Show my BTC deposit address' }}
              </button>
              <div v-if="btcAddress" class="bridge-view__actions">
                <button class="ex-btn ex-btn--primary" :disabled="busy" @click="checkBtc">
                  {{ busy ? 'Checking...' : 'Check for BTC' }}
                </button>
              </div>
              <div v-if="btcCheckResult" class="bridge-view__note" :class="{ 'tx-warning': !btcCheckResult.startsWith('Minted') }">
                {{ btcCheckResult }}
              </div>
            </div>

            <!-- ── BTC withdraw ── -->
            <div v-else-if="direction === 'withdraw' && selected.chain === 'btc'" class="bridge-view__panel">
              <label class="bridge-view__field">
                <span>Amount (BTC)</span>
                <div class="bridge-view__amount-row">
                  <input v-model="amount" class="ex-input tx-mono" placeholder="0.001" inputmode="decimal" />
                  <button class="ex-btn ex-btn--sm ex-btn--outline" @click="setMax">Max</button>
                </div>
              </label>
              <label class="bridge-view__field">
                <span>Destination BTC address</span>
                <input v-model="destination" class="ex-input tx-mono" placeholder="bc1..." />
              </label>
              <div v-if="btcFeeText" class="bridge-view__note tx-ink-3">{{ btcFeeText }}</div>
              <div v-if="minText" class="bridge-view__note tx-ink-3">{{ minText }}</div>
              <button class="ex-btn ex-btn--primary" :disabled="busy || !canSubmitWithdrawal" @click="submitWithdraw">
                {{ busy ? 'Submitting...' : `Withdraw ${selected.nativeSymbol}` }}
              </button>
            </div>

            <!-- ── ETH / ERC20 deposit ── -->
            <div v-else-if="direction === 'deposit'" class="bridge-view__panel">
              <p class="tx-ink-3">
                Deposits use your Ethereum wallet (MetaMask or compatible) on Ethereum mainnet.
                {{ selected.symbol }} is minted to your exchange principal after the transaction finalizes
                (about 20 minutes).
              </p>
              <div v-if="!bridge.hasEthWallet()" class="bridge-view__note tx-warning">
                No Ethereum wallet detected. Install MetaMask or a compatible wallet to deposit.
              </div>
              <template v-else>
                <label class="bridge-view__field">
                  <span>Amount ({{ selected.nativeSymbol }})</span>
                  <input v-model="amount" class="ex-input tx-mono" placeholder="0.0" inputmode="decimal" />
                </label>
                <button class="ex-btn ex-btn--primary" :disabled="busy || !amountUnits" @click="submitEthDeposit">
                  {{ busy ? 'Waiting for wallet...' : `Deposit ${selected.nativeSymbol} from Ethereum wallet` }}
                </button>
              </template>
            </div>

            <!-- ── ETH / ERC20 withdraw ── -->
            <div v-else class="bridge-view__panel">
              <label class="bridge-view__field">
                <span>Amount ({{ selected.symbol }})</span>
                <div class="bridge-view__amount-row">
                  <input v-model="amount" class="ex-input tx-mono" placeholder="0.0" inputmode="decimal" />
                  <button class="ex-btn ex-btn--sm ex-btn--outline" @click="setMax">Max</button>
                </div>
              </label>
              <label class="bridge-view__field">
                <span>Destination Ethereum address</span>
                <input v-model="destination" class="ex-input tx-mono" placeholder="0x..." />
              </label>
              <div v-if="gasText" class="bridge-view__note tx-ink-3">{{ gasText }}</div>
              <div v-if="gasShortfallText" class="bridge-view__note tx-warning">{{ gasShortfallText }}</div>
              <div v-if="minText" class="bridge-view__note tx-ink-3">{{ minText }}</div>
              <button class="ex-btn ex-btn--primary" :disabled="busy || !canSubmitWithdrawal" @click="submitWithdraw">
                {{ busy ? 'Submitting...' : `Withdraw ${selected.nativeSymbol}` }}
              </button>
            </div>

            <div v-if="actionError" class="bridge-view__note tx-warning">{{ actionError }}</div>
          </template>
        </section>

        <!-- Pending / recent bridge transactions -->
        <section v-if="bridge.journal.length" class="tx-card bridge-view__card">
          <div class="tx-row tx-row--between">
            <h2 class="tx-h2">Bridge activity</h2>
            <button class="ex-btn ex-btn--sm ex-btn--outline" @click="bridge.clearFinished()">Clear finished</button>
          </div>
          <div v-for="e in bridge.journal" :key="e.id" class="bridge-view__tx">
            <div class="bridge-view__tx-main">
              <span class="bridge-view__tx-kind">{{ kindLabel(e) }}</span>
              <span v-if="e.amount" class="tx-mono">{{ formatEntryAmount(e) }}</span>
              <span class="bridge-view__tx-state" :class="`bridge-view__tx-state--${e.state}`">{{ stateLabel(e.state) }}</span>
            </div>
            <div v-if="e.note" class="bridge-view__tx-note tx-ink-3">{{ e.note }}</div>
            <div v-if="e.txid" class="bridge-view__tx-note bridge-view__tx-row tx-ink-3">
              <span class="bridge-view__tx-label">BTC tx:</span>
              <a :href="`https://mempool.space/tx/${e.txid}`" :title="e.txid" target="_blank" rel="noopener" class="bridge-view__tx-link tx-mono">{{ e.txid }}</a>
              <span class="bridge-view__tx-ext">↗</span>
              <button class="bridge-view__tx-copy" :title="'Copy full tx id'" @click="copy(e.txid!)">Copy</button>
            </div>
            <div v-if="e.txHash" class="bridge-view__tx-note bridge-view__tx-row tx-ink-3">
              <span class="bridge-view__tx-label">ETH tx:</span>
              <a :href="`https://etherscan.io/tx/${e.txHash}`" :title="e.txHash" target="_blank" rel="noopener" class="bridge-view__tx-link tx-mono">{{ e.txHash }}</a>
              <span class="bridge-view__tx-ext">↗</span>
              <button class="bridge-view__tx-copy" :title="'Copy full tx hash'" @click="copy(e.txHash!)">Copy</button>
            </div>
          </div>
        </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangePageTitle from '../components/common/ExchangePageTitle.vue'
import { useExchangeStore } from '../store/exchange.store'
import { useBridgeStore, type BridgeToken, type JournalEntry } from '../bridge/bridge.store'
import { useExchangeAuth } from '../composables/useExchangeAuth'
import { useExchangeToast } from '../composables/useExchangeToast'
import { getTokenIcon } from '../utils/token-icons'
import { useTokenBalance } from '../composables/useTokenBalance'

const store = useExchangeStore()
const bridge = useBridgeStore()
const auth = useExchangeAuth()
const { connect, isConnecting } = auth
const toast = useExchangeToast()

const selected = ref<BridgeToken | null>(null)
const direction = ref<'deposit' | 'withdraw'>('deposit')
const tokenMenuOpen = ref(false)
const tokenMenuRef = ref<HTMLElement | null>(null)

/** Warn (toast) instead of silently showing a dead panel when not connected. */
function requireAuth(): boolean {
  if (store.isAuthenticated) return true
  toast.warning('Not connected', 'Connect your wallet to use the bridge.')
  return false
}

function setDirection(d: 'deposit' | 'withdraw') {
  direction.value = d
  requireAuth()
}

function onDocClick(e: MouseEvent) {
  if (tokenMenuRef.value && !tokenMenuRef.value.contains(e.target as Node)) tokenMenuOpen.value = false
}
const amount = ref('')
const destination = ref('')
const busy = ref(false)
const actionError = ref('')
const btcAddress = ref('')
const btcQr = ref('')
const btcCheckResult = ref('')
const btcFeeText = ref('')
const gasText = ref('')
const gasShortfallText = ref('')
// Live-bound to the unified balance query — refreshed by the exchange's 7 s
// poll and after every mutation, so the shown balance is never stale.
const ckBalance = useTokenBalance(() => selected.value?.ledgerId)

function iconFor(t: BridgeToken): string | null {
  // bundled icon first; else the ledger's own icrc1_metadata logo (loaded lazily)
  return getTokenIcon(t.symbol, t.symbol) || bridge.tokenLogos[t.ledgerId] || null
}
watch(() => bridge.bridgeTokens, (tokens) => {
  for (const t of tokens) if (!getTokenIcon(t.symbol, t.symbol)) void bridge.loadTokenLogo(t.ledgerId)
}, { immediate: true, deep: true })

function formatUnits(v: bigint, decimals: number): string {
  const s = v.toString().padStart(decimals + 1, '0')
  const int = s.slice(0, -decimals) || '0'
  const frac = decimals ? s.slice(-decimals).replace(/0+$/, '') : ''
  return frac ? `${int}.${frac}` : int
}

function parseUnits(text: string, decimals: number): bigint | null {
  const t = text.trim()
  if (!/^\d*(\.\d*)?$/.test(t) || t === '' || t === '.') return null
  const [int, frac = ''] = t.split('.')
  if (frac.length > decimals) return null
  try { return BigInt(int || '0') * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0') || '0') } catch { return null }
}

const amountUnits = computed<bigint | null>(() =>
  selected.value ? parseUnits(amount.value, selected.value.decimals) : null)

const minText = computed(() => {
  if (!selected.value || direction.value !== 'withdraw') return ''
  if (selected.value.chain === 'btc' && bridge.ckbtcInfo) {
    return `Minimum withdrawal: ${formatUnits(bridge.ckbtcInfo.retrieveBtcMinAmount, 8)} BTC. Network and minter fees are deducted from the amount.`
  }
  if (selected.value.chain === 'eth' && bridge.ckethInfo) {
    return `Minimum withdrawal: ${formatUnits(bridge.ckethInfo.minimumWithdrawalAmount, 18)} ETH.`
  }
  return ''
})

const canSubmitWithdrawal = computed(() => {
  const units = amountUnits.value
  if (!selected.value || !units || units <= 0n || !destination.value.trim()) return false
  if (gasShortfallText.value) return false
  return true
})

function selectToken(t: BridgeToken) {
  selected.value = t
  amount.value = ''
  destination.value = ''
  actionError.value = ''
  btcCheckResult.value = ''
  gasText.value = ''
  gasShortfallText.value = ''
}

function setMax() {
  if (!selected.value) return
  // Leave 2× ledger fee headroom: the approve call costs one fee, and the
  // approved amount itself includes another (minter pulls amount + fee).
  const fee = selected.value.fee ?? 0n
  const max = ckBalance.value > fee * 2n ? ckBalance.value - fee * 2n : 0n
  amount.value = formatUnits(max, selected.value.decimals)
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.info('Address copied') } catch { /* ignore */ }
}

// ── BTC ──

async function loadBtcAddress() {
  busy.value = true
  actionError.value = ''
  try {
    btcAddress.value = await bridge.fetchBtcDepositAddress()
    const QRCode = (await import('qrcode')).default
    btcQr.value = await QRCode.toDataURL(btcAddress.value, { width: 200, margin: 1 })
  } catch (err: any) {
    if (!(await auth.handleSessionError(err))) actionError.value = err.message || 'Could not load deposit address'
  } finally { busy.value = false }
}

async function checkBtc() {
  busy.value = true
  actionError.value = ''
  btcCheckResult.value = ''
  try {
    const res = await bridge.checkBtcDeposits()
    if (res.minted > 0n) {
      btcCheckResult.value = `Minted ${formatUnits(res.minted, 8)} ckBTC.`
      toast.success('ckBTC minted', btcCheckResult.value)
      void store.refreshAllBalances()
    } else if (res.pending.length) {
      btcCheckResult.value = res.pending
        .map(p => `${formatUnits(p.valueSat, 8)} BTC pending, ${p.confirmations}/${p.required} confirmations`)
        .join('; ')
    } else {
      btcCheckResult.value = 'No new BTC found yet. Deposits appear after enough confirmations.'
    }
  } catch (err: any) {
    if (!(await auth.handleSessionError(err))) actionError.value = err.message || 'Balance check failed'
  } finally { busy.value = false }
}

// live BTC fee estimate as the user types an amount
watch([amount, selected, direction], async () => {
  btcFeeText.value = ''
  if (!selected.value || selected.value.chain !== 'btc' || direction.value !== 'withdraw') return
  const units = amountUnits.value
  if (!units || units <= 0n) return
  try {
    const f = await bridge.estimateBtcWithdrawalFee(units)
    const fees = f.bitcoinFee + f.minterFee
    const receive = units > fees ? units - fees : 0n
    btcFeeText.value = `Estimated fees: ${formatUnits(fees, 8)} BTC. You will receive about ${formatUnits(receive, 8)} BTC.`
  } catch { /* estimate is best-effort */ }
})

// live gas quote + shortfall pre-check for ETH-side withdrawals
watch([amount, selected, direction], async () => {
  gasText.value = ''
  gasShortfallText.value = ''
  const t = selected.value
  if (!t || direction.value !== 'withdraw' || t.chain === 'btc' || !store.isAuthenticated) return
  try {
    if (t.chain === 'erc20') {
      const pf = await bridge.preflightErc20Withdrawal(t)
      gasText.value = `Transaction fee: about ${formatUnits(pf.requiredCkEth, 18)} ckETH (charged from your ckETH balance).`
      if (pf.shortfall > 0n) {
        gasShortfallText.value = `You need ${formatUnits(pf.shortfall, 18)} more ckETH to cover the fee. You have ${formatUnits(pf.ckEthBalance, 18)} ckETH.`
      }
    } else {
      const q = await bridge.quoteWithdrawalGas()
      gasText.value = `The Ethereum network fee (about ${formatUnits(q.maxTransactionFee, 18)} ETH) is deducted by the minter.`
    }
  } catch { /* quote is best-effort; withdraw re-checks */ }
})

// ── Submit ──

async function submitWithdraw() {
  const t = selected.value
  const units = amountUnits.value
  if (!t || !units) return
  if (t.chain === 'btc') {
    const { validate } = await import('bitcoin-address-validation')
    if (!validate(destination.value.trim())) { actionError.value = 'Invalid BTC address.'; return }
  }
  busy.value = true
  actionError.value = ''
  try {
    if (t.chain === 'btc') await bridge.withdrawBtc(units, destination.value.trim())
    else if (t.chain === 'eth') await bridge.withdrawEth(units, destination.value.trim())
    else await bridge.withdrawErc20(t, units, destination.value.trim())
    toast.success('Withdrawal submitted', 'Track progress under Bridge activity below.')
    amount.value = ''
    void store.refreshAllBalances()
  } catch (err: any) {
    if (!(await auth.handleSessionError(err))) actionError.value = err.message || 'Withdrawal failed'
  } finally { busy.value = false }
}

async function submitEthDeposit() {
  const t = selected.value
  const units = amountUnits.value
  if (!t || !units) return
  busy.value = true
  actionError.value = ''
  try {
    if (t.chain === 'eth') await bridge.depositEth(units)
    else await bridge.depositErc20(t, units)
    toast.success('Deposit sent', `${t.symbol} arrives after the Ethereum transaction finalizes.`)
    amount.value = ''
  } catch (err: any) {
    actionError.value = err.message || 'Deposit failed'
  } finally { busy.value = false }
}

// ── Journal display ──

function kindLabel(e: JournalEntry): string {
  const map: Record<string, string> = {
    'btc-mint': 'BTC deposit', 'btc-dissolve': 'BTC withdrawal',
    'eth-mint': 'ETH deposit', 'erc20-mint': `${e.token} deposit`,
    'eth-dissolve': 'ETH withdrawal', 'erc20-dissolve': `${e.token} withdrawal`,
  }
  return map[e.kind] ?? e.kind
}
function stateLabel(s: string): string {
  const map: Record<string, string> = {
    'waiting-deposit': 'Waiting for deposit', 'sent-eth-tx': 'Ethereum tx sent',
    submitting: 'Submitting', pending: 'Processing', confirmed: 'Complete',
    reimbursed: 'Reimbursed', failed: 'Failed',
  }
  return map[s] ?? s
}
function formatEntryAmount(e: JournalEntry): string {
  const t = bridge.bridgeTokens.find(x => x.key === e.token)
  if (!t || !e.amount) return e.amount ?? ''
  return `${formatUnits(BigInt(e.amount), t.decimals)} ${t.symbol}`
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  await bridge.init()
  if (!selected.value && bridge.bridgeTokens.length) selectToken(bridge.bridgeTokens[0])
})
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped lang="scss">
.bridge-view {
  min-height: 100vh;
  background: var(--tx-bg);
  /* Fluid padding, same as the other exchange pages, so the top nav renders identically. */
  padding: clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 60px;
  overflow-y: auto;

  &__shell {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  /* Keep the form card readable and centered; the nav and title span the full shell. */
  &__card { max-width: 720px; width: 100%; margin: 0 auto; }
  &__error-card { max-width: 720px; width: 100%; margin: 0 auto; }

  @media (max-width: 767px) {
    padding: 12px 10px 80px;

    .bridge-view__direction { flex-wrap: wrap; }
    .bridge-view__direction .ex-btn { flex: 1 1 auto; }
    .bridge-view__token--trigger { width: 100%; }
    .bridge-view__token-menu { width: 100%; min-width: 0; }
    .bridge-view__btc-deposit { flex-direction: column; align-items: center; }
    .bridge-view__panel .ex-btn--primary { width: 100%; }
    .bridge-view__amount-row .ex-input { min-width: 0; flex: 1; }
  }
  &__card { padding: var(--space-4, 16px); display: flex; flex-direction: column; gap: var(--space-3, 12px); }
  &__connect { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  &__error-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: var(--space-3, 12px); }

  &__token-select { position: relative; align-self: flex-start; }
  &__token {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 8px; cursor: pointer;
    background: transparent; border: 1px solid var(--tx-border, rgba(128,128,128,0.35));
    color: inherit; font: inherit;
    &--trigger { min-width: 180px; justify-content: space-between; }
  }
  &__token-caret { margin-left: auto; opacity: 0.7; }
  &__token-menu {
    position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
    min-width: 220px; max-height: 320px; overflow-y: auto;
    background: var(--card-gradient-from, #1c130b);
    border: 1px solid var(--tx-border, rgba(128,128,128,0.35));
    border-radius: 8px; padding: 4px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    display: flex; flex-direction: column;
  }
  &__token-option {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-radius: 6px; cursor: pointer;
    background: transparent; border: none; color: inherit; font: inherit; text-align: left;
    &:hover { background: rgba(255,255,255,0.06); }
    &--active { outline: 1px solid var(--tx-orange, #f7931a); }
  }
  &__token-native { margin-left: auto; font-size: 12px; }
  &__token-icon { width: 18px; height: 18px; border-radius: 50%; }
  &__token-letter {
    width: 18px; height: 18px; border-radius: 50%; display: inline-flex;
    align-items: center; justify-content: center; font-size: 11px;
    background: var(--tx-border, rgba(128,128,128,0.35));
  }

  &__direction { display: flex; gap: 8px; }
  &__panel { display: flex; flex-direction: column; gap: var(--space-3, 12px); }
  &__field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  &__amount-row { display: flex; gap: 8px; align-items: center; }
  &__actions { display: flex; gap: 8px; }
  &__note { font-size: 13px; }

  &__btc-deposit { display: flex; gap: var(--space-3, 12px); align-items: center; flex-wrap: wrap; }
  &__qr { width: 160px; height: 160px; border-radius: 8px; background: #fff; padding: 6px; }
  &__btc-addr {
    display: flex; flex-direction: column; gap: 8px; min-width: 0;
    code { word-break: break-all; font-size: 13px; }
  }

  &__tx { padding: 10px 0; border-top: 1px solid var(--tx-border, rgba(128,128,128,0.2)); }
  &__tx-main { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
  &__tx-kind { font-weight: 600; }
  &__tx-note { font-size: 12px; margin-top: 2px; }
  /* Full hash on one line; ellipsis only when it genuinely doesn't fit. */
  &__tx-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
  &__tx-label { flex: 0 0 auto; }
  &__tx-ext { flex: 0 0 auto; color: var(--tx-orange, #f7931a); }
  &__tx-link {
    color: var(--tx-orange, #f7931a); text-decoration: none;
    flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    &:hover { text-decoration: underline; }
  }
  &__tx-copy {
    margin-left: 6px; padding: 0 6px; font-size: 11px; cursor: pointer;
    background: transparent; color: inherit; font-family: inherit;
    border: 1px solid var(--tx-border, rgba(128,128,128,0.35)); border-radius: 4px;
    &:hover { border-color: var(--tx-orange, #f7931a); }
  }
  &__tx-state {
    font-size: 12px; padding: 1px 8px; border-radius: 999px;
    border: 1px solid var(--tx-border, rgba(128,128,128,0.35));
    &--confirmed { color: #3fbf5f; border-color: #3fbf5f; }
    &--failed, &--reimbursed { color: #e05c4b; border-color: #e05c4b; }
  }
}
</style>
