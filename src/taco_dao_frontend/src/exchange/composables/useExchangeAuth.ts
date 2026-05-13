/**
 * Composable for exchange authentication state management.
 * Wraps the shared auth-cache.ts for the exchange UI's connect/disconnect button.
 */

import { ref, computed, onMounted } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { useExchangeToast } from './useExchangeToast'
import { onVisible } from './useVisibilityAware'

// Module-scope guard so the check runs exactly once per process. Six places
// call useExchangeAuth() today; without this guard each mount re-imports the
// auth-cache and re-reads IDB.
let bootChecked = false
let bootBroadcastWired = false

export function useExchangeAuth() {
  const exchangeStore = useExchangeStore()
  const toast = useExchangeToast()

  const isConnecting = ref(false)
  const error = ref<string | null>(null)

  const isConnected = computed(() => exchangeStore.isAuthenticated)
  const principalText = computed(() => exchangeStore.principalText)

  const truncatedPrincipal = computed(() => {
    const p = principalText.value
    if (!p || p.length < 16) return p
    return `${p.slice(0, 5)}...${p.slice(-3)}`
  })

  /** Check for existing authentication on mount.
   *  Optimistic-paint: read localStorage *first* so the connect pill paints
   *  on the first frame, then reconcile against the real IDB-backed identity.
   */
  async function checkExistingAuth() {
    // 1) Optimistic restore from localStorage — instant.
    try {
      const raw = localStorage.getItem('taco_exchange_auth')
      if (raw) {
        const v = JSON.parse(raw) as { principal?: string }
        if (v?.principal) {
          exchangeStore.isAuthenticated = true
          exchangeStore.principalText = v.principal
        }
      }
    } catch {
      // ignore — fall through to IDB
    }

    // 2) Reconcile against IndexedDB (authoritative). Clear optimistic state
    //    if the delegation is actually gone, or update if the principal changed.
    try {
      const { getCachedIdentity } = await import('../../shared/auth-cache')
      const identity = await getCachedIdentity()
      if (identity && !identity.getPrincipal().isAnonymous()) {
        const principal = identity.getPrincipal().toText()
        exchangeStore.isAuthenticated = true
        exchangeStore.principalText = principal
        try { localStorage.setItem('taco_exchange_auth', JSON.stringify({ principal, at: Date.now() })) } catch { /* ignore */ }
      } else {
        // IDB says we're anonymous → drop the optimistic flag.
        exchangeStore.isAuthenticated = false
        exchangeStore.principalText = ''
        try { localStorage.removeItem('taco_exchange_auth') } catch { /* ignore */ }
      }
    } catch (err) {
      // Surface in dev so a corrupt IDB / failed import doesn't silently masquerade.
      console.warn('[useExchangeAuth] checkExistingAuth failed:', err)
    }
  }

  /** Connect via Internet Identity */
  async function connect() {
    if (isConnecting.value) return
    isConnecting.value = true
    error.value = null

    try {
      const { getCachedAuthClient } = await import('../../shared/auth-cache')
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
          maxTimeToLive: BigInt(30 * 24 * 60 * 60 * 1_000_000_000), // 30 days
          onSuccess: () => resolve(),
          onError: (err) => reject(new Error(String(err))),
        })
      })

      const identity = authClient.getIdentity()
      const principal = identity.getPrincipal().toText()
      exchangeStore.isAuthenticated = true
      exchangeStore.principalText = principal
      exchangeStore.clearActorCache()

      // Promote origin to persistent storage so the browser won't evict the
      // IndexedDB delegation under storage pressure. Without this, the 30-day
      // session can be silently wiped after long idle periods on busy disks.
      try { await navigator.storage?.persist?.() } catch { /* ignore */ }

      // Optimistic auth paint cache: next window open paints the connect pill
      // before the IDB read completes.
      try {
        localStorage.setItem('taco_exchange_auth', JSON.stringify({ principal, at: Date.now() }))
      } catch { /* ignore */ }

      // Cross-tab notification — other open tabs flip to connected immediately.
      try { new BroadcastChannel('taco-exchange-auth').postMessage({ type: 'login', principal }) } catch { /* ignore */ }

      toast.success('Wallet Connected')
    } catch (err: any) {
      error.value = err.message || 'Failed to connect wallet'
      console.error('Exchange auth connect error:', err)
      toast.error('Connection Failed', error.value ?? undefined)
    } finally {
      isConnecting.value = false
    }
  }

  /** Disconnect and clear auth state */
  async function disconnect() {
    try {
      const { getCachedAuthClient } = await import('../../shared/auth-cache')
      const authClient = await getCachedAuthClient()
      await authClient.logout()
    } catch {
      // Ignore logout errors
    }

    exchangeStore.isAuthenticated = false
    exchangeStore.principalText = ''
    exchangeStore.clearActorCache()
    try { localStorage.removeItem('taco_exchange_auth') } catch { /* ignore */ }
    try { new BroadcastChannel('taco-exchange-auth').postMessage({ type: 'logout' }) } catch { /* ignore */ }
    toast.info('Wallet Disconnected')
  }

  /** Copy the principal to clipboard */
  async function copyPrincipal(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(principalText.value)
      toast.info('Principal Copied')
      return true
    } catch {
      return false
    }
  }

  onMounted(() => {
    if (!bootChecked) {
      bootChecked = true
      checkExistingAuth()
    }

    if (!bootBroadcastWired) {
      bootBroadcastWired = true

      // Cross-tab login/logout sync. Other tabs broadcast on the same
      // channel; whichever tab fired the original auth action drives all
      // others into the same state immediately, no manual refresh required.
      try {
        const channel = new BroadcastChannel('taco-exchange-auth')
        channel.onmessage = (ev) => {
          const data = ev.data as { type?: string; principal?: string }
          if (data?.type === 'logout') {
            exchangeStore.isAuthenticated = false
            exchangeStore.principalText = ''
            exchangeStore.clearActorCache()
            try { localStorage.removeItem('taco_exchange_auth') } catch { /* ignore */ }
          } else if (data?.type === 'login' && data.principal) {
            exchangeStore.isAuthenticated = true
            exchangeStore.principalText = data.principal
            exchangeStore.clearActorCache()
          }
        }
      } catch { /* BroadcastChannel unavailable — fall back to localStorage events */ }

      // Same role for browsers that nuked BroadcastChannel for bfcache.
      window.addEventListener('storage', (e) => {
        if (e.key !== 'taco_exchange_auth') return
        if (e.newValue == null) {
          exchangeStore.isAuthenticated = false
          exchangeStore.principalText = ''
          exchangeStore.clearActorCache()
        } else {
          try {
            const v = JSON.parse(e.newValue) as { principal?: string }
            if (v?.principal && v.principal !== exchangeStore.principalText) {
              exchangeStore.isAuthenticated = true
              exchangeStore.principalText = v.principal
              exchangeStore.clearActorCache()
            }
          } catch { /* ignore */ }
        }
      })

      // After a long sleep (laptop lid closed overnight), revisiting the tab
      // should reconcile auth state. If the delegation expired meanwhile,
      // the UI shouldn't keep showing connected.
      onVisible(() => { checkExistingAuth() })
    }
  })

  return {
    isConnected,
    isConnecting,
    principalText,
    truncatedPrincipal,
    error,
    connect,
    disconnect,
    copyPrincipal,
    checkExistingAuth,
  }
}
