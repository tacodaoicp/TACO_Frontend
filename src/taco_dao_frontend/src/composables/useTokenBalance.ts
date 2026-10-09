import { ref, watch } from 'vue'
import { useNachosStore } from '../stores/nachos.store'
import { usePolling } from './usePolling'
import { readUserCache, writeUserCache } from '../utils/userScopedCache'

export function useTokenBalance(tokenPrincipal: string, intervalMs = 30_000) {
  const nachosStore = useNachosStore()
  const balance = ref<bigint | null>(null)
  // True once this session has read the balance from the ledger. Until then
  // the balance on screen is the last known one from the cache: fine to show
  // and to size MAX with, but actions wait for the ledger's answer.
  const balanceFresh = ref(false)
  // Account whose balance is being fetched (one request per account at a time)
  let inFlightFor: string | null = null

  const cacheName = `balance:${tokenPrincipal}`

  // Last known balance of the signed-in account (none for another account)
  const seed = (principal: string) => {
    balanceFresh.value = false
    balance.value = readUserCache<bigint>(principal, cacheName)?.value ?? null
  }

  const fetchBalance = async () => {
    const principal = nachosStore.userPrincipal
    if (!principal || inFlightFor === principal) return
    inFlightFor = principal
    try {
      const value = await nachosStore.getTokenBalance(tokenPrincipal)
      // Signed out or switched account while this was in flight: not theirs
      if (principal !== nachosStore.userPrincipal) return
      balance.value = value
      balanceFresh.value = true
      writeUserCache(principal, cacheName, value)
    } catch {
      // Keep the last balance on screen; the next poll tries again
    } finally {
      if (inFlightFor === principal) inFlightFor = null
    }
  }

  seed(nachosStore.userPrincipal)

  const { refresh } = usePolling(fetchBalance, { interval: intervalMs, immediate: true })

  watch(() => nachosStore.userPrincipal, (principal) => {
    seed(principal)
    void refresh()
  })

  watch(() => nachosStore.dashboardData, () => { void refresh() })

  return { balance, balanceFresh, refresh }
}
