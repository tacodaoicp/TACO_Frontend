/**
 * Exchange Query Worker (DedicatedWorker) — generic RPC bridge to OTC_backend.
 *
 * Does the Candid DECODE of read-query responses off the main thread. The
 * exchange's per-query decodes (pool stats, kline, exchangeInfo, LP positions…)
 * were ~hundreds of ms each on the UI thread, blocking mobile loads.
 *
 * Protocol (postMessage):
 *   { type:'SET_NETWORK', host, canisterId, fetchRootKey }
 *   { type:'SET_IDENTITY', identity:{ delegationChainJson, sessionKeyJson } }
 *   { type:'CLEAR_IDENTITY' }
 *   { type:'CALL', id, method, args, auth }   // args = serializeForTransfer'd actor args
 *       -> { id, ok:true,  result }           // result = serializeForTransfer'd
 *       -> { id, ok:false, error }
 *
 * Anonymous reads use verifyQuerySignatures:false (public display data).
 * Authenticated READ queries (auth:true) use the user's delegated identity.
 * UPDATE calls never come here — they stay on the main thread.
 */
import { Actor, HttpAgent } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity'
// @ts-ignore - generated .did.js has no type declarations
import { idlFactory } from 'declarations/OTC_backend/OTC_backend.did.js'
import { serializeForTransfer, deserializeFromTransfer } from './shared/transfer'

interface NetCfg { host: string; canisterId: string; fetchRootKey: boolean }
interface SerializedIdentity { delegationChainJson: string; sessionKeyJson: string }

let net: NetCfg | null = null
let anonActor: any = null
let anonActorPromise: Promise<any> | null = null
let identity: DelegationIdentity | null = null
let authActor: any = null
let authActorPromise: Promise<any> | null = null

function resetActors(): void {
  anonActor = null; anonActorPromise = null
  authActor = null; authActorPromise = null
}

async function getAnonActor(): Promise<any> {
  if (anonActor) return anonActor
  if (!net) throw new Error('exchange-query worker: SET_NETWORK not received')
  if (!anonActorPromise) {
    anonActorPromise = (async () => {
      const agent = new HttpAgent({ host: net!.host, verifyQuerySignatures: false })
      if (net!.fetchRootKey) await agent.fetchRootKey()
      anonActor = Actor.createActor(idlFactory, { agent, canisterId: net!.canisterId })
      return anonActor
    })()
  }
  return anonActorPromise
}

async function getAuthActor(): Promise<any> {
  if (authActor) return authActor
  if (!net) throw new Error('exchange-query worker: SET_NETWORK not received')
  if (!identity) throw new Error('exchange-query worker: not authenticated')
  if (!authActorPromise) {
    authActorPromise = (async () => {
      const agent = await createAgent({ identity: identity!, host: net!.host, fetchRootKey: net!.fetchRootKey })
      authActor = Actor.createActor(idlFactory, { agent, canisterId: net!.canisterId })
      return authActor
    })()
  }
  return authActorPromise
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data
  if (!msg || typeof msg !== 'object') return

  if (msg.type === 'SET_NETWORK') {
    net = { host: String(msg.host), canisterId: String(msg.canisterId), fetchRootKey: !!msg.fetchRootKey }
    resetActors()
    return
  }

  if (msg.type === 'SET_IDENTITY') {
    try {
      const s = msg.identity as SerializedIdentity
      const chain = DelegationChain.fromJSON(JSON.parse(s.delegationChainJson))
      const sessionKey = Ed25519KeyIdentity.fromJSON(s.sessionKeyJson)
      identity = DelegationIdentity.fromDelegation(sessionKey, chain)
    } catch {
      identity = null
    }
    authActor = null; authActorPromise = null
    return
  }

  if (msg.type === 'CLEAR_IDENTITY') {
    identity = null
    authActor = null; authActorPromise = null
    return
  }

  if (msg.type === 'CALL') {
    const { id, method, args, auth } = msg
    try {
      const actor = auth ? await getAuthActor() : await getAnonActor()
      const callArgs = Array.isArray(args) ? args.map(deserializeFromTransfer) : []
      const result = await actor[method](...callArgs)
      ;(self as unknown as Worker).postMessage({ id, ok: true, result: serializeForTransfer(result) })
    } catch (err: any) {
      ;(self as unknown as Worker).postMessage({ id, ok: false, error: err?.message || String(err) })
    }
    return
  }
}
