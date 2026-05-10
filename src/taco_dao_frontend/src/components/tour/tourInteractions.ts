// tourInteractions.ts — DOM interaction utilities for the Grand Tour
// Pure utility module, no Vue dependency. Imported by GrandTour.vue.

let highlightedElement: HTMLElement | null = null
let originalStyles: { position: string; zIndex: string } | null = null
let tourAborted = false

// ════════════════════════════════════════════
// HIGHLIGHT
// ════════════════════════════════════════════

export function applyHighlight(selector: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) {
    console.warn(`[Tour] Highlight target not found: ${selector}`)
    return null
  }

  // Already highlighting this exact element — no-op to avoid flicker
  if (el === highlightedElement) return el

  clearHighlight()

  // Store original styles for restore
  originalStyles = {
    position: el.style.position,
    zIndex: el.style.zIndex,
  }

  // Ensure the element is positioned so z-index works
  const computed = window.getComputedStyle(el)
  if (computed.position === 'static') {
    el.style.position = 'relative'
  }

  el.style.zIndex = '100001'
  el.classList.add('tour-highlighted')

  highlightedElement = el
  return el
}

export function clearHighlight(): void {
  if (highlightedElement && originalStyles) {
    highlightedElement.style.position = originalStyles.position
    highlightedElement.style.zIndex = originalStyles.zIndex
    highlightedElement.classList.remove('tour-highlighted')
    highlightedElement = null
    originalStyles = null
  }

  // Defensive sweep for any stragglers
  document.querySelectorAll('.tour-highlighted').forEach(el => {
    el.classList.remove('tour-highlighted')
    if (el instanceof HTMLElement) {
      el.style.zIndex = ''
    }
  })
}

// ════════════════════════════════════════════
// SCROLL
// ════════════════════════════════════════════

async function waitForElement(selector: string, timeoutMs = 2000): Promise<HTMLElement | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
    await new Promise(r => setTimeout(r, 100))
  }
  console.warn(`[Tour] Element not found after ${timeoutMs}ms: ${selector}`)
  return null
}

export async function scrollToElement(selector: string): Promise<void> {
  const el = await waitForElement(selector)
  if (!el) return

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Wait for scroll animation to roughly complete
  await new Promise(r => setTimeout(r, 600))
}

// ════════════════════════════════════════════
// CLICK
// ════════════════════════════════════════════

export function clickElement(selector: string): void {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) {
    console.warn(`[Tour] Click target not found: ${selector}`)
    return
  }
  el.click()
}

// ════════════════════════════════════════════
// SLIDER ANIMATION
// ════════════════════════════════════════════

