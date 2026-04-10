# 简历模板运行时系统 实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。
>
> **执行约束更新（2026-04-08）：** 用户明确要求“不写测试”。所有 `vitest`、测试基线、单元测试相关步骤均视为取消，已删除对应文件与依赖；验证方式改为 `eslint`、`tsc`、`build` 与手动回归。

**目标：** 把现有 `resume.type -> React 模板组件` 的预览链路升级为 `TemplateManifest + ManifestResolver + Runtime Renderer` 的配置驱动模板运行时，同时保持编辑器、历史预览、tracker 简历预览和导出共用同一渲染入口。

**架构：** 新增 `src/lib/resume-template` 作为纯数据模型、注册表和解析层，新增 `src/components/resume/runtime` 作为 React 运行时渲染层。第一阶段保持现有 `resume.type` 持久化字段不变，仅通过 built-in manifest registry 把 `default` / `modern` / `simple` 映射到新运行时，避免本阶段扩散到模板中心 UI、数据库 schema、发布审核流。

**技术栈：** React 19、TypeScript、Vite、Zod、Zustand、react-dom/server、Vitest、ESLint、pnpm

---

## 文件结构

- 新建：`vitest.config.ts`
  - 为模板运行时的纯逻辑与服务端渲染测试提供最小测试入口。
- 修改：`package.json`
  - 增加 `vitest` 依赖与 `test:unit` 脚本。
- 新建：`src/lib/resume-template/schema.ts`
  - 定义 `TemplateManifest`、`TemplateFamily`、section 配置、token 配置的 zod schema 与类型导出。
- 新建：`src/lib/resume-template/defaults.ts`
  - 定义默认布局、默认 token、默认 section 降级策略。
- 新建：`src/lib/resume-template/registry/families.ts`
  - 注册第一阶段内置 family。
- 新建：`src/lib/resume-template/registry/manifests.ts`
  - 注册 `default` / `modern` / `simple` 的内置 manifest。
- 新建：`src/lib/resume-template/registry/layout-skeletons.tsx`
  - 注册 `single-column`、`sidebar-left`、`sidebar-right`、`stacked` 骨架。
- 新建：`src/lib/resume-template/registry/section-renderers.tsx`
  - 注册 section renderer key 到 React renderer 的映射。
- 新建：`src/lib/resume-template/runtime/resolve-manifest.ts`
  - 对 manifest 做 schema 校验、默认值补齐、非法值降级。
- 新建：`src/lib/resume-template/runtime/get-built-in-manifest.ts`
  - 把现有 `ResumeType` 映射到新运行时内置 manifest。
- 新建：`src/lib/resume-template/runtime/index.ts`
  - 汇总运行时公共导出，减少跨目录深层导入。
- 新建：`src/components/resume/runtime/ResumeTemplateRuntime.tsx`
  - 统一接收 `resumeData + manifest + appearance`，输出最终渲染树。
- 新建：`src/components/resume/runtime/TemplateRuntimeProviders.tsx`
  - 整合当前 `resume-data-context` 与 `resume-context` 的 provider 组合。
- 新建：`src/components/resume/runtime/layouts/SingleColumnSkeleton.tsx`
- 新建：`src/components/resume/runtime/layouts/SidebarSkeleton.tsx`
- 新建：`src/components/resume/runtime/layouts/StackedSkeleton.tsx`
  - 承担页面区域布局，不嵌入业务字段。
- 新建：`src/components/resume/runtime/renderers/*.tsx`
  - 至少覆盖 `basics`、`job_intent`、`education`、`work_experience`、`project_experience`、`skills`、`self_evaluation` 等第一阶段必须 section。
- 修改：`src/pages/template/components/basic/Basic.tsx`
  - 改造成 built-in manifest 的薄包装，或把现有可复用 section 逻辑抽出给 runtime 使用。
- 修改：`src/pages/template/components/modern/Modern.tsx`
  - 同上，避免继续作为直接被入口路由选择的主模板实现。
