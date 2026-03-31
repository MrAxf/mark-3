# @mark-sorcery/react

React renderer for Mark Sorcery markdown.

## Install

```bash
bun add @mark-sorcery/react @mark-sorcery/markdown-parser react react-dom
```

## Basic usage

```tsx
import { Markdown } from '@mark-sorcery/react'

export function App() {
  return <Markdown markdown={'# Hello Mark Sorcery'} />
}
```
