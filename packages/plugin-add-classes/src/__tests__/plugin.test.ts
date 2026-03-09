import type { Element, Root } from 'hast';
import { describe, expect, it } from 'vitest';
import { createProcessor, parse } from '@mark-sorcery/markdown-parser';
import { createAddClassesPlugin, rehypeAddClasses } from '../index.ts';

function parseMarkdown(markdown: string, plugins = [createAddClassesPlugin()]): Root {
    return parse(createProcessor({ plugins }), markdown);
}

function findElement(root: Root, tagName: string): Element | undefined {
    const queue: Array<Root | Element> = [root];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current) {
            continue;
        }

        if (current.type === 'element' && current.tagName === tagName) {
            return current;
        }

        if ('children' in current) {
            for (const child of current.children) {
                if (child.type === 'element') {
                    queue.push(child);
                }
            }
        }
    }

    return undefined;
}

function getClassNames(node?: Element): string[] {
    if (!node) {
        return [];
    }

    const className = node.properties?.className;

    if (typeof className === 'string') {
        return className.split(/\s+/).filter(Boolean);
    }

    if (Array.isArray(className)) {
        return className.map(String);
    }

    return [];
}

describe('createAddClassesPlugin', () => {
    it('adds classes to configured markdown elements', () => {
        const result = parseMarkdown('# Title\n\nParagraph', [
            createAddClassesPlugin({
                elements: {
                    h1: 'heading heading-xl',
                    p: ['copy', 'copy-body'],
                },
            }),
        ]);

        expect(getClassNames(findElement(result, 'h1'))).toEqual(['heading', 'heading-xl']);
        expect(getClassNames(findElement(result, 'p'))).toEqual(['copy', 'copy-body']);
    });

    it('merges classes with existing className values', () => {
        const result = parseMarkdown('<p class="existing">Hello</p>', [
            createAddClassesPlugin({
                elements: {
                    p: ['existing', 'copy'],
                },
            }),
        ]);

        expect(getClassNames(findElement(result, 'p'))).toEqual(['existing', 'copy']);
    });

    it('does nothing for tags that are not configured', () => {
        const result = parseMarkdown('Paragraph', [
            createAddClassesPlugin({
                elements: {
                    h1: 'heading',
                },
            }),
        ]);

        expect(getClassNames(findElement(result, 'p'))).toEqual([]);
    });
});

describe('rehypeAddClasses', () => {
    it('can be used directly as a rehype plugin entry', () => {
        const result = parse(
            createProcessor({
                plugins: [
                    {
                        rehype: [[rehypeAddClasses, { elements: { strong: 'font-semibold' } }]],
                    },
                ],
            }),
            '**bold**',
        );

        expect(getClassNames(findElement(result, 'strong'))).toEqual(['font-semibold']);
    });
});
