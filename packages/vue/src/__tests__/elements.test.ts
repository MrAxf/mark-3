import type { Doctype } from 'hast'

import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { markRaw } from 'vue'

import DefaultComponent from '@/components/elements/Default.vue'
import GenericElement from '@/components/elements/GenericElement.vue'
import { DEFAULT_COMPONENTS } from '@/components/index.ts'
import { Markdown } from '@/Markdown.ts'
import { elementPropertiesToProps } from '@/utils/elementPropertiesToProps.ts'

import {
  createRecursiveComponent,
  element,
  MarkdownHarness,
  NodeListHarness,
  text,
} from './test-helpers.ts'

// Wrap each component in markRaw so Vue does not make them reactive objects
const RAW_DEFAULT_COMPONENTS = Object.fromEntries(
  Object.entries(DEFAULT_COMPONENTS).map(([k, v]) => [k, markRaw(v as any)]),
) as typeof DEFAULT_COMPONENTS

// ---------------------------------------------------------------------------
// Integration: render all standard markdown elements via DEFAULT_COMPONENTS
// ---------------------------------------------------------------------------

const FULL_MARKDOWN = `
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

Paragraph with **bold**, *italic*, ~~strikethrough~~, \`inline code\`, and [link](https://example.com).

> Blockquote content

---

- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2

- [x] Task done
- [ ] Task pending

\`\`\`
code block content
\`\`\`

| Column A | Column B |
|----------|----------|
| Cell A   | Cell B   |
`.trim()

