import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import GenericElement from '@/components/elements/GenericElement.vue'
import { elementPropertiesToProps } from '@/utils/elementPropertiesToProps.ts'

import { element, NodeListHarness, text } from './test-helpers.ts'

describe('elementPropertiesToProps', () => {
  it('normaliza propiedades de HAST a props compatibles con Vue', () => {
    expect(
      elementPropertiesToProps({
        className: ['foo', 'bar baz'],
        rel: ['noopener', 'noreferrer'],
        htmlFor: 'input-id',
        ariaHidden: true,
        dataFooBar: 'baz',
        tabIndex: 0,
      }),
    ).toEqual({
      class: ['foo', 'bar', 'baz'],
      rel: 'noopener noreferrer',
      for: 'input-id',
      'aria-hidden': true,
      'data-foo-bar': 'baz',
      tabIndex: 0,
    })
  })

  it('aplica props normalizadas al DOM de los componentes base', async () => {
    const wrapper = mount(NodeListHarness, {
      props: {
        nodes: [
          element(
            'a',
            {
              href: 'https://example.com',
              className: ['foo', 'bar baz'],
              rel: ['noopener', 'noreferrer'],
              dataFooBar: 'baz',
              ariaHidden: true,
            },
            [text('link')],
          ),
          element('input', {
            checked: true,
            className: ['task-item'],
          }),
        ],
        components: {
          a: GenericElement,
          input: GenericElement,
        },
      },
    })

    await flushPromises()

    const anchor = wrapper.get('a')
    const checkbox = wrapper.get('input')

    expect(anchor.attributes('href')).toBe('https://example.com')
    expect(anchor.attributes('rel')).toBe('noopener noreferrer')
    expect(anchor.attributes('data-foo-bar')).toBe('baz')
    expect(anchor.attributes('aria-hidden')).toBe('true')
    expect(anchor.classes()).toEqual(expect.arrayContaining(['foo', 'bar', 'baz']))
    expect((checkbox.element as { checked: boolean }).checked).toBe(true)
    expect(checkbox.classes()).toContain('task-item')
  })
})
