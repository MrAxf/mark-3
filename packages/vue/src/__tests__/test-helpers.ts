import type {
  Element as HastElement,
  ElementContent,
  Root,
  RootContent,
  Text as HastText,
} from 'hast'

import { computed, defineComponent, h, markRaw, type PropType } from 'vue'

import type { MarkdownProps } from '../types.ts'

import NodeList from '../components/NodeList.vue'
import { useMarkdown, useProvideMarkdown } from '../composables/markdown.ts'
import { Markdown } from '../Markdown.ts'

export { NodeList }

type TestNode = RootContent

const SyncTextComponent = markRaw(
  defineComponent({
    name: 'SyncTextComponent',
    props: ['element'],
    setup(props) {
      return () => props.element.value
    },
  }),
)

export function text(value: string): HastText {
  return { type: 'text', value }
}

export function element(
  tagName: string,
  properties: HastElement['properties'] = {},
  children: ElementContent[] = [],
): HastElement {
  return {
    type: 'element',
    tagName,
    properties,
    children,
  } as const
}

export function createRecursiveComponent(tag: string, marker = tag) {
  return markRaw(
    defineComponent({
      name: `Test${tag[0]?.toUpperCase() ?? 'X'}${tag.slice(1)}`,
      props: ['element', 'nodeIdx', 'deep', 'nodeKey', 'parentNode'],
      setup(props) {
        const { components, transition } = useMarkdown()

        return () =>
          h(
            tag,
            {
              'data-test-tag': marker,
              'data-node-key': String(props.nodeKey),
              'data-deep': String(props.deep),
            },
            [
              h(NodeList, {
                nodes: props.element.children,
                nodeIdx: props.nodeIdx,
                deep: props.deep,
                nodeKey: props.nodeKey,
                parentNode: props.element,
                components: components.value,
                transition: transition.value,
              }),
            ],
          )
      },
    }),
  )
}

export const NodeListHarness = defineComponent({
  name: 'NodeListHarness',
  props: {
    nodes: {
      type: Array as PropType<TestNode[]>,
      required: true,
    },
    components: {
      type: Object as PropType<NonNullable<MarkdownProps['components']>>,
      default: () => ({}),
    },
    transition: {
      type: [Boolean, Object] as PropType<MarkdownProps['transition']>,
      default: false,
    },
  },
  setup(props) {
    const mergedComponents = computed<NonNullable<MarkdownProps['components']>>(() => ({
      text: SyncTextComponent,
      ...props.components,
    }))

    useProvideMarkdown(
      computed(() => mergedComponents.value),
      computed(() => props.transition),
    )
    const parentNode = computed<Root>(() => ({
      type: 'root',
      children: props.nodes,
    }))

    return () =>
      h(NodeList, {
        nodes: props.nodes,
        nodeKey: 'root',
        deep: 0,
        parentNode: parentNode.value,
        components: mergedComponents.value,
        transition: props.transition,
      })
  },
})

export const MarkdownHarness = defineComponent({
  name: 'MarkdownHarness',
  props: {
    markdown: {
      type: String,
      required: true,
    },
    options: {
      type: Object as unknown as PropType<MarkdownProps['options']>,
      default: undefined,
    },
    plugins: {
      type: Array as PropType<MarkdownProps['plugins']>,
      default: undefined,
    },
    stream: {
      type: Boolean,
      default: false,
    },
    components: {
      type: Object as PropType<NonNullable<MarkdownProps['components']>>,
      default: () => ({}),
    },
    transition: {
      type: [Boolean, Object] as PropType<MarkdownProps['transition']>,
      default: false,
    },
  },
  setup(props) {
    const mergedComponents = computed<NonNullable<MarkdownProps['components']>>(() => ({
      text: SyncTextComponent,
      ...props.components,
    }))

    return () =>
      h(Markdown, {
        markdown: props.markdown,
        options: props.options,
        plugins: props.plugins,
        stream: props.stream,
        components: mergedComponents.value,
        transition: props.transition,
      })
  },
})
