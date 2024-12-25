#!/usr/bin/env node

import { componentRelationshipsPlugin } from '../dist/index.mjs'

import { build } from 'vite'

;(async () => {
  try {
    await build({
      plugins: [componentRelationshipsPlugin()],
    })
    console.log('[✅] Компонентные связи успешно обновлены.')
  } catch (error) {
    console.error('Ошибка обновления компонентных связей:', error)
    process.exit(1)
  }
})()
