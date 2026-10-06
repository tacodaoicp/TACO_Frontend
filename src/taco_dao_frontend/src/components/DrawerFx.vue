<template>

  <!-- decorative background layer behind the drawer content -->
  <div ref="layerEl" class="drawer-fx" :class="{ 'drawer-fx--page': page }" :style="page ? { backgroundColor: base } : undefined" aria-hidden="true">
   <div class="drawer-fx__art" :style="{ opacity: style === 'off' ? 0 : strength }">
    <div v-if="pattern" class="drawer-fx__pattern" :class="{ 'drawer-fx__pattern--drift': fx.drift && moving }" :style="patternStyle"></div>
    <canvas v-else-if="isCanvas" ref="canvasEl" class="drawer-fx__canvas"></canvas>
    <div v-if="fx.sheen && moving && style !== 'off'" class="drawer-fx__sheen" :style="{ animationDuration: `${12 / fx.speed}s` }"></div>
    <span v-for="r in ripples" :key="r.id" class="drawer-fx__ripple" :style="{ left: `${r.x}px`, top: `${r.y}px`, background: rippleBg }"></span>
   </div>
  </div>

  <!-- staging only: pick a style and tune it -->
  <section v-if="isFxLab && !page" class="drawer-fx-lab">
    <h3 class="drawer-fx-lab__title">Background lab <span>staging only</span></h3>
    <div class="drawer-fx-lab__chips">
      <button v-for="s in STYLES" :key="s.id" type="button" class="drawer-fx-lab__chip"
              :class="{ 'is-on': fx.style === s.id }" @click="fx.style = s.id">{{ s.label }}</button>
    </div>
    <label class="drawer-fx-lab__row">Strength
      <input type="range" min="0.05" max="0.6" step="0.01" v-model.number="fx.opacity">
    </label>
    <label class="drawer-fx-lab__row">Size
      <input type="range" min="0.5" max="2" step="0.05" v-model.number="fx.scale">
    </label>
    <label class="drawer-fx-lab__row">Speed
      <input type="range" min="0" max="2" step="0.05" v-model.number="fx.speed">
    </label>
    <div class="drawer-fx-lab__chips">
      <button v-for="t in TONES" :key="t.id" type="button" class="drawer-fx-lab__chip"
              :class="{ 'is-on': fx.tone === t.id }" @click="fx.tone = t.id">
        <span class="drawer-fx-lab__swatch" :style="{ background: t.hex }"></span>{{ t.label }}
      </button>
    </div>
    <label class="drawer-fx-lab__row">Page strength
      <input type="range" min="0.02" max="0.4" step="0.01" v-model.number="fx.pageOpacity">
    </label>
    <div class="drawer-fx-lab__chips">
      <span class="drawer-fx-lab__label">Page colour</span>
      <button v-for="t in TONES" :key="t.id" type="button" class="drawer-fx-lab__chip"
              :class="{ 'is-on': fx.pageTone === t.id }" @click="fx.pageTone = t.id">
        <span class="drawer-fx-lab__swatch" :style="{ background: t.hex }"></span>{{ t.label }}
      </button>
    </div>
    <label class="drawer-fx-lab__row">Panel see-through
      <input type="range" min="0.1" max="0.9" step="0.05" v-model.number="fx.panelSee">
    </label>
    <div class="drawer-fx-lab__toggles">
      <label><input type="checkbox" v-model="fx.page"> Page background</label>
      <label><input type="checkbox" v-model="fx.panel"> Outer panels</label>
      <label><input type="checkbox" v-model="fx.sheen"> Sheen</label>
      <label><input type="checkbox" v-model="fx.drift"> Drift</label>
      <label><input type="checkbox" v-model="fx.ripple"> Tap ripple</label>
    </div>
    <!-- copy these settings to send over, so they can become the live site defaults -->
    <button type="button" class="drawer-fx-lab__chip drawer-fx-lab__export" @click="copySettings">
      <i class="fa-solid fa-copy" aria-hidden="true"></i>{{ copied ? 'Copied, paste it to Claude' : 'Copy settings' }}
    </button>
    <textarea v-if="exportText" class="drawer-fx-lab__export-text" readonly rows="4" :value="exportText"
              @focus="($event.target as HTMLTextAreaElement).select()"></textarea>
  </section>

