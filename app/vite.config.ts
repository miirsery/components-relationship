import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { componentRelationshipsPlugin } from 'typed-icon-template'
import { componentRelationshipsPlugin } from '../core/parser'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), componentRelationshipsPlugin()],
})
