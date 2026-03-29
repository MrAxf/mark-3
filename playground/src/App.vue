<script setup lang="ts">
import type { MarkdownProps, ParserPlugin } from '@mark-sorcery/vue'
import type { Element, Root } from 'hast'

import { createAddClassesPlugin } from '@mark-sorcery/plugin-add-classes'
import { Markdown } from '@mark-sorcery/vue'
import { computed, markRaw, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import CustomCode from './components/CustomCode.vue'
import CustomHeading from './components/CustomHeading.vue'

const SAMPLE = `# Grimorio de pruebas

Bienvenido al nuevo playground de **Mark Sorcery**.

## Capacidades

- Render de markdown en vivo
- Plugins rehype configurables
- Componentes Vue personalizados
- Transiciones por nodo

## Tabla

| Opcion | Estado |
|---|---|
| stream | activo |
| gfm | configurable |
| sanitize | configurable |

## Código

\`\`\`ts
import { Markdown } from '@mark-sorcery/vue'

const markdown = '# Hechizo listo'
\`\`\`

## Mermaid

\`\`\`mermaid
flowchart LR
  A[Entrada] --> B[Parser]
  B --> C[HAST]
  C --> D[Vue]
\`\`\`

> La interfaz está pensada para trabajar rápido sin ruido visual.
`

type Mode = 'default' | 'off' | 'custom'
type PreprocessMode = 'default' | 'off' | 'custom'
type TransitionMode = 'off' | 'default' | 'custom'

type ComponentsPreset = 'full' | 'headings' | 'code-only'

const markdown = ref(SAMPLE)
const panelOpen = ref(true)
const advancedMode = ref(false)
const autoscrollEnabled = ref(true)
const previewRef = ref<HTMLElement | null>(null)

const stream = ref(false)
let streamTimer: ReturnType<typeof setTimeout> | null = null
let autoscrollFrame: ReturnType<typeof requestAnimationFrame> | null = null

const gfmMode = ref<Mode>('default')
const gfmCustom = ref('{}')

const sanitizeMode = ref<Mode>('default')
const sanitizeCustom = ref('{}')

const preprocessEnabled = ref(true)
const remendMode = ref<PreprocessMode>('default')
const remendCustom = ref('{}')
const normalizerMode = ref<PreprocessMode>('default')
const normalizerCustom = ref('{"maxConsecutiveBlankLines": 1}')

const removeBlankTextNodes = ref<'default' | 'off'>('default')

const remarkRehypeMode = ref<'default' | 'custom'>('default')
const remarkRehypeCustom = ref('{}')

const remarkHardenMode = ref<'default' | 'custom'>('default')
const remarkHardenCustom = ref('{}')

const addClassesPluginEnabled = ref(true)
const addClassH1 = ref('grimoire-heading')
const addClassPre = ref('grimoire-pre')
const accentPluginEnabled = ref(true)

const componentsEnabled = ref(true)
const componentsPreset = ref<ComponentsPreset>('full')
const useH2Override = ref(true)
const useH3Override = ref(true)
const usePreOverride = ref(true)

const transitionMode = ref<TransitionMode>('default')
const transitionName = ref('sigil-rise')
const transitionCustom = ref('{"mode": "out-in"}')

function parseJson(raw: string): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(raw) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'JSON inválido' }
  }
}

function appendClass(node: Element, className: string) {
  const current = node.properties?.className
  const classes = Array.isArray(current)
    ? current.map((item) => String(item))
    : typeof current === 'string'
      ? current.split(/\s+/).filter(Boolean)
      : []

  if (!classes.includes(className)) {
    classes.push(className)
  }

  node.properties = {
    ...node.properties,
    className: classes,
  }
}

function walkElements(node: { children?: unknown[] }, visit: (element: Element) => void) {
  for (const child of node.children ?? []) {
    if (!child || typeof child !== 'object') {
      continue
    }

    const element = child as Partial<Element>
    if (element.type !== 'element') {
      continue
    }

    visit(element as Element)
    walkElements(element as { children?: unknown[] }, visit)
  }
}

