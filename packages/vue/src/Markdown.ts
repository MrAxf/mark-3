import { computed, defineComponent, Fragment, h, markRaw, shallowRef, watchEffect } from 'vue';
import { createMemory, createProcessor, parse } from '@mark-sorcery/markdown-parser';
import { hastToVNodes } from './hast-to-vnodes.ts';
import type {
  Components,
  MarkdownProcessor,
  MarkdownOptions,
  MarkdownProps,
  ParseMemory,
} from './types.ts';

export const Markdown = defineComponent({
  name: 'Markdown',

  props: {
    markdown: {
      type: String,
      required: true,
    },
    options: {
      type: Object as () => MarkdownOptions,
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
      type: [Object, Function] as unknown as () => Components,
      default: () => ({}),
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
        plugins: propPlugins,
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

    return () => {
      const raw = props.components ?? {};
      // Function resolvers pass through; record values are wrapped in markRaw
      // so Vue doesn't make component objects reactive (perf warning prevention)
      const components: Components = typeof raw === 'function'
        ? raw
        : Object.fromEntries(
          Object.entries(raw).map(([k, v]) =>
            [k, typeof v === 'string' || v == null ? v : markRaw(v)],
          ),
        );
      const vnodes = hastToVNodes(hast.value, components);
      return h(Fragment, vnodes);
    };
  },
});
