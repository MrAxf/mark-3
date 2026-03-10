<script setup lang="ts">
import type { ElementProps } from "../../types";

import { useMarkdown } from "../../composables/markdown";
import NodeList from "../NodeList.vue";
import { elementPropertiesToProps } from "../utils/elementPropertiesToProps";

defineOptions({
  inheritAttrs: false,
});

const { element, nodeIdx, deep, nodeKey } = defineProps<ElementProps>();
const { components, transition } = useMarkdown();
</script>

<template>
  <del data-mark-sorcery="strikethrough" v-bind="elementPropertiesToProps(element.properties)">
    <NodeList
      :nodes="element.children"
      :nodeIdx="nodeIdx"
      :deep="deep"
      :nodeKey="nodeKey"
      :parentNode="element"
      :components="components"
      :transition="transition"
    />
  </del>
</template>
