import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, markRaw, ref, Transition } from 'vue';
import { Markdown } from '../Markdown.ts';

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

describe('parser options via prop', () => {
  it('disables GFM tables when options.gfm is false', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const wrapper = mount(Markdown, { props: { markdown: md, options: { gfm: false } } });
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('enables GFM tables by default', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const wrapper = mount(Markdown, { props: { markdown: md } });
    expect(wrapper.find('table').exists()).toBe(true);
  });

  it('completes incomplete markdown with remend by default', () => {
    const wrapper = mount(Markdown, { props: { markdown: '**incomplete' } });
    expect(wrapper.find('strong').exists()).toBe(true);
  });

  it('does not complete markdown when options.remend is false', () => {
    const wrapper = mount(Markdown, { props: { markdown: '**incomplete', options: { remend: false } } });
    expect(wrapper.find('strong').exists()).toBe(false);
  });
});

// ─── sanitization ─────────────────────────────────────────────────────────────

describe('sanitization', () => {
  it('removes script tags by default', () => {
    const wrapper = mount(Markdown, { props: { markdown: '<script>alert("xss")</script>' } });
    expect(wrapper.find('script').exists()).toBe(false);
  });

  it('keeps safe tags by default', () => {
    const wrapper = mount(Markdown, { props: { markdown: '<b>safe</b>' } });
    expect(wrapper.find('b').exists()).toBe(true);
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

// ─── transition ───────────────────────────────────────────────────────────────

describe('transition', () => {
  it('does not wrap elements in Transition by default', () => {
    const wrapper = mount(Markdown, { props: { markdown: '# Hello' } });
    expect(wrapper.findComponent(Transition).exists()).toBe(false);
  });

  it('transition: true wraps elements in Transition without errors', () => {
    expect(() =>
      mount(Markdown, { props: { markdown: '# Hello\n\nParagraph.', transition: true } }),
    ).not.toThrow();

    const wrapper = mount(Markdown, {
      props: { markdown: '# Hello\n\nParagraph.', transition: true },
    });
    expect(wrapper.findComponent(Transition).exists()).toBe(true);
  });

  it('transition: { name: "fade" } forwards name prop to Transition components', () => {
    const wrapper = mount(Markdown, {
      props: { markdown: '# Hello', transition: { name: 'fade' } },
    });
    const transition = wrapper.findComponent(Transition);
    expect(transition.exists()).toBe(true);
    expect(transition.props('name')).toBe('fade');
  });

  it('transition: { appear: true } mounts without errors', () => {
    expect(() =>
      mount(Markdown, {
        props: { markdown: '# Hello\n\nParagraph.', transition: { appear: true } },
      }),
    ).not.toThrow();
  });

  it('each element node gets its own Transition wrapper', () => {
    const wrapper = mount(Markdown, {
      props: { markdown: '# One\n\n## Two', transition: true },
    });
    const transitions = wrapper.findAllComponents(Transition);
    // h1 and h2 are two distinct top-level elements → at least 2 Transition wrappers
    expect(transitions.length).toBeGreaterThanOrEqual(2);
  });

  it('transition: false leaves Transition out', () => {
    const wrapper = mount(Markdown, {
      props: { markdown: '# Hello', transition: false },
    });
    expect(wrapper.findComponent(Transition).exists()).toBe(false);
  });
});
