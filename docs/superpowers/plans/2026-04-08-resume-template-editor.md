# 简历模板编辑器系统 实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。
>
> **执行约束更新（2026-04-08）：** 用户明确要求“不写测试”，并且“不自动 push”。本计划不新增单元测试或测试框架，验证方式改为 `eslint`、`tsc`、`build` 与手动冒烟；所有 git 操作只允许本地 commit，不允许 `git push`。

**目标：** 在第一阶段模板运行时底座之上，实现一个可视化模板工作台，让用户可以基于官方模板创建个人模板、编辑 `TemplateManifest`、实时预览、保存，并显式选择是否发布。

**架构：** 第二阶段继续复用第一阶段的 `ResumeTemplateRuntime`，把 `/template` 从占位页升级成单路由模板工作台，通过搜索参数在“模板列表”和“模板编辑器”之间切换。模板编辑器只读写 `TemplateManifest` 草稿；官方模板仍来自本地 registry，用户模板通过 Supabase 新表持久化，结构拖拽采用仓库里已经在用的 `@hello-pangea/dnd`。

**技术栈：** React 19、TypeScript、Vite、Zustand、Zod、Supabase、@hello-pangea/dnd、shadcn/ui、pnpm

---

## 文件结构

- 修改：`src/lib/resume-template/schema.ts`
  - 扩展第二阶段所需的 `TemplateRecord`、family editor capabilities、编辑器相关类型，但保持第一阶段 runtime 输入类型兼容。
- 修改：`src/lib/resume-template/registry/families.ts`
  - 为各个 family 补齐编辑器能力边界，如允许的 skeleton、header variant、token preset、section palette。
- 新建：`src/lib/resume-template/registry/official-template-catalog.ts`
  - 维护模板工作台用的官方模板目录数据，串联 built-in manifest、family、展示元信息。
- 新建：`src/lib/resume-template/editor/factories.ts`
  - 负责从 official template / family 生成用户模板草稿。
- 新建：`src/lib/resume-template/editor/capabilities.ts`
  - 解析 family 和 manifest rules，产出编辑器可消费的能力边界。
- 新建：`src/lib/resume-template/editor/commands.ts`
  - 纯函数层，负责 section 排序、显隐、region 切换、layout/token 更新等 manifest 变更。
- 新建：`src/lib/resume-template/editor/validators.ts`
  - 保存与发布前校验，返回结构化错误与阻断信息。
- 新建：`src/lib/resume-template/editor/index.ts`
  - 汇总编辑器纯逻辑导出。
- 新建：`supabase/migrations/20260408130000_create_resume_templates.sql`
  - 创建用户模板持久化表、索引、约束与更新时间 trigger。
- 新建：`src/lib/supabase/template/index.ts`
  - 模板仓库层，封装获取官方目录、获取用户模板、创建、更新、发布、归档等操作。
- 新建：`src/store/template/editor.ts`
  - 维护模板草稿、选中 section、preview resume、dirty/saving/publishIntent 等编辑器状态。
- 新建：`src/pages/template/data/demo-resume.ts`
  - 当用户没有现成简历时，提供模板编辑器的内置预览数据。
- 新建：`src/pages/template/hooks/use-template-workbench.ts`
  - 加载官方模板目录、用户模板列表，并负责 URL 搜索参数到工作台状态的转换。
- 新建：`src/pages/template/hooks/use-template-preview-resume.ts`
  - 决定预览使用哪份 resume 数据，并在“当前简历 / 最近简历 / demo resume”之间降级。
- 修改：`src/pages/template/index.tsx`
  - 从占位页升级成模板工作台根页面，承载列表模式与编辑模式。
- 新建：`src/pages/template/components/workbench/TemplateWorkbench.tsx`
  - 模板工作台列表页主体。
- 新建：`src/pages/template/components/workbench/OfficialTemplateSection.tsx`
  - 展示官方模板列表与“基于此模板创建”动作。
