/**
 * TACO pool curves for Sell many's "second in line" planning.
 *
 * Every hop of every route in every token's BatchMulti quote is one observation
 * (amountIn, amountOut) of a directed pool hop, all taken from the same pool
 * state. A hop's curve is those points sorted, made monotone, through (0, 0).
 * With them a token can be planned "after" other tokens' flows through shared
 * pools: a route through a hop with prior inflow p is repriced as
 * out × chain(x ↦ c(p + x) − c(p)) / chain(c).
 *
 * Past the last point (several tokens queued on one pool push more through it
 * than any one quote did) a curve continues as the constant product curve
 * y = a·x / (b + x) fitted to its upper points, with a 2% margin, for at most
 * CONT_MAX_FACTOR times the quoted range. Only when that fit matches every
 * upper point within 0.3% (a plain AMM pool matches exactly); otherwise, and
 * beyond that reach, it stays flat (pessimistic). These are planning
 * estimates: every queued TACO part is checked exactly before it is sent.
 *
 * Pure module.
 */

export type DirectedHop = `${string}>${string}`

export interface HopCurve {
  at(x: number): number
  maxX(): number
}

/** The continuation reaches at most this many times the last quoted amount past it. */
export const CONT_MAX_FACTOR = 4
const CONT_MARGIN = 0.98
const FIT_TOL = 0.003
/** A curve too straight to show its depth is taken as at least this many times the quoted range deep. */
const UNRESOLVED_DEPTH = 20

interface Continuation { slope: number; depth: number }

/**
 * Fit y = a·x / (b + x) by least squares on 1/y = 1/a + (b/a)·(1/x) over the points in the upper
 * half of the quoted range; the continuation from the last point (xm, ym) adds
 * slope · D · d / (D + d) at xm + d, with slope the fitted marginal rate at xm and D = b + xm.
 */
export function fitContinuation(s: ReadonlyArray<readonly [number, number]>): Continuation | null {
  const pts = s.filter(([x, y]) => x > 0 && y > 0)
  if (pts.length < 3) return null
  const [xm] = pts[pts.length - 1]
  const upper = pts.filter(([x]) => x >= xm / 2)
  if (upper.length < 3) return null
  const n = upper.length
  const us = upper.map(([x]) => 1 / x), vs = upper.map(([, y]) => 1 / y)
  const mu = us.reduce((a, b) => a + b, 0) / n, mv = vs.reduce((a, b) => a + b, 0) / n
  let suu = 0, suv = 0
  for (let k = 0; k < n; k++) { suu += (us[k] - mu) ** 2; suv += (us[k] - mu) * (vs[k] - mv) }
  if (!(suu > 0)) return null
  const beta = suv / suu           // b / a
  const alpha = mv - beta * mu     // 1 / a
  if (!(beta > 0)) return null
  let f: (x: number) => number
  let slope: number, depth: number
  if (alpha > 0) {
    const a = 1 / alpha, b = beta / alpha
    f = (x) => (a * x) / (b + x)
    slope = (a * b) / ((b + xm) ** 2)
    depth = b + xm
  } else {
    // no curvature seen over the quoted range: a straight price, taken as a deep pool
    f = (x) => x / beta
    slope = 1 / beta
    depth = UNRESOLVED_DEPTH * xm
  }
  for (const [x, y] of upper) if (Math.abs(f(x) - y) > FIT_TOL * y) return null
  if (!(slope > 0) || !Number.isFinite(slope) || !(depth > 0) || !Number.isFinite(depth)) return null
  return { slope, depth }
}

class PointCurve implements HopCurve {
  private pts: Array<[number, number]> = []
  private s: Array<[number, number]> = [[0, 0]]
  private cont: Continuation | null = null
  add(x: number, y: number) {
    if (x > 0 && y >= 0 && Number.isFinite(x) && Number.isFinite(y)) this.pts.push([x, y])
  }
  build(): this {
    const out: Array<[number, number]> = [[0, 0]]
    for (const [x, y] of [...this.pts].sort((a, b) => a[0] - b[0])) {
      const last = out[out.length - 1]
      if (x - last[0] < 1e-9 * x) { last[1] = Math.max(last[1], y); continue }
      out.push([x, Math.max(y, last[1])])
    }
    this.s = out
    this.cont = fitContinuation(out)
    return this
  }
  maxX() { return this.s[this.s.length - 1][0] }
  at(x: number): number {
    if (x <= 0) return 0
    const s = this.s
    if (s.length < 2) return 0
    const [xm, ym] = s[s.length - 1]
    if (x >= xm) {
      // past the quoted range: the fitted continuation (with its margin), else flat
      const c = this.cont
      if (!c) return ym
      const d = Math.min(x - xm, CONT_MAX_FACTOR * xm)
      return ym + CONT_MARGIN * ((c.slope * c.depth * d) / (c.depth + d))
    }
    let lo = 0, hi = s.length - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m][0] <= x) lo = m; else hi = m }
    const [x1, y1] = s[lo], [x2, y2] = s[hi]
    return x2 === x1 ? y2 : y1 + (y2 - y1) * (x - x1) / (x2 - x1)
  }
}

