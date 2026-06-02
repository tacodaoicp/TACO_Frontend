/**
 * useTokenBalance — the single reactive per-token balance accessor.
 *
 * Binds to the store's one `userBalanceQuery` cache (the unified balance source)
 * and returns its reactive `.data` ref. Because the value is read inside a
 * computed, any `refreshAllBalances()` — which the mutation bus fires after every
 * swap / order / lp / claim / referral / transfer — re-renders every consumer
 * automatically. No per-component mutation subscription, no page reload.
 *
 * This replaces the old anti-pattern of `const x = ref(0n)` + a `watch` that
 * copies `await store.getUserBalance(addr)` once and never updates after a swap.
 */

import { computed, unref, watch, type ComputedRef, type Ref } from 'vue'
import { useExchangeStore } from '../store/exchange.store'

type AddrSource =
  | Ref<string | undefined>
  | ComputedRef<string | undefined>
  | (() => string | undefined)

export function useTokenBalance(addr: AddrSource): ComputedRef<bigint> {
  const store = useExchangeStore()
  const read = (): string | undefined =>
    typeof addr === 'function' ? addr() : unref(addr)

  // Open + kick a fetch whenever the address or auth changes; the keyed query
  // dedups across every consumer of the same token.
  watch(
    () => [read(), store.isAuthenticated] as const,
    ([a, authed]) => { if (a && authed) void store.userBalanceQuery(a).ensure() },
    { immediate: true },
  )

  return computed<bigint>(() => {
    const a = read()
    if (!a || !store.isAuthenticated) return 0n
    return store.userBalanceQuery(a).data.value ?? 0n
  })
}
