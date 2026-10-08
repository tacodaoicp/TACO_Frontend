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

// ── Ledger logo cache ──
// Saved as {url, t} under taco_bridge_logo:<ledger>. Older builds saved the
// bare URL with no time; those still read fine and count as due for a recheck.
// A saved logo is shown right away and rechecked in the background once it is
// older than LOGO_RECHECK_MS, so a ledger's new logo eventually replaces it.
const LOGO_RECHECK_MS = 7 * 24 * 60 * 60 * 1000
const logoKey = (ledger: string) => `taco_bridge_logo:${ledger}`
const logoMemo = new Map<string, { url: string; t: number } | null>()
const logoInFlight = new Map<string, Promise<string>>()

function readLogo(ledger: string): { url: string; t: number } | null {
  if (logoMemo.has(ledger)) return logoMemo.get(ledger) ?? null
  let entry: { url: string; t: number } | null = null
  try {
    const raw = localStorage.getItem(logoKey(ledger))
    if (raw) {
      if (raw.startsWith('{')) {
        const v = JSON.parse(raw)
        if (v && typeof v.url === 'string' && v.url) entry = { url: v.url, t: Number(v.t) || 0 }
      } else {
        entry = { url: raw, t: 0 }
      }
    }
  } catch { /* ignore */ }
  logoMemo.set(ledger, entry)
  return entry
}

/** The saved ledger logo for a token, if any. */
export function cachedLedgerLogo(ledger: string): string | null {
  return readLogo(ledger)?.url || null
}

/** True when there is no saved logo or it is due for a background recheck. */
export function ledgerLogoDue(ledger: string): boolean {
  const e = readLogo(ledger)
  if (!e) return true
  const age = Date.now() - e.t
  return age < 0 || age > LOGO_RECHECK_MS
}

/**
 * Read the ledger's icrc1_metadata logo and save it. One request per ledger
 * at a time (callers share it). Resolves to the URL, or '' when the ledger
 * has none or the read failed (a failure keeps any saved logo).
 */
export function fetchLedgerLogo(ledger: string): Promise<string> {
  const pending = logoInFlight.get(ledger)
  if (pending) return pending
  const p = (async () => {
    try {
      const [{ HttpAgent, Actor }, { getNetworkHost }, { icrcIDL }] = await Promise.all([
        import('@dfinity/agent'),
        import('../../shared/auth-cache'),
        import('../../shared/icrc-idl'),
      ])
      const agent = new HttpAgent({ host: getNetworkHost() })
      const ledgerActor: any = Actor.createActor(icrcIDL as any, { agent, canisterId: ledger })
      const metadata: [string, any][] = await ledgerActor.icrc1_metadata()
      const logo = metadata.find(([k]) => k === 'icrc1:logo')?.[1]
      const url = logo && 'Text' in logo ? logo.Text : ''
      if (url) {
        const entry = { url, t: Date.now() }
        try { localStorage.setItem(logoKey(ledger), JSON.stringify(entry)) } catch { /* quota */ }
        const changed = readLogo(ledger)?.url !== url
        logoMemo.set(ledger, entry)
        if (changed) iconCacheVersion.value++
      }
      return url
    } catch {
      return ''
    } finally {
      logoInFlight.delete(ledger)
    }
  })()
  logoInFlight.set(ledger, p)
  return p
}

const logoFetchStarted = new Set<string>()

/** Fetch missing (or due for recheck) ledger logos (icrc1_metadata "icrc1:logo") in the background. */
export function prefetchLedgerLogos(tokens: Array<{ symbol: string; name?: string; address: string }>): void {
  for (const t of tokens) {
    if (getBundledIcon(t.symbol, t.name)) continue
    if (logoFetchStarted.has(t.address)) continue
    if (!ledgerLogoDue(t.address)) continue
    logoFetchStarted.add(t.address)
    void fetchLedgerLogo(t.address)
  }
}

function getBundledIcon(symbol: string, name?: string): string | null {
  if (name && tokenImages[name]) return tokenImages[name]
  if (tokenImages[symbol]) return tokenImages[symbol]
  if (tokenImages[symbol.toUpperCase()]) return tokenImages[symbol.toUpperCase()]
  // Try common variations
  if (tokenImages[symbol.toLowerCase()]) return tokenImages[symbol.toLowerCase()]
  return null
}

/**
 * Get token icon URL by symbol or name.
 * Falls back through: exact name → symbol → uppercase symbol → null
 */
export function getTokenIcon(symbol: string, name?: string, address?: string): string | null {
  // Register a dependency so any computed/template calling this re-renders
  // when a lazily fetched ledger logo lands in the cache.
  void iconCacheVersion.value
  const bundled = getBundledIcon(symbol, name)
  if (bundled) return bundled
  // Ledger's own icrc1_metadata logo, cached by fetchLedgerLogo (data URI)
  if (address) return cachedLedgerLogo(address)
  return null
}
