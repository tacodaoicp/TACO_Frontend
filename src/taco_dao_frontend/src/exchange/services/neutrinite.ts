/**
 * Neutrinite (DeFi Vectors / "Transcendence" pylon) client — exchange-app-local.
 *
 * Uses the pylon's SYNCHRONOUS on-chain DEX (dex_quote / dex_swap), NOT the
 * async vector/DCA model. Interface taken verbatim from the authoritative
 * on-chain Candid (dfx metadata candid:service of togwv-zqaaa-aaaal-qr7aa-cai).
 *
 * There is no ICRC2 approve here. A swap is: deposit the input token by a plain
 * icrc1_transfer to the pylon-owned per-user subaccount (found via
 * icrc55_accounts), wait for the pylon's ~2s ledger indexer to CREDIT it,
 * dex_swap against that virtual balance, then withdraw the output to the user's
 * wallet via icrc55_command(transfer). Funds always sit under the user's own
 * Account, so an interrupted swap is recoverable via sweep() / the Recover page.
 */

import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { getCachedAgent, getCachedIdentity, getNetworkHost } from '../../shared/auth-cache'
import { getEffectiveNetwork } from '../../config/network-config'
import { icrcIDL } from '../../shared/icrc-idl'
import { withTimeout } from '../utils/withTimeout'

const safeStringify = (obj: unknown) =>
  JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v))

export const NEUTRINITE_PYLON = 'togwv-zqaaa-aaaal-qr7aa-cai'

// Credit polling: the pylon indexes incoming icrc1 transfers on a ~2s timer, so
// a deposit is not usable by dex_swap until credited. Poll the virtual balance.
const CREDIT_POLL_TRIES = 24
const CREDIT_POLL_INTERVAL_MS = 1500
const CREDIT_POLL_DEADLINE_MS = 40_000 // hard wall-clock cap so the swap modal can't hang here

