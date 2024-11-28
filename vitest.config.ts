/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    include: ['src/core/**/*.test.{js,ts}', 'src/core/**/*.spec.{js,ts}'],
    globals: true,
    environment: 'node',
  },
})
