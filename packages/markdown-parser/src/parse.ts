import remendFn from 'remend';
import type { Root } from 'hast';
import type { ParseOptions, RemendOptions } from './types.ts';
import { createProcessor } from './pipeline.ts';

/**
 * Parse a (potentially incomplete) Markdown string and return a HAST Root tree.
 *
 * - Incomplete markdown is healed by `remend` before parsing (configurable).
 * - The output is sanitized by `rehype-sanitize` using a GitHub-like schema (configurable).
 * - GFM extensions (tables, task lists, strikethrough) are enabled by default (configurable).
 *
 * @param markdown - The markdown string to parse. May be partial (streaming).
 * @param options  - Optional configuration for GFM, remend, and sanitization.
 * @returns A HAST `Root` node.
 */
export function parse(markdown: string, options?: ParseOptions): Root {
  const remendOption = options?.remend;
  let input = markdown;

  if (remendOption !== false) {
    const remendOptions: RemendOptions | undefined =
      typeof remendOption === 'object' ? remendOption : undefined;
    input = remendFn(markdown, remendOptions);
  }

  const processor = createProcessor(options);
  const mdast = processor.parse(input);
  return processor.runSync(mdast, input) as Root;
}