// ── Pylon IDL (only the methods we use) ──
const pylonIDL = ({ IDL }: any) => {
  const Account = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })
  const SupportedLedger = IDL.Variant({
    ic: IDL.Principal,
    other: IDL.Record({ ledger: IDL.Vec(IDL.Nat8), platform: IDL.Nat64 }),
  })
  const QuoteRequest = IDL.Record({ amount: IDL.Nat, ledger_from: SupportedLedger, ledger_to: SupportedLedger })
  // ok intentionally minimal — Candid record subtyping ignores the extra wire fields.
  const QuoteResponse = IDL.Variant({ err: IDL.Text, ok: IDL.Record({ amount_out: IDL.Nat }) })
  const SwapRequest = IDL.Record({
    account: Account, amount: IDL.Nat, ledger_from: SupportedLedger, ledger_to: SupportedLedger, min_amount_out: IDL.Nat,
  })
  const SwapReportResponse = IDL.Variant({ err: IDL.Text, ok: IDL.Record({ amount_out: IDL.Nat }) })

  const AccountsRequest = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })
  const EndpointIC = IDL.Record({ account: Account, ledger: IDL.Principal })
  const EndpointOther = IDL.Record({ account: IDL.Vec(IDL.Nat8), ledger: IDL.Vec(IDL.Nat8), platform: IDL.Nat64 })
  const Endpoint = IDL.Variant({ ic: EndpointIC, other: EndpointOther })
  const AccountEndpoint = IDL.Record({ balance: IDL.Nat, endpoint: Endpoint })
  const AccountsResponse = IDL.Vec(AccountEndpoint)

  const Controller = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })
  const TransferRequest = IDL.Record({
    amount: IDL.Nat,
    from: IDL.Variant({ account: Account }),
    ledger: SupportedLedger,
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: IDL.Variant({ external_account: IDL.Variant({ ic: Account, icp: IDL.Vec(IDL.Nat8), other: IDL.Vec(IDL.Nat8) }) }),
  })
  const Command = IDL.Variant({ transfer: TransferRequest })
  const BatchCommandRequest = IDL.Record({
    commands: IDL.Vec(Command),
    controller: Controller,
    expire_at: IDL.Opt(IDL.Nat64),
    request_id: IDL.Opt(IDL.Nat32),
    signature: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  const BatchCommandResponse = IDL.Variant({
    err: IDL.Variant({
      caller_not_controller: IDL.Null, duplicate: IDL.Nat, expired: IDL.Null, invalid_signature: IDL.Null, other: IDL.Text,
    }),
    ok: IDL.Record({}),
  })

  return IDL.Service({
    dex_quote: IDL.Func([QuoteRequest], [QuoteResponse], ['query']),
    dex_swap: IDL.Func([SwapRequest], [SwapReportResponse], []),
    icrc55_accounts: IDL.Func([AccountsRequest], [AccountsResponse], ['query']),
    icrc55_account_register: IDL.Func([Account], [], []),
    icrc55_command: IDL.Func([BatchCommandRequest], [BatchCommandResponse], []),
  })
}

// ── Agents ──
let _anonAgent: HttpAgent | null = null
async function anonActor(): Promise<any> {
  if (!_anonAgent) {
    const agent = new HttpAgent({ host: getNetworkHost(), verifyQuerySignatures: false })
    if (getEffectiveNetwork() === 'local') await agent.fetchRootKey()
    _anonAgent = agent
  }
  return Actor.createActor(pylonIDL, { agent: _anonAgent, canisterId: NEUTRINITE_PYLON })
}
async function authedPylon(): Promise<any> {
  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')
  return Actor.createActor(pylonIDL, { agent, canisterId: NEUTRINITE_PYLON })
}

const ledgerVar = (p: string) => ({ ic: Principal.fromText(p) })

/**
 * Pre-register the user's account with the pylon in the background (e.g. on app
 * open) so the first CrossDEX swap doesn't wait on the registration round-trip.
 * Idempotent and cached per principal; safe to call repeatedly. No-op if anon.
 */
export async function register(): Promise<void> {
  try {
    const identity = await getCachedIdentity()
    const owner = identity.getPrincipal()
    if (owner.isAnonymous()) return
    if (_registered.has(owner.toText())) return
    const pylon = await authedPylon()
    await ensureRegistered(pylon, { owner, subaccount: [] as [] }, owner)
  } catch (e) {
    console.warn('[neutrinite] background register skipped:', e)
  }
}

// Register the caller's account with the pylon once per session. Registration is
// idempotent and cheap; doing it before the first deposit makes sure the pylon's
// indexer tracks (and credits) transfers to this account's derived subaccount.
const _registered = new Set<string>()
async function ensureRegistered(pylon: any, userAccount: any, owner: Principal): Promise<void> {
  const key = owner.toText()
  if (_registered.has(key)) return
  try {
    await pylon.icrc55_account_register(userAccount)
    _registered.add(key)
  } catch (e) {
    console.warn('[neutrinite] account_register failed (continuing):', e)
  }
}

function findEndpoint(accounts: any[], ledgerPrincipal: string): { account: any; balance: bigint } | null {
  for (const ae of accounts) {
    const ep = ae?.endpoint
    if (ep && 'ic' in ep && ep.ic.ledger.toText() === ledgerPrincipal) {
      return { account: ep.ic.account, balance: ae.balance as bigint }
    }
  }
  return null
}

// ── Quotes (anonymous, synchronous query) ──
export async function getQuoteAmount(sell: string, buy: string, amountIn: bigint): Promise<bigint> {
  if (amountIn <= 0n) return 0n
  try {
    const actor = await anonActor()
    const res = await actor.dex_quote({ amount: amountIn, ledger_from: ledgerVar(sell), ledger_to: ledgerVar(buy) })
    if ('ok' in res) return res.ok.amount_out as bigint
    return 0n // err: "No price for exchange" (no liquidity) → treat as no route
  } catch {
    return 0n
  }
}

export async function quoteGrid(sell: string, buy: string, amounts: bigint[]): Promise<bigint[]> {
  const settled = await Promise.allSettled(amounts.map(a => getQuoteAmount(sell, buy, a)))
  return settled.map(s => (s.status === 'fulfilled' ? s.value : 0n))
}

// ── Pending-swap cache (localStorage) — survives a tab-close so the Recover page can sweep ──
const PENDING_KEY = 'taco_neutrinite_pending'
const PENDING_MAX = 30
const PENDING_MAX_AGE_MS = 21 * 86_400_000

export interface PendingNeutrinite { sell: string; buy: string; timestamp: number }

export function savePendingSwap(sell: string, buy: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    const list: PendingNeutrinite[] = raw ? JSON.parse(raw) : []
    const deduped = list.filter(e => !(e.sell === sell && e.buy === buy))
    deduped.unshift({ sell, buy, timestamp: Date.now() })
    const now = Date.now()
    localStorage.setItem(PENDING_KEY, JSON.stringify(deduped.filter(e => now - e.timestamp < PENDING_MAX_AGE_MS).slice(0, PENDING_MAX)))
  } catch { /* ignore */ }
}
export function getPendingSwaps(): PendingNeutrinite[] {
  try { const raw = localStorage.getItem(PENDING_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
export function removePendingSwap(sell: string, buy: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return
    const list = JSON.parse(raw) as PendingNeutrinite[]
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.filter(e => !(e.sell === sell && e.buy === buy))))
  } catch { /* ignore */ }
}

