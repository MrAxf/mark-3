import Vue from 'unplugin-vue/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [Vue()],
  test: {
    environment: 'happy-dom',
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/__tests__'],
    },
    alias: [
      {
        find: /^@\/(.*)$/,
        replacement: '/src/$1',
      },
      {
        find: /^@tests\/(.*)$/,
        replacement: '/src/__tests__/$1',
      },
    ],
  },
})
