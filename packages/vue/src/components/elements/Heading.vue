<script setup lang="ts">
import { computed } from "vue";

import type { ElementProps } from "../../types";

import { useMarkdown } from "../../composables/markdown";
import NodeList from "../NodeList.vue";
import { elementPropertiesToProps } from "../utils/elementPropertiesToProps";

defineOptions({
  inheritAttrs: false,
});

const { element, nodeIdx, deep, nodeKey } = defineProps<ElementProps>();
const { components, transition } = useMarkdown();

const headingLevel = computed(() => {
  const level = parseInt(element.tagName.slice(1));
  return isNaN(level) ? 1 : level;
});
</script>

<template>
  <component
    :is="element.tagName"
    data-mark-sorcery="heading"
    :data-heading-level="headingLevel"
    v-bind="elementPropertiesToProps(element.properties)"
  >
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
