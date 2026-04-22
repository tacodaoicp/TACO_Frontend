/**
 * Error message mapping and classification for the exchange canister.
 * Based on Section 20 of FRONTEND_DEV_GUIDE.md.
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'success'

export interface ExchangeError {
  severity: ErrorSeverity
  title: string
  message: string
  recoverable: boolean
  action?: 'wait' | 'recover' | 'retry' | 'none'
  waitSeconds?: number
}

/**
 * Classify a raw result string from an exchange canister call.
 * Returns null if the result represents success.
 */
export function classifyResult(result: string, operation: string): ExchangeError | null {
  // Success cases
  if (result === 'done') return null
  if (result === 'Trade completed successfully') return null
  if (result.startsWith('done:')) return null
  if (result.startsWith('Revoked')) return null
  if (result.startsWith('Liquidity removed successfully')) return null
  if (result === 'DAO revoke complete') return null
  // addLiquidity success returns LP token amount as a number string
  if (/^\d+$/.test(result) && operation === 'addLiquidity') return null
  // addPosition success returns an access code for resting orders
  if (result.length >= 32 && operation === 'addPosition') return null

  return classifyError(result)
}

/**
 * Classify an error string into a user-friendly error object.
 */
export function classifyError(msg: string): ExchangeError {
  if (!msg || msg === '') {
    return {
      severity: 'warning',
      title: 'Rate Limited',
      message: 'Too many requests. Please wait before trying again.',
      recoverable: true,
      action: 'wait',
      waitSeconds: 90,
    }
  }

  if (msg === 'You are not allowed to perform this action' || msg === 'Not allowed') {
    return {
      severity: 'warning',
      title: 'Action Blocked',
      message: 'You may be rate-limited or temporarily restricted. Wait 90 seconds and try again.',
      recoverable: true,
      action: 'wait',
      waitSeconds: 90,
    }
  }

  if (msg.startsWith('Banned for a day')) {
    return {
      severity: 'error',
      title: 'Temporarily Banned',
      message: 'A text field exceeded the character limit. You are banned for 24 hours.',
      recoverable: true,
      action: 'wait',
      waitSeconds: 86400,
    }
  }

  if (msg.includes('not added') || msg.includes('cant be traded')) {
    return {
      severity: 'error',
      title: 'Token Not Supported',
      message: 'This token is not accepted for trading on the exchange.',
      recoverable: false,
      action: 'none',
    }
  }

  if (msg.includes('paused')) {
    return {
      severity: 'warning',
      title: 'Token Paused',
      message: 'One or more tokens in this trade are currently paused. Try again later.',
      recoverable: true,
      action: 'wait',
    }
  }

  if (msg.includes('amount too low') || msg === 'Init or sell amount too low') {
    return {
      severity: 'error',
      title: 'Amount Too Low',
      message: 'The trade amount is below the minimum required. Please increase the amount.',
      recoverable: false,
      action: 'none',
    }
  }

  if (msg.includes('not received') || msg === 'Failed as something was not received') {
    return {
      severity: 'error',
      title: 'Deposit Not Found',
      message: 'The deposit could not be verified. Check the block number and verify the deposit reached the treasury. Use "Recover Funds" if tokens were deducted.',
      recoverable: true,
      action: 'recover',
    }
  }

  if (msg.includes('no longer exists') || msg === 'Trade no longer exists or is edited') {
    return {
      severity: 'warning',
      title: 'Order Changed',
      message: 'This order was cancelled, filled, or expired. Your deposit can be recovered via the "Recover Funds" tool.',
      recoverable: true,
      action: 'recover',
    }
  }

  if (msg.includes('No orders were left')) {
    return {
      severity: 'info',
      title: 'Orders Already Filled',
      message: 'All orders in the batch were already filled. Your deposit has been refunded.',
      recoverable: true,
      action: 'none',
    }
  }

  if (msg.includes('Invalid route')) {
    return {
      severity: 'error',
      title: 'Invalid Route',
      message: 'The swap route is invalid (must be 2-3 hops). Please try a different route.',
      recoverable: false,
      action: 'none',
    }
  }

  if (msg.includes('Route mismatch') || msg.includes('Route broken')) {
    return {
      severity: 'error',
      title: 'Route Error',
      message: 'The swap route does not connect properly. Refresh and try again.',
      recoverable: false,
      action: 'retry',
    }
  }

  if (msg.includes('No pool exists')) {
    return {
      severity: 'error',
      title: 'No Liquidity Pool',
      message: 'No AMM pool exists for this token pair.',
      recoverable: false,
      action: 'none',
    }
  }

  if (msg.includes('Slippage pre-check failed')) {
    return {
      severity: 'warning',
      title: 'Slippage Exceeded',
      message: 'The swap was cancelled because the price moved beyond your slippage tolerance. Your tokens have been returned. Consider increasing slippage.',
      recoverable: true,
      action: 'retry',
    }
  }

  if (msg.includes('slippage exceeded but swap executed')) {
    return {
      severity: 'warning',
      title: 'Slippage Warning',
      message: 'The swap completed but slippage exceeded your setting. Check the received amount.',
      recoverable: false,
      action: 'none',
    }
  }

  if (msg.includes('Multi-hop failed at hop')) {
    return {
      severity: 'error',
      title: 'Multi-Hop Failed',
      message: 'The swap failed at an intermediate step due to insufficient liquidity.',
      recoverable: true,
      action: 'recover',
    }
  }

  if (msg.includes('has no liquidity')) {
    return {
      severity: 'error',
      title: 'No Liquidity',
      message: 'You have no liquidity in this pool.',
      recoverable: false,
      action: 'none',
    }
  }

  if (msg.includes('Pool does not exist')) {
    return {
      severity: 'error',
      title: 'Pool Not Found',
      message: 'This liquidity pool does not exist.',
      recoverable: false,
      action: 'none',
    }
  }

  // Generic fallback
  return {
    severity: 'error',
    title: 'Unexpected Error',
    message: `An error occurred: "${msg}". Your funds are safe. Try again in a few minutes. If a deposit was made, use "Recover Funds."`,
    recoverable: false,
    action: 'none',
  }
}

