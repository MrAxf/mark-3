import type { Element, Root, RootContent } from 'hast'

import { describe, expect, it } from 'vitest'

import { findNode, parseMarkdown } from './helpers.ts'

function collectBlankTextNodes(root: Root): RootContent[] {
  const matches: RootContent[] = []
  const queue: (Root | Element)[] = [root]

  while (queue.length > 0) {
    const current = queue.shift()!

    for (const child of current.children as RootContent[]) {
      if (child.type === 'text' && child.value.trim() === '') {
        matches.push(child)
      }

      if (child.type === 'element') {
        queue.push(child)
      }
    }
  }

  return matches
}

describe('hast whitespace nodes', () => {
  it('removes whitespace-only text nodes by default', () => {
    const result = parseMarkdown('# Title\n\nParagraph')

    expect(findNode(result, 'h1')).toBeDefined()
    expect(findNode(result, 'p')).toBeDefined()
    expect(collectBlankTextNodes(result)).toHaveLength(0)
  })

  it('preserves whitespace-only text nodes when removeBlankTextNodes is false', () => {
    const result = parseMarkdown('# Title\n\nParagraph', {
      removeBlankTextNodes: false,
    })

    expect(collectBlankTextNodes(result).length).toBeGreaterThan(0)
  })

  it('does not strip blank text nodes inside pre', () => {
    const result = parseMarkdown('<pre>\n\n</pre>\n\nAfter')
    const pre = findNode(result, 'pre')

    expect(pre).toBeDefined()
    expect(pre!.children.some((child) => child.type === 'text' && child.value.trim() === '')).toBe(
      true,
    )
  })
})
