import { describe, expect, it } from 'vitest'

import {
  createMarkSorceryPlugin,
  createMarkSorceryRehypePlugin,
  createMarkSorceryRemarkPlugin,
} from '@/plugins/factory.ts'

describe('plugin factory helpers', () => {
  it('returns plugin options unchanged', () => {
    const plugin = createMarkSorceryPlugin({
      remark: [() => undefined],
      rehype: [() => undefined],
    })

    expect(plugin.remark).toHaveLength(1)
    expect(plugin.rehype).toHaveLength(1)
  })

  it('wraps remark plugin entries', () => {
    const entry = () => undefined
    const plugin = createMarkSorceryRemarkPlugin(entry)

    expect(plugin.remark).toEqual([entry])
    expect(plugin.rehype).toBeUndefined()
  })

  it('wraps rehype plugin entries', () => {
    const entry = () => undefined
    const plugin = createMarkSorceryRehypePlugin(entry)

    expect(plugin.rehype).toEqual([entry])
    expect(plugin.remark).toBeUndefined()
  })
})
