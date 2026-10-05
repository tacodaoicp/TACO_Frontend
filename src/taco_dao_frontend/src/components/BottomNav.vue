<template>

  <!-- bottom bar (phones and touch tablets only) -->
  <nav class="bottom-nav" aria-label="Main">

    <!-- most used pages -->
    <router-link v-for="item in bottomItems"
                 :key="item.label"
                 :to="item.to"
                 class="bottom-nav__item"
                 :class="{ 'bottom-nav__item--active': isNavActive(item, route) }">
      <i :class="item.icon" aria-hidden="true"></i>
      <span class="bottom-nav__label">{{ item.label }}</span>
    </router-link>

    <!-- menu, opens the drawer with every other page -->
    <button type="button"
            class="bottom-nav__item"
            :class="{ 'bottom-nav__item--active': inMenu }"
            aria-controls="nav-drawer"
            :aria-expanded="navDrawerOpen"
            @click="openDrawer">
      <i class="fa-solid fa-bars" aria-hidden="true"></i>
      <span class="bottom-nav__label">Menu</span>
    </button>

  </nav>

</template>

<style scoped lang="scss">

  // normal flex child after .app__content, so content needs no bottom padding
  .bottom-nav {
    display: none;
    flex-shrink: 0;
    position: relative;
    z-index: 2; // above home's floating tacos (absolute, z-index 1)
    justify-content: center;
    height: var(--bottom-nav-h);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border-top: 2px solid var(--card-border);

    // page link or menu button
    &__item {
      flex: 1 1 0;
      max-width: 8rem;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 0;
      border: 0;
      border-top: 3px solid transparent;
      background: none;
      color: var(--text-cream);
      opacity: 0.75;
      text-decoration: none;
      cursor: pointer;

      i {
        font-size: 20px;
      }

      &:focus-visible {
        outline: 3px solid var(--dark-orange);
        outline-offset: -3px;
      }

      &--active {
        color: var(--gold);
        border-top-color: var(--gold);
        opacity: 1;
      }
    }

    // label (max-width lets the ellipsis work in the centered column)
    &__label {
      max-width: 100%;
      font: 500 12px/1 'Roboto';
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  // phones and touch tablets
  @media (max-width: 991.98px), (pointer: coarse) {
    .bottom-nav {
      display: flex;
    }
  }

</style>

<script setup lang="ts">

  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { navItems, isNavActive, navDrawerOpen, openDrawer } from './navItems'

  const route = useRoute()

  const bottomItems = navItems.filter(i => i.bottom)

  // every page outside the bar lives in the drawer, so Menu is the active tab there
  const inMenu = computed(() => !bottomItems.some(i => isNavActive(i, route)))

</script>
