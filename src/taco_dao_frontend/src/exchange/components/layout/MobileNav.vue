<template>
  <nav class="mobile-nav" role="navigation" aria-label="Mobile navigation">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="mobile-nav__item"
      :class="{ 'mobile-nav__item--active': isActive(item.path) }"
      :aria-label="item.label"
    >
      <svg class="mobile-nav__icon" width="20" height="20" viewBox="0 0 20 20" v-html="item.icon" />
      <span class="mobile-nav__label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  {
    path: '/easy',
    label: 'Swap',
    icon: '<path d="M7 3l6 7-6 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 17l-6-7 6-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,0)"/>',
  },
  {
    path: '/trade',
    label: 'Trade',
    icon: '<path d="M3 17V7l4 4 3-6 4 3 3-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    path: '/otc',
    label: 'OTC',
    icon: '<path d="M4 4h12M4 10h12M4 16h8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  },
  {
    path: '/portfolio',
    label: 'Portfolio',
    icon: '<rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  },
  {
    path: '/pool',
    label: 'Pool',
    icon: '<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 6v8M6 10h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped lang="scss">
.mobile-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(to top, var(--card-gradient-to, #241005), var(--card-gradient-from, #3A1F0C));
  border-top: 1px solid var(--card-border, #6B4422);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);
  padding: var(--space-1, 4px) 0;
  padding-bottom: env(safe-area-inset-bottom, 0);

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-1) 0;
    text-decoration: none;
    color: var(--text-tertiary);
    transition: all 0.2s ease;
    border-radius: 6px;

    &--active {
      color: var(--gold);
      background: rgba(196, 90, 10, 0.1);
    }

    &:active { transform: scale(0.95); }
  }

  &__icon {
    width: 20px;
    height: 20px;
  }

  &__label {
    font-size: 10px;
    font-weight: var(--weight-medium);
  }
}
</style>
