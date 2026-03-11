import type { Root } from 'hast'
import type { Root as MdastRoot } from 'mdast'

import type { MarkdownProcessor, ParseMemory } from './types.ts'

function createEmptyRoot(): Root {
  return {
    type: 'root',
    children: [],
  }
}

export function createMemory(): ParseMemory {
  return {}
}

function combineRoots(confirmedRoot: Root, pendingRoot: Root): Root {
  if (confirmedRoot.children.length === 0) {
    return pendingRoot
  }

  if (pendingRoot.children.length === 0) {
    return confirmedRoot
  }

  return {
    type: 'root',
    children: [...confirmedRoot.children, ...pendingRoot.children],
  }
}

function resetMemory(memory: ParseMemory): void {
  delete memory.previousMarkdown
  delete memory.confirmedMarkdown
  delete memory.pendingMarkdown
  delete memory.previousConfirmedRoot
  memory.flush = false
}

function splitStreamingMarkdown(
  processor: MarkdownProcessor,
  markdown: string,
  flush: boolean,
): {
  confirmedFragment: string
  pendingFragment: string
} {
  if (flush || markdown.length === 0) {
    return {
      confirmedFragment: markdown,
      pendingFragment: '',
    }
  }

  const tree = processor.processor.parse(markdown) as MdastRoot
  const children = Array.isArray(tree.children) ? tree.children : []

  if (children.length <= 1) {
    return {
      confirmedFragment: '',
      pendingFragment: markdown,
    }
  }

  const lastNode = children[children.length - 1]
  const splitOffset = lastNode.position?.start.offset

  if (typeof splitOffset !== 'number' || splitOffset <= 0 || splitOffset > markdown.length) {
    return {
      confirmedFragment: '',
      pendingFragment: markdown,
    }
  }

  const rawConfirmedFragment = markdown.slice(0, splitOffset)
  const trailingWhitespace = rawConfirmedFragment.match(/\s+$/)?.[0] ?? ''

  return {
    confirmedFragment:
      trailingWhitespace.length > 0
        ? rawConfirmedFragment.slice(0, rawConfirmedFragment.length - trailingWhitespace.length)
        : rawConfirmedFragment,
    pendingFragment: `${trailingWhitespace}${markdown.slice(splitOffset)}`,
  }
}

function runParse(processor: MarkdownProcessor, markdown: string): Root {
  if (markdown.length === 0) {
    return createEmptyRoot()
  }

  let input = markdown

  input = processor.preprocess(input)

  let root = processor.processor.runSync(processor.processor.parse(input), input) as Root

  root = processor.postprocess(root)

  return root
}

export function parse(processor: MarkdownProcessor, markdown: string, memory?: ParseMemory): Root {
  if (!memory) {
    return runParse(processor, markdown)
  }

  const previousMarkdown = memory.previousMarkdown ?? ''
  const flush = memory.flush === true

  if (previousMarkdown.length > 0 && !markdown.startsWith(previousMarkdown)) {
    resetMemory(memory)
  }

  const confirmedMarkdown = memory.confirmedMarkdown ?? ''
  const { confirmedFragment, pendingFragment } = splitStreamingMarkdown(processor, markdown, flush)

  const confirmedRoot =
    memory.previousConfirmedRoot && confirmedFragment === confirmedMarkdown
      ? memory.previousConfirmedRoot
      : runParse(processor, confirmedFragment)
  const pendingRoot = runParse(processor, pendingFragment)
  const root = combineRoots(confirmedRoot, pendingRoot)

  memory.previousMarkdown = markdown
  memory.confirmedMarkdown = confirmedFragment
  memory.pendingMarkdown = pendingFragment
  memory.previousConfirmedRoot = confirmedRoot
  memory.flush = false

  return root
}