</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { fx, isFxLab, pickRandomStyle, pageStyle } from './fxState'

// page: full page background behind the content, painted on the base colour
const props = defineProps<{ active: boolean, page?: boolean, base?: string }>()

const STYLES = [
  { id: 'random', label: 'Random' },
  { id: 'off', label: 'Off' },
  { id: 'cloth', label: 'Cloth' },
  { id: 'kinetic', label: 'Kinetic tacos' },
  { id: 'kumiko', label: 'Kumiko lattice' },
  { id: 'damask', label: 'Taco damask' },
  { id: 'brocade', label: 'Taco brocade' },
  { id: 'talavera', label: 'Talavera' },
  { id: 'tacoprint', label: 'Taco print' },
] as const
const TONES = [
  { id: 'gold', label: 'Gold', hex: '#FEC800' },
  { id: 'cream', label: 'Cream', hex: '#FEEAC1' },
  { id: 'orange', label: 'Orange', hex: '#E8830C' },
] as const

// a new random style every time the sidebar opens (never the one the page shows),
// or on every page visit for the page background
const pick = ref(props.page ? pickRandomStyle() : pickRandomStyle(pageStyle.value))
const style = computed(() => (fx.value.style === 'random' || !STYLES.some(st => st.id === fx.value.style) ? pick.value : fx.value.style))
const strength = computed(() => (props.page ? fx.value.pageOpacity : fx.value.opacity))
const route = useRoute()

