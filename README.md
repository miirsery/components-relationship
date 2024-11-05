# Components Relationship

Отображает связи компонентов

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
    componentRelationshipsPlugin(),
  ],
})
```
