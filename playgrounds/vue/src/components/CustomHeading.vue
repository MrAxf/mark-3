<script setup lang="ts">
import { NodeList, useMarkdown, type ElementProps } from '@mark-sorcery/vue'

const { element, nodeIdx, deep, nodeKey } = defineProps<ElementProps>()
const { components, transition } = useMarkdown()
</script>

<template>
  <component :is="element.tagName" class="custom-heading" v-bind="element.properties">
    <span class="accent" aria-hidden="true">▣</span>
    <NodeList
      :nodes="element.children"
      :node-idx="nodeIdx"
      :deep="deep"
      :node-key="nodeKey"
      :parent-node="element"
      :components="components"
      :transition="transition"
    />
  </component>
</template>

<style scoped>
.custom-heading {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: var(--ink-strong);
  font-size: inherit;
  margin: 1em 0 0.5em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.accent {
  color: var(--accent);
  font-size: 0.68em;
  opacity: 1;
  user-select: none;
  flex-shrink: 0;
}
</style>
