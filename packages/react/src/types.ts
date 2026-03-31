import type { ParseOptions, ParserPlugin } from '@mark-sorcery/markdown-parser'
import type { Element, Nodes, Text } from 'hast'
import type { ComponentType } from 'react'

export interface TransitionConfig {
  className?: string
}

export type MarkdownOptions = Omit<ParseOptions, 'plugins'>

export interface NodeProps {
  node: Element
}

export type ItemProps = {
  nodeIdx?: number
  deep?: number
  nodeKey?: string
  parentNode?: Nodes
}

export type ElementProps = ItemProps & {
  element: Element
}

export type TextProps = ItemProps & {
  element: Text
}

export type MarkdownNodeProps = {
  element: Element
  componentKey: string
}

export type MarkdownComponent = ComponentType<any>

export interface MarkdownProps {
  markdown: string
  options?: MarkdownOptions
  plugins?: ParserPlugin[]
  stream?: boolean
  components?: Record<string, MarkdownComponent>
  transition?: boolean | TransitionConfig
}

export type NodeListProps = ItemProps & {
  nodes: Nodes[]
  components: NonNullable<MarkdownProps['components']>
  transition: MarkdownProps['transition']
}