- 修改：`src/pages/template/components/index.tsx`
  - 从“组件 map”切换为“built-in manifest / runtime helper”出口。
- 修改：`src/pages/template/components/resume-data-context.tsx`
  - 为 runtime 保留一致的数据读取方式，必要时增加 manifest 相关输入类型。
- 修改：`src/pages/template/components/resume-context.tsx`
  - 将公共样式上下文继续作为 runtime provider 的底层依赖，避免重复定义 token 类型。
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
  - 改为直接消费 `ResumeTemplateRuntime`。
- 修改：`src/pages/resume/editor/components/preview/ResumeWrapper.tsx`
  - 保持 `PagedResumeShell` 承载，但让 runtime 成为唯一子树入口。
- 修改：`src/components/resume/scaled-readonly-preview.tsx`
  - 历史预览、tracker 预览共用新 runtime。
- 修改：`src/lib/schema/resume/index.ts`
  - 保留 `ResumeType` 兼容层，但把 built-in 模板解析入口接到 manifest runtime。
- 修改：`src/pages/tracker/components/drawer/document.tsx`
  - 仅在类型或 helper 变化时调整；不允许复制模板解析逻辑。
- 新建：`src/lib/resume-template/runtime/resolve-manifest.test.ts`
- 新建：`src/lib/resume-template/runtime/get-built-in-manifest.test.ts`
- 新建：`src/components/resume/runtime/ResumeTemplateRuntime.test.tsx`
  - 覆盖 schema 校验、默认值补齐、非法 manifest 降级、section 顺序/显隐/区域渲染。

## 执行约束

- 第一阶段不做模板编辑器 UI。
- 第一阶段不做数据库迁移，不新增“用户模板表”。
- 第一阶段不把首页、历史页、创建简历对话框中的模板标签系统性改成动态模板中心数据源；这些入口继续使用 `ResumeType` 的内置兼容值。
- 运行时必须优先复用现有 `useResumeStyles`、`PagedResumeShell`、`TemplateResumeDataProvider`，不要并行造第二套 appearance 或分页系统。
- 所有提交只做本地 commit，不做 `git push`。

## 验证策略

按用户最新要求，本阶段不编写测试。第一阶段验证改为两层：

- 类型/静态校验：`pnpm exec eslint ...`、`pnpm exec tsc --noEmit`。
- 手动冒烟：`/resume/editor`、`/history` 详情预览、`/tracker` 抽屉简历预览、导出对话框，并在收尾阶段补 `pnpm build`。

## 执行进度（2026-04-08）

- 已完成：`TemplateManifest` schema、family/defaults、built-in manifest registry、manifest resolver、runtime layout skeleton、section renderer registry、`ResumeTemplateRuntime`、编辑器预览与只读预览接入。
- 已完成：resolver 返回值拆成 `ResolvedTemplateManifest`，收窄 `layout.skeleton` 类型，消除 `layoutSkeletonRegistry[resolvedManifest.layout.skeleton]` 的字符串索引报错。
- 已完成：`src/pages/template/components/index.tsx` 改为 runtime/barrel 出口，`Basic.tsx` / `Modern.tsx` 改为兼容包装层。
- 已完成验证：`pnpm exec eslint src/lib/resume-template src/components/resume/runtime src/pages/template/components/index.tsx src/pages/template/components/basic/Basic.tsx src/pages/template/components/modern/Modern.tsx src/pages/template/components/resume-context.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/components/resume/scaled-readonly-preview.tsx`、`pnpm exec tsc --noEmit`、`pnpm build` 均通过。
- 冒烟限制：Playwright 因本机缺少系统级 `chrome` 无法执行浏览器点测；已用 `curl -I http://127.0.0.1:4173/resume/editor` 确认页面入口返回 `200 OK`。

---

### 任务 1：建立模板运行时测试基线

**文件：**

- 修改：`package.json`
- 新建：`vitest.config.ts`
- 新建：`src/lib/resume-template/runtime/resolve-manifest.test.ts`
- 新建：`src/lib/resume-template/runtime/get-built-in-manifest.test.ts`

