import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { componentRelationshipsPlugin } from 'component-relationships'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    componentRelationshipsPlugin({
      componentsPaths: ['src/components', 'src/shared', 'src/widgets'],
      showHiddenComponents: true,
    }),
  ],
})
