import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

// The style lab only exists on staging and local builds
export const isFxLab = /wxunf|localhost|127\.0\.0\.1|192\.168\./.test(location.hostname)

const DEFAULTS = {
  style: 'random',
  opacity: 0.05,
  scale: 1,
  speed: 1.25,
  tone: 'gold',
  sheen: true,
  drift: true,
  ripple: true,
  page: true,
  pageOpacity: 0.08,
  pageTone: 'orange',
  panel: true,
  panelSee: 0.65,
}

// One settings object for the sidebar and the page background; the staging lab tunes both
export const fx = isFxLab
  ? useStorage('tacoFxLab', DEFAULTS, localStorage, { mergeDefaults: true })
  : ref({ ...DEFAULTS })

// Styles the random rotation picks from (cloth and kinetic tacos only by hand in the lab)
const RANDOM_POOL = ['kumiko', 'damask', 'brocade', 'talavera', 'tacoprint']

// The style the page background shows right now, so the sidebar can pick a different one
export const pageStyle = ref('')

export function pickRandomStyle(...avoid: (string | undefined)[]) {
  const pool = RANDOM_POOL.filter(s => !avoid.includes(s))
  return pool[Math.floor(Math.random() * pool.length)]
}
