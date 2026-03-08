<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <h2 class="custom-heading">
    <span class="accent" aria-hidden="true">▣</span>
    <slot />
  </h2>
</template>

<style scoped>
.custom-heading {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: #ffd05b;
  font-size: inherit;
  margin: 1em 0 0.5em;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.35);
}

.accent {
  color: #ff6f6f;
  font-size: 0.68em;
  opacity: 1;
  user-select: none;
  text-shadow: 0 0 10px rgba(205, 40, 40, 0.5);
  flex-shrink: 0;
}
</style>