const accentPlugin: ParserPlugin = {
  rehype: [
    () => (root: Root) => {
      walkElements(root, (element) => {
        if (element.tagName === 'h2' || element.tagName === 'h3') {
          appendClass(element, 'plugin-accent')
        }

        if (element.tagName === 'blockquote') {
          appendClass(element, 'plugin-quote')
        }
      })
    },
  ],
}

const resolvedOptions = computed(() => {
  const options: NonNullable<MarkdownProps['options']> = {}
  const errors: string[] = []

  if (gfmMode.value === 'off') {
    options.gfm = false
  } else if (gfmMode.value === 'custom') {
    const parsed = parseJson(gfmCustom.value)
    if (parsed.error) {
      errors.push(`gfm JSON: ${parsed.error}`)
    } else {
      options.gfm = parsed.value as NonNullable<MarkdownProps['options']>['gfm']
    }
  }

  if (sanitizeMode.value === 'off') {
    options.sanitize = false
  } else if (sanitizeMode.value === 'custom') {
    const parsed = parseJson(sanitizeCustom.value)
    if (parsed.error) {
      errors.push(`sanitize JSON: ${parsed.error}`)
    } else {
      options.sanitize = parsed.value as NonNullable<MarkdownProps['options']>['sanitize']
    }
  }

  if (preprocessEnabled.value) {
    const preprocess: Record<string, unknown> = {}

    if (remendMode.value === 'off') {
      preprocess.remend = false
    } else if (remendMode.value === 'custom') {
      const parsed = parseJson(remendCustom.value)
      if (parsed.error) {
        errors.push(`remend JSON: ${parsed.error}`)
      } else {
        preprocess.remend = parsed.value
      }
    }

    if (normalizerMode.value === 'off') {
      preprocess.normalizer = false
    } else if (normalizerMode.value === 'custom') {
      const parsed = parseJson(normalizerCustom.value)
      if (parsed.error) {
        errors.push(`normalizer JSON: ${parsed.error}`)
      } else {
        preprocess.normalizer = parsed.value
      }
    }

    options.preprocess = preprocess
  }

  if (removeBlankTextNodes.value === 'off') {
    options.removeBlankTextNodes = false
  }

  if (remarkRehypeMode.value === 'custom') {
    const parsed = parseJson(remarkRehypeCustom.value)
    if (parsed.error) {
      errors.push(`remarkRehypeOptions JSON: ${parsed.error}`)
    } else {
      options.remarkRehypeOptions = parsed.value as NonNullable<
        MarkdownProps['options']
      >['remarkRehypeOptions']
    }
  }

  if (remarkHardenMode.value === 'custom') {
    const parsed = parseJson(remarkHardenCustom.value)
    if (parsed.error) {
      errors.push(`remarkHardenOptions JSON: ${parsed.error}`)
    } else {
      options.remarkHardenOptions = parsed.value as NonNullable<
        MarkdownProps['options']
      >['remarkHardenOptions']
    }
  }

  return {
    options,
    errors,
  }
})

const transitionResult = computed(() => {
  if (transitionMode.value === 'off') {
    return {
      transition: false as MarkdownProps['transition'],
      error: '',
    }
  }

  if (transitionMode.value === 'default') {
    return {
      transition: {
        name: transitionName.value,
      } as MarkdownProps['transition'],
      error: '',
    }
  }

  const parsed = parseJson(transitionCustom.value)
  if (parsed.error) {
    return {
      transition: {
        name: transitionName.value,
      } as MarkdownProps['transition'],
      error: `transition JSON: ${parsed.error}`,
    }
  }

  return {
    transition: parsed.value as MarkdownProps['transition'],
    error: '',
  }
})

const markdownOptions = computed<MarkdownProps['options']>(() => resolvedOptions.value.options)

const processorPlugins = computed<ParserPlugin[]>(() => {
  const plugins: ParserPlugin[] = []

  if (addClassesPluginEnabled.value) {
    plugins.push(
      createAddClassesPlugin({
        elements: {
          h1: addClassH1.value,
          pre: addClassPre.value,
        },
      }),
    )
  }

  if (accentPluginEnabled.value) {
    plugins.push(accentPlugin)
  }

  return plugins
})

