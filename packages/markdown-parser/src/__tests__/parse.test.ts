import type { Element, Root } from 'hast';
import { describe, expect, it } from 'vitest';
import { parse } from '../index.ts';

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
        if (child.type === 'element' || child.type === 'root') {
          queue.push(child as Element);
        }
      }
    }
  }
  return undefined;
}

function allNodes(root: Root, tagName: string): Element[] {
  const result: Element[] = [];
  const queue: (Root | Element)[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.type === 'element' && (node as Element).tagName === tagName) {
      result.push(node as Element);
    }
    if ('children' in node) {
      for (const child of node.children) {
        if (child.type === 'element' || child.type === 'root') {
          queue.push(child as Element);
        }
      }
    }
  }
  return result;
}

// ─── Basic output ────────────────────────────────────────────────────────────

describe('basic output', () => {
  it('returns a HAST Root node', () => {
    const result = parse('# Hello');
    expect(result.type).toBe('root');
  });

  it('parses heading', () => {
    const result = parse('# Hello');
    const h1 = findNode(result, 'h1');
    expect(h1).toBeDefined();
  });

  it('parses bold', () => {
    const result = parse('**bold**');
    const strong = findNode(result, 'strong');
    expect(strong).toBeDefined();
  });

  it('returns empty root for empty string', () => {
    const result = parse('');
    expect(result.type).toBe('root');
    expect(result.children.length).toBe(0);
  });
});

// ─── Remend: incomplete markdown completion ──────────────────────────────────

describe('remend: incomplete markdown completion', () => {
  it('completes incomplete bold', () => {
    const result = parse('**incomplete');
    const strong = findNode(result, 'strong');
    expect(strong).toBeDefined();
  });

  it('completes incomplete inline code', () => {
    const result = parse('`code');
    const code = findNode(result, 'code');
    expect(code).toBeDefined();
  });

  it('completes incomplete strikethrough', () => {
    const result = parse('~~strike');
    const del = findNode(result, 'del');
    expect(del).toBeDefined();
  });

  it('with remend:false does not complete incomplete bold', () => {
    const withCompletion = parse('**incomplete');
    const withoutCompletion = parse('**incomplete', { remend: false });

    const strongWith = findNode(withCompletion, 'strong');
    const strongWithout = findNode(withoutCompletion, 'strong');

    expect(strongWith).toBeDefined();
    expect(strongWithout).toBeUndefined();
  });

  it('accepts remend options to disable specific completions', () => {
    // bold completion disabled — should not produce <strong>
    const result = parse('**incomplete', { remend: { bold: false } });
    const strong = findNode(result, 'strong');
    expect(strong).toBeUndefined();
  });
});

// ─── GFM ─────────────────────────────────────────────────────────────────────

describe('GFM extensions', () => {
  it('parses GFM table', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const result = parse(md);
    const table = findNode(result, 'table');
    expect(table).toBeDefined();
  });

  it('parses GFM task list', () => {
    const result = parse('- [ ] unchecked\n- [x] checked');
    const inputs = allNodes(result, 'input');
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0]?.properties?.type).toBe('checkbox');
  });

  it('parses GFM strikethrough', () => {
    const result = parse('~~strike~~');
    const del = findNode(result, 'del');
    expect(del).toBeDefined();
  });

  it('with gfm:false does not parse table', () => {
    const md = '| a | b |\n|---|---|\n| c | d |';
    const result = parse(md, { gfm: false });
    const table = findNode(result, 'table');
    expect(table).toBeUndefined();
  });
});

// ─── Sanitization (XSS prevention) ───────────────────────────────────────────

describe('sanitization', () => {
  it('removes script tags by default', () => {
    const result = parse('<script>alert("xss")</script>');
    const script = findNode(result, 'script');
    expect(script).toBeUndefined();
  });

  it('keeps safe inline HTML tags', () => {
    const result = parse('<b>safe</b>');
    const b = findNode(result, 'b');
    expect(b).toBeDefined();
  });

  it('removes dangerous attributes like onerror', () => {
    const result = parse('<img src="x" onerror="alert(1)" />');
    const img = findNode(result, 'img');
    // img may be present but onerror must be stripped
    if (img) {
      expect(img.properties?.onError).toBeUndefined();
      expect(img.properties?.onerror).toBeUndefined();
    }
  });

  it('with sanitize:false keeps script tags', () => {
    const result = parse('<script>alert("xss")</script>', { sanitize: false });
    const script = findNode(result, 'script');
    expect(script).toBeDefined();
  });

  it('accepts a custom sanitize schema', () => {
    // Allow <mark> tag which is not in default schema
    const result = parse('<mark>highlighted</mark>', {
      sanitize: {
        tagNames: ['mark', 'p'],
        attributes: {},
      },
    });
    const mark = findNode(result, 'mark');
    expect(mark).toBeDefined();
  });
});
