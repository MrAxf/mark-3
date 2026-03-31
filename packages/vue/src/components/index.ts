import type { MarkdownProps } from '../types'

import Default from './elements/Default.vue'
import GenericElement from './elements/GenericElement.vue'
import Text from './elements/Text.vue'

export const DEFAULT_COMPONENTS: NonNullable<MarkdownProps['components']> = {
  p: GenericElement,
  h1: GenericElement,
  h2: GenericElement,
  h3: GenericElement,
  h4: GenericElement,
  h5: GenericElement,
  h6: GenericElement,
  strong: GenericElement,
  hr: GenericElement,
  em: GenericElement,
  del: GenericElement,
  blockquote: GenericElement,
  ul: GenericElement,
  ol: GenericElement,
  li: GenericElement,
  code: GenericElement,
  a: GenericElement,
  input: GenericElement,
  pre: GenericElement,
  table: GenericElement,
  thead: GenericElement,
  tbody: GenericElement,
  tr: GenericElement,
  th: GenericElement,
  td: GenericElement,
  text: Text,
  default: Default,
}
