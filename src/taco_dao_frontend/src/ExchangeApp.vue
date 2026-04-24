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
    <div class="ex-sr-announce" aria-live="polite" aria-atomic="true" id="ex-announce"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExchangeStore } from './exchange/store/exchange.store'
import { ADMIN_PRINCIPALS } from './composables/useAdminCheck'
import MobileNav from './exchange/components/layout/MobileNav.vue'
import ExchangeToastContainer from './exchange/components/shared/ExchangeToastContainer.vue'

const exchangeStore = useExchangeStore()
const router = useRouter()
const route = useRoute()

const isProRoute = computed(() => route.meta?.mode === 'pro')
const isTerminalRoute = computed(() => route.meta?.mode === 'pro' || route.meta?.mode === 'trade')
const isAdmin = computed(() => ADMIN_PRINCIPALS.includes(exchangeStore.principalText))

onMounted(async () => {
  try {
    await exchangeStore.initExchange()
  } catch (err) {
    console.error('Failed to initialize exchange:', err)
  }

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  // Skip when typing in inputs
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if ((e.target as HTMLElement)?.isContentEditable) return

  // Escape — close any modal / overlay
  if (e.key === 'Escape') {
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
    case '?': {
      // Toggle keyboard shortcut help overlay
      const existing = document.getElementById('ex-kb-help')
      if (existing) { existing.remove(); return }
      const overlay = document.createElement('div')
      overlay.id = 'ex-kb-help'
      overlay.className = 'ex-modal-overlay'
      overlay.innerHTML = `
        <div class="ex-modal" style="max-width:400px">
          <h3 class="ex-modal__title">Keyboard Shortcuts</h3>
          <table class="ex-table" style="width:100%">
            <tbody>
              <tr><td style="color:var(--text-tertiary)">P</td><td>Pro Trade</td></tr>
              <tr><td style="color:var(--text-tertiary)">E</td><td>Easy Swap</td></tr>
              <tr><td style="color:var(--text-tertiary)">O</td><td>Portfolio</td></tr>
              <tr><td style="color:var(--text-tertiary)">L</td><td>Liquidity Pools</td></tr>
              <tr><td style="color:var(--text-tertiary)">Esc</td><td>Close modal</td></tr>
              <tr><td style="color:var(--text-tertiary)">?</td><td>This help</td></tr>
            </tbody>
          </table>
          <div style="text-align:right;margin-top:var(--space-3)">
            <button class="ex-btn ex-btn--sm ex-btn--outline" onclick="this.closest('.ex-modal-overlay').remove()">Close</button>
          </div>
        </div>`
      overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove() })
      document.body.appendChild(overlay)
      break
    }
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

  // Non-pro pages: bottom padding for mobile nav
  &:not(&--pro) {
    padding-bottom: 56px;
  }
}
</style>
