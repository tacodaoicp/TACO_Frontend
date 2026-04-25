<template>
  <div class="tx-stats tx-row">
    <template v-for="(s, i) in stats" :key="s.eyebrow">
      <div v-if="i > 0" class="tx-stats__divider" />
      <div class="tx-stats__cell">
        <div class="tx-ink-3 tx-stats__eyebrow">{{ s.eyebrow }}</div>
        <div
          class="tx-stats__value"
          :class="[
            s.mono !== false ? 'tx-mono tx-tnum' : '',
            s.tone ? `tx-${s.tone}` : '',
          ]"
        >
          {{ s.value }}
        </div>
        <div v-if="s.sub" class="tx-stats__sub" :class="s.tone ? `tx-${s.tone}` : 'tx-ink-3'">{{ s.sub }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: Array<{
    eyebrow: string
    value: string | number
    sub?: string
    tone?: 'buy' | 'sell' | 'warning' | 'info' | 'orange' | 'amber'
    mono?: boolean
  }>
}>()
</script>

<style scoped>
.tx-stats { gap: 24px; align-items: stretch; }
.tx-stats__divider {
  width: 1px;
  background: var(--tx-line);
  align-self: stretch;
}
.tx-stats__cell { display: flex; flex-direction: column; }
.tx-stats__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.tx-stats__value {
  font-size: 18px;
  font-weight: 500;
  margin-top: 2px;
}
.tx-stats__sub {
  font-size: 11px;
  margin-top: 2px;
}
</style>
