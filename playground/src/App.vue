<script setup lang="ts">
import { computed, markRaw, ref, shallowRef } from 'vue'
import { Markdown } from '@mark-sorcery/vue'
import type { Components, ParseOptions, TransitionConfig } from '@mark-sorcery/vue'
import type { Element } from 'hast'
import CustomCode from './components/CustomCode.vue'
import CustomHeading from './components/CustomHeading.vue'
import CustomMermaid from './components/CustomMermaid.vue'

const SAMPLE = `# Streaming Markdown Playground

Welcome! Type in the editor or hit **Simulate Stream** to watch markdown render live.

## Features

- **Bold**, *italic*, ~~strikethrough~~
- \`inline code\`
- [Links](https://vuejs.org)
- GFM tables and task lists

## GFM Table

| Library | Role | Status |
|---|---|---|
| remark | Markdown -> MDAST | ✅ |
| rehype | MDAST -> HAST | ✅ |
| remend | Streaming repair | ✅ |
| unified | Pipeline engine | ✅ |

## Task List

- [x] Create markdown parser
- [x] Create Vue component
- [ ] Ship to production

## Code Block

\`\`\`typescript
import { Markdown } from '@mark-3/vue'

const md = ref('# Hello streaming!')
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
  A[markdown] --> B[remark]
  B --> C[MDAST]
  C --> D[rehype]
  D --> E[HAST]
  E --> F[VNodes]
  F --> G[DOM]
\`\`\`

## Another Diagram

\`\`\`mermaid
sequenceDiagram
  participant User
  participant Markdown
  participant Parser
  User->>Markdown: :markdown prop
  Markdown->>Parser: parseMarkdown()
  Parser-->>Markdown: HAST Root
  Markdown-->>User: VNodes rendered
\`\`\`

## Inline HTML (sanitized)

<b>Bold HTML</b> and <em>italic HTML</em> are kept.
Dangerous tags like \`<iframe>\`, \`<script>\` and event attributes are stripped by rehype-sanitize.
`

const markdown = ref(SAMPLE)
const streaming = ref(false)
let streamTimer: ReturnType<typeof setTimeout> | null = null

const gfm = ref(true)
const remendEnabled = ref(true)
const sanitizeEnabled = ref(true)

const options = ref<ParseOptions>({
  gfm: true,
  remend: true,
  sanitize: undefined,
})

function updateOptions() {
  options.value = {
    gfm: gfm.value,
    remend: remendEnabled.value,
    sanitize: sanitizeEnabled.value ? undefined : false,
  }
}

const useCustomComponents = ref(false)

const componentResolver: Components = (node: Element) => {
  if (node.tagName === 'h1' || node.tagName === 'h2' || node.tagName === 'h3') {
    return markRaw(CustomHeading)
  }
  if (node.tagName === 'pre') {
    const codeEl = node.children.find(
      (c): c is Element => c.type === 'element' && c.tagName === 'code',
    )
    const classes = (codeEl?.properties?.className as string[] | undefined) ?? []
    if (classes.includes('language-mermaid')) return markRaw(CustomMermaid)
    if (classes.some(c => c.startsWith('language-'))) return markRaw(CustomCode)
  }
  return undefined
}

const activeComponents = shallowRef<Components>({})

function toggleCustomComponents() {
  activeComponents.value = useCustomComponents.value ? componentResolver : {}
}

const transitionEnabled = ref(false)
const transitionPreset = ref<'fade' | 'slide-up' | 'pop'>('fade')

const activeTransition = computed<boolean | TransitionConfig>(() =>
  transitionEnabled.value ? { name: transitionPreset.value, appear: true } : false,
)

function simulateStream() {
  if (streaming.value) {
    stopStream()
    return
  }
  markdown.value = ''
  streaming.value = true
  let i = 0

  function tick() {
    if (i >= SAMPLE.length) {
      streaming.value = false
      return
    }
    const chunk = SAMPLE.slice(i, i + 3)
    markdown.value += chunk
    i += 3
    streamTimer = setTimeout(tick, 16)
  }
  tick()
}

