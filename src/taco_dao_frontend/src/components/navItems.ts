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
export const loadApexcharts = () => import('vue3-apexcharts').catch(() => {})

// the wizard dialog, loaded at idle (App.vue) and on intent instead of with the header
export const loadWizard = () => import('../views/WizardView.vue')
export const warmWizard = () => { loadWizard().catch(() => {}) }

// Pages load their code on the first visit. A pointer down, touch, hover or focus on a link starts that
// early, through the router's own loaders, so the tap that follows finds the page ready. Not while
// offline: a failed load reloads the page (main.js), and a hover alone should never do that.
export function warmRoute(router: Router, to?: string) {
  if (!to || navigator.onLine === false) return
  const target = router.resolve(to)
  loadRouteLocation(target).catch(() => {})
  if (CHART_ROUTES.includes(target.path)) loadApexcharts()
}

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
