/**
 * Shared token constants for the exchange app.
 *
 * Single source of truth for the canonical base/quote orientation: base tokens
 * (ICP and the ck-stables) are always the QUOTE side of a pair, so pairs display
 * as e.g. TACO/ICP, never ICP/TACO. Used by both the pair composable (display)
 * and the store's resolveProPair (Easy→Pro direction normalization).
 */

export const ICP_LEDGER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
export const CKUSDC_LEDGER_ID = 'xevnm-gaaaa-aaaar-qafnq-cai'
export const CKUSDT_LEDGER_ID = 'cngnf-vqaaa-aaaar-qag4q-cai'

// Tokens that act as the quote (right side) in a canonical pair.
export const BASE_TOKEN_IDS = new Set<string>([
  ICP_LEDGER_ID,   // ICP
  CKUSDC_LEDGER_ID, // ckUSDC
  CKUSDT_LEDGER_ID, // ckUSDT
])

export function isBaseToken(addr: string): boolean {
  return BASE_TOKEN_IDS.has(addr)
}
