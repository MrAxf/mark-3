<script setup lang="ts">
import type { Element, Text } from 'hast'

import { type ElementProps } from '@mark-sorcery/vue'
import { codeToHtml } from 'shiki'
import { computed, ref, watch } from 'vue'

import CustomMermaid from './CustomMermaid.vue'

const props = defineProps<ElementProps>()

const lang = computed(() => {
  const codeEl = props.element?.children?.[0] as Element | undefined
  const classes = (codeEl?.properties?.className as string[] | undefined) ?? []
  return classes.find((c) => c.startsWith('language-'))?.slice(9) ?? 'text'
})

const code = computed(() => {
  const codeEl = props.element?.children?.[0] as Element | undefined
  const textNode = codeEl?.children?.[0] as Text | undefined
  return textNode?.type === 'text' ? textNode.value : ''
})

const highlighted = ref('')

watch(
  [lang, code],
  async ([l, c]) => {
    if (l === 'mermaid') {
      highlighted.value = ''
      return
    }

    if (!c) {
      highlighted.value = `<pre class="shiki"><code>${c}</code></pre>`
      return
    }
    try {
      highlighted.value = await codeToHtml(c, { lang: l, theme: 'github-dark' })
    } catch {
      // Unsupported language — fall back to plain text
      highlighted.value = await codeToHtml(c, { lang: 'text', theme: 'github-dark' })
    }
  },
  { immediate: true },
)
</script>

<template>
  <CustomMermaid v-if="lang === 'mermaid'" :code="code" />
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-else class="shiki-wrapper" v-html="highlighted" />
</template>

<style scoped>
.shiki-wrapper {
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  overflow: hidden;
  margin: 0.9rem 0;
  background: var(--surface-soft);
}

.shiki-wrapper :deep(pre) {
  margin: 0;
  padding: 0.9rem 1rem;
  overflow-x: auto;
  font-size: 0.84rem;
  line-height: 1.62;
  background: #121019 !important;
}

.shiki-wrapper :deep(code) {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}
</style>
