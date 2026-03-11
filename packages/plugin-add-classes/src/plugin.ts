import type { ParserPlugin } from '@mark-sorcery/markdown-parser'
import type { Element, Properties, Root } from 'hast'

import { visit } from 'unist-util-visit'

export type ClassNameValue = string | string[]

export interface AddClassesOptions {
  elements?: Record<string, ClassNameValue | undefined>
}

function normalizeClassNames(value?: ClassNameValue): string[] {
  if (value === undefined) {
    return []
  }

  const values = Array.isArray(value) ? value : [value]

  return values
    .flatMap((entry) => entry.split(/\s+/))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function readClassNames(properties?: Properties): string[] {
  const className = properties?.className

  if (typeof className === 'string') {
    return normalizeClassNames(className)
  }

  if (Array.isArray(className)) {
    return className.flatMap((entry) => normalizeClassNames(String(entry)))
  }

  return []
}

function mergeClassNames(existing: string[], extra: string[]): string[] {
  return [...new Set([...existing, ...extra])]
}

export function rehypeAddClasses(options: AddClassesOptions = {}): (tree: Root) => void {
  const elements = options.elements ?? {}

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const extraClassNames = normalizeClassNames(elements[node.tagName])

      if (extraClassNames.length === 0) {
        return
      }

      node.properties = {
        ...node.properties,
        className: mergeClassNames(readClassNames(node.properties), extraClassNames),
      }
    })
  }
}

export function createAddClassesPlugin(options: AddClassesOptions = {}): ParserPlugin {
  return {
    rehype: [[rehypeAddClasses, options]],
  }
}
