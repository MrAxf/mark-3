<script setup lang="ts">
import { computed } from 'vue'

import type { ElementProps } from '../../types'

import { elementPropertiesToProps } from '../../utils/elementPropertiesToProps'

defineOptions({
  inheritAttrs: false,
})

const { element } = defineProps<ElementProps>()

const properties = computed(() => {
  return elementPropertiesToProps(element.properties)
})
</script>

<template>
  <input data-mark-sorcery="task-list-input" type="checkbox" disabled v-bind="properties" />
</template>
