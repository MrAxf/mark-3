import { computed, defineComponent, Fragment, h, markRaw } from 'vue';
import { parse } from '@mark-3/markdown-parser';
import { hastToVNodes } from './hast-to-vnodes.ts';
import type { Components, MarkdownProps, ParseOptions, TransitionConfig } from './types.ts';

export const Markdown = defineComponent({
  name: 'Markdown',

  props: {
    markdown: {
      type: String,
      required: true,
    },
    options: {
      type: Object as () => ParseOptions,
      default: undefined,
    },
    components: {
      type: [Object, Function] as unknown as () => Components,
      default: () => ({}),
    },
    transition: {
      type: [Boolean, Object] as unknown as () => boolean | TransitionConfig,
      default: false,
    },
  } satisfies {
    [K in keyof MarkdownProps]-?: unknown;
  },

  setup(props) {
    const hast = computed(() => parse(props.markdown, props.options));

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

      const transitionConfig: TransitionConfig | undefined =
        props.transition === true
          ? {}
          : props.transition || undefined;

      const vnodes = hastToVNodes(hast.value, components, transitionConfig);
      return h(Fragment, vnodes);
    };
  },
});
