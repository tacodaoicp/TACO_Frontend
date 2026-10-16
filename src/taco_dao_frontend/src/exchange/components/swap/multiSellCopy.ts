/**
 * Sell many user facing text (plan section 8): plain words, no hyphens or dashes
 * as punctuation, real plurals.
 */
import { formatTokenAmount } from '../../utils/format'
import { joinNames } from '../../utils/multiSellPlanner'
import type { PoolNote } from '../../utils/multiSellPlanner'
import type { StopReason } from '../../utils/multiSellRunner'
import type { LegRun } from '../../utils/multiSellRunner'
import type { CrossDexVenue } from '../../utils/crossDexOptimizer'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
export const dexName = (d: CrossDexVenue) => (d === 'icpswap' ? 'ICPSwap' : d === 'neutrinite' ? 'Neutrinite' : 'TACO')

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
      : `${b} gets about ${x} ICP less than when sold alone, because ${note.causes[0]} uses the same TACO pools. You can take ${b} out and sell it afterwards.`
  }
  return `${someNames(note.tokens)} get about ${x} ICP less in total than when sold alone, because other tokens in this sale use the same TACO pools. You can take them out and sell them afterwards.`
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
    case 'budget': return `TACO takes only a few trades per wallet every 90 seconds. Wait ${Math.max(1, waitSec)} s and try again.`
    case 'approval': return sym === 'TACO'
      ? 'The TACO approval for the TACO exchange did not go through.'
      : `The ${sym} approval for TACO did not go through.`
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
  if (l.reason === 'rateLimited') return 'TACO was busy'
  if (l.reason === 'tacoPaused') return 'TACO is paused'
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
  const dex = dexName(l.venue)
  const mid = routeHopToken(l)
  if (l.state === 'refunded' && mid != null) {
    const what = mid ? symbolOf(mid) : ''
    return `TACO could not finish this route. It sent what it had swapped so far${what ? `, as ${what},` : ''} to your wallet, minus network fees.`
  }
  switch (l.state) {
    case 'done': return `${dex}: sold ${amountIn} ${sym} for ${outText}.`
    case 'doneUnknown': return `${dex}: sold. The exact ICP shows in your wallet.`
    case 'belowMin': return 'TACO: sold below your minimum price. The ICP went to your wallet.'
    case 'refunded':
      return l.refundedBy === 'exchange'
        ? `TACO could not finish this part (${shortReason(l)}) and sent the ${sym} back. It arrives in a few seconds, minus network fees.`
        : `${dex} could not finish this part (${shortReason(l)}). Its ${sym} went back to your wallet, minus network fees.`
    case 'notSent':
      if (l.reason === 'secondLate') return `TACO: not sent because ${ownerNames} took too long on the same pools. This part stayed in your wallet.`
      if (l.reason === 'secondMoved') return 'TACO: the price moved before its turn, so this part stayed in your wallet.'
      if (l.reason === 'secondCheck') return 'TACO: this part could not be checked before its turn, so it stayed in your wallet.'
      if (l.reason === 'journal') return `${dex}: not sent because this browser could not save its recovery note. This part stayed in your wallet.`
      if (l.reason === 'rateLimited') return 'TACO: not sent because TACO was busy for your wallet. This part stayed in your wallet.'
      return `${dex}: not sent. This part stayed in your wallet.`
    case 'deferred': return 'TACO takes only a few trades per wallet every 90 seconds. The refund starts after the window.'
    case 'tracked': return 'TACO has not settled this part yet. It is listed on the Recover page.'
    case 'slow': return `${dex}: taking longer than usual. It keeps going in the background.`
    case 'needsRecovery':
      if (l.reason === 'maySent') return 'TACO: the deposit may have been sent, but its answer did not come back. It is listed on the Recover page.'
      if (l.reason === 'unconfirmed') return `TACO may already have returned this. Check your wallet history. If the ${sym} did not come back, try the Recover page later${l.block != null ? `, or contact support with deposit ${l.block}` : ''}.`
      if (l.reason === 'admin') return `TACO could not confirm this part. Do not repeat this sale. Open the Recover page${l.block != null ? `, or contact support with deposit ${l.block}` : ''}.`
      if (l.reason === 'tacoPaused') return 'TACO is paused right now. Your deposit is safe there. Use the Recover page when it is back.'
      if (l.reason === 'rateLimited') return 'TACO is busy for your wallet. Use the Recover page in a few minutes.'
      return l.failedAfterSwap
        ? `${dex} sold this part but could not send the ICP to your wallet.`
        : `${dex} stopped after the deposit and the automatic refund did not go through.`
    default: return ''
  }
}

export { formatTokenAmount }
