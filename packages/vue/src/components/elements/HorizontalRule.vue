<script setup lang="ts">
import type { ElementProps } from '../../types'

import { elementPropertiesToProps } from '../../utils/elementPropertiesToProps'

defineOptions({
  inheritAttrs: false,
})

const { element } = defineProps<ElementProps>()
</script>

<template>
  <hr data-mark-sorcery="horizontal-rule" v-bind="elementPropertiesToProps(element.properties)" />
</template>
