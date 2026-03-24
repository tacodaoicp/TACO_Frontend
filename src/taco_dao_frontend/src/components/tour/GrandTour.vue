<template>

  <!-- grand tour overlay -->
  <div v-if="active" class="grand-tour">

    <!-- semi-transparent backdrop (click-through except on dialog) -->
    <div class="grand-tour__backdrop"></div>

    <!-- settings panel -->
    <div class="grand-tour__settings">
      <div class="grand-tour__settings__row">
        <label for="face-style-select" class="grand-tour__settings__label">
          Style:
        </label>
        <select id="face-style-select"
                v-model="selectedFaceStyle"
                class="grand-tour__settings__select">
          <option v-for="(name, key) in faceStyleNames"
                  :key="key"
                  :value="key">
            {{ name }}
          </option>
        </select>
      </div>

      <div class="grand-tour__settings__row">
        <label for="test-expression-select" class="grand-tour__settings__label">
          Test Emote:
        </label>
        <select id="test-expression-select"
                v-model="testExpression"
                class="grand-tour__settings__select">
          <option value="auto">Auto (Follow Script)</option>
          <option value="neutral">Neutral</option>
          <option value="happy">Happy</option>
          <option value="sad">Sad</option>
          <option value="angry">Angry</option>
          <option value="surprised">Surprised</option>
          <option value="excited">Excited</option>
          <option value="confused">Confused</option>
          <option value="suspicious">Suspicious</option>
          <option value="embarrassed">Embarrassed</option>
          <option value="smug">Smug</option>
        </select>
      </div>
    </div>

    <!-- screen flash (for slap effect) -->
    <div v-if="screenFlash" class="grand-tour__flash"></div>

    <!-- sprite stage -->
    <div class="grand-tour__stage" :class="{ 'grand-tour__stage--shake': screenShake }">

      <!-- TACO sprite -->
      <TacoSprite v-if="tacoVisible"
                  :expression="tacoExpression"
                  :is-talking="tacoTalking"
                  :action="tacoAction"
                  :face-style="selectedFaceStyle"
                  position="left" />

      <!-- NACHO sprite -->
      <NachoSprite v-if="nachoVisible"
                   :expression="nachoExpression"
                   :is-talking="nachoTalking"
                   :action="nachoAction"
                   :face-style="selectedFaceStyle"
                   position="right" />

    </div>

    <!-- dialog box -->
    <VNDialogBox ref="dialogRef"
                 :text="currentText"
                 :speaker-name="currentSpeakerName"
                 :speaker-color="currentSpeakerColor"
                 :visible="dialogVisible"
                 :choices="currentChoices"
                 :show-choices="showingChoices"
                 @typing="onTyping"
                 @done="onTypingDone"
                 @advance="onAdvance"
                 @choice="onChoice"
                 @skip="endTour" />

  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import TacoSprite from './TacoSprite.vue'
import NachoSprite from './NachoSprite.vue'
import VNDialogBox from './VNDialogBox.vue'
import { tourScript, characterConfig } from './tourScript'
import type { Expression, Action, TourChoice, DialogueLine } from './tourScript'
import { faceStyleNames, type FaceStyle } from './faceStyles'

const router = useRouter()

// ──────────────────────────────────
// Props & Emits
// ──────────────────────────────────
const props = defineProps<{ active: boolean }>()
const emit = defineEmits<{ end: [] }>()

// ──────────────────────────────────
// Scene State Machine
// ──────────────────────────────────
const sceneIndex = ref(0)
const lineIndex = ref(0)
const dialogVisible = ref(false)
const dialogRef = ref<InstanceType<typeof VNDialogBox> | null>(null)

// Inline choice response lines (when user picks a FAQ option)
const choiceResponseLines = ref<DialogueLine[]>([])
const choiceResponseIndex = ref(0)
const inChoiceResponse = ref(false)

// Current scene and line
const currentScene = computed(() => tourScript[sceneIndex.value])
const currentLine = computed<DialogueLine | null>(() => {
  if (inChoiceResponse.value && choiceResponseLines.value.length > 0) {
    return choiceResponseLines.value[choiceResponseIndex.value] ?? null
  }
  if (!currentScene.value) return null
  return currentScene.value.lines[lineIndex.value] ?? null
})

// ──────────────────────────────────
// Text & Speaker
// ──────────────────────────────────
const currentText = computed(() => currentLine.value?.text ?? '')
const currentSpeakerName = computed(() => {
  if (!currentLine.value) return ''
  return characterConfig[currentLine.value.character].name
})
const currentSpeakerColor = computed(() => {
  if (!currentLine.value) return ''
  return characterConfig[currentLine.value.character].color
})

