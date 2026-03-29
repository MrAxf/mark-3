import type { Element, Root, RootContent } from 'hast'
import type { Plugin } from 'unified'

const PRESERVE_WHITESPACE_TAGS = new Set(['pre', 'script', 'style', 'textarea'])

function stripBlankTextNodes(node: Root | Element, keepWhitespace: boolean): void {
  const shouldPreserveChildren =
    keepWhitespace || (node.type === 'element' && PRESERVE_WHITESPACE_TAGS.has(node.tagName))

  const children = node.children as RootContent[]
  const nextChildren: RootContent[] = []

  for (const child of children) {
    if (
      !shouldPreserveChildren &&
      child.type === 'text' &&
      typeof child.value === 'string' &&
      child.value.trim() === ''
    ) {
      continue
    }

    if (child.type === 'element') {
      stripBlankTextNodes(child, shouldPreserveChildren)
    }

    nextChildren.push(child)
  }

  node.children = nextChildren as any
}

export const stripBlankTextNodesPlugin: Plugin<[], Root> = () => {
  return (tree: Root) => {
    stripBlankTextNodes(tree, false)
  }
}
