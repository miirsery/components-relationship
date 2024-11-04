import { describe, expect, test, vi, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { toKebabCase, getFiles, findComponentUsages } from '../generate'

// Mock fs and path modules
vi.mock('fs')
vi.mock('path')

// Сброс моков после каждого теста
afterEach(() => {
  vi.clearAllMocks()
})

describe('toKebabCase', () => {
  test('converts camelCase to kebab-case', () => {
    expect(toKebabCase('camelCase')).toBe('camel-case')
  })

  test('converts PascalCase to kebab-case', () => {
    expect(toKebabCase('PascalCase')).toBe('pascal-case')
  })
})

describe('getFiles', () => {
  test('returns files matching the pattern', async () => {
    const mockFiles = [
      { name: 'file1.vue', isDirectory: () => false },
      { name: 'file2.vue', isDirectory: () => false },
      { name: 'dir', isDirectory: () => true }
    ]
    const mockDirents = {
      readdir: vi.fn().mockResolvedValue(mockFiles),
      resolve: vi.fn((...args) => args.join('/'))
    }
    fs.promises.readdir = mockDirents.readdir
    path.resolve = mockDirents.resolve

    const files = await getFiles('src', /\.vue$/)
    expect(files).toEqual(['src/file1.vue', 'src/file2.vue'])
  })
})

describe('findComponentUsages', () => {
  test('finds component usages in files', async () => {
    const mockFiles = [
      'src/components/App.vue',
      'src/components/HelloWorld.vue'
    ]
    const mockFileContent: Record<string, string> = {
      'src/components/App.vue': '<template><HelloWorld /></template>',
      'src/components/HelloWorld.vue': '<template><div>Hello World</div></template>'
    }
    const mockFs = {
      readFile: vi.fn((filePath) => Promise.resolve(mockFileContent[filePath])),
      readdir: vi.fn().mockResolvedValue(mockFiles.map(file => ({ name: file, isDirectory: () => false }))),
      resolve: vi.fn((...args) => args.join('/'))
    }
    // @ts-ignore
    fs.promises.readFile = mockFs.readFile
    fs.promises.readdir = mockFs.readdir
    path.resolve = mockFs.resolve

    const components = ['HelloWorld']
    const options = { baseDir: 'src/components', searchPath: 'src/components' }
    const usages = await findComponentUsages(components, options)
    expect(usages).toEqual({
      HelloWorld: ['./App.vue']
    })
  })
})