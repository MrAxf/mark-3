import { defineAsyncComponent } from 'vue'

const heading = defineAsyncComponent(() => import('@/components/elements/Heading.vue'))

export const DEFAULT_COMPONENTS = {
  p: defineAsyncComponent(() => import('@/components/elements/Paragraph.vue')),
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
  strong: defineAsyncComponent(() => import('@/components/elements/Bold.vue')),
  hr: defineAsyncComponent(() => import('@/components/elements/HorizontalRule.vue')),
  em: defineAsyncComponent(() => import('@/components/elements/Italic.vue')),
  del: defineAsyncComponent(() => import('@/components/elements/Strikethrough.vue')),
  blockquote: defineAsyncComponent(() => import('@/components/elements/Blockquote.vue')),
  ul: defineAsyncComponent(() => import('@/components/elements/UnorderedList.vue')),
  ol: defineAsyncComponent(() => import('@/components/elements/OrderedList.vue')),
  li: defineAsyncComponent(() => import('@/components/elements/ListItem.vue')),
  code: defineAsyncComponent(() => import('@/components/elements/Code.vue')),
  a: defineAsyncComponent(() => import('@/components/elements/Link.vue')),
  input: defineAsyncComponent(() => import('@/components/elements/TaskListInput.vue')),
  pre: defineAsyncComponent(() => import('@/components/elements/CodeBlock.vue')),
  table: defineAsyncComponent(() => import('@/components/elements/Table.vue')),
  thead: defineAsyncComponent(() => import('@/components/elements/TableHead.vue')),
  tbody: defineAsyncComponent(() => import('@/components/elements/TableBody.vue')),
  tr: defineAsyncComponent(() => import('@/components/elements/TableRow.vue')),
  th: defineAsyncComponent(() => import('@/components/elements/TableHeader.vue')),
  td: defineAsyncComponent(() => import('@/components/elements/TableData.vue')),
  text: defineAsyncComponent(() => import('@/components/elements/Text.vue')),
  default: defineAsyncComponent(() => import('@/components/elements/Default.vue')),
}
