export type ComponentsRelationsOutputType = {
  path: string
  fileName: string
}

export type ComponentRelationsType = {
  componentsPaths?: string[]
  searchPath?: string
  baseDir?: string
  storyFilesPattern?: string
  showHiddenComponents?: boolean
  output?: ComponentsRelationsOutputType
}
