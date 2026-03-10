import type { Element, Root } from 'hast';
import type { ParseMemory, ParseOptions } from '../index.ts';
import type { Plugin } from 'unified';
import { describe, expect, it } from 'vitest';
import { createCorePlugin, createMemory, createProcessor, parse } from '../index.ts';

function parseMarkdown(markdown: string, options?: ParseOptions): Root {
  return parse(createProcessor(options), markdown);
}

// Helpers
function findNode(root: Root, tagName: string): Element | undefined {
  const queue: (Root | Element)[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.type === 'element' && (node as Element).tagName === tagName) {
      return node as Element;
    }
    if ('children' in node) {
      for (const child of node.children) {
        if (child.type === 'element') {
          queue.push(child as Element);
        }
      }
    }
  }
  return undefined;
}

function findNodes(root: Root, tagName: string): Element[] {
  const matches: Element[] = [];
  const queue: (Root | Element)[] = [root];

  while (queue.length > 0) {
    const node = queue.shift()!;

    if (node.type === 'element' && (node as Element).tagName === tagName) {
      matches.push(node as Element);
    }

    if ('children' in node) {
      for (const child of node.children) {
        if (child.type === 'element') {
          queue.push(child as Element);
        }
      }
    }
  }

  return matches;
}

function textContent(node: Root | Element): string {
  const fragments: string[] = [];
  const queue: (Root | Element)[] = [node];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if ('value' in current && typeof current.value === 'string') {
      fragments.push(current.value);
    }

    if ('children' in current) {
      for (const child of current.children) {
        if (child.type === 'element') {
          queue.push(child as Element);
          continue;
        }

        if ('value' in child && typeof child.value === 'string') {
          fragments.push(child.value);
        }
      }
    }
  }

  return fragments.join('');
}

const promoteHeadingPlugin: Plugin<[], Root> = function promoteHeadingPlugin() {
  return (tree: any) => {
    for (const child of tree.children ?? []) {
      if (child.type === 'heading') {
        child.depth = 2;
      }
    }
  };
};

const promoteElementPlugin: Plugin<[], Root> = function promoteElementPlugin() {
  return (tree: any) => {
    for (const child of tree.children ?? []) {
      if (child.type === 'element' && child.tagName === 'h2') {
        child.tagName = 'h3';
      }
    }
  };
};

// ─── Basic output ────────────────────────────────────────────────────────────

describe('basic output', () => {
  it('returns a HAST Root node', () => {
    const result = parseMarkdown('# Hello');
    expect(result.type).toBe('root');
  });

  it('parses heading', () => {
    const result = parseMarkdown('# Hello');
    const h1 = findNode(result, 'h1');
    expect(h1).toBeDefined();
  });

  it('parses bold', () => {
    const result = parseMarkdown('**bold**');
    const strong = findNode(result, 'strong');
    expect(strong).toBeDefined();
  });

  it('returns empty root for empty string', () => {
    const result = parseMarkdown('');
    expect(result.type).toBe('root');
    expect(result.children.length).toBe(0);
  });
});

// ─── rehype-harden ─────────────────────────────────────────────────────────

describe('rehype-harden', () => {
  it('bloquea enlaces con protocolos peligrosos por defecto', () => {
    const result = parseMarkdown('[malicioso](javascript:alert(1))');

    expect(findNode(result, 'a')).toBeUndefined();

    const blockedIndicator = findNodes(result, 'span').find(
      (node) => textContent(node).includes('[blocked]'),
    );

    expect(blockedIndicator).toBeDefined();
    expect(textContent(blockedIndicator!)).toContain('malicioso');
  });

  it('añade atributos de seguridad a enlaces permitidos', () => {
    const result = parseMarkdown('[seguro](https://example.com/docs)');
    const link = findNode(result, 'a');

    expect(link).toBeDefined();
    expect(link?.properties.href).toBe('https://example.com/docs');
    expect(link?.properties.target).toBe('_blank');
    expect(link?.properties.rel).toEqual(['noopener', 'noreferrer']);
  });

  it('permite protocolos personalizados cuando se configuran', () => {
    const blocked = parseMarkdown('[abrir](vscode://file/c:/temp/demo.ts)', {
      remarkHardenOptions: {
        allowedProtocols: [],
      },
    });
    const allowed = parseMarkdown('[abrir](vscode://file/c:/temp/demo.ts)', {
      remarkHardenOptions: {
        allowedProtocols: ['vscode:'],
      },
    });

    expect(findNode(blocked, 'a')).toBeUndefined();
    expect(findNode(allowed, 'a')?.properties.href).toBe('vscode://file/c:/temp/demo.ts');
  });

  it('respeta allowedLinkPrefixes para URLs relativas con defaultOrigin', () => {
    const allowed = parseMarkdown('[docs](/docs/intro)', {
      remarkHardenOptions: {
        defaultOrigin: 'https://mark.test',
        allowedLinkPrefixes: ['https://mark.test/docs/'],
      },
    });
    const blocked = parseMarkdown('[fuera](/blog/post)', {
      remarkHardenOptions: {
        defaultOrigin: 'https://mark.test',
        allowedLinkPrefixes: ['https://mark.test/docs/'],
      },
    });

    expect(findNode(allowed, 'a')?.properties.href).toBe('/docs/intro');
    expect(findNode(blocked, 'a')).toBeUndefined();
  });

  it('permite imágenes data por defecto y deja desactivarlas', () => {
    const enabled = parseMarkdown('![inline](data:image/png;base64,abcd)');
    const disabled = parseMarkdown('![inline](data:image/png;base64,abcd)', {
      remarkHardenOptions: {
        allowDataImages: false,
      },
    });

    expect(findNode(enabled, 'img')?.properties.src).toBe('data:image/png;base64,abcd');
    expect(findNode(disabled, 'img')).toBeUndefined();
    expect(textContent(disabled)).toContain('[Image blocked: inline]');
  });
});

