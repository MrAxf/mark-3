import type { ParserPlugin, UnifiedPluginEntry } from '@/types'

export const createMarkSorceryPlugin = (options: ParserPlugin): ParserPlugin => options

export const createMarkSorceryRemarkPlugin = (options: UnifiedPluginEntry): ParserPlugin =>
  createMarkSorceryPlugin({
    remark: [options],
  })

export const createMarkSorceryRehypePlugin = (options: UnifiedPluginEntry): ParserPlugin =>
  createMarkSorceryPlugin({
    rehype: [options],
  })
