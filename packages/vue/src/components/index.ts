import { defineAsyncComponent } from 'vue'

const heading = defineAsyncComponent(() => import('./elements/Heading.vue'))

export const DEFAULT_COMPONENTS = {
  p: defineAsyncComponent(() => import('./elements/Paragraph.vue')),
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
  strong: defineAsyncComponent(() => import('./elements/Bold.vue')),
  hr: defineAsyncComponent(() => import('./elements/HorizontalRule.vue')),
  em: defineAsyncComponent(() => import('./elements/Italic.vue')),
  del: defineAsyncComponent(() => import('./elements/Strikethrough.vue')),
  blockquote: defineAsyncComponent(() => import('./elements/Blockquote.vue')),
  ul: defineAsyncComponent(() => import('./elements/UnorderedList.vue')),
  ol: defineAsyncComponent(() => import('./elements/OrderedList.vue')),
  li: defineAsyncComponent(() => import('./elements/ListItem.vue')),
  code: defineAsyncComponent(() => import('./elements/Code.vue')),
  a: defineAsyncComponent(() => import('./elements/Link.vue')),
  input: defineAsyncComponent(() => import('./elements/TaskListInput.vue')),
  pre: defineAsyncComponent(() => import('./elements/CodeBlock.vue')),
  table: defineAsyncComponent(() => import('./elements/Table.vue')),
  thead: defineAsyncComponent(() => import('./elements/TableHead.vue')),
  tbody: defineAsyncComponent(() => import('./elements/TableBody.vue')),
  tr: defineAsyncComponent(() => import('./elements/TableRow.vue')),
  th: defineAsyncComponent(() => import('./elements/TableHeader.vue')),
  td: defineAsyncComponent(() => import('./elements/TableData.vue')),
  text: defineAsyncComponent(() => import('./elements/Text.vue')),
  default: defineAsyncComponent(() => import('./elements/Default.vue')),
}