- 新建：`src/pages/template/components/workbench/UserTemplateSection.tsx`
  - 展示“我的模板”、状态、编辑入口和空态。
- 新建：`src/pages/template/components/workbench/TemplateCard.tsx`
  - 统一官方模板 / 用户模板卡片展示。
- 新建：`src/pages/template/components/editor/TemplateEditorShell.tsx`
  - 三栏编辑器总布局。
- 新建：`src/pages/template/components/editor/TemplateEditorToolbar.tsx`
  - 保存、另存为、恢复默认、发布切换、返回列表等顶栏动作。
- 新建：`src/pages/template/components/editor/TemplateStructurePanel.tsx`
  - 左栏结构面板，支持 section 拖拽排序、显隐、region 操作。
- 新建：`src/pages/template/components/editor/TemplateSectionPalette.tsx`
  - 展示当前 family 允许新增的 section。
- 新建：`src/pages/template/components/editor/TemplateCanvas.tsx`
  - 中栏实时预览，直接消费 `ResumeTemplateRuntime`。
- 新建：`src/pages/template/components/editor/TemplatePropertiesPanel.tsx`
  - 右栏属性面板，负责模板整体与 section 级属性编辑。
- 新建：`src/pages/template/components/editor/TemplateAppearanceSettings.tsx`
  - 编辑 layout / token 相关属性。
- 新建：`src/pages/template/components/editor/TemplateSectionSettings.tsx`
  - 编辑 section 的 variant、region、visible、lock 状态反馈。
- 新建：`src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx`
  - 切换预览所使用的 resume 数据来源。
- 修改：`src/pages/template/components/index.tsx`
  - 对外补充工作台需要的 built-in catalog / helper 导出，避免页面深层跨目录导入。

## 执行约束

- 第二阶段继续复用第一阶段 `ResumeTemplateRuntime`，不允许新增“编辑器专用预览渲染层”。
- 第二阶段只把 `/template` 做成工作台，不改首页、历史页、resume 列表页的模板入口结构。
- 第二阶段不做模板市场首页、审核流、推荐排序、多人协作。
- 模板编辑器不复用 `src/contexts/DragContext.tsx`，结构拖拽统一改用 `@hello-pangea/dnd`。
- 所有 UI 优先直接使用现有 shadcn/ui 组件组合，不新增无必要的二次 UI 包装层。
- 只做本地 commit，不做 `git push`。

## 验证策略

按用户要求，本阶段不编写测试。验证分成三层：

- 静态校验：`pnpm exec eslint ...`、`pnpm exec tsc --noEmit`
- 构建校验：`pnpm build`
- 手动冒烟：`/template` 列表、从官方模板创建个人模板、编辑 section 结构、保存、重新打开、发布拦截与成功流

如果当前环境无法完成完整浏览器点测，必须在执行记录中明确写明限制，不得口头补齐。

## 执行进度（2026-04-08）

- 已完成任务 1-6 与任务 7 的静态/构建验证；`/template` 工作台与编辑器代码已落地。
- 任务 7 的完整浏览器交互冒烟仍未执行：用户明确要求“不使用 Playwright”，当前环境也缺少系统级 Chrome；已改用 `curl` 对 `/template` 与 editor 查询参数路由做可达性检查并记录限制。

---

### 任务 1：扩展模板模型与编辑器纯逻辑层

**文件：**

- 修改：`src/lib/resume-template/schema.ts`
- 修改：`src/lib/resume-template/defaults.ts`
- 修改：`src/lib/resume-template/registry/families.ts`
- 新建：`src/lib/resume-template/registry/official-template-catalog.ts`
- 新建：`src/lib/resume-template/editor/factories.ts`
- 新建：`src/lib/resume-template/editor/capabilities.ts`
- 新建：`src/lib/resume-template/editor/commands.ts`
- 新建：`src/lib/resume-template/editor/validators.ts`
- 新建：`src/lib/resume-template/editor/index.ts`
- 修改：`src/pages/template/components/index.tsx`

