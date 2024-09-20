import { Plugin } from 'vite'
const fs = require('fs')
const path = require('path')

// Опции по умолчанию
const defaultOptions = {
  componentsPath: 'src/components', // Путь к папке компонентов
  searchPath: 'src', // Путь к папке, где необходимо искать использования компонентов
  baseDir: 'app' // Папка, относительно которой нужно строить путь
}

export const componentRelationshipsPlugin = (userOptions = {}): Plugin => {
  const options = { ...defaultOptions, ...userOptions } // Объединение дефолтных и пользовательских опций

  return {
    name: 'vite:component-relationships',

    async buildStart() {
      // Найти все компоненты
      const componentFiles = await getFiles(options.componentsPath, /\.vue$/)
      const components = componentFiles.map((file) => path.basename(file, path.extname(file)))

      // Найти использования компонентов
      const componentUsages = await findComponentUsages(components, options)

      // Преобразовать в строку JSON
      const jsonString = JSON.stringify(componentUsages, null, 2)

      // Сохранить результат в файл
      await fs.promises.writeFile('component-usage.json', jsonString)

      console.log('Компонентные связи сохранены в component-usage.json')
    },
  }
}

// Функция для поиска использования компонентов
async function findComponentUsages(components: string[], options: any) {
  const { baseDir, searchPath } = options
  const componentUsages: Record<string, string[]> = {}

  // Получить все файлы для сканирования
  const paths = await getFiles(searchPath, /\.(vue)$/)

  for (const filePath of paths) {
    const content = await fs.promises.readFile(filePath, 'utf-8')

    // Проверка использования каждого компонента
    for (const component of components) {
      // Создать регулярные выражения для поиска в CamelCase и kebab-case
      const camelCaseRegex = new RegExp(`<${component}[^>]*>`, 'g')
      const kebabCaseRegex = new RegExp(`<${toKebabCase(component)}[^>]*>`, 'g')

      if (camelCaseRegex.test(content) || kebabCaseRegex.test(content)) {
        if (!componentUsages[component]) {
          componentUsages[component] = []
        }

        // Генерация относительного пути с корректной заменой слэшей и убиранием лишних ../
        let relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/')

        // Убедиться, что путь начинается с './'
        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath
        }

        // Убираем лишние '../' из пути
        relativePath = relativePath.replace(/^\.\.\//g, './')

        componentUsages[component].push(relativePath)
      }
    }
  }

  return componentUsages
}

// Функция для преобразования имени компонента в kebab-case
function toKebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
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