const customComponents = {
  h2: markRaw(CustomHeading),
  h3: markRaw(CustomHeading),
  pre: markRaw(CustomCode),
} satisfies NonNullable<MarkdownProps['components']>

watch(componentsPreset, (preset) => {
  if (preset === 'full') {
    useH2Override.value = true
    useH3Override.value = true
    usePreOverride.value = true
    return
  }

  if (preset === 'headings') {
    useH2Override.value = true
    useH3Override.value = true
    usePreOverride.value = false
    return
  }

  useH2Override.value = false
  useH3Override.value = false
  usePreOverride.value = true
})

const activeComponents = computed<NonNullable<MarkdownProps['components']>>(() => {
  if (!componentsEnabled.value) {
    return {}
  }

  const components: NonNullable<MarkdownProps['components']> = {}

  if (useH2Override.value) {
    components.h2 = customComponents.h2
  }

  if (useH3Override.value) {
    components.h3 = customComponents.h3
  }

  if (usePreOverride.value) {
    components.pre = customComponents.pre
  }

  return components
})

const issues = computed(() => {
  const errors = [...resolvedOptions.value.errors]

  if (transitionResult.value.error) {
    errors.push(transitionResult.value.error)
  }

  return errors
})

const stats = computed(() => {
  const text = markdown.value
  const trimmed = text.trim()

  return {
    chars: text.length,
    lines: text.length === 0 ? 0 : text.split(/\r?\n/).length,
    words: trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length,
  }
})

function schedulePreviewAutoscroll() {
  if (!stream.value || !autoscrollEnabled.value) {
    return
  }

  if (autoscrollFrame) {
    cancelAnimationFrame(autoscrollFrame)
  }

  autoscrollFrame = requestAnimationFrame(() => {
    autoscrollFrame = null
    const container = previewRef.value
    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  })
}

watch(markdown, async () => {
  if (!stream.value || !autoscrollEnabled.value) {
    return
  }

  await nextTick()
  schedulePreviewAutoscroll()
})

onBeforeUnmount(() => {
  if (autoscrollFrame) {
    cancelAnimationFrame(autoscrollFrame)
    autoscrollFrame = null
  }
})

function simulateStream() {
  if (stream.value) {
    stopStream()
    return
  }

  stream.value = true
  markdown.value = ''
  let index = 0

  function tick() {
    if (index >= SAMPLE.length) {
      stream.value = false
      return
    }

    markdown.value += SAMPLE.slice(index, index + 4)
    index += 4
    streamTimer = setTimeout(tick, 20)
  }

  tick()
  schedulePreviewAutoscroll()
}

function stopStream() {
  if (streamTimer) {
    clearTimeout(streamTimer)
    streamTimer = null
  }

  stream.value = false
  markdown.value = SAMPLE
}

