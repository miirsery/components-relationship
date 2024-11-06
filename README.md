# Components Relationship

## Плагин для анализа компонентных связей в Vite

Этот плагин автоматически обнаруживает и обновляет связи компонентов для файлов Storybook в проекте на Vite.
Он идентифицирует использование компонентов в `.vue` файлах, обновляет соответствующие Storybook `.stories.ts` файлы
с информацией об использовании и создает JSON файл со списком зависимостей компонентов.

## Установка

```bash
# NPM
npm i component-relationships

# YARN
yarn add component-relationships

# PNPM
pnpm add component-relationships
```

## Использование

- Конфигурация в файле **vite.config.ts**

```ts
import { componentRelationshipsPlugin } from 'component-relationships'

import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    componentRelationshipsPlugin({
      componentsPaths: ['src/shared', 'src/components'],
      showHiddenComponents: false,
    }),
  ],
})
```

## API
| Параметр               | Тип                                  | По умолчанию                                       | Описание                                                                                                                                                          |
|------------------------|--------------------------------------|----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `componentsPath`       | `string[]`                           | `['src/components']`                               | Массив директорий для поиска компонентов.                                                                                                                         |
| `searchPath`           | `string`                             | `'src'`                                            | Директория для поиска использования компонентов.                                                                                                                  |
| `baseDir`              | `string`                             | `'app'`                                            | Базовая директория для преобразования путей в JSON файле.                                                                                                         |
| `storyFilesPattern`    | `string`                             | `'\\.stories\\.ts$'`                               | Регулярное выражение для определения Storybook файлов, которые нужно обновить с информацией об использовании компонентов.                                         |
| `output`               | `{ path: string, fileName: string }` | `{ path: './', fileName: 'component-usage.json' }` | Путь и имя файла для сохранения JSON файла с данными об использовании компонентов.                                                                                |
| `showHiddenComponents` | `boolean`                            | `true`                                             | Если `true`, показывает все связи компонентов, включая те, которые находятся в комментариях. Если `false`, исключает компоненты, найденные только в комментариях. |
