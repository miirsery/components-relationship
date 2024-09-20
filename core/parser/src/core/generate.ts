import { Plugin } from 'vite'
const fs = require('fs')
const path = require('path')

// FIXME: Добавить опцию hideUnused

// Опции по умолчанию
const defaultOptions = {
  componentsPath: 'src/components',
  searchPath: 'src',
  baseDir: 'app',
  storyFilesPattern: '\\.stories\\.ts$',
}

// Плагин для обработки компонентных связей и обновления файлов Storybook
export const componentRelationshipsPlugin = (userOptions = {}): Plugin => {
  const options = { ...defaultOptions, ...userOptions }

  return {
    name: 'vite:component-relationships',

    async buildStart() {
      const componentFiles = await getFiles(options.componentsPath, /\.vue$/)
      const components = componentFiles.map((file) => path.basename(file, path.extname(file)))
      const componentUsages = await findComponentUsages(components, options)
      await updateStorybookFiles(componentUsages, options)
      console.log('Компонентные связи обновлены в Storybook файлах.')
    },
  }
}

// Функция для обновления файлов Storybook
async function updateStorybookFiles(componentUsages: Record<string, string[]>, options: any) {
  for (const component in componentUsages) {
    const usage = componentUsages[component]
    const storyFilePath = path.resolve(options.componentsPath, component, `${component}.stories.ts`)

    console.log('Проверка пути к файлу:', storyFilePath)
    console.log('fs.existsSync(storyFilePath)', fs.existsSync(storyFilePath))

    if (fs.existsSync(storyFilePath)) {
      let content = await fs.promises.readFile(storyFilePath, 'utf-8')

      // Создаем строку использования компонента
      const usageString = `Использования компонента ${component}:\n- ${usage.join('\n- ')}`

      /// Заменяем существующий блок meta.parameters на новый
      content = content.replace(/meta\.parameters\s*=\s*{[\s\S]*?};\s*/, '') // Удаляем старый блок

      // Формируем новые параметры
      const newParameters = `
      meta.parameters = {
        docs: {
          description: {
            component: \`${usageString}\`
          }
        }
      };`

// Добавляем новые параметры в файл
content += newParameters.trim() + '\n' // Добавляем новые параметры

      await fs.promises.writeFile(storyFilePath, content)
      console.log(`Обновлен Storybook файл: ${storyFilePath}`)
    } else {
      console.warn(`Файл не найден: ${storyFilePath}`)
    }
  }
}

// Функция для поиска использования компонентов
async function findComponentUsages(components: string[], options: any) {
  const { baseDir, searchPath } = options
  const componentUsages: Record<string, string[]> = {}

  const paths = await getFiles(searchPath, /\.(vue)$/)

  for (const filePath of paths) {
    const content = await fs.promises.readFile(filePath, 'utf-8')

    for (const component of components) {
      const camelCaseRegex = new RegExp(`<${component}[^>]*>`, 'g')
      const kebabCaseRegex = new RegExp(`<${toKebabCase(component)}[^>]*>`, 'g')

      if (camelCaseRegex.test(content) || kebabCaseRegex.test(content)) {
        if (!componentUsages[component]) {
          componentUsages[component] = []
        }

        let relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/')
        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath
        }

        relativePath = relativePath.replace(/^\.\.\//g, './')
        componentUsages[component].push(relativePath)
      }
    }
  }

  return componentUsages
}

// Функция для преобразования имени компонента в kebab-case
function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// Функция для получения файлов из директории (рекурсивно)
async function getFiles(dir: string, filePattern: RegExp) {
  let files: string[] = []

  const dirents = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      files = files.concat(await getFiles(res, filePattern))
    } else if (filePattern.test(res)) {
      files.push(res)
    }
  }

  return files
}
