<template>

  <component :is="tag"
              class="taco-title
                     mb-4">
    <span class="taco-title__icon">
      <img v-if="iconSrc" :src="iconSrc" :alt="title" class="taco-title__icon-img" />
      <template v-else>{{ emoji }}</template>
    </span>
    <span class="taco-title__title"
          :style="{color: forceTextColor}">{{ title }}</span>
  </component>

</template>

<style lang="scss" scoped>
.taco-title__icon-img {
  height: 1.75rem;
  width: auto;
  vertical-align: middle;
  border-radius: 50%;
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
      required: false,
      default: '',
    },
    iconSrc: {
      type: String,
      required: false,
      default: '',
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
