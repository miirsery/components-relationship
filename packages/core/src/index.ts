import { PluginOption } from 'vite'

import path from 'path'
import fs from 'fs'

import { ComponentRelationsType } from './types'

const defaultOptions: ComponentRelationsType = {
  componentsPaths: ['src/components'],
  searchPath: 'src',
  baseDir: 'app',
  storyFilesPattern: '\\.stories\\.ts$',
  output: {
    path: './',
    fileName: 'component-usage.json',
  },
  showHiddenComponents: true,
}

// Плагин для обработки компонентных связей и обновления файлов Storybook
export const componentRelationshipsPlugin = (relationOptions?: ComponentRelationsType): PluginOption => {
  const options = { ...defaultOptions, ...relationOptions }

  return {
    name: 'vite:component-relationships',

    async buildStart() {
      const componentFiles = await Promise.all(
        options.componentsPaths!.map(async (componentPath) => {
          return getFiles(componentPath as string, /\.vue$/)
        })
      )
      const flatComponentFiles = componentFiles.flat()
      const components = flatComponentFiles.map((file) => path.basename(file, path.extname(file)))
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
  outputOptions: { path: string; fileName: string }
) {
  const jsonString = JSON.stringify(componentUsages, null, 2)

  const outputPath = path.resolve(outputOptions.path, outputOptions.fileName)

  await fs.promises.mkdir(outputOptions.path, { recursive: true })

  try {
    await fs.promises.writeFile(outputPath, jsonString)
    console.log(`[✅] Компонентные связи сохранены в ${outputPath}`)
  } catch (err: any) {
    console.error(`[❌] Ошибка записи в файл: ${err.message}`)
  }
}

// Функция для обновления файлов Storybook
export async function updateStorybookFiles(componentUsages: Record<string, string[]>, options: ComponentRelationsType) {
  const storyFilesPattern = new RegExp(options.storyFilesPattern!)

  const allComponents = await Promise.all(
    options.componentsPaths!.map(async (componentPath) => {
      return getFiles(componentPath as string, /\.vue$/)
    })
  )
  const flatComponentFiles = allComponents.flat()
  const allComponentNames = flatComponentFiles.map((file) => path.basename(file, path.extname(file)))

  for (const component of allComponentNames) {
    const usage = componentUsages[component] || []
    let storyFiles: string[] = []

    for (const componentPath of options.componentsPaths!) {
      const componentDir = path.resolve(componentPath, component)
      const foundFiles = await getFiles(componentDir, storyFilesPattern)
      storyFiles = storyFiles.concat(foundFiles)
    }

    if (storyFiles.length === 0) {
      continue
    }

    for (const storyFilePath of storyFiles) {
      console.log(`[🔍] Проверка пути к файлу: ${storyFilePath}`)

      if (fs.existsSync(storyFilePath)) {
        let content = await fs.promises.readFile(storyFilePath, 'utf-8')
        const metaParametersRegex = /meta\.parameters\s*=\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}?\s*/gs

        // Если компонент используется, обновляем или добавляем meta.parameters
        if (usage.length > 0) {
          const usageString = `Использования компонента ${component}:\n- ${usage.join('\n- ')}`
          const newParameters = `meta.parameters = {
  docs: {
    description: {
      component: \`${usageString}\`
    }
  }
}`
          if (content.match(metaParametersRegex)) {
            content = content.replace(metaParametersRegex, newParameters)
          } else {
            content += `\n${newParameters}\n`
          }
          console.log(`[✅] Обновлен Storybook файл: ${storyFilePath}`)
        } else {
          // Если компонент больше не используется, удаляем meta.parameters
          if (content.match(metaParametersRegex)) {
            content = content.replace(metaParametersRegex, '')
            console.log(`[🗑️] Удален meta.parameters из файла: ${storyFilePath}`)
          }
        }

        await fs.promises.writeFile(storyFilePath, content)
      } else {
        console.warn(`[⚠️] Файл не найден: ${storyFilePath}`)
      }
    }
  }
}

// Функция для поиска использования компонентов
export async function findComponentUsages(components: string[], options: ComponentRelationsType) {
  const { baseDir, searchPath, showHiddenComponents } = options
  const componentUsages: Record<string, string[]> = {}

  const paths = await getFiles(searchPath as string, /\.(vue)$/)

  for (const filePath of paths) {
    const content = await fs.promises.readFile(filePath, 'utf-8')

    const comments = content.match(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/.*/g) || []
    const commentsCombined = comments.join('\n')

    const asyncComponentRegex = /defineAsyncComponent\(\s*\{\s*loader:\s*\(\)\s*=>\s*import\(['"](.+?)['"]\)/g
    let asyncComponentMatch

    const asyncComponents: string[] = []

    while ((asyncComponentMatch = asyncComponentRegex.exec(content)) !== null) {
      const importPath = asyncComponentMatch[1]
      const componentName = toPascalCase(path.basename(importPath, path.extname(importPath)))
      asyncComponents.push(componentName)
    }

    for (const component of components) {
      const camelCaseRegex = new RegExp(`<${component}[^>]*>`, 'g')
      const kebabCaseRegex = new RegExp(`<${toKebabCase(component)}[^>]*>`, 'g')

      const isComponentInContent =
        camelCaseRegex.test(content) || kebabCaseRegex.test(content) || asyncComponents.includes(component)

      let isComponentUsed = false

      if (isComponentInContent) {
        if (showHiddenComponents) {
          isComponentUsed = true
        } else {
          const isInComments =
            commentsCombined.includes(`<${component}`) || commentsCombined.includes(`<${toKebabCase(component)}`)

          isComponentUsed = !isInComments
        }
      }

      if (isComponentUsed) {
        if (!componentUsages[component]) {
          componentUsages[component] = []
        }

        let relativePath = path.relative(baseDir!, filePath).replace(/\\/g, '/')

        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath
        }

        relativePath = relativePath.replace(/^\.\.\//g, './')

        if (!componentUsages[component].includes(relativePath)) {
          componentUsages[component].push(relativePath)
        }
      }
    }
  }

  return componentUsages
}

// Функция для преобразования имени компонента в kebab-case
export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// Функция для преобразования имени компонента в PascalCase
export function toPascalCase(str: string) {
  return str.replace(/(^\w|-\w)/g, (match) => match.replace(/-/, '').toUpperCase())
}

export async function getFiles(dir: string, filePattern: RegExp) {
  let files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const dirs = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const dirent of dirs) {
    const res = path.resolve(dir, dirent.name)

    if (dirent.isDirectory()) {
      files = files.concat(await getFiles(res, filePattern))
    } else if (filePattern.test(res)) {
      files.push(res)
    }
  }

  return files
}
