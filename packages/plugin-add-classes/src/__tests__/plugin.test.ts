import type { Element, Root } from 'hast'

import { createProcessor, parse } from '@mark-sorcery/markdown-parser'
import { describe, expect, it } from 'vitest'

import { createAddClassesPlugin, rehypeAddClasses } from '@/index.ts'

function parseMarkdown(markdown: string, plugins = [createAddClassesPlugin()]): Promise<Root> {
  // Parser enables sanitize by default; disable it in tests so className can be asserted.
  return parse(createProcessor({ plugins, sanitize: false }), markdown)
}

function findElement(root: Root, tagName: string): Element | undefined {
  const queue: Array<Root | Element> = [root]

  while (queue.length > 0) {
    const current = queue.shift()

    if (!current) {
      continue
    }

    if (current.type === 'element' && current.tagName === tagName) {
      return current
    }

    if ('children' in current) {
      for (const child of current.children) {
        if (child.type === 'element') {
          queue.push(child)
        }
      }
    }
  }

  return undefined
}

function getClassNames(node?: Element): string[] {
  if (!node) {
    return []
  }

  const className = node.properties?.className

  if (typeof className === 'string') {
    return className.split(/\s+/).filter(Boolean)
  }

  if (Array.isArray(className)) {
    return className.map(String)
  }

  return []
}

describe('createAddClassesPlugin', () => {
  it('adds classes to configured markdown elements', async () => {
    const result = await parseMarkdown('# Title\n\nParagraph', [
      createAddClassesPlugin({
        elements: {
          h1: 'heading heading-xl',
          p: ['copy', 'copy-body'],
        },
      }),
    ])

    expect(getClassNames(findElement(result, 'h1'))).toEqual(['heading', 'heading-xl'])
    expect(getClassNames(findElement(result, 'p'))).toEqual(['copy', 'copy-body'])
  })

  it('merges classes with existing className values', async () => {
    const result = await parseMarkdown('<p class="existing">Hello</p>', [
      createAddClassesPlugin({
        elements: {
          p: ['existing', 'copy'],
        },
      }),
    ])

    expect(getClassNames(findElement(result, 'p'))).toEqual(['existing', 'copy'])
  })

  it('does nothing for tags that are not configured', async () => {
    const result = await parseMarkdown('Paragraph', [
      createAddClassesPlugin({
        elements: {
          h1: 'heading',
        },
      }),
    ])

    expect(getClassNames(findElement(result, 'p'))).toEqual([])
  })
})

describe('rehypeAddClasses', () => {
  it('can be used directly as a rehype plugin entry', async () => {
    const result = await parse(
      createProcessor({
        sanitize: false,
        plugins: [
          {
            rehype: [[rehypeAddClasses, { elements: { strong: 'font-semibold' } }]],
          },
        ],
      }),
      '**bold**',
    )

    expect(getClassNames(findElement(result, 'strong'))).toEqual(['font-semibold'])
  })

  it('merges when existing className is a string property', async () => {
    const setStringClassName = () => (tree: Root) => {
      const paragraph = findElement(tree, 'p')

      if (!paragraph) {
        return
      }

      paragraph.properties = {
        ...paragraph.properties,
        className: 'existing-string',
      }
    }

    const result = await parse(
      createProcessor({
        sanitize: false,
        plugins: [
          {
            rehype: [setStringClassName, [rehypeAddClasses, { elements: { p: 'copy' } }]],
          },
        ],
      }),
      'Paragraph',
    )

    expect(getClassNames(findElement(result, 'p'))).toEqual(['existing-string', 'copy'])
  })

  it('merges when existing className is an array property', async () => {
    const setArrayClassName = () => (tree: Root) => {
      const paragraph = findElement(tree, 'p')

      if (!paragraph) {
        return
      }

      paragraph.properties = {
        ...paragraph.properties,
        className: ['existing-array'],
      }
    }

    const result = await parse(
      createProcessor({
        sanitize: false,
        plugins: [
          {
            rehype: [setArrayClassName, [rehypeAddClasses, { elements: { p: 'copy' } }]],
          },
        ],
      }),
      'Paragraph',
    )

    expect(getClassNames(findElement(result, 'p'))).toEqual(['existing-array', 'copy'])
  })
})
