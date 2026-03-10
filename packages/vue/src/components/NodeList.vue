<script setup lang="ts">
import type { Nodes } from "hast";

import { computed, h, Transition as VueTransition } from "vue";

import type { NodeListProps } from "../types";

import { useMarkdown } from "../composables/markdown";

defineOptions({
  inheritAttrs: false,
});

const { nodes, nodeKey, deep = 0, parentNode, components } = defineProps<NodeListProps>();

const { transition } = useMarkdown();

const nodeKeyPrefix = computed(() => (!nodeKey ? "" : `${nodeKey}.`));
const transitionConfig = computed(() => {
  if (transition.value === true) {
    return {};
  }
  if (typeof transition.value === "object") {
    return transition.value;
  }
  return false;
});

function getNodeKey(node: Nodes, idx: number) {
  if (node.type === "text") {
    return `${nodeKeyPrefix.value}${node.type}-${idx}`;
  } else if (node.type === "element") {
    return `${nodeKeyPrefix.value}${node.type}-${node.tagName}-${idx}`;
  } else {
    return `${nodeKeyPrefix.value}${node.type}-${idx}`;
  }
}

function getNodeComponent(node: Nodes) {
  if (node.type === "text") {
    return components["text"];
  } else if (node.type === "element") {
    return components[node.tagName];
  } else {
    return components["default"];
  }
}

const items = computed(() =>
  nodes.map((node, idx) => ({
    node,
    idx,
    key: getNodeKey(node, idx),
    component: getNodeComponent(node),
  })),
);
</script>

<template>
  <template v-for="item in items" :key="item.key">
    <VueTransition v-if="transitionConfig" appear v-bind="transitionConfig">
      <component
        :is="item.component"
        :element="item.node"
        :node-idx="item.idx"
        :deep="deep + 1"
        :node-key="item.key"
        :parent-node="parentNode"
      />
    </VueTransition>
    <component
      v-else
      :is="item.component"
      :element="item.node"
      :node-idx="item.idx"
      :deep="deep + 1"
      :node-key="item.key"
      :parent-node="parentNode"
    />
  </template>
</template>
