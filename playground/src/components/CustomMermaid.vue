<script setup lang="ts">
import mermaid from "mermaid";
import { computed, ref, watch } from "vue";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

const props = defineProps<{ code?: string }>();

let diagramCount = 0;

const diagramCode = computed(() => {
  return props.code?.trim() ?? "";
});

const svg = ref("");
const error = ref("");

watch(
  diagramCode,
  async (code) => {
    if (!code) return;
    error.value = "";
    try {
      const id = `mermaid-diagram-${diagramCount++}`;
      const { svg: result } = await mermaid.render(id, code);
      svg.value = result;
    } catch (e) {
      error.value = String(e);
      svg.value = "";
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="mermaid-wrapper">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="svg" v-html="svg" class="mermaid-diagram" />
    <pre v-else-if="error" class="mermaid-error">{{ error }}</pre>
    <div v-else class="mermaid-loading">Rendering diagram…</div>
  </div>
</template>

<style scoped>
.mermaid-wrapper {
  margin: 1rem 0;
  padding: 1.2rem;
  background: #0a1017;
  border: 2px solid #44302f;
  border-left: 8px solid var(--crimson);
  border-radius: 0;
  display: flex;
  justify-content: center;
  box-shadow: 4px 4px 0 #090b0f;
}

.mermaid-diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}

.mermaid-error {
  color: #ff6f6f;
  font-size: 0.82rem;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.mermaid-loading {
  color: #d6c8bc;
  font-size: 0.84rem;
  font-family: "Rajdhani", "Segoe UI", sans-serif;
}
</style>
