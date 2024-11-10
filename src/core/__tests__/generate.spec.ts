import { describe, expect, test, vi, afterEach } from 'vitest'
const fs = require('fs')
const path = require('path')
import {toKebabCase, getFiles, findComponentUsages, writeRelationsInFile, updateStorybookFiles} from '../generate'

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
  test('should return files matching the pattern', async () => {
    // Мок файлов и директорий
    (fs.readdir).mockResolvedValue([
      { name: 'Component.vue', isDirectory: () => false },
      { name: 'SubFolder', isDirectory: () => true },
    ]);
    (fs.stat).mockResolvedValue({ isDirectory: () => false });
    (path.resolve).mockImplementation((...args: any[]) => args.join('/'));

    const result = await getFiles('src/components', /\.vue$/);
    expect(result).toEqual(['src/components/Component.vue']);
  });
});

describe('writeRelationsInFile', () => {
  test('should write component relations to JSON file', async () => {
    const mockData = { MyComponent: ['./src/components/MyComponent.vue'] };
    const outputOptions = { path: './output', fileName: 'test.json' };

    await writeRelationsInFile(mockData, outputOptions);

    const expectedPath = './output/test.json';
    expect(fs.mkdir).toHaveBeenCalledWith(outputOptions.path, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, JSON.stringify(mockData, null, 2));
  });
});

describe('findComponentUsages', () => {
  test('should detect component usage in Vue files', async () => {
    const components = ['MyComponent'];
    const options = { baseDir: 'app', searchPath: 'src', showHiddenComponents: true };

    (fs.readFile).mockResolvedValue('<template><MyComponent /></template>');
    (fs.readdir).mockResolvedValue([{ name: 'Test.vue', isDirectory: () => false }]);

    const result = await findComponentUsages(components, options);
    expect(result).toEqual({ MyComponent: ['./src/Test.vue'] });
  });
});

describe('updateStorybookFiles', () => {
  test('should update Storybook files with component usage information', async () => {
    const componentUsages = { MyComponent: ['./src/SomeComponent.vue'] };
    const options = {
      componentsPaths: ['src/components'],
      storyFilesPattern: '\\.stories\\.ts$',
    };

    (fs.readFile).mockResolvedValue('meta.parameters = {};');
    (fs.writeFile).mockResolvedValue();

    await updateStorybookFiles(componentUsages, options);

    expect(fs.writeFile).toHaveBeenCalled();
  });
});
