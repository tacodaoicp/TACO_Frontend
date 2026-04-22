<template>
  <div class="vn-dialog" :class="{ 'vn-dialog--visible': visible }">

    <!-- pixel border wrapper -->
    <div class="vn-dialog__box">

      <!-- name plate -->
      <div v-if="speakerName"
           class="vn-dialog__nameplate"
           :class="{ 'vn-dialog__nameplate--right': speakerSide === 'right' }"
           :style="{ backgroundColor: speakerColor }">
        {{ speakerName }}
      </div>

      <!-- text area -->
      <div class="vn-dialog__text-area">

        <!-- displayed text with typewriter -->
        <span class="vn-dialog__text">{{ displayedText }}</span>

        <!-- blinking cursor while typing -->
        <span v-if="isTyping" class="vn-dialog__cursor">|</span>

      </div>

      <!-- choices (FAQ) -->
      <div v-if="showChoices && choices.length > 0" class="vn-dialog__choices">
        <button v-for="(choice, i) in choices"
                :key="i"
                class="vn-dialog__choice-btn"
                @click="$emit('choice', i)">
          {{ choice.label }}
        </button>
      </div>

      <!-- continue indicator -->
      <div v-if="!isTyping && !showChoices && !isPaused" class="vn-dialog__continue">
        <span class="vn-dialog__continue-arrow">&#9660;</span>
      </div>

      <!-- skip button -->
      <button class="vn-dialog__skip"
              :class="{ 'vn-dialog__skip--left': speakerSide === 'right' }"
              @click="$emit('skip')">
        SKIP &gt;&gt;
      </button>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { TourChoice } from './tourScript'

const props = defineProps<{
  text: string
  speakerName: string
  speakerColor: string
  speakerSide: 'left' | 'right'
  visible: boolean
  choices: TourChoice[]
  showChoices: boolean
  isPaused: boolean
}>()

const emit = defineEmits<{
  typing: []
  done: []
  advance: []
  choice: [index: number]
  skip: []
}>()

// Typewriter state
const displayedText = ref('')
const isTyping = ref(false)
let typeTimer: ReturnType<typeof setTimeout> | null = null
const TYPE_SPEED = 35 // ms per character

function clearTypeTimer() {
  if (typeTimer) {
    clearTimeout(typeTimer)
    typeTimer = null
  }
}

function typeText(fullText: string) {
  clearTypeTimer()
  displayedText.value = ''
  isTyping.value = true
  emit('typing')

  let index = 0

  function typeNext() {
    if (index < fullText.length) {
      displayedText.value += fullText[index]
      index++
      typeTimer = setTimeout(typeNext, TYPE_SPEED)
    } else {
      isTyping.value = false
      emit('done')
    }
  }

  typeNext()
}

// Complete text instantly (when user presses space mid-sentence)
function completeText() {
  clearTypeTimer()
  displayedText.value = props.text
  isTyping.value = false
  emit('done')
}

// Watch for text changes to restart typewriter
watch(() => props.text, (newText) => {
  if (newText) {
    typeText(newText)
  }
}, { immediate: true })

// Keyboard handler
function onKeyDown(e: KeyboardEvent) {
  if (!props.visible || props.isPaused) return
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    if (isTyping.value) {
      completeText()
    } else if (!props.showChoices) {
      emit('advance')
    }
  }
  if (e.code === 'Escape') {
    emit('skip')
  }
}

// Click handler for mobile
function onClick() {
  if (!props.visible || props.isPaused) return
  if (isTyping.value) {
    completeText()
  } else if (!props.showChoices) {
    emit('advance')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('click', onClick)
})

onUnmounted(() => {
  clearTypeTimer()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('click', onClick)
})

defineExpose({ isTyping })
</script>

<style scoped lang="scss">

// Pixel border using box-shadow stacking
// Creates a stepped/pixelated border look like a Game Boy / Pokemon textbox
$pixel: 3px;
$border-color: #C89632;
$border-dark: #8B6914;
$bg-color: rgba(10, 10, 20, 0.92);

