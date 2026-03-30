import type { Root } from 'hast'

import { createMemory, createProcessor, parse } from '@mark-sorcery/markdown-parser'
import { computed, defineComponent, h, shallowRef, watchEffect } from 'vue'

import type { MarkdownProcessor, MarkdownProps, ParseMemory } from './types.ts'

import NodeList from './components/NodeList.vue'
import { useProvideMarkdown } from './composables/markdown.ts'

function createEmptyRoot(): Root {
  return {
    type: 'root',
    children: [],
  }
}

export const Markdown = defineComponent({
  name: 'Markdown',

  props: {
    markdown: {
      type: String,
      required: true,
    },
    options: {
      type: Object as () => MarkdownProps['options'],
      default: undefined,
    },
    plugins: {
      type: Array as () => MarkdownProps['plugins'],
      default: undefined,
    },
    stream: {
      type: Boolean,
      default: false,
    },
    components: {
      type: Object as unknown as () => MarkdownProps['components'],
      default: () => ({}),
    },
    transition: {
      type: [Boolean, Object] as unknown as () => MarkdownProps['transition'],
      default: false,
    },
  } satisfies {
    [K in keyof MarkdownProps]-?: unknown
  },

  setup(props) {
    const getMarkdown = () => props.markdown ?? ''

    const processor = computed<MarkdownProcessor>(() => {
      const options = props.options
      const propPlugins = props.plugins ?? []

      return createProcessor({
        ...options,
        plugins: [...propPlugins],
      })
    })

    const hast = shallowRef<Root>(createEmptyRoot())
    let streamMemory: ParseMemory | undefined
    let activeProcessor: MarkdownProcessor | undefined
    let parseRunId = 0

    watchEffect((onCleanup) => {
      const runId = ++parseRunId
      let isActive = true

      onCleanup(() => {
        isActive = false
      })

      const currentProcessor = processor.value
      const markdown = getMarkdown()

      if (activeProcessor && activeProcessor !== currentProcessor) {
        streamMemory = props.stream ? createMemory() : undefined
      }

      activeProcessor = currentProcessor

      void (async () => {
        const nextRoot = await (() => {
          if (props.stream) {
            streamMemory ??= createMemory()
            return parse(currentProcessor, markdown, streamMemory)
          }

          if (streamMemory) {
            streamMemory.flush = true
            const flushedMemory = streamMemory
            streamMemory = undefined
            return parse(currentProcessor, markdown, flushedMemory)
          }

          return parse(currentProcessor, markdown)
        })()

        if (!isActive || runId !== parseRunId) {
          return
        }

        hast.value = nextRoot
      })()
    })

    const { components: providedComponents, transition: providedTransition } = useProvideMarkdown(
      computed(() => props.components),
      computed(() => props.transition),
    )

    return () => {
      return h(NodeList, {
        nodes: hast.value.children,
        nodeKey: 'root',
        deep: 0,
        parentNode: hast.value,
        components: providedComponents.value,
        transition: providedTransition.value,
      })
    }
  },
})
