import type { Root } from 'hast'
import { createMemory, createProcessor, parse } from '@mark-sorcery/markdown-parser'
import { useEffect, useMemo, useRef, useState } from 'react'

import NodeList from './components/NodeList.tsx'
import { MarkdownProvider, useMarkdown } from './hooks/useMarkdown.tsx'
import type { MarkdownProcessor, ParseMemory } from '@mark-sorcery/markdown-parser'
import type { MarkdownProps } from './types.ts'

function createEmptyRoot(): Root {
  return {
    type: 'root',
    children: [],
  }
}

export function Markdown({
  markdown,
  options,
  plugins,
  stream = false,
  components,
  transition = false,
}: MarkdownProps) {
  const [hast, setHast] = useState<Root>(createEmptyRoot)
  const streamMemoryRef = useRef<ParseMemory | undefined>(undefined)
  const activeProcessorRef = useRef<MarkdownProcessor | undefined>(undefined)

  const processor = useMemo<MarkdownProcessor>(() => {
    return createProcessor({
      ...options,
      plugins: [...(plugins ?? [])],
    })
  }, [options, plugins])

  useEffect(() => {
    let isActive = true

    if (activeProcessorRef.current && activeProcessorRef.current !== processor) {
      streamMemoryRef.current = stream ? createMemory() : undefined
    }

    activeProcessorRef.current = processor

    const run = async () => {
      const nextRoot = await (() => {
        if (stream) {
          streamMemoryRef.current ??= createMemory()
          return parse(processor, markdown ?? '', streamMemoryRef.current)
        }

        if (streamMemoryRef.current) {
          streamMemoryRef.current.flush = true
          const flushedMemory = streamMemoryRef.current
          streamMemoryRef.current = undefined
          return parse(processor, markdown ?? '', flushedMemory)
        }

        return parse(processor, markdown ?? '')
      })()

      if (!isActive) {
        return
      }

      setHast(nextRoot)
    }

    void run()

    return () => {
      isActive = false
    }
  }, [processor, markdown, stream])

  return (
    <MarkdownProvider components={components} transition={transition}>
      <MarkdownContent hast={hast} />
    </MarkdownProvider>
  )
}

function MarkdownContent({ hast }: { hast: Root }) {
  return <MarkdownBody nodes={hast.children} parentNode={hast} />
}

function MarkdownBody({ nodes, parentNode }: { nodes: Root['children']; parentNode: Root }) {
  const { components, transition } = useMarkdown()

  return (
    <NodeList
      nodes={nodes}
      nodeKey="root"
      deep={0}
      parentNode={parentNode}
      components={components}
      transition={transition}
    />
  )
}
