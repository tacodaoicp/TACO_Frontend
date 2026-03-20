<template>

  <div class="swap-progress" :class="`swap-progress--${status}`">

    <!-- step list -->
    <div class="swap-progress__steps">
      <div v-for="(step, idx) in steps" :key="step.key"
           class="swap-progress__step"
           :class="stepClass(idx)">

        <!-- connector line (above, except first) -->
        <div v-if="idx > 0" class="swap-progress__connector"
             :class="{ 'swap-progress__connector--filled': currentStep >= idx }" />

        <!-- icon -->
        <div class="swap-progress__icon">
          <i v-if="isStepCompleted(idx)" class="fa-solid fa-check" />
          <i v-else-if="isStepActive(idx)" class="fa-solid fa-spinner fa-spin" />
          <i v-else-if="isStepFailed(idx)" class="fa-solid fa-xmark" />
          <span v-else>{{ idx + 1 }}</span>
        </div>

        <!-- text -->
        <div class="swap-progress__text">
          <span class="swap-progress__label">{{ step.label }}</span>
          <span class="swap-progress__desc">{{ stepDescription(step, idx) }}</span>
        </div>

      </div>
    </div>

    <!-- status message (from backend) -->
    <div v-if="statusMessage && status !== 'idle'" class="swap-progress__status">
      <i :class="statusIconClass" />
      <span>{{ statusMessage }}</span>
    </div>

    <!-- amounts -->
    <div v-if="amounts && amounts.length > 0" class="swap-progress__amounts">
      <div v-for="amt in amounts" :key="amt.label" class="swap-progress__amount-row">
        <span class="swap-progress__amount-label">{{ amt.label }}</span>
        <span class="swap-progress__amount-value"
              :class="{ 'swap-progress__amount-value--highlight': amt.highlight }">
          {{ amt.value }}
        </span>
      </div>
    </div>

    <!-- error / retry -->
    <div v-if="errorMessage" class="swap-progress__error">
      <i class="fa-solid fa-circle-exclamation" />
      <div class="swap-progress__error-body">
        <span>{{ errorMessage }}</span>
        <span v-if="isRetrying" class="swap-progress__retry-info">
          Auto-retrying, attempt {{ retryCount }} of {{ maxRetries }}
        </span>
        <span v-else-if="isTerminalFailure" class="swap-progress__retry-info">
          Failed after {{ maxRetries }} attempts. Use the manual claim button below.
        </span>
      </div>
    </div>

    <!-- elapsed time -->
    <div v-if="elapsed != null && elapsed > 0 && status === 'active'" class="swap-progress__elapsed">
      <i class="fa-regular fa-clock" />
      <span>{{ formattedElapsed }}</span>
    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ProgressStep {
  key: string
  label: string
  description: string
  activeDescription?: string
}

export interface ProgressAmount {
  label: string
  value: string
  highlight?: boolean
}

const props = withDefaults(defineProps<{
  steps: ProgressStep[]
  currentStep: number
  status: 'idle' | 'active' | 'complete' | 'failed'
  statusMessage?: string
  retryCount?: number
  maxRetries?: number
  errorMessage?: string | null
  amounts?: ProgressAmount[]
  elapsed?: number
}>(), {
  retryCount: 0,
  maxRetries: 3,
  elapsed: 0,
})

const isRetrying = computed(() =>
  props.status === 'failed' && props.retryCount > 0 && props.retryCount < props.maxRetries
)

const isTerminalFailure = computed(() =>
  props.status === 'failed' && props.retryCount >= props.maxRetries
)

const isStepCompleted = (idx: number): boolean => {
  if (props.status === 'complete' && idx === props.steps.length - 1) return true
  return props.currentStep > idx
}

const isStepActive = (idx: number): boolean => {
  if (props.status === 'failed') return false
  if (props.status === 'complete') return false
  return props.currentStep === idx
}

const isStepFailed = (idx: number): boolean => {
  return props.status === 'failed' && props.currentStep === idx
}

const stepClass = (idx: number) => {
  if (isStepCompleted(idx)) return 'swap-progress__step--completed'
  if (isStepActive(idx)) return 'swap-progress__step--active'
  if (isStepFailed(idx)) return 'swap-progress__step--failed'
  return 'swap-progress__step--pending'
}