// Choices
const currentChoices = computed<TourChoice[]>(() => {
  if (inChoiceResponse.value) return []
  return currentLine.value?.choices ?? []
})
const showingChoices = ref(false)

// ──────────────────────────────────
// Sprite State
// ──────────────────────────────────
const tacoVisible = ref(false)
const nachoVisible = ref(false)

const tacoExpression = ref<Expression>('neutral')
const tacoAction = ref<Action>('idle')
const tacoTalking = ref(false)

const nachoExpression = ref<Expression>('neutral')
const nachoAction = ref<Action>('idle')
const nachoTalking = ref(false)

// Screen effects
const screenShake = ref(false)
const screenFlash = ref(false)

// Face style selection (persisted in localStorage)
const selectedFaceStyle = useStorage<FaceStyle>('grandTourFaceStyle', 'standard')

// Test expression override (for testing emotes)
const testExpression = ref<Expression | 'auto'>('auto')

// ──────────────────────────────────
// Pause timer
// ──────────────────────────────────
let pauseTimer: ReturnType<typeof setTimeout> | null = null

function clearPauseTimer() {
  if (pauseTimer) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }
}

// ──────────────────────────────────
// Update sprite states from current line
// ──────────────────────────────────
function applySpriteState(line: DialogueLine) {
  const primary = line.character

  // Use test expression if override is active, otherwise use script expression
  const effectiveExpression = testExpression.value !== 'auto' ? testExpression.value as Expression : line.expression

  if (primary === 'taco') {
    tacoExpression.value = effectiveExpression
    tacoAction.value = line.action
  } else if (primary === 'nacho') {
    nachoExpression.value = effectiveExpression
    nachoAction.value = line.action
  }

  // Secondary character (for dual scenes)
  if (line.secondary) {
    const sec = line.secondary
    const secEffectiveExpression = testExpression.value !== 'auto' ? testExpression.value as Expression : sec.expression
    if (sec.character === 'taco') {
      tacoExpression.value = secEffectiveExpression
      tacoAction.value = sec.action
    } else if (sec.character === 'nacho') {
      nachoExpression.value = secEffectiveExpression
      nachoAction.value = sec.action
    }
  }

  // Handle enter/exit for character visibility
  if (line.action === 'enter') {
    if (primary === 'taco') tacoVisible.value = true
    if (primary === 'nacho') nachoVisible.value = true
  }
  if (line.action === 'exit') {
    setTimeout(() => {
      if (primary === 'taco') tacoVisible.value = false
      if (primary === 'nacho') nachoVisible.value = false
    }, 500) // after exit animation
  }

  // Slap screen effect
  if (line.action === 'slap-screen') {
    triggerScreenSlap()
  }
}

function triggerScreenSlap() {
  screenFlash.value = true
  setTimeout(() => { screenFlash.value = false }, 120)

  screenShake.value = true
  setTimeout(() => { screenShake.value = false }, 500)
}

// ──────────────────────────────────
// Event Handlers
// ──────────────────────────────────
function onTyping() {
  if (!currentLine.value) return
  const speaker = currentLine.value.character
  if (speaker === 'taco') {
    tacoTalking.value = true
    nachoTalking.value = false
  } else {
    nachoTalking.value = true
    tacoTalking.value = false
  }
}

function onTypingDone() {
  tacoTalking.value = false
  nachoTalking.value = false

  // If this line has choices, show them
  if (!inChoiceResponse.value && currentLine.value?.choices?.length) {
    showingChoices.value = true
  }

  // If this line has a pause, auto-advance after the delay
  if (currentLine.value?.pause) {
    pauseTimer = setTimeout(() => {
      onAdvance()
    }, currentLine.value.pause)
  }
}

function onAdvance() {
  clearPauseTimer()

  // If in a choice response, advance through it
  if (inChoiceResponse.value) {
    choiceResponseIndex.value++
    if (choiceResponseIndex.value >= choiceResponseLines.value.length) {
      // Done with choice response — advance past the line that had choices
      inChoiceResponse.value = false
      choiceResponseLines.value = []
      choiceResponseIndex.value = 0
      advanceLine()
    } else {
      applyCurrentLine()
    }
    return
  }

  advanceLine()
}

function advanceLine() {
  const scene = currentScene.value
  if (!scene) return

  lineIndex.value++

  if (lineIndex.value >= scene.lines.length) {
    // Move to next scene
    advanceScene()
  } else {
    applyCurrentLine()
  }
}