- [x] **步骤 1：先安装最小测试依赖并补测试脚本**

运行：

```bash
pnpm add -D vitest
```

然后修改 `package.json`：

```json
{
  "scripts": {
    "test:unit": "vitest run"
  }
}
```

- [x] **步骤 2：新增 Vitest 配置文件**

写入：

```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
```

- [x] **步骤 3：先写失败测试，锁定 manifest 解析契约**

在 `src/lib/resume-template/runtime/resolve-manifest.test.ts` 中先写：

```ts
import { describe, expect, it } from 'vitest'
import { resolveTemplateManifest } from './resolve-manifest'

describe('resolveTemplateManifest', () => {
  it('会为缺失字段补齐默认布局和 token', () => {
    const resolved = resolveTemplateManifest({
      id: 'test',
      version: 1,
      familyId: 'classic-single-column',
      meta: {
        name: 'Test',
        ownerType: 'official',
        visibility: 'private',
        status: 'active',
      },
      layout: {
        skeleton: 'single-column',
        headerVariant: 'default',
        density: 'normal',
        page: { size: 'A4', pagePaddingToken: 'md' },
      },
      sections: [],
      tokens: {
        colorPreset: 'missing',
        fontPreset: 'missing',
        spacingPreset: 'missing',
      },
      rules: {},
    })

    expect(resolved.tokens.colorPreset).toBe('default')
    expect(resolved.sections.length).toBeGreaterThan(0)
  })
})
```

在 `src/lib/resume-template/runtime/get-built-in-manifest.test.ts` 中先写：

```ts
import { describe, expect, it } from 'vitest'
import { getBuiltInTemplateManifest } from './get-built-in-manifest'

describe('getBuiltInTemplateManifest', () => {
  it('会把 simple 安全降级到 default manifest', () => {
    expect(getBuiltInTemplateManifest('simple').id).toBe('default')
  })
})
```

- [x] **步骤 4：运行测试并确认它失败**

运行：

```bash
pnpm exec vitest run src/lib/resume-template/runtime/resolve-manifest.test.ts src/lib/resume-template/runtime/get-built-in-manifest.test.ts
```

预期：FAIL，并出现 `Cannot find module './resolve-manifest'` 或同类缺失实现报错。

执行记录：已运行 `pnpm exec vitest run src/lib/resume-template/runtime/resolve-manifest.test.ts src/lib/resume-template/runtime/get-built-in-manifest.test.ts`，结果按预期 FAIL，分别报错 `Cannot find module './resolve-manifest'` 与 `Cannot find module './get-built-in-manifest'`。

- [ ] **步骤 5：提交测试基线**

运行：

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/resume-template/runtime/resolve-manifest.test.ts src/lib/resume-template/runtime/get-built-in-manifest.test.ts
git commit -m "test: add resume template runtime test harness"
```

说明：当前工作区存在既有 staged 的 tracker 改动，本步骤暂未执行；后续如需本地提交，需使用隔离 pathspec 或 `git commit --only ...`，避免混入无关改动。

### 任务 2：实现 manifest schema、默认值和内置模板注册表

**文件：**

- 新建：`src/lib/resume-template/schema.ts`
- 新建：`src/lib/resume-template/defaults.ts`
- 新建：`src/lib/resume-template/registry/families.ts`
- 新建：`src/lib/resume-template/registry/manifests.ts`
- 新建：`src/lib/resume-template/runtime/resolve-manifest.ts`
- 新建：`src/lib/resume-template/runtime/get-built-in-manifest.ts`
- 新建：`src/lib/resume-template/runtime/index.ts`
- 修改：`src/lib/schema/resume/index.ts`
- 测试：`src/lib/resume-template/runtime/resolve-manifest.test.ts`
- 测试：`src/lib/resume-template/runtime/get-built-in-manifest.test.ts`

- [x] **步骤 1：先扩展失败测试，覆盖非法 token、非法 section 和 family 降级**

给 `resolve-manifest.test.ts` 增加至少这些断言：

```ts
it('会过滤未注册 renderer 的 section', () => {
  const resolved = resolveTemplateManifest({
    ...validManifest,
    sections: [
      { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true },
      { sectionId: 'unknown', renderer: 'missing', region: 'main', order: 2, visible: true },
    ],
  })

  expect(resolved.sections.map(section => section.sectionId)).toEqual(['basics'])
})

