#!/usr/bin/env node

const { build } = require('vite')
const { componentRelationshipsPlugin } = require('../src/component-relationships-plugin')

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