function resetAll() {
  stopStream()
  markdown.value = SAMPLE
  gfmMode.value = 'default'
  sanitizeMode.value = 'default'
  preprocessEnabled.value = true
  remendMode.value = 'default'
  normalizerMode.value = 'default'
  removeBlankTextNodes.value = 'default'
  remarkRehypeMode.value = 'default'
  remarkHardenMode.value = 'default'
  addClassesPluginEnabled.value = true
  accentPluginEnabled.value = true
  componentsEnabled.value = true
  componentsPreset.value = 'full'
  transitionMode.value = 'default'
  transitionName.value = 'sigil-rise'
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-brand">
        <p class="kicker">mark sorcery // vue playground</p>
        <h1>Grimorio de render</h1>
      </div>
      <div class="topbar-controls" aria-label="Acciones principales">
        <div class="topbar-actions">
          <button class="ghost" type="button" @click="panelOpen = !panelOpen">
            {{ panelOpen ? 'Ocultar panel' : 'Mostrar panel' }}
          </button>
          <button class="ghost" type="button" @click="advancedMode = !advancedMode">
            {{ advancedMode ? 'Modo básico' : 'Modo avanzado' }}
          </button>
        </div>

        <button class="action" type="button" :class="{ active: stream }" @click="simulateStream">
          {{ stream ? 'Detener stream' : 'Simular stream' }}
        </button>
        <button class="ghost" type="button" @click="markdown = SAMPLE">Reset texto</button>
        <button class="ghost" type="button" @click="resetAll">Reset total</button>
        <label class="toggle-chip" title="Solo aplica durante streaming">
          <input v-model="autoscrollEnabled" type="checkbox" />
          <span>Autoscroll preview (stream)</span>
        </label>
      </div>
    </header>

    <section v-if="issues.length" class="warnings" aria-live="polite">
      <p>Se detectaron errores de configuración JSON:</p>
      <ul>
        <li v-for="issue in issues" :key="issue">{{ issue }}</li>
      </ul>
    </section>

    <main class="layout" :class="{ 'panel-collapsed': !panelOpen }">
      <section class="workspace-column">
        <article class="card editor-card">
          <header class="card-header">
            <h2>Entrada Markdown</h2>
            <div class="meta-row">
              <span>{{ stats.chars }} chars</span>
              <span>{{ stats.lines }} lines</span>
              <span>{{ stats.words }} words</span>
            </div>
          </header>
          <textarea
            v-model="markdown"
            class="editor"
            spellcheck="false"
            :disabled="stream"
            placeholder="Escribe un hechizo markdown..."
          />
        </article>

        <article class="card output-card">
          <header class="card-header">
            <h2>Vista previa</h2>
            <div class="meta-row">
              <span>{{ processorPlugins.length }} plugins</span>
              <span>{{ componentsEnabled ? 'components on' : 'components off' }}</span>
              <span>{{ transitionMode }}</span>
            </div>
          </header>

          <div ref="previewRef" class="prose">
            <Markdown
              :markdown="markdown"
              :options="markdownOptions"
              :plugins="processorPlugins"
              :stream="stream"
              :components="activeComponents"
              :transition="transitionResult.transition"
            />
          </div>
        </article>
      </section>

      <aside v-if="panelOpen" class="card panel" aria-label="Configuración del parser y render">
        <header class="panel-title">
          <h2>Control de hechizos</h2>
          <p>Todas las opciones del componente Vue.</p>
        </header>

        <details open class="section">
          <summary>Contenido</summary>
          <label class="field">
            <span>Streaming (prop stream)</span>
            <input v-model="stream" type="checkbox" />
          </label>
        </details>

        <details open class="section">
          <summary>Parser</summary>

          <label class="field">
            <span>GFM</span>
            <select v-model="gfmMode">
              <option value="default">Default</option>
              <option value="off">Off</option>
              <option value="custom">Custom JSON</option>
            </select>
          </label>
          <textarea
            v-if="gfmMode === 'custom'"
            v-model="gfmCustom"
            class="json"
            spellcheck="false"
          />

          <label class="field">
            <span>Sanitize</span>
            <select v-model="sanitizeMode">
              <option value="default">Default</option>
              <option value="off">Off</option>
              <option value="custom">Custom JSON</option>
            </select>
          </label>
          <textarea
            v-if="sanitizeMode === 'custom'"
            v-model="sanitizeCustom"
            class="json"
            spellcheck="false"
          />

          <label class="field">
            <span>Preprocess</span>
            <input v-model="preprocessEnabled" type="checkbox" />
          </label>

          <template v-if="preprocessEnabled">
            <label class="field">
              <span>remend</span>
              <select v-model="remendMode">
                <option value="default">Default</option>
                <option value="off">Off</option>
                <option value="custom">Custom JSON</option>
              </select>
            </label>
            <textarea
              v-if="remendMode === 'custom'"
              v-model="remendCustom"
              class="json"
              spellcheck="false"
            />

            <label class="field">
              <span>normalizer</span>
              <select v-model="normalizerMode">
                <option value="default">Default</option>
                <option value="off">Off</option>
                <option value="custom">Custom JSON</option>
              </select>
            </label>
            <textarea
              v-if="normalizerMode === 'custom'"
              v-model="normalizerCustom"
              class="json"
              spellcheck="false"
            />
          </template>

          <label class="field" v-if="advancedMode">
            <span>removeBlankTextNodes</span>
            <select v-model="removeBlankTextNodes">
              <option value="default">Default</option>
              <option value="off">Off</option>
            </select>
          </label>

          <label class="field" v-if="advancedMode">
            <span>remarkRehypeOptions</span>
            <select v-model="remarkRehypeMode">
              <option value="default">Default</option>
              <option value="custom">Custom JSON</option>
            </select>
          </label>
          <textarea
            v-if="advancedMode && remarkRehypeMode === 'custom'"
            v-model="remarkRehypeCustom"
            class="json"
            spellcheck="false"
          />

          <label class="field" v-if="advancedMode">
            <span>remarkHardenOptions</span>
            <select v-model="remarkHardenMode">
              <option value="default">Default</option>
              <option value="custom">Custom JSON</option>
            </select>
          </label>
          <textarea
            v-if="advancedMode && remarkHardenMode === 'custom'"
            v-model="remarkHardenCustom"
            class="json"
            spellcheck="false"
          />
        </details>

        <details open class="section">
          <summary>Plugins</summary>
          <label class="field">
            <span>Add classes plugin</span>
            <input v-model="addClassesPluginEnabled" type="checkbox" />
          </label>
          <template v-if="addClassesPluginEnabled && advancedMode">
            <label class="field">
              <span>Clase para h1</span>
              <input v-model="addClassH1" type="text" />
            </label>
            <label class="field">
              <span>Clase para pre</span>
              <input v-model="addClassPre" type="text" />
            </label>
          </template>

          <label class="field">
            <span>Accent plugin rehype</span>
            <input v-model="accentPluginEnabled" type="checkbox" />
          </label>
        </details>

        <details open class="section">
          <summary>Render</summary>
          <label class="field">
            <span>Transition</span>
            <select v-model="transitionMode">
              <option value="off">Off</option>
              <option value="default">Default (name)</option>
              <option value="custom">Custom JSON</option>
            </select>
          </label>

          <label class="field" v-if="transitionMode !== 'off'">
            <span>transition.name</span>
            <input v-model="transitionName" type="text" />
          </label>

          <textarea
            v-if="transitionMode === 'custom'"
            v-model="transitionCustom"
            class="json"
            spellcheck="false"
          />
        </details>

        <details open class="section">
          <summary>Componentes</summary>
          <label class="field">
            <span>Enable components override</span>
            <input v-model="componentsEnabled" type="checkbox" />
          </label>

          <template v-if="componentsEnabled">
            <label class="field">
              <span>Preset</span>
              <select v-model="componentsPreset">
                <option value="full">Full</option>
                <option value="headings">Solo headings</option>
                <option value="code-only">Solo code</option>
              </select>
            </label>

            <label class="field" v-if="advancedMode">
              <span>h2 => CustomHeading</span>
              <input v-model="useH2Override" type="checkbox" />
            </label>
            <label class="field" v-if="advancedMode">
              <span>h3 => CustomHeading</span>
              <input v-model="useH3Override" type="checkbox" />
            </label>
            <label class="field" v-if="advancedMode">
              <span>pre => CustomCode</span>
              <input v-model="usePreOverride" type="checkbox" />
            </label>
          </template>
        </details>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  height: 100dvh;
  padding: clamp(0.75rem, 0.6rem + 0.8vw, 1.4rem);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid var(--line);
  background: var(--surface-strong);
  padding: 0.46rem 0.62rem;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--accent) 18%, transparent),
    0 12px 32px color-mix(in srgb, var(--accent) 10%, transparent);
}

