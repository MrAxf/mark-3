import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__'],
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
