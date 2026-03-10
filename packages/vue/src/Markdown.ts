import { computed, defineComponent, h, shallowRef, watchEffect } from 'vue';
import { createMemory, createProcessor, parse } from '@mark-sorcery/markdown-parser';
import type {
  MarkdownProcessor,
  MarkdownProps,
  ParseMemory,
} from './types.ts';
import NodeList from './components/NodeList.vue';
import { useProvideMarkdown } from './composables/markdown.ts';
import { removeLineJumpNodesPlugin } from './plugins/remove-line-jump-nodes.ts';

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
    [K in keyof MarkdownProps]-?: unknown;
  },

  setup(props) {
    const getMarkdown = () => props.markdown ?? '';

    const processor = computed<MarkdownProcessor>(() => {
      const options = props.options;
      const propPlugins = props.plugins ?? [];

      return createProcessor({
        ...options,
        plugins: [...propPlugins, removeLineJumpNodesPlugin()],
      });
    });

    const hast = shallowRef(parse(processor.value, getMarkdown()));
    let streamMemory: ParseMemory | undefined;
    let activeProcessor: MarkdownProcessor | undefined;

    watchEffect(() => {
      const currentProcessor = processor.value;
      const markdown = getMarkdown();

      if (activeProcessor && activeProcessor !== currentProcessor) {
        streamMemory = props.stream ? createMemory() : undefined;
      }

      activeProcessor = currentProcessor;

      if (props.stream) {
        streamMemory ??= createMemory();
        hast.value = parse(currentProcessor, markdown, streamMemory);
        return;
      }

      if (streamMemory) {
        streamMemory.flush = true;
        streamMemory = undefined;
        return;
      }

      hast.value = parse(currentProcessor, markdown);
    });

    const { components: providedComponents, transition: providedTransition } = useProvideMarkdown(computed(() => props.components), computed(() => props.transition));

    return () => {
      return h(NodeList, {
        nodes: hast.value.children,
        nodeKey: 'root',
        deep: 0,
        parentNode: hast.value,
        components: providedComponents.value,
        transition: providedTransition.value,
      });
    };
  },
});
