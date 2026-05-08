import { ref, watch } from 'vue'
import { useNachosStore } from '../stores/nachos.store'
import { usePolling } from './usePolling'

export function useTokenBalance(tokenPrincipal: string, intervalMs = 30_000) {
  const nachosStore = useNachosStore()
  const balance = ref<bigint | null>(null)
  let inFlight = false

  const fetchBalance = async () => {
    if (inFlight) return
    inFlight = true
    try {
      balance.value = await nachosStore.getTokenBalance(tokenPrincipal)
    } catch {
      balance.value = null
    } finally {
      inFlight = false
    }
  }

  const { refresh } = usePolling(fetchBalance, { interval: intervalMs, immediate: true })

  watch(() => nachosStore.dashboardData, () => { void refresh() })

  return { balance, refresh }
}
