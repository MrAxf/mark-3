import type { Options as SanitizeSchema } from 'rehype-sanitize';
import type { Options as RemarkGfmOptions } from 'remark-gfm';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Root } from 'hast';
import type { RemendOptions } from 'remend';
import { Processor } from 'unified';
import { harden } from 'rehype-harden';

export type { Root, RemendOptions };
export type { RemarkGfmOptions, SanitizeSchema };

export type MarkdownPreprocessor = (markdown: string) => string;
export type HastPostprocessor = (root: Root) => Root;
export type UnifiedPluginFactory = (...args: any[]) => unknown;
export type UnifiedPluginEntry =
  | UnifiedPluginFactory
  | [UnifiedPluginFactory, ...unknown[]];

export interface ParserPlugin {
  preprocess?: MarkdownPreprocessor | MarkdownPreprocessor[];
  remark?: UnifiedPluginEntry[];
  rehype?: UnifiedPluginEntry[];
  postprocess?: HastPostprocessor | HastPostprocessor[];
}

export type RemarkHardenOptions = Parameters<typeof harden>[0]

export interface ParseOptions {
  /**
   * Plugins used when building a processor with `createProcessor(...)`.
   * The fixed pipeline always includes `remark-parse`, `remark-rehype` and `rehype-raw`.
   */
  plugins?: ParserPlugin[];
  /**
   * Extra options forwarded to `remark-rehype`.
   */
  remarkRehypeOptions?: RemarkRehypeOptions;
  /**
   * Extra options for the core plugin's remend completion feature.
   */
  remarkHardenOptions?: RemarkHardenOptions;
}

export interface CorePluginOptions {
  /**
   * Pass `false` to disable remend completion of incomplete markdown.
   * Pass a `RemendOptions` object to configure which completions are active.
   * @default true
   */
  remend?: boolean | RemendOptions;
  /**
   * Pass `false` to disable GitHub Flavored Markdown.
   * Pass a `RemarkGfmOptions` object to configure the plugin.
   * @default true
   */
  gfm?: false | RemarkGfmOptions;
  /**
   * Pass `false` to disable sanitization (unsafe — only use for trusted input).
   * Pass a custom `SanitizeSchema` object to override the default allowlist.
   * @default defaultSchema (from rehype-sanitize)
   */
  sanitize?: false | SanitizeSchema;
}

export type AnyProcessor = Processor<any, any, any, any, any>;

export interface MarkdownProcessor {
  /**
   * Unified processor with the fixed markdown-to-HAST pipeline already configured.
   */
  processor: AnyProcessor;
  /**
   * Applies every configured markdown preprocessor in declaration order.
   */
  preprocess: (markdown: string) => string;
  /**
   * Applies every configured HAST postprocessor in declaration order.
   */
  postprocess: (root: Root) => Root;
}

export interface ParseMemory {
  /**
   * Full accumulated markdown received by the previous streaming call.
   */
  previousMarkdown?: string;
  /**
   * Portion of the markdown that has been promoted to the confirmed prefix.
   */
  confirmedMarkdown?: string;
  /**
   * Last top-level block kept separate while the stream is still growing.
   */
  pendingMarkdown?: string;
  /**
   * Cached HAST root for the confirmed prefix.
   */
  previousConfirmedRoot?: Root;
  /**
   * When true, the next streaming call promotes the pending block to confirmed.
   */
  flush?: boolean;
}
