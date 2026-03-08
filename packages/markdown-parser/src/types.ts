import type { Options as SanitizeSchema } from 'rehype-sanitize';
import type { Root } from 'hast';
import type { RemendOptions } from 'remend';

export type { Root, RemendOptions };
export type { SanitizeSchema };

export interface ParseOptions {
  /**
   * Enable GitHub Flavored Markdown (tables, task lists, strikethrough).
   * @default true
   */
  gfm?: boolean;
  /**
   * Pass `false` to disable remend completion of incomplete markdown.
   * Pass a `RemendOptions` object to configure which completions are active.
   * @default true
   */
  remend?: boolean | RemendOptions;
  /**
   * Pass `false` to disable sanitization (unsafe — only use for trusted input).
   * Pass a custom `SanitizeSchema` to override the default GitHub-like allowlist.
   * @default defaultSchema (GitHub-like, from rehype-sanitize)
   */
  sanitize?: false | SanitizeSchema;
}
