<template>
  <img
    v-if="src && !broken"
    :src="src"
    class="tk-coin"
    :width="size"
    :height="size"
    :style="{ width: size + 'px', height: size + 'px' }"
    alt=""
    @error="broken = true"
  />
  <span v-else class="tk-coin tk-coin--letter" :style="{ width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.42) + 'px' }" aria-hidden="true">
    {{ token?.symbol?.charAt(0) ?? '?' }}
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getTokenIcon, iconCacheVersion } from '../../utils/token-icons'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

const props = withDefaults(defineProps<{ token: TokenInfo | null; size?: number }>(), { size: 26 })
const broken = ref(false)
const src = computed(() => {
  void iconCacheVersion.value
  const t = props.token
  return t ? getTokenIcon(t.symbol, t.name, t.address) : null
})
</script>

<style scoped lang="scss">
.tk-coin {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  display: block;
  &--letter {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--tx-orange-dim); color: var(--tx-orange); font-weight: 700;
  }
}
</style>