- [x] **步骤 1：扩展模板 schema，但保持 runtime 类型兼容**

在 `src/lib/resume-template/schema.ts` 中补充第二阶段最小模型：

```ts
export interface TemplateRecord {
  id: string
  manifest: TemplateManifest
  source: {
    kind: 'official' | 'user'
    familyId: string
    basedOnTemplateId?: string
  }
  meta: {
    name: string
    description?: string
    ownerId?: string
    visibility: 'private' | 'published'
    status: 'draft' | 'active' | 'archived'
    createdAt: string
    updatedAt: string
  }
}

export interface TemplateFamilyEditorCapabilities {
  allowedSkeletons: TemplateSkeleton[]
  allowedHeaderVariants: string[]
  allowedDensity: Array<'compact' | 'normal' | 'comfortable'>
  allowedTokenPresets: {
    color: string[]
    font: string[]
    spacing: string[]
    radius: string[]
  }
  sectionPalette: string[]
  sectionVariants: Record<string, string[]>
}
```

要求：不要让 `ResumeTemplateRuntime` 的现有输入签名失效。

- [x] **步骤 2：为 family registry 补齐编辑器能力边界**

修改 `src/lib/resume-template/registry/families.ts`，为每个 family 补充：

- `allowedSkeletons`
- `allowedHeaderVariants`
- `allowedDensity`
- `allowedTokenPresets`
- `sectionPalette`
- `sectionVariants`

同时保持现有 built-in family 的默认布局和默认 token 不变。

- [x] **步骤 3：新增官方模板目录与草稿工厂**

在 `src/lib/resume-template/registry/official-template-catalog.ts` 中建立模板工作台用的目录数据，例如：

```ts
export const officialTemplateCatalog = [
  {
    id: 'default',
    familyId: 'classic-single-column',
    title: '基础模板',
    description: '单栏、稳妥、适合通用投递',
    manifest: getBuiltInTemplateManifest('default'),
  },
]
```

并在 `src/lib/resume-template/editor/factories.ts` 中补充：

- `createTemplateDraftFromOfficialTemplate(templateId)`
- `createTemplateDraftFromFamily(familyId)`
- `cloneUserTemplateRecord(record)`

- [x] **步骤 4：实现 manifest 编辑命令与保存/发布校验**

在 `src/lib/resume-template/editor/commands.ts` 中至少实现：

- `reorderSections`
- `toggleSectionVisibility`
- `moveSectionRegion`
- `updateSectionVariant`
- `updateLayoutConfig`
- `updateTokenConfig`
- `updateTemplateMeta`

在 `src/lib/resume-template/editor/validators.ts` 中至少实现：

- `validateTemplateForSave`
- `validateTemplateForPublish`

要求：这些函数全部是纯逻辑，不依赖 React store。

