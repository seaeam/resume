import type { MDXContent } from 'mdx/types'
import type { ChangelogEntry, ChangelogFrontmatter } from './types'

const modules = import.meta.glob('./content/*.mdx', { eager: true }) as Record<
  string,
  { default: MDXContent, frontmatter: ChangelogFrontmatter }
>

export function loadChangelogEntries(): ChangelogEntry[] {
  return Object.values(modules)
    .map(mod => ({
      frontmatter: mod.frontmatter,
      Content: mod.default,
    }))
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
