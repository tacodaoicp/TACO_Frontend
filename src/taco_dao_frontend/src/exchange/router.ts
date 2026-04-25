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

// Preload all route chunks after initial page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      ProTradeView()
      EasySwapView()
      PortfolioView()
      PoolView()
      OTCView()
      MobileTradeView()
      RecoverView()
    }, 1000)
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

const isHostnameBased = window.location.hostname === 'exchange.tacodao.com'
const base = isHostnameBased ? '/' : '/exchange'

const exchangeRouter = createRouter({
  history: createWebHistory(base),
  routes,
})

// On mobile, default to easy mode unless user has explicitly chosen pro
exchangeRouter.beforeEach((to) => {
  if (to.path === '/' && window.innerWidth <= 767) {
    const saved = localStorage.getItem('taco_exchange_mode')
    if (saved !== 'pro') {
      return '/easy'
    }
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