- [x] **步骤 5：运行第一轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/resume-template/schema.ts src/lib/resume-template/registry/families.ts src/lib/resume-template/registry/official-template-catalog.ts src/lib/resume-template/editor/factories.ts src/lib/resume-template/editor/capabilities.ts src/lib/resume-template/editor/commands.ts src/lib/resume-template/editor/validators.ts src/lib/resume-template/editor/index.ts
pnpm exec tsc --noEmit
```

预期：`eslint` 与 `tsc` 均通过。

执行记录：已新增 `TemplateRecord` / family editor capabilities、官方模板目录、manifest 编辑命令与保存/发布校验；执行 `pnpm exec eslint src/lib/resume-template/schema.ts src/lib/resume-template/defaults.ts src/lib/resume-template/registry/families.ts src/lib/resume-template/registry/official-template-catalog.ts src/lib/resume-template/editor/factories.ts src/lib/resume-template/editor/capabilities.ts src/lib/resume-template/editor/commands.ts src/lib/resume-template/editor/validators.ts src/lib/resume-template/editor/index.ts src/pages/template/components/index.tsx` 与 `pnpm exec tsc --noEmit`，结果均通过。

### 任务 2：建立用户模板持久化层

**文件：**

- 新建：`supabase/migrations/20260408130000_create_resume_templates.sql`
- 新建：`src/lib/supabase/template/index.ts`
- 修改：`src/lib/resume-template/schema.ts`

- [x] **步骤 1：新增模板表 migration**

在 `supabase/migrations/20260408130000_create_resume_templates.sql` 中创建 `public.resume_templates`，至少包含：

- `id bigint generated by default as identity primary key`
- `template_id uuid not null default gen_random_uuid()`
- `user_id uuid not null default auth.uid()`
- `family_id text not null`
- `based_on_template_id text null`
- `name text not null`
- `description text null`
- `visibility text not null default 'private'`
- `status text not null default 'active'`
- `manifest jsonb not null`
- `created_at` / `updated_at`

同时补充：

- `template_id` 唯一索引
- `user_id` 与 `template_id` 查询索引
- `manifest` 是对象的 check
- `visibility` / `status` 的 check
- `updated_at` trigger

- [x] **步骤 2：实现 Supabase 模板仓库层**

在 `src/lib/supabase/template/index.ts` 中新增最小仓库 API：

- `listUserTemplates()`
- `getUserTemplateById(templateId)`
- `createUserTemplate(input)`
- `updateUserTemplate(templateId, patch)`
- `publishUserTemplate(templateId)`
- `archiveUserTemplate(templateId)`

要求：

- 复用 `getCurrentUser()`
- 只允许操作当前用户自己的模板
- 返回值统一映射为 `TemplateRecord`

- [x] **步骤 3：为保存和列表页补充 record 映射工具**

把数据库字段到 `TemplateRecord` 的转换收在仓库层内部，不要让页面组件直接处理 Supabase 原始行结构。

至少抽出：

- `mapRowToTemplateRecord`
- `mapTemplateRecordToInsertPayload`
- `mapTemplateRecordToUpdatePayload`

- [x] **步骤 4：运行第二轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/supabase/template/index.ts src/lib/resume-template/schema.ts
pnpm exec tsc --noEmit
```

预期：前端代码通过；migration 文件作为 SQL 资产纳入版本控制，不要求在本步骤自动推送到远端数据库。

执行记录：已新增 `supabase/migrations/20260408130000_create_resume_templates.sql` 与 `src/lib/supabase/template/index.ts`，包含模板表结构、索引、更新时间 trigger，以及 `list/get/create/update/publish/archive` 仓库接口与 row/record 映射工具。执行 `pnpm exec eslint src/lib/supabase/template/index.ts src/lib/resume-template/schema.ts` 与 `pnpm exec tsc --noEmit`，结果均通过；migration 仅写入仓库，尚未应用到远端数据库。

### 任务 3：建立模板工作台页面状态与预览数据装载

**文件：**

- 新建：`src/store/template/editor.ts`
- 新建：`src/pages/template/data/demo-resume.ts`
- 新建：`src/pages/template/hooks/use-template-workbench.ts`
- 新建：`src/pages/template/hooks/use-template-preview-resume.ts`
- 修改：`src/pages/template/index.tsx`

- [x] **步骤 1：新增模板编辑器 store**

在 `src/store/template/editor.ts` 中建立独立 Zustand store，至少包含：

- `templateId`
- `manifestDraft`
- `selectedSectionId`
- `previewResumeId`
- `dirty`
- `saving`
- `publishIntent`

并补充最小 action：

- `hydrateDraft`
- `setSelectedSection`
- `applyManifest`
- `setPreviewResumeId`
- `setPublishIntent`
- `markSaving`
- `resetEditor`

要求：不要把这部分状态塞进 `useResumeStore`。

- [x] **步骤 2：建立模板工作台数据装载 hook**

在 `src/pages/template/hooks/use-template-workbench.ts` 中统一处理：

- 加载官方模板目录
- 加载用户模板列表
- 读取和写入 URL 搜索参数
- 决定当前处于 `library` 还是 `editor` 模式