// export: clipboard when allowed, otherwise show the text to copy by hand
const copied = ref(false)
const exportText = ref('')
async function copySettings() {
  const text = `TACO background settings: ${JSON.stringify(fx.value)}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    exportText.value = ''
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    exportText.value = text
  }
}
watch(() => props.active, (open) => { if (open && !props.page) pick.value = pickRandomStyle(pick.value, pageStyle.value) })
watch(style, (st) => { if (props.page) pageStyle.value = st }, { immediate: true })
watch(() => route.path, () => { if (props.page) pick.value = pickRandomStyle(pick.value) })

const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const moving = computed(() => fx.value.speed > 0 && !reducedMotion.value)
const toneHex = computed(() => TONES.find(t => t.id === (props.page ? fx.value.pageTone : fx.value.tone))?.hex ?? '#FEC800')
const rippleBg = computed(() => `radial-gradient(circle, ${toneHex.value}88, ${toneHex.value}00 70%)`)
const isCanvas = computed(() => ['cloth', 'kinetic'].includes(style.value))

////////////////////
// SVG patterns   //
////////////////////

const f1 = (n: number) => n.toFixed(1)

// dome shell with a scalloped lettuce frill and the T, like the TACO DAO logo
function taco(cx: number, cy: number, r: number, c: string) {
  let frill = ''
  const n = 7
  for (let k = 0; k <= n; k++) {
    const a = Math.PI + (k / n) * Math.PI
    const x = cx + Math.cos(a) * (r + 2), y = cy + Math.sin(a) * (r + 2)
    if (k === 0) { frill += `M${f1(x)} ${f1(y)}`; continue }
    const am = Math.PI + ((k - 0.5) / n) * Math.PI
    frill += ` Q${f1(cx + Math.cos(am) * (r + 5))} ${f1(cy + Math.sin(am) * (r + 5))} ${f1(x)} ${f1(y)}`
  }
  return `<path d='M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z' fill='${c}' fill-opacity='0.35' stroke='${c}' stroke-width='1.2'/>` +
    `<path d='${frill}' fill='none' stroke='${c}' stroke-width='1.1'/>` +
    `<path d='M${f1(cx - r * 0.42)} ${f1(cy - r * 0.55)} H${f1(cx + r * 0.42)} M${cx} ${f1(cy - r * 0.55)} V${f1(cy - r * 0.05)}' stroke='${c}' stroke-width='${f1(Math.max(1.2, r * 0.16))}' stroke-linecap='round'/>`
}

function flower(cx: number, cy: number, r: number, c: string, petals = 6) {
  let s = ''
  for (let k = 0; k < petals; k++) {
    s += `<ellipse cx='${cx}' cy='${f1(cy - r)}' rx='${f1(r * 0.45)}' ry='${f1(r * 0.9)}' transform='rotate(${(k * 360) / petals} ${cx} ${cy})' fill='${c}' fill-opacity='0.5'/>`
  }
  return s + `<circle cx='${cx}' cy='${cy}' r='${f1(r * 0.35)}' fill='${c}'/>`
}

function sparkle(x: number, y: number, r: number, c: string) {
  const q = r * 0.3
  return `<path d='M${x} ${y - r} L${f1(x + q)} ${f1(y - q)} L${x + r} ${y} L${f1(x + q)} ${f1(y + q)} L${x} ${y + r} L${f1(x - q)} ${f1(y + q)} L${x - r} ${y} L${f1(x - q)} ${f1(y - q)} Z' fill='${c}'/>`
}

const corners = (w: number, h: number) => [[0, 0], [w, 0], [0, h], [w, h]]

const PATTERNS: Record<string, { w: number, h: number, svg: (c: string) => string }> = {
  // scroll vines framing a taco medallion, flowers where four tiles meet
  damask: {
    w: 80, h: 80,
    svg: (c) => `<g fill='none' stroke='${c}' stroke-width='1.3' stroke-linecap='round'>` +
      `<path d='M40 6 C 22 6, 14 20, 26 28 C 34 33, 40 24, 34 20'/>` +
      `<path d='M40 6 C 58 6, 66 20, 54 28 C 46 33, 40 24, 46 20'/>` +
      `<path d='M40 74 C 22 74, 14 60, 26 52 C 34 47, 40 56, 34 60'/>` +
      `<path d='M40 74 C 58 74, 66 60, 54 52 C 46 47, 40 56, 46 60'/>` +
      `<path d='M6 40 C 6 24, 18 16, 24 30 M74 40 C 74 24, 62 16, 56 30 M6 40 C 6 56, 18 64, 24 50 M74 40 C 74 56, 62 64, 56 50'/>` +
      `</g>` + taco(40, 45, 8, c) + corners(80, 80).map(([x, y]) => flower(x, y, 5, c)).join(''),
  },
  // ogee lattice, a taco in every cell and flowers between them
  brocade: {
    w: 48, h: 64,
    svg: (c) => `<g fill='none' stroke='${c}' stroke-width='1.2'>` +
      `<path d='M24 0 C 24 14, 4 18, 4 32 C 4 46, 24 50, 24 64'/>` +
      `<path d='M24 0 C 24 14, 44 18, 44 32 C 44 46, 24 50, 24 64'/>` +
      `</g>` + taco(24, 36, 7, c) + corners(48, 64).map(([x, y]) => flower(x, y, 4, c)).join(''),
  },
  // Mexican tile: eight petal star, quarter medallions in the corners
  talavera: {
    w: 64, h: 64,
    svg: (c) => `<rect x='0.5' y='0.5' width='63' height='63' fill='none' stroke='${c}' stroke-opacity='0.5'/>` +
      flower(32, 32, 11, c, 8) +
      corners(64, 64).map(([x, y]) => `<circle cx='${x}' cy='${y}' r='12' fill='none' stroke='${c}' stroke-width='1.2'/>` + flower(x, y, 5, c, 4)).join('') +
      [[32, 0], [32, 64], [0, 32], [64, 32]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2' fill='${c}'/>`).join(''),
  },
  // Japanese asanoha (hemp leaf) lattice: every triangle split by lines to its centre,
  // with a small taco in the middle of each tile
  kumiko: {
    w: 40, h: 40 * Math.sqrt(3),
    svg: (c) => {
      const L = 40, H = 40 * Math.sqrt(3)
      const tris = [
        [[0, 0], [L, 0], [L / 2, H / 2]], [[0, 0], [L / 2, H / 2], [-L / 2, H / 2]], [[L, 0], [1.5 * L, H / 2], [L / 2, H / 2]],
        [[L / 2, H / 2], [0, H], [L, H]], [[-L / 2, H / 2], [0, H], [L / 2, H / 2]], [[L / 2, H / 2], [L, H], [1.5 * L, H / 2]],
      ]
      let d = ''
      for (const t of tris) {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3
        d += `M${f1(t[0][0])} ${f1(t[0][1])} L${f1(t[1][0])} ${f1(t[1][1])} L${f1(t[2][0])} ${f1(t[2][1])} Z`
        for (const v of t) d += ` M${f1(v[0])} ${f1(v[1])} L${f1(cx)} ${f1(cy)}`
      }
      return `<path d='${d}' fill='none' stroke='${c}' stroke-width='0.9'/>` + taco(L / 2, H / 2 + 2, 4.5, c)
    },
  },
  // monogram print: offset tacos with sparkles between
  tacoprint: {
    w: 56, h: 56,
    svg: (c) => taco(14, 20, 7, c) + taco(42, 48, 7, c) + sparkle(42, 14, 3, c) + sparkle(14, 42, 3, c),
  },
}

