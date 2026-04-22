/**
 * Composable for exchange authentication state management.
 * Wraps the shared auth-cache.ts for the exchange UI's connect/disconnect button.
 */

import { ref, computed, onMounted } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { useExchangeToast } from './useExchangeToast'

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

  /** Check for existing authentication on mount */
  async function checkExistingAuth() {
    try {
      const { getCachedIdentity } = await import('../../shared/auth-cache')
      const identity = await getCachedIdentity()
      if (identity && !identity.getPrincipal().isAnonymous()) {
        exchangeStore.isAuthenticated = true
        exchangeStore.principalText = identity.getPrincipal().toText()
      }
    } catch {
      // Not authenticated — that's fine
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
      exchangeStore.isAuthenticated = true
      exchangeStore.principalText = identity.getPrincipal().toText()
      exchangeStore.clearActorCache()
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

  onMounted(checkExistingAuth)

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