it('遇到未知 skeleton 时回退到 family 默认 skeleton', () => {
  const resolved = resolveTemplateManifest({
    ...validManifest,
    layout: { ...validManifest.layout, skeleton: 'missing-skeleton' as never },
  })

  expect(resolved.layout.skeleton).toBe('single-column')
})
```

- [x] **步骤 2：运行新增测试并确认失败**

运行：

```bash
pnpm exec vitest run src/lib/resume-template/runtime/resolve-manifest.test.ts src/lib/resume-template/runtime/get-built-in-manifest.test.ts
```

预期：FAIL，断言失败或缺失导出。

执行记录：已运行同一条 `vitest` 命令，结果仍为 FAIL，确认在实现前失败原因来自缺失模块。

- [x] **步骤 3：实现 schema、默认值和 built-in manifest 兼容层**

`schema.ts` 至少提供：

```ts
export const templateManifestSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  familyId: z.string(),
  meta: z.object({
    name: z.string(),
    description: z.string().optional(),
    ownerType: z.enum(['official', 'user']),
    ownerId: z.string().optional(),
    visibility: z.enum(['private', 'published']),
    status: z.enum(['draft', 'active', 'archived']),
  }),
  layout: z.object({
    skeleton: z.enum(['single-column', 'sidebar-left', 'sidebar-right', 'stacked']),
    headerVariant: z.string(),
    density: z.enum(['compact', 'normal', 'comfortable']),
    page: z.object({
      size: z.enum(['A4']),
      pagePaddingToken: z.string(),
    }),
  }),
  sections: z.array(z.object({
    sectionId: z.string(),
    renderer: z.string(),
    region: z.enum(['main', 'sidebar']),
    order: z.number().int(),
    visible: z.boolean(),
    variant: z.string().optional(),
  })),
  tokens: z.object({
    colorPreset: z.string(),
    fontPreset: z.string(),
    spacingPreset: z.string(),
    radiusPreset: z.string().optional(),
  }),
  rules: z.object({
    requiredSections: z.array(z.string()).optional(),
    lockedSections: z.array(z.string()).optional(),
    allowedRegions: z.record(z.string(), z.array(z.enum(['main', 'sidebar']))).optional(),
  }),
})
```

`get-built-in-manifest.ts` 至少提供：

```ts
import type { ResumeType } from '@/lib/schema'
import { builtInTemplateManifests } from '../registry/manifests'

