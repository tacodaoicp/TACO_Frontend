/**
 * Client for the Exchange Query Worker.
 *
 * Singleton dedicated worker that runs the OTC_backend Candid decode off the
 * main thread. cachedQuery fetchers call `callExchangeQuery(method, args)`
 * instead of `getQueryActor().method(...)`; everything else (dedup, TTL,
 * persistence, reactivity) stays in the main thread's cachedQuery.
 */
import ExchangeQueryWorkerUrl from './exchange-query.worker.ts?worker&url'
import { serializeForTransfer, deserializeFromTransfer } from './shared/transfer'
import { getNetworkHost } from '../shared/auth-cache'
import { getEffectiveNetwork } from '../config/network-config'
import { getCanisterId } from '../constants/canisterIds'

interface NetCfg { host: string; canisterId: string; fetchRootKey: boolean }
export interface SerializedIdentity { delegationChainJson: string; sessionKeyJson: string }

let worker: Worker | null = null
let netSent: NetCfg | null = null
let identitySent: SerializedIdentity | null = null
let nextId = 1
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void; timer: ReturnType<typeof setTimeout> }>()

function resolveNet(): NetCfg {
  return {
    host: getNetworkHost(),
    canisterId: getCanisterId('exchange'),
    fetchRootKey: getEffectiveNetwork() === 'local',
  }
}

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new Worker(ExchangeQueryWorkerUrl, { type: 'module', name: 'exchange-query' })
  worker.onmessage = (e: MessageEvent) => {
    const { id, ok, result, error } = e.data || {}
    const p = pending.get(id)
    if (!p) return
    pending.delete(id)
    clearTimeout(p.timer)
    if (ok) p.resolve(deserializeFromTransfer(result))
    else p.reject(new Error(error || 'exchange worker error'))
  }
  worker.onerror = (e) => {
    for (const [, p] of pending) { clearTimeout(p.timer); p.reject(new Error(e.message || 'exchange worker crashed')) }
    pending.clear()
    // Drop the dead worker so the next call respawns it.
    try { worker?.terminate() } catch { /* ignore */ }
    worker = null
    netSent = null
  }
  netSent = resolveNet()
  worker.postMessage({ type: 'SET_NETWORK', ...netSent })
  // Re-auth a freshly (re)spawned worker so authenticated reads keep working.
  if (identitySent) worker.postMessage({ type: 'SET_IDENTITY', identity: identitySent })
  return worker
}

/** Send the user's (serialized) delegated identity for authenticated reads. */
export function setExchangeWorkerIdentity(identity: SerializedIdentity): void {
  identitySent = identity
  ensureWorker().postMessage({ type: 'SET_IDENTITY', identity })
}

/** Clear the worker's identity (logout). */
export function clearExchangeWorkerIdentity(): void {
  identitySent = null
  if (worker) worker.postMessage({ type: 'CLEAR_IDENTITY' })
}

/**
 * Spin up the worker (and send SET_NETWORK) ahead of the first query so its
 * cold-start — fetching/parsing the worker chunk + @dfinity/agent — overlaps
 * with app init instead of delaying the first read.
 */
export function warmExchangeWorker(): void { ensureWorker() }

/** Update the worker's network (e.g. after a taco_network_override change). */
export function setExchangeWorkerNetwork(): void {
  const cfg = resolveNet()
  netSent = cfg
  if (worker) worker.postMessage({ type: 'SET_NETWORK', ...cfg })
}

/**
 * Call an anonymous OTC_backend read method in the worker. Returns the decoded
 * (revived) result, identical to `getQueryActor().method(...args)`.
 */
export interface ExchangeCallOpts { auth?: boolean; timeoutMs?: number }

export function callExchangeQuery<T = unknown>(method: string, args: unknown[] = [], opts: ExchangeCallOpts = {}): Promise<T> {
  const w = ensureWorker()
  const id = nextId++
  const timeoutMs = opts.timeoutMs ?? 20_000
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`exchange worker call '${method}' timed out`))
    }, timeoutMs)
    pending.set(id, { resolve, reject, timer })
    w.postMessage({ type: 'CALL', id, method, args: args.map(serializeForTransfer), auth: !!opts.auth })
  })
}
