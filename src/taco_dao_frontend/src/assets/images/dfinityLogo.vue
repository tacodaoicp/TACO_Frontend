<template>

      <svg class="dfinity-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 200 100">

            <defs>

                  <linearGradient :id="gradientId1" x1="125.284" y1="-23.05" x2="191.043" y2="-90.797" gradientTransform="translate(0 -13.9) scale(1 -1)" gradientUnits="userSpaceOnUse">
                        <stop offset=".21" stop-color="#f15a24"/>
                        <stop offset=".684" stop-color="#fbb03b"/>
                  </linearGradient>
                  <linearGradient :id="gradientId2" x1="74.715" y1="-104.75" x2="8.957" y2="-37.003" gradientTransform="translate(0 -13.9) scale(1 -1)" gradientUnits="userSpaceOnUse">
                        <stop offset=".21" stop-color="#ed1e79"/>
                        <stop offset=".893" stop-color="#522785"/>
                  </linearGradient>

            </defs>

            <path d="M150.3,2.05c-10.9,0-22.8,5.8-35.4,17.3-6,5.4-11.2,11.2-15,15.9,0,0,6.1,6.9,12.8,14.3,3.6-4.5,8.9-10.6,14.9-16.1,11.2-10.2,18.5-12.3,22.7-12.3,15.7,0,28.5,12.9,28.5,28.9,0,15.8-12.7,28.7-28.5,28.9-.7,0-1.7-.1-2.7-.3,4.6,2.1,9.5,3.6,14.2,3.6,28.8,0,34.4-19.5,34.8-20.9.8-3.6,1.3-7.3,1.3-11.2-.2-26.6-21.4-48.1-47.6-48.1Z" :fill="`url(#${gradientId1})`" stroke-width="0"/>

            <path d="M49.7,97.95c10.9,0,22.8-5.8,35.4-17.3,6-5.4,11.2-11.2,15-15.9,0,0-6.1-6.9-12.8-14.3-3.6,4.5-8.9,10.6-14.9,16.1-11.2,10.2-18.5,12.3-22.7,12.3-15.7,0-28.5-12.9-28.5-28.9,0-15.8,12.7-28.7,28.5-28.9.7,0,1.7.1,2.7.3-4.6-2.1-9.5-3.6-14.2-3.6-28.8,0-34.4,19.5-34.8,20.9-.8,3.6-1.3,7.3-1.3,11.2.1,26.5,21.4,48.1,47.6,48.1Z" :fill="`url(#${gradientId2})`" stroke-width="0"/>

            <path d="M71.6,33.85c-3.1-3-18.5-15.2-33.3-15.6C12,17.65,4.3,36.25,3.7,38.75,8.7,17.75,27.5,2.15,49.8,2.05c18.2,0,36.5,17.4,50.1,33.2,0,0,0-.1.1-.1,0,0,6.1,6.9,12.8,14.3,0,0,7.6,8.8,15.7,16.6,3.1,3,18.5,15.1,33.2,15.5,27,.7,34.4-19,34.9-20.5-5,21.1-23.8,36.8-46.1,36.9-18.2,0-36.5-17.5-50.2-33.2l-.1.1s-6.1-6.9-12.8-14.3c-.1-.1-7.7-8.9-15.8-16.7ZM3.6,38.85v-.2c.1.1.1.2,0,.2Z" fill="#29abe2" stroke-width="0"/>

      </svg>

</template>

<style scoped>
</style>

<script setup lang="ts">
import { computed } from 'vue'

// Generate unique IDs for each component instance to avoid SVG gradient ID conflicts
const uniqueId = Math.random().toString(36).substring(2, 9)
const gradientId1 = computed(() => `dfinity-gradient-1-${uniqueId}`)
const gradientId2 = computed(() => `dfinity-gradient-2-${uniqueId}`)
</script>