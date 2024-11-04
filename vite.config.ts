import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
    nodePolyfills(),
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: 'bin/index.js',
    //       dest: 'bin/index.js'
    //     }
    //   ]
    // })
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ComponentsRelationships',
      fileName: 'component-relationships',
      formats: ['es', 'cjs', 'umd', 'iife'],
    },
    outDir: 'dist'
  },
})
