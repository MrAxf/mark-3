<script setup lang="ts">
import type { TextProps } from '../../types'

defineOptions({
  inheritAttrs: false,
})

const { element } = defineProps<TextProps>()
</script>

<template>
  <span data-mark-sorcery="text">{{ element.value }}</span>
</template>
