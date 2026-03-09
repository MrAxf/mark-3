import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, markRaw, ref } from 'vue';
import { createCorePlugin, Markdown, type ParserPlugin } from '../index.ts';

// ─── basic rendering ─────────────────────────────────────────────────────────

describe('basic rendering', () => {
  it('renders a heading from markdown', () => {
    const wrapper = mount(Markdown, { props: { markdown: '# Hello' } });
    expect(wrapper.find('h1').exists()).toBe(true);
    expect(wrapper.find('h1').text()).toBe('Hello');
  });

  it('renders bold text', () => {
    const wrapper = mount(Markdown, { props: { markdown: '**bold**' } });
    expect(wrapper.find('strong').exists()).toBe(true);
  });

  it('renders empty markdown without errors', () => {
    expect(() => mount(Markdown, { props: { markdown: '' } })).not.toThrow();
  });
});

// ─── reactivity ──────────────────────────────────────────────────────────────

describe('reactivity', () => {
  it('updates the DOM when markdown prop changes', async () => {
    const Parent = defineComponent({
      setup() {
        const md = ref('# First');
        return { md };
      },
      components: { Markdown },
      template: '<Markdown :markdown="md" />',
    });

    const wrapper = mount(Parent);
    expect(wrapper.find('h1').text()).toBe('First');

    wrapper.vm.md = '# Second';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('h1').text()).toBe('Second');
  });
});

// ─── parser options ───────────────────────────────────────────────────────────

describe('processor plugins via prop', () => {
  it('reexports createCorePlugin from the package entry', () => {
    expect(createCorePlugin()).toMatchObject({});
  });

  it('disables GFM tables when the core plugin turns gfm off', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const wrapper = mount(Markdown, {
      props: {
        markdown: md,
        plugins: [createCorePlugin({ gfm: false })],
      },
    });
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('renders GFM tables when the core plugin is provided', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const wrapper = mount(Markdown, {
      props: {
        markdown: md,
        plugins: [createCorePlugin()],
      },
    });
    expect(wrapper.find('table').exists()).toBe(true);
  });

  it('completes incomplete markdown when the core plugin enables remend', () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '**incomplete',
        plugins: [createCorePlugin()],
      },
    });
    expect(wrapper.find('strong').exists()).toBe(true);
  });

  it('does not complete markdown when the core plugin disables remend', () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '**incomplete',
        plugins: [createCorePlugin({ remend: false })],
      },
    });
    expect(wrapper.find('strong').exists()).toBe(false);
  });

  it('recomputes the processor when the plugins prop changes', async () => {
    const headingPlugin: ParserPlugin = {
      postprocess: (root) => {
        const heading = root.children[0];
        if (heading?.type === 'element' && heading.tagName === 'h1') {
          heading.tagName = 'h2';
        }
        return root;
      },
    };

    const wrapper = mount(Markdown, {
      props: {
        markdown: '# Title',
        plugins: [createCorePlugin()],
      },
    });

    expect(wrapper.find('h1').exists()).toBe(true);

    await wrapper.setProps({ plugins: [headingPlugin] });

    expect(wrapper.find('h1').exists()).toBe(false);
    expect(wrapper.find('h2').text()).toBe('Title');
  });
});

// ─── sanitization ─────────────────────────────────────────────────────────────

describe('sanitization', () => {
  it('removes script tags by default', () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '<script>alert("xss")</script>',
        plugins: [createCorePlugin()],
      },
    });
    expect(wrapper.find('script').exists()).toBe(false);
  });

  it('keeps safe tags by default', () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '<b>safe</b>',
        plugins: [createCorePlugin()],
      },
    });
    expect(wrapper.find('b').exists()).toBe(true);
  });
});

// ─── streaming ───────────────────────────────────────────────────────────────

describe('streaming', () => {
  it('reuses parse memory while the stream grows', async () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '# Title\n\n**hola',
        plugins: [createCorePlugin()],
        stream: true,
      },
    });

    expect(wrapper.find('h1').text()).toBe('Title');
    expect(wrapper.find('strong').text()).toBe('hola');

    await wrapper.setProps({ markdown: '# Title\n\n**hola\n\n- item' });

    expect(wrapper.find('h1').text()).toBe('Title');
    expect(wrapper.find('strong').text()).toBe('hola');
    expect(wrapper.find('ul').exists()).toBe(true);
  });

  it('flushes pending memory when stream changes from true to false without changing output', async () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '**hola',
        plugins: [createCorePlugin()],
        stream: true,
      },
    });

    const before = wrapper.html();

    await wrapper.setProps({ stream: false });

    expect(wrapper.html()).toBe(before);
    expect(wrapper.find('strong').exists()).toBe(true);

    await wrapper.setProps({ markdown: 'plain text' });

    expect(wrapper.find('strong').exists()).toBe(false);
    expect(wrapper.text()).toContain('plain text');
  });
});

// ─── custom components ────────────────────────────────────────────────────────

describe('custom components', () => {
  it('replaces a tag with a custom component', () => {
    const MyH1 = markRaw(defineComponent({
      props: ['class'],
      template: '<h1 data-custom="true"><slot /></h1>',
    }));

    const wrapper = mount(Markdown, {
      props: {
        markdown: '# Title',
        components: { h1: MyH1 },
      },
    });

    expect(wrapper.find('[data-custom="true"]').exists()).toBe(true);
  });

  it('uses default element when no custom component specified', () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '## Default',
        components: {},
      },
    });
    expect(wrapper.find('h2').exists()).toBe(true);
  });

  it('accepts a function resolver as components prop', () => {
    const MyH1 = markRaw(defineComponent({
      props: ['class'],
      template: '<h1 data-fn-custom="true"><slot /></h1>',
    }));

    const wrapper = mount(Markdown, {
      props: {
        markdown: '# Title',
        components: (node: { tagName: string }) => node.tagName === 'h1' ? MyH1 : undefined,
      },
    });

    expect(wrapper.find('[data-fn-custom="true"]').exists()).toBe(true);
  });

  it('function resolver returning undefined uses default element', () => {
    const wrapper = mount(Markdown, {
      props: {
        markdown: '## Heading',
        components: () => undefined,
      },
    });
    expect(wrapper.find('h2').exists()).toBe(true);
  });
});
