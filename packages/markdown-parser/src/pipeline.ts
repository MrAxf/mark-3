import type { Processor } from 'unified'

import { harden } from 'rehype-harden'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

// Extend the default allowlist to preserve `target` and `rel` added by rehype-harden
const PACKAGE_DEFAULT_SANITIZE_SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // defaultSchema always defines attributes.a; the cast avoids an optional-chaining branch
    a: [...(defaultSchema.attributes!.a as string[]), 'target', 'rel'],
  },
}
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import type { AnyProcessor, MarkdownProcessor, ParseOptions, RemarkHardenOptions } from '@/types.ts'
import type { UnifiedPluginEntry } from '@/types.ts'

import { getRehypePlugins, getRemarkPlugins } from '@/plugins/utils.ts'
import { getPreprocessors } from '@/preprocess/index.ts'

import { stripBlankTextNodesPlugin } from './rehype/strip-blank-text-nodes.ts'

const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true }

const DEFAULT_REHYPE_HARDEN_OPTIONS: RemarkHardenOptions = {
  allowedImagePrefixes: ['*'],
  allowedLinkPrefixes: ['*'],
  allowedProtocols: ['*'],
  allowDataImages: true,
}

function applyPlugins(processor: AnyProcessor, plugins: UnifiedPluginEntry[]): AnyProcessor {
  let current = processor

  for (const plugin of plugins) {
    if (Array.isArray(plugin)) {
      const [pluginFactory, ...args] = plugin
      current = current.use(pluginFactory as any, ...(args as any[])) as Processor
      continue
    }

    current = current.use(plugin as any) as Processor
  }

  return current
}

/**
 * Create a reusable markdown processor from parser options.
 *
 * The resulting processor keeps the fixed unified pipeline:
 * `remark-parse -> remark-gfm? -> remark plugins -> remark-rehype -> rehype-harden ->
 * rehype-raw -> rehype plugins -> rehype-sanitize?`.
 * Text preprocessors run before parsing.
 */
export function createProcessor(options?: ParseOptions): MarkdownProcessor {
  const remarkPlugins = getRemarkPlugins(options)
  const rehypePlugins = getRehypePlugins(options)

  const preprocessors = getPreprocessors(options)

  let processor = unified().use(remarkParse) as unknown as AnyProcessor

  // remark-gfm: enabled by default, opt-out with gfm: false
  if (options?.gfm !== false) {
    const gfmOptions = typeof options?.gfm === 'object' ? options.gfm : undefined
    processor = processor.use(remarkGfm, gfmOptions) as AnyProcessor
  }

  processor = applyPlugins(processor, remarkPlugins)

  const remarkRehypeOptions = { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options?.remarkRehypeOptions }
  const rehypeHardenOptions = { ...DEFAULT_REHYPE_HARDEN_OPTIONS, ...options?.remarkHardenOptions }

  // allowDangerousHtml preserves raw HTML nodes in MDAST so rehype-raw can parse them
  processor = processor.use(remarkRehype, remarkRehypeOptions) as AnyProcessor

  processor = processor.use(harden, rehypeHardenOptions) as AnyProcessor

  // rehype-raw converts raw HTML nodes into real HAST elements
  processor = processor.use(rehypeRaw) as AnyProcessor

  // remove blank inter-element text nodes (mainly newlines from remark-rehype), opt-out with removeBlankTextNodes: false
  if (options?.removeBlankTextNodes !== false) {
    processor = processor.use(stripBlankTextNodesPlugin) as AnyProcessor
  }

  processor = applyPlugins(processor, rehypePlugins)

  // rehype-sanitize: enabled by default (last step so nothing can bypass it), opt-out with sanitize: false
  if (options?.sanitize !== false) {
    const sanitizeSchema =
      typeof options?.sanitize === 'object' ? options.sanitize : PACKAGE_DEFAULT_SANITIZE_SCHEMA
    processor = processor.use(rehypeSanitize, sanitizeSchema) as AnyProcessor
  }

  return {
    processor,
    preprocess: (markdown) => preprocessors.reduce((acc, fn) => fn(acc), markdown),
  }
}