export const directedHop = (a: string, b: string): DirectedHop => `${a}>${b}`

/** The directed hops of one quoted route (the direct route is token>target). */
export function routeHops(route: any, token: string, target: string): DirectedHop[] {
  const hd = (route?.hopDetails ?? []) as Array<{ tokenIn: string; tokenOut: string }>
  if (hd.length > 0) return hd.map(h => directedHop(h.tokenIn, h.tokenOut))
  return [directedHop(token, target)]
}

/** Hop curves from every cached BatchMulti result (all from the same start state). */
export function buildHopCurves(
  all: ReadonlyArray<{ address: string; requests: ReadonlyArray<{ amt: bigint }>; batch: any[] }>,
  target: string,
): Map<DirectedHop, HopCurve> {
  const curves = new Map<DirectedHop, PointCurve>()
  const curve = (h: DirectedHop) => { let c = curves.get(h); if (!c) { c = new PointCurve(); curves.set(h, c) } return c }
  for (const q of all) {
    q.batch.forEach((b, k) => {
      for (const r of (b?.routes ?? []) as any[]) {
        const hd = (r?.hopDetails ?? []) as any[]
        if (hd.length > 0) {
          for (const h of hd) curve(directedHop(h.tokenIn, h.tokenOut)).add(Number(h.amountIn), Number(h.amountOut))
        } else {
          const amt = q.requests[k]?.amt
          if (amt != null) curve(directedHop(q.address, target)).add(Number(amt), Number(r.expectedBuyAmount ?? 0n))
        }
      }
    })
  }
  const out = new Map<DirectedHop, HopCurve>()
  for (const [h, c] of curves) out.set(h, c.build())
  return out
}

/** Directed hop inflows of planned TACO legs: each split's amount pushed through its hops. */
export function tacoInflows(
  splits: ReadonlyArray<{ amountIn: bigint; hops: DirectedHop[]; hopAmounts?: Array<bigint | number> }>,
  curves: Map<DirectedHop, HopCurve>,
): Map<DirectedHop, number> {
  const inflow = new Map<DirectedHop, number>()
  for (const s of splits) {
    let x = Number(s.amountIn)
    s.hops.forEach((h, k) => {
      // The quote's own per hop amounts when known (exact for the start state).
      const known = s.hopAmounts?.[k]
      if (known != null) x = Number(known)
      inflow.set(h, (inflow.get(h) ?? 0) + x)
      const c = curves.get(h)
      x = c ? c.at(x) : 0
    })
  }
  return inflow
}

/**
 * A route's quoted output after prior flows: out × chain(shifted) / chain(unshifted).
 * Only same direction prior flows count (opposite flows would only help).
 * 0n when a hop with prior inflow has no curve.
 */
export function repriceAfter(
  routeOut: bigint, hops: DirectedHop[], amount: bigint,
  prior: Map<DirectedHop, number>, curves: Map<DirectedHop, HopCurve>,
): bigint {
  if (!hops.some(h => (prior.get(h) ?? 0) > 0)) return routeOut
  let x0 = Number(amount), x1 = Number(amount)
  for (const h of hops) {
    const c = curves.get(h)
    const p = prior.get(h) ?? 0
    if (!c) { if (p > 0) return 0n; continue }
    x0 = c.at(x0)
    x1 = c.at(p + x1) - c.at(p)
  }
  if (!(x0 > 0) || !(x1 > 0)) return 0n
  const ratio = Math.min(1, x1 / x0)
  return BigInt(Math.max(0, Math.floor(Number(routeOut) * ratio)))
}
