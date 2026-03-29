import type { Root } from 'hast'
import type { Options as SanitizeSchema } from 'rehype-sanitize'
import type { Options as RemarkGfmOptions } from 'remark-gfm'
import type { Options as RemarkRehypeOptions } from 'remark-rehype'
import type { RemendOptions } from 'remend'
import type { Processor } from 'unified'

import { harden } from 'rehype-harden'

export type { Root, RemendOptions }
export type { RemarkGfmOptions, SanitizeSchema }

export type MarkdownPreprocessor = (markdown: string) => string
export type UnifiedPluginFactory = (...args: any[]) => unknown
export type UnifiedPluginEntry = UnifiedPluginFactory | [UnifiedPluginFactory, ...unknown[]]

export interface ParserPlugin {
  remark?: UnifiedPluginEntry[]
  rehype?: UnifiedPluginEntry[]
}

export type RemarkHardenOptions = Parameters<typeof harden>[0]

export interface ParseOptions {
  /**
   * Text preprocessors executed before parsing markdown.
   * Pass `false` to disable all preprocessors.
   * @default false
   */
  preprocess?: boolean | PreprocessOptions
  /**
   * Plugins used when building a processor with `createProcessor(...)`.
   * The fixed pipeline always includes `remark-parse`, `remark-rehype` and `rehype-raw`.
   */
  plugins?: ParserPlugin[]
  /**
   * Extra options forwarded to `remark-rehype`.
   */
  remarkRehypeOptions?: RemarkRehypeOptions
  /**
   * Extra options for the rehype-harden step.
   */
  remarkHardenOptions?: RemarkHardenOptions
  /**
   * Pass `false` to disable GitHub Flavored Markdown.
   * Pass a `RemarkGfmOptions` object to configure the plugin.
   * @default true
   */
  gfm?: false | RemarkGfmOptions
  /**
   * Pass `false` to disable sanitization (unsafe — only use for trusted input).
   * Pass a custom `SanitizeSchema` object to override the default allowlist.
   * @default defaultSchema (from rehype-sanitize)
   */
  sanitize?: false | SanitizeSchema
  /**
   * Remove whitespace-only HAST text nodes generated between block elements.
   * Pass `false` to preserve those nodes.
   * @default true
   */
  removeBlankTextNodes?: false
}

export type AnyProcessor = Processor<any, any, any, any, any>

export interface MarkdownProcessor {
  /**
   * Unified processor with the fixed markdown-to-HAST pipeline already configured.
   */
  processor: AnyProcessor
  /**
   * Applies every configured markdown preprocessor in declaration order.
   */
  preprocess: (markdown: string) => string
}

export interface ParseMemory {
  /**
   * Full accumulated markdown received by the previous streaming call.
   */
  previousMarkdown?: string
  /**
   * Portion of the markdown that has been promoted to the confirmed prefix.
   */
  confirmedMarkdown?: string
  /**
   * Last top-level block kept separate while the stream is still growing.
   */
  pendingMarkdown?: string
  /**
   * Cached HAST root for the confirmed prefix.
   */
  previousConfirmedRoot?: Root
  /**
   * When true, the next streaming call promotes the pending block to confirmed.
   */
  flush?: boolean
}

export interface NormalizerOptions {
  /**
   * Convert Windows and classic Mac line endings to `\n`.
   * @default true
   */
  lineEndings?: boolean
  /**
   * Remove trailing spaces and tabs at the end of each line.
   * @default true
   */
  trimTrailingWhitespace?: boolean
  /**
   * Replace tabs with spaces. Pass `false` to preserve tabs.
   * @default 4
   */
  tabWidth?: number | false
  /**
   * Maximum number of consecutive blank lines to keep.
   * Pass `false` to preserve all blank lines.
   * @default 1
   */
  maxConsecutiveBlankLines?: number | false
}

export interface PreprocessOptions {
  /**
   * Pass `false` to disable remend completion of incomplete markdown.
   * Pass a `RemendOptions` object to configure which completions are active.
   * @default true
   */
  remend?: boolean | RemendOptions
  /**
   * Pass `false` to disable markdown normalization before parsing.
   * Pass a `NormalizerOptions` object to configure normalization rules.
   * @default true
   */
  normalizer?: boolean | NormalizerOptions
}
