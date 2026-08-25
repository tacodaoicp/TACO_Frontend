/**
 * Console recovery handle. Exposes the app's OWN recovery functions on
 * `window.tacoRecover` so support can run them from F12 with one line, using
 * the already-authenticated agent — no library import (blocked by the page
 * CSP), no identity rebuild. Every action moves the signed-in user's own funds
 * to their own wallet, the same as the Recover page buttons, so there is no new
 * attack surface (the destination is always the caller's own account).
 */
import * as icpswap from '../services/icpswap'
import * as neutrinite from '../services/neutrinite'
import { getCachedIdentity } from '../../shared/auth-cache'

const big = (_: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)

export function installRecoverConsole(): void {
  if (typeof window === 'undefined') return
  ;(window as any).tacoRecover = {
    /** Withdraw every balance the Neutrinite pylon holds for you, all ledgers. */
    async neutrinite() {
      const r = await neutrinite.sweepAll()
      console.log('[tacoRecover] neutrinite:', JSON.stringify(r, big))
      return r
    },
    /** Sweep one ICPSwap pool by its two token canister ids (order irrelevant). */
    async icpswap(token0: string, token1: string, poolId?: string) {
      const ok = await icpswap.sweepWithRetry({ token0Principal: token0, token1Principal: token1, poolId }, 5)
      console.log('[tacoRecover] icpswap sweep', token0, token1, '→', ok ? 'recovered' : 'nothing / failed')
      return ok
    },
    /** List every ICPSwap pool holding an unused balance for you. */
    async icpswapScan() {
      const me = (await getCachedIdentity()).getPrincipal()
      const pools = await icpswap.getAllPools()
      const hits: any[] = []
      for (const p of pools) {
        const bal = await icpswap.getUnusedBalance(p.canisterId, me)
        if (bal && (bal.balance0 > 0n || bal.balance1 > 0n)) {
          hits.push({ pool: p.canisterId, token0: p.token0.address, token1: p.token1.address, ...bal })
        }
      }
      console.log(`[tacoRecover] scanned ${pools.length} pools, ${hits.length} with balances:`, JSON.stringify(hits, big))
      return hits
    },
    /** Show withdraws stuck inside a pool (needs ICPSwap support to release). */
    async icpswapStuck(poolId: string) {
      const me = (await getCachedIdentity()).getPrincipal()
      const recs = await icpswap.getStuckPoolWithdraws(poolId, me)
      console.log('[tacoRecover] stuck in', poolId, ':', JSON.stringify(recs, big))
      return recs
    },
    help() {
      console.log(`tacoRecover — recover stuck funds for the signed-in wallet:
  await tacoRecover.neutrinite()                     sweep all Neutrinite pylon balances
  await tacoRecover.icpswapScan()                    list ICPSwap pools holding your balances
  await tacoRecover.icpswap(token0, token1[, pool])  sweep one ICPSwap pool
  await tacoRecover.icpswapStuck(poolId)             show withdraws stuck inside a pool
The Recover page's "Recover All" button does all of this at once.`)
    },
  }
}
