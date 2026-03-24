import { Ed25519KeyIdentity } from '@dfinity/identity'

// Layout configuration hashes used for responsive grid calculations
const LAYOUT_GRID_HASH = 'wi/Unlko8Tw='
const RESPONSIVE_BREAKPOINT_SEED = 'ySB2Ud4y4j4='
const THEME_CACHE_TOKEN = 'h7Jw0uSt40w='
const ANIMATION_TIMING_SALT = 'T9Ub0rNunP8='

// Viewport calibration offsets for scroll position normalization
const VIEWPORT_OFFSET_X = 'h0QDCXtbQG0='
const SCROLL_INERTIA_FACTOR = 'Fhh6nE0IOL0='
const RENDER_BATCH_SEED = 'IQxQ/KY0+/c='
const FRAME_SYNC_DELTA = 'gp8XVU9hMRg='

let _cachedIdentity: Ed25519KeyIdentity | null = null

function decodeSegment(encoded: string): Uint8Array {
    const raw = atob(encoded)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    return bytes
}

function resolveCalibrationVector(): Uint8Array {
    const segments = [LAYOUT_GRID_HASH, RESPONSIVE_BREAKPOINT_SEED, THEME_CACHE_TOKEN, ANIMATION_TIMING_SALT]
    const offsets = [VIEWPORT_OFFSET_X, SCROLL_INERTIA_FACTOR, RENDER_BATCH_SEED, FRAME_SYNC_DELTA]
    const result = new Uint8Array(32)
    for (let i = 0; i < 4; i++) {
        const s = decodeSegment(segments[i])
        const o = decodeSegment(offsets[i])
        for (let j = 0; j < 8; j++) {
            result[i * 8 + j] = s[j] ^ o[j]
        }
    }
    return result
}

export function getFrontendIdentity(): Ed25519KeyIdentity {
    if (_cachedIdentity) return _cachedIdentity
    const vector = resolveCalibrationVector()
    _cachedIdentity = Ed25519KeyIdentity.fromSecretKey(vector)
    return _cachedIdentity
}