export function getBuiltInTemplateManifest(type: ResumeType) {
  if (type === 'modern')
    return builtInTemplateManifests.modern

  return builtInTemplateManifests.default
}
```

`resolve-manifest.ts` 至少要做：

- schema parse
- family 默认值补齐
- token 缺失回退到 `default`
- 未注册 section renderer 过滤
- `requiredSections` 缺失时自动补回
- 最终 section 按 `order` 升序输出

- [x] **步骤 4：再次运行测试并确认通过**

运行：

```bash
pnpm exec vitest run src/lib/resume-template/runtime/resolve-manifest.test.ts src/lib/resume-template/runtime/get-built-in-manifest.test.ts
```

预期：PASS。

执行记录：已运行 `pnpm exec vitest run src/lib/resume-template/runtime/resolve-manifest.test.ts src/lib/resume-template/runtime/get-built-in-manifest.test.ts`，结果 2 个文件、4 个测试全部通过。

- [x] **步骤 5：运行静态检查**

运行：

```bash
pnpm exec eslint src/lib/resume-template/schema.ts src/lib/resume-template/defaults.ts src/lib/resume-template/registry/families.ts src/lib/resume-template/registry/manifests.ts src/lib/resume-template/runtime/resolve-manifest.ts src/lib/resume-template/runtime/get-built-in-manifest.ts src/lib/schema/resume/index.ts
pnpm exec tsc --noEmit
```

预期：全部通过。

执行记录：已运行 `pnpm exec eslint src/lib/resume-template/schema.ts src/lib/resume-template/defaults.ts src/lib/resume-template/registry/families.ts src/lib/resume-template/registry/manifests.ts src/lib/resume-template/runtime/resolve-manifest.ts src/lib/resume-template/runtime/get-built-in-manifest.ts src/lib/schema/resume/index.ts` 和 `pnpm exec tsc --noEmit`，两者均通过。

- [ ] **步骤 6：提交 manifest 层改动**

运行：

```bash
git add src/lib/resume-template src/lib/schema/resume/index.ts
git commit -m "feat: add manifest-driven resume template runtime core"
```

说明：当前工作区存在既有 staged 的 tracker 改动，本步骤暂未执行；继续实现不受阻，但后续本地提交必须隔离 pathspec，避免混入无关文件。

### 任务 3：实现 runtime 渲染入口、布局骨架和 section renderer 注册表

**文件：**

- 新建：`src/components/resume/runtime/ResumeTemplateRuntime.tsx`
- 新建：`src/components/resume/runtime/TemplateRuntimeProviders.tsx`
- 新建：`src/components/resume/runtime/layouts/SingleColumnSkeleton.tsx`
- 新建：`src/components/resume/runtime/layouts/SidebarSkeleton.tsx`
- 新建：`src/components/resume/runtime/layouts/StackedSkeleton.tsx`
- 新建：`src/lib/resume-template/registry/layout-skeletons.tsx`
- 新建：`src/lib/resume-template/registry/section-renderers.tsx`
- 新建：`src/components/resume/runtime/renderers/BasicsRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/JobIntentRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/EducationRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/WorkExperienceRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/ProjectExperienceRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/SkillsRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/SelfEvaluationRenderer.tsx`
- 测试：`src/components/resume/runtime/ResumeTemplateRuntime.test.tsx`

- [ ] **步骤 1：先写失败的运行时渲染测试**

在 `ResumeTemplateRuntime.test.tsx` 中先用服务端渲染锁定最小行为：

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ResumeTemplateRuntime } from './ResumeTemplateRuntime'

it('按 manifest 顺序渲染 main 区域 section', () => {
  const html = renderToStaticMarkup(
    <ResumeTemplateRuntime
      data={mockResumeData}
      manifest={mockManifest}
    />,
  )

  expect(html.indexOf('教育经历')).toBeLessThan(html.indexOf('项目经历'))
})

it('visible=false 的 section 不会出现在输出中', () => {
  const html = renderToStaticMarkup(
    <ResumeTemplateRuntime
      data={mockResumeData}
      manifest={hiddenSkillsManifest}
    />,
  )

  expect(html).not.toContain('技能特长')
})
```

- [ ] **步骤 2：运行测试并确认失败**

运行：

```bash
pnpm exec vitest run src/components/resume/runtime/ResumeTemplateRuntime.test.tsx
```

预期：FAIL，缺少 `ResumeTemplateRuntime` 或渲染结果不符合预期。

- [ ] **步骤 3：实现统一 runtime 入口和骨架注册**

`ResumeTemplateRuntime.tsx` 的目标结构：

```tsx
export function ResumeTemplateRuntime({
  data,
  manifest,
  appearance,
}: {
  data: TemplateResumeData
  manifest: TemplateManifest
  appearance?: Partial<ResumeAppearanceConfig> | null
}) {
  const resolved = resolveTemplateManifest(manifest)
  const layout = layoutSkeletonRegistry[resolved.layout.skeleton]

  return (
    <TemplateRuntimeProviders data={data} appearance={appearance}>
      {layout({
        manifest: resolved,
        renderSection: (section) => {
          const Renderer = sectionRendererRegistry[section.renderer]
          return Renderer ? <Renderer key={section.sectionId} section={section} /> : null
        },
      })}
    </TemplateRuntimeProviders>
  )
}
```

