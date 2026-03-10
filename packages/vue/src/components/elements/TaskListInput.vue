<script setup lang="ts">
import { computed } from "vue";

import type { ElementProps } from "../../types";

defineOptions({
  inheritAttrs: false,
});

const { element } = defineProps<ElementProps>();

const properties = computed(() => {
  return {
    checked: element.properties.checked,
    class: element.properties.class,
  } as any;
});
</script>

<template>
  <input data-mark-sorcery="task-list-input" type="checkbox" disabled v-bind="properties" />
</template>
