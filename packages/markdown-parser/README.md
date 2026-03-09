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
2. plugins `remark`
3. `remarkRehype`
4. `rehypeRaw`
5. plugins `rehype`
6. posprocesos HAST

Los preprocesos de texto se ejecutan antes de `remarkParse`.

```ts
import { createCorePlugin, createProcessor, parse } from "@mark-sorcery/markdown-parser";

const processor = createProcessor({
  plugins: [createCorePlugin()],
});

const root = parse(processor, "# Hello");
```

La salida siempre es un árbol HAST `Root`.

Si vas a parsear múltiples strings con la misma configuración, reutiliza el mismo processor.

## Streaming incremental

`parse(...)` acepta un tercer parámetro opcional `memory` para streaming. En este modo cada llamada recibe el markdown acumulado completo hasta ese momento. El parser conserva el último bloque top-level como pendiente para poder reutilizar el prefijo confirmado, pero el valor devuelto sigue siendo siempre el árbol completo construido hasta ese momento.

```ts
import { createMemory, createProcessor, parse } from "@mark-sorcery/markdown-parser";

const processor = createProcessor();
const memory = createMemory();

const block1 = parse(processor, "**hola", memory);
const block2 = parse(processor, "**hola que tal**\nhoy", memory);
const block3 = parse(processor, "**hola que tal**\nhoy estas muy\nbirn", memory);
// block1, block2 y block3 contienen siempre el árbol completo disponible en ese momento

memory.flush = true;
const flushed = parse(processor, "**hola que tal**\nhoy estas muy\nbirn", memory);
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

## Plugin interno

El paquete expone `createCorePlugin()`, que reproduce el comportamiento base del parser:

- preproceso con `remend`
- plugin `remark-gfm`
- plugin `rehype-sanitize`

```ts
import { createCorePlugin, createProcessor, parse } from "@mark-sorcery/markdown-parser";

const processor = createProcessor({
  plugins: [
    createCorePlugin({
      remend: true,
      gfm: true,
      sanitize: false,
    }),
  ],
});

const root = parse(processor, "**incomplete");
```

## Plugins personalizados

```ts
import { createCorePlugin, createProcessor, parse } from "@mark-sorcery/markdown-parser";

const processor = createProcessor({
  plugins: [
    createCorePlugin(),
    {
      preprocess: (markdown) => `# ${markdown}`,
      postprocess: (tree) => {
        const heading = tree.children[0];
        if (heading?.type === "element" && heading.tagName === "h1") {
          heading.tagName = "h2";
        }

        return tree;
      },
    },
  ],
});

const root = parse(processor, "hello");
```

Un plugin también puede inyectar plugins de `unified` por fase:

```ts
import { createProcessor, parse } from "@mark-sorcery/markdown-parser";

const processor = createProcessor({
  plugins: [
    {
      remark: [myRemarkPlugin],
      rehype: [[myRehypePlugin, { option: true }]],
    },
  ],
});

const root = parse(processor, "content");
```

## API pública

### `createProcessor(options?)`

Crea un `MarkdownProcessor` reutilizable a partir de `ParseOptions`.

### `parse(processor, markdown, memory?)`

Ejecuta el parse usando un `MarkdownProcessor` ya construido.

Sin `memory`, parsea el string completo como hasta ahora.

Con `memory`, espera recibir el markdown acumulado completo, devuelve siempre el árbol completo disponible en ese momento, conserva internamente el último bloque como pendiente hasta que llegue el siguiente bloque o se active `memory.flush`, y resetea el estado si el stream deja de crecer por prefijo.

### `createMemory()`

Devuelve un objeto de memoria vacío tipado para reutilizarlo entre llamadas de streaming.

### `createCorePlugin(options?)`

Devuelve un preset con `remend`, `remark-gfm` y `rehype-sanitize`.

## Scripts

```bash
bun run benchmark
bun run test
bun run build
```

## Benchmark

El paquete incluye un benchmark ejecutable que mide `parse(processor, markdown)` reutilizando un mismo processor con `createCorePlugin()` y una carga sintética representativa.

```bash
bun run benchmark
```

Se puede ajustar el tamaño de la carga y el número de iteraciones con variables de entorno:

```bash
BENCHMARK_SECTIONS=200 BENCHMARK_WARMUP=5 BENCHMARK_ITERATIONS=20 bun run benchmark
```
