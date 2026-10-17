/**
 * Sell many user facing text (plan section 8): plain words, no hyphens or dashes
 * as punctuation, real plurals. TACO is a token and an exchange: chips say TACO,
 * sentences call the venue the TACO exchange.
 */
import { formatTokenAmount } from '../../utils/format'
import { joinNames } from '../../utils/multiSellPlanner'
import type { PoolNote, BatchPlan } from '../../utils/multiSellPlanner'
import type { StopReason } from '../../utils/multiSellRunner'
import type { LegRun } from '../../utils/multiSellRunner'
import type { CrossDexVenue } from '../../utils/crossDexOptimizer'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
/** The DEX name on chips and split bars. */
export const dexName = (d: CrossDexVenue) => (d === 'icpswap' ? 'ICPSwap' : d === 'neutrinite' ? 'Neutrinite' : 'TACO')
/** The DEX as a line label ("TACO exchange: sold 3,082 TACO for 23 ICP"). */
export const venueLabel = (d: CrossDexVenue) => (d === 'taco' ? 'TACO exchange' : dexName(d))
/** The DEX inside a sentence ("on the TACO exchange"). */
export const venueIn = (d: CrossDexVenue) => (d === 'taco' ? 'the TACO exchange' : dexName(d))
/** The DEX at the start of a sentence. */
export const venueSubject = (d: CrossDexVenue) => (d === 'taco' ? 'The TACO exchange' : dexName(d))

/** A dollar value in the picker, the card and the result: 2 decimals from a cent up, "< $0.01"
 *  below a cent, nothing when unknown or zero. */