/**
 * Raw @dfinity/agent / boundary-node transport error signatures. These come
 * through as thrown JS Errors, not typed Candid Err variants, so they bypass
 * classifyExchangeError entirely. Detect them so callers can decide whether
 * to probe for a real outcome rather than blame the user.
 */
const TRANSPORT_SIGNATURES = [
  '<html',
  'Invalid header bytes',
  'Call was refused',
  'Internal Server Error',
  'Failed to fetch',
  'Request timeout',
  'IC0',
]

export function isTransportError(err: any): boolean {
  const msg = err?.message ?? (typeof err === 'string' ? err : '')
  return typeof msg === 'string' && TRANSPORT_SIGNATURES.some(s => msg.includes(s))
}

export type VerifyStatus = 'succeeded' | 'partial' | 'failed' | 'unknown'

/**
 * Poll a caller-supplied probe until it returns a conclusive status, or give
 * up and return 'unknown'. Used after a transport error to decide whether
 * the mutation actually landed — answer drives the toast shown to the user
 * and whether we should attempt a recovery transfer.
 */
export async function verifyAfterTransportError(
  probe: () => Promise<VerifyStatus>,
  attempts = 3,
  delayMs = 1500,
): Promise<VerifyStatus> {
  for (let i = 0; i < attempts; i++) {
    try {
      const s = await probe()
      if (s !== 'unknown') return s
    } catch { /* probe threw; retry */ }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs))
  }
  return 'unknown'
}

/**
 * Messages for which the backend auto-refunds deposited tokens via its
 * transfer queue. The frontend must not send users to /recover for these —
 * the blocks are already marked BlocksDone on the backend.
 */
const AUTO_REFUND_MESSAGES = [
  'Use addLiquidity for full-range positions',
  'Invalid price range',
  'Amounts below minimum liquidity for new pool (pre-check)',
  'Amounts below minimum liquidity for new pool',
  'Amounts below minimum liquidity for pool recreation',
]

/**
 * True when the backend error indicates tokens are being auto-refunded.
 * Callers should clear local deposit caches and show a "being refunded
 * automatically" message rather than the generic recovery flow.
 */
export function isAutoRefundError(err: any): boolean {
  const msg = err?.InvalidInput ?? err?.InsufficientFunds
  if (typeof msg !== 'string') return false
  return AUTO_REFUND_MESSAGES.some(m => msg.includes(m))
}

/**
 * Optional context passed to classifyExchangeError so error text can render
 * in human units (SlippageExceeded) and with symbolic hop names (RouteFailed).
 * All fields optional — callers without this context (LP / OTC / admin) get
 * graceful fallbacks.
 */
export interface ClassifyContext {
  outDecimals?: number
  outSymbol?: string
  hopTokens?: Array<{ symbol: string }>
}

/** Render a nat in smallest units as a human-friendly decimal string. */
function fmtAmount(raw: bigint, decimals: number): string {
  if (decimals <= 0) return raw.toString()
  const base = 10n ** BigInt(decimals)
  const whole = raw / base
  const frac = raw % base
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '')
  return fracStr ? `${whole}.${fracStr}` : whole.toString()
}

/**
 * Classify a backend ExchangeError variant (typed Result Err payload)
 * into a user-friendly ExchangeError object. Never shows raw Candid payloads
 * to the user — always logs them to console.debug for developer diagnostics.
 */
