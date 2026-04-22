<template>
  <div class="slippage-selector">
    <div class="slippage-selector__header">
      <span class="slippage-selector__label">Slippage Tolerance</span>
      <span class="slippage-selector__value num" :class="slippageClass">
        {{ modelValue.toFixed(1) }}%
      </span>
    </div>
    <div class="slippage-selector__options">
      <button
        v-for="preset in PRESETS"
        :key="preset"
        class="slippage-selector__preset"
        :class="{ 'slippage-selector__preset--active': !isCustom && modelValue === preset }"
        @click="selectPreset(preset)"
      >
        {{ preset }}%
      </button>
      <div class="slippage-selector__custom" :class="{ 'slippage-selector__custom--active': isCustom }">
        <input
          type="number"
          class="slippage-selector__input num"
          :value="isCustom ? customValue : ''"
          placeholder="Custom"
          step="0.1"
          min="0.01"
          max="10"
          @input="onCustomInput"
          @focus="isCustom = true"
        />
        <span class="slippage-selector__suffix">%</span>
      </div>
    </div>
    <div v-if="warningMessage" class="slippage-selector__warning" :class="warningLevel === 'danger' ? 'ex-error-box' : warningLevel === 'warning' ? 'ex-warning-box' : ''">
      {{ warningMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const PRESETS = [0.1, 0.5, 1.0]

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isCustom = ref(false)
const customValue = ref('')

function selectPreset(value: number) {
  isCustom.value = false
  customValue.value = ''
  emit('update:modelValue', value)
  persistSlippage(value)
}

function onCustomInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  customValue.value = (e.target as HTMLInputElement).value
  if (isNaN(val) || val <= 0) return
  if (val > 10) return // reject > 10%
  isCustom.value = true
  emit('update:modelValue', val)
  persistSlippage(val)
}

function persistSlippage(value: number) {
  localStorage.setItem('taco_slippage', JSON.stringify({
    mode: isCustom.value ? 'custom' : 'preset',
    value,
  }))
}

const warningLevel = computed(() => {
  if (props.modelValue <= 2) return 'none'
  if (props.modelValue <= 5) return 'warning'
  if (props.modelValue <= 10) return 'danger'
  return 'blocked'
})

const warningMessage = computed(() => {
  if (props.modelValue <= 2) return ''
  if (props.modelValue <= 5) return 'High slippage. You may receive significantly less.'
  if (props.modelValue <= 10) return 'Very high slippage!'
  return 'Slippage too high. Maximum 10%.'
})

const slippageClass = computed(() => {
  if (props.modelValue <= 2) return ''
  if (props.modelValue <= 5) return 'slippage-selector__value--warning'
  return 'slippage-selector__value--danger'
})
</script>

<style scoped lang="scss">
.slippage-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  &__value {
    font-size: var(--text-sm);
    color: var(--text-primary);

    &--warning { color: var(--color-warning); }
    &--danger { color: var(--color-sell); }
  }

  &__options {
    display: flex;
    gap: var(--space-1);
  }

  &__preset {
    flex: 1;
    height: 32px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: var(--accent-primary); }
    &--active {
      background: var(--accent-primary-muted);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      font-weight: var(--weight-semibold);
    }
  }

  &__custom {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;

    &--active .slippage-selector__input {
      border-color: var(--accent-primary);
    }
  }

  &__input {
    width: 100%;
    height: 32px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: var(--text-sm);
    padding: 0 24px 0 8px;
    outline: none;

    &:focus { border-color: var(--accent-primary); }
    &::placeholder { color: var(--text-tertiary); }
  }

  &__suffix {
    position: absolute;
    right: 8px;
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    pointer-events: none;
  }

  &__warning {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    border-left: none;
  }
}
</style>