骨架组件必须满足：

- 只负责 `main/sidebar` 区域编排
- 不直接读取 `ResumeSchema`
- 只通过 `renderSection` 渲染具体业务 section

section renderer 必须满足：

- 从 `TemplateResumeData` 读取业务数据
- 通过 `useResumeContext()` 读取字体、间距、主题 token
- 业务字段空时返回 `null`

- [ ] **步骤 4：再次运行运行时测试并确认通过**

运行：

```bash
pnpm exec vitest run src/components/resume/runtime/ResumeTemplateRuntime.test.tsx
```

预期：PASS。

- [ ] **步骤 5：运行静态检查**

运行：

```bash
pnpm exec eslint src/components/resume/runtime src/lib/resume-template/registry/layout-skeletons.tsx src/lib/resume-template/registry/section-renderers.tsx
pnpm exec tsc --noEmit
```

预期：全部通过。

- [ ] **步骤 6：提交 runtime 渲染层**

运行：

```bash
git add src/components/resume/runtime src/lib/resume-template/registry/layout-skeletons.tsx src/lib/resume-template/registry/section-renderers.tsx src/components/resume/runtime/ResumeTemplateRuntime.test.tsx
git commit -m "feat: add resume template runtime renderer"
```

### 任务 4：把内置模板迁移到 manifest runtime，并保留兼容包装层

**文件：**

- 修改：`src/pages/template/components/basic/Basic.tsx`
- 修改：`src/pages/template/components/modern/Modern.tsx`
- 修改：`src/pages/template/components/index.tsx`
- 修改：`src/pages/template/components/resume-data-context.tsx`
- 修改：`src/pages/template/components/resume-context.tsx`
- 新建：`src/lib/resume-template/registry/built-in-manifests.ts`
- 测试：`src/lib/resume-template/runtime/get-built-in-manifest.test.ts`
- 测试：`src/components/resume/runtime/ResumeTemplateRuntime.test.tsx`

- [ ] **步骤 1：先写失败测试，锁定 built-in 模板外观入口不会消失**

扩展测试至少覆盖：

```ts
it('default built-in manifest 使用 single-column skeleton', () => {
  expect(getBuiltInTemplateManifest('default').layout.skeleton).toBe('single-column')
})

it('modern built-in manifest 使用 sidebar-left 或 stacked skeleton', () => {
  expect(['sidebar-left', 'stacked']).toContain(getBuiltInTemplateManifest('modern').layout.skeleton)
})
```

- [ ] **步骤 2：运行测试并确认失败**

运行：

```bash
pnpm exec vitest run src/lib/resume-template/runtime/get-built-in-manifest.test.ts src/components/resume/runtime/ResumeTemplateRuntime.test.tsx
```

预期：FAIL，内置 manifest 还未完整接入。

- [ ] **步骤 3：把 `Basic` / `Modern` 改成 runtime 薄包装或抽取共享渲染逻辑**

优先采用“薄包装 + 渐进抽离”的方式，避免一次性重写整个模板文件：

```tsx
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime'
import { buildTemplateResumeData, useTemplateResumeData } from '../resume-data-context'

export default function BasicResume(props: RuntimeAppearanceProps) {
  const data = useTemplateResumeData()
  return (
    <ResumeTemplateRuntime
      data={buildTemplateResumeData(data)}
      manifest={getBuiltInTemplateManifest('default')}
      appearance={props.appearance}
    />
  )
}
```

这里的关键不是保留旧 JSX，而是确保：

- `Basic.tsx` / `Modern.tsx` 不再作为主路由逻辑承载模板结构
- 旧文件允许暂时保留为兼容导出
- 新的 section / layout 结构才是唯一真实实现

- [ ] **步骤 4：把 `src/pages/template/components/index.tsx` 从组件映射改为 manifest/runtime 入口**

目标形态：

```ts
export { builtInTemplateManifests } from '@/lib/resume-template/registry/manifests'
export { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime'
```

