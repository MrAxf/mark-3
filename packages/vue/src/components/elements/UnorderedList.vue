<script setup lang="ts">
import type { ElementProps } from '@/types'

import NodeList from '@/components/NodeList.vue'
import { useMarkdown } from '@/composables/markdown'
import { elementPropertiesToProps } from '@/utils/elementPropertiesToProps'

defineOptions({
  inheritAttrs: false,
})

const { element, nodeIdx, deep, nodeKey } = defineProps<ElementProps>()
const { components, transition } = useMarkdown()
</script>

<template>
  <ul data-mark-sorcery="unordered-list" v-bind="elementPropertiesToProps(element.properties)">
    <NodeList
      :nodes="element.children"
      :nodeIdx="nodeIdx"
      :deep="deep"
      :nodeKey="nodeKey"
      :parentNode="element"
      :components="components"
      :transition="transition"
    />
  </ul>
</template>
