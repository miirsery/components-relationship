import { PluginOption } from 'vite'
import { ComponentRelationsType } from './types'
const fs = require('fs')
const path = require('path')

// Опции по умолчанию
const defaultOptions: ComponentRelationsType = {
  componentsPath: 'src/components',
  searchPath: 'src',
  baseDir: 'app',
  storyFilesPattern: '\\.stories\\.ts$',
  output: {
    path: './',
    fileName: 'component-usage.json',
  }
}

// Плагин для обработки компонентных связей и обновления файлов Storybook
export const componentRelationshipsPlugin = (relationOptions?: ComponentRelationsType): PluginOption => {
  const options = { ...defaultOptions, ...relationOptions }

  return {
    name: 'vite:component-relationships',

    async buildStart() {
      const componentFiles = await getFiles(options.componentsPath as string, /\.vue$/)
      const components = componentFiles.map((file) => path.basename(file, path.extname(file)))
      const componentUsages = await findComponentUsages(components, options)

      await updateStorybookFiles(componentUsages, options)

      console.log('[✅] Компонентные связи успешно обновлены в Storybook файлах.')

      if (options?.output && typeof options.output === 'object') {
        await writeRelationsInFile(componentUsages, options.output)
      }
      
    },
  }
}

export async function writeRelationsInFile(
  componentUsages: Record<string, string[]>,
  outputOptions: { path: string, fileName: string }
) {
  // Преобразовать в строку JSON
  const jsonString = JSON.stringify(componentUsages, null, 2)

  // Построить полный путь к файлу
  const outputPath = path.resolve(outputOptions.path, outputOptions.fileName)

  // Убедиться, что директория существует, если нет — создать
  await fs.promises.mkdir(outputOptions.path, { recursive: true })

  // Сохранить результат в файл
  await fs.promises.writeFile(outputPath, jsonString)

  console.log(`[✅] Компонентные связи сохранены в ${outputPath}`)
}

// Функция для обновления файлов Storybook
export async function updateStorybookFiles(componentUsages: Record<string, string[]>, options: ComponentRelationsType) {
  for (const component in componentUsages) {
    const usage = componentUsages[component]
    const storyFilePath = path.resolve(options.componentsPath, component, `${component}.stories.ts`)

    console.log(`[🔍] Проверка пути к файлу: ${storyFilePath}`)
    
    if (fs.existsSync(storyFilePath)) {
      let content = await fs.promises.readFile(storyFilePath, 'utf-8')

      // Создаем строку использования компонента
      const usageString = `Использования компонента ${component}:\n- ${usage.join('\n- ')}`

      // Заменяем существующий блок meta.parameters на новый
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
      content += newParameters.trim() + '\n'

      await fs.promises.writeFile(storyFilePath, content)
      console.log(`[✅] Обновлен Storybook файл: ${storyFilePath}`)
    } else {
      console.warn(`[⚠️] Файл не найден: ${storyFilePath}`)
    }
  }
}

// Функция для поиска использования компонентов
export async function findComponentUsages(components: string[], options: ComponentRelationsType) {
  const { baseDir, searchPath } = options
  const componentUsages: Record<string, string[]> = {}

  const paths = await getFiles(searchPath as string, /\.(vue)$/)

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
export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// Функция для получения файлов из директории (рекурсивно)
export async function getFiles(dir: string, filePattern: RegExp) {
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
