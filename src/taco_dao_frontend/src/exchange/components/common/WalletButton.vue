<template>
  <button
    v-if="!isConnected"
    class="ex-btn ex-btn--primary ex-btn--sm"
    @click="connectWallet"
  >
    Connect
  </button>
  <div v-else class="wallet-button" ref="dropdownRef">
    <button
      class="wallet-button__chip"
      @click="showMenu = !showMenu"
      aria-label="Wallet menu"
    >
      <span class="wallet-button__avatar">{{ walletInitials }}</span>
      <span class="tx-mono tx-ink-2 wallet-button__principal">{{ truncatedPrincipal }}</span>
    </button>
    <div v-if="showMenu" class="wallet-button__dropdown">
      <div class="wallet-button__info">
        <span class="wallet-button__label">Principal</span>
        <button class="wallet-button__copy" @click="copyText(principalText, 'Principal Copied')">
          {{ principalText }}
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" fill="none" />
            <path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" fill="none" />
          </svg>
        </button>
      </div>
      <div v-if="accountIdHex" class="wallet-button__info">
        <span class="wallet-button__label">Account ID</span>
        <button class="wallet-button__copy" @click="copyText(accountIdHex, 'Account ID Copied')">
          {{ accountIdHex }}
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" fill="none" />
            <path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" fill="none" />
          </svg>
        </button>
      </div>
      <button class="wallet-button__disconnect" @click="disconnectWallet">
        Disconnect
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { useExchangeToast } from '../../composables/useExchangeToast'

const exchangeStore = useExchangeStore()
const toast = useExchangeToast()

const isConnected = ref(false)
const principalText = ref('')
const accountIdHex = ref('')
const showMenu = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const truncatedPrincipal = computed(() => {
  const p = principalText.value
  if (!p || p.length < 16) return p
  return `${p.slice(0, 5)}…${p.slice(-3)}`
})

const walletInitials = computed(() => {
  const p = principalText.value
  return p ? p.slice(0, 2).toUpperCase() : ''
})

async function deriveAccountId() {
  if (!principalText.value) { accountIdHex.value = ''; return }
  try {
    const { Principal } = await import('@dfinity/principal')
    const { AccountIdentifier } = await import('@dfinity/ledger-icp')
    const principal = Principal.fromText(principalText.value)
    accountIdHex.value = AccountIdentifier
      .fromPrincipal({ principal, subAccount: undefined })
      .toHex()
  } catch {
    accountIdHex.value = ''
  }
}

async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.info(message)
  } catch { /* fallback */ }
}

async function connectWallet() {
  try {
    const { getCachedAuthClient } = await import('../../../shared/auth-cache')
    const authClient = await getCachedAuthClient()

    // Anchor to tacodao.com on the custom subdomain so the principal matches the DAO app.
    const derivationOrigin =
      window.location.hostname === 'exchange.tacodao.com'
        ? 'https://tacodao.com'
        : undefined

    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: 'https://id.ai',
        derivationOrigin,
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      })
    })

    const identity = authClient.getIdentity()
    principalText.value = identity.getPrincipal().toText()
    isConnected.value = true
    exchangeStore.isAuthenticated = true
    exchangeStore.principalText = principalText.value
    deriveAccountId()

    // Reinitialize the store with authenticated actor
    exchangeStore.clearActorCache()
  } catch (err) {
    console.error('Wallet connect failed:', err)
  }
}

async function disconnectWallet() {
  try {
    const { getCachedAuthClient } = await import('../../../shared/auth-cache')
    const authClient = await getCachedAuthClient()
    await authClient.logout()
  } catch {
    // ignore
  }
  isConnected.value = false
  principalText.value = ''
  accountIdHex.value = ''
  showMenu.value = false
  exchangeStore.isAuthenticated = false
  exchangeStore.principalText = ''
  exchangeStore.clearActorCache()
}

// Hydrate from cached identity on mount
onMounted(async () => {
  try {
    const { getCachedIdentity } = await import('../../../shared/auth-cache')
    const identity = await getCachedIdentity()
    if (identity && !identity.getPrincipal().isAnonymous()) {
      principalText.value = identity.getPrincipal().toText()
      isConnected.value = true
      exchangeStore.isAuthenticated = true
      exchangeStore.principalText = principalText.value
      deriveAccountId()
    }
  } catch {
    // not authenticated
  }

  document.addEventListener('click', onOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
})

function onOutsideClick(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showMenu.value = false
  }
}
</script>

<style scoped lang="scss">
.wallet-button {
  position: relative;

  &__chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--tx-surface-2);
    border: 1px solid var(--tx-line);
    border-radius: var(--tx-r-md);
    color: var(--tx-ink);
    font-size: 11px;
    padding: 3px 8px 3px 3px;
    cursor: pointer;
    transition: border-color 140ms, background 140ms;

    &:hover {
      border-color: var(--tx-line-hi);
      background: var(--tx-surface-3);
    }
  }

  &__avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--tx-surface-3);
    color: var(--tx-ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
  }

  &__principal {
    font-size: 11px;

    @media (max-width: 640px) { display: none; }
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: 280px;
    background: var(--tx-panel-bg-2);
    border: 1px solid var(--tx-line-2);
    border-radius: var(--tx-r-lg);
    box-shadow: var(--tx-shadow-2);
    z-index: 200;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;

    @media (max-width: 640px) {
      position: fixed;
      top: 52px;
      left: 8px;
      right: 8px;
      width: auto;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 10px;
    color: var(--tx-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__copy {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--tx-ink-2);
    font-size: 11px;
    font-family: var(--font-mono);
    cursor: pointer;
    padding: 2px 0;
    word-break: break-all;
    text-align: left;

    &:hover { color: var(--tx-ink); }
    svg { flex-shrink: 0; }
  }

  &__disconnect {
    background: transparent;
    border: 1px solid rgba(224, 84, 74, 0.4);
    border-radius: var(--tx-r-md);
    color: var(--tx-sell);
    font-size: 12px;
    padding: 6px 10px;
    cursor: pointer;

    &:hover { background: var(--tx-sell-dim); }
  }
}
</style>
