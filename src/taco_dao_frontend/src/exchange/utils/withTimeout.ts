/**
 * Race a promise against a timeout.
 *
 * IC calls have no built-in timeout — a dropped response / stuck boundary node
 * leaves the awaiting promise pending forever, which is how the exchange ends up
 * stuck on a loading state. Wrapping a call in `withTimeout` makes it reject with
 * a labelled error after `ms`, so the caller's `Promise.allSettled` / catch can
 * fall back to cached/stale data or surface a retryable error instead of hanging.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    )
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}
