<template>
  <div data-theme="exchange" class="exchange-app" :class="{ 'exchange-app--pro': isProRoute, 'exchange-app--terminal': isTerminalRoute, 'exchange-app--content': !isTerminalRoute }">
    <a href="#ex-main" class="skip-link">Skip to content</a>
    <!-- Init error / empty state banner -->
    <div v-if="exchangeStore.initError" class="exchange-app__banner exchange-app__banner--error">
      {{ exchangeStore.initError }}
      <router-link v-if="isAdmin" to="/admin" class="exchange-app__banner-link">
        Go to Admin Panel
      </router-link>
    </div>
    <router-view v-slot="{ Component }">
      <keep-alive :max="8">
        <component :is="Component" :key="$route.name" />
      </keep-alive>
    </router-view>
    <MobileNav v-if="!isProRoute" />
    <ExchangeToastContainer />
    <HelpModal v-model:open="helpOpen" />
    <div class="ex-sr-announce" aria-live="polite" aria-atomic="true" id="ex-announce"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExchangeStore } from './exchange/store/exchange.store'
import { useTacoStore } from './stores/taco.store'
import { ADMIN_PRINCIPALS } from './composables/useAdminCheck'
import MobileNav from './exchange/components/layout/MobileNav.vue'
import ExchangeToastContainer from './exchange/components/shared/ExchangeToastContainer.vue'
import HelpModal from './exchange/components/common/HelpModal.vue'

const exchangeStore = useExchangeStore()
const tacoStore = useTacoStore()
const router = useRouter()
const route = useRoute()
const helpOpen = ref(false)

const isProRoute = computed(() => route.meta?.mode === 'pro')
const isTerminalRoute = computed(() => route.meta?.mode === 'pro' || route.meta?.mode === 'trade')
const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(exchangeStore.principalText))

// Font loader — inject Google Fonts <link>s once, keep handles for cleanup.
// CSP allows fonts.googleapis.com (style-src) and fonts.gstatic.com (font-src).
const FONT_LINK_IDS = ['tx-font-preconnect-1', 'tx-font-preconnect-2', 'tx-font-stylesheet'] as const
function injectFonts() {
  if (document.getElementById(FONT_LINK_IDS[0])) return
  const preconnect1 = document.createElement('link')
  preconnect1.id = FONT_LINK_IDS[0]
  preconnect1.rel = 'preconnect'
  preconnect1.href = 'https://fonts.googleapis.com'
  const preconnect2 = document.createElement('link')
  preconnect2.id = FONT_LINK_IDS[1]
  preconnect2.rel = 'preconnect'
  preconnect2.href = 'https://fonts.gstatic.com'
  preconnect2.crossOrigin = ''
  const sheet = document.createElement('link')
  sheet.id = FONT_LINK_IDS[2]
  sheet.rel = 'stylesheet'
  sheet.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap'
  document.head.append(preconnect1, preconnect2, sheet)
}
function removeFonts() {
  for (const id of FONT_LINK_IDS) document.getElementById(id)?.remove()
}

// Global cross-viewport redirect.
// Pro terminal grid needs ≥ 768px; mobile trade is the narrow-viewport
// variant. Here we keep the user's current route in sync with their
// viewport, but ONLY if they're already on the trading pair — we don't
// drag users off Portfolio / Pool / OTC / etc. on resize.
const mobileMql = window.matchMedia('(max-width: 767px)')
function syncTradeRouteToViewport() {
  const path = route.path
  if (path === '/' && mobileMql.matches) {
    router.replace('/trade')
  } else if (path === '/trade' && !mobileMql.matches) {
    router.replace('/')
  }
}

onMounted(async () => {
  injectFonts()
  document.documentElement.dataset.txTheme = tacoStore.exchangeTheme
  try {
    await exchangeStore.initExchange()
  } catch (err) {
    console.error('Failed to initialize exchange:', err)
  }

  window.addEventListener('keydown', handleKeydown)
  mobileMql.addEventListener('change', syncTradeRouteToViewport)
})

watch(() => tacoStore.exchangeTheme, (v) => {
  document.documentElement.dataset.txTheme = v
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  mobileMql.removeEventListener('change', syncTradeRouteToViewport)
  delete document.documentElement.dataset.txTheme
  removeFonts()
})

function handleKeydown(e: KeyboardEvent) {
  // Skip when typing in inputs
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if ((e.target as HTMLElement)?.isContentEditable) return

  // Escape — close HelpModal or any open modal overlay
  if (e.key === 'Escape') {
    if (helpOpen.value) { helpOpen.value = false; return }
    document.querySelector<HTMLElement>('.ex-modal-overlay')?.click()
    return
  }

  // Navigation shortcuts (no modifiers)
  if (e.ctrlKey || e.metaKey || e.altKey) return

  switch (e.key) {
    case 'p': router.push('/'); break
    case 'e': router.push('/easy'); break
    case 'o': router.push('/portfolio'); break
    case 'l': router.push('/pool'); break
    case '?':
      helpOpen.value = !helpOpen.value
      break
  }
}
</script>

<style lang="scss">
@import './exchange/styles/exchange.scss';

.exchange-app {
  width: 100%;
  display: flex;
  flex-direction: column;

  // Terminal views (Pro Trade, Mobile Trade): viewport-locked
  &--terminal {
    height: 100vh;
    overflow: hidden;
  }

  // Content views (Easy Swap, Portfolio, Pool, OTC, Admin, Recover): natural page flow
  &--content {
    min-height: 100vh;
  }

  &__banner {
    padding: 8px 16px;
    font-size: 13px;
    text-align: center;
    z-index: 200;

    &--error {
      background: rgba(196, 48, 48, 0.13);
      color: var(--color-sell);
      border-bottom: 1px solid rgba(196, 48, 48, 0.27);
    }
  }

  &__banner-link {
    margin-left: 12px;
    color: var(--accent-primary) !important;
    text-decoration: underline !important;
    font-weight: 600;
  }

  // Pro mode: no bottom padding, no mobile nav
  &--pro {
    padding-bottom: 0;
  }

  // Non-pro pages: bottom padding for mobile nav, but only on mobile.
  // Desktop hides MobileNav so no extra space needed.
  &:not(&--pro) {
    @media (max-width: 767px) {
      padding-bottom: 56px;
    }
  }
}
</style>