建议的搜索参数：

- `mode=library | editor`
- `templateId=<uuid>`
- `source=official | user`

要求：第二阶段只用 `src/pages/template/index.tsx` 这一个路由页，不引入新的动态路由文件。

- [x] **步骤 3：建立预览 resume 选择和 demo 降级**

在 `src/pages/template/data/demo-resume.ts` 中准备一份最小但完整的 demo resume。

在 `src/pages/template/hooks/use-template-preview-resume.ts` 中实现：

- 优先使用当前简历或最近一份简历
- 用户没有简历时回退到 demo resume
- 输出统一的 `TemplateResumeData`

- [x] **步骤 4：把模板页从占位状态切换成工作台根页**

修改 `src/pages/template/index.tsx`：

- 接入 `useTemplateWorkbench`
- 在 `library` 模式渲染模板列表
- 在 `editor` 模式渲染模板编辑器壳
- 保留加载态和错误态

- [x] **步骤 5：运行第三轮静态校验**

运行：

```bash
pnpm exec eslint src/store/template/editor.ts src/pages/template/data/demo-resume.ts src/pages/template/hooks/use-template-workbench.ts src/pages/template/hooks/use-template-preview-resume.ts src/pages/template/index.tsx
pnpm exec tsc --noEmit
```

预期：类型通过，模板工作台根页可编译。

执行记录：已新增 `src/store/template/editor.ts`、`src/pages/template/data/demo-resume.ts`、`src/pages/template/hooks/use-template-workbench.ts`、`src/pages/template/hooks/use-template-preview-resume.ts`，并把 `src/pages/template/index.tsx` 从占位页切成工作台根页，支持官方模板/个人模板列表模式与 editor 模式下的草稿 hydrate。执行 `pnpm exec eslint src/store/template/editor.ts src/pages/template/data/demo-resume.ts src/pages/template/hooks/use-template-workbench.ts src/pages/template/hooks/use-template-preview-resume.ts src/pages/template/index.tsx` 与 `pnpm exec tsc --noEmit`，结果均通过。

### 任务 4：实现模板工作台列表视图

**文件：**

- 新建：`src/pages/template/components/workbench/TemplateWorkbench.tsx`
- 新建：`src/pages/template/components/workbench/OfficialTemplateSection.tsx`
- 新建：`src/pages/template/components/workbench/UserTemplateSection.tsx`
- 新建：`src/pages/template/components/workbench/TemplateCard.tsx`
- 修改：`src/pages/template/index.tsx`

- [x] **步骤 1：实现模板工作台列表骨架**

在 `TemplateWorkbench.tsx` 中使用现有 shadcn 组件直接组合：

- `Tabs`
- `Card`
- `Badge`
- `Button`
- `ScrollArea`（若项目已有）

列表页至少要分出：

- 官方模板
- 我的模板

不要再写自定义 tabs/toggle 组件。

- [x] **步骤 2：实现官方模板区**

在 `OfficialTemplateSection.tsx` 中渲染官方目录卡片，并为每张卡提供：

- 模板名称
- 简短描述
- family 标识
- “基于此模板创建”按钮
- 可选的“预览”按钮

- [x] **步骤 3：实现我的模板区**

在 `UserTemplateSection.tsx` 中渲染用户模板列表，并展示：

- 模板名称
- 更新时间
- 私有 / 已发布状态
- 编辑入口
- 空态文案

- [x] **步骤 4：把列表页动作接到工作台模式切换**

确保从官方模板创建时：

- 先生成草稿 manifest
- 再把页面切到 `editor` 模式

确保点击“编辑我的模板”时：

- 加载数据库中的 `TemplateRecord`
- hydrate 到 editor store
- 再进入 `editor` 模式

