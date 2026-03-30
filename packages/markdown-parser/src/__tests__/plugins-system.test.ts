import { describe, expect, it } from 'vitest'

import {
  findNode,
  parseMarkdown,
  promoteElementPlugin,
  promoteHeadingPlugin,
  textContent,
} from './helpers.ts'

describe('plugin system', () => {
  it('runs remark plugins and rehype plugins in order', async () => {
    const trace: string[] = []

    const result = await parseMarkdown('# hello', {
      plugins: [
        {
          remark: [
            [
              () => {
                trace.push('remark:setup')
                return (tree: any) => {
                  trace.push('remark:run')
                  for (const child of tree.children ?? []) {
                    if (child.type === 'heading') {
                      child.depth = 2
                    }
                  }
                }
              },
            ],
          ],
          rehype: [
            [
              () => {
                trace.push('rehype:setup')
                return (tree: any) => {
                  trace.push('rehype:run')
                  for (const child of tree.children ?? []) {
                    if (child.type === 'element' && child.tagName === 'h2') {
                      child.tagName = 'h3'
                    }
                  }
                }
              },
            ],
          ],
        },
      ],
    })

    expect(trace).toEqual(['remark:setup', 'rehype:setup', 'remark:run', 'rehype:run'])
    expect(findNode(result, 'h1')).toBeUndefined()
    expect(findNode(result, 'h2')).toBeUndefined()
    expect(findNode(result, 'h3')).toBeDefined()
    expect(textContent(result)).toContain('hello')
  })

  it('always keeps the fixed parse pipeline around custom plugins', async () => {
    const result = await parseMarkdown('Hello <b>world</b>', {
      plugins: [
        {
          remark: [promoteHeadingPlugin],
          rehype: [promoteElementPlugin],
        },
      ],
    })

    const paragraph = findNode(result, 'p')
    const bold = findNode(result, 'b')
    expect(paragraph).toBeDefined()
    expect(bold).toBeDefined()
  })

  it('accepts a remark-only plugin (no rehype side)', async () => {
    // Ensures the rehype ?? [] fallback path in getRehypePlugins is exercised
    const result = await parseMarkdown('# heading', {
      plugins: [{ remark: [promoteHeadingPlugin] }],
    })

    expect(findNode(result, 'h1')).toBeUndefined()
    expect(findNode(result, 'h2')).toBeDefined()
  })

  it('accepts a rehype-only plugin (no remark side)', async () => {
    // Ensures the remark ?? [] fallback path in getRemarkPlugins is exercised
    const result = await parseMarkdown('Hello <b>world</b>', {
      plugins: [{ rehype: [promoteElementPlugin] }],
    })

    expect(findNode(result, 'b')).toBeDefined()
  })
})
