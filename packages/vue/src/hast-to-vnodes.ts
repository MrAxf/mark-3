import { h, createCommentVNode, Transition } from 'vue';
import type { Element, Nodes } from 'hast';
import type { VNodeArrayChildren } from 'vue';
import type { ComponentResolution, Components, TransitionConfig } from './types.ts';

/**
 * Convert HAST node properties to Vue-compatible props.
 * - `className` array → `class` string
 * - `htmlFor` → `for`
 * - All other properties pass through as-is
 */
function convertProps(properties: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (key === 'className' && Array.isArray(value)) {
      props['class'] = value.join(' ');
    } else if (key === 'htmlFor') {
      props['for'] = value;
    } else {
      props[key] = value;
    }
  }

  return props;
}

/** Resolve the tag/component for an element node from the Components option. */
function resolveTag(node: Element, components: Components): NonNullable<ComponentResolution> {
  const resolved = typeof components === 'function'
    ? components(node)
    : components[node.tagName];
  return resolved ?? node.tagName;
}

/**
 * Internal recursive converter. `path` is a dot-separated string identifying
 * the node's position in the tree (e.g. `"0"`, `"0.1"`, `"0.1.2"`).
 */
function toVNodes(
  node: Nodes | Nodes[],
  components: Components,
  transition: TransitionConfig | undefined,
  path: string,
): VNodeArrayChildren {
  if (Array.isArray(node)) {
    return node.flatMap((n, i) => toVNodes(n, components, transition, `${path}.${i}`));
  }

  switch (node.type) {
    case 'root':
      return node.children.flatMap((child, i) =>
        toVNodes(child, components, transition, String(i)),
      );

    case 'element': {
      const { properties = {}, children } = node;
      const tag = resolveTag(node, components);
      const props = convertProps(properties as Record<string, unknown>);
      const childVNodes: VNodeArrayChildren = children.flatMap((child, i) =>
        toVNodes(child, components, transition, `${path}.${i}`),
      );

      // Build the element VNode
      // Custom Vue components also receive the raw HAST `node` prop so they
      // can access the original element (e.g. to extract text content for
      // syntax highlighting or diagram rendering).
      const el = typeof tag === 'string'
        ? h(tag, props, childVNodes)
        : h(tag, { ...props, node }, { default: () => childVNodes });

      // Wrap in <Transition> if requested, using the tree path as a stable key
      if (transition !== undefined) {
        return [h(Transition, { key: path, ...transition }, { default: () => el })];
      }
      return [el];
    }

    case 'text':
      return [node.value];

    case 'comment':
      return [createCommentVNode(node.value)];

    default:
      return [];
  }
}

/**
 * Recursively convert a HAST node (or array of nodes) into Vue VNodeArrayChildren.
 *
 * @param node       - Root HAST node or array of nodes to convert.
 * @param components - Custom component map or resolver function.
 * @param transition - Optional `<Transition>` config applied to every element node.
 */
export function hastToVNodes(
  node: Nodes | Nodes[],
  components: Components,
  transition?: TransitionConfig,
): VNodeArrayChildren {
  return toVNodes(node, components, transition, '');
}
