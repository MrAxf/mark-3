import { h } from 'vue';
import type { Element, Root, Text } from 'hast';
import { describe, expect, it } from 'vitest';
import { hastToVNodes } from '../hast-to-vnodes.ts';

// ─── helpers ──────────────────────────────────────────────────────────────────

function textNode(value: string): Text {
  return { type: 'text', value };
}

function elem(
  tagName: string,
  properties: Element['properties'] = {},
  children: Element['children'] = [],
): Element {
  return { type: 'element', tagName, properties, children };
}

function root(children: Root['children']): Root {
  return { type: 'root', children };
}

// ─── text nodes ───────────────────────────────────────────────────────────────

describe('text nodes', () => {
  it('converts a text node to a plain string', () => {
    const vnodes = hastToVNodes(textNode('hello'), {});
    expect(vnodes).toEqual(['hello']);
  });

  it('returns empty array for empty text', () => {
    const vnodes = hastToVNodes(textNode(''), {});
    expect(vnodes).toEqual(['']);
  });
});

// ─── element nodes ────────────────────────────────────────────────────────────

describe('element nodes', () => {
  it('converts a div element to a vnode with matching tag', () => {
    const vnode = hastToVNodes(elem('div'), {})[0];
    expect(vnode).toBeTruthy();
    // @ts-expect-error - accessing internal vnode type
    expect(vnode?.type).toBe('div');
  });

  it('converts className array to class string', () => {
    const vnode = hastToVNodes(elem('span', { className: ['foo', 'bar'] }), {})[0];
    // @ts-expect-error - accessing vnode props
    expect(vnode?.props?.class).toBe('foo bar');
  });

  it('converts htmlFor to for prop', () => {
    const vnode = hastToVNodes(elem('label', { htmlFor: 'my-input' }), {})[0];
    // @ts-expect-error - accessing vnode props
    expect(vnode?.props?.for).toBe('my-input');
  });

  it('passes boolean properties through', () => {
    const vnode = hastToVNodes(elem('input', { checked: true }), {})[0];
    // @ts-expect-error - accessing vnode props
    expect(vnode?.props?.checked).toBe(true);
  });

  it('passes string attributes through', () => {
    const vnode = hastToVNodes(elem('a', { href: 'https://example.com' }), {})[0];
    // @ts-expect-error - accessing vnode props
    expect(vnode?.props?.href).toBe('https://example.com');
  });
});

// ─── nesting ──────────────────────────────────────────────────────────────────

describe('nested elements', () => {
  it('converts nested elements recursively', () => {
    const node = elem('p', {}, [textNode('hello'), elem('strong', {}, [textNode('world')])]);
    const vnodes = hastToVNodes(node, {});
    expect(vnodes).toHaveLength(1);
    const p = vnodes[0];
    // @ts-expect-error - accessing vnode
    expect(p?.type).toBe('p');
    // @ts-expect-error - accessing children
    const children = p?.children ?? [];
    expect(children).toHaveLength(2);
  });
});

// ─── root node ────────────────────────────────────────────────────────────────

describe('root node', () => {
  it('converts root node to array of vnodes', () => {
    const node = root([elem('p', {}, [textNode('a')]), elem('p', {}, [textNode('b')])]);
    const vnodes = hastToVNodes(node, {});
    expect(vnodes).toHaveLength(2);
  });

  it('returns empty array for empty root', () => {
    const vnodes = hastToVNodes(root([]), {});
    expect(vnodes).toEqual([]);
  });
});

// ─── custom components ────────────────────────────────────────────────────────

describe('custom components', () => {
  it('uses a custom component for a matching tag', () => {
    const MyH1 = { name: 'MyH1', render() { return h('h1', 'custom'); } };
    const vnode = hastToVNodes(elem('h1', {}, [textNode('hello')]), { h1: MyH1 })[0];
    // @ts-expect-error - accessing vnode
    expect(vnode?.type).toBe(MyH1);
  });

  it('uses the default tag when no custom component matches', () => {
    const vnode = hastToVNodes(elem('p', {}, [textNode('text')]), { h1: { render() { return h('h1'); } } })[0];
    // @ts-expect-error - accessing vnode
    expect(vnode?.type).toBe('p');
  });

  it('uses a function resolver to pick a component', () => {
    const MyEm = { name: 'MyEm', render() { return h('em', 'custom'); } };
    const resolver = (node: Element) => node.tagName === 'em' ? MyEm : undefined;
    const vnode = hastToVNodes(elem('em', {}, [textNode('hi')]), resolver)[0];
    // @ts-expect-error - accessing vnode
    expect(vnode?.type).toBe(MyEm);
  });

  it('function resolver returning undefined falls back to the default tag', () => {
    const vnode = hastToVNodes(elem('p', {}, [textNode('text')]), () => undefined)[0];
    // @ts-expect-error - accessing vnode
    expect(vnode?.type).toBe('p');
  });

  it('function resolver receives the full node for inspection', () => {
    const received: Element[] = [];
    const node = elem('span', { className: ['highlight'] }, [textNode('x')]);
    hastToVNodes(node, (n) => { received.push(n); return undefined; });
    expect(received[0]).toBe(node);
  });
});
