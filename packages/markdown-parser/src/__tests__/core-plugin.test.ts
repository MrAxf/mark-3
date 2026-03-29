import { describe, expect, it } from 'vitest'

import { findNode, parseMarkdown } from './helpers.ts'

describe('gfm option', () => {
  it('enables GitHub Flavored Markdown by default', () => {
    const md = '| a | b |\n|---|---|\n| c | d |'

    const result = parseMarkdown(md)

    expect(findNode(result, 'table')).toBeDefined()
  })

  it('allows disabling gfm', () => {
    const md = '| a | b |\n|---|---|\n| c | d |'

    const result = parseMarkdown(md, { gfm: false })

    expect(findNode(result, 'table')).toBeUndefined()
  })
})

describe('sanitize option', () => {
  it('removes unsafe elements by default', () => {
    const result = parseMarkdown('<script>alert("xss")</script>')
    const script = findNode(result, 'script')
    expect(script).toBeUndefined()
  })

  it('allows disabling sanitize', () => {
    const result = parseMarkdown('<script>alert("xss")</script>', { sanitize: false })
    const script = findNode(result, 'script')
    expect(script).toBeDefined()
  })

  it('accepts a custom sanitize schema', () => {
    const result = parseMarkdown('<mark>highlighted</mark>', {
      sanitize: {
        tagNames: ['mark', 'p'],
        attributes: {},
      },
    })
    const mark = findNode(result, 'mark')
    expect(mark).toBeDefined()
  })
})
