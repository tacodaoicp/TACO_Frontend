<template>
  <div class="range-selector">
    <div class="range-selector__inputs">
      <!-- Min Price -->
      <div class="range-selector__box">
        <span class="range-selector__box-label">Min price</span>
        <div class="range-selector__box-row">
          <button class="range-selector__adj" @click="adjustLower(-1)">−</button>
          <input
            v-model="lowerDisplay"
            type="text"
            inputmode="decimal"
            class="range-selector__input num"
            @change="onLowerInput"
          />
          <button class="range-selector__adj" @click="adjustLower(1)">+</button>
        </div>
        <span class="range-selector__box-unit">{{ unitLabel }}</span>
      </div>

      <!-- Max Price -->
      <div class="range-selector__box">
        <span class="range-selector__box-label">Max price</span>
        <div class="range-selector__box-row">
          <button class="range-selector__adj" @click="adjustUpper(-1)">−</button>
          <input
            v-model="upperDisplay"
            type="text"
            inputmode="decimal"
            class="range-selector__input num"
            :placeholder="isFullRangeUpper ? '∞' : '0.00'"
            @change="onUpperInput"
          />
          <button class="range-selector__adj" @click="adjustUpper(1)">+</button>
        </div>
        <span class="range-selector__box-unit">{{ unitLabel }}</span>
      </div>
    </div>

    <!-- Quick Range Buttons: ±X% from current price -->
    <div class="range-selector__quick-range">
      <button v-for="pct in [5, 10, 20, 50, 75]" :key="pct"
        class="range-selector__quick-btn"
        @click="setPercentRange(pct)"
      >± {{ pct }}%</button>
    </div>

    <!-- Action Buttons -->
    <div class="range-selector__actions">
      <button class="range-selector__action-btn" @click="setAutoRange">Auto</button>
      <button class="range-selector__action-btn" @click="setFullRange">Full Range</button>
      <button class="range-selector__action-btn" @click="resetRange">Reset</button>
    </div>

    <!-- Efficiency Display -->
    <div v-if="efficiency > 1.01 && !isFullRangeBoth" class="range-selector__efficiency">
      {{ efficiency.toFixed(1) }}x capital efficiency vs full range
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { capitalEfficiency } from '../../utils/concentrated'

const props = defineProps<{
  currentPrice: number
  decimals0: number
  decimals1: number
  symbol0: string
  symbol1: string
  modelLower: number
  modelUpper: number
}>()

const emit = defineEmits<{
  'update:modelLower': [value: number]
  'update:modelUpper': [value: number]
}>()

import { formatRangePrice } from '../../utils/concentrated'

const lowerDisplay = ref(props.modelLower > 0 ? formatRangePrice(props.modelLower, 8) : '')
const upperDisplay = ref(props.modelUpper > 0 && isFinite(props.modelUpper) ? formatRangePrice(props.modelUpper, 8) : '')

const unitLabel = computed(() => `${props.symbol0} per ${props.symbol1}`)

const isFullRangeUpper = computed(() => !isFinite(props.modelUpper) || props.modelUpper >= 1e15)
const isFullRangeBoth = computed(() => props.modelLower <= 0 && isFullRangeUpper.value)

const efficiency = computed(() => {
  if (props.modelLower <= 0 || props.modelUpper <= props.modelLower || !isFinite(props.modelUpper)) return 1
  return capitalEfficiency(props.modelLower, props.modelUpper)
})

function getStep(): number {
  return Math.max(props.currentPrice * 0.01, 10 ** (-Math.min(props.decimals1, 8)))
}

function adjustLower(dir: number) {
  const step = getStep()
  const newVal = Math.max(0, props.modelLower + step * dir)
  emit('update:modelLower', newVal)
  lowerDisplay.value = newVal.toString()
}

function adjustUpper(dir: number) {
  const step = getStep()
  const newVal = Math.max(props.modelLower + step, props.modelUpper + step * dir)
  emit('update:modelUpper', newVal)
  upperDisplay.value = newVal.toString()
}

function onLowerInput() {
  const val = parseFloat(lowerDisplay.value)
  if (!isNaN(val) && val >= 0) emit('update:modelLower', val)
}

function onUpperInput() {
  const val = parseFloat(upperDisplay.value)
  if (!isNaN(val) && val > 0) emit('update:modelUpper', val)
}

/** Set range as ±X% from current price */
function setPercentRange(pct: number) {
  if (props.currentPrice <= 0) return
  const lower = props.currentPrice * (1 - pct / 100)
  const upper = props.currentPrice * (1 + pct / 100)
  emit('update:modelLower', Math.max(0, lower))
  emit('update:modelUpper', upper)
  lowerDisplay.value = formatRangePrice(Math.max(0, lower), 8)
  upperDisplay.value = formatRangePrice(upper, 8)
}

/** Auto: use ±25% from current price (sensible default) */
function setAutoRange() {
  setPercentRange(25)
}

/** Full range: 0 to infinity */
function setFullRange() {
  emit('update:modelLower', 0)
  emit('update:modelUpper', Infinity)
  lowerDisplay.value = '0'
  upperDisplay.value = ''
}

/** Reset: clear both inputs */
function resetRange() {
  emit('update:modelLower', 0)
  emit('update:modelUpper', Infinity)
  lowerDisplay.value = ''
  upperDisplay.value = ''
}

watch(() => props.modelLower, v => { lowerDisplay.value = v > 0 ? formatRangePrice(v, 8) : '0' })
watch(() => props.modelUpper, v => { upperDisplay.value = isFinite(v) && v < 1e15 ? formatRangePrice(v, 8) : '' })
</script>

<style scoped lang="scss">
.range-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &__inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  &__box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: var(--space-2) var(--space-3);
  }

  &__box-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__box-row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    width: 100%;
  }

  &__adj {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: var(--text-lg);
    cursor: pointer;
    flex-shrink: 0;

    &:hover { border-color: var(--accent-primary); }
    &:active { background: var(--bg-elevated); }
  }

  &__input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    text-align: center;
    outline: none;

    &::placeholder { color: var(--text-tertiary); }
  }

  &__box-unit {
    font-size: 9px;
    color: var(--text-tertiary);
  }

  &__quick-range {
    display: flex;
    gap: 4px;
  }

  &__quick-btn {
    flex: 1;
    padding: var(--space-1) 2px;
    border: 1px solid var(--border-secondary);
    border-radius: 4px;
    background: none;
    color: var(--text-secondary);
    font-size: var(--text-xs);
    cursor: pointer;
    white-space: nowrap;

    &:hover { border-color: var(--accent-primary); color: var(--text-primary); }
  }

  &__actions {
    display: flex;
    gap: var(--space-2);
  }

  &__action-btn {
    padding: var(--space-1) var(--space-3);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;

    &:hover { border-color: var(--accent-primary); color: var(--text-primary); }
  }

  &__efficiency {
    font-size: var(--text-xs);
    color: var(--color-buy);
    font-weight: var(--weight-semibold);
    text-align: center;
  }
}
</style>
