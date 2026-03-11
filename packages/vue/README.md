# @mark-sorcery/vue

Renderizador de Markdown para Vue 3 basado en componentes anidados.

El paquete parsea Markdown a HAST con [@mark-sorcery/markdown-parser](../markdown-parser/README.md) y renderiza cada nodo `element` mediante un registro de componentes Vue. El arbol se resuelve recursivamente con `NodeList`, no con una conversion previa a VNodes anidados.

## Instalacion

```bash
bun add @mark-sorcery/vue vue
```

## Uso basico

```vue
<script setup lang="ts">
import { Markdown, createCorePlugin } from '@mark-sorcery/vue'

const markdown = `# Hola

Texto con **negrita** y una [liga](https://example.com).`
</script>

<template>
  <Markdown :markdown="markdown" :plugins="[createCorePlugin()]" />
</template>
```

## Como funciona

- `Markdown` crea un processor de `@mark-sorcery/markdown-parser` a partir de `options` y `plugins`.
- El resultado HAST se entrega a `NodeList`.
- `NodeList` busca un componente Vue para cada `tagName` dentro de `DEFAULT_COMPONENTS` combinado con tu prop `components`.
- Cada componente de elemento decide como renderizar su propio nodo y, si tiene hijos, vuelve a usar `NodeList` para continuar la recursion.

Esto significa que un componente personalizado no recibe `slots` con el contenido ya renderizado. Recibe el nodo HAST bruto y debe renderizar sus hijos explicitamente si quiere conservar el contenido anidado.

## Props de Markdown

### `markdown`

Cadena Markdown a renderizar.

### `options`

Opciones reenviadas a `createProcessor(...)`, excepto `plugins`.

### `plugins`

Lista de `ParserPlugin` para el parser subyacente. El paquete reexporta `createCorePlugin()` para habilitar `remend`, `remark-gfm` y `rehype-sanitize`.

### `stream`

Si es `true`, reutiliza memoria de parseo para streams crecientes de Markdown.

### `components`

Mapa `Record<string, Component>` indexado por `tagName`. Se fusiona con `DEFAULT_COMPONENTS`; cualquier clave que proporciones reemplaza al componente por defecto para ese tag.

### `transition`

`false`, `true` o una configuracion para `<Transition>`. Cuando se activa, cada nodo renderizado por `NodeList` se envuelve en un `Transition` de Vue.

## Componentes por defecto

El registro exportado como `DEFAULT_COMPONENTS` incluye:

- `p`
- `h1` a `h6`
- `strong`
- `em`
- `del`
- `blockquote`
- `ul`
- `ol`
- `li`
- `code`
- `a`
- `input`
- `pre`
- `table`
- `thead`
- `tbody`
- `tr`
- `th`
- `td`

Si el parser produce un tag sin componente registrado, ese nodo no se renderiza hasta que añadas una entrada correspondiente en `components`.

## Componentes personalizados

Cada componente personalizado recibe props estructurales del nodo actual:

- `element`: el nodo HAST `Element`.
- `nodeIdx`: indice del nodo dentro de su lista de hermanos.
- `deep`: profundidad actual en el arbol.
- `nodeKey`: clave estable generada para ese nodo.
- `parentNode`: nodo padre inmediato.

Si quieres conservar hijos anidados, renderiza `NodeList` dentro de tu componente:

```ts
import { defineComponent, h, markRaw } from 'vue'
import { Markdown, NodeList, createCorePlugin } from '@mark-sorcery/vue'

const CustomParagraph = markRaw(
  defineComponent({
    name: 'CustomParagraph',
    props: ['element', 'nodeIdx', 'deep', 'nodeKey', 'parentNode'],
    render() {
      return h('p', { class: 'custom-paragraph', 'data-depth': this.deep }, [
        h(NodeList, {
          nodes: this.element.children,
          nodeIdx: this.nodeIdx,
          deep: this.deep,
          nodeKey: this.nodeKey,
          parentNode: this.element,
          components: {},
          transition: false,
        }),
      ])
    },
  }),
)

const components = {
  p: CustomParagraph,
}

// <Markdown markdown="Hola **mundo**" :plugins="[createCorePlugin()]" :components="components" />
```

Si ademas reemplazas nodos hijos, por ejemplo `strong`, `a` o `code`, la recursion seguira usando tu mapa `components` en cada nivel.

## Exportaciones publicas

- `Markdown`
- `NodeList`
- `DEFAULT_COMPONENTS`
- `useMarkdown`
- `createCorePlugin`
- Tipos: `MarkdownProps`, `ElementProps`, `NodeListProps`, `MarkdownOptions`, `ParserPlugin` y otros reexportados desde el parser.

## Scripts

```bash
bun run test
bun run build
```