// ─── Plugin system ───────────────────────────────────────────────────────────

describe('plugin system', () => {
  it('runs preprocessors, remark plugins, rehype plugins and postprocessors in order', () => {
    const trace: string[] = [];

    const result = parseMarkdown('hello', {
      plugins: [
        {
          preprocess: [
            (markdown) => {
              trace.push('preprocess:1');
              return `# ${markdown}`;
            },
            (markdown) => {
              trace.push('preprocess:2');
              return markdown.replace('hello', 'world');
            },
          ],
          remark: [
            [() => {
              trace.push('remark:setup');
              return (tree: any) => {
                trace.push('remark:run');
                for (const child of tree.children ?? []) {
                  if (child.type === 'heading') {
                    child.depth = 2;
                  }
                }
              };
            }],
          ],
          rehype: [
            [() => {
              trace.push('rehype:setup');
              return (tree: any) => {
                trace.push('rehype:run');
                for (const child of tree.children ?? []) {
                  if (child.type === 'element' && child.tagName === 'h2') {
                    child.tagName = 'h3';
                  }
                }
              };
            }],
          ],
          postprocess: [
            (root) => {
              trace.push('postprocess:1');
              const heading = findNode(root, 'h3');
              if (heading) {
                heading.tagName = 'h4';
              }
              return root;
            },
            (root) => {
              trace.push('postprocess:2');
              return root;
            },
          ],
        },
      ],
    });

    expect(trace).toEqual([
      'preprocess:1',
      'preprocess:2',
      'remark:setup',
      'rehype:setup',
      'remark:run',
      'rehype:run',
      'postprocess:1',
      'postprocess:2',
    ]);
    expect(findNode(result, 'h1')).toBeUndefined();
    expect(findNode(result, 'h2')).toBeUndefined();
    expect(findNode(result, 'h3')).toBeUndefined();
    expect(findNode(result, 'h4')).toBeDefined();
    expect(textContent(result)).toContain('world');
  });

  it('always keeps the fixed parse pipeline around custom plugins', () => {
    const result = parseMarkdown('Hello <b>world</b>', {
      plugins: [
        {
          remark: [promoteHeadingPlugin],
          rehype: [promoteElementPlugin],
        },
      ],
    });

    const paragraph = findNode(result, 'p');
    const bold = findNode(result, 'b');
    expect(paragraph).toBeDefined();
    expect(bold).toBeDefined();
  });
});

// ─── Core plugin ─────────────────────────────────────────────────────────────

