<template>
  <div class="md-body" v-html="renderMarkdown(text)"></div>
</template>

<script setup lang="ts">
import { useMarkdown } from '../composables/useMarkdown'

defineProps<{ text?: string | null }>()

const { renderMarkdown } = useMarkdown()
</script>

<style>
/* taco.scss resets margins, lists and bold, and sets a font on every tag */
.md-body {
  overflow-wrap: anywhere;
  line-height: 1.4;
}
.md-body * {
  font-family: "Space Mono";
}
.md-body p,
.md-body ul,
.md-body ol,
.md-body pre,
.md-body blockquote,
.md-body table,
.md-body h1,
.md-body h2,
.md-body h3,
.md-body h4,
.md-body h5,
.md-body h6 {
  margin: 0 0 0.75em;
}
.md-body > :last-child {
  margin-bottom: 0;
}
.md-body h1,
.md-body h2,
.md-body h3,
.md-body h4,
.md-body h5,
.md-body h6 {
  font-family: "Rubik";
  font-weight: 700;
  font-size: 1em;
}
.md-body h1,
.md-body h2 {
  font-size: 1.15em;
}
.md-body strong,
.md-body th {
  font-weight: 700;
}
.md-body em {
  font-style: italic;
}
.md-body s {
  text-decoration: line-through;
}
.md-body a {
  text-decoration: underline;
}
.md-body ul,
.md-body ol {
  padding-left: 1.5em;
}
.md-body ul {
  list-style: disc;
}
.md-body ol {
  list-style: decimal;
}
.md-body blockquote {
  padding-left: 0.75em;
  border-left: 3px solid currentColor;
}
.md-body pre {
  white-space: pre-wrap;
}
.md-body td,
.md-body th {
  padding: 0.25em 0.5em;
  border: 1px solid currentColor;
}
.md-link-host {
  opacity: 0.7;
  font-size: 0.85em;
}
</style>