const stepDescription = (step: ProgressStep, idx: number): string => {
  if (isStepActive(idx) && step.activeDescription) return step.activeDescription
  return step.description
}

const statusIconClass = computed(() => {
  switch (props.status) {
    case 'active': return 'fa-solid fa-spinner fa-spin'
    case 'complete': return 'fa-solid fa-circle-check'
    case 'failed': return 'fa-solid fa-circle-xmark'
    default: return ''
  }
})

const formattedElapsed = computed(() => {
  const s = props.elapsed ?? 0
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})
</script>

<style scoped lang="scss">
.swap-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: 'Space Mono', monospace;

  // ---- step list ----
  &__steps {
    display: flex;
    flex-direction: column;
  }

  &__step {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0.625rem;
    border-radius: 0.375rem;
    position: relative;
    transition: background-color 0.25s, border-color 0.25s;
    border: 1px solid transparent;

    &--pending {
      opacity: 0.5;
    }

    &--active {
      background: rgba(218, 141, 40, 0.1);
      border-color: var(--dark-orange);
    }

    &--completed {
      opacity: 0.85;
    }

    &--failed {
      background: rgba(235, 0, 0, 0.08);
      border-color: var(--red);
    }
  }

  // ---- connector line ----
  &__connector {
    position: absolute;
    left: calc(0.625rem + 0.875rem); // padding-left + half of icon width
    top: -0.25rem;
    width: 2px;
    height: 0.5rem;
    background: rgba(128, 128, 128, 0.25);
    transition: background-color 0.3s;

    &--filled {
      background: var(--dark-orange);
    }
  }

  // ---- icon ----
  &__icon {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  &__step--pending &__icon {
    background: rgba(128, 128, 128, 0.2);
    color: var(--brown-to-white);
  }

  &__step--active &__icon {
    background: var(--dark-orange);
    color: var(--white);
    box-shadow: 0 0 0 3px rgba(218, 141, 40, 0.25);
  }

  &__step--completed &__icon {
    background: var(--success-green);
    color: var(--white);
  }

  &__step--failed &__icon {
    background: var(--red);
    color: var(--white);
    box-shadow: 0 0 0 3px rgba(235, 0, 0, 0.2);
  }

  // ---- text ----
  &__text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
    padding-top: 0.125rem;
  }

  &__label {
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.2;
  }

  &__desc {
    font-size: 0.7rem;
    opacity: 0.65;
    line-height: 1.3;
  }

  &__step--active &__desc {
    opacity: 0.9;
    color: var(--dark-orange);
  }

  &__step--failed &__desc {
    color: var(--red);
  }

  // ---- status message ----
  &__status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 0.375rem;
    font-size: 0.8rem;
    line-height: 1.4;

    i { font-size: 1rem; flex-shrink: 0; }
  }

  &--complete &__status {
    background: rgba(76, 175, 80, 0.1);
    color: var(--success-green);
  }

  &--failed &__status {
    background: rgba(235, 0, 0, 0.08);
    color: var(--red);
  }

  // ---- amounts ----
  &__amounts {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: rgba(128, 128, 128, 0.06);
    border: 1px solid rgba(128, 128, 128, 0.15);
    border-radius: 0.375rem;
  }

  &__amount-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  &__amount-label {
    opacity: 0.7;
  }

  &__amount-value {
    font-weight: 700;
    color: var(--dark-orange);

    &--highlight {
      color: var(--success-green);
    }
  }

  // ---- error ----
  &__error {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(235, 0, 0, 0.08);
    border: 1px solid rgba(235, 0, 0, 0.2);
    border-radius: 0.375rem;
    color: var(--red);
    font-size: 0.8rem;

    > i { margin-top: 0.15rem; flex-shrink: 0; }
  }

  &__error-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__retry-info {
    font-size: 0.7rem;
    font-style: italic;
    opacity: 0.8;
  }

  // ---- elapsed ----
  &__elapsed {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.7rem;
    opacity: 0.5;

    i { font-size: 0.75rem; }
  }
}
</style>
