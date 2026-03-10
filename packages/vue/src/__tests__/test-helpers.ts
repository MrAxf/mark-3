import { createRequire } from 'module';
import { computed, defineComponent, h, markRaw, shallowRef, watchEffect } from 'vue';
import { createMemory, createProcessor, parse } from '../../../markdown-parser/src/index.ts';

const require = createRequire(import.meta.url);
const { _sfc_main: NodeList, useProvideMarkdown } = require('../../dist/NodeList-CXCRf4Sf.cjs');

export { NodeList };

export function text(value: string) {
  return { type: 'text', value } as const;
}

export function element(
  tagName: string,
  properties: Record<string, unknown> = {},
  children: Array<ReturnType<typeof text> | ReturnType<typeof element>> = [],
) {
  return {
    type: 'element',
    tagName,
    properties,
    children,
  } as const;
}

export function createRecursiveComponent(tag: string, marker = tag) {
  return markRaw(defineComponent({
    name: `Test${tag[0]?.toUpperCase() ?? 'X'}${tag.slice(1)}`,
    props: ['element', 'nodeIdx', 'deep', 'nodeKey', 'parentNode'],
    render() {
      return h(tag, {
        'data-test-tag': marker,
        'data-node-key': String(this.nodeKey),
        'data-deep': String(this.deep),
      }, [
        h(NodeList, {
          nodes: this.element.children,
          nodeIdx: this.nodeIdx,
          deep: this.deep,
          nodeKey: this.nodeKey,
          parentNode: this.element,
        }),
      ]);
    },
  }));
}

export const NodeListHarness = defineComponent({
  name: 'NodeListHarness',
  props: {
    nodes: {
      type: Array,
      required: true,
    },
    components: {
      type: Object,
      default: () => ({}),
    },
    transition: {
      type: [Boolean, Object],
      default: false,
    },
  },
  setup(props) {
    useProvideMarkdown(computed(() => props.components), computed(() => props.transition));
    const parentNode = computed(() => ({
      type: 'root',
      children: props.nodes,
    }));

    return () => h(NodeList, {
      nodes: props.nodes,
      nodeKey: 'root',
      deep: 0,
      parentNode: parentNode.value,
    });
  },
});

export const MarkdownHarness = defineComponent({
  name: 'MarkdownHarness',
  props: {
    markdown: {
      type: String,
      required: true,
    },
    options: {
      type: Object,
      default: undefined,
    },
    plugins: {
      type: Array,
      default: undefined,
    },
    stream: {
      type: Boolean,
      default: false,
    },
    components: {
      type: Object,
      default: () => ({}),
    },
    transition: {
      type: [Boolean, Object],
      default: false,
    },
  },
  setup(props) {
    const processor = computed(() => createProcessor({
      ...props.options,
      plugins: props.plugins ?? [],
    }));

    const hast = shallowRef(parse(processor.value, props.markdown));
    let streamMemory: ReturnType<typeof createMemory> | undefined;
    let activeProcessor: ReturnType<typeof createProcessor> | undefined;

    watchEffect(() => {
      const currentProcessor = processor.value;

      if (activeProcessor && activeProcessor !== currentProcessor) {
        streamMemory = props.stream ? createMemory() : undefined;
      }

      activeProcessor = currentProcessor;

      if (props.stream) {
        streamMemory ??= createMemory();
        hast.value = parse(currentProcessor, props.markdown, streamMemory);
        return;
      }

      if (streamMemory) {
        streamMemory.flush = true;
        streamMemory = undefined;
        return;
      }

      hast.value = parse(currentProcessor, props.markdown);
    });

    useProvideMarkdown(computed(() => props.components), computed(() => props.transition));

    return () => h(NodeList, {
      nodes: hast.value.children,
      nodeKey: 'root',
      deep: 0,
      parentNode: hast.value,
    });
  },
});