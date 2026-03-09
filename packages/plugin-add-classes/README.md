# @mark-sorcery/plugin-add-classes

Plugin para [@mark-sorcery/markdown-parser](../markdown-parser/README.md) que añade clases CSS a nodos HAST mediante un rehype plugin.

## Instalación

```bash
bun install
```

## Uso

El paquete expone dos entradas:

- `createAddClassesPlugin(options)`: devuelve un `ParserPlugin` listo para pasar a `createProcessor(...)`.
- `rehypeAddClasses(options)`: rehype plugin reutilizable si quieres integrarlo manualmente.

```ts
import { createProcessor, parse } from "@mark-sorcery/markdown-parser";
import { createAddClassesPlugin } from "@mark-sorcery/plugin-add-classes";

const processor = createProcessor({
  plugins: [
    createAddClassesPlugin({
      elements: {
        h1: "heading heading-xl",
        h2: "heading heading-lg",
        p: ["copy", "copy-body"],
        a: "link",
        code: "code-inline",
        pre: "code-block",
      },
    }),
  ],
});

const root = parse(processor, "# Hello\n\nParagraph");
```

## API

### `createAddClassesPlugin(options?)`

Devuelve un `ParserPlugin` que registra `rehypeAddClasses` en la fase `rehype` del parser.

### `rehypeAddClasses(options?)`

Recorre el árbol HAST y añade clases a cada nodo `element` cuyo `tagName` exista en `options.elements`.

### `AddClassesOptions`

```ts
interface AddClassesOptions {
  elements?: Record<string, string | string[] | undefined>;
}
```

- Puedes pasar una cadena separada por espacios o un array de clases.
- Si el nodo ya tiene `className`, las clases nuevas se fusionan sin duplicados.
- Los tags no configurados se dejan intactos.

## Scripts

```bash
bun run test
bun run build
```
