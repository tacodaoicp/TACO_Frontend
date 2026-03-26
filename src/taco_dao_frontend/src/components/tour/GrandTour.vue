<template>

  <!-- semi-transparent backdrop — separate stacking context, below highlights -->
  <div v-if="active" class="grand-tour-backdrop"></div>

  <!-- grand tour overlay — above highlights -->
  <div v-if="active" class="grand-tour">

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

    <!-- lightning flash (yellow strobe for battle climax) — after stage so it covers sprites -->
    <div v-if="lightningFlash" class="grand-tour__lightning"></div>

    <!-- whiteout (solid white, fades out after battle climax) — after stage so it covers sprites -->
    <div v-if="whiteoutActive"
         class="grand-tour__whiteout"
         :class="{ 'grand-tour__whiteout--fading': whiteoutFading }">
    </div>

    <!-- dialog box -->
    <VNDialogBox ref="dialogRef"
                 :text="currentText"
                 :speaker-name="currentSpeakerName"
                 :speaker-color="currentSpeakerColor"
                 :speaker-side="currentSpeakerSide"
                 :visible="dialogVisible"
                 :choices="currentChoices"
                 :show-choices="showingChoices"
                 :is-paused="isPaused"
                 @typing="onTyping"
                 @done="onTypingDone"
                 @advance="onAdvance"
                 @choice="onChoice"
                 @skip="endTour" />

  </div>

  <!-- wizard prompt modal (shown after tour for new users) -->
  <div v-if="showWizardPrompt" class="taco-modal-overlay" style="z-index: 100003;">
    <div class="taco-modal-dialog" style="max-width: 420px;">
      <div class="taco-modal-header">
        <div class="taco-modal-title">
          <span style="font-size: 1.1rem; font-weight: 700;">Get Started</span>
        </div>
        <button class="taco-modal-close" @click="showWizardPrompt = false">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="taco-modal-body">
        <p style="margin: 0; line-height: 1.6;">
          Since you're new, would you like to visit the <strong>TACO Wizard</strong> to get started step by step?
        </p>
      </div>
      <div class="taco-modal-footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button class="btn taco-btn taco-btn--outline" @click="showWizardPrompt = false">
          No thanks
        </button>
        <button class="btn taco-btn taco-btn--green" @click="openWizard">
          Open Wizard
        </button>
      </div>
    </div>
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
import { useTacoStore } from '../../stores/taco.store'
import {
  applyHighlight,
  clearHighlight,
  scrollToElement,
  clickElement,
  animateSliders,
  toggleBattle,
  escalatingBattle,
  hoverChartPoints,
  cleanupAllTourEffects,
  abortAnimations,
  resetAbortFlag,
} from './tourInteractions'

const router = useRouter()
const tacoStore = useTacoStore()

// ──────────────────────────────────
// Wizard Prompt (post-tour modal)
// ──────────────────────────────────
const showWizardPrompt = ref(false)

// Block Space/Enter/Escape and stray clicks while wizard prompt is open
function wizardKeyGuard(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
  }
}
function wizardClickGuard(e: MouseEvent) {
  // Only allow clicks inside the modal dialog itself
  const dialog = document.querySelector('.taco-modal-dialog')
  if (dialog && !dialog.contains(e.target as Node)) {
    e.preventDefault()
    e.stopPropagation()
  }
}

watch(showWizardPrompt, (show) => {
  if (show) {
    window.addEventListener('keydown', wizardKeyGuard, true)
    window.addEventListener('click', wizardClickGuard, true)
  } else {
    window.removeEventListener('keydown', wizardKeyGuard, true)
    window.removeEventListener('click', wizardClickGuard, true)
    // Wizard prompt was dismissed — now safe to emit 'end' and let parent unmount us
    emit('end')
  }
})

