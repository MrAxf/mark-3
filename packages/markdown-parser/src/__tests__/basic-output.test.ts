import { describe, expect, it } from 'vitest'

import { findNode, parseMarkdown } from './helpers.ts'

describe('basic output', () => {
  it('returns a HAST Root node', async () => {
    const result = await parseMarkdown('# Hello')
    expect(result.type).toBe('root')
  })

  it('parses heading', async () => {
    const result = await parseMarkdown('# Hello')
    const h1 = findNode(result, 'h1')
    expect(h1).toBeDefined()
  })

  it('parses bold', async () => {
    const result = await parseMarkdown('**bold**')
    const strong = findNode(result, 'strong')
    expect(strong).toBeDefined()
  })

  it('returns empty root for empty string', async () => {
    const result = await parseMarkdown('')
    expect(result.type).toBe('root')
    expect(result.children.length).toBe(0)
  })
})
