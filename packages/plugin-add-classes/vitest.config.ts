import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      include: ['src/**/*.ts'],
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