export function classifyExchangeError(err: any, ctx: ClassifyContext = {}): ExchangeError {
  try { console.debug('[ExchangeError raw]', err) } catch { /* ignore */ }

  if ('NotAuthorized' in err) return { severity: 'warning', title: 'Not Authorized', message: 'Not authorized.', recoverable: false, action: 'none' }
  if ('Banned' in err) return { severity: 'error', title: 'Temporarily Banned', message: 'You have been temporarily banned.', recoverable: true, action: 'wait', waitSeconds: 86400 }
  if ('ExchangeFrozen' in err) return { severity: 'error', title: 'Exchange Frozen', message: 'The exchange is currently frozen.', recoverable: true, action: 'wait' }
  if ('InvalidInput' in err) return { severity: 'error', title: 'Invalid Input', message: err.InvalidInput, recoverable: false, action: 'none' }
  if ('TokenNotAccepted' in err) return { severity: 'error', title: 'Token Not Supported', message: err.TokenNotAccepted, recoverable: false, action: 'none' }
  if ('TokenPaused' in err) return { severity: 'warning', title: 'Token Paused', message: `Token is currently paused: ${err.TokenPaused}`, recoverable: true, action: 'wait' }
  if ('InsufficientFunds' in err) return { severity: 'error', title: 'Insufficient Funds', message: err.InsufficientFunds, recoverable: true, action: 'recover' }
  if ('PoolNotFound' in err) return { severity: 'error', title: 'Pool Not Found', message: 'No liquidity pool available for this pair.', recoverable: false, action: 'none' }
  if ('OrderNotFound' in err) return { severity: 'warning', title: 'Order Not Found', message: 'Order not found.', recoverable: false, action: 'none' }
  if ('TransferFailed' in err) return { severity: 'error', title: 'Transfer Failed', message: `Transfer failed: ${err.TransferFailed}`, recoverable: true, action: 'recover' }
  if ('SystemError' in err) return { severity: 'error', title: 'System Error', message: `Exchange error: ${err.SystemError}. Please try again.`, recoverable: false, action: 'none' }

  if ('SlippageExceeded' in err) {
    const dec = ctx.outDecimals ?? 8
    const sym = ctx.outSymbol ?? ''
    const expectedHuman = fmtAmount(BigInt(err.SlippageExceeded.expected), dec)
    const gotHuman = fmtAmount(BigInt(err.SlippageExceeded.got), dec)
    const symSuffix = sym ? ` ${sym}` : ''
    return {
      severity: 'warning',
      title: 'Slippage Exceeded',
      message: `Market moved — you would receive ${gotHuman}${symSuffix}, below your minimum ${expectedHuman}${symSuffix}. Try a smaller amount or higher slippage tolerance.`,
      recoverable: true,
      action: 'retry',
    }
  }

  if ('RouteFailed' in err) {
    const hop = Number(err.RouteFailed.hop)
    const hopCtx = ctx.hopTokens?.[hop]
    const where = hopCtx ? `the ${hopCtx.symbol} leg` : `hop ${hop}`
    return {
      severity: 'error',
      title: 'Route Failed',
      message: `Route failed at ${where}: ${err.RouteFailed.reason}`,
      recoverable: true,
      action: 'recover',
    }
  }

  // Unknown variant — never JSON.stringify to the user. The raw payload is
  // already in console.debug above for developer debugging.
  return {
    severity: 'error',
    title: 'Unexpected Error',
    message: "The exchange returned an error we don't recognize. Please try again; the dev console has details.",
    recoverable: false,
    action: 'none',
  }
}

/**
 * Classify a raw thrown error (agent transport / canister reject / timeout).
 * Never shows the raw payload; always logs it to console.debug. Pair with
 * isTransportError above to decide whether to probe for actual outcome.
 */
export function classifyTransportReject(err: any): ExchangeError {
  try { console.debug('[ExchangeError transport raw]', err) } catch { /* ignore */ }
  return {
    severity: 'warning',
    title: 'Network issue',
    message: "The exchange couldn't complete this call. Please try again in a moment.",
    recoverable: true,
    action: 'retry',
  }
}

/**
 * Check if a result string from addPosition is an access code (success).
 * addPosition always returns an access code string (32+ chars) on success —
 * whether the order was filled immediately or is resting on the book.
 */
export function isRestingOrder(result: string): boolean {
  return result.length >= 32 && !result.startsWith('done:') && !result.startsWith('Warning') && !result.startsWith('Failed') && !result.startsWith('Multi-hop') && !result.startsWith('Slippage')
}

/**
 * Parse the received amount from a successful multi-hop swap result.
 * Format: "done:123456"
 */
export function parseMultiHopResult(result: string): bigint | null {
  if (!result.startsWith('done:')) return null
  try {
    return BigInt(result.split(':')[1])
  } catch {
    return null
  }
}

/**
 * Parse remove liquidity result for token amounts.
 * Format: "Liquidity removed successfully: N token0, M token1"
 */
export function parseRemoveLiquidityResult(result: string): { amount0: bigint; amount1: bigint } | null {
  const match = result.match(/(\d+)\s+\w+,\s+(\d+)\s+\w+/)
  if (!match) return null
  return {
    amount0: BigInt(match[1]),
    amount1: BigInt(match[2]),
  }
}
