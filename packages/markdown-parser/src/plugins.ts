import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remendFn from 'remend'

import type {
  CorePluginOptions,
  HastPostprocessor,
  MarkdownPreprocessor,
  NormalizerOptions,
  ParseOptions,
  ParserPlugin,
  RemendOptions,
  UnifiedPluginEntry,
} from './types.ts'

const DEFAULT_TAB_WIDTH = 4
const DEFAULT_MAX_CONSECUTIVE_BLANK_LINES = 1

function arrayify<T>(value?: T | T[]): T[] {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

export function getPlugins(options?: ParseOptions): ParserPlugin[] {
  return options?.plugins ?? []
}

export function getPreprocessors(options?: ParseOptions): MarkdownPreprocessor[] {
  return getPlugins(options).flatMap((plugin) => arrayify(plugin.preprocess))
}

export function getPostprocessors(options?: ParseOptions): HastPostprocessor[] {
  return getPlugins(options).flatMap((plugin) => arrayify(plugin.postprocess))
}

export function getRemarkPlugins(options?: ParseOptions): UnifiedPluginEntry[] {
  return getPlugins(options).flatMap((plugin) => plugin.remark ?? [])
}

export function getRehypePlugins(options?: ParseOptions): UnifiedPluginEntry[] {
  return getPlugins(options).flatMap((plugin) => plugin.rehype ?? [])
}

function normalizeMarkdown(markdown: string, options?: NormalizerOptions): string {
  let normalized = markdown

  if (options?.lineEndings !== false) {
    normalized = normalized.replace(/\r\n?/g, '\n')
  }

  if (options?.tabWidth !== false) {
    const tabWidth = Math.max(0, Math.floor(options?.tabWidth ?? DEFAULT_TAB_WIDTH))
    normalized = normalized.replace(/\t/g, ' '.repeat(tabWidth))
  }

  if (options?.trimTrailingWhitespace !== false) {
    normalized = normalized.replace(/[ \t]+$/gm, '')
  }

  if (options?.maxConsecutiveBlankLines !== false) {
    const maxBlankLines = Math.max(
      0,
      Math.floor(options?.maxConsecutiveBlankLines ?? DEFAULT_MAX_CONSECUTIVE_BLANK_LINES),
    )
    const maxNewlines = maxBlankLines + 1
    normalized = normalized.replace(/\n{2,}/g, (match) => {
      if (match.length <= maxNewlines) {
        return match
      }

      return '\n'.repeat(maxNewlines)
    })
  }

  return normalized
}

/**
 * Build the package's default plugin preset.
 *
 * The preset can normalize markdown text, add text completion through `remend`,
 * enable GitHub Flavored Markdown support through `remark-gfm`, and sanitize
 * HTML through `rehype-sanitize`.
 */
export function createCorePlugin(options: CorePluginOptions = {}): ParserPlugin {
  const plugin: ParserPlugin = {}
  const preprocessors: MarkdownPreprocessor[] = []
  const normalizerOption = options.normalizer
  const remendOption = options.remend
  const gfmOption = options.gfm
  const sanitizeOption = options.sanitize

  if (normalizerOption !== false) {
    preprocessors.push((markdown: string) => {
      const normalizerOptions: NormalizerOptions | undefined =
        typeof normalizerOption === 'object' ? normalizerOption : undefined
      return normalizeMarkdown(markdown, normalizerOptions)
    })
  }

  if (remendOption !== false) {
    preprocessors.push((markdown: string) => {
      const remendOptions: RemendOptions | undefined =
        typeof remendOption === 'object' ? remendOption : undefined
      return remendFn(markdown, remendOptions)
    })
  }

  if (preprocessors.length === 1) {
    plugin.preprocess = preprocessors[0]
  } else if (preprocessors.length > 1) {
    plugin.preprocess = preprocessors
  }

  if (gfmOption !== false) {
    plugin.remark = [typeof gfmOption === 'object' ? [remarkGfm, gfmOption] : remarkGfm]
  }

  if (sanitizeOption !== false) {
    plugin.rehype = [[rehypeSanitize, sanitizeOption ?? defaultSchema]]
  }

  return plugin
}
