# Changelog Page Design

## Overview

Replicate the [magicuidesign/changelog-template](https://github.com/magicuidesign/changelog-template) timeline layout in `src/pages/changelog`. The page displays product updates in a left-right timeline format with real MDX support for rich content authoring.

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| MDX integration | `@mdx-js/rollup` + remark plugins | Official, well-maintained, direct Vite/Rollup compatibility |
| Content loading | `import.meta.glob` | Built into Vite, eager-loads MDX modules at build time |
| Frontmatter | `remark-frontmatter` + `remark-mdx-frontmatter` | Extracts YAML frontmatter as named `frontmatter` export |
| Prose styling | `@tailwindcss/typography` | Standard `prose` classes for MDX-rendered HTML |
| Header | Not included | Project has its own navigation; only the timeline content area is needed |

## File Structure

```
src/pages/changelog/
  index.tsx                  # Page: loads MDX entries, sorts by date, renders timeline
  components/
    changelog-entry/
      index.tsx              # Single timeline entry (date, version, title, tags, MDX content)
  content/
    2025-04-14.mdx           # Example MDX changelog entry
  types.ts                   # ChangelogEntry type, ChangelogFrontmatter type
  utils.ts                   # formatDate, entry sorting/loading helpers
src/mdx.d.ts                 # TypeScript module declarations for .mdx files
```

> Note: `store.ts`, `const.ts`, and `hooks/` are intentionally omitted — the changelog page is read-only with no interactive state.

## MDX Frontmatter Schema

```yaml
---
title: "Release 2.1 - 新功能发布"
date: "2025-04-14"        # ISO date string, required
tags: ["功能", "性能"]     # optional string[]
version: "2.1"             # optional string
---

Markdown content with **bold**, `code`, images, and React components.
```

## Vite Configuration

Add `@mdx-js/rollup` to `vite.config.ts` with `enforce: 'pre'` (required — `@vitejs/plugin-react` registers sub-plugins with `enforce: 'pre'`, so MDX must also run in pre-phase to transform `.mdx` → JS before React processes it). Also update `react()` to include MDX file extensions for HMR support:

```ts
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    Pages({
      exclude: [
        // ... existing excludes
        '**/content/*',   // ← Add: exclude MDX content from file-based routing
      ],
    }),
  ],
})
```

### CSS Configuration

Add `@tailwindcss/typography` plugin to `src/index.css` (Tailwind v4 uses `@plugin` directives instead of JS config):

```css
@import 'tailwindcss';
@plugin "@tailwindcss/typography";
```

### TypeScript Declarations

Install `@types/mdx` as devDependency. Additionally, create `src/mdx.d.ts` for frontmatter-aware module declarations:

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: Record<string, unknown>
  const MDXComponent: ComponentType
  export default MDXComponent
}
```

## Content Loading

Use `import.meta.glob` to eagerly load all `.mdx` files from the `content/` directory:

```ts
const modules = import.meta.glob('./content/*.mdx', { eager: true })

// Each module exports:
// - default: React component (the rendered MDX)
// - frontmatter: { title, date, tags?, version? }
```

Sort entries by `frontmatter.date` descending (newest first).

## Layout Design

### Container

```
max-w-5xl mx-auto px-6 lg:px-10 pt-10 pb-20
```

### Timeline Entry (Desktop: md+)

```
┌─────────────────────────────────────────────────────┐
│  [flex-row]                                         │
│                                                     │
│  ┌──────────┐  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │ Left     │  │ Right                           │  │
│  │ md:w-48  │  │ flex-1 md:pl-8                  │  │
│  │          │  │                                  │  │
│  │ date     │  │ ● ─── vertical line (w-px)      │  │
│  │ (sticky) │  │ │                                │  │
│  │          │  │ │  Title (h2)                    │  │
│  │ v2.1     │  │ │  [tag] [tag]                   │  │
│  │ (badge)  │  │ │                                │  │
│  │          │  │ │  Prose content from MDX...      │  │
│  │          │  │ │                                │  │
│  └──────────┘  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Left: `md:w-48 flex-shrink-0`, date text with `sticky top-10`
- Version: Badge component with `rounded-full` styling
- Timeline dot: `size-3 bg-primary rounded-full`, absolutely positioned at top of right column
- Timeline line: `w-px bg-border` vertical line, full height of entry
- Content: `prose dark:prose-invert` for MDX output

### Timeline Entry (Mobile: < md)

```
┌───────────────────────┐
│  [flex-col]           │
│                       │
│  Apr 14, 2025         │
│  v2.1                 │
│                       │
│  Title (h2)           │
│  [tag] [tag]          │
│                       │
│  Prose content...     │
│                       │
└───────────────────────┘
```

- Vertical timeline line and dot hidden on mobile
- Date and version stack above content
- Full-width layout

### Styling Details

| Element | Classes |
|---|---|
| Date text | `text-sm text-muted-foreground font-medium` |
| Version badge | `text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium` |
| Title | `text-xl font-semibold` |
| Tag badge | `text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground` |
| Timeline dot | `size-3 rounded-full bg-primary` |
| Timeline line | `w-px bg-border` |
| Entry separator | `pb-16` (spacing between entries) |

## TypeScript Types

```ts
interface ChangelogFrontmatter {
  title: string
  date: string
  tags?: string[]
  version?: string
}

interface ChangelogEntry {
  frontmatter: ChangelogFrontmatter
  Content: React.ComponentType
}
```

## Dependencies to Install

**Production:**
- `@mdx-js/rollup` — MDX Rollup plugin
- `remark-frontmatter` — Parse YAML frontmatter in MDX
- `remark-mdx-frontmatter` — Export frontmatter as named export
- `@tailwindcss/typography` — Prose styling for MDX content

**Dev:**
- `@types/mdx` — TypeScript declarations for `.mdx` modules

> Note: `@mdx-js/react` is NOT needed — MDX components are rendered directly via `import.meta.glob`, no `MDXProvider` required.

## Out of Scope

- Header / navigation (project already has its own)
- Fumadocs or any Next.js tooling
- RSS feed generation
- Search / filtering by tags (can be added later)
- Pagination (not needed until many entries)
