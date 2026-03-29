import type { ParseOptions, ParserPlugin, UnifiedPluginEntry } from '@/types'

export function getPlugins(options?: ParseOptions): ParserPlugin[] {
  return options?.plugins ?? []
}

export function getRemarkPlugins(options?: ParseOptions): UnifiedPluginEntry[] {
  return getPlugins(options).flatMap((plugin) => plugin.remark ?? [])
}

export function getRehypePlugins(options?: ParseOptions): UnifiedPluginEntry[] {
  return getPlugins(options).flatMap((plugin) => plugin.rehype ?? [])
}
