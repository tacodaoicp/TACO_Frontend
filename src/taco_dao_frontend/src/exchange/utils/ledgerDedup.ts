/**
 * Ledgers known to deduplicate transfers that set created_at_time: the ICP
 * ledger and the DFINITY ICRC-1 ledger (every SNS ledger listed by SNS-W,
 * ckBTC, ckETH and the ck ERC20 ledgers the ckETH minter lists). On those a
 * TACO V1 deposit whose answer was lost can be sent again unchanged: the ledger
 * answers Duplicate with the original block instead of paying twice. Any other
 * ledger gets no resend.
 *
 * The list is read with anonymous queries and kept for 24 h; an unreadable list
 * means an empty set (no resends), never a guess.
 */
import { Actor, HttpAgent } from '@dfinity/agent'
import { getNetworkHost } from '../../shared/auth-cache'
import { getEffectiveNetwork } from '../../config/network-config'
import { ckethMinterIDL, CKETH_MINTER_ID, CKBTC_LEDGER_ID, CKETH_LEDGER_ID } from '../bridge/minter-idl'
import { ICP_LEDGER_ID } from '../constants/tokens'
import { withTimeout } from './withTimeout'

const SNS_WASM_ID = 'qaa6y-5yaaa-aaaaa-aaafa-cai'
const CACHE_KEY = 'taco_dedup_ledgers'
const TTL_MS = 24 * 60 * 60_000

const snsWasmIDL = ({ IDL }: any) => {
  // Only the field we read; candid record subtyping drops the rest.
  const DeployedSns = IDL.Record({ ledger_canister_id: IDL.Opt(IDL.Principal) })
  return IDL.Service({
    list_deployed_snses: IDL.Func([IDL.Record({})], [IDL.Record({ instances: IDL.Vec(DeployedSns) })], ['query']),
  })
}

let memo: { set: Set<string>; at: number } | null = null
let inflight: Promise<Set<string>> | null = null

function readSaved(): { set: Set<string>; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (!Array.isArray(v?.ids) || typeof v?.at !== 'number') return null
    return { set: new Set<string>(v.ids), at: v.at }
  } catch { return null }
}

async function load(): Promise<Set<string>> {
  const agent = new HttpAgent({ host: getNetworkHost(), verifyQuerySignatures: false })
  if (getEffectiveNetwork() === 'local') await agent.fetchRootKey()
  const ids = new Set<string>([ICP_LEDGER_ID, CKBTC_LEDGER_ID, CKETH_LEDGER_ID])
  const [sns, minter] = await Promise.allSettled([
    withTimeout((Actor.createActor(snsWasmIDL, { agent, canisterId: SNS_WASM_ID }) as any).list_deployed_snses({}), 15_000, 'list_deployed_snses'),
    withTimeout((Actor.createActor(ckethMinterIDL, { agent, canisterId: CKETH_MINTER_ID }) as any).get_minter_info(), 15_000, 'get_minter_info'),
  ])
  let read = 0
  if (sns.status === 'fulfilled') {
    read++
    for (const i of (sns.value as any).instances ?? []) {
      const l = i?.ledger_canister_id?.[0]
      if (l) ids.add(l.toText())
    }
  }
  if (minter.status === 'fulfilled') {
    read++
    for (const t of (minter.value as any).supported_ckerc20_tokens?.[0] ?? []) {
      if (t?.ledger_canister_id) ids.add(t.ledger_canister_id.toText())
    }
  }
  if (read === 0) throw new Error('dedup ledger lists unreadable')
  return ids
}

/** The deduplicating ledgers (cached 24 h). Never throws: unreadable gives an empty set. */
export async function dedupLedgers(): Promise<Set<string>> {
  const now = Date.now()
  if (memo && now - memo.at < TTL_MS) return memo.set
  const saved = readSaved()
  if (saved && now - saved.at < TTL_MS) { memo = saved; return saved.set }
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const set = await load()
      memo = { set, at: Date.now() }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ids: [...set], at: memo.at })) } catch { /* memory copy stands */ }
      return set
    } catch (e) {
      console.warn('[CrossDEX] could not read the deduplicating ledgers; deposits get no resend:', e)
      return new Set<string>()
    } finally { inflight = null }
  })()
  return inflight
}
