import remendFn from 'remend';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type {
    CorePluginOptions,
    HastPostprocessor,
    MarkdownPreprocessor,
    ParseOptions,
    ParserPlugin,
    RemendOptions,
    UnifiedPluginEntry,
} from './types.ts';

function arrayify<T>(value?: T | T[]): T[] {
    if (value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

export function getPlugins(options?: ParseOptions): ParserPlugin[] {
    return options?.plugins ?? [];
}

export function getPreprocessors(options?: ParseOptions): MarkdownPreprocessor[] {
    return getPlugins(options).flatMap((plugin) => arrayify(plugin.preprocess));
}

export function getPostprocessors(options?: ParseOptions): HastPostprocessor[] {
    return getPlugins(options).flatMap((plugin) => arrayify(plugin.postprocess));
}

export function getRemarkPlugins(options?: ParseOptions): UnifiedPluginEntry[] {
    return getPlugins(options).flatMap((plugin) => plugin.remark ?? []);
}

export function getRehypePlugins(options?: ParseOptions): UnifiedPluginEntry[] {
    return getPlugins(options).flatMap((plugin) => plugin.rehype ?? []);
}

/**
 * Build the package's default plugin preset.
 *
 * The preset can add text completion through `remend`, GitHub Flavored Markdown
 * support through `remark-gfm`, and HTML sanitization through `rehype-sanitize`.
 */
export function createCorePlugin(options: CorePluginOptions = {}): ParserPlugin {
    const plugin: ParserPlugin = {};
    const remendOption = options.remend;
    const gfmOption = options.gfm;
    const sanitizeOption = options.sanitize;

    if (remendOption !== false) {
        plugin.preprocess = (markdown: string) => {
            const remendOptions: RemendOptions | undefined =
                typeof remendOption === 'object' ? remendOption : undefined;
            return remendFn(markdown, remendOptions);
        };
    }

    if (gfmOption !== false) {
        plugin.remark = [
            typeof gfmOption === 'object' ? [remarkGfm, gfmOption] : remarkGfm,
        ];
    }

    if (sanitizeOption !== false) {
        plugin.rehype = [[rehypeSanitize, sanitizeOption ?? defaultSchema]];
    }

    return plugin;
}