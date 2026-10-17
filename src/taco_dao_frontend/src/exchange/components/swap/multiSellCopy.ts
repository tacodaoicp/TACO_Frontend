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
      if (l.reason === 'neuHeld') return `${label}: not sent because it still holds some ${sym} from another swap of yours. This part stayed in your wallet. The Recover page can send that back.`
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
      // some or all of the ICP may already be in the wallet (a lost withdraw answer, or only part came
      // back from a look): the wallet comes first
      if (l.outMaybeSent) return `${subject} sold this part. The ICP may already be in your wallet, check it before using the Recover page.`
      return l.failedAfterSwap
        ? `${subject} sold this part but could not send the ICP to your wallet.`
        : `${subject} stopped after the deposit and the automatic refund did not go through.`
    default: return ''
  }
}

/** Refunds and recovery list: what the user should do about one leg that needs recovery. */
export function recoverWhere(l: LegRun): string {
  if (l.state === 'tracked' || l.reason === 'maySent') return 'Use the Recover page.'
  if (l.reason === 'unconfirmed') return 'May be back already. Check your wallet first.'
  if (l.reason === 'admin') return 'Outcome unknown. Do not repeat the sale.'
  if (l.reason === 'tacoPaused') return 'Safe on the TACO exchange. Recover when it is back.'
  if (l.reason === 'rateLimited') return 'Recover in a few minutes.'
  if (l.outMaybeSent) return 'May be in your wallet already. Check it before using the Recover page.'
  if (l.failedAfterSwap) return 'Not sent yet. Use the Recover page.'
  return 'Not refunded yet. Use the Recover page.'
}

export { formatTokenAmount }
