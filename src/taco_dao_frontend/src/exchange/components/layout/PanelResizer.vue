<template>
  <div
    class="panel-resizer"
    :class="[
      `panel-resizer--${direction}`,
      { 'panel-resizer--active': isDragging }
    ]"
    @mousedown="onMouseDown"
    @dblclick="emit('reset')"
    @touchstart.prevent="onTouchStart"
    role="separator"
    :aria-orientation="direction === 'horizontal' ? 'vertical' : 'horizontal'"
    aria-label="Resize panel"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <div class="panel-resizer__grip">
      <span></span><span></span><span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const props = defineProps<{
  direction: 'horizontal' | 'vertical'
  min?: number
  max?: number
}>()

// `resize` emits an incremental delta (cursor movement since the last emit)
// that the parent applies against the current size then clamps. To keep the
// cursor and the panel in lockstep even across clamps, each move event
// updates `startPos` to the current cursor position — so the next emit is
// always the cursor's *incremental* motion regardless of what happened to
// the panel's size in between.
const emit = defineEmits<{
  resize: [delta: number]
  resizeEnd: []
  reset: []
}>()

const isDragging = ref(false)
let startPos = 0
let savedCursor = ''
let savedUserSelect = ''

function lockDocumentForDrag() {
  savedCursor = document.body.style.cursor
  savedUserSelect = document.body.style.userSelect
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
}

function unlockDocumentAfterDrag() {
  document.body.style.cursor = savedCursor
  document.body.style.userSelect = savedUserSelect
}

function onMouseDown(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  startPos = props.direction === 'horizontal' ? e.clientX : e.clientY
  lockDocumentForDrag()

  const onMove = (ev: MouseEvent) => {
    const current = props.direction === 'horizontal' ? ev.clientX : ev.clientY
    const delta = current - startPos
    if (delta === 0) return
    startPos = current
    emit('resize', delta)
  }

  const onUp = () => {
    isDragging.value = false
    unlockDocumentAfterDrag()
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    emit('resizeEnd')
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onTouchStart(e: TouchEvent) {
  isDragging.value = true
  const touch = e.touches[0]
  startPos = props.direction === 'horizontal' ? touch.clientX : touch.clientY

  const onMove = (ev: TouchEvent) => {
    const t = ev.touches[0]
    const current = props.direction === 'horizontal' ? t.clientX : t.clientY
    const delta = current - startPos
    if (delta === 0) return
    startPos = current
    emit('resize', delta)
  }

  const onEnd = () => {
    isDragging.value = false
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    emit('resizeEnd')
  }

  document.addEventListener('touchmove', onMove, { passive: true })
  document.addEventListener('touchend', onEnd)
}

function onKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 20 : 5
  if (props.direction === 'horizontal') {
    if (e.key === 'ArrowLeft') { emit('resize', -step); emit('resizeEnd') }
    if (e.key === 'ArrowRight') { emit('resize', step); emit('resizeEnd') }
  } else {
    if (e.key === 'ArrowUp') { emit('resize', -step); emit('resizeEnd') }
    if (e.key === 'ArrowDown') { emit('resize', step); emit('resizeEnd') }
  }
}

onUnmounted(() => {
  if (isDragging.value) unlockDocumentAfterDrag()
})
</script>

<style scoped lang="scss">
.panel-resizer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  flex-shrink: 0;
  background: var(--bg-secondary, #2A1608);

  &--horizontal {
    width: 2px;
    cursor: col-resize;
  }

  &--vertical {
    height: 2px;
    cursor: row-resize;
    padding: 4px 0;
    margin: -4px 0;
  }

  &:hover, &--active {
    background: var(--accent-primary);
  }

  &__grip {
    display: flex;
    gap: 2px;

    .panel-resizer--horizontal & { flex-direction: column; }
    .panel-resizer--vertical & { flex-direction: row; }

    span {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--border-secondary);
    }
  }

  &:hover &__grip span,
  &--active &__grip span {
    background: var(--bg-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -1px;
  }
}
</style>
