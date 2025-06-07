<template>

  <div class="footer-bar">

    <!-- left -->
    <div class="footer-bar__left">

      <!-- placeholder -->

    </div>

    <!-- center -->
    <div class="footer-bar__center">

      <!-- copyright -->
      <span class="footer-bar__copyright">&copy;TacoDAO {{ currentYear }}</span>

    </div>

    <!-- right -->
    <div class="footer-bar__right">

      <!-- version number -->
      <span class="footer-bar__version">v1.0.2</span>

    </div>

  </div>

</template>

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  .footer-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 1rem;
    font-size: 0.75rem;
    user-select: none;
    gap: 0.75rem;

    // footer bar left
    &__left {
      min-width: 50px;
    }

    // footer bar center
    &__center {
      // placeholder
    }

    // footer bar right
    &__right {
      min-width: 50px;
    }

    // copyright
    &__copyright {
      color: var(--brown-to-light-orange);
      opacity: 0.5;
      white-space: nowrap;
    }

    // version
    &__version {
      color: var(--brown-to-light-orange);
      opacity: 0.5;
    }

  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {

  // hide footer bar left
  .footer-bar__left {
    display: none;
  }

}

</style>

<script setup lang="ts">

  /////////////
  // imports //
  /////////////

  import { ref } from 'vue'

  /////////////////////
  // local variables //
  /////////////////////

  const currentYear = ref(/\d{4}/.exec(Date())[0])

</script>