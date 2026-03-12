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
  <strong data-mark-sorcery="bold" v-bind="elementPropertiesToProps(element.properties)">
    <NodeList
      :nodes="element.children"
      :nodeIdx="nodeIdx"
      :deep="deep"
      :nodeKey="nodeKey"
      :parentNode="element"
      :components="components"
      :transition="transition"
    />
  </strong>
</template>
