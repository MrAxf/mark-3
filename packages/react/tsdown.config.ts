import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    tsconfig: 'tsconfig.app.json',
  },
  clean: true,
  platform: 'neutral',
  treeshake: true,
  minify: true,
  sourcemap: false,
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
})