export function usdCell(v: number): string {
  if (!(v > 0) || !Number.isFinite(v)) return ''
  if (v < 0.01) return '< $0.01'
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
/** An estimate in dollars: "≈ $0.70", or "< $0.01" alone. */
export function aboutUsd(v: number): string {
  const s = usdCell(v)
  return s && !s.startsWith('<') ? `≈ ${s}` : s
}

/** An ICP amount for a sentence: 2 decimals, 4 when small. */
export function aboutIcp(v: bigint, icp: TokenInfo): string {
  const n = Number(v) / 10 ** Number(icp.decimals)
  return n >= 0.01 ? n.toFixed(2) : n.toFixed(4)
}

/** Names for a sentence: all of them up to 3, else the first two and how many more. */
export function someNames(names: string[]): string {
  return names.length <= 3 ? joinNames(names) : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

export function poolNoteText(note: PoolNote, icp: TokenInfo): string {
  const x = aboutIcp(note.lessIcp, icp)
  const [b] = note.tokens
  if (note.tokens.length === 1) {
    return note.viaNeutrinite
      ? `${b} gets about ${x} ICP less than when sold alone, because Neutrinite takes one token per sale and ${note.causes[0]} uses it. You can take ${b} out and sell it afterwards.`
      : `${b} gets about ${x} ICP less than when sold alone, because ${note.causes[0]} is sold through the same pools on the TACO exchange. You can take ${b} out and sell it afterwards.`
  }
  return `${someNames(note.tokens)} get about ${x} ICP less in total than when sold alone, because other tokens in this sale use the same pools on the TACO exchange. You can take them out and sell them afterwards.`
}

/** Confirm: the tokens whose part on the TACO exchange waits for other tokens of the sale. */
export function queueNoteText(plan: BatchPlan): string {
  const live = plan.assets.filter(a => !a.issue)
  const queued = live.filter(a => a.second && a.second.waitsFor.length > 0)
    .sort((a, b) => (a.second!.place ?? 1) - (b.second!.place ?? 1))
  if (queued.length === 0) return ''
  const after = (a: typeof queued[number]) => joinNames(a.second!.waitsFor.map(w => live.find(x => x.address === w)?.symbol ?? '').filter(Boolean))
  if (queued.length === 1) {
    return `${queued[0].symbol} sells its part on the TACO exchange right after ${after(queued[0])}, because they share pools there.`
  }
  return `${someNames(queued.map(a => a.symbol))} sell their parts on the TACO exchange right after the tokens they share pools with.`
}

/** Why a sale stopped before anything was sold: one sentence (the sheet adds that the tokens stayed). */
export function stopText(stop: StopReason | undefined, sym: string, waitSec: number): string {
  switch (stop) {
    case 'busy': return 'Another sale or recovery is running in this browser, so this one did not start.'
    case 'storage': return 'Your browser is not saving data, so the sale cannot keep its recovery notes.'
    case 'sessionEndsSoon': return 'Your session ends soon. Please reconnect your wallet, then try again.'
    case 'notAuthenticated': return 'Your session expired. Please reconnect your wallet.'
    case 'walletChanged': return 'Your wallet changed in another tab.'
    case 'readFailed': return 'Could not read your balances. Check your connection and try again.'
    case 'balanceChanged': return `Your ${sym} balance changed. Check the amount and try again.`
    case 'ledgerFee': return `The ${sym} network fee changed. Check the new amounts and try again.`
    case 'budget': return waitSec > 0
      ? `The TACO exchange takes only a few trades per wallet every 90 seconds. Wait ${waitSec} s and try again.`
      : 'The TACO exchange takes only a few trades per wallet every 90 seconds. You can try again now.'
    // an approval whose answer was lost may still land: never say it was not sent
    case 'approval': return `The ${sym} approval for the TACO exchange could not be confirmed, so the sale did not start.`
    case 'unreachable': return "Can't reach the exchange right now. Try again in a minute."
    case 'frozen': return 'The exchange is paused right now. Try again when it is back.'
    case 'planInvalid': return 'Something in this sale did not add up, so it never started. Please try again.'
    default: return 'The sale stopped.'
  }
}

const shortReason = (l: LegRun): string => {
  if (l.reason === 'slippage' || /slippage|minimum/i.test(l.error ?? '')) return 'the price moved past your slippage'
  if (l.reason === 'timeout' || /too long|timed out/i.test(l.error ?? '')) return 'it took too long'
  if (/insufficient|balance/i.test(l.error ?? '')) return 'your balance was too low'
  if (l.reason === 'rateLimited') return 'the TACO exchange was busy'
  if (l.reason === 'tacoPaused') return 'the TACO exchange is paused'
  if (/did not confirm the deposit/i.test(l.error ?? '')) return 'Neutrinite did not confirm the deposit in time'
  return 'it could not finish'
}

/** The token a failed multi hop route sent back instead of the sold one ('routeHop:<ledger>'). */
export function routeHopToken(l: LegRun): string | null {
  if (typeof l.reason !== 'string' || !l.reason.startsWith('routeHop')) return null
  return l.reason.slice('routeHop:'.length)
}

/** The row detail line for one leg (plan section 8). */
export function legDetail(l: LegRun, sym: string, amountIn: string, outText: string, ownerNames: string, symbolOf: (ledger: string) => string = () => ''): string {
  const label = venueLabel(l.venue)
  const subject = venueSubject(l.venue)
  const mid = routeHopToken(l)
  if (l.state === 'refunded' && mid != null) {
    const what = mid ? symbolOf(mid) : ''
    return `The TACO exchange could not finish this route. It sent what it had swapped so far${what ? `, as ${what},` : ''} to your wallet, minus network fees.`
  }
  switch (l.state) {
    case 'done': return `${label}: sold ${amountIn} ${sym} for ${outText}.`
    case 'doneUnknown': return `${label}: sold. The exact ICP shows in your wallet.`
    case 'belowMin': return outText
      ? `${label}: sold ${amountIn} ${sym} for ${outText}, below your minimum price.`
      : `${label}: sold below your minimum price. The ICP went to your wallet.`
    case 'refunded':
      return l.refundedBy === 'exchange'
        ? `The TACO exchange could not finish this part (${shortReason(l)}) and sent the ${sym} back. It arrives in a few seconds, minus network fees.`
        : `${subject} could not finish this part (${shortReason(l)}). Its ${sym} went back to your wallet, minus network fees.`
    case 'notSent':
      if (l.reason === 'secondLate') return `${label}: not sent because ${ownerNames} took too long on the same pools. This part stayed in your wallet.`
      if (l.reason === 'secondMoved') return `${label}: the price moved before its turn, so this part stayed in your wallet.`
      if (l.reason === 'secondCheck') return `${label}: this part could not be checked before its turn, so it stayed in your wallet.`
      if (l.reason === 'journal') return `${label}: not sent because this browser could not save its recovery note. This part stayed in your wallet.`
      if (l.reason === 'rateLimited') return `${label}: not sent because it was busy for your wallet. This part stayed in your wallet.`
      if (l.reason === 'neuHeld') return `${label}: not sent because it may still hold some ${sym} from another swap of yours. This part stayed in your wallet. The Recover page can send that back.`
      if (l.reason === 'icpHeld') return `${label}: not sent because it may still hold funds from another swap of yours. This part stayed in your wallet. The Recover page can send them back.`
      return `${label}: not sent. This part stayed in your wallet.`
    case 'deferred': return 'The TACO exchange takes only a few trades per wallet every 90 seconds. The refund starts after the window.'
    case 'tracked': return 'The TACO exchange has not settled this part yet. It is listed on the Recover page.'
    case 'slow': return `${label}: taking longer than usual. It keeps going in the background.`
    case 'needsRecovery':
      if (l.reason === 'maySent') return `${label}: the deposit may have been sent, but its answer did not come back. It is listed on the Recover page.`
      if (l.reason === 'unconfirmed') return `The TACO exchange may already have returned this. Check your wallet history. If the ${sym} did not come back, try the Recover page later${l.block != null ? `, or contact support with deposit ${l.block}` : ''}.`
      if (l.reason === 'admin') return `The TACO exchange could not confirm this part. Do not repeat this sale. Open the Recover page${l.block != null ? `, or contact support with deposit ${l.block}` : ''}.`
      if (l.reason === 'tacoPaused') return 'The TACO exchange is paused right now. Your deposit is safe there. Use the Recover page when it is back.'
      if (l.reason === 'rateLimited') return 'The TACO exchange is busy for your wallet. Use the Recover page in a few minutes.'
      if (l.reason === 'neuMismatch') return `${label}: not swapped, because the amount it received did not match this part. Check your wallet first. ${NOT_IN_WALLET}`
      // the swap's own answer was lost: it may not have sold, and whatever it sold or kept may be back
      if (l.outMaybeSent && l.saleUnsure) return `${subject} may not have sold this part. Check your wallet first. ${NOT_IN_WALLET}`
      // some or all of the ICP may already be in the wallet (a lost withdraw answer, or only part came
      // back from a look): the wallet comes first
      if (l.outMaybeSent) return `${subject} sold this part. The ICP may already be in your wallet. Check it before using the Recover page.`
      return l.failedAfterSwap
        ? `${subject} sold this part but could not send the ICP to your wallet.`
        : `${subject} stopped after the deposit and the automatic refund did not go through.`
    default: return ''
  }
}

/** How a part (or route) that needs the Recover page may already be settled in the wallet, so the wallet
 *  comes first:
 *   'icp'   its swap sold, and its ICP may already be in the wallet (a lost withdraw answer, or a look brought
 *           back only part of it)
 *   'sale'  its swap's own answer was lost: it may not have sold, and what it sold or kept may be back
 *   'back'  Neutrinite received a different amount and did not swap; one look sent the wallet's balance home
 *  null for any other part. */
export type UnsureKind = 'icp' | 'sale' | 'back'
type UnsureLeg = { state: string; outMaybeSent?: boolean; saleUnsure?: boolean; reason?: string }
export function unsureKind(l: UnsureLeg): UnsureKind | null {
  if (l.state !== 'needsRecovery') return null
  if (l.reason === 'neuMismatch') return 'back'
  if (!l.outMaybeSent) return null
  return l.saleUnsure ? 'sale' : 'icp'
}
/** A part that needs the Recover page while its funds may already be in the wallet (any unsure kind). */
export const maybeSentLeg = (l: UnsureLeg) => unsureKind(l) != null
/** Every part that needs the Recover page may already be settled in the wallet: the wallet comes first. */
export function onlyMaybeSent(legs: ReadonlyArray<UnsureLeg>): boolean {
  const rec = legs.filter(l => l.state === 'needsRecovery' || l.state === 'tracked')
  return rec.length > 0 && rec.every(maybeSentLeg)
}
/** How many parts of each unsure kind. */
export function unsureKinds(legs: ReadonlyArray<UnsureLeg>): Record<UnsureKind, number> {
  const k: Record<UnsureKind, number> = { icp: 0, sale: 0, back: 0 }
  for (const l of legs) { const u = unsureKind(l); if (u) k[u]++ }
  return k
}
/** The sheet's title and the toast title when a part may already be settled in the wallet. */
export const CHECK_WALLET = 'Check your wallet'
/** Where funds that are not in the wallet are: one wording for every note, summary and toast. */
export const NOT_IN_WALLET = 'Anything not in your wallet is on the Recover page.'
/** The closing note (and toast line) when every part that needs the Recover page may already be in
 *  the wallet. */
export const CHECK_WALLET_NOTE = `Check your wallet first. ${NOT_IN_WALLET}`
/** The same closing note when the session expired during the sale (one note, the wallet first). */
export const CHECK_WALLET_SESSION_NOTE = 'Check your wallet first. Reconnect, then open the Recover page for anything not in your wallet.'
/** A part or route that sold while its output may already be in the wallet: the sale is sure, only
 *  where its output is is not. `whole`: the swap had one route; `also`: other routes sold for sure. */
export function soldMaybeInWallet(n: number, sym: string, opts: { noun?: 'route' | 'part'; whole?: boolean; also?: boolean; others?: string } = {}): string {
  const noun = opts.noun ?? 'route'
  if (opts.whole) return `The swap sold, and its ${sym} may already be in your wallet.`
  if (opts.also) return n === 1 ? `${opts.others ?? `Another ${noun}`} sold too, and its ${sym} may already be in your wallet.` : `${opts.others ?? `Other ${noun}s`} sold too, and their ${sym} may already be in your wallet.`
  return n === 1 ? `A ${noun} sold, and its ${sym} may already be in your wallet.` : `Some ${noun}s sold, and their ${sym} may already be in your wallet.`
}
/** A part or route whose swap's own answer was lost: it may not have sold (never "it sold"). */
export function maybeNotSold(n: number, opts: { noun?: 'route' | 'part'; whole?: boolean; also?: boolean; others?: string } = {}): string {
  const noun = opts.noun ?? 'route'
  if (opts.whole) return 'The swap may not have sold.'
  if (opts.also) return `${opts.others ?? (n === 1 ? `Another ${noun}` : `Other ${noun}s`)} may not have sold.`
  return n === 1 ? `A ${noun} may not have sold.` : `Some ${noun}s may not have sold.`
}
/** Neutrinite received a different amount and did not swap: the tokens may already be back. */
export function notSwappedMaybeBack(n: number, opts: { noun?: 'route' | 'part'; whole?: boolean; also?: boolean; others?: string } = {}): string {
  const noun = opts.noun ?? 'route'
  if (opts.whole) return 'Neutrinite did not swap, and your tokens may already be back in your wallet.'
  if (opts.also) return n === 1 ? `${opts.others ?? `Another ${noun}`} was not swapped, and its tokens may already be back in your wallet.` : `${opts.others ?? `Other ${noun}s`} were not swapped, and their tokens may already be back in your wallet.`
  return n === 1 ? `A ${noun} was not swapped, and its tokens may already be back in your wallet.` : `Some ${noun}s were not swapped, and their tokens may already be back in your wallet.`
}
/** The other routes or parts, named when they are all of one kind: "the other route" (2), "the third route"
 *  (3 with 2 confirmed), "the other two routes"; else "another route" or "other routes". */
function othersName(n: number, noun: string, total?: number, confirmed?: number): string | undefined {
  if (total == null || confirmed == null || n !== total - confirmed) return undefined
  if (n === 1) return total === 2 ? `The other ${noun}` : total === 3 ? `The third ${noun}` : `The last ${noun}`
  return n === 2 ? `The other two ${noun}s` : `The other ${noun}s`
}
/** The sentences for every part or route that may already be settled in the wallet, by kind. `also`: other
 *  parts or routes are confirmed (`total` and `confirmed` name the rest when one kind covers it). */
export function unsureText(kinds: Record<UnsureKind, number>, sym: string, opts: { noun?: 'route' | 'part'; whole?: boolean; also?: boolean; total?: number; confirmed?: number } = {}): string {
  const kindsUsed = (Object.keys(kinds) as UnsureKind[]).filter(k => kinds[k] > 0)
  const name = (n: number) => (kindsUsed.length === 1 ? othersName(n, opts.noun ?? 'route', opts.total, opts.confirmed) : undefined)
  const o = (n: number) => ({ noun: opts.noun, whole: opts.whole && kindsUsed.length === 1 && n === 1, also: opts.also, others: opts.also ? name(n) : undefined })
  const out: string[] = []
  if (kinds.icp) out.push(soldMaybeInWallet(kinds.icp, sym, o(kinds.icp)))
  if (kinds.sale) out.push(maybeNotSold(kinds.sale, o(kinds.sale)))
  if (kinds.back) out.push(notSwappedMaybeBack(kinds.back, o(kinds.back)))
  return out.join(' ')
}
/** "2 of 3 routes are confirmed." */
export function confirmedText(confirmed: number, total: number, noun: 'route' | 'token' = 'route'): string {
  return `${confirmed} of ${plural(total, noun, `${noun}s`)} ${confirmed === 1 ? 'is' : 'are'} confirmed.`
}
/** The single swap summary when a route that failed may already be settled in the wallet.
 *  received: what the routes that sold for sure brought (a partial fill); routes: how many the swap had;
 *  confirmed: how many sold for sure; kinds: the unsure routes by kind. */
export function swapMaybeSentSummary(opts: { received?: string; sym: string; routes: number; confirmed?: number; kinds: Record<UnsureKind, number> }): string {
  const lead = opts.received != null
    ? `Received ${opts.received} so far. ${unsureText(opts.kinds, opts.sym, { also: true, total: opts.routes, confirmed: opts.confirmed })}`
    : unsureText(opts.kinds, opts.sym, { whole: opts.routes === 1 })
  return `${lead} Check your wallet before you swap again. ${NOT_IN_WALLET}`
}

/** Refunds and recovery list: what the user should do about one leg that needs recovery. */
export function recoverWhere(l: LegRun): string {
  if (l.state === 'tracked' || l.reason === 'maySent') return 'Use the Recover page.'
  if (l.reason === 'unconfirmed') return 'May be back already. Check your wallet first.'
  if (l.reason === 'admin') return 'Outcome unknown. Do not repeat the sale.'
  if (l.reason === 'tacoPaused') return 'Safe on the TACO exchange. Recover when it is back.'
  if (l.reason === 'rateLimited') return 'Recover in a few minutes.'
  // Neutrinite sent the wallet's balance home in one look: the wallet first
  if (l.reason === 'neuMismatch') return 'May already be in your wallet. Check it before using the Recover page.'
  if (l.outMaybeSent && l.saleUnsure) return 'May not have sold. Check your wallet before using the Recover page.'
  if (l.outMaybeSent) return 'May already be in your wallet. Check it before using the Recover page.'
  if (l.failedAfterSwap) return 'Not sent yet. Use the Recover page.'
  return 'Not refunded yet. Use the Recover page.'
}

export { formatTokenAmount }
