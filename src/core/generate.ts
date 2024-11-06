import { PluginOption } from 'vite'
import { ComponentRelationsType } from './types'
const fs = require('fs')
const path = require('path')

// Опции по умолчанию
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
      const componentFiles = await Promise.all(options.componentsPaths!.map(async (componentPath) => {
        return getFiles(componentPath as string, /\.vue$/)
      }))
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
  outputOptions: { path: string, fileName: string }
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
export async function updateStorybookFiles(
  componentUsages: Record<string, string[]>,
  options: ComponentRelationsType
) {
  const storyFilesPattern = new RegExp(options.storyFilesPattern!);

  for (const component in componentUsages) {
    const usage = componentUsages[component];
    let storyFiles: string[] = [];

    // Проходим по каждому пути из componentsPaths и ищем Storybook файлы
    for (const componentPath of options.componentsPaths!) {
      const componentDir = path.resolve(componentPath, component);
      const foundFiles = await getFiles(componentDir, storyFilesPattern);

      if (foundFiles.length > 0) {
        storyFiles = storyFiles.concat(foundFiles);
      }
    }

    if (storyFiles.length === 0) {
      continue;
    }

    // Обновляем каждый найденный Storybook файл
    for (const storyFilePath of storyFiles) {
      if (fs.existsSync(storyFilePath)) {
        let content = await fs.promises.readFile(storyFilePath, 'utf-8');

        const usageString = `Использования компонента ${component}:\n- ${usage.join('\n- ')}`;

        const newParameters = `meta.parameters = {
  docs: {
    description: {
      component: \`${usageString}\`
    }
  }
};`;

        const metaParametersRegex = /meta\.parameters\s*=\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*};?\s*/gs;

        if (content.match(metaParametersRegex)) {
          content = content.replace(metaParametersRegex, newParameters);
        } else {
          content += `\n${newParameters}\n`;
        }

        await fs.promises.writeFile(storyFilePath, content);
        console.log(`[✅] Обновлен Storybook файл: ${storyFilePath}`);
      }
    }
  }
}

// Функция для поиска использования компонентов
export async function findComponentUsages(
  components: string[],
  options: ComponentRelationsType
) {
  const { baseDir, searchPath, showHiddenComponents } = options;
  const componentUsages: Record<string, string[]> = {};

  // Получаем все файлы для анализа
  const paths = await getFiles(searchPath as string, /\.(vue)$/);

  for (const filePath of paths) {
    const content = await fs.promises.readFile(filePath, 'utf-8');

    // Находим все закомментированные фрагменты (однострочные и многострочные)
    const comments = content.match(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/.*/g) || [];

    // Объединяем все комментарии в одну строку для упрощения поиска
    const commentsCombined = comments.join('\n');

    for (const component of components) {
      const camelCaseRegex = new RegExp(`<${component}[^>]*>`, 'g');
      const kebabCaseRegex = new RegExp(`<${toKebabCase(component)}[^>]*>`, 'g');

      // Проверка, используется ли компонент в файле
      const isComponentInContent = camelCaseRegex.test(content) || kebabCaseRegex.test(content);

      let isComponentUsed = false;

      if (isComponentInContent) {
        if (showHiddenComponents) {
          // Если опция showHiddenComponents = true, включаем компонент в любом случае
          isComponentUsed = true;
        } else {
          // Если showHiddenComponents = false, исключаем компоненты в комментариях
          const isInComments = commentsCombined.includes(`<${component}`) || commentsCombined.includes(`<${toKebabCase(component)}`);
          isComponentUsed = !isInComments;
        }
      }

      if (isComponentUsed) {
        if (!componentUsages[component]) {
          componentUsages[component] = [];
        }

        // Преобразуем путь к относительному
        let relativePath = path.relative(baseDir!, filePath).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath;
        }
        relativePath = relativePath.replace(/^\.\.\//g, './');

        // Добавляем путь, если он еще не записан
        if (!componentUsages[component].includes(relativePath)) {
          componentUsages[component].push(relativePath);
        }
      }
    }
  }

  return componentUsages;
}

// Функция для преобразования имени компонента в kebab-case
export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export async function getFiles(dir: string, filePattern: RegExp) {
  let files: string[] = []

  // Проверка существования директории
  if (!fs.existsSync(dir)) {
    return files;
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
