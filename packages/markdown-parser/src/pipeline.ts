import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { ParseOptions } from './types.ts';

export function createProcessor(options?: ParseOptions) {
  const gfm = options?.gfm !== false;
  const sanitize = options?.sanitize;

  let processor = unified().use(remarkParse);

  if (gfm) {
    processor = processor.use(remarkGfm);
  }

  // allowDangerousHtml preserves raw HTML nodes in MDAST so rehype-raw can parse them
  processor = processor.use(remarkRehype, { allowDangerousHtml: true });

  // rehype-raw converts raw HTML nodes into real HAST elements
  processor = processor.use(rehypeRaw);

  if (sanitize !== false) {
    const schema = sanitize ?? defaultSchema;
    processor = processor.use(rehypeSanitize, schema);
  }

  return processor;
}
