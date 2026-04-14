# Changelog 页面实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 为项目添加一个基于 MDX 的 Changelog 时间轴页面，复刻 magicuidesign/changelog-template 的布局风格。

**架构：** 使用 `@mdx-js/rollup` 集成 MDX 到 Vite 构建中，通过 `import.meta.glob` 批量加载 `.mdx` 文件，在 `src/pages/changelog` 下实现左右分栏的时间轴布局组件。

**技术栈：** `@mdx-js/rollup` + `remark-frontmatter` + `remark-mdx-frontmatter` + `@tailwindcss/typography` + TailwindCSS v4

---

## 文件清单

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 修改 | `package.json` | 添加 MDX 和 typography 依赖 |
| 修改 | `vite.config.ts` | 注册 MDX 插件（`enforce: 'pre'`）、更新 react include、Pages exclude |
| 修改 | `src/index.css` | 添加 `@plugin "@tailwindcss/typography"` |
| 新建 | `src/mdx.d.ts` | `.mdx` 模块的 TypeScript 声明 |
| 新建 | `src/pages/changelog/types.ts` | `ChangelogFrontmatter` 和 `ChangelogEntry` 类型 |
| 新建 | `src/pages/changelog/utils.ts` | MDX 内容加载、排序、日期格式化工具 |
| 新建 | `src/pages/changelog/components/changelog-entry/index.tsx` | 单个时间轴条目组件 |
| 新建 | `src/pages/changelog/index.tsx` | Changelog 页面主组件 |
| 新建 | `src/pages/changelog/content/2025-04-14.mdx` | 示例 MDX 更新日志 |

---

## 任务 1：安装依赖

**文件：**
- 修改：`package.json`

- [ ] **步骤 1：安装生产依赖**

```bash
pnpm add @mdx-js/rollup remark-frontmatter remark-mdx-frontmatter @tailwindcss/typography
```

- [ ] **步骤 2：安装开发依赖**

```bash
pnpm add -D @types/mdx
```

- [ ] **步骤 3：验证安装成功**

```bash
ls node_modules/@mdx-js/rollup/index.js && ls node_modules/@tailwindcss/typography/package.json && echo "OK"
```
预期：输出 `OK`

---

## 任务 2：配置 Vite MDX 插件

**文件：**
- 修改：`vite.config.ts`

- [ ] **步骤 1：添加 MDX 相关 import**

在 `vite.config.ts` 顶部添加：

```ts
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
```

- [ ] **步骤 2：在 plugins 中注册 MDX 插件（enforce: 'pre'）**

将 MDX 插件插入到 `react()` 之前，使用 `enforce: 'pre'`：

```ts
plugins: [
  wasm(),
  topLevelAwait(),
  { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }) },
  react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  tailwindcss(),
  // Pages(...) 不变
]
```

注意：`react()` 原来无参数，现在需要添加 `include` 正则以支持 MDX 的 HMR。

- [ ] **步骤 3：在 Pages exclude 中添加 content 目录**

```ts
Pages({
  exclude: [
    '**/components/*',
    '**/utils/*',
    '**/*.test.*',
    '**/*.spec.*',
    '**/hooks/*',
    '**/models/*',
    '**/data/*',
    '**/info/*',
    '**/*.ts',
    '**/content/*',   // 新增：排除 MDX 内容目录
  ],
  importMode: 'async',
}),
```

- [ ] **步骤 4：验证构建通过**

```bash
pnpm run build
```
预期：构建成功，无错误

---

## 任务 3：配置 CSS 和 TypeScript 声明

**文件：**
- 修改：`src/index.css`
- 新建：`src/mdx.d.ts`

- [ ] **步骤 1：在 index.css 中添加 typography 插件**

在 `@import 'tw-animate-css';` 之后、`@custom-variant` 之前添加：

```css
@plugin "@tailwindcss/typography";
```

最终顺序：
```css
@import 'tailwindcss';
@import 'tw-animate-css';
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));
```

- [ ] **步骤 2：创建 MDX TypeScript 声明文件**

创建 `src/mdx.d.ts`：

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: Record<string, unknown>
  const MDXComponent: ComponentType
  export default MDXComponent
}
```

- [ ] **步骤 3：验证构建通过**

```bash
pnpm run build
```
预期：构建成功

---

## 任务 4：创建类型定义和工具函数

**文件：**
- 新建：`src/pages/changelog/types.ts`
- 新建：`src/pages/changelog/utils.ts`

- [ ] **步骤 1：创建类型定义**

创建 `src/pages/changelog/types.ts`：

```ts
import type { ComponentType } from 'react'

export interface ChangelogFrontmatter {
  title: string
  date: string
  tags?: string[]
  version?: string
}

export interface ChangelogEntry {
  frontmatter: ChangelogFrontmatter
  Content: ComponentType
}
```

- [ ] **步骤 2：创建工具函数**

创建 `src/pages/changelog/utils.ts`：

```ts
import type { ComponentType } from 'react'
import type { ChangelogEntry, ChangelogFrontmatter } from './types'