const pattern = computed(() => PATTERNS[style.value])
const patternStyle = computed(() => {
  const p = pattern.value
  if (!p) return {}
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${p.w}' height='${p.h}' viewBox='0 0 ${p.w} ${p.h}'>${p.svg(toneHex.value)}</svg>`
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    backgroundSize: `${p.w * fx.value.scale}px ${p.h * fx.value.scale}px`,
    animationDuration: `${80 / Math.max(fx.value.speed, 0.05)}s`,
  }
})

// outer panels (.taco-container--l1) turn partly see-through while the page background shows,
// so the moving layer behind the app shows in them with the very same animation at no extra
// cost; inner panels are made solid in taco.scss (see .fx-panels)
watch(() => (props.page && fx.value.panel ? fx.value.panelSee : null), (see) => {
  const root = document.documentElement
  if (see == null) { root.classList.remove('fx-panels'); return }
  root.style.setProperty('--fx-panel-alpha', `${Math.round((1 - see) * 100)}%`)
  root.classList.add('fx-panels')
}, { immediate: true })

////////////////////
// tap ripples    //
////////////////////

const layerEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const ripples = ref<{ id: number, x: number, y: number }[]>([])
let rippleId = 0
const canvasRipples: { x: number, y: number, t0: number }[] = []

function onTap(e: PointerEvent) {
  if (!fx.value.ripple || style.value === 'off' || !layerEl.value) return
  const rect = layerEl.value.getBoundingClientRect()
  const x = e.clientX - rect.left, y = e.clientY - rect.top
  if (isCanvas.value) {
    canvasRipples.push({ x, y, t0: performance.now() })
    start()
  } else {
    const id = ++rippleId
    ripples.value.push({ id, x, y })
    setTimeout(() => { ripples.value = ripples.value.filter(r => r.id !== id) }, 950)
  }
}

////////////////////
// canvas effects //
////////////////////

let raf = 0
let lastT = 0

// displacement and brightness boost from expanding tap rings
function rippleAt(x: number, y: number, now: number): [number, number, number] {
  let dx = 0, dy = 0, boost = 0
  for (const r of canvasRipples) {
    const age = (now - r.t0) / 1000
    const ddx = x - r.x, ddy = y - r.y
    const d = Math.hypot(ddx, ddy) || 1
    const band = Math.exp(-((d - age * 260) ** 2) / 900)
    const amp = 7 * Math.exp(-age * 2.2) * band
    dx += (ddx / d) * amp; dy += (ddy / d) * amp; boost += amp
  }
  return [dx, dy, boost]
}

