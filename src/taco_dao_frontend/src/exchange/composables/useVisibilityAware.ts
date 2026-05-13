/**
 * useVisibilityAware — one `document.visibilitychange` listener for the whole app.
 *
 * Pollers gate their callbacks on `isVisible.value` so we stop hammering the
 * canister while the tab is in the background. On the hidden→visible flip,
 * each registered onVisible() callback fires once so views catch up
 * immediately when the user returns.
 *
 * Importing this module is cheap and idempotent — the listener is installed
 * once at first import. The exported isVisible ref is module-scoped so every
 * consumer reacts to the same source of truth.
 */

import { onUnmounted, readonly, ref, type Ref } from 'vue'

const isVisibleInternal = ref(typeof document === 'undefined' ? true : !document.hidden)
const visibleListeners = new Set<() => void>()
const hiddenListeners = new Set<() => void>()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const visible = !document.hidden
    if (visible === isVisibleInternal.value) return
    isVisibleInternal.value = visible
    const subs = visible ? visibleListeners : hiddenListeners
    for (const cb of subs) {
      try { cb() } catch (err) { console.error('[useVisibilityAware] listener failed:', err) }
    }
  })
}

export const isVisible: Readonly<Ref<boolean>> = readonly(isVisibleInternal)

/** Register a callback that fires when the document becomes visible.
 *  Returns an unsubscribe function. Inside a Vue setup() the cleanup is automatic. */
export function onVisible(cb: () => void): () => void {
  visibleListeners.add(cb)
  const off = () => visibleListeners.delete(cb)
  try { onUnmounted(off) } catch { /* called outside setup — caller is responsible */ }
  return off
}

/** Register a callback that fires when the document becomes hidden.
 *  Returns an unsubscribe function. Inside a Vue setup() the cleanup is automatic. */
export function onHidden(cb: () => void): () => void {
  hiddenListeners.add(cb)
  const off = () => hiddenListeners.delete(cb)
  try { onUnmounted(off) } catch { /* called outside setup — caller is responsible */ }
  return off
}

/** Convenience for pollers: returns true if the tab is currently in the foreground. */
export function isDocumentVisible(): boolean {
  return isVisibleInternal.value
}
