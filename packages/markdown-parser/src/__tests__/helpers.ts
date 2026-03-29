import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'

import type { ParseOptions } from '@/index.ts'

import { createProcessor, parse } from '@/index.ts'

export function parseMarkdown(markdown: string, options?: ParseOptions): Root {
  return parse(createProcessor(options), markdown)
}

export function findNode(root: Root, tagName: string): Element | undefined {
  const queue: (Root | Element)[] = [root]
  while (queue.length > 0) {
    const node = queue.shift()!
    if (node.type === 'element' && (node as Element).tagName === tagName) {
      return node as Element
    }
    if ('children' in node) {
      for (const child of node.children) {
        if (child.type === 'element') {
          queue.push(child as Element)
        }
      }
    }
  }
  return undefined
}

export function findNodes(root: Root, tagName: string): Element[] {
  const matches: Element[] = []
  const queue: (Root | Element)[] = [root]

  while (queue.length > 0) {
    const node = queue.shift()!

    if (node.type === 'element' && (node as Element).tagName === tagName) {
      matches.push(node as Element)
    }

    if ('children' in node) {
      for (const child of node.children) {
        if (child.type === 'element') {
          queue.push(child as Element)
        }
      }
    }
  }

  return matches
}

export function textContent(node: Root | Element): string {
  const fragments: string[] = []
  const queue: (Root | Element)[] = [node]

  while (queue.length > 0) {
    const current = queue.shift()!

    if ('value' in current && typeof current.value === 'string') {
      fragments.push(current.value)
    }

    if ('children' in current) {
      for (const child of current.children) {
        if (child.type === 'element') {
          queue.push(child as Element)
          continue
        }

        if ('value' in child && typeof child.value === 'string') {
          fragments.push(child.value)
        }
      }
    }
  }

  return fragments.join('')
}

export const promoteHeadingPlugin: Plugin<[], Root> = function promoteHeadingPlugin() {
  return (tree: any) => {
    for (const child of tree.children ?? []) {
      if (child.type === 'heading') {
        child.depth = 2
      }
    }
  }
}

export const promoteElementPlugin: Plugin<[], Root> = function promoteElementPlugin() {
  return (tree: any) => {
    for (const child of tree.children ?? []) {
      if (child.type === 'element' && child.tagName === 'h2') {
        child.tagName = 'h3'
      }
    }
  }
}
