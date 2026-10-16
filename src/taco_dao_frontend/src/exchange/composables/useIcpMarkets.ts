/**
 * Which held tokens can be sold for ICP at all: a TACO pool with this token and
 * non zero reserves (TACO routes reach ICP through its hubs), or an ICPSwap
 * X/ICP pool. The Sell many picker disables a token only on a known "no"
 * ("No ICP market here"); while unknown it stays selectable.
 *
 * TACO pools: one anonymous getAllAMMPools query, kept 10 minutes.
 * ICPSwap pools: one factory lookup per token, kept 24 h in localStorage.
 */
import { ref } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { ICP_LEDGER_ID } from '../constants/tokens'
import * as icpswap from '../services/icpswap'
import { isTransportError } from '../utils/errors'

const AMM_TTL_MS = 10 * 60_000
const ICPSWAP_KEY = 'taco_icpswap_icp_pools'
const ICPSWAP_TTL_MS = 24 * 60 * 60_000

const tacoTokens = ref<Set<string> | null>(null)
let tacoAt = 0
let tacoInflight: Promise<void> | null = null
const known = ref<Record<string, boolean>>({})
const checking = new Set<string>()

function readIcpswapCache(): Record<string, { ok: boolean; at: number }> {
  try { return JSON.parse(localStorage.getItem(ICPSWAP_KEY) ?? '{}') ?? {} } catch { return {} }
}
function writeIcpswapCache(addr: string, ok: boolean) {
  try {
    const c = readIcpswapCache()
    c[addr] = { ok, at: Date.now() }
    localStorage.setItem(ICPSWAP_KEY, JSON.stringify(c))
  } catch { /* memory only */ }
}

export function useIcpMarkets() {
  const store = useExchangeStore()

  async function loadTaco() {
    if (tacoTokens.value && Date.now() - tacoAt < AMM_TTL_MS) return
    if (tacoInflight) return tacoInflight
    tacoInflight = (async () => {
      try {
        const pools = await store.getAllAMMPools()
        const set = new Set<string>()
        for (const p of pools as any[]) {
          if (BigInt(p.reserve0 ?? 0n) > 0n && BigInt(p.reserve1 ?? 0n) > 0n) { set.add(p.token0); set.add(p.token1) }
        }
        tacoTokens.value = set
        tacoAt = Date.now()
      } catch { /* unknown stays unknown */ }
      finally { tacoInflight = null }
    })()
    return tacoInflight
  }

  async function check(addr: string) {
    if (addr === ICP_LEDGER_ID || checking.has(addr) || known.value[addr] != null) return
    checking.add(addr)
    try {
      await loadTaco()
      if (tacoTokens.value?.has(addr)) { known.value = { ...known.value, [addr]: true }; return }
      const cached = readIcpswapCache()[addr]
      let ok: boolean | null = cached && Date.now() - cached.at < ICPSWAP_TTL_MS ? cached.ok : null
      if (ok == null) {
        try { await icpswap.getPoolCanister(addr, ICP_LEDGER_ID); ok = true }
        catch (e: any) {
          // getPoolCanister also wraps network failures in its "No ICPSwap pool" error
          const msg = String(e?.message ?? '')
          ok = /No ICPSwap pool/.test(msg) && !isTransportError({ message: msg }) && !/timed out|fetch/i.test(msg) ? false : null
        }
        if (ok != null) writeIcpswapCache(addr, ok)
      }
      // TACO pools unknown and no ICPSwap pool: still unknown, not a "no".
      if (ok === false && !tacoTokens.value) return
      if (ok != null) known.value = { ...known.value, [addr]: ok }
    } finally { checking.delete(addr) }
  }

  /** Check these tokens in the background (a few at a time). */
  function ensure(addrs: string[]) {
    void (async () => {
      const queue = addrs.filter(a => known.value[a] == null)
      const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
        while (queue.length) await check(queue.shift()!)
      })
      await Promise.all(workers)
    })()
  }

  /** true or false once known, null while unknown. */
  function hasIcpMarket(addr: string): boolean | null {
    return known.value[addr] ?? null
  }

  return { ensure, hasIcpMarket }
}