.topbar-brand {
  min-width: 0;
}

.kicker {
  margin: 0;
  font-size: 0.63rem;
  letter-spacing: 0.2em;
  color: var(--ink-dim);
  text-transform: uppercase;
  line-height: 1;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: clamp(0.98rem, 0.82rem + 0.7vw, 1.25rem);
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.05;
}

.topbar-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.topbar-actions {
  display: flex;
  gap: 0.36rem;
  flex-wrap: wrap;
  justify-content: end;
}

.layout {
  flex: 1;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 24rem);
  min-height: 0;
  overflow: hidden;
}

.layout.panel-collapsed {
  grid-template-columns: 1fr;
}

.workspace-column {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 0.75rem;
}

.card {
  border: 1px solid var(--line);
  background: var(--surface);
  backdrop-filter: blur(2px);
  min-height: 0;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--accent) 10%, transparent),
    0 16px 34px color-mix(in srgb, black 62%, transparent);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--line-soft);
  padding: 0.65rem 0.85rem;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 0.45rem;
  color: var(--ink-dim);
  font-size: 0.75rem;
}

.editor {
  width: 100%;
  flex: 1;
  min-height: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  padding: 0.85rem;
  resize: none;
  font-size: 0.9rem;
  line-height: 1.58;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}

.editor:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 1px;
}

