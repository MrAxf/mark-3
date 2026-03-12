import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [Vue({ isProduction: true })],
  format: ['esm', 'cjs'],
  dts: {
    tsconfig: 'tsconfig.app.json',
    vue: true,
  },
  clean: true,
  platform: 'neutral',
  treeshake: true,
  minify: true,
  sourcemap: false,
  deps: {
    neverBundle: ['vue'],
  },
})
