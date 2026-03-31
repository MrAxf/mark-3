<script setup lang="ts">
import { computed } from 'vue'

import type { ElementProps } from '../../types'

import { useMarkdown } from '../../composables/markdown'
import { elementPropertiesToProps } from '../../utils/elementPropertiesToProps'
import NodeList from '../NodeList.vue'

defineOptions({
  inheritAttrs: false,
})

const VOID_TAGS = new Set(['hr', 'input'])

const markerAttributes: Record<string, Record<string, string>> = {
  p: { 'data-mark-sorcery': 'paragraph' },
  h1: { 'data-mark-sorcery': 'heading' },
  h2: { 'data-mark-sorcery': 'heading' },
  h3: { 'data-mark-sorcery': 'heading' },
  h4: { 'data-mark-sorcery': 'heading' },
  h5: { 'data-mark-sorcery': 'heading' },
  h6: { 'data-mark-sorcery': 'heading' },
  strong: { 'data-mark-sorcery': 'bold' },
  hr: { 'data-mark-sorcery': 'horizontal-rule' },
  em: { 'data-mark-sorcery': 'italic' },
  del: { 'data-mark-sorcery': 'strikethrough' },
  blockquote: { 'data-mark-sorcery': 'blockquote' },
  ul: { 'data-mark-sorcery': 'unordered-list' },
  ol: { 'data-mark-sorcery': 'ordered-list' },
  li: { 'data-mark': 'list-item' },
  code: { 'data-mark-sorcery': 'code' },
  a: { 'data-mark-sorcery': 'link' },
  input: { 'data-mark-sorcery': 'task-list-input' },
  pre: { 'data-mark-sorcery': 'code-block' },
  table: { 'data-mark-sorcery': 'table' },
  thead: { 'data-mark-sorcery': 'table-head' },
  tbody: { 'data-mark-sorcery': 'table-body' },
  tr: { 'data-mark-sorcery': 'table-row' },
  th: { 'data-mark-sorcery': 'table-header' },
  td: { 'data-mark-sorcery': 'table-data' },
}

const { element, nodeIdx, deep, nodeKey } = defineProps<ElementProps>()
const { components, transition } = useMarkdown()

const tagName = computed(() => element.tagName || 'span')
const isVoidTag = computed(() => VOID_TAGS.has(tagName.value))
const props = computed(() => {
  const nextProps: Record<string, unknown> = {
    ...elementPropertiesToProps(element.properties),
    ...(markerAttributes[tagName.value] ?? { 'data-mark-sorcery': 'element' }),
  }

  if (tagName.value === 'input') {
    nextProps.type ??= 'checkbox'
    nextProps.disabled ??= true
  }

  if (/^h[1-6]$/.test(tagName.value)) {
    nextProps['data-heading-level'] = Number.parseInt(tagName.value.slice(1), 10)
  }

  return nextProps
})
</script>

<template>
  <component :is="tagName" v-if="isVoidTag" v-bind="props" />
  <component :is="tagName" v-else v-bind="props">
    <NodeList
      :nodes="element.children"
      :nodeIdx="nodeIdx"
      :deep="deep"
      :nodeKey="nodeKey"
      :parentNode="element"
      :components="components"
      :transition="transition"
    />
  </component>
</template>