const modules = import.meta.glob('./content/*.mdx', { eager: true }) as Record<
  string,
  { default: ComponentType; frontmatter: ChangelogFrontmatter }
>

export function loadChangelogEntries(): ChangelogEntry[] {
  return Object.values(modules)
    .map((mod) => ({
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
```

- [ ] **步骤 3：验证 TypeScript 编译**

```bash
pnpm exec tsc --noEmit --pretty 2>&1 | head -20
```
预期：无与 changelog 相关的类型错误（可能有其他预存错误，忽略之）

---

## 任务 5：创建 ChangelogEntry 时间轴条目组件

**文件：**
- 新建：`src/pages/changelog/components/changelog-entry/index.tsx`

- [ ] **步骤 1：创建组件目录**

```bash
mkdir -p src/pages/changelog/components/changelog-entry
```

- [ ] **步骤 2：实现 ChangelogEntry 组件**

创建 `src/pages/changelog/components/changelog-entry/index.tsx`：

```tsx
import type { ChangelogEntry as ChangelogEntryType } from '../../types'
import { formatDate } from '../../utils'

interface ChangelogEntryProps {
  entry: ChangelogEntryType
  isLast: boolean
}

export function ChangelogEntry({ entry, isLast }: ChangelogEntryProps) {
  const { frontmatter, Content } = entry

  return (
    <article className={`flex flex-col md:flex-row ${isLast ? '' : 'pb-16'}`}>
      {/* 左侧：日期 + 版本 */}
      <div className="mb-4 md:mb-0 md:w-48 shrink-0">
        <div className="md:sticky md:top-10">
          <time className="text-sm text-muted-foreground font-medium">
            {formatDate(frontmatter.date)}
          </time>
          {frontmatter.version && (
            <span className="ml-2 md:ml-0 md:mt-2 md:block inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              v{frontmatter.version}
            </span>
          )}
        </div>
      </div>

      {/* 右侧：时间轴线 + 内容 */}
      <div className="relative flex-1 md:pl-8">
        {/* 时间轴圆点 */}
        <div className="absolute left-0 top-1.5 hidden md:block size-3 rounded-full bg-primary -translate-x-1.5" />

        {/* 时间轴竖线 */}
        {!isLast && (
          <div className="absolute left-0 top-5 bottom-0 hidden md:block w-px bg-border -translate-x-px" />
        )}

        {/* 内容区域 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">{frontmatter.title}</h2>

          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none">
            <Content />
          </div>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **步骤 3：ESLint 检查**

```bash
pnpm exec eslint src/pages/changelog/components/changelog-entry/index.tsx
```
预期：无错误

---

## 任务 6：创建 Changelog 页面主组件

**文件：**
- 新建：`src/pages/changelog/index.tsx`

- [ ] **步骤 1：实现页面组件**

创建 `src/pages/changelog/index.tsx`：

```tsx
import { ChangelogEntry } from './components/changelog-entry'
import { loadChangelogEntries } from './utils'

const entries = loadChangelogEntries()

export default function ChangelogPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-10 pb-20">
      <h1 className="text-3xl font-bold mb-2">更新日志</h1>
      <p className="text-muted-foreground mb-10">
        产品更新、新功能与改进记录
      </p>

      <div>
        {entries.map((entry, index) => (
          <ChangelogEntry
            key={entry.frontmatter.date}
            entry={entry}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **步骤 2：ESLint 检查**

```bash
pnpm exec eslint src/pages/changelog/index.tsx
```
预期：无错误

---

## 任务 7：创建示例 MDX 内容并验证全流程

**文件：**
- 新建：`src/pages/changelog/content/2025-04-14.mdx`

- [ ] **步骤 1：创建 content 目录**

```bash
mkdir -p src/pages/changelog/content
```

- [ ] **步骤 2：创建示例 MDX 文件**

创建 `src/pages/changelog/content/2025-04-14.mdx`：

```mdx
---
title: "v2.1 — 简历模板系统上线"
date: "2025-04-14"
tags: ["功能", "模板"]
version: "2.1"
---

## 新增功能

- 全新的简历模板系统，支持官方模板与社区模板
- 模板预览与一键应用
- 自定义模板上传与分享

## 改进

- 优化了 PDF 导出在移动端的布局表现
- 修复了 Skeleton 组件动画缺失的问题

## 技术细节

本次更新引入了全新的模板引擎，基于 `ResumeTemplateRuntime` 统一渲染路径，确保预览与导出的一致性。
```

- [ ] **步骤 3：完整构建验证**

```bash
pnpm run build
```
预期：构建成功，无错误

- [ ] **步骤 4：ESLint 全量检查**

```bash
pnpm exec eslint src/pages/changelog/
```
预期：无错误

- [ ] **步骤 5：启动开发服务器手动验证**

```bash
pnpm dev
```
在浏览器中访问 `/changelog`，确认：
- 页面标题和副标题正确渲染
- 时间轴布局在桌面端呈现左右分栏
- 日期、版本、标签正确显示
- MDX 内容以 prose 样式渲染
- 响应式缩小窗口后，布局切换为垂直堆叠