export interface NeutriniteSwapParams {
  sell: string
  buy: string
  amountIn: bigint
  minAmountOut: bigint
  onStep?: (step: string) => void
}

/**
 * Execute a synchronous Neutrinite swap: deposit -> (poll credit) -> dex_swap -> withdraw.
 * Funds stay under the user's own pylon Account throughout; on failure the caller
 * should sweep() to reclaim any stranded virtual balance.
 */
export async function executeSwap(params: NeutriniteSwapParams): Promise<{ amountOut: bigint }> {
  const identity = await getCachedIdentity()
  const owner = identity.getPrincipal()
  if (owner.isAnonymous()) throw new Error('Not authenticated')
  const userAccount = { owner, subaccount: [] as [] }
  const pylon = await authedPylon()

  savePendingSwap(params.sell, params.buy)

  // 1. Register (idempotent) so the pylon indexes this account, then resolve the
  // pylon-owned deposit account for the sell ledger (+ current virtual balance).
  params.onStep?.('Preparing deposit…')
  await ensureRegistered(pylon, userAccount, owner)
  const accounts = (await pylon.icrc55_accounts({ owner, subaccount: [] })) as any[]
  const sellEp = findEndpoint(accounts, params.sell)
  if (!sellEp) throw new Error('Neutrinite: no deposit endpoint for this token')
  const balanceBefore = sellEp.balance
  const depositAccount = sellEp.account // { owner: pylon, subaccount: [bytes] }

  // 2. Fund the swap: plain icrc1_transfer of the input token into the pylon account.
  params.onStep?.('Depositing…')
  const tokenActor = Actor.createActor(icrcIDL, { agent: await getCachedAgent(), canisterId: params.sell })
  const tr = (await tokenActor.icrc1_transfer({
    to: { owner: depositAccount.owner, subaccount: depositAccount.subaccount },
    amount: params.amountIn,
    fee: [], memo: [], from_subaccount: [], created_at_time: [],
  })) as any
  if ('Err' in tr) throw new Error('Neutrinite deposit failed: ' + safeStringify(tr.Err))

  // 3. Wait for the pylon's indexer to credit the virtual balance. The pylon
  // credits slightly LESS than the deposited amount (it nets a ledger fee), so
  // we wait for ANY increase over the prior balance and then swap exactly what
  // was credited — never the raw amountIn (which would over-quote and could
  // exceed the virtual balance).
  params.onStep?.('Confirming deposit…')
  let creditedDelta = 0n
  const started = Date.now()
  for (let i = 0; i < CREDIT_POLL_TRIES && (Date.now() - started) < CREDIT_POLL_DEADLINE_MS; i++) {
    await new Promise(r => setTimeout(r, CREDIT_POLL_INTERVAL_MS))
    try {
      // Bound the (idempotent) poll query so one hung connection can't stall the
      // whole loop indefinitely — on timeout we simply poll again next tick.
      const accts = (await withTimeout(pylon.icrc55_accounts({ owner, subaccount: [] }), 5000, 'pylon-accounts')) as any[]
      const ep = findEndpoint(accts, params.sell)
      if (ep && ep.balance > balanceBefore) { creditedDelta = ep.balance - balanceBefore; break }
    } catch { /* keep polling */ }
    params.onStep?.(`Confirming deposit… (${Math.round((Date.now() - started) / 1000)}s)`)
  }
  if (creditedDelta <= 0n) throw new Error('Neutrinite: deposit not credited in time (recoverable via sweep)')

  // 4. Swap exactly the credited amount (synchronous, slippage-protected). Scale
  // the slippage floor down to the credited amount so a fee-trimmed deposit
  // doesn't trip min_amount_out.
  params.onStep?.('Swapping…')
  const swapMinOut = params.amountIn > 0n ? (params.minAmountOut * creditedDelta) / params.amountIn : params.minAmountOut
  const sw = (await pylon.dex_swap({
    account: userAccount,
    amount: creditedDelta,
    ledger_from: ledgerVar(params.sell),
    ledger_to: ledgerVar(params.buy),
    min_amount_out: swapMinOut,
  })) as any
  if (!('ok' in sw)) throw new Error('Neutrinite swap failed: ' + safeStringify(sw.err))
  const amountOut = sw.ok.amount_out as bigint

  // 5. Withdraw the output back to the user's wallet.
  params.onStep?.('Withdrawing…')
  const cmd = (await pylon.icrc55_command({
    commands: [{
      transfer: {
        amount: amountOut,
        from: { account: userAccount },
        ledger: ledgerVar(params.buy),
        memo: [],
        to: { external_account: { ic: userAccount } },
      },
    }],
    controller: { owner, subaccount: [] },
    expire_at: [], request_id: [], signature: [],
  })) as any
  if (!('ok' in cmd)) throw new Error('Neutrinite withdraw failed: ' + safeStringify(cmd.err))

  removePendingSwap(params.sell, params.buy)
  return { amountOut }
}