- [x] **步骤 5：运行第四轮静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/components/workbench/TemplateWorkbench.tsx src/pages/template/components/workbench/OfficialTemplateSection.tsx src/pages/template/components/workbench/UserTemplateSection.tsx src/pages/template/components/workbench/TemplateCard.tsx src/pages/template/index.tsx
pnpm exec tsc --noEmit
```

预期：列表页相关组件通过。

执行记录：已新增 `TemplateWorkbench`、`OfficialTemplateSection`、`UserTemplateSection`、`TemplateCard`，并把 `/template` 列表模式切到 shadcn `Tabs` 驱动的工作台视图，动作已经接到官方模板创建与个人模板编辑模式切换。执行 `pnpm exec eslint src/lib/resume-template/editor/appearance.ts src/pages/template/components/workbench/TemplateWorkbench.tsx src/pages/template/components/workbench/OfficialTemplateSection.tsx src/pages/template/components/workbench/UserTemplateSection.tsx src/pages/template/components/workbench/TemplateCard.tsx src/pages/template/index.tsx` 与 `pnpm exec tsc --noEmit`，结果通过。

### 任务 5：实现模板编辑器三栏界面

**文件：**

- 新建：`src/pages/template/components/editor/TemplateEditorShell.tsx`
- 新建：`src/pages/template/components/editor/TemplateEditorToolbar.tsx`
- 新建：`src/pages/template/components/editor/TemplateStructurePanel.tsx`
- 新建：`src/pages/template/components/editor/TemplateSectionPalette.tsx`
- 新建：`src/pages/template/components/editor/TemplateCanvas.tsx`
- 新建：`src/pages/template/components/editor/TemplatePropertiesPanel.tsx`
- 新建：`src/pages/template/components/editor/TemplateAppearanceSettings.tsx`
- 新建：`src/pages/template/components/editor/TemplateSectionSettings.tsx`
- 新建：`src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx`
- 新建：`src/pages/template/components/editor/const.ts`
- 新建：`src/lib/resume-template/editor/appearance.ts`
- 修改：`src/pages/template/index.tsx`

- [x] **步骤 1：搭好编辑器三栏壳与顶栏动作位**

在 `TemplateEditorShell.tsx` 中实现：

- 左栏结构面板容器
- 中栏预览画布容器
- 右栏属性面板容器
- 顶部工具条插槽

在 `TemplateEditorToolbar.tsx` 中先放出：

- 返回列表
- 保存
- 另存为
- 恢复默认
- 发布切换

- [x] **步骤 2：实现左栏结构面板与 section 拖拽**

在 `TemplateStructurePanel.tsx` 中使用 `@hello-pangea/dnd`，参考 tracker 看板的实现方式，完成：

- main / sidebar 两个 droppable 区域
- section 排序
- section 跨区域移动
- 选中 section
- visible 状态切换

不要复用 `src/contexts/DragContext.tsx` 和 `src/components/DraggableList.tsx`。

- [x] **步骤 3：实现中栏实时预览画布**

在 `TemplateCanvas.tsx` 中：

- 读取 editor store 中的 `manifestDraft`
- 读取 `use-template-preview-resume.ts` 提供的 `TemplateResumeData`
- 直接渲染 `ResumeTemplateRuntime`
- 外层继续接 `PagedResumeShell`

要求：中栏不允许复制任何 renderer 逻辑。

- [x] **步骤 4：实现右栏属性面板**

在 `TemplatePropertiesPanel.tsx` 中按选中对象切换：

- 选中模板整体时，渲染 `TemplateAppearanceSettings`
- 选中 section 时，渲染 `TemplateSectionSettings`

`TemplateAppearanceSettings.tsx` 至少覆盖：

- skeleton
- header variant
- density
- color/font/spacing/radius preset
- 模板名称与描述

`TemplateSectionSettings.tsx` 至少覆盖：

- region
- variant
- visible
- 是否可删除 / 是否锁定的只读反馈

- [x] **步骤 5：实现预览 resume 切换控件**

在 `TemplatePreviewResumeSelect.tsx` 中提供最小切换 UI：

- 当前简历
- 最近简历
- demo 简历

要求：切换 preview 数据只影响画布，不改模板草稿。

- [x] **步骤 6：运行第五轮静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/components/editor/TemplateEditorShell.tsx src/pages/template/components/editor/TemplateEditorToolbar.tsx src/pages/template/components/editor/TemplateStructurePanel.tsx src/pages/template/components/editor/TemplateSectionPalette.tsx src/pages/template/components/editor/TemplateCanvas.tsx src/pages/template/components/editor/TemplatePropertiesPanel.tsx src/pages/template/components/editor/TemplateAppearanceSettings.tsx src/pages/template/components/editor/TemplateSectionSettings.tsx src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx src/pages/template/index.tsx
pnpm exec tsc --noEmit
```

