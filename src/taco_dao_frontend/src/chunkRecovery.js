// ─── Chunk-load recovery ─────────────────────────────────────────────
// Lazy route/app chunks are hashed; after a deploy a client holding an old
// index.html requests a hash that no longer exists → the dynamic import rejects
// ("Failed to fetch dynamically imported module" / ChunkLoadError) and the app
// would hang at a blank screen. Recover with a ONE-TIME reload to pick up the
// fresh manifest, guarded against reload loops (a genuine outage shouldn't loop).
//
// A CrossDEX swap or sale holds the funds lock in this tab (window.__tacoFundsBusy):
// a reload then would stop its later steps. Instead the app says an update is
// ready ('taco:update-ready') and reloads once the lock is free ('taco:funds-free').
//
// Injected window, session storage and reload so the CrossDEX harness can run it.
export function createChunkRecovery({ win, session, reload }) {
  function isChunkLoadError(err) {
    const m = (err && (err.message || err.toString && err.toString())) || ''
    return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\w-]+ failed/i.test(String(m))
  }
  function recoverFromChunkError(err) {
    if (!isChunkLoadError(err)) return false
    try {
      if (session.getItem('taco_chunk_reloaded') === '1') return false
    } catch { /* private mode: best effort, skip the loop guard */ }
    if (win.__tacoFundsBusy) {
      if (!win.__tacoReloadPending) {
        win.__tacoReloadPending = true
        try { win.dispatchEvent(new CustomEvent('taco:update-ready')) } catch { /* ignore */ }
        const reloadWhenFree = () => {
          if (win.__tacoFundsBusy) return
          win.removeEventListener('taco:funds-free', reloadWhenFree)
          try { session.setItem('taco_chunk_reloaded', '1') } catch { /* ignore */ }
          reload()
        }
        win.addEventListener('taco:funds-free', reloadWhenFree)
      }
      return true
    }
    try { session.setItem('taco_chunk_reloaded', '1') } catch { /* ignore */ }
    reload()
    return true
  }
  function clearChunkReloadGuard() {
    try { session.removeItem('taco_chunk_reloaded') } catch { /* ignore */ }
  }
  return { isChunkLoadError, recoverFromChunkError, clearChunkReloadGuard }
}
