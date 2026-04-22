<template>
  <Teleport to="body">
    <div data-theme="exchange"><div class="ex-toast-container">
      <TransitionGroup name="ex-toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="ex-toast"
          :class="'ex-toast--' + t.type"
        >
          <span class="ex-toast__icon" :class="'ex-toast__icon--' + t.type">
            <template v-if="t.type === 'success'">&#10003;</template>
            <template v-else-if="t.type === 'error'">&#10005;</template>
            <template v-else-if="t.type === 'warning'">&#9888;</template>
            <template v-else>&#8505;</template>
          </span>
          <div class="ex-toast__body">
            <div class="ex-toast__title">{{ t.title }}</div>
            <div v-if="t.message" class="ex-toast__message">{{ t.message }}</div>
          </div>
          <button class="ex-toast__close" @click="removeToast(t.id)">&times;</button>
          <div
            class="ex-toast__progress"
            :style="{ animationDuration: t.duration + 'ms' }"
          />
        </div>
      </TransitionGroup>
    </div></div>
  </Teleport>
</template>

<script setup lang="ts">
import { useExchangeToast } from '../../composables/useExchangeToast'

const { toasts, removeToast } = useExchangeToast()
</script>
