import { unified } from 'unified';
import type { Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import type { AnyProcessor, MarkdownProcessor, ParseOptions } from './types.ts';
import type { UnifiedPluginEntry } from './types.ts';
import { getPostprocessors, getPreprocessors, getRehypePlugins, getRemarkPlugins } from './plugins.ts';



const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };

function applyPlugins(processor: AnyProcessor, plugins: UnifiedPluginEntry[]): AnyProcessor {
  let current = processor;

  for (const plugin of plugins) {
    if (Array.isArray(plugin)) {
      const [pluginFactory, ...args] = plugin;
      current = current.use(pluginFactory as any, ...(args as any[])) as Processor;
      continue;
    }

    current = current.use(plugin as any) as Processor;
  }

  return current;
}

/**
 * Create a reusable markdown processor from parser options.
 *
 * The resulting processor keeps the fixed unified pipeline:
 * `remark-parse -> remark plugins -> remark-rehype -> rehype-raw -> rehype plugins`.
 * Text preprocessors run before parsing and HAST postprocessors run after the
 * HAST tree has been produced.
 */
export function createProcessor(options?: ParseOptions): MarkdownProcessor {
  const remarkPlugins = getRemarkPlugins(options);
  const rehypePlugins = getRehypePlugins(options);

  const preprocessors = getPreprocessors(options);
  const postprocessors = getPostprocessors(options);

  let processor = unified().use(remarkParse) as unknown as AnyProcessor;

  processor = applyPlugins(processor, remarkPlugins);

  const remarkRehypeOptions = { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options?.remarkRehypeOptions };

  // allowDangerousHtml preserves raw HTML nodes in MDAST so rehype-raw can parse them
  processor = processor.use(remarkRehype, remarkRehypeOptions) as AnyProcessor;

  // rehype-raw converts raw HTML nodes into real HAST elements
  processor = processor.use(rehypeRaw) as AnyProcessor;

  processor = applyPlugins(processor, rehypePlugins);

  return {
    processor,
    preprocess: (markdown) => preprocessors.reduce((acc, fn) => fn(acc), markdown),
    postprocess: (root) => postprocessors.reduce((acc, fn) => fn(acc), root),
  };
}
