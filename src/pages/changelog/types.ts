import type { MDXContent } from 'mdx/types'

export interface ChangelogFrontmatter {
  title: string
  date: string
  tags?: string[]
  version?: string
}

export interface ChangelogEntry {
  frontmatter: ChangelogFrontmatter
  Content: MDXContent
}
