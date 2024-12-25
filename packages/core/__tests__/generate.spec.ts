import { describe, it, expect, vi, beforeEach } from 'vitest'
const fs = require('fs')
const path = require('path')
import { findComponentUsages, updateStorybookFiles, writeRelationsInFile, getFiles } from '../generate'

describe('componentRelationshipsPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should write relations in the output file', async () => {
    // @ts-ignore
    const mkdirSpy = vi.spyOn(fs.promises, 'mkdir').mockImplementation(async () => {})
    const writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockImplementation(async () => {})

    const mockComponentUsages = {
      Button: ['./src/components/Button.vue'],
      Card: ['./src/components/Card.vue'],
    }

    const outputOptions = {
      path: './output',
      fileName: 'component-usage.json',
    }

    const resolvedPath = path.resolve(outputOptions.path, outputOptions.fileName)

    await writeRelationsInFile(mockComponentUsages, outputOptions)

    expect(mkdirSpy).toHaveBeenCalledTimes(1)
    expect(mkdirSpy).toHaveBeenCalledWith('./output', { recursive: true })

    expect(writeFileSpy).toHaveBeenCalledTimes(1)
    expect(writeFileSpy).toHaveBeenCalledWith(resolvedPath, JSON.stringify(mockComponentUsages, null, 2))

    mkdirSpy.mockRestore()
    writeFileSpy.mockRestore()
  })

  it('should correctly find component usages in files', async () => {
    // Mock data for components and their usage
    const components = ['Button', 'Card']
    const mockFiles = ['./src/views/Home.vue', './src/components/Button.vue']
    const mockFileContents = {
      './src/views/Home.vue': '<Button />',
      './src/components/Button.vue': '<Card />',
    }

    // Mock the fs.promises.readFile function to return mock file contents
    vi.spyOn(fs.promises, 'readFile').mockImplementation(async (filePath: string) => {
      return mockFileContents[filePath]
    })

    // Mock getFiles to return mock files
    vi.spyOn(fs.promises, 'readdir').mockImplementation(async () => {
      return mockFiles
    })

    const componentUsages = await findComponentUsages(components, {
      baseDir: 'app',
      searchPath: 'src',
      componentsPaths: ['src/components'],
      storyFilesPattern: '\\.stories\\.ts$',
      output: {
        path: './',
        fileName: 'component-usage.json',
      },
      showHiddenComponents: true,
    })

    expect(componentUsages['Button']).toContain('./src/views/Home.vue')
    expect(componentUsages['Card']).toContain('./src/components/Button.vue')
  })

  it('should update Storybook files with component usages', async () => {
    const mockComponentUsages = {
      Button: ['./src/components/Button.vue'],
      Card: ['./src/components/Card.vue'],
    }

    const mockStoryFilePath = './src/components/Button.stories.ts'
    const mockStoryFileContent = `
      import { Button } from './Button.vue';
      export default {
        title: 'Button'
      };
    `

    vi.spyOn(fs.promises, 'readFile').mockImplementation(async () => mockStoryFileContent)
    vi.spyOn(fs.promises, 'writeFile').mockImplementation(async () => {})

    // Mock fs.existsSync to always return true
    vi.spyOn(fs, 'existsSync').mockImplementation(() => true)

    await updateStorybookFiles(mockComponentUsages, {
      componentsPaths: ['src/components'],
      baseDir: 'app',
      searchPath: 'src',
      storyFilesPattern: '\\.stories\\.ts$',
      output: {
        path: './',
        fileName: 'component-usage.json',
      },
      showHiddenComponents: true,
    })

    // Check if writeFile was called
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1)

    // Check that the content has been updated with the correct meta.parameters
    const updatedContent = `
      import { Button } from './Button.vue';
      export default {
        title: 'Button',
        parameters: {
          docs: {
            description: {
              component: 'Использования компонента Button:\n- ./src/components/Button.vue'
            }
          }
        }
      };
    `

    expect(fs.promises.writeFile).toHaveBeenCalledWith(mockStoryFilePath, updatedContent)
  })

  it('should handle missing Storybook files gracefully', async () => {
    const mockComponentUsages = {
      Button: ['./src/components/Button.vue'],
    }

    // Mock fs.existsSync to always return false
    vi.spyOn(fs, 'existsSync').mockImplementation(() => false)

    const result = await updateStorybookFiles(mockComponentUsages, {
      componentsPaths: ['src/components'],
      baseDir: 'app',
      searchPath: 'src',
      storyFilesPattern: '\\.stories\\.ts$',
      output: {
        path: './',
        fileName: 'component-usage.json',
      },
      showHiddenComponents: true,
    })

    // The function should not throw an error even if the story file doesn't exist
    expect(result).toBeUndefined()
  })

  it('should return an empty array when no files match the pattern', async () => {
    // Mock getFiles to return an empty array
    vi.spyOn(fs.promises, 'readdir').mockImplementation(async () => [])

    const files = await getFiles('./src/components', /\.vue$/)

    expect(files).toHaveLength(0)
  })
})
