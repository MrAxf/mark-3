<script setup lang="ts">
import mermaid from 'mermaid'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

const props = defineProps<{ code?: string }>()

let diagramCount = 0
let renderToken = 0
let renderTimer: ReturnType<typeof setTimeout> | null = null
const lastChangeAt = ref(0)

const diagramCode = computed(() => {
  return props.code?.trim() ?? ''
})

const svg = ref('')
const error = ref('')
const isRendering = ref(false)

function cleanupTimer() {
  if (renderTimer) {
    clearTimeout(renderTimer)
    renderTimer = null
  }
}

onBeforeUnmount(() => {
  cleanupTimer()
})

watch(
  diagramCode,
  (code) => {
    cleanupTimer()
    lastChangeAt.value = Date.now()

    if (!code) {
      svg.value = ''
      error.value = ''
      isRendering.value = false
      return
    }

    isRendering.value = true
    renderTimer = setTimeout(async () => {
      const token = ++renderToken

      // Heuristica: cuando hay cambios muy seguidos, probablemente estamos en stream.
      const isLikelyStreaming = Date.now() - lastChangeAt.value < 260

      if (isLikelyStreaming && !code.includes('\n')) {
        if (token === renderToken) {
          isRendering.value = false
        }
        return
      }

      error.value = ''
      try {
        const id = `mermaid-diagram-${diagramCount++}`
        const { svg: result } = await mermaid.render(id, code)
        if (token === renderToken) {
          svg.value = result
        }
      } catch (e) {
        if (token !== renderToken) {
          return
        }

        // Durante stream evitamos mostrar errores transitorios por sintaxis parcial.
        const stillLikelyStreaming = Date.now() - lastChangeAt.value < 260
        if (stillLikelyStreaming) {
          return
        }

        error.value = String(e)
        svg.value = ''
      } finally {
        if (token === renderToken) {
          isRendering.value = false
        }
      }
    }, 180)
  },
  { immediate: true },
)
</script>

<template>
  <div class="mermaid-wrapper">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="svg" v-html="svg" class="mermaid-diagram" />
    <pre v-else-if="error" class="mermaid-error">{{ error }}</pre>
    <div v-else-if="isRendering" class="mermaid-loading">Esperando bloque Mermaid completo...</div>
    <div v-else class="mermaid-loading">Rendering diagram…</div>
  </div>
</template>

<style scoped>
.mermaid-wrapper {
  margin: 0.9rem 0;
  padding: 1rem;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  display: flex;
  justify-content: center;
}

.mermaid-diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}

.mermaid-error {
  color: var(--danger);
  font-size: 0.82rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.mermaid-loading {
  color: var(--ink-dim);
  font-size: 0.84rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}
</style>