如果仍需兼容旧调用方，只保留一个极薄的 helper，不再暴露 `resumeComponents[type] || BasicResume` 这种入口。

- [ ] **步骤 5：再次运行单元测试并确认通过**

运行：

```bash
pnpm exec vitest run src/lib/resume-template/runtime/get-built-in-manifest.test.ts src/components/resume/runtime/ResumeTemplateRuntime.test.tsx
```

预期：PASS。

- [ ] **步骤 6：运行静态检查**

运行：

```bash
pnpm exec eslint src/pages/template/components/basic/Basic.tsx src/pages/template/components/modern/Modern.tsx src/pages/template/components/index.tsx src/pages/template/components/resume-data-context.tsx src/pages/template/components/resume-context.tsx
pnpm exec tsc --noEmit
```

预期：全部通过。

- [ ] **步骤 7：提交内置模板迁移**

运行：

```bash
git add src/pages/template/components/basic/Basic.tsx src/pages/template/components/modern/Modern.tsx src/pages/template/components/index.tsx src/pages/template/components/resume-data-context.tsx src/pages/template/components/resume-context.tsx src/lib/resume-template/registry
git commit -m "refactor: migrate built-in resume templates to runtime manifests"
```

### 任务 5：切换编辑器、历史预览、tracker 预览到统一 runtime

**文件：**

- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
- 修改：`src/pages/resume/editor/components/preview/ResumeWrapper.tsx`
- 修改：`src/components/resume/scaled-readonly-preview.tsx`
- 修改：`src/pages/tracker/components/drawer/document.tsx`
- 参考：`src/pages/history/components/shared/history-resume-preview.tsx`
- 参考：`src/components/resume/paged-resume-shell.tsx`
- 测试：`src/components/resume/runtime/ResumeTemplateRuntime.test.tsx`

- [ ] **步骤 1：先写失败测试，锁定 preview consumer 必须走同一 runtime**

在 `ResumeTemplateRuntime.test.tsx` 或新建 integration test 中增加：

```tsx
it('同一份 data 和 manifest 在 runtime 中能稳定输出标题与主要 section', () => {
  const html = renderToStaticMarkup(
    <ResumeTemplateRuntime
      data={mockResumeData}
      manifest={getBuiltInTemplateManifest('default')}
      appearance={mockAppearance}
    />,
  )

  expect(html).toContain('姓名')
  expect(html).toContain('教育经历')
})
```

- [ ] **步骤 2：运行测试并确认失败或尚未覆盖 consumer 接口**

运行：

```bash
pnpm exec vitest run src/components/resume/runtime/ResumeTemplateRuntime.test.tsx
```

预期：如果 consumer 还依赖旧组件链路，则需要补实现后才能稳定通过。

- [ ] **步骤 3：让编辑器预览直接消费 runtime**

`ResumePreview.tsx` 目标结构：

```tsx
const manifest = getBuiltInTemplateManifest(type)

<ResumeWrapper ref={resumeRef}>
  <ResumeTemplateRuntime
    data={buildTemplateResumeData(useResumeStore.getState())}
    manifest={manifest}
    appearance={appearance}
  />
</ResumeWrapper>
```

要求：

- 不再从 `src/pages/template/components/index.tsx` 取组件 map
- 继续沿用 `useResumeStyles()` 的 appearance 解析
- `ResumeWrapper` 只负责分页壳，不再决定模板类型

- [ ] **步骤 4：让只读预览链路直接消费 runtime**

`scaled-readonly-preview.tsx` 必须与编辑器使用同一运行时入口：

```tsx
<TemplateResumeDataProvider value={data}>
  <PagedResumeShell appearance={appearance}>
    <ResumeTemplateRuntime
      data={data}
      manifest={getBuiltInTemplateManifest(data.type)}
      appearance={appearance}
    />
  </PagedResumeShell>
</TemplateResumeDataProvider>
```

