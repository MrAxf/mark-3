import Vue from 'unplugin-vue/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [Vue()],
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/__tests__', 'src/env.d.ts', 'src/types.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
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
