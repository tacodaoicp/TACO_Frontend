import { createRouter, createWebHistory } from 'vue-router'

const ProTradeView = () => import('./views/ProTradeView.vue')
const EasySwapView = () => import('./views/EasySwapView.vue')
const PortfolioView = () => import('./views/PortfolioView.vue')
const PoolView = () => import('./views/PoolView.vue')
const OTCView = () => import('./views/OTCView.vue')
const ExchangeAdminView = () => import('./views/ExchangeAdminView.vue')
const RecoverView = () => import('./views/RecoverView.vue')
const MobileTradeView = () => import('./views/MobileTradeView.vue')
const StyleGuideView = () => import('./views/StyleGuideView.vue')

// Route-chunk loader registry — `preloadRoute('Portfolio')` from a nav link's
// hover handler resolves the dynamic import for that route. Empty strings or
// unknown names are no-ops.
const routeChunkLoaders: Record<string, () => Promise<unknown>> = {
  ProTrade:      ProTradeView,
  MobileTrade:   MobileTradeView,
  EasySwap:      EasySwapView,
  Portfolio:     PortfolioView,
  Pool:          PoolView,
  OTC:           OTCView,
  ExchangeAdmin: ExchangeAdminView,
  Recover:       RecoverView,
  StyleGuide:    StyleGuideView,
}
const preloadedChunks = new Set<string>()
export function preloadRoute(name: string): void {
  if (!name || preloadedChunks.has(name)) return
  const loader = routeChunkLoaders[name]
  if (!loader) return
  preloadedChunks.add(name)
  void loader()
}

// Resolve which route the cold load will land on, mirroring the base handling
// below, the `/ → /easy` redirect in beforeEach, and the deep-link paths.
function initialRouteName(): string {
  const host = window.location.hostname
  const hostnameBased = host === 'exchange.tacodao.com' || host === 'exchange.ic0.io'
  let path = window.location.pathname
  if (!hostnameBased && path.startsWith('/exchange')) {
    path = path.slice('/exchange'.length) || '/'
  }
  if (path.startsWith('/easy')) return 'EasySwap'
  if (path.startsWith('/portfolio')) return 'Portfolio'
  if (path.startsWith('/pool')) return 'Pool'
  if (path.startsWith('/otc')) return 'OTC'
  if (path.startsWith('/trade')) return 'MobileTrade'
  if (path.startsWith('/recover')) return 'Recover'
  if (path.startsWith('/admin')) return 'ExchangeAdmin'
  if (path.startsWith('/styleguide')) return 'StyleGuide'
  // Root: pro users land on the Pro terminal, everyone else on Easy Swap.
  let isPro = false
  try { isPro = localStorage.getItem('taco_exchange_mode') === 'pro' } catch { /* private mode */ }
  return isPro ? 'ProTrade' : 'EasySwap'
}

// Kick off the landing route's chunk immediately at module eval (during
// bootExchange's parallel import) instead of waiting for the window-load idle
// callback below — otherwise it only starts downloading after the app mounts,
// an extra waterfall hop on the blank screen.
if (typeof window !== 'undefined') {
  preloadRoute(initialRouteName())
}

// At load, idle-preload only the hot trio (Pro / Portfolio / Easy). Pool, OTC,
// Recover, etc. only load when the user signals intent (hover/focus on the
// nav link). Saves a chunk of bytes the user may never need.
if (typeof window !== 'undefined') {
  const idle = (cb: () => void) => {
    const ric = (window as any).requestIdleCallback
    if (typeof ric === 'function') ric(cb, { timeout: 2000 })
    else setTimeout(cb, 1500)
  }
  window.addEventListener('load', () => {
    idle(() => {
      preloadRoute('ProTrade')
      preloadRoute('Portfolio')
      preloadRoute('EasySwap')
    })
  }, { once: true })
}

const routes = [
  { path: '/', name: 'ProTrade', component: ProTradeView, meta: { mode: 'pro' } },
  { path: '/trade', name: 'MobileTrade', component: MobileTradeView, meta: { mode: 'trade' } },
  { path: '/easy', name: 'EasySwap', component: EasySwapView, meta: { mode: 'easy' } },
  { path: '/portfolio', name: 'Portfolio', component: PortfolioView },
  { path: '/pool', name: 'Pool', component: PoolView },
  { path: '/otc/:code?', name: 'OTC', component: OTCView },
  { path: '/admin', name: 'ExchangeAdmin', component: ExchangeAdminView },
  { path: '/recover', name: 'Recover', component: RecoverView },
  { path: '/styleguide', name: 'StyleGuide', component: StyleGuideView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const isHostnameBased = ['exchange.tacodao.com', 'exchange.ic0.io'].includes(window.location.hostname)
const base = isHostnameBased ? '/' : '/exchange'

const exchangeRouter = createRouter({
  history: createWebHistory(base),
  routes,
})

// Default to easy mode for everyone (all viewports) unless the user has
// explicitly chosen pro. The Pro/Easy tabs in ExchangeTopNav persist that
// choice to localStorage, so an explicit Pro pick sticks across visits.
exchangeRouter.beforeEach((to) => {
  if (to.path === '/' && localStorage.getItem('taco_exchange_mode') !== 'pro') {
    return '/easy'
  }
})

// Canonical URL: always point at exchange.tacodao.com, regardless of which host the user is on.
// This tells search engines that exchange.tacodao.com/<path> is the preferred version over
// tacodao.com/exchange/<path>. Updated on every navigation.
exchangeRouter.afterEach((to) => {
  if (typeof document === 'undefined') return
  const canonicalHref = `https://exchange.tacodao.com${to.path}`
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = canonicalHref
})

export default exchangeRouter
