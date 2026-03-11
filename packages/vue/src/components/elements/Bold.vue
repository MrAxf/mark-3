<script setup lang="ts">
import type { ElementProps } from '../../types'

import { useMarkdown } from '../../composables/markdown'
import NodeList from '../NodeList.vue'
import { elementPropertiesToProps } from '../utils/elementPropertiesToProps'

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