// one pre-rendered taco, rotated per cell, keeps the kinetic wall cheap
let sprite: HTMLCanvasElement | null = null
let spriteKey = ''
function tacoSprite(r: number, dpr: number) {
  const key = `${r}|${dpr}|${toneHex.value}`
  if (sprite && spriteKey === key) return sprite
  const size = Math.ceil((r + 6) * 2 * dpr)
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const g = cv.getContext('2d')!
  g.scale(dpr, dpr)
  const cx = size / dpr / 2, cy = cx + r * 0.3
  g.strokeStyle = g.fillStyle = toneHex.value
  g.lineWidth = 1.1
  g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.closePath()
  g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; g.stroke()
  g.beginPath()
  for (let k = 0; k <= 7; k++) {
    const a = Math.PI + (k / 7) * Math.PI
    const x = cx + Math.cos(a) * (r + 2), y = cy + Math.sin(a) * (r + 2)
    if (!k) { g.moveTo(x, y); continue }
    const am = Math.PI + ((k - 0.5) / 7) * Math.PI
    g.quadraticCurveTo(cx + Math.cos(am) * (r + 5), cy + Math.sin(am) * (r + 5), x, y)
  }
  g.stroke()
  g.lineWidth = Math.max(1.2, r * 0.16); g.lineCap = 'round'
  g.beginPath()
  g.moveTo(cx - r * 0.42, cy - r * 0.55); g.lineTo(cx + r * 0.42, cy - r * 0.55)
  g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy - r * 0.05)
  g.stroke()
  sprite = cv; spriteKey = key
  return cv
}

