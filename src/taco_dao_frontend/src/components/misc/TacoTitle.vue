<template>

  <component :is="tag" 
              class="taco-title
                     mb-4 px-3">
    <span class="taco-title__icon">{{ emoji }}</span>
    <span class="taco-title__title"
          :style="{color: forceTextColor}">{{ title }}</span>
  </component>

</template>

<style lang="scss" scoped>

  // taco title
  .taco-title {
    display: inline-flex;
    margin-bottom: 0;
    font-size: 1.5rem;
    font-weight: 500;
    font-family: "Rubik Mono One", monospace;
    gap: 0.75rem;

    &__icon {
      color: var(--brown-to-white);
    }

    &__title {
      color: var(--brown-to-white);
    }
  }

</style>

<script setup>

  // imports
  import { computed } from 'vue'

  // props
  const props = defineProps({
    level: {
      type: String,
      required: true,
      validator: (value) => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(value),
    },
    emoji: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    forceTextColor: {
      type: String,
      required: false,
    },
  })

  // computed
  const tag = computed(() => props.level)

</script>