预期：三栏编辑器能编译通过。

执行记录：已新增三栏编辑器壳、工具条、结构拖拽面板、模块库、预览画布、属性面板、模板整体/模块属性设置和预览简历选择器；中栏预览继续直接走 `ResumeTemplateRuntime`，并新增 manifest token/layout 到 appearance 的映射层。执行 `pnpm exec eslint src/lib/resume-template/editor/appearance.ts src/pages/template/components/workbench/TemplateWorkbench.tsx src/pages/template/components/workbench/OfficialTemplateSection.tsx src/pages/template/components/workbench/UserTemplateSection.tsx src/pages/template/components/workbench/TemplateCard.tsx src/pages/template/components/editor/TemplateEditorShell.tsx src/pages/template/components/editor/TemplateEditorToolbar.tsx src/pages/template/components/editor/TemplateStructurePanel.tsx src/pages/template/components/editor/TemplateSectionPalette.tsx src/pages/template/components/editor/TemplateCanvas.tsx src/pages/template/components/editor/TemplatePropertiesPanel.tsx src/pages/template/components/editor/TemplateAppearanceSettings.tsx src/pages/template/components/editor/TemplateSectionSettings.tsx src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx src/pages/template/components/editor/const.ts src/pages/template/index.tsx` 与 `pnpm exec tsc --noEmit`，结果通过。

### 任务 6：打通保存、另存为、发布与离开拦截

**文件：**

- 修改：`src/lib/supabase/template/index.ts`
- 修改：`src/store/template/editor.ts`
- 修改：`src/pages/template/components/editor/TemplateEditorToolbar.tsx`
- 修改：`src/pages/template/index.tsx`

- [x] **步骤 1：实现“保存当前模板”**

保存逻辑要求：

- 如果 `templateId` 存在，走 `updateUserTemplate`
- 如果不存在，走 `createUserTemplate`
- 保存前必须调用 `validateTemplateForSave`
- 保存成功后回写 store 中的 `templateId`、`dirty = false`

- [x] **步骤 2：实现“另存为个人模板”**

另存为要求：

- 基于当前草稿创建新的 user template
- 不能覆盖原模板
- 默认 `visibility = private`
- 保存后工作台列表能刷新出新卡片

- [x] **步骤 3：实现“发布模板”与发布前校验**

发布逻辑要求：

- 先执行 `validateTemplateForPublish`
- 失败时展示阻断原因，不切换发布状态
- 成功时把模板切到 `published`
- 已发布模板仍可回退为私有

- [x] **步骤 4：补离开拦截与脏状态提示**

至少覆盖：

- 从编辑器返回列表时 dirty 提示
- 切换模板时 dirty 提示
- 页面刷新 / 关闭标签页时的基本离开提醒

