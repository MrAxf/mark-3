# markdown-parser

Parser de Markdown a HAST usado por Mark Sorcery.

## Instalación

```bash
bun install
```

## Uso

El parser usa una API en dos pasos:

1. Construyes un processor reutilizable con `createProcessor(...)`.
2. Ejecutas `parse(processor, markdown, memory?)` tantas veces como necesites.

El pipeline fijo del processor siempre contiene, en este orden:

1. `remarkParse`
2. `remarkGfm` (por defecto, opcional)
3. plugins `remark`
4. `remarkRehype`
5. `rehypeHarden`
6. `rehypeRaw`
7. limpieza de nodos `text` whitespace-only (por defecto, opcional)
8. plugins `rehype`
9. `rehypeSanitize` (por defecto, opcional)

Los preprocesos de texto son opcionales y se ejecutan antes de `remarkParse`.

```ts
import { createProcessor, parse } from '@mark-sorcery/markdown-parser'

const processor = createProcessor({
  preprocess: true,
})

const root = await parse(processor, '# Hello')
```

La salida siempre es un árbol HAST `Root`.

Si vas a parsear múltiples strings con la misma configuración, reutiliza el mismo processor.

## Streaming incremental

`parse(...)` acepta un tercer parámetro opcional `memory` para streaming. En este modo cada llamada recibe el markdown acumulado completo hasta ese momento. El parser conserva el último bloque top-level como pendiente para poder reutilizar el prefijo confirmado, pero el valor devuelto sigue siendo siempre el árbol completo construido hasta ese momento.

```ts
import { createMemory, createProcessor, parse } from '@mark-sorcery/markdown-parser'

const processor = createProcessor()
const memory = createMemory()

const block1 = await parse(processor, '**hola', memory)
const block2 = await parse(processor, '**hola que tal**\nhoy', memory)
const block3 = await parse(processor, '**hola que tal**\nhoy estas muy\nbirn', memory)
// block1, block2 y block3 contienen siempre el árbol completo disponible en ese momento

memory.flush = true
const flushed = await parse(processor, '**hola que tal**\nhoy estas muy\nbirn', memory)
// flushed promueve el bloque pendiente al prefijo confirmado para futuras llamadas
```

`ParseMemory` guarda:

- `confirmedMarkdown`: markdown ya emitido.
- `pendingMarkdown`: último bloque todavía incompleto o pendiente.
- `previousMarkdown`: markdown acumulado completo de la llamada anterior.
- `previousConfirmedRoot`: último árbol confirmado reutilizable.
- `flush`: si es `true`, la siguiente llamada vacía el bloque pendiente.

Cuando usas streaming, el parser sigue aplicando los preprocessors al parseo de cada fragmento. En particular, `remend` sigue completando el bloque pendiente cuando se parsea de forma aislada, sin cerrar artificialmente todo el stream acumulado.

Si el markdown nuevo ya no empieza por `previousMarkdown`, el parser resetea `memory` y trata esa llamada como el inicio de un stream nuevo.

## Opciones core

`createProcessor(...)` ya incluye el pipeline base por defecto. Puedes ajustarlo con estas opciones:

- `gfm`: `false` para desactivar GFM o un objeto de opciones de `remark-gfm`.
- `sanitize`: `false` para desactivar sanitizado o un schema custom de `rehype-sanitize`.
- `remarkHardenOptions`: opciones de seguridad para links/imagenes.
- `removeBlankTextNodes`: `false` para preservar nodos `text` de whitespace entre bloques.

## Plugins personalizados

```ts
import { createProcessor, parse } from '@mark-sorcery/markdown-parser'

const processor = createProcessor({
  plugins: [
    {
      remark: [myRemarkPlugin],
      rehype: [[myRehypePlugin, { option: true }]],
    },
  ],
})

const root = await parse(processor, 'hello')
```

Los plugins personalizados pueden inyectar plugins de `unified` por fase:

```ts
import { createProcessor, parse } from '@mark-sorcery/markdown-parser'

const processor = createProcessor({
  preprocess: {
    remend: { bold: false },
    normalizer: {
      maxConsecutiveBlankLines: 2,
    },
  },
  plugins: [
    {
      remark: [myRemarkPlugin],
      rehype: [[myRehypePlugin, { option: true }]],
    },
  ],
})

const root = await parse(processor, 'content')
```

## API pública

### `createProcessor(options?)`

Crea un `MarkdownProcessor` reutilizable a partir de `ParseOptions`.

### `parse(processor, markdown, memory?)`

Ejecuta el parse usando un `MarkdownProcessor` ya construido y retorna una `Promise<Root>`.

Sin `memory`, parsea el string completo como hasta ahora.

Con `memory`, espera recibir el markdown acumulado completo, devuelve siempre el árbol completo disponible en ese momento, conserva internamente el último bloque como pendiente hasta que llegue el siguiente bloque o se active `memory.flush`, y resetea el estado si el stream deja de crecer por prefijo.

### `createMemory()`

Devuelve un objeto de memoria vacío tipado para reutilizarlo entre llamadas de streaming.

### `preprocess` en `createProcessor(options)`

El preprocesado se configura en `ParseOptions.preprocess`:

- `false`: desactiva todo el preprocesado.
- `true`: activa `normalizer` y `remend` con defaults.
- objeto: permite personalizar `normalizer` y/o `remend`.

Ejemplo:

```ts
const processor = createProcessor({
  preprocess: {
    normalizer: {
      tabWidth: 2,
      maxConsecutiveBlankLines: 1,
    },
    remend: true,
  },
})
```

### Otras opciones importantes

- `gfm`: activa/desactiva o configura `remark-gfm`.
- `sanitize`: activa/desactiva o configura `rehype-sanitize`.
- `remarkHardenOptions`: configura `rehype-harden`.
- `removeBlankTextNodes`: controla la limpieza de nodos `text` whitespace-only en HAST.

## Scripts

```bash
bun run benchmark
bun run test
bun run test:coverage
bun run build
```

## Benchmark

El paquete incluye un benchmark ejecutable que mide `await parse(processor, markdown)` reutilizando un mismo processor con opciones core y una carga sintética representativa.

```bash
bun run benchmark
```

Se puede ajustar el tamaño de la carga y el número de iteraciones con variables de entorno:

```bash
BENCHMARK_SECTIONS=200 BENCHMARK_WARMUP=5 BENCHMARK_ITERATIONS=20 bun run benchmark
```
