import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [Vue({ isProduction: true })],
  format: ['esm', 'cjs'],
  dts: {
    vue: true,
  },
  clean: true,
  platform: 'neutral',
  treeshake: true,
  minify: false,
  sourcemap: true,
  deps: {
    neverBundle: ['vue'],
  },
})
