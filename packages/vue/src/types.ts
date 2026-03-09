import type { Component } from 'vue';
import type { Element } from 'hast';
import type {
  CorePluginOptions,
  MarkdownProcessor,
  ParseMemory,
  ParseOptions,
  ParserPlugin,
} from '@mark-sorcery/markdown-parser';

export type {
  CorePluginOptions,
  MarkdownProcessor,
  ParseMemory,
  ParseOptions,
  ParserPlugin,
};

export type MarkdownOptions = Omit<ParseOptions, 'plugins'>;

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
 * import type { NodeProps } from '@mark-sorcery/vue'
 * const props = defineProps<NodeProps>()
 * // props.node is the raw HAST Element
 */
export interface NodeProps {
  node: Element;
}

export interface MarkdownProps {
  /** The markdown string to render. May be a partial/streaming string. */
  markdown: string;
  /** Options forwarded to the underlying markdown processor factory, excluding plugins. */
  options?: MarkdownOptions;
  /** Plugins forwarded to the underlying markdown processor factory. */
  plugins?: ParserPlugin[];
  /** Enables parse memory so growing markdown streams preserve confirmed blocks. */
  stream?: boolean;
  /** Custom Vue components or tags to use in place of default HTML elements. */
  components?: Components;
}
