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

  // Wait for ApexCharts SVG to render inside the container
  let svg: Element | null = null
  const waitStart = Date.now()
  while (Date.now() - waitStart < 3000) {
    svg = container.querySelector('.apexcharts-svg')
    if (svg) break
    await new Promise(r => setTimeout(r, 200))
  }
  if (!svg) {
    console.warn('[Tour] ApexCharts SVG not found')
    return
  }

  // Wait for actual chart DATA to render — markers prove data is loaded
  // (the SVG shell renders before async data arrives)
  let markers: Element[] = []
  const dataStart = Date.now()
  while (Date.now() - dataStart < 5000) {
    markers = Array.from(svg.querySelectorAll('.apexcharts-marker'))
    if (markers.length > 0) break
    await new Promise(r => setTimeout(r, 300))
  }
  if (markers.length === 0) {
    console.warn('[Tour] Chart has no data markers — no tooltips to show')
    return
  }

  // Extra settle time after data renders
  await new Promise(r => setTimeout(r, 500))

  // Temporarily elevate the container above the tour overlay (z-index 100000)
  // so the ApexCharts tooltip is visible and not hidden behind the tour backdrop
  const containerEl = container instanceof HTMLElement ? container : null
  const origZIndex = containerEl?.style.zIndex ?? ''
  const origPosition = containerEl?.style.position ?? ''
  if (containerEl) {
    const cs = window.getComputedStyle(containerEl)
    if (cs.position === 'static') containerEl.style.position = 'relative'
    containerEl.style.zIndex = '100001'
  }

  // Pick markers from the right portion of the chart
  const startIdx = Math.max(0, Math.floor(markers.length * 0.5))
  const step = Math.max(1, Math.floor((markers.length - startIdx) / (count + 1)))

  // ApexCharts v4 requires mouseenter (NOT mouseover) to initialize tooltip tracking
  svg.dispatchEvent(new MouseEvent('mouseenter', {
    bubbles: false, cancelable: false, view: window,
  }))

  for (let i = 0; i < count; i++) {
    if (tourAborted) break

    // Use the actual marker element coordinates — exact data point positions
    const markerIdx = Math.min(startIdx + step * (i + 1), markers.length - 1)
    const marker = markers[markerIdx]
    if (!marker) continue

    const markerRect = marker.getBoundingClientRect()
    const clientX = markerRect.left + markerRect.width / 2
    const clientY = markerRect.top + markerRect.height / 2

    // Dispatch mousemove on the SVG with exact marker coordinates
    // Pulse multiple times to overcome ApexCharts' 20ms mousemove throttle
    for (let pulse = 0; pulse < 3; pulse++) {
      svg.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true, cancelable: true, clientX, clientY, view: window,
      }))
      await new Promise(r => setTimeout(r, 30))
    }

    // Hold tooltip visible
    await new Promise(r => setTimeout(r, dwellMs))
    if (tourAborted) break

    // Dismiss tooltip
    svg.dispatchEvent(new MouseEvent('mouseout', {
      bubbles: true, cancelable: true, view: window,
    }))
    await new Promise(r => setTimeout(r, 400))
  }

  // Final dismiss
  svg.dispatchEvent(new MouseEvent('mouseleave', {
    bubbles: false, cancelable: false, view: window,
  }))

  // Restore container z-index
  if (containerEl) {
    containerEl.style.zIndex = origZIndex
    containerEl.style.position = origPosition
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
