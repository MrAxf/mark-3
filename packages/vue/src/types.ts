import type {
  MarkdownProcessor,
  ParseMemory,
  ParseOptions,
  ParserPlugin,
} from '@mark-sorcery/markdown-parser'
import type { Element, Nodes, Text } from 'hast'
import type { BaseTransitionProps, Component } from 'vue'

export type { MarkdownProcessor, ParseMemory, ParseOptions, ParserPlugin }

/**
 * Configuration forwarded to Vue's `<Transition>` component.
 * All props are optional; when `transition: true` is used on `<Markdown>`,
 * defaults to `{}` which activates Vue's default `v-enter-*` classes.
 *
 * @see https://vuejs.org/api/built-in-components.html#transition
 */
export interface TransitionConfig {
  name?: string
  css?: boolean
  mode?: 'in-out' | 'out-in' | 'default'
  enterFromClass?: string
  enterActiveClass?: string
  enterToClass?: string
  leaveFromClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
  appearFromClass?: string
  appearActiveClass?: string
  appearToClass?: string
  onBeforeEnter?: BaseTransitionProps['onBeforeEnter']
  onEnter?: BaseTransitionProps['onEnter']
  onAfterEnter?: BaseTransitionProps['onAfterEnter']
  onEnterCancelled?: BaseTransitionProps['onEnterCancelled']
  onBeforeLeave?: BaseTransitionProps['onBeforeLeave']
  onLeave?: BaseTransitionProps['onLeave']
  onAfterLeave?: BaseTransitionProps['onAfterLeave']
  onLeaveCancelled?: BaseTransitionProps['onLeaveCancelled']
}

export type MarkdownOptions = Omit<ParseOptions, 'plugins'>

/**
 * Props automatically injected into every custom Vue component rendered by
 * `<Markdown>`. Use this to type your custom component's `node` prop.
 *
 * @example
 * import type { NodeProps } from '@mark-sorcery/vue'
 * const props = defineProps<NodeProps>()
 * // props.node is the raw HAST Element
 */
export interface NodeProps {
  node: Element
}

export interface MarkdownProps {
  /** The markdown string to render. May be a partial/streaming string. */
  markdown: string
  /** Options forwarded to the underlying markdown processor factory, excluding plugins. */
  options?: MarkdownOptions
  /** Plugins forwarded to the underlying markdown processor factory. */
  plugins?: ParserPlugin[]
  /** Enables parse memory so growing markdown streams preserve confirmed blocks. */
  stream?: boolean
  /** Custom Vue components or tags to use in place of default HTML elements. */
  components?: Record<string, Component>
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
  transition?: boolean | TransitionConfig
}

export interface MarkdownNodeProps {
  /** The HAST element to render. */
  element: Element
  /** A unique key for the component instance. */
  componentKey: string
}

export type ItemProps = {
  nodeIdx?: number
  deep?: number
  nodeKey?: string
  parentNode?: Nodes
}

export type NodeListProps = ItemProps & {
  nodes: Nodes[]
  components: NonNullable<MarkdownProps['components']>
  transition: MarkdownProps['transition']
}

export type ElementProps = ItemProps & {
  element: Element
}

export type TextProps = ItemProps & {
  element: Text
}