describe('core plugin', () => {
  it('normalizes markdown in preprocess by default', () => {
    const processor = createProcessor({
      plugins: [createCorePlugin()],
    });

    const normalized = processor.preprocess('line 1\r\nline 2\t  \r\n\r\n\r\nline 3\rtrailing   ');

    expect(normalized).toBe('line 1\nline 2\nline 3\ntrailing');
  });

  it('allows disabling the normalizer inside the core plugin', () => {
    const processor = createProcessor({
      plugins: [createCorePlugin({ normalizer: false })],
    });

    const original = 'line 1\r\nline 2\t  \r\n\r\n\r\nline 3\rtrailing   ';

    expect(processor.preprocess(original)).toBe(original);
  });

  it('registers the normalizer before remend inside the core preprocessors', () => {
    const plugin = createCorePlugin();

    expect(Array.isArray(plugin.preprocess)).toBe(true);
    expect(plugin.preprocess).toHaveLength(2);

    const preprocessors = plugin.preprocess as ((markdown: string) => string)[];
    const normalized = preprocessors[0]('line 1\r\n\r\n\r\nline 2\t  ');

    expect(normalized).toBe('line 1\nline 2');
    expect(preprocessors[1]('**incomplete')).toContain('**');
  });

  it('adds remend as a preprocess', () => {
    const result = parseMarkdown('**incomplete', {
      plugins: [createCorePlugin()],
    });
    const strong = findNode(result, 'strong');
    expect(strong).toBeDefined();
  });

  it('accepts remend options', () => {
    const result = parseMarkdown('**incomplete', {
      plugins: [createCorePlugin({ remend: { bold: false } })],
    });
    const strong = findNode(result, 'strong');
    expect(strong).toBeUndefined();
  });

  it('accepts normalizer options', () => {
    const processor = createProcessor({
      plugins: [
        createCorePlugin({
          normalizer: {
            tabWidth: 2,
            trimTrailingWhitespace: false,
            maxConsecutiveBlankLines: 2,
          },
        }),
      ],
    });

    const normalized = processor.preprocess('line\t\r\n\r\n\r\n\r\nnext');

    expect(normalized).toBe('line  \n\n\nnext');
  });

  it('adds remark-gfm with its options', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const enabled = parseMarkdown(md, {
      plugins: [createCorePlugin()],
    });
    const disabled = parseMarkdown(md, {
      plugins: [createCorePlugin({ gfm: false })],
    });

    expect(findNode(enabled, 'table')).toBeDefined();
    expect(findNode(disabled, 'table')).toBeUndefined();
  });

  it('adds rehype-sanitize with its options', () => {
    const result = parseMarkdown('<script>alert("xss")</script>', {
      plugins: [createCorePlugin()],
    });
    const script = findNode(result, 'script');
    expect(script).toBeUndefined();
  });

  it('allows disabling sanitize inside the core plugin', () => {
    const result = parseMarkdown('<script>alert("xss")</script>', {
      plugins: [createCorePlugin({ sanitize: false })],
    });
    const script = findNode(result, 'script');
    expect(script).toBeDefined();
  });

  it('accepts a custom sanitize schema', () => {
    const result = parseMarkdown('<mark>highlighted</mark>', {
      plugins: [
        createCorePlugin({
          sanitize: {
            tagNames: ['mark', 'p'],
            attributes: {},
          },
        }),
      ],
    });
    const mark = findNode(result, 'mark');
    expect(mark).toBeDefined();
  });

  it('can be combined with custom postprocessors while keeping HAST output', () => {
    const result = parseMarkdown('<b>safe</b>', {
      plugins: [
        createCorePlugin(),
        {
          postprocess: (root) => {
            const bold = findNode(root, 'b');
            if (bold) {
              bold.tagName = 'strong';
            }
            return root;
          },
        },
      ],
    });

    expect(result.type).toBe('root');
    expect(findNode(result, 'strong')).toBeDefined();
  });
});

// ─── Streaming memory ───────────────────────────────────────────────────────

describe('streaming memory', () => {
  it('returns the full tree built so far while the stream grows', () => {
    const processor = createProcessor({
      plugins: [createCorePlugin()],
    });
    const memory = createMemory();

    const block1 = parse(processor, '**hola', memory);
    expect(findNode(block1, 'strong')).toBeDefined();
    expect(textContent(block1)).toContain('hola');

    const block2 = parse(processor, '**hola que tal**\nhoy', memory);
    expect(findNode(block2, 'strong')).toBeDefined();
    expect(textContent(block2)).toContain('hola que tal');
    expect(textContent(block2)).toContain('hoy');

    const block3 = parse(processor, '**hola que tal**\nhoy estas muy\nbirn', memory);
    expect(findNode(block3, 'strong')).toBeDefined();
    expect(textContent(block3)).toContain('hoy estas muy');
    expect(textContent(block3)).toContain('birn');

    const block4 = parse(processor, 'buenas', memory);
    expect(findNode(block4, 'strong')).toBeUndefined();
    expect(textContent(block4)).toContain('buenas');
    expect(textContent(block4)).not.toContain('hola que tal');
  });

  it('keeps confirmed blocks cached while remend still applies to the pending block', () => {
    const processor = createProcessor({
      plugins: [createCorePlugin()],
    });
    const memory: ParseMemory = createMemory();

    const first = parse(processor, '# Titulo\n\n**hola', memory);
    expect(findNode(first, 'h1')).toBeDefined();
    expect(findNode(first, 'strong')).toBeDefined();
    expect(memory.confirmedMarkdown).toBe('# Titulo');
    expect(memory.pendingMarkdown).toBe('\n\n**hola');

    const second = parse(processor, '# Titulo\n\n**hola\n\n- item', memory);
    expect(findNode(second, 'h1')).toBeDefined();
    expect(findNode(second, 'strong')).toBeDefined();
    expect(findNode(second, 'ul')).toBeDefined();
    expect(memory.confirmedMarkdown).toBe('# Titulo\n\n**hola');
    expect(memory.pendingMarkdown).toBe('\n\n- item');
  });

  it('supports flush to promote the pending block into the confirmed prefix', () => {
    const processor = createProcessor({
      plugins: [createCorePlugin()],
    });
    const memory = createMemory();

    parse(processor, '**hola', memory);
    expect(memory.pendingMarkdown).toBe('**hola');

    memory.flush = true;
    const flushed = parse(processor, '**hola', memory);

    expect(findNode(flushed, 'strong')).toBeDefined();
    expect(memory.confirmedMarkdown).toBe('**hola');
    expect(memory.pendingMarkdown).toBe('');
  });
});
