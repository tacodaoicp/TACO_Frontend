/**
 * Sliding-window parallel map: at most `limit` calls in flight; the moment one
 * settles the next item starts. Results keep item order. Used by the Recover
 * page's Recover All and the Neutrinite sweepAll.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }))
  return results
}

/** Retry `fn` when it throws, up to `attempts` total tries, `delayMs` apart. */
export async function withRetries<T>(fn: () => Promise<T>, attempts = 5, delayMs = 2000): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}