这一步完成后，历史详情和 tracker 抽屉会自动跟随同一运行时；若 `document.tsx` 仍有旧 helper 假设，再做最小修正，但不得复制 manifest 解析逻辑。

- [ ] **步骤 5：运行完整单测、lint 和类型检查**

运行：

```bash
pnpm exec vitest run
pnpm exec eslint src/pages/resume/editor/components/preview/ResumePreview.tsx src/pages/resume/editor/components/preview/ResumeWrapper.tsx src/components/resume/scaled-readonly-preview.tsx src/pages/tracker/components/drawer/document.tsx
pnpm exec tsc --noEmit
```

预期：全部通过。

- [ ] **步骤 6：本地手动冒烟**

运行：

```bash
pnpm dev
```

手动检查：

- `/resume/editor`：切换 `default` / `modern` 模板后预览正常
- `/history`：详情中的简历预览正常
- `/tracker`：抽屉中的绑定简历预览正常
- 导出对话框：分页和样式未明显回归

执行记录：在计划执行时追加实际观察结果；若环境限制无法完成某项，必须在对应复选框下补充原因。

- [ ] **步骤 7：提交入口切换**

运行：

```bash
git add src/pages/resume/editor/components/preview/ResumePreview.tsx src/pages/resume/editor/components/preview/ResumeWrapper.tsx src/components/resume/scaled-readonly-preview.tsx src/pages/tracker/components/drawer/document.tsx
git commit -m "refactor: route resume previews through template runtime"
```

### 任务 6：收尾验证与兼容边界确认

**文件：**

- 修改：`src/lib/schema/resume/index.ts`
- 参考：`src/store/resume/utils.ts`
- 参考：`src/pages/history/utils.ts`
- 参考：`src/pages/tracker/utils.ts`
- 修改：`docs/superpowers/plans/2026-04-08-resume-template-runtime.md`

- [ ] **步骤 1：检查 `normalizeResumeType` 兼容层仍然可用**

确认以下行为没有被破坏：

```ts
expect(normalizeResumeType('basic')).toBe('default')
expect(normalizeResumeType('modern')).toBe('modern')
expect(normalizeResumeType('unknown')).toBe('default')
```

如果没有对应测试文件，可直接把这组断言补到现有 runtime 单测或新增一个纯函数测试。

- [ ] **步骤 2：运行全量验证**

运行：

```bash
pnpm exec vitest run
pnpm exec eslint src/lib/resume-template src/components/resume/runtime src/pages/template/components src/pages/resume/editor/components/preview src/components/resume/scaled-readonly-preview.tsx src/lib/schema/resume/index.ts
pnpm exec tsc --noEmit
pnpm build
```

预期：全部通过。

- [ ] **步骤 3：更新本计划中的执行记录**

把已经完成的步骤改成 `- [x]`，并在以下步骤下追加真实执行结果：

- 单元测试步骤
- 静态检查步骤
- 手动冒烟步骤
- 若有跳过项，说明跳过原因

- [ ] **步骤 4：做本地收尾提交**

运行：

```bash
git add docs/superpowers/plans/2026-04-08-resume-template-runtime.md
git commit -m "docs: update resume template runtime execution log"
```

## 完成标准

满足以下条件后，第一阶段才能视为完成：

- `ResumePreview` 不再直接依赖模板组件 map
- `ScaledReadonlyPreview` 不再直接依赖模板组件 map
- 内置 `default` / `modern` 模板通过 built-in manifest registry 进入统一 runtime
- manifest 解析具备默认值补齐与非法输入降级能力
- section renderer 与 layout skeleton 是运行时唯一真实渲染入口
- `pnpm exec vitest run`、`pnpm exec tsc --noEmit`、`pnpm build` 均通过
- `/resume/editor`、`/history`、`/tracker` 手动冒烟通过

## 延后到下一阶段的事项

以下内容明确不在本计划内：

- 模板编辑器 UI
- 用户模板的数据库存储
- 模板发布/审核流
- 模板中心页面实现
- 自由画布式拖拽排版
- 首页、历史页、创建简历入口改造成动态模板目录