function stopStream() {
  if (streamTimer) clearTimeout(streamTimer)
  streaming.value = false
  markdown.value = SAMPLE
}
</script>

<template>
  <div class="app">
    <div class="forge-bg" aria-hidden="true">
      <span class="forge-grid" />
      <span class="forge-rivet forge-rivet-a" />
      <span class="forge-rivet forge-rivet-b" />
      <span class="forge-rivet forge-rivet-c" />
    </div>

    <header class="header brutal-block">
      <div class="header-left">
        <div class="arc-reactor" aria-hidden="true">
          <span class="arc-shell" />
          <span class="arc-ring" />
          <span class="arc-core" />
        </div>
        <div>
          <p class="panel-kicker">prototype bay // mk3</p>
          <h1 class="title">MARK-3 <span>PLAYGROUND</span></h1>
          <p class="subtitle">streaming markdown -> HAST -> Vue VNodes</p>
        </div>
      </div>
      <code class="header-badge">@mark-3/vue</code>
    </header>

    <section class="controls brutal-block" aria-label="Markdown controls">
      <div class="control-group">
        <button class="btn btn-primary" :class="{ active: streaming }" @click="simulateStream">
          {{ streaming ? 'Stop stream' : 'Simulate stream' }}
        </button>
        <button class="btn" @click="markdown = SAMPLE">Reset</button>
      </div>

      <span class="group-divider" aria-hidden="true" />

      <div class="control-group control-checks">
        <label class="check">
          <input v-model="gfm" type="checkbox" @change="updateOptions" />
          <span>GFM</span>
        </label>
        <label class="check">
          <input v-model="remendEnabled" type="checkbox" @change="updateOptions" />
          <span>remend</span>
        </label>
        <label class="check">
          <input v-model="sanitizeEnabled" type="checkbox" @change="updateOptions" />
          <span>sanitize</span>
        </label>
      </div>

      <span class="group-divider" aria-hidden="true" />

      <div class="control-group control-checks">
        <label class="check">
          <input v-model="useCustomComponents" type="checkbox" @change="toggleCustomComponents" />
          <span>Custom components</span>
        </label>
        <label class="check">
          <input v-model="transitionEnabled" type="checkbox" />
          <span>Transitions</span>
        </label>
        <select v-if="transitionEnabled" v-model="transitionPreset" class="preset-select">
          <option value="fade">Fade</option>
          <option value="slide-up">Slide up</option>
          <option value="pop">Pop</option>
        </select>
      </div>
    </section>

    <main class="panels">
      <section class="panel panel-input brutal-block">
        <header class="panel-label">
          <span class="label-title">Input</span>
          <span class="label-meta">{{ markdown.length }} chars</span>
        </header>
        <textarea
          v-model="markdown"
          class="editor"
          spellcheck="false"
          :disabled="streaming"
          placeholder="Write markdown here..."
        />
      </section>

      <section class="panel panel-output brutal-block">
        <header class="panel-label">
          <span class="label-title">Output</span>
          <span class="label-meta">HAST -> VNodes</span>
          <span v-if="streaming" class="live-badge">Live</span>
        </header>
        <div class="prose">
          <Markdown
            :markdown="markdown"
            :options="options"
            :components="activeComponents"
            :transition="activeTransition"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100vh;
  padding: 16px;
}

.forge-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    linear-gradient(145deg, rgba(224, 57, 57, 0.09), transparent 38%),
    radial-gradient(circle at 85% 20%, rgba(255, 183, 43, 0.11), transparent 55%),
    linear-gradient(180deg, rgba(8, 10, 13, 0.4), rgba(8, 10, 13, 0.78));
}

.forge-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(transparent, #000 20%, #000 80%, transparent);
}

