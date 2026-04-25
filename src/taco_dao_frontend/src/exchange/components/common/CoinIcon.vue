<template>
  <div class="tx-coin" :class="{ 'tx-coin--img': iconUrl }" :style="style">
    <img
      v-if="iconUrl"
      :src="iconUrl"
      :alt="symbol"
      :width="size"
      :height="size"
      class="tx-coin__img"
      @error="onImgError"
    />
    <slot v-else>{{ label }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getTokenIcon } from '../../utils/token-icons'

const props = withDefaults(defineProps<{
  symbol: string
  /** Optional token name — improves icon lookup hit-rate. */
  name?: string
  /** Background color used for the letter-fallback circle. */
  color?: string
  size?: number
}>(), {
  color: 'var(--tx-orange)',
  size: 26,
})

const imgFailed = ref(false)
const iconUrl = computed<string | null>(() => {
  if (imgFailed.value) return null
  return getTokenIcon(props.symbol, props.name)
})
function onImgError() {
  imgFailed.value = true
}

const label = computed(() => props.symbol.slice(0, 2))
const fontSize = computed(() => {
  if (props.size <= 18) return 8
  if (props.size <= 22) return 9
  if (props.size <= 30) return 10
  return 12
})
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  background: iconUrl.value ? 'transparent' : props.color,
  fontSize: `${fontSize.value}px`,
}))
</script>

<style scoped>
.tx-coin {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: -0.02em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  font-family: var(--font-ui);
  overflow: hidden;
}
.tx-coin--img {
  box-shadow: none;
}
.tx-coin__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
</style>