- [x] **步骤 5：运行第六轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/supabase/template/index.ts src/store/template/editor.ts src/pages/template/components/editor/TemplateEditorToolbar.tsx src/pages/template/index.tsx
pnpm exec tsc --noEmit
```

预期：保存与发布流程相关代码通过类型和 lint。

执行记录：已在 `src/pages/template/index.tsx` 打通保存、另存为、发布/取消发布、返回列表拦截与 `beforeunload` 离开提醒；`src/store/template/editor.ts` 负责 `templateId` / `dirty` / `saving` / `publishIntent` 的状态回写，`src/pages/template/components/editor/TemplateEditorToolbar.tsx` 接入保存、另存为、恢复默认和可见性切换。执行 `pnpm exec eslint src/lib/supabase/template/index.ts src/store/template/editor.ts src/pages/template/components/editor/TemplateEditorToolbar.tsx src/pages/template/index.tsx` 与 `pnpm exec tsc --noEmit`，结果均通过。

### 任务 7：收尾验证与兼容边界确认

**文件：**

- 修改：`docs/superpowers/plans/2026-04-08-resume-template-editor.md`

- [x] **步骤 1：运行模板系统相关 lint**

运行：

```bash
pnpm exec eslint src/lib/resume-template src/lib/supabase/template src/store/template src/pages/template src/components/resume/runtime
```

预期：模板编辑器相关改动全部通过 lint。

- [x] **步骤 2：运行全量类型检查**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：PASS。

- [x] **步骤 3：运行生产构建**

运行：

```bash
pnpm build
```

预期：PASS。

- [ ] **步骤 4：执行手动冒烟**

至少验证以下路径：

1. 打开 `/template` 能看到官方模板与“我的模板”
2. 从官方模板创建个人模板后能进入编辑器
3. 调整 section 顺序、显隐、region 后中栏预览立即变化
4. 调整 skeleton / header / token preset 后预览立即变化
5. 保存后刷新页面，模板仍能重新打开
6. 发布校验失败时会阻断并提示原因
7. 发布成功后列表状态从私有切换为已发布

如果浏览器自动化受限，必须记录阻塞点和替代检查方式。

- [x] **步骤 5：回填执行记录并收尾**

要求：

- 把已完成步骤改成 `- [x]`
- 在验证步骤后面追加真实的 `执行记录：...`
- 若 migration 未实际应用到数据库，要在本计划中明确标注
- 不要执行 `git push`

执行记录（步骤 1）：执行 `pnpm exec eslint src/lib/resume-template src/lib/supabase/template src/store/template src/pages/template src/components/resume/runtime`，结果通过。

执行记录（步骤 2）：执行 `pnpm exec tsc --noEmit`，结果通过。

执行记录（步骤 3）：执行 `pnpm build`，结果通过；Vite 输出了部分大 chunk 警告，但未阻塞构建成功。

执行记录（步骤 4）：未完成完整浏览器交互冒烟。原因有两点：一是用户明确要求“不使用 Playwright”；二是当前环境缺少系统级 Chrome，无法补充浏览器自动化。替代检查方式为本地 `vite preview` + `curl -I` 路由可达性验证，`http://127.0.0.1:4173/template` 与 `http://127.0.0.1:4173/template?mode=editor&source=official&templateId=default` 均返回 `HTTP/1.1 200 OK`。如需完整 UI 冒烟，需要用户手动点测或提供可用浏览器环境。

执行记录（步骤 5）：本计划已回填任务 1-7 的真实执行状态；`supabase/migrations/20260408130000_create_resume_templates.sql` 仅写入仓库，尚未应用到远端数据库；未执行任何 `git push`。

## 完成标准

满足以下条件后，第二阶段才能视为完成：

- `/template` 不再是占位页，而是可用的模板工作台
- 用户可以基于官方模板创建个人模板
- 模板编辑器所有改动都只落到 `TemplateManifest`
- 模板编辑器中栏继续只通过 `ResumeTemplateRuntime` 渲染
- 用户可以保存个人模板，默认私有
- 用户可以显式发布模板，且发布前有校验拦截
- `pnpm exec eslint ...`、`pnpm exec tsc --noEmit`、`pnpm build` 均通过
- `/template` 关键路径手动冒烟通过，或已在计划中记录清楚阻塞原因

## 延后到下一阶段的事项

以下内容明确不在本计划内：

- 模板市场首页
- 模板推荐、搜索、排序
- 模板审核后台
- 模板分享页和公开广场
- 模板销售和版权体系
- 用户自定义 renderer
- 自由画布式排版
