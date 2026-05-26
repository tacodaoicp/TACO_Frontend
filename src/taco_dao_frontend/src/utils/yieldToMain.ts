/**
 * Yield to the event loop so the browser can handle scroll / input / paint
 * between chunks of heavy synchronous work. Prefers the scheduler API; falls
 * back to a MessageChannel (sub-millisecond, unlike setTimeout(0)'s ~4ms clamp).
 *
 * Used to keep long transforms (chart serialization, large payload
 * deserialization) from blocking the main thread on the /performance route.
 */
export function yieldToMain(): Promise<void> {
  const s = (globalThis as any).scheduler
  if (s && typeof s.yield === 'function') return s.yield()
  return new Promise<void>((resolve) => {
    const ch = new MessageChannel()
    ch.port1.onmessage = () => resolve()
    ch.port2.postMessage(0)
  })
}