describe('DEFAULT_COMPONENTS render integration', () => {
  it('renders all standard markdown elements', async () => {
    const wrapper = mount(MarkdownHarness, {
      props: {
        markdown: FULL_MARKDOWN,
        // sanitize: false ensures input/task-list elements are not stripped
        options: { sanitize: false },
        components: RAW_DEFAULT_COMPONENTS,
      },
    })

    const expectedSelectors = [
      '[data-mark-sorcery="heading"]',
      '[data-mark-sorcery="paragraph"]',
      '[data-mark-sorcery="link"]',
      '[data-mark-sorcery="bold"]',
      '[data-mark-sorcery="italic"]',
      '[data-mark-sorcery="strikethrough"]',
      '[data-mark-sorcery="code"]',
      '[data-mark-sorcery="code-block"]',
      '[data-mark-sorcery="horizontal-rule"]',
      '[data-mark-sorcery="blockquote"]',
      '[data-mark-sorcery="unordered-list"]',
      '[data-mark-sorcery="ordered-list"]',
      '[data-mark="list-item"]',
      '[data-mark-sorcery="task-list-input"]',
      '[data-mark-sorcery="table"]',
    ]

    await flushPromises()

    for (const selector of expectedSelectors) {
      expect(wrapper.find(selector).exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Individual element component tests (direct NodeListHarness, no async load)
// ---------------------------------------------------------------------------

describe('individual element components via NodeListHarness', () => {
  it('renders bold/italic/strikethrough/code/link inside a paragraph', async () => {
    const comps = {
      p: markRaw(GenericElement),
      strong: markRaw(GenericElement),
      em: markRaw(GenericElement),
      del: markRaw(GenericElement),
      code: markRaw(GenericElement),
      a: markRaw(GenericElement),
      text: RAW_DEFAULT_COMPONENTS.text,
    }

    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [
          element('p', {}, [
            element('strong', {}, [text('bold')]),
            element('em', {}, [text('italic')]),
            element('del', {}, [text('strike')]),
            element('code', {}, [text('code')]),
            element('a', { href: 'https://example.com' }, [text('link')]),
          ]),
        ],
        components: comps,
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-mark-sorcery="paragraph"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="bold"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="italic"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="strikethrough"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="code"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="link"]').exists()).toBe(true)
  })

  it('renders list-item and task-list-input inside a list', async () => {
    const comps = {
      ul: markRaw(GenericElement),
      li: markRaw(GenericElement),
      input: markRaw(GenericElement),
      text: RAW_DEFAULT_COMPONENTS.text,
    }

    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [
          element('ul', {}, [
            element('li', {}, [
              element('input', { type: 'checkbox', checked: true, disabled: true }),
              text('done'),
            ]),
          ]),
        ],
        components: comps,
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-mark-sorcery="unordered-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark="list-item"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="task-list-input"]').exists()).toBe(true)
  })

  it('renders full table structure', async () => {
    const comps = {
      table: markRaw(GenericElement),
      thead: markRaw(GenericElement),
      tbody: markRaw(GenericElement),
      tr: markRaw(GenericElement),
      th: markRaw(GenericElement),
      td: markRaw(GenericElement),
      text: RAW_DEFAULT_COMPONENTS.text,
    }

    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [
          element('table', {}, [
            element('thead', {}, [
              element('tr', {}, [element('th', {}, [text('A')]), element('th', {}, [text('B')])]),
            ]),
            element('tbody', {}, [
              element('tr', {}, [element('td', {}, [text('C')]), element('td', {}, [text('D')])]),
            ]),
          ]),
        ],
        components: comps,
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-mark-sorcery="table"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="table-head"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="table-body"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="table-row"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="table-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-mark-sorcery="table-data"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// NodeList transition branches
// ---------------------------------------------------------------------------

describe('NodeList transition support', () => {
  it('wraps items in VueTransition when transition is true', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [element('p', {}, [text('hello')])],
        components: { p: markRaw(createRecursiveComponent('p', 'p')) },
        transition: true,
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test-tag="p"]').exists()).toBe(true)
  })

  it('wraps items in VueTransition when transition is a config object', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [element('p', {}, [text('hello')])],
        components: { p: markRaw(createRecursiveComponent('p', 'p')) },
        transition: { name: 'fade', mode: 'out-in' },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test-tag="p"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Markdown.ts uncovered branches
// ---------------------------------------------------------------------------

describe('Markdown component edge cases', () => {
  it('uses empty components object when components prop is not provided', async () => {
    // Covers the `default: () => ({})` factory on the components prop (line 31)
    const wrapper = mount(Markdown, {
      props: { markdown: 'hello' },
    })

    await flushPromises()

    // Should mount without errors even with no registered components
    expect(wrapper).toBeDefined()
  })

  it('flushes stream memory when switching from stream:true to stream:false', async () => {
    // Covers lines 75-77: if (streamMemory) { flush; reset; return }
    const wrapper = mount(MarkdownHarness, {
      props: {
        markdown: '# Title\n\nParagraph',
        stream: true,
      },
    })

    await flushPromises()

    // Switch from streaming to non-streaming – triggers the flush branch
    await wrapper.setProps({ stream: false })
    await flushPromises()

    expect(wrapper).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// elementPropertiesToProps uncovered branches
// ---------------------------------------------------------------------------

describe('elementPropertiesToProps edge cases', () => {
  it('returns empty object when properties is null or undefined', () => {
    // Covers line 52: return {}
    expect(elementPropertiesToProps(undefined)).toEqual({})
    expect(elementPropertiesToProps(null)).toEqual({})
  })

  it('normalizes string className (not array)', () => {
    // Covers lines 19-23: typeof value === 'string' branch in normalizeClassValue
    expect(elementPropertiesToProps({ className: 'foo bar baz' })).toEqual({
      class: ['foo', 'bar', 'baz'],
    })
  })

  it('skips properties with null or undefined values', () => {
    // Covers line 58: return props for null/undefined propertyValue
    expect(elementPropertiesToProps({ href: null, src: undefined, alt: 'image' })).toEqual({
      alt: 'image',
    })
  })
})

// ---------------------------------------------------------------------------
// Generic heading rendering
// ---------------------------------------------------------------------------

describe('GenericElement heading markers', () => {
  it('sets correct data-heading-level from tagName h1-h6', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [element('h3', {}, [text('Heading 3')])],
        components: { h3: markRaw(GenericElement), text: RAW_DEFAULT_COMPONENTS.text },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-heading-level="3"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Default component (rendered for unregistered element tags)
// ---------------------------------------------------------------------------

describe('Default component fallback', () => {
  it('renders default component for non-element, non-text HAST node types', async () => {
    // Default.vue is used when getNodeComponent falls into the else branch:
    // node.type is neither 'text' nor 'element' (e.g. 'doctype').
    const doctypeNode: Doctype = { type: 'doctype' }

    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [doctypeNode as any],
        components: { default: markRaw(DefaultComponent) },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-mark-sorcery="not-supported"]').exists()).toBe(true)
  })

  it('renders task list input defaults through GenericElement', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [element('input', { checked: true })],
        components: { input: markRaw(GenericElement) },
      },
    })

    await flushPromises()

    const input = wrapper.find('[data-mark-sorcery="task-list-input"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('checkbox')
    expect(input.attributes()).toHaveProperty('disabled')
  })
})
