<template>
  <Teleport to="body">
    <div v-if="visible" class="token-selector-overlay" data-theme="exchange" @click.self="$emit('close')">
      <div class="token-selector" role="dialog" aria-label="Select a token">
        <div class="token-selector__header">
          <h3 class="token-selector__title">Select a token</h3>
          <button class="token-selector__close" @click="$emit('close')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="token-selector__search-wrap">
          <input
            ref="searchInput"
            v-model="search"
            class="ex-input token-selector__search"
            placeholder="Search name or paste address"
            @keydown.escape="$emit('close')"
          />
        </div>

        <!-- Popular tokens -->
        <div v-if="!search && popularTokens.length" class="token-selector__popular">
          <span class="token-selector__section-label">Popular</span>
          <div class="token-selector__chips">
            <button
              v-for="token in popularTokens"
              :key="token.address"
              class="token-selector__chip"
              :class="{ 'token-selector__chip--disabled': isDisabled(token) }"
              :disabled="isDisabled(token)"
              @click="selectToken(token)"
            >
              <img v-if="getTokenIcon(token.symbol, token.name)" :src="getTokenIcon(token.symbol, token.name)!" class="token-selector__chip-img" width="18" height="18" />
              <span v-else class="token-selector__chip-icon">{{ token.symbol.charAt(0) }}</span>
              {{ token.symbol }}
            </button>
          </div>
        </div>

        <!-- Token list -->
        <div class="token-selector__list">
          <span class="token-selector__section-label">All Tokens</span>
          <div v-if="filteredTokens.length === 0" class="token-selector__empty">
            No tokens found
          </div>
          <button
            v-for="token in filteredTokens"
            :key="token.address"
            class="token-selector__item"
            :class="{
              'token-selector__item--disabled': isDisabled(token),
              'token-selector__item--selected': isSelected(token),
            }"
            :disabled="isDisabled(token)"
            @click="selectToken(token)"
          >
            <div class="token-selector__item-icon">
              <img v-if="getTokenIcon(token.symbol, token.name)" :src="getTokenIcon(token.symbol, token.name)!" width="28" height="28" style="border-radius:50%;object-fit:cover" />
              <span v-else>{{ token.symbol.charAt(0) }}</span>
            </div>
            <div class="token-selector__item-info">
              <span class="token-selector__item-symbol">{{ token.symbol }}</span>
              <span class="token-selector__item-name">{{ token.name }}</span>
            </div>
            <div v-if="isSelected(token)" class="token-selector__item-badge">
              Selected
            </div>
            <div v-if="token._paused" class="token-selector__item-badge token-selector__item-badge--paused">
              Paused
            </div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useExchangeStore } from '../../store/exchange.store'
import { getTokenIcon } from '../../utils/token-icons'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

type TokenInfoWithPaused = TokenInfo & { _paused?: boolean }

const props = defineProps<{
  visible: boolean
  disabledAddress?: string   // Currently selected in the other field
  selectedAddress?: string   // Currently selected in this field
}>()

const emit = defineEmits<{
  select: [token: TokenInfo]
  close: []
}>()

const store = useExchangeStore()
const search = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

// Focus search on open
watch(() => props.visible, async (val) => {
  if (val) {
    search.value = ''
    await nextTick()
    searchInput.value?.focus()
  }
})

const allTokens = computed((): TokenInfoWithPaused[] => {
  return store.tokens.map(t => ({
    ...t,
    _paused: store.isTokenPaused(t.address),
  }))
})

const popularTokens = computed(() => {
  // Show first 5 tokens as "popular" (ideally sorted by volume)
  return allTokens.value.slice(0, 5)
})

const filteredTokens = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return allTokens.value
  return allTokens.value.filter(t =>
    t.symbol.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q) ||
    t.address.toLowerCase().includes(q)
  )
})

function isDisabled(token: TokenInfoWithPaused): boolean {
  return token.address === props.disabledAddress || !!token._paused
}

function isSelected(token: TokenInfo): boolean {
  return token.address === props.selectedAddress
}

function selectToken(token: TokenInfo) {
  if (isDisabled(token as TokenInfoWithPaused)) return
  emit('select', token)
  emit('close')
}
</script>

<style scoped lang="scss">
.token-selector-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.token-selector {
  width: 420px;
  max-height: 600px;
  background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
  border: 1px solid var(--card-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(15, 5, 0, 0.5);
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: 4px;
    &:hover { color: var(--text-primary); background: var(--bg-tertiary); }
  }

  &__search-wrap {
    padding: var(--space-3) var(--space-4);
  }

  &__search {
    width: 100%;
  }

  &__popular {
    padding: 0 var(--space-4) var(--space-3);
  }

  &__section-label {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: var(--space-2);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  &__chip {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 4px 10px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 16px;
    color: var(--text-primary);
    font-size: var(--text-sm);
    cursor: pointer;

    &:hover:not(:disabled) { border-color: var(--accent-primary); }
    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__chip-img {
    border-radius: 50%;
    object-fit: cover;
  }

  &__chip-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-primary-muted);
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: var(--weight-bold);
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space-4) var(--space-4);
  }

  &__empty {
    padding: var(--space-6);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;

    &:hover:not(:disabled) { background: var(--bg-tertiary); }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--selected {
      background: var(--bg-tertiary);
      opacity: 0.6;
      cursor: default;
    }
  }

  &__item-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent-primary-muted);
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
    flex-shrink: 0;
  }

  &__item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__item-symbol {
    font-weight: var(--weight-semibold);
    font-size: var(--text-base);
  }

  &__item-name {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__item-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--bg-tertiary);

    &--paused {
      color: var(--color-warning);
      background: rgba(196, 90, 10, 0.1);
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
