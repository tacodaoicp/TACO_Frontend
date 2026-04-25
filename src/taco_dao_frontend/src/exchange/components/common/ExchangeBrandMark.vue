<template>
  <div class="tx-logo-mark" :style="sizeStyle">{{ letter }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  letter?: string
}>(), {
  size: 22,
  letter: 't',
})

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.6)}px`,
}))
</script>
