import { describe, expect, it } from 'vitest'

import { findNode, findNodes, parseMarkdown, textContent } from './helpers.ts'

describe('rehype-harden', () => {
  it('blocks links with dangerous protocols by default', async () => {
    const result = await parseMarkdown('[malicious](javascript:alert(1))')

    expect(findNode(result, 'a')).toBeUndefined()

    const blockedIndicator = findNodes(result, 'span').find((node) =>
      textContent(node).includes('[blocked]'),
    )

    expect(blockedIndicator).toBeDefined()
    expect(textContent(blockedIndicator!)).toContain('malicious')
  })

  it('adds security attributes to allowed links', async () => {
    const result = await parseMarkdown('[safe](https://example.com/docs)')
    const link = findNode(result, 'a')

    expect(link).toBeDefined()
    expect(link?.properties.href).toBe('https://example.com/docs')
    expect(link?.properties.target).toBe('_blank')
    expect(link?.properties.rel).toEqual(['noopener', 'noreferrer'])
  })

  it('allows custom protocols when configured', async () => {
    const blocked = await parseMarkdown('[open](vscode://file/c:/temp/demo.ts)', {
      sanitize: false,
      remarkHardenOptions: {
        allowedProtocols: [],
      },
    })
    const allowed = await parseMarkdown('[open](vscode://file/c:/temp/demo.ts)', {
      sanitize: false,
      remarkHardenOptions: {
        allowedProtocols: ['vscode:'],
      },
    })

    expect(findNode(blocked, 'a')).toBeUndefined()
    expect(findNode(allowed, 'a')?.properties.href).toBe('vscode://file/c:/temp/demo.ts')
  })

  it('respects allowedLinkPrefixes for relative URLs with defaultOrigin', async () => {
    const allowed = await parseMarkdown('[docs](/docs/intro)', {
      remarkHardenOptions: {
        defaultOrigin: 'https://mark.test',
        allowedLinkPrefixes: ['https://mark.test/docs/'],
      },
    })
    const blocked = await parseMarkdown('[outside](/blog/post)', {
      remarkHardenOptions: {
        defaultOrigin: 'https://mark.test',
        allowedLinkPrefixes: ['https://mark.test/docs/'],
      },
    })

    expect(findNode(allowed, 'a')?.properties.href).toBe('/docs/intro')
    expect(findNode(blocked, 'a')).toBeUndefined()
  })

  it('allows data images by default and can disable them', async () => {
    const enabled = await parseMarkdown('![inline](data:image/png;base64,abcd)', {
      sanitize: false,
    })
    const disabled = await parseMarkdown('![inline](data:image/png;base64,abcd)', {
      sanitize: false,
      remarkHardenOptions: {
        allowDataImages: false,
      },
    })

    expect(findNode(enabled, 'img')?.properties.src).toBe('data:image/png;base64,abcd')
    expect(findNode(disabled, 'img')).toBeUndefined()
    expect(textContent(disabled)).toContain('[Image blocked: inline]')
  })
})
