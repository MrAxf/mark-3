import { createElement } from 'react'

import type { ElementProps } from '../../types.ts'

import NodeList from '../NodeList.tsx'
import { useMarkdown } from '../../hooks/useMarkdown.tsx'
import { elementPropertiesToProps } from '../../utils/elementPropertiesToProps.ts'

const VOID_TAGS = new Set(['hr', 'input'])

const markers: Record<string, string> = {
  p: 'paragraph',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  strong: 'bold',
  hr: 'horizontal-rule',
  em: 'italic',
  del: 'strikethrough',
  blockquote: 'blockquote',
  ul: 'unordered-list',
  ol: 'ordered-list',
  li: 'list-item',
  code: 'code',
  a: 'link',
  input: 'task-list-input',
  pre: 'code-block',
  table: 'table',
  thead: 'table-head',
  tbody: 'table-body',
  tr: 'table-row',
  th: 'table-header',
  td: 'table-data',
}

export default function GenericElement({ element, nodeIdx, deep, nodeKey }: ElementProps) {
  const { components, transition } = useMarkdown()
  const tagName = element.tagName || 'span'
  const props = {
    ...elementPropertiesToProps(element.properties),
    'data-mark-sorcery': markers[tagName] ?? 'element',
  }

  if (tagName[0] === 'h' && /^h[1-6]$/.test(tagName)) {
    ; (props as Record<string, unknown>)['data-heading-level'] = Number.parseInt(tagName.slice(1), 10)
  }

  if (VOID_TAGS.has(tagName)) {
    return createElement(tagName, props)
  }

  return createElement(
    tagName,
    props,
    <NodeList
      nodes={element.children}
      nodeIdx={nodeIdx}
      deep={deep}
      nodeKey={nodeKey}
      parentNode={element}
      components={components}
      transition={transition}
    />,
  )
}
