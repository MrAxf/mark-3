import type { Element, Root } from 'hast'

import { createRecursiveComponent, MarkdownHarness, NodeList } from '@tests/test-helpers.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw, ref } from 'vue'

import type { ParserPlugin } from '@/types.ts'

import { useMarkdown } from '@/index.ts'

describe('Markdown', () => {
  it('renderiza markdown basico con componentes anidados', async () => {
    const wrapper = mount(MarkdownHarness, {
      props: {
        markdown: '**hola**',
        components: {
          p: createRecursiveComponent('p', 'paragraph'),
          strong: createRecursiveComponent('strong', 'bold'),
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test-tag="paragraph"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-tag="bold"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('hola')
  })

  it('actualiza el arbol renderizado cuando cambia markdown', async () => {
    const Parent = defineComponent({
      components: { MarkdownHarness },
      setup() {
        const markdown = ref('# Uno')

        return {
          markdown,
          components: {
            h1: createRecursiveComponent('h1', 'h1'),
            h2: createRecursiveComponent('h2', 'h2'),
          },
        }
      },
      template: '<MarkdownHarness :markdown="markdown" :components="components" />',
    })

    const wrapper = mount(Parent)

    await flushPromises()

    expect(wrapper.find('[data-test-tag="h1"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Uno')

    wrapper.vm.markdown = '## Dos'
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(wrapper.find('[data-test-tag="h1"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-tag="h2"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Dos')
  })

  it('reconstruye el processor cuando cambia plugins', async () => {
    const headingPlugin: ParserPlugin = {
      rehype: [
        () => (tree: Root) => {
          const heading = tree.children[0]
          if (heading?.type === 'element' && (heading as Element).tagName === 'h1') {
            ;(heading as Element).tagName = 'h2'
          }
        },
      ],
    }

    const wrapper = mount(MarkdownHarness, {
      props: {
        markdown: '# Titulo',
        components: {
          h1: createRecursiveComponent('h1', 'h1'),
          h2: createRecursiveComponent('h2', 'h2'),
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test-tag="h1"]').exists()).toBe(true)

    await wrapper.setProps({ plugins: [headingPlugin] })
    await flushPromises()

    expect(wrapper.find('[data-test-tag="h1"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-tag="h2"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Titulo')
  })

  it('mantiene el contenido confirmado cuando el stream crece', async () => {
    const wrapper = mount(MarkdownHarness, {
      props: {
        markdown: '# Title\n\n**hola',
        stream: true,
        components: {
          h1: createRecursiveComponent('h1', 'h1'),
          p: createRecursiveComponent('p', 'p'),
          strong: createRecursiveComponent('strong', 'strong'),
          ul: createRecursiveComponent('ul', 'ul'),
          li: createRecursiveComponent('li', 'li'),
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('hola')
    expect(wrapper.find('[data-test-tag="ul"]').exists()).toBe(false)

    await wrapper.setProps({ markdown: '# Title\n\n**hola\n\n- item' })
    await flushPromises()

    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('hola')
    expect(wrapper.find('[data-test-tag="ul"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-tag="li"]').text()).toBe('item')
  })

  it('renderiza tablas GFM por defecto y las deshabilita con options.gfm: false', async () => {
    const components = {
      p: createRecursiveComponent('p', 'paragraph'),
      table: createRecursiveComponent('table', 'table'),
      thead: createRecursiveComponent('thead', 'thead'),
      tbody: createRecursiveComponent('tbody', 'tbody'),
      tr: createRecursiveComponent('tr', 'tr'),
      th: createRecursiveComponent('th', 'th'),
      td: createRecursiveComponent('td', 'td'),
    }

    const withGfm = mount(MarkdownHarness, {
      props: {
        markdown: '| a | b |\n|---|---|\n| c | d |',
        components,
      },
    })

    await flushPromises()

    expect(withGfm.find('[data-test-tag="table"]').exists()).toBe(true)
    expect(withGfm.text()).toContain('abcd')

    const withoutGfm = mount(MarkdownHarness, {
      props: {
        markdown: '| a | b |\n|---|---|\n| c | d |',
        options: { gfm: false },
        components,
      },
    })

    await flushPromises()

    expect(withoutGfm.find('[data-test-tag="table"]').exists()).toBe(false)
  })

  it('permite componentes personalizados anidados y conserva la recursion', async () => {
    const CustomHeading = markRaw(
      defineComponent({
        name: 'CustomHeading',
        props: ['element', 'nodeIdx', 'deep', 'nodeKey', 'parentNode'],
        setup(props) {
          const { components, transition } = useMarkdown()

          return () =>
            h('h1', { 'data-test-tag': 'custom-heading' }, [
              h(NodeList, {
                nodes: props.element.children,
                nodeIdx: props.nodeIdx,
                deep: props.deep,
                nodeKey: props.nodeKey,
                parentNode: props.element,
                components: components.value,
                transition: transition.value,
              }),
            ])
        },
      }),
    )

    const wrapper = mount(MarkdownHarness, {
      props: {
        markdown: '# **Hola**',
        components: {
          h1: CustomHeading,
          strong: createRecursiveComponent('strong', 'bold'),
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test-tag="custom-heading"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-tag="bold"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Hola')
  })

  it('expone metadatos del nodo al componente personalizado', async () => {
    const calls: Array<{
      tagName: string
      nodeIdx: number
      deep: number
      nodeKey: string
      parentType: string
    }> = []

    const CaptureHeading = markRaw(
      defineComponent({
        name: 'CaptureHeading',
        props: ['element', 'nodeIdx', 'deep', 'nodeKey', 'parentNode'],
        setup(props) {
          calls.push({
            tagName: props.element.tagName,
            nodeIdx: props.nodeIdx,
            deep: props.deep,
            nodeKey: String(props.nodeKey),
            parentType: props.parentNode.type,
          })

          return () => null
        },
      }),
    )

    mount(MarkdownHarness, {
      props: {
        markdown: '# Hola',
        components: {
          h1: CaptureHeading,
        },
      },
    })

    await flushPromises()

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      tagName: 'h1',
      nodeIdx: 0,
      deep: 1,
      parentType: 'root',
    })
    expect(calls[0]?.nodeKey).toContain('element-h1-0')
  })
})