/**
 * Recover any stranded virtual balance for a pair back to the user's wallet.
 * Safe to call anytime. Returns true if it actually withdrew something.
 *
 * NOTE: does NOT clear the pending marker — the caller clears it only when a
 * withdraw succeeded, so a deposit that hasn't credited YET (sweep finds 0) keeps
 * its marker and stays visible on the Recover page once it does credit.
 */
export async function sweep(sell: string, buy: string): Promise<boolean> {
  const identity = await getCachedIdentity()
  const owner = identity.getPrincipal()
  if (owner.isAnonymous()) throw new Error('Not authenticated')
  const userAccount = { owner, subaccount: [] as [] }
  const pylon = await authedPylon()
  const accounts = (await pylon.icrc55_accounts({ owner, subaccount: [] })) as any[]
  let recovered = false
  for (const tok of [sell, buy]) {
    const ep = findEndpoint(accounts, tok)
    if (ep && ep.balance > 0n) {
      try {
        const res = (await pylon.icrc55_command({
          commands: [{
            transfer: {
              amount: ep.balance,
              from: { account: userAccount },
              ledger: ledgerVar(tok),
              memo: [],
              to: { external_account: { ic: userAccount } },
            },
          }],
          controller: { owner, subaccount: [] },
          expire_at: [], request_id: [], signature: [],
        })) as any
        if ('ok' in res) recovered = true
      } catch (e) {
        console.error('[neutrinite.sweep] withdraw failed for', tok, e)
      }
    }
  }
  return recovered
}
