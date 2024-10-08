# Typed Icon Component

Генерирует типы для компонента иконки. Создает файл типов в указанном месте.

## Установка

```bash
# NPM
npm i component-relationships -D

# YARN
yarn add component-relationships -D

# PNPM
pnpm add component-relationships -D
```

## Использование

- Конфигурация в файле **vite.config.ts**

```ts
import { typedIconPlugin } from 'component-relationships'
import path from 'path'

export default defineConfig({
  plugins: [
    typedIconPlugin({
      iconsPath: path.join(process.cwd(), 'src', 'icons'),
      iconComponentPath: path.resolve(process.cwd(), 'src', 'IconTemplate'),
    }),
  ],
})
```

## API

| Метод           | Параметры                                            | Описание                                   |
| --------------- | ---------------------------------------------------- | ------------------------------------------ |
| typedIconPlugin | options                                              | Плагин для создания типизированных иконок. |
|                 | - iconsPath: string                                  | Путь до svg спрайтов.                      |
|                 | - iconComponentPath: string                          | Путь до компонента.                        |
|                 | - fileName?: string (default: `icon-names.types.ts`) | Имя файла.                                 |

## TODO:

- [x] Описать документацию функций
- [x] Добавить возможность прокидывать папку, например, `types` и если её нет, то создавать её
- [ ] Добавить тесты
- [ ] Добавить CI/CD
