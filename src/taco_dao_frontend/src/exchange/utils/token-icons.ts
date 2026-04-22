/**
 * Token icon lookup — reuses the DAO app's TokenData icon mapping
 */
import { tokenImages } from '../../components/data/TokenData'

/**
 * Get token icon URL by symbol or name.
 * Falls back through: exact name → symbol → uppercase symbol → null
 */
export function getTokenIcon(symbol: string, name?: string): string | null {
  if (name && tokenImages[name]) return tokenImages[name]
  if (tokenImages[symbol]) return tokenImages[symbol]
  if (tokenImages[symbol.toUpperCase()]) return tokenImages[symbol.toUpperCase()]
  // Try common variations
  if (tokenImages[symbol.toLowerCase()]) return tokenImages[symbol.toLowerCase()]
  return null
}
