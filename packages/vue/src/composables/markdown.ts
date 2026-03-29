import { computed, inject, provide, type ComputedRef } from 'vue'

import type { MarkdownProps } from '../types'

import { DEFAULT_COMPONENTS } from '../components'

const MARKDOWN_KEY = '__MARK_SORCERY_'

export type MarkdownContext = {
  components: ComputedRef<NonNullable<MarkdownProps['components']>>
  transition: ComputedRef<MarkdownProps['transition']>
}

const useProvideMarkdown = (
  userComponents: ComputedRef<MarkdownProps['components']>,
  transition: ComputedRef<MarkdownProps['transition']>,
): MarkdownContext => {
  const components = computed<NonNullable<MarkdownProps['components']>>(() => ({
    ...DEFAULT_COMPONENTS,
    ...userComponents.value,
  }))

  provide(MARKDOWN_KEY, {
    components,
    transition,
  })

  return {
    components,
    transition,
  }
}

const useMarkdown = (): MarkdownContext => {
  const context = inject<MarkdownContext>(MARKDOWN_KEY)

  if (!context) {
    throw new Error('useMarkdown must be used within a Markdown component')
  }

  return context
}

export { useProvideMarkdown, useMarkdown }
