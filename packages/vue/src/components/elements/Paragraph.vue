<script setup lang="ts">
import type { ElementProps } from '../../types'

import { useMarkdown } from '../../composables/markdown'
import { elementPropertiesToProps } from '../../utils/elementPropertiesToProps'
import NodeList from '../NodeList.vue'

defineOptions({
  inheritAttrs: false,
})

const { element, nodeIdx, deep, nodeKey } = defineProps<ElementProps>()
const { components, transition } = useMarkdown()
</script>

<template>
  <p data-mark-sorcery="paragraph" v-bind="elementPropertiesToProps(element.properties)">
    <NodeList
      :nodes="element.children"
      :nodeIdx="nodeIdx"
      :deep="deep"
      :nodeKey="nodeKey"
      :parentNode="element"
      :components="components"
      :transition="transition"
    />
  </p>
</template>