export async function animateSliders(
  containerSelector: string,
  demoValues: number[],
  durationMs: number
): Promise<void> {
  const container = document.querySelector(containerSelector)
  if (!container) {
    console.warn(`[Tour] Slider container not found: ${containerSelector}`)
    return
  }

  const sliders = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="range"].slider')
  ).filter(s => !s.disabled)

  if (sliders.length === 0) return

  // Capture starting values
  const startValues = sliders.map(s => parseFloat(s.value) || 0)

  // Ensure demoValues fits slider count; generate even distribution if needed
  const targetValues = demoValues.length >= sliders.length
    ? demoValues.slice(0, sliders.length)
    : generateEvenDistribution(sliders.length)

  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype, 'value'
  )?.set

  if (!nativeSetter) return
  const setter: (this: HTMLInputElement, v: string) => void = nativeSetter

  const startTime = performance.now()

  return new Promise(resolve => {
    function animate(now: number) {
      if (tourAborted) { resolve(); return }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Ease-in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      sliders.forEach((slider, i) => {
        if (slider.disabled) return
        const newVal = startValues[i] + (targetValues[i] - startValues[i]) * eased
        setter.call(slider, newVal.toFixed(2))
        slider.dispatchEvent(new Event('input', { bubbles: true }))
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(animate)
  })
}

function generateEvenDistribution(count: number): number[] {
  const base = Math.floor(100 / count)
  const remainder = 100 - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

// ════════════════════════════════════════════
// TOGGLE BATTLE
// ════════════════════════════════════════════

export async function toggleBattle(
  selectorA: string,
  selectorB: string,
  rounds: number,
  delayMs: number
): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    if (tourAborted) return

    // NACHO clicks their button
    await new Promise(r => setTimeout(r, delayMs))
    if (tourAborted) return
    clickElement(selectorB)

    // TACO clicks their button
    await new Promise(r => setTimeout(r, delayMs))
    if (tourAborted) return
    clickElement(selectorA)
  }
}

// ════════════════════════════════════════════
// ESCALATING BATTLE
// ════════════════════════════════════════════

export interface BattleCallbacks {
  onPhase?: (phase: number) => void
  onClimax?: () => void
}

const BATTLE_PHASES = [
  { rounds: 4,  startDelay: 700, endDelay: 500 },  // warm-up
  { rounds: 5,  startDelay: 450, endDelay: 250 },  // heating up
  { rounds: 8,  startDelay: 220, endDelay: 100 },  // intense
  { rounds: 14, startDelay: 90,  endDelay: 25 },   // supersonic
]

export async function escalatingBattle(
  selectorA: string,
  selectorB: string,
  callbacks: BattleCallbacks
): Promise<void> {
  for (let phase = 0; phase < BATTLE_PHASES.length; phase++) {
    if (tourAborted) return

    const { rounds, startDelay, endDelay } = BATTLE_PHASES[phase]
    callbacks.onPhase?.(phase)

    for (let i = 0; i < rounds; i++) {
      if (tourAborted) return

      // Interpolate delay: gets faster within each phase
      const t = rounds > 1 ? i / (rounds - 1) : 0
      const delay = Math.round(startDelay + (endDelay - startDelay) * t)

      // NACHO clicks
      await new Promise(r => setTimeout(r, delay))
      if (tourAborted) return
      clickElement(selectorB)

      // TACO clicks back
      await new Promise(r => setTimeout(r, delay))
      if (tourAborted) return
      clickElement(selectorA)
    }
  }

  // Climax!
  if (!tourAborted) {
    callbacks.onClimax?.()
  }
}

// ════════════════════════════════════════════
// HOVER CHART POINTS
// ════════════════════════════════════════════

export async function hoverChartPoints(
  containerSelector: string,
  count: number,
  dwellMs: number
): Promise<void> {
  const container = document.querySelector(containerSelector)
  if (!container) {
    console.warn(`[Tour] Chart container not found: ${containerSelector}`)
    return
  }

  // PerformanceChart attaches a `__performanceChartHover(count, dwellMs)`
  // function on its inner container DOM node. Find it inside this row.
  type HoverHook = (count: number, dwellMs: number) => Promise<void>
  type AbortHook = () => void

  const findHookHost = (): { host: HTMLElement; hover: HoverHook; abort: AbortHook | null } | null => {
    const candidates = container.querySelectorAll<HTMLElement>('*')
    for (const el of candidates) {
      const hover = (el as any).__performanceChartHover as HoverHook | undefined
      if (typeof hover === 'function') {
        const abort = (el as any).__performanceChartHoverAbort as AbortHook | undefined
        return { host: el, hover, abort: typeof abort === 'function' ? abort : null }
      }
    }
    return null
  }

  // Wait for the chart component to register its hook (data may load async).
  let hook: ReturnType<typeof findHookHost> = null
  const waitStart = Date.now()
  while (Date.now() - waitStart < 8000) {
    hook = findHookHost()
    if (hook) break
    if (tourAborted) return
    await new Promise(r => setTimeout(r, 200))
  }
  if (!hook) {
    console.warn('[Tour] PerformanceChart hover hook not found')
    return
  }

  // Settle a beat so any final layout pass finishes before we drive the chart.
  await new Promise(r => setTimeout(r, 300))
  if (tourAborted) return

  // Elevate the chart's host above the tour backdrop so the tooltip overlay
  // (which is rendered inside the chart's container) isn't hidden behind it.
  const containerEl = container instanceof HTMLElement ? container : null
  const origZIndex = containerEl?.style.zIndex ?? ''
  const origPosition = containerEl?.style.position ?? ''
  if (containerEl) {
    const cs = window.getComputedStyle(containerEl)
    if (cs.position === 'static') containerEl.style.position = 'relative'
    containerEl.style.zIndex = '100001'
  }

  try {
    // If the user aborts mid-loop, ask the hook to bail early too.
    const onAbort = () => { hook?.abort?.() }
    if (tourAborted) { onAbort(); return }
    await hook.hover(count, dwellMs)
    if (tourAborted) onAbort()
  } finally {
    if (containerEl) {
      containerEl.style.zIndex = origZIndex
      containerEl.style.position = origPosition
    }
  }
}

// ════════════════════════════════════════════
// CLEANUP & ABORT
// ════════════════════════════════════════════

export function cleanupAllTourEffects(): void {
  clearHighlight()

  // Full DOM sweep for any lingering tour classes
  document.querySelectorAll('.tour-highlighted').forEach(el => {
    el.classList.remove('tour-highlighted')
    if (el instanceof HTMLElement) {
      el.style.zIndex = ''
    }
  })
}

export function abortAnimations(): void {
  tourAborted = true
}

export function resetAbortFlag(): void {
  tourAborted = false
}
