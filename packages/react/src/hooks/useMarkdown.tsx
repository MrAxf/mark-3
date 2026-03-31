import { createContext, useContext, type PropsWithChildren } from 'react'

import { DEFAULT_COMPONENTS } from '../components/index.ts'
import type { MarkdownProps } from '../types.ts'

export type MarkdownContextValue = {
  components: NonNullable<MarkdownProps['components']>
  transition: MarkdownProps['transition']
}

const MARKDOWN_CONTEXT = createContext<MarkdownContextValue | null>(null)

export function MarkdownProvider({
  children,
  components,
  transition,
}: PropsWithChildren<{ components: MarkdownProps['components']; transition: MarkdownProps['transition'] }>) {
  return (
    <MARKDOWN_CONTEXT.Provider
      value={{
        components: {
          ...DEFAULT_COMPONENTS,
          ...components,
        },
        transition,
      }}
    >
      {children}
    </MARKDOWN_CONTEXT.Provider>
  )
}

export function useMarkdown() {
  const context = useContext(MARKDOWN_CONTEXT)

  if (!context) {
    throw new Error('useMarkdown must be used within a Markdown component')
  }

  return context
}
