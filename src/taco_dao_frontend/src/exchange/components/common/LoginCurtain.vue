<template>
  <div class="tx-login">
    <div class="tx-login__glow" aria-hidden="true"></div>
    <div class="tx-login__card">
      <div class="tx-login__chip">
        <span class="tx-login__chip-icon">⌧</span>
      </div>

      <h2 class="tx-h1 tx-login__title">
        {{ title }}
        <span v-if="qualifier" class="tx-serif tx-orange">{{ qualifier }}</span>
      </h2>
      <div class="tx-login__sub tx-ink-3">{{ subtitle }}</div>

      <button
        type="button"
        class="tx-btn tx-btn--primary tx-btn--lg tx-btn--block tx-login__cta"
        @click="emit('login')"
      >
        Continue with Internet Identity →
      </button>
      <button
        type="button"
        class="tx-btn tx-btn--ghost tx-btn--sm"
        @click="emit('explore')"
      >
        Explore without logging in
      </button>

      <div class="tx-login__footer">
        <div v-for="f in features" :key="f.title">
          <div class="tx-login__feat-t">{{ f.title }}</div>
          <div class="tx-login__feat-b tx-ink-3">{{ f.body }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  qualifier?: string
  subtitle?: string
  features?: Array<{ title: string; body: string }>
}>(), {
  title: 'Log in',
  qualifier: 'to trade',
  subtitle: 'Connect Internet Identity to see balances, open orders and place trades. Your keys stay on your device.',
  features: () => [
    { title: 'Non-custodial', body: 'Funds sit under your principal, not ours' },
    { title: 'Gas-free',      body: 'Trades settle in IC cycles, not ETH gas' },
    { title: 'Open source',   body: 'Every canister is public & verifiable' },
  ],
})

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'explore'): void
}>()
</script>

<style scoped>
.tx-login {
  width: 100%;
  min-height: 80vh;
  background: var(--tx-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
}
.tx-login__glow {
  position: absolute;
  width: 520px; height: 520px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(242, 139, 58, 0.18), transparent 70%);
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}
.tx-login__card {
  max-width: 400px;
  width: 100%;
  position: relative;
  text-align: center;
}
.tx-login__chip {
  width: 72px; height: 72px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(242, 139, 58, 0.18), rgba(242, 139, 58, 0.04));
  border: 1px solid var(--tx-line-hi);
  display: flex; align-items: center; justify-content: center;
}
.tx-login__chip-icon {
  font-size: 28px;
  color: var(--tx-orange);
}
.tx-login__title {
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: baseline;
  font-size: 32px;
}
.tx-login__title .tx-serif {
  font-size: 22px;
  font-weight: 400;
}
.tx-login__sub {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 22px;
}
.tx-login__cta { margin-bottom: 8px; }
.tx-login__footer {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--tx-line);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  text-align: left;
}
.tx-login__feat-t {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.tx-login__feat-b {
  font-size: 11px;
  margin-top: 3px;
  line-height: 1.45;
}
</style>
