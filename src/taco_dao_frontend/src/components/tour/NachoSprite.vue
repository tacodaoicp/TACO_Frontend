<template>
  <div class="tour-sprite tour-sprite--nacho"
       :class="[
         `tour-sprite--${position}`,
         actionClass,
         { 'tour-sprite--talking': isTalking }
       ]">

    <!-- sprite wrapper (handles idle bob) -->
    <div class="tour-sprite__body">

      <!-- placeholder nacho shape — swap for custom artwork -->
      <svg class="tour-sprite__img"
           viewBox="0 0 100 110"
           xmlns="http://www.w3.org/2000/svg">
        <!-- nacho chip body (triangle) -->
        <polygon points="50,5 5,100 95,100"
                 fill="#D4A017" stroke="#B8860B" stroke-width="2"/>
        <!-- cheese drip on left corner -->
        <path d="M15,85 Q8,95 12,100 L5,100 Q10,90 15,85Z" fill="#FF8C00" opacity="0.8"/>
        <!-- texture spots -->
        <circle cx="40" cy="55" r="2" fill="#C49000" opacity="0.5"/>
        <circle cx="60" cy="65" r="1.5" fill="#C49000" opacity="0.5"/>
        <circle cx="45" cy="75" r="2.5" fill="#C49000" opacity="0.4"/>
        <circle cx="55" cy="45" r="1.5" fill="#C49000" opacity="0.4"/>
      </svg>

      <!-- face overlay (rendered using selected face style) -->
      <svg class="tour-sprite__face"
           viewBox="0 0 60 40"
           xmlns="http://www.w3.org/2000/svg">

        <!-- eyes (injected from faceStyle) -->
        <g class="tour-sprite__eyes" v-html="faceMarkup.eyes"></g>

        <!-- mouth (injected from faceStyle) -->
        <g class="tour-sprite__mouth" v-html="faceMarkup.mouth"></g>

      </svg>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Expression, Action } from './tourScript'
import type { FaceStyle } from './faceStyles'
import { renderFace } from './faceStyles'

const props = withDefaults(defineProps<{
  expression: Expression
  isTalking: boolean
  action: Action
  position: 'left' | 'right' | 'center'
  faceStyle?: FaceStyle
}>(), {
  faceStyle: 'standard'
})

// Blink system
const isBlinking = ref(false)
let blinkTimer: ReturnType<typeof setTimeout> | null = null

function scheduleBlink() {
  const delay = 3000 + Math.random() * 4000
  blinkTimer = setTimeout(() => {
    isBlinking.value = true
    setTimeout(() => {
      isBlinking.value = false
      scheduleBlink()
    }, 150)
  }, delay)
}

onMounted(() => scheduleBlink())
onUnmounted(() => {
  if (blinkTimer) clearTimeout(blinkTimer)
})

// Mouth animation for talking
const mouthOpen = ref(false)
let mouthTimer: ReturnType<typeof setInterval> | null = null

watch(() => props.isTalking, (talking) => {
  if (talking) {
    mouthOpen.value = true
    mouthTimer = setInterval(() => {
      mouthOpen.value = !mouthOpen.value
    }, 100)
  } else {
    if (mouthTimer) clearInterval(mouthTimer)
    mouthTimer = null
    mouthOpen.value = false
  }
}, { immediate: true })

onUnmounted(() => {
  if (mouthTimer) clearInterval(mouthTimer)
})

// Action CSS class
const actionClass = computed(() => {
  if (!props.action || props.action === 'idle') return 'tour-sprite--idle'
  return `tour-sprite--${props.action}`
})

// Render face using selected style
const faceMarkup = computed(() => {
  return renderFace(props.faceStyle, {
    expression: props.expression,
    isBlinking: isBlinking.value,
    mouthOpen: mouthOpen.value,
    color: '#3d2b1f' // Slightly different color for NACHO
  })
})
</script>

<style scoped lang="scss">

.tour-sprite {
  position: absolute;
  bottom: 0;
  width: 10rem;
  height: 14rem;
  z-index: 100001;
  pointer-events: none;
  transition: left 0.5s ease, right 0.5s ease, opacity 0.3s ease;

  &--left {
    left: 5%;
  }
  &--right {
    right: 5%;
  }
  &--center {
    left: 50%;
    transform: translateX(-50%);
  }

  &--idle &__body {
    animation: sprite-bob 2.5s ease-in-out infinite;
  }

  &--talking &__body {
    transform: rotate(2deg) translateY(-2px);
  }

  &--enter {
    animation: sprite-enter-right 0.5s ease-out forwards;
  }
  &--exit {
    animation: sprite-exit-right 0.4s ease-in forwards;
  }

  &--bounce &__body {
    animation: sprite-bounce 0.5s ease-out, sprite-bob 2.5s ease-in-out infinite 0.5s;
  }

  &--shake &__body {
    animation: sprite-shake 0.4s ease-in-out, sprite-bob 2.5s ease-in-out infinite 0.4s;
  }

  &__body {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  &__img {
    width: 70%;
    height: auto;
    filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3));
  }

  &__face {
    position: absolute;
    width: 42%;
    top: 22%;
    left: 29%;
    pointer-events: none;
  }
}

// Keyframes
@keyframes sprite-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes sprite-enter-right {
  0% { transform: translateX(120%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes sprite-exit-right {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
}

@keyframes sprite-bounce {
  0% { transform: translateY(0) scaleY(1); }
  30% { transform: translateY(-20px) scaleY(1.1) scaleX(0.95); }
  50% { transform: translateY(0) scaleY(0.9) scaleX(1.05); }
  70% { transform: translateY(-8px) scaleY(1.05); }
  100% { transform: translateY(0) scaleY(1); }
}

@keyframes sprite-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px) rotate(-3deg); }
  30% { transform: translateX(8px) rotate(3deg); }
  45% { transform: translateX(-6px) rotate(-2deg); }
  60% { transform: translateX(6px) rotate(2deg); }
  75% { transform: translateX(-3px); }
}

// Mobile
@media (max-width: 600px) {
  .tour-sprite {
    width: 7rem;
    height: 10rem;
  }
}
</style>
