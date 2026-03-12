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
  <ol data-mark-sorcery="ordered-list" v-bind="elementPropertiesToProps(element.properties)">
    <NodeList
      :nodes="element.children"
      :nodeIdx="nodeIdx"
      :deep="deep"
      :nodeKey="nodeKey"
      :parentNode="element"
      :components="components"
      :transition="transition"
    />
  </ol>
</template>