.editor-card,
.output-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.prose {
  min-height: 0;
  overflow: auto;
  padding: 0.9rem 1rem 1.2rem;
  color: var(--ink);
  line-height: 1.72;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  color: var(--ink-strong);
  margin: 1em 0 0.5em;
}

.prose :deep(blockquote) {
  border-left: 2px solid var(--accent-soft);
  margin: 0.9rem 0;
  padding: 0.15rem 0.8rem;
  color: var(--ink-muted);
}

.prose :deep(pre) {
  border: 1px solid var(--line);
}

.prose :deep(table) {
  width: 100%;
  min-width: 32rem;
  border-collapse: collapse;
  margin: 0.95rem 0;
}

.prose :deep(thead) {
  background: color-mix(in srgb, var(--accent-soft) 42%, transparent);
}

.prose :deep(th),
.prose :deep(td) {
  border: 1px solid var(--line);
  padding: 0.45rem 0.6rem;
  text-align: left;
}

.prose :deep(th) {
  color: var(--ink-strong);
  font-weight: 600;
}

.prose :deep(td) {
  color: var(--ink);
}

.prose :deep(tr:nth-child(even) td) {
  background: color-mix(in srgb, var(--surface-soft) 60%, transparent);
}

.prose :deep(.plugin-accent) {
  position: relative;
  padding-left: 0.8rem;
}

.prose :deep(.plugin-accent)::before {
  content: 'ᚱ';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--accent);
}

.prose :deep(.plugin-quote) {
  background: color-mix(in srgb, var(--accent-soft) 18%, transparent);
}

.prose :deep(.sigil-rise-enter-active) {
  transition:
    opacity 280ms ease,
    transform 280ms ease;
}

.prose :deep(.sigil-rise-enter-from) {
  opacity: 0;
  transform: translateY(6px);
}

.panel {
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 0.7rem;
}

.toggle-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  padding: 0.23rem 0.4rem;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface-soft) 85%, transparent);
  font-size: 0.71rem;
  color: var(--ink);
}

.toggle-chip span {
  line-height: 1;
}

.panel-title {
  padding: 0.1rem 0.2rem 0.7rem;
  border-bottom: 1px dashed var(--line-soft);
  margin-bottom: 0.35rem;
}

.panel-title p {
  color: var(--ink-dim);
  font-size: 0.82rem;
}

.section {
  border-bottom: 1px solid var(--line-soft);
  padding: 0.38rem 0;
}

summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--ink-strong);
  letter-spacing: 0.02em;
}

.field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
  font-size: 0.84rem;
}

input,
select,
textarea {
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--ink);
  padding: 0.4rem 0.5rem;
}

input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--accent);
}

.json {
  width: 100%;
  margin-top: 0.45rem;
  min-height: 5.5rem;
  resize: vertical;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.78rem;
}

.action,
.ghost {
  border: 1px solid var(--line);
  padding: 0.28rem 0.46rem;
  font-size: 0.7rem;
  color: var(--ink);
  background: var(--surface-soft);
  cursor: pointer;
}

.action.active {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
}

.warnings {
  border: 1px solid color-mix(in srgb, var(--danger) 50%, var(--line));
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  padding: 0.7rem 0.85rem;
}

.warnings p {
  margin-bottom: 0.45rem;
}

.warnings ul {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.25rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.76rem;
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .workspace-column {
    grid-template-columns: 1fr;
  }

  .panel {
    height: auto;
    max-height: 42vh;
  }
}

@media (max-width: 720px) {
  .topbar {
    align-items: start;
    flex-direction: column;
  }

  .topbar-controls {
    width: 100%;
    justify-content: start;
    margin-left: 0;
  }

  .topbar-actions {
    justify-content: start;
  }

  .field {
    grid-template-columns: 1fr;
  }
}
</style>