function openWizard() {
  showWizardPrompt.value = false
  tacoStore.toggleTacoWizard()
}

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
const currentSpeakerSide = computed<'left' | 'right'>(() => {
  if (!currentLine.value) return 'left'
  return currentLine.value.character === 'nacho' ? 'right' : 'left'
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
const lightningFlash = ref(false)
const whiteoutActive = ref(false)
const whiteoutFading = ref(false)

// Face style selection (persisted in localStorage)
const selectedFaceStyle = useStorage<FaceStyle>('grandTourFaceStyle', 'standard')

// Test expression override (for testing emotes)
const testExpression = ref<Expression | 'auto'>('auto')

// ──────────────────────────────────
// Pause timer
// ──────────────────────────────────
let pauseTimer: ReturnType<typeof setTimeout> | null = null
const isPaused = ref(false)

function clearPauseTimer() {
  if (pauseTimer) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }
  isPaused.value = false
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

  // If this line has a pause, auto-advance after the delay (block manual advance)
  if (currentLine.value?.pause) {
    isPaused.value = true
    pauseTimer = setTimeout(() => {
      isPaused.value = false
      onAdvance()
    }, currentLine.value.pause)
  }
}

function onAdvance() {
  // Block manual advance during auto-advancing pause lines (e.g. toggle fight)
  if (isPaused.value) return

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

  // Clean up highlights before navigating
  clearHighlight()

  // Navigate to the new route
  if (nextScene.route !== router.currentRoute.value.path) {
    dialogVisible.value = false
    await router.push(nextScene.route)
    // Small delay for page to render
    await new Promise(r => setTimeout(r, 600))
    // Scroll the app content container to top
    const appContent = document.querySelector('.app__content')
    if (appContent) appContent.scrollTop = 0
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

async function applyCurrentLine() {
  const ln = currentLine.value
  if (!ln) return

  // Skip lines whose runtime condition is not met
  if (ln.condition && !ln.condition()) {
    advanceLine()
    return
  }

  applySpriteState(ln)

  // Always clear previous highlight before processing new line
  clearHighlight()

  // Handle delay before showing this line
  if (ln.delay) {
    await new Promise(r => setTimeout(r, ln.delay))
  }

  // Handle scroll (before highlight so element is visible)
  if (ln.scrollTo || ln.highlight) {
    const scrollTarget = ln.scrollTo || ln.highlight!
    await scrollToElement(scrollTarget)
  }

  // Handle highlight
  if (ln.highlight) {
    applyHighlight(ln.highlight)
  }

  // Handle click
  if (ln.click) {
    await new Promise(r => setTimeout(r, 300))
    clickElement(ln.click)
  }

  // Handle slider animation (fire and forget — runs alongside typing)
  if (ln.animateSliders) {
    const { container, demoValues, duration } = ln.animateSliders
    animateSliders(container, demoValues, duration)
  }

  // Handle toggle battle (fire and forget)
  if (ln.toggleBattle) {
    const { selectorA, selectorB, rounds, delayMs } = ln.toggleBattle
    toggleBattle(selectorA, selectorB, rounds, delayMs)
  }

  // Handle escalating battle (fire and forget — with visual effect callbacks)
  if (ln.escalatingBattle) {
    const { selectorA, selectorB } = ln.escalatingBattle
    escalatingBattle(selectorA, selectorB, {
      onPhase: (phase) => {
        if (phase === 1) {
          tacoExpression.value = 'angry'
          nachoExpression.value = 'angry'
        }
        if (phase === 2) {
          tacoExpression.value = 'surprised'
          nachoExpression.value = 'surprised'
          screenShake.value = true
        }
        if (phase === 3) {
          tacoExpression.value = 'angry'
          nachoExpression.value = 'angry'
        }
      },
      onClimax: () => {
        screenShake.value = false

        // Both buttons "win" simultaneously — force both to show active
        clickElement(selectorA)
        clickElement(selectorB)
        // The toggle is radio (one or the other), so force both active via DOM
        const btnA = document.querySelector<HTMLElement>(selectorA)
        const btnB = document.querySelector<HTMLElement>(selectorB)
        if (btnA) btnA.classList.add('active')
        if (btnB) btnB.classList.add('active')

        // Lightning strobe
        lightningFlash.value = true
        setTimeout(() => { lightningFlash.value = false }, 400)

        // Whiteout after lightning
        setTimeout(() => { whiteoutActive.value = true }, 300)

        // Start fading after 3s
        setTimeout(() => { whiteoutFading.value = true }, 3300)

        // Clean up after fade
        setTimeout(() => {
          whiteoutActive.value = false
          whiteoutFading.value = false
          tacoExpression.value = 'sad'
          nachoExpression.value = 'sad'
          tacoAction.value = 'idle'
          nachoAction.value = 'idle'
        }, 4500)
      }
    })
  }

  // Handle chart point hover (fire and forget)
  if (ln.hoverChartPoints) {
    const { container, count, dwellMs } = ln.hoverChartPoints
    hoverChartPoints(container, count, dwellMs)
  }

  // Handle explicit highlight clear
  if (ln.clearHighlight) {
    clearHighlight()
  }

  // If the line has no text (e.g., a character entrance), auto-advance after animation
  if (!ln.text) {
    setTimeout(() => {
      onAdvance()
    }, 600)
  }
}

// ──────────────────────────────────
// Start / End Tour
// ──────────────────────────────────
async function startTour() {
  resetAbortFlag()
  tacoStore.tourBypassAuth = true
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
    const appContent = document.querySelector('.app__content')
    if (appContent) appContent.scrollTop = 0
  }

  await nextTick()
  dialogVisible.value = true
  applyCurrentLine()
}

function endTour() {
  clearPauseTimer()
  abortAnimations()
  cleanupAllTourEffects()
  tacoStore.tourBypassAuth = false
  dialogVisible.value = false
  tacoVisible.value = false
  nachoVisible.value = false
  tacoTalking.value = false
  nachoTalking.value = false

  // Show wizard prompt for new users — defer 'end' emit until prompt is closed
  // (emitting 'end' causes the parent to unmount GrandTour, destroying the modal)
  const isNewUser = !tacoStore.userLoggedIn || tacoStore.cachedTacoNeurons.length === 0
  if (isNewUser) {
    showWizardPrompt.value = true
    // 'end' will be emitted when the wizard prompt is dismissed (see watch below)
  } else {
    setTimeout(() => {
      emit('end')
    }, 300)
  }
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

// Backdrop — separate stacking context so highlights can sit between it and tour UI
.grand-tour-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

.grand-tour {
  position: fixed;
  inset: 0;
  z-index: 100002;
  pointer-events: none;

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
    z-index: 5;
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
    z-index: 4;
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

// Battle climax effects
.grand-tour__lightning {
  position: fixed;
  inset: 0;
  background: #FFD700;
  z-index: 2;
  pointer-events: none;
  animation: lightning-strobe 0.4s ease-out forwards;
}

.grand-tour__whiteout {
  position: fixed;
  inset: 0;
  background: white;
  opacity: 1;
  z-index: 2;
  pointer-events: none;
  transition: opacity 1.2s ease-out;

  &--fading {
    opacity: 0;
  }
}

@keyframes lightning-strobe {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  25%  { opacity: 0.2; }
  40%  { opacity: 0.95; }
  55%  { opacity: 0.1; }
  70%  { opacity: 0.85; }
  85%  { opacity: 0; }
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

<!-- Unscoped: highlight class applied to elements outside this component -->
<style lang="scss">
.tour-highlighted {
  outline: 2px solid rgba(255, 215, 0, 0.4) !important;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.25), 0 0 20px rgba(255, 215, 0, 0.1) !important;
  border-radius: 0.5rem;
  transition: outline 0.3s ease, box-shadow 0.3s ease;
}
</style>
