import { describe, expect, it } from 'vitest'

import { findNode, parseMarkdown, textContent } from './helpers.ts'

describe('preprocess options', () => {
  it('runs normalizer and remend when enabled', () => {
    const result = parseMarkdown('**incomplete', {
      preprocess: true,
    })

    expect(findNode(result, 'strong')).toBeDefined()
    expect(textContent(result)).toContain('incomplete')
  })

  it('allows disabling remend', () => {
    const result = parseMarkdown('**incomplete', {
      preprocess: {
        remend: false,
      },
    })

    expect(findNode(result, 'strong')).toBeUndefined()
  })

  it('accepts remend options', () => {
    const result = parseMarkdown('**incomplete', {
      preprocess: {
        remend: { bold: false },
      },
    })

    expect(findNode(result, 'strong')).toBeUndefined()
  })

  it('accepts normalizer options', () => {
    const result = parseMarkdown('line 1\n\n\n\nline 2', {
      preprocess: {
        normalizer: {
          maxConsecutiveBlankLines: 0,
        },
      },
    })

    expect(textContent(result)).toContain('line 1\nline 2')
    expect(textContent(result)).not.toContain('\n\n')
  })

  it('supports disabling line ending and tab normalization', () => {
    const result = parseMarkdown('a\tb\r\n\r\nc', {
      preprocess: {
        normalizer: {
          lineEndings: false,
          tabWidth: false,
          maxConsecutiveBlankLines: false,
        },
      },
    })

    expect(textContent(result)).toContain('a\tb')
  })

  it('allows disabling all preprocessors', () => {
    const result = parseMarkdown('**incomplete\t', {
      preprocess: false,
    })

    expect(findNode(result, 'strong')).toBeUndefined()
  })

  it('removes BOM and null characters during normalization', () => {
    const result = parseMarkdown('\uFEFFhello\u0000 world', {
      preprocess: true,
    })

    expect(textContent(result)).toContain('hello world')
    expect(textContent(result)).not.toContain('\u0000')
    expect(textContent(result).startsWith('\uFEFF')).toBe(false)
  })
})
