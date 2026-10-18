import { ref } from 'vue'
import { loadRouteLocation, type RouteLocationNormalizedLoaded, type Router } from 'vue-router'

export interface NavItem {
  label: string
  to?: string
  href?: string
  icon?: string
  action?: 'wizard' | 'roadmap'
  bottom?: boolean // shown in the bottom bar on phones and touch tablets
}

// staging and local serve the exchange under /exchange, production uses its own subdomain
const crossDexUrl = /wxunf|localhost|192\.168/.test(location.hostname)
  ? '/exchange/crossdex' : 'https://exchange.tacodao.com/crossdex'

// one list for the desktop header, the drawer and the bottom bar (desktop order unchanged)
export const navItems: NavItem[] = [
  { label: 'Home', to: '/', icon: 'fa-solid fa-house', bottom: true },
  { label: 'DAO', to: '/dao', icon: 'fa-solid fa-building-columns' },
  { label: 'Vote', to: '/vote', icon: 'fa-solid fa-check-to-slot', bottom: true },
  { label: 'Performance', to: '/performance', icon: 'fa-solid fa-chart-line', bottom: true },
  { label: 'Chat', to: '/chat/oc', icon: 'fa-solid fa-comment-dots' },
  { label: 'Forum', to: '/chat/forum', icon: 'fa-solid fa-comments' },
  { label: 'Reports', to: '/reports', icon: 'fa-solid fa-file-lines' },
  { label: 'Info', to: '/info', icon: 'fa-solid fa-circle-info' },
  { label: 'Roadmap', to: '/info#roadmap', action: 'roadmap', icon: 'fa-solid fa-map' },
  { label: 'Wallet', to: '/wallet', icon: 'fa-solid fa-wallet', bottom: true },
  { label: 'Buy', to: '/buy', icon: 'fa-solid fa-cart-shopping' },
  { label: 'CrossDEX Swap', href: crossDexUrl, icon: 'fa-solid fa-right-left' },
  { label: '🧙Taco Wizard', action: 'wizard' },
  { label: 'Vault', to: '/vault', icon: 'fa-solid fa-vault' },
]

// Vote needs a login, so logged out visitors get DAO in its place in the bottom bar
export const inBottomBar = (item: NavItem, loggedIn: boolean) =>
  loggedIn ? !!item.bottom : (!!item.bottom && item.to !== '/vote') || item.to === '/dao'

// drawer state shared by the header menu button and the bottom bar Menu tab
export const navDrawerOpen = ref(false)
export const openDrawer = () => { navDrawerOpen.value = true }
export const closeDrawer = () => { navDrawerOpen.value = false }

// pages that draw an <apexchart> (the lazy global component from main.js)
export const CHART_ROUTES = ['/dao', '/vote', '/vault', '/portfolio_history']
const importApexcharts = () => import('vue3-apexcharts')
export const loadApexcharts = () => importApexcharts().catch(() => {})

// the wizard dialog, loaded at idle (App.vue) and on intent instead of with the header
export const loadWizard = () => import('../views/WizardView.vue')
export const warmWizard = () => { loadWizard().catch(() => {}) }

// An early load that fails must not reload the page. While one runs (tacoWarm.loads above 0), main.js
// waits a moment before its chunk error reload and skips it for the errors listed here; the navigation
// that needs the chunk recovers as before.
const win = window as Window & { tacoWarm?: { loads: number, errors: WeakSet<object> } }
const tacoWarm = (win.tacoWarm = { loads: 0, errors: new WeakSet<object>() })
const warm = (load: () => Promise<unknown>) => {
  tacoWarm.loads++
  return load()
    .catch((err) => { if (err && typeof err === 'object') tacoWarm.errors.add(err) })
    .finally(() => { tacoWarm.loads--; pumpIdleLoads() })
}

// Pages load their code on the first visit. A pointer down, touch, hover or focus on a link starts that
// early, through the router's own loaders, so the tap that follows finds the page ready (not while offline).
export function warmRoute(router: Router, to?: string): Promise<unknown> {
  if (!to || navigator.onLine === false) return Promise.resolve()
  const target = router.resolve(to)
  return Promise.all([warm(() => loadRouteLocation(target)), CHART_ROUTES.includes(target.path) && warm(importApexcharts)])
}

// What App.vue loads at idle: page files it only downloads (by URL) and loads it runs. They go two at a
// time, the likely next tap first, and none starts while a page is being opened (router guards in
// App.vue) or warmed, so a tap soon after landing on slow data does not wait behind the whole batch.
// Browsers without link prefetch (Safari) get a low priority preload, which fills the same caches there.
// A plain fetch would not do: Safari asks for module scripts with an Origin header, and the server's
// responses vary on it, so a fetched copy is never used for the page's scripts.
type IdleLoad = string | (() => Promise<unknown>)
const idleLoads: IdleLoad[] = []
let idleLoading = 0
let opening = false
const canPrefetch = document.createElement('link').relList?.supports?.('prefetch')
const download = (href: string) => new Promise<void>((done) => {
  const link = document.createElement('link')
  link.rel = canPrefetch ? 'prefetch' : 'preload'
  if (!canPrefetch) link.setAttribute('fetchpriority', 'low')
  // same request mode as the later load (module scripts use CORS); a full URL so Vite's loader
  // still adds its own modulepreload links as before
  if (href.endsWith('.js')) { link.as = 'script'; link.crossOrigin = '' } else link.as = 'style'
  link.href = href
  link.onload = link.onerror = () => { link.remove(); done() }
  document.head.appendChild(link)
})
function pumpIdleLoads() {
  while (idleLoading < 2 && idleLoads.length && !opening && !tacoWarm.loads) {
    const next = idleLoads.shift()!
    idleLoading++
    ;(typeof next === 'string' ? download(next) : next().catch(() => {})).finally(() => { idleLoading--; pumpIdleLoads() })
  }
}
export const queueIdleLoads = (loads: IdleLoad[]) => { idleLoads.push(...loads); pumpIdleLoads() }
export const holdIdleLoads = (on: boolean) => { opening = on; pumpIdleLoads() }

// warm a nav item's page (or the wizard) before its click
export const warmNavItem = (router: Router, item: NavItem) =>
  item.action === 'wizard' ? warmWizard() : warmRoute(router, item.to)

export function isNavActive(item: NavItem, route: RouteLocationNormalizedLoaded) {
  if (!item.to) return false
  const [path, hash] = item.to.split('#')
  if (path === '/') return route.path === '/'
  if (path === '/info') return route.path === '/info' && (route.hash === '#roadmap') === (hash === 'roadmap')
  return route.path === path || route.path.startsWith(path + '/')
}