function draw(now: number) {
  const c = canvasEl.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  const w = c.clientWidth, h = c.clientHeight
  if (!w || !h) return
  const dpr = props.page ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  while (canvasRipples.length && now - canvasRipples[0].t0 > 1800) canvasRipples.shift()
  const time = moving.value ? (now / 1000) * fx.value.speed : 0
  ctx.strokeStyle = ctx.fillStyle = toneHex.value

  if (style.value === 'kinetic') {
    // a wall of mini tacos turning together: a diagonal wave sets each angle,
    // so the whole grid moves as one shape; taps add an extra spin ring
    const s = 30 * fx.value.scale, r = 7 * fx.value.scale
    const spr = tacoSprite(r, dpr)
    const half = spr.width / dpr / 2
    for (let y = s / 2; y < h + s; y += s) for (let x = s / 2; x < w + s; x += s) {
      const phase = time * 1.2 - (x * 0.6 + y) * 0.018
      const a = Math.sin(phase) * Math.PI + rippleAt(x, y, now)[2] * 0.35
      const k = 0.85 + 0.15 * Math.cos(phase)
      const cos = Math.cos(a) * k, sin = Math.sin(a) * k
      ctx.setTransform(cos * dpr, sin * dpr, -sin * dpr, cos * dpr, x * dpr, y * dpr)
      ctx.drawImage(spr, -half, -half, half * 2, half * 2)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  } else if (style.value === 'cloth') {
    // woven mesh: warp and weft threads that wave a little and bulge where tapped
    const s = 18 * fx.value.scale
    const cols = Math.ceil(w / s) + 2, rows = Math.ceil(h / s) + 2
    const px = new Float32Array(cols * rows), py = new Float32Array(cols * rows)
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x0 = (i - 1) * s, y0 = (j - 1) * s
      const [rx, ry] = rippleAt(x0, y0, now)
      px[j * cols + i] = x0 + Math.sin(y0 * 0.03 + time) * 0.8 + rx
      py[j * cols + i] = y0 + Math.sin(x0 * 0.035 + time * 1.6) * 1.6 + Math.sin(y0 * 0.02 - time * 1.1) * 1.2 + ry
    }
    ctx.lineWidth = 1
    for (let j = 0; j < rows; j++) {
      ctx.globalAlpha = j % 2 ? 0.55 : 0.9
      ctx.beginPath()
      for (let i = 0; i < cols; i++) i ? ctx.lineTo(px[j * cols + i], py[j * cols + i]) : ctx.moveTo(px[j * cols], py[j * cols])
      ctx.stroke()
    }
    for (let i = 0; i < cols; i++) {
      ctx.globalAlpha = i % 2 ? 0.9 : 0.55
      ctx.beginPath()
      for (let j = 0; j < rows; j++) j ? ctx.lineTo(px[j * cols + i], py[j * cols + i]) : ctx.moveTo(px[i], py[i])
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

function frame(t: number) {
  raf = requestAnimationFrame(frame)
  if (t - lastT < (props.page ? 50 : 33)) return // 30fps (20fps full page) is plenty for a background
  lastT = t
  draw(t)
  // a still background only animates while tap ripples are alive
  if (!moving.value && !canvasRipples.length) stop()
}

function start() {
  if (!raf && props.active && isCanvas.value && !document.hidden) raf = requestAnimationFrame(frame)
}
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
}

function sync() {
  stop()
  if (props.active && isCanvas.value) nextTick(() => { draw(performance.now()); start() })
}
watch(() => [props.active, style.value, fx.value.speed, fx.value.scale, fx.value.tone, reducedMotion.value], sync)

const onVisibility = () => (document.hidden ? stop() : sync())

let host: HTMLElement | null = null
onMounted(() => {
  host = layerEl.value?.parentElement ?? null
  host?.addEventListener('pointerdown', onTap, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  sync()
})
onBeforeUnmount(() => {
  stop()
  if (props.page) {
    document.documentElement.classList.remove('fx-panels')
    pageStyle.value = ''
  }
  host?.removeEventListener('pointerdown', onTap)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped lang="scss">
.drawer-fx {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;

  // behind everything in the app: the app background is made transparent while this shows
  &--page {
    position: fixed;
    z-index: -1;
  }

  &__art {
    position: absolute;
    inset: 0;
    transition: opacity 0.3s;
  }

  &__pattern {
    position: absolute;
    inset: -160px;
    background-repeat: repeat;

    &--drift {
      animation: drawer-fx-drift linear infinite alternate;
    }
  }

  &__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  // a soft light band sweeping across, like light on silk
  &__sheen {
    position: absolute;
    inset: 0 -60%;
    background: linear-gradient(115deg, transparent 42%, rgba(255, 244, 214, 0.55) 50%, transparent 58%);
    animation: drawer-fx-sheen linear infinite;
  }

  &__ripple {
    position: absolute;
    width: 24px;
    height: 24px;
    margin: -12px 0 0 -12px;
    border-radius: 50%;
    animation: drawer-fx-ripple 900ms ease-out forwards;
  }
}

@keyframes drawer-fx-drift {
  to { transform: translate(80px, 60px); }
}
@keyframes drawer-fx-sheen {
  from { transform: translateX(-32%); }
  to { transform: translateX(32%); }
}
@keyframes drawer-fx-ripple {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(14); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-fx__pattern--drift,
  .drawer-fx__sheen,
  .drawer-fx__ripple {
    animation: none;
  }
}

.drawer-fx-lab {
  margin: 0 1.25rem 1.25rem;
  padding: 0.75rem;
  border: 1px dashed var(--card-border);
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8125rem;

  &__title {
    margin: 0;
    font-size: 0.875rem;
    color: var(--gold);

    span {
      margin-left: 0.375rem;
      font-size: 0.6875rem;
      opacity: 0.7;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 2.25rem;
    padding: 0 0.625rem;
    border: 1px solid var(--card-border);
    border-radius: 999px;
    background: transparent;
    color: var(--text-cream);
    font-size: 0.75rem;

    &.is-on {
      border-color: var(--gold);
      color: var(--gold);
      background: rgba(254, 200, 0, 0.12);
    }
  }

  &__label {
    align-self: center;
    margin-right: 0.25rem;
    opacity: 0.8;
  }

  &__export {
    align-self: flex-start;
  }

  &__export-text {
    width: 100%;
    font-size: 0.6875rem;
    font-family: 'Space Mono', monospace;
    background: rgba(0, 0, 0, 0.35);
    color: var(--text-cream);
    border: 1px solid var(--card-border);
    border-radius: 0.375rem;
    padding: 0.375rem;
  }

  &__swatch {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
  }

  &__row {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    align-items: center;
    gap: 0.5rem;

    input { width: 100%; accent-color: var(--gold); }
  }

  &__toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    label {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-height: 2.25rem;
    }

    input { accent-color: var(--gold); }
  }
}
</style>
