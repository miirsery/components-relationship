export type ComponentsRelationsOutputType = {
  path: string
  fileName: string
}

export type ComponentRelationsType = {
  componentsPath?: string[]
  searchPath?: string
  baseDir?: string
  storyFilesPattern?: string
  output?: ComponentsRelationsOutputType
}
