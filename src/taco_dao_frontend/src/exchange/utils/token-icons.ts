/**
 * Token icon lookup — reuses the DAO app's TokenData icon mapping, with the
 * ledger's own icrc1_metadata logo (cached in localStorage) as fallback for
 * tokens we ship no image for (new ckERC20s etc).
 */
import { ref } from 'vue'
import { tokenImages } from '../../components/data/TokenData'

/** Bumped whenever a ledger logo lands in the cache — reference it in a
 *  computed to re-render lists once lazy logos arrive. */
export const iconCacheVersion = ref(0)

const logoFetchStarted = new Set<string>()

/** Fetch missing ledger logos (icrc1_metadata "icrc1:logo") in the background. */
export function prefetchLedgerLogos(tokens: Array<{ symbol: string; name?: string; address: string }>): void {
  for (const t of tokens) {
    if (getTokenIcon(t.symbol, t.name, t.address)) continue
    if (logoFetchStarted.has(t.address)) continue
    logoFetchStarted.add(t.address)
    void (async () => {
      try {
        const [{ HttpAgent, Actor }, { getNetworkHost }, { icrcIDL }] = await Promise.all([
          import('@dfinity/agent'),
          import('../../shared/auth-cache'),
          import('../../shared/icrc-idl'),
        ])
        const agent = new HttpAgent({ host: getNetworkHost() })
        const ledger: any = Actor.createActor(icrcIDL as any, { agent, canisterId: t.address })
        const metadata: [string, any][] = await ledger.icrc1_metadata()
        const logo = metadata.find(([k]) => k === 'icrc1:logo')?.[1]
        const url = logo && 'Text' in logo ? logo.Text : ''
        if (url) {
          try { localStorage.setItem(`taco_bridge_logo:${t.address}`, url) } catch { /* quota */ }
          iconCacheVersion.value++
        }
      } catch { /* letter fallback stays */ }
    })()
  }
}

/**
 * Get token icon URL by symbol or name.
 * Falls back through: exact name → symbol → uppercase symbol → null
 */
export function getTokenIcon(symbol: string, name?: string, address?: string): string | null {
  // Register a dependency so any computed/template calling this re-renders
  // when a lazily fetched ledger logo lands in the cache.
  void iconCacheVersion.value
  if (name && tokenImages[name]) return tokenImages[name]
  if (tokenImages[symbol]) return tokenImages[symbol]
  if (tokenImages[symbol.toUpperCase()]) return tokenImages[symbol.toUpperCase()]
  // Try common variations
  if (tokenImages[symbol.toLowerCase()]) return tokenImages[symbol.toLowerCase()]
  // Ledger's own icrc1_metadata logo, cached by the bridge store (data URI)
  if (address) {
    try {
      const cached = localStorage.getItem(`taco_bridge_logo:${address}`)
      if (cached) return cached
    } catch { /* ignore */ }
  }
  return null
}
