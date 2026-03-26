<template>

  <component :is="tag"
              class="taco-title
                     mb-4">
    <span class="taco-title__icon">{{ emoji }}</span>
    <span class="taco-title__title"
          :style="{color: forceTextColor}">{{ title }}</span>
  </component>

</template>

<style lang="scss" scoped>
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