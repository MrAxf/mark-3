<script setup lang="ts">
import type { Nodes } from "hast";

import { computed, h, Transition as VueTransition } from "vue";

import type { NodeListProps } from "../types";

import { useMarkdown } from "../composables/markdown";

defineOptions({
  inheritAttrs: false,
});

const { nodes, nodeKey, deep = 0, parentNode } = defineProps<NodeListProps>();

const { components, transition } = useMarkdown();

const getRenderNode = ({ node, idx, nodeKey }: { node: Nodes; idx: number; nodeKey: string }) => {
  if (node.type === "text") {
    return node.value;
  } else if (node.type === "element") {
    const component = components.value[node.tagName];
    if (!component) {
      return [];
    }
    return h(component, {
      element: node,
      nodeIdx: idx,
      deep: deep + 1,
      nodeKey,
      parentNode,
    });
  } else {
    return [];
  }
};

const nodeRenderer = ({ node, idx, nodeKey }: { node: Nodes; idx: number; nodeKey: string }) => {
  const renderNode = getRenderNode({ node, idx, nodeKey });

  if (transition.value) {
    const transitionProps = {
      appear: true,
    };
    if (typeof transition.value === "object") {
      Object.assign(transitionProps, transition.value);
    }
    return h(VueTransition, transitionProps, () => renderNode);
  }

  return renderNode;
};

const nodeKeyPrefix = computed(() => (!nodeKey ? "" : `${nodeKey}.`));

function getNodeKey(node: Nodes, idx: number) {
  if (node.type === "text") {
    return `${nodeKeyPrefix}${node.type}-${idx}`;
  } else if (node.type === "element") {
    return `${nodeKeyPrefix}${node.type}-${node.tagName}-${idx}`;
  } else {
    return `${nodeKeyPrefix}${node.type}-${idx}`;
  }
}
</script>

<template>
  <template v-for="(node, idx) in nodes" :key="getNodeKey(node, idx)">
    <nodeRenderer :node="node" :idx="idx" :nodeKey="getNodeKey(node, idx)" />
  </template>
</template>