.forge-rivet {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid #4f555d;
  background: linear-gradient(180deg, #222830, #14181f);
  box-shadow: 0 0 0 2px #0b0d11;
}

.forge-rivet-a {
  top: 14px;
  right: 12px;
}

.forge-rivet-b {
  bottom: 10px;
  left: 14px;
}

.forge-rivet-c {
  bottom: 12px;
  right: 20px;
}

.brutal-block {
  border: 3px solid #242a31;
  border-radius: 0;
  box-shadow: 6px 6px 0 #0a0c10;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background:
    linear-gradient(135deg, rgba(183, 25, 25, 0.24), rgba(18, 20, 27, 0.95) 44%),
    repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.03),
      rgba(255, 255, 255, 0.03) 8px,
      transparent 8px,
      transparent 16px
    );
  padding: 14px 16px 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.arc-reactor {
  width: 46px;
  height: 46px;
  position: relative;
  flex-shrink: 0;
}

.arc-shell {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 3px solid #505963;
  background: radial-gradient(circle, #0e1116 20%, #0a0c11 100%);
}

.arc-ring {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 2px solid rgba(125, 211, 252, 0.7);
  box-shadow: 0 0 16px rgba(125, 211, 252, 0.35);
}

.arc-core {
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #ecfeff 0%, var(--arc-hi) 45%, rgba(14, 165, 233, 0.35) 100%);
  animation: corePulse 2s ease-in-out infinite;
}

@keyframes corePulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(125, 211, 252, 0.45);
  }
  50% {
    box-shadow: 0 0 16px rgba(125, 211, 252, 0.72);
  }
}

.title {
  margin: 0;
  font-size: clamp(1.2rem, 1.3vw + 0.8rem, 1.75rem);
  font-family: 'Bebas Neue', 'Rajdhani', Impact, sans-serif;
  font-weight: 700;
  color: #ff5f5f;
  letter-spacing: 0.07em;
  line-height: 1.15;
}

.title span {
  color: #ffd45b;
  font-weight: 600;
}

.panel-kicker {
  margin: 0;
  color: #88d9ff;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.subtitle {
  margin: 3px 0 0;
  color: #d1c3b8;
  font-size: 0.86rem;
  text-transform: lowercase;
}