.vn-dialog {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 1rem;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;

  &--visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  &__box {
    position: relative;
    max-width: 52rem;
    margin: 0 auto;
    background-color: $bg-color;
    padding: 1.25rem 1.5rem 1rem;
    min-height: 7rem;

    // Pixelated border using layered box-shadows
    // Each shadow is offset to create a stepped pixel edge
    border: #{$pixel} solid $border-color;
    box-shadow:
      // outer pixel corners (stepped look)
      #{$pixel} #{$pixel} 0 0 $border-dark,
      #{-$pixel} #{$pixel} 0 0 $border-dark,
      #{$pixel} #{-$pixel} 0 0 $border-dark,
      #{-$pixel} #{-$pixel} 0 0 $border-dark,
      // second layer for more pixel depth
      #{$pixel * 2} 0 0 0 $border-color,
      #{-$pixel * 2} 0 0 0 $border-color,
      0 #{$pixel * 2} 0 0 $border-color,
      0 #{-$pixel * 2} 0 0 $border-color,
      // outer dark edge
      #{$pixel * 2} #{$pixel} 0 0 $border-dark,
      #{-$pixel * 2} #{$pixel} 0 0 $border-dark,
      #{$pixel * 2} #{-$pixel} 0 0 $border-dark,
      #{-$pixel * 2} #{-$pixel} 0 0 $border-dark,
      #{$pixel} #{$pixel * 2} 0 0 $border-dark,
      #{-$pixel} #{$pixel * 2} 0 0 $border-dark,
      #{$pixel} #{-$pixel * 2} 0 0 $border-dark,
      #{-$pixel} #{-$pixel * 2} 0 0 $border-dark;

    // No border-radius — sharp pixel corners
    border-radius: 0;

    // Inner glow for depth
    &::after {
      content: '';
      position: absolute;
      inset: #{$pixel};
      border: 1px solid rgba($border-color, 0.3);
      pointer-events: none;
    }
  }

  &__nameplate {
    position: absolute;
    top: calc(-1.6rem - #{$pixel});
    left: #{$pixel * 2};
    padding: 0.15rem 0.75rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: 0.05em;
    border: #{$pixel} solid $border-color;
    border-bottom: none;
    background-color: inherit;
    box-shadow:
      #{$pixel} #{-$pixel} 0 0 $border-dark,
      #{-$pixel} #{-$pixel} 0 0 $border-dark,
      #{$pixel * 2} 0 0 0 $border-color,
      #{-$pixel * 2} 0 0 0 $border-color,
      0 #{-$pixel * 2} 0 0 $border-color;
    border-radius: 0;
  }

  &__nameplate--right {
    left: auto !important;
    right: #{$pixel * 2};
  }

  &__text-area {
    min-height: 4rem;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  &__text {
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
    line-height: 1.6;
    color: #f0f0f0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__cursor {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
    color: $border-color;
    animation: cursor-blink 0.6s step-end infinite;
  }

  // Choices
  &__choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  &__choice-btn {
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    color: #f0f0f0;
    background: rgba($border-color, 0.15);
    border: 2px solid $border-color;
    padding: 0.4rem 1rem;
    cursor: pointer;
    transition: background 0.15s ease;
    border-radius: 0;

    &:hover {
      background: rgba($border-color, 0.35);
      color: #fff;
    }
  }

  // Continue arrow (bottom right, bouncing)
  &__continue {
    position: absolute;
    bottom: 0.5rem;
    right: 0.75rem;
  }

  &__continue-arrow {
    display: inline-block;
    font-size: 0.75rem;
    color: $border-color;
    animation: arrow-bounce 0.8s ease-in-out infinite;
  }

  // Skip button
  &__skip {
    position: absolute;
    top: -1.6rem;
    right: #{$pixel * 2};
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    color: rgba(#f0f0f0, 0.5);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.15rem 0.4rem;
    transition: color 0.15s ease;

    &:hover {
      color: rgba(#f0f0f0, 0.9);
    }

    &--left {
      right: auto;
      left: #{$pixel * 2};
    }
  }
}

// Animations
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes arrow-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

// Mobile
@media (max-width: 600px) {
  .vn-dialog {
    padding: 0.5rem;

    &__box {
      padding: 1rem;
      min-height: 5.5rem;
    }

    &__text {
      font-size: 0.85rem;
      line-height: 1.5;
    }

    &__choice-btn {
      font-size: 0.75rem;
      padding: 0.3rem 0.75rem;
    }
  }
}
</style>
