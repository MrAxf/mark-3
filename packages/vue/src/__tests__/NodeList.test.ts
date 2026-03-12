import { createRecursiveComponent, element, NodeListHarness, text } from '@tests/test-helpers.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, markRaw } from 'vue'

describe('NodeList', () => {
  it('renderiza nodos de texto sin envoltorios extra', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [text('hola')],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toBe('hola')
  })

  it('renderiza componentes personalizados anidados de forma recursiva', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [element('p', {}, [text('hola '), element('strong', {}, [text('mundo')])])],
        components: {
          p: createRecursiveComponent('p', 'paragraph'),
          strong: createRecursiveComponent('strong', 'bold'),
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test-tag="paragraph"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-tag="bold"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('hola mundo')
  })

  it('inyecta metadatos estructurales al componente de cada nodo', async () => {
    const calls: Array<{
      tagName: string
      nodeIdx: number
      deep: number
      nodeKey: string
      parentType: string
    }> = []

    const CaptureParagraph = markRaw(
      defineComponent({
        name: 'CaptureParagraph',
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

    mount(NodeListHarness, {
      props: {
        nodes: [element('p', {}, [text('hola')])],
        components: {
          p: CaptureParagraph,
        },
      },
    })

    await flushPromises()

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      tagName: 'p',
      nodeIdx: 0,
      deep: 1,
      parentType: 'root',
    })
    expect(calls[0]?.nodeKey).toContain('element-p-0')
  })

  it('omite elementos sin componente registrado', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [element('span', {}, [text('oculto')])],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toBe('')
    expect(wrapper.find('span').exists()).toBe(false)
  })
})