async function advanceScene() {
  sceneIndex.value++

  if (sceneIndex.value >= tourScript.length) {
    endTour()
    return
  }

  lineIndex.value = 0
  const nextScene = tourScript[sceneIndex.value]

  // Navigate to the new route
  if (nextScene.route !== router.currentRoute.value.path) {
    dialogVisible.value = false
    await router.push(nextScene.route)
    // Small delay for page to render
    await new Promise(r => setTimeout(r, 600))
    dialogVisible.value = true
  }

  applyCurrentLine()
}

function onChoice(index: number) {
  showingChoices.value = false
  const choices = currentLine.value?.choices
  if (choices && choices[index]) {
    choiceResponseLines.value = choices[index].response
    choiceResponseIndex.value = 0
    inChoiceResponse.value = true
    applyCurrentLine()
  }
}

function applyCurrentLine() {
  const line = currentLine.value
  if (!line) return
  applySpriteState(line)

  // If the line has no text (e.g., a character entrance), auto-advance after animation
  if (!line.text) {
    setTimeout(() => {
      onAdvance()
    }, 600)
  }
}

// ──────────────────────────────────
// Start / End Tour
// ──────────────────────────────────
async function startTour() {
  sceneIndex.value = 0
  lineIndex.value = 0
  inChoiceResponse.value = false
  showingChoices.value = false
  tacoVisible.value = true
  nachoVisible.value = false

  const firstScene = tourScript[0]
  if (firstScene.route !== router.currentRoute.value.path) {
    await router.push(firstScene.route)
    await new Promise(r => setTimeout(r, 400))
  }

  await nextTick()
  dialogVisible.value = true
  applyCurrentLine()
}

function endTour() {
  clearPauseTimer()
  dialogVisible.value = false
  tacoVisible.value = false
  nachoVisible.value = false
  tacoTalking.value = false
  nachoTalking.value = false

  setTimeout(() => {
    emit('end')
  }, 300)
}

// Auto-start when active becomes true
watch(() => props.active, async (isActive) => {
  if (isActive) {
    await startTour()
  }
}, { immediate: true })

onUnmounted(() => {
  clearPauseTimer()
})
</script>

<style scoped lang="scss">

.grand-tour {
  position: fixed;
  inset: 0;
  z-index: 100000;
  pointer-events: none;

  // Backdrop — subtle darkening so sprites and dialog pop
  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: auto;
  }

  // Settings panel (face style + emote selector)
  &__settings {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(10, 10, 20, 0.9);
    padding: 0.5rem 0.75rem;
    border: 3px solid #C89632;
    box-shadow:
      3px 3px 0 0 #8B6914,
      -3px 3px 0 0 #8B6914,
      3px -3px 0 0 #8B6914,
      -3px -3px 0 0 #8B6914;
    z-index: 100004;
    pointer-events: auto;

    &__row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    &__label {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      color: #f0f0f0;
      margin: 0;
      min-width: 4rem;
    }

    &__select {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      color: #f0f0f0;
      background: rgba(30, 30, 40, 0.95);
      border: 2px solid #C89632;
      padding: 0.25rem 0.5rem;
      border-radius: 0;
      cursor: pointer;
      outline: none;
      min-width: 120px;

      &:focus {
        border-color: #FFD700;
      }
    }
  }

  // Sprite stage — positioned above dialog
  &__stage {
    position: absolute;
    bottom: 9rem; // above the dialog box
    left: 0;
    right: 0;
    height: 14rem;
    pointer-events: none;

    // screen shake effect
    &--shake {
      animation: screen-shake 0.5s ease-in-out;
    }
  }

  // Screen flash (slap effect)
  &__flash {
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0.7;
    z-index: 100003;
    pointer-events: none;
    animation: flash-fade 0.15s ease-out forwards;
  }
}

// screen shake
@keyframes screen-shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-10px, -5px); }
  20% { transform: translate(10px, 5px); }
  30% { transform: translate(-8px, 3px); }
  40% { transform: translate(8px, -3px); }
  50% { transform: translate(-5px, 5px); }
  60% { transform: translate(5px, -2px); }
  70% { transform: translate(-3px, 2px); }
  80% { transform: translate(3px, -1px); }
  90% { transform: translate(-1px, 1px); }
}

@keyframes flash-fade {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

// Mobile
@media (max-width: 600px) {
  .grand-tour__stage {
    bottom: 7rem;
    height: 10rem;
  }

  .grand-tour__settings {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.35rem 0.5rem;
    gap: 0.35rem;

    &__label {
      font-size: 0.6rem;
      min-width: 3rem;
    }

    &__select {
      font-size: 0.6rem;
      padding: 0.2rem 0.35rem;
      min-width: 90px;
    }
  }
}
</style>
