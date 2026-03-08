import type { BaseTransitionProps, Component } from 'vue';
import type { Element } from 'hast';
import type { ParseOptions } from '@mark-3/markdown-parser';

export type { ParseOptions };

/**
 * Configuration forwarded to Vue's `<Transition>` component.
 * All props are optional; when `transition: true` is used on `<Markdown>`,
 * defaults to `{}` which activates Vue's default `v-enter-*` classes.
 *
 * @see https://vuejs.org/api/built-in-components.html#transition
 */
export interface TransitionConfig {
  name?: string;
  css?: boolean;
  appear?: boolean;
  mode?: 'in-out' | 'out-in' | 'default';
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
  appearFromClass?: string;
  appearActiveClass?: string;
  appearToClass?: string;
  onBeforeEnter?: BaseTransitionProps['onBeforeEnter'];
  onEnter?: BaseTransitionProps['onEnter'];
  onAfterEnter?: BaseTransitionProps['onAfterEnter'];
  onEnterCancelled?: BaseTransitionProps['onEnterCancelled'];
  onBeforeLeave?: BaseTransitionProps['onBeforeLeave'];
  onLeave?: BaseTransitionProps['onLeave'];
  onAfterLeave?: BaseTransitionProps['onAfterLeave'];
  onLeaveCancelled?: BaseTransitionProps['onLeaveCancelled'];
}

/** A resolved component value: a Vue component, a tag string, or null/undefined to fall back to the default element. */
export type ComponentResolution = Component | string | null | undefined;

/**
 * Resolves which Vue component or tag to render for a given HAST element node.
 *
 * Can be:
 * - A **record** mapping tag names to components or tag strings (e.g. `{ h1: MyHeading }`)
 * - A **function** `(node: Element) => ComponentResolution` — called for every element;
 *   return `null` or `undefined` to fall back to the default HTML element.
 *
 * @example — record form
 * const components: Components = { h1: MyHeading, code: MyCode }
 *
 * @example — function form
 * const components: Components = (node) => {
 *   if (node.tagName === 'h1') return MyHeading
 *   if (node.properties?.className?.includes('warning')) return MyWarning
 * }
 */
export type Components =
  | Partial<Record<string, ComponentResolution>>
  | ((node: Element) => ComponentResolution);

/**
 * Props automatically injected into every custom Vue component rendered by
 * `<Markdown>`. Use this to type your custom component's `node` prop.
 *
 * @example
 * import type { NodeProps } from '@mark-3/vue'
 * const props = defineProps<NodeProps>()
 * // props.node is the raw HAST Element
 */
export interface NodeProps {
  node: Element;
}

export interface MarkdownProps {
  /** The markdown string to render. May be a partial/streaming string. */
  markdown: string;
  /** Options forwarded to the underlying markdown parser. */
  options?: ParseOptions;
  /** Custom Vue components or tags to use in place of default HTML elements. */
  components?: Components;
  /**
   * Optional Vue `<Transition>` configuration applied to every rendered element node.
   *
   * - `true` — enables transitions with Vue's default classes (`v-enter-*`).
   * - `TransitionConfig` object — forwarded as props to each `<Transition>` wrapper.
   * - `false` / `undefined` — no transitions (default).
   *
   * @example
   * // Basic fade (add CSS: .fade-enter-active { transition: opacity 0.3s } .fade-enter-from { opacity: 0 })
   * :transition="{ name: 'fade', appear: true }"
   */
  transition?: boolean | TransitionConfig;
}
