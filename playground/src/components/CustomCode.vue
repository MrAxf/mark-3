<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { codeToHtml } from 'shiki'
import type { Element, Text } from 'hast'

const props = defineProps<{ node?: Element }>()

const lang = computed(() => {
  const codeEl = props.node?.children?.[0] as Element | undefined
  const classes = (codeEl?.properties?.className as string[] | undefined) ?? []
  return classes.find(c => c.startsWith('language-'))?.slice(9) ?? 'text'
})

const code = computed(() => {
  const codeEl = props.node?.children?.[0] as Element | undefined
  const textNode = codeEl?.children?.[0] as Text | undefined
  return textNode?.type === 'text' ? textNode.value : ''
})

const highlighted = ref('')

watch(
  [lang, code],
  async ([l, c]) => {
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
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="shiki-wrapper" v-html="highlighted" />
</template>

<style scoped>
.shiki-wrapper {
  border: 2px solid #3d3123;
  border-left: 8px solid var(--gold);
  border-radius: 0;
  overflow: hidden;
  margin: 1rem 0;
  box-shadow: 4px 4px 0 #090b0f;
}

.shiki-wrapper :deep(pre) {
  margin: 0;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  font-size: 0.88rem;
  line-height: 1.65;
  background: #0a0f16 !important;
}

.shiki-wrapper :deep(code) {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
</style>
