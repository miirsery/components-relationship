#!/usr/bin/env node

import { build } from 'vite'
import { componentRelationshipsPlugin } from '../core/generate'

// Функция для запуска компонента
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