.header-badge {
  color: #ecf9ff;
  border: 2px solid #78d3ff;
  background: #0e3651;
  padding: 6px 12px;
  font-size: 0.76rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  white-space: nowrap;
  text-transform: uppercase;
  box-shadow: 3px 3px 0 #081722;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: linear-gradient(180deg, #12151b, #0c0f14);
  padding: 10px 12px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-divider {
  width: 2px;
  height: 22px;
  background: #313944;
}

.control-checks {
  gap: 12px;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #dfd4cb;
  font-size: 0.88rem;
  user-select: none;
}

.check input {
  margin: 0;
  accent-color: var(--arc);
}

.btn {
  height: 38px;
  border-radius: 0;
  border: 2px solid #2f3843;
  background: linear-gradient(180deg, #222a34, #151a22);
  color: #f2ebe4;
  padding: 0 13px;
  font-size: 0.86rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 3px 3px 0 #0a0c11;
  transition: transform 0.16s ease;
}

.btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #0a0c11;
}

.btn:hover {
  background: linear-gradient(180deg, #283341, #1a202a);
}

.btn-primary {
  border-color: #813239;
  background: linear-gradient(180deg, #a93334, #7c161f);
}

.btn-primary.active {
  background: linear-gradient(180deg, #d33a3f, #981922);
  box-shadow: 3px 3px 0 #0a0c11, 0 0 18px rgba(211, 58, 63, 0.4);
}

.preset-select {
  height: 32px;
  border-radius: 0;
  border: 2px solid #2f3843;
  background: #161c24;
  color: #f2ebe4;
  padding: 0 10px;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #11151b, #0d1016);
}

.panel-input {
  border-color: #49272b;
}

.panel-output {
  border-color: #4b3c22;
}

.panel-label {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: linear-gradient(90deg, rgba(255, 91, 91, 0.2), rgba(255, 184, 77, 0.12));
  border-bottom: 2px solid #2a313a;
}

.label-title {
  color: #f9f1e9;
  font-family: 'Bebas Neue', 'Rajdhani', Impact, sans-serif;
  font-size: 1.05rem;
  letter-spacing: 0.08em;
}

.label-meta {
  margin-left: auto;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.77rem;
  color: #d8c9bc;
}

.live-badge {
  margin-left: 8px;
  padding: 2px 8px 1px;
  border: 2px solid #df6b6c;
  color: #ffd6d6;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(220, 38, 38, 0.24);
}

.editor {
  min-height: 0;
  flex: 1;
  width: 100%;
  border: 0;
  outline: 0;
  resize: none;
  color: #ece3da;
  background: #0c1016;
  padding: 14px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.9rem;
  line-height: 1.65;
}

.editor::placeholder {
  color: #6f6963;
}

.editor:disabled {
  opacity: 0.6;
}

.prose {
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: #0f141b;
  padding: 18px 20px 22px;
  color: #f0e8df;
  font-size: 0.95rem;
  line-height: 1.72;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  margin: 1.15em 0 0.48em;
  line-height: 1.25;
  color: var(--gold-hi);
}

.prose :deep(h1) {
  font-size: 1.55rem;
  border-bottom: 1px solid rgba(252, 211, 77, 0.26);
  padding-bottom: 0.24em;
}

.prose :deep(h2) {
  font-size: 1.22rem;
}

.prose :deep(h3) {
  font-size: 1.05rem;
}

.prose :deep(p) {
  margin: 0.78em 0;
  color: #f0e8df;
}

.prose :deep(strong) {
  color: #fff9ef;
}

.prose :deep(em) {
  color: #d8cec2;
}

.prose :deep(a) {
  color: var(--arc-hi);
  text-underline-offset: 3px;
}

.prose :deep(code) {
  background: #151e28;
  border: 2px solid #2e3d50;
  border-radius: 0;
  padding: 1px 6px;
  color: #ff9999;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.86em;
}

.prose :deep(pre) {
  background: #090e14;
  border: 2px solid #3a2f20;
  border-left: 8px solid var(--gold);
  border-radius: 0;
  padding: 14px 16px;
  overflow: auto;
}

.prose :deep(pre code) {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.prose :deep(th),
.prose :deep(td) {
  border: 2px solid #29303a;
  padding: 8px 10px;
}

.prose :deep(th) {
  background: rgba(217, 119, 6, 0.2);
  color: var(--gold-hi);
  text-align: left;
}

.prose :deep(td) {
  color: var(--text-1);
}

.prose :deep(blockquote) {
  margin: 1em 0;
  border-left: 6px solid var(--arc);
  padding: 0.5em 1em;
  background: rgba(14, 165, 233, 0.15);
  color: #d2e7f4;
}

.app > .header,
.app > .controls,
.panel {
  animation: heavyRise 380ms cubic-bezier(0.19, 1, 0.22, 1) both;
}

.app > .controls {
  animation-delay: 60ms;
}

.panel-input {
  animation-delay: 120ms;
}

.panel-output {
  animation-delay: 170ms;
}

@keyframes heavyRise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.99);
    filter: saturate(0.7);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: saturate(1);
  }
}

.prose :deep(.fade-enter-active) {
  transition: opacity 0.35s ease;
}

.prose :deep(.fade-enter-from) {
  opacity: 0;
}

.prose :deep(.slide-up-enter-active) {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.prose :deep(.slide-up-enter-from) {
  opacity: 0;
  transform: translateY(10px);
}

.prose :deep(.pop-enter-active) {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.prose :deep(.pop-enter-from) {
  opacity: 0;
  transform: scale(0.92);
}

@media (max-width: 980px) {
  .app {
    height: auto;
    min-height: 100vh;
    padding: 12px;
  }

  .header {
    gap: 8px;
    align-items: flex-start;
  }

  .header-badge {
    align-self: center;
  }

  .controls {
    gap: 8px;
  }

  .group-divider {
    display: none;
  }

  .panels {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-badge {
    margin-left: 60px;
  }

  .control-group {
    width: 100%;
    flex-wrap: wrap;
  }

  .brutal-block {
    box-shadow: 4px 4px 0 #0a0c10;
  }
}
</